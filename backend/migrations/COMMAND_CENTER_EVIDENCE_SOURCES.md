# Command Center evidence sources

This is the complete 83-item catalogue mapping against the supplied database schema. The resolver is `backend/src/modules/gates/conditions/native-evidence.service.ts`. Native records are authoritative: a missing/draft/rejected native record is not replaced by a file upload. Unknown catalogue codes retain the existing documents/drawings flow.

| Catalogue code | Name | Source |
| --- | --- | --- |
| `BRIEF_CLIENT_BRIEF` | Client Brief | project_briefs |
| `BRIEF_SCOPE_OF_WORK` | Scope of Work | scope_of_work |
| `RECCE_SITE_RECCE` | Site Recce | site_recces |
| `RECCE_SITE_ANALYSIS` | Site Analysis | site_recces (existing_condition required) |
| `RECCE_SITE_BRIEF` | Site Brief | site_recces (existing_condition required) |
| `RECCE_SCOPE_OF_APPROVAL` | Scope of Approval | documents (uploaded document) |
| `PRE_EXISTING_LAYOUT` | Existing Layout — As-Built | drawings (uploaded drawing) |
| `PRE_PROPOSED_LAYOUT` | Proposed Layout | drawings (uploaded drawing) |
| `PRE_REFERENCE_MOODBOARD` | Reference Presentation and Moodboard | documents (uploaded document) |
| `PRE_PITCH_PROPOSAL` | Pitch / Proposal + Business Proposal | documents (uploaded document) |
| `PRE_CONCEPT_DESIGN_01` | Concept Design 01 — 3D | documents (uploaded document) |
| `PLAN_PAYMENT_RECEIPT` | Payment Receipt | payment_schedule_milestones (TOKEN paid) |
| `PLAN_PAYMENT_SCHEDULE` | Payment Schedule | payment_schedules (client accepted) |
| `PLAN_SIGNED_CONTRACT` | Signed Contract | documents (uploaded document) |
| `PLAN_SIGNED_AGREEMENT` | Signed Agreement | documents (uploaded document) |
| `PLAN_DRAWINGS_PLAN` | Drawings Plan | project_planners + project_planner_items (CONSULTANCY with dates/items) |
| `PLAN_EXECUTION_PLAN` | Execution Plan | plan_of_actions (published) |
| `PLAN_PROJECT_TIMELINE` | Project Timeline | plan_of_actions (published with duration) |
| `PLAN_INITIAL_ESTIMATE` | Initial Estimate | budget_estimates |
| `PLAN_STANDARD_BOQ` | Standard BOQ | boqs |
| `DES_CONCEPT_DESIGN_02` | Concept Design 02 — 3D with Material + Furniture Layout | documents (uploaded document) |
| `DES_DESIGN_DEVELOPMENT_01` | Design Development 01 | documents (uploaded document) |
| `DES_DESIGN_DEVELOPMENT_02` | Design Development 02 — With Material | documents (uploaded document) |
| `VENDOR_SHORTLIST` | Vendor Shortlist | documents (uploaded document) |
| `VENDOR_SITE_VISIT_SCHEDULE` | Site Visit Schedule | documents (uploaded document) |
| `VENDOR_SITE_MEASUREMENT_SHEET` | Vendor Site Measurement Sheet | documents (uploaded document) |
| `VENDOR_ESTIMATE` | Estimate | budget_estimates |
| `VENDOR_QUOTATION` | Quotation | quotations |
| `VENDOR_BOQ` | BOQ | boqs |
| `VENDOR_CONTRACTOR_LINEUP` | Contractor Lineup | documents (uploaded document) |
| `MAT_MATERIAL_REQUIREMENT` | Material Requirement | documents (uploaded document) |
| `MAT_MATERIAL_RATES_SHEET` | Material Rates Sheet | documents (uploaded document) |
| `MAT_MATERIAL_LAYOUT_SPECIFICATION` | Material Layouts and Specification | drawings (uploaded drawing) |
| `MAT_MATERIAL_ESTIMATE` | Material Estimate | documents (uploaded document) |
| `MAT_MATERIAL_QUOTATION` | Material Quotation | documents (uploaded document) |
| `MAT_PURCHASE_ORDERS` | Purchase Orders | documents (uploaded document) |
| `MAT_DELIVERY_CHALLANS` | Delivery Challans | documents (uploaded document) |
| `MAT_SITE_INVENTORY_REGISTER` | Site Inventory Register | documents (uploaded document) |
| `TENDER_BUILDING_LAYOUT` | Tender — Building Layout | drawings (uploaded drawing) |
| `TENDER_DEMOLITION_LAYOUT` | Tender — Demolition Layout | drawings (uploaded drawing) |
| `TENDER_SECTION_ELEVATION` | Tender — Section & Elevation | drawings (uploaded drawing) |
| `TENDER_CIVIL_LAYOUT` | Tender — Civil Layout | drawings (uploaded drawing) |
| `TENDER_ELECTRICAL_LAYOUT` | Tender — Electrical | drawings (uploaded drawing) |
| `TENDER_PLUMBING_LAYOUT` | Tender — Plumbing | drawings (uploaded drawing) |
| `TENDER_HVAC_LAYOUT` | Tender — HVAC | drawings (uploaded drawing) |
| `TENDER_TYPICAL_DETAILS` | Tender — Typical Details | drawings (uploaded drawing) |
| `TENDER_LANDSCAPING` | Tender — Landscaping | drawings (uploaded drawing) |
| `WORK_DEMOLITION_DETAILS` | Demolition Details | drawings (uploaded drawing) |
| `WORK_CIVIL_DETAILS` | Civil Details | drawings (uploaded drawing) |
| `WORK_STRUCTURE_LAYOUT` | Structure Layout | drawings (uploaded drawing) |
| `WORK_DOOR_WINDOW_SCHEDULE` | Door & Window Schedule | drawings (uploaded drawing) |
| `WORK_STONE_JAMB_DETAILS` | Stone Jamb Details | drawings (uploaded drawing) |
| `WORK_FLOORING_LAYOUT` | Flooring Layout | drawings (uploaded drawing) |
| `WORK_FLOORING_DETAILS` | Flooring Details | drawings (uploaded drawing) |
| `WORK_BATHROOM_DETAILS` | Bathroom Details | drawings (uploaded drawing) |
| `WORK_CEILING_LAYOUT` | Ceiling Layout | drawings (uploaded drawing) |
| `WORK_CEILING_DETAILS` | Ceiling Details | drawings (uploaded drawing) |
| `WORK_WALL_ELEVATIONS` | Wall Elevations | drawings (uploaded drawing) |
| `MOD_KITCHEN_DETAILS` | Kitchen Details | drawings (uploaded drawing) |
| `MOD_TV_UNIT_DETAILS` | TV Unit Details | drawings (uploaded drawing) |
| `MOD_WARDROBE_STORAGE_DETAILS` | Wardrobe & Storage Details | drawings (uploaded drawing) |
| `MOD_BED_BACK_DETAILS` | Bed Back Details | drawings (uploaded drawing) |
| `MOD_WALL_PANELING_DETAILS` | Wall Panelling Details | drawings (uploaded drawing) |
| `WORK_LANDSCAPE_DETAILS` | Landscape Details | drawings (uploaded drawing) |
| `EXEC_FINAL_BOQ` | Final BOQ | boqs (approved) |
| `EXEC_QC_CHECKLIST_TEMPLATE` | QC Checklist Template | documents (uploaded document) |
| `EXEC_PHASE_QC_SIGNOFF` | Phase QC Sign-off | documents (uploaded document) |
| `EXEC_WATERPROOFING_WARRANTY` | Waterproofing Warranty | documents (uploaded document) |
| `EXEC_TERMITE_TREATMENT_CERTIFICATE` | Termite Treatment Certificate | documents (uploaded document) |
| `EXEC_ARCHITECT_SITE_VISIT_SCHEDULE` | Architect Site Visit Schedule | documents (uploaded document) |
| `EXEC_SITE_VISIT_LOG` | Site Visit Log | documents (uploaded document) |
| `EXEC_DAILY_PROGRESS_REPORT` | Daily Progress Report | documents (uploaded document) |
| `EXEC_SITE_MOCKUP_PROCESS_GUIDE` | Site Mockup Process Guide | documents (uploaded document) |
| `EXEC_DESIGN_CLARIFICATION` | Design Clarification | documents (uploaded document) |
| `EXEC_CIVIL_QUALITY_CHECKLIST` | Civil Quality Checklist | documents (uploaded document) |
| `EXEC_FINISHING_QUALITY_CHECKLIST` | Finishing Quality Checklist | documents (uploaded document) |
| `EXEC_ELECTRICAL_COMPLETION_CERTIFICATE` | Electrical Completion Certificate | documents (uploaded document) |
| `HANDOVER_SNAG_LIST` | Snag List | documents (uploaded document) |
| `HANDOVER_COMPLETION_CERTIFICATE` | Completion Certificate | documents (uploaded document) |
| `HANDOVER_WARRANTY_PACK` | Warranty Pack | documents (uploaded document) |
| `HANDOVER_AS_BUILT_DRAWING_SET` | As-Built Drawing Set | drawings (uploaded drawing) |
| `HANDOVER_CARE_MAINTENANCE_NOTES` | Care & Maintenance Notes | documents (uploaded document) |
| `HANDOVER_CONSOLIDATED_BILLS` | Consolidated Bills | documents (uploaded document) |

## Interpretation and boundaries

- Native sources are selected by explicit catalogue code, never by matching titles or dynamically executing table names from requests. All queries bind the project ID.
- Native status is evaluated after selecting the latest version/record; draft/rejected revisions block. Soft-deleted records are excluded where the supplied table supports deletion.
- Brief: READY_FOR_DESIGN or SIGNED_OFF; explicit approval requires SIGNED_OFF. Scope: APPROVED or ACCEPTED. Recce has no approval field: its recorded existence can satisfy nonapproval requirements only; analysis/site-brief additionally require existing_condition.
- Payment schedule must be ACTIVE/COMPLETED and accepted by the client. Token receipt uses a PAID TOKEN milestone in the latest active/completed schedule. This confirms payment, not a separate signed receipt attachment.
- Plans must be published. Timeline requires phases and duration; the drawings planner requires an active CONSULTANCY planner with dates and nondeleted items.
- Estimate: submitted/approved unless approval is required. BOQ: pending_approval/approved unless approval is required. Quotation: submitted/approved unless approval is required. Approval always requires the approved state.
- Initial/vendor estimates share the budget-estimate source; standard/vendor/final BOQs share the project BOQ source. The schema does not distinguish those document purposes. These are project-level checks, not proof of coverage for every contractor trade.
- Scope of Approval remains an upload because scope_of_work does not represent a distinct statutory/client approval package. Signed contract/agreement remain uploads.
- Material-procurement and site-operation model files exist in the repository, but their dedicated tables are absent from the supplied schema. Their catalogue items remain uploads until the tables and lifecycle rules are confirmed. A global vendor record alone does not establish a project shortlist or contractor confirmation.
- No new database columns or destructive backfill are needed. Existing uploaded copies remain stored but do not satisfy native requirements. Apply the earlier gate migration if it has not already been applied; do not rerun its one-time ALTER for this change.
- Existing gate clearances are not silently changed. Recheck evidence and explicitly reopen approvals that need reassessment.
- Tested with mocked native queries and TypeScript compilation; not validated against live MySQL.
