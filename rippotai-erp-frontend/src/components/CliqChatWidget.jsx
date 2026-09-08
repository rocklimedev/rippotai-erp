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
  useGetCliqChannelsQuery,
  useGetCliqChatsQuery,
  useGetCliqMessagesQuery,
  useSendCliqMessageMutation,
} from "../api/connectors/cliq.api";

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

export function CliqChatProvider({ children }) {
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

      {open && <CliqChatPanel onClose={() => setOpen(false)} />}
    </CliqChatContext.Provider>
  );
}

// ============================================================
// PANEL
// ============================================================

function CliqChatPanel({ onClose }) {
  const [chatId, setChatId] = useState(null);
  const [draft, setDraft] = useState("");
  const [switcherOpen, setSwitcherOpen] = useState(false);

  const listRef = useRef(null);
  const switcherRef = useRef(null);

  // ----------------------------------------------------------
  // CONNECTION STATUS
  // ----------------------------------------------------------

  const { data: status, isLoading: isStatusLoading } = useGetCliqStatusQuery();

  const cliqConnected = status?.connected === true;

  // ----------------------------------------------------------
  // CHANNELS
  // ----------------------------------------------------------
  //
  // Kept available because channels can still be useful for
  // future channel UI/actions.
  //
  // The actual chat panel below uses /chats.
  // ----------------------------------------------------------

  const {
    data: channels,
    isLoading: isChannelsLoading,
    isError: isChannelsError,
  } = useGetCliqChannelsQuery(undefined, {
    skip: !cliqConnected,
  });

  // ----------------------------------------------------------
  // CHATS
  // ----------------------------------------------------------

  const {
    data: chats,
    isLoading: isChatsLoading,
    isError: isChatsError,
  } = useGetCliqChatsQuery(undefined, {
    skip: !cliqConnected,
  });

  // ----------------------------------------------------------
  // SELECT FIRST CHAT
  // ----------------------------------------------------------

  useEffect(() => {
    if (!chatId && Array.isArray(chats) && chats.length > 0) {
      setChatId(chats[0].id);
    }
  }, [chats, chatId]);

  // ----------------------------------------------------------
  // IF CURRENT CHAT DISAPPEARS, SELECT FIRST CHAT
  // ----------------------------------------------------------

  useEffect(() => {
    if (!chatId || !Array.isArray(chats)) {
      return;
    }

    const exists = chats.some((chat) => chat.id === chatId);

    if (!exists) {
      setChatId(chats.length > 0 ? chats[0].id : null);
    }
  }, [chats, chatId]);

  // ----------------------------------------------------------
  // ACTIVE CHAT
  // ----------------------------------------------------------

  const activeChat = useMemo(
    () => chats?.find((chat) => chat.id === chatId) || null,
    [chats, chatId],
  );

  // ----------------------------------------------------------
  // MESSAGE HISTORY
  // ----------------------------------------------------------

  const {
    data: messages,
    isLoading: isMessagesLoading,
    isFetching: isMessagesFetching,
    isError: isMessagesError,
  } = useGetCliqMessagesQuery(
    {
      chatId,
      limit: 50,
    },
    {
      skip: !cliqConnected || !chatId,

      // Poll message history while panel is open.
      pollingInterval: 4000,
    },
  );

  // ----------------------------------------------------------
  // SEND MESSAGE
  // ----------------------------------------------------------

  const [sendMessage, { isLoading: isSending }] = useSendCliqMessageMutation();

  // ----------------------------------------------------------
  // AUTO SCROLL
  // ----------------------------------------------------------

  useEffect(() => {
    if (!listRef.current) {
      return;
    }

    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages]);

  // ----------------------------------------------------------
  // CLOSE CHAT SWITCHER ON OUTSIDE CLICK / ESCAPE
  // ----------------------------------------------------------

  useEffect(() => {
    if (!switcherOpen) {
      return;
    }

    const handlePointerDown = (event) => {
      if (switcherRef.current && !switcherRef.current.contains(event.target)) {
        setSwitcherOpen(false);
      }
    };

    const handleKey = (event) => {
      if (event.key === "Escape") {
        setSwitcherOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKey);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKey);
    };
  }, [switcherOpen]);

  // ----------------------------------------------------------
  // SEND
  // ----------------------------------------------------------

  const handleSend = async () => {
    const text = draft.trim();

    if (!text || !chatId || isSending) {
      return;
    }

    setDraft("");

    try {
      await sendMessage({
        chatId,
        text,
      }).unwrap();
    } catch (error) {
      console.error("Failed to send Cliq message:", error);

      // Restore draft if sending failed.
      setDraft(text);
    }
  };

  // ----------------------------------------------------------
  // KEYBOARD
  // ----------------------------------------------------------

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();

      handleSend();
    }
  };

  const canSend = draft.trim().length > 0 && !isSending;

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div
      className={[
        "fixed bottom-6 right-6 z-[90]",
        "flex w-[340px] max-w-[92vw] flex-col",
        "h-[480px] max-h-[80vh]",
        "rounded-2xl border border-[var(--stroke)] bg-paper",
        "shadow-[0_18px_48px_rgba(15,31,26,0.24)]",
        "overflow-hidden",
      ].join(" ")}
    >
      {/* ================================================== */}
      {/* HEADER */}
      {/* ================================================== */}

      <div
        className={[
          "flex items-center gap-2.5",
          "border-b border-[var(--stroke)]",
          "bg-[var(--mist-soft)] px-3.5 py-3",
        ].join(" ")}
      >
        {/* MONOGRAM */}

        <div
          className={[
            "relative flex h-8 w-8 shrink-0",
            "items-center justify-center",
            "rounded-full bg-[var(--ink-green)]",
          ].join(" ")}
        >
          <span className="text-[13px] font-semibold text-paper">C</span>

          <span
            aria-hidden="true"
            className={[
              "absolute -bottom-0.5 -right-0.5",
              "h-2.5 w-2.5 rounded-full border-2 border-[var(--mist-soft)]",

              cliqConnected ? "bg-[#3f6d5f]" : "bg-[#a54536]",
            ].join(" ")}
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-semibold leading-tight text-[var(--ink-green)]">
            Cliq
          </div>

          {/* CHAT SWITCHER */}

          {cliqConnected && chats && chats.length > 0 ? (
            <div ref={switcherRef} className="relative mt-0.5">
              <button
                type="button"
                onClick={() => setSwitcherOpen((value) => !value)}
                aria-haspopup="listbox"
                aria-expanded={switcherOpen}
                className={[
                  "flex w-full items-center gap-1",
                  "text-[11.5px] text-[var(--muted)]",
                  "hover:text-[var(--ink-green)]",
                  "transition-colors",
                ].join(" ")}
              >
                <span className="truncate">
                  {activeChat ? activeChat.name : "Choose a chat"}
                </span>

                <ChevronIcon open={switcherOpen} />
              </button>

              {switcherOpen && (
                <div
                  role="listbox"
                  className={[
                    "absolute left-0 top-[calc(100%+6px)] z-10",
                    "max-h-56 w-[240px] overflow-y-auto",
                    "rounded-xl border border-[var(--stroke)] bg-paper",
                    "p-1 shadow-[0_12px_28px_rgba(15,31,26,0.16)]",
                  ].join(" ")}
                >
                  {chats.map((chat) => {
                    const active = chat.id === chatId;

                    return (
                      <button
                        key={chat.id}
                        type="button"
                        role="option"
                        aria-selected={active}
                        onClick={() => {
                          setChatId(chat.id);
                          setSwitcherOpen(false);
                        }}
                        className={[
                          "flex w-full items-center justify-between gap-2",
                          "rounded-lg px-2.5 py-1.5 text-left",
                          "text-[12.5px]",

                          active
                            ? "bg-[var(--ink-green)] text-paper"
                            : "text-[var(--ink-green)] hover:bg-[var(--mist-soft)]",
                        ].join(" ")}
                      >
                        <span className="truncate">{chat.name}</span>

                        {active && (
                          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="mt-0.5 text-[11px] text-[var(--muted)]">
              {cliqConnected ? "No chats found" : "Not connected"}
            </div>
          )}
        </div>

        {/* CLOSE */}

        <button
          type="button"
          onClick={onClose}
          aria-label="Close Cliq chat"
          className={[
            "flex h-7 w-7 shrink-0",
            "items-center justify-center",
            "rounded-lg",
            "text-[var(--muted)]",
            "hover:bg-paper",
            "hover:text-[var(--ink-green)]",
            "transition-colors",
          ].join(" ")}
        >
          <CloseIcon />
        </button>
      </div>

      {/* ================================================== */}
      {/* BODY */}
      {/* ================================================== */}

      {isStatusLoading ? (
        <CenterState text="Checking your Cliq connection…" />
      ) : !cliqConnected ? (
        <CenterState
          title="Cliq isn't connected"
          text="Connect your Zoho Cliq account to chat from here."
        />
      ) : isChatsLoading ? (
        <CenterState text="Loading your chats…" />
      ) : isChatsError ? (
        <CenterState
          title="Couldn't load chats"
          text="Try again in a moment."
        />
      ) : !chatId ? (
        <CenterState
          title="No chats yet"
          text="Start a conversation in Cliq and it'll show up here."
        />
      ) : (
        <>
          {/* ================================================= */}
          {/* MESSAGE LIST */}
          {/* ================================================= */}

          <div
            ref={listRef}
            className={[
              "flex-1 overflow-y-auto",
              "px-3.5 py-3",
              "flex flex-col gap-2.5",
            ].join(" ")}
          >
            {isMessagesLoading ? (
              <CenterState text="Loading messages…" fill />
            ) : isMessagesError ? (
              <CenterState
                title="Couldn't load messages"
                text="Try again in a moment."
                fill
              />
            ) : !messages || messages.length === 0 ? (
              <CenterState text="No messages yet. Say hello." fill />
            ) : (
              messages.map((message) => (
                <MessageBubble key={message.id} message={message} />
              ))
            )}
          </div>

          {/* ================================================= */}
          {/* COMPOSER */}
          {/* ================================================= */}

          <div className="border-t border-[var(--stroke)] px-3 py-2.5">
            <div className="flex items-end gap-2">
              <textarea
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
                placeholder={
                  activeChat ? `Message ${activeChat.name}…` : "Type a message…"
                }
                disabled={isSending}
                className="bc-input flex-1 resize-none max-h-24"
              />

              <button
                type="button"
                onClick={handleSend}
                disabled={!canSend}
                aria-label="Send message"
                className={[
                  "flex h-9 w-9 shrink-0",
                  "items-center justify-center",
                  "rounded-full",
                  "transition-colors",

                  canSend
                    ? "bg-gold text-[var(--ink-green)]"
                    : "bg-[var(--mist-soft)] text-[var(--muted)] cursor-not-allowed",
                ].join(" ")}
              >
                <SendIcon />
              </button>
            </div>

            {/* SYNC INDICATOR */}

            {isMessagesFetching && (
              <div className="mt-1 text-[9.5px] text-[var(--muted)]">
                Syncing…
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ============================================================
// MESSAGE BUBBLE
// ============================================================

function MessageBubble({ message }) {
  const time = useMemo(() => {
    if (
      message.createdAt === undefined ||
      message.createdAt === null ||
      message.createdAt === ""
    ) {
      return "";
    }

    let timestamp = Number(message.createdAt);

    if (!Number.isFinite(timestamp)) {
      const parsed = Date.parse(message.createdAt);

      if (!Number.isFinite(parsed)) {
        return "";
      }

      timestamp = parsed;
    }

    // Cliq normally uses epoch milliseconds.
    // If an epoch timestamp comes back in seconds,
    // convert it to milliseconds.
    if (timestamp < 10000000000) {
      timestamp *= 1000;
    }

    const date = new Date(timestamp);

    if (Number.isNaN(date.getTime())) {
      return "";
    }

    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }, [message.createdAt]);

  return (
    <div
      className={[
        "flex flex-col gap-0.5",
        "max-w-[80%]",

        message.isOwn ? "self-end items-end" : "self-start items-start",
      ].join(" ")}
    >
      {!message.isOwn && (
        <span className="px-1 text-[10px] font-semibold text-[var(--muted)]">
          {message.senderName}
        </span>
      )}

      <div
        className={[
          "rounded-xl px-3 py-2",
          "text-[12.5px] leading-5",
          "whitespace-pre-wrap break-words",

          message.isOwn
            ? ["bg-[var(--ink-green)]", "text-paper", "rounded-br-sm"].join(" ")
            : [
                "bg-[var(--mist-soft)]",
                "text-[var(--ink-green)]",
                "rounded-bl-sm",
              ].join(" "),
        ].join(" ")}
      >
        {message.text}
      </div>

      {time && (
        <span className="px-1 text-[9.5px] tabular-nums text-[var(--muted)]">
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
      className={[
        "flex flex-col",
        "items-center justify-center",
        "text-center px-6",

        fill ? "flex-1" : "flex-1 min-h-[220px]",
      ].join(" ")}
    >
      {title && (
        <div className="text-[12.5px] font-semibold text-[var(--ink-green)]">
          {title}
        </div>
      )}

      <p className="mt-1 text-[11.5px] text-[var(--muted)]">{text}</p>
    </div>
  );
}

// ============================================================
// ICONS
// ============================================================

function CloseIcon() {
  return (
    <svg
      width="14"
      height="14"
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

function SendIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
      <path d="M1.5 1.5l13 6.5-13 6.5 2.5-6.5-2.5-6.5z" />
    </svg>
  );
}

function ChevronIcon({ open }) {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={[
        "shrink-0 transition-transform",
        open ? "rotate-180" : "rotate-0",
      ].join(" ")}
    >
      <path d="M2.5 4.5l3.5 3 3.5-3" />
    </svg>
  );
}
