from datetime import datetime, date, timezone
import pandas as pd
import numpy as np
from app.services.analytics_service import analytics_service


def test_match_actual_and_forecast_on_starttime():
    actuals = [
        {"startTime": "2026-01-01T00:00:00Z", "settlementDate": "2026-01-01", "settlementPeriod": 1, "actualMW": 14000.0},
        {"startTime": "2026-01-01T00:30:00Z", "settlementDate": "2026-01-01", "settlementPeriod": 2, "actualMW": 14200.0},
    ]
    forecasts = [
        {"startTime": "2026-01-01T00:00:00Z", "forecastMW": 15000.0, "publishTime": "2025-12-31T11:30:00Z"},
    ]

    df = analytics_service.match_actual_and_forecast_on_starttime(actuals, forecasts)
    assert len(df) == 2
    assert "errorMW" in df.columns
    # Both SP 1 and SP 2 match the 00:00:00Z forecast of 15,000 MW
    assert df.iloc[0]["forecastMW"] == 15000.0
    assert df.iloc[0]["errorMW"] == 1000.0  # 15000 - 14000
    assert df.iloc[1]["forecastMW"] == 15000.0
    assert df.iloc[1]["errorMW"] == 800.0   # 15000 - 14200


def test_calculate_summary_metrics():
    df = pd.DataFrame([
        {"forecastMW": 15000.0, "actualMW": 14000.0, "errorMW": 1000.0, "absoluteErrorMW": 1000.0, "percentageError": 7.14},
        {"forecastMW": 13000.0, "actualMW": 14000.0, "errorMW": -1000.0, "absoluteErrorMW": 1000.0, "percentageError": 7.14},
    ])
    metrics = analytics_service.calculate_summary_metrics(df)

    # MAE = 1000 MW
    assert metrics.maeMW == 1000.0
    # RMSE = sqrt((1000^2 + (-1000)^2)/2) = 1000.0
    assert metrics.rmseMW == 1000.0
    # Bias = (1000 + (-1000))/2 = 0.0
    assert metrics.meanBiasMW == 0.0
    assert metrics.dataPointCount == 2
    assert metrics.reliabilityScore >= 70.0


def test_filter_forecast_at_cutoff():
    forecasts = [
        {"startTime": "2026-01-01T00:00:00Z", "publishTime": "2025-12-31T09:30:00Z", "generation": 14000},
        {"startTime": "2026-01-01T00:00:00Z", "publishTime": "2025-12-31T11:30:00Z", "generation": 15000},
        {"startTime": "2026-01-01T00:00:00Z", "publishTime": "2025-12-31T15:30:00Z", "generation": 16000},
    ]
    target_d = date(2026, 1, 1)

    # Cutoff at 12:00 D-1 -> should select 11:30 publish
    selected, pub = analytics_service.filter_forecast_at_cutoff(forecasts, target_d, decision_cutoff="12:00")
    assert pub == "2025-12-31T11:30:00Z"
    assert len(selected) == 1
    assert selected[0]["generation"] == 15000

    # Cutoff at 10:00 D-1 -> should select 09:30 publish
    selected_early, pub_early = analytics_service.filter_forecast_at_cutoff(forecasts, target_d, decision_cutoff="10:00")
    assert pub_early == "2025-12-31T09:30:00Z"
