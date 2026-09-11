import { T } from "../theme";
import { avatarColor, getInitials, isChannel } from "../helpers";
import { HashIcon } from "../icons";

export function Avatar({ name, channel, size = 34 }) {
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

export function IconButton({ children, label, onClick }) {
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

export function CenterState({ title, text, fill }) {
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

export function TabButton({ active, onClick, children }) {
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
