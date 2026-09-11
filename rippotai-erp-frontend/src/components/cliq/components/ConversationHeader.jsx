import { T } from "../theme";
import { isChannel } from "../helpers";
import { BackIcon, CloseIcon } from "../icons";
import { Avatar, IconButton } from "./shared";

export function ConversationHeader({ chat, title, onBack, onClose }) {
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
