// Apply a confirmed save without requesting an older copy of the grid mid-save.
export function applySavedShortlistEntry(grid, saved) {
  const rows = grid.grid?.flatMap((block) => block.rows || []) || [];
  const block = grid.grid?.find((item) => item.trade === saved.trade);
  const row =
    rows.find((item) => saved.id && item.entry_id === saved.id) ||
    block?.rows?.find((item) => item.working_type === saved.working_type);
  if (!row) return;
  for (const field of Object.keys(row)) {
    if (field in saved) row[field] = saved[field];
  }
  if (saved.id) row.entry_id = saved.id;
  const linkedName = saved.vendor?.name || saved.material?.name;
  if (linkedName || "name_of_vendor" in saved) {
    row.name_of_vendor = saved.name_of_vendor?.trim() || linkedName || null;
  }
}

// Confirmed row values must remain visible while a background grid read settles.
// Responses can omit unchanged fields, so merge rather than resetting the row.
export function mergeSavedShortlistRow(row, saved) {
  const grid = { grid: [{ trade: saved.trade, rows: [{ ...row }] }] };
  applySavedShortlistEntry(grid, {
    trade: saved.trade,
    working_type: row.working_type,
    ...saved,
  });
  return grid.grid[0].rows[0];
}

export function reconcileConfirmedShortlistRows(confirmed, grid, shortlistId) {
  const remaining = { ...confirmed };
  for (const block of grid.grid || [])
    for (const row of block.rows || []) {
      const key = `${shortlistId}:${block.trade}:${row.working_type}`;
      const saved = confirmed[key];
      if (!saved) continue;
      const matches = Object.keys(saved).every((field) => {
        if (field === "estimate_value" || field === "quotation_value") {
          return saved[field] == null
            ? row[field] == null
            : row[field] != null && Number(row[field]) === Number(saved[field]);
        }
        return saved[field] === row[field];
      });
      if (matches) delete remaining[key];
    }
  return remaining;
}

// Keep successive edits to one row in order while other rows can save independently.
export function createShortlistSaveQueue() {
  const pending = new Map();
  return (key, save) => {
    const previous = pending.get(key) || Promise.resolve();
    const next = previous.catch(() => {}).then(save);
    pending.set(key, next);
    const cleanup = () => {
      if (pending.get(key) === next) pending.delete(key);
    };
    next.then(cleanup, cleanup);
    return next;
  };
}
