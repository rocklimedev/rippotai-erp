-- ============================================================
-- BUDGET ESTIMATE
-- BOQ -> Budget Estimate
--
-- Master data:
--   library_categories
--   library_items
--
-- Existing source:
--   boqs
--
-- Snapshot:
--   budget_estimates
--   budget_estimate_categories
--   budget_estimate_items
--   budget_estimate_miscellaneous
-- ============================================================


-- ============================================================
-- 1. BUDGET ESTIMATES
-- ============================================================

CREATE TABLE IF NOT EXISTS budget_estimates (
    id CHAR(36) NOT NULL,

    -- Project / BOQ source
    project_id CHAR(36) NOT NULL,
    boq_id CHAR(36) NULL,

    -- Optional source template
    source_template_id CHAR(36) NULL,

    -- Estimate identification
    estimate_number VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,

    -- Status
    status ENUM(
        'draft',
        'in_progress',
        'submitted',
        'approved',
        'rejected',
        'revised',
        'cancelled'
    ) NOT NULL DEFAULT 'draft',

    -- Commercial values
    subtotal DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    misc_percentage DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    misc_amount DECIMAL(15,2) NOT NULL DEFAULT 0.00,

    design_amount DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    execution_amount DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    supervisor_amount DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    additional_amount DECIMAL(15,2) NOT NULL DEFAULT 0.00,

    tax_percentage DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    tax_amount DECIMAL(15,2) NOT NULL DEFAULT 0.00,

    discount_amount DECIMAL(15,2) NOT NULL DEFAULT 0.00,

    total_amount DECIMAL(15,2) NOT NULL DEFAULT 0.00,

    -- Client snapshot
    client_name VARCHAR(255) NULL,

    -- Project/site snapshot
    location VARCHAR(255) NULL,

    -- Prepared information
    prepared_by VARCHAR(255) NULL,
    estimate_date DATE NULL,

    -- Terms snapshot
    terms_html TEXT NULL,
    terms_template_id CHAR(36) NULL,
    terms_template_version INT NULL,

    -- Version
    version INT NOT NULL DEFAULT 1,

    -- Locking
    locked BOOLEAN NOT NULL DEFAULT FALSE,

    -- Approval
    approved_at DATETIME NULL,
    approved_by CHAR(36) NULL,

    -- Audit
    created_by CHAR(36) NULL,
    updated_by CHAR(36) NULL,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),

    UNIQUE KEY uq_budget_estimate_number (estimate_number),

    KEY idx_budget_estimates_project (project_id),
    KEY idx_budget_estimates_boq (boq_id),
    KEY idx_budget_estimates_status (status),

    CONSTRAINT fk_budget_estimate_project
        FOREIGN KEY (project_id)
        REFERENCES projects(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT fk_budget_estimate_boq
        FOREIGN KEY (boq_id)
        REFERENCES boqs(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    CONSTRAINT fk_budget_estimate_template
        FOREIGN KEY (source_template_id)
        REFERENCES boq_templates(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    CONSTRAINT fk_budget_estimate_terms_template
        FOREIGN KEY (terms_template_id)
        REFERENCES terms_templates(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    CONSTRAINT fk_budget_estimate_approved_by
        FOREIGN KEY (approved_by)
        REFERENCES users(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    CONSTRAINT fk_budget_estimate_created_by
        FOREIGN KEY (created_by)
        REFERENCES users(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    CONSTRAINT fk_budget_estimate_updated_by
        FOREIGN KEY (updated_by)
        REFERENCES users(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
);


-- ============================================================
-- 2. BUDGET ESTIMATE CATEGORIES
--
-- These are snapshots of library_categories.
-- category_id points to the master category.
-- category_name is copied so old estimates remain stable.
-- ============================================================

CREATE TABLE IF NOT EXISTS budget_estimate_categories (
    id CHAR(36) NOT NULL,

    estimate_id CHAR(36) NOT NULL,

    library_category_id CHAR(36) NULL,

    name VARCHAR(255) NOT NULL,

    sort_order INT NOT NULL DEFAULT 0,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),

    KEY idx_estimate_categories_estimate (estimate_id),
    KEY idx_estimate_categories_library (library_category_id),

    CONSTRAINT fk_estimate_category_estimate
        FOREIGN KEY (estimate_id)
        REFERENCES budget_estimates(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_estimate_category_library
        FOREIGN KEY (library_category_id)
        REFERENCES library_categories(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
);


-- ============================================================
-- 3. BUDGET ESTIMATE ITEMS
--
-- This is the important table.
--
-- library_item_id = original master library item
--
-- But name/unit/rate are SNAPSHOTS.
--
-- Therefore changing:
--     library_items.default_rate
--     library_items.name
--     library_items.unit
--
-- will NOT modify existing estimates.
-- ============================================================

CREATE TABLE IF NOT EXISTS budget_estimate_items (
    id CHAR(36) NOT NULL,

    estimate_id CHAR(36) NOT NULL,

    estimate_category_id CHAR(36) NOT NULL,

    -- Master library reference
    library_item_id CHAR(36) NULL,

    -- Optional BOQ source row
    boq_item_id CHAR(36) NULL,

    -- SNAPSHOT DATA
    name VARCHAR(255) NOT NULL,

    unit_id CHAR(36) NULL,
    unit VARCHAR(20) NULL,

    quantity DECIMAL(15,2) NOT NULL DEFAULT 0.00,

    rate DECIMAL(15,2) NOT NULL DEFAULT 0.00,

    amount DECIMAL(15,2) NOT NULL DEFAULT 0.00,

    calc_type ENUM('M','L') NOT NULL DEFAULT 'M',

    location VARCHAR(255) NULL,

    detail JSON NULL,

    notes TEXT NULL,

    hidden BOOLEAN NOT NULL DEFAULT FALSE,

    sort_order INT NOT NULL DEFAULT 0,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),

    KEY idx_estimate_items_estimate (estimate_id),
    KEY idx_estimate_items_category (estimate_category_id),
    KEY idx_estimate_items_library (library_item_id),
    KEY idx_estimate_items_boq (boq_item_id),
    KEY idx_estimate_items_unit (unit_id),

    CONSTRAINT fk_estimate_item_estimate
        FOREIGN KEY (estimate_id)
        REFERENCES budget_estimates(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_estimate_item_category
        FOREIGN KEY (estimate_category_id)
        REFERENCES budget_estimate_categories(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_estimate_item_library
        FOREIGN KEY (library_item_id)
        REFERENCES library_items(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    CONSTRAINT fk_estimate_item_boq
        FOREIGN KEY (boq_item_id)
        REFERENCES boq_items(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    CONSTRAINT fk_estimate_item_unit
        FOREIGN KEY (unit_id)
        REFERENCES units(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
);


-- ============================================================
-- 4. BUDGET ESTIMATE MISCELLANEOUS
-- ============================================================

CREATE TABLE IF NOT EXISTS budget_estimate_miscellaneous (
    id CHAR(36) NOT NULL,

    estimate_id CHAR(36) NOT NULL,

    name VARCHAR(255) NOT NULL,

    value DECIMAL(15,2) NOT NULL DEFAULT 0.00,

    notes TEXT NULL,

    sort_order INT NOT NULL DEFAULT 0,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),

    KEY idx_estimate_misc_estimate (estimate_id),

    CONSTRAINT fk_estimate_misc_estimate
        FOREIGN KEY (estimate_id)
        REFERENCES budget_estimates(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);


-- ============================================================
-- 5. BUDGET ESTIMATE VERSIONS
--
-- Keeps historical versions of an estimate.
-- ============================================================

CREATE TABLE IF NOT EXISTS budget_estimate_versions (
    id CHAR(36) NOT NULL,

    estimate_id CHAR(36) NOT NULL,

    version INT NOT NULL,

    version_name VARCHAR(255) NOT NULL,

    total_amount DECIMAL(15,2) NOT NULL DEFAULT 0.00,

    snapshot JSON NULL,

    created_by CHAR(36) NULL,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),

    UNIQUE KEY uq_estimate_version (
        estimate_id,
        version
    ),

    KEY idx_estimate_versions_estimate (
        estimate_id
    ),

    CONSTRAINT fk_estimate_version_estimate
        FOREIGN KEY (estimate_id)
        REFERENCES budget_estimates(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_estimate_version_user
        FOREIGN KEY (created_by)
        REFERENCES users(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
);