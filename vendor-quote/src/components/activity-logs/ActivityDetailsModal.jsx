import React from "react";
import { formatDateTime } from "../../utils/helpers";
import { X } from "lucide-react";

export const ACTION_COLORS = {
  "Quotation Created": "bg-blue-100 text-blue-700",
  "Quotation Submitted": "bg-yellow-100 text-yellow-700",
  "Quotation Approved": "bg-green-100 text-green-700",
  "Quotation Returned for Editing": "bg-orange-100 text-orange-700",
  "Quotation Declined": "bg-red-100 text-red-700",
  "Quotation Updated": "bg-gray-100 text-gray-600",
  "Project Created": "bg-purple-100 text-purple-700",
  "Vendor Created": "bg-teal-100 text-teal-700",
};

export function formatActionLabel(action) {
  if (!action) return "";
  if (ACTION_COLORS[action]) return action;
  // fall back for snake_case / UPPER_SNAKE values e.g. "project_created"
  return action
    .toLowerCase()
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export default function ActivityDetailsModal({ log, onClose }) {
  if (!log) return null;

  const changeEntries = log.changes ? Object.entries(log.changes) : [];

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E5E7EB]">
          <h2 className="text-base font-semibold text-[#333333]">
            Activity Details
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-gray-100 text-gray-400"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 py-4 overflow-y-auto space-y-4 text-sm">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-xs text-gray-400 uppercase font-semibold mb-1">
                Action
              </div>
              <div className="text-[#333333]">
                {formatActionLabel(log.action)}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-400 uppercase font-semibold mb-1">
                Date & Time
              </div>
              <div className="text-[#333333]">
                {formatDateTime(log.created_at)}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-400 uppercase font-semibold mb-1">
                User
              </div>
              <div className="text-[#333333]">{log.user_email}</div>
              <div className="text-xs text-gray-400 capitalize">
                {log.user_role}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-400 uppercase font-semibold mb-1">
                Entity
              </div>
              <div className="text-[#333333] capitalize">{log.entity_type}</div>
              {log.entity_label && (
                <div className="text-xs text-gray-500">{log.entity_label}</div>
              )}
            </div>
          </div>

          {changeEntries.length > 0 && (
            <div>
              <div className="text-xs text-gray-400 uppercase font-semibold mb-2">
                Changes
              </div>
              <div className="border border-[#E5E7EB] rounded-md divide-y divide-[#F3F4F6]">
                {changeEntries.map(([key, value]) => (
                  <div
                    key={key}
                    className="flex items-start justify-between gap-4 px-3 py-2"
                  >
                    <span className="text-gray-500 capitalize shrink-0">
                      {key.replace(/_/g, " ")}
                    </span>
                    <span className="text-[#333333] text-right break-words">
                      {typeof value === "object" && value !== null
                        ? JSON.stringify(value)
                        : String(value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="px-5 py-3 border-t border-[#E5E7EB] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-md bg-[#1A3C34] text-white hover:opacity-90"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
