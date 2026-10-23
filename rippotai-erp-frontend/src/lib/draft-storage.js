const PREFIX = "bc.draft.";
const LEGACY_PREFIXES = [
  "bc.site-recce",
  "bc.scope-of-work",
  "bc.plan-of-action",
  "bc.budget-estimate.draft",
  "bc.payment-schedule",
  "bc.material-requirement",
];

// Remove all device drafts, including old drafts whose owner is unknown.
export function clearLocalDrafts(storage = localStorage) {
  const keys = Array.from({ length: storage.length }, (_, i) => storage.key(i));
  for (const key of keys) {
    if (
      key &&
      (key.startsWith(PREFIX) ||
        LEGACY_PREFIXES.some(
          (prefix) => key === prefix || key.startsWith(`${prefix}.`),
        ))
    ) {
      storage.removeItem(key);
    }
  }
}

export function createDraftStorage(
  userId,
  storage = localStorage,
  session = sessionStorage,
) {
  // Bind writes to this session so pending timers cannot restore drafts after
  // logout or write the previous user's form into a newly signed-in account.
  const token = session.getItem("bc_token");
  const active = () => {
    try {
      return Boolean(
        userId &&
        token &&
        session.getItem("bc_token") === token &&
        JSON.parse(session.getItem("bc_user"))?.id === userId,
      );
    } catch {
      return false;
    }
  };
  const keyFor = (key) => `${PREFIX}${encodeURIComponent(userId)}.${key}`;
  return {
    getItem: (key) => (active() ? storage.getItem(keyFor(key)) : null),
    setItem: (key, value) => {
      if (active()) storage.setItem(keyFor(key), value);
    },
    removeItem: (key) => {
      if (active()) storage.removeItem(keyFor(key));
    },
  };
}
