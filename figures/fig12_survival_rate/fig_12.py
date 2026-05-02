"""
Fig 12: Kaplan-Meier survival curves for multi-node spot allocations
grouped by availability score buckets (<25, 25-50, 50-75, ≥75).
"""
import pandas as pd
import matplotlib.pyplot as plt
from matplotlib.lines import Line2D
from lifelines import KaplanMeierFitter


def main():
    df_combined = pd.concat([
        pd.read_csv("data/df_combined2.csv"),
        pd.read_csv("data/df_combined.csv"),
    ])
    df_combined["Time"] = df_combined["Time"] / 3600  # seconds → hours
    df_combined = df_combined[df_combined["Time"] < 24]

    buckets = [
        ("Availability Score < 25",      df_combined["Group"] < 25),
        ("25 ≤ Availability Score < 50", (df_combined["Group"] >= 25) & (df_combined["Group"] < 40)),
        ("50 ≤ Availability Score < 75", (df_combined["Group"] >= 50) & (df_combined["Group"] < 75)),
        ("75 ≤ Availability Score",      df_combined["Group"] >= 75),
    ]
    line_styles = [(0, (1, 3)), (0, (8, 5)), (0, (8, 4, 1, 4)), "-"]

    plt.rcParams["font.size"] = 18
    fig, ax = plt.subplots(figsize=(8, 4.5))

    for (label, mask), ls in zip(buckets, line_styles):
        sub = df_combined[mask]
        kmf = KaplanMeierFitter(alpha=1).fit(sub["Time"], sub["Event"], label=label)
        ax.step(kmf.timeline, kmf.survival_function_.values.flatten(),
                where="post", linestyle=ls, linewidth=3, color="black")

    ax.set_ylim(0, 1.1)
    ax.set_xlim(-0.5, 26)
    ax.set_ylabel("Survival Rate")
    ax.set_xlabel("Time (hour)")
    ax.grid(True, axis="y", alpha=0.5)

    legend_lines = [Line2D([0], [0], color="black", lw=4, linestyle=ls)
                    for ls in ["-", "-.", "--", ":"]]
    legend_labels = [
        "75 ≤ Availability Score",
        "50 ≤ Availability Score < 75",
        "25 ≤ Availability Score < 50",
        "Availability Score < 25",
    ]
    legend = ax.legend(legend_lines, legend_labels,
                       loc="lower left", handlelength=2,
                       edgecolor="black", fontsize=16)
    for line in legend.get_lines():
        line.set_linewidth(3.0)

    fig.tight_layout()
    fig.savefig("multi-node-sps-survial-rate-kme.pdf", dpi=300, bbox_inches="tight")
    plt.close(fig)


if __name__ == "__main__":
    main()
