import { useState } from "react";
import Sidebar from "./components/Sidebar";
import TopBar from "./components/TopBar";
import TabsBar from "./components/TabsBar";
import LeadActionModal from "./components/LeadActionModal";
import BoardView from "./views/BoardView";
import NewLeadView from "./views/NewLeadView";
import DetailView from "./views/DetailView";
import ContactsView from "./views/ContactsView";
import ReviewView from "./views/ReviewView";

export default function App() {
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
    <div style={{ display: "flex", minHeight: "100vh", alignItems: "stretch" }}>
      <Sidebar />
      <div
        style={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
        }}
      >
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
        {tab === "detail" && <DetailView leadId={selId} />}
        {tab === "contacts" && (
          <ContactsView onOpenLead={openLead} onEditLead={editLead} />
        )}
        {tab === "review" && <ReviewView onOpenLead={openLead} />}
      </div>
      <LeadActionModal modal={modal} onClose={() => setModal(null)} />
    </div>
  );
}
