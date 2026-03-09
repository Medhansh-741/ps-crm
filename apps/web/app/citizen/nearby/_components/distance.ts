export type GeoPoint = { lat: number; lng: number };

const EARTH_RADIUS_METERS = 6371000;

function toRadians(value: number): number {
  return (value * Math.PI) / 180;
}

export function calculateDistanceMeters(from: GeoPoint, to: GeoPoint): number {
  const latDelta = toRadians(to.lat - from.lat);
  const lngDelta = toRadians(to.lng - from.lng);
  const fromLat = toRadians(from.lat);
  const toLat = toRadians(to.lat);

  const a =
    Math.sin(latDelta / 2) * Math.sin(latDelta / 2) +
    Math.cos(fromLat) * Math.cos(toLat) * Math.sin(lngDelta / 2) * Math.sin(lngDelta / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_METERS * c;
}

export function formatDistance(distanceMeters: number): string {
  if (!Number.isFinite(distanceMeters)) return "-";
  if (distanceMeters < 1000) return `${Math.round(distanceMeters)} m`;
  const km = distanceMeters / 1000;
  return `${km.toFixed(1)} km`;
}
