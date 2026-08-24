import React, { useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, Edit3, Trash2, Download, Loader2 } from "lucide-react";
import html2pdf from "html2pdf.js";

import { Shell, Card } from "../../hooks/shared";

import {
  useGetScopeOfWorkByIdQuery,
  useDeleteScopeOfWorkMutation,
} from "../../api/scope-of-work.api";

// ---------------------------------------------------------------------------
// BRAND
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
  {
    value: "CONSULTANCY",
    label: "Consultancy",
  },
  {
    value: "TURNKEY",
    label: "Turnkey",
  },
];

// ---------------------------------------------------------------------------
// HELPERS
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

const sanitizeFilename = (value) => {
  return String(value || "Scope-of-Work")
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
};

// ---------------------------------------------------------------------------
// PDF PAGE
// ---------------------------------------------------------------------------

function SowPdfPage({ children, className = "", pageNumber, totalPages }) {
  return (
    <div className={`sow-pdf-page ${className}`} data-page-number={pageNumber}>
      {children}

      {pageNumber && totalPages && (
        <div
          className="absolute bottom-3 left-0 right-0 text-center"
          style={{
            color: BRAND.muted,
            fontSize: "8px",
            letterSpacing: "0.12em",
          }}
        >
          PAGE {pageNumber} OF {totalPages}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// COVER FIELD
// ---------------------------------------------------------------------------

function CoverField({ label, value, wide = false }) {
  return (
    <div className={wide ? "col-span-2" : ""}>
      <div
        className="text-[10px] tracking-[0.14em] uppercase inline-block mr-1"
        style={{
          color: BRAND.muted,
        }}
      >
        {label}:
      </div>

      <span
        className="text-[13px] font-semibold"
        style={{
          color: BRAND.ink,
        }}
      >
        {value || "—"}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// SECTION HEADER
// ---------------------------------------------------------------------------

function SectionHeader({ number, title }) {
  return (
    <div className="flex items-center gap-3 mb-7">
      <div
        className="w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-xs font-bold text-white"
        style={{
          backgroundColor: BRAND.green,
        }}
      >
        {number}
      </div>

      <h2
        className="text-lg font-semibold tracking-tight"
        style={{
          color: BRAND.green,
        }}
      >
        {title}
      </h2>

      <div
        className="flex-1 h-px"
        style={{
          backgroundColor: BRAND.line,
        }}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// FIELD
// ---------------------------------------------------------------------------

function Field({ label, value }) {
  return (
    <div>
      <span
        className="text-[11px] uppercase tracking-wide block mb-1"
        style={{
          color: BRAND.muted,
        }}
      >
        {label}
      </span>

      <span
        className="text-sm font-medium"
        style={{
          color: BRAND.ink,
        }}
      >
        {value || (
          <span
            style={{
              color: BRAND.line,
            }}
          >
            —
          </span>
        )}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// CHECK OPTION
// ---------------------------------------------------------------------------

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

      <span
        className="text-sm"
        style={{
          color: BRAND.ink,
        }}
      >
        {label}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// FOOTER
// ---------------------------------------------------------------------------

function PageFooter({ address }) {
  return (
    <div
      className="absolute bottom-8 left-14 right-14 px-0 py-3 flex justify-between text-[9px] uppercase tracking-[0.12em]"
      style={{
        color: BRAND.muted,
        borderTop: `1px solid ${BRAND.line}`,
      }}
    >
      <span>RIPPŌTAI · SCOPE OF WORK</span>

      <span>{address || ""}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// PAGE 1 — COVER
// ---------------------------------------------------------------------------

function CoverPage({ project, addressLine, pageNumber, totalPages }) {
  return (
    <SowPdfPage pageNumber={pageNumber} totalPages={totalPages}>
      <div className="px-14 pt-20 pb-20 flex flex-col items-center text-center h-full">
        <img
          src={LOGO_SRC}
          alt="Rippotai"
          className="w-24 h-24 object-contain mb-6"
          crossOrigin="anonymous"
          onError={(e) => {
            e.currentTarget.style.display = "none";

            if (e.currentTarget.nextSibling) {
              e.currentTarget.nextSibling.style.display = "flex";
            }
          }}
        />

        <div
          className="w-24 h-24 rounded-full mb-6 items-center justify-center text-2xl font-semibold text-white"
          style={{
            backgroundColor: BRAND.green,
            display: "none",
          }}
        >
          R
        </div>

        <div
          className="text-2xl tracking-[0.25em] font-medium"
          style={{
            color: BRAND.green,
          }}
        >
          RIPPŌTAI
        </div>

        <div
          className="text-lg tracking-[0.1em] mt-3"
          style={{
            color: BRAND.green,
          }}
        >
          SCOPE OF WORK
        </div>

        <div className="flex-1 min-h-[100px]" />

        <div className="w-full text-left space-y-4">
          <div
            className="pb-3"
            style={{
              borderBottom: `1px solid ${BRAND.line}`,
            }}
          >
            <CoverField label="Project" value={project.name} />
          </div>

          <div
            className="grid grid-cols-2 gap-x-8 pb-3"
            style={{
              borderBottom: `1px solid ${BRAND.line}`,
            }}
          >
            <CoverField label="Address" value={project.site_location} />

            <CoverField label="Client" value={project.client_name} />
          </div>

          <div
            className="grid grid-cols-2 gap-x-8 pb-3"
            style={{
              borderBottom: `2px solid ${BRAND.gold}`,
            }}
          >
            <CoverField
              label="Principal Architect"
              value={project.principal_architect}
            />

            <CoverField label="Project Lead" value={project.project_lead} />
          </div>
        </div>
      </div>

      <PageFooter address={addressLine} />
    </SowPdfPage>
  );
}

// ---------------------------------------------------------------------------
// PAGE 2 — PROJECT DETAILS
// ---------------------------------------------------------------------------

function ProjectDetailsPage({
  project,
  sow,
  addressLine,
  pageNumber,
  totalPages,
}) {
  return (
    <SowPdfPage pageNumber={pageNumber} totalPages={totalPages}>
      <div className="px-14 py-12">
        <SectionHeader number="01" title="Project details" />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-10 gap-y-7 mb-12">
          <Field label="Project Name" value={project.name} />

          <Field label="Site Address" value={project.site_location} />

          <Field label="Prepared By" value={sow.preparedBy} />

          <Field label="Reviewed By" value={sow.reviewedBy} />

          <Field label="Client Name" value={project.client_name} />

          <Field label="Total Area (sq ft)" value={project.total_area_sqft} />

          <Field label="Date" value={formatDate(sow.updatedAt)} />

          <Field label="Version" value={`v${sow.version || 1}`} />
        </div>

        <div className="mb-10">
          <span
            className="text-[11px] uppercase tracking-wide block mb-4"
            style={{
              color: BRAND.muted,
            }}
          >
            Project Type
          </span>

          <div className="grid grid-cols-2 gap-y-4">
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

        <div
          className="mt-14 p-5 rounded-lg"
          style={{
            backgroundColor: "#F8F6F0",
            border: `1px solid ${BRAND.line}`,
          }}
        >
          <div
            className="text-[10px] uppercase tracking-[0.14em] mb-2 font-semibold"
            style={{
              color: BRAND.green,
            }}
          >
            Document Information
          </div>

          <div className="grid grid-cols-2 gap-5">
            <Field label="Document" value="Scope of Work" />

            <Field label="Revision" value={`Version ${sow.version || 1}`} />
          </div>
        </div>
      </div>

      <PageFooter address={addressLine} />
    </SowPdfPage>
  );
}

// ---------------------------------------------------------------------------
// PAGE 3 — PROJECT TYPE
// ---------------------------------------------------------------------------

function ProjectTypePage({ sow, addressLine, pageNumber, totalPages }) {
  return (
    <SowPdfPage pageNumber={pageNumber} totalPages={totalPages}>
      <div className="px-14 py-12">
        <SectionHeader number="02" title="Project Type" />

        <div className="mb-12">
          <span
            className="text-[11px] uppercase tracking-wide block mb-4"
            style={{
              color: BRAND.muted,
            }}
          >
            Project Mode
          </span>

          <div className="flex gap-12">
            {PROJECT_MODES.map((mode) => (
              <CheckOption
                key={mode.value}
                label={mode.label}
                checked={sow.projectMode === mode.value}
              />
            ))}
          </div>
        </div>

        <div className="mb-12">
          <span
            className="text-[11px] uppercase tracking-wide block mb-3"
            style={{
              color: BRAND.muted,
            }}
          >
            Scope Summary
          </span>

          <div
            className="p-5 rounded-lg min-h-[180px]"
            style={{
              backgroundColor: "#FAF9F5",
              border: `1px solid ${BRAND.line}`,
            }}
          >
            <p
              className="text-sm leading-relaxed whitespace-pre-line"
              style={{
                color: BRAND.ink,
              }}
            >
              {sow.scopeSummary || (
                <span
                  style={{
                    color: BRAND.line,
                  }}
                >
                  —
                </span>
              )}
            </p>
          </div>
        </div>

        <div>
          <span
            className="text-[11px] uppercase tracking-wide block mb-3"
            style={{
              color: BRAND.muted,
            }}
          >
            Specific Exclusions Agreed
          </span>

          <div
            className="p-5 rounded-lg min-h-[150px]"
            style={{
              backgroundColor: "#FAF9F5",
              border: `1px solid ${BRAND.line}`,
            }}
          >
            <p
              className="text-sm leading-relaxed whitespace-pre-line"
              style={{
                color: BRAND.ink,
              }}
            >
              {sow.specificExclusions || (
                <span
                  style={{
                    color: BRAND.line,
                  }}
                >
                  —
                </span>
              )}
            </p>
          </div>
        </div>
      </div>

      <PageFooter address={addressLine} />
    </SowPdfPage>
  );
}

// ---------------------------------------------------------------------------
// SCOPE CATEGORY GROUPS
// ---------------------------------------------------------------------------

function buildScopeGroups(categories) {
  const predefinedGroups = [
    {
      names: ["Civil work", "Demolition work"],
    },

    {
      names: ["Flooring", "Electrical"],
    },

    {
      names: ["Plumbing", "Ceiling", "Wall Paint"],
    },

    {
      names: ["Furniture"],
    },
  ];

  const groups = predefinedGroups
    .map((group) => {
      return categories.filter((category) =>
        group.names.includes(category.name),
      );
    })
    .filter((group) => group.length > 0);

  /*
   * Categories that weren't included in the
   * predefined groups are added as individual
   * pages.
   */
  const groupedIds = new Set(groups.flat().map((category) => category.id));

  const remaining = categories.filter(
    (category) => !groupedIds.has(category.id),
  );

  remaining.forEach((category) => {
    groups.push([category]);
  });

  return groups;
}

// ---------------------------------------------------------------------------
// SCOPE CATEGORY
// ---------------------------------------------------------------------------

function ScopeCategory({ category, spaces, matrix }) {
  return (
    <div>
      <div
        className="text-sm font-semibold mb-3 pb-2"
        style={{
          color: BRAND.green,
          borderBottom: `1px solid ${BRAND.line}`,
        }}
      >
        {category.name}
      </div>

      <table className="w-full text-[11px] border-collapse">
        <thead>
          <tr
            className="text-left uppercase tracking-wide"
            style={{
              color: BRAND.muted,
            }}
          >
            <th
              className="py-2 pr-4 font-medium"
              style={{
                width: "26%",
              }}
            >
              Space
            </th>

            <th className="py-2 font-medium">Scope of Work</th>
          </tr>
        </thead>

        <tbody>
          {spaces.map((space) => {
            const item = matrix.get(category.id)?.get(space.id);

            return (
              <tr
                key={space.id}
                style={{
                  borderTop: `1px solid ${BRAND.line}`,
                }}
              >
                <td
                  className="py-2.5 pr-4 align-top font-medium"
                  style={{
                    color: BRAND.ink,
                  }}
                >
                  {space.name}
                </td>

                <td className="py-2.5 align-top">
                  {item ? (
                    <div className="space-y-1">
                      <div className="flex items-start gap-2">
                        <span
                          className="leading-relaxed"
                          style={{
                            color: BRAND.ink,
                          }}
                        >
                          {item.scopeOfWork || "—"}
                        </span>

                        {item.isExcluded && (
                          <span
                            className="shrink-0 text-[8px] font-semibold px-2 py-0.5 rounded-full"
                            style={{
                              backgroundColor: "#FBE4DE",
                              color: "#B04D26",
                            }}
                          >
                            Excluded
                          </span>
                        )}

                        {!item.isExcluded && item.isIncluded && (
                          <span
                            className="shrink-0 text-[8px] font-semibold px-2 py-0.5 rounded-full"
                            style={{
                              backgroundColor: "#E4F3E8",
                              color: "#1F7A3D",
                            }}
                          >
                            Included
                          </span>
                        )}
                      </div>

                      {item.notes && (
                        <div
                          className="text-[10px] leading-relaxed"
                          style={{
                            color: BRAND.muted,
                          }}
                        >
                          {item.notes}
                        </div>
                      )}
                    </div>
                  ) : (
                    <span
                      style={{
                        color: BRAND.line,
                      }}
                    >
                      —
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ---------------------------------------------------------------------------
// SCOPE MATRIX PAGES
// ---------------------------------------------------------------------------

function ScopeMatrixPages({
  categories,
  spaces,
  matrix,
  addressLine,
  startingPageNumber,
}) {
  if (categories.length === 0 || spaces.length === 0) {
    return [
      <SowPdfPage
        key="empty-scope"
        pageNumber={startingPageNumber}
        totalPages={startingPageNumber}
      >
        <div className="px-14 py-12">
          <SectionHeader number="03" title="Area-wise scope matrix" />

          <div
            className="p-8 rounded-lg text-center"
            style={{
              backgroundColor: "#FAF9F5",
              border: `1px solid ${BRAND.line}`,
            }}
          >
            <p
              className="text-sm"
              style={{
                color: BRAND.muted,
              }}
            >
              No scope items recorded yet.
            </p>
          </div>
        </div>

        <PageFooter address={addressLine} />
      </SowPdfPage>,
    ];
  }

  const groups = buildScopeGroups(categories);

  return groups.map((group, index) => (
    <SowPdfPage
      key={`scope-page-${index}`}
      pageNumber={startingPageNumber + index}
      totalPages={startingPageNumber + groups.length}
    >
      <div className="px-14 py-12">
        {index === 0 && (
          <SectionHeader number="03" title="Area-wise scope matrix" />
        )}

        {index > 0 && (
          <div className="mb-7">
            <div
              className="text-[10px] uppercase tracking-[0.14em] font-semibold mb-2"
              style={{
                color: BRAND.muted,
              }}
            >
              03 · Area-wise scope matrix
            </div>

            <div
              className="h-px"
              style={{
                backgroundColor: BRAND.line,
              }}
            />
          </div>
        )}

        <div className="space-y-8">
          {group.map((category) => (
            <ScopeCategory
              key={category.id}
              category={category}
              spaces={spaces}
              matrix={matrix}
            />
          ))}
        </div>
      </div>

      <PageFooter address={addressLine} />
    </SowPdfPage>
  ));
}

// ---------------------------------------------------------------------------
// ACCEPTANCE
// ---------------------------------------------------------------------------

function AcceptancePage({ sow, addressLine, pageNumber, totalPages }) {
  return (
    <SowPdfPage pageNumber={pageNumber} totalPages={totalPages}>
      <div className="px-14 py-12">
        <SectionHeader number="04" title="Acceptance" />

        <div className="mb-14">
          <span
            className="text-[11px] uppercase tracking-wide block mb-3"
            style={{
              color: BRAND.muted,
            }}
          >
            Notes
          </span>

          <div
            className="p-5 rounded-lg min-h-[150px]"
            style={{
              backgroundColor: "#FAF9F5",
              border: `1px solid ${BRAND.line}`,
            }}
          >
            <p
              className="text-sm leading-relaxed whitespace-pre-line"
              style={{
                color: BRAND.ink,
              }}
            >
              {sow.notes || (
                <span
                  style={{
                    color: BRAND.line,
                  }}
                >
                  —
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-16">
          {/* RIPPOTAI */}
          <div>
            <div
              className="text-[11px] uppercase tracking-wide mb-1"
              style={{
                color: BRAND.muted,
              }}
            >
              For Rippotai
            </div>

            <div
              className="text-sm font-medium mb-12"
              style={{
                color: BRAND.ink,
              }}
            >
              Authorised Signatory
            </div>

            <div
              className="pt-8 mb-3"
              style={{
                borderTop: `1px solid ${BRAND.line}`,
              }}
            />

            <div
              className="text-sm mb-1"
              style={{
                color: BRAND.ink,
              }}
            >
              Name · {sow.preparedBy || "—"}
            </div>

            <div
              className="text-sm"
              style={{
                color: BRAND.ink,
              }}
            >
              Date · {formatDate(sow.updatedAt) || "—"}
            </div>
          </div>

          {/* CLIENT */}
          <div>
            <div
              className="text-[11px] uppercase tracking-wide mb-1"
              style={{
                color: BRAND.muted,
              }}
            >
              Accepted By the Client
            </div>

            <div
              className="text-sm font-medium mb-12"
              style={{
                color: BRAND.ink,
              }}
            >
              Client Signature
            </div>

            <div
              className="pt-8 mb-3"
              style={{
                borderTop: `1px solid ${BRAND.line}`,
              }}
            />

            <div
              className="text-sm mb-1"
              style={{
                color: BRAND.ink,
              }}
            >
              Name · {sow.clientSignatureName || sow.acceptedBy || "—"}
            </div>

            <div
              className="text-sm"
              style={{
                color: BRAND.ink,
              }}
            >
              Date ·{" "}
              {formatDate(sow.clientSignatureDate || sow.acceptedAt) || "—"}
            </div>
          </div>
        </div>

        <div
          className="mt-20 p-5 rounded-lg"
          style={{
            backgroundColor: "#F5F2E9",
            border: `1px solid ${BRAND.goldSoft}`,
          }}
        >
          <div
            className="text-[10px] uppercase tracking-[0.14em] font-semibold mb-2"
            style={{
              color: BRAND.green,
            }}
          >
            Acceptance Statement
          </div>

          <p
            className="text-xs leading-relaxed"
            style={{
              color: BRAND.ink,
            }}
          >
            By signing above, the parties acknowledge that the scope of work
            described in this document represents the agreed scope for the
            project, subject to any approved variations or subsequent written
            amendments.
          </p>
        </div>
      </div>

      <PageFooter address={addressLine} />
    </SowPdfPage>
  );
}

// ---------------------------------------------------------------------------
// MAIN VIEW
// ---------------------------------------------------------------------------

export function ScopeOfWorkView() {
  const { id } = useParams();
  const nav = useNavigate();

  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const {
    data: sow,
    isFetching,
    isError,
  } = useGetScopeOfWorkByIdQuery(id, {
    skip: !id,
  });

  const [deleteScopeOfWork, { isLoading: deleting }] =
    useDeleteScopeOfWorkMutation();

  // -------------------------------------------------------------------------
  // DELETE
  // -------------------------------------------------------------------------

  const removeScopeOfWork = async () => {
    if (!window.confirm("Delete this scope of work? This cannot be undone.")) {
      return;
    }

    try {
      await deleteScopeOfWork(id).unwrap();

      toast.success("Scope of work deleted");

      nav("/scope-of-work");
    } catch (e) {
      toast.error(e?.data?.detail || e?.data?.message || "Failed to delete");
    }
  };

  // -------------------------------------------------------------------------
  // DATA
  // -------------------------------------------------------------------------

  const { categories, spaces, matrix } = useMemo(() => {
    const items = sow?.items || [];

    const categoryMap = new Map();
    const spaceMap = new Map();

    items.forEach((item) => {
      if (item.scopeCategory) {
        categoryMap.set(item.scopeCategory.id, item.scopeCategory);
      }

      if (item.projectSpace) {
        spaceMap.set(item.projectSpace.id, item.projectSpace);
      }
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

      if (!catId || !spaceId) {
        return;
      }

      if (!matrix.has(catId)) {
        matrix.set(catId, new Map());
      }

      matrix.get(catId).set(spaceId, item);
    });

    return {
      categories,
      spaces,
      matrix,
    };
  }, [sow]);

  // -------------------------------------------------------------------------
  // LOADING
  // -------------------------------------------------------------------------

  if (isFetching) {
    return (
      <Shell title="Scope of Work">
        <div className="flex items-center gap-2 text-[13px] text-[#6B7B7C]">
          <Loader2 size={15} className="animate-spin" />
          Loading…
        </div>
      </Shell>
    );
  }

  // -------------------------------------------------------------------------
  // ERROR
  // -------------------------------------------------------------------------

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

  // -------------------------------------------------------------------------
  // PROJECT
  // -------------------------------------------------------------------------

  const project = sow.project || {};

  const addressLine = [project.name, project.site_location]
    .filter(Boolean)
    .join(", ");

  // -------------------------------------------------------------------------
  // PDF PAGE COUNT
  // -------------------------------------------------------------------------

  const scopeGroups = buildScopeGroups(categories);

  const scopePageCount =
    categories.length === 0 || spaces.length === 0 ? 1 : scopeGroups.length;

  const totalPages = 3 + scopePageCount + 1;

  const scopeStartingPage = 4;

  const acceptancePageNumber = 4 + scopePageCount;

  // -------------------------------------------------------------------------
  // DOWNLOAD PDF
  // -------------------------------------------------------------------------

  const downloadPdf = async () => {
    if (isGeneratingPdf) {
      return;
    }

    const element = document.getElementById("sow-pdf-document");

    if (!element) {
      toast.error("Unable to generate PDF");
      return;
    }

    try {
      setIsGeneratingPdf(true);

      toast.loading("Generating Scope of Work PDF...", {
        id: "sow-pdf",
      });

      /*
       * Give the browser a moment to make sure
       * images/fonts/layout are fully rendered.
       */
      await new Promise((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(resolve)),
      );

      const projectName = sanitizeFilename(project.name || "Project");

      const version = sow.version || 1;

      const filename = `${projectName}-Scope-of-Work-v${version}.pdf`;

      const options = {
        margin: 0,

        filename,

        image: {
          type: "jpeg",
          quality: 0.98,
        },

        html2canvas: {
          scale: 2,

          useCORS: true,

          allowTaint: false,

          backgroundColor: "#FFFFFF",

          logging: false,

          /*
           * A4 pixel dimensions.
           */
          width: 794,

          windowWidth: 794,

          scrollX: 0,

          scrollY: 0,
        },

        jsPDF: {
          unit: "px",

          format: [794, 1123],

          orientation: "portrait",

          compress: true,
        },

        pagebreak: {
          mode: ["css", "legacy"],

          before: ".sow-pdf-page",
        },
      };

      await html2pdf().set(options).from(element).save();

      toast.success("Scope of work downloaded successfully", {
        id: "sow-pdf",
      });
    } catch (error) {
      console.error("Scope of Work PDF generation failed:", error);

      toast.error("Failed to generate PDF", {
        id: "sow-pdf",
      });
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // -------------------------------------------------------------------------
  // RENDER
  // -------------------------------------------------------------------------

  return (
    <Shell
      title="Scope of Work"
      subtitle={`${project.name || "Project"} • v${sow.version || 1}`}
      action={
        <div className="flex items-center gap-2">
          {/* BACK */}
          <button
            onClick={() => nav("/scope-of-work")}
            className="h-10 px-4 rounded-lg border border-[#DDD8CE] bg-white text-[13px] font-semibold text-[#333333] inline-flex items-center gap-1.5 hover:bg-[#F8F7F3] transition-colors"
          >
            <ArrowLeft size={14} />
            Back
          </button>

          {/* EDIT */}
          <button
            onClick={() => nav(`/scope-of-work/${id}/edit`)}
            className="h-10 px-4 rounded-lg border border-[#B5C4B6] bg-white text-[13px] font-semibold text-[#333333] inline-flex items-center gap-1.5 hover:bg-[#F4F7F3] transition-colors"
          >
            <Edit3 size={14} />
            Edit
          </button>

          {/* DOWNLOAD PDF */}
          <button
            onClick={downloadPdf}
            disabled={isGeneratingPdf}
            className="h-10 px-4 rounded-lg bg-[#1B4332] text-white text-[13px] font-semibold inline-flex items-center gap-1.5 hover:bg-[#143326] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isGeneratingPdf ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <Download size={15} />
            )}

            {isGeneratingPdf ? "Generating..." : "Download PDF"}
          </button>

          {/* DELETE */}
          <button
            onClick={removeScopeOfWork}
            disabled={deleting}
            className="h-10 px-4 rounded-lg border border-[#E3B7A4] bg-white text-[13px] font-semibold text-[#B04D26] inline-flex items-center gap-1.5 hover:bg-[#FFF8F5] transition-colors disabled:opacity-50"
          >
            {deleting ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Trash2 size={14} />
            )}
            Delete
          </button>
        </div>
      }
    >
      {/* ------------------------------------------------------------------ */}
      {/* PDF DOCUMENT                                                      */}
      {/* ------------------------------------------------------------------ */}

      <div className="sow-pdf-export">
        <div id="sow-pdf-document" className="sow-pdf-document">
          {/* ============================================================= */}
          {/* PAGE 1 — COVER                                                */}
          {/* ============================================================= */}

          <CoverPage
            project={project}
            addressLine={addressLine}
            pageNumber={1}
            totalPages={totalPages}
          />

          {/* ============================================================= */}
          {/* PAGE 2 — PROJECT DETAILS                                      */}
          {/* ============================================================= */}

          <ProjectDetailsPage
            project={project}
            sow={sow}
            addressLine={addressLine}
            pageNumber={2}
            totalPages={totalPages}
          />

          {/* ============================================================= */}
          {/* PAGE 3 — PROJECT TYPE                                         */}
          {/* ============================================================= */}

          <ProjectTypePage
            sow={sow}
            addressLine={addressLine}
            pageNumber={3}
            totalPages={totalPages}
          />

          {/* ============================================================= */}
          {/* PAGE 4+ — SCOPE MATRIX                                        */}
          {/* ============================================================= */}

          {ScopeMatrixPages({
            categories,
            spaces,
            matrix,
            addressLine,
            startingPageNumber: scopeStartingPage,
          }).map((page, index) =>
            React.cloneElement(page, {
              totalPages,
            }),
          )}

          {/* ============================================================= */}
          {/* FINAL PAGE — ACCEPTANCE                                       */}
          {/* ============================================================= */}

          <AcceptancePage
            sow={sow}
            addressLine={addressLine}
            pageNumber={acceptancePageNumber}
            totalPages={totalPages}
          />
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* PDF STYLES                                                        */}
      {/* ------------------------------------------------------------------ */}

      <style>{`
        /*
         * ================================================================
         * A4 PDF DOCUMENT
         * ================================================================
         */

        .sow-pdf-export {
          width: 100%;
          background: #f4f2ec;
          padding: 32px 0;
        }

        .sow-pdf-document {
          width: 794px;
          margin: 0 auto;
          background: #ffffff;
        }

        /*
         * 794 x 1123 approximates A4 at 96 DPI.
         *
         * Every .sow-pdf-page is one physical PDF page.
         */
        .sow-pdf-page {
          position: relative;

          width: 794px;
          height: 1123px;
          min-height: 1123px;

          background: #ffffff;

          overflow: hidden;

          box-sizing: border-box;

          page-break-after: always;
          break-after: page;

          page-break-inside: avoid;
          break-inside: avoid;
        }

        .sow-pdf-page:last-child {
          page-break-after: auto;
          break-after: auto;
        }

        /*
         * Tables must stay together.
         */
        .sow-pdf-page table {
          page-break-inside: avoid;
          break-inside: avoid;

          width: 100%;
        }

        .sow-pdf-page tr {
          page-break-inside: avoid;
          break-inside: avoid;
        }

        /*
         * Avoid accidental browser selection while
         * generating the document.
         */
        .sow-pdf-document {
          user-select: none;
        }

        /*
         * Screen view.
         */
        @media screen {
          .sow-pdf-page {
            margin-bottom: 28px;

            box-shadow:
              0 8px 30px
              rgba(30, 40, 35, 0.10);
          }
        }

        /*
         * Print fallback.
         *
         * We no longer use window.print(), but these
         * rules make the document behave correctly if
         * the user uses the browser's print manually.
         */
        @media print {
          @page {
            size: A4 portrait;
            margin: 0;
          }

          html,
          body {
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
          }

          body * {
            visibility: hidden;
          }

          .sow-pdf-document,
          .sow-pdf-document * {
            visibility: visible;
          }

          .sow-pdf-export {
            padding: 0 !important;
            background: #ffffff !important;
          }

          .sow-pdf-document {
            width: 794px !important;
            margin: 0 !important;
          }

          .sow-pdf-page {
            margin: 0 !important;
            box-shadow: none !important;

            page-break-after: always;
            break-after: page;
          }

          .sow-pdf-page:last-child {
            page-break-after: auto;
            break-after: auto;
          }
        }
      `}</style>
    </Shell>
  );
}
