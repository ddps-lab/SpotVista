"""
Fig 5: USQS step-size sensitivity. Plots mean absolute error vs step size
Ts=1..50 with a marker at the optimum.
"""
import pandas as pd
import matplotlib.pyplot as plt


def main():
    df = pd.read_csv("data/temporal_error_full.csv")

    computed_mae = df.groupby("Ts")["error"].mean()
    ts_values = sorted(df["Ts"].unique())
    mae_values = [computed_mae[ts] for ts in ts_values]
    best_ts = ts_values[mae_values.index(min(mae_values))]

    plt.rcParams["font.size"] = 18
    fig, ax = plt.subplots(figsize=(8, 3.6))
    ax.plot(ts_values, mae_values, "o-", color="#000", linewidth=2, markersize=7)
    ax.set_xlabel("Step Size (Ts)")
    ax.set_ylabel("Mean Absolute Error")
    ax.set_xticks(range(0, 51, 5))
    ax.set_yticks(range(0, 8, 1))
    ax.set_ylim(0, 7.5)
    ax.grid(True, alpha=0.3)
    ax.axvline(x=best_ts, color="red", linestyle=":", alpha=0.8, linewidth=2)
    fig.tight_layout()
    fig.savefig("cmp-usqs-step-size.pdf", dpi=300, bbox_inches="tight")
    plt.close(fig)


if __name__ == "__main__":
    main()
