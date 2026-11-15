// Business Proposal — replica of the original BUSINESS PROPOSAL TEMPLATE (.pptx / .pdf): 13 portrait
// pages of 540 × 960 pt in the template's order (cover, welcome, project snapshot, how we work,
// our plan, spaces, timeline, scope, "The Proposal", fees, how you pay, next steps, closing).
// Coordinates are PDF points read off the template PDF; artwork is the template's own media.
import { forwardRef, useMemo } from "react";
import "@fontsource/lato/100.css";
import "@fontsource/lato/300.css";
import "@fontsource/lato/400.css";
import "@fontsource/lato/700.css";
import "../../template-documents/sheet.css";
import "./deck.css";
import { useCompanyProfile } from "@/components/print-document/commerce";
import { proposalDeckModel, inr, PRINCIPAL } from "./deckModel";
import coverArt from "@/assets/proposal-template/cover-art.jpg";
import logo from "@/assets/proposal-template/logo.png";
import welcomeIso from "@/assets/proposal-template/welcome-isometric.png";
import gatesStreet from "@/assets/proposal-template/gates-street.png";
import buildingFloors from "@/assets/proposal-template/building-floors.png";
import divider from "@/assets/proposal-template/proposal-divider.png";
import door from "@/assets/proposal-template/door.png";
import buildingClosing from "@/assets/proposal-template/building-closing.png";
import iPerson from "@/assets/proposal-template/icon-person.png";
import iPen from "@/assets/proposal-template/icon-pen.png";
import iCheck from "@/assets/proposal-template/icon-check.png";
import iWrench from "@/assets/proposal-template/icon-wrench.png";
import iTruck from "@/assets/proposal-template/icon-truck.png";
import iArrow from "@/assets/proposal-template/icon-arrow.png";
import iHouse from "@/assets/proposal-template/icon-house.png";
import iPhone from "@/assets/proposal-template/icon-phone.png";
import iMail from "@/assets/proposal-template/icon-mail.png";
import iWeb from "@/assets/proposal-template/icon-web.png";

const C = {
  cream: "#f6f4ef",
  green: "#123c34",
  green2: "#0d3d2f",
  gold: "#d9af61",
  line: "#d8d1c3",
  sand: "#eee5d4",
  ink: "#172926",
  title: "#0d3d2e",
  brand: "#123d33",
  sage: "#405c54",
  muted: "#5c6b66",
  pageNo: "#8c8780",
};

/* ------------------------------------------------------------ primitives (pt) */
const pt = (n) => `${n}pt`;
function T({ x, y, s, c = C.ink, w, lh, wt = 300, align, ls, style, children }) {
  return (
    <div
      className="bp-t"
      style={{
        left: pt(x),
        top: pt(y - 0.1 * s - (lh ? (lh - s) / 2 : 0)),
        fontSize: pt(s),
        color: c,
        fontWeight: wt,
        ...(w ? { width: pt(w), whiteSpace: "normal" } : {}),
        ...(lh ? { lineHeight: pt(lh) } : {}),
        ...(align ? { textAlign: align } : {}),
        ...(ls ? { letterSpacing: pt(ls) } : {}),
        ...style,
      }}
    >
      {children}
    </div>
  );
}
const Box = ({ x, y, w, h, fill = "transparent", stroke, sw = 0.7, style }) => (
  <div className="bp-box" style={{ left: pt(x), top: pt(y), width: pt(w), height: pt(h), background: fill, border: stroke ? `${sw}pt solid ${stroke}` : "none", ...style }} />
);
const Img = ({ src, x, y, w, h, style }) => (
  <img className="bp-img" src={src} alt="" style={{ left: pt(x), top: pt(y), width: pt(w), height: pt(h), ...style }} />
);
const HLine = ({ x1, x2, y, c = C.line, sw = 0.6 }) => (
  <div className="bp-box" style={{ left: pt(x1), top: pt(y - sw / 2), width: pt(x2 - x1), height: pt(sw), background: c }} />
);

function Page({ n, bg = C.cream, header = true, children }) {
  return (
    <div className="pd-page bp-page" style={{ background: bg }}>
      {header && (
        <>
          <T x={30.2} y={25.3} s={9} c={C.brand}>
            RIPPŌTAI
          </T>
          <HLine x1={79.4} x2={540} y={29.5} />
          <T x={460} y={922.3} s={7} c={C.pageNo} w={51.1} align="right">
            {String(n).padStart(2, "0")}
          </T>
        </>
      )}
      {children}
    </div>
  );
}
const Eyebrow = ({ children, s = 8, y = 68.1 }) => (
  <T x={30.2} y={y} s={s} c={C.sage} ls={0.4}>
    {children}
  </T>
);
const Title = ({ children, c = C.ink, s = 28, y = 103 }) => (
  <T x={30.2} y={y} s={s} c={c} w={480} lh={s * 1.15}>
    {children}
  </T>
);
const Sub = ({ children, y = 154.2, s = 12, c = C.muted, w = 480 }) => (
  <T x={30.2} y={y} s={s} c={c} w={w} lh={s * 1.16}>
    {children}
  </T>
);
const IconCard = ({ x, y, w, h, icon, iconSize, ix, iy, tx, title, sub, ty, subGap = 23.2, fill = "#fff", stroke = C.line, tc = C.ink, sc = C.muted, ts = 12, ss = 10 }) => (
  <>
    <Box x={x} y={y} w={w} h={h} fill={fill} stroke={stroke} />
    {icon && <Img src={icon} x={ix} y={iy} w={iconSize} h={iconSize} />}
    <T x={tx} y={ty} s={ts} c={tc} w={x + w - tx - 8}>
      {title}
    </T>
    {sub ? (
      <T x={tx} y={ty + subGap} s={ss} c={sc} w={x + w - tx - 8}>
        {sub}
      </T>
    ) : null}
  </>
);

/** Fit a list of n rows into [top, bottom]: returns the pitch (never above `max`). */
const pitch = (n, top, bottom, max) => Math.min(max, n > 1 ? (bottom - top) / (n - 1) : max);

/* ------------------------------------------------------------ pages */

function Cover({ m }) {
  return (
    <Page n={1} header={false} bg={C.green}>
      <Img src={coverArt} x={0} y={0} w={540} h={597.6} />
      <T x={30.2} y={666.4} s={34} c="#fff">
        BUSINESS
      </T>
      <T x={30.2} y={706.2} s={34} c="#fff">
        PROPOSAL
      </T>
      <HLine x1={30.2} x2={122.4} y={781.9} c={C.gold} sw={1.8} />
      <T x={30.2} y={812.1} s={15} c="#fff" w={480}>
        {m.projectName.toUpperCase()}
      </T>
      <T x={30.2} y={848.8} s={9} c="#d6e0d9" w={480}>
        {(m.site || "ADDRESS").toUpperCase()}
      </T>
      <T x={30.2} y={860.8} s={9} c="#d6e0d9" w={480}>
        {(m.clientName || "CLIENT").toUpperCase()}
      </T>
    </Page>
  );
}

function Welcome({ m }) {
  return (
    <Page n={2}>
      <Eyebrow>01 WELCOME NOTE</Eyebrow>
      <T x={28.8} y={100.7} s={27} c={C.title} w={300} lh={32.05}>
        {m.headline}
      </T>
      <Img src={welcomeIso} x={85.2} y={197.3} w={369.6} h={277.2} />
      <Box x={30.2} y={524.2} w={479.5} h={237.6} fill="#fff" stroke={C.line} />
      <T x={56.2} y={563.1} s={14} c={C.ink} w={430} lh={17.7}>
        Thank you{m.clientName ? ", " : " "}
        {m.clientName ? <b style={{ fontWeight: 700 }}>{m.clientName}</b> : null}
        {m.clientName ? ", " : ""}for trusting Rippotai. {m.welcome}
      </T>
      <HLine x1={30.2} x2={509.8} y={694.1} />
      <T x={56.2} y={717.1} s={14} c={C.brand}>
        {m.signer.name}
      </T>
      <T x={56.2} y={740.3} s={8} c={C.sage} ls={0.3}>
        {`${(m.signer.role || PRINCIPAL.role).toUpperCase()} · RIPPOTAI`}
      </T>
    </Page>
  );
}

function Snapshot({ m }) {
  const xs = [30.2, 195.1, 360];
  return (
    <Page n={3}>
      <Eyebrow>02 PROJECT DETAILS</Eyebrow>
      <Title>Project Snapshot.</Title>
      <Sub>The fixed facts we are designing and sequencing around.</Sub>
      {m.stats.map((st, i) => (
        <div key={i}>
          <Box x={xs[i]} y={193} w={149.8} h={118.1} fill="#fff" stroke={C.line} />
          <T x={xs[i]} y={214} s={30} c={st.value === "" ? "#d9d9d9" : C.title} w={149.8} align="center">
            {st.value === "" ? "—" : st.value}
          </T>
          <T x={xs[i]} y={240.7} s={11} c={C.muted} w={149.8} align="center">
            {st.label}
          </T>
          <T x={xs[i] + 10} y={267.1} s={11} c={C.muted} w={129.8} align="center" lh={13}>
            {st.detail}
          </T>
        </div>
      ))}
      <Box x={30.2} y={342.7} w={479.5} h={270.7} fill="#fff" stroke={C.line} />
      {m.facts.map(([label, value], i) => (
        <div key={label}>
          <T x={53.3} y={368.8 + 43.2 * i} s={8} c={C.title} ls={0.3}>
            {label}
          </T>
          <T x={173.5} y={367.4 + 43.2 * i} s={11} c={C.ink} wt={100} w={320} lh={13}>
            {value}
          </T>
        </div>
      ))}
      <Box x={30.2} y={649.4} w={479.5} h={149.8} fill={C.sand} stroke={C.line} />
      <T x={54.8} y={673.8} s={13} c={C.brand}>
        Neighbouring context
      </T>
      <T x={53.9} y={705.3} s={12} c="#5a5a5a" wt={100} w={430} lh={15.1}>
        {m.context}
      </T>
    </Page>
  );
}

const PRINCIPLES = [
  [iPerson, "One Point Of Contact", "Your Project Lead, start to finish"],
  [iPen, "Nothing Hidden In BOQ", "Every item priced line by line"],
  [iCheck, "Sign-off Before Spend", "Nothing ordered without approval"],
  [iWrench, "Stage-wise Progress", "Each gate reviewed before the next"],
];
const GATES = ["Brief", "Concept", "BOQ Freeze", "GFC Drawings", "Execution", "Handover"];

function HowWeWork() {
  return (
    <Page n={4}>
      <Eyebrow>03 HOW WE WORK</Eyebrow>
      <Title>Clear gates. Clean approvals.</Title>
      <Sub>Four principles and six sign-off steps before site decisions become spend.</Sub>
      {PRINCIPLES.map(([icon, t, s], i) => (
        <IconCard key={t} x={30.2} y={195.8 + 70.6 * i} w={479.5} h={59} icon={icon} iconSize={24.5} ix={43.2} iy={208.8 + 70.6 * i} tx={77.8} ty={209.9 + 70.6 * i} title={t} sub={s} />
      ))}
      <T x={30.3} y={503.2} s={8} c={C.sage} ls={0.4}>
        PROCESS GATES
      </T>
      {GATES.map((g, i) => {
        const x = i % 2 ? 277.2 : 30.2;
        const y = 534.2 + 85 * Math.floor(i / 2);
        const on = i === 2;
        return (
          <div key={g}>
            <Box x={x} y={y} w={229} h={59} fill={on ? C.green : "#fff"} stroke={on ? C.green : C.line} />
            <T x={x + 22.1} y={y + 20.8} s={16} c={on ? C.gold : C.brand}>
              {i + 1}
            </T>
            <T x={x + 50.5} y={y + 22} s={12} c={on ? "#fff" : C.ink}>
              {g}
            </T>
          </div>
        );
      })}
      <Img src={gatesStreet} x={52.2} y={740.2} w={432} h={288} />
      <T x={0} y={779.9} s={9} c="#5e7d73" w={540} align="center" ls={2.2}>
        YOU SIGN OFF AT EVERY GATE
      </T>
    </Page>
  );
}

const SERVICES = [
  [iPen, "Architecture & Interior Design", "Full drawing set, GFC-ready"],
  [iTruck, "Material Procurement", "Civil, interior and finish items sourced by us"],
  [iWrench, "Execution & Site Management", "Single point of accountability at site"],
  [iCheck, "Handover With Warranty Cover", "As-built drawings, certificates, 12-month cover"],
];

function OurPlan({ m }) {
  const paras = m.why;
  const tops = paras.reduce((acc, p, i) => [...acc, i ? acc[i - 1] + Math.ceil(String(paras[i - 1]).length / 78) * 13.2 + 12.7 : 569.4], []);
  return (
    <Page n={5}>
      <Eyebrow s={10} y={67.5}>
        04 OUR PLAN
      </Eyebrow>
      <Title>Turnkey Execution.</Title>
      <Sub y={147.3} w={250} c={C.muted}>
        One team, one BOQ, one accountable delivery from first drawing to move-in.
      </Sub>
      {SERVICES.map(([icon, t, s], i) => (
        <IconCard key={t} x={30.2} y={181.4 + 75.6 * i} w={479.5} h={64.8} icon={icon} iconSize={27.4} ix={43.2} iy={194.4 + 75.6 * i} tx={80.7} ty={195.5 + 75.6 * i} title={t} sub={s} />
      ))}
      <Box x={30.2} y={504} w={479.5} h={234} fill={C.green} />
      <T x={53.3} y={529.5} s={14} c={C.gold} wt={700}>
        WHY THIS FITS YOU
      </T>
      {paras.map((p, i) => (
        <T key={i} x={53.3} y={tops[i]} s={12} c="#ebf2ed" w={440} lh={13.2}>
          {p}
        </T>
      ))}
    </Page>
  );
}

function Spaces({ m }) {
  const list = m.spaces.slice(0, 12);
  const step = pitch(list.length, 244.5, 535.2, 48);
  return (
    <Page n={6} bg="#f6f2ee">
      <Title c={C.title}>{m.spacesTitle}</Title>
      <T x={30.2} y={153.6} s={14} c="#5e7d73" w={480} lh={16}>
        {m.spacesSub}
      </T>
      <Img src={buildingFloors} x={-13.9} y={210.3} w={297.1} h={371.2} />
      {list.map((sp, i) => {
        const y = 244.5 + step * i;
        return (
          <div key={sp.name}>
            <HLine x1={243.9} x2={265.5} y={y + 4.7} c={C.gold} sw={1} />
            <T x={278.4} y={y} s={11} c={C.title} wt={700}>
              {String(sp.name).toUpperCase()}
            </T>
            <T x={278.4} y={y + 13.4} s={8} c="#2e302e" w={225} lh={12}>
              {sp.detail}
            </T>
          </div>
        );
      })}
      {m.spaces.length > list.length && (
        <T x={278.4} y={560} s={8} c={C.sage}>
          + {m.spaces.length - list.length} more spaces in the scope of work
        </T>
      )}
    </Page>
  );
}

function Timeline({ m }) {
  const ys = [183.6, 338.4, 493.2];
  return (
    <Page n={7}>
      <Eyebrow s={10} y={67.5}>
        PROPOSED TIMELINES
      </Eyebrow>
      <Title>{m.rangeTitle}</Title>
      <Sub y={146.8} w={440}>
        {m.rangeSub}
      </Sub>
      {m.timeline.map((t, i) => {
        const y = ys[i];
        const on = i === 1;
        return (
          <div key={t.title}>
            <Box x={30.2} y={y} w={479.5} h={131} fill={on ? C.green : "#fff"} stroke={on ? C.green : C.line} />
            <T x={62.9} y={y + 27.6} s={18} c={on ? C.gold : C.brand}>
              {String(i + 1).padStart(2, "0")}
            </T>
            <T x={108} y={y + 23.1} s={14} c={on ? "#fff" : C.ink}>
              {t.title}
            </T>
            <T x={108} y={y + 56.6} s={11} c={on ? "#dde8e3" : C.sage}>
              {t.duration}
              {t.note ? <span style={{ fontSize: "12pt", color: C.muted }}>&nbsp;&nbsp;{t.note}</span> : null}
            </T>
            <T x={108} y={y + 83} s={11} c={on ? "#ebf2ed" : C.muted} w={380} lh={13}>
              {t.detail || (t.duration ? "" : "Not part of this plan of action")}
            </T>
            {i < 2 && <Img src={iArrow} x={267.1} y={i ? 472.1 : 317.5} w={18.7} h={18.7} style={{ transform: "rotate(90deg)" }} />}
          </div>
        );
      })}
      <Box x={30.2} y={684} w={479.5} h={123.8} fill={C.sand} stroke={C.line} />
      <T x={54.8} y={711.5} s={8} c={C.sage} ls={0.3}>
        DESIRED START
      </T>
      <T x={285.9} y={711.5} s={8} c={C.sage} ls={0.3}>
        OVERALL EXECUTION
      </T>
      <T x={54.8} y={739.2} s={15} c={C.brand}>
        {m.desiredStart}
      </T>
      <T x={285.9} y={739.2} s={15} c={C.brand}>
        {m.overall}
      </T>
    </Page>
  );
}

const SCOPE_SERVICES = [
  [iPen, "Architecture Design"],
  [iHouse, "Interior Design"],
  [iTruck, "Material Procurement"],
  [iWrench, "Execution"],
];

function Scope({ m }) {
  const inc = m.included.slice(0, 11);
  const exc = m.exclusions.slice(0, 7);
  const incStep = Math.min(14.3, 150 / Math.max(inc.length, 1));
  return (
    <Page n={8}>
      <Eyebrow>05 SCOPE OF WORK</Eyebrow>
      <Title>Services Confirmed In Your Brief.</Title>
      <Sub>A summary view of what sits inside this proposal and what will be handled separately.</Sub>
      {SCOPE_SERVICES.map(([icon, t], i) => {
        const x = i % 2 ? 277.2 : 30.2;
        const y = 195.8 + 75.6 * Math.floor(i / 2);
        return <IconCard key={t} x={x} y={y} w={229} h={56.2} icon={icon} iconSize={25.9} ix={x + 14.4} iy={y + 13} tx={x + 51.9} ty={y + 19.7} title={t} ts={11} />;
      })}
      <Box x={30.2} y={381.6} w={479.5} h={194.4} fill="#fff" stroke={C.line} />
      <T x={53.3} y={405.3} s={8} c={C.sage} ls={0.3}>
        INCLUDED
      </T>
      {inc.map((t, i) => (
        <T key={i} x={57.6} y={437.4 + incStep * i} s={inc.length > 9 ? 10 : 12} c={C.ink}>
          • {t}
        </T>
      ))}
      <Box x={30.2} y={601.2} w={479.5} h={128.2} fill={C.sand} stroke={C.line} />
      <T x={53.3} y={624.2} s={8} c={C.sage} ls={0.3}>
        NOT IN THIS SCOPE
      </T>
      {exc.map((t, i) => (
        <T key={i} x={57.6} y={654 + 14 * i} s={11} c={C.ink} w={440}>
          • {t}
        </T>
      ))}
    </Page>
  );
}

function Divider() {
  return (
    <Page n={9} header={false} bg={C.green2}>
      <T x={61.2} y={228.9} s={48} c="#fff">
        The Proposal
      </T>
      <HLine x1={57.6} x2={244.8} y={288} c={C.gold} sw={2.25} />
      <Img src={divider} x={54} y={823.2} w={432} h={100.8} />
    </Page>
  );
}

const FEE_COVERS = [
  ["Design, All Floors", "Architecture and interiors, concept to final drawings"],
  ["Services Planning", "Structure, electrical, plumbing and air conditioning"],
  ["Sourcing And Vendors", "Material selection, rates compared, orders managed"],
  ["Supervisor On Site", "Full time, every working day of the build"],
];

function Fees({ m }) {
  const f = m.fee;
  const pct = f.pct !== null ? String(f.pct) : "X";
  const good = [
    "Society approvals, NOCs, furniture and artefacts sit outside this fee.",
    `Work you add later is charged at the same ${pct}%. Anything we get wrong. we fix at our cost.`,
    "If the site stops for more than 45 days for reasons outside our control, monthly payments pause and the schedule moves by the same period.",
  ];
  return (
    <Page n={10} bg="#fff">
      <Eyebrow>OUR FEES</Eyebrow>
      <T x={30.2} y={103.7} s={25} c="#0d3b33" w={480} lh={34.1}>
        One Fee. Open Books
        <br />
        Underneath It.
      </T>
      <T x={30.2} y={178.1} s={10} c="#000" w={390} lh={16.1}>
        Everything we buy for your home — material, labour, vendors — is passed to you at what it costs us, priced line by line. What we earn is the single number below.
      </T>
      <Box x={30.2} y={264.9} w={472.8} h={146.4} fill="#0e3b32" />
      <T x={57.6} y={282.3} s={7} c="#c9a34f" ls={1.4}>
        PROFESSIONAL FEE
      </T>
      <T x={57.6} y={300.8} s={35} c="#fff">
        {pct}
        <span style={{ fontSize: "19pt" }}>% of the final project cost</span>
      </T>
      <HLine x1={57.6} x2={475} y={345.5} c="rgba(255,255,255,0.35)" sw={0.5} />
      <T x={57.6} y={355.3} s={6} c="#9cb0ab" ls={1.2}>
        HOW IT IS CALCULATED
      </T>
      <T x={284.4} y={355.3} s={6} c="#9cb0ab" ls={1.2}>
        WHAT SITS ON TOP
      </T>
      <T x={57.6} y={367.8} s={9} c="#fff" w={150} lh={13.9}>
        On the cost of work actually carried out, not on the estimate
      </T>
      <T x={284.4} y={367.8} s={9} c="#fff" w={160} lh={13.9}>
        {`GST at ${f.gstPct}%, charged over the fee. TDS deducted by you as usual.`}
      </T>
      {(f.amount > 0 || f.budgetTotal > 0) && (
        <T x={30.2} y={424} s={8} c={C.sage} w={472}>
          {[
            f.amount > 0 ? `Professional fee on the budget estimate: ${inr(f.amount)} + GST` : "",
            f.budgetTotal > 0 ? `Budget estimate${f.budgetNo ? ` ${f.budgetNo}` : ""}: ${inr(f.budgetTotal)} including GST` : "",
          ]
            .filter(Boolean)
            .join("   ·   ")}
        </T>
      )}
      <T x={30.2} y={472.1} s={7} c="#000" wt={700} ls={1.2}>
        WHAT THE FEE COVERS
      </T>
      {FEE_COVERS.map(([t, s], i) => {
        const x = i % 2 ? 269.6 : 30.2;
        const y = 487.8 + 48 * Math.floor(i / 2);
        return (
          <div key={t}>
            <Box x={x} y={y} w={233.4} h={42} stroke="#d8d4c8" sw={0.75} />
            <T x={x + 11.4} y={y + 11} s={8.8} c="#0d3b33">
              {t}
            </T>
            <T x={x + 11.4} y={y + 23.1} s={8} c="#000">
              {s}
            </T>
          </div>
        );
      })}
      <Box x={33.6} y={717.6} w={472.8} h={146.4} fill="#eae5d8" />
      <T x={49.2} y={763} s={6} c="#6e6b66" ls={1.2}>
        GOOD TO KNOW
      </T>
      {good.map((g, i) => (
        <div key={i}>
          <div className="bp-box" style={{ left: pt(50), top: pt(779.6 + 15 * i), width: pt(3), height: pt(3), borderRadius: "50%", background: C.gold }} />
          <T x={58.2} y={777.3 + 15 * i} s={8} c="#2b2b29" w={432} lh={11}>
            {g}
          </T>
        </div>
      ))}
    </Page>
  );
}

const MONTHLY = [
  ["On signing", ""],
  ["Design and drawings", "four equal monthly payments"],
  ["Construction", "twenty-three equal monthly payments"],
];

function HowYouPay({ m }) {
  const rows = m.milestones.slice(0, 9);
  const step = pitch(rows.length, 358.3, 460.3, 20.4);
  return (
    <Page n={11}>
      <Eyebrow s={10} y={67.5}>
        OUR FEES
      </Eyebrow>
      <T x={30.2} y={103.7} s={25} c={C.title}>
        HOW YOU PAY — CHOOSE EITHER
      </T>
      <T x={30} y={134.6} s={12} c="#0d0d0d">
        Both come to the same total. Pick whichever suits you at signing.
      </T>
      {[30, 277.8].map((x) => (
        <Box key={x} x={x} y={244.3} w={232.2} h={270.6} fill="#fff" stroke="#d8d4c8" sw={0.75} />
      ))}
      <T x={43.8} y={257} s={6.9} c={C.gold} ls={1}>
        OPTION A
      </T>
      <T x={291.6} y={257} s={6.9} c={C.gold} ls={1}>
        OPTION B
      </T>
      <T x={43.8} y={275.3} s={17.6} c={C.title}>
        Pay By Stage
      </T>
      <T x={291.6} y={275.3} s={17.6} c={C.title}>
        Pay Monthly
      </T>
      <T x={43.8} y={322} s={8} c="#0d0d0d" w={208}>
        You pay as each part of the work is finished and signed off.
      </T>
      {m.schedule && m.schedule.payable > 0 && (
        <T x={43.8} y={336} s={6.5} c={C.sage} w={208}>
          {`${inr(m.schedule.contract)} + GST ${m.schedule.gstRate}% = ${inr(m.schedule.payable)}`}
        </T>
      )}
      <T x={291.6} y={322} s={8} c="#0d0d0d" w={185} lh={12}>
        A fixed amount every month, so your outflow stays predictable.
      </T>
      {rows.map((r, i) => (
        <div key={i}>
          <T x={43.8} y={358.3 + step * i} s={8} c="#0d0d0d" w={180}>
            {r.label}
          </T>
          <T x={190} y={357.2 + step * i} s={9} c="#0d0d0d" w={58.4} align="right">
            {r.pct}
          </T>
          <HLine x1={43.8} x2={248.4} y={358.3 + step * i + 13} c="#e4dfd4" sw={0.5} />
        </div>
      ))}
      {MONTHLY.map(([t, s], i) => (
        <div key={t}>
          <T x={291.6} y={358.3 + 25.5 * i} s={8} c="#0d0d0d">
            {t}
          </T>
          {s ? (
            <T x={291.6} y={369.3 + 25.5 * i} s={8} c="#0d0d0d">
              {s}
            </T>
          ) : null}
          <HLine x1={291.6} x2={496.2} y={358.3 + 25.5 * i + (s ? 24 : 13)} c="#e4dfd4" sw={0.5} />
        </div>
      ))}
      <T x={43.8} y={484} s={8} c="#0d0d0d" w={200} lh={13}>
        Nothing is due until the stage before it is complete and approved by you.
      </T>
      <T x={291.6} y={484} s={8} c="#0d0d0d" w={200} lh={13}>
        Monthly amounts are set once the costing is frozen, and settled against the final figure in the closing invoice.
      </T>
      <Img src={door} x={25.9} y={583.9} w={488.2} h={348.5} style={{ opacity: 0.85 }} />
    </Page>
  );
}

function NextSteps({ m }) {
  const steps = m.steps.slice(0, 7);
  const step = Math.min(73.4, 368 / Math.max(steps.length, 1));
  const h = Math.min(61.9, step - 11.5);
  const c = m.company || {};
  return (
    <Page n={12}>
      <Eyebrow s={10} y={67.5}>
        NEXT STEPS
      </Eyebrow>
      <Title>From Review To Mobilization.</Title>
      <Sub>Simple decisions, in the right order.</Sub>
      {steps.map((s, i) => {
        const y = 193 + step * i;
        const on = i === steps.length - 1;
        return (
          <div key={s.id || i}>
            <Box x={30.2} y={y} w={479.5} h={h} fill={on ? C.green : "#fff"} stroke={on ? C.green : C.line} />
            <T x={53.4} y={y + 19.8} s={12} c={on ? C.gold : C.brand}>
              {String(i + 1).padStart(2, "0")}
            </T>
            <T x={90.8} y={y + 12.6} s={12} c={on ? "#fff" : C.ink} w={400}>
              {s.title}
            </T>
            <T x={90.8} y={y + 36.6} s={9} c={on ? "#dee8e3" : C.muted} w={400}>
              {s.detail}
            </T>
          </div>
        );
      })}
      <Box x={30.2} y={600.5} w={479.5} h={202.3} fill="#fff" stroke={C.line} />
      <T x={54.8} y={627.9} s={14} c={C.brand}>
        {PRINCIPAL.name}
      </T>
      <T x={54.8} y={645.3} s={8} c={C.sage}>
        {PRINCIPAL.role}
      </T>
      <Img src={iPhone} x={54.7} y={686.9} w={20.2} h={20.2} />
      <T x={83.6} y={690.7} s={11} c={C.ink} wt={700}>
        {c.phone || "+91 88828 30560"}
      </T>
      <Img src={iMail} x={303.8} y={686.9} w={20.2} h={20.2} />
      <T x={331.2} y={690.7} s={11} c={C.ink} wt={700}>
        {c.email || "sagar@rippotai.in"}
      </T>
      <Img src={iWeb} x={52.1} y={718.3} w={25.7} h={25.9} />
      <T x={85.2} y={725.3} s={11} c={C.title} wt={700}>
        {String(c.website || "www.rippotai.in").replace(/^https?:\/\//, "")}
      </T>
      <T x={60} y={772} s={8} c={C.sage} w={420} lh={10.1} align="center">
        This proposal is valid for thirty days from the date of issue. Figures are indicative until the BOQ is frozen and the Agreement is signed.
      </T>
      {m.needs.length > 0 && (
        <T x={30.2} y={818} s={8} c={C.sage} w={480} lh={11}>
          {`What we need from you to start: ${m.needs.join(" · ")}`}
        </T>
      )}
    </Page>
  );
}

function Closing({ m }) {
  return (
    <Page n={13} header={false} bg="#fff">
      <Img src={logo} x={165.9} y={247.9} w={207.4} h={252} />
      <T x={20} y={562} s={26} c={C.title} w={500} align="center">
        {`Let’s bring ${m.projectName} home.`}
      </T>
      <HLine x1={217.4} x2={321.8} y={597.8} c={C.gold} sw={1.5} />
      <T x={0} y={643.6} s={8} c={C.title} w={540} align="center" ls={0.9}>
        ARCHITECTURE · INTERIOR · TURNKEY
      </T>
      <Img src={buildingClosing} x={51.1} y={695.5} w={437} h={252.2} style={{ opacity: 0.82 }} />
    </Page>
  );
}

/* ------------------------------------------------------------ deck */

const ProposalDeck = forwardRef(function ProposalDeck(props, ref) {
  const company = useCompanyProfile();
  const m = useMemo(() => proposalDeckModel(props, company), [props, company]);
  return (
    <div ref={ref} className="ts-doc bp-deck" data-page-width="540" data-page-height="960">
      <Cover m={m} />
      <Welcome m={m} />
      <Snapshot m={m} />
      <HowWeWork />
      <OurPlan m={m} />
      <Spaces m={m} />
      <Timeline m={m} />
      <Scope m={m} />
      <Divider />
      <Fees m={m} />
      <HowYouPay m={m} />
      <NextSteps m={m} />
      <Closing m={m} />
    </div>
  );
});

export default ProposalDeck;
