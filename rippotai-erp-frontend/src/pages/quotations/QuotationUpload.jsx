import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { toast } from "sonner";
import { ArrowLeft, Upload } from "lucide-react";

export default function QuotationUpload() {
  const nav = useNavigate();
  const [projects, setProjects] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [form, setForm] = useState({
    project_id: "",
    vendor_id: "",
    work_category: "",
    title: "",
    quotation_date: new Date().toISOString().slice(0, 10),
    valid_until: "",
    total_amount: 0,
    tax_status: "GST 18%",
    notes: "",
    source: "uploaded",
  });
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.get("/projects?limit=20").then((r) => setProjects(r.data));
    api.get("/vendors?limit=100").then((r) => setVendors(r.data));
  }, []);

  const save = async (convert) => {
    if (!form.project_id || !form.vendor_id) {
      toast.error("Select project & vendor");
      return;
    }
    setBusy(true);
    try {
      const payload = {
        ...form,
        source: "uploaded",
        subtotals: {
          base: form.total_amount,
          tax: 0,
          transport: 0,
          installation: 0,
          additional: 0,
          discount: 0,
          total: form.total_amount,
        },
      };
      const { data } = await api.post("/quotations", payload);
      // Update subtotals since backend init overrides them
      await api.patch(`/quotations/${data.id}`, {
        subtotals: {
          base: parseFloat(form.total_amount) || 0,
          tax: 0,
          transport: 0,
          installation: 0,
          additional: 0,
          discount: 0,
          total: parseFloat(form.total_amount) || 0,
        },
      });
      if (file) {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("kind", "quotation_document");
        await api.post(`/quotations/${data.id}/attachments`, fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }
      toast.success(convert ? "Uploaded — add items now" : "Uploaded");
      nav(`/quotations/${data.id}`);
    } catch (e) {
      toast.error("Upload failed");
    }
    setBusy(false);
  };

  return (
    <div className="max-w-[900px] mx-auto p-6">
      <button
        onClick={() => nav("/quotations")}
        className="text-[13px] text-[#6B7B7C] inline-flex items-center gap-1 mb-3"
        data-testid="btn-back"
      >
        <ArrowLeft size={14} /> Estimates
      </button>
      <h1 className="text-[36px] font-bold text-[#333333]">
        Upload External Estimate
      </h1>
      <p className="text-[13px] text-[#6B7B7C] mt-1">
        Record a quotation received offline (PDF, Excel, or image).
      </p>

      <div className="bg-white border border-[#B5C4B6] rounded-xl p-6 mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-[12px] font-semibold text-[#6B7B7C]">
            Project *
          </label>
          <select
            value={form.project_id}
            onChange={(e) => setForm({ ...form, project_id: e.target.value })}
            className="w-full mt-1 px-3 py-2 border border-[#B5C4B6] rounded-lg text-[13px] bg-[#EAEEF0]"
            data-testid="upload-project"
          >
            <option value="">Select…</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-[12px] font-semibold text-[#6B7B7C]">
            Vendor *
          </label>
          <select
            value={form.vendor_id}
            onChange={(e) => setForm({ ...form, vendor_id: e.target.value })}
            className="w-full mt-1 px-3 py-2 border border-[#B5C4B6] rounded-lg text-[13px] bg-[#EAEEF0]"
            data-testid="upload-vendor"
          >
            <option value="">Select…</option>
            {vendors.map((v) => (
              <option key={v.id} value={v.id}>
                {v.company || v.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-[12px] font-semibold text-[#6B7B7C]">
            Work Category
          </label>
          <input
            value={form.work_category}
            onChange={(e) =>
              setForm({ ...form, work_category: e.target.value })
            }
            className="w-full mt-1 px-3 py-2 border border-[#B5C4B6] rounded-lg text-[13px] bg-[#EAEEF0]"
          />
        </div>
        <div>
          <label className="text-[12px] font-semibold text-[#6B7B7C]">
            Title
          </label>
          <input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full mt-1 px-3 py-2 border border-[#B5C4B6] rounded-lg text-[13px] bg-[#EAEEF0]"
          />
        </div>
        <div>
          <label className="text-[12px] font-semibold text-[#6B7B7C]">
            Estimate Date
          </label>
          <input
            type="date"
            value={form.quotation_date}
            onChange={(e) =>
              setForm({ ...form, quotation_date: e.target.value })
            }
            className="w-full mt-1 px-3 py-2 border border-[#B5C4B6] rounded-lg text-[13px] bg-[#EAEEF0]"
          />
        </div>
        <div>
          <label className="text-[12px] font-semibold text-[#6B7B7C]">
            Valid Until
          </label>
          <input
            type="date"
            value={form.valid_until}
            onChange={(e) => setForm({ ...form, valid_until: e.target.value })}
            className="w-full mt-1 px-3 py-2 border border-[#B5C4B6] rounded-lg text-[13px] bg-[#EAEEF0]"
          />
        </div>
        <div>
          <label className="text-[12px] font-semibold text-[#6B7B7C]">
            Total Amount (₹)
          </label>
          <input
            type="number"
            value={form.total_amount}
            onChange={(e) => setForm({ ...form, total_amount: e.target.value })}
            className="w-full mt-1 px-3 py-2 border border-[#B5C4B6] rounded-lg text-[13px] bg-[#EAEEF0]"
            data-testid="upload-amount"
          />
        </div>
        <div>
          <label className="text-[12px] font-semibold text-[#6B7B7C]">
            Tax Status
          </label>
          <select
            value={form.tax_status}
            onChange={(e) => setForm({ ...form, tax_status: e.target.value })}
            className="w-full mt-1 px-3 py-2 border border-[#B5C4B6] rounded-lg text-[13px] bg-[#EAEEF0]"
          >
            {["GST 18%", "GST 12%", "GST 5%", "Exempt", "Inclusive of tax"].map(
              (t) => (
                <option key={t}>{t}</option>
              ),
            )}
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="text-[12px] font-semibold text-[#6B7B7C]">
            Upload File (PDF / Excel / Image, max 10MB)
          </label>
          <input
            type="file"
            accept=".pdf,.xlsx,.xls,.png,.jpg,.jpeg,.doc,.docx"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="w-full mt-1 px-3 py-2 border border-[#B5C4B6] rounded-lg text-[13px] bg-[#EAEEF0]"
            data-testid="upload-file"
          />
          {file && (
            <div className="text-[12px] text-[#6B7B7C] mt-1">
              {file.name} · {(file.size / 1024).toFixed(1)} KB
            </div>
          )}
        </div>
        <div className="md:col-span-2">
          <label className="text-[12px] font-semibold text-[#6B7B7C]">
            Internal Notes
          </label>
          <textarea
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            rows={3}
            className="w-full mt-1 px-3 py-2 border border-[#B5C4B6] rounded-lg text-[13px] bg-[#EAEEF0]"
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 mt-4">
        <button
          onClick={() => nav("/quotations")}
          className="px-4 py-2 rounded-lg border border-[#B5C4B6] text-[13px] font-semibold"
        >
          Cancel
        </button>
        <button
          onClick={() => save(false)}
          disabled={busy}
          className="px-4 py-2 rounded-lg border border-[#B5C4B6] bg-white text-[13px] font-semibold"
          data-testid="btn-save-uploaded"
        >
          Save as Uploaded
        </button>
        <button
          onClick={() => save(true)}
          disabled={busy}
          className="px-4 py-2 rounded-lg bg-[#1F453B] text-white text-[13px] font-semibold inline-flex items-center gap-1"
          data-testid="btn-convert-structured"
        >
          <Upload size={13} /> Convert to Structured
        </button>
      </div>
    </div>
  );
}
