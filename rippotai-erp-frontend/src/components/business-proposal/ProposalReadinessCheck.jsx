// components/business-proposal/ProposalReadinessCheck.jsx

import React, { useMemo } from "react";

import {
  CheckCircle2,
  XCircle,
  ArrowRight,
  Loader2,
  FileText,
  ClipboardList,
  ListChecks,
  Wallet,
  CreditCard,
  Building2,
  ChevronDown,
} from "lucide-react";

import { useGetProjectsQuery } from "../../api/project.api";

const CHECKS = [
  {
    key: "projectDetail",
    label: "Project Data",
    description:
      "Basic project information, client, location and project team.",
    icon: FileText,
    path: (projectId) => `/projects/${projectId}/edit`,
  },
  {
    key: "scopeOfWork",
    label: "Scope of Work",
    description: "Scope items and categories must be completed.",
    icon: ClipboardList,
    path: (projectId) => `/projects/${projectId}/scope-of-work`,
  },
  {
    key: "planOfAction",
    label: "Plan of Action",
    description: "Project phases and planned actions must be completed.",
    icon: ListChecks,
    path: (projectId) => `/projects/${projectId}/plan-of-action`,
  },
  {
    key: "budgetEstimate",
    label: "Budget Estimate",
    description: "The project budget estimate must be available.",
    icon: Wallet,
    path: (projectId) => `/projects/${projectId}/budget-estimate`,
  },
  {
    key: "paymentSchedule",
    label: "Payment Schedule",
    description: "Payment milestones and terms must be configured.",
    icon: CreditCard,
    path: (projectId) => `/projects/${projectId}/payment-schedule`,
  },
];

export default function ProposalReadinessCheck({
  projectId,
  proposal,
  checking = false,
  onContinue,
  onProjectChange,
}) {
  /* ============================================================
     LOAD PROJECTS
  ============================================================ */

  const {
    data: projectsResponse,
    isLoading: projectsLoading,
    isFetching: projectsFetching,
    error: projectsError,
  } = useGetProjectsQuery();

  /* ============================================================
     NORMALIZE PROJECT LIST
  ============================================================ */

  const projects = useMemo(() => {
    if (Array.isArray(projectsResponse)) {
      return projectsResponse;
    }

    if (Array.isArray(projectsResponse?.data)) {
      return projectsResponse.data;
    }

    if (Array.isArray(projectsResponse?.projects)) {
      return projectsResponse.projects;
    }

    return [];
  }, [projectsResponse]);

  /* ============================================================
     SELECTED PROJECT
  ============================================================ */

  const selectedProject = useMemo(() => {
    return projects.find((project) => String(project.id) === String(projectId));
  }, [projects, projectId]);

  /* ============================================================
     HANDLE PROJECT CHANGE

     If the parent forgot to wire `onProjectChange`, selecting a
     project here would silently do nothing — the <select> would
     appear to "not respond" because its `value` is controlled by
     the `projectId` prop, which never changes. Warn loudly in that
     case instead of failing silently.
  ============================================================ */

  const handleProjectChange = (event) => {
    const nextProjectId = event.target.value;

    if (!nextProjectId) return;

    if (typeof onProjectChange !== "function") {
      console.warn(
        "ProposalReadinessCheck: onProjectChange was not provided, so selecting a project has no effect. " +
          "Make projectId stateful in the parent and pass a setter as onProjectChange.",
      );
      return;
    }

    onProjectChange(nextProjectId);
  };

  /* ============================================================
     LOADING
  ============================================================ */

  if (checking) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex items-center gap-3 text-[var(--muted)]">
          <Loader2 className="h-5 w-5 animate-spin" />

          <span>Checking project readiness…</span>
        </div>
      </div>
    );
  }

  /* ============================================================
     CHECK RESULTS
  ============================================================ */

  const results = CHECKS.map((check) => ({
    ...check,
    exists: Boolean(proposal?.[check.key]),
  }));

  const missing = results.filter((item) => !item.exists);

  const ready = missing.length === 0;

  /* ============================================================
     RENDER
  ============================================================ */

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      {/* ========================================================
          HEADER
      ======================================================== */}

      <div className="mb-8">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-[var(--ink-green)]">
            Step 0
          </span>

          <span className="text-sm text-[var(--muted)]">/</span>

          <span className="text-sm text-[var(--muted)]">Project readiness</span>
        </div>

        <h1 className="mt-2 text-2xl font-semibold text-[var(--foreground)]">
          Check Proposal Readiness
        </h1>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">
          Select the project for which you want to create the proposal. We will
          verify that all required project and commercial information has been
          completed.
        </p>
      </div>

      {/* ========================================================
          PROJECT SELECTOR
      ======================================================== */}

      <div className="mb-6 rounded-xl border border-[var(--stroke)] bg-white p-5">
        <div className="mb-3 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--ink-green)]/10 text-[var(--ink-green)]">
            <Building2 className="h-4 w-4" />
          </div>

          <div>
            <p className="text-sm font-semibold">Select project</p>

            <p className="text-xs text-[var(--muted)]">
              Choose the project you want to prepare a proposal for.
            </p>
          </div>
        </div>

        {/* SELECT */}

        <div className="relative">
          <select
            value={projectId || ""}
            onChange={handleProjectChange}
            disabled={projectsLoading || projectsFetching}
            className="h-11 w-full appearance-none rounded-lg border border-[var(--stroke)] bg-white px-3 pr-10 text-sm outline-none transition focus:border-[var(--ink-green)] focus:ring-2 focus:ring-[var(--ink-green)]/10 disabled:cursor-not-allowed disabled:bg-[var(--mist-soft)]"
          >
            <option value="">
              {projectsLoading ? "Loading projects…" : "Select a project"}
            </option>

            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name ||
                  project.projectName ||
                  project.title ||
                  `Project #${project.id}`}
              </option>
            ))}
          </select>

          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
        </div>

        {/* SELECTED PROJECT */}

        {selectedProject && (
          <div className="mt-3 flex items-center justify-between gap-3 rounded-lg bg-[var(--mist-soft)] px-3 py-2.5">
            <div className="min-w-0">
              <p className="truncate text-xs font-medium">
                {selectedProject.name ||
                  selectedProject.projectName ||
                  selectedProject.title ||
                  "Selected project"}
              </p>

              {selectedProject.client?.name && (
                <p className="mt-0.5 truncate text-[11px] text-[var(--muted)]">
                  Client: {selectedProject.client.name}
                </p>
              )}
            </div>

            {projectsFetching && (
              <Loader2 className="h-4 w-4 shrink-0 animate-spin text-[var(--muted)]" />
            )}
          </div>
        )}

        {/* API ERROR */}

        {projectsError && (
          <p className="mt-3 text-xs text-red-600">
            Unable to load projects. Please refresh the page and try again.
          </p>
        )}
      </div>

      {/* ========================================================
          NO PROJECT SELECTED
      ======================================================== */}

      {!projectId ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
          <div className="flex items-start gap-3">
            <AlertIcon />

            <div>
              <h2 className="text-sm font-semibold text-amber-900">
                Select a project to continue
              </h2>

              <p className="mt-1 text-sm leading-6 text-amber-800">
                Select a project above. We will then check whether its project
                data, scope, plan, budget and payment schedule are ready for
                proposal creation.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* ======================================================
              READINESS CHECKS
          ====================================================== */}

          <div className="overflow-hidden rounded-xl border border-[var(--stroke)] bg-white">
            {results.map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.key}
                  className="flex items-center justify-between gap-6 border-b border-[var(--stroke)] px-5 py-4 last:border-b-0"
                >
                  <div className="flex min-w-0 items-center gap-4">
                    {/* ICON */}

                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                        item.exists
                          ? "bg-green-50 text-green-600"
                          : "bg-red-50 text-red-600"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>

                    {/* TEXT */}

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold">{item.label}</p>

                        {item.exists ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                      </div>

                      <p className="mt-0.5 text-xs text-[var(--muted)]">
                        {item.description}
                      </p>
                    </div>
                  </div>

                  {/* ACTION */}

                  {!item.exists ? (
                    <a
                      href={item.path(projectId)}
                      className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-[var(--stroke)] px-3 py-2 text-xs font-medium transition hover:border-[var(--ink-green)] hover:bg-[var(--mist-soft)]"
                    >
                      Complete
                      <ArrowRight className="h-3.5 w-3.5" />
                    </a>
                  ) : (
                    <span className="shrink-0 text-xs font-medium text-green-600">
                      Completed
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* ======================================================
              MISSING
          ====================================================== */}

          {!ready && (
            <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-5">
              <div className="flex items-start gap-3">
                <AlertIcon />

                <div>
                  <h2 className="text-sm font-semibold text-amber-900">
                    Complete the missing project information
                  </h2>

                  <p className="mt-1 text-sm leading-6 text-amber-800">
                    This proposal cannot be generated yet. Complete the sections
                    marked above and return here to continue.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================
              READY
          ====================================================== */}

          {ready && (
            <div className="mt-6 flex items-center justify-between gap-5 rounded-xl border border-green-200 bg-green-50 p-5">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />

                <div>
                  <h2 className="text-sm font-semibold text-green-900">
                    Project is ready for proposal creation
                  </h2>

                  <p className="mt-1 text-sm text-green-800">
                    All required project information has been completed.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onContinue}
                className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-[var(--ink-green)] px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
              >
                Continue
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </>
      )}
    </main>
  );
}

/* ============================================================
   SMALL ALERT ICON
============================================================ */

function AlertIcon() {
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100">
      <XCircle className="h-4 w-4 text-amber-700" />
    </div>
  );
}
