"""Tests for analysis.small_sample — THE critical behavioral spec."""

import pytest

from analysis.small_sample import route_by_sample_size, language_mode_for


class TestRouteBySampleSize:
    def test_micro_n4_returns_kendall_no_binning_no_pvalues(self):
        plan = route_by_sample_size(4)
        assert plan.tier == "micro"
        assert "kendall" in plan.correlation_methods
        assert plan.show_p_values is False
        assert plan.binning_enabled is False
        assert plan.language_mode == "descriptive"

    def test_tiny_n7_returns_coarse_bins_and_bootstrap(self):
        plan = route_by_sample_size(7)
        assert plan.tier == "tiny"
        assert plan.binning_enabled is True
        assert 2 <= plan.bin_count <= 3
        assert plan.use_bootstrap_ci is True
        assert plan.language_mode == "hedged"

    def test_small_n15_uses_spearman_and_3_bins(self):
        plan = route_by_sample_size(15)
        assert plan.tier == "small"
        assert "spearman" in plan.correlation_methods
        assert plan.bin_count == 3
        assert plan.language_mode == "hedged"

    def test_medium_n30_enables_pearson_and_5_bins(self):
        plan = route_by_sample_size(30)
        assert plan.tier == "medium"
        assert "pearson" in plan.correlation_methods
        assert plan.bin_count == 5
        assert plan.language_mode == "standard"

    def test_large_n100_full_features(self):
        plan = route_by_sample_size(100)
        assert plan.tier == "large"
        assert plan.bin_count == 5
        assert plan.language_mode == "standard"

    def test_n3_still_allowed_with_warning(self):
        """Explicit contract from PRD §4.3: never hard-block."""
        plan = route_by_sample_size(3)
        assert plan is not None
        assert plan.banner_message  # non-empty warning

    def test_n_zero_raises(self):
        with pytest.raises(ValueError):
            route_by_sample_size(0)


class TestLanguageMode:
    @pytest.mark.parametrize("n, expected", [
        (3, "descriptive"),
        (5, "descriptive"),
        (6, "hedged"),
        (19, "hedged"),
        (20, "standard"),
        (100, "standard"),
    ])
    def test_thresholds(self, n, expected):
        assert language_mode_for(n) == expected
