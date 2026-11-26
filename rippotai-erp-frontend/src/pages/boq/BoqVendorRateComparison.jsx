import { Fragment, useEffect, useRef, useState } from 'react';
import './vendorComparisonWorkspace.css';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Page,
  PageHeader,
  Tabs,
  Card,
  Button,
  Field,
  TextInput,
  SelectInput,
  TextArea,
  Pill,
} from '@/components/inos';
import vendorComparisonTemplate from '@/assets/xlsx-templates/vendor-comparison-v2.xlsx?url';
import { useGetProjectsQuery } from '../../api/projects/project.api';
import { useGetVendorsQuery } from '../../api/vendors/vendor.api';
import { useGetUnitsQuery } from '../../api/meta/unit.api';
import { UNITS } from '../../hooks/constants';
import {
  useGetRateComparisonQuery,
  useCreateRateComparisonMutation,
  useUpdateRateComparisonMutation,
  useGetVendorTradesQuery,
  useCreateVendorTradeMutation,
  useLazyGetRateComparisonsQuery,
} from '../../api/procuerment/vendor-rate-comparison.api';
import RecordContext from '@/components/record-context/RecordContext';
import VersionHistory from '@/components/record-context/VersionHistory';
import DeleteRateComparison from '@/components/materials/DeleteRateComparison';
import { usePermission } from '@/hooks/use-permission';
import { useCreateQuotationFromComparisonMutation } from '@/api/procuerment/procurement-quotation.api';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { DocumentPreview } from '@/components/print-document';
import QuotationDocument from '@/components/commerce-documents/QuotationDocument';
import { quotationSheetModel } from '@/components/quotation-documents/quotationModel';
import { appConfirm, appPrompt } from '@/lib/app-dialog';
import { downloadXlsx } from '@/lib/xlsxTemplate';
import { buildVendorComparisonWorkbook } from './vendorComparisonExcel';
import { buildVendorEstimateWorkbook } from './vendorEstimateExcel';
import {
  comparisonTrades,
  withComparisonItems,
  createDefaultTrades,
  tradeNameKey,
  completeQuote,
  quoteAmount,
  quoteTotal,
} from './vendorComparisonData';

const basePath = '/procurement/vendors/rate-comparison';
const LUMP_SUM_UNIT = 'Lump';
const uid = () => crypto.randomUUID();
const cx = (...classes) => classes.filter(Boolean).join(' ');
const plural = (count, word) => `${count} ${word}${count === 1 ? '' : 's'}`;
const money = (n) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(n);
const num = (n) =>
  new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(n);
// Compact lakh/crore form used in the trade list, e.g. ₹2.83L, ₹42K.
const compactMoney = (n) => {
  const abs = Math.abs(n);
  if (abs >= 1e7) return `₹${parseFloat((n / 1e7).toFixed(2))}Cr`;
  if (abs >= 1e5) return `₹${parseFloat((n / 1e5).toFixed(2))}L`;
  if (abs >= 1e3) return `₹${Math.round(n / 1e3)}K`;
  return money(n);
};
const list = (response) => {
  const data = response?.data?.data ?? response?.data ?? response;
  return Array.isArray(data) ? data : data?.items || data?.projects || data?.vendors || [];
};

export default function VendorRateComparison() {
  const { id } = useParams();
  const [savedQuotation, setSavedQuotation] = useState(null);
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
          Could not load comparison. <button onClick={query.refetch}>Retry</button>
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
            Could not load vendor trades.{' '}
            <Button variant="secondary" onClick={catalogueQuery.refetch}>
              Retry
            </Button>
          </p>
        ) : (
          'Loading vendor trades…'
        )}
      </Page>
    );
  return (
    <>
      <Workspace
        key={id || 'new'}
        initialSheet={id ? query.currentData : null}
        catalogue={list(catalogueQuery.data)}
        catalogueError={catalogueQuery.isError}
        retryCatalogue={catalogueQuery.refetch}
        onQuotationSaved={setSavedQuotation}
      />
      <Sheet
        open={Boolean(savedQuotation)}
        onOpenChange={(open) => !open && setSavedQuotation(null)}
      >
        <SheetContent className="h-full w-full overflow-y-auto sm:max-w-[900px]">
          {savedQuotation && (
            <>
              <SheetHeader>
                <SheetTitle>Quotation {savedQuotation.quotation_number}</SheetTitle>
                <SheetDescription>
                  {savedQuotation.refilled ? 'Updated' : 'Created'} for{' '}
                  {savedQuotation.vendor_name || savedQuotation.vendor?.name}.
                </SheetDescription>
              </SheetHeader>
              <DocumentPreview>
                <QuotationDocument model={quotationSheetModel(savedQuotation)} />
              </DocumentPreview>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}

function Workspace({ initialSheet, catalogue, catalogueError, retryCatalogue, onQuotationSaved }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [title, setTitle] = useState(initialSheet?.title || '');
  const [projectId, setProjectId] = useState(initialSheet?.project_id || '');
  const [checkedProjectId, setCheckedProjectId] = useState(initialSheet?.project_id || '');
  const [projectLookupError, setProjectLookupError] = useState('');
  const [checkingProject, setCheckingProject] = useState(false);
  const projectLookupSequence = useRef(0);
  useEffect(
    () => () => {
      projectLookupSequence.current += 1;
    },
    [],
  );
  const [fetchProjectComparisons] = useLazyGetRateComparisonsQuery();
  const selectProject = async (nextId) => {
    const sequence = ++projectLookupSequence.current;
    setProjectId(nextId);
    setCheckedProjectId('');
    setProjectLookupError('');
    setCheckingProject(Boolean(nextId));
    if (!nextId) return;
    try {
      const comparisons = list(await fetchProjectComparisons(nextId, false).unwrap());
      if (sequence !== projectLookupSequence.current) return;
      if (comparisons.length) {
        navigate(`${basePath}/${comparisons[0].id}/edit`, { replace: true });
        return;
      }
      setCheckedProjectId(nextId);
    } catch {
      if (sequence === projectLookupSequence.current)
        setProjectLookupError('Could not check this project for an existing vendor comparison.');
    } finally {
      if (sequence === projectLookupSequence.current) setCheckingProject(false);
    }
  };
  const [notes, setNotes] = useState(initialSheet?.notes || '');
  const [trades, setTrades] = useState(() =>
    initialSheet ? comparisonTrades(initialSheet.snapshot) : createDefaultTrades(catalogue),
  );
  const [activeId, setActiveId] = useState(() =>
    trades.some((t) => t.id === searchParams.get('trade'))
      ? searchParams.get('trade')
      : trades[0]?.id || '',
  );
  const requestedTab = searchParams.get('tab');
  const [workspaceTab, setWorkspaceTab] = useState(() => {
    if (requestedTab === 'history') return 'history';
    if (requestedTab === 'comparison' || searchParams.has('trade')) return 'comparison';
    return 'overview';
  });
  const [tradeSearch, setTradeSearch] = useState('');
  const [tradeFilter, setTradeFilter] = useState('all');
  const tradeStrip = useRef(null);
  const [editingSlot, setEditingSlot] = useState(null);
  const openTrade = (id) => {
    setActiveId(id);
    setWorkspaceTab('comparison');
  };
  useEffect(() => {
    const strip = tradeStrip.current;
    const selected = strip?.querySelector('[aria-current="true"]');
    if (!selected) return;
    const viewport = strip.getBoundingClientRect();
    const trade = selected.getBoundingClientRect();
    if (trade.left < viewport.left) strip.scrollBy({ left: trade.left - viewport.left });
    else if (trade.right > viewport.right) strip.scrollBy({ left: trade.right - viewport.right });
  }, [activeId, workspaceTab, tradeFilter, tradeSearch]);
  const [revision, setRevision] = useState(initialSheet?.revision || 1);
  const [saved, setSaved] = useState(() => JSON.stringify({ title, projectId, notes, trades }));
  const [exporting, setExporting] = useState(false);
  const projects = useGetProjectsQuery();
  const vendors = useGetVendorsQuery({ status: 'ACTIVE' });
  const { data: units } = useGetUnitsQuery();
  const unitOptions = new Set([
    ...(units?.length ? units.map(({ code }) => code) : UNITS),
    LUMP_SUM_UNIT,
  ]);
  const [create, creating] = useCreateRateComparisonMutation();
  const [update, updating] = useUpdateRateComparisonMutation();
  const saving = creating.isLoading || updating.isLoading;
  const canCreateQuotation = usePermission('procurement-quotations', 'create');
  const canCreateTrade = usePermission('vendor-rate-comparisons', 'create');
  const [createTrade, creatingTrade] = useCreateVendorTradeMutation();
  const [createQuotation] = useCreateQuotationFromComparisonMutation();
  const [quotationPending, setQuotationPending] = useState(false);
  const state = JSON.stringify({ title, projectId, notes, trades });
  const dirty = state !== saved;
  useEffect(() => {
    const warn = (event) => {
      if (dirty) {
        event.preventDefault();
        event.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);
  const active = trades.find((trade) => trade.id === activeId);
  const editTrade = (id, patch) =>
    setTrades((old) => old.map((trade) => (trade.id === id ? { ...trade, ...patch } : trade)));
  const editVendor = (id, patch) =>
    editTrade(active.id, {
      vendors: active.vendors.map((v) => (v.id === id ? { ...v, ...patch } : v)),
    });
  const editSharedItem = (id, patch) =>
    editTrade(
      active.id,
      withComparisonItems(
        active,
        active.items.map((item) => (item.id === id ? { ...item, ...patch } : item)),
      ),
    );
  const addSharedItem = () => {
    const item = { id: uid(), description: '', quantity: null, unit: '' };
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
      items: vendor.items.map((item) => (item.id === id ? { ...item, rate } : item)),
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
          name: source?.name || source?.company_name || source?.business_name || 'New vendor',
          items: active.items.map((item) => ({ ...item, rate: null })),
        },
      ],
    });
  };
  const validate = (nextTrades = trades) => {
    if (!initialSheet && (!projectId || checkedProjectId !== projectId || checkingProject))
      return 'Select a project and wait for its existing comparison check.';
    if (!title.trim() || !projectId) return 'Enter a sheet name and select a project.';
    if (!nextTrades.length || nextTrades.some((t) => !t.name.trim()))
      return 'Enter a name for every trade.';
    for (const trade of nextTrades) {
      if (
        trade.items.some(
          (item) =>
            !item.description.trim() ||
            (item.quantity !== null && (!Number.isFinite(item.quantity) || item.quantity < 0)),
        )
      )
        return 'Check shared item descriptions and quantities.';
      for (const vendor of trade.vendors) {
        if (!vendor.name.trim()) return 'Enter a name for every vendor.';
        if (
          vendor.items.some(
            (i) =>
              !i.description.trim() ||
              (i.quantity !== null && (!Number.isFinite(i.quantity) || i.quantity < 0)) ||
              (i.rate !== null && !Number.isFinite(i.rate)),
          )
        )
          return 'Check quote descriptions, quantities and rates.';
      }
    }
    return null;
  };
  const save = async ({ nextTrades = trades, forQuotation = false } = {}) => {
    const error = validate(nextTrades);
    if (error) {
      toast.error(error);
      return;
    }
    const body = {
      title: title.trim(),
      project_id: projectId,
      notes,
      snapshot: { schema_version: 2, trades: nextTrades },
    };
    try {
      const result = await (
        initialSheet ? update({ id: initialSheet.id, revision, ...body }) : create(body)
      ).unwrap();
      setRevision(result.revision);
      setSaved(JSON.stringify({ title, projectId, notes, trades: nextTrades }));
      toast.success('Vendor comparison saved');
      if (!initialSheet && !forQuotation)
        navigate(`${basePath}/${result.id}/edit`, { replace: true });
      return result;
    } catch (error) {
      if (!forQuotation && !initialSheet && error?.status === 409 && error?.data?.comparison_id) {
        toast.info('This project already has a vendor comparison. Opening its saved data.');
        navigate(`${basePath}/${error.data.comparison_id}/edit`, {
          replace: true,
        });
        return;
      }
      toast.error([error?.data?.message || 'Could not save comparison'].flat().join('. '));
    }
  };
  const makeQuotation = async (vendor, { nextTrades = trades, confirm = false } = {}) => {
    if (saving || quotationPending) return;
    if (vendor.custom) {
      toast.info('Select a vendor from the vendor directory to create a quotation.');
      return;
    }
    const incompleteTrade = nextTrades.find(
      (trade) =>
        trade.finalised_vendor_id === vendor.id &&
        !completeQuote(trade.vendors.find((entry) => entry.id === vendor.id)),
    );
    if (incompleteTrade) {
      toast.info(
        `Complete the vendor’s quote for ${incompleteTrade.name} to create the quotation.`,
      );
      return;
    }
    setQuotationPending(true);
    let sheet;
    try {
      if (
        confirm &&
        !(await appConfirm(
          `Create or update the quotation for ${vendor.name} using their finalised trades?`,
        ))
      )
        return;
      sheet =
        dirty || !initialSheet || nextTrades !== trades
          ? await save({ nextTrades, forQuotation: true })
          : initialSheet;
      if (!sheet) return;
      const quotation = await createQuotation({
        comparison_id: sheet.id,
        vendor_id: vendor.id,
      }).unwrap();
      onQuotationSaved(quotation);
    } catch (error) {
      toast.error([error?.data?.message || 'Could not create quotation'].flat().join('. '));
    } finally {
      setQuotationPending(false);
      if (!initialSheet && sheet) {
        const query = new URLSearchParams({
          tab: workspaceTab,
          ...(workspaceTab === 'comparison' && activeId && { trade: activeId }),
        });
        navigate(`${basePath}/${sheet.id}/edit?${query}`, { replace: true });
      }
    }
  };
  const finaliseVendor = (vendor) => {
    const picked = active.finalised_vendor_id === vendor.id;
    const nextTrades = trades.map((trade) =>
      trade.id === active.id ? { ...trade, finalised_vendor_id: picked ? '' : vendor.id } : trade,
    );
    setTrades(nextTrades);
    if (!picked && canCreateQuotation) {
      void makeQuotation(vendor, { nextTrades, confirm: true });
    }
  };
  const exportExcel = async () => {
    const error = validate();
    if (error) return toast.error(error);
    setExporting(true);
    try {
      const project = list(projects.data).find((p) => p.id === projectId) || initialSheet?.project;
      downloadXlsx(
        await buildVendorComparisonWorkbook(vendorComparisonTemplate, {
          title,
          projectName: project?.name,
          notes,
          trades,
        }),
        `${title.replace(/[^a-z0-9_-]/gi, '_')}.xlsx`,
      );
    } catch {
      toast.error('Could not export comparison');
    } finally {
      setExporting(false);
    }
  };
  // Estimate of one vendor across every trade it quoted in (finalised or not).
  const exportEstimate = async (vendor) => {
    try {
      const project = list(projects.data).find((p) => p.id === projectId) || initialSheet?.project;
      const wb = await buildVendorEstimateWorkbook({
        title,
        projectName: project?.name,
        vendor,
        trades,
      });
      downloadXlsx(
        await wb.xlsx.writeBuffer(),
        `Estimate - ${vendor.name || 'Vendor'} - ${project?.name || title}.xlsx`,
      );
    } catch {
      toast.error('Could not export the estimate');
    }
  };
  const estimateVendors = [
    ...new Map(
      trades.flatMap((trade) =>
        trade.vendors
          .filter((vendor) => vendor.name?.trim() && vendor.items.length)
          .map((vendor) => [
            vendor.custom ? `n:${vendor.name.trim().toLowerCase()}` : vendor.id,
            vendor,
          ]),
      ),
    ).values(),
  ].sort((a, b) => a.name.localeCompare(b.name));
  const total = trades.reduce(
    (sum, t) =>
      sum + quoteTotal(t.vendors.find((v) => v.id === t.finalised_vendor_id) || { items: [] }),
    0,
  );
  const completeTotals = active?.vendors.filter(completeQuote).map(quoteTotal) || [];
  const lowest = completeTotals.length ? Math.min(...completeTotals) : null;
  const vendorColumnCount = Math.min(
    4,
    Math.max(
      active?.vendor_column_count ?? 3,
      ...(active?.vendors || []).map((v, index) => (v.slot ?? index) + 1),
    ),
  );
  const resizeVendorColumns = async (count) => {
    const removed = active.vendors.filter((v, index) => (v.slot ?? index) >= count);
    if (removed.length && !(await appConfirm('Remove the extra vendor columns and their quotes?')))
      return;
    editTrade(active.id, {
      vendor_column_count: count,
      vendors: active.vendors.filter((v) => !removed.includes(v)),
      finalised_vendor_id: removed.some((v) => v.id === active.finalised_vendor_id)
        ? ''
        : active.finalised_vendor_id,
    });
  };
  const directory = list(vendors.data);
  const availableTrades = catalogue.filter(
    (record) => !trades.some((t) => tradeNameKey(t.name) === tradeNameKey(record.name)),
  );
  const addTrade = (id) => {
    const record = availableTrades.find((t) => t.id === id);
    if (!record) return;
    const trade = {
      id: record.id,
      name: record.name,
      items: [],
      vendors: [],
      finalised_vendor_id: '',
    };
    setTrades([...trades, trade]);
    openTrade(trade.id);
  };
  const createNewTrade = async () => {
    const name = await appPrompt(
      'New vendor trade name. This will be added to the shared catalogue and this comparison sheet.',
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
          finalised_vendor_id: '',
        },
      ]);
      openTrade(record.id);
      toast.success('Vendor trade created and added to this sheet');
    } catch (error) {
      toast.error([error?.data?.message || 'Could not create trade'].flat().join('. '));
    }
  };
  const selectVendor = (current, value, slot) => {
    const source = directory.find((v) => String(v.id) === value);
    if (!source || active.vendors.some((v) => v.id === String(source.id) && v.id !== current?.id))
      return;
    const next = {
      slot,
      id: String(source.id),
      name: source.name || source.company_name || source.business_name,
      notes: current?.notes || '',
      items: current?.items || active.items.map((item) => ({ ...item, rate: null })),
    };
    editTrade(active.id, {
      vendors: current
        ? active.vendors.map((v) => (v.id === current.id ? next : v))
        : [...active.vendors, next],
      finalised_vendor_id:
        current?.id === active.finalised_vendor_id ? '' : active.finalised_vendor_id,
    });
  };
  const removeTrade = async (trade) => {
    if (
      !(await appConfirm(
        `Remove ${trade.name} and its quotes from this sheet? The shared trade catalogue will remain unchanged.`,
      ))
    )
      return;
    setTrades((current) => current.filter((t) => t.id !== trade.id));
    if (activeId === trade.id) setActiveId(trades.find((t) => t.id !== trade.id)?.id || '');
  };
  const tradeActions = (
    <>
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
          {creatingTrade.isLoading ? 'Creating…' : '+ Create trade'}
        </Button>
      )}
    </>
  );
  const projectName =
    list(projects.data).find((project) => project.id === projectId)?.name ||
    initialSheet?.project?.name;
  const finalisedTrades = trades.filter((trade) => trade.finalised_vendor_id);
  const pendingCount = trades.length - finalisedTrades.length;
  const inProgressCount = trades.filter(
    (trade) => !trade.finalised_vendor_id && trade.vendors.length,
  ).length;
  const notStartedCount = pendingCount - inProgressCount;
  const quotationVendors = [
    ...new Map(
      finalisedTrades.flatMap((trade) =>
        trade.vendors
          .filter(
            (vendor) =>
              vendor.id === trade.finalised_vendor_id && !vendor.custom && completeQuote(vendor),
          )
          .map((vendor) => [vendor.id, vendor]),
      ),
    ).values(),
  ];
  const activeIndex = trades.findIndex((trade) => trade.id === activeId);
  const nextTrade = trades[activeIndex + 1];
  const previousTrade = trades[activeIndex - 1];
  const matchingTrades = trades.filter(
    (trade) =>
      trade.name.toLowerCase().includes(tradeSearch.trim().toLowerCase()) &&
      (tradeFilter === 'all' ||
        Boolean(trade.finalised_vendor_id) === (tradeFilter === 'finalised')),
  );
  const vendorAt = (slot) =>
    active?.vendors.find((vendor, index) => (vendor.slot ?? index) === slot);
  const slots = Array.from({ length: vendorColumnCount }, (_, slot) => slot);
  const nextVendorSlot = [0, 1, 2, 3].find((slot) => !vendorAt(slot));
  const totalColumns = 5 + vendorColumnCount * 2;
  // Explicit column widths (see vendorComparisonWorkspace.css); the table's
  // min-width is their sum so columns keep their size and the wrapper scrolls.
  const tableMinWidth = 40 + 220 + 72 + 100 + vendorColumnCount * 212 + 40;
  const saveState = dirty
    ? 'Unsaved changes. Save to keep them.'
    : initialSheet
      ? 'All changes saved'
      : 'Not saved yet';
  const removeVendor = async (vendor) => {
    if (!(await appConfirm('Remove this vendor and its rates?'))) return;
    setEditingSlot(null);
    editTrade(active.id, {
      vendors: active.vendors.filter((v) => v.id !== vendor.id),
      finalised_vendor_id:
        active.finalised_vendor_id === vendor.id ? '' : active.finalised_vendor_id,
    });
  };

  return (
    <Page className="vendor-comparison-workspace">
      <PageHeader
        title={title || 'Vendor Comparison Workspace'}
        info={
          <span className="vc-meta">
            {projectName && (
              <Pill tone="mute" dot={false}>
                {projectName}
              </Pill>
            )}
            <Pill tone="mute" dot={false}>
              v{revision}
            </Pill>
            <Pill tone={dirty ? 'warn' : initialSheet ? 'ok' : 'info'}>
              {dirty ? 'Unsaved changes' : initialSheet ? 'Saved' : 'New comparison'}
            </Pill>
          </span>
        }
        actions={
          <>
            <Button
              variant="ghost"
              onClick={async () => {
                if (!dirty || (await appConfirm('Discard unsaved changes?'))) navigate(basePath);
              }}
            >
              Back
            </Button>
            <Button
              variant="secondary"
              disabled={
                exporting || checkingProject || (!initialSheet && checkedProjectId !== projectId)
              }
              onClick={exportExcel}
            >
              {exporting ? 'Exporting…' : 'Export Excel'}
            </Button>
            {estimateVendors.length > 0 && (
              <details className="vc-menu" data-testid="vendor-estimate-menu">
                <summary>Vendor estimate</summary>
                <div className="vc-menu-content">
                  {estimateVendors.map((vendor) => (
                    <Button
                      key={vendor.id}
                      variant="ghost"
                      onClick={(e) => {
                        e.currentTarget.closest('details')?.removeAttribute('open');
                        exportEstimate(vendor);
                      }}
                    >
                      {vendor.name}
                    </Button>
                  ))}
                </div>
              </details>
            )}
            {canCreateQuotation && quotationVendors.length > 0 && (
              <details className="vc-menu">
                <summary>Create quotation</summary>
                <div className="vc-menu-content">
                  {quotationVendors.map((vendor) => (
                    <Button
                      key={vendor.id}
                      variant="ghost"
                      disabled={saving || quotationPending}
                      onClick={(event) => {
                        event.currentTarget.closest('details')?.removeAttribute('open');
                        void makeQuotation(vendor);
                      }}
                    >
                      {vendor.name}
                    </Button>
                  ))}
                </div>
              </details>
            )}
            <Button
              disabled={
                saving ||
                quotationPending ||
                checkingProject ||
                (!initialSheet && (!projectId || checkedProjectId !== projectId))
              }
              onClick={() => save()}
            >
              {saving ? 'Saving…' : 'Save comparison'}
            </Button>
            {initialSheet && (
              <DeleteRateComparison sheet={initialSheet} onDeleted={() => navigate(basePath)} />
            )}
          </>
        }
      />
      {initialSheet && <RecordContext type="vendor-comparison" id={initialSheet.id} />}
      <div className="vc-summary">
        <Card className="vc-sheet-card">
          <div className="vc-sheet-fields">
            <Field
              label="Sheet name"
              required
              htmlFor="comparison-title"
              hint={initialSheet ? 'Saved comparison names cannot be changed.' : undefined}
            >
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
                {initialSheet?.project && !list(projects.data).some((p) => p.id === projectId) && (
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
              {projectLookupError}{' '}
              <Button variant="ghost" onClick={() => selectProject(projectId)}>
                Retry
              </Button>
            </p>
          )}
          {projects.isError && (
            <p role="alert">
              Could not load projects.{' '}
              <Button variant="ghost" onClick={projects.refetch}>
                Retry
              </Button>
            </p>
          )}
        </Card>
        <Card className="vc-stat">
          <span>Trades finalised</span>
          <strong>
            {finalisedTrades.length} / {trades.length}
          </strong>
          <small>
            {inProgressCount} in progress · {notStartedCount} not started
          </small>
        </Card>
        <Card className="vc-stat">
          <span>Finalised value</span>
          <strong>{money(total)}</strong>
          <small>Across {finalisedTrades.length} trades</small>
        </Card>
      </div>
      <Tabs
        value={workspaceTab}
        onChange={setWorkspaceTab}
        options={[
          { value: 'overview', label: 'Overview' },
          { value: 'comparison', label: 'Vendor Comparison Sheet' },
          { value: 'history', label: 'Version History' },
        ]}
      />
      {workspaceTab === 'overview' && (
        <Card title="Comparison summary" flush>
          <div role="tabpanel" aria-label="Overview">
            <div className="inos-table-wrap">
              <table className="inos-table vc-overview-table" aria-label="Finalised vendor summary">
                <thead>
                  <tr>
                    <th scope="col">S.No</th>
                    <th scope="col">Trade</th>
                    <th scope="col">Finalised vendor</th>
                    <th scope="col" className="text-right">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {!trades.length && (
                    <tr>
                      <td colSpan={4}>No trades in this sheet.</td>
                    </tr>
                  )}
                  {trades.map((trade, index) => {
                    const vendor = trade.vendors.find(({ id }) => id === trade.finalised_vendor_id);
                    return (
                      <tr key={trade.id}>
                        <td>{index + 1}</td>
                        <td>
                          <button
                            className="vc-overview-trade"
                            type="button"
                            onClick={() => openTrade(trade.id)}
                          >
                            {trade.name}
                          </button>
                        </td>
                        <td>
                          {vendor?.name || 'Pending'}
                          {vendor && !completeQuote(vendor) && (
                            <span className="vc-incomplete"> · Incomplete quote</span>
                          )}
                        </td>
                        <td className="text-right whitespace-nowrap">
                          {money(vendor ? quoteTotal(vendor) : 0)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="vc-total">
                    <th scope="row" colSpan={3}>
                      Total finalised amount
                    </th>
                    <td className="text-right">{money(total)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
            <div className="vc-overview-notes">
              <p className="inos-hint">
                {pendingCount} {pendingCount === 1 ? 'trade' : 'trades'} pending selection
              </p>
              <Field label="Comparison notes" htmlFor="vc-overview-notes">
                <TextArea
                  id="vc-overview-notes"
                  rows={3}
                  maxLength={10000}
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                />
              </Field>
            </div>
          </div>
        </Card>
      )}
      {workspaceTab === 'comparison' && (
        <div className="vc-layout" role="tabpanel" aria-label="Vendor Comparison Sheet">
          <Card className="vc-trades">
            <div className="vc-trades-heading">
              <h2>
                Trades <span>{trades.length}</span>
              </h2>
              <details className="vc-menu">
                <summary>+ Trade</summary>
                <div className="vc-menu-content">
                  {tradeActions}
                  {!availableTrades.length && !canCreateTrade && (
                    <span>No trades available to add</span>
                  )}
                </div>
              </details>
            </div>
            {catalogueError && (
              <p role="alert">
                Trade catalogue unavailable.{' '}
                <Button variant="ghost" onClick={retryCatalogue}>
                  Retry
                </Button>
              </p>
            )}
            <TextInput
              type="search"
              aria-label="Search trades"
              placeholder="Search trades…"
              value={tradeSearch}
              onChange={(event) => setTradeSearch(event.target.value)}
            />
            <div className="vc-filters" aria-label="Filter trades" role="group">
              {[
                ['all', `All ${trades.length}`],
                ['pending', `Pending ${pendingCount}`],
                ['finalised', `Finalised ${finalisedTrades.length}`],
              ].map(([filter, label]) => (
                <button
                  key={filter}
                  type="button"
                  aria-pressed={tradeFilter === filter}
                  onClick={() => setTradeFilter(filter)}
                >
                  {label}
                </button>
              ))}
            </div>
            <div ref={tradeStrip} className="vc-trade-list" aria-label="Trades">
              {!matchingTrades.length && <p className="inos-hint">No matching trades.</p>}
              {matchingTrades.map((trade) => {
                const picked = trade.vendors.find(
                  (vendor) => vendor.id === trade.finalised_vendor_id,
                );
                const status = picked
                  ? 'Finalised'
                  : trade.vendors.length
                    ? 'Pending'
                    : 'No vendors yet';
                return (
                  <button
                    key={trade.id}
                    type="button"
                    className="vc-trade"
                    aria-current={trade.id === activeId ? 'true' : undefined}
                    onClick={() => openTrade(trade.id)}
                  >
                    <span
                      className="vc-status"
                      data-status={status}
                      role="img"
                      aria-label={status}
                      title={status}
                    />
                    <span className="vc-trade-name">
                      <strong>{trade.name || 'Unnamed trade'}</strong>
                      <small>
                        {picked?.name ||
                          (trade.vendors.length
                            ? `${plural(trade.vendors.length, 'vendor')} · ${plural(trade.items.length, 'item')}`
                            : status)}
                      </small>
                    </span>
                    <span className="vc-trade-amount">
                      {picked ? compactMoney(quoteTotal(picked)) : '—'}
                    </span>
                  </button>
                );
              })}
            </div>
          </Card>
          <div className="vc-main">
            {!active && (
              <Card title="No trades in this sheet">
                <p className="inos-hint">
                  Add an existing trade or create a new trade to start comparing vendors.
                </p>
              </Card>
            )}
            {active && (
              <Card flush className="vc-sheet">
                <div className="vc-toolbar">
                  <h2>{active.name}</h2>
                  <Pill tone={active.finalised_vendor_id ? 'ok' : 'warn'}>
                    {active.finalised_vendor_id ? 'Finalised' : 'Pending decision'}
                  </Pill>
                  <span className="vc-count">
                    {plural(active.items.length, 'item')} ·{' '}
                    {plural(active.vendors.length, 'vendor')}
                  </span>
                  <div className="vc-toolbar-actions">
                    {nextVendorSlot === undefined ? (
                      <Button variant="secondary" disabled>
                        + Add vendor
                      </Button>
                    ) : (
                      <details key={active.id} className="vc-menu">
                        <summary>+ Add vendor</summary>
                        <div className="vc-menu-content">
                          <SelectInput
                            aria-label="Select vendor to add"
                            value=""
                            placeholder="Select vendor"
                            onChange={(event) => {
                              if (!event.target.value) return;
                              addVendor(event.target.value, nextVendorSlot);
                              event.currentTarget.closest('details').open = false;
                            }}
                          >
                            {directory
                              .filter(
                                (vendor) =>
                                  !active.vendors.some(({ id }) => id === String(vendor.id)),
                              )
                              .map((vendor) => (
                                <option key={vendor.id} value={vendor.id}>
                                  {vendor.name || vendor.company_name || vendor.business_name}
                                </option>
                              ))}
                          </SelectInput>
                          <Button
                            variant="ghost"
                            onClick={(event) => {
                              addVendor('', nextVendorSlot);
                              setEditingSlot(nextVendorSlot);
                              event.currentTarget.closest('details').open = false;
                            }}
                          >
                            Enter custom vendor
                          </Button>
                        </div>
                      </details>
                    )}
                    <Button variant="secondary" onClick={addSharedItem}>
                      + Add item
                    </Button>
                    <details className="vc-menu">
                      <summary aria-label="Trade options">⋯</summary>
                      <div className="vc-menu-content">
                        <Field label="Vendor columns">
                          <SelectInput
                            aria-label="Number of vendors"
                            value={vendorColumnCount}
                            onChange={(event) => resizeVendorColumns(Number(event.target.value))}
                          >
                            {[1, 2, 3, 4].map((count) => (
                              <option key={count} value={count}>
                                {count}
                              </option>
                            ))}
                          </SelectInput>
                        </Field>
                      </div>
                    </details>
                  </div>
                </div>
                <p className="vc-hint">
                  Lowest rate in each row is marked green · Leave quantity blank for lump sums or
                  select Lump sum as the unit · Totals update automatically
                </p>
                {vendors.isError && (
                  <p role="alert" className="vc-hint">
                    Vendor directory unavailable.{' '}
                    <Button variant="ghost" onClick={vendors.refetch}>
                      Retry
                    </Button>
                  </p>
                )}
                <div className="inos-table-wrap vc-table-wrap" data-testid="trade-comparison-table">
                  <table className="vc-table" style={{ minWidth: tableMinWidth }}>
                    <thead>
                      <tr>
                        <th colSpan={4} className="vc-hint-th">
                          Pick a vendor to finalise. The finalised column is highlighted and can be
                          turned into a quotation.
                        </th>
                        {slots.map((slot) => {
                          const vendor = vendorAt(slot);
                          const picked =
                            Boolean(vendor) && active.finalised_vendor_id === vendor.id;
                          const complete = completeQuote(vendor);
                          const difference = complete ? quoteTotal(vendor) - lowest : null;
                          const percent =
                            difference !== null && lowest > 0
                              ? ((difference / lowest) * 100).toFixed(1)
                              : null;
                          const editing = editingSlot === slot;
                          return (
                            <th
                              key={slot}
                              colSpan={2}
                              scope="colgroup"
                              className={cx('vc-vh', picked && 'is-finalised')}
                            >
                              {vendor ? (
                                <div className="vc-vh-body">
                                  <div className="vc-vh-name-row">
                                    <span className="vc-vh-name" title={vendor.name}>
                                      {vendor.name || `Vendor ${slot + 1}`}
                                    </span>
                                    {picked && <span className="vc-badge">Finalised</span>}
                                  </div>
                                  <div
                                    className={cx(
                                      'vc-vh-delta',
                                      difference === 0 && 'is-lowest',
                                      difference > 0 && 'is-higher',
                                    )}
                                  >
                                    {difference === null
                                      ? 'Incomplete quote'
                                      : difference === 0
                                        ? 'Lowest'
                                        : `+${money(difference)}${
                                            percent !== null ? ` · ${percent}%` : ''
                                          }`}
                                  </div>
                                  <Button
                                    variant="secondary"
                                    className={cx('vc-finalise', picked && 'is-on')}
                                    disabled={saving || quotationPending}
                                    onClick={() => finaliseVendor(vendor)}
                                  >
                                    {picked ? '✓ Finalised vendor' : 'Finalise this vendor'}
                                  </Button>
                                  {picked && (
                                    <button
                                      type="button"
                                      className="vc-link"
                                      onClick={() =>
                                        editTrade(active.id, {
                                          finalised_vendor_id: '',
                                        })
                                      }
                                    >
                                      Clear finalisation
                                    </button>
                                  )}
                                  {picked && canCreateQuotation && (
                                    <Button
                                      size="sm"
                                      disabled={saving || quotationPending}
                                      onClick={() => makeQuotation(vendor, { confirm: true })}
                                      data-testid="vendor-create-quotation"
                                    >
                                      Create quotation
                                    </Button>
                                  )}
                                  <button
                                    type="button"
                                    className="vc-link"
                                    onClick={() => exportEstimate(vendor)}
                                    data-testid="vendor-estimate-export"
                                  >
                                    Export estimate (Excel)
                                  </button>
                                  <button
                                    type="button"
                                    className="vc-link"
                                    aria-expanded={editing}
                                    onClick={() => setEditingSlot(editing ? null : slot)}
                                  >
                                    {editing ? 'Done editing' : 'Edit vendor'}
                                  </button>
                                  {editing && (
                                    <div className="vc-vendor-edit">
                                      <Field label="Vendor">
                                        <SelectInput
                                          aria-label={`Select vendor ${slot + 1}`}
                                          value={vendor.custom ? '' : vendor.id}
                                          placeholder="Custom vendor"
                                          onChange={(e) =>
                                            selectVendor(vendor, e.target.value, slot)
                                          }
                                        >
                                          {vendor &&
                                            !vendor.custom &&
                                            !directory.some((v) => String(v.id) === vendor.id) && (
                                              <option value={vendor.id}>{vendor.name}</option>
                                            )}
                                          {directory
                                            .filter(
                                              (v) =>
                                                !active.vendors.some(
                                                  (a) =>
                                                    a.id === String(v.id) && a.id !== vendor?.id,
                                                ),
                                            )
                                            .map((v) => (
                                              <option key={v.id} value={v.id}>
                                                {v.name || v.company_name || v.business_name}
                                              </option>
                                            ))}
                                        </SelectInput>
                                      </Field>
                                      <Field label="Name">
                                        <TextInput
                                          aria-label={`Vendor ${slot + 1} name`}
                                          value={vendor.name}
                                          onChange={(e) =>
                                            editVendor(vendor.id, {
                                              name: e.target.value,
                                            })
                                          }
                                        />
                                      </Field>
                                      <Button
                                        variant="ghost"
                                        className="vc-danger"
                                        onClick={() => removeVendor(vendor)}
                                      >
                                        Remove vendor
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="vc-vh-body vc-vh-empty">
                                  <span className="vc-vh-empty-title">Vendor {slot + 1}</span>
                                </div>
                              )}
                            </th>
                          );
                        })}
                        <th rowSpan={2} aria-label="Item actions" />
                      </tr>
                      <tr>
                        <th scope="col" className="vc-no">
                          #
                        </th>
                        <th scope="col" className="vc-item-col">
                          Item
                        </th>
                        <th scope="col" className="vc-right vc-qty">
                          Qty
                        </th>
                        <th scope="col" className="vc-unit">
                          Unit
                        </th>
                        {slots.map((slot) => (
                          <Fragment key={slot}>
                            <th scope="col" className="vc-right">
                              Rate
                            </th>
                            <th scope="col" className="vc-right">
                              Amount
                            </th>
                          </Fragment>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {active.items.map((item, index) => {
                        const rates = active.vendors.flatMap((vendor) =>
                          vendor.items
                            .filter((line) => line.id === item.id && Number.isFinite(line.rate))
                            .map((line) => line.rate),
                        );
                        const lowRate = Math.min(...rates);
                        const highRate = Math.max(...rates);
                        const spread = lowRate < highRate;
                        return (
                          <tr key={item.id}>
                            <td className="vc-no">{index + 1}</td>
                            <td className="vc-item">
                              <TextArea
                                className="vc-cell-text"
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
                            <td className="vc-qty">
                              <TextInput
                                className="vc-cell-input vc-num"
                                aria-label={`Quantity ${index + 1}`}
                                type="number"
                                min="0"
                                step="any"
                                placeholder="—"
                                disabled={item.unit === LUMP_SUM_UNIT && item.quantity === null}
                                value={item.quantity ?? ''}
                                onChange={(e) =>
                                  editSharedItem(item.id, {
                                    quantity: e.target.value === '' ? null : Number(e.target.value),
                                  })
                                }
                              />
                            </td>
                            <td className="vc-unit">
                              <SelectInput
                                className="vc-cell-input vc-unit-select"
                                aria-label={`Unit ${index + 1}`}
                                placeholder="—"
                                value={item.unit ?? ''}
                                onChange={(e) => {
                                  const unit = e.target.value;
                                  editSharedItem(item.id, {
                                    unit,
                                    ...(unit === LUMP_SUM_UNIT ? { quantity: null } : {}),
                                  });
                                }}
                              >
                                {item.unit && !unitOptions.has(item.unit) && (
                                  <option value={item.unit}>{item.unit}</option>
                                )}
                                {Array.from(unitOptions, (unit) => (
                                  <option key={unit} value={unit}>
                                    {unit === LUMP_SUM_UNIT ? 'Lump sum' : unit}
                                  </option>
                                ))}
                              </SelectInput>
                            </td>
                            {slots.map((slot) => {
                              const vendor = vendorAt(slot);
                              const quote = vendor?.items.find((line) => line.id === item.id);
                              const isFinal =
                                Boolean(vendor) && active.finalised_vendor_id === vendor.id;
                              const tone =
                                spread && quote?.rate === lowRate
                                  ? 'vc-low-rate'
                                  : spread && quote?.rate === highRate
                                    ? 'vc-high-rate'
                                    : '';
                              const amount = quote ? quoteAmount(quote) : null;
                              return (
                                <Fragment key={slot}>
                                  <td className={cx('vc-rate', isFinal && 'vc-col-final', tone)}>
                                    <TextInput
                                      className="vc-cell-input vc-num"
                                      aria-label={`Rate ${index + 1} for ${vendor?.name || `Vendor ${slot + 1}`}`}
                                      type="number"
                                      step="any"
                                      placeholder="—"
                                      disabled={!vendor}
                                      value={quote?.rate ?? ''}
                                      onChange={(e) =>
                                        editRate(
                                          vendor,
                                          item.id,
                                          e.target.value === '' ? null : Number(e.target.value),
                                        )
                                      }
                                    />
                                  </td>
                                  <td className={cx('vc-amt', isFinal && 'vc-col-final')}>
                                    {amount === null ? '—' : num(amount)}
                                  </td>
                                </Fragment>
                              );
                            })}
                            <td className="vc-act">
                              <Button
                                variant="ghost"
                                aria-label={`Remove item ${index + 1}`}
                                onClick={() => removeSharedItem(item.id)}
                              >
                                ×
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                      <tr className="vc-add-row">
                        <td colSpan={totalColumns}>
                          <Button variant="ghost" onClick={addSharedItem}>
                            + Add item
                          </Button>
                        </td>
                      </tr>
                    </tbody>
                    <tfoot>
                      <tr className="vc-grand">
                        <td colSpan={4}>Total amount</td>
                        {slots.map((slot) => {
                          const vendor = vendorAt(slot);
                          return (
                            <td key={slot} colSpan={2}>
                              {vendor ? money(quoteTotal(vendor)) : '—'}
                            </td>
                          );
                        })}
                        <td />
                      </tr>
                      <tr className="vc-notes-row">
                        <td colSpan={4}>Vendor notes</td>
                        {slots.map((slot) => {
                          const vendor = vendorAt(slot);
                          return (
                            <td key={slot} colSpan={2}>
                              <TextArea
                                className="vc-note-box"
                                aria-label={`Vendor ${slot + 1} notes`}
                                rows={2}
                                maxLength={10000}
                                disabled={!vendor}
                                placeholder={vendor ? 'Add note…' : ''}
                                value={vendor?.notes || ''}
                                onChange={(e) =>
                                  editVendor(vendor.id, {
                                    notes: e.target.value,
                                  })
                                }
                              />
                            </td>
                          );
                        })}
                        <td />
                      </tr>
                    </tfoot>
                  </table>
                </div>
                <div className="vc-footer">
                  <span className="vc-save-state">{saveState}</span>
                  <div className="vc-footer-actions">
                    <Button
                      variant="ghost"
                      className="vc-danger"
                      onClick={() => removeTrade(active)}
                    >
                      Remove trade
                    </Button>
                    <Button
                      variant="secondary"
                      disabled={!previousTrade}
                      onClick={() => openTrade(previousTrade.id)}
                    >
                      Previous trade
                    </Button>
                    <Button disabled={!nextTrade} onClick={() => openTrade(nextTrade.id)}>
                      {nextTrade ? `Next trade: ${nextTrade.name} →` : 'Next trade'}
                    </Button>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      )}
      {workspaceTab === 'history' && (
        <div role="tabpanel" aria-label="Version History">
          {initialSheet ? (
            <VersionHistory
              type="vendor-comparison"
              id={initialSheet.id}
              title="Version & approval history"
            />
          ) : (
            <Card title="Version & approval history">
              <p className="inos-hint">
                Save this vendor comparison to start its version and approval history.
              </p>
            </Card>
          )}
        </div>
      )}
    </Page>
  );
}
