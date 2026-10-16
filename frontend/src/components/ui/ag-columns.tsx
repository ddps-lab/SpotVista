import { ColDef } from "ag-grid-community"

export type SpotVistaRow = {
  InstanceType: string
  Region: string
  AZ: string
  SPS: number
  T3: number
  AvailabilityScore: number
  SpotPrice: number
  CostScore: number
  Weight: number
  TotalScore: number
}

const isNA = (v: unknown) =>
  v === -1 || v === "-1" || v === undefined || v === null || v === "N/A"

const naComparator = (
  a: number | null | undefined,
  b: number | null | undefined,
  _nodeA: unknown,
  _nodeB: unknown,
  isDescending: boolean,
) => {
  const aNA = isNA(a)
  const bNA = isNA(b)
  if (aNA && bNA) return 0
  if (aNA) return isDescending ? -1 : 1
  if (bNA) return isDescending ? 1 : -1
  return (a as number) - (b as number)
}

const formatValue = (params: { value: unknown }) => {
  if (isNA(params.value)) return "N/A"
  return String(params.value)
}

export const awsColDefs: ColDef<SpotVistaRow>[] = [
  {
    field: "InstanceType",
    headerName: "Instance Type",
    headerTooltip: "Instance Type",
    valueFormatter: formatValue,
  },
  {
    field: "Region",
    headerName: "Region",
    headerTooltip: "Region",
    valueFormatter: formatValue,
  },
  {
    field: "AZ",
    headerName: "AZ",
    headerTooltip:
      "Availability Zone ID. For details, please refer to https://docs.aws.amazon.com/ram/latest/userguide/working-with-az-ids.html",
    valueFormatter: formatValue,
    maxWidth: 100,
  },
  {
    field: "SPS",
    headerName: "SPS",
    headerTooltip:
      "Spot Placement Score. For details, please refer to https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/spot-placement-score.html",
    comparator: naComparator,
    valueFormatter: formatValue,
    maxWidth: 80,
  },
  {
    field: "T3",
    headerName: "T3",
    headerTooltip:
      "T3: the largest node count whose Spot Placement Score is 3, at the latest time in the window (max 50).",
    comparator: naComparator,
    valueFormatter: formatValue,
    maxWidth: 80,
  },
  {
    field: "AvailabilityScore",
    headerName: "Availability Score",
    headerTooltip:
      "0-100. Area under the T3 curve over the 7 days before the reference date, adjusted for its trend and volatility.",
    comparator: naComparator,
    valueFormatter: formatValue,
  },
  {
    field: "SpotPrice",
    headerName: "Spot Price ($)",
    headerTooltip: "Spot Price (USD)",
    comparator: naComparator,
    valueFormatter: formatValue,
  },
  {
    field: "CostScore",
    headerName: "Cost Score",
    headerTooltip: "Cost Score",
    comparator: naComparator,
    valueFormatter: formatValue,
  },
  {
    field: "Weight",
    headerName: "Weight",
    headerTooltip: "Weight balance between cost and availability",
    comparator: naComparator,
    valueFormatter: formatValue,
  },
  {
    field: "TotalScore",
    headerName: "Total Score",
    headerTooltip: "Weighted total score",
    comparator: naComparator,
    valueFormatter: formatValue,
  },
]
