# 💨 WindScope — Wind Generation Intelligence Platform

A high-performance renewable generation intelligence platform engineered for **electricity procurement teams**, **energy trading desks**, and **portfolio managers** in the **Great Britain (GB) electricity market**. 

WindScope analyzes day-ahead renewable wind forecasts against physical outturn generation from **Elexon BMRS**, evaluates forecast reliability, quantifies prediction error distributions, and models financial imbalance cash-out risks under the **Balancing and Settlement Code (BSC)**.

---

## ⚡ Problem & Value Proposition

In liberalized wholesale electricity markets (e.g., EPEX SPOT and Nord Pool), procurement desks must balance energy positions by **12:00 PM D-1 (Day-Ahead Auction)**:
- **Systematic Over-forecasting (Long Position):** Yields surplus renewable commitments, risking spilled energy or receiving discount **System Sell Price (SSP)**.
- **Systematic Under-forecasting (Short Position):** Forces procurement teams into the balancing mechanism, incurring punitive **System Buy Price (SBP)** cash-out spreads (~£65–£85/MWh).
- **Extreme Generation Ramps:** Rapid swings exceeding 1,200 MW/hr stress grid balancing units and trigger volatile price spikes.

**WindScope provides the quantitative toolkit to derisk day-ahead trading and hedging.**

---

## 🛠️ Technology Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend** | React (v18) + Vite | High-performance reactive dashboard |
| **Language** | JavaScript (ESModules) | Frontend logic and interactions |
| **Styling** | Tailwind CSS | Modern energy-trading dark-mode design system |
| **Components** | shadcn/ui aesthetic | Professional, accessible UI primitives |
| **Charts** | Recharts | Forecast curves, error distributions, parity plots |
| **Backend** | Python 3.11+ / FastAPI | Asynchronous REST APIs |
| **Data Processing** | Pandas + NumPy | Vectorized statistical calculations |
| **HTTP Client** | HTTPX | Async Elexon BMRS API v1 integration |
| **Validation** | Pydantic (v2) | Schema validation and serialization |
| **Testing** | Pytest + Pytest-Asyncio | Unit and integration test suite |
| **Container** | Docker + Docker Compose | Multi-container orchestration |
| **Deployment** | Vercel | Production serverless and SPA hosting |

---

## 📁 Project Structure

```
windscope/
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── Header.jsx          # GB Grid status, UTC clock, horizon selector
│   │   │   │   ├── Sidebar.jsx         # Navigation menu & market capacity stats
│   │   │   │   └── Layout.jsx          # Shell layout wrapper
│   │   │   ├── charts/
│   │   │   │   ├── GenerationForecastChart.jsx  # Main interactive forecast curve
│   │   │   │   ├── ErrorDistributionChart.jsx   # Error histogram with P10/P50/P90
│   │   │   │   ├── SettlementPeriodErrorChart.jsx # 48 diurnal period error curve
│   │   │   │   └── CorrelationScatterChart.jsx  # 45° parity plot (Forecast vs Actual)
│   │   │   ├── cards/
│   │   │   │   ├── MetricCard.jsx       # Reusable KPI card with variants
│   │   │   │   ├── ReliabilityScoreCard.jsx # 0-100 reliability index & Grade A-D
│   │   │   │   ├── FinancialImpactCard.jsx  # Imbalance volume & £ cashout exposure
│   │   │   │   └── RampAlertCard.jsx    # Steep ramp rate detection (>1,200 MW/hr)
│   │   │   └── tables/
│   │   │       ├── SettlementDataTable.jsx # Filterable table with CSV export
│   │   │       └── DailyAccuracyTable.jsx  # Multi-day benchmark leaderboard
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx           # Executive procurement overview
│   │   │   ├── Forecast.jsx            # Day-ahead horizon & offshore/onshore split
│   │   │   ├── Accuracy.jsx            # Deep statistical error quantification
│   │   │   └── Methodology.jsx         # Market architecture & formula guides
│   │   ├── services/
│   │   │   └── api.js                  # API service with high-fidelity simulation fallback
│   │   ├── hooks/
│   │   │   ├── useForecastData.js      # Time-series forecast state
│   │   │   └── useAccuracyMetrics.js   # Analytics & distribution state
│   │   ├── utils/
│   │   │   ├── formatters.js           # MW, GW, GBP, settlement periods
│   │   │   └── cn.js                   # ClassName merging utility
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── vite.config.js
│   ├── package.json
│   └── Dockerfile
│
├── backend/
│   ├── app/
│   │   ├── main.py                     # FastAPI application & CORS configuration
│   │   ├── api/
│   │   │   └── routes.py               # REST endpoints for forecast & analytics
│   │   ├── services/
│   │   │   ├── elexon_service.py       # Live Elexon BMRS API client with caching
│   │   │   └── analytics_service.py    # Pandas/NumPy statistical engine
│   │   ├── schemas/
│   │   │   └── forecast.py             # Pydantic models for data & metrics
│   │   └── utils/
│   │       └── date_utils.py           # GB 48-period settlement calculations
│   ├── tests/
│   │   ├── test_elexon_service.py
│   │   ├── test_analytics_service.py
│   │   ├── test_date_utils.py
│   │   └── test_api_routes.py
│   ├── requirements.txt
│   └── Dockerfile
│
├── api/                                # Vercel Python serverless function entry
│   ├── index.py
│   └── requirements.txt
│
├── vercel.json                         # Vercel deployment configuration
├── docker-compose.yml                  # Local container orchestration
├── README.md                           # Documentation
└── .gitignore
```

---

## 📊 Quantitative Metrics & Formulas

All statistical operations are computed using vectorized **Pandas** and **NumPy**:

### 1. Mean Absolute Error (MAE)
$$\text{MAE} = \frac{1}{N} \sum_{i=1}^{N} |\text{Forecast}_i - \text{Actual}_i|$$
Measures average magnitude of forecast deviation in megawatts (MW).

### 2. Root Mean Squared Error (RMSE)
$$\text{RMSE} = \sqrt{\frac{1}{N} \sum_{i=1}^{N} (\text{Forecast}_i - \text{Actual}_i)^2}$$
Penalizes severe outlier errors heavily to highlight market risk spikes.

### 3. Mean Absolute Percentage Error (MAPE)
$$\text{MAPE} = \text{Median} \left( \frac{|\text{Forecast}_i - \text{Actual}_i|}{\text{Actual}_i} \right) \times 100\%$$
Evaluates relative accuracy. Filtered against zero-generation artifacts.

### 4. Mean Bias Error (MBE)
$$\text{MBE} = \frac{1}{N} \sum_{i=1}^{N} (\text{Forecast}_i - \text{Actual}_i)$$
Identifies directional portfolio hedging tendency (+ = over-forecast/long; - = under-forecast/short).

### 5. Procurement Reliability Score (0–100) & Grade
$$\text{Score} = 100 - (\text{nMAE} \times 3.8) - \left( \frac{|\text{MBE}|}{\text{Capacity}} \times 40 \right)$$
- **Grade A (88–100):** High reliability, optimal for day-ahead baseloading.
- **Grade B (75–87):** Moderate reliability, recommend 10% reserve buffer.
- **Grade C (60–74):** Elevated volatility, active intraday balancing advised.
- **Grade D (< 60):** Severe mismatch risk.

### 6. Imbalance Cashout Risk Exposure (£)
$$\text{Exposure} = \sum \left( |\text{Error MW}_i| \times 0.5\,\text{h} \times \text{SBP/SSP Spread (£68.50/MWh)} \right)$$

---

## 🚀 Quickstart Guide

### Option 1: Run with Docker Compose (Recommended)

To run the entire full-stack application (FastAPI backend + Vite React frontend) with a single command:

```bash
docker-compose up --build
```

- **Frontend:** Open [http://localhost:3000](http://localhost:3000)
- **Backend API Docs:** Open [http://localhost:8000/docs](http://localhost:8000/docs)
- **Backend Health:** Open [http://localhost:8000/api/health](http://localhost:8000/api/health)

---

### Option 2: Local Development Setup

#### 1. Backend Setup
```bash
# Navigate to backend
cd backend

# Create virtual environment
python3 -m venv .venv
source .venv/bin/activate   # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run FastAPI dev server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

#### 2. Frontend Setup
```bash
# In a new terminal, navigate to frontend
cd frontend

# Install dependencies
npm install

# Start Vite dev server
npm run dev
```

Visit [http://localhost:5173](http://localhost:5173). The frontend automatically proxies `/api` requests to `http://localhost:8000`.

---

## 🧪 Running Automated Tests

A comprehensive **Pytest** test suite covers settlement calculations, analytics algorithms, and API endpoints:

```bash
# Run pytest from backend directory
backend/.venv/bin/pytest backend/tests/ -v
```

Expected output:
```
backend/tests/test_analytics_service.py::test_merge_and_align_data PASSED
backend/tests/test_analytics_service.py::test_calculate_summary_metrics PASSED
backend/tests/test_analytics_service.py::test_detect_ramp_events PASSED
backend/tests/test_api_routes.py::test_health_endpoint PASSED
backend/tests/test_api_routes.py::test_forecast_latest_endpoint PASSED
backend/tests/test_api_routes.py::test_analytics_summary_endpoint PASSED
backend/tests/test_api_routes.py::test_settlement_profile_endpoint PASSED
backend/tests/test_api_routes.py::test_error_distribution_endpoint PASSED
backend/tests/test_date_utils.py::test_get_settlement_period PASSED
backend/tests/test_date_utils.py::test_settlement_period_to_time_range PASSED
backend/tests/test_date_utils.py::test_format_elexon_date PASSED
backend/tests/test_date_utils.py::test_parse_iso_datetime PASSED
======================== 12 passed in 7.33s =========================
```

---

## 🌐 Vercel Deployment

WindScope is pre-configured for **instant Vercel deployment** via `vercel.json`:

1. Push your repository to **GitHub** / **GitLab**.
2. Go to [vercel.com](https://vercel.com) and import the repository.
3. Keep default settings:
   - **Framework Preset:** Vite
   - **Root Directory:** `./`
   - **Build Command:** `cd frontend && npm install && npm run build`
   - **Output Directory:** `frontend/dist`
4. Click **Deploy**. Vercel will deploy the static React SPA and automatically wire the `/api` serverless Python runtime.

---

## 🔌 API Endpoints Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | System health check and Elexon market connection status |
| `GET` | `/api/forecast/latest?days=2` | Latest day-ahead & intraday time-series forecast and actuals |
| `GET` | `/api/forecast/range?start_date=&end_date=` | Custom historical range time-series data |
| `GET` | `/api/analytics/summary` | Quantitative KPIs (MAE, RMSE, MAPE, Bias, Reliability Score) |
| `GET` | `/api/analytics/settlement-profile` | 48-period diurnal error curve across the delivery day |
| `GET` | `/api/analytics/error-distribution` | Histogram error bins, P10, P50, P90 quantiles & skewness |
| `GET` | `/api/analytics/ramps?threshold=1200` | Steep generation ramp events (>1,200 MW/hr) |
| `GET` | `/api/analytics/daily-accuracy` | Multi-day accuracy benchmark leaderboard table |

Interactive OpenAPI documentation is available at `/docs` (Swagger UI) and `/redoc`.

---

## 🛡️ License

MIT License. Developed for energy procurement teams, analysts, and traders. Data provided by Elexon BMRS open data platform under the Open Government Licence (OGL).
