import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { ShieldAlert, Upload } from "lucide-react";

export default function EstimateSignature() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [name, setName] = useState("");
  const [current, setCurrent] = useState({ url: "", name: "" });
  const [preview, setPreview] = useState(null);
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api
      .get("/auth/me")
      .then((r) => {
        setName(r.data?.estimate_signature_name || r.data?.name || "");
        setCurrent({
          url: r.data?.estimate_signature_url || "",
          name: r.data?.estimate_signature_name || "",
        });
      })
      .catch(() => {});
  }, []);

  if (user && user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F7F5]">
        <div className="bg-white border border-[#DDD8CE] rounded-2xl px-10 py-12 max-w-md text-center">
          <div className="w-12 h-12 rounded-full bg-[#F1D9D3] flex items-center justify-center mx-auto mb-4">
            <ShieldAlert size={22} className="text-[#7A2E1A]" />
          </div>
          <div className="text-[18px] font-semibold text-[#333333] mb-2">
            Admin only
          </div>
          <div className="text-[13.5px] text-[#6B7B7C] mb-6">
            Signature setup is available to admins.
          </div>
          <button
            onClick={() => nav("/dashboard")}
            className="h-10 px-5 rounded-lg text-white text-[13px] font-semibold"
            style={{ backgroundColor: "#1F453B" }}
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const readFile = (f) =>
    new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () =>
        res({ mime: f.type, b64: String(r.result).split(",")[1] || "" });
      r.onerror = rej;
      r.readAsDataURL(f);
    });

  const onPick = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 2 * 1024 * 1024) return toast.error("Max 2 MB");
    setFile(f);
    const rd = new FileReader();
    rd.onload = () => setPreview(String(rd.result));
    rd.readAsDataURL(f);
  };

  const save = async () => {
    if (!file) return toast.error("Choose a signature image");
    setSaving(true);
    try {
      const { b64, mime } = await readFile(file);
      const { data } = await api.post("/users/me/signature", {
        name: name.trim() || user?.name,
        image_b64: b64,
        mime,
      });
      toast.success("Signature saved");
      setCurrent({ url: data.signature_url, name: data.name });
      setFile(null);
      setPreview(null);
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-[#F7F7F5] px-8 py-8"
      data-testid="estimate-signature-page"
    >
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <div className="text-[11px] uppercase tracking-widest text-[#B5C4B6]">
            Settings
          </div>
          <h1 className="text-[40px] font-bold text-[#333333]">
            Estimate Approval Signature
          </h1>
          <p className="text-[13.5px] text-[#6B7B7C] mt-1">
            This signature appears on estimates approved by you.
          </p>
        </div>

        {current.url && (
          <div className="bg-white border border-[#DDD8CE] rounded-2xl p-5">
            <div className="text-[12px] uppercase tracking-widest text-[#B5C4B6] font-semibold mb-2">
              Current
            </div>
            <img
              alt="current signature"
              src={current.url}
              className="max-h-16 border border-[#EAEEF0] rounded-md bg-[#FAF8F5] p-2"
            />
            <div className="text-[13px] font-semibold text-[#333333] mt-2">
              {current.name || "—"}
            </div>
          </div>
        )}

        <div className="bg-white border border-[#DDD8CE] rounded-2xl p-5 space-y-4">
          <div>
            <label className="text-[12px] font-semibold text-[#333333] mb-1 block">
              Display Name
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Deepak Rao — Principal Architect"
              className="h-10 w-full px-3 rounded-lg border border-[#DDD8CE] bg-[#FAF8F5] text-[13.5px]"
              data-testid="sig-name"
            />
          </div>
          <div>
            <label className="text-[12px] font-semibold text-[#333333] mb-1 block">
              Signature Image (PNG / JPG, transparent PNG recommended)
            </label>
            <label className="inline-flex items-center gap-2 h-10 px-4 rounded-lg border border-[#1F453B] text-[#333333] text-[13px] font-semibold cursor-pointer">
              <Upload size={14} /> Choose file
              <input
                type="file"
                accept="image/png,image/jpeg"
                className="hidden"
                onChange={onPick}
                data-testid="sig-file"
              />
            </label>
            {preview && (
              <div className="mt-3">
                <img
                  alt="preview"
                  src={preview}
                  className="max-h-20 border border-[#EAEEF0] rounded-md bg-[#FAF8F5] p-2"
                />
              </div>
            )}
          </div>
          <div className="flex justify-end">
            <button
              disabled={saving || !file}
              onClick={save}
              className="h-10 px-5 rounded-lg bg-[#1F453B] text-white text-[13px] font-semibold disabled:opacity-60"
              data-testid="sig-save"
            >
              {saving ? "Saving…" : "Save Signature"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
