import { useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";
import ProposalDocument from "../../components/business-proposal/ProposalDocument";
import {
  DocumentPreview,
  downloadDocumentPdf,
  pdfFileName,
} from "@/components/print-document";
import { useBusinessProposal } from "./useBusinessProposal";
export default function BusinessProposalView() {
  const { id } = useParams();
  const { record, error } = useBusinessProposal(id);
  const ref = useRef(null);
  const [downloading, setDownloading] = useState(false);
  if (!record) return <p className="p-6">{error || "Loading proposal…"}</p>;
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
    <div className="p-6 space-y-5">
      <div className="flex justify-between items-center">
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
