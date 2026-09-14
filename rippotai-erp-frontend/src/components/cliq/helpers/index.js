import { AVATAR_PALETTE } from "../theme";

export function getInitials(name = "") {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export function avatarColor(seed = "") {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length];
}

export function isChannel(chat) {
  const type = String(chat?.type || "").toLowerCase();
  return type.includes("channel") || type.includes("group");
}

export function chatPreview(chat) {
  if (chat.preview) return chat.preview;
  if (chat.email) return chat.email;
  if (chat.type === "thread") return chat.parentName || "Thread";

  const raw = chat?.raw || {};
  const candidate =
    raw.last_message_info ??
    raw.last_message ??
    raw.lastMessage ??
    raw.recent_message ??
    raw.snippet ??
    raw.last_message_text ??
    raw.description;

  if (typeof candidate === "string" && candidate.trim()) {
    return candidate.trim();
  }

  if (candidate && typeof candidate === "object") {
    const nested =
      candidate.text ?? candidate.message ?? candidate.content ?? null;
    if (typeof nested === "string" && nested.trim()) return nested.trim();
    if (nested && typeof nested.text === "string") return nested.text;
    if (candidate.type === "file" || nested?.file) return "Shared a file";
  }

  return isChannel(chat) ? "No recent activity" : "Tap to open conversation";
}

export function getTimestamp(value) {
  if (value === undefined || value === null || value === "") return 0;
  const numeric = Number(value);
  if (Number.isFinite(numeric)) {
    return numeric < 10000000000 ? numeric * 1000 : numeric;
  }
  const parsed = Date.parse(String(value));
  return Number.isFinite(parsed) ? parsed : 0;
}

export function formatClock(value) {
  const ts = getTimestamp(value);
  if (!ts) return "";
  return new Date(ts).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatBytes(size) {
  if (!size || size <= 0) return "";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export function targetFor(item, kind = "chat") {
  return { ...item, kind, chatId: item.chatId || null };
}

export function personChat(person, chats) {
  return chats.find(
    (chat) =>
      !isChannel(chat) &&
      chat.type !== "thread" &&
      ((chat.participantId && chat.participantId === person.id) ||
        [
          chat.raw?.participant?.email_id,
          chat.raw?.participant?.email,
          chat.raw?.user?.email_id,
          chat.raw?.contact?.email,
        ].some(
          (email) =>
            email &&
            person.email &&
            String(email).toLowerCase() === person.email.toLowerCase(),
        )),
  );
}

/** Detect media type from mime or filename */
export function getMediaType(mimeType, filename = "") {
  const ext = filename.split(".").pop()?.toLowerCase();

  if (mimeType?.startsWith("image/")) return "image";
  if (mimeType?.startsWith("video/")) return "video";
  if (mimeType === "application/pdf") return "pdf";

  // fallback by extension if mimeType is missing/generic (octet-stream)
  if (["mp4", "webm", "mov", "m4v", "ogg"].includes(ext)) return "video";
  if (["png", "jpg", "jpeg", "gif", "webp"].includes(ext)) return "image";
  if (ext === "pdf") return "pdf";

  return "file";
}

export function isImageMedia(mimeType, filename) {
  return getMediaType(mimeType, filename) === "image";
}

export function isPdfMedia(mimeType, filename) {
  return getMediaType(mimeType, filename) === "pdf";
}
export function normalizeCliqMessage(raw, currentCliqUserId) {
  const senderId = raw.sender?.id ?? raw.sender_id ?? null;
  const senderName = raw.sender?.name || raw.sender_name || "Unknown";

  const myId = String(currentCliqUserId ?? "").trim();
  const isOwn = Boolean(myId) && String(senderId ?? "").trim() === myId;

  const isDeleted = raw.type === "deleted" || raw.content?.deleted === true;
  const rawFile = raw.content?.file;
  const isFile = raw.type === "file" && Boolean(rawFile);

  let text = "";
  if (isDeleted) {
    text = "This message was deleted";
  } else if (raw.content?.text) {
    text = raw.content.text;
  }

  const attachment = isFile
    ? {
        fileId: rawFile.id,
        file: rawFile.name,
        mimeType: rawFile.type,
        size: rawFile.dimensions?.size,
      }
    : null;

  return {
    id: raw.id,
    text,
    senderId,
    senderName,
    createdAt: raw.time, // epoch ms
    isOwn,
    isFile,
    isDeleted,
    attachment,
  };
}
