import React, { useMemo, useState } from "react";
import {
  useGetProjectShortlistsQuery,
  useCreateProjectShortlistMutation,
  useDeleteProjectShortlistMutation,
  useLazyExportBothProjectShortlistsQuery,
} from "../../api/vendors/vendor-shortlist.api"; // adjust path to your api file

/**
 * ListShortlist
 * Lists all shortlists for a project (VENDOR + MATERIAL).
 * Allows create, open, export-both, delete.
 *
 * Props:
 *  - projectId: string (required)
 *  - projectName?: string
 *  - onOpenShortlist?: (shortlist) => void  // navigate to detail/workspace
 */
export default function ListShortlist({
  projectId,
  projectName,
  onOpenShortlist,
}) {
  const [createType, setCreateType] = useState("VENDOR");

  const {
    data: shortlists = [],
    isLoading,
    isError,
    refetch,
  } = useGetProjectShortlistsQuery(
    { project_id: projectId },
    { skip: !projectId },
  );

  const [createShortlist, { isLoading: isCreating }] =
    useCreateProjectShortlistMutation();
  const [deleteShortlist, { isLoading: isDeleting }] =
    useDeleteProjectShortlistMutation();
  const [triggerExportBoth, { isFetching: isExporting }] =
    useLazyExportBothProjectShortlistsQuery();

  const vendorList = useMemo(
    () => shortlists.find((s) => s.shortlist_type === "VENDOR"),
    [shortlists],
  );
  const materialList = useMemo(
    () => shortlists.find((s) => s.shortlist_type === "MATERIAL"),
    [shortlists],
  );

  const handleCreate = async (type) => {
    if (!projectId) return;
    try {
      const result = await createShortlist({
        project_id: projectId,
        shortlist_type: type,
        title: `${type === "VENDOR" ? "Vendor" : "Material"} Shortlist${
          projectName ? ` – ${projectName}` : ""
        }`,
      }).unwrap();
      if (onOpenShortlist) onOpenShortlist(result);
    } catch (err) {
      console.error("Create shortlist failed", err);
      alert(err?.data?.message || "Failed to create shortlist");
    }
  };

  const handleDelete = async (id, type) => {
    if (!window.confirm(`Delete the ${type} shortlist? This cannot be undone.`))
      return;
    try {
      await deleteShortlist(id).unwrap();
    } catch (err) {
      console.error("Delete failed", err);
      alert(err?.data?.message || "Failed to delete shortlist");
    }
  };

  const handleExportBoth = async () => {
    if (!projectId) return;
    try {
      const blob = await triggerExportBoth(projectId).unwrap();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `SHORTLIST_${projectId}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export failed", err);
      alert("Failed to export shortlists");
    }
  };

  if (!projectId) {
    return (
      <div className="bc-empty-state text-center py-16">
        <p className="text-[var(--muted)]">
          Select a project to view shortlists.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--ink-green)] border-t-transparent" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bc-empty-state text-center py-16">
        <p className="text-red-600 mb-3">Failed to load shortlists.</p>
        <button type="button" className="bc-btn-secondary" onClick={refetch}>
          Retry
        </button>
      </div>
    );
  }

  const cards = [
    {
      type: "VENDOR",
      label: "Vendor Shortlist",
      description: "Contractors, individuals & freelancers by trade",
      data: vendorList,
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.98 5.98 0 00-.34-1.495l-.209-.976a3 3 0 00-2.618-2.34 3 3 0 00-2.618 2.34l-.209.976A5.98 5.98 0 0012 18.72m0 0a5.98 5.98 0 00-.34-1.495M6 18.72a9.094 9.094 0 01-3.741-.479 3 3 0 014.682-2.72m0 0a3 3 0 014.682 2.72M15 7a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      ),
    },
    {
      type: "MATERIAL",
      label: "Material Shortlist",
      description: "Materials & suppliers by trade",
      data: materialList,
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"
          />
        </svg>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="eyebrow mb-1">Project Shortlists</p>
          <h2 className="text-xl font-semibold text-[var(--ink-green)] truncate">
            {projectName || "Shortlists"}
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {(vendorList || materialList) && (
            <button
              type="button"
              className="bc-btn-secondary"
              onClick={handleExportBoth}
              disabled={isExporting}
            >
              {isExporting ? "Exporting…" : "Export Both"}
            </button>
          )}
        </div>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {cards.map((card) => {
          const exists = Boolean(card.data);
          const entryCount = card.data?.entries?.length ?? 0;
          const selectedCount =
            card.data?.entries?.filter((e) => e.is_selected)?.length ?? 0;

          return (
            <div
              key={card.type}
              className="bc-card p-5 flex flex-col gap-4 min-w-0"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-12 bg-[var(--mist-soft)] text-[var(--ink-green)]">
                  {card.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-base font-semibold text-[var(--ink-green)] truncate">
                    {card.label}
                  </h3>
                  <p className="text-sm text-[var(--muted)] mt-0.5 line-clamp-2">
                    {card.description}
                  </p>
                </div>
              </div>

              {exists ? (
                <>
                  <div className="flex flex-wrap gap-2">
                    <span className="bc-chip bg-[var(--mist-soft)] text-[var(--ink-green)]">
                      {entryCount} rows
                    </span>
                    {selectedCount > 0 && (
                      <span className="bc-chip bg-[var(--ink-green)] text-white">
                        {selectedCount} selected
                      </span>
                    )}
                    {card.data.is_locked && (
                      <span className="bc-chip bg-amber-100 text-amber-800">
                        Locked
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 mt-auto pt-1">
                    <button
                      type="button"
                      className="bc-btn-primary flex-1 min-w-[120px]"
                      onClick={() =>
                        onOpenShortlist ? onOpenShortlist(card.data) : undefined
                      }
                    >
                      Open
                    </button>
                    <button
                      type="button"
                      className="bc-btn-secondary"
                      onClick={() => handleDelete(card.data.id, card.type)}
                      disabled={isDeleting || card.data.is_locked}
                      title={
                        card.data.is_locked
                          ? "Unlock before deleting"
                          : "Delete shortlist"
                      }
                    >
                      Delete
                    </button>
                  </div>
                </>
              ) : (
                <div className="mt-auto pt-2">
                  <p className="text-sm text-[var(--muted)] mb-3">
                    No {card.type.toLowerCase()} shortlist yet.
                  </p>
                  <button
                    type="button"
                    className="bc-btn-primary w-full"
                    onClick={() => handleCreate(card.type)}
                    disabled={isCreating}
                  >
                    {isCreating ? "Creating…" : `Create ${card.label}`}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
