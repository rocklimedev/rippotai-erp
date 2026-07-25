import React, { useEffect, useRef, useState } from "react";
import { MoreVertical, Pencil, Power, Trash2 } from "lucide-react";

export default function UserActionsMenu({
  isSelf,
  isActive,
  saving,
  onEdit,
  onToggleActive,
  onDelete,
}) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    };

    const handleEscape = (e) => {
      if (e.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  const run = (fn) => {
    setOpen(false);
    fn?.();
  };

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={saving}
        className="w-8 h-8 rounded-lg flex items-center justify-center text-[#6B7B7C] hover:bg-[#F3F3F1] hover:text-[#333333] disabled:opacity-40"
        aria-haspopup="true"
        aria-expanded={open}
        aria-label="User actions"
      >
        <MoreVertical size={16} />
      </button>

      {open && (
        <div
          className="absolute right-0 z-10 mt-1 w-44 rounded-xl border border-[#E8EAF0] bg-white shadow-lg overflow-hidden py-1"
          role="menu"
        >
          <button
            type="button"
            role="menuitem"
            disabled={isSelf}
            onClick={() => run(onEdit)}
            title={
              isSelf
                ? "Use Profile Settings to edit your own account"
                : undefined
            }
            className="w-full flex items-center gap-2 px-3.5 py-2 text-sm text-[#333333] hover:bg-[#FAF8F5] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Pencil size={14} />
            Edit User
          </button>

          <button
            type="button"
            role="menuitem"
            disabled={isSelf}
            onClick={() => run(onToggleActive)}
            title={isSelf ? "You can't deactivate your own account" : undefined}
            className="w-full flex items-center gap-2 px-3.5 py-2 text-sm text-[#333333] hover:bg-[#FAF8F5] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Power size={14} />
            {isActive ? "Deactivate" : "Activate"}
          </button>

          <div className="my-1 border-t border-[#EFF2F9]" />

          <button
            type="button"
            role="menuitem"
            disabled={isSelf}
            onClick={() => run(onDelete)}
            title={isSelf ? "You can't delete your own account" : undefined}
            className="w-full flex items-center gap-2 px-3.5 py-2 text-sm text-[#B3261E] hover:bg-[#FBEAE9] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Trash2 size={14} />
            Delete User
          </button>
        </div>
      )}
    </div>
  );
}
