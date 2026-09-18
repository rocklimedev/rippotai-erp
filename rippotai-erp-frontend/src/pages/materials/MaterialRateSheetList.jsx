import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Eye,
  Edit3,
  Package,
  Search,
  Users,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Shell } from "../../hooks/shared";
import { useGetMaterialsQuery } from "../../api/procuerment/material-master.api";

export default function MaterialMasterList() {
  const nav = useNavigate();

  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [isActive, setIsActive] = useState("");
  const [expandedMaterial, setExpandedMaterial] = useState(null);

  const {
    data: rows = [],
    isLoading,
    isFetching,
  } = useGetMaterialsQuery({
    search: q || undefined,
    category: category || undefined,
    ...(isActive !== ""
      ? {
          isActive: isActive === "true",
        }
      : {}),
  });

  // ============================================================
  // HELPERS
  // ============================================================

  const getActiveVendors = (material) => {
    if (!Array.isArray(material?.vendors)) {
      return [];
    }

    return material.vendors.filter((item) => item?.is_active !== false);
  };

  const getPreferredVendor = (material) => {
    const vendors = getActiveVendors(material);

    return (
      vendors.find((item) => item?.is_preferred === true) || vendors[0] || null
    );
  };

  const getVendorName = (materialVendor) => {
    return (
      materialVendor?.vendor?.company_name ||
      materialVendor?.vendor?.name ||
      materialVendor?.vendorName ||
      materialVendor?.vendor_name ||
      "Unknown Vendor"
    );
  };

  const getVendorPrice = (materialVendor) => {
    if (
      materialVendor?.price === null ||
      materialVendor?.price === undefined ||
      materialVendor?.price === ""
    ) {
      return null;
    }

    const price = Number(materialVendor.price);

    return Number.isFinite(price) ? price : null;
  };

  const formatPrice = (price) => {
    if (price === null || price === undefined) {
      return "—";
    }

    return `₹${Number(price).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  // ============================================================
  // FILTERING
  // ============================================================

  const filteredRows = useMemo(() => {
    const term = q.trim().toLowerCase();

    if (!term) return rows;

    return rows.filter((r) => {
      const materialCode = String(r.material_code || "").toLowerCase();

      const name = String(r.name || "").toLowerCase();

      const brand = String(r.brand || "").toLowerCase();

      const model = String(r.model || "").toLowerCase();

      const categoryValue = String(r.category || "").toLowerCase();

      const vendorText = Array.isArray(r.vendors)
        ? r.vendors
            .map((item) =>
              [
                item?.vendor?.name,
                item?.vendor?.company_name,
                item?.vendorName,
                item?.vendor_name,
                item?.vendor_material_code,
              ]
                .filter(Boolean)
                .join(" "),
            )
            .join(" ")
            .toLowerCase()
        : "";

      return (
        materialCode.includes(term) ||
        name.includes(term) ||
        brand.includes(term) ||
        model.includes(term) ||
        categoryValue.includes(term) ||
        vendorText.includes(term)
      );
    });
  }, [rows, q]);

  // ============================================================
  // CATEGORY OPTIONS
  // ============================================================

  const categories = useMemo(() => {
    return [...new Set(rows.map((r) => r.category).filter(Boolean))].sort();
  }, [rows]);

  // ============================================================
  // SUMMARY
  // ============================================================

  const totalVendors = useMemo(() => {
    return rows.reduce((total, material) => {
      return total + getActiveVendors(material).length;
    }, 0);
  }, [rows]);

  // ============================================================
  // TOGGLE VENDOR DETAILS
  // ============================================================

  const toggleExpanded = (materialId) => {
    setExpandedMaterial((current) =>
      current === materialId ? null : materialId,
    );
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <Shell
      title="Material Master"
      subtitle={`${rows.length} material${
        rows.length !== 1 ? "s" : ""
      } • ${totalVendors} vendor relationship${totalVendors !== 1 ? "s" : ""}`}
      action={
        <Button onClick={() => nav("/procurement/new")}>
          <Plus className="mr-2 h-4 w-4" />
          New Material
        </Button>
      }
    >
      {/* ======================================================
          FILTERS
      ====================================================== */}

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

          <Input
            placeholder="Search materials, vendors..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select
          value={category || "all"}
          onValueChange={(v) => setCategory(v === "all" ? "" : v)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>

            {categories.map((item) => (
              <SelectItem key={item} value={item}>
                {item}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={isActive || "all"}
          onValueChange={(v) => setIsActive(v === "all" ? "" : v)}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>

            <SelectItem value="true">Active</SelectItem>

            <SelectItem value="false">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* ======================================================
          TABLE
      ====================================================== */}

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Material</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Brand / Model</TableHead>
                  <TableHead>Vendors</TableHead>
                  <TableHead>Preferred Price</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[130px] text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {!isLoading &&
                  filteredRows.map((r) => {
                    const vendors = getActiveVendors(r);
                    const preferredVendor = getPreferredVendor(r);

                    const isExpanded = expandedMaterial === r.id;

                    const preferredVendorName = preferredVendor
                      ? getVendorName(preferredVendor)
                      : null;

                    const preferredPrice = preferredVendor
                      ? getVendorPrice(preferredVendor)
                      : null;

                    return (
                      <React.Fragment key={r.id}>
                        <TableRow
                          onClick={() => nav(`/procurement/${r.id}`)}
                          className="cursor-pointer"
                        >
                          {/* MATERIAL */}
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                                <Package className="h-4 w-4 text-primary" />
                              </div>

                              <div className="min-w-0">
                                <div className="font-semibold text-foreground">
                                  {r.name || "—"}
                                </div>

                                <div className="text-xs text-muted-foreground">
                                  {r.material_code || "—"}
                                </div>
                              </div>
                            </div>
                          </TableCell>

                          {/* CATEGORY */}
                          <TableCell>
                            <div className="font-medium">
                              {r.category || "—"}
                            </div>

                            {r.sub_category && (
                              <div className="text-xs text-muted-foreground">
                                {r.sub_category}
                              </div>
                            )}
                          </TableCell>

                          {/* BRAND / MODEL */}
                          <TableCell className="text-muted-foreground">
                            {r.brand || r.model ? (
                              <div>
                                {r.brand && (
                                  <div className="font-medium text-foreground">
                                    {r.brand}
                                  </div>
                                )}

                                {r.model && (
                                  <div className="text-xs text-muted-foreground">
                                    {r.model}
                                  </div>
                                )}
                              </div>
                            ) : (
                              "—"
                            )}
                          </TableCell>

                          {/* VENDORS */}
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                                <Users className="h-4 w-4 text-primary" />
                              </div>

                              <div>
                                <div className="font-semibold text-foreground">
                                  {vendors.length}{" "}
                                  {vendors.length === 1 ? "Vendor" : "Vendors"}
                                </div>

                                {preferredVendorName ? (
                                  <div className="max-w-[180px] truncate text-xs text-muted-foreground">
                                    Preferred: {preferredVendorName}
                                  </div>
                                ) : (
                                  <div className="text-xs text-muted-foreground">
                                    No vendor
                                  </div>
                                )}
                              </div>
                            </div>
                          </TableCell>

                          {/* PREFERRED PRICE */}
                          <TableCell>
                            {preferredVendor ? (
                              <div>
                                <div className="font-semibold text-foreground">
                                  {formatPrice(preferredPrice)}
                                </div>

                                {preferredVendor.discount_percent !== null &&
                                  preferredVendor.discount_percent !==
                                    undefined && (
                                    <div className="text-xs text-muted-foreground">
                                      {preferredVendor.discount_percent}%
                                      discount
                                    </div>
                                  )}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>

                          {/* UNIT */}
                          <TableCell className="text-muted-foreground">
                            {r?.unit?.name || "—"}
                          </TableCell>

                          {/* STATUS */}
                          <TableCell>
                            <Badge
                              variant={r.is_active ? "default" : "secondary"}
                            >
                              {r.is_active ? "ACTIVE" : "INACTIVE"}
                            </Badge>
                          </TableCell>

                          {/* ACTIONS */}
                          <TableCell
                            className="text-right"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="inline-flex items-center">
                              {vendors.length > 0 && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => toggleExpanded(r.id)}
                                  title={
                                    isExpanded ? "Hide vendors" : "Show vendors"
                                  }
                                >
                                  {isExpanded ? (
                                    <ChevronUp className="h-4 w-4" />
                                  ) : (
                                    <ChevronDown className="h-4 w-4" />
                                  )}
                                </Button>
                              )}

                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => nav(`/procurement/${r.id}`)}
                                title="View material"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>

                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => nav(`/procurement/${r.id}/edit`)}
                                title="Edit material"
                              >
                                <Edit3 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>

                        {/* ==================================================
                            VENDOR DETAILS EXPANDED ROW
                        ================================================== */}

                        {isExpanded && (
                          <TableRow className="bg-muted/30 hover:bg-muted/30">
                            <TableCell colSpan={8} className="p-0">
                              <div className="border-t px-6 py-4">
                                <div className="mb-3 flex items-center justify-between">
                                  <div>
                                    <h4 className="font-semibold text-foreground">
                                      Vendor Pricing
                                    </h4>

                                    <p className="text-xs text-muted-foreground">
                                      Vendor-specific pricing and procurement
                                      information
                                    </p>
                                  </div>

                                  <Badge variant="outline">
                                    {vendors.length}{" "}
                                    {vendors.length === 1
                                      ? "Vendor"
                                      : "Vendors"}
                                  </Badge>
                                </div>

                                {vendors.length > 0 ? (
                                  <div className="overflow-hidden rounded-lg border bg-background">
                                    <Table>
                                      <TableHeader>
                                        <TableRow>
                                          <TableHead>Vendor</TableHead>

                                          <TableHead>Vendor Code</TableHead>

                                          <TableHead>Price</TableHead>

                                          <TableHead>Discount</TableHead>

                                          <TableHead>Lead Time</TableHead>

                                          <TableHead>Status</TableHead>
                                        </TableRow>
                                      </TableHeader>

                                      <TableBody>
                                        {vendors.map((materialVendor) => {
                                          const vendorName =
                                            getVendorName(materialVendor);

                                          const price =
                                            getVendorPrice(materialVendor);

                                          return (
                                            <TableRow
                                              key={
                                                materialVendor.id ||
                                                `${r.id}-${materialVendor.vendor_id}`
                                              }
                                            >
                                              <TableCell>
                                                <div className="flex items-center gap-2">
                                                  <div className="flex h-7 w-7 items-center justify-center rounded-md bg-muted">
                                                    <Users className="h-3.5 w-3.5 text-primary" />
                                                  </div>

                                                  <div>
                                                    <div className="font-medium">
                                                      {vendorName}
                                                    </div>

                                                    {materialVendor.is_preferred && (
                                                      <Badge
                                                        variant="default"
                                                        className="mt-1 text-[10px]"
                                                      >
                                                        PREFERRED
                                                      </Badge>
                                                    )}
                                                  </div>
                                                </div>
                                              </TableCell>

                                              <TableCell className="text-muted-foreground">
                                                {materialVendor.vendor_material_code ||
                                                  "—"}
                                              </TableCell>

                                              <TableCell>
                                                <span className="font-semibold">
                                                  {formatPrice(price)}
                                                </span>
                                              </TableCell>

                                              <TableCell className="text-muted-foreground">
                                                {materialVendor.discount_percent !==
                                                  null &&
                                                materialVendor.discount_percent !==
                                                  undefined
                                                  ? `${materialVendor.discount_percent}%`
                                                  : "—"}
                                              </TableCell>

                                              <TableCell className="text-muted-foreground">
                                                {materialVendor.lead_time_days !==
                                                  null &&
                                                materialVendor.lead_time_days !==
                                                  undefined
                                                  ? `${materialVendor.lead_time_days} days`
                                                  : "—"}
                                              </TableCell>

                                              <TableCell>
                                                <Badge
                                                  variant={
                                                    materialVendor.is_active
                                                      ? "default"
                                                      : "secondary"
                                                  }
                                                >
                                                  {materialVendor.is_active
                                                    ? "ACTIVE"
                                                    : "INACTIVE"}
                                                </Badge>
                                              </TableCell>
                                            </TableRow>
                                          );
                                        })}
                                      </TableBody>
                                    </Table>
                                  </div>
                                ) : (
                                  <div className="rounded-lg border border-dashed p-6 text-center">
                                    <Users className="mx-auto mb-2 h-5 w-5 text-muted-foreground" />

                                    <p className="text-sm font-medium">
                                      No vendors assigned
                                    </p>

                                    <p className="text-xs text-muted-foreground">
                                      Add vendors from the material details
                                      page.
                                    </p>
                                  </div>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    );
                  })}

                {/* ======================================================
                    LOADING
                ====================================================== */}

                {(isLoading || isFetching) && (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="h-24 text-center text-muted-foreground"
                    >
                      Loading materials...
                    </TableCell>
                  </TableRow>
                )}

                {/* ======================================================
                    EMPTY
                ====================================================== */}

                {!isLoading && !isFetching && !filteredRows.length && (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="h-24 text-center text-muted-foreground"
                    >
                      No materials found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </Shell>
  );
}
