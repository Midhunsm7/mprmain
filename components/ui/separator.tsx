import * as React from "react"

export function Separator({ className }: { className?: string }) {
  return (
    <div
      className={`my-4 border-t border-gray-300 ${className ?? ""}`}
    />
  )
}
