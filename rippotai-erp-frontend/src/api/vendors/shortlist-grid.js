// Apply a confirmed save without requesting an older copy of the grid mid-save.
export function applySavedShortlistEntry(grid, saved) {
  const block = grid.grid?.find(item => item.trade === saved.trade);
  const row = block?.rows?.find(item => item.working_type === saved.working_type);
  if (!row) return;
  for (const field of Object.keys(row)) {
    if (field in saved) row[field] = saved[field];
  }
  row.entry_id = saved.id;
  row.name_of_vendor = saved.name_of_vendor?.trim() || saved.vendor?.name || saved.material?.name || null;
}

// Keep successive edits to one row in order while other rows can save independently.
export function createShortlistSaveQueue() {
  const pending = new Map();
  return (key, save) => {
    const previous = pending.get(key) || Promise.resolve();
    const next = previous.catch(() => {}).then(save);
    pending.set(key, next);
    const cleanup = () => { if (pending.get(key) === next) pending.delete(key); };
    next.then(cleanup, cleanup);
    return next;
  };
}
