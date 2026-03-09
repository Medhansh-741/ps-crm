"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/src/lib/supabase";
import type { Tables } from "@/src/types/database.types";
import { calculateDistanceMeters, type GeoPoint } from "./distance";

// ─── Types ────────────────────────────────────────────────────────────────────

export type SeverityLevel = "L1" | "L2" | "L3" | "L4";

export type MappedComplaint = {
  id: string;
  ticket_id: string | null;
  title: string;
  description: string;
  severity: SeverityLevel;
  effective_severity: SeverityLevel;
  lat: number;
  lng: number;
  photo_urls: string[] | null;
  upvote_count: number;
  status: string;
  created_at: string;
  address_text: string | null;
  ward_name: string | null;
  category_id: number;
  assigned_department: string | null;
};

export const SEVERITY_CONFIG: Record<SeverityLevel, { label: string; color: string; level: number }> = {
  L1: { label: "Low",      color: "#22c55e", level: 1 },
  L2: { label: "Medium",   color: "#eab308", level: 2 },
  L3: { label: "Urgent",   color: "#f97316", level: 3 },
  L4: { label: "Critical", color: "#ef4444", level: 4 },
};

export function getSeverityConfig(sev: string) {
  return SEVERITY_CONFIG[sev as SeverityLevel] ?? SEVERITY_CONFIG.L1;
}

// ─── Location Parser ──────────────────────────────────────────────────────────

function parseEwkbHexPoint(hex: string): { lat: number; lng: number } | null {
  const normalized = hex.trim();
  if (!/^[0-9a-fA-F]+$/.test(normalized) || normalized.length < 42) return null;
  try {
    const bytes = new Uint8Array(normalized.length / 2);
    for (let i = 0; i < normalized.length; i += 2)
      bytes[i / 2] = parseInt(normalized.slice(i, i + 2), 16);
    const view = new DataView(bytes.buffer);
    const littleEndian = view.getUint8(0) === 1;
    const typeWithFlags = view.getUint32(1, littleEndian);
    const hasSrid = (typeWithFlags & 0x20000000) !== 0;
    const geomType = typeWithFlags & 0x000000ff;
    if (geomType !== 1) return null;
    const coordOffset = hasSrid ? 9 : 5;
    if (bytes.byteLength < coordOffset + 16) return null;
    const lng = view.getFloat64(coordOffset, littleEndian);
    const lat = view.getFloat64(coordOffset + 8, littleEndian);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    return { lat, lng };
  } catch {
    return null;
  }
}

function parseLocation(location: unknown): { lat: number; lng: number } | null {
  if (!location) return null;
  if (typeof location === "object") {
    const o = location as Record<string, unknown>;
    if (Array.isArray(o.coordinates) && o.coordinates.length >= 2) {
      const lng = Number(o.coordinates[0]);
      const lat = Number(o.coordinates[1]);
      if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng };
    }
    const latVal = o.lat ?? o.latitude;
    const lngVal = o.lng ?? o.lon ?? o.longitude;
    if (latVal !== undefined && lngVal !== undefined) {
      const lat = Number(latVal); const lng = Number(lngVal);
      if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng };
    }
  }
  if (typeof location === "string") {
    const ewkb = parseEwkbHexPoint(location);
    if (ewkb) return ewkb;
    const m = location.match(/POINT\s*\(\s*([-\d.]+)\s+([-\d.]+)\s*\)/i);
    if (m) return { lng: Number(m[1]), lat: Number(m[2]) };
  }
  return null;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

function applyFilter(
  complaints: MappedComplaint[],
  center: GeoPoint | null,
  radiusMeters: number
): MappedComplaint[] {
  if (!center || complaints.length === 0) return [];

  return complaints
    .filter((c) => calculateDistanceMeters(center, { lat: c.lat, lng: c.lng }) <= radiusMeters)
    .sort((a, b) => b.upvote_count - a.upvote_count);
}

export function useNearbyTickets() {
  const [allComplaints, setAllComplaints] = useState<MappedComplaint[]>([]);
  const [visibleComplaints, setVisibleComplaints] = useState<MappedComplaint[]>([]);
  const [hasUpvoted, setHasUpvoted] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const lastCenterRef = useRef<GeoPoint | null>(null);
  const lastRadiusRef = useRef<number>(1000);

  async function fetchComplaints() {
    setLoading(true);
    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      const token = session?.access_token ?? null;
      if (sessionError || !token) {
        setError("Please sign in to view nearby tickets");
        setLoading(false);
        return;
      }

      const res = await fetch("/api/citizen/nearby", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      });

      const payload = (await res.json()) as { error?: string; items?: Tables<"complaints">[] };

      if (!res.ok || !Array.isArray(payload.items)) {
        setError(payload.error ?? "Failed to load complaints");
        setLoading(false);
        return;
      }

    const data = payload.items;

    type Row = Tables<"complaints">;
    const mapped: MappedComplaint[] = (data as Row[])
      .map((c) => {
        const pos = parseLocation(c.location);
        if (!pos) return null;
        return {
          id: c.id,
          ticket_id: c.ticket_id,
          title: c.title,
          description: c.description,
          severity: c.severity as SeverityLevel,
          effective_severity: (c.effective_severity || c.severity) as SeverityLevel,
          lat: pos.lat,
          lng: pos.lng,
          photo_urls: c.photo_urls,
          upvote_count: c.upvote_count,
          status: c.status,
          created_at: c.created_at,
          address_text: c.address_text,
          ward_name: c.ward_name,
          category_id: c.category_id,
          assigned_department: c.assigned_department,
        };
      })
      .filter(Boolean) as MappedComplaint[];

      setAllComplaints(mapped);
      // Re-apply filter now that data is loaded
      setVisibleComplaints(applyFilter(mapped, lastCenterRef.current, lastRadiusRef.current));
      setError(null);
      setLoading(false);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Unknown error occurred";
      setError(errorMsg || "Failed to load complaints");
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchComplaints();
  }, []);

  const updateRadius = useCallback(
    (center: GeoPoint, radiusMeters: number) => {
      lastCenterRef.current = center;
      lastRadiusRef.current = radiusMeters;
      setVisibleComplaints(applyFilter(allComplaints, center, radiusMeters));
    },
    [allComplaints]
  );

  async function handleUpvote(id: string) {
    if (hasUpvoted.has(id)) return;
    setHasUpvoted((prev) => new Set([...prev, id]));
    setAllComplaints((prev) =>
      prev.map((c) => (c.id === id ? { ...c, upvote_count: c.upvote_count + 1 } : c))
    );
    setVisibleComplaints((prev) =>
      prev.map((c) => (c.id === id ? { ...c, upvote_count: c.upvote_count + 1 } : c))
    );
    await supabase.rpc("increment_upvote_count", { p_complaint_id: id });
  }

  return {
    allComplaints,
    visibleComplaints,
    hasUpvoted,
    loading,
    error,
    updateRadius,
    handleUpvote,
  };
}
