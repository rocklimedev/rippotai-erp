"""04 BOQ & finance: rate library, BOQ templates, BOQs (+versions), budget estimates, payment schedules, milestones."""
from lib import *

# category -> [(item, unit, rate, qty-per-1000-sqft, calc M/L)]
LIB = {
    "Civil Work": [("Demolition of existing flooring & dado", "SQFT", 28, 700, "L"), ("Brick masonry 115 mm partition", "SQFT", 145, 180, "M"),
                   ("Cement plaster 12 mm", "SQFT", 42, 900, "M"), ("Waterproofing - wet areas", "SQFT", 95, 120, "M")],
    "Flooring & Stone": [("Italian marble - supply & lay", "SQFT", 1350, 420, "M"), ("Vitrified tile flooring", "SQFT", 210, 250, "M"),
                         ("Marble diamond polishing", "SQFT", 38, 420, "L"), ("Granite kitchen counter", "RFT", 2600, 6, "M")],
    "False Ceiling": [("Gypsum false ceiling", "SQFT", 115, 650, "M"), ("Cove with LED provision", "RFT", 180, 90, "M")],
    "Electrical": [("Light / fan point wiring", "PT", 1150, 28, "M"), ("16A power point", "PT", 1650, 9, "M"), ("LED COB downlights", "NOS", 1650, 30, "M"),
                   ("Distribution board with MCBs", "NOS", 14500, 0.6, "M")],
    "Plumbing & Sanitary": [("Internal CPVC plumbing per bathroom", "SET", 38000, 0.6, "M"), ("Wall-hung WC with concealed cistern", "SET", 48000, 0.6, "M"),
                            ("CP fittings package per bathroom", "SET", 65000, 0.6, "M")],
    "Carpentry & Furniture": [("Wardrobes - ply + laminate", "SQFT", 2450, 90, "M"), ("Modular kitchen", "RFT", 15500, 3, "M"),
                              ("TV unit with fluted panelling", "SQFT", 1950, 25, "M"), ("Main door - veneer, solid core", "NOS", 68000, 0.12, "M")],
    "Painting & Polish": [("Putty + primer + 2 coats emulsion", "SQFT", 32, 2600, "M"), ("PU polish on veneer", "SQFT", 210, 120, "L")],
}
TEMPLATES = [("essential", "Essential Apartment Interiors", "essential"), ("premium", "Premium Kothi Turnkey", "premium"), ("luxury", "Luxury Farmhouse Turnkey", "luxury")]
BOQ_PROJECTS = ["kapoor", "malhotra", "sagar", "cmstore", "aurum", "bhatia", "oberoi", "courtyard", "rocklime", "singhania", "tandon", "brew"]


def build(o: Out):
    uid = unit_ids()
    # ---------- rate library ----------
    lc, li = [], []
    for i, (cat, items) in enumerate(LIB.items()):
        lc.append(dict(id=U("lcat:" + cat), name=cat, sort_order=i, created_at=dt(-200), updated_at=dt(-60), deleted_at=None))
        for j, (n, un, rate, _q, _c) in enumerate(items):
            li.append(dict(id=U(f"litem:{cat}:{n}"), name=n, category_id=U("lcat:" + cat), category_name=cat, unit_id=uid[un], unit=un.lower(),
                           default_rate=rate, notes="Rate incl. material & labour" if _c == "M" else "Labour only", is_active=1,
                           created_at=dt(-200), updated_at=dt(-60), deleted_at=None))
    o.ins("library_categories", lc)
    o.ins("library_items", li)

    # ---------- BOQ templates ----------
    tt, tc, ti = [], [], []
    for k, name, tier in TEMPLATES:
        tid = U("boqtpl:" + k)
        tt.append(dict(id=tid, name=name, template_tier=tier, description=f"{name} - standard categories and rates (per 1,000 sq ft)", created_by=UID["ritika"],
                       updated_by=UID["ritika"], created_at=dt(-180), updated_at=dt(-60), deleted_at=None))
        mult = {"essential": 0.8, "premium": 1.0, "luxury": 1.35}[tier]
        for i, (cat, items) in enumerate(LIB.items()):
            cid = U(f"boqtplcat:{k}:{cat}")
            tc.append(dict(id=cid, template_id=tid, name=cat, sort_order=i, created_at=dt(-180), updated_at=dt(-180)))
            for j, (n, un, rate, qty, _c) in enumerate(items):
                ti.append(dict(id=U(f"boqtplitem:{k}:{cat}:{n}"), boq_category_id=cid, library_item_id=U(f"litem:{cat}:{n}"), name=n, unit_id=uid[un], unit=un.lower(),
                               quantity=qty, rate=round(rate * mult, 2), notes=None, sort_order=j, created_at=dt(-180), updated_at=dt(-180)))
    o.ins("boq_templates", tt)
    o.ins("boq_template_categories", tc)
    o.ins("boq_template_items", ti)

    # ---------- BOQs ----------
    boqs, vers, cats, items, misc, acts, links = [], [], [], [], [], [], []
    for n_, pk in enumerate(BOQ_PROJECTS):
        p = PBYKEY[pk]
        scale = p[13] / 1000
        tier = "luxury" if p[5] > 30000000 else ("premium" if p[5] > 12000000 else "essential")
        ph = pidx(pk)
        nver = 2 if pk in ("kapoor", "malhotra", "oberoi", "bhatia", "cmstore") else 1
        root = U(f"boq:{pk}:1")
        created0 = dt(start_of(pk) + 40)
        for v in range(1, nver + 1):
            bid = U(f"boq:{pk}:{v}")
            latest = v == nver
            if ph >= 7:
                st = "approved" if latest else "archived"
            elif ph >= 5:
                st = "awaiting_approval" if latest else "archived"
            else:
                st = "draft"
            if pk == "brew" and latest:
                st = "returned"
            vmult = 1 + 0.06 * (v - 1)
            total_items = 0
            for i, (cat, litems) in enumerate(LIB.items()):
                cid = U(f"boqcat:{pk}:{v}:{cat}")
                cats.append(dict(id=cid, boq_id=bid, name=cat, sort_order=i, created_at=created0, updated_at=created0))
                for j, (nm, un, rate, qty, calc) in enumerate(litems):
                    qv = round(qty * scale * (1.1 if tier == "luxury" else 1), 2)
                    rv = round(rate * vmult * {"essential": 0.85, "premium": 1, "luxury": 1.3}[tier], 2)
                    amt = round(qv * rv, 2)
                    total_items += amt
                    items.append(dict(id=U(f"boqitem:{pk}:{v}:{cat}:{nm}"), boq_category_id=cid, library_item_id=U(f"litem:{cat}:{nm}"), name=nm, unit_id=uid[un],
                                      unit=un.lower(), quantity=qv, rate=rv, amount=amt, calc_type=calc, location=["All floors", "Ground floor", "First floor", "Common areas"][j % 4],
                                      detail={"brand": ["Chhabra Marble", "Legrand", "Rocklime", "Century", "Asian Paints"][j % 5], "spec": "As per approved material schedule"},
                                      notes=None, hidden=0, sort_order=j, created_at=created0, updated_at=created0))
            misc_pct = 10
            miscs = [("Site contingency", round(total_items * 0.02, 2)), ("Cartage & debris removal", round(total_items * 0.01, 2))]
            for j, (mn, mv) in enumerate(miscs):
                misc.append(dict(id=U(f"boqmisc:{pk}:{v}:{j}"), boq_id=bid, name=mn, value=mv, notes=None, sort_order=j, created_at=created0, updated_at=created0))
            design = round(total_items * 0.08, 2)
            execution = round(total_items * 0.04, 2) if pk not in ("aurum", "sagar") else 0
            sup = round(total_items * 0.02, 2)
            addl = sum(mv for _, mv in miscs)
            total = round(total_items * (1 + misc_pct / 100) + design + execution + sup + addl, 2)
            cdate = created0 + timedelta(days=30 * (v - 1))
            boqs.append(dict(id=bid, project_id=PID[pk], title=f"{PNAME[pk]} - {'Final' if st == 'approved' else 'Standard'} BOQ", boq_number=f"BOQ-{2026}-{101 + n_:03d}" + (f"-R{v - 1}" if v > 1 else ""),
                             source_template_id=U("boqtpl:" + tier), boq_version_id=None, status=st, locked=int(st in ("approved", "archived")), total_value=total,
                             version=v, client_name=CNAME[p[2]], location=p[4], prepared_by=UNAME[PM[pk][0]], date=cdate.date(),
                             terms_html=None, terms_template_id=U("terms:boq"), terms_template_version=2, misc_pct=misc_pct, design_amount=design,
                             execution_amount=execution, supervisor_amount=sup, additional_total=addl,
                             approved_at=cdate + timedelta(days=10) if st == "approved" else None, approved_by=ADMIN if st == "approved" else None,
                             created_by=UID[PM[pk][0]], updated_by=UID[PM[pk][0]], created_at=cdate, updated_at=cdate + timedelta(days=10), deleted_at=None))
            vid = U(f"boqver:{pk}:{v}")
            vers.append(dict(id=vid, boq_id=root, version=v, version_name="Initial BOQ" if v == 1 else "Revised after value engineering",
                             created_at=cdate, updated_at=cdate, deleted_at=None))
            links.append((bid, vid))
            acts.append(dict(id=U(f"boqact:{pk}:{v}:c"), boq_id=bid, user_id=UID[PM[pk][0]], action="created", target=f"BOQ v{v}", details=None, created_at=cdate))
            acts.append(dict(id=U(f"boqact:{pk}:{v}:r"), boq_id=bid, user_id=UID[PM[pk][0]], action="rate_changed", target="Italian marble - supply & lay",
                             details="Rate revised after Chhabra Marble quote", created_at=cdate + timedelta(days=3)))
            if st in ("awaiting_approval", "approved", "archived", "returned"):
                acts.append(dict(id=U(f"boqact:{pk}:{v}:s"), boq_id=bid, user_id=UID[PM[pk][0]], action="submitted", target=f"BOQ v{v}", details="Sent for approval", created_at=cdate + timedelta(days=6)))
            if st in ("approved", "returned"):
                acts.append(dict(id=U(f"boqact:{pk}:{v}:a"), boq_id=bid, user_id=ADMIN, action="approved" if st == "approved" else "rejected", target=f"BOQ v{v}",
                                 details="Approved by client" if st == "approved" else "Client paused project; revise after NOC", created_at=cdate + timedelta(days=10)))
    o.ins("boqs", boqs)
    o.ins("boq_versions", vers)
    for bid, vid in links:
        o.sql(f"UPDATE boqs SET boq_version_id={lit(vid)} WHERE id={lit(bid)} AND boq_version_id IS NULL")
    o.ins("boq_categories", cats)
    o.ins("boq_items", items)
    o.ins("boq_miscellaneous", misc)
    o.ins("boq_activities", acts)

    build_estimates(o, uid)
    build_payments(o)
    build_milestones(o)


def build_estimates(o, uid):
    est, cats, items, misc, vers = [], [], [], [], []
    n = 0
    for pk in ["kapoor", "malhotra", "sagar", "cmstore", "aurum", "bhatia", "oberoi", "courtyard", "rocklime", "gupta", "singhania", "tandon", "brew"]:
        p = PBYKEY[pk]
        ph = pidx(pk)
        eid = U("est:" + pk)
        n += 1
        st = "approved" if ph >= 5 else ("submitted" if ph >= 4 else ("in_progress" if ph >= 3 else "draft"))
        if pk == "brew":
            st = "revised"
        scale = p[13] / 1000
        sub = 0
        created = dt(start_of(pk) + 30)
        for i, (cat, litems) in enumerate(LIB.items()):
            cid = U(f"estcat:{pk}:{cat}")
            cats.append(dict(id=cid, estimate_id=eid, library_category_id=U("lcat:" + cat), name=cat, sort_order=i, created_at=created, updated_at=created))
            for j, (nm, un, rate, qty, calc) in enumerate(litems):
                qv = round(qty * scale, 2)
                amt = round(qv * rate, 2)
                sub += amt
                items.append(dict(id=U(f"estitem:{pk}:{cat}:{nm}"), estimate_id=eid, estimate_category_id=cid, library_item_id=U(f"litem:{cat}:{nm}"), boq_item_id=None,
                                  name=nm, unit_id=uid[un], unit=un.lower(), quantity=qv, rate=rate, amount=amt, calc_type=calc, location=None, detail=None,
                                  notes=None, hidden=0, sort_order=j, created_at=created, updated_at=created))
        misc_amt = round(sub * 0.1, 2)
        design, execution, sup = round(sub * 0.08, 2), round(sub * 0.04, 2), round(sub * 0.02, 2)
        addl = 25000
        taxable = sub + misc_amt + design + execution + sup + addl
        tax = round(taxable * 0.18, 2)
        disc = round(taxable * 0.02, 2) if ph >= 5 else 0
        total = round(taxable + tax - disc, 2)
        misc.append(dict(id=U(f"estmisc:{pk}"), estimate_id=eid, name="Statutory approvals & liaison", value=addl, notes=None, sort_order=0, created_at=created, updated_at=created))
        est.append(dict(id=eid, project_id=PID[pk], boq_id=U(f"boq:{pk}:1") if pk in BOQ_PROJECTS else None, source_template_id=None,
                        estimate_number=f"EST-2026-{200 + n:03d}", title=f"Budget Estimate - {PNAME[pk]}", status=st, subtotal=sub, misc_percentage=10,
                        misc_amount=misc_amt, design_amount=design, execution_amount=execution, supervisor_amount=sup, additional_amount=addl,
                        tax_percentage=18, tax_amount=tax, discount_amount=disc, total_amount=total, client_name=CNAME[p[2]], location=p[4],
                        prepared_by=UNAME[PM[pk][0]], estimate_date=created.date(), terms_html=None, terms_template_id=U("terms:estimate"),
                        terms_template_version=1, version=2 if ph >= 5 else 1, locked=int(st == "approved"),
                        approved_at=created + timedelta(days=12) if st == "approved" else None, approved_by=ADMIN if st == "approved" else None,
                        created_by=UID[PM[pk][0]], updated_by=UID["sunita"], created_at=created, updated_at=created + timedelta(days=12)))
        for v in range(1, (2 if ph >= 5 else 1) + 1):
            vers.append(dict(id=U(f"estver:{pk}:{v}"), estimate_id=eid, version=v, version_name="Concept estimate" if v == 1 else "Post-design revision",
                             total_amount=round(total * (0.93 if v == 1 and ph >= 5 else 1), 2), snapshot={"subtotal": sub, "total": total, "categories": list(LIB.keys())},
                             created_by=UID[PM[pk][0]], created_at=created + timedelta(days=7 * (v - 1))))
    o.ins("budget_estimates", est)
    o.ins("budget_estimate_categories", cats)
    o.ins("budget_estimate_items", items)
    o.ins("budget_estimate_miscellaneous", misc)
    o.ins("budget_estimate_versions", vers)


def build_payments(o):
    ps, ms = [], []
    plan = [("TOKEN", "Token / booking amount", "On signing of agreement", 10, 3),
            ("PHASE_01", "Design stage payment", "On approval of concept design", 20, 5),
            ("PHASE_02", "Civil & MEP mobilisation", "On start of site work", 25, 7),
            ("PHASE_03", "Finishing stage", "On completion of 70% site work", 25, 7.6),
            ("PHASE_04", "Pre-handover", "On completion of snag list", 15, 8.4),
            ("RETENTION", "Retention release", "30 days after handover", 5, 9.2)]
    for pk in [p[0] for p in PROJECTS]:
        ph = pidx(pk)
        if ph < 3:
            continue
        p = PBYKEY[pk]
        sid = U("pay:" + pk)
        value = p[5]
        gst = round(value * 0.18, 2)
        st = "COMPLETED" if p[6] == "completed" else ("ACTIVE" if ph >= 4 else "DRAFT")
        ps.append(dict(id=sid, project_id=PID[pk], title=f"Payment Schedule - {PNAME[pk]}", terms_template_id=U("terms:project"), terms_version=1,
                       total_contract_value=value, gst_rate=18, gst_amount=gst, total_payable=round(value + gst, 2), status=st,
                       accepted_by_client=int(st != "DRAFT"), accepted_at=dt(start_of(pk) + 40) if st != "DRAFT" else None,
                       created_at=dt(start_of(pk) + 35), updated_at=dt(-3), deleted_at=None))
        span = max(p[11], 60)
        for j, (code, title, trig, pct, at) in enumerate(plan):
            amt = round((value + gst) * pct / 100, 2)
            due = start_of(pk) + int(span * at / 9.5)
            if p[6] == "completed":
                mst, paid = "PAID", amt
            elif at <= ph:
                mst, paid = "PAID", amt
            elif at <= ph + 1:
                mst, paid = ("OVERDUE", 0) if due < -7 else (("PARTIALLY_PAID", round(amt * 0.4, 2)) if pk in ("bhatia", "kapoor") else ("INVOICED", 0) if due < 3 else ("DUE", 0))
            else:
                mst, paid = "PENDING", 0
            if pk == "brew" and mst != "PAID":
                mst = "PENDING"
            ms.append(dict(id=U(f"paym:{pk}:{code}"), payment_schedule_id=sid, milestone_number=j + 1, milestone_code=code, title=title,
                           description=f"{pct}% of contract value", release_trigger=trig, percentage=pct, amount=amt, status=mst, due_date=d(due),
                           invoice_date=d(due - 5) if mst in ("PAID", "INVOICED", "PARTIALLY_PAID", "OVERDUE") else None, paid_amount=paid,
                           paid_at=dt(due + 3, 14) if mst == "PAID" else (dt(-4, 14) if mst == "PARTIALLY_PAID" else None), sort_order=j,
                           created_at=dt(start_of(pk) + 35), updated_at=dt(min(due + 3, 0))))
    o.ins("payment_schedules", ps)
    o.ins("payment_schedule_milestones", ms)


def build_milestones(o):
    ms = []
    names = [("Design brief sign-off", 1), ("Concept design approval", 3), ("GFC drawings issued", 6.5), ("Civil & MEP complete", 7.5),
             ("Finishes complete", 8.2), ("Handover & snag closure", 9)]
    for p in PROJECTS:
        pk = p[0]
        ph = pidx(pk)
        for j, (n, at) in enumerate(names):
            due = start_of(pk) + int(p[11] * at / 9)
            st = "COMPLETED" if at <= ph else ("IN_PROGRESS" if at <= ph + 1 else "PENDING")
            if p[6] == "on_hold" and st == "IN_PROGRESS":
                st = "PENDING"
            ms.append(dict(id=U(f"ms:{pk}:{j}"), project_id=PID[pk], title=n, description=f"{n} for {p[1]}", due_date=d(due),
                           planned_start=d(due - 20), completed_at=dt(due + (3 if j % 2 else -2), 16) if st == "COMPLETED" else None, status=st,
                           order=j + 1, weight=round(100 / len(names), 2), assignee_id=UID[PM[pk][1] or PM[pk][0]] if j >= 3 else UID[PM[pk][0]],
                           created_by=UID["anjali"], updated_by=UID["anjali"], created_at=dt(start_of(pk) + 5), updated_at=dt(-2), deleted_at=None))
    o.ins("milestones", ms)
