"""
Fig 1: Success rate of single-node SPS=3 spot allocations across requested
node counts (1..50).
"""
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt


def load_data():
    targets = pd.read_csv("data/targets_fgcs_t3_1.csv")
    ddd = pd.read_csv("data/spot_result_fgcs_t3_1.csv")

    targets["T3"] = targets["T3"].astype(int).astype(str)

    ddd["bincode"] = (ddd["Code"] == "success").astype(int)
    ddd["DDDRequestTime"] = pd.to_datetime(ddd["DDDRequestTime"], unit="s", utc=True)
    ddd_grouped = (
        ddd.groupby(["InstanceType", "AZ", "DDDRequestTime"], as_index=False)["bincode"]
        .sum()
        .sort_values("DDDRequestTime")
    )
    return ddd_grouped


def main():
    ddd_grouped = load_data()
    total = len(ddd_grouped)

    thresholds = list(range(1, 51, 5))[::-1] + [50]
    thresholds = sorted({t for t in [50, 45, 40, 35, 30, 25, 20, 15, 10, 5, 1]})
    ratios = [
        len(ddd_grouped[ddd_grouped["bincode"] >= t]) / total * 100
        for t in thresholds
    ]

    FONT_SIZE = 17
    fig, ax = plt.subplots(figsize=(7.2, 4.5))
    plt.rcParams["font.size"] = FONT_SIZE

    bar_colors = ["#353535" if i % 3 == 0 else "#767676" for i in range(len(thresholds))]
    bars = ax.barh(
        [str(t) for t in thresholds], ratios,
        color=bar_colors, edgecolor="black", height=0.6,
    )

    for bar, ratio in zip(bars, ratios):
        ax.text(
            bar.get_width() + 1.2, bar.get_y() + bar.get_height() / 2,
            f"{ratio:.1f}%", va="center", ha="left",
            fontsize=FONT_SIZE * 0.85, fontweight="medium",
        )

    ax.set_xlabel("Successful Instance Types (%)", fontsize=FONT_SIZE)
    ax.set_ylabel("Number of requested instances", fontsize=FONT_SIZE)
    ax.yaxis.set_label_coords(-0.08, 0.45)
    ax.set_xlim(0, 108)
    ax.set_ylim(-0.8, len(thresholds) - 0.5)
    ax.invert_yaxis()
    ax.tick_params(axis="both", which="both", length=0)
    ax.grid(axis="x", linestyle=":", linewidth=1, alpha=0.5, zorder=0)

    fig.tight_layout()
    fig.savefig("sps-score-distribution-one-fifty-nodes.pdf", dpi=300, bbox_inches="tight")
    plt.close(fig)


if __name__ == "__main__":
    main()
