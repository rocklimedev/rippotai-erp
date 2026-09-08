import React, { useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Construction,
  DollarSign,
  FileText,
  Filter,
  ListChecks,
  MessageCircle,
  Plus,
  RefreshCw,
  Search,
  Send,
  ShieldAlert,
  ShieldCheck,
  UploadCloud,
  Users,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

/**
 * ============================================================
 * RIPPOTAI COMMAND CENTRE — UI (expanded, shadcn/ui edition)
 * ============================================================
 * This UI is deliberately shaped around the fields the live
 * backend (00_Setup.gs / 01_Scanner.gs / 02_Api.gs / 04_People.gs)
 * already produces, so wiring it up later is a data swap, not a
 * redesign:
 *
 *   PHASE_MASTER   -> PHASE_MASTER sheet   (13 phases, gate codes)
 *   DOC_MASTER     -> DOC_MASTER sheet     (mandatory doc checklist)
 *   TASK_MASTER    -> TASK_MASTER sheet    (EXEC / QC checklist)
 *   PROJECTS       -> PROJECTS sheet
 *   project.current -> the row a live scan would write into
 *                       DOC_REGISTRY / TASK_LOG / PHASE_STATUS for
 *                       whichever phase is currently open
 *
 * Every number on screen is *computed* from that data with the same
 * rollup rules as rollupPhases() in 01_Scanner.gs (see computeState
 * below), rather than typed in separately — so once getDashboardData()
 * is live, replacing PROJECTS + buildProjectPhases() with the API
 * response is the entire integration.
 *
 * This pass swaps the raw HTML primitives (button/input/textarea/
 * progress bars/modals/tab strip) for shadcn/ui components
 * (Button, Card, Badge, Input, Textarea, Progress, Checkbox, Dialog,
 * Tabs). Visual tokens (brand green #19352d, spacing, type scale)
 * are preserved via className overrides on each primitive.
 * ============================================================
 */

// ------------------------------------------------------------
// ROUTES — deep links into the canonical modules
// ------------------------------------------------------------

const ROUTES = {
  projects: "/projects",
  project: (id) => `/projects/${id}`,
  boq: "/boq",
  tasks: "/tasks",
  taskProject: (id) => `/tasks?project=${id}`,
  documents: "/documents",
  documentsProject: (id) => `/documents?project=${id}`,
  procurement: "/procurement",
  calendar: "/calendar",
  reports: "/reports",
};

// ------------------------------------------------------------
// PHASE MASTER — mirrors PHASE_SEED in 00_Setup.gs exactly
// ------------------------------------------------------------

const PHASE_MASTER = [
  {
    id: "P01",
    seq: 1,
    name: "Onboarding & Brief",
    gate: "G1",
    gateName: "Brief Sign-off",
    role: "Principal Architect",
  },
  {
    id: "P02",
    seq: 2,
    name: "Site Survey & Feasibility",
    gate: "G2",
    gateName: "Survey Freeze",
    role: "Site Supervisor",
  },
  {
    id: "P03",
    seq: 3,
    name: "Concept Design",
    gate: "G3",
    gateName: "Concept Approval",
    role: "Design Lead",
  },
  {
    id: "P04",
    seq: 4,
    name: "Design Development & 3D",
    gate: "G4",
    gateName: "Design Freeze",
    role: "Design Lead",
  },
  {
    id: "P05",
    seq: 5,
    name: "BOQ & Costing",
    gate: "G5",
    gateName: "Commercial Approval",
    role: "Estimator",
  },
  {
    id: "P06",
    seq: 6,
    name: "GFC Drawings",
    gate: "G6",
    gateName: "GFC Release",
    role: "Design Lead",
  },
  {
    id: "P07",
    seq: 7,
    name: "Vendor & Procurement",
    gate: "G7",
    gateName: "Vendor Award",
    role: "Procurement",
  },
  {
    id: "P08",
    seq: 8,
    name: "Site Mobilisation",
    gate: "G8",
    gateName: "Mobilisation Clearance",
    role: "Project Manager",
  },
  {
    id: "P09",
    seq: 9,
    name: "Civil & Structure",
    gate: "G9",
    gateName: "Civil QC Clearance",
    role: "Site Supervisor",
  },
  {
    id: "P10",
    seq: 10,
    name: "MEP",
    gate: "G10",
    gateName: "MEP QC Clearance",
    role: "MEP Coordinator",
  },
  {
    id: "P11",
    seq: 11,
    name: "Finishes & Fitouts",
    gate: "G11",
    gateName: "Finishes QC Clearance",
    role: "Site Supervisor",
  },
  {
    id: "P12",
    seq: 12,
    name: "Snagging & Handover",
    gate: "G12",
    gateName: "Handover Sign-off",
    role: "Project Manager",
  },
  {
    id: "P13",
    seq: 13,
    name: "DLP & Project Close",
    gate: "G13",
    gateName: "Project Close",
    role: "Admin Coordinator",
  },
];

// ------------------------------------------------------------
// DOC MASTER — mirrors DOC_SEED. [id, phaseId, name, mandatory, role]
// ------------------------------------------------------------

const DOC_MASTER = [
  ["D0101", "P01", "Signed Proposal / LOI", true, "Admin Coordinator"],
  ["D0102", "P01", "Client Brief Document", true, "Principal Architect"],
  ["D0103", "P01", "Design Agreement", true, "Admin Coordinator"],
  ["D0104", "P01", "Advance Payment Receipt", true, "Accounts"],
  ["D0201", "P02", "Measured Site Survey", true, "Site Supervisor"],
  ["D0202", "P02", "Site Photographs", true, "Site Supervisor"],
  ["D0203", "P02", "Existing Layout CAD", true, "Design Lead"],
  ["D0204", "P02", "Feasibility / Recce Report", true, "Project Manager"],
  ["D0205", "P02", "Statutory & Society NOCs", false, "Admin Coordinator"],
  ["D0301", "P03", "Mood Board", true, "Design Lead"],
  ["D0302", "P03", "Concept Layout Options", true, "Design Lead"],
  ["D0303", "P03", "Concept Presentation", true, "Design Lead"],
  ["D0304", "P03", "Client Approval Record", true, "Project Manager"],
  ["D0401", "P04", "Furniture Layout", true, "Design Lead"],
  ["D0402", "P04", "3D Renders", true, "3D Visualiser"],
  ["D0403", "P04", "Material & Finish Schedule", true, "Design Lead"],
  ["D0404", "P04", "Design Freeze Sign-off", true, "Project Manager"],
  ["D0501", "P05", "Detailed BOQ", true, "Estimator"],
  ["D0502", "P05", "Rate Analysis", false, "Estimator"],
  ["D0503", "P05", "Client Quotation", true, "Estimator"],
  ["D0504", "P05", "Signed Work Order", true, "Admin Coordinator"],
  ["D0505", "P05", "Payment Schedule", true, "Accounts"],
  ["D0601", "P06", "GFC Architectural Drawings", true, "Design Lead"],
  ["D0602", "P06", "GFC Electrical Drawings", true, "MEP Coordinator"],
  ["D0603", "P06", "GFC Plumbing Drawings", true, "MEP Coordinator"],
  ["D0604", "P06", "Joinery / Detail Drawings", true, "Design Lead"],
  ["D0605", "P06", "Drawing Issue Register", true, "Design Lead"],
  ["D0701", "P07", "Vendor Comparison Sheet", true, "Procurement"],
  ["D0702", "P07", "Purchase Orders", true, "Procurement"],
  ["D0703", "P07", "Material Approval Samples", true, "Design Lead"],
  ["D0704", "P07", "Vendor Agreements", false, "Admin Coordinator"],
  ["D0801", "P08", "Site Handover Note", true, "Project Manager"],
  ["D0802", "P08", "Project Schedule / Programme", true, "Project Manager"],
  ["D0803", "P08", "Labour & Safety Induction", true, "Site Supervisor"],
  ["D0804", "P08", "Site Setup Photos", true, "Site Supervisor"],
  ["D0901", "P09", "Civil Work Method Statement", false, "Site Supervisor"],
  ["D0902", "P09", "Daily Site Progress Reports", true, "Site Supervisor"],
  ["D0903", "P09", "Civil QC Checklist Signed", true, "Project Manager"],
  ["D0904", "P09", "Civil Stage Photos", true, "Site Supervisor"],
  ["D1001", "P10", "MEP Shop Drawings", true, "MEP Coordinator"],
  ["D1002", "P10", "Concealed Work Photos", true, "Site Supervisor"],
  ["D1003", "P10", "Pressure / Load Test Records", true, "MEP Coordinator"],
  ["D1004", "P10", "MEP QC Checklist Signed", true, "Project Manager"],
  ["D1101", "P11", "Finish Approval Records", true, "Design Lead"],
  ["D1102", "P11", "Fitout Progress Photos", true, "Site Supervisor"],
  ["D1103", "P11", "Finishes QC Checklist Signed", true, "Project Manager"],
  ["D1201", "P12", "Snag List", true, "Project Manager"],
  ["D1202", "P12", "Snag Closure Record", true, "Site Supervisor"],
  ["D1203", "P12", "As-Built Drawings", true, "Design Lead"],
  ["D1204", "P12", "Warranty & Guarantee Cards", true, "Admin Coordinator"],
  ["D1205", "P12", "Client Handover Sign-off", true, "Project Manager"],
  ["D1206", "P12", "Completion Photos", true, "Site Supervisor"],
  ["D1301", "P13", "Final Account Statement", true, "Accounts"],
  ["D1302", "P13", "Client Feedback Form", true, "Admin Coordinator"],
  ["D1303", "P13", "DLP Visit Reports", false, "Site Supervisor"],
  ["D1304", "P13", "Project Closure Note", true, "Project Manager"],
].map(([id, phaseId, name, mandatory, role]) => ({
  id,
  phaseId,
  name,
  mandatory,
  role,
}));

// ------------------------------------------------------------
// TASK MASTER — mirrors TASK_SEED. [id, phaseId, name, type, mandatory, role]
// ------------------------------------------------------------

const TASK_MASTER = [
  [
    "T0101",
    "P01",
    "Client requirement call completed",
    "EXEC",
    true,
    "Principal Architect",
  ],
  [
    "T0102",
    "P01",
    "Scope & exclusions agreed in writing",
    "EXEC",
    true,
    "Project Manager",
  ],
  [
    "T0103",
    "P01",
    "Advance received & confirmed by accounts",
    "EXEC",
    true,
    "Accounts",
  ],
  [
    "T0201",
    "P02",
    "Physical site measurement done",
    "EXEC",
    true,
    "Site Supervisor",
  ],
  [
    "T0202",
    "P02",
    "Existing services (water/power) mapped",
    "EXEC",
    true,
    "MEP Coordinator",
  ],
  [
    "T0203",
    "P02",
    "Access & material storage assessed",
    "EXEC",
    true,
    "Project Manager",
  ],
  [
    "T0204",
    "P02",
    "Survey cross-checked against CAD",
    "QC",
    true,
    "Design Lead",
  ],
  ["T0301", "P03", "Concept presented to client", "EXEC", true, "Design Lead"],
  ["T0302", "P03", "Client feedback recorded", "EXEC", true, "Project Manager"],
  [
    "T0303",
    "P03",
    "Concept approved in writing",
    "QC",
    true,
    "Project Manager",
  ],
  [
    "T0401",
    "P04",
    "All rooms detailed to DD level",
    "EXEC",
    true,
    "Design Lead",
  ],
  ["T0402", "P04", "Renders approved by client", "EXEC", true, "Design Lead"],
  [
    "T0403",
    "P04",
    "Materials confirmed & available",
    "QC",
    true,
    "Procurement",
  ],
  [
    "T0404",
    "P04",
    "Design frozen — no further changes",
    "QC",
    true,
    "Principal Architect",
  ],
  [
    "T0501",
    "P05",
    "BOQ quantities verified against drawings",
    "QC",
    true,
    "Estimator",
  ],
  [
    "T0502",
    "P05",
    "Rates benchmarked against last 3 projects",
    "QC",
    true,
    "Estimator",
  ],
  [
    "T0503",
    "P05",
    "Margin checked & approved",
    "QC",
    true,
    "Principal Architect",
  ],
  [
    "T0504",
    "P05",
    "Work order signed by client",
    "EXEC",
    true,
    "Admin Coordinator",
  ],
  ["T0601", "P06", "All GFC sets issued to site", "EXEC", true, "Design Lead"],
  ["T0602", "P06", "Site team briefed on GFC", "EXEC", true, "Project Manager"],
  [
    "T0603",
    "P06",
    "Drawing revisions logged in register",
    "QC",
    true,
    "Design Lead",
  ],
  [
    "T0701",
    "P07",
    "Minimum 3 quotes taken per trade",
    "QC",
    true,
    "Procurement",
  ],
  [
    "T0702",
    "P07",
    "Vendor rates within BOQ allowance",
    "QC",
    true,
    "Estimator",
  ],
  ["T0703", "P07", "POs issued & acknowledged", "EXEC", true, "Procurement"],
  [
    "T0704",
    "P07",
    "Delivery schedule aligned to programme",
    "EXEC",
    true,
    "Project Manager",
  ],
  [
    "T0801",
    "P08",
    "Site handed over by client",
    "EXEC",
    true,
    "Project Manager",
  ],
  [
    "T0802",
    "P08",
    "Labour deployed & attendance system live",
    "EXEC",
    true,
    "Site Supervisor",
  ],
  [
    "T0803",
    "P08",
    "Safety kit & signage in place",
    "QC",
    true,
    "Site Supervisor",
  ],
  ["T0804", "P08", "Water & power arranged", "EXEC", true, "Site Supervisor"],
  [
    "T0901",
    "P09",
    "Demolition complete & debris cleared",
    "EXEC",
    true,
    "Site Supervisor",
  ],
  [
    "T0902",
    "P09",
    "Layout marking verified against GFC",
    "QC",
    true,
    "Project Manager",
  ],
  [
    "T0903",
    "P09",
    "Masonry plumb & level within tolerance",
    "QC",
    true,
    "Project Manager",
  ],
  ["T0904", "P09", "Plaster surface checked", "QC", true, "Site Supervisor"],
  [
    "T0905",
    "P09",
    "Waterproofing ponding test passed",
    "QC",
    true,
    "Project Manager",
  ],
  [
    "T1001",
    "P10",
    "Electrical conduiting as per drawing",
    "QC",
    true,
    "MEP Coordinator",
  ],
  [
    "T1002",
    "P10",
    "Plumbing lines pressure tested",
    "QC",
    true,
    "MEP Coordinator",
  ],
  [
    "T1003",
    "P10",
    "Concealed work photographed before cover",
    "QC",
    true,
    "Site Supervisor",
  ],
  ["T1004", "P10", "Load calculation verified", "QC", true, "MEP Coordinator"],
  ["T1005", "P10", "Drainage slopes checked", "QC", true, "Site Supervisor"],
  [
    "T1101",
    "P11",
    "Tile / stone laying level & joint check",
    "QC",
    true,
    "Site Supervisor",
  ],
  [
    "T1102",
    "P11",
    "Paint finish inspected in daylight",
    "QC",
    true,
    "Design Lead",
  ],
  [
    "T1103",
    "P11",
    "Joinery fit & hardware operation checked",
    "QC",
    true,
    "Site Supervisor",
  ],
  [
    "T1104",
    "P11",
    "Sanitaryware installed & leak tested",
    "QC",
    true,
    "MEP Coordinator",
  ],
  ["T1105", "P11", "Site deep-cleaned", "EXEC", true, "Site Supervisor"],
  [
    "T1201",
    "P12",
    "Internal snag walk done before client",
    "QC",
    true,
    "Project Manager",
  ],
  [
    "T1202",
    "P12",
    "All snags closed & re-verified",
    "QC",
    true,
    "Project Manager",
  ],
  [
    "T1203",
    "P12",
    "Client walkthrough conducted",
    "EXEC",
    true,
    "Principal Architect",
  ],
  [
    "T1204",
    "P12",
    "Keys & warranties handed over",
    "EXEC",
    true,
    "Admin Coordinator",
  ],
  ["T1205", "P12", "Final payment received", "EXEC", true, "Accounts"],
  ["T1301", "P13", "Final account reconciled", "EXEC", true, "Accounts"],
  [
    "T1302",
    "P13",
    "Client feedback collected",
    "EXEC",
    true,
    "Admin Coordinator",
  ],
  [
    "T1303",
    "P13",
    "Project photos shot for marketing",
    "EXEC",
    false,
    "Project Manager",
  ],
  ["T1304", "P13", "Lessons learned logged", "EXEC", true, "Project Manager"],
].map(([id, phaseId, name, type, mandatory, role]) => ({
  id,
  phaseId,
  name,
  type,
  mandatory,
  role,
}));

// ------------------------------------------------------------
// PROJECTS — mirrors the PROJECTS sheet + the "current phase" a
// live scan would report. Everything else is derived below.
// ------------------------------------------------------------

const PROJECTS = [
  {
    code: "RT-001",
    name: "Kothari Residence",
    client: "Kothari Family",
    location: "New Delhi",
    pm: "Dhruv Verma",
    value: 4280000,
    target: "18 Dec 2026",
    folderUrl: "#",
    lastActivity: "2h ago",
    currentPhaseSeq: 4,
    current: {
      gateState: "PENDING",
      daysIdle: 0,
      missingDocIds: ["D0404"],
      taskOverrides: { T0402: "Pending", T0404: "Pending" },
    },
  },
  {
    code: "RT-002",
    name: "Golf Course Residence",
    client: "Agarwal Family",
    location: "Gurugram",
    pm: "Amit Sharma",
    value: 3150000,
    target: "02 Mar 2027",
    folderUrl: "#",
    lastActivity: "1d ago",
    currentPhaseSeq: 2,
    current: {
      gateState: "PENDING",
      daysIdle: 2,
      missingDocIds: [],
      taskOverrides: {},
    },
  },
  {
    code: "RT-003",
    name: "DLF Office",
    client: "Aria Technologies",
    location: "Gurugram",
    pm: "Rohan Mehta",
    value: 8120000,
    target: "30 Nov 2026",
    folderUrl: "#",
    lastActivity: "4h ago",
    currentPhaseSeq: 5,
    current: {
      gateState: "PENDING",
      daysIdle: 0,
      missingDocIds: ["D0504"],
      taskOverrides: { T0501: "Pending", T0502: "Pending" },
    },
  },
  {
    code: "RT-004",
    name: "Vasant Vihar Villa",
    client: "Kapoor Family",
    location: "New Delhi",
    pm: "Neeraj Singh",
    value: 6150000,
    target: "14 Feb 2027",
    folderUrl: "#",
    lastActivity: "8d ago",
    currentPhaseSeq: 9,
    current: {
      gateState: "PENDING",
      daysIdle: 8,
      missingDocIds: ["D0903"],
      taskOverrides: { T0904: "Failed", T0905: "Pending" },
    },
  },
  {
    code: "RT-005",
    name: "Saket Apartment",
    client: "Shah Family",
    location: "New Delhi",
    pm: "Rohit Jain",
    value: 5420000,
    target: "05 Oct 2026",
    folderUrl: "#",
    lastActivity: "38m ago",
    currentPhaseSeq: 11,
    current: {
      gateState: "PENDING",
      daysIdle: 0,
      missingDocIds: [],
      taskOverrides: { T1105: "Pending" },
    },
  },
];

// ------------------------------------------------------------
// PEOPLE — mirrors the PEOPLE tab (one row per OWNER_ROLE)
// ------------------------------------------------------------

const PEOPLE = [
  { role: "Principal Architect", name: "Ananya Rao" },
  { role: "Project Manager", name: "Multiple PMs" },
  { role: "Design Lead", name: "Ishaan Kapoor" },
  { role: "Site Supervisor", name: "Ramesh Yadav" },
  { role: "Estimator", name: "Priya Nair" },
  { role: "Procurement", name: "Vikram Sethi" },
  { role: "MEP Coordinator", name: "Farhan Ali" },
  { role: "Admin Coordinator", name: "Neha Bhatt" },
  { role: "Accounts", name: "Suresh Iyer" },
  { role: "3D Visualiser", name: "Tanvi Joshi" },
];

// ------------------------------------------------------------
// ROLLUP LOGIC — same rules as rollupPhases() in 01_Scanner.gs
// ------------------------------------------------------------

const mandatoryDocs = (phaseId) =>
  DOC_MASTER.filter((d) => d.phaseId === phaseId && d.mandatory);
const mandatoryTasks = (phaseId) =>
  TASK_MASTER.filter((t) => t.phaseId === phaseId && t.mandatory);
const STALE_DAYS = 7;

function computeState(pct, gateState, doneCount, idleDays, hasFailed) {
  if (hasFailed) return "QC FAILED";
  if (pct === 100 && gateState === "APPROVED") return "COMPLETE";
  if (pct === 100) return "AWAITING GATE";
  if (doneCount === 0) return "NOT STARTED";
  if (idleDays !== "" && idleDays >= STALE_DAYS) return "STALLED";
  return "IN PROGRESS";
}

function buildProjectPhases(project, docOverrides = {}) {
  return PHASE_MASTER.map((ph) => {
    const dTotal = mandatoryDocs(ph.id).length;
    const tTotal = mandatoryTasks(ph.id).length;

    if (ph.seq < project.currentPhaseSeq) {
      return {
        ...ph,
        docsDone: dTotal,
        docsTotal: dTotal,
        tasksDone: tTotal,
        tasksTotal: tTotal,
        pct: 100,
        state: "COMPLETE",
        gateState: "APPROVED",
        gateBy: project.pm,
        daysIdle: 0,
      };
    }

    if (ph.seq > project.currentPhaseSeq) {
      return {
        ...ph,
        docsDone: 0,
        docsTotal: dTotal,
        tasksDone: 0,
        tasksTotal: tTotal,
        pct: 0,
        state: "NOT STARTED",
        gateState: "PENDING",
        gateBy: "",
        daysIdle: "",
      };
    }

    const cur = project.current;
    const docs = mandatoryDocs(ph.id);
    const tasks = mandatoryTasks(ph.id);
    const stillMissing = (cur.missingDocIds || []).filter(
      (id) => !docOverrides[`${project.code}|${id}`],
    );
    const docsDone = docs.length - stillMissing.length;
    const hasFailed = tasks.some((t) => cur.taskOverrides?.[t.id] === "Failed");
    const tasksDone = tasks.filter(
      (t) => (cur.taskOverrides?.[t.id] || "Done") === "Done",
    ).length;
    const total = docs.length + tasks.length;
    const pct = total ? Math.round(((docsDone + tasksDone) / total) * 100) : 0;
    const state = computeState(
      pct,
      cur.gateState,
      docsDone + tasksDone,
      cur.daysIdle,
      hasFailed,
    );

    return {
      ...ph,
      docsDone,
      docsTotal: docs.length,
      tasksDone,
      tasksTotal: tasks.length,
      pct,
      state,
      gateState: cur.gateState,
      gateBy: cur.gateBy || "",
      daysIdle: cur.daysIdle,
    };
  });
}

function getPhaseDetail(project, phaseId, docOverrides = {}) {
  const ph = PHASE_MASTER.find((p) => p.id === phaseId);
  const docs = DOC_MASTER.filter((d) => d.phaseId === phaseId);
  const tasks = TASK_MASTER.filter((t) => t.phaseId === phaseId);
  let docStatus, taskStatus;

  if (ph.seq < project.currentPhaseSeq) {
    docStatus = () => "UPLOADED";
    taskStatus = () => "Done";
  } else if (ph.seq > project.currentPhaseSeq) {
    docStatus = () => "MISSING";
    taskStatus = () => "Pending";
  } else {
    const cur = project.current;
    docStatus = (d) => {
      if (docOverrides[`${project.code}|${d.id}`]) return "UPLOADED";
      return d.mandatory && cur.missingDocIds?.includes(d.id)
        ? "MISSING"
        : "UPLOADED";
    };
    taskStatus = (t) => cur.taskOverrides?.[t.id] || "Done";
  }

  return {
    docs: docs.map((d) => ({ ...d, status: docStatus(d) })),
    tasks: tasks.map((t) => ({ ...t, status: taskStatus(t) })),
  };
}

function projectHealth(phases) {
  if (phases.some((p) => p.state === "QC FAILED"))
    return { key: "danger", label: "QC Failed" };
  if (phases.some((p) => p.state === "STALLED"))
    return { key: "danger", label: "Stalled" };
  if (phases.some((p) => p.state === "AWAITING GATE"))
    return { key: "gate", label: "Gate Pending" };
  if (phases.every((p) => p.state === "COMPLETE"))
    return { key: "complete", label: "Complete" };
  return { key: "progress", label: "On Track" };
}

// ------------------------------------------------------------
// HELPERS
// ------------------------------------------------------------

const cn = (...classes) => classes.filter(Boolean).join(" ");

const formatINR = (value) => {
  if (value >= 10000000) return `₹ ${(value / 10000000).toFixed(2)} Cr`;
  if (value >= 100000) return `₹ ${(value / 100000).toFixed(2)} L`;
  return `₹ ${Number(value || 0).toLocaleString("en-IN")}`;
};

const STATE_META = {
  COMPLETE: {
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
    dot: "bg-emerald-500",
    indicator: "bg-emerald-500",
  },
  "AWAITING GATE": {
    badge: "bg-blue-50 text-blue-700 border-blue-200",
    dot: "bg-blue-500",
    indicator: "bg-blue-500",
  },
  "IN PROGRESS": {
    badge: "bg-[#eef4f0] text-[#2f6655] border-[#c9d7cf]",
    dot: "bg-[#2f6655]",
    indicator: "bg-[#2f6655]",
  },
  STALLED: {
    badge: "bg-amber-50 text-amber-700 border-amber-200",
    dot: "bg-amber-500",
    indicator: "bg-amber-500",
  },
  "QC FAILED": {
    badge: "bg-red-50 text-red-700 border-red-200",
    dot: "bg-red-500",
    indicator: "bg-red-500",
  },
  "NOT STARTED": {
    badge: "bg-slate-50 text-slate-400 border-slate-200",
    dot: "bg-slate-300",
    indicator: "bg-slate-300",
  },
};

const HEALTH_META = {
  danger: "bg-red-50 text-red-700 border-red-200",
  gate: "bg-blue-50 text-blue-700 border-blue-200",
  progress: "bg-[#eef4f0] text-[#2f6655] border-[#c9d7cf]",
  complete: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

// ------------------------------------------------------------
// SMALL UI COMPONENTS
// ------------------------------------------------------------

function SectionHeader({ eyebrow, title, action, onAction }) {
  return (
    <div className="flex items-end justify-between gap-4 mb-4">
      <div>
        {eyebrow && (
          <div className="text-[10px] font-semibold tracking-[0.16em] uppercase text-slate-400 mb-1">
            {eyebrow}
          </div>
        )}
        <h2 className="text-[17px] font-semibold tracking-[-0.02em] text-[#19352d]">
          {title}
        </h2>
      </div>
      {action && (
        <Button
          type="button"
          variant="ghost"
          onClick={onAction}
          className="h-auto p-0 text-[11px] font-medium text-slate-500 hover:text-[#19352d] hover:bg-transparent flex items-center gap-1"
        >
          {action}
          <ArrowRight size={13} />
        </Button>
      )}
    </div>
  );
}

// Thin wrapper around shadcn Progress so callers can still pick a
// semantic "tone" (brand / warn / danger / gate) the way the bars
// did before. Progress itself only paints the track; we tint the
// indicator with a targeted child selector.
function ProgressBar({ value, tone = "brand" }) {
  const toneClass =
    tone === "danger"
      ? "bg-red-500"
      : tone === "warn"
        ? "bg-amber-500"
        : tone === "gate"
          ? "bg-blue-500"
          : "bg-[#2f6655]";
  return (
    <Progress
      value={Math.min(Math.max(value, 0), 100)}
      className={cn(
        "h-1.5 bg-slate-100 [&>div]:transition-all",
        "[&>div]:" + toneClass,
      )}
    />
  );
}

function KPI({ label, value, meta, icon: Icon, tone, onClick }) {
  return (
    <Card
      onClick={onClick}
      role="button"
      className="text-left w-full group bg-white border border-[#e4e8e5] rounded-xl p-4 hover:border-[#b9c9c1] hover:shadow-sm transition cursor-pointer shadow-none"
    >
      <div
        className={cn(
          "w-8 h-8 rounded-lg flex items-center justify-center",
          tone === "danger"
            ? "bg-red-50 text-red-600"
            : tone === "gate"
              ? "bg-blue-50 text-blue-600"
              : "bg-[#f0f5f2] text-[#2f6655]",
        )}
      >
        <Icon size={16} strokeWidth={1.8} />
      </div>
      <div className="mt-4">
        <div className="text-[24px] font-semibold tracking-[-0.04em] text-[#19352d]">
          {value}
        </div>
        <div className="text-[11px] font-medium text-slate-500 mt-0.5">
          {label}
        </div>
        {meta && <div className="text-[10px] text-slate-400 mt-2">{meta}</div>}
      </div>
    </Card>
  );
}

function Toast({ message }) {
  if (!message) return null;
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#19352d] text-white text-[12px] px-5 py-3 rounded-lg shadow-lg z-[200]">
      {message}
    </div>
  );
}

// ------------------------------------------------------------
// PROJECT BOARD — expandable rows with a per-project gate ladder
// ------------------------------------------------------------

function PhaseLadder({ phases, activeSeq }) {
  return (
    <div className="flex items-center gap-[3px]">
      {phases.map((ph) => {
        const meta = STATE_META[ph.state];
        return (
          <div
            key={ph.id}
            title={`${ph.gate} · ${ph.name} — ${ph.state}`}
            className={cn(
              "w-3 h-3 rotate-45 flex-shrink-0 border",
              meta.dot,
              ph.seq === activeSeq ? "ring-2 ring-offset-1 ring-[#19352d]" : "",
            )}
            style={{ borderColor: "transparent" }}
          />
        );
      })}
    </div>
  );
}

function PhaseDetailCard({
  project,
  phase,
  isAdmin,
  onApproveGate,
  onOpen,
  docOverrides,
  onUploadDoc,
}) {
  const detail = getPhaseDetail(project, phase.id, docOverrides);
  const meta = STATE_META[phase.state];
  const canApprove =
    phase.pct === 100 && phase.gateState !== "APPROVED" && isAdmin;

  return (
    <Card className="bg-[#fafbfa] border border-[#edf0ee] rounded-lg p-4 mt-3 shadow-none">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div>
          <div className="text-[9px] uppercase tracking-[0.1em] text-slate-400 font-semibold">
            Phase {phase.seq} · {phase.gate}
          </div>
          <div className="text-[13px] font-semibold text-[#19352d] mt-0.5">
            {phase.name}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            {phase.gateName}
          </div>
        </div>
        <Badge
          variant="outline"
          className={cn(
            "px-2 py-1 rounded-full text-[9px] font-semibold whitespace-nowrap",
            meta.badge,
          )}
        >
          {phase.state}
        </Badge>
      </div>

      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] font-semibold text-slate-600">
            {phase.pct}% complete
          </span>
          <span className="text-[9px] text-slate-400">
            {phase.docsDone}/{phase.docsTotal} docs · {phase.tasksDone}/
            {phase.tasksTotal} checks
          </span>
        </div>
        <ProgressBar
          value={phase.pct}
          tone={
            phase.state === "QC FAILED"
              ? "danger"
              : phase.state === "STALLED"
                ? "warn"
                : phase.state === "AWAITING GATE"
                  ? "gate"
                  : "brand"
          }
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <div className="text-[9px] uppercase tracking-[0.1em] text-slate-400 font-semibold mb-1.5">
            Documents
          </div>
          <div className="space-y-1">
            {detail.docs.map((d) => (
              <div
                key={d.id}
                className="flex items-center justify-between gap-2 text-[10.5px]"
              >
                <span
                  className={cn(
                    "flex items-center gap-1.5 min-w-0",
                    d.status === "MISSING"
                      ? "text-slate-500"
                      : "text-slate-700",
                  )}
                >
                  <span
                    className={cn(
                      "w-1.5 h-1.5 rounded-full flex-shrink-0",
                      d.status === "UPLOADED"
                        ? "bg-emerald-500"
                        : "bg-slate-300",
                    )}
                  />
                  <span className="truncate">{d.name}</span>
                  {!d.mandatory && (
                    <span className="text-slate-400 flex-shrink-0">
                      (optional)
                    </span>
                  )}
                </span>
                {d.status === "MISSING" ? (
                  <Button
                    type="button"
                    size="sm"
                    onClick={() =>
                      onUploadDoc?.({
                        id: d.id,
                        name: d.name,
                        role: d.role,
                        projectCode: project.code,
                        projectName: project.name,
                        phaseName: phase.name,
                      })
                    }
                    className="flex-shrink-0 h-auto inline-flex items-center gap-1 px-1.5 py-1 rounded bg-[#19352d] text-white text-[8.5px] font-semibold hover:bg-[#0f231d]"
                  >
                    <UploadCloud size={10} />
                    Upload
                  </Button>
                ) : (
                  <span className="text-emerald-600 flex-shrink-0">
                    {d.status}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
        <div>
          <div className="text-[9px] uppercase tracking-[0.1em] text-slate-400 font-semibold mb-1.5">
            Execution &amp; QC checks
          </div>
          <div className="space-y-1">
            {detail.tasks.map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between text-[10.5px]"
              >
                <span className="flex items-center gap-1.5 text-slate-700">
                  <span
                    className={cn(
                      "w-1.5 h-1.5 rounded-full",
                      t.status === "Done"
                        ? "bg-emerald-500"
                        : t.status === "Failed"
                          ? "bg-red-500"
                          : "bg-slate-300",
                    )}
                  />
                  {t.name}
                  {t.type === "QC" && (
                    <span className="text-[8px] font-semibold text-slate-400">
                      QC
                    </span>
                  )}
                </span>
                <span
                  className={cn(
                    "font-medium",
                    t.status === "Done"
                      ? "text-emerald-600"
                      : t.status === "Failed"
                        ? "text-red-500"
                        : "text-slate-500",
                  )}
                >
                  {t.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Separator className="mt-4 mb-3 bg-[#edf0ee]" />
      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="ghost"
          onClick={() => onOpen(ROUTES.documentsProject(project.code))}
          className="h-auto p-0 text-[10px] font-semibold text-[#2f6655] hover:bg-transparent hover:text-[#19352d]"
        >
          Open in Documents →
        </Button>
        {phase.gateState === "APPROVED" ? (
          <span className="text-[10px] text-slate-400">
            Gate approved by {phase.gateBy}
          </span>
        ) : (
          <Button
            type="button"
            disabled={!canApprove}
            onClick={() => onApproveGate(project.code, phase.id)}
            className={cn(
              "h-auto px-3 py-1.5 rounded-md text-[10px] font-semibold",
              canApprove
                ? "bg-[#19352d] text-white hover:bg-[#0f231d]"
                : "bg-slate-100 text-slate-400 hover:bg-slate-100 cursor-not-allowed",
            )}
          >
            {canApprove
              ? `Approve ${phase.gate}`
              : phase.pct === 100
                ? "Admin approval required"
                : `${phase.gate} locked`}
          </Button>
        )}
      </div>
    </Card>
  );
}

function ProjectExecutionBoard({
  rows,
  expanded,
  onToggle,
  onOpenProject,
  isAdmin,
  onApproveGate,
  onOpen,
  docOverrides,
  onUploadDoc,
}) {
  return (
    <Card className="bg-white border border-[#e4e8e5] rounded-xl overflow-hidden shadow-none p-0">
      {rows.map((row) => {
        const isOpen = expanded === row.code;
        const activePhase = row.phases.find(
          (p) => p.seq === row.currentPhaseSeq,
        );
        return (
          <div
            key={row.code}
            className="border-b last:border-b-0 border-[#edf0ee]"
          >
            <div
              className="px-4 py-3.5 hover:bg-[#fbfcfb] cursor-pointer transition"
              onClick={() => onToggle(row.code)}
            >
              <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr_170px_120px_90px] gap-4 items-center">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-[#f1f5f2] flex items-center justify-center text-[#2f6655] flex-shrink-0">
                    <BriefcaseBusiness size={15} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[12px] font-semibold text-[#19352d] truncate">
                      {row.name}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      {row.code} · {row.location}
                    </div>
                  </div>
                </div>

                <div className="min-w-0">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-medium text-slate-700 truncate">
                      {activePhase?.name}{" "}
                      <span className="text-slate-400">
                        ({activePhase?.gate})
                      </span>
                    </span>
                    <span className="text-[10px] font-semibold text-slate-600">
                      {row.pct}%
                    </span>
                  </div>
                  <PhaseLadder
                    phases={row.phases}
                    activeSeq={row.currentPhaseSeq}
                  />
                </div>

                <div>
                  <Badge
                    variant="outline"
                    className={cn(
                      "inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[9px] font-semibold",
                      HEALTH_META[row.health.key],
                    )}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-current" />
                    {row.health.label}
                  </Badge>
                </div>

                <div className="text-[10px] text-slate-600">
                  {row.lastActivity}
                  {row.daysIdle !== "" && row.daysIdle > 0 && (
                    <div className="text-[9px] text-amber-600 mt-0.5">
                      {row.daysIdle}d idle
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-end gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenProject(row.code);
                    }}
                    className="h-auto p-0 text-[9px] font-semibold text-slate-400 hover:text-[#19352d] hover:bg-transparent"
                  >
                    Open
                  </Button>
                  <ArrowRight
                    size={14}
                    className={cn(
                      "text-slate-300 transition-transform",
                      isOpen && "rotate-90",
                    )}
                  />
                </div>
              </div>
            </div>

            {isOpen && (
              <div className="px-4 pb-4">
                {activePhase && (
                  <PhaseDetailCard
                    project={row.project}
                    phase={activePhase}
                    isAdmin={isAdmin}
                    onApproveGate={onApproveGate}
                    onOpen={onOpen}
                    docOverrides={docOverrides}
                    onUploadDoc={onUploadDoc}
                  />
                )}
              </div>
            )}
          </div>
        );
      })}
    </Card>
  );
}

// ------------------------------------------------------------
// ACTION REQUIRED — derived live from missing docs / open tasks
// ------------------------------------------------------------

function ActionRequired({ actions, onOpen }) {
  return (
    <Card className="bg-white border border-[#e4e8e5] rounded-xl overflow-hidden shadow-none p-0">
      <div className="px-4 py-3 border-b border-[#edf0ee] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-red-50 text-red-500 flex items-center justify-center">
            <AlertCircle size={14} />
          </div>
          <div>
            <div className="text-[12px] font-semibold text-[#19352d]">
              Action Required
            </div>
            <div className="text-[9px] text-slate-400">
              Open mandatory items blocking a gate
            </div>
          </div>
        </div>
        <Badge className="text-[10px] font-bold px-2 py-1 rounded-full bg-red-50 text-red-600 hover:bg-red-50">
          {actions.length}
        </Badge>
      </div>
      <div>
        {actions.map((item, i) => (
          <Button
            key={i}
            type="button"
            variant="ghost"
            onClick={() => onOpen(item.route)}
            className="w-full h-auto justify-start text-left px-4 py-3 border-b last:border-b-0 border-[#edf0ee] hover:bg-[#fbfcfb] rounded-none"
          >
            <div className="flex items-start gap-3 w-full">
              <span
                className={cn(
                  "mt-1 w-2 h-2 rounded-full flex-shrink-0",
                  item.severe ? "bg-red-500" : "bg-amber-500",
                )}
              />
              <div className="min-w-0 flex-1">
                <div className="text-[11px] font-medium text-slate-700 truncate">
                  {item.title}
                </div>
                <div className="text-[10px] text-[#2f6655] mt-1">
                  {item.project}
                </div>
                <div className="text-[9px] text-slate-400 mt-0.5">
                  {item.meta}
                </div>
              </div>
              <ArrowRight
                size={13}
                className="mt-1 flex-shrink-0 text-slate-300"
              />
            </div>
          </Button>
        ))}
        {actions.length === 0 && (
          <div className="px-4 py-8 text-center text-[11px] text-slate-400">
            No blockers right now.
          </div>
        )}
      </div>
    </Card>
  );
}

// ------------------------------------------------------------
// DOCUMENT CONTROL
// ------------------------------------------------------------

function DocumentControl({ docStats, missingDocs, onOpen }) {
  return (
    <Card className="bg-white border border-[#e4e8e5] rounded-xl overflow-hidden shadow-none p-0">
      <div className="px-4 py-3 border-b border-[#edf0ee] flex items-center justify-between">
        <div>
          <div className="text-[12px] font-semibold text-[#19352d]">
            Document Control
          </div>
          <div className="text-[9px] text-slate-400 mt-0.5">
            Mandatory evidence in open phases
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          onClick={() => onOpen(ROUTES.documents)}
          className="h-auto p-0 text-[10px] text-[#2f6655] font-semibold hover:bg-transparent"
        >
          View all
        </Button>
      </div>

      <div className="grid grid-cols-3 border-b border-[#edf0ee]">
        <div className="px-4 py-3 border-r border-[#edf0ee]">
          <div className="text-[17px] font-semibold text-[#19352d]">
            {docStats.required}
          </div>
          <div className="text-[9px] text-slate-400">Required now</div>
        </div>
        <div className="px-4 py-3 border-r border-[#edf0ee]">
          <div className="text-[17px] font-semibold text-emerald-600">
            {docStats.uploaded}
          </div>
          <div className="text-[9px] text-slate-400">Uploaded</div>
        </div>
        <div className="px-4 py-3">
          <div className="text-[17px] font-semibold text-red-500">
            {docStats.missing}
          </div>
          <div className="text-[9px] text-slate-400">Missing</div>
        </div>
      </div>

      <div>
        {missingDocs.map((doc, i) => (
          <div
            key={i}
            className="w-full px-4 py-3 flex items-center gap-3 border-b last:border-b-0 border-[#edf0ee] hover:bg-[#fbfcfb] transition"
          >
            <div className="w-7 h-7 rounded-lg bg-[#f3f6f4] text-[#2f6655] flex items-center justify-center flex-shrink-0">
              <FileText size={13} />
            </div>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpen(ROUTES.documentsProject(doc.code))}
              className="h-auto p-0 min-w-0 flex-1 justify-start text-left hover:bg-transparent"
            >
              <div>
                <div className="text-[10px] font-medium text-slate-700 truncate">
                  {doc.name}
                </div>
                <div className="text-[9px] text-slate-400 mt-0.5">
                  {doc.project} · {doc.phase} · owner {doc.role}
                </div>
              </div>
            </Button>
            <div className="text-[8px] font-semibold text-red-500 flex-shrink-0">
              MISSING
            </div>
            <Button
              type="button"
              onClick={() => doc.onUpload?.(doc)}
              className="flex-shrink-0 h-auto inline-flex items-center gap-1 px-2 py-1.5 rounded-md bg-[#19352d] text-white text-[9px] font-semibold hover:bg-[#0f231d]"
            >
              <UploadCloud size={11} />
              Upload
            </Button>
          </div>
        ))}
        {missingDocs.length === 0 && (
          <div className="px-4 py-8 text-center text-[11px] text-slate-400">
            Nothing missing right now.
          </div>
        )}
      </div>
    </Card>
  );
}

// ------------------------------------------------------------
// EXECUTION & QC CHECKS
// ------------------------------------------------------------

function TaskQCPanel({ openTasks, onOpen }) {
  return (
    <Card className="bg-white border border-[#e4e8e5] rounded-xl overflow-hidden shadow-none p-0">
      <div className="px-4 py-3 border-b border-[#edf0ee] flex items-center justify-between">
        <div>
          <div className="text-[12px] font-semibold text-[#19352d]">
            Execution &amp; QC Checks
          </div>
          <div className="text-[9px] text-slate-400 mt-0.5">
            Pending or failed checklist items
          </div>
        </div>
        <Badge className="text-[10px] font-bold px-2 py-1 rounded-full bg-[#f0f5f2] text-[#2f6655] hover:bg-[#f0f5f2]">
          {openTasks.length}
        </Badge>
      </div>
      <div>
        {openTasks.map((t, i) => (
          <Button
            key={i}
            type="button"
            variant="ghost"
            onClick={() => onOpen(ROUTES.taskProject(t.code))}
            className="w-full h-auto justify-start px-4 py-3 text-left border-b last:border-b-0 border-[#edf0ee] hover:bg-[#fbfcfb] rounded-none"
          >
            <div className="flex items-center gap-3 w-full">
              <div
                className={cn(
                  "w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0",
                  t.status === "Failed"
                    ? "bg-red-50 text-red-500"
                    : "bg-[#f3f6f4] text-[#2f6655]",
                )}
              >
                {t.status === "Failed" ? (
                  <ShieldAlert size={13} />
                ) : (
                  <ListChecks size={13} />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[10px] font-medium text-slate-700 truncate">
                  {t.name}{" "}
                  {t.type === "QC" && (
                    <span className="text-[8px] font-semibold text-slate-400">
                      QC
                    </span>
                  )}
                </div>
                <div className="text-[9px] text-slate-400 mt-0.5">
                  {t.project} · {t.phase} · owner {t.role}
                </div>
              </div>
              <div
                className={cn(
                  "text-[8px] font-semibold flex-shrink-0",
                  t.status === "Failed" ? "text-red-500" : "text-amber-600",
                )}
              >
                {t.status.toUpperCase()}
              </div>
            </div>
          </Button>
        ))}
        {openTasks.length === 0 && (
          <div className="px-4 py-8 text-center text-[11px] text-slate-400">
            All checks clear.
          </div>
        )}
      </div>
    </Card>
  );
}

// ------------------------------------------------------------
// COMMERCIAL — grounded in the BOQ & Costing phase (P05)
// ------------------------------------------------------------

function CommercialPanel({ projects, onOpen }) {
  const boqPhase = (p) => buildProjectPhases(p).find((ph) => ph.id === "P05");
  const passed = projects.filter(
    (p) => boqPhase(p).state === "COMPLETE",
  ).length;
  const awaiting = projects.filter(
    (p) => boqPhase(p).state === "AWAITING GATE",
  ).length;
  const inProgress = projects.filter((p) =>
    ["IN PROGRESS", "STALLED", "QC FAILED"].includes(boqPhase(p).state),
  ).length;
  const approvedValue = projects
    .filter((p) => boqPhase(p).state === "COMPLETE")
    .reduce((s, p) => s + p.value, 0);
  const totalValue = projects.reduce((s, p) => s + p.value, 0);

  return (
    <Card className="bg-white border border-[#e4e8e5] rounded-xl overflow-hidden shadow-none p-0">
      <div className="px-4 py-3 border-b border-[#edf0ee] flex items-center justify-between">
        <div>
          <div className="text-[12px] font-semibold text-[#19352d]">
            Commercial
          </div>
          <div className="text-[9px] text-slate-400 mt-0.5">
            BOQ & Costing (Phase 5 · G5)
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          onClick={() => onOpen(ROUTES.boq)}
          className="h-auto p-0 text-[10px] text-[#2f6655] font-semibold hover:bg-transparent"
        >
          Open BOQ
        </Button>
      </div>

      <div className="grid grid-cols-2">
        <div className="p-4 border-r border-b border-[#edf0ee]">
          <div className="text-[17px] font-semibold text-[#19352d]">
            {totalValue ? formatINR(totalValue) : "—"}
          </div>
          <div className="text-[9px] text-slate-400">Total portfolio value</div>
        </div>
        <div className="p-4 border-b border-[#edf0ee]">
          <div className="text-[17px] font-semibold text-emerald-600">
            {formatINR(approvedValue)}
          </div>
          <div className="text-[9px] text-slate-400">
            Commercially approved (G5)
          </div>
        </div>
      </div>

      <div className="px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[9px] uppercase tracking-[0.12em] font-semibold text-slate-400">
            G5 status across portfolio
          </span>
        </div>
        <div className="flex gap-2">
          {[
            ["Not reached", projects.length - passed - awaiting - inProgress],
            ["Costing in progress", inProgress],
            ["Awaiting approval", awaiting],
            ["Approved", passed],
          ].map(([label, value]) => (
            <div key={label} className="flex-1 bg-[#fafbfa] rounded-lg p-2">
              <div className="text-[13px] font-semibold text-[#19352d]">
                {value}
              </div>
              <div className="text-[8px] text-slate-400">{label}</div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

// ------------------------------------------------------------
// SITE EXECUTION — grounded in Civil / MEP / Finishes phases
// ------------------------------------------------------------

function SiteExecution({ projects, onOpen }) {
  const siteIds = ["P09", "P10", "P11"];
  const inSitePhase = projects.filter((p) =>
    siteIds.includes(
      PHASE_MASTER.find((ph) => ph.seq === p.currentPhaseSeq)?.id,
    ),
  );
  const stalled = inSitePhase.filter((p) =>
    buildProjectPhases(p).some(
      (ph) => siteIds.includes(ph.id) && ph.state === "STALLED",
    ),
  );
  const qcFailed = inSitePhase.filter((p) =>
    buildProjectPhases(p).some(
      (ph) => siteIds.includes(ph.id) && ph.state === "QC FAILED",
    ),
  );

  return (
    <Card className="bg-white border border-[#e4e8e5] rounded-xl overflow-hidden shadow-none p-0">
      <div className="px-4 py-3 border-b border-[#edf0ee] flex items-center justify-between">
        <div>
          <div className="text-[12px] font-semibold text-[#19352d]">
            Site Execution
          </div>
          <div className="text-[9px] text-slate-400 mt-0.5">
            Civil · MEP · Finishes (Phases 9–11)
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          onClick={() => onOpen(ROUTES.tasks)}
          className="h-auto p-0 text-[10px] text-[#2f6655] font-semibold hover:bg-transparent"
        >
          Open execution
        </Button>
      </div>

      <div className="grid grid-cols-3 border-b border-[#edf0ee]">
        <div className="p-4 border-r border-[#edf0ee]">
          <Construction size={14} className="text-[#2f6655]" />
          <div className="text-[20px] font-semibold text-[#19352d] mt-3">
            {inSitePhase.length}
          </div>
          <div className="text-[9px] text-slate-400 mt-0.5">
            Projects on site
          </div>
        </div>
        <div className="p-4 border-r border-[#edf0ee]">
          <ShieldAlert size={14} className="text-red-500" />
          <div className="text-[20px] font-semibold text-red-500 mt-3">
            {qcFailed.length}
          </div>
          <div className="text-[9px] text-slate-400 mt-0.5">
            QC failures on site
          </div>
        </div>
        <div className="p-4">
          <Clock3 size={14} className="text-amber-500" />
          <div className="text-[20px] font-semibold text-amber-600 mt-3">
            {stalled.length}
          </div>
          <div className="text-[9px] text-slate-400 mt-0.5">
            Stalled on site
          </div>
        </div>
      </div>

      <div>
        {inSitePhase.map((p) => {
          const ph = buildProjectPhases(p).find(
            (x) => x.seq === p.currentPhaseSeq,
          );
          return (
            <Button
              type="button"
              variant="ghost"
              key={p.code}
              onClick={() => onOpen(ROUTES.taskProject(p.code))}
              className="w-full h-auto justify-start px-4 py-3 border-b last:border-b-0 border-[#edf0ee] text-left hover:bg-[#fbfcfb] rounded-none"
            >
              <div className="flex items-center gap-3 w-full">
                <div className="w-7 h-7 rounded-lg bg-[#f3f6f4] flex items-center justify-center text-[#2f6655]">
                  <Construction size={13} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] font-semibold text-slate-700">
                    {p.name}
                  </div>
                  <div className="text-[9px] text-slate-400 mt-0.5 truncate">
                    {ph.name} · {ph.tasksDone}/{ph.tasksTotal} checks ·{" "}
                    {ph.docsDone}/{ph.docsTotal} docs
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[8px] font-semibold px-1.5 py-0.5 rounded",
                    STATE_META[ph.state].badge,
                  )}
                >
                  {ph.state}
                </Badge>
              </div>
            </Button>
          );
        })}
        {inSitePhase.length === 0 && (
          <div className="px-4 py-6 text-center text-[11px] text-slate-400">
            No project on site right now.
          </div>
        )}
      </div>
    </Card>
  );
}

// ------------------------------------------------------------
// TEAM WORKLOAD — by OWNER_ROLE, mirrors openWorkByRole() in 04_People.gs
// ------------------------------------------------------------

function TeamWorkload({ roleLoad, onOpen }) {
  const maxCount = Math.max(1, ...roleLoad.map((r) => r.count));
  return (
    <Card className="bg-white border border-[#e4e8e5] rounded-xl overflow-hidden shadow-none p-0">
      <div className="px-4 py-3 border-b border-[#edf0ee] flex items-center justify-between">
        <div>
          <div className="text-[12px] font-semibold text-[#19352d]">
            Team Workload
          </div>
          <div className="text-[9px] text-slate-400 mt-0.5">
            Open items by role, this week
          </div>
        </div>
        <Users size={14} className="text-slate-400" />
      </div>
      <div>
        {roleLoad.map((r) => (
          <Button
            type="button"
            variant="ghost"
            key={r.role}
            onClick={() => onOpen(ROUTES.tasks)}
            className="w-full h-auto flex-col items-stretch justify-start px-4 py-3 border-b last:border-b-0 border-[#edf0ee] text-left hover:bg-[#fbfcfb] rounded-none"
          >
            <div className="flex items-center justify-between mb-1.5 w-full">
              <span className="text-[10px] font-medium text-slate-700">
                {r.role}
              </span>
              <span
                className={cn(
                  "text-[9px] font-semibold",
                  r.count >= 3
                    ? "text-red-500"
                    : r.count > 0
                      ? "text-amber-600"
                      : "text-emerald-600",
                )}
              >
                {r.count} open
              </span>
            </div>
            <ProgressBar
              value={(r.count / maxCount) * 100}
              tone={r.count >= 3 ? "danger" : r.count > 0 ? "warn" : "brand"}
            />
            <div className="text-[8px] text-slate-400 mt-1">{r.name}</div>
          </Button>
        ))}
      </div>
    </Card>
  );
}

// ------------------------------------------------------------
// ACTIVITY — mirrors LOG tab event types
// ------------------------------------------------------------

function ActivityTimeline({ activities }) {
  const iconFor = (type) => {
    if (type === "SCAN") return RefreshCw;
    if (type === "GATE_APPROVED") return ShieldCheck;
    if (type === "PROJECT_CREATED") return Plus;
    if (type === "MESSAGE") return MessageCircle;
    if (type === "DOC") return FileText;
    return ListChecks;
  };

  return (
    <Card className="bg-white border border-[#e4e8e5] rounded-xl overflow-hidden shadow-none p-0">
      <div className="px-4 py-3 border-b border-[#edf0ee] flex items-center justify-between">
        <div>
          <div className="text-[12px] font-semibold text-[#19352d]">
            Live Activity
          </div>
          <div className="text-[9px] text-slate-400 mt-0.5">
            From the LOG sheet
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-[9px] text-emerald-600">
          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
          Live
        </div>
      </div>
      <div>
        {activities.map((a, index) => {
          const Icon = iconFor(a.type);
          return (
            <div key={index} className="px-4 py-3 flex gap-3">
              <div className="flex flex-col items-center">
                <div className="w-7 h-7 rounded-lg bg-[#f3f6f4] text-[#2f6655] flex items-center justify-center">
                  <Icon size={12} />
                </div>
                {index !== activities.length - 1 && (
                  <div className="w-px flex-1 bg-[#edf0ee] mt-1" />
                )}
              </div>
              <div className="flex-1 min-w-0 pb-1">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-[10px] font-medium text-slate-700 truncate">
                    {a.title}
                  </div>
                  <span className="text-[8px] text-slate-400 whitespace-nowrap">
                    {a.time}
                  </span>
                </div>
                <div className="text-[9px] text-[#2f6655] mt-1">{a.detail}</div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

// ------------------------------------------------------------
// MODALS — New Project / Post to Cliq / Upload Document
// ------------------------------------------------------------

function Field({ label, children }) {
  return (
    <div className="mb-3.5">
      <Label className="block text-[9px] uppercase tracking-[0.1em] font-semibold text-slate-400 mb-1.5">
        {label}
      </Label>
      {children}
    </div>
  );
}

const inputClass =
  "text-[13px] border-[#dfe5e1] focus-visible:border-[#2f6655] focus-visible:ring-[#2f6655]";

// ------------------------------------------------------------
// UPLOAD DOCUMENT MODAL — attach evidence for a single doc item
// ------------------------------------------------------------

function UploadDocumentModal({ target, onClose, onSubmit }) {
  const [file, setFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!target) return null;

  const handleFiles = (fileList) => {
    if (fileList && fileList[0]) setFile(fileList[0]);
  };

  const handleSubmit = () => {
    if (!file || submitting) return;
    setSubmitting(true);
    // Simulated upload — a live integration would PUT to the DOC_REGISTRY
    // sheet / Drive folder for this project + doc id here.
    setTimeout(() => {
      setSubmitting(false);
      onSubmit({ ...target, fileName: file.name, notes });
    }, 500);
  };

  return (
    <Dialog open={!!target} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg p-0 gap-0 overflow-hidden rounded-2xl border-[#dfe5e1]">
        <DialogHeader className="px-5 py-4 border-b border-[#edf0ee]">
          <DialogTitle className="text-[15px] font-semibold text-[#19352d]">
            Upload document
          </DialogTitle>
        </DialogHeader>
        <div className="p-5">
          <div className="mb-4 bg-[#fafbfa] border border-[#edf0ee] rounded-lg p-3">
            <div className="text-[9px] uppercase tracking-[0.1em] font-semibold text-slate-400 mb-1">
              {target.projectName} · {target.phaseName}
            </div>
            <div className="text-[13px] font-semibold text-[#19352d]">
              {target.name}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              Owner: {target.role}
            </div>
          </div>

          <Field label="File">
            <label
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                handleFiles(e.dataTransfer.files);
              }}
              className={cn(
                "flex flex-col items-center justify-center gap-2 border border-dashed rounded-lg py-8 px-4 cursor-pointer transition text-center",
                dragOver
                  ? "border-[#2f6655] bg-[#f0f5f2]"
                  : "border-[#dfe5e1] hover:border-[#b9c9c1]",
              )}
            >
              <div className="w-9 h-9 rounded-lg bg-[#f0f5f2] text-[#2f6655] flex items-center justify-center">
                <UploadCloud size={16} />
              </div>
              {file ? (
                <div className="text-[11px] font-medium text-slate-700">
                  {file.name}
                </div>
              ) : (
                <>
                  <div className="text-[11px] font-medium text-slate-600">
                    Drag a file here, or click to browse
                  </div>
                  <div className="text-[9px] text-slate-400">
                    PDF, image, or Office document
                  </div>
                </>
              )}
              <input
                type="file"
                className="hidden"
                onChange={(e) => handleFiles(e.target.files)}
              />
            </label>
          </Field>

          <Field label="Notes (optional)">
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Anything the reviewer should know about this file..."
              className={cn(inputClass, "resize-none")}
            />
          </Field>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="px-3.5 py-2 h-auto rounded-lg text-[11px] font-semibold text-slate-500 hover:bg-slate-50"
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={!file || submitting}
              onClick={handleSubmit}
              className={cn(
                "px-4 py-2 h-auto rounded-lg text-[11px] font-semibold inline-flex items-center gap-1.5",
                file && !submitting
                  ? "bg-[#19352d] text-white hover:bg-[#0f231d]"
                  : "bg-slate-100 text-slate-400 hover:bg-slate-100 cursor-not-allowed",
              )}
            >
              {submitting ? (
                <>
                  <RefreshCw size={12} className="animate-spin" />
                  Uploading…
                </>
              ) : (
                <>
                  <UploadCloud size={12} />
                  Upload document
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ------------------------------------------------------------
// TAB NAVIGATION
// ------------------------------------------------------------

const TABS = [
  { id: "portfolio", label: "Portfolio", icon: BriefcaseBusiness },
  { id: "actions", label: "Action Required", icon: AlertCircle },
  { id: "documents", label: "Document Control", icon: FileText },
  { id: "execution", label: "Site Execution", icon: Construction },
  { id: "qc", label: "Execution & QC Checks", icon: ListChecks },
  { id: "commercial", label: "Commercial", icon: DollarSign },
  { id: "team", label: "Team Workload", icon: Users },
  { id: "activity", label: "Live Activity", icon: RefreshCw },
];

function TabNav({ active, onChange, counts }) {
  return (
    <Tabs value={active} onValueChange={onChange} className="mb-6">
      <TabsList className="w-full justify-start h-auto bg-transparent p-0 border-b border-[#e4e8e5] rounded-none overflow-x-auto">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const count = counts?.[tab.id];
          return (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className={cn(
                "relative flex items-center gap-1.5 px-3.5 py-2.5 text-[11px] font-semibold whitespace-nowrap rounded-none bg-transparent shadow-none",
                "data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-[#19352d]",
                "text-slate-400 hover:text-slate-600",
                "after:absolute after:left-0 after:right-0 after:-bottom-px after:h-[2px] after:rounded-full",
                "data-[state=active]:after:bg-[#19352d]",
              )}
            >
              <Icon size={13} />
              {tab.label}
              {typeof count === "number" && count > 0 && (
                <Badge
                  className={cn(
                    "ml-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full pointer-events-none",
                    active === tab.id
                      ? "bg-[#19352d] text-white hover:bg-[#19352d]"
                      : "bg-[#f0f5f2] text-[#2f6655] hover:bg-[#f0f5f2]",
                  )}
                >
                  {count}
                </Badge>
              )}
            </TabsTrigger>
          );
        })}
      </TabsList>
    </Tabs>
  );
}

// ------------------------------------------------------------
// MAIN PAGE
// ------------------------------------------------------------

export default function CommandCenter() {
  const [healthFilter, setHealthFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState(null);
  const [isAdmin, setIsAdmin] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [showMsg, setShowMsg] = useState(false);
  const [toast, setToast] = useState("");
  const [gateOverrides, setGateOverrides] = useState({}); // "code|phaseId" -> approver
  const [docOverrides, setDocOverrides] = useState({}); // "code|docId" -> true once uploaded
  const [uploadTarget, setUploadTarget] = useState(null); // doc being uploaded via modal
  const [activeTab, setActiveTab] = useState("portfolio");
  const [log, setLog] = useState([
    {
      type: "SCAN",
      title: "Full Drive scan complete",
      detail: "5 projects · 65 phase slots",
      time: "2m ago",
    },
    {
      type: "DOC",
      title: "GFC Electrical uploaded",
      detail: "Kothari Residence · GFC Drawings",
      time: "12m ago",
    },
    {
      type: "PROJECT_CREATED",
      title: "Project opened",
      detail: "Saket Apartment · by Rohit Jain",
      time: "3d ago",
    },
  ]);

  const flashToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3200);
  };

  const navigate = (route) => {
    // In production: navigate(route) via react-router-dom / Next router.
    // The Command Centre never duplicates the canonical modules.
    flashToast(`Navigating to ${route}`);
  };

  // ---- derive everything from PROJECTS + masters, same shape getDashboardData() returns ----
  const projectRows = useMemo(() => {
    return PROJECTS.map((p) => {
      const key = p.code;
      const withOverride = {
        ...p,
        current: gateOverrides[`${key}|current`]
          ? { ...p.current, gateState: "APPROVED" }
          : p.current,
      };
      const phases = buildProjectPhases(withOverride, docOverrides);
      const pct = Math.round(
        phases.reduce((s, ph) => s + ph.pct, 0) / phases.length,
      );
      const complete = phases.filter((ph) => ph.state === "COMPLETE").length;
      return {
        code: p.code,
        name: p.name,
        location: p.location,
        lastActivity: p.lastActivity,
        currentPhaseSeq: p.currentPhaseSeq,
        phases,
        pct,
        complete,
        total: phases.length,
        health: projectHealth(phases),
        daysIdle: p.current.daysIdle,
        project: withOverride,
      };
    });
  }, [gateOverrides, docOverrides]);

  const filteredRows = useMemo(() => {
    let rows = [...projectRows];
    if (healthFilter !== "all")
      rows = rows.filter((r) => r.health.key === healthFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter((r) =>
        `${r.name} ${r.code} ${r.location}`.toLowerCase().includes(q),
      );
    }
    return rows;
  }, [projectRows, healthFilter, search]);

  const kpi = useMemo(() => {
    const allPhases = projectRows.flatMap((r) => r.phases);
    return {
      live: projectRows.length,
      awaiting: allPhases.filter((p) => p.state === "AWAITING GATE").length,
      stalled: allPhases.filter((p) => p.state === "STALLED").length,
      failed: allPhases.filter((p) => p.state === "QC FAILED").length,
      docsMissing: allPhases.reduce(
        (s, p) =>
          s +
          Math.max(0, p.docsTotal - p.docsDone) *
            (p.state !== "NOT STARTED" && p.state !== "COMPLETE" ? 1 : 0),
        0,
      ),
      value: PROJECTS.reduce((s, p) => s + p.value, 0),
    };
  }, [projectRows]);

  const actions = useMemo(() => {
    const items = [];
    projectRows.forEach((row) => {
      const ph = row.phases.find((p) => p.seq === row.currentPhaseSeq);
      if (!ph || row.health.key === "complete") return;
      const detail = getPhaseDetail(row.project, ph.id, docOverrides);
      detail.docs
        .filter((d) => d.status === "MISSING" && d.mandatory)
        .forEach((d) => {
          items.push({
            severe: ph.state === "QC FAILED",
            title: `${d.name} missing`,
            project: `${row.name} · ${ph.name}`,
            meta: `Owner: ${d.role}`,
            route: ROUTES.documentsProject(row.code),
          });
        });
      detail.tasks
        .filter((t) => t.status !== "Done" && t.mandatory)
        .forEach((t) => {
          items.push({
            severe: t.status === "Failed",
            title: `${t.status === "Failed" ? "Redo" : "Complete"}: ${t.name}`,
            project: `${row.name} · ${ph.name}`,
            meta: `Owner: ${t.role}${row.daysIdle ? ` · ${row.daysIdle}d idle` : ""}`,
            route: ROUTES.taskProject(row.code),
          });
        });
      if (ph.state === "AWAITING GATE") {
        items.push({
          severe: false,
          title: `${ph.gate} awaiting approval`,
          project: `${row.name} · ${ph.gateName}`,
          meta: "Owner: Admin",
          route: ROUTES.project(row.code),
        });
      }
    });
    return items.sort((a, b) => (b.severe ? 1 : 0) - (a.severe ? 1 : 0));
  }, [projectRows, docOverrides]);

  const missingDocsList = useMemo(() => {
    const out = [];
    projectRows.forEach((row) => {
      const ph = row.phases.find((p) => p.seq === row.currentPhaseSeq);
      if (!ph) return;
      const detail = getPhaseDetail(row.project, ph.id, docOverrides);
      detail.docs
        .filter((d) => d.status === "MISSING" && d.mandatory)
        .forEach((d) => {
          out.push({
            id: d.id,
            name: d.name,
            project: row.name,
            code: row.code,
            phase: ph.name,
            role: d.role,
            onUpload: () =>
              setUploadTarget({
                id: d.id,
                name: d.name,
                role: d.role,
                projectCode: row.code,
                projectName: row.name,
                phaseName: ph.name,
              }),
          });
        });
    });
    return out;
  }, [projectRows, docOverrides]);

  const docStats = useMemo(() => {
    let required = 0,
      uploaded = 0;
    projectRows.forEach((row) => {
      const ph = row.phases.find((p) => p.seq === row.currentPhaseSeq);
      if (!ph) return;
      required += ph.docsTotal;
      uploaded += ph.docsDone;
    });
    return { required, uploaded, missing: required - uploaded };
  }, [projectRows]);

  const openTasks = useMemo(() => {
    const out = [];
    projectRows.forEach((row) => {
      const ph = row.phases.find((p) => p.seq === row.currentPhaseSeq);
      if (!ph) return;
      const detail = getPhaseDetail(row.project, ph.id, docOverrides);
      detail.tasks
        .filter((t) => t.status !== "Done" && t.mandatory)
        .forEach((t) => {
          out.push({
            name: t.name,
            type: t.type,
            status: t.status,
            project: row.name,
            code: row.code,
            phase: ph.name,
            role: t.role,
          });
        });
    });
    return out.sort(
      (a, b) =>
        (b.status === "Failed" ? 1 : 0) - (a.status === "Failed" ? 1 : 0),
    );
  }, [projectRows, docOverrides]);

  const roleLoad = useMemo(() => {
    const counts = {};
    [
      ...missingDocsList.map((d) => d.role),
      ...openTasks.map((t) => t.role),
    ].forEach((role) => {
      counts[role] = (counts[role] || 0) + 1;
    });
    return PEOPLE.map((p) => ({
      role: p.role,
      name: p.name,
      count: counts[p.role] || 0,
    })).sort((a, b) => b.count - a.count);
  }, [missingDocsList, openTasks]);

  const handleApproveGate = (code, phaseId) => {
    if (!isAdmin) {
      flashToast("Only super admins can approve gates.");
      return;
    }
    setGateOverrides((prev) => ({ ...prev, [`${code}|current`]: true }));
    const row = projectRows.find((r) => r.code === code);
    const ph = row?.phases.find((p) => p.id === phaseId);
    setLog((l) => [
      {
        type: "GATE_APPROVED",
        title: `Gate cleared — ${ph?.gate}`,
        detail: `${row?.name} · approved by you`,
        time: "just now",
      },
      ...l,
    ]);
    flashToast(`${ph?.gate} approved.`);
  };

  const handleUploadDocument = ({
    id,
    name,
    fileName,
    projectCode,
    projectName,
    phaseName,
  }) => {
    setDocOverrides((prev) => ({ ...prev, [`${projectCode}|${id}`]: true }));
    setLog((l) => [
      {
        type: "DOC",
        title: `${name} uploaded`,
        detail: `${projectName} · ${phaseName} · ${fileName}`,
        time: "just now",
      },
      ...l,
    ]);
    setUploadTarget(null);
    flashToast(`${name} uploaded to ${projectName}.`);
  };

  const handleRescan = () => {
    setLog((l) => [
      {
        type: "SCAN",
        title: "Full Drive scan complete",
        detail: `${PROJECTS.length} projects rescanned`,
        time: "just now",
      },
      ...l,
    ]);
    flashToast("Scan complete.");
  };

  return (
    <div className="min-h-screen bg-[#f5f7f5] text-[#19352d]">
      <main className="px-5 lg:px-7 py-6 max-w-[1700px] mx-auto">
        {/* INTRO */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5 mb-6">
          <div>
            <h1 className="text-[28px] lg:text-[32px] font-semibold tracking-[-0.04em] text-[#19352d]">
              Command Centre
            </h1>
            <p className="text-[11px] text-slate-400 mt-1 max-w-xl">
              One operational view across projects, phases, gates, documents,
              checks and site execution — sourced from PHASE_MASTER, DOC_MASTER,
              TASK_MASTER and live Drive scans.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 mr-1">
              <Checkbox
                id="admin-view"
                checked={isAdmin}
                onCheckedChange={(v) => setIsAdmin(!!v)}
                className="data-[state=checked]:bg-[#19352d] data-[state=checked]:border-[#19352d]"
              />
              <Label
                htmlFor="admin-view"
                className="text-[10px] text-slate-500 font-medium cursor-pointer"
              >
                Admin view
              </Label>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={handleRescan}
              className="h-auto inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white border-[#dfe5e1] text-[10px] font-semibold text-slate-600 hover:border-[#aebfb5] hover:bg-white"
            >
              <RefreshCw size={13} /> Rescan
            </Button>
          </div>
        </div>

        {/* KPI STRIP */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 mb-6">
          <KPI
            label="Live Projects"
            value={kpi.live}
            meta="Active in PROJECTS sheet"
            icon={BriefcaseBusiness}
            onClick={() => setActiveTab("portfolio")}
          />
          <KPI
            label="Gates Awaiting Approval"
            value={kpi.awaiting}
            meta="100% complete, unsigned"
            icon={ShieldCheck}
            tone="gate"
            onClick={() => {
              setActiveTab("portfolio");
              setHealthFilter("gate");
            }}
          />
          <KPI
            label="Stalled Phases"
            value={kpi.stalled}
            meta="7+ days no activity"
            icon={Clock3}
            tone={kpi.stalled ? "danger" : undefined}
            onClick={() => setActiveTab("actions")}
          />
          <KPI
            label="QC Failures"
            value={kpi.failed}
            meta="Failed checklist items"
            icon={ShieldAlert}
            tone={kpi.failed ? "danger" : undefined}
            onClick={() => setActiveTab("qc")}
          />
          <KPI
            label="Documents Pending"
            value={kpi.docsMissing}
            meta="Mandatory, in open phases"
            icon={FileText}
            tone={kpi.docsMissing ? "danger" : undefined}
            onClick={() => setActiveTab("documents")}
          />
          <KPI
            label="Portfolio Value"
            value={formatINR(kpi.value)}
            meta="Across active projects"
            icon={DollarSign}
            onClick={() => setActiveTab("commercial")}
          />
        </div>

        {/* TABS */}
        <TabNav
          active={activeTab}
          onChange={setActiveTab}
          counts={{
            actions: actions.length,
            documents: docStats.missing,
            qc: openTasks.length,
          }}
        />

        {/* PORTFOLIO TAB */}
        {activeTab === "portfolio" && (
          <section className="mb-6">
            <SectionHeader
              eyebrow="Portfolio"
              title="Project Execution"
              action="View all projects"
              onAction={() => navigate(ROUTES.projects)}
            />

            <Card className="bg-white border border-[#e4e8e5] rounded-xl px-3 py-2.5 mb-4 flex flex-col md:flex-row gap-2 shadow-none">
              <div className="relative flex-1 max-w-[360px]">
                <Search
                  size={13}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Filter command centre..."
                  className="w-full h-8 pl-8 pr-3 rounded-lg bg-[#fafbfa] border-[#edf0ee] text-[10px] text-slate-700 placeholder:text-slate-400 focus-visible:border-[#b9c9c1] focus-visible:ring-0"
                />
              </div>
              <div className="flex items-center gap-1.5 overflow-x-auto">
                {[
                  ["all", "All Projects"],
                  ["progress", "On Track"],
                  ["gate", "Gate Pending"],
                  ["danger", "Attention"],
                ].map(([value, label]) => (
                  <Button
                    type="button"
                    key={value}
                    onClick={() => setHealthFilter(value)}
                    className={cn(
                      "whitespace-nowrap px-3 h-8 rounded-lg text-[9px] font-semibold transition",
                      healthFilter === value
                        ? "bg-[#19352d] text-white hover:bg-[#0f231d]"
                        : "bg-[#f7f9f7] text-slate-500 hover:bg-[#eef3ef]",
                    )}
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </Card>

            <ProjectExecutionBoard
              rows={filteredRows}
              expanded={expanded}
              onToggle={(code) => setExpanded(expanded === code ? null : code)}
              onOpenProject={(code) => navigate(ROUTES.project(code))}
              isAdmin={isAdmin}
              onApproveGate={handleApproveGate}
              onOpen={navigate}
              docOverrides={docOverrides}
              onUploadDoc={setUploadTarget}
            />
          </section>
        )}

        {/* ACTION REQUIRED TAB */}
        {activeTab === "actions" && (
          <section className="mb-6">
            <SectionHeader eyebrow="Blockers" title="Action Required" />
            <ActionRequired actions={actions} onOpen={navigate} />
          </section>
        )}

        {/* DOCUMENT CONTROL TAB */}
        {activeTab === "documents" && (
          <section className="mb-6">
            <SectionHeader
              eyebrow="Evidence"
              title="Document Control"
              action="Open documents module"
              onAction={() => navigate(ROUTES.documents)}
            />
            <DocumentControl
              docStats={docStats}
              missingDocs={missingDocsList}
              onOpen={navigate}
            />
          </section>
        )}

        {/* SITE EXECUTION TAB */}
        {activeTab === "execution" && (
          <section className="mb-6">
            <SectionHeader eyebrow="On site" title="Site Execution" />
            <SiteExecution projects={PROJECTS} onOpen={navigate} />
          </section>
        )}

        {/* EXECUTION & QC CHECKS TAB */}
        {activeTab === "qc" && (
          <section className="mb-6">
            <SectionHeader eyebrow="Checklist" title="Execution & QC Checks" />
            <TaskQCPanel openTasks={openTasks} onOpen={navigate} />
          </section>
        )}

        {/* COMMERCIAL TAB */}
        {activeTab === "commercial" && (
          <section className="mb-6">
            <SectionHeader eyebrow="BOQ & Costing" title="Commercial" />
            <CommercialPanel projects={PROJECTS} onOpen={navigate} />
          </section>
        )}

        {/* TEAM WORKLOAD TAB */}
        {activeTab === "team" && (
          <section className="mb-6">
            <SectionHeader eyebrow="Roles" title="Team Workload" />
            <TeamWorkload roleLoad={roleLoad} onOpen={navigate} />
          </section>
        )}

        {/* LIVE ACTIVITY TAB */}
        {activeTab === "activity" && (
          <section className="mb-6">
            <SectionHeader eyebrow="LOG sheet" title="Live Activity" />
            <ActivityTimeline activities={log} />
          </section>
        )}
      </main>

      {uploadTarget && (
        <UploadDocumentModal
          target={uploadTarget}
          onClose={() => setUploadTarget(null)}
          onSubmit={handleUploadDocument}
        />
      )}

      <Toast message={toast} />
    </div>
  );
}
