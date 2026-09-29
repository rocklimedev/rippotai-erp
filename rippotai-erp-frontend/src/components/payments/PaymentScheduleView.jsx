import { useMemo, useRef, useState, useEffect } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { Download } from "lucide-react";
import logo from "../../assets/rippotai_logo.png";
import "./PaymentScheduleView.css";
const money = (value) =>
  value == null || value === ""
    ? "₹ __________"
    : new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
      }).format(Number(value) || 0);
const pct = (value) => `${Number(value) || 0}%`;
const num = (value) => String(value).padStart(2, "0");

function termsBlocks(content) {
  const fallback =
    "<p>No terms and conditions have been defined for this payment schedule.</p>";

  if (!content) {
    content = fallback;
  }

  // ------------------------------------------------------------
  // 1. Normalize escaped newlines
  // ------------------------------------------------------------
  let html = String(content)
    .replace(/\\r\\n/g, "\n")
    .replace(/\\n/g, "\n")
    .replace(/\r\n/g, "\n");

  // ------------------------------------------------------------
  // 2. If the content is Markdown/plain text, convert it to HTML
  // ------------------------------------------------------------
  const looksLikeMarkdown =
    /(^|\n)\s*#{1,6}\s+/.test(html) || /(^|\n)\s*[-*]\s+/.test(html);

  if (looksLikeMarkdown) {
    const lines = html.split("\n");
    const output = [];

    let paragraph = [];

    const flushParagraph = () => {
      if (!paragraph.length) return;

      const text = paragraph.join(" ").replace(/\s+/g, " ").trim();

      if (text) {
        output.push(`<p>${text}</p>`);
      }

      paragraph = [];
    };

    for (const rawLine of lines) {
      const line = rawLine.trim();

      // Empty line = end paragraph
      if (!line) {
        flushParagraph();
        continue;
      }

      // Markdown heading
      const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);

      if (headingMatch) {
        flushParagraph();

        const level = Math.min(6, headingMatch[1].length);
        const text = headingMatch[2].trim();

        output.push(`<h${level}>${text}</h${level}>`);
        continue;
      }

      // Markdown unordered list
      const listMatch = line.match(/^[-*]\s+(.+)$/);

      if (listMatch) {
        flushParagraph();

        output.push(`<ul><li>${listMatch[1].trim()}</li></ul>`);
        continue;
      }

      paragraph.push(line);
    }

    flushParagraph();

    html = output.join("\n");
  }

  // ------------------------------------------------------------
  // 3. Parse the resulting HTML
  // ------------------------------------------------------------
  const doc = new DOMParser().parseFromString(html, "text/html");

  // ------------------------------------------------------------
  // 4. Remove unsafe elements
  // ------------------------------------------------------------
  doc
    .querySelectorAll("script,style,iframe,object,embed,link,meta")
    .forEach((node) => node.remove());

  // ------------------------------------------------------------
  // 5. Remove unsafe attributes / javascript URLs
  // ------------------------------------------------------------
  doc.querySelectorAll("*").forEach((node) => {
    Array.from(node.attributes).forEach((attribute) => {
      if (
        /^on/i.test(attribute.name) ||
        (/^(href|src)$/i.test(attribute.name) &&
          /^\s*javascript:/i.test(attribute.value))
      ) {
        node.removeAttribute(attribute.name);
      }
    });
  });

  // ------------------------------------------------------------
  // 6. Split into individual blocks for PDF pagination
  // ------------------------------------------------------------
  const blocks = [];

  let pendingHeading = "";

  Array.from(doc.body.childNodes).forEach((node) => {
    // Text node
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent?.trim();

      if (text) {
        const p = doc.createElement("p");
        p.textContent = text;

        blocks.push(pendingHeading + p.outerHTML);

        pendingHeading = "";
      }

      return;
    }

    // Heading
    if (node.nodeType === Node.ELEMENT_NODE && /^H[1-6]$/.test(node.tagName)) {
      pendingHeading += node.outerHTML;
      return;
    }

    // Lists
    if (
      node.nodeType === Node.ELEMENT_NODE &&
      (node.tagName === "OL" || node.tagName === "UL")
    ) {
      blocks.push(pendingHeading + node.outerHTML);

      pendingHeading = "";
      return;
    }

    // Normal element
    if (node.nodeType === Node.ELEMENT_NODE) {
      blocks.push(pendingHeading + node.outerHTML);

      pendingHeading = "";
    }
  });

  if (pendingHeading) {
    blocks.push(pendingHeading);
  }

  return blocks.length ? blocks : [fallback];
}

function Page({ children, address, cover }) {
  return (
    <section className={`payment-page${cover ? " ps-cover" : ""}`}>
      <div className="ps-body">{children}</div>
      {!cover && (
        <footer>
          <span>Payment Schedule</span>
          <span>{address}</span>
        </footer>
      )}
    </section>
  );
}
export default function PaymentScheduleView({ schedule, className = "" }) {
  const documentRef = useRef(null),
    measureRef = useRef(null);
  const [layout, setLayout] = useState({
      groups: null,
      pages: [],
    }),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const project = schedule?.project || {};
  const architect = project.team_members?.find(
    (m) => m.role_label === "Principal Architect",
  )?.user?.name;
  const lead = project.team_members?.find(
    (m) => m.role_label === "Project Lead",
  )?.user?.name;
  const milestones = useMemo(
    () =>
      [...(schedule?.milestones || [])].sort(
        (a, b) =>
          Number(a.milestoneNumber || 0) - Number(b.milestoneNumber || 0),
      ),
    [schedule?.milestones],
  );
  const total = milestones.reduce(
    (sum, m) => sum + (Number(m.percentage) || 0),
    0,
  );
  const terms = useMemo(
    () => termsBlocks(schedule?.termsTemplate?.content_html),
    [schedule?.termsTemplate?.content_html],
  );
  const groups = useMemo(
    () => [
      [
        <div className="ps-stats" key="stats">
          <div>
            <strong>{num(milestones.length)}</strong>
            <p>Payment milestones from booking to handover</p>
          </div>
          <div>
            <strong>{pct(total)}</strong>
            <p>Of contract value, exclusive of GST and variations</p>
          </div>
        </div>,
        <p className="ps-phase-heading" key="heading">
          Payment release — against phases
        </p>,
        ...milestones.map((m, i) => (
          <div className="ps-phase" key={i}>
            <span>M{m.milestoneNumber || i + 1}</span>
            <div className="ps-track">
              <div
                className={`ps-bar${i === milestones.length - 1 ? " ps-retention" : ""}`}
                style={{
                  width: `${Math.max(0, Math.min(100, (Number(m.percentage) || 0) * 2.5))}%`,
                }}
              />
              <span
                className="ps-bar-title"
                style={{
                  width:
                    i === milestones.length - 1
                      ? undefined
                      : `${Math.max(0, Math.min(100, (Number(m.percentage) || 0) * 2.5))}%`,
                  minWidth: "max-content",
                  textAlign: "center",
                }}
              >
                {m.title || "Untitled milestone"}
              </span>
            </div>
            <span>{pct(m.percentage)}</span>
          </div>
        )),
        <div className="ps-handover" key="handover">
          On handover
        </div>,
      ],
      [
        <div key="heading">
          <h2>Milestone detail</h2>
          <div className="ps-table-head ps-grid">
            <span />
            <span>Milestone</span>
            <span>Coverage &amp; release trigger</span>
            <span>Share</span>
          </div>
        </div>,
        ...milestones.map((m, i) => (
          <div className="ps-row ps-grid" key={i}>
            <span className="ps-number">{num(m.milestoneNumber || i + 1)}</span>
            <h3>{m.title || "Untitled milestone"}</h3>
            <div className="ps-coverage">
              <p>{m.description || "No description provided."}</p>
              {m.releaseTrigger && (
                <p className="ps-trigger">{m.releaseTrigger}</p>
              )}
              {m.dueDate && (
                <p className="ps-trigger">
                  Due {new Date(m.dueDate).toLocaleDateString("en-IN")}
                </p>
              )}
            </div>
            <span className="ps-share">{pct(m.percentage)}</span>
          </div>
        )),
        <div key="summary">
          <div className="ps-total">
            <span>Total contract value</span>
            <strong>{pct(total)}</strong>
          </div>
          <div className="ps-financials">
            <div>
              <small>Contract value</small>
              <p>{money(schedule?.totalContractValue)}</p>
            </div>
            <div>
              <small>
                GST
                {schedule?.gstRate != null ? ` (${pct(schedule.gstRate)})` : ""}
              </small>
              <p>
                {schedule?.gstAmount != null
                  ? money(schedule.gstAmount)
                  : "Extra as applicable"}
              </p>
            </div>
            <div>
              <small>Total payable</small>
              <p>{money(schedule?.totalPayable)}</p>
            </div>
          </div>
        </div>,
      ],

      [
        <h2 className="ps-terms-heading" key="heading">
          Terms &amp; Conditions
        </h2>,

        ...terms.map((html, i) => (
          <div
            className="ps-term"
            key={`term-${i}`}
            dangerouslySetInnerHTML={{
              __html: html,
            }}
          />
        )),

        <div className="ps-acceptance" key="acceptance">
          <p>
            The Client confirms having read and accepted the milestones,
            percentages and terms set out in this schedule, which forms an
            integral part of the Plan of Action and the signed Agreement for
            this project.
          </p>

          <div className="ps-signatures">
            {[
              ["For Rippotai", "Authorised Signatory", architect],
              [
                "Accepted by the Client",
                "Client Signature",
                project.client?.name,
              ],
            ].map(([label, role, name]) => (
              <div key={label}>
                <h4>{label}</h4>

                <div className="ps-signature-line" />

                <p>{role}</p>

                <p>Name · {name || "________________"}</p>

                <p>Date · ________________</p>
              </div>
            ))}
          </div>
        </div>,
      ],
    ],
    [milestones, total, terms, schedule, architect, project.client?.name],
  );
  const pages = layout.pages;
  const ready = layout.groups === groups;
  useEffect(() => {
    let cancelled = false;
    document.fonts.ready.then(() => {
      if (cancelled || !measureRef.current) return;
      const next = [];
      Array.from(measureRef.current.children).forEach((group, g) => {
        let page = [],
          height = 0;
        Array.from(group.children).forEach((block, i) => {
          const h = Math.ceil(block.getBoundingClientRect().height);
          if (page.length && height + h > 950) {
            next.push(page);
            page = [];
            height = 0;
          }
          page.push(groups[g][i]);
          height += h;
        });
        if (page.length) next.push(page);
      });
      setLayout({
        groups,
        pages: next,
      });
    });
    return () => {
      cancelled = true;
    };
  }, [groups]);
  async function download() {
    if (!ready || busy || !documentRef.current) return;
    setBusy(true);
    setError("");
    try {
      await document.fonts.ready;
      await Promise.all(
        Array.from(documentRef.current.querySelectorAll("img")).map((img) =>
          img.decode(),
        ),
      );
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
        compress: true,
      });
      const elements = documentRef.current.querySelectorAll(".payment-page");
      for (let i = 0; i < elements.length; i++) {
        const canvas = await html2canvas(elements[i], {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: "#ffffff",
          windowWidth: 1280,
          onclone: (doc) => {
            doc.querySelectorAll(".payment-page").forEach((p) => {
              p.style.boxShadow = "none";
            });
            // Expanded ligatures otherwise cause html2canvas text range errors.
            const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT);
            while (walker.nextNode()) {
              const node = walker.currentNode;
              node.textContent = node.textContent.replace(
                /[\uFB00-\uFB06]/g,
                (char) => char.normalize("NFKC"),
              );
            }
          },
        });
        if (i) pdf.addPage();
        const height = (canvas.height * 210) / canvas.width;
        // An unusually long block can expand its page; preserve it instead of clipping it.
        pdf.addImage(
          canvas.toDataURL("image/jpeg", 0.98),
          "JPEG",
          0,
          0,
          210,
          Math.min(297, height),
          undefined,
          "FAST",
        );
      }
      const name = (project.name || "Project")
        .replace(/[<>:"/\\|?*]+/g, "")
        .replace(/\s+/g, "_");
      pdf.save(
        `Payment_Schedule_${name}_${String(schedule?.id || "draft").slice(0, 8)}.pdf`,
      );
    } catch (err) {
      console.error("Payment schedule PDF export failed", err);
      setError("Unable to download the PDF. Please try again.");
    } finally {
      setBusy(false);
    }
  }
  if (!schedule)
    return <div className="ps-empty">No payment schedule selected</div>;
  return (
    <div className={`payment-schedule-root ${className}`}>
      <div className="ps-toolbar">
        <div>
          <h1>Payment Schedule</h1>
          <p>{project.name || "Untitled Project"}</p>
        </div>
        <button type="button" disabled={!ready || busy} onClick={download}>
          <Download size={16} />
          {busy ? "Generating PDF…" : "Download PDF"}
        </button>
      </div>
      {error && (
        <p role="alert" className="ps-error">
          {error}
        </p>
      )}

      <div className="ps-scroll">
        <div className="ps-document" ref={documentRef}>
          <Page cover>
            <div className="ps-brand">
              <img src={logo} alt="Rippotai" />
              <h1>RIPPŌTAI</h1>
              <p>Payment Schedule</p>
            </div>
            <div className="ps-details">
              <div className="ps-project">
                <small>Project: </small>
                {project.name || "Untitled Project"}
              </div>
              <div className="ps-project-grid">
                {[
                  ["Address", project.site_location],
                  ["Client", project.client?.name],
                  ["Principal Architect", architect],
                  ["Project Lead", lead],
                ].map(([label, value]) => (
                  <div key={label}>
                    <small>{label}: </small>
                    {value || ""}
                  </div>
                ))}
              </div>
            </div>
          </Page>
          {pages.map((blocks, i) => (
            <Page key={i} address={project.site_location}>
              {blocks}
            </Page>
          ))}
        </div>
      </div>

      <div ref={measureRef} className="ps-measure" aria-hidden="true">
        {groups.map((blocks, g) => (
          <div key={g}>
            {blocks.map((block, i) => (
              <div className="ps-measure-block" key={i}>
                {block}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
