"""02 CRM: leads/deals (+notes, activity, tasks), briefs, site recces, plans of action, scope of work."""
from lib import *


def inr(v):
    return f"₹{v / 1e7:.2f} Cr" if v >= 1e7 else f"₹{v / 1e5:.0f} L"


# name, company, phone, email, type, location, size, budget, timeline, source, owner, stage, days-in-stage,
# tag, color, followup offset, client key, project key, lost_reason
LEADS = [
    ("Kavita Saxena", None, "+91 98100 76231", "kavita.saxena@example.com", "Residential", "Defence Colony, New Delhi", "3,200 sq ft", 9500000, "6 months", "Instagram", "vivek", "capture", 1, "Warm", "Blue", 2, None, None, None),
    ("Rahul Khurana", None, "+91 98991 20457", "rahul.k@example.com", "Residential", "Sector 57, Gurugram", "2,400 sq ft", 4500000, "4 months", "Website", "vivek", "capture", 3, "Cold", "Yellow", 4, None, None, None),
    ("Meenakshi Rao", "Rao Dental Clinics", "+91 99102 88213", "meenakshi@raodental.example.com", "Commercial", "Saket, New Delhi", "1,600 sq ft", 3500000, "3 months", "Referral - Chhabra Marble", "vivek", "capture", 0, "Hot", "Green", 1, None, None, None),
    ("Sanjay Goel", None, "+91 98110 90872", "sanjay.goel@example.com", "Residential", "Westend, New Delhi", "5,000 sq ft", 22000000, "12 months", "Referral - Past client", "ritika", "qual", 4, "Hot", "Green", 1, None, None, None),
    ("Tanvi Bhalla", None, "+91 97170 31820", "tanvi.bhalla@example.com", "Residential", "DLF Phase 5, Gurugram", "3,800 sq ft", 12000000, "8 months", "Houzz", "vivek", "qual", 9, "Warm", "Yellow", -2, None, None, None),
    ("Prakash Iyer", "Iyer & Associates", "+91 98733 44109", "prakash@iyerlaw.example.com", "Commercial", "Connaught Place, New Delhi", "4,200 sq ft", 9000000, "5 months", "LinkedIn", "vivek", "qual", 2, "Warm", "Blue", 3, None, None, None),
    ("Neelam Chopra", None, "+91 98181 22760", "neelam.chopra@example.com", "Residential", "Anand Lok, New Delhi", "6,500 sq ft", 35000000, "14 months", "Rocklime showroom walk-in", "ritika", "disc", 6, "Hot", "Green", 2, None, None, None),
    ("Vikas Agarwal", "Agarwal Exports", "+91 99580 71234", "vikas@agarwalexports.example.com", "Commercial", "Okhla Phase III, New Delhi", "12,000 sq ft", 28000000, "9 months", "Referral - Rocklime", "vivek", "disc", 16, "Warm", "Red", -5, None, None, None),
    ("Dr. Shalini Mathur", "Mathur Eye Centre", "+91 98100 44517", "shalini@mathureye.example.com", "Institutional", "Rajouri Garden, New Delhi", "7,000 sq ft", 18000000, "7 months", "Website", "arjun", "disc", 3, "Warm", "Yellow", 5, None, None, None),
    ("Nandini Gupta", None, "+91 98107 66410", "nandini.gupta@example.com", "Residential", "Sainik Farms, New Delhi", "8,800 sq ft", 38000000, "15 months", "Referral - Kapoor Farmhouse", "ritika", "prop", 5, "Hot", "Green", 1, "gupta", "gupta", None),
    ("Aditya Jain", None, "+91 98996 58310", "aditya.jain@example.com", "Residential", "Greater Kailash I, New Delhi", "4,000 sq ft", 15000000, "10 months", "Instagram", "vivek", "prop", 12, "Warm", "Red", -1, None, None, None),
    ("Rohan Bedi", "The Bedi Group", "+91 98100 33902", "rohan@bedigroup.example.com", "Commercial", "Aerocity, New Delhi", "18,000 sq ft", 45000000, "12 months", "Architect Digest feature", "ritika", "prop", 7, "Hot", "Green", 3, None, None, None),
    ("Siddharth Arora", "Arora Foods Pvt Ltd", "+91 99990 21478", "siddharth@arorafoods.example.com", "Commercial", "Sector 44, Gurugram", "9,000 sq ft", 16000000, "8 months", "LinkedIn", "vivek", "nego", 4, "Hot", "Green", 1, "arora", "arora", None),
    ("Pallavi Sood", None, "+91 98185 60214", "pallavi.sood@example.com", "Residential", "Vasant Kunj, New Delhi", "2,900 sq ft", 6500000, "5 months", "Referral - Oberoi Apartment", "neha", "nego", 11, "Warm", "Yellow", 0, None, None, None),
    ("Harpreet Sethi", "Sethi Hospitality Pvt Ltd", "+91 98733 11820", "harpreet@sethihospitality.example.com", "Commercial", "Mehrauli, New Delhi", "22,000 sq ft", 80000000, "24 months", "Referral - Chhabra Marble", "ritika", "contract", 20, "Hot", "Green", 7, "sethi", "courtyard", None),
    ("Deepa Singhania", None, "+91 98182 77430", "deepa.singhania@example.com", "Residential", "Golf Course Road, Gurugram", "6,400 sq ft", 22000000, "12 months", "Instagram", "neha", "contract", 45, "Warm", "Green", None, "singhania", "singhania", None),
    ("Rajiv Bhatia", None, "+91 98100 45120", "rajiv.bhatia@example.com", "Residential", "Greater Kailash II, New Delhi", "10,800 sq ft", 65000000, "24 months", "Referral - Past client", "ritika", "handoff", 60, "Hot", "Green", None, "bhatia", "bhatia", None),
    ("Karan Oberoi", None, "+91 98189 33104", "karan.oberoi@example.com", "Residential", "DLF The Camellias, Gurugram", "5,200 sq ft", 12000000, "9 months", "Website", "neha", "handoff", 90, "Warm", "Green", None, "oberoi", "oberoi", None),
    ("Aditi Rao", "Brew Theory Cafe LLP", "+91 97111 40302", "aditi@brewtheory.example.com", "Commercial", "Hauz Khas Village, New Delhi", "1,800 sq ft", 4500000, "4 months", "Walk-in", "kabir", "handoff", 70, "Cold", "Yellow", None, "brew", "brew", None),
    ("Manish Kohli", None, "+91 98110 72035", "manish.kohli@example.com", "Residential", "Punjabi Bagh, New Delhi", "3,600 sq ft", 8000000, "Next year", "Website", "vivek", "nurture", 30, "Cold", "Blue", 21, None, None, None),
    ("Ritu Malhotra", "Blossom Preschool", "+91 99711 38205", "ritu@blossompreschool.example.com", "Institutional", "Dwarka Sector 12, New Delhi", "5,500 sq ft", 7000000, "After March", "Facebook", "vivek", "nurture", 42, "Cold", "Blue", 35, None, None, None),
    ("Gaurav Mittal", None, "+91 98999 11043", "gaurav.mittal@example.com", "Residential", "Noida Sector 44", "4,500 sq ft", 11000000, "6 months", "Instagram", "vivek", "lost", 25, "Cold", "Red", None, None, None, "Chose a design-build firm with lower fee"),
    ("Ankita Sharma", "Urban Brew Co.", "+91 97160 52188", "ankita@urbanbrew.example.com", "Commercial", "Cyber Hub, Gurugram", "2,200 sq ft", 5000000, "2 months", "Referral - Brew Theory", "kabir", "lost", 40, "Cold", "Red", None, None, None, "Timeline too tight - wanted opening in 6 weeks"),
    ("Amit Choudhary", None, "+91 98995 12076", "amit.choudhary@example.com", "Residential", "Sector 50, Noida", "3,100 sq ft", 6000000, "5 months", "Website", "vivek", "qual", 1, "Warm", "Yellow", 2, "choudhary", None, None),
    ("Col. R. S. Dhillon", None, "+91 98140 22917", "rs.dhillon@example.com", "Residential", "Sainik Farms, New Delhi", "7,500 sq ft", 26000000, "12 months", "Referral - Gupta Villa", "ritika", "disc", 2, "Hot", "Green", 4, None, None, None),
]


def build(o: Out):
    leads, notes, acts, tasks = [], [], [], []
    for i, L in enumerate(LEADS):
        (name, comp, phone, email, ltype, loc, size, budget, tl, src, owner, stage, days, tag, color, fu, ck, pk, lost) = L
        lid = U("lead:" + name)
        created = dt(-(days + 5 + i * 3 % 40), 10 + i % 7)
        entered = dt(-days, 11)
        prop_amt = budget * 0.08 if stage in ("prop", "nego", "contract", "handoff", "lost") else None
        deal = f"{comp or name.split()[-1]} - {'Office fit-out' if ltype == 'Commercial' and 'Cafe' not in (comp or '') else ('Clinic interiors' if ltype == 'Institutional' else ('Cafe interiors' if 'Brew' in (comp or '') else 'Residence design & build'))}"
        if pk:
            deal = PNAME[pk]
        leads.append(dict(
            id=lid, name=name, deal_name=deal, company=comp, client_id=CID.get(ck) if ck else None,
            project_id=PID.get(pk) if pk else None, phone=phone, whatsapp=phone, email=email, type=ltype,
            location=loc, size=size, budget=inr(budget), amount=budget, expected_close=d(fu + 20) if fu is not None and stage not in ("lost", "handoff", "contract") else (d(-days) if stage in ("contract", "handoff") else None),
            timeline=tl, source=src, owner=UNAME[owner], owner_id=UID[owner], stage=stage, days=days,
            stage_entered_at=entered, tag=tag, color=color, stuck_mode="auto",
            follow_up=d(fu) if fu is not None else None,
            proposal_amount=inr(prop_amt) if prop_amt else None,
            proposal_timeline=("Design 10 weeks + execution " + tl) if prop_amt else None,
            proposal_remarks=("Design fee 8% of project cost; PMC 4% optional" if prop_amt else None),
            doc_brief=int(stage not in ("capture", "qual", "lost", "nurture")), doc_proposal=int(stage in ("prop", "nego", "contract", "handoff")),
            doc_contract=int(stage in ("contract", "handoff")), created_at=created, updated_at=entered,
            lost_reason=lost, closed_at=entered if stage in ("contract", "handoff", "lost") else None,
            description=f"{ltype} enquiry for {size} at {loc}. Budget indicated {inr(budget)}, timeline {tl}. Source: {src}."))
        # notes
        nt = [
            (0, "Initial call done. Client shared plot/unit details and reference images on WhatsApp."),
            (1, f"Budget discussed around {inr(budget)}; client open to phased execution."),
        ]
        if stage in ("disc", "prop", "nego", "contract", "handoff"):
            nt.append((2, "Site visit completed with Sandeep. Structure is sound; plumbing stacks need relocation."))
        if stage in ("prop", "nego", "contract", "handoff"):
            nt.append((3, "Pitch presentation and moodboard shared. Client liked warm contemporary direction with Italian marble."))
        if stage in ("nego", "contract", "handoff"):
            nt.append((4, "Negotiated design fee from 9% to 8%; PMC scope clarified."))
        if stage == "lost":
            nt.append((2, "Client informed they are going ahead with another firm. " + (lost or "")))
        for j, (off, text) in enumerate(nt):
            notes.append(dict(id=U(f"lnote:{name}:{j}"), lead_id=lid, author=UNAME[owner], text=text,
                              created_at=created + timedelta(days=off * max(1, (days + 5) // 5), hours=j)))
        # activity timeline
        order = ["capture", "qual", "disc", "prop", "nego", "contract", "handoff"]
        path = order[:order.index(stage) + 1] if stage in order else (["capture", "qual"] + [stage])
        span = max(1, (entered - created).days)
        acts.append(dict(id=U(f"lact:{name}:created"), lead_id=lid, kind="created", author=UNAME[owner],
                         text=f"Lead created from {src}", created_at=created))
        for j, st in enumerate(path[1:], 1):
            acts.append(dict(id=U(f"lact:{name}:{st}"), lead_id=lid, kind="stage", author=UNAME[owner],
                             text=f"Stage changed to {st.upper()}", created_at=created + timedelta(days=span * j / len(path))))
        acts.append(dict(id=U(f"lact:{name}:call"), lead_id=lid, kind="call", author=UNAME[owner],
                         text="Follow-up call - discussed timelines and next steps", created_at=created + timedelta(days=1, hours=3)))
        if stage in ("disc", "prop", "nego", "contract", "handoff"):
            acts.append(dict(id=U(f"lact:{name}:meeting"), lead_id=lid, kind="meeting", author=UNAME[owner],
                             text="Site meeting with client", created_at=created + timedelta(days=span // 2 + 1)))
        if prop_amt:
            acts.append(dict(id=U(f"lact:{name}:proposal"), lead_id=lid, kind="proposed", author=UNAME[owner],
                             text=f"Proposal sent for {inr(prop_amt)}", created_at=entered - timedelta(days=1) if stage != "prop" else entered))
        # tasks
        if stage not in ("lost", "handoff"):
            nxt = {"capture": "Call back and qualify budget", "qual": "Schedule site visit", "disc": "Prepare pitch proposal & moodboard",
                   "prop": "Follow up on proposal feedback", "nego": "Send revised fee proposal", "contract": "Collect token & signed agreement",
                   "nurture": "Quarterly check-in call"}[stage]
            tasks.append(dict(id=U(f"ltask:{name}:1"), lead_id=lid, title=nxt, due_date=d(fu if fu is not None else 3), done=0,
                              created_by=UNAME[owner], created_at=entered, updated_at=entered))
        tasks.append(dict(id=U(f"ltask:{name}:0"), lead_id=lid, title="Share company profile & past work", due_date=(created + timedelta(days=1)).date(),
                          done=1, created_by=UNAME[owner], created_at=created, updated_at=created + timedelta(days=1)))
    o.ins("leads", leads)
    o.ins("lead_notes", notes)
    o.ins("lead_activity", acts)
    if has_table("lead_tasks"):
        o.ins("lead_tasks", tasks)

    build_briefs(o)
    build_recces(o)
    build_poa(o)
    build_scope(o)


STYLE = {"kapoor": ["WARM_RUSTIC", "INDIAN_CONTEMPORARY"], "malhotra": ["CONTEMPORARY", "LUXE_OPULENT"], "sagar": ["MINIMAL", "CONTEMPORARY"],
         "cmstore": ["LUXE_OPULENT"], "aurum": ["MINIMAL", "INDUSTRIAL"], "bhatia": ["CLASSIC_TRADITIONAL", "LUXE_OPULENT"],
         "oberoi": ["CONTEMPORARY", "MID_CENTURY"], "courtyard": ["INDIAN_CONTEMPORARY", "WARM_RUSTIC"], "rocklime": ["MINIMAL", "INDUSTRIAL"],
         "gupta": ["WARM_RUSTIC", "INDIAN_CONTEMPORARY"], "arora": ["CONTEMPORARY"], "singhania": ["LUXE_OPULENT", "CONTEMPORARY"],
         "tandon": ["CLASSIC_TRADITIONAL"], "brew": ["INDUSTRIAL", "WARM_RUSTIC"]}
SPACES = {
    "residential": ["Living Room", "Dining", "Kitchen", "Master Bedroom", "Bedroom 2", "Bedroom 3", "Puja Room", "Powder Room", "Terrace"],
    "farmhouse": ["Entrance Foyer", "Living Room", "Dining", "Kitchen", "Master Suite", "Guest Suite", "Pool Pavilion", "Lawn & Landscape"],
    "apartment": ["Living & Dining", "Kitchen", "Master Bedroom", "Kids Bedroom", "Guest Bedroom", "Study", "Balcony"],
    "office": ["Reception", "Open Workstations", "Director Cabins", "Boardroom", "Meeting Rooms", "Pantry", "Server Room", "Washrooms"],
    "retail": ["Facade & Entrance", "Display Gallery", "Experience Zone", "Client Lounge", "Back Office", "Storage"],
    "hospitality": ["Arrival Court", "Lobby & Reception", "Courtyard", "All-day Diner", "Guest Rooms (typical)", "Suites", "Spa", "Rooftop Bar"],
}


def ptype(pk):
    return PBYKEY[pk][3]


def build_briefs(o):
    briefs, occ, ph, proc, svc, rest, spc, sty, wt, docs, refs, att = ([] for _ in range(12))
    for p in PROJECTS:
        k = p[0]
        if k == "kapoor":
            continue  # existing brief kept
        bid = U("brief:" + k)
        start = start_of(k)
        status = "DRAFT" if pidx(k) <= 1 else ("READY_FOR_DESIGN" if pidx(k) <= 3 else "SIGNED_OFF")
        budget = p[5]
        briefs.append(dict(
            id=bid, project_id=PID[k], relationship_to_client="Owner" if ptype(k) in ("residential", "farmhouse", "apartment") else "Director",
            referred_by_source=["Referral - past client", "Instagram", "Website", "Chhabra Marble showroom"][len(k) % 4],
            brief_date=d(start + 3), site_address=site_addr(k), project_type_id=PTID[ptype(k)], site_area=p[13], site_area_unit="SQ_FT",
            facing_orientation=["East", "North", "North-East", "West"][len(k) % 4],
            parking_provision="Stilt parking for 3 cars" if ptype(k) in ("residential",) else "Basement / common parking",
            ownership_status="Owned" if ptype(k) in ("residential", "farmhouse", "apartment") else "Leased (9-year lease)",
            number_of_floors=p[14], lift_available=int(p[14] > 2 or ptype(k) in ("apartment", "office")), site_type=p[15],
            site_condition="OCCUPIED" if k in ("sagar", "tandon") else "UNOCCUPIED", drawings_available="ARCHITECTURAL" if k != "courtyard" else "NONE",
            areas_included_in_scope=", ".join(SPACES[ptype(k)]), areas_excluded_from_scope="Servant quarters, external boundary wall" if ptype(k) == "residential" else "Common areas of the building",
            work_already_done_by_others="Structure complete by builder" if ptype(k) == "apartment" else None,
            vastu_requirements="Main entrance east-facing; kitchen in south-east; puja room north-east" if ptype(k) in ("residential", "farmhouse", "apartment") else "Director cabin in south-west",
            colours_to_avoid="Black and dark red", materials_liked="Italian marble, fluted wood, brushed brass, terrazzo",
            materials_disliked_hard_no="High-gloss laminates, glass mosaic", must_have_elements="Concealed storage, warm cove lighting, home automation" if ptype(k) != "office" else "Phone booths, biophilic wall, acoustic ceiling",
            colours_preferred="Warm neutrals, sage green, walnut", maintenance_appetite=["LOW", "MEDIUM", "HIGH"][len(k) % 3],
            initial_client_budget=budget * 0.9, budget_currency="INR", budget_flexibility="Up to 10% for premium finishes",
            desired_start_date=d(start + 20), site_handover_date=d(start + 25), target_completion_date=d(start + p[11]),
            deadline_reason="Family wedding in Feb" if k == "bhatia" else ("Planned opening before Diwali" if ptype(k) in ("retail", "hospitality") else None),
            phasing_required=int(p[11] > 400), household_notes="Family of 5 including elderly parents; two dogs" if ptype(k) in ("residential", "farmhouse") else None,
            open_points_to_close="Confirm basement waterproofing scope; finalise kitchen appliance list" if pidx(k) < 5 else None,
            brief_taken_by=UID[PM[k][0]], brief_taken_date=d(start + 3), confirmed_by_user_id=UID["ritika"] if status != "DRAFT" else None,
            confirmed_date=d(start + 8) if status != "DRAFT" else None, status=status, version=1,
            created_at=dt(start + 3), updated_at=dt(start + 8), deleted_at=None))
        if ptype(k) in ("residential", "farmhouse", "apartment"):
            client_first = CNAME[p[2]].split()[0]
            for j, (n, rel, need) in enumerate([(CNAME[p[2]], "Self", "Home office corner with good daylight"),
                                                 ("Spouse", "Spouse", "Large walk-in wardrobe; reading nook"),
                                                 ("Children (2)", "Children", "Study desks, bunk storage"),
                                                 ("Parents", "Parents", "Ground-floor bedroom with anti-skid flooring and grab bars")]):
                occ.append(dict(id=U(f"bocc:{k}:{j}"), project_brief_id=bid, sort_order=j, name=n, relationship=rel,
                                specific_needs_preferences=need, created_at=dt(start + 3), updated_at=dt(start + 3)))
        for j, (n, desc, s0, e0) in enumerate([("Design", "Concept to GFC drawings", 10, 90), ("Execution", "Civil, MEP and finishes", 90, p[11] - 20),
                                                ("Handover", "Snags, deep cleaning and styling", p[11] - 20, p[11])]):
            ph.append(dict(id=U(f"bph:{k}:{j}"), project_brief_id=bid, sort_order=j, phase_name=n, description=desc, start_date=d(start + s0),
                           end_date=d(start + e0), expected_time=f"{(e0 - s0) // 7} weeks", notes=None, created_at=dt(start + 3), updated_at=dt(start + 3)))
        cats = ["CIVIL_BUILDING_MATERIAL", "ELECTRICAL", "PLUMBING", "TILES", "SANITARY", "CP_FITTINGS", "MARBLE", "PLY_WOOD", "HARDWARE", "PAINTS_POLISHES", "DOORS"]
        for c in cats[: 6 + len(k) % 5]:
            proc.append(dict(id=U(f"bproc:{k}:{c}"), project_brief_id=bid, category=c, other_description=None, created_at=dt(start + 3)))
        services = ["INTERIOR_DESIGN", "EXECUTION", "MATERIAL_PROCUREMENT"] + (["ARCHITECTURE_DESIGN"] if ptype(k) in ("residential", "farmhouse", "hospitality") else []) + (["LANDSCAPE_DESIGN"] if ptype(k) in ("farmhouse", "hospitality") else [])
        for s in services:
            svc.append(dict(id=U(f"bsvc:{k}:{s}"), project_brief_id=bid, service_type=s, created_at=dt(start + 3)))
        rtypes = [("societyRwaPermittedWorkTimings", "Work allowed 9:30 am - 6:30 pm, no work on Sundays"),
                  ("nocOrSecurityDepositRequired", "Society NOC required; refundable deposit Rs 50,000"),
                  ("materialMovementRestrictions", "Material movement only via service lift before 11 am"),
                  ("powerAndWaterAvailability", "3-phase supply available; water tanker needed for curing"),
                  ("neighbourSensitivities", "Elderly neighbours - no drilling during 2-4 pm"),
                  ("accessStorageDebrisDisposal", "Debris to be cleared daily; stilt area usable for storage")]
        for j, (t, det) in enumerate(rtypes[: 3 + len(k) % 4]):
            rest.append(dict(id=U(f"brest:{k}:{t}"), project_brief_id=bid, sort_order=j, type=t, details=det, created_at=dt(start + 3), updated_at=dt(start + 3)))
        for j, sname in enumerate(SPACES[ptype(k)]):
            spc.append(dict(id=U(f"bspace:{k}:{j}"), project_brief_id=bid, sort_order=j, space_name=sname,
                            requirement_details=f"{sname}: custom joinery, layered lighting and concealed services", quantity=1,
                            notes=None, created_at=dt(start + 3), updated_at=dt(start + 3)))
        for s in STYLE[k]:
            sty.append(dict(id=U(f"bsty:{k}:{s}"), project_brief_id=bid, style_direction=s, other_description=None, created_at=dt(start + 3)))
        wt.append(dict(id=U(f"bwt:{k}"), project_brief_id=bid, work_type="TURNKEY" if k not in ("aurum", "sagar") else "CONSULTANCY", created_at=dt(start + 3)))
        docs.append(dict(id=U(f"bdoc:{k}:1"), project_brief_id=bid, document_type="SANCTIONED_PLAN" if k != "courtyard" else "NOTHING_AVAILABLE",
                         document_name="Sanctioned building plan.pdf" if k != "courtyard" else None,
                         document_url=f"/uploads/demo/{k}/sanctioned-plan.pdf" if k != "courtyard" else None, notes=None, created_at=dt(start + 3)))
        refs.append(dict(id=U(f"bref:{k}:1"), project_brief_id=bid, title="Client Pinterest board", reference_url="https://pinterest.com/", file_url=None,
                         description="Warm minimal interiors with natural stone", sort_order=0, created_at=dt(start + 3)))
        att.append(dict(id=U(f"batt:{k}:1"), project_brief_id=bid, category="PHOTO", name="Existing site photos.zip",
                        file_url=f"/uploads/demo/{k}/site-photos.zip", mime_type="application/zip", uploaded_by=UID[PM[k][0]], created_at=dt(start + 4)))
    o.ins("project_briefs", briefs)
    o.ins("project_brief_occupants", occ)
    o.ins("project_brief_phases", ph)
    o.ins("project_brief_procurement_categories", proc)
    o.ins("project_brief_services", svc)
    o.ins("project_brief_site_restrictions", rest)
    o.ins("project_brief_space_requirements", spc)
    o.ins("project_brief_style_directions", sty)
    o.ins("project_brief_work_types", wt)
    o.ins("project_brief_documents", docs)
    o.ins("project_brief_references", refs)
    o.ins("project_brief_attachments", att)


ROOMS = {"residential": [("Living Room", "LIVING_DINING", 22, 16), ("Kitchen", "KITCHEN", 14, 10), ("Master Bedroom", "MASTER_BEDROOM", 18, 15),
                         ("Bedroom 2", "BEDROOM", 14, 13), ("Master Toilet", "BATHROOM", 10, 7), ("Front Balcony", "BALCONY", 12, 5)],
         "office": [("Reception", "OTHER", 24, 18), ("Open Office", "OTHER", 80, 45), ("Boardroom", "OTHER", 28, 16), ("Pantry", "KITCHEN", 16, 12)],
         "retail": [("Front Gallery", "OTHER", 40, 25), ("Experience Zone", "OTHER", 30, 22), ("Back Office", "OTHER", 14, 12)],
         "hospitality": [("Courtyard", "OTHER", 60, 45), ("Lobby", "OTHER", 40, 28), ("Typical Guest Room", "BEDROOM", 16, 14), ("Guest Bath", "BATHROOM", 9, 6)]}
ROOMS["farmhouse"] = ROOMS["residential"]
ROOMS["apartment"] = ROOMS["residential"]


def build_recces(o):
    rec, rooms, photos = [], [], []
    for p in PROJECTS:
        k = p[0]
        if pidx(k) < 1:
            continue
        rid = U("recce:" + k)
        eng = PM[k][1] or "sandeep"
        rd = start_of(k) + 10
        rec.append(dict(id=rid, project_id=PID[k], project_name=PNAME[k], client_name=CNAME[p[2]], site_address=site_addr(k), recce_date=d(rd),
                        site_engineer_id=UID[eng], accompanied_by=f"{CNAME[p[2]]} (client), {UNAME[PM[k][0]]}", unit_floor_no="Ground + " + str(p[14] - 1) if p[14] > 1 else "Ground",
                        carpet_area_sqft=round(p[13] * 0.78), built_up_area_sqft=p[13], number_of_rooms=len(ROOMS[ptype(k)]) + 2, number_of_floors=p[14],
                        site_type=p[15], lift_available=int(p[14] > 2 or p[15] == "FLAT"), lift_size="8 passenger, 1100 x 1400 mm" if p[14] > 2 or p[15] == "FLAT" else None,
                        staircase_width="1200 mm", material_entry_point="Rear service gate" if p[15] == "KOTHI" else "Service lift / goods entry",
                        water_connection="DJB connection + borewell" if "Gurugram" not in p[4] else "GMDA supply + overhead tank",
                        power_load_available="3-phase, 25 kW sanctioned", drainage_point_location="Rear setback, 2 manholes",
                        society_rwa_restrictions="No work on Sundays and national holidays" if p[15] in ("FLAT", "FLOOR") else "None",
                        working_hours_allowed="9:30 am - 6:30 pm", material_movement_rule="Before 11 am via service entrance",
                        existing_condition="Seepage on terrace slab; old wiring to be replaced; floor levels uneven by 20-30 mm" if k != "arora" else "Bare shell with services at column locations; AC ledge available",
                        created_by=UID[eng], updated_by=UID[eng], created_at=dt(rd, 17), updated_at=dt(rd + 1, 12), deleted_at=None))
        for j, (rn, rt, L, W) in enumerate(ROOMS[ptype(k)]):
            rmid = U(f"rroom:{k}:{j}")
            rooms.append(dict(id=rmid, site_recce_id=rid, room_name=rn, room_type=rt, room_number=j + 1, length=L, width=W, height=10.5 if ptype(k) != "office" else 12,
                              measurement_unit="FT", existing_flooring=["Vitrified tiles", "Kota stone", "Bare screed", "Marble (old)"][j % 4],
                              existing_ceiling=["POP false ceiling", "Plain RCC", "Grid ceiling"][j % 3], notes="Measure verified with laser", sort_order=j,
                              created_at=dt(rd, 17), updated_at=dt(rd, 17)))
            for s in range(1, 3):
                photos.append(dict(id=U(f"rphoto:{k}:{j}:{s}"), site_recce_id=rid, room_id=rmid, shot_number=s, layout_image_url=None, layout_file_name=None,
                                   photo_url=f"/uploads/demo/{k}/recce/{j + 1}-{s}.jpg", photo_file_name=f"{rn.lower().replace(' ', '-')}-{s}.jpg",
                                   standing_position=["Entry door", "Opposite corner"][s - 1], camera_direction=["Facing north", "Facing entry"][s - 1],
                                   notes=None, created_at=dt(rd, 17), updated_at=dt(rd, 17)))
    o.ins("site_recces", rec)
    o.ins("site_recce_rooms", rooms)
    o.ins("site_recce_photos", photos)


def build_poa(o):
    phases = q("SELECT id, phase_code, title, phase_number FROM project_phases WHERE module='PMC' ORDER BY phase_number")
    cons = q("SELECT id, phase_code, title, phase_number FROM project_phases WHERE module='CONSULTANCY' ORDER BY phase_number")
    poas, pph = [], []
    for p in PROJECTS:
        k = p[0]
        if pidx(k) < 3:
            continue
        pid = U("poa:" + k)
        status = "published" if pidx(k) >= 4 else "draft"
        seq = cons + (phases if k not in ("aurum", "sagar") else [])
        dur = [(20, 30), (30, 45), (15, 25), (15, 20), (25, 35), (15, 25), (45, 60), (60, 90), (30, 45), (10, 15)]
        off = 0
        for j, (phid, code, title, num) in enumerate(seq):
            mn, mx = dur[j % len(dur)]
            pph.append(dict(id=U(f"poaph:{k}:{phid}"), plan_of_action_id=pid, project_phase_id=phid, duration_min_days=mn, duration_max_days=mx,
                            parallel_work_note="Material selection runs parallel to design development" if "MATERIAL" in title else None,
                            inclusion_note=None, gantt_start_offset_days=off, gantt_duration_days=mx, sort_order=j + 1,
                            created_at=dt(start_of(k) + 30), updated_at=dt(start_of(k) + 30), deleted_at=None))
            off += int(mx * 0.8)
        tmin = sum(dur[j % len(dur)][0] for j in range(len(seq)))
        tmax = off
        poas.append(dict(id=pid, project_id=PID[k], title=f"Plan of Action - {PNAME[k]}",
                         execution_description="Design and execution sequenced to allow parallel material procurement; civil and MEP rough-ins before finishes.",
                         total_phases=len(seq), total_duration_min_days=tmin, total_duration_max_days=tmax,
                         total_duration_label=f"{tmin // 30}-{tmax // 30 + 1} months", terms_template_id=U("terms:poa"), terms_template_version_id=U("termsv:poa:1"),
                         terms_content_snapshot=None, status=status, published_at=dt(start_of(k) + 35) if status == "published" else None, version=1,
                         created_by=UID[PM[k][0]], updated_by=UID["anjali"], created_at=dt(start_of(k) + 30), updated_at=dt(start_of(k) + 35), deleted_at=None))
    o.ins("plan_of_actions", poas)
    o.ins("plan_of_action_phases", pph)


SCOPE_CATS = [("civil", "Civil Work"), ("electrical", "Electrical"), ("plumbing", "Plumbing & Sanitary"), ("flooring", "Flooring & Stone"),
              ("ceiling", "False Ceiling"), ("carpentry", "Carpentry & Furniture"), ("painting", "Painting & Polish"), ("hvac", "HVAC"),
              ("lighting", "Lighting & Automation"), ("soft", "Soft Furnishing & Decor")]


def build_scope(o):
    o.ins("scope_categories", [dict(id=U("scat:" + s), name=n, slug=s, description=f"{n} scope", sort_order=i, is_active=1,
                                    created_at=dt(-200), updated_at=dt(-200), deleted_at=None) for i, (s, n) in enumerate(SCOPE_CATS)])
    sow, spaces, items, psc = [], [], [], []
    for p in PROJECTS:
        k = p[0]
        for j, sname in enumerate(SPACES[ptype(k)]):
            spaces.append(dict(id=U(f"space:{k}:{j}"), project_id=PID[k], name=sname, slug=sname.lower().replace(" ", "-").replace("&", "and").replace("(", "").replace(")", ""),
                               description=None, sort_order=j, is_active=1, created_at=dt(start_of(k) + 5), updated_at=dt(start_of(k) + 5), deleted_at=None))
        for i, (s, n) in enumerate(SCOPE_CATS):
            psc.append(dict(id=U(f"psc:{k}:{s}"), project_id=PID[k], scope_category_id=U("scat:" + s), sort_order=i, is_active=1,
                            created_at=dt(start_of(k) + 5), updated_at=dt(start_of(k) + 5)))
        if pidx(k) < 1:
            continue
        sid = U("sow:" + k)
        status = "DRAFT" if pidx(k) < 3 else ("APPROVED" if pidx(k) < 4 else "ACCEPTED")
        sow.append(dict(id=sid, project_id=PID[k], scope_summary=f"Complete {'turnkey ' if k not in ('aurum', 'sagar') else ''}design{' and execution' if k not in ('aurum', 'sagar') else ''} for {PNAME[k]} covering {', '.join(SPACES[ptype(k)][:4])} and allied areas.",
                        specific_exclusions="Loose furniture, appliances, artwork, statutory approvals, external facade (unless specified)",
                        notes="Scope frozen after concept approval; changes via variation orders", project_mode="TURNKEY" if k not in ("aurum", "sagar") else "CONSULTANCY",
                        version=1, status=status, prepared_by=UID[PM[k][0]], reviewed_by=UID["ritika"], accepted_at=dt(start_of(k) + 25) if status == "ACCEPTED" else None,
                        accepted_by=ADMIN if status == "ACCEPTED" else None, client_signature_name=CNAME[p[2]] if status == "ACCEPTED" else None,
                        client_signature_date=d(start_of(k) + 25) if status == "ACCEPTED" else None, created_at=dt(start_of(k) + 15), updated_at=dt(start_of(k) + 25), deleted_at=None))
        for j, sname in enumerate(SPACES[ptype(k)]):
            for i, (s, n) in enumerate(SCOPE_CATS[:7]):
                excl = (s == "civil" and ptype(k) == "apartment")
                items.append(dict(id=U(f"sitem:{k}:{j}:{s}"), project_id=PID[k], scope_of_work_id=sid, project_space_id=U(f"space:{k}:{j}"),
                                  scope_category_id=U("scat:" + s), scope_of_work=f"{n} for {sname}", is_included=int(not excl), is_excluded=int(excl),
                                  notes="By builder" if excl else None, sort_order=i, created_at=dt(start_of(k) + 15), updated_at=dt(start_of(k) + 15), deleted_at=None))
    o.ins("project_spaces", spaces)
    o.ins("project_scope_categories", psc)
    o.ins("scope_of_work", sow)
    o.ins("scope_items", items)
