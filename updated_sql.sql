-- ============================================================================
-- INOS ERP — CORE DATABASE SCHEMA
-- PostgreSQL 14+
--
-- Organized exactly like the App Deployment Map:
--   0. PLATFORM SERVICES   — shared by every module (gates, documents, roles,
--                             the Estimate→Quotation→BOQ engine, tenancy)
--   1–11. MODULE TABLES    — one section per module, matching
--                             INOS_ERP_Module_App_Breakdown.md 1:1
--
-- Conventions:
--   - Every table has: id (uuid pk), created_at, updated_at
--   - Every module table carries project_id (the spine every record hangs off)
--   - Money columns are NUMERIC(14,2); all in project currency unless noted
--   - jsonb used only for genuinely variable-shape data (photo sets, breakdowns)
--   - Enums are used wherever the process brain gave a fixed, named set
-- ============================================================================


-- ---- 0.2 Projects — the spine ----------------------------------------------

CREATE TYPE project_scope_type AS ENUM ('execution', 'consultancy_only');
CREATE TYPE project_status AS ENUM (
  'brief','survey','pre_design','payment_pending','design','tender',
  'working_drawings','execution','snag','handover','closed','on_hold','cancelled'
);

CREATE TABLE projects (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id         UUID NOT NULL REFERENCES organizations(id),
  client_id      UUID NOT NULL REFERENCES clients(id),
  code           TEXT NOT NULL UNIQUE,                  -- e.g. RPT-2026-014
  name           TEXT NOT NULL,
  scope_type     project_scope_type NOT NULL DEFAULT 'execution',
  status         project_status NOT NULL DEFAULT 'brief',
  site_address   TEXT,
  started_at     DATE,
  target_handover_date DATE,
  actual_handover_date DATE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_projects_org ON projects(org_id);
CREATE INDEX idx_projects_client ON projects(client_id);
CREATE INDEX idx_projects_status ON projects(status);

-- App: Role & Team Directory — who is on this project, and their active span
-- (Admin opens at Layout Finalised, Procurement at Concept 02, etc. — this
-- table is what makes that a queryable fact, not a convention.)
CREATE TABLE project_team_members (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id     UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id        UUID REFERENCES users(id),
  vendor_id      UUID REFERENCES vendors(id),            -- set for contractor-trade members instead of user_id
  role_code      role_code NOT NULL REFERENCES roles(code),
  active_from_gate TEXT,                                 -- gates.code this member's scope opens on, if gated
  active_to_gate   TEXT,
  joined_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  left_at        TIMESTAMPTZ,
  CHECK (user_id IS NOT NULL OR vendor_id IS NOT NULL)
);
CREATE INDEX idx_ptm_project ON project_team_members(project_id);

-- App: Client Portal — the 4 touchpoints a client can see (stripped view)
CREATE TABLE client_portal_access (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id     UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  client_id      UUID NOT NULL REFERENCES clients(id),
  access_token   TEXT NOT NULL UNIQUE,
  visible_gates  TEXT[] NOT NULL DEFAULT ARRAY['pitch_concept_01','token_received','design_closed','final_signoff'],
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at     TIMESTAMPTZ
);


-- ---- 0.3 Gate / Approval Engine --------------------------------------------
-- The 12 ◆ gates from the process brain. Every module below either fires on
-- one of these clearing, or blocks on one not having cleared yet.

CREATE TABLE gates (                                    -- lookup: static, seeded once, in process order
  code            TEXT PRIMARY KEY,                      -- e.g. 'layout_finalised'
  sort_order      SMALLINT NOT NULL UNIQUE,
  name            TEXT NOT NULL,
  trigger_desc    TEXT NOT NULL,
  handoff_from    role_code REFERENCES roles(code),
  handoff_to      role_code REFERENCES roles(code),
  timeline_pos    NUMERIC(5,1) NOT NULL                  -- 0–100 position, matches the process brain map
);

CREATE TYPE gate_status AS ENUM ('pending', 'cleared', 'waived');

CREATE TABLE project_gates (                             -- one row per project per gate
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id     UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  gate_code      TEXT NOT NULL REFERENCES gates(code),
  status         gate_status NOT NULL DEFAULT 'pending',
  cleared_at     TIMESTAMPTZ,
  cleared_by     UUID REFERENCES users(id),
  note           TEXT,
  UNIQUE (project_id, gate_code)
);
CREATE INDEX idx_project_gates_project ON project_gates(project_id);
CREATE INDEX idx_project_gates_status ON project_gates(status);



CREATE TABLE project_scopes (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id     UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  description    TEXT NOT NULL,
  feasibility_risks JSONB DEFAULT '[]',
  created_by     UUID REFERENCES users(id),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE budget_sheets (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id     UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  total_budget   NUMERIC(14,2) NOT NULL,
  currency       TEXT NOT NULL DEFAULT 'INR',
  breakdown      JSONB DEFAULT '{}',                       -- e.g. {"civil": 500000, "mep": 200000, ...}
  owned_by       UUID REFERENCES users(id),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TYPE sow_status AS ENUM ('draft', 'finalized', 'escalated');

CREATE TABLE scope_of_work (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id     UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  content        TEXT NOT NULL,
  version        INTEGER NOT NULL DEFAULT 1,
  status         sow_status NOT NULL DEFAULT 'draft',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
); 


-- ============================================================================
-- 2. SITE SURVEY  ·  App: Survey & Site Brief
-- ============================================================================

CREATE TABLE site_surveys (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id     UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  visit_date     DATE NOT NULL,
  measurements   JSONB DEFAULT '{}',
  photos         JSONB DEFAULT '[]',                       -- array of {url, caption, room}
  conducted_by   UUID[] NOT NULL,                           -- array of user ids (joint ARC+SUP visit)
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE site_analysis (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id     UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  survey_id      UUID REFERENCES site_surveys(id),
  orientation    TEXT,
  services_notes TEXT,
  access_notes   TEXT,
  structure_notes TEXT,
  constraints    JSONB DEFAULT '[]',
  created_by     UUID REFERENCES users(id),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE site_briefs (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id     UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  content        TEXT NOT NULL,
  authored_by    UUID REFERENCES users(id),                -- typically the Site Supervisor
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE scope_of_approval (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id     UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  scope_of_work_id UUID NOT NULL REFERENCES scope_of_work(id),
  approval_items JSONB DEFAULT '[]',                        -- what needs client/statutory approval, and at which gate
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ============================================================================
-- 3. DESIGN STUDIO  ·  Apps: Design Workspace, Client Presentation
-- ============================================================================

CREATE TYPE layout_type AS ENUM ('existing', 'proposed');

CREATE TABLE layouts (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id     UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  type           layout_type NOT NULL,
  version        INTEGER NOT NULL DEFAULT 1,
  file_url       TEXT,
  notes          TEXT,
  created_by     UUID REFERENCES users(id),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE moodboards (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id     UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title          TEXT NOT NULL,
  reference_images JSONB DEFAULT '[]',
  notes          TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TYPE concept_stage AS ENUM ('concept_01', 'concept_02');

CREATE TABLE concept_designs (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id     UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  stage          concept_stage NOT NULL,
  file_url       TEXT,
  material_included BOOLEAN NOT NULL DEFAULT false,         -- true for concept_02
  furniture_layout_included BOOLEAN NOT NULL DEFAULT false, -- true for concept_02
  version        INTEGER NOT NULL DEFAULT 1,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TYPE dd_stage AS ENUM ('dd_01', 'dd_02');

CREATE TABLE design_developments (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id     UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  stage          dd_stage NOT NULL,
  file_url       TEXT,
  material_pinned BOOLEAN NOT NULL DEFAULT false,           -- true for dd_02
  version        INTEGER NOT NULL DEFAULT 1,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE material_selections (                          -- links Design Workspace to Procurement's sourcing app
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id     UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  design_development_id UUID REFERENCES design_developments(id),
  material_sourcing_id  UUID,                               -- FK added after module 6 table exists
  status         TEXT NOT NULL DEFAULT 'proposed',           -- proposed | approved | rejected
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE pitch_decks (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id     UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  file_url       TEXT,
  version        INTEGER NOT NULL DEFAULT 1,
  presented_at   TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE business_proposals (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id     UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  file_url       TEXT,
  version        INTEGER NOT NULL DEFAULT 1,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TYPE presentation_type AS ENUM ('pitch', 'design_close');

CREATE TABLE presentations (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id     UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  type           presentation_type NOT NULL,
  presented_at   TIMESTAMPTZ,
  client_feedback TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ============================================================================
-- 4. SALES & PAYMENTS  ·  Apps: Payment Collection, Agreement & Mobilisation
-- ============================================================================

CREATE TYPE payment_type AS ENUM ('token', 'phase_payment', 'milestone');

CREATE TABLE payments (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id     UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  type           payment_type NOT NULL,
  label          TEXT,                                      -- e.g. 'Payment Phase 01'
  amount         NUMERIC(14,2) NOT NULL,
  received_at    TIMESTAMPTZ,
  receipt_url    TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_payments_project ON payments(project_id);

CREATE TABLE payment_schedules (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id     UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  milestone_name TEXT NOT NULL,
  due_condition  TEXT,                                      -- e.g. 'On Design Closed gate'
  amount         NUMERIC(14,2) NOT NULL,
  status         TEXT NOT NULL DEFAULT 'pending',            -- pending | invoiced | paid
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TYPE agreement_type AS ENUM ('execution_agreement', 'consultancy_contract');

CREATE TABLE agreements (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id     UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  type           agreement_type NOT NULL,
  file_url       TEXT,
  signed_at      TIMESTAMPTZ,
  signed_by_client BOOLEAN NOT NULL DEFAULT false,
  signed_by_rippotai BOOLEAN NOT NULL DEFAULT false,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE plan_of_actions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id     UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  execution_plan_url TEXT,
  timeline_url   TEXT,
  drawings_plan_url TEXT,
  issued_at      TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ============================================================================
-- 5. VENDOR & TENDER MANAGEMENT  ·  App: Vendor Directory & Scheduling
--    (Estimate → Quotation → BOQ engine lives in section 0.5, shared)
-- ============================================================================

CREATE TYPE shortlist_status AS ENUM ('shortlisted', 'visited', 'quoted', 'finalized', 'rejected');

CREATE TABLE vendor_shortlists (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id     UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  vendor_id      UUID NOT NULL REFERENCES vendors(id),
  trade_code     role_code NOT NULL REFERENCES roles(code),
  status         shortlist_status NOT NULL DEFAULT 'shortlisted',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_vendor_shortlists_project ON vendor_shortlists(project_id);

CREATE TYPE visit_party_type AS ENUM ('vendor', 'contractor', 'supervisor', 'architect');

CREATE TABLE site_visit_schedule (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id     UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  visit_type     visit_party_type NOT NULL,
  vendor_id      UUID REFERENCES vendors(id),
  user_id        UUID REFERENCES users(id),
  scheduled_at   TIMESTAMPTZ NOT NULL,
  status         TEXT NOT NULL DEFAULT 'scheduled',          -- scheduled | completed | cancelled
  measurement_sheet_url TEXT,
  created_by     UUID REFERENCES users(id),                  -- Admin Coordinator assigns/aligns all visits
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_site_visits_project ON site_visit_schedule(project_id);

CREATE TABLE contractor_lineup (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id     UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  trade_code     role_code NOT NULL REFERENCES roles(code),
  vendor_id      UUID NOT NULL REFERENCES vendors(id),
  confirmed_at   TIMESTAMPTZ,
  UNIQUE (project_id, trade_code)
);


-- ============================================================================
-- 6. PROCUREMENT & MATERIALS  ·  Apps: Material Sourcing, Procurement & Inventory
-- ============================================================================

CREATE TABLE material_requirements (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id     UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  requested_by   UUID REFERENCES users(id),                  -- typically Architect
  description    TEXT NOT NULL,
  budget_hint    NUMERIC(14,2),
  style_notes    TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE material_sourcing (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id     UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  requirement_id UUID NOT NULL REFERENCES material_requirements(id),
  material_name  TEXT NOT NULL,
  sample_url     TEXT,
  rate           NUMERIC(12,2),
  availability   TEXT,
  status         TEXT NOT NULL DEFAULT 'sourcing',            -- sourcing | sampled | selected | rejected
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE material_specs (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id     UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  material_sourcing_id UUID NOT NULL REFERENCES material_sourcing(id),
  drawing_ref    TEXT,
  quantity       NUMERIC(12,3),
  unit           TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE purchase_orders (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id     UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  material_sourcing_id UUID REFERENCES material_sourcing(id),
  vendor_id      UUID REFERENCES vendors(id),
  po_number      TEXT NOT NULL UNIQUE,
  amount         NUMERIC(14,2) NOT NULL,
  status         TEXT NOT NULL DEFAULT 'ordered',             -- ordered | partially_delivered | delivered | cancelled
  ordered_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_po_project ON purchase_orders(project_id);

CREATE TABLE deliveries (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  po_id          UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  challan_number TEXT,
  delivered_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  quantity       NUMERIC(12,3),
  site_stage_ref TEXT                                        -- which site stage this delivery is staged for
);

CREATE TABLE site_inventory (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id     UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  material_sourcing_id UUID REFERENCES material_sourcing(id),
  quantity_on_site NUMERIC(12,3) NOT NULL DEFAULT 0,
  last_reconciled_at TIMESTAMPTZ,
  reconciled_by  UUID REFERENCES users(id)                    -- Procurement reconciles against POs
);

-- Backfill deferred FKs now that source tables exist
ALTER TABLE estimates
  ADD CONSTRAINT fk_estimates_material_req
  FOREIGN KEY (material_requirement_id) REFERENCES material_requirements(id);

ALTER TABLE material_selections
  ADD CONSTRAINT fk_material_selections_sourcing
  FOREIGN KEY (material_sourcing_id) REFERENCES material_sourcing(id);


-- ============================================================================
-- 7. DRAWING MANAGEMENT  ·  App: Drawing Set Manager
-- ============================================================================

CREATE TYPE drawing_set_type AS ENUM ('tender', 'working_gfc', 'furniture_detail');
CREATE TYPE drawing_set_status AS ENUM ('draft', 'issued', 'finalized', 'superseded');

CREATE TABLE drawing_sets (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id     UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  type           drawing_set_type NOT NULL,
  status         drawing_set_status NOT NULL DEFAULT 'draft',
  issued_at      TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE drawings (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  drawing_set_id UUID NOT NULL REFERENCES drawing_sets(id) ON DELETE CASCADE,
  category       TEXT NOT NULL,                              -- civil, electrical, plumbing, hvac, flooring, ceiling, etc.
  title          TEXT NOT NULL,
  file_url       TEXT,
  version        INTEGER NOT NULL DEFAULT 1,
  built_by_trade role_code REFERENCES roles(code),            -- which contractor team builds from this drawing
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_drawings_set ON drawings(drawing_set_id);

-- Backfill deferred FK now that drawing_sets exists
ALTER TABLE boqs
  ADD CONSTRAINT fk_boqs_drawing_set
  FOREIGN KEY (drawing_set_id) REFERENCES drawing_sets(id);


-- ============================================================================
-- 8. EXECUTION & SITE OPS  ·  Apps: Work Package & Progress,
--    Site Quality & Reporting, RFI & Supplementary Estimates
-- ============================================================================

CREATE TABLE work_packages (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id     UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  trade_code     role_code NOT NULL REFERENCES roles(code),
  boq_id         UUID REFERENCES boqs(id),
  scope_description TEXT,
  payment_milestones JSONB DEFAULT '[]',                     -- [{pct: 20, label: 'slab'}, ...]
  schedule_start DATE,
  schedule_end   DATE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_work_packages_project ON work_packages(project_id);

CREATE TABLE trade_progress (                                -- the fixed % milestones per MEP trade
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_package_id UUID NOT NULL REFERENCES work_packages(id) ON DELETE CASCADE,
  milestone_pct  SMALLINT NOT NULL CHECK (milestone_pct BETWEEN 0 AND 100),
  milestone_label TEXT,                                      -- e.g. 'slab', 'walling', 'light & switch boards'
  achieved_at    TIMESTAMPTZ,
  notes          TEXT
);

CREATE TABLE qc_checklist_templates (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id         UUID NOT NULL REFERENCES organizations(id),
  trade_code     role_code REFERENCES roles(code),
  name           TEXT NOT NULL,
  items          JSONB NOT NULL DEFAULT '[]'                  -- [{item: '...', required: true}, ...]
);

CREATE TYPE qc_status AS ENUM ('pending', 'passed', 'failed', 'waived');

CREATE TABLE qc_checklists (                                  -- the Supervisor's blocking gate — next trade can't
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),  -- start until this is 'passed'
  project_id     UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  work_package_id UUID REFERENCES work_packages(id),
  template_id    UUID REFERENCES qc_checklist_templates(id),
  phase_ref      TEXT,
  status         qc_status NOT NULL DEFAULT 'pending',
  signed_off_by  UUID REFERENCES users(id),
  signed_off_at  TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_qc_checklists_project ON qc_checklists(project_id);

CREATE TABLE daily_site_reports (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id     UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  report_date    DATE NOT NULL,
  submitted_by   UUID REFERENCES users(id),
  content        TEXT NOT NULL,
  photos         JSONB DEFAULT '[]',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (project_id, report_date)
);

CREATE TABLE site_visit_logs (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id     UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  visitor_role   role_code REFERENCES roles(code),
  visitor_user_id UUID REFERENCES users(id),
  visit_date     DATE NOT NULL,
  notes          TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE mockups (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id     UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  item_description TEXT NOT NULL,
  photo_url      TEXT,
  approved_by    UUID REFERENCES users(id),
  approved_at    TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TYPE rfi_status AS ENUM ('open', 'answered', 'closed');

CREATE TABLE rfis (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id     UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  raised_by      UUID REFERENCES users(id),
  question       TEXT NOT NULL,
  response       TEXT,
  status         rfi_status NOT NULL DEFAULT 'open',
  raised_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at    TIMESTAMPTZ
);

CREATE TABLE supplementary_estimates (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id     UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  reason         TEXT NOT NULL,
  linked_estimate_id UUID REFERENCES estimates(id),           -- re-enters the shared estimate→quotation→BOQ loop
  raised_by      UUID REFERENCES users(id),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ============================================================================
-- 9. FINANCE & ACCOUNTS  ·  App: Budget & Billing
--    (budget_sheets lives in Module 1; estimates/quotations/BOQ in 0.5)
-- ============================================================================

CREATE TYPE invoice_status AS ENUM ('draft', 'sent', 'paid', 'overdue', 'cancelled');

CREATE TABLE invoices (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id     UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  invoice_number TEXT NOT NULL UNIQUE,
  linked_payment_schedule_id UUID REFERENCES payment_schedules(id),
  amount         NUMERIC(14,2) NOT NULL,
  due_date       DATE,
  status         invoice_status NOT NULL DEFAULT 'draft',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_invoices_project ON invoices(project_id);

CREATE TABLE consolidated_bills (                             -- closes the commercial file at handover
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id     UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  total_amount   NUMERIC(14,2) NOT NULL,
  breakdown      JSONB DEFAULT '{}',
  generated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ============================================================================
-- 10. SNAG & HANDOVER  ·  App: Snag & Handover
-- ============================================================================

CREATE TABLE snag_lists (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id     UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  walkthrough_date DATE NOT NULL,
  status         TEXT NOT NULL DEFAULT 'open',                -- open | closed
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TYPE snag_item_status AS ENUM ('open', 'in_progress', 'closed');

CREATE TABLE snag_items (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  snag_list_id   UUID NOT NULL REFERENCES snag_lists(id) ON DELETE CASCADE,
  trade_code     role_code REFERENCES roles(code),            -- each contractor returns for its own snags
  description    TEXT NOT NULL,
  status         snag_item_status NOT NULL DEFAULT 'open',
  closed_at      TIMESTAMPTZ
);
CREATE INDEX idx_snag_items_list ON snag_items(snag_list_id);

CREATE TABLE completion_certificates (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id     UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  issued_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  signed_by_client BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE handover_packs (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id     UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  warranty_url   TEXT,
  as_built_drawing_url TEXT,
  care_notes_url TEXT,
  consolidated_bill_id UUID REFERENCES consolidated_bills(id),
  handed_over_at TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ============================================================================
-- 11. PLANNING & PROGRAMME  ·  App: Planning & Programme
-- ============================================================================

CREATE TABLE programme_timeline (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id     UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  milestone_name TEXT NOT NULL,
  planned_date   DATE,
  actual_date    DATE,
  status         TEXT NOT NULL DEFAULT 'planned',              -- planned | in_progress | done | delayed
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE scope_chain (                                    -- Scope of Work → Scope of Approval → Plan of Action, one thread
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id     UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  scope_of_work_id UUID REFERENCES scope_of_work(id),
  scope_of_approval_id UUID REFERENCES scope_of_approval(id),
  plan_of_action_id UUID REFERENCES plan_of_actions(id)
);

CREATE TABLE strategy_notes (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id     UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  note           TEXT NOT NULL,
  created_by     UUID REFERENCES users(id),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ============================================================================
-- SEED DATA — roles & gates (static lookups, safe to run once)
-- ============================================================================

INSERT INTO roles (code, name, is_core_team, description) VALUES
  ('ARC','Architect / Interior Designer', true,  'Owns the brief, design and every drawing, end to end.'),
  ('ADM','Admin Coordinator', true,  'Vendor search, contractor lineup, all visit scheduling. No finance ownership.'),
  ('PRC','Procurement Team', true,  'Sourcing, selection, purchase, staged deliveries, inventory.'),
  ('SUP','Site Supervisor', true,  'Quality check gate on every phase, plus daily reporting and inventory.'),
  ('CLI','Client', true,  'Present at four money-and-design gates plus final sign-off.'),
  ('ACC','Accounts & Finance Team', true,  'Owns every document, payment, estimate, quotation, BOQ and budget.'),
  ('PLN','Planning Team', true,  'Scope, plan of action, strategy — parallel to the whole design phase.'),
  ('CIV','Civil Contractor', false, 'Demolition through waterproofing.'),
  ('ELE','Electrical Contractor', false, 'Slab 20% → walling 60% → boards 95% → meter 100%.'),
  ('PLM','Plumbing Contractor', false, 'Slab 20% → walling 40% → sanitary 100%.'),
  ('MEC','Mechanical / HVAC Contractor', false, 'Slab 20% → walling 60% → AC install 100%.'),
  ('MET','Metal Work Contractor', false, 'Balcony jaal and metal structures.'),
  ('TIL','Tiling Contractor', false, 'Flooring, bathroom tiling, stone jambs and polish.'),
  ('FCL','False Ceiling / POP Contractor', false, 'False ceiling, after MEP sign-off.'),
  ('MIL','Mill Work / Modular Contractor', false, 'Kitchen, wardrobe, bed back, panelling, hardware.'),
  ('PNT','Painting & Polish Contractor', false, 'Base coat through final coat.'),
  ('GLZ','Glass & Window Contractor', false, 'Window installation.'),
  ('SPC','Specialist — Testing & Treatment', false, 'Soil/water/drainage testing, termite treatment, waterproofing.'),
  ('LND','Landscape Contractor', false, 'External/landscape scope, where present.');

INSERT INTO gates (code, sort_order, name, trigger_desc, handoff_from, handoff_to, timeline_pos) VALUES
  ('layout_finalised',      1,  'Layout Finalised',                'Proposed layout + reference presentation complete',        'ARC','ADM', 12.0),
  ('pitch_concept_01',      2,  'Client Sign-off — Pitch + Concept 01', 'Pitch deck, business proposal and Concept 3D 01 presented', 'ARC','CLI', 17.0),
  ('token_received',        3,  'Token Received',                  'Client has seen layout, moodboard and 3D 01',               'CLI','ACC', 18.5),
  ('project_mobilised',     4,  'Project Mobilised',                'Documents signed + plan of action issued',                  'ACC','ADM', 21.0),
  ('concept_02_finalised',  5,  'Concept 02 Finalised',             '3D with material + furniture layout approved',              'ARC','PRC', 27.0),
  ('design_closed',         6,  'Design Closed',                    'Design Development 02 with material approved',              'ARC','CLI', 37.0),
  ('payment_phase_01',      7,  'Payment Phase 01',                 'Design close',                                               'CLI','ACC', 40.0),
  ('tender_drawings_final', 8,  'Tender Drawings Finalised',        'Tender set issued to vendors — hard constraint on pricing',  'ARC','ADM', 52.0),
  ('estimate_approved',     9,  'Estimate Approved',                'Estimate reviewed and accepted, becomes Quotation',          'ACC','ACC', 59.0),
  ('contractor_lineup',     10, 'Contractor Lineup Handoff',        'All 12 trade teams confirmed',                              'ADM','SUP', 66.0),
  ('gfc_issued',            11, 'Working Drawings Issued — GFC',    'Full construction set finalised',                           'ARC','SUP', 70.0),
  ('final_signoff',         12, 'Final Client Sign-off',            'Snag closed, all phase QC signed off',                      'ADM','CLI', 100.0);


-- ============================================================================
-- updated_at triggers — wired up for every table with an updated_at column
-- ============================================================================

DO $$
DECLARE t text;
BEGIN
  FOR t IN
    SELECT table_name FROM information_schema.columns
    WHERE column_name = 'updated_at' AND table_schema = 'public'
  LOOP
    EXECUTE format(
      'CREATE TRIGGER trg_%I_updated_at BEFORE UPDATE ON %I
       FOR EACH ROW EXECUTE FUNCTION set_updated_at();', t, t
    );
  END LOOP;
END $$;