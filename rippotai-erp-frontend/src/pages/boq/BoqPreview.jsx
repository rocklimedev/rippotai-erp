import React, { useRef, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Download, Edit3, FileText } from "lucide-react";

import { useGetBoqByIdQuery } from "@/api/boq/boq.api";
import { Page, PageHeader, Button, EmptyState, Segmented, StatusPill } from "@/components/inos";
import { DocumentPreview, usePdfDownload } from "@/components/print-document";
import BoqDocument, { BOQ_VARIANTS, boqFileName } from "@/components/commerce-documents/BoqDocument";

// BOQ preview: exactly the A4 pages that are downloaded, for each copy type.
export default function BoqPreview() {
  const { id } = useParams();
  const nav = useNavigate();
  const { pathname } = useLocation();
  const base = pathname.startsWith("/ledger") ? "/ledger/boq" : "/boq";
  const [variant, setVariant] = useState("client");
  const docRef = useRef(null);
  const { download, downloading } = usePdfDownload(docRef);

  const { data: boq, isLoading, isError } = useGetBoqByIdQuery(id);

  const crumbs = [
    { label: "BOQ", to: base === "/boq" ? "/boq" : "/ledger/boq" },
    { label: boq?.boq_number || boq?.title || "BOQ", to: `${base}/${id}` },
    { label: "Preview" },
  ];

  if (isLoading) {
    return (
      <Page>
        <PageHeader crumbs={crumbs} title="BOQ preview" subtitle="Loading…" />
      </Page>
    );
  }

  if (isError || !boq) {
    return (
      <Page>
        <PageHeader crumbs={crumbs} title="BOQ preview" />
        <div className="inos-card">
          <EmptyState icon={FileText} title="BOQ not found" text="It may have been archived, or you don't have access to it." />
        </div>
      </Page>
    );
  }

  return (
    <Page>
      <PageHeader
        crumbs={crumbs}
        title={boq.project?.name || boq.title}
        subtitle={
          <span style={{ display: "inline-flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            Bill of quantities · {boq.boq_number || `version ${boq.version || 1}`}
            {boq.status && <StatusPill status={boq.status} size="sm" />}
          </span>
        }
        actions={
          <>
            <Button variant="secondary" icon={Edit3} onClick={() => nav(`${base}/${id}`)}>
              Edit
            </Button>
            <Button
              variant="primary"
              icon={Download}
              loading={downloading}
              onClick={() =>
                download(boqFileName(boq, variant), {
                  title: `BOQ — ${boq.project?.name || boq.title} (${BOQ_VARIANTS[variant]})`,
                  label: "BOQ",
                })
              }
            >
              Download PDF
            </Button>
          </>
        }
      />

      <div style={{ marginBottom: 12 }}>
        <Segmented
          value={variant}
          onChange={setVariant}
          options={Object.entries(BOQ_VARIANTS).map(([value, label]) => ({ value, label }))}
        />
      </div>

      <DocumentPreview>
        <BoqDocument key={variant} ref={docRef} boq={boq} variant={variant} />
      </DocumentPreview>
    </Page>
  );
}
