// apps/web/app/authority/_components/AuthorityStatusBreakdown.tsx

"use client"

import type { AuthorityComplaintRow } from "./dashboard-types"
import { getStatusBreakdown } from "./dashboard-types"

function SkeletonBreakdown() {
  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="space-y-1.5">
          <div className="flex justify-between">
            <div className="h-2.5 w-20 rounded bg-gray-100 dark:bg-gray-800" />
            <div className="h-2.5 w-6 rounded bg-gray-100 dark:bg-gray-800" />
          </div>
          <div className="h-2 w-full rounded-full bg-gray-100 dark:bg-gray-800" />
        </div>
      ))}
    </div>
  )
}

type Props = {
  complaints: AuthorityComplaintRow[]
  loading: boolean
}

export default function AuthorityStatusBreakdown({ complaints, loading }: Props) {
  const breakdown = getStatusBreakdown(complaints)
  const total     = breakdown.reduce((s, b) => s + b.count, 0)

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 dark:border-gray-800 dark:bg-gray-950">
      <h2 className="mb-4 text-sm font-semibold text-gray-800 dark:text-gray-200">
        Status Breakdown
      </h2>

      {loading ? (
        <SkeletonBreakdown />
      ) : total === 0 ? (
        <div className="flex h-24 items-center justify-center text-sm text-gray-400">
          No data
        </div>
      ) : (
        <div className="space-y-3">
          {breakdown.map(({ label, count, color }) => {
            const pct = total > 0 ? Math.round((count / total) * 100) : 0
            return (
              <div key={label}>
                <div className="mb-1 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <div
                      className="h-2 w-2 rounded-full flex-shrink-0"
                      style={{ background: color }}
                    />
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                      {label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-800 dark:text-gray-200">
                      {count}
                    </span>
                    <span className="text-[10px] text-gray-400 w-7 text-right">{pct}%</span>
                  </div>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%`, background: color }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
