"""
Fig 18: SpotVista vs SpotVerse — available time and cost-per-hour by region
for two SpotVerse fleet sizes (T4, T6).

The comparison values are inlined here (taken from the canonical experiment
runs documented in the paper); no external data files are needed.
"""
import numpy as np
import matplotlib.pyplot as plt


REGIONS = ["us-east-1", "us-west-2", "ap-northeast-1", "eu-west-2"]
METHODS = ["SpotVerse - T4", "SpotVerse - T6", "SpotVista"]

AVAILABLE_TIME = {
    "SpotVerse - T4": [54.81, 87.50, 68.89, 5.93],
    "SpotVerse - T6": [85.81, 100.0, 98.64, 92.56],
    "SpotVista":      [99.32, 87.50, 95.94, 100.0],
}
COST_PER_HOUR = {
    "SpotVerse - T4": [1.163, 1.892, 2.162, 1.864],
    "SpotVerse - T6": [1.748, 2.268, 2.520, 2.066],
    "SpotVista":      [1.208, 1.892, 1.814, 1.966],
}
HATCH = {"SpotVerse - T4": "/", "SpotVerse - T6": "", "SpotVista": "\\"}
COLOR = {"SpotVerse - T4": "#F8F8F8", "SpotVerse - T6": "#D8D8D8", "SpotVista": "#717171"}


def grouped_bar(values_by_method, ylabel, ylim, yticks, out_pdf, return_handles=False):
    plt.rcParams["font.size"] = 18
    width = 0.25
    offsets = [-width, 0, width]
    x = np.arange(len(REGIONS))

    fig, ax = plt.subplots(figsize=(8, 3.4))
    bar_handles = []
    for i, method in enumerate(METHODS):
        bars = ax.bar(
            x + offsets[i], values_by_method[method], width,
            label=method, color=COLOR[method], edgecolor="black",
            hatch=HATCH[method],
        )
        bar_handles.append(bars[0])
    ax.set_xticks(x)
    ax.set_xticklabels(REGIONS)
    ax.set_ylabel(ylabel)
    if ylim is not None:
        ax.set_ylim(*ylim)
    if yticks is not None:
        ax.set_yticks(yticks)
    fig.tight_layout()
    fig.savefig(out_pdf, dpi=300, bbox_inches="tight")
    plt.close(fig)
    if return_handles:
        return bar_handles


def render_legend(handles, out_pdf):
    fig, ax = plt.subplots(figsize=(9, 0.5))
    ax.legend(
        handles, METHODS, ncol=3, loc="center", frameon=True, edgecolor="black",
        handletextpad=0.8, handlelength=3, labelspacing=2,
        fontsize=15, markerscale=4.0,
    )
    ax.axis("off")
    fig.tight_layout()
    fig.savefig(out_pdf, dpi=300, bbox_inches="tight", pad_inches=0)
    plt.close(fig)


def main():
    handles = grouped_bar(
        AVAILABLE_TIME, "Available Time (%)", None, None,
        "cmp-spotvista-spotverse-avail.pdf", return_handles=True,
    )
    grouped_bar(
        COST_PER_HOUR, "Cost per Hour ($)", (0, 2.6), np.arange(0, 3.0, 0.5),
        "cmp-spotvista-spotverse-cost.pdf",
    )
    render_legend(handles, "cmp-spotvista-spotverse-legend.pdf")


if __name__ == "__main__":
    main()
