from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, Form
from sqlalchemy.orm import Session
from pathlib import Path
import shutil, os

from app.database import get_db
from app.models.datasource import DataSource
from app.services.duckdb_service import import_csv, get_table_schema
from app.services.profiler import profile_table
from app.config import settings

router = APIRouter(prefix="/datasources", tags=["datasources"])

DB_DIR = Path("dbs")
DB_DIR.mkdir(exist_ok=True)


def _db_path(ds_id: int) -> str:
    return str(DB_DIR / f"ds_{ds_id}.duckdb")


@router.post("/upload")
async def upload_csv(
    file: UploadFile = File(...),
    name: str = Form(...),
    db: Session = Depends(get_db),
):
    if not file.filename.endswith(".csv"):
        raise HTTPException(400, "Only CSV files are supported.")

    size = 0
    dest = settings.upload_path / file.filename
    with dest.open("wb") as f:
        while chunk := await file.read(1024 * 1024):
            size += len(chunk)
            if size > settings.max_upload_size_mb * 1024 * 1024:
                raise HTTPException(413, f"File exceeds {settings.max_upload_size_mb} MB limit.")
            f.write(chunk)

    ds = DataSource(name=name, type="csv", file_path=str(dest), size_bytes=size)
    db.add(ds)
    db.commit()
    db.refresh(ds)

    table_name = f"t_{ds.id}"
    db_path = _db_path(ds.id)
    row_count = import_csv(str(dest), db_path, table_name)

    profile = profile_table(db_path, table_name)
    ds.table_name = table_name
    ds.row_count = row_count
    ds.profile = profile
    db.commit()
    db.refresh(ds)

    return {
        "id": ds.id,
        "name": ds.name,
        "table_name": table_name,
        "row_count": row_count,
        "profile": profile,
    }


@router.get("/")
def list_datasources(db: Session = Depends(get_db)):
    sources = db.query(DataSource).order_by(DataSource.created_at.desc()).all()
    return [
        {
            "id": s.id,
            "name": s.name,
            "type": s.type,
            "row_count": s.row_count,
            "table_name": s.table_name,
            "created_at": s.created_at,
        }
        for s in sources
    ]


@router.get("/{ds_id}")
def get_datasource(ds_id: int, db: Session = Depends(get_db)):
    ds = db.query(DataSource).filter(DataSource.id == ds_id).first()
    if not ds:
        raise HTTPException(404, "DataSource not found.")
    return {
        "id": ds.id,
        "name": ds.name,
        "type": ds.type,
        "row_count": ds.row_count,
        "table_name": ds.table_name,
        "profile": ds.profile,
        "created_at": ds.created_at,
    }


@router.get("/{ds_id}/schema")
def get_schema(ds_id: int, db: Session = Depends(get_db)):
    ds = db.query(DataSource).filter(DataSource.id == ds_id).first()
    if not ds:
        raise HTTPException(404, "DataSource not found.")
    db_path = _db_path(ds_id)
    schema = get_table_schema(db_path, ds.table_name)
    return {"schema": schema}


@router.delete("/{ds_id}")
def delete_datasource(ds_id: int, db: Session = Depends(get_db)):
    ds = db.query(DataSource).filter(DataSource.id == ds_id).first()
    if not ds:
        raise HTTPException(404, "DataSource not found.")
    db_path = _db_path(ds_id)
    if os.path.exists(db_path):
        os.remove(db_path)
    if ds.file_path and os.path.exists(ds.file_path):
        os.remove(ds.file_path)
    db.delete(ds)
    db.commit()
    return {"ok": True}
