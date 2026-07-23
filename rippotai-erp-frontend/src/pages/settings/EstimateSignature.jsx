import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import { ShieldAlert, Upload } from "lucide-react";
import { useLazyMeQuery } from "../../api/auth.api";

export default function EstimateSignature() {
  const { user } = useAuth();
  const nav = useNavigate();

  const [fetchMe] = useLazyMeQuery();

  const [me, setMe] = useState(null);

  const [sigName, setSigName] = useState("");
  const [currentSig, setCurrentSig] = useState({
    url: "",
    name: "",
  });

  const [sigPreview, setSigPreview] = useState(null);
  const [sigFile, setSigFile] = useState(null);
  const [sigSaving, setSigSaving] = useState(false);

  useEffect(() => {
    if (!user) return;

    fetchMe()
      .unwrap()
      .then((res) => {
        // Supports both { user: {...} } and {...}
        const currentUser = res?.user || res;

        setMe(currentUser);

        setSigName(
          currentUser?.estimate_signature_name || currentUser?.name || "",
        );

        setCurrentSig({
          url: currentUser?.estimate_signature_url || "",
          name: currentUser?.estimate_signature_name || "",
        });
      })
      .catch(() => {
        toast.error("Failed to load user information.");
      });
  }, [user, fetchMe]);

  const readFile = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () =>
        resolve({
          mime: file.type,
          b64: String(reader.result).split(",")[1] || "",
        });

      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const onSigPick = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Maximum file size is 2 MB.");
      return;
    }

    setSigFile(file);

    const reader = new FileReader();

    reader.onload = () => {
      setSigPreview(String(reader.result));
    };

    reader.readAsDataURL(file);
  };

  const saveSignature = async () => {
    if (!sigFile) {
      toast.error("Please choose a signature image.");
      return;
    }

    setSigSaving(true);

    try {
      const { b64, mime } = await readFile(sigFile);

      const { data } = await api.post("/users/me/signature", {
        name: sigName.trim() || me?.name,
        image_b64: b64,
        mime,
      });

      toast.success("Signature saved successfully.");

      setCurrentSig({
        url: data.signature_url,
        name: data.name,
      });

      setSigPreview(null);
      setSigFile(null);
    } catch (error) {
      toast.error(error?.response?.data?.detail || "Unable to save signature.");
    } finally {
      setSigSaving(false);
    }
  };

  const isAdmin = me?.role?.toUpperCase() === "ADMIN";

  // Wait until user details are loaded
  if (!me) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-[#6B7B7C]">Loading...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-12 h-12 rounded-full bg-[#F1D9D3] flex items-center justify-center mb-4">
          <ShieldAlert size={22} className="text-[#7A2E1A]" />
        </div>

        <h2 className="text-2xl font-semibold text-[#333333]">Admin Only</h2>

        <p className="text-[#6B7B7C] mt-2 mb-6">
          Estimate Approval Signature can only be managed by administrators.
        </p>

        <button
          onClick={() => nav("/dashboard")}
          className="h-10 px-5 rounded-lg text-white font-semibold"
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
          Settings
        </div>

        <h1 className="text-4xl font-bold text-[#333333]">
          Estimate Approval Signature
        </h1>

        <p className="text-[#6B7B7C] mt-2">
          Upload the signature that will appear on approved estimates.
        </p>
      </div>

      {currentSig.url && (
        <div className="bg-white border border-[#DDD8CE] rounded-2xl p-5">
          <div className="text-xs uppercase tracking-widest text-[#B5C4B6] font-semibold mb-3">
            Current Signature
          </div>

          <img
            src={currentSig.url}
            alt="Current Signature"
            className="max-h-20 rounded-md border border-[#EAEEF0] bg-[#FAF8F5] p-2"
          />

          <div className="mt-3 text-sm font-semibold text-[#333333]">
            {currentSig.name || "-"}
          </div>
        </div>
      )}

      <div className="bg-white border border-[#DDD8CE] rounded-2xl p-6 space-y-5">
        <div>
          <label className="block text-xs font-semibold text-[#333333] mb-2">
            Display Name
          </label>

          <input
            value={sigName}
            onChange={(e) => setSigName(e.target.value)}
            placeholder="e.g. Dhruv Verma"
            className="w-full h-10 rounded-lg border border-[#DDD8CE] bg-[#FAF8F5] px-3 text-sm outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#333333] mb-2">
            Signature Image (PNG / JPG)
          </label>

          <label className="inline-flex items-center gap-2 px-4 h-10 rounded-lg border border-[#1F453B] cursor-pointer font-medium">
            <Upload size={16} />
            Choose File
            <input
              type="file"
              accept="image/png,image/jpeg"
              className="hidden"
              onChange={onSigPick}
            />
          </label>

          {sigPreview && (
            <div className="mt-4">
              <img
                src={sigPreview}
                alt="Preview"
                className="max-h-24 rounded-md border border-[#EAEEF0] bg-[#FAF8F5] p-2"
              />
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <button
            onClick={saveSignature}
            disabled={!sigFile || sigSaving}
            className="h-10 px-5 rounded-lg bg-[#1F453B] text-white font-semibold disabled:opacity-50"
          >
            {sigSaving ? "Saving..." : "Save Signature"}
          </button>
        </div>
      </div>
    </div>
  );
}
