"""
Optimal range identification via equal-frequency (quantile) binning.

See PRD §4.2 Step 1 + 2.
"""

from __future__ import annotations

from dataclasses import dataclass

import numpy as np
import pandas as pd


@dataclass
class Bin:
    lower: float
    upper: float
    n: int
    roi_mean: float
    roi_ci_low: float
    roi_ci_high: float


@dataclass
class BinningResult:
    metric: str
    bins: list[Bin]
    best_bin_index: int
    significant: bool           # True if best vs. worst bin passes t-test p<0.05
    note: str                   # human-readable summary


def find_optimal_range(
    df: pd.DataFrame,
    metric: str,
    target: str = "mmm_roi",
    bin_count: int = 5,
    ci_method: str = "bootstrap",   # "bootstrap" or "t"
) -> BinningResult:
    """
    Identify optimal metric range based on equal-frequency binning.

    Steps:
        1. Drop NaN rows for (metric, target).
        2. Use pd.qcut to build equal-frequency bins.
        3. For each bin, compute n, roi_mean, and 95% CI.
        4. Pick best bin (highest roi_mean).
        5. Run t-test between best and worst bins.
        6. Return BinningResult with a descriptive note.
    """
    from scipy import stats

    pair = df[[metric, target]].dropna()
    x = pair[metric].values
    y = pair[target].values
    n_total = len(pair)

    if n_total < 2:
        return BinningResult(
            metric=metric,
            bins=[],
            best_bin_index=0,
            significant=False,
            note=f"Insufficient data (n={n_total}) for binning.",
        )

    actual_bin_count = min(bin_count, n_total // 2, n_total)
    actual_bin_count = max(actual_bin_count, 1)

    x_series = pd.Series(x)
    try:
        labels = pd.qcut(x_series, q=actual_bin_count, duplicates="drop")
    except ValueError:
        labels = pd.cut(x_series, bins=actual_bin_count, duplicates="drop")

    bins: list[Bin] = []
    for interval in labels.cat.categories:
        mask = labels == interval
        roi_vals = y[mask.values]
        n_bin = int(mask.sum())

        if n_bin == 0:
            continue

        roi_mean = float(np.mean(roi_vals))

        if n_bin == 1:
            ci_low = roi_mean
            ci_high = roi_mean
        elif ci_method == "bootstrap" or n_bin < 30:
            rng = np.random.default_rng(42)
            boot_means = [np.mean(rng.choice(roi_vals, size=n_bin, replace=True)) for _ in range(1000)]
            ci_low = float(np.percentile(boot_means, 2.5))
            ci_high = float(np.percentile(boot_means, 97.5))
        else:
            sem = float(np.std(roi_vals, ddof=1) / np.sqrt(n_bin))
            t_crit = float(stats.t.ppf(0.975, df=n_bin - 1))
            ci_low = roi_mean - t_crit * sem
            ci_high = roi_mean + t_crit * sem

        bins.append(Bin(
            lower=round(float(interval.left), 4),
            upper=round(float(interval.right), 4),
            n=n_bin,
            roi_mean=round(roi_mean, 2),
            roi_ci_low=round(ci_low, 2),
            roi_ci_high=round(ci_high, 2),
        ))

    if not bins:
        return BinningResult(
            metric=metric, bins=[], best_bin_index=0, significant=False,
            note="No bins could be formed."
        )

    best_idx = int(np.argmax([b.roi_mean for b in bins]))
    worst_idx = int(np.argmin([b.roi_mean for b in bins]))

    significant = False
    if best_idx != worst_idx and len(labels.cat.categories) > best_idx and len(labels.cat.categories) > worst_idx:
        best_interval = labels.cat.categories[best_idx]
        worst_interval = labels.cat.categories[worst_idx]
        best_vals = y[(labels == best_interval).values]
        worst_vals = y[(labels == worst_interval).values]
        if len(best_vals) >= 2 and len(worst_vals) >= 2:
            _, p = stats.ttest_ind(best_vals, worst_vals)
            significant = p < 0.05

    best = bins[best_idx]
    note = (
        f"{metric} in [{best.lower:.2f}, {best.upper:.2f}] → "
        f"mean ROI = {best.roi_mean:.2f}x "
        f"(n={best.n}, 95% CI [{best.roi_ci_low:.2f}, {best.roi_ci_high:.2f}])"
    )

    return BinningResult(
        metric=metric,
        bins=bins,
        best_bin_index=best_idx,
        significant=significant,
        note=note,
    )


def decision_tree_regions(
    df: pd.DataFrame,
    metrics: list[str],
    target: str = "mmm_roi",
    max_depth: int = 3,
) -> list[dict]:
    """
    Fit a decision tree and extract leaf-level rules with ROI means.
    Only meaningful for n >= 20 (caller checks).
    """
    from sklearn.tree import DecisionTreeRegressor, _tree

    sub = df[metrics + [target]].dropna()
    X = sub[metrics].values
    y = sub[target].values
    n = len(sub)

    min_leaf = max(5, n // 10)
    tree = DecisionTreeRegressor(max_depth=max_depth, min_samples_leaf=min_leaf)
    tree.fit(X, y)

    dt = tree.tree_
    feature_names = metrics

    def traverse(node: int, conditions: list[str]) -> list[dict]:
        if dt.feature[node] == _tree.TREE_UNDEFINED:
            roi_mean = float(dt.value[node][0][0])
            n_leaf = int(dt.n_node_samples[node])
            rule = " AND ".join(conditions) if conditions else "all data"
            return [{"rule": rule, "roi_mean": round(roi_mean, 2), "n": n_leaf}]

        feat = feature_names[dt.feature[node]]
        threshold = dt.threshold[node]
        left = traverse(dt.children_left[node], conditions + [f"{feat} ≤ {threshold:.2f}"])
        right = traverse(dt.children_right[node], conditions + [f"{feat} > {threshold:.2f}"])
        return left + right

    leaves = traverse(0, [])
    leaves.sort(key=lambda x: x["roi_mean"], reverse=True)
    return leaves
