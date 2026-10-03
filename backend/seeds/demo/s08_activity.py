"""08 Activity feed: notifications and audit/activity logs across modules."""
from lib import *


def build(o: Out):
    ev = [  # days-ago, actor, action/notification type, entity type, project key, title, message
        (0, "manoj", "task_status_changed", "task", "malhotra", "RFI escalated", "Column clash in bedroom 2 marked URGENT by Manoj Rawat"),
        (0, "pooja", "purchase_order_created", "purchase_order", "bhatia", "PO awaiting approval", "RA/PO/26-27/0113 for Rocklime sanitaryware needs your approval"),
        (0, "vivek", "lead_created", "lead", None, "New lead: Meenakshi Rao", "Rao Dental Clinics, Saket - referred by Chhabra Marble"),
        (1, "sunita", "reminder", "payment", "kapoor", "Payment overdue", "Kapoor Farmhouse - finishing stage payment is 9 days overdue"),
        (1, "neha", "quotation_submitted", "quotation", "singhania", "Quotation submitted", "Skyline Ceilings quotation for Singhania Penthouse submitted for review"),
        (1, "arjun", "drawing_uploaded", "drawing", "malhotra", "GFC drawing uploaded", "Structure Layout R1 uploaded for Malhotra Residence"),
        (2, "vivek", "lead_stage_changed", "lead", None, "Deal moved to Negotiation", "Arora Foods Corporate Office moved to Negotiation"),
        (2, "sandeep", "site_recce_created", "site_recce", "arora", "Site recce recorded", "Recce completed for Arora Foods Corporate Office"),
        (3, "ritika", "quotation_approved", "quotation", "oberoi", "Quotation approved", "Colour Craft Painters quotation approved for Oberoi Apartment"),
        (3, "pooja", "vendor_created", "vendor", None, "Vendor added", "GlassTech Facades added to vendor master"),
        (4, "anjali", "project_updated", "project", "courtyard", "Project updated", "The Courtyard Boutique Hotel moved to Planning phase"),
        (5, "neha", "brief_updated", "brief", "sagar", "Brief updated", "Sagar Residence brief updated with terrace lounge requirements"),
        (6, "rohit", "purchase_order_approved", "purchase_order", "kapoor", "PO approved", "RA/PO/26-27/0105 (Century Ply) approved"),
        (7, "ritika", "calendar_event_created", "calendar_event", "gupta", "Presentation scheduled", "Concept presentation - Gupta Villa scheduled"),
        (8, "imran", "task_completed", "task", "oberoi", "Snag closed", "All carpentry snags closed at Oberoi Apartment"),
        (10, "vivek", "lead_proposal_sent", "lead", None, "Proposal sent", "Proposal sent to Rohan Bedi (The Bedi Group) for Rs 36 L"),
        (12, "ritika", "project_created", "project", "arora", "Project created", "Arora Foods Corporate Office created"),
        (14, "pooja", "quotation_declined", "quotation", "kapoor", "Quotation declined", "Sanjay Labour Contractor quotation declined (L2)"),
        (18, "arjun", "client_created", "client", None, "Client added", "Amit Choudhary added as client"),
        (25, "sandeep", "vendor_status_changed", "vendor", None, "Vendor blacklisted", "FastFab Metal Works blacklisted after Tandon railing issues"),
        (30, "ritika", "project_updated", "project", "tandon", "Project completed", "Tandon Residence handed over to client"),
        (45, "ritika", "project_created", "project", "gupta", "Project created", "Gupta Villa created from CRM deal"),
    ]
    notif_types = set(q("SHOW COLUMNS FROM notifications LIKE 'type'")[0][1][5:-1].replace("'", "").split(","))
    act_types = set(q("SHOW COLUMNS FROM activity_logs LIKE 'action'")[0][1][5:-1].replace("'", "").split(","))
    notes, logs = [], []
    for i, (ago, who, typ, et, pk, title, msg) in enumerate(ev):
        for rcpt in ["ajay", "ritika"] + ([PM[pk][0]] if pk and PM[pk][0] not in ("ritika",) else []):
            ntype = typ if typ in notif_types else "system"
            notes.append(dict(id=U(f"notif:{i}:{rcpt}"), user_id=UID[rcpt], type=ntype, title=title, message=msg, entity_type=et,
                              entity_id=PID[pk] if pk and et == "project" else None, is_read=int(ago > 2), read_at=dt(-ago + 1) if ago > 2 else None,
                              created_at=dt(-ago, 9 + i % 9, (i * 7) % 60)))
        a = typ if typ in act_types else None
        if a:
            u = next((x for x in USERS if x[0] == who), None)
            logs.append(dict(id=U(f"act:{i}"), user_id=UID[who], user_email=u[2] if u else "ajay@rocklime.com", user_role="USER" if u and u[6] != ROLE_ADMIN else "ADMIN",
                             action=a, entity_type=et.upper() if et == "project" else et, entity_id=PID[pk] if pk else None,
                             entity_label=PNAME[pk] if pk else title, changes={"summary": msg}, ip_address="10.0.0." + str(20 + i),
                             user_agent="Mozilla/5.0 (Macintosh) Chrome/128", created_at=dt(-ago, 9 + i % 9, (i * 7) % 60)))
    # logins over the last two weeks
    for j in range(40):
        k = USERS[j % len(USERS)]
        logs.append(dict(id=U(f"login:{j}"), user_id=UID[k[0]], user_email=k[2], user_role="ADMIN" if k[6] == ROLE_ADMIN else "USER", action="login",
                         entity_type=None, entity_id=None, entity_label=None, changes=None, ip_address="10.0.1." + str(j), user_agent="Mozilla/5.0 Chrome/128",
                         created_at=dt(-(j // 3), 9, j % 60)))
    o.ins("notifications", notes)
    o.ins("activity_logs", logs)
