"""Convert query results + chart config into a Plotly figure spec."""
import json
import plotly.graph_objects as go
import plotly.express as px
import plotly.io as pio
from typing import Any


def build_chart(
    columns: list[str],
    rows: list[list],
    chart_type: str,
    x_column: str | None,
    y_column: str | None,
    title: str = "",
) -> dict[str, Any]:
    """Return a Plotly figure as a JSON-serialisable dict."""
    import pandas as pd

    df = pd.DataFrame(rows, columns=columns)

    # Resolve column names (fallback to positional)
    x_col = x_column if x_column and x_column in df.columns else (columns[0] if columns else None)
    y_col = y_column if y_column and y_column in df.columns else (columns[1] if len(columns) > 1 else None)

    fig: go.Figure

    try:
        if chart_type == "bar" and x_col and y_col:
            fig = px.bar(df, x=x_col, y=y_col, title=title, template="plotly_dark")
        elif chart_type == "line" and x_col and y_col:
            fig = px.line(df, x=x_col, y=y_col, title=title, template="plotly_dark", markers=True)
        elif chart_type == "scatter" and x_col and y_col:
            fig = px.scatter(df, x=x_col, y=y_col, title=title, template="plotly_dark")
        elif chart_type == "pie" and x_col and y_col:
            fig = px.pie(df, names=x_col, values=y_col, title=title, template="plotly_dark")
        elif chart_type == "histogram" and x_col:
            fig = px.histogram(df, x=x_col, title=title, template="plotly_dark")
        else:
            # Fallback — return raw table indicator
            return {"type": "table", "columns": columns, "rows": rows[:200], "title": title}

        fig.update_layout(
            paper_bgcolor="rgba(0,0,0,0)",
            plot_bgcolor="rgba(0,0,0,0)",
            font={"color": "#e2e8f0"},
            margin={"l": 40, "r": 20, "t": 50, "b": 40},
        )
        return {"type": "plotly", "figure": json.loads(pio.to_json(fig)), "title": title}
    except Exception as exc:
        return {"type": "table", "columns": columns, "rows": rows[:200], "title": title, "error": str(exc)}
