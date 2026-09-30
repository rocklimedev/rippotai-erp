import { useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, Edit3, Trash2, Download, Loader2 } from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import logo from "../../assets/rippotai_logo.png";
import { Shell, Card } from "../../hooks/shared";
import {
  useGetScopeOfWorkByIdQuery,
  useDeleteScopeOfWorkMutation,
} from "../../api/documents/scope-of-work.api";

const C = {
  green: "#0F3D2E",
  gold: "#D4AF5F",
  ink: "#171717",
  muted: "#739087",
  line: "#CFCFCF",
};
const TEMPLATE_CATEGORIES = [
  "Civil work",
  "Demolition work",
  "Flooring",
  "Electrical",
  "Plumbing",
  "Ceiling",
  "Wall Paint",
  "Furniture",
];
const TEMPLATE_SPACES = [
  "Living & Dining",
  "Master Bedroom",
  "Bedroom 02",
  "Bedroom 03",
  "Kitchen",
  "Bathrooms",
  "Balcony",
  "Entrance & Passage",
];
const norm = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
const date = (value) => {
  if (!value) return "";
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? ""
    : d.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "UTC",
      });
};
const chunks = (rows, size) =>
  Array.from({ length: Math.ceil(rows.length / size) }, (_, i) =>
    rows.slice(i * size, (i + 1) * size),
  );
const teamName = (project, role) =>
  project.team_members?.find((member) => norm(member.role_label) === norm(role))
    ?.user?.name || "";

// Blank template categories remain visible; recorded custom categories and spaces are retained.
function buildMatrix(items) {
  const categoryMap = new Map();
  const spaceMap = new Map();
  for (const item of items) {
    if (item.scopeCategory)
      categoryMap.set(item.scopeCategory.id, item.scopeCategory);
    if (item.projectSpace)
      spaceMap.set(item.projectSpace.id, item.projectSpace);
  }
  const recorded = [...categoryMap.values()].sort(
    (a, b) => (a.sortOrder || 0) - (b.sortOrder || 0),
  );
  const categories = TEMPLATE_CATEGORIES.map((name, i) => ({
    id: `template-${i}`,
    name,
    categoryIds: recorded
      .filter((c) => norm(c.name) === norm(name))
      .map((c) => c.id),
  }));
  categories.push(
    ...recorded
      .filter(
        (c) => !TEMPLATE_CATEGORIES.some((name) => norm(name) === norm(c.name)),
      )
      .map((c) => ({ ...c, categoryIds: [c.id] })),
  );
  const spaces = spaceMap.size
    ? [...spaceMap.values()].sort(
        (a, b) => (a.sortOrder || 0) - (b.sortOrder || 0),
      )
    : TEMPLATE_SPACES.map((name, i) => ({ id: `space-${i}`, name }));
  const matrix = new Map();
  for (const item of [...items].sort(
    (a, b) => (a.sortOrder || 0) - (b.sortOrder || 0),
  )) {
    const key = `${item.scopeCategory?.id || item.scopeCategoryId}:${item.projectSpace?.id || item.projectSpaceId}`;
    if (!matrix.has(key)) matrix.set(key, []);
    matrix.get(key).push(item);
  }
  // The reference carries the last two Wall Paint rows onto the Furniture page.
  const pages = [
    [
      { category: categories[0], spaces },
      { category: categories[1], spaces },
    ],
    [
      { category: categories[2], spaces },
      { category: categories[3], spaces },
    ],
    [
      { category: categories[4], spaces },
      { category: categories[5], spaces },
      { category: categories[6], spaces: spaces.slice(0, 6) },
    ],
    [
      ...(spaces.length > 6
        ? [
            {
              category: categories[6],
              spaces: spaces.slice(6),
              continuation: true,
            },
          ]
        : []),
      { category: categories[7], spaces },
    ],
  ];
  for (const category of categories.slice(8))
    for (const rows of chunks(spaces, 12))
      pages.push([{ category, spaces: rows }]);
  return { pages, matrix };
}

function Page({ children, address, cover = false }) {
  return (
    <section className={`sow-page${cover ? " sow-cover" : ""}`}>
      <div className="sow-page-body">{children}</div>
      {!cover && (
        <footer>
          <span>SCOPE OF WORK</span>
          <span>{address}</span>
        </footer>
      )}
    </section>
  );
}
function Heading({ number, children }) {
  return (
    <h2 className="sow-heading">
      <span>{number}</span>
      {children}
    </h2>
  );
}
function Field({ label, value }) {
  return (
    <div className="sow-field">
      <div>{label}</div>
      <p>{value ?? ""}</p>
    </div>
  );
}
function Check({ label, checked }) {
  return (
    <div className="sow-check">
      <span className={checked ? "checked" : ""}>{checked ? "✓" : ""}</span>
      {label}
    </div>
  );
}
function CoverField({ label, value }) {
  return (
    <div className="sow-cover-field">
      <span>{label}: </span>
      {value || ""}
    </div>
  );
}
function MatrixTable({ category, spaces, matrix, continuation }) {
  return (
    <div className="sow-category">
      {!continuation && (
        <>
          <h3>{category.name}</h3>
        </>
      )}
      <table>
        <colgroup>
          <col style={{ width: "27%" }} />
          <col />
        </colgroup>
        {!continuation && (
          <thead>
            <tr>
              <th>Space</th>
              <th>Scope of work</th>
            </tr>
          </thead>
        )}
        <tbody>
          {spaces.map((space) => (
            <tr key={space.id}>
              <td>{space.name}</td>
              <td>
                {category.categoryIds
                  .flatMap((id) => matrix.get(`${id}:${space.id}`) || [])
                  .map((item, i) => (
                    <div className="sow-item" key={item.id || i}>
                      {item.isExcluded
                        ? "Excluded — "
                        : item.isIncluded === false
                          ? "Not included — "
                          : ""}
                      {item.scopeOfWork}
                      {item.notes && (
                        <div className="sow-item-note">{item.notes}</div>
                      )}
                    </div>
                  ))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ScopeOfWorkView() {
  const { id } = useParams();
  const nav = useNavigate();
  const ref = useRef(null);
  const busy = useRef(false);
  const [generating, setGenerating] = useState(false);
  const {
    data: sow,
    isFetching,
    isError,
  } = useGetScopeOfWorkByIdQuery(id, { skip: !id });
  const [deleteScopeOfWork, { isLoading: deleting }] =
    useDeleteScopeOfWorkMutation();
  const { pages, matrix } = useMemo(() => buildMatrix(sow?.items || []), [sow]);
  const remove = async () => {
    if (!window.confirm("Delete this scope of work? This cannot be undone."))
      return;
    try {
      await deleteScopeOfWork(id).unwrap();
      toast.success("Scope of work deleted");
      nav("/scope-of-work");
    } catch (error) {
      toast.error(error?.data?.message || "Failed to delete");
    }
  };
  const download = async () => {
    if (!ref.current || busy.current) return;
    busy.current = true;
    setGenerating(true);
    toast.loading("Generating Scope of Work PDF…", { id: "sow-pdf" });
    try {
      await document.fonts.ready;
      await Promise.all(
        [...ref.current.querySelectorAll("img")].map((img) => img.decode()),
      );
      const pdf = new jsPDF({ unit: "mm", format: "a4", compress: true });
      let outputPage = 0;
      for (const page of ref.current.querySelectorAll(".sow-page")) {
        const canvas = await html2canvas(page, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: "#ffffff",
          windowWidth: 1280,
          onclone: (doc) =>
            doc.querySelectorAll(".sow-page").forEach((node) => {
              node.style.boxShadow = "none";
            }),
        });
        // Expanded answers continue onto additional A4 pages; no fixed-height cropping.
        const pagePixels = Math.ceil((canvas.width * 297) / 210);
        for (let top = 0; top < canvas.height; top += pagePixels) {
          if (outputPage++) pdf.addPage();
          const slice = document.createElement("canvas");
          slice.width = canvas.width;
          slice.height = Math.min(pagePixels, canvas.height - top);
          slice
            .getContext("2d")
            .drawImage(
              canvas,
              0,
              top,
              canvas.width,
              slice.height,
              0,
              0,
              canvas.width,
              slice.height,
            );
          pdf.addImage(
            slice.toDataURL("image/jpeg", 0.98),
            "JPEG",
            0,
            0,
            210,
            (slice.height * 210) / canvas.width,
          );
          slice.width = slice.height = 0;
        }
        canvas.width = canvas.height = 0;
      }
      const name =
        String(sow.project?.name || "Project")
          .replace(/[^a-z0-9]+/gi, "-")
          .replace(/^-|-$/g, "") || "Project";
      await pdf.save(`${name}-Scope-of-Work-v${sow.version || 1}.pdf`, {
        returnPromise: true,
      });
      toast.success("Scope of work downloaded", { id: "sow-pdf" });
    } catch (error) {
      console.error("Scope PDF generation failed", error);
      toast.error("Failed to generate Scope of Work PDF", { id: "sow-pdf" });
    } finally {
      busy.current = false;
      setGenerating(false);
    }
  };
  if (isFetching) return <Shell title="Scope of Work">Loading…</Shell>;
  if (isError || !sow)
    return (
      <Shell title="Scope of Work">
        <Card>Scope of work not found, or you don’t have access to it.</Card>
      </Shell>
    );
  const project = sow.project || {};
  const address = project.site_location || "";
  const client = project.client?.name || project.client_name || "";
  const projectType = project.project_type?.name || project.type || "";
  return (
    <Shell
      title="Scope of Work"
      subtitle={`${project.name || "Project"} • v${sow.version || 1}`}
      action={
        <div className="flex items-center gap-2">
          <button className="sow-action" onClick={() => nav("/scope-of-work")}>
            <ArrowLeft size={14} />
            Back
          </button>
          <button
            className="sow-action"
            onClick={() => nav(`/scope-of-work/${id}/edit`)}
          >
            <Edit3 size={14} />
            Edit
          </button>
          <button
            className="sow-action"
            onClick={download}
            disabled={generating}
          >
            {generating ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Download size={14} />
            )}{" "}
            {generating ? "Generating…" : "Download PDF"}
          </button>
          <button className="sow-action" onClick={remove} disabled={deleting}>
            <Trash2 size={14} />
            Delete
          </button>
        </div>
      }
    >
      <div className="sow-document" ref={ref}>
        <Page cover>
          <div className="sow-brand">
            <img src={logo} alt="Rippotai" />
            <div>RIPPŌTAI</div>
            <h1>SCOPE OF WORK</h1>
          </div>
          <div className="sow-cover-fields">
            <CoverField label="Project" value={project.name} />
            <div className="sow-cover-grid">
              <CoverField label="Address" value={address} />
              <CoverField label="Client" value={client} />
              <CoverField
                label="Principal Architect"
                value={teamName(project, "Principal Architect")}
              />
              <CoverField
                label="Project Lead"
                value={teamName(project, "Project Lead")}
              />
            </div>
          </div>
        </Page>
        <Page address={address}>
          <Heading number="01">Project details</Heading>
          <div className="sow-details">
            <Field label="Project name" value={project.name} />
            <Field label="Client name" value={client} />
            <Field label="Site address" value={address} />
            <Field
              label="Total area (sq ft)"
              value={sow.totalAreaSqft ?? project.total_area_sqft}
            />
            <Field label="Prepared by" value={sow.preparedByUser?.name} />
            <Field
              label="Date"
              value={date(sow.documentDate || sow.createdAt)}
            />
            <Field label="Reviewed by" value={sow.reviewedByUser?.name} />
            <Field label="Version" value={sow.version || 1} />
          </div>
          <div className="sow-label">Project type</div>
          <div className="sow-checks">
            {["Residential", "Commercial", "Hospitality", "Institutional"].map(
              (type) => (
                <Check
                  key={type}
                  label={type}
                  checked={norm(projectType) === norm(type)}
                />
              ),
            )}
          </div>
        </Page>
        <Page address={address}>
          <Heading number="02">Project Type</Heading>
          <div className="sow-modes">
            {["Consultancy", "Turnkey"].map((mode) => (
              <Check
                key={mode}
                label={mode}
                checked={norm(sow.projectMode) === norm(mode)}
              />
            ))}
          </div>
          <div className="sow-label">Scope summary</div>
          <div className="sow-text">{sow.scopeSummary}</div>
          <div className="sow-label">Specific exclusions agreed</div>
          <div className="sow-text">{sow.specificExclusions}</div>
        </Page>
        {pages.map((blocks, i) => (
          <Page key={i} address={address}>
            {i === 0 && <Heading number="03">Area-wise scope matrix</Heading>}
            {blocks.map((block, j) => (
              <MatrixTable key={j} {...block} matrix={matrix} />
            ))}
          </Page>
        ))}
        <Page address={address}>
          <Heading number="04">Acceptance</Heading>
          <div className="sow-label">Notes</div>
          <div className="sow-text sow-acceptance-notes">{sow.notes}</div>
          <div className="sow-signatures">
            <div>
              <h3>For Rippotai</h3>
              <div className="sow-sign-line" />
              <p>Authorised Signatory</p>
              <p>Name · {sow.authorisedSignatoryName || ""}</p>
              <p>Date · {date(sow.authorisedSignatoryDate)}</p>
            </div>
            <div>
              <h3>Accepted by the client</h3>
              <div className="sow-sign-line" />
              <p>Client Signature</p>
              <p>
                Name ·{" "}
                {sow.clientSignatureName || sow.acceptedByUser?.name || ""}
              </p>
              <p>Date · {date(sow.clientSignatureDate || sow.acceptedAt)}</p>
            </div>
          </div>
        </Page>
      </div>
      <style>{`
      .sow-action{height:40px;padding:0 14px;border:1px solid #c9ceca;border-radius:8px;display:inline-flex;align-items:center;gap:6px;font-size:13px}.sow-action:disabled{opacity:.5}
      .sow-document{width:794px;margin:auto;color:${C.ink};font-family:Arial,sans-serif}.sow-document *{box-sizing:border-box}
      .sow-page{width:794px;min-height:1123px;background:white;padding:88px 73px 36px;display:flex;flex-direction:column;margin-bottom:28px;box-shadow:0 8px 30px #1e282319}
      .sow-page-body{flex:1;min-width:0}.sow-page footer{display:flex;justify-content:space-between;gap:30px;margin-top:28px;font-size:7px;font-weight:300;color:#9cafa8;text-transform:uppercase;overflow-wrap:anywhere}
      .sow-heading{margin:0 0 30px;padding:0 0 30px;border-bottom:1px solid black;display:flex;align-items:baseline;gap:18px;font-size:28px;font-weight:400;line-height:1.2}.sow-heading>span{font-size:16px;color:${C.gold}}
      .sow-cover{position:relative;padding-top:0}.sow-brand{text-align:center;padding-top:185px}.sow-brand img{display:block;width:330px;height:165px;object-fit:cover;object-position:center;margin:auto}.sow-brand>div{font-size:40px;font-weight:300;color:${C.green};margin-top:10px}.sow-brand h1{font-size:22px;font-weight:400;color:${C.green};margin:28px 0 0}
      .sow-cover .sow-page-body{display:flex;flex-direction:column}.sow-cover-fields{margin-top:auto;padding-top:60px;padding-bottom:76px}.sow-cover-field{border-bottom:1px solid ${C.line};min-height:43px;padding:10px 0;font-size:13px;overflow-wrap:anywhere}.sow-cover-field span{text-transform:uppercase;font-size:10px;color:#666}.sow-cover-grid{display:grid;grid-template-columns:1fr 1fr;column-gap:14px}.sow-cover-grid>.sow-cover-field:nth-last-child(-n+2){border-color:${C.gold}}
      .sow-details{display:grid;grid-template-columns:1fr 1.2fr;gap:24px 29px;margin:36px 0 55px}.sow-field>div{font-size:9px}.sow-field p{margin:0;border-bottom:1px solid ${C.line};min-height:32px;padding:7px 0;font-size:13px;overflow-wrap:anywhere}
      .sow-label{text-transform:uppercase;font-size:11px;border-bottom:1px solid ${C.gold};padding-bottom:17px;margin-bottom:30px}.sow-checks{display:grid;grid-template-columns:repeat(2,165px);gap:15px}.sow-check{display:flex;align-items:center;gap:10px;font-size:12px}.sow-check>span{display:inline-flex;width:11px;height:11px;border:1px solid #91aaa0;font-size:10px;align-items:center;justify-content:center}.sow-check .checked{background:${C.green};color:white}.sow-modes{display:flex;gap:60px;margin-bottom:65px}
      .sow-text{min-height:160px;font-size:13px;line-height:1.6;white-space:pre-wrap;overflow-wrap:anywhere;margin-bottom:30px}
      .sow-category{margin-bottom:44px}.sow-category h3{font-size:16px;font-weight:400;color:${C.green};margin:0 0 10px}.sow-category table{width:100%;border-collapse:collapse;table-layout:fixed;color:${C.green}}.sow-category th{text-align:left;font-size:9px;font-weight:400;text-transform:uppercase;border-bottom:1px solid black;padding:0 8px 6px 0;color:${C.muted}}.sow-category td{border-bottom:1px solid ${C.line};padding:7px 8px 7px 0;height:31px;font-size:11px;vertical-align:top;overflow-wrap:anywhere;white-space:pre-wrap}.sow-item+.sow-item{margin-top:7px}.sow-item-note{font-size:10px;color:#666;margin-top:3px}
      .sow-acceptance-notes{min-height:240px}.sow-signatures{display:grid;grid-template-columns:1fr 1fr;gap:55px}.sow-signatures h3{font-size:11px;text-transform:uppercase;font-weight:400}.sow-signatures p{font-size:12px;margin:8px 0;overflow-wrap:anywhere}.sow-sign-line{border-bottom:1px solid ${C.line};height:70px}
    `}</style>
    </Shell>
  );
}
