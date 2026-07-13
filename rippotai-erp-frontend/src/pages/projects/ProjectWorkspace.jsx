import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "@/lib/api";
import { toast } from "sonner";
import { fmtINR, relativeTime } from "@/lib/format";
import {
  ArrowLeft,
  Share2,
  Copy,
} from "lucide-react";
import { useGetProjectByIdQuery } from "../../api/project.api"; // Adjust import path as needed

const TABS = ["Overview", "BOQ", "Estimates", "Activity"];

const STATUS_TONE = {
  on_track: { bg: "#EAEEF0", fg: "#1F453B" },
  ahead: { bg: "#EAEEF0", fg: "#1F453B" },
  at_risk: { bg: "#EAEEF0", fg: "#1F453B" },
  delayed: { bg: "#EAEEF0", fg: "#1F453B" },
  completed: { bg: "#EAEEF0", fg: "#1F453B" },
  on_hold: { bg: "#B5C4B6", fg: "#6B7B7C" },
};

function TimelineChip({ status }) {
  const t = STATUS_TONE[status] || STATUS_TONE.on_track;
  return (
    <span
      className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold"
      style={{ background: t.bg, color: t.fg }}
    >
      {(status || "").replace(/_/g, " ")}
    </span>
  );
}

export default function ProjectWorkspace() {
  const { id } = useParams();
  const nav = useNavigate();
  const [tab, setTab] = useState("Overview");

  // RTK Query for main project data
  const {
    data: projectData,
    isLoading,
    error,
  } = useGetProjectByIdQuery(id, { skip: !id });

  const [milestones, setMilestones] = useState([]);
  const [work, setWork] = useState({});
  const [docs, setDocs] = useState([]);
  const [boqs, setBoqs] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [vendors, setVendors] = useState({ engaged: [], attached: [] });
  const [financial, setFinancial] = useState(null);
  const [links, setLinks] = useState([]);
  const [shareModal, setShareModal] = useState(false);
  const [shareForm, setShareForm] = useState({
    purpose: "project_view",
    client_email: "",
    client_name: "",
    show_rates: true,
    show_vendor_names: true,
    show_ratings: true,
  });
  const [createdLink, setCreatedLink] = useState(null);
  const [phaseProgress, setPhaseProgress] = useState(null);

  // Phase Progress
  useEffect(() => {
    if (!id) return;
    api
      .get(`/projects/${id}/phases`)
      .then((r) => setPhaseProgress(r.data.progress_pct))
      .catch(() => {});
  }, [id]);

  // Load supplementary data
  useEffect(() => {
    if (!id || !projectData) return;

    const loadSupplementary = async () => {
      try {
        const [ms, wk, dc, bq, qt, vd, fn, lk] = await Promise.all([
          api.get(`/projects/${id}/milestones`).catch(() => ({ data: [] })),
          api.get(`/projects/${id}/pending-work`).catch(() => ({ data: {} })),
          api.get(`/projects/${id}/documents`).catch(() => ({ data: [] })),
          api.get(`/boqs?project_id=${id}`).catch(() => ({ data: [] })),
          api.get(`/quotations?project_id=${id}`).catch(() => ({ data: [] })),
          api.get(`/projects/${id}/vendors`).catch(() => ({ data: { engaged: [], attached: [] } })),
          api.get(`/projects/${id}/financial`).catch(() => ({ data: null })),
          api.get(`/client-links?project_id=${id}`).catch(() => ({ data: [] })),
        ]);

        setMilestones(ms.data);
        setWork(wk.data);
        setDocs(dc.data);
        setBoqs(bq.data);
        setQuotes(qt.data.length > 0 ? qt.data : (projectData.quotations || []));
        setVendors(vd.data);
        setFinancial(fn.data);
        setLinks(lk.data);

        setShareForm((f) => ({
          ...f,
          client_email: projectData.client?.email || "",
          client_name: projectData.client?.name || projectData.client?.contact_person || "",
        }));
      } catch (e) {
        toast.error("Failed to load additional project data");
      }
    };

    loadSupplementary();
  }, [id, projectData]);

  const createLink = async () => {
    const payload = {
      project_id: id,
      purpose: shareForm.purpose,
      client_email: shareForm.client_email,
      client_name: shareForm.client_name,
      expires_days: 30,
      options: {
        show_rates: shareForm.show_rates,
        show_vendor_names: shareForm.show_vendor_names,
        show_ratings: shareForm.show_ratings,
      },
    };
    try {
      const { data } = await api.post("/client-links", payload);
      setCreatedLink(data);
      const r = await api.get(`/client-links?project_id=${id}`);
      setLinks(r.data);
      toast.success("Link created");
    } catch {
      toast.error("Failed to create link");
    }
  };

  if (isLoading) return <div className="p-8 text-[#6B7B7C]">Loading…</div>;
  if (error || !projectData) return <div className="p-8 text-red-600">Failed to load project</div>;

  const p = projectData;
  const tl = {
    status: p.status?.toLowerCase() || "on_track",
    variance: 0,
  };

  const Card = ({ label, value }) => (
    <div className="bg-[#EAEEF0] rounded-lg p-3">
      <div className="text-[11px] uppercase tracking-wider text-[#B5C4B6]">
        {label}
      </div>
      <div className="text-[15px] font-bold text-[#333333] mt-0.5">{value}</div>
    </div>
  );

  const copyUrl = (url) => {
    navigator.clipboard.writeText(url);
    toast.success("Copied");
  };

  return (
    <div className="max-w-[1440px] mx-auto p-6" data-testid="project-workspace">
      <button
        onClick={() => nav("/projects")}
        className="text-[13px] text-[#6B7B7C] inline-flex items-center gap-1 mb-3"
      >
        <ArrowLeft size={14} /> Projects
      </button>

      {/* Header */}
      <div className="bg-white border border-[#B5C4B6] rounded-xl p-5">
        <div className="flex justify-between items-start flex-wrap gap-4">
          <div className="flex-1 min-w-[300px]">
            <div className="flex items-center gap-2">
              <TimelineChip status={tl.status} />
              <span className="text-[11px] font-semibold text-[#6B7B7C]">
                {p.slug?.toUpperCase() || p.id?.slice(0, 8)}
              </span>
              <span className="text-[11px] font-semibold text-[#333333] bg-[#EAEEF0] px-1.5 rounded">
                {p.priority || "Medium"}
              </span>
            </div>
            <h1 className="text-[32px] font-bold text-[#333333] mt-1.5">
              {p.name}
            </h1>
            <div className="text-[13px] text-[#6B7B7C] mt-1">
              {p.client?.name || p.client?.contact_person || "—"} · {p.site_location || "—"} · {p.project_type?.name || p.project_type}
            </div>
          </div>
          <div className="grid grid-cols-4 gap-2 min-w-[440px]">
            <Card label="Phase" value={(p.phase || "—").replace(/_/g, " ")} />
            <Card
              label="Progress"
              value={`${phaseProgress != null ? phaseProgress : p.progress || 0}%`}
              data-testid="header-progress"
            />
            <Card
              label="Variance"
              value={`${tl.variance > 0 ? "+" : ""}${tl.variance}%`}
            />
            <Card label="ECD" value={p.expected_completion_date || "—"} />
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-[#B5C4B6]">
          <button
            onClick={() => setShareModal(true)}
            className="px-3 py-1.5 rounded-lg bg-[#1F453B] text-white text-[12.5px] font-semibold inline-flex items-center gap-1"
            data-testid="btn-share-client"
          >
            <Share2 size={13} /> Share with Client
          </button>
          <button
            onClick={() => nav(`/projects/${id}/handover`)}
            className="px-3 py-1.5 rounded-lg border border-[#B5C4B6] text-[12.5px] font-semibold"
          >
            Handover Package
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-5 flex gap-1 border-b border-[#B5C4B6] overflow-x-auto sticky top-0 bg-[#EAEEF0] z-10">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            data-testid={`project-tab-${t.toLowerCase()}`}
            className={`px-3.5 py-2 text-[13px] font-semibold whitespace-nowrap ${tab === t ? "text-[#333333] border-b-2 border-[#1F453B]" : "text-[#6B7B7C]"}`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="mt-4">
        {tab === "Overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-white border border-[#B5C4B6] rounded-xl p-4">
                <div className="text-[13px] font-bold mb-3">
                  Recent Activity
                </div>
                {(projectData.recent_activity || []).map((a) => (
                  <div key={a.id} className="py-2 border-b border-[#EAEEF0]">
                    <div className="text-[12.5px] text-[#333333]">
                      {a.description || a.action}
                    </div>
                    <div className="text-[11px] text-[#B5C4B6]">
                      {a.actor} · {relativeTime(a.at || a.created_at)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === "Activity" && <ProjectActivityInline />}

        {tab === "Milestones" && (
          <div className="bg-white border border-[#B5C4B6] rounded-xl p-4">
            <table className="w-full text-[12.5px]">
              <thead className="text-[11px] uppercase text-[#B5C4B6]">
                <tr className="border-b border-[#B5C4B6]">
                  <th className="text-left py-2">Name</th>
                  <th className="text-left py-2">Phase</th>
                  <th className="text-left py-2">Planned End</th>
                  <th className="text-left py-2">Assignee</th>
                  <th className="text-left py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {milestones.map((m) => (
                  <tr key={m.id} className="border-b border-[#EAEEF0]">
                    <td className="py-2">{m.name}</td>
                    <td className="py-2 text-[#6B7B7C] capitalize">
                      {(m.phase || "").replace(/_/g, " ")}
                    </td>
                    <td className="py-2 text-[#6B7B7C]">{m.planned_end}</td>
                    <td className="py-2 text-[#6B7B7C]">{m.assignee || "—"}</td>
                    <td className="py-2">
                      <TimelineChip status={m.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === "Work" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              "delayed",
              "due_today",
              "due_this_week",
              "awaiting_approval",
              "awaiting_client",
              "blocked",
              "upcoming",
            ].map((k) => (
              <div
                key={k}
                className="bg-white border border-[#B5C4B6] rounded-xl p-4"
              >
                <div className="text-[13px] font-bold mb-2 capitalize">
                  {k.replace(/_/g, " ")}{" "}
                  <span className="text-[11px] text-[#6B7B7C]">
                    ({work[k]?.length || 0})
                  </span>
                </div>
                {(work[k] || []).length === 0 ? (
                  <div className="text-[#B5C4B6] text-[12px]">None</div>
                ) : (
                  (work[k] || []).map((w) => (
                    <div
                      key={w.id}
                      className="py-1.5 text-[12.5px] border-b border-[#EAEEF0]"
                    >
                      <div className="font-semibold text-[#333333]">
                        {w.title}
                      </div>
                      <div className="text-[11px] text-[#6B7B7C]">
                        {w.assignee || "—"} · Due {w.due_date}
                      </div>
                    </div>
                  ))
                )}
              </div>
            ))}
          </div>
        )}

        {tab === "Documents" && (
          <div className="bg-white border border-[#B5C4B6] rounded-xl p-4">
            {docs.length === 0 ? (
              <div className="text-[#B5C4B6] text-center py-8">
                No documents yet.
              </div>
            ) : (
              docs.map((d) => (
                <div
                  key={d.id}
                  className="flex justify-between py-2 border-b border-[#EAEEF0] text-[12.5px]"
                >
                  <div>
                    <div className="font-semibold text-[#333333]">{d.name}</div>
                    <div className="text-[11px] text-[#6B7B7C]">
                      {d.category} · {d.uploaded_by} ·{" "}
                      {relativeTime(d.uploaded_at)}
                    </div>
                  </div>
                  <label className="flex items-center gap-1 text-[11.5px] text-[#6B7B7C]">
                    <input
                      type="checkbox"
                      defaultChecked={d.client_visible}
                      onChange={(e) =>
                        api.patch(
                          `/projects/${id}/documents/${d.id}/client-visibility`,
                          { client_visible: e.target.checked },
                        )
                      }
                      data-testid={`doc-vis-${d.id}`}
                    />{" "}
                    Client-visible
                  </label>
                </div>
              ))
            )}
          </div>
        )}

        {tab === "BOQ" && (
          <div className="bg-white border border-[#B5C4B6] rounded-xl p-4">
            {boqs.length === 0 ? (
              <div className="text-[#B5C4B6] text-center py-6">
                No BOQs for this project.
              </div>
            ) : (
              boqs.map((b) => (
                <Link
                  key={b.id}
                  to={`/boq/${b.id}`}
                  className="flex justify-between py-2 border-b border-[#EAEEF0] text-[12.5px] hover:bg-[#EAEEF0]"
                  data-testid={`boq-link-${b.id}`}
                >
                  <div>
                    <div className="font-semibold text-[#333333]">
                      BOQ V{b.version} · {b.status}
                    </div>
                    <div className="text-[11px] text-[#6B7B7C]">
                      {relativeTime(b.updated_at || b.created_at)}
                    </div>
                  </div>
                  <div className="font-bold text-[#333333]">
                    {fmtINR(b.total_amount || 0)}
                  </div>
                </Link>
              ))
            )}
          </div>
        )}

        {tab === "Estimates" && (
          <div className="bg-white border border-[#B5C4B6] rounded-xl p-4">
            {quotes.length === 0 ? (
              <div className="text-[#B5C4B6] text-center py-6">
                No quotations for this project.
              </div>
            ) : (
              quotes.map((q) => (
                <Link
                  key={q.id}
                  to={`/quotations/${q.id}`}
                  className="flex justify-between py-2 border-b border-[#EAEEF0] text-[12.5px] hover:bg-[#EAEEF0]"
                >
                  <div>
                    <div className="font-semibold text-[#333333]">
                      {q.quotationNumber || q.quotation_number} · {q.vendor?.name || q.vendor_name}
                    </div>
                    <div className="text-[11px] text-[#6B7B7C]">
                      {(q.vendor?.vendorCategory?.name || q.work_category)} · {q.status}
                    </div>
                  </div>
                  <div className="font-bold text-[#333333]">
                    {fmtINR(q.totalAmount || q.subtotal || q.subtotals?.total || 0)}
                  </div>
                </Link>
              ))
            )}
          </div>
        )}

        {tab === "Vendors" && (
          <div className="bg-white border border-[#B5C4B6] rounded-xl p-4">
            <div className="text-[13px] font-bold mb-3">
              Engaged Vendors ({vendors.engaged.length})
            </div>
            {vendors.engaged.length === 0 ? (
              <div className="text-[#B5C4B6] text-[12px]">
                No selected quotations yet.
              </div>
            ) : (
              vendors.engaged.map((v) => (
                <div
                  key={v.quotation_id}
                  className="flex justify-between py-2 border-b border-[#EAEEF0] text-[12.5px]"
                >
                  <div>
                    <div className="font-semibold text-[#333333]">
                      {v.vendor_name}
                    </div>
                    <div className="text-[11px] text-[#6B7B7C]">
                      {v.category} · {v.status}
                    </div>
                  </div>
                  <div className="font-bold text-[#333333]">
                    {fmtINR(v.approved_amount)}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {tab === "Financial" && financial && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              ["Approved BOQ Estimate", financial.approved_boq_estimate],
              ["Vendor Quoted Cost", financial.vendor_quoted_cost],
              ["Approved Vendor Cost", financial.approved_vendor_cost],
              ["Committed Cost", financial.committed_cost],
              ["Actual Recorded", financial.actual_recorded_cost],
              ["Projected Final", financial.projected_final_cost],
              ["Additional Approved", financial.additional_approved],
            ].map(([l, v]) => (
              <div
                key={l}
                className="bg-white border border-[#B5C4B6] rounded-xl p-4"
              >
                <div className="text-[11px] uppercase text-[#B5C4B6]">{l}</div>
                <div className="text-[17px] font-bold text-[#333333] mt-1">
                  {fmtINR(v || 0)}
                </div>
              </div>
            ))}
            <div className="bg-white border border-[#B5C4B6] rounded-xl p-4">
              <div className="text-[11px] uppercase text-[#B5C4B6]">
                Cost Variation
              </div>
              <div
                className={`text-[17px] font-bold mt-1 ${(financial.cost_variation_pct || 0) > 5 ? "text-[#333333]" : "text-[#333333]"}`}
              >
                {financial.cost_variation_pct != null
                  ? `${financial.cost_variation_pct > 0 ? "+" : ""}${financial.cost_variation_pct}%`
                  : "—"}
              </div>
            </div>
          </div>
        )}

        {/* Existing links section */}
        {links.length > 0 && (
          <div className="mt-6 bg-white border border-[#B5C4B6] rounded-xl p-4">
            <div className="text-[13px] font-bold mb-3">
              Client Magic Links ({links.length})
            </div>
            {links.map((l) => (
              <div
                key={l.id}
                className="flex justify-between items-center py-2 border-b border-[#EAEEF0] text-[12.5px]"
                data-testid={`link-${l.id}`}
              >
                <div>
                  <div className="font-semibold text-[#333333]">{l.purpose}</div>
                  <div className="text-[11px] text-[#6B7B7C] max-w-[500px] truncate">
                    {l.url}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => copyUrl(l.url)}
                    className="px-2 py-1 rounded border border-[#B5C4B6] text-[11.5px] inline-flex items-center gap-1"
                  >
                    <Copy size={11} /> Copy
                  </button>
                  <a
                    href={l.url}
                    target="_blank"
                    rel="noreferrer"
                    className="px-2 py-1 rounded bg-[#1F453B] text-white text-[11.5px]"
                  >
                    Open
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}

        {shareModal && (
          <div
            className="fixed inset-0 z-50 bg-[#1F453B]/40 flex items-center justify-center p-4"
            onClick={() => setShareModal(false)}
          >
            <div
              className="bg-white rounded-xl max-w-md w-full p-5"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-[16px] font-bold mb-3">Share with Client</div>
              {!createdLink ? (
                <>
                  <label className="text-[12px] font-semibold text-[#6B7B7C]">
                    Purpose
                  </label>
                  <select
                    value={shareForm.purpose}
                    onChange={(e) =>
                      setShareForm({ ...shareForm, purpose: e.target.value })
                    }
                    className="w-full mt-1 px-3 py-2 border border-[#B5C4B6] rounded-lg text-[13px] bg-[#EAEEF0]"
                    data-testid="share-purpose"
                  >
                    <option value="project_view">Project View</option>
                    <option value="boq_approval">BOQ Approval</option>
                    <option value="quotation_selection">Quotation Selection</option>
                    <option value="handover_acceptance">Handover Acceptance</option>
                  </select>
                  <label className="text-[12px] font-semibold text-[#6B7B7C] mt-3 block">
                    Client Name
                  </label>
                  <input
                    value={shareForm.client_name}
                    onChange={(e) =>
                      setShareForm({ ...shareForm, client_name: e.target.value })
                    }
                    className="w-full mt-1 px-3 py-2 border border-[#B5C4B6] rounded-lg text-[13px] bg-[#EAEEF0]"
                  />
                  <label className="text-[12px] font-semibold text-[#6B7B7C] mt-3 block">
                    Client Email
                  </label>
                  <input
                    value={shareForm.client_email}
                    onChange={(e) =>
                      setShareForm({ ...shareForm, client_email: e.target.value })
                    }
                    className="w-full mt-1 px-3 py-2 border border-[#B5C4B6] rounded-lg text-[13px] bg-[#EAEEF0]"
                    data-testid="share-email"
                  />
                  <div className="mt-3 space-y-1.5 text-[12.5px]">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={shareForm.show_rates}
                        onChange={(e) =>
                          setShareForm({ ...shareForm, show_rates: e.target.checked })
                        }
                      />{" "}
                      Show rates on BOQ
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={shareForm.show_vendor_names}
                        onChange={(e) =>
                          setShareForm({ ...shareForm, show_vendor_names: e.target.checked })
                        }
                      />{" "}
                      Show vendor names
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={shareForm.show_ratings}
                        onChange={(e) =>
                          setShareForm({ ...shareForm, show_ratings: e.target.checked })
                        }
                      />{" "}
                      Show vendor ratings
                    </label>
                  </div>
                  <div className="flex justify-end gap-2 mt-4">
                    <button
                      onClick={() => setShareModal(false)}
                      className="px-3 py-1.5 rounded-lg border border-[#B5C4B6] text-[12.5px]"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={createLink}
                      className="px-4 py-1.5 rounded-lg bg-[#1F453B] text-white text-[12.5px] font-semibold"
                      data-testid="btn-create-link"
                    >
                      Create Link
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-[13px] text-[#333333] font-semibold mb-2">
                    ✓ Link generated
                  </div>
                  <div className="text-[11.5px] text-[#6B7B7C] mb-2 break-all bg-[#EAEEF0] p-2 rounded border border-[#B5C4B6]">
                    {createdLink.url}
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => copyUrl(createdLink.url)}
                      className="px-3 py-1.5 rounded-lg border border-[#B5C4B6] text-[12.5px]"
                      data-testid="btn-copy-link"
                    >
                      Copy
                    </button>
                    <a
                      href={createdLink.url}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 rounded-lg bg-[#1F453B] text-white text-[12.5px]"
                    >
                      Open
                    </a>
                    <button
                      onClick={() => {
                        setCreatedLink(null);
                        setShareModal(false);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-[#1F453B] text-white text-[12.5px]"
                    >
                      Done
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// PhaseTracker Component
function PhaseTracker({ projectId, onProgressChange }) {
  const [data, setData] = React.useState(null);
  const [busy, setBusy] = React.useState(null);

  const load = React.useCallback(() => {
    api
      .get(`/projects/${projectId}/phases`)
      .then((r) => {
        setData(r.data);
        if (typeof onProgressChange === "function")
          onProgressChange(r.data.progress_pct);
      })
      .catch(() => setData({ phases: [], progress_pct: 0 }));
  }, [projectId, onProgressChange]);

  React.useEffect(() => {
    load();
  }, [load]);

  const toggle = async (key, next) => {
    setBusy(key);
    try {
      await api.patch(`/projects/${projectId}/phases/${key}`, {
        manually_completed: next,
      });
      load();
    } catch (e) {
      const msg = e?.response?.data?.detail || "Failed";
      window?.alert?.(msg);
    } finally {
      setBusy(null);
    }
  };

  if (!data)
    return <div className="text-[13px] text-[#6B7B7C]">Loading phases…</div>;

  return (
    <div className="space-y-4" data-testid="phase-tracker">
      <div className="bg-white border border-[#B5C4B6] rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-[13px] uppercase tracking-widest text-[#B5C4B6]">
              Overall Progress
            </div>
            <div className="text-[32px] font-bold text-[#333333]">
              {data.progress_pct}%
            </div>
          </div>
          <div className="text-[13px] text-[#6B7B7C]">
            {data.completed_subphases} of {data.total_subphases} units complete
          </div>
        </div>
        <div className="h-2 rounded-full bg-[#EAEEF0] overflow-hidden">
          <div
            className="h-full bg-[#1F453B]"
            style={{ width: `${data.progress_pct}%` }}
          />
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {data.phases.map((p) => {
          const hasSubs = p.subphases && p.subphases.length > 0;
          const phaseAuto = !!p.auto_completed;
          const phaseManual = !!p.manually_completed;
          return (
            <div
              key={p.key}
              className={`bg-white border rounded-xl p-4 ${p.complete ? "border-[#D9AF61]" : "border-[#B5C4B6]"}`}
              data-testid={`phase-${p.key}`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="text-[15px] font-bold text-[#333333]">
                  {p.name}
                </div>
                <span
                  className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${p.complete ? "bg-[#D9AF61] text-[#333333]" : "bg-[#EAEEF0] text-[#6B7B7C]"}`}
                >
                  {hasSubs
                    ? `${p.completed_subphases}/${p.subphase_count}`
                    : p.complete
                      ? "Done"
                      : "Open"}
                </span>
              </div>
              {hasSubs ? (
                <ul className="space-y-2">
                  {p.subphases.map((s) => (
                    <li
                      key={s.key}
                      className="flex items-center gap-2 text-[13px]"
                      data-testid={`subphase-${s.key}`}
                    >
                      <span
                        className={`inline-flex w-4 h-4 rounded-full items-center justify-center text-[10px] font-bold shrink-0 ${s.complete ? "bg-[#D9AF61] text-[#333333]" : "bg-[#EAEEF0] text-[#B5C4B6]"}`}
                      >
                        {s.complete ? "✓" : "·"}
                      </span>
                      <span
                        className={`flex-1 ${s.complete ? "text-[#333333] font-semibold" : "text-[#6B7B7C]"}`}
                      >
                        {s.name}
                      </span>
                      {!s.auto_completed && (
                        <button
                          disabled={busy === s.key}
                          onClick={() => toggle(s.key, !s.manually_completed)}
                          className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${s.manually_completed ? "border-[#B5C4B6] text-[#6B7B7C]" : "border-[#1F453B] text-[#333333] hover:bg-[#EAEEF0]"} disabled:opacity-50`}
                          data-testid={`subphase-toggle-${s.key}`}
                          title={
                            s.manually_completed
                              ? "Undo manual completion"
                              : "Mark as completed"
                          }
                        >
                          {s.manually_completed ? "Undo" : "Mark ✓"}
                        </button>
                      )}
                      {s.auto_completed && (
                        <span
                          className="text-[10.5px] text-[#B5C4B6] italic"
                          title="Auto-completed by finalized document"
                        >
                          auto
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-[12.5px] text-[#6B7B7C] mb-3">
                  {p.complete
                    ? phaseAuto
                      ? "Auto-completed by a finalized document."
                      : "Marked completed."
                    : "No sub-phases. Complete when the phase document is finalized or mark manually."}
                </div>
              )}
              {!hasSubs && !phaseAuto && (
                <button
                  disabled={busy === p.key}
                  onClick={() => toggle(p.key, !phaseManual)}
                  className={`mt-2 w-full h-9 rounded-lg text-[12.5px] font-semibold ${phaseManual ? "border border-[#B5C4B6] text-[#6B7B7C]" : "bg-[#1F453B] text-white"} disabled:opacity-50`}
                  data-testid={`phase-toggle-${p.key}`}
                >
                  {phaseManual ? "Undo" : "Mark Completed"}
                </button>
              )}
            </div>
          );
        })}
      </div>
      <div className="text-[11.5px] text-[#B5C4B6]">
        Sub-phases auto-complete when a document of the matching category is
        uploaded and finalized against this project. Use "Mark ✓" to record
        completion manually for anything not tied to a document.
      </div>
    </div>
  );
}

// Project Activity Inline
function ProjectActivityInline() {
  const [rows, setRows] = React.useState([]);
  React.useEffect(() => {
    api
      .get("/projects/activity?limit=50")
      .then((r) => setRows(r.data))
      .catch(() => setRows([]));
  }, []);
  return (
    <div
      className="bg-white border border-[#B5C4B6] rounded-xl overflow-hidden"
      data-testid="project-activity-table"
    >
      <table className="w-full text-left text-[13px]">
        <thead className="bg-[#F4F6F7] text-[11px] uppercase text-[#B5C4B6]">
          <tr>
            <th className="px-3 py-2.5">When</th>
            <th className="px-3 py-2.5">User</th>
            <th className="px-3 py-2.5">Action</th>
            <th className="px-3 py-2.5">Target</th>
            <th className="px-3 py-2.5">Details</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td colSpan={5} className="text-center py-8 text-[#6B7B7C]">
                No activity yet.
              </td>
            </tr>
          )}
          {rows.map((r) => (
            <tr key={r.id} className="border-t border-[#EAEEF0]">
              <td className="px-3 py-2.5 text-[#6B7B7C] whitespace-nowrap">
                {new Date(r.at).toLocaleString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </td>
              <td className="px-3 py-2.5 text-[#333333]">{r.user}</td>
              <td className="px-3 py-2.5">
                <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#EAEEF0] text-[#333333]">
                  {r.action}
                </span>
              </td>
              <td className="px-3 py-2.5 font-semibold text-[#333333]">
                {r.target}
              </td>
              <td className="px-3 py-2.5 text-[#6B7B7C]">{r.details}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}