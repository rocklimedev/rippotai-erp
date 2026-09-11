import { T, TAB_LABELS } from "../theme";
import {
  ChatBubbleIcon,
  CloseIcon,
  ExpandIcon,
  SearchIcon,
  SlidersIcon,
  AtIcon,
  StarIcon,
  PlusIcon,
} from "../icons";
import { IconButton, CenterState, TabButton } from "./shared";
import { ChatRow } from "./ChatRow";
import { BottomNav } from "./BottomNav";

export function ListScreen({
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

      <BottomNav
        unreadCount={unreadCount}
        active={section}
        setActive={switchSection}
      />
    </>
  );
}
