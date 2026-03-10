import { formatPriorityLabel, severityToPriority } from "@/components/admin-tickets/formatters"
import type { SeverityLevel } from "@/components/admin-tickets/types"

type PriorityBadgeProps = {
  severity: SeverityLevel
}

const priorityStyles = {
  low: "bg-gray-100 text-gray-700 border-gray-200",
  medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
  high: "bg-orange-100 text-orange-800 border-orange-200",
  emergency: "bg-red-100 text-red-800 border-red-200",
}

export default function PriorityBadge({ severity }: PriorityBadgeProps) {
  const priority = severityToPriority(severity)

  return (
    <span className={`inline-flex rounded-lg border px-2.5 py-1 text-sm font-medium ${priorityStyles[priority]}`}>
      {formatPriorityLabel(priority)}
    </span>
  )
}
