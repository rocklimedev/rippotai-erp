import { useId, useState } from 'react';
import { toast } from 'sonner';
import { useCreateDocumentTypeMutation } from '@/api/documents/document.api';
import { useGetProjectPhasesQuery } from '@/api/projects/project.api';
import { Button, Field, SelectInput, TextInput } from '@/components/inos';
import { usePermission } from '@/hooks/use-permission';
import { errMessage } from '@/pages/design-studio/drawingUtils';
import { asList } from './uploadDocs';

const ADD = 'add-new';

export default function UploadTypePicker({
  label, placeholder, types, value, onSelect, phaseCode, targetType,
  required, disabled, onCreatingChange, testId,
}) {
  const id = useId();
  const canCreate = usePermission('document-types', 'create');
  const [draft, setDraft] = useState(null);
  const [added, setAdded] = useState([]);
  const [createType, { isLoading: creating }] = useCreateDocumentTypeMutation();
  const options = [...types, ...added.filter((type) => !types.some((t) => t.id === type.id))];
  const phaseType = options.find((type) => type.phaseCode === phaseCode && type.projectPhaseId);
  const { data: phases, isFetching: loadingPhase } = useGetProjectPhasesQuery({}, {
    skip: draft === null || !!phaseType || !phaseCode,
  });
  const phase = asList(phases).find((p) => p.module === 'DOCUMENTS' && p.phase_code === phaseCode);
  const projectPhaseId = phaseType?.projectPhaseId || phase?.id;
  const isDrawing = targetType === 'DRAWING';
  const itemLabel = isDrawing ? 'drawing category' : 'document';

  const save = async () => {
    const name = draft.trim();
    if (!name || creating || disabled) return;
    if (!projectPhaseId) {
      toast.error('The document phase could not be found');
      return;
    }
    if (options.some((type) => type.phaseCode === phaseCode && type.name.toLowerCase() === name.toLowerCase())) {
      toast.error(`A ${itemLabel} with this name already exists in this phase`);
      return;
    }
    onCreatingChange?.(true);
    try {
      const response = await createType({
        name,
        code: `${phaseCode}_${crypto.randomUUID()}`,
        projectPhaseId,
        phaseCode,
        phaseName: phaseType?.phaseName || phase?.title || phaseCode,
        targetType,
        requirementType: 'OPTIONAL',
        requiresRevision: isDrawing,
        isActive: true,
      }).unwrap();
      const type = response?.data || response?.item || response?.result || response;
      setAdded((items) => [...items, type]);
      onSelect(type.id, type);
      setDraft(null);
    } catch (error) {
      toast.error(errMessage(error, `Could not add the ${itemLabel}`));
    } finally {
      onCreatingChange?.(false);
    }
  };

  return (
    <Field label={label} htmlFor={id} required={required} optional={required === false}>
      <SelectInput
        id={id}
        value={draft === null ? value : ADD}
        disabled={disabled || creating}
        data-testid={testId}
        onChange={(event) => {
          const next = event.target.value;
          setDraft(next === ADD ? '' : null);
          if (next !== ADD) onSelect(next, options.find((type) => type.id === next));
        }}
      >
        <option value="">{placeholder}</option>
        {options.map((type) => <option key={type.id} value={type.id}>{type.name}</option>)}
        {canCreate && phaseCode && <option value={ADD}>Add new {itemLabel}</option>}
        {draft !== null && !phaseCode && <option value={ADD} disabled>Add new {itemLabel}</option>}
      </SelectInput>
      {draft !== null && (
        <>
          <TextInput
            aria-label={`New ${itemLabel} name`}
            placeholder={`New ${itemLabel} name`}
            value={draft}
            maxLength={255}
            disabled={disabled || creating}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                if (!loadingPhase) save();
              }
            }}
          />
          <div className="flex gap-2">
            <Button type="button" size="sm" variant="soft" onClick={save} loading={creating}
              disabled={disabled || loadingPhase || !draft.trim()}>
              Add {itemLabel}
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setDraft(null)} disabled={disabled || creating}>
              Cancel
            </Button>
          </div>
        </>
      )}
    </Field>
  );
}
