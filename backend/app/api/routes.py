import logging
from datetime import datetime, date, timedelta, timezone
from typing import Optional
from fastapi import APIRouter, Query, HTTPException

from app.services.elexon_service import elexon_service
from app.services.analytics_service import analytics_service
from app.schemas.forecast import (
    ForecastResponse,
    AnalyticsSummaryResponse,
    SettlementProfileResponse,
    ErrorDistributionResponse,
    RampAnalysisResponse,
    HistoricalAccuracyResponse,
    WindDataPoint,
)

logger = logging.getLogger("api_routes")
router = APIRouter(prefix="/api", tags=["WindScope"])


def parse_date_param(d_str: Optional[str], default_date: date) -> date:
    if not d_str:
        return default_date
    try:
        return datetime.strptime(d_str, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid date format '{d_str}'. Expected YYYY-MM-DD.")


@router.get("/health")
async def health_check():
    """Health check endpoint for Vercel, Docker, and monitoring probes."""
    return {
        "status": "healthy",
        "service": "WindScope API",
        "version": "1.0.0",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "market": "GB Electricity Balancing Mechanism (Elexon)",
    }


@router.get("/forecast/latest", response_model=ForecastResponse)
async def get_latest_forecast(days: int = Query(2, ge=1, le=7, description="Number of days to retrieve")):
    """
    Returns latest Day-Ahead and Intraday wind generation forecasts and actuals.
    """
    today = datetime.now(timezone.utc).date()
    from_date = today - timedelta(days=1)
    to_date = today + timedelta(days=days - 1)

    forecasts = await elexon_service.fetch_wind_forecast(from_date, to_date)
    actuals = await elexon_service.fetch_actual_generation(from_date, to_date)

    df = analytics_service.merge_and_align_data(forecasts, actuals)
    metrics = analytics_service.calculate_summary_metrics(df)

    # Convert DataFrame rows to WindDataPoint list
    points = []
    for _, row in df.iterrows():
        points.append(WindDataPoint(
            timestamp=row["timestamp"].to_pydatetime(),
            settlementPeriod=int(row["settlementPeriod"]),
            forecastMW=round(float(row["forecastMW"]), 2),
            actualMW=round(float(row["actualMW"]), 2) if not pd_isna(row.get("actualMW")) else None,
            errorMW=round(float(row["errorMW"]), 2) if not pd_isna(row.get("errorMW")) else None,
            absoluteErrorMW=round(float(row["absoluteErrorMW"]), 2) if not pd_isna(row.get("absoluteErrorMW")) else None,
            percentageError=round(float(row["percentageError"]), 2) if not pd_isna(row.get("percentageError")) else None,
            offshoreActualMW=round(float(row["offshoreActualMW"]), 2) if not pd_isna(row.get("offshoreActualMW")) else None,
            onshoreActualMW=round(float(row["onshoreActualMW"]), 2) if not pd_isna(row.get("onshoreActualMW")) else None,
            status=row.get("status")
        ))

    return ForecastResponse(
        status="success",
        source="Elexon BMRS API v1 / WindScope Analytics",
        startDate=from_date.isoformat(),
        endDate=to_date.isoformat(),
        dataCount=len(points),
        data=points,
        metrics=metrics,
    )


@router.get("/forecast/range", response_model=ForecastResponse)
async def get_forecast_range(
    start_date: Optional[str] = Query(None, description="Start date YYYY-MM-DD"),
    end_date: Optional[str] = Query(None, description="End date YYYY-MM-DD"),
):
    """
    Returns wind forecast and historical actual data for a custom date range.
    """
    today = datetime.now(timezone.utc).date()
    from_d = parse_date_param(start_date, today - timedelta(days=3))
    to_d = parse_date_param(end_date, today)

    if from_d > to_d:
        raise HTTPException(status_code=400, detail="start_date must be on or before end_date")

    forecasts = await elexon_service.fetch_wind_forecast(from_d, to_d)
    actuals = await elexon_service.fetch_actual_generation(from_d, to_d)

    df = analytics_service.merge_and_align_data(forecasts, actuals)
    metrics = analytics_service.calculate_summary_metrics(df)

    points = []
    for _, row in df.iterrows():
        points.append(WindDataPoint(
            timestamp=row["timestamp"].to_pydatetime(),
            settlementPeriod=int(row["settlementPeriod"]),
            forecastMW=round(float(row["forecastMW"]), 2),
            actualMW=round(float(row["actualMW"]), 2) if not pd_isna(row.get("actualMW")) else None,
            errorMW=round(float(row["errorMW"]), 2) if not pd_isna(row.get("errorMW")) else None,
            absoluteErrorMW=round(float(row["absoluteErrorMW"]), 2) if not pd_isna(row.get("absoluteErrorMW")) else None,
            percentageError=round(float(row["percentageError"]), 2) if not pd_isna(row.get("percentageError")) else None,
            offshoreActualMW=round(float(row["offshoreActualMW"]), 2) if not pd_isna(row.get("offshoreActualMW")) else None,
            onshoreActualMW=round(float(row["onshoreActualMW"]), 2) if not pd_isna(row.get("onshoreActualMW")) else None,
            status=row.get("status")
        ))

    return ForecastResponse(
        status="success",
        source="Elexon BMRS API v1 / WindScope Analytics",
        startDate=from_d.isoformat(),
        endDate=to_d.isoformat(),
        dataCount=len(points),
        data=points,
        metrics=metrics,
    )


@router.get("/analytics/summary", response_model=AnalyticsSummaryResponse)
async def get_analytics_summary(
    start_date: Optional[str] = Query(None, description="Start date YYYY-MM-DD"),
    end_date: Optional[str] = Query(None, description="End date YYYY-MM-DD"),
):
    """
    Returns quantitative summary metrics (MAE, RMSE, MAPE, Bias, Reliability Score, Financial Imbalance).
    """
    today = datetime.now(timezone.utc).date()
    from_d = parse_date_param(start_date, today - timedelta(days=3))
    to_d = parse_date_param(end_date, today)

    forecasts = await elexon_service.fetch_wind_forecast(from_d, to_d)
    actuals = await elexon_service.fetch_actual_generation(from_d, to_d)

    df = analytics_service.merge_and_align_data(forecasts, actuals)
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
):
    """
    Returns average forecast, actual, and error patterns across all 48 settlement periods.
    """
    today = datetime.now(timezone.utc).date()
    from_d = parse_date_param(start_date, today - timedelta(days=7))
    to_d = parse_date_param(end_date, today)

    forecasts = await elexon_service.fetch_wind_forecast(from_d, to_d)
    actuals = await elexon_service.fetch_actual_generation(from_d, to_d)

    df = analytics_service.merge_and_align_data(forecasts, actuals)
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
):
    """
    Returns error histogram bins, quantiles (p10, p50, p90), and skewness.
    """
    today = datetime.now(timezone.utc).date()
    from_d = parse_date_param(start_date, today - timedelta(days=7))
    to_d = parse_date_param(end_date, today)

    forecasts = await elexon_service.fetch_wind_forecast(from_d, to_d)
    actuals = await elexon_service.fetch_actual_generation(from_d, to_d)

    df = analytics_service.merge_and_align_data(forecasts, actuals)
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


@router.get("/analytics/ramps", response_model=RampAnalysisResponse)
async def get_ramp_analysis(
    start_date: Optional[str] = Query(None, description="Start date YYYY-MM-DD"),
    end_date: Optional[str] = Query(None, description="End date YYYY-MM-DD"),
    threshold: float = Query(1200.0, description="Ramp threshold in MW/hour"),
):
    """
    Identifies high-ramp periods (> threshold MW/hr) and highlights forecast vs actual ramp mismatches.
    """
    today = datetime.now(timezone.utc).date()
    from_d = parse_date_param(start_date, today - timedelta(days=3))
    to_d = parse_date_param(end_date, today + timedelta(days=1))

    forecasts = await elexon_service.fetch_wind_forecast(from_d, to_d)
    actuals = await elexon_service.fetch_actual_generation(from_d, to_d)

    df = analytics_service.merge_and_align_data(forecasts, actuals)
    events = analytics_service.detect_ramp_events(df, threshold_mw_per_hour=threshold)

    return RampAnalysisResponse(
        status="success",
        thresholdMWPerHour=threshold,
        events=events,
        totalRampAlerts=len(events),
    )


@router.get("/analytics/daily-accuracy", response_model=HistoricalAccuracyResponse)
async def get_daily_accuracy(
    start_date: Optional[str] = Query(None, description="Start date YYYY-MM-DD"),
    end_date: Optional[str] = Query(None, description="End date YYYY-MM-DD"),
):
    """
    Returns day-by-day historical accuracy metrics table and overall aggregated KPIs.
    """
    today = datetime.now(timezone.utc).date()
    from_d = parse_date_param(start_date, today - timedelta(days=7))
    to_d = parse_date_param(end_date, today)

    forecasts = await elexon_service.fetch_wind_forecast(from_d, to_d)
    actuals = await elexon_service.fetch_actual_generation(from_d, to_d)

    df = analytics_service.merge_and_align_data(forecasts, actuals)
    days = analytics_service.calculate_daily_accuracy(df)
    overall_metrics = analytics_service.calculate_summary_metrics(df)

    return HistoricalAccuracyResponse(
        status="success",
        days=days,
        overallMetrics=overall_metrics,
    )


def pd_isna(val) -> bool:
    import pandas as pd
    return bool(pd.isna(val)) if val is not None else True
