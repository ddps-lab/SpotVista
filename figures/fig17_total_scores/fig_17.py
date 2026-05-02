"""
Fig 17: Average accumulated total score as the recommender adds instance
types one by one, for the Category and Family scenarios (w=0.5).
"""
import warnings

import ast
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt

warnings.filterwarnings("ignore", category=FutureWarning)

LINE_STYLES = ["-", "--", "-.", ":", (0, (3, 1, 1, 1)),
               (0, (5, 10)), (0, (5, 5)), (0, (3, 5, 1, 5))]


def load_data():
    df = pd.concat([
        pd.read_csv("data/instance_all.csv"),
        pd.read_csv("data/instance_category.csv"),
        pd.read_csv("data/instance_family.csv"),
        pd.read_csv("data/instance_types.csv"),
    ])
    df = df[df["Weight"] == 0.5].copy()
    df["instances"] = df["instances"].apply(lambda x: eval(x) if isinstance(x, str) else x)
    df["total_score"] = df["instances"].apply(lambda x: [n[3] for n in x[0]])
    return df


def render_panel(df, scenario, out_pdf):
    sub = df[df["scenario"] == scenario].copy()
    sub["total_score"] = sub["total_score"].apply(
        lambda x: ast.literal_eval(x)[0] if isinstance(x, str) else x
    )

    fig, ax = plt.subplots(figsize=(6.1, 4.1))
    grey_colors = plt.cm.Greys(np.linspace(0.2, 1.0, len(sub)))
    for idx, (_, row) in enumerate(sub.iterrows()):
        scores = row["total_score"]
        if isinstance(scores, list):
            ax.plot(range(len(scores)), scores, marker="o",
                    linestyle=LINE_STYLES[idx % len(LINE_STYLES)],
                    color=grey_colors[idx])

    ax.set_xticks(range(9))
    ax.set_xticklabels(range(1, 10), fontsize=18)
    ax.tick_params(axis="y", labelsize=18)
    ax.set_xlabel("Number of Added Instance Types", fontsize=20)
    ax.set_ylabel("Average Accumulated Score", fontsize=20)
    ax.yaxis.set_label_coords(-0.12, 0.39)
    ax.grid(True)
    ax.set_ylim(0, 105)
    fig.tight_layout()
    fig.savefig(out_pdf)
    plt.close(fig)


def main():
    df = load_data()
    render_panel(df, "category", "total-scores-added-node-instance-category.pdf")
    render_panel(df, "family", "total-scores-added-node-instance-family.pdf")


if __name__ == "__main__":
    main()
