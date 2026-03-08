"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import type { LatLngBounds } from "leaflet";

import TicketCard from "./_components/TicketCard";
import TicketDetail from "./_components/TicketDetail";
import SeveritySlider from "./_components/SeverityFilter";
import { useNearbyTickets } from "./_components/useNearbyTickets";
import type { MappedComplaint } from "./_components/useNearbyTickets";

const NearbyTicketsMap = dynamic(
  () => import("./_components/NearbyTicketsMap"),
  { ssr: false }
);

export default function NearbyTicketsPage() {
  const {
    allComplaints,
    visibleComplaints,
    hasUpvoted,
    loading,
    error,
    updateBounds,
    handleUpvote,
  } = useNearbyTickets();

  const [selectedComplaint, setSelectedComplaint] = useState<MappedComplaint | null>(null);
  const [flyTarget, setFlyTarget] = useState<{ lat: number; lng: number } | null>(null);
  const [maxSeverityLevel, setMaxSeverityLevel] = useState<number>(4);

  function handleSelectComplaint(complaint: MappedComplaint) {
    setSelectedComplaint(complaint);
    setFlyTarget({ lat: complaint.lat, lng: complaint.lng });
  }

  function handleBoundsChange(bounds: LatLngBounds) {
    updateBounds(bounds, maxSeverityLevel);
  }

  function handleSeverityChange(level: number) {
    setMaxSeverityLevel(level);
    // Re-filter with current bounds stored in the hook
    updateBounds(
      { contains: () => true } as any, // will be overridden by stored bounds in hook
      level
    );
  }

  const selectedId = selectedComplaint ? (selectedComplaint as MappedComplaint).id : null;

  return (
    <div className="flex flex-col bg-gray-50 dark:bg-gray-950">

      {/* Map */}
      <NearbyTicketsMap
        complaints={allComplaints}
        selectedId={selectedId}
        flyTarget={flyTarget}
        maxSeverityLevel={maxSeverityLevel}
        onBoundsChange={handleBoundsChange}
        onMarkerClick={handleSelectComplaint}
      />

      {/* Severity slider — sits between map and list */}
      <SeveritySlider
        maxLevel={maxSeverityLevel}
        onChange={handleSeverityChange}
      />

      {/* Ticket list / detail */}
      <div className="flex-1 overflow-y-auto px-3 pt-4 pb-8">
        {selectedComplaint ? (
          <TicketDetail
            complaint={selectedComplaint}
            hasUpvoted={hasUpvoted}
            onBack={() => setSelectedComplaint(null)}
            onUpvote={handleUpvote}
          />
        ) : (
          <>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-base font-bold text-gray-900 dark:text-white">
                  Nearby Complaints
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {visibleComplaints.length} ticket{visibleComplaints.length !== 1 ? "s" : ""} in view
                  {" · "}sorted by upvotes
                </p>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm text-red-500 bg-red-500/10 rounded-xl px-4 py-3 mb-3">
                <AlertTriangle size={16} />
                {error}
              </div>
            )}

            {loading ? (
              <div className="flex flex-col gap-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-20 rounded-xl bg-white dark:bg-white/5 animate-pulse" />
                ))}
              </div>
            ) : visibleComplaints.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <AlertTriangle size={36} className="text-gray-300 dark:text-gray-700 mb-3" />
                <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                  No tickets in this area
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-600 mt-1">
                  Try zooming out or panning the map
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {visibleComplaints.map((complaint) => (
                  <TicketCard
                    key={complaint.id}
                    complaint={complaint}
                    isSelected={selectedId !== null && selectedId === complaint.id}
                    hasUpvoted={hasUpvoted}
                    onClick={() => handleSelectComplaint(complaint)}
                    onUpvote={handleUpvote}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
