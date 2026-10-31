import logging
from datetime import datetime, date, timezone
from typing import Dict, List, Optional, Tuple, Any
import numpy as np
import pandas as pd

from app.schemas.forecast import (
    WindDataPoint,
    SummaryMetrics,
    SettlementPeriodProfileItem,
    ErrorBin,
    RampEvent,
    DailyAccuracyItem,
)

logger = logging.getLogger("analytics_service")

# Average UK imbalance cashout penalty (£/MWh)
ESTIMATED_CASHOUT_PRICE_GBP = 68.50
NOMINAL_GB_WIND_CAPACITY_MW = 29500.0


class AnalyticsService:
    @staticmethod
    def merge_and_align_data(
        forecasts: List[Dict[str, Any]], 
        actuals: List[Dict[str, Any]]
    ) -> pd.DataFrame:
        """
        Merges forecast and actual generation feeds into an aligned Pandas DataFrame
        indexed on timestamp and settlement period.
        """
        if not forecasts:
            return pd.DataFrame(columns=[
                "timestamp", "settlementPeriod", "forecastMW", 
                "actualMW", "errorMW", "absoluteErrorMW", "percentageError",
                "offshoreActualMW", "onshoreActualMW", "status"
            ])

        df_fc = pd.DataFrame(forecasts)
        # Ensure timestamp is datetime with UTC
        df_fc["timestamp"] = pd.to_datetime(df_fc["timestamp"], utc=True)
        # Deduplicate on timestamp if multiple forecast publishes exist, keep latest
        df_fc = df_fc.sort_values(by=["timestamp"]).drop_duplicates(subset=["timestamp"], keep="last")

        if actuals:
            df_act = pd.DataFrame(actuals)
            df_act["timestamp"] = pd.to_datetime(df_act["timestamp"], utc=True)
            df_act = df_act.sort_values(by=["timestamp"]).drop_duplicates(subset=["timestamp"], keep="last")
            df = pd.merge(df_fc, df_act, on=["timestamp", "settlementPeriod"], how="left")
        else:
            df = df_fc.copy()
            df["actualMW"] = np.nan
            df["offshoreActualMW"] = np.nan
            df["onshoreActualMW"] = np.nan

        # Fill missing values and compute errors
        has_actual = ~df["actualMW"].isna()
        df["errorMW"] = np.where(has_actual, df["forecastMW"] - df["actualMW"], np.nan)
        df["absoluteErrorMW"] = np.where(has_actual, np.abs(df["errorMW"]), np.nan)
        
        # Percentage error guarded against zero division
        df["percentageError"] = np.where(
            has_actual & (df["actualMW"] > 10.0),
            (df["absoluteErrorMW"] / df["actualMW"]) * 100.0,
            np.nan
        )

        def classify_status(row):
            if pd.isna(row["actualMW"]):
                return "PENDING_ACTUAL"
            err = row["errorMW"]
            if err > 300:
                return "OVER_FORECAST"
            elif err < -300:
                return "UNDER_FORECAST"
            else:
                return "ON_TARGET"

        df["status"] = df.apply(classify_status, axis=1)
        return df

    @classmethod
    def calculate_summary_metrics(cls, df: pd.DataFrame) -> SummaryMetrics:
        """
        Calculates core procurement metrics: MAE, RMSE, MAPE, Bias, Reliability Score, and Financial Exposure.
        """
        if df.empty:
            return SummaryMetrics(
                totalForecastMWh=0.0,
                totalActualMWh=0.0,
                maeMW=0.0,
                rmseMW=0.0,
                mapePercent=0.0,
                meanBiasMW=0.0,
                nmaePercent=0.0,
                reliabilityScore=100.0,
                maxOverForecastMW=0.0,
                maxUnderForecastMW=0.0,
                rampRateAlertCount=0,
                estimatedImbalanceCostGbp=0.0,
                dataPointCount=0,
                accuracyGrade="A"
            )

        # 30-min settlement intervals convert to MWh by multiplying by 0.5
        total_fc_mwh = float(df["forecastMW"].sum() * 0.5)
        
        evaluated = df.dropna(subset=["actualMW", "errorMW"])
        n_points = len(evaluated)

        if n_points == 0:
            return SummaryMetrics(
                totalForecastMWh=round(total_fc_mwh, 2),
                totalActualMWh=0.0,
                maeMW=0.0,
                rmseMW=0.0,
                mapePercent=0.0,
                meanBiasMW=0.0,
                nmaePercent=0.0,
                reliabilityScore=100.0,
                maxOverForecastMW=0.0,
                maxUnderForecastMW=0.0,
                rampRateAlertCount=0,
                estimatedImbalanceCostGbp=0.0,
                dataPointCount=0,
                accuracyGrade="A"
            )

        total_act_mwh = float(evaluated["actualMW"].sum() * 0.5)
        mae = float(evaluated["absoluteErrorMW"].mean())
        rmse = float(np.sqrt((evaluated["errorMW"] ** 2).mean()))
        
        valid_mape = evaluated["percentageError"].dropna()
        mape = float(valid_mape.median()) if len(valid_mape) > 0 else 0.0
        bias = float(evaluated["errorMW"].mean())

        peak_capacity = max(float(evaluated["actualMW"].max()), NOMINAL_GB_WIND_CAPACITY_MW * 0.6)
        nmae = (mae / peak_capacity) * 100.0

        max_over = float(evaluated["errorMW"].max())
        min_error = float(evaluated["errorMW"].min())
        max_under = abs(min_error) if min_error < 0 else 0.0

        # Procurement Reliability Score (0-100)
        # Deduct penalties for NMAE and Bias
        score = 100.0 - (nmae * 3.8) - (abs(bias) / peak_capacity * 40.0)
        score = max(5.0, min(99.0, score))

        if score >= 88.0:
            grade = "A"
        elif score >= 75.0:
            grade = "B"
        elif score >= 62.0:
            grade = "C"
        else:
            grade = "D"

        # Estimated Imbalance exposure (£): Energy volume error * half-hour (0.5) * cashout penalty
        imbalance_mwh = evaluated["absoluteErrorMW"].sum() * 0.5
        imbalance_cost = float(imbalance_mwh * ESTIMATED_CASHOUT_PRICE_GBP)

        # Detect extreme ramp events
        ramp_alerts = cls.detect_ramp_events(df)

        return SummaryMetrics(
            totalForecastMWh=round(total_fc_mwh, 2),
            totalActualMWh=round(total_act_mwh, 2),
            maeMW=round(mae, 2),
            rmseMW=round(rmse, 2),
            mapePercent=round(mape, 2),
            meanBiasMW=round(bias, 2),
            nmaePercent=round(nmae, 2),
            reliabilityScore=round(score, 1),
            maxOverForecastMW=round(max_over, 2),
            maxUnderForecastMW=round(max_under, 2),
            rampRateAlertCount=len(ramp_alerts),
            estimatedImbalanceCostGbp=round(imbalance_cost, 2),
            dataPointCount=n_points,
            accuracyGrade=grade
        )

    @staticmethod
    def calculate_settlement_period_profile(df: pd.DataFrame) -> List[SettlementPeriodProfileItem]:
        """
        Computes 48 settlement period diurnal profile across selected timeframe.
        """
        results = []
        if df.empty:
            return results

        evaluated = df.copy()
        
        for sp in range(1, 49):
            hours = (sp - 1) // 2
            minutes = "30" if (sp - 1) % 2 == 1 else "00"
            label = f"{hours:02d}:{minutes}"

            sp_data = evaluated[evaluated["settlementPeriod"] == sp]
            if sp_data.empty:
                continue

            avg_fc = float(sp_data["forecastMW"].mean()) if not sp_data["forecastMW"].isna().all() else 0.0
            avg_act = float(sp_data["actualMW"].mean()) if not sp_data["actualMW"].isna().all() else 0.0
            avg_err = float(sp_data["errorMW"].mean()) if not sp_data["errorMW"].isna().all() else 0.0
            avg_abs = float(sp_data["absoluteErrorMW"].mean()) if not sp_data["absoluteErrorMW"].isna().all() else 0.0

            results.append(SettlementPeriodProfileItem(
                settlementPeriod=sp,
                timeLabel=label,
                avgForecastMW=round(avg_fc, 2),
                avgActualMW=round(avg_act, 2),
                avgErrorMW=round(avg_err, 2),
                avgAbsErrorMW=round(avg_abs, 2),
                sampleCount=len(sp_data)
            ))

        return results

    @staticmethod
    def calculate_error_distribution(df: pd.DataFrame) -> Tuple[List[ErrorBin], float, float, float, float]:
        """
        Generates histogram bins, quantiles (p10, p50, p90), and skewness of forecast errors.
        """
        evaluated = df.dropna(subset=["errorMW"])
        if evaluated.empty:
            return [], 0.0, 0.0, 0.0, 0.0

        errors = evaluated["errorMW"].to_numpy()
        total_samples = len(errors)

        p10 = float(np.percentile(errors, 10))
        p50 = float(np.percentile(errors, 50))
        p90 = float(np.percentile(errors, 90))

        # Pearson skewness coefficient
        mean_err = np.mean(errors)
        std_err = np.std(errors)
        skewness = float(((errors - mean_err) ** 3).mean() / (std_err ** 3)) if std_err > 0 else 0.0

        # Define bins for wind errors in MW
        bins_def = [
            ("< -2000 MW", -float("inf"), -2000.0),
            ("-2000 to -1000 MW", -2000.0, -1000.0),
            ("-1000 to -500 MW", -1000.0, -500.0),
            ("-500 to 0 MW", -500.0, 0.0),
            ("0 to 500 MW", 0.0, 500.0),
            ("500 to 1000 MW", 500.0, 1000.0),
            ("1000 to 2000 MW", 1000.0, 2000.0),
            ("> 2000 MW", 2000.0, float("inf")),
        ]

        bins = []
        for label, low, high in bins_def:
            if low == -float("inf"):
                count = int(np.sum(errors < high))
            elif high == float("inf"):
                count = int(np.sum(errors >= low))
            else:
                count = int(np.sum((errors >= low) & (errors < high)))

            pct = round((count / total_samples) * 100.0, 2)
            bins.append(ErrorBin(
                binRange=label,
                count=count,
                percentage=pct,
                minMW=float(low) if low != -float("inf") else -3000.0,
                maxMW=float(high) if high != float("inf") else 3000.0,
            ))

        return bins, round(p10, 2), round(p50, 2), round(p90, 2), round(skewness, 2)

    @staticmethod
    def detect_ramp_events(df: pd.DataFrame, threshold_mw_per_hour: float = 1200.0) -> List[RampEvent]:
        """
        Detects rapid generation change events (> threshold MW/hr) where forecast and actual ramp rate diverged.
        """
        if len(df) < 2:
            return []

        df_sorted = df.sort_values(by="timestamp").copy()
        
        # Calculate half-hourly delta (MW change per 30 mins, multiply by 2 for MW/hr equivalent)
        df_sorted["fcDelta"] = df_sorted["forecastMW"].diff() * 2.0
        
        if "actualMW" in df_sorted.columns and not df_sorted["actualMW"].isna().all():
            df_sorted["actDelta"] = df_sorted["actualMW"].diff() * 2.0
            df_sorted["rampMismatch"] = np.abs(df_sorted["fcDelta"] - df_sorted["actDelta"])
        else:
            df_sorted["actDelta"] = np.nan
            df_sorted["rampMismatch"] = 0.0

        events = []
        for idx, row in df_sorted.iterrows():
            fc_delta = row["fcDelta"]
            act_delta = row["actDelta"]
            mismatch = row["rampMismatch"]

            if pd.isna(fc_delta):
                continue

            max_delta = max(abs(fc_delta), abs(act_delta) if not pd.isna(act_delta) else 0.0)

            if max_delta >= threshold_mw_per_hour:
                if max_delta >= 2400.0:
                    sev = "CRITICAL"
                elif max_delta >= 1800.0:
                    sev = "HIGH"
                elif max_delta >= 1400.0:
                    sev = "MEDIUM"
                else:
                    sev = "LOW"

                events.append(RampEvent(
                    timestamp=row["timestamp"].to_pydatetime(),
                    settlementPeriod=int(row["settlementPeriod"]),
                    forecastDeltaMW=round(float(fc_delta), 2),
                    actualDeltaMW=round(float(act_delta), 2) if not pd.isna(act_delta) else 0.0,
                    rampMismatchMW=round(float(mismatch), 2) if not pd.isna(mismatch) else 0.0,
                    severity=sev
                ))

        return events

    @classmethod
    def calculate_daily_accuracy(cls, df: pd.DataFrame) -> List[DailyAccuracyItem]:
        """
        Calculates daily summary metrics across a range of days for trend benchmarking.
        """
        if df.empty or "actualMW" not in df.columns:
            return []

        df_clean = df.dropna(subset=["actualMW", "errorMW"]).copy()
        if df_clean.empty:
            return []

        df_clean["dateStr"] = df_clean["timestamp"].dt.strftime("%Y-%m-%d")
        grouped = df_clean.groupby("dateStr")

        items = []
        for date_str, group in grouped:
            if len(group) < 12:  # require at least 6 hours of data
                continue
            metrics = cls.calculate_summary_metrics(group)
            peak_act = float(group["actualMW"].max())
            peak_fc = float(group["forecastMW"].max())

            items.append(DailyAccuracyItem(
                date=date_str,
                maeMW=metrics.maeMW,
                rmseMW=metrics.rmseMW,
                mapePercent=metrics.mapePercent,
                meanBiasMW=metrics.meanBiasMW,
                reliabilityScore=metrics.reliabilityScore,
                peakActualMW=round(peak_act, 2),
                peakForecastMW=round(peak_fc, 2),
                accuracyGrade=metrics.accuracyGrade,
            ))

        items.sort(key=lambda x: x.date, reverse=True)
        return items


analytics_service = AnalyticsService()
