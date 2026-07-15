import { toast } from "sonner";

export const MAX_ATTACHMENT_BYTES = 8 * 1024 * 1024; // 8 MB per file

const readFileAsAttachment = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () =>
      resolve({
        name: file.name,
        mime: file.type,
        size: file.size,
        content_b64: String(reader.result).split(",")[1] || "",
        remark: "",
      });
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

/**
 * Reads a FileList into attachment objects, skipping (and toasting on)
 * anything over the 8 MB cap the backend also enforces.
 */
export async function readAttachments(fileList) {
  const files = Array.from(fileList || []);
  const results = [];
  for (const file of files) {
    if (file.size > MAX_ATTACHMENT_BYTES) {
      toast.error(`${file.name}: max 8 MB`);
      continue;
    }
    try {
      results.push(await readFileAsAttachment(file));
    } catch {
      toast.error(`Failed to read ${file.name}`);
    }
  }
  return results;
}

/** Shapes local attachment state into the payload createSiteReki expects. */
export function toAttachmentPayload(attachments) {
  return attachments.map((a) => ({
    filename: a.name,
    mime: a.mime,
    content_b64: a.content_b64,
    remark: a.remark || "",
  }));
}
