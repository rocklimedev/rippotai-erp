import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import * as Popover from "@radix-ui/react-popover";
import { toast } from "sonner";
import { Plus, LayoutGrid, List, SlidersHorizontal, X, RefreshCw, Workflow, Eye, EyeOff } from "lucide-react";

import { Page, PageHeader, Button, Segmented, SearchInput, SelectInput, TextInput, Field, EmptyState, Card } from "@/components/inos";
import {
  useGetBoardQuery,
  useGetLeadsQuery,
  useGetLeadsMetaQuery,
  useMoveStageMutation,
  useSyncLeadsFromZohoMutation,
} from "@/api/connectors/leads.api";
import { STAGES, stageOf, formatINR } from "@/hooks/stages";

import KanbanBoard from "@/components/leads/pipeline/KanbanBoard";
import DealsList from "@/components/leads/pipeline/DealsList";
import DealDrawer from "@/components/leads/pipeline/DealDrawer";
import QuickCreateDeal from "@/components/leads/pipeline/QuickCreateDeal";
import LostReasonModal from "@/components/leads/pipeline/LostReasonModal";
import { errorText, parseRupees } from "@/components/leads/pipeline/utils";
import "@/components/leads/pipeline/pipeline.css";

const SORTS = [
  { value: "newest", label: "Newest first" },
  { value: "updated", label: "Recently updated" },
  { value: "value-desc", label: "Value: high to low" },
  { value: "value-asc", label: "Value: low to high" },
  { value: "close", label: "Closing soonest" },
  { value: "days", label: "Oldest in pipeline" },
  { value: "name-asc", label: "Name A–Z" },
];

const FILTER_KEYS = ["owner", "source", "stage", "minValue", "maxValue", "from", "to", "closeFrom", "closeTo"];

const FILTER_LABEL = {
  owner: "Owner",
  source: "Source",
  stage: "Stage",
  minValue: "Min",
  maxValue: "Max",
  from: "Created from",
  to: "Created to",
  closeFrom: "Closing from",
  closeTo: "Closing to",
};

// Values are typed in lakh / crore ("50 L") and stored in the URL as rupees.
const moneyChip = (v) => formatINR(Number(v));

function FiltersPopover({ values, onApply, meta }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(values);
  const set = (k, v) => setDraft((d) => ({ ...d, [k]: v }));
  const active = FILTER_KEYS.filter((k) => values[k]).length;

  return (
    <Popover.Root
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o)
          setDraft({
            ...values,
            minValue: values.minValue ? String(Number(values.minValue) / 1e5) + " L" : "",
            maxValue: values.maxValue ? String(Number(values.maxValue) / 1e5) + " L" : "",
          });
      }}
    >
      <Popover.Trigger asChild>
        <Button icon={SlidersHorizontal} data-testid="filters-btn">
          Filters {active > 0 && <span className="crm-filter-count">{active}</span>}
        </Button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content className="crm-popover" align="start" sideOffset={6} data-testid="filters-popover">
          <div className="crm-popover__grid">
            <Field label="Owner">
              <SelectInput value={draft.owner || ""} onChange={(e) => set("owner", e.target.value)} placeholder="Anyone" aria-label="Owner">
                {(meta?.owners || []).map((o) => (
                  <option key={o.id || o.name} value={o.name}>
                    {o.name}
                  </option>
                ))}
              </SelectInput>
            </Field>
            <Field label="Source">
              <SelectInput value={draft.source || ""} onChange={(e) => set("source", e.target.value)} placeholder="Any source" aria-label="Source">
                {(meta?.sources || []).map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </SelectInput>
            </Field>
            <Field label="Stage">
              <SelectInput value={draft.stage || ""} onChange={(e) => set("stage", e.target.value)} placeholder="All stages" aria-label="Stage">
                <option value="capture,qual,disc,prop,nego">All open stages</option>
                {STAGES.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </SelectInput>
            </Field>
            <div />
            <Field label="Value from">
              <TextInput value={draft.minValue || ""} onChange={(e) => set("minValue", e.target.value)} placeholder="e.g. 50 L" aria-label="Minimum value" />
            </Field>
            <Field label="Value to">
              <TextInput value={draft.maxValue || ""} onChange={(e) => set("maxValue", e.target.value)} placeholder="e.g. 2 Cr" aria-label="Maximum value" />
            </Field>
            <Field label="Created from">
              <TextInput type="date" value={draft.from || ""} onChange={(e) => set("from", e.target.value)} />
            </Field>
            <Field label="Created to">
              <TextInput type="date" value={draft.to || ""} onChange={(e) => set("to", e.target.value)} />
            </Field>
            <Field label="Closing from">
              <TextInput type="date" value={draft.closeFrom || ""} onChange={(e) => set("closeFrom", e.target.value)} />
            </Field>
            <Field label="Closing to">
              <TextInput type="date" value={draft.closeTo || ""} onChange={(e) => set("closeTo", e.target.value)} />
            </Field>
          </div>
          <div className="crm-popover__foot">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                onApply(Object.fromEntries(FILTER_KEYS.map((k) => [k, ""])));
                setOpen(false);
              }}
            >
              Clear all
            </Button>
            <Button
              variant="primary"
              size="sm"
              data-testid="filters-apply"
              onClick={() => {
                const min = parseRupees(draft.minValue);
                const max = parseRupees(draft.maxValue);
                if (Number.isNaN(min) || Number.isNaN(max)) {
                  toast.error("Values: use numbers like 50 L or 1.5 Cr.");
                  return;
                }
                onApply({ ...draft, minValue: min ?? "", maxValue: max ?? "" });
                setOpen(false);
              }}
            >
              Apply filters
            </Button>
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

export default function BoardView() {
  const [params, setParams] = useSearchParams();
  const view = params.get("view") === "list" ? "list" : "board";
  const q = params.get("q") || "";
  const sort = params.get("sort") || "newest";
  const showClosed = params.get("closed") !== "0";
  const openDealId = params.get("deal");

  const filters = useMemo(() => Object.fromEntries(FILTER_KEYS.map((k) => [k, params.get(k) || ""])), [params]);

  const update = (patch) => {
    const next = new URLSearchParams(params);
    Object.entries(patch).forEach(([k, v]) => (v === "" || v == null ? next.delete(k) : next.set(k, String(v))));
    setParams(next, { replace: true });
  };

  const query = { q, sort, ...filters };
  const { data: meta } = useGetLeadsMetaQuery();
  const board = useGetBoardQuery(query, { skip: view !== "board" });
  const list = useGetLeadsQuery(query, { skip: view !== "list" });
  const [moveStage] = useMoveStageMutation();
  const [syncZoho, { isLoading: syncing }] = useSyncLeadsFromZohoMutation();

  const [createOpen, setCreateOpen] = useState(false);
  const [createStage, setCreateStage] = useState("capture");
  const [lostDeal, setLostDeal] = useState(null);
  const [lostBusy, setLostBusy] = useState(false);

  // Board: when a stage filter is set, only show those columns
  const stageFilter = filters.stage ? filters.stage.split(",") : null;
  const columns = (board.data?.columns || []).filter((c) => !stageFilter || stageFilter.includes(c.id));
  const allDeals = view === "board" ? columns.flatMap((c) => c.leads) : list.data || [];
  const openDeals = allDeals.filter((d) => ["capture", "qual", "disc", "prop", "nego"].includes(d.stage));
  const wonDeals = allDeals.filter((d) => ["contract", "handoff"].includes(d.stage));
  const sum = (xs) => xs.reduce((a, d) => a + (d.amount || 0), 0);

  const doMove = async (deal, stage, opts = {}) => {
    if (stage === "lost" && !opts.lostReason && opts.lostReason !== "") {
      setLostDeal(deal);
      return;
    }
    const from = deal.stage;
    try {
      await moveStage({ id: deal.id, stage, lostReason: opts.lostReason || undefined }).unwrap();
      if (!opts.silent) {
        const label = stage === "contract" && !["contract", "handoff"].includes(from) ? "Marked won" : `Moved to ${stageOf(stage).label}`;
        toast.success(`${label} — ${deal.title}`, {
          action: { label: "Undo", onClick: () => moveStage({ id: deal.id, stage: from }) },
        });
      }
    } catch (err) {
      toast.error(errorText(err, "Couldn't move the deal."));
    }
  };

  const confirmLost = async (reason) => {
    setLostBusy(true);
    await doMove(lostDeal, "lost", { lostReason: reason || "" });
    setLostBusy(false);
    setLostDeal(null);
  };

  const openDeal = (deal) => update({ deal: deal.id });
  const quickAdd = (stage) => {
    setCreateStage(stage || "capture");
    setCreateOpen(true);
  };

  const chips = FILTER_KEYS.filter((k) => filters[k]).map((k) => {
    let v = filters[k];
    if (k === "minValue" || k === "maxValue") v = moneyChip(v);
    if (k === "stage") v = v.includes(",") ? "Open stages" : stageOf(v).label;
    return { k, text: `${FILTER_LABEL[k]}: ${v}` };
  });

  const loading = view === "board" ? board.isLoading : list.isLoading;
  const error = view === "board" ? board.isError : list.isError;
  const zohoConnected = meta?.zohoConnected || board.data?.zohoConnected;

  return (
    <Page className="crm-page">
      <PageHeader
        crumbs={[{ label: "CRM", to: "/crm" }, { label: "Pipeline" }]}
        title="Deals pipeline"
        subtitle="Every enquiry from first call to handoff — drag deals between stages, open one to add notes, tasks and documents."
        actions={
          <>
            {zohoConnected && (
              <Button
                icon={RefreshCw}
                loading={syncing}
                onClick={() =>
                  syncZoho()
                    .unwrap()
                    .then((r) => toast.success(`Bigin sync: ${r.created} new, ${r.updated} updated`))
                    .catch((e) => toast.error(errorText(e, "Bigin sync failed.")))
                }
              >
                Sync Bigin
              </Button>
            )}
            <Button variant="primary" icon={Plus} onClick={() => quickAdd("capture")} data-testid="new-deal-btn">
              Deal
            </Button>
          </>
        }
      />

      <div className="crm-toolbar">
        <span className="crm-pipeline-picker" title="Pipeline">
          <Workflow size={16} aria-hidden /> Design &amp; Build
        </span>
        <Segmented
          value={view}
          onChange={(v) => update({ view: v === "board" ? "" : v })}
          options={[
            { value: "board", label: "Kanban", icon: LayoutGrid },
            { value: "list", label: "List", icon: List },
          ]}
        />
        <SearchInput value={q} onChange={(v) => update({ q: v })} placeholder="Search deals, clients, phone…" />
        <FiltersPopover values={filters} onApply={(f) => update(f)} meta={meta} />
        <SelectInput className="crm-select-sm" value={sort} onChange={(e) => update({ sort: e.target.value === "newest" ? "" : e.target.value })} aria-label="Sort">
          {SORTS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </SelectInput>
        {view === "board" && (
          <Button variant="ghost" icon={showClosed ? EyeOff : Eye} onClick={() => update({ closed: showClosed ? "0" : "" })}>
            {showClosed ? "Hide nurture & lost" : "Show nurture & lost"}
          </Button>
        )}
        <div className="crm-toolbar__spacer" />
        <div className="crm-summary" data-testid="pipeline-summary">
          <span>
            <b>{openDeals.length}</b> open · <b>{formatINR(sum(openDeals))}</b>
          </span>
          <span className="sep" />
          <span>
            Won <b>{formatINR(sum(wonDeals))}</b>
          </span>
        </div>
      </div>

      {chips.length > 0 && (
        <div className="crm-chips">
          {chips.map((c) => (
            <span className="crm-chip" key={c.k}>
              {c.text}
              <button type="button" aria-label={`Remove ${c.text}`} onClick={() => update({ [c.k]: "" })}>
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}

      {loading ? (
        <p className="inos-hint">Loading pipeline…</p>
      ) : error ? (
        <Card>
          <EmptyState title="Couldn't load the pipeline" text="Check your connection and try again." action={<Button onClick={() => (view === "board" ? board.refetch() : list.refetch())}>Retry</Button>} />
        </Card>
      ) : view === "board" ? (
        allDeals.length === 0 && !q && !chips.length ? (
          <Card>
            <EmptyState title="No deals yet" text="Add your first enquiry — it lands in Lead Capture." action={<Button variant="primary" icon={Plus} onClick={() => quickAdd("capture")}>New deal</Button>} />
          </Card>
        ) : (
          <KanbanBoard columns={columns} showClosed={showClosed || !!stageFilter} onMove={doMove} onOpen={openDeal} onQuickAdd={quickAdd} />
        )
      ) : (
        <DealsList deals={list.data || []} meta={meta} onOpen={openDeal} onMove={doMove} onCreate={() => quickAdd("capture")} />
      )}

      <QuickCreateDeal open={createOpen} onOpenChange={setCreateOpen} defaultStage={createStage} meta={meta} onCreated={(d) => update({ deal: d.id })} />

      <DealDrawer
        dealId={openDealId}
        open={!!openDealId}
        onOpenChange={(o) => !o && update({ deal: "" })}
        meta={meta}
        onMove={doMove}
        onAskLost={(d) => setLostDeal(d)}
      />

      <LostReasonModal deal={lostDeal} open={!!lostDeal} onCancel={() => setLostDeal(null)} onConfirm={confirmLost} busy={lostBusy} />
    </Page>
  );
}
