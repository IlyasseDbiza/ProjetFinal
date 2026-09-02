from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Any

from app.database import get_db
from app.models.dashboard import Dashboard

router = APIRouter(prefix="/dashboards", tags=["dashboards"])


class DashboardCreate(BaseModel):
    title: str
    description: str = ""
    widgets: list[Any] = []


class DashboardUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    widgets: list[Any] | None = None


@router.post("/")
def create_dashboard(payload: DashboardCreate, db: Session = Depends(get_db)):
    dash = Dashboard(
        title=payload.title,
        description=payload.description,
        widgets=payload.widgets,
    )
    db.add(dash)
    db.commit()
    db.refresh(dash)
    return _serialize(dash)


@router.get("/")
def list_dashboards(db: Session = Depends(get_db)):
    dashboards = db.query(Dashboard).order_by(Dashboard.updated_at.desc()).all()
    return [_serialize(d) for d in dashboards]


@router.get("/{dash_id}")
def get_dashboard(dash_id: int, db: Session = Depends(get_db)):
    dash = db.query(Dashboard).filter(Dashboard.id == dash_id).first()
    if not dash:
        raise HTTPException(404, "Dashboard not found.")
    return _serialize(dash)


@router.put("/{dash_id}")
def update_dashboard(dash_id: int, payload: DashboardUpdate, db: Session = Depends(get_db)):
    dash = db.query(Dashboard).filter(Dashboard.id == dash_id).first()
    if not dash:
        raise HTTPException(404, "Dashboard not found.")
    if payload.title is not None:
        dash.title = payload.title
    if payload.description is not None:
        dash.description = payload.description
    if payload.widgets is not None:
        dash.widgets = payload.widgets
    db.commit()
    db.refresh(dash)
    return _serialize(dash)


@router.delete("/{dash_id}")
def delete_dashboard(dash_id: int, db: Session = Depends(get_db)):
    dash = db.query(Dashboard).filter(Dashboard.id == dash_id).first()
    if not dash:
        raise HTTPException(404, "Dashboard not found.")
    db.delete(dash)
    db.commit()
    return {"ok": True}


def _serialize(d: Dashboard) -> dict:
    return {
        "id": d.id,
        "title": d.title,
        "description": d.description,
        "widgets": d.widgets or [],
        "created_at": d.created_at,
        "updated_at": d.updated_at,
    }
