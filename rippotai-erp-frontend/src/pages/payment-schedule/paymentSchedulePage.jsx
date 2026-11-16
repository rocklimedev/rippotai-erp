import { useRef, useState } from "react";
import { flushSync } from "react-dom";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import RecordContext from "@/components/record-context/RecordContext";
import VersionHistory from "@/components/record-context/VersionHistory";
import { useRecordInfo } from "@/components/record-context/useRecordInfo";
import { useParams, useNavigate } from "react-router-dom";
import { Edit3, Download, FileText } from "lucide-react";
import { Page, PageHeader, Button, EmptyState } from "@/components/inos";
import { DocumentPreview, usePdfDownload, pdfFileName } from "@/components/print-document";
import PaymentScheduleView from "../../components/payments/PaymentScheduleView";
import { useGetPaymentScheduleQuery } from "../../api/documents/payment-schedules.api";

// Payment schedule viewer: shows exactly what the client receives (A4 pages) and downloads it as a PDF.
function PaymentSchedulePage() {
  const { scheduleId } = useParams();
  const [activeTab, setActiveTab] = useState("preview");
  const recordInfo = useRecordInfo("payment-schedule", scheduleId);
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
        info={recordInfo}
        crumbs={crumbs}
        title={projectName}
        actions={
          <>
            <Button variant="secondary" icon={Edit3} onClick={() => nav(`/ledger/forms/payment-schedule/${scheduleId}/edit`)}>
              Edit
            </Button>
            <Button
              variant="primary"
              icon={Download}
              loading={downloading}
              onClick={() => {
                flushSync(() => setActiveTab("preview"));
                download(pdfFileName("Payment-Schedule", projectName, 1), { title: `Payment Schedule — ${projectName}`, label: "payment schedule" });
              }}
            >
              Download PDF
            </Button>
          </>
        }
      />
      <RecordContext type="payment-schedule" id={scheduleId} />
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList aria-label="Payment schedule views">
          <TabsTrigger value="preview">PREVIEW</TabsTrigger>
          <TabsTrigger value="history">VERSION HISTORY</TabsTrigger>
        </TabsList>
        <TabsContent value="preview" forceMount hidden={activeTab !== "preview"}>
          <DocumentPreview>
            <PaymentScheduleView ref={docRef} schedule={schedule} />
          </DocumentPreview>
        </TabsContent>
        <TabsContent value="history">
          <VersionHistory type="payment-schedule" id={scheduleId} />
        </TabsContent>
      </Tabs>
    </Page>
  );
}

export default PaymentSchedulePage;
