from datetime import datetime, date, time, timedelta, timezone
from typing import Tuple, List, Optional
from dateutil import parser


def get_settlement_period(dt: datetime) -> int:
    """
    Calculate the GB electricity market settlement period (1-48) for a given UTC datetime.
    Each period is 30 minutes.
    Period 1 is 00:00 - 00:30 UTC.
    """
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    else:
        dt = dt.astimezone(timezone.utc)
    
    minutes_since_midnight = dt.hour * 60 + dt.minute
    period = (minutes_since_midnight // 30) + 1
    return min(max(period, 1), 48)


def settlement_period_to_time_range(target_date: date, period: int) -> Tuple[datetime, datetime]:
    """
    Return the start and end UTC datetime for a given date and settlement period (1-48).
    """
    period = min(max(period, 1), 48)
    minutes = (period - 1) * 30
    start_dt = datetime.combine(target_date, time.min, tzinfo=timezone.utc) + timedelta(minutes=minutes)
    end_dt = start_dt + timedelta(minutes=30)
    return start_dt, end_dt


def parse_iso_datetime(dt_str: str) -> datetime:
    """
    Robust ISO datetime parsing with UTC normalization.
    """
    parsed = parser.parse(dt_str)
    if parsed.tzinfo is None:
        return parsed.replace(tzinfo=timezone.utc)
    return parsed.astimezone(timezone.utc)


def format_elexon_date(d: date) -> str:
    """Format date for Elexon API query (YYYY-MM-DD)."""
    return d.strftime("%Y-%m-%d")


def get_day_ahead_range(base_date: Optional[date] = None) -> Tuple[date, date]:
    """
    Returns (start_date, end_date) representing Day-Ahead delivery window.
    Default base_date is today.
    """
    if base_date is None:
        base_date = datetime.now(timezone.utc).date()
    day_ahead = base_date + timedelta(days=1)
    return base_date, day_ahead
