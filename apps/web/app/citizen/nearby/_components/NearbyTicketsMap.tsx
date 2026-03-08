"use client";

import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import { ChevronUp, ChevronDown, Flame, MapPin } from "lucide-react";
import type { MappedComplaint } from "./useNearbyTickets";
import { getSeverityConfig } from "./useNearbyTickets";
import type { LatLngBounds } from "leaflet";

// ─── Viewport tracker ─────────────────────────────────────────────────────────

function MapViewportTracker({
  onBoundsChange,
}: {
  onBoundsChange: (bounds: LatLngBounds) => void;
}) {
  const map = useMapEvents({
    moveend: () => onBoundsChange(map.getBounds()),
    zoomend: () => onBoundsChange(map.getBounds()),
  });
  useEffect(() => {
    onBoundsChange(map.getBounds());
  }, []);
  return null;
}

// ─── Fly to target ────────────────────────────────────────────────────────────

function FlyToTarget({ target }: { target: { lat: number; lng: number } | null }) {
  const map = useMap();
  useEffect(() => {
    if (target) map.flyTo([target.lat, target.lng], 15, { duration: 0.8 });
  }, [target]);
  return null;
}

// ─── Heatmap layer ────────────────────────────────────────────────────────────

function HeatmapLayer({ complaints }: { complaints: MappedComplaint[] }) {
  const map = useMap();

  useEffect(() => {
    if (complaints.length === 0) return;

    const L = require("leaflet");
    if (typeof window !== "undefined" && !(window as any).L) {
      (window as any).L = L;
    }
    require("leaflet.heat");

    function getIntensity(sev: string) {
      switch (sev) {
        case "L4": return 1.0;
        case "L3": return 0.75;
        case "L2": return 0.5;
        case "L1": return 0.25;
        default:   return 0.3;
      }
    }

    const heatLayer = (L as any).heatLayer(
      complaints.map((c) => [
        c.lat,
        c.lng,
        getIntensity(c.effective_severity || c.severity),
      ]),
      {
        radius: 25,
        blur: 20,
        minOpacity: 0.35,
        gradient: {
          0.2: "#22c55e",
          0.45: "#eab308",
          0.7: "#f97316",
          1.0: "#ef4444",
        },
      }
    );

    heatLayer.addTo(map);
    return () => { map.removeLayer(heatLayer); };
  }, [complaints, map]);

  return null;
}

// ─── Photo + hover pin ────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function makeMarkerIcon(complaint: MappedComplaint, L: any, isSelected: boolean) {
  const sev = getSeverityConfig(complaint.effective_severity || complaint.severity);
  const photo = complaint.photo_urls?.[0];
  const size = isSelected ? 52 : 42;
  const ringStyle = isSelected
    ? `box-shadow:0 0 0 3px ${sev.color},0 0 16px ${sev.color}88;`
    : `box-shadow:0 0 0 2.5px ${sev.color};`;

  const label = complaint.title.length > 28
    ? complaint.title.slice(0, 28) + "…"
    : complaint.title;

  const photoHtml = photo
    ? `<img src="${photo}"
         style="width:100%;height:100%;object-fit:cover;border-radius:50%;"
         onerror="this.style.display='none';this.nextSibling.style.display='flex'" />
       <div style="display:none;width:100%;height:100%;align-items:center;justify-content:center;
         font-size:${size * 0.38}px;background:${sev.color}22;border-radius:50%;">📍</div>`
    : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;
         font-size:${size * 0.38}px;background:${sev.color}22;border-radius:50%;">📍</div>`;

  return new L.DivIcon({
    html: `
      <div class="complaint-pin-wrapper" style="position:relative;display:inline-block;">
        <div style="
          width:${size}px;height:${size}px;border-radius:50%;overflow:hidden;
          ${ringStyle};transition:all 0.2s;cursor:pointer;
        ">${photoHtml}</div>
        <div class="pin-tooltip" style="
          position:absolute;
          left:${size + 6}px;
          top:50%;
          transform:translateY(-50%);
          background:rgba(0,0,0,0.82);
          color:#fff;
          font-size:11px;
          font-weight:600;
          padding:4px 8px;
          border-radius:6px;
          white-space:nowrap;
          pointer-events:none;
          opacity:0;
          transition:opacity 0.15s;
          z-index:9999;
          border-left:3px solid ${sev.color};
        ">${label}</div>
      </div>`,
    className: "",
    iconSize: [size + 160, size],
    iconAnchor: [size / 2, size / 2],
  });
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface NearbyTicketsMapProps {
  complaints: MappedComplaint[];
  selectedId: string | null;
  flyTarget: { lat: number; lng: number } | null;
  maxSeverityLevel: number;
  onBoundsChange: (bounds: LatLngBounds) => void;
  onMarkerClick: (complaint: MappedComplaint) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function NearbyTicketsMap({
  complaints,
  selectedId,
  flyTarget,
  maxSeverityLevel,
  onBoundsChange,
  onMarkerClick,
}: NearbyTicketsMapProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [L, setL] = useState<any>(null);
  const [mapHeight, setMapHeight] = useState(320);
  const [collapsed, setCollapsed] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(false);

  const isDragging = useRef(false);
  const dragStartY = useRef(0);
  const dragStartH = useRef(0);

  useEffect(() => {
    import("leaflet").then((leaflet) => {
      delete (leaflet.Icon.Default.prototype as any)._getIconUrl;
      leaflet.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });
      setL(leaflet);
    });

    const style = document.createElement("style");
    style.innerHTML = `.complaint-pin-wrapper:hover .pin-tooltip { opacity: 1 !important; }`;
    document.head.appendChild(style);
  }, []);

  function onDragStart(e: React.MouseEvent | React.TouchEvent) {
    isDragging.current = true;
    dragStartY.current = "touches" in e ? e.touches[0].clientY : e.clientY;
    dragStartH.current = mapHeight;
    const onMove = (ev: MouseEvent | TouchEvent) => {
      if (!isDragging.current) return;
      const y = "touches" in ev
        ? (ev as TouchEvent).touches[0].clientY
        : (ev as MouseEvent).clientY;
      setMapHeight(Math.max(160, Math.min(600, dragStartH.current + (y - dragStartY.current))));
    };
    const onUp = () => {
      isDragging.current = false;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchmove", onMove as EventListener);
      window.removeEventListener("touchend", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchmove", onMove as EventListener, { passive: true });
    window.addEventListener("touchend", onUp);
  }

  const pinsToShow = complaints.filter((c) => {
    const level = getSeverityConfig(c.effective_severity || c.severity).level;
    return level <= maxSeverityLevel;
  });

  return (
    <>
      {/* Map */}
      <div
        className="relative transition-all duration-300 overflow-hidden"
        style={{ height: collapsed ? 0 : mapHeight }}
      >
        {!collapsed && L && (
          <MapContainer
            center={[28.6139, 77.209]}
            zoom={12}
            style={{ height: "100%", width: "100%" }}
            zoomControl={false}
          >
            <TileLayer
              attribution="© OpenStreetMap contributors"
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapViewportTracker onBoundsChange={onBoundsChange} />
            <FlyToTarget target={flyTarget} />

            {/* Heatmap layer */}
            {showHeatmap && <HeatmapLayer complaints={pinsToShow} />}

            {/* Marker pins — always shown on top of heatmap */}
            {pinsToShow.map((c) => (
              <Marker
                key={c.id}
                position={[c.lat, c.lng]}
                icon={makeMarkerIcon(c, L, selectedId === c.id)}
                eventHandlers={{ click: () => onMarkerClick(c) }}
              />
            ))}
          </MapContainer>
        )}

        {/* Map controls overlay */}
        {!collapsed && (
          <div className="absolute top-3 right-3 z-[1000] flex flex-col gap-2">
            {/* Heatmap toggle */}
            <button
              onClick={() => setShowHeatmap((v) => !v)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold
                shadow-lg border transition-all
                ${showHeatmap
                  ? "bg-orange-500 text-white border-orange-600"
                  : "bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                }`}
            >
              <Flame size={12} />
              {showHeatmap ? "Heatmap On" : "Heatmap"}
            </button>
          </div>
        )}
      </div>

      {/* Drag / collapse handle */}
      <div
        className="relative flex items-center justify-center h-7 select-none shrink-0
          bg-gray-100 dark:bg-gray-900 border-y border-gray-200 dark:border-gray-800
          group cursor-row-resize"
        onMouseDown={onDragStart}
        onTouchStart={onDragStart}
      >
        <div className="w-10 h-1 rounded-full bg-gray-300 dark:bg-gray-700
          group-hover:bg-gray-400 dark:group-hover:bg-gray-500 transition-colors" />
        <button
          onClick={() => setCollapsed((v) => !v)}
          onMouseDown={(e) => e.stopPropagation()}
          className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1
            text-[10px] font-semibold text-gray-400
            hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
        >
          {collapsed
            ? <><ChevronDown size={13} /> Map</>
            : <><ChevronUp size={13} /> Hide</>}
        </button>
      </div>
    </>
  );
}
