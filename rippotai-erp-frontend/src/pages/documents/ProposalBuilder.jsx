import React, { useEffect, useRef, useState } from "react";

import {
  Pencil,
  Eye,
  FileDown,
  Loader2,
  Building2,
  Check,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";

import { Tabs } from "../../components/ui/tabs";
import { Button } from "../../components/ui/Button";

import ProjectDetailSection from "../../components/business-proposal/ProjectDetailSection";
import ScopeOfWorkSection from "../../components/business-proposal/ScopeOfWorkSection";
import PlanOfActionSection from "../../components/business-proposal/PlanOfActionSection";
import BudgetEstimateSection from "../../components/business-proposal/BudgetEstimateSection";
import PaymentScheduleSection from "../../components/business-proposal/PaymentScheduleSection";
import NextStepsSection from "../../components/business-proposal/NextStepsSection";
import DocumentPreview from "../../components/business-proposal/DocumentPreview";
import ProposalReadinessCheck from "../../components/business-proposal/ProposalReadinessCheck";

import { fetchFullProposal } from "../../lib/mockApi";
import { exportProposalToPdf } from "../../lib/pdf";

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
    <div className="border-b border-[var(--stroke)] bg-white">
      <div className="mx-auto max-w-6xl px-6 py-4">
        <div className="flex items-center">
          {WIZARD_STEPS.map((item, index) => {
            const completed = currentStep > item.id;
            const active = currentStep === item.id;
            const clickable = item.id <= currentStep;

            return (
              <React.Fragment key={item.key}>
                <button
                  type="button"
                  disabled={!clickable}
                  onClick={() => {
                    if (clickable) {
                      onStepChange(item.id);
                    }
                  }}
                  className="group flex shrink-0 items-center gap-2 disabled:cursor-default"
                >
                  <span
                    className={[
                      "flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-all",
                      completed
                        ? "bg-[var(--ink-green)] text-white"
                        : active
                          ? "border-2 border-[var(--ink-green)] bg-white text-[var(--ink-green)]"
                          : "border border-[var(--stroke)] bg-white text-[var(--muted)]",
                    ].join(" ")}
                  >
                    {completed ? <Check className="h-4 w-4" /> : item.id + 1}
                  </span>

                  <span
                    className={[
                      "hidden text-xs font-medium lg:block",
                      active
                        ? "text-[var(--foreground)]"
                        : completed
                          ? "text-[var(--ink-green)]"
                          : "text-[var(--muted)]",
                    ].join(" ")}
                  >
                    {item.label}
                  </span>

                  <span
                    className={[
                      "text-xs font-medium lg:hidden",
                      active
                        ? "text-[var(--foreground)]"
                        : completed
                          ? "text-[var(--ink-green)]"
                          : "text-[var(--muted)]",
                    ].join(" ")}
                  >
                    {item.shortLabel}
                  </span>
                </button>

                {index < WIZARD_STEPS.length - 1 && (
                  <div
                    className={[
                      "mx-2 h-px min-w-3 flex-1 transition-colors",
                      currentStep > item.id
                        ? "bg-[var(--ink-green)]"
                        : "bg-[var(--stroke)]",
                    ].join(" ")}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   STEP HEADER
============================================================ */

function StepHeader({ step, title, description }) {
  return (
    <div className="mb-6">
      <p className="text-sm font-medium text-[var(--ink-green)]">
        Step {step} of 6
      </p>

      <h1 className="mt-1 text-2xl font-semibold tracking-tight text-[var(--foreground)]">
        {title}
      </h1>

      <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">
        {description}
      </p>
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
}) {
  return (
    <div className="mt-8 flex items-center justify-between border-t border-[var(--stroke)] pt-6">
      <Button variant="outline" onClick={onBack} disabled={backDisabled}>
        <ArrowLeft className="h-4 w-4" />
        Back
      </Button>

      <Button onClick={onNext} disabled={nextDisabled}>
        {nextLabel}
        <ArrowRight className="h-4 w-4" />
      </Button>
    </div>
  );
}

/* ============================================================
   MAIN COMPONENT
============================================================ */

export default function ProposalBuilder({ projectId = "demo-project" }) {
  const [step, setStep] = useState(0);
  const [view, setView] = useState("edit");

  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(true);
  const [exporting, setExporting] = useState(false);

  const [proposal, setProposal] = useState(EMPTY_PROPOSAL);

  const documentRef = useRef(null);

  /* ============================================================
     LOAD PROPOSAL
  ============================================================ */

  useEffect(() => {
    let cancelled = false;

    const loadProposal = async () => {
      try {
        setLoading(true);
        setChecking(true);

        const data = await fetchFullProposal(projectId);

        if (cancelled) return;

        setProposal({
          ...EMPTY_PROPOSAL,
          ...data,
        });

        /*
         * Always start from the readiness check
         * when switching to another project.
         */
        setStep(0);
        setView("edit");
      } catch (error) {
        console.error("Failed to load proposal:", error);

        if (!cancelled) {
          setProposal(EMPTY_PROPOSAL);
          setStep(0);
          setView("edit");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
          setChecking(false);
        }
      }
    };

    loadProposal();

    return () => {
      cancelled = true;
    };
  }, [projectId]);

  /* ============================================================
     PATCH SECTION
  ============================================================ */

  const patch = (key) => (value) => {
    setProposal((previous) => ({
      ...previous,
      [key]: value,
    }));
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

      const documentElement = documentRef.current;

      if (!documentElement) {
        throw new Error("Proposal document was not mounted.");
      }

      const projectName =
        proposal.projectDetail?.projectName || "Rippotai Proposal";

      const filename = projectName
        .trim()
        .replace(/[<>:"/\\|?*]+/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");

      await exportProposalToPdf(
        documentElement,
        `${filename || "Rippotai-Proposal"}.pdf`,
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

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center gap-2 text-[var(--muted)]">
        <Loader2 className="h-5 w-5 animate-spin" />

        <span>Checking project data…</span>
      </div>
    );
  }

  /* ============================================================
     STEP 0 - READINESS
  ============================================================ */

  if (step === 0) {
    return (
      <div className="min-h-screen bg-[var(--mist-soft)]">
        {/* ======================================================
            HEADER
        ====================================================== */}

        <header className="border-b border-[var(--stroke)] bg-white">
          <div className="mx-auto flex max-w-6xl items-center gap-2.5 px-6 py-3.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--ink-green)] text-white">
              <Building2 className="h-4 w-4" />
            </span>

            <div className="min-w-0">
              <p className="text-sm font-semibold leading-none">
                Proposal Builder
              </p>

              <p className="mt-0.5 truncate text-xs text-[var(--muted)]">
                {proposal.projectDetail?.projectName || "Untitled project"}
              </p>
            </div>
          </div>
        </header>

        {/* ======================================================
            PROGRESS
        ====================================================== */}

        <ProposalProgress currentStep={0} onStepChange={setStep} />

        {/* ======================================================
            READINESS
        ====================================================== */}

        <ProposalReadinessCheck
          projectId={projectId}
          proposal={proposal}
          checking={checking}
          onContinue={() => {
            if (!isReady) return;

            setStep(1);
            setView("edit");
          }}
        />
      </div>
    );
  }

  /* ============================================================
     STEP 1+ BUILDER
  ============================================================ */

  return (
    <div className="min-h-screen bg-[var(--mist-soft)]">
      {/* ========================================================
          TOP BAR
      ======================================================== */}

      <header className="sticky top-0 z-30 border-b border-[var(--stroke)] bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-3.5">
          {/* BRAND / PROJECT */}

          <div className="flex min-w-0 items-center gap-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--ink-green)] text-white">
              <Building2 className="h-4 w-4" />
            </span>

            <div className="min-w-0">
              <p className="text-sm font-semibold leading-none">
                Proposal Builder
              </p>

              <p className="mt-0.5 truncate text-xs text-[var(--muted)]">
                {proposal.projectDetail?.projectName || "Untitled project"}
              </p>
            </div>
          </div>

          {/* ACTIONS */}

          <div className="flex shrink-0 items-center gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setStep(0);
                setView("edit");
              }}
            >
              Readiness
            </Button>

            <Tabs tabs={TABS} active={view} onChange={setView} />

            <Button
              onClick={handleDownload}
              loading={exporting}
              disabled={exporting}
            >
              <FileDown className="h-4 w-4" />

              {exporting ? "Generating…" : "Download PDF"}
            </Button>
          </div>
        </div>
      </header>

      {/* ========================================================
          PROGRESS
      ======================================================== */}

      {view === "edit" && (
        <ProposalProgress currentStep={step} onStepChange={setStep} />
      )}

      {/* ========================================================
          EDIT MODE
      ======================================================== */}

      {view === "edit" && (
        <main className="mx-auto max-w-4xl px-6 py-8">
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

              <StepFooter onBack={() => setStep(0)} onNext={() => setStep(2)} />
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

              <StepFooter onBack={() => setStep(1)} onNext={() => setStep(3)} />
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

              <StepFooter onBack={() => setStep(2)} onNext={() => setStep(4)} />
            </>
          )}

          {/* ====================================================
              STEP 4 - BUDGET ESTIMATE
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

              <StepFooter onBack={() => setStep(3)} onNext={() => setStep(5)} />
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

              <StepFooter onBack={() => setStep(4)} onNext={() => setStep(6)} />
            </>
          )}

          {/* ====================================================
              STEP 6 - NEXT STEPS
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
          <div className="border-b border-[var(--stroke)] bg-white">
            <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
              <div>
                <p className="text-sm font-semibold">Proposal Preview</p>

                <p className="text-xs text-[var(--muted)]">
                  Review the complete proposal before downloading.
                </p>
              </div>

              <Button
                variant="outline"
                onClick={() => {
                  setView("edit");
                  setStep(6);
                }}
              >
                <Pencil className="h-4 w-4" />
                Back to Editing
              </Button>
            </div>
          </div>

          <main>
            <div ref={documentRef}>
              <DocumentPreview proposal={proposal} />
            </div>
          </main>
        </>
      )}
    </div>
  );
}
