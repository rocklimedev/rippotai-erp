// Keep only document formatting, never pasted scripts, styles, links or event attributes.
export function cleanRichText(value) {
  const source = String(value ?? "");
  const escape = (text) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  if (!/<\/?[a-z][^>]*>/i.test(source)) return escape(source).replace(/\r?\n/g, "<br>");
  const doc = new DOMParser().parseFromString(source, "text/html");
  doc.querySelectorAll("script,style,iframe,object,svg,math,template").forEach((node) => node.remove());
  const allowed = new Set(["B", "STRONG", "I", "EM", "U", "BR", "P", "DIV", "OL", "UL", "LI"]);
  const render = (node) => {
    if (node.nodeType === 3) return escape(node.textContent);
    const content = Array.from(node.childNodes).map(render).join("");
    if (!allowed.has(node.nodeName)) return content;
    const tag = node.nodeName.toLowerCase();
    return tag === "br" ? "<br>" : `<${tag}>${content}</${tag}>`;
  };
  return Array.from(doc.body.childNodes).map(render).join("");
}
