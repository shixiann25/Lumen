"""
Streamlit 入口 — TikTok 品牌广告 MMM 指标相关性分析工具
"""

from __future__ import annotations

import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
import streamlit as st

from analysis.correlation import compute_correlations, correlation_matrix
from analysis.binning import find_optimal_range, decision_tree_regions
from analysis.small_sample import route_by_sample_size
from analysis.insight import build_insight_card
from data.schema import STANDARD_FIELDS, RECOMMENDED_METRICS, REQUIRED_FIELDS
from data.validator import validate_dataframe

# 指标中文说明
METRIC_ZH = {
    "ctr":            ("CTR 点击率", "点击数 / 曝光数 × 100，单位 %"),
    "vtr_6s":         ("VTR 6秒视频观看率", "6秒以上观看数 / 曝光数，单位 %"),
    "vtr_completion": ("完播率", "完播数 / 曝光数，单位 %"),
    "cpm":            ("CPM 千次曝光成本", "每千次曝光花费，单位 USD"),
    "cpm_volatility": ("CPM 波动系数", "该周期内日均 CPM 的变异系数（std/mean），反映投放稳定性"),
    "avg_frequency":  ("平均触达频次", "曝光数 / Reach，品牌广告核心指标"),
    "reach":          ("Reach 触达人数", "独立触达用户数"),
    "impressions":    ("曝光量", "总曝光次数"),
    "spend":          ("花费 Spend", "该周期投放总花费，单位 USD"),
}

REQUIRED_ZH = {
    "period_id": ("观测周期 ID", "每行的时间标识，如 2025-W42 或 campaign_abc"),
    "mmm_roi":   ("MMM 增量 ROI", "客户 MMM 模型输出的 TikTok 增量 ROI，必须是增量值而非 last-click ROAS"),
}


def main() -> None:
    st.set_page_config(
        page_title="TikTok 品牌广告 MMM 分析工具",
        page_icon="📊",
        layout="wide",
    )

    st.title("📊 TikTok 品牌广告 MMM 指标相关性分析工具")
    st.caption("内部 PM 工具 — 分析广告投放指标与客户 MMM ROI 的相关性，快速定位最优投放区间。")

    with st.expander("ℹ️ 使用说明（点击展开）", expanded=False):
        st.markdown(
            "**使用步骤：**\n\n"
            "1. **上传数据**：上传 CSV 或 XLSX，一行 = 一个观测周期（周 / 月 / Campaign）\n"
            "2. **字段映射**：告诉工具你的列名分别对应哪个标准字段\n"
            "3. **数据质量检查**：工具自动检测缺失值、异常值等问题\n"
            "4. **选择分析参数**：相关性方法、分箱数等，工具会根据样本量自动推荐\n"
            "5. **查看结果**：相关性排序、最佳区间、Insight 卡片（可导出）\n\n"
            "**注意：** 工具不设样本量下限——即使只有 4–5 个周期也可以运行，但会自动切换为更保守的分析方法，并在结果中提示置信度。\n\n"
            "📥 下载右侧的示例模板，可以直接看到标准格式。"
        )

    # ── 第一步：上传数据 ────────────────────────────────────────────────────
    st.header("第一步：上传数据")

    col_upload, col_template = st.columns([3, 1])
    with col_upload:
        uploaded = st.file_uploader(
            "上传 CSV 或 XLSX 文件",
            type=["csv", "xlsx"],
            help="一行代表一个观测单位（周 / 月 / Campaign），文件需包含 mmm_roi 列。",
        )
    with col_template:
        st.markdown("**示例数据模板：**")
        try:
            with open("data/sample_template.csv", "rb") as f:
                st.download_button(
                    "⬇️ 下载示例模板",
                    data=f.read(),
                    file_name="sample_template.csv",
                    mime="text/csv",
                )
        except FileNotFoundError:
            st.info("示例文件未找到。")

    if uploaded is None:
        st.info("请上传数据文件后继续。")
        return

    df_raw = _read_upload(uploaded)
    st.success(f"已加载 **{len(df_raw)} 行** × **{len(df_raw.columns)} 列**。以下为前 20 行预览：")
    st.dataframe(df_raw.head(20), use_container_width=True)

    # ── 第二步：字段映射 ───────────────────────────────────────────────────
    st.header("第二步：字段映射")
    st.markdown(
        "将你文件中的列名对应到工具的标准字段。**观测周期 ID** 和 **MMM 增量 ROI** 为必填，其余为可选。\n\n"
        "> 💡 工具会根据列名自动猜测映射，请检查并手动修正。"
    )

    user_cols = list(df_raw.columns)
    mapping: dict[str, str] = {}

    st.markdown("##### 必填字段")
    req_cols = st.columns(2)
    for i, spec in enumerate(REQUIRED_FIELDS):
        zh_name, zh_desc = REQUIRED_ZH.get(spec.name, (spec.name, spec.description))
        guess = _guess_column(user_cols, spec.name)
        default_idx = user_cols.index(guess) + 1 if guess else 0
        selected = req_cols[i % 2].selectbox(
            f"**{zh_name}**（`{spec.name}`，必填）",
            options=["── 未映射 ──"] + user_cols,
            index=default_idx,
            help=zh_desc,
        )
        if selected != "── 未映射 ──":
            mapping[selected] = spec.name

    st.markdown("##### 投放指标字段（选择你数据中有的指标）")
    metric_cols_ui = st.columns(3)
    for i, spec in enumerate(RECOMMENDED_METRICS):
        zh_name, zh_desc = METRIC_ZH.get(spec.name, (spec.name, spec.description))
        guess = _guess_column(user_cols, spec.name)
        default_idx = user_cols.index(guess) + 1 if guess else 0
        selected = metric_cols_ui[i % 3].selectbox(
            f"{zh_name}（`{spec.name}`）",
            options=["── 未映射 ──"] + user_cols,
            index=default_idx,
            help=f"{zh_desc}（单位：{spec.unit or '无'}）",
        )
        if selected != "── 未映射 ──":
            mapping[selected] = spec.name

    st.markdown("##### 自定义指标（可选）")
    custom_cols = [c for c in user_cols if c not in mapping]
    custom_selected = st.multiselect(
        "将未映射的列加入分析（作为自定义指标）",
        options=custom_cols,
        help="适合添加客户特有的自定义指标列。",
    )
    for col in custom_selected:
        mapping[col] = col

    st.markdown("---")
    roi_confirmed = st.checkbox(
        "✅ 我确认 **mmm_roi** 列填写的是 **增量 ROI**（Incremental ROI），而非 last-click ROAS 或百分比格式。",
        value=False,
    )

    if not roi_confirmed:
        st.warning("请勾选上方确认框后继续。MMM ROI 的口径确认非常重要，会直接影响分析结论。")
        return

    # ── 第三步：数据质量检查 ───────────────────────────────────────────────
    st.header("第三步：数据质量检查")
    report = validate_dataframe(df_raw, mapping)

    if report.has_errors:
        for issue in report.issues:
            if issue.severity == "error":
                st.error(f"**{issue.column}**：{issue.message}")
        st.stop()

    for issue in report.issues:
        if issue.severity == "warning":
            st.warning(f"**{issue.column}**：{issue.message}")
        elif issue.severity == "info":
            st.info(f"**{issue.column}**：{issue.message}")

    if not report.issues:
        st.success("✅ 数据质量检查通过，未发现问题。")

    rename_map = {user_col: std_name for user_col, std_name in mapping.items()}
    df = df_raw.rename(columns=rename_map)

    metric_cols = [
        v for k, v in mapping.items()
        if v not in ("period_id", "mmm_roi")
        and pd.api.types.is_numeric_dtype(df_raw[k])
    ]
    target = "mmm_roi"
    n = len(df)

    plan = route_by_sample_size(n)
    if plan.banner_message:
        st.warning(plan.banner_message)

    # ── 第四步：分析参数设置 ───────────────────────────────────────────────
    st.header("第四步：分析参数设置")
    st.markdown(
        f"当前样本量 **n={n}**，工具已自动推荐适合的方法（**{plan.tier}** 档位）。你可以手动调整。"
    )

    METHOD_ZH = {
        "kendall":  "Kendall τ（小样本最稳健，推荐 n<20）",
        "spearman": "Spearman 秩相关（非线性友好，推荐 n≥10）",
        "pearson":  "Pearson 线性相关（要求近似正态，推荐 n≥30）",
    }

    col_a, col_b, col_c = st.columns(3)
    with col_a:
        primary_method = st.selectbox(
            "主相关性方法",
            options=plan.correlation_methods,
            format_func=lambda m: METHOD_ZH.get(m, m),
            index=0,
            help="工具同时计算多种方法，这里选择主图展示哪种。",
        )
    with col_b:
        bin_count = st.slider(
            "最优区间分箱数",
            min_value=2,
            max_value=10,
            value=plan.bin_count if plan.binning_enabled else 3,
            disabled=not plan.binning_enabled,
            help="将指标范围分成几段来比较 ROI。样本少时建议用 2–3 箱。",
        )
    with col_c:
        control_spend = st.checkbox(
            "控制花费（Spend）的影响",
            value=True,
            help="勾选后会先把 Spend 对 ROI 的线性影响剔除（偏相关），再做指标相关分析，减少混淆。推荐开启。",
        )

    case_name = st.text_input(
        "Case 名称（用于 Insight 卡片标题）",
        value=f"客户分析 — n={n}",
        help="填写客户名称或分析周期，方便导出后识别。",
    )

    run_btn = st.button("▶️ 开始分析", type="primary")
    if not run_btn:
        return

    # ── 分析计算 ──────────────────────────────────────────────────────────
    with st.spinner("正在计算，请稍候..."):
        df_analysis = df[[target] + metric_cols].copy()

        if control_spend and "spend" in metric_cols:
            df_analysis = _partial_out_spend(df_analysis, metric_cols, target)

        analysis_metrics = [m for m in metric_cols if m != "spend"]

        correlations = compute_correlations(
            df_analysis,
            target=target,
            metrics=analysis_metrics,
            methods=plan.correlation_methods,
        )

        best_ranges: list = []
        if plan.binning_enabled:
            for m in analysis_metrics:
                try:
                    result = find_optimal_range(
                        df_analysis, metric=m, target=target,
                        bin_count=bin_count,
                        ci_method="bootstrap" if plan.use_bootstrap_ci else "t",
                    )
                    best_ranges.append(result)
                except Exception:
                    pass

        dt_regions: list[dict] = []
        if plan.tier == "large" and len(analysis_metrics) >= 2:
            try:
                dt_regions = decision_tree_regions(
                    df_analysis,
                    metrics=analysis_metrics,
                    target=target,
                )
            except Exception:
                pass

    # ── 第五步：结果展示 ───────────────────────────────────────────────────
    st.header("第五步：分析结果")
    tab_corr, tab_range, tab_insight = st.tabs(
        ["📈 相关性分析", "🎯 最优投放区间", "📋 Insight 卡片"]
    )

    # ── Tab A：相关性分析 ──────────────────────────────────────────────────
    with tab_corr:
        st.subheader("各指标与 MMM ROI 的相关性")
        st.caption(
            "绿色 = 正相关（指标高时 ROI 也高），红色 = 负相关。"
            "柱越长代表相关性越强。鼠标悬停可查看详细数值。"
        )

        if not correlations:
            st.info("未计算出相关性结果。请检查指标列是否为数值类型且已正确映射。")
        else:
            primary_results = [r for r in correlations if r.method == primary_method]
            if not primary_results:
                primary_results = correlations

            fig_bar = _make_correlation_bar(primary_results, plan.show_p_values)
            st.plotly_chart(fig_bar, use_container_width=True)

            # 图下自动 insight
            _render_correlation_insight(primary_results, plan.show_p_values, n)

            with st.expander("📊 查看完整相关性数据表", expanded=False):
                rows = []
                for r in correlations:
                    rows.append({
                        "指标": r.metric,
                        "方法": METHOD_ZH.get(r.method, r.method),
                        "相关系数": r.coefficient,
                        "p 值": r.p_value if plan.show_p_values else "不适用（n<6）",
                        "FDR 校正 p": r.p_value_adjusted if r.p_value_adjusted is not None else "—",
                        "样本量 n": r.n,
                        "非线性提示": "⚠️ 可能非线性" if r.nonlinearity_flag else "",
                    })
                st.dataframe(pd.DataFrame(rows), use_container_width=True)
                st.caption(
                    "p 值说明：✅ p<0.05（显著） 🟡 0.05≤p<0.10（边缘显著） ⬜ p≥0.10（不显著）\n\n"
                    "当同时分析 ≥5 个指标时，p 值已做 Benjamini-Hochberg FDR 多重检验校正，减少假阳性。"
                )

            if len(analysis_metrics) >= 2:
                st.subheader("指标间相关性热力图（多重共线性检查）")
                st.caption("如果两个指标之间相关性很高（深红或深蓝），说明它们信息重叠，解读时需注意。")
                avail = [m for m in analysis_metrics if m in df_analysis.columns]
                corr_mat = correlation_matrix(df_analysis, avail, method=primary_method)
                fig_heat = px.imshow(
                    corr_mat,
                    color_continuous_scale="RdBu_r",
                    zmin=-1, zmax=1,
                    text_auto=".2f",
                    title=f"指标两两相关性（{METHOD_ZH.get(primary_method, primary_method)}）",
                )
                st.plotly_chart(fig_heat, use_container_width=True)

        if n < 10:
            st.subheader("原始数据点（小样本下供人工核查）")
            st.caption("样本量较小，建议逐行核查是否有异常周（大促、竞品活动、素材大换）。")
            st.dataframe(df[[target] + metric_cols], use_container_width=True)
            st.subheader("散点图：各指标 vs MMM ROI")
            for m in analysis_metrics[:6]:
                zh_label = METRIC_ZH.get(m, (m,))[0]
                fig_sc = px.scatter(
                    df_analysis, x=m, y=target,
                    trendline="ols" if n >= 4 else None,
                    title=f"{zh_label}（{m}）vs MMM ROI",
                    labels={m: zh_label, target: "MMM ROI"},
                )
                st.plotly_chart(fig_sc, use_container_width=True)

    # ── Tab B：最优区间 ─────────────────────────────────────────────────────
    with tab_range:
        st.subheader("指标最优投放区间")
        st.caption(
            "将指标按数值范围分箱，比较各区间内的平均 MMM ROI，绿色柱为 ROI 最高的区间。"
            "误差线为 95% 置信区间。"
        )

        if not plan.binning_enabled:
            st.warning(
                f"当前样本量 n={n}（需要 n≥6 才能做分箱分析）。"
                "请在「相关性分析」标签页查看散点图，进行人工判断。"
            )
        elif not best_ranges:
            st.info("暂无分箱结果，请检查指标列是否有有效数值。")
        else:
            metric_options = [br.metric for br in best_ranges]
            metric_labels = [f"{METRIC_ZH.get(m, (m,))[0]}（{m}）" for m in metric_options]
            selected_label = st.selectbox("选择要查看的指标", options=metric_labels)
            selected_metric = metric_options[metric_labels.index(selected_label)]

            br = next((b for b in best_ranges if b.metric == selected_metric), None)
            if br and br.bins:
                fig_bins = _make_bin_chart(br)
                st.plotly_chart(fig_bins, use_container_width=True)

                # 图下自动 insight
                _render_binning_insight(br, n)

                best = br.bins[br.best_bin_index]
                st.success(f"**最优区间：** {br.note}")
                if br.significant:
                    st.info("✅ 最优区间与最差区间的 ROI 差异统计显著（t 检验 p<0.05）。")
                else:
                    st.warning("⚠️ 最优与最差区间的 ROI 差异尚不显著（t 检验 p≥0.05），结论仅供参考。")

                with st.expander("查看各分箱详情", expanded=False):
                    bin_rows = [
                        {
                            "区间": f"[{b.lower:.2f}, {b.upper:.2f}]",
                            "样本数 n": b.n,
                            "平均 ROI": b.roi_mean,
                            "95% CI 下限": b.roi_ci_low,
                            "95% CI 上限": b.roi_ci_high,
                            "最优?": "⭐" if i == br.best_bin_index else "",
                        }
                        for i, b in enumerate(br.bins)
                    ]
                    st.dataframe(pd.DataFrame(bin_rows), use_container_width=True)

        if dt_regions:
            st.subheader("多指标联合规则（决策树，深度 ≤ 3）")
            st.caption(
                "以下是决策树识别出的高 ROI 叶节点，每行代表一种指标组合条件。"
                "按平均 ROI 降序排列。"
            )
            dt_rows = [
                {"条件规则": r["rule"], "平均 ROI": r["roi_mean"], "样本数 n": r["n"]}
                for r in dt_regions
            ]
            st.dataframe(pd.DataFrame(dt_rows).head(10), use_container_width=True)

    # ── Tab C：Insight 卡片 ──────────────────────────────────────────────────
    with tab_insight:
        st.subheader("Insight 卡片")
        st.caption("自动生成结构化结论，可一键复制或下载为 Markdown 文件，直接用于客户 QBR 或内部复盘。")

        insight_md = build_insight_card(
            case_name=case_name,
            n=n,
            correlations=correlations,
            best_ranges=best_ranges,
        )
        st.markdown(insight_md)
        st.markdown("---")
        col_view, col_dl = st.columns(2)
        with col_view:
            st.text_area("复制 Markdown 原文", value=insight_md, height=300)
        with col_dl:
            st.download_button(
                "⬇️ 下载 .md 文件",
                data=insight_md.encode("utf-8"),
                file_name=f"{case_name.replace(' ', '_')}_insight.md",
                mime="text/markdown",
            )


# ── 辅助函数 ───────────────────────────────────────────────────────────────

def _read_upload(uploaded) -> pd.DataFrame:
    if uploaded.name.endswith(".csv"):
        return pd.read_csv(uploaded)
    return pd.read_excel(uploaded)


def _guess_column(cols: list[str], standard_name: str) -> str | None:
    lower_cols = {c.lower(): c for c in cols}
    for variant in [standard_name, standard_name.replace("_", ""), standard_name.replace("_", " ")]:
        if variant.lower() in lower_cols:
            return lower_cols[variant.lower()]
    return None


def _partial_out_spend(df: pd.DataFrame, metric_cols: list[str], target: str) -> pd.DataFrame:
    from sklearn.linear_model import LinearRegression

    if "spend" not in df.columns or df["spend"].isna().all():
        return df

    df2 = df.copy()
    spend = df2["spend"].fillna(df2["spend"].median()).values.reshape(-1, 1)

    for col in [target] + [m for m in metric_cols if m != "spend"]:
        y = df2[col].values
        mask = ~pd.isna(y)
        if mask.sum() < 3:
            continue
        lr = LinearRegression().fit(spend[mask], y[mask])
        residuals = y.copy().astype(float)
        residuals[mask] = y[mask] - lr.predict(spend[mask])
        df2[col] = residuals

    return df2


def _make_correlation_bar(results, show_p_values: bool):
    METHOD_ZH_SHORT = {"kendall": "Kendall τ", "spearman": "Spearman ρ", "pearson": "Pearson r"}
    metrics = [r.metric for r in results]
    coefs = [r.coefficient for r in results]
    colors = ["#00BFA5" if c > 0 else "#EF5350" for c in coefs]

    hover_texts = []
    for r in results:
        parts = [
            f"指标：{r.metric}",
            f"方法：{METHOD_ZH_SHORT.get(r.method, r.method)}",
            f"相关系数：{r.coefficient:+.2f}",
            f"样本量 n：{r.n}",
        ]
        if show_p_values and r.p_value is not None:
            parts.append(f"p 值：{r.p_value:.4f}")
            if r.p_value_adjusted is not None:
                parts.append(f"FDR 校正 p：{r.p_value_adjusted:.4f}")
        else:
            parts.append("p 值：不适用（n<6）")
        if r.nonlinearity_flag:
            parts.append("⚠️ 注意：Pearson 与 Spearman 差异 >0.2，可能存在非线性关系")
        hover_texts.append("<br>".join(parts))

    fig = go.Figure(go.Bar(
        x=coefs,
        y=metrics,
        orientation="h",
        marker_color=colors,
        hovertext=hover_texts,
        hoverinfo="text",
    ))
    fig.update_layout(
        title="各指标与 MMM ROI 的相关系数（按绝对值降序）",
        xaxis_title="相关系数",
        yaxis_title="",
        xaxis=dict(range=[-1, 1]),
        height=max(300, len(metrics) * 40 + 100),
    )
    return fig


def _make_bin_chart(br):
    labels = [f"[{b.lower:.2f}, {b.upper:.2f}]\nn={b.n}" for b in br.bins]
    means = [b.roi_mean for b in br.bins]
    ci_lows = [b.roi_ci_low for b in br.bins]
    ci_highs = [b.roi_ci_high for b in br.bins]
    colors = ["#00BFA5" if i == br.best_bin_index else "#78909C" for i in range(len(br.bins))]

    fig = go.Figure(go.Bar(
        x=labels,
        y=means,
        marker_color=colors,
        error_y=dict(
            type="data",
            symmetric=False,
            array=[h - m for m, h in zip(means, ci_highs)],
            arrayminus=[m - l for m, l in zip(means, ci_lows)],
        ),
        hovertemplate="区间：%{x}<br>平均 ROI：%{y:.2f}x<extra></extra>",
    ))
    fig.update_layout(
        title=f"{br.metric} 各区间的平均 MMM ROI（绿色 = 最优区间）",
        xaxis_title=br.metric,
        yaxis_title="平均 MMM ROI",
    )
    return fig


def _render_correlation_insight(results, show_p_values: bool, n: int) -> None:
    """在相关性图下方渲染自动解读文字。"""
    from analysis.small_sample import language_mode_for
    from analysis.insight import format_correlation_bullet

    mode = language_mode_for(n)

    if not results:
        return

    top = results[0]
    bottom = results[-1]

    lines = []

    if mode == "descriptive":
        lines.append(f"**📌 图表解读：** 在当前 {n} 个数据点中，观察到以下趋势模式（置信度低，仅供方向参考）：")
    elif mode == "hedged":
        lines.append(f"**📌 图表解读（小样本 n={n}，初步参考）：**")
    else:
        lines.append("**📌 图表解读：**")

    # 最强正相关
    pos = [r for r in results if r.coefficient > 0]
    neg = [r for r in results if r.coefficient < 0]

    if pos:
        top_pos = pos[0]
        p_note = ""
        if show_p_values and top_pos.p_value is not None:
            if top_pos.p_value < 0.05:
                p_note = "（统计显著 ✅）"
            elif top_pos.p_value < 0.1:
                p_note = "（边缘显著 🟡）"
            else:
                p_note = "（不显著 ⬜）"
        lines.append(
            f"- **与 ROI 正相关最强的指标是 `{top_pos.metric}`**，相关系数 {top_pos.coefficient:+.2f}{p_note}。"
            f"{'这意味着该指标数值越高，MMM ROI 往往越高。' if mode == 'standard' else '该指标数值较高时，ROI 也倾向于偏高。'}"
        )

    if neg:
        top_neg = neg[0]
        p_note = ""
        if show_p_values and top_neg.p_value is not None:
            if top_neg.p_value < 0.05:
                p_note = "（统计显著 ✅）"
            elif top_neg.p_value < 0.1:
                p_note = "（边缘显著 🟡）"
            else:
                p_note = "（不显著 ⬜）"
        lines.append(
            f"- **与 ROI 负相关最强的指标是 `{top_neg.metric}`**，相关系数 {top_neg.coefficient:+.2f}{p_note}。"
            f"{'该指标数值越高，MMM ROI 往往越低，需重点关注。' if mode == 'standard' else '该指标数值较高时，ROI 倾向于偏低。'}"
        )

    weak = [r for r in results if abs(r.coefficient) < 0.2]
    if weak:
        weak_names = "、".join([f"`{r.metric}`" for r in weak[:3]])
        lines.append(
            f"- {weak_names} 的相关性较弱（|系数| < 0.2），"
            f"{'当前数据中不建议作为主要优化杠杆。' if mode == 'standard' else '暂不建议单独作为优化依据。'}"
        )

    nl_flags = [r for r in results if r.nonlinearity_flag]
    if nl_flags:
        nl_names = "、".join([f"`{r.metric}`" for r in nl_flags])
        lines.append(
            f"- ⚠️ {nl_names} 的 Pearson 与 Spearman 系数差异 > 0.2，可能存在非线性关系，建议结合散点图判断。"
        )

    with st.container(border=True):
        for line in lines:
            st.markdown(line)


def _render_binning_insight(br, n: int) -> None:
    """在分箱图下方渲染自动解读文字。"""
    from analysis.small_sample import language_mode_for

    mode = language_mode_for(n)

    if not br.bins:
        return

    best = br.bins[br.best_bin_index]
    worst_roi = min(b.roi_mean for b in br.bins)
    roi_lift = ((best.roi_mean - worst_roi) / worst_roi * 100) if worst_roi > 0 else 0

    lines = []

    if mode == "descriptive":
        lines.append(f"**📌 区间解读（极小样本 n={n}，仅供方向参考）：**")
        lines.append(
            f"- 在当前数据中，`{br.metric}` 处于 **{best.lower:.2f}–{best.upper:.2f}** 时，"
            f"观察到的 ROI 均值（{best.roi_mean:.2f}x）相对最高。"
        )
        lines.append("- 数据点极少，该区间仅为观察模式，无统计意义，需谨慎引用。")
    elif mode == "hedged":
        lines.append(f"**📌 区间解读（小样本 n={n}，初步参考）：**")
        lines.append(
            f"- `{br.metric}` 在 **{best.lower:.2f}–{best.upper:.2f}** 区间内，"
            f"ROI 均值为 {best.roi_mean:.2f}x（95% CI：{best.roi_ci_low:.2f}–{best.roi_ci_high:.2f}，n={best.n}）。"
        )
        lines.append(
            f"- 与最差区间相比，ROI 高出约 {roi_lift:.0f}%，"
            f"但{'差异统计显著' if br.significant else '差异尚不显著（p≥0.05）'}，建议积累更多数据后确认。"
        )
    else:
        lines.append("**📌 区间解读：**")
        lines.append(
            f"- `{br.metric}` 的最优投放区间为 **{best.lower:.2f}–{best.upper:.2f}**，"
            f"该区间均值 ROI = {best.roi_mean:.2f}x（n={best.n}，95% CI：{best.roi_ci_low:.2f}–{best.roi_ci_high:.2f}）。"
        )
        lines.append(
            f"- 与最差区间相比，ROI 提升约 {roi_lift:.0f}%；"
            + ("差异统计显著（t 检验 p<0.05）✅，结论相对可靠。" if br.significant else "但差异尚不显著（p≥0.05），建议结合业务经验判断。")
        )
        lines.append(
            f"- **优化建议假设：** 在下一个投放周期，将 `{br.metric}` 控制在 {best.lower:.2f}–{best.upper:.2f} 范围内，"
            f"观察 MMM ROI 是否提升——注意需通过 A/B 测试验证，排除混淆因素。"
        )

    with st.container(border=True):
        for line in lines:
            st.markdown(line)


if __name__ == "__main__":
    main()
