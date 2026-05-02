"""
Fig 13: Sensitivity of the AS scaling coefficient λ. Plots accuracy
improvement (vs λ=0) when bucketing predicted scores into Low/Mid/High,
across λ ∈ [0, 1].
"""
import os

import numpy as np
import pandas as pd
import matplotlib.pyplot as plt

DIR = os.path.dirname(os.path.abspath(__file__))

ALPHAS = [0, 0.10, 0.20, 0.30, 0.40, 0.50, 0.60, 0.70, 0.80, 0.90, 1.00]
LO, HI = 20, 70
SPS_WIN_DAYS = 3

if not hasattr(np, "trapezoid"):
    np.trapezoid = np.trapz


def get_slope(values):
    n = len(values)
    x = np.linspace(0, n - 1, n)
    y_max = np.linspace(0, 50, n).astype(int)
    return np.polyfit(x, values, 1)[0] / np.polyfit(x, y_max, 1)[0]


def calculate_score(df, alpha=0.1):
    if len(df) < 2:
        return None
    y = df["max_targetcapacity_with_score_3"]
    A3 = np.trapezoid(y) / np.trapezoid([50] * len(df))
    diff = get_slope(y.values) - y.std() / 25.0
    return A3 * (1.0 + alpha * diff) * 100


def label_ours(scores, lo, hi):
    return np.select([scores <= lo, scores > hi], ["Low", "High"], default="Mid")


def compute_alpha_sweep():
    sps = pd.read_csv(os.path.join(DIR, "data", "sps_data.csv"))
    sps["time"] = pd.to_datetime(sps["time"])
    sps["max_targetcapacity_with_score_3"] = sps["max_targetcapacity_with_score_3"].astype(int)

    ddd = pd.read_csv(os.path.join(DIR, "data", "ddd_score_data_1d.csv"))
    ddd["DDDRequestTime"] = pd.to_datetime(ddd["DDDRequestTime"])

    groups = ddd.groupby(["InstanceType", "AZ"]).agg(
        combo_start=("DDDRequestTime", "min"),
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

        row = {"realscore": mean_rate * 100}
        for a in ALPHAS:
            row[f"alpha_{a:.2f}"] = calculate_score(sps_sub, alpha=a) if len(sps_sub) >= 2 else None
        rows.append(row)

    df = pd.DataFrame(rows).dropna(subset=["alpha_0.00", "alpha_0.10"])
    real = df["realscore"].values
    real_label = label_ours(real, LO, HI)

    accs = [(real_label == label_ours(df[f"alpha_{a:.2f}"].values, LO, HI)).mean() * 100
            for a in ALPHAS]
    acc_baseline = accs[ALPHAS.index(0)]
    return [a - acc_baseline for a in accs]


def main():
    d_accs = compute_alpha_sweep()

    plt.rcParams["font.size"] = 18
    fig, ax = plt.subplots(figsize=(8, 4))
    ax.plot(ALPHAS, d_accs, color="black", linewidth=1, zorder=-1)
    for i, a in enumerate(ALPHAS):
        color = "red" if a == 0.10 else "black"
        zorder = 5 if a == 0.10 else (4 if a == 0 else 2)
        ax.scatter(ALPHAS[i], d_accs[i], c=color, s=100, zorder=zorder,
                   edgecolors="black", linewidth=0.5)

    ax.axhline(y=0, color="gray", linestyle="-", alpha=0.3)
    ax.set_xlabel(r"$\lambda$")
    ax.set_ylabel("Accuracy Improvement \n over $\\lambda=0$ (%p)")
    ax.set_xticks(ALPHAS)
    ax.set_xticklabels([f"{a:.1f}" for a in ALPHAS])
    ax.set_yticks([-15, -10, -5, 0, 5])
    ax.set_ylim(-16, 6)
    ax.grid(True, alpha=0.2)

    fig.tight_layout()
    fig.savefig(os.path.join(DIR, "as-lambda-sensitivity.pdf"),
                dpi=300, bbox_inches="tight")
    plt.close(fig)


if __name__ == "__main__":
    main()
