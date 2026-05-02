"""
Fig 7: T3 correlation analysis between adjacent-sized instance pairs in
six major regions.

Panel (a) cdf-different-size-T3.pdf:
    CDF of Pearson correlation between (size N) and (size N+1) within the
    same family + AZ.

Panel (b) larger-instance-higher-T3.pdf:
    Aggregated proportion of timepoints where the larger instance had
    strictly higher T3 vs equal vs strictly lower.
"""
import warnings

import numpy as np
import pandas as pd
import polars as pl
import matplotlib.pyplot as plt
from scipy.stats import pearsonr
from tqdm import tqdm

warnings.filterwarnings("ignore")

MAJOR_REGIONS = ["use1", "usw2", "euw1", "euc1", "apne1", "apse1"]
TIME_START = "2025-08-01 00:00:00"
TIME_END_CORR = "2025-09-01 00:00:00"
TIME_END_COUNTS = "2025-08-31 23:50:00"

ADJACENT_SIZE_PAIRS = [
    ("nano", "micro"), ("micro", "small"), ("small", "medium"),
    ("medium", "large"), ("large", "xlarge"), ("xlarge", "2xlarge"),
    ("2xlarge", "4xlarge"), ("4xlarge", "8xlarge"),
]


def family_of(inst_type):
    return inst_type.split(".")[0]


def size_of(inst_type):
    return inst_type.split(".")[1] if "." in inst_type else ""


def find_adjacent_pairs(inst_types):
    size_to_type = {size_of(t): t for t in inst_types}
    return [(size_to_type[s], size_to_type[l])
            for s, l in ADJACENT_SIZE_PAIRS
            if s in size_to_type and l in size_to_type]


def load_region_dfs(plotdf, time_end):
    return {
        region: plotdf.filter(
            (pl.col("Region") == region)
            & (pl.col("Time") >= TIME_START)
            & (pl.col("Time") <= time_end)
        )
        for region in MAJOR_REGIONS
    }


def compute_correlations(plotdf):
    region_dfs = load_region_dfs(plotdf, TIME_END_CORR)
    rows = []
    for region_name, df_region in tqdm(region_dfs.items(), desc="Correlations"):
        df_region = df_region.with_columns([
            pl.col("InstType").map_elements(family_of, return_dtype=pl.Utf8).alias("InstFamily"),
        ])
        groups = df_region.group_by(["AZ", "InstFamily"]).agg([
            pl.col("InstType").n_unique().alias("size_count"),
        ]).filter(pl.col("size_count") >= 2)

        seen = set()
        for row in groups.iter_rows(named=True):
            az, family = row["AZ"], row["InstFamily"]
            inst_types = df_region.filter(
                (pl.col("AZ") == az) & (pl.col("InstFamily") == family)
            ).select("InstType").unique()["InstType"].to_list()

            for type1, type2 in find_adjacent_pairs(inst_types):
                key = (az, tuple(sorted([type1, type2])))
                if key in seen:
                    continue
                seen.add(key)

                ts1 = df_region.filter(
                    (pl.col("AZ") == az) & (pl.col("InstType") == type1)
                ).sort("Time").select("T3")["T3"].to_numpy()
                ts2 = df_region.filter(
                    (pl.col("AZ") == az) & (pl.col("InstType") == type2)
                ).sort("Time").select("T3")["T3"].to_numpy()
                if len(ts1) != len(ts2) or len(ts1) <= 10:
                    continue
                if np.std(ts1) == 0 or np.std(ts2) == 0:
                    continue

                corr, _ = pearsonr(ts1, ts2)
                rows.append({"Region": region_name, "Correlation": corr,
                             "Data_points": len(ts1)})
    return pl.DataFrame(rows)


def render_cdf(corr_df, out_pdf):
    cdf_df = corr_df.filter(
        (pl.col("Data_points") >= 2000) & (pl.col("Correlation").is_not_nan())
    )
    correlations = np.sort(cdf_df.select("Correlation").to_numpy().flatten())
    cdf = np.arange(1, len(correlations) + 1) / len(correlations)

    FONT_SIZE = 21
    fig, ax = plt.subplots(figsize=(6, 4.5))
    ax.plot(correlations, cdf, linewidth=4, color="black", label="CDF of Correlation")
    ax.axvline(x=0, color="gray", linestyle="--", linewidth=4, alpha=0.7)
    ax.set_xlim(-1.08, 1.08)
    ax.set_xticks([-1, -0.5, 0, 0.5, 1])
    ax.set_ylim(-0.05, 1.05)
    ax.set_yticks([0, 0.2, 0.4, 0.6, 0.8, 1.0])
    ax.set_xlabel("Correlation Coefficient", fontsize=FONT_SIZE)
    ax.set_ylabel("CDF", fontsize=FONT_SIZE)
    ax.legend(fontsize=FONT_SIZE, loc="best", edgecolor="black")
    ax.grid(True, alpha=0.3)
    ax.tick_params(axis="both", which="major", labelsize=FONT_SIZE)
    fig.tight_layout()
    fig.savefig(out_pdf, dpi=300)
    plt.close(fig)


def compute_pair_counts(plotdf):
    region_dfs = load_region_dfs(plotdf, TIME_END_COUNTS)
    rows = []
    for region_name, df_region in tqdm(region_dfs.items(), desc="Pair counts"):
        for az in df_region.select("AZ").unique().to_series().to_list():
            df_az = df_region.filter(pl.col("AZ") == az)
            inst_types = df_az.select("InstType").unique().to_series().to_list()

            family_groups = {}
            for it in inst_types:
                family_groups.setdefault(family_of(it), []).append(it)

            for types in family_groups.values():
                for type1, type2 in find_adjacent_pairs(types):
                    df_t1 = df_az.filter(pl.col("InstType") == type1).select(["Time", "T3"])
                    df_t2 = df_az.filter(pl.col("InstType") == type2).select(["Time", "T3"])
                    df_joined = df_t1.join(df_t2, on="Time", suffix="_type2")
                    if len(df_joined) < 2000:
                        continue

                    t1_ge_t2 = df_joined.select(pl.col("T3") >= pl.col("T3_type2")).to_series().sum()
                    t2_ge_t1 = df_joined.select(pl.col("T3_type2") >= pl.col("T3")).to_series().sum()
                    eq = df_joined.select(pl.col("T3") == pl.col("T3_type2")).to_series().sum()
                    rows.append({
                        "Region": region_name,
                        "Type1_Higher_Or_Equal_Count": t1_ge_t2,
                        "Type2_Higher_Or_Equal_Count": t2_ge_t1,
                        "Type1_Equal_Type2_Count": eq,
                        "Total_Points": len(df_joined),
                    })
    return pd.DataFrame(rows)


def render_stacked_bar(comp_df, out_pdf):
    total = comp_df["Total_Points"].sum()
    t1_strict = (comp_df["Type1_Higher_Or_Equal_Count"] - comp_df["Type1_Equal_Type2_Count"]).sum()
    t2_strict = (comp_df["Type2_Higher_Or_Equal_Count"] - comp_df["Type1_Equal_Type2_Count"]).sum()
    eq = comp_df["Type1_Equal_Type2_Count"].sum()
    t1_ratio, t2_ratio, eq_ratio = t1_strict / total, t2_strict / total, eq / total
    t1_pct, t2_pct, eq_pct = t1_ratio * 100, t2_ratio * 100, eq_ratio * 100

    FONT_SIZE = 21
    labels = ["Larger instance\nhigher T3", "Small and large\nsame T3",
              "Smaller instance\nhigher T3"]
    colors = ["#FAFAF8", "#909090", "#505050"]

    fig, ax = plt.subplots(figsize=(6, 4.5))
    x = [0]
    ax.bar(x, t2_ratio, color=colors[0], edgecolor="black", linewidth=1.2, width=0.5)
    ax.bar(x, eq_ratio, bottom=t2_ratio, color=colors[1], edgecolor="black",
           linewidth=1.2, width=0.5)
    ax.bar(x, t1_ratio, bottom=t2_ratio + eq_ratio, color=colors[2],
           edgecolor="black", linewidth=1.2, width=0.5)

    if t2_ratio > 0.05:
        ax.text(0, t2_ratio / 2, f"{t2_pct:.1f}%", ha="center", va="center",
                fontsize=FONT_SIZE, fontweight="bold", color="black")
    if eq_ratio > 0.05:
        ax.text(0, t2_ratio + eq_ratio / 2, f"{eq_pct:.1f}%", ha="center", va="center",
                fontsize=FONT_SIZE, fontweight="bold", color="white")
    if t1_ratio > 0.05:
        ax.text(0, t2_ratio + eq_ratio + t1_ratio / 2, f"{t1_pct:.1f}%",
                ha="center", va="center", fontsize=FONT_SIZE, fontweight="bold", color="white")

    x_label, line_x_start, line_x_end = 0.33, 0.25, 0.31
    label_positions = [
        (t2_ratio / 2, labels[0], t2_ratio),
        (t2_ratio + eq_ratio / 2, labels[1], eq_ratio),
        (t2_ratio + eq_ratio + t1_ratio / 2, labels[2], t1_ratio),
    ]
    for y_pos, lab, ratio in label_positions:
        if ratio > 0.05:
            ax.text(x_label, y_pos, lab, va="center", ha="left",
                    fontsize=FONT_SIZE - 3.5, color="black", fontweight="medium")
            ax.plot([line_x_start, line_x_end], [y_pos, y_pos],
                    color="black", lw=2.0, alpha=0.6, zorder=2)

    ax.set_ylabel("Proportion (%)", fontsize=FONT_SIZE)
    ax.set_xticks(x)
    ax.set_xticklabels(["Six Major\nRegions"], fontsize=FONT_SIZE)
    ax.set_yticks([0, 0.2, 0.4, 0.6, 0.8, 1.0])
    ax.set_yticklabels(["0", "20", "40", "60", "80", "100"], fontsize=FONT_SIZE)
    ax.set_ylim(0, 1.05)
    ax.set_xlim(-0.3, 0.82)
    fig.tight_layout()
    fig.savefig(out_pdf, dpi=300)
    plt.close(fig)


def main():
    plotdf = pl.read_csv("data/plotdf_08_processed.csv")

    corr_df = compute_correlations(plotdf)
    render_cdf(corr_df, "cdf-different-size-T3.pdf")

    comp_df = compute_pair_counts(plotdf)
    render_stacked_bar(comp_df, "larger-instance-higher-T3.pdf")


if __name__ == "__main__":
    main()
