"use client";

import { useEffect, useState } from "react";
import MapComponent from "../../MapComponent";
import { supabase } from "../../../src/lib/supabase";

type Complaint = {
  id: string;
  ticket_id: string;
  title: string;
  severity: string;
  status: string;
  created_at: string;
};

export default function AuthorityDashboardPage() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [search, setSearch] = useState("");
  const [selectedComplaintId, setSelectedComplaintId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState("latest");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  useEffect(() => {
    fetchComplaints();
  }, []);

  async function fetchComplaints() {
    const { data, error } = await supabase
      .from("complaints")
      .select("id, ticket_id, title, severity, status, created_at");

    if (error) {
      console.error(error);
      return;
    }

    setComplaints(data || []);
  }
  let filteredComplaints = complaints.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase()) ||
    c.id.toLowerCase().includes(search.toLowerCase())
  );

  // STATUS FILTER
  if (statusFilter !== "all") {
    filteredComplaints = filteredComplaints.filter(
      (c) => c.status.toLowerCase() === statusFilter
    );
  }

  // SORT
  filteredComplaints = filteredComplaints.sort((a, b) => {
    const dateA = new Date(a.created_at || 0).getTime();
    const dateB = new Date(b.created_at || 0).getTime();
    if (sortBy === "latest") {
      return dateB - dateA;
    } else {
      return dateA - dateB;
    }
  });
  return (
    <div className="max-w-[1500px] mx-auto px-6 py-6 space-y-8">

      {/* TOP NAVBAR */}
      <div className="bg-[#5b3a2e] text-white px-6 py-4 rounded-lg flex justify-between items-center shadow-md">

        <div className="flex items-center gap-6">
          <h1 className="text-lg font-semibold">
            Civic Complaint Management
          </h1>

          <span className="text-sm opacity-80">
            Authority Dashboard
          </span>
        </div>

        <div className="flex items-center gap-4">

          <input
            placeholder="Search complaints..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-3 py-2 rounded-md text-black text-sm"
          />

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gray-200 rounded-full"></div>

            <div className="text-sm">
              Authority Lead
            </div>
          </div>

        </div>

      </div>

      {/* MAP CARD */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">

        <div className="flex justify-between items-center p-4 border-b bg-gray-50">

          <div className="flex gap-4 text-sm font-medium">

            <span className="flex items-center gap-1">
              <span className="w-3 h-3 bg-green-500 rounded-full"></span>
              Low
            </span>

            <span className="flex items-center gap-1">
              <span className="w-3 h-3 bg-yellow-500 rounded-full"></span>
              Medium
            </span>

            <span className="flex items-center gap-1">
              <span className="w-3 h-3 bg-orange-500 rounded-full"></span>
              High
            </span>

            <span className="flex items-center gap-1">
              <span className="w-3 h-3 bg-red-500 rounded-full"></span>
              Critical
            </span>

          </div>

          <button className="px-4 py-2 bg-black text-white rounded-md text-sm">
            Map View
          </button>

        </div>

        <div className="h-[450px]">
          <MapComponent selectedComplaintId={selectedComplaintId} />
        </div>

      </div>

      {/* COMPLAINTS TABLE CARD */}
      <div className="bg-[#eef3f4] rounded-xl shadow-lg p-6">

        {/* HEADER */}
        <div className="mb-6 flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">
              Complaints Overview
            </h2>
            <button className="px-3 py-2 bg-gray-800 text-white rounded-md text-sm">
              Export
            </button>
          </div>

          <div className="flex flex-col gap-3">
            <input
              type="text"
              placeholder="Search by ticket id, title, or address..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <div className="flex gap-3">
              {/* Sort Dropdown */}
              <div className="relative">
                <button
                  onClick={() => { setIsSortOpen(!isSortOpen); setIsStatusOpen(false); }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm bg-white hover:bg-gray-50 flex items-center gap-2 focus:outline-none shadow-sm transition-colors"
                >
                  Sort: {sortBy === "latest" ? "Latest" : "Oldest"}
                  <span className="text-xs">▼</span>
                </button>
                {/* Dropdown Menu */}
                <div
                  className={`absolute left-0 mt-2 w-32 bg-white border border-gray-200 rounded-lg shadow-lg z-50 transition-all duration-200 origin-top flex flex-col overflow-hidden ${isSortOpen ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 -translate-y-2 pointer-events-none'}`}
                >
                  <button
                    onClick={() => { setSortBy("latest"); setIsSortOpen(false); }}
                    className={`text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors ${sortBy === "latest" ? "bg-gray-50 font-medium text-blue-600" : ""}`}
                  >
                    Latest
                  </button>
                  <button
                    onClick={() => { setSortBy("oldest"); setIsSortOpen(false); }}
                    className={`text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors ${sortBy === "oldest" ? "bg-gray-50 font-medium text-blue-600" : ""}`}
                  >
                    Oldest
                  </button>
                </div>
              </div>

              {/* Status Dropdown */}
              <div className="relative">
                <button
                  onClick={() => { setIsStatusOpen(!isStatusOpen); setIsSortOpen(false); }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm bg-white hover:bg-gray-50 flex items-center gap-2 focus:outline-none shadow-sm transition-colors"
                >
                  Status: {statusFilter === "all" ? "All" : statusFilter === "submitted" ? "Submitted" : "In Progress"}
                  <span className="text-xs">▼</span>
                </button>
                {/* Dropdown Menu */}
                <div
                  className={`absolute left-0 mt-2 w-36 bg-white border border-gray-200 rounded-lg shadow-lg z-50 transition-all duration-200 origin-top flex flex-col overflow-hidden ${isStatusOpen ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 -translate-y-2 pointer-events-none'}`}
                >
                  <button
                    onClick={() => { setStatusFilter("all"); setIsStatusOpen(false); }}
                    className={`text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors ${statusFilter === "all" ? "bg-gray-50 font-medium text-blue-600" : ""}`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => { setStatusFilter("submitted"); setIsStatusOpen(false); }}
                    className={`text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors ${statusFilter === "submitted" ? "bg-gray-50 font-medium text-blue-600" : ""}`}
                  >
                    Submitted
                  </button>
                  <button
                    onClick={() => { setStatusFilter("in progress"); setIsStatusOpen(false); }}
                    className={`text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors ${statusFilter === "in progress" ? "bg-gray-50 font-medium text-blue-600" : ""}`}
                  >
                    In Progress
                  </button>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* TABLE */}
        <div className="bg-white rounded-lg shadow">

          <div className="max-h-[350px] overflow-y-auto">

            <table className="w-full text-sm">

              <thead className="sticky top-0 z-10 bg-gradient-to-r from-[#5b3a2e] to-[#8b5e49] text-white">
                <tr>
                  <th className="p-3 text-left">Ticket ID</th>
                  <th className="p-3 text-left">Title</th>
                  <th className="p-3 text-left">Severity</th>
                  <th className="p-3 text-left">Status</th>
                  <th className="p-3 text-left">Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredComplaints.map((c) => (
                  <tr key={c.id}
                    onClick={() => setSelectedComplaintId(c.id)}
                    className="border-t hover:bg-gray-50 cursor-pointer transition">

                    <td className="p-3 font-mono">{c.ticket_id}</td>

                    <td className="p-3">{c.title}</td>

                    <td className="p-3">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold
                        ${c.severity === "Low"
                            ? "bg-green-100 text-green-700"
                            : ""
                          }
                        ${c.severity === "Medium"
                            ? "bg-yellow-100 text-yellow-700"
                            : ""
                          }
                        ${c.severity === "High"
                            ? "bg-orange-100 text-orange-700"
                            : ""
                          }
                        ${c.severity === "Critical"
                            ? "bg-red-100 text-red-700"
                            : ""
                          }
                      `}
                      >
                        {c.severity}
                      </span>
                    </td>

                    <td className="p-3">
                      <span className="px-3 py-1 rounded-full bg-gray-200 text-xs">
                        {c.status}
                      </span>
                    </td>

                    <td className="p-3 flex gap-3 text-sm">

                      <button className="text-blue-600 hover:underline">
                        View
                      </button>

                      <button className="text-gray-700 hover:underline">
                        Edit
                      </button>

                      <button className="text-red-600 hover:underline">
                        Delete
                      </button>

                    </td>

                  </tr>
                ))}
                {filteredComplaints.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center p-6 text-gray-500">
                      No complaints found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}