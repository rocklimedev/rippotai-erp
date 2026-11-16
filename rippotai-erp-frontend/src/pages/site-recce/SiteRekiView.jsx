import { appConfirm } from "@/lib/app-dialog";
import RecordContext from "@/components/record-context/RecordContext";
import VersionHistory from "@/components/record-context/VersionHistory";
import { useRecordInfo } from "@/components/record-context/useRecordInfo";
// Site Recce — a filled copy of the user's SITE RECCE TEMPLATE.docx ("SITE RECCE FORMAT"): Word
// family of the print kit, same cover, 01 Project & Site Details, 02 Room-Wise Measurements,
// 03 / 03.1 guidance pages and 04 Layout & Photo Sheets with each shot's layout + photo pair.
import { useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import PrivateImage from "@/components/PrivateImage";
import { roomFeetInchesDraft } from "@/hooks/site-recce-form-helpers";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Edit3, Trash2, Download, FileText } from "lucide-react";
import { Page, PageHeader, Button, EmptyState } from "@/components/inos";
import {
  PrintDocument, DocumentPreview, usePdfDownload, pdfFileName,
  has, fmtDate, num, labelOf, bySort,
  WSub, WIntro, WFields, WLines, padRows,
} from "@/components/print-document";
import { resolveSite } from "@/components/brief-document/site-options";
import { ProjectTypeGrid, SiteConditionGrid } from "@/components/brief-document/SiteOptionGrids";
import howTo1 from "@/assets/brand/word/recce-how-to-1.jpg";
import howTo2 from "@/assets/brand/word/recce-how-to-2.jpg";
import "./site-recce-document.css";
import { useGetSiteRecceQuery, useDeleteSiteRecceMutation } from "../../api/documents/site-recce.api";

const ROOM_TYPE = {
  LIVING_DINING: "Living / dining",
  MASTER_BEDROOM: "Master bedroom",
  BEDROOM: "Bedroom",
  KITCHEN: "Kitchen",
  BATHROOM: "Bathroom",
  BALCONY: "Balcony",
  OTHER: "Other",
};

const sqft = (v) => (has(v) && Number(v) > 0 ? `${num(v, 0)} sq ft` : "");

// 03.1 — fixed guidance table of the template.
const CAPTURE = [
  ["Living & Dining", "Every wall, the ceiling, the floor, and each window and door."],
  ["Bedrooms", "Every wall, the ceiling, the floor, and the window."],
  ["Kitchen", "Every wall, plus a close-up of every existing plumbing point and every existing electrical point."],
  ["Bathroom", "Every wall, plus a close-up of the floor drain and the ventilation point."],
  ["Balcony", "Every wall, the railing, the floor drain, and the view looking out."],
];

const STEPS = [
  "For every photo you take in a room, use one row on that room’s sheet.",
  "Paste or insert a copy of the room’s layout into the left box of that row.",
  "On that layout, mark one dot where you were standing, and draw one arrow from the dot showing exactly which way the camera was pointed.",
  "Paste the matching photo into the right box of the same row.",
  "Move to the next row for your next photo. Do not put more than one arrow on a single layout copy — a layout with two arrows does not say which photo is which.",
];

/** One SHOT row: room layout (with the marked position) left, matching photo right. */
function ShotRow({ photo, index }) {
  const n = photo?.shot_number ?? index + 1;
  const where = [
    has(photo?.standing_position) && ["Stood at", photo.standing_position],
    has(photo?.camera_direction) && ["Camera faced", photo.camera_direction],
  ].filter(Boolean);
  return (
    <div className="wd-sr-shot">
      <div>
        <div className="wd-sr-paste__head">Shot {n} — room layout</div>
        <div className="wd-sr-paste__hint">
          Mark ONE dot where you stood, and ONE arrow showing the exact direction the camera faced.
        </div>
        {has(photo?.layout_image_url) && (
          <div className="wd-sr-shot__img">
            <PrivateImage src={photo.layout_image_url} alt={`Shot ${n} layout`} />
          </div>
        )}
        {(where.length > 0 || has(photo?.notes)) && (
          <div className="wd-sr-shot__meta">
            {where.map(([k, v]) => (
              <div key={k}>
                <b>{k}</b>
                {v}
              </div>
            ))}
            {has(photo?.notes) && <div>{photo.notes}</div>}
          </div>
        )}
      </div>
      <div>
        <div className="wd-sr-shot__photo-head">PHOTO {n}</div>
        {has(photo?.photo_url) && (
          <div className="wd-sr-shot__img">
            <PrivateImage src={photo.photo_url} alt={`Photo ${n}`} />
          </div>
        )}
      </div>
    </div>
  );
}

export function buildRecceSections(recce) {
  const project = recce.project || {};
  const rooms = bySort(recce.rooms, "sort_order");
  const site = resolveSite({
    category: recce.project_type,
    projectTypeName: project.project_type?.name,
    siteType: recce.site_type,
    siteTypeOther: recce.site_type_other,
    siteCondition: recce.site_condition,
    siteConditionCategory: recce.site_condition_category,
    siteConditionOther: recce.site_condition_other,
  });
  const lift =
    recce.lift_available === true || recce.lift_available === 1
      ? ["Y", recce.lift_size].filter(has).join(" · ")
      : recce.lift_available === false || recce.lift_available === 0
        ? "N"
        : "";
  const sections = [];

  /* 01 — Project & Site Details */
  sections.push({
    title: "Project & Site Details",
    blocks: [
      <div key="f">
        <WFields
          items={[
            { label: "Project name", value: project.name || recce.project_name },
            { label: "Client name", value: recce.client_name },
          ]}
        />
        <WFields cols={1} items={[{ label: "Site address", value: recce.site_address || project.site_location }]} />
        <WFields
          cols={3}
          items={[
            { label: "Date of recce", value: fmtDate(recce.recce_date) },
            { label: "Site engineer", value: recce.site_engineer?.name },
            { label: "Accompanied by", value: recce.accompanied_by },
            { label: "Unit / floor no.", value: recce.unit_floor_no },
            { label: "Carpet area (approx. sq ft)", value: sqft(recce.carpet_area_sqft) },
            { label: "No. of rooms", value: has(recce.number_of_rooms) ? String(recce.number_of_rooms) : "" },
            { label: "Build up area (approx. sq ft)", value: sqft(recce.built_up_area_sqft) },
            { label: "No. of floors", value: has(recce.number_of_floors) ? String(recce.number_of_floors) : "" },
          ]}
        />
      </div>,
      <div key="pt">
        <WSub className="wd-sub--lg">Project type &amp; site type</WSub>
        <ProjectTypeGrid site={site} itemGap={3.6} headGap={1.4} />
      </div>,
      <div key="sc">
        <WSub className="wd-sub--lg">Site condition</WSub>
        <SiteConditionGrid site={site} headingBox={false} itemGap={3.6} widths="57mm 57mm 1fr" />
      </div>,
      <div key="ac" style={{ marginTop: "13mm" }}>
        <WSub>Access for material &amp; labour</WSub>
        <WFields
          cols={3}
          items={[
            { label: "Lift available (Y/N) & size", value: lift },
            { label: "Staircase width", value: recce.staircase_width },
            { label: "Material entry point", value: recce.material_entry_point },
          ]}
        />
      </div>,
      <div key="ut">
        <WSub>Utilities available on site</WSub>
        <WFields
          cols={3}
          items={[
            { label: "Water connection", value: recce.water_connection },
            { label: "Power load available", value: recce.power_load_available },
            { label: "Drainage point location", value: recce.drainage_point_location },
          ]}
        />
      </div>,
      <div key="rw">
        <WSub>Society / RWA restrictions</WSub>
        <WFields
          cols={3}
          items={[
            { label: "Working hours allowed", value: recce.working_hours_allowed },
            { label: "Material movement rule", value: recce.material_movement_rule },
            ...(has(recce.society_rwa_restrictions)
              ? [{ label: "Other restrictions", value: recce.society_rwa_restrictions }]
              : []),
          ]}
        />
      </div>,
      {
        newPage: true,
        node: (
          <div>
            <WSub>Existing condition — note anything found</WSub>
            <WIntro style={{ margin: "-4.4mm 0 0" }}>
              Seepage, cracks, prior alterations, damage — record before any work touches the site.
            </WIntro>
            <WLines value={recce.existing_condition} count={3} lineHeight={11.7} charsPerLine={110} style={{ marginTop: "-3.3mm" }} />
          </div>
        ),
      },
    ],
  });

  /* 02 — Room-Wise Measurements (continues on the same page, as in the template) */
  const measured = rooms.filter((r) => has(r.room_name));
  sections.push({
    title: "Room-Wise Measurements",
    newPage: false,
    blocks: [
      {
        table: {
          skin: "word",
          className: "wd-table--open wd-sr-table",
          allowSplit: true,
          cols: ["Room", "Length", "Width", "Height", "Existing flooring / ceiling / notes"],
          template: "37.9mm 20.9mm 20.9mm 20.9mm 1fr",
          items: padRows(
            measured.map((r) => {
              const d = roomFeetInchesDraft(r);
              const type = r.room_type === "OTHER" ? r.room_type_other : labelOf(ROOM_TYPE, r.room_type);
              return {
                key: r.id,
                cells: [
                  {
                    text: r.room_name,
                    sub: [type, has(r.room_number) && `No. ${r.room_number}`, has(d.area) && `${num(d.area, 2)} sq ft`]
                      .filter(Boolean)
                      .join(" · "),
                  },
                  d.length,
                  d.width,
                  d.height,
                  [r.existing_flooring && `Flooring: ${r.existing_flooring}`, r.existing_ceiling && `Ceiling: ${r.existing_ceiling}`, r.notes]
                    .filter(has)
                    .join("\n"),
                ],
              };
            }),
            9,
            5,
          ),
        },
      },
    ],
  });

  /* 03 — How to Document the Layout & Photos (fixed guidance page) */
  sections.push({
    title: "How to Document the Layout & Photos",
    blocks: [
      <div key="how">
        <p className="wd-sr-lead">
          One photo. One arrow. One copy of the layout. That is the whole method — repeated as many times as you took
          photos in that room.
        </p>
        <div className="wd-sr-figure">
          <img src={howTo1} alt="Mark where you stood; paste that photo next to it" />
        </div>
        <div className="wd-sr-figure">
          <img src={howTo2} alt="Same room, four photos" />
        </div>
        <p className="wd-sr-mark">*MARK DIRECTION ON EACH LAYOUR (NORTH, EAST, SOUTH AND WEST)</p>
        <div className="wd-sr-steps">
          <div className="wd-sr-steps__head">HOW TO FILL PART 2, STEP BY STEP</div>
          <ol>
            {STEPS.map((t, i) => (
              <li key={i}>
                <span>{i + 1}.</span>
                {t}
              </li>
            ))}
          </ol>
        </div>
      </div>,
    ],
  });

  /* 03.1 — What to Make Sure You Capture, Room by Room */
  sections.push({
    title: "What to Make Sure You Capture, Room by Room",
    no: "03.1",
    unnumbered: false,
    blocks: [
      {
        table: {
          skin: "word",
          className: "wd-table--open wd-sr-capture",
          keepWhole: true,
          cols: ["Room", "Make sure one photo each covers"],
          template: "43.7mm 1fr",
          items: CAPTURE.map(([room, what]) => ({ key: room, cells: [room, what] })),
        },
      },
      <div key="note" style={{ marginTop: "9mm" }}>
        <div className="wd-goldrule" style={{ borderBottomWidth: "1.5pt", marginBottom: "6.6mm" }} />
        <p className="wd-sr-lead">
          A close-up of a plumbing or electrical point still gets its own row — mark where you stood and which way you
          pointed the camera, exactly like any other shot.
        </p>
      </div>,
    ],
  });

  /* 04 — Layout & Photo Sheets */
  const layouts = [...(recce.floor_layouts || []), ...(recce.existing_site_layouts || [])]
    .map((l) => (typeof l === "string" ? l : l?.url || l?.file_url))
    .filter(has);
  const layoutBoxes = layouts.length ? layouts : [null, null];
  const blocks = [
    <div key="fl">
      <div className="wd-sr-label">FLOOR LAYOUT</div>
      {layoutBoxes.slice(0, 2).map((url, i) => (
        <div key={i} className="wd-sr-paste">
          <div className="wd-sr-paste__head">Floor layout</div>
          {url && <PrivateImage src={url} alt={`Floor layout ${i + 1}`} />}
        </div>
      ))}
    </div>,
    ...layoutBoxes.slice(2).map((url, i) => (
      <div key={`fl${i}`} className="wd-sr-paste">
        <div className="wd-sr-paste__head">Floor layout</div>
        <PrivateImage src={url} alt={`Floor layout ${i + 3}`} />
      </div>
    )),
  ];
  rooms.forEach((room, ri) => {
    const photos = bySort(room.photos, "shot_number").filter(
      (p) => has(p.photo_url) || has(p.layout_image_url) || has(p.standing_position),
    );
    const d = roomFeetInchesDraft(room);
    const type = room.room_type === "OTHER" ? room.room_type_other : labelOf(ROOM_TYPE, room.room_type);
    const head = (
      <div>
        {ri === 0 && (
          <p className="wd-sr-lead" style={{ marginBottom: "4mm" }}>
            One block per room. Each row is one photo and its matching layout arrow.
          </p>
        )}
        <h3 className="wd-sr-room">ROOM {ri + 1}</h3>
        <p className="wd-sr-room__note">
          {[room.room_name, type, [d.length, d.width].filter(has).join(" × ")].filter(has).join(" — ")}
        </p>
      </div>
    );
    const rows = photos.length ? photos : [null];
    rows.forEach((p, i) =>
      blocks.push({
        newPage: i === 0,
        node: (
          <div key={`${room.id}-${i}`}>
            {i === 0 && head}
            <ShotRow photo={p} index={i} />
          </div>
        ),
      }),
    );
  });
  sections.push({ title: "Layout & Photo Sheets", blocks });

  return sections;
}

export function SiteRekiView() {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState("preview");
  const recordInfo = useRecordInfo("site-recce", id);
  const nav = useNavigate();
  const docRef = useRef(null);
  const { download, downloading } = usePdfDownload(docRef);
  const { data: recce, isFetching, isError } = useGetSiteRecceQuery(id, { skip: !id });
  const [deleteSiteRecce, { isLoading: deleting }] = useDeleteSiteRecceMutation();
  const sections = useMemo(() => (recce ? buildRecceSections(recce) : []), [recce]);

  const crumbs = [{ label: "CRM", to: "/crm" }, { label: "Site recces", to: "/crm/recce/all" }, { label: "Recce" }];

  const removeRecce = async () => {
    if (!(await appConfirm("Delete this site recce? This cannot be undone."))) return;
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
  const version = recce.version || 1;

  return (
    <Page>
      <PageHeader
        info={recordInfo}
        crumbs={crumbs}
        title={projectName}
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
              onClick={() => {
                flushSync(() => setActiveTab("preview"));
                download(pdfFileName("Site-Recce", projectName, version), { title: `Site Recce Report — ${projectName}`, label: "site recce report" });
              }}
            >
              Download PDF
            </Button>
          </>
        }
      />
      <RecordContext type="site-recce" id={id} />
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList aria-label="Site recce views">
          <TabsTrigger value="preview">PREVIEW</TabsTrigger>
          <TabsTrigger value="history">VERSION HISTORY</TabsTrigger>
        </TabsList>
        <TabsContent value="preview" forceMount hidden={activeTab !== "preview"}>
      <DocumentPreview>
        <PrintDocument
          ref={docRef}
          variant="word"
          className="wd-sr"
          docType="Site Recce"
          footerLabel="SITE RECCE"
          title={projectName}
          wordCover={{
            title: "SITE RECCE FORMAT",
            logoWidth: 46,
            logoTop: 58,
            after: (
              <div className="wd-sr-cover__foot">
                <div className="wd-sr-cover__lead">To be filled by the site engineer at the survey visit</div>
                <div className="wd-sr-cover__parts">
                  <div>
                    <span className="wd-sr-cover__part">PART 1</span>
                    <span className="wd-sr-cover__what">TEXT &amp; CONTENT DETAILS</span>
                  </div>
                  <div>
                    <span className="wd-sr-cover__part">PART 2</span>
                    <span className="wd-sr-cover__what">LAYOUT &amp; PHOTO REFERENCE</span>
                  </div>
                </div>
              </div>
            ),
          }}
          sections={sections}
        />
      </DocumentPreview>
        </TabsContent>
        <TabsContent value="history">
          <VersionHistory type="site-recce" id={id} />
        </TabsContent>
      </Tabs>
    </Page>
  );
}

export default SiteRekiView;
