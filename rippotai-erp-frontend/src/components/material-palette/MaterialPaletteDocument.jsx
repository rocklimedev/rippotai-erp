// Material Palette — replica of the original MATERIAL PALLETE TEMPLATE (.pptx / .pdf): landscape
// 960 × 540 pt pages — cover, INDEX, one page per material sample board (LOCATION + MATERIAL IMAGE
// panels, name, BRAND / CODE / SQ.FT AREA / QUANTITY / PRICE …), SIGN-OFF. Coordinates are the
// template PDF's points. Built from a project's material requirements and their sample boards.
import { forwardRef, useMemo } from "react";
import "@fontsource/lato/300.css";
import "@fontsource/lato/400.css";
import "@fontsource/lato/700.css";
import "../template-documents/sheet.css";
import "../business-proposal/proposal-deck/deck.css";
import PrivateImage from "@/components/PrivateImage";
import logo from "@/assets/templates/palette-logo.png";
import { paletteModel, PALETTE_TERMS } from "./paletteModel";

const G = "#0d3d2f";
const SAGE = "#3f5c52";
const GREY = "#6b6e69";
const RULE = "#c4ccc9";
const GOLD = "#d9b061";
const INK = "#242724";
const pt = (n) => `${n}pt`;

function T({ x, y, s, c = INK, w, wt = 300, align, ls, lh, style, children }) {
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
const Line = ({ x1, x2, y, c = RULE, sw = 0.75 }) => (
  <div className="bp-box" style={{ left: pt(x1), top: pt(y - sw / 2), width: pt(x2 - x1), height: pt(sw), background: c }} />
);
const Footer = () => (
  <T x={45.8} y={505.1} s={8} c={GREY} ls={0.6}>
    RIPPOTAI&nbsp;&nbsp;·&nbsp;&nbsp;MATERIAL SELECTION
  </T>
);
const Page = ({ children }) => (
  <div className="pd-page bp-page" style={{ width: "960pt", height: "540pt", background: "#fff" }}>
    {children}
  </div>
);

function Cover({ m }) {
  const rows = [
    ["PROJECT NAME", m.projectName],
    ["DATE", m.date],
    ["LEAD ARCHITECT", m.leadArchitect],
    ["MADE BY", m.madeBy],
  ];
  const ys = [414.7, 439.2, 462.2, 486.6];
  return (
    <Page>
      <img className="bp-img" src={logo} alt="Rippotai" style={{ left: pt(400), top: pt(57), width: pt(160), height: pt(194) }} />
      <Line x1={408} x2={552} y={246.4} c={GOLD} sw={1.5} />
      <T x={0} y={265.7} s={18} c={GOLD} w={960} align="center" ls={2.2}>
        MATERIAL PALLETE
      </T>
      {rows.map(([label, value], i) => (
        <div key={label}>
          <T x={271.2} y={ys[i] - 12.8} s={9} c={G} ls={0.9}>
            {label}
          </T>
          <T x={390} y={ys[i] - 13.8} s={10} c={INK} w={300}>
            {value}
          </T>
          <Line x1={264} x2={696} y={ys[i]} c={G} sw={1} />
        </div>
      ))}
    </Page>
  );
}

function Index({ m }) {
  // template rows: section heading → gold rule, entries 33.9 pt apart with grey rules
  let y = 100.7;
  const blocks = [];
  m.sections.forEach((sec, si) => {
    const top = y;
    blocks.push(
      <div key={`s${si}`}>
        <T x={50.4} y={top} s={12} c={SAGE} wt={700} ls={1.1}>
          {sec.title}
        </T>
        <Line x1={43.2} x2={916.8} y={top + 26.9} c={GOLD} sw={1.5} />
      </div>,
    );
    let ey = top + 50.3;
    sec.entries.forEach((e, ei) => {
      blocks.push(
        <div key={`e${si}-${ei}`}>
          <T x={50.4} y={ey} s={14} c={G} style={{ textDecoration: "underline", textDecorationThickness: "1pt", textUnderlineOffset: "2pt" }}>
            {e.title}
          </T>
          <T x={820} y={ey + 1.1} s={11} c={GREY} w={70.5} align="right">
            Page {e.page}
          </T>
          <Line x1={43.2} x2={916.8} y={ey + 23} sw={0.75} />
        </div>,
      );
      ey += 33.8;
    });
    y = ey + 15.8;
  });
  return (
    <Page>
      <T x={50.4} y={49.5} s={29.4} c={G}>
        INDEX
      </T>
      <Line x1={43.2} x2={916.8} y={82.7} sw={1.25} />
      {blocks}
      <T x={50.4} y={513} s={9} c={GREY} ls={0.6}>
        RIPPOTAI&nbsp;&nbsp;·&nbsp;&nbsp;MATERIAL SELECTION
      </T>
    </Page>
  );
}

function Panel({ x, label, src }) {
  return (
    <>
      <T x={x + 0.6} y={77.6} s={9} c={GREY} ls={0.9}>
        {label}
      </T>
      <div className="bp-box" style={{ left: pt(x), top: pt(90.4), width: pt(288.7), height: pt(364.4), border: `0.75pt dashed ${RULE}`, background: "#f4f7f6", overflow: "hidden" }}>
        {src ? (
          <PrivateImage src={src} crossOrigin="anonymous" alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        ) : null}
      </div>
    </>
  );
}

function MaterialPage({ p }) {
  const rows = p.rows;
  return (
    <Page>
      {p.heading && (
        <>
          <T x={50.4} y={18.9} s={26} c={G} wt={700}>
            {p.heading}
          </T>
          <Line x1={43.2} x2={916.8} y={49.9} c={GREY} sw={1.25} />
        </>
      )}
      <div className="bp-box" style={{ left: pt(43.2), top: pt(60), width: pt(873.6), height: pt(420), background: "#f4f7f6", borderRadius: pt(10) }} />
      <Panel x={70.5} label="LOCATION" src={p.location} />
      <Panel x={387.1} label="MATERIAL IMAGE" src={p.image} />
      <T x={703.8} y={p.sub ? 160 : 190.2} s={9} c="#000" w={190} style={{ fontFamily: "Calibri, Carlito, Lato, sans-serif" }}>
        {p.place}
      </T>
      <div className="bp-box" style={{ left: pt(703.8), top: pt(150), width: pt(181.4), height: pt(80), display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
        <div style={{ fontSize: pt(15), fontWeight: 700, color: G, lineHeight: pt(17), fontFamily: "Lato, sans-serif" }}>{p.name}</div>
        {p.sub ? <div style={{ fontSize: pt(8), color: GREY, lineHeight: pt(10), marginTop: pt(2), fontFamily: "Lato, sans-serif" }}>{p.sub}</div> : null}
      </div>
      <Line x1={703.8} x2={885.2} y={236.4} />
      {rows.map(([label, value], i) => {
        const y = 256.2 + 20.2 * i;
        return (
          <div key={label}>
            <T x={703.8} y={y} s={9} c={SAGE} wt={700} ls={0.5}>
              {label}
            </T>
            <T x={799.1} y={y - 0.9} s={label === "NOTES" || String(value).length > 16 ? 9 : 11} c={INK} w={95} lh={label === "NOTES" ? 11 : undefined}>
              {value}
            </T>
            {label !== "NOTES" && <Line x1={703.8} x2={885.2} y={269.5 + 20.2 * i} sw={0.5} />}
          </div>
        );
      })}
      <Footer />
    </Page>
  );
}

function SignOff({ m }) {
  return (
    <Page>
      <T x={50.4} y={49.5} s={29.4} c={G}>
        SIGN-OFF
      </T>
      <Line x1={43.2} x2={916.8} y={82.7} sw={1.25} />
      <T x={50.4} y={104.5} s={13} c={INK} w={860} lh={18.9}>
        This material palette is presented for client approval. Signing below confirms the materials, brands, codes and quantities shown are approved as the final selection for execution.
      </T>
      <div className="bp-box" style={{ left: pt(43.2), top: pt(165.4), width: pt(873.6), height: pt(192.9), background: "#f4f7f6", border: `0.75pt solid ${RULE}`, borderRadius: pt(6) }} />
      <T x={70.9} y={183.8} s={11} c={SAGE} wt={700} ls={1.1}>
        TERMS &amp; CONDITIONS
      </T>
      {PALETTE_TERMS.map((t, i) => (
        <div key={i}>
          <T x={70.9} y={214.5 + 25.2 * i} s={11} c={GOLD} wt={700}>
            {i + 1}.
          </T>
          <T x={100.8} y={214.5 + 25.2 * i} s={11} c={INK} w={800}>
            {t}
          </T>
        </div>
      ))}
      <T x={50.4} y={372} s={11} c={G} wt={700} ls={0.6}>
        RIPPOTAI
      </T>
      <T x={502.9} y={372} s={11} c={G} wt={700} ls={0.6}>
        CLIENT APPROVAL
      </T>
      <Line x1={43.2} x2={464.3} y={429.1} c={INK} sw={1.25} />
      <Line x1={495.7} x2={916.8} y={429.1} c={INK} sw={1.25} />
      <T x={50.4} y={439.5} s={10} c={SAGE}>
        Authorised Signatory
      </T>
      <T x={502.9} y={439.5} s={10} c={SAGE}>
        Client Signature
      </T>
      {[
        ["Name", m.signoff.name, ""],
        ["Date", m.signoff.date, ""],
      ].map(([label, a, b], i) => (
        <div key={label}>
          <T x={50.4} y={461.7 + 21.2 * i} s={11} c={GREY}>
            {label}&nbsp;&nbsp;·&nbsp;&nbsp;{a ? <span style={{ color: INK }}>{a}</span> : "____________________"}
          </T>
          <T x={502.9} y={461.7 + 21.2 * i} s={11} c={GREY}>
            {label}&nbsp;&nbsp;·&nbsp;&nbsp;{b || "____________________"}
          </T>
        </div>
      ))}
      <T x={50.4} y={513} s={9} c={GREY} ls={0.6}>
        RIPPOTAI&nbsp;&nbsp;·&nbsp;&nbsp;MATERIAL SELECTION
      </T>
    </Page>
  );
}

/** props: { project, requirements, leadArchitect, madeBy } */
const MaterialPaletteDocument = forwardRef(function MaterialPaletteDocument(props, ref) {
  const m = useMemo(() => paletteModel(props), [props]);
  return (
    <div ref={ref} className="ts-doc bp-deck mp-deck" data-page-width="960" data-page-height="540">
      <Cover m={m} />
      <Index m={m} />
      {m.pages.map((p) => (
        <MaterialPage key={p.key} p={p} />
      ))}
      <SignOff m={m} />
    </div>
  );
});

export default MaterialPaletteDocument;
