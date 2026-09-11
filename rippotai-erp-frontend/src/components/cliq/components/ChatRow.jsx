import { T } from "../theme";
import { chatPreview, isChannel } from "../helpers";
import { Avatar } from "./shared";

export function ChatRow({ chat, onClick }) {
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
