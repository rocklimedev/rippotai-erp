import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { toast } from "sonner";
import { CheckCircle2, Circle, Package, Send, RefreshCw, ExternalLink, PackageOpen } from "lucide-react";

import { Page, PageHeader, Card, Button, Pill, Progress, EmptyState } from "@/components/inos";
import { Skeleton } from "@/components/projects/_projects-ui";
import { useGetProjectByIdQuery } from "../../api/projects/project.api";

export default function ProjectHandover() {
  const { id } = useParams();
  const nav = useNavigate();
  const [status, setStatus] = useState(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [pkgResult, setPkgResult] = useState(null);
  const [deliverResult, setDeliverResult] = useState(null);

  const { data: project } = useGetProjectByIdQuery(id, { skip: !id });

  useEffect(() => {
    load();
  }, [id]); // eslint-disable-line

  const load = async () => {
    setLoadFailed(false);
    try {
      const { data } = await api.get(`/v1/projects/${id}/handover-package-status`);
      setStatus(data);
    } catch {
      setLoadFailed(true);
    }
  };

  const prepare = async () => {
    setBusy(true);
    try {
      const { data } = await api.post(`/v1/projects/${id}/handover/prepare-package`);
      setPkgResult(data);
      toast.success(`Package generated (${(data.size / 1024).toFixed(1)} KB)`);
      load();
    } catch (e) {
      toast.error(e?.response?.data?.message || "Couldn't prepare the package");
    }
    setBusy(false);
  };

  const deliver = async () => {
    setBusy(true);
    try {
      const { data } = await api.post(`/v1/projects/${id}/handover/deliver`, {});
      setDeliverResult(data);
      toast.success("Delivery link created");
      load();
    } catch (e) {
      toast.error(e?.response?.data?.message || "Couldn't create the delivery link");
    }
    setBusy(false);
  };

  const crumbs = [
    { label: "Projects", to: "/projects" },
    { label: project?.name || "Project", to: `/projects/${id}` },
    { label: "Handover" },
  ];

  const header = (
    <PageHeader
      crumbs={crumbs}
      title="Handover package"
      subtitle="Compile the final drawings, approvals and certificates into one package for client delivery."
      actions={
        status && (
          <>
            <Button variant="secondary" icon={Package} onClick={prepare} disabled={busy || !status.ready} data-testid="btn-prepare-package">
              Prepare package
            </Button>
            <Button variant="primary" icon={Send} onClick={deliver} disabled={busy || !(pkgResult || status.package)} data-testid="btn-deliver-client">
              Deliver to client
            </Button>
          </>
        )
      }
    />
  );

  if (!status) {
    return (
      <Page width="narrow">
        {header}
        {loadFailed ? (
          <Card>
            <EmptyState
              icon={PackageOpen}
              title="Handover status isn't available"
              text="The handover checklist could not be loaded for this project. It may not be set up on this server yet."
              action={
                <div style={{ display: "flex", gap: 8 }}>
                  <Button variant="secondary" icon={RefreshCw} onClick={load}>
                    Retry
                  </Button>
                  <Button variant="primary" onClick={() => nav(`/projects/${id}`)}>
                    Back to project
                  </Button>
                </div>
              }
            />
          </Card>
        ) : (
          <Skeleton height={260} />
        )}
      </Page>
    );
  }

  const checklist = status.checklist || [];
  const pkg = pkgResult || status.package;
  const clientUrl = deliverResult?.url || status.package?.client_url;

  return (
    <Page width="narrow">
      {header}

      <Card
        title="Readiness"
        subtitle={`${status.available} of ${status.required} required items available`}
        actions={status.ready ? <Pill tone="ok">Ready to package</Pill> : <Pill tone="warn">{status.percent}% ready</Pill>}
      >
        <div style={{ display: "grid", gap: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ flex: 1 }}>
              <Progress value={status.percent} tone={status.ready ? "ok" : undefined} />
            </div>
            <span className="tabular" style={{ fontWeight: 700 }}>
              {status.percent}%
            </span>
          </div>
          <div style={{ display: "grid", gap: 10 }}>
            {checklist.map((c, i) => (
              <div key={i} data-testid={`checklist-${i}`} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14 }}>
                {c.done ? (
                  <CheckCircle2 size={18} style={{ color: "var(--ok-dot)" }} aria-label="Done" />
                ) : (
                  <Circle size={18} style={{ color: "var(--line-strong)" }} aria-label="Pending" />
                )}
                <span style={{ color: c.done ? "var(--text)" : "var(--text-3)", flex: 1 }}>
                  {c.name}
                  {c.required === false && <span className="pj-muted"> (optional)</span>}
                </span>
                {c.detail && <span className="pj-muted" style={{ fontSize: 13 }}>{c.detail}</span>}
              </div>
            ))}
          </div>
        </div>
      </Card>

      {pkg && (
        <Card inset>
          <span style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14 }}>
            <span className="inos-icon-tile inos-icon-tile--sm inos-icon-tile--ok">
              <Package aria-hidden />
            </span>
            Package <b>{pkg.filename}</b>
            <span className="pj-muted">({(pkg.size / 1024).toFixed(1)} KB)</span>
            {pkg.url && (
              <a href={pkg.url} className="inos-btn inos-btn--ghost inos-btn--sm" style={{ marginLeft: "auto" }}>
                Download
              </a>
            )}
          </span>
        </Card>
      )}

      {status.accepted && (
        <Card inset>
          <span style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14 }}>
            <CheckCircle2 size={18} style={{ color: "var(--ok-dot)" }} aria-hidden />
            Accepted by <b>{status.accepted.signatory_name}</b>
          </span>
        </Card>
      )}

      {clientUrl && (
        <Card title="Client link" subtitle="Share this link with the client to accept the handover.">
          <div style={{ display: "grid", gap: 12 }}>
            <div className="pj-muted" style={{ fontSize: 13, overflowWrap: "anywhere" }}>
              {clientUrl}
            </div>
            <div>
              <a href={clientUrl} target="_blank" rel="noreferrer" className="inos-btn inos-btn--soft inos-btn--sm">
                <ExternalLink aria-hidden />
                <span>Open as client</span>
              </a>
            </div>
          </div>
        </Card>
      )}
    </Page>
  );
}
