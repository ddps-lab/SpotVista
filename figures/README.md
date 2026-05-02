# figures_src — paper figure source mapping

Reproducibility source for figures 1–19 in `paper/SpotVista__.../revision_spotvista_manuscript.tex`.

## Folder structure (artifact standard)

Every `figXX_*/` follows this layout:

```
figXX_*/
├── fig_XX.py          # main figure script (or fig_XXa.py / fig_XXb.py if multi-panel)
├── data/              # input data files (and symlinks for shared big files)
└── *.pdf              # paper-referenced output PDFs
```

No `archive/` dependencies. No `helpers/` directories — every script in
each folder is required to produce the paper PDF and runs end-to-end.

## Shared data (`common/data/`)

Big CSVs used by multiple figures are kept once and symlinked from each
`fig*/data/`:

| File | Size | Used by |
|------|------|---------|
| `plotdf_08.csv` | 6.3 GB | fig06, fig09, fig10 |
| `plotdf_08_processed.csv` | 7.0 GB | fig07 |
| `t2t3df_08.csv` | 6.6 GB | fig09, fig10 |

## Figure mapping

| Fig | Folder | Paper PDF(s) | Main script(s) | Notes |
|-----|--------|--------------|----------------|-------|
| 1   | `fig01_sps_score_distribution/` | `sps-score-distribution-one-fifty-nodes.pdf` | `fig_01.py` | |
| 2   | `fig02_as_explanation/` | `availability-score-explanation-{high,low,slope,std}.pdf` (4) | `fig_02.py` | maxinstance.csv 2.4 GB |
| 3   | `fig03_architecture/` | `spotvista-architecture.pdf` | (drawn — no script) | |
| 4   | `fig04_dataset_collection/` | `effectiveness-of-proposed-query.pdf`, `mae_queries_difference.pdf`, `multi-sps-sampling-collection.pdf` | `fig_04a.py`, `fig_04b.py`, `fig_04c.py` | one script per panel |
| 5   | `fig05_usqs_step_size/` | `cmp-usqs-step-size.pdf` | `fig_05.py` | |
| 6   | `fig06_t3_temporal_seasonal/` | `t3_timeseries_region.pdf`, `t3_timeseries_az.pdf`, `fig_t3_mstl_weekly_seasonal.pdf` | `fig_06_ab.py` (region+az), `fig_06_c.py` (MSTL) | MSTL script reads cached hourly CSVs from `data/` |
| 7   | `fig07_t3_correlation_size/` | `cdf-different-size-T3.pdf`, `larger-instance-higher-T3.pdf` | `fig_07.py` | |
| 8   | `fig08_sps_diversity/` | `sps-difference-make-total-cores.pdf` | `fig_08.py` | hw_info table in `data/instance_hw_info.csv` |
| 9   | `fig09_sps3_max_instance_azs/` | `sps-3-max-instance-azs.pdf` | `fig_09.py` | |
| 10  | `fig10_24h_survive/` | `24-hour-survive-T3.pdf` | `fig_10.py` | |
| 11  | `fig11_real_score_relationship/` | `relationship-of-sps-score-and-real-score.pdf`, `relationship-of-single-t3-and-real-score.pdf` | `fig_11.py` | |
| 12  | `fig12_survival_rate/` | `multi-node-sps-survial-rate-kme.pdf` | `fig_12.py` | |
| 13  | `fig13_lambda_sensitivity/` | `as-lambda-sensitivity.pdf` | `fig_13.py` | |
| 14  | `fig14_delta_as_window/` | `delta-as-window-transition.pdf` | `fig_14.py` | |
| 15  | `fig15_t3_t2_correlation/` | `correlation-between-t3-and-t2-availability-score.pdf` | `fig_15.py` | maxinstance2/3.csv copied locally (2.3 GB each) |
| 16  | `fig16_w_impact/` | `w-impact-to-availability-score.pdf`, `w-impact-to-cost-score.pdf` | `fig_16.py` | |
| 17  | `fig17_total_scores/` | `total-scores-added-node-instance-{category,family}.pdf` | `fig_17.py` | |
| 18  | `fig18_spotvista_vs_spotverse/` | `cmp-spotvista-spotverse-{legend,cost,avail}.pdf` (3) | `fig_18.py` | data hardcoded — no `data/` dir |
| 19  | `fig19_compare_strategies/` | `compare-different-strategies-{availability,cost}.pdf` | `fig_19.py` | |

Total: 33 PDFs (matches every `\includegraphics` reference in the paper).

## How to run

From the project root:

```sh
cd figures_src/figXX_*/
uv run python fig_XX.py
```

The shared CSVs in `common/data/` must be present (symlinked into each
`fig{06,07,09,10}/data/`).

## Verification

All 33 paper PDFs were regenerated end-to-end via `uv run python fig_XX.py`
in each folder. The output PDF names match the paper's `\includegraphics`
references one-to-one.
