"use client";

import { ArrowLeft, MapPin, Clock, ThumbsUp } from "lucide-react";
import type { MappedComplaint } from "./useNearbyTickets";
import { getSeverityConfig } from "./useNearbyTickets";

interface TicketDetailProps {
  complaint: MappedComplaint;
  hasUpvoted: Set<string>;
  onBack: () => void;
  onUpvote: (id: string) => void;
}

export default function TicketDetail({
  complaint,
  hasUpvoted,
  onBack,
  onUpvote,
}: TicketDetailProps) {
  const sev = getSeverityConfig(complaint.effective_severity || complaint.severity);
  const upvoted = hasUpvoted.has(complaint.id);
  const photos: string[] = complaint.photo_urls ?? [];

  return (
    <div className="flex flex-col">
      {/* Back */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400
          hover:text-gray-900 dark:hover:text-white mb-4 transition-colors w-fit"
      >
        <ArrowLeft size={16} />
        Go Back
      </button>

      {/* Photos */}
      {photos.length > 0 && (
        <div className="flex gap-2 overflow-x-auto mb-4 pb-1 -mx-3 px-3">
          {photos.map((url: string, i: number) => (
            <img
              key={i}
              src={url}
              alt={`complaint photo ${i + 1}`}
              className="h-44 w-64 object-cover rounded-xl shrink-0 shadow-sm"
            />
          ))}
        </div>
      )}

      {/* Header row */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center flex-wrap gap-2 mb-2">
            <span
              className="text-xs font-bold uppercase tracking-wider px-2 py-1 rounded-full"
              style={{ background: sev.color + "22", color: sev.color }}
            >
              {sev.label}
            </span>
            <span className="text-xs text-gray-400 dark:text-gray-500 capitalize px-2 py-1 rounded-full bg-gray-100 dark:bg-white/5">
              {complaint.status.replace(/_/g, " ")}
            </span>
          </div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">
            {complaint.title}
          </h2>
          {(complaint.address_text || complaint.ward_name) && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1.5">
              <MapPin size={13} />
              {complaint.address_text || complaint.ward_name}
            </p>
          )}
        </div>

        {/* Upvote */}
        <button
          onClick={() => onUpvote(complaint.id)}
          className={`shrink-0 flex flex-col items-center gap-1 px-3 py-2 rounded-xl
            transition-all font-bold text-sm
            ${upvoted
              ? "bg-blue-500 text-white shadow-lg shadow-blue-500/30"
              : "bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400 hover:bg-blue-500/20 hover:text-blue-500"
            }`}
        >
          <ThumbsUp size={16} />
          {complaint.upvote_count}
        </button>
      </div>

      {/* Description */}
      <div className="rounded-xl bg-gray-50 dark:bg-white/5 p-4 mb-4">
        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
          {complaint.description}
        </p>
      </div>

      {/* Footer meta */}
      <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
        <Clock size={12} />
        <span>
          Reported{" "}
          {new Date(complaint.created_at).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </span>
      </div>
    </div>
  );
}
