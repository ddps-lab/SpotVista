"""
Fig 9: Histogram of (max - min) T3 across AZs per instance type, showing
the spread of max-instance availability for SPS=3 across AZs.
"""
import warnings

import numpy as np
import polars as pl
import matplotlib.pyplot as plt

warnings.filterwarnings("ignore")


def main():
    plotdf = pl.read_csv("data/plotdf_08.csv")

    snapshot = plotdf.group_by("Key").agg(pl.col("T3").mean().alias("T3"))
    snapshot = snapshot.with_columns([
        pl.col("Key").str.split("_").list.get(0).alias("instType"),
        pl.col("Key").str.split("_").list.get(1).alias("AZ"),
    ]).select(["instType", "AZ", "T3"])

    t3_range = snapshot.group_by("instType").agg([
        pl.col("T3").max().alias("max_T3"),
        pl.col("T3").min().alias("min_T3"),
        (pl.col("T3").max() - pl.col("T3").min()).alias("T3_range"),
    ])
    t3_range = t3_range.filter(pl.col("T3_range") > 0).drop_nulls()

    FONT_SIZE = 26
    fig, ax = plt.subplots(figsize=(8, 6))
    weights = np.ones(len(t3_range)) / len(t3_range) * 100
    ax.hist(t3_range["T3_range"], bins=25, range=(0, 50),
            edgecolor="black", color="gray", weights=weights)
    ax.set_xlabel("Difference", fontsize=FONT_SIZE)
    ax.set_ylabel("Ratio (%)", fontsize=FONT_SIZE)
    ax.tick_params(axis="both", which="major", labelsize=FONT_SIZE)
    ax.grid(axis="both", alpha=0.3)
    fig.tight_layout()
    fig.savefig("sps-3-max-instance-azs.pdf", dpi=300)
    plt.close(fig)


if __name__ == "__main__":
    main()
