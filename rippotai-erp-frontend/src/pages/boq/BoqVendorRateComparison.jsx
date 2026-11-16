import { Fragment, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import {
  Page,
  PageHeader,
  Card,
  Button,
  Tabs,
  Field,
  TextInput,
  SelectInput,
  TextArea,
  Pill,
} from "@/components/inos";
import vendorComparisonTemplate from "@/assets/xlsx-templates/vendor-comparison-v2.xlsx?url";
import { useGetProjectsQuery } from "../../api/projects/project.api";
import { useGetVendorsQuery } from "../../api/vendors/vendor.api";
import {
  useGetRateComparisonQuery,
  useCreateRateComparisonMutation,
  useUpdateRateComparisonMutation,
  useGetVendorTradesQuery,
  useCreateVendorTradeMutation,
  useLazyGetRateComparisonsQuery,
} from "../../api/procuerment/vendor-rate-comparison.api";
import RecordContext from "@/components/record-context/RecordContext";
import VersionHistory from "@/components/record-context/VersionHistory";
import DeleteRateComparison from "@/components/materials/DeleteRateComparison";
import { usePermission } from "@/hooks/use-permission";
import { useCreateQuotationFromComparisonMutation } from "@/api/procuerment/procurement-quotation.api";
import { appConfirm, appPrompt } from "@/lib/app-dialog";
import { downloadXlsx } from "@/lib/xlsxTemplate";
import { buildVendorComparisonWorkbook } from "./vendorComparisonExcel";
import {
  comparisonTrades,
  withComparisonItems,
  createDefaultTrades,
  tradeNameKey,
  completeQuote,
  quoteAmount,
  quoteTotal,
} from "./vendorComparisonData";

const basePath = "/procurement/vendors/rate-comparison";
const uid = () => crypto.randomUUID();
const money = (n) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(n);
const list = (response) => {
  const data = response?.data?.data ?? response?.data ?? response;
  return Array.isArray(data)
    ? data
    : data?.items || data?.projects || data?.vendors || [];
};

export default function VendorRateComparison() {
  const { id } = useParams();
  const catalogueQuery = useGetVendorTradesQuery();
  const query = useGetRateComparisonQuery(id, {
    skip: !id,
    refetchOnMountOrArgChange: true,
  });
  if (id && query.isError)
    return (
      <Page>
        <PageHeader title="Vendor Comparison" />
        <p role="alert">
          Could not load comparison.{" "}
          <button onClick={query.refetch}>Retry</button>
        </p>
      </Page>
    );
  if (id && !query.currentData)
    return (
      <Page>
        <PageHeader title="Vendor Comparison" />
        Loading comparison…
      </Page>
    );
  if (!id && !catalogueQuery.data)
    return (
      <Page>
        <PageHeader title="Vendor Comparison" />
        {catalogueQuery.isError ? (
          <p role="alert">
            Could not load vendor trades.{" "}
            <Button variant="secondary" onClick={catalogueQuery.refetch}>
              Retry
            </Button>
          </p>
        ) : (
          "Loading vendor trades…"
        )}
      </Page>
    );
  return (
    <Workspace
      key={id || "new"}
      initialSheet={id ? query.currentData : null}
      catalogue={list(catalogueQuery.data)}
      catalogueError={catalogueQuery.isError}
      retryCatalogue={catalogueQuery.refetch}
    />
  );
}

function Workspace({
  initialSheet,
  catalogue,
  catalogueError,
  retryCatalogue,
}) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [title, setTitle] = useState(initialSheet?.title || "");
  const [projectId, setProjectId] = useState(initialSheet?.project_id || "");
  const [checkedProjectId, setCheckedProjectId] = useState(
    initialSheet?.project_id || "",
  );
  const [projectLookupError, setProjectLookupError] = useState("");
  const [checkingProject, setCheckingProject] = useState(false);
  const projectLookupSequence = useRef(0);
  useEffect(() => () => { projectLookupSequence.current += 1; }, []);
  const [fetchProjectComparisons] = useLazyGetRateComparisonsQuery();
  const selectProject = async (nextId) => {
    const sequence = ++projectLookupSequence.current;
    setProjectId(nextId);
    setCheckedProjectId("");
    setProjectLookupError("");
    setCheckingProject(Boolean(nextId));
    if (!nextId) return;
    try {
      const comparisons = list(
        await fetchProjectComparisons(nextId, false).unwrap(),
      );
      if (sequence !== projectLookupSequence.current) return;
      if (comparisons.length) {
        navigate(`${basePath}/${comparisons[0].id}/edit`, { replace: true });
        return;
      }
      setCheckedProjectId(nextId);
    } catch {
      if (sequence === projectLookupSequence.current)
        setProjectLookupError(
          "Could not check this project for an existing vendor comparison.",
        );
    } finally {
      if (sequence === projectLookupSequence.current) setCheckingProject(false);
    }
  };
  const [notes, setNotes] = useState(initialSheet?.notes || "");
  const [trades, setTrades] = useState(() =>
    initialSheet
      ? comparisonTrades(initialSheet.snapshot)
      : createDefaultTrades(catalogue),
  );
  const [activeId, setActiveId] = useState(() =>
    trades.some((t) => t.id === searchParams.get("trade"))
      ? searchParams.get("trade")
      : trades[0]?.id || '',
  );
  const [workspaceTab, setWorkspaceTab] = useState(() =>
    searchParams.get('tab') === 'history' ? 'history' : trades.some((t) => t.id === searchParams.get('trade')) ? 'comparison' : 'overview');
  const openTrade = (id) => { setActiveId(id); setWorkspaceTab('comparison'); };
  const [revision, setRevision] = useState(initialSheet?.revision || 1);
  const [saved, setSaved] = useState(() =>
    JSON.stringify({ title, projectId, notes, trades }),
  );
  const [exporting, setExporting] = useState(false);
  const projects = useGetProjectsQuery();
  const vendors = useGetVendorsQuery({ status: "ACTIVE" });
  const [create, creating] = useCreateRateComparisonMutation();
  const [update, updating] = useUpdateRateComparisonMutation();
  const saving = creating.isLoading || updating.isLoading;
  const canCreateQuotation = usePermission("procurement-quotations", "create");
  const canCreateTrade = usePermission("vendor-rate-comparisons", "create");
  const [createTrade, creatingTrade] = useCreateVendorTradeMutation();
  const [createQuotation, quotationStatus] =
    useCreateQuotationFromComparisonMutation();
  const state = JSON.stringify({ title, projectId, notes, trades });
  const dirty = state !== saved;
  useEffect(() => {
    const warn = (event) => {
      if (dirty) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  const active = trades.find((trade) => trade.id === activeId);
  const editTrade = (id, patch) =>
    setTrades((old) =>
      old.map((trade) => (trade.id === id ? { ...trade, ...patch } : trade)),
    );
  const editVendor = (id, patch) =>
    editTrade(active.id, {
      vendors: active.vendors.map((v) =>
        v.id === id ? { ...v, ...patch } : v,
      ),
    });
  const editSharedItem = (id, patch) =>
    editTrade(
      active.id,
      withComparisonItems(
        active,
        active.items.map((item) =>
          item.id === id ? { ...item, ...patch } : item,
        ),
      ),
    );
  const addSharedItem = () => {
    const item = { id: uid(), description: "", quantity: null };
    editTrade(active.id, withComparisonItems(active, [...active.items, item]));
  };
  const removeSharedItem = (id) =>
    editTrade(
      active.id,
      withComparisonItems(
        active,
        active.items.filter((item) => item.id !== id),
      ),
    );
  const editRate = (vendor, id, rate) =>
    editVendor(vendor.id, {
      items: vendor.items.map((item) =>
        item.id === id ? { ...item, rate } : item,
      ),
    });
  const addVendor = (value, slot) => {
    const source = list(vendors.data).find((v) => String(v.id) === value);
    const id = source ? String(source.id) : uid();
    if (active.vendors.some((v) => v.id === id)) return;
    editTrade(active.id, {
      vendors: [
        ...active.vendors,
        {
          id,
          custom: !source,
          slot: slot ?? active.vendors.length,
          name:
            source?.name ||
            source?.company_name ||
            source?.business_name ||
            "New vendor",
          items: active.items.map((item) => ({ ...item, rate: null })),
        },
      ],
    });
  };
  const validate = () => {
    if (
      !initialSheet &&
      (!projectId || checkedProjectId !== projectId || checkingProject)
    )
      return "Select a project and wait for its existing comparison check.";
    if (!title.trim() || !projectId)
      return "Enter a sheet name and select a project.";
    if (!trades.length || trades.some((t) => !t.name.trim()))
      return "Enter a name for every trade.";
    for (const trade of trades) {
      if (
        trade.items.some(
          (item) =>
            !item.description.trim() ||
            (item.quantity !== null &&
              (!Number.isFinite(item.quantity) || item.quantity < 0)),
        )
      )
        return "Check shared item descriptions and quantities.";
      for (const vendor of trade.vendors) {
        if (!vendor.name.trim()) return "Enter a name for every vendor.";
        if (
          vendor.items.some(
            (i) =>
              !i.description.trim() ||
              (i.quantity !== null &&
                (!Number.isFinite(i.quantity) || i.quantity < 0)) ||
              (i.rate !== null && !Number.isFinite(i.rate)),
          )
        )
          return "Check quote descriptions, quantities and rates.";
      }
      if (
        trade.finalised_vendor_id &&
        !completeQuote(
          trade.vendors.find((v) => v.id === trade.finalised_vendor_id),
        )
      )
        return "Complete the selected vendor quote before finalising.";
    }
    return null;
  };
  const save = async () => {
    const error = validate();
    if (error) return toast.error(error);
    const body = {
      title: title.trim(),
      project_id: projectId,
      notes,
      snapshot: { schema_version: 2, trades },
    };
    try {
      const result = await (
        initialSheet
          ? update({ id: initialSheet.id, revision, ...body })
          : create(body)
      ).unwrap();
      setRevision(result.revision);
      setSaved(state);
      toast.success("Vendor comparison saved");
      if (!initialSheet)
        navigate(`${basePath}/${result.id}/edit`, { replace: true });
      return result;
    } catch (error) {
      if (
        !initialSheet &&
        error?.status === 409 &&
        error?.data?.comparison_id
      ) {
        toast.info(
          "This project already has a vendor comparison. Opening its saved data.",
        );
        navigate(`${basePath}/${error.data.comparison_id}/edit`, {
          replace: true,
        });
        return;
      }
      toast.error(
        [error?.data?.message || "Could not save comparison"].flat().join(". "),
      );
    }
  };
  const makeQuotation = async (vendorId) => {
    const sheet = dirty || !initialSheet ? await save() : initialSheet;
    if (!sheet) return;
    try {
      const quotation = await createQuotation({
        comparison_id: sheet.id,
        vendor_id: vendorId,
      }).unwrap();
      navigate(`/procurement/quotations/${quotation.id}`);
    } catch (error) {
      toast.error(error?.data?.message || "Could not create quotation");
    }
  };
  const exportExcel = async () => {
    const error = validate();
    if (error) return toast.error(error);
    setExporting(true);
    try {
      const project =
        list(projects.data).find((p) => p.id === projectId) ||
        initialSheet?.project;
      downloadXlsx(
        await buildVendorComparisonWorkbook(vendorComparisonTemplate, {
          title,
          projectName: project?.name,
          notes,
          trades,
        }),
        `${title.replace(/[^a-z0-9_-]/gi, "_")}.xlsx`,
      );
    } catch {
      toast.error("Could not export comparison");
    } finally {
      setExporting(false);
    }
  };
  const total = trades.reduce(
    (sum, t) =>
      sum +
      quoteTotal(
        t.vendors.find((v) => v.id === t.finalised_vendor_id) || { items: [] },
      ),
    0,
  );
  const completeTotals =
    active?.vendors.filter(completeQuote).map(quoteTotal) || [];
  const lowest = completeTotals.length ? Math.min(...completeTotals) : null;
  const vendorColumnCount = Math.min(
    4,
    Math.max(
      active?.vendor_column_count ?? 3,
      ...(active?.vendors || []).map((v, index) => (v.slot ?? index) + 1),
    ),
  );
  const resizeVendorColumns = async (count) => {
    const removed = active.vendors.filter(
      (v, index) => (v.slot ?? index) >= count,
    );
    if (
      removed.length &&
      !(await appConfirm("Remove the extra vendor columns and their quotes?"))
    )
      return;
    editTrade(active.id, {
      vendor_column_count: count,
      vendors: active.vendors.filter((v) => !removed.includes(v)),
      finalised_vendor_id: removed.some(
        (v) => v.id === active.finalised_vendor_id,
      )
        ? ""
        : active.finalised_vendor_id,
    });
  };
  const overview = workspaceTab === "overview";
  const comparison = workspaceTab === 'comparison';
  const directory = list(vendors.data);
  const availableTrades = catalogue.filter(
    (record) =>
      !trades.some((t) => tradeNameKey(t.name) === tradeNameKey(record.name)),
  );
  const addTrade = (id) => {
    const record = availableTrades.find((t) => t.id === id);
    if (!record) return;
    const trade = {
      id: record.id,
      name: record.name,
      items: [],
      vendors: [],
      finalised_vendor_id: "",
    };
    setTrades([...trades, trade]);
    openTrade(trade.id);
  };
  const createNewTrade = async () => {
    const name = await appPrompt(
      "New vendor trade name. This will be added to the shared catalogue and this comparison sheet.",
    );
    if (name === null || name === false || !String(name).trim()) return;
    try {
      const record = await createTrade({ name: String(name).trim() }).unwrap();
      setTrades((current) => [
        ...current,
        {
          id: record.id,
          name: record.name,
          items: [],
          vendors: [],
          finalised_vendor_id: "",
        },
      ]);
      openTrade(record.id);
      toast.success("Vendor trade created and added to this sheet");
    } catch (error) {
      toast.error(
        [error?.data?.message || "Could not create trade"].flat().join(". "),
      );
    }
  };
  const selectVendor = (current, value, slot) => {
    const source = directory.find((v) => String(v.id) === value);
    if (
      !source ||
      active.vendors.some(
        (v) => v.id === String(source.id) && v.id !== current?.id,
      )
    )
      return;
    const next = {
      slot,
      id: String(source.id),
      name: source.name || source.company_name || source.business_name,
      notes: current?.notes || "",
      items:
        current?.items || active.items.map((item) => ({ ...item, rate: null })),
    };
    editTrade(active.id, {
      vendors: current
        ? active.vendors.map((v) => (v.id === current.id ? next : v))
        : [...active.vendors, next],
      finalised_vendor_id:
        current?.id === active.finalised_vendor_id
          ? ""
          : active.finalised_vendor_id,
    });
  };
  const removeTrade = async (trade) => {
    if (!await appConfirm(`Remove ${trade.name} and its quotes from this sheet? The shared trade catalogue will remain unchanged.`)) return;
    setTrades((current) => current.filter((t) => t.id !== trade.id));
    if (activeId === trade.id) setActiveId(trades.find((t) => t.id !== trade.id)?.id || '');
  };
  const tradeActions = (<>
        {availableTrades.length > 0 && (
          <SelectInput
            aria-label="Add existing trade"
            value=""
            onChange={(e) => addTrade(e.target.value)}
            placeholder="Add existing trade"
            style={{ width: 220 }}
          >
            {availableTrades.map((record) => (
              <option key={record.id} value={record.id}>
                {record.name}
              </option>
            ))}
          </SelectInput>
        )}
        {canCreateTrade && (
          <Button
            variant="secondary"
            disabled={creatingTrade.isLoading || catalogueError}
            onClick={createNewTrade}
          >
            {creatingTrade.isLoading ? "Creating…" : "+ Create trade"}
          </Button>
        )}
  </>);
  return (
    <Page>
      <PageHeader
        title={title || "Vendor Comparison"}
        info={`v${revision} · ${trades.length} trades${dirty ? " · Unsaved changes" : ""}`}
        actions={
          <>
            <Button
              variant="ghost"
              onClick={async () => {
                if (!dirty || (await appConfirm("Discard unsaved changes?")))
                  navigate(basePath);
              }}
            >
              Back
            </Button>
            <Button
              variant="secondary"
              disabled={
                exporting ||
                checkingProject ||
                (!initialSheet && checkedProjectId !== projectId)
              }
              onClick={exportExcel}
            >
              {exporting ? "Exporting…" : "Export Excel"}
            </Button>
            <Button
              disabled={
                saving ||
                checkingProject ||
                (!initialSheet &&
                  (!projectId || checkedProjectId !== projectId))
              }
              onClick={save}
            >
              {saving ? "Saving…" : "Save comparison"}
            </Button>
            {initialSheet && (
              <DeleteRateComparison
                sheet={initialSheet}
                onDeleted={() => navigate(basePath)}
              />
            )}
          </>
        }
      />
      {initialSheet && (
        <RecordContext type="vendor-comparison" id={initialSheet.id} />
      )}
      <Card>
        <div className="inos-form-grid">
          <Field label="Sheet name" required htmlFor="comparison-title" hint={initialSheet ? 'Saved comparison names cannot be changed.' : undefined}>
            <TextInput
              id="comparison-title"
              maxLength={255}
              value={title}
              readOnly={Boolean(initialSheet)}
              onChange={(e) => setTitle(e.target.value)}
            />
          </Field>
          <Field label="Project" required htmlFor="comparison-project">
            <SelectInput
              id="comparison-project"
              value={projectId}
              disabled={Boolean(initialSheet) || checkingProject}
              onChange={(e) => selectProject(e.target.value)}
              placeholder="Select project"
            >
              {initialSheet?.project &&
                !list(projects.data).some((p) => p.id === projectId) && (
                  <option value={projectId}>{initialSheet.project.name}</option>
                )}
              {list(projects.data).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </SelectInput>
          </Field>
        </div>
        {checkingProject && (
          <p role="status" className="inos-hint">
            Checking for an existing vendor comparison…
          </p>
        )}
        {projectLookupError && (
          <p role="alert">
            {projectLookupError}{" "}
            <Button variant="ghost" onClick={() => selectProject(projectId)}>
              Retry
            </Button>
          </p>
        )}
        {projects.isError && (
          <p role="alert">
            Could not load projects.{" "}
            <Button variant="ghost" onClick={projects.refetch}>
              Retry
            </Button>
          </p>
        )}
      </Card>
      <Tabs value={workspaceTab} onChange={setWorkspaceTab} options={[
        { value: 'overview', label: 'Overview' },
        { value: 'comparison', label: 'Trade Comparison Sheet' },
        { value: 'history', label: 'Version History' },
      ]} />
      {comparison && <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-0 flex-1 basis-64">
          <ScrollableTradeTabs
            value={activeId}
            onChange={openTrade}
            options={[
              ...trades.map((t) => ({
                value: t.id,
                label: t.name || "Unnamed trade",
              })),
            ]}
          />
        </div>
        {tradeActions}
      </div>}
      {catalogueError && (
        <p role="alert">
          Could not load the trade catalogue.{" "}
          <Button variant="ghost" onClick={retryCatalogue}>
            Retry
          </Button>
        </p>
      )}
      {overview && (
        <>
          <Card title="Finalised vendors" flush actions={<div className="flex flex-wrap items-center gap-2">{tradeActions}</div>}>
            <div className="inos-table-wrap">
              <table className="inos-table">
                <thead>
                  <tr>
                    <th>S.No</th>
                    <th>Trade</th>
                    <th>Finalised vendor</th>
                    <th className="text-right">Amount</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {trades.map((trade, index) => {
                    const picked = trade.vendors.find(
                      (v) => v.id === trade.finalised_vendor_id,
                    );
                    return (
                      <tr key={trade.id}>
                        <td>{index + 1}</td>
                        <td>
                          <Button
                            variant="ghost"
                          onClick={() => openTrade(trade.id)}
                          >
                            {trade.name || "Unnamed trade"}
                          </Button>
                        </td>
                        <td>
                          {picked ? (
                            picked.name
                          ) : (
                            <Pill tone="warning">Pending</Pill>
                          )}
                        </td>
                        <td className="text-right">
                          {money(picked ? quoteTotal(picked) : 0)}
                        </td>
                        <td className="text-right"><Button variant="ghost" aria-label={`Remove ${trade.name}`} onClick={() => removeTrade(trade)}>Remove trade</Button></td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={3}>Total finalised amount</td>
                    <td className="text-right font-semibold">{money(total)}</td><td />
                  </tr>
                </tfoot>
              </table>
            </div>
          </Card>
          <p className="inos-hint">
            {trades.filter((t) => !t.finalised_vendor_id).length} trade(s)
            pending selection
          </p>
          <Card title="Comparison notes">
            <TextArea
              aria-label="Comparison notes"
              rows={3}
              maxLength={10000}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </Card>
          {canCreateQuotation && (
            <div className="flex flex-wrap gap-2">
              {[
                ...new Map(
                  trades.flatMap((t) =>
                    t.vendors
                      .filter(
                        (v) => v.id === t.finalised_vendor_id && !v.custom,
                      )
                      .map((v) => [v.id, v]),
                  ),
                ).values(),
              ].map((v) => (
                <Button
                  key={v.id}
                  variant="secondary"
                  disabled={saving || quotationStatus.isLoading}
                  onClick={() => makeQuotation(v.id)}
                >
                  Create / update quotation — {v.name}
                </Button>
              ))}
            </div>
          )}
        </>
      )}
      {comparison && !active && <Card title="No trades in this sheet"><p className="inos-hint">Add an existing trade or create a new trade to start comparing vendors.</p></Card>}
      {comparison && active && (
        <>
          <Card>
            <div className="flex items-end flex-wrap gap-4">
              <div className="flex-1 min-w-48">
                <Field label="Trade name" htmlFor="trade-name" required>
                  <TextInput id="trade-name" value={active.name} readOnly />
                </Field>
              </div>
              <div className="flex-1 min-w-48">
                <Field label="Vendor columns">
                  <SelectInput
                    aria-label="Number of vendors"
                    value={vendorColumnCount}
                    onChange={(e) =>
                      resizeVendorColumns(Number(e.target.value))
                    }
                  >
                    {[1, 2, 3, 4].map((count) => (
                      <option key={count} value={count}>
                        {count} vendor{count > 1 ? "s" : ""}
                      </option>
                    ))}
                  </SelectInput>
                </Field>
              </div>
              <div className="flex-1 min-w-48">
                <Field label="Finalised vendor" htmlFor="trade-finalised">
                  <SelectInput
                    id="trade-finalised"
                    value={active.finalised_vendor_id}
                    onChange={(e) =>
                      editTrade(active.id, {
                        finalised_vendor_id: e.target.value,
                      })
                    }
                    placeholder="Pending"
                  >
                    {active.vendors.map((v) => (
                      <option
                        key={v.id}
                        value={v.id}
                        disabled={!completeQuote(v)}
                      >
                        {v.name}
                        {!completeQuote(v) ? " — incomplete quote" : ""}
                      </option>
                    ))}
                  </SelectInput>
                </Field>
              </div>
              <Button
                variant="ghost"
                onClick={() => removeTrade(active)}
              >
                Remove trade
              </Button>
            </div>
          </Card>
          <p className="inos-hint">
            Leave quantity blank for lump sums. Negative rates can be used for
            discounts. Amounts and totals calculate automatically.
          </p>
          {vendors.isError && (
            <p role="alert">
              Vendor directory unavailable.{" "}
              <Button variant="ghost" onClick={vendors.refetch}>
                Retry
              </Button>
            </p>
          )}
          <Card
            title="Vendor comparison"
            flush
            actions={
              <Button variant="secondary" onClick={addSharedItem}>
                + Add item
              </Button>
            }
          >
            <div
              className="inos-table-wrap"
              data-testid="trade-comparison-table"
            >
              <table
                className="inos-table"
                style={{
                  minWidth: 500 + vendorColumnCount * 220,
                }}
              >
                <thead>
                  <tr>
                    <th rowSpan={2} scope="col">
                      S.No
                    </th>
                    <th rowSpan={2} scope="col" style={{ minWidth: 260 }}>
                      Item Description
                    </th>
                    <th rowSpan={2} scope="col" style={{ minWidth: 100 }}>
                      Qty
                    </th>
                    {Array.from(
                      {
                        length: vendorColumnCount,
                      },
                      (_, slot) => {
                        const vendor = active.vendors.find(
                          (v, index) => (v.slot ?? index) === slot,
                        );
                        return (
                          <th
                            key={slot}
                            colSpan={2}
                            scope="colgroup"
                            style={{ minWidth: 240, verticalAlign: "top" }}
                          >
                            <div className="mb-2 font-semibold">
                              Vendor {slot + 1}
                            </div>
                            <SelectInput
                              aria-label={`Select vendor ${slot + 1}`}
                              value={vendor && !vendor.custom ? vendor.id : ""}
                              placeholder="Select vendor"
                              onChange={(e) =>
                                selectVendor(vendor, e.target.value, slot)
                              }
                            >
                              {vendor &&
                                !vendor.custom &&
                                !directory.some(
                                  (v) => String(v.id) === vendor.id,
                                ) && (
                                  <option value={vendor.id}>
                                    {vendor.name}
                                  </option>
                                )}
                              {directory
                                .filter(
                                  (v) =>
                                    !active.vendors.some(
                                      (a) =>
                                        a.id === String(v.id) &&
                                        a.id !== vendor?.id,
                                    ),
                                )
                                .map((v) => (
                                  <option key={v.id} value={v.id}>
                                    {v.name ||
                                      v.company_name ||
                                      v.business_name}
                                  </option>
                                ))}
                            </SelectInput>
                            {vendor ? (
                              <div className="flex items-center gap-2 mt-2">
                                <TextInput
                                  aria-label={`Vendor ${slot + 1} name`}
                                  value={vendor.name}
                                  onChange={(e) =>
                                    editVendor(vendor.id, {
                                      name: e.target.value,
                                    })
                                  }
                                />
                                <Button
                                  variant="ghost"
                                  onClick={async () => {
                                    if (
                                      await appConfirm(
                                        "Remove this vendor and its rates?",
                                      )
                                    )
                                      editTrade(active.id, {
                                        vendors: active.vendors.filter(
                                          (v) => v.id !== vendor.id,
                                        ),
                                        finalised_vendor_id:
                                          active.finalised_vendor_id ===
                                          vendor.id
                                            ? ""
                                            : active.finalised_vendor_id,
                                      });
                                  }}
                                >
                                  ×
                                </Button>
                              </div>
                            ) : (
                              <Button
                                variant="ghost"
                                onClick={() => addVendor("", slot)}
                              >
                                Enter custom vendor
                              </Button>
                            )}
                          </th>
                        );
                      },
                    )}
                    <th rowSpan={2} aria-label="Item actions" />
                  </tr>
                  <tr>
                    {Array.from(
                      {
                        length: vendorColumnCount,
                      },
                      (_, slot) => (
                        <Fragment key={slot}>
                          <th scope="col">Rate</th>
                          <th scope="col" className="text-right">
                            Amount
                          </th>
                        </Fragment>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {active.items.map((item, index) => (
                    <tr key={item.id}>
                      <td>{index + 1}</td>
                      <td>
                        <TextArea
                          aria-label={`Item description ${index + 1}`}
                          rows={2}
                          value={item.description}
                          onChange={(e) =>
                            editSharedItem(item.id, {
                              description: e.target.value,
                            })
                          }
                        />
                      </td>
                      <td>
                        <TextInput
                          aria-label={`Quantity ${index + 1}`}
                          type="number"
                          min="0"
                          step="any"
                          value={item.quantity ?? ""}
                          onChange={(e) =>
                            editSharedItem(item.id, {
                              quantity:
                                e.target.value === ""
                                  ? null
                                  : Number(e.target.value),
                            })
                          }
                        />
                      </td>
                      {Array.from(
                        {
                          length: vendorColumnCount,
                        },
                        (_, slot) => {
                          const vendor = active.vendors.find(
                            (v, vi) => (v.slot ?? vi) === slot,
                          );
                          const quote = vendor?.items.find(
                            (line) => line.id === item.id,
                          );
                          return (
                            <Fragment key={slot}>
                              <td>
                                <TextInput
                                  aria-label={`Rate ${index + 1} for ${vendor?.name || `Vendor ${slot + 1}`}`}
                                  type="number"
                                  step="any"
                                  disabled={!vendor}
                                  value={quote?.rate ?? ""}
                                  onChange={(e) =>
                                    editRate(
                                      vendor,
                                      item.id,
                                      e.target.value === ""
                                        ? null
                                        : Number(e.target.value),
                                    )
                                  }
                                />
                              </td>
                              <td className="text-right whitespace-nowrap">
                                {!quote || quoteAmount(quote) === null
                                  ? "—"
                                  : money(quoteAmount(quote))}
                              </td>
                            </Fragment>
                          );
                        },
                      )}
                      <td>
                        <Button
                          variant="ghost"
                          aria-label={`Remove item ${index + 1}`}
                          onClick={() => removeSharedItem(item.id)}
                        >
                          ×
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={3}>Total amount</td>
                    {Array.from(
                      {
                        length: vendorColumnCount,
                      },
                      (_, slot) => {
                        const vendor = active.vendors.find(
                          (v, index) => (v.slot ?? index) === slot,
                        );
                        return (
                          <td
                            key={slot}
                            colSpan={2}
                            className="text-right font-semibold"
                          >
                            {vendor ? money(quoteTotal(vendor)) : "—"}
                          </td>
                        );
                      },
                    )}
                    <td />
                  </tr>
                  <tr>
                    <td colSpan={3}>Finalised vendor</td>
                    {Array.from(
                      {
                        length: vendorColumnCount,
                      },
                      (_, slot) => {
                        const vendor = active.vendors.find(
                          (v, index) => (v.slot ?? index) === slot,
                        );
                        const picked =
                          vendor && active.finalised_vendor_id === vendor.id;
                        return (
                          <td key={slot} colSpan={2}>
                            {vendor && (
                              <>
                                <Button
                                  variant={picked ? "secondary" : "ghost"}
                                  disabled={!completeQuote(vendor)}
                                  onClick={() =>
                                    editTrade(active.id, {
                                      finalised_vendor_id: picked
                                        ? ""
                                        : vendor.id,
                                    })
                                  }
                                >
                                  {picked
                                    ? "✓ Finalised · Clear"
                                    : "Finalise vendor"}
                                </Button>
                                {completeQuote(vendor) &&
                                  quoteTotal(vendor) === lowest && (
                                    <Pill tone="success">★ Lowest</Pill>
                                  )}
                              </>
                            )}
                          </td>
                        );
                      },
                    )}
                    <td />
                  </tr>
                  <tr>
                    <td colSpan={3}>Vendor notes</td>
                    {Array.from(
                      {
                        length: vendorColumnCount,
                      },
                      (_, slot) => {
                        const vendor = active.vendors.find(
                          (v, index) => (v.slot ?? index) === slot,
                        );
                        return (
                          <td key={slot} colSpan={2}>
                            <TextArea
                              aria-label={`Vendor ${slot + 1} notes`}
                              rows={3}
                              maxLength={10000}
                              disabled={!vendor}
                              value={vendor?.notes || ""}
                              onChange={(e) =>
                                editVendor(vendor.id, { notes: e.target.value })
                              }
                            />
                          </td>
                        );
                      },
                    )}
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
            <div className="flex justify-between gap-3 p-4">
              <Button variant="ghost" onClick={addSharedItem}>
                + Add item
              </Button>
              {vendorColumnCount < 4 && (
                <Button
                  variant="secondary"
                  onClick={() =>
                    editTrade(active.id, {
                      vendor_column_count: vendorColumnCount + 1,
                    })
                  }
                >
                  + Add vendor column
                </Button>
              )}
            </div>
          </Card>{" "}
        </>
      )}
      {workspaceTab === 'history' && <div role="tabpanel" aria-label="Version History">
        {initialSheet ? <VersionHistory type="vendor-comparison" id={initialSheet.id} title="Version & approval history" /> : <Card title="Version & approval history"><p className="inos-hint">Save this vendor comparison to start its version and approval history.</p></Card>}
      </div>}
    </Page>
  );
}

function ScrollableTradeTabs({ value, onChange, options }) {
  const viewport = useRef(null);
  const [position, setPosition] = useState({
    overflow: false,
    left: false,
    right: false,
  });
  const updatePosition = () => {
    const element = viewport.current;
    if (!element) return;
    setPosition({
      overflow: element.scrollWidth > element.clientWidth + 1,
      left: element.scrollLeft > 1,
      right: element.scrollLeft + element.clientWidth < element.scrollWidth - 1,
    });
  };
  useEffect(() => {
    const element = viewport.current;
    const observer = new ResizeObserver(updatePosition);
    observer.observe(element);
    observer.observe(element.firstElementChild);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    const element = viewport.current;
    const selected = element.querySelector('[aria-selected="true"]');
    if (!selected) return;
    const bounds = element.getBoundingClientRect();
    const tab = selected.getBoundingClientRect();
    if (tab.left < bounds.left)
      element.scrollBy({ left: tab.left - bounds.left, behavior: "smooth" });
    else if (tab.right > bounds.right)
      element.scrollBy({ left: tab.right - bounds.right, behavior: "smooth" });
  }, [value]);
  const slide = (direction) =>
    viewport.current.scrollBy({
      left: direction * Math.max(160, viewport.current.clientWidth * 0.75),
      behavior: "smooth",
    });
  return (
    <div className="flex min-w-0 items-center gap-1">
      {position.overflow && (
        <Button
          variant="ghost"
          aria-label="Scroll trades left"
          disabled={!position.left}
          onClick={() => slide(-1)}
        >
          <ChevronLeft size={18} />
        </Button>
      )}
      <div
        ref={viewport}
        onScroll={updatePosition}
        className="min-w-0 flex-1 overflow-x-auto [&_.inos-tabs]:w-max [&_.inos-tabs]:min-w-full [&_.inos-tabs]:overflow-visible [&_button]:shrink-0"
        style={{ scrollbarWidth: "thin", paddingBottom: 4 }}
      >
        <Tabs value={value} onChange={onChange} options={options} />
      </div>
      {position.overflow && (
        <Button
          variant="ghost"
          aria-label="Scroll trades right"
          disabled={!position.right}
          onClick={() => slide(1)}
        >
          <ChevronRight size={18} />
        </Button>
      )}
    </div>
  );
}

