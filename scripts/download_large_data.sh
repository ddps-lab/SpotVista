#!/bin/bash
# Download large CSV data files from S3 (gitignored due to GitHub's 100MB limit).
# Requires: AWS CLI configured with read access to ddps-lab-research-artifact.

set -e

BUCKET="s3://ddps-lab-research-artifact/spotvista-fgcs"
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

FILES=(
  "figures/common/data/t2t3df_08.csv"
  "figures/common/data/plotdf_08.csv"
  "figures/common/data/plotdf_08_processed.csv"
  "figures/fig02_as_explanation/data/maxinstance.csv"
  "figures/fig04_dataset_collection/data/bar_data/ground_truth.csv"
  "figures/fig04_dataset_collection/data/bar_data/usqs.csv"
  "figures/fig05_usqs_step_size/data/temporal_error_full.csv"
  "figures/fig14_delta_as_window/data/raw_box_period1_full.csv"
  "figures/fig14_delta_as_window/data/raw_box_period2_full.csv"
  "figures/fig14_delta_as_window/data/raw_box_period3_full.csv"
  "figures/fig14_delta_as_window/data/raw_box_period4_full.csv"
  "figures/fig15_t3_t2_correlation/data/maxinstance2.csv"
  "figures/fig15_t3_t2_correlation/data/maxinstance3.csv"
)

if ! command -v aws >/dev/null 2>&1; then
  echo "ERROR: aws CLI not found. Install: https://aws.amazon.com/cli/" >&2
  exit 1
fi

cd "$ROOT_DIR"
echo "Downloading ${#FILES[@]} files into $ROOT_DIR"

for f in "${FILES[@]}"; do
  if [[ -f "$f" ]] && [[ "$1" != "--force" ]]; then
    echo "skip (exists): $f   [use --force to overwrite]"
    continue
  fi
  mkdir -p "$(dirname "$f")"
  echo "===> $f"
  aws s3 cp "$BUCKET/$f" "$f" --only-show-errors
done

echo "Done."
