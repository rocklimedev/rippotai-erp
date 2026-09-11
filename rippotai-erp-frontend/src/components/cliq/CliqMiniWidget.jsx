import { useEffect, useMemo, useRef, useState } from "react";
import {
  useGetCliqStatusQuery,
  useGetCliqChatsQuery,
  useGetCliqChannelsQuery,
  useGetCliqPinsQuery,
  useGetCliqThreadsQuery,
  useGetCliqPeopleQuery,
} from "../../api/connectors/cliq.api"; // adjust path if needed to match project layout
import { T, EMPTY } from "./theme";
import { chatPreview, personChat, targetFor } from "./helpers";
import { ListScreen } from "./components/ListScreen";
import { ConversationScreen } from "./components/ConversationScreen";

export function CliqMiniWidget({ onClose, currentCliqUserId }) {
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
          onExpand={() => setExpanded((v) => !v)}
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
