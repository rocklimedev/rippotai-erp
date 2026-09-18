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
function termsBlocks(html) {
  const doc = new DOMParser().parseFromString(
    html ||
      "<p>No terms and conditions have been defined for this payment schedule.</p>",
    "text/html",
  );
  doc
    .querySelectorAll("script,style,iframe,object,embed,link,meta")
    .forEach((n) => n.remove());
  doc.querySelectorAll("*").forEach((n) =>
    Array.from(n.attributes).forEach((a) => {
      if (
        /^on/i.test(a.name) ||
        (/^(href|src)$/i.test(a.name) && /^\s*javascript:/i.test(a.value))
      )
        n.removeAttribute(a.name);
    }),
  );
  const blocks = [];
  let heading = "";
  Array.from(doc.body.childNodes).forEach((n) => {
    if (n.nodeType === Node.TEXT_NODE) {
      if (n.textContent.trim()) {
        const p = doc.createElement("p");
        p.textContent = n.textContent;
        blocks.push(p.outerHTML);
      }
      return;
    }
    if (/^H[1-6]$/.test(n.tagName)) {
      heading += n.outerHTML;
      return;
    }
    if (n.tagName === "OL" || n.tagName === "UL")
      Array.from(n.children).forEach((li, i) => {
        const list = n.cloneNode(false);
        const item = li.cloneNode(true);
        if (n.tagName === "OL") {
          const ordinal = Number(
            li.getAttribute("value") ||
              Number(n.getAttribute("start") || 1) + i,
          );
          list.setAttribute("start", ordinal);
          item.classList.add("ps-numbered-item");
          const label = doc.createElement("span");
          label.className = "ps-term-number";
          label.textContent = num(ordinal);
          label.setAttribute("aria-hidden", "true");
          item.prepend(label);
        }
        list.append(item);
        blocks.push(heading + list.outerHTML);
        heading = "";
      });
    else {
      blocks.push(heading + n.outerHTML);
      heading = "";
    }
  });
  if (heading) blocks.push(heading);
  return blocks.length
    ? blocks
    : [
        "<p>No terms and conditions have been defined for this payment schedule.</p>",
      ];
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
            key={i}
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
