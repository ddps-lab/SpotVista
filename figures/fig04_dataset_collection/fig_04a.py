"""
Fig 4a: Effectiveness of the proposed query strategy — boxplot of |T3 diff
from real values| for four sampling methods, with star markers for the
average number of queries per period.
"""
import pandas as pd
import matplotlib.pyplot as plt
import matplotlib.patches as patches
import seaborn as sns


def main():
    all_df = pd.read_csv("data/all.csv", index_col=0)
    unit5 = pd.read_csv("data/unit5.csv", index_col=0)
    origin = pd.read_csv("data/origin.csv", index_col=0)
    premax = pd.read_csv("data/premax.csv", index_col=0)
    early = pd.read_csv("data/early.csv", index_col=0)

    sort_cols = ["instancetype", "az", "time"]
    origin = origin.sort_values(sort_cols).reset_index(drop=True)
    premax = premax.sort_values(sort_cols).reset_index(drop=True)
    early = early.sort_values(sort_cols).reset_index(drop=True)

    all_df = all_df[["instancetype", "region", "az", "max2instance", "max3instance", "time"]]
    unit5 = unit5[["instancetype", "region", "az", "max3instance", "time"]]

    all_df = all_df.sort_values(["instancetype", "az", "time"])
    unit5 = unit5.sort_values(["instancetype", "az", "time"])

    origin_q = round(origin.drop_duplicates(["instancetype", "region", "time"])["count"].mean(), 2)
    premax_q = round(premax.drop_duplicates(["instancetype", "region", "time"])["count"].mean(), 2)
    early_q = round(early.drop_duplicates(["instancetype", "region", "time"])["count"].mean(), 2)

    all_df["diff_unit5"] = abs(all_df["max3instance"] - unit5["max3instance"])
    all_df["diff_origin"] = abs(all_df["max3instance"] - origin["max3instance"])
    all_df["diff_premax"] = abs(all_df["max3instance"] - premax["max3instance"])
    all_df["diff_early"] = abs(all_df["max3instance"] - early["max3instance"])

    df = pd.DataFrame({
        "Uniform Spacing": all_df["diff_unit5"],
        "Binary Search": all_df["diff_origin"],
        "BS + Cache": all_df["diff_premax"],
        "BS + Cache + Early Stop": all_df["diff_early"],
    })
    counts_df = pd.DataFrame({
        "Uniform Spacing": [1],
        "Binary Search": [origin_q],
        "BS + Cache": [premax_q],
        "BS + Cache + Early Stop": [early_q],
    })

    df_melted = df.melt(var_name="Method", value_name="Difference")
    counts_melted = counts_df.melt(var_name="Method", value_name="Num. Queries")

    fig, ax1 = plt.subplots(figsize=(6, 4.5))

    sns.boxplot(
        data=df_melted, x="Method", y="Difference",
        color="white", ax=ax1, linewidth=2.0,
        boxprops=dict(edgecolor="black", linewidth=2.0),
        whiskerprops=dict(color="black", linewidth=2.0),
        capprops=dict(color="black", linewidth=2.0),
        flierprops=dict(marker="o", markerfacecolor="white", markersize=6, markeredgecolor="black"),
        medianprops=dict(color="orange", linewidth=2.0),
    )

    ax2 = ax1.twinx()
    sns.scatterplot(
        data=counts_melted, x="Method", y="Num. Queries",
        c="black", edgecolor="black", s=300, marker="*", ax=ax2,
    )

    ax1.set_xlabel("")
    ax1.set_ylabel("Difference from Real Values", fontsize=20)
    ax1.tick_params(axis="x", labelsize=18)
    ax1.tick_params(axis="y", labelsize=18)
    ax1.set_yticks(range(0, 35, 5))
    ax1.set_ylim(-0.5, 35)
    ax1.set_xticklabels(
        ["Uniform\nSpacing", "Binary\nSearch", "BS+\nCache", "BS + Cache\n+ Early Stop"],
        rotation=20, fontsize=15,
    )
    ax1.yaxis.set_label_coords(-0.12, 0.4)

    ax2.set_ylabel("Number of Queries", fontsize=20)
    ax2.tick_params(axis="y", labelsize=18)
    if ax2.legend_:
        ax2.legend_.remove()

    custom_legend = [
        plt.Line2D([0], [0], marker="*", color="black", markeredgecolor="black",
                   lw=0, markersize=14, label="Num. Queries"),
        patches.Rectangle((0, 0), 1, 1, edgecolor="black", facecolor="white",
                          linewidth=2.0, label="Difference"),
    ]
    ax1.legend(
        handles=custom_legend, fontsize=14, loc="upper right",
        bbox_to_anchor=(1.01, 1.01), frameon=True, edgecolor="black",
        labelspacing=0.2, handletextpad=0.5,
    )

    fig.tight_layout()
    fig.savefig("effectiveness-of-proposed-query.pdf")
    plt.close(fig)


if __name__ == "__main__":
    main()
