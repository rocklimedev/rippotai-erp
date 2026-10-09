// Site Recce Report — what we found on site, as a clean A4 document for the client and the team.
// Built on the shared print kit: fixed Rippotai cover, then only the filled fields as plain text.
import React, { useMemo, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Edit3, Trash2, Download, FileText } from "lucide-react";
import { Page, PageHeader, Button, EmptyState } from "@/components/inos";
import {
  PrintDocument, DocumentPreview, KV, kvHas, SubHead, usePdfDownload, pdfFileName,
  has, fmtDate, yesNo, num, labelOf, bySort,
} from "@/components/print-document";
import { useGetSiteRecceQuery, useDeleteSiteRecceMutation } from "../../api/documents/site-recce.api";

const SITE_TYPE = { FLAT: "Flat", FLOOR: "Builder floor", KOTHI: "Kothi", RAW: "Raw / shell" };
const ROOM_TYPE = {
  LIVING_DINING: "Living / dining",
  MASTER_BEDROOM: "Master bedroom",
  BEDROOM: "Bedroom",
  KITCHEN: "Kitchen",
  BATHROOM: "Bathroom",
  BALCONY: "Balcony",
  OTHER: "Other",
};
const UNIT = { FT: "ft", M: "m", IN: "in", CM: "cm" };

const area = (v) => (has(v) && Number(v) > 0 ? `${num(v, 0)} sq ft` : "");
const dim = (v, unit) => (has(v) && Number(v) > 0 ? `${num(v)} ${unit}` : "");

function ShotPair({ photo, index }) {
  const n = photo.shot_number ?? index + 1;
  const meta = [];
  const hasLayout = has(photo.layout_image_url);
  return (
    <div>
      <div className={`pd-shot ${hasLayout && has(photo.photo_url) ? "" : "pd-shot--single"}`}>
        {hasLayout && (
          <figure className="pd-shot__layout">
            <img src={photo.layout_image_url} alt="" crossOrigin="anonymous" />
            <figcaption>Shot {n} · where it was taken</figcaption>
          </figure>
        )}
        {has(photo.photo_url) && (
          <figure>
            <img src={photo.photo_url} alt="" crossOrigin="anonymous" />
            <figcaption>Photo {n}</figcaption>
          </figure>
        )}
      </div>
      {(meta.length > 0 || has(photo.notes)) && (
        <p className="pd-shot__cap">
          {meta.length > 0 && <b>{meta.join(" · ")}</b>}
          {meta.length > 0 && has(photo.notes) && " — "}
          {photo.notes}
        </p>
      )}
    </div>
  );
}

export function buildRecceSections(recce) {
  const project = recce.project || {};
  const rooms = bySort(recce.rooms, "sort_order");
  const sections = [];

  const details = [
    { label: "Project", value: project.name || recce.project_name, strong: true },
    { label: "Client", value: recce.client_name },
    { label: "Site address", value: recce.site_address || project.site_location, wide: true },
    { label: "Date of recce", value: fmtDate(recce.recce_date) },
    { label: "Site engineer", value: recce.site_engineer?.name },
    { label: "Accompanied by", value: recce.accompanied_by },
  ];
  const property = [
    { label: "Property type", value: labelOf(SITE_TYPE, recce.site_type) },
    { label: "Unit / floor", value: recce.unit_floor_no },
    { label: "Floors", value: has(recce.number_of_floors) ? String(recce.number_of_floors) : "" },
    { label: "Carpet area (approx.)", value: area(recce.carpet_area_sqft) },
    { label: "Built-up area (approx.)", value: area(recce.built_up_area_sqft) },
    { label: "Rooms", value: has(recce.number_of_rooms) ? String(recce.number_of_rooms) : "" },
  ];
  if (kvHas(details) || kvHas(property))
    sections.push({
      title: "Project & site",
      blocks: [
        kvHas(details) && <KV key="d" items={details} />,
        kvHas(property) && <KV key="p" items={property} cols={3} />,
      ].filter(Boolean),
    });

  const lift =
    recce.lift_available === true || recce.lift_available === 1
      ? ["Yes", recce.lift_size].filter(has).join(" · ")
      : yesNo(recce.lift_available);
  const access = [
    { label: "Lift", value: lift },
    { label: "Staircase width", value: recce.staircase_width },
    { label: "Material entry point", value: recce.material_entry_point, wide: true },
  ];
  const utilities = [
    { label: "Water connection", value: recce.water_connection },
    { label: "Power load available", value: recce.power_load_available },
    { label: "Drainage point", value: recce.drainage_point_location, wide: true },
  ];
  if (kvHas(access) || kvHas(utilities))
    sections.push({
      title: "Access & services",
      blocks: [
        kvHas(access) && (
          <div key="a">
            <SubHead>Access for material & labour</SubHead>
            <KV items={access} />
          </div>
        ),
        kvHas(utilities) && (
          <div key="u">
            <SubHead>Utilities</SubHead>
            <KV items={utilities} />
          </div>
        ),
      ].filter(Boolean),
    });

  const rules = [
    { label: "Society / RWA restrictions", value: recce.society_rwa_restrictions, wide: true },
    { label: "Working hours allowed", value: recce.working_hours_allowed },
    { label: "Material movement", value: recce.material_movement_rule },
  ];
  if (kvHas(rules)) sections.push({ title: "Site rules", blocks: [<KV key="r" items={rules} />] });

  if (has(recce.existing_condition))
    sections.push({
      title: "Existing condition",
      intro: "Seepage, cracks, earlier alterations and damage — recorded before any work touches the site.",
      blocks: [{ text: { value: recce.existing_condition } }],
    });

  if (recce.existing_site_layouts?.length) {
    sections.push({ title: "Existing Site Layout", blocks: recce.existing_site_layouts.map((url, index) => (
      <figure key={`${url}-${index}`} className="pd-shot pd-shot--single">
        <img src={url} alt={`Existing site layout ${index + 1}`} crossOrigin="anonymous" />
        <figcaption>Layout {index + 1}</figcaption>
      </figure>
    )) });
  }

  const measured = rooms.filter((r) => has(r.room_name));
  if (measured.length)
    sections.push({
      title: "Room-wise measurements",
      rows: {
        cols: ["Room", "#Length", "#Width", "#Height", "Existing finishes & notes"],
        template: "30% 17mm 17mm 17mm 1fr",
        items: measured.map((r) => {
          const u = UNIT[r.measurement_unit] || (r.measurement_unit || "ft").toLowerCase();
          return {
            key: r.id,
            cells: [
              { text: r.room_name, sub: [r.room_type === "OTHER" ? r.room_type_other || "Other" : labelOf(ROOM_TYPE, r.room_type), has(r.room_number) && `No. ${r.room_number}`].filter(Boolean).join(" · ") },
              dim(r.length, u),
              dim(r.width, u),
              dim(r.height, u),
              [r.existing_flooring && `Flooring: ${r.existing_flooring}`, r.existing_ceiling && `Ceiling: ${r.existing_ceiling}`, r.notes]
                .filter(has)
                .join("\n"),
            ],
          };
        }),
      },
    });

  const withPhotos = rooms.filter((r) => (r.photos || []).some((p) => has(p.photo_url) || has(p.layout_image_url)));
  if (withPhotos.length) {
    const blocks = [];
    withPhotos.forEach((room) => {
      const photos = bySort(room.photos, "shot_number").filter((p) => has(p.photo_url) || has(p.layout_image_url));
      photos.forEach((p, i) =>
        blocks.push(
          <div key={p.id || `${room.id}-${i}`}>
            {i === 0 && (
              <div style={{ marginBottom: "3mm" }}>
                <SubHead>
                  {room.room_name} · {photos.length} photo{photos.length === 1 ? "" : "s"}
                </SubHead>
              </div>
            )}
            <ShotPair photo={p} index={i} />
          </div>,
        ),
      );
    });
    sections.push({
      title: "Photos from site",
      intro: "Each photo sits next to the layout mark showing where it was taken from and which way the camera faced.",
      blocks,
    });
  }

  return sections;
}

export function SiteRekiView() {
  const { id } = useParams();
  const nav = useNavigate();
  const docRef = useRef(null);
  const { download, downloading } = usePdfDownload(docRef);
  const { data: recce, isFetching, isError } = useGetSiteRecceQuery(id, { skip: !id });
  const [deleteSiteRecce, { isLoading: deleting }] = useDeleteSiteRecceMutation();
  const sections = useMemo(() => (recce ? buildRecceSections(recce) : []), [recce]);

  const crumbs = [{ label: "CRM", to: "/crm" }, { label: "Site recces", to: "/crm/recce/all" }, { label: "Recce" }];

  const removeRecce = async () => {
    if (!window.confirm("Delete this site recce? This cannot be undone.")) return;
    try {
      await deleteSiteRecce(id).unwrap();
      toast.success("Site recce deleted");
      nav("/crm/recce/all");
    } catch (e) {
      toast.error(e?.data?.detail || e?.data?.message || "Failed to delete");
    }
  };

  if (isFetching && !recce)
    return (
      <Page>
        <PageHeader crumbs={crumbs} title="Site recce report" subtitle="Loading…" />
      </Page>
    );
  if (isError || !recce)
    return (
      <Page>
        <PageHeader crumbs={crumbs} title="Site recce report" />
        <div className="inos-card">
          <EmptyState icon={FileText} title="Site recce not found" text="It may have been deleted, or you don't have access to it." />
        </div>
      </Page>
    );

  const project = recce.project || {};
  const projectName = project.name || recce.project_name || "Project";
  const date = fmtDate(recce.recce_date);
  const version = recce.version || 1;

  return (
    <Page>
      <PageHeader
        crumbs={crumbs}
        title={projectName}
        subtitle={`Site recce report${date ? ` · ${date}` : ""}`}
        actions={
          <>
            <Button variant="ghost" icon={Trash2} onClick={removeRecce} disabled={deleting}>
              Delete
            </Button>
            <Button variant="secondary" icon={Edit3} onClick={() => nav(`/crm/recce/${id}/edit`)}>
              Edit
            </Button>
            <Button
              variant="primary"
              icon={Download}
              loading={downloading}
              onClick={() =>
                download(pdfFileName("Site-Recce", projectName, version), { title: `Site Recce Report — ${projectName}`, label: "site recce report" })
              }
            >
              Download PDF
            </Button>
          </>
        }
      />
      <DocumentPreview>
        <PrintDocument
          ref={docRef}
          docType="Site Recce Report"
          title={projectName}
          subtitle="What we found on site, measured and photographed."
          coverDetails={[
            { label: "Prepared for", value: recce.client_name },
            { label: "Project", value: projectName },
            { label: "Site", value: recce.site_address || project.site_location },
            { label: "Date of recce", value: date },
            { label: "Site engineer", value: recce.site_engineer?.name, sub: recce.site_engineer?.name ? "Rippotai Architecture" : "" },
            { label: "Accompanied by", value: recce.accompanied_by },
          ]}
          preparedFor={recce.client_name || projectName}
          date={date}
          version={version}
          sections={sections}
        />
      </DocumentPreview>
    </Page>
  );
}

export default SiteRekiView;
