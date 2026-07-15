import React from "react";
import { Upload, FileText } from "lucide-react";
import { Card } from "../hooks/shared";

/**
 * Renders the attachments upload UI. Stateless — SiteRekiForm owns the
 * attachments array and passes handlers down, same pattern as SectionForm.
 */
export function AttachmentsPanel({
  attachments,
  onAddFiles,
  onRemove,
  onRemarkChange,
}) {
  return (
    <Card>
      <div className="flex items-center justify-between mb-2">
        <div>
          <div className="text-[16px] font-semibold text-[#333333]">
            Attachments
          </div>
          <div className="text-[12.5px] text-[#6B7B7C]">
            Upload site photos and reference files. Add a remark to each so
            context isn&apos;t lost.
          </div>
        </div>
        <label
          className="h-9 px-4 rounded-lg bg-[#1F453B] text-white text-[13px] font-semibold cursor-pointer inline-flex items-center gap-1.5"
          data-testid="reki-upload-input-label"
        >
          <Upload size={14} /> Upload files
          <input
            type="file"
            multiple
            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
            className="hidden"
            onChange={(e) => {
              onAddFiles(e.target.files);
              e.target.value = "";
            }}
            data-testid="reki-upload-input"
          />
        </label>
      </div>
      {attachments.length === 0 ? (
        <div
          className="border border-dashed border-[#B5C4B6] rounded-lg py-8 text-center text-[12.5px] text-[#6B7B7C]"
          data-testid="reki-attach-empty"
        >
          No attachments yet. Upload JPG / PNG / PDF / DOC / XLSX (up to 8 MB
          each).
        </div>
      ) : (
        <div className="grid gap-3" data-testid="reki-attachments-list">
          {attachments.map((a, i) => {
            const isImg = (a.mime || "").startsWith("image/");
            return (
              <div
                key={i}
                className="flex gap-3 items-start border border-[#EAEEF0] rounded-lg p-2.5"
                data-testid={`reki-attach-row-${i}`}
              >
                <div className="w-16 h-16 rounded-md overflow-hidden bg-[#F4F6F7] flex items-center justify-center shrink-0 border border-[#EAEEF0]">
                  {isImg ? (
                    <img
                      alt={a.name}
                      src={`data:${a.mime};base64,${a.content_b64}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <FileText size={22} className="text-[#6B7B7C]" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-[13px] font-semibold text-[#333333] truncate">
                      {a.name}
                    </div>
                    <button
                      onClick={() => onRemove(i)}
                      className="text-[#B04D26] text-[12px] font-semibold hover:underline shrink-0"
                      data-testid={`reki-attach-remove-${i}`}
                    >
                      Remove
                    </button>
                  </div>
                  <div className="text-[11.5px] text-[#6B7B7C] mb-1.5">
                    {(a.size / 1024).toFixed(1)} KB · {a.mime || "—"}
                  </div>
                  <input
                    placeholder="Remark (optional) — e.g. 'North wall damp patch'"
                    value={a.remark}
                    onChange={(e) => onRemarkChange(i, e.target.value)}
                    className="w-full h-9 px-2 rounded-md border border-[#DDD8CE] bg-[#FAF8F5] text-[13px]"
                    data-testid={`reki-attach-remark-${i}`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
