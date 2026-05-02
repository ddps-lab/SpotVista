"""
Fig 6a/b: T3 timeseries by region (panel a) and by AZ in us-east-1
(panel b), aggregated over 8/4–8/11/2025 in local time.
"""
import warnings

import numpy as np
import pandas as pd
import seaborn as sns
import matplotlib.pyplot as plt
import matplotlib.dates as mdates

warnings.filterwarnings("ignore")

# UTC offset (hours) per AWS region prefix.
REGION_OFFSETS = {
    "apne1": 9, "apne2": 9, "apne3": 9, "aps1": 5.5,
    "apse1": 8, "apse2": 10,
    "euc1": 1, "eun1": 1, "euw1": 0, "euw2": 0, "euw3": 1,
    "sae1": -3, "use1": -5, "use2": -5,
    "usw1": -8, "usw2": -8, "cac1": -6,
}


def load_one_week():
    df = pd.read_csv("data/plotdf_08.csv")
    df[["InstType", "Region", "AZ"]] = df["Key"].str.extract(
        r"^([^.]+(?:\.[^\.]+)*)_([a-z0-9]+)[-_](az\d+)$"
    )
    one = df[(df["Time"] >= "2025-08-01") & (df["Time"] <= "2025-08-15")].copy()
    one["Time"] = pd.to_datetime(one["Time"])
    one["offset"] = one["Region"].map(REGION_OFFSETS).fillna(0)
    one["local_time"] = one["Time"] + pd.to_timedelta(one["offset"], unit="h")
    one.drop(columns="offset", inplace=True)
    return one[
        (one["local_time"] >= "2025-08-04 00:00:00")
        & (one["local_time"] <= "2025-08-11 00:00:00")
    ]


def daily_marker_overlay(ax, x_min, x_max, marker_cfg):
    x_ticks = pd.date_range(x_min, x_max, freq="1D")
    x_ticks_num = mdates.date2num(x_ticks)
    data_lines = [l for l in ax.get_lines() if len(l.get_xdata()) > 0]
    for line_obj, (mk, color, size) in zip(data_lines, marker_cfg):
        xdata_num = mdates.date2num(line_obj.get_xdata())
        ydata = np.array(line_obj.get_ydata(), dtype=float)
        y_at_ticks = np.interp(x_ticks_num, xdata_num, ydata)
        ax.plot(x_ticks, y_at_ticks, linestyle="None", marker=mk,
                color=color, markersize=size, markeredgewidth=0)


def plot_region_panel(one_week_df, out_pdf):
    region_styles = [
        ("euw1", "#EFB118FF", "--"),
        ("use1", "#4269D0FF", "-"),
        ("usw2", "#FF725CFF", (0, (3, 1, 1, 1, 1, 1))),
        ("apne1", "#3CA951FF", "-."),
        ("euc1", "#9C6B4EFF", "-"),
        ("apse1", "#A463F2FF", ":"),
    ]
    fig, ax = plt.subplots(figsize=(15, 5))
    for region, color, ls in region_styles:
        sns.lineplot(
            x="local_time", y="T3",
            data=one_week_df[one_week_df["Region"] == region],
            errorbar=None, linewidth=5, color=color, linestyle=ls,
            ax=ax, legend=False,
        )
    ax.set_xticks(pd.date_range(one_week_df["local_time"].min(),
                                one_week_df["local_time"].max(), freq="1D"))
    ax.set_xticklabels(["8/4", "8/5", "8/6", "8/7", "8/8", "8/9", "8/10", "8/11"])
    ax.set_xlabel("DateTime", fontsize=28)
    ax.set_ylabel("$T3$", fontsize=28)
    ax.tick_params(axis="both", labelsize=28)
    ax.grid(True)

    legend_handles = [
        plt.Line2D([], [], linestyle="--", marker="s", linewidth=5, color="#EFB118FF", markersize=16),
        plt.Line2D([], [], linestyle="-", marker="o", linewidth=5, color="#4269D0FF", markersize=16),
        plt.Line2D([], [], linestyle=(0, (3, 1, 1, 1, 1, 1)), marker="D", linewidth=5, color="#FF725CFF", markersize=14),
        plt.Line2D([], [], linestyle=(0, (4, 1.5, 1, 1.5)), marker="v", linewidth=5, color="#3CA951FF", markersize=16),
        plt.Line2D([], [], linestyle="-", marker="^", linewidth=5, color="#9C6B4EFF", markersize=16),
        plt.Line2D([], [], linestyle=":", marker="*", linewidth=5, color="#A463F2FF", markersize=18),
    ]
    legend = ax.legend(
        handles=legend_handles,
        labels=["euw1", "use1", "usw2", "apne1", "euc1", "apse1"],
        loc="upper center", bbox_to_anchor=(0.5, 1.21), ncol=6,
        fontsize=23, handlelength=2.2, columnspacing=0.4,
        handletextpad=0.4, labelspacing=0.2, edgecolor="black",
    )
    for line in legend.get_lines():
        line.set_linewidth(5)

    daily_marker_overlay(
        ax, one_week_df["local_time"].min(), one_week_df["local_time"].max(),
        [("s", "#EFB118FF", 18), ("o", "#4269D0FF", 18), ("D", "#FF725CFF", 16),
         ("v", "#3CA951FF", 18), ("^", "#9C6B4EFF", 18), ("*", "#A463F2FF", 20)],
    )

    fig.savefig(out_pdf, dpi=600, bbox_inches="tight")
    plt.close(fig)


def plot_az_panel(one_week_df, out_pdf):
    use1 = one_week_df[one_week_df["Region"] == "use1"]
    az_styles = [
        ("az6", "#4269D0FF", "-"),
        ("az4", "#EFB118FF", "--"),
        ("az2", "#3CA951FF", (0, (3, 1, 1, 1, 1, 1))),
        ("az3", "#9C6B4EFF", "-."),
        ("az1", "#FF725CFF", "-"),
        ("az5", "#A463F2FF", ":"),
    ]
    fig, ax = plt.subplots(figsize=(15, 5))
    for az, color, ls in az_styles:
        sns.lineplot(
            x="local_time", y="T3",
            data=use1[use1["AZ"] == az],
            errorbar=None, linewidth=5, color=color, linestyle=ls,
            ax=ax, legend=False,
        )
    ax.set_xticks(pd.date_range(one_week_df["local_time"].min(),
                                one_week_df["local_time"].max(), freq="1D"))
    ax.set_xticklabels(["8/4", "8/5", "8/6", "8/7", "8/8", "8/9", "8/10", "8/11"])
    ax.set_xlabel("DateTime", fontsize=28)
    ax.set_ylabel("$T3$", fontsize=28)
    ax.tick_params(axis="both", labelsize=28)
    ax.set_ylim([13, 27])
    ax.set_yticks(range(14, 27, 2))
    ax.grid(True, alpha=0.3)

    legend_handles = [
        plt.Line2D([], [], linestyle="-", marker="o", linewidth=5, color="#4269D0FF", markersize=16),
        plt.Line2D([], [], linestyle="--", marker="s", linewidth=5, color="#EFB118FF", markersize=16),
        plt.Line2D([], [], linestyle=(0, (3, 1, 1, 1, 1, 1)), marker="D", linewidth=5, color="#3CA951FF", markersize=14),
        plt.Line2D([], [], linestyle=(0, (4, 1.5, 1, 1.5)), marker="^", linewidth=5, color="#9C6B4EFF", markersize=16),
        plt.Line2D([], [], linestyle="-", marker="v", linewidth=5, color="#FF725CFF", markersize=16),
        plt.Line2D([], [], linestyle=":", marker="*", linewidth=5, color="#A463F2FF", markersize=18),
    ]
    legend = ax.legend(
        handles=legend_handles,
        labels=["az6", "az4", "az2", "az3", "az1", "az5"],
        loc="upper center", bbox_to_anchor=(0.5, 1.21), ncol=6,
        fontsize=25, handlelength=2.2, columnspacing=0.4,
        handletextpad=0.4, labelspacing=0.2, edgecolor="black",
    )
    for line in legend.get_lines():
        line.set_linewidth(5)

    daily_marker_overlay(
        ax, one_week_df["local_time"].min(), one_week_df["local_time"].max(),
        [("o", "#4269D0FF", 18), ("s", "#EFB118FF", 18), ("D", "#3CA951FF", 16),
         ("^", "#9C6B4EFF", 18), ("v", "#FF725CFF", 18), ("*", "#A463F2FF", 20)],
    )

    fig.savefig(out_pdf, dpi=600, bbox_inches="tight")
    plt.close(fig)


def main():
    one_week_df = load_one_week()
    plot_region_panel(one_week_df, "t3_timeseries_region.pdf")
    plot_az_panel(one_week_df, "t3_timeseries_az.pdf")


if __name__ == "__main__":
    main()
