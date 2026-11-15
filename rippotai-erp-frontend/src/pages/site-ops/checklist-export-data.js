// Export the values currently displayed in the inspection form, including
// edits not yet saved. This does not change the persisted checklist.
export function checklistWithDrafts(checklist, drafts = {}) {
  if (!checklist) return checklist;
  return {
    ...checklist,
    checklist_items: (checklist.checklist_items || []).map((item) => {
      const draft = drafts[item.id];
      if (!draft) return item;
      return {
        ...item,
        status: draft.status,
        is_accepted: draft.accepted === 'yes' ? true : draft.accepted === 'no' ? false : null,
        remarks: draft.remarks,
        inspection_date: draft.date || null,
      };
    }),
  };
}
