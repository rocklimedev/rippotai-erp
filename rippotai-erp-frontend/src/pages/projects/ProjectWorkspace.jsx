// Project page: Overview (status + action required), Drawings, Documents.
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  CheckCircle2,
  Copy,
  ExternalLink,
  FileText,
  FolderOpen,
  LayoutDashboard,
  LayoutGrid,
  Pencil,
  RefreshCw,
  Share2,
} from 'lucide-react';
import { toast } from 'sonner';

import api from '@/lib/api';
import {
  Page,
  PageHeader,
  Card,
  Button,
  Tabs,
  Pill,
  StatusPill,
  EmptyState,
  Progress,
  Field,
  TextInput,
  ChoiceGroup,
} from '@/components/inos';
import {
  Skeleton,
  Modal,
  formatDate,
  normalizeCommandCenterPhases,
  commandCenterProgress,
} from '@/components/projects/_projects-ui';
import '@/components/projects/projects-ui.css';
import { useGetProjectPhasesQuery as useGetCommandCenterPhasesQuery } from '@/api/projects/command-center.api';
import { useGetProjectByIdQuery } from '../../api/projects/project.api';
import {
  useGetDocumentHubQuery,
  useGetProjectPendingWorkQuery,
} from '@/api/projects/document-hub.api';
import { PRE_DESIGN_SLOTS, PROJECT_DOCUMENTS } from '@/config/projectDocuments';
import ProjectDocumentsHub from '@/components/projects/ProjectDocumentsHub';
import ProjectDrawingsTab from '@/components/projects/ProjectDrawingsTab';
import { useAccess } from '@/hooks/use-permission';
import RecentActivity from '@/components/record-context/RecentActivity';
import { phaseLabel } from '@/components/record-context/codes';

const SHARE_PURPOSES = [
  { value: 'project_view', label: 'Project view' },
  { value: 'boq_approval', label: 'BOQ approval' },
  { value: 'handover_acceptance', label: 'Handover acceptance' },
];

const TABS = [
  { value: 'overview', label: 'Overview', icon: LayoutDashboard },
  { value: 'drawings', label: 'Drawings', icon: LayoutGrid },
  { value: 'documents', label: 'Documents', icon: FileText },
];

/* ============================================================
   OVERVIEW
============================================================ */

function StatusCard({ project, progress }) {
  const clientName = project.client?.name || project.client?.contact_person;
  const facts = [
    ['Status', <StatusPill key="s" status={project.status?.toLowerCase() || 'active'} size="sm" />],
    [
      'Stage',
      progress.current?.name ||
        (progress.total && progress.done === progress.total ? 'Complete' : 'Not started'),
    ],
    ['Client', clientName || '—'],
    ['Site', project.site_location || '—'],
    ...(project.google_maps_url
      ? [
          [
            'Google Maps',
            <a
              className="underline underline-offset-2"
              href={project.google_maps_url}
              target="_blank"
              rel="noopener noreferrer"
            >
              Open in Google Maps <ExternalLink size={13} className="inline" aria-hidden />
            </a>,
          ],
        ]
      : []),
    [
      'Completion',
      project.expected_completion_date ? formatDate(project.expected_completion_date) : '—',
    ],
  ];
  return (
    <Card
      title="Project status"
      actions={
        <span className="tabular" style={{ fontWeight: 700 }}>
          {progress.percent}%
        </span>
      }
    >
      <Progress value={progress.percent} />
      <dl
        className="pj-facts"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: 12,
          margin: '16px 0 0',
        }}
      >
        {facts.map(([k, v]) => (
          <div key={k}>
            <dt className="pj-muted" style={{ fontSize: 12 }}>
              {k}
            </dt>
            <dd style={{ margin: 0, fontWeight: 600, fontSize: 14 }}>{v}</dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}

function ActionRequired({ projectId }) {
  const nav = useNavigate();
  const { data: work = {} } = useGetProjectPendingWorkQuery(projectId);
  const { data: hub } = useGetDocumentHubQuery(projectId);

  const items = useMemo(() => {
    const out = [];
    (work.delayed || []).forEach((t) =>
      out.push({
        key: `d${t.id}`,
        tone: 'bad',
        tag: 'Overdue',
        title: t.title,
        sub: t.due_date ? `Due ${formatDate(t.due_date)}` : '',
        to: `/tasks/${t.id}`,
      }),
    );
    (work.blocked || []).forEach((t) =>
      out.push({
        key: `b${t.id}`,
        tone: 'bad',
        tag: 'Blocked',
        title: t.title,
        to: `/tasks/${t.id}`,
      }),
    );
    (work.awaiting_approval || []).forEach((a) => {
      const boq = String(a.title || '').startsWith('BOQ: ');
      out.push({
        key: `a${a.id}`,
        tone: 'warn',
        tag: 'Approval',
        title: a.title,
        to: boq ? `/ledger/boq/${a.id}` : `/projects/documents/${a.id}`,
      });
    });
    if (hub) {
      // Next documents of the flow this project does not have yet.
      const missing = PROJECT_DOCUMENTS.filter(
        (d) => d.kind !== 'register' && d.key !== 'quotation',
      ).filter((d) =>
        d.kind === 'stage' ? !PRE_DESIGN_SLOTS.every((s) => hub[s.key]?.count) : !hub[d.key]?.count,
      );
      missing.slice(0, 3).forEach((d) =>
        out.push({
          key: `m${d.key}`,
          tone: 'mute',
          tag: 'Pending',
          title: d.name,
          to:
            d.kind === 'stage'
              ? d.stagePath(projectId)
              : d.kind === 'form'
                ? d.createPath(projectId)
                : `${d.listPath}?projectId=${projectId}`,
        }),
      );
    }
    return out.slice(0, 10);
  }, [work, hub, projectId]);

  return (
    <Card
      flush
      title="Action required"
      actions={
        items.length ? (
          <Pill tone="warn" size="sm">
            {items.length}
          </Pill>
        ) : (
          <Pill tone="ok" size="sm">
            All clear
          </Pill>
        )
      }
    >
      {!items.length ? (
        <EmptyState icon={CheckCircle2} title="Nothing pending" />
      ) : (
        <div data-testid="action-required">
          {items.map((it) => (
            <button
              type="button"
              key={it.key}
              className="pj-action-row pj-list-item"
              onClick={() => nav(it.to)}
              style={{ width: '100%', textAlign: 'left' }}
            >
              <Pill tone={it.tone} size="sm">
                {it.tag}
              </Pill>
              <span className="pj-action-row__main">
                <span style={{ fontWeight: 600 }}>{it.title}</span>
                {it.sub && (
                  <span className="pj-muted" style={{ fontSize: 12 }}>
                    {' '}
                    · {it.sub}
                  </span>
                )}
              </span>
            </button>
          ))}
        </div>
      )}
    </Card>
  );
}

/* ============================================================
   SHARE WITH CLIENT
============================================================ */

const PURPOSE_LABEL = Object.fromEntries(SHARE_PURPOSES.map((p) => [p.value, p.label]));

/** Existing links for the project — copy again or revoke. */
function ClientLinksList({ projectId, refreshKey, onCopy }) {
  const [links, setLinks] = useState(null);
  const load = () =>
    api
      .get(`/v1/client-links`, { params: { project_id: projectId } })
      .then((r) => setLinks(Array.isArray(r.data) ? r.data : []))
      .catch(() => setLinks([]));
  useEffect(() => {
    if (projectId) load();
  }, [projectId, refreshKey]); // eslint-disable-line
  const revoke = async (id) => {
    try {
      await api.post(`/v1/client-links/${id}/revoke`);
      toast.success('Link revoked — it no longer opens');
      load();
    } catch {
      toast.error("Couldn't revoke the link");
    }
  };
  const active = (links || []).filter((l) => l.state === 'active');
  if (!active.length) return null;
  return (
    <Field label={`Active links (${active.length})`}>
      <div style={{ display: 'grid', gap: 8 }}>
        {active.slice(0, 5).map((l) => (
          <div
            key={l.id}
            className="inos-card inos-card--inset"
            style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 10 }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 13 }}>
                {PURPOSE_LABEL[l.purpose] || l.purpose}
              </div>
              <div className="pj-muted" style={{ fontSize: 12 }}>
                {l.client_name || l.client_email || 'Client'} · expires{' '}
                {new Date(l.expires_at).toLocaleDateString('en-IN', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })}
                {l.open_count ? ` · opened ${l.open_count}×` : ' · not opened yet'}
              </div>
            </div>
            {l.url && (
              <Button variant="ghost" size="sm" icon={Copy} onClick={() => onCopy(l.url)}>
                Copy
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={() => revoke(l.id)}>
              Revoke
            </Button>
          </div>
        ))}
      </div>
    </Field>
  );
}

function ShareClientModal({
  open,
  onClose,
  form,
  setForm,
  createdLink,
  onCreate,
  onCopy,
  onDone,
  projectId,
}) {
  const [creating, setCreating] = useState(false);
  const create = async () => {
    setCreating(true);
    try {
      await onCreate();
    } finally {
      setCreating(false);
    }
  };
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Share with client"
      description="Generate a controlled, read-only link for this project. Links expire after 30 days."
      width={520}
      footer={
        !createdLink ? (
          <>
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" icon={Share2} onClick={create} loading={creating}>
              Create link
            </Button>
          </>
        ) : (
          <>
            <Button variant="secondary" icon={Copy} onClick={() => onCopy(createdLink.url)}>
              Copy
            </Button>
            <a
              href={createdLink.url}
              target="_blank"
              rel="noreferrer"
              className="inos-btn inos-btn--secondary"
            >
              <ExternalLink aria-hidden />
              <span>Open</span>
            </a>
            <Button variant="primary" onClick={onDone}>
              Done
            </Button>
          </>
        )
      }
    >
      {!createdLink ? (
        <>
          <Field label="Purpose">
            <div className="pj-choices-2">
              <ChoiceGroup
                name="Purpose"
                value={form.purpose}
                onChange={(purpose) => setForm((current) => ({ ...current, purpose }))}
                options={SHARE_PURPOSES}
              />
            </div>
          </Field>
          <div className="inos-form-grid">
            <Field label="Client name">
              <TextInput
                value={form.client_name}
                onChange={(e) =>
                  setForm((current) => ({ ...current, client_name: e.target.value }))
                }
                placeholder="e.g. Sagar Mehta"
              />
            </Field>
            <Field label="Client email">
              <TextInput
                type="email"
                value={form.client_email}
                onChange={(e) =>
                  setForm((current) => ({ ...current, client_email: e.target.value }))
                }
                placeholder="name@company.com"
              />
            </Field>
          </div>
          <ClientLinksList projectId={projectId} refreshKey={open} onCopy={onCopy} />
          <Field label="The client can see">
            <div style={{ display: 'grid', gap: 10 }}>
              {[
                ['show_rates', 'Rates on the BOQ'],
                ['show_vendor_names', 'Vendor names'],
                ['show_ratings', 'Vendor ratings'],
              ].map(([key, label]) => (
                <label key={key} className="pj-check">
                  <input
                    type="checkbox"
                    checked={!!form[key]}
                    onChange={(e) =>
                      setForm((current) => ({ ...current, [key]: e.target.checked }))
                    }
                  />
                  {label}
                </label>
              ))}
            </div>
          </Field>
        </>
      ) : (
        <>
          <Pill tone="ok">Link generated</Pill>
          <div
            className="inos-card inos-card--inset"
            style={{ padding: 12, fontSize: 13, color: 'var(--text-2)', overflowWrap: 'anywhere' }}
          >
            {createdLink.url}
          </div>
        </>
      )}
    </Modal>
  );
}

/* ============================================================
   PAGE
============================================================ */

export default function ProjectWorkspace() {
  const { id } = useParams();
  const nav = useNavigate();
  const access = useAccess();
  const [params, setParams] = useSearchParams();
  const tab = TABS.some((t) => t.value === params.get('tab')) ? params.get('tab') : 'overview';
  const setTab = (value) => {
    const next = new URLSearchParams(params);
    if (value === 'overview') next.delete('tab');
    else next.set('tab', value);
    setParams(next, { replace: true });
  };

  const {
    data: projectData,
    isLoading,
    error,
    refetch: refetchProject,
  } = useGetProjectByIdQuery(id, { skip: !id });
  const { data: ccPhases } = useGetCommandCenterPhasesQuery(id, { skip: !id });

  const [shareModal, setShareModal] = useState(false);
  const [shareForm, setShareForm] = useState({
    purpose: 'project_view',
    client_email: '',
    client_name: '',
    show_rates: true,
    show_vendor_names: true,
    show_ratings: true,
  });
  const [createdLink, setCreatedLink] = useState(null);

  const openShare = () => {
    setShareForm((current) => ({
      ...current,
      client_email: current.client_email || projectData?.client?.email || '',
      client_name:
        current.client_name ||
        projectData?.client?.name ||
        projectData?.client?.contact_person ||
        '',
    }));
    setShareModal(true);
  };

  const progress = useMemo(() => {
    if (ccPhases?.phases?.length)
      return commandCenterProgress(ccPhases, normalizeCommandCenterPhases(ccPhases));
    return { percent: 0, total: 0, done: 0, current: null };
  }, [ccPhases]);

  const createLink = async () => {
    const payload = {
      project_id: id,
      purpose: shareForm.purpose,
      client_email: shareForm.client_email,
      client_name: shareForm.client_name,
      expires_days: 30,
      options: {
        show_rates: shareForm.show_rates,
        show_vendor_names: shareForm.show_vendor_names,
        show_ratings: shareForm.show_ratings,
      },
    };
    try {
      const { data } = await api.post('/v1/client-links', payload);
      setCreatedLink(data);
      toast.success('Client link created');
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Failed to create client link');
    }
  };

  const copyUrl = async (url) => {
    await navigator.clipboard.writeText(url);
    toast.success('Copied');
  };

  if (isLoading) {
    return (
      <Page className="pj-page">
        <PageHeader title="Project" />
        <Skeleton height={220} />
      </Page>
    );
  }

  if (error || !projectData) {
    return (
      <Page className="pj-page">
        <PageHeader title="Project unavailable" />
        <Card>
          <EmptyState
            icon={FolderOpen}
            title="This project could not be loaded"
            action={
              <div style={{ display: 'flex', gap: 8 }}>
                <Button variant="secondary" icon={RefreshCw} onClick={() => refetchProject()}>
                  Retry
                </Button>
                <Button variant="primary" onClick={() => nav('/projects')}>
                  All projects
                </Button>
              </div>
            }
          />
        </Card>
      </Page>
    );
  }

  const p = projectData;
  const members = Array.isArray(p.team_members) ? p.team_members : [];
  const lead =
    members.find((m) => /lead/i.test(m.role_label || '')) ||
    members.find((m) => m.is_primary) ||
    members[0];
  const stage = progress.current?.name || phaseLabel(p.current_phase);
  const infoLine = [stage, lead?.user?.name ? `Project lead: ${lead.user.name}` : null]
    .filter(Boolean)
    .join(' · ');

  return (
    <Page className="pj-page">
      <PageHeader
        title={p.name}
        info={infoLine}
        actions={
          <>
            {access.can('projects', 'update') && (
              <Button variant="secondary" icon={Pencil} onClick={() => nav(`/projects/${id}/edit`)}>
                Edit
              </Button>
            )}
            {access.can('client-portal', 'create') ? (
              <Button variant="secondary" icon={Share2} onClick={openShare}>
                Share with client
              </Button>
            ) : null}
          </>
        }
      />

      <Tabs value={tab} onChange={setTab} options={TABS} />

      {tab === 'overview' && (
        <div className="pj-two-col pj-two-col--even">
          <StatusCard project={p} progress={progress} />
          <ActionRequired projectId={id} />
        </div>
      )}
      {tab === 'overview' && <RecentActivity projectId={id} />}
      {tab === 'drawings' && <ProjectDrawingsTab projectId={id} />}
      {tab === 'documents' && <ProjectDocumentsHub project={p} />}

      <ShareClientModal
        open={shareModal}
        onClose={() => setShareModal(false)}
        form={shareForm}
        setForm={setShareForm}
        createdLink={createdLink}
        onCreate={createLink}
        onCopy={copyUrl}
        projectId={id}
        onDone={() => {
          setCreatedLink(null);
          setShareModal(false);
        }}
      />
    </Page>
  );
}
