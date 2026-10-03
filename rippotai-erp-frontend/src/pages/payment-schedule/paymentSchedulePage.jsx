import React, { useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Edit3, Download, FileText } from "lucide-react";
import { Page, PageHeader, Button, EmptyState, StatusPill } from "@/components/inos";
import { DocumentPreview, usePdfDownload, pdfFileName } from "@/components/print-document";
import PaymentScheduleView from "../../components/payments/PaymentScheduleView";
import { useGetPaymentScheduleQuery } from "../../api/documents/payment-schedules.api";

// Payment schedule viewer: shows exactly what the client receives (A4 pages) and downloads it as a PDF.
function PaymentSchedulePage() {
  const { scheduleId } = useParams();
  const nav = useNavigate();
  const docRef = useRef(null);
  const { download, downloading } = usePdfDownload(docRef);
  const { data: schedule, isLoading, isError } = useGetPaymentScheduleQuery(scheduleId, { skip: !scheduleId });

  const crumbs = [{ label: "Ledger", to: "/ledger" }, { label: "Payment schedules", to: "/ledger/payment-schedule/all" }, { label: "Schedule" }];

  if (isLoading)
    return (
      <Page>
        <PageHeader crumbs={crumbs} title="Payment schedule" subtitle="Loading…" />
      </Page>
    );
  if (!scheduleId || isError || !schedule)
    return (
      <Page>
        <PageHeader crumbs={crumbs} title="Payment schedule" />
        <div className="inos-card">
          <EmptyState icon={FileText} title="Payment schedule not found" text="It may have been deleted, or you don't have access to it." />
        </div>
      </Page>
    );

  const projectName = schedule.project?.name || "Project";
  return (
    <Page>
      <PageHeader
        crumbs={crumbs}
        title={projectName}
        subtitle={
          <span style={{ display: "inline-flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            Payment schedule
            {schedule.status && <StatusPill status={String(schedule.status).toLowerCase()} size="sm" />}
          </span>
        }
        actions={
          <>
            <Button variant="secondary" icon={Edit3} onClick={() => nav(`/ledger/forms/payment-schedule/${scheduleId}/edit`)}>
              Edit
            </Button>
            <Button
              variant="primary"
              icon={Download}
              loading={downloading}
              onClick={() => download(pdfFileName("Payment-Schedule", projectName, 1), { title: `Payment Schedule — ${projectName}`, label: "payment schedule" })}
            >
              Download PDF
            </Button>
          </>
        }
      />
      <DocumentPreview>
        <PaymentScheduleView ref={docRef} schedule={schedule} />
      </DocumentPreview>
    </Page>
  );
}

export default PaymentSchedulePage;
