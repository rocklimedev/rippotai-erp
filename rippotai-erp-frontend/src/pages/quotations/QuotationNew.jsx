import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { X, Plus, Copy, Trash2, GripVertical, Search } from "lucide-react";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const UNITS = [
  "Sq.ft",
  "Sq.m",
  "Rft",
  "Nos",
  "Lump",
  "Set",
  "Kg",
  "Point",
  "Day",
  "Month",
];
const DEFAULT_TERMS = `1. Rates are inclusive of labour and material unless specified otherwise.\n2. GST is extra as applicable.\n3. Any item outside this estimate will be charged as per actuals after mutual approval.\n4. A 50% advance is required to commence work; the balance will be billed progressively.`;

const iso = () => new Date().toISOString().slice(0, 10);
const uid = () => Math.random().toString(36).slice(2, 10);
const fmt = (n) =>
  (n || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 });

function Card({ label, children }) {
  return (
    <div className="bg-white border border-[#DDD8CE] rounded-2xl p-5 shadow-[0_1px_2px_rgba(20,20,20,.04)]">
      {label && (
        <div className="text-[11px] uppercase tracking-widest text-[#B5C4B6] font-semibold mb-3">
          {label}
        </div>
      )}
      {children}
    </div>
  );
}
const Field = ({ label, required, children }) => (
  <div>
    <label className="text-[12px] font-semibold text-[#333333] mb-1 block">
      {label}
      {required && <span className="text-[#B04D26] ml-0.5">*</span>}
    </label>
    {children}
  </div>
);
const Input = (props) => (
  <input
    {...props}
    className={`h-10 w-full px-3 rounded-lg border border-[#DDD8CE] bg-[#FAF8F5] text-[13.5px] disabled:opacity-70 disabled:cursor-not-allowed ${props.className || ""}`}
  />
);

function ItemRow({ item, index, disabled, onChange, onDup, onDel }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  const amount = Number(item.rate || 0) * Number(item.qty || 0);
  return (
    <tr
      ref={setNodeRef}
      style={style}
      className="border-t border-[#EAEEF0]"
      data-testid={`estimate-row-${item.id}`}
    >
      <td className="px-1 py-1.5 text-center align-middle">
        <button
          {...attributes}
          {...listeners}
          disabled={disabled}
          className="p-1 cursor-grab text-[#B5C4B6] hover:text-[#333333]"
          data-testid={`row-drag-${item.id}`}
          aria-label="Drag to reorder"
        >
          <GripVertical size={14} />
        </button>
      </td>
      <td className="px-1 py-1.5 text-[12.5px] text-[#6B7B7C] text-center align-middle">
        {index + 1}
      </td>
      <td className="px-1 py-1.5">
        <Input
          disabled={disabled}
          value={item.particular}
          onChange={(e) => onChange(item.id, { particular: e.target.value })}
          placeholder="Item description"
          data-testid={`row-particular-${item.id}`}
        />
      </td>
      <td className="px-1 py-1.5">
        <Input
          disabled={disabled}
          type="number"
          step="0.01"
          value={item.rate}
          onChange={(e) =>
            onChange(item.id, { rate: parseFloat(e.target.value) || 0 })
          }
          className="text-right"
          data-testid={`row-rate-${item.id}`}
        />
      </td>
      <td className="px-1 py-1.5">
        <Input
          disabled={disabled}
          type="number"
          step="0.01"
          value={item.qty}
          onChange={(e) =>
            onChange(item.id, { qty: parseFloat(e.target.value) || 0 })
          }
          className="text-right"
          data-testid={`row-qty-${item.id}`}
        />
      </td>
      <td className="px-1 py-1.5">
        <select
          disabled={disabled}
          value={item.unit}
          onChange={(e) => onChange(item.id, { unit: e.target.value })}
          className="h-10 w-full px-2 rounded-lg border border-[#DDD8CE] bg-[#FAF8F5] text-[13px]"
          data-testid={`row-unit-${item.id}`}
        >
          {UNITS.map((u) => (
            <option key={u}>{u}</option>
          ))}
        </select>
      </td>
      <td className="px-2 py-1.5 text-right text-[13px] font-semibold text-[#333333] whitespace-nowrap">
        ₹ {fmt(amount)}
      </td>
      <td className="px-1 py-1.5">
        <Input
          disabled={disabled}
          value={item.remarks}
          onChange={(e) => onChange(item.id, { remarks: e.target.value })}
          placeholder="Remarks"
          data-testid={`row-remarks-${item.id}`}
        />
      </td>
      <td className="px-1 py-1.5 text-center whitespace-nowrap">
        <button
          disabled={disabled}
          onClick={() => onDup(item.id)}
          className="p-1 text-[#6B7B7C] hover:text-[#333333] disabled:opacity-40"
          title="Duplicate row"
          data-testid={`row-dup-${item.id}`}
        >
          <Copy size={14} />
        </button>
        <button
          disabled={disabled}
          onClick={() => onDel(item.id)}
          className="p-1 text-[#B04D26] hover:text-[#7A2E1A] disabled:opacity-40"
          title="Delete row"
          data-testid={`row-del-${item.id}`}
        >
          <Trash2 size={14} />
        </button>
      </td>
    </tr>
  );
}

export default function EstimateNew() {
  const nav = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  // Basic
  const [estimateNumber, setEstimateNumber] = useState("");
  const [estimateDate, setEstimateDate] = useState(iso());
  // Vendor
  const [vendorSearch, setVendorSearch] = useState("");
  const [vendorResults, setVendorResults] = useState([]);
  const [vendor, setVendor] = useState(null);
  const [showNewVendor, setShowNewVendor] = useState(false);
  // Project
  const [projectSearch, setProjectSearch] = useState("");
  const [projectResults, setProjectResults] = useState([]);
  const [project, setProject] = useState(null);
  // Items
  const [items, setItems] = useState([
    { id: uid(), particular: "", rate: 0, qty: 1, unit: "Nos", remarks: "" },
  ]);
  // Totals
  const [addlAmt, setAddlAmt] = useState(0);
  const [addlIsPct, setAddlIsPct] = useState(false);
  const [discAmt, setDiscAmt] = useState(0);
  const [discIsPct, setDiscIsPct] = useState(false);
  const [taxPct, setTaxPct] = useState(0);
  // T&C + approval + status
  const [terms, setTerms] = useState(DEFAULT_TERMS);
  const [busy, setBusy] = useState(false);
  const [approval, setApproval] = useState({
    approved_by_name: "",
    approved_by_signature_url: "",
    approved_at: "",
  });
  const [status, setStatus] = useState("draft");
  const readOnly = status === "approved" && !isAdmin;

  // Vendor search
  useEffect(() => {
    const t = setTimeout(() => {
      const q = vendorSearch.trim();
      api
        .get(`/vendors${q ? `?q=${encodeURIComponent(q)}` : "?limit=20"}`)
        .then((r) => setVendorResults(r.data || []))
        .catch(() => setVendorResults([]));
    }, 200);
    return () => clearTimeout(t);
  }, [vendorSearch]);
  // Project search
  useEffect(() => {
    const t = setTimeout(() => {
      const q = projectSearch.trim();
      api
        .get(`/projects${q ? `?q=${encodeURIComponent(q)}` : "?limit=20"}`)
        .then((r) => setProjectResults(r.data || []))
        .catch(() => setProjectResults([]));
    }, 200);
    return () => clearTimeout(t);
  }, [projectSearch]);

  // Recompute estimate number whenever project or date changes
  const refreshEstimateNumber = useCallback((pid, d) => {
    if (!pid || !d) {
      setEstimateNumber("");
      return;
    }
    api
      .get(`/estimate/next-number?project_id=${pid}&date=${d}`)
      .then((r) => setEstimateNumber(r.data.estimate_number))
      .catch(() => {});
  }, []);
  useEffect(() => {
    if (project) refreshEstimateNumber(project.id, estimateDate);
  }, [project, estimateDate, refreshEstimateNumber]);

  // Totals
  const subtotal = useMemo(
    () =>
      items.reduce((s, i) => s + Number(i.rate || 0) * Number(i.qty || 0), 0),
    [items],
  );
  const addlResolved = addlIsPct
    ? (subtotal * (Number(addlAmt) || 0)) / 100
    : Number(addlAmt) || 0;
  const discResolved = discIsPct
    ? (subtotal * (Number(discAmt) || 0)) / 100
    : Number(discAmt) || 0;
  const taxable = subtotal + addlResolved - discResolved;
  const taxAmount = (taxable * (Number(taxPct) || 0)) / 100;
  const grandTotal = taxable + taxAmount;

  // Item actions
  const setItem = (id, patch) =>
    setItems((list) => list.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  const dupItem = (id) =>
    setItems((list) => {
      const idx = list.findIndex((x) => x.id === id);
      if (idx < 0) return list;
      const clone = { ...list[idx], id: uid() };
      return [...list.slice(0, idx + 1), clone, ...list.slice(idx + 1)];
    });
  const delItem = (id) =>
    setItems((list) =>
      list.length === 1 ? list : list.filter((i) => i.id !== id),
    );
  const addItem = () =>
    setItems((list) => [
      ...list,
      { id: uid(), particular: "", rate: 0, qty: 1, unit: "Nos", remarks: "" },
    ]);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );
  const onDragEnd = (e) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    setItems((list) => {
      const oldI = list.findIndex((x) => x.id === active.id);
      const newI = list.findIndex((x) => x.id === over.id);
      return arrayMove(list, oldI, newI);
    });
  };

  const submit = async (targetStatus = "awaiting_approval") => {
    if (!project) return toast.error("Select a project");
    if (!vendor) return toast.error("Select or create a vendor");
    if (items.every((i) => !i.particular?.trim()))
      return toast.error("Add at least one item");
    setBusy(true);
    try {
      const { data } = await api.post("/quotations", {
        project_id: project.id,
        vendor_id: vendor.id,
        title: `Estimate — ${project.name}`,
        quotation_number: estimateNumber || undefined,
        quotation_date: estimateDate,
      });
      const qid = data.id;
      const rows = items
        .filter((i) => i.particular?.trim())
        .map((i) => ({
          description: i.particular,
          unit: i.unit,
          quantity: Number(i.qty) || 0,
          rate: Number(i.rate) || 0,
          remarks: i.remarks || "",
        }));
      if (rows.length)
        await api.post(`/quotations/${qid}/items/bulk`, { items: rows });
      await api.patch(`/quotations/${qid}`, {
        commercial_terms: { ...(project ? {} : {}), special_conditions: terms },
        additional_charges: addlAmt
          ? [
              {
                label: addlIsPct ? "Additional (%)" : "Additional (₹)",
                amount: addlResolved,
              },
            ]
          : [],
        discount: discResolved,
        tax_config: `GST ${taxPct}%`,
      });
      if (targetStatus === "awaiting_approval") {
        try {
          await api.post(`/quotations/${qid}/send-to-reviewer`);
        } catch {}
      }
      toast.success("Estimate saved");
      nav(`/quotations/${qid}`);
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Failed to save estimate");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="max-w-[1200px] mx-auto py-6 px-4 space-y-4"
      data-testid="create-estimate-page"
    >
      <div className="flex items-center justify-between">
        <h1 className="text-[40px] font-bold text-[#333333]">
          Create Estimate
        </h1>
        <button
          onClick={() => nav("/quotations")}
          className="text-[13px] text-[#6B7B7C] hover:text-[#333333] inline-flex items-center gap-1"
          data-testid="cancel-btn"
        >
          <X size={14} /> Cancel
        </button>
      </div>

      {/* Card A — Basic */}
      <Card label="Basic Information">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Estimate Number">
            <Input
              disabled
              value={estimateNumber}
              placeholder="Auto-generated after project & date"
              data-testid="estimate-number"
            />
          </Field>
          <Field label="Estimate Date" required>
            <Input
              type="date"
              value={estimateDate}
              onChange={(e) => setEstimateDate(e.target.value)}
              disabled={readOnly}
              data-testid="estimate-date"
            />
          </Field>
          <div className="md:col-span-2">
            <Field label="Vendor" required>
              {vendor ? (
                <div className="flex items-center gap-2">
                  <div
                    className="flex-1 h-10 px-3 rounded-lg border border-[#DDD8CE] bg-[#FAF8F5] text-[13.5px] flex items-center font-semibold"
                    data-testid="vendor-selected"
                  >
                    {vendor.company || vendor.name}{" "}
                    <span className="text-[#6B7B7C] ml-2 font-normal">
                      · {vendor.primary_category || vendor.category || "—"}
                    </span>
                  </div>
                  <button
                    disabled={readOnly}
                    onClick={() => {
                      setVendor(null);
                      setVendorSearch("");
                    }}
                    className="h-10 px-3 rounded-lg border border-[#DDD8CE] text-[12.5px] font-semibold text-[#333333]"
                  >
                    Change
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="flex-1 relative">
                    <Search
                      size={14}
                      className="absolute top-3 left-3 text-[#B5C4B6]"
                    />
                    <input
                      disabled={readOnly}
                      value={vendorSearch}
                      onChange={(e) => setVendorSearch(e.target.value)}
                      placeholder="Search vendor…"
                      className="h-10 w-full pl-9 pr-3 rounded-lg border border-[#DDD8CE] bg-[#FAF8F5] text-[13.5px]"
                      data-testid="vendor-search"
                    />
                    {vendorResults.length > 0 && vendorSearch && (
                      <div className="absolute z-10 top-11 left-0 right-0 max-h-[240px] overflow-y-auto bg-white border border-[#DDD8CE] rounded-lg shadow-md">
                        {vendorResults.slice(0, 8).map((v) => (
                          <button
                            key={v.id}
                            onClick={() => {
                              setVendor(v);
                              setVendorSearch("");
                            }}
                            className="w-full text-left px-3 py-2 hover:bg-[#EAEEF0] border-b border-[#EAEEF0] text-[13px]"
                            data-testid={`vendor-opt-${v.id}`}
                          >
                            <div className="font-semibold text-[#333333]">
                              {v.company || v.name}
                            </div>
                            <div className="text-[11.5px] text-[#6B7B7C]">
                              {v.primary_category || v.category || "—"} ·{" "}
                              {v.city || ""}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    disabled={readOnly}
                    onClick={() => setShowNewVendor(true)}
                    className="h-10 px-3 rounded-lg border border-[#1F453B] text-[#333333] hover:bg-[#EAEEF0] text-[13px] font-semibold inline-flex items-center gap-1"
                    data-testid="new-vendor-btn"
                  >
                    <Plus size={14} /> New Vendor
                  </button>
                </div>
              )}
            </Field>
          </div>
        </div>
      </Card>

      {/* Card B — Project */}
      <Card label="Project Information">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Project" required>
            {project ? (
              <div className="flex items-center gap-2">
                <div
                  className="flex-1 h-10 px-3 rounded-lg border border-[#DDD8CE] bg-[#FAF8F5] text-[13.5px] flex items-center font-semibold"
                  data-testid="project-selected"
                >
                  {project.name}
                </div>
                <button
                  disabled={readOnly}
                  onClick={() => setProject(null)}
                  className="h-10 px-3 rounded-lg border border-[#DDD8CE] text-[12.5px] font-semibold text-[#333333]"
                >
                  Change
                </button>
              </div>
            ) : (
              <div className="relative">
                <Search
                  size={14}
                  className="absolute top-3 left-3 text-[#B5C4B6]"
                />
                <input
                  disabled={readOnly}
                  value={projectSearch}
                  onChange={(e) => setProjectSearch(e.target.value)}
                  placeholder="Search project…"
                  className="h-10 w-full pl-9 pr-3 rounded-lg border border-[#DDD8CE] bg-[#FAF8F5] text-[13.5px]"
                  data-testid="project-search"
                />
                {projectResults.length > 0 && projectSearch && (
                  <div className="absolute z-10 top-11 left-0 right-0 max-h-[240px] overflow-y-auto bg-white border border-[#DDD8CE] rounded-lg shadow-md">
                    {projectResults.slice(0, 8).map((p) => (
                      <button
                        key={p.id}
                        onClick={() => {
                          setProject(p);
                          setProjectSearch("");
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-[#EAEEF0] border-b border-[#EAEEF0] text-[13px]"
                        data-testid={`project-opt-${p.id}`}
                      >
                        <div className="font-semibold text-[#333333]">
                          {p.name}
                        </div>
                        <div className="text-[11.5px] text-[#6B7B7C]">
                          {p.location || "—"}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </Field>
          <Field label="Site Location">
            <Input
              disabled
              value={project?.location || ""}
              placeholder="Auto-populated from project"
              data-testid="site-location"
            />
          </Field>
        </div>
      </Card>

      {/* Card C — Items */}
      <Card label="Estimate Items">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px] min-w-[900px]">
            <thead>
              <tr className="text-[10.5px] uppercase tracking-widest text-[#B5C4B6] bg-[#F3F3F1]">
                <th className="w-8"></th>
                <th className="w-8 text-center py-2">#</th>
                <th className="py-2">Particular</th>
                <th className="w-28 py-2 text-right">Rate (₹)</th>
                <th className="w-24 py-2 text-right">Qty</th>
                <th className="w-24 py-2">Unit</th>
                <th className="w-32 py-2 text-right">Amount (₹)</th>
                <th className="py-2">Remarks</th>
                <th className="w-20"></th>
              </tr>
            </thead>
            <DndContext
              sensors={sensors}
              onDragEnd={onDragEnd}
              collisionDetection={closestCenter}
            >
              <SortableContext
                items={items.map((i) => i.id)}
                strategy={verticalListSortingStrategy}
              >
                <tbody>
                  {items.map((it, idx) => (
                    <ItemRow
                      key={it.id}
                      item={it}
                      index={idx}
                      disabled={readOnly}
                      onChange={setItem}
                      onDup={dupItem}
                      onDel={delItem}
                    />
                  ))}
                </tbody>
              </SortableContext>
            </DndContext>
          </table>
        </div>
        <button
          disabled={readOnly}
          onClick={addItem}
          className="mt-3 text-[13px] font-semibold text-[#333333] hover:underline inline-flex items-center gap-1"
          data-testid="add-row-btn"
        >
          <Plus size={14} /> Add Row
        </button>

        {/* Totals — right aligned */}
        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div />
          <div className="space-y-2 text-[13.5px]" data-testid="totals-block">
            <div className="flex items-center justify-between border-b border-[#EAEEF0] pb-2">
              <div className="text-[#6B7B7C]">Subtotal</div>
              <div className="font-semibold text-[#333333]">
                ₹ {fmt(subtotal)}
              </div>
            </div>
            <div className="flex items-center justify-between gap-3">
              <div className="text-[#6B7B7C]">Additional Charges</div>
              <div className="flex items-center gap-1">
                <button
                  disabled={readOnly}
                  onClick={() => setAddlIsPct((v) => !v)}
                  className="h-8 w-10 rounded-md border border-[#DDD8CE] text-[12px] font-semibold text-[#333333]"
                  data-testid="addl-toggle"
                >
                  {addlIsPct ? "%" : "₹"}
                </button>
                <input
                  disabled={readOnly}
                  type="number"
                  value={addlAmt}
                  onChange={(e) => setAddlAmt(parseFloat(e.target.value) || 0)}
                  className="h-8 w-28 px-2 rounded-md border border-[#DDD8CE] bg-[#FAF8F5] text-[13px] text-right"
                  data-testid="addl-input"
                />
              </div>
            </div>
            <div className="flex items-center justify-between gap-3">
              <div className="text-[#6B7B7C]">Discount</div>
              <div className="flex items-center gap-1">
                <button
                  disabled={readOnly}
                  onClick={() => setDiscIsPct((v) => !v)}
                  className="h-8 w-10 rounded-md border border-[#DDD8CE] text-[12px] font-semibold text-[#333333]"
                  data-testid="disc-toggle"
                >
                  {discIsPct ? "%" : "₹"}
                </button>
                <input
                  disabled={readOnly}
                  type="number"
                  value={discAmt}
                  onChange={(e) => setDiscAmt(parseFloat(e.target.value) || 0)}
                  className="h-8 w-28 px-2 rounded-md border border-[#DDD8CE] bg-[#FAF8F5] text-[13px] text-right"
                  data-testid="disc-input"
                />
              </div>
            </div>
            <div className="flex items-center justify-between gap-3">
              <div className="text-[#6B7B7C]">Tax (%)</div>
              <input
                disabled={readOnly}
                type="number"
                value={taxPct}
                onChange={(e) => setTaxPct(parseFloat(e.target.value) || 0)}
                className="h-8 w-28 px-2 rounded-md border border-[#DDD8CE] bg-[#FAF8F5] text-[13px] text-right"
                data-testid="tax-input"
              />
            </div>
            <div className="flex items-center justify-between text-[#333333]">
              <div>Tax amount</div>
              <div>₹ {fmt(taxAmount)}</div>
            </div>
            <div className="flex items-center justify-between border-t-2 border-[#333333] pt-2 text-[16px]">
              <div className="font-bold text-[#333333]">Grand Total</div>
              <div
                className="font-bold text-[#333333]"
                data-testid="grand-total"
              >
                ₹ {fmt(grandTotal)}
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Card D — Terms */}
      <Card label="Terms & Conditions">
        <textarea
          disabled={readOnly}
          value={terms}
          onChange={(e) => setTerms(e.target.value)}
          rows={5}
          placeholder="Enter terms and conditions…"
          className="w-full px-3 py-2 rounded-lg border border-[#DDD8CE] bg-[#FAF8F5] text-[13.5px] leading-relaxed"
          data-testid="terms"
        />
      </Card>

      {/* Card E — Approval */}
      <Card label="Approval & Signature">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="text-[12px] font-semibold text-[#333333] mb-2">
              Approved By
            </div>
            <div
              className="border border-[#DDD8CE] rounded-lg p-4 min-h-[120px] bg-[#FAF8F5]"
              data-testid="approved-by-block"
            >
              {status === "approved" && approval.approved_by_signature_url ? (
                <>
                  <img
                    alt="signature"
                    src={approval.approved_by_signature_url}
                    className="max-h-14 mb-2"
                  />
                  <div className="text-[13px] font-semibold text-[#333333]">
                    {approval.approved_by_name}
                  </div>
                  <div className="text-[11.5px] text-[#6B7B7C]">
                    {(approval.approved_at || "").slice(0, 10)}
                  </div>
                </>
              ) : (
                <div className="text-[13px] text-[#B5C4B6] italic">—</div>
              )}
            </div>
          </div>
          <div>
            <div className="text-[12px] font-semibold text-[#333333] mb-2">
              Contractor&apos;s Sign
            </div>
            <div className="border border-[#DDD8CE] rounded-lg p-4 min-h-[120px] bg-[#FAF8F5] flex items-end">
              <div className="text-[11.5px] text-[#B5C4B6]">
                Signature block for print
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Bottom actions */}
      <div className="flex items-center gap-3 pt-2">
        <button
          disabled={busy || readOnly}
          onClick={() => submit("awaiting_approval")}
          className="h-11 px-6 rounded-xl bg-[#1F453B] text-white text-[13.5px] font-semibold disabled:opacity-60"
          data-testid="submit-approval-btn"
        >
          {busy ? "Saving…" : "Submit for Approval"}
        </button>
        <button
          disabled={busy || readOnly}
          onClick={() => submit("draft")}
          className="text-[13px] font-semibold text-[#6B7B7C] hover:text-[#333333] hover:underline"
          data-testid="save-draft-btn"
        >
          Save as Draft
        </button>
      </div>

      {showNewVendor && (
        <NewVendorModal
          onClose={() => setShowNewVendor(false)}
          onCreated={(v) => {
            setVendor(v);
            setShowNewVendor(false);
          }}
        />
      )}
    </div>
  );
}

function NewVendorModal({ onClose, onCreated }) {
  const [form, setForm] = useState({
    name: "",
    company: "",
    contact: "",
    email: "",
    primary_category: "General",
  });
  const [saving, setSaving] = useState(false);
  const save = async () => {
    if (!form.company.trim() && !form.name.trim())
      return toast.error("Company or name required");
    setSaving(true);
    try {
      const { data } = await api.post("/vendors", form);
      toast.success(`Vendor "${data.company || data.name}" added`);
      onCreated(data);
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Failed to add vendor");
    } finally {
      setSaving(false);
    }
  };
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-[480px] p-6"
        onClick={(e) => e.stopPropagation()}
        data-testid="new-vendor-modal"
      >
        <div className="text-[18px] font-semibold text-[#333333] mb-4">
          New Vendor
        </div>
        <div className="grid gap-3">
          <Field label="Company">
            <Input
              value={form.company}
              onChange={(e) => setForm({ ...form, company: e.target.value })}
              data-testid="nv-company"
            />
          </Field>
          <Field label="Contact name">
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              data-testid="nv-name"
            />
          </Field>
          <Field label="Phone">
            <Input
              value={form.contact}
              onChange={(e) => setForm({ ...form, contact: e.target.value })}
              data-testid="nv-phone"
            />
          </Field>
          <Field label="Email">
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              data-testid="nv-email"
            />
          </Field>
          <Field label="Primary Category">
            <select
              value={form.primary_category}
              onChange={(e) =>
                setForm({ ...form, primary_category: e.target.value })
              }
              className="h-10 w-full px-3 rounded-lg border border-[#DDD8CE] bg-[#FAF8F5] text-[13.5px]"
              data-testid="nv-category"
            >
              {[
                "General",
                "Civil",
                "Electrical",
                "Plumbing",
                "Carpentry",
                "Painting",
                "Flooring",
                "Fabrication",
                "Other",
              ].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </Field>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="h-10 px-4 rounded-lg border border-[#DDD8CE] text-[13px] font-semibold text-[#333333]"
          >
            Cancel
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="h-10 px-4 rounded-lg bg-[#1F453B] text-white text-[13px] font-semibold"
            data-testid="nv-save"
          >
            {saving ? "Saving…" : "Save Vendor"}
          </button>
        </div>
      </div>
    </div>
  );
}
