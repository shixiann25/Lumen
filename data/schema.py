"""
Standard field definitions for input data.

See PRD §5.1.

The user uploads a wide-format file; the field mapping UI maps their columns
to the canonical names defined here.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Literal

FieldType = Literal["string", "float", "int", "enum"]


@dataclass(frozen=True)
class FieldSpec:
    name: str
    type: FieldType
    required: bool
    unit: str | None
    description: str


# --- Required ------------------------------------------------------------
REQUIRED_FIELDS: list[FieldSpec] = [
    FieldSpec("period_id", "string", True, None,
              "Observation unit ID, e.g., '2025-W42' or 'campaign_abc'."),
    FieldSpec("mmm_roi", "float", True, "x",
              "Incremental ROI from client MMM output (NOT last-click ROAS)."),
]


# --- Recommended metrics (PRD §5.1) -------------------------------------
RECOMMENDED_METRICS: list[FieldSpec] = [
    FieldSpec("ctr", "float", False, "%",
              "Click-through rate = clicks / impressions × 100."),
    FieldSpec("vtr_6s", "float", False, "%",
              "6-second view-through rate = 6s+ views / impressions."),
    FieldSpec("vtr_completion", "float", False, "%",
              "Completion rate = completed views / impressions."),
    FieldSpec("cpm", "float", False, "USD",
              "Cost per mille. Currency must be consistent across rows."),
    FieldSpec("cpm_volatility", "float", False, None,
              "Coefficient of variation of daily CPM within the period "
              "(std / mean)."),
    FieldSpec("avg_frequency", "float", False, "times",
              "Average frequency = impressions / reach. Use the same reach "
              "window as the MMM model (typically 30-day rolling)."),
    FieldSpec("reach", "int", False, "people",
              "Unique users reached."),
    FieldSpec("impressions", "int", False, "times",
              "Impression count."),
    FieldSpec("spend", "float", False, "USD",
              "Spend in the same currency as CPM. Used as a control variable."),
]


# --- Optional control variables -----------------------------------------
CONTROL_FIELDS: list[FieldSpec] = [
    FieldSpec("seasonality_flag", "enum", False, None,
              "One of: holiday / promo / regular."),
    FieldSpec("creative_count", "int", False, None,
              "Number of active creatives in the period."),
    FieldSpec("placement_mix", "string", False, None,
              "Placement combination (TopView / In-Feed / Branded Effect / ...)."),
]


STANDARD_FIELDS: list[FieldSpec] = REQUIRED_FIELDS + RECOMMENDED_METRICS + CONTROL_FIELDS


def get_field(name: str) -> FieldSpec | None:
    """Lookup helper used by validator and UI."""
    for f in STANDARD_FIELDS:
        if f.name == name:
            return f
    return None
