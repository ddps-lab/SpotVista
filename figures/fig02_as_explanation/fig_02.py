"""
Fig 2: AS intuition — area, slope, and standard deviation panels.

Renders four single-panel T3 timeseries (high/low/slope/std) used to
illustrate the components of the Availability Score formula.
"""
import pandas as pd
import seaborn as sns
import matplotlib.pyplot as plt


PANELS = [
    ("availability-score-explanation-std.pdf",  ("t4g.large",   "aps1-az1"), 45),
    ("availability-score-explanation-slope.pdf", ("i3.16xlarge", "euw2-az1"), 59),
    ("availability-score-explanation-low.pdf",   ("a1.2xlarge",  "apne1-az2"), 0),
    ("availability-score-explanation-high.pdf",  ("c3.2xlarge",  "use1-az2"), 100),
]

WINDOW_START = "2024-09-04 12:00:00"
WINDOW_END = "2024-09-11 12:00:00"
WEEKDAY_LABELS = ["Thu.", "", "Sat.", "", "Mon.", "", "Wed."]


def render_panel(df, out_pdf):
    fig, ax = plt.subplots(figsize=(15, 3.0))
    sns.set_style("whitegrid")
    sns.lineplot(
        data=df, x="time", y="max_targetcapacity_with_score_3",
        color="black", linestyle="-", legend=False, linewidth=5, ax=ax,
    )
    line = ax.get_lines()[0]
    ax.fill_between(line.get_xdata(), line.get_ydata(), color="lightgray", alpha=0.8)
    ax.set_xticklabels(WEEKDAY_LABELS, size=45)
    ax.set_xlabel("Time", fontsize=45)
    ax.set_ylabel("$T3$", fontsize=45)
    ax.set_ylim(-2, 53)
    ax.tick_params(axis="y", labelsize=32)
    fig.savefig(out_pdf, dpi=600, bbox_inches="tight")
    plt.close(fig)


def main():
    data = pd.read_csv("data/maxinstance.csv")
    data["time"] = pd.to_datetime(data["time"])
    data = data[(data["time"] > WINDOW_START) & (data["time"] < WINDOW_END)]

    for out_pdf, (instance_type, az), _ in PANELS:
        panel_df = data[
            (data["instancetype"] == instance_type)
            & (data["availabilityzoneid"] == az)
        ]
        render_panel(panel_df, out_pdf)


if __name__ == "__main__":
    main()
