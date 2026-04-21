"""
小样本自适应路由逻辑 — 本工具的核心设计。

见 PRD §4.3。

规则：永不硬拒。根据 n 自动调整方法和语言措辞。

    n < 6    → Kendall τ + 散点图，不分箱，不展示 p 值，描述性语言
    6–9      → Kendall + Spearman，2–3 粗分箱，bootstrap CI，"低功效"提示
    10–19    → Spearman 为主，3 箱，bootstrap CI，"小样本"提示
    20–49    → Spearman + Pearson，5 箱，标准展示
    ≥ 50     → 全方法，5 箱 + 决策树，全功能
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Literal

SampleTier = Literal["micro", "tiny", "small", "medium", "large"]


@dataclass
class SamplePlan:
    """根据样本量决定的分析方案。"""
    tier: SampleTier
    n: int
    correlation_methods: list[str]
    show_p_values: bool
    binning_enabled: bool
    bin_count: int
    use_bootstrap_ci: bool
    language_mode: Literal["descriptive", "hedged", "standard"]
    banner_message: str


def route_by_sample_size(n: int) -> SamplePlan:
    """
    根据样本量 n 选择分析方案。

    边界条件：
        - n < 3：允许运行，但发出强烈警告
        - n == None 或 n <= 0：抛出 ValueError
    """
    if n is None or n <= 0:
        raise ValueError(f"样本量必须为正整数，当前值为 {n}")

    if n < 6:
        return SamplePlan(
            tier="micro",
            n=n,
            correlation_methods=["kendall"],
            show_p_values=False,
            binning_enabled=False,
            bin_count=0,
            use_bootstrap_ci=False,
            language_mode="descriptive",
            banner_message=(
                f"⚠️ **极小样本（n={n}）**：统计推断可靠性很低。"
                "结果仅展示观察到的趋势模式，不代表统计显著性。"
                "所有原始数据点将直接展示，建议逐行核查。"
                "相关性方法：Kendall τ（小样本最稳健）。不展示 p 值。"
            ),
        )
    elif n < 10:
        return SamplePlan(
            tier="tiny",
            n=n,
            correlation_methods=["kendall", "spearman"],
            show_p_values=True,
            binning_enabled=True,
            bin_count=2,
            use_bootstrap_ci=True,
            language_mode="hedged",
            banner_message=(
                f"⚠️ **小样本（n={n}）**：统计功效较低，p 值仅供参考。"
                "置信区间采用 bootstrap 重抽样（1000 次）。"
                "分箱数限制为 2 箱（粗分箱），结论请结合业务判断。"
            ),
        )
    elif n < 20:
        return SamplePlan(
            tier="small",
            n=n,
            correlation_methods=["spearman", "kendall"],
            show_p_values=True,
            binning_enabled=True,
            bin_count=3,
            use_bootstrap_ci=True,
            language_mode="hedged",
            banner_message=(
                f"⚠️ **小样本（n={n}）**：置信区间采用 bootstrap 重抽样，结论为初步参考。"
                "推荐方法：Spearman 秩相关。"
            ),
        )
    elif n < 50:
        return SamplePlan(
            tier="medium",
            n=n,
            correlation_methods=["spearman", "pearson"],
            show_p_values=True,
            binning_enabled=True,
            bin_count=5,
            use_bootstrap_ci=False,
            language_mode="standard",
            banner_message="",
        )
    else:
        return SamplePlan(
            tier="large",
            n=n,
            correlation_methods=["spearman", "pearson", "kendall"],
            show_p_values=True,
            binning_enabled=True,
            bin_count=5,
            use_bootstrap_ci=False,
            language_mode="standard",
            banner_message="",
        )


def language_mode_for(n: int) -> Literal["descriptive", "hedged", "standard"]:
    """快捷函数：根据 n 返回语言模式，供 insight.py 使用。"""
    if n < 6:
        return "descriptive"
    if n < 20:
        return "hedged"
    return "standard"
