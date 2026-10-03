// Planner PDF — captured from <PlannerDocument> (shared Rippotai print kit), rendered off-screen by the workspace.
import { downloadWhenReady } from "../print-document/commerce";
import { plannerFileName } from "./PlannerDocument";

/** getRoot: () => the PlannerDocument root element (it may mount a moment later). */
export async function downloadPlannerPdf(getRoot, projectName, view) {
  await downloadWhenReady(getRoot, plannerFileName(projectName, view), {
    title: `Project Planner — ${projectName || ""} (${view || "Overview"})`,
  });
}
