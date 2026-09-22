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
  // -------------------------------------------------------------- Leads
  leads: {
    widgets: [
      {
        key: 'leads.kpi_row',
        name: 'Lead Metrics',
        description: 'Overall lead KPIs',
        category: 'App Data',
        sizes: ['large', 'full'],
        defaultSize: 'large',
        locked_required: true,
      },
      {
        key: 'leads.conversion_stage',
        name: 'Conversion Rate by Stage',
        category: 'Reports',
        sizes: ['medium', 'large'],
        defaultSize: 'medium',
      },
      {
        key: 'leads.avg_time_stage',
        name: 'Average Time in Stage',
        category: 'Reports',
        sizes: ['medium', 'large'],
        defaultSize: 'medium',
      },
      {
        key: 'leads.by_source',
        name: 'Leads by Source',
        category: 'Reports',
        sizes: ['medium', 'large'],
        defaultSize: 'medium',
      },
      {
        key: 'leads.stuck',
        name: 'Stuck Leads',
        category: 'Alerts',
        sizes: ['medium', 'large'],
        defaultSize: 'medium',
      },
    ],

    defaultLayout: [
      { key: 'leads.kpi_row', x: 0, y: 0, w: 12, h: 3 },
      { key: 'leads.conversion_stage', x: 0, y: 3, w: 6, h: 4 },
      { key: 'leads.avg_time_stage', x: 6, y: 3, w: 6, h: 4 },
      { key: 'leads.by_source', x: 0, y: 7, w: 6, h: 4 },
      { key: 'leads.stuck', x: 6, y: 7, w: 6, h: 4 },
    ],

    requiredKeys: ['leads.kpi_row'],
  },

  // ------------------------------------------------------------- procurement
  procurement: {
    widgets: [
      {
        key: 'procurement.total_procurement',
        name: 'Total procurement',
        description: 'Count of all procurement, with total stock units',
        category: 'App Data',
        sizes: ['small'],
        defaultSize: 'small',
        locked_required: true,
      },
      {
        key: 'procurement.stock_value',
        name: 'Stock Value',
        category: 'App Data',
        sizes: ['small'],
        defaultSize: 'small',
      },
      {
        key: 'procurement.low_stock',
        name: 'Low Stock',
        category: 'Alerts',
        sizes: ['small'],
        defaultSize: 'small',
      },
      {
        key: 'procurement.out_of_stock',
        name: 'Out of Stock',
        category: 'Alerts',
        sizes: ['small'],
        defaultSize: 'small',
      },
      {
        key: 'procurement.pending_requests',
        name: 'Pending Requests',
        category: 'App Data',
        sizes: ['small'],
        defaultSize: 'small',
      },
      {
        key: 'procurement.active_purchase_orders',
        name: 'Active Purchase Orders',
        category: 'App Data',
        sizes: ['small'],
        defaultSize: 'small',
      },
      {
        key: 'procurement.pending_grn',
        name: 'Pending GRN',
        category: 'Alerts',
        sizes: ['small'],
        defaultSize: 'small',
      },
      {
        key: 'procurement.inward_today',
        name: 'Inward Today',
        category: 'App Data',
        sizes: ['small'],
        defaultSize: 'small',
      },
      {
        key: 'procurement.outward_today',
        name: 'Outward Today',
        category: 'App Data',
        sizes: ['small'],
        defaultSize: 'small',
      },
      {
        key: 'procurement.low_stock_list',
        name: 'Low Stock Alerts',
        category: 'Alerts',
        sizes: ['medium', 'large'],
        defaultSize: 'medium',
      },
      {
        key: 'procurement.requests_list',
        name: 'Material Requests',
        category: 'Project Data',
        sizes: ['medium', 'large'],
        defaultSize: 'medium',
      },
      {
        key: 'procurement.purchase_orders_list',
        name: 'Purchase Orders',
        category: 'Reports',
        sizes: ['medium', 'large'],
        defaultSize: 'medium',
      },
      {
        key: 'procurement.recent_movements',
        name: 'Recent Material Movement',
        category: 'Recently Used',
        sizes: ['medium', 'large'],
        defaultSize: 'medium',
      },
      {
        key: 'procurement.category_wise',
        name: 'Inventory by Category',
        category: 'Reports',
        sizes: ['medium', 'large'],
        defaultSize: 'medium',
      },
      {
        key: 'procurement.recent_activity',
        name: 'Recent Activity',
        category: 'Recently Used',
        sizes: ['medium', 'large'],
        defaultSize: 'medium',
      },
    ],
    defaultLayout: [
      { key: 'procurement.total_procurement', x: 0, y: 0, w: 3, h: 2 },
      { key: 'procurement.low_stock', x: 3, y: 0, w: 3, h: 2 },
      { key: 'procurement.pending_requests', x: 6, y: 0, w: 3, h: 2 },
      { key: 'procurement.active_purchase_orders', x: 9, y: 0, w: 3, h: 2 },
      { key: 'procurement.category_wise', x: 0, y: 2, w: 6, h: 4 },
      { key: 'procurement.low_stock_list', x: 6, y: 2, w: 6, h: 4 },
      { key: 'procurement.requests_list', x: 0, y: 6, w: 6, h: 3 },
      { key: 'procurement.recent_activity', x: 6, y: 6, w: 6, h: 3 },
    ],
    requiredKeys: ['procurement.total_procurement'],
  },
  // ------------------------------------------------------------- Inventory
  inventory: {
    widgets: [
      {
        key: 'inventory.total',
        name: 'Total Stock Items',
        description: 'Total number of inventory stock items',
        category: 'App Data',
        sizes: ['small'],
        defaultSize: 'small',
        locked_required: true,
      },
      {
        key: 'inventory.received',
        name: 'Stock Received',
        description: 'Total stock received',
        category: 'App Data',
        sizes: ['small'],
        defaultSize: 'small',
      },
      {
        key: 'inventory.issued',
        name: 'Stock Issued',
        description: 'Total stock issued',
        category: 'App Data',
        sizes: ['small'],
        defaultSize: 'small',
      },
      {
        key: 'inventory.low_stock',
        name: 'Low Stock',
        description: 'Inventory items below minimum stock level',
        category: 'Alerts',
        sizes: ['small'],
        defaultSize: 'small',
      },
      {
        key: 'inventory.by_category',
        name: 'Inventory by Category',
        category: 'Reports',
        sizes: ['medium', 'large'],
        defaultSize: 'medium',
      },
      {
        key: 'inventory.stock_mix',
        name: 'Stock Mix',
        category: 'Reports',
        sizes: ['medium', 'large'],
        defaultSize: 'medium',
      },
      {
        key: 'inventory.site_wise',
        name: 'Site-Wise Inventory',
        category: 'Project Data',
        sizes: ['large', 'full'],
        defaultSize: 'large',
      },
      {
        key: 'inventory.category_bar',
        name: 'Category-Wise Stock',
        category: 'Reports',
        sizes: ['medium', 'large'],
        defaultSize: 'medium',
      },
      {
        key: 'inventory.site_bar',
        name: 'Site-Wise Stock',
        category: 'Reports',
        sizes: ['medium', 'large'],
        defaultSize: 'medium',
      },
      {
        key: 'inventory.movement_trend',
        name: 'Stock Movement Trend',
        description: 'Received vs issued inventory movement',
        category: 'Reports',
        sizes: ['large', 'full'],
        defaultSize: 'large',
      },
      {
        key: 'inventory.low_stock_list',
        name: 'Low Stock Alerts',
        category: 'Alerts',
        sizes: ['medium', 'large'],
        defaultSize: 'medium',
      },
      {
        key: 'inventory.recent_transactions',
        name: 'Recent Transactions',
        category: 'Recently Used',
        sizes: ['medium', 'large'],
        defaultSize: 'medium',
      },
      {
        key: 'inventory.recently_added',
        name: 'Recently Added Stock',
        category: 'Recently Used',
        sizes: ['medium', 'large'],
        defaultSize: 'medium',
      },
      {
        key: 'inventory.category_wise',
        name: 'Category-Wise Inventory',
        category: 'App Data',
        sizes: ['medium', 'large'],
        defaultSize: 'medium',
      },
      {
        key: 'inventory.transactions_summary',
        name: 'Transaction Summary',
        category: 'Reports',
        sizes: ['medium', 'large'],
        defaultSize: 'medium',
      },
      {
        key: 'inventory.performance',
        name: 'Inventory Performance',
        category: 'Reports',
        sizes: ['medium', 'large'],
        defaultSize: 'medium',
      },
    ],

    defaultLayout: [
      {
        key: 'inventory.total',
        x: 0,
        y: 0,
        w: 3,
        h: 2,
      },
      {
        key: 'inventory.received',
        x: 3,
        y: 0,
        w: 3,
        h: 2,
      },
      {
        key: 'inventory.issued',
        x: 6,
        y: 0,
        w: 3,
        h: 2,
      },
      {
        key: 'inventory.low_stock',
        x: 9,
        y: 0,
        w: 3,
        h: 2,
      },
      {
        key: 'inventory.movement_trend',
        x: 0,
        y: 2,
        w: 6,
        h: 4,
      },
      {
        key: 'inventory.stock_mix',
        x: 6,
        y: 2,
        w: 6,
        h: 4,
      },
      {
        key: 'inventory.site_wise',
        x: 0,
        y: 6,
        w: 12,
        h: 4,
      },
      {
        key: 'inventory.category_wise',
        x: 0,
        y: 10,
        w: 6,
        h: 3,
      },
      {
        key: 'inventory.low_stock_list',
        x: 6,
        y: 10,
        w: 6,
        h: 3,
      },
      {
        key: 'inventory.recent_transactions',
        x: 0,
        y: 13,
        w: 6,
        h: 3,
      },
      {
        key: 'inventory.performance',
        x: 6,
        y: 13,
        w: 6,
        h: 3,
      },
    ],

    requiredKeys: ['inventory.total'],
  },
  // ------------------------------------------------------------- Site Ops
  // NOTE: appKey is "site_ops" but widget keys keep the "siteops." prefix
  // used in the frontend registry — the two don't need to match.
  siteOperations: {
    widgets: [
      {
        key: 'siteops.today_report',
        name: "Today's Site Report",
        category: 'App Data',
        sizes: ['small'],
        defaultSize: 'small',
        locked_required: true,
      },
      {
        key: 'siteops.open_rfis',
        name: 'Open RFIs',
        category: 'Alerts',
        sizes: ['small'],
        defaultSize: 'small',
      },
      {
        key: 'siteops.handoff_blocked',
        name: 'QC Handoffs Blocked',
        category: 'Alerts',
        sizes: ['small'],
        defaultSize: 'small',
      },
      {
        key: 'siteops.today_visits',
        name: "Today's Site Visits",
        category: 'App Data',
        sizes: ['small'],
        defaultSize: 'small',
      },
      {
        key: 'siteops.qc_pass_rate',
        name: 'QC Pass Rate',
        category: 'Reports',
        sizes: ['small'],
        defaultSize: 'small',
      },
      {
        key: 'siteops.failed_qc',
        name: 'Rework / Failed QC',
        category: 'Alerts',
        sizes: ['small'],
        defaultSize: 'small',
      },
      {
        key: 'siteops.pending_mockups',
        name: 'Mockup Approvals',
        category: 'App Data',
        sizes: ['small'],
        defaultSize: 'small',
      },
      {
        key: 'siteops.total_reports',
        name: 'Site Reports (30d)',
        category: 'App Data',
        sizes: ['small'],
        defaultSize: 'small',
      },
      {
        key: 'siteops.recent_reports',
        name: 'Daily Site Reports',
        category: 'Recently Used',
        sizes: ['medium', 'large'],
        defaultSize: 'medium',
      },
      {
        key: 'siteops.recent_visits',
        name: 'Site Visits',
        category: 'Project Data',
        sizes: ['medium', 'large'],
        defaultSize: 'medium',
      },
      {
        key: 'siteops.rfi_queue',
        name: 'RFI Queue',
        category: 'Alerts',
        sizes: ['medium', 'large'],
        defaultSize: 'medium',
      },
      {
        key: 'siteops.mockup_approvals',
        name: 'Mockups Awaiting Review',
        category: 'Alerts',
        sizes: ['medium', 'large'],
        defaultSize: 'medium',
      },
      {
        key: 'siteops.recent_activity',
        name: 'Recent Site Activity',
        category: 'Recently Used',
        sizes: ['medium', 'large'],
        defaultSize: 'medium',
      },
    ],
    defaultLayout: [
      { key: 'siteops.today_report', x: 0, y: 0, w: 3, h: 2 },
      { key: 'siteops.open_rfis', x: 3, y: 0, w: 3, h: 2 },
      { key: 'siteops.handoff_blocked', x: 6, y: 0, w: 3, h: 2 },
      { key: 'siteops.today_visits', x: 9, y: 0, w: 3, h: 2 },
      { key: 'siteops.recent_reports', x: 0, y: 2, w: 6, h: 4 },
      { key: 'siteops.rfi_queue', x: 6, y: 2, w: 6, h: 4 },
      { key: 'siteops.recent_visits', x: 0, y: 6, w: 6, h: 3 },
      { key: 'siteops.recent_activity', x: 6, y: 6, w: 6, h: 3 },
    ],
    requiredKeys: ['siteops.today_report'],
  },

  // -------------------------------------------------------------- Ledger
  ledger: {
    widgets: [
      {
        key: 'ledger.total_contract_value',
        name: 'Total Contract Value',
        category: 'App Data',
        sizes: ['small'],
        defaultSize: 'small',
        locked_required: true,
      },
      {
        key: 'ledger.total_payable',
        name: 'Total Payable',
        category: 'App Data',
        sizes: ['small'],
        defaultSize: 'small',
      },
      {
        key: 'ledger.total_collected',
        name: 'Total Collected',
        category: 'App Data',
        sizes: ['small'],
        defaultSize: 'small',
      },
      {
        key: 'ledger.outstanding',
        name: 'Outstanding',
        category: 'Alerts',
        sizes: ['small'],
        defaultSize: 'small',
      },
      {
        key: 'ledger.active_schedules',
        name: 'Active Schedules',
        category: 'App Data',
        sizes: ['small'],
        defaultSize: 'small',
      },
      {
        key: 'ledger.pending_milestones',
        name: 'Pending Milestones',
        category: 'App Data',
        sizes: ['small'],
        defaultSize: 'small',
      },
      {
        key: 'ledger.completed_schedules',
        name: 'Completed Schedules',
        category: 'App Data',
        sizes: ['small'],
        defaultSize: 'small',
      },
      {
        key: 'ledger.collection_rate',
        name: 'Collection Rate',
        category: 'Reports',
        sizes: ['small'],
        defaultSize: 'small',
      },
      {
        key: 'ledger.payment_schedules',
        name: 'Payment Schedules',
        category: 'Project Data',
        sizes: ['medium', 'large'],
        defaultSize: 'medium',
      },
      {
        key: 'ledger.upcoming_payments',
        name: 'Upcoming Payments',
        category: 'Alerts',
        sizes: ['medium', 'large'],
        defaultSize: 'medium',
      },
      {
        key: 'ledger.overdue_payments',
        name: 'Overdue Payments',
        category: 'Alerts',
        sizes: ['medium', 'large'],
        defaultSize: 'medium',
      },
      {
        key: 'ledger.recent_payments',
        name: 'Recent Payments',
        category: 'Recently Used',
        sizes: ['medium', 'large'],
        defaultSize: 'medium',
      },
      {
        key: 'ledger.recent_activity',
        name: 'Recent Activity',
        category: 'Recently Used',
        sizes: ['medium', 'large'],
        defaultSize: 'medium',
      },
    ],
    defaultLayout: [
      { key: 'ledger.total_contract_value', x: 0, y: 0, w: 3, h: 2 },
      { key: 'ledger.total_payable', x: 3, y: 0, w: 3, h: 2 },
      { key: 'ledger.total_collected', x: 6, y: 0, w: 3, h: 2 },
      { key: 'ledger.outstanding', x: 9, y: 0, w: 3, h: 2 },
      { key: 'ledger.payment_schedules', x: 0, y: 2, w: 6, h: 4 },
      { key: 'ledger.overdue_payments', x: 6, y: 2, w: 6, h: 4 },
      { key: 'ledger.upcoming_payments', x: 0, y: 6, w: 6, h: 3 },
      { key: 'ledger.recent_activity', x: 6, y: 6, w: 6, h: 3 },
    ],
    requiredKeys: ['ledger.total_contract_value'],
  },

  // --------------------------------------------------------- Design Studio
  design_studio: {
    widgets: [
      {
        key: 'design_studio.active_projects',
        name: 'Active Projects',
        category: 'App Data',
        sizes: ['small'],
        defaultSize: 'small',
        locked_required: true,
      },
      {
        key: 'design_studio.design_tasks',
        name: 'Design Tasks',
        category: 'App Data',
        sizes: ['small'],
        defaultSize: 'small',
      },
      {
        key: 'design_studio.pending_approvals',
        name: 'Pending Approvals',
        category: 'Alerts',
        sizes: ['small'],
        defaultSize: 'small',
      },
      {
        key: 'design_studio.team_utilization',
        name: 'Team Utilization',
        category: 'App Data',
        sizes: ['small'],
        defaultSize: 'small',
      },
      {
        key: 'design_studio.pipeline_stages',
        name: 'Design Pipeline',
        category: 'Reports',
        sizes: ['medium', 'large'],
        defaultSize: 'medium',
      },
      {
        key: 'design_studio.projects_list',
        name: 'Design Projects',
        category: 'Project Data',
        sizes: ['medium', 'large', 'full'],
        defaultSize: 'large',
      },
      {
        key: 'design_studio.approvals_list',
        name: 'Pending Approvals (list)',
        category: 'Alerts',
        sizes: ['medium', 'large'],
        defaultSize: 'medium',
      },
      {
        key: 'design_studio.tasks_list',
        name: 'Design Tasks (list)',
        category: 'Personal Work',
        sizes: ['medium', 'large'],
        defaultSize: 'medium',
      },
      {
        key: 'design_studio.upcoming_deadlines',
        name: 'Upcoming Deadlines',
        category: 'Alerts',
        sizes: ['medium', 'large'],
        defaultSize: 'medium',
      },
      {
        key: 'design_studio.team_workload',
        name: 'Studio Workload',
        category: 'Reports',
        sizes: ['medium', 'large'],
        defaultSize: 'medium',
      },
      {
        key: 'design_studio.recent_activity',
        name: 'Recent Activity',
        category: 'Recently Used',
        sizes: ['medium', 'large'],
        defaultSize: 'medium',
      },
    ],
    defaultLayout: [
      { key: 'design_studio.active_projects', x: 0, y: 0, w: 3, h: 2 },
      { key: 'design_studio.design_tasks', x: 3, y: 0, w: 3, h: 2 },
      { key: 'design_studio.pending_approvals', x: 6, y: 0, w: 3, h: 2 },
      { key: 'design_studio.team_utilization', x: 9, y: 0, w: 3, h: 2 },
      { key: 'design_studio.projects_list', x: 0, y: 2, w: 6, h: 4 },
      { key: 'design_studio.pipeline_stages', x: 6, y: 2, w: 6, h: 4 },
      { key: 'design_studio.approvals_list', x: 0, y: 6, w: 6, h: 3 },
      { key: 'design_studio.recent_activity', x: 6, y: 6, w: 6, h: 3 },
    ],
    requiredKeys: ['design_studio.active_projects'],
  },

  // ------------------------------------------------------------------ CRM
  crm: {
    widgets: [
      {
        key: 'crm.total_leads',
        name: 'Total Leads',
        category: 'App Data',
        sizes: ['small'],
        defaultSize: 'small',
        locked_required: true,
      },
      {
        key: 'crm.active_projects',
        name: 'Active Projects',
        category: 'App Data',
        sizes: ['small'],
        defaultSize: 'small',
      },
      {
        key: 'crm.active_plans',
        name: 'Active Plans',
        category: 'App Data',
        sizes: ['small'],
        defaultSize: 'small',
      },
      {
        key: 'crm.payable_amount',
        name: 'Payable Amount',
        category: 'App Data',
        sizes: ['small'],
        defaultSize: 'small',
      },
      {
        key: 'crm.leads_breakdown',
        name: 'Leads Pipeline',
        category: 'Reports',
        sizes: ['medium', 'large'],
        defaultSize: 'medium',
      },
      {
        key: 'crm.projects_breakdown',
        name: 'Project Portfolio',
        category: 'Reports',
        sizes: ['medium', 'large'],
        defaultSize: 'medium',
      },
      {
        key: 'crm.project_briefs',
        name: 'Project Briefs',
        category: 'App Data',
        sizes: ['small'],
        defaultSize: 'small',
      },
      {
        key: 'crm.site_recce',
        name: 'Site Recce',
        category: 'App Data',
        sizes: ['small'],
        defaultSize: 'small',
      },
      {
        key: 'crm.plans_of_action',
        name: 'Plans of Action',
        category: 'App Data',
        sizes: ['small'],
        defaultSize: 'small',
      },
      {
        key: 'crm.scope_of_work',
        name: 'Scope of Work',
        category: 'App Data',
        sizes: ['small'],
        defaultSize: 'small',
      },
      {
        key: 'crm.payment_schedules',
        name: 'Payment Schedules',
        category: 'App Data',
        sizes: ['small'],
        defaultSize: 'small',
      },
      {
        key: 'crm.upcoming_deadlines',
        name: 'Upcoming Deadlines',
        category: 'Alerts',
        sizes: ['medium', 'large'],
        defaultSize: 'medium',
      },
      {
        key: 'crm.recent_activity',
        name: 'Recent Activity',
        category: 'Recently Used',
        sizes: ['medium', 'large'],
        defaultSize: 'medium',
      },
    ],
    defaultLayout: [
      { key: 'crm.total_leads', x: 0, y: 0, w: 3, h: 2 },
      { key: 'crm.active_projects', x: 3, y: 0, w: 3, h: 2 },
      { key: 'crm.active_plans', x: 6, y: 0, w: 3, h: 2 },
      { key: 'crm.payable_amount', x: 9, y: 0, w: 3, h: 2 },
      { key: 'crm.leads_breakdown', x: 0, y: 2, w: 6, h: 4 },
      { key: 'crm.projects_breakdown', x: 6, y: 2, w: 6, h: 4 },
      { key: 'crm.upcoming_deadlines', x: 0, y: 6, w: 6, h: 3 },
      { key: 'crm.recent_activity', x: 6, y: 6, w: 6, h: 3 },
    ],
    requiredKeys: ['crm.total_leads'],
  },

  // ---------------------------------------------------------------- Admin
  adminConsole: {
    widgets: [
      {
        key: 'adminConsole.active_projects',
        name: 'Active Projects',
        category: 'App Data',
        sizes: ['small'],
        defaultSize: 'small',
        locked_required: true,
      },
      {
        key: 'adminConsole.open_leads',
        name: 'Open Leads',
        category: 'App Data',
        sizes: ['small'],
        defaultSize: 'small',
      },
      {
        key: 'adminConsole.pending_approvals',
        name: 'Pending Approvals',
        category: 'Alerts',
        sizes: ['small'],
        defaultSize: 'small',
      },
      {
        key: 'adminConsole.team_members',
        name: 'Team Members',
        category: 'App Data',
        sizes: ['small'],
        defaultSize: 'small',
      },
      {
        key: 'adminConsole.projects_list',
        name: 'Active Projects (list)',
        category: 'Project Data',
        sizes: ['medium', 'large', 'full'],
        defaultSize: 'large',
      },
      {
        key: 'adminConsole.approvals_list',
        name: 'Pending Approvals (list)',
        category: 'Alerts',
        sizes: ['medium', 'large'],
        defaultSize: 'medium',
      },
      {
        key: 'adminConsole.lead_pipeline',
        name: 'Lead Pipeline',
        category: 'Reports',
        sizes: ['medium', 'large'],
        defaultSize: 'medium',
      },
      {
        key: 'adminConsole.recent_activity',
        name: 'Recent Activity',
        category: 'Recently Used',
        sizes: ['medium', 'large'],
        defaultSize: 'medium',
      },
      {
        key: 'adminConsole.team_list',
        name: 'Team Overview',
        category: 'Personal Work',
        sizes: ['medium', 'large'],
        defaultSize: 'medium',
      },
      {
        key: 'adminConsole.workflow_snapshot',
        name: 'Workflow Snapshot',
        category: 'Reports',
        sizes: ['medium', 'large', 'full'],
        defaultSize: 'full',
      },
    ],
    defaultLayout: [
      { key: 'adminConsole.active_projects', x: 0, y: 0, w: 3, h: 2 },
      { key: 'adminConsole.open_leads', x: 3, y: 0, w: 3, h: 2 },
      { key: 'adminConsole.pending_approvals', x: 6, y: 0, w: 3, h: 2 },
      { key: 'adminConsole.team_members', x: 9, y: 0, w: 3, h: 2 },
      { key: 'adminConsole.projects_list', x: 0, y: 2, w: 6, h: 4 },
      { key: 'adminConsole.lead_pipeline', x: 6, y: 2, w: 6, h: 4 },
      { key: 'adminConsole.approvals_list', x: 0, y: 6, w: 6, h: 3 },
      { key: 'adminConsole.recent_activity', x: 6, y: 6, w: 6, h: 3 },
      { key: 'adminConsole.workflow_snapshot', x: 0, y: 9, w: 12, h: 3 },
    ],
    requiredKeys: ['adminConsole.active_projects'],
  },

  // To add another app (e.g. "clients"), add a new key here with the same
  // shape — no other backend changes are required.
};

export function getAppConfig(appKey: string): AppDashboardConfig | null {
  return DASHBOARD_CONFIG[appKey] ?? null;
}
