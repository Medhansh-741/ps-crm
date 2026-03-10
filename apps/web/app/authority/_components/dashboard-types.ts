// apps/web/app/authority/_components/dashboard-types.ts

export type ComplaintStatus =
  | "submitted"
  | "under_review"
  | "assigned"
  | "in_progress"
  | "resolved"
  | "rejected"
  | "escalated"

export type SeverityLevel = "L1" | "L2" | "L3" | "L4"

export type AuthorityComplaintRow = {
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

export type TrendPoint = {
  day: string       // "Mon 10", "Tue 11" etc  — used for day view
  month: string     // "Mar '26" etc            — kept for compat
  submitted: number
  resolved: number
  in_progress: number
  assigned: number
}

export type WorkerOption = {
  id: string
  full_name: string
  availability: string
  department: string
}

export type DashboardStats = {
  total: number
  pendingAction: number
  inProgress: number
  resolvedThisMonth: number
  slaBreached: number
}

export const PENDING_STATUSES:   ComplaintStatus[] = ["submitted", "under_review"]
export const ACTIVE_STATUSES:    ComplaintStatus[] = ["assigned", "in_progress"]
export const ESCALATED_STATUSES: ComplaintStatus[] = ["escalated"]
export const URGENT_SEVERITIES:  SeverityLevel[]   = ["L3", "L4"]

export const SEVERITY_RANK: Record<SeverityLevel, number> = {
  L4: 4, L3: 3, L2: 2, L1: 1,
}

export const SEVERITY_META: Record<SeverityLevel, { label: string; shortLabel: string; dot: string; badge: string }> = {
  L1: {
    label: "Low",      shortLabel: "Low",
    dot:   "bg-sky-400",
    badge: "bg-sky-50 text-sky-700 ring-1 ring-sky-200 dark:bg-sky-900/30 dark:text-sky-300",
  },
  L2: {
    label: "Medium",   shortLabel: "Med",
    dot:   "bg-amber-400",
    badge: "bg-amber-50 text-amber-700 ring-1 ring-amber-200 dark:bg-amber-900/30 dark:text-amber-300",
  },
  L3: {
    label: "High",     shortLabel: "High",
    dot:   "bg-orange-500",
    badge: "bg-orange-50 text-orange-700 ring-1 ring-orange-200 dark:bg-orange-900/30 dark:text-orange-300",
  },
  L4: {
    label: "Critical", shortLabel: "Crit",
    dot:   "bg-red-500",
    badge: "bg-red-50 text-red-700 ring-1 ring-red-200 dark:bg-red-900/30 dark:text-red-400",
  },
}

export const STATUS_META: Record<ComplaintStatus, { label: string; badge: string; step: number }> = {
  submitted:    { label: "Submitted",    badge: "bg-gray-100 text-gray-600 ring-1 ring-gray-200 dark:bg-gray-800 dark:text-gray-300",             step: 1 },
  under_review: { label: "Under Review", badge: "bg-yellow-50 text-yellow-700 ring-1 ring-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300", step: 2 },
  assigned:     { label: "Assigned",     badge: "bg-blue-50 text-blue-700 ring-1 ring-blue-200 dark:bg-blue-900/30 dark:text-blue-300",            step: 3 },
  in_progress:  { label: "In Progress",  badge: "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300", step: 4 },
  resolved:     { label: "Resolved",     badge: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300", step: 5 },
  rejected:     { label: "Rejected",     badge: "bg-red-50 text-red-600 ring-1 ring-red-200 dark:bg-red-900/30 dark:text-red-400",                 step: 0 },
  escalated:    { label: "Escalated",    badge: "bg-purple-50 text-purple-700 ring-1 ring-purple-200 dark:bg-purple-900/30 dark:text-purple-300",  step: 6 },
}

// Workflow steps shown in the detail panel
export const WORKFLOW_STEPS: { key: ComplaintStatus | "_worker"; label: string; actor: string }[] = [
  { key: "submitted",    label: "Filed",         actor: "Citizen"    },
  { key: "under_review", label: "Under Review",  actor: "Admin"      },
  { key: "assigned",     label: "Assigned",      actor: "Authority"  },
  { key: "_worker",      label: "Work Started",  actor: "Worker"     },
  { key: "in_progress",  label: "In Progress",   actor: "Worker"     },
  { key: "resolved",     label: "Resolved",      actor: "Worker"     },
]

export const STATUS_CHART_COLOR: Record<ComplaintStatus, string> = {
  submitted:    "#94a3b8",
  under_review: "#f59e0b",
  assigned:     "#3b82f6",
  in_progress:  "#6366f1",
  resolved:     "#10b981",
  rejected:     "#ef4444",
  escalated:    "#a855f7",
}

// ── Trend helpers ──────────────────────────────────────────────────────────────

export function dayLabel(date: Date): string {
  return date.toLocaleDateString("en-IN", { weekday: "short", day: "numeric" })
}

export function monthLabel(date: Date): string {
  return date.toLocaleDateString("en-IN", { month: "short", year: "2-digit" })
}

/** Last N days (default 7), newest last */
export function buildDayBuckets(n = 7): Record<string, Omit<TrendPoint, "day" | "month">> {
  const buckets: Record<string, Omit<TrendPoint, "day" | "month">> = {}
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    buckets[dayLabel(d)] = { submitted: 0, resolved: 0, in_progress: 0, assigned: 0 }
  }
  return buckets
}

/** Last 6 months, newest last */
export function buildSixMonthBuckets(): Record<string, Omit<TrendPoint, "day" | "month">> {
  const buckets: Record<string, Omit<TrendPoint, "day" | "month">> = {}
  for (let i = 5; i >= 0; i--) {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    buckets[monthLabel(d)] = { submitted: 0, resolved: 0, in_progress: 0, assigned: 0 }
  }
  return buckets
}

// ── Stats ──────────────────────────────────────────────────────────────────────

export function computeStats(complaints: AuthorityComplaintRow[]): DashboardStats {
  const now        = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime()
  return {
    total:             complaints.length,
    pendingAction:     complaints.filter(c => PENDING_STATUSES.includes(c.status)).length,
    inProgress:        complaints.filter(c => ACTIVE_STATUSES.includes(c.status)).length,
    resolvedThisMonth: complaints.filter(
      c => c.status === "resolved" && new Date(c.created_at).getTime() >= monthStart
    ).length,
    slaBreached: complaints.filter(c => c.sla_breached && c.status !== "resolved").length,
  }
}

export function getUrgentTickets(
  complaints: AuthorityComplaintRow[],
  limit = 8
): AuthorityComplaintRow[] {
  return complaints
    .filter(c =>
      c.status !== "resolved" &&
      c.status !== "rejected" &&
      (ESCALATED_STATUSES.includes(c.status) || URGENT_SEVERITIES.includes(c.effective_severity))
    )
    .sort((a, b) => {
      const diff = SEVERITY_RANK[b.effective_severity] - SEVERITY_RANK[a.effective_severity]
      return diff !== 0 ? diff : new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    })
    .slice(0, limit)
}

export function getStatusBreakdown(
  complaints: AuthorityComplaintRow[]
): { status: ComplaintStatus; label: string; count: number; color: string }[] {
  const map: Partial<Record<ComplaintStatus, number>> = {}
  for (const c of complaints) {
    if (c.status === "rejected") continue
    map[c.status] = (map[c.status] ?? 0) + 1
  }
  return (Object.entries(map) as [ComplaintStatus, number][])
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([status, count]) => ({
      status,
      label: STATUS_META[status].label,
      count,
      color: STATUS_CHART_COLOR[status],
    }))
}

export function timeAgo(dateStr: string): string {
  const diff  = Date.now() - new Date(dateStr).getTime()
  const mins  = Math.floor(diff / 60_000)
  const hours = Math.floor(diff / 3_600_000)
  const days  = Math.floor(diff / 86_400_000)
  if (mins < 1)   return "just now"
  if (mins < 60)  return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${days}d ago`
}
