// /chats — team chat runs through the Zoho Cliq connector (floating chat panel).
// There is no native INOS chat backend yet, so this page explains that and opens the panel.
import React from "react";
import { useNavigate } from "react-router-dom";
import { MessageSquare, PlugZap, StickyNote, ListTodo } from "lucide-react";
import { Page, PageHeader, Card, Button, EmptyState, Pill } from "@/components/inos";
import { useCliqChat } from "@/components/cliq/context";

export default function ChatsPage() {
  const navigate = useNavigate();
  const { cliqConnected, openChat } = useCliqChat();
  return (
    <Page width="narrow">
      <PageHeader crumbs={[{ label: "Workspace" }, { label: "Chats" }]} title="Chats" subtitle="Team conversations happen in Zoho Cliq, right inside INOS." />
      <Card>
        <EmptyState
          icon={MessageSquare}
          title={cliqConnected ? "Your chats open in the side panel" : "Connect Zoho Cliq to chat"}
          text={
            cliqConnected
              ? "Channels, direct messages and file sharing stay available on every page from the chat icon in the header."
              : "A native INOS chat is coming soon. Until then, connect your Zoho Cliq account and chat from the header on any page."
          }
          action={
            <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
              {cliqConnected ? (
                <Button variant="primary" icon={MessageSquare} onClick={openChat} data-testid="open-chat">Open chat</Button>
              ) : (
                <Button variant="primary" icon={PlugZap} onClick={() => navigate("/settings/connectors")} data-testid="connect-cliq">Connect Zoho Cliq</Button>
              )}
            </div>
          }
        />
        <div style={{ display: "flex", justifyContent: "center", marginTop: 4 }}>
          <Pill tone={cliqConnected ? "ok" : "warn"}>{cliqConnected ? "Cliq connected" : "Cliq not connected"}</Pill>
        </div>
      </Card>
      <Card title="Meanwhile" subtitle="Keep decisions where the work is.">
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Button icon={StickyNote} onClick={() => navigate("/tasks/notes")}>Write a note</Button>
          <Button icon={ListTodo} onClick={() => navigate("/tasks/new")}>Assign a task</Button>
        </div>
      </Card>
    </Page>
  );
}
