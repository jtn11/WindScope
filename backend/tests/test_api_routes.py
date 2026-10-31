import pytest
from starlette.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "GB Electricity" in data["market"]


def test_forecast_latest_endpoint():
    response = client.get("/api/forecast/latest?days=1")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert len(data["data"]) > 0
    assert "metrics" in data


def test_analytics_summary_endpoint():
    response = client.get("/api/analytics/summary")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert "maeMW" in data["metrics"]
    assert "reliabilityScore" in data["metrics"]


def test_settlement_profile_endpoint():
    response = client.get("/api/analytics/settlement-profile")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert isinstance(data["periods"], list)


def test_error_distribution_endpoint():
    response = client.get("/api/analytics/error-distribution")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert "bins" in data
    assert "p50ErrorMW" in data
