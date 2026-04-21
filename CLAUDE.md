# Claude Code Project Instructions

This file is auto-read by Claude Code when working in this repo.

## Project

Internal PM tool: analyzes correlation between TikTok Brand Ads delivery
metrics (CTR, VTR, CPM volatility, frequency, etc.) and client MMM ROI,
and identifies optimal metric ranges.

**Read `docs/PRD.md` before writing any code.** The PRD is the source of truth.

## Technology

- Python 3.11
- Streamlit (UI)
- pandas, numpy, scipy, scikit-learn, statsmodels
- plotly (charts — preferred over matplotlib for Streamlit)
- pydantic (schema)
- pytest (tests)

## Absolute Rules

1. **No sample-size hard block.** The single most important design decision.
   Brand clients often provide 4–5 periods of data. The tool must still run.
   All routing is handled by `analysis/small_sample.py`. Never raise errors
   or refuse to run based on n alone (except n<=0 which is malformed input).

2. **Language downgrade for small samples.** When n<6, outputs must use
   descriptive language ("observed pattern", "appears to move with") and
   MUST NOT use words like "significant", "optimal", "best range".
   The `analysis/insight.py` module owns this.

3. **Correlation ≠ causation disclaimer** is inserted at the top of every
   insight card. Non-negotiable.

4. **TDD.** For every analysis module, write / update pytest first,
   then implement.

5. **No DB, no auth, no API integrations in V1.** MVP is a single-file
   Streamlit app with CSV upload.

## Development Order (MVP)

1. `data/schema.py`  — already done, review for accuracy
2. `data/validator.py`  — implement per PRD §5.3
3. `analysis/correlation.py`  — implement, run tests/test_correlation.py
4. `analysis/small_sample.py`  — implement, run tests/test_small_sample.py
   (this is the behavioral core — get it right before moving on)
5. `analysis/binning.py`  — implement, run tests/test_binning.py
6. `analysis/insight.py`  — implement with snapshot tests
7. `app.py`  — wire everything together

After each step: `pytest` must pass before moving to the next.

## Commands

```bash
pip install -r requirements.txt
streamlit run app.py
pytest -v
```

## Gotchas

- `avg_frequency` is derived client-side from `impressions / reach`; the
  reach window MUST match the MMM model's window (typically 30-day rolling).
  Validator should warn if user seems to have weekly reach + monthly window.
- `mmm_roi` must be **incremental** ROI, not last-click. Mapping UI should
  force a confirmation checkbox before accepting.
- Spearman and Kendall τ handle ties differently; for n<10 prefer Kendall
  (smaller-sample consistent).
