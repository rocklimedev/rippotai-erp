export const POLLING_IDLE_MS = 60_000;

// One activity timer shared by all polling components. This never extends the
// authenticated session: only the existing auth activity handler does that.
export function createPollingActivity({ window, document, now = Date.now,
  setTimeout = globalThis.setTimeout, clearTimeout = globalThis.clearTimeout }) {
  const subscribers = new Set();
  const events = ['pointerdown', 'pointermove', 'keydown', 'touchstart', 'scroll', 'focus'];
  let lastActivity = now();
  let active = !document.hidden;
  let timer;
  const emit = () => {
    const next = !document.hidden && now() - lastActivity < POLLING_IDLE_MS;
    if (next !== active) {
      active = next;
      subscribers.forEach(listener => listener());
    }
  };
  const schedule = () => {
    clearTimeout(timer);
    timer = undefined;
    emit();
    if (active) timer = setTimeout(schedule, Math.max(1, POLLING_IDLE_MS - (now() - lastActivity)));
  };
  const activity = () => {
    if (document.hidden) return;
    lastActivity = now();
    if (!active) schedule();
  };
  const visibility = () => {
    if (!document.hidden) lastActivity = now();
    schedule();
  };
  return {
    getSnapshot: () => active,
    subscribe(listener) {
      subscribers.add(listener);
      if (subscribers.size === 1) {
        lastActivity = now();
        events.forEach(event => window.addEventListener(event, activity, { passive: true }));
        document.addEventListener('visibilitychange', visibility);
        schedule();
      }
      return () => {
        subscribers.delete(listener);
        if (!subscribers.size) {
          events.forEach(event => window.removeEventListener(event, activity));
          document.removeEventListener('visibilitychange', visibility);
          clearTimeout(timer);
          timer = undefined;
        }
      };
    },
    canPoll: () => !document.hidden && now() - lastActivity < POLLING_IDLE_MS,
  };
}
