import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)

app = FastAPI(
    title="WindScope - Wind Generation Intelligence Platform API",
    description=(
        "A renewable generation intelligence platform that helps electricity procurement teams "
        "understand day-ahead wind generation forecasts, evaluate forecast reliability, "
        "and quantify prediction errors using historical actual generation data from Elexon BMRS."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Enable CORS for frontend Vite dev server, Docker, and Vercel domains
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "https://wind-scope-mu.vercel.app",
        "*"
    ],
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)


@app.get("/")
async def root():
    return {
        "platform": "WindScope Intelligence Platform",
        "description": "Day-ahead wind generation forecast reliability & error quantification platform",
        "version": "1.0.0",
        "documentation": "/docs",
        "healthCheck": "/api/health"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
