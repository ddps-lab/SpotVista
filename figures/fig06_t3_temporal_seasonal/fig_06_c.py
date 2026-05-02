"""
Fig 6c: AWS vs Azure T3 weekly seasonal component (MSTL decomposition).

Loads cached hourly T3 series for both providers, runs MSTL with periods
[24, 168], and plots the weekly seasonal components overlaid.
"""
import os

import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import matplotlib.dates as mdates
from statsmodels.tsa.seasonal import MSTL

DIR = os.path.dirname(os.path.abspath(__file__))
START = "2025-03-16"
END = "2025-12-01"

AWS_CACHE = os.path.join(DIR, "data", "aws_interval_ts_local.csv")
AZURE_CACHE = os.path.join(DIR, "data", "azure_interval_ts_local.csv")


def load_cached(cache_path):
    ts = pd.read_csv(cache_path, index_col="Time", parse_dates=True).asfreq("h")
    ts["T3"] = ts["T3"].interpolate()
    return ts["2025-04-01":"2025-11-30"]


def main():
    ts_aws = load_cached(AWS_CACHE)
    ts_azure = load_cached(AZURE_CACHE)

    res_aws = MSTL(ts_aws["T3"], periods=[24, 168]).fit()
    res_azure = MSTL(ts_azure["T3"], periods=[24, 168]).fit()

    aws_weekly = res_aws.seasonal["seasonal_168"]
    az_weekly = res_azure.seasonal["seasonal_168"]

    plt.rcParams.update({"font.size": 20})
    fig, ax = plt.subplots(1, 1, figsize=(20, 3.5))
    ax.plot(aws_weekly.index, aws_weekly.values, color="tab:orange",
            linewidth=2, linestyle="-", label="AWS")
    ax.plot(az_weekly.index, az_weekly.values, color="tab:blue",
            linewidth=2, linestyle="-.", label="Azure")
    ax.set_ylabel("Seasonal Variation")
    ax.grid(True, color="lightgray", alpha=0.3)
    for d in pd.date_range(START, END, freq="D"):
        if d.weekday() == 5:  # weekend shading
            ax.axvspan(d, d + pd.Timedelta(days=2), color="black", alpha=0.05)
    ax.xaxis.set_major_locator(mdates.MonthLocator())
    ax.xaxis.set_major_formatter(mdates.DateFormatter("%Y-%m"))
    ax.xaxis.set_minor_locator(mdates.WeekdayLocator(byweekday=0))
    ax.set_xlim(pd.Timestamp("2025-04-01"), pd.Timestamp("2025-12-03"))
    leg = ax.legend(ncol=2, edgecolor="black", framealpha=1)
    for line in leg.get_lines():
        line.set_linewidth(3)
    fig.tight_layout()
    fig.savefig(os.path.join(DIR, "fig_t3_mstl_weekly_seasonal.pdf"),
                bbox_inches="tight", dpi=300)
    plt.close(fig)


if __name__ == "__main__":
    main()
