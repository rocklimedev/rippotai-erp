USE spsyn8lm_rippotai_erp;

-- ============================================================
-- 1. ROLES
-- ============================================================
CREATE TABLE roles (
    id          CHAR(36) PRIMARY KEY,
    name        VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================================
-- 2. PERMISSIONS
-- ============================================================
CREATE TABLE permissions (
    id          CHAR(36) PRIMARY KEY,
    name        VARCHAR(100) NOT NULL UNIQUE,
    resource    VARCHAR(50)  NOT NULL,
    action      VARCHAR(50)  NOT NULL,
    description TEXT,
    created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_permissions_resource_action (resource, action)
);

-- ============================================================
-- 3. USERS
-- ============================================================
CREATE TABLE users (
    id              CHAR(36) PRIMARY KEY,
    name            VARCHAR(255) NOT NULL,
    email           VARCHAR(255) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    role            VARCHAR(50)  NOT NULL DEFAULT 'employee',
    is_active       TINYINT(1)   NOT NULL DEFAULT 1,
    last_login_at   TIMESTAMP    NULL,
    created_by      CHAR(36)     NULL,
    created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (role)       REFERENCES roles(name) ON UPDATE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id)  ON DELETE SET NULL
);

-- ============================================================
-- 4. ROLE_PERMISSIONS
-- ============================================================
CREATE TABLE role_permissions (
    role_id       CHAR(36)    NOT NULL,
    permission_id CHAR(36)    NOT NULL,
    granted_at    TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    granted_by    CHAR(36)    NULL,
    PRIMARY KEY (role_id, permission_id),
    FOREIGN KEY (role_id)       REFERENCES roles(id)       ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE,
    FOREIGN KEY (granted_by)    REFERENCES users(id)       ON DELETE SET NULL
);

-- ============================================================
-- 5. AUTH_TOKENS
-- ============================================================
CREATE TABLE auth_tokens (
    id           CHAR(36) PRIMARY KEY,
    user_id      CHAR(36)     NOT NULL,
    token_hash   VARCHAR(255) NOT NULL UNIQUE,
    type         ENUM('refresh', 'session') NOT NULL DEFAULT 'refresh',
    device_info  TEXT,
    ip_address   VARCHAR(45),
    expires_at   TIMESTAMP    NOT NULL,
    revoked_at   TIMESTAMP    NULL,
    last_used_at TIMESTAMP    NULL,
    created_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================
-- 6. VERIFICATION_TOKENS
-- ============================================================
CREATE TABLE verification_tokens (
    id         CHAR(36) PRIMARY KEY,
    user_id    CHAR(36)     NOT NULL,
    token      VARCHAR(255) NOT NULL UNIQUE,
    type       ENUM('email_verification', 'password_reset') NOT NULL,
    expires_at TIMESTAMP    NOT NULL,
    used_at    TIMESTAMP    NULL,
    created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================
-- 7. SETTINGS
-- ============================================================
CREATE TABLE settings (
    id         CHAR(36) PRIMARY KEY,
    `key`      VARCHAR(100) NOT NULL UNIQUE,
    `value`    JSON         NOT NULL,
    updated_by CHAR(36)     NULL,
    updated_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
);

-- ============================================================
-- 8. PROJECTS
-- ============================================================
CREATE TABLE projects (
    id              CHAR(36) PRIMARY KEY,
    name            VARCHAR(255) NOT NULL,
    site_location   VARCHAR(255) NOT NULL,
    description     TEXT,
    status          ENUM('active', 'completed', 'on_hold', 'inactive') NOT NULL DEFAULT 'active',
    quotation_count INT          NOT NULL DEFAULT 0,
    approved_value  DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    created_by      CHAR(36) NULL,
    updated_by      CHAR(36) NULL,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    archived_at     TIMESTAMP NULL,
    archived_by     CHAR(36) NULL,
    FOREIGN KEY (created_by)  REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (updated_by)  REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (archived_by) REFERENCES users(id) ON DELETE SET NULL
);

-- ============================================================
-- 9. VENDORS
-- ============================================================
CREATE TABLE vendors (
    id                CHAR(36) PRIMARY KEY,
    name              VARCHAR(255) NOT NULL,
    company_name      VARCHAR(255),
    position          VARCHAR(100),
    vendor_category   ENUM('Material', 'Contractor'),
    type_of_business  ENUM('Paint','Wiring','Glass','Metal','Tiles','Cement','Sand',
                         'Steel','Wood','Flooring','Plumbing Materials','Electrical Materials',
                         'Hardware','Labour','Labour Contractor','Civil Contractor',
                         'Electrician','Plumbing Contractor','Painter','Polishing',
                         'AC Work','Interior Contractor','Carpenter','Mason','Material Contractor'),
    contact_number    VARCHAR(20) NOT NULL,
    alternate_contact VARCHAR(20),
    address           TEXT,
    notes             TEXT,
    status            ENUM('active','inactive','blacklisted','blocked') NOT NULL DEFAULT 'active',
    created_by        CHAR(36) NULL,
    updated_by        CHAR(36) NULL,
    created_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
);

-- ============================================================
-- 10. QUOTATIONS (Fixed for MariaDB)
-- ============================================================
CREATE TABLE quotations (
    id                  CHAR(36) PRIMARY KEY,
    quotation_number    VARCHAR(50) NOT NULL UNIQUE,
    quotation_date      DATE        NOT NULL,
    status              ENUM('draft','submitted','approved','returned_for_editing','declined','cancelled') 
                        NOT NULL DEFAULT 'draft',
    project_id          CHAR(36) NOT NULL,
    vendor_id           CHAR(36) NOT NULL,
    project_snapshot    JSON NOT NULL,           -- Removed DEFAULT
    vendor_snapshot     JSON NOT NULL,           -- Removed DEFAULT
    subtotal            DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    additional_charges  DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    discount            DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    tax_percent         DECIMAL(5,2)  NOT NULL DEFAULT 0.00,
    tax_amount          DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    total_amount        DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    terms_conditions    TEXT,
    submitted_at        TIMESTAMP NULL,
    submitted_by        CHAR(36) NULL,
    reviewed_at         TIMESTAMP NULL,
    reviewed_by         CHAR(36) NULL,
    review_remarks      TEXT,
    deleted_at          TIMESTAMP NULL,
    deleted_by          CHAR(36) NULL,
    created_by          CHAR(36) NULL,
    updated_by          CHAR(36) NULL,
    created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (project_id)   REFERENCES projects(id)  ON DELETE RESTRICT,
    FOREIGN KEY (vendor_id)    REFERENCES vendors(id)   ON DELETE RESTRICT,
    FOREIGN KEY (submitted_by) REFERENCES users(id)     ON DELETE SET NULL,
    FOREIGN KEY (reviewed_by)  REFERENCES users(id)     ON DELETE SET NULL,
    FOREIGN KEY (deleted_by)   REFERENCES users(id)     ON DELETE SET NULL,
    FOREIGN KEY (created_by)   REFERENCES users(id)     ON DELETE SET NULL,
    FOREIGN KEY (updated_by)   REFERENCES users(id)     ON DELETE SET NULL
);

-- ============================================================
-- 11. QUOTATION ITEMS
-- ============================================================
CREATE TABLE quotation_items (
    id           CHAR(36) PRIMARY KEY,
    quotation_id CHAR(36)      NOT NULL,
    sno          SMALLINT      NOT NULL,
    particular   TEXT          NOT NULL,
    rate         DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    quantity     DECIMAL(10,3) NOT NULL DEFAULT 0.000,
    amount       DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    remarks      TEXT,
    FOREIGN KEY (quotation_id) REFERENCES quotations(id) ON DELETE CASCADE,
    UNIQUE KEY uk_quotation_sno (quotation_id, sno)
);

-- ============================================================
-- 12. NOTIFICATIONS
-- ============================================================
CREATE TABLE notifications (
    id           CHAR(36) PRIMARY KEY,
    user_id      CHAR(36) NOT NULL,
    type         ENUM('quotation_submitted','quotation_approved','quotation_returned','quotation_declined') NOT NULL,
    title        VARCHAR(255) NOT NULL,
    message      TEXT NOT NULL,
    quotation_id CHAR(36) NULL,
    is_read      TINYINT(1) NOT NULL DEFAULT 0,
    read_at      TIMESTAMP NULL,
    created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id)      REFERENCES users(id)      ON DELETE CASCADE,
    FOREIGN KEY (quotation_id) REFERENCES quotations(id) ON DELETE SET NULL
);

-- ============================================================
-- 13. ACTIVITY LOGS
-- ============================================================
CREATE TABLE activity_logs (
    id           CHAR(36) PRIMARY KEY,
    user_id      CHAR(36) NULL,
    user_email   VARCHAR(255) NOT NULL,
    user_role    VARCHAR(50)  NOT NULL,
    action       ENUM('login','logout',
                     'quotation_created','quotation_updated','quotation_submitted',
                     'quotation_approved','quotation_returned','quotation_declined','quotation_deleted',
                     'project_created','project_updated','project_archived',
                     'vendor_created','vendor_updated','vendor_deleted',
                     'settings_updated',
                     'user_created','user_updated','user_deactivated') NOT NULL,
    entity_type  VARCHAR(50),
    entity_id    CHAR(36),
    entity_label VARCHAR(255),
    changes      JSON,
    ip_address   VARCHAR(45),
    user_agent   TEXT,
    created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_users_email          ON users(email);
CREATE INDEX idx_users_role           ON users(role);
CREATE INDEX idx_users_is_active      ON users(is_active);

CREATE INDEX idx_auth_tokens_token_hash ON auth_tokens(token_hash);
CREATE INDEX idx_auth_tokens_user_id    ON auth_tokens(user_id);

CREATE INDEX idx_projects_status      ON projects(status);
CREATE INDEX idx_projects_archived    ON projects(archived_at);

CREATE INDEX idx_vendors_status       ON vendors(status);
CREATE INDEX idx_vendors_contact      ON vendors(contact_number);

CREATE INDEX idx_quotations_project   ON quotations(project_id);
CREATE INDEX idx_quotations_vendor    ON quotations(vendor_id);
CREATE INDEX idx_quotations_status    ON quotations(status);
CREATE INDEX idx_quotations_date      ON quotations(quotation_date DESC);

CREATE INDEX idx_quotation_items_qid  ON quotation_items(quotation_id);

CREATE INDEX idx_notifications_user   ON notifications(user_id, is_read);
CREATE INDEX idx_activity_logs_user   ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_created ON activity_logs(created_at DESC); 