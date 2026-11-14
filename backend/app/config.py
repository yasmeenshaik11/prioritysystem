import os
from pathlib import Path
from datetime import timedelta
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / '.env')

def determine_database_uri():
    configured_uri = os.getenv('DATABASE_URL', 'mysql+pymysql://emergency:emergency123@127.0.0.1:3306/emergency_ai')
    
    # If explicitly SQLite, return directly
    if configured_uri.startswith('sqlite:'):
        return configured_uri

    # If MySQL is configured, test if it is currently reachable and authenticated
    if configured_uri.startswith('mysql'):
        try:
            from sqlalchemy import create_engine
            # Quick probe with 2 second timeout
            test_engine = create_engine(configured_uri, connect_args={'connect_timeout': 2})
            with test_engine.connect() as conn:
                pass
            print(f"[Database] Successfully connected to MySQL: {configured_uri.split('@')[-1]}")
            return configured_uri
        except Exception as e:
            fallback_path = (BASE_DIR / 'emergency_ai.db').resolve()
            sqlite_uri = f"sqlite:///{fallback_path.as_posix()}"
            print(f"[Database Warning] Could not connect to MySQL ({type(e).__name__}: {e}).")
            print(f"[Database Notice] Seamlessly falling back to local SQLite database: {sqlite_uri}")
            print(f"[Database Notice] To use MySQL, set valid credentials in backend/.env (DATABASE_URL=mysql+pymysql://user:password@host:port/dbname).")
            return sqlite_uri

    return configured_uri

class Config:
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key-emergency-ai-987654321')
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'dev-jwt-secret-emergency-ai-123456789')
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(days=7)
    SQLALCHEMY_DATABASE_URI = determine_database_uri()
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    FRONTEND_ORIGIN = os.getenv('FRONTEND_ORIGIN', '*')
    UPLOAD_FOLDER = str((BASE_DIR / os.getenv('UPLOAD_FOLDER', 'uploads')).resolve())
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16 MB max image upload
