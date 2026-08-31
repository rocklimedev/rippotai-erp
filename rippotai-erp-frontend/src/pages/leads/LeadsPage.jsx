import { useState } from "react";

import TopBar from "../../components/leads/TopBar";
import TabsBar from "../../components/leads/TabsBar";
import BoardView from "./BoardView";
import NewLeadPage from "./NewLeadPage";
import DetailView from "../../components/leads/DetailView";
import ContactsView from "./ContactsView";
import ReviewView from "../../components/leads/ReviewView";

export default function LeadsPage() {
  const [tab, setTab] = useState("board");
  const [selId, setSelId] = useState(null);

  const openLead = (lead) => {
    setSelId(lead.id);
    setTab("detail");
  };

  const editLead = (lead) => {
    setSelId(lead.id);
    setTab("detail");
  };

  return (
    <div className="flex min-h-screen items-stretch bg-page">
      <div className="flex-1 min-w-0 flex flex-col">
        <TopBar onNewLead={() => setTab("new")} />

        <TabsBar tab={tab} onChange={setTab} />

        {tab === "board" && (
          <BoardView onOpenLead={openLead} onEditLead={editLead} />
        )}

        {tab === "new" && (
          <NewLeadPage onCaptured={(lead) => setSelId(lead.id)} />
        )}

        {tab === "detail" && (
          <DetailView
            leadId={selId}
            onBack={() => setTab("board")}
            onEditLead={editLead}
          />
        )}

        {tab === "contacts" && (
          <ContactsView onOpenLead={openLead} onEditLead={editLead} />
        )}

        {tab === "review" && <ReviewView onOpenLead={openLead} />}
      </div>
    </div>
  );
}
