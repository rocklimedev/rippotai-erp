import { T } from "../theme";
import {
  PinIcon,
  ChatBubbleIcon,
  HashIcon,
  ThreadIcon,
  PeopleIcon,
} from "../icons";

export function BottomNav({ unreadCount, active, setActive }) {
  const items = [
    { key: "pins", label: "My Pins", icon: PinIcon },
    { key: "chats", label: "Chats", icon: ChatBubbleIcon, badge: unreadCount },
    { key: "channels", label: "Channels", icon: HashIcon },

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
