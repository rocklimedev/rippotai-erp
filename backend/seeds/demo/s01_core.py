"""01 core: units, project types, users, teams, clients, projects, gates, doc catalogue, settings, T&C."""
import re
from pathlib import Path
from lib import *


def build(o: Out):
    # ---------- schema fixes (additive only) ----------
    # Backend enum TeamMemberOwnerType has TEAM; DB enum lacks it -> user team membership fails.
    enum = q("SHOW COLUMNS FROM team_members LIKE 'owner_type'")[0][1]
    if "'TEAM'" not in enum:
        o.sql("ALTER TABLE team_members MODIFY owner_type enum('PROJECT','PLAN_OF_ACTION','QUOTATION','BOQ','TEAM') NULL")

    now = dt(0, 9)
    # ---------- units ----------
    o.ins("units", [dict(id=U("unit:" + c), name=n, code=c, description=n, is_active=1,
                         created_at=dt(-200), updated_at=dt(-200)) for c, n in UNITS])

    # ---------- project types ----------
    o.sql("UPDATE project_types SET slug='residential', description='Independent houses, kothis and builder floors' "
          f"WHERE id='{RESIDENTIAL_TYPE}' AND (slug='' OR slug IS NULL)")
    o.ins("project_types", [dict(id=PTID[k], name=n, slug=k, description=desc, created_at=dt(-200), updated_at=dt(-200))
                            for k, n, desc in PROJECT_TYPES if k != "residential"])

    # ---------- users (password = Inos@2026, copied from the admin hash) ----------
    for i, (k, name, email, phone, title, team, role) in enumerate(USERS):
        o.sql(f"INSERT IGNORE INTO users (id,name,email,password_hash,phone,job_title,role_id,is_active,last_login_at,created_by,created_at,updated_at) "
              f"SELECT {lit(UID[k])},{lit(name)},{lit(email)},password_hash,{lit(phone)},{lit(title)},{lit(role)},1,"
              f"{lit(dt(-(i % 4), 9 + i % 8, 5 * i % 60))},{lit(ADMIN)},{lit(dt(-190 + i * 3))},{lit(dt(-5))} "
              f"FROM users WHERE id={lit(ADMIN)}")
    # Internal staff role gets every app except the admin console so non-admin logins see data.
    o.sql("INSERT IGNORE INTO role_apps (role_id, app_code, granted_at, granted_by) "
          f"SELECT {lit(ROLE_USER)}, code, NOW(), {lit(ADMIN)} FROM apps WHERE code <> 'adminConsole'")

    # ---------- teams ----------
    # Company teams use UUIDs (users/RBAC module). Trade + site teams use numeric-string ids because the
    # site-operations / process-workflow models reference teams by INTEGER (routed_to_team_id, trade_team_id...).
    teams = [
        (U("team:design"), "Design Studio", "ARCHITECT", 0, None, "Architecture and interior design team"),
        (U("team:site"), "Site Execution", "SUPERVISOR", 0, None, "Site engineers and supervisors"),
        (U("team:procurement"), "Procurement", "PROCUREMENT", 0, None, "Vendor, material and PO management"),
        (U("team:accounts"), "Accounts", "ACCOUNTS", 0, None, "Billing, collections and vendor payments"),
        (U("team:planning"), "Planning & PMC", "PLANNING", 0, None, "Project planning, scheduling and PMC"),
        (U("team:bd"), "Business Development", "ADMIN", 0, None, "Leads, proposals and client onboarding"),
        ("1", "Civil Works", "TRADE", 1, "CIVIL", "Masonry, RCC, plaster and civil contractors"),
        ("2", "Electrical", "TRADE", 1, "ELECTRICAL", "Wiring, DB, lighting and ELV"),
        ("3", "Plumbing & Sanitary", "TRADE", 1, "PLUMBING", "Plumbing, drainage and CP/sanitary fixing"),
        ("4", "Carpentry & Joinery", "TRADE", 1, "CARPENTRY", "Modular and on-site carpentry, wardrobes, panelling"),
        ("5", "False Ceiling", "TRADE", 1, "FALSE_CEILING", "Gypsum, grid and wooden ceilings"),
        ("6", "Painting & Polish", "TRADE", 1, "PAINTING", "Putty, paint, PU and melamine polish"),
        ("7", "Flooring & Stone", "TRADE", 1, "FLOORING", "Marble, granite, tiles and wooden flooring"),
        ("8", "HVAC", "TRADE", 1, "HVAC", "VRV/split AC, ducting and ventilation"),
        ("9", "Design Coordination", "ARCHITECT", 0, None, "RFI desk - design responses to site queries"),
        ("10", "Site Supervision", "SUPERVISOR", 0, None, "Daily supervision crew"),
    ]
    o.ins("teams", [dict(id=i, name=n, description=desc, status="ACTIVE", sort_order=idx, created_by=ADMIN,
                         created_at=dt(-200), updated_at=dt(-200), type=t, is_trade=tr, trade_category=tc,
                         contact_email=None, is_active=1)
                    for idx, (i, n, t, tr, tc, desc) in enumerate(teams)])
    tm = []
    for k, name, email, phone, title, team, role in USERS:
        tid = U("team:" + team)
        tm.append(dict(id=U("tm:" + k), team_id=tid, owner_type="TEAM", owner_id=tid, user_id=UID[k],
                       role_label=title, is_primary=int(title.startswith(("Principal", "Procurement Manager", "Accounts", "Project Manager", "Business"))),
                       sort_order=0, created_by=ADMIN, updated_by=None, created_at=dt(-180), updated_at=dt(-180), deleted_at=None))
    tm.append(dict(id=U("tm:ajay"), team_id=U("team:design"), owner_type="TEAM", owner_id=U("team:design"), user_id=ADMIN,
                   role_label="Founder", is_primary=0, sort_order=0, created_by=ADMIN, updated_by=None,
                   created_at=dt(-180), updated_at=dt(-180), deleted_at=None))
    o.ins("team_members", tm)

    # ---------- clients ----------
    for k, name, contact, email, phone, addr in CLIENTS:
        if k in EXISTING_CLIENTS:
            o.sql(f"UPDATE clients SET contact_person=COALESCE(contact_person,{lit(contact)}), phone=COALESCE(phone,{lit(phone)}), "
                  f"address=COALESCE(address,{lit(addr)}) WHERE id={lit(CID[k])}")
    o.ins("clients", [dict(id=CID[k], name=n, slug=re.sub(r"[^a-z0-9]+", "-", n.lower()).strip("-"), contact_person=c,
                           email=e, phone=p, address=a, created_at=dt(-240 + i * 9), updated_at=dt(-20), deleted_at=None)
                      for i, (k, n, c, e, p, a) in enumerate(CLIENTS) if k not in EXISTING_CLIENTS])

    # ---------- projects ----------
    rows = []
    for p in PROJECTS:
        (k, name, ck, tk, loc, budget, status, prio, phase, prog, ago, dur, _si, sqft, floors, stype) = p
        start = d(-ago)
        end = start + timedelta(days=dur)
        variance = {"bhatia": 12, "malhotra": 6, "courtyard": 0, "brew": 21, "singhania": -4}.get(k, 0)
        tstatus = "completed" if status == "completed" else ("delayed" if variance > 5 else ("on_hold" if status == "on_hold" else "on_track"))
        nxt = {"01_BRIEF": "Brief sign-off", "02_RECCE": "Site recce & measurement", "03_PRE_DESIGN": "Layout finalised",
               "04_PLANNING": "Token received & mobilisation", "05_DESIGN": "Concept 02 finalised",
               "06_TENDER": "Tender drawings finalised", "07_WORKING": "GFC working drawings",
               "08_EXECUTION": "Finishing & snag list", "09_HANDOVER": "Final client sign-off"}[phase]
        desc = {
            "kapoor": "2-acre farmhouse: main house renovation, new pool pavilion, landscape and full turnkey interiors.",
            "malhotra": "Reconstruction of a 3-storey kothi on a 500 sq yd plot - architecture, structure, MEP and interiors.",
            "sagar": "Builder-floor interiors across 3 floors with a terrace lounge; client occupied during design.",
            "cmstore": "Flagship marble & stone experience store for Chhabra Marble with slab gallery and client lounge.",
            "aurum": "14,500 sq ft corporate office fit-out for a boutique investment firm: 90 workstations, 6 cabins, boardroom.",
            "bhatia": "Ground-up construction of a 4-storey kothi with basement, home theatre and rooftop garden; turnkey.",
            "oberoi": "4 BHK apartment turnkey interiors with Italian marble, modular kitchen and home automation.",
            "courtyard": "22-key boutique heritage hotel around a central courtyard; architecture, interiors and landscape.",
            "rocklime": "Sanitaryware & tiles experience centre for Rocklime with live bathroom mock-ups and training room.",
            "gupta": "Weekend farmhouse with 5 suites, pavilion, courtyard pool and orchard landscape.",
            "arora": "9,000 sq ft corporate office with test kitchen and experience room for a packaged-foods brand.",
            "singhania": "Duplex penthouse interiors with a double-height living room and private terrace deck.",
            "tandon": "Complete interior renovation of a 3-floor residence; handed over and in warranty period.",
            "brew": "Specialty coffee cafe with roastery counter; on hold pending landlord NOC for facade changes.",
        }[k]
        rows.append(dict(id=PID[k], name=name, slug=re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-"),
                         client_id=CID[ck], project_type_id=PTID[tk], site_location=loc, description=desc,
                         priority=prio, status=status, expected_completion_date=end, quotation_count=0,
                         approved_value=budget, created_by=ADMIN, updated_by=ADMIN,
                         created_at=datetime.combine(start, datetime.min.time()).replace(hour=11),
                         updated_at=dt(-(1 + (len(k) % 3)), 16), current_phase=phase, progress_pct=prog,
                         timeline_status=tstatus, next_milestone_name=nxt, schedule_variance=variance,
                         planned_duration=dur))
    o.ins("projects", [r for r in rows if r["id"] not in EXISTING_PROJECTS.values()])
    for r in rows:
        if r["id"] in EXISTING_PROJECTS.values():
            o.sql("UPDATE projects SET client_id=COALESCE(client_id,{client_id}), project_type_id=COALESCE(project_type_id,{project_type_id}), "
                  "description=COALESCE(description,{description}), priority={priority}, expected_completion_date=COALESCE(expected_completion_date,{ecd}), "
                  "approved_value=IF(approved_value=0,{approved_value},approved_value), current_phase=COALESCE(current_phase,{current_phase}), "
                  "progress_pct=IF(progress_pct=0,{progress_pct},progress_pct), timeline_status=COALESCE(timeline_status,{timeline_status}), "
                  "next_milestone_name=COALESCE(next_milestone_name,{nm}), schedule_variance={sv}, planned_duration=IF(planned_duration=0,{pdur},planned_duration), "
                  "created_at=LEAST(created_at,{created_at}) WHERE id={id}".format(
                      **{kk: lit(v) for kk, v in r.items()}, ecd=lit(r["expected_completion_date"]), nm=lit(r["next_milestone_name"]),
                      sv=lit(r["schedule_variance"]), pdur=lit(r["planned_duration"])))

    # project team assignments
    tm = []
    for k, (arch, site) in PM.items():
        members = [(arch, "Lead Architect", 1), ("anjali", "Project Manager", 1), ("pooja", "Procurement", 0), ("sunita", "Accounts", 0)]
        if site:
            members.append((site, "Site Engineer", 1))
        if k in ("bhatia", "malhotra", "kapoor"):
            members.append(("kabir", "Design Support", 0))
        for j, (uk, role, prim) in enumerate(members):
            team = next(t for kk, *_x, t, _r in USERS if kk == uk) if uk != "ajay" else "design"
            tm.append(dict(id=U(f"ptm:{k}:{uk}"), team_id=U("team:" + team), owner_type="PROJECT", owner_id=PID[k], user_id=UID[uk],
                           role_label=role, is_primary=prim, sort_order=j, created_by=ADMIN, updated_by=None,
                           created_at=dt(start_of(k)), updated_at=dt(start_of(k)), deleted_at=None))
    o.ins("team_members", tm)

    # ---------- gates ----------
    gdefs = q("SELECT id, code, phase_code, sequence_order FROM gate_definitions ORDER BY sequence_order")
    pg, logs = [], []
    for p in PROJECTS:
        k = p[0]
        cur = pidx(k)
        first_open = True
        for gid, code, gphase, seq in gdefs:
            gi = PHASE_IDX.get(gphase, 99)
            span = max(1, p[10])
            if gi < cur:
                status = "CLEARED"
                cleared = dt(start_of(k) + int(span * (gi + 0.8) / max(cur, 1)), 15)
            elif gi == cur or (first_open and gi > cur and False):
                status = "READY" if (p[9] % 2 == 0 and first_open) else "PENDING"
                cleared = None
            else:
                status = "LOCKED"
                cleared = None
            if status in ("READY", "PENDING"):
                first_open = False
            row = dict(id=U(f"pg:{k}:{code}"), project_id=PID[k], gate_definition_id=gid, status=status,
                       cleared_at=cleared, cleared_by=(UID[PM[k][0]] if cleared else None),
                       remarks=(f"{code.replace('_', ' ').title()} cleared after client review." if cleared else None),
                       overridden=0, last_readiness_snapshot=None, created_at=dt(start_of(k)), updated_at=cleared or dt(-2))
            pg.append(row)
            o.sql(f"UPDATE project_gates SET status={lit(status)}, cleared_at={lit(cleared)}, cleared_by={lit(row['cleared_by'])}, "
                  f"remarks={lit(row['remarks'])} WHERE project_id={lit(PID[k])} AND gate_definition_id={lit(gid)} AND status IN ('LOCKED','PENDING')")
            if cleared:
                logs.append(dict(id=U(f"gtl:{k}:{code}:ready"), project_id=PID[k], gate_definition_id=gid, action="READY",
                                 from_status="PENDING", to_status="READY", performed_by=None, remarks="All conditions satisfied",
                                 snapshot=None, created_at=cleared - timedelta(days=2)))
                logs.append(dict(id=U(f"gtl:{k}:{code}:clear"), project_id=PID[k], gate_definition_id=gid, action="CLEAR",
                                 from_status="READY", to_status="CLEARED", performed_by=UID[PM[k][0]],
                                 remarks=f"{code.replace('_', ' ').title()} approved", snapshot=None, created_at=cleared))
    o.ins("project_gates", pg)
    o.ins("gate_transition_logs", logs)

    # ---------- document catalogue (83 types from COMMAND_CENTER_EVIDENCE_SOURCES.md) ----------
    md = Path(__file__).resolve().parents[2] / "migrations" / "COMMAND_CENTER_EVIDENCE_SOURCES.md"
    prefix = {"BRIEF": ("01_BRIEF", "01 BRIEF"), "RECCE": ("02_RECCE", "02 RECCE"), "PRE": ("03_PRE_DESIGN", "03 PRE DESIGN"),
              "PLAN": ("04_PLANNING", "04 PLANNING"), "DES": ("05_DESIGN", "05 DESIGN"), "TENDER": ("06_TENDER", "06 TENDER"),
              "WORK": ("07_WORKING", "07 WORKING"), "MOD": ("07_WORKING", "07 WORKING"), "EXEC": ("08_EXECUTION", "08 EXECUTION"),
              "HANDOVER": ("09_HANDOVER", "09 HANDOVER"), "VENDOR": ("A_VENDOR_TRADES", "A VENDOR TRADES"),
              "MAT": ("B_MATERIAL", "B MATERIAL")}
    sections = {"MOD": ("MODULAR", "Modular & Furniture Details"), "WORK": ("WORKING", "Working Drawings")}
    phase_ids = {c: i for i, c in q("SELECT id, phase_code FROM project_phases WHERE module='DOCUMENTS'")}
    dts, seq = [], {}
    for line in md.read_text(encoding="utf-8").splitlines():
        m = re.match(r"\| `([A-Z0-9_]+)` \| (.+?) \| (.+?) \|$", line)
        if not m:
            continue
        code, name, source = m.groups()
        pc, pn = prefix[code.split("_")[0]]
        seq[pc] = seq.get(pc, 0) + 1
        sc, sn = sections.get(code.split("_")[0], (None, None))
        optional = code in ("TENDER_LANDSCAPING", "WORK_LANDSCAPE_DETAILS", "MOD_BED_BACK_DETAILS", "MOD_WALL_PANELING_DETAILS",
                            "EXEC_TERMITE_TREATMENT_CERTIFICATE", "RECCE_SCOPE_OF_APPROVAL", "HANDOVER_CARE_MAINTENANCE_NOTES")
        dts.append(dict(id=U("doctype:" + code), code=code, name=name, phase_code=pc, project_phase_id=phase_ids.get(pc),
                        phase_name=pn, section_code=sc, section_name=sn, sequence=seq[pc],
                        target_type="DRAWING" if source.startswith("drawings") else "DOCUMENT",
                        requirement_type="OPTIONAL" if optional else "REQUIRED",
                        allows_multiple=int(code.startswith(("MAT_PURCHASE", "MAT_DELIVERY", "EXEC_DAILY", "EXEC_SITE_VISIT"))),
                        requires_revision=int(source.startswith("drawings")),
                        requires_approval=int(code in ("PRE_PROPOSED_LAYOUT", "PLAN_SIGNED_AGREEMENT", "PLAN_SIGNED_CONTRACT", "DES_CONCEPT_DESIGN_02",
                                                       "WORK_CIVIL_DETAILS", "WORK_STRUCTURE_LAYOUT", "VENDOR_ESTIMATE", "VENDOR_QUOTATION")),
                        description=f"{name} - evidence source: {source}", is_active=1, created_at=dt(-200), updated_at=dt(-200)))
    o.ins("document_types", dts)

    # ---------- settings ----------
    settings = {
        "company_profile": {"name": "Rippotai Architecture", "legalName": "Rippotai Architecture LLP",
                            "tagline": "Architecture | Interiors | Turnkey Construction",
                            "address": "B-3/33, Mianwali Nagar, New Delhi 110087",
                            "phone": "+91 88828 30560", "email": "sagar@rippotai.in", "website": "https://rippotai.in",
                            "gstin": "07AAVFR4821K1Z6", "pan": "AAVFR4821K", "logoUrl": "/rippotai_logo.png",
                            "sisterConcerns": ["Rocklime India Pvt Ltd", "Chhabra Marble Pvt Ltd"]},
        "bank_details": {"accountName": "Rippotai Architecture LLP", "bank": "HDFC Bank", "branch": "Nehru Place, New Delhi",
                         "accountNumber": "50200071234567", "ifsc": "HDFC0000236", "upi": "rippotai@hdfcbank"},
        "billing": {"defaultGstRate": 18, "invoicePrefix": "RA/INV/", "quotationValidityDays": 30, "currency": "INR",
                    "financialYearStart": "04-01"},
        "signature": {"authorisedSignatory": "Ajay Chhabra", "designation": "Founder & Principal",
                      "signatureUrl": "/brand/signature-ajay.png"},
        "procurement": {"poPrefix": "RA/PO/", "woPrefix": "RA/WO/", "dcPrefix": "RA/DC/", "defaultPaymentTerms": "30% advance, 60% on delivery, 10% after installation",
                        "approvalLimit": 500000},
        "site_operations": {"reportCutoffTime": "19:00", "workingHours": "09:30 - 18:30", "weeklyOff": "Sunday"},
    }
    o.ins("settings", [dict(id=U("setting:" + k), key=k, value=v, updated_by=ADMIN, updated_at=dt(-30)) for k, v in settings.items()])

    # ---------- terms templates ----------
    terms = [
        ("global", "Standard Terms & Conditions", "GLOBAL", 1,
         "<ol><li>All rates are exclusive of GST @18% unless mentioned.</li><li>Quotation valid for 30 days from date of issue.</li>"
         "<li>Any work beyond approved scope will be treated as an extra item and billed at agreed rates.</li>"
         "<li>Client to provide water and electricity at site free of cost.</li><li>Disputes subject to Delhi jurisdiction only.</li></ol>"),
        ("boq", "BOQ Terms - Turnkey Interiors", "BOQ", 1,
         "<ol><li>Quantities are indicative and will be measured at site on completion.</li><li>Brands as per approved material schedule; equivalent alternatives only with written approval.</li>"
         "<li>Loose furniture, soft furnishings and appliances excluded unless listed.</li><li>Miscellaneous provision @10% covers minor consumables and site contingencies.</li></ol>"),
        ("estimate", "Budget Estimate Terms", "ESTIMATE", 1,
         "<ol><li>This is a budgetary estimate prepared at concept stage; variance of +/-10% expected.</li><li>Design fee and PMC fee shown separately.</li>"
         "<li>Final BOQ will be issued after GFC drawings.</li></ol>"),
        ("poa", "Plan of Action Terms", "PLAN_OF_ACTION", 1,
         "<ol><li>Timelines assume timely approvals (within 5 working days) and payments as per schedule.</li><li>Society/RWA restrictions on working hours may extend durations.</li>"
         "<li>Monsoon (Jul-Aug) may affect civil and external works.</li></ol>"),
        ("project", "Design Consultancy Agreement Terms", "PROJECT", 0,
         "<ol><li>Design fee payable in stages: 10% token, 30% on concept approval, 30% on GFC drawings, 30% during execution.</li>"
         "<li>Two rounds of revisions included per design stage.</li><li>Site visits: weekly during execution.</li></ol>"),
    ]
    o.ins("terms_templates", [dict(id=U("terms:" + k), name=n, scope=s, content_html=h, current_version=2 if k in ("global", "boq") else 1,
                                   is_default=df, is_active=1, created_by=ADMIN, updated_by=UID["ritika"], created_at=dt(-180),
                                   updated_at=dt(-40), deleted_at=None) for k, n, s, df, h in terms])
    vers = []
    for k, n, s, df, h in terms:
        vers.append(dict(id=U(f"termsv:{k}:1"), terms_template_id=U("terms:" + k), version=1, content_html=h,
                         change_note="Initial version", created_by=ADMIN, created_at=dt(-180)))
        if k in ("global", "boq"):
            vers.append(dict(id=U(f"termsv:{k}:2"), terms_template_id=U("terms:" + k), version=2, content_html=h,
                             change_note="Updated GST and validity clauses", created_by=UID["ritika"], created_at=dt(-40)))
    o.ins("terms_template_versions", vers)
