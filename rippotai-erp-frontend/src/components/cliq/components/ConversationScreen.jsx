import { useEffect, useRef, useState } from "react";
import {
  useGetCliqChatQuery,
  useGetCliqMessagesQuery,
  useGetCliqChatThreadsQuery,
  useGetCliqChatFilesQuery,
  useGetCliqChannelMembersQuery,
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
  console.log("DEBUG currentCliqUserId:", currentCliqUserId);
  const [sendError, setSendError] = useState("");
  const [confirmed, setConfirmed] = useState([]);

  // "messages" | "threads" | "files" | "members"
  const [panel, setPanel] = useState("messages");

  const [uploading, setUploading] = useState(false);

  const listRef = useRef(null);
  const fileInputRef = useRef(null);
  const atBottom = useRef(true);
  const sendingLock = useRef(false);

  /*
   * --------------------------------------------------------------------------
   * CHAT DESTINATION
   * --------------------------------------------------------------------------
   */

  const existing = chat.kind === "person" ? personChat(chat, chats) : null;

  const chatId = chat.chatId || existing?.chatId || null;

  const channelId = chat.channelId || existing?.channelId || null;
  /*
   * --------------------------------------------------------------------------
   * CHAT DETAILS
   * --------------------------------------------------------------------------
   */

  const details = useGetCliqChatQuery(chatId, {
    skip: !connected || !chatId,
  });

  /*
   * --------------------------------------------------------------------------
   * MESSAGE HISTORY
   * --------------------------------------------------------------------------
   */

  const history = useGetCliqMessagesQuery(
    {
      chatId,
      limit: 50,
    },
    {
      skip: !connected || !chatId || panel !== "messages",

      pollingInterval: panel === "messages" ? 4000 : 0,
    },
  );

  /*
   * --------------------------------------------------------------------------
   * THREADS
   * --------------------------------------------------------------------------
   */

  const threads = useGetCliqChatThreadsQuery(chatId, {
    skip: !connected || !chatId || panel !== "threads",
  });

  /*
   * --------------------------------------------------------------------------
   * FILES
   * --------------------------------------------------------------------------
   */

  const filesQuery = useGetCliqChatFilesQuery(
    {
      chatId,
      limit: 50,
    },
    {
      skip: !connected || !chatId || panel !== "files",
    },
  );

  /*
   * --------------------------------------------------------------------------
   * CHANNEL MEMBERS
   *
   * This uses the actual Cliq channel membership endpoint.
   *
   * Important:
   * - This is NOT the organization /people directory.
   * - External users who are members of an external channel can appear here.
   * - An invited user who has not joined yet may not appear as an active member.
   * --------------------------------------------------------------------------
   */

  const membersQuery = useGetCliqChannelMembersQuery(channelId, {
    skip:
      !connected ||
      !channelId ||
      chat.kind !== "channel" ||
      panel !== "members",
  });
  /*
   * --------------------------------------------------------------------------
   * SEND MUTATIONS
   * --------------------------------------------------------------------------
   */

  const [sendMessage, sendState] = useSendCliqMessageMutation();

  const [sendChannel, channelState] = useSendCliqChannelMessageMutation();

  const [sendPerson, personState] = useSendCliqPersonMessageMutation();

  /*
   * --------------------------------------------------------------------------
   * FILE UPLOAD MUTATIONS
   * --------------------------------------------------------------------------
   */

  const [uploadChatFile] = useUploadCliqChatFileMutation();

  const [uploadChannelFile] = useUploadCliqChannelFileMutation();

  const [uploadPersonFile] = useUploadCliqPersonFileMutation();

  /*
   * --------------------------------------------------------------------------
   * UI STATE
   * --------------------------------------------------------------------------
   */

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

  /*
   * --------------------------------------------------------------------------
   * HEADER DATA
   * --------------------------------------------------------------------------
   */

  const titleChat = {
    ...chat,

    name:
      details.currentData?.name && details.currentData.name !== "Unknown"
        ? details.currentData.name
        : chat.name,
  };

  /*
   * --------------------------------------------------------------------------
   * AUTO SCROLL
   * --------------------------------------------------------------------------
   */

  useEffect(() => {
    if (atBottom.current && listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, confirmed, panel]);

  /*
   * --------------------------------------------------------------------------
   * SEND MESSAGE
   * --------------------------------------------------------------------------
   */

  const handleSend = async () => {
    const text = draft.trim();

    if (!canSend || sendingLock.current) {
      return;
    }

    sendingLock.current = true;
    setSendError("");

    try {
      /*
       * PERSON MESSAGE
       */
      if (chat.kind === "person") {
        await sendPerson({
          email: chat.email,
          chatId,
          text,
        }).unwrap();
      } else if (chat.kind === "channel" && chat.uniqueName) {
        /*
         * CHANNEL MESSAGE
         */
        await sendChannel({
          channelUniqueName: chat.uniqueName,
          chatId,
          text,
        }).unwrap();
      } else {
        /*
         * NORMAL CHAT MESSAGE
         */
        await sendMessage({
          chatId,
          text,
        }).unwrap();
      }

      setDraft("");
      atBottom.current = true;

      /*
       * Optimistic confirmation for destinations
       * that do not yet have a linked chat id.
       */
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
      const message = error?.data?.message || error?.error || error?.message;

      setSendError(
        typeof message === "string"
          ? message
          : "Message wasn't sent. Please try again.",
      );
    } finally {
      sendingLock.current = false;
    }
  };

  /*
   * --------------------------------------------------------------------------
   * PICK FILE
   * --------------------------------------------------------------------------
   */

  const handlePickFile = () => {
    if (!canAttach || uploading) {
      return;
    }

    fileInputRef.current?.click();
  };

  /*
   * --------------------------------------------------------------------------
   * FILE SELECTED
   * --------------------------------------------------------------------------
   */

  const handleFileSelected = async (event) => {
    const file = event.target.files?.[0];

    event.target.value = "";

    if (!file || !canAttach) {
      return;
    }

    setUploading(true);
    setSendError("");

    try {
      /*
       * PERSON FILE
       */
      if (chat.kind === "person" && chat.email) {
        await uploadPersonFile({
          email: chat.email,
          file,
          comment: draft.trim() || undefined,
        }).unwrap();
      } else if (chat.kind === "channel" && chat.uniqueName) {
        /*
         * CHANNEL FILE
         */
        await uploadChannelFile({
          channelUniqueName: chat.uniqueName,
          file,
          comment: draft.trim() || undefined,
        }).unwrap();
      } else if (chatId) {
        /*
         * CHAT FILE
         */
        await uploadChatFile({
          chatId,
          file,
          comment: draft.trim() || undefined,
        }).unwrap();
      } else {
        /*
         * NO DESTINATION
         */
        throw new Error("No destination for this file.");
      }

      if (draft.trim()) {
        setDraft("");
      }

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

  /*
   * --------------------------------------------------------------------------
   * RENDER
   * --------------------------------------------------------------------------
   */

  return (
    <>
      <ConversationHeader chat={titleChat} onBack={onBack} onClose={onClose} />

      {/*
       * ----------------------------------------------------------------------
       * CONVERSATION PANELS
       * ----------------------------------------------------------------------
       */}

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
          {/*
           * MESSAGES
           */}
          <button
            className="cliq-control"
            type="button"
            aria-pressed={panel === "messages"}
            onClick={() => setPanel("messages")}
          >
            Messages
          </button>

          {/*
           * THREADS
           */}
          <button
            className="cliq-control"
            type="button"
            aria-pressed={panel === "threads"}
            onClick={() => setPanel("threads")}
          >
            Threads
          </button>

          {/*
           * FILES
           */}
          <button
            className="cliq-control"
            type="button"
            aria-pressed={panel === "files"}
            onClick={() => setPanel("files")}
          >
            Files
          </button>

          {/*
           * MEMBERS
           *
           * Only channels have a member panel.
           */}
          {chat.kind === "channel" && (
            <button
              className="cliq-control"
              type="button"
              aria-pressed={panel === "members"}
              onClick={() => setPanel("members")}
            >
              Members
            </button>
          )}
        </div>
      )}

      {/*
       * ----------------------------------------------------------------------
       * CONNECTION WARNING
       * ----------------------------------------------------------------------
       */}

      {!connected && (
        <div className="cliq-notice" role="status">
          Cliq is disconnected. Reconnect before sending.
        </div>
      )}

      {/*
       * ----------------------------------------------------------------------
       * MAIN CONTENT
       * ----------------------------------------------------------------------
       */}

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
        {/*
         * ====================================================================
         * MEMBERS PANEL
         * ====================================================================
         */}

        {panel === "members" ? (
          <>
            {membersQuery.isFetching && !membersQuery.currentData ? (
              <CenterState text="Loading channel members…" fill />
            ) : membersQuery.isError ? (
              <>
                <CenterState
                  title="Couldn't load channel members"
                  text="Please try again."
                  fill
                />

                <button
                  className="cliq-control"
                  type="button"
                  onClick={membersQuery.refetch}
                >
                  Retry
                </button>
              </>
            ) : !(membersQuery.currentData || []).length ? (
              <CenterState text="No members found in this channel." fill />
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  width: "100%",
                }}
              >
                {(membersQuery.currentData || []).map((member, index) => {
                  const memberName =
                    member.name || member.email || "Unknown user";

                  const memberEmail = member.email || "";

                  const memberId =
                    member.id ||
                    member.userId ||
                    member.email ||
                    `member-${index}`;

                  return (
                    <div
                      key={memberId}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "10px 12px",
                        borderRadius: 10,
                        border: `1px solid ${T.border}`,
                        background: T.surface,
                      }}
                    >
                      {/*
                       * AVATAR
                       */}
                      <div
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: "50%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          background: T.surfaceAlt,
                          color: T.ink,
                          fontSize: 12,
                          fontWeight: 700,
                          flexShrink: 0,
                        }}
                      >
                        {memberName.charAt(0).toUpperCase()}
                      </div>

                      {/*
                       * USER INFORMATION
                       */}
                      <div
                        style={{
                          minWidth: 0,
                          flex: 1,
                        }}
                      >
                        <div
                          style={{
                            fontSize: 12,
                            fontWeight: 600,
                            color: T.ink,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {memberName}
                        </div>

                        {memberEmail && (
                          <div
                            style={{
                              fontSize: 10,
                              color: T.muted,
                              marginTop: 2,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {memberEmail}
                          </div>
                        )}
                      </div>

                      {/*
                       * ROLE / EXTERNAL STATUS
                       */}
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "flex-end",
                          gap: 3,
                          flexShrink: 0,
                        }}
                      >
                        {member.role && (
                          <span
                            style={{
                              fontSize: 9,
                              color: T.muted,
                              textTransform: "capitalize",
                            }}
                          >
                            {member.role}
                          </span>
                        )}

                        {member.isExternal && (
                          <span
                            style={{
                              fontSize: 9,
                              padding: "2px 6px",
                              borderRadius: 999,
                              border: `1px solid ${T.border}`,
                              color: T.accent,
                              background: T.surfaceAlt,
                            }}
                          >
                            External
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        ) : panel === "threads" ? (
          /*
           * ==================================================================
           * THREADS PANEL
           * ==================================================================
           */
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
          /*
           * ==================================================================
           * FILES PANEL
           * ==================================================================
           */
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
          /*
           * ==================================================================
           * NO CHAT ID
           * ==================================================================
           */
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
          /*
           * ==================================================================
           * LOADING MESSAGES
           * ==================================================================
           */
          <CenterState text="Loading messages…" fill />
        ) : history.isError ? (
          /*
           * ==================================================================
           * MESSAGE ERROR
           * ==================================================================
           */
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
          /*
           * ==================================================================
           * EMPTY MESSAGES
           * ==================================================================
           */
          <CenterState text="No messages yet. Say hello." fill />
        ) : (
          /*
           * ==================================================================
           * MESSAGE LIST
           * ==================================================================
           */
          messages.map((message, i) => (
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

      {/*
       * ----------------------------------------------------------------------
       * COMPOSER
       *
       * Do not display the composer in the Threads or Members panel.
       * ----------------------------------------------------------------------
       */}

      {panel !== "threads" && panel !== "members" && (
        <div
          style={{
            borderTop: `1px solid ${T.border}`,
            padding: "8px 10px",
          }}
        >
          {/*
           * SEND / UPLOAD ERROR
           */}
          {sendError && (
            <div
              role="alert"
              style={{
                color: T.danger,
                fontSize: 11,
                marginBottom: 6,
              }}
            >
              {sendError}
            </div>
          )}

          {/*
           * HIDDEN FILE INPUT
           */}
          <input
            ref={fileInputRef}
            type="file"
            style={{
              display: "none",
            }}
            onChange={handleFileSelected}
          />

          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              gap: 8,
            }}
          >
            {/*
             * ATTACH FILE
             */}
            <IconButton label="Attach file" onClick={handlePickFile}>
              <PaperclipIcon />
            </IconButton>

            {/*
             * MESSAGE INPUT
             */}
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

            {/*
             * SEND BUTTON
             */}
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

          {/*
           * SYNC / UPLOAD STATUS
           */}
          {(history.isFetching || uploading) && (
            <div
              style={{
                marginTop: 4,
                fontSize: 9.5,
                color: T.muted,
              }}
            >
              {uploading ? "Uploading…" : "Syncing…"}
            </div>
          )}
        </div>
      )}
    </>
  );
}
