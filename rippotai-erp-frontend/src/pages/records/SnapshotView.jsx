// Read-only render of a saved earlier version of a flow document
// (document_snapshots: the main row + its child rows). Opened in a new tab
// from "Open vN ↗" in the version history.
import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, EmptyState, Page, PageHeader, prettyStatus } from '@/components/inos';
import { useLazyGetDocRevisionQuery } from '@/api/doc-flow/doc-flow.api';
import {
  docCode,
  docMeta,
  fmtDay,
  projectLabel,
  viewPath,
} from '@/components/record-context/codes';
import { useRecordContext } from '@/components/record-context/useRecordInfo';
import {
  customColumnIndex,
  procurementColumnOrder,
  SHEET_COLUMNS,
} from '@/components/procurement-sheet/columns';
import { customValuesOf, itemSheet, sheetsOf } from '@/components/procurement-sheet/sheets';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import '@/components/record-context/record-context.css';

const HIDDEN = /(^id$|_id$|Id$|^password|token|signature_url$|^deleted_at$|^storage_filename$)/;
const label = (k) => prettyStatus(k.replace(/_/g, ' '));

function show(v) {
  if (v == null || v === '') return '—';
  if (typeof v === 'boolean') return v ? 'Yes' : 'No';
  if (typeof v === 'object') return JSON.stringify(v);
  const s = String(v);
  if (/^\d{4}-\d{2}-\d{2}(T|\s|$)/.test(s)) return fmtDay(s) || s;
  if (s.startsWith('[') || s.startsWith('{')) {
    try {
      return JSON.stringify(JSON.parse(s), null, 1).slice(0, 2000);
    } catch {
      return s;
    }
  }
  return s;
}

function Fields({ row }) {
  const keys = Object.keys(row || {}).filter((k) => !HIDDEN.test(k));
  return (
    <div className="inos-table-wrap">
      <table className="inos-table">
        <tbody>
          {keys.map((k) => (
            <tr key={k}>
              <th style={{ width: 240 }}>{label(k)}</th>
              <td style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{show(row[k])}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Rows({ rows }) {
  const keys = [...new Set(rows.flatMap((r) => Object.keys(r)))]
    .filter((k) => !HIDDEN.test(k) && !/^(created_at|updated_at|createdAt|updatedAt)$/.test(k))
    .slice(0, 10);
  return (
    <div className="inos-table-wrap">
      <table className="inos-table">
        <thead>
          <tr>
            {keys.map((k) => (
              <th key={k}>{label(k)}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.id || i}>
              {keys.map((k) => (
                <td key={k}>{show(r[k])}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const procurementItemKeys = [
  ...Object.keys(SHEET_COLUMNS).filter((key) => key !== 'material'),
  'materialId',
  'sheetName',
  'isTotalAreaManual',
  'customValues',
];

function normalizeProcurementItem(item) {
  return Object.fromEntries(
    Object.entries(item).map(([key, value]) => [
      key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase()),
      value,
    ]),
  );
}

function procurementItemKey(item) {
  const values = [...customValuesOf(item)];
  while (values.length && (values.at(-1) == null || values.at(-1) === '')) values.pop();
  return JSON.stringify(
    procurementItemKeys.map((key) => {
      if (key === 'customValues') return values;
      const value = item[key];
      if (key === 'isTotalAreaManual') return Boolean(Number(value));
      if (value == null || value === '') return null;
      if (/Area$|^(serialNo|quantity|price|amount)$/.test(key)) return Number(value);
      return value;
    }),
  );
}

function ProcurementItems({ snapshot, comparison }) {
  const previous = new Map();
  for (const item of snapshot.material_procurement_items ?? []) {
    const key = procurementItemKey(normalizeProcurementItem(item));
    previous.set(key, (previous.get(key) ?? 0) + 1);
  }
  const materials = new Map(
    (comparison?.materials ?? []).map((material) => [material.id, material]),
  );
  const items = (comparison?.items ?? [])
    .map(normalizeProcurementItem)
    .filter((item) => {
      const key = procurementItemKey(item);
      const count = previous.get(key) ?? 0;
      if (count) previous.set(key, count - 1);
      return count === 0;
    })
    .map((item) => ({
      ...item,
      customValues: customValuesOf(item),
      materialMaster: item.materialMaster ?? materials.get(item.materialId),
    }));
  const sheets = sheetsOf({
    sheets: comparison?.sheets ?? snapshot.material_procurements?.sheets,
    items,
  });
  const groups = new Map();
  for (const item of items) {
    const name = itemSheet(item, sheets);
    if (!groups.has(name)) groups.set(name, []);
    groups.get(name).push(item);
  }
  const categories = [...new Set([...sheets.map((sheet) => sheet.name), ...groups.keys()])].filter(
    (name) => groups.has(name),
  );

  return (
    <Card title="Material Procurement Items" className="rc-card">
      {categories.length ? (
        <Tabs defaultValue={categories[0]} className="min-w-0">
          <div className="overflow-x-auto p-1">
            <TabsList aria-label="Material procurement categories">
              {categories.map((name) => (
                <TabsTrigger key={name} value={name}>
                  {name}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
          {categories.map((name) => {
            const sheet = sheets.find((entry) => entry.name === name);
            const columns = procurementColumnOrder(sheet);
            const rows = groups.get(name);
            return (
              <TabsContent key={name} value={name}>
                <div className="inos-table-wrap">
                  <table className="inos-table">
                    <thead>
                      <tr>
                        {columns.map((key) => (
                          <th key={key}>
                            {SHEET_COLUMNS[key] ?? sheet.customFields[customColumnIndex(key)]}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rows
                        .sort((a, b) => a.serialNo - b.serialNo)
                        .map((item) => (
                          <tr key={item.id}>
                            {columns.map((key) => (
                              <td key={key}>
                                {show(
                                  key === 'material'
                                    ? (item.materialMaster?.name ?? item.materialId)
                                    : key.startsWith('custom-')
                                      ? item.customValues[customColumnIndex(key)]
                                      : item[key],
                                )}
                              </td>
                            ))}
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </TabsContent>
            );
          })}
        </Tabs>
      ) : (
        <p className="rc-empty">No material procurement items were updated.</p>
      )}
    </Card>
  );
}

export default function SnapshotView() {
  const { type, snapshotId } = useParams();
  const [load, { data, isLoading, isError, error }] = useLazyGetDocRevisionQuery();
  useEffect(() => {
    load({ type, snapshotId });
  }, [load, type, snapshotId]);
  const { ctx } = useRecordContext(type, data?.entity_id);
  const meta = docMeta(type);
  const tables = Object.entries(data?.data ?? {});
  const [main, ...children] = tables;
  const code = ctx ? docCode(ctx.number) : null;
  const current = viewPath(type, data?.entity_id, ctx?.project?.id);
  return (
    <Page>
      <PageHeader
        crumbs={[
          { label: meta.label, to: meta.list },
          ...(current ? [{ label: code || meta.label, to: current }] : []),
          { label: `v${data?.version ?? ''}` },
        ]}
        title={`${code || meta.label} · v${data?.version ?? '…'}`}
        info={[
          type === 'procurement-sheet' ? 'Item changes (read-only)' : 'Saved copy (read-only)',
          ctx?.project ? `Project: ${projectLabel(ctx.project)}` : null,
          data?.created_at ? `Replaced ${fmtDay(data.created_at)}` : null,
        ]
          .filter(Boolean)
          .join(' · ')}
      />
      {isLoading ? (
        <Card>
          <p className="rc-empty">Loading…</p>
        </Card>
      ) : isError ? (
        <Card>
          <EmptyState
            title="Version unavailable"
            text={error?.data?.message || 'It may have been removed or you may not have access.'}
          />
        </Card>
      ) : type === 'procurement-sheet' && data?.data ? (
        <ProcurementItems
          key={data.id}
          snapshot={data.data}
          comparison={data.procurementComparison}
        />
      ) : main ? (
        <>
          <Card title={meta.label} className="rc-card">
            <Fields row={main[1]} />
          </Card>
          {children
            .filter(([, rows]) => Array.isArray(rows) && rows.length)
            .map(([table, rows]) => (
              <Card key={table} title={label(table)} flush className="rc-card">
                <Rows rows={rows} />
              </Card>
            ))}
        </>
      ) : null}
    </Page>
  );
}
