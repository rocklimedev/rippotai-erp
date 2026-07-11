"""Phase F — Calendar, Notes, Tasks apps
Plus PDF thumbnail endpoint for BOQ pre-export preview.

Everything registered from a single register_phase_f() call in server.py.
Each app follows its approved proposal in /app/docs/proposals/.
"""
import io
import uuid
import base64
import logging
from datetime import datetime, timezone, timedelta
from typing import Any, Dict, List, Optional

from fastapi import Depends, HTTPException, Body, Query
from fastapi.responses import Response
from pydantic import BaseModel, Field

log = logging.getLogger(__name__)


def _now(): return datetime.now(timezone.utc).isoformat()
def _now_dt(): return datetime.now(timezone.utc)
def _uid(): return str(uuid.uuid4())


# =======================================================================
# CALENDAR
# =======================================================================
class EventIn(BaseModel):
    title: str
    type: str = "internal_meeting"
    starts_at: str
    ends_at: Optional[str] = None
    all_day: bool = False
    project_id: Optional[str] = None
    location: Optional[str] = ""
    description: Optional[str] = ""
    attendees: List[str] = Field(default_factory=list)
    visibility: str = "internal"
    reminder_minutes: List[int] = Field(default_factory=lambda: [1440, 60])
    connected: Dict[str, Any] = Field(default_factory=dict)


class EventPatch(BaseModel):
    title: Optional[str] = None
    type: Optional[str] = None
    starts_at: Optional[str] = None
    ends_at: Optional[str] = None
    all_day: Optional[bool] = None
    location: Optional[str] = None
    description: Optional[str] = None
    project_id: Optional[str] = None
    attendees: Optional[List[str]] = None
    visibility: Optional[str] = None
    status: Optional[str] = None


# =======================================================================
# NOTES
# =======================================================================
class NoteIn(BaseModel):
    title: str
    body: str = ""
    tags: List[str] = Field(default_factory=list)
    kind: str = "personal"
    project_id: Optional[str] = None
    shared_with_user_ids: List[str] = Field(default_factory=list)
    pinned: bool = False
    is_template: bool = False
    visibility: str = "team"
    attachments: List[Dict[str, Any]] = Field(default_factory=list)


class NotePatch(BaseModel):
    title: Optional[str] = None
    body: Optional[str] = None
    tags: Optional[List[str]] = None
    kind: Optional[str] = None
    project_id: Optional[str] = None
    shared_with_user_ids: Optional[List[str]] = None
    pinned: Optional[bool] = None
    is_template: Optional[bool] = None
    visibility: Optional[str] = None


# =======================================================================
# TASKS
# =======================================================================
class TaskIn(BaseModel):
    title: str
    description: str = ""
    assignee_id: Optional[str] = None
    assignee_name: Optional[str] = None
    project_id: Optional[str] = None
    priority: str = "medium"
    status: str = "todo"
    due_date: Optional[str] = None
    dependencies: List[str] = Field(default_factory=list)
    recurring: Optional[Dict[str, Any]] = None
    workload_estimate_hours: float = 0.0
    requires_approval: bool = False
    visibility: str = "internal"


class TaskPatch(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    assignee_id: Optional[str] = None
    assignee_name: Optional[str] = None
    project_id: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    due_date: Optional[str] = None
    dependencies: Optional[List[str]] = None
    blocked_reason: Optional[str] = None
    workload_estimate_hours: Optional[float] = None
    requires_approval: Optional[bool] = None
    due_bucket: Optional[str] = None
    order_index: Optional[float] = None


TASK_STATUS_FLOW = {"todo", "in_progress", "blocked", "awaiting_approval", "completed"}
TASK_BUCKETS = ("today", "this_week", "month", "year")


def compute_due_bucket(due_date_iso: Optional[str]) -> str:
    """Map a due_date to today/this_week/month/year bucket."""
    if not due_date_iso:
        return "year"
    try:
        d = datetime.fromisoformat(due_date_iso.replace("Z", "+00:00"))
    except Exception:
        return "year"
    now = _now_dt()
    today = now.replace(hour=0, minute=0, second=0, microsecond=0)
    if d.date() == today.date():
        return "today"
    # end of current week (Sun)
    days_to_sunday = (6 - today.weekday()) % 7
    week_end = today + timedelta(days=days_to_sunday, hours=23, minutes=59)
    if today <= d <= week_end:
        return "this_week"
    # end of current month
    if d.year == today.year and d.month == today.month:
        return "month"
    # end of current year
    if d.year == today.year:
        return "year"
    return "year"


def register_phase_f(api, db, get_current_user):

    # =============================== CALENDAR ===============================
    async def _log_activity(actor, action, target, extra=None):
        await db.activity.insert_one({
            "id": _uid(), "actor": actor, "action": action, "target": target,
            "at": _now(), "status": "info", **(extra or {}),
        })

    @api.get("/calendar/events")
    async def list_events(
        project_id: Optional[str] = None,
        type: Optional[str] = None,
        from_: Optional[str] = Query(None, alias="from"),
        to: Optional[str] = None,
        my: bool = False,
        limit: int = 300,
        current=Depends(get_current_user),
    ):
        q: Dict[str, Any] = {}
        if project_id: q["project_id"] = project_id
        if type: q["type"] = type
        if my: q["attendees"] = {"$in": [current.get("email")]}
        if from_: q["starts_at"] = {"$gte": from_}
        if to: q.setdefault("starts_at", {})["$lte"] = to
        rows = await db.calendar_events.find(q, {"_id": 0}).sort("starts_at", 1).to_list(limit)
        return rows

    @api.post("/calendar/events")
    async def create_event(body: EventIn, current=Depends(get_current_user)):
        proj = None
        if body.project_id:
            proj = await db.projects.find_one({"id": body.project_id}, {"_id": 0})
        doc = body.model_dump()
        doc.update({
            "id": _uid(),
            "project_name": proj.get("name") if proj else None,
            "organiser": current.get("name"),
            "organiser_email": current.get("email"),
            "status": "scheduled",
            "source": "manual",
            "created_by": current.get("email"),
            "created_at": _now(), "updated_at": _now(),
        })
        await db.calendar_events.insert_one(doc.copy())
        await _log_activity(current.get("name"), "created event", doc["title"], {"project_id": doc.get("project_id")})
        doc.pop("_id", None)
        return doc

    @api.patch("/calendar/events/{eid}")
    async def patch_event(eid: str, body: EventPatch, current=Depends(get_current_user)):
        upd = {k: v for k, v in body.model_dump(exclude_unset=True).items()}
        upd["updated_at"] = _now()
        r = await db.calendar_events.update_one({"id": eid}, {"$set": upd})
        if not r.matched_count: raise HTTPException(404, "Event not found")
        return {"ok": True}

    @api.delete("/calendar/events/{eid}")
    async def delete_event(eid: str, current=Depends(get_current_user)):
        await db.calendar_events.delete_one({"id": eid})
        return {"ok": True}

    @api.get("/calendar/dashboard")
    async def calendar_dashboard(current=Depends(get_current_user)):
        now = _now_dt()
        week = (now + timedelta(days=7)).isoformat()
        today_end = now.replace(hour=23, minute=59, second=59).isoformat()
        today_events = await db.calendar_events.find({"starts_at": {"$gte": now.isoformat(), "$lte": today_end}}, {"_id": 0}).sort("starts_at", 1).to_list(20)
        upcoming = await db.calendar_events.find({"starts_at": {"$gte": now.isoformat(), "$lte": week}}, {"_id": 0}).sort("starts_at", 1).to_list(20)
        total = await db.calendar_events.count_documents({})
        return {"today": today_events, "upcoming": upcoming, "total": total}

    # =============================== NOTES ===============================
    @api.get("/notes")
    async def list_notes(
        project_id: Optional[str] = None,
        kind: Optional[str] = None,
        pinned: Optional[bool] = None,
        q: Optional[str] = None,
        is_template: Optional[bool] = None,
        limit: int = 200,
        current=Depends(get_current_user),
    ):
        query: Dict[str, Any] = {"is_archived": {"$ne": True}}
        if project_id: query["project_id"] = project_id
        if kind: query["kind"] = kind
        if pinned is not None: query["pinned"] = pinned
        if is_template is not None: query["is_template"] = is_template
        if q: query["$or"] = [{"title": {"$regex": q, "$options": "i"}}, {"body": {"$regex": q, "$options": "i"}}]
        rows = await db.notes.find(query, {"_id": 0}).sort([("pinned", -1), ("updated_at", -1)]).to_list(limit)
        return rows

    @api.post("/notes")
    async def create_note(body: NoteIn, current=Depends(get_current_user)):
        proj = None
        if body.project_id: proj = await db.projects.find_one({"id": body.project_id}, {"_id": 0})
        doc = body.model_dump()
        doc.update({
            "id": _uid(),
            "project_name": proj.get("name") if proj else None,
            "author": current.get("name"),
            "author_email": current.get("email"),
            "is_archived": False,
            "created_at": _now(), "updated_at": _now(),
        })
        await db.notes.insert_one(doc.copy())
        await _log_activity(current.get("name"), "created note", doc["title"], {"project_id": doc.get("project_id")})
        doc.pop("_id", None)
        return doc

    @api.get("/notes/{nid}")
    async def get_note(nid: str, current=Depends(get_current_user)):
        n = await db.notes.find_one({"id": nid}, {"_id": 0})
        if not n: raise HTTPException(404, "Note not found")
        return n

    @api.patch("/notes/{nid}")
    async def patch_note(nid: str, body: NotePatch, current=Depends(get_current_user)):
        upd = {k: v for k, v in body.model_dump(exclude_unset=True).items()}
        upd["updated_at"] = _now()
        r = await db.notes.update_one({"id": nid}, {"$set": upd})
        if not r.matched_count: raise HTTPException(404, "Note not found")
        return {"ok": True}

    @api.post("/notes/{nid}/pin")
    async def pin_note(nid: str, current=Depends(get_current_user)):
        n = await db.notes.find_one({"id": nid}, {"_id": 0})
        if not n: raise HTTPException(404, "Note not found")
        new_v = not bool(n.get("pinned"))
        await db.notes.update_one({"id": nid}, {"$set": {"pinned": new_v, "updated_at": _now()}})
        return {"ok": True, "pinned": new_v}

    @api.delete("/notes/{nid}")
    async def archive_note(nid: str, current=Depends(get_current_user)):
        await db.notes.update_one({"id": nid}, {"$set": {"is_archived": True, "updated_at": _now()}})
        return {"ok": True}

    @api.get("/notes-dashboard")
    async def notes_dashboard(current=Depends(get_current_user)):
        recent = await db.notes.find({"is_archived": {"$ne": True}}, {"_id": 0}).sort("updated_at", -1).to_list(6)
        pinned = await db.notes.find({"is_archived": {"$ne": True}, "pinned": True}, {"_id": 0}).sort("updated_at", -1).to_list(6)
        total = await db.notes.count_documents({"is_archived": {"$ne": True}})
        return {"recent": recent, "pinned": pinned, "total": total}

    # =============================== TASKS ===============================
    @api.get("/tasks")
    async def list_tasks(
        assignee_email: Optional[str] = None,
        project_id: Optional[str] = None,
        status: Optional[str] = None,
        priority: Optional[str] = None,
        due_before: Optional[str] = None,
        my: bool = False,
        limit: int = 300,
        current=Depends(get_current_user),
    ):
        query: Dict[str, Any] = {"is_archived": {"$ne": True}}
        if my: query["assignee_email"] = current.get("email")
        if assignee_email: query["assignee_email"] = assignee_email
        if project_id: query["project_id"] = project_id
        if status: query["status"] = status
        if priority: query["priority"] = priority
        if due_before: query["due_date"] = {"$lte": due_before}
        rows = await db.tasks.find(query, {"_id": 0}).sort([("order_index", 1), ("due_date", 1), ("priority", -1)]).to_list(limit)
        # Enrich with due_bucket if missing (in-memory)
        for r in rows:
            if not r.get("due_bucket"):
                r["due_bucket"] = compute_due_bucket(r.get("due_date"))
        return rows

    @api.get("/tasks/board")
    async def tasks_board(current=Depends(get_current_user)):
        """Bucketed view for the /tasks 4-column kanban."""
        rows = await db.tasks.find({"is_archived": {"$ne": True}, "status": {"$ne": "completed"}}, {"_id": 0}).sort([("order_index", 1), ("due_date", 1)]).to_list(500)
        board = {b: [] for b in TASK_BUCKETS}
        for r in rows:
            b = r.get("due_bucket") or compute_due_bucket(r.get("due_date"))
            if b not in board: b = "year"
            board[b].append(r)
        return board

    @api.post("/tasks")
    async def create_task(body: TaskIn, current=Depends(get_current_user)):
        if body.status not in TASK_STATUS_FLOW:
            raise HTTPException(400, "Invalid status")
        proj = None
        if body.project_id: proj = await db.projects.find_one({"id": body.project_id}, {"_id": 0})
        doc = body.model_dump()
        # Compute due_bucket + order_index for the 4-column board
        bucket = compute_due_bucket(doc.get("due_date"))
        max_idx = 0
        async for r in db.tasks.find({"due_bucket": bucket}, {"_id": 0, "order_index": 1}).sort("order_index", -1).limit(1):
            max_idx = r.get("order_index") or 0
        doc.update({
            "id": _uid(),
            "project_name": proj.get("name") if proj else None,
            "assignee_email": doc.get("assignee_id"),
            "reporter": current.get("name"),
            "reporter_email": current.get("email"),
            "blocked_reason": None, "completed_at": None,
            "due_bucket": bucket, "order_index": max_idx + 1,
            "is_archived": False,
            "created_at": _now(), "updated_at": _now(),
        })
        await db.tasks.insert_one(doc.copy())
        await _log_activity(current.get("name"), "created task", doc["title"], {"project_id": doc.get("project_id")})
        doc.pop("_id", None)
        return doc

    @api.patch("/tasks/{tid}")
    async def patch_task(tid: str, body: TaskPatch, current=Depends(get_current_user)):
        cur = await db.tasks.find_one({"id": tid}, {"_id": 0})
        if not cur: raise HTTPException(404, "Task not found")
        upd = {k: v for k, v in body.model_dump(exclude_unset=True).items()}
        if "status" in upd:
            if upd["status"] not in TASK_STATUS_FLOW:
                raise HTTPException(400, "Invalid status")
            if upd["status"] == "completed":
                upd["completed_at"] = _now()
                # Auto-clone recurring
                rec = cur.get("recurring") or {}
                if rec.get("interval"):
                    interval = rec.get("interval")  # daily|weekly|monthly
                    base_due = datetime.fromisoformat((cur.get("due_date") or _now()).replace("Z", "+00:00")) if cur.get("due_date") else _now_dt()
                    delta = {"daily": timedelta(days=1), "weekly": timedelta(days=7), "monthly": timedelta(days=30)}.get(interval, timedelta(days=7))
                    new_due = (base_due + delta).isoformat()
                    clone = {**cur, "id": _uid(), "status": "todo", "completed_at": None,
                             "due_date": new_due, "created_at": _now(), "updated_at": _now()}
                    clone.pop("_id", None)
                    await db.tasks.insert_one(clone)
        upd["updated_at"] = _now()
        if "assignee_id" in upd: upd["assignee_email"] = upd["assignee_id"]
        await db.tasks.update_one({"id": tid}, {"$set": upd})
        return {"ok": True}

    @api.delete("/tasks/{tid}")
    async def archive_task(tid: str, current=Depends(get_current_user)):
        await db.tasks.update_one({"id": tid}, {"$set": {"is_archived": True, "updated_at": _now()}})
        return {"ok": True}

    @api.get("/tasks/dashboard")
    async def tasks_dashboard(current=Depends(get_current_user)):
        now = _now_dt()
        today_end = now.replace(hour=23, minute=59, second=59).isoformat()
        me = current.get("email")
        due_today = await db.tasks.count_documents({"is_archived": {"$ne": True}, "status": {"$ne": "completed"}, "due_date": {"$lte": today_end, "$gte": now.replace(hour=0,minute=0,second=0).isoformat()}})
        overdue = await db.tasks.count_documents({"is_archived": {"$ne": True}, "status": {"$ne": "completed"}, "due_date": {"$lt": now.replace(hour=0,minute=0,second=0).isoformat()}})
        blocked = await db.tasks.count_documents({"status": "blocked", "is_archived": {"$ne": True}})
        mine = await db.tasks.find({"assignee_email": me, "is_archived": {"$ne": True}, "status": {"$ne": "completed"}}, {"_id": 0}).sort("due_date", 1).to_list(8)
        # workload by assignee
        pipeline = [
            {"$match": {"is_archived": {"$ne": True}, "status": {"$ne": "completed"}}},
            {"$group": {"_id": "$assignee_name", "hours": {"$sum": "$workload_estimate_hours"}, "count": {"$sum": 1}}},
            {"$sort": {"hours": -1}}, {"$limit": 8},
        ]
        workload = []
        async for r in db.tasks.aggregate(pipeline):
            workload.append({"assignee": r["_id"] or "Unassigned", "hours": r["hours"], "count": r["count"]})
        return {"due_today": due_today, "overdue": overdue, "blocked": blocked, "mine": mine, "workload": workload}

    # =============================== PDF THUMBNAIL ===============================
    _THUMB_CACHE: Dict[str, Dict[str, Any]] = {}

    @api.post("/boqs/{boq_id}/export/pdf-thumbnail")
    async def boq_pdf_thumbnail(boq_id: str, variant: str = "internal", current=Depends(get_current_user)):
        cache_key = f"{boq_id}:{variant}"
        entry = _THUMB_CACHE.get(cache_key)
        now_ts = datetime.now(timezone.utc).timestamp()
        if entry and (now_ts - entry["at"]) < 60:
            return Response(content=entry["png"], media_type="image/png", headers={"X-Cache": "hit"})
        # Generate PDF (reusing phase7 pipeline)
        try:
            from phase7_pdf_v2 import (
                _register_fonts, _masthead, _category_table, _totals_block,
                _terms_block, _signatures, _footer_maker,
            )
            from reportlab.lib.pagesizes import A4
            from reportlab.lib.units import mm
            from reportlab.platypus import SimpleDocTemplate, Spacer
            _register_fonts()
            # Use existing _full_boq via db lookup
            boq = await db.boqs.find_one({"id": boq_id}, {"_id": 0})
            if not boq: raise HTTPException(404, "BOQ not found")
            # Load categories + items grouped
            cats = await db.boq_categories.find({"boq_id": boq_id}, {"_id": 0}).sort("order", 1).to_list(50)
            items = await db.boq_items.find({"boq_id": boq_id}, {"_id": 0}).sort("order", 1).to_list(500)
            grouped: Dict[str, list] = {}
            for it in items:
                grouped.setdefault(it.get("category_id"), []).append(it)
            for c in cats:
                c["items"] = grouped.get(c.get("id"), [])
            boq["categories"] = cats
            boq["items"] = items
            proj = await db.projects.find_one({"id": boq.get("project_id")}, {"_id": 0}) or {}
            buf = io.BytesIO()
            _doc = SimpleDocTemplate(buf, pagesize=A4, leftMargin=15*mm, rightMargin=15*mm, topMargin=15*mm, bottomMargin=20*mm)
            story = list(_masthead(boq, proj, variant, True))
            cols = ["sno","desc","loc","unit","qty","rate","type","amt"] if variant in ("internal","client") else ["sno","desc","loc","unit","qty","type"]
            show_rates = variant in ("internal","client")
            for c in cats:
                if not c.get("items"): continue
                story.append(_category_table(c, cols, True, show_rates))
                story.append(Spacer(1, 3*mm))
            story.extend(_totals_block(boq, show_rates))
            story.extend(_terms_block(boq))
            story.extend(_signatures(proj))
            draw = _footer_maker(boq.get("boq_number") or "BOQ", boq.get("version", 1), variant)
            _doc.build(story, onFirstPage=draw, onLaterPages=draw)
            pdf_bytes = buf.getvalue()
            # Render page 1 via PyMuPDF
            import fitz
            pdoc = fitz.open(stream=pdf_bytes, filetype="pdf")
            page = pdoc.load_page(0)
            mat = fitz.Matrix(1.2, 1.2)
            pix = page.get_pixmap(matrix=mat)
            png = pix.tobytes("png")
            pdoc.close()
            _THUMB_CACHE[cache_key] = {"png": png, "at": now_ts}
            return Response(content=png, media_type="image/png", headers={"X-Cache": "miss", "X-Size": str(len(png))})
        except Exception as e:
            log.warning(f"pdf-thumbnail failed for {boq_id}/{variant}: {e}")
            raise HTTPException(500, f"Preview unavailable: {e}")

    # =============================== STARTUP SEED ===============================
    async def seed_phase_f():
        # Calendar — auto-populate from milestones + quotations + seed some
        existing_ev = await db.calendar_events.count_documents({})
        # Idempotent: derive-from source
        # Milestones → milestone_due
        async for m in db.milestones.find({}, {"_id": 0}):
            if not m.get("due_date"): continue
            if await db.calendar_events.find_one({"source_id": m.get("id"), "source_type": "milestone"}):
                continue
            await db.calendar_events.insert_one({
                "id": _uid(), "title": f"Milestone due — {m.get('title','')}",
                "type": "milestone_due", "starts_at": m.get("due_date"),
                "ends_at": m.get("due_date"), "all_day": True,
                "project_id": m.get("project_id"), "project_name": m.get("project_name"),
                "organiser": m.get("owner") or "Studio", "attendees": [],
                "visibility": "internal", "status": "scheduled",
                "source": "milestone", "source_type": "milestone", "source_id": m.get("id"),
                "created_at": _now(), "updated_at": _now(),
            })
        # Quotations validity → deadline
        async for q in db.quotations.find({}, {"_id": 0}):
            vu = q.get("valid_until")
            if not vu: continue
            if await db.calendar_events.find_one({"source_id": q.get("id"), "source_type": "quotation"}):
                continue
            await db.calendar_events.insert_one({
                "id": _uid(),
                "title": f"Quotation validity — {q.get('quotation_number') or q.get('title','')}",
                "type": "quotation_deadline", "starts_at": vu, "ends_at": vu, "all_day": True,
                "project_id": q.get("project_id"), "project_name": q.get("project_name"),
                "organiser": "System", "attendees": [], "visibility": "internal",
                "status": "scheduled",
                "source": "quotation", "source_type": "quotation", "source_id": q.get("id"),
                "created_at": _now(), "updated_at": _now(),
            })
        # Seed manual events if <8
        cnt = await db.calendar_events.count_documents({})
        if cnt < 8:
            projs = await db.projects.find({}, {"_id": 0}).to_list(6)
            base = _now_dt()
            samples = [
                ("Client meeting — Design review", "client_meeting", 1, "Studio · Delhi"),
                ("Site visit", "site_visit", 3, "Site"),
                ("Vendor call — Flooring quotes", "vendor_call", 2, "Zoom"),
                ("Weekly team sync", "internal_meeting", 4, "Studio"),
                ("Presentation to client", "presentation", 6, "Client Office"),
            ]
            for i, (title, typ, day_off, loc) in enumerate(samples):
                proj = projs[i % max(len(projs), 1)] if projs else {}
                await db.calendar_events.insert_one({
                    "id": _uid(), "title": title, "type": typ,
                    "starts_at": (base + timedelta(days=day_off, hours=10 + i)).isoformat(),
                    "ends_at": (base + timedelta(days=day_off, hours=11 + i)).isoformat(),
                    "all_day": False,
                    "project_id": proj.get("id"), "project_name": proj.get("name"),
                    "organiser": "Deepak Rao", "attendees": ["admin@buildcon.in"],
                    "location": loc, "description": "", "visibility": "internal",
                    "status": "scheduled", "source": "seed",
                    "created_at": _now(), "updated_at": _now(),
                })
        # Notes seed
        if await db.notes.count_documents({}) == 0:
            projs = await db.projects.find({}, {"_id": 0}).to_list(6)
            samples = [
                ("Kohli design decisions — living room", "design_decision", "Client approved warm oak floor + matte black hardware. Reject glossy laminates.", ["design","living"], True),
                ("Meeting minutes — Studio Office kick-off", "meeting", "## Attendees\n- Deepak\n- PM Sneha\n## Decisions\n- Timeline: 12 weeks\n- Budget: ₹18L", ["meeting"], True),
                ("Site notes — Bansal Villa", "site", "Ceiling has water stains. Recommend anti-fungal primer before paint.", ["site","paint"], False),
                ("BOQ substitution rationale", "design_decision", "Substituted CP fittings from Kohler to Grohe — 22% lower cost, comparable warranty.", ["boq","cost"], False),
                ("Ideas for The House Within", "personal", "- Curved arch entry\n- Warm limewash walls\n- Fluted teak partition", ["ideas"], False),
                ("Vendor shortlist — Painting", "personal", "1. Prism Paints — good for texture\n2. Berger Xpress — fast\n3. Local: Rakesh (fallback)", ["vendors"], False),
            ]
            for i, (title, kind, body, tags, pinned) in enumerate(samples):
                proj = projs[i % max(len(projs), 1)] if projs else {}
                await db.notes.insert_one({
                    "id": _uid(), "title": title, "body": body, "tags": tags, "kind": kind,
                    "project_id": proj.get("id"), "project_name": proj.get("name"),
                    "author": "Deepak Rao", "author_email": "admin@buildcon.in",
                    "shared_with_user_ids": [], "pinned": pinned, "is_template": False,
                    "visibility": "team", "attachments": [],
                    "is_archived": False,
                    "created_at": _now(), "updated_at": _now(),
                })
        # Tasks seed
        if await db.tasks.count_documents({}) == 0:
            projs = await db.projects.find({}, {"_id": 0}).to_list(6)
            base = _now_dt()
            samples = [
                ("Submit BOQ — Jain Art Press", "high", "todo", 2, "Deepak Rao", "admin@buildcon.in", 3.0, False),
                ("Finalise Site Reki — Residence 24", "high", "in_progress", 4, "Priya Menon", "priya@buildcon.in", 4.0, False),
                ("Upload Scope of Work — Studio Office", "medium", "todo", 5, "Neha Kapoor", "neha@buildcon.in", 2.0, True),
                ("Client Brief follow-up — The House Within", "medium", "awaiting_approval", 1, "Deepak Rao", "admin@buildcon.in", 1.5, True),
                ("Blocked: Awaiting Grohe stock update", "medium", "blocked", 6, "Arjun Nair", "arjun@buildcon.in", 0.5, False),
                ("Weekly PM sync (recurring)", "low", "todo", 1, "Deepak Rao", "admin@buildcon.in", 1.0, False),
                ("Overdue: Vendor quotation review", "critical", "todo", -2, "Deepak Rao", "admin@buildcon.in", 2.0, False),
                ("Prepare handover checklist — Bansal Villa", "high", "in_progress", 7, "Priya Menon", "priya@buildcon.in", 5.0, True),
            ]
            for i, (title, priority, status, day_off, assignee, email, hours, req_appr) in enumerate(samples):
                proj = projs[i % max(len(projs), 1)] if projs else {}
                rec = {"interval": "weekly"} if "recurring" in title else None
                blocked_reason = "Awaiting vendor confirmation" if status == "blocked" else None
                await db.tasks.insert_one({
                    "id": _uid(), "title": title, "description": "",
                    "assignee_id": email, "assignee_email": email, "assignee_name": assignee,
                    "project_id": proj.get("id"), "project_name": proj.get("name"),
                    "priority": priority, "status": status,
                    "due_date": (base + timedelta(days=day_off)).isoformat(),
                    "dependencies": [], "recurring": rec,
                    "workload_estimate_hours": hours,
                    "requires_approval": req_appr,
                    "blocked_reason": blocked_reason,
                    "reporter": "Deepak Rao", "reporter_email": "admin@buildcon.in",
                    "completed_at": None, "visibility": "internal",
                    "is_archived": False,
                    "created_at": _now(), "updated_at": _now(),
                })
        log.info("Phase F seeding complete.")

    return seed_phase_f
