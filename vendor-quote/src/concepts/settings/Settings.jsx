import React, { useState, useEffect, useRef } from "react";
import api, { formatApiError } from "../../utils/api";
import {
  Settings as SettingsIcon,
  Hash,
  FileText,
  Pen,
  Calculator,
  CheckCircle,
  Trash2,
  Upload,
  Eye,
} from "lucide-react";

const TABS = [
  { id: "numbering", label: "Quotation Numbering", icon: Hash },
  { id: "terms", label: "Terms & Conditions", icon: FileText },
  { id: "signature", label: "E-Signature", icon: Pen },
  { id: "amount", label: "Amount Settings", icon: Calculator },
];

export default function Settings() {
  const [tab, setTab] = useState("numbering");
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const sigFileRef = useRef();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/settings");
      setSettings(data);
    } catch (err) {
      console.error("Error fetching settings:", err);
    } finally {
      setLoading(false);
    }
  };

  const showSuccess = (msg) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(""), 3000);
  };
  const showError = (msg) => {
    setError(msg);
    setTimeout(() => setError(""), 4000);
  };

  const saveSettings = async (type, value) => {
    setSaving(true);
    try {
      await api.put("/settings", { type, value });
      setSettings((prev) => ({ ...prev, [type]: value }));
      showSuccess("Settings saved successfully");
    } catch (err) {
      showError(formatApiError(err));
    } finally {
      setSaving(false);
    }
  };

  const handleSignatureUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/jpg"].includes(file.type)) {
      showError("Only PNG or JPG files allowed");
      return;
    }
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = ev.target.result.split(",")[1];
      const sigForm = settings.signature || {};
      setSaving(true);
      try {
        await api.post("/settings/signature", {
          signature_base64: base64,
          signer_name: sigForm.signer_name || "",
          signer_designation: sigForm.signer_designation || "",
          auto_apply: sigForm.auto_apply !== false,
        });
        await fetchSettings();
        showSuccess("Signature uploaded");
      } catch (err) {
        showError(formatApiError(err));
      } finally {
        setSaving(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const deleteSignature = async () => {
    if (!window.confirm("Remove the signature?")) return;
    try {
      await api.delete("/settings/signature");
      await fetchSettings();
      showSuccess("Signature removed");
    } catch (err) {
      showError(formatApiError(err));
    }
  };

  const num = settings.numbering || {
    prefix: "QT",
    include_year: true,
    padding: 4,
  };
  const terms = settings.terms || { default_terms: "" };
  const sig = settings.signature || {};
  const amt = settings.amount_settings || {
    show_additional_charges: false,
    show_discount: false,
    show_tax: false,
    tax_percentage: 18,
  };

  if (loading)
    return <div className="p-6 text-sm text-gray-400">Loading settings...</div>;

  return (
    <div className="p-6">
      <div className="flex items-center gap-2 mb-5">
        <SettingsIcon className="w-5 h-5 text-[#333333]" />
        <h1 className="text-2xl font-bold text-[#333333]">Settings</h1>
      </div>

      {success && (
        <div
          data-testid="settings-success"
          className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-2 rounded mb-4 flex items-center gap-2"
        >
          <CheckCircle className="w-4 h-4" />
          {success}
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2 rounded mb-4">
          {error}
        </div>
      )}

      <div className="flex gap-5">
        {/* Sidebar Tabs */}
        <div className="w-48 flex-shrink-0">
          <div className="bg-white border border-[#E5E7EB] rounded-lg overflow-hidden">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm border-b border-[#F3F4F6] last:border-0 transition-colors ${tab === t.id ? "bg-red-50 text-[#E31E24] font-medium" : "text-gray-600 hover:bg-gray-50"}`}
              >
                <t.icon className="w-4 h-4" />
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1">
          {tab === "numbering" && (
            <div className="bg-white border border-[#E5E7EB] rounded-lg p-5">
              <h2 className="text-sm font-semibold text-[#333333] mb-4">
                Quotation Numbering Format
              </h2>
              <div className="space-y-4 max-w-md">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Prefix
                  </label>
                  <input
                    value={num.prefix}
                    onChange={(e) =>
                      setSettings((p) => ({
                        ...p,
                        numbering: { ...num, prefix: e.target.value },
                      }))
                    }
                    className="w-full border border-[#E5E7EB] rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#E31E24]"
                    placeholder="QT"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    E.g. QT, INV, REF
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Number Padding
                  </label>
                  <select
                    value={num.padding}
                    onChange={(e) =>
                      setSettings((p) => ({
                        ...p,
                        numbering: {
                          ...num,
                          padding: parseInt(e.target.value),
                        },
                      }))
                    }
                    className="w-full border border-[#E5E7EB] rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#E31E24]"
                  >
                    {[3, 4, 5, 6].map((n) => (
                      <option
                        key={n}
                        value={n}
                      >{`${n} digits (e.g. ${"0".repeat(n - 1)}1)`}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="include_year"
                    checked={num.include_year !== false}
                    onChange={(e) =>
                      setSettings((p) => ({
                        ...p,
                        numbering: { ...num, include_year: e.target.checked },
                      }))
                    }
                    className="rounded"
                  />
                  <label
                    htmlFor="include_year"
                    className="text-sm font-medium text-gray-700"
                  >
                    Include Year in Number
                  </label>
                </div>
                <div className="bg-gray-50 border border-[#E5E7EB] rounded px-3 py-2">
                  <div className="text-xs text-gray-500 mb-1">Preview</div>
                  <div className="font-mono text-sm font-medium text-[#E31E24]">
                    {num.prefix}-{num.include_year !== false ? "2026-" : ""}
                    {"1".padStart(num.padding || 4, "0")}
                  </div>
                </div>
                <button
                  data-testid="save-numbering-btn"
                  onClick={() => saveSettings("numbering", num)}
                  disabled={saving}
                  className="bg-[#E31E24] text-white text-sm font-medium px-5 py-2 rounded-md hover:bg-red-700 disabled:opacity-60"
                >
                  {saving ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          )}

          {tab === "terms" && (
            <div className="bg-white border border-[#E5E7EB] rounded-lg p-5">
              <h2 className="text-sm font-semibold text-[#333333] mb-4">
                Default Terms & Conditions
              </h2>
              <textarea
                value={terms.default_terms}
                onChange={(e) =>
                  setSettings((p) => ({
                    ...p,
                    terms: { ...terms, default_terms: e.target.value },
                  }))
                }
                rows={12}
                placeholder="Enter default terms and conditions..."
                className="w-full border border-[#E5E7EB] rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#E31E24] resize-y"
              />
              <p className="text-xs text-gray-400 mt-2">
                These terms will auto-populate in new quotations. They can be
                edited per-quotation.
              </p>
              <button
                data-testid="save-terms-btn"
                onClick={() => saveSettings("terms", terms)}
                disabled={saving}
                className="mt-3 bg-[#E31E24] text-white text-sm font-medium px-5 py-2 rounded-md hover:bg-red-700 disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save Terms"}
              </button>
            </div>
          )}

          {tab === "signature" && (
            <div className="bg-white border border-[#E5E7EB] rounded-lg p-5">
              <h2 className="text-sm font-semibold text-[#333333] mb-4">
                Approval E-Signature
              </h2>
              <div className="space-y-4 max-w-md">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Signer Name
                  </label>
                  <input
                    value={sig.signer_name || ""}
                    onChange={(e) =>
                      setSettings((p) => ({
                        ...p,
                        signature: { ...sig, signer_name: e.target.value },
                      }))
                    }
                    className="w-full border border-[#E5E7EB] rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#E31E24]"
                    placeholder="Admin Name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Designation
                  </label>
                  <input
                    value={sig.signer_designation || ""}
                    onChange={(e) =>
                      setSettings((p) => ({
                        ...p,
                        signature: {
                          ...sig,
                          signer_designation: e.target.value,
                        },
                      }))
                    }
                    className="w-full border border-[#E5E7EB] rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#E31E24]"
                    placeholder="e.g. Project Manager"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="auto_apply"
                    checked={sig.auto_apply !== false}
                    onChange={(e) =>
                      setSettings((p) => ({
                        ...p,
                        signature: { ...sig, auto_apply: e.target.checked },
                      }))
                    }
                    className="rounded"
                  />
                  <label
                    htmlFor="auto_apply"
                    className="text-sm font-medium text-gray-700"
                  >
                    Auto-apply signature on approval
                  </label>
                </div>

                {/* Signature Preview */}
                {sig.signature_base64 ? (
                  <div className="border border-[#E5E7EB] rounded-lg p-4 bg-gray-50">
                    <div className="text-xs text-gray-500 mb-2">
                      Current Signature
                    </div>
                    <img
                      src={`data:image/png;base64,${sig.signature_base64}`}
                      alt="Signature"
                      className="max-h-20 max-w-full object-contain"
                    />
                    <div className="flex gap-2 mt-3">
                      <button
                        data-testid="replace-signature-btn"
                        onClick={() => sigFileRef.current?.click()}
                        className="flex items-center gap-1.5 text-xs text-[#E31E24] border border-red-200 bg-white px-3 py-1.5 rounded hover:bg-red-50"
                      >
                        <Upload className="w-3.5 h-3.5" /> Replace
                      </button>
                      <button
                        onClick={deleteSignature}
                        className="flex items-center gap-1.5 text-xs text-gray-500 border border-[#E5E7EB] bg-white px-3 py-1.5 rounded hover:bg-gray-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => sigFileRef.current?.click()}
                    className="border-2 border-dashed border-[#E5E7EB] rounded-lg p-8 text-center cursor-pointer hover:border-[#E31E24] hover:bg-red-50/30 transition-colors"
                  >
                    <Upload className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <div className="text-sm text-gray-500">
                      Upload Signature
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      PNG or JPG, transparent background preferred
                    </div>
                  </div>
                )}

                <input
                  ref={sigFileRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg"
                  onChange={handleSignatureUpload}
                  className="hidden"
                  data-testid="signature-upload-input"
                />

                <button
                  data-testid="save-signature-settings-btn"
                  onClick={async () => {
                    if (sig.signature_base64) {
                      setSaving(true);
                      try {
                        await api.post("/settings/signature", {
                          signature_base64: sig.signature_base64,
                          signer_name: sig.signer_name || "",
                          signer_designation: sig.signer_designation || "",
                          auto_apply: sig.auto_apply !== false,
                        });
                        showSuccess("Signature settings saved");
                      } catch (err) {
                        showError(formatApiError(err));
                      } finally {
                        setSaving(false);
                      }
                    }
                  }}
                  disabled={saving || !sig.signature_base64}
                  className="bg-[#E31E24] text-white text-sm font-medium px-5 py-2 rounded-md hover:bg-red-700 disabled:opacity-60"
                >
                  {saving ? "Saving..." : "Save Settings"}
                </button>
              </div>
            </div>
          )}

          {tab === "amount" && (
            <div className="bg-white border border-[#E5E7EB] rounded-lg p-5">
              <h2 className="text-sm font-semibold text-[#333333] mb-4">
                Amount & Tax Settings
              </h2>
              <div className="space-y-4 max-w-md">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="show_additional_charges"
                    checked={amt.show_additional_charges || false}
                    onChange={(e) =>
                      setSettings((p) => ({
                        ...p,
                        amount_settings: {
                          ...amt,
                          show_additional_charges: e.target.checked,
                        },
                      }))
                    }
                    className="rounded"
                  />
                  <label
                    htmlFor="show_additional_charges"
                    className="text-sm font-medium text-gray-700"
                  >
                    Show Additional Charges field
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="show_discount"
                    checked={amt.show_discount || false}
                    onChange={(e) =>
                      setSettings((p) => ({
                        ...p,
                        amount_settings: {
                          ...amt,
                          show_discount: e.target.checked,
                        },
                      }))
                    }
                    className="rounded"
                  />
                  <label
                    htmlFor="show_discount"
                    className="text-sm font-medium text-gray-700"
                  >
                    Show Discount field
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="show_tax"
                    checked={amt.show_tax || false}
                    onChange={(e) =>
                      setSettings((p) => ({
                        ...p,
                        amount_settings: { ...amt, show_tax: e.target.checked },
                      }))
                    }
                    className="rounded"
                  />
                  <label
                    htmlFor="show_tax"
                    className="text-sm font-medium text-gray-700"
                  >
                    Enable Tax (GST)
                  </label>
                </div>
                {amt.show_tax && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tax Percentage (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={amt.tax_percentage || 18}
                      onChange={(e) =>
                        setSettings((p) => ({
                          ...p,
                          amount_settings: {
                            ...amt,
                            tax_percentage: Number(e.target.value),
                          },
                        }))
                      }
                      className="w-32 border border-[#E5E7EB] rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#E31E24]"
                    />
                  </div>
                )}
                <button
                  data-testid="save-amount-settings-btn"
                  onClick={() => saveSettings("amount_settings", amt)}
                  disabled={saving}
                  className="bg-[#E31E24] text-white text-sm font-medium px-5 py-2 rounded-md hover:bg-red-700 disabled:opacity-60"
                >
                  {saving ? "Saving..." : "Save Settings"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
