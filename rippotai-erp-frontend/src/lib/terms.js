// Keep HTML at the storage boundary; people write and edit ordinary text.
export function termsToText(value) {
  const source = String(value || "");
  if (!/<\/?[a-z][^>]*>/i.test(source)) return source;
  const doc = new DOMParser().parseFromString(source, "text/html");
  doc.querySelectorAll("script, style").forEach((node) => node.remove());
  doc.querySelectorAll("br").forEach((node) => node.replaceWith("\n"));
  doc.querySelectorAll("li, p, div, h1, h2, h3, h4, h5, h6").forEach((node) => node.append("\n"));
  return (doc.body.textContent || "").split(/\n/).map((line) => line.trim()).filter(Boolean).join("\n");
}

export function textToTermsHtml(value) {
  const escape = (text) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  const lines = String(value || "").split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  return lines.length ? `<ol>${lines.map((line) => `<li>${escape(line)}</li>`).join("")}</ol>` : "";
}
