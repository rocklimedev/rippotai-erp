export const rowsOf = (data) => Array.isArray(data) ? data : data?.items || data?.data || [];
export const fileDate = (row) => row.createdAt || row.created_at || "";
const newest = (a, b) => new Date(fileDate(b)) - new Date(fileDate(a)) || String(b.id).localeCompare(String(a.id));

export function evidenceEntries(kind, data, documentTypeId) {
  const rows = rowsOf(data).filter((row) => !documentTypeId || row.documentTypeId === documentTypeId);
  if (kind === "DOCUMENT") {
    const seen = new Set();
    return [...rows].sort(newest).map((record) => {
      const group = record.documentTypeId || record.id;
      const latest = !seen.has(group);
      seen.add(group);
      return { key: `${record.id}:${record.storageFilename || record.updatedAt || record.updated_at || ""}`,
        record, file: record, latest, title: record.title, status: record.status,
        path: `/documents/${record.id}/download` };
    });
  }
  return rows.flatMap((record) => [...(record.revisions || [])].sort(newest).map((file, index) => ({
    key: `${record.id}:${file.id}`, record, file, latest: index === 0,
    title: `${record.drawingNumber} · ${record.title} · Rev ${file.revision}`,
    status: index === 0 ? record.status : file.status,
    path: `/drawings/${record.id}/revisions/${file.id}/download`,
  })));
}

export function canApproveEvidence(entry, permissions = []) {
  return !!(permissions.includes("documents:approve") && entry?.latest &&
    (entry.file.storageFilename || entry.file.url) &&
    !["approved", "Approved", "archived", "Superseded"].includes(entry.status) &&
    !entry.record.isLocked);
}
