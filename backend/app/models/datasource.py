from sqlalchemy import Column, Integer, String, DateTime, JSON, Float
from sqlalchemy.sql import func
from app.database import Base


class DataSource(Base):
    __tablename__ = "datasources"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    type = Column(String, nullable=False)  # csv | sql
    file_path = Column(String, nullable=True)
    connection_string = Column(String, nullable=True)
    table_name = Column(String, nullable=True)
    profile = Column(JSON, nullable=True)  # column stats
    row_count = Column(Integer, nullable=True)
    size_bytes = Column(Float, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
