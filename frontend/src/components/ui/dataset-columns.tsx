import { ColDef } from "ag-grid-community"

export type AWSDatasetRow = {
  InstanceType: string
  Region: string
  AZ: string
  SPS: number
  T2: number
  T3: number
  IF: number
  SpotPrice: number
  OndemandPrice: number
  Time: string
}

export type GCPDatasetRow = {
  id: string
  InstanceType: string
  Region: string
  "OnDemand Price": number
  "Spot Price": number
  time: string
}

export type AzureDatasetRow = {
  id: number
  InstanceTier: string
  InstanceType: string
  Region: string
  AvailabilityZone: string
  OndemandPrice: number
  SpotPrice: number
  Savings: number
  IF: number
  Score: number
  DesiredCount: number
  T2: number
  T3: number
  Time: string
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

const formatNumber = (params: { value: unknown }) => {
  if (isNA(params.value)) return "N/A"
  return String(params.value)
}

const formatSavings = (params: { value: unknown }) => {
  if (isNA(params.value)) return "N/A"
  return String(Math.round(params.value as number))
}

const calculateSavings = (params: { data?: Record<string, unknown> }) => {
  const data = params.data
  if (!data) return "N/A"

  let ondemand: number | undefined
  let spot: number | undefined

  if ("OndemandPrice" in data) {
    ondemand = data.OndemandPrice as number | undefined
    spot = data.SpotPrice as number | undefined
  } else {
    ondemand = data["OnDemand Price"] as number | undefined
    spot = data["Spot Price"] as number | undefined
  }

  if (!ondemand || !spot || ondemand === -1 || spot === -1) return "N/A"
  const savings = Math.round(((ondemand - spot) / ondemand) * 100)
  return Number.isNaN(savings) ? "N/A" : savings
}

const formatDate = (params: { value: unknown }) => {
  const dateStr = params.value
  if (!dateStr || typeof dateStr !== "string") return "N/A"
  try {
    const date = new Date(dateStr)
    if (Number.isNaN(date.getTime())) return dateStr

    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    const hours = String(date.getHours()).padStart(2, "0")
    const minutes = String(date.getMinutes()).padStart(2, "0")
    const seconds = String(date.getSeconds()).padStart(2, "0")

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
  } catch {
    return dateStr
  }
}

export const datasetAwsColDefs: ColDef<AWSDatasetRow>[] = [
  {
    field: "InstanceType",
    headerName: "Type",
    headerTooltip: "Instance Type",
    valueFormatter: formatNumber,
  },
  {
    field: "Region",
    headerTooltip: "Region",
    valueFormatter: formatNumber,
  },
  {
    field: "AZ",
    headerName: "AZ",
    headerTooltip:
      "Availability Zone ID. For details, please refer to https://docs.aws.amazon.com/ram/latest/userguide/working-with-az-ids.html",
    valueFormatter: formatNumber,
  },
  {
    field: "SPS",
    headerName: "SPS",
    headerTooltip:
      "In AWS, it is Spot Placement Score. For details, please refer to https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/spot-placement-score.html",
    comparator: naComparator,
    valueFormatter: formatNumber,
    maxWidth: 80,
  },
  {
    field: "T2",
    headerTooltip:
      "The maximum number of nodes whose Spot Placement Score (SPS) transitions from 2 to 1 denoted as T2",
    comparator: naComparator,
    valueFormatter: formatNumber,
    maxWidth: 80,
  },
  {
    field: "T3",
    headerTooltip:
      "The maximum number of nodes whose Spot Placement Score (SPS) transitions from 3 to 2 or 1 denoted as T3",
    comparator: naComparator,
    valueFormatter: formatNumber,
    maxWidth: 80,
  },
  {
    field: "IF",
    headerName: "IF",
    headerTooltip:
      "In AWS, it is Interruption-free score. For details, please refer to “Frequency of interruption” in https://aws.amazon.com/ec2/spot/instance-advisor",
    comparator: naComparator,
    valueFormatter: formatNumber,
    maxWidth: 80,
  },
  {
    field: "SpotPrice",
    headerName: "SpotPrice ($)",
    headerTooltip: "Spot Price (USD)",
    comparator: naComparator,
    valueFormatter: formatNumber,
  },
  {
    headerName: "Savings (%)",
    headerTooltip: "Savings Percentage",
    width: 150,
    comparator: naComparator,
    valueGetter: calculateSavings,
  },
  {
    field: "Time",
    headerName: "Date",
    headerTooltip: "Timestamp",
    valueFormatter: formatDate,
  },
]

export const datasetGcpColDefs: ColDef<GCPDatasetRow>[] = [
  {
    field: "InstanceType",
    headerTooltip: "Instance Type",
    valueFormatter: formatNumber,
    minWidth: 200,
  },
  {
    field: "Region",
    headerTooltip: "Region",
    valueFormatter: formatNumber,
    minWidth: 200,
  },
  {
    field: "OnDemand Price",
    headerTooltip: "On-Demand Price",
    comparator: naComparator,
    valueFormatter: formatNumber,
  },
  {
    field: "Spot Price",
    headerTooltip: "Spot Price",
    comparator: naComparator,
    valueFormatter: formatNumber,
  },
  {
    headerName: "Savings (%)",
    headerTooltip: "Savings Percentage",
    comparator: naComparator,
    valueGetter: calculateSavings,
  },
  {
    field: "time",
    headerName: "Date",
    headerTooltip: "Timestamp",
    valueFormatter: formatDate,
    minWidth: 300,
  },
]

export const datasetAzureColDefs: ColDef<AzureDatasetRow>[] = [
  {
    field: "InstanceTier",
    headerName: "Tier",
    headerTooltip: "Instance Tier",
    valueFormatter: formatNumber,
    maxWidth: 90,
  },
  {
    field: "InstanceType",
    headerName: "Type",
    headerTooltip: "Instance Type",
    valueFormatter: formatNumber,
  },
  {
    field: "Region",
    headerTooltip: "Region",
    valueFormatter: formatNumber,
  },
  {
    field: "AvailabilityZone",
    headerName: "AZ",
    headerTooltip: "Availability Zone",
    valueFormatter: formatNumber,
    maxWidth: 90,
  },
  {
    field: "SpotPrice",
    headerTooltip: "Spot Price",
    comparator: naComparator,
    valueFormatter: formatNumber,
  },
  {
    field: "Savings",
    headerName: "Savings (%)",
    headerTooltip: "Savings Percentage",
    comparator: naComparator,
    valueFormatter: formatSavings,
  },
  {
    field: "IF",
    headerName: "IF",
    headerTooltip:
      "In Azure, it is Interruption-free score. For details, please refer to https://learn.microsoft.com/en-us/azure/virtual-machines/spot-vms#pricing-and-eviction-history",
    comparator: naComparator,
    valueFormatter: formatNumber,
    maxWidth: 80,
  },
  {
    field: "Score",
    headerName: "SPS",
    headerTooltip:
      "In Azure, it is Spot Placement Score. For details, please refer to https://learn.microsoft.com/en-us/azure/virtual-machine-scale-sets/spot-placement-score",
    comparator: naComparator,
    valueFormatter: formatNumber,
    maxWidth: 80,
  },
  {
    field: "T2",
    headerTooltip:
      "The maximum number of nodes whose Spot Placement Score (SPS) transitions from 2 to 1 denoted as T2",
    width: 100,
    comparator: naComparator,
    valueFormatter: formatNumber,
    maxWidth: 80,
  },
  {
    field: "T3",
    headerTooltip:
      "The maximum number of nodes whose Spot Placement Score (SPS) transitions from 3 to 2 or 1 denoted as T3",
    width: 100,
    comparator: naComparator,
    valueFormatter: formatNumber,
    maxWidth: 80,
  },
  {
    field: "Time",
    headerName: "Date",
    headerTooltip: "Timestamp",
    valueFormatter: formatDate,
  },
]
