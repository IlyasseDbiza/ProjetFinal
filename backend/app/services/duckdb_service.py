"""DuckDB service — import CSVs, execute safe queries."""
import duckdb
import pandas as pd
from pathlib import Path
from typing import Any


def import_csv(csv_path: str, db_path: str, table_name: str) -> int:
    """Load a CSV file into a DuckDB database and return row count."""
    con = duckdb.connect(db_path)
    try:
        con.execute(f"DROP TABLE IF EXISTS {table_name}")
        con.execute(
            f"CREATE TABLE {table_name} AS SELECT * FROM read_csv_auto('{csv_path}', header=true)"
        )
        count = con.execute(f"SELECT COUNT(*) FROM {table_name}").fetchone()[0]
        return count
    finally:
        con.close()


def execute_query(db_path: str, sql: str, limit: int = 1000) -> dict[str, Any]:
    """Run a read-only SELECT query and return columns + rows."""
    con = duckdb.connect(db_path, read_only=True)
    try:
        limited_sql = _inject_limit(sql, limit)
        result = con.execute(limited_sql)
        columns = [desc[0] for desc in result.description]
        rows = result.fetchall()
        return {
            "columns": columns,
            "rows": [list(r) for r in rows],
            "row_count": len(rows),
        }
    finally:
        con.close()


def get_table_schema(db_path: str, table_name: str) -> list[dict]:
    con = duckdb.connect(db_path, read_only=True)
    try:
        info = con.execute(f"DESCRIBE {table_name}").fetchall()
        return [{"column": r[0], "type": r[1]} for r in info]
    finally:
        con.close()


def _inject_limit(sql: str, limit: int) -> str:
    """Append LIMIT if not already present (simple heuristic)."""
    stripped = sql.strip().rstrip(";")
    upper = stripped.upper()
    if "LIMIT" not in upper:
        stripped = f"{stripped} LIMIT {limit}"
    return stripped
