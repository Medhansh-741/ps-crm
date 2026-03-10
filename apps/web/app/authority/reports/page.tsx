// apps/web/app/authority/reports/page.tsx
"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { supabase } from "@/src/lib/supabase"
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell,
  Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts"
import {
  AlertTriangle, ArrowDown, ArrowUp, CheckCircle2,
  Clock, Download, FileText, Minus, ShieldAlert, TrendingUp,
} from "lucide-react"

// ── Types ──────────────────────────────────────────────────────────────────────
type Status = "submitted"|"under_review"|"assigned"|"in_progress"|"resolved"|"rejected"|"escalated"
type Sev    = "L1"|"L2"|"L3"|"L4"

type Complaint = {
  id: string; status: Status; effective_severity: Sev
  sla_breached: boolean; created_at: string; resolved_at: string|null
  categories: { name: string }|null; escalation_level: number
}

// ── Constants ──────────────────────────────────────────────────────────────────
const SEV_META: Record<Sev, { label: string; color: string }> = {
  L1: { label:"Low",      color:"#38bdf8" },
  L2: { label:"Medium",   color:"#fbbf24" },
  L3: { label:"High",     color:"#f97316" },
  L4: { label:"Critical", color:"#ef4444" },
}

const STATUS_META: Record<string, { label: string; color: string }> = {
  submitted:    { label:"Submitted",    color:"#94a3b8" },
  under_review: { label:"Under Review", color:"#f59e0b" },
  assigned:     { label:"Assigned",     color:"#3b82f6" },
  in_progress:  { label:"In Progress",  color:"#6366f1" },
  resolved:     { label:"Resolved",     color:"#10b981" },
  escalated:    { label:"Escalated",    color:"#a855f7" },
}

const COMPLAINT_SELECT =
  "id,status,effective_severity,sla_breached,created_at,resolved_at,escalation_level,categories(name)"

// ── Helpers ────────────────────────────────────────────────────────────────────
function monthKey(d: Date) {
  return d.toLocaleString("en-IN", { month: "short", year: "2-digit" })
}
function pct(a: number, b: number) {
  return b === 0 ? 0 : Math.round((a / b) * 100)
}
function avgDays(complaints: Complaint[]): string {
  const done = complaints.filter(c => c.status === "resolved" && c.resolved_at)
  if (!done.length) return "—"
  const avg = done.reduce((s,c) =>
    s + (new Date(c.resolved_at!).getTime() - new Date(c.created_at).getTime()), 0
  ) / done.length
  const d = Math.round(avg / 86_400_000)
  return d === 0 ? "<1 day" : `${d}d avg`
}

// ── Sub-components ─────────────────────────────────────────────────────────────
function Card({ children, className="" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-gray-100 bg-white dark:border-gray-800 dark:bg-gray-900 ${className}`}>
      {children}
    </div>
  )
}
function CardHead({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="border-b border-gray-50 px-5 py-4 dark:border-gray-800">
      <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{title}</p>
      {sub && <p className="mt-0.5 text-[11px] text-gray-400">{sub}</p>}
    </div>
  )
}
function Tip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-gray-100 bg-white px-3 py-2.5 shadow-xl dark:border-gray-700 dark:bg-gray-900">
      <p className="mb-1.5 text-[11px] font-semibold text-gray-500">{label}</p>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center gap-2 text-xs">
          <span className="h-2 w-2 rounded-full shrink-0" style={{ background: p.color ?? p.fill }}/>
          <span className="text-gray-500">{p.name}:</span>
          <span className="font-bold text-gray-900 dark:text-white">{p.value}</span>
        </div>
      ))}
    </div>
  )
}
function Skel() {
  return <div className="h-52 animate-pulse rounded-xl bg-gray-50 dark:bg-gray-800"/>
}
function Delta({ now, prev, invert=false }: { now:number; prev:number; invert?:boolean }) {
  if (!prev) return null
  const d = now - prev
  const p = Math.abs(Math.round((d/prev)*100))
  const good = invert ? d < 0 : d > 0
  if (d === 0) return <span className="flex items-center gap-0.5 text-[10px] text-gray-400"><Minus size={9}/>same</span>
  return (
    <span className={`flex items-center gap-0.5 text-[10px] font-semibold ${good?"text-emerald-600":"text-red-500"}`}>
      {d > 0 ? <ArrowUp size={9}/> : <ArrowDown size={9}/>}{p}% vs prev
    </span>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────────
export default function ReportsPage() {
  const [complaints, setComplaints]     = useState<Complaint[]>([])
  const [prevComplaints, setPrev]       = useState<Complaint[]>([])
  const [loading, setLoading]           = useState(true)
  const [dept, setDept]                 = useState("")
  const [range, setRange]               = useState<"3m"|"6m"|"12m">("6m")

  const load = useCallback(async () => {
    setLoading(true)
    const { data: auth } = await supabase.auth.getUser()
    const uid = auth?.user?.id
    if (!uid) return
    const { data: profile } = await supabase
      .from("profiles").select("department").eq("id", uid).maybeSingle()
    const department = profile?.department ?? ""
    setDept(department)

    const months = range === "3m" ? 3 : range === "6m" ? 6 : 12
    const now    = new Date()
    const curStart  = new Date(now); curStart.setMonth(curStart.getMonth() - months); curStart.setDate(1); curStart.setHours(0,0,0,0)
    const prevStart = new Date(curStart); prevStart.setMonth(prevStart.getMonth() - months)

    async function fetch(from: Date, to: Date) {
      let d: any[] = []
      const { data: d1 } = await supabase.from("complaints").select(COMPLAINT_SELECT)
        .eq("assigned_officer_id", uid!).gte("created_at", from.toISOString()).lt("created_at", to.toISOString())
      d = d1 ?? []
      if (!d.length && department) {
        const { data: d2 } = await supabase.from("complaints").select(COMPLAINT_SELECT)
          .eq("assigned_department", department).gte("created_at", from.toISOString()).lt("created_at", to.toISOString())
        d = d2 ?? []
      }
      return d as Complaint[]
    }

    const [cur, prev] = await Promise.all([fetch(curStart, now), fetch(prevStart, curStart)])
    setComplaints(cur)
    setPrev(prev)
    setLoading(false)
  }, [range])

  useEffect(() => { void load() }, [load])

  // ── Derived ──────────────────────────────────────────────────────────────────
  const total     = complaints.length
  const resolved  = complaints.filter(c => c.status === "resolved").length
  const breached  = complaints.filter(c => c.sla_breached).length
  const escalated = complaints.filter(c => c.escalation_level > 0).length
  const slaRate   = pct(total - breached, total)
  const resRate   = pct(resolved, total)

  const trendData = useMemo(() => {
    const months = range === "3m" ? 3 : range === "6m" ? 6 : 12
    const b: Record<string,{month:string;filed:number;resolved:number;escalated:number}> = {}
    for (let i = months-1; i >= 0; i--) {
      const d = new Date(); d.setMonth(d.getMonth()-i)
      const k = monthKey(d); b[k] = { month:k, filed:0, resolved:0, escalated:0 }
    }
    complaints.forEach(c => {
      const mk = monthKey(new Date(c.created_at))
      if (b[mk]) { b[mk].filed++; if (c.escalation_level > 0) b[mk].escalated++ }
      if (c.status === "resolved" && c.resolved_at) {
        const rk = monthKey(new Date(c.resolved_at))
        if (b[rk]) b[rk].resolved++
      }
    })
    return Object.values(b)
  }, [complaints, range])

  const sevData = useMemo(() =>
    (["L4","L3","L2","L1"] as Sev[]).map(s => ({
      name: SEV_META[s].label, value: complaints.filter(c => c.effective_severity === s).length,
      color: SEV_META[s].color,
    })).filter(d => d.value > 0), [complaints])

  const statusData = useMemo(() =>
    Object.entries(STATUS_META).map(([s,m]) => ({
      name: m.label, value: complaints.filter(c => c.status === s).length, color: m.color,
    })).filter(d => d.value > 0).sort((a,b) => b.value - a.value), [complaints])

  const catData = useMemo(() => {
    const map: Record<string,{filed:number;resolved:number}> = {}
    complaints.forEach(c => {
      const k = c.categories?.name ?? "Uncategorised"
      if (!map[k]) map[k] = { filed:0, resolved:0 }
      map[k].filed++
      if (c.status === "resolved") map[k].resolved++
    })
    return Object.entries(map).sort((a,b) => b[1].filed - a[1].filed).slice(0,8)
      .map(([name,v]) => ({
        name: name.length > 22 ? name.slice(0,20)+"…" : name,
        filed: v.filed, resolved: v.resolved, rate: pct(v.resolved, v.filed),
      }))
  }, [complaints])

  const slaBySev = useMemo(() =>
    (["L4","L3","L2","L1"] as Sev[]).map(s => {
      const g = complaints.filter(c => c.effective_severity === s)
      const br = g.filter(c => c.sla_breached).length
      return { name: SEV_META[s].label, compliant: g.length-br, breached: br, total: g.length,
        rate: pct(g.length-br, g.length), color: SEV_META[s].color }
    }).filter(d => d.total > 0), [complaints])

  const resBuckets = useMemo(() => {
    const b = { "<1d":0, "1–3d":0, "4–7d":0, "8–14d":0, "15d+":0 }
    complaints.filter(c => c.status==="resolved" && c.resolved_at).forEach(c => {
      const days = (new Date(c.resolved_at!).getTime() - new Date(c.created_at).getTime()) / 86_400_000
      if (days < 1) b["<1d"]++
      else if (days <= 3) b["1–3d"]++
      else if (days <= 7) b["4–7d"]++
      else if (days <= 14) b["8–14d"]++
      else b["15d+"]++
    })
    return Object.entries(b).map(([label,value]) => ({ label, value }))
  }, [complaints])

  function exportCSV() {
    const rows = [["ID","Status","Severity","SLA Breached","Created","Resolved","Category"],
      ...complaints.map(c => [c.id, c.status, SEV_META[c.effective_severity]?.label ?? c.effective_severity,
        c.sla_breached?"Yes":"No", new Date(c.created_at).toLocaleDateString("en-IN"),
        c.resolved_at ? new Date(c.resolved_at).toLocaleDateString("en-IN") : "—",
        c.categories?.name ?? "Uncategorised"])]
    const a = document.createElement("a")
    a.href = URL.createObjectURL(new Blob([rows.map(r=>r.join(",")).join("\n")], { type:"text/csv" }))
    a.download = `jansamadhan-${new Date().toISOString().slice(0,10)}.csv`
    a.click()
  }

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5 pb-8">

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Reports & Analytics</h1>
          <p className="mt-0.5 text-sm text-gray-400">
            {dept && <span className="font-medium text-gray-700 dark:text-gray-300">{dept}</span>}
            {dept && " · "}
            {loading ? "Loading…" : `${total} complaints · ${range === "3m" ? "Last 3 months" : range === "6m" ? "Last 6 months" : "Last year"}`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
            {(["3m","6m","12m"] as const).map(r => (
              <button key={r} onClick={() => setRange(r)}
                className={`px-4 py-2 text-sm font-medium transition-colors ${range===r ? "bg-[#4f392e] text-white" : "text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-700"}`}>
                {r === "3m" ? "3 months" : r === "6m" ? "6 months" : "1 year"}
              </button>
            ))}
          </div>
          <button onClick={exportCSV}
            className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
            <Download size={13}/> Export CSV
          </button>
        </div>
      </div>

      {/* KPI Strip — 6 cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {[
          { icon: FileText,      label:"Total Filed",     value: total,            color:"text-gray-900 dark:text-white",   extra: <Delta now={total}   prev={prevComplaints.length}/> },
          { icon: CheckCircle2,  label:"Resolved",        value: resolved,         color:"text-emerald-600",                extra: <Delta now={resolved} prev={prevComplaints.filter(c=>c.status==="resolved").length}/> },
          { icon: TrendingUp,    label:"Resolution Rate", value: `${resRate}%`,    color: resRate>=60?"text-emerald-600":"text-amber-500", extra: <span className="text-[10px] text-gray-400">{resolved} of {total}</span> },
          { icon: Clock,         label:"Avg Resolution",  value: avgDays(complaints), color:"text-blue-600",              extra: <span className="text-[10px] text-gray-400">resolved tickets</span> },
          { icon: ShieldAlert,   label:"SLA Compliance",  value: `${slaRate}%`,    color: slaRate>=80?"text-emerald-600":"text-red-500",   extra: <span className="text-[10px] text-gray-400">{total-breached} on-time</span> },
          { icon: AlertTriangle, label:"SLA Breached",    value: breached,         color: breached>0?"text-red-500":"text-gray-400",       extra: <Delta now={breached} prev={prevComplaints.filter(c=>c.sla_breached).length} invert/> },
        ].map(({ icon: Icon, label, value, color, extra }) => (
          <Card key={label} className="p-4">
            <div className="flex items-start justify-between gap-1">
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 leading-tight">{label}</p>
                {loading
                  ? <div className="mt-1.5 h-7 w-12 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800"/>
                  : <p className={`mt-1 text-2xl font-bold leading-none ${color}`}>{value}</p>}
                {!loading && <div className="mt-1">{extra}</div>}
              </div>
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gray-50 dark:bg-gray-800">
                <Icon size={13} className="text-gray-400"/>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Trend Area Chart */}
      <Card>
        <CardHead title="Complaint Volume Trend" sub="Monthly filed vs resolved — identify backlog and response gaps"/>
        <div className="p-5">
          {loading ? <Skel/> : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={trendData} margin={{ top:4, right:8, bottom:0, left:-20 }}>
                <defs>
                  <linearGradient id="gFiled" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#b4725a" stopOpacity={0.12}/>
                    <stop offset="95%" stopColor="#b4725a" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="gResolved" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#10b981" stopOpacity={0.12}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(156,163,175,0.15)" vertical={false}/>
                <XAxis dataKey="month" tick={{ fontSize:11, fill:"#9ca3af" }} axisLine={false} tickLine={false}/>
                <YAxis allowDecimals={false} tick={{ fontSize:11, fill:"#9ca3af" }} axisLine={false} tickLine={false}/>
                <Tooltip content={<Tip/>}/>
                <Area type="monotone" dataKey="filed"     name="Filed"     stroke="#b4725a" strokeWidth={2} fill="url(#gFiled)"    dot={{ r:3, fill:"#b4725a" }}/>
                <Area type="monotone" dataKey="resolved"  name="Resolved"  stroke="#10b981" strokeWidth={2} fill="url(#gResolved)" dot={{ r:3, fill:"#10b981" }}/>
                <Area type="monotone" dataKey="escalated" name="Escalated" stroke="#a855f7" strokeWidth={1.5} strokeDasharray="4 2" fill="none" dot={{ r:2, fill:"#a855f7" }}/>
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </Card>

      {/* Row 2: Severity + Status */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">

        {/* Severity Distribution — stacked bar + rows */}
        <Card>
          <CardHead title="Severity Distribution" sub="Urgency profile of your complaint workload"/>
          <div className="p-5">
            {loading ? <Skel/> : sevData.length === 0 ? (
              <div className="flex h-48 items-center justify-center text-sm text-gray-400">No data</div>
            ) : (
              <div className="space-y-4">
                {/* Proportional stacked bar */}
                <div className="flex h-5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                  {(["L4","L3","L2","L1"] as Sev[]).map(s => {
                    const cnt = complaints.filter(c => c.effective_severity === s).length
                    const p   = pct(cnt, total)
                    if (!p) return null
                    return <div key={s} style={{ width:`${p}%`, background: SEV_META[s].color }}
                      className="transition-all duration-500" title={`${SEV_META[s].label}: ${cnt}`}/>
                  })}
                </div>

                {/* Row per level */}
                <div className="space-y-3">
                  {(["L4","L3","L2","L1"] as Sev[]).map(s => {
                    const cnt = complaints.filter(c => c.effective_severity === s).length
                    const p   = pct(cnt, total)
                    if (!cnt) return null
                    return (
                      <div key={s}>
                        <div className="mb-1 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: SEV_META[s].color }}/>
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{SEV_META[s].label}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-bold text-gray-900 dark:text-white">{cnt}</span>
                            <span className="w-8 text-right text-[11px] text-gray-400">{p}%</span>
                          </div>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                          <div className="h-full rounded-full transition-all duration-700"
                            style={{ width:`${p}%`, background: SEV_META[s].color }}/>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Call-out */}
                {(() => {
                  const n = complaints.filter(c => c.effective_severity==="L4"||c.effective_severity==="L3").length
                  if (!n) return null
                  return (
                    <div className="flex items-start gap-2 rounded-xl bg-orange-50 px-3 py-2.5 dark:bg-orange-900/20">
                      <AlertTriangle size={12} className="mt-0.5 shrink-0 text-orange-500"/>
                      <p className="text-[11px] leading-snug text-orange-700 dark:text-orange-400">
                        <span className="font-semibold">{pct(n,total)}% ({n} complaints)</span> are High or Critical — prioritise these.
                      </p>
                    </div>
                  )
                })()}
              </div>
            )}
          </div>
        </Card>

        {/* Status Breakdown */}
        <Card>
          <CardHead title="Status Breakdown" sub="Pipeline view — where complaints are right now"/>
          <div className="p-5">
            {loading ? <Skel/> : statusData.length === 0 ? (
              <div className="flex h-48 items-center justify-center text-sm text-gray-400">No data</div>
            ) : (
              <div className="flex items-center gap-5">
                <div className="shrink-0">
                  <ResponsiveContainer width={140} height={140}>
                    <PieChart>
                      <Pie data={statusData} cx="50%" cy="50%" innerRadius={40} outerRadius={65}
                        dataKey="value" paddingAngle={2} startAngle={90} endAngle={450}>
                        {statusData.map((d,i) => <Cell key={i} fill={d.color}/>)}
                      </Pie>
                      <Tooltip content={<Tip/>}/>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 space-y-2 min-w-0">
                  {statusData.map(d => (
                    <div key={d.name} className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: d.color }}/>
                        <span className="truncate text-xs text-gray-600 dark:text-gray-400">{d.name}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs font-bold text-gray-900 dark:text-white">{d.value}</span>
                        <span className="w-7 text-right text-[10px] text-gray-400">{pct(d.value,total)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Row 3: SLA by Severity + Resolution Time */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">

        {/* SLA by Severity */}
        <Card>
          <CardHead title="SLA Compliance by Severity" sub="Which urgency levels are missing deadlines"/>
          <div className="p-5">
            {loading ? <Skel/> : slaBySev.length === 0 ? (
              <div className="flex h-48 items-center justify-center text-sm text-gray-400">No data</div>
            ) : (
              <div className="space-y-4">
                {slaBySev.map(s => (
                  <div key={s.name}>
                    <div className="mb-1.5 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: s.color }}/>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{s.name}</span>
                        <span className="text-[10px] text-gray-400">({s.total})</span>
                      </div>
                      <span className={`text-sm font-bold ${s.rate>=80?"text-emerald-600":s.rate>=50?"text-amber-500":"text-red-500"}`}>
                        {s.rate}%
                      </span>
                    </div>
                    <div className="flex h-3 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                      <div className="h-full bg-emerald-400 transition-all duration-700"
                        style={{ width:`${pct(s.compliant,s.total)}%` }}/>
                      {s.breached > 0 && (
                        <div className="h-full bg-red-400 transition-all duration-700"
                          style={{ width:`${pct(s.breached,s.total)}%` }}/>
                      )}
                    </div>
                    <div className="mt-1 flex gap-3 text-[10px]">
                      <span className="text-emerald-600">✓ {s.compliant} on-time</span>
                      {s.breached > 0 && <span className="text-red-500">✗ {s.breached} breached</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* Resolution Time Buckets */}
        <Card>
          <CardHead title="Resolution Time Distribution" sub="How quickly your department is closing complaints"/>
          <div className="p-5">
            {loading ? <Skel/> : resolved === 0 ? (
              <div className="flex h-48 items-center justify-center text-sm text-gray-400">No resolved complaints yet</div>
            ) : (
              <div className="space-y-3">
                {resBuckets.map(b => {
                  const p    = pct(b.value, resolved)
                  const fast = b.label === "<1d" || b.label === "1–3d"
                  const slow = b.label === "15d+"
                  return (
                    <div key={b.label}>
                      <div className="mb-1 flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{b.label}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-gray-900 dark:text-white">{b.value}</span>
                          <span className="w-7 text-right text-[11px] text-gray-400">{p}%</span>
                        </div>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                        <div className={`h-full rounded-full transition-all duration-700 ${fast ? "bg-emerald-400" : slow ? "bg-red-400" : "bg-amber-400"}`}
                          style={{ width:`${p}%` }}/>
                      </div>
                    </div>
                  )
                })}
                <div className="mt-2 rounded-xl bg-gray-50 px-3 py-2 dark:bg-gray-800">
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">
                    Average: <span className="font-semibold text-gray-700 dark:text-gray-300">{avgDays(complaints)}</span>
                    {" "} · {resolved} complaint{resolved !== 1 ? "s" : ""} resolved
                  </p>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Category Table-Bar */}
      <Card>
        <CardHead title="Complaints by Category" sub="Volume and resolution rate per category — sorted by total filed"/>
        <div className="p-5">
          {loading ? <Skel/> : catData.length === 0 ? (
            <div className="flex h-40 items-center justify-center text-sm text-gray-400">No data</div>
          ) : (
            <div className="space-y-2.5">
              {catData.map((c, i) => (
                <div key={c.name} className="flex items-center gap-3">
                  <span className="w-32 shrink-0 truncate text-right text-xs text-gray-500 dark:text-gray-400">{c.name}</span>
                  <div className="relative flex-1 h-5">
                    <div className="absolute inset-0 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                      <div className="h-full rounded-full bg-[#b4725a]/25 transition-all duration-700"
                        style={{ width:`${pct(c.filed, catData[0].filed)}%` }}/>
                    </div>
                    <div className="absolute inset-0 overflow-hidden rounded-full">
                      <div className="h-full rounded-full bg-emerald-400/50 transition-all duration-700"
                        style={{ width:`${pct(c.resolved, catData[0].filed)}%` }}/>
                    </div>
                  </div>
                  <span className="w-7 shrink-0 text-center text-xs font-bold text-gray-800 dark:text-gray-200">{c.filed}</span>
                  <span className={`w-9 shrink-0 text-right text-[11px] font-semibold ${c.rate>=60?"text-emerald-600":c.rate>=30?"text-amber-500":"text-red-500"}`}>
                    {c.rate}%
                  </span>
                </div>
              ))}
              <div className="flex items-center gap-3 pt-1 border-t border-gray-50 dark:border-gray-800">
                <span className="w-32 shrink-0"/>
                <div className="flex gap-4 text-[10px] text-gray-400">
                  <span className="flex items-center gap-1"><span className="h-2 w-4 rounded bg-[#b4725a]/25 inline-block"/> Filed</span>
                  <span className="flex items-center gap-1"><span className="h-2 w-4 rounded bg-emerald-400/50 inline-block"/> Resolved</span>
                </div>
                <span className="ml-auto text-[10px] text-gray-400">Total · Resolve%</span>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Insight Summary Banner */}
      {!loading && total > 0 && (
        <Card className="border-[#b4725a]/15 bg-gradient-to-br from-[#fdf8f6] to-white dark:from-[#2a1f1a]/60 dark:to-gray-900">
          <div className="p-5">
            <p className="mb-3 text-sm font-semibold text-[#4f392e] dark:text-[#b4725a]">Period Insights</p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 text-xs">
              {resRate < 30 && (
                <div className="flex gap-2 rounded-xl bg-red-50 p-3 dark:bg-red-900/20">
                  <AlertTriangle size={13} className="mt-0.5 shrink-0 text-red-500"/>
                  <span className="text-red-700 dark:text-red-400 leading-snug">
                    <strong>Low resolution ({resRate}%)</strong> — {total - resolved} complaints are still open.
                  </span>
                </div>
              )}
              {slaRate < 80 && (
                <div className="flex gap-2 rounded-xl bg-amber-50 p-3 dark:bg-amber-900/20">
                  <Clock size={13} className="mt-0.5 shrink-0 text-amber-500"/>
                  <span className="text-amber-700 dark:text-amber-400 leading-snug">
                    <strong>SLA at risk ({slaRate}%)</strong> — {breached} ticket{breached!==1?"s":""} missed deadline.
                  </span>
                </div>
              )}
              {escalated > 0 && (
                <div className="flex gap-2 rounded-xl bg-purple-50 p-3 dark:bg-purple-900/20">
                  <TrendingUp size={13} className="mt-0.5 shrink-0 text-purple-500"/>
                  <span className="text-purple-700 dark:text-purple-400 leading-snug">
                    <strong>{escalated} escalated complaint{escalated!==1?"s":""}</strong> — requires senior-level review.
                  </span>
                </div>
              )}
              {resRate >= 70 && (
                <div className="flex gap-2 rounded-xl bg-emerald-50 p-3 dark:bg-emerald-900/20">
                  <CheckCircle2 size={13} className="mt-0.5 shrink-0 text-emerald-500"/>
                  <span className="text-emerald-700 dark:text-emerald-400 leading-snug">
                    <strong>Strong performance ({resRate}%)</strong> — {resolved} of {total} complaints resolved.
                  </span>
                </div>
              )}
              {catData[0] && (
                <div className="flex gap-2 rounded-xl bg-blue-50 p-3 dark:bg-blue-900/20">
                  <FileText size={13} className="mt-0.5 shrink-0 text-blue-500"/>
                  <span className="text-blue-700 dark:text-blue-400 leading-snug">
                    Top category: <strong>{catData[0].name}</strong> — {catData[0].filed} complaints, {catData[0].rate}% resolved.
                  </span>
                </div>
              )}
            </div>
          </div>
        </Card>
      )}

    </div>
  )
}
