"""06 Site operations. Site-ops tables (daily reports, visits, QC, RFIs, mock-ups) key projects by UUID (projects.id,
see migrations/20260930_site_ops_project_uuid.sql). Only the legacy process-workflow tables (project_step_progress,
gate_logs) still use the INTEGER ids of lib.SITE_INT, which also drive the deterministic variation below: 1 Kapoor Farmhouse, 2 Malhotra Residence, 3 Chhabra Marble Flagship Store, 4 Bhatia Kothi,
5 Oberoi Apartment, 6 Rocklime Experience Centre, 7 Singhania Penthouse. Teams are the numeric-id rows seeded in s01
(1 Civil ... 8 HVAC, 9 Design Coordination, 10 Site Supervision)."""
from lib import *

TRADES = {1: "Civil Works", 2: "Electrical", 3: "Plumbing & Sanitary", 4: "Carpentry & Joinery", 5: "False Ceiling", 6: "Painting & Polish", 7: "Flooring & Stone", 8: "HVAC"}
# process-workflow phases/steps (MAIN track) used by QC sign-offs and handoff status
PW_PHASES = [(1, "Site Preparation", "SITE_PREP"), (2, "Civil & Structure", "CIVIL"), (3, "MEP Rough-in", "MEP"), (4, "Fit-outs", "FITOUT"), (5, "Finishing & Handover", "FINISH")]
PW_STEPS = [(1, 1, "Demolition & site clearing", "DEMOLITION", 1), (2, 1, "Excavation & soil test", "EXCAVATION", 1),
            (3, 2, "RCC frame & slabs", "RCC", 1), (4, 2, "Masonry & plaster", "MASONRY", 1), (5, 2, "Waterproofing", "WATERPROOFING", 1),
            (6, 3, "Electrical conduiting & wiring", "ELEC_ROUGH", 2), (7, 3, "Plumbing & drainage rough-in", "PLUMB_ROUGH", 3), (8, 3, "HVAC piping & ducting", "HVAC_ROUGH", 8),
            (9, 4, "False ceiling", "CEILING", 5), (10, 4, "Flooring & stone", "FLOORING", 7), (11, 4, "Carpentry & wardrobes", "CARPENTRY", 4),
            (12, 5, "Painting & polish", "PAINT", 6), (13, 5, "CP & sanitary fixing", "CP_FIX", 3), (14, 5, "Electrical fixtures & testing", "ELEC_FIX", 2),
            (15, 5, "Snag list & deep cleaning", "SNAG", 1)]
CHECKLISTS = {
    1: ("Masonry & Plaster QC", [("Line, level and plumb within 3 mm/m", True), ("Mortar mix 1:6 as per spec", True), ("Curing done for 7 days", True), ("Openings as per drawing", True), ("Chasing only after approval", False)]),
    2: ("Electrical Rough-in QC", [("Conduit sizes as per load schedule", True), ("Separate conduits for power & data", True), ("Box heights as per electrical layout", True), ("Earthing continuity tested", True), ("Wire colour coding followed", True)]),
    3: ("Plumbing Pressure Test", [("Pressure test at 10 kg/cm2 for 24 h", True), ("No leakage at joints", True), ("Slopes in drainage lines 1:40", True), ("Floor trap levels verified", True), ("Concealed valve positions marked", False)]),
    4: ("Carpentry & Shutters QC", [("Carcass in BWP ply as specified", True), ("Edge banding uniform, no gaps", True), ("Hardware as per approved brand", True), ("Shutter alignment and gaps < 2 mm", True), ("Laminate grain direction consistent", False)]),
    5: ("False Ceiling QC", [("Framing grid at 600 mm c/c", True), ("Levels checked with laser", True), ("Cutouts coordinated with lighting layout", True), ("Joint taping & finishing smooth", True)]),
    6: ("Paint Finish QC", [("Putty 2 coats, sanded smooth", True), ("Primer applied before emulsion", True), ("No patches/brush marks under raking light", True), ("Shade matches approved sample", True)]),
    7: ("Stone & Tile Laying QC", [("Hollowness check - tap test", True), ("Joint width uniform", True), ("Slope towards drains in wet areas", True), ("Book-matching as per layout", True), ("Lippage < 1 mm", True)]),
    8: ("HVAC Installation QC", [("Copper piping nitrogen pressure test", True), ("Insulation continuity", True), ("Drain slope for condensate", True), ("Indoor unit levels and access panels", False)]),
}
WORK = {
    "civil": ["Brickwork on {f} partition walls completed", "Plaster on {f} external walls in progress", "Shuttering for {f} slab", "Terrace waterproofing - first coat"],
    "mep": ["Electrical conduiting on {f} done", "Plumbing lines laid in {f} toilets", "HVAC copper piping on {f}", "DB installation and dressing on {f}"],
    "finish": ["Marble laying in {f} living area", "False ceiling framing on {f}", "Wardrobe carcass installation on {f}", "Putty second coat on {f}", "Kitchen counter fixing", "Wall panelling in {f} lounge"],
    "handover": ["Snag rectification on {f}", "Deep cleaning of {f}", "CP fittings fixing on {f}", "Final paint coat and touch-ups on {f}"],
}
ISSUES = [None, None, None, "Marble consignment delayed by 2 days", "Water supply disrupted till noon", "Client requested change in kitchen layout - on hold",
          "Shortage of skilled masons", "Power cut 2-4 pm; DG used", None, "Tile adhesive stock low - PO raised", "Rain stopped external plaster", None]
STAGE = {"kapoor": "finish", "malhotra": "civil", "cmstore": "finish", "bhatia": "mep", "oberoi": "handover", "rocklime": "handover", "singhania": "mep"}
CREW = {"civil": {1: (14, 22), 2: (2, 4), 3: (2, 3)}, "mep": {1: (4, 8), 2: (5, 8), 3: (4, 6), 8: (3, 5)},
        "finish": {4: (5, 9), 5: (3, 6), 7: (4, 7), 6: (3, 6), 2: (1, 3)}, "handover": {6: (3, 5), 3: (1, 3), 2: (1, 2), 1: (2, 4)}}


def build(o: Out):
    now = dt(0, 9)
    o.ins("phases", [dict(id=i, name=n, code=c, track_type="MAIN", order=i, description=None, is_active=1, created_at=dt(-200), updated_at=dt(-200), deleted_at=None)
                     for i, n, c in PW_PHASES])
    o.ins("steps", [dict(id=i, phase_id=ph, name=n, code=c, order=i, description=None, is_gate=int(c in ("RCC", "SNAG")),
                         gate_name={"RCC": "Structure complete", "SNAG": "Ready for handover"}.get(c), default_duration_days=[7, 10, 30, 21, 5, 14, 14, 10, 12, 20, 25, 15, 5, 5, 7][i - 1],
                         depends_on_step_codes=[PW_STEPS[i - 2][3]] if i > 1 else [], is_active=1, created_at=dt(-200), updated_at=dt(-200), deleted_at=None)
                    for i, ph, n, c, t in PW_STEPS])
    o.ins("step_teams", [dict(id=i, step_id=i, team_id=t, responsibility_type="OWNER", created_at=dt(-200), updated_at=dt(-200)) for i, ph, n, c, t in PW_STEPS] +
          [dict(id=100 + i, step_id=i, team_id=10, responsibility_type="APPROVER", created_at=dt(-200), updated_at=dt(-200)) for i, ph, n, c, t in PW_STEPS])

    # ---------- QC checklist templates ----------
    tpl, tpi, item_ids = [], [], {}
    for t, (name, items) in CHECKLISTS.items():
        step = next(s[0] for s in PW_STEPS if s[4] == t)
        tpl.append(dict(id=t, name=name, trade_team_id=t, step_id=step, description=f"Standard {TRADES[t].lower()} inspection checklist", is_active=1,
                        created_at=dt(-180), updated_at=dt(-60), deleted_at=None))
        item_ids[t] = []
        for j, (txt, req) in enumerate(items):
            iid = t * 100 + j + 1
            item_ids[t].append(iid)
            tpi.append(dict(id=iid, template_id=t, text=txt, order=j + 1, is_required=int(req), created_at=dt(-180), updated_at=dt(-180)))
    tpl.append(dict(id=9, name="Pre-handover Snag Audit", trade_team_id=1, step_id=15, description="Room-by-room snag audit before client walkthrough", is_active=1,
                    created_at=dt(-120), updated_at=dt(-120), deleted_at=None))
    item_ids[9] = []
    for j, txt in enumerate(["All switches and sockets working", "No paint touch-ups pending", "Doors and shutters aligned", "All CP fittings leak-free", "Site deep cleaned"]):
        tpi.append(dict(id=900 + j + 1, template_id=9, text=txt, order=j + 1, is_required=1, created_at=dt(-120), updated_at=dt(-120)))
        item_ids[9].append(900 + j + 1)
    o.ins("checklist_templates", tpl)
    o.ins("checklist_template_items", tpi)

    # ---------- daily site reports + manpower ----------
    # daily_site_reports keys projects by UUID (projects.id) since the v2 migration
    # (migrations/20260929_daily_site_reports_v2.sql); manpower is by trade code, not team id.
    TRADE_CODE = {1: "CIVIL", 2: "ELECTRICAL", 3: "PLUMBING", 4: "CARPENTRY", 5: "FALSE_CEILING", 6: "PAINTING", 7: "FLOORING", 8: "HVAC"}
    CONTRACTOR = {1: "Rana Constructions", 2: "Sharma Electricals", 3: "Aqua Plumbing Co.", 4: "Kalpana Joinery", 5: "Skyline Ceilings",
                  6: "Colour Craft Painters", 7: "Deepak Stone Works", 8: "CoolAir HVAC"}
    ISSUE_META = {"Marble consignment delayed by 2 days": ("MATERIAL", "MEDIUM", True), "Water supply disrupted till noon": ("DELAY", "LOW", False),
                  "Client requested change in kitchen layout - on hold": ("CLIENT", "HIGH", True), "Shortage of skilled masons": ("MANPOWER", "MEDIUM", False),
                  "Power cut 2-4 pm; DG used": ("DELAY", "LOW", False), "Tile adhesive stock low - PO raised": ("MATERIAL", "LOW", False),
                  "Rain stopped external plaster": ("WEATHER", "MEDIUM", False)}
    MATS = {"civil": [("Cement OPC 53", "BAG", 40, 25), ("River sand", "CFT", 150, 90), ("Red bricks", "NOS", 3000, 1800)],
            "mep": [("PVC conduit 25 mm", "RMT", 300, 180), ("CPVC pipe 1 inch", "RMT", 120, 60), ("FR copper wire 2.5 sq mm", "NOS", 20, 12)],
            "finish": [("Italian marble - Statuario", "SQFT", 450, 220), ("BWP plywood 19 mm", "NOS", 30, 18), ("Wall putty", "BAG", 25, 15)],
            "handover": [("Acrylic emulsion", "LTR", 40, 20), ("CP fittings set", "SET", 6, 4), ("Silicone sealant", "NOS", 24, 10)]}
    EQUIP = {"civil": [("Concrete mixer", 1, 6), ("Scaffolding sets", 12, None)], "mep": [("Core cutting machine", 1, 3)],
             "finish": [("Marble cutter", 2, 5), ("Laser level", 1, None)], "handover": [("Floor scrubber", 1, 4)]}
    PLAN = {"civil": "Continue brickwork and start plaster on the next floor; cement delivery expected by 10 am.",
            "mep": "Complete conduiting and start pressure test of plumbing lines.",
            "finish": "Continue marble laying and wardrobe shutters; polish team to start on ground floor.",
            "handover": "Snag walkthrough with client; finish touch-ups and deep cleaning."}
    reps, mp = [], []
    rid = 0
    for pk, sid in SITE_INT.items():
        stage = STAGE[pk]
        floors = ["ground floor", "first floor", "second floor", "basement", "terrace"][: max(2, PBYKEY[pk][14] + 1)]
        eng = PM[pk][1]
        for back in range(56, -1, -1):
            day = d(-back)
            if day.weekday() == 6:  # Sunday off
                continue
            if back == 0 and pk in ("malhotra", "singhania"):
                continue  # today's report missing for two sites
            rid += 1
            k = rid * 7 + sid
            w = WORK[stage]
            acts = sorted({(w[(k + j) % len(w)].format(f=floors[(k + j) % len(floors)])) for j in range(3)})
            done = "; ".join(acts)
            month = day.month
            weather = "RAIN" if month in (7, 8) and k % 3 == 0 else ("EXTREME_HEAT" if month in (5, 6) and k % 2 == 0 else ["CLEAR", "CLEAR", "CLOUDY", "CLEAR"][k % 4])
            issue = ISSUES[k % len(ISSUES)]
            shared = back > 0 or pk in ("kapoor", "oberoi")
            itype, impact, attn = ISSUE_META.get(issue, ("OTHER", "LOW", False)) if issue else (None, None, False)
            mats = MATS[stage]
            m = mats[k % len(mats)]
            materials = [dict(direction="RECEIVED", name=m[0], quantity=m[2], unit=m[1], remarks="Challan checked on arrival")] if k % 3 == 0 else []
            materials.append(dict(direction="USED", name=mats[(k + 1) % len(mats)][0], quantity=mats[(k + 1) % len(mats)][3], unit=mats[(k + 1) % len(mats)][1]))
            reps.append(dict(id=rid, project_id=PID[pk], report_date=day, status="SUBMITTED" if back > 0 else "DRAFT",
                             submitted_at=dt(-back, 18, 40) if back > 0 else None, weather_condition=weather,
                             weather_notes={"RAIN": "Intermittent showers, external work paused", "EXTREME_HEAT": "43 C, work rescheduled 7-12 and 3-6"}.get(weather),
                             site_condition="WET" if weather == "RAIN" else "NORMAL",
                             work_completed=done + ".",
                             work_items=[dict(activity=a[0].upper() + a[1:], progress=min(100, 20 + ((k + j * 13) % 8) * 10)) for j, a in enumerate(acts)],
                             materials=materials,
                             equipment=[dict(name=n, count=c, hours=h) for n, c, h in EQUIP[stage]] if k % 2 == 0 else [],
                             issue_items=[dict(type=itype, description=issue, impact=impact, needsAttention=attn)] if issue else [],
                             issues=None, needs_attention=int(attn), safety_incident=0,
                             safety_notes="Toolbox talk held; PPE checked at gate." if k % 5 == 0 else None,
                             photos=[], next_day_plan=PLAN[stage], share_with_client=int(shared),
                             reported_by=UNAME[eng], is_shared=int(shared), shared_at=dt(-back, 19, 10) if shared else None,
                             created_at=dt(-back, 18, 30), updated_at=dt(-back, 18, 45)))
            for t, (lo, hi) in CREW[stage].items():
                mp.append(dict(id=rid * 10 + t, daily_site_report_id=rid, team_id=None, trade=TRADE_CODE[t], contractor_name=CONTRACTOR[t],
                               headcount=lo + (k * 3 + t) % (hi - lo + 1), created_at=dt(-back, 18, 30), updated_at=dt(-back, 18, 30)))
    # re-runnable: replace the seeded range (reports created from the app get higher auto-increment ids)
    o.sql(f"DELETE FROM manpower_entries WHERE daily_site_report_id BETWEEN 1 AND {rid}")
    o.sql(f"DELETE FROM daily_site_reports WHERE id BETWEEN 1 AND {rid}")
    o.ins("daily_site_reports", reps)
    o.ins("manpower_entries", mp)

    # ---------- visit assignments + visit log ----------
    va, logs = [], []
    aid = 0
    lid = 0
    for pk, sid in SITE_INT.items():
        arch, eng = PM[pk]
        plan = [("SUPERVISOR", 10, None, "DAILY", None, UNAME[eng]), ("ARCHITECT", 9, None, "WEEKLY", [2], UNAME[arch]),
                ("CLIENT", None, CNAME[PBYKEY[pk][2]], "FIXED_SCHEDULE", [6], CNAME[PBYKEY[pk][2]]),
                ("VENDOR", None, ["Deepak Stone Works", "Sharma Electricals", "Kalpana Joinery", "Skyline Ceilings"][sid % 4], "AD_HOC", None,
                 ["Deepak Stone Works", "Sharma Electricals", "Kalpana Joinery", "Skyline Ceilings"][sid % 4])]
        for vt, team, ext, freq, days, who in plan:
            aid += 1
            va.append(dict(id=aid, project_id=PID[pk], visitor_type=vt, team_id=team, external_party_name=ext, frequency=freq, schedule_days=days,
                           is_active=1, created_at=dt(-90), updated_at=dt(-90)))
            if vt == "SUPERVISOR":
                continue
            for back in range(-14, 43, 7 if vt != "VENDOR" else 11):
                day = -back
                wd_target = {"ARCHITECT": 1, "CLIENT": 5, "VENDOR": None}[vt]
                dd = d(day)
                if wd_target is not None:
                    dd = dd - timedelta(days=(dd.weekday() - wd_target) % 7)
                lid += 1
                past = dd < TODAY
                status = ("COMPLETED" if (lid % 6) else "MISSED") if past else "SCHEDULED"
                if dd == TODAY:
                    status = "SCHEDULED"
                logs.append(dict(id=lid, project_id=PID[pk], visit_assignment_id=aid, visitor_type=vt, visitor_name=who, scheduled_date=dd,
                                 actual_visit_at=datetime(dd.year, dd.month, dd.day, 11 + lid % 5, 15) if status == "COMPLETED" else None, status=status,
                                 purpose={"ARCHITECT": "Weekly design review & site instructions", "CLIENT": "Progress walkthrough",
                                          "VENDOR": "Measurement / installation check"}[vt],
                                 notes=("Issued site instruction SI-%02d for skirting detail" % (lid % 30)) if status == "COMPLETED" and vt == "ARCHITECT" else
                                       ("Client approved sample panel" if status == "COMPLETED" and vt == "CLIENT" else ("Visit missed - rescheduled" if status == "MISSED" else None)),
                                 logged_by=UNAME[eng], created_at=dt(min(day, 0) - 7), updated_at=dt(min(day, 0))))
    # today's supervisor check-ins
    for pk, sid in SITE_INT.items():
        lid += 1
        logs.append(dict(id=lid, project_id=PID[pk], visit_assignment_id=next(a["id"] for a in va if a["project_id"] == PID[pk] and a["visitor_type"] == "SUPERVISOR"),
                         visitor_type="SUPERVISOR", visitor_name=UNAME[PM[pk][1]], scheduled_date=TODAY, actual_visit_at=dt(0, 9, 20) if sid % 3 else None,
                         status="COMPLETED" if sid % 3 else "SCHEDULED", purpose="Daily supervision", notes="Checked in at site" if sid % 3 else None,
                         logged_by=UNAME[PM[pk][1]], created_at=dt(0, 8), updated_at=dt(0, 9, 20)))
    o.ins("visit_assignments", va)
    o.ins("site_visit_logs", logs)

    # ---------- QC sign-offs ----------
    steps_by_stage = {"civil": [1, 2, 3, 4], "mep": [3, 4, 5, 6, 7, 8], "finish": [3, 4, 5, 6, 7, 9, 10, 11], "handover": [4, 5, 6, 7, 9, 10, 11, 12, 13, 14]}
    qcs, res = [], []
    qid = 0
    for pk, sid in SITE_INT.items():
        for n, step in enumerate(steps_by_stage[STAGE[pk]]):
            team = PW_STEPS[step - 1][4]
            tplid = team if team in CHECKLISTS else 1
            attempts = [("FAIL", "Hollowness found in 6 tiles near balcony door; relay required") if (sid + n) % 4 == 0 else None,
                        ("REWORK", "Minor rework - edge banding gaps on 2 shutters") if (sid + n) % 7 == 3 else None]
            attempts = [a for a in attempts if a] + [("PASS", "All checks passed")]
            if (sid + n) % 9 == 5:
                attempts = [("FAIL", "Pressure dropped 0.5 kg/cm2 in 24 h - leak at master toilet diverter")]  # still open
            for a, (result, note) in enumerate(attempts):
                qid += 1
                when = -120 + n * 11 + a * 3 + sid
                when = min(when, -1)
                qcs.append(dict(id=qid, project_id=PID[pk], step_id=step, trade_team_id=team, checklist_template_id=tplid, result=result, attempt_number=a + 1,
                                checked_by=UNAME[PM[pk][1]] if a % 2 == 0 else UNAME[PM[pk][0]], checked_at=dt(when, 16), notes=note,
                                created_at=dt(when, 16), updated_at=dt(when, 16)))
                for j, iid in enumerate(item_ids[tplid]):
                    r = "PASS" if result == "PASS" or j != (qid % len(item_ids[tplid])) else "FAIL"
                    res.append(dict(id=qid * 100 + j + 1, qc_sign_off_id=qid, template_item_id=iid, result=r,
                                    remark=(note if r == "FAIL" else None), created_at=dt(when, 16), updated_at=dt(when, 16)))
    o.ins("qc_sign_offs", qcs)
    o.ins("qc_sign_off_item_results", res)

    # ---------- RFIs ----------
    rfis_src = [
        ("Skirting detail at marble-to-wood transition", "Drawing WORK-FLR-12 shows flush transition but levels differ by 6 mm. Please advise threshold detail.", "HIGH", 9, "ANSWERED",
         "Provide 8 mm brass T-profile; revised detail uploaded as R1."),
        ("Column clash with wardrobe in bedroom 2", "Structural column 450x300 intrudes into wardrobe depth. Reduce wardrobe depth or box around?", "URGENT", 9, "OPEN", None),
        ("DB location in kitchen", "DB shown behind refrigerator position. Confirm relocation to utility wall.", "NORMAL", 2, "CLOSED", "Relocate DB to utility wall, 1.8 m AFFL."),
        ("Waterproofing up-stand height", "Spec says 300 mm up-stand; shower area requires 1800 mm? Confirm.", "NORMAL", 1, "ANSWERED", "1800 mm in shower zone, 300 mm elsewhere."),
        ("Cove light profile size", "Approved profile 2 m not available; 3 m available ex-stock. OK to substitute?", "LOW", 5, "CLOSED", "OK to use 3 m, cut to size."),
        ("Stone jamb width for main door", "Jamb width not dimensioned on door schedule.", "NORMAL", 7, "OPEN", None),
        ("AC drain routing", "No drain point near master bedroom indoor unit. Route through false ceiling to balcony?", "HIGH", 8, "ANSWERED", "Yes, with 1:100 slope and insulated pipe."),
        ("Paint shade for accent wall", "Client asked for warmer shade than approved sample.", "LOW", 6, "OPEN", None),
    ]
    rf = []
    n = 0
    for pk, sid in SITE_INT.items():
        for j in range(3 if sid in (1, 4, 2) else 2):
            src = rfis_src[(sid * 3 + j) % len(rfis_src)]
            subj, qry, prio, team, st, resp = src
            n += 1
            raised = -(5 + (sid * 7 + j * 13) % 50)
            rf.append(dict(id=n, project_id=PID[pk], step_id=[6, 10, 11, 9, 5][(sid + j) % 5], rfi_number=j + 1, subject=subj, query=qry, raised_by=UNAME[PM[pk][1]],
                           raised_at=dt(raised, 12), priority=prio, routed_to_team_id=team, status=st, response=resp,
                           responded_by=UNAME[PM[pk][0]] if resp else None, responded_at=dt(raised + 2, 15) if resp else None,
                           closed_at=dt(raised + 5, 11) if st == "CLOSED" else None, attachment_urls=[f"/uploads/demo/rfi/{sid}-{j + 1}.jpg"],
                           created_at=dt(raised, 12), updated_at=dt(raised + (5 if st == "CLOSED" else 2 if resp else 0), 15)))
    o.ins("rfis", rf)

    # ---------- mockups ----------
    mk_src = [("Marble book-match panel", "Italian marble", "Living room feature wall", "APPROVED", True),
              ("Fluted veneer panel", "Walnut veneer + PU matt", "TV wall", "APPROVED", True),
              ("Bathroom tile sample wall", "800x1600 matt tiles", "Master toilet", "UNDER_REVIEW", False),
              ("Cove light mock-up", "Gypsum cove with 2700K strip", "Bedroom ceiling", "REJECTED", False),
              ("Kitchen shutter finish", "Sage suede laminate", "Kitchen", "PROPOSED", False),
              ("Texture paint sample", "Lime plaster finish", "Staircase wall", "APPROVED", True)]
    mk = []
    n = 0
    for pk, sid in SITE_INT.items():
        for j in range(2 if sid != 4 else 3):
            nm, fin, loc, st, cleared = mk_src[(sid + j * 2) % len(mk_src)]
            n += 1
            prop = -(10 + (sid * 5 + j * 17) % 60)
            mk.append(dict(id=n, project_id=PID[pk], step_id=[10, 11, 9, 12][(sid + j) % 4], name=nm, finish_type=fin, location=loc,
                           description=f"On-site mock-up of {nm.lower()} for client approval before rollout", reference_image_urls=[f"/uploads/demo/mockups/{sid}-{j + 1}.jpg"],
                           proposed_by=UNAME[PM[pk][0]], proposed_at=dt(prop, 11), status=st,
                           reviewed_by=CNAME[PBYKEY[pk][2]] if st in ("APPROVED", "REJECTED") else None, reviewed_at=dt(prop + 3, 17) if st in ("APPROVED", "REJECTED") else None,
                           review_notes={"APPROVED": "Looks great, proceed", "REJECTED": "Too cool - try warmer 2700K and deeper cove"}.get(st),
                           cleared_for_rollout=int(cleared), created_at=dt(prop, 11), updated_at=dt(prop + 3, 17)))
    o.ins("mockups", mk)

    # ---------- process step progress + gate logs ----------
    prog, gl = [], []
    n = 0
    for pk, sid in SITE_INT.items():
        done_upto = {"civil": 4, "mep": 6, "finish": 9, "handover": 13}[STAGE[pk]]
        for i, ph, nm, c, t in PW_STEPS:
            n += 1
            st = "COMPLETED" if i < done_upto else ("IN_PROGRESS" if i <= done_upto + 1 else "NOT_STARTED")
            if i == done_upto + 1 and sid in (2, 4):
                st = "BLOCKED"
            start = -150 + i * 9
            prog.append(dict(id=n, project_id=sid, step_id=i, status=st, assignee_team_id=t, assignee_name=TRADES.get(t, "Site Supervision"),
                             planned_start_date=d(start), planned_end_date=d(start + 10), actual_start_date=dt(start + 1) if st != "NOT_STARTED" else None,
                             actual_completion_date=dt(start + 12) if st == "COMPLETED" else None, signed_off_by=UNAME[PM[pk][1]] if st == "COMPLETED" else None,
                             signed_off_at=dt(start + 12) if st == "COMPLETED" else None, blocked_reason="Awaiting client decision on material" if st == "BLOCKED" else None,
                             notes=None, created_at=dt(-150), updated_at=dt(-1)))
            if c in ("RCC", "SNAG") and st == "COMPLETED":
                gl.append(dict(id=n, project_id=sid, step_id=i, gate_name={"RCC": "Structure complete", "SNAG": "Ready for handover"}[c], achieved_at=dt(start + 12),
                               approver_team_id=10, approver_name=UNAME[PM[pk][0]], notes="Gate achieved after QC pass", created_at=dt(start + 12), updated_at=dt(start + 12)))
    o.ins("project_step_progress", prog)
    o.ins("gate_logs", gl)
