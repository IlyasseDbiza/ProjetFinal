import datetime
import decimal
import json
import logging
import traceback

import numpy as np
import pandas as pd

logger = logging.getLogger(__name__)
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from pathlib import Path

from app.database import get_db
from app.models.datasource import DataSource
from app.models.dashboard import QueryHistory
from app.services.nl2query import nl_to_query
from app.services.duckdb_service import execute_query, get_table_schema
from app.services.chart_builder import build_chart


def _json_safe(obj):
    """Recursively convert non-JSON-serializable types to plain Python types."""
    if isinstance(obj, (datetime.datetime, pd.Timestamp)):
        return obj.isoformat()
    if isinstance(obj, datetime.date):
        return obj.isoformat()
    if isinstance(obj, np.ndarray):
        return _json_safe(obj.tolist())
    if isinstance(obj, np.integer):
        return int(obj)
    if isinstance(obj, np.floating):
        return float(obj)
    if isinstance(obj, np.bool_):
        return bool(obj)
    if isinstance(obj, decimal.Decimal):
        return float(obj)
    try:
        if not isinstance(obj, (dict, list, str, bytes, bool)) and pd.isna(obj):
            return None
    except (TypeError, ValueError):
        pass
    if isinstance(obj, dict):
        return {k: _json_safe(v) for k, v in obj.items()}
    if isinstance(obj, (list, tuple)):
        return [_json_safe(v) for v in obj]
    return obj

router = APIRouter(prefix="/queries", tags=["queries"])

DB_DIR = Path("dbs")


def _db_path(ds_id: int) -> str:
    return str(DB_DIR / f"ds_{ds_id}.duckdb")


class NLQueryRequest(BaseModel):
    datasource_id: int
    question: str


@router.post("/ask")
async def ask(req: NLQueryRequest, db: Session = Depends(get_db)):
    ds = db.query(DataSource).filter(DataSource.id == req.datasource_id).first()
    if not ds:
        raise HTTPException(404, "DataSource not found.")

    db_path = _db_path(req.datasource_id)
    schema = get_table_schema(db_path, ds.table_name)

    history = QueryHistory(
        datasource_id=req.datasource_id,
        natural_language=req.question,
    )
    db.add(history)

    try:
        nl_result = await nl_to_query(req.question, ds.table_name, schema)
        sql = nl_result.get("sql", "")
        history.generated_sql = sql
        history.chart_type = nl_result.get("chart_type")

        query_result = execute_query(db_path, sql)
        chart = build_chart(
            columns=query_result["columns"],
            rows=query_result["rows"],
            chart_type=nl_result.get("chart_type", "table"),
            x_column=nl_result.get("x_column"),
            y_column=nl_result.get("y_column"),
            title=nl_result.get("title", req.question),
        )
        safe_chart = _json_safe(chart)
        history.chart_config = safe_chart
        db.commit()
        db.refresh(history)

        return _json_safe({
            "id": history.id,
            "sql": sql,
            "explanation": nl_result.get("explanation"),
            "chart": safe_chart,
            "row_count": query_result["row_count"],
        })

    except Exception as exc:
        logger.error("Query failed:\n%s", traceback.format_exc())
        db.rollback()
        history.error = str(exc)
        db.add(history)
        db.commit()
        raise HTTPException(500, f"Query failed: {exc}")


@router.get("/chart/{history_id}")
def get_chart(history_id: int, db: Session = Depends(get_db)):
    record = db.query(QueryHistory).filter(QueryHistory.id == history_id).first()
    if not record:
        raise HTTPException(404, "Query history not found.")
    return {"chart": record.chart_config}


@router.get("/history/{datasource_id}")
def get_history(datasource_id: int, db: Session = Depends(get_db)):
    records = (
        db.query(QueryHistory)
        .filter(QueryHistory.datasource_id == datasource_id)
        .order_by(QueryHistory.created_at.desc())
        .limit(50)
        .all()
    )
    return [
        {
            "id": r.id,
            "question": r.natural_language,
            "sql": r.generated_sql,
            "chart_type": r.chart_type,
            "error": r.error,
            "created_at": r.created_at,
        }
        for r in records
    ]
