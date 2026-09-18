import React from "react";
import { StubWidget } from "./common/hooks";

import {
  BoqTotalBoqs,
  BoqDraftBoqs,
  BoqAwaitingApproval,
  BoqApprovedBoqs,
  BoqAvgCreationTime,
  BoqHoursSaved,
  BoqQuickCreate,
  BoqRecentlyEdited,
  BoqValueSummary,
  BoqRecentlyApproved,
  BoqAttentionItems,
  BoqVersionActivity,
  BoqProjectWise,
  BoqValueTrend,
  BoqMonthlyVolume,
  BoqStatusDonut,
  BoqRecentlyEditedList,
} from "./boqs";

import {
  ProjTotal,
  ProjActive,
  ProjOnTime,
  ProjAtRisk,
  ProjDelayed,
  ProjProgressTrend,
  ProjPhaseDonut,
  ProjVarianceBar,
  ProjProjectWiseProgress,
  ProjUpcomingMilestones4,
  ProjCurrentPhases,
  ProjUpcomingMilestones,
  ProjPendingWork,
  ProjHandoverReadiness,
  ProjTimelineVariance,
  ProjRecentActivity,
} from "./projects";

import {
  VendorsTotal,
  VendorsVerified,
  VendorsAvailable,
  VendorsExpiring,
  VendorsOnboardingTrend,
  VendorsAvailabilityDonut,
  VendorsCategoryBar,
  VendorsCategoryWise,
  VendorsProjectWise,
  VendorsRecentlyAddedList,
  VendorsPerformance,
  VendorsByCategory,
  VendorsRecentlyAdded,
  VendorsSavedSearches,
  VendorsAttention,
} from "./vendors";

import {
  QuotTotal,
  QuotAwaitingApproval,
  QuotDrafts,
  QuotSelected,
  QuotValueTrend,
  QuotStatusDonut,
  QuotVarianceBar,
  QuotProjectWise,
  QuotExpiringSoonList,
  QuotBoqVariance,
  QuotRecentlyReceived,
  QuotRecentComparisons,
  QuotReturned,
  QuotAwaitingReview,
} from "./quots";

import {
  CalendarTodayW,
  CalendarUpcomingW,
  TasksDueTodayW,
  TasksOverdueW,
  TasksMineW,
  NotesRecentW,
  NotesPinnedW,
  DocumentsRecent,
  DocumentsPending,
} from "./calendar";

import {
  MatTotalMaterials,
  MatStockValue,
  MatLowStock,
  MatOutOfStock,
  MatPendingRequests,
  MatActivePurchaseOrders,
  MatPendingGRN,
  MatInwardToday,
  MatOutwardToday,
  MatLowStockList,
  MatRequestsList,
  MatPurchaseOrdersList,
  MatRecentMovements,
  MatCategoryWise,
  MatRecentActivity,
} from "./materials";

import {
  SiteOpsTodayReport,
  SiteOpsOpenRfis,
  SiteOpsHandoffBlocked,
  SiteOpsTodayVisits,
  SiteOpsQcPassRate,
  SiteOpsFailedQc,
  SiteOpsPendingMockups,
  SiteOpsTotalReports,
  SiteOpsRecentReports,
  SiteOpsRecentVisits,
  SiteOpsRfiQueue,
  SiteOpsMockupApprovals,
  SiteOpsRecentActivity,
} from "./siteops";

import {
  LedgerTotalContractValue,
  LedgerTotalPayable,
  LedgerTotalCollected,
  LedgerOutstanding,
  LedgerActiveSchedules,
  LedgerPendingMilestones,
  LedgerCompletedSchedules,
  LedgerCollectionRate,
  LedgerPaymentSchedulesList,
  LedgerUpcomingPaymentsList,
  LedgerOverduePaymentsList,
  LedgerRecentPaymentsList,
  LedgerRecentActivity,
} from "./ledger";

import {
  DesignActiveProjects,
  DesignDesignTasks,
  DesignPendingApprovals,
  DesignTeamUtilization,
  DesignPipelineStages,
  DesignProjectsList,
  DesignApprovalsList,
  DesignTasksList,
  DesignUpcomingDeadlines,
  DesignTeamWorkload,
  DesignRecentActivity,
} from "./design-studio";

import {
  CrmTotalLeads,
  CrmActiveProjects,
  CrmActivePlans,
  CrmPayableAmount,
  CrmLeadsBreakdown,
  CrmProjectsBreakdown,
  CrmProjectBriefs,
  CrmSiteRecce,
  CrmPlansOfAction,
  CrmScopeOfWork,
  CrmPaymentSchedules,
  CrmUpcomingDeadlines,
  CrmRecentActivity,
} from "./crm";

import {
  AdminActiveProjects,
  AdminOpenLeads,
  AdminPendingApprovals,
  AdminTeamMembers,
  AdminProjectsList,
  AdminApprovalsList,
  AdminLeadPipeline,
  AdminRecentActivity,
  AdminTeamList,
  AdminWorkflowSnapshot,
} from "./admin";

/* -------- Registry --------
 * Same keys as the original monolithic registry.jsx, just sourced from
 * per-domain modules now. Nothing that reads WIDGETS[key] needs to change.
 */
export const WIDGETS = {
  // BOQ
  "boq.total_boqs": BoqTotalBoqs,
  "boq.draft_boqs": BoqDraftBoqs,
  "boq.awaiting_approval": BoqAwaitingApproval,
  "boq.approved_boqs": BoqApprovedBoqs,
  "boq.project_wise": BoqProjectWise,
  "boq.recently_edited": BoqRecentlyEditedList,
  "boq.value_trend": BoqValueTrend,
  "boq.status_donut": BoqStatusDonut,
  "boq.monthly_volume": BoqMonthlyVolume,
  "boq.value_summary": BoqValueSummary,
  "boq.attention_items": BoqAttentionItems,
  "boq.version_activity": BoqVersionActivity,
  "boq.quick_create": BoqQuickCreate,
  // legacy keys kept for back-compat with saved layouts
  "boq.avg_creation_time": BoqAvgCreationTime,
  "boq.hours_saved": BoqHoursSaved,
  "boq.recently_approved": BoqRecentlyApproved,

  // Projects
  "projects.total": ProjTotal,
  "projects.active": ProjActive,
  "projects.on_time": ProjOnTime,
  "projects.at_risk": ProjAtRisk,
  "projects.delayed": ProjDelayed,
  "projects.progress_trend": ProjProgressTrend,
  "projects.phase_donut": ProjPhaseDonut,
  "projects.variance_bar": ProjVarianceBar,
  "projects.project_wise_progress": ProjProjectWiseProgress,
  "projects.upcoming_milestones": ProjUpcomingMilestones4,
  "projects.current_phases": ProjCurrentPhases,
  "projects.pending_work": ProjPendingWork,
  "projects.handover_readiness": ProjHandoverReadiness,
  "projects.timeline_variance": ProjTimelineVariance,
  "projects.recent_activity": ProjRecentActivity,

  // Vendors
  "vendors.total": VendorsTotal,
  "vendors.verified": VendorsVerified,
  "vendors.available": VendorsAvailable,
  "vendors.attention": VendorsAttention,
  "vendors.onboarding_trend": VendorsOnboardingTrend,
  "vendors.availability_donut": VendorsAvailabilityDonut,
  "vendors.category_bar": VendorsCategoryBar,
  "vendors.category_wise": VendorsCategoryWise,
  "vendors.project_wise": VendorsProjectWise,
  "vendors.recently_added": VendorsRecentlyAddedList,
  "vendors.expiring_docs": VendorsExpiring,
  "vendors.performance": VendorsPerformance,
  // legacy
  "vendors.by_category": VendorsByCategory,
  "vendors.saved_searches": VendorsSavedSearches,

  // Quotations
  "quot.total": QuotTotal,
  "quot.awaiting_approval": QuotAwaitingApproval,
  "quot.drafts": QuotDrafts,
  "quot.selected": QuotSelected,
  "quot.value_trend": QuotValueTrend,
  "quot.status_donut": QuotStatusDonut,
  "quot.variance_bar": QuotVarianceBar,
  "quot.project_wise": QuotProjectWise,
  "quot.expiring_soon": QuotExpiringSoonList,
  "quot.boq_variation": QuotBoqVariance,
  "quot.recently_received": QuotRecentlyReceived,
  "quot.recent_comparisons": QuotRecentComparisons,
  "quot.returned": QuotReturned,
  // legacy
  "quot.awaiting_review": QuotAwaitingReview,

  // Materials
  "materials.total_materials": MatTotalMaterials,
  "materials.stock_value": MatStockValue,
  "materials.low_stock": MatLowStock,
  "materials.out_of_stock": MatOutOfStock,
  "materials.pending_requests": MatPendingRequests,
  "materials.active_purchase_orders": MatActivePurchaseOrders,
  "materials.pending_grn": MatPendingGRN,
  "materials.inward_today": MatInwardToday,
  "materials.outward_today": MatOutwardToday,
  "materials.low_stock_list": MatLowStockList,
  "materials.requests_list": MatRequestsList,
  "materials.purchase_orders_list": MatPurchaseOrdersList,
  "materials.recent_movements": MatRecentMovements,
  "materials.category_wise": MatCategoryWise,
  "materials.recent_activity": MatRecentActivity,

  // Site Operations
  "siteops.today_report": SiteOpsTodayReport,
  "siteops.open_rfis": SiteOpsOpenRfis,
  "siteops.handoff_blocked": SiteOpsHandoffBlocked,
  "siteops.today_visits": SiteOpsTodayVisits,
  "siteops.qc_pass_rate": SiteOpsQcPassRate,
  "siteops.failed_qc": SiteOpsFailedQc,
  "siteops.pending_mockups": SiteOpsPendingMockups,
  "siteops.total_reports": SiteOpsTotalReports,
  "siteops.recent_reports": SiteOpsRecentReports,
  "siteops.recent_visits": SiteOpsRecentVisits,
  "siteops.rfi_queue": SiteOpsRfiQueue,
  "siteops.mockup_approvals": SiteOpsMockupApprovals,
  "siteops.recent_activity": SiteOpsRecentActivity,

  // Ledger
  "ledger.total_contract_value": LedgerTotalContractValue,
  "ledger.total_payable": LedgerTotalPayable,
  "ledger.total_collected": LedgerTotalCollected,
  "ledger.outstanding": LedgerOutstanding,
  "ledger.active_schedules": LedgerActiveSchedules,
  "ledger.pending_milestones": LedgerPendingMilestones,
  "ledger.completed_schedules": LedgerCompletedSchedules,
  "ledger.collection_rate": LedgerCollectionRate,
  "ledger.payment_schedules": LedgerPaymentSchedulesList,
  "ledger.upcoming_payments": LedgerUpcomingPaymentsList,
  "ledger.overdue_payments": LedgerOverduePaymentsList,
  "ledger.recent_payments": LedgerRecentPaymentsList,
  "ledger.recent_activity": LedgerRecentActivity,

  // Design Studio
  "design_studio.active_projects": DesignActiveProjects,
  "design_studio.design_tasks": DesignDesignTasks,
  "design_studio.pending_approvals": DesignPendingApprovals,
  "design_studio.team_utilization": DesignTeamUtilization,
  "design_studio.pipeline_stages": DesignPipelineStages,
  "design_studio.projects_list": DesignProjectsList,
  "design_studio.approvals_list": DesignApprovalsList,
  "design_studio.tasks_list": DesignTasksList,
  "design_studio.upcoming_deadlines": DesignUpcomingDeadlines,
  "design_studio.team_workload": DesignTeamWorkload,
  "design_studio.recent_activity": DesignRecentActivity,

  // CRM
  "crm.total_leads": CrmTotalLeads,
  "crm.active_projects": CrmActiveProjects,
  "crm.active_plans": CrmActivePlans,
  "crm.payable_amount": CrmPayableAmount,
  "crm.leads_breakdown": CrmLeadsBreakdown,
  "crm.projects_breakdown": CrmProjectsBreakdown,
  "crm.project_briefs": CrmProjectBriefs,
  "crm.site_recce": CrmSiteRecce,
  "crm.plans_of_action": CrmPlansOfAction,
  "crm.scope_of_work": CrmScopeOfWork,
  "crm.payment_schedules": CrmPaymentSchedules,
  "crm.upcoming_deadlines": CrmUpcomingDeadlines,
  "crm.recent_activity": CrmRecentActivity,

  // Admin
  "admin.active_projects": AdminActiveProjects,
  "admin.open_leads": AdminOpenLeads,
  "admin.pending_approvals": AdminPendingApprovals,
  "admin.team_members": AdminTeamMembers,
  "admin.projects_list": AdminProjectsList,
  "admin.approvals_list": AdminApprovalsList,
  "admin.lead_pipeline": AdminLeadPipeline,
  "admin.recent_activity": AdminRecentActivity,
  "admin.team_list": AdminTeamList,
  "admin.workflow_snapshot": AdminWorkflowSnapshot,

  // Placeholder app stubs
  "clients.total": () => (
    <StubWidget
      title="Total Clients"
      message="Activates when Clients app launches"
    />
  ),
  "clients.recent": () => (
    <StubWidget
      title="Recent Clients"
      message="This widget will activate when Clients launches"
    />
  ),
  "calendar.today": CalendarTodayW,
  "calendar.upcoming": CalendarUpcomingW,
  "chats.unread": () => (
    <StubWidget title="Unread" message="Activates when Chats launches" />
  ),
  "chats.mentions": () => (
    <StubWidget title="My Mentions" message="Activates when Chats launches" />
  ),
  "tasks.due_today": TasksDueTodayW,
  "tasks.overdue": TasksOverdueW,
  "tasks.mine": TasksMineW,
  "notes.recent": NotesRecentW,
  "notes.pinned": NotesPinnedW,
  "documents.recent": DocumentsRecent,
  "documents.pending": DocumentsPending,
  "activity.recent": () => (
    <StubWidget
      title="Recent Activity"
      message="Activates when Activity launches"
    />
  ),
  "activity.mine": () => (
    <StubWidget
      title="My Activity"
      message="Activates when Activity launches"
    />
  ),
  "inventory.total_items": () => (
    <StubWidget
      title="Total Items"
      message="Activates when Inventory launches"
    />
  ),
  "inventory.low_stock": () => (
    <StubWidget title="Low Stock" message="Activates when Inventory launches" />
  ),
};

export default WIDGETS;
