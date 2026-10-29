import { useEffect, useState } from "react";
import { Button, EmptyState } from "@/components/inos";
import { authenticatedFetch } from "@/lib/http-client";
import { API_URL } from "@/lib/config";

// Fetch authorized bytes instead of framing the CDN's protected response.
export default function DrawingPreview({ drawingId, revision, kind, title, downloadPath }) {
  const [attempt, setAttempt] = useState(0);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState("");
  const identity = `${drawingId}:${revision.id}:${revision.storageFilename || revision.updatedAt || ""}`;

  useEffect(() => {
    const controller = new AbortController();
    let objectUrl;
    (async () => {
      try {
        const response = await authenticatedFetch(`${API_URL}${downloadPath || `/drawings/${drawingId}/revisions/${revision.id}/download`}`, { signal: controller.signal });
        if (!response.ok) throw new Error("Could not load the drawing preview. Try again or download the file.");
        const bytes = await response.blob();
        if (controller.signal.aborted) return;
        const extension = revision.filename?.split(".").pop()?.toLowerCase();
        const mime = kind === "pdf" ? "application/pdf" : ({ png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", webp: "image/webp", gif: "image/gif", bmp: "image/bmp", svg: "image/svg+xml", avif: "image/avif" })[extension] || revision.mime || bytes.type;
        objectUrl = URL.createObjectURL(new Blob([bytes], { type: mime }));
        setPreview({ identity, url: objectUrl });
      } catch (failure) {
        if (!controller.signal.aborted) setError(failure.message);
      }
    })();
    return () => {
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [drawingId, revision.id, revision.storageFilename, revision.updatedAt, revision.filename, revision.mime, kind, identity, attempt, downloadPath]);

  if (error) return <EmptyState title="Preview unavailable" text={error} action={<Button variant="secondary" onClick={() => { setError(""); setPreview(null); setAttempt((value) => value + 1); }}>Retry preview</Button>} />;
  if (preview?.identity !== identity) return <p role="status">Loading drawing preview…</p>;
  return kind === "image"
    ? <img src={preview.url} alt={title} />
    : <iframe title="Drawing preview" src={preview.url} />;
}
