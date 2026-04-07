from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine
import os

# For development, we use SQLite.
# Consistent DB location in the server directory
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__)) # db/
SERVER_DIR = os.path.dirname(CURRENT_DIR) # server/
DB_PATH = os.path.join(SERVER_DIR, "edna_intelligence.db")
SQLALCHEMY_DATABASE_URL = f"sqlite:///{DB_PATH}"

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
