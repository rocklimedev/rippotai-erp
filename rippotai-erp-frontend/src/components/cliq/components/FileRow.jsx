import { AttachmentPreview } from "./AttachmentPreview";

/**
 * Row used in the Files panel of a conversation.
 * Reuses AttachmentPreview so images / PDFs open in the same in-app modal.
 */
export function FileRow({ item }) {
  return (
    <div style={{ marginBottom: 2 }}>
      <AttachmentPreview
        fileId={item.fileId}
        filename={item.name}
        mimeType={item.mimeType}
        size={item.size}
        comment={
          [item.senderName, item.comment].filter(Boolean).join(" · ") ||
          undefined
        }
      />
    </div>
  );
}
