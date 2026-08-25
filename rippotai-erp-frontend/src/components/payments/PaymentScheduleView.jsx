import React, { useMemo, useRef, useState, useEffect } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { Download } from "lucide-react";
import logo from "../../assets/rippotai_logo.png";
const A4_HEIGHT = 1122; // approximate screen px at 96dpi
const PAGE_PADDING_TOP = 70;
const PAGE_PADDING_BOTTOM = 70;

/* ============================================================
   FORMATTERS
============================================================ */

const formatCurrency = (value) => {
  if (value === null || value === undefined || value === "") {
    return "₹ —";
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value));
};

const formatPercent = (value) => {
  const num = Number(value);

  if (Number.isNaN(num)) {
    return "0%";
  }

  return `${num.toFixed(0)}%`;
};

const formatDate = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
};

const romanish = (n) => String(n).padStart(2, "0");

/* ============================================================
   LOGO — reserved slot. Drop in your own mark, e.g.:
   <img src="/logo.svg" alt="Rippōtai" style={{ width: size, height: size }} />
============================================================ */

const LogoSlot = ({ size = 160 }) => (
  <div
    style={{
      width: size,
      height: size,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}
    aria-hidden="true"
  >
    <img
      src={logo}
      alt="Rippotai"
      style={{
        maxWidth: "100%",
        maxHeight: "100%",
        width: "auto",
        height: "auto",
        objectFit: "contain",
        display: "block",
      }}
    />
  </div>
);

/* ============================================================
   PAGE CHROME
============================================================ */

const PageHeader = ({ projectLine, eyebrow }) => (
  <div
    className="page-header px-14 pt-11 pb-5 border-b flex items-center justify-between"
    style={{ borderColor: "var(--line)" }}
  >
    <p
      className="text-[10px] tracking-[0.28em] uppercase"
      style={{ color: "var(--ink-soft)" }}
    >
      Payment Schedule
      <span style={{ color: "var(--gold-dark)" }}> · {projectLine}</span>
    </p>
    {eyebrow && (
      <p
        className="text-[10px] tracking-[0.28em] uppercase font-semibold"
        style={{ color: "var(--gold-dark)" }}
      >
        {eyebrow}
      </p>
    )}
  </div>
);

const DocumentPage = ({
  children,
  pageNumber,
  totalPages,
  pageRef,
  projectLine,
}) => {
  return (
    <section
      ref={pageRef}
      className="payment-page relative shadow-xl print:shadow-none"
      style={{ background: "var(--paper)" }}
    >
      <div className="flex flex-col min-h-[297mm] h-[297mm] overflow-hidden">
        <div className="flex-1 overflow-hidden">{children}</div>

        <footer
          className="px-14 pb-8 pt-4 flex items-center justify-between shrink-0 border-t"
          style={{ borderColor: "var(--line)" }}
        >
          <span
            className="text-[9px] tracking-[0.28em] uppercase"
            style={{ color: "var(--ink-soft)" }}
          >
            Payment Schedule
            {projectLine ? (
              <span style={{ color: "var(--gold-dark)" }}>
                {" "}
                · {projectLine}
              </span>
            ) : null}
          </span>
          <span
            className="text-[9px] tracking-[0.1em]"
            style={{ color: "var(--ink-soft)" }}
          >
            {String(pageNumber).padStart(2, "0")}
            {totalPages ? ` / ${String(totalPages).padStart(2, "0")}` : ""}
          </span>
        </footer>
      </div>
    </section>
  );
};

/* ============================================================
   MILESTONE ROW (table style, matches "Milestone detail")
============================================================ */

const MilestoneRow = ({ milestone }) => (
  <div
    className="milestone-row grid grid-cols-[64px_1fr_88px] gap-6 py-6 border-b"
    style={{ borderColor: "var(--line)" }}
  >
    <div>
      <span
        className="inline-flex w-10 h-10 items-center justify-center rounded-full text-sm font-semibold"
        style={{ background: "var(--forest)", color: "var(--paper)" }}
      >
        {romanish(milestone.milestoneNumber || 0)}
      </span>
    </div>

    <div>
      <h3 className="text-[15px] font-semibold" style={{ color: "var(--ink)" }}>
        {milestone.title || "Untitled milestone"}
      </h3>
      <p
        className="mt-1.5 text-[12.5px] leading-6"
        style={{ color: "var(--ink-soft)" }}
      >
        {milestone.description || "No description provided."}
      </p>
      {milestone.releaseTrigger && (
        <p
          className="mt-2 text-[10px] font-medium tracking-[0.06em] uppercase"
          style={{ color: "var(--gold-dark)" }}
        >
          {milestone.releaseTrigger}
        </p>
      )}
      {milestone.dueDate && (
        <p className="mt-1 text-[10.5px]" style={{ color: "var(--ink-soft)" }}>
          Due {formatDate(milestone.dueDate)}
        </p>
      )}
    </div>

    <div className="text-right">
      <p className="text-xl font-bold" style={{ color: "var(--forest)" }}>
        {formatPercent(milestone.percentage)}
      </p>
      <p className="mt-1 text-[11px]" style={{ color: "var(--ink-soft)" }}>
        {formatCurrency(milestone.amount)}
      </p>
    </div>
  </div>
);

/* ============================================================
   MAIN COMPONENT
============================================================ */

const PaymentScheduleView = ({ schedule, className = "" }) => {
  const documentRef = useRef(null);

  const [milestonePages, setMilestonePages] = useState([]);
  const [termsPages, setTermsPages] = useState([]);

  const sortedMilestones = useMemo(() => {
    if (!schedule?.milestones) return [];
    return [...schedule.milestones].sort(
      (a, b) => Number(a.milestoneNumber || 0) - Number(b.milestoneNumber || 0),
    );
  }, [schedule]);

  const totalPercentage = useMemo(
    () =>
      sortedMilestones.reduce((sum, m) => sum + (Number(m.percentage) || 0), 0),
    [sortedMilestones],
  );

  const totalMilestoneAmount = useMemo(
    () => sortedMilestones.reduce((sum, m) => sum + (Number(m.amount) || 0), 0),
    [sortedMilestones],
  );

  const projectLine = `${schedule?.project?.name || "Untitled Project"}${
    schedule?.project?.site_location
      ? ` · ${schedule.project.site_location}`
      : ""
  }`;

  /* ============================================================
     DYNAMIC MILESTONE PAGINATION (table rows)
  ============================================================ */

  useEffect(() => {
    if (!sortedMilestones.length) {
      setMilestonePages([]);
      return;
    }

    const measureContainer = document.createElement("div");
    measureContainer.style.position = "absolute";
    measureContainer.style.visibility = "hidden";
    measureContainer.style.pointerEvents = "none";
    measureContainer.style.width = "794px";
    measureContainer.className = "px-14";
    document.body.appendChild(measureContainer);

    const pageContentHeight =
      A4_HEIGHT - PAGE_PADDING_TOP - PAGE_PADDING_BOTTOM - 90;

    const pages = [];
    let currentPage = [];
    let currentHeight = 0;

    sortedMilestones.forEach((milestone) => {
      const wrapper = document.createElement("div");
      wrapper.innerHTML = `
        <div style="display:grid;grid-template-columns:64px 1fr 88px;gap:24px;padding:24px 0;border-bottom:1px solid #dcdfd9;">
          <div><span style="display:inline-flex;width:40px;height:40px;align-items:center;justify-content:center;border-radius:9999px;font-size:14px;">${romanish(
            milestone.milestoneNumber || 0,
          )}</span></div>
          <div>
            <div style="font-size:15px;font-weight:600;">${milestone.title || "Untitled milestone"}</div>
            <div style="margin-top:6px;font-size:12.5px;line-height:24px;">${
              milestone.description || "No description provided."
            }</div>
            ${
              milestone.releaseTrigger
                ? `<div style="margin-top:8px;font-size:10px;">${milestone.releaseTrigger}</div>`
                : ""
            }
            ${
              milestone.dueDate
                ? `<div style="margin-top:4px;font-size:10.5px;">Due ${formatDate(milestone.dueDate)}</div>`
                : ""
            }
          </div>
          <div style="text-align:right;">
            <div style="font-size:20px;font-weight:700;">${formatPercent(milestone.percentage)}</div>
          </div>
        </div>
      `;

      measureContainer.appendChild(wrapper);
      const height = wrapper.getBoundingClientRect().height + 4;
      measureContainer.removeChild(wrapper);

      if (
        currentPage.length > 0 &&
        currentHeight + height > pageContentHeight
      ) {
        pages.push(currentPage);
        currentPage = [];
        currentHeight = 0;
      }

      currentPage.push(milestone);
      currentHeight += height;
    });

    if (currentPage.length) pages.push(currentPage);

    document.body.removeChild(measureContainer);
    setMilestonePages(pages);
  }, [sortedMilestones]);

  /* ============================================================
     TERMS PAGINATION
  ============================================================ */

  useEffect(() => {
    if (!schedule?.termsTemplate?.content_html) {
      setTermsPages([
        "<p>No terms and conditions have been defined for this payment schedule.</p>",
      ]);
      return;
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(
      schedule.termsTemplate.content_html,
      "text/html",
    );
    const blocks = Array.from(doc.body.children);

    const measureContainer = document.createElement("div");
    measureContainer.style.position = "absolute";
    measureContainer.style.visibility = "hidden";
    measureContainer.style.width = "794px";
    measureContainer.className = "text-[12.5px] leading-7";
    document.body.appendChild(measureContainer);

    const pageContentHeight =
      A4_HEIGHT - PAGE_PADDING_TOP - PAGE_PADDING_BOTTOM - 90;

    const pages = [];
    let currentBlocks = [];
    let currentHeight = 0;

    blocks.forEach((block) => {
      const clone = block.cloneNode(true);
      measureContainer.appendChild(clone);
      const height = clone.getBoundingClientRect().height + 16;
      measureContainer.removeChild(clone);

      if (
        currentBlocks.length > 0 &&
        currentHeight + height > pageContentHeight
      ) {
        pages.push(currentBlocks.join(""));
        currentBlocks = [];
        currentHeight = 0;
      }

      currentBlocks.push(block.outerHTML);
      currentHeight += height;
    });

    if (currentBlocks.length) pages.push(currentBlocks.join(""));

    document.body.removeChild(measureContainer);
    setTermsPages(pages);
  }, [schedule?.termsTemplate?.content_html]);

  /* ============================================================
     PDF
  ============================================================ */

  const handleDownloadPDF = async () => {
    if (!documentRef.current) return;

    const pages = Array.from(
      documentRef.current.querySelectorAll(".payment-page"),
    );
    if (!pages.length) return;

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
      compress: true,
    });

    for (let index = 0; index < pages.length; index++) {
      const page = pages[index];
      const canvas = await html2canvas(page, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#faf8f3",
      });
      const imgData = canvas.toDataURL("image/jpeg", 0.95);
      if (index > 0) pdf.addPage();
      pdf.addImage(imgData, "JPEG", 0, 0, 210, 297, undefined, "FAST");
    }

    const projectName = schedule?.project?.name || "Project";
    const safeProjectName = projectName
      .replace(/[<>:"/\\|?*]+/g, "")
      .replace(/\s+/g, "_");

    pdf.save(
      `Payment_Schedule_${safeProjectName}_${schedule?.id?.slice(0, 8) || "draft"}.pdf`,
    );
  };

  if (!schedule) {
    return (
      <div
        className="flex items-center justify-center h-64"
        style={{ color: "var(--ink-soft)" }}
      >
        No payment schedule selected
      </div>
    );
  }

  const project = schedule.project || {};
  const contractValue = Number(schedule.totalContractValue) || 0;
  const gstAmount = Number(schedule.gstAmount) || 0;
  const totalPayable = Number(schedule.totalPayable) || 0;
  const gstRate = Number(schedule.gstRate) || 0;

  const totalPages = 2 + milestonePages.length + termsPages.length + 2;
  let pageCounter = 0;

  return (
    <div
      className={`min-h-screen ${className}`}
      style={{ background: "var(--canvas)" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300;9..144,400;9..144,500;9..144,600&family=Inter:wght@400;500;600;700&display=swap');

        .payment-schedule-root, .payment-schedule-root * { font-family: 'Inter', sans-serif; }
        .payment-schedule-root .font-display { font-family: 'Fraunces', serif; }

        :root {
          --forest: #16362d;
          --forest-light: #274f42;
          --paper: #faf8f3;
          --canvas: #eef0ea;
          --ink: #1c2622;
          --ink-soft: #6b7871;
          --gold: #c3a06a;
          --gold-dark: #9c7c46;
          --line: #dfe1d8;
        }

        @media print {
          @page { size: A4; margin: 0; }
          html, body { margin: 0 !important; padding: 0 !important; background: white !important; }
          .payment-page {
            width: 210mm !important;
            height: 297mm !important;
            min-height: 297mm !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            page-break-after: always;
            break-after: page;
            overflow: hidden !important;
          }
          .payment-page:last-child { page-break-after: auto; break-after: auto; }
        }

        @media screen {
          .payment-page { width: 210mm; height: 297mm; min-height: 297mm; }
        }

        .terms-content h1 { font-family: 'Fraunces', serif; font-size: 22px; margin-bottom: 18px; color: var(--forest); }
        .terms-content h2 {
          font-size: 12px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase;
          margin-top: 24px; margin-bottom: 10px; color: var(--gold-dark);
        }
        .terms-content h3 { font-weight: 600; margin-top: 18px; margin-bottom: 8px; color: var(--ink); }
        .terms-content p { margin-bottom: 14px; }
        .terms-content ul { list-style: disc; padding-left: 22px; margin-bottom: 16px; }
        .terms-content ol { list-style: decimal; padding-left: 22px; margin-bottom: 16px; }
        .terms-content li { margin-bottom: 8px; }
      `}</style>

      <div className="payment-schedule-root">
        {/* ==================================================
            TOOLBAR
        ================================================== */}
        <div
          className="sticky top-0 z-30 px-6 py-4 flex items-center justify-between print:hidden border-b"
          style={{ background: "var(--paper)", borderColor: "var(--line)" }}
        >
          <div>
            <h1
              className="font-display text-xl"
              style={{ color: "var(--ink)" }}
            >
              Payment Schedule
            </h1>
            <p className="text-sm" style={{ color: "var(--ink-soft)" }}>
              {project.name || "Untitled Project"}
            </p>
          </div>

          <button
            onClick={handleDownloadPDF}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-full"
            style={{ background: "var(--forest)", color: "var(--paper)" }}
          >
            <Download className="w-4 h-4" />
            Download PDF
          </button>
        </div>

        {/* ==================================================
            DOCUMENT
        ================================================== */}
        <div
          ref={documentRef}
          className="max-w-[900px] mx-auto py-10 space-y-8 print:py-0 print:space-y-0"
        >
          {/* ---------- COVER ---------- */}
          <DocumentPage
            pageNumber={++pageCounter}
            totalPages={totalPages}
            projectLine={project.site_location}
          >
            <div className="px-14 pt-24 flex flex-col items-center text-center">
              <LogoSlot size={160} />

              <h1
                className="font-display mt-8 text-[34px] tracking-[0.14em]"
                style={{ color: "var(--forest)" }}
              >
                RIPPŌTAI
              </h1>
              <p
                className="mt-3 text-[11px] tracking-[0.42em] uppercase"
                style={{ color: "var(--ink-soft)" }}
              >
                Payment Schedule
              </p>

              {/* PROJECT — full-width field, matches source layout */}
              <div className="mt-28 w-full text-left">
                <p
                  className="text-[10px] tracking-[0.22em] uppercase"
                  style={{ color: "var(--ink-soft)" }}
                >
                  Project:
                  <span
                    className="ml-2 text-[13px] tracking-normal normal-case font-medium"
                    style={{ color: "var(--ink)" }}
                  >
                    {project.name || "Untitled Project"}
                  </span>
                </p>
              </div>

              {/* ADDRESS / CLIENT and PRINCIPAL ARCHITECT / PROJECT LEAD pairs */}
              <div className="mt-6 w-full grid grid-cols-2 gap-x-10 gap-y-6 text-left">
                {[
                  ["Address", project.site_location],
                  ["Client", project.clientName],
                  ["Principal Architect", project.principalArchitect],
                  ["Project Lead", project.projectLead],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="border-b pb-3"
                    style={{ borderColor: "var(--line)" }}
                  >
                    <p
                      className="text-[10px] tracking-[0.22em] uppercase"
                      style={{ color: "var(--ink-soft)" }}
                    >
                      {label}:
                      <span
                        className="ml-2 text-[13px] tracking-normal normal-case font-medium"
                        style={{ color: "var(--ink)" }}
                      >
                        {value || ""}
                      </span>
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </DocumentPage>

          {/* ---------- PAYMENT OVERVIEW ---------- */}
          <DocumentPage
            pageNumber={++pageCounter}
            totalPages={totalPages}
            projectLine={project.site_location}
          >
            <PageHeader
              eyebrow="01 · Payment Overview"
              projectLine={projectLine}
            />

            <div className="px-14 pt-10">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p
                    className="font-display text-6xl"
                    style={{ color: "var(--forest)" }}
                  >
                    {String(sortedMilestones.length).padStart(2, "0")}
                  </p>
                  <p
                    className="mt-2 text-[12.5px]"
                    style={{ color: "var(--ink-soft)" }}
                  >
                    Payment milestones from booking to handover
                  </p>
                </div>
                <div>
                  <p
                    className="font-display text-6xl"
                    style={{ color: "var(--forest)" }}
                  >
                    {formatPercent(totalPercentage)}
                  </p>
                  <p
                    className="mt-2 text-[12.5px]"
                    style={{ color: "var(--ink-soft)" }}
                  >
                    Of contract value, exclusive of GST and variations
                  </p>
                </div>
              </div>

              <p
                className="mt-14 text-[11px] font-semibold tracking-[0.28em] uppercase"
                style={{ color: "var(--gold-dark)" }}
              >
                Payment Release — Against Phases
              </p>

              <div className="mt-6">
                {sortedMilestones.map((milestone) => (
                  <div
                    key={milestone.id}
                    className="flex items-center justify-between py-3.5 border-b"
                    style={{ borderColor: "var(--line)" }}
                  >
                    <div className="flex items-center gap-4">
                      <span
                        className="font-display text-sm"
                        style={{ color: "var(--gold-dark)" }}
                      >
                        M{milestone.milestoneNumber}
                      </span>
                      <span
                        className="text-[13px] font-medium tracking-[0.02em] uppercase"
                        style={{ color: "var(--ink)" }}
                      >
                        {milestone.title || "Untitled milestone"}
                      </span>
                    </div>
                    <span
                      className="text-[13px] font-semibold"
                      style={{ color: "var(--forest)" }}
                    >
                      {formatPercent(milestone.percentage)}
                    </span>
                  </div>
                ))}
              </div>

              <div
                className="mt-8 relative h-1.5 rounded-full"
                style={{ background: "var(--line)" }}
              >
                <div
                  className="absolute inset-y-0 left-0 rounded-full"
                  style={{ width: "100%", background: "var(--forest)" }}
                />
              </div>
              <div
                className="mt-2 flex justify-between text-[10px] tracking-[0.2em] uppercase"
                style={{ color: "var(--ink-soft)" }}
              >
                <span>On Signing</span>
                <span>On Handover</span>
              </div>
            </div>
          </DocumentPage>

          {/* ---------- MILESTONE DETAIL (paginated table) ---------- */}
          {milestonePages.map((milestones, index) => (
            <DocumentPage
              key={`milestone-page-${index}`}
              pageNumber={++pageCounter}
              totalPages={totalPages}
              projectLine={project.site_location}
            >
              <PageHeader
                eyebrow="02 · Milestone Detail"
                projectLine={projectLine}
              />

              <div className="px-14 pt-8">
                {index === 0 && (
                  <h2
                    className="font-display text-2xl mb-6"
                    style={{ color: "var(--forest)" }}
                  >
                    Milestone detail
                  </h2>
                )}
                {index === 0 && (
                  <div
                    className="grid grid-cols-[64px_1fr_88px] gap-6 pb-3 text-[10px] tracking-[0.2em] uppercase"
                    style={{ color: "var(--ink-soft)" }}
                  >
                    <span>No.</span>
                    <span>Coverage &amp; Release Trigger</span>
                    <span className="text-right">Share</span>
                  </div>
                )}
                {milestones.map((milestone) => (
                  <MilestoneRow key={milestone.id} milestone={milestone} />
                ))}
              </div>
            </DocumentPage>
          ))}

          {/* ---------- FINANCIAL SUMMARY ---------- */}
          <DocumentPage
            pageNumber={++pageCounter}
            totalPages={totalPages}
            projectLine={project.site_location}
          >
            <PageHeader
              eyebrow="03 · Financial Summary"
              projectLine={projectLine}
            />

            <div className="px-14 pt-10">
              <h2
                className="font-display text-2xl mb-6"
                style={{ color: "var(--forest)" }}
              >
                Financial Summary
              </h2>

              <div
                className="flex items-baseline justify-between py-6 border-b"
                style={{ borderColor: "var(--line)" }}
              >
                <div>
                  <p
                    className="text-[10px] tracking-[0.22em] uppercase"
                    style={{ color: "var(--ink-soft)" }}
                  >
                    Contract Value
                  </p>
                  <p
                    className="mt-1 text-[13px]"
                    style={{ color: "var(--ink)" }}
                  >
                    Base contract value
                  </p>
                </div>
                <p
                  className="font-display text-2xl"
                  style={{ color: "var(--ink)" }}
                >
                  {formatCurrency(contractValue)}
                </p>
              </div>

              <div
                className="flex items-baseline justify-between py-6 border-b"
                style={{ borderColor: "var(--line)" }}
              >
                <div>
                  <p
                    className="text-[10px] tracking-[0.22em] uppercase"
                    style={{ color: "var(--ink-soft)" }}
                  >
                    GST
                  </p>
                  <p
                    className="mt-1 text-[13px]"
                    style={{ color: "var(--ink)" }}
                  >
                    GST at {gstRate}%
                  </p>
                </div>
                <p
                  className="font-display text-2xl"
                  style={{ color: "var(--ink)" }}
                >
                  {formatCurrency(gstAmount)}
                </p>
              </div>

              <div
                className="mt-8 flex items-baseline justify-between rounded-2xl px-8 py-8"
                style={{ background: "var(--forest)", color: "var(--paper)" }}
              >
                <p
                  className="text-[10px] tracking-[0.22em] uppercase"
                  style={{ color: "var(--gold)" }}
                >
                  Total Payable
                </p>
                <p className="font-display text-4xl">
                  {formatCurrency(totalPayable)}
                </p>
              </div>
            </div>
          </DocumentPage>

          {/* ---------- TERMS & CONDITIONS (paginated) ---------- */}
          {termsPages.map((content, index) => (
            <DocumentPage
              key={`terms-${index}`}
              pageNumber={++pageCounter}
              totalPages={totalPages}
              projectLine={project.site_location}
            >
              <PageHeader
                eyebrow="04 · Terms & Conditions"
                projectLine={projectLine}
              />

              <div className="px-14 pt-8">
                {index === 0 && (
                  <h2
                    className="font-display text-2xl mb-6"
                    style={{ color: "var(--forest)" }}
                  >
                    Terms & Conditions
                  </h2>
                )}
                <div
                  className="terms-content text-[12.5px] leading-7"
                  style={{ color: "var(--ink)" }}
                  dangerouslySetInnerHTML={{ __html: content }}
                />
              </div>
            </DocumentPage>
          ))}

          {/* ---------- ACCEPTANCE ---------- */}
          <DocumentPage
            pageNumber={++pageCounter}
            totalPages={totalPages}
            projectLine={project.site_location}
          >
            <PageHeader eyebrow="05 · Acceptance" projectLine={projectLine} />

            <div className="px-14 pt-10">
              <p
                className="text-[13px] leading-7"
                style={{ color: "var(--ink-soft)" }}
              >
                The Client confirms having read and accepted the milestones,
                percentages and terms set out in this schedule, which forms an
                integral part of the Plan of Action and the signed Agreement for
                this project.
              </p>

              <div className="mt-24 grid grid-cols-2 gap-16">
                <div>
                  <p
                    className="text-[10px] font-semibold tracking-[0.22em] uppercase"
                    style={{ color: "var(--gold-dark)" }}
                  >
                    For Rippotai
                  </p>
                  <div
                    className="mt-20 border-b"
                    style={{ borderColor: "var(--ink-soft)" }}
                  />
                  <p
                    className="mt-4 text-[12.5px]"
                    style={{ color: "var(--ink-soft)" }}
                  >
                    Authorised Signatory
                  </p>
                  <p
                    className="mt-4 text-[13px]"
                    style={{ color: "var(--ink)" }}
                  >
                    Name: __________________
                  </p>
                  <p
                    className="mt-3 text-[12px]"
                    style={{ color: "var(--ink-soft)" }}
                  >
                    Date: __________________
                  </p>
                </div>

                <div>
                  <p
                    className="text-[10px] font-semibold tracking-[0.22em] uppercase"
                    style={{ color: "var(--gold-dark)" }}
                  >
                    Accepted by the Client
                  </p>
                  <div
                    className="mt-20 border-b"
                    style={{ borderColor: "var(--ink-soft)" }}
                  />
                  <p
                    className="mt-4 text-[12.5px]"
                    style={{ color: "var(--ink-soft)" }}
                  >
                    Client Signature
                  </p>
                  <p
                    className="mt-4 text-[13px]"
                    style={{ color: "var(--ink)" }}
                  >
                    Name: __________________
                  </p>
                  <p
                    className="mt-3 text-[12px]"
                    style={{ color: "var(--ink-soft)" }}
                  >
                    Date: __________________
                  </p>
                </div>
              </div>
            </div>
          </DocumentPage>
        </div>
      </div>
    </div>
  );
};

export default PaymentScheduleView;
