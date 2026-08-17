import React, { useMemo, useRef, useState, useEffect } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { Download, Printer } from "lucide-react";

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

/* ============================================================
   STATUS
============================================================ */

const StatusBadge = ({ status }) => {
  const styles = {
    PENDING: "bg-amber-100 text-amber-800 border-amber-200",
    DUE: "bg-orange-100 text-orange-800 border-orange-200",
    INVOICED: "bg-blue-100 text-blue-800 border-blue-200",
    PAID: "bg-emerald-100 text-emerald-800 border-emerald-200",
    OVERDUE: "bg-red-100 text-red-800 border-red-200",
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
        styles[status] || "bg-gray-100 text-gray-700 border-gray-200"
      }`}
    >
      {status || "PENDING"}
    </span>
  );
};

/* ============================================================
   PAGE COMPONENT
============================================================ */

const DocumentPage = ({ children, pageNumber, totalPages, pageRef }) => {
  return (
    <section
      ref={pageRef}
      className="
        payment-page
        relative
        bg-white
        shadow-xl
        print:shadow-none
      "
    >
      <div
        className="
          flex
          flex-col
          min-h-[297mm]
          h-[297mm]
          overflow-hidden
        "
      >
        <div className="flex-1 overflow-hidden">{children}</div>

        <footer className="px-12 pb-7 pt-5 border-t border-gray-100 flex items-center justify-between shrink-0">
          <span className="text-[10px] uppercase tracking-[0.2em] text-gray-400">
            RIPPŌTAI • Payment Schedule
          </span>

          <span className="text-[10px] text-gray-400">
            Page {pageNumber}
            {totalPages ? ` of ${totalPages}` : ""}
          </span>
        </footer>
      </div>
    </section>
  );
};

/* ============================================================
   MILESTONE CARD
============================================================ */

const MilestoneCard = ({ milestone }) => {
  return (
    <div className="milestone-card rounded-2xl border border-gray-200 overflow-hidden bg-white">
      <div className="px-6 py-5 bg-gray-50 flex items-start justify-between gap-6">
        <div className="flex gap-4">
          <div className="w-10 h-10 shrink-0 rounded-xl bg-emerald-800 text-white flex items-center justify-center font-semibold">
            {String(milestone.milestoneNumber || 0).padStart(2, "0")}
          </div>

          <div>
            <p className="text-xs uppercase tracking-wider text-gray-400">
              {milestone.milestoneCode || `M${milestone.milestoneNumber}`}
            </p>

            <h3 className="mt-1 text-lg font-semibold text-gray-900">
              {milestone.title || "Untitled milestone"}
            </h3>

            <div className="mt-2">
              <StatusBadge status={milestone.status} />
            </div>
          </div>
        </div>

        <div className="text-right shrink-0">
          <p className="text-xs uppercase tracking-wider text-gray-400">
            Share
          </p>

          <p className="mt-1 text-2xl font-bold text-emerald-800">
            {formatPercent(milestone.percentage)}
          </p>

          <p className="mt-1 text-sm font-semibold text-gray-900">
            {formatCurrency(milestone.amount)}
          </p>
        </div>
      </div>

      <div className="px-6 py-5">
        <p className="text-sm leading-6 text-gray-600">
          {milestone.description || "No description provided."}
        </p>

        {(milestone.releaseTrigger || milestone.dueDate) && (
          <div className="mt-5 grid grid-cols-2 gap-5">
            {milestone.releaseTrigger && (
              <div>
                <p className="text-[10px] uppercase tracking-wider text-gray-400">
                  Release Trigger
                </p>

                <p className="mt-1 text-sm text-gray-700">
                  {milestone.releaseTrigger}
                </p>
              </div>
            )}

            {milestone.dueDate && (
              <div>
                <p className="text-[10px] uppercase tracking-wider text-gray-400">
                  Due Date
                </p>

                <p className="mt-1 text-sm text-gray-700">
                  {formatDate(milestone.dueDate)}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

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

  const totalPercentage = useMemo(() => {
    return sortedMilestones.reduce(
      (sum, milestone) => sum + (Number(milestone.percentage) || 0),
      0,
    );
  }, [sortedMilestones]);

  const totalMilestoneAmount = useMemo(() => {
    return sortedMilestones.reduce(
      (sum, milestone) => sum + (Number(milestone.amount) || 0),
      0,
    );
  }, [sortedMilestones]);

  /* ============================================================
     DYNAMIC MILESTONE PAGINATION
  ============================================================ */

  useEffect(() => {
    if (!sortedMilestones.length) {
      setMilestonePages([]);
      return;
    }

    /*
     * We use an invisible measuring container.
     *
     * Every milestone is rendered individually.
     * We calculate its real height.
     *
     * If it doesn't fit:
     *
     * current page -> finished
     * milestone -> next page
     */
    const measureContainer = document.createElement("div");

    measureContainer.style.position = "absolute";
    measureContainer.style.visibility = "hidden";
    measureContainer.style.pointerEvents = "none";
    measureContainer.style.width = "794px";

    measureContainer.className = "px-14";

    document.body.appendChild(measureContainer);

    const pageContentHeight =
      A4_HEIGHT - PAGE_PADDING_TOP - PAGE_PADDING_BOTTOM - 70;

    const pages = [];
    let currentPage = [];
    let currentHeight = 0;

    sortedMilestones.forEach((milestone) => {
      const wrapper = document.createElement("div");

      wrapper.className = "milestone-card mb-5";

      wrapper.innerHTML = `
        <div style="
          border: 1px solid #e5e7eb;
          border-radius: 16px;
          overflow: hidden;
          background: white;
        ">
          <div style="
            padding: 20px;
            background: #f9fafb;
            display: flex;
            justify-content: space-between;
          ">
            <div>
              <div style="
                font-size: 12px;
                color: #9ca3af;
              ">
                ${milestone.milestoneCode || `M${milestone.milestoneNumber}`}
              </div>

              <div style="
                font-size: 18px;
                font-weight: 600;
                margin-top: 4px;
              ">
                ${milestone.title || "Untitled milestone"}
              </div>
            </div>

            <div style="
              font-size: 20px;
              font-weight: 700;
            ">
              ${formatPercent(milestone.percentage)}
            </div>
          </div>

          <div style="padding: 20px;">
            <div style="
              font-size: 14px;
              line-height: 24px;
              color: #4b5563;
            ">
              ${milestone.description || "No description provided."}
            </div>

            ${
              milestone.releaseTrigger
                ? `
                  <div style="
                    margin-top: 15px;
                    font-size: 12px;
                    color: #6b7280;
                  ">
                    Release Trigger:
                    ${milestone.releaseTrigger}
                  </div>
                `
                : ""
            }

            ${
              milestone.dueDate
                ? `
                  <div style="
                    margin-top: 10px;
                    font-size: 12px;
                    color: #6b7280;
                  ">
                    Due:
                    ${formatDate(milestone.dueDate)}
                  </div>
                `
                : ""
            }
          </div>
        </div>
      `;

      measureContainer.appendChild(wrapper);

      const height = wrapper.getBoundingClientRect().height + 20;

      measureContainer.removeChild(wrapper);

      /*
       * If the milestone does not fit,
       * start another page.
       */
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

    if (currentPage.length) {
      pages.push(currentPage);
    }

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

    /*
     * Terms are split by block-level HTML elements.
     *
     * This prevents an entire huge terms document from
     * being forced onto one page.
     */
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

    measureContainer.className = "text-sm leading-7";

    document.body.appendChild(measureContainer);

    const pageContentHeight =
      A4_HEIGHT - PAGE_PADDING_TOP - PAGE_PADDING_BOTTOM - 70;

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

    if (currentBlocks.length) {
      pages.push(currentBlocks.join(""));
    }

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
        backgroundColor: "#ffffff",
      });

      const imgData = canvas.toDataURL("image/jpeg", 0.95);

      if (index > 0) {
        pdf.addPage();
      }

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

  const handlePrint = () => {
    window.print();
  };

  if (!schedule) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        No payment schedule selected
      </div>
    );
  }

  const project = schedule.project || {};

  const contractValue = Number(schedule.totalContractValue) || 0;

  const gstAmount = Number(schedule.gstAmount) || 0;

  const totalPayable = Number(schedule.totalPayable) || 0;

  const gstRate = Number(schedule.gstRate) || 0;

  /*
   * Static pages:
   *
   * 1 Cover
   * 2 Payment Summary
   * N Milestones
   * N Terms
   * 1 Financial
   * 1 Acceptance
   */
  const totalPages = 2 + milestonePages.length + termsPages.length + 2;

  let pageCounter = 0;

  return (
    <div className={`bg-gray-100 min-h-screen ${className}`}>
      {/* ======================================================
          TOOLBAR
      ====================================================== */}

      <div className="sticky top-0 z-30 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between print:hidden">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">
            Payment Schedule
          </h1>

          <p className="text-sm text-gray-500">
            {project.name || "Untitled Project"}
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Printer className="w-4 h-4" />
            Print
          </button>

          <button
            onClick={handleDownloadPDF}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-emerald-700 rounded-lg hover:bg-emerald-800"
          >
            <Download className="w-4 h-4" />
            Download PDF
          </button>
        </div>
      </div>

      {/* ======================================================
          DOCUMENT
      ====================================================== */}

      <div
        ref={documentRef}
        className="
          max-w-[900px]
          mx-auto
          py-10
          space-y-8
          print:py-0
          print:space-y-0
        "
      >
        {/* ====================================================
            COVER
        ==================================================== */}

        <DocumentPage pageNumber={++pageCounter} totalPages={totalPages}>
          <div className="px-14 pt-20">
            <div className="flex justify-center">
              <div className="w-24 h-24 rounded-3xl bg-emerald-800 text-white flex items-center justify-center text-4xl font-bold">
                R
              </div>
            </div>

            <div className="mt-10 text-center">
              <h1 className="text-4xl font-bold text-emerald-900">RIPPŌTAI</h1>

              <p className="mt-3 text-sm tracking-[0.35em] uppercase text-gray-400">
                Payment Schedule
              </p>
            </div>

            <div className="mt-20 border-l-4 border-emerald-800 pl-6">
              <p className="text-xs uppercase tracking-wider text-gray-400">
                Project
              </p>

              <h2 className="mt-2 text-3xl font-bold text-gray-900">
                {project.name || "Untitled Project"}
              </h2>

              <p className="mt-3 text-gray-500">
                Payment milestones from booking through project handover.
              </p>
            </div>

            <div className="mt-20 grid grid-cols-2 gap-10">
              <div>
                <p className="text-xs uppercase tracking-wider text-gray-400">
                  Client
                </p>

                <p className="mt-2 font-medium text-gray-900">
                  {project.clientName || "—"}
                </p>
              </div>

              <div>
                <p className="text-xs uppercase tracking-wider text-gray-400">
                  Project Lead
                </p>

                <p className="mt-2 font-medium text-gray-900">
                  {project.projectLead || "—"}
                </p>
              </div>

              <div>
                <p className="text-xs uppercase tracking-wider text-gray-400">
                  Address
                </p>

                <p className="mt-2 font-medium text-gray-900">
                  {project.site_location || "—"}
                </p>
              </div>

              <div>
                <p className="text-xs uppercase tracking-wider text-gray-400">
                  Created
                </p>

                <p className="mt-2 font-medium text-gray-900">
                  {formatDate(schedule.createdAt)}
                </p>
              </div>
            </div>
          </div>
        </DocumentPage>

        {/* ====================================================
            PAYMENT SUMMARY
        ==================================================== */}

        <DocumentPage pageNumber={++pageCounter} totalPages={totalPages}>
          <div className="px-14 pt-14">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
              01 • Payment Overview
            </p>

            <h2 className="mt-3 text-3xl font-bold text-gray-900">
              Payment Release Schedule
            </h2>

            <div className="mt-12 grid grid-cols-2 gap-6">
              <div className="rounded-2xl bg-emerald-800 p-7 text-white">
                <p className="text-xs uppercase tracking-wider text-emerald-200">
                  Contract Coverage
                </p>

                <p className="mt-3 text-5xl font-bold">
                  {formatPercent(totalPercentage)}
                </p>
              </div>

              <div className="rounded-2xl bg-gray-50 p-7">
                <p className="text-xs uppercase tracking-wider text-gray-400">
                  Milestones
                </p>

                <p className="mt-3 text-5xl font-bold text-gray-900">
                  {sortedMilestones.length}
                </p>
              </div>
            </div>

            <div className="mt-14 space-y-5">
              {sortedMilestones.map((milestone) => {
                const pct = Number(milestone.percentage) || 0;

                return (
                  <div key={milestone.id}>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">
                        {milestone.title || "Untitled milestone"}
                      </span>

                      <span className="text-sm font-semibold text-emerald-800">
                        {formatPercent(pct)}
                      </span>
                    </div>

                    <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-700 rounded-full"
                        style={{
                          width: `${Math.min(pct, 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </DocumentPage>

        {/* ====================================================
            DYNAMIC MILESTONE PAGES
        ==================================================== */}

        {milestonePages.map((milestones, index) => (
          <DocumentPage
            key={`milestone-page-${index}`}
            pageNumber={++pageCounter}
            totalPages={totalPages}
          >
            <div className="px-14 pt-14">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
                02 • Milestone Details
              </p>

              <h2 className="mt-3 text-3xl font-bold text-gray-900">
                Payment Milestones
              </h2>

              <div className="mt-10 space-y-5">
                {milestones.map((milestone) => (
                  <MilestoneCard key={milestone.id} milestone={milestone} />
                ))}
              </div>
            </div>
          </DocumentPage>
        ))}

        {/* ====================================================
            DYNAMIC TERMS PAGES
        ==================================================== */}

        {termsPages.map((content, index) => (
          <DocumentPage
            key={`terms-${index}`}
            pageNumber={++pageCounter}
            totalPages={totalPages}
          >
            <div className="px-14 pt-14">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
                04 • Legal Terms
              </p>

              <h2 className="mt-3 text-3xl font-bold text-gray-900">
                Terms & Conditions
              </h2>

              <div
                className="
                    mt-10
                    text-sm
                    text-gray-700
                    leading-7

                    [&_h1]:text-2xl
                    [&_h1]:font-bold
                    [&_h1]:mb-5

                    [&_h2]:text-xl
                    [&_h2]:font-semibold
                    [&_h2]:mt-7
                    [&_h2]:mb-4

                    [&_h3]:font-semibold
                    [&_h3]:mt-6
                    [&_h3]:mb-2

                    [&_p]:mb-4

                    [&_ul]:list-disc
                    [&_ul]:pl-6
                    [&_ul]:mb-5

                    [&_ol]:list-decimal
                    [&_ol]:pl-6
                    [&_ol]:mb-5

                    [&_li]:mb-2
                  "
                dangerouslySetInnerHTML={{
                  __html: content,
                }}
              />
            </div>
          </DocumentPage>
        ))}

        {/* ====================================================
            FINANCIAL SUMMARY
        ==================================================== */}

        <DocumentPage pageNumber={++pageCounter} totalPages={totalPages}>
          <div className="px-14 pt-14">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
              03 • Financial Summary
            </p>

            <h2 className="mt-3 text-3xl font-bold text-gray-900">
              Contract & Payment Summary
            </h2>

            <div className="mt-12 space-y-5">
              <div className="p-7 rounded-2xl bg-gray-50 flex justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wider text-gray-400">
                    Contract Value
                  </p>

                  <p className="mt-2 text-lg font-medium">
                    Base contract value
                  </p>
                </div>

                <p className="text-2xl font-bold">
                  {formatCurrency(contractValue)}
                </p>
              </div>

              <div className="p-7 rounded-2xl bg-gray-50 flex justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wider text-gray-400">
                    GST
                  </p>

                  <p className="mt-2 text-lg font-medium">GST at {gstRate}%</p>
                </div>

                <p className="text-2xl font-bold">
                  {formatCurrency(gstAmount)}
                </p>
              </div>

              <div className="p-8 rounded-2xl bg-emerald-800 text-white flex justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wider text-emerald-200">
                    Total Payable
                  </p>
                </div>

                <p className="text-4xl font-bold">
                  {formatCurrency(totalPayable)}
                </p>
              </div>
            </div>
          </div>
        </DocumentPage>

        {/* ====================================================
            ACCEPTANCE
        ==================================================== */}

        <DocumentPage pageNumber={++pageCounter} totalPages={totalPages}>
          <div className="px-14 pt-14">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
              05 • Acceptance
            </p>

            <h2 className="mt-3 text-3xl font-bold text-gray-900">
              Client Acceptance
            </h2>

            <div className="mt-12 rounded-2xl bg-gray-50 p-7">
              <p className="text-sm leading-7 text-gray-600">
                The Client confirms having read and accepted the milestones,
                percentages and terms set out in this schedule, which forms an
                integral part of the Plan of Action and the signed Agreement for
                this project.
              </p>
            </div>

            <div className="mt-24 grid grid-cols-2 gap-16">
              <div>
                <p className="text-xs font-semibold tracking-wider text-gray-400 uppercase">
                  For Rippotai
                </p>

                <div className="mt-20 border-b border-gray-300" />

                <p className="mt-4 text-sm text-gray-600">
                  Authorised Signatory
                </p>

                <p className="mt-4 text-sm">Name: __________________</p>

                <p className="mt-3 text-sm text-gray-500">
                  Date: __________________
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold tracking-wider text-gray-400 uppercase">
                  Accepted by the Client
                </p>

                <div className="mt-20 border-b border-gray-300" />

                <p className="mt-4 text-sm text-gray-600">Client Signature</p>

                <p className="mt-4 text-sm">Name: __________________</p>

                <p className="mt-3 text-sm text-gray-500">
                  Date: __________________
                </p>
              </div>
            </div>
          </div>
        </DocumentPage>
      </div>

      {/* ======================================================
          PRINT
      ====================================================== */}

      <style>
        {`
          @media print {
            @page {
              size: A4;
              margin: 0;
            }

            html,
            body {
              margin: 0 !important;
              padding: 0 !important;
              background: white !important;
            }

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

            .payment-page:last-child {
              page-break-after: auto;
              break-after: auto;
            }
          }

          @media screen {
            .payment-page {
              width: 210mm;
              height: 297mm;
              min-height: 297mm;
              border-radius: 4px;
            }
          }
        `}
      </style>
    </div>
  );
};

export default PaymentScheduleView;
