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
import { useCreateUnitMutation } from "../../api/meta/unit.api";
import { Button, Field, TextInput, TextArea } from "@/components/inos";

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
          <DialogTitle>Add unit</DialogTitle>
          <DialogDescription>
            A new unit of measurement, available on every line item once added.
          </DialogDescription>
        </DialogHeader>

        <form
          className="inos-modal-body"
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
        >
          <div className="inos-form-grid">
            <Field label="Name" required>
              <TextInput
                placeholder="e.g. Square metre"
                value={name}
                onChange={(e) => setName(e.target.value)}
                data-testid="add-unit-name"
                autoFocus
              />
            </Field>
            <Field label="Code" required hint="Short label shown in tables.">
              <TextInput
                placeholder="e.g. Sqm"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                data-testid="add-unit-code"
              />
            </Field>
          </div>
          <Field label="Description" optional>
            <TextArea
              rows={2}
              placeholder="Optional notes about this unit"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              data-testid="add-unit-description"
            />
          </Field>
          <button type="submit" hidden aria-hidden tabIndex={-1} />
        </form>

        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={() => onClose(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={isLoading} data-testid="add-unit-submit">
            {isLoading ? "Adding…" : "Add unit"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
