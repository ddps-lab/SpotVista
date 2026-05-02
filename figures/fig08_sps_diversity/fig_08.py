"""
Fig 8: SPS distribution by total core count, illustrating compute-pool
diversity across single- and multi-node spot allocations.
"""
import pandas as pd
import matplotlib.pyplot as plt


CORE_BUCKETS = [50, 60, 80, 100, 120, 160, 200, 240, 320, 360, 400,
                480, 640, 720, 800, 960, 1280]


def load_data():
    single = pd.read_csv("data/singlenode_sps_avg.csv").rename(columns={"_col3": "sps"})
    single["targetcapacity"] = 1
    multi = pd.read_csv("data/multinode_sps_avg.csv").rename(columns={"_col4": "sps"})
    hw_info = pd.read_csv("data/instance_hw_info.csv")

    df = pd.concat([single, multi])
    df = pd.merge(
        df, hw_info,
        left_on=["instancetype"], right_on=["InstanceType"], how="outer",
    ).dropna()
    df["total_core"] = (df["vCPU"] * df["targetcapacity"]).astype("int32")
    return df[df["total_core"].isin(CORE_BUCKETS)]


def main():
    df = load_data()

    plt.rcParams["font.size"] = 18
    fig, ax = plt.subplots(figsize=(8, 3.6))
    x_labels = sorted(df["total_core"].unique())
    box_data = [df[df["total_core"] == val]["sps"] for val in x_labels]

    ax.boxplot(
        box_data, tick_labels=x_labels,
        medianprops={"linewidth": 2},
        flierprops=dict(marker="o", markerfacecolor="black",
                        markeredgecolor="black", markersize=3),
    )
    ax.set_xlabel("Total Core")
    ax.set_ylabel("SPS")
    ax.set_yticks([1, 1.5, 2, 2.5, 3])
    ax.tick_params(axis="x", rotation=40)
    fig.tight_layout()
    fig.savefig("sps-difference-make-total-cores.pdf", dpi=300, bbox_inches="tight")
    plt.close(fig)


if __name__ == "__main__":
    main()
