import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  useGetCliqStatusQuery,
  useGetCliqChatsQuery,
  useGetCliqChannelsQuery,
  useGetCliqChatQuery,
  useGetCliqPinsQuery,
  useGetCliqThreadsQuery,
  useGetCliqChatThreadsQuery,
  useGetCliqPeopleQuery,
  useSendCliqChannelMessageMutation,
  useSendCliqPersonMessageMutation,
  useGetCliqMessagesQuery,
  useSendCliqMessageMutation,
} from "../api/connectors/cliq.api";

// ============================================================
// THEME TOKENS
// ============================================================
//
// Mirrors the host app's CSS variables (index.css / tailwind
// config) so the widget matches the rest of the product.
// ============================================================

const T = {
  // Primary / brand
  accent: "var(--ink-green, #1f453b)",
  accentSoft: "var(--sage-soft, #d8e0da)",
  accentHover: "#163229",

  // Text
  ink: "var(--ink, #0f1f1a)",
  muted: "var(--muted, #6b7b7c)",

  // Surfaces
  surface: "var(--paper, #ffffff)",
  surfaceAlt: "var(--mist-soft, #f4f6f7)",
  mist: "var(--mist, #eaeef0)",
  sage: "var(--sage, #b5c4b6)",

  // Borders & status
  border: "var(--stroke, rgba(31, 69, 59, 0.12))",
  danger: "#b45309",
  online: "#2FA96B",
};

const AVATAR_PALETTE = [
  "#1f453b",
  "#2d5a4a",
  "#3d6b5c",
  "#4a7c6b",
  "#5a8d7c",
  "#163229",
];

// ============================================================
// CONTEXT
// ============================================================

const CliqChatContext = createContext(null);

export function useCliqChat() {
  const ctx = useContext(CliqChatContext);

  if (!ctx) {
    throw new Error("useCliqChat must be used inside <CliqChatProvider>");
  }

  return ctx;
}

// ============================================================
// PROVIDER
// ============================================================

export function CliqChatProvider({ children, currentCliqUserId }) {
  const [open, setOpen] = useState(false);

  const { data: status } = useGetCliqStatusQuery(undefined, {
    pollingInterval: open ? 15000 : 60000,
  });

  const cliqConnected = status?.connected === true;

  const value = useMemo(
    () => ({
      open,
      cliqConnected,

      openChat: () => setOpen(true),

      closeChat: () => setOpen(false),

      toggleChat: () => setOpen((value) => !value),
    }),
    [open, cliqConnected],
  );

  return (
    <CliqChatContext.Provider value={value}>
      {children}

      {open && (
        <CliqMiniWidget
          currentCliqUserId={currentCliqUserId}
          onClose={() => setOpen(false)}
        />
      )}
    </CliqChatContext.Provider>
  );
}

// ============================================================
// SMALL HELPERS
// ============================================================

function getInitials(name = "") {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return "?";
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function avatarColor(seed = "") {
  let hash = 0;

  for (let i = 0; i < seed.length; i += 1) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }

  return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length];
}

function isChannel(chat) {
  const type = String(chat?.type || "").toLowerCase();

  return type.includes("channel") || type.includes("group");
}

function chatPreview(chat) {
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

function getTimestamp(value) {
  if (value === undefined || value === null || value === "") {
    return 0;
  }

  const numeric = Number(value);

  if (Number.isFinite(numeric)) {
    return numeric < 10000000000 ? numeric * 1000 : numeric;
  }

  const parsed = Date.parse(String(value));

  return Number.isFinite(parsed) ? parsed : 0;
}

function formatClock(value) {
  const ts = getTimestamp(value);

  if (!ts) {
    return "";
  }

  return new Date(ts).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ============================================================
// ROOT WIDGET (list <-> conversation)
// ============================================================

const EMPTY = [];
const TAB_LABELS = {
  pins: "My Pins",
  chats: "Chats",
  channels: "Channels",
  threads: "Threads",
  people: "People",
};

// Only explicit message-stream identifiers are used for history.
function targetFor(item, kind = "chat") {
  return { ...item, kind, chatId: item.chatId || null };
}
function personChat(person, chats) {
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
function CliqMiniWidget({ onClose, currentCliqUserId }) {
  const [activeChat, setActiveChat] = useState(null);
  const [section, setSection] = useState("chats");
  const [expanded, setExpanded] = useState(false);
  const [tab, setTab] = useState("recent");
  const [query, setQuery] = useState("");
  const [drafts, setDrafts] = useState({});
  const searchRef = useRef(null);
  const { data: status, isLoading: isStatusLoading } = useGetCliqStatusQuery();
  const connected = status?.connected === true;
  const chatsQuery = useGetCliqChatsQuery(undefined, {
    skip: !connected,
    pollingInterval: 15000,
  });
  const channelsQuery = useGetCliqChannelsQuery(undefined, {
    skip: !connected || section !== "channels",
  });
  const pinsQuery = useGetCliqPinsQuery(undefined, {
    skip: !connected || section !== "pins",
  });
  const threadsQuery = useGetCliqThreadsQuery(undefined, {
    skip: !connected || section !== "threads",
  });
  const peopleQuery = useGetCliqPeopleQuery(200, {
    skip: !connected || section !== "people",
  });
  const source = {
    chats: chatsQuery,
    channels: channelsQuery,
    pins: pinsQuery,
    threads: threadsQuery,
    people: peopleQuery,
  }[section];
  const chatList = chatsQuery.data || EMPTY;
  const unreadCount = chatList.filter((chat) => chat.unreadCount > 0).length;
  const switchSection = (next) => {
    setSection(next);
    setTab("recent");
    setQuery("");
    setActiveChat(null);
  };
  const openConversation = (item) => {
    if (section === "people") {
      const existing = personChat(item, chatList);
      setActiveChat({
        ...targetFor(item, "person"),
        chatId: existing?.chatId || null,
      });
    } else if (section === "channels") {
      const linked = chatList.find(
        (chat) =>
          (item.chatId && chat.chatId === item.chatId) ||
          String(chat.raw?.channel_id || chat.raw?.channel?.id || "") ===
            item.channelId,
      );
      setActiveChat({
        ...targetFor(item, "channel"),
        chatId: item.chatId || linked?.chatId || null,
      });
    } else {
      const linked = chatList.find(
        (chat) => chat.chatId && chat.chatId === item.chatId,
      );
      setActiveChat(
        targetFor(
          { ...linked, ...item },
          section === "threads" ? "thread" : "chat",
        ),
      );
    }
  };
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (source.data || EMPTY)
      .filter(
        (item) =>
          (tab !== "unread" || item.unreadCount > 0) &&
          (!q ||
            [
              item.name,
              item.email,
              item.categoryTitle,
              item.parentName,
              chatPreview(item),
            ].some((value) =>
              String(value || "")
                .toLowerCase()
                .includes(q),
            )),
      )
      .map((item) =>
        section === "pins"
          ? { ...item, preview: `${item.categoryTitle} · ${chatPreview(item)}` }
          : item,
      );
  }, [source.data, query, tab, section]);

  useEffect(() => {
    const handleKey = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.code === "Space") {
        event.preventDefault();
        setActiveChat(null);
        requestAnimationFrame(() => searchRef.current?.focus());
      } else if (event.key === "Escape") {
        if (activeChat) setActiveChat(null);
        else onClose();
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [activeChat, onClose]);

  const draftKey = activeChat ? `${activeChat.kind}:${activeChat.id}` : "";
  return (
    <div
      role="region"
      aria-label="Cliq Mini"
      style={{
        position: "fixed",
        bottom: 16,
        right: 12,
        zIndex: 90,
        width: expanded ? 640 : 320,
        maxWidth: "calc(100vw - 24px)",
        height: expanded ? 720 : 560,
        maxHeight: "calc(100dvh - 32px)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        borderRadius: 16,
        border: `1.5px solid ${T.border}`,
        background: T.surface,
        boxShadow:
          "0 4px 12px rgba(15, 31, 26, 0.05), 0 1px 2px rgba(15, 31, 26, 0.04), 0 20px 48px rgba(15, 31, 26, 0.12)",
        color: T.ink,
        fontFamily:
          '"Nunito Sans", "Helvetica Neue", Helvetica, Arial, sans-serif',
      }}
    >
      <style>{`
        .cliq-control{
          border:1px solid ${T.border};
          border-radius:8px;
          padding:5px 10px;
          background:${T.surface};
          color:${T.accent};
          cursor:pointer;
          font:inherit;
          font-size:11px;
          font-weight:600;
        }
        .cliq-control:hover{
          background:${T.surfaceAlt};
        }
        .cliq-control[aria-pressed="true"]{
          background:${T.accentSoft};
          border-color:${T.accent};
        }
        .cliq-notice{
          padding:8px 12px;
          font-size:11px;
          line-height:1.5;
          color:${T.muted};
        }
      `}</style>
      {!activeChat ? (
        <ListScreen
          cliqConnected={connected}
          isStatusLoading={isStatusLoading}
          isChatsLoading={
            source.isLoading || (source.isFetching && !source.data)
          }
          isChatsError={source.isError}
          chats={filtered}
          unreadCount={unreadCount}
          tab={tab}
          setTab={setTab}
          query={query}
          setQuery={setQuery}
          onSelectChat={openConversation}
          onClose={onClose}
          section={section}
          switchSection={switchSection}
          onExpand={() => setExpanded((value) => !value)}
          expanded={expanded}
          searchRef={searchRef}
          onRetry={source.refetch}
        />
      ) : (
        <ConversationScreen
          key={draftKey}
          chat={activeChat}
          connected={connected}
          currentCliqUserId={currentCliqUserId}
          draft={drafts[draftKey] || ""}
          setDraft={(value) =>
            setDrafts((previous) => ({ ...previous, [draftKey]: value }))
          }
          onBack={() => setActiveChat(null)}
          onClose={onClose}
          chats={chatList}
          onOpenThread={(thread) => setActiveChat(targetFor(thread, "thread"))}
        />
      )}
    </div>
  );
}

// ============================================================
// LIST SCREEN
// ============================================================

function ListScreen({
  cliqConnected,
  isStatusLoading,
  isChatsLoading,
  isChatsError,
  chats,
  unreadCount,
  tab,
  setTab,
  query,
  setQuery,
  onSelectChat,
  onClose,
  section,
  switchSection,
  onExpand,
  expanded,
  searchRef,
  onRetry,
}) {
  return (
    <>
      {/* HEADER */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "10px 12px",
          borderBottom: `1px solid ${T.border}`,
        }}
      >
        <div
          style={{
            display: "flex",
            height: 28,
            width: 28,
            flexShrink: 0,
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 8,
            background: T.accentSoft,
            color: T.accent,
          }}
        >
          <ChatBubbleIcon />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 13.5,
              fontWeight: 600,
              color: T.ink,
              fontFamily: '"Poppins", "Arial", sans-serif',
            }}
          >
            Cliq Mini
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              fontSize: 11,
              color: T.muted,
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: cliqConnected ? T.online : T.muted,
                flexShrink: 0,
              }}
            />
            {isStatusLoading
              ? "Checking…"
              : cliqConnected
                ? "Connected"
                : "Not connected"}
          </div>
        </div>

        <IconButton
          label={expanded ? "Reduce size" : "Expand"}
          onClick={onExpand}
        >
          <ExpandIcon />
        </IconButton>

        <IconButton label="Close Cliq" onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </div>

      {/* SEARCH */}
      <div style={{ padding: "10px 12px 6px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            borderRadius: 10,
            border: `1px solid ${T.border}`,
            background: T.surfaceAlt,
            padding: "7px 9px",
          }}
        >
          <SearchIcon />

          <input
            ref={searchRef}
            aria-label={`Search ${TAB_LABELS[section]}`}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search (Ctrl + Space)"
            style={{
              flex: 1,
              minWidth: 0,
              border: "none",
              outline: "none",
              background: "transparent",
              fontSize: 12,
              color: T.ink,
              fontFamily: "inherit",
            }}
          />

          <span style={{ color: T.muted, display: "flex", gap: 6 }}>
            <span title="Unread filter">
              <button
                type="button"
                aria-label="Toggle unread filter"
                disabled={section === "people"}
                onClick={() => setTab(tab === "unread" ? "recent" : "unread")}
                style={{
                  border: 0,
                  background: "transparent",
                  color: "inherit",
                  cursor: "pointer",
                }}
              >
                <SlidersIcon />
              </button>
            </span>
            <button
              type="button"
              aria-label="Mentions unavailable"
              title="Mentions are not available in this integration"
              disabled
              style={{
                border: 0,
                background: "transparent",
                color: "inherit",
                opacity: 0.4,
              }}
            >
              <AtIcon />
            </button>
            <button
              type="button"
              aria-label="Open My Pins"
              onClick={() => switchSection("pins")}
              style={{
                border: 0,
                background: "transparent",
                color: "inherit",
                cursor: "pointer",
              }}
            >
              <StarIcon />
            </button>
          </span>
        </div>
      </div>

      <div style={{ padding: "3px 12px", fontSize: 11, color: T.muted }}>
        {TAB_LABELS[section]}
      </div>
      {section === "threads" && (
        <div className="cliq-notice">
          Followed threads from a limited set of recent conversations.
        </div>
      )}
      {section === "people" && (
        <div className="cliq-notice">
          Showing up to 200 directory entries. Choose someone to message.
        </div>
      )}
      {/* TABS */}
      <div
        style={{
          display: "flex",
          gap: 6,
          padding: "6px 12px 8px",
        }}
      >
        <TabButton active={tab === "recent"} onClick={() => setTab("recent")}>
          {section === "people" ? "All people" : "Recent"}
        </TabButton>

        {section !== "people" && (
          <TabButton active={tab === "unread"} onClick={() => setTab("unread")}>
            Unread
            {section === "chats" && unreadCount > 0 ? ` (${unreadCount})` : ""}
          </TabButton>
        )}
      </div>

      {/* LIST */}
      <div
        style={{ flex: 1, minHeight: 0, overflowY: "auto", paddingBottom: 56 }}
      >
        {isStatusLoading || isChatsLoading ? (
          <CenterState text="Loading your chats…" />
        ) : !cliqConnected ? (
          <CenterState
            title="Cliq isn't connected"
            text="Connect your Zoho Cliq account to chat from here."
          />
        ) : isChatsError ? (
          <>
            <CenterState
              title={`Couldn't load ${TAB_LABELS[section]}`}
              text="Please try again."
            />
            <button className="cliq-control" type="button" onClick={onRetry}>
              Retry
            </button>
          </>
        ) : chats.length === 0 ? (
          <CenterState
            title="Nothing here"
            text={
              tab === "unread"
                ? "You're all caught up."
                : `No matching items in ${TAB_LABELS[section]}.`
            }
          />
        ) : (
          chats.map((chat) => (
            <ChatRow
              key={`${chat.categoryId || ""}:${chat.id}`}
              chat={chat}
              onClick={() => onSelectChat(chat)}
            />
          ))
        )}
      </div>
      <button
        type="button"
        onClick={() => {
          switchSection("people");
          requestAnimationFrame(() => searchRef.current?.focus());
        }}
        aria-label="New chat"
        style={{
          position: "absolute",
          right: 14,
          bottom: 64,
          width: 40,
          height: 40,
          borderRadius: "50%",
          border: "none",
          background: T.accent,
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 8px 18px rgba(31, 69, 59, 0.35)",
          cursor: "pointer",
        }}
      >
        <PlusIcon />
      </button>
      {/* BOTTOM NAV */}
      <BottomNav
        unreadCount={unreadCount}
        active={section}
        setActive={switchSection}
      />
    </>
  );
}

// ============================================================
// CHAT ROW
// ============================================================

function ChatRow({ chat, onClick }) {
  const channel = isChannel(chat);
  const unread = chat.unreadCount > 0;

  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "flex",
        width: "100%",
        alignItems: "flex-start",
        gap: 10,
        padding: "9px 12px",
        border: "none",
        borderBottom: `1px solid ${T.border}`,
        background: "transparent",
        textAlign: "left",
        cursor: "pointer",
      }}
      onMouseEnter={(event) => {
        event.currentTarget.style.background = T.surfaceAlt;
      }}
      onMouseLeave={(event) => {
        event.currentTarget.style.background = "transparent";
      }}
    >
      <Avatar name={chat.name} channel={channel} />

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 12.5,
            fontWeight: 600,
            color: T.ink,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {channel ? `#${chat.name.replace(/^#/, "")}` : chat.name}
        </div>

        <div
          style={{
            marginTop: 2,
            fontSize: 11.5,
            color: T.muted,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {chatPreview(chat)}
        </div>
      </div>

      {unread && (
        <span
          style={{
            flexShrink: 0,
            minWidth: 18,
            height: 18,
            borderRadius: 9,
            background: T.accent,
            color: "#fff",
            fontSize: 10,
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "0 5px",
          }}
        >
          {chat.unreadCount}
        </span>
      )}
    </button>
  );
}

// ============================================================
// AVATAR
// ============================================================

function Avatar({ name, channel, size = 34 }) {
  const color = avatarColor(name || "?");

  return (
    <div
      style={{
        width: size,
        height: size,
        flexShrink: 0,
        borderRadius: channel ? 9 : "50%",
        background: color,
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.36,
        fontWeight: 700,
      }}
    >
      {channel ? <HashIcon /> : getInitials(name)}
    </div>
  );
}

// ============================================================
// BOTTOM NAV
// ============================================================

function BottomNav({ unreadCount, active, setActive }) {
  const items = [
    { key: "pins", label: "My Pins", icon: PinIcon },
    { key: "chats", label: "Chats", icon: ChatBubbleIcon, badge: unreadCount },
    { key: "channels", label: "Channels", icon: HashIcon },
    { key: "threads", label: "Threads", icon: ThreadIcon },
    { key: "people", label: "People", icon: PeopleIcon },
  ];

  return (
    <div
      style={{
        display: "flex",
        borderTop: `1px solid ${T.border}`,
        background: T.surface,
        flexShrink: 0,
      }}
    >
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = active === item.key;

        return (
          <button
            key={item.key}
            type="button"
            onClick={() => setActive(item.key)}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 2,
              padding: "7px 0 8px",
              border: "none",
              background: "transparent",
              color: isActive ? T.accent : T.muted,
              cursor: "pointer",
              position: "relative",
            }}
          >
            <span style={{ position: "relative" }}>
              <Icon />

              {item.badge > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: -4,
                    right: -6,
                    minWidth: 13,
                    height: 13,
                    borderRadius: 7,
                    background: T.accent,
                    color: "#fff",
                    fontSize: 8.5,
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "0 3px",
                  }}
                >
                  {item.badge}
                </span>
              )}
            </span>

            <span style={{ fontSize: 9.5, fontWeight: isActive ? 700 : 500 }}>
              {item.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ============================================================
// TAB BUTTON
// ============================================================

function TabButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        flex: 1,
        padding: "6px 0",
        fontSize: 11.5,
        fontWeight: 700,
        borderRadius: 8,
        border: "none",
        cursor: "pointer",
        background: active ? T.accentSoft : "transparent",
        color: active ? T.accent : T.muted,
      }}
    >
      {children}
    </button>
  );
}

// ============================================================
// CONVERSATION SCREEN
// ============================================================

function ConversationScreen({
  chat,
  connected,
  currentCliqUserId,
  draft,
  setDraft,
  onBack,
  onClose,
  chats,
  onOpenThread,
}) {
  const [sendError, setSendError] = useState("");
  const [confirmed, setConfirmed] = useState([]);
  const [showThreads, setShowThreads] = useState(false);
  const listRef = useRef(null);
  const atBottom = useRef(true);
  const sendingLock = useRef(false);
  const existing = chat.kind === "person" ? personChat(chat, chats) : null;
  const chatId = chat.chatId || existing?.chatId || null;
  const details = useGetCliqChatQuery(chatId, { skip: !connected || !chatId });
  const history = useGetCliqMessagesQuery(
    { chatId, limit: 50 },
    { skip: !connected || !chatId, pollingInterval: 4000 },
  );
  const threads = useGetCliqChatThreadsQuery(chatId, {
    skip: !connected || !chatId || !showThreads,
  });
  const [sendMessage, sendState] = useSendCliqMessageMutation();
  const [sendChannel, channelState] = useSendCliqChannelMessageMutation();
  const [sendPerson, personState] = useSendCliqPersonMessageMutation();
  const isSending =
    sendState.isLoading || channelState.isLoading || personState.isLoading;
  const hasDestination =
    chat.kind === "person"
      ? Boolean(chat.email)
      : chat.kind === "channel"
        ? Boolean(chat.uniqueName || chatId)
        : Boolean(chatId);
  const messages = history.currentData || EMPTY;
  const canSend =
    connected && hasDestination && draft.trim().length > 0 && !isSending;
  const titleChat = {
    ...chat,
    name:
      details.currentData?.name && details.currentData.name !== "Unknown"
        ? details.currentData.name
        : chat.name,
  };

  useEffect(() => {
    if (atBottom.current && listRef.current)
      listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, confirmed, showThreads]);

  const handleSend = async () => {
    const text = draft.trim();
    if (!canSend || sendingLock.current) return;
    sendingLock.current = true;
    setSendError("");
    try {
      if (chat.kind === "person")
        await sendPerson({ email: chat.email, chatId, text }).unwrap();
      else if (chat.kind === "channel" && chat.uniqueName)
        await sendChannel({
          channelUniqueName: chat.uniqueName,
          chatId,
          text,
        }).unwrap();
      else await sendMessage({ chatId, text }).unwrap();
      // Retain the draft on failure; only clear after server acknowledgement.
      setDraft("");
      atBottom.current = true;
      if (!chatId)
        setConfirmed((previous) => [
          ...previous,
          {
            id: `sent-${Date.now()}-${previous.length}`,
            text,
            isOwn: true,
            createdAt: Date.now(),
          },
        ]);
    } catch (error) {
      const message = error?.data?.message || error?.error;
      setSendError(
        typeof message === "string"
          ? message
          : "Message wasn't sent. Please try again.",
      );
    } finally {
      sendingLock.current = false;
    }
  };

  return (
    <>
      <ConversationHeader chat={titleChat} onBack={onBack} onClose={onClose} />
      {chatId && chat.kind !== "thread" && (
        <div
          style={{
            display: "flex",
            gap: 8,
            padding: "6px 12px",
            borderBottom: `1px solid ${T.border}`,
          }}
        >
          <button
            className="cliq-control"
            type="button"
            aria-pressed={!showThreads}
            onClick={() => setShowThreads(false)}
          >
            Messages
          </button>
          <button
            className="cliq-control"
            type="button"
            aria-pressed={showThreads}
            onClick={() => setShowThreads(true)}
          >
            Threads in this chat
          </button>
        </div>
      )}
      {!connected && (
        <div className="cliq-notice" role="status">
          Cliq is disconnected. Reconnect before sending.
        </div>
      )}
      <div
        ref={listRef}
        onScroll={(event) => {
          const el = event.currentTarget;
          atBottom.current =
            el.scrollHeight - el.scrollTop - el.clientHeight < 70;
        }}
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          padding: 12,
          display: "flex",
          flexDirection: "column",
          gap: 10,
          background: T.surfaceAlt,
        }}
      >
        {showThreads ? (
          <>
            {threads.isFetching && !threads.currentData ? (
              <CenterState text="Loading threads…" fill />
            ) : threads.isError ? (
              <>
                <CenterState text="Couldn't load threads." fill />
                <button className="cliq-control" onClick={threads.refetch}>
                  Retry
                </button>
              </>
            ) : !threads.currentData?.length ? (
              <CenterState text="No threads in this conversation." fill />
            ) : (
              threads.currentData.map((thread) => (
                <ChatRow
                  key={thread.id}
                  chat={thread}
                  onClick={() => onOpenThread(thread)}
                />
              ))
            )}
          </>
        ) : !chatId ? (
          <>
            <CenterState
              title={
                chat.kind === "person"
                  ? "Message this person"
                  : "Message this channel"
              }
              text={
                hasDestination
                  ? "You can send a message here. History will appear when Cliq provides the linked conversation."
                  : "This item has no message destination available."
              }
              fill
            />
            {confirmed.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
          </>
        ) : history.isFetching && !history.currentData ? (
          <CenterState text="Loading messages…" fill />
        ) : history.isError ? (
          <>
            <CenterState
              title="Couldn't load messages"
              text="Your draft is safe."
              fill
            />
            <button className="cliq-control" onClick={history.refetch}>
              Retry
            </button>
          </>
        ) : !messages.length ? (
          <CenterState text="No messages yet. Say hello." fill />
        ) : (
          messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={{
                ...message,
                isOwn:
                  message.isOwn ||
                  Boolean(
                    currentCliqUserId &&
                    String(message.senderId) === String(currentCliqUserId),
                  ),
              }}
            />
          ))
        )}
      </div>
      {!showThreads && (
        <div
          style={{ borderTop: `1px solid ${T.border}`, padding: "8px 10px" }}
        >
          {sendError && (
            <div
              role="alert"
              style={{ color: T.danger, fontSize: 11, marginBottom: 6 }}
            >
              {sendError}
            </div>
          )}
          <div style={{ display: "flex", alignItems: "flex-end", gap: 8 }}>
            <textarea
              value={draft}
              aria-label={`Message ${chat.name}`}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (
                  event.key === "Enter" &&
                  !event.shiftKey &&
                  !event.nativeEvent.isComposing
                ) {
                  event.preventDefault();
                  handleSend();
                }
              }}
              rows={2}
              placeholder={`Message ${chat.name}…`}
              disabled={isSending || !connected || !hasDestination}
              style={{
                flex: 1,
                minWidth: 0,
                resize: "vertical",
                maxHeight: 96,
                borderRadius: 10,
                border: `1px solid ${T.border}`,
                padding: "8px 10px",
                fontSize: 12.5,
                fontFamily: "inherit",
                background: T.surface,
                color: T.ink,
              }}
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={!canSend}
              aria-label="Send message"
              style={{
                flexShrink: 0,
                width: 34,
                height: 34,
                borderRadius: "50%",
                border: "none",
                cursor: canSend ? "pointer" : "not-allowed",
                background: canSend ? T.accent : T.surfaceAlt,
                color: canSend ? "white" : T.muted,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <SendIcon />
            </button>
          </div>
          {history.isFetching && (
            <div style={{ marginTop: 4, fontSize: 9.5, color: T.muted }}>
              Syncing…
            </div>
          )}
        </div>
      )}
    </>
  );
}

function ConversationHeader({ chat, title, onBack, onClose }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 12px",
        borderBottom: `1px solid ${T.border}`,
      }}
    >
      <IconButton label="Back" onClick={onBack}>
        <BackIcon />
      </IconButton>

      {chat && <Avatar name={chat.name} channel={isChannel(chat)} size={28} />}

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: T.ink,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            fontFamily: '"Poppins", "Arial", sans-serif',
          }}
        >
          {chat
            ? isChannel(chat)
              ? `#${chat.name.replace(/^#/, "")}`
              : chat.name
            : title}
        </div>
      </div>

      <IconButton label="Close Cliq" onClick={onClose}>
        <CloseIcon />
      </IconButton>
    </div>
  );
}

// ============================================================
// MESSAGE BUBBLE
// ============================================================

function MessageBubble({ message }) {
  const time = formatClock(message.createdAt);

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
          padding: "7px 10px",
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
        {message.text}
      </div>

      {time && (
        <span style={{ padding: "0 2px", fontSize: 9.5, color: T.muted }}>
          {time}
        </span>
      )}
    </div>
  );
}

// ============================================================
// CENTER STATE
// ============================================================

function CenterState({ title, text, fill }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "0 24px",
        flex: fill ? 1 : "1 1 220px",
        minHeight: fill ? undefined : 220,
      }}
    >
      {title && (
        <div
          style={{
            fontSize: 12.5,
            fontWeight: 600,
            color: T.ink,
            fontFamily: '"Poppins", "Arial", sans-serif',
          }}
        >
          {title}
        </div>
      )}

      {text && (
        <p style={{ marginTop: 4, fontSize: 11.5, color: T.muted }}>{text}</p>
      )}
    </div>
  );
}

// ============================================================
// ICON BUTTON WRAPPER
// ============================================================

function IconButton({ children, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      style={{
        display: "flex",
        height: 26,
        width: 26,
        flexShrink: 0,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 7,
        border: "none",
        background: "transparent",
        color: T.muted,
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}

// ============================================================
// ICONS
// ============================================================

function ChatBubbleIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 3.5h12v7H6.5L3 13.5V10.5H2z" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    >
      <path d="M3 3l10 10M13 3L3 13" />
    </svg>
  );
}

function ExpandIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 2H2v4M10 14h4v-4M2 14l4.5-4.5M14 2L9.5 6.5" />
    </svg>
  );
}

function BackIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M10 3L4 8l6 5" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      style={{ color: T.muted, flexShrink: 0 }}
    >
      <circle cx="7" cy="7" r="4.5" />
      <path d="M13.5 13.5L10.5 10.5" />
    </svg>
  );
}

function SlidersIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    >
      <path d="M3 5h10M3 11h10" />
      <circle cx="6" cy="5" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="10" cy="11" r="1.4" fill="currentColor" stroke="none" />
    </svg>
  );
}

function AtIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <circle cx="8" cy="8.3" r="2.6" />
      <path
        d="M10.6 8.3v1a1.6 1.6 0 003.2 0V8a5.8 5.8 0 10-2.3 4.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinejoin="round"
    >
      <path d="M8 1.6l1.9 3.9 4.3.6-3.1 3 .7 4.3L8 11.4l-3.8 2 .7-4.3-3.1-3 4.3-.6z" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <path d="M8 2v12M2 8h12" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
      <path d="M1.5 1.5l13 6.5-13 6.5 2.5-6.5-2.5-6.5z" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M8 2l1.2 3.6L13 7l-3.3 2 1 3.8L8 10.7l-2.7 2.1 1-3.8L3 7l3.8-1.4z" />
    </svg>
  );
}

function HashIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    >
      <path d="M5.5 2L4 14M12 2l-1.5 12M2.5 6h11M2 10.5h11" />
    </svg>
  );
}

function ThreadIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2.5 3.5h11M2.5 7h8M2.5 10.5h11M2.5 14h5" />
    </svg>
  );
}

function PeopleIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="6" cy="5.5" r="2.2" />
      <path d="M1.8 13.5c.5-2.4 2.1-3.8 4.2-3.8s3.7 1.4 4.2 3.8" />
      <circle cx="11.5" cy="5.8" r="1.7" />
      <path d="M10.8 9.9c1.6.2 2.7 1.4 3.1 3.1" />
    </svg>
  );
}
