# SpotVista

Availability-Aware Recommendation System for Reliable and Cost-Efficient Multi-Node Spot Instances.

Live: <https://spotvista.ddps.cloud>

SpotVista ranks AWS Spot instance placements by combining availability signals (Spot Placement Score, target capacity scores) with current spot price, exposing a weighted total score that users can tune from _cost-first_ to _availability-first_.

## Architecture

The site is fully static and there is no query API. SpotLake publishes, for each reference date, one JSON with the availability score of every spot instance; the browser downloads that file, keeps the selected instance types and regions, and applies only the cost score and weight.

```text
┌────────────────────────────────┐   GET index.json, scores/YYYY-MM-DD.json
│  frontend/ (Next.js, static)   │ ◀──────────────────────────────────────────────┐
│  S3 + CloudFront               │                                                │
│  filter + cost score + weight  │   d2krkjqajp4l0e.cloudfront.net/spotvista/aws/ │
└────────────────────────────────┘   (SpotLake public data, read-only)            │
                                                                                  │
            spotvista-daily-exporter Lambda (ddps-lab/spotlake, daily 01:00 UTC) ─┘
            scores every instance over the 7-day T3 window from TITANS change points
```

| Piece     | Tech                                                         | Notes                          |
| --------- | ------------------------------------------------------------ | ------------------------------ |
| Frontend  | Next.js 16 (App Router, static export), React 19, TypeScript | Tailwind v4 + shadcn/ui        |
| Grid      | AG Grid Community                                            | sortable / filter / CSV export |
| Dark mode | next-themes                                                  | System / Light / Dark          |
| Data      | SpotLake CloudFront JSON (`spotvista/aws/`)                  | one score file per date        |
| Ranking   | `frontend/src/lib/score.ts`                                  | see below                      |

## Routes

| Path        | Page        | Purpose                                                                                          |
| ----------- | ----------- | ------------------------------------------------------------------------------------------------ |
| `/`         | Recommender | Pick up to 3 instance types × 3 regions, reference date, weight slider → ranked recommendations. |
| `/artifact` | Artifact    | Links to the paper, this repository, the figure data release and SpotLake.                       |

## Data

Produced by `utility/spotvista_daily_exporter` in [ddps-lab/spotlake](https://github.com/ddps-lab/spotlake):

- `index.json`: available reference dates (`dates.first`, `dates.last`) and the InstanceType → Region list of the latest one, used by the selectors.
- `scores/YYYY-MM-DD.json`: every candidate for that reference date as `rows[InstanceType][Region] = [[AZ, SPS, T3, SpotPrice, AvailabilityScore], …]`. About 50,000 rows, 1.9 MB (about 0.5 MB compressed). One request per reference date; the page keeps it in memory, so changing the selection or weight does not download it again.

## Scoring

The scoring is the original SpotVista query module (`calculate_score.py`, `lambda_function.py`).

- **Window**: the 7 days before the reference date (the reference date itself is excluded), up to 1,008 ten-minute T3 values.
- **AvailabilityScore** (0–100), precomputed by SpotLake: area under the T3 curve relative to T3 = 50 throughout, minus a volatility penalty (standard deviation) plus a trend term (slope), each scaled by 0.1. SpotLake stores per-day aggregates and combines the 7 days into exactly the area, standard deviation and slope the original module computed from the raw values. Rounded to 4 decimals.
- **CostScore** (0–100), in the browser (`frontend/src/lib/score.ts`): exponential transform of the latest spot price; the cheapest selected candidate scores 100 and the mean price 50.
- **TotalScore**: `weight × AvailabilityScore + (1 − weight) × CostScore`.
- Candidates use the latest value in the window and need `SPS > 0` and `SpotPrice > 0`. Entries with fewer than two T3 values are left out.

## Local development

```bash
cd frontend
npm install
npm run dev          # http://localhost:3000
npm run build        # static export → frontend/out
npm run lint
```

Requires Node 20+. The data CloudFront allows only `https://spotvista.ddps.cloud` for CORS, so a page served from localhost cannot read it directly. For local development set `NEXT_PUBLIC_SPOTVISTA_DATA_ORIGIN` (default `https://d2krkjqajp4l0e.cloudfront.net/spotvista/aws`) to a same-origin proxy of that path or to a local copy of the files.

## Deployment

Pushes to `main` that touch `frontend/**` trigger [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml):

1. `npm ci` + `npm run build` inside `frontend/`
2. `aws s3 sync frontend/out/` → SpotVista bucket
3. `aws cloudfront create-invalidation` on the distribution

Pull requests run [`.github/workflows/pr-check.yml`](.github/workflows/pr-check.yml) (lint + build, no deploy).

### Required GitHub secrets

| Secret                                   | Purpose                                       |
| ---------------------------------------- | --------------------------------------------- |
| `AWS_DDPS_WEB_PUBLISH_ACCESS_KEY_ID`     | IAM key for S3 sync / CloudFront invalidation |
| `AWS_DDPS_WEB_PUBLISH_SECRET_ACCESS_KEY` | IAM secret                                    |
| `AWS_SPOTVISTA_S3_BUCKET_NAME`           | Target S3 bucket                              |
| `AWS_SPOTVISTA_CF_ID`                    | CloudFront distribution ID                    |

## Project layout

```text
SpotVista/
├── .github/workflows/      # deploy + PR CI
├── frontend/
│   ├── public/             # static assets (icons, logos)
│   └── src/
│       ├── app/            # App Router: / and /artifact
│       ├── components/
│       │   ├── ui/         # shadcn primitives + AG Grid wrappers
│       │   ├── header.tsx
│       │   └── query-section.tsx   # recommender form
│       └── lib/
│           ├── spotvista-data.ts   # fetch index.json and score files
│           ├── score.ts            # cost score, weight, ranking
│           └── …                   # cn(), vendor-logo helper
├── scripts/                # figure data download
└── README.md
```

## Credits

Built on top of the [DDPS Spotlake](https://github.com/ddps-lab/spotlake) dataset and pipeline.
