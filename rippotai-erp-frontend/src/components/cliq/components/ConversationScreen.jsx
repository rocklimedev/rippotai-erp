import { useEffect, useRef, useState } from "react";
import {
  useGetCliqChatQuery,
  useGetCliqMessagesQuery,
  useGetCliqChatThreadsQuery,
  useGetCliqChatFilesQuery,
  useSendCliqMessageMutation,
  useSendCliqChannelMessageMutation,
  useSendCliqPersonMessageMutation,
  useUploadCliqChatFileMutation,
  useUploadCliqChannelFileMutation,
  useUploadCliqPersonFileMutation,
} from "../../../api/connectors/cliq.api"; // adjust path if needed to match project layout
import { T, EMPTY } from "../theme";
import { personChat, targetFor } from "../helpers";
import { PaperclipIcon, SendIcon } from "../icons";
import { IconButton, CenterState } from "./shared";
import { ConversationHeader } from "./ConversationHeader";
import { ChatRow } from "./ChatRow";
import { MessageBubble } from "./MessageBubble";
import { FileRow } from "./FileRow";

export function ConversationScreen({
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
  // "messages" | "threads" | "files"
  const [panel, setPanel] = useState("messages");
  const [uploading, setUploading] = useState(false);

  const listRef = useRef(null);
  const fileInputRef = useRef(null);
  const atBottom = useRef(true);
  const sendingLock = useRef(false);

  const existing = chat.kind === "person" ? personChat(chat, chats) : null;
  const chatId = chat.chatId || existing?.chatId || null;

  const details = useGetCliqChatQuery(chatId, {
    skip: !connected || !chatId,
  });

  const history = useGetCliqMessagesQuery(
    { chatId, limit: 50 },
    {
      skip: !connected || !chatId || panel !== "messages",
      pollingInterval: panel === "messages" ? 4000 : 0,
    },
  );

  const threads = useGetCliqChatThreadsQuery(chatId, {
    skip: !connected || !chatId || panel !== "threads",
  });

  const filesQuery = useGetCliqChatFilesQuery(
    { chatId, limit: 50 },
    { skip: !connected || !chatId || panel !== "files" },
  );

  const [sendMessage, sendState] = useSendCliqMessageMutation();
  const [sendChannel, channelState] = useSendCliqChannelMessageMutation();
  const [sendPerson, personState] = useSendCliqPersonMessageMutation();

  const [uploadChatFile] = useUploadCliqChatFileMutation();
  const [uploadChannelFile] = useUploadCliqChannelFileMutation();
  const [uploadPersonFile] = useUploadCliqPersonFileMutation();

  const isSending =
    sendState.isLoading ||
    channelState.isLoading ||
    personState.isLoading ||
    uploading;

  const hasDestination =
    chat.kind === "person"
      ? Boolean(chat.email)
      : chat.kind === "channel"
        ? Boolean(chat.uniqueName || chatId)
        : Boolean(chatId);

  const canAttach = connected && hasDestination;

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
    if (atBottom.current && listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, confirmed, panel]);

  const handleSend = async () => {
    const text = draft.trim();
    if (!canSend || sendingLock.current) return;
    sendingLock.current = true;
    setSendError("");
    try {
      if (chat.kind === "person") {
        await sendPerson({ email: chat.email, chatId, text }).unwrap();
      } else if (chat.kind === "channel" && chat.uniqueName) {
        await sendChannel({
          channelUniqueName: chat.uniqueName,
          chatId,
          text,
        }).unwrap();
      } else {
        await sendMessage({ chatId, text }).unwrap();
      }
      setDraft("");
      atBottom.current = true;
      if (!chatId) {
        setConfirmed((previous) => [
          ...previous,
          {
            id: `sent-${Date.now()}-${previous.length}`,
            text,
            isOwn: true,
            createdAt: Date.now(),
          },
        ]);
      }
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

  const handlePickFile = () => {
    if (!canAttach || uploading) return;
    fileInputRef.current?.click();
  };

  const handleFileSelected = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !canAttach) return;

    setUploading(true);
    setSendError("");
    try {
      if (chat.kind === "person" && chat.email) {
        await uploadPersonFile({
          email: chat.email,
          file,
          comment: draft.trim() || undefined,
        }).unwrap();
      } else if (chat.kind === "channel" && chat.uniqueName) {
        await uploadChannelFile({
          channelUniqueName: chat.uniqueName,
          file,
          comment: draft.trim() || undefined,
        }).unwrap();
      } else if (chatId) {
        await uploadChatFile({
          chatId,
          file,
          comment: draft.trim() || undefined,
        }).unwrap();
      } else {
        throw new Error("No destination for this file.");
      }

      if (draft.trim()) setDraft("");
      atBottom.current = true;
      setPanel("messages");
    } catch (error) {
      const message = error?.data?.message || error?.error || error?.message;
      setSendError(
        typeof message === "string"
          ? message
          : "File wasn't uploaded. Please try again.",
      );
    } finally {
      setUploading(false);
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
            flexWrap: "wrap",
          }}
        >
          <button
            className="cliq-control"
            type="button"
            aria-pressed={panel === "messages"}
            onClick={() => setPanel("messages")}
          >
            Messages
          </button>
          <button
            className="cliq-control"
            type="button"
            aria-pressed={panel === "threads"}
            onClick={() => setPanel("threads")}
          >
            Threads
          </button>
          <button
            className="cliq-control"
            type="button"
            aria-pressed={panel === "files"}
            onClick={() => setPanel("files")}
          >
            Files
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
        {panel === "threads" ? (
          <>
            {threads.isFetching && !threads.currentData ? (
              <CenterState text="Loading threads…" fill />
            ) : threads.isError ? (
              <>
                <CenterState text="Couldn't load threads." fill />
                <button
                  className="cliq-control"
                  type="button"
                  onClick={threads.refetch}
                >
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
        ) : panel === "files" ? (
          <>
            {!chatId ? (
              <CenterState
                title="No linked chat yet"
                text="Files appear here after the conversation has a chat id."
                fill
              />
            ) : filesQuery.isFetching && !filesQuery.currentData ? (
              <CenterState text="Loading files…" fill />
            ) : filesQuery.isError ? (
              <>
                <CenterState text="Couldn't load files." fill />
                <button
                  className="cliq-control"
                  type="button"
                  onClick={filesQuery.refetch}
                >
                  Retry
                </button>
              </>
            ) : !(filesQuery.currentData || []).length ? (
              <CenterState text="No files in this conversation yet." fill />
            ) : (
              (filesQuery.currentData || []).map((fileItem) => (
                <FileRow key={fileItem.id} item={fileItem} />
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
                  ? "You can send a message or file here. History will appear when Cliq provides the linked conversation."
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
            <button
              className="cliq-control"
              type="button"
              onClick={history.refetch}
            >
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

      {panel !== "threads" && (
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

          <input
            ref={fileInputRef}
            type="file"
            style={{ display: "none" }}
            onChange={handleFileSelected}
          />

          <div style={{ display: "flex", alignItems: "flex-end", gap: 8 }}>
            <IconButton label="Attach file" onClick={handlePickFile}>
              <PaperclipIcon />
            </IconButton>

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
              placeholder={
                uploading ? "Uploading file…" : `Message ${chat.name}…`
              }
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

          {(history.isFetching || uploading) && (
            <div style={{ marginTop: 4, fontSize: 9.5, color: T.muted }}>
              {uploading ? "Uploading…" : "Syncing…"}
            </div>
          )}
        </div>
      )}
    </>
  );
}
