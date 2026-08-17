import React from "react";
import { Lock, GitBranch, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";

export function LockedEditModal({
  open,
  onOpenChange,
  boqNumber,
  version,
  onCreateNewVersion,
  busy,
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid="locked-edit-modal">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[#333333]">
            <Lock size={16} /> This BOQ is approved &amp; locked
          </DialogTitle>
          <DialogDescription>
            <span className="font-semibold text-[#333333]">
              {boqNumber || `V${version}`}
            </span>{" "}
            has been approved. Approved BOQs cannot be edited — no line-item,
            category, terms, misc %, additional charge, fee, delete, reorder or
            duplicate change is allowed.
            <br />
            <br />
            To change anything, create a new version. A fresh draft (next
            version number) will open with all the same content, ready to edit.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <button
            onClick={() => onOpenChange(false)}
            className="h-10 px-4 rounded-xl border border-[#B5C4B6] text-[13px] font-semibold text-[#6B7B7C]"
            data-testid="locked-edit-cancel"
          >
            Close
          </button>
          <button
            onClick={onCreateNewVersion}
            disabled={busy}
            className="h-10 px-4 rounded-xl bg-[#1F453B] hover:bg-[#1F453B] text-white text-[13px] font-semibold flex items-center gap-1.5 disabled:opacity-60"
            data-testid="locked-edit-create-version"
          >
            {busy ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <GitBranch size={13} />
            )}{" "}
            Create New Version
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
