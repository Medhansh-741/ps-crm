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

// Matches complaints table exactly per database.types.ts
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
  month: string
  submitted: number
  resolved: number
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

export const SEVERITY_META: Record<SeverityLevel, { label: string; dot: string; badge: string }> = {
  L1: { label: "L1", dot: "bg-blue-400",   badge: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
  L2: { label: "L2", dot: "bg-yellow-400", badge: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300" },
  L3: { label: "L3 High",     dot: "bg-orange-500", badge: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300" },
  L4: { label: "L4 Critical", dot: "bg-red-500",    badge: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
}

export const STATUS_META: Record<ComplaintStatus, { label: string; badge: string }> = {
  submitted:    { label: "Submitted",    badge: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300" },
  under_review: { label: "Under Review", badge: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300" },
  assigned:     { label: "Assigned",     badge: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
  in_progress:  { label: "In Progress",  badge: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300" },
  resolved:     { label: "Resolved",     badge: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" },
  rejected:     { label: "Rejected",     badge: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400" },
  escalated:    { label: "Escalated",    badge: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300" },
}

export const STATUS_CHART_COLOR: Record<ComplaintStatus, string> = {
  submitted:    "#9ca3af",
  under_review: "#fbbf24",
  assigned:     "#60a5fa",
  in_progress:  "#818cf8",
  resolved:     "#4ade80",
  rejected:     "#f87171",
  escalated:    "#c084fc",
}

export function monthLabel(date: Date): string {
  return date.toLocaleDateString("en-IN", { month: "short", year: "2-digit" })
}

export function buildSixMonthBuckets(): Record<string, { submitted: number; resolved: number }> {
  const buckets: Record<string, { submitted: number; resolved: number }> = {}
  for (let i = 5; i >= 0; i--) {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    buckets[monthLabel(d)] = { submitted: 0, resolved: 0 }
  }
  return buckets
}

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
    slaBreached: complaints.filter(
      c => c.sla_breached && c.status !== "resolved"
    ).length,
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
