from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


class WindDataPoint(BaseModel):
    timestamp: datetime = Field(..., description="UTC timestamp of the half-hour settlement interval")
    settlementPeriod: int = Field(..., ge=1, le=48, description="GB Settlement Period (1-48)")
    forecastMW: float = Field(..., description="Day-ahead forecasted wind generation in MW")
    actualMW: Optional[float] = Field(None, description="Actual outturn wind generation in MW (if available)")
    errorMW: Optional[float] = Field(None, description="Forecast Error: Forecast - Actual (positive = over-forecast)")
    absoluteErrorMW: Optional[float] = Field(None, description="Absolute Forecast Error |Forecast - Actual|")
    percentageError: Optional[float] = Field(None, description="Percentage Error relative to actual generation (%)")
    offshoreActualMW: Optional[float] = Field(None, description="Actual offshore wind generation in MW")
    onshoreActualMW: Optional[float] = Field(None, description="Actual onshore wind generation in MW")
    status: Optional[str] = Field(
        None, 
        description="Forecast category: OVER_FORECAST, UNDER_FORECAST, ON_TARGET, or PENDING_ACTUAL"
    )


class SummaryMetrics(BaseModel):
    totalForecastMWh: float = Field(..., description="Total forecasted energy in MWh")
    totalActualMWh: float = Field(..., description="Total actual energy outturn in MWh")
    maeMW: float = Field(..., description="Mean Absolute Error in MW")
    rmseMW: float = Field(..., description="Root Mean Squared Error in MW")
    mapePercent: float = Field(..., description="Mean Absolute Percentage Error (%)")
    meanBiasMW: float = Field(..., description="Mean Bias Error in MW (positive = systematic over-forecast)")
    nmaePercent: float = Field(..., description="Normalized MAE against peak generation (%)")
    reliabilityScore: float = Field(..., ge=0, le=100, description="Procurement Reliability Index (0-100)")
    maxOverForecastMW: float = Field(..., description="Maximum positive error (over-forecast peak)")
    maxUnderForecastMW: float = Field(..., description="Maximum negative error (under-forecast peak)")
    rampRateAlertCount: int = Field(0, description="Number of extreme generation ramp rate events detected")
    estimatedImbalanceCostGbp: float = Field(..., description="Estimated procurement imbalance cashout exposure (£)")
    dataPointCount: int = Field(..., description="Number of settlement intervals evaluated")
    accuracyGrade: str = Field(..., description="Procurement risk grade: A (Excellent), B (Good), C (Moderate), D (High Risk)")


class SettlementPeriodProfileItem(BaseModel):
    settlementPeriod: int = Field(..., ge=1, le=48)
    timeLabel: str = Field(..., description="HH:MM start time")
    avgForecastMW: float
    avgActualMW: float
    avgErrorMW: float
    avgAbsErrorMW: float
    sampleCount: int


class ErrorBin(BaseModel):
    binRange: str
    count: int
    percentage: float
    minMW: float
    maxMW: float


class RampEvent(BaseModel):
    timestamp: datetime
    settlementPeriod: int
    forecastDeltaMW: float
    actualDeltaMW: float
    rampMismatchMW: float
    severity: str  # LOW, MEDIUM, HIGH, CRITICAL


class DailyAccuracyItem(BaseModel):
    date: str
    maeMW: float
    rmseMW: float
    mapePercent: float
    meanBiasMW: float
    reliabilityScore: float
    peakActualMW: float
    peakForecastMW: float
    accuracyGrade: str


class ForecastResponse(BaseModel):
    status: str
    source: str
    startDate: str
    endDate: str
    dataCount: int
    data: List[WindDataPoint]
    metrics: Optional[SummaryMetrics] = None


class AnalyticsSummaryResponse(BaseModel):
    status: str
    startDate: str
    endDate: str
    metrics: SummaryMetrics


class SettlementProfileResponse(BaseModel):
    status: str
    startDate: str
    endDate: str
    periods: List[SettlementPeriodProfileItem]


class ErrorDistributionResponse(BaseModel):
    status: str
    startDate: str
    endDate: str
    totalSamples: int
    bins: List[ErrorBin]
    p10ErrorMW: float
    p50ErrorMW: float
    p90ErrorMW: float
    skewness: float


class RampAnalysisResponse(BaseModel):
    status: str
    thresholdMWPerHour: float
    events: List[RampEvent]
    totalRampAlerts: int


class HistoricalAccuracyResponse(BaseModel):
    status: str
    days: List[DailyAccuracyItem]
    overallMetrics: SummaryMetrics
