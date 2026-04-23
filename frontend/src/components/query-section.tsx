"use client"

import { useEffect, useMemo, useState } from "react"
import axios from "axios"
import { RefreshCw, Zap } from "lucide-react"

import { Button } from "@/components/ui/button"
import { DatePicker } from "@/components/ui/date-picker"
import { Label } from "@/components/ui/label"
import { SearchableMultiSelect } from "@/components/ui/searchable-multi-select"
import { Slider } from "@/components/ui/slider"

type AssociationMap = Record<string, { Region: string[] }>

interface QuerySectionProps {
  vendor: "AWS"
  onDataFetch: (data: unknown[]) => void
  onReset: () => void
  setLoading: (loading: boolean) => void
  setToast: (toast: { type: "success" | "error"; message: string }) => void
}

const DEFAULT_INSTANCES = ["c8i.xlarge", "m8i.xlarge", "r8i.xlarge"]
const DEFAULT_REGIONS = ["us-east-1", "us-west-2", "ap-northeast-2"]
const MAX_SELECTED = 3

const ASSOCIATION_URL =
  "https://api.spotlake.ddps.cloud/query-selector/associated/association_aws.json"
const QUERY_URL = "https://spotvista.ddps.cloud/api/query"

const toLocalDateStr = (d: Date) => {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

export function QuerySection({
  vendor,
  onDataFetch,
  onReset,
  setLoading,
  setToast,
}: QuerySectionProps) {
  const [associations, setAssociations] = useState<AssociationMap | null>(null)

  const [selectedInstances, setSelectedInstances] =
    useState<string[]>(DEFAULT_INSTANCES)
  const [selectedRegions, setSelectedRegions] =
    useState<string[]>(DEFAULT_REGIONS)
  const [endDate, setEndDate] = useState<Date | undefined>(() => new Date())
  const [weight, setWeight] = useState(0.5)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const res = await axios.get<AssociationMap[]>(ASSOCIATION_URL)
        if (!cancelled && Array.isArray(res.data) && res.data[0]) {
          setAssociations(res.data[0])
        }
      } catch (error) {
        console.error("Failed to load association data", error)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [vendor])

  const instanceOptions = useMemo(
    () => (associations ? Object.keys(associations).sort() : []),
    [associations],
  )

  const regionOptions = useMemo(() => {
    if (!associations || selectedInstances.length === 0) return []
    const regions = new Set<string>()
    selectedInstances.forEach((instance) => {
      const assoc = associations[instance]
      if (!assoc) return
      assoc.Region.forEach((r) => {
        if (r && r !== "nan") regions.add(r)
      })
    })
    return Array.from(regions).sort((a, b) => a.localeCompare(b))
  }, [associations, selectedInstances])

  const handleInstancesChange = (next: string[]) => {
    setSelectedInstances(next)
    if (next.length === 0) {
      setSelectedRegions([])
    }
  }

  const validate = () => {
    if (selectedInstances.length === 0) {
      setToast({
        type: "error",
        message: "Please select at least one instance type.",
      })
      return false
    }
    if (selectedRegions.length === 0) {
      setToast({
        type: "error",
        message: "Please select at least one region.",
      })
      return false
    }
    if (!endDate) {
      setToast({
        type: "error",
        message: "Please select an end date.",
      })
      return false
    }
    return true
  }

  const handleReset = () => {
    setSelectedInstances(DEFAULT_INSTANCES)
    setSelectedRegions(DEFAULT_REGIONS)
    setEndDate(new Date())
    setWeight(0.5)
    onReset()
  }

  const handleSubmit = async () => {
    if (!validate()) return

    setLoading(true)
    try {
      const payload = {
        instance_types: selectedInstances,
        regions: selectedRegions,
        end: toLocalDateStr(endDate!),
        weight,
      }
      const res = await fetch(QUERY_URL, {
        method: "POST",
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error(res.statusText || "Request failed")
      const data = await res.json()
      onDataFetch(data)
      setToast({
        type: "success",
        message: "Query submitted successfully.",
      })
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown error"
      setToast({
        type: "error",
        message: `Failed to submit query. ${message}`,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Label htmlFor="instances">Instance Types</Label>
        <SearchableMultiSelect
          id="instances"
          values={selectedInstances}
          onValuesChange={handleInstancesChange}
          options={instanceOptions}
          placeholder="Select up to 3 instances"
          searchPlaceholder="Search instances..."
          emptyMessage="No instances found."
          maxSelected={MAX_SELECTED}
          disabled={instanceOptions.length === 0}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="regions">Regions</Label>
        <SearchableMultiSelect
          id="regions"
          values={selectedRegions}
          onValuesChange={setSelectedRegions}
          options={regionOptions}
          placeholder="Select up to 3 regions"
          searchPlaceholder="Search regions..."
          emptyMessage="Select instance types first."
          maxSelected={MAX_SELECTED}
          disabled={selectedInstances.length === 0}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="reference-date">Reference Date</Label>
        <DatePicker
          date={endDate}
          onDateChange={setEndDate}
          placeholder="Pick a date"
          maxDate={new Date()}
          className="w-full"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="weight">
          Weight
          <span className="ml-auto text-xs font-normal text-muted-foreground">
            {weight.toFixed(1)}
          </span>
        </Label>
        <div className="rounded-md border px-3 py-3">
          <Slider
            id="weight"
            value={[weight]}
            onValueChange={([v]) => setWeight(v)}
            min={0}
            max={1}
            step={0.1}
          />
          <div className="mt-2 flex justify-between text-xs text-muted-foreground">
            <span>Cost</span>
            <span>Availability</span>
          </div>
        </div>
      </div>

      <div className="mt-2 flex flex-col gap-2">
        <Button onClick={handleSubmit} type="button">
          <Zap className="size-4 text-white" />
          <span className="text-white">Analyze</span>
        </Button>
        <Button variant="outline" onClick={handleReset} type="button">
          <RefreshCw className="size-4" />
          Reset
        </Button>
      </div>
    </div>
  )
}
