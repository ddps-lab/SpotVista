"""
Fig 4b: MAE of T3 estimation vs number of sequential queries per period.
Compares the proposed USQS sampler ("Ours") to baselines using 1, 11, 21,
31, 41, 51 sequential queries.
"""
import warnings

import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns

warnings.filterwarnings("ignore", category=FutureWarning)
warnings.filterwarnings("ignore", category=DeprecationWarning)

WINDOW_START = pd.to_datetime("2024-10-12 00:00:00")
WINDOW_END = WINDOW_START + pd.Timedelta(hours=72)


def preprocess_max_capacity(df):
    grouped = df.groupby(["InstanceType", "Region", "AZ", "Time"])
    rows = []
    for name, group in grouped:
        score3 = group[group["Score"] == 3]
        max_cap = score3["TargetCapacity"].max() if not score3.empty else 0
        rows.append({
            "InstanceType": name[0],
            "Region": name[1],
            "AZ": name[2],
            "time": name[3],
            "max_targetcapacity_with_score_3": max_cap,
        })
    return pd.DataFrame(rows)


def main():
    data = pd.read_csv("data/bar_data/ground_truth.csv")
    data = data[data["InstanceType"] != "p3.2xlarge"].reset_index(drop=True)
    data["Time"] = pd.to_datetime(data["Time"], format="%Y/%m/%d/%H-%M-%S")
    data = data[
        (data["Time"] >= pd.to_datetime("2024/10/12/00-00-00", format="%Y/%m/%d/%H-%M-%S"))
        & (data["Time"] <= pd.to_datetime("2024/10/12/00-00-00", format="%Y/%m/%d/%H-%M-%S")
           + pd.Timedelta(hours=72))
    ].reset_index(drop=True)

    gt = preprocess_max_capacity(data)

    df_list = []
    for i in range(1, 52, 10):
        df = pd.read_csv(f"data/mae_data/test/mae_data_{i}_preprocessed.csv")
        df["time"] = pd.to_datetime(df["time"])
        df = df[(df["time"] >= WINDOW_START) & (df["time"] <= WINDOW_END)].reset_index(drop=True)
        abs_diff = abs(gt["max_targetcapacity_with_score_3"] - df["max_targetcapacity_with_score_3"])
        df_list.append(pd.DataFrame({"case": i, "abs_diff": abs_diff}))

    ours = pd.read_csv("data/mae_data/test/mae_data_1_preprocessed.csv")
    ours = ours[ours["InstanceType"] != "p3.2xlarge"].reset_index(drop=True)
    abs_diff_ours = abs(gt["max_targetcapacity_with_score_3"] - ours["max_targetcapacity_with_score_3"])

    abs_diff_ours_df = abs_diff_ours.reset_index(drop=True).to_frame(name="abs_diff")
    abs_diff_ours_df["case"] = "Ours"
    combined_df = pd.concat([abs_diff_ours_df, pd.concat(df_list)], ignore_index=True)

    queries = pd.DataFrame({
        "case": ["Ours", "1", "11", "21", "31", "41", "51"],
        "Num. Queries": [1, 1, 10, 20, 30, 40, 50],
    })
    queries = queries[queries["case"] != "1"]
    combined_df = combined_df[combined_df["case"] != 1]

    fig, ax1 = plt.subplots()
    sns.boxplot(
        data=combined_df, x="case", y="abs_diff",
        color="white", linewidth=2,
        medianprops=dict(color="orange", linewidth=2.0),
        boxprops=dict(edgecolor="black", linewidth=2),
        whiskerprops=dict(color="black", linewidth=2),
        capprops=dict(color="black", linewidth=2),
        flierprops=dict(markeredgecolor="black", markerfacecolor="white", marker="o"),
        ax=ax1,
    )
    ax1.set_ylim([-1, 52])

    ax2 = ax1.twinx()
    sns.scatterplot(
        data=queries, x="case", y="Num. Queries",
        color="black", edgecolor="black", s=250, marker="*", ax=ax2,
    )
    ax2.tick_params(axis="y", labelsize=18)

    xticks = ["USQS"] + [i - 1 for i in range(11, 52, 10)]
    plt.xticks(list(range(len(xticks))), xticks, fontsize=18)

    ax1.set_xlabel("Sequential queries per period", fontsize=20)
    ax1.xaxis.set_label_coords(0.60, -0.1)
    ax1.set_ylabel("Difference from Real Values", fontsize=20)
    ax1.tick_params(axis="both", labelsize=18)

    ax2.set_ylabel("Number of Queries", fontsize=20)
    ax2.vlines(x=0.5, ymin=-5, ymax=52, color="black", linestyle="--", lw=1, clip_on=False)
    plt.ylim([-1, 52])

    plt.tight_layout()
    plt.savefig("mae_queries_difference.pdf")
    plt.close(fig)


if __name__ == "__main__":
    main()
