import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { API_URL } from '@/lib/config';

export default function RouteAccess({ children }) {
  const { pathname, search } = useLocation();
  const routeKey = pathname + search;
  const [result, setResult] = useState(null);
  useEffect(() => {
    const abort = new AbortController();
    const check = async () => {
      try {
        const query = new URLSearchParams({ path: pathname });
        const locationQuery = new URLSearchParams(search);
        const projectId = locationQuery.get('project_id') ?? locationQuery.get('projectId');
        if (projectId) query.set('project_id', projectId);
        const response = await fetch(`${API_URL}/access/check?${query}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('bc_token')}` },
          signal: abort.signal,
        });
        const data = response.ok ? await response.json() : { allowed: false };
        if (!abort.signal.aborted) setResult({ routeKey, allowed: data.allowed === true });
      } catch {
        if (!abort.signal.aborted) setResult({ routeKey, allowed: false });
      }
    };
    check();
    const interval = setInterval(check, 30000);
    window.addEventListener('focus', check);
    return () => { abort.abort(); clearInterval(interval); window.removeEventListener('focus', check); };
  }, [pathname, search, routeKey]);
  if (result?.routeKey !== routeKey) return <div role="status" className="p-8">Checking access…</div>;
  if (!result.allowed) return <div role="alert" className="p-8"><h1 className="text-xl font-semibold">Access denied</h1><p>You do not have access to this page.</p></div>;
  return children;
}
