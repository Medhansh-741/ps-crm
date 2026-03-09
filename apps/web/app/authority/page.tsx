// apps/web/app/authority/page.tsx

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/src/lib/supabase";
import { MapPin } from "lucide-react";
import Link from "next/link";

import AuthorityStatsCards      from "./_components/AuthorityStatsCards";
import AuthorityTrendChart      from "./_components/AuthorityTrendChart";
import AuthorityStatusBreakdown from "./_components/AuthorityStatusBreakdown";
import AuthorityRecentTickets   from "./_components/AuthorityRecentTickets";
import AuthorityUrgentTickets   from "./_components/AuthorityUrgentTickets";

import {
  buildSixMonthBuckets,
  computeStats,
  getUrgentTickets,
  monthLabel,
  type AuthorityComplaintRow,
  type DashboardStats,
  type TrendPoint,
  type WorkerOption,
} from "./_components/dashboard-types";

export default function AuthorityDashboardPage() {
  const [fullName,   setFullName]   = useState("");
  const [department, setDepartment] = useState("");
  const [complaints, setComplaints] = useState<AuthorityComplaintRow[]>([]);
  const [workers,    setWorkers]    = useState<WorkerOption[]>([]);
  const [trend,      setTrend]      = useState<TrendPoint[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState<string | null>(null);

  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  // ── Fetch all data ──────────────────────────────────────────────────────────

  const fetchDashboard = useCallback(async () => {
    setError(null);

    const { data: authData, error: authError } = await supabase.auth.getUser();
    const uid = authData?.user?.id;
    if (authError || !uid) {
      setError("Authentication failed.");
      setLoading(false);
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, full_name, department, role")
      .eq("id", uid)
      .eq("role", "authority")
      .maybeSingle();

    if (profileError || !profile) {
      setError("Access denied. This dashboard is for authority officers only.");
      setLoading(false);
      return;
    }

    setFullName(profile.full_name ?? "Officer");
    setDepartment(profile.department ?? "");

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const [
      { data: allComplaints, error: cErr },
      { data: trendRows,     error: tErr },
      { data: workerRows },
    ] = await Promise.all([
      supabase
        .from("complaints")
        .select(
          "id, ticket_id, title, status, effective_severity, sla_breached, sla_deadline, " +
          "escalation_level, created_at, resolved_at, address_text, " +
          "assigned_worker_id, upvote_count, categories(name)"
        )
        .eq("assigned_officer_id", uid)
        .neq("status", "rejected"),

      supabase
        .from("complaints")
        .select("status, created_at, resolved_at")
        .eq("assigned_officer_id", uid)
        .gte("created_at", sixMonthsAgo.toISOString()),

      supabase
        .from("worker_profiles")
        .select("worker_id, availability, department, profiles(full_name)")
        .eq("department", profile.department ?? ""),
    ]);

    if (cErr || tErr) {
      setError("Failed to load complaint data.");
      setLoading(false);
      return;
    }

    setComplaints((allComplaints ?? []) as unknown as AuthorityComplaintRow[]);

    setWorkers(
      (workerRows ?? []).map((w: any) => ({
        id:           w.worker_id,
        full_name:    w.profiles?.full_name ?? "Unknown",
        availability: w.availability,
        department:   w.department,
      }))
    );

    const buckets = buildSixMonthBuckets();
    (trendRows ?? []).forEach((row: any) => {
      const key = monthLabel(new Date(row.created_at));
      if (buckets[key]) buckets[key].submitted++;
      if (row.status === "resolved" && row.resolved_at) {
        const rKey = monthLabel(new Date(row.resolved_at));
        if (buckets[rKey]) buckets[rKey].resolved++;
      }
    });
    setTrend(Object.entries(buckets).map(([month, v]) => ({ month, ...v })));

    setLoading(false);
  }, []);

  useEffect(() => {
    void fetchDashboard();
    const id = window.setInterval(fetchDashboard, 30_000);
    return () => window.clearInterval(id);
  }, [fetchDashboard]);

  // ── Derived ─────────────────────────────────────────────────────────────────

  const stats: DashboardStats = useMemo(() => computeStats(complaints), [complaints]);
  const urgentTickets          = useMemo(() => getUrgentTickets(complaints), [complaints]);

  // ── Error state ─────────────────────────────────────────────────────────────

  if (!loading && error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
        {error}
      </div>
    );
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="rounded-2xl border border-gray-100 bg-white px-6 py-5 dark:border-gray-800 dark:bg-gray-950">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              {loading ? (
                <span className="inline-block h-6 w-44 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
              ) : (
                `Welcome, ${fullName}`
              )}
            </h1>
            <p className="mt-0.5 text-sm text-gray-400 dark:text-gray-500">
              JanSamadhan · Authority Dashboard
              {department && ` · ${department}`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Quick link to map */}
            <Link
              href="/authority/map"
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-medium text-gray-600 hover:border-[#b4725a] hover:text-[#b4725a] transition-colors dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400"
            >
              <MapPin size={13} />
              Open Map
            </Link>
            <p className="text-right text-sm text-gray-400 dark:text-gray-500">{today}</p>
          </div>
        </div>
      </div>

      {/* ── KPI cards ── */}
      <AuthorityStatsCards stats={stats} loading={loading} error={null} />

      {/* ── Trend + Status breakdown ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <AuthorityTrendChart trend={trend} department={department} loading={loading} />
        </div>
        <div className="lg:col-span-2">
          <AuthorityStatusBreakdown complaints={complaints} loading={loading} />
        </div>
      </div>

      {/* ── Recent tickets + Urgent panel ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <AuthorityRecentTickets
            complaints={complaints}
            workers={workers}
            loading={loading}
            error={null}
            onRefresh={fetchDashboard}
          />
        </div>
        <div className="lg:col-span-2">
          <AuthorityUrgentTickets
            tickets={urgentTickets}
            loading={loading}
            error={null}
          />
        </div>
      </div>

    </div>
  );
}
