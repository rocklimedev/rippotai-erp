import { useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";
import ProposalDocument from "../../components/business-proposal/ProposalDocument";
import {
  DocumentPreview,
  downloadDocumentPdf,
  pdfFileName,
} from "@/components/print-document";
import { useGetBusinessProposalQuery } from "@/api/documents/business-proposals.api";
export default function BusinessProposalView() {
  const { id } = useParams();
  const { currentData: record, isError, refetch } = useGetBusinessProposalQuery(id, { skip: !id });
  const error = isError ? "Could not load this business proposal." : "";
  const ref = useRef(null);
  const [downloading, setDownloading] = useState(false);
  if (!record) return <div className="p-6"><p>{error || "Loading proposal…"}</p>{isError && <button onClick={refetch}>Retry</button>}</div>;
  async function download() {
    setDownloading(true);
    try {
      await downloadDocumentPdf(
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
      <div className="flex flex-wrap gap-4 justify-between items-center">
        <Link to="/crm/business-proposal/all">← Business proposals</Link>
        <div className="flex gap-3">
          <Link
            className="bc-btn-secondary"
            to={`/crm/business-proposal/${id}/workspace`}
          >
            Edit in workspace
          </Link>
          <button
            className="bc-btn-primary"
            disabled={downloading}
            onClick={download}
          >
            {downloading ? "Preparing PDF…" : "Download PDF"}
          </button>
        </div>
      </div>
      <h1 className="text-2xl font-semibold">{record.title}</h1>
      <DocumentPreview>
        <ProposalDocument ref={ref} {...record.snapshot.docs} />
      </DocumentPreview>
    </div>
  );
}
