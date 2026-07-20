import { useState } from "react";
import TopBar from "../../components/leads/TopBar";
import TabsBar from "../../components/leads/TabsBar";
import LeadActionModal from "../../components/leads/LeadActionModal";
import BoardView from "../../components/leads/BoardView";
import NewLeadView from "../../components/leads/NewLeadView";
import DetailView from "../../components/leads/DetailView";
import ContactsView from "../../components/leads/ContactsView";
import ReviewView from "../../components/leads/ReviewView";

export default function LeadsPage() {
  const [tab, setTab] = useState("board");
  const [selId, setSelId] = useState(null);
  const [modal, setModal] = useState(null); // { kind: 'remark' | 'proposed', lead }

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
          <BoardView
            onOpenLead={openLead}
            onEditLead={editLead}
            onRemark={(lead) => setModal({ kind: "remark", lead })}
            onProposed={(lead) => setModal({ kind: "proposed", lead })}
          />
        )}
        {tab === "new" && (
          <NewLeadView onCaptured={(lead) => setSelId(lead.id)} />
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
      <LeadActionModal modal={modal} onClose={() => setModal(null)} />
    </div>
  );
}
