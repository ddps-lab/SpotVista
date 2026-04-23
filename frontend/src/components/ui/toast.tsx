"use client"

import { useEffect } from "react"
import { CheckCircle2, X, XCircle } from "lucide-react"

import { cn } from "@/lib/utils"

export type Toast = {
  type: "success" | "error"
  message: string
} | null

interface ToastProps {
  toast: Toast
  onClose: () => void
  durationMs?: number
}

export function Toast({ toast, onClose, durationMs = 4000 }: ToastProps) {
  useEffect(() => {
    if (!toast) return
    const handle = window.setTimeout(onClose, durationMs)
    return () => window.clearTimeout(handle)
  }, [toast, onClose, durationMs])

  if (!toast) return null

  const isError = toast.type === "error"

  return (
    <div
      role="status"
      className={cn(
        "fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-md border px-4 py-3 text-sm shadow-md",
        "bg-background text-foreground",
        isError ? "border-destructive/40" : "border-border",
      )}
    >
      {isError ? (
        <XCircle className="size-4 text-destructive" />
      ) : (
        <CheckCircle2 className="size-4 text-emerald-500" />
      )}
      <span className="max-w-sm">{toast.message}</span>
      <button
        type="button"
        onClick={onClose}
        className="text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
        aria-label="Close notification"
      >
        <X className="size-4" />
      </button>
    </div>
  )
}
