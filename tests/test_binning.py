"""Tests for analysis.binning."""

import numpy as np
import pandas as pd
import pytest

from analysis.binning import find_optimal_range


class TestFindOptimalRange:
    def test_identifies_highest_roi_bin(self):
        df = pd.DataFrame({
            "mmm_roi":    [1.0, 1.2, 1.1, 2.8, 3.0, 2.9, 1.5, 1.4, 1.6, 1.3],
            "frequency":  [1.0, 1.2, 1.5, 4.0, 4.5, 4.2, 7.0, 7.5, 8.0, 6.5],
        })
        result = find_optimal_range(df, metric="frequency", bin_count=3)
        # Best bin should be the middle one (frequency ≈ 4)
        best = result.bins[result.best_bin_index]
        assert 3.5 <= best.lower <= 4.5 or 3.5 <= best.upper <= 5.0

    def test_bin_ci_is_sensible(self):
        df = pd.DataFrame({
            "mmm_roi":   np.random.default_rng(0).normal(2.0, 0.3, 30),
            "frequency": np.linspace(1, 10, 30),
        })
        result = find_optimal_range(df, metric="frequency", bin_count=5)
        for b in result.bins:
            assert b.roi_ci_low <= b.roi_mean <= b.roi_ci_high

    def test_small_n_bootstrap_ci_used(self):
        df = pd.DataFrame({
            "mmm_roi":   [1.0, 2.0, 1.5, 2.5, 1.8, 2.2],
            "frequency": [1.0, 4.0, 2.0, 5.0, 3.0, 4.5],
        })
        # Should not raise, should produce 2–3 bins
        result = find_optimal_range(df, metric="frequency", bin_count=2,
                                    ci_method="bootstrap")
        assert len(result.bins) >= 1
