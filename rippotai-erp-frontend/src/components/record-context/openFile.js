// Open an uploaded file in a NEW TAB without losing the user's place.
// Signed file links (from API responses) open directly; API download paths
// need the auth header, so the file is fetched as a blob and the tab is
// pointed at its object URL. The tab is opened synchronously (before the
// fetch) so popup blockers allow it.
import { toast } from "sonner";
import { authenticatedFetch } from "@/lib/http-client";
import { API_URL } from "@/lib/config";

const isSigned = (url) => /^https?:\/\//.test(url || "") && /[?&](signature|expires)=/.test(url);

export async function openInNewTab(source, { title } = {}) {
  if (!source) return;
  if (isSigned(source)) {
    window.open(source, "_blank", "noopener,noreferrer");
    return;
  }
  const tab = window.open("", "_blank");
  if (tab) {
    try {
      tab.opener = null;
      tab.document.title = title || "Opening…";
      tab.document.body.style.cssText = "font:14px system-ui,sans-serif;color:#4d4d4d;padding:24px";
      tab.document.body.textContent = "Opening file…";
    } catch {
      /* cross-origin tab */
    }
  }
  try {
    const path = /^https?:\/\//.test(source) ? source : `${API_URL}${source}`;
    const res = await authenticatedFetch(path);
    if (!res.ok) {
      let msg = "Could not open the file.";
      try {
        msg = (await res.json())?.message || msg;
      } catch {
        /* not json */
      }
      throw new Error(msg);
    }
    const url = URL.createObjectURL(await res.blob());
    if (tab && !tab.closed) tab.location.href = url;
    else window.open(url, "_blank", "noopener");
    setTimeout(() => URL.revokeObjectURL(url), 10 * 60 * 1000);
  } catch (e) {
    if (tab && !tab.closed) tab.close();
    toast.error(e.message || "Could not open the file.");
  }
}

/** API path of a file version of an uploaded document / drawing. */
export function fileOpenPath(type, recordId, file) {
  if (!recordId) return null;
  if (type === "drawing") return file?.id ? `/drawings/${recordId}/revisions/${file.id}/download` : null;
  if (type === "document") {
    if (!file || file.current) return `/documents/${recordId}/download`;
    return `/documents/${recordId}/versions/${file.id}/download`;
  }
  return null;
}
