import { useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { useGetDocumentPrefillQuery } from "../api/documents/shared-project-data.api";
import { applyDocumentPrefill, FORM_SEQUENCE } from "./document-prefill";

export function useSharedProjectData(
  projectId,
  type,
  values,
  setValues,
  enabled = true,
  materials,
) {
  const inherited = useRef({ projectId, fields: {} });
  const [searchParams, setSearchParams] = useSearchParams();
  useEffect(() => {
    if (!enabled || !projectId) return;
    if (
      searchParams.get("projectId") === projectId &&
      (!searchParams.has("project_id") ||
        searchParams.get("project_id") === projectId)
    )
      return;
    setSearchParams(
      (previous) => {
        if (
          previous.get("projectId") === projectId &&
          (!previous.has("project_id") ||
            previous.get("project_id") === projectId)
        )
          return previous;
        const next = new URLSearchParams(previous);
        next.set("projectId", projectId);
        if (next.has("project_id")) next.set("project_id", projectId);
        return next;
      },
      { replace: true },
    );
  }, [projectId, enabled, searchParams, setSearchParams]);
  const { currentData, error, isFetching } = useGetDocumentPrefillQuery(
    { projectId, sequence: FORM_SEQUENCE[type] },
    {
      skip: !projectId || !enabled,
      refetchOnMountOrArgChange: true,
      refetchOnFocus: true,
    },
  );
  useEffect(() => {
    if (error)
      toast.error("Could not fetch previous document data. Please retry.");
  }, [error]);
  useEffect(() => {
    if (!enabled) return;
    const previous = inherited.current;
    if (previous.projectId !== projectId) {
      inherited.current = { projectId, fields: {} };
      setValues((current) => {
        const next = { ...current };
        for (const [field, entry] of Object.entries(previous.fields)) {
          if (next[field] === entry.value) next[field] = entry.original;
        }
        return next;
      });
      return;
    }
    if (!currentData || currentData.projectId !== projectId) return;
    setValues((current) => {
      const next = applyDocumentPrefill(
        current,
        materials ? { ...currentData, materials } : currentData,
        type,
      );
      for (const field of Object.keys(next)) {
        if (next[field] !== current[field])
          inherited.current.fields[field] = {
            value: next[field],
            original: current[field],
          };
      }
      return next;
    });
  }, [projectId, type, currentData, values, setValues, enabled, materials]);
  return { context: currentData, isFetching, error };
}
