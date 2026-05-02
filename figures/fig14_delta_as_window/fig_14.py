"""
Fig 14: |ΔAS| distribution across window-size transitions, faceted by
season (4 periods: spring/summer/fall/winter 2025).
"""
import re

import numpy as np
import pandas as pd
import matplotlib
import matplotlib.pyplot as plt

matplotlib.use("Agg")

INPUT = "./data/as_box_results_full.csv"
OUTPUT_CSV = "./data/delta_as_box_full.csv"
OUTPUT_PDF = "delta-as-window-transition.pdf"

TRANSITIONS = ["1h→2h", "6h→7h", "12h→1d", "1d→2d", "3d→4d", "7d→8d", "13d→14d"]
PERIOD_SEASON = {
    "period1": "spring\n(2025/03~04)",
    "period2": "summer\n(2025/06~07)",
    "period3": "fall\n(2025/09~10)",
    "period4": "winter\n(2025/12~2026/01)",
}
FONT_SIZE = 12


def compute_delta(df):
    window_order = [f"{h}h" for h in range(1, 13)] + [f"{d}d" for d in range(1, 15)]
    rank = {w: i for i, w in enumerate(window_order)}
    df["window_rank"] = df["window"].map(rank)
    df = df.sort_values(["period", "base_date", "Region", "InstanceType", "AZ", "window_rank"])

    rows = []
    for (period, base_date, region, it, az), g in df.groupby(
        ["period", "base_date", "Region", "InstanceType", "AZ"]
    ):
        g = g.sort_values("window_rank")
        windows = g["window"].values
        scores = g["AS"].values
        for i in range(1, len(windows)):
            if pd.isna(scores[i]) or pd.isna(scores[i - 1]):
                delta = np.nan
            else:
                delta = abs(scores[i] - scores[i - 1])
            rows.append({
                "period": period, "base_date": base_date,
                "transition": f"{windows[i-1]}→{windows[i]}",
                "Region": region, "InstanceType": it, "AZ": az,
                "delta_as": delta,
            })
    return pd.DataFrame(rows)


def annotate_season(ax, season):
    season_full = season.capitalize()
    match = re.match(r"(.+?)\s*(\(.+\))", season_full)
    base_x, base_y = 0.98, 0.8
    if match:
        main, paren = match.groups()
        ax.text(base_x, base_y, main, transform=ax.transAxes,
                ha="right", va="bottom", fontsize=FONT_SIZE - 1, fontweight="bold")
        ax.text(base_x, base_y - 0.15, paren, transform=ax.transAxes,
                ha="right", va="bottom", fontsize=FONT_SIZE - 2)
    else:
        ax.text(base_x, base_y, season_full, transform=ax.transAxes,
                ha="right", va="bottom", fontsize=FONT_SIZE - 1)


def plot_boxplot_2x2(df):
    df = df[df["transition"].isin(TRANSITIONS)].dropna(subset=["delta_as"])

    plt.rcParams["font.size"] = FONT_SIZE
    fig, axes = plt.subplots(2, 2, figsize=(7, 3),
                             gridspec_kw={"hspace": 0.12, "wspace": 0.07})

    for ax, period in zip(axes.flat, ["period1", "period2", "period3", "period4"]):
        pdf = df[df["period"] == period]
        data, labels = [], []
        for t in TRANSITIONS:
            vals = pdf[pdf["transition"] == t]["delta_as"].values
            if len(vals) > 0:
                data.append(vals)
                labels.append(t)

        ax.boxplot(
            data, tick_labels=labels, showfliers=False,
            medianprops=dict(color="red", linewidth=1.2),
            boxprops=dict(linewidth=0.6),
            whiskerprops=dict(linewidth=0.6),
            capprops=dict(linewidth=0.6),
        )

        season = PERIOD_SEASON[period]
        if season in ("spring\n(2025/03~04)", "summer\n(2025/06~07)"):
            ax.tick_params(axis="x", bottom=False, labelbottom=False)
        else:
            plt.setp(ax.get_xticklabels(), rotation=40, ha="right", rotation_mode="anchor")

        ax.set_ylim(-1, 9)
        ax.set_yticks([0, 2, 4, 6, 8])
        if season in ("summer\n(2025/06~07)", "winter\n(2025/12~2026/01)"):
            ax.set_ylabel("")
            ax.tick_params(axis="y", left=False, labelleft=False)
        else:
            ax.set_ylabel("|ΔAS|")

        if season in ("fall\n(2025/09~10)", "winter\n(2025/12~2026/01)"):
            ax.set_xlabel("Window Transition", fontsize=FONT_SIZE)

        ax.grid(True, alpha=0.3)
        annotate_season(ax, season)

    fig.tight_layout()
    fig.savefig(OUTPUT_PDF, bbox_inches="tight")
    plt.close(fig)


def main():
    df = pd.read_csv(INPUT)
    delta_df = compute_delta(df)
    delta_df.to_csv(OUTPUT_CSV, index=False)
    plot_boxplot_2x2(delta_df)


if __name__ == "__main__":
    main()
