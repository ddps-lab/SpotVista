"""
Fig 10: 24-hour T3-sustaining ratio across T3 thresholds.

For each threshold T, takes all (instance, AZ) keys with T3 == T at the
start time, then computes the share that still has T3 >= T 24 hours later.
"""
import warnings

import polars as pl
import matplotlib.pyplot as plt

warnings.filterwarnings("ignore")

THRESHOLDS = [1, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50]
START_TIME_STR = "2025-08-01 00:00:00"


def survival_rate_24h(plotdf, threshold):
    initial_keys = plotdf.filter(
        (pl.col("Time") == START_TIME_STR) & (pl.col("T3") == threshold)
    ).select("Key").unique()
    if initial_keys.is_empty():
        return None

    survival_data = plotdf.filter(pl.col("Key").is_in(initial_keys.get_column("Key")))
    failure_times = (
        survival_data.filter(pl.col("T3") < threshold)
        .group_by("Key")
        .agg(pl.col("Time").min().alias("failure_time"))
    )
    start = pl.datetime(2025, 8, 1, 0, 0, 0)

    durations = (
        initial_keys.join(failure_times, on="Key", how="left")
        .with_columns(
            pl.when(pl.col("failure_time").is_null())
            .then(pl.duration(days=31))
            .otherwise(pl.col("failure_time").str.to_datetime() - start)
            .alias("duration")
        )
        .with_columns((pl.col("duration").dt.total_seconds() / 3600).alias("hours"))
    )

    total = durations.height
    failures_within_24h = durations.filter(pl.col("hours") <= 24).height
    survivors = total - failures_within_24h
    return survivors / total * 100


def main():
    plotdf = pl.read_csv("data/plotdf_08.csv")
    survival_rates = []
    for t in THRESHOLDS:
        rate = survival_rate_24h(plotdf, t)
        survival_rates.append(rate if rate is not None else 0.0)

    FONT_SIZE = 24
    fig, ax = plt.subplots(figsize=(8, 6))
    ax.plot(THRESHOLDS, survival_rates, marker="o", linewidth=3,
            markersize=12, color="black")
    ax.set_xlabel("T3", fontsize=FONT_SIZE)
    ax.set_ylabel("24-hour T3 sustatining ratio (%)", fontsize=FONT_SIZE - 1.5)
    ax.grid(True, alpha=0.5)
    ax.set_xticks(THRESHOLDS)
    ax.tick_params(axis="both", labelsize=FONT_SIZE)
    ax.set_ylim(10, 81)
    fig.tight_layout()
    fig.savefig("24-hour-survive-T3.pdf", dpi=300)
    plt.close(fig)


if __name__ == "__main__":
    main()
