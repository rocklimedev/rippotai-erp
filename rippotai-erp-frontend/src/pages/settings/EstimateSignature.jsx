import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api"; // no RTK slice provided for this endpoint yet
import { ShieldAlert, Upload } from "lucide-react";
import { useLazyMeQuery } from "../../api/auth.api";

export default function EstimateSignature() {
  const { user } = useAuth();
  const nav = useNavigate();

  const [sigName, setSigName] = useState("");
  const [currentSig, setCurrentSig] = useState({ url: "", name: "" });
  const [sigPreview, setSigPreview] = useState(null);
  const [sigFile, setSigFile] = useState(null);
  const [sigSaving, setSigSaving] = useState(false);

  const [fetchMe] = useLazyMeQuery();

  useEffect(() => {
    if (user) {
      fetchMe()
        .unwrap()
        .then((data) => {
          setSigName(data?.estimate_signature_name || data?.name || "");
          setCurrentSig({
            url: data?.estimate_signature_url || "",
            name: data?.estimate_signature_name || "",
          });
        })
        .catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const readFile = (f) =>
    new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () =>
        res({ mime: f.type, b64: String(r.result).split(",")[1] || "" });
      r.onerror = rej;
      r.readAsDataURL(f);
    });

  const onSigPick = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 2 * 1024 * 1024) return toast.error("Max 2 MB");
    setSigFile(f);
    const rd = new FileReader();
    rd.onload = () => setSigPreview(String(rd.result));
    rd.readAsDataURL(f);
  };

  const saveSignature = async () => {
    // NOTE: no RTK slice endpoint was provided for /users/me/signature,
    // so this still goes through the plain axios `api` client.
    if (!sigFile) return toast.error("Choose a signature image");
    setSigSaving(true);
    try {
      const { b64, mime } = await readFile(sigFile);
      const { data } = await api.post("/users/me/signature", {
        name: sigName.trim() || user?.name,
        image_b64: b64,
        mime,
      });
      toast.success("Signature saved");
      setCurrentSig({ url: data.signature_url, name: data.name });
      setSigFile(null);
      setSigPreview(null);
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Save failed");
    } finally {
      setSigSaving(false);
    }
  };

  if (user?.role !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-12 h-12 rounded-full bg-[#F1D9D3] flex items-center justify-center mx-auto mb-4">
          <ShieldAlert size={22} className="text-[#7A2E1A]" />
        </div>
        <div className="text-xl font-semibold mb-2">Admin only</div>
        <p className="text-[#6B7B7C] mb-6">
          Signature setup is available to admins only.
        </p>
        <button
          onClick={() => nav("/dashboard")}
          className="h-10 px-5 rounded-lg text-white text-sm font-semibold"
          style={{ backgroundColor: "#1F453B" }}
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="text-[11px] uppercase tracking-widest text-[#B5C4B6]">
          SETTINGS
        </div>
        <h1 className="text-4xl font-bold text-[#333333]">
          Estimate Approval Signature
        </h1>
        <p className="text-[#6B7B7C] mt-1">
          This signature appears on estimates approved by you.
        </p>
      </div>

      {currentSig.url && (
        <div className="bg-white border border-[#DDD8CE] rounded-2xl p-5">
          <div className="text-xs uppercase tracking-widest text-[#B5C4B6] font-semibold mb-2">
            CURRENT
          </div>
          <img
            src={currentSig.url}
            alt="current signature"
            className="max-h-16 border border-[#EAEEF0] rounded-md bg-[#FAF8F5] p-2"
          />
          <div className="text-sm font-semibold text-[#333333] mt-2">
            {currentSig.name || "—"}
          </div>
        </div>
      )}

      <div className="bg-white border border-[#DDD8CE] rounded-2xl p-5 space-y-4">
        <div>
          <label className="text-xs font-semibold text-[#333333] mb-1 block">
            Display Name
          </label>
          <input
            value={sigName}
            onChange={(e) => setSigName(e.target.value)}
            placeholder="e.g. Deepak Rao — Principal Architect"
            className="h-10 w-full px-3 rounded-lg border border-[#DDD8CE] bg-[#FAF8F5] text-sm"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-[#333333] mb-1 block">
            Signature Image (PNG / JPG, transparent recommended)
          </label>
          <label className="inline-flex items-center gap-2 h-10 px-4 rounded-lg border border-[#1F453B] text-[#333333] text-sm font-semibold cursor-pointer">
            <Upload size={14} /> Choose file
            <input
              type="file"
              accept="image/png,image/jpeg"
              className="hidden"
              onChange={onSigPick}
            />
          </label>
          {sigPreview && (
            <div className="mt-3">
              <img
                src={sigPreview}
                alt="preview"
                className="max-h-20 border border-[#EAEEF0] rounded-md bg-[#FAF8F5] p-2"
              />
            </div>
          )}
        </div>
        <div className="flex justify-end">
          <button
            disabled={sigSaving || !sigFile}
            onClick={saveSignature}
            className="h-10 px-5 rounded-lg bg-[#1F453B] text-white text-sm font-semibold disabled:opacity-60"
          >
            {sigSaving ? "Saving…" : "Save Signature"}
          </button>
        </div>
      </div>
    </div>
  );
}
