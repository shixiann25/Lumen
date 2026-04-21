"""
Correlation analysis: Pearson, Spearman, Kendall τ.

See PRD §4.1.

Key behaviors:
    - Always compute Spearman + Kendall (small-sample safe).
    - Compute Pearson only when n >= 10 AND caller requests it.
    - Return p-values.
    - Apply Benjamini–Hochberg FDR correction when >=5 metrics compared.
    - Flag potential non-linearity when |Pearson - Spearman| > 0.2.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Literal

import pandas as pd

CorrMethod = Literal["pearson", "spearman", "kendall"]


@dataclass
class CorrelationResult:
    metric: str
    method: CorrMethod
    coefficient: float
    p_value: float | None  # None for n < 6 (not statistically meaningful)
    n: int
    p_value_adjusted: float | None = None  # after BH-FDR
    nonlinearity_flag: bool = False  # True when |pearson - spearman| > 0.2


def compute_correlations(
    df: pd.DataFrame,
    target: str,
    metrics: list[str],
    methods: list[CorrMethod] | None = None,
) -> list[CorrelationResult]:
    """
    Compute correlations between each metric and the target (MMM ROI).

    Args:
        df: wide-format DataFrame, one row per observation
        target: column name of MMM ROI
        metrics: columns to correlate against target
        methods: which methods to run; default = ["spearman", "kendall"]

    Returns:
        list of CorrelationResult, sorted by |coefficient| descending.
    """
    from scipy import stats
    from statsmodels.stats.multitest import multipletests

    if methods is None:
        methods = ["spearman", "kendall"]

    results: list[CorrelationResult] = []

    for metric in metrics:
        pair = df[[target, metric]].dropna()
        n = len(pair)
        x = pair[metric].values
        y = pair[target].values

        if n < 2:
            continue

        pearson_coef: float | None = None
        spearman_coef: float | None = None

        for method in methods:
            if method == "pearson":
                if n < 10:
                    continue
                coef, pval = stats.pearsonr(x, y)
                pearson_coef = float(coef)
            elif method == "spearman":
                coef, pval = stats.spearmanr(x, y)
                spearman_coef = float(coef)
            elif method == "kendall":
                coef, pval = stats.kendalltau(x, y)
            else:
                continue

            p_value = None if n < 6 else float(pval)

            results.append(CorrelationResult(
                metric=metric,
                method=method,
                coefficient=round(float(coef), 2),
                p_value=round(p_value, 4) if p_value is not None else None,
                n=n,
            ))

        # flag non-linearity when both pearson and spearman computed
        if pearson_coef is not None and spearman_coef is not None:
            if abs(pearson_coef - spearman_coef) > 0.2:
                for r in results:
                    if r.metric == metric and r.method in ("pearson", "spearman"):
                        r.nonlinearity_flag = True

    # Benjamini-Hochberg FDR when >= 5 metrics
    if len(metrics) >= 5:
        p_vals = [r.p_value for r in results if r.p_value is not None]
        if p_vals:
            _, p_adj, _, _ = multipletests(p_vals, method="fdr_bh")
            adj_iter = iter(p_adj)
            for r in results:
                if r.p_value is not None:
                    r.p_value_adjusted = round(float(next(adj_iter)), 4)

    results.sort(key=lambda r: abs(r.coefficient), reverse=True)
    return results


def correlation_matrix(
    df: pd.DataFrame,
    metrics: list[str],
    method: CorrMethod = "spearman",
) -> pd.DataFrame:
    """Return a symmetric correlation matrix for heatmap rendering (collinearity check)."""
    return df[metrics].corr(method=method).round(2)
