"""Tests for analysis.correlation."""

import numpy as np
import pandas as pd
import pytest

from analysis.correlation import compute_correlations


@pytest.fixture
def small_df():
    """n=5 dataset with a clear monotonic relationship between x1 and roi."""
    return pd.DataFrame({
        "period_id": [f"W{i}" for i in range(1, 6)],
        "mmm_roi":   [1.0, 1.5, 2.0, 2.5, 3.0],
        "x1":        [1.0, 2.0, 3.0, 4.0, 5.0],   # perfect positive
        "x2":        [5.0, 4.0, 3.0, 2.0, 1.0],   # perfect negative
        "x3":        [1.0, 1.0, 1.0, 1.0, 1.0],   # no variance (should be skipped or NaN)
    })


class TestComputeCorrelations:
    def test_n5_no_pvalues(self, small_df):
        results = compute_correlations(
            small_df, target="mmm_roi", metrics=["x1", "x2"]
        )
        for r in results:
            assert r.n == 5
            assert r.p_value is None   # PRD §4.3: n<6 no p-value

    def test_sorted_by_abs_coefficient(self, small_df):
        results = compute_correlations(
            small_df, target="mmm_roi", metrics=["x1", "x2"]
        )
        coefs = [abs(r.coefficient) for r in results]
        assert coefs == sorted(coefs, reverse=True)

    def test_kendall_positive_correlation_detected(self, small_df):
        results = compute_correlations(
            small_df, target="mmm_roi", metrics=["x1"],
            methods=["kendall"],
        )
        r = [r for r in results if r.metric == "x1" and r.method == "kendall"][0]
        assert r.coefficient > 0.9
