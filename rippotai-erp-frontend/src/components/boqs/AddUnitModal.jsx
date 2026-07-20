import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { useCreateUnitMutation } from "../../api/unit.api";

export function AddUnitModal({ open, onClose, onCreated }) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [createUnit, { isLoading }] = useCreateUnitMutation();

  // Reset the form each time the modal is opened
  useEffect(() => {
    if (open) {
      setName("");
      setCode("");
      setDescription("");
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!name.trim() || !code.trim()) {
      toast.error("Name and code are required");
      return;
    }
    try {
      const unit = await createUnit({
        name: name.trim(),
        code: code.trim(),
        description: description.trim() || undefined,
      }).unwrap();
      toast.success("Unit added");
      onCreated?.(unit);
      onClose(false);
    } catch (e) {
      if (e?.status === 409 || e?.originalStatus === 409) {
        toast.error("A unit with that code already exists");
      } else {
        toast.error("Failed to add unit");
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Unit</DialogTitle>
          <DialogDescription>
            Create a new unit of measurement. It will be available for every
            line item once added.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <label className="text-[11.5px] uppercase tracking-widest text-[#B5C4B6]">
              Name
            </label>
            <input
              className="bc-input mt-1"
              placeholder="e.g. Square Meter"
              value={name}
              onChange={(e) => setName(e.target.value)}
              data-testid="add-unit-name"
              autoFocus
            />
          </div>

          <div>
            <label className="text-[11.5px] uppercase tracking-widest text-[#B5C4B6]">
              Code
            </label>
            <input
              className="bc-input mt-1"
              placeholder="e.g. Sqm"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              data-testid="add-unit-code"
            />
          </div>

          <div>
            <label className="text-[11.5px] uppercase tracking-widest text-[#B5C4B6]">
              Description
            </label>
            <textarea
              className="bc-input mt-1 min-h-[70px]"
              placeholder="Optional notes about this unit"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              data-testid="add-unit-description"
            />
          </div>
        </div>

        <DialogFooter>
          <button
            onClick={() => onClose(false)}
            className="h-10 px-4 rounded-xl border border-[#B5C4B6] text-[13px] font-semibold"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="h-10 px-4 rounded-xl bg-[#1F453B] text-white text-[13px] font-semibold disabled:opacity-60"
            data-testid="add-unit-submit"
          >
            {isLoading ? "Adding…" : "Add Unit"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
