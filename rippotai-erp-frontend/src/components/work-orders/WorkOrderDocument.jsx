import { useEffect, useMemo, useRef, useState } from "react";
import logo from "../../assets/rippotai_logo.png";
import {
  currency,
  formatDate,
  formatStatus,
  getWorkOrderNumber,
  getProjectName,
  getVendorName,
  getItems,
  getPaymentStages,
  getTerms,
  getUnitName,
  getUnitCode,
} from "./workOrderFormat";
import "./WorkOrderDocument.css";
const PAGE_HEIGHT = 1123;
const PAGE_INSET = 9;
const blank = (value) => (value === "-" || value == null ? "" : value);
const sortRows = (rows) =>
  [...rows].sort(
    (a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0),
  );
function termHtml(value) {
  const doc = new DOMParser().parseFromString(value || "", "text/html");
  doc
    .querySelectorAll("script,style,iframe,object,embed,link,meta")
    .forEach((node) => node.remove());
  doc.querySelectorAll("*").forEach((node) =>
    Array.from(node.attributes).forEach((attribute) => {
      if (
        /^on/i.test(attribute.name) ||
        (/^(href|src)$/i.test(attribute.name) &&
          /^\s*javascript:/i.test(attribute.value))
      ) {
        node.removeAttribute(attribute.name);
      }
    }),
  );
  return doc.body.innerHTML;
}
function Header({ workOrder, pageNumber, totalPages }) {
  const orderDate =
    workOrder.work_order_date ||
    workOrder.workOrderDate ||
    workOrder.date ||
    workOrder.created_at ||
    workOrder.createdAt;
  const completionDate =
    workOrder.target_completion_date ||
    workOrder.expected_end_date ||
    workOrder.expectedEndDate;
  return (
    <header className="wo-header">
      <div className="wo-company">
        <div className="wo-brand">
          <img src={logo} alt="Rippotai" />
          <span>RIPPŌTAI</span>
        </div>
        <p className="wo-tagline">Architecture · Interiors · Turnkey</p>
        <p>
          Address:{" "}
          {workOrder.company_address ||
            "b-3/33, Mianwali Nagar, New Delhi 110087"}
        </p>
        <p>
          Phone: {workOrder.company_phone || "8882830560"} | Email:{" "}
          {workOrder.company_email || "sagar@rippotai.in"}
        </p>
        <p>
          GSTIN: {workOrder.company_gstin || workOrder.rippotai_gstin || ""}
        </p>
      </div>
      <div className="wo-identity">
        <h1>Work Order</h1>
        <p className="wo-service">Service</p>
        <dl className="wo-metadata">
          <div>
            <dt>WO ID:</dt>
            <dd>{getWorkOrderNumber(workOrder)}</dd>
          </div>
          <div>
            <dt>Date:</dt>
            <dd>{blank(formatDate(orderDate))}</dd>
          </div>
          <div>
            <dt>Target Completion:</dt>
            <dd>{blank(formatDate(completionDate))}</dd>
          </div>
          {totalPages > 1 && (
            <div>
              <dt>Page:</dt>
              <dd>
                {pageNumber} / {totalPages}
              </dd>
            </div>
          )}
        </dl>
      </div>
    </header>
  );
}
function Parties({ workOrder }) {
  const vendor = workOrder.vendor || {};
  const contractor = [
    [
      "Agency",
      workOrder.agency ||
        workOrder.contractor_company_name ||
        blank(getVendorName(workOrder)),
    ],
    [
      "Contact person",
      [
        workOrder.contractor_name ||
          vendor.contact_person ||
          vendor.contact_name,
        workOrder.contractor_position,
      ]
        .filter(Boolean)
        .join(" · "),
    ],
    [
      "Phone",
      workOrder.contractor_phone || vendor.contact_number || vendor.phone,
    ],
    ["Email", workOrder.contractor_email || vendor.email],
    ["GSTIN", workOrder.contractor_gstin || vendor.gstin],
    ["PAN", workOrder.contractor_pan || vendor.pan],
  ];
  const site = [
    ["Project", blank(getProjectName(workOrder))],
    [
      "Site address",
      workOrder.site_address || workOrder.project?.site_location,
    ],
    ["Site lead", workOrder.site_lead || workOrder.site_contact_person],
    [
      "Contact",
      [
        workOrder.site_phone,
        workOrder.site_lead && workOrder.site_contact_person,
      ]
        .filter(Boolean)
        .join(" · "),
    ],
    ["Working hours", workOrder.working_hours],
    null,
  ];
  if (workOrder.contractor_address || workOrder.site_email) {
    contractor.push(
      workOrder.contractor_address
        ? ["Address", workOrder.contractor_address]
        : null,
    );
    site.push(
      workOrder.site_email ? ["Site email", workOrder.site_email] : null,
    );
  }
  if (workOrder.site_gstin) {
    contractor.push(null);
    site.push(["Site GSTIN", workOrder.site_gstin]);
  }
  return (
    <div className="wo-parties">
      <div className="wo-party-titles">
        <h2>Service Contractor</h2>
        <h2>Site &amp; Project Location</h2>
      </div>
      {contractor.map((left, index) => (
        <div className="wo-party-row" key={index}>
          {left ? (
            <>
              <span className="wo-field-label">{left[0]}</span>
              <span>{left[1] || ""}</span>
            </>
          ) : (
            <>
              <span className="wo-empty-field" />
              <span className="wo-empty-field" />
            </>
          )}
          {site[index] ? (
            <>
              <span className="wo-field-label">{site[index][0]}</span>
              <span>{site[index][1] || ""}</span>
            </>
          ) : (
            <>
              <span className="wo-empty-field" />
              <span className="wo-empty-field" />
            </>
          )}
        </div>
      ))}
    </div>
  );
}
function ItemHeading() {
  return (
    <div className="wo-items-heading wo-items-grid">
      <span>S.No</span>
      <span>Description of service/deliverables</span>
      <span>Qty</span>
      <span>Rate (₹)</span>
      <span>Amount (₹)</span>
    </div>
  );
}
function ItemRow({ item, index }) {
  if (!item)
    return (
      <div className="wo-item-row wo-items-grid">
        <span>{index + 1}</span>
        <span />
        <span />
        <span />
        <span />
      </div>
    );
  const quantity = Number(item.quantity || 0),
    rate = Number(item.rate || 0);
  const unit = getUnitCode(item.unit) || getUnitName(item.unit);
  return (
    <div className="wo-item-row wo-items-grid">
      <span>{index + 1}</span>
      <div>
        {item.description || item.name || "-"}
        {item.item_type && item.item_type !== "SERVICE" && (
          <small>{formatStatus(item.item_type)}</small>
        )}
        {item.remarks && <small>{item.remarks}</small>}
      </div>
      <span>
        {quantity}
        {unit ? ` ${unit}` : ""}
      </span>
      <span>{currency(rate)}</span>
      <span>{currency(item.amount ?? item.total ?? quantity * rate)}</span>
    </div>
  );
}
function PaymentHeading() {
  return (
    <div className="wo-payments-heading">
      <h2>Payment Terms</h2>
      <div className="wo-payments-grid wo-payment-columns">
        <span>Stages</span>
        <span>Date</span>
        <span>Amount</span>
        <span>Remarks</span>
      </div>
    </div>
  );
}
function PaymentRow({ stage }) {
  return (
    <div className="wo-payment-row wo-payments-grid">
      <span>{stage ? stage.stage_name || stage.name : ""}</span>
      <span>
        {stage ? blank(formatDate(stage.due_date || stage.dueDate)) : ""}
      </span>
      <span>{stage ? currency(stage.amount) : ""}</span>
      <span>
        {stage?.remarks || ""}
        {Number(stage?.paid_amount) > 0 && (
          <small>Paid: {currency(stage.paid_amount)}</small>
        )}
        {stage?.status && !["PENDING", "UNPAID"].includes(stage.status) && (
          <small>{formatStatus(stage.status)}</small>
        )}
      </span>
    </div>
  );
}
function Signatures({ workOrder }) {
  return (
    <div className="wo-signatures">
      {[
        [
          "For Rippotai",
          "Authorised Signatory",
          workOrder.rippotai_signatory_name,
          workOrder.rippotai_signed_at,
          workOrder.rippotai_signature_url,
        ],
        [
          "Vendor Acknowledgement",
          "Signature & Stamp",
          workOrder.contractor_signatory_name,
          workOrder.contractor_signed_at,
          workOrder.contractor_signature_url,
        ],
      ].map(([title, role, name, signedAt, signature]) => (
        <div key={title}>
          <h2>{title}</h2>
          <div className="wo-signature-space">
            {signature && (
              <img
                src={signature}
                alt={`${title} signature`}
                crossOrigin="anonymous"
              />
            )}
          </div>
          <div className="wo-signatory">
            <p>{role}</p>
            <p>Name · {name || "____________________"}</p>
            <p>
              Date · {signedAt ? formatDate(signedAt) : "____________________"}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
export default function WorkOrderDocument({ workOrder }) {
  const measureRef = useRef(null);
  const [layout, setLayout] = useState({
    blocks: null,
    pages: [],
  });
  const items = useMemo(() => sortRows(getItems(workOrder)), [workOrder]);
  const stages = useMemo(
    () => sortRows(getPaymentStages(workOrder)),
    [workOrder],
  );
  const terms = useMemo(() => sortRows(getTerms(workOrder)), [workOrder]);
  const blocks = useMemo(() => {
    const subtotal = Number(
      workOrder.subtotal ??
        items.reduce(
          (sum, item) =>
            sum +
            Number(
              item.amount ??
                item.total ??
                Number(item.quantity || 0) * Number(item.rate || 0),
            ),
          0,
        ),
    );
    const discount = Number(workOrder.discount || 0),
      gst = Number(workOrder.gst_amount || 0),
      cartage = Number(workOrder.cartage || 0);
    const total = Number(
      workOrder.total_amount ??
        workOrder.grand_total ??
        workOrder.totalAmount ??
        workOrder.net_amount ??
        subtotal - discount + gst + cartage,
    );
    const result = [
      {
        key: "parties",
        node: <Parties workOrder={workOrder} />,
      },
      {
        key: "spacer",
        node: <div className="wo-schedule-spacer" />,
        keepWithNext: true,
      },
      {
        key: "item-heading",
        type: "item-heading",
        node: <ItemHeading />,
        keepWithNext: true,
      },
      ...Array.from(
        {
          length: Math.max(10, items.length),
        },
        (_, index) => ({
          key: `item-${index}`,
          type: "item",
          node: <ItemRow item={items[index]} index={index} />,
        }),
      ),
      {
        key: "totals",
        node: (
          <div className="wo-totals">
            {[
              ["Sub total", subtotal],
              ["Discount", discount],
              [`GST (${Number(workOrder.gst_percentage || 0)}%)`, gst],
              ["Cartage", cartage],
              ["Total", total],
            ].map(([label, value], index) => (
              <div key={label} className={index === 4 ? "wo-grand-total" : ""}>
                <span>{label}</span>
                <span>{currency(value)}</span>
              </div>
            ))}
          </div>
        ),
      },
      {
        key: "payment-heading",
        type: "payment-heading",
        node: <PaymentHeading />,
        keepWithNext: true,
      },
      ...Array.from(
        {
          length: Math.max(4, stages.length),
        },
        (_, index) => ({
          key: `payment-${index}`,
          type: "payment",
          node: <PaymentRow stage={stages[index]} />,
        }),
      ),
    ];
    if (workOrder.payment_terms)
      result.push({
        key: "payment-note",
        node: <p className="wo-payment-note">{workOrder.payment_terms}</p>,
      });
    result.push({
      key: "terms-heading",
      node: <h2 className="wo-terms-heading">Terms &amp; Condition</h2>,
      keepWithNext: true,
    });
    if (!terms.length)
      result.push({
        key: "no-terms",
        node: (
          <p className="wo-no-terms">
            No terms and conditions have been specified.
          </p>
        ),
      });
    terms.forEach((term, index) =>
      result.push({
        key: `term-${index}`,
        node: (
          <div className="wo-term">
            <span>{index + 1}.</span>
            <div>
              {(term.title || term.name) && (
                <strong>{term.title || term.name}</strong>
              )}
              <div
                className="wo-term-content"
                dangerouslySetInnerHTML={{
                  __html: termHtml(
                    term.description || term.terms_template?.content_html || "",
                  ),
                }}
              />
            </div>
          </div>
        ),
      }),
    );
    if (workOrder.notes)
      result.push({
        key: "notes",
        node: (
          <div className="wo-notes">
            <h2>Notes</h2>
            <p>{workOrder.notes}</p>
          </div>
        ),
      });
    result.push({
      key: "signatures",
      node: <Signatures workOrder={workOrder} />,
    });
    return result;
  }, [workOrder, items, stages, terms]);
  useEffect(() => {
    let cancelled = false;
    async function paginate() {
      await document.fonts.ready;
      const container = measureRef.current;
      if (!container || cancelled) return;
      await Promise.all(
        Array.from(container.querySelectorAll("img")).map((img) =>
          img.decode().catch(() => {}),
        ),
      );
      if (cancelled) return;
      // Measure the actual rendered header and rows at the A4 document width.
      const headerHeight = Math.ceil(
        container.querySelector(".wo-header").getBoundingClientRect().height,
      );
      const available = PAGE_HEIGHT - PAGE_INSET * 2 - 2 - headerHeight;
      const elements = Array.from(
        container.querySelector(".wo-measure-blocks").children,
      );
      const heights = elements.map((element) =>
        Math.ceil(element.getBoundingClientRect().height),
      );
      const headingFor = (type) =>
        type === "item"
          ? blocks.find((block) => block.type === "item-heading")
          : type === "payment"
            ? blocks.find((block) => block.type === "payment-heading")
            : null;
      const next = [];
      let page = [],
        height = 0;
      blocks.forEach((block, index) => {
        let required = heights[index];
        if (block.keepWithNext) {
          let nextIndex = index;
          while (
            blocks[nextIndex]?.keepWithNext &&
            heights[nextIndex + 1] != null
          ) {
            required += heights[++nextIndex];
          }
        }
        if (page.length && height + required > available) {
          next.push(page);
          page = [];
          height = 0;
          const heading = headingFor(block.type);
          if (heading) {
            page.push(heading);
            height += heights[blocks.indexOf(heading)];
          }
        }
        page.push(block);
        height += heights[index];
      });
      if (page.length) next.push(page);
      setLayout({
        blocks,
        pages: next,
      });
    }
    paginate();
    return () => {
      cancelled = true;
    };
  }, [blocks]);
  const ready = layout.blocks === blocks;
  return (
    <div className="work-order-document" data-ready={ready}>
      <div className="wo-preview-scroll">
        <div className="wo-pages">
          {!ready && (
            <p className="wo-loading" role="status">
              Preparing work order document…
            </p>
          )}
          {ready &&
            layout.pages.map((page, index) => (
              <section
                className="wo-page"
                key={index}
                aria-label={`Work order page ${index + 1}`}
              >
                <div className="wo-sheet">
                  <Header
                    workOrder={workOrder}
                    pageNumber={index + 1}
                    totalPages={layout.pages.length}
                  />
                  {page.map((block) => (
                    <div key={block.key} className="wo-block">
                      {block.node}
                    </div>
                  ))}
                </div>
              </section>
            ))}
        </div>
      </div>
      <div className="wo-measure" ref={measureRef} aria-hidden="true">
        <Header workOrder={workOrder} pageNumber={1} totalPages={2} />
        <div className="wo-measure-blocks">
          {blocks.map((block) => (
            <div className="wo-block" key={block.key}>
              {block.node}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
