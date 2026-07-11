import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import { toast } from "sonner";

/* ============ Design tokens ============ */
const GREEN = "#1E4438";
const GREEN_DARK = "#1A3D34";
const AC = "#48607B";
const INK = "#1a1b1c";
const MUTED = "#5f6266";
const SOFT = "#6b6e72";
const FAINT = "#8a8c8e";
const PAGE_BG = "#fbfbfa";
const ALT_BG = "#f4f4f2";
const BORDER = "#e6e6e3";
const BORDER2 = "#e4e4e1";
const FOOTER_BG = "#1A1C1C";
const FOOTER_TEXT = "#c6c8ca";

const FONT = { fontFamily: "'Lato', system-ui, sans-serif" };

const ASSETS =
  "https://customer-assets.emergentagent.com/job_projects-central-2/artifacts/uploads";
const IMG_HERO = `${ASSETS}/9dda5fb8b1a4eec83fa4e29bf198d0af.jpg`;
const IMG_FEAT_1 = `${ASSETS}/d1744a77f78bb8796a3bf1ad648cc374.jpg`;
const IMG_FEAT_2 = `${ASSETS}/af6920aa15a91dbb249e222843699ec6.jpg`;
const IMG_CONNECT = `${ASSETS}/22f89174a026c3471b773beefdd675c7.jpg`;
const IMG_BOQ = `${ASSETS}/Screenshot%202026-07-06%20at%203.02.09%20PM.png`;

const APP_ICONS = null; // replaced by inline SVG tiles below (external asset URLs return 403)

const APP_ICON_PNGS = {
  Budget: "/landing/apps/icon_boq.png",
  Projects: "/landing/apps/icon_projects.png",
  Estimate: "/landing/apps/icon_estimate.png",
  Vendors: "/landing/apps/icon_vendors.png",
  Documents: "/landing/apps/icon_documents.png",
  Tasks: "/landing/apps/icon_tasks.png",
  Calendar: "/landing/apps/icon_calendar.png",
};

const AppIconTile = ({ name, size = 64 }) => {
  const png = APP_ICON_PNGS[name];
  return (
    <img
      src={png}
      alt={name}
      style={{ width: size, height: size, objectFit: "contain" }}
    />
  );
};

const TINT = "grayscale(1) opacity(0.35)";

/* Inline decorative floor-plan SVG for hero/features backgrounds (no external asset dependency). */
const FloorPlanSVG = ({ opacity = 0.35, className = "" }) => (
  <svg
    viewBox="0 0 400 400"
    className={className}
    style={{ opacity }}
    aria-hidden
  >
    <g fill="none" stroke={GREEN} strokeWidth="1" strokeLinecap="square">
      <rect x="30" y="30" width="340" height="340" />
      <path d="M30 190 L200 190 M200 30 L200 250 M200 250 L370 250 M120 190 L120 250 M260 250 L260 370" />
      <path d="M60 60 L60 150 M60 60 L150 60 M340 60 L340 150 M340 60 L250 60" />
      <path d="M60 190 L60 340 M340 190 L340 340" />
      <circle cx="80" cy="105" r="18" />
      <circle cx="320" cy="105" r="18" />
      <path d="M100 250 L100 300 L160 300 L160 250" />
      <path d="M300 285 L360 285 L360 340 L300 340 Z" />
      <path
        d="M225 275 L225 305 M225 340 L245 340 L245 300"
        strokeDasharray="3 3"
      />
      <text x="90" y="230" fontSize="8" fill={GREEN}>
        Living
      </text>
      <text x="280" y="230" fontSize="8" fill={GREEN}>
        Kitchen
      </text>
      <text x="90" y="320" fontSize="8" fill={GREEN}>
        Bed 01
      </text>
      <text x="280" y="320" fontSize="8" fill={GREEN}>
        Bed 02
      </text>
    </g>
  </svg>
);

/* Static BOQ dashboard mock (replaces external screenshot). */
const BoqMock = () => (
  <div
    className="p-8 bg-white"
    style={{ fontFamily: "'Lato', system-ui, sans-serif" }}
  >
    <div className="grid grid-cols-4 gap-4 mb-6">
      {[
        { l: "Total BOQ value", v: "₹31,16,080" },
        { l: "Categories", v: "12" },
        { l: "Line items", v: "184" },
        { l: "Approved", v: "78%" },
      ].map((k) => (
        <div
          key={k.l}
          className="rounded-lg p-4"
          style={{ background: "#F7F7F5" }}
        >
          <div
            className="text-[10.5px] uppercase tracking-widest"
            style={{ color: FAINT }}
          >
            {k.l}
          </div>
          <div
            className="text-[22px] font-semibold mt-1"
            style={{ color: INK }}
          >
            {k.v}
          </div>
        </div>
      ))}
    </div>
    <table className="w-full text-[12.5px]">
      <thead>
        <tr
          className="text-[10.5px] uppercase tracking-widest text-left"
          style={{ color: FAINT, borderBottom: `1px solid ${BORDER}` }}
        >
          <th className="pb-2">#</th>
          <th className="pb-2">Category</th>
          <th className="pb-2">Qty</th>
          <th className="pb-2">Unit</th>
          <th className="pb-2 text-right">Rate</th>
          <th className="pb-2 text-right">Amount</th>
        </tr>
      </thead>
      <tbody>
        {[
          ["1", "Civil & Masonry", "820", "Sqm", "₹527", "₹4,32,140"],
          ["2", "Electrical", "220", "Pts", "₹993", "₹2,18,460"],
          ["3", "Furniture & Joinery", "540", "Sqft", "₹1,822", "₹9,83,880"],
          ["4", "Lighting & Decor", "42", "Nos.", "₹7,386", "₹3,10,212"],
          ["5", "Painting & Finishes", "1240", "Sqft", "₹152", "₹1,88,480"],
        ].map((r) => (
          <tr key={r[0]} style={{ borderBottom: `1px solid ${BORDER}` }}>
            {r.map((c, i) => (
              <td
                key={i}
                className={`py-2.5 ${i >= 4 ? "text-right" : ""}`}
                style={{
                  color: i === 1 ? INK : MUTED,
                  fontWeight: i === 1 ? 600 : 400,
                }}
              >
                {c}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
    <div className="mt-6 flex items-center justify-between">
      <div className="text-[11px]" style={{ color: FAINT }}>
        Last updated 25 minutes ago · V3
      </div>
      <div className="flex items-center gap-2">
        <div
          className="w-40 h-1.5 rounded-full"
          style={{ background: "#EAEEF0" }}
        >
          <div
            className="h-full rounded-full"
            style={{ background: GREEN, width: "68%" }}
          />
        </div>
        <div className="text-[11px] font-semibold" style={{ color: INK }}>
          68% completed
        </div>
      </div>
    </div>
  </div>
);

/* ============ Header ============ */
function Header() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  const [signInForm, setSignInForm] = useState({ email: "", password: "" });
  const { login } = useAuth();
  const [busy, setBusy] = useState(false);

  const doSignIn = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await login(signInForm.email, signInForm.password);
      setOpen(false);
      nav("/dashboard");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Sign in failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <header
      className="sticky top-0 z-40"
      style={{
        backdropFilter: "blur(14px)",
        background: "rgba(251,251,250,0.86)",
        borderBottom: `1px solid ${BORDER}`,
        ...FONT,
      }}
      data-testid="landing-header"
    >
      <div className="max-w-[1240px] mx-auto px-6 h-16 grid grid-cols-[auto_1fr_auto] items-center gap-6">
        <a
          href="#top"
          className="text-[25px] font-semibold tracking-[0.16em]"
          style={{ color: INK }}
          data-testid="landing-brand"
        >
          INOS
        </a>
        <nav
          className="hidden md:flex items-center justify-center gap-7 text-[12.5px] uppercase tracking-[0.1em]"
          style={{ color: MUTED }}
        >
          <a href="#apps" className="hover:text-black" data-testid="nav-apps">
            Apps
          </a>
          <a
            href="#pricing"
            className="hover:text-black"
            data-testid="nav-pricing"
          >
            Pricing
          </a>
          <a
            href="#connect"
            className="hover:text-black"
            data-testid="nav-connect"
          >
            Connect
          </a>
          <a href="#about" className="hover:text-black" data-testid="nav-about">
            About
          </a>
        </nav>
        <div className="flex items-center gap-2 relative">
          <button
            onClick={() => setOpen((o) => !o)}
            className="h-9 w-9 rounded-full border flex items-center justify-center hover:bg-white"
            style={{ borderColor: BORDER }}
            data-testid="landing-profile-btn"
            aria-label="Profile"
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke={INK}
              strokeWidth="1.5"
            >
              <circle cx="12" cy="8" r="4" />
              <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
            </svg>
          </button>
          {open && (
            <div
              className="absolute right-0 top-11 min-w-[260px] bg-white border rounded-xl shadow-lg z-50 p-3"
              style={{ borderColor: BORDER, ...FONT }}
              data-testid="landing-profile-menu"
            >
              {user ? (
                <div className="grid gap-1">
                  <button
                    onClick={() => {
                      setOpen(false);
                      nav("/dashboard");
                    }}
                    className="text-left px-3 py-2 text-[13px] hover:bg-[#F7F7F5] rounded-md"
                    data-testid="menu-go-dashboard"
                  >
                    Go to Dashboard
                  </button>
                  <button
                    onClick={() => {
                      setOpen(false);
                      nav("/settings/profile");
                    }}
                    className="text-left px-3 py-2 text-[13px] hover:bg-[#F7F7F5] rounded-md"
                    data-testid="menu-account"
                  >
                    Account Settings
                  </button>
                  <button
                    onClick={() => {
                      setOpen(false);
                      logout();
                      window.location.reload();
                    }}
                    className="text-left px-3 py-2 text-[13px] hover:bg-[#F7F7F5] rounded-md"
                    data-testid="menu-signout"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <form onSubmit={doSignIn} className="grid gap-2">
                  <div
                    className="text-[12px] uppercase tracking-[0.14em] mb-1"
                    style={{ color: FAINT }}
                  >
                    Sign in to INOS
                  </div>
                  <input
                    placeholder="Email"
                    type="email"
                    value={signInForm.email}
                    onChange={(e) =>
                      setSignInForm({ ...signInForm, email: e.target.value })
                    }
                    className="h-9 px-2.5 rounded-md border text-[13px]"
                    style={{ borderColor: BORDER2, background: "#fbfbfa" }}
                    data-testid="header-signin-email"
                    required
                  />
                  <input
                    placeholder="Password"
                    type="password"
                    value={signInForm.password}
                    onChange={(e) =>
                      setSignInForm({ ...signInForm, password: e.target.value })
                    }
                    className="h-9 px-2.5 rounded-md border text-[13px]"
                    style={{ borderColor: BORDER2, background: "#fbfbfa" }}
                    data-testid="header-signin-password"
                    required
                  />
                  <button
                    disabled={busy}
                    type="submit"
                    className="mt-1 h-9 rounded-md text-white text-[12.5px] font-semibold"
                    style={{ background: GREEN_DARK }}
                    data-testid="header-signin-submit"
                  >
                    {busy ? "…" : "Sign in"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      nav("/signup");
                    }}
                    className="text-[12px] pt-1"
                    style={{ color: MUTED }}
                    data-testid="header-signin-tryfree"
                  >
                    New here?{" "}
                    <span style={{ color: GREEN }} className="font-semibold">
                      Try for free
                    </span>
                  </button>
                </form>
              )}
            </div>
          )}
          <button
            onClick={() => nav(user ? "/dashboard" : "/signup")}
            className="h-10 px-4 rounded-lg text-white text-[12px] font-semibold tracking-[0.06em] uppercase"
            style={{ background: GREEN_DARK }}
            data-testid="header-try-free"
          >
            {user ? "Go to Dashboard" : "Try for Free"}
          </button>
        </div>
      </div>
    </header>
  );
}

/* ============ Hero ============ */
function Hero() {
  const nav = useNavigate();
  const BG_MASK_TR =
    "radial-gradient(120% 120% at 100% 0%, black 40%, transparent 85%)";
  return (
    <section
      id="top"
      className="relative overflow-hidden"
      style={{ background: PAGE_BG, ...FONT }}
      data-testid="section-hero"
    >
      <img
        src="/landing/blueprint_hero.jpg"
        alt=""
        aria-hidden
        className="hero-bg absolute pointer-events-none select-none"
        style={{
          right: "-60px",
          top: "-60px",
          width: "min(560px, 50%)",
          opacity: 0.18,
          mixBlendMode: "multiply",
          filter: "grayscale(1) sepia(.4) hue-rotate(95deg) saturate(1)",
          maskImage: BG_MASK_TR,
          WebkitMaskImage: BG_MASK_TR,
          zIndex: 0,
        }}
      />
      <div className="relative" style={{ zIndex: 1 }}>
        <div className="max-w-[720px] mx-auto text-center px-6 pt-24 pb-8">
          <h1
            className="font-light leading-[1.08]"
            style={{ color: INK, fontSize: "clamp(30px, 3.3vw, 46px)" }}
          >
            Still Managing Architecture Projects Across{" "}
            <span style={{ color: GREEN, fontWeight: 400 }}>
              Chats, Sheets, Files, and Follow-Ups?
            </span>
          </h1>
          <p
            className="mt-5 text-[15.5px] leading-relaxed"
            style={{ color: MUTED }}
          >
            Simple, organised, affordable — projects, documents, estimates,
            vendors, execution & handover in one clean ERP.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3 flex-wrap">
            <button
              onClick={() => nav("/signup")}
              className="h-11 px-6 rounded-lg text-white text-[13.5px] font-semibold"
              style={{ background: GREEN }}
              data-testid="hero-try-free"
            >
              Try for free
            </button>
            <a
              href="#connect"
              className="h-11 px-6 rounded-lg border text-[13.5px] font-semibold flex items-center"
              style={{ borderColor: BORDER2, background: "white", color: INK }}
              data-testid="hero-book-demo"
            >
              Book a demo
            </a>
          </div>
        </div>
        <div
          className="mx-auto px-6 pb-24"
          style={{ maxWidth: "min(640px, 92vw)" }}
        >
          <img
            src="/landing/flow_chart.png"
            alt="From scattered tools to one INOS platform"
            className="w-full h-auto block"
            data-testid="hero-flow-chart"
          />
        </div>
      </div>
    </section>
  );
}

/* ============ Apps ============ */
function Apps() {
  const items = [
    "Budget",
    "Projects",
    "Estimate",
    "Vendors",
    "Documents",
    "Tasks",
    "Calendar",
  ];
  return (
    <section
      id="apps"
      className="px-6"
      style={{
        background: ALT_BG,
        borderTop: `1px solid #e8e8e5`,
        borderBottom: `1px solid #e8e8e5`,
        padding: "104px 32px",
        ...FONT,
      }}
      data-testid="section-apps"
    >
      <div className="max-w-[1120px] mx-auto">
        <h2
          className="text-center font-light"
          style={{
            color: INK,
            fontSize: "clamp(28px,3.4vw,42px)",
            lineHeight: 1.12,
          }}
        >
          One Platform. Every Project.
        </h2>
        <div className="mt-14 max-w-[640px] mx-auto flex flex-wrap items-start justify-center gap-x-12 gap-y-14">
          {items.map((label) => (
            <div
              key={label}
              className="flex flex-col items-center gap-3 group"
              data-testid={`app-tile-${label.toLowerCase()}`}
            >
              <div
                className="w-[108px] h-[108px] rounded-[26px] bg-white flex items-center justify-center transition-transform"
                style={{
                  boxShadow:
                    "0 12px 24px -14px rgba(20,20,20,0.15), 0 2px 4px rgba(20,20,20,.04)",
                }}
              >
                <AppIconTile name={label} size={64} />
              </div>
              <div
                className="text-[14.5px] font-semibold"
                style={{ color: INK }}
              >
                {label}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-[76px] text-center max-w-[640px] mx-auto">
          <div className="text-[17.5px] font-semibold" style={{ color: INK }}>
            Imagine every drawing, estimate, and site update — living in one
            place.
          </div>
          <p
            className="mt-3 text-[15px] leading-relaxed"
            style={{ color: MUTED }}
          >
            Got something to organise? There&apos;s an app for that. No
            complexity, no clutter — each app simplifies one part of your
            practice, and together they run the whole studio.
          </p>
          <div
            className="mt-6 inline-block px-5 py-2.5 rounded-full italic text-[14px]"
            style={{
              color: "#3a3c3e",
              background: "white",
              border: `1px solid ${BORDER}`,
              boxShadow: "0 1px 2px rgba(20,20,20,0.03)",
            }}
          >
            &ldquo;We stopped chasing files and started finishing
            projects.&rdquo;
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============ Workflow ============ */
function IconBrief() {
  return (
    <svg
      width="35"
      height="34"
      viewBox="0 0 35 34"
      fill="none"
      stroke={GREEN}
      strokeWidth="1.5"
      strokeLinecap="round"
    >
      <rect x="5.5" y="7" width="24" height="22" rx="2.5" />
      <path d="M5.5 12h24M11 4v6M24 4v6" />
    </svg>
  );
}
function IconDoc() {
  return (
    <img
      src="/landing/apps/icon_documents.png"
      alt="Documentation"
      style={{ width: 35, height: 34, objectFit: "contain" }}
    />
  );
}
function IconDesign() {
  return (
    <svg
      width="35"
      height="34"
      viewBox="0 0 35 34"
      fill="none"
      stroke={GREEN}
      strokeWidth="1.5"
      strokeLinecap="round"
    >
      <circle cx="17.5" cy="12" r="4" />
      <path d="M9 27c1.5-4 5-6.5 8.5-6.5S24.5 23 26 27" />
      <path d="M17.5 16v9" strokeDasharray="1.6 2.6" />
    </svg>
  );
}
function IconInvoice() {
  return (
    <img
      src="/landing/apps/icon_estimate.png"
      alt="Estimates"
      style={{ width: 35, height: 34, objectFit: "contain" }}
    />
  );
}
function IconSite() {
  return (
    <svg
      width="35"
      height="34"
      viewBox="0 0 35 34"
      fill="none"
      stroke={GREEN}
      strokeWidth="1.5"
      strokeLinecap="round"
    >
      <path d="M5 29h25" />
      <path d="M9 29V13l8-4 8 4v16" />
      <path d="M13 29v-7h8v7" />
    </svg>
  );
}
function IconKey() {
  return (
    <svg
      width="35"
      height="34"
      viewBox="0 0 35 34"
      fill="none"
      stroke={GREEN}
      strokeWidth="1.5"
      strokeLinecap="round"
    >
      <circle cx="12" cy="17" r="5" />
      <path d="M17 17h13M25 17v5M29 17v3" />
    </svg>
  );
}

function Workflow() {
  const steps = [
    {
      t: "Brief",
      d: "Capture scope, budget, and client requirements.",
      I: IconBrief,
    },
    {
      t: "Documentation",
      d: "Surveys, drawings, and approvals filed by phase.",
      I: IconDoc,
    },
    {
      t: "Design",
      d: "Concepts to construction drawings, versioned.",
      I: IconDesign,
    },
    {
      t: "Estimates",
      d: "Estimates and BOQs generated from the design set.",
      I: IconInvoice,
    },
    {
      t: "Execution",
      d: "Site work, vendors, and quality tracked daily.",
      I: IconSite,
    },
    {
      t: "Handover",
      d: "Closeout packs delivered, project archived.",
      I: IconKey,
    },
  ];
  return (
    <section
      id="workflow"
      className="px-6"
      style={{ background: PAGE_BG, padding: "104px 32px", ...FONT }}
      data-testid="section-workflow"
    >
      <div className="max-w-[1120px] mx-auto">
        <h2
          className="font-light max-w-[640px]"
          style={{
            color: INK,
            fontSize: "clamp(28px,3.4vw,42px)",
            lineHeight: 1.14,
          }}
        >
          One Flow, From First Brief to Final Handover
        </h2>
        <div
          className="mt-12 grid gap-px"
          style={{
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
            background: BORDER,
            border: `1px solid ${BORDER}`,
            borderRadius: 4,
            overflow: "hidden",
          }}
        >
          {steps.map((s) => (
            <div key={s.t} className="bg-white p-6 flex flex-col gap-4">
              <s.I />
              <div>
                <div
                  className="text-[15.5px] font-semibold"
                  style={{ color: INK }}
                >
                  {s.t}
                </div>
                <div
                  className="mt-2 text-[13.5px] leading-relaxed"
                  style={{ color: MUTED }}
                >
                  {s.d}
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-12 flex items-start gap-4 max-w-[720px]">
          <svg
            width="46"
            height="46"
            viewBox="0 0 46 46"
            fill="none"
            stroke={AC}
            strokeWidth="1.4"
            strokeLinecap="round"
          >
            <circle cx="23" cy="23" r="18" />
            <path d="M23 12v11l7 4" />
          </svg>
          <p className="text-[15px] leading-relaxed" style={{ color: MUTED }}>
            <span className="font-bold" style={{ color: INK }}>
              Progress updates itself.
            </span>{" "}
            As documents are uploaded and finalised, each project&apos;s phase
            advances automatically — no manual status updates, no chasing.
          </p>
        </div>
      </div>
    </section>
  );
}

/* ============ Features ============ */
function FeatureIcon({ paths }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke={AC}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {paths}
    </svg>
  );
}
function Features() {
  const cards = [
    {
      t: "Document-based project phases",
      d: "Phases advance when the documents that define them are finalised — the plan and the paperwork can never drift apart.",
      i: (
        <>
          <path d="M6 3h9l4 4v14H6z" />
          <path d="M15 3v4h4M9 12h7M9 16h7" />
        </>
      ),
    },
    {
      t: "Real-time activity tracking",
      d: "Every upload, approval, and change lands in one feed — the whole firm sees the same picture, instantly.",
      i: (
        <>
          <path d="M3 12h4l3-8 4 16 3-8h4" />
        </>
      ),
    },
    {
      t: "Estimate & BOQ creation",
      d: "Line items, rates, and quantities in a structured editor — export client-ready estimates and contractor BOQs from the same data.",
      i: (
        <>
          <rect x="4" y="4" width="16" height="16" rx="2" />
          <path d="M4 10h16M9 4v16" />
        </>
      ),
    },
    {
      t: "Vendor & inventory management",
      d: "Quotes, purchase orders, and material stock connected to the projects that consume them.",
      i: (
        <>
          <rect x="3" y="6" width="18" height="14" rx="1.5" />
          <path d="M3 10h18M8 3v6" />
        </>
      ),
    },
    {
      t: "Team roles & permissions",
      d: "Principals, project leads, site teams, and clients each see exactly what they should — nothing more.",
      i: (
        <>
          <circle cx="9" cy="9" r="3.5" />
          <path d="M3 20c0-3 3-5 6-5s6 2 6 5" />
          <circle cx="17" cy="10" r="2.5" />
          <path d="M15 20c0-2.2 1.9-4 4-4" />
        </>
      ),
    },
    {
      t: "A dashboard made for studios",
      d: "Projects, documents, estimates, and tasks on one calm screen — designed for architects, not accountants.",
      i: (
        <>
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <path d="M3 10h18M9 10v10" />
        </>
      ),
    },
  ];
  return (
    <section
      id="features"
      className="relative overflow-hidden px-6"
      style={{
        background: ALT_BG,
        borderTop: `1px solid #e8e8e5`,
        borderBottom: `1px solid #e8e8e5`,
        padding: "104px 32px",
        ...FONT,
      }}
      data-testid="section-features"
    >
      <img
        src="/landing/linedraw_building.jpg"
        alt=""
        aria-hidden
        className="hero-bg absolute right-[-60px] top-[-40px] w-[500px] pointer-events-none select-none"
        style={{
          opacity: 0.16,
          mixBlendMode: "multiply",
          filter: "grayscale(1) sepia(.35) hue-rotate(95deg) saturate(1)",
          maskImage:
            "radial-gradient(120% 120% at 100% 0%, black 40%, transparent 85%)",
          WebkitMaskImage:
            "radial-gradient(120% 120% at 100% 0%, black 40%, transparent 85%)",
          zIndex: 0,
        }}
      />
      <img
        src="/landing/overhead_plan.jpg"
        alt=""
        aria-hidden
        className="hero-bg absolute left-[-80px] bottom-[-40px] w-[440px] pointer-events-none select-none"
        style={{
          opacity: 0.14,
          mixBlendMode: "multiply",
          filter: "grayscale(1) sepia(.35) hue-rotate(95deg) saturate(1)",
          maskImage:
            "radial-gradient(120% 120% at 0% 100%, black 40%, transparent 85%)",
          WebkitMaskImage:
            "radial-gradient(120% 120% at 0% 100%, black 40%, transparent 85%)",
          zIndex: 0,
        }}
      />
      <div className="max-w-[1120px] mx-auto relative">
        <h2
          className="font-light max-w-[560px]"
          style={{
            color: INK,
            fontSize: "clamp(28px,3.4vw,42px)",
            lineHeight: 1.14,
          }}
        >
          Built Around How Studios Actually Work
        </h2>
        <div
          className="mt-12 grid gap-4"
          style={{
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          }}
        >
          {cards.map((c) => (
            <div
              key={c.t}
              className="bg-white p-7 rounded-[11px]"
              style={{ border: `1px solid ${BORDER}` }}
            >
              <FeatureIcon paths={c.i} />
              <div
                className="mt-4 text-[15.5px] font-semibold"
                style={{ color: INK }}
              >
                {c.t}
              </div>
              <p
                className="mt-2 text-[13.5px] leading-relaxed"
                style={{ color: MUTED }}
              >
                {c.d}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============ Dashboard preview ============ */
function DashboardPreview() {
  return (
    <section
      id="dashboard"
      className="px-6"
      style={{ background: PAGE_BG, padding: "104px 32px", ...FONT }}
      data-testid="section-dashboard"
    >
      <div className="max-w-[1120px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end">
          <h2
            className="font-light"
            style={{
              color: INK,
              fontSize: "clamp(28px,3.2vw,40px)",
              lineHeight: 1.14,
            }}
          >
            From hours of BOQ creation to minutes of typing.
          </h2>
          <p className="text-[15.5px]" style={{ color: MUTED }}>
            Cost clarity before site chaos begins.
          </p>
        </div>
        <div
          className="mt-10 rounded-[14px] bg-white overflow-hidden"
          style={{
            border: `1px solid ${BORDER}`,
            boxShadow: "0 30px 60px -30px rgba(20,20,20,0.2)",
          }}
        >
          <div
            className="flex items-center gap-2 px-4 py-3"
            style={{
              borderBottom: `1px solid ${BORDER}`,
              background: "#fafaf8",
            }}
          >
            <span
              className="w-3 h-3 rounded-full"
              style={{ background: "#ff5f57" }}
            />
            <span
              className="w-3 h-3 rounded-full"
              style={{ background: "#ffbd2e" }}
            />
            <span
              className="w-3 h-3 rounded-full"
              style={{ background: "#28c840" }}
            />
            <div className="flex-1 flex justify-center">
              <div
                className="px-4 py-1 rounded-md text-[11px]"
                style={{
                  color: FAINT,
                  background: "white",
                  border: `1px solid ${BORDER}`,
                  fontFamily: "ui-monospace, monospace",
                }}
              >
                app.inos.com/boq
              </div>
            </div>
          </div>
          <BoqMock />
        </div>
      </div>
    </section>
  );
}

/* ============ Pricing ============ */
function Pricing() {
  const nav = useNavigate();
  const rows = [
    {
      key: "starter",
      name: "Starter",
      tag: "For small design studios",
      price: 0,
      dark: true,
      features: [
        "Unlimited projects",
        "All 12 apps, incl. estimates & BOQ",
        "30 days free trial",
      ],
      cta: "Start free trial",
      note: "30 days free trial",
      to: "/signup",
    },
    {
      key: "enterprise",
      name: "Enterprise",
      tag: "For large firms & developers",
      price: null,
      features: [
        "Everything in Firm",
        "SSO & audit logs",
        "Dedicated onboarding",
        "SLA & account manager",
      ],
      cta: "Talk to sales",
      to: "#connect",
    },
  ];
  const priceOf = (p) => {
    if (p.price === null) return "Custom";
    if (p.price === 0) return "0₨";
    return `${p.price}₨`;
  };
  return (
    <section
      id="pricing"
      className="px-6"
      style={{
        background: ALT_BG,
        borderTop: `1px solid #e8e8e5`,
        borderBottom: `1px solid #e8e8e5`,
        padding: "104px 32px",
        ...FONT,
      }}
      data-testid="section-pricing"
    >
      <div className="max-w-[1120px] mx-auto">
        <h2
          className="text-center font-light mx-auto max-w-[560px]"
          style={{
            color: INK,
            fontSize: "clamp(28px,3.4vw,42px)",
            lineHeight: 1.14,
          }}
        >
          Simple Plans That Scale With Your Firm
        </h2>
        <div
          className="mt-12 grid gap-5 mx-auto"
          style={{
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 340px))",
            justifyContent: "center",
            maxWidth: "740px",
          }}
        >
          {rows.map((p) => {
            const dark = !!p.dark;
            return (
              <div
                key={p.key}
                className="p-6 rounded-[14px] relative flex flex-col"
                style={{
                  background: dark ? GREEN_DARK : "white",
                  color: dark ? "white" : INK,
                  border: `1px solid ${dark ? GREEN_DARK : BORDER}`,
                  boxShadow: "0 1px 2px rgba(20,20,20,.03)",
                }}
                data-testid={`plan-${p.key}`}
              >
                <div
                  className="text-[18px] font-semibold"
                  style={{ color: dark ? "white" : INK }}
                >
                  {p.name}
                </div>
                <div
                  className="mt-1 text-[12.5px]"
                  style={{ color: dark ? "#c8d6d1" : FAINT }}
                >
                  {p.tag}
                </div>
                <div className="mt-6 flex items-baseline gap-1">
                  <div
                    className="text-[36px] font-light"
                    style={{ color: dark ? "white" : INK, lineHeight: 1 }}
                  >
                    {priceOf(p)}
                  </div>
                  {p.price !== null && p.price !== 0 && (
                    <div
                      className="text-[12px]"
                      style={{ color: dark ? "#c8d6d1" : FAINT }}
                    >
                      /month
                    </div>
                  )}
                </div>
                {p.note && (
                  <div
                    className="text-[12px] mt-1"
                    style={{ color: dark ? "#c8d6d1" : FAINT }}
                  >
                    {p.note}
                  </div>
                )}
                <ul className="mt-6 space-y-2 flex-1">
                  {p.features.map((f) => (
                    <li
                      key={f}
                      className="flex items-start gap-2 text-[13px]"
                      style={{ color: dark ? "#e2ecea" : INK }}
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke={dark ? "white" : AC}
                        strokeWidth="2"
                        className="mt-1 shrink-0"
                      >
                        <path d="M5 12l4 4L19 6" />
                      </svg>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => {
                    if (p.to.startsWith("#")) {
                      document
                        .querySelector(p.to)
                        ?.scrollIntoView({ behavior: "smooth" });
                    } else {
                      nav(p.to);
                    }
                  }}
                  className="mt-6 h-11 rounded-lg text-[13px] font-semibold tracking-[0.06em]"
                  style={{
                    background: dark ? "white" : "transparent",
                    color: dark ? INK : GREEN,
                    border: dark ? "none" : `1.5px solid ${GREEN}`,
                  }}
                  data-testid={`plan-cta-${p.key}`}
                >
                  {p.cta}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ============ About ============ */
function About() {
  const rows = [
    { label: "BEFORE", text: "Scattered communication across chats and email" },
    { label: "BEFORE", text: "Manual progress tracking in spreadsheets" },
    { label: "BEFORE", text: "Delayed documents and lost revisions" },
    { label: "BEFORE", text: "Unorganised, reactive project execution" },
  ];
  return (
    <section
      id="about"
      className="px-6"
      style={{ background: PAGE_BG, padding: "104px 32px", ...FONT }}
      data-testid="section-about"
    >
      <div className="max-w-[1120px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-16">
        <div>
          <h2
            className="font-light"
            style={{
              color: INK,
              fontSize: "clamp(28px,3.4vw,42px)",
              lineHeight: 1.14,
            }}
          >
            Purpose-Built for Architecture and Design Businesses
          </h2>
          <p
            className="mt-6 text-[15.5px] leading-relaxed"
            style={{ color: MUTED }}
          >
            Generic ERPs were made for factories and warehouses. INOS is built
            around the way studios work — briefs, drawings, revisions, site
            visits, and handover packs. One platform replaces the spreadsheets,
            chat threads, and folder chaos in between.
          </p>
        </div>
        <div
          className="rounded-[12px] overflow-hidden"
          style={{ border: `1px solid #e8e8e5` }}
        >
          <div className="grid gap-px" style={{ background: "#e8e8e5" }}>
            {rows.map((r, i) => (
              <div key={i} className="bg-white px-5 py-4">
                <div
                  className="text-[10.5px] tracking-[0.16em] font-bold mb-1"
                  style={{
                    color: FAINT,
                    fontFamily: "ui-monospace, monospace",
                  }}
                >
                  {r.label}
                </div>
                <div
                  className="text-[14px] line-through"
                  style={{ color: FAINT }}
                >
                  {r.text}
                </div>
              </div>
            ))}
            <div
              className="px-5 py-5"
              style={{ background: GREEN_DARK, color: "white" }}
            >
              <div
                className="text-[10.5px] tracking-[0.16em] font-bold mb-1"
                style={{ fontFamily: "ui-monospace, monospace" }}
              >
                AFTER
              </div>
              <div className="text-[14.5px] font-semibold">
                One organised system of record, from brief to handover
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============ Connect ============ */
function Connect() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    firm: "",
    phone: "",
    message: "",
  });
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [errors, setErrors] = useState({});

  const submit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.name.trim()) errs.name = true;
    if (!form.email.trim()) errs.email = true;
    if (!form.message.trim()) errs.message = true;
    setErrors(errs);
    if (Object.keys(errs).length) {
      toast.error("Please fill Name, Work email and Message.");
      return;
    }
    setBusy(true);
    try {
      await api.post("/demo-requests", form);
      setDone(true);
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section
      id="connect"
      className="relative overflow-hidden px-6"
      style={{
        background: PAGE_BG,
        borderTop: `1px solid #e8e8e5`,
        padding: "104px 32px",
        ...FONT,
      }}
      data-testid="section-connect"
    >
      <img
        src="/landing/overhead_plan.jpg"
        alt=""
        aria-hidden
        className="hero-bg absolute right-[-60px] top-[-40px] w-[420px] pointer-events-none select-none"
        style={{
          opacity: 0.18,
          mixBlendMode: "multiply",
          filter: "grayscale(1) sepia(.35) hue-rotate(95deg) saturate(1)",
          maskImage:
            "radial-gradient(120% 120% at 100% 0%, black 40%, transparent 85%)",
          WebkitMaskImage:
            "radial-gradient(120% 120% at 100% 0%, black 40%, transparent 85%)",
          zIndex: 0,
        }}
      />
      <div className="max-w-[1120px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 relative">
        <div>
          <h2
            className="font-light"
            style={{
              color: INK,
              fontSize: "clamp(28px,3.4vw,42px)",
              lineHeight: 1.14,
            }}
          >
            See INOS on Your Own Projects
          </h2>
          <p
            className="mt-5 text-[15.5px] leading-relaxed"
            style={{ color: MUTED }}
          >
            Book a 30-minute walkthrough with our team. We&apos;ll set up a
            sample project from your practice and show you the full flow.
          </p>
          <div className="mt-6 space-y-1.5 text-[14px]" style={{ color: INK }}>
            <div>hello@inos.com</div>
            <div style={{ color: MUTED }}>Mon–Sat, 9:00am-6:00pm</div>
          </div>
        </div>
        <div
          className="bg-white rounded-[14px] p-6"
          style={{
            border: `1px solid ${BORDER2}`,
            boxShadow: "0 20px 40px -22px rgba(20,20,20,.12)",
          }}
        >
          {done ? (
            <div className="text-center py-10" data-testid="demo-form-success">
              <svg
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke={AC}
                strokeWidth="1.5"
                className="mx-auto"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M8 12l3 3 5-6" />
              </svg>
              <div
                className="mt-4 text-[16px] font-semibold"
                style={{ color: INK }}
              >
                Demo request received
              </div>
              <p className="mt-2 text-[13.5px]" style={{ color: MUTED }}>
                Thanks — we&apos;ll reach out within one working day to schedule
                your walkthrough.
              </p>
              <button
                onClick={() => {
                  setDone(false);
                  setForm({
                    name: "",
                    email: "",
                    firm: "",
                    phone: "",
                    message: "",
                  });
                }}
                className="mt-5 h-10 px-4 rounded-lg border text-[13px] font-semibold"
                style={{ borderColor: BORDER2, color: INK }}
                data-testid="demo-send-another"
              >
                Send another request
              </button>
            </div>
          ) : (
            <form
              onSubmit={submit}
              className="grid gap-3"
              data-testid="demo-form"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <FormInput
                  label="Name"
                  testid="demo-name"
                  value={form.name}
                  err={errors.name}
                  onChange={(v) => setForm({ ...form, name: v })}
                  required
                />
                <FormInput
                  label="Work email"
                  type="email"
                  testid="demo-email"
                  value={form.email}
                  err={errors.email}
                  onChange={(v) => setForm({ ...form, email: v })}
                  required
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <FormInput
                  label="Firm name"
                  testid="demo-firm"
                  value={form.firm}
                  onChange={(v) => setForm({ ...form, firm: v })}
                />
                <FormInput
                  label="Phone number"
                  testid="demo-phone"
                  value={form.phone}
                  onChange={(v) => setForm({ ...form, phone: v })}
                />
              </div>
              <div>
                <label
                  className="text-[11.5px] uppercase tracking-[0.14em] font-semibold mb-1 block"
                  style={{ color: FAINT }}
                >
                  Message / project details
                </label>
                <textarea
                  rows={4}
                  value={form.message}
                  onChange={(e) =>
                    setForm({ ...form, message: e.target.value })
                  }
                  placeholder="Tell us about your practice — team size, project types…"
                  className="w-full px-3 py-2.5 rounded-lg border text-[13.5px] outline-none"
                  style={{
                    borderColor: errors.message ? "#B04D26" : BORDER2,
                    background: "#fbfbfa",
                  }}
                  data-testid="demo-message"
                />
              </div>
              <button
                type="submit"
                disabled={busy}
                className="mt-2 h-11 rounded-lg text-white text-[14px] font-semibold"
                style={{ background: GREEN_DARK }}
                data-testid="demo-submit"
              >
                {busy ? "Sending…" : "Book Demo"}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
function FormInput({
  label,
  value,
  onChange,
  testid,
  type = "text",
  required,
  err,
}) {
  return (
    <div>
      <label
        className="text-[11.5px] uppercase tracking-[0.14em] font-semibold mb-1 block"
        style={{ color: FAINT }}
      >
        {label}
        {required ? " *" : ""}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="w-full h-10 px-3 rounded-lg border text-[13.5px] outline-none"
        style={{
          borderColor: err ? "#B04D26" : BORDER2,
          background: "#fbfbfa",
        }}
        data-testid={testid}
      />
    </div>
  );
}

/* ============ Footer ============ */
function Footer() {
  return (
    <footer
      className="px-6"
      style={{
        background: FOOTER_BG,
        color: FOOTER_TEXT,
        padding: "64px 32px 40px",
        ...FONT,
      }}
      data-testid="landing-footer"
    >
      <div className="max-w-[1120px] mx-auto grid grid-cols-1 md:grid-cols-[1.4fr_1fr_1fr_1fr] gap-12">
        <div>
          <div className="text-[22px] font-semibold tracking-[0.16em] text-white">
            INOS
          </div>
          <div
            className="mt-2 text-[13px] max-w-[280px]"
            style={{ color: FOOTER_TEXT }}
          >
            The operating system for architecture and interior firms.
          </div>
        </div>
        <FooterCol
          title="PRODUCT"
          items={[
            ["Apps", "#apps"],
            ["Pricing", "#pricing"],
            ["Dashboard", "/dashboard"],
          ]}
        />
        <FooterCol
          title="COMPANY"
          items={[
            ["About", "#about"],
            ["Connect", "#connect"],
          ]}
        />
        <FooterCol
          items={[
            ["Terms", "#"],
            ["Privacy", "#"],
          ]}
        />
      </div>
      <div
        className="max-w-[1120px] mx-auto mt-12 pt-6 flex flex-wrap items-center justify-between gap-4 text-[12px]"
        style={{ borderTop: "1px solid #2f3032", color: "#8a8c8e" }}
      >
        <div>© 2026 INOS Systems. All rights reserved.</div>
        <div className="flex gap-2">
          {["in", "X", "ig"].map((s) => (
            <span
              key={s}
              className="w-7 h-7 rounded-md flex items-center justify-center text-[11px]"
              style={{ border: "1px solid #2f3032", color: FOOTER_TEXT }}
            >
              {s}
            </span>
          ))}
        </div>
      </div>
    </footer>
  );
}
function FooterCol({ title, items }) {
  return (
    <div>
      {title && (
        <div
          className="text-[11px] uppercase tracking-[0.16em] font-semibold mb-3"
          style={{ color: "#8a8c8e" }}
        >
          {title}
        </div>
      )}
      <ul className="space-y-2 text-[13.5px]" style={{ color: FOOTER_TEXT }}>
        {items.map(([label, href]) => (
          <li key={label}>
            <a href={href} className="hover:text-white">
              {label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ============ Page ============ */
export default function LandingPage() {
  const { user, ready } = useAuth();
  const nav = useNavigate();
  useEffect(() => {
    if (ready && user) nav("/dashboard", { replace: true });
  }, [ready, user, nav]);
  return (
    <div style={{ background: PAGE_BG, ...FONT }} data-testid="landing-page">
      <style>{`html { scroll-behavior: smooth; } @media (max-width: 640px) { .hero-bg { display: none !important; } }`}</style>
      <Header />
      <Hero />
      <Apps />
      <Workflow />
      <Features />
      <DashboardPreview />
      <Pricing />
      <About />
      <Connect />
      <Footer />
    </div>
  );
}
