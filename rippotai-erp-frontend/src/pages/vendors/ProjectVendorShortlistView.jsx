import { useCallback, useEffect, useRef, useState } from "react";

import {
  useGetProjectShortlistGridQuery,
  useUpdateShortlistEntryMutation,
  useSelectShortlistEntryMutation,
  useUpdateProjectShortlistMutation,
  useLazyExportProjectShortlistQuery,
  useCreateShortlistEntryMutation,
} from "../../api/vendors/vendor-shortlist.api";

import { useGetVendorsQuery } from "../../api/vendors/vendor.api";
import { useGetMaterialsQuery } from "../../api/procuerment/material-master.api";

/**
 * ============================================================
 * HELPERS
 * ============================================================
 */

function formatMoney(value, currency = "INR") {
  if (value == null || value === "") return "—";

  const num = Number(value);

  if (Number.isNaN(num)) return "—";

  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(num);
  } catch {
    return num.toLocaleString("en-IN");
  }
}

function normalizeVendors(response) {
  if (Array.isArray(response)) {
    return response;
  }

  if (Array.isArray(response?.data)) {
    return response.data;
  }

  if (Array.isArray(response?.data?.data)) {
    return response.data.data;
  }

  if (Array.isArray(response?.vendors)) {
    return response.vendors;
  }

  return [];
}

function getVendorName(vendor) {
  return (
    vendor?.name ||
    vendor?.vendor_name ||
    vendor?.company_name ||
    vendor?.business_name ||
    vendor?.display_name ||
    "Unnamed Vendor"
  );
}

function getVendorId(vendor) {
  return vendor?.id || vendor?.vendor_id;
}

/**
 * ============================================================
 * INLINE MONEY CELL
 * ============================================================
 */

function EditableMoneyCell({
  value,
  onSave,
  disabled = false,
  currency = "INR",
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? "");
  const committingRef = useRef(false);

  const startEdit = useCallback(() => {
    if (disabled) return;

    setDraft(value ?? "");
    setEditing(true);
  }, [disabled, value]);

  const cancel = useCallback(() => {
    if (committingRef.current) return;

    setDraft(value ?? "");
    setEditing(false);
  }, [value]);

  const commit = useCallback(async () => {
    if (committingRef.current) return;

    committingRef.current = true;

    const raw =
      draft === "" || draft == null
        ? null
        : Number(String(draft).replace(/,/g, ""));

    const parsed = raw == null || Number.isNaN(raw) ? null : raw;

    setEditing(false);

    const current = value === "" || value == null ? null : Number(value);

    if (parsed !== current) {
      try {
        await onSave(parsed);
      } finally {
        committingRef.current = false;
      }
    } else {
      committingRef.current = false;
    }
  }, [draft, onSave, value]);

  if (editing) {
    return (
      <input
        type="number"
        inputMode="decimal"
        step="0.01"
        className="bc-input !py-1.5 !px-2 text-right tabular-nums w-full min-w-[110px]"
        value={draft ?? ""}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            commit();
          }

          if (event.key === "Escape") {
            event.preventDefault();
            cancel();
          }
        }}
        autoFocus
      />
    );
  }

  return (
    <button
      type="button"
      className={[
        "w-full text-right tabular-nums",
        "px-2 py-1.5 rounded-md transition-colors",
        disabled
          ? "cursor-not-allowed text-[var(--muted)]"
          : "hover:bg-[var(--mist-soft)] cursor-text",
      ].join(" ")}
      onClick={startEdit}
      disabled={disabled}
      title={disabled ? "This row cannot be edited" : "Click to edit"}
    >
      {formatMoney(value, currency)}
    </button>
  );
}

/**
 * ============================================================
 * VENDOR SELECTOR CELL
 * ============================================================
 */

function VendorSelectCell({
  value,
  onSave,
  disabled = false,
  placeholder = "Select vendor",
  isMaterial = false,
}) {
  const [editing, setEditing] = useState(false);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);

  const inputRef = useRef(null);

  const { data: vendorsResponse, isFetching: isSearching } = useGetVendorsQuery(
    {
      q: search.trim() || undefined,
    },
    {
      skip: !editing || isMaterial,
    },
  );

  const { data: materialsResponse, isFetching: isSearchingMaterials } = useGetMaterialsQuery(
    { search: search.trim() || undefined, isActive: true },
    { skip: !editing || !isMaterial },
  );
  const vendors = normalizeVendors(isMaterial ? materialsResponse : vendorsResponse);
  const searching = isMaterial ? isSearchingMaterials : isSearching;

  useEffect(() => {
    if (editing) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 0);

      return () => clearTimeout(timer);
    }
  }, [editing]);

  const startEdit = useCallback(() => {
    if (disabled) return;

    setSearch(value || "");
    setEditing(true);
  }, [disabled, value]);

  const close = useCallback(() => {
    if (saving) return;

    setEditing(false);
    setSearch("");
  }, [saving]);

  const selectVendor = useCallback(
    async (vendor) => {
      const id = getVendorId(vendor);

      if (!id) {
        console.error("Vendor does not have an id", vendor);
        return;
      }

      const name = getVendorName(vendor);

      setSaving(true);

      try {
        const saved = await onSave({
          ...(isMaterial ? { material_id: id } : { vendor_id: id }),
          name_of_vendor: name,
          vendor,
        });

        if (saved) {
          setEditing(false);
          setSearch("");
        }
      } finally {
        setSaving(false);
      }
    },
    [onSave, isMaterial],
  );

  if (editing) {
    return (
      <div className="relative min-w-[240px]">
        <input
          ref={inputRef}
          type="text"
          className="bc-input !py-1.5 !px-2 w-full"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.preventDefault();
              close();
            }
          }}
          placeholder={isMaterial ? "Search materials..." : "Search vendors..."}
          autoComplete="off"
        />

        <div
          className={[
            "absolute z-50 left-0 right-0 mt-1",
            "bg-white border border-[var(--stroke)]",
            "rounded-lg shadow-lg overflow-hidden",
            "max-h-64 overflow-y-auto",
          ].join(" ")}
        >
          {searching ? (
            <div className="px-3 py-3 text-sm text-[var(--muted)]">
              Searching…
            </div>
          ) : vendors.length === 0 ? (
            <div className="px-3 py-3 text-sm text-[var(--muted)]">
              No matches found.
            </div>
          ) : (
            vendors.map((vendor) => {
              const id = getVendorId(vendor);
              const name = getVendorName(vendor);

              return (
                <button
                  key={id}
                  type="button"
                  className={[
                    "w-full text-left px-3 py-2.5",
                    "hover:bg-[var(--mist-soft)]",
                    "border-b border-[var(--stroke)] last:border-b-0",
                    "transition-colors",
                  ].join(" ")}
                  onMouseDown={(event) => {
                    event.preventDefault();
                  }}
                  onClick={() => selectVendor(vendor)}
                  disabled={saving}
                >
                  <div className="font-medium text-sm text-[var(--ink-green)]">
                    {name}
                  </div>

                  {vendor?.email && (
                    <div className="text-xs text-[var(--muted)] mt-0.5">
                      {vendor.email}
                    </div>
                  )}

                  {vendor?.phone && (
                    <div className="text-xs text-[var(--muted)]">
                      {vendor.phone}
                    </div>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      className={[
        "w-full text-left px-2 py-1.5",
        "rounded-md truncate transition-colors",
        disabled
          ? "cursor-not-allowed text-[var(--muted)]"
          : "hover:bg-[var(--mist-soft)] cursor-pointer",
        !value ? "text-[var(--muted)] italic" : "",
      ].join(" ")}
      onClick={startEdit}
      disabled={disabled}
      title={disabled ? "This row cannot be edited" : value || placeholder}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="truncate">{value || placeholder}</span>

        {!disabled && (
          <svg
            className="w-3.5 h-3.5 shrink-0 text-[var(--muted)]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        )}
      </div>
    </button>
  );
}

/**
 * ============================================================
 * MAIN COMPONENT
 * ============================================================
 */

export default function ProjectVendorShortlistView({
  shortlistId,
  onBack,
  title: titleProp,
  readOnly = false,
}) {
  const {
    data: gridData,
    isLoading,
    isError,
    refetch,
  } = useGetProjectShortlistGridQuery(shortlistId, {
    skip: !shortlistId,
  });

  const [updateEntry, { isLoading: isUpdating }] =
    useUpdateShortlistEntryMutation();

  const [createEntry] = useCreateShortlistEntryMutation();
  const [saveMessage, setSaveMessage] = useState("");

  const [selectEntry] = useSelectShortlistEntryMutation();

  const [updateShortlist] = useUpdateProjectShortlistMutation();

  const [triggerExport, { isFetching: isExporting }] =
    useLazyExportProjectShortlistQuery();

  const isLocked = Boolean(gridData?.is_locked) || readOnly;

  /**
   * ==========================================================
   * ENSURE ENTRY EXISTS (create on first edit)
   * ==========================================================
   */
  const ensureEntryId = useCallback(
    async (blockTrade, row) => {
      if (row.entry_id) return row.entry_id;
      if (isLocked) return null;

      try {
        const created = await createEntry({
          project_shortlist_id: shortlistId,
          trade: blockTrade,
          working_type: row.working_type,
          currency: row.currency || "INR",
          status: "DRAFT",
        }).unwrap();

        // Force grid refresh so the new entry_id appears
        await refetch();

        return created.id;
      } catch (err) {
        console.error("Failed to create shortlist entry", err);
        alert(
          err?.data?.message ||
            err?.error ||
            "Failed to create shortlist entry",
        );
        return null;
      }
    },
    [createEntry, isLocked, shortlistId, refetch],
  );

  /**
   * ==========================================================
   * UPDATE ENTRY (creates first if needed)
   * ==========================================================
   */
  const handleUpdateField = useCallback(
    async (blockTrade, row, patch) => {
      if (isLocked) return;
      setSaveMessage("");

      let entryId = row.entry_id;

      if (!entryId) {
        entryId = await ensureEntryId(blockTrade, row);
        if (!entryId) return;
      }

      try {
        const saved = await updateEntry({
          id: entryId,
          ...patch,
        }).unwrap();

        setSaveMessage("Changes saved.");
        await refetch();
        return saved;
      } catch (err) {
        console.error("Update entry failed", err);
        alert(
          err?.data?.message ||
            err?.error ||
            "Failed to update shortlist entry",
        );
      }
    },
    [isLocked, ensureEntryId, updateEntry, refetch],
  );

  /**
   * ==========================================================
   * VENDOR UPDATE
   * ==========================================================
   */
  const handleVendorSave = useCallback(
    async (blockTrade, row, selection) => {
      if (isLocked) return;

      return handleUpdateField(blockTrade, row, {
        ...(gridData?.shortlist_type === "MATERIAL"
          ? { material_id: selection.material_id }
          : { vendor_id: selection.vendor_id }),
        name_of_vendor: selection.name_of_vendor,
      });
    },
    [handleUpdateField, isLocked, gridData?.shortlist_type],
  );

  /**
   * ==========================================================
   * SELECT ENTRY
   * ==========================================================
   */
  const handleSelect = useCallback(
    async (blockTrade, row) => {
      if (isLocked) return;

      let entryId = row.entry_id;

      if (!entryId) {
        entryId = await ensureEntryId(blockTrade, row);
        if (!entryId) return;
      }

      try {
        await selectEntry(entryId).unwrap();
        await refetch();
      } catch (err) {
        console.error("Select failed", err);
        alert(err?.data?.message || "Failed to select shortlist entry");
      }
    },
    [isLocked, ensureEntryId, selectEntry, refetch],
  );

  /**
   * ==========================================================
   * LOCK / UNLOCK
   * ==========================================================
   */
  const handleToggleLock = async () => {
    if (!gridData?.id || readOnly) return;

    try {
      await updateShortlist({
        id: gridData.id,
        is_locked: !gridData.is_locked,
      }).unwrap();

      await refetch();
    } catch (err) {
      console.error("Lock update failed", err);
      alert(err?.data?.message || "Failed to update shortlist lock");
    }
  };

  /**
   * ==========================================================
   * EXPORT
   * ==========================================================
   */
  const handleExport = async () => {
    if (!shortlistId) return;

    try {
      const blob = await triggerExport(shortlistId).unwrap();

      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `${
        gridData?.shortlist_type || "SHORTLIST"
      }_${shortlistId}.xlsx`;

      document.body.appendChild(a);
      a.click();
      a.remove();

      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export failed", err);
      alert("Export failed");
    }
  };

  const typeLabel =
    gridData?.shortlist_type === "MATERIAL" ? "Material" : "Vendor";

  /**
   * ==========================================================
   * STATES
   * ==========================================================
   */

  if (!shortlistId) {
    return (
      <div className="bc-empty-state text-center py-16">
        <p className="text-[var(--muted)]">No shortlist selected.</p>
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

  if (isError || !gridData) {
    return (
      <div className="bc-empty-state text-center py-16">
        <p className="text-red-600 mb-3">Failed to load shortlist grid.</p>

        <button type="button" className="bc-btn-secondary" onClick={refetch}>
          Retry
        </button>
      </div>
    );
  }

  /**
   * ==========================================================
   * RENDER
   * ==========================================================
   */

  return (
    <div className="space-y-5">
      {/* ======================================================
          TOOLBAR
      ======================================================= */}

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex items-start gap-3">
          {onBack && (
            <button
              type="button"
              className="bc-btn-secondary !min-h-[36px] !px-3 shrink-0 mt-0.5"
              onClick={onBack}
            >
              ← Back
            </button>
          )}

          <div className="min-w-0">
            <p className="eyebrow mb-0.5">{typeLabel} Shortlist</p>

            <h2 className="text-xl font-semibold text-[var(--ink-green)] truncate">
              {titleProp || gridData.title || `${typeLabel} Shortlist`}
            </h2>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {gridData.is_locked && (
            <span className="bc-badge bg-amber-100 text-amber-800">Locked</span>
          )}

          <button
            type="button"
            className="bc-btn-secondary"
            onClick={handleExport}
            disabled={isExporting}
          >
            {isExporting ? "Exporting…" : "Download Excel"}
          </button>

          {!readOnly && (
            <button
              type="button"
              className="bc-btn-secondary"
              onClick={handleToggleLock}
            >
              {gridData.is_locked ? "Unlock" : "Lock"}
            </button>
          )}
        </div>
      </div>

      {/* ======================================================
          GRID
      ======================================================= */}

      <div className="table-container bc-card !p-0 overflow-hidden">
        <div className="bc-table-scroll">
          <table className="bc-table w-full">
            <thead>
              <tr className="bg-[var(--mist-soft)]">
                <th className="px-3 py-3 w-14 nowrap">S.No</th>
                <th className="px-3 py-3 w-28 nowrap">Trade</th>
                <th className="px-3 py-3 w-28 nowrap">Working Type</th>
                <th className="px-3 py-3 min-w-[240px]">Name of {typeLabel}</th>
                <th className="px-3 py-3 w-32 num">Estimate</th>
                <th className="px-3 py-3 w-32 num">Quotation</th>
                <th className="px-3 py-3 w-24 actions text-center">Selected</th>
              </tr>
            </thead>

            <tbody>
              {(gridData.grid || []).map((block) =>
                (block.rows || []).map((row, rowIdx) => {
                  const isFirst = rowIdx === 0;

                  const rowKey = [
                    block.trade,
                    row.working_type,
                    row.entry_id || rowIdx,
                  ].join("-");

                  // Now editable even when entry_id is missing
                  const canEditRow = !isLocked;

                  return (
                    <tr
                      key={rowKey}
                      className={[
                        "border-t border-[var(--stroke)]",
                        row.is_selected
                          ? "bg-[rgba(31,69,59,0.06)]"
                          : "hover:bg-[var(--mist-soft)]/60",
                      ].join(" ")}
                    >
                      {/* S.NO + TRADE */}
                      {isFirst ? (
                        <>
                          <td
                            className="px-3 py-2 font-semibold text-[var(--ink-green)] align-top"
                            rowSpan={block.rows.length}
                          >
                            {block.s_no}
                          </td>

                          <td
                            className="px-3 py-2 font-medium text-[var(--ink-green)] align-top"
                            rowSpan={block.rows.length}
                          >
                            {block.trade}
                          </td>
                        </>
                      ) : null}

                      {/* WORKING TYPE */}
                      <td className="px-3 py-1.5 text-[var(--muted)] nowrap">
                        {row.working_type}
                      </td>

                      {/* VENDOR / MATERIAL */}
                      <td className="px-1 py-1 min-w-0">
                        <VendorSelectCell
                          value={row.name_of_vendor}
                          isMaterial={gridData?.shortlist_type === "MATERIAL"}
                          disabled={!canEditRow}
                          placeholder={`Select ${typeLabel.toLowerCase()}`}
                          onSave={(selection) =>
                            handleVendorSave(block.trade, row, selection)
                          }
                        />
                      </td>

                      {/* ESTIMATE */}
                      <td className="px-1 py-1 num">
                        <EditableMoneyCell
                          value={row.estimate_value}
                          currency={row.currency}
                          disabled={!canEditRow}
                          onSave={(value) =>
                            handleUpdateField(block.trade, row, {
                              estimate_value: value,
                            })
                          }
                        />
                      </td>

                      {/* QUOTATION */}
                      <td className="px-1 py-1 num">
                        <EditableMoneyCell
                          value={row.quotation_value}
                          currency={row.currency}
                          disabled={!canEditRow}
                          onSave={(value) =>
                            handleUpdateField(block.trade, row, {
                              quotation_value: value,
                            })
                          }
                        />
                      </td>

                      {/* SELECTED */}
                      <td className="px-3 py-1.5 text-center">
                        <button
                          type="button"
                          className={[
                            "inline-flex h-7 w-7",
                            "items-center justify-center",
                            "rounded-full border",
                            "transition-colors",
                            row.is_selected
                              ? "bg-[var(--ink-green)] border-[var(--ink-green)] text-white"
                              : "border-[var(--stroke)] text-[var(--muted)] hover:border-[var(--ink-green)]",
                            isLocked ? "opacity-60 cursor-not-allowed" : "",
                          ].join(" ")}
                          onClick={() => handleSelect(block.trade, row)}
                          disabled={isLocked}
                          title={
                            row.is_selected
                              ? "Selected for this trade"
                              : "Mark as selected"
                          }
                          aria-label="Select"
                        >
                          {row.is_selected ? (
                            <svg
                              className="w-3.5 h-3.5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={3}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M4.5 12.75l6 6 9-13.5"
                              />
                            </svg>
                          ) : (
                            <span className="w-2 h-2 rounded-full bg-current opacity-30" />
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                }),
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ======================================================
          SAVE INDICATOR
      ======================================================= */}
      {(isUpdating || saveMessage) && (
        <p role="status" className="text-sm text-[var(--muted)] text-right">
          {isUpdating ? "Saving…" : saveMessage}
        </p>
      )}
    </div>
  );
}
