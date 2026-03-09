// apps/web/app/authority/_components/AuthorityRecentTickets.tsx

"use client"

import { useState } from "react"
import { Eye } from "lucide-react"
import {
  SEVERITY_META,
  STATUS_META,
  timeAgo,
  type AuthorityComplaintRow,
  type WorkerOption,
} from "./dashboard-types"
import { AssignDropdown, ComplaintDetailPanel } from "./ComplaintDetailPanel"

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <tr className="border-b border-gray-50 dark:border-gray-800/60 animate-pulse">
      {[200, 60, 70, 50, 100].map((w, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-3 rounded bg-gray-100 dark:bg-gray-800" style={{ width: w }} />
        </td>
      ))}
    </tr>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

type Props = {
  complaints: AuthorityComplaintRow[]
  workers: WorkerOption[]
  loading: boolean
  error: string | null
  onRefresh: () => void
}

export default function AuthorityRecentTickets({
  complaints,
  workers,
  loading,
  error,
  onRefresh,
}: Props) {
  const [selected, setSelected] = useState<AuthorityComplaintRow | null>(null)

  const rows = complaints
    .filter(c =>
      c.status === "submitted" ||
      c.status === "under_review" ||
      c.status === "assigned"
    )
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 10)

  return (
    <>
      <div className="rounded-2xl border border-gray-100 bg-white dark:border-gray-800 dark:bg-gray-950">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-gray-800">
          <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
            Recent Tickets
          </h2>
          <a
            href="/authority/track"
            className="text-xs font-semibold text-[#b4725a] hover:underline"
          >
            View all →
          </a>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-50 dark:border-gray-800/60">
                {["Title / Location", "Severity", "Status", "Age", "Action"].map(h => (
                  <th
                    key={h}
                    className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500 whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
              ) : error ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-sm text-red-500">
                    {error}
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-400">
                    No pending tickets
                  </td>
                </tr>
              ) : rows.map(c => {
                const sev = SEVERITY_META[c.effective_severity]
                const st  = STATUS_META[c.status]
                const canAssign =
                  !c.assigned_worker_id &&
                  (c.status === "submitted" || c.status === "under_review")

                return (
                  <tr
                    key={c.id}
                    className="border-b border-gray-50 dark:border-gray-800/60 hover:bg-gray-50/60 dark:hover:bg-gray-900/40 transition-colors"
                  >
                    {/* Title */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className={`h-2 w-2 flex-shrink-0 rounded-full ${sev.dot}`} />
                        <div>
                          <p className="max-w-[200px] truncate font-medium text-gray-800 dark:text-gray-200">
                            {c.title}
                          </p>
                          <p className="max-w-[200px] truncate text-xs text-gray-400">
                            {c.categories?.name ?? "—"}
                            {c.address_text ? ` · ${c.address_text}` : ""}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Severity */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${sev.badge}`}>
                        {sev.label}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${st.badge}`}>
                        {st.label}
                      </span>
                    </td>

                    {/* Age */}
                    <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-400">
                      {timeAgo(c.created_at)}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelected(c)}
                          className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:border-gray-400 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400 transition-colors"
                        >
                          <Eye size={11} />
                          View
                        </button>

                        {canAssign && (
                          <AssignDropdown
                            complaintId={c.id}
                            workers={workers}
                            onAssigned={onRefresh}
                          />
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail panel */}
      {selected && (
        <ComplaintDetailPanel
          complaint={selected}
          workers={workers}
          onClose={() => setSelected(null)}
          onAssigned={onRefresh}
        />
      )}
    </>
  )
}
