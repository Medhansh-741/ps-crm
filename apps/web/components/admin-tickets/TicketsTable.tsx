import TicketRow from "@/components/admin-tickets/TicketRow"
import type { TicketRecord } from "@/components/admin-tickets/types"

type TicketsTableProps = {
  tickets: TicketRecord[]
  actionLoading?: boolean
  onView: (ticket: TicketRecord) => void
  onAssign: (ticket: TicketRecord) => void
  onEscalate: (ticket: TicketRecord) => void
}

const headers = [
  "ID",
  "Title",
  "Category",
  "Location",
  "Status",
  "Priority",
  "Created",
  "Authority",
  "Worker",
  "Actions",
]

export default function TicketsTable({
  tickets,
  actionLoading = false,
  onView,
  onAssign,
  onEscalate,
}: TicketsTableProps) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-[#d4cdc2] bg-white shadow-sm">
      <table className="min-w-[1080px] w-full border-collapse">
        <thead>
          <tr className="bg-[#ece5db] text-left">
            {headers.map((header) => (
              <th key={header} className="border-b border-r border-[#d9d1c5] px-3 py-3 text-lg font-semibold text-[#2d2824] last:border-r-0">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {tickets.length === 0 ? (
            <tr>
              <td colSpan={10} className="px-4 py-8 text-center text-sm text-[#5b544d]">
                No tickets matched your current filters.
              </td>
            </tr>
          ) : (
            tickets.map((ticket) => (
              <TicketRow
                key={ticket.id}
                ticket={ticket}
                actionLoading={actionLoading}
                onView={onView}
                onAssign={onAssign}
                onEscalate={onEscalate}
              />
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
