import React, { useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, Edit3, Trash2, Printer } from "lucide-react";
import { Shell, Card } from "../../hooks/shared";
import {
  useGetScopeOfWorkByIdQuery,
  useDeleteScopeOfWorkMutation,
} from "../../api/scope-of-work.api";

// ---------------------------------------------------------------------------
// Brand tokens
// ---------------------------------------------------------------------------
const BRAND = {
  green: "#1B4332",
  greenSoft: "#3C6E58",
  gold: "#C9A227",
  goldSoft: "#DCC17E",
  ink: "#2A2A2A",
  muted: "#7A7A72",
  line: "#E4E0D3",
  paper: "#FFFFFF",
};

const LOGO_SRC = "/assets/branding/rippotai-mark.png";

const PROJECT_TYPES = [
  "Residential",
  "Commercial",
  "Hospitality",
  "Institutional",
];

const PROJECT_MODES = [
  { value: "CONSULTANCY", label: "Consultancy" },
  { value: "TURNKEY", label: "Turnkey" },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const formatDate = (value) => {
  if (!value) return "";
  try {
    return new Date(value).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return value;
  }
};

function CoverField({ label, value, wide }) {
  return (
    <div className={wide ? "col-span-2" : ""}>
      <div
        className="text-[10px] tracking-[0.14em] uppercase inline-block mr-1"
        style={{ color: BRAND.muted }}
      >
        {label}:
      </div>
      <span className="text-[13px] font-semibold" style={{ color: BRAND.ink }}>
        {value || ""}
      </span>
    </div>
  );
}

function SectionHeader({ number, title }) {
  return (
    <div className="flex items-center gap-3 mb-7">
      <div
        className="w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-xs font-bold text-white"
        style={{ backgroundColor: BRAND.green }}
      >
        {number}
      </div>
      <h2
        className="text-lg font-semibold tracking-tight"
        style={{ color: BRAND.green }}
      >
        {title}
      </h2>
      <div className="flex-1 h-px" style={{ backgroundColor: BRAND.line }} />
    </div>
  );
}

function Field({ label, value }) {
  return (
    <div>
      <span
        className="text-[11px] uppercase tracking-wide block mb-1"
        style={{ color: BRAND.muted }}
      >
        {label}
      </span>
      <span className="text-sm font-medium" style={{ color: BRAND.ink }}>
        {value || <span style={{ color: BRAND.line }}>—</span>}
      </span>
    </div>
  );
}

function CheckOption({ label, checked }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className="w-4 h-4 rounded-[3px] border flex items-center justify-center shrink-0"
        style={{
          borderColor: checked ? BRAND.gold : "#C9C4B4",
          backgroundColor: checked ? BRAND.gold : "transparent",
        }}
      >
        {checked && (
          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
            <path
              d="M1 4L3.5 6.5L9 1"
              stroke="white"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </span>
      <span className="text-sm" style={{ color: BRAND.ink }}>
        {label}
      </span>
    </div>
  );
}

function PageFooter({ address }) {
  return (
    <div
      className="px-14 py-4 flex justify-between text-[10px] uppercase tracking-[0.12em] print:break-inside-avoid"
      style={{ color: BRAND.muted, borderTop: `1px solid ${BRAND.line}` }}
    >
      <span>Scope of Work</span>
      <span>{address}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// PAGE COMPONENTS  (mirror the 8-page PDF structure)
// ---------------------------------------------------------------------------

/** Page 1 – Cover */
function CoverPage({ project, addressLine }) {
  return (
    <div className="print:break-after-page">
      <div className="px-14 pt-20 pb-10 flex flex-col items-center text-center min-h-[780px]">
        <img
          src={LOGO_SRC}
          alt="Rippotai"
          className="w-24 h-24 object-contain mb-6"
          onError={(e) => {
            e.currentTarget.style.display = "none";
            e.currentTarget.nextSibling.style.display = "flex";
          }}
        />
        <div
          className="w-24 h-24 rounded-full mb-6 items-center justify-center text-2xl font-semibold text-white"
          style={{ backgroundColor: BRAND.green, display: "none" }}
        >
          R
        </div>

        <div
          className="text-2xl tracking-[0.25em] font-medium"
          style={{ color: BRAND.green }}
        >
          RIPPŌTAI
        </div>
        <div
          className="text-lg tracking-[0.1em] mt-3"
          style={{ color: BRAND.green }}
        >
          SCOPE OF WORK
        </div>

        <div className="h-24" />

        <div className="w-full text-left space-y-4 mt-auto">
          <div
            className="pb-3"
            style={{ borderBottom: `1px solid ${BRAND.line}` }}
          >
            <CoverField label="Project" value={project.name} />
          </div>
          <div
            className="grid grid-cols-2 gap-x-8 pb-3"
            style={{ borderBottom: `1px solid ${BRAND.line}` }}
          >
            <CoverField label="Address" value={project.site_location} />
            <CoverField label="Client" value={project.client_name} />
          </div>
          <div
            className="grid grid-cols-2 gap-x-8 pb-3"
            style={{ borderBottom: `2px solid ${BRAND.gold}` }}
          >
            <CoverField
              label="Principle Architect"
              value={project.principal_architect}
            />
            <CoverField label="Project Lead" value={project.project_lead} />
          </div>
        </div>
      </div>
      <PageFooter address={addressLine} />
    </div>
  );
}

/** Page 2 – 01 Project details */
function ProjectDetailsPage({ project, sow, addressLine }) {
  return (
    <div className="print:break-after-page">
      <div className="px-14 py-12">
        <SectionHeader number="01" title="Project details" />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-10 gap-y-6 mb-10">
          <Field label="Project Name" value={project.name} />
          <Field label="Site Address" value={project.site_location} />
          <Field label="Prepared By" value={sow.preparedBy} />
          <Field label="Reviewed By" value={sow.reviewedBy} />
          <Field label="Client Name" value={project.client_name} />
          <Field label="Total Area (sq ft)" value={project.total_area_sqft} />
          <Field label="Date" value={formatDate(sow.updatedAt)} />
          <Field label="Version" value={`v${sow.version || 1}`} />
        </div>

        <div>
          <span
            className="text-[11px] uppercase tracking-wide block mb-3"
            style={{ color: BRAND.muted }}
          >
            Project Type
          </span>
          <div className="flex flex-wrap gap-x-8 gap-y-3">
            {PROJECT_TYPES.map((type) => (
              <CheckOption
                key={type}
                label={type}
                checked={
                  (project.type || "").toLowerCase() === type.toLowerCase()
                }
              />
            ))}
          </div>
        </div>
      </div>
      <PageFooter address={addressLine} />
    </div>
  );
}

/** Page 3 – 02 Project Type / Scope Summary */
function ProjectTypePage({ sow, addressLine }) {
  return (
    <div className="print:break-after-page">
      <div className="px-14 py-12">
        <SectionHeader number="02" title="Project Type" />

        <div className="flex gap-10 mb-10">
          {PROJECT_MODES.map((mode) => (
            <CheckOption
              key={mode.value}
              label={mode.label}
              checked={sow.projectMode === mode.value}
            />
          ))}
        </div>

        <div className="mb-10">
          <span
            className="text-[11px] uppercase tracking-wide block mb-2"
            style={{ color: BRAND.muted }}
          >
            Scope Summary
          </span>
          <p
            className="text-sm leading-relaxed whitespace-pre-line min-h-[80px]"
            style={{ color: BRAND.ink }}
          >
            {sow.scopeSummary || <span style={{ color: BRAND.line }}>—</span>}
          </p>
        </div>

        <div>
          <span
            className="text-[11px] uppercase tracking-wide block mb-2"
            style={{ color: BRAND.muted }}
          >
            Specific Exclusions Agreed
          </span>
          <p
            className="text-sm leading-relaxed whitespace-pre-line min-h-[60px]"
            style={{ color: BRAND.ink }}
          >
            {sow.specificExclusions || (
              <span style={{ color: BRAND.line }}>—</span>
            )}
          </p>
        </div>
      </div>
      <PageFooter address={addressLine} />
    </div>
  );
}

/** Pages 4-7 – Area-wise scope matrix (one table group per category) */
function ScopeMatrixPage({ categories, spaces, matrix, addressLine }) {
  if (categories.length === 0 || spaces.length === 0) {
    return (
      <div className="print:break-after-page">
        <div className="px-14 py-12">
          <SectionHeader number="03" title="Area-wise scope matrix" />
          <p className="text-sm" style={{ color: BRAND.muted }}>
            No scope items recorded yet.
          </p>
        </div>
        <PageFooter address={addressLine} />
      </div>
    );
  }

  // Split categories into visual groups that roughly match the PDF’s page breaks
  // (Civil + Demolition | Flooring + Electrical | Plumbing + Ceiling + Wall Paint | Furniture)
  const groups = [
    categories.filter((c) =>
      ["Civil work", "Demolition work"].includes(c.name),
    ),
    categories.filter((c) => ["Flooring", "Electrical"].includes(c.name)),
    categories.filter((c) =>
      ["Plumbing", "Ceiling", "Wall Paint"].includes(c.name),
    ),
    categories.filter((c) => c.name === "Furniture"),
  ].filter((g) => g.length > 0);

  // Fallback: if names don’t match the template, just put every category on its own page
  const finalGroups = groups.length > 0 ? groups : categories.map((c) => [c]);

  return (
    <>
      {finalGroups.map((group, groupIdx) => (
        <div key={groupIdx} className="print:break-after-page">
          <div className="px-14 py-12">
            {groupIdx === 0 && (
              <SectionHeader number="03" title="Area-wise scope matrix" />
            )}

            <div className="space-y-10">
              {group.map((category) => (
                <div key={category.id}>
                  <div
                    className="text-sm font-semibold mb-3 pb-2"
                    style={{
                      color: BRAND.green,
                      borderBottom: `1px solid ${BRAND.line}`,
                    }}
                  >
                    {category.name}
                  </div>

                  <table className="w-full text-sm">
                    <thead>
                      <tr
                        className="text-left text-[10px] uppercase tracking-wide"
                        style={{ color: BRAND.muted }}
                      >
                        <th className="py-2 pr-4 font-medium w-[26%]">Space</th>
                        <th className="py-2 font-medium">Scope of Work</th>
                      </tr>
                    </thead>
                    <tbody>
                      {spaces.map((space) => {
                        const item = matrix.get(category.id)?.get(space.id);
                        return (
                          <tr
                            key={space.id}
                            style={{ borderTop: `1px solid ${BRAND.line}` }}
                          >
                            <td
                              className="py-3 pr-4 align-top font-medium"
                              style={{ color: BRAND.ink }}
                            >
                              {space.name}
                            </td>
                            <td className="py-3 align-top">
                              {item ? (
                                <div className="space-y-1">
                                  <div className="flex items-start gap-2">
                                    <span style={{ color: BRAND.ink }}>
                                      {item.scopeOfWork || "—"}
                                    </span>
                                    {item.isExcluded ? (
                                      <span
                                        className="shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full"
                                        style={{
                                          backgroundColor: "#FBE4DE",
                                          color: "#B04D26",
                                        }}
                                      >
                                        Excluded
                                      </span>
                                    ) : item.isIncluded ? (
                                      <span
                                        className="shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full"
                                        style={{
                                          backgroundColor: "#E4F3E8",
                                          color: "#1F7A3D",
                                        }}
                                      >
                                        Included
                                      </span>
                                    ) : null}
                                  </div>
                                  {item.notes && (
                                    <div
                                      className="text-xs"
                                      style={{ color: BRAND.muted }}
                                    >
                                      {item.notes}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span style={{ color: BRAND.line }}>—</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          </div>
          <PageFooter address={addressLine} />
        </div>
      ))}
    </>
  );
}

/** Page 8 – Acceptance */
function AcceptancePage({ sow, addressLine }) {
  return (
    <div>
      <div className="px-14 py-12">
        <SectionHeader number="04" title="Acceptance" />

        <div className="mb-12">
          <span
            className="text-[11px] uppercase tracking-wide block mb-2"
            style={{ color: BRAND.muted }}
          >
            Notes
          </span>
          <p
            className="text-sm leading-relaxed whitespace-pre-line min-h-[60px]"
            style={{ color: BRAND.ink }}
          >
            {sow.notes || <span style={{ color: BRAND.line }}>—</span>}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-x-16">
          <div>
            <div
              className="text-[11px] uppercase tracking-wide mb-1"
              style={{ color: BRAND.muted }}
            >
              For Rippotai
            </div>
            <div
              className="text-sm font-medium mb-8"
              style={{ color: BRAND.ink }}
            >
              Authorised Signatory
            </div>
            <div
              className="pt-8 mb-2"
              style={{ borderTop: `1px solid ${BRAND.line}` }}
            />
            <div className="text-sm" style={{ color: BRAND.ink }}>
              Name · {sow.preparedBy || "—"}
            </div>
            <div className="text-sm" style={{ color: BRAND.ink }}>
              Date · {formatDate(sow.updatedAt) || "—"}
            </div>
          </div>

          <div>
            <div
              className="text-[11px] uppercase tracking-wide mb-1"
              style={{ color: BRAND.muted }}
            >
              Accepted By the Client
            </div>
            <div
              className="text-sm font-medium mb-8"
              style={{ color: BRAND.ink }}
            >
              Client Signature
            </div>
            <div
              className="pt-8 mb-2"
              style={{ borderTop: `1px solid ${BRAND.line}` }}
            />
            <div className="text-sm" style={{ color: BRAND.ink }}>
              Name · {sow.clientSignatureName || sow.acceptedBy || "—"}
            </div>
            <div className="text-sm" style={{ color: BRAND.ink }}>
              Date ·{" "}
              {formatDate(sow.clientSignatureDate || sow.acceptedAt) || "—"}
            </div>
          </div>
        </div>
      </div>
      <PageFooter address={addressLine} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main View
// ---------------------------------------------------------------------------
export function ScopeOfWorkView() {
  const { id } = useParams();
  const nav = useNavigate();

  const {
    data: sow,
    isFetching,
    isError,
  } = useGetScopeOfWorkByIdQuery(id, { skip: !id });

  const [deleteScopeOfWork, { isLoading: deleting }] =
    useDeleteScopeOfWorkMutation();

  const removeScopeOfWork = async () => {
    if (!window.confirm("Delete this scope of work? This cannot be undone."))
      return;
    try {
      await deleteScopeOfWork(id).unwrap();
      toast.success("Scope of work deleted");
      nav("/scope-of-work");
    } catch (e) {
      toast.error(e?.data?.detail || "Failed to delete");
    }
  };

  const printReport = () => window.print();

  const { categories, spaces, matrix } = useMemo(() => {
    const items = sow?.items || [];

    const categoryMap = new Map();
    const spaceMap = new Map();

    items.forEach((item) => {
      if (item.scopeCategory)
        categoryMap.set(item.scopeCategory.id, item.scopeCategory);
      if (item.projectSpace)
        spaceMap.set(item.projectSpace.id, item.projectSpace);
    });

    const categories = Array.from(categoryMap.values()).sort(
      (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0),
    );
    const spaces = Array.from(spaceMap.values()).sort(
      (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0),
    );

    const matrix = new Map();
    items.forEach((item) => {
      const catId = item.scopeCategory?.id;
      const spaceId = item.projectSpace?.id;
      if (!catId || !spaceId) return;
      if (!matrix.has(catId)) matrix.set(catId, new Map());
      matrix.get(catId).set(spaceId, item);
    });

    return { categories, spaces, matrix };
  }, [sow]);

  if (isFetching) {
    return (
      <Shell title="Scope of Work">
        <div className="text-[13px] text-[#6B7B7C]">Loading…</div>
      </Shell>
    );
  }

  if (isError || !sow) {
    return (
      <Shell title="Scope of Work">
        <Card>
          <div className="text-center text-[#B5C4B6] py-8">
            Scope of work not found, or you don't have access to it.
          </div>
        </Card>
      </Shell>
    );
  }

  const project = sow.project || {};
  const addressLine = [project.name, project.site_location]
    .filter(Boolean)
    .join(", ");

  return (
    <Shell
      title="Scope of Work"
      subtitle={`${project.name || "Project"} • v${sow.version || 1}`}
      action={
        <div className="flex items-center gap-2">
          <button
            onClick={() => nav("/scope-of-work")}
            className="h-10 px-4 rounded-lg border border-[#DDD8CE] text-[13px] font-semibold text-[#333333] inline-flex items-center gap-1.5"
          >
            <ArrowLeft size={14} /> Back
          </button>
          <button
            onClick={() => nav(`/scope-of-work/${id}/edit`)}
            className="h-10 px-4 rounded-lg border border-[#B5C4B6] text-[13px] font-semibold text-[#333333] inline-flex items-center gap-1.5"
          >
            <Edit3 size={14} /> Edit
          </button>
          <button
            onClick={printReport}
            className="h-10 px-4 rounded-lg border border-[#B5C4B6] text-[13px] font-semibold text-[#333333] inline-flex items-center gap-1.5"
          >
            <Printer size={14} /> Print
          </button>
          <button
            onClick={removeScopeOfWork}
            disabled={deleting}
            className="h-10 px-4 rounded-lg border border-[#E3B7A4] text-[13px] font-semibold text-[#B04D26] inline-flex items-center gap-1.5 disabled:opacity-50"
          >
            <Trash2 size={14} /> Delete
          </button>
        </div>
      }
    >
      {/* Global print styles */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .sow-document, .sow-document * { visibility: visible; }
          .sow-document {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            box-shadow: none !important;
            border: none !important;
          }
          .print\\:break-after-page { page-break-after: always; }
          .print\\:break-inside-avoid { page-break-inside: avoid; }
        }
      `}</style>

      <div
        className="sow-document max-w-4xl mx-auto shadow-sm print:shadow-none"
        style={{
          backgroundColor: BRAND.paper,
          border: `1px solid ${BRAND.line}`,
        }}
      >
        <CoverPage project={project} addressLine={addressLine} />
        <ProjectDetailsPage
          project={project}
          sow={sow}
          addressLine={addressLine}
        />
        <ProjectTypePage sow={sow} addressLine={addressLine} />
        <ScopeMatrixPage
          categories={categories}
          spaces={spaces}
          matrix={matrix}
          addressLine={addressLine}
        />
        <AcceptancePage sow={sow} addressLine={addressLine} />
      </div>
    </Shell>
  );
}
