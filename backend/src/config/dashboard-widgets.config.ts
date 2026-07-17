/**
 * Static, developer-curated widget catalog per app.
 *
 * This mirrors the frontend `WIDGETS` registry in widgets/registry.jsx —
 * every `key` here MUST have a matching component registered there, or the
 * frontend will render the "Unknown widget" fallback.
 *
 * Nothing in here is user-editable. Users only get to choose an ARRANGEMENT
 * (position/size) and a HIDDEN set from this catalog — that part lives in
 * MySQL via UserDashboardLayout.
 */

export type WidgetSize = 'small' | 'medium' | 'large' | 'full';

export interface WidgetLibraryItem {
  key: string;
  name: string;
  description?: string;
  category:
    | 'Recommended'
    | 'Recently Used'
    | 'App Data'
    | 'Project Data'
    | 'Personal Work'
    | 'Alerts'
    | 'Reports';
  sizes: WidgetSize[];
  defaultSize: WidgetSize;
  locked_required?: boolean; // cannot be removed if true (also enforced server-side via requiredKeys)
}

export interface LayoutItem {
  key: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface AppDashboardConfig {
  widgets: WidgetLibraryItem[];
  defaultLayout: LayoutItem[];
  requiredKeys: string[];
}

export const DASHBOARD_CONFIG: Record<string, AppDashboardConfig> = {
  // ------------------------------------------------------------------ BOQ
  boq: {
    widgets: [
      {
        key: 'boq.total_boqs',
        name: 'Total BOQs',
        description: 'Count of all BOQs',
        category: 'App Data',
        sizes: ['small'],
        defaultSize: 'small',
        locked_required: true,
      },
      {
        key: 'boq.draft_boqs',
        name: 'Draft BOQs',
        category: 'App Data',
        sizes: ['small'],
        defaultSize: 'small',
      },
      {
        key: 'boq.awaiting_approval',
        name: 'Awaiting Approval',
        category: 'App Data',
        sizes: ['small'],
        defaultSize: 'small',
      },
      {
        key: 'boq.approved_boqs',
        name: 'Approved BOQs',
        category: 'App Data',
        sizes: ['small'],
        defaultSize: 'small',
      },
      {
        key: 'boq.value_trend',
        name: 'BOQ Value Trend',
        description: 'Value trend, last 6 months',
        category: 'Reports',
        sizes: ['large', 'full'],
        defaultSize: 'large',
      },
      {
        key: 'boq.status_donut',
        name: 'BOQs by Status',
        category: 'Reports',
        sizes: ['medium', 'large'],
        defaultSize: 'medium',
      },
      {
        key: 'boq.monthly_volume',
        name: 'Monthly BOQ Volume',
        category: 'Reports',
        sizes: ['medium', 'large'],
        defaultSize: 'medium',
      },
      {
        key: 'boq.project_wise',
        name: 'Project-Wise BOQs',
        category: 'Project Data',
        sizes: ['large', 'full'],
        defaultSize: 'full',
      },
      {
        key: 'boq.recently_edited',
        name: 'Recently Edited BOQs',
        category: 'Recently Used',
        sizes: ['medium', 'large'],
        defaultSize: 'medium',
      },
      {
        key: 'boq.value_summary',
        name: 'Approved BOQ Value',
        category: 'App Data',
        sizes: ['small'],
        defaultSize: 'small',
      },
      {
        key: 'boq.attention_items',
        name: 'Items Requiring Attention',
        category: 'Alerts',
        sizes: ['medium'],
        defaultSize: 'medium',
      },
      {
        key: 'boq.version_activity',
        name: 'Version Activity',
        category: 'Reports',
        sizes: ['medium', 'large'],
        defaultSize: 'medium',
      },
      {
        key: 'boq.quick_create',
        name: 'Create BOQ',
        category: 'Personal Work',
        sizes: ['small'],
        defaultSize: 'small',
      },
    ],
    defaultLayout: [
      { key: 'boq.total_boqs', x: 0, y: 0, w: 3, h: 2 },
      { key: 'boq.draft_boqs', x: 3, y: 0, w: 3, h: 2 },
      { key: 'boq.awaiting_approval', x: 6, y: 0, w: 3, h: 2 },
      { key: 'boq.approved_boqs', x: 9, y: 0, w: 3, h: 2 },
      { key: 'boq.value_trend', x: 0, y: 2, w: 6, h: 4 },
      { key: 'boq.status_donut', x: 6, y: 2, w: 6, h: 4 },
      { key: 'boq.project_wise', x: 0, y: 6, w: 12, h: 4 },
      { key: 'boq.recently_edited', x: 0, y: 10, w: 6, h: 3 },
      { key: 'boq.attention_items', x: 6, y: 10, w: 6, h: 3 },
    ],
    requiredKeys: ['boq.total_boqs'],
  },

  // -------------------------------------------------------------- Projects
  projects: {
    widgets: [
      {
        key: 'projects.total',
        name: 'Total Projects',
        category: 'App Data',
        sizes: ['small'],
        defaultSize: 'small',
        locked_required: true,
      },
      {
        key: 'projects.active',
        name: 'Active Projects',
        category: 'App Data',
        sizes: ['small'],
        defaultSize: 'small',
      },
      {
        key: 'projects.on_time',
        name: 'On-Time',
        category: 'App Data',
        sizes: ['small'],
        defaultSize: 'small',
      },
      {
        key: 'projects.at_risk',
        name: 'At-Risk',
        category: 'Alerts',
        sizes: ['small'],
        defaultSize: 'small',
      },
      {
        key: 'projects.delayed',
        name: 'Delayed',
        category: 'Alerts',
        sizes: ['small'],
        defaultSize: 'small',
      },
      {
        key: 'projects.progress_trend',
        name: 'Portfolio Progress Trend',
        category: 'Reports',
        sizes: ['large', 'full'],
        defaultSize: 'large',
      },
      {
        key: 'projects.phase_donut',
        name: 'Projects by Phase',
        category: 'Reports',
        sizes: ['medium', 'large'],
        defaultSize: 'medium',
      },
      {
        key: 'projects.variance_bar',
        name: 'Timeline Variance',
        category: 'Reports',
        sizes: ['medium', 'large'],
        defaultSize: 'medium',
      },
      {
        key: 'projects.project_wise_progress',
        name: 'Project-Wise Progress',
        category: 'Project Data',
        sizes: ['large', 'full'],
        defaultSize: 'full',
      },
      {
        key: 'projects.upcoming_milestones',
        name: 'Upcoming Milestones',
        category: 'Project Data',
        sizes: ['medium'],
        defaultSize: 'medium',
      },
      {
        key: 'projects.current_phases',
        name: 'Current Phases',
        category: 'Reports',
        sizes: ['medium'],
        defaultSize: 'medium',
      },
      {
        key: 'projects.pending_work',
        name: 'Pending Work',
        category: 'App Data',
        sizes: ['small'],
        defaultSize: 'small',
      },
      {
        key: 'projects.handover_readiness',
        name: 'Handover Readiness',
        category: 'Alerts',
        sizes: ['medium'],
        defaultSize: 'medium',
      },
      {
        key: 'projects.recent_activity',
        name: 'Recent Project Activity',
        category: 'Recently Used',
        sizes: ['medium', 'large'],
        defaultSize: 'medium',
      },
    ],
    defaultLayout: [
      { key: 'projects.total', x: 0, y: 0, w: 3, h: 2 },
      { key: 'projects.active', x: 3, y: 0, w: 3, h: 2 },
      { key: 'projects.at_risk', x: 6, y: 0, w: 3, h: 2 },
      { key: 'projects.delayed', x: 9, y: 0, w: 3, h: 2 },
      { key: 'projects.progress_trend', x: 0, y: 2, w: 6, h: 4 },
      { key: 'projects.phase_donut', x: 6, y: 2, w: 6, h: 4 },
      { key: 'projects.project_wise_progress', x: 0, y: 6, w: 12, h: 4 },
      { key: 'projects.upcoming_milestones', x: 0, y: 10, w: 6, h: 3 },
      { key: 'projects.recent_activity', x: 6, y: 10, w: 6, h: 3 },
    ],
    requiredKeys: ['projects.total'],
  },

  // --------------------------------------------------------------- Vendors
  vendors: {
    widgets: [
      {
        key: 'vendors.total',
        name: 'Total Vendors',
        category: 'App Data',
        sizes: ['small'],
        defaultSize: 'small',
        locked_required: true,
      },
      {
        key: 'vendors.verified',
        name: 'Verified',
        category: 'App Data',
        sizes: ['small'],
        defaultSize: 'small',
      },
      {
        key: 'vendors.available',
        name: 'Available',
        category: 'App Data',
        sizes: ['small'],
        defaultSize: 'small',
      },
      {
        key: 'vendors.attention',
        name: 'Requiring Attention',
        category: 'Alerts',
        sizes: ['small'],
        defaultSize: 'small',
      },
      {
        key: 'vendors.onboarding_trend',
        name: 'Vendor Onboarding',
        category: 'Reports',
        sizes: ['large', 'full'],
        defaultSize: 'large',
      },
      {
        key: 'vendors.availability_donut',
        name: 'Vendor Availability',
        category: 'Reports',
        sizes: ['medium', 'large'],
        defaultSize: 'medium',
      },
      {
        key: 'vendors.category_bar',
        name: 'Category-Wise Vendors (chart)',
        category: 'Reports',
        sizes: ['medium', 'large'],
        defaultSize: 'medium',
      },
      {
        key: 'vendors.category_wise',
        name: 'Category-Wise Vendors (list)',
        category: 'App Data',
        sizes: ['medium', 'large'],
        defaultSize: 'medium',
      },
      {
        key: 'vendors.project_wise',
        name: 'Project-Wise Assigned Vendors',
        category: 'Project Data',
        sizes: ['large', 'full'],
        defaultSize: 'full',
      },
      {
        key: 'vendors.recently_added',
        name: 'Recently Added Vendors',
        category: 'Recently Used',
        sizes: ['medium', 'large'],
        defaultSize: 'medium',
      },
      {
        key: 'vendors.expiring_docs',
        name: 'Expiring Docs',
        category: 'Alerts',
        sizes: ['small'],
        defaultSize: 'small',
      },
      {
        key: 'vendors.performance',
        name: 'Performance Summary',
        category: 'Reports',
        sizes: ['medium', 'large'],
        defaultSize: 'medium',
      },
    ],
    defaultLayout: [
      { key: 'vendors.total', x: 0, y: 0, w: 3, h: 2 },
      { key: 'vendors.verified', x: 3, y: 0, w: 3, h: 2 },
      { key: 'vendors.available', x: 6, y: 0, w: 3, h: 2 },
      { key: 'vendors.attention', x: 9, y: 0, w: 3, h: 2 },
      { key: 'vendors.onboarding_trend', x: 0, y: 2, w: 6, h: 4 },
      { key: 'vendors.availability_donut', x: 6, y: 2, w: 6, h: 4 },
      { key: 'vendors.project_wise', x: 0, y: 6, w: 12, h: 4 },
      { key: 'vendors.recently_added', x: 0, y: 10, w: 6, h: 3 },
      { key: 'vendors.performance', x: 6, y: 10, w: 6, h: 3 },
    ],
    requiredKeys: ['vendors.total'],
  },

  // ----------------------------------------------------------- Quotations
  // NOTE: appKey is "quotations" but widget keys keep the "quot." prefix
  // used in the frontend registry — the two don't need to match.
  quotations: {
    widgets: [
      {
        key: 'quot.total',
        name: 'Total Estimates',
        category: 'App Data',
        sizes: ['small'],
        defaultSize: 'small',
        locked_required: true,
      },
      {
        key: 'quot.awaiting_approval',
        name: 'Awaiting Approval',
        category: 'App Data',
        sizes: ['small'],
        defaultSize: 'small',
      },
      {
        key: 'quot.drafts',
        name: 'Draft Estimates',
        category: 'App Data',
        sizes: ['small'],
        defaultSize: 'small',
      },
      {
        key: 'quot.selected',
        name: 'Selected Estimates',
        category: 'App Data',
        sizes: ['medium'],
        defaultSize: 'medium',
      },
      {
        key: 'quot.value_trend',
        name: 'Estimate Value Trend',
        category: 'Reports',
        sizes: ['large', 'full'],
        defaultSize: 'large',
      },
      {
        key: 'quot.status_donut',
        name: 'Estimates by Status',
        category: 'Reports',
        sizes: ['medium', 'large'],
        defaultSize: 'medium',
      },
      {
        key: 'quot.variance_bar',
        name: 'BOQ vs Estimate Variance',
        category: 'Reports',
        sizes: ['medium', 'large'],
        defaultSize: 'medium',
      },
      {
        key: 'quot.project_wise',
        name: 'Project-Wise Estimates',
        category: 'Project Data',
        sizes: ['large', 'full'],
        defaultSize: 'full',
      },
      {
        key: 'quot.expiring_soon',
        name: 'Expiring Soon',
        category: 'Alerts',
        sizes: ['medium'],
        defaultSize: 'medium',
      },
      {
        key: 'quot.boq_variation',
        name: 'BOQ Variation %',
        category: 'App Data',
        sizes: ['small'],
        defaultSize: 'small',
      },
      {
        key: 'quot.recently_received',
        name: 'Recently Received',
        category: 'Recently Used',
        sizes: ['medium', 'large'],
        defaultSize: 'medium',
      },
      {
        key: 'quot.recent_comparisons',
        name: 'Recent Comparisons',
        category: 'Recently Used',
        sizes: ['medium'],
        defaultSize: 'medium',
      },
      {
        key: 'quot.returned',
        name: 'Returned Estimates',
        category: 'Alerts',
        sizes: ['medium'],
        defaultSize: 'medium',
      },
    ],
    defaultLayout: [
      { key: 'quot.total', x: 0, y: 0, w: 3, h: 2 },
      { key: 'quot.awaiting_approval', x: 3, y: 0, w: 3, h: 2 },
      { key: 'quot.drafts', x: 6, y: 0, w: 3, h: 2 },
      { key: 'quot.boq_variation', x: 9, y: 0, w: 3, h: 2 },
      { key: 'quot.value_trend', x: 0, y: 2, w: 6, h: 4 },
      { key: 'quot.status_donut', x: 6, y: 2, w: 6, h: 4 },
      { key: 'quot.project_wise', x: 0, y: 6, w: 12, h: 4 },
      { key: 'quot.recently_received', x: 0, y: 10, w: 6, h: 3 },
      { key: 'quot.expiring_soon', x: 6, y: 10, w: 6, h: 3 },
    ],
    requiredKeys: ['quot.total'],
  },

  // -------------------------------------------------------------- Tasks
  tasks: {
    widgets: [
      {
        key: 'tasks.due_today',
        name: 'Due Today',
        category: 'App Data',
        sizes: ['small'],
        defaultSize: 'small',
        locked_required: true,
      },
      {
        key: 'tasks.overdue',
        name: 'Overdue',
        category: 'Alerts',
        sizes: ['small'],
        defaultSize: 'small',
      },
      {
        key: 'tasks.mine',
        name: 'My Tasks',
        category: 'Personal Work',
        sizes: ['medium', 'large'],
        defaultSize: 'large',
      },
    ],
    defaultLayout: [
      { key: 'tasks.due_today', x: 0, y: 0, w: 3, h: 2 },
      { key: 'tasks.overdue', x: 3, y: 0, w: 3, h: 2 },
      { key: 'tasks.mine', x: 0, y: 2, w: 6, h: 4 },
    ],
    requiredKeys: ['tasks.due_today'],
  },

  // ------------------------------------------------------------ Documents
  documents: {
    widgets: [
      {
        key: 'documents.recent',
        name: 'Recent Documents',
        category: 'Recently Used',
        sizes: ['medium', 'large'],
        defaultSize: 'large',
        locked_required: true,
      },
      {
        key: 'documents.pending',
        name: 'Pending Uploads',
        category: 'Alerts',
        sizes: ['small'],
        defaultSize: 'small',
      },
    ],
    defaultLayout: [
      { key: 'documents.pending', x: 0, y: 0, w: 3, h: 2 },
      { key: 'documents.recent', x: 0, y: 2, w: 9, h: 4 },
    ],
    requiredKeys: ['documents.recent'],
  },

  // To add another app (e.g. "clients"), add a new key here with the same
  // shape — no other backend changes are required.
};

export function getAppConfig(appKey: string): AppDashboardConfig | null {
  return DASHBOARD_CONFIG[appKey] ?? null;
}
