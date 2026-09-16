import React, { useEffect, useMemo, useState } from "react";
import {
  Calculator,
  ChevronDown,
  ChevronRight,
  Download,
  FileSpreadsheet,
  Package,
  RefreshCw,
  Search,
  Settings2,
  ShoppingCart,
  Trophy,
  Users,
  X,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

import { Shell, Card } from "../../hooks/shared";

import { useGetBoqsQuery, useGetBoqByIdQuery } from "../../api/boq/boq.api";

import { useGetVendorsQuery } from "../../api/vendors/vendor.api";

// ============================================================
// Helpers
// ============================================================

const money = (value) => {
  const n = Number(value || 0);

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(n);
};

const number = (value) => {
  const n = Number(value || 0);

  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 2,
  }).format(n);
};

const percentage = (value) => {
  const n = Number(value || 0);

  return `${n.toFixed(2)}%`;
};

const getId = (item) =>
  item?.id || item?._id || item?.uuid || item?.item_id || item?.category_id;

const getName = (item, fallback = "") =>
  item?.name ||
  item?.title ||
  item?.description ||
  item?.item_description ||
  item?.category_name ||
  fallback;

// ============================================================
// BOQ normalization
// ============================================================

function normalizeBoq(response) {
  if (!response) return null;

  return (
    response?.data?.data ||
    response?.data?.boq ||
    response?.data ||
    response?.boq ||
    response ||
    null
  );
}

function normalizeCategories(boq) {
  if (!boq) return [];

  const categories =
    boq?.categories ||
    boq?.boq_categories ||
    boq?.data?.categories ||
    boq?.data?.boq_categories ||
    [];

  if (!Array.isArray(categories)) return [];

  return categories.map((category, categoryIndex) => {
    const categoryId =
      category?.id ||
      category?._id ||
      category?.category_id ||
      category?.boq_category_id ||
      `category-${categoryIndex}`;

    const categoryName =
      category?.name ||
      category?.category_name ||
      category?.title ||
      `Category ${categoryIndex + 1}`;

    const items =
      category?.items || category?.boq_items || category?.line_items || [];

    return {
      ...category,
      id: categoryId,
      name: categoryName,
      items: Array.isArray(items) ? items : [],
    };
  });
}

// ============================================================
// BOQ item helpers
// ============================================================

const getItemId = (item, categoryId, index) =>
  item?.id ||
  item?._id ||
  item?.uuid ||
  item?.item_id ||
  item?.boq_item_id ||
  `${categoryId}-item-${index}`;

const getItemDescription = (item) =>
  item?.description ||
  item?.item_description ||
  item?.name ||
  item?.item_name ||
  item?.material_name ||
  item?.title ||
  "-";

const getItemSpecification = (item) =>
  item?.specification ||
  item?.spec ||
  item?.make ||
  item?.brand ||
  item?.model ||
  "-";

const getItemUnit = (item) =>
  item?.unit || item?.uom || item?.measurement_unit || "-";

const getItemQty = (item) =>
  Number(
    item?.quantity ??
      item?.qty ??
      item?.estimated_quantity ??
      item?.required_quantity ??
      0,
  );

const getBoqRate = (item) =>
  Number(
    item?.rate ??
      item?.boq_rate ??
      item?.boqRate ??
      item?.unit_rate ??
      item?.estimated_rate ??
      0,
  );

const getBoqAmount = (item) => {
  if (
    item?.amount !== undefined &&
    item?.amount !== null &&
    item?.amount !== ""
  ) {
    return Number(item.amount);
  }

  if (
    item?.total_amount !== undefined &&
    item?.total_amount !== null &&
    item?.total_amount !== ""
  ) {
    return Number(item.total_amount);
  }

  if (
    item?.line_total !== undefined &&
    item?.line_total !== null &&
    item?.line_total !== ""
  ) {
    return Number(item.line_total);
  }

  return getItemQty(item) * getBoqRate(item);
};

// ============================================================
// Vendor helpers
// ============================================================

const getVendorId = (vendor) =>
  vendor?.id || vendor?._id || vendor?.vendor_id || vendor?.uuid;

const getVendorName = (vendor) =>
  vendor?.name ||
  vendor?.company_name ||
  vendor?.business_name ||
  vendor?.vendor_name ||
  "Unnamed Vendor";

// ============================================================
// Main Component
// ============================================================

export default function BoqVendorRateComparison() {
  // ==========================================================
  // BOQ LIST
  // ==========================================================

  const {
    data: boqResponse,
    isLoading: boqLoading,
    refetch: refetchBoqs,
  } = useGetBoqsQuery({});

  const boqs = useMemo(() => {
    if (Array.isArray(boqResponse)) {
      return boqResponse;
    }

    return (
      boqResponse?.data?.items ||
      boqResponse?.data?.boqs ||
      boqResponse?.data ||
      boqResponse?.boqs ||
      boqResponse?.items ||
      []
    );
  }, [boqResponse]);

  const [selectedBoqId, setSelectedBoqId] = useState("");

  const {
    data: boqDetailResponse,
    isLoading: boqDetailLoading,
    refetch: refetchBoq,
  } = useGetBoqByIdQuery(selectedBoqId, {
    skip: !selectedBoqId,
  });

  const boq = useMemo(() => {
    return normalizeBoq(boqDetailResponse);
  }, [boqDetailResponse]);

  // ==========================================================
  // VENDORS
  // ==========================================================

  const { data: vendorResponse, isLoading: vendorsLoading } =
    useGetVendorsQuery({
      status: "ACTIVE",
    });

  const vendors = useMemo(() => {
    if (Array.isArray(vendorResponse)) {
      return vendorResponse;
    }

    return (
      vendorResponse?.data?.items ||
      vendorResponse?.data?.vendors ||
      vendorResponse?.data ||
      vendorResponse?.vendors ||
      vendorResponse?.items ||
      []
    );
  }, [vendorResponse]);

  // ==========================================================
  // STATE
  // ==========================================================

  const [search, setSearch] = useState("");

  const [selectedCategoryId, setSelectedCategoryId] = useState("ALL");

  const [selectedVendorIds, setSelectedVendorIds] = useState([]);

  const [vendorNames, setVendorNames] = useState({});

  const [vendorRates, setVendorRates] = useState({});

  const [expandedCategories, setExpandedCategories] = useState({});

  const [showVendorSettings, setShowVendorSettings] = useState(false);

  // ==========================================================
  // CATEGORIES
  // ==========================================================

  const categories = useMemo(() => {
    return normalizeCategories(boq);
  }, [boq]);

  // ==========================================================
  // AUTO SELECT FIRST BOQ
  // ==========================================================

  useEffect(() => {
    if (!selectedBoqId && boqs.length) {
      const first = boqs[0];

      const id = first?.id || first?._id || first?.boq_id || first?.uuid || "";

      if (id) {
        setSelectedBoqId(id);
      }
    }
  }, [boqs, selectedBoqId]);

  // ==========================================================
  // AUTO EXPAND CATEGORIES
  // ==========================================================

  useEffect(() => {
    if (!categories.length) return;

    setExpandedCategories((previous) => {
      const next = { ...previous };

      categories.forEach((category) => {
        if (next[category.id] === undefined) {
          next[category.id] = true;
        }
      });

      return next;
    });
  }, [categories]);

  // ==========================================================
  // RESET WHEN BOQ CHANGES
  // ==========================================================

  useEffect(() => {
    setVendorRates({});
    setSelectedCategoryId("ALL");
    setSearch("");
  }, [selectedBoqId]);

  // ==========================================================
  // SELECTED VENDORS
  // ==========================================================

  const selectedVendors = useMemo(() => {
    return selectedVendorIds
      .map((id) =>
        vendors.find((vendor) => String(getVendorId(vendor)) === String(id)),
      )
      .filter(Boolean);
  }, [selectedVendorIds, vendors]);

  // ==========================================================
  // VENDOR NAME
  // ==========================================================

  const getComparisonVendorName = (vendor, index) => {
    const id = getVendorId(vendor);

    return vendorNames[id] || getVendorName(vendor) || `Vendor ${index + 1}`;
  };

  // ==========================================================
  // TOGGLE VENDOR
  // ==========================================================

  const toggleVendor = (vendor) => {
    const id = getVendorId(vendor);

    if (!id) return;

    setSelectedVendorIds((previous) => {
      const exists = previous.some((value) => String(value) === String(id));

      if (exists) {
        return previous.filter((value) => String(value) !== String(id));
      }

      if (previous.length >= 4) {
        toast.error("Maximum 4 vendors can be compared.");
        return previous;
      }

      return [...previous, id];
    });

    setVendorNames((previous) => ({
      ...previous,
      [id]: getVendorName(vendor),
    }));
  };

  // ==========================================================
  // RATE KEY
  // ==========================================================

  const getRateKey = (itemId, vendorId) => `${itemId}__${vendorId}`;

  // ==========================================================
  // UPDATE VENDOR RATE
  // ==========================================================

  const updateVendorRate = (itemId, vendorId, value) => {
    const key = getRateKey(itemId, vendorId);

    setVendorRates((previous) => ({
      ...previous,
      [key]: value,
    }));
  };

  // ==========================================================
  // GET VENDOR RATE
  // ==========================================================

  const getVendorRate = (itemId, vendorId) => {
    const key = getRateKey(itemId, vendorId);

    const stored = vendorRates[key];

    if (stored !== undefined && stored !== null && stored !== "") {
      return Number(stored);
    }

    return 0;
  };

  // ==========================================================
  // FLATTEN BOQ CATEGORIES INTO ROWS
  // ==========================================================

  const rows = useMemo(() => {
    const result = [];

    categories.forEach((category) => {
      if (
        selectedCategoryId !== "ALL" &&
        String(category.id) !== String(selectedCategoryId)
      ) {
        return;
      }

      const items = Array.isArray(category.items) ? category.items : [];

      items.forEach((item, index) => {
        const itemId = getItemId(item, category.id, index);

        result.push({
          categoryId: category.id,
          categoryName: category.name,
          category,
          item,
          itemId,
          index,
        });
      });
    });

    return result;
  }, [categories, selectedCategoryId]);

  // ==========================================================
  // SEARCH
  // ==========================================================

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return rows;
    }

    return rows.filter((row) => {
      const searchable = [
        row.categoryName,
        getItemDescription(row.item),
        getItemSpecification(row.item),
        getItemUnit(row.item),
      ]
        .join(" ")
        .toLowerCase();

      return searchable.includes(query);
    });
  }, [rows, search]);

  // ==========================================================
  // CALCULATE ROW
  // ==========================================================

  const calculateRow = (row) => {
    const qty = getItemQty(row.item);

    const boqRate = getBoqRate(row.item);

    const boqAmount = getBoqAmount(row.item);

    const vendorResults = selectedVendors
      .map((vendor, vendorIndex) => {
        const vendorId = getVendorId(vendor);

        const rate = getVendorRate(row.itemId, vendorId);

        const hasQuote = rate > 0;

        const amount = qty * rate;

        return {
          vendor,
          vendorId,
          vendorIndex,
          rate,
          amount,
          hasQuote,
        };
      })
      .filter((result) => result.hasQuote);

    const l1 = vendorResults.length
      ? [...vendorResults].sort((a, b) => a.rate - b.rate)[0]
      : null;

    const varianceAmount = l1 ? l1.amount - boqAmount : 0;

    const variancePercent =
      boqAmount > 0 ? (varianceAmount / boqAmount) * 100 : 0;

    return {
      ...row,
      qty,
      boqRate,
      boqAmount,
      vendorResults,
      l1,
      varianceAmount,
      variancePercent,
    };
  };

  const calculatedRows = useMemo(() => {
    return filteredRows.map(calculateRow);
  }, [filteredRows, selectedVendors, vendorRates]);

  // ==========================================================
  // FULL BOQ ROWS
  //
  // Important:
  // Summary should represent the selected BOQ, not the
  // currently searched/filtered rows.
  // ==========================================================

  const allRows = useMemo(() => {
    const result = [];

    categories.forEach((category) => {
      const items = Array.isArray(category.items) ? category.items : [];

      items.forEach((item, index) => {
        const itemId = getItemId(item, category.id, index);

        result.push({
          categoryId: category.id,
          categoryName: category.name,
          category,
          item,
          itemId,
          index,
        });
      });
    });

    return result.map(calculateRow);
  }, [categories, selectedVendors, vendorRates]);

  // ==========================================================
  // BOQ TOTALS
  // ==========================================================

  const boqProjectTotal = Number(
    boq?.project_total ??
      boq?.projectTotal ??
      allRows.reduce((sum, row) => sum + row.boqAmount, 0),
  );

  const boqMiscAmount = Number(boq?.misc_amount ?? boq?.miscAmount ?? 0);

  const boqFinalTotal = Number(
    boq?.final_total ?? boq?.finalTotal ?? boqProjectTotal + boqMiscAmount,
  );

  const boqMiscPercentage = Number(boq?.misc_pct ?? boq?.miscPct ?? 0);

  // ==========================================================
  // SUMMARY
  // ==========================================================

  const summary = useMemo(() => {
    const boq = allRows.reduce((sum, row) => sum + row.boqAmount, 0);

    const vendorTotals = selectedVendors.map((vendor) => {
      const vendorId = getVendorId(vendor);

      const total = allRows.reduce((sum, row) => {
        const rate = getVendorRate(row.itemId, vendorId);

        return sum + rate * row.qty;
      }, 0);

      const quotedItems = allRows.filter(
        (row) => getVendorRate(row.itemId, vendorId) > 0,
      ).length;

      const variance = total - boq;

      return {
        vendor,
        vendorId,
        total,
        quotedItems,
        variance,
        variancePercent: boq > 0 ? (variance / boq) * 100 : 0,
      };
    });

    const l1Total = allRows.reduce(
      (sum, row) => sum + (row.l1?.amount || 0),
      0,
    );

    const quotedItems = allRows.filter((row) => row.l1).length;

    const pendingItems = allRows.length - quotedItems;

    const l1Variance = l1Total > 0 ? l1Total - boq : 0;

    return {
      boq,
      vendorTotals,
      l1Total,
      quotedItems,
      pendingItems,
      variance: l1Variance,
      variancePercent: boq > 0 ? (l1Variance / boq) * 100 : 0,
    };
  }, [allRows, selectedVendors, vendorRates]);

  // ==========================================================
  // CATEGORY SUMMARIES
  // ==========================================================

  const categorySummaries = useMemo(() => {
    return categories.map((category) => {
      const items = Array.isArray(category.items) ? category.items : [];

      const categoryRows = allRows.filter(
        (row) => String(row.categoryId) === String(category.id),
      );

      const calculatedBoq = categoryRows.reduce(
        (sum, row) => sum + row.boqAmount,
        0,
      );

      const apiSubtotal = Number(
        category?.subtotal ?? category?.total ?? category?.category_total ?? 0,
      );

      const boqTotal = apiSubtotal > 0 ? apiSubtotal : calculatedBoq;

      const l1 = categoryRows.reduce(
        (sum, row) => sum + (row.l1?.amount || 0),
        0,
      );

      return {
        id: category.id,
        name: category.name,
        items: items.length,
        boq: boqTotal,
        calculatedBoq,
        l1,
      };
    });
  }, [categories, allRows]);

  // ==========================================================
  // CATEGORY FILTERED SUMMARY
  // ==========================================================

  const visibleSummary = useMemo(() => {
    const boq = calculatedRows.reduce((sum, row) => sum + row.boqAmount, 0);

    const l1 = calculatedRows.reduce(
      (sum, row) => sum + (row.l1?.amount || 0),
      0,
    );

    const quoted = calculatedRows.filter((row) => row.l1).length;

    return {
      boq,
      l1,
      quoted,
      pending: calculatedRows.length - quoted,
    };
  }, [calculatedRows]);

  // ==========================================================
  // EXPORT
  // ==========================================================

  const exportCsv = () => {
    if (!allRows.length) {
      toast.error("No BOQ items available to export.");

      return;
    }

    const headers = [
      "BOQ Category",
      "S.No",
      "Item Description",
      "Specification / Make",
      "Unit",
      "Qty",
      "BOQ Rate",
      "BOQ Amount",
    ];

    selectedVendors.forEach((vendor, index) => {
      const name = getComparisonVendorName(vendor, index);

      headers.push(`${name} Rate`, `${name} Amount`);
    });

    headers.push("L1 Rate", "L1 Vendor", "L1 Amount", "L1 vs BOQ %");

    const data = allRows.map((row, index) => {
      const values = [
        row.categoryName,
        index + 1,
        getItemDescription(row.item),
        getItemSpecification(row.item),
        getItemUnit(row.item),
        row.qty,
        row.boqRate,
        row.boqAmount,
      ];

      selectedVendors.forEach((vendor) => {
        const vendorId = getVendorId(vendor);

        const rate = getVendorRate(row.itemId, vendorId);

        values.push(rate || "", rate ? rate * row.qty : "");
      });

      values.push(
        row.l1?.rate || "",
        row.l1
          ? getComparisonVendorName(row.l1.vendor, row.l1.vendorIndex)
          : "",
        row.l1?.amount || "",
        row.l1 ? row.variancePercent / 100 : "",
      );

      return values;
    });

    const csv = [headers, ...data]
      .map((row) =>
        row
          .map((value) => {
            const stringValue =
              value === null || value === undefined ? "" : String(value);

            return `"${stringValue.replace(/"/g, '""')}"`;
          })
          .join(","),
      )
      .join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);

    const anchor = document.createElement("a");

    anchor.href = url;

    anchor.download = `BOQ-Vendor-Rate-Comparison-${Date.now()}.csv`;

    document.body.appendChild(anchor);

    anchor.click();

    document.body.removeChild(anchor);

    URL.revokeObjectURL(url);

    toast.success("Vendor comparison exported.");
  };

  // ==========================================================
  // RESET
  // ==========================================================

  const resetRates = () => {
    setVendorRates({});

    toast.success("All vendor rates have been cleared.");
  };

  // ==========================================================
  // REFRESH
  // ==========================================================

  const refresh = async () => {
    try {
      await refetchBoqs();

      if (selectedBoqId) {
        await refetchBoq();
      }

      toast.success("BOQ data refreshed.");
    } catch {
      toast.error("Unable to refresh BOQ data.");
    }
  };

  // ==========================================================
  // TOGGLE CATEGORY
  // ==========================================================

  const toggleCategory = (categoryId) => {
    setExpandedCategories((previous) => ({
      ...previous,
      [categoryId]: !previous[categoryId],
    }));
  };

  // ==========================================================
  // LOADING
  // ==========================================================

  if (boqLoading) {
    return (
      <Shell>
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="flex items-center gap-3 text-gray-500">
            <RefreshCw size={20} className="animate-spin" />
            Loading BOQs...
          </div>
        </div>
      </Shell>
    );
  }

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <Shell>
      <div className="space-y-5 pb-10">
        {/* ================================================== */}
        {/* HEADER */}
        {/* ================================================== */}

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-1 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-gray-500">
              <Calculator size={14} />
              Procurement
              <ChevronRight size={13} />
              BOQ Vendor Calculator
            </div>

            <h1 className="text-2xl font-bold text-[#1F453B]">
              BOQ Vendor Rate Calculator
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Compare vendor quotations against the actual BOQ rate category by
              category.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={refresh}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <RefreshCw size={16} />
              Refresh
            </button>

            <button
              type="button"
              onClick={resetRates}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <X size={16} />
              Clear Rates
            </button>

            <button
              type="button"
              onClick={exportCsv}
              className="inline-flex items-center gap-2 rounded-lg bg-[#1F453B] px-4 py-2 text-sm font-semibold text-white hover:bg-[#17372f]"
            >
              <Download size={16} />
              Export CSV
            </button>
          </div>
        </div>

        {/* ================================================== */}
        {/* BOQ INFORMATION */}
        {/* ================================================== */}

        {boq && (
          <Card>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
              <InfoBox
                label="Project"
                value={
                  boq?.project?.name ||
                  boq?.project_name ||
                  boq?.project?.title ||
                  "—"
                }
              />

              <InfoBox
                label="BOQ"
                value={boq?.title || boq?.name || boq?.boq_name || "—"}
              />

              <InfoBox
                label="Status"
                value={boq?.status ? String(boq.status).toUpperCase() : "—"}
              />

              <InfoBox label="Version" value={boq?.version ?? "—"} />

              <InfoBox label="Categories" value={`${categories.length}`} />
            </div>
          </Card>
        )}

        {/* ================================================== */}
        {/* CONTROLS */}
        {/* ================================================== */}

        <Card>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
            {/* BOQ */}

            <div className="lg:col-span-4">
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                Select BOQ
              </label>

              <div className="relative">
                <select
                  value={selectedBoqId}
                  onChange={(event) => {
                    setSelectedBoqId(event.target.value);
                  }}
                  className="w-full appearance-none rounded-lg border border-gray-200 bg-white px-3 py-2.5 pr-9 text-sm font-medium text-gray-800 outline-none focus:border-[#1F453B]"
                >
                  <option value="">Select BOQ</option>

                  {boqs.map((item) => {
                    const id =
                      item?.id || item?._id || item?.boq_id || item?.uuid;

                    const name =
                      item?.title ||
                      item?.name ||
                      item?.boq_name ||
                      item?.code ||
                      `BOQ ${id}`;

                    return (
                      <option key={id} value={id}>
                        {name}
                      </option>
                    );
                  })}
                </select>

                <ChevronDown
                  size={16}
                  className="pointer-events-none absolute right-3 top-3 text-gray-400"
                />
              </div>
            </div>

            {/* Search */}

            <div className="lg:col-span-4">
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                Search BOQ Items
              </label>

              <div className="relative">
                <Search
                  size={17}
                  className="absolute left-3 top-3 text-gray-400"
                />

                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search category, item, specification..."
                  className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[#1F453B]"
                />
              </div>
            </div>

            {/* Vendors */}

            <div className="lg:col-span-4">
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                Vendor Comparison
              </label>

              <button
                type="button"
                onClick={() => setShowVendorSettings(true)}
                className="flex w-full items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-left hover:border-[#1F453B]"
              >
                <div className="flex items-center gap-2">
                  <Users size={17} className="text-[#1F453B]" />

                  <span className="text-sm font-medium text-gray-700">
                    {selectedVendors.length
                      ? `${selectedVendors.length} vendor${
                          selectedVendors.length > 1 ? "s" : ""
                        } selected`
                      : "Select up to 4 vendors"}
                  </span>
                </div>

                <Settings2 size={17} className="text-gray-400" />
              </button>
            </div>
          </div>
        </Card>

        {/* ================================================== */}
        {/* BOQ TOTAL SUMMARY */}
        {/* ================================================== */}

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
          <SummaryCard
            icon={<FileSpreadsheet size={18} />}
            label="BOQ Project Total"
            value={money(boqProjectTotal)}
          />

          <SummaryCard
            icon={<Calculator size={18} />}
            label="BOQ Final Total"
            value={money(boqFinalTotal)}
          />

          <SummaryCard
            icon={<Package size={18} />}
            label="Additional Misc"
            value={money(boqMiscAmount)}
          />

          <SummaryCard
            icon={<ShoppingCart size={18} />}
            label="BOQ Items"
            value={allRows.length}
          />

          <SummaryCard
            icon={<Users size={18} />}
            label="Quoted Items"
            value={`${summary.quotedItems}/${allRows.length}`}
          />

          <SummaryCard
            icon={<Trophy size={18} />}
            label="L1 Total"
            value={summary.l1Total ? money(summary.l1Total) : "—"}
          />
        </div>

        {/* ================================================== */}
        {/* MISC INFO */}
        {/* ================================================== */}

        {boqMiscAmount > 0 && (
          <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
            <AlertCircle size={18} className="mt-0.5 shrink-0 text-amber-600" />

            <div>
              <div className="text-sm font-semibold text-amber-900">
                Additional Miscellaneous
              </div>

              <div className="mt-0.5 text-xs text-amber-700">
                BOQ contains an additional miscellaneous amount of{" "}
                <strong>{money(boqMiscAmount)}</strong>
                {boqMiscPercentage
                  ? ` with misc % field ${boqMiscPercentage}%`
                  : ""}
                . The calculator preserves the API-provided amount and does not
                recalculate it from the percentage.
              </div>
            </div>
          </div>
        )}

        {/* ================================================== */}
        {/* VENDOR SUMMARY */}
        {/* ================================================== */}

        {selectedVendors.length > 0 && (
          <Card>
            <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="font-semibold text-gray-900">
                  Vendor Commercial Summary
                </h2>

                <p className="text-xs text-gray-500">
                  Vendor totals are calculated from all BOQ categories and
                  entered vendor rates.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <StatBadge
                  label="Quoted"
                  value={`${summary.quotedItems}/${allRows.length}`}
                />

                <StatBadge label="Pending" value={summary.pendingItems} />

                <StatBadge
                  label="L1"
                  value={summary.l1Total ? money(summary.l1Total) : "—"}
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-left">
                    <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                      Metric
                    </th>

                    <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">
                      BOQ
                    </th>

                    {selectedVendors.map((vendor, index) => (
                      <th
                        key={getVendorId(vendor)}
                        className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-[#1F453B]"
                      >
                        {getComparisonVendorName(vendor, index)}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  <tr className="border-b border-gray-50">
                    <td className="px-3 py-3 font-semibold text-gray-700">
                      Total
                    </td>

                    <td className="px-3 py-3 text-right font-semibold">
                      {money(boqProjectTotal)}
                    </td>

                    {summary.vendorTotals.map((vendor) => (
                      <td
                        key={vendor.vendorId}
                        className="px-3 py-3 text-right font-semibold"
                      >
                        {vendor.total ? money(vendor.total) : "—"}
                      </td>
                    ))}
                  </tr>

                  <tr className="border-b border-gray-50">
                    <td className="px-3 py-3 text-gray-500">Variance vs BOQ</td>

                    <td className="px-3 py-3 text-right">—</td>

                    {summary.vendorTotals.map((vendor) => (
                      <td
                        key={vendor.vendorId}
                        className={`px-3 py-3 text-right font-medium ${
                          vendor.variance <= 0
                            ? "text-emerald-600"
                            : "text-red-600"
                        }`}
                      >
                        {vendor.total ? money(vendor.variance) : "—"}
                      </td>
                    ))}
                  </tr>

                  <tr>
                    <td className="px-3 py-3 text-gray-500">Variance %</td>

                    <td className="px-3 py-3 text-right">—</td>

                    {summary.vendorTotals.map((vendor) => (
                      <td
                        key={vendor.vendorId}
                        className={`px-3 py-3 text-right font-medium ${
                          vendor.variance <= 0
                            ? "text-emerald-600"
                            : "text-red-600"
                        }`}
                      >
                        {vendor.total
                          ? percentage(vendor.variancePercent)
                          : "—"}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* ================================================== */}
        {/* CATEGORY FILTER */}
        {/* ================================================== */}

        <Card>
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-gray-900">BOQ Categories</h2>

              <p className="text-xs text-gray-500">
                Compare vendor pricing by the actual BOQ category.
              </p>
            </div>

            <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
              {categories.length} categories
            </span>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1">
            <CategoryPill
              active={selectedCategoryId === "ALL"}
              onClick={() => setSelectedCategoryId("ALL")}
              label="All Categories"
            />

            {categories.map((category) => (
              <CategoryPill
                key={category.id}
                active={String(selectedCategoryId) === String(category.id)}
                onClick={() => setSelectedCategoryId(category.id)}
                label={category.name}
              />
            ))}
          </div>
        </Card>

        {/* ================================================== */}
        {/* CATEGORY SUMMARY */}
        {/* ================================================== */}

        {categorySummaries.length > 0 && (
          <Card>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">
                BOQ Category Summary
              </h2>

              <span className="text-xs text-gray-400">
                {categorySummaries.length} trade
                {categorySummaries.length !== 1 ? "s" : ""}
              </span>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {categorySummaries.map((category) => (
                <button
                  type="button"
                  key={category.id}
                  onClick={() => setSelectedCategoryId(category.id)}
                  className={`rounded-xl border p-3 text-left transition ${
                    String(selectedCategoryId) === String(category.id)
                      ? "border-[#1F453B] bg-[#f2f7f4]"
                      : "border-gray-100 bg-gray-50 hover:border-[#1F453B]/30 hover:bg-white"
                  }`}
                >
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <div className="text-sm font-semibold text-gray-800">
                      {category.name}
                    </div>

                    <span className="rounded-full bg-white px-2 py-0.5 text-[10px] text-gray-500">
                      {category.items} items
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-[10px] uppercase tracking-wide text-gray-400">
                        BOQ
                      </div>

                      <div className="text-sm font-bold text-gray-900">
                        {money(category.boq)}
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] uppercase tracking-wide text-gray-400">
                        L1
                      </div>

                      <div className="text-sm font-bold text-[#1F453B]">
                        {category.l1 ? money(category.l1) : "—"}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </Card>
        )}

        {/* ================================================== */}
        {/* RATE COMPARISON */}
        {/* ================================================== */}

        <Card className="overflow-hidden p-0">
          <div className="flex flex-col gap-3 border-b border-gray-100 px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="font-semibold text-gray-900">
                Vendor Rate Calculator
              </h2>

              <p className="text-xs text-gray-500">
                Enter vendor unit rates against the actual BOQ rate. L1 is
                calculated automatically.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-gray-500">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                L1
              </span>

              <span className="flex items-center gap-1.5 text-gray-500">
                <span className="h-2 w-2 rounded-full bg-red-500" />
                Above BOQ
              </span>

              <span className="flex items-center gap-1.5 text-gray-500">
                <span className="h-2 w-2 rounded-full bg-gray-400" />
                Pending
              </span>
            </div>
          </div>

          {boqDetailLoading ? (
            <div className="flex min-h-[300px] items-center justify-center">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <RefreshCw size={17} className="animate-spin" />
                Loading BOQ...
              </div>
            </div>
          ) : !selectedBoqId ? (
            <EmptyState
              title="Select a BOQ"
              description="Choose a BOQ above to start calculating vendor rates."
            />
          ) : !categories.length ? (
            <EmptyState
              title="No BOQ categories"
              description="This BOQ does not contain any categories or line items."
            />
          ) : !selectedVendors.length ? (
            <EmptyState
              title="Select vendors"
              description="Select up to four vendors above to enter and compare their rates."
            />
          ) : !calculatedRows.length ? (
            <EmptyState
              title="No matching BOQ items"
              description="Try another category or search term."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1600px] border-collapse text-sm">
                <thead className="bg-[#f8faf9]">
                  <tr className="border-b border-gray-200">
                    <th className="sticky left-0 z-30 min-w-[70px] bg-[#f8faf9] px-3 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-gray-500">
                      S.No
                    </th>

                    <th className="sticky left-[70px] z-30 min-w-[280px] bg-[#f8faf9] px-3 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-gray-500">
                      BOQ Item
                    </th>

                    <th className="min-w-[180px] px-3 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-gray-500">
                      Specification / Make
                    </th>

                    <th className="min-w-[70px] px-3 py-3 text-center text-[10px] font-bold uppercase tracking-wider text-gray-500">
                      Unit
                    </th>

                    <th className="min-w-[80px] px-3 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-gray-500">
                      Qty
                    </th>

                    <th className="min-w-[110px] px-3 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-gray-500">
                      BOQ Rate
                    </th>

                    <th className="min-w-[130px] px-3 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-gray-500">
                      BOQ Amount
                    </th>

                    {selectedVendors.map((vendor, index) => {
                      const vendorId = getVendorId(vendor);

                      return (
                        <th
                          key={vendorId}
                          className="min-w-[210px] px-3 py-3 text-center text-[10px] font-bold uppercase tracking-wider text-[#1F453B]"
                        >
                          <div>{getComparisonVendorName(vendor, index)}</div>

                          <div className="mt-1 font-normal normal-case text-gray-400">
                            Vendor Rate / Amount
                          </div>
                        </th>
                      );
                    })}

                    <th className="min-w-[110px] px-3 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-[#1F453B]">
                      L1 Rate
                    </th>

                    <th className="min-w-[170px] px-3 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#1F453B]">
                      L1 Vendor
                    </th>

                    <th className="min-w-[130px] px-3 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-[#1F453B]">
                      L1 Amount
                    </th>

                    <th className="min-w-[130px] px-3 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-[#1F453B]">
                      L1 vs BOQ
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {categories.map((category) => {
                    const categoryRows = calculatedRows.filter(
                      (row) => String(row.categoryId) === String(category.id),
                    );

                    if (!categoryRows.length) {
                      return null;
                    }

                    const expanded = expandedCategories[category.id];

                    const categoryBoq = categoryRows.reduce(
                      (sum, row) => sum + row.boqAmount,
                      0,
                    );

                    const categoryL1 = categoryRows.reduce(
                      (sum, row) => sum + (row.l1?.amount || 0),
                      0,
                    );

                    const categoryQuoted = categoryRows.filter(
                      (row) => row.l1,
                    ).length;

                    return (
                      <React.Fragment key={category.id}>
                        {/* CATEGORY HEADER */}

                        <tr
                          className="cursor-pointer border-b border-gray-200 bg-[#eef3f0]"
                          onClick={() => toggleCategory(category.id)}
                        >
                          <td
                            colSpan={7 + selectedVendors.length + 4}
                            className="px-3 py-3"
                          >
                            <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                              <div className="flex items-center gap-2">
                                {expanded ? (
                                  <ChevronDown
                                    size={16}
                                    className="text-[#1F453B]"
                                  />
                                ) : (
                                  <ChevronRight
                                    size={16}
                                    className="text-[#1F453B]"
                                  />
                                )}

                                <span className="font-bold text-[#1F453B]">
                                  {category.name}
                                </span>

                                <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-medium text-gray-500">
                                  {categoryRows.length} items
                                </span>

                                <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-medium text-gray-500">
                                  {categoryQuoted}/{categoryRows.length} quoted
                                </span>
                              </div>

                              <div className="flex flex-wrap items-center gap-5 text-xs">
                                <span>
                                  BOQ: <strong>{money(categoryBoq)}</strong>
                                </span>

                                <span>
                                  L1:{" "}
                                  <strong className="text-[#1F453B]">
                                    {categoryL1 ? money(categoryL1) : "—"}
                                  </strong>
                                </span>
                              </div>
                            </div>
                          </td>
                        </tr>

                        {/* ITEMS */}

                        {expanded &&
                          categoryRows.map((row, rowIndex) => (
                            <ComparisonRow
                              key={`${row.categoryId}-${row.itemId}`}
                              row={row}
                              rowIndex={rowIndex}
                              selectedVendors={selectedVendors}
                              getComparisonVendorName={getComparisonVendorName}
                              getVendorId={getVendorId}
                              updateVendorRate={updateVendorRate}
                              getVendorRate={getVendorRate}
                            />
                          ))}

                        {/* CATEGORY SUBTOTAL */}

                        {expanded && (
                          <CategorySubtotal
                            rows={categoryRows}
                            selectedVendors={selectedVendors}
                            getVendorId={getVendorId}
                            getVendorRate={getVendorRate}
                          />
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>

                {/* GRAND TOTAL */}

                <tfoot>
                  <tr className="border-t-2 border-[#1F453B] bg-[#1F453B] text-white">
                    <td colSpan={5} className="px-3 py-4 text-sm font-bold">
                      GRAND TOTAL
                    </td>

                    <td className="px-3 py-4 text-right">—</td>

                    <td className="px-3 py-4 text-right font-bold">
                      {money(visibleSummary.boq)}
                    </td>

                    {selectedVendors.map((vendor) => {
                      const vendorId = getVendorId(vendor);

                      const total = calculatedRows.reduce(
                        (sum, row) =>
                          sum + getVendorRate(row.itemId, vendorId) * row.qty,
                        0,
                      );

                      return (
                        <td
                          key={vendorId}
                          className="px-3 py-4 text-right font-bold"
                        >
                          {total ? money(total) : "—"}
                        </td>
                      );
                    })}

                    <td className="px-3 py-4 text-right font-bold">
                      {visibleSummary.l1
                        ? money(
                            calculatedRows.reduce(
                              (sum, row) => sum + (row.l1?.rate || 0),
                              0,
                            ) / Math.max(1, visibleSummary.quoted),
                          )
                        : "—"}
                    </td>

                    <td className="px-3 py-4 font-bold">L1</td>

                    <td className="px-3 py-4 text-right font-bold">
                      {visibleSummary.l1 ? money(visibleSummary.l1) : "—"}
                    </td>

                    <td
                      className={`px-3 py-4 text-right font-bold ${
                        visibleSummary.l1 &&
                        visibleSummary.l1 <= visibleSummary.boq
                          ? "text-emerald-200"
                          : "text-red-200"
                      }`}
                    >
                      {visibleSummary.l1
                        ? percentage(
                            ((visibleSummary.l1 - visibleSummary.boq) /
                              Math.max(1, visibleSummary.boq)) *
                              100,
                          )
                        : "—"}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </Card>

        {/* ================================================== */}
        {/* VENDOR MODAL */}
        {/* ================================================== */}

        {showVendorSettings && (
          <VendorSelectionModal
            vendors={vendors}
            selectedVendorIds={selectedVendorIds}
            toggleVendor={toggleVendor}
            getVendorId={getVendorId}
            getVendorName={getVendorName}
            vendorNames={vendorNames}
            setVendorNames={setVendorNames}
            onClose={() => setShowVendorSettings(false)}
            loading={vendorsLoading}
          />
        )}
      </div>
    </Shell>
  );
}

// ============================================================
// COMPARISON ROW
// ============================================================

function ComparisonRow({
  row,
  rowIndex,
  selectedVendors,
  getComparisonVendorName,
  getVendorId,
  updateVendorRate,
  getVendorRate,
}) {
  return (
    <tr className="border-b border-gray-50 hover:bg-gray-50/70">
      {/* S.NO */}

      <td className="sticky left-0 z-10 bg-white px-3 py-3 text-xs font-semibold text-gray-500">
        {rowIndex + 1}
      </td>

      {/* ITEM */}

      <td className="sticky left-[70px] z-10 bg-white px-3 py-3">
        <div className="max-w-[280px]">
          <div className="font-medium text-gray-800">
            {getItemDescription(row.item)}
          </div>

          <div className="mt-1 text-[10px] font-medium uppercase tracking-wide text-[#1F453B]">
            {row.categoryName}
          </div>
        </div>
      </td>

      {/* SPEC */}

      <td className="px-3 py-3 text-xs text-gray-500">
        {getItemSpecification(row.item)}
      </td>

      {/* UNIT */}

      <td className="px-3 py-3 text-center text-xs text-gray-500">
        {getItemUnit(row.item)}
      </td>

      {/* QTY */}

      <td className="px-3 py-3 text-right font-medium text-gray-700">
        {number(row.qty)}
      </td>

      {/* BOQ RATE */}

      <td className="px-3 py-3 text-right font-semibold text-[#1F453B]">
        {row.boqRate ? money(row.boqRate) : "—"}
      </td>

      {/* BOQ AMOUNT */}

      <td className="px-3 py-3 text-right font-medium text-gray-700">
        {money(row.boqAmount)}
      </td>

      {/* VENDORS */}

      {selectedVendors.map((vendor) => {
        const vendorId = getVendorId(vendor);

        const rate = getVendorRate(row.itemId, vendorId);

        const amount = rate * row.qty;

        const isL1 = row.l1?.vendorId === vendorId;

        const isAboveBoq = rate > row.boqRate && row.boqRate > 0;

        return (
          <td
            key={vendorId}
            className={`px-3 py-2 ${isL1 ? "bg-emerald-50" : ""}`}
          >
            <div className="flex items-center gap-2">
              <div className="relative min-w-[105px]">
                <span className="pointer-events-none absolute left-2 top-2 text-xs text-gray-400">
                  ₹
                </span>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={rate || ""}
                  onChange={(event) =>
                    updateVendorRate(row.itemId, vendorId, event.target.value)
                  }
                  placeholder="Rate"
                  className={`w-full rounded-md border px-2 py-1.5 pl-6 text-right text-xs outline-none ${
                    isL1
                      ? "border-emerald-300 bg-white"
                      : isAboveBoq
                        ? "border-red-200 bg-red-50"
                        : "border-gray-200 bg-white"
                  }`}
                />
              </div>

              <div className="min-w-[85px] text-right">
                <div className="text-xs font-semibold text-gray-700">
                  {rate ? money(amount) : "—"}
                </div>

                {rate > 0 && row.boqAmount > 0 && (
                  <div
                    className={`text-[10px] ${
                      rate <= row.boqRate ? "text-emerald-600" : "text-red-600"
                    }`}
                  >
                    {percentage(((rate - row.boqRate) / row.boqRate) * 100)}
                  </div>
                )}
              </div>
            </div>

            {isL1 && (
              <div className="mt-1 flex items-center justify-end gap-1 text-[10px] font-bold text-emerald-600">
                <Trophy size={11} />
                L1
              </div>
            )}
          </td>
        );
      })}

      {/* L1 RATE */}

      <td className="bg-emerald-50 px-3 py-3 text-right font-bold text-[#1F453B]">
        {row.l1 ? money(row.l1.rate) : "—"}
      </td>

      {/* L1 VENDOR */}

      <td className="bg-emerald-50 px-3 py-3">
        {row.l1 ? (
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#1F453B]">
            <Trophy size={14} />

            {getComparisonVendorName(row.l1.vendor, row.l1.vendorIndex)}
          </div>
        ) : (
          <span className="text-xs text-gray-400">Not quoted</span>
        )}
      </td>

      {/* L1 AMOUNT */}

      <td className="bg-emerald-50 px-3 py-3 text-right font-bold text-[#1F453B]">
        {row.l1 ? money(row.l1.amount) : "—"}
      </td>

      {/* VARIANCE */}

      <td
        className={`px-3 py-3 text-right font-semibold ${
          !row.l1
            ? "text-gray-400"
            : row.variancePercent <= 0
              ? "text-emerald-600"
              : "text-red-600"
        }`}
      >
        {row.l1 ? percentage(row.variancePercent) : "—"}
      </td>
    </tr>
  );
}

// ============================================================
// CATEGORY SUBTOTAL
// ============================================================

function CategorySubtotal({
  rows,
  selectedVendors,
  getVendorId,
  getVendorRate,
}) {
  const boq = rows.reduce((sum, row) => sum + row.boqAmount, 0);

  const l1 = rows.reduce((sum, row) => sum + (row.l1?.amount || 0), 0);

  return (
    <tr className="border-b border-gray-200 bg-gray-50">
      <td
        colSpan={6}
        className="px-3 py-2 text-right text-xs font-bold uppercase tracking-wide text-gray-500"
      >
        Category Subtotal
      </td>

      <td className="px-3 py-2 text-right text-xs font-bold text-gray-700">
        {money(boq)}
      </td>

      {selectedVendors.map((vendor) => {
        const vendorId = getVendorId(vendor);

        const total = rows.reduce(
          (sum, row) => sum + getVendorRate(row.itemId, vendorId) * row.qty,
          0,
        );

        return (
          <td
            key={vendorId}
            className="px-3 py-2 text-right text-xs font-bold text-gray-700"
          >
            {total ? money(total) : "—"}
          </td>
        );
      })}

      <td className="px-3 py-2" />

      <td className="px-3 py-2 text-xs font-bold text-[#1F453B]">L1</td>

      <td className="px-3 py-2 text-right text-xs font-bold text-[#1F453B]">
        {l1 ? money(l1) : "—"}
      </td>

      <td
        className={`px-3 py-2 text-right text-xs font-bold ${
          l1 > boq ? "text-red-600" : "text-emerald-600"
        }`}
      >
        {l1 ? percentage(((l1 - boq) / Math.max(1, boq)) * 100) : "—"}
      </td>
    </tr>
  );
}

// ============================================================
// VENDOR SELECTION MODAL
// ============================================================

function VendorSelectionModal({
  vendors,
  selectedVendorIds,
  toggleVendor,
  getVendorId,
  getVendorName,
  vendorNames,
  setVendorNames,
  onClose,
  loading,
}) {
  const [search, setSearch] = useState("");

  const filteredVendors = vendors.filter((vendor) =>
    getVendorName(vendor).toLowerCase().includes(search.toLowerCase().trim()),
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">
      <div className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* HEADER */}

        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div>
            <h3 className="font-semibold text-gray-900">Select Vendors</h3>

            <p className="mt-0.5 text-xs text-gray-500">
              Select up to 4 vendors for rate comparison.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
          >
            <X size={18} />
          </button>
        </div>

        {/* SEARCH */}

        <div className="border-b border-gray-100 p-4">
          <div className="relative">
            <Search size={17} className="absolute left-3 top-3 text-gray-400" />

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search vendors..."
              className="w-full rounded-lg border border-gray-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[#1F453B]"
            />
          </div>
        </div>

        {/* VENDOR LIST */}

        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex justify-center py-10 text-sm text-gray-500">
              Loading vendors...
            </div>
          ) : !filteredVendors.length ? (
            <div className="py-10 text-center text-sm text-gray-500">
              No active vendors found.
            </div>
          ) : (
            <div className="space-y-2">
              {filteredVendors.map((vendor) => {
                const id = getVendorId(vendor);

                const selected = selectedVendorIds.some(
                  (selectedId) => String(selectedId) === String(id),
                );

                return (
                  <div
                    key={id}
                    className={`rounded-xl border p-3 transition ${
                      selected
                        ? "border-[#1F453B] bg-[#f2f7f4]"
                        : "border-gray-100 bg-white hover:border-gray-200"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => toggleVendor(vendor)}
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                          selected
                            ? "border-[#1F453B] bg-[#1F453B] text-white"
                            : "border-gray-300 bg-white"
                        }`}
                      >
                        {selected && <span className="text-xs">✓</span>}
                      </button>

                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-gray-800">
                          {getVendorName(vendor)}
                        </div>

                        {vendor?.vendor_code && (
                          <div className="text-xs text-gray-400">
                            {vendor.vendor_code}
                          </div>
                        )}

                        {vendor?.vendor_category?.name && (
                          <div className="mt-0.5 text-[10px] text-gray-400">
                            {vendor.vendor_category.name}
                          </div>
                        )}

                        {vendor?.category?.name && (
                          <div className="mt-0.5 text-[10px] text-gray-400">
                            {vendor.category.name}
                          </div>
                        )}
                      </div>

                      {selected && (
                        <input
                          value={vendorNames[id] || getVendorName(vendor)}
                          onChange={(event) =>
                            setVendorNames((previous) => ({
                              ...previous,
                              [id]: event.target.value,
                            }))
                          }
                          className="w-44 rounded-md border border-gray-200 bg-white px-2 py-1.5 text-xs outline-none focus:border-[#1F453B]"
                          title="Comparison display name"
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* FOOTER */}

        <div className="flex items-center justify-between border-t border-gray-100 px-5 py-4">
          <div className="text-xs text-gray-500">
            {selectedVendorIds.length}
            /4 selected
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-[#1F453B] px-4 py-2 text-sm font-semibold text-white hover:bg-[#17372f]"
          >
            Apply Vendors
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// INFO BOX
// ============================================================

function InfoBox({ label, value }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
        {label}
      </div>

      <div className="mt-1 truncate text-sm font-semibold text-gray-800">
        {value}
      </div>
    </div>
  );
}

// ============================================================
// SUMMARY CARD
// ============================================================

function SummaryCard({ icon, label, value }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div className="rounded-lg bg-[#eef3f0] p-2 text-[#1F453B]">{icon}</div>
      </div>

      <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
        {label}
      </div>

      <div className="mt-1 truncate text-lg font-bold text-gray-900">
        {value}
      </div>
    </div>
  );
}

// ============================================================
// STAT BADGE
// ============================================================

function StatBadge({ label, value }) {
  return (
    <div className="rounded-lg bg-gray-50 px-3 py-2">
      <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
        {label}
      </span>

      <span className="ml-2 text-xs font-bold text-gray-800">{value}</span>
    </div>
  );
}

// ============================================================
// CATEGORY PILL
// ============================================================

function CategoryPill({ active, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition ${
        active
          ? "bg-[#1F453B] text-white"
          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
      }`}
    >
      {label}
    </button>
  );
}

// ============================================================
// EMPTY STATE
// ============================================================

function EmptyState({ title, description }) {
  return (
    <div className="flex min-h-[350px] flex-col items-center justify-center px-5 text-center">
      <div className="mb-4 rounded-2xl bg-[#eef3f0] p-4 text-[#1F453B]">
        <Calculator size={28} />
      </div>

      <h3 className="font-semibold text-gray-800">{title}</h3>

      <p className="mt-1 max-w-md text-sm text-gray-500">{description}</p>
    </div>
  );
}
