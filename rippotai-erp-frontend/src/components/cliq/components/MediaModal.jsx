import { useEffect, useRef } from "react";
import { T } from "../theme";
import { CloseIcon, DownloadIcon } from "../icons";
import { formatBytes } from "../helpers";

export function MediaModal({
  open,
  onClose,
  objectUrl,
  mediaType, // "image" | "pdf" | "file"
  filename = "file",
  mimeType,
  size,
  onDownload,
}) {
  const overlayRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open || !objectUrl) return null;

  const isImage = mediaType === "image";
  const isPdf = mediaType === "pdf";

  // Chrome's built-in PDF viewer ships its own toolbar with its own
  // Download/Print icons that ignore our filename and save under the
  // blob's internal id. Hide it so people only ever use our header
  // Download button, which sets the correct filename.
  const iframeSrc = isPdf ? `${objectUrl}#toolbar=0&navpanes=0` : objectUrl;

  return (
    <div
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-label={`View ${filename}`}
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 200,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(15, 31, 26, 0.72)",
        padding: 16,
      }}
    >
      <div
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          maxWidth: isImage ? "min(920px, 96vw)" : "min(960px, 96vw)",
          maxHeight: "92vh",
          width: isPdf ? "96vw" : "auto",
          background: T.surface,
          borderRadius: 14,
          border: `1px solid ${T.border}`,
          boxShadow: "0 24px 64px rgba(15, 31, 26, 0.35)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "10px 14px",
            borderBottom: `1px solid ${T.border}`,
            background: T.surfaceAlt,
            flexShrink: 0,
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: T.ink,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {filename}
            </div>
            {(mimeType || size) && (
              <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>
                {[mimeType, formatBytes(size)].filter(Boolean).join(" · ")}
              </div>
            )}
          </div>

          {onDownload && (
            <button
              type="button"
              aria-label="Download"
              onClick={onDownload}
              style={{
                display: "flex",
                height: 30,
                width: 30,
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 8,
                border: "none",
                background: "transparent",
                color: T.muted,
                cursor: "pointer",
              }}
            >
              <DownloadIcon />
            </button>
          )}

          <button
            type="button"
            aria-label="Close viewer"
            onClick={onClose}
            style={{
              display: "flex",
              height: 30,
              width: 30,
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 8,
              border: "none",
              background: "transparent",
              color: T.muted,
              cursor: "pointer",
            }}
          >
            <CloseIcon />
          </button>
        </div>

        <div
          style={{
            flex: 1,
            minHeight: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: isImage ? "#0f1f1a" : T.surfaceAlt,
            overflow: "auto",
          }}
        >
          {isImage ? (
            <img
              src={objectUrl}
              alt={filename}
              style={{
                maxWidth: "100%",
                maxHeight: "calc(92vh - 56px)",
                objectFit: "contain",
                display: "block",
              }}
            />
          ) : isPdf ? (
            <iframe
              title={filename}
              src={iframeSrc}
              style={{
                width: "100%",
                height: "calc(92vh - 56px)",
                minHeight: 420,
                border: "none",
                background: "#fff",
              }}
            />
          ) : (
            <div
              style={{
                padding: 32,
                textAlign: "center",
                color: T.muted,
                fontSize: 13,
              }}
            >
              Preview not available for this file type.
              <br />
              Use Download to save it.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
