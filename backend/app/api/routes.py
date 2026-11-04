import logging
from datetime import datetime, date, timedelta, timezone
from typing import Optional, List
from fastapi import APIRouter, Query, HTTPException
import pandas as pd

from app.services.elexon_service import elexon_service
from app.services.analytics_service import analytics_service
from app.schemas.forecast import (
    ForecastResponse,
    AnalyticsSummaryResponse,
    SettlementProfileResponse,
    ErrorDistributionResponse,
    HistoricalAccuracyResponse,
    PublicationHistoryResponse,
    DailyAccuracyItem,
    WindDataPoint,
)

logger = logging.getLogger("api_routes")
router = APIRouter(prefix="/api", tags=["WindScope"])

# Default target delivery date in January 2026
DEFAULT_START_DATE = date(2026, 1, 1)
DEFAULT_END_DATE = date(2026, 1, 1)


def parse_date_param(d_str: Optional[str], default_date: date) -> date:
    if not d_str:
        return default_date
    try:
        return datetime.strptime(d_str, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid date format '{d_str}'. Expected YYYY-MM-DD.")


@router.get("/health")
async def health_check():
    """Health check endpoint confirming live Elexon BMRS connection."""
    return {
        "status": "healthy",
        "service": "WindScope Platform API",
        "version": "2.0.0",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "market": "GB Electricity Balancing Mechanism (Elexon BMRS)",
        "datasets": {
            "actuals": "FUELHH stream (fuelType=WIND)",
            "forecasts": "WINDFOR stream",
            "matchingKey": "startTime"
        }
    }


@router.get("/forecast/latest", response_model=ForecastResponse)
async def get_latest_forecast(
    days: int = Query(1, ge=1, le=31, description="Number of days from January 1, 2026"),
    cutoff: str = Query("12:00", description="Purchasing decision cutoff (e.g. 12:00 D-1)"),
    publish_time: Optional[str] = Query(None, description="Specific WINDFOR publishTime to evaluate")
):
    """
    Returns wind generation forecast and actuals for January 2026 based on decision cutoff.
    """
    from_d = DEFAULT_START_DATE
    to_d = from_d + timedelta(days=days - 1)
    return await _get_forecast_data(from_d, to_d, cutoff, publish_time)


@router.get("/forecast/range", response_model=ForecastResponse)
async def get_forecast_range(
    start_date: Optional[str] = Query(None, description="Start date YYYY-MM-DD (e.g. 2026-01-01)"),
    end_date: Optional[str] = Query(None, description="End date YYYY-MM-DD (e.g. 2026-01-07)"),
    cutoff: str = Query("12:00", description="Purchasing decision cutoff (e.g. 12:00 D-1)"),
    publish_time: Optional[str] = Query(None, description="Specific WINDFOR publishTime to evaluate")
):
    """
    Returns matched forecast vs actual generation for specified January 2026 dates.
    """
    from_d = parse_date_param(start_date, DEFAULT_START_DATE)
    to_d = parse_date_param(end_date, from_d)

    if from_d > to_d:
        raise HTTPException(status_code=400, detail="start_date must be on or before end_date")

    return await _get_forecast_data(from_d, to_d, cutoff, publish_time)


async def _get_forecast_data(
    from_d: date, 
    to_d: date, 
    cutoff: str, 
    publish_time: Optional[str]
) -> ForecastResponse:
    # 1. Fetch real FUELHH actuals for delivery dates
    actuals = await elexon_service.fetch_fuelhh_actuals(from_d, to_d)

    # 2. Fetch real WINDFOR forecasts published on D-1 and delivery window
    all_forecasts = await elexon_service.get_forecasts_for_delivery_dates(from_d, to_d)

    # Extract all distinct publish times available
    available_publishes = analytics_service.get_available_publish_times(all_forecasts, from_d)

    # 3. Filter forecast at decision cutoff
    selected_fc = []
    selected_pub = None

    curr_d = from_d
    while curr_d <= to_d:
        day_fc, pub = analytics_service.filter_forecast_at_cutoff(
            all_forecasts,
            target_date=curr_d,
            decision_cutoff=cutoff,
            specific_publish_time=publish_time
        )
        selected_fc.extend(day_fc)
        if not selected_pub:
            selected_pub = pub
        curr_d += timedelta(days=1)

    # 4. Correctly match actual and forecast records using startTime
    df = analytics_service.match_actual_and_forecast_on_starttime(
        actuals, 
        selected_fc, 
        selected_publish_time=selected_pub
    )
    metrics = analytics_service.calculate_summary_metrics(df)

    points = []
    for _, row in df.iterrows():
        points.append(WindDataPoint(
            timestamp=row["timestamp"].to_pydatetime() if hasattr(row["timestamp"], "to_pydatetime") else row["timestamp"],
            startTime=row["startTime"],
            settlementPeriod=int(row["settlementPeriod"]),
            forecastMW=round(float(row["forecastMW"]), 2) if row["forecastMW"] is not None and not pd.isna(row["forecastMW"]) else 0.0,
            actualMW=round(float(row["actualMW"]), 2) if row["actualMW"] is not None and not pd.isna(row["actualMW"]) else None,
            errorMW=round(float(row["errorMW"]), 2) if row["errorMW"] is not None and not pd.isna(row["errorMW"]) else None,
            absoluteErrorMW=round(float(row["absoluteErrorMW"]), 2) if row["absoluteErrorMW"] is not None and not pd.isna(row["absoluteErrorMW"]) else None,
            percentageError=round(float(row["percentageError"]), 2) if row["percentageError"] is not None and not pd.isna(row["percentageError"]) else None,
            forecastPublishTime=row.get("forecastPublishTime"),
            status=row.get("status")
        ))

    return ForecastResponse(
        status="success",
        source="Elexon BMRS (FUELHH stream & WINDFOR stream)",
        startDate=from_d.isoformat(),
        endDate=to_d.isoformat(),
        decisionCutoff=f"D-1 {cutoff}",
        selectedPublishTime=selected_pub,
        availablePublishTimes=available_publishes,
        dataCount=len(points),
        data=points,
        metrics=metrics,
    )


@router.get("/forecast/publication-history", response_model=PublicationHistoryResponse)
async def get_publication_history(
    target_date: Optional[str] = Query(None, description="Delivery date YYYY-MM-DD (e.g. 2026-01-01)")
):
    """
    Returns forecast evolution across all publication runs for the selected delivery date,
    including progressive MAE, RMSE, and bias metrics.
    """
    d = parse_date_param(target_date, DEFAULT_START_DATE)
    actuals = await elexon_service.fetch_fuelhh_actuals(d, d)
    forecasts = await elexon_service.get_forecasts_for_delivery_dates(d, d)

    runs = analytics_service.get_forecast_publication_history(d, actuals, forecasts)
    return PublicationHistoryResponse(
        status="success",
        targetDate=d.isoformat(),
        runs=runs
    )


@router.get("/analytics/summary", response_model=AnalyticsSummaryResponse)
async def get_analytics_summary(
    start_date: Optional[str] = Query(None, description="Start date YYYY-MM-DD"),
    end_date: Optional[str] = Query(None, description="End date YYYY-MM-DD"),
    cutoff: str = Query("12:00", description="Purchasing decision cutoff"),
    publish_time: Optional[str] = Query(None)
):
    """
    Returns real summary KPIs: MAE, RMSE, MAPE, Bias, Reliability Score.
    """
    from_d = parse_date_param(start_date, DEFAULT_START_DATE)
    to_d = parse_date_param(end_date, from_d)

    actuals = await elexon_service.fetch_fuelhh_actuals(from_d, to_d)
    all_forecasts = await elexon_service.get_forecasts_for_delivery_dates(from_d, to_d)

    selected_fc = []
    curr_d = from_d
    while curr_d <= to_d:
        day_fc, _ = analytics_service.filter_forecast_at_cutoff(
            all_forecasts, curr_d, decision_cutoff=cutoff, specific_publish_time=publish_time
        )
        selected_fc.extend(day_fc)
        curr_d += timedelta(days=1)

    df = analytics_service.match_actual_and_forecast_on_starttime(actuals, selected_fc)
    metrics = analytics_service.calculate_summary_metrics(df)

    return AnalyticsSummaryResponse(
        status="success",
        startDate=from_d.isoformat(),
        endDate=to_d.isoformat(),
        metrics=metrics,
    )


@router.get("/analytics/settlement-profile", response_model=SettlementProfileResponse)
async def get_settlement_period_profile(
    start_date: Optional[str] = Query(None, description="Start date YYYY-MM-DD"),
    end_date: Optional[str] = Query(None, description="End date YYYY-MM-DD"),
    cutoff: str = Query("12:00"),
    publish_time: Optional[str] = Query(None)
):
    """
    Returns real 48 settlement period diurnal error profile.
    """
    from_d = parse_date_param(start_date, DEFAULT_START_DATE)
    to_d = parse_date_param(end_date, from_d)

    actuals = await elexon_service.fetch_fuelhh_actuals(from_d, to_d)
    all_forecasts = await elexon_service.get_forecasts_for_delivery_dates(from_d, to_d)

    selected_fc = []
    curr_d = from_d
    while curr_d <= to_d:
        day_fc, _ = analytics_service.filter_forecast_at_cutoff(
            all_forecasts, curr_d, decision_cutoff=cutoff, specific_publish_time=publish_time
        )
        selected_fc.extend(day_fc)
        curr_d += timedelta(days=1)

    df = analytics_service.match_actual_and_forecast_on_starttime(actuals, selected_fc)
    periods = analytics_service.calculate_settlement_period_profile(df)

    return SettlementProfileResponse(
        status="success",
        startDate=from_d.isoformat(),
        endDate=to_d.isoformat(),
        periods=periods,
    )


@router.get("/analytics/error-distribution", response_model=ErrorDistributionResponse)
async def get_error_distribution(
    start_date: Optional[str] = Query(None, description="Start date YYYY-MM-DD"),
    end_date: Optional[str] = Query(None, description="End date YYYY-MM-DD"),
    cutoff: str = Query("12:00"),
    publish_time: Optional[str] = Query(None)
):
    """
    Returns real error histogram bins, quantiles (P10, P50, P90), and skewness.
    """
    from_d = parse_date_param(start_date, DEFAULT_START_DATE)
    to_d = parse_date_param(end_date, from_d)

    actuals = await elexon_service.fetch_fuelhh_actuals(from_d, to_d)
    all_forecasts = await elexon_service.get_forecasts_for_delivery_dates(from_d, to_d)

    selected_fc = []
    curr_d = from_d
    while curr_d <= to_d:
        day_fc, _ = analytics_service.filter_forecast_at_cutoff(
            all_forecasts, curr_d, decision_cutoff=cutoff, specific_publish_time=publish_time
        )
        selected_fc.extend(day_fc)
        curr_d += timedelta(days=1)

    df = analytics_service.match_actual_and_forecast_on_starttime(actuals, selected_fc)
    bins, p10, p50, p90, skew = analytics_service.calculate_error_distribution(df)
    evaluated = df.dropna(subset=["errorMW"])

    return ErrorDistributionResponse(
        status="success",
        startDate=from_d.isoformat(),
        endDate=to_d.isoformat(),
        totalSamples=len(evaluated),
        bins=bins,
        p10ErrorMW=p10,
        p50ErrorMW=p50,
        p90ErrorMW=p90,
        skewness=skew,
    )


@router.get("/analytics/daily-accuracy", response_model=HistoricalAccuracyResponse)
async def get_daily_accuracy(
    start_date: Optional[str] = Query("2026-01-01", description="Start date YYYY-MM-DD"),
    end_date: Optional[str] = Query("2026-01-31", description="End date YYYY-MM-DD"),
    cutoff: str = Query("12:00")
):
    """
    Calculates multi-day accuracy leaderboard for January 2026 using real Elexon data.
    """
    from_d = parse_date_param(start_date, date(2026, 1, 1))
    to_d = parse_date_param(end_date, date(2026, 1, 31))

    actuals = await elexon_service.fetch_fuelhh_actuals(from_d, to_d)
    all_forecasts = await elexon_service.get_forecasts_for_delivery_dates(from_d, to_d)

    days_list = []
    curr_d = from_d
    all_matched_dfs = []

    while curr_d <= to_d:
        day_str = curr_d.strftime("%Y-%m-%d")
        day_acts = [a for a in actuals if a.get("settlementDate") == day_str or a.get("startTime", "").startswith(day_str)]
        day_fc, pub = analytics_service.filter_forecast_at_cutoff(all_forecasts, curr_d, decision_cutoff=cutoff)

        if day_acts and day_fc:
            day_df = analytics_service.match_actual_and_forecast_on_starttime(day_acts, day_fc, selected_publish_time=pub)
            all_matched_dfs.append(day_df)
            m = analytics_service.calculate_summary_metrics(day_df)
            
            peak_act = float(day_df["actualMW"].dropna().max()) if not day_df["actualMW"].dropna().empty else 0.0
            peak_fc = float(day_df["forecastMW"].dropna().max()) if not day_df["forecastMW"].dropna().empty else 0.0

            days_list.append(DailyAccuracyItem(
                date=day_str,
                maeMW=m.maeMW,
                rmseMW=m.rmseMW,
                mapePercent=m.mapePercent,
                meanBiasMW=m.meanBiasMW,
                reliabilityScore=m.reliabilityScore,
                peakActualMW=round(peak_act, 2),
                peakForecastMW=round(peak_fc, 2),
                accuracyGrade=m.accuracyGrade,
            ))

        curr_d += timedelta(days=1)

    overall_df = pd.concat(all_matched_dfs, ignore_index=True) if all_matched_dfs else pd.DataFrame()
    overall_metrics = analytics_service.calculate_summary_metrics(overall_df)

    return HistoricalAccuracyResponse(
        status="success",
        days=days_list,
        overallMetrics=overall_metrics
    )
