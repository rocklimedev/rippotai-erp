import React, { useEffect, useRef, useState } from "react";
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  RotateCcw,
  Loader2,
} from "lucide-react";

export default function ClientActionsMenu({
  client,
  isDeleted = false,
  saving = false,
  onEdit,
  onDelete,
  onRestore,
}) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleAction = (action) => {
    setOpen(false);

    if (saving) return;

    action?.();
  };

  return (
    <div ref={menuRef} className="relative inline-block text-left">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        disabled={saving}
        className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-[#6B7B7C] hover:bg-[#F3F3F1] hover:text-[#333333] disabled:opacity-50"
        aria-label={`Actions for ${client?.name || "client"}`}
      >
        {saving ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <MoreHorizontal size={18} />
        )}
      </button>

      {/* Dropdown */}
      {open && !saving && (
        <div className="absolute right-0 top-full mt-1 z-40 w-44 bg-white border border-[#E8EAF0] rounded-xl shadow-lg py-1">
          {/* Edit */}
          {!isDeleted && (
            <button
              type="button"
              onClick={() => handleAction(onEdit)}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#333333] hover:bg-[#F3F3F1]"
            >
              <Pencil size={15} />
              Edit
            </button>
          )}

          {/* Delete */}
          {!isDeleted && (
            <button
              type="button"
              onClick={() => handleAction(onDelete)}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#7A2E1A] hover:bg-[#F1D9D3]"
            >
              <Trash2 size={15} />
              Delete
            </button>
          )}

          {/* Restore */}
          {isDeleted && (
            <button
              type="button"
              onClick={() => handleAction(onRestore)}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#2A6B45] hover:bg-[#D3E7D3]"
            >
              <RotateCcw size={15} />
              Restore
            </button>
          )}
        </div>
      )}
    </div>
  );
}
