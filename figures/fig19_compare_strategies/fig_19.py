"""
Fig 19: SpotVista vs SpotFleet vs single-timepoint baselines.

Two grouped bar charts: (a) average availability percentage and (b) cost
savings, grouped by method (SingleTimepoint / SpotFleet / SpotVista).
"""
import warnings

import pandas as pd
import matplotlib.pyplot as plt

warnings.filterwarnings("ignore", category=FutureWarning)

GROUP_ORDER = ["High_SPS", "High_$T3$", "SF_LP", "SF_PCO", "SF_CO",
               "$W_0$", "$W_{0.5}$", "$W_1$"]
XTICK_LABELS = ["SPS", "$T3$", "LP", "PCO", "CO", "W:0.0", "W:0.5", "W:1.0"]
GROUP_LABELS = [("SingleTimepoint", -0.1), ("SpotFleet", 0), ("SpotVista", 0)]


def load_grouped(path, hue_map):
    df = pd.read_csv(path)
    df["DDDRequestTime"] = pd.to_datetime(df["DDDRequestTime"], unit="s")
    df = (
        df.groupby(["InstanceType", "AZ", "DDDRequestTime"])
        .apply(lambda x: (x["Code"] == "success").sum())
        .reset_index(name="Code")
    )
    df["hue"] = df["InstanceType"] + "_" + df["AZ"]
    for original, label in hue_map.items():
        df.loc[df["hue"] == original, "hue"] = label
    return df


def expand_rows(df, source_label, new_labels):
    rows = df[df["hue"] == source_label]
    extras = []
    for new_label in new_labels:
        copy = rows.copy()
        copy["hue"] = new_label
        extras.append(copy)
    df = pd.concat([df] + extras, ignore_index=True)
    return df[df["hue"] != source_label]


def build_availability_df():
    data = load_grouped("data/result.csv", {
        "c7i.2xlarge_us-west-2a": "$W_{0.5}$",
        "c7i.2xlarge_us-east-1b": "$W_1$",
        "c7i.2xlarge_sa-east-1b": "$W_0$",
    })
    df_extra = load_grouped("data/result2.csv", {
        "c7a.2xlarge_us-west-2a": "$W_{0.5}$",
        "c7a.2xlarge_us-east-1a": "$W_1$",
        "c7a.2xlarge_eu-central-1a": "$W_0$",
    })
    res3 = load_grouped("data/result3.csv", {
        "c7a.2xlarge_eu-central-1a": "High_SPS",
        "c7a.2xlarge_us-east-1a": "SF_CO_PCO",
        "c7a.2xlarge_us-east-1b": "SF_LP",
        "c7a.2xlarge_us-east-2b": "High_$T3$",
    })
    res4 = load_grouped("data/result4.csv", {
        "c7i.2xlarge_ap-south-1b": "High_$T3$",
        "c7i.2xlarge_us-east-1a": "SF_CO_PCO_LF",
        "c7i.2xlarge_sa-east-1b": "High_SPS",
    })
    res4 = expand_rows(res4, "SF_CO_PCO_LF", ["SF_CO", "SF_PCO", "SF_LF"])
    res4 = res4[res4["hue"] != "High_SPS"]

    res5 = load_grouped("data/result5.csv", {})
    res5 = res5[res5["hue"] != "c7a.2xlarge_eu-central-1a"]
    res5["hue"] = "High_SPS"

    res6 = load_grouped("data/result6.csv", {
        "c6i.2xlarge_us-west-2b": "W_HT3",
        "c6i.2xlarge_us-west-2a": "$W_1$",
        "c6i.2xlarge_ap-northeast-2c": "High_SPS_w0",
        "c6i.2xlarge_us-east-1a": "SF_LP",
        "c6i.2xlarge_us-east-1d": "SF_CO_PCO",
    })
    res6 = res6[res6["DDDRequestTime"] > "2024-10-13 19:00:00"]
    res6 = expand_rows(res6, "W_HT3", ["$W_{0.5}$", "High_$T3$"])
    res6 = expand_rows(res6, "High_SPS_w0", ["High_SPS", "$W_0$"])

    figure_df = pd.concat([data, df_extra, res3, res4, res5, res6])
    figure_df["Percent"] = figure_df["Code"] / 50 * 100
    figure_df = expand_rows(figure_df, "SF_CO_PCO", ["SF_CO", "SF_PCO"])
    return figure_df.reset_index(drop=True)


def render_grouped_bars(values, ylabel, out_pdf):
    plt.rcParams["font.size"] = 18

    gap = 1.2
    group1 = [0, 1]
    group2 = [g + gap + max(group1) for g in [0, 1, 2]]
    group3 = [g + gap + max(group2) for g in [0, 1, 2]]
    bar_positions = group1 + group2 + group3

    fig, ax = plt.subplots(figsize=(8, 3.4))
    for sp in ax.spines:
        ax.spines[sp].set_color("black")

    ax.bar(bar_positions, values, color="gray", width=0.8,
           edgecolor="black", linewidth=1.3, zorder=3)
    for x, h in zip(bar_positions, values):
        ax.text(x, h, f"{h:.1f}", ha="center", va="bottom")

    ax.set_xticks(bar_positions)
    ax.set_xticklabels(XTICK_LABELS, fontsize=16)
    ax.set_xlim(min(bar_positions) - 0.6, max(bar_positions) + 0.6)

    centers = [sum(g) / len(g) for g in [group1, group2, group3]]
    fontsize_offsets = [(16, -0.1), (17, 0), (17, 0)]
    for (label, dx), center, (fs, _) in zip(GROUP_LABELS, centers, fontsize_offsets):
        ax.text(center + dx, -0.2, label, ha="center", va="center",
                transform=ax.get_xaxis_transform(), fontsize=fs, fontweight="medium")

    for boundary in [(max(group1) + min(group2)) / 2, (max(group2) + min(group3)) / 2]:
        ax.vlines(x=boundary, ymin=-20, ymax=97, color="gray",
                  linestyle="--", lw=1.5, clip_on=False)

    ax.set_ylabel(ylabel)
    ax.set_ylim(0, 97)
    ax.tick_params(axis="x", which="major", pad=2)
    ax.grid(True, axis="y")
    ax.grid(False, axis="x")
    fig.tight_layout()
    fig.savefig(out_pdf, dpi=600, bbox_inches="tight")
    plt.close(fig)


def main():
    figure_df = build_availability_df()
    means = figure_df.groupby("hue")["Percent"].mean().reindex(GROUP_ORDER)
    render_grouped_bars(means.values, "Availability (%)",
                        "compare-different-strategies-availability.pdf")

    cost_methods = {
        "$W_0$":     [90, 85, 83, 77],
        "$W_{0.5}$": [64, 53, 68, 68],
        "$W_1$":     [63, 48, 64, 47],
        "High_$T3$": [43, 60, 68],
        "High_SPS":  [82, 83],
        "SF_CO":     [37, 64, 60, 62],
        "SF_PCO":    [37, 64, 60, 62],
        "SF_LP":     [51, 64, 64, 77],
    }
    cost_means = pd.Series(
        {k: sum(v) / len(v) for k, v in cost_methods.items()}
    ).reindex(GROUP_ORDER)
    render_grouped_bars(cost_means.values, "Savings (%)",
                        "compare-different-strategies-cost.pdf")


if __name__ == "__main__":
    main()
