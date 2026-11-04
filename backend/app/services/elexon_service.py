import asyncio
import logging
from datetime import datetime, date, timedelta, timezone
from typing import Dict, List, Optional, Any
import httpx

from app.utils.date_utils import format_elexon_date

logger = logging.getLogger("elexon_service")

ELEXON_BASE_URL = "https://data.elexon.co.uk/bmrs/api/v1"
CACHE_TTL_SECONDS = 1800  # 30 minutes in-memory cache for historical data


class ElexonService:
    def __init__(self, base_url: str = ELEXON_BASE_URL):
        self.base_url = base_url
        self._cache: Dict[str, Dict[str, Any]] = {}

    def _get_cache(self, key: str) -> Optional[Any]:
        if key in self._cache:
            entry = self._cache[key]
            if datetime.now(timezone.utc).timestamp() - entry["timestamp"] < CACHE_TTL_SECONDS:
                return entry["data"]
            del self._cache[key]
        return None

    def _set_cache(self, key: str, data: Any):
        self._cache[key] = {
            "timestamp": datetime.now(timezone.utc).timestamp(),
            "data": data,
        }

    async def fetch_fuelhh_actuals(self, from_date: date, to_date: date) -> List[Dict[str, Any]]:
        """
        Fetches actual national-level outturn wind generation from the Elexon BMRS FUELHH stream endpoint.
        URL: https://data.elexon.co.uk/bmrs/api/v1/datasets/FUELHH/stream?settlementDateFrom=...&settlementDateTo=...&fuelType=WIND
        """
        cache_key = f"fuelhh_{from_date}_{to_date}"
        cached = self._get_cache(cache_key)
        if cached is not None:
            return cached

        from_str = format_elexon_date(from_date)
        to_str = format_elexon_date(to_date)
        url = f"{self.base_url}/datasets/FUELHH/stream?settlementDateFrom={from_str}&settlementDateTo={to_str}&fuelType=WIND"

        try:
            async with httpx.AsyncClient(timeout=20.0) as client:
                response = await client.get(url, headers={"accept": "application/json"})
                if response.status_code == 200:
                    payload = response.json()
                    items = payload if isinstance(payload, list) else payload.get("data", [])
                    
                    results = []
                    for item in items:
                        if item.get("fuelType") != "WIND":
                            continue
                        
                        start_time = item.get("startTime")
                        gen = item.get("generation")
                        sp = item.get("settlementPeriod")
                        
                        if start_time and gen is not None:
                            results.append({
                                "startTime": start_time,
                                "settlementDate": item.get("settlementDate"),
                                "settlementPeriod": int(sp) if sp is not None else 1,
                                "actualMW": float(gen),
                                "publishTime": item.get("publishTime")
                            })

                    results.sort(key=lambda x: x["startTime"])
                    self._set_cache(cache_key, results)
                    logger.info(f"Retrieved {len(results)} FUELHH actual records for {from_str} to {to_str}")
                    return results
                else:
                    logger.error(f"FUELHH API returned status {response.status_code}: {response.text[:200]}")
        except Exception as e:
            logger.error(f"Failed to fetch FUELHH stream from Elexon: {e}")

        # Return empty list if network/API error occurs - handled gracefully
        return []

    async def fetch_windfor_forecasts(self, publish_from: datetime, publish_to: datetime) -> List[Dict[str, Any]]:
        """
        Fetches wind generation forecasts from the Elexon BMRS WINDFOR stream endpoint.
        URL: https://data.elexon.co.uk/bmrs/api/v1/datasets/WINDFOR/stream?publishDateTimeFrom=...&publishDateTimeTo=...
        """
        from_iso = publish_from.strftime("%Y-%m-%dT%H:%M:%SZ")
        to_iso = publish_to.strftime("%Y-%m-%dT%H:%M:%SZ")
        cache_key = f"windfor_{from_iso}_{to_iso}"
        cached = self._get_cache(cache_key)
        if cached is not None:
            return cached

        url = f"{self.base_url}/datasets/WINDFOR/stream?publishDateTimeFrom={from_iso}&publishDateTimeTo={to_iso}"

        try:
            async with httpx.AsyncClient(timeout=25.0) as client:
                response = await client.get(url, headers={"accept": "application/json"})
                if response.status_code == 200:
                    payload = response.json()
                    items = payload if isinstance(payload, list) else payload.get("data", [])
                    
                    results = []
                    for item in items:
                        start_time = item.get("startTime")
                        gen = item.get("generation")
                        pub_time = item.get("publishTime")
                        
                        if start_time and gen is not None and pub_time:
                            results.append({
                                "startTime": start_time,
                                "publishTime": pub_time,
                                "forecastMW": float(gen)
                            })

                    self._set_cache(cache_key, results)
                    logger.info(f"Retrieved {len(results)} WINDFOR forecast records for publish window {from_iso} to {to_iso}")
                    return results
                else:
                    logger.error(f"WINDFOR API returned status {response.status_code}: {response.text[:200]}")
        except Exception as e:
            logger.error(f"Failed to fetch WINDFOR stream from Elexon: {e}")

        return []

    async def get_forecasts_for_delivery_dates(self, from_date: date, to_date: date) -> List[Dict[str, Any]]:
        """
        Retrieves all WINDFOR forecast publications issued on D-1 and delivery days for the specified range.
        For delivery day D, day-ahead forecasts are published on D-1 starting at 00:00:00Z.
        """
        pub_from = datetime.combine(from_date - timedelta(days=1), datetime.min.time(), tzinfo=timezone.utc)
        pub_to = datetime.combine(to_date, datetime.max.time(), tzinfo=timezone.utc)
        return await self.fetch_windfor_forecasts(pub_from, pub_to)


elexon_service = ElexonService()
