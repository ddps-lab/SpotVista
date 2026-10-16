"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { parseISO } from "date-fns"
import { RefreshCw, Zap } from "lucide-react"

import { Button } from "@/components/ui/button"
import { DatePicker } from "@/components/ui/date-picker"
import { Label } from "@/components/ui/label"
import { SearchableMultiSelect } from "@/components/ui/searchable-multi-select"
import { Slider } from "@/components/ui/slider"
import { rankCandidates } from "@/lib/score"
import {
  fetchIndex,
  fetchScores,
  WINDOW_DAYS,
  type ScoreFile,
  type SpotVistaIndex,
} from "@/lib/spotvista-data"

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
  const [index, setIndex] = useState<SpotVistaIndex | null>(null)
  // 기준일마다 점수 파일 하나(압축 약 0.5MB). 같은 날을 다시 분석하면 받아 둔 것을 쓴다.
  const scores = useRef(new Map<string, ScoreFile | null>())

  const [selectedInstances, setSelectedInstances] =
    useState<string[]>(DEFAULT_INSTANCES)
  const [selectedRegions, setSelectedRegions] =
    useState<string[]>(DEFAULT_REGIONS)
  const [endDate, setEndDate] = useState<Date | undefined>(() => new Date())
  const [weight, setWeight] = useState(0.5)

  // 점수 파일이 있는 기준일만 고를 수 있다.
  const minDate = index ? parseISO(index.dates.first) : undefined
  const maxDate = index ? parseISO(index.dates.last) : new Date()

  useEffect(() => {
    const controller = new AbortController()
    fetchIndex(controller.signal)
      .then((data) => {
        setIndex(data)
        const latest = parseISO(data.dates.last)
        setEndDate((d) => (d && d > latest ? latest : d))
      })
      .catch((error) => {
        if (!controller.signal.aborted) console.error("Failed to load index", error)
      })
    return () => controller.abort()
  }, [vendor])

  const instanceOptions = useMemo(
    () => (index ? Object.keys(index.instance_types).sort() : []),
    [index],
  )

  const regionOptions = useMemo(() => {
    if (!index || selectedInstances.length === 0) return []
    const regions = new Set<string>()
    selectedInstances.forEach((instance) => {
      index.instance_types[instance]?.forEach((r) => regions.add(r))
    })
    return Array.from(regions).sort((a, b) => a.localeCompare(b))
  }, [index, selectedInstances])

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
    setEndDate(maxDate)
    setWeight(0.5)
    onReset()
  }

  const handleSubmit = async () => {
    if (!validate()) return

    setLoading(true)
    try {
      const reference = toLocalDateStr(endDate!)
      if (!scores.current.has(reference)) {
        scores.current.set(reference, await fetchScores(reference))
      }
      const file = scores.current.get(reference)
      const data = file
        ? rankCandidates(file, selectedInstances, selectedRegions, weight)
        : []
      onDataFetch(data)
      // 지난 날짜를 고르면 그때 없던 타입은 데이터가 없다.
      setToast(
        data.length
          ? { type: "success", message: "Query submitted successfully." }
          : {
              type: "error",
              message: `No data for the selected instance types and regions in the ${WINDOW_DAYS} days before ${reference}.`,
            },
      )
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
          minDate={minDate}
          maxDate={maxDate}
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
