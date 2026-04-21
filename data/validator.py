"""
数据质量校验。

见 PRD §5.3。
不设样本量硬阻断（PRD §4.3），样本路由由 analysis.small_sample 处理。
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Literal

import pandas as pd

Severity = Literal["info", "warning", "error"]


@dataclass
class ValidationIssue:
    column: str | None
    severity: Severity
    message: str


@dataclass
class ValidationReport:
    n_rows: int
    n_columns: int
    issues: list[ValidationIssue] = field(default_factory=list)

    @property
    def has_errors(self) -> bool:
        return any(i.severity == "error" for i in self.issues)


def validate_dataframe(
    df: pd.DataFrame,
    mapping: dict[str, str],          # 用户列名 -> 标准字段名
    target: str = "mmm_roi",
) -> ValidationReport:
    """
    按 PRD §5.3 执行数据质量校验。
    不设样本量下限，路由逻辑在 analysis.small_sample 中处理。
    """
    report = ValidationReport(n_rows=len(df), n_columns=len(df.columns))

    # 反向映射：标准字段名 -> 用户列名
    rev = {v: k for k, v in mapping.items()}

    # 1. 必填字段检查
    for req in ("period_id", target):
        if req not in rev or rev[req] not in df.columns:
            report.issues.append(ValidationIssue(
                column=req, severity="error",
                message=f"必填字段「{req}」未映射或文件中不存在，请检查字段映射。"
            ))

    if report.has_errors:
        return report

    period_col = rev["period_id"]
    roi_col = rev[target]

    # 2. period_id 唯一性
    dupes = df[period_col].duplicated()
    if dupes.any():
        report.issues.append(ValidationIssue(
            column=period_col, severity="error",
            message=f"观测周期 ID 存在重复值：{df[period_col][dupes].tolist()}，请去重后重新上传。"
        ))

    # 3. 指标列质量
    metric_user_cols = [
        k for k, v in mapping.items()
        if v not in ("period_id", target) and k in df.columns
    ]
    for col in metric_user_cols:
        series = df[col]

        # 3a. 缺失率
        missing_rate = series.isna().mean()
        if missing_rate > 0.3:
            report.issues.append(ValidationIssue(
                column=col, severity="warning",
                message=f"列「{col}」缺失率为 {missing_rate:.0%}，超过 30%，建议考虑剔除该列。"
            ))

        # 3b. 零方差
        if series.dropna().nunique() <= 1:
            report.issues.append(ValidationIssue(
                column=col, severity="info",
                message=f"列「{col}」方差为零（所有值相同），无分析价值，将被忽略。"
            ))
            continue

        # 3c. IQR 异常值
        numeric = pd.to_numeric(series, errors="coerce").dropna()
        if len(numeric) > 0:
            q1, q3 = numeric.quantile(0.25), numeric.quantile(0.75)
            iqr = q3 - q1
            outliers = numeric[(numeric < q1 - 1.5 * iqr) | (numeric > q3 + 1.5 * iqr)]
            if len(outliers) > 0:
                report.issues.append(ValidationIssue(
                    column=col, severity="info",
                    message=f"列「{col}」检测到 {len(outliers)} 个潜在异常值（IQR×1.5 规则），建议在分析前核查这些数据点。"
                ))

    # 4. mmm_roi 合理性校验
    roi = pd.to_numeric(df[roi_col], errors="coerce")
    neg = int((roi < 0).sum())
    if neg > 0:
        report.issues.append(ValidationIssue(
            column=roi_col, severity="warning",
            message=f"{neg} 行的 MMM ROI 为负数。负增量 ROI 理论上存在，请确认是否符合预期（而非数据填写错误）。"
        ))
    high = int((roi > 20).sum())
    if high > 0:
        report.issues.append(ValidationIssue(
            column=roi_col, severity="warning",
            message=f"{high} 行的 MMM ROI > 20，可能存在单位错误（预期为倍数如 2.5x，而非百分比如 250）。"
        ))

    # 5. 时间周期间隔一致性（尽力检测）
    try:
        dates = pd.to_datetime(df[period_col], errors="coerce").dropna().sort_values()
        if len(dates) >= 3:
            diffs = dates.diff().dropna().dt.days
            if diffs.std() > diffs.mean() * 0.3:
                report.issues.append(ValidationIssue(
                    column=period_col, severity="warning",
                    message="观测周期时间间隔不均匀，请确保所有行使用相同粒度（全部按周 或 全部按月）。"
                ))
    except Exception:
        pass

    return report
