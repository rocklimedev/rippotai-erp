// Cover lines "PRINCIPAL ARCHITECT" / "PROJECT LEAD" for the Word-template documents, taken from
// the project's team (Projects → Team): a member whose role (or job title) says "Principal",
// otherwise the lead architect; the project manager / project lead.
import { useGetProjectTeamQuery } from '../../api/projects/project.api';

const pick = (members, re) =>
  members.find((m) => re.test(m?.role_label || '') && m.is_primary) ||
  members.find((m) => re.test(m?.role_label || '')) ||
  null;

export function projectPeople(team) {
  const members = Array.isArray(team) ? team : team?.data || team?.members || [];
  const principal =
    members.find((m) => /principal/i.test(`${m?.role_label} ${m?.user?.job_title}`)) ||
    pick(members, /lead architect|architect/i);
  const lead = pick(members, /project (manager|lead)|project head/i);
  return {
    architect: principal?.user?.name || principal?.name || '',
    lead: lead?.user?.name || lead?.name || '',
  };
}

/** { architect, lead } names for a project id (empty strings while loading / when unset). */
export function useProjectPeople(projectId) {
  const { data } = useGetProjectTeamQuery(projectId, { skip: !projectId });
  return projectPeople(data);
}
