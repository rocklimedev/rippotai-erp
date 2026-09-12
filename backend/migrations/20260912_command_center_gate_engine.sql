-- MySQL 5.7. Apply once after the supplied schema and document catalogue. Back up first.

ALTER TABLE gate_definitions ADD COLUMN phase_code varchar(50) NULL;

CREATE TABLE IF NOT EXISTS gate_conditions (
 id char(36) COLLATE utf8_unicode_ci PRIMARY KEY, gate_definition_id char(36) COLLATE utf8_unicode_ci NOT NULL,
 type varchar(60) NOT NULL, label varchar(255) NOT NULL, params json, optional tinyint(1) NOT NULL DEFAULT 0,
 sort_order int NOT NULL DEFAULT 0, created_at datetime DEFAULT CURRENT_TIMESTAMP, updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 KEY (gate_definition_id), FOREIGN KEY (gate_definition_id) REFERENCES gate_definitions(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

CREATE TABLE IF NOT EXISTS gate_transition_logs (
 id char(36) COLLATE utf8_unicode_ci PRIMARY KEY, project_id char(36) COLLATE utf8_unicode_ci NOT NULL,
 gate_definition_id char(36) COLLATE utf8_unicode_ci NOT NULL, action varchar(60) NOT NULL,
 from_status varchar(30), to_status varchar(30), performed_by char(36) COLLATE utf8_unicode_ci,
 remarks text, snapshot json, created_at datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
 KEY history_lookup (project_id, gate_definition_id, created_at),
 FOREIGN KEY (project_id) REFERENCES projects(id), FOREIGN KEY (gate_definition_id) REFERENCES gate_definitions(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- The supplied project_phases table contains 39 CONSULTANCY rows and only
-- a primary-key uniqueness constraint. Repeated consultancy codes/numbers are
-- existing data: do not deduplicate, renumber, or convert them to DOCUMENTS.
-- Match DOCUMENTS seeds by module + phase_code, not a generated ID. Preserve
-- existing IDs, metadata, soft-deletion state, and all phase references.
-- An existing soft-deleted DOCUMENTS phase is not replaced or resurrected;
-- review and restore it explicitly if it should appear in Command Center.
-- Run this migration with a single migration runner (no concurrent seed runs).
START TRANSACTION;

INSERT INTO project_phases (id,module,phase_number,phase_code,title,sort_order)
SELECT 'df430513-9a8b-526e-981a-a33cea8e94ff','DOCUMENTS',1,'01_BRIEF','01 BRIEF',1 FROM DUAL
WHERE NOT EXISTS (
  SELECT 1 FROM project_phases WHERE module='DOCUMENTS' AND phase_code='01_BRIEF'
);

INSERT INTO gate_phase_definitions (id,code,title,sort_order,is_parallel) VALUES ('bea92db7-80aa-56b9-b39c-674c1f55ed4c','01_BRIEF','01 BRIEF',1,0) ON DUPLICATE KEY UPDATE title=VALUES(title);

INSERT INTO project_phases (id,module,phase_number,phase_code,title,sort_order)
SELECT '3aa4d822-dca3-5e58-be3e-91f9eecaa311','DOCUMENTS',2,'02_RECCE','02 RECCE',2 FROM DUAL
WHERE NOT EXISTS (
  SELECT 1 FROM project_phases WHERE module='DOCUMENTS' AND phase_code='02_RECCE'
);

INSERT INTO gate_phase_definitions (id,code,title,sort_order,is_parallel) VALUES ('f0561004-bf80-51d7-98c6-f6df94cec2ed','02_RECCE','02 RECCE',2,0) ON DUPLICATE KEY UPDATE title=VALUES(title);

INSERT INTO project_phases (id,module,phase_number,phase_code,title,sort_order)
SELECT 'a0628b6a-0206-5acd-8fcc-9838fc245781','DOCUMENTS',3,'03_PRE_DESIGN','03 PRE DESIGN',3 FROM DUAL
WHERE NOT EXISTS (
  SELECT 1 FROM project_phases WHERE module='DOCUMENTS' AND phase_code='03_PRE_DESIGN'
);

INSERT INTO gate_phase_definitions (id,code,title,sort_order,is_parallel) VALUES ('5007a9b5-0a5c-55c4-ae0c-4236d9174f38','03_PRE_DESIGN','03 PRE DESIGN',3,0) ON DUPLICATE KEY UPDATE title=VALUES(title);

INSERT INTO project_phases (id,module,phase_number,phase_code,title,sort_order)
SELECT 'bf4191fb-1601-53e1-b84f-ec7a21a56d6d','DOCUMENTS',4,'04_PLANNING','04 PLANNING',4 FROM DUAL
WHERE NOT EXISTS (
  SELECT 1 FROM project_phases WHERE module='DOCUMENTS' AND phase_code='04_PLANNING'
);

INSERT INTO gate_phase_definitions (id,code,title,sort_order,is_parallel) VALUES ('70dd9bc6-e4b9-5d56-8fcf-ca706e09aee3','04_PLANNING','04 PLANNING',4,0) ON DUPLICATE KEY UPDATE title=VALUES(title);

INSERT INTO project_phases (id,module,phase_number,phase_code,title,sort_order)
SELECT 'cb595cbe-ba42-5fc3-af81-39e798fce957','DOCUMENTS',5,'05_DESIGN','05 DESIGN',5 FROM DUAL
WHERE NOT EXISTS (
  SELECT 1 FROM project_phases WHERE module='DOCUMENTS' AND phase_code='05_DESIGN'
);

INSERT INTO gate_phase_definitions (id,code,title,sort_order,is_parallel) VALUES ('ebfbb363-f883-5708-87bc-a8964ae3bc59','05_DESIGN','05 DESIGN',5,0) ON DUPLICATE KEY UPDATE title=VALUES(title);

INSERT INTO project_phases (id,module,phase_number,phase_code,title,sort_order)
SELECT '2a0de81d-a43a-5fb5-96ba-94257a9bc75e','DOCUMENTS',6,'06_TENDER','06 TENDER',6 FROM DUAL
WHERE NOT EXISTS (
  SELECT 1 FROM project_phases WHERE module='DOCUMENTS' AND phase_code='06_TENDER'
);

INSERT INTO gate_phase_definitions (id,code,title,sort_order,is_parallel) VALUES ('decfc696-08b4-5d84-8a18-9ea425263cf1','06_TENDER','06 TENDER',6,0) ON DUPLICATE KEY UPDATE title=VALUES(title);

INSERT INTO project_phases (id,module,phase_number,phase_code,title,sort_order)
SELECT '3a44a34e-db2f-5793-9bbd-dde8d2365828','DOCUMENTS',7,'07_WORKING','07 WORKING',7 FROM DUAL
WHERE NOT EXISTS (
  SELECT 1 FROM project_phases WHERE module='DOCUMENTS' AND phase_code='07_WORKING'
);

INSERT INTO gate_phase_definitions (id,code,title,sort_order,is_parallel) VALUES ('2d7b2953-14e1-5086-9c8b-f8493503a00c','07_WORKING','07 WORKING',7,0) ON DUPLICATE KEY UPDATE title=VALUES(title);

INSERT INTO project_phases (id,module,phase_number,phase_code,title,sort_order)
SELECT '5cec1504-2f7a-5667-832f-4a96b85e8d44','DOCUMENTS',8,'08_EXECUTION','08 EXECUTION',8 FROM DUAL
WHERE NOT EXISTS (
  SELECT 1 FROM project_phases WHERE module='DOCUMENTS' AND phase_code='08_EXECUTION'
);

INSERT INTO gate_phase_definitions (id,code,title,sort_order,is_parallel) VALUES ('226e8d00-7ad3-51d4-8275-6545b955b4ca','08_EXECUTION','08 EXECUTION',8,0) ON DUPLICATE KEY UPDATE title=VALUES(title);

INSERT INTO project_phases (id,module,phase_number,phase_code,title,sort_order)
SELECT '46eb9f32-06c1-5d8f-b486-0730f4d7a0cb','DOCUMENTS',9,'09_HANDOVER','09 HANDOVER',9 FROM DUAL
WHERE NOT EXISTS (
  SELECT 1 FROM project_phases WHERE module='DOCUMENTS' AND phase_code='09_HANDOVER'
);

INSERT INTO gate_phase_definitions (id,code,title,sort_order,is_parallel) VALUES ('33f35a10-ff72-5449-b99b-b0e7ab056c75','09_HANDOVER','09 HANDOVER',9,0) ON DUPLICATE KEY UPDATE title=VALUES(title);

INSERT INTO project_phases (id,module,phase_number,phase_code,title,sort_order)
SELECT 'f5886765-a1ea-56b4-a176-0f187c0f7205','DOCUMENTS',10,'A_VENDOR_TRADES','A VENDOR TRADES',10 FROM DUAL
WHERE NOT EXISTS (
  SELECT 1 FROM project_phases WHERE module='DOCUMENTS' AND phase_code='A_VENDOR_TRADES'
);

INSERT INTO gate_phase_definitions (id,code,title,sort_order,is_parallel) VALUES ('4933e9ea-1801-5dbf-b5a2-77c130faae83','A_VENDOR_TRADES','A VENDOR TRADES',10,1) ON DUPLICATE KEY UPDATE title=VALUES(title);

INSERT INTO project_phases (id,module,phase_number,phase_code,title,sort_order)
SELECT '35ccb713-885f-59f6-9a8f-5aad10fe48ed','DOCUMENTS',11,'B_MATERIAL','B MATERIAL',11 FROM DUAL
WHERE NOT EXISTS (
  SELECT 1 FROM project_phases WHERE module='DOCUMENTS' AND phase_code='B_MATERIAL'
);

INSERT INTO gate_phase_definitions (id,code,title,sort_order,is_parallel) VALUES ('1c066883-29e6-52dc-81a5-9e9ce9b74c41','B_MATERIAL','B MATERIAL',11,1) ON DUPLICATE KEY UPDATE title=VALUES(title);

INSERT INTO gate_definitions (id,code,name,sequence_order,phase_code,opens_phase_id,progress_threshold_pct,allows_override,is_active) VALUES ('0e3a8b35-ed25-5a29-9ccf-6204c317be5e','LAYOUT_FINALISED','LAYOUT FINALISED',1,'03_PRE_DESIGN',(SELECT id FROM gate_phase_definitions WHERE code='A_VENDOR_TRADES'),0,0,1) ON DUPLICATE KEY UPDATE phase_code=VALUES(phase_code), opens_phase_id=VALUES(opens_phase_id);

INSERT INTO gate_definitions (id,code,name,sequence_order,phase_code,opens_phase_id,progress_threshold_pct,allows_override,is_active) VALUES ('6e013338-2fd4-5706-aa2a-d5e4f972405b','CLIENT_SIGNOFF_PITCH_CONCEPT01','CLIENT SIGNOFF PITCH CONCEPT01',2,'03_PRE_DESIGN',(SELECT id FROM gate_phase_definitions WHERE code='04_PLANNING'),0,0,1) ON DUPLICATE KEY UPDATE phase_code=VALUES(phase_code), opens_phase_id=VALUES(opens_phase_id);

INSERT INTO gate_definitions (id,code,name,sequence_order,phase_code,opens_phase_id,progress_threshold_pct,allows_override,is_active) VALUES ('b934edeb-4f36-5826-bf19-8eb6dec21014','TOKEN_RECEIVED','TOKEN RECEIVED',3,'04_PLANNING',NULL,0,0,1) ON DUPLICATE KEY UPDATE phase_code=VALUES(phase_code), opens_phase_id=VALUES(opens_phase_id);

INSERT INTO gate_definitions (id,code,name,sequence_order,phase_code,opens_phase_id,progress_threshold_pct,allows_override,is_active) VALUES ('7be85e9f-1869-5cd4-b672-d5ddb4d8e80a','PROJECT_MOBILISED','PROJECT MOBILISED',4,'04_PLANNING',(SELECT id FROM gate_phase_definitions WHERE code='05_DESIGN'),0,0,1) ON DUPLICATE KEY UPDATE phase_code=VALUES(phase_code), opens_phase_id=VALUES(opens_phase_id);

INSERT INTO gate_definitions (id,code,name,sequence_order,phase_code,opens_phase_id,progress_threshold_pct,allows_override,is_active) VALUES ('c3bbdf55-3269-5039-98ad-1968bdbfa15a','CONCEPT02_FINALISED','CONCEPT02 FINALISED',5,'05_DESIGN',(SELECT id FROM gate_phase_definitions WHERE code='B_MATERIAL'),0,0,1) ON DUPLICATE KEY UPDATE phase_code=VALUES(phase_code), opens_phase_id=VALUES(opens_phase_id);

INSERT INTO gate_definitions (id,code,name,sequence_order,phase_code,opens_phase_id,progress_threshold_pct,allows_override,is_active) VALUES ('74c20532-c9f0-57e9-bc47-85b3ed2f6d48','DESIGN_CLOSED','DESIGN CLOSED',6,'05_DESIGN',NULL,0,0,1) ON DUPLICATE KEY UPDATE phase_code=VALUES(phase_code), opens_phase_id=VALUES(opens_phase_id);

INSERT INTO gate_definitions (id,code,name,sequence_order,phase_code,opens_phase_id,progress_threshold_pct,allows_override,is_active) VALUES ('1916686c-758c-5edb-b543-1364cd87dc1c','PAYMENT_PHASE_01','PAYMENT PHASE 01',7,'05_DESIGN',(SELECT id FROM gate_phase_definitions WHERE code='06_TENDER'),0,0,1) ON DUPLICATE KEY UPDATE phase_code=VALUES(phase_code), opens_phase_id=VALUES(opens_phase_id);

INSERT INTO gate_definitions (id,code,name,sequence_order,phase_code,opens_phase_id,progress_threshold_pct,allows_override,is_active) VALUES ('f53ef67d-685f-539f-94b2-d6db327247d0','TENDER_DRAWINGS_FINALISED','TENDER DRAWINGS FINALISED',8,'06_TENDER',(SELECT id FROM gate_phase_definitions WHERE code='07_WORKING'),0,0,1) ON DUPLICATE KEY UPDATE phase_code=VALUES(phase_code), opens_phase_id=VALUES(opens_phase_id);

INSERT INTO gate_definitions (id,code,name,sequence_order,phase_code,opens_phase_id,progress_threshold_pct,allows_override,is_active) VALUES ('08a47294-c9f0-5dd7-ad84-ab8e66c20eec','ESTIMATE_APPROVED','ESTIMATE APPROVED',9,'A_VENDOR_TRADES',NULL,0,0,1) ON DUPLICATE KEY UPDATE phase_code=VALUES(phase_code), opens_phase_id=VALUES(opens_phase_id);

INSERT INTO gate_definitions (id,code,name,sequence_order,phase_code,opens_phase_id,progress_threshold_pct,allows_override,is_active) VALUES ('05fe5ae3-24f7-59a6-b561-cbb61c8425a2','CONTRACTOR_LINEUP_HANDOFF','CONTRACTOR LINEUP HANDOFF',10,'A_VENDOR_TRADES',(SELECT id FROM gate_phase_definitions WHERE code='08_EXECUTION'),0,0,1) ON DUPLICATE KEY UPDATE phase_code=VALUES(phase_code), opens_phase_id=VALUES(opens_phase_id);

INSERT INTO gate_definitions (id,code,name,sequence_order,phase_code,opens_phase_id,progress_threshold_pct,allows_override,is_active) VALUES ('50c9cb7c-ea87-5ee9-abcd-c3d01730429d','WORKING_DRAWINGS_GFC','WORKING DRAWINGS GFC',11,'07_WORKING',NULL,0,0,1) ON DUPLICATE KEY UPDATE phase_code=VALUES(phase_code), opens_phase_id=VALUES(opens_phase_id);

INSERT INTO gate_definitions (id,code,name,sequence_order,phase_code,opens_phase_id,progress_threshold_pct,allows_override,is_active) VALUES ('b85b6507-d68c-5336-bfdf-cb085ec1ce87','FINAL_CLIENT_SIGNOFF','FINAL CLIENT SIGNOFF',12,'09_HANDOVER',NULL,100,0,1) ON DUPLICATE KEY UPDATE phase_code=VALUES(phase_code), opens_phase_id=VALUES(opens_phase_id);

INSERT INTO gate_conditions (id,gate_definition_id,type,label,params,optional,sort_order) SELECT 'fe555a82-ef14-5971-895f-315fcbb9d8a0',id,'DOCUMENT_TYPE_ALL_APPROVED','Required evidence: 01_BRIEF','{"phaseCode": "01_BRIEF"}',0,1 FROM gate_definitions WHERE code='LAYOUT_FINALISED' ON DUPLICATE KEY UPDATE params=VALUES(params),label=VALUES(label);

INSERT INTO gate_conditions (id,gate_definition_id,type,label,params,optional,sort_order) SELECT '81afde0c-189b-5fd2-aeb9-5422de440e0c',id,'DOCUMENT_TYPE_ALL_APPROVED','Required evidence: 02_RECCE','{"phaseCode": "02_RECCE"}',0,2 FROM gate_definitions WHERE code='LAYOUT_FINALISED' ON DUPLICATE KEY UPDATE params=VALUES(params),label=VALUES(label);

INSERT INTO gate_conditions (id,gate_definition_id,type,label,params,optional,sort_order) SELECT '116656ab-02f8-5af6-b922-942727fb558a',id,'DOCUMENT_APPROVED','Approved: PRE_PROPOSED_LAYOUT','{"documentTypeCode": "PRE_PROPOSED_LAYOUT"}',0,3 FROM gate_definitions WHERE code='LAYOUT_FINALISED' ON DUPLICATE KEY UPDATE params=VALUES(params),label=VALUES(label);

INSERT INTO gate_conditions (id,gate_definition_id,type,label,params,optional,sort_order) SELECT 'b8620468-0227-5bde-a8a0-bc92f3475712',id,'DOCUMENT_TYPE_ALL_APPROVED','Required evidence: 03_PRE_DESIGN','{"phaseCode": "03_PRE_DESIGN"}',0,4 FROM gate_definitions WHERE code='CLIENT_SIGNOFF_PITCH_CONCEPT01' ON DUPLICATE KEY UPDATE params=VALUES(params),label=VALUES(label);

INSERT INTO gate_conditions (id,gate_definition_id,type,label,params,optional,sort_order) SELECT 'd4b7e257-d7af-54d2-a844-239d8af01cf8',id,'DOCUMENT_TYPE_ALL_APPROVED','Required evidence: 04_PLANNING','{"phaseCode": "04_PLANNING"}',0,5 FROM gate_definitions WHERE code='PROJECT_MOBILISED' ON DUPLICATE KEY UPDATE params=VALUES(params),label=VALUES(label);

INSERT INTO gate_conditions (id,gate_definition_id,type,label,params,optional,sort_order) SELECT '1e73a648-898b-52e9-b019-a5e9db820117',id,'DOCUMENT_APPROVED','Approved: PLAN_SIGNED_AGREEMENT','{"documentTypeCode": "PLAN_SIGNED_AGREEMENT"}',1,6 FROM gate_definitions WHERE code='PROJECT_MOBILISED' ON DUPLICATE KEY UPDATE params=VALUES(params),label=VALUES(label);

INSERT INTO gate_conditions (id,gate_definition_id,type,label,params,optional,sort_order) SELECT '530aa162-4730-5298-8968-6f7386fee492',id,'DOCUMENT_APPROVED','Approved: PLAN_SIGNED_CONTRACT','{"documentTypeCode": "PLAN_SIGNED_CONTRACT"}',1,7 FROM gate_definitions WHERE code='PROJECT_MOBILISED' ON DUPLICATE KEY UPDATE params=VALUES(params),label=VALUES(label);

INSERT INTO gate_conditions (id,gate_definition_id,type,label,params,optional,sort_order) SELECT '7e53e605-3294-50b2-ab46-4edf3f4c7204',id,'PAYMENT_MILESTONE_PAID','Paid milestone: TOKEN','{"milestoneCode": "TOKEN"}',0,8 FROM gate_definitions WHERE code='TOKEN_RECEIVED' ON DUPLICATE KEY UPDATE params=VALUES(params),label=VALUES(label);

INSERT INTO gate_conditions (id,gate_definition_id,type,label,params,optional,sort_order) SELECT 'd45aef83-bf27-5485-b96a-11ce554a3355',id,'PAYMENT_MILESTONE_PAID','Paid milestone: PHASE_01','{"milestoneCode": "PHASE_01"}',0,9 FROM gate_definitions WHERE code='PAYMENT_PHASE_01' ON DUPLICATE KEY UPDATE params=VALUES(params),label=VALUES(label);

INSERT INTO gate_conditions (id,gate_definition_id,type,label,params,optional,sort_order) SELECT '959dc2bd-b0bf-5b92-9f3c-500a7f095e02',id,'DOCUMENT_APPROVED','Approved: DES_CONCEPT_DESIGN_02','{"documentTypeCode": "DES_CONCEPT_DESIGN_02"}',0,10 FROM gate_definitions WHERE code='CONCEPT02_FINALISED' ON DUPLICATE KEY UPDATE params=VALUES(params),label=VALUES(label);

INSERT INTO gate_conditions (id,gate_definition_id,type,label,params,optional,sort_order) SELECT '7eef8f79-df71-5f3b-8ccc-4c6a02bdbf1e',id,'DOCUMENT_TYPE_ALL_APPROVED','Required evidence: 05_DESIGN','{"phaseCode": "05_DESIGN"}',0,11 FROM gate_definitions WHERE code='DESIGN_CLOSED' ON DUPLICATE KEY UPDATE params=VALUES(params),label=VALUES(label);

INSERT INTO gate_conditions (id,gate_definition_id,type,label,params,optional,sort_order) SELECT '36682058-bbad-5621-9813-b293a71d896f',id,'DOCUMENT_TYPE_ALL_APPROVED','Required evidence: 06_TENDER','{"phaseCode": "06_TENDER"}',0,12 FROM gate_definitions WHERE code='TENDER_DRAWINGS_FINALISED' ON DUPLICATE KEY UPDATE params=VALUES(params),label=VALUES(label);

INSERT INTO gate_conditions (id,gate_definition_id,type,label,params,optional,sort_order) SELECT '1b08506d-1c13-5807-b032-9919742bc98f',id,'DOCUMENT_APPROVED','Approved: VENDOR_ESTIMATE','{"documentTypeCode": "VENDOR_ESTIMATE"}',0,13 FROM gate_definitions WHERE code='ESTIMATE_APPROVED' ON DUPLICATE KEY UPDATE params=VALUES(params),label=VALUES(label);

INSERT INTO gate_conditions (id,gate_definition_id,type,label,params,optional,sort_order) SELECT '31d7941b-8b5e-5c60-b0b7-5b8de2e138ef',id,'DOCUMENT_APPROVED','Approved: VENDOR_QUOTATION','{"documentTypeCode": "VENDOR_QUOTATION"}',0,14 FROM gate_definitions WHERE code='ESTIMATE_APPROVED' ON DUPLICATE KEY UPDATE params=VALUES(params),label=VALUES(label);

INSERT INTO gate_conditions (id,gate_definition_id,type,label,params,optional,sort_order) SELECT 'e4a0d681-3301-516a-8ea1-fc1ed355848d',id,'DOCUMENT_TYPE_ALL_APPROVED','Required evidence: A_VENDOR_TRADES','{"phaseCode": "A_VENDOR_TRADES"}',0,15 FROM gate_definitions WHERE code='CONTRACTOR_LINEUP_HANDOFF' ON DUPLICATE KEY UPDATE params=VALUES(params),label=VALUES(label);

INSERT INTO gate_conditions (id,gate_definition_id,type,label,params,optional,sort_order) SELECT '8c7cc877-c26a-56a8-9eb4-e211d83a8392',id,'DOCUMENT_APPROVED','Approved: WORK_CIVIL_DETAILS','{"documentTypeCode": "WORK_CIVIL_DETAILS"}',0,16 FROM gate_definitions WHERE code='CONTRACTOR_LINEUP_HANDOFF' ON DUPLICATE KEY UPDATE params=VALUES(params),label=VALUES(label);

INSERT INTO gate_conditions (id,gate_definition_id,type,label,params,optional,sort_order) SELECT 'd5d6e70c-d618-5425-8062-e6a41a3c3ccc',id,'DOCUMENT_APPROVED','Approved: WORK_STRUCTURE_LAYOUT','{"documentTypeCode": "WORK_STRUCTURE_LAYOUT"}',0,17 FROM gate_definitions WHERE code='CONTRACTOR_LINEUP_HANDOFF' ON DUPLICATE KEY UPDATE params=VALUES(params),label=VALUES(label);

INSERT INTO gate_conditions (id,gate_definition_id,type,label,params,optional,sort_order) SELECT '1be7431b-330e-54d9-86c0-1eaee109a98c',id,'DOCUMENT_TYPE_ALL_APPROVED','Required evidence: 07_WORKING','{"phaseCode": "07_WORKING"}',0,18 FROM gate_definitions WHERE code='WORKING_DRAWINGS_GFC' ON DUPLICATE KEY UPDATE params=VALUES(params),label=VALUES(label);

INSERT INTO gate_conditions (id,gate_definition_id,type,label,params,optional,sort_order) SELECT 'a54aceb6-11a9-5508-ae3e-2ccf46947711',id,'DOCUMENT_TYPE_ALL_APPROVED','Required evidence: 08_EXECUTION','{"phaseCode": "08_EXECUTION"}',0,19 FROM gate_definitions WHERE code='FINAL_CLIENT_SIGNOFF' ON DUPLICATE KEY UPDATE params=VALUES(params),label=VALUES(label);

INSERT INTO gate_conditions (id,gate_definition_id,type,label,params,optional,sort_order) SELECT '74db003a-b872-5146-9ab0-66561ad77b3d',id,'DOCUMENT_TYPE_ALL_APPROVED','Required evidence: 09_HANDOVER','{"phaseCode": "09_HANDOVER"}',0,20 FROM gate_definitions WHERE code='FINAL_CLIENT_SIGNOFF' ON DUPLICATE KEY UPDATE params=VALUES(params),label=VALUES(label);

INSERT INTO gate_conditions (id,gate_definition_id,type,label,params,optional,sort_order) SELECT 'f7b3dda4-bade-574f-988b-55444a16311e',id,'DOCUMENT_TYPE_ALL_APPROVED','Required evidence: B_MATERIAL','{"phaseCode": "B_MATERIAL"}',0,21 FROM gate_definitions WHERE code='FINAL_CLIENT_SIGNOFF' ON DUPLICATE KEY UPDATE params=VALUES(params),label=VALUES(label);

INSERT INTO gate_conditions (id,gate_definition_id,type,label,params,optional,sort_order) SELECT '73e53e3d-b670-5b49-9bc5-2a6902da37df',id,'MANUAL_APPROVAL','Client final walkthrough and sign-off','{}',0,22 FROM gate_definitions WHERE code='FINAL_CLIENT_SIGNOFF' ON DUPLICATE KEY UPDATE params=VALUES(params),label=VALUES(label);

COMMIT;
-- Assign these through existing RBAC management to the authorized roles.
INSERT INTO permissions (id,name,resource,action) VALUES (UUID(),'gates:read','gates','read') ON DUPLICATE KEY UPDATE resource=VALUES(resource);
INSERT INTO permissions (id,name,resource,action) VALUES (UUID(),'gates:clear','gates','clear') ON DUPLICATE KEY UPDATE resource=VALUES(resource);
INSERT INTO permissions (id,name,resource,action) VALUES (UUID(),'gates:reopen','gates','reopen') ON DUPLICATE KEY UPDATE resource=VALUES(resource);
INSERT INTO permissions (id,name,resource,action) VALUES (UUID(),'gates:override','gates','override') ON DUPLICATE KEY UPDATE resource=VALUES(resource);
INSERT INTO permissions (id,name,resource,action) VALUES (UUID(),'documents:approve','documents','approve') ON DUPLICATE KEY UPDATE resource=VALUES(resource);
