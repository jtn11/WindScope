import sys
import os

# Add backend directory to sys.path so modules can be imported
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

from app.main import app

# Export FastAPI app for Vercel Python runtime
handler = app
