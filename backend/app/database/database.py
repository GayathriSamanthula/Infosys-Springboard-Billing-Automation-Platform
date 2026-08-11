import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

POSTGRES_URL = os.getenv("DATABASE_URL", "postgresql://postgres:Gayatri1222@localhost:5432/billing_automation_platform")
SQLITE_URL = "sqlite:///./billing_automation_platform.db"

try:
    import psycopg2
    engine = create_engine(POSTGRES_URL)
    with engine.connect() as conn:
        pass
except Exception as e:
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