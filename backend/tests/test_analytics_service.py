from datetime import datetime, timezone
import pandas as pd
import numpy as np
from app.services.analytics_service import analytics_service


def test_merge_and_align_data():
    forecasts = [
        {"timestamp": datetime(2024, 3, 1, 0, 0, tzinfo=timezone.utc), "settlementPeriod": 1, "forecastMW": 5000.0},
        {"timestamp": datetime(2024, 3, 1, 0, 30, tzinfo=timezone.utc), "settlementPeriod": 2, "forecastMW": 5200.0},
    ]
    actuals = [
        {"timestamp": datetime(2024, 3, 1, 0, 0, tzinfo=timezone.utc), "settlementPeriod": 1, "actualMW": 4800.0, "offshoreActualMW": 3000.0, "onshoreActualMW": 1800.0},
        {"timestamp": datetime(2024, 3, 1, 0, 30, tzinfo=timezone.utc), "settlementPeriod": 2, "actualMW": 5600.0, "offshoreActualMW": 3400.0, "onshoreActualMW": 2200.0},
    ]

    df = analytics_service.merge_and_align_data(forecasts, actuals)
    assert len(df) == 2
    assert "errorMW" in df.columns
    # Row 0: 5000 - 4800 = +200 MW (over-forecast)
    assert df.iloc[0]["errorMW"] == 200.0
    # Row 1: 5200 - 5600 = -400 MW (under-forecast)
    assert df.iloc[1]["errorMW"] == -400.0
    assert df.iloc[1]["status"] == "UNDER_FORECAST"


def test_calculate_summary_metrics():
    forecasts = [
        {"timestamp": datetime(2024, 3, 1, 0, 0, tzinfo=timezone.utc), "settlementPeriod": 1, "forecastMW": 5000.0},
        {"timestamp": datetime(2024, 3, 1, 0, 30, tzinfo=timezone.utc), "settlementPeriod": 2, "forecastMW": 5000.0},
    ]
    actuals = [
        {"timestamp": datetime(2024, 3, 1, 0, 0, tzinfo=timezone.utc), "settlementPeriod": 1, "actualMW": 4800.0},
        {"timestamp": datetime(2024, 3, 1, 0, 30, tzinfo=timezone.utc), "settlementPeriod": 2, "actualMW": 5200.0},
    ]

    df = analytics_service.merge_and_align_data(forecasts, actuals)
    metrics = analytics_service.calculate_summary_metrics(df)

    # Errors are +200 and -200
    # MAE should be 200.0
    assert metrics.maeMW == 200.0
    # RMSE should be sqrt((200^2 + (-200)^2)/2) = 200.0
    assert metrics.rmseMW == 200.0
    # Mean bias should be (200 + (-200))/2 = 0.0
    assert metrics.meanBiasMW == 0.0
    assert metrics.dataPointCount == 2
    assert metrics.reliabilityScore >= 80.0


def test_detect_ramp_events():
    # Construct steep swing
    df = pd.DataFrame([
        {"timestamp": datetime(2024, 3, 1, 0, 0, tzinfo=timezone.utc), "settlementPeriod": 1, "forecastMW": 2000.0, "actualMW": 2000.0},
        {"timestamp": datetime(2024, 3, 1, 0, 30, tzinfo=timezone.utc), "settlementPeriod": 2, "forecastMW": 3500.0, "actualMW": 2200.0},
    ])
    # Delta is 1500 MW in 30 mins -> 3000 MW/hr
    events = analytics_service.detect_ramp_events(df, threshold_mw_per_hour=1200.0)
    assert len(events) == 1
    assert events[0].severity == "CRITICAL"
