"""Data profiling service — returns column statistics for a DuckDB table."""
import duckdb
from typing import Any


def profile_table(db_path: str, table_name: str) -> dict[str, Any]:
    con = duckdb.connect(db_path, read_only=True)
    try:
        cols_info = con.execute(f"DESCRIBE {table_name}").fetchall()
        columns = []
        for col in cols_info:
            col_name = col[0]
            col_type = col[1]
            stats: dict[str, Any] = {"name": col_name, "type": col_type}

            try:
                row = con.execute(
                    f'SELECT COUNT(*) AS total, COUNT("{col_name}") AS non_null FROM {table_name}'
                ).fetchone()
                stats["total_rows"] = row[0]
                stats["non_null"] = row[1]
                stats["null_count"] = row[0] - row[1]
            except Exception:
                pass

            numeric_types = ("INTEGER", "BIGINT", "DOUBLE", "FLOAT", "DECIMAL", "HUGEINT", "SMALLINT", "TINYINT")
            if any(t in col_type.upper() for t in numeric_types):
                try:
                    agg = con.execute(
                        f'SELECT MIN("{col_name}"), MAX("{col_name}"), AVG("{col_name}"), '
                        f'STDDEV("{col_name}") FROM {table_name}'
                    ).fetchone()
                    stats["min"] = float(agg[0]) if agg[0] is not None else None
                    stats["max"] = float(agg[1]) if agg[1] is not None else None
                    stats["mean"] = float(agg[2]) if agg[2] is not None else None
                    stats["std"] = float(agg[3]) if agg[3] is not None else None
                except Exception:
                    pass
            else:
                try:
                    top = con.execute(
                        f'SELECT "{col_name}", COUNT(*) AS cnt FROM {table_name} '
                        f'GROUP BY "{col_name}" ORDER BY cnt DESC LIMIT 5'
                    ).fetchall()
                    stats["top_values"] = [{"value": str(r[0]), "count": r[1]} for r in top]
                    unique = con.execute(f'SELECT COUNT(DISTINCT "{col_name}") FROM {table_name}').fetchone()
                    stats["unique_count"] = unique[0]
                except Exception:
                    pass

            columns.append(stats)

        row_count = con.execute(f"SELECT COUNT(*) FROM {table_name}").fetchone()[0]
        return {"table_name": table_name, "row_count": row_count, "columns": columns}
    finally:
        con.close()
