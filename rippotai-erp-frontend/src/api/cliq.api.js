// src/api/cliq.api.js

import { baseApi } from "../store/baseApi";

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
      value.messageId;

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

const normalizeChannel = (record = {}, index = 0) => {
  const rawId = getValue(
    record,
    "channel_id",
    "channelId",
    "chat_id",
    "chatId",
    "id",
    "unique_name",
    "uniqueName",
  );

  const id = getId(rawId) || `channel-${index}`;

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
    id: String(id),

    name: String(name),

    uniqueName: String(uniqueName),

    isPrivate: Boolean(getValue(record, "is_private", "private", "isPrivate")),

    unreadCount: Number(getValue(record, "unread_count", "unreadCount")) || 0,

    participantCount:
      Number(getValue(record, "participants_count", "participantCount")) ||
      null,

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

  const id = getId(rawId) || `chat-${index}`;

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
    id: String(id),

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
// ATTACHMENT NORMALIZATION
// ============================================================

const normalizeAttachment = (record = {}) => {
  if (!record || typeof record !== "object") {
    return null;
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

    // --------------------------------------------------------
    // ARRAY
    // --------------------------------------------------------

    if (Array.isArray(candidate)) {
      if (!candidate.length) {
        continue;
      }

      const first = candidate[0];

      if (!first || typeof first !== "object") {
        continue;
      }

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

      if (file || thumbnail) {
        return {
          file: String(file),
          thumbnail: String(thumbnail),
          raw: first,
        };
      }

      continue;
    }

    // --------------------------------------------------------
    // OBJECT
    // --------------------------------------------------------

    if (typeof candidate === "object") {
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

      if (file || thumbnail) {
        return {
          file: String(file),
          thumbnail: String(thumbnail),
          raw: candidate,
        };
      }
    }
  }

  return null;
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
  // ATTACHMENT
  // ----------------------------------------------------------

  const attachment = normalizeAttachment(record);

  if (!text && attachment?.file) {
    text = String(attachment.file);
  }

  if (!text && attachment?.thumbnail) {
    text = "Attachment";
  }

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

    senderId: senderId ? String(senderId) : null,

    senderName: String(senderName || "Unknown"),

    createdAt,

    isOwn,

    attachment,

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

// ============================================================
// API
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

        /*
         * IMPORTANT:
         *
         * Chat history:
         * GET /chats/{chatId}/messages
         *
         * Sending:
         * POST /chats/{chatId}/message
         *
         * NOT:
         * POST /chats/{chatId}/messages
         */

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

        "CliqChats",
      ],
    }),

    // ======================================================
    // SEND CHANNEL MESSAGE
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

      invalidatesTags: ["CliqChannels"],
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
} = cliqApi;
