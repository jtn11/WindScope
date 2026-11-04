import logging
from datetime import datetime, date, timedelta, timezone
from typing import Dict, List, Optional, Tuple, Any
import numpy as np
import pandas as pd

from app.schemas.forecast import (
    WindDataPoint,
    SummaryMetrics,
    SettlementPeriodProfileItem,
    ErrorBin,
    DailyAccuracyItem,
    ForecastPublishRun,
)
from app.utils.date_utils import parse_iso_datetime, get_settlement_period

logger = logging.getLogger("analytics_service")


class AnalyticsService:
    @staticmethod
    def get_available_publish_times(
        forecasts: List[Dict[str, Any]], 
        target_date: date
    ) -> List[str]:
        """
        Extracts all distinct WINDFOR publishTime values that forecast the target delivery date.
        """
        target_prefix = target_date.strftime("%Y-%m-%d")
        matching = [
            f["publishTime"] for f in forecasts 
            if f.get("startTime", "").startswith(target_prefix) and "publishTime" in f
        ]
        return sorted(list(set(matching)))

    @staticmethod
    def filter_forecast_at_cutoff(
        forecasts: List[Dict[str, Any]],
        target_date: date,
        decision_cutoff: str = "12:00",
        specific_publish_time: Optional[str] = None
    ) -> Tuple[List[Dict[str, Any]], Optional[str]]:
        """
        Filters WINDFOR forecasts to select the publication available at the purchasing decision cutoff.
        
        Standard Day-Ahead Market (DAP) Gate Closure is 12:00 on D-1.
        Elexon publishes WINDFOR on D-1 at ~02:30, 04:30, 07:30, 09:30, 11:30, 15:30, 18:30, 22:30.
        At the 12:00 D-1 cutoff, the 11:30 D-1 publish is selected.
        """
        target_prefix = target_date.strftime("%Y-%m-%d")
        day_forecasts = [f for f in forecasts if f.get("startTime", "").startswith(target_prefix)]

        if not day_forecasts:
            return [], None

        # If user explicitly chose a specific publishTime
        if specific_publish_time:
            matching = [f for f in day_forecasts if f.get("publishTime") == specific_publish_time]
            if matching:
                return matching, specific_publish_time

        # Calculate D-1 cutoff timestamp
        d_minus_1 = target_date - timedelta(days=1)
        cutoff_hour = 12
        cutoff_min = 0
        if ":" in decision_cutoff:
            try:
                parts = decision_cutoff.split(":")
                cutoff_hour = int(parts[0])
                cutoff_min = int(parts[1])
            except Exception:
                cutoff_hour = 12
                cutoff_min = 0

        cutoff_dt = datetime.combine(d_minus_1, datetime.min.time(), tzinfo=timezone.utc).replace(
            hour=cutoff_hour, minute=cutoff_min
        )
        cutoff_iso = cutoff_dt.strftime("%Y-%m-%dT%H:%M:%SZ")

        # Find all publishes on or before the cutoff
        available_publishes = sorted(list(set(f["publishTime"] for f in day_forecasts)))
        eligible_publishes = [p for p in available_publishes if p <= cutoff_iso]

        selected_publish = eligible_publishes[-1] if eligible_publishes else (available_publishes[0] if available_publishes else None)

        if not selected_publish:
            return [], None

        selected_forecasts = [f for f in day_forecasts if f.get("publishTime") == selected_publish]
        return selected_forecasts, selected_publish

    @staticmethod
    def match_actual_and_forecast_on_starttime(
        actuals: List[Dict[str, Any]],
        forecasts: List[Dict[str, Any]],
        selected_publish_time: Optional[str] = None
    ) -> pd.DataFrame:
        """
        Matches actual generation (FUELHH) and forecast records (WINDFOR) using startTime.
        Handles both exact half-hour matches and hourly forecast alignment across settlement periods.
        """
        if not actuals and not forecasts:
            return pd.DataFrame(columns=[
                "timestamp", "startTime", "settlementPeriod", "forecastMW",
                "actualMW", "errorMW", "absoluteErrorMW", "percentageError",
                "forecastPublishTime", "status"
            ])

        # Map forecasts by startTime
        fc_map: Dict[str, Dict[str, Any]] = {}
        for f in forecasts:
            st = f.get("startTime")
            if st:
                fc_map[st] = f

        rows = []
        if actuals:
            for act in actuals:
                st = act.get("startTime")
                sp = act.get("settlementPeriod", 1)
                act_mw = act.get("actualMW")

                # Match on startTime:
                # 1. Exact match (e.g. 00:00:00Z)
                # 2. Hourly block match for :30 periods (e.g. 00:30:00Z matches 00:00:00Z forecast)
                fc_entry = fc_map.get(st)
                if not fc_entry and st and len(st) >= 14:
                    hour_key = st[:14] + "00:00Z"
                    fc_entry = fc_map.get(hour_key)

                fc_mw = fc_entry.get("forecastMW") if fc_entry else None
                pub_time = fc_entry.get("publishTime", selected_publish_time) if fc_entry else selected_publish_time

                # Calculate errors if both are present
                err_mw = None
                abs_err = None
                pct_err = None
                status = "PENDING_ACTUAL"

                if fc_mw is not None and act_mw is not None:
                    err_mw = round(fc_mw - act_mw, 2)
                    abs_err = round(abs(err_mw), 2)
                    pct_err = round((abs_err / act_mw) * 100.0, 2) if act_mw > 10.0 else None
                    if err_mw > 300:
                        status = "OVER_FORECAST"
                    elif err_mw < -300:
                        status = "UNDER_FORECAST"
                    else:
                        status = "ON_TARGET"
                elif fc_mw is not None and act_mw is None:
                    status = "PENDING_ACTUAL"
                elif fc_mw is None and act_mw is not None:
                    status = "MISSING_FORECAST"

                dt = parse_iso_datetime(st) if st else datetime.now(timezone.utc)
                rows.append({
                    "timestamp": dt,
                    "startTime": st,
                    "settlementPeriod": sp,
                    "forecastMW": fc_mw,
                    "actualMW": act_mw,
                    "errorMW": err_mw,
                    "absoluteErrorMW": abs_err,
                    "percentageError": pct_err,
                    "forecastPublishTime": pub_time,
                    "status": status,
                })
        else:
            # If actuals are not yet available (e.g. delivery in future)
            for f in forecasts:
                st = f.get("startTime")
                fc_mw = f.get("forecastMW")
                dt = parse_iso_datetime(st) if st else datetime.now(timezone.utc)
                sp = get_settlement_period(dt)
                rows.append({
                    "timestamp": dt,
                    "startTime": st,
                    "settlementPeriod": sp,
                    "forecastMW": fc_mw,
                    "actualMW": None,
                    "errorMW": None,
                    "absoluteErrorMW": None,
                    "percentageError": None,
                    "forecastPublishTime": f.get("publishTime", selected_publish_time),
                    "status": "PENDING_ACTUAL",
                })

        df = pd.DataFrame(rows)
        if not df.empty and "startTime" in df.columns:
            df = df.sort_values(by=["startTime"])
        return df

    @classmethod
    def calculate_summary_metrics(cls, df: pd.DataFrame) -> SummaryMetrics:
        """
        Calculates MAE, RMSE, MAPE, Mean Bias Error from real aligned data.
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
                dataPointCount=0,
                accuracyGrade="A"
            )

        valid_fc = df["forecastMW"].dropna()
        total_fc_mwh = float(valid_fc.sum() * 0.5) if not valid_fc.empty else 0.0

        evaluated = df.dropna(subset=["actualMW", "forecastMW", "errorMW"])
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
                dataPointCount=0,
                accuracyGrade="A"
            )

        total_act_mwh = float(evaluated["actualMW"].sum() * 0.5)
        mae = float(evaluated["absoluteErrorMW"].mean())
        rmse = float(np.sqrt((evaluated["errorMW"] ** 2).mean()))

        valid_mape = evaluated["percentageError"].dropna()
        mape = float(valid_mape.median()) if len(valid_mape) > 0 else 0.0
        bias = float(evaluated["errorMW"].mean())

        peak_gen = max(float(evaluated["actualMW"].max()), 1000.0)
        nmae = (mae / peak_gen) * 100.0

        max_over = float(evaluated["errorMW"].max())
        min_err = float(evaluated["errorMW"].min())
        max_under = abs(min_err) if min_err < 0 else 0.0

        # Reliability score (0-100)
        score = 100.0 - (nmae * 2.8) - (abs(bias) / peak_gen * 25.0)
        score = max(5.0, min(99.0, score))

        if score >= 88.0:
            grade = "A"
        elif score >= 75.0:
            grade = "B"
        elif score >= 62.0:
            grade = "C"
        else:
            grade = "D"

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
            dataPointCount=n_points,
            accuracyGrade=grade
        )

    @staticmethod
    def calculate_settlement_period_profile(df: pd.DataFrame) -> List[SettlementPeriodProfileItem]:
        """
        Computes the 48-period diurnal error profile from real matched data.
        """
        results = []
        if df.empty or "settlementPeriod" not in df.columns:
            return results

        for sp in range(1, 49):
            hours = (sp - 1) // 2
            mins = "30" if (sp - 1) % 2 == 1 else "00"
            label = f"{hours:02d}:{mins}"

            sp_data = df[df["settlementPeriod"] == sp]
            if sp_data.empty:
                continue

            valid_fc = sp_data["forecastMW"].dropna()
            valid_act = sp_data["actualMW"].dropna()
            valid_err = sp_data["errorMW"].dropna()
            valid_abs = sp_data["absoluteErrorMW"].dropna()

            avg_fc = float(valid_fc.mean()) if not valid_fc.empty else 0.0
            avg_act = float(valid_act.mean()) if not valid_act.empty else 0.0
            avg_err = float(valid_err.mean()) if not valid_err.empty else 0.0
            avg_abs = float(valid_abs.mean()) if not valid_abs.empty else 0.0

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
        Computes real error histogram bins, P10, P50 (median bias), P90, and skewness.
        """
        evaluated = df.dropna(subset=["errorMW"])
        if evaluated.empty:
            return [], 0.0, 0.0, 0.0, 0.0

        errors = evaluated["errorMW"].to_numpy()
        total_samples = len(errors)

        p10 = float(np.percentile(errors, 10))
        p50 = float(np.percentile(errors, 50))
        p90 = float(np.percentile(errors, 90))

        mean_err = np.mean(errors)
        std_err = np.std(errors)
        skewness = float(((errors - mean_err) ** 3).mean() / (std_err ** 3)) if std_err > 0 else 0.0

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

    @classmethod
    def get_forecast_publication_history(
        cls,
        target_date: date,
        actuals: List[Dict[str, Any]],
        all_forecasts: List[Dict[str, Any]]
    ) -> List[ForecastPublishRun]:
        """
        Builds the forecast evolution history across all publication runs for target delivery date.
        """
        target_prefix = target_date.strftime("%Y-%m-%d")
        matching_fc = [f for f in all_forecasts if f.get("startTime", "").startswith(target_prefix)]
        
        publishes = sorted(list(set(f["publishTime"] for f in matching_fc)))
        runs = []

        d_minus_1 = target_date - timedelta(days=1)
        d_minus_1_str = d_minus_1.strftime("%Y-%m-%d")

        for pub in publishes:
            pts = [f for f in matching_fc if f.get("publishTime") == pub]
            df = cls.match_actual_and_forecast_on_starttime(actuals, pts, selected_publish_time=pub)
            metrics = cls.calculate_summary_metrics(df)

            # Determine human-friendly cutoff label
            time_part = pub[11:16] if len(pub) >= 16 else ""
            if pub.startswith(d_minus_1_str):
                if time_part <= "11:30":
                    label = f"Day-Ahead {time_part} D-1 (Gate Closure Basis)"
                else:
                    label = f"Intraday {time_part} D-1"
            elif pub.startswith(target_prefix):
                label = f"Intraday {time_part} (Delivery Day)"
            else:
                label = f"Published {pub}"

            runs.append(ForecastPublishRun(
                publishTime=pub,
                cutoffLabel=label,
                maeMW=metrics.maeMW if metrics.dataPointCount > 0 else None,
                rmseMW=metrics.rmseMW if metrics.dataPointCount > 0 else None,
                meanBiasMW=metrics.meanBiasMW if metrics.dataPointCount > 0 else None,
                data=[{"startTime": p["startTime"], "forecastMW": p["forecastMW"]} for p in pts]
            ))

        return runs


analytics_service = AnalyticsService()
