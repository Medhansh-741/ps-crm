// apps/web/app/authority/_components/AuthorityTrendChart.tsx

"use client"

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import type { TrendPoint } from "./dashboard-types"

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-gray-100 bg-white px-3 py-2 shadow-lg dark:border-gray-700 dark:bg-gray-900">
      <p className="mb-1 text-xs font-semibold text-gray-500 dark:text-gray-400">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} className="text-xs font-medium" style={{ color: p.color }}>
          {p.name}: <span className="font-bold">{p.value}</span>
        </p>
      ))}
    </div>
  )
}

function ChartSkeleton() {
  return (
    <div className="flex h-[220px] items-end gap-3 px-2 animate-pulse">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
          <div className="w-full rounded-t bg-gray-100 dark:bg-gray-800" style={{ height: `${40 + i * 22}px` }} />
          <div className="h-2 w-8 rounded bg-gray-100 dark:bg-gray-800" />
        </div>
      ))}
    </div>
  )
}

type Props = { trend: TrendPoint[]; department: string; loading: boolean }

export default function AuthorityTrendChart({ trend, department, loading }: Props) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 dark:border-gray-800 dark:bg-gray-950">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
          Complaint Trend — Last 6 Months
        </h2>
        <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-500 dark:bg-gray-800 dark:text-gray-400">
          {department || "All Dept."}
        </span>
      </div>

      {loading ? (
        <ChartSkeleton />
      ) : trend.length === 0 ? (
        <div className="flex h-[220px] items-center justify-center text-sm text-gray-400">
          No data yet
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={trend} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(156,163,175,0.2)" vertical={false} />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 11, fill: "#9ca3af" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fontSize: 11, fill: "#9ca3af" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<ChartTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: 11, paddingTop: 12 }}
              iconType="circle"
              iconSize={8}
            />
            <Line
              type="monotone"
              dataKey="submitted"
              name="Submitted"
              stroke="#b4725a"
              strokeWidth={2}
              dot={{ r: 3, fill: "#b4725a" }}
              activeDot={{ r: 5 }}
            />
            <Line
              type="monotone"
              dataKey="resolved"
              name="Resolved"
              stroke="#22c55e"
              strokeWidth={2}
              dot={{ r: 3, fill: "#22c55e" }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
