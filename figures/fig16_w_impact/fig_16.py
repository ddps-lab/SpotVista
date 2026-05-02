"""
Fig 16: Boxplots of Availability Score and Cost Score across the weight
parameter w used in the SpotVista recommendation cost function.
"""
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns


def main():
    data = pd.concat([
        pd.read_csv("data/instance_all_scenario.csv"),
        pd.read_csv("data/instance_category_scenario.csv"),
        pd.read_csv("data/instance_family_scenario.csv"),
        pd.read_csv("data/instance_types_scenario.csv"),
    ])

    FONTSIZE = 23

    fig, ax = plt.subplots(figsize=(6.2, 3.8))
    sns.boxplot(
        data=data, x="Weight", y="Availability Score",
        color="white", linewidth=2, linecolor="black",
        medianprops=dict(color="orange", linewidth=3.0), ax=ax,
    )
    ax.set_xlabel("Weight", fontsize=FONTSIZE)
    ax.set_ylabel("Availability Score", fontsize=FONTSIZE)
    ax.tick_params(axis="both", labelsize=FONTSIZE)
    fig.tight_layout()
    fig.savefig("w-impact-to-availability-score.pdf", dpi=300, bbox_inches="tight")
    plt.close(fig)

    fig, ax = plt.subplots(figsize=(6.2, 3.8))
    sns.boxplot(
        data=data, x="Weight", y="Cost Score",
        color="white", linewidth=2, linecolor="black",
        medianprops=dict(color="orange", linewidth=3.0), ax=ax,
    )
    ax.set_xlabel("Weight", fontsize=FONTSIZE)
    ax.set_ylabel("Cost Score", fontsize=FONTSIZE)
    ax.tick_params(axis="both", labelsize=FONTSIZE)
    fig.tight_layout()
    fig.savefig("w-impact-to-cost-score.pdf", dpi=300, bbox_inches="tight")
    plt.close(fig)


if __name__ == "__main__":
    main()
