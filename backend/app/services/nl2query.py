"""NL-to-SQL + chart-type suggestion using an LLM (Groq)."""
import json
import re
from typing import Any

from groq import AsyncGroq
from app.config import settings

_client: AsyncGroq | None = None


def _get_client() -> AsyncGroq:
    global _client
    if _client is None:
        _client = AsyncGroq(api_key=settings.groq_api_key)
    return _client


SYSTEM_PROMPT = """You are a data analyst assistant that converts natural language questions into safe SQL SELECT queries for DuckDB.

Rules:
- Only produce SELECT statements. NEVER generate INSERT, UPDATE, DELETE, DROP, CREATE, ALTER, or any DDL/DML.
- Use the exact table name and column names provided in the schema.
- Return a JSON object with these fields:
  {
    "sql": "<SELECT query>",
    "chart_type": "<bar|line|scatter|pie|table|histogram>",
    "x_column": "<column name for x-axis or null>",
    "y_column": "<column name for y-axis or null>",
    "title": "<short descriptive title for the chart>",
    "explanation": "<1 sentence explanation of what the query does>"
  }
- Choose chart_type based on the question:
  - bar: comparisons between categories
  - line: trends over time
  - scatter: correlations between two numeric columns
  - pie: proportions/percentages
  - histogram: distribution of a single numeric column
  - table: raw data retrieval or aggregation without a clear chart type
- Do NOT wrap the JSON in markdown code fences.
"""


async def nl_to_query(
    question: str, table_name: str, schema: list[dict]
) -> dict[str, Any]:
    schema_str = "\n".join(f"  - {c['column']} ({c['type']})" for c in schema)
    user_message = (
        f"Table name: {table_name}\n"
        f"Schema:\n{schema_str}\n\n"
        f"Question: {question}"
    )

    if not settings.groq_api_key:
        return _fallback_query(table_name, schema)

    client = _get_client()
    response = await client.chat.completions.create(
        model="openai/gpt-oss-120b",
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_message},
        ],
        temperature=0,
        response_format={"type": "json_object"},
    )

    content = response.choices[0].message.content or "{}"
    result = json.loads(content)
    _validate_sql(result.get("sql", ""))
    return result


def _validate_sql(sql: str) -> None:
    """Raise an error if the SQL contains dangerous keywords."""
    forbidden = re.compile(
        r"\b(INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|TRUNCATE|EXEC|EXECUTE|GRANT|REVOKE)\b",
        re.IGNORECASE,
    )
    if forbidden.search(sql):
        raise ValueError("Generated SQL contains forbidden operations.")


def _fallback_query(table_name: str, schema: list[dict]) -> dict[str, Any]:
    """Return a simple SELECT * when no API key is configured."""
    return {
        "sql": f"SELECT * FROM {table_name} LIMIT 100",
        "chart_type": "table",
        "x_column": None,
        "y_column": None,
        "title": f"Sample data from {table_name}",
        "explanation": "No Groq API key configured — showing raw data.",
    }
