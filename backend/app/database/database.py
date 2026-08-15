import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

POSTGRES_URL = os.getenv("DATABASE_URL", "postgresql://postgres:Gayatri1222@localhost:5432/billing_automation_platform")
if POSTGRES_URL and POSTGRES_URL.startswith("postgres://"):
    POSTGRES_URL = POSTGRES_URL.replace("postgres://", "postgresql://", 1)

if POSTGRES_URL and "c-3." in POSTGRES_URL and "-pooler" not in POSTGRES_URL:
    POSTGRES_URL = POSTGRES_URL.replace(".c-3.", "-pooler.c-3.", 1)

SQLITE_URL = "sqlite:///./billing_automation_platform.db"

try:
    import psycopg2
    engine = create_engine(POSTGRES_URL, pool_pre_ping=True)
    with engine.connect() as conn:
        pass
    print("Successfully connected to PostgreSQL database!")
except Exception as e:
    print(f"Notice: PostgreSQL connection fallback to SQLite: {e}")
    engine = create_engine(SQLITE_URL, connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()