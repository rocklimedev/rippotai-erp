import { useId, useState } from 'react';
import { toast } from 'sonner';
import { useSetFrontendRouteRestrictionMutation } from '@/api/users/rbac.api';
import { useAuth } from '@/context/AuthContext';
import { Button, Field, TextInput } from '@/components/inos';

export default function FrontendRouteRestrictions({ groupName, paths, access, canAssign, loading }) {
  const { user, refresh } = useAuth();
  const searchId = useId();
  const [search, setSearch] = useState('');
  const [save, { isLoading: saving }] = useSetFrontendRouteRestrictionMutation();
  const roleId = access?.role.id;
  const restrictions = new Set(access?.role.frontend_route_restrictions ?? []);
  const editable = canAssign && Boolean(roleId) && !access.protected;
  const busy = saving || loading;
  const query = search.trim().toLowerCase();
  const visiblePaths = paths.filter((path) => path.includes(query));

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
    <section className="space-y-3 p-4" aria-label={`${groupName} frontend routes`}>
      <Field label="Search frontend routes" htmlFor={searchId}>
        <TextInput
          id={searchId}
          type="search"
          placeholder={`Search ${groupName} routes…`}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </Field>
      {access?.protected && <p>Administrator roles keep their frontend route access.</p>}
      <div className="inos-table-wrap">
        <table className="inos-table" aria-label={`${groupName} route restrictions`}>
          <thead>
            <tr>
              <th scope="col">Frontend route</th>
              <th scope="col">Route restriction</th>
              {editable && <th scope="col">Action</th>}
            </tr>
          </thead>
          <tbody>
            {visiblePaths.map((path) => {
              const blocked = restrictions.has(path);
              return (
                <tr key={path}>
                  <td><code>{path}</code></td>
                  <td>{!access ? 'Unavailable' : blocked ? 'Blocked' : 'None'}</td>
                  {editable && (
                    <td>
                      <Button
                        type="button"
                        variant="secondary"
                        disabled={busy}
                        aria-label={blocked ? `Remove restriction for ${path}` : `Block ${path}`}
                        onClick={() => void change(path, !blocked)}
                      >
                        {blocked ? 'Remove restriction' : 'Block route'}
                      </Button>
                    </td>
                  )}
                </tr>
              );
            })}
            {!visiblePaths.length && (
              <tr><td colSpan={editable ? 3 : 2}>No routes match your search.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
