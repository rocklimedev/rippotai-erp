// Shared by RTK Query, the axios compatibility facade, and export polling.
// Capture the token sent on a request so a late 401 cannot log out a newer login.
export function expireRequestSession(token, { getToken, clearSession }) {
  if (token && getToken() === token) clearSession();
}

export function createAuthenticatedFetch({ apiBase, getToken, clearSession, fetchImpl = (...args) => globalThis.fetch(...args) }) {
  const base = new URL(apiBase);
  return async (input, init) => {
    const request = new Request(input, { ...init, credentials: 'omit' });
    const url = new URL(request.url);
    const isApi = url.origin === base.origin &&
      (url.pathname === base.pathname || url.pathname.startsWith(`${base.pathname.replace(/\/$/, '')}/`));
    if (isApi && !request.headers.has('Authorization')) {
      const token = getToken();
      if (token) request.headers.set('Authorization', `Bearer ${token}`);
    }
    const sentToken = /^Bearer\s+(.+)$/i.exec(request.headers.get('Authorization') ?? '')?.[1];
    const response = await fetchImpl(request);
    if (isApi && response.status === 401) {
      expireRequestSession(sentToken, { getToken, clearSession });
    }
    return response;
  };
}

export function withSessionExpiry(rawBaseQuery, session) {
  return async (...args) => {
    const headers = new Headers(typeof args[0] === 'object' ? args[0]?.headers : undefined);
    const authorization = headers.get('Authorization');
    const token = authorization !== null
      ? /^Bearer\s+(.+)$/i.exec(authorization)?.[1]
      : session.getToken();
    const result = await rawBaseQuery(...args);
    if (result.error?.status === 401 || result.error?.originalStatus === 401) {
      expireRequestSession(token, session);
    }
    return result;
  };
}
