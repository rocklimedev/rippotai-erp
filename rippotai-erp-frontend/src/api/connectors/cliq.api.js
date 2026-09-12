import { baseApi } from "../../store/baseApi";

// ============================================================
// OWNER KEY
// ============================================================

const getOwnerKey = () => {
  try {
    const raw = localStorage.getItem("bc_user");

    if (!raw) {
      return null;
    }

    const user = JSON.parse(raw);

    return user?.id ?? user?._id ?? null;
  } catch {
    return null;
  }
};

// ============================================================
// SAFE HELPERS
// ============================================================

const isPlainObject = (value) =>
  value !== null && typeof value === "object" && !Array.isArray(value);

/**
 * Convert ANY value to something React-safe.
 *
 * Never return an object from this function.
 */
const toText = (value, fallback = "") => {
  if (value === undefined || value === null) {
    return fallback;
  }

  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return String(value);
  }

  if (Array.isArray(value)) {
    const text = value
      .map((item) => toText(item, ""))
      .filter(Boolean)
      .join(", ");

    return text || fallback;
  }

  if (isPlainObject(value)) {
    // Most likely text/content fields first.
    const candidates = [
      value.text,
      value.message,
      value.content,
      value.value,
      value.title,
      value.label,
      value.name,
      value.display_name,
      value.displayName,

      // File fields.
      value.file,
      value.filename,
      value.file_name,
      value.fileName,

      // URL fields.
      value.url,
      value.link,
    ];

    for (const candidate of candidates) {
      if (candidate !== undefined && candidate !== null && candidate !== "") {
        const result = toText(candidate, "");

        if (result) {
          return result;
        }
      }
    }

    return fallback;
  }

  return fallback;
};

/**
 * Resolve an ID from primitive/object values.
 */
const getId = (value) => {
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }

  if (isPlainObject(value)) {
    const id =
      value.id ??
      value.chat_id ??
      value.chatId ??
      value.channel_id ??
      value.channelId ??
      value.user_id ??
      value.userId ??
      value.message_id ??
      value.messageId ??
      value.file_id ??
      value.fileId;

    if (id !== undefined && id !== null && id !== "") {
      return String(id);
    }
  }

  return null;
};

/**
 * Get first available value.
 */
const getValue = (record, ...keys) => {
  if (!record || typeof record !== "object") {
    return null;
  }

  for (const key of keys) {
    const value = record[key];

    if (value !== undefined && value !== null && value !== "") {
      return value;
    }
  }

  return null;
};

/**
 * Resolve Zoho user/reference objects.
 */
const flattenRef = (ref) => {
  if (!ref) {
    return null;
  }

  if (typeof ref === "string" || typeof ref === "number") {
    return String(ref);
  }

  if (!isPlainObject(ref)) {
    return null;
  }

  return toText(
    ref.name ??
      ref.title ??
      ref.display_name ??
      ref.displayName ??
      ref.full_name ??
      ref.fullName ??
      ref.email ??
      ref.username ??
      ref.user_name,
    null,
  );
};

// ============================================================
// CHANNEL NORMALIZATION
// ============================================================
//
// IMPORTANT: a Cliq channel has TWO distinct identifiers —
// CHANNEL_ID (the channel object) and CHAT_ID (the message
// stream). They are NOT interchangeable. Message history and
// sending both key off CHAT_ID, so `id` / `chatId` below prefer
// chat_id over channel_id. `channelId` is kept separately for
// anything that specifically needs the channel object.
// `uniqueName` is required for POST /channels/:channelUniqueName/message
// ============================================================

const normalizeChannel = (record = {}, index = 0) => {
  const chatIdValue = getValue(record, "chat_id", "chatId");

  const channelIdValue = getValue(record, "channel_id", "channelId", "id");

  // Prefer chat_id for the message stream identifier.
  const chatId =
    getId(chatIdValue) || getId(channelIdValue) || `channel-${index}`;

  const channelId = getId(channelIdValue) || chatId;

  const name = toText(
    getValue(
      record,
      "title",
      "channel_name",
      "channelName",
      "name",
      "display_name",
      "displayName",
      "unique_name",
      "uniqueName",
    ),
    `Channel ${index + 1}`,
  );

  const uniqueName = toText(
    getValue(record, "unique_name", "uniqueName", "name"),
    "",
  );

  return {
    // Primary list key + message-stream id used by the widget.
    id: String(chatId),
    chatId: String(chatId),

    // Channel object id (for linking, not for /messages).
    channelId: String(channelId),

    name: String(name),

    // Required by sendCliqChannelMessage → POST .../channels/:channelUniqueName/message
    uniqueName: String(uniqueName),

    isPrivate: Boolean(getValue(record, "is_private", "private", "isPrivate")),

    unreadCount: Number(getValue(record, "unread_count", "unreadCount")) || 0,

    participantCount:
      Number(getValue(record, "participants_count", "participantCount")) ||
      null,

    type: "channel",

    raw: record,
  };
};

// ============================================================
// CHAT NORMALIZATION
// ============================================================

const normalizeChat = (record = {}, index = 0) => {
  if (!record || typeof record !== "object") {
    return {
      id: `chat-${index}`,
      chatId: `chat-${index}`,
      name: `Chat ${index + 1}`,
      type: "chat",
      participantId: null,
      participantName: "Unknown",
      isPrivate: false,
      unreadCount: 0,
      participantCount: null,
      raw: record,
    };
  }

  const participant =
    record.participant ??
    record.user ??
    record.contact ??
    record.member ??
    null;

  const participantName =
    flattenRef(participant) ||
    toText(
      getValue(
        record,
        "participant_name",
        "participantName",
        "user_name",
        "userName",
        "name",
        "title",
        "display_name",
        "displayName",
      ),
      "Unknown",
    );

  const participantId =
    getId(participant) ||
    getId(
      getValue(record, "participant_id", "participantId", "user_id", "userId"),
    );

  const rawId = getValue(record, "chat_id", "chatId", "id");

  const chatId = getId(rawId) || `chat-${index}`;

  const name = toText(
    getValue(
      record,
      "name",
      "title",
      "display_name",
      "displayName",
      "chat_name",
      "chatName",
    ),
    participantName || `Chat ${index + 1}`,
  );

  const type = toText(
    getValue(record, "type", "chat_type", "chatType"),
    "chat",
  );

  return {
    id: String(chatId),
    // Explicit chatId so the widget can always read item.chatId
    chatId: String(chatId),

    name: String(name),

    type: String(type),

    participantId: participantId ? String(participantId) : null,

    participantName: String(participantName || "Unknown"),

    isPrivate: Boolean(getValue(record, "is_private", "private", "isPrivate")),

    unreadCount: Number(getValue(record, "unread_count", "unreadCount")) || 0,

    participantCount:
      Number(getValue(record, "participants_count", "participantCount")) ||
      null,

    raw: record,
  };
};

// ============================================================
// PIN NORMALIZATION
// ============================================================
//
// /pins returns chat folders ("pin categories"), each with a
// list of pinned chats. We flatten that into one list of pinned
// chats, tagging each with which folder it came from.
// ============================================================

const normalizePin = (chatRecord = {}, category = {}, index = 0) => {
  const rawId = getValue(chatRecord, "chat_id", "chatId", "id");

  const chatId = getId(rawId) || `pin-${index}`;

  const name = toText(
    getValue(chatRecord, "name", "title", "display_name", "displayName"),
    `Pinned chat ${index + 1}`,
  );

  const type = toText(getValue(chatRecord, "chat_type", "type"), "chat");

  return {
    id: String(chatId),
    chatId: String(chatId),

    name: String(name),

    type: String(type),

    categoryId: toText(
      getValue(category, "category_id", "categoryId"),
      "default",
    ),

    categoryTitle: toText(getValue(category, "title"), "My Pins"),

    participantCount:
      Number(getValue(chatRecord, "participant_count", "participantCount")) ||
      null,

    raw: chatRecord,
  };
};

// ============================================================
// THREAD NORMALIZATION
// ============================================================

const normalizeThread = (record = {}, index = 0) => {
  const rawId = getValue(record, "chat_id", "chatId", "id");

  const chatId = getId(rawId) || `thread-${index}`;

  const parentChatId = getId(
    getValue(record, "parent_chat_id", "parentChatId"),
  );

  const parentName = toText(
    getValue(record, "parent_name", "parentName"),
    "Thread",
  );

  const parentType = toText(
    getValue(record, "parent_type", "parentType"),
    "chat",
  );

  return {
    id: String(chatId),
    // Threads are themselves chats; history/send use this chatId.
    chatId: String(chatId),

    parentChatId: parentChatId ? String(parentChatId) : null,

    parentName: String(parentName),

    parentType: String(parentType),

    type: "thread",

    name: String(parentName),

    followerCount:
      Number(getValue(record, "follower_count", "followerCount")) || 0,

    isFollower: Boolean(getValue(record, "is_follower", "isFollower")),

    raw: record,
  };
};

// ============================================================
// PERSON NORMALIZATION
// ============================================================

const normalizePerson = (record = {}, index = 0) => {
  const rawId = getValue(record, "id", "zuid");

  const id = getId(rawId) || `person-${index}`;

  const name = toText(
    getValue(
      record,
      "full_name",
      "fullName",
      "display_name",
      "displayName",
      "name",
    ),
    `Person ${index + 1}`,
  );

  // Controller: POST :ownerKey/people/:emailId/message
  // Widget passes email into sendCliqPersonMessage.
  const email = toText(getValue(record, "email_id", "emailId", "email"), "");

  const designation = toText(getValue(record, "designation"), "");

  const status = toText(getValue(record, "status"), "");

  return {
    id: String(id),

    name: String(name),

    email: String(email),

    designation: String(designation),

    isActive: status === "active",

    // People are not chats until a conversation exists.
    chatId: null,

    raw: record,
  };
};
// ============================================================
// CHANNEL MEMBER NORMALIZATION
// ============================================================

const normalizeChannelMember = (record = {}, index = 0) => {
  if (!record || typeof record !== "object") {
    return {
      id: `member-${index}`,
      userId: null,
      name: `Member ${index + 1}`,
      email: "",
      role: "member",
      status: "",
      isExternal: false,
      raw: record,
    };
  }

  const userId =
    getId(getValue(record, "user_id", "userId", "zuid", "id")) ||
    `member-${index}`;

  const name = toText(
    getValue(
      record,
      "name",
      "full_name",
      "fullName",
      "display_name",
      "displayName",
      "username",
      "user_name",
    ),
    `Member ${index + 1}`,
  );

  const email = toText(
    getValue(record, "email_id", "emailId", "email", "email_address"),
    "",
  );

  const role = toText(
    getValue(record, "user_role", "role", "member_role", "memberRole"),
    "member",
  );

  const status = toText(
    getValue(record, "status", "member_status", "memberStatus"),
    "",
  );

  /*
   * Do NOT assume every member returned by Zoho is external.
   *
   * Zoho's channel-member API gives us the actual members of
   * the channel. If Zoho explicitly returns an external flag,
   * preserve it. Otherwise leave it false/unknown rather than
   * incorrectly classifying internal users.
   */
  const explicitExternal = getValue(
    record,
    "is_external",
    "isExternal",
    "external",
  );

  const isExternal =
    explicitExternal === true ||
    explicitExternal === 1 ||
    explicitExternal === "true" ||
    explicitExternal === "1";

  return {
    id: String(userId),
    userId: String(userId),

    name: String(name),

    email: String(email),

    role: String(role),

    status: String(status),

    isExternal,

    type: "channel_member",

    raw: record,
  };
};
// ============================================================
// ATTACHMENT NORMALIZATION (messages)
// ============================================================

const normalizeAttachment = (record = {}) => {
  if (!record || typeof record !== "object") {
    return null;
  }

  // Prefer nested content.file (Cliq file messages).
  const nestedFile =
    record?.content?.file ?? (isPlainObject(record?.file) ? record.file : null);

  if (nestedFile && typeof nestedFile === "object") {
    const fileId = getId(nestedFile.id) || getId(nestedFile.file_id);
    const fileName = toText(
      nestedFile.name ?? nestedFile.filename ?? nestedFile.file_name,
      "",
    );
    const mime = toText(nestedFile.type ?? nestedFile.mime_type, "");
    const size =
      Number(nestedFile?.dimensions?.size ?? nestedFile?.size) || null;
    const thumbnail = toText(
      record?.content?.thumbnail?.url ??
        record?.content?.thumbnail ??
        nestedFile.thumbnail ??
        nestedFile.url,
      "",
    );

    if (fileId || fileName || thumbnail) {
      return {
        fileId: fileId ? String(fileId) : null,
        file: String(fileName || "file"),
        mimeType: String(mime),
        size,
        thumbnail: String(thumbnail),
        downloadPath: fileId
          ? `/zoho/cliq/${encodeURIComponent(getOwnerKey() || "")}/files/${encodeURIComponent(fileId)}`
          : null,
        cliqOpenUrl: null,
        raw: nestedFile,
      };
    }
  }

  const candidates = [
    record.attachment,
    record.file,
    record.media,
    record.attachments,
    record.files,
  ];

  for (const candidate of candidates) {
    if (!candidate) {
      continue;
    }

    if (Array.isArray(candidate)) {
      if (!candidate.length) {
        continue;
      }

      const first = candidate[0];

      if (!first || typeof first !== "object") {
        continue;
      }

      const fileId = getId(first.id) || getId(first.file_id);
      const file = toText(
        first.file ??
          first.filename ??
          first.file_name ??
          first.fileName ??
          first.name ??
          first.title,
        "",
      );

      const thumbnail = toText(
        first.thumbnail ??
          first.thumbnail_url ??
          first.thumbnailUrl ??
          first.preview ??
          first.url,
        "",
      );

      if (file || thumbnail || fileId) {
        return {
          fileId: fileId ? String(fileId) : null,
          file: String(file),
          mimeType: toText(first.type, ""),
          size: Number(first.size) || null,
          thumbnail: String(thumbnail),
          downloadPath: fileId
            ? `/zoho/cliq/${encodeURIComponent(getOwnerKey() || "")}/files/${encodeURIComponent(fileId)}`
            : null,
          cliqOpenUrl: null,
          raw: first,
        };
      }

      continue;
    }

    if (typeof candidate === "object") {
      const fileId = getId(candidate.id) || getId(candidate.file_id);
      const file = toText(
        candidate.file ??
          candidate.filename ??
          candidate.file_name ??
          candidate.fileName ??
          candidate.name ??
          candidate.title,
        "",
      );

      const thumbnail = toText(
        candidate.thumbnail ??
          candidate.thumbnail_url ??
          candidate.thumbnailUrl ??
          candidate.preview ??
          candidate.url,
        "",
      );

      if (file || thumbnail || fileId) {
        return {
          fileId: fileId ? String(fileId) : null,
          file: String(file),
          mimeType: toText(candidate.type, ""),
          size: Number(candidate.size) || null,
          thumbnail: String(thumbnail),
          downloadPath: fileId
            ? `/zoho/cliq/${encodeURIComponent(getOwnerKey() || "")}/files/${encodeURIComponent(fileId)}`
            : null,
          cliqOpenUrl: null,
          raw: candidate,
        };
      }
    }
  }

  return null;
};

// ============================================================
// FILE LIST ITEM NORMALIZATION (from listFilesForChat)
// ============================================================

const normalizeFileItem = (record = {}, index = 0) => {
  if (!record || typeof record !== "object") {
    return null;
  }

  // Service returns { message_id, time, sender, comment, chat_id, file: {...}, ... }
  const fileMeta = isPlainObject(record.file) ? record.file : {};

  const fileId =
    getId(fileMeta.id) || getId(record.file_id) || getId(record.fileId) || null;

  const messageId =
    getId(record.message_id) ||
    getId(record.messageId) ||
    getId(record.id) ||
    `file-msg-${index}`;

  const chatId = getId(record.chat_id) || getId(record.chatId) || null;

  const name = toText(
    fileMeta.name ??
      record.name ??
      record.file_name ??
      record.fileName ??
      "file",
    "file",
  );

  const mimeType = toText(fileMeta.type ?? record.type, "");

  const size =
    Number(fileMeta.size ?? fileMeta?.dimensions?.size ?? record.size) || null;

  const comment = toText(record.comment, "");

  const sender = record.sender ?? record.from ?? record.user ?? null;

  const senderName =
    flattenRef(sender) ||
    toText(getValue(record, "sender_name", "senderName"), "Unknown");

  const senderId = getId(sender) || null;

  const createdAt = getValue(
    record,
    "time",
    "created_time",
    "createdAt",
    "timestamp",
  );

  const ownerKey = getOwnerKey() || "";

  const downloadPath =
    toText(record.download_path, "") ||
    (fileId
      ? `/zoho/cliq/${encodeURIComponent(ownerKey)}/files/${encodeURIComponent(fileId)}`
      : null);

  const cliqOpenUrl = toText(
    record.cliq_open_url ?? record.cliqOpenUrl,
    chatId ? `https://cliq.zoho.in/chats/${encodeURIComponent(chatId)}` : "",
  );

  const thumbnail = toText(
    fileMeta.thumbnail ?? record?.file?.thumbnail ?? record.thumbnail,
    "",
  );

  return {
    id: String(messageId),
    messageId: String(messageId),
    chatId: chatId ? String(chatId) : null,

    fileId: fileId ? String(fileId) : null,
    name: String(name),
    mimeType: String(mimeType),
    size,
    comment: String(comment),

    senderId: senderId ? String(senderId) : null,
    senderName: String(senderName),

    createdAt,

    thumbnail: String(thumbnail),

    downloadPath: downloadPath ? String(downloadPath) : null,
    cliqOpenUrl: cliqOpenUrl ? String(cliqOpenUrl) : null,

    type: "file",

    raw: record,
  };
};

// ============================================================
// MESSAGE NORMALIZATION
// ============================================================

const normalizeMessage = (record = {}, index = 0) => {
  if (!record || typeof record !== "object") {
    return null;
  }

  // ----------------------------------------------------------
  // SENDER
  // ----------------------------------------------------------

  const sender =
    record.sender ?? record.from ?? record.user ?? record.author ?? null;

  const senderName =
    flattenRef(sender) ||
    toText(
      getValue(
        record,
        "sender_name",
        "senderName",
        "from_name",
        "fromName",
        "user_name",
        "userName",
        "author_name",
        "authorName",
      ),
      "Unknown",
    );

  const senderId =
    getId(sender) ||
    getId(
      getValue(
        record,
        "sender_id",
        "senderId",
        "from_id",
        "fromId",
        "user_id",
        "userId",
        "author_id",
        "authorId",
      ),
    );

  // ----------------------------------------------------------
  // TIMESTAMP
  // ----------------------------------------------------------

  const createdAt = getValue(
    record,
    "time",
    "created_time",
    "createdTime",
    "createdAt",
    "timestamp",
    "created_at",
  );

  // ----------------------------------------------------------
  // TEXT
  // ----------------------------------------------------------

  const rawText = getValue(record, "text", "message", "content", "body");

  let text = toText(rawText, "");

  // ----------------------------------------------------------
  // ATTACHMENT / FILE
  // ----------------------------------------------------------

  const attachment = normalizeAttachment(record);

  if (!text && attachment?.file) {
    text = String(attachment.file);
  }

  if (!text && attachment?.thumbnail) {
    text = "Attachment";
  }

  const messageType = toText(
    getValue(record, "type", "message_type", "messageType"),
    attachment?.fileId || attachment?.file ? "file" : "text",
  );

  // ----------------------------------------------------------
  // ID
  // ----------------------------------------------------------

  const rawId = getValue(record, "message_id", "messageId", "id");

  const id =
    getId(rawId) || toText(createdAt, "") || `message-${index}-${Date.now()}`;

  // ----------------------------------------------------------
  // OWN MESSAGE
  // ----------------------------------------------------------

  const ownValue = getValue(record, "is_own", "isOwn", "is_mine", "isMine");

  const isOwn =
    ownValue === true ||
    ownValue === 1 ||
    ownValue === "true" ||
    ownValue === "1";

  return {
    id: String(id),

    // ALWAYS a string.
    text: String(text || ""),

    type: String(messageType),

    senderId: senderId ? String(senderId) : null,

    senderName: String(senderName || "Unknown"),

    createdAt,

    isOwn,

    attachment,

    // Convenience for UI: true when this is a file message
    isFile: messageType === "file" || Boolean(attachment?.fileId),

    raw: record,
  };
};

// ============================================================
// RESPONSE EXTRACTION
// ============================================================

const extractRecords = (response) => {
  if (!response) {
    return [];
  }

  if (Array.isArray(response)) {
    return response;
  }

  const keys = [
    "data",
    "channels",
    "chats",
    "messages",
    "files",
    "members",
    "items",
    "results",
    "records",
  ];
  for (const key of keys) {
    if (Array.isArray(response?.[key])) {
      return response[key];
    }
  }

  if (
    response?.data &&
    typeof response.data === "object" &&
    !Array.isArray(response.data)
  ) {
    for (const key of keys) {
      if (Array.isArray(response.data?.[key])) {
        return response.data[key];
      }
    }
  }

  return [];
};

// ============================================================
// TIMESTAMP
// ============================================================

const getTimestamp = (value) => {
  if (value === undefined || value === null || value === "") {
    return 0;
  }

  const numeric = Number(value);

  if (Number.isFinite(numeric)) {
    return numeric < 10000000000 ? numeric * 1000 : numeric;
  }

  const parsed = Date.parse(String(value));

  return Number.isFinite(parsed) ? parsed : 0;
};

// ============================================================
// SORT
// ============================================================

const sortMessages = (messages) => {
  return [...messages].sort(
    (a, b) => getTimestamp(a.createdAt) - getTimestamp(b.createdAt),
  );
};

const sortFiles = (files) => {
  return [...files].sort(
    (a, b) => getTimestamp(b.createdAt) - getTimestamp(a.createdAt),
  );
};

// ============================================================
// API
// Matches ZohoCliqController:
//
// GET  /zoho/cliq/:ownerKey/status
// GET  /zoho/cliq/:ownerKey/channels
// GET  /zoho/cliq/:ownerKey/chats
// GET  /zoho/cliq/:ownerKey/chats/:chatId
// GET  /zoho/cliq/:ownerKey/chats/:chatId/messages?limit&fromtime
// POST /zoho/cliq/:ownerKey/chats/:chatId/message          { text }
// GET  /zoho/cliq/:ownerKey/chats/:chatId/threads
// GET  /zoho/cliq/:ownerKey/chats/:chatId/files?limit&fromtime
// POST /zoho/cliq/:ownerKey/chats/:chatId/files            multipart file + comment
// POST /zoho/cliq/:ownerKey/channels/:channelUniqueName/message  { text }
// POST /zoho/cliq/:ownerKey/channels/:channelUniqueName/files    multipart
// GET  /zoho/cliq/:ownerKey/pins
// GET  /zoho/cliq/:ownerKey/threads
// GET  /zoho/cliq/:ownerKey/people?limit
// POST /zoho/cliq/:ownerKey/people/:emailId/message        { text }
// POST /zoho/cliq/:ownerKey/people/:emailId/files          multipart
// GET  /zoho/cliq/:ownerKey/files/:fileId?filename=
// ============================================================

export const cliqApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // ======================================================
    // STATUS
    // ======================================================

    getCliqStatus: builder.query({
      query: () => {
        const ownerKey = getOwnerKey();

        return {
          url: `/zoho/cliq/${encodeURIComponent(ownerKey || "")}/status`,
          method: "GET",
        };
      },

      transformResponse: (response) => ({
        connected:
          response?.connected === true ||
          response?.isConnected === true ||
          response?.status === "connected",
      }),

      providesTags: ["CliqStatus"],
    }),

    // ======================================================
    // CHANNELS
    // ======================================================

    getCliqChannels: builder.query({
      async queryFn(_arg, _queryApi, _extraOptions, fetchWithBQ) {
        const ownerKey = getOwnerKey();

        if (!ownerKey) {
          return {
            error: {
              status: "CUSTOM_ERROR",
              error: "No authenticated user found. Please log in again.",
            },
          };
        }

        const result = await fetchWithBQ({
          url: `/zoho/cliq/${encodeURIComponent(ownerKey)}/channels`,
          method: "GET",
        });

        if (result.error) {
          return {
            error: result.error,
          };
        }

        const records = extractRecords(result.data);

        return {
          data: records.map(normalizeChannel),
        };
      },

      providesTags: ["CliqChannels"],
    }),
    // ======================================================
    // CHANNEL MEMBERS
    // GET :ownerKey/channels/:channelId/members
    // ======================================================

    getCliqChannelMembers: builder.query({
      async queryFn(channelId, _queryApi, _extraOptions, fetchWithBQ) {
        const ownerKey = getOwnerKey();

        if (!ownerKey) {
          return {
            error: {
              status: "CUSTOM_ERROR",
              error: "Zoho Cliq owner key is missing.",
            },
          };
        }

        if (!channelId) {
          return {
            error: {
              status: "CUSTOM_ERROR",
              error: "Channel ID is required.",
            },
          };
        }

        const result = await fetchWithBQ({
          url: `/zoho/cliq/${encodeURIComponent(
            ownerKey,
          )}/channels/${encodeURIComponent(channelId)}/members`,
          method: "GET",
        });

        if (result.error) {
          return {
            error: result.error,
          };
        }

        const records = extractRecords(result.data);

        return {
          data: records.map(normalizeChannelMember).filter(Boolean),
        };
      },

      providesTags: (result, error, channelId) => [
        {
          type: "CliqChannelMembers",
          id: channelId,
        },
      ],
    }),
    // ======================================================
    // EXTERNAL CHANNEL MEMBERS
    // GET :ownerKey/channels/:channelId/members/external
    // ======================================================

    getCliqExternalChannelMembers: builder.query({
      async queryFn(channelId, _queryApi, _extraOptions, fetchWithBQ) {
        const ownerKey = getOwnerKey();

        if (!ownerKey) {
          return {
            error: {
              status: "CUSTOM_ERROR",
              error: "No authenticated user found. Please log in again.",
            },
          };
        }

        if (!channelId) {
          return {
            error: {
              status: "CUSTOM_ERROR",
              error: "channelId is required.",
            },
          };
        }

        const result = await fetchWithBQ({
          url: `/zoho/cliq/${encodeURIComponent(
            ownerKey,
          )}/channels/${encodeURIComponent(channelId)}/members/external`,
          method: "GET",
        });

        if (result.error) {
          return {
            error: result.error,
          };
        }

        const records = extractRecords(result.data);

        return {
          data: records.map(normalizeChannelMember).filter(Boolean),
        };
      },

      providesTags: (result, error, channelId) => [
        {
          type: "CliqChannelMembers",
          id: `${channelId}-external`,
        },
      ],
    }), // ======================================================
    // CHANNEL DETAILS + MEMBERS
    // GET :ownerKey/channels/:channelId/details
    // ======================================================

    getCliqChannelDetails: builder.query({
      async queryFn(channelId, _queryApi, _extraOptions, fetchWithBQ) {
        const ownerKey = getOwnerKey();

        if (!ownerKey) {
          return {
            error: {
              status: "CUSTOM_ERROR",
              error: "No authenticated user found. Please log in again.",
            },
          };
        }

        if (!channelId) {
          return {
            error: {
              status: "CUSTOM_ERROR",
              error: "channelId is required.",
            },
          };
        }

        const result = await fetchWithBQ({
          url: `/zoho/cliq/${encodeURIComponent(
            ownerKey,
          )}/channels/${encodeURIComponent(channelId)}/details`,
          method: "GET",
        });

        if (result.error) {
          return {
            error: result.error,
          };
        }

        return {
          data: result.data,
        };
      },

      providesTags: (result, error, channelId) => [
        {
          type: "CliqChannel",
          id: channelId,
        },
        {
          type: "CliqChannelMembers",
          id: channelId,
        },
      ],
    }),
    // ======================================================
    // CHATS
    // ======================================================

    getCliqChats: builder.query({
      async queryFn(_arg, _queryApi, _extraOptions, fetchWithBQ) {
        const ownerKey = getOwnerKey();

        if (!ownerKey) {
          return {
            error: {
              status: "CUSTOM_ERROR",
              error: "No authenticated user found. Please log in again.",
            },
          };
        }

        const result = await fetchWithBQ({
          url: `/zoho/cliq/${encodeURIComponent(ownerKey)}/chats`,
          method: "GET",
        });

        if (result.error) {
          return {
            error: result.error,
          };
        }

        const records = extractRecords(result.data);

        return {
          data: records.map(normalizeChat),
        };
      },

      providesTags: ["CliqChats"],
    }),

    // ======================================================
    // CHAT DETAILS
    // ======================================================

    getCliqChat: builder.query({
      async queryFn(chatId, _queryApi, _extraOptions, fetchWithBQ) {
        const ownerKey = getOwnerKey();

        if (!ownerKey) {
          return {
            error: {
              status: "CUSTOM_ERROR",
              error: "No authenticated user found. Please log in again.",
            },
          };
        }

        if (!chatId) {
          return {
            error: {
              status: "CUSTOM_ERROR",
              error: "chatId is required.",
            },
          };
        }

        const result = await fetchWithBQ({
          url: `/zoho/cliq/${encodeURIComponent(
            ownerKey,
          )}/chats/${encodeURIComponent(chatId)}`,
          method: "GET",
        });

        if (result.error) {
          return {
            error: result.error,
          };
        }

        const record = result.data?.data ?? result.data?.chat ?? result.data;

        return {
          data: normalizeChat(record || {}),
        };
      },

      providesTags: (result, error, chatId) => [
        {
          type: "CliqChat",
          id: chatId,
        },
      ],
    }),

    // ======================================================
    // MESSAGE HISTORY
    // GET :ownerKey/chats/:chatId/messages?limit&fromtime
    // ======================================================

    getCliqMessages: builder.query({
      async queryFn(
        { chatId, limit = 50, fromtime },
        _queryApi,
        _extraOptions,
        fetchWithBQ,
      ) {
        const ownerKey = getOwnerKey();

        if (!ownerKey) {
          return {
            error: {
              status: "CUSTOM_ERROR",
              error: "No authenticated user found. Please log in again.",
            },
          };
        }

        if (!chatId) {
          return {
            data: [],
          };
        }

        const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 1000);

        const params = {
          limit: safeLimit,
        };

        if (
          fromtime !== undefined &&
          fromtime !== null &&
          fromtime !== "" &&
          Number.isFinite(Number(fromtime))
        ) {
          params.fromtime = Number(fromtime);
        }

        const result = await fetchWithBQ({
          url: `/zoho/cliq/${encodeURIComponent(
            ownerKey,
          )}/chats/${encodeURIComponent(chatId)}/messages`,

          method: "GET",

          params,
        });

        if (result.error) {
          return {
            error: result.error,
          };
        }

        const records = extractRecords(result.data);

        const messages = records.map(normalizeMessage).filter(Boolean);

        return {
          data: sortMessages(messages),
        };
      },

      providesTags: (result, error, args) => [
        {
          type: "CliqMessages",
          id: args?.chatId,
        },
      ],
    }),

    // ======================================================
    // SEND CHAT MESSAGE
    // POST :ownerKey/chats/:chatId/message  { text }
    // ======================================================

    sendCliqMessage: builder.mutation({
      async queryFn({ chatId, text }, _queryApi, _extraOptions, fetchWithBQ) {
        const ownerKey = getOwnerKey();

        if (!ownerKey) {
          return {
            error: {
              status: "CUSTOM_ERROR",
              error: "No authenticated user found. Please log in again.",
            },
          };
        }

        if (!chatId) {
          return {
            error: {
              status: "CUSTOM_ERROR",
              error: "A chat is required.",
            },
          };
        }

        const messageText =
          typeof text === "string" ? text.trim() : String(text ?? "").trim();

        if (!messageText) {
          return {
            error: {
              status: "CUSTOM_ERROR",
              error: "Message text is required.",
            },
          };
        }

        const result = await fetchWithBQ({
          url: `/zoho/cliq/${encodeURIComponent(
            ownerKey,
          )}/chats/${encodeURIComponent(chatId)}/message`,

          method: "POST",

          body: {
            text: messageText,
          },
        });

        if (result.error) {
          return {
            error: result.error,
          };
        }

        return {
          data: result.data,
        };
      },

      invalidatesTags: (result, error, { chatId }) => [
        {
          type: "CliqMessages",
          id: chatId,
        },
        {
          type: "CliqFiles",
          id: chatId,
        },
        "CliqChats",
      ],
    }),

    // ======================================================
    // SEND CHANNEL MESSAGE
    // POST :ownerKey/channels/:channelUniqueName/message  { text }
    // ======================================================

    sendCliqChannelMessage: builder.mutation({
      async queryFn(
        { channelUniqueName, text },
        _queryApi,
        _extraOptions,
        fetchWithBQ,
      ) {
        const ownerKey = getOwnerKey();

        if (!ownerKey) {
          return {
            error: {
              status: "CUSTOM_ERROR",
              error: "No authenticated user found. Please log in again.",
            },
          };
        }

        if (!channelUniqueName) {
          return {
            error: {
              status: "CUSTOM_ERROR",
              error: "Channel name is required.",
            },
          };
        }

        const messageText =
          typeof text === "string" ? text.trim() : String(text ?? "").trim();

        if (!messageText) {
          return {
            error: {
              status: "CUSTOM_ERROR",
              error: "Message text is required.",
            },
          };
        }

        const result = await fetchWithBQ({
          url: `/zoho/cliq/${encodeURIComponent(
            ownerKey,
          )}/channels/${encodeURIComponent(channelUniqueName)}/message`,

          method: "POST",

          body: {
            text: messageText,
          },
        });

        if (result.error) {
          return {
            error: result.error,
          };
        }

        return {
          data: result.data,
        };
      },

      invalidatesTags: ["CliqChannels", "CliqChats"],
    }),

    // ======================================================
    // LIST FILES IN A CHAT
    // GET :ownerKey/chats/:chatId/files?limit&fromtime
    // ======================================================

    getCliqChatFiles: builder.query({
      async queryFn(
        { chatId, limit = 50, fromtime },
        _queryApi,
        _extraOptions,
        fetchWithBQ,
      ) {
        const ownerKey = getOwnerKey();

        if (!ownerKey) {
          return {
            error: {
              status: "CUSTOM_ERROR",
              error: "No authenticated user found. Please log in again.",
            },
          };
        }

        if (!chatId) {
          return { data: [] };
        }

        const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 1000);

        const params = { limit: safeLimit };

        if (
          fromtime !== undefined &&
          fromtime !== null &&
          fromtime !== "" &&
          Number.isFinite(Number(fromtime))
        ) {
          params.fromtime = Number(fromtime);
        }

        const result = await fetchWithBQ({
          url: `/zoho/cliq/${encodeURIComponent(
            ownerKey,
          )}/chats/${encodeURIComponent(chatId)}/files`,
          method: "GET",
          params,
        });

        if (result.error) {
          return { error: result.error };
        }

        const records = extractRecords(result.data);

        const files = records
          .map((record, index) => normalizeFileItem(record, index))
          .filter(Boolean);

        return {
          data: sortFiles(files),
        };
      },

      providesTags: (result, error, args) => [
        { type: "CliqFiles", id: args?.chatId },
      ],
    }),

    // ======================================================
    // UPLOAD FILE TO CHAT
    // POST :ownerKey/chats/:chatId/files  (multipart)
    // arg: { chatId, file: File, comment?: string }
    // ======================================================

    uploadCliqChatFile: builder.mutation({
      async queryFn(
        { chatId, file, comment },
        _queryApi,
        _extraOptions,
        fetchWithBQ,
      ) {
        const ownerKey = getOwnerKey();

        if (!ownerKey) {
          return {
            error: {
              status: "CUSTOM_ERROR",
              error: "No authenticated user found. Please log in again.",
            },
          };
        }

        if (!chatId) {
          return {
            error: {
              status: "CUSTOM_ERROR",
              error: "A chat is required.",
            },
          };
        }

        if (!file) {
          return {
            error: {
              status: "CUSTOM_ERROR",
              error: "A file is required.",
            },
          };
        }

        const formData = new FormData();
        formData.append("file", file);

        if (typeof comment === "string" && comment.trim()) {
          formData.append("comment", comment.trim());
        }

        const result = await fetchWithBQ({
          url: `/zoho/cliq/${encodeURIComponent(
            ownerKey,
          )}/chats/${encodeURIComponent(chatId)}/files`,
          method: "POST",
          body: formData,
          // Do not set Content-Type — browser/FormData sets multipart boundary.
        });

        if (result.error) {
          return { error: result.error };
        }

        return { data: result.data };
      },

      invalidatesTags: (result, error, { chatId }) => [
        { type: "CliqMessages", id: chatId },
        { type: "CliqFiles", id: chatId },
        "CliqChats",
      ],
    }),

    // ======================================================
    // UPLOAD FILE TO CHANNEL
    // POST :ownerKey/channels/:channelUniqueName/files
    // ======================================================

    uploadCliqChannelFile: builder.mutation({
      async queryFn(
        { channelUniqueName, file, comment },
        _queryApi,
        _extraOptions,
        fetchWithBQ,
      ) {
        const ownerKey = getOwnerKey();

        if (!ownerKey) {
          return {
            error: {
              status: "CUSTOM_ERROR",
              error: "No authenticated user found. Please log in again.",
            },
          };
        }

        if (!channelUniqueName) {
          return {
            error: {
              status: "CUSTOM_ERROR",
              error: "Channel name is required.",
            },
          };
        }

        if (!file) {
          return {
            error: {
              status: "CUSTOM_ERROR",
              error: "A file is required.",
            },
          };
        }

        const formData = new FormData();
        formData.append("file", file);

        if (typeof comment === "string" && comment.trim()) {
          formData.append("comment", comment.trim());
        }

        const result = await fetchWithBQ({
          url: `/zoho/cliq/${encodeURIComponent(
            ownerKey,
          )}/channels/${encodeURIComponent(channelUniqueName)}/files`,
          method: "POST",
          body: formData,
        });

        if (result.error) {
          return { error: result.error };
        }

        return { data: result.data };
      },

      invalidatesTags: ["CliqChannels", "CliqChats", "CliqFiles"],
    }),

    // ======================================================
    // UPLOAD FILE TO PERSON (BUDDY)
    // POST :ownerKey/people/:emailId/files
    // ======================================================

    uploadCliqPersonFile: builder.mutation({
      async queryFn(
        { email, file, comment },
        _queryApi,
        _extraOptions,
        fetchWithBQ,
      ) {
        const ownerKey = getOwnerKey();

        if (!ownerKey) {
          return {
            error: {
              status: "CUSTOM_ERROR",
              error: "No authenticated user found. Please log in again.",
            },
          };
        }

        if (!email) {
          return {
            error: {
              status: "CUSTOM_ERROR",
              error: "A person's email is required.",
            },
          };
        }

        if (!file) {
          return {
            error: {
              status: "CUSTOM_ERROR",
              error: "A file is required.",
            },
          };
        }

        const formData = new FormData();
        formData.append("file", file);

        if (typeof comment === "string" && comment.trim()) {
          formData.append("comment", comment.trim());
        }

        const result = await fetchWithBQ({
          url: `/zoho/cliq/${encodeURIComponent(
            ownerKey,
          )}/people/${encodeURIComponent(email)}/files`,
          method: "POST",
          body: formData,
        });

        if (result.error) {
          return { error: result.error };
        }

        return { data: result.data };
      },

      invalidatesTags: ["CliqChats", "CliqFiles"],
    }),

    // ======================================================
    // DOWNLOAD FILE (returns blob URL for UI)
    // GET :ownerKey/files/:fileId?filename=
    // ======================================================

    downloadCliqFile: builder.mutation({
      async queryFn(
        { fileId, filename },
        _queryApi,
        _extraOptions,
        fetchWithBQ,
      ) {
        const ownerKey = getOwnerKey();

        if (!ownerKey) {
          return {
            error: {
              status: "CUSTOM_ERROR",
              error: "No authenticated user found. Please log in again.",
            },
          };
        }

        if (!fileId) {
          return {
            error: {
              status: "CUSTOM_ERROR",
              error: "fileId is required.",
            },
          };
        }

        const params = {};
        if (filename && String(filename).trim()) {
          params.filename = String(filename).trim();
        }

        const result = await fetchWithBQ({
          url: `/zoho/cliq/${encodeURIComponent(
            ownerKey,
          )}/files/${encodeURIComponent(fileId)}`,
          method: "GET",
          params,
          responseHandler: async (response) => {
            if (!response.ok) {
              const errText = await response.text().catch(() => "");
              throw new Error(
                errText || `Download failed (${response.status})`,
              );
            }
            return response.blob();
          },
        });

        if (result.error) {
          return { error: result.error };
        }

        const blob = result.data;
        const objectUrl = URL.createObjectURL(blob);

        return {
          data: {
            blob,
            objectUrl,
            filename: filename || "download",
            fileId: String(fileId),
          },
        };
      },
    }),

    // ======================================================
    // MY PINS
    // ======================================================

    getCliqPins: builder.query({
      async queryFn(_arg, _queryApi, _extraOptions, fetchWithBQ) {
        const ownerKey = getOwnerKey();

        if (!ownerKey) {
          return {
            error: {
              status: "CUSTOM_ERROR",
              error: "No authenticated user found. Please log in again.",
            },
          };
        }

        const result = await fetchWithBQ({
          url: `/zoho/cliq/${encodeURIComponent(ownerKey)}/pins`,
          method: "GET",
        });

        if (result.error) {
          return {
            error: result.error,
          };
        }

        const categories = extractRecords(result.data);

        const pins = categories.flatMap((category) => {
          const chats = Array.isArray(category?.chats) ? category.chats : [];

          return chats.map((chat, index) =>
            normalizePin(chat, category, index),
          );
        });

        return {
          data: pins,
        };
      },

      providesTags: ["CliqPins"],
    }),

    // ======================================================
    // THREADS IN A SPECIFIC CHAT
    // ======================================================

    getCliqChatThreads: builder.query({
      async queryFn(chatId, _queryApi, _extraOptions, fetchWithBQ) {
        const ownerKey = getOwnerKey();

        if (!ownerKey) {
          return {
            error: {
              status: "CUSTOM_ERROR",
              error: "No authenticated user found. Please log in again.",
            },
          };
        }

        if (!chatId) {
          return { data: [] };
        }

        const result = await fetchWithBQ({
          url: `/zoho/cliq/${encodeURIComponent(
            ownerKey,
          )}/chats/${encodeURIComponent(chatId)}/threads`,
          method: "GET",
        });

        if (result.error) {
          return {
            error: result.error,
          };
        }

        const records = extractRecords(result.data);

        return {
          data: records.map((record, index) => normalizeThread(record, index)),
        };
      },

      providesTags: (result, error, chatId) => [
        { type: "CliqThreads", id: chatId },
      ],
    }),

    // ======================================================
    // MY THREADS (AGGREGATED)
    // ======================================================

    getCliqThreads: builder.query({
      async queryFn(_arg, _queryApi, _extraOptions, fetchWithBQ) {
        const ownerKey = getOwnerKey();

        if (!ownerKey) {
          return {
            error: {
              status: "CUSTOM_ERROR",
              error: "No authenticated user found. Please log in again.",
            },
          };
        }

        const result = await fetchWithBQ({
          url: `/zoho/cliq/${encodeURIComponent(ownerKey)}/threads`,
          method: "GET",
        });

        if (result.error) {
          return {
            error: result.error,
          };
        }

        const records = extractRecords(result.data);

        return {
          data: records.map((record, index) => normalizeThread(record, index)),
        };
      },

      providesTags: ["CliqThreads"],
    }),

    // ======================================================
    // PEOPLE
    // ======================================================

    getCliqPeople: builder.query({
      async queryFn(limit = 100, _queryApi, _extraOptions, fetchWithBQ) {
        const ownerKey = getOwnerKey();

        if (!ownerKey) {
          return {
            error: {
              status: "CUSTOM_ERROR",
              error: "No authenticated user found. Please log in again.",
            },
          };
        }

        const safeLimit = Math.min(Math.max(Number(limit) || 100, 1), 200);

        const result = await fetchWithBQ({
          url: `/zoho/cliq/${encodeURIComponent(ownerKey)}/people`,
          method: "GET",
          params: { limit: safeLimit },
        });

        if (result.error) {
          return {
            error: result.error,
          };
        }

        const records = extractRecords(result.data);

        return {
          data: records.map((record, index) => normalizePerson(record, index)),
        };
      },

      providesTags: ["CliqPeople"],
    }),

    // ======================================================
    // MESSAGE A PERSON DIRECTLY
    // ======================================================

    sendCliqPersonMessage: builder.mutation({
      async queryFn({ email, text }, _queryApi, _extraOptions, fetchWithBQ) {
        const ownerKey = getOwnerKey();

        if (!ownerKey) {
          return {
            error: {
              status: "CUSTOM_ERROR",
              error: "No authenticated user found. Please log in again.",
            },
          };
        }

        if (!email) {
          return {
            error: {
              status: "CUSTOM_ERROR",
              error: "A person's email is required.",
            },
          };
        }

        const messageText =
          typeof text === "string" ? text.trim() : String(text ?? "").trim();

        if (!messageText) {
          return {
            error: {
              status: "CUSTOM_ERROR",
              error: "Message text is required.",
            },
          };
        }

        const result = await fetchWithBQ({
          url: `/zoho/cliq/${encodeURIComponent(
            ownerKey,
          )}/people/${encodeURIComponent(email)}/message`,

          method: "POST",

          body: {
            text: messageText,
          },
        });

        if (result.error) {
          return {
            error: result.error,
          };
        }

        return {
          data: result.data,
        };
      },

      invalidatesTags: ["CliqChats"],
    }),
  }),

  overrideExisting: true,
});

// ============================================================
// HOOKS
// ============================================================

export const {
  useGetCliqStatusQuery,
  useGetCliqChannelsQuery,
  useGetCliqChatsQuery,
  useGetCliqChatQuery,
  useGetCliqMessagesQuery,
  useSendCliqMessageMutation,
  useSendCliqChannelMessageMutation,
  useGetCliqChatFilesQuery,
  useUploadCliqChatFileMutation,
  useUploadCliqChannelFileMutation,
  useUploadCliqPersonFileMutation,
  useDownloadCliqFileMutation,
  useGetCliqPinsQuery,
  useGetCliqChatThreadsQuery,
  useGetCliqThreadsQuery,
  useGetCliqPeopleQuery,
  useSendCliqPersonMessageMutation,
  useGetCliqChannelMembersQuery,
  useGetCliqExternalChannelMembersQuery,
  useGetCliqChannelDetailsQuery,
} = cliqApi;
