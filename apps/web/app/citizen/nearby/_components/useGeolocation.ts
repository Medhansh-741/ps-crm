"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { GeoPoint } from "./distance";

type GeoState = "idle" | "loading" | "granted" | "denied" | "error";

type UseGeolocationResult = {
  location: GeoPoint | null;
  accuracyMeters: number | null;
  lastUpdatedAt: number | null;
  state: GeoState;
  error: string | null;
  requestLocation: () => void;
};

export function useGeolocation(): UseGeolocationResult {
  const [location, setLocation] = useState<GeoPoint | null>(null);
  const [accuracyMeters, setAccuracyMeters] = useState<number | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null);
  const [state, setState] = useState<GeoState>("idle");
  const [error, setError] = useState<string | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const lastAcceptedUpdateAtRef = useRef<number>(0);

  const clearWatcher = useCallback(() => {
    if (watchIdRef.current !== null && typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }
    watchIdRef.current = null;
  }, []);

  const requestLocation = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setState("error");
      setError("Geolocation is not supported by this browser.");
      return;
    }

    clearWatcher();
    setState("loading");
    setError(null);

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const now = Date.now();
        if (lastAcceptedUpdateAtRef.current !== 0 && now - lastAcceptedUpdateAtRef.current < 5000) {
          return;
        }

        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setAccuracyMeters(position.coords.accuracy ?? null);
        setLastUpdatedAt(now);
        lastAcceptedUpdateAtRef.current = now;
        setState("granted");
        setError(null);
      },
      (geoError) => {
        if (geoError.code === geoError.PERMISSION_DENIED) {
          setState("denied");
          setError("Location permission was denied.");
        } else if (geoError.code === geoError.TIMEOUT) {
          // Keep dashboard active if we already have a lock; only surface degraded signal state.
          setState((prev) => (prev === "granted" ? "granted" : "error"));
          setError("Searching for GPS signal...");
        } else {
          setState((prev) => (prev === "granted" ? "granted" : "error"));
          setError("Searching for GPS signal...");
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 5000,
      }
    );
  }, [clearWatcher]);

  useEffect(() => {
    requestLocation();
    return () => clearWatcher();
  }, [requestLocation, clearWatcher]);

  return {
    location,
    accuracyMeters,
    lastUpdatedAt,
    state,
    error,
    requestLocation,
  };
}
