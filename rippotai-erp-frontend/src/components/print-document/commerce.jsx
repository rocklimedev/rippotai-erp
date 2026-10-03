// Commerce add-on for the print kit (docs-commerce): company profile, Indian amount-in-words,
// party blocks, bank details and helpers shared by quotations, POs, work orders, challans, BOQs.
// Additive only — nothing here changes the behaviour of the kit's own exports.
import React, { useMemo } from "react";
import { useGetSettingsQuery } from "@/api/meta/settings.api";
import { has, money, fmtDate } from "./format";
import { KV, kvHas } from "./primitives";
import { downloadDocumentPdf } from "./download";
import "./commerce.css";

/** Pass as <PrintDocument className={COMMERCE_CLASS}> for denser, tabular item tables. */
export const COMMERCE_CLASS = "pd-doc--commerce";

/* ------------------------------------------------------------ company profile */

// Defaults are the details already printed on Rippotai work orders. Anything else
// (GSTIN, PAN, bank) is read from Settings keys and simply hidden when not set.
const COMPANY_DEFAULTS = {
  name: "Rippotai Architecture",
  address: "B-3/33, Mianwali Nagar, New Delhi 110087",
  phone: "+91 88828 30560",
  email: "sagar@rippotai.in",
};

const SETTING_KEYS = {
  name: ["company_name", "company.name"],
  legalName: ["company_legal_name"],
  address: ["company_address", "company.address"],
  phone: ["company_phone", "company.phone"],
  email: ["company_email", "company.email"],
  website: ["company_website"],
  gstin: ["company_gstin", "gstin", "company.gstin"],
  pan: ["company_pan", "pan", "company.pan"],
  logoUrl: ["company_logo_url"],
  bankName: ["bank_name", "company_bank_name"],
  bankAccountName: ["bank_account_name", "company_bank_account_name"],
  bankAccountNumber: ["bank_account_number", "company_bank_account_number"],
  bankIfsc: ["bank_ifsc", "company_bank_ifsc"],
  bankBranch: ["bank_branch", "company_bank_branch"],
  bankUpi: ["bank_upi", "company_upi"],
};

// Admin Console → Company profile stores two JSON settings; map their fields here.
// (Flat keys above win when both exist.)
export const COMPANY_PROFILE_KEY = "company_profile";
export const BANK_DETAILS_KEY = "bank_details";
const JSON_FIELDS = {
  [COMPANY_PROFILE_KEY]: {
    name: "name", legalName: "legalName", address: "address", phone: "phone", email: "email",
    website: "website", gstin: "gstin", pan: "pan", logoUrl: "logoUrl",
  },
  [BANK_DETAILS_KEY]: {
    bankName: "bank", bankAccountName: "accountName", bankAccountNumber: "accountNumber",
    bankIfsc: "ifsc", bankBranch: "branch", bankUpi: "upi",
  },
};

/** Settings values are JSON columns — MariaDB may hand them back as strings. */
export const settingObject = (v) => {
  if (v && typeof v === "object") return v;
  if (typeof v !== "string" || !/^\s*[{[]/.test(v)) return null;
  try {
    const o = JSON.parse(v);
    return o && typeof o === "object" ? o : null;
  } catch {
    return null;
  }
};

export function companyFromSettings(settings) {
  const list = Array.isArray(settings) ? settings : Array.isArray(settings?.data) ? settings.data : [];
  const map = {};
  const raw = {};
  list.forEach((s) => {
    if (s && s.key != null) {
      const k = String(s.key).toLowerCase();
      raw[k] = s.value;
      map[k] = typeof s.value === "string" ? s.value.trim() : s.value;
    }
  });
  const out = { ...COMPANY_DEFAULTS };
  Object.entries(JSON_FIELDS).forEach(([key, fields]) => {
    const obj = settingObject(raw[key]);
    if (!obj) return;
    Object.entries(fields).forEach(([field, prop]) => {
      const v = typeof obj[prop] === "string" ? obj[prop].trim() : obj[prop];
      if (has(v)) out[field] = v;
    });
  });
  Object.entries(SETTING_KEYS).forEach(([field, keys]) => {
    const hit = keys.map((k) => map[k]).find((v) => has(v) && typeof v !== "object");
    if (has(hit)) out[field] = hit;
  });
  return out;
}

/** Rippotai's letterhead details (defaults + Settings overrides). */
export function useCompanyProfile() {
  const { data } = useGetSettingsQuery();
  return useMemo(() => companyFromSettings(data), [data]);
}

/* ------------------------------------------------------------ vendor helpers */

/** Vendors keep "GSTIN: … | PAN: …" in notes — pull those out. */
export function parseTaxIds(notes) {
  const s = String(notes || "");
  const gstin = (s.match(/GSTIN\s*[:\-]\s*([0-9A-Z]{15})/i) || [])[1];
  const pan = (s.match(/PAN\s*[:\-]\s*([A-Z]{5}[0-9]{4}[A-Z])/i) || [])[1];
  return { gstin: gstin ? gstin.toUpperCase() : "", pan: pan ? pan.toUpperCase() : "" };
}

/** +919811022110 → +91 98110 22110 */
export function fmtPhone(p) {
  const s = String(p || "").trim();
  const m = s.replace(/[\s-]/g, "").match(/^(\+91)?(\d{5})(\d{5})$/);
  return m ? `${m[1] ? "+91 " : ""}${m[2]} ${m[3]}` : s;
}

/* ------------------------------------------------------------ numbers */

const ONES = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve",
  "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
const two = (n) => (n < 20 ? ONES[n] : `${TENS[Math.floor(n / 10)]}${n % 10 ? ` ${ONES[n % 10]}` : ""}`);
const three = (n) => {
  const h = Math.floor(n / 100);
  const r = n % 100;
  return [h ? `${ONES[h]} Hundred` : "", r ? two(r) : ""].filter(Boolean).join(" ");
};
function intWords(n) {
  if (n === 0) return "Zero";
  const parts = [];
  const crore = Math.floor(n / 1e7);
  n %= 1e7;
  const lakh = Math.floor(n / 1e5);
  n %= 1e5;
  const thousand = Math.floor(n / 1e3);
  n %= 1e3;
  if (crore) parts.push(`${intWords(crore)} Crore`);
  if (lakh) parts.push(`${two(lakh)} Lakh`);
  if (thousand) parts.push(`${two(thousand)} Thousand`);
  if (n) parts.push(three(n));
  return parts.join(" ");
}
/** 1983922.2 → "Rupees Nineteen Lakh Eighty Three Thousand Nine Hundred Twenty Two and Twenty Paise only" */
export function amountInWords(value) {
  const x = Math.round(Number(value) * 100) / 100;
  if (!Number.isFinite(x) || x <= 0) return "";
  const rupees = Math.floor(x);
  const paise = Math.round((x - rupees) * 100);
  return `Rupees ${intWords(rupees)}${paise ? ` and ${two(paise)} Paise` : ""} only`;
}

/** Quantity: up to 3 decimals, Indian grouping, trailing zeros dropped. */
export const qty = (n) => {
  const x = Number(n);
  if (n === null || n === undefined || n === "" || !Number.isFinite(x)) return "";
  return x.toLocaleString("en-IN", { maximumFractionDigits: 3 });
};
/** Money with paise (₹1,450.00) — for rate / amount columns. */
export const rs = (n) => money(n, 2);

/** Split stored T&C text (newline / numbered / HTML list) into items. */
export function termsList(value) {
  if (!has(value)) return [];
  let s = String(value);
  if (/<[a-z][\s\S]*>/i.test(s)) {
    const doc = new DOMParser().parseFromString(s, "text/html");
    const lis = Array.from(doc.querySelectorAll("li")).map((li) => li.textContent.trim()).filter(Boolean);
    if (lis.length) return lis;
    s = Array.from(doc.body.querySelectorAll("p,div,br"))
      .map((n) => n.textContent)
      .join("\n") || doc.body.textContent || "";
  }
  return s
    .split(/\n+/)
    .map((t) => t.replace(/^\s*(\d+[.)]|[-•*])\s*/, "").trim())
    .filter(Boolean);
}

export const addDays = (date, days) => {
  if (!has(date) || !Number(days)) return "";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  d.setDate(d.getDate() + Number(days));
  return d.toISOString().slice(0, 10);
};

/* ------------------------------------------------------------ blocks */

/**
 * Side-by-side party cards (From / To / Ship to …).
 * parties: [{ title, name, lines: [string], items: [{label, value}] }] — empties hidden.
 */
export function Parties({ parties }) {
  const shown = (parties || []).filter((p) => p && (has(p.name) || (p.lines || []).some(has) || kvHas(p.items)));
  if (!shown.length) return null;
  return (
    <div className="pd-parties" style={{ gridTemplateColumns: `repeat(${Math.min(shown.length, 3)}, 1fr)` }}>
      {shown.map((p) => (
        <div key={p.title} className="pd-party">
          <span className="pd-party__title">{p.title}</span>
          {has(p.name) && <div className="pd-party__name">{p.name}</div>}
          {(p.lines || []).filter(has).map((l, i) => (
            <div key={i} className="pd-party__line">
              {l}
            </div>
          ))}
          {kvHas(p.items) && (
            <dl className="pd-party__kv">
              {p.items
                .filter((i) => i && has(i.value))
                .map((i) => (
                  <div key={i.label}>
                    <dt>{i.label}</dt>
                    <dd>{i.value}</dd>
                  </div>
                ))}
            </dl>
          )}
        </div>
      ))}
    </div>
  );
}

/** Rippotai as a party (letterhead details). */
export const companyParty = (company, title = "From") => ({
  title,
  name: company.name,
  lines: [company.address, [company.phone, company.email].filter(has).join(" · ")],
  items: [
    { label: "GSTIN", value: company.gstin },
    { label: "PAN", value: company.pan },
  ],
});

/** Bank details block — only when the account number is configured. */
export function BankDetails({ company }) {
  if (!company || !has(company.bankAccountNumber)) return null;
  return (
    <KV
      cols={3}
      items={[
        { label: "Account name", value: company.bankAccountName || company.name },
        { label: "Bank", value: company.bankName, sub: company.bankBranch },
        { label: "Account no.", value: company.bankAccountNumber },
        { label: "IFSC", value: company.bankIfsc },
        { label: "UPI", value: company.bankUpi },
      ]}
    />
  );
}

/** Section blocks for bank details — [] when no account is configured (so the section is dropped). */
export const bankBlocks = (company) =>
  company && has(company.bankAccountNumber) ? [<BankDetails key="bank" company={company} />] : [];

/** Totals lines helper: drops zero / empty optional lines. */
export function totalLines(lines) {
  return (lines || []).filter((l) => l && (l.grand || l.always || (has(l.value) && Number(l.value) !== 0)));
}

export { fmtDate };

/* ------------------------------------------------------------ off-screen download */

/** Wait until a <PrintDocument> has paginated (inner pages rendered and stable). */
export async function waitForPages(root, { timeout = 6000 } = {}) {
  await (document.fonts?.ready || Promise.resolve());
  const start = Date.now();
  let last = -1;
  let stable = 0;
  while (Date.now() - start < timeout) {
    await new Promise((r) => setTimeout(r, 120));
    const n = root ? root.querySelectorAll(".pd-page").length : 0;
    if (n > 1 && n === last) {
      stable += 1;
      if (stable >= 2) return n;
    } else stable = 0;
    last = n;
  }
  return last;
}

/** Download a (possibly just-mounted, off-screen) PrintDocument once it has paginated. */
export async function downloadWhenReady(getRoot, fileName, opts) {
  let root = getRoot();
  const t0 = Date.now();
  while (!root && Date.now() - t0 < 3000) {
    await new Promise((r) => setTimeout(r, 60));
    root = getRoot();
  }
  if (!root) throw new Error("Document is not ready");
  await waitForPages(root);
  return downloadDocumentPdf(root, fileName, opts);
}

/** Style for a host that keeps a document laid out but off-screen. */
export const OFFSCREEN_STYLE = { position: "fixed", left: "-20000px", top: 0, pointerEvents: "none" };
