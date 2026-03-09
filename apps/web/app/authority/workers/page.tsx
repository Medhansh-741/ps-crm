// apps/web/app/authority/workers/page.tsx

"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/src/lib/supabase";
import { Users } from "lucide-react";

type Worker = {
  worker_id: string;
  full_name: string;
  availability: "available" | "busy" | "inactive";
  department: string;
  total_resolved: number;
  current_complaint_id: string | null;
};

const AVAIL_BADGE: Record<string, string> = {
  available: "bg-green-100 text-green-700",
  busy:      "bg-yellow-100 text-yellow-700",
  inactive:  "bg-gray-100 text-gray-500",
};

const AVAIL_DOT: Record<string, string> = {
  available: "bg-green-500",
  busy:      "bg-yellow-500",
  inactive:  "bg-gray-400",
};

function SkeletonRow() {
  return (
    <tr className="animate-pulse border-b border-gray-50">
      {[40, 140, 80, 80, 60, 60].map((w, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-3 rounded bg-gray-100" style={{ width: w }} />
        </td>
      ))}
    </tr>
  );
}

export default function AuthorityWorkersPage() {
  const [workers,  setWorkers]  = useState<Worker[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState<"all" | "available" | "busy" | "inactive">("all");

  useEffect(() => {
    async function load() {
      const { data: authData } = await supabase.auth.getUser();
      const uid = authData?.user?.id;
      if (!uid) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("department")
        .eq("id", uid)
        .maybeSingle();

      const { data } = await supabase
        .from("worker_profiles")
        .select(
          "worker_id, availability, department, total_resolved, current_complaint_id, " +
          "profiles(full_name)"
        )
        .eq("department", profile?.department ?? "")
        .order("availability");

      setWorkers(
        (data ?? []).map((w: any) => ({
          worker_id:            w.worker_id,
          full_name:            w.profiles?.full_name ?? "Unknown",
          availability:         w.availability,
          department:           w.department,
          total_resolved:       w.total_resolved ?? 0,
          current_complaint_id: w.current_complaint_id,
        }))
      );
      setLoading(false);
    }
    void load();
  }, []);

  const filtered = filter === "all"
    ? workers
    : workers.filter(w => w.availability === filter);

  const counts = {
    available: workers.filter(w => w.availability === "available").length,
    busy:      workers.filter(w => w.availability === "busy").length,
    inactive:  workers.filter(w => w.availability === "inactive").length,
  };

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="rounded-2xl border border-gray-100 bg-white px-6 py-5 dark:border-gray-800 dark:bg-gray-950">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">Workers</h1>
            <p className="mt-0.5 text-sm text-gray-400">
              {loading ? "Loading…" : `${workers.length} workers in your department`}
            </p>
          </div>

          {/* Availability filter pills */}
          <div className="flex items-center gap-2">
            {(["all", "available", "busy", "inactive"] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                  filter === f
                    ? "bg-[#4f392e] text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400"
                }`}
              >
                {f !== "all" && (
                  <span className={`h-1.5 w-1.5 rounded-full ${AVAIL_DOT[f]}`} />
                )}
                {f === "all" ? `All (${workers.length})` : `${f} (${counts[f]})`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-gray-100 bg-white dark:border-gray-800 dark:bg-gray-950">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-50 dark:border-gray-800">
                {["#", "Name", "Availability", "Department", "Resolved Total", "Active Job"].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-gray-400 whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-sm text-gray-400">
                    No workers found
                  </td>
                </tr>
              ) : (
                filtered.map((w, i) => (
                  <tr
                    key={w.worker_id}
                    className="border-b border-gray-50 dark:border-gray-800/60 hover:bg-gray-50/60 dark:hover:bg-gray-900/40 transition-colors"
                  >
                    <td className="px-4 py-3 text-xs text-gray-400">{i + 1}</td>

                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#b4725a]/20 text-sm font-bold text-[#b4725a]">
                          {w.full_name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-gray-800 dark:text-gray-200">
                          {w.full_name}
                        </span>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold capitalize ${AVAIL_BADGE[w.availability]}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${AVAIL_DOT[w.availability]}`} />
                        {w.availability}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {w.department}
                    </td>

                    <td className="px-4 py-3 text-sm font-semibold text-gray-800 dark:text-gray-200">
                      {w.total_resolved}
                    </td>

                    <td className="px-4 py-3">
                      {w.current_complaint_id ? (
                        <span className="font-mono text-xs text-indigo-600">
                          {w.current_complaint_id.slice(0, 8)}…
                        </span>
                      ) : (
                        <span className="text-xs text-gray-300">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
