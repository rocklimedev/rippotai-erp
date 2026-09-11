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

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 2,
        maxWidth: "80%",
        alignSelf: message.isOwn ? "flex-end" : "flex-start",
        alignItems: message.isOwn ? "flex-end" : "flex-start",
      }}
    >
      {!message.isOwn && (
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
          background: message.isOwn ? T.accent : T.surface,
          color: message.isOwn ? "#fff" : T.ink,
          border: message.isOwn ? "none" : `1px solid ${T.border}`,
          borderBottomRightRadius: message.isOwn ? 3 : 12,
          borderBottomLeftRadius: message.isOwn ? 12 : 3,
        }}
      >
        {isFile && attachment ? (
          <AttachmentPreview
            fileId={attachment.fileId}
            filename={attachment.file || message.text || "File"}
            mimeType={attachment.mimeType}
            size={attachment.size}
            isOwn={message.isOwn}
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
