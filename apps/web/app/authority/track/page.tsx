// apps/web/app/authority/track/page.tsx

"use client"

import { useEffect, useState } from "react"
import { ChevronDown, Search, X } from "lucide-react"
import { supabase } from "@/src/lib/supabase"
import {
  AssignDropdown,
  ComplaintDetailPanel,
} from "../_components/ComplaintDetailPanel"

// ─── Types ────────────────────────────────────────────────────────────────────

type ComplaintStatus =
  | "submitted" | "under_review" | "assigned"
  | "in_progress" | "resolved" | "rejected" | "escalated"

type SeverityLevel = "L1" | "L2" | "L3" | "L4"

type Complaint = {
  id: string
  ticket_id: string
  title: string
  status: ComplaintStatus
  effective_severity: SeverityLevel
  sla_breached: boolean
  sla_deadline: string | null
  escalation_level: number
  created_at: string
  resolved_at: string | null
  address_text: string | null
  assigned_worker_id: string | null
  upvote_count: number
  categories: { name: string } | null
}

type WorkerOption = {
  id: string
  full_name: string
  availability: string
  department: string
}

// ─── Display constants ────────────────────────────────────────────────────────

const SEV_BADGE: Record<SeverityLevel, string> = {
  L1: "bg-blue-100 text-blue-700",
  L2: "bg-yellow-100 text-yellow-700",
  L3: "bg-orange-100 text-orange-700",
  L4: "bg-red-100 text-red-700",
}

const SEV_LABEL: Record<SeverityLevel, string> = {
  L1: "L1 Low", L2: "L2 Medium", L3: "L3 High", L4: "L4 Critical",
}

const STATUS_BADGE: Record<ComplaintStatus, string> = {
  submitted:    "bg-gray-100 text-gray-600",
  under_review: "bg-yellow-100 text-yellow-700",
  assigned:     "bg-blue-100 text-blue-700",
  in_progress:  "bg-indigo-100 text-indigo-700",
  resolved:     "bg-green-100 text-green-700",
  rejected:     "bg-red-100 text-red-600",
  escalated:    "bg-purple-100 text-purple-700",
}

const STATUS_LABEL: Record<ComplaintStatus, string> = {
  submitted: "Submitted", under_review: "Under Review", assigned: "Assigned",
  in_progress: "In Progress", resolved: "Resolved", rejected: "Rejected", escalated: "Escalated",
}

const ALL_STATUSES: ComplaintStatus[] = [
  "submitted", "under_review", "assigned", "in_progress", "resolved", "escalated",
]

const ALL_SEVERITIES: SeverityLevel[] = ["L1", "L2", "L3", "L4"]

function timeAgo(dateStr: string): string {
  const diff  = Date.now() - new Date(dateStr).getTime()
  const mins  = Math.floor(diff / 60_000)
  const hours = Math.floor(diff / 3_600_000)
  const days  = Math.floor(diff / 86_400_000)
  if (mins < 1)   return "just now"
  if (mins < 60)  return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${days}d ago`
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AuthorityTrackPage() {
  const [complaints,   setComplaints]   = useState<Complaint[]>([])
  const [workers,      setWorkers]      = useState<WorkerOption[]>([])
  const [loading,      setLoading]      = useState(true)
  const [search,       setSearch]       = useState("")
  const [statusFilter, setStatusFilter] = useState<ComplaintStatus | "all">("all")
  const [sevFilter,    setSevFilter]    = useState<SeverityLevel | "all">("all")
  const [sortOrder,    setSortOrder]    = useState<"newest" | "oldest">("newest")
  const [filterOpen,   setFilterOpen]   = useState(false)
  const [selected,     setSelected]     = useState<Complaint | null>(null)

  async function fetchData() {
    const { data: authData } = await supabase.auth.getUser()
    const uid = authData?.user?.id
    if (!uid) return

    const { data: profile } = await supabase
      .from("profiles")
      .select("department")
      .eq("id", uid)
      .maybeSingle()

    const [{ data: rows }, { data: workerRows }] = await Promise.all([
      supabase
        .from("complaints")
        .select(
          "id, ticket_id, title, status, effective_severity, sla_breached, sla_deadline, " +
          "escalation_level, created_at, resolved_at, address_text, " +
          "assigned_worker_id, upvote_count, categories(name)"
        )
        .eq("assigned_officer_id", uid)
        .neq("status", "rejected")
        .order("created_at", { ascending: false }),

      supabase
        .from("worker_profiles")
        .select("worker_id, availability, department, profiles(full_name)")
        .eq("department", profile?.department ?? ""),
    ])

    setComplaints((rows ?? []) as unknown as Complaint[])
    setWorkers(
      (workerRows ?? []).map((w: any) => ({
        id:           w.worker_id,
        full_name:    w.profiles?.full_name ?? "Unknown",
        availability: w.availability,
        department:   w.department,
      }))
    )
    setLoading(false)
  }

  useEffect(() => { void fetchData() }, [])

  // ── Filter + sort ──────────────────────────────────────────────────────────

  const filtered = complaints
    .filter(c => {
      if (statusFilter !== "all" && c.status             !== statusFilter) return false
      if (sevFilter    !== "all" && c.effective_severity !== sevFilter)    return false
      if (search) {
        const q = search.toLowerCase()
        return (
          c.title.toLowerCase().includes(q) ||
          c.ticket_id.toLowerCase().includes(q) ||
          (c.categories?.name ?? "").toLowerCase().includes(q)
        )
      }
      return true
    })
    .sort((a, b) => {
      const diff = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      return sortOrder === "newest" ? -diff : diff
    })

  const activeFilterCount =
    (statusFilter !== "all" ? 1 : 0) +
    (sevFilter    !== "all" ? 1 : 0) +
    (sortOrder    !== "newest" ? 1 : 0)

  return (
    <>
      <div className="space-y-5">

        {/* Header */}
        <div className="rounded-2xl border border-gray-100 bg-white px-6 py-5 dark:border-gray-800 dark:bg-gray-950">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">
                Track Complaints
              </h1>
              <p className="mt-0.5 text-sm text-gray-400">
                {loading ? "Loading…" : `${filtered.length} of ${complaints.length} complaints`}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {/* Search */}
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search title, ID, category…"
                  className="w-60 rounded-lg border border-gray-200 bg-gray-50 py-2 pl-8 pr-8 text-sm text-gray-700 placeholder-gray-400 focus:border-[#b4725a] focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>

              {/* Filter */}
              <div className="relative">
                <button
                  onClick={() => setFilterOpen(o => !o)}
                  className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                    activeFilterCount > 0
                      ? "border-[#b4725a] bg-[#b4725a]/10 text-[#b4725a]"
                      : "border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400"
                  }`}
                >
                  Filter
                  {activeFilterCount > 0 && (
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#b4725a] text-[10px] font-bold text-white">
                      {activeFilterCount}
                    </span>
                  )}
                  <ChevronDown size={13} className={`transition-transform ${filterOpen ? "rotate-180" : ""}`} />
                </button>

                {filterOpen && (
                  <div className="absolute right-0 top-full z-30 mt-1 w-72 rounded-xl border border-gray-100 bg-white p-4 shadow-xl dark:border-gray-700 dark:bg-gray-900">
                    <div className="space-y-4">

                      {/* Status */}
                      <div>
                        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                          Status
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          <button
                            onClick={() => setStatusFilter("all")}
                            className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                              statusFilter === "all"
                                ? "bg-gray-800 text-white dark:bg-gray-200 dark:text-gray-900"
                                : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400"
                            }`}
                          >
                            All
                          </button>
                          {ALL_STATUSES.map(s => (
                            <button
                              key={s}
                              onClick={() => setStatusFilter(s)}
                              className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                                statusFilter === s
                                  ? "bg-[#4f392e] text-white"
                                  : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400"
                              }`}
                            >
                              {STATUS_LABEL[s]}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Severity */}
                      <div>
                        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                          Severity
                        </p>
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => setSevFilter("all")}
                            className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                              sevFilter === "all"
                                ? "bg-gray-800 text-white dark:bg-gray-200 dark:text-gray-900"
                                : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400"
                            }`}
                          >
                            All
                          </button>
                          {ALL_SEVERITIES.map(s => (
                            <button
                              key={s}
                              onClick={() => setSevFilter(s)}
                              className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                                sevFilter === s
                                  ? "bg-[#4f392e] text-white"
                                  : `${SEV_BADGE[s]} hover:opacity-80`
                              }`}
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Sort */}
                      <div>
                        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                          Sort
                        </p>
                        <div className="flex gap-1.5">
                          {(["newest", "oldest"] as const).map(o => (
                            <button
                              key={o}
                              onClick={() => setSortOrder(o)}
                              className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize transition-colors ${
                                sortOrder === o
                                  ? "bg-[#4f392e] text-white"
                                  : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400"
                              }`}
                            >
                              {o}
                            </button>
                          ))}
                        </div>
                      </div>

                      {activeFilterCount > 0 && (
                        <button
                          onClick={() => {
                            setStatusFilter("all")
                            setSevFilter("all")
                            setSortOrder("newest")
                          }}
                          className="w-full rounded-lg border border-gray-200 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-50 transition-colors dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
                        >
                          Clear all filters
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-2xl border border-gray-100 bg-white dark:border-gray-800 dark:bg-gray-950">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-50 dark:border-gray-800">
                  {["Ticket", "Title / Category", "Severity", "Status", "SLA", "Age", "Action"].map(h => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-gray-400 whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i} className="animate-pulse border-b border-gray-50">
                      {[80, 180, 60, 70, 40, 50, 80].map((w, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-3 rounded bg-gray-100" style={{ width: w }} />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-sm text-gray-400">
                      No complaints match your filters
                    </td>
                  </tr>
                ) : filtered.map(c => {
                  const canAssign =
                    !c.assigned_worker_id &&
                    (c.status === "submitted" || c.status === "under_review")

                  return (
                    <tr
                      key={c.id}
                      className="border-b border-gray-50 dark:border-gray-800/60 hover:bg-gray-50/60 dark:hover:bg-gray-900/40 transition-colors"
                    >
                      {/* Ticket ID */}
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs text-gray-500">
                          {c.ticket_id}
                        </span>
                      </td>

                      {/* Title + category */}
                      <td className="px-4 py-3">
                        <p className="max-w-[200px] truncate font-medium text-gray-800 dark:text-gray-200">
                          {c.title}
                        </p>
                        <p className="max-w-[200px] truncate text-xs text-gray-400">
                          {c.categories?.name ?? "—"}
                          {c.address_text ? ` · ${c.address_text}` : ""}
                        </p>
                      </td>

                      {/* Severity */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${SEV_BADGE[c.effective_severity]}`}>
                          {SEV_LABEL[c.effective_severity]}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_BADGE[c.status]}`}>
                          {STATUS_LABEL[c.status]}
                        </span>
                      </td>

                      {/* SLA */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        {c.sla_breached ? (
                          <span className="inline-flex rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-600">
                            Breached
                          </span>
                        ) : (
                          <span className="text-xs text-gray-300">OK</span>
                        )}
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
                            className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:border-gray-400 hover:text-gray-800 transition-colors dark:border-gray-700 dark:text-gray-400"
                          >
                            View
                          </button>
                          {canAssign && (
                            <AssignDropdown
                              complaintId={c.id}
                              workers={workers}
                              onAssigned={fetchData}
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
      </div>

      {/* Detail panel */}
      {selected && (
        <ComplaintDetailPanel
          complaint={selected as any}
          workers={workers}
          onClose={() => setSelected(null)}
          onAssigned={() => { fetchData(); setSelected(null) }}
        />
      )}
    </>
  )
}
