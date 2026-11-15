// Business proposal → the 13 pages of the original BUSINESS PROPOSAL TEMPLATE (540 × 960 pt).
// Only data comes from INOS; fixed copy, artwork and page order follow the template.
const has = (v) => v !== null && v !== undefined && String(v).trim() !== "";
const num = (v) => Number(v || 0);
const uniq = (list) => [...new Set(list.filter(has).map((s) => String(s).trim()))];
const title = (s) => String(s || "").toLowerCase().replace(/(^|[\s(/-])(\w)/g, (m, a, b) => a + b.toUpperCase());

export const PRINCIPAL = { name: "Sagar Chhabra", role: "Principal Architect" };

const monthYear = (v) => {
  if (!has(v)) return "";
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? String(v) : d.toLocaleString("en-GB", { month: "long", year: "numeric" });
};
const monthShort = (v) => {
  if (!has(v)) return "";
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? String(v) : d.toLocaleString("en-GB", { month: "short", year: "numeric" });
};
export const inr = (v) =>
  `₹${num(v).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

const days = (min, max) => {
  const a = num(min);
  const b = num(max) || a;
  if (!a && !b) return "";
  if (b >= 60) {
    const m1 = Math.max(1, Math.round(a / 30));
    const m2 = Math.max(1, Math.round(b / 30));
    return m1 === m2 ? `${m1} month${m1 > 1 ? "s" : ""}` : `${m1}-${m2} months`;
  }
  const w1 = Math.max(1, Math.round(a / 7));
  const w2 = Math.max(1, Math.round(b / 7));
  return w1 === w2 ? `${w1} week${w1 > 1 ? "s" : ""}` : `${w1}-${w2} weeks`;
};

const splitList = (text) =>
  String(text || "")
    .split(/\n|;|,(?![^(]*\))/)
    .map((t) => t.replace(/^\s*[-•*\d.)]+\s*/, "").trim())
    .filter(Boolean);

export function proposalDeckModel(props, company = {}) {
  const { project = {}, scope, plan, budget, schedule, nextSteps, projectDetail: pd = {}, preparedBy } = props;
  const client = project.client || {};
  const team = project.team_members || scope?.project?.team_members || plan?.team_members || [];
  const lead =
    team.find((t) => /architect/i.test(t.role_label || "") && t.is_primary)?.user?.name ||
    team.find((t) => /architect/i.test(t.role_label || ""))?.user?.name ||
    "";
  const projectName = project.name || pd.projectName || "Project";
  const clientName = client.name || pd.clientName || budget?.client_name || "";
  const site = project.site_location || pd.siteAddress || "";
  const signer = has(pd.preparedBy || preparedBy) ? { name: pd.preparedBy || preparedBy, role: "Prepared by" } : PRINCIPAL;

  // ---- scope
  const items = (scope?.items || []).filter((i) => i && (i.isIncluded ?? i.is_included ?? true) && !i.isExcluded);
  const excludedItems = (scope?.items || []).filter((i) => i && (i.isExcluded || i.isIncluded === false));
  const catName = (i) => i.scopeCategory?.name || i.scope_category?.name || i.category || "";
  const spaceName = (i) => i.projectSpace?.name || i.project_space?.name || i.space || "";
  const byCat = new Map();
  items.forEach((i) => {
    const c = catName(i) || "General";
    if (!byCat.has(c)) byCat.set(c, []);
    byCat.get(c).push(spaceName(i));
  });
  const included = [...byCat.entries()].map(([c, spaces]) => {
    const s = uniq(spaces);
    if (!s.length) return c;
    return s.length > 3 ? `${c} — ${s.slice(0, 3).join(", ")} + ${s.length - 3} more` : `${c} — ${s.join(", ")}`;
  });
  const bySpace = new Map();
  items.forEach((i) => {
    const s = spaceName(i);
    if (!has(s)) return;
    if (!bySpace.has(s)) bySpace.set(s, []);
    bySpace.get(s).push(catName(i));
  });
  const spaces = [...bySpace.entries()].map(([name, cats]) => {
    const list = uniq(cats);
    return { name, detail: list.length > 3 ? `${list.slice(0, 3).join(", ")} + ${list.length - 3} more` : list.join(", ") };
  });
  const exclusions = uniq([
    ...splitList(scope?.specificExclusions),
    ...excludedItems.map((i) => [catName(i), spaceName(i)].filter(has).join(" — ")),
  ]);

  // ---- plan → three timeline cards
  const phases = (plan?.phases || []).map((p) => ({
    title: p.title || p.name || "",
    min: p.PlanOfActionPhase?.duration_min_days ?? p.duration_min_days,
    max: p.PlanOfActionPhase?.duration_max_days ?? p.duration_max_days,
  }));
  const isExec = (t) => /EXECUT|SITE|CONSTRUCT|CIVIL|FINISH|INSTALL|MEP/i.test(t);
  const isHand = (t) => /HANDOVER|HAND OVER|CLOS|SNAG|POST/i.test(t);
  const group = (fn) => phases.filter((p) => fn(p.title));
  const pre = group((t) => !isExec(t) && !isHand(t));
  const exec = group((t) => isExec(t) && !isHand(t));
  const hand = group(isHand);
  const sum = (list, k) => list.reduce((s, p) => s + num(p[k]), 0);
  const start = project.desired_start_date || "";
  const end = project.expected_completion_date || pd.expectedCompletionDate || "";
  const timeline = [
    {
      title: "Pre-execution",
      duration: days(sum(pre, "min"), sum(pre, "max")),
      note: pre.length ? "(not included in total execution time)" : "",
      detail: pre.map((p) => title(p.title)).join(", "),
    },
    {
      title: "Execution",
      duration: exec.length ? days(sum(exec, "min"), sum(exec, "max")) : "",
      detail: exec.length ? exec.map((p) => title(p.title)).join(", ") : "",
    },
    {
      title: "Handover",
      duration: hand.length ? days(sum(hand, "min"), sum(hand, "max")) : monthShort(end),
      detail: hand.map((p) => title(p.title)).join(", "),
    },
  ];
  const rangeTitle =
    has(start) && has(end) ? `${monthYear(start)} to ${monthYear(end)}.` : has(end) ? `Complete by ${monthYear(end)}.` : `${plan?.total_duration_label || "Timeline"}.`;

  // ---- fees (budget estimate)
  const subtotal = num(budget?.subtotal);
  const feeAmount = num(budget?.design_amount) + num(budget?.execution_amount) + num(budget?.supervisor_amount);
  const feePct = subtotal && feeAmount ? Math.round((feeAmount / subtotal) * 1000) / 10 : null;
  const gstPct = num(budget?.tax_percentage) || num(schedule?.gstRate) || 18;

  // ---- payment schedule
  const milestones = [...(schedule?.milestones || [])]
    .sort((a, b) => num(a.sortOrder ?? a.milestoneNumber) - num(b.sortOrder ?? b.milestoneNumber))
    .map((m) => ({ label: m.title || m.name || m.milestoneCode, pct: has(m.percentage) ? `${num(m.percentage)}%` : "", amount: m.amount, trigger: m.releaseTrigger || m.description }));

  const steps = (nextSteps?.steps || []).filter((s) => has(s.title));
  const needs = (nextSteps?.checklist || []).map((c) => c?.label).filter(has);

  const stats = [
    has(project.site_area) || has(pd.totalArea)
      ? { value: project.site_area || pd.totalArea, label: project.site_area_unit || "Sq ft", detail: "Site area" }
      : has(pd.builtUpArea)
        ? { value: pd.builtUpArea, label: "Sq ft", detail: "Built-up area" }
        : { value: "", label: "Sq ft", detail: "Site area" },
    has(project.number_of_floors)
      ? { value: project.number_of_floors, label: "Levels", detail: project.lift_available ? "With lift access" : "Floors in scope" }
      : has(pd.carpetArea)
        ? { value: pd.carpetArea, label: "Sq ft", detail: "Carpet area" }
        : { value: "", label: "Levels", detail: "Floors in scope" },
    has(pd.bedrooms)
      ? { value: pd.bedrooms, label: "Bedrooms", detail: has(pd.bathrooms) ? `${pd.bathrooms} bathrooms` : "" }
      : { value: spaces.length || "", label: "Spaces", detail: "In this brief" },
  ];

  const engagement = [project.project_type?.name || pd.projectType, scope?.projectMode ? title(scope.projectMode) : "", pd.workType, pd.unitType]
    .filter(has)
    .join(" · ");

  return {
    projectName,
    clientName,
    site,
    headline: project.description || pd.brief || projectName,
    welcome: `This proposal brings together the scope, programme, budget and payment schedule for ${projectName}.`,
    signer,
    company,
    stats,
    facts: [
      ["CLIENT", [clientName, client.phone, client.email].filter(has).join(" · ")],
      ["SITE ADDRESS", site],
      ["PRINCIPAL ARCHITECT", lead || PRINCIPAL.name],
      ["ENGAGEMENT", engagement],
      ["ORIENTATION", ""],
      ["TARGET COMPLETION", monthYear(end)],
    ],
    context: pd.constraints || "",
    why: [plan?.execution_description, scope?.scopeSummary, scope?.notes].filter(has),
    spaces,
    spacesTitle: spaces.length ? `${spaces.length} Spaces, One Brief.` : `${projectName}, Room By Room.`,
    spacesSub: `${[project.project_type?.name || pd.projectType, project.description || pd.brief].filter(has).join(" — ")}. Built from the brief, room by room.`.replace(/^\. /, ""),
    rangeTitle,
    rangeSub: `A ${plan?.total_duration_label || "phase-wise"} programme, sequenced phase by phase.${pre.length ? " Excluding design & planning" : ""}`,
    timeline,
    desiredStart: monthYear(start).toUpperCase(),
    overall: (plan?.total_duration_label ? `~${plan.total_duration_label}` : "").toUpperCase(),
    included,
    exclusions,
    fee: { pct: feePct, amount: feeAmount, gstPct, budgetTotal: num(budget?.total_amount), budgetNo: budget?.estimate_number || "" },
    milestones,
    schedule: schedule ? { contract: num(schedule.totalContractValue), gstRate: num(schedule.gstRate), payable: num(schedule.totalPayable) } : null,
    steps,
    needs,
  };
}
