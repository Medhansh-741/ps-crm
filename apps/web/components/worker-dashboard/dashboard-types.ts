import type { Database } from "@/src/types/database.types"

export type SeverityLevel = Database["public"]["Enums"]["severity_level"]
export type ComplaintStatus = Database["public"]["Enums"]["complaint_status"]

export type DashboardTask = {
  id: string
  ticketId: string
  description: string
  category: string
  location: string
  severity: SeverityLevel
  status: ComplaintStatus
  createdAt: string
  resolvedAt: string | null
  latitude: number | null
  longitude: number | null
  distanceKm: number | null
}

export type DashboardStats = {
  tasksToday: number
  pending: number
  completedToday: number
  urgent: number
}

export type ActivityItem = {
  id: string
  text: string
  createdAt: string
}

export const severityWeight: Record<SeverityLevel, number> = {
  L1: 1,
  L2: 2,
  L3: 3,
  L4: 4,
}

export const severityLabel: Record<SeverityLevel, string> = {
  L1: "Low",
  L2: "Medium",
  L3: "High",
  L4: "Critical",
}

export function severityClass(level: SeverityLevel): string {
  if (level === "L4") return "bg-red-100 text-red-700 border-red-200"
  if (level === "L3") return "bg-orange-100 text-orange-700 border-orange-200"
  if (level === "L2") return "bg-yellow-100 text-yellow-700 border-yellow-200"
  return "bg-emerald-100 text-emerald-700 border-emerald-200"
}

export function formatSeverity(level: SeverityLevel): string {
  return `${level} (${severityLabel[level]})`
}

export function markerColor(level: SeverityLevel): string {
  if (level === "L4") return "#dc2626"
  if (level === "L3") return "#f97316"
  if (level === "L2") return "#facc15"
  return "#16a34a"
}

export function parseLatLng(value: unknown): { lat: number; lng: number } | null {
  if (typeof value === "string") {
    const wktMatch = /POINT\(([-0-9.]+)\s+([-0-9.]+)\)/.exec(value)
    if (wktMatch) {
      return {
        lng: Number(wktMatch[1]),
        lat: Number(wktMatch[2]),
      }
    }
  }

  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>

    if (Array.isArray(record.coordinates) && record.coordinates.length >= 2) {
      const [lng, lat] = record.coordinates
      if (typeof lat === "number" && typeof lng === "number") return { lat, lng }
    }

    const lat = record.lat
    const lng = record.lng
    if (typeof lat === "number" && typeof lng === "number") return { lat, lng }

    const latitude = record.latitude
    const longitude = record.longitude
    if (typeof latitude === "number" && typeof longitude === "number") {
      return { lat: latitude, lng: longitude }
    }
  }

  return null
}

export function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const toRad = (num: number) => (num * Math.PI) / 180
  const earthRadiusKm = 6371

  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const q1 = Math.sin(dLat / 2) ** 2
  const q2 = Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(q1 + q2), Math.sqrt(1 - q1 - q2))
  return earthRadiusKm * c
}

export function formatDistance(distanceKm: number | null): string {
  if (distanceKm == null) return "Distance unavailable"
  if (distanceKm < 1) return `${Math.round(distanceKm * 1000)} m`
  return `${distanceKm.toFixed(1)} km`
}

export function relativeTime(isoTimestamp: string): string {
  const ts = new Date(isoTimestamp).getTime()
  if (!Number.isFinite(ts)) return "just now"

  const deltaSeconds = Math.max(0, Math.floor((Date.now() - ts) / 1000))
  if (deltaSeconds < 60) return "just now"

  const minutes = Math.floor(deltaSeconds / 60)
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`

  const days = Math.floor(hours / 24)
  return `${days} day${days === 1 ? "" : "s"} ago`
}