import type { ReactNode } from "react"

type AdminStatCardProps = {
  label: string
  value: string
  icon: ReactNode
  accentClass?: string
}

export default function AdminStatCard({ label, value, icon, accentClass = "text-gray-700" }: AdminStatCardProps) {
  return (
    <article className="rounded-2xl border border-gray-200 bg-white px-5 py-4 shadow-sm">
      <div className="mb-3 flex items-center gap-3 text-sm font-medium text-gray-600">
        <span className={`rounded-lg bg-gray-100 p-2 ${accentClass}`}>{icon}</span>
        <span>{label}</span>
      </div>
      <p className="text-3xl font-semibold tracking-tight text-gray-900">{value}</p>
    </article>
  )
}
