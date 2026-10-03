"""05 Documents & drawings: per-project requirements, uploaded documents (+versions/attachments), drawing register (+revisions),
business proposals. Status follows each project's phase so the Command Center / gate engine show realistic progress."""
import re
from pathlib import Path
from lib import *

CATEGORY = {"BRIEF": "Project Brief", "RECCE": "Site Reki", "PRE": "Pitch", "PLAN": "Agreements", "DES": "3D Views", "TENDER": "Drawings",
            "WORK": "GFC Drawings", "MOD": "GFC Drawings", "EXEC": "Approvals", "HANDOVER": "Handover Documents", "VENDOR": "Quotations", "MAT": "Other"}
DISC = {"TENDER_ELECTRICAL_LAYOUT": "Electrical", "TENDER_PLUMBING_LAYOUT": "Plumbing", "TENDER_HVAC_LAYOUT": "HVAC", "WORK_STRUCTURE_LAYOUT": "Structural",
        "TENDER_LANDSCAPING": "Landscape", "WORK_LANDSCAPE_DETAILS": "Landscape", "TENDER_CIVIL_LAYOUT": "Civil", "WORK_CIVIL_DETAILS": "Civil"}


def build(o: Out):
    md = Path(__file__).resolve().parents[2] / "migrations" / "COMMAND_CENTER_EVIDENCE_SOURCES.md"
    cat = []
    for line in md.read_text(encoding="utf-8").splitlines():
        m = re.match(r"\| `([A-Z0-9_]+)` \| (.+?) \| (.+?) \|$", line)
        if m:
            cat.append(m.groups())
    dtypes = {c: (i, pc, tt, req, appr) for i, c, pc, tt, req, appr in q("SELECT id, code, phase_code, target_type, requirement_type, requires_approval FROM document_types")}
    reqs, docs, dvers, datt, drws, revs = [], [], [], [], [], []
    for p in PROJECTS:
        pk = p[0]
        ph = pidx(pk)
        arch, eng = PM[pk]
        for n, (code, name, source) in enumerate(cat):
            if code not in dtypes:
                continue
            dtid, pc, tt, rtype, needs_appr = dtypes[code]
            gi = PHASE_IDX[pc]
            native = not source.startswith(("documents", "drawings"))
            # state for this deliverable
            if gi < ph:
                state = "approved"
            elif gi == ph or (gi - ph) <= 0.5:
                state = ["approved", "under_review", "submitted", "draft", None][(n + len(pk)) % 5]
            else:
                state = None
            if pc == "08_EXECUTION" and ph == PHASE_IDX["08_EXECUTION"] and code in ("EXEC_DAILY_PROGRESS_REPORT", "EXEC_SITE_VISIT_LOG", "EXEC_QC_CHECKLIST_TEMPLATE"):
                state = "approved"
            rid = U(f"docreq:{pk}:{code}")
            done = state == "approved"
            reqs.append(dict(id=rid, project_id=PID[pk], document_type_id=dtid, requirement_type=rtype, is_enabled=int(not (code.startswith(("TENDER_LANDSCAPING", "WORK_LANDSCAPE")) and PBYKEY[pk][3] in ("apartment", "office", "retail"))),
                             is_completed=int(done), completed_at=dt(start_of(pk) + int(p[10] * (gi + 1) / max(ph + 1, 1))) if done else None,
                             remarks=None, created_at=dt(start_of(pk) + 2), updated_at=dt(-2)))
            if native or state is None:
                continue
            when = start_of(pk) + int(p[10] * (gi + 0.7) / max(ph + 0.8, 1))
            when = min(when, -1)
            author = arch if tt == "DRAWING" or pc in ("03_PRE_DESIGN", "05_DESIGN", "06_TENDER", "07_WORKING") else (eng or "anjali") if pc in ("08_EXECUTION", "09_HANDOVER") else ("pooja" if pc in ("A_VENDOR_TRADES", "B_MATERIAL") else "anjali")
            slug = code.lower().replace("_", "-")
            if tt == "DRAWING":
                did = U(f"drw:{pk}:{code}")
                nrev = 2 if state == "approved" and n % 3 == 0 else 1
                dstat = {"approved": "Approved" if pc != "07_WORKING" else "For Construction", "under_review": "For Review", "submitted": "For Review", "draft": "Draft"}[state]
                drws.append(dict(id=did, project_id=PID[pk], document_type_id=dtid, requirement_id=rid, title=name, drawing_number=f"{PNAME[pk][:3].upper()}-{code.split('_')[0][:3]}-{n + 1:03d}",
                                 phase_code=pc, discipline=DISC.get(code, "Interior" if code.startswith("MOD") else "Architecture"), sheet_number=f"{n + 1:02d}",
                                 scale="1:50" if pc in ("06_TENDER", "07_WORKING") else "1:100", sheet_size="A1" if pc in ("06_TENDER", "07_WORKING") else "A3",
                                 issue_purpose={"Draft": "Internal review", "For Review": "Client review", "Approved": "Approval", "For Construction": "Construction"}[dstat],
                                 status=dstat, remarks=None, sequence=n, drawn_by=UID["kabir"] if n % 2 else UID[arch], checked_by=UID[arch],
                                 approved_by=ADMIN if dstat in ("Approved", "For Construction") else None, created_at=dt(when - 6), updated_at=dt(when)))
                for r in range(nrev):
                    rstat = dstat if r == nrev - 1 else "Superseded"
                    revs.append(dict(id=U(f"drwrev:{pk}:{code}:{r}"), drawing_id=did, revision=f"R{r}", issue_date=d(when - 6 + r * 4),
                                     issue_purpose="Client review" if r == 0 else "Revised per client comments", status=rstat,
                                     filename=f"{slug}-R{r}.pdf", storage_filename=f"demo/{pk}/{slug}-R{r}.pdf", url=f"/uploads/demo/{pk}/{slug}-R{r}.pdf",
                                     mime="application/pdf", size=1_200_000 + n * 3100, remarks=None if r == 0 else "Kitchen layout flipped; column sizes updated",
                                     uploaded_by=UID[arch], uploaded_by_name=UNAME[arch], created_at=dt(when - 6 + r * 4), updated_at=dt(when - 6 + r * 4)))
            else:
                did = U(f"doc:{pk}:{code}")
                nv = 2 if state == "approved" and n % 4 == 0 else 1
                ext = "pdf" if not code.startswith(("DES_", "PRE_CONCEPT")) else "pptx"
                docs.append(dict(id=did, project_id=PID[pk], document_type_id=dtid, requirement_id=rid, category=CATEGORY[code.split("_")[0]], title=f"{name} - {PNAME[pk]}",
                                 filename=f"{slug}.{ext}", storage_filename=f"demo/{pk}/{slug}.{ext}", url=f"/uploads/demo/{pk}/{slug}.{ext}",
                                 mime="application/pdf" if ext == "pdf" else "application/vnd.openxmlformats-officedocument.presentationml.presentation",
                                 size=850_000 + n * 7300, version=f"V{nv}", status=state, visibility="client" if pc in ("03_PRE_DESIGN", "05_DESIGN", "09_HANDOVER") else "internal",
                                 remarks="Approved by client over email" if state == "approved" else ("Awaiting client comments" if state == "under_review" else None),
                                 is_locked=int(state == "approved" and pc in ("04_PLANNING",)), locked_by=ADMIN if state == "approved" and pc == "04_PLANNING" else None,
                                 locked_at=dt(when) if state == "approved" and pc == "04_PLANNING" else None, uploaded_by=UID[author], uploaded_by_name=UNAME[author],
                                 document_date=d(when), doc_type="upload", doc_no=f"RA/{PNAME[pk][:3].upper()}/{code.split('_')[0]}/{n + 1:03d}", sections=None,
                                 source_app={"03_PRE_DESIGN": "design_studio", "05_DESIGN": "design_studio", "A_VENDOR_TRADES": "procurement", "B_MATERIAL": "procurement",
                                             "08_EXECUTION": "siteOperations", "09_HANDOVER": "siteOperations"}.get(pc, "projects"),
                                 created_at=dt(when - 3), updated_at=dt(when)))
                for v in range(1, nv + 1):
                    dvers.append(dict(id=U(f"docver:{pk}:{code}:{v}"), document_id=did, version=f"V{v}", filename=f"{slug}-v{v}.{ext}", storage_filename=f"demo/{pk}/{slug}-v{v}.{ext}",
                                      url=f"/uploads/demo/{pk}/{slug}-v{v}.{ext}", mime="application/pdf", size=850_000 + n * 7300,
                                      status=state if v == nv else "superseded", remarks="Initial upload" if v == 1 else "Updated after review",
                                      uploaded_by=UID[author], uploaded_by_name=UNAME[author], created_at=dt(when - 3 + v * 2), updated_at=dt(when - 3 + v * 2)))
                if code in ("EXEC_PHASE_QC_SIGNOFF", "HANDOVER_WARRANTY_PACK", "PLAN_SIGNED_CONTRACT"):
                    datt.append(dict(id=U(f"docatt:{pk}:{code}"), document_id=did, filename="annexure.pdf", storage_filename=f"demo/{pk}/{slug}-annexure.pdf",
                                     url=f"/uploads/demo/{pk}/{slug}-annexure.pdf", mime="application/pdf", size=240_000, remark="Signed annexure",
                                     created_at=dt(when), updated_at=dt(when)))
    # Business proposals / pitch documents for CRM deals in proposal+ stages
    props = [("gupta", "Pitch", "Business Proposal - Gupta Villa", "approved"), ("courtyard", "Pitch", "Hospitality Design Proposal - The Courtyard", "approved"),
             ("arora", "Pitch", "Office Fit-out Proposal - Arora Foods", "submitted"), ("singhania", "Agreements", "Design & Build Agreement - Singhania Penthouse", "approved"),
             ("bhatia", "Time and Cost", "Time & Cost Plan - Bhatia Kothi", "approved"), ("aurum", "Scope of Work", "Scope Matrix - Aurum Offices", "under_review")]
    for i, (pk, cat_, title, st) in enumerate(props):
        docs.append(dict(id=U(f"prop:{pk}:{i}"), project_id=PID[pk], document_type_id=None, requirement_id=None, category=cat_, title=title,
                         filename=f"{pk}-proposal.pdf", storage_filename=f"demo/{pk}/proposal.pdf", url=f"/uploads/demo/{pk}/proposal.pdf", mime="application/pdf",
                         size=2_400_000, version="V1", status=st, visibility="client", remarks=None, is_locked=int(st == "approved"), locked_by=ADMIN if st == "approved" else None,
                         locked_at=dt(-20) if st == "approved" else None, uploaded_by=UID["vivek"], uploaded_by_name=UNAME["vivek"], document_date=d(start_of(pk) + 12),
                         doc_type="proposal", doc_no=f"RA/PROP/2026/{31 + i}",
                         sections=[{"title": "About Rippotai", "body": "Delhi-based architecture, interiors and turnkey construction studio."},
                                   {"title": "Scope", "body": f"Design and execution for {PNAME[pk]}."},
                                   {"title": "Fee", "body": "Design fee 8% of project cost; PMC 4%."},
                                   {"title": "Timeline", "body": f"{PBYKEY[pk][11] // 30} months from mobilisation."}],
                         source_app="crm", created_at=dt(start_of(pk) + 12), updated_at=dt(start_of(pk) + 14)))
    o.ins("document_requirements", reqs)
    o.ins("documents", docs)
    o.ins("document_versions", dvers)
    o.ins("document_attachments", datt)
    o.ins("drawings", drws)
    o.ins("drawing_revisions", revs)
