// Scope of Work — what we will (and won't) do, trade by trade and space by space.
// Clean A4 document on the shared print kit: fixed Rippotai cover, then only what was filled in.
import React, { useMemo, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Edit3, Trash2, Download, FileText } from "lucide-react";
import { Page, PageHeader, Button, EmptyState, StatusPill } from "@/components/inos";
import {
  PrintDocument, DocumentPreview, KV, kvHas, Note, SignOff, Pill, usePdfDownload, pdfFileName,
  has, fmtDate, labelOf, bySort,
} from "@/components/print-document";
import { useGetScopeOfWorkByIdQuery, useDeleteScopeOfWorkMutation } from "../../api/documents/scope-of-work.api";

const MODE = { CONSULTANCY: "Consultancy", TURNKEY: "Turnkey", PMC: "Project management (PMC)" };

export function buildSowSections(sow) {
  const project = sow.project || {};
  const client = project.client || {};
  const sections = [];

  const details = [
    { label: "Client", value: client.name, strong: true, sub: [client.contact_person !== client.name && client.contact_person, client.phone].filter(has).join(" · ") },
    { label: "Project", value: project.name },
    { label: "Site", value: project.site_location, wide: !has(project.total_area_sqft) },
    { label: "Total area", value: has(project.total_area_sqft) ? `${Number(project.total_area_sqft).toLocaleString("en-IN")} sq ft` : "" },
    { label: "Engagement", value: labelOf(MODE, sow.projectMode) },
    { label: "Project type", value: project.project_type?.name || project.type },
    { label: "Prepared by", value: sow.preparedByUser?.name },
    { label: "Reviewed by", value: sow.reviewedByUser?.name },
  ];
  if (kvHas(details)) sections.push({ title: "Project details", blocks: [<KV key="kv" items={details} />] });

  if (has(sow.scopeSummary)) sections.push({ title: "Scope summary", blocks: [{ text: { value: sow.scopeSummary } }] });

  // items grouped by trade (category), rows by space
  const items = (sow.items || []).filter((i) => i.scopeCategory && (has(i.scopeOfWork) || i.isExcluded || has(i.notes)));
  const cats = new Map();
  items.forEach((i) => {
    const c = i.scopeCategory;
    if (!cats.has(c.id)) cats.set(c.id, { cat: c, items: [] });
    cats.get(c.id).items.push(i);
  });
  const catList = [...cats.values()].sort((a, b) => (a.cat.sortOrder ?? 0) - (b.cat.sortOrder ?? 0));
  if (catList.length) {
    const blocks = catList.map(({ cat, items: list }) => ({
      table: {
        heading: cat.name,
        cols: ["Space", "Scope of work"],
        template: "32% 1fr",
        items: [...list]
          .sort((a, b) => (a.projectSpace?.sortOrder ?? 0) - (b.projectSpace?.sortOrder ?? 0) || (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
          .map((i) => ({
            key: i.id,
            cells: [
              i.projectSpace?.name || "General",
              {
                strong: false,
                text: (
                  <>
                    {i.scopeOfWork}
                    {i.isExcluded && <Pill tone="rose">Not included</Pill>}
                  </>
                ),
                sub: i.notes,
              },
            ],
          })),
      },
    }));
    sections.push({
      title: "Scope by trade",
      intro: "Each trade, space by space. Anything marked “Not included” is outside this scope.",
      blocks,
    });
  }

  if (has(sow.specificExclusions))
    sections.push({ title: "Not included", blocks: [{ text: { value: sow.specificExclusions } }] });

  if (has(sow.notes)) sections.push({ title: "Notes", blocks: [{ text: { value: sow.notes } }] });

  sections.push({
    title: "Acceptance",
    blocks: [
      <SignOff
        key="sign"
        note="Work outside this scope is handled as a variation, priced and agreed before it starts."
        left={{ name: sow.preparedByUser?.name || "Rippotai Architecture", role: "For Rippotai Architecture" }}
        right={{
          name: sow.clientSignatureName || sow.acceptedByUser?.name || client.name || "Client",
          role: `Client · ${fmtDate(sow.clientSignatureDate || sow.acceptedAt) || "Date"}`,
        }}
      />,
    ],
  });
  return sections;
}

export function ScopeOfWorkView() {
  const { id } = useParams();
  const nav = useNavigate();
  const docRef = useRef(null);
  const { download, downloading } = usePdfDownload(docRef);
  const { data: sow, isFetching, isError } = useGetScopeOfWorkByIdQuery(id, { skip: !id });
  const [deleteScopeOfWork, { isLoading: deleting }] = useDeleteScopeOfWorkMutation();
  const sections = useMemo(() => (sow ? buildSowSections(sow) : []), [sow]);

  const crumbs = [{ label: "CRM", to: "/crm" }, { label: "Scopes of work", to: "/crm/scope-of-work/all" }, { label: "Scope" }];

  const remove = async () => {
    if (!window.confirm("Delete this scope of work? This cannot be undone.")) return;
    try {
      await deleteScopeOfWork(id).unwrap();
      toast.success("Scope of work deleted");
      nav("/crm/scope-of-work/all");
    } catch (e) {
      toast.error(e?.data?.detail || e?.data?.message || "Failed to delete");
    }
  };

  if (isFetching && !sow)
    return (
      <Page>
        <PageHeader crumbs={crumbs} title="Scope of work" subtitle="Loading…" />
      </Page>
    );
  if (isError || !sow)
    return (
      <Page>
        <PageHeader crumbs={crumbs} title="Scope of work" />
        <div className="inos-card">
          <EmptyState icon={FileText} title="Scope of work not found" text="It may have been deleted, or you don't have access to it." />
        </div>
      </Page>
    );

  const project = sow.project || {};
  const client = project.client || {};
  const projectName = project.name || "Project";
  const version = sow.version || 1;
  const date = fmtDate(sow.updatedAt || sow.createdAt);

  return (
    <Page>
      <PageHeader
        crumbs={crumbs}
        title={projectName}
        subtitle={
          <span style={{ display: "inline-flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            Scope of work · version {version}
            {sow.status && <StatusPill status={String(sow.status).toLowerCase()} size="sm" />}
          </span>
        }
        actions={
          <>
            <Button variant="ghost" icon={Trash2} onClick={remove} disabled={deleting}>
              Delete
            </Button>
            <Button variant="secondary" icon={Edit3} onClick={() => nav(`/crm/forms/scope-of-work/${id}/edit`)}>
              Edit
            </Button>
            <Button
              variant="primary"
              icon={Download}
              loading={downloading}
              onClick={() => download(pdfFileName("Scope-of-Work", projectName, version), { title: `Scope of Work — ${projectName}`, label: "scope of work" })}
            >
              Download PDF
            </Button>
          </>
        }
      />
      <DocumentPreview>
        <PrintDocument
          ref={docRef}
          docType="Scope of Work"
          title={projectName}
          subtitle="What is included, trade by trade and space by space."
          coverDetails={[
            { label: "Prepared for", value: client.name, sub: client.phone },
            { label: "Project", value: projectName },
            { label: "Site", value: project.site_location },
            { label: "Engagement", value: labelOf(MODE, sow.projectMode) },
            { label: "Date", value: date, sub: `Version ${version}` },
            { label: "Prepared by", value: sow.preparedByUser?.name || "Rippotai Architecture", sub: sow.preparedByUser?.name ? "Rippotai Architecture" : "" },
          ]}
          preparedFor={client.name || projectName}
          date={date}
          version={version}
          sections={sections}
        />
      </DocumentPreview>
    </Page>
  );
}

export default ScopeOfWorkView;
