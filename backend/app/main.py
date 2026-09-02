from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.config import settings
from app.database import engine, Base
from app.models import DataSource, Dashboard, QueryHistory  # noqa: ensure tables created
from app.routers import datasources, queries, dashboards


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title="NL Dashboard SaaS API",
    description="Generate analytical dashboards from natural language questions.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(datasources.router)
app.include_router(queries.router)
app.include_router(dashboards.router)


@app.get("/health")
def health():
    return {"status": "ok", "version": "1.0.0"}
