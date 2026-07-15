import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ArrowRight, ArrowLeft, LayoutTemplate } from "lucide-react";
import { useCreateTemplateMutation } from "../../api/boq.api";

const TIERS = [
  { value: "essential", label: "Essential" },
  { value: "premium", label: "Premium" },
  { value: "luxury", label: "Luxury" },
];

export default function BoqTemplateNew() {
  const nav = useNavigate();
  const [name, setName] = useState("");
  const [tier, setTier] = useState("");
  const [description, setDescription] = useState("");

  const [createTemplate, { isLoading: busy }] = useCreateTemplateMutation();

  const submit = async (e) => {
    e.preventDefault();

    const trimmedName = name.trim();
    if (!trimmedName) {
      toast.error("Please give the template a name");
      return;
    }

    try {
      const payload = {
        name: trimmedName,
        ...(tier && { template_tier: tier }),
        ...(description.trim() && { description: description.trim() }),
        // categories omitted → cleaner payload (backend defaults to empty)
      };

      const data = await createTemplate(payload).unwrap();

      toast.success("Template created successfully");
      nav(`/boq/template/${data.id}/editor`);
    } catch (err) {
      toast.error(err?.data?.detail || "Failed to create template");
    }
  };

  return (
    <div className="max-w-2xl mx-auto" data-testid="boq-template-new-page">
      <button
        onClick={() => nav("/boq/templates")}
        className="text-[13px] text-[#6B7B7C] hover:text-[#333333] flex items-center gap-1 mb-4"
      >
        <ArrowLeft size={14} /> Back to Templates
      </button>

      <div className="bc-card p-8">
        <div className="w-12 h-12 rounded-2xl bg-[#EAEEF0] flex items-center justify-center mb-5">
          <LayoutTemplate size={20} className="text-[#333333]" />
        </div>

        <div className="text-[11px] uppercase tracking-widest text-[#B5C4B6] mb-1.5">
          Create Template · Step 1 of 1
        </div>
        <h1 className="text-2xl font-bold text-[#333333] tracking-tight">
          New BOQ Template
        </h1>
        <p className="text-[13px] text-[#6B7B7C] mt-1 mb-6">
          Give it a name and tier. You'll add categories and items in the editor
          next.
        </p>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-[12px] font-medium text-[#6B7B7C] mb-1.5">
              Template Name <span className="text-red-500">*</span>
            </label>
            <input
              className="bc-input"
              placeholder="e.g. 2BHK Interior — Premium"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
              data-testid="template-new-name"
            />
          </div>

          <div>
            <label className="block text-[12px] font-medium text-[#6B7B7C] mb-1.5">
              Tier (optional)
            </label>
            <select
              className="bc-input"
              value={tier}
              onChange={(e) => setTier(e.target.value)}
              data-testid="template-new-tier"
            >
              <option value="">No tier</option>
              {TIERS.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[12px] font-medium text-[#6B7B7C] mb-1.5">
              Description (optional)
            </label>
            <textarea
              className="bc-input min-h-[90px]"
              placeholder="What's this template for?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              data-testid="template-new-description"
            />
          </div>

          <div className="pt-2 flex gap-2">
            <button
              type="button"
              onClick={() => nav("/boq/templates")}
              className="h-11 px-4 rounded-xl border border-[#B5C4B6] bg-white hover:bg-[#EAEEF0] text-[13px] font-semibold text-[#6B7B7C]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy || !name.trim()}
              className="h-11 flex-1 rounded-xl bg-[#1F453B] text-white text-[13px] font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
              data-testid="template-new-submit"
            >
              {busy ? (
                "Creating…"
              ) : (
                <>
                  Create & Open Editor <ArrowRight size={14} />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
