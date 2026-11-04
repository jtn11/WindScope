import pytest
from starlette.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "FUELHH" in data["datasets"]["actuals"]
    assert "WINDFOR" in data["datasets"]["forecasts"]


def test_forecast_latest_endpoint():
    response = client.get("/api/forecast/latest?days=1")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert "data" in data
    assert "metrics" in data
    assert data["source"].startswith("Elexon BMRS")


def test_publication_history_endpoint():
    response = client.get("/api/forecast/publication-history?target_date=2026-01-01")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert "runs" in data
    assert len(data["runs"]) > 0


def test_analytics_summary_endpoint():
    response = client.get("/api/analytics/summary?start_date=2026-01-01&end_date=2026-01-01")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert "maeMW" in data["metrics"]
    assert "rmseMW" in data["metrics"]
    assert "meanBiasMW" in data["metrics"]


def test_settlement_profile_endpoint():
    response = client.get("/api/analytics/settlement-profile?start_date=2026-01-01&end_date=2026-01-01")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert isinstance(data["periods"], list)


def test_error_distribution_endpoint():
    response = client.get("/api/analytics/error-distribution?start_date=2026-01-01&end_date=2026-01-01")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert "bins" in data
    assert "p50ErrorMW" in data
