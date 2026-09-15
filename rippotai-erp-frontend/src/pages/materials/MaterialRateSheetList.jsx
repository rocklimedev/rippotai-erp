import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Eye, Edit3, Package, Search } from "lucide-react";

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
      const vendorName = String(
        r.vendor?.name ||
          r.vendor?.company_name ||
          r.vendorName ||
          r.vendor_name ||
          "",
      ).toLowerCase();

      return (
        materialCode.includes(term) ||
        name.includes(term) ||
        brand.includes(term) ||
        model.includes(term) ||
        categoryValue.includes(term) ||
        vendorName.includes(term)
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
  // RENDER
  // ============================================================

  return (
    <Shell
      title="Material Master"
      subtitle={`${rows.length} material${rows.length !== 1 ? "s" : ""}`}
      action={
        <Button onClick={() => nav("/materials/new")}>
          <Plus className="mr-2 h-4 w-4" />
          New Material
        </Button>
      }
    >
      {/* FILTERS */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search materials..."
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

      {/* TABLE */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Material</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Brand / Model</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[110px] text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {!isLoading &&
                  filteredRows.map((r) => {
                    const vendorName =
                      r.vendor?.company_name ||
                      r.vendor?.name ||
                      r.vendorName ||
                      r.vendor_name ||
                      "—";

                    return (
                      <TableRow
                        key={r.id}
                        onClick={() => nav(`/materials/${r.id}`)}
                        className="cursor-pointer"
                      >
                        {/* MATERIAL */}
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                              <Package className="h-4 w-4 text-primary" />
                            </div>
                            <div>
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
                          <div className="font-medium">{r.category || "—"}</div>
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

                        {/* VENDOR */}
                        <TableCell>
                          {r.vendor_id ? (
                            <div className="font-medium text-foreground">
                              {vendorName}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">
                              No vendor
                            </span>
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
                          <div className="inline-flex">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => nav(`/materials/${r.id}`)}
                              title="View material"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => nav(`/materials/${r.id}/edit`)}
                              title="Edit material"
                            >
                              <Edit3 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}

                {/* LOADING */}
                {(isLoading || isFetching) && (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="h-24 text-center text-muted-foreground"
                    >
                      Loading materials...
                    </TableCell>
                  </TableRow>
                )}

                {/* EMPTY */}
                {!isLoading && !isFetching && !filteredRows.length && (
                  <TableRow>
                    <TableCell
                      colSpan={7}
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
