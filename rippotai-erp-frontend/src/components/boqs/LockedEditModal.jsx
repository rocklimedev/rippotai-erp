import React from "react";
import { Lock, GitBranch } from "lucide-react";
import { Button } from "@/components/inos";
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
          <DialogTitle className="flex items-center gap-3">
            <span className="inos-icon-tile inos-icon-tile--sm inos-icon-tile--warn">
              <Lock aria-hidden />
            </span>
            This BOQ is approved and locked
          </DialogTitle>
          <DialogDescription>
            <span style={{ fontWeight: 650, color: "var(--text)" }}>
              {boqNumber || `V${version}`}
            </span>{" "}
            is approved, so its items, categories, terms and charges can't be
            changed.
            <br />
            <br />
            Create a new version to make changes — a draft with the same content
            opens, ready to edit.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)} data-testid="locked-edit-cancel">
            Close
          </Button>
          <Button
            variant="primary"
            icon={GitBranch}
            onClick={onCreateNewVersion}
            loading={busy}
            data-testid="locked-edit-create-version"
          >
            Create new version
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
