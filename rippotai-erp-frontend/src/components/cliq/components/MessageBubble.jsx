import { T } from "../theme";
import { formatClock } from "../helpers";
import { AttachmentPreview } from "./AttachmentPreview";

export function MessageBubble({ message }) {
  const time = formatClock(message.createdAt);
  const attachment = message.attachment;
  const isFile =
    message.isFile ||
    message.type === "file" ||
    Boolean(attachment?.fileId || attachment?.file);

  const isOwn = Boolean(message.isOwn);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 2,
        maxWidth: "80%",
        alignSelf: isOwn ? "flex-end" : "flex-start",
        alignItems: isOwn ? "flex-end" : "flex-start",
      }}
    >
      {!isOwn && message.senderName && (
        <span
          style={{
            padding: "0 2px",
            fontSize: 10,
            fontWeight: 700,
            color: T.muted,
          }}
        >
          {message.senderName}
        </span>
      )}

      <div
        style={{
          borderRadius: 12,
          padding: isFile && attachment ? "6px" : "7px 10px",
          fontSize: 12.5,
          lineHeight: 1.4,
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
          background: isOwn ? T.accent : T.surface,
          color: isOwn ? "#fff" : T.ink,
          border: isOwn ? "none" : `1px solid ${T.border}`,
          borderBottomRightRadius: isOwn ? 3 : 12,
          borderBottomLeftRadius: isOwn ? 12 : 3,
          boxShadow: isOwn ? "none" : "0 1px 2px rgba(15, 31, 26, 0.04)",
        }}
      >
        {isFile && attachment ? (
          <AttachmentPreview
            fileId={attachment.fileId}
            filename={attachment.file || message.text || "File"}
            mimeType={attachment.mimeType}
            size={attachment.size}
            isOwn={isOwn}
            compact
          />
        ) : (
          message.text
        )}
      </div>

      {time && (
        <span style={{ padding: "0 2px", fontSize: 9.5, color: T.muted }}>
          {time}
        </span>
      )}
    </div>
  );
}
