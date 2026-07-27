import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Search,
  Plus,
  Filter,
  Download,
  Upload,
  MapPin,
  ShieldCheck,
  MoreHorizontal,
  Grid2x2,
  Rows3,
  X,
  Bookmark,
  Phone,
  Trash2,
  Edit,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  useGetVendorsQuery,
  useGetVendorsSummaryQuery,
  useGetVendorCategoriesQuery,
  useGetBusinessTypesQuery,
  useGetSavedSearchesQuery,
  useCreateSavedSearchMutation,
  useDeleteSavedSearchMutation,
  useLazyExportVendorsQuery,
  useGetVendorShortlistsQuery,
  useCreateVendorShortlistMutation,
  useAddVendorToShortlistMutation,
  useDeleteVendorMutation,
} from "../../api/vendor.api";
import { useSearchVendorsQuery } from "../../api/search.api";

const STATUS_OPTIONS = ["active", "inactive", "blocked"];

function initialsOf(name = "") {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join("") || "—"
  );
}

function StatusChip({ status }) {
  const map = {
    active: { l: "Active", bg: "#EAEEF0", fg: "#1F453B" },
    inactive: { l: "Inactive", bg: "#B5C4B6", fg: "#6B7B7C" },
    blocked: { l: "Blocked", bg: "#EAEEF0", fg: "#1F453B" },
  };
  const s = map[status] || map.active;
  return (
    <span
      className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap"
      style={{ background: s.bg, color: s.fg }}
    >
      {s.l}
    </span>
  );
}

export function AddToShortlistModal({ open, onClose, vendorId }) {
  const { data: lists = [] } = useGetVendorShortlistsQuery(undefined, {
    skip: !open,
  });
  const [addToShortlist] = useAddVendorToShortlistMutation();
  const [createShortlist] = useCreateVendorShortlistMutation();
  const [newName, setNewName] = useState("");

  const add = async (shortlistId) => {
    try {
      await addToShortlist({
        shortlistId,
        vendor_id: vendorId,
        internal_remarks: "",
      }).unwrap();
      toast.success("Added to shortlist");
      onClose();
    } catch {
      toast.error("Couldn't add to shortlist");
    }
  };

  const create = async () => {
    if (!newName.trim()) return;
    try {
      const list = await createShortlist({ name: newName }).unwrap();
      await add(list.id);
      setNewName("");
    } catch {
      toast.error("Couldn't create shortlist");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add to Shortlist</DialogTitle>
        </DialogHeader>
        <div className="space-y-2 max-h-[300px] overflow-y-auto">
          {lists.map((l) => (
            <button
              key={l.id}
              onClick={() => add(l.id)}
              className="w-full flex items-center justify-between p-3 rounded-lg border border-[#B5C4B6] hover:bg-[#EAEEF0] text-left"
              data-testid={`shortlist-pick-${l.id}`}
            >
              <div>
                <div className="text-[13px] font-semibold text-[#333333]">
                  {l.name}
                </div>
                <div className="text-[11.5px] text-[#B5C4B6]">
                  {l.project_name || "—"} · {l.vendor_count || 0} vendors
                </div>
              </div>
              <Plus size={15} className="text-[#333333]" />
            </button>
          ))}
          {lists.length === 0 && (
            <div className="text-[12.5px] text-[#6B7B7C] py-2">
              No shortlists yet. Create one below.
            </div>
          )}
        </div>
        <div className="flex gap-2 pt-2 border-t border-[#B5C4B6]">
          <input
            className="bc-input"
            placeholder="New shortlist name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            data-testid="new-shortlist-name"
          />
          <button
            onClick={create}
            className="h-10 px-3 rounded-lg bg-[#1F453B] text-white text-[13px] font-semibold"
            data-testid="new-shortlist-create"
          >
            Create
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function VendorsDashboard() {
  const nav = useNavigate();
  const [view, setView] = useState("table");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [f, setF] = useState({
    q: "",
    vendor_category_id: "",
    business_type_id: "",
    status: "",
  });
  const [shortlistFor, setShortlistFor] = useState(null);
  const [saveSearchOpen, setSaveSearchOpen] = useState(false);
  const [newSearchName, setNewSearchName] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // A vendor category/business-type/status filter is active whenever any of
  // those fields are set. When that's the case (or there's no query text at
  // all) we use the regular filtered list endpoint. Plain free-text search
  // with no other filters active goes through the dedicated search index
  // instead, since it searches across name/company/contact fields server-side.
  const hasQuery = f.q.trim().length > 0;
  const hasOtherFilters = Boolean(
    f.vendor_category_id || f.business_type_id || f.status,
  );
  const useSearchIndex = hasQuery && !hasOtherFilters;

  const { data: filteredRows, isFetching: isFetchingFiltered } =
    useGetVendorsQuery(f, { skip: useSearchIndex });

  const { data: searchResults, isFetching: isFetchingSearch } =
    useSearchVendorsQuery(f.q, { skip: !useSearchIndex });

  const rows = useSearchIndex ? searchResults : filteredRows;
  const isFetching = useSearchIndex ? isFetchingSearch : isFetchingFiltered;

  const { data: summary } = useGetVendorsSummaryQuery();
  const { data: categories = [] } = useGetVendorCategoriesQuery();
  const { data: businessTypes = [] } = useGetBusinessTypesQuery(
    f.vendor_category_id,
    { skip: !f.vendor_category_id },
  );
  const { data: savedSearches = [] } = useGetSavedSearchesQuery();

  const [createSavedSearch] = useCreateSavedSearchMutation();
  const [deleteSavedSearch] = useDeleteSavedSearchMutation();
  const [triggerExport] = useLazyExportVendorsQuery();
  const [deleteVendor] = useDeleteVendorMutation();

  const emptyFilters = {
    q: "",
    vendor_category_id: "",
    business_type_id: "",
    status: "",
  };

  const cards = [
    ["total", "Total Vendors"],
    ["active", "Active"],
    ["inactive", "Inactive"],
    ["blocked", "Blocked"],
    ["recently_added", "Recently Added"],
  ];

  const exportCsv = async () => {
    try {
      const blob = await triggerExport("csv").unwrap();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "vendors.csv";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Export failed");
    }
  };

  const applySaved = (s) => setF({ ...emptyFilters, ...s.filters });

  const saveSearch = async () => {
    if (!newSearchName.trim()) return;
    try {
      await createSavedSearch({
        name: newSearchName,
        filters: f,
        scope: "personal",
      }).unwrap();
      setNewSearchName("");
      setSaveSearchOpen(false);
      toast.success("Search saved");
    } catch {
      toast.error("Couldn't save search");
    }
  };

  const removeSaved = async (id) => {
    try {
      await deleteSavedSearch(id).unwrap();
    } catch {
      toast.error("Couldn't delete saved search");
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteVendor(id).unwrap();
      toast.success("Vendor deleted successfully");
      setDeleteConfirm(null);
    } catch {
      toast.error("Failed to delete vendor");
    }
  };

  return (
    <div className="space-y-6" data-testid="vendors-dashboard">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <div className="text-[11px] uppercase tracking-widest text-[#B5C4B6] mb-1.5">
            Vendors
          </div>
          <h1 className="text-[26px] sm:text-[30px] font-bold tracking-tight text-[#333333]">
            Vendor Database
          </h1>
          <p className="text-[13.5px] text-[#6B7B7C] mt-1 max-w-2xl">
            Find contractors, suppliers and service providers by category,
            business type and status.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => nav("/vendors/shortlists")}
            className="h-10 px-4 rounded-xl border border-[#B5C4B6] bg-white hover:bg-[#EAEEF0] text-[13px] font-semibold text-[#6B7B7C] flex items-center gap-2"
            data-testid="shortlists-link"
          >
            <Bookmark size={15} /> Shortlists
          </button>
          <button
            onClick={() => nav("/vendors/new")}
            className="h-10 px-4 rounded-xl bg-[#1F453B] hover:bg-[#1F453B] text-white text-[13px] font-semibold flex items-center gap-2 shadow-sm"
            data-testid="add-vendor-btn"
          >
            <Plus size={15} /> Add Vendor
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <section
        className="grid grid-cols-2 md:grid-cols-5 gap-3"
        data-testid="vendor-summary"
      >
        {cards.map(([k, l]) => (
          <div
            key={k}
            className="bc-card p-4"
            data-testid={`vendor-summary-${k}`}
          >
            <div className="text-[10.5px] uppercase tracking-widest text-[#B5C4B6]">
              {l}
            </div>
            <div className="text-[36px] font-bold text-[#333333] mt-1">
              {summary?.[k] ?? "—"}
            </div>
          </div>
        ))}
      </section>

      {/* Search */}
      <section className="bc-card p-6" data-testid="vendor-discovery">
        <div className="relative">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-[#B5C4B6]"
          />
          <input
            className="bc-input pl-11 h-12 text-[14px]"
            placeholder="Search by vendor name, company or contact person"
            value={f.q}
            onChange={(e) => setF({ ...f, q: e.target.value })}
            data-testid="vendor-search"
          />
        </div>
      </section>

      {/* Saved Searches */}
      {savedSearches.length > 0 && (
        <section
          className="flex flex-wrap items-center gap-2"
          data-testid="saved-searches"
        >
          <span className="text-[11px] uppercase tracking-widest text-[#B5C4B6]">
            Saved:
          </span>
          {savedSearches.map((s) => (
            <div
              key={s.id}
              className="group flex items-center gap-1 px-3 py-1 rounded-full bg-[#EAEEF0] text-[#333333] text-[12px] font-semibold"
              data-testid={`saved-search-${s.id}`}
            >
              <button onClick={() => applySaved(s)}>{s.name}</button>
              <button
                onClick={() => removeSaved(s.id)}
                className="opacity-40 hover:opacity-100"
              >
                <X size={11} />
              </button>
            </div>
          ))}
          <button
            onClick={() => setSaveSearchOpen(true)}
            className="text-[12px] text-[#6B7B7C] hover:text-[#333333]"
            data-testid="save-search-btn"
          >
            + Save current
          </button>
        </section>
      )}

      {/* Filters + Results */}
      <section className="bc-card p-4">
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <button
            onClick={() => setFiltersOpen((o) => !o)}
            className="h-9 px-3 rounded-lg border border-[#B5C4B6] hover:bg-[#EAEEF0] text-[12.5px] font-semibold text-[#6B7B7C] flex items-center gap-1"
            data-testid="filters-toggle"
          >
            <Filter size={13} /> Filters
          </button>

          <select
            className="bc-input h-9 py-0 max-w-[220px]"
            value={f.vendor_category_id}
            onChange={(e) =>
              setF({
                ...f,
                vendor_category_id: e.target.value,
                business_type_id: "",
              })
            }
            data-testid="filter-category"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            className="bc-input h-9 py-0 max-w-[220px] disabled:opacity-50"
            value={f.business_type_id}
            onChange={(e) => setF({ ...f, business_type_id: e.target.value })}
            disabled={!f.vendor_category_id}
            data-testid="filter-business-type"
          >
            <option value="">All Business Types</option>
            {businessTypes.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>

          <select
            className="bc-input h-9 py-0 max-w-[160px]"
            value={f.status}
            onChange={(e) => setF({ ...f, status: e.target.value })}
            data-testid="filter-status"
          >
            <option value="">Any Status</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s[0].toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>

          <button
            className="text-[12px] text-[#6B7B7C] hover:underline"
            onClick={() => setF(emptyFilters)}
          >
            Clear
          </button>

          <div className="ml-auto flex items-center gap-1 bg-[#EAEEF0] rounded-lg p-1">
            <button
              onClick={() => setView("table")}
              className={`p-1.5 rounded ${view === "table" ? "bg-white shadow-sm" : ""}`}
              data-testid="view-table"
            >
              <Rows3 size={14} />
            </button>
            <button
              onClick={() => setView("card")}
              className={`p-1.5 rounded ${view === "card" ? "bg-white shadow-sm" : ""}`}
              data-testid="view-card"
            >
              <Grid2x2 size={14} />
            </button>
          </div>
        </div>

        <div className="text-[12px] text-[#B5C4B6] mb-2">
          {isFetching ? "Loading…" : `Showing ${rows?.length ?? 0} vendors`}
        </div>

        {view === "table" ? (
          <div className="overflow-x-auto -mx-4">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10.5px] uppercase tracking-widest text-[#B5C4B6] border-b border-[#B5C4B6]">
                  <th className="px-4 py-3">Vendor</th>
                  <th className="px-3 py-3">Category</th>
                  <th className="px-3 py-3">Business Type</th>
                  <th className="px-3 py-3">Contact</th>
                  <th className="px-3 py-3">Address</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {(rows || []).map((v) => (
                  <tr
                    key={v.id}
                    className="border-b border-[#B5C4B6] hover:bg-[#EAEEF0] cursor-pointer"
                    onClick={() => nav(`/vendors/${v.id}`)}
                    data-testid={`vendor-row-${v.id}`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-[#1F453B] text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                          {initialsOf(v.name)}
                        </div>
                        <div>
                          <div className="text-[13px] font-semibold text-[#333333] flex items-center gap-1">
                            {v.name}
                            {v.status === "active" && (
                              <ShieldCheck
                                size={12}
                                className="text-[#333333]"
                              />
                            )}
                          </div>
                          <div className="text-[11.5px] text-[#B5C4B6]">
                            {v.company_name}
                            {v.position ? ` · ${v.position}` : ""}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-[12.5px] text-[#6B7B7C]">
                      {v.vendorCategory?.name || "—"}
                    </td>
                    <td className="px-3 py-3 text-[12.5px] text-[#6B7B7C]">
                      {v.businessType?.name || "—"}
                    </td>
                    <td className="px-3 py-3 text-[12.5px] text-[#6B7B7C] whitespace-nowrap">
                      <Phone size={11} className="inline mr-1 text-[#B5C4B6]" />
                      {v.contact_number}
                      {v.alternate_contact && (
                        <div className="text-[11px] text-[#B5C4B6]">
                          {v.alternate_contact}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-3 text-[12px] text-[#6B7B7C] max-w-[220px] truncate">
                      <MapPin
                        size={11}
                        className="inline mr-1 text-[#B5C4B6]"
                      />
                      {v.address || "—"}
                    </td>
                    <td className="px-3 py-3">
                      <StatusChip status={v.status} />
                    </td>
                    <td
                      className="px-3 py-3"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="p-1.5 rounded hover:bg-[#EAEEF0]">
                            <MoreHorizontal size={16} />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => nav(`/vendors/${v.id}`)}
                          >
                            View Profile
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => nav(`/vendors/${v.id}/edit`)}
                          >
                            <Edit size={16} className="mr-2" />
                            Edit Vendor
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setShortlistFor(v.id)}
                            data-testid={`row-shortlist-${v.id}`}
                          >
                            Add to Shortlist
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              nav(`/quotations/new?vendor=${v.id}`)
                            }
                          >
                            Open in Quotations
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setDeleteConfirm(v.id)}
                            className="text-red-600 focus:text-red-600"
                          >
                            <Trash2 size={16} className="mr-2" />
                            Delete Vendor
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {rows && rows.length === 0 && (
              <div className="p-10 text-center text-[13px] text-[#6B7B7C]">
                No vendors match. Adjust filters or{" "}
                <button
                  onClick={() => nav("/vendors/new")}
                  className="text-[#333333] font-semibold"
                >
                  add a vendor
                </button>
                .
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {(rows || []).map((v) => (
              <button
                key={v.id}
                onClick={() => nav(`/vendors/${v.id}`)}
                className="app-card bc-card p-4 text-left"
                data-testid={`vendor-card-${v.id}`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-xl bg-[#1F453B] text-white text-[13px] font-bold flex items-center justify-center shrink-0">
                    {initialsOf(v.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13.5px] font-semibold text-[#333333] flex items-center gap-1">
                      {v.name}
                      {v.status === "active" && (
                        <ShieldCheck size={12} className="text-[#333333]" />
                      )}
                    </div>
                    <div className="text-[11.5px] text-[#B5C4B6] truncate">
                      {v.company_name}
                    </div>
                    <div className="text-[11.5px] text-[#6B7B7C] mt-1">
                      {v.vendorCategory?.name || "—"}
                      {v.businessType?.name ? ` · ${v.businessType.name}` : ""}
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between text-[11.5px]">
                  <span className="text-[#6B7B7C] truncate">
                    {v.address || "—"}
                  </span>
                  <StatusChip status={v.status} />
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Modals */}
      <AddToShortlistModal
        open={!!shortlistFor}
        onClose={() => setShortlistFor(null)}
        vendorId={shortlistFor}
      />

      {/* Delete Confirmation */}
      <Dialog
        open={!!deleteConfirm}
        onOpenChange={() => setDeleteConfirm(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Vendor</DialogTitle>
          </DialogHeader>
          <p className="text-[13.5px] text-[#6B7B7C]">
            Are you sure you want to permanently delete this vendor? This action
            cannot be undone.
          </p>
          <DialogFooter>
            <button
              onClick={() => setDeleteConfirm(null)}
              className="h-10 px-4 rounded-xl border border-[#B5C4B6] text-[#6B7B7C]"
            >
              Cancel
            </button>
            <button
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
              className="h-10 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white"
            >
              Yes, Delete Vendor
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Save Search Dialog */}
      <Dialog open={saveSearchOpen} onOpenChange={setSaveSearchOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Search</DialogTitle>
          </DialogHeader>
          <input
            className="bc-input"
            placeholder="Name (e.g. Premium Painters)"
            value={newSearchName}
            onChange={(e) => setNewSearchName(e.target.value)}
          />
          <DialogFooter>
            <button
              onClick={saveSearch}
              className="h-10 px-4 rounded-xl bg-[#1F453B] text-white text-[13px] font-semibold"
            >
              Save
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
