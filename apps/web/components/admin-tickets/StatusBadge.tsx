import type { ComplaintStatus } from "@/components/admin-tickets/types"
import { formatStatusLabel } from "@/components/admin-tickets/formatters"

type StatusBadgeProps = {
  status: ComplaintStatus
}

const statusStyles: Record<ComplaintStatus, string> = {
  submitted: "bg-amber-100 text-amber-800 border-amber-200",
  under_review: "bg-amber-100 text-amber-800 border-amber-200",
  assigned: "bg-amber-100 text-amber-800 border-amber-200",
  in_progress: "bg-blue-100 text-blue-800 border-blue-200",
  resolved: "bg-green-100 text-green-800 border-green-200",
  rejected: "bg-zinc-200 text-zinc-700 border-zinc-300",
  escalated: "bg-red-100 text-red-800 border-red-200",
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span className={`inline-flex rounded-lg border px-2.5 py-1 text-sm font-medium ${statusStyles[status]}`}>
      {formatStatusLabel(status)}
    </span>
  )
}
