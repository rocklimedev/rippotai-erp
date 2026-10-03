import React, { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";

import {
  Pencil,
  Eye,
  FileDown,
  Loader2,
  Check,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";

import {
  Page,
  PageHeader,
  Button,
  Segmented,
  EmptyState,
} from "@/components/inos";
import "@/components/forms/crm-forms.css";

import ProjectDetailSection from "../../components/business-proposal/ProjectDetailSection";
import ScopeOfWorkSection from "../../components/business-proposal/ScopeOfWorkSection";
import PlanOfActionSection from "../../components/business-proposal/PlanOfActionSection";
import BudgetEstimateSection from "../../components/business-proposal/BudgetEstimateSection";
import PaymentScheduleSection from "../../components/business-proposal/PaymentScheduleSection";
import NextStepsSection from "../../components/business-proposal/NextStepsSection";
import ProposalDocument from "../../components/business-proposal/ProposalDocument";
import { DocumentPreview, downloadDocumentPdf, pdfFileName } from "@/components/print-document";
import ProposalReadinessCheck from "../../components/business-proposal/ProposalReadinessCheck";
import {
  useGetBudgetEstimatesQuery,
  useGetBudgetEstimateQuery,
  useUpdateBudgetEstimateMutation,
} from "../../api/documents/budget-estimates.api";
import {
  useGetProjectByIdQuery,
  useUpdateProjectMutation,
} from "../../api/projects/project.api";
import {
  useGetScopeOfWorkByProjectQuery,
  useUpdateScopeOfWorkMutation,
} from "../../api/documents/scope-of-work.api";
import {
  useFindPlanOfActionsByProjectQuery,
  useGetPlanOfActionQuery,
  useReplacePlanOfActionPhasesMutation,
  useUpdatePlanOfActionMutation,
} from "../../api/documents/plan-of-actions.api";
import {
  useGetPaymentSchedulesQuery,
  useGetPaymentScheduleQuery,
  useUpdatePaymentScheduleMutation,
} from "../../api/documents/payment-schedules.api";

import {
  mapProjectToProjectDetail,
  mapProjectDetailToUpdatePayload,
  mapScopeOfWorkFromApi,
  mapScopeOfWorkToUpdatePayload,
  mapPlanOfActionFromApi,
  mapPlanOfActionToPhasesPayload,
  mapPlanOfActionToUpdatePayload,
  mapPaymentScheduleFromApi,
  mapPaymentScheduleToUpdatePayload,
  mapBudgetEstimateFromApi,
} from "../../lib/proposalMappers";
// Budget Estimate has no real endpoint yet — intentionally kept mocked.
import { fetchNextSteps } from "../../lib/mockApi";


/* ============================================================
   TABS
============================================================ */

const TABS = [
  {
    value: "edit",
    label: "Edit",
    icon: Pencil,
  },
  {
    value: "preview",
    label: "Preview",
    icon: Eye,
  },
];

/* ============================================================
   WIZARD STEPS
============================================================ */

const WIZARD_STEPS = [
  {
    id: 0,
    key: "readiness",
    label: "Readiness",
    shortLabel: "Ready",
  },
  {
    id: 1,
    key: "projectDetail",
    label: "Project Details",
    shortLabel: "Project",
  },
  {
    id: 2,
    key: "scopeOfWork",
    label: "Scope of Work",
    shortLabel: "Scope",
  },
  {
    id: 3,
    key: "planOfAction",
    label: "Plan of Action",
    shortLabel: "Plan",
  },
  {
    id: 4,
    key: "budgetEstimate",
    label: "Budget Estimate",
    shortLabel: "Budget",
  },
  {
    id: 5,
    key: "paymentSchedule",
    label: "Payment Schedule",
    shortLabel: "Payment",
  },
  {
    id: 6,
    key: "nextSteps",
    label: "Next Steps",
    shortLabel: "Next",
  },
];

/* ============================================================
   EMPTY PROPOSAL
============================================================ */

const EMPTY_PROPOSAL = {
  projectDetail: null,
  scopeOfWork: null,
  planOfAction: null,
  budgetEstimate: null,
  paymentSchedule: null,
  nextSteps: null,
};

/* ============================================================
   STEP PROGRESS
============================================================ */

function ProposalProgress({ currentStep, onStepChange }) {
  return (
    <nav className="crmf-stepper" aria-label="Proposal steps">
      {WIZARD_STEPS.map((item, index) => {
        const completed = currentStep > item.id;
        const active = currentStep === item.id;
        const clickable = item.id <= currentStep;

        return (
          <React.Fragment key={item.key}>
            <button
              type="button"
              disabled={!clickable}
              aria-current={active ? "step" : undefined}
              onClick={() => {
                if (clickable) {
                  onStepChange(item.id);
                }
              }}
              className={[
                "crmf-step",
                active ? "is-active" : "",
                completed ? "is-done" : "",
              ].join(" ")}
            >
              <span className="crmf-nav__dot">
                {completed ? <Check aria-label="Done" /> : item.id + 1}
              </span>
              {item.label}
            </button>

            {index < WIZARD_STEPS.length - 1 && (
              <span className="crmf-step__line" aria-hidden />
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}

/* ============================================================
   STEP HEADER
============================================================ */

function StepHeader({ step, title, description }) {
  return (
    <div className="inos-form-section__head">
      <span className="inos-form-section__step">{step}</span>
      <div>
        <h2 className="inos-form-section__title">{title}</h2>
        <p className="inos-form-section__desc">
          Step {step} of 6 · {description}
        </p>
      </div>
    </div>
  );
}

/* ============================================================
   STEP FOOTER
============================================================ */

function StepFooter({
  onBack,
  onNext,
  nextLabel = "Continue",
  nextDisabled = false,
  backDisabled = false,
  saving = false,
}) {
  return (
    <div className="inos-form-actions">
      <span className="inos-form-actions__note">
        {saving ? "Saving changes…" : "Changes are saved when you continue"}
      </span>
      <div className="inos-form-actions__buttons">
        <Button variant="ghost" icon={ArrowLeft} onClick={onBack} disabled={backDisabled}>
          Back
        </Button>
        <Button
          variant="primary"
          iconRight={saving ? undefined : ArrowRight}
          onClick={onNext}
          disabled={nextDisabled || saving}
        >
          {saving ? "Saving…" : nextLabel}
        </Button>
      </div>
    </div>
  );
}

const CRUMBS = [
  { label: "CRM", to: "/crm" },
  { label: "Forms" },
  { label: "Business proposal" },
];

/* ============================================================
   MAIN COMPONENT
============================================================ */

export default function ProposalBuilder({ projectId: projectIdProp }) {
  // Project comes from the route prop, else ?project_id=, else none (the
  // readiness step then asks for one). The old "demo-project" default
  // fired API calls for a project that doesn't exist.
  const [searchParams] = useSearchParams();
  const initialProjectId =
    projectIdProp ||
    searchParams.get("project_id") ||
    searchParams.get("projectId") ||
    "";
  // `projectId` has to be state, not a plain prop passthrough — the
  // readiness check's project selector calls `onProjectChange(id)`,
  // and without local state there was nothing for that call to update,
  // so picking a project from the dropdown appeared to do nothing.
  const [projectId, setProjectId] = useState(initialProjectId);

  // If the page is mounted under a route like
  // /projects/:projectId/proposal-builder and the route param itself
  // changes, keep internal state in sync with it. This does NOT run
  // when the in-page selector calls setProjectId directly — only when
  // the prop coming from the parent/router actually changes.
  useEffect(() => {
    setProjectId(initialProjectId);
  }, [initialProjectId]);

  const [step, setStep] = useState(0);
  const [view, setView] = useState("edit");

  const [savingStep, setSavingStep] = useState(false);
  const [exporting, setExporting] = useState(false);

  const [proposal, setProposal] = useState(EMPTY_PROPOSAL);

  // Sections that still don't come from a real endpoint.
  const [mockLoading, setMockLoading] = useState(true);

  const documentRef = useRef(null);

  /* ============================================================
     REAL DATA — READS
  ============================================================ */

  const {
    data: projectData,
    isFetching: projectFetching,
    isLoading: projectLoading,
  } = useGetProjectByIdQuery(projectId, { skip: !projectId });

  const {
    data: scopeOfWorkData,
    isFetching: scopeFetching,
    isLoading: scopeLoading,
  } = useGetScopeOfWorkByProjectQuery(projectId, { skip: !projectId });

  const {
    data: planOfActionList,
    isFetching: planFetching,
    isLoading: planLoading,
  } = useFindPlanOfActionsByProjectQuery(projectId, { skip: !projectId });

  const {
    data: paymentScheduleList,
    isFetching: paymentFetching,
    isLoading: paymentLoading,
  } = useGetPaymentSchedulesQuery(
    { project_id: projectId },
    { skip: !projectId },
  );
  const {
    data: budgetEstimateList,
    isFetching: budgetFetching,
    isLoading: budgetLoading,
  } = useGetBudgetEstimatesQuery(projectId, {
    skip: !projectId,
  });
  // Assumes a single active Plan of Action / Payment Schedule per
  // project. If a project can have more than one (e.g. drafts and a
  // published version side by side), filter by status here instead
  // of taking the first entry.
  // List endpoints don't always honour the project filter — match the project explicitly.
  const ofProject = (list) =>
    Array.isArray(list)
      ? list.find((d) => (d?.projectId ?? d?.project_id ?? d?.project?.id) === projectId) || null
      : null;
  const planOfActionDoc = ofProject(planOfActionList);
  const paymentScheduleDoc = ofProject(paymentScheduleList);
  const budgetEstimateDoc = ofProject(budgetEstimateList);

  // Full documents for the printable proposal (the same data their own PDFs use).
  const { data: planFull } = useGetPlanOfActionQuery(planOfActionDoc?.id, { skip: !planOfActionDoc?.id });
  const { data: scheduleFull } = useGetPaymentScheduleQuery(paymentScheduleDoc?.id, { skip: !paymentScheduleDoc?.id });
  const { data: budgetFull } = useGetBudgetEstimateQuery(budgetEstimateDoc?.id, { skip: !budgetEstimateDoc?.id });
  /* ============================================================
     REAL DATA — WRITES
  ============================================================ */

  const [updateProject] = useUpdateProjectMutation();
  const [updateScopeOfWork] = useUpdateScopeOfWorkMutation();
  const [replacePlanOfActionPhases] = useReplacePlanOfActionPhasesMutation();
  const [updatePlanOfAction] = useUpdatePlanOfActionMutation();
  const [updatePaymentSchedule] = useUpdatePaymentScheduleMutation();
  const [updateBudgetEstimate] = useUpdateBudgetEstimateMutation();
  /* ============================================================
     LOAD MOCKED SECTIONS (Budget Estimate, Next Steps)
  ============================================================ */

  useEffect(() => {
    let cancelled = false;

    const loadNextSteps = async () => {
      try {
        const nextSteps = await fetchNextSteps(projectId);

        if (cancelled) return;

        setProposal((previous) => ({
          ...previous,
          nextSteps,
        }));
      } catch (error) {
        console.error("Failed to load next steps:", error);

        if (!cancelled) {
          setProposal((previous) => ({
            ...previous,
            nextSteps: previous.nextSteps || null,
          }));
        }
      }
    };

    if (projectId) {
      loadNextSteps();
    }

    return () => {
      cancelled = true;
    };
  }, [projectId]);
  /* ============================================================
     MERGE REAL DATA INTO PROPOSAL AS IT ARRIVES
  ============================================================ */

  useEffect(() => {
    if (!projectData) return;

    setProposal((previous) => ({
      ...previous,
      projectDetail: mapProjectToProjectDetail(projectData),
    }));
  }, [projectData]);

  useEffect(() => {
    if (!scopeOfWorkData) return;

    setProposal((previous) => ({
      ...previous,
      scopeOfWork: mapScopeOfWorkFromApi(scopeOfWorkData),
    }));
  }, [scopeOfWorkData]);

  useEffect(() => {
    if (!planOfActionDoc) return;

    setProposal((previous) => ({
      ...previous,
      planOfAction: mapPlanOfActionFromApi(planOfActionDoc),
    }));
  }, [planOfActionDoc]);

  useEffect(() => {
    if (!paymentScheduleDoc) return;

    setProposal((previous) => ({
      ...previous,
      paymentSchedule: mapPaymentScheduleFromApi(paymentScheduleDoc),
    }));
  }, [paymentScheduleDoc]);
  useEffect(() => {
    if (!budgetEstimateDoc) return;

    setProposal((previous) => ({
      ...previous,
      budgetEstimate: mapBudgetEstimateFromApi(budgetEstimateDoc),
    }));
  }, [budgetEstimateDoc]);
  /* ============================================================
     RESET TO READINESS WHEN SWITCHING PROJECT
  ============================================================ */

  useEffect(() => {
    setProposal(EMPTY_PROPOSAL);
    setStep(0);
    setView("edit");
  }, [projectId]);

  /* ============================================================
     PATCH SECTION (local edits before saving)
  ============================================================ */

  const patch = (key) => (value) => {
    setProposal((previous) => ({
      ...previous,
      [key]: value,
    }));
  };

  /* ============================================================
     SAVE HANDLERS — ONE PER REAL SECTION
  ============================================================ */

  const saveProjectDetail = async () => {
    if (!projectId || !proposal.projectDetail) return;

    try {
      setSavingStep(true);

      await updateProject({
        id: projectId,
        ...mapProjectDetailToUpdatePayload(proposal.projectDetail),
      }).unwrap();
    } catch (error) {
      console.error("Failed to save project detail:", error);
    } finally {
      setSavingStep(false);
    }
  };

  const saveScopeOfWork = async () => {
    if (!scopeOfWorkData?.id || !proposal.scopeOfWork) return;

    try {
      setSavingStep(true);

      await updateScopeOfWork({
        id: scopeOfWorkData.id,
        body: mapScopeOfWorkToUpdatePayload(proposal.scopeOfWork),
      }).unwrap();
    } catch (error) {
      console.error("Failed to save scope of work:", error);
    } finally {
      setSavingStep(false);
    }
  };

  const savePlanOfAction = async () => {
    if (!planOfActionDoc?.id || !proposal.planOfAction) return;

    try {
      setSavingStep(true);

      await replacePlanOfActionPhases({
        id: planOfActionDoc.id,
        phases: mapPlanOfActionToPhasesPayload(proposal.planOfAction),
      }).unwrap();

      await updatePlanOfAction({
        id: planOfActionDoc.id,
        ...mapPlanOfActionToUpdatePayload(proposal.planOfAction),
      }).unwrap();
    } catch (error) {
      console.error("Failed to save plan of action:", error);
    } finally {
      setSavingStep(false);
    }
  };

  const savePaymentSchedule = async () => {
    if (!paymentScheduleDoc?.id || !proposal.paymentSchedule) return;

    try {
      setSavingStep(true);

      await updatePaymentSchedule({
        id: paymentScheduleDoc.id,
        ...mapPaymentScheduleToUpdatePayload(proposal.paymentSchedule),
      }).unwrap();
    } catch (error) {
      console.error("Failed to save payment schedule:", error);
    } finally {
      setSavingStep(false);
    }
  };
  const saveBudgetEstimate = async () => {
    if (!budgetEstimateDoc?.id || !proposal.budgetEstimate) return;

    try {
      setSavingStep(true);

      const budget = proposal.budgetEstimate;

      await updateBudgetEstimate({
        id: budgetEstimateDoc.id,
        body: {
          title: budget.title,
          client_name: budget.clientName,
          location: budget.location,
        },
      }).unwrap();
    } catch (error) {
      console.error("Failed to save budget estimate:", error);
    } finally {
      setSavingStep(false);
    }
  };
  /* ============================================================
     READINESS
  ============================================================ */

  const requiredSections = [
    "projectDetail",
    "scopeOfWork",
    "planOfAction",
    "budgetEstimate",
    "paymentSchedule",
  ];

  const missingSections = requiredSections.filter((key) => !proposal[key]);

  const isReady = missingSections.length === 0;

  /* ============================================================
     DOWNLOAD PDF
  ============================================================ */

  const handleDownload = async () => {
    if (exporting) return;

    const required = [
      ["projectDetail", proposal.projectDetail],
      ["scopeOfWork", proposal.scopeOfWork],
      ["planOfAction", proposal.planOfAction],
      ["budgetEstimate", proposal.budgetEstimate],
      ["paymentSchedule", proposal.paymentSchedule],
      ["nextSteps", proposal.nextSteps],
    ];

    const missing = required.filter(([, value]) => !value).map(([key]) => key);

    if (missing.length > 0) {
      console.error("Proposal is incomplete:", missing);

      alert(`The proposal is missing: ${missing.join(", ")}`);

      return;
    }

    try {
      setExporting(true);

      /*
       * Preview needs to be mounted before
       * we attempt to generate the PDF.
       */
      setView("preview");

      await new Promise((resolve) => {
        requestAnimationFrame(() => {
          requestAnimationFrame(resolve);
        });
      });

      // let the A4 pages measure and paginate
      await new Promise((resolve) => setTimeout(resolve, 700));

      const documentElement = documentRef.current;

      if (!documentElement) {
        throw new Error("Proposal document was not mounted.");
      }

      const projectName =
        projectData?.name || proposal.projectDetail?.projectName || "Project";

      await downloadDocumentPdf(
        documentElement,
        pdfFileName("Business-Proposal", projectName, 1),
        { title: `Business Proposal — ${projectName}` },
      );
    } catch (error) {
      console.error("Proposal PDF generation failed:", error);

      alert("Could not generate the PDF. Check the console for details.");
    } finally {
      setExporting(false);
    }
  };

  /* ============================================================
     LOADING
  ============================================================ */

  const checking =
    projectLoading ||
    projectFetching ||
    scopeLoading ||
    scopeFetching ||
    planLoading ||
    planFetching ||
    paymentLoading ||
    paymentFetching ||
    budgetLoading ||
    budgetFetching;
  const loading = checking && step === 0 && !proposal.projectDetail;

  if (loading) {
    return (
      <Page>
        <PageHeader crumbs={CRUMBS} title="Business proposal" />
        <EmptyState icon={Loader2} title="Checking project data…" />
      </Page>
    );
  }

  /* ============================================================
     STEP 0 - READINESS
  ============================================================ */

  if (step === 0) {
    return (
      <Page>
        <PageHeader
          crumbs={CRUMBS}
          title="Business proposal"
          subtitle="Pull the brief, scope, plan, budget and payment schedule into one client-ready proposal PDF."
        />

        <div className="inos-card" style={{ padding: "8px 10px" }}>
          <ProposalProgress currentStep={0} onStepChange={setStep} />
        </div>

        <ProposalReadinessCheck
          projectId={projectId}
          proposal={proposal}
          checking={checking}
          onProjectChange={setProjectId}
          onContinue={() => {
            if (!isReady) return;

            setStep(1);
            setView("edit");
          }}
        />
      </Page>
    );
  }

  /* ============================================================
     STEP 1+ BUILDER
  ============================================================ */

  return (
    <Page>
      <PageHeader
        crumbs={CRUMBS}
        title={proposal.projectDetail?.projectName || "Business proposal"}
        subtitle="Review each part of the proposal, then preview and download the PDF."
        actions={
          <>
            <Button
              variant="ghost"
              onClick={() => {
                setStep(0);
                setView("edit");
              }}
            >
              Readiness
            </Button>

            <Segmented
              value={view}
              onChange={setView}
              options={TABS.map((t) => ({ value: t.value, label: t.label, icon: t.icon }))}
            />

            <Button
              variant="primary"
              icon={exporting ? undefined : FileDown}
              onClick={handleDownload}
              disabled={exporting}
            >
              {exporting ? "Generating…" : "Download PDF"}
            </Button>
          </>
        }
      />

      {view === "edit" && (
        <div className="inos-card" style={{ padding: "8px 10px" }}>
          <ProposalProgress currentStep={step} onStepChange={setStep} />
        </div>
      )}

      {/* ========================================================
          EDIT MODE
      ======================================================== */}

      {view === "edit" && (
        <main className="inos-form" style={{ maxWidth: 920, width: "100%", margin: "0 auto" }}>
          {/* ====================================================
              STEP 1 - PROJECT DETAILS
          ==================================================== */}

          {step === 1 && (
            <>
              <StepHeader
                step={1}
                title="Project Details"
                description="Review and confirm the project information that will appear in the proposal."
              />

              <ProjectDetailSection
                data={proposal.projectDetail}
                onChange={patch("projectDetail")}
              />

              <StepFooter
                onBack={() => setStep(0)}
                onNext={async () => {
                  await saveProjectDetail();
                  setStep(2);
                }}
                saving={savingStep}
              />
            </>
          )}

          {/* ====================================================
              STEP 2 - SCOPE OF WORK
          ==================================================== */}

          {step === 2 && (
            <>
              <StepHeader
                step={2}
                title="Scope of Work"
                description="Review the scope of work that has been prepared for this project."
              />

              <ScopeOfWorkSection
                data={proposal.scopeOfWork}
                onChange={patch("scopeOfWork")}
              />

              <StepFooter
                onBack={() => setStep(1)}
                onNext={async () => {
                  await saveScopeOfWork();
                  setStep(3);
                }}
                saving={savingStep}
              />
            </>
          )}

          {/* ====================================================
              STEP 3 - PLAN OF ACTION
          ==================================================== */}

          {step === 3 && (
            <>
              <StepHeader
                step={3}
                title="Plan of Action"
                description="Review the planned phases, activities and actions for this project."
              />

              <PlanOfActionSection
                data={proposal.planOfAction}
                onChange={patch("planOfAction")}
              />

              <StepFooter
                onBack={() => setStep(2)}
                onNext={async () => {
                  await savePlanOfAction();
                  setStep(4);
                }}
                saving={savingStep}
              />
            </>
          )}

          {/* ====================================================
              STEP 4 - BUDGET ESTIMATE (mocked — no real endpoint yet)
          ==================================================== */}

          {step === 4 && (
            <>
              <StepHeader
                step={4}
                title="Budget Estimate"
                description="Review the estimated project cost and commercial breakdown before continuing."
              />

              <BudgetEstimateSection
                data={proposal.budgetEstimate}
                onChange={patch("budgetEstimate")}
              />

              <StepFooter
                onBack={() => setStep(3)}
                onNext={async () => {
                  await saveBudgetEstimate();
                  setStep(5);
                }}
                saving={savingStep}
              />
            </>
          )}

          {/* ====================================================
              STEP 5 - PAYMENT SCHEDULE
          ==================================================== */}

          {step === 5 && (
            <>
              <StepHeader
                step={5}
                title="Payment Schedule"
                description="Review the payment milestones and commercial terms that will be included in the proposal."
              />

              <PaymentScheduleSection
                data={proposal.paymentSchedule}
                onChange={patch("paymentSchedule")}
              />

              <StepFooter
                onBack={() => setStep(4)}
                onNext={async () => {
                  await savePaymentSchedule();
                  setStep(6);
                }}
                saving={savingStep}
              />
            </>
          )}

          {/* ====================================================
              STEP 6 - NEXT STEPS (mocked — no real endpoint yet)
          ==================================================== */}

          {step === 6 && (
            <>
              <StepHeader
                step={6}
                title="Next Steps"
                description="Define what happens after the proposal is presented and accepted."
              />

              <NextStepsSection
                data={proposal.nextSteps}
                onChange={patch("nextSteps")}
                projectId={projectId}
              />

              <StepFooter
                onBack={() => setStep(5)}
                onNext={() => setView("preview")}
                nextLabel="Review Proposal"
              />
            </>
          )}
        </main>
      )}

      {/* ========================================================
          PREVIEW MODE
      ======================================================== */}

      {view === "preview" && (
        <>
          <div className="inos-form-actions" style={{ position: "static", boxShadow: "none" }}>
            <span className="inos-form-actions__note">
              Proposal preview — this is exactly what the PDF will contain.
            </span>
            <div className="inos-form-actions__buttons">
              <Button
                variant="secondary"
                icon={Pencil}
                onClick={() => {
                  setView("edit");
                  setStep(6);
                }}
              >
                Back to editing
              </Button>
            </div>
          </div>

          <main>
            <DocumentPreview>
              <ProposalDocument
                ref={documentRef}
                project={projectData || {}}
                scope={scopeOfWorkData}
                plan={planFull}
                budget={budgetFull}
                schedule={scheduleFull}
                nextSteps={proposal.nextSteps}
              />
            </DocumentPreview>
          </main>
        </>
      )}
    </Page>
  );
}
