"""
Fig 15: Histogram of |Pearson correlation| between AS computed from T2 vs
T3 capacity series, per (instance type, AZ).
"""
import warnings

import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.linear_model import LinearRegression

warnings.filterwarnings("ignore", category=FutureWarning)

WINDOW_START = "2024-09-04 12:00:00.000"
WINDOW_END = "2024-09-11 12:00:00.000"


def normalize_value(value, min_value, max_value):
    return (value - min_value) / (max_value - min_value)


def get_slope(values):
    n = len(values)
    x = np.linspace(0, n - 1, n).reshape(-1, 1)
    y_max = np.linspace(0, 50, n).astype(int)
    max_slope = LinearRegression().fit(x, y_max).coef_[0]
    actual_slope = LinearRegression().fit(x, values).coef_[0]
    if actual_slope < 0:
        return (actual_slope / -max_slope) * -0.1
    return actual_slope / max_slope * 0.1


def calculate_score(df):
    y = df["max_targetcapacity_with_score_3"]
    integral = np.trapezoid(y)
    slope = get_slope(y.values)
    norm_std = (y.std() / 25) * 0.1
    max_integral = np.trapezoid([50] * len(df))
    norm_int = normalize_value(integral, 0, max_integral)
    return (norm_int - norm_int * norm_std + norm_int * slope) * 100


def main():
    data2 = pd.read_csv("./data/maxinstance2.csv")
    data3 = pd.read_csv("./data/maxinstance3.csv")
    data2 = data2[(data2["time"] > WINDOW_START) & (data2["time"] < WINDOW_END)].copy()
    data3 = data3[(data3["time"] > WINDOW_START) & (data3["time"] < WINDOW_END)].copy()

    data2["date"] = pd.to_datetime(data2["time"]).dt.date
    data3["date"] = pd.to_datetime(data3["time"]).dt.date

    result3 = data3.groupby(["instancetype", "region", "availabilityzoneid", "date"]).apply(
        calculate_score
    ).reset_index(name="score")
    result2 = data2.groupby(["instancetype", "region", "availabilityzoneid", "date"]).apply(
        calculate_score
    ).reset_index(name="score")

    merged = pd.merge(
        result2, result3,
        on=["instancetype", "availabilityzoneid", "date"], suffixes=("_2", "_3"),
    )
    correlations = merged.groupby(["instancetype", "availabilityzoneid"]).apply(
        lambda x: x["score_2"].corr(x["score_3"])
    ).reset_index().dropna()
    correlations[0] = abs(correlations[0])

    plt.rcParams["font.size"] = 18
    fig, ax = plt.subplots(figsize=(8, 3.5))
    sns.histplot(correlations.iloc[:, 2], bins=30, stat="percent", color="gray", ax=ax)
    ax.set_xlabel("Absolute Value of Correlation")
    ax.set_ylabel("Ratio (%)")
    ax.grid(True, axis="y", alpha=0.5)
    ax.set_yticks(list(range(0, 31, 5)))
    ax.set_ylim(0, 32)
    fig.tight_layout()
    fig.savefig("correlation-between-t3-and-t2-availability-score.pdf",
                dpi=300, bbox_inches="tight")
    plt.close(fig)


if __name__ == "__main__":
    main()
