import { useId } from 'react';
import { Button, Field, SelectInput } from '@/components/inos';
import { useGetUsersQuery } from '@/api/users/user.api';

const PRINCIPAL = 'Principal Architect';
const LEAD = 'Project Lead';

export default function ProjectCreationTeam({ members, onChange, disabled }) {
  const id = useId();
  const { data, isLoading, isError } = useGetUsersQuery({ is_active: true });
  const principal = members.find((member) => member.role_label === PRINCIPAL)?.user_id || '';
  const leads = members.filter((member) => member.role_label === LEAD).map((member) => member.user_id);
  const update = (principalId, leadIds) => onChange([
    ...(principalId ? [{ user_id: principalId, role_label: PRINCIPAL }] : []),
    ...leadIds.map((user_id, index) => ({
      user_id,
      role_label: LEAD,
      is_primary: index === 0,
    })),
  ]);
  const users = (Array.isArray(data) ? data : data?.data || [])
    .filter((user) => user.is_active !== false && user.role?.name?.toUpperCase() !== 'CLIENT');
  const options = (role, exclude) => users
    .filter((user) => !exclude.includes(user.id))
    .sort((a, b) => {
      const matches = (user) => user.role_label?.trim().toLowerCase() === role;
      return Number(matches(b)) - Number(matches(a)) || a.name.localeCompare(b.name);
    })
    .map((user) => (
      <option key={user.id} value={user.id}>
        {user.name}{user.role_label ? ` · ${user.role_label}` : ''}
      </option>
    ));
  const placeholder = isLoading ? 'Loading staff…' : isError ? 'Could not load staff' : null;

  return (
    <>
      <Field label="Principal Architect" htmlFor={`${id}-principal`} optional>
        <SelectInput
          id={`${id}-principal`}
          value={principal}
          disabled={disabled || isLoading || isError}
          onChange={(event) => update(event.target.value, leads)}
        >
          <option value="">{placeholder || 'Select Principal Architect'}</option>
          {options('principal architect', [])}
        </SelectInput>
      </Field>
      <Field label="Project Leads" htmlFor={`${id}-lead`} optional>
        <SelectInput
          id={`${id}-lead`}
          value=""
          disabled={disabled || isLoading || isError || users.length === leads.length}
          onChange={(event) => {
            if (event.target.value) update(principal, [...leads, event.target.value]);
          }}
        >
          <option value="">{placeholder || 'Add Project Lead'}</option>
          {options('project lead', leads)}
        </SelectInput>
        {leads.length > 0 && (
          <ul className="grid gap-2">
            {leads.map((leadId, index) => {
              const name = users.find((user) => user.id === leadId)?.name || 'Project Lead';
              return (
                <li key={leadId} className="flex items-center justify-between gap-2">
                  <span>{name}{index === 0 && ' · Primary lead'}</span>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    disabled={disabled}
                    aria-label={`Remove ${name}`}
                    onClick={() => update(principal, leads.filter((item) => item !== leadId))}
                  >
                    Remove
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </Field>
    </>
  );
}
