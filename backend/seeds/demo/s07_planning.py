"""07 Planning: unified project planners (+locations, items, item-locations, procurement items), tasks, calendar events, signatures."""
from lib import *

PROC_CATS = [("MATERIAL", "TILES"), ("MATERIAL", "FURNITURE"), ("MATERIAL", "MILL WORK-MATERIAL"), ("MATERIAL", "STONE JAMBS"), ("MATERIAL", "WALL PAINTS"),
             ("MATERIAL", "LOOSE FURNITURE"), ("MATERIAL", "ARCHITECTURAL LIGHTING(INCLUDING FANS)"), ("MATERIAL", "APPLIANCES"), ("MATERIAL", "SOFT FURNISHING"),
             ("LABOUR", "CIVIL"), ("LABOUR", "ELECTRICAL"), ("LABOUR", "PLUMBING"), ("LABOUR", "MECHANICAL/HVAC/AC"), ("LABOUR", "TILING"),
             ("LABOUR", "FALSE CEILING"), ("LABOUR", "MILL WORK"), ("LABOUR", "PAINTING"), ("LABOUR", "GLASS& WINDOW")]
PROC_VENDOR = {"TILES": "tile_mart", "STONE JAMBS": "chhabra_marble", "MILL WORK-MATERIAL": "century_ply", "CIVIL": "bharat_civil", "ELECTRICAL": "sharma_elec",
               "PLUMBING": "aqua_plumb", "MECHANICAL/HVAC/AC": "cool_air", "FALSE CEILING": "gyproc_fc", "MILL WORK": "kalpana", "PAINTING": "asian_paints",
               "GLASS& WINDOW": "glass_tech", "TILING": "deepak_stone"}
EXISTING_VENDORS = {"sharma_elec": "099aa424-8dae-4611-90f8-87b3e776bdf4", "deepak_stone": "0d764704-6ead-4e43-bc16-593677a0fea4", "kalpana": "1a21efe3-e0af-44ca-b9ac-e0cf3e9633ee"}


def vid(k):
    return EXISTING_VENDORS.get(k, U("vendor:" + k))


def build(o: Out):
    tpls = q("SELECT t.id, t.phase_id, t.work_name, t.details, t.applies_to_locations, t.sort_order, p.module, p.phase_number "
             "FROM planner_task_templates t JOIN project_phases p ON p.id=t.phase_id WHERE t.deleted_at IS NULL ORDER BY p.module, p.phase_number, t.sort_order")
    existing = {r[0]: r[1] for r in q("SELECT project_id, id FROM project_planners WHERE deleted_at IS NULL")}
    planners, locs, items, ilocs, proc = [], [], [], [], []
    for p in PROJECTS:
        pk = p[0]
        ph = pidx(pk)
        start = start_of(pk)
        if PID[pk] in existing:
            continue  # keep the existing (Malhotra) planner untouched
        plid = U("planner:" + pk)
        planners.append(dict(id=plid, project_id=PID[pk], type="PROJECT", name="Project Planner", description=f"Design + PMC schedule for {p[1]}",
                             planned_start_date=d(start), planned_end_date=d(start + p[11]), is_active=1, created_by=UID["anjali"], updated_by=UID["anjali"],
                             created_at=dt(start + 30), updated_at=dt(-2), deleted_at=None))
        floors = ["Ground floor", "First floor", "Second floor", "Third floor"][: max(1, min(p[14], 4))]
        if p[3] == "office" or p[3] == "retail":
            floors = ["Front zone", "Back zone"]
        lids = []
        for j, f in enumerate(floors):
            lid = U(f"loc:{pk}:{j}")
            lids.append(lid)
            locs.append(dict(id=lid, project_id=PID[pk], parent_id=None, type="FLOOR" if "floor" in f else "ZONE", name=f, code=f"L{j}", sort_order=j,
                             created_at=dt(start + 30), updated_at=dt(start + 30), deleted_at=None))
        # phase position of templates: CONSULTANCY P1..P5 ~ project idx 2..6, PMC P1..P5 ~ idx 7..8
        for n, (tid, phid, wn, det, appl, so, mod, pnum) in enumerate(tpls):
            pnum = int(pnum)
            if mod == "CONSULTANCY":
                pos = 2 + (pnum - 1) * 1.1
            else:
                pos = 7 + (pnum - 1) * 0.35
            if pk in ("aurum", "sagar") and mod == "PMC":
                continue
            if pos + 0.9 < ph or p[6] == "completed":
                st, pct = "COMPLETED", 100
            elif pos <= ph + 0.3:
                st, pct = ("IN_PROGRESS", [25, 40, 60, 75][n % 4])
            else:
                st, pct = "NOT_STARTED", 0
            if p[6] == "on_hold" and st == "IN_PROGRESS":
                st = "ON_HOLD"
            ps = start + int(p[11] * (pos / 9.5))
            pe = ps + 12 + n % 10
            iid = U(f"pitem:{pk}:{tid}")
            who = PM[pk][0] if mod == "CONSULTANCY" else (PM[pk][1] or "anjali")
            items.append(dict(id=iid, planner_id=plid, task_template_id=tid, phase_id=phid, work_name=wn or None, details=det or None, document_type_id=None,
                              status=st, planned_start_date=d(ps), planned_end_date=d(pe), actual_start_date=d(ps + 1) if st != "NOT_STARTED" else None,
                              actual_end_date=d(pe + (2 if n % 3 == 0 else -1)) if st == "COMPLETED" else None, progress_pct=pct, assigned_to=UID[who],
                              remarks="Delayed - awaiting client approval" if st == "IN_PROGRESS" and n % 7 == 0 else None, sort_order=n,
                              created_by=UID["anjali"], created_at=dt(start + 30), updated_at=dt(-1), deleted_at=None))
            if appl == "1":
                for j, lid in enumerate(lids):
                    lst = st if st != "IN_PROGRESS" else ("COMPLETED" if j == 0 else "IN_PROGRESS" if j == 1 else "NOT_STARTED")
                    ilocs.append(dict(id=U(f"piloc:{pk}:{tid}:{j}"), planner_item_id=iid, location_id=lid, status=lst,
                                      progress_pct=100 if lst == "COMPLETED" else (50 if lst == "IN_PROGRESS" else 0), planned_start_date=d(ps + j * 3),
                                      planned_end_date=d(pe + j * 3), actual_start_date=d(ps + j * 3) if lst != "NOT_STARTED" else None,
                                      actual_end_date=d(pe + j * 3) if lst == "COMPLETED" else None, assigned_to=UID[who], remarks=None,
                                      created_at=dt(start + 30), updated_at=dt(-1)))
        for n, (typ, cat) in enumerate(PROC_CATS):
            vk = PROC_VENDOR.get(cat)
            pos = 5.5 + n * 0.15
            st = "COMPLETED" if pos + 1 < ph or p[6] == "completed" else ("IN_PROGRESS" if pos <= ph + 0.5 else "NOT_STARTED")
            base = start + int(p[11] * pos / 9.5)
            proc.append(dict(id=U(f"proc:{pk}:{n}"), planner_id=plid, template_key=f"{typ}-{n}", item_type=typ, category_name=cat,
                             vendor_id=vid(vk) if vk and st != "NOT_STARTED" else None, vendor_name=None,
                             estimate_finalised_at=d(base) if st != "NOT_STARTED" else None, quotation_finalised_at=d(base + 7) if st != "NOT_STARTED" else None,
                             planned_start_date=d(base + 10), planned_end_date=d(base + 40), purchase_date=d(base + 12) if st == "COMPLETED" and typ == "MATERIAL" else None,
                             received_at_site_date=d(base + 22) if st == "COMPLETED" and typ == "MATERIAL" else None, status=st, remarks=None, sort_order=n,
                             created_by=UID["pooja"], created_at=dt(start + 30), updated_at=dt(-1), deleted_at=None))
    # Design (CONSULTANCY) planners: evidence for PLAN_DRAWINGS_PLAN in the gate engine / command center
    for p in PROJECTS:
        pk = p[0]
        if pidx(pk) < 3:
            continue
        cid = U("cplanner:" + pk)
        start = start_of(pk)
        planners.append(dict(id=cid, project_id=PID[pk], type="CONSULTANCY", name="Drawings Plan", description=f"Design deliverables schedule for {p[1]}",
                             planned_start_date=d(start + 10), planned_end_date=d(start + int(p[11] * 0.6)), is_active=1, created_by=UID[PM[pk][0]],
                             updated_by=UID[PM[pk][0]], created_at=dt(start + 32), updated_at=dt(-3), deleted_at=None))
        for n, (tid, phid, wn, det, appl, so, mod, pnum) in enumerate([t for t in tpls if t[6] == "CONSULTANCY"]):
            pos = 2 + (int(pnum) - 1) * 1.1
            st = "COMPLETED" if pos + 0.9 < pidx(pk) or p[6] == "completed" else ("IN_PROGRESS" if pos <= pidx(pk) + 0.3 else "NOT_STARTED")
            ps = start + int(p[11] * (pos / 9.5))
            items.append(dict(id=U(f"citem:{pk}:{tid}"), planner_id=cid, task_template_id=tid, phase_id=phid, work_name=wn or None, details=det or None,
                              document_type_id=None, status=st, planned_start_date=d(ps), planned_end_date=d(ps + 14),
                              actual_start_date=d(ps) if st != "NOT_STARTED" else None, actual_end_date=d(ps + 15) if st == "COMPLETED" else None,
                              progress_pct=100 if st == "COMPLETED" else (50 if st == "IN_PROGRESS" else 0), assigned_to=UID[PM[pk][0]], remarks=None,
                              sort_order=n, created_by=UID[PM[pk][0]], created_at=dt(start + 32), updated_at=dt(-1), deleted_at=None))
    o.ins("project_planners", planners)
    o.ins("project_locations", locs)
    o.ins("project_planner_items", items)
    o.ins("project_planner_item_locations", ilocs)
    o.ins("project_procurement_items", proc)
    # enrich the pre-existing Malhotra planner: give its items dates/status
    mal = existing.get(PID["malhotra"])
    if mal:
        o.sql(f"UPDATE project_planner_items SET planned_start_date=COALESCE(planned_start_date, DATE_SUB('{TODAY}', INTERVAL (200 - sort_order*4) DAY)), "
              f"planned_end_date=COALESCE(planned_end_date, DATE_SUB('{TODAY}', INTERVAL (185 - sort_order*4) DAY)), "
              f"assigned_to=COALESCE(assigned_to, '{UID['arjun']}'), "
              f"status=IF(status='NOT_STARTED' AND sort_order<40,'COMPLETED',status), progress_pct=IF(status='COMPLETED',100,progress_pct) WHERE planner_id='{mal}'")

    # ---------- tasks ----------
    tasks = []
    tdefs = [("Share revised living room layout with client", "sagar", "neha", "high", 1, 4), ("Finalise Statuario slab selection at Chhabra Marble", "singhania", "neha", "high", 2, 3),
             ("Review VRV quotation from CoolAir", "bhatia", "pooja", "critical", 0, 2), ("Issue GFC set - ground floor", "malhotra", "arjun", "high", 5, 16),
             ("Collect PHASE_03 payment from Mr. Kapoor", "kapoor", "sunita", "critical", -3, 1), ("Prepare snag list for Rocklime EC", "rocklime", "sandeep", "medium", 1, 5),
             ("Client walkthrough - Oberoi apartment", "oberoi", "imran", "medium", 3, 2), ("Site recce measurement - Arora Foods", "arora", "kabir", "high", 2, 6),
             ("Concept presentation - Gupta Villa", "gupta", "arjun", "high", 6, 12), ("Hotel key plan options (22 keys)", "courtyard", "ritika", "critical", 9, 20),
             ("Tender drawings - electrical layout", "aurum", "kabir", "medium", 12, 10), ("Follow up landlord NOC", "brew", "vivek", "low", 20, 1),
             ("Raise PO for BWP ply - Kapoor wardrobes", "kapoor", "rohit", "medium", 1, 1), ("Weekly MIS to Ajay", None, "anjali", "medium", 4, 3),
             ("Update rate library with Q3 marble prices", None, "pooja", "low", 25, 4), ("Reconcile vendor ledger - Bharat Builders", None, "sunita", "medium", 8, 6),
             ("Waterproofing warranty from contractor", "tandon", "manoj", "low", 45, 1), ("Home automation vendor shortlist", "singhania", "neha", "medium", 14, 5),
             ("Mock-up review: fluted veneer panel", "bhatia", "ritika", "high", 0, 2), ("Close RFI - column clash bedroom 2", "malhotra", "arjun", "critical", -1, 2),
             ("Plan of action - Courtyard hotel", "courtyard", "anjali", "high", 7, 8), ("Prepare Q2 portfolio shoot list", None, "kabir", "low", 60, 6)]
    for i, (t, pk, who, pr, due, hrs) in enumerate(tdefs):
        bucket = "today" if due <= 0 else ("this_week" if due <= 7 else ("month" if due <= 30 else "year"))
        tasks.append(dict(id=U(f"task:{i}"), title=t, project_id=PID[pk] if pk else None, created_by=UID[who], priority=pr, status="todo",
                          due_date=dt(due, 18), due_bucket=bucket, order_index=i, workload_estimate_hours=hrs, created_at=dt(-10 + i % 7), updated_at=dt(-1)))
    done = ["Send brief questionnaire to Arora Foods", "Upload recce photos - Gupta Villa", "Approve BOQ v2 - Oberoi", "Issue WO to Skyline Ceilings",
            "Client sign-off on Concept 01 - Sagar", "Quarterly vendor review", "Book Statuario lot for Kapoor", "Handover docs - Tandon Residence",
            "Update payment tracker", "Share DPR format with site team"]
    for i, t in enumerate(done):
        tasks.append(dict(id=U(f"taskdone:{i}"), title=t, project_id=PID[["arora", "gupta", "oberoi", "cmstore", "sagar", None, "kapoor", "tandon", None, None][i]] if ["arora", "gupta", "oberoi", "cmstore", "sagar", None, "kapoor", "tandon", None, None][i] else None,
                          created_by=UID[["vivek", "arjun", "neha", "pooja", "neha", "pooja", "rohit", "manoj", "sunita", "anjali"][i]], priority=["medium", "high"][i % 2],
                          status="completed", due_date=dt(-i * 3 - 1, 18), due_bucket="today", order_index=100 + i, workload_estimate_hours=2 + i % 4,
                          created_at=dt(-i * 3 - 6), updated_at=dt(-i * 3 - 1, 17)))
    # a few tasks for the admin's own list
    for i, (t, due, pr) in enumerate([("Approve Bhatia VRV PO", 0, "critical"), ("Review Courtyard concept deck", 2, "high"), ("Sign WO - Singhania ceiling", 1, "high"),
                                      ("Call Harpreet Sethi re: token", 3, "medium"), ("Rocklime EC handover walkthrough", 6, "high")]):
        tasks.append(dict(id=U(f"taskajay:{i}"), title=t, project_id=None, created_by=ADMIN, priority=pr, status="todo", due_date=dt(due, 17),
                          due_bucket="today" if due <= 0 else "this_week", order_index=200 + i, workload_estimate_hours=1, created_at=dt(-3), updated_at=dt(-1)))
    o.ins("tasks", tasks)

    # ---------- calendar ----------
    ev = []
    em = {k: e for k, n, e, *_ in USERS}
    em["ajay"] = "ajay@rocklime.com"
    spec = [("client_meeting", "Design review - {p}", ["ritika", "neha"], 11, 90), ("site_visit", "Site visit - {p}", ["sandeep", "arjun"], 10, 120),
            ("internal_meeting", "Weekly project review", ["ajay", "ritika", "anjali", "pooja"], 16, 60), ("vendor_call", "Vendor call - marble lot confirmation ({p})", ["pooja", "rohit"], 15, 30),
            ("presentation", "Concept presentation - {p}", ["ritika", "arjun", "vivek"], 12, 90), ("milestone_due", "Milestone due - {p}", ["anjali"], 9, 0),
            ("quotation_deadline", "Quotation deadline - {p}", ["pooja"], 18, 0), ("handover", "Handover walkthrough - {p}", ["ajay", "sandeep"], 11, 120)]
    projs = [p[0] for p in PROJECTS if p[6] != "completed"]
    for i in range(70):
        day = -40 + i * 2 - (i % 3)
        if day > 90:
            break
        kind, title, att, hr, mins = spec[i % len(spec)]
        pk = projs[(i * 5) % len(projs)]
        if kind == "internal_meeting":
            pk = None
        if kind == "handover":
            pk = "rocklime" if day < 30 else "oberoi"
        allday = mins == 0
        start = dt(day, hr)
        ev.append(dict(id=U(f"cal:{i}"), title=title.format(p=PNAME[pk] if pk else ""), type=kind, starts_at=start,
                       ends_at=None if allday else start + timedelta(minutes=mins), all_day=int(allday), project_id=PID[pk] if pk else None,
                       location=(PBYKEY[pk][4] if pk and kind in ("site_visit", "handover") else ("Rippotai Studio, Mathura Road" if kind != "vendor_call" else "Google Meet")),
                       description=None, attendees=[em[a] for a in att], created_by=UID[att[0]] if att[0] != "ajay" else ADMIN, created_at=dt(min(day, 0) - 5), updated_at=dt(min(day, 0) - 5)))
    for i, (t, day) in enumerate([("Diwali - studio closed", 21), ("Q3 close - accounts", 1), ("Team offsite", 45)]):
        ev.append(dict(id=U(f"calx:{i}"), title=t, type="note", starts_at=dt(day, 0), ends_at=None, all_day=1, project_id=None, location=None, description=None,
                       attendees=[], created_by=ADMIN, created_at=dt(-20), updated_at=dt(-20)))
    o.ins("calendar_events", ev)

    o.ins("user_signatures", [dict(id=U("sig:" + k), user_id=UID[k], signature_url=f"/uploads/demo/signatures/{k}.png", signature_file_name=f"{k}-signature.png",
                                   signature_file_type="image/png", signature_file_size=18400, is_active=1, created_by=UID[k], created_at=dt(-100), updated_at=dt(-100))
                              for k in ("ajay", "ritika", "pooja", "sunita")])
