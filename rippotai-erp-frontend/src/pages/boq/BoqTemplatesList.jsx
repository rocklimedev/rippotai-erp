import React from "react";
import { useNavigate } from "react-router-dom";
import { formatINR, relativeTime } from "@/lib/format";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import {
  useGetTemplatesQuery,
  useDeleteTemplateMutation,
} from "../../api/boq.api"; // adjust path to wherever boqApi is exported from

const TIER_META = {
  essential: { label: "Essential", bg: "#EAEEF0", fg: "#1F453B" },
  premium: { label: "Premium", bg: "#D8E0DA", fg: "#1F453B" },
  luxury: { label: "Luxury", bg: "#D9AF61", fg: "#1F453B" },
};

/* ============ Templates List ============ */
export function BoqTemplatesList() {
  const nav = useNavigate();

  const { data: rows, isLoading, isFetching } = useGetTemplatesQuery();

  const [deleteTemplate] = useDeleteTemplateMutation();

  const handleDelete = async (t) => {
    if (!confirm(`Delete template "${t.name}"?`)) return;
    try {
      await deleteTemplate(t.id).unwrap();
      toast.success("Deleted");
    } catch {
      toast.error("Delete failed");
    }
  };

  return (
    <div className="space-y-6" data-testid="boq-templates-page">
      <div className="flex items-end justify-between">
        <div>
          <div className="text-[11px] uppercase tracking-widest text-[#B5C4B6] mb-1.5">
            BOQ · Management
          </div>
          <h1 className="text-[34px] font-bold text-[#333333]">
            BOQ Templates
          </h1>
          <p className="text-[13.5px] text-[#6B7B7C] mt-1">
            Reusable BOQ blueprints. Create a new BOQ from a template to
            pre-fill categories, items and rates.
          </p>
        </div>
        <button
          onClick={() => nav("/boq/template/new")}
          className="h-10 px-4 rounded-xl bg-[#1F453B] text-white text-[13px] font-semibold flex items-center gap-2"
          data-testid="template-create-btn"
        >
          <Plus size={15} /> New Template
        </button>
      </div>

      <div className="bc-card overflow-hidden" data-testid="templates-table">
        <table className="w-full text-left">
          <thead>
            <tr className="text-[10.5px] uppercase tracking-widest text-[#B5C4B6] bg-[#EAEEF0] border-b border-[#B5C4B6]">
              <th className="px-4 py-3 font-semibold">Name</th>
              <th className="px-3 py-3 font-semibold">Tier</th>
              <th className="px-3 py-3 font-semibold text-right">Categories</th>
              <th className="px-3 py-3 font-semibold text-right">Items</th>
              <th className="px-3 py-3 font-semibold text-right">
                Total value
              </th>
              <th className="px-3 py-3 font-semibold">Updated</th>
              <th className="px-3 py-3 font-semibold w-32">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-10 text-center text-[#6B7B7C] text-[13px]"
                >
                  Loading templates…
                </td>
              </tr>
            )}
            {!isLoading && rows && rows.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-10 text-center text-[#6B7B7C] text-[13px]"
                >
                  No templates yet. Create your first template above.
                </td>
              </tr>
            )}
            {!isLoading &&
              rows &&
              rows.map((t) => {
                const tier = TIER_META[t.template_tier] || null;
                return (
                  <tr
                    key={t.id}
                    className="border-b border-[#EAEEF0] hover:bg-[#FAF8F5]"
                    data-testid={`template-row-${t.id}`}
                  >
                    <td className="px-4 py-3">
                      <div className="text-[13.5px] font-semibold text-[#333333]">
                        {t.name}
                      </div>
                      <div className="text-[11.5px] text-[#B5C4B6]">
                        by {t.created_by || "—"}
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      {tier ? (
                        <span
                          className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold"
                          style={{ background: tier.bg, color: tier.fg }}
                        >
                          {tier.label}
                        </span>
                      ) : (
                        <span className="text-[12px] text-[#6B7B7C]">—</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-right text-[13px] text-[#6B7B7C]">
                      {t.category_count ?? 0}
                    </td>
                    <td className="px-3 py-3 text-right text-[13px] text-[#6B7B7C]">
                      {t.item_count ?? 0}
                    </td>
                    <td className="px-3 py-3 text-right text-[13px] font-semibold text-[#333333]">
                      {formatINR(t.total_value || 0)}
                    </td>
                    <td className="px-3 py-3 text-[11.5px] text-[#B5C4B6] whitespace-nowrap">
                      {relativeTime(t.updated_at)}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => nav(`/boq/new?template_id=${t.id}`)}
                          className="text-[12.5px] font-semibold text-[#333333] hover:underline"
                        >
                          Use
                        </button>
                        <button
                          onClick={() => nav(`/boq/template/${t.id}/editor`)}
                          className="text-[12.5px] font-semibold text-[#333333] hover:underline"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(t)}
                          className="text-[12.5px] text-[#7A2E1A] hover:underline"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default BoqTemplatesList;
