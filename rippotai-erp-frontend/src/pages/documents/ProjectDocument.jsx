import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import { FileText, Download } from "lucide-react";
import { Shell, Card, CATEGORIES, downloadDocument } from "../../hooks/shared";

/* ---------- Project Documents workspace ---------- */
export function ProjectDocuments() {
  const [projects, setProjects] = useState([]);
  const [selected, setSelected] = useState("");
  const [pkg, setPkg] = useState(null);
  useEffect(() => {
    api.get("/projects").then((r) => setProjects(r.data || []));
  }, []);
  useEffect(() => {
    if (!selected) return;
    api
      .get(`/projects/${selected}/documents-workspace`)
      .then((r) => setPkg(r.data));
  }, [selected]);
  return (
    <Shell
      title="Project Documents"
      subtitle="All documents grouped by category — auto-includes BOQ approvals and selected quotations"
    >
      <Card>
        <label className="text-[13px] font-semibold text-[#333333] mb-1 block">
          Select project
        </label>
        <select
          className="bc-input h-10 max-w-md"
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
        >
          <option value="">Choose…</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </Card>
      {selected && pkg && (
        <div className="grid gap-4">
          {CATEGORIES.map((cat) => {
            const docs = pkg.categories?.[cat] || [];
            if (!docs.length) return null;
            return (
              <Card key={cat}>
                <div className="flex justify-between mb-3">
                  <div className="text-[15px] font-semibold text-[#333333]">
                    {cat}
                  </div>
                  <div className="text-[12px] text-[#6B7B7C]">
                    {docs.length}
                  </div>
                </div>
                <div className="divide-y divide-[rgba(31,69,59,0.08)]">
                  {docs.map((d) => (
                    <div key={d.id} className="py-2 flex items-center gap-3">
                      <FileText size={16} className="text-[#333333]" />
                      <div className="flex-1 min-w-0">
                        <div className="text-[14px] font-semibold text-[#333333] truncate">
                          {d.title}
                        </div>
                        <div className="text-[12px] text-[#6B7B7C]">
                          {d.source_app} · {d.version} ·{" "}
                          {(d.created_at || "").slice(0, 10)}
                        </div>
                      </div>
                      <button
                        onClick={() => downloadDocument(d.id, d.filename)}
                        className="p-1.5 hover:bg-[#EAEEF0] rounded"
                      >
                        <Download size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              </Card>
            );
          })}
          {!Object.values(pkg.categories || {}).some((a) => a.length) && (
            <Card>
              <div className="text-center py-8 text-[#B5C4B6]">
                No documents for this project yet.
              </div>
            </Card>
          )}
        </div>
      )}
    </Shell>
  );
}