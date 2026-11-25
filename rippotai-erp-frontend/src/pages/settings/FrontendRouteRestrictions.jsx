import { useId, useState } from 'react';
import { Lock } from 'lucide-react';
import { toast } from 'sonner';
import { useSetFrontendRouteRestrictionMutation } from '@/api/users/rbac.api';
import { useAuth } from '@/context/AuthContext';
import { Field, TextInput } from '@/components/inos';

export default function FrontendRouteRestrictions({ groupName, paths, access, canAssign, loading }) {
  const { user, refresh } = useAuth();
  const searchId = useId();
  const hintId = useId();
  const [search, setSearch] = useState('');
  const [save, { isLoading: saving }] = useSetFrontendRouteRestrictionMutation();
  const roleId = access?.role.id;
  const restrictions = new Set(access?.role.frontend_route_restrictions ?? []);
  const editable = canAssign && Boolean(roleId) && !access.protected;
  const busy = saving || loading;
  const query = search.trim().toLowerCase();
  const visiblePaths = paths.filter((path) => path.toLowerCase().includes(query));

  async function change(pattern, restricted) {
    try {
      await save({ roleId, pattern, restricted }).unwrap();
      toast.success(restricted ? 'Route blocked' : 'Route restriction removed');
      if (user?.role_id === roleId) await refresh();
    } catch (error) {
      toast.error(error?.data?.message || 'Could not update the route restriction.');
    }
  }

  if (!paths.length) return null;

  return (
    <section
      className="rp-route-card"
      aria-label={`${groupName} frontend routes`}
      aria-describedby={hintId}
      aria-busy={busy || undefined}
    >
      <Field label="Search frontend routes" htmlFor={searchId}>
        <TextInput
          id={searchId}
          type="search"
          placeholder={`Search ${groupName} routes…`}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </Field>
      <p className="rp-route-hint" id={hintId}>
        {editable && 'Click a route to block or unblock it. A lock marks blocked routes.'}
        {access?.protected && 'Administrator roles keep their frontend route access.'}
        {!access && (loading ? 'Loading route restrictions…' : 'Route restrictions are unavailable.')}
        {access && !access.protected && !editable && 'A lock marks blocked routes.'}
      </p>
      {visiblePaths.length ? (
        <ul className="rp-route-tags" role="list">
          {visiblePaths.map((path) => {
            const blocked = restrictions.has(path);
            const tagContents = (
              <>
                {blocked && <Lock size={13} aria-hidden="true" />}
                <code>{path}</code>
              </>
            );
            return (
              <li key={path}>
                {editable ? (
                  <button
                    type="button"
                    className="rp-route-tag"
                    aria-label={`Block ${path}`}
                    aria-pressed={blocked}
                    aria-disabled={busy || undefined}
                    data-blocked={blocked}
                    onClick={() => {
                      if (!busy) void change(path, !blocked);
                    }}
                  >
                    {tagContents}
                  </button>
                ) : (
                  <span className="rp-route-tag" data-blocked={blocked}>
                    {tagContents}
                    {blocked && <span className="sr-only">Blocked</span>}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="rp-route-hint" role="status">No routes match your search.</p>
      )}
    </section>
  );
}
