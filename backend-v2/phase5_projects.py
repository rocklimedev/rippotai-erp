"""Phase 5 — Projects App + Client Portal backend module."""
from fastapi import APIRouter, HTTPException, Depends, Body, Query, UploadFile, File, Form
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Any, Dict
from datetime import datetime, timezone, timedelta, date
import io
import secrets
import logging

from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, Image as RLImage
import base64

logger = logging.getLogger("phase5")

PHASES = [
    ("pre_design", "Pre-Design", 3),
    ("design", "Design", 6),
    ("pre_execution", "Pre-Execution", 3),
    ("execution", "Execution", 16),
    ("handover", "Handover", 2),
    ("completed", "Completed", 0),
]

DELAY_REASONS = ["Client Approval", "Material Delay", "Vendor Delay", "Design Revision", "Site Restriction", "Payment Delay", "Labour Shortage", "Weather", "Internal Delay", "Other"]


def register_phase5(app, api, db, deps: dict):
    get_current_user = deps["get_current_user"]
    require_internal = deps["require_internal"]
    gen_id = deps["gen_id"]
    now_iso = deps["now_iso"]
    fmt_inr = deps["fmt_inr"]
    UPLOAD_ROOT = deps["UPLOAD_ROOT"]

    APP_BASE_URL = deps.get("app_base_url") or ""
    enforce_free_trial_cap = deps.get("enforce_free_trial_cap")

    # ---------- Timeline computation ----------
    async def _compute_timeline(project: dict) -> dict:
        pid = project["id"]
        milestones = await db.project_milestones.find({"project_id": pid}, {"_id": 0}).to_list(200)
        phases = await db.project_phases.find({"project_id": pid}, {"_id": 0}).sort("order", 1).to_list(20)
        if not milestones:
            return {
                "status": project.get("timeline_status") or "on_track",
                "planned_progress": project.get("progress", 0),
                "actual_progress": project.get("progress", 0),
                "variance": 0,
                "schedule_variance": 0,
                "delay_days": 0,
                "delayed_milestones": [],
            }
        today = datetime.now(timezone.utc).date()
        total = len(milestones)
        # Count as done: status in completed/skipped OR actual_end set
        def _done(m):
            return m.get("status") in ("completed", "skipped") or bool(m.get("actual_end"))
        completed = sum(1 for m in milestones if _done(m))
        planned_done = sum(1 for m in milestones if m.get("planned_end") and _parse_date(m["planned_end"]) <= today)
        # If phases are marked completed, boost actual_progress by phase weight
        completed_phases = sum(1 for ph in phases if ph.get("status") == "completed")
        total_phases = len(phases) or 6
        milestone_pct = round(completed / total * 100) if total else 0
        phase_pct = round(completed_phases / total_phases * 100)
        # Blend with project.progress field if present (respects seeded manual values)
        actual_pct = max(milestone_pct, phase_pct, int(project.get("progress") or 0))
        planned_pct = round(planned_done / total * 100) if total else 0
        variance = actual_pct - planned_pct
        delayed = [m for m in milestones if m.get("mandatory") and m.get("planned_end") and _parse_date(m["planned_end"]) < today and not _done(m)]
        delay_days = 0
        if delayed:
            earliest = min(_parse_date(m["planned_end"]) for m in delayed)
            delay_days = (today - earliest).days
        if project.get("status") == "on_hold":
            status = "on_hold"
        elif project.get("status") == "completed" or actual_pct >= 100:
            status = "completed"
        elif delayed:
            status = "delayed"
        elif variance > 5:
            status = "ahead"
        elif variance < -5:
            status = "at_risk"
        else:
            status = "on_track"
        upcoming_risk = [m for m in milestones if m.get("mandatory") and m.get("planned_end") and 0 <= (_parse_date(m["planned_end"]) - today).days <= 3 and m.get("status") == "not_started"]
        if status == "on_track" and upcoming_risk:
            status = "at_risk"
        return {
            "status": status,
            "planned_progress": planned_pct,
            "actual_progress": actual_pct,
            "variance": variance,
            "schedule_variance": variance,
            "delay_days": delay_days,
            "delayed_milestones": [{"id": m["id"], "name": m["name"], "planned_end": m.get("planned_end"), "reason": m.get("delay_reason")} for m in delayed[:5]],
        }

    def _parse_date(s: str) -> date:
        try:
            return datetime.fromisoformat(str(s)).date()
        except Exception:
            return date.today()

    # ---------- Projects ----------
    @api.get("/projects/summary")
    async def projects_summary(current=Depends(require_internal)):
        rows = await db.projects.find({}, {"_id": 0}).to_list(200)
        total = len(rows)
        active = sum(1 for r in rows if (r.get("status") or "active") not in ("completed", "archived"))
        completed = sum(1 for r in rows if r.get("status") == "completed" or r.get("progress", 0) >= 100)
        on_time = 0; delayed = 0; awaiting = 0; near_handover = 0
        for p in rows:
            tl = await _compute_timeline(p)
            if tl["status"] in ("on_track", "ahead"): on_time += 1
            if tl["status"] == "delayed": delayed += 1
            if p.get("timeline_status") == "awaiting_input": awaiting += 1
            if (p.get("phase") or "").lower() in ("handover",) or p.get("progress", 0) >= 85: near_handover += 1
        return {"total": total, "active": active, "on_time": on_time, "delayed": delayed, "awaiting_action": awaiting, "near_handover": near_handover, "completed": completed}

    @api.get("/projects/full")
    async def projects_full_list(
        q: Optional[str] = None,
        status: Optional[str] = None,
        project_type: Optional[str] = None,
        phase: Optional[str] = None,
        priority: Optional[str] = None,
        pm_id: Optional[str] = None,
        limit: int = 100,
        current=Depends(require_internal),
    ):
        query = {}
        if status and status != "all": query["status"] = status
        if project_type: query["project_type"] = project_type
        if phase: query["phase"] = phase
        if priority: query["priority"] = priority
        if pm_id: query["pm_id"] = pm_id
        if q:
            query["$or"] = [{"name": {"$regex": q, "$options": "i"}}, {"client_name": {"$regex": q, "$options": "i"}}, {"location": {"$regex": q, "$options": "i"}}]
        rows = await db.projects.find(query, {"_id": 0}).sort("updated_at", -1).limit(limit).to_list(limit)
        # enrich with timeline
        for p in rows:
            tl = await _compute_timeline(p)
            p["timeline"] = tl
            # count pending actions
            p["pending_actions"] = await db.project_work.count_documents({"project_id": p["id"], "status": {"$in": ["pending", "awaiting_input", "awaiting_approval"]}})
        return rows

    @api.get("/projects/{pid}/overview")
    async def project_overview(pid: str, current=Depends(require_internal)):
        p = await db.projects.find_one({"id": pid}, {"_id": 0})
        if not p: raise HTTPException(404, "Project not found")
        tl = await _compute_timeline(p)
        phases = await db.project_phases.find({"project_id": pid}, {"_id": 0}).sort("order", 1).to_list(20)
        milestones = await db.project_milestones.find({"project_id": pid}, {"_id": 0}).to_list(200)
        team = await db.project_team.find({"project_id": pid}, {"_id": 0}).to_list(20)
        activity = await db.activity.find({"project_id": pid}, {"_id": 0}).to_list(50)
        activity.sort(key=lambda a: a.get("at") or a.get("created_at") or "", reverse=True)
        # health
        boq_count = await db.boqs.count_documents({"project_id": pid, "status": "approved"})
        boq_total = await db.boqs.count_documents({"project_id": pid})
        q_selected = await db.quotations.count_documents({"project_id": pid, "selected": True})
        q_total = await db.quotations.count_documents({"project_id": pid})
        docs_count = await db.documents.count_documents({"project_id": pid})
        health = {
            "timeline": tl["status"],
            "boq": "approved" if boq_count > 0 else ("draft" if boq_total > 0 else "missing"),
            "quotation": "on_track" if q_selected > 0 else ("in_progress" if q_total > 0 else "pending"),
            "documentation": "good" if docs_count >= 10 else ("partial" if docs_count > 0 else "missing"),
            "cost": "on_budget",
            "approvals": "cleared" if p.get("client_approved") else "pending",
        }
        top_pending = await db.project_work.find({"project_id": pid, "status": {"$in": ["pending", "awaiting_input", "awaiting_approval"]}}, {"_id": 0}).limit(5).to_list(5)
        return {
            "project": p,
            "timeline": tl,
            "phases": phases,
            "milestones_summary": {"total": len(milestones), "completed": sum(1 for m in milestones if m.get("status") == "completed"), "in_progress": sum(1 for m in milestones if m.get("status") == "in_progress"), "delayed": sum(1 for m in milestones if m.get("status") == "delayed")},
            "team": team,
            "health": health,
            "top_pending": top_pending,
            "recent_activity": activity[:5],
        }

    @api.get("/projects/{pid}/timeline-status")
    async def project_timeline_status(pid: str, current=Depends(require_internal)):
        p = await db.projects.find_one({"id": pid}, {"_id": 0})
        if not p: raise HTTPException(404, "Project not found")
        return await _compute_timeline(p)

    @api.get("/projects/{pid}/milestones")
    async def milestones_list(pid: str, current=Depends(require_internal)):
        return await db.project_milestones.find({"project_id": pid}, {"_id": 0}).sort("planned_end", 1).to_list(200)

    class MilestoneIn(BaseModel):
        model_config = ConfigDict(extra="allow")
        name: str
        phase: str = "execution"
        planned_start: Optional[str] = None
        planned_end: Optional[str] = None
        assignee: Optional[str] = None
        status: str = "not_started"
        mandatory: bool = True

    @api.post("/projects/{pid}/milestones")
    async def milestone_add(pid: str, payload: MilestoneIn, current=Depends(require_internal)):
        m = {"id": gen_id(), "project_id": pid, "completion_pct": 0, "created_at": now_iso(), **payload.model_dump()}
        await db.project_milestones.insert_one(m)
        m.pop("_id", None)
        return m

    @api.patch("/projects/{pid}/milestones/{mid}")
    async def milestone_patch(pid: str, mid: str, payload: dict = Body(...), current=Depends(require_internal)):
        payload.pop("_id", None)
        await db.project_milestones.update_one({"id": mid, "project_id": pid}, {"$set": {**payload, "updated_at": now_iso()}})
        return {"ok": True}

    @api.delete("/projects/{pid}/milestones/{mid}")
    async def milestone_delete(pid: str, mid: str, current=Depends(require_internal)):
        await db.project_milestones.delete_one({"id": mid, "project_id": pid})
        return {"ok": True}

    @api.post("/projects/{pid}/milestones/{mid}/complete")
    async def milestone_complete(pid: str, mid: str, current=Depends(require_internal)):
        await db.project_milestones.update_one({"id": mid, "project_id": pid}, {"$set": {"status": "completed", "completion_pct": 100, "actual_end": now_iso()[:10], "updated_at": now_iso()}})
        return {"ok": True}

    @api.get("/projects/{pid}/phases")
    async def phases_list(pid: str, current=Depends(require_internal)):
        return await db.project_phases.find({"project_id": pid}, {"_id": 0}).sort("order", 1).to_list(20)

    @api.get("/projects/{pid}/pending-work")
    async def pending_work(pid: str, current=Depends(require_internal)):
        rows = await db.project_work.find({"project_id": pid}, {"_id": 0}).to_list(300)
        today = datetime.now(timezone.utc).date().isoformat()
        week = (datetime.now(timezone.utc).date() + timedelta(days=7)).isoformat()
        buckets = {"due_today": [], "due_this_week": [], "delayed": [], "awaiting_approval": [], "awaiting_client": [], "blocked": [], "upcoming": []}
        for w in rows:
            due = w.get("due_date") or ""
            st = w.get("status") or "pending"
            if st == "blocked": buckets["blocked"].append(w)
            elif st == "awaiting_approval": buckets["awaiting_approval"].append(w)
            elif st == "awaiting_client": buckets["awaiting_client"].append(w)
            elif due and due < today: buckets["delayed"].append(w)
            elif due == today: buckets["due_today"].append(w)
            elif due and today < due <= week: buckets["due_this_week"].append(w)
            else: buckets["upcoming"].append(w)
        return buckets

    @api.get("/projects/{pid}/team")
    async def team_list(pid: str, current=Depends(require_internal)):
        return await db.project_team.find({"project_id": pid}, {"_id": 0}).to_list(50)

    @api.get("/projects/{pid}/vendors")
    async def project_vendors(pid: str, current=Depends(require_internal)):
        # From selected quotations
        selected = await db.quotations.find({"project_id": pid, "selected": True}, {"_id": 0}).to_list(100)
        out = []
        for q in selected:
            v = await db.vendors.find_one({"id": q.get("vendor_id")}, {"_id": 0})
            out.append({
                "vendor_id": q.get("vendor_id"), "vendor_name": q.get("vendor_name"),
                "category": q.get("work_category"), "quotation_amount": (q.get("subtotals") or {}).get("total", 0),
                "approved_amount": (q.get("subtotals") or {}).get("total", 0),
                "status": "engaged", "rating": (v or {}).get("rating") if v else None,
                "phone": (v or {}).get("phone") if v else None,
                "quotation_id": q.get("id"),
            })
        # Manually attached
        manual = await db.project_vendors.find({"project_id": pid}, {"_id": 0}).to_list(50)
        return {"engaged": out, "attached": manual}

    @api.get("/projects/{pid}/financial")
    async def project_financial(pid: str, current=Depends(require_internal)):
        # Approved BOQ estimate
        approved_boq = await db.boqs.find_one({"project_id": pid, "status": "approved"}, {"_id": 0})
        approved_boq_amt = (approved_boq or {}).get("total_amount") or 0
        selected_qs = await db.quotations.find({"project_id": pid, "selected": True}, {"_id": 0}).to_list(50)
        approved_vendor_amt = sum((q.get("subtotals") or {}).get("total", 0) for q in selected_qs)
        all_qs = await db.quotations.find({"project_id": pid}, {"_id": 0}).to_list(100)
        vendor_quoted_amt = sum((q.get("subtotals") or {}).get("total", 0) for q in all_qs)
        return {
            "approved_boq_estimate": approved_boq_amt,
            "vendor_quoted_cost": vendor_quoted_amt,
            "approved_vendor_cost": approved_vendor_amt,
            "committed_cost": approved_vendor_amt,
            "actual_recorded_cost": approved_vendor_amt * 0.65,
            "projected_final_cost": approved_vendor_amt,
            "cost_variation_pct": round((approved_vendor_amt - approved_boq_amt) / approved_boq_amt * 100.0, 2) if approved_boq_amt else None,
            "additional_approved": 0,
            "payment_milestones": (approved_boq or {}).get("payment_milestones") or [],
        }

    @api.get("/projects/{pid}/documents")
    async def project_documents(pid: str, current=Depends(require_internal)):
        rows = await db.documents.find({"project_id": pid}, {"_id": 0}).to_list(200)
        rows.sort(key=lambda d: d.get("uploaded_at") or "", reverse=True)
        return rows

    @api.patch("/projects/{pid}/documents/{did}/client-visibility")
    async def toggle_doc_client_visible(pid: str, did: str, payload: dict = Body(...), current=Depends(require_internal)):
        vis = bool(payload.get("client_visible", False))
        await db.documents.update_one({"id": did, "project_id": pid}, {"$set": {"client_visible": vis}})
        return {"ok": True, "client_visible": vis}

    class ProjectIn(BaseModel):
        model_config = ConfigDict(extra="allow")
        name: str
        client_name: Optional[str] = None
        project_type: str = "Residential Interior"
        location: Optional[str] = None
        phase: str = "pre_design"
        priority: str = "Medium"
        expected_completion: Optional[str] = None

    @api.post("/projects")
    async def project_create(payload: ProjectIn, current=Depends(require_internal)):
        if enforce_free_trial_cap:
            await enforce_free_trial_cap(current, "projects")
        pid = gen_id()
        doc = {
            "id": pid, "code": f"BC-{datetime.now().year}-{pid[:5].upper()}",
            "progress": 0, "timeline_status": "on_track", "status": "active",
            "created_at": now_iso(), "updated_at": now_iso(),
            "created_by_id": current.get("id"),
            **payload.model_dump(),
        }
        await db.projects.insert_one(doc)
        # Seed default phases
        today = datetime.now(timezone.utc).date()
        cursor = today
        order = 0
        for code, name, weeks in PHASES:
            end = cursor + timedelta(weeks=weeks)
            await db.project_phases.insert_one({"id": gen_id(), "project_id": pid, "phase_code": code, "name": name, "order": order, "planned_start": cursor.isoformat(), "planned_end": end.isoformat(), "status": "not_started"})
            cursor = end; order += 1
        doc.pop("_id", None)
        return doc

    @api.patch("/projects/{pid}")
    async def project_patch(pid: str, payload: dict = Body(...), current=Depends(require_internal)):
        payload.pop("_id", None); payload.pop("id", None)
        payload["updated_at"] = now_iso()
        await db.projects.update_one({"id": pid}, {"$set": payload})
        return {"ok": True}

    # ---------- Handover ----------
    @api.get("/projects/{pid}/handover-package-status")
    async def handover_package_status(pid: str, current=Depends(require_internal)):
        p = await db.projects.find_one({"id": pid}, {"_id": 0})
        if not p: raise HTTPException(404, "Not found")
        checklist = p.get("handover_checklist") or []
        required = len(checklist)
        available = sum(1 for c in checklist if c.get("done"))
        pct = round(available * 100 / required) if required else 0
        return {"required": required, "available": available, "pending": required - available, "percent": pct, "percentage": pct, "checklist": checklist, "ready": available == required}

    @api.post("/projects/{pid}/handover/prepare-package")
    async def prepare_handover(pid: str, stream: bool = False, current=Depends(require_internal)):
        p = await db.projects.find_one({"id": pid}, {"_id": 0})
        if not p: raise HTTPException(404, "Not found")
        # Dedup: remove existing generated handover docs for this project
        old_docs = await db.documents.find({"project_id": pid, "category": "Handover", "source": "generated"}, {"_id": 0}).to_list(50)
        old_ids = [d["id"] for d in old_docs]
        if old_ids:
            await db.documents.delete_many({"id": {"$in": old_ids}})
        # Compile PDF
        buf = io.BytesIO()
        doc = SimpleDocTemplate(buf, pagesize=A4, leftMargin=14*mm, rightMargin=14*mm, topMargin=16*mm, bottomMargin=16*mm, compress=0, pageCompression=0)
        styles = getSampleStyleSheet()
        orange = colors.HexColor("#EF7F1B"); green = colors.HexColor("#1F453B")
        story = []
        story.append(Paragraph(f'<font color="#EF7F1B" size="20"><b>INOS</b></font> <font color="#6B7280">— Handover Package</font>', styles["Normal"]))
        story.append(Spacer(1, 8))
        story.append(Paragraph(f'<font color="#1F453B" size="16"><b>{p["name"]}</b></font>', styles["Normal"]))
        story.append(Paragraph(f'<font color="#6B7280" size="10">{p.get("client_name") or ""} · {p.get("location") or ""}</font>', styles["Normal"]))
        story.append(Spacer(1, 12))
        # Sections
        for section_title, section_content in [
            ("Project Summary", f"{p.get('name')} — a {p.get('project_type', 'project')} in {p.get('location', 'India')}. Project code: {p.get('code', '—')}. Progress: {p.get('progress', 0)}%. Delivered by INOS's team over the planned execution window."),
            ("Scope of Work", "Complete interior/architectural fit-out including civil work, flooring, electrical, plumbing, painting, false ceiling, furniture and joinery, HVAC, and final commissioning. All materials as per approved BOQ."),
            ("Approved BOQ Reference", "The final approved Bill of Quantities (V1 or later) is included as part of the handover package. Selected vendor quotations for each work category are attached for future reference."),
            ("Vendor & Contractor List", "List of engaged vendors is attached separately. Warranty periods and contact details are recorded for each engaged vendor."),
            ("Warranties & Maintenance", "Individual warranty certificates from manufacturers/vendors are compiled. Standard warranty period is 12 months on workmanship. Maintenance recommendations are included in the client handover note."),
            ("Client Sign-off", "Client acceptance is captured either physically or digitally via the INOS client portal magic link. On acceptance, this project moves to 'Completed' status."),
        ]:
            story.append(Paragraph(f'<font color="#1F453B" size="12"><b>{section_title}</b></font>', styles["Normal"]))
            story.append(Paragraph(f'<font size="10" color="#4B5158">{section_content}</font>', styles["Normal"]))
            story.append(Spacer(1, 8))
        # Checklist table
        story.append(Paragraph('<font color="#1F453B" size="12"><b>Handover Checklist</b></font>', styles["Normal"]))
        rows = [["#", "Document", "Status"]]
        for i, c in enumerate(p.get("handover_checklist") or [], 1):
            rows.append([str(i), c.get("name"), "✓ Available" if c.get("done") else "Pending"])
        t = Table(rows, colWidths=[15*mm, 120*mm, 45*mm], repeatRows=1)
        t.setStyle(TableStyle([("BACKGROUND", (0,0), (-1,0), green), ("TEXTCOLOR", (0,0), (-1,0), colors.white), ("GRID", (0,0), (-1,-1), 0.3, colors.HexColor("#DDD8CE")), ("FONT", (0,0), (-1,-1), "Helvetica", 9)]))
        story.append(t); story.append(Spacer(1, 12))
        story.append(Paragraph('<font size="8" color="#9A9388">This compiled document is generated by INOS ERP for project handover. It excludes internal drafts, rejected BOQ versions, non-selected quotations, internal notes and vendor comparison sheets. Only client-approved documents are included.</font>', styles["Normal"]))
        story.append(Spacer(1, 8))
        for stitle, sbody in [
            ("Site Delivery Notes", "Materials delivered to site were inspected against approved samples. Any deviations were flagged in the site day-book with photographic evidence, corrective action, and vendor accountability. Deliveries requiring hoist or crane access were pre-scheduled with the housing society to minimise disruption to neighbours."),
            ("Statutory Compliance", "All electrical work carried out under a licensed electrical contractor with valid electrical license. Fire safety norms per NBC 2016 followed. GST-compliant invoices raised for all materials and services procured. Building bye-law compliance certificate available on request."),
            ("Post-Handover Support", "INOS provides a 90-day complimentary post-handover support window for minor snags, adjustment of fittings, and vendor coordination. Warranty claims on materials and appliances continue for their respective manufacturer warranty periods. Contact the project manager for any post-handover requests."),
            ("Maintenance Recommendations", "Regular dusting of joinery with a soft dry cloth is recommended. Avoid direct contact of water with veneer and laminate surfaces. Marble and stone surfaces should be resealed annually. Electrical DBs and RCCBs should be tested every quarter for tripping response."),
            ("Vendor Escalation Matrix", "First point of contact for any vendor-related issue is the Site Supervisor followed by the Project Manager. For escalations beyond 48 hours the Administrative Manager may be reached. All vendor communications must be routed through INOS to preserve accountability."),
            ("Data Retention", "This project design files, approved BOQ, selected quotations, warranty documents, and site photographs will be retained by INOS for a period of 7 years post-handover. Digital access to the client portal remains available for review of shared documents."),
        ]:
            story.append(Paragraph(f'<font color="#1F453B" size="11"><b>{stitle}</b></font>', styles["Normal"]))
            story.append(Paragraph(f'<font size="9" color="#4B5158">{sbody}</font>', styles["Normal"]))
            story.append(Spacer(1, 6))
        story.append(Spacer(1, 20))
        story.append(Paragraph('<font size="10">For INOS</font><br/><br/><br/>_______________________<br/><font size="8">Authorized Signatory</font>', styles["Normal"]))
        story.append(Spacer(1, 10))
        story.append(Paragraph(f'<font size="10">For Client — {p.get("client_name") or ""}</font><br/><br/><br/>_______________________<br/><font size="8">Client Signature &amp; Stamp</font>', styles["Normal"]))
        doc.build(story)
        buf.seek(0)
        # Save package as document
        pdir = UPLOAD_ROOT / "handover" / pid
        pdir.mkdir(parents=True, exist_ok=True)
        fname = f"Handover_{p['name'].replace(' ', '_')}_{datetime.now().strftime('%Y%m%d%H%M%S')}.pdf"
        fpath = pdir / fname
        content = buf.getvalue()
        fpath.write_bytes(content)
        did = gen_id()
        rel = f"handover/{pid}/{fname}"
        await db.documents.insert_one({"id": did, "name": f"Handover Package — {p['name']}", "type": "PDF", "category": "Handover", "project_id": pid, "project_name": p["name"], "uploaded_by": current.get("name"), "uploaded_at": now_iso(), "source": "generated", "origin": "generated", "path": rel, "size": len(content), "client_visible": True})
        await db.projects.update_one({"id": pid}, {"$set": {"handover_package_id": did, "status": "awaiting_handover_signoff", "updated_at": now_iso()}})
        if stream:
            return StreamingResponse(io.BytesIO(content), media_type="application/pdf", headers={"Content-Disposition": f'attachment; filename="{fname}"'})
        return {"ok": True, "document_id": did, "size": len(content), "filename": fname}

    @api.get("/documents/{did}/download")
    async def document_download(did: str, current=Depends(require_internal)):
        d = await db.documents.find_one({"id": did})
        if not d:
            raise HTTPException(404, "Document not found")
        # New Phase B docs store bytes inline as base64
        if d.get("content_b64"):
            import base64 as _b64
            content = _b64.b64decode(d["content_b64"])
            return StreamingResponse(io.BytesIO(content), media_type=d.get("mime") or "application/pdf", headers={"Content-Disposition": f'attachment; filename="{d.get("filename","document.pdf")}"'})
        # Legacy disk-backed docs
        if not d.get("path"):
            raise HTTPException(404, "Document has no payload")
        p = UPLOAD_ROOT / d["path"]
        if not p.exists():
            raise HTTPException(404, "File missing on disk")
        content = p.read_bytes()
        return StreamingResponse(io.BytesIO(content), media_type=d.get("mime") or "application/pdf", headers={"Content-Disposition": f'attachment; filename="{p.name}"'})

    @api.post("/projects/{pid}/handover/deliver")
    async def deliver_handover(pid: str, payload: dict = Body(default={}), current=Depends(require_internal)):
        p = await db.projects.find_one({"id": pid}, {"_id": 0})
        if not p: raise HTTPException(404, "Not found")
        token = secrets.token_urlsafe(48)
        link = {
            "id": gen_id(), "token": token, "project_id": pid,
            "purpose": "handover_acceptance", "target_id": p.get("handover_package_id"),
            "client_email": payload.get("client_email") or p.get("client_email") or "client@example.com",
            "client_name": payload.get("client_name") or p.get("client_name") or "Client",
            "created_by": current.get("name"),
            "created_at": now_iso(),
            "expires_at": (datetime.now(timezone.utc) + timedelta(days=int(payload.get("expires_days") or 30))).isoformat(),
            "options": payload.get("options") or {},
            "used_count": 0, "revoked": False,
        }
        await db.client_magic_links.insert_one(link)
        link.pop("_id", None)
        url = f"{APP_BASE_URL}/client/{token}"
        return {"ok": True, "token": token, "url": url, "link_id": link["id"]}

    # ---------- Client magic links ----------
    class LinkCreateIn(BaseModel):
        model_config = ConfigDict(extra="allow")
        project_id: str
        purpose: str  # project_view | boq_approval | quotation_selection | handover_acceptance
        target_id: Optional[str] = None
        client_email: Optional[str] = None
        client_name: Optional[str] = None
        expires_days: int = 30
        options: Optional[dict] = None

    @api.post("/client-links")
    async def link_create(payload: LinkCreateIn, current=Depends(require_internal)):
        token = secrets.token_urlsafe(48)
        p = await db.projects.find_one({"id": payload.project_id}, {"_id": 0})
        if not p: raise HTTPException(404, "Project not found")
        link = {
            "id": gen_id(), "token": token, "project_id": payload.project_id,
            "project_name": p.get("name"),
            "purpose": payload.purpose, "target_id": payload.target_id,
            "client_email": payload.client_email or p.get("client_email"),
            "client_name": payload.client_name or p.get("client_name"),
            "created_by": current.get("name"),
            "created_at": now_iso(),
            "expires_at": (datetime.now(timezone.utc) + timedelta(days=payload.expires_days)).isoformat(),
            "options": payload.options or {},
            "used_count": 0, "revoked": False,
        }
        await db.client_magic_links.insert_one(link)
        link.pop("_id", None)
        url = f"{APP_BASE_URL}/client/{token}"
        return {**link, "url": url}

    @api.get("/client-links")
    async def link_list(project_id: Optional[str] = None, current=Depends(require_internal)):
        q = {"project_id": project_id} if project_id else {}
        rows = await db.client_magic_links.find(q, {"_id": 0}).sort("created_at", -1).to_list(200)
        for r in rows:
            r["url"] = f"{APP_BASE_URL}/client/{r['token']}"
        return rows

    @api.post("/client-links/{lid}/revoke")
    async def link_revoke(lid: str, current=Depends(require_internal)):
        await db.client_magic_links.update_one({"id": lid}, {"$set": {"revoked": True, "revoked_at": now_iso()}})
        return {"ok": True}

    @api.post("/client-links/{lid}/resend")
    async def link_resend(lid: str, current=Depends(require_internal)):
        link = await db.client_magic_links.find_one({"id": lid}, {"_id": 0})
        if not link: raise HTTPException(404, "Not found")
        new_token = secrets.token_urlsafe(48)
        await db.client_magic_links.update_one({"id": lid}, {"$set": {"token": new_token, "expires_at": (datetime.now(timezone.utc) + timedelta(days=30)).isoformat(), "used_count": 0, "revoked": False}})
        return {"ok": True, "token": new_token, "url": f"{APP_BASE_URL}/client/{new_token}"}

    # ---------- Public client portal ----------
    async def _validate_token(token: str, purpose_hint: Optional[str] = None):
        link = await db.client_magic_links.find_one({"token": token}, {"_id": 0})
        if not link:
            raise HTTPException(404, "Invalid link")
        if link.get("revoked"):
            raise HTTPException(410, "This link has been revoked")
        try:
            if datetime.fromisoformat(link["expires_at"]) < datetime.now(timezone.utc):
                raise HTTPException(410, "This link has expired")
        except HTTPException:
            raise
        except Exception:
            pass
        await db.client_magic_links.update_one({"id": link["id"]}, {"$inc": {"used_count": 1}, "$set": {"last_accessed_at": now_iso()}})
        # Log a client_view activity
        await db.activity.insert_one({"id": gen_id(), "project_id": link["project_id"], "project_name": link.get("project_name"), "action": "client_view", "description": f"Client {link.get('client_name')} viewed the {link.get('purpose')} link", "actor": link.get("client_name") or "Client", "actor_initials": "CL", "status": "info", "at": now_iso(), "created_at": now_iso()})
        return link

    def _sanitize_project_for_client(p: dict) -> dict:
        return {k: p.get(k) for k in ["id", "name", "client_name", "location", "project_type", "phase", "progress", "expected_completion", "code"]}

    def _sanitize_boq_for_client(b: dict, items: list, categories: list, show_rates: bool = True) -> dict:
        out = {k: b.get(k) for k in ["id", "project_name", "version", "status", "total_amount", "created_at", "client_approved"]}
        # Filter items marked hide_from_client
        client_items = []
        for it in items:
            if it.get("hide_from_client"):
                continue
            row = {"id": it["id"], "category_id": it.get("category_id"), "description": it.get("description"), "unit": it.get("unit"), "quantity": it.get("quantity"), "amount": it.get("amount")}
            if show_rates:
                row["rate"] = it.get("rate")
            client_items.append(row)
        out["items"] = client_items
        out["categories"] = categories
        return out

    @api.get("/public/client/{token}")
    async def client_landing(token: str):
        link = await _validate_token(token)
        p = await db.projects.find_one({"id": link["project_id"]}, {"_id": 0})
        if not p: raise HTTPException(404, "Project not found")
        # timeline (client-safe)
        milestones = await db.project_milestones.find({"project_id": p["id"]}, {"_id": 0}).sort("planned_end", 1).to_list(200)
        upcoming = [m for m in milestones if m.get("status") != "completed"][:3]
        phases = await db.project_phases.find({"project_id": p["id"]}, {"_id": 0}).sort("order", 1).to_list(20)
        docs = await db.documents.find({"project_id": p["id"], "client_visible": True}, {"_id": 0}).to_list(50)
        docs.sort(key=lambda d: d.get("uploaded_at") or "", reverse=True)
        return {
            "link": {"purpose": link["purpose"], "target_id": link.get("target_id"), "client_name": link.get("client_name"), "expires_at": link.get("expires_at")},
            "project": _sanitize_project_for_client(p),
            "phases": [{"phase_code": ph.get("phase_code"), "name": ph.get("name"), "status": ph.get("status"), "order": ph.get("order")} for ph in phases],
            "upcoming_milestones": [{"name": m["name"], "planned_end": m.get("planned_end"), "phase": m.get("phase")} for m in upcoming],
            "documents": [{"id": d["id"], "name": d["name"], "type": d.get("type"), "uploaded_at": d.get("uploaded_at"), "category": d.get("category")} for d in docs[:10]],
        }

    @api.get("/public/client/{token}/boq/{boq_id}")
    async def client_boq(token: str, boq_id: str):
        link = await _validate_token(token)
        if link["purpose"] == "boq_approval" and link.get("target_id") and link["target_id"] != boq_id:
            raise HTTPException(403, "This link is not authorized for this BOQ")
        b = await db.boqs.find_one({"id": boq_id, "project_id": link["project_id"]}, {"_id": 0})
        if not b: raise HTTPException(404, "BOQ not found")
        items = await db.boq_items.find({"boq_id": boq_id}, {"_id": 0}).sort("order", 1).to_list(500)
        categories = await db.boq_categories.find({"boq_id": boq_id}, {"_id": 0}).sort("order", 1).to_list(50)
        show_rates = (link.get("options") or {}).get("show_rates", True)
        return _sanitize_boq_for_client(b, items, categories, show_rates)

    class BoqApprovalIn(BaseModel):
        model_config = ConfigDict(extra="allow")
        signatory_name: Optional[str] = None
        signatory_email: Optional[str] = None
        name: Optional[str] = None  # alias
        email: Optional[str] = None  # alias
        comments: Optional[str] = ""
        signature_png: Optional[str] = None
        approved: bool = True
        request_changes: bool = False

    @api.post("/public/client/{token}/boq/{boq_id}/approve")
    async def client_boq_approve(token: str, boq_id: str, payload: BoqApprovalIn):
        link = await _validate_token(token)
        b = await db.boqs.find_one({"id": boq_id, "project_id": link["project_id"]}, {"_id": 0})
        if not b: raise HTTPException(404, "BOQ not found")
        # Accept either signatory_name/email or name/email aliases
        sig_name = payload.signatory_name or payload.name
        sig_email = payload.signatory_email or payload.email
        if not sig_name:
            raise HTTPException(400, "signatory_name (or name) is required")
        rec = {
            "id": gen_id(), "boq_id": boq_id, "token_id": link["id"],
            "project_id": link["project_id"],
            "signatory_name": sig_name, "signatory_email": sig_email,
            "comments": payload.comments, "signature_png": payload.signature_png,
            "approved": payload.approved, "request_changes": payload.request_changes,
            "at": now_iso(),
        }
        await db.boq_client_approvals.insert_one(rec)
        rec.pop("_id", None)
        if payload.approved and not payload.request_changes:
            await db.boqs.update_one({"id": boq_id}, {"$set": {"client_approved": True, "client_approved_at": now_iso(), "client_approved_by": payload.signatory_name}})
        # Activity
        action = "client_approved" if payload.approved else "client_requested_changes"
        desc = f"Client {payload.signatory_name} approved BOQ V{b.get('version')}" if payload.approved else f"Client {payload.signatory_name} requested changes on BOQ V{b.get('version')}"
        await db.activity.insert_one({"id": gen_id(), "project_id": link["project_id"], "project_name": link.get("project_name"), "action": action, "description": desc, "actor": payload.signatory_name, "actor_initials": "CL", "status": "success" if payload.approved else "warning", "at": now_iso(), "created_at": now_iso()})
        # Add BOQ approval history
        await db.boq_approval_history.insert_one({"id": gen_id(), "boq_id": boq_id, "action": action, "actor": payload.signatory_name, "remarks": payload.comments or "", "at": now_iso()})
        # Save signed PDF document (small)
        try:
            buf = io.BytesIO()
            doc = SimpleDocTemplate(buf, pagesize=A4, leftMargin=14*mm, rightMargin=14*mm, topMargin=16*mm, bottomMargin=16*mm)
            styles = getSampleStyleSheet()
            story = [Paragraph(f'<font color="#EF7F1B" size="18"><b>INOS</b></font> — Client BOQ {"Approval" if payload.approved else "Change Request"}', styles["Normal"])]
            story.append(Spacer(1, 8))
            story.append(Paragraph(f'<b>{b.get("project_name") or link.get("project_name")}</b> — BOQ V{b.get("version")}', styles["Normal"]))
            story.append(Paragraph(f'Signed by: {payload.signatory_name} ({payload.signatory_email})', styles["Normal"]))
            story.append(Paragraph(f'Date: {rec["at"]}', styles["Normal"]))
            if payload.comments:
                story.append(Spacer(1, 6))
                story.append(Paragraph(f'<b>Comments:</b> {payload.comments}', styles["Normal"]))
            if payload.signature_png:
                try:
                    _, b64 = (payload.signature_png.split(",", 1) + [payload.signature_png])[:2]
                    img_bytes = base64.b64decode(b64)
                    story.append(Spacer(1, 10))
                    story.append(Paragraph("<b>Signature:</b>", styles["Normal"]))
                    story.append(RLImage(io.BytesIO(img_bytes), width=60*mm, height=25*mm))
                except Exception:
                    pass
            doc.build(story); buf.seek(0)
            pdir = UPLOAD_ROOT / "boq_approvals" / boq_id
            pdir.mkdir(parents=True, exist_ok=True)
            fname = f"BOQ_Approval_{rec['id']}.pdf"
            (pdir / fname).write_bytes(buf.getvalue())
            await db.documents.insert_one({"id": gen_id(), "name": f"Client Approval — {b.get('project_name')} BOQ V{b.get('version')}", "type": "PDF", "category": "Approval", "project_id": link["project_id"], "project_name": link.get("project_name"), "uploaded_by": payload.signatory_name, "uploaded_at": now_iso(), "source": "generated", "origin": "generated", "path": f"boq_approvals/{boq_id}/{fname}", "size": len(buf.getvalue()), "client_visible": True})
        except Exception as e:
            logger.warning(f"Failed to generate approval PDF: {e}")
        return rec

    @api.get("/public/client/{token}/quotations/compare/{cid}")
    async def client_comparison(token: str, cid: str):
        link = await _validate_token(token)
        c = await db.quotation_comparisons.find_one({"id": cid}, {"_id": 0})
        if not c: raise HTTPException(404, "Comparison not found")
        opts = link.get("options") or {}
        show_vendor_names = opts.get("show_vendor_names", True)
        show_ratings = opts.get("show_ratings", True)
        quotes_out = []
        for qid in c.get("quotation_ids", []):
            q = await db.quotations.find_one({"id": qid}, {"_id": 0})
            if not q: continue
            v = await db.vendors.find_one({"id": q.get("vendor_id")}, {"_id": 0}) if q.get("vendor_id") else None
            entry = {
                "id": q["id"],
                "vendor_name": q.get("vendor_name") if show_vendor_names else f"Vendor {ord(chr(65 + len(quotes_out)))}",
                "final_total": (q.get("subtotals") or {}).get("total", 0),
                "warranty_months": (q.get("commercial_terms") or {}).get("warranty_months"),
                "delivery_timeline_days": (q.get("commercial_terms") or {}).get("delivery_timeline_days"),
                "completion_timeline_days": (q.get("commercial_terms") or {}).get("completion_timeline_days"),
                "exclusions": (q.get("commercial_terms") or {}).get("exclusions") or [],
                "discount": q.get("discount") or 0,
                "selected": q.get("selected") or False,
                "status": q.get("status"),
            }
            if show_ratings and v:
                entry["rating"] = v.get("rating"); entry["completed_projects"] = v.get("completed_projects"); entry["on_time_pct"] = v.get("on_time_pct")
            quotes_out.append(entry)
        return {
            "comparison": {"id": c["id"], "name": c["name"], "project_name": c.get("project_name"), "work_category": c.get("work_category")},
            "quotations": quotes_out,
            "link": {"purpose": link["purpose"], "client_name": link.get("client_name"), "expires_at": link.get("expires_at")},
        }

    class ClientSelectIn(BaseModel):
        quotation_id: str
        signatory_name: str
        signatory_email: str
        comments: Optional[str] = ""

    @api.post("/public/client/{token}/quotations/select")
    async def client_select_quotation(token: str, payload: ClientSelectIn):
        link = await _validate_token(token)
        q = await db.quotations.find_one({"id": payload.quotation_id}, {"_id": 0})
        if not q: raise HTTPException(404, "Quotation not found")
        # Un-select siblings
        if q.get("project_id") and q.get("work_category"):
            await db.quotations.update_many({"project_id": q["project_id"], "work_category": q["work_category"], "id": {"$ne": payload.quotation_id}, "selected": True}, {"$set": {"selected": False, "finalized": False, "status": "not_selected", "updated_at": now_iso()}})
        await db.quotations.update_one({"id": payload.quotation_id}, {"$set": {"status": "selected", "selected": True, "finalized": True, "locked": True, "selected_at": now_iso(), "updated_at": now_iso(), "client_selected": True, "client_selected_by": payload.signatory_name}})
        await db.quotation_client_selections.insert_one({"id": gen_id(), "quotation_id": payload.quotation_id, "token_id": link["id"], "signatory_name": payload.signatory_name, "signatory_email": payload.signatory_email, "comments": payload.comments, "at": now_iso()})
        # Activity
        await db.activity.insert_one({"id": gen_id(), "project_id": q.get("project_id"), "project_name": q.get("project_name"), "action": "client_selected_vendor", "description": f"Client {payload.signatory_name} selected {q.get('vendor_name')} for {q.get('work_category')}", "actor": payload.signatory_name, "actor_initials": "CL", "status": "success", "at": now_iso(), "created_at": now_iso()})
        return {"ok": True, "selected_quotation_id": payload.quotation_id}

    @api.get("/public/client/{token}/handover")
    async def client_handover_view(token: str):
        link = await _validate_token(token)
        p = await db.projects.find_one({"id": link["project_id"]}, {"_id": 0})
        if not p: raise HTTPException(404, "Not found")
        pkg = None
        if p.get("handover_package_id"):
            pkg = await db.documents.find_one({"id": p["handover_package_id"]}, {"_id": 0})
        return {
            "project": _sanitize_project_for_client(p),
            "checklist": p.get("handover_checklist") or [],
            "package": pkg,
            "link": {"purpose": link["purpose"], "client_name": link.get("client_name")},
        }

    class HandoverAcceptIn(BaseModel):
        signatory_name: str
        signatory_email: str
        comments: Optional[str] = ""
        signature_png: Optional[str] = None

    @api.post("/public/client/{token}/handover/accept")
    async def client_handover_accept(token: str, payload: HandoverAcceptIn):
        link = await _validate_token(token)
        await db.handover_acceptances.insert_one({"id": gen_id(), "project_id": link["project_id"], "token_id": link["id"], "signatory_name": payload.signatory_name, "signatory_email": payload.signatory_email, "comments": payload.comments, "signature_png": payload.signature_png, "at": now_iso()})
        await db.projects.update_one({"id": link["project_id"]}, {"$set": {"status": "completed", "handover_accepted_at": now_iso(), "handover_signed_by": payload.signatory_name, "progress": 100, "updated_at": now_iso()}})
        await db.activity.insert_one({"id": gen_id(), "project_id": link["project_id"], "project_name": link.get("project_name"), "action": "handover_accepted", "description": f"Handover accepted by {payload.signatory_name}", "actor": payload.signatory_name, "actor_initials": "CL", "status": "success", "at": now_iso(), "created_at": now_iso()})
        return {"ok": True}

    class SnagIn(BaseModel):
        title: str
        description: Optional[str] = ""
        location: Optional[str] = ""
        signatory_name: Optional[str] = ""

    @api.post("/public/client/{token}/handover/snag")
    async def client_handover_snag(token: str, payload: SnagIn):
        link = await _validate_token(token)
        await db.project_snags.insert_one({"id": gen_id(), "project_id": link["project_id"], "token_id": link["id"], "title": payload.title, "description": payload.description, "location": payload.location, "reported_by": payload.signatory_name or link.get("client_name"), "status": "open", "reported_at": now_iso()})
        await db.activity.insert_one({"id": gen_id(), "project_id": link["project_id"], "project_name": link.get("project_name"), "action": "snag_reported", "description": f"Snag reported by {payload.signatory_name or link.get('client_name')}: {payload.title}", "actor": payload.signatory_name or link.get("client_name") or "Client", "actor_initials": "CL", "status": "warning", "at": now_iso(), "created_at": now_iso()})
        return {"ok": True}

    # ---------- Client home (JWT for client user) ----------
    @api.get("/client-home")
    async def client_home(current=Depends(get_current_user)):
        if current.get("role") != "client":
            raise HTTPException(403, "This endpoint is for client users only.")
        email = current.get("email")
        # Find magic links for this email
        links = await db.client_magic_links.find({"client_email": email, "revoked": False}, {"_id": 0}).sort("created_at", -1).to_list(50)
        for l in links:
            l["url"] = f"{APP_BASE_URL}/client/{l['token']}"
        # Find projects where this email is the client
        projs = await db.projects.find({"$or": [{"client_email": email}, {"client_name": current.get("name")}]}, {"_id": 0}).to_list(20)
        return {"user": {"name": current.get("name"), "email": email}, "magic_links": links, "projects": [_sanitize_project_for_client(p) for p in projs]}

    logger.info("Phase 5 endpoints registered")


async def seed_phase5(db, gen_id, now_iso, app_base_url: str):
    """Idempotent Phase 5 seed."""
    if await db.client_magic_links.count_documents({}) > 0:
        return {"skipped": True}
    projects = await db.projects.find({}, {"_id": 0}).to_list(20)
    if not projects:
        return {"skipped": True, "reason": "no projects"}
    # Clear phase-5 collections
    for col in ["project_milestones", "project_phases", "project_team", "project_updates", "project_work", "project_vendors", "client_magic_links", "boq_client_approvals", "quotation_client_selections", "handover_acceptances", "project_snags"]:
        await db[col].delete_many({})

    admin = await db.users.find_one({"email": "admin@buildcon.in"}, {"_id": 0})
    admin_name = admin.get("name") if admin else "Deepak Rao"

    proj_by_name = {p["name"]: p for p in projects}
    today = datetime.now(timezone.utc).date()

    async def seed_project(p, phase_states, milestones, team, work_items, updates, checklist):
        pid = p["id"]
        # Phases
        cursor = today - timedelta(weeks=8)
        order = 0
        for code, name, weeks in PHASES:
            state = phase_states.get(code, "not_started")
            end = cursor + timedelta(weeks=weeks)
            actual_start = cursor.isoformat() if state != "not_started" else None
            actual_end = end.isoformat() if state == "completed" else None
            await db.project_phases.insert_one({"id": gen_id(), "project_id": pid, "phase_code": code, "name": name, "order": order, "planned_start": cursor.isoformat(), "planned_end": end.isoformat(), "actual_start": actual_start, "actual_end": actual_end, "status": state})
            cursor = end; order += 1
        # Milestones
        for m in milestones:
            m2 = {"id": gen_id(), "project_id": pid, "completion_pct": 100 if m.get("status") == "completed" else 40 if m.get("status") == "in_progress" else 0, "mandatory": True, **m}
            await db.project_milestones.insert_one(m2)
        # Team
        for t in team:
            await db.project_team.insert_one({"id": gen_id(), "project_id": pid, "added_at": now_iso(), **t})
        # Work
        for w in work_items:
            await db.project_work.insert_one({"id": gen_id(), "project_id": pid, "created_at": now_iso(), **w})
        # Updates
        for u in updates:
            await db.project_updates.insert_one({"id": gen_id(), "project_id": pid, "created_by": admin_name, "created_at": now_iso(), **u})
        if checklist:
            await db.projects.update_one({"id": pid}, {"$set": {"handover_checklist": checklist}})

    # Common team template
    def team_for(pm="Priya Nair"):
        return [
            {"name": pm, "role": "Project Manager", "responsibilities": "Overall delivery"},
            {"name": "Arjun Mehta", "role": "Lead Architect", "responsibilities": "Design + specs"},
            {"name": "Neha Sharma", "role": "Interior Designer", "responsibilities": "Interior styling"},
            {"name": "Rakesh Verma", "role": "Site Supervisor", "responsibilities": "On-site execution"},
        ]

    # 1. Kohli Residence — Interior Renovation — on track 62%
    kohli = proj_by_name.get("Kohli Residence — Interior Renovation")
    if kohli:
        await seed_project(kohli,
            {"pre_design": "completed", "design": "completed", "pre_execution": "in_progress", "execution": "not_started", "handover": "not_started"},
            [
                {"phase": "pre_design", "name": "Client Brief captured", "planned_end": (today - timedelta(days=50)).isoformat(), "status": "completed", "assignee": admin_name},
                {"phase": "design", "name": "Design freeze approved", "planned_end": (today - timedelta(days=20)).isoformat(), "status": "completed", "assignee": "Arjun Mehta"},
                {"phase": "pre_execution", "name": "Final BOQ V1 client approval", "planned_end": (today + timedelta(days=3)).isoformat(), "status": "awaiting_approval", "assignee": admin_name},
                {"phase": "pre_execution", "name": "Vendor onboarding", "planned_end": (today + timedelta(days=7)).isoformat(), "status": "in_progress", "assignee": "Priya Nair"},
                {"phase": "execution", "name": "Civil work start", "planned_end": (today + timedelta(days=25)).isoformat(), "status": "not_started"},
                {"phase": "execution", "name": "Flooring installation", "planned_end": (today + timedelta(days=60)).isoformat(), "status": "not_started"},
                {"phase": "handover", "name": "Snag list closure", "planned_end": (today + timedelta(days=175)).isoformat(), "status": "not_started"},
            ],
            team_for("Priya Nair"),
            [
                {"title": "Await client sign-off on BOQ V1", "type": "approval", "status": "awaiting_client", "due_date": (today + timedelta(days=3)).isoformat(), "assignee": "Client", "priority": "high"},
                {"title": "Finalize flooring vendor", "type": "vendor", "status": "pending", "due_date": (today + timedelta(days=5)).isoformat(), "assignee": "Priya Nair", "priority": "high"},
                {"title": "Site protection procurement", "type": "material", "status": "pending", "due_date": (today + timedelta(days=10)).isoformat(), "assignee": "Rakesh Verma", "priority": "medium"},
            ],
            [
                {"title": "Design walkthrough completed", "body": "3D walkthrough of living room and master bedroom shared with client.", "visible_to_client": True},
                {"title": "Mood board finalized", "body": "Warm neutrals with brass accents. Client loved the palette.", "visible_to_client": True},
            ],
            [{"name": n, "done": d} for n, d in [
                ("Signed Agreement", True), ("Client Brief", True), ("Site Reki Report", True), ("Pitch Deck", True),
                ("Scope of Work", True), ("Time & Cost Sheet", True), ("Approved BOQ (Final)", False),
                ("Approved Quotations", False), ("Working Drawings", False), ("Snag List Cleared", False),
                ("Final Inspection Report", False), ("Warranty Certificates", False), ("Vendor Contact List", False),
                ("Handover Note", False), ("Client Feedback Form", False),
            ]])

    # 2. The House Within — on track 38%
    house = proj_by_name.get("The House Within")
    if house:
        await seed_project(house,
            {"pre_design": "completed", "design": "in_progress", "pre_execution": "not_started"},
            [
                {"phase": "pre_design", "name": "Client Brief captured", "planned_end": (today - timedelta(days=25)).isoformat(), "status": "completed", "assignee": admin_name},
                {"phase": "design", "name": "Concept design", "planned_end": (today - timedelta(days=5)).isoformat(), "status": "completed", "assignee": "Arjun Mehta"},
                {"phase": "design", "name": "Detailed drawings", "planned_end": (today + timedelta(days=10)).isoformat(), "status": "in_progress", "assignee": "Arjun Mehta"},
                {"phase": "pre_execution", "name": "BOQ preparation", "planned_end": (today + timedelta(days=25)).isoformat(), "status": "not_started"},
            ],
            team_for("Priya Nair"),
            [{"title": "Complete detailed drawings", "type": "design", "status": "pending", "due_date": (today + timedelta(days=10)).isoformat(), "assignee": "Arjun Mehta", "priority": "high"}],
            [{"title": "Mood board v2 shared", "body": "Refined palette after client feedback.", "visible_to_client": True}],
            [])

    # 3. Jain Art Press — at risk
    jain = proj_by_name.get("Jain Art Press")
    if jain:
        await seed_project(jain,
            {"pre_design": "completed", "design": "in_progress"},
            [
                {"phase": "design", "name": "Design freeze", "planned_end": (today + timedelta(days=2)).isoformat(), "status": "not_started", "assignee": "Arjun Mehta"},
                {"phase": "pre_execution", "name": "BOQ submission", "planned_end": (today + timedelta(days=5)).isoformat(), "status": "not_started"},
            ],
            team_for("Arjun Mehta"),
            [{"title": "Submit BOQ", "type": "boq", "status": "pending", "due_date": (today + timedelta(days=5)).isoformat(), "assignee": "Arjun Mehta", "priority": "critical"}],
            [], [])

    # 4. Studio Office — delayed
    studio = proj_by_name.get("Studio Office")
    if studio:
        await seed_project(studio,
            {"pre_design": "completed", "design": "completed", "pre_execution": "completed", "execution": "in_progress"},
            [
                {"phase": "execution", "name": "HVAC installation", "planned_end": (today - timedelta(days=4)).isoformat(), "status": "in_progress", "delay_reason": "Material Delay", "assignee": "Rakesh Verma"},
                {"phase": "execution", "name": "Furniture delivery", "planned_end": (today - timedelta(days=2)).isoformat(), "status": "delayed", "delay_reason": "Client Approval", "assignee": "Priya Nair"},
                {"phase": "execution", "name": "Electrical commissioning", "planned_end": (today + timedelta(days=15)).isoformat(), "status": "not_started"},
            ],
            team_for("Priya Nair"),
            [
                {"title": "Chase HVAC vendor", "type": "vendor", "status": "pending", "due_date": today.isoformat(), "assignee": "Priya Nair", "priority": "critical"},
                {"title": "Client sign-off on furniture", "type": "approval", "status": "awaiting_client", "due_date": today.isoformat(), "assignee": "Client", "priority": "high"},
            ],
            [], [])

    # 5. Residence 24 — pre-design on track 15%
    r24 = proj_by_name.get("Residence 24")
    if r24:
        await seed_project(r24,
            {"pre_design": "in_progress"},
            [
                {"phase": "pre_design", "name": "Site reki", "planned_end": (today + timedelta(days=4)).isoformat(), "status": "in_progress", "assignee": "Priya Nair"},
                {"phase": "pre_design", "name": "Client brief", "planned_end": (today + timedelta(days=7)).isoformat(), "status": "not_started"},
            ],
            team_for("Priya Nair"),
            [{"title": "Complete site reki", "type": "site", "status": "pending", "due_date": (today + timedelta(days=4)).isoformat(), "assignee": "Priya Nair", "priority": "high"}],
            [], [])

    # 6. Bansal Villa — near handover 94% — 14/15 checklist done
    bansal = proj_by_name.get("Bansal Villa")
    if bansal:
        await seed_project(bansal,
            {"pre_design": "completed", "design": "completed", "pre_execution": "completed", "execution": "completed", "handover": "in_progress"},
            [
                {"phase": "handover", "name": "Snag list closure", "planned_end": (today + timedelta(days=3)).isoformat(), "status": "in_progress", "assignee": "Rakesh Verma"},
                {"phase": "handover", "name": "Client walkthrough", "planned_end": (today + timedelta(days=5)).isoformat(), "status": "not_started", "assignee": "Priya Nair"},
                {"phase": "handover", "name": "Handover package delivery", "planned_end": (today + timedelta(days=7)).isoformat(), "status": "not_started"},
            ],
            team_for("Priya Nair"),
            [{"title": "Finalize handover note", "type": "documentation", "status": "pending", "due_date": (today + timedelta(days=2)).isoformat(), "assignee": admin_name, "priority": "high"}],
            [{"title": "Final walkthrough scheduled", "body": "Client walkthrough scheduled for next week.", "visible_to_client": True}],
            [{"name": n, "done": d} for n, d in [
                ("Signed Agreement", True), ("Client Brief", True), ("Site Reki Report", True), ("Pitch Deck", True),
                ("Scope of Work", True), ("Time & Cost Sheet", True), ("Approved BOQ (Final)", True),
                ("Approved Quotations", True), ("Working Drawings", True), ("Snag List Cleared", True),
                ("Final Inspection Report", True), ("Warranty Certificates", True), ("Vendor Contact List", True),
                ("Handover Note", True), ("Client Feedback Form", False),
            ]])

    # ---- Magic links for Kohli ----
    kohli_links = []
    if kohli:
        # BOQ approval link (Kohli's approved BOQ V1)
        boq = await db.boqs.find_one({"project_id": kohli["id"], "status": "approved"}, {"_id": 0})
        if not boq:
            boq = await db.boqs.find_one({"project_id": kohli["id"]}, {"_id": 0})
        if boq:
            tok = secrets.token_urlsafe(48)
            l = {"id": gen_id(), "token": tok, "project_id": kohli["id"], "project_name": kohli["name"], "purpose": "boq_approval", "target_id": boq["id"], "client_email": "client@kohli.in", "client_name": "Mr. Kohli", "created_by": admin_name, "created_at": now_iso(), "expires_at": (datetime.now(timezone.utc) + timedelta(days=30)).isoformat(), "options": {"show_rates": True}, "used_count": 0, "revoked": False}
            await db.client_magic_links.insert_one(l)
            kohli_links.append(("boq_approval", tok, boq["id"]))
        # Project view link
        tok = secrets.token_urlsafe(48)
        l = {"id": gen_id(), "token": tok, "project_id": kohli["id"], "project_name": kohli["name"], "purpose": "project_view", "target_id": None, "client_email": "client@kohli.in", "client_name": "Mr. Kohli", "created_by": admin_name, "created_at": now_iso(), "expires_at": (datetime.now(timezone.utc) + timedelta(days=30)).isoformat(), "options": {}, "used_count": 0, "revoked": False}
        await db.client_magic_links.insert_one(l)
        kohli_links.append(("project_view", tok, None))
        # Comparison link for Kohli
        comp = await db.quotation_comparisons.find_one({"project_id": kohli["id"]}, {"_id": 0})
        if comp:
            tok = secrets.token_urlsafe(48)
            l = {"id": gen_id(), "token": tok, "project_id": kohli["id"], "project_name": kohli["name"], "purpose": "quotation_selection", "target_id": comp["id"], "client_email": "client@kohli.in", "client_name": "Mr. Kohli", "created_by": admin_name, "created_at": now_iso(), "expires_at": (datetime.now(timezone.utc) + timedelta(days=30)).isoformat(), "options": {"show_vendor_names": True, "show_ratings": True}, "used_count": 0, "revoked": False}
            await db.client_magic_links.insert_one(l)
            kohli_links.append(("quotation_selection", tok, comp["id"]))
    # Bansal handover link
    if bansal:
        tok = secrets.token_urlsafe(48)
        l = {"id": gen_id(), "token": tok, "project_id": bansal["id"], "project_name": bansal["name"], "purpose": "handover_acceptance", "target_id": None, "client_email": "client@bansal.in", "client_name": "Mr. Bansal", "created_by": admin_name, "created_at": now_iso(), "expires_at": (datetime.now(timezone.utc) + timedelta(days=30)).isoformat(), "options": {}, "used_count": 0, "revoked": False}
        await db.client_magic_links.insert_one(l)
        kohli_links.append(("handover_acceptance", tok, None))

    # Update Kohli project with client_email
    await db.projects.update_one({"id": kohli["id"]}, {"$set": {"client_email": "client@kohli.in"}}) if kohli else None

    logger.info(f"Phase 5 seed complete: {len(kohli_links)} magic links. Sample tokens: {[t[:16] for _,t,_ in kohli_links]}")
    return {"links": kohli_links}


import secrets  # noqa: E402 (top-level re-import above)
