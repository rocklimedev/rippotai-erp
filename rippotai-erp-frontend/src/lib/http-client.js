import { createAuthenticatedFetch } from './authenticated-fetch.js';
import { getSessionToken, clearStoredSession } from './session.js';
import { API_BASE_URL } from './config';

export const authenticatedFetch = createAuthenticatedFetch({
  apiBase: API_BASE_URL,
  getToken: getSessionToken,
  clearSession: clearStoredSession,
});
