import { Link, useLocation } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import {
  DOCUMENT_SEQUENCE,
  currentSequenceDocument,
  documentDestination,
} from "@/config/documentSequence";

export default function DocumentSequenceNavigation({ children }) {
  const { pathname, search } = useLocation();
  const current = currentSequenceDocument(pathname, search);
  const next =
    current && DOCUMENT_SEQUENCE[DOCUMENT_SEQUENCE.indexOf(current) + 1];
  const params = new URLSearchParams(search);
  const projectId = params.get("projectId") || params.get("project_id");
  return (
    <>
      {children}
      {current && (
        <nav
          aria-label="Document sequence"
          className="print:hidden mt-5 flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-white p-4"
        >
          <span className="text-sm text-slate-600">
            {DOCUMENT_SEQUENCE.indexOf(current) + 1} /{" "}
            {DOCUMENT_SEQUENCE.length} · {current.name}
          </span>
          {next ? (
            <Link
              className="inline-flex items-center gap-2 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white"
              to={documentDestination(next, projectId, { create: true })}
            >
              Next Document: {next.name}
              <ArrowRight size={16} />
            </Link>
          ) : (
            <span className="text-sm text-slate-600">
              End of document sequence
            </span>
          )}
        </nav>
      )}
    </>
  );
}

export function DocumentReference() {
  const { pathname, search } = useLocation();
  const document = currentSequenceDocument(pathname, search);
  return (
    <section className="rounded-lg border bg-white p-6">
      <h1 className="text-xl font-semibold">
        {document?.name || "Document reference"}
      </h1>
      <p className="mt-2 text-sm text-slate-600">
        Reference only — this document's UI is being built.
      </p>
    </section>
  );
}
