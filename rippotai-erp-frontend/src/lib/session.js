import { clearLocalDrafts } from './draft-storage.js';

export const ACCESS_LIFETIME_MS = 24 * 60 * 60 * 1000;
export const IDLE_TIMEOUT_MS = ACCESS_LIFETIME_MS;
let sessionChannel;

export function recordSessionActivity() {
  if (!getSessionToken()) return;
  const activity = String(Date.now());
  sessionStorage.setItem('bc_activity', activity);
  sessionChannel?.postMessage({
    type: 'activity',
    token: sessionStorage.getItem('bc_token'),
    activity,
  });
}

// Share credentials only between live, same-origin tabs, never on disk.
export function connectSessionTabs(channel, storage = sessionStorage, waitMs = 500) {
  let finish;
  let acceptingSession = true;
  const ready = new Promise((resolve) => {
    finish = resolve;
  });
  const timer = setTimeout(() => {
    acceptingSession = false;
    finish();
  }, waitMs);
  channel.onmessage = ({ data }) => {
    if (!data || typeof data !== 'object') return;
    if (data.type === 'request') {
      const token = getSessionToken(storage);
      if (token)
        channel.postMessage({ type: 'session', token, activity: storage.getItem('bc_activity') });
    } else if (data.type === 'session' && acceptingSession && !storage.getItem('bc_token')) {
      if (typeof data.token !== 'string' || typeof data.activity !== 'string') return;
      storage.setItem('bc_token', data.token);
      storage.setItem('bc_activity', data.activity);
      if (getSessionToken(storage)) {
        acceptingSession = false;
        clearTimeout(timer);
        finish();
      }
    } else if (data.type === 'activity' && data.token === storage.getItem('bc_token')) {
      const activity = Number(data.activity);
      if (
        Number.isFinite(activity) &&
        activity <= Date.now() &&
        activity > Number(storage.getItem('bc_activity'))
      ) {
        storage.setItem('bc_activity', String(activity));
      }
    } else if (data.type === 'logout' && data.token === storage.getItem('bc_token')) {
      acceptingSession = false;
      clearStoredSession(storage, localStorage, false);
    }
  };
  channel.postMessage({ type: 'request' });
  if (getSessionToken(storage)) {
    acceptingSession = false;
    clearTimeout(timer);
    finish();
  }
  return ready;
}

export function clearStoredSession(
  storage = sessionStorage,
  drafts = localStorage,
  broadcast = true,
) {
  const token = storage.getItem('bc_token');
  const hadSession = Boolean(token);
  storage.removeItem('bc_token');
  storage.removeItem('bc_user');
  storage.removeItem('bc_activity');
  clearLocalDrafts(drafts);
  if (hadSession && broadcast) sessionChannel?.postMessage({ type: 'logout', token });
  if (hadSession && typeof window !== 'undefined') {
    window.dispatchEvent(new Event('bc:session-ended'));
  }
}

export function persistIdentity(user, storage = sessionStorage) {
  // Connector queries need an ID. Roles and permissions stay in memory and
  // must be fetched again from the authenticated /auth/me endpoint on reload.
  storage.setItem('bc_user', JSON.stringify({ id: user.id }));
}

export function persistSession(token, user, storage = sessionStorage) {
  storage.setItem('bc_token', token);
  storage.setItem('bc_activity', String(Date.now()));
  persistIdentity(user, storage);
}

export function getSessionToken(storage = sessionStorage, now = Date.now()) {
  const token = storage.getItem('bc_token');
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    const expiry = payload.exp * 1000;
    const issued = payload.iat * 1000;
    const activity = Number(storage.getItem('bc_activity'));
    // iat is issued by the API's clock, not the browser's. A newly issued
    // token can appear to be in the future on a device whose clock is behind.
    // The API validates authenticity and session validity on /auth/me.
    if (
      !Number.isFinite(expiry) ||
      !Number.isFinite(issued) ||
      expiry <= now ||
      expiry <= issued ||
      expiry - issued > ACCESS_LIFETIME_MS ||
      !activity ||
      now - activity >= IDLE_TIMEOUT_MS
    )
      throw new Error('Expired session');
    return token;
  } catch {
    clearStoredSession(storage);
    return null;
  }
}

export function initializeSession() {
  // Never migrate an old, week-long token or cached authorization claims.
  if (localStorage.getItem('bc_token') || localStorage.getItem('bc_user')) {
    localStorage.removeItem('bc_token');
    localStorage.removeItem('bc_user');
    clearLocalDrafts();
  }
  getSessionToken();
  if (typeof window !== 'undefined' && typeof BroadcastChannel !== 'undefined') {
    sessionChannel = new BroadcastChannel('bc:session');
    return connectSessionTabs(sessionChannel);
  }
}
