"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { useTheme } from "next-themes"
import { BarChart3, Download } from "lucide-react"

import type { ColDef } from "ag-grid-community"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  AgGridTable,
  type AgGridTableHandle,
} from "@/components/ui/ag-grid-table"
import {
  datasetAwsColDefs,
  datasetGcpColDefs,
  datasetAzureColDefs,
} from "@/components/ui/dataset-columns"
import { DatasetQuerySection } from "@/components/dataset-query-section"
import { DatasetQueryChart } from "@/components/dataset-query-chart"
import { vendorLogo } from "@/lib/vendor-logo"

type Vendor = "AWS" | "GCP" | "AZURE"

type DatasetRow = Record<string, unknown>

export default function DatasetPage() {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [selectedVendor, setSelectedVendor] = useState<Vendor>("AWS")
  const [data, setData] = useState<DatasetRow[]>([])
  const [loading, setLoading] = useState(false)
  const [isQueried, setIsQueried] = useState(false)
  const [queryFilters, setQueryFilters] = useState<{
    start: string
    end: string
    region: string
  } | null>(null)
  const gridHandleRef = useRef<AgGridTableHandle>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setIsQueried(false)
      setQueryFilters(null)
      try {
        let url = ""
        if (selectedVendor === "AWS") {
          url =
            "https://api.spotlake.ddps.cloud/latest_data/latest_aws.json"
        } else if (selectedVendor === "GCP") {
          url =
            "https://api.spotlake.ddps.cloud/latest_data/latest_gcp.json"
        } else if (selectedVendor === "AZURE") {
          url =
            "https://api.spotlake.ddps.cloud/latest_data/latest_azure.json"
        }
        const response = await fetch(url)
        const jsonData = await response.json()
        setData(jsonData)
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [selectedVendor])

  const getColumns = (): ColDef<DatasetRow>[] => {
    switch (selectedVendor) {
      case "AWS":
        return datasetAwsColDefs as unknown as ColDef<DatasetRow>[]
      case "GCP":
        return datasetGcpColDefs as unknown as ColDef<DatasetRow>[]
      case "AZURE":
        return datasetAzureColDefs as unknown as ColDef<DatasetRow>[]
      default:
        return datasetAwsColDefs as unknown as ColDef<DatasetRow>[]
    }
  }

  const handleDataFetch = (
    newData: unknown[],
    filters: { start: string; end: string; region: string },
  ) => {
    const normalizedData = (newData as DatasetRow[]).map((item) => {
      const next: DatasetRow = {
        ...item,
        Time: (item.Time as string) || (item.time as string),
      }
      const coerce = (k: string) => {
        const v = item[k]
        if (typeof v === "string") next[k] = parseFloat(v)
      }
      ;[
        "SpotPrice",
        "OndemandPrice",
        "SPS",
        "IF",
        "T2",
        "T3",
        "OnDemand Price",
        "Spot Price",
      ].forEach(coerce)
      return next
    })
    setData(normalizedData)
    setIsQueried(true)
    setQueryFilters(filters)
  }

  void mounted

  const vendors: { id: Vendor; name: string }[] = [
    { id: "AWS", name: "Amazon Web Services" },
    { id: "GCP", name: "Google Cloud Platform" },
    { id: "AZURE", name: "Microsoft Azure" },
  ]

  return (
    <div className="space-y-8">
      <section className="space-y-4 text-center">
       <h1 className="brand-wordmark text-5xl font-bold tracking-tighter">
          Spot Instance Dataset
        </h1>
        <p className="mx-auto text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
          Spot instance pricing and availability across major cloud providers.
        </p>
      </section>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {vendors.map((v) => {
          const active = selectedVendor === v.id
          return (
            <Card
              key={v.id}
              role="button"
              tabIndex={0}
              onClick={() => setSelectedVendor(v.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault()
                  setSelectedVendor(v.id)
                }
              }}
              className={`cursor-pointer py-3 gap-1 transition-all hover:border-primary ${
                active ? "border-primary ring-2 ring-primary/20" : ""
              }`}
            >
              <CardContent className="flex flex-col items-center justify-center gap-1 py-0">
                <Image
                  src={vendorLogo(v.id, resolvedTheme, mounted)}
                  alt={v.name}
                  width={36}
                  height={36}
                  className="object-contain"
                />
                <p className="text-md font-medium">{v.name}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <DatasetQuerySection
        vendor={selectedVendor}
        onDataFetch={handleDataFetch}
        setLoading={setLoading}
      />

      <Card className="gap-0 overflow-hidden pb-0">
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-3">
            <BarChart3 className="size-4 text-muted-foreground" />
            <span>Results</span>
            {!loading && data.length > 0 && (
              <span className="text-sm font-normal text-muted-foreground">
                {data.length} rows
              </span>
            )}
          </CardTitle>
          <CardAction>
            <Button
              variant="outline"
              size="sm"
              onClick={() => gridHandleRef.current?.exportCsv()}
              disabled={data.length === 0 || loading}
            >
              <Download className="size-4" />
              Export CSV
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex h-[600px] items-center justify-center">
              <div className="size-8 animate-spin rounded-full border-b-2 border-primary" />
            </div>
          ) : (
            <AgGridTable
              ref={gridHandleRef}
              rowData={data}
              columnDefs={getColumns()}
            />
          )}
        </CardContent>
      </Card>

      {isQueried &&
        queryFilters &&
        queryFilters.region !== "ALL" &&
        queryFilters.region !== "" && (
          <DatasetQueryChart data={data} dateRange={queryFilters} />
        )}
    </div>
  )
}
