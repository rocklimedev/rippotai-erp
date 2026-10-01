import React, { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRightLeft,
  Download,
  PackageMinus,
  PackagePlus,
  RefreshCw,
  Search,
} from "lucide-react";
import * as XLSX from "xlsx";

import { Shell, Card, Input } from "../../hooks/shared";

import { useGetSiteInventoryRegisterQuery } from "../../api/procuerment/inventory.api";
import { useGetProjectByIdQuery } from "../../api/projects/project.api";

/* ================================================================
   HELPERS
================================================================ */

const fmtDate = (value) => {
  if (!value) return "—";
  const [y, m, d] = String(value).slice(0, 10).split("-");
  return d && m && y ? `${d}-${m}-${y}` : String(value);
};

const fmtQty = (value) =>
  Number(value ?? 0).toLocaleString("en-IN", { maximumFractionDigits: 3 });

const yesNo = (value) =>
  value === "YES" ? "Yes" : value === "NO" ? "No" : "N/A";

const label = (value) => (value ? String(value).replaceAll("_", " ") : "");

const dash = (value) =>
  value === null || value === undefined || value === "" ? "—" : value;

/* ================================================================
   COLUMN DEFINITIONS
   Same columns, same order as the paper / Excel register.
   get()    -> plain value (search + Excel export)
   render() -> optional JSX for the screen
================================================================ */

const RECEIVED_COLUMNS = [
  {
    key: "date",
    label: "Date",
    get: (r) => fmtDate(r.date),
    render: (r) => (
      <div>
        <div>{fmtDate(r.date)}</div>
        {r.transaction_type && r.transaction_type !== "RECEIPT" && (
          <div className="mt-0.5 text-[10px] font-bold text-[#8A681D]">
            {label(r.transaction_type)}
          </div>
        )}
      </div>
    ),
  },
  {
    key: "material_description",
    label: "Material Description",
    wide: true,
    get: (r) => r.material_description,
  },
  { key: "brand", label: "Brand", get: (r) => r.brand },
  {
    key: "received_from",
    label: "Received From (Vendor / Supplier)",
    get: (r) => r.received_from,
  },
  {
    key: "for_which_work",
    label: "For Which Work",
    get: (r) => r.for_which_work,
  },
  {
    key: "qty",
    label: "Qty",
    align: "right",
    get: (r) => fmtQty(r.qty),
    render: (r) => <span className="font-semibold">{fmtQty(r.qty)}</span>,
  },
  { key: "unit", label: "Unit", get: (r) => r.unit },
  {
    key: "challan_bill_no",
    label: "Challan / Bill No.",
    get: (r) => r.challan_bill_no,
  },
  {
    key: "gate_pass_received",
    label: "Gate Pass Received",
    get: (r) => yesNo(r.gate_pass_received),
  },
  {
    key: "material_checked",
    label: "Material Checked",
    get: (r) => yesNo(r.material_checked),
  },
  {
    key: "condition_shortage_noted",
    label: "Condition / Shortage Noted",
    wide: true,
    get: (r) => r.condition_shortage_noted,
  },
  { key: "stored_at", label: "Stored At", get: (r) => r.stored_at },
  { key: "received_by", label: "Received By", get: (r) => r.received_by },
  { key: "remarks", label: "Remarks", wide: true, get: (r) => r.remarks },
  {
    key: "balance_after",
    label: "Balance After",
    align: "right",
    get: (r) => fmtQty(r.balance_after),
    render: (r) => <BalanceCell value={r.balance_after} />,
  },
];

const ISSUED_COLUMNS = [
  {
    key: "date",
    label: "Date",
    get: (r) => fmtDate(r.date),
    render: (r) => (
      <div>
        <div>{fmtDate(r.date)}</div>
        {r.transaction_type && r.transaction_type !== "ISSUE" && (
          <div className="mt-0.5 text-[10px] font-bold text-[#8A681D]">
            {label(r.transaction_type)}
          </div>
        )}
      </div>
    ),
  },
  {
    key: "material_description",
    label: "Material Description",
    wide: true,
    get: (r) => r.material_description,
  },
  {
    key: "qty_issued",
    label: "Qty Issued",
    align: "right",
    get: (r) => fmtQty(r.qty_issued),
    render: (r) => (
      <span className="font-semibold text-[#A94442]">
        {fmtQty(r.qty_issued)}
      </span>
    ),
  },
  { key: "unit", label: "Unit", get: (r) => r.unit },
  {
    key: "issued_to",
    label: "Issued To (Contractor / Trade)",
    get: (r) => r.issued_to,
  },
  {
    key: "for_which_work",
    label: "For Which Work",
    get: (r) => r.for_which_work,
  },
  { key: "issued_by", label: "Issued By", get: (r) => r.issued_by },
  { key: "remarks", label: "Remarks", wide: true, get: (r) => r.remarks },
  {
    key: "balance_after",
    label: "Balance After",
    align: "right",
    get: (r) => fmtQty(r.balance_after),
    render: (r) => <BalanceCell value={r.balance_after} unit={r.unit} />,
  },
];

const BALANCE_COLUMNS = [
  {
    key: "material_description",
    label: "Material Description",
    wide: true,
    get: (r) => r.material_description,
  },
  { key: "brand", label: "Brand", get: (r) => r.brand },
  { key: "unit", label: "Unit", get: (r) => r.unit },
  {
    key: "total_received",
    label: "Total Received",
    align: "right",
    get: (r) => fmtQty(r.total_received),
  },
  {
    key: "total_issued",
    label: "Total Issued",
    align: "right",
    get: (r) => fmtQty(r.total_issued),
  },
  {
    key: "balance",
    label: "Balance in Store",
    align: "right",
    get: (r) => fmtQty(r.balance),
    render: (r) => <BalanceCell value={r.balance} bold />,
  },
  {
    key: "last_movement",
    label: "Last Movement",
    get: (r) => fmtDate(r.last_movement),
  },
  {
    key: "stock_status",
    label: "Status",
    get: (r) => label(r.stock_status),
    render: (r) => <StockStatus status={r.stock_status} />,
  },
];

const TABS = [
  {
    id: "received",
    label: "Material Received",
    columns: RECEIVED_COLUMNS,
    icon: PackagePlus,
  },
  {
    id: "issued",
    label: "Material Issued",
    columns: ISSUED_COLUMNS,
    icon: PackageMinus,
  },
  {
    id: "balance",
    label: "Stock in Store",
    columns: BALANCE_COLUMNS,
    icon: ArrowRightLeft,
  },
];

/* ================================================================
   PAGE
================================================================ */

export default function ProjectInventoryRegisterPage() {
  const nav = useNavigate();
  const [searchParams] = useSearchParams();

  const projectId = searchParams.get("project_id") || "";
  const siteLocationOverride = searchParams.get("site_location") || "";

  const [tab, setTab] = useState("received");
  const [q, setQ] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // Site location is a field on Project (project.site_location),
  // same rule as the transaction form.
  const { data: projectResponse, isFetching: loadingProject } =
    useGetProjectByIdQuery(projectId, { skip: !projectId });

  const project = projectResponse?.data || projectResponse || null;
  const siteLocation = (
    siteLocationOverride ||
    project?.site_location ||
    ""
  ).trim();
  const projectName = project?.name || project?.project_name || "";

  const {
    data: response,
    isFetching,
    isError,
    refetch,
  } = useGetSiteInventoryRegisterQuery(
    {
      projectId,
      siteLocation,
      fromDate: fromDate || undefined,
      toDate: toDate || undefined,
    },
    { skip: !projectId || !siteLocation },
  );

  const register = response?.data || response || {};

  const dataByTab = {
    received: register.received || [],
    issued: register.issued || [],
    balance: register.balance || [],
  };

  const activeTab = TABS.find((t) => t.id === tab);

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    const source = dataByTab[tab];

    if (!term) return source;

    return source.filter((row) =>
      activeTab.columns.some((col) =>
        String(col.get(row) ?? "")
          .toLowerCase()
          .includes(term),
      ),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [response, tab, q]);

  const lowOrOut = dataByTab.balance.filter(
    (b) => Number(b.balance) <= 0,
  ).length;

  const recordUrl = (type) =>
    `/inventory/transactions/new?project_id=${projectId}&type=${type}`;

  /* ---------- multi-sheet Excel download ---------- */
  const exportExcel = () => {
    const sheetFromRows = (columns, sourceRows) => {
      const header = columns.map((c) => c.label);
      const body = sourceRows.map((row) =>
        columns.map((c) => {
          const v = c.get(row);
          return v === null || v === undefined ? "" : v;
        }),
      );
      return [header, ...body];
    };

    // 1. Material Received
    const receivedAoA = sheetFromRows(RECEIVED_COLUMNS, dataByTab.received);
    const receivedSheetData = [
      ["RIPPŌTAI"],
      ["SITE INVENTORY REGISTER — MATERIAL RECEIVED"],
      [
        projectName
          ? `${projectName} · every delivery in`
          : "Maintained by the Site Supervisor. Every delivery is entered on the day it arrives.",
      ],
      [],
      ...receivedAoA,
    ];

    // 2. Material Issued
    const issuedAoA = sheetFromRows(ISSUED_COLUMNS, dataByTab.issued);
    const issuedSheetData = [
      ["RIPPŌTAI"],
      ["SITE INVENTORY REGISTER — MATERIAL ISSUED"],
      [
        projectName
          ? `${projectName} · what leaves the store`
          : "What leaves the store and who took it. This is what makes the balance meaningful.",
      ],
      [],
      ...issuedAoA,
    ];

    // 3. Stock in Store
    const balanceAoA = sheetFromRows(BALANCE_COLUMNS, dataByTab.balance);
    const balanceSheetData = [
      ["RIPPŌTAI"],
      ["SITE INVENTORY REGISTER — STOCK IN STORE"],
      [
        projectName
          ? `${projectName} · current balance of every material`
          : "Current balance of every material. Derived from all receipts and issues.",
      ],
      [],
      ...balanceAoA,
    ];

    // 4. Lists (same dropdown source as the original workbook)
    const listsSheetData = [
      ["DROPDOWN LISTS"],
      ["Edit these to change the dropdown options on the register sheets."],
      [],
      ["YES / NO", "UNIT", "WORK / TRADE"],
      ["Yes", "nos", "Civil"],
      ["No", "sq ft", "Demolition"],
      ["Not applicable", "sq m", "Electrical"],
      ["", "rft", "Plumbing"],
      ["", "m", "HVAC / Mechanical"],
      ["", "kg", "Tiling & Stone"],
      ["", "bag", "False Ceiling / POP"],
      ["", "box", "Mill Work"],
      ["", "litre", "Metal Work"],
      ["", "set", "Painting & Polish"],
      ["", "roll", "Glass & Glazing"],
      ["", "bundle", "Loose Furniture"],
      ["", "", "General / Site"],
    ];

    const wb = XLSX.utils.book_new();

    const wsReceived = XLSX.utils.aoa_to_sheet(receivedSheetData);
    const wsIssued = XLSX.utils.aoa_to_sheet(issuedSheetData);
    const wsBalance = XLSX.utils.aoa_to_sheet(balanceSheetData);
    const wsLists = XLSX.utils.aoa_to_sheet(listsSheetData);

    // column widths matching the paper register
    wsReceived["!cols"] = [
      { wch: 12 },
      { wch: 34 },
      { wch: 14 },
      { wch: 28 },
      { wch: 22 },
      { wch: 10 },
      { wch: 10 },
      { wch: 16 },
      { wch: 14 },
      { wch: 14 },
      { wch: 28 },
      { wch: 14 },
      { wch: 12 },
      { wch: 28 },
      { wch: 12 },
    ];
    wsIssued["!cols"] = [
      { wch: 12 },
      { wch: 34 },
      { wch: 12 },
      { wch: 10 },
      { wch: 26 },
      { wch: 22 },
      { wch: 14 },
      { wch: 28 },
      { wch: 12 },
    ];
    wsBalance["!cols"] = [
      { wch: 36 },
      { wch: 14 },
      { wch: 10 },
      { wch: 14 },
      { wch: 12 },
      { wch: 14 },
      { wch: 14 },
      { wch: 16 },
    ];
    wsLists["!cols"] = [{ wch: 16 }, { wch: 14 }, { wch: 22 }];

    XLSX.utils.book_append_sheet(wb, wsReceived, "Material Received");
    XLSX.utils.book_append_sheet(wb, wsIssued, "Material Issued");
    XLSX.utils.book_append_sheet(wb, wsBalance, "Stock in Store");
    XLSX.utils.book_append_sheet(wb, wsLists, "Lists");

    const fileName = `site-inventory-register-${
      projectName ? projectName.replace(/\s+/g, "-").toLowerCase() + "-" : ""
    }${new Date().toISOString().slice(0, 10)}.xlsx`;

    XLSX.writeFile(wb, fileName);
  };

  /* ---------- guards ---------- */

  if (!projectId) {
    return (
      <Shell title="Site Inventory Register" subtitle="Project is required">
        <Card>
          <div className="p-8 text-center">
            <p className="text-[#6B7B7C] mb-4">
              Open this page from a project.
            </p>
            <button
              onClick={() => nav("/procurement/site-inventory")}
              className="h-9 px-4 rounded-lg bg-[#1F453B] text-white text-[13px] font-semibold"
            >
              Back to Inventory
            </button>
          </div>
        </Card>
      </Shell>
    );
  }

  return (
    <Shell
      title="Site Inventory Register"
      subtitle={
        projectName
          ? `${projectName} · every delivery in, every issue out`
          : "Every delivery in, every issue out"
      }
      action={
        <div className="flex gap-2 flex-wrap justify-end">
          <button
            onClick={() => nav(-1)}
            className="h-9 px-3 rounded-lg border border-[#D8E0DA] bg-white text-[12px] font-semibold inline-flex items-center gap-1.5"
          >
            <ArrowLeft size={14} />
            Back
          </button>

          <button
            onClick={() => nav(recordUrl("RECEIPT"))}
            className="h-9 px-3 rounded-lg bg-[#1F453B] text-white text-[12px] font-semibold inline-flex items-center gap-1.5"
          >
            <PackagePlus size={14} />
            Receive
          </button>

          <button
            onClick={() => nav(recordUrl("ISSUE"))}
            className="h-9 px-3 rounded-lg bg-[#1F453B] text-white text-[12px] font-semibold inline-flex items-center gap-1.5"
          >
            <PackageMinus size={14} />
            Issue
          </button>
        </div>
      }
    >
      {/* SUMMARY */}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <SummaryCard label="Materials" value={dataByTab.balance.length} />
        <SummaryCard
          label="Entries Received"
          value={dataByTab.received.length}
        />
        <SummaryCard label="Entries Issued" value={dataByTab.issued.length} />
        <SummaryCard
          label="Zero / Negative Stock"
          value={lowOrOut}
          warn={lowOrOut > 0}
        />
      </div>

      {/* NO SITE LOCATION */}

      {!loadingProject && !siteLocation && (
        <Card>
          <div className="p-6 text-[13px] text-[#8A681D] bg-[#FFF5DD] rounded-xl">
            This project has no site location set, so there is no register to
            show. Add a site location to the project first.
          </div>
        </Card>
      )}

      {/* TABS */}

      <div className="flex gap-1 border-b border-[#D8E0DA] overflow-x-auto">
        {TABS.map((t) => {
          const TabIcon = t.icon;
          const active = t.id === tab;

          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2.5 text-[13px] font-semibold inline-flex items-center gap-2 border-b-2 -mb-px whitespace-nowrap ${
                active
                  ? "border-[#1F453B] text-[#1F453B]"
                  : "border-transparent text-[#7B898A] hover:text-[#333333]"
              }`}
            >
              <TabIcon size={15} />
              {t.label}
              <span
                className={`text-[11px] px-1.5 py-0.5 rounded-md ${
                  active ? "bg-[#EAF3EE]" : "bg-[#F4F6F7]"
                }`}
              >
                {dataByTab[t.id].length}
              </span>
            </button>
          );
        })}
      </div>

      {/* FILTER BAR */}

      <div className="flex gap-3 flex-wrap items-end">
        <div className="relative max-w-sm w-full">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A9899]"
          />
          <Input
            placeholder="Search material, vendor, work, challan…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-9"
          />
        </div>

        {tab !== "balance" && (
          <>
            <DateFilter label="From" value={fromDate} onChange={setFromDate} />
            <DateFilter label="To" value={toDate} onChange={setToDate} />
          </>
        )}

        {(fromDate || toDate) && (
          <button
            onClick={() => {
              setFromDate("");
              setToDate("");
            }}
            className="h-9 text-[13px] text-[#333333] font-semibold"
          >
            Clear dates ×
          </button>
        )}

        <div className="ml-auto flex gap-2">
          <button
            onClick={exportExcel}
            disabled={
              !dataByTab.received.length &&
              !dataByTab.issued.length &&
              !dataByTab.balance.length
            }
            className="h-9 px-3 rounded-lg border border-[#D8E0DA] bg-white inline-flex items-center gap-1.5 text-[13px] font-medium disabled:opacity-50"
          >
            <Download size={14} />
            Download Excel
          </button>

          <button
            onClick={() => refetch()}
            disabled={isFetching || !siteLocation}
            className="h-9 px-3 rounded-lg border border-[#D8E0DA] bg-white inline-flex items-center gap-1.5 text-[13px] font-medium disabled:opacity-50"
          >
            <RefreshCw size={14} className={isFetching ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {/* TABLE */}

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead className="bg-[#F4F6F7]">
              <tr>
                {activeTab.columns.map((col) => (
                  <th
                    key={col.key}
                    className={`px-3 py-3 whitespace-nowrap ${
                      col.align === "right" ? "text-right" : "text-left"
                    }`}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {!isFetching &&
                rows.map((row, index) => (
                  <tr
                    key={row.id || row.material_id || index}
                    className="border-t border-[rgba(31,69,59,0.08)] hover:bg-[#F4F6F7] align-top"
                  >
                    {activeTab.columns.map((col) => (
                      <td
                        key={col.key}
                        className={`px-3 py-3 ${
                          col.align === "right" ? "text-right" : "text-left"
                        } ${
                          col.wide
                            ? "min-w-[200px]"
                            : "whitespace-nowrap text-[#4D5B5C]"
                        }`}
                      >
                        {col.render ? col.render(row) : dash(col.get(row))}
                      </td>
                    ))}
                  </tr>
                ))}

              {isFetching && (
                <tr>
                  <td
                    colSpan={activeTab.columns.length}
                    className="py-10 text-center text-[#8A9899]"
                  >
                    Loading register...
                  </td>
                </tr>
              )}

              {!isFetching && isError && (
                <tr>
                  <td
                    colSpan={activeTab.columns.length}
                    className="py-10 text-center text-[#A94442]"
                  >
                    Could not load the register. Try refreshing.
                  </td>
                </tr>
              )}

              {!isFetching && !isError && siteLocation && !rows.length && (
                <tr>
                  <td
                    colSpan={activeTab.columns.length}
                    className="py-10 text-center text-[#8A9899]"
                  >
                    No entries found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </Shell>
  );
}

/* ================================================================
   SMALL COMPONENTS
================================================================ */

function SummaryCard({ label: text, value, warn = false }) {
  return (
    <Card>
      <div className="p-4">
        <div className="text-[12px] text-[#7B898A] uppercase tracking-wide">
          {text}
        </div>
        <div
          className={`mt-1 text-[22px] font-bold ${
            warn ? "text-[#A94442]" : "text-[#1F453B]"
          }`}
        >
          {value}
        </div>
      </div>
    </Card>
  );
}

function DateFilter({ label: text, value, onChange }) {
  return (
    <div>
      <div className="text-[11px] font-semibold text-[#4D5B5C] mb-1">
        {text}
      </div>
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 rounded-lg border border-[#D8E0DA] bg-white px-3 text-[13px]"
      />
    </div>
  );
}

function BalanceCell({ value, unit, bold = false }) {
  const n = Number(value ?? 0);

  return (
    <span
      className={`${bold ? "font-bold" : "font-medium"} ${
        n < 0 ? "text-[#A94442]" : n === 0 ? "text-[#8A681D]" : "text-[#1F453B]"
      }`}
    >
      {fmtQty(n)}
      {unit ? ` ${unit}` : ""}
    </span>
  );
}

function StockStatus({ status }) {
  const classes =
    status === "NEGATIVE_STOCK"
      ? "bg-[#FDECEC] text-[#A94442]"
      : status === "OUT_OF_STOCK"
        ? "bg-[#FFF5DD] text-[#8A681D]"
        : "bg-[#EAF3EE] text-[#1F453B]";

  return (
    <span
      className={`inline-flex px-2 py-1 rounded-md text-[11px] font-bold ${classes}`}
    >
      {label(status) || "—"}
    </span>
  );
}
