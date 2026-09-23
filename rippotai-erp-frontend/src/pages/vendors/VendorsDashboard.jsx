import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Search,
  Plus,
  Filter,
  Download,
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
  Loader2,
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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
} from "../../api/vendors/vendor.api";

import { useSearchVendorsQuery } from "../../api/meta/search.api";

const STATUS_OPTIONS = [
  {
    value: "active",
    label: "Active",
  },
  {
    value: "inactive",
    label: "Inactive",
  },
  {
    value: "blocked",
    label: "Blocked",
  },
];

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
    active: {
      label: "Active",
      className: "border-emerald-200 bg-emerald-50 text-emerald-700",
    },

    inactive: {
      label: "Inactive",
      className: "border-slate-200 bg-slate-100 text-slate-600",
    },

    blocked: {
      label: "Blocked",
      className: "border-red-200 bg-red-50 text-red-700",
    },
  };

  const current = map[status] || map.active;

  return (
    <Badge
      variant="outline"
      className={`whitespace-nowrap text-[11px] font-semibold ${current.className}`}
    >
      {current.label}
    </Badge>
  );
}

export function AddToShortlistModal({ open, onClose, vendorId }) {
  const { data: lists = [], isFetching } = useGetVendorShortlistsQuery(
    undefined,
    {
      skip: !open,
    },
  );

  const [addToShortlist, { isLoading: isAdding }] =
    useAddVendorToShortlistMutation();

  const [createShortlist, { isLoading: isCreating }] =
    useCreateVendorShortlistMutation();

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
    } catch (error) {
      toast.error(
        error?.data?.message || error?.message || "Couldn't add to shortlist",
      );
    }
  };

  const create = async () => {
    if (!newName.trim()) {
      toast.error("Enter a shortlist name");
      return;
    }

    try {
      const list = await createShortlist({
        name: newName.trim(),
      }).unwrap();

      await add(list.id);

      setNewName("");
    } catch (error) {
      toast.error(
        error?.data?.message || error?.message || "Couldn't create shortlist",
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Add to Shortlist</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="max-h-[300px] space-y-2 overflow-y-auto">
            {isFetching && (
              <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading shortlists...
              </div>
            )}

            {!isFetching &&
              lists.map((list) => (
                <button
                  key={list.id}
                  type="button"
                  onClick={() => add(list.id)}
                  disabled={isAdding || isCreating}
                  className="flex w-full items-center justify-between rounded-lg border border-slate-200 p-3 text-left transition-colors hover:bg-slate-50 disabled:pointer-events-none disabled:opacity-50"
                  data-testid={`shortlist-pick-${list.id}`}
                >
                  <div className="min-w-0">
                    <div className="truncate text-[13px] font-semibold text-slate-900">
                      {list.name}
                    </div>

                    <div className="mt-0.5 text-[11.5px] text-muted-foreground">
                      {list.project_name || "—"} · {list.vendor_count || 0}{" "}
                      vendors
                    </div>
                  </div>

                  <Plus className="h-4 w-4 shrink-0 text-slate-500" />
                </button>
              ))}

            {!isFetching && lists.length === 0 && (
              <div className="rounded-lg border border-dashed border-slate-200 py-6 text-center text-[12.5px] text-muted-foreground">
                No shortlists yet. Create one below.
              </div>
            )}
          </div>

          <div className="flex gap-2 border-t pt-4">
            <Input
              placeholder="New shortlist name"
              value={newName}
              onChange={(event) => setNewName(event.target.value)}
              data-testid="new-shortlist-name"
            />

            <Button
              type="button"
              onClick={create}
              disabled={isCreating || isAdding || !newName.trim()}
              className="shrink-0 bg-[#1F453B] hover:bg-[#17382f]"
              data-testid="new-shortlist-create"
            >
              {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create
            </Button>
          </div>
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

  const hasQuery = f.q.trim().length > 0;

  const hasOtherFilters = Boolean(
    f.vendor_category_id || f.business_type_id || f.status,
  );

  const useSearchIndex = hasQuery && !hasOtherFilters;

  const { data: filteredRows, isFetching: isFetchingFiltered } =
    useGetVendorsQuery(f, {
      skip: useSearchIndex,
    });

  const { data: searchResults, isFetching: isFetchingSearch } =
    useSearchVendorsQuery(f.q, {
      skip: !useSearchIndex,
    });

  const rows = useSearchIndex ? searchResults : filteredRows;

  const isFetching = useSearchIndex ? isFetchingSearch : isFetchingFiltered;

  const { data: summary } = useGetVendorsSummaryQuery();

  const { data: categories = [] } = useGetVendorCategoriesQuery();

  const { data: businessTypes = [] } = useGetBusinessTypesQuery(
    f.vendor_category_id,
    {
      skip: !f.vendor_category_id,
    },
  );

  const { data: savedSearches = [] } = useGetSavedSearchesQuery();

  const [createSavedSearch] = useCreateSavedSearchMutation();

  const [deleteSavedSearch] = useDeleteSavedSearchMutation();

  const [triggerExport, { isFetching: isExporting }] =
    useLazyExportVendorsQuery();

  const [deleteVendor, { isLoading: isDeleting }] = useDeleteVendorMutation();

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
      const anchor = document.createElement("a");

      anchor.href = url;
      anchor.download = "vendors.csv";
      anchor.click();

      URL.revokeObjectURL(url);

      toast.success("Vendor export downloaded");
    } catch (error) {
      toast.error(error?.data?.message || error?.message || "Export failed");
    }
  };

  const applySaved = (search) => {
    setF({
      ...emptyFilters,
      ...search.filters,
    });
  };

  const saveSearch = async () => {
    if (!newSearchName.trim()) {
      toast.error("Enter a search name");
      return;
    }

    try {
      await createSavedSearch({
        name: newSearchName.trim(),
        filters: f,
        scope: "personal",
      }).unwrap();

      setNewSearchName("");
      setSaveSearchOpen(false);

      toast.success("Search saved");
    } catch (error) {
      toast.error(
        error?.data?.message || error?.message || "Couldn't save search",
      );
    }
  };

  const removeSaved = async (id) => {
    try {
      await deleteSavedSearch(id).unwrap();

      toast.success("Saved search deleted");
    } catch (error) {
      toast.error(
        error?.data?.message ||
          error?.message ||
          "Couldn't delete saved search",
      );
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteVendor(id).unwrap();

      toast.success("Vendor deleted successfully");

      setDeleteConfirm(null);
    } catch (error) {
      toast.error(
        error?.data?.message || error?.message || "Failed to delete vendor",
      );
    }
  };

  return (
    <div className="space-y-6" data-testid="vendors-dashboard">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="mb-1.5 text-[11px] uppercase tracking-widest text-muted-foreground">
            Vendors
          </div>

          <h1 className="text-[26px] font-bold tracking-tight text-slate-900 sm:text-[30px]">
            Vendor Database
          </h1>

          <p className="mt-1 max-w-2xl text-[13.5px] text-muted-foreground">
            Find contractors, suppliers and service providers by category,
            business type and status.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => nav("/procurement/vendors/shortlists")}
            data-testid="shortlists-link"
          >
            <Bookmark className="mr-2 h-4 w-4" />
            Shortlists
          </Button>

          <Button
            type="button"
            onClick={() => nav("/procurement/vendors/new")}
            className="bg-[#1F453B] hover:bg-[#17382f]"
            data-testid="add-vendor-btn"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Vendor
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <section
        className="grid grid-cols-2 gap-3 md:grid-cols-5"
        data-testid="vendor-summary"
      >
        {cards.map(([key, label]) => (
          <Card
            key={key}
            className="border-slate-200 shadow-none"
            data-testid={`vendor-summary-${key}`}
          >
            <CardContent className="p-4">
              <div className="text-[10.5px] uppercase tracking-widest text-muted-foreground">
                {label}
              </div>

              <div className="mt-1 text-[36px] font-bold text-slate-900">
                {summary?.[key] ?? "—"}
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      {/* Search */}
      <Card
        className="border-slate-200 shadow-none"
        data-testid="vendor-discovery"
      >
        <CardContent className="p-6">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

            <Input
              className="h-12 pl-10 text-[14px]"
              placeholder="Search by vendor name, company or contact person"
              value={f.q}
              onChange={(event) =>
                setF({
                  ...f,
                  q: event.target.value,
                })
              }
              data-testid="vendor-search"
            />
          </div>
        </CardContent>
      </Card>

      {/* Saved Searches */}
      {savedSearches.length > 0 && (
        <section
          className="flex flex-wrap items-center gap-2"
          data-testid="saved-searches"
        >
          <span className="text-[11px] uppercase tracking-widest text-muted-foreground">
            Saved:
          </span>

          {savedSearches.map((search) => (
            <div
              key={search.id}
              className="flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-[12px] font-semibold text-slate-700"
              data-testid={`saved-search-${search.id}`}
            >
              <button
                type="button"
                onClick={() => applySaved(search)}
                className="hover:text-slate-900"
              >
                {search.name}
              </button>

              <button
                type="button"
                onClick={() => removeSaved(search.id)}
                className="text-slate-400 transition-colors hover:text-red-600"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setSaveSearchOpen(true)}
            className="text-xs text-muted-foreground"
            data-testid="save-search-btn"
          >
            + Save current
          </Button>
        </section>
      )}

      {/* Filters + Results */}
      <Card className="border-slate-200 shadow-none">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setFiltersOpen((open) => !open)}
              data-testid="filters-toggle"
            >
              <Filter className="mr-2 h-3.5 w-3.5" />
              Filters
            </Button>

            <Select
              value={f.vendor_category_id || "all"}
              onValueChange={(value) =>
                setF({
                  ...f,
                  vendor_category_id: value === "all" ? "" : value,
                  business_type_id: "",
                })
              }
            >
              <SelectTrigger
                className="h-9 w-[200px]"
                data-testid="filter-category"
              >
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>

                {categories.map((category) => (
                  <SelectItem key={category.id} value={String(category.id)}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={f.business_type_id || "all"}
              onValueChange={(value) =>
                setF({
                  ...f,
                  business_type_id: value === "all" ? "" : value,
                })
              }
              disabled={!f.vendor_category_id}
            >
              <SelectTrigger
                className="h-9 w-[200px]"
                data-testid="filter-business-type"
              >
                <SelectValue placeholder="All Business Types" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="all">All Business Types</SelectItem>

                {businessTypes.map((businessType) => (
                  <SelectItem
                    key={businessType.id}
                    value={String(businessType.id)}
                  >
                    {businessType.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={f.status || "all"}
              onValueChange={(value) =>
                setF({
                  ...f,
                  status: value === "all" ? "" : value,
                })
              }
            >
              <SelectTrigger
                className="h-9 w-[150px]"
                data-testid="filter-status"
              >
                <SelectValue placeholder="Any Status" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="all">Any Status</SelectItem>

                {STATUS_OPTIONS.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setF(emptyFilters)}
              className="text-xs text-muted-foreground"
            >
              Clear
            </Button>

            <div className="ml-auto flex items-center gap-1 rounded-lg bg-slate-100 p-1">
              <Button
                type="button"
                variant={view === "table" ? "secondary" : "ghost"}
                size="icon"
                className="h-7 w-7"
                onClick={() => setView("table")}
                data-testid="view-table"
              >
                <Rows3 className="h-4 w-4" />
              </Button>

              <Button
                type="button"
                variant={view === "card" ? "secondary" : "ghost"}
                size="icon"
                className="h-7 w-7"
                onClick={() => setView("card")}
                data-testid="view-card"
              >
                <Grid2x2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {filtersOpen && (
            <div className="mt-3 rounded-lg border border-dashed border-slate-200 bg-slate-50 p-3 text-xs text-muted-foreground">
              Use the category, business type and status controls above to
              narrow the vendor database.
            </div>
          )}
        </CardHeader>

        <CardContent className="pt-0">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="text-xs text-muted-foreground">
              {isFetching
                ? "Loading..."
                : `Showing ${rows?.length ?? 0} vendors`}
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={exportCsv}
              disabled={isExporting}
            >
              {isExporting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              Export CSV
            </Button>
          </div>

          {/* TABLE VIEW */}
          {view === "table" ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Business Type</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {(rows || []).map((vendor) => (
                    <TableRow
                      key={vendor.id}
                      className="cursor-pointer"
                      onClick={() => nav(`/procurement/vendors/${vendor.id}`)}
                      data-testid={`vendor-row-${vendor.id}`}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#1F453B] text-[11px] font-bold text-white">
                            {initialsOf(vendor.name)}
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-1 text-[13px] font-semibold text-slate-900">
                              <span className="truncate">{vendor.name}</span>

                              {vendor.status === "active" && (
                                <ShieldCheck className="h-3 w-3 shrink-0 text-[#1F453B]" />
                              )}
                            </div>

                            <div className="truncate text-[11.5px] text-muted-foreground">
                              {vendor.company_name}
                              {vendor.position ? ` · ${vendor.position}` : ""}
                            </div>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="text-xs text-muted-foreground">
                        {vendor.vendorCategory?.name || "—"}
                      </TableCell>

                      <TableCell className="text-xs text-muted-foreground">
                        {vendor.businessType?.name || "—"}
                      </TableCell>

                      <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                        <Phone className="mr-1 inline h-3 w-3" />

                        {vendor.contact_number || "—"}

                        {vendor.alternate_contact && (
                          <div className="ml-4 text-[11px] text-muted-foreground">
                            {vendor.alternate_contact}
                          </div>
                        )}
                      </TableCell>

                      <TableCell className="max-w-[220px] truncate text-xs text-muted-foreground">
                        <MapPin className="mr-1 inline h-3 w-3" />

                        {vendor.address || "—"}
                      </TableCell>

                      <TableCell>
                        <StatusChip status={vendor.status} />
                      </TableCell>

                      <TableCell onClick={(event) => event.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>

                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onSelect={() =>
                                nav(`/procurement/vendors/${vendor.id}`)
                              }
                            >
                              View Profile
                            </DropdownMenuItem>

                            <DropdownMenuItem
                              onSelect={() =>
                                nav(`/procurement/vendors/${vendor.id}/edit`)
                              }
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Edit Vendor
                            </DropdownMenuItem>

                            <DropdownMenuItem
                              onSelect={() => setShortlistFor(vendor.id)}
                              data-testid={`row-shortlist-${vendor.id}`}
                            >
                              <Bookmark className="mr-2 h-4 w-4" />
                              Add to Shortlist
                            </DropdownMenuItem>

                            <DropdownMenuItem
                              onSelect={() =>
                                nav(`/quotations/new?vendor=${vendor.id}`)
                              }
                            >
                              Open in Quotations
                            </DropdownMenuItem>

                            <DropdownMenuSeparator />

                            <DropdownMenuItem
                              className="text-red-600 focus:text-red-600"
                              onSelect={() => setDeleteConfirm(vendor.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete Vendor
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {!isFetching && rows && rows.length === 0 && (
                <div className="py-12 text-center text-sm text-muted-foreground">
                  No vendors match your filters.
                  <div className="mt-2">
                    <Button
                      type="button"
                      variant="link"
                      onClick={() => nav("/procurement/vendors/new")}
                    >
                      Add a vendor
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* CARD VIEW */
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
              {(rows || []).map((vendor) => (
                <Card
                  key={vendor.id}
                  className="cursor-pointer border-slate-200 shadow-none transition-colors hover:bg-slate-50"
                  onClick={() => nav(`/procurement/vendors/${vendor.id}`)}
                  data-testid={`vendor-card-${vendor.id}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#1F453B] text-[13px] font-bold text-white">
                        {initialsOf(vendor.name)}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1 text-[13.5px] font-semibold text-slate-900">
                          <span className="truncate">{vendor.name}</span>

                          {vendor.status === "active" && (
                            <ShieldCheck className="h-3 w-3 shrink-0 text-[#1F453B]" />
                          )}
                        </div>

                        <div className="truncate text-[11.5px] text-muted-foreground">
                          {vendor.company_name}
                        </div>

                        <div className="mt-1 text-[11.5px] text-muted-foreground">
                          {vendor.vendorCategory?.name || "—"}

                          {vendor.businessType?.name
                            ? ` · ${vendor.businessType.name}`
                            : ""}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between gap-3">
                      <span className="truncate text-[11.5px] text-muted-foreground">
                        {vendor.address || "—"}
                      </span>

                      <StatusChip status={vendor.status} />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add to shortlist */}
      <AddToShortlistModal
        open={Boolean(shortlistFor)}
        onClose={() => setShortlistFor(null)}
        vendorId={shortlistFor}
      />

      {/* Delete Confirmation */}
      <AlertDialog
        open={Boolean(deleteConfirm)}
        onOpenChange={(open) => {
          if (!isDeleting && !open) {
            setDeleteConfirm(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Vendor?</AlertDialogTitle>

            <AlertDialogDescription>
              Are you sure you want to permanently delete this vendor? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>

            <AlertDialogAction
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
              onClick={async (event) => {
                event.preventDefault();

                if (deleteConfirm) {
                  await handleDelete(deleteConfirm);
                }
              }}
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}

              {isDeleting ? "Deleting..." : "Yes, Delete Vendor"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Save Search */}
      <Dialog open={saveSearchOpen} onOpenChange={setSaveSearchOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Save Search</DialogTitle>
          </DialogHeader>

          <Input
            placeholder="Name (e.g. Premium Painters)"
            value={newSearchName}
            onChange={(event) => setNewSearchName(event.target.value)}
          />

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setSaveSearchOpen(false)}
            >
              Cancel
            </Button>

            <Button
              type="button"
              onClick={saveSearch}
              disabled={!newSearchName.trim()}
              className="bg-[#1F453B] hover:bg-[#17382f]"
            >
              Save Search
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
