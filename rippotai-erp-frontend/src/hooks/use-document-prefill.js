import { useEffect, useReducer, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { useGetDocumentPrefillQuery } from "../api/documents/shared-project-data.api";
import { applyDocumentPrefill, FORM_SEQUENCE, SOURCE_LABELS } from "./document-prefill";

export function useSharedProjectData(
  projectId,
  type,
  values,
  setValues,
  enabled = true,
  materials,
) {
  const inherited = useRef({ projectId, fields: {} });
  // { field: { value, source } } this hook filled; drives the "Filled from" hint.
  const [inheritedFields, recordInherited] = useReducer(
    (current, action) => (action === null ? {} : { ...current, ...action }),
    {},
  );
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
      recordInherited(null);
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
    const context = materials ? { ...currentData, materials } : currentData;
    const trace = {};
    const proposed = applyDocumentPrefill(values || {}, context, type, trace);
    // Each field is filled at most once per project, so clearing a value sticks.
    const discovered = {};
    for (const field of Object.keys(proposed))
      if (
        proposed[field] !== values?.[field] &&
        !inherited.current.fields[field]
      )
        discovered[field] = {
          value: proposed[field],
          original: values?.[field],
          source:
            trace[field] ||
            Object.entries(trace).find(([path]) =>
              path.startsWith(`${field}.`),
            )?.[1] ||
            Object.values(trace)[0] ||
            null,
        };
    if (!Object.keys(discovered).length) return;
    Object.assign(inherited.current.fields, discovered);
    recordInherited(discovered);
    setValues((current) => {
      let next = current;
      for (const [field, entry] of Object.entries(discovered)) {
        // Never overwrite something the user typed since this render.
        if (current[field] !== entry.original) continue;
        if (next === current) next = { ...current };
        next[field] = entry.value;
      }
      return next;
    });
  }, [projectId, type, currentData, values, setValues, enabled, materials]);
  // Fields still holding the inherited value (a user edit removes the hint).
  const filled = {};
  for (const [field, entry] of Object.entries(inheritedFields))
    if (values?.[field] === entry.value)
      filled[field] = SOURCE_LABELS[entry.source] || "an earlier document";
  return {
    context: currentData,
    isFetching,
    error,
    filled,
    filledFrom: [...new Set(Object.values(filled))],
  };
}
