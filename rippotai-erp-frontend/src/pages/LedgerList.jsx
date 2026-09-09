import React, { useMemo, useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  BarChart3,
  BookOpen,
  Calendar,
  ChevronDown,
  ChevronRight,
  CircleDollarSign,
  ClipboardList,
  Download,
  FileText,
  Filter,
  Landmark,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Wallet,
  X,
  CheckCircle2,
  Clock3,
  AlertCircle,
  ArrowRight,
  Eye,
  Pencil,
  Printer,
  Receipt,
  Scale,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

const PRIMARY = "#1F453B";

const ledgerAccounts = [
  {
    id: "1001",
    code: "1001",
    name: "Cash & Bank",
    type: "Asset",
    opening: 1845000,
    debit: 1285000,
    credit: 945000,
    closing: 2185000,
  },
  {
    id: "1101",
    code: "1101",
    name: "Accounts Receivable",
    type: "Asset",
    opening: 1240000,
    debit: 875000,
    credit: 640000,
    closing: 1475000,
  },
  {
    id: "2001",
    code: "2001",
    name: "Accounts Payable",
    type: "Liability",
    opening: 965000,
    debit: 420000,
    credit: 785000,
    closing: 1330000,
  },
  {
    id: "3001",
    code: "3001",
    name: "Capital Account",
    type: "Equity",
    opening: 2500000,
    debit: 0,
    credit: 0,
    closing: 2500000,
  },
  {
    id: "4001",
    code: "4001",
    name: "Project Revenue",
    type: "Revenue",
    opening: 0,
    debit: 0,
    credit: 3245000,
    closing: 3245000,
  },
  {
    id: "5001",
    code: "5001",
    name: "Material Purchases",
    type: "Expense",
    opening: 0,
    debit: 1875000,
    credit: 0,
    closing: 1875000,
  },
  {
    id: "5002",
    code: "5002",
    name: "Site Expenses",
    type: "Expense",
    opening: 0,
    debit: 735000,
    credit: 0,
    closing: 735000,
  },
  {
    id: "5003",
    code: "5003",
    name: "Subcontractor Expenses",
    type: "Expense",
    opening: 0,
    debit: 1145000,
    credit: 125000,
    closing: 1020000,
  },
];

const transactions = [
  {
    id: "JV-2026-0912",
    date: "09 Sep 2026",
    journal: "JV",
    reference: "JV-2026-0912",
    accountCode: "1001",
    account: "Cash & Bank",
    description: "Payment received from client",
    project: "DLF Residence",
    debit: 450000,
    credit: 0,
    status: "Posted",
    source: "Receipt",
    createdBy: "Accounts",
  },
  {
    id: "JV-2026-0911",
    date: "09 Sep 2026",
    journal: "JV",
    reference: "JV-2026-0911",
    accountCode: "4001",
    account: "Project Revenue",
    description: "Progress billing - Phase 02",
    project: "DLF Residence",
    debit: 0,
    credit: 450000,
    status: "Posted",
    source: "Invoice",
    createdBy: "Accounts",
  },
  {
    id: "PV-2026-0834",
    date: "08 Sep 2026",
    journal: "PV",
    reference: "PV-2026-0834",
    accountCode: "5001",
    account: "Material Purchases",
    description: "Sanitaryware purchase",
    project: "DLF Residence",
    debit: 285000,
    credit: 0,
    status: "Posted",
    source: "Purchase",
    createdBy: "Procurement",
  },
  {
    id: "PV-2026-0834-B",
    date: "08 Sep 2026",
    journal: "PV",
    reference: "PV-2026-0834",
    accountCode: "2001",
    account: "Accounts Payable",
    description: "Supplier payable - sanitaryware",
    project: "DLF Residence",
    debit: 0,
    credit: 285000,
    status: "Posted",
    source: "Purchase",
    createdBy: "Procurement",
  },
  {
    id: "RV-2026-0145",
    date: "07 Sep 2026",
    journal: "RV",
    reference: "RV-2026-0145",
    accountCode: "1001",
    account: "Cash & Bank",
    description: "Advance received",
    project: "Golf Course Villa",
    debit: 325000,
    credit: 0,
    status: "Posted",
    source: "Receipt",
    createdBy: "Accounts",
  },
  {
    id: "JV-2026-0902",
    date: "06 Sep 2026",
    journal: "JV",
    reference: "JV-2026-0902",
    accountCode: "5003",
    account: "Subcontractor Expenses",
    description: "Civil subcontractor bill",
    project: "Noida Commercial",
    debit: 175000,
    credit: 0,
    status: "Posted",
    source: "Bill",
    createdBy: "Projects",
  },
  {
    id: "JV-2026-0902-B",
    date: "06 Sep 2026",
    journal: "JV",
    reference: "JV-2026-0902",
    accountCode: "2001",
    account: "Accounts Payable",
    description: "Civil subcontractor payable",
    project: "Noida Commercial",
    debit: 0,
    credit: 175000,
    status: "Posted",
    source: "Bill",
    createdBy: "Projects",
  },
  {
    id: "BP-2026-0318",
    date: "05 Sep 2026",
    journal: "BP",
    reference: "BP-2026-0318",
    accountCode: "1001",
    account: "Cash & Bank",
    description: "Supplier payment",
    project: "Metro Heights",
    debit: 0,
    credit: 210000,
    status: "Posted",
    source: "Payment",
    createdBy: "Accounts",
  },
];

const journalTypes = [
  { value: "all", label: "All journals" },
  { value: "JV", label: "Journal Voucher" },
  { value: "PV", label: "Payment Voucher" },
  { value: "RV", label: "Receipt Voucher" },
  { value: "BP", label: "Bank Payment" },
];

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

const formatCompactCurrency = (value) => {
  const abs = Math.abs(value);

  if (abs >= 10000000) {
    return `₹${(value / 10000000).toFixed(2)} Cr`;
  }

  if (abs >= 100000) {
    return `₹${(value / 100000).toFixed(2)} L`;
  }

  if (abs >= 1000) {
    return `₹${(value / 1000).toFixed(1)}K`;
  }

  return formatCurrency(value);
};

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendLabel,
  neutral = false,
}) {
  return (
    <Card className="border border-slate-200 shadow-none rounded-2xl overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              {title}
            </p>

            <div className="mt-2 text-2xl font-semibold text-slate-900 tracking-tight">
              {value}
            </div>

            <div className="mt-2 flex items-center gap-2">
              {trend && (
                <span
                  className={`inline-flex items-center gap-1 text-xs font-medium ${
                    neutral
                      ? "text-slate-500"
                      : trend > 0
                        ? "text-emerald-600"
                        : "text-red-500"
                  }`}
                >
                  {trend > 0 ? (
                    <TrendingUp className="h-3.5 w-3.5" />
                  ) : (
                    <TrendingDown className="h-3.5 w-3.5" />
                  )}
                  {Math.abs(trend)}%
                </span>
              )}

              <span className="text-xs text-slate-400">
                {trendLabel || subtitle}
              </span>
            </div>
          </div>

          <div
            className="h-10 w-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: `${PRIMARY}12` }}
          >
            <Icon className="h-5 w-5" style={{ color: PRIMARY }} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function JournalBadge({ type }) {
  const map = {
    JV: "Journal",
    PV: "Payment",
    RV: "Receipt",
    BP: "Bank",
  };

  return (
    <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-600">
      {type} · {map[type] || "Journal"}
    </span>
  );
}

function StatusBadge({ status }) {
  const config = {
    Posted: {
      icon: CheckCircle2,
      className: "bg-emerald-50 text-emerald-700",
    },
    Draft: {
      icon: Clock3,
      className: "bg-amber-50 text-amber-700",
    },
    Reversed: {
      icon: AlertCircle,
      className: "bg-red-50 text-red-700",
    },
  };

  const item = config[status] || config.Posted;
  const Icon = item.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${item.className}`}
    >
      <Icon className="h-3.5 w-3.5" />
      {status}
    </span>
  );
}

function EmptyState() {
  return (
    <div className="py-16 text-center">
      <div className="mx-auto mb-4 h-12 w-12 rounded-2xl bg-slate-100 flex items-center justify-center">
        <BookOpen className="h-6 w-6 text-slate-400" />
      </div>
      <h3 className="text-sm font-semibold text-slate-800">
        No ledger entries found
      </h3>
      <p className="mt-1 text-xs text-slate-500">
        Try changing your filters or search criteria.
      </p>
    </div>
  );
}

export default function LedgerList() {
  const [activeTab, setActiveTab] = useState("transactions");
  const [search, setSearch] = useState("");
  const [accountFilter, setAccountFilter] = useState("all");
  const [journalFilter, setJournalFilter] = useState("all");
  const [period, setPeriod] = useState("This Month");
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  const filteredTransactions = useMemo(() => {
    const q = search.trim().toLowerCase();

    return transactions.filter((tx) => {
      const matchesSearch =
        !q ||
        tx.reference.toLowerCase().includes(q) ||
        tx.description.toLowerCase().includes(q) ||
        tx.account.toLowerCase().includes(q) ||
        tx.project.toLowerCase().includes(q);

      const matchesAccount =
        accountFilter === "all" || tx.accountCode === accountFilter;

      const matchesJournal =
        journalFilter === "all" || tx.journal === journalFilter;

      return matchesSearch && matchesAccount && matchesJournal;
    });
  }, [search, accountFilter, journalFilter]);

  const totalDebit = filteredTransactions.reduce(
    (sum, tx) => sum + tx.debit,
    0,
  );

  const totalCredit = filteredTransactions.reduce(
    (sum, tx) => sum + tx.credit,
    0,
  );

  return (
    <div className="min-h-screen bg-[#F7F8F7] text-slate-900">
      {/* ============================================================
          PAGE HEADER
      ============================================================ */}

      <div className="border-b border-slate-200 bg-white">
        <div className="px-6 py-5">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span>INOS</span>
                <ChevronRight className="h-3.5 w-3.5" />
                <span>Finance</span>
                <ChevronRight className="h-3.5 w-3.5" />
                <span className="text-slate-600">Ledger</span>
              </div>

              <div className="mt-2 flex items-center gap-3">
                <div
                  className="h-10 w-10 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: PRIMARY }}
                >
                  <BookOpen className="h-5 w-5 text-white" />
                </div>

                <div>
                  <h1 className="text-2xl font-semibold tracking-tight">
                    General Ledger
                  </h1>
                  <p className="text-sm text-slate-500 mt-0.5">
                    Financial control, account movements and journal activity
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" className="rounded-xl h-10 bg-white">
                <RefreshCw className="h-4 w-4 mr-2" />
                Sync
              </Button>

              <Button variant="outline" className="rounded-xl h-10 bg-white">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>

              <Button
                className="rounded-xl h-10 text-white"
                style={{ backgroundColor: PRIMARY }}
              >
                <Plus className="h-4 w-4 mr-2" />
                New Journal Entry
              </Button>
            </div>
          </div>
        </div>
      </div>

      <main className="p-6 space-y-6">
        {/* ============================================================
            KPI ROW
        ============================================================ */}

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard
            title="Closing Balance"
            value={formatCompactCurrency(6185000)}
            subtitle="vs previous period"
            trend={8.4}
            icon={Scale}
          />

          <StatCard
            title="Total Debits"
            value={formatCompactCurrency(4010000)}
            subtitle="this month"
            trend={12.2}
            icon={ArrowDownLeft}
          />

          <StatCard
            title="Total Credits"
            value={formatCompactCurrency(4700000)}
            subtitle="this month"
            trend={6.7}
            icon={ArrowUpRight}
          />

          <StatCard
            title="Pending Reconciliation"
            value="₹3.42 L"
            subtitle="14 transactions"
            trend={-4.8}
            icon={ClipboardList}
          />
        </div>

        {/* ============================================================
            CONTROL BAR
        ============================================================ */}

        <Card className="border border-slate-200 shadow-none rounded-2xl">
          <CardContent className="p-3">
            <div className="flex flex-col xl:flex-row gap-3 xl:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search reference, account, project or description..."
                  className="pl-9 h-10 border-slate-200 rounded-xl bg-slate-50/60"
                />
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="h-10 rounded-xl bg-white"
                    >
                      <Calendar className="h-4 w-4 mr-2" />
                      {period}
                      <ChevronDown className="h-4 w-4 ml-2" />
                    </Button>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent align="end">
                    {[
                      "Today",
                      "This Week",
                      "This Month",
                      "Last Month",
                      "This Quarter",
                      "This Financial Year",
                    ].map((item) => (
                      <DropdownMenuItem
                        key={item}
                        onClick={() => setPeriod(item)}
                      >
                        {item}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="h-10 rounded-xl bg-white"
                    >
                      <BookOpen className="h-4 w-4 mr-2" />
                      {journalFilter === "all" ? "All Journals" : journalFilter}
                      <ChevronDown className="h-4 w-4 ml-2" />
                    </Button>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent align="end">
                    {journalTypes.map((journal) => (
                      <DropdownMenuItem
                        key={journal.value}
                        onClick={() => setJournalFilter(journal.value)}
                      >
                        {journal.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                <Button
                  variant={showFilters ? "default" : "outline"}
                  onClick={() => setShowFilters(!showFilters)}
                  className="h-10 rounded-xl"
                  style={
                    showFilters
                      ? {
                          backgroundColor: PRIMARY,
                          color: "white",
                        }
                      : {}
                  }
                >
                  <SlidersHorizontal className="h-4 w-4 mr-2" />
                  Filters
                </Button>
              </div>
            </div>

            {showFilters && (
              <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-slate-500">
                    Ledger Account
                  </label>

                  <select
                    value={accountFilter}
                    onChange={(e) => setAccountFilter(e.target.value)}
                    className="mt-1 w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm"
                  >
                    <option value="all">All accounts</option>
                    {ledgerAccounts.map((account) => (
                      <option key={account.id} value={account.code}>
                        {account.code} — {account.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-medium text-slate-500">
                    Entry Status
                  </label>

                  <select className="mt-1 w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm">
                    <option>All statuses</option>
                    <option>Posted</option>
                    <option>Draft</option>
                    <option>Reversed</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-medium text-slate-500">
                    Source Module
                  </label>

                  <select className="mt-1 w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm">
                    <option>All modules</option>
                    <option>Projects</option>
                    <option>Procurement</option>
                    <option>Inventory</option>
                    <option>Sales</option>
                    <option>Finance</option>
                  </select>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ============================================================
            ACCOUNT SNAPSHOT
        ============================================================ */}

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <Card className="xl:col-span-2 border border-slate-200 shadow-none rounded-2xl">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Account Snapshot</CardTitle>
                  <p className="text-xs text-slate-500 mt-1">
                    Current movement across the chart of accounts
                  </p>
                </div>

                <Button
                  variant="ghost"
                  className="text-xs text-slate-500"
                  onClick={() => setActiveTab("accounts")}
                >
                  View all
                  <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-y border-slate-100 bg-slate-50/70">
                      <th className="text-left px-5 py-3 text-[11px] uppercase tracking-wider font-semibold text-slate-400">
                        Account
                      </th>
                      <th className="text-right px-5 py-3 text-[11px] uppercase tracking-wider font-semibold text-slate-400">
                        Opening
                      </th>
                      <th className="text-right px-5 py-3 text-[11px] uppercase tracking-wider font-semibold text-slate-400">
                        Debit
                      </th>
                      <th className="text-right px-5 py-3 text-[11px] uppercase tracking-wider font-semibold text-slate-400">
                        Credit
                      </th>
                      <th className="text-right px-5 py-3 text-[11px] uppercase tracking-wider font-semibold text-slate-400">
                        Closing
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {ledgerAccounts.slice(0, 5).map((account) => (
                      <tr
                        key={account.id}
                        onClick={() => setSelectedAccount(account)}
                        className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors"
                      >
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center">
                              {account.type === "Asset" ? (
                                <Wallet className="h-4 w-4 text-slate-600" />
                              ) : account.type === "Revenue" ? (
                                <TrendingUp className="h-4 w-4 text-slate-600" />
                              ) : (
                                <FileText className="h-4 w-4 text-slate-600" />
                              )}
                            </div>

                            <div>
                              <div className="font-medium text-slate-800">
                                {account.name}
                              </div>
                              <div className="text-[11px] text-slate-400">
                                {account.code} · {account.type}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-3.5 text-right text-slate-500">
                          {formatCompactCurrency(account.opening)}
                        </td>

                        <td className="px-5 py-3.5 text-right text-slate-700">
                          {formatCompactCurrency(account.debit)}
                        </td>

                        <td className="px-5 py-3.5 text-right text-slate-700">
                          {formatCompactCurrency(account.credit)}
                        </td>

                        <td className="px-5 py-3.5 text-right font-semibold text-slate-900">
                          {formatCompactCurrency(account.closing)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* ============================================================
              LEDGER HEALTH
          ============================================================ */}

          <Card className="border border-slate-200 shadow-none rounded-2xl">
            <CardHeader>
              <CardTitle className="text-base">Ledger Health</CardTitle>
              <p className="text-xs text-slate-500">Financial control checks</p>
            </CardHeader>

            <CardContent className="space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-emerald-50 flex items-center justify-center">
                    <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Trial Balance</p>
                    <p className="text-xs text-slate-400">
                      Debits and credits balanced
                    </p>
                  </div>
                </div>

                <span className="text-xs font-semibold text-emerald-600">
                  Balanced
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-amber-50 flex items-center justify-center">
                    <Clock3 className="h-4.5 w-4.5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Bank Reconciliation</p>
                    <p className="text-xs text-slate-400">
                      14 items require review
                    </p>
                  </div>
                </div>

                <span className="text-xs font-semibold text-amber-600">
                  Review
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-emerald-50 flex items-center justify-center">
                    <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Unposted Journals</p>
                    <p className="text-xs text-slate-400">
                      No pending journals
                    </p>
                  </div>
                </div>

                <span className="text-xs font-semibold text-emerald-600">
                  Clear
                </span>
              </div>

              <div className="border-t border-slate-100 pt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-slate-500">
                    Reconciliation completion
                  </span>
                  <span className="text-xs font-semibold">86%</span>
                </div>

                <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: "86%",
                      backgroundColor: PRIMARY,
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ============================================================
            MAIN LEDGER
        ============================================================ */}

        <Card className="border border-slate-200 shadow-none rounded-2xl overflow-hidden">
          <CardHeader className="border-b border-slate-100">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-base">Ledger Activity</CardTitle>
                <p className="text-xs text-slate-500 mt-1">
                  {filteredTransactions.length} entries · {period}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="rounded-lg">
                  <Printer className="h-3.5 w-3.5 mr-2" />
                  Print
                </Button>

                <Button variant="outline" size="sm" className="rounded-lg">
                  <Download className="h-3.5 w-3.5 mr-2" />
                  Export CSV
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-1 mt-5 border-b border-slate-100">
              {[
                ["transactions", "Transactions"],
                ["accounts", "Accounts"],
                ["journals", "Journal Register"],
                ["reconciliation", "Reconciliation"],
              ].map(([value, label]) => (
                <button
                  key={value}
                  onClick={() => setActiveTab(value)}
                  className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === value
                      ? "text-slate-900"
                      : "border-transparent text-slate-400 hover:text-slate-700"
                  }`}
                  style={
                    activeTab === value
                      ? {
                          borderColor: PRIMARY,
                          color: PRIMARY,
                        }
                      : {}
                  }
                >
                  {label}
                </button>
              ))}
            </div>
          </CardHeader>

          {activeTab === "transactions" && (
            <CardContent className="p-0">
              {filteredTransactions.length === 0 ? (
                <EmptyState />
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-slate-50/70 border-b border-slate-100">
                          <th className="px-5 py-3 text-left text-[11px] uppercase tracking-wider font-semibold text-slate-400">
                            Date
                          </th>

                          <th className="px-5 py-3 text-left text-[11px] uppercase tracking-wider font-semibold text-slate-400">
                            Journal
                          </th>

                          <th className="px-5 py-3 text-left text-[11px] uppercase tracking-wider font-semibold text-slate-400">
                            Account
                          </th>

                          <th className="px-5 py-3 text-left text-[11px] uppercase tracking-wider font-semibold text-slate-400 min-w-[300px]">
                            Description
                          </th>

                          <th className="px-5 py-3 text-left text-[11px] uppercase tracking-wider font-semibold text-slate-400">
                            Project
                          </th>

                          <th className="px-5 py-3 text-right text-[11px] uppercase tracking-wider font-semibold text-slate-400">
                            Debit
                          </th>

                          <th className="px-5 py-3 text-right text-[11px] uppercase tracking-wider font-semibold text-slate-400">
                            Credit
                          </th>

                          <th className="px-5 py-3 text-left text-[11px] uppercase tracking-wider font-semibold text-slate-400">
                            Status
                          </th>

                          <th className="px-5 py-3" />
                        </tr>
                      </thead>

                      <tbody>
                        {filteredTransactions.map((tx) => (
                          <tr
                            key={tx.id}
                            className="border-b border-slate-100 hover:bg-slate-50/70 transition-colors"
                          >
                            <td className="px-5 py-4 whitespace-nowrap">
                              <span className="text-sm text-slate-700">
                                {tx.date}
                              </span>
                            </td>

                            <td className="px-5 py-4 whitespace-nowrap">
                              <JournalBadge type={tx.journal} />
                            </td>

                            <td className="px-5 py-4">
                              <div className="font-medium text-slate-800">
                                {tx.account}
                              </div>
                              <div className="text-[11px] text-slate-400">
                                {tx.accountCode}
                              </div>
                            </td>

                            <td className="px-5 py-4">
                              <div className="font-medium text-slate-700">
                                {tx.description}
                              </div>
                              <div className="text-[11px] text-slate-400 mt-0.5">
                                {tx.reference} · {tx.source}
                              </div>
                            </td>

                            <td className="px-5 py-4">
                              <span className="text-xs text-slate-600">
                                {tx.project}
                              </span>
                            </td>

                            <td className="px-5 py-4 text-right whitespace-nowrap">
                              {tx.debit > 0 ? (
                                <span className="font-medium text-slate-800">
                                  {formatCurrency(tx.debit)}
                                </span>
                              ) : (
                                <span className="text-slate-300">—</span>
                              )}
                            </td>

                            <td className="px-5 py-4 text-right whitespace-nowrap">
                              {tx.credit > 0 ? (
                                <span className="font-medium text-slate-800">
                                  {formatCurrency(tx.credit)}
                                </span>
                              ) : (
                                <span className="text-slate-300">—</span>
                              )}
                            </td>

                            <td className="px-5 py-4">
                              <StatusBadge status={tx.status} />
                            </td>

                            <td className="px-5 py-4">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 rounded-lg"
                                  >
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>

                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() => setSelectedTransaction(tx)}
                                  >
                                    <Eye className="h-4 w-4 mr-2" />
                                    View Entry
                                  </DropdownMenuItem>

                                  <DropdownMenuItem>
                                    <Pencil className="h-4 w-4 mr-2" />
                                    Edit
                                  </DropdownMenuItem>

                                  <DropdownMenuSeparator />

                                  <DropdownMenuItem>
                                    <Receipt className="h-4 w-4 mr-2" />
                                    View Source Document
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </td>
                          </tr>
                        ))}
                      </tbody>

                      <tfoot>
                        <tr className="bg-slate-50/80">
                          <td
                            colSpan={5}
                            className="px-5 py-4 text-right text-xs font-semibold text-slate-500 uppercase"
                          >
                            Filtered Total
                          </td>

                          <td className="px-5 py-4 text-right font-bold text-slate-900">
                            {formatCurrency(totalDebit)}
                          </td>

                          <td className="px-5 py-4 text-right font-bold text-slate-900">
                            {formatCurrency(totalCredit)}
                          </td>

                          <td colSpan={2} />
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs text-slate-400">
                      Showing {filteredTransactions.length} of{" "}
                      {transactions.length} entries
                    </span>

                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled
                        className="h-8 rounded-lg text-xs"
                      >
                        Previous
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 rounded-lg text-xs"
                      >
                        1
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 rounded-lg text-xs"
                      >
                        2
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 rounded-lg text-xs"
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          )}

          {/* ============================================================
              ACCOUNTS TAB
          ============================================================ */}

          {activeTab === "accounts" && (
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="px-5 py-3 text-left text-[11px] uppercase tracking-wider text-slate-400">
                        Code
                      </th>
                      <th className="px-5 py-3 text-left text-[11px] uppercase tracking-wider text-slate-400">
                        Account
                      </th>
                      <th className="px-5 py-3 text-left text-[11px] uppercase tracking-wider text-slate-400">
                        Type
                      </th>
                      <th className="px-5 py-3 text-right text-[11px] uppercase tracking-wider text-slate-400">
                        Opening
                      </th>
                      <th className="px-5 py-3 text-right text-[11px] uppercase tracking-wider text-slate-400">
                        Debit
                      </th>
                      <th className="px-5 py-3 text-right text-[11px] uppercase tracking-wider text-slate-400">
                        Credit
                      </th>
                      <th className="px-5 py-3 text-right text-[11px] uppercase tracking-wider text-slate-400">
                        Closing
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {ledgerAccounts.map((account) => (
                      <tr
                        key={account.id}
                        onClick={() => setSelectedAccount(account)}
                        className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer"
                      >
                        <td className="px-5 py-4 font-mono text-xs text-slate-500">
                          {account.code}
                        </td>

                        <td className="px-5 py-4">
                          <span className="font-medium">{account.name}</span>
                        </td>

                        <td className="px-5 py-4">
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600">
                            {account.type}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-right">
                          {formatCurrency(account.opening)}
                        </td>

                        <td className="px-5 py-4 text-right">
                          {formatCurrency(account.debit)}
                        </td>

                        <td className="px-5 py-4 text-right">
                          {formatCurrency(account.credit)}
                        </td>

                        <td className="px-5 py-4 text-right font-semibold">
                          {formatCurrency(account.closing)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          )}

          {/* ============================================================
              JOURNAL REGISTER
          ============================================================ */}

          {activeTab === "journals" && (
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  {
                    title: "Journal Vouchers",
                    count: 182,
                    amount: "₹42.85 L",
                    icon: BookOpen,
                  },
                  {
                    title: "Payment Vouchers",
                    count: 74,
                    amount: "₹21.45 L",
                    icon: ArrowUpRight,
                  },
                  {
                    title: "Receipt Vouchers",
                    count: 46,
                    amount: "₹18.72 L",
                    icon: ArrowDownLeft,
                  },
                ].map((item) => {
                  const Icon = item.icon;

                  return (
                    <Card
                      key={item.title}
                      className="border border-slate-200 shadow-none rounded-2xl"
                    >
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-sm font-medium text-slate-700">
                              {item.title}
                            </p>

                            <p className="text-2xl font-semibold mt-2">
                              {item.count}
                            </p>

                            <p className="text-xs text-slate-400 mt-1">
                              {item.amount} posted
                            </p>
                          </div>

                          <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center">
                            <Icon className="h-5 w-5 text-slate-600" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              <div className="mt-6 border rounded-2xl overflow-hidden">
                <div className="px-5 py-4 border-b bg-slate-50">
                  <h3 className="text-sm font-semibold">
                    Recent Journal Register
                  </h3>
                </div>

                <div className="divide-y">
                  {transactions.slice(0, 6).map((tx) => (
                    <div
                      key={tx.id}
                      className="px-5 py-4 flex items-center justify-between hover:bg-slate-50"
                    >
                      <div className="flex items-center gap-4">
                        <JournalBadge type={tx.journal} />

                        <div>
                          <p className="text-sm font-medium">{tx.reference}</p>
                          <p className="text-xs text-slate-400">
                            {tx.date} · {tx.description}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-5">
                        <StatusBadge status={tx.status} />
                        <ChevronRight className="h-4 w-4 text-slate-300" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          )}

          {/* ============================================================
              RECONCILIATION
          ============================================================ */}

          {activeTab === "reconciliation" && (
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border border-emerald-100 bg-emerald-50/50 shadow-none rounded-2xl">
                  <CardContent className="p-5">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />

                    <p className="mt-4 text-sm font-medium text-slate-700">
                      Reconciled
                    </p>

                    <p className="text-2xl font-semibold mt-1">₹32.48 L</p>

                    <p className="text-xs text-slate-500 mt-1">
                      184 transactions
                    </p>
                  </CardContent>
                </Card>

                <Card className="border border-amber-100 bg-amber-50/50 shadow-none rounded-2xl">
                  <CardContent className="p-5">
                    <Clock3 className="h-5 w-5 text-amber-600" />

                    <p className="mt-4 text-sm font-medium text-slate-700">
                      Pending
                    </p>

                    <p className="text-2xl font-semibold mt-1">₹3.42 L</p>

                    <p className="text-xs text-slate-500 mt-1">
                      14 transactions
                    </p>
                  </CardContent>
                </Card>

                <Card className="border border-red-100 bg-red-50/50 shadow-none rounded-2xl">
                  <CardContent className="p-5">
                    <AlertCircle className="h-5 w-5 text-red-600" />

                    <p className="mt-4 text-sm font-medium text-slate-700">
                      Exceptions
                    </p>

                    <p className="text-2xl font-semibold mt-1">3</p>

                    <p className="text-xs text-slate-500 mt-1">
                      Require accounting review
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="mt-6 border border-slate-200 rounded-2xl overflow-hidden">
                <div className="px-5 py-4 border-b bg-slate-50 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold">
                      Reconciliation Queue
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Transactions requiring action
                    </p>
                  </div>

                  <Button size="sm" variant="outline" className="rounded-lg">
                    <Filter className="h-3.5 w-3.5 mr-2" />
                    Filter
                  </Button>
                </div>

                <div className="divide-y">
                  {[
                    ["Bank statement mismatch", "₹1,25,000", "Cash & Bank"],
                    [
                      "Unmatched supplier payment",
                      "₹86,500",
                      "Accounts Payable",
                    ],
                    [
                      "Pending client receipt",
                      "₹1,30,000",
                      "Accounts Receivable",
                    ],
                  ].map(([title, amount, account]) => (
                    <div
                      key={title}
                      className="px-5 py-4 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-amber-50 flex items-center justify-center">
                          <AlertCircle className="h-4 w-4 text-amber-600" />
                        </div>

                        <div>
                          <p className="text-sm font-medium">{title}</p>
                          <p className="text-xs text-slate-400">{account}</p>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="font-semibold text-sm">{amount}</p>
                        <button className="text-xs text-emerald-700 font-medium">
                          Review
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          )}
        </Card>
      </main>

      {/* ================================================================
          TRANSACTION DETAIL SHEET
      ================================================================ */}

      <Sheet
        open={!!selectedTransaction}
        onOpenChange={(open) => {
          if (!open) setSelectedTransaction(null);
        }}
      >
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          {selectedTransaction && (
            <>
              <SheetHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <SheetTitle className="text-xl">Ledger Entry</SheetTitle>

                    <p className="text-xs text-slate-400 mt-1">
                      {selectedTransaction.reference}
                    </p>
                  </div>

                  <StatusBadge status={selectedTransaction.status} />
                </div>
              </SheetHeader>

              <div className="mt-8 space-y-6">
                <div className="rounded-2xl border border-slate-200 p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-slate-400 uppercase tracking-wider">
                        Entry Value
                      </p>

                      <p className="text-2xl font-semibold mt-1">
                        {formatCurrency(
                          Math.max(
                            selectedTransaction.debit,
                            selectedTransaction.credit,
                          ),
                        )}
                      </p>
                    </div>

                    <div className="h-11 w-11 rounded-xl bg-slate-100 flex items-center justify-center">
                      <Receipt className="h-5 w-5 text-slate-600" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-400">Date</p>
                    <p className="text-sm font-medium mt-1">
                      {selectedTransaction.date}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-400">Journal</p>
                    <div className="mt-1">
                      <JournalBadge type={selectedTransaction.journal} />
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-slate-400">Account</p>
                    <p className="text-sm font-medium mt-1">
                      {selectedTransaction.account}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-400">Account Code</p>
                    <p className="text-sm font-medium mt-1">
                      {selectedTransaction.accountCode}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-400">Project</p>
                    <p className="text-sm font-medium mt-1">
                      {selectedTransaction.project}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-400">Source</p>
                    <p className="text-sm font-medium mt-1">
                      {selectedTransaction.source}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider">
                    Description
                  </p>

                  <div className="mt-2 rounded-xl bg-slate-50 p-4 text-sm text-slate-700">
                    {selectedTransaction.description}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 overflow-hidden">
                  <div className="px-4 py-3 bg-slate-50 border-b">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Accounting Impact
                    </p>
                  </div>

                  <div className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-500">Debit</span>

                      <span className="font-semibold">
                        {formatCurrency(selectedTransaction.debit)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-500">Credit</span>

                      <span className="font-semibold">
                        {formatCurrency(selectedTransaction.credit)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    className="flex-1 rounded-xl"
                    style={{
                      backgroundColor: PRIMARY,
                    }}
                  >
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit Entry
                  </Button>

                  <Button variant="outline" className="rounded-xl">
                    <Printer className="h-4 w-4 mr-2" />
                    Print
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* ================================================================
          ACCOUNT DETAIL SHEET
      ================================================================ */}

      <Sheet
        open={!!selectedAccount}
        onOpenChange={(open) => {
          if (!open) setSelectedAccount(null);
        }}
      >
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          {selectedAccount && (
            <>
              <SheetHeader>
                <SheetTitle>{selectedAccount.name}</SheetTitle>
                <p className="text-xs text-slate-400">
                  {selectedAccount.code} · {selectedAccount.type}
                </p>
              </SheetHeader>

              <div className="mt-8 space-y-5">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs text-slate-400">Opening Balance</p>
                    <p className="text-lg font-semibold mt-1">
                      {formatCurrency(selectedAccount.opening)}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs text-slate-400">Closing Balance</p>
                    <p className="text-lg font-semibold mt-1">
                      {formatCurrency(selectedAccount.closing)}
                    </p>
                  </div>
                </div>

                <div className="border rounded-2xl overflow-hidden">
                  <div className="grid grid-cols-2">
                    <div className="p-4 border-r">
                      <p className="text-xs text-slate-400">Total Debit</p>
                      <p className="text-lg font-semibold mt-1">
                        {formatCurrency(selectedAccount.debit)}
                      </p>
                    </div>

                    <div className="p-4">
                      <p className="text-xs text-slate-400">Total Credit</p>
                      <p className="text-lg font-semibold mt-1">
                        {formatCurrency(selectedAccount.credit)}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold">Recent Activity</h3>

                    <button className="text-xs font-medium text-emerald-700">
                      View ledger
                    </button>
                  </div>

                  <div className="space-y-2">
                    {transactions
                      .filter((tx) => tx.accountCode === selectedAccount.code)
                      .map((tx) => (
                        <div
                          key={tx.id}
                          className="rounded-xl border border-slate-200 p-3"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium">
                                {tx.description}
                              </p>
                              <p className="text-xs text-slate-400 mt-1">
                                {tx.date} · {tx.reference}
                              </p>
                            </div>

                            <p className="text-sm font-semibold">
                              {formatCurrency(tx.debit || tx.credit)}
                            </p>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
