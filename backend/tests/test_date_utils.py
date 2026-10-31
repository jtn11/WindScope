from datetime import datetime, date, timezone
from app.utils.date_utils import (
    get_settlement_period,
    settlement_period_to_time_range,
    parse_iso_datetime,
    format_elexon_date,
    get_day_ahead_range,
)


def test_get_settlement_period():
    # 00:15 UTC -> Period 1
    dt1 = datetime(2024, 3, 1, 0, 15, tzinfo=timezone.utc)
    assert get_settlement_period(dt1) == 1

    # 12:00 UTC -> Period 25 (12 * 2 + 1 = 25)
    dt2 = datetime(2024, 3, 1, 12, 0, tzinfo=timezone.utc)
    assert get_settlement_period(dt2) == 25

    # 23:45 UTC -> Period 48
    dt3 = datetime(2024, 3, 1, 23, 45, tzinfo=timezone.utc)
    assert get_settlement_period(dt3) == 48


def test_settlement_period_to_time_range():
    d = date(2024, 3, 1)
    start_dt, end_dt = settlement_period_to_time_range(d, 1)
    assert start_dt == datetime(2024, 3, 1, 0, 0, tzinfo=timezone.utc)
    assert end_dt == datetime(2024, 3, 1, 0, 30, tzinfo=timezone.utc)

    start_dt48, end_dt48 = settlement_period_to_time_range(d, 48)
    assert start_dt48 == datetime(2024, 3, 1, 23, 30, tzinfo=timezone.utc)
    assert end_dt48 == datetime(2024, 3, 2, 0, 0, tzinfo=timezone.utc)


def test_format_elexon_date():
    d = date(2024, 10, 31)
    assert format_elexon_date(d) == "2024-10-31"


def test_parse_iso_datetime():
    dt = parse_iso_datetime("2024-03-01T14:30:00Z")
    assert dt.hour == 14
    assert dt.minute == 30
    assert dt.tzinfo == timezone.utc
