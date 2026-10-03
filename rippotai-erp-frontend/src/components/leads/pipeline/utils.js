// Small shared helpers for the CRM pipeline UI.

export const todayISO = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
};

export const isPast = (dateStr) => {
  if (!dateStr) return false;
  return String(dateStr).slice(0, 10) < todayISO();
};

export const shortDate = (value) => {
  if (!value) return "—";
  const d = new Date(String(value).length <= 10 ? `${value}T00:00:00` : value);
  if (Number.isNaN(d.getTime())) return String(value);
  const sameYear = d.getFullYear() === new Date().getFullYear();
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    ...(sameYear ? {} : { year: "numeric" }),
  });
};

export const dateTime = (value) => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
};

export const relative = (value) => {
  if (!value) return "";
  const diff = Date.now() - new Date(value).getTime();
  const m = Math.round(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} h ago`;
  const d = Math.round(h / 24);
  if (d < 30) return `${d} d ago`;
  return shortDate(value);
};

export const errorText = (err, fallback = "Something went wrong.") => {
  const m = err?.data?.message;
  if (Array.isArray(m)) return m.join(", ");
  return m || err?.error || fallback;
};

// Rupee input helpers: user types lakh / crore friendly values
export const parseRupees = (raw) => {
  if (raw == null || raw === "") return null;
  const s = String(raw).trim().toLowerCase().replace(/[₹,\s]/g, "");
  const m = s.match(/^([\d.]+)(cr|crore|l|lakh|lac|k)?$/);
  if (!m) return NaN;
  const n = parseFloat(m[1]);
  const unit = m[2] || "";
  if (unit.startsWith("c")) return n * 1e7;
  if (unit.startsWith("l")) return n * 1e5;
  if (unit === "k") return n * 1e3;
  return n;
};
