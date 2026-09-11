import { useCallback, useEffect, useRef, useState } from "react";
// Adjust this path to match your project layout (same as original cliq.api import)
import { useDownloadCliqFileMutation } from "../../../api/connectors/cliq.api";
import { T } from "../theme";
import { formatBytes, getMediaType } from "../helpers";
import { PdfIcon, FileIcon, DownloadIcon } from "../icons";
import { MediaModal } from "./MediaModal";

/**
 * Renders an attachment:
 * - Images show an inline thumbnail (like Cliq)
 * - PDFs / other files show an icon + name
 * - Click opens MediaModal (image or PDF) inside the app
 */
export function AttachmentPreview({
  fileId,
  filename = "File",
  mimeType,
  size,
  comment,
  isOwn = false,
  compact = false, // tighter style for chat bubbles
}) {
  const [downloadFile] = useDownloadCliqFileMutation();
  const [thumbUrl, setThumbUrl] = useState(null);
  const [modalUrl, setModalUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const objectUrlsRef = useRef([]);

  const mediaType = getMediaType(mimeType, filename);
  const isImage = mediaType === "image";
  const isPdf = mediaType === "pdf";

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      objectUrlsRef.current.forEach((url) => {
        try {
          URL.revokeObjectURL(url);
        } catch {
          /* ignore */
        }
      });
      objectUrlsRef.current = [];
    };
  }, []);

  const fetchObjectUrl = useCallback(async () => {
    if (!fileId) return null;
    setLoading(true);
    setError("");
    try {
      const result = await downloadFile({
        fileId,
        filename,
      }).unwrap();
      const url = result.objectUrl;
      if (url) {
        objectUrlsRef.current.push(url);
        return url;
      }
      return null;
    } catch (err) {
      const msg =
        err?.data?.message || err?.error || err?.message || "Failed to load";
      setError(typeof msg === "string" ? msg : "Failed to load file");
      return null;
    } finally {
      setLoading(false);
    }
  }, [downloadFile, fileId, filename]);

  // Preload thumbnail for images
  useEffect(() => {
    if (!isImage || !fileId || thumbUrl) return;
    let cancelled = false;
    (async () => {
      const url = await fetchObjectUrl();
      if (!cancelled && url) setThumbUrl(url);
    })();
    return () => {
      cancelled = true;
    };
  }, [isImage, fileId, thumbUrl, fetchObjectUrl]);

  const openModal = async () => {
    if (modalUrl) {
      // already have it
      return;
    }
    // Prefer existing thumb for images
    if (thumbUrl) {
      setModalUrl(thumbUrl);
      return;
    }
    const url = await fetchObjectUrl();
    if (url) setModalUrl(url);
  };

  const closeModal = () => {
    setModalUrl(null);
  };

  const handleDownload = async () => {
    let url = modalUrl || thumbUrl;
    if (!url) {
      url = await fetchObjectUrl();
    }
    if (!url) return;
    const a = document.createElement("a");
    a.href = url;
    a.download = filename || "download";
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const accentBg = isOwn ? "rgba(255,255,255,0.15)" : T.accentSoft;
  const accentColor = isOwn ? "#fff" : T.accent;
  const textColor = isOwn ? "#fff" : T.ink;
  const mutedColor = isOwn ? "rgba(255,255,255,0.75)" : T.muted;

  // ---- Image inline preview (Cliq-style) ----
  if (isImage) {
    return (
      <>
        <button
          type="button"
          onClick={openModal}
          aria-label={`View image ${filename}`}
          style={{
            display: "block",
            padding: 0,
            border: "none",
            background: "transparent",
            cursor: "pointer",
            borderRadius: 10,
            overflow: "hidden",
            maxWidth: compact ? 220 : 260,
            textAlign: "left",
          }}
        >
          {thumbUrl ? (
            <img
              src={thumbUrl}
              alt={filename}
              style={{
                display: "block",
                width: "100%",
                maxHeight: 200,
                objectFit: "cover",
                borderRadius: 10,
              }}
            />
          ) : (
            <div
              style={{
                width: compact ? 160 : 200,
                height: 120,
                borderRadius: 10,
                background: accentBg,
                color: accentColor,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 12,
              }}
            >
              {loading ? "Loading…" : error || "Image"}
            </div>
          )}
          {!compact && (
            <div
              style={{
                marginTop: 4,
                fontSize: 11,
                color: mutedColor,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {filename}
            </div>
          )}
        </button>

        <MediaModal
          open={Boolean(modalUrl)}
          onClose={closeModal}
          objectUrl={modalUrl}
          mediaType="image"
          filename={filename}
          mimeType={mimeType}
          size={size}
          onDownload={handleDownload}
        />
      </>
    );
  }

  // ---- PDF / generic file card ----
  const Icon = isPdf ? PdfIcon : FileIcon;

  return (
    <>
      <button
        type="button"
        onClick={isPdf || isImage ? openModal : undefined}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          width: "100%",
          maxWidth: 280,
          padding: "8px 10px",
          borderRadius: 10,
          border: isOwn
            ? "1px solid rgba(255,255,255,0.25)"
            : `1px solid ${T.border}`,
          background: isOwn ? "rgba(255,255,255,0.08)" : T.surface,
          color: textColor,
          cursor: isPdf ? "pointer" : "default",
          textAlign: "left",
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            background: accentBg,
            color: accentColor,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Icon />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 12.5,
              fontWeight: 600,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {filename}
          </div>
          <div style={{ fontSize: 10.5, color: mutedColor, marginTop: 2 }}>
            {[isPdf ? "PDF" : mimeType, formatBytes(size)]
              .filter(Boolean)
              .join(" · ")}
            {isPdf && " · Click to view"}
          </div>
          {comment ? (
            <div
              style={{
                fontSize: 11,
                color: mutedColor,
                marginTop: 2,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {comment}
            </div>
          ) : null}
        </div>

        {!isPdf && (
          <span
            role="button"
            tabIndex={0}
            aria-label="Download"
            onClick={(e) => {
              e.stopPropagation();
              handleDownload();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.stopPropagation();
                handleDownload();
              }
            }}
            style={{
              display: "flex",
              height: 28,
              width: 28,
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 7,
              color: mutedColor,
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            <DownloadIcon />
          </span>
        )}
      </button>

      {isPdf && (
        <MediaModal
          open={Boolean(modalUrl)}
          onClose={closeModal}
          objectUrl={modalUrl}
          mediaType="pdf"
          filename={filename}
          mimeType={mimeType}
          size={size}
          onDownload={handleDownload}
        />
      )}
    </>
  );
}
