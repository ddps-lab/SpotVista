"use client"

import {
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react"
import { AgGridReact } from "ag-grid-react"
import {
  ColDef,
  ModuleRegistry,
  themeQuartz,
  colorSchemeDark,
  ClientSideRowModelModule,
  ValidationModule,
  PaginationModule,
  TextFilterModule,
  NumberFilterModule,
  DateFilterModule,
  CustomFilterModule,
  CsvExportModule,
  ColumnAutoSizeModule,
  TooltipModule,
} from "ag-grid-community"
import { useTheme } from "next-themes"

ModuleRegistry.registerModules([
  ClientSideRowModelModule,
  ValidationModule,
  PaginationModule,
  TextFilterModule,
  NumberFilterModule,
  DateFilterModule,
  CustomFilterModule,
  CsvExportModule,
  ColumnAutoSizeModule,
  TooltipModule,
])

export type AgGridTableHandle = {
  exportCsv: () => void
}

interface AgGridTableProps<TData> {
  rowData: TData[]
  columnDefs: ColDef<TData>[]
  emptyMessage?: string
  height?: number | string
  ref?: React.Ref<AgGridTableHandle>
}

export function AgGridTable<TData>({
  rowData,
  columnDefs,
  emptyMessage,
  height = 600,
  ref,
}: AgGridTableProps<TData>) {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const gridRef = useRef<AgGridReact<TData>>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  useImperativeHandle(
    ref,
    () => ({
      exportCsv: () => {
        gridRef.current?.api.exportDataAsCsv({
          fileName: "spotvista-data",
          columnSeparator: ",",
          suppressQuotes: false,
        })
      },
    }),
    [],
  )

  const defaultColDef = useMemo<ColDef>(
    () => ({
      minWidth: 80,
      filter: true,
      sortable: true,
      resizable: true,
      flex: 1,
    }),
    [],
  )

  const gridTheme = useMemo(() => {
    const base = (
      resolvedTheme === "dark"
        ? themeQuartz.withPart(colorSchemeDark)
        : themeQuartz
    ).withParams({
      borderRadius: 0,
      wrapperBorderRadius: 0,
    })
    return base
  }, [resolvedTheme])

  if (!mounted) return null

  return (
    <div style={{ height, width: "100%", minHeight: 0 }}>
      <AgGridReact<TData>
        ref={gridRef}
        rowData={rowData}
        columnDefs={columnDefs}
        defaultColDef={defaultColDef}
        enableCellTextSelection
        tooltipShowDelay={0}
        pagination
        paginationPageSize={20}
        paginationPageSizeSelector={[10, 20, 50, 100]}
        theme={gridTheme}
        overlayNoRowsTemplate={
          emptyMessage
            ? `<span style="font-size: 0.875rem; color: var(--muted-foreground);">${emptyMessage}</span>`
            : undefined
        }
      />
    </div>
  )
}
