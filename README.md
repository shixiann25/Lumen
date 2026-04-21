# TikTok Brand Ads MMM Analyzer

Internal PM tool to analyze correlations between TikTok Brand Ads delivery metrics
(CTR, VTR, CPM volatility, frequency, etc.) and client-side MMM ROI outputs,
and to identify optimal metric ranges.

See `docs/PRD.md` for full product requirements.

## Quickstart

```bash
# 1. Install
pip install -r requirements.txt

# 2. Run Streamlit app
streamlit run app.py

# 3. (After implementation) Run tests
pytest
```

## Project Structure

```
tiktok-mmm-analyzer/
├── docs/
│   └── PRD.md              # Product requirements (copy from output)
├── app.py                  # Streamlit entry point
├── analysis/
│   ├── correlation.py      # Pearson / Spearman / Kendall τ
│   ├── binning.py          # Optimal range identification (equal-frequency bins)
│   ├── small_sample.py     # Adaptive logic for n<6 cases (PRD §4.3)
│   └── insight.py          # Insight card text generation
├── data/
│   ├── schema.py           # Field definitions (PRD §5.1)
│   ├── validator.py        # Data quality checks (PRD §5.3)
│   └── sample_template.csv # Example input
└── tests/
    └── test_*.py           # Pytest suite
```

## MVP Scope (Week 2–4)

- Manual CSV/XLSX upload
- Field mapping UI
- Three correlation methods (Pearson, Spearman, Kendall τ) + FDR correction
- Small-sample adaptive routing (n<6 → Kendall + scatter, n≥6 → coarse binning, n≥10 → standard binning)
- Optimal range bar chart
- Insight card export as Markdown
- Raw data point table (critical for small-sample cases)

## Key Design Principle

Per PRD §4.3, there is **no sample size hard block**. The tool adapts its method
and language based on `n`:

| n range  | Correlation default | Binning | Language |
|----------|--------------------|---------| -------- |
| n < 6    | Kendall τ + scatter | none    | descriptive only ("observed pattern") |
| 6–9      | Kendall + Spearman  | 2–3 bins | "low power" tagged |
| 10–19    | Spearman            | 3 bins  | "small-sample" tagged |
| 20–49    | Spearman + Pearson  | 5 bins  | standard |
| ≥ 50     | all methods         | 5 bins + tree | full |
