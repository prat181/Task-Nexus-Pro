from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base
from sqlalchemy.orm import sessionmaker
import os

# --- THIS IS THE NEW PART ---
# This finds the exact folder your database.py file is living in
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# This creates a safe, absolute path to your taskmanager.db file
db_path = os.path.join(BASE_DIR, "taskmanager.db")

# We use that safe path for the database URL
SQLALCHEMY_DATABASE_URL = f"sqlite:///{db_path}"
# ----------------------------

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()