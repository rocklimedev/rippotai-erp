import "@/components/business-proposal/proposal-template.css";
import { useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";
import ProposalDocument from "../../components/business-proposal/ProposalDocument";
import { DocumentPreview, pdfFileName } from "@/components/print-document";
import { downloadDeckPdf } from "@/components/business-proposal/proposal-deck/deckPdf";
import { useGetBusinessProposalQuery } from "@/api/documents/business-proposals.api";
import { Button, PageHeader } from "@/components/inos";
import { Download, Pencil } from "lucide-react";
import RecordContext from "@/components/record-context/RecordContext";
import VersionHistory from "@/components/record-context/VersionHistory";
import { useRecordInfo } from "@/components/record-context/useRecordInfo";
export default function BusinessProposalView() {
  const { id } = useParams();
  const recordInfo = useRecordInfo("business-proposal", id);
  const { currentData: record, isError, refetch } = useGetBusinessProposalQuery(id, { skip: !id });
  const error = isError ? "Could not load this business proposal." : "";
  const ref = useRef(null);
  const [downloading, setDownloading] = useState(false);
  if (!record) return <div className="p-6"><p>{error || "Loading proposal…"}</p>{isError && <button onClick={refetch}>Retry</button>}</div>;
  // MariaDB can hand the JSON snapshot back as a string.
  let snapshot = record.snapshot || {};
  if (typeof snapshot === "string") {
    try {
      snapshot = JSON.parse(snapshot);
    } catch {
      snapshot = {};
    }
  }
  async function download() {
    setDownloading(true);
    try {
      await downloadDeckPdf(
        ref.current,
        pdfFileName("Business-Proposal", record.title, 1),
        { title: record.title },
      );
    } catch {
      toast.error("Could not download PDF");
    } finally {
      setDownloading(false);
    }
  }
  return (
    <div className="bp-workspace p-6 space-y-5">
      <PageHeader
        crumbs={[{ label: "Business Proposal", to: "/crm/business-proposal/all" }, { label: record.title }]}
        title={record.title}
        info={recordInfo}
        actions={
          <>
            <Link className="inos-btn inos-btn--secondary" to={`/crm/business-proposal/${id}/workspace`}>
              <Pencil aria-hidden />
              <span>Edit in workspace</span>
            </Link>
            <Button variant="primary" icon={Download} loading={downloading} onClick={download}>
              Download PDF
            </Button>
          </>
        }
      />
      <RecordContext type="business-proposal" id={id} />
      <DocumentPreview>
        <ProposalDocument ref={ref} projectDetail={snapshot.proposal?.projectDetail} {...(snapshot.docs || {})} />
      </DocumentPreview>
      <VersionHistory type="business-proposal" id={id} />
    </div>
  );
}
