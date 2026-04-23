"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { useTheme } from "next-themes"
import {
  BarChart3,
  CheckCircle2,
  Download,
  SlidersHorizontal,
} from "lucide-react"

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
import { awsColDefs, SpotVistaRow } from "@/components/ui/ag-columns"
import { QuerySection } from "@/components/query-section"
import { Toast, type Toast as ToastType } from "@/components/ui/toast"
import { vendorLogo } from "@/lib/vendor-logo"

type Vendor = "AWS"

export default function Home() {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [selectedVendor] = useState<Vendor>("AWS")
  const [rows, setRows] = useState<SpotVistaRow[]>([])
  const [loading, setLoading] = useState(false)
  const [hasQueried, setHasQueried] = useState(false)
  const [toast, setToast] = useState<ToastType>(null)
  const gridHandleRef = useRef<AgGridTableHandle>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleDataFetch = (data: unknown[]) => {
    setRows(data as SpotVistaRow[])
    setHasQueried(true)
  }

  const handleReset = () => {
    setRows([])
    setHasQueried(false)
  }

  const getColumns = () => {
    switch (selectedVendor) {
      case "AWS":
      default:
        return awsColDefs
    }
  }

  void mounted

  return (
    <div className="space-y-8">
      <section className="space-y-4 text-center">
        <h1 className="brand-wordmark text-5xl font-bold tracking-tighter">
          Spot Instance Recommender
        </h1>
        <p className="mx-auto text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
          Availability-Aware Recommendation System for Reliable and
          Cost-Efficient Multi-Node Spot Instances.
        </p>
      </section>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="border-primary py-3 ring-2 ring-primary/20 gap-1">
          <CardContent className="flex flex-col items-center justify-center gap-1 py-0">
            <Image
              src={vendorLogo("AWS", resolvedTheme, mounted)}
              alt="AWS"
              width={36}
              height={36}
              className="object-contain"
            />
            <p className="text-md font-medium">Amazon Web Services</p>
          </CardContent>
        </Card>
        <Card className="py-3 opacity-60 gap-1">
          <CardContent className="flex flex-col items-center justify-center gap-1 py-0">
            <Image
              src={vendorLogo("GCP", resolvedTheme, mounted)}
              alt="GCP"
              width={36}
              height={36}
              className="object-contain"
            />
            <p className="text-md font-medium">Google Cloud Platform</p>
            <span className="text-xs text-muted-foreground">Coming soon</span>
          </CardContent>
        </Card>
        <Card className="py-3 opacity-60 gap-1">
          <CardContent className="flex flex-col items-center justify-center gap-1 py-0">
            <Image
              src={vendorLogo("AZURE", resolvedTheme, mounted)}
              alt="Azure"
              width={36}
              height={36}
              className="object-contain"
            />
            <p className="text-md font-medium">Microsoft Azure</p>
            <span className="text-xs text-muted-foreground">Coming soon</span>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[220px_1fr]">
        <aside>
          <Card className="h-full">
            <CardHeader className="border-b">
              <CardTitle className="flex items-center gap-2">
                <SlidersHorizontal className="size-4 text-muted-foreground" />
                Query Configuration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <QuerySection
                vendor={selectedVendor}
                onDataFetch={handleDataFetch}
                onReset={handleReset}
                setLoading={setLoading}
                setToast={setToast}
              />
            </CardContent>
          </Card>
        </aside>

        <section className="min-w-0">
          <Card className="h-full gap-0 overflow-hidden pb-0">
            <CardHeader className="border-b">
              <CardTitle className="flex items-center gap-3">
                <BarChart3 className="size-4 text-muted-foreground" />
                <span>Spot Instaces<br />Analysis Results</span>
                {hasQueried && !loading && rows.length > 0 && (
                  <span className="flex items-center gap-1.5 text-sm font-normal text-muted-foreground">
                    <CheckCircle2 className="size-4 text-emerald-500" />
                    {rows.length} recommendations
                  </span>
                )}
              </CardTitle>
              <CardAction>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => gridHandleRef.current?.exportCsv()}
                  disabled={rows.length === 0 || loading}
                >
                  <Download className="size-4" />
                  Export CSV
                </Button>
              </CardAction>
            </CardHeader>
            <CardContent className="flex-1 min-h-0 p-0">
              {loading ? (
                <div className="flex h-full items-center justify-center">
                  <div className="size-8 animate-spin rounded-full border-b-2 border-primary" />
                </div>
              ) : (
                <AgGridTable
                  ref={gridHandleRef}
                  rowData={rows}
                  columnDefs={getColumns()}
                  height="100%"
                  emptyMessage={
                    hasQueried
                      ? "No data found."
                      : 'Enter conditions on the left and click "Analyze" to see results here.'
                  }
                />
              )}
            </CardContent>
          </Card>
        </section>
      </div>

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  )
}
