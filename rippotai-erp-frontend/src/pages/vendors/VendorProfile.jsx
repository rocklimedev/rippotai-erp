import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  useGetVendorByIdQuery,

} from "../../api/vendor.api"; // Adjust path based on your RTK Query exports
import { useGetQuotationsByVendorQuery } from "../../api/vendor.api";
import { formatINR, relativeTime, formatDate } from "@/lib/format";
import { toast } from "sonner";
import {
  ArrowLeft,
  Star,
  MapPin,
  ShieldCheck,
  Bookmark,
  FileText,
  Upload,
  Trash2,
  MoreHorizontal,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AddToShortlistModal } from "./VendorsDashboard";

// Temporary manual API for actions (add mutations to RTK slice later)
import api from "@/lib/api";

const TABS = [
  "Overview",
  "Services",
  "Projects",
  "Quotations",
  "Performance",
  "Documents",
  "Commercial",
  "Availability",
  "Activity",
  "Notes",
];

function Rating({ v, size = 12 }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      <Star size={size} className="text-[#333333] fill-[#1F453B]" />
      <span className="font-semibold text-[#333333]">
        {(v || 0).toFixed(1)}
      </span>
    </span>
  );
}

export default function VendorProfile() {
  const { id } = useParams();
  const nav = useNavigate();

  // RTK Query Hooks
  const { data: vendorResponse, isLoading, error, refetch } = useGetVendorByIdQuery(id, {
    skip: !id,
  });

  const { data: quotationsResponse } = useGetQuotationsByVendorQuery(id, {
    skip: !id,
  });

  const [tab, setTab] = useState("Overview");
  const [shortlistOpen, setShortlistOpen] = useState(false);
  const [note, setNote] = useState("");
  const [uploading, setUploading] = useState(false);

  const v = vendorResponse?.data || vendorResponse;

  if (isLoading) {
    return (
      <div className="p-10 text-center text-[13px] text-[#6B7B7C]">
        Loading vendor…
      </div>
    );
  }

  if (error || !v) {
    return (
      <div className="p-10 text-center text-[13px] text-red-600">
        Failed to load vendor profile
      </div>
    );
  }

  const quotations = quotationsResponse?.data || quotationsResponse?.success ? quotationsResponse.data : [];

  const load = () => refetch();

  // Actions
  const setPreferred = async () => {
    await api.post(`/vendors/${id}/set-preferred`);
    toast.success("Set as preferred");
    load();
  };

  const block = async () => {
    if (!confirm("Block this vendor?")) return;
    await api.post(`/vendors/${id}/block`);
    toast.success("Blocked");
    load();
  };

  const archive = async () => {
    await api.post(`/vendors/${id}/archive`);
    toast.success("Archived");
    nav("/vendors");
  };

  const addNote = async () => {
    if (!note.trim()) return;
    await api.post(`/vendors/${id}/notes`, { body: note });
    setNote("");
    load();
  };

  const delNote = async (nid) => {
    await api.delete(`/vendors/${id}/notes/${nid}`);
    load();
  };

  const upload = async (kind, file) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("kind", kind);
      fd.append("file", file);
      await api.post(`/vendors/${id}/attachments`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Uploaded");
      load();
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const rs = v.ratings_summary || {};

  return (
    <div className="space-y-6" data-testid="vendor-profile">
      <button
        onClick={() => nav("/vendors")}
        className="text-[13px] text-[#6B7B7C] hover:text-[#333333] flex items-center gap-1"
      >
        <ArrowLeft size={14} /> Back to Vendors
      </button>

      {/* Header */}
      <section className="bc-card p-6" data-testid="vendor-header">
        <div className="flex flex-col md:flex-row md:items-start gap-6">
          <div className="w-20 h-20 rounded-2xl bg-[#1F453B] text-white text-[36px] font-bold flex items-center justify-center shrink-0">
            {v.avatar_initials || v.name?.slice(0, 2)?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-[34px] font-bold text-[#333333] tracking-tight">
                {v.name}
              </h1>
              {v.verified && <ShieldCheck size={16} className="text-[#333333]" />}
              {v.preferred && (
                <span className="text-[10.5px] uppercase tracking-widest bg-[#EAEEF0] text-[#333333] px-2 py-0.5 rounded-full font-semibold">
                  Preferred
                </span>
              )}
              <span className="text-[10.5px] uppercase tracking-widest bg-[#EAEEF0] text-[#6B7B7C] px-2 py-0.5 rounded-full font-semibold">
                {v.status}
              </span>
            </div>
            <div className="text-[14px] text-[#6B7B7C] mt-1">
              {v.company || v.company_name} · {v.vendor_type || v.vendorCategory?.name}
            </div>
            <div className="text-[12.5px] text-[#6B7B7C] mt-1 flex items-center gap-3">
              <span className="flex items-center gap-1">
                <MapPin size={12} />
                {v.city || (v.address && v.address.split(",")[0])}, {v.state}
              </span>
              <Rating v={v.rating} />
              <span>{v.completed_projects} projects done</span>
              <span>{v.years_of_experience} yrs exp</span>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setShortlistOpen(true)}
              className="h-10 px-3 rounded-xl border border-[#B5C4B6] hover:bg-[#EAEEF0] text-[12.5px] font-semibold flex items-center gap-1"
              data-testid="profile-shortlist-btn"
            >
              <Bookmark size={13} /> Add to Shortlist
            </button>
            <button
              onClick={() => nav(`/quotations/new?vendor=${id}`)}
              className="h-10 px-3 rounded-xl border border-[#B5C4B6] hover:bg-[#EAEEF0] text-[12.5px] font-semibold"
            >
              Open in Quotations
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="h-10 w-10 rounded-xl border border-[#B5C4B6] hover:bg-[#EAEEF0] flex items-center justify-center">
                  <MoreHorizontal size={15} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={setPreferred}>
                  Set as Preferred
                </DropdownMenuItem>
                <DropdownMenuItem onClick={block} className="text-[#333333]">
                  Block
                </DropdownMenuItem>
                <DropdownMenuItem onClick={archive}>Archive</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </section>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 border-b border-[#B5C4B6]">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 h-10 text-[13px] font-semibold border-b-2 ${
              tab === t
                ? "border-[#1F453B] text-[#333333]"
                : "border-transparent text-[#6B7B7C] hover:text-[#333333]"
            }`}
            data-testid={`tab-${t.toLowerCase()}`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === "Overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 bc-card p-6">
            <h3 className="text-[13px] font-bold text-[#333333] mb-3">About</h3>
            <p className="text-[13px] text-[#6B7B7C]">
              {v.company || v.company_name} is a{" "}
              {(v.vendor_type || v.vendorCategory?.name || "").toLowerCase()}{" "}
              based in {v.city}, serving {(v.project_types || []).join(", ")}{" "}
              projects. {v.years_of_experience} years of experience with{" "}
              {v.completed_projects} completed projects.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
              {[
                ["Completed", v.completed_projects],
                ["Active", v.current_assignments],
                ["Avg Rating", (v.rating || 0).toFixed(1)],
                ["On-time %", v.on_time_pct],
              ].map(([k, val]) => (
                <div
                  key={k}
                  className="p-3 rounded-xl bg-[#EAEEF0] border border-[#B5C4B6]"
                >
                  <div className="text-[10.5px] uppercase tracking-widest text-[#B5C4B6]">
                    {k}
                  </div>
                  <div className="text-[18px] font-bold text-[#333333] mt-1">
                    {val}
                  </div>
                </div>
              ))}
            </div>
            {/* Specializations & Brands */}
            <div className="mt-5">
              <div className="text-[10.5px] uppercase tracking-widest text-[#B5C4B6] mb-2">
                Specializations
              </div>
              <div className="flex flex-wrap gap-1">
                {(v.specializations || []).map((s) => (
                  <span
                    key={s}
                    className="text-[11.5px] px-2 py-0.5 rounded-full bg-[#EAEEF0] text-[#6B7B7C]"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
            <div className="mt-4">
              <div className="text-[10.5px] uppercase tracking-widest text-[#B5C4B6] mb-2">
                Brands
              </div>
              <div className="flex flex-wrap gap-1">
                {(v.brands || []).map((s) => (
                  <span
                    key={s}
                    className="text-[11.5px] px-2 py-0.5 rounded-full bg-[#EAEEF0] text-[#6B7B7C]"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <div className="bc-card p-6">
            <h3 className="text-[13px] font-bold text-[#333333] mb-3">
              Latest Activity
            </h3>
            <ul className="space-y-3 text-[12.5px]">
              {(v.activity || []).slice(0, 6).map((a) => (
                <li key={a.id}>
                  <div className="text-[#333333]">{a.action}</div>
                  <div className="text-[11px] text-[#B5C4B6]">
                    {relativeTime(a.at)} · {a.actor}
                  </div>
                </li>
              ))}
              {(v.activity || []).length === 0 && (
                <li className="text-[#B5C4B6]">No activity yet.</li>
              )}
            </ul>
          </div>
        </div>
      )}

      {/* Services */}
      {tab === "Services" && (
        <div className="bc-card p-6 space-y-4">
          {[
            ["Product Categories", v.product_categories],
            ["Service Categories", v.service_categories],
            ["Brands", v.brands],
            ["Materials", v.materials],
            ["Certifications", v.certifications],
            ["Equipment", v.equipment_available],
          ].map(([k, arr]) => (
            <div key={k}>
              <div className="text-[10.5px] uppercase tracking-widest text-[#B5C4B6] mb-2">
                {k}
              </div>
              <div className="flex flex-wrap gap-1">
                {(arr || []).length === 0 ? (
                  <span className="text-[12.5px] text-[#B5C4B6]">—</span>
                ) : (
                  (arr || []).map((x) => (
                    <span
                      key={x}
                      className="text-[12px] px-2 py-0.5 rounded-full bg-[#EAEEF0] text-[#6B7B7C]"
                    >
                      {x}
                    </span>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Projects */}
      {tab === "Projects" && (
        <div className="bc-card p-6">
          {(v.projects_worked || []).length === 0 ? (
            <div className="text-[13px] text-[#B5C4B6]">
              No linked projects yet.
            </div>
          ) : (
            <table className="w-full text-left text-[13px]">
              <thead>
                <tr className="text-[10.5px] uppercase tracking-widest text-[#B5C4B6] border-b border-[#B5C4B6]">
                  <th className="py-2">Project</th>
                  <th>Type</th>
                  <th>Phase</th>
                  <th>Location</th>
                </tr>
              </thead>
              <tbody>
                {v.projects_worked.map((p) => (
                  <tr key={p.id} className="border-b border-[#B5C4B6]">
                    <td className="py-2 font-semibold">{p.name}</td>
                    <td>{p.type}</td>
                    <td>{p.current_phase}</td>
                    <td>{p.location}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Quotations - Using RTK Query */}
      {tab === "Quotations" && (
        <div className="bc-card p-6">
          {quotations.length === 0 ? (
            <div className="text-[13px] text-[#B5C4B6]">
              No quotations linked.
            </div>
          ) : (
            <table className="w-full text-left text-[13px]">
              <thead>
                <tr className="text-[10.5px] uppercase tracking-widest text-[#B5C4B6] border-b border-[#B5C4B6]">
                  <th className="py-2">Project</th>
                  <th>Category</th>
                  <th className="text-right">Amount</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {quotations.map((q) => (
                  <tr key={q.id} className="border-b border-[#B5C4B6]">
                    <td className="py-2">
                      {q.project_name || q.projectSnapshot?.name}
                    </td>
                    <td>{q.category}</td>
                    <td className="text-right font-semibold">
                      {formatINR(q.totalAmount || q.amount)}
                    </td>
                    <td className="capitalize">{q.status}</td>
                    <td className="text-right">
                      <button
                        onClick={() => nav(`/quotations/${q.id}`)}
                        className="text-[#333333] font-semibold hover:underline text-[12px]"
                      >
                        Open in Quotations
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Performance */}
      {tab === "Performance" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bc-card p-6">
            <h3 className="text-[13px] font-bold text-[#333333] mb-3">
              Rating Breakdown
            </h3>
            <div className="space-y-2 text-[12.5px]">
              {Object.entries(rs.breakdown || {}).map(([k, val]) => (
                <div key={k}>
                  <div className="flex justify-between mb-0.5">
                    <span className="capitalize text-[#6B7B7C]">
                      {k.replace("_", " ")}
                    </span>
                    <span className="font-semibold">{val}/5</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-[#B5C4B6]">
                    <div
                      className="h-full rounded-full bg-[#1F453B]"
                      style={{ width: `${(val / 5) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
              {Object.keys(rs.breakdown || {}).length === 0 && (
                <div className="text-[#B5C4B6]">No ratings yet.</div>
              )}
            </div>
          </div>
          <div className="bc-card p-6">
            <h3 className="text-[13px] font-bold text-[#333333] mb-3">
              Reviews ({rs.count || 0})
            </h3>
            <ul className="space-y-3 text-[12.5px] max-h-[300px] overflow-y-auto">
              {(v.ratings || []).map((r) => (
                <li
                  key={r.id}
                  className="p-3 rounded-lg bg-[#EAEEF0] border border-[#B5C4B6]"
                >
                  <div className="flex justify-between">
                    <span className="text-[#333333] font-semibold">
                      {r.given_by}
                    </span>
                    <Rating v={r.avg} />
                  </div>
                  <div className="text-[#6B7B7C] mt-1">{r.comment}</div>
                </li>
              ))}
              {(v.ratings || []).length === 0 && (
                <li className="text-[#B5C4B6]">No reviews yet.</li>
              )}
            </ul>
          </div>
        </div>
      )}

      {/* Documents */}
      {tab === "Documents" && (
        <div className="bc-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[13px] font-bold text-[#333333]">Documents</h3>
            <label
              className="h-9 px-3 rounded-lg bg-[#1F453B] text-white text-[12.5px] font-semibold flex items-center gap-1 cursor-pointer"
              data-testid="upload-doc-btn"
            >
              <Upload size={13} /> Upload
              <input
                type="file"
                className="hidden"
                onChange={(e) =>
                  e.target.files?.[0] && upload("portfolio", e.target.files[0])
                }
                disabled={uploading}
              />
            </label>
          </div>
          {(v.documents || []).length === 0 ? (
            <div className="text-[13px] text-[#B5C4B6]">No documents.</div>
          ) : (
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {v.documents.map((d) => (
                <li
                  key={d.id}
                  className="p-3 rounded-lg border border-[#B5C4B6] flex items-center gap-2"
                >
                  <FileText size={16} className="text-[#333333]" />
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-semibold text-[#333333] truncate">
                      {d.filename}
                    </div>
                    <div className="text-[11px] text-[#B5C4B6]">
                      {d.kind} · {formatDate(d.uploaded_at)} · {d.status}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Commercial */}
      {tab === "Commercial" && (
        <div className="bc-card p-6 grid grid-cols-2 gap-4 text-[13px]">
          {[
            ["Price Range", v.price_range],
            ["Payment Terms", v.payment_terms],
            ["Advance %", v.advance_pct + "%"],
            ["Credit Period", v.credit_period_days + " days"],
            ["GST", v.gst_number],
            ["PAN", v.pan],
            ["Warranty", v.warranty_available ? v.warranty_duration : "No"],
            ["Lead Time", v.lead_time_days + " days"],
          ].map(([k, val]) => (
            <div key={k}>
              <div className="text-[10.5px] uppercase tracking-widest text-[#B5C4B6]">
                {k}
              </div>
              <div className="text-[#333333] mt-0.5">{val || "—"}</div>
            </div>
          ))}
        </div>
      )}

      {/* Availability */}
      {tab === "Availability" && (
        <div className="bc-card p-6 grid grid-cols-2 gap-4 text-[13px]">
          {[
            ["Status", v.availability_status],
            ["Available From", formatDate(v.available_from)],
            ["Max Concurrent", v.max_concurrent_projects],
            ["Current Assignments", v.current_assignments],
            ["Emergency Available", v.emergency_availability ? "Yes" : "No"],
            ["Notes", v.notes],
          ].map(([k, val]) => (
            <div key={k}>
              <div className="text-[10.5px] uppercase tracking-widest text-[#B5C4B6]">
                {k}
              </div>
              <div className="text-[#333333] mt-0.5">{val || "—"}</div>
            </div>
          ))}
        </div>
      )}

      {/* Activity */}
      {tab === "Activity" && (
        <div className="bc-card p-6">
          <ul className="space-y-3 text-[13px]">
            {(v.activity || []).map((a) => (
              <li key={a.id} className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#1F453B] mt-2" />
                <div>
                  <div className="text-[#333333]">{a.action}</div>
                  <div className="text-[11.5px] text-[#B5C4B6]">
                    {a.actor} · {relativeTime(a.at)}
                  </div>
                </div>
              </li>
            ))}
            {(v.activity || []).length === 0 && (
              <li className="text-[#B5C4B6]">No activity yet.</li>
            )}
          </ul>
        </div>
      )}

      {/* Notes */}
      {tab === "Notes" && (
        <div className="bc-card p-6">
          <div className="flex gap-2 mb-4">
            <input
              className="bc-input"
              placeholder="Add an internal note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addNote()}
              data-testid="note-input"
            />
            <button
              onClick={addNote}
              className="h-10 px-4 rounded-xl bg-[#1F453B] text-white text-[13px] font-semibold"
              data-testid="note-add"
            >
              Add
            </button>
          </div>
          <ul className="space-y-3">
            {(v.notes || []).map((n) => (
              <li
                key={n.id}
                className="p-3 rounded-lg bg-[#EAEEF0] border border-[#B5C4B6]"
              >
                <div className="flex justify-between items-start">
                  <div className="text-[13px] text-[#333333]">{n.body}</div>
                  <button
                    onClick={() => delNote(n.id)}
                    className="text-[#B5C4B6] hover:text-[#333333]"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
                <div className="text-[11px] text-[#B5C4B6] mt-1">
                  {n.by} · {relativeTime(n.at)}
                </div>
              </li>
            ))}
            {(v.notes || []).length === 0 && (
              <li className="text-[13px] text-[#B5C4B6]">No notes yet.</li>
            )}
          </ul>
        </div>
      )}

      <AddToShortlistModal
        open={shortlistOpen}
        onClose={() => setShortlistOpen(false)}
        vendorId={id}
        onDone={load}
      />
    </div>
  );
}