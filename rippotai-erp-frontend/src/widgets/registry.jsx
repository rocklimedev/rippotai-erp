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
