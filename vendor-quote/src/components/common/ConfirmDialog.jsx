import React, { useState } from "react";

// ---------------------------------------------------------------------------
// Confirm Dialog
// ---------------------------------------------------------------------------
export default function ConfirmDialog({
  title,
  message,
  onConfirm,
  onCancel,
  placeholder,
  requireText = false,
}) {
  const [remarks, setRemarks] = useState("");
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-md shadow-xl">
        <div className="px-5 py-4 border-b border-[#E5E7EB]">
          <h3 className="text-sm font-semibold text-[#333333]">{title}</h3>
        </div>
        <div className="px-5 py-4">
          <p className="text-sm text-gray-600 mb-3">{message}</p>
          {requireText && (
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder={placeholder || "Enter remarks..."}
              rows={3}
              className="w-full border border-[#E5E7EB] rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#1A3C34] resize-none"
              autoFocus
            />
          )}
        </div>
        <div className="px-5 py-3 border-t border-[#E5E7EB] flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-1.5 text-sm border border-[#E5E7EB] rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(remarks)}
            disabled={requireText && !remarks.trim()}
            className="px-4 py-1.5 text-sm bg-[#1A3C34] text-white rounded-md hover:bg-red-700 disabled:opacity-50"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
