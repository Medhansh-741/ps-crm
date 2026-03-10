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

// Workflow stage derived from status
const STAGE_CONFIG: Record<string, { label: string; color: string }> = {
  submitted:    { label: "Awaiting Review",  color: "text-slate-500 bg-slate-50 dark:bg-slate-800/50"    },
  under_review: { label: "Admin Reviewing",  color: "text-amber-600 bg-amber-50 dark:bg-amber-900/20"   },
  assigned:     { label: "Worker Assigned",  color: "text-blue-600 bg-blue-50 dark:bg-blue-900/20"      },
  in_progress:  { label: "Work Underway",    color: "text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20"},
  resolved:     { label: "Resolved ✓",       color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20"},
  escalated:    { label: "Escalated ⚠",      color: "text-purple-600 bg-purple-50 dark:bg-purple-900/20"},
}

function SkeletonRow() {
  return (
    <tr className="border-b border-gray-50 dark:border-gray-800/60 animate-pulse">
      {[200, 60, 80, 50, 120, 90].map((w, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-3 rounded bg-gray-100 dark:bg-gray-800" style={{ width: w }} />
        </td>
      ))}
    </tr>
  )
}

type Props = {
  complaints: AuthorityComplaintRow[]
  workers: WorkerOption[]
  loading: boolean
  error: string | null
  onRefresh: () => void
}

export default function AuthorityRecentTickets({ complaints, workers, loading, error, onRefresh }: Props) {
  const [selected, setSelected] = useState<AuthorityComplaintRow | null>(null)

  const rows = complaints
    .filter(c => c.status !== "resolved" && c.status !== "rejected")
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 10)

  return (
    <>
      <div className="rounded-2xl border border-gray-100 bg-white dark:border-gray-800 dark:bg-gray-950">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-gray-800">
          <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Recent Tickets</h2>
          <a href="/authority/track" className="text-xs font-semibold text-[#b4725a] hover:underline">
            View all →
          </a>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-50 dark:border-gray-800/60">
                {["Title / Location", "Severity", "Status", "Age", "Stage", "Actions"].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500 whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
              ) : error ? (
                <tr><td colSpan={6} className="px-4 py-6 text-center text-sm text-red-500">{error}</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-400">No active tickets</td></tr>
              ) : rows.map(c => {
                const sev   = SEVERITY_META[c.effective_severity] ?? SEVERITY_META.L2
                const st    = STATUS_META[c.status]
                const stage = STAGE_CONFIG[c.status] ?? STAGE_CONFIG.submitted
                const canAssign = !c.assigned_worker_id && (c.status === "submitted" || c.status === "under_review")

                return (
                  <tr key={c.id} className="border-b border-gray-50 dark:border-gray-800/60 hover:bg-gray-50/60 dark:hover:bg-gray-900/40 transition-colors">
                    {/* Title */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className={`h-2 w-2 shrink-0 rounded-full ${sev.dot}`} />
                        <div>
                          <p className="max-w-[190px] truncate font-medium text-gray-800 dark:text-gray-200">{c.title}</p>
                          <p className="max-w-[190px] truncate text-xs text-gray-400">
                            {c.categories?.name ?? "—"}{c.address_text ? ` · ${c.address_text}` : ""}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Severity — from effective_severity, not hardcoded */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${sev.badge}`}>
                        {sev.shortLabel}
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

                    {/* Stage — replaces the vague "Action" column */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`inline-flex rounded-lg px-2 py-1 text-[10px] font-semibold ${stage.color}`}>
                        {stage.label}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelected(c)}
                          className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:border-gray-400 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400 transition-colors"
                        >
                          <Eye size={11} /> View
                        </button>
                        {canAssign && (
                          <AssignDropdown complaintId={c.id} workers={workers} onAssigned={onRefresh} />
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
