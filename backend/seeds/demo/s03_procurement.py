"""03 Procurement: vendors, materials, requirements, sample boards, rate sheets, estimates, quotations,
purchase orders, work orders, delivery challans, site inventory."""
from lib import *

# code, name, category, sub, brand, unit, model/spec, hsn, rate
MATERIALS = [
    ("CIV-001", "OPC Cement 53 Grade", "Civil", "Cement", "UltraTech", "BAG", "OPC 53, 50 kg bag", "2523", 410),
    ("CIV-002", "PPC Cement", "Civil", "Cement", "Ambuja", "BAG", "PPC, 50 kg bag", "2523", 385),
    ("CIV-003", "TMT Bar Fe550D 12mm", "Civil", "Steel", "TATA Tiscon", "KG", "Fe550D, 12 mm", "7214", 68),
    ("CIV-004", "TMT Bar Fe550D 16mm", "Civil", "Steel", "TATA Tiscon", "KG", "Fe550D, 16 mm", "7214", 67),
    ("CIV-005", "Coarse Sand (Badarpur)", "Civil", "Aggregates", None, "CFT", "Zone II", "2505", 62),
    ("CIV-006", "Stone Aggregate 20mm", "Civil", "Aggregates", None, "CFT", "20 mm crushed", "2517", 58),
    ("CIV-007", "AAC Block 600x200x150", "Civil", "Masonry", "Magicrete", "NOS", "600x200x150 mm", "6810", 78),
    ("CIV-008", "Red Clay Brick", "Civil", "Masonry", None, "NOS", "Class A, 230x110x75", "6904", 9.5),
    ("CIV-009", "Waterproofing Compound", "Civil", "Chemicals", "Dr. Fixit", "LTR", "Dr. Fixit LW+", "3824", 245),
    ("CIV-010", "Tile Adhesive", "Civil", "Chemicals", "Laticrete", "BAG", "Laticrete 290, 20 kg", "3214", 780),
    ("ELE-001", "FR PVC Wire 1.5 sq mm", "Electrical", "Wires", "Polycab", "RMT", "FRLS, 90 m coil", "8544", 24),
    ("ELE-002", "FR PVC Wire 4 sq mm", "Electrical", "Wires", "Polycab", "RMT", "FRLS, 90 m coil", "8544", 58),
    ("ELE-003", "Modular Switch 6A", "Electrical", "Switches", "Legrand", "NOS", "Arteor, white", "8536", 285),
    ("ELE-004", "MCB DB 12-way", "Electrical", "Distribution", "Schneider", "NOS", "Acti9, TPN", "8537", 6800),
    ("ELE-005", "LED COB Downlight 12W", "Electrical", "Lighting", "Philips", "NOS", "3000K, 24 deg", "9405", 1450),
    ("ELE-006", "LED Strip Profile 2m", "Electrical", "Lighting", "Wipro", "NOS", "Aluminium profile with diffuser", "9405", 950),
    ("ELE-007", "PVC Conduit 25mm", "Electrical", "Conduits", "Precision", "RMT", "Heavy gauge", "3917", 38),
    ("PLB-001", "CPVC Pipe 1 inch", "Plumbing", "Pipes", "Astral", "RMT", "SDR 11", "3917", 185),
    ("PLB-002", "UPVC SWR Pipe 110mm", "Plumbing", "Pipes", "Supreme", "RMT", "Type B", "3917", 260),
    ("PLB-003", "Concealed Diverter", "Plumbing", "CP Fittings", "Grohe", "NOS", "Grohtherm SmartControl", "8481", 38500),
    ("PLB-004", "Wall-hung WC with Concealed Cistern", "Plumbing", "Sanitary", "Rocklime", "SET", "Rimless, soft-close seat", "6910", 42000),
    ("PLB-005", "Counter-top Wash Basin", "Plumbing", "Sanitary", "Rocklime", "NOS", "Matt white, 600 mm", "6910", 14500),
    ("PLB-006", "Rain Shower Head 250mm", "Plumbing", "CP Fittings", "Hansgrohe", "NOS", "Raindance Select", "8481", 21800),
    ("FLR-001", "Italian Marble - Statuario", "Flooring", "Marble", "Chhabra Marble", "SQFT", "18 mm, book-matched", "6802", 1150),
    ("FLR-002", "Italian Marble - Botticino", "Flooring", "Marble", "Chhabra Marble", "SQFT", "18 mm", "6802", 520),
    ("FLR-003", "Indian Granite - Black Galaxy", "Flooring", "Granite", "Chhabra Marble", "SQFT", "20 mm, polished", "6802", 240),
    ("FLR-004", "Vitrified Tile 800x1600", "Flooring", "Tiles", "Rocklime", "SQFT", "Matt, rectified", "6907", 165),
    ("FLR-005", "Engineered Wood Flooring - Oak", "Flooring", "Wood", "Pergo", "SQFT", "14 mm, 3-strip", "4418", 390),
    ("FLR-006", "Anti-skid Bathroom Tile 600x600", "Flooring", "Tiles", "Kajaria", "SQFT", "R11 anti-skid", "6907", 78),
    ("CRP-001", "BWP Plywood 19mm", "Carpentry", "Board", "Century", "SQFT", "IS:710 marine grade", "4412", 142),
    ("CRP-002", "BWR Plywood 12mm", "Carpentry", "Board", "Greenply", "SQFT", "IS:303", "4412", 88),
    ("CRP-003", "HDHMR Board 18mm", "Carpentry", "Board", "Action Tesa", "SQFT", "Pre-lam both sides", "4411", 115),
    ("CRP-004", "Laminate 1mm", "Carpentry", "Surface", "Merino", "NOS", "8x4 ft sheet, suede finish", "4823", 2350),
    ("CRP-005", "Veneer - American Walnut", "Carpentry", "Surface", "Greenlam", "SQFT", "Natural, 0.6 mm", "4408", 310),
    ("CRP-006", "Soft-close Hinge", "Carpentry", "Hardware", "Hettich", "NOS", "Sensys 110 deg", "8302", 420),
    ("CRP-007", "Tandem Drawer Channel 500mm", "Carpentry", "Hardware", "Blum", "SET", "Tandembox antaro", "8302", 5200),
    ("CEL-001", "Gypsum Board 12.5mm", "False Ceiling", "Board", "Gyproc", "NOS", "6x4 ft", "6809", 520),
    ("CEL-002", "GI Ceiling Section", "False Ceiling", "Framing", "Gyproc", "RMT", "Ultra-channel 0.5 mm", "7216", 55),
    ("PNT-001", "Interior Emulsion - Royale", "Paint", "Emulsion", "Asian Paints", "LTR", "Royale Luxury, base white", "3209", 520),
    ("PNT-002", "Wall Putty", "Paint", "Putty", "Birla White", "BAG", "40 kg", "3214", 850),
    ("PNT-003", "PU Polish - Matt", "Paint", "Polish", "Asian Paints", "LTR", "Woodtech PU Interior", "3208", 780),
    ("HVAC-001", "VRV Indoor Unit 2TR Cassette", "HVAC", "Indoor", "Daikin", "NOS", "4-way cassette", "8415", 68000),
    ("HVAC-002", "Copper Pipe 5/8 inch", "HVAC", "Piping", "Mandev", "RMT", "Insulated", "7411", 640),
    ("GLS-001", "Toughened Glass 12mm", "Glass & Aluminium", "Glass", "Saint-Gobain", "SQFT", "Clear, polished edges", "7007", 290),
    ("GLS-002", "Aluminium Sliding Window System", "Glass & Aluminium", "Windows", "Schuco", "SQFT", "Slim profile, DGU", "7610", 1650),
]
MID = {m[0]: U("mat:" + m[0]) for m in MATERIALS}
MBY = {m[0]: m for m in MATERIALS}

# key, name, company, designation, category, business type, phone, address, state, gstin, status, material categories
VENDORS = [
    ("sharma_elec", "Sharma Electricals", "Sharma Electricals & Contractors", "Proprietor", "Contractor", "Electrician", "+91 98110 55120", "B-44, Lajpat Nagar II, New Delhi", "Delhi", "07ABCPS1234K1Z5", "active", ["Electrical"]),
    ("deepak_stone", "Deepak Stone Works", "Deepak Stone Works", "Owner", "Contractor", "Polishing", "+91 98111 60218", "Gali 4, Rajokri, New Delhi", "Delhi", "07AFKPD4521L1Z3", "active", ["Flooring"]),
    ("kalpana", "Kalpana Joinery", "Kalpana Joinery Works", "Partner", "Contractor", "Carpenter", "+91 98913 44091", "Kirti Nagar Furniture Block, New Delhi", "Delhi", "07AAKFK7810M1Z9", "active", ["Carpentry"]),
    ("chhabra_marble", "Chhabra Marble", "Chhabra Marble Pvt Ltd", "Sales Head", "Material", "Flooring", "+91 98112 00101", "Plot 21, Kirti Nagar Industrial Area, New Delhi", "Delhi", "07AACCC5566P1Z2", "active", ["Flooring"]),
    ("rocklime", "Rocklime", "Rocklime India Pvt Ltd", "Key Accounts", "Material", "Plumbing Materials", "+91 98112 00100", "D-41, Okhla Industrial Area Phase II, New Delhi", "Delhi", "07AAGCR9087Q1Z1", "active", ["Plumbing", "Flooring"]),
    ("gupta_cement", "Gupta Building Materials", "Gupta Building Materials", "Proprietor", "Material", "Cement", "+91 98100 71004", "Mehrauli-Gurgaon Road, Ghitorni, New Delhi", "Delhi", "07ADNPG3310R1Z7", "active", ["Civil"]),
    ("steel_hub", "Delhi Steel Hub", "Delhi Steel Hub LLP", "Manager", "Material", "Steel", "+91 99101 82231", "Loha Mandi, Naraina, New Delhi", "Delhi", "07AAPFD6612S1Z4", "active", ["Civil"]),
    ("polycab_dist", "Bright Wires & Cables", "Bright Wires & Cables", "Owner", "Material", "Electrical Materials", "+91 98181 22019", "Bhagirath Palace, Chandni Chowk, Delhi", "Delhi", "07AAHFB2245T1Z8", "active", ["Electrical"]),
    ("century_ply", "Century Ply Point", "Century Ply Point", "Proprietor", "Material", "Wood", "+91 98730 51177", "Kirti Nagar Timber Market, New Delhi", "Delhi", "07AFGPC8812U1Z6", "active", ["Carpentry"]),
    ("hettich_hw", "Hardware House", "Hardware House", "Manager", "Material", "Hardware", "+91 98100 34512", "Chawri Bazar, Delhi", "Delhi", "07AAKFH5521V1Z0", "active", ["Carpentry"]),
    ("gyproc_fc", "Skyline Ceilings", "Skyline Ceilings Pvt Ltd", "Director", "Contractor", "Interior Contractor", "+91 98995 78120", "Sector 63, Noida", "Uttar Pradesh", "09AAQCS4410W1Z2", "active", ["False Ceiling"]),
    ("asian_paints", "Colour Craft Painters", "Colour Craft Painters", "Proprietor", "Contractor", "Painter", "+91 97172 66510", "Madanpur Khadar, New Delhi", "Delhi", "07BNJPC1928X1Z5", "active", ["Paint"]),
    ("aqua_plumb", "AquaFlow Plumbing", "AquaFlow Plumbing Services", "Owner", "Contractor", "Plumbing Contractor", "+91 98183 20341", "Chhatarpur Extension, New Delhi", "Delhi", "07AOIPA3302Y1Z3", "active", ["Plumbing"]),
    ("bharat_civil", "Bharat Builders", "Bharat Builders & Contractors", "Director", "Contractor", "Civil Contractor", "+91 98102 88774", "Sultanpur, MG Road, New Delhi", "Delhi", "07AAFFB7709Z1Z9", "active", ["Civil"]),
    ("cool_air", "CoolAir HVAC Solutions", "CoolAir HVAC Solutions Pvt Ltd", "Project Head", "Contractor", "AC Work", "+91 98714 55023", "Udyog Vihar Phase IV, Gurugram", "Haryana", "06AAHCC6121A1Z1", "active", ["HVAC"]),
    ("glass_tech", "GlassTech Facades", "GlassTech Facades", "Partner", "Material", "Glass", "+91 98111 90456", "Mayapuri Phase II, New Delhi", "Delhi", "07AAPFG4450B1Z6", "active", ["Glass & Aluminium"]),
    ("tile_mart", "Kajaria Tile Mart", "Tile Mart Distributors", "Manager", "Material", "Tiles", "+91 99991 23455", "Kirti Nagar, New Delhi", "Delhi", "07AAKFT8844C1Z4", "active", ["Flooring"]),
    ("sanjay_labour", "Sanjay Labour Contractor", "Sanjay Kumar & Sons", "Contractor", "Contractor", "Labour Contractor", "+91 98914 72210", "Sangam Vihar, New Delhi", "Delhi", None, "active", ["Civil"]),
    ("old_paint", "Rainbow Paints", "Rainbow Paints & Hardware", "Owner", "Material", "Paint", "+91 98100 99876", "Tilak Nagar, New Delhi", "Delhi", "07AHMPR5567D1Z0", "inactive", ["Paint"]),
    ("fast_fab", "FastFab Metal Works", "FastFab Metal Works", "Owner", "Contractor", "Metal", "+91 98106 11290", "Mundka Industrial Area, Delhi", "Delhi", "07BFTPF2231E1Z8", "blacklisted", ["Glass & Aluminium"]),
]
EXISTING_VENDORS = {"sharma_elec": "099aa424-8dae-4611-90f8-87b3e776bdf4", "deepak_stone": "0d764704-6ead-4e43-bc16-593677a0fea4",
                    "kalpana": "1a21efe3-e0af-44ca-b9ac-e0cf3e9633ee"}
VID = {v[0]: EXISTING_VENDORS.get(v[0], U("vendor:" + v[0])) for v in VENDORS}
VBY = {v[0]: v for v in VENDORS}
MATERIAL_VENDOR = {"Civil": ["gupta_cement", "steel_hub"], "Electrical": ["polycab_dist", "sharma_elec"], "Plumbing": ["rocklime", "aqua_plumb"],
                   "Flooring": ["chhabra_marble", "tile_mart", "rocklime"], "Carpentry": ["century_ply", "hettich_hw"], "False Ceiling": ["gyproc_fc"],
                   "Paint": ["asian_paints", "old_paint"], "HVAC": ["cool_air"], "Glass & Aluminium": ["glass_tech"]}
PROC_PROJECTS = ["kapoor", "malhotra", "cmstore", "bhatia", "oberoi", "rocklime", "singhania", "tandon"]


def build(o: Out):
    uid = unit_ids()
    # ---------- vendor categories / business types ----------
    o.ins("vendor_categories", [dict(id=U("vcat:" + c), name=c, status=1, created_at=dt(-200), updated_at=dt(-200)) for c in ("Material", "Contractor")])
    btypes = sorted({(v[4], v[5]) for v in VENDORS})
    o.ins("vendor_business_types", [dict(id=U(f"vbt:{c}:{b}"), category_id=U("vcat:" + c), name=b, status=1, created_at=dt(-200), updated_at=dt(-200)) for c, b in btypes])
    vrows = []
    for i, v in enumerate(VENDORS):
        k, name, comp, desig, cat, bt, phone, addr, state, gst, status, cats = v
        notes = (f"GSTIN: {gst} | PAN: {gst[2:12]}" if gst else "Unregistered (labour contractor)") + f" | Supplies: {', '.join(cats)}"
        if status == "blacklisted":
            notes += " | Blacklisted: repeated delays and poor weld quality on Tandon railing (Mar)."
        if k in EXISTING_VENDORS:
            o.sql(f"UPDATE vendors SET company_name=COALESCE(company_name,{lit(comp)}), designation=COALESCE(designation,{lit(desig)}), "
                  f"vendor_category_id=COALESCE(vendor_category_id,{lit(U('vcat:' + cat))}), business_type_id=COALESCE(business_type_id,{lit(U(f'vbt:{cat}:{bt}'))}), "
                  f"address=COALESCE(address,{lit(addr)}), state=COALESCE(state,{lit(state)}), country=COALESCE(country,'India'), notes=COALESCE(notes,{lit(notes)}) "
                  f"WHERE id={lit(VID[k])}")
            continue
        vrows.append(dict(id=VID[k], name=name, company_name=comp, position=desig, designation=desig, vendor_category_id=U("vcat:" + cat),
                          business_type_id=U(f"vbt:{cat}:{bt}"), contact_number=phone, alternate_contact=None, address=addr, state=state,
                          country="India", notes=notes, status=status, created_by=UID["pooja"], updated_by=UID["pooja"],
                          created_at=dt(-220 + i * 6), updated_at=dt(-10 - i)))
    o.ins("vendors", vrows)

    # ---------- material master + vendor price list ----------
    o.ins("material_masters", [dict(id=MID[c], material_code=c, name=n, category=cat, sub_category=sub, brand=br, unit_id=uid[un], model=spec,
                                    specification=spec, hsn_code=hsn, description=f"{n} ({br or 'generic'})", is_active=1, created_by=UID["pooja"],
                                    updated_by=UID["pooja"], created_at=dt(-200), updated_at=dt(-30)) for c, n, cat, sub, br, un, spec, hsn, rate in MATERIALS])
    mv = []
    for c, n, cat, sub, br, un, spec, hsn, rate in MATERIALS:
        for j, vk in enumerate(MATERIAL_VENDOR[cat][:2]):
            mv.append(dict(id=U(f"mv:{c}:{vk}"), material_id=MID[c], vendor_id=VID[vk], vendor_material_code=f"{vk[:3].upper()}-{c}",
                           price=round(rate * (1 + 0.04 * j), 2), discount_percent=[5, 3, 8][j % 3], lead_time_days=[3, 7, 14][(len(c) + j) % 3],
                           is_preferred=int(j == 0), is_active=1, created_by=UID["rohit"], updated_by=UID["rohit"], created_at=dt(-150), updated_at=dt(-20)))
    o.ins("material_vendors", mv)

    # ---------- material requirements -> sample boards -> rate sheets -> estimates -> material quotations ----------
    reqs = [("kapoor", "FLR-001", "Italian marble for living & dining", "Statuario, book-matched in living; Botticino in dining", "Luxe", "COMPLETED", -120),
            ("kapoor", "PLB-004", "Wall-hung WCs for 6 bathrooms", "Rimless wall-hung WC with concealed cistern", "Contemporary", "COMPLETED", -110),
            ("kapoor", "FLR-005", "Engineered oak flooring - bedrooms", "3-strip oak, matt lacquer", "Warm", "IN_PROGRESS", -30),
            ("malhotra", "FLR-002", "Botticino marble for staircase", "18 mm with nosing profile", "Classic", "READY", -15),
            ("malhotra", "GLS-002", "Slim aluminium windows", "Schuco slim profile with DGU", "Contemporary", "IN_PROGRESS", -25),
            ("cmstore", "FLR-003", "Black Galaxy granite for display plinths", "20 mm polished, bull-nose edges", "Luxe", "COMPLETED", -90),
            ("cmstore", "ELE-005", "Gallery lighting - COB downlights", "3000K, 24 deg, CRI 95", "Minimal", "COMPLETED", -80),
            ("bhatia", "FLR-001", "Statuario for double-height lobby", "Book-matched wall cladding + floor", "Luxe", "IN_PROGRESS", -40),
            ("bhatia", "HVAC-001", "VRV system for 4 floors", "Daikin VRV with cassette units", None, "READY", -12),
            ("bhatia", "CRP-005", "Walnut veneer - home theatre panelling", "American walnut, matt PU", "Warm", "DRAFT", -3),
            ("oberoi", "PLB-003", "Concealed diverters - 4 baths", "Grohe SmartControl", "Contemporary", "COMPLETED", -95),
            ("oberoi", "CRP-004", "Kitchen shutters laminate", "Suede-finish laminate in sage", "Mid-century", "COMPLETED", -85),
            ("rocklime", "FLR-004", "Large-format tiles for display walls", "800x1600 matt", "Minimal", "COMPLETED", -140),
            ("singhania", "FLR-001", "Statuario for living room", "Book-matched, 18 mm", "Luxe", "READY", -10),
            ("singhania", "ELE-006", "Cove lighting profiles", "Recessed aluminium profile 2 m", "Minimal", "IN_PROGRESS", -8),
            ("sagar", "FLR-005", "Oak flooring options", "Compare Pergo vs Quick-Step", "Minimal", "DRAFT", -5),
            ("aurum", "CEL-001", "Acoustic ceiling - open office", "Gypsum with acoustic tiles", "Industrial", "READY", -18),
            ("courtyard", "FLR-002", "Botticino for guest rooms", "Sample approval pending", "Indian contemporary", "DRAFT", -2)]
    mr, sb, rs, est, mq = [], [], [], [], []
    for i, (pk, mc, item, sel, style, st, off) in enumerate(reqs):
        rid = U(f"mreq:{pk}:{mc}")
        m = MBY[mc]
        mr.append(dict(id=rid, projectId=PID[pk], designerId=UID[PM[pk][0]], itemName=item, materialMasterId=MID[mc], category=m[2], selection=sel,
                       style=style, functionalNeeds="Durable, low maintenance, stain resistant" if m[2] == "Flooring" else "As per design intent",
                       requirementDate=d(off + 21), status=st, createdAt=dt(off), updatedAt=dt(off + 5)))
        if st == "DRAFT":
            continue
        appr = "APPROVED" if st in ("COMPLETED", "IN_PROGRESS") else ("PENDING" if i % 3 else "REJECTED")
        sb.append(dict(id=U(f"sb:{pk}:{mc}"), materialRequirementId=rid, title=f"{m[1]} - sample board", imageUrls=[f"/uploads/demo/samples/{mc.lower()}-1.jpg", f"/uploads/demo/samples/{mc.lower()}-2.jpg"],
                       vendorName=VBY[MATERIAL_VENDOR[m[2]][0]][1], notes="Client viewed samples at studio", approvalStatus=appr,
                       approvedBy=UNAME[PM[pk][0]] if appr != "PENDING" else None, approvedAt=dt(off + 4) if appr != "PENDING" else None, createdAt=dt(off + 2)))
        for j, vk in enumerate(MATERIAL_VENDOR[m[2]][:2]):
            rs.append(dict(id=U(f"rs:{pk}:{mc}:{vk}"), material_requirement_id=rid, vendor_name=VBY[vk][1], unit=m[5], unit_rate=round(m[8] * (1 + 0.05 * j), 2),
                           currency="INR", valid_till=d(off + 60), approval_status="approved" if (j == 0 and st != "READY") else ("pending" if st == "READY" else "rejected"),
                           approved_by=UNAME["pooja"] if (j == 0 and st != "READY") else None, approved_at=dt(off + 6) if (j == 0 and st != "READY") else None, created_at=dt(off + 5)))
        if st in ("COMPLETED", "IN_PROGRESS"):
            qty = {"SQFT": 1800, "SET": 6, "NOS": 40, "RMT": 400}.get(m[5], 100)
            eid = U(f"mest:{pk}:{mc}")
            est.append(dict(id=eid, material_requirement_id=rid, rate_sheet_id=U(f"rs:{pk}:{mc}:{MATERIAL_VENDOR[m[2]][0]}"), quantity=qty, unit=m[5], unit_rate=m[8],
                            total_amount=round(qty * m[8], 2), approval_status="approved" if st == "COMPLETED" else "pending",
                            approved_by=UNAME["ritika"] if st == "COMPLETED" else None, approved_at=dt(off + 8) if st == "COMPLETED" else None,
                            converted_to_quotation=int(st == "COMPLETED"), created_at=dt(off + 7)))
            if st == "COMPLETED":
                mq.append(dict(id=U(f"mq:{pk}:{mc}"), estimate_id=eid, quotation_number=f"RA/MQ/{2026}/{100 + i}", quotation_date=d(off + 9),
                               total_amount=round(qty * m[8] * 1.18, 2), terms="Prices inclusive of GST @18%. Delivery within 10 days of PO.",
                               status="accepted" if i % 2 == 0 else "sent", accepted_at=dt(off + 12) if i % 2 == 0 else None, created_at=dt(off + 9)))
    o.ins("material_requirements", mr)
    o.ins("sample_boards", sb)
    o.ins("material_rate_sheets", rs)
    o.ins("material_estimates", est)
    o.ins("material_quotations", mq)

    build_quotations(o, uid)
    build_pos(o, uid)
    build_wos(o, uid)


def proj_snapshot(pk):
    p = PBYKEY[pk]
    return {"id": PID[pk], "name": p[1], "site_location": p[4], "client_id": CID[p[2]], "status": p[6], "priority": p[7]}


def vendor_snapshot(vk):
    v = VBY[vk]
    return {"id": VID[vk], "name": v[1], "company_name": v[2], "contact_number": v[6], "address": v[7], "state": v[8], "status": v[10]}


# project, vendor, work category, [(particular, unit, qty, rate)], status, days-ago
QUOTES = [
    ("kapoor", "bharat_civil", "Civil", [("Brick masonry 230 mm in CM 1:6", "CUM", 85, 7800), ("Internal plaster 12 mm", "SQFT", 14000, 38), ("Pool shell RCC M30", "CUM", 42, 11500)], "approved", 200),
    ("kapoor", "sanjay_labour", "Civil", [("Brick masonry 230 mm (labour)", "CUM", 85, 2400), ("Internal plaster 12 mm (labour)", "SQFT", 14000, 14)], "declined", 205),
    ("kapoor", "sharma_elec", "Electrical", [("Point wiring - light/fan", "PT", 420, 1150), ("Power points 16A", "PT", 120, 1650), ("DB installation & testing", "NOS", 8, 4500)], "approved", 150),
    ("kapoor", "kalpana", "Carpentry", [("Wardrobes in BWP ply + veneer", "SQFT", 1200, 2650), ("Kitchen base & wall units", "RFT", 42, 14500), ("Wall panelling - fluted", "SQFT", 650, 1450)], "submitted", 20),
    ("malhotra", "bharat_civil", "Civil", [("RCC M25 slabs and beams", "CUM", 180, 9800), ("Brick masonry 230 mm", "CUM", 140, 7600), ("Waterproofing - terrace", "SQFT", 3200, 95)], "approved", 120),
    ("malhotra", "aqua_plumb", "Plumbing", [("CPVC internal plumbing per bathroom", "SET", 7, 38000), ("SWR drainage lines", "RMT", 260, 420)], "submitted", 12),
    ("malhotra", "cool_air", "HVAC", [("VRV system 36 HP supply & install", "LS", 1, 2850000)], "returned_for_editing", 18),
    ("cmstore", "deepak_stone", "Flooring", [("Marble laying with polishing", "SQFT", 4800, 145), ("Granite plinth fabrication", "RFT", 180, 950)], "approved", 110),
    ("cmstore", "gyproc_fc", "False Ceiling", [("Gypsum false ceiling with cove", "SQFT", 5200, 115), ("Metal baffle ceiling - gallery", "SQFT", 900, 420)], "approved", 95),
    ("bhatia", "bharat_civil", "Civil", [("Excavation incl. basement", "CUM", 1400, 450), ("RCC M30 frame", "CUM", 620, 10200), ("Brick masonry", "CUM", 310, 7700)], "approved", 280),
    ("bhatia", "cool_air", "HVAC", [("VRV 48 HP system", "LS", 1, 3950000), ("Fresh air units", "NOS", 4, 185000)], "submitted", 9),
    ("bhatia", "glass_tech", "Glass & Aluminium", [("Slim sliding windows DGU", "SQFT", 2600, 1650), ("Frameless glass railing", "RFT", 140, 5200)], "draft", 3),
    ("oberoi", "kalpana", "Carpentry", [("Modular kitchen", "RFT", 28, 16500), ("Wardrobes - lacquered glass", "SQFT", 780, 2900), ("TV unit & bar", "LS", 1, 385000)], "approved", 150),
    ("oberoi", "asian_paints", "Painting", [("Royale luxury emulsion 2 coats", "SQFT", 16000, 28), ("PU polish on veneer", "SQFT", 900, 210)], "approved", 60),
    ("singhania", "gyproc_fc", "False Ceiling", [("Gypsum ceiling with cove", "SQFT", 5200, 118)], "submitted", 7),
    ("singhania", "sharma_elec", "Electrical", [("Point wiring", "PT", 260, 1200), ("Home automation wiring", "LS", 1, 420000)], "approved", 45),
    ("aurum", "gyproc_fc", "False Ceiling", [("Acoustic grid ceiling", "SQFT", 11000, 135), ("Gypsum bulkheads", "RFT", 900, 320)], "submitted", 6),
    ("aurum", "bharat_civil", "Civil", [("Partition walls - drywall", "SQFT", 6200, 145)], "draft", 2),
    ("rocklime", "kalpana", "Carpentry", [("Display units - HDHMR", "SQFT", 1400, 1850), ("Reception desk - solid surface", "LS", 1, 265000)], "approved", 170),
    ("tandon", "asian_paints", "Painting", [("Full house repaint", "SQFT", 18000, 26)], "approved", 380),
]


def build_quotations(o, uid):
    qs, items, vers, comps = [], [], [], {}
    for i, (pk, vk, wc, lines, st, ago) in enumerate(QUOTES):
        qid = U(f"quote:{pk}:{vk}:{wc}")
        sub = sum(qty * rate for _, _, qty, rate in lines)
        disc = round(sub * (0.03 if i % 3 == 0 else 0), 2)
        tax = round((sub - disc) * 0.18, 2)
        total = round(sub - disc + tax, 2)
        created = dt(-ago, 11)
        qs.append(dict(id=qid, quotation_number=f"RA/Q/2026/{1001 + i}", current_version=2 if st in ("approved", "returned_for_editing") and i % 2 == 0 else 1,
                       quotation_date=d(-ago), expiry_date=d(-ago + 30), validity_days=30, comparison_notes=None,
                       selected_at=dt(-ago + 5) if st == "approved" else None, selected_by=UID["pooja"] if st == "approved" else None, is_selected=int(st == "approved"),
                       boq_reference=f"BOQ-{PNAME[pk][:3].upper()}-{wc[:3].upper()}", status=st, project_id=PID[pk], vendor_id=VID[vk], material_requirement_id=None,
                       project_snapshot=proj_snapshot(pk), vendor_snapshot=vendor_snapshot(vk), subtotal=sub, additional_charges=0, global_discount_type="fixed",
                       global_discount_value=disc, discount=disc, tax_percent=18, tax_amount=tax, total_amount=total,
                       terms_conditions="50% advance, balance on completion. Rates valid 30 days. GST extra @18%.",
                       submitted_at=dt(-ago + 1) if st != "draft" else None, submitted_by=UID["rohit"] if st != "draft" else None,
                       reviewed_at=dt(-ago + 4) if st in ("approved", "declined", "returned_for_editing") else None,
                       reviewed_by=UID["pooja"] if st in ("approved", "declined", "returned_for_editing") else None,
                       review_remarks={"approved": "Rates in line with market; approved.", "declined": "L2 - higher than selected vendor.",
                                       "returned_for_editing": "Please split indoor/outdoor units and add warranty terms."}.get(st),
                       deleted_at=None, deleted_by=None, created_by=UID["rohit"], updated_by=UID["pooja"], created_at=created, updated_at=dt(-ago + 4)))
        for j, (part, un, qty, rate) in enumerate(lines):
            items.append(dict(id=U(f"qitem:{qid}:{j}"), quotation_id=qid, sno=j + 1, particular=part, unit_id=uid[un], rate=rate, quantity=qty,
                              amount=round(qty * rate, 2), remarks=None))
        snap = {"quotationNumber": f"RA/Q/2026/{1001 + i}", "subtotal": sub, "taxPercent": 18, "totalAmount": total,
                "items": [{"sno": j + 1, "particular": part, "quantity": qty, "rate": rate, "amount": qty * rate} for j, (part, un, qty, rate) in enumerate(lines)]}
        vers.append(dict(id=U(f"qver:{qid}:1"), quotation_id=qid, version=1, snapshot=snap, remarks="Initial submission", created_by=UID["rohit"], created_at=created))
        if st in ("approved", "returned_for_editing") and i % 2 == 0:
            vers.append(dict(id=U(f"qver:{qid}:2"), quotation_id=qid, version=2, snapshot=snap, remarks="Revised after negotiation", created_by=UID["rohit"], created_at=created + timedelta(days=3)))
        comps.setdefault((pk, wc), []).append(qid)
    o.ins("quotations", qs)
    o.ins("quotation_items", items)
    o.ins("quotation_versions", vers)
    o.ins("quotation_comparisons", [dict(id=U(f"qcmp:{pk}:{wc}"), name=f"{PNAME[pk]} - {wc} comparison", projectId=PID[pk], workCategory=wc, quotationIds=ids,
                                         comparedAt=dt(-30), createdAt=dt(-30), updatedAt=dt(-30)) for (pk, wc), ids in comps.items() if len(ids) > 1] +
          [dict(id=U("qcmp:kapoor:all"), name="Kapoor Farmhouse - trade packages", projectId=PID["kapoor"], workCategory=None,
                quotationIds=comps[("kapoor", "Civil")] + comps[("kapoor", "Electrical")], comparedAt=dt(-140), createdAt=dt(-140), updatedAt=dt(-140))])
    o.sql("UPDATE projects p SET quotation_count=(SELECT COUNT(*) FROM quotations q WHERE q.project_id=p.id AND q.deleted_at IS NULL)")


# project, vendor, [(material, qty)], status, days-ago
POS = [
    ("kapoor", "gupta_cement", [("CIV-001", 600), ("CIV-005", 4000), ("CIV-006", 3000)], "CLOSED", 190),
    ("kapoor", "steel_hub", [("CIV-003", 8500), ("CIV-004", 6000)], "RECEIVED", 180),
    ("kapoor", "chhabra_marble", [("FLR-001", 2200), ("FLR-002", 1400)], "RECEIVED", 60),
    ("kapoor", "rocklime", [("PLB-004", 6), ("PLB-005", 8), ("PLB-006", 6)], "PARTIALLY_RECEIVED", 25),
    ("kapoor", "century_ply", [("CRP-001", 3200), ("CRP-002", 1800)], "SENT", 6),
    ("malhotra", "steel_hub", [("CIV-003", 12000), ("CIV-004", 9000)], "RECEIVED", 110),
    ("malhotra", "gupta_cement", [("CIV-001", 900), ("CIV-007", 5200)], "PARTIALLY_RECEIVED", 40),
    ("malhotra", "polycab_dist", [("ELE-001", 4500), ("ELE-002", 1500), ("ELE-007", 2200)], "APPROVED", 5),
    ("cmstore", "chhabra_marble", [("FLR-003", 900), ("FLR-001", 1200)], "RECEIVED", 100),
    ("cmstore", "polycab_dist", [("ELE-005", 140), ("ELE-006", 60)], "RECEIVED", 75),
    ("bhatia", "steel_hub", [("CIV-003", 22000), ("CIV-004", 18000)], "RECEIVED", 260),
    ("bhatia", "gupta_cement", [("CIV-001", 1800), ("CIV-005", 9000), ("CIV-008", 60000)], "PARTIALLY_RECEIVED", 90),
    ("bhatia", "rocklime", [("PLB-004", 9), ("PLB-005", 11)], "PENDING_APPROVAL", 2),
    ("oberoi", "hettich_hw", [("CRP-006", 380), ("CRP-007", 46)], "RECEIVED", 120),
    ("oberoi", "rocklime", [("PLB-003", 4), ("PLB-006", 4), ("PLB-005", 5)], "RECEIVED", 100),
    ("rocklime", "tile_mart", [("FLR-004", 3200), ("FLR-006", 800)], "CLOSED", 160),
    ("singhania", "chhabra_marble", [("FLR-001", 1600)], "DRAFT", 1),
    ("tandon", "old_paint", [("PNT-001", 380), ("PNT-002", 60)], "CLOSED", 360),
    ("oberoi", "polycab_dist", [("ELE-003", 220)], "CANCELLED", 130),
]


def build_pos(o, uid):
    pos, items, dcs, dcitems, inv = [], [], [], [], []
    for i, (pk, vk, lines, st, ago) in enumerate(POS):
        poid = U(f"po:{i}")
        v = VBY[vk]
        sub = sum(q_ * MBY[m][8] for m, q_ in lines)
        disc = round(sub * 0.02, 2) if sub > 500000 else 0
        gst = round((sub - disc) * 0.18, 2)
        cart = 3500 if MBY[lines[0][0]][2] == "Civil" else 0
        recv_frac = {"RECEIVED": 1, "CLOSED": 1, "PARTIALLY_RECEIVED": 0.6}.get(st, 0)
        pos.append(dict(id=poid, po_number=f"RA/PO/26-27/{101 + i:04d}", project_id=PID[pk], site_id=None, vendor_id=VID[vk], po_date=d(-ago),
                        target_delivery_date=d(-ago + 10), agency_name=v[2], contact_person=v[1], phone=v[6], email=None, vendor_gstin=v[9],
                        vendor_pan=v[9][2:12] if v[9] else None, ship_to_address=site_addr(pk), subtotal=sub, discount=disc, gst_percent=18, gst_amount=gst,
                        cartage=cart, total_amount=round(sub - disc + gst + cart, 2), status=st, source_type=["QUOTATION", "ESTIMATE", "BOQ", "MANUAL"][i % 4],
                        source_reference_id=None, notes="Deliver between 9 am and 11 am. Call site engineer before dispatch.",
                        terms_and_conditions="30% advance, balance within 15 days of delivery. Material subject to site inspection.",
                        created_by=UID["rohit"], approved_by=UID["pooja"] if st not in ("DRAFT", "PENDING_APPROVAL") else None,
                        approved_at=dt(-ago + 1) if st not in ("DRAFT", "PENDING_APPROVAL") else None, quotation_id=None,
                        created_at=dt(-ago, 12), updated_at=dt(-max(ago - 12, 0), 15)))
        poitems = []
        for j, (m, qty) in enumerate(lines):
            mm = MBY[m]
            rq = round(qty * recv_frac, 3)
            it = dict(id=U(f"poi:{i}:{j}"), purchase_order_id=poid, material_id=MID[m], line_number=j + 1, description=mm[1], specification=mm[6], brand=mm[4],
                      unit=mm[5], ordered_quantity=qty, rate=mm[8], amount=round(qty * mm[8], 2), received_quantity=rq, pending_quantity=round(qty - rq, 3),
                      remarks=None, source_reference_id=None, created_at=dt(-ago, 12), updated_at=dt(-ago, 12))
            items.append(it)
            poitems.append(it)
        if recv_frac:
            ndc = 2 if st == "PARTIALLY_RECEIVED" or len(lines) > 2 else 1
            for c in range(ndc):
                dcid = U(f"dc:{i}:{c}")
                ddate = -ago + 7 + c * 6
                dstatus = "PARTIALLY_ACCEPTED" if (i + c) % 5 == 0 else "RECEIVED"
                dcs.append(dict(id=dcid, challan_number=f"RA/DC/26-27/{201 + i * 2 + c:04d}", project_id=PID[pk], site_id=None, purchase_order_id=poid, vendor_id=VID[vk],
                                material_requirement_id=None, challan_date=d(ddate), site_address=site_addr(pk), status=dstatus, gate_pass_received=1, material_checked=1,
                                general_remarks="Material unloaded at site store", discrepancy_notes="2 boxes damaged in transit" if dstatus == "PARTIALLY_ACCEPTED" else None,
                                dispatched_by=None, dispatched_at=dt(ddate, 8), received_by=UID[PM[pk][1] or "sandeep"], received_at=dt(ddate, 11),
                                attachment_url=f"/uploads/demo/dc/{i}-{c}.pdf", created_by=UID[PM[pk][1] or "sandeep"], createdAt=dt(ddate, 11), updatedAt=dt(ddate, 12)))
                for j, it in enumerate(poitems):
                    share = float(it["received_quantity"]) / ndc
                    dmg = round(share * 0.02, 3) if dstatus == "PARTIALLY_ACCEPTED" else 0
                    dcitems.append(dict(id=U(f"dci:{i}:{c}:{j}"), delivery_challan_id=dcid, purchase_order_item_id=it["id"], material_id=it["material_id"],
                                        line_number=j + 1, description=it["description"], brand=it["brand"], specification=it["specification"], quantity=round(share, 3),
                                        accepted_quantity=round(share - dmg, 3), shortage_quantity=0, damaged_quantity=dmg, rejected_quantity=0,
                                        condition_status="DAMAGED" if dmg else "GOOD", condition_notes="Edge chipping" if dmg else None,
                                        stored_at="Site store - ground floor", remarks=None, createdAt=dt(ddate, 11), updatedAt=dt(ddate, 11)))
                    inv.append(dict(id=U(f"inv:rcpt:{i}:{c}:{j}"), project_id=PID[pk], site_id=None, material_id=it["material_id"], transaction_date=d(ddate),
                                    transaction_type="RECEIPT", quantity=round(share - dmg, 3), unit=it["unit"], direction="IN", reference_type="DELIVERY_CHALLAN",
                                    reference_id=dcid, reference_item_id=U(f"dci:{i}:{c}:{j}"), vendor_id=VID[vk], contractor_id=None, trade=None, work_reference=None,
                                    storage_location="Site store", condition_status="GOOD", condition_notes=None, issued_to=None, issued_by=None,
                                    received_by=UID[PM[pk][1] or "sandeep"], remarks=None, created_by=UID[PM[pk][1] or "sandeep"], created_at=dt(ddate, 12),
                                    updated_at=dt(ddate, 12), unit_id=None, reversal_of_id=None, reversal_reason=None))
                    # issues to contractors over following weeks
                    for n in range(2):
                        iq = round((share - dmg) * (0.35 if n == 0 else 0.25), 3)
                        idate = ddate + 5 + n * 9
                        if idate > 0:
                            continue
                        trade = {"Civil": "Civil", "Flooring": "Flooring", "Plumbing": "Plumbing", "Electrical": "Electrical", "Carpentry": "Carpentry"}.get(MBY[lines[j][0]][2], "General")
                        inv.append(dict(id=U(f"inv:iss:{i}:{c}:{j}:{n}"), project_id=PID[pk], site_id=None, material_id=it["material_id"], transaction_date=d(idate),
                                        transaction_type="ISSUE", quantity=iq, unit=it["unit"], direction="OUT", reference_type="ISSUE", reference_id=None,
                                        reference_item_id=None, vendor_id=None, contractor_id=None, trade=trade, work_reference=f"{trade} work - {['Ground', 'First'][n]} floor",
                                        storage_location="Site store", condition_status="NOT_APPLICABLE", condition_notes=None,
                                        issued_to=["Bharat Builders", "Sharma Electricals", "Kalpana Joinery", "Deepak Stone Works"][(i + j) % 4],
                                        issued_by=UID[PM[pk][1] or "sandeep"], received_by=None, remarks=None, created_by=UID[PM[pk][1] or "sandeep"],
                                        created_at=dt(idate, 10), updated_at=dt(idate, 10), unit_id=None, reversal_of_id=None, reversal_reason=None))
    # a return to vendor and a stock adjustment for realism
    inv.append(dict(id=U("inv:rtv:1"), project_id=PID["kapoor"], site_id=None, material_id=MID["FLR-001"], transaction_date=d(-50), transaction_type="RETURN_TO_VENDOR",
                    quantity=24, unit="SQFT", direction="OUT", reference_type="RETURN", reference_id=None, reference_item_id=None, vendor_id=VID["chhabra_marble"],
                    contractor_id=None, trade="Flooring", work_reference=None, storage_location="Site store", condition_status="DAMAGED",
                    condition_notes="Hairline cracks in 2 slabs", issued_to=None, issued_by=UID["sandeep"], received_by=None, remarks="Replacement promised in 7 days",
                    created_by=UID["sandeep"], created_at=dt(-50, 15), updated_at=dt(-50, 15), unit_id=None, reversal_of_id=None, reversal_reason=None))
    inv.append(dict(id=U("inv:adj:1"), project_id=PID["bhatia"], site_id=None, material_id=MID["CIV-001"], transaction_date=d(-14), transaction_type="ADJUSTMENT_OUT",
                    quantity=12, unit="BAG", direction="OUT", reference_type="ADJUSTMENT", reference_id=None, reference_item_id=None, vendor_id=None,
                    contractor_id=None, trade=None, work_reference=None, storage_location="Site store", condition_status="DAMAGED",
                    condition_notes="Bags set due to rain seepage", issued_to=None, issued_by=UID["manoj"], received_by=None, remarks="Monthly stock audit",
                    created_by=UID["manoj"], created_at=dt(-14, 17), updated_at=dt(-14, 17), unit_id=None, reversal_of_id=None, reversal_reason=None))
    o.ins("purchase_orders", pos)
    o.ins("purchase_order_items", items)
    o.ins("delivery_challans", dcs)
    o.ins("delivery_challan_items", dcitems)
    o.ins("inventory_transactions", inv)


# project, vendor, scope title, [(description, unit, qty, rate)], status, days-ago, duration
WOS = [
    ("kapoor", "bharat_civil", "Civil works - main house & pool", [("Brick masonry 230 mm", "CUM", 85, 7800), ("Plaster 12 mm", "SQFT", 14000, 38), ("Pool shell RCC", "CUM", 42, 11500)], "IN_PROGRESS", 190, 150),
    ("kapoor", "sharma_elec", "Electrical wiring & DB", [("Point wiring", "PT", 420, 1150), ("Power points", "PT", 120, 1650)], "IN_PROGRESS", 140, 90),
    ("kapoor", "deepak_stone", "Marble laying & polishing", [("Marble laying", "SQFT", 3600, 145), ("Diamond polishing", "SQFT", 3600, 38)], "ISSUED", 20, 45),
    ("malhotra", "bharat_civil", "RCC frame & masonry", [("RCC M25", "CUM", 180, 9800), ("Brick masonry", "CUM", 140, 7600)], "IN_PROGRESS", 115, 180),
    ("cmstore", "gyproc_fc", "False ceiling", [("Gypsum ceiling with cove", "SQFT", 5200, 115), ("Baffle ceiling", "SQFT", 900, 420)], "COMPLETED", 90, 30),
    ("cmstore", "deepak_stone", "Stone flooring & plinths", [("Marble laying", "SQFT", 4800, 145), ("Granite plinths", "RFT", 180, 950)], "IN_PROGRESS", 80, 50),
    ("bhatia", "bharat_civil", "Structure - basement to terrace", [("Excavation", "CUM", 1400, 450), ("RCC M30", "CUM", 620, 10200)], "IN_PROGRESS", 270, 300),
    ("bhatia", "aqua_plumb", "Plumbing rough-in", [("CPVC plumbing per bath", "SET", 9, 38000)], "ACKNOWLEDGED", 10, 40),
    ("oberoi", "kalpana", "Modular kitchen & wardrobes", [("Modular kitchen", "RFT", 28, 16500), ("Wardrobes", "SQFT", 780, 2900)], "COMPLETED", 140, 70),
    ("oberoi", "asian_paints", "Painting & polish", [("Emulsion 2 coats", "SQFT", 16000, 28), ("PU polish", "SQFT", 900, 210)], "IN_PROGRESS", 55, 35),
    ("rocklime", "kalpana", "Display joinery", [("Display units", "SQFT", 1400, 1850), ("Reception desk", "LS", 1, 265000)], "CLOSED", 165, 60),
    ("singhania", "sharma_elec", "Electrical & automation", [("Point wiring", "PT", 260, 1200), ("Automation wiring", "LS", 1, 420000)], "APPROVED", 40, 60),
    ("singhania", "gyproc_fc", "False ceiling", [("Gypsum ceiling", "SQFT", 5200, 118)], "PENDING_APPROVAL", 4, 30),
    ("tandon", "asian_paints", "Repainting", [("Full house repaint", "SQFT", 18000, 26)], "CLOSED", 370, 40),
    ("aurum", "gyproc_fc", "Acoustic ceiling (tender)", [("Acoustic grid ceiling", "SQFT", 11000, 135)], "DRAFT", 3, 45),
]


def build_wos(o, uid):
    wos, items, stages, terms = [], [], [], []
    for i, (pk, vk, title, lines, st, ago, dur) in enumerate(WOS):
        wid = U(f"wo:{i}")
        v = VBY[vk]
        sub = sum(q_ * r for _, _, q_, r in lines)
        gst = round(sub * 0.18, 2)
        total = round(sub + gst, 2)
        eng = PM[pk][1] or "sandeep"
        signed = st not in ("DRAFT", "PENDING_APPROVAL", "APPROVED")
        wos.append(dict(id=wid, wo_id=f"RA/WO/26-27/{51 + i:04d}", work_order_date=d(-ago), target_completion_date=d(-ago + dur), status=st, project_id=PID[pk],
                        vendor_id=VID[vk], contractor_name=v[1], contractor_company_name=v[2], contractor_position=v[3], contractor_phone=v[6], contractor_email=None,
                        contractor_address=v[7], contractor_gstin=v[9], contractor_pan=v[9][2:12] if v[9] else None, agency=title, project_name=PNAME[pk],
                        site_address=site_addr(pk), site_contact_person=UNAME[eng], site_lead=UNAME[PM[pk][0]], site_phone=next(u[3] for u in USERS if u[0] == eng),
                        site_email=next(u[2] for u in USERS if u[0] == eng), site_gstin="07AAVFR4821K1Z6", working_hours="9:30 am - 6:30 pm (Mon-Sat)",
                        subtotal=sub, discount=0, gst_percentage=18, gst_amount=gst, cartage=0, total_amount=total,
                        payment_terms="20% mobilisation advance, 60% against running bills, 10% on completion, 10% retention for 3 months",
                        contractor_signatory_name=v[1] if signed else None, rippotai_signatory_name="Ajay Chhabra" if signed else None,
                        contractor_signed_at=dt(-ago + 2) if signed else None, rippotai_signed_at=dt(-ago + 1) if signed else None,
                        contractor_signature_url=None, rippotai_signature_url=None, created_by=UID["pooja"], updated_by=UID["pooja"],
                        created_at=dt(-ago, 11), updated_at=dt(-max(ago - 20, 0), 16)))
        for j, (desc, un, qty, rate) in enumerate(lines):
            items.append(dict(id=U(f"woi:{i}:{j}"), work_order_id=wid, sort_order=j + 1, item_type="SERVICE", description=desc, quantity=qty, unit_id=uid[un],
                              rate=rate, amount=round(qty * rate, 2), remarks=None, created_at=dt(-ago, 11), updated_at=dt(-ago, 11)))
        plan = [("Mobilisation advance", 0.2, 0), ("Running bill 1", 0.3, 0.4), ("Running bill 2", 0.3, 0.8), ("Completion", 0.1, 1.0), ("Retention release", 0.1, 1.3)]
        for j, (name, pct, at) in enumerate(plan):
            due = -ago + int(dur * at)
            if st in ("COMPLETED", "CLOSED"):
                sst, paid = ("PAID", 1) if j < 4 or st == "CLOSED" else ("DUE", 0)
            elif st == "IN_PROGRESS":
                sst, paid = ("PAID", 1) if due < -20 else (("DUE", 0) if due <= 5 else ("PENDING", 0))
                if sst == "DUE" and j == 2:
                    sst, paid = "PARTIALLY_PAID", 0.5
            elif st in ("ISSUED", "ACKNOWLEDGED"):
                sst, paid = ("DUE", 0) if j == 0 else ("PENDING", 0)
            else:
                sst, paid = "PENDING", 0
            stages.append(dict(id=U(f"wops:{i}:{j}"), work_order_id=wid, sort_order=j + 1, stage_name=name, due_date=d(due), amount=round(total * pct, 2),
                               paid_amount=round(total * pct * paid, 2), status=sst, remarks=None, created_at=dt(-ago, 11), updated_at=dt(-ago, 11)))
        for j, t in enumerate(["Contractor to provide all tools, tackles and scaffolding.", "Work to comply with approved GFC drawings and site engineer instructions.",
                               "Debris to be cleared daily at contractor's cost.", "Labour welfare, PF/ESI compliance is the contractor's responsibility.",
                               "Delay beyond target date attracts LD @0.5% per week, max 5%."]):
            terms.append(dict(id=U(f"wot:{i}:{j}"), work_order_id=wid, terms_template_id=U("terms:global") if j == 0 else None, sort_order=j + 1, description=t,
                              is_mandatory=int(j < 3), created_at=dt(-ago, 11), updated_at=dt(-ago, 11)))
    o.ins("work_orders", wos)
    o.ins("work_order_items", items)
    o.ins("work_order_payment_stages", stages)
    o.ins("work_order_terms", terms)
