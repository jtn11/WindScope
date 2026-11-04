from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class WindDataPoint(BaseModel):
    timestamp: datetime = Field(..., description="UTC timestamp of the settlement interval")
    startTime: str = Field(..., description="Elexon startTime string matching actual and forecast feeds")
    settlementPeriod: int = Field(..., ge=1, le=48, description="GB Settlement Period (1-48)")
    forecastMW: float = Field(..., description="Forecasted wind generation in MW at decision cutoff")
    actualMW: Optional[float] = Field(None, description="Actual national outturn wind generation in MW from FUELHH")
    errorMW: Optional[float] = Field(None, description="Prediction Error: Forecast - Actual (positive = over-forecast)")
    absoluteErrorMW: Optional[float] = Field(None, description="Absolute Prediction Error: |Forecast - Actual|")
    percentageError: Optional[float] = Field(None, description="Percentage Error relative to actual generation (%)")
    forecastPublishTime: Optional[str] = Field(None, description="Publication timestamp of the selected forecast")
    status: Optional[str] = Field(
        None, 
        description="Forecast category: OVER_FORECAST, UNDER_FORECAST, ON_TARGET, or PENDING_ACTUAL"
    )


class SummaryMetrics(BaseModel):
    totalForecastMWh: float = Field(..., description="Total forecasted energy volume in MWh")
    totalActualMWh: float = Field(..., description="Total actual energy outturn in MWh")
    maeMW: float = Field(..., description="Mean Absolute Error in MW")
    rmseMW: float = Field(..., description="Root Mean Squared Error in MW")
    mapePercent: float = Field(..., description="Median Absolute Percentage Error (%)")
    meanBiasMW: float = Field(..., description="Mean Bias Error in MW (positive = over-forecast, negative = under-forecast)")
    nmaePercent: float = Field(..., description="Normalized MAE against peak generation (%)")
    reliabilityScore: float = Field(..., ge=0, le=100, description="Forecast Reliability Score (0-100)")
    maxOverForecastMW: float = Field(..., description="Maximum positive error (over-forecast peak)")
    maxUnderForecastMW: float = Field(..., description="Maximum negative error (under-forecast peak)")
    dataPointCount: int = Field(..., description="Number of matched delivery intervals evaluated")
    accuracyGrade: str = Field(..., description="Performance grade: A (Excellent), B (Good), C (Moderate), D (High Error)")


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


class ForecastPublishRun(BaseModel):
    publishTime: str
    cutoffLabel: str
    maeMW: Optional[float] = None
    rmseMW: Optional[float] = None
    meanBiasMW: Optional[float] = None
    data: List[Dict[str, Any]] = []


class ForecastResponse(BaseModel):
    status: str
    source: str
    startDate: str
    endDate: str
    decisionCutoff: str
    selectedPublishTime: Optional[str] = None
    availablePublishTimes: List[str] = []
    dataCount: int
    data: List[WindDataPoint]
    metrics: Optional[SummaryMetrics] = None


class PublicationHistoryResponse(BaseModel):
    status: str
    targetDate: str
    runs: List[ForecastPublishRun]


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


class HistoricalAccuracyResponse(BaseModel):
    status: str
    days: List[DailyAccuracyItem]
    overallMetrics: SummaryMetrics
