"""
Insight 卡片生成（Markdown 格式）。

见 PRD §3.3 Tab C 和附录 B。

核心要求：小样本时语言必须降级（见 PRD §4.3）。
"""

from __future__ import annotations

from analysis.correlation import CorrelationResult
from analysis.binning import BinningResult
from analysis.small_sample import language_mode_for

DISCLAIMER = (
    "⚠️ **免责声明**：以下为相关性分析结果，相关性 ≠ 因果关系。"
    "MMM ROI 可能同时受季节性、预算规模、竞品活动等外部因素驱动。"
    "本结论仅作为假设发现，需通过 A/B 测试或增量测试验证后方可指导客户优化。"
)

SMALL_SAMPLE_WARNING = (
    "⚠️ **小样本预警（n={n}）**：当前数据点较少，统计结论置信度低。"
    "以下结果为观察到的初步模式，建议结合业务判断，并排查是否有异常周（大促、竞品活动、素材大换）。"
)


def build_insight_card(
    case_name: str,
    n: int,
    correlations: list[CorrelationResult],
    best_ranges: list[BinningResult],
) -> str:
    """
    生成 Markdown 格式的 Insight 卡片，语言根据样本量自动降级。
    """
    mode = language_mode_for(n)
    lines: list[str] = []

    lines.append(f"# {case_name}\n")
    lines.append(DISCLAIMER)
    lines.append("")

    if n < 10:
        lines.append(SMALL_SAMPLE_WARNING.format(n=n))
        lines.append("")

    lines.append("## 核心发现\n")

    if not correlations:
        lines.append("_暂无相关性结果。_")
    else:
        seen: set[str] = set()
        for r in correlations:
            if r.metric in seen:
                continue
            seen.add(r.metric)
            lines.append(format_correlation_bullet(r, mode))

    lines.append("")

    if n >= 6 and best_ranges:
        lines.append("## 最优投放区间\n")
        for br in best_ranges:
            if not br.bins:
                continue
            best = br.bins[br.best_bin_index]
            if mode == "standard":
                prefix = f"**{br.metric}** 最优区间"
            else:
                prefix = f"**{br.metric}** 初步建议区间"
            sig_note = "（与最差区间差异显著 ✅）" if br.significant else "（差异尚不显著，仅供参考 ⚠️）"
            lines.append(
                f"- {prefix} **[{best.lower:.2f}, {best.upper:.2f}]** — "
                f"区间均值 ROI = {best.roi_mean:.2f}x "
                f"（n={best.n}，95% CI [{best.roi_ci_low:.2f}, {best.roi_ci_high:.2f}]）{sig_note}"
            )
        lines.append("")
    elif n < 6:
        lines.append("## 原始数据点\n")
        lines.append('_n<6 时不做分箱分析，请在「相关性分析」标签页查看散点图，人工判断趋势方向。_')
        lines.append("")

    lines.append("## 优化假设（待验证）\n")
    seen2: set[str] = set()
    for br in best_ranges:
        if not br.bins or br.metric in seen2:
            continue
        seen2.add(br.metric)
        best = br.bins[br.best_bin_index]
        lines.append(
            f"- 建议测试：将 **{br.metric}** 维持在 {best.lower:.2f}–{best.upper:.2f} 区间——"
            f"需通过 A/B 或增量测试验证后再推广。"
        )

    return "\n".join(lines)


def format_correlation_bullet(r: CorrelationResult, mode: str) -> str:
    """根据语言模式格式化单条相关性结论。"""
    direction_zh = "正相关" if r.coefficient > 0 else "负相关"
    method_label = {
        "pearson": "Pearson r",
        "spearman": "Spearman ρ",
        "kendall": "Kendall τ",
    }.get(r.method, r.method)

    if mode == "descriptive":
        move = "同向变动" if r.coefficient > 0 else "反向变动"
        return (
            f"- **{r.metric}** 与 MMM ROI 呈 {move}趋势 "
            f"（{method_label} = {r.coefficient:+.2f}，n={r.n}）——观察到{direction_zh}模式"
        )
    elif mode == "hedged":
        p_str = f"p={r.p_value:.3f}" if r.p_value is not None else "p=不适用"
        flag = " ⚠️ *低功效*" if r.p_value is not None and r.p_value > 0.1 else ""
        return (
            f"- **{r.metric}**：{method_label} = {r.coefficient:+.2f}（{p_str}，n={r.n}）"
            f"{flag} — 初步呈{direction_zh}"
        )
    else:
        p_str = f"p={r.p_value:.3f}" if r.p_value is not None else "p=不适用"
        p_adj_str = f"，FDR 校正 p={r.p_value_adjusted:.3f}" if r.p_value_adjusted is not None else ""
        sig = ""
        if r.p_value is not None:
            if r.p_value < 0.05:
                sig = " ✅"
            elif r.p_value < 0.1:
                sig = " 🟡"
            else:
                sig = " ⬜"
        nl_flag = " ⚠️ *注意：可能存在非线性关系*" if r.nonlinearity_flag else ""
        return (
            f"- **{r.metric}**：{method_label} = {r.coefficient:+.2f}（{p_str}{p_adj_str}，n={r.n}）{sig}{nl_flag}"
        )
