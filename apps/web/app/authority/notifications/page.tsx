// apps/web/app/authority/notifications/page.tsx
"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { supabase } from "@/src/lib/supabase"
import { AlertTriangle, Bell, CheckCircle2, Clock, RefreshCw, XCircle } from "lucide-react"

type NotifKind = "sla_breach" | "escalation" | "new_complaint" | "resolved" | "status_change"

type Notif = {
  id:         string
  kind:       NotifKind
  title:      string
  body:       string
  created_at: string
}

const KIND_CONFIG: Record<NotifKind, { icon: React.ReactNode; pill: string; label: string }> = {
  sla_breach:    { icon:<XCircle       size={16} className="text-red-500"     />, pill:"bg-red-50 text-red-700 ring-1 ring-red-200",             label:"SLA Breach"     },
  escalation:    { icon:<AlertTriangle size={16} className="text-orange-500"  />, pill:"bg-orange-50 text-orange-700 ring-1 ring-orange-200",     label:"Escalated"      },
  new_complaint: { icon:<Bell          size={16} className="text-blue-500"    />, pill:"bg-blue-50 text-blue-700 ring-1 ring-blue-200",           label:"New"            },
  resolved:      { icon:<CheckCircle2  size={16} className="text-emerald-500" />, pill:"bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",  label:"Resolved"       },
  status_change: { icon:<Clock         size={16} className="text-amber-500"   />, pill:"bg-amber-50 text-amber-700 ring-1 ring-amber-200",        label:"Updated"        },
}

function timeAgo(d: string) {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000)
  if (s < 60)    return `${s}s ago`
  if (s < 3600)  return `${Math.floor(s/60)}m ago`
  if (s < 86400) return `${Math.floor(s/3600)}h ago`
  return new Date(d).toLocaleDateString("en-IN", { day:"numeric", month:"short" })
}

const LS_KEY = "jansamadhan_notif_read_v2"
function loadReadSet(): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem(LS_KEY) ?? "[]") as string[]) }
  catch { return new Set() }
}
function saveReadSet(s: Set<string>) {
  try { localStorage.setItem(LS_KEY, JSON.stringify([...s])) } catch {}
}

export default function NotificationsPage() {
  const [notifs,     setNotifs]     = useState<Notif[]>([])
  const [readSet,    setReadSet]    = useState<Set<string>>(new Set())
  const [loading,    setLoading]    = useState(true)
  const [kindFilter, setKindFilter] = useState<"all"|NotifKind>("all")
  const [showUnread, setShowUnread] = useState(false)

  async function buildFeed() {
    setLoading(true)
    const { data: auth } = await supabase.auth.getUser()
    const uid = auth?.user?.id
    if (!uid) { setLoading(false); return }

    const { data: profile } = await supabase
      .from("profiles").select("department").eq("id", uid).maybeSingle()
    const department = profile?.department ?? ""

    // Fetch complaints: try assigned_officer_id, fallback to assigned_department
    let complaints: any[] = []
    const { data: d1 } = await supabase
      .from("complaints")
      .select("id,ticket_id,title,status,sla_breached,escalation_level,created_at,resolved_at")
      .eq("assigned_officer_id", uid)
      .order("created_at", { ascending: false })
      .limit(300)
    complaints = d1 ?? []

    if (complaints.length === 0 && department) {
      const { data: d2 } = await supabase
        .from("complaints")
        .select("id,ticket_id,title,status,sla_breached,escalation_level,created_at,resolved_at")
        .eq("assigned_department", department)   // ← fixed
        .order("created_at", { ascending: false })
        .limit(300)
      complaints = d2 ?? []
    }

    // Ticket history — uses created_at (not changed_at)
    const complaintIds = complaints.map((c: any) => c.id)
    let history: any[] = []
    if (complaintIds.length > 0) {
      const { data } = await supabase
        .from("ticket_history")
        .select("id,complaint_id,old_status,new_status,created_at")  // ← fixed: created_at not changed_at
        .in("complaint_id", complaintIds)
        .order("created_at", { ascending: false })
        .limit(500)
      history = data ?? []
    }

    const events: Notif[] = []
    const cutoff30 = Date.now() - 30 * 24 * 60 * 60 * 1000

    complaints.forEach((c: any) => {
      if (new Date(c.created_at).getTime() > cutoff30) {
        events.push({
          id:`new-${c.id}`, kind:"new_complaint",
          title:`New complaint filed: ${c.title}`,
          body:`Ticket ${c.ticket_id} was filed and assigned to your department.`,
          created_at: c.created_at,
        })
      }
      if (c.sla_breached) {
        events.push({
          id:`sla-${c.id}`, kind:"sla_breach",
          title:`SLA breached: ${c.title}`,
          body:`Ticket ${c.ticket_id} has exceeded its SLA deadline — immediate action required.`,
          created_at: c.created_at,
        })
      }
      if (c.escalation_level && c.escalation_level > 0) {
        events.push({
          id:`esc-${c.id}`, kind:"escalation",
          title:`Escalated: ${c.title}`,
          body:`Ticket ${c.ticket_id} has been escalated (level ${c.escalation_level}).`,
          created_at: c.created_at,
        })
      }
      if (c.status === "resolved" && c.resolved_at) {
        events.push({
          id:`res-${c.id}`, kind:"resolved",
          title:`Resolved: ${c.title}`,
          body:`Ticket ${c.ticket_id} was successfully resolved.`,
          created_at: c.resolved_at,
        })
      }
    })

    history.forEach((h: any) => {
      const complaint = complaints.find((c: any) => c.id === h.complaint_id)
      if (!complaint) return
      if (h.new_status === "resolved") return
      events.push({
        id:`hist-${h.id}`, kind:"status_change",
        title:`Status updated: ${complaint.title}`,
        body:`Ticket ${complaint.ticket_id}: "${(h.old_status??'').replace(/_/g,' ')}" → "${(h.new_status??'').replace(/_/g,' ')}"`,
        created_at: h.created_at,   // ← fixed
      })
    })

    const seen = new Set<string>()
    const deduped = events
      .filter(e => { if (seen.has(e.id)) return false; seen.add(e.id); return true })
      .sort((a,b) => +new Date(b.created_at) - +new Date(a.created_at))
      .slice(0, 100)

    setReadSet(loadReadSet())
    setNotifs(deduped)
    setLoading(false)
  }

  useEffect(() => { void buildFeed() }, [])

  useEffect(() => {
    const ch = supabase.channel("notif-realtime")
      .on("postgres_changes", { event:"*", schema:"public", table:"complaints"     }, () => void buildFeed())
      .on("postgres_changes", { event:"*", schema:"public", table:"ticket_history" }, () => void buildFeed())
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [])

  function markRead(id: string) {
    setReadSet(prev => {
      const next = new Set(prev); next.add(id); saveReadSet(next); return next
    })
  }
  function markAllRead() {
    setReadSet(prev => {
      const next = new Set([...prev, ...notifs.map(n => n.id)]); saveReadSet(next); return next
    })
  }

  const displayed = useMemo(() =>
    notifs
      .filter(n => kindFilter === "all" || n.kind === kindFilter)
      .filter(n => !showUnread || !readSet.has(n.id)),
    [notifs, kindFilter, showUnread, readSet]
  )

  const unreadCount = notifs.filter(n => !readSet.has(n.id)).length

  const groups = useMemo(() => {
    const map: Record<string, Notif[]> = {}
    displayed.forEach(n => {
      const d     = new Date(n.created_at)
      const today = new Date(); today.setHours(0,0,0,0)
      const yest  = new Date(today); yest.setDate(yest.getDate()-1)
      const label = d >= today ? "Today" : d >= yest ? "Yesterday"
        : d.toLocaleDateString("en-IN", { day:"numeric", month:"long", year:"numeric" })
      if (!map[label]) map[label] = []
      map[label].push(n)
    })
    return map
  }, [displayed])

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Notifications</h1>
          <p className="text-sm text-gray-400">
            Live activity feed · {unreadCount > 0 ? `${unreadCount} unread` : "all caught up"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => void buildFeed()}
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-600 shadow-sm hover:bg-gray-50 transition-colors dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
            <RefreshCw size={13}/> Refresh
          </button>
          {unreadCount > 0 && (
            <button onClick={markAllRead}
              className="rounded-lg bg-[#b4725a] px-4 py-2 text-sm font-semibold text-white hover:bg-[#9a5e48] transition-colors">
              Mark all read
            </button>
          )}
        </div>
      </div>

      {/* KPI pills */}
      {!loading && (
        <div className="flex flex-wrap gap-3">
          {([
            ["sla_breach",    "SLA Breaches",   "bg-red-50 text-red-700 ring-1 ring-red-200"        ],
            ["escalation",    "Escalations",    "bg-orange-50 text-orange-700 ring-1 ring-orange-200"],
            ["resolved",      "Resolved",       "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"],
            ["status_change", "Status Updates", "bg-amber-50 text-amber-700 ring-1 ring-amber-200"   ],
          ] as [NotifKind, string, string][]).map(([kind, label, color]) => (
            <button key={kind} onClick={() => setKindFilter(prev => prev===kind ? "all" : kind)}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-all ${color}
                          ${kindFilter===kind ? "ring-2 ring-offset-1" : ""}`}>
              {notifs.filter(n=>n.kind===kind).length} {label}
            </button>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="flex overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <button onClick={() => setShowUnread(false)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${!showUnread?"bg-[#b4725a] text-white":"text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-700"}`}>
            All
          </button>
          <button onClick={() => setShowUnread(true)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${showUnread?"bg-[#b4725a] text-white":"text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-700"}`}>
            Unread {unreadCount > 0 && `(${unreadCount})`}
          </button>
        </div>
        <select value={kindFilter} onChange={e => setKindFilter(e.target.value as typeof kindFilter)}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#b4725a] dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
          <option value="all">All types</option>
          {(Object.entries(KIND_CONFIG) as [NotifKind, typeof KIND_CONFIG[NotifKind]][]).map(([k,v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
      </div>

      {/* Feed */}
      {loading ? (
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white dark:border-gray-800 dark:bg-gray-900">
          {[...Array(6)].map((_,i) => (
            <div key={i} className="flex animate-pulse gap-4 border-b border-gray-50 p-4 last:border-0 dark:border-gray-800">
              <div className="h-9 w-9 shrink-0 rounded-full bg-gray-100 dark:bg-gray-800"/>
              <div className="flex-1 space-y-2 py-1">
                <div className="h-3 w-1/2 rounded-md bg-gray-100 dark:bg-gray-800"/>
                <div className="h-2.5 w-3/4 rounded-md bg-gray-100 dark:bg-gray-800"/>
              </div>
            </div>
          ))}
        </div>
      ) : displayed.length === 0 ? (
        <div className="flex h-44 items-center justify-center rounded-2xl border border-dashed border-gray-200 text-sm text-gray-400 dark:border-gray-700">
          {notifs.length === 0 ? "No activity yet for your department." : "No notifications to show"}
        </div>
      ) : (
        <div className="space-y-5">
          {Object.entries(groups).map(([dateLabel, items]) => (
            <div key={dateLabel}>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">{dateLabel}</p>
              <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white dark:border-gray-800 dark:bg-gray-900">
                {items.map((n, idx) => {
                  const cfg    = KIND_CONFIG[n.kind]
                  const isRead = readSet.has(n.id)
                  const bgHL   = n.kind==="sla_breach" ? "bg-red-50/40 dark:bg-red-900/10"
                               : n.kind==="escalation" ? "bg-orange-50/40 dark:bg-orange-900/10"
                               : "bg-[#fdf8f6] dark:bg-[#2a1f1a]/20"
                  return (
                    <div key={n.id} onClick={() => { if (!isRead) markRead(n.id) }}
                      className={`flex cursor-pointer gap-4 p-4 transition-colors hover:bg-gray-50/60 dark:hover:bg-gray-800/50
                                  ${idx > 0 ? "border-t border-gray-50 dark:border-gray-800" : ""}
                                  ${!isRead ? bgHL : ""}`}>
                      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${cfg.pill.split(" ")[0]}`}>
                        {cfg.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="mb-0.5 flex flex-wrap items-center gap-2">
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${cfg.pill}`}>{cfg.label}</span>
                          {!isRead && <span className="h-2 w-2 rounded-full bg-[#b4725a]"/>}
                        </div>
                        <p className={`text-sm leading-snug ${isRead?"font-medium text-gray-700 dark:text-gray-300":"font-semibold text-gray-900 dark:text-white"}`}>
                          {n.title}
                        </p>
                        <p className="mt-0.5 line-clamp-1 text-xs text-gray-400">{n.body}</p>
                      </div>
                      <span className="shrink-0 pt-0.5 text-[10px] tabular-nums text-gray-400">{timeAgo(n.created_at)}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
