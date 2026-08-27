/* ============================================================
   PROPOSAL MAPPERS

   Converts real backend payloads into the normalized shape
   expected by Proposal Builder sections.

   IMPORTANT:
   - Do not invent backend fields.
   - Preserve backend IDs wherever possible.
   - Support camelCase + snake_case.
   - Keep backend-specific assumptions isolated here.
============================================================ */

/* ============================================================
   HELPERS
============================================================ */

function valueOrEmpty(value) {
  return value == null ? "" : value;
}

function numberOrZero(value) {
  if (value == null || value === "") return 0;

  const number = Number(value);

  return Number.isFinite(number) ? number : 0;
}

function booleanValue(value) {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    return value.toLowerCase() === "true";
  }

  if (typeof value === "number") {
    return value === 1;
  }

  return false;
}

function getTeamMembers(project) {
  return Array.isArray(project?.team_members)
    ? project.team_members
    : Array.isArray(project?.teamMembers)
      ? project.teamMembers
      : [];
}

function getTeamMember(project, roleLabel) {
  return (
    getTeamMembers(project).find(
      (member) =>
        member?.role_label === roleLabel || member?.roleLabel === roleLabel,
    ) || null
  );
}

function getTeamMemberName(project, roleLabel) {
  return getTeamMember(project, roleLabel)?.user?.name || "";
}

/* ============================================================
   PROJECT DETAIL
============================================================ */

export function mapProjectToProjectDetail(project) {
  if (!project) return null;

  const client = project.client || null;

  const projectType = project.project_type || project.projectType || null;

  return {
    /* -----------------------------------------
       Basic project information
    ----------------------------------------- */

    projectName: valueOrEmpty(project.name),

    clientName: valueOrEmpty(client?.name),

    siteAddress: valueOrEmpty(project.site_location ?? project.siteLocation),

    projectType: valueOrEmpty(projectType?.name || projectType),

    brief: valueOrEmpty(project.description),

    /* -----------------------------------------
       Fields not currently provided by API
    ----------------------------------------- */

    unitType: "",

    workType: "",

    totalArea: "",

    builtUpArea: "",

    carpetArea: "",

    bedrooms: "",

    bathrooms: "",

    dateOfIssue: "",

    constraints: "",

    /* -----------------------------------------
       Project dates
    ----------------------------------------- */

    expectedCompletionDate: valueOrEmpty(
      project.expected_completion_date ?? project.expectedCompletionDate,
    ),

    /* -----------------------------------------
       Project team
    ----------------------------------------- */

    preparedBy: getTeamMemberName(project, "Project Lead"),

    reviewedBy: getTeamMemberName(project, "Principal Architect"),

    /* -----------------------------------------
       Internal metadata
    ----------------------------------------- */

    _projectId: project.id || null,

    _clientId: project.client_id || project.clientId || client?.id || null,

    _projectTypeId:
      project.project_type_id ||
      project.projectTypeId ||
      projectType?.id ||
      null,

    _priority: project.priority || null,

    _status: project.status || null,

    _progressPct: numberOrZero(project.progress_pct ?? project.progressPct),

    _timelineStatus: project.timeline_status ?? project.timelineStatus ?? null,

    _currentPhase: project.current_phase ?? project.currentPhase ?? null,

    _nextMilestoneName:
      project.next_milestone_name ?? project.nextMilestoneName ?? null,

    _approvedValue: numberOrZero(
      project.approved_value ?? project.approvedValue,
    ),
  };
}

/* ============================================================
   PROJECT DETAIL → UPDATE
============================================================ */

export function mapProjectDetailToUpdatePayload(pd) {
  if (!pd) return {};

  return {
    name: valueOrEmpty(pd.projectName),

    site_location: valueOrEmpty(pd.siteAddress),

    description: valueOrEmpty(pd.brief),
  };
}

/* ============================================================
   SCOPE OF WORK
============================================================ */

export function mapScopeOfWorkFromApi(doc) {
  if (!doc) return null;

  const rawItems = Array.isArray(doc.items) ? doc.items : [];

  /* -----------------------------------------
     Normalize child items
  ----------------------------------------- */

  const items = rawItems.map((item, index) => {
    const projectSpace = item.projectSpace || item.project_space || null;

    const scopeCategory = item.scopeCategory || item.scope_category || null;

    return {
      id: item.id || null,

      projectId:
        item.projectId ||
        item.project_id ||
        doc.projectId ||
        doc.project_id ||
        doc.id ||
        null,

      scopeOfWorkId:
        item.scopeOfWorkId || item.scope_of_work_id || doc.id || null,

      scopeOfWork: valueOrEmpty(item.scopeOfWork ?? item.scope_of_work),

      notes: valueOrEmpty(item.notes),

      projectSpaceId:
        item.projectSpaceId ??
        item.project_space_id ??
        projectSpace?.id ??
        null,

      scopeCategoryId:
        item.scopeCategoryId ??
        item.scope_category_id ??
        scopeCategory?.id ??
        null,

      isIncluded: booleanValue(item.isIncluded ?? item.is_included),

      isExcluded: booleanValue(item.isExcluded ?? item.is_excluded),

      sortOrder: item.sortOrder ?? item.sort_order ?? index + 1,

      projectSpace,

      scopeCategory,
    };
  });

  /* -----------------------------------------
     Included
  ----------------------------------------- */

  const included = items
    .filter((item) => item.isIncluded && !item.isExcluded)
    .filter((item) => item.scopeOfWork.trim() !== "")
    .map((item) => ({
      id: item.id,

      text: item.scopeOfWork,

      notes: item.notes,

      projectSpaceId: item.projectSpaceId,

      scopeCategoryId: item.scopeCategoryId,

      sortOrder: item.sortOrder,
    }));

  /* -----------------------------------------
     Excluded
  ----------------------------------------- */

  const notIncluded = items
    .filter((item) => item.isExcluded)
    .filter((item) => item.scopeOfWork.trim() !== "")
    .map((item) => ({
      id: item.id,

      text: item.scopeOfWork,

      notes: item.notes,

      projectSpaceId: item.projectSpaceId,

      scopeCategoryId: item.scopeCategoryId,

      sortOrder: item.sortOrder,
    }));

  /* -----------------------------------------
     Optional

     Backend currently does not provide
     optional scope items.
  ----------------------------------------- */

  const optional = Array.isArray(doc.optional) ? doc.optional : [];

  /* -----------------------------------------
     Group by Scope Category
  ----------------------------------------- */

  const categoryMap = {};

  items.forEach((item) => {
    const categoryId = item.scopeCategoryId || "general";

    const categoryName = item.scopeCategory?.name || "General";

    if (!categoryMap[categoryId]) {
      categoryMap[categoryId] = {
        id: categoryId,

        name: categoryName,

        items: [],
      };
    }

    categoryMap[categoryId].items.push({
      id: item.id,

      text: item.scopeOfWork,

      notes: item.notes,

      projectSpaceId: item.projectSpaceId,

      scopeCategoryId: item.scopeCategoryId,

      isIncluded: item.isIncluded,

      isExcluded: item.isExcluded,

      sortOrder: item.sortOrder,
    });
  });

  const disciplines = Object.values(categoryMap).map((category) => ({
    id: category.id,

    name: category.name,

    items: category.items.sort(
      (a, b) => (a.sortOrder || 0) - (b.sortOrder || 0),
    ),
  }));

  /* -----------------------------------------
     Return normalized SOW
  ----------------------------------------- */

  return {
    /* ---------------------------------------
       Document identity
    --------------------------------------- */

    id: doc.id || null,

    projectId: doc.projectId || doc.project_id || doc.project?.id || null,

    /* ---------------------------------------
       Scope document
    --------------------------------------- */

    scopeSummary: valueOrEmpty(doc.scopeSummary ?? doc.scope_summary),

    specificExclusions: valueOrEmpty(
      doc.specificExclusions ?? doc.specific_exclusions,
    ),

    notes: valueOrEmpty(doc.notes),

    projectMode: valueOrEmpty(doc.projectMode ?? doc.project_mode),

    version: doc.version ?? 1,

    status: doc.status || "DRAFT",

    /* ---------------------------------------
       Approval
    --------------------------------------- */

    preparedBy: doc.preparedBy ?? doc.prepared_by ?? null,

    reviewedBy: doc.reviewedBy ?? doc.reviewed_by ?? null,

    acceptedAt: doc.acceptedAt ?? doc.accepted_at ?? null,

    acceptedBy: doc.acceptedBy ?? doc.accepted_by ?? null,

    clientSignatureName: valueOrEmpty(
      doc.clientSignatureName ?? doc.client_signature_name,
    ),

    clientSignatureDate:
      doc.clientSignatureDate ?? doc.client_signature_date ?? null,

    /* ---------------------------------------
       Builder data
    --------------------------------------- */

    included,

    notIncluded,

    optional,

    disciplines,

    /* ---------------------------------------
       Original normalized items
    --------------------------------------- */

    items,

    /* ---------------------------------------
       Internal metadata
    --------------------------------------- */

    _id: doc.id || null,
  };
}

/* ============================================================
   SCOPE OF WORK → UPDATE PAYLOAD
============================================================ */

export function mapScopeOfWorkToUpdatePayload(sow) {
  if (!sow) return {};

  return {
    scopeSummary: valueOrEmpty(sow.scopeSummary),

    specificExclusions: valueOrEmpty(sow.specificExclusions),

    notes: valueOrEmpty(sow.notes),

    projectMode: valueOrEmpty(sow.projectMode) || "TURNKEY",

    items: Array.isArray(sow.items)
      ? sow.items.map((item, index) => ({
          ...(item.id
            ? {
                id: item.id,
              }
            : {}),

          projectId: item.projectId || sow.projectId || undefined,

          scopeOfWorkId: item.scopeOfWorkId || sow.id || undefined,

          scopeOfWork: valueOrEmpty(item.scopeOfWork),

          notes: valueOrEmpty(item.notes),

          projectSpaceId: item.projectSpaceId || null,

          scopeCategoryId: item.scopeCategoryId || null,

          isIncluded: booleanValue(item.isIncluded),

          isExcluded: booleanValue(item.isExcluded),

          sortOrder: index + 1,
        }))
      : [],
  };
}

/* ============================================================
   PLAN OF ACTION
============================================================ */

/* -----------------------------------------
   Duration parser
----------------------------------------- */

function parseDurationRange(duration) {
  if (!duration) {
    return {
      min: null,
      max: null,
    };
  }

  const text = String(duration);

  const match = text.match(/(\d+)\s*[–—-]\s*(\d+)/);

  if (!match) {
    return {
      min: null,
      max: null,
    };
  }

  return {
    min: Number(match[1]),

    max: Number(match[2]),
  };
}

/* -----------------------------------------
   POA phase mapper
----------------------------------------- */

function mapPlanPhase(phase, index) {
  if (!phase) {
    return null;
  }

  const link = phase.PlanOfActionPhase || phase.planOfActionPhase || {};

  const durationMin =
    link.duration_min_days ??
    link.durationMinDays ??
    phase.duration_min_days ??
    phase.durationMinDays ??
    null;

  const durationMax =
    link.duration_max_days ??
    link.durationMaxDays ??
    phase.duration_max_days ??
    phase.durationMaxDays ??
    null;

  let duration = "";

  if (durationMin != null && durationMax != null) {
    duration = `${durationMin}–${durationMax} days`;
  } else if (durationMin != null) {
    duration = `${durationMin} days`;
  } else if (durationMax != null) {
    duration = `${durationMax} days`;
  }

  return {
    code:
      phase.phase_code ||
      phase.phaseCode ||
      (phase.phase_number != null
        ? String(phase.phase_number).padStart(2, "0")
        : String(index + 1).padStart(2, "0")),

    name: phase.title || phase.name || "",

    detail: phase.description || phase.detail || "",

    parallel:
      link.parallel_work_note ||
      link.parallelWorkNote ||
      phase.parallel_work_note ||
      phase.parallelWorkNote ||
      phase.parallel ||
      "",

    duration,

    _phaseId:
      phase.id || phase.project_phase_id || phase.projectPhaseId || null,

    _linkId:
      link.id ||
      phase.plan_of_action_phase_id ||
      phase.planOfActionPhaseId ||
      null,
  };
}

/* -----------------------------------------
   POA intake
----------------------------------------- */

export function mapPlanOfActionFromApi(doc) {
  if (!doc) return null;

  const source = Array.isArray(doc) ? doc[0] : doc;

  if (!source) return null;

  /* -----------------------------------------
     Phases
  ----------------------------------------- */

  const phases = Array.isArray(source.phases)
    ? source.phases.map(mapPlanPhase).filter(Boolean)
    : [];

  /* -----------------------------------------
     Duration
  ----------------------------------------- */

  let overallProgramme =
    source.total_duration_label || source.totalDurationLabel || "";

  if (
    !overallProgramme &&
    source.total_duration_min_days != null &&
    source.total_duration_max_days != null
  ) {
    overallProgramme = `${source.total_duration_min_days}–${source.total_duration_max_days} days`;
  }

  if (
    !overallProgramme &&
    source.totalDurationMinDays != null &&
    source.totalDurationMaxDays != null
  ) {
    overallProgramme = `${source.totalDurationMinDays}–${source.totalDurationMaxDays} days`;
  }

  /* -----------------------------------------
     Return normalized builder shape
  ----------------------------------------- */

  return {
    phases,

    overallProgramme,

    note: valueOrEmpty(
      source.execution_description ?? source.executionDescription,
    ),

    title: valueOrEmpty(source.title),

    totalPhases:
      source.total_phases != null
        ? Number(source.total_phases)
        : source.totalPhases != null
          ? Number(source.totalPhases)
          : phases.length,

    totalDurationMinDays:
      source.total_duration_min_days != null
        ? Number(source.total_duration_min_days)
        : source.totalDurationMinDays != null
          ? Number(source.totalDurationMinDays)
          : null,

    totalDurationMaxDays:
      source.total_duration_max_days != null
        ? Number(source.total_duration_max_days)
        : source.totalDurationMaxDays != null
          ? Number(source.totalDurationMaxDays)
          : null,

    termsTemplateId: source.terms_template_id || source.termsTemplateId || null,

    termsTemplateVersionId:
      source.terms_template_version_id || source.termsTemplateVersionId || null,

    termsContentSnapshot:
      source.terms_content_snapshot || source.termsContentSnapshot || "",

    status: source.status || "DRAFT",

    version: source.version ?? 1,

    publishedAt: source.published_at || source.publishedAt || null,

    _id: source.id || null,

    _projectId: source.project_id || source.projectId || null,
  };
}

/* ============================================================
   PLAN OF ACTION → PHASE UPDATE
============================================================ */

export function mapPlanOfActionToPhasesPayload(poa) {
  if (!poa) return [];

  if (!Array.isArray(poa.phases)) {
    return [];
  }

  return poa.phases
    .filter((phase) => phase && phase._phaseId)
    .map((phase, index) => {
      const parsed = parseDurationRange(phase.duration);

      return {
        project_phase_id: phase._phaseId,

        duration_min_days: parsed.min,

        duration_max_days: parsed.max,

        parallel_work_note: valueOrEmpty(phase.parallel),

        sort_order: index + 1,
      };
    });
}

/* ============================================================
   PLAN OF ACTION → UPDATE
============================================================ */

export function mapPlanOfActionToUpdatePayload(poa) {
  if (!poa) return {};

  return {
    execution_description: valueOrEmpty(poa.note),
  };
}

/* ============================================================
   PAYMENT SCHEDULE
============================================================ */

export function mapPaymentScheduleFromApi(doc) {
  if (!doc) return null;

  const rawMilestones = Array.isArray(doc.milestones) ? doc.milestones : [];

  /* -----------------------------------------
     Milestones
  ----------------------------------------- */

  const milestones = [...rawMilestones]
    .sort(
      (a, b) =>
        (a.sortOrder ??
          a.sort_order ??
          a.milestoneNumber ??
          a.milestone_number ??
          0) -
        (b.sortOrder ??
          b.sort_order ??
          b.milestoneNumber ??
          b.milestone_number ??
          0),
    )
    .map((milestone, index) => ({
      code:
        milestone.milestoneCode || milestone.milestone_code || `M${index + 1}`,

      name: valueOrEmpty(milestone.title),

      description: valueOrEmpty(milestone.description),

      trigger: valueOrEmpty(
        milestone.releaseTrigger ?? milestone.release_trigger,
      ),

      share: numberOrZero(milestone.percentage),

      amount: numberOrZero(milestone.amount),

      status: milestone.status || "PENDING",

      dueDate: milestone.dueDate ?? milestone.due_date ?? null,

      invoiceDate: milestone.invoiceDate ?? milestone.invoice_date ?? null,

      paidAmount: numberOrZero(milestone.paidAmount ?? milestone.paid_amount),

      paidAt: milestone.paidAt ?? milestone.paid_at ?? null,

      milestoneNumber:
        milestone.milestoneNumber ?? milestone.milestone_number ?? index + 1,

      sortOrder: milestone.sortOrder ?? milestone.sort_order ?? index + 1,

      _id: milestone.id || null,

      _paymentScheduleId:
        milestone.paymentScheduleId ||
        milestone.payment_schedule_id ||
        doc.id ||
        null,
    }));

  /* -----------------------------------------
     Return normalized payment schedule
  ----------------------------------------- */

  return {
    milestones,

    totalContractValue: numberOrZero(
      doc.totalContractValue ?? doc.total_contract_value,
    ),

    gstRate: numberOrZero(doc.gstRate ?? doc.gst_rate),

    gstAmount: numberOrZero(doc.gstAmount ?? doc.gst_amount),

    totalPayable: numberOrZero(doc.totalPayable ?? doc.total_payable),

    /* ---------------------------------------
       Terms
    --------------------------------------- */

    termsTemplateId:
      doc.termsTemplateId ||
      doc.terms_template_id ||
      doc.termsTemplate?.id ||
      null,

    termsVersion:
      doc.termsVersion ??
      doc.terms_version ??
      doc.terms_template_version ??
      null,

    termsTemplate: doc.termsTemplate || doc.terms_template || null,

    /* ---------------------------------------
       Schedule status
    --------------------------------------- */

    title: valueOrEmpty(doc.title),

    status: doc.status || "DRAFT",

    acceptedByClient: booleanValue(
      doc.acceptedByClient ?? doc.accepted_by_client,
    ),

    acceptedAt: doc.acceptedAt ?? doc.accepted_at ?? null,

    /* ---------------------------------------
       Internal metadata
    --------------------------------------- */

    _id: doc.id || null,

    _projectId: doc.projectId || doc.project_id || doc.project?.id || null,
  };
}

/* ============================================================
   PAYMENT SCHEDULE → UPDATE
============================================================ */

export function mapPaymentScheduleToUpdatePayload(ps) {
  if (!ps) return {};

  return {
    milestones: Array.isArray(ps.milestones)
      ? ps.milestones.map((milestone, index) => ({
          ...(milestone._id
            ? {
                id: milestone._id,
              }
            : {}),

          milestoneCode: milestone.code || `M${index + 1}`,

          title: valueOrEmpty(milestone.name),

          description: valueOrEmpty(milestone.description),

          releaseTrigger: valueOrEmpty(milestone.trigger),

          percentage: numberOrZero(milestone.share),

          milestoneNumber: index + 1,

          sortOrder: index + 1,
        }))
      : [],
  };
}

/* ============================================================
   PAYMENT SCHEDULE LIST
============================================================ */

export function mapPaymentSchedulesFromApi(docs) {
  if (!Array.isArray(docs)) {
    return [];
  }

  return docs.filter(Boolean).map(mapPaymentScheduleFromApi).filter(Boolean);
}

/* ============================================================
   SELECT PAYMENT SCHEDULE
============================================================ */

export function selectProposalPaymentSchedule(schedules) {
  if (!Array.isArray(schedules) || !schedules.length) {
    return null;
  }

  /* -----------------------------------------
     1. Accepted
  ----------------------------------------- */

  const accepted = schedules.find(
    (schedule) => schedule.acceptedByClient === true,
  );

  if (accepted) {
    return accepted;
  }

  /* -----------------------------------------
     2. Schedule with milestones
  ----------------------------------------- */

  const withMilestones = schedules.find(
    (schedule) =>
      Array.isArray(schedule.milestones) && schedule.milestones.length > 0,
  );

  if (withMilestones) {
    return withMilestones;
  }

  /* -----------------------------------------
     3. First available schedule
  ----------------------------------------- */

  return schedules[0];
}
