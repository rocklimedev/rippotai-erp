import { Op, type WhereOptions } from 'sequelize';

type Phase = {
  id: string;
  phase_code: string;
};

type PhaseDocument = {
  projectPhaseId?: string | null;
  phaseCode?: string | null;
};

export function belongsToDocumentPhase(
  type: PhaseDocument,
  phase: Phase,
): boolean {
  return type.projectPhaseId
    ? type.projectPhaseId === phase.id
    : type.phaseCode === phase.phase_code;
}

export function documentPhaseWhere(phases: Phase[]): WhereOptions {
  return {
    [Op.or]: [
      { projectPhaseId: { [Op.in]: phases.map((phase) => phase.id) } },
      {
        projectPhaseId: null,
        phaseCode: { [Op.in]: phases.map((phase) => phase.phase_code) },
      },
    ],
  };
}
