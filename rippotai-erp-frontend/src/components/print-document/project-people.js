import { useGetProjectDocumentPeopleQuery } from '../../api/projects/project.api';

export function useProjectPeople(projectId) {
  const { currentData } = useGetProjectDocumentPeopleQuery(projectId, { skip: !projectId });
  return currentData || { architect: '', lead: '' };
}
