"""
Fig 4c: Mean SPS deviation between sampled and ground-truth values, grouped
by target capacity and instance variability tier (high/mid/low std).
"""
import warnings

import numpy as np
import pandas as pd
import matplotlib.pyplot as plt

warnings.filterwarnings("ignore", category=FutureWarning)
warnings.filterwarnings("ignore", category=DeprecationWarning)

WINDOW_START = pd.to_datetime("2024-10-12 00:00:00")
WINDOW_END = WINDOW_START + pd.Timedelta(hours=72)

STD_TIER = {
    "g5.4xlarge": "high", "x2iedn.2xlarge": "high", "t4g.large": "high",
    "c6g.xlarge": "high", "r6i.large": "high",
    "m5ad.2xlarge": "mid", "m6a.32xlarge": "mid", "c7i.12xlarge": "mid",
    "i4i.large": "mid", "r5n.12xlarge": "mid",
    "m6id.large": "low", "r7gd.2xlarge": "low", "inf1.6xlarge": "low",
    "c6i.2xlarge": "low", "r3.4xlarge": "low",
}


def main():
    data = pd.read_csv("data/bar_data/ground_truth.csv")
    data = data[data["InstanceType"] != "p3.2xlarge"].reset_index(drop=True)
    data = data.sort_values(by=["InstanceType", "AZ", "Time"]).reset_index(drop=True)
    data["Time"] = pd.to_datetime(data["Time"], format="%Y/%m/%d/%H-%M-%S")
    data = data[
        (data["Time"] >= pd.to_datetime("2024/10/12/00-00-00", format="%Y/%m/%d/%H-%M-%S"))
        & (data["Time"] <= pd.to_datetime("2024/10/12/00-00-00", format="%Y/%m/%d/%H-%M-%S")
           + pd.Timedelta(hours=72))
    ].reset_index(drop=True)

    usqs = pd.read_csv("data/bar_data/usqs.csv")
    usqs["date_time"] = pd.to_datetime(usqs["date_time"])
    usqs = usqs.sort_values(by=["instancetype", "az", "date_time"]).reset_index(drop=True)

    usqs_subset = []
    for it in data["InstanceType"].unique():
        it_usqs = usqs[usqs["instancetype"] == it]
        for az in data["AZ"].unique():
            usqs_subset.append(it_usqs[it_usqs["az"] == az])
    final_usqs = pd.concat(usqs_subset).reset_index(drop=True)
    final_usqs = final_usqs[
        (final_usqs["date_time"] >= WINDOW_START)
        & (final_usqs["date_time"] <= WINDOW_END)
    ].reset_index(drop=True)

    data = data[data["TargetCapacity"].isin(range(5, 51, 5))]
    merged = pd.merge(
        data, final_usqs,
        left_on=["InstanceType", "AZ", "Time", "TargetCapacity"],
        right_on=["instancetype", "az", "date_time", "targetcapacity"],
    )
    merged["sps_diff"] = abs(merged["Score"] - merged["sps"]) / merged["Score"] * 100
    merged["std"] = merged["InstanceType"].map(STD_TIER)
    bar_data = merged.groupby(["TargetCapacity", "std"])["sps_diff"].mean().reset_index()

    width = 0.3
    high_df = bar_data[bar_data["std"] == "high"]
    mid_df = bar_data[bar_data["std"] == "mid"]
    low_df = bar_data[bar_data["std"] == "low"]
    x = np.arange(len(high_df["TargetCapacity"]))

    fig, ax = plt.subplots()
    ax.bar(x - width, high_df["sps_diff"], width=width, label="High",
           color="#5F5F5F", edgecolor="black", hatch="///")
    ax.bar(x, mid_df["sps_diff"], width=width, label="Mid",
           color="#909090", edgecolor="black", hatch="\\\\\\")
    ax.bar(x + width, low_df["sps_diff"], width=width, label="Low",
           color="#D4D4D4", edgecolor="black", hatch="---")
    ax.set_xlabel("Target Capacity", fontsize=20)
    ax.set_ylabel("Score Difference (%)", fontsize=20)
    ax.set_xticks(x)
    ax.set_xticklabels(high_df["TargetCapacity"], fontsize=18)
    ax.tick_params(axis="y", labelsize=18)
    ax.legend(fontsize=16, loc="upper right")
    fig.tight_layout()
    fig.savefig("multi-sps-sampling-collection.pdf")
    plt.close(fig)


if __name__ == "__main__":
    main()
