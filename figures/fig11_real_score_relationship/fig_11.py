"""
Fig 11: Predicted vs real availability score boxplots.

Two panels: (a) SpotVista AS predictions, (b) single-T3 predictions, each
bucketed into Low/Mid/High by the same thresholds and compared to the
empirical real availability score.
"""
import os

import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns

DIR = os.path.dirname(os.path.abspath(__file__))

LABEL_ORDER = ["Low", "Mid", "High"]
LO, HI = 20, 70
T3_LO, T3_HI = 15, 40
SPS_WIN_DAYS = 3

if not hasattr(np, "trapezoid"):
    np.trapezoid = np.trapz


def get_slope(values):
    n = len(values)
    x = np.linspace(0, n - 1, n)
    y_max = np.linspace(0, 50, n).astype(int)
    max_slope = np.polyfit(x, y_max, 1)[0]
    actual_slope = np.polyfit(x, values, 1)[0]
    return actual_slope / max_slope


def calculate_score(df, alpha=0.1):
    if len(df) < 2:
        return None
    y = df["max_targetcapacity_with_score_3"]
    A3 = np.trapezoid(y) / np.trapezoid([50] * len(df))
    diff = get_slope(y.values) - y.std() / 25.0
    return A3 * (1.0 + alpha * diff) * 100


def label_ours(scores, lo, hi):
    return np.select([scores <= lo, scores > hi], ["Low", "High"], default="Mid")


def label_t3(scores, t3_lo, t3_hi):
    return np.select([scores <= t3_lo, scores >= t3_hi], ["Low", "High"], default="Mid")


def compute_scores():
    sps = pd.read_csv(os.path.join(DIR, "data", "sps_data.csv"))
    sps["time"] = pd.to_datetime(sps["time"])
    sps["max_targetcapacity_with_score_3"] = sps["max_targetcapacity_with_score_3"].astype(int)

    raw = pd.read_csv(os.path.join(DIR, "data", "sps_raw_data.csv"))
    raw["time"] = pd.to_datetime(raw["time"])
    raw["targetcapacity"] = raw["targetcapacity"].astype(int)
    raw["sps"] = raw["sps"].astype(int)

    ddd = pd.read_csv(os.path.join(DIR, "data", "ddd_score_data_1d.csv"))
    ddd["DDDRequestTime"] = pd.to_datetime(ddd["DDDRequestTime"])

    groups = ddd.groupby(["InstanceType", "AZ"]).agg(
        combo_start=("DDDRequestTime", "min"),
        combo_end=("DDDRequestTime", "max"),
    ).reset_index()

    rows = []
    for _, g in groups.iterrows():
        inst, az, start = g["InstanceType"], g["AZ"], g["combo_start"]

        sub = ddd[(ddd["InstanceType"] == inst) & (ddd["AZ"] == az)]
        sub_pos = sub[sub["success"] > 0]
        mean_rate = (sub_pos["success"] / sub_pos["total"]).mean() if len(sub_pos) > 0 else 0.0

        sps_end = start + pd.Timedelta(days=SPS_WIN_DAYS)
        sps_sub = sps[
            (sps["instancetype"] == inst) & (sps["availabilityzoneid"] == az)
            & (sps["time"] >= start) & (sps["time"] <= sps_end)
        ].sort_values("time").reset_index(drop=True)
        ours_as = calculate_score(sps_sub) if len(sps_sub) >= 2 else None

        raw_sub = raw[(raw["instancetype"] == inst) & (raw["availabilityzoneid"] == az)]
        if len(raw_sub) == 0:
            t3_as = None
        else:
            nearest = raw_sub.loc[(raw_sub["time"] - start).abs().idxmin(), "time"]
            sps3 = raw_sub[(raw_sub["time"] == nearest) & (raw_sub["sps"] == 3)]
            t3_as = int(sps3["targetcapacity"].max()) if len(sps3) > 0 else 0

        rows.append({"realscore": mean_rate * 100, "ours_as": ours_as, "t3_as": t3_as})

    return pd.DataFrame(rows).dropna(subset=["ours_as", "t3_as"])


def render_boxplot(real, labels, out_pdf):
    plot_data = pd.DataFrame({"realscore": real, "pred_label": labels})
    plt.rcParams["font.size"] = 17
    fig, ax = plt.subplots(figsize=(5, 3.8))
    sns.boxplot(
        data=plot_data, x="pred_label", y="realscore",
        color="white", order=LABEL_ORDER,
        linewidth=1.5, linecolor="black",
        medianprops=dict(color="orange", linewidth=2.5),
        ax=ax,
    )
    ax.set_ylim(-5, 105)
    ax.set_ylabel("Real Availability Score")
    ax.set_xlabel("Predicted Availability Score")
    fig.tight_layout()
    fig.savefig(os.path.join(DIR, out_pdf), dpi=300, bbox_inches="tight")
    plt.close(fig)


def main():
    df = compute_scores()
    real = df["realscore"].values
    render_boxplot(real, label_ours(df["ours_as"].values, LO, HI),
                   "relationship-of-sps-score-and-real-score.pdf")
    render_boxplot(real, label_t3(df["t3_as"].values, T3_LO, T3_HI),
                   "relationship-of-single-t3-and-real-score.pdf")


if __name__ == "__main__":
    main()
