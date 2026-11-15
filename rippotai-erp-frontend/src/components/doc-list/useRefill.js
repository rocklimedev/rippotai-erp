// Refill: opening "create" for a project that already has this document
// opens the saved one (edit) with every detail filled; saving it creates the
// next version (the backend keeps the previous one as a revision).
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useLazyGetDocExistingQuery } from "@/api/doc-flow/doc-flow.api";

/**
 * type      – document type key (doc-flow registry)
 * projectId – project selected in the create form (or from ?projectId)
 * editPath  – (id) => route of the saved document's edit page
 * enabled   – false in edit mode
 */
export function useRefill({ type, projectId, editPath, enabled = true, label }) {
  const [find] = useLazyGetDocExistingQuery();
  const checked = useRef(null);
  const pathRef = useRef(editPath);
  useEffect(() => {
    pathRef.current = editPath;
  });
  useEffect(() => {
    if (!enabled || !projectId || !type || checked.current === projectId) return;
    checked.current = projectId;
    find({ type, projectId })
      .unwrap()
      .then((r) => {
        if (!r?.id) return;
        toast.info(`Opened the saved ${label || "document"} for this project. Saving creates a new version.`);
        // Full navigation so the form mounts fresh in edit mode with the saved data.
        window.location.replace(pathRef.current(r.id));
      })
      .catch(() => {});
  }, [type, projectId, enabled, find, label]);
}
