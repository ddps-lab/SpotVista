# SpotVista

Availability-Aware Recommendation System for Reliable and Cost-Efficient Multi-Node Spot Instances.

Live: <https://spotvista.ddps.cloud>

SpotVista ranks AWS Spot instance placements by combining availability signals (Spot Placement Score, target capacity scores) with current spot price, exposing a weighted total score that users can tune from _cost-first_ to _availability-first_.

## Architecture

```text
┌────────────────────────────────┐         ┌────────────────────────────────┐
│  frontend/ (Next.js, static)   │ ──POST─▶ spotvista.ddps.cloud/api/query  │
│  S3 + CloudFront               │         │  (AWS Lambda, not in this repo)│
└────────────────────────────────┘         └────────────────────────────────┘
          ▲
          │ association / latest data (JSON)
          │
  d26bk4799jlxhe.cloudfront.net  (Spotlake dataset, read-only)
```

| Piece       | Tech                                                         | Notes                          |
| ----------- | ------------------------------------------------------------ | ------------------------------ |
| Frontend    | Next.js 16 (App Router, static export), React 19, TypeScript | Tailwind v4 + shadcn/ui        |
| Grid        | AG Grid Community                                            | sortable / filter / CSV export |
| Charts      | Recharts                                                     | time-series per numeric field  |
| Dark mode   | next-themes                                                  | System / Light / Dark          |
| Query API   | `POST /api/query` (external)                                 | see below                      |
| Dataset API | Spotlake CloudFront JSON                                     | read-only snapshots            |

## Routes

| Path        | Page        | Purpose                                                                                           |
| ----------- | ----------- | ------------------------------------------------------------------------------------------------- |
| `/`         | Recommender | Pick up to 3 instance types × 3 regions, reference date, weight slider → ranked recommendations.  |
| `/dataset`  | Dataset     | Browse the raw Spotlake dataset for AWS / GCP / Azure, filter by instance / region / AZ / period. |

## Query API

**Endpoint:** `POST https://spotvista.ddps.cloud/api/query`
**Content-Type:** `application/json`

### Request

| Field            | Type       | Description                                                         |
| ---------------- | ---------- | ------------------------------------------------------------------- |
| `instance_types` | `string[]` | EC2 instance types (e.g. `"c8i.xlarge"`)                            |
| `regions`        | `string[]` | AWS regions (e.g. `"us-east-1"`)                                    |
| `end`            | `string`   | `YYYY-MM-DD`. Availability window is the 7 days ending on this date |
| `weight`         | `number`   | 0–1. `1.0` = availability only, `0.0` = cost only                   |

```json
{
  "instance_types": ["c8i.xlarge", "m8i.xlarge", "r8i.xlarge"],
  "regions": ["us-west-2", "us-east-1", "ap-northeast-2"],
  "end": "2026-03-20",
  "weight": 0.5
}
```

### Response

JSON array sorted by `TotalScore` (descending).

| Field               | Type      | Description                             |
| ------------------- | --------- | --------------------------------------- |
| `id`                | `integer` | Rank (1 = best)                         |
| `InstanceType`      | `string`  | EC2 instance type                       |
| `Region`            | `string`  | AWS region                              |
| `AZ`                | `string`  | Availability zone                       |
| `SpotPrice`         | `number`  | Current spot price (USD/hr)             |
| `SPS`               | `integer` | Spot Placement Score                    |
| `T3`                | `integer` | Target capacity score                   |
| `AvailabilityScore` | `number`  | 0–1                                     |
| `CostScore`         | `number`  | 0–1 (higher = cheaper)                  |
| `TotalScore`        | `number`  | `weight·Availability + (1-weight)·Cost` |
| `Weight`            | `number`  | Weight used in scoring                  |

### curl

```bash
curl -X POST https://spotvista.ddps.cloud/api/query \
  -H "Content-Type: application/json" \
  -d '{
    "instance_types": ["c8i.xlarge"],
    "regions": ["us-east-1"],
    "end": "2026-03-20",
    "weight": 0.5
  }'
```

## Local development

```bash
cd frontend
npm install
npm run dev          # http://localhost:3000
npm run build        # static export → frontend/out
npm run lint
```

Requires Node 20+.

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
│       ├── app/            # App Router: / and /dataset
│       ├── components/
│       │   ├── ui/         # shadcn primitives + AG Grid wrappers
│       │   ├── header.tsx
│       │   ├── query-section.tsx          # recommender form
│       │   ├── dataset-query-section.tsx  # dataset filters
│       │   └── dataset-query-chart.tsx    # recharts time series
│       └── lib/            # cn(), vendor-logo helper
└── README.md
```

## Credits

Built on top of the [DDPS Spotlake](https://github.com/ddps-lab/spotlake) dataset and pipeline.
