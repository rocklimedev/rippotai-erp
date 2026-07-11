"""Phase 11 — Backend endpoints for the restructured header pages.
Provides:
  * Per-app org settings (GET/PUT) with defaults
  * Cross-project rollups (status / timeline / milestones / handover)
  * BOQ management surfaces (categories, rate-library, cost-summary, versions-log, exports-log)
  * Activity feed filtered by app
  * Roles and permissions matrix
"""
from datetime import datetime, timezone
from typing import Any, Dict, List
from fastapi import Depends, HTTPException, Query
from pydantic import BaseModel
import uuid

logger = None

DEFAULT_SETTINGS = {
    "boq": {
        "numbering_prefix": "BOQ",
        "numbering_year_digits": 4,
        "numbering_padding": 3,
        "default_currency": "INR",
        "default_tax_pct": 18,
        "misc_pct": 10,
        "auto_approve_below": 0,
        "require_client_signoff": True,
    },
    "projects": {
        "default_phase_order": ["Pre-Design", "Design", "Pre-Execution", "Execution", "Handover"],
        "auto_timeline_status": True,
        "delayed_threshold_days": 3,
        "at_risk_threshold_days": 1,
    },
    "quotations": {
        "numbering_prefix": "QT",
        "numbering_year_digits": 4,
        "numbering_padding": 4,
        "auto_expire_days": 30,
        "require_vendor_esign": False,
        "watermark_draft": True,
    },
    "vendors": {
        "require_verification_docs": True,
        "auto_blacklist_after_declines": 5,
        "default_material_categories": ["Paint","Wiring","Glass","Metal","Tiles","Cement","Sand","Steel","Wood","Flooring","Plumbing Mat","Electrical Mat","Hardware"],
        "default_contractor_categories": ["Labour","Labour Contractor","Civil","Electrician","Plumbing","Painter","Polishing","AC Work","Interior","Carpenter","Mason","Material Contractor"],
    },
    "documents": {
        "max_file_size_mb": 25,
        "allowed_mime_types": ["application/pdf", "image/jpeg", "image/png", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "application/vnd.ms-excel"],
        "auto_include_boq_pdf": True,
        "auto_include_selected_quotation": True,
    },
}

ROLE_MATRIX = [
    { "action": "View dashboards",       "admin": True, "project_manager": True, "architect": True, "estimator": True, "supervisor": True, "client": False },
    { "action": "Create / edit BOQ",     "admin": True, "project_manager": True, "architect": True, "estimator": True, "supervisor": False, "client": False },
    { "action": "Approve BOQ",           "admin": True, "project_manager": True, "architect": False, "estimator": False, "supervisor": False, "client": False },
    { "action": "Create / edit Project", "admin": True, "project_manager": True, "architect": False, "estimator": False, "supervisor": False, "client": False },
    { "action": "Add / edit Vendor",     "admin": True, "project_manager": True, "architect": False, "estimator": False, "supervisor": False, "client": False },
    { "action": "Approve Quotation",     "admin": True, "project_manager": True, "architect": False, "estimator": False, "supervisor": False, "client": False },
    { "action": "Upload document",       "admin": True, "project_manager": True, "architect": True, "estimator": True, "supervisor": True, "client": False },
    { "action": "Manage settings",       "admin": True, "project_manager": False, "architect": False, "estimator": False, "supervisor": False, "client": False },
    { "action": "View client copy",      "admin": True, "project_manager": True, "architect": True, "estimator": True, "supervisor": False, "client": True },
]


class SettingsUpdate(BaseModel):
    values: Dict[str, Any]


def _now():
    return datetime.now(timezone.utc)


def register_phase11(api, db, get_current_user):

    # ---------- Org settings per app ----------
    @api.get("/settings/{app}")
    async def get_settings(app: str, current=Depends(get_current_user)):
        if app not in DEFAULT_SETTINGS:
            raise HTTPException(404, "Unknown app")
        doc = await db.app_settings.find_one({"_id": app})
        values = dict(DEFAULT_SETTINGS[app])
        if doc and doc.get("values"):
            values.update(doc["values"])
        return {"app": app, "values": values, "updated_at": (doc or {}).get("updated_at")}

    @api.put("/settings/{app}")
    async def update_settings(app: str, body: SettingsUpdate, current=Depends(get_current_user)):
        if app not in DEFAULT_SETTINGS:
            raise HTTPException(404, "Unknown app")
        await db.app_settings.update_one(
            {"_id": app},
            {"$set": {"_id": app, "values": body.values, "updated_at": _now().isoformat(), "updated_by": current.get("email")}},
            upsert=True,
        )
        return {"ok": True, "app": app, "values": body.values}

    # ---------- Roles & Permissions ----------
    @api.get("/roles-permissions")
    async def roles_permissions(current=Depends(get_current_user)):
        return {"roles": ["admin", "project_manager", "architect", "estimator", "supervisor", "client"], "matrix": ROLE_MATRIX}

    # ---------- Activity per app ----------
    @api.get("/activity-feed")
    async def activity_feed(
        app: str = Query(None),
        limit: int = Query(50, ge=1, le=200),
        actor: str = Query(None),
        entity: str = Query(None),
        from_date: str = Query(None),
        to_date: str = Query(None),
        current=Depends(get_current_user),
    ):
        q: Dict[str, Any] = {}
        if app:
            q["app"] = app
        if actor:
            q["actor_email"] = actor
        if entity:
            q["entity"] = entity
        if from_date or to_date:
            r = {}
            if from_date: r["$gte"] = from_date
            if to_date: r["$lte"] = to_date
            q["created_at"] = r
        rows = await db.activity.find(q, {"_id": 0}).sort("created_at", -1).to_list(limit)
        return rows

    # ---------- Projects rollups ----------
    @api.get("/projects/status-summary")
    async def projects_status(current=Depends(get_current_user)):
        projects = await db.projects.find({}, {"_id": 0}).to_list(500)
        return [{
            "id": p.get("id"),
            "name": p.get("name"),
            "client": p.get("client_name"),
            "phase": p.get("current_phase") or p.get("phase"),
            "progress": p.get("progress"),
            "timeline_status": p.get("timeline_status") or "on_track",
            "expected_completion": p.get("expected_completion") or p.get("ecd"),
        } for p in projects]

    @api.get("/projects/timeline-all")
    async def projects_timeline_all(current=Depends(get_current_user)):
        projects = await db.projects.find({}, {"_id": 0}).to_list(200)
        out = []
        for p in projects:
            ms = await db.milestones.find({"project_id": p["id"]}, {"_id": 0}).sort("due_at", 1).to_list(50)
            out.append({
                "id": p["id"], "name": p.get("name"), "client": p.get("client_name"),
                "phase": p.get("current_phase") or p.get("phase"),
                "start_date": p.get("start_date"),
                "expected_completion": p.get("expected_completion") or p.get("ecd"),
                "milestones": [{
                    "id": m.get("id"),
                    "title": m.get("title") or m.get("name"),
                    "status": m.get("status"),
                    "due_at": m.get("due_at") or m.get("due_date"),
                } for m in ms],
            })
        return out

    @api.get("/projects/milestones-all")
    async def milestones_all(
        status: str = Query(None), project_id: str = Query(None),
        limit: int = Query(200, ge=1, le=500), current=Depends(get_current_user),
    ):
        q: Dict[str, Any] = {}
        if status: q["status"] = status
        if project_id: q["project_id"] = project_id
        rows = await db.milestones.find(q, {"_id": 0}).sort("due_at", 1).to_list(limit)
        return rows

    @api.get("/projects/handover-overview")
    async def handover_overview(current=Depends(get_current_user)):
        projects = await db.projects.find({}, {"_id": 0}).to_list(200)
        out = []
        for p in projects:
            docs = await db.documents.count_documents({"project_id": p["id"], "status": {"$in": ["approved", "gfc", "final"]}}) if hasattr(db, "documents") else 0
            required = 15
            out.append({
                "project_id": p["id"], "name": p.get("name"),
                "phase": p.get("current_phase") or p.get("phase"),
                "progress": p.get("progress"),
                "documents_available": docs, "documents_required": required,
                "ready_pct": round(min(100, (docs / required) * 100) if required else 0, 1),
            })
        out.sort(key=lambda r: r["ready_pct"], reverse=True)
        return out

    # ---------- BOQ management surfaces ----------
    @api.get("/boq/categories-catalog")
    async def boq_categories_catalog(current=Depends(get_current_user)):
        # Aggregate categories used across all BOQs with usage count + avg subtotal
        rows = await db.boqs.find({}, {"_id": 0, "categories": 1}).to_list(500)
        agg: Dict[str, dict] = {}
        for b in rows:
            for c in (b.get("categories") or []):
                key = c.get("code") or c.get("name") or "Other"
                r = agg.setdefault(key, {"code": c.get("code"), "name": c.get("name") or key, "usage_count": 0, "subtotal_sum": 0.0, "item_count": 0})
                r["usage_count"] += 1
                r["subtotal_sum"] += float(c.get("subtotal") or 0)
                r["item_count"] += len(c.get("items") or [])
        out = list(agg.values())
        for r in out:
            r["avg_subtotal"] = round(r["subtotal_sum"] / max(1, r["usage_count"]), 2)
            r.pop("subtotal_sum")
        out.sort(key=lambda r: r["usage_count"], reverse=True)
        return out

    @api.get("/boq/rate-library")
    async def boq_rate_library(limit: int = Query(200, ge=1, le=1000), current=Depends(get_current_user)):
        # Try dedicated collection first
        rl = await db.rate_library.find({}, {"_id": 0}).to_list(limit) if True else []
        if rl:
            return rl
        # Fallback: derive from BOQ items
        rows = await db.boqs.find({}, {"_id": 0, "categories": 1}).to_list(500)
        seen: Dict[str, dict] = {}
        for b in rows:
            for c in (b.get("categories") or []):
                for it in (c.get("items") or []):
                    key = (it.get("description") or "").strip().lower()
                    if not key:
                        continue
                    r = seen.setdefault(key, {
                        "description": it.get("description"),
                        "unit": it.get("unit"),
                        "category": c.get("name"),
                        "rate_samples": [], "usage_count": 0,
                    })
                    r["usage_count"] += 1
                    if it.get("rate"):
                        r["rate_samples"].append(float(it["rate"]))
        out = []
        for r in seen.values():
            samples = r.pop("rate_samples") or []
            r["avg_rate"] = round(sum(samples) / len(samples), 2) if samples else None
            r["min_rate"] = min(samples) if samples else None
            r["max_rate"] = max(samples) if samples else None
            out.append(r)
        out.sort(key=lambda r: r["usage_count"], reverse=True)
        return out[:limit]

    @api.get("/boq/cost-summary")
    async def boq_cost_summary(current=Depends(get_current_user)):
        rows = await db.boqs.find({}, {"_id": 0}).to_list(500)
        summary = {"total_boqs": len(rows), "total_value": 0.0, "by_status": {}, "by_project": []}
        by_pid: Dict[str, dict] = {}
        for b in rows:
            tv = float(b.get("final_total") or b.get("total_amount") or 0)
            summary["total_value"] += tv
            s = b.get("status") or "draft"
            summary["by_status"][s] = summary["by_status"].get(s, 0) + 1
            pid = b.get("project_id") or "unknown"
            if pid not in by_pid:
                by_pid[pid] = {"project_id": pid, "project_name": b.get("project_name"), "boqs": 0, "total": 0.0}
            by_pid[pid]["boqs"] += 1
            by_pid[pid]["total"] += tv
        summary["by_project"] = sorted(by_pid.values(), key=lambda r: r["total"], reverse=True)
        summary["total_value"] = round(summary["total_value"], 2)
        return summary

    @api.get("/boq/versions-log")
    async def boq_versions_log(limit: int = Query(50, ge=1, le=200), current=Depends(get_current_user)):
        rows = await db.boqs.find({}, {"_id": 0}).sort("updated_at", -1).to_list(limit)
        return [{
            "id": b.get("id"), "boq_number": b.get("boq_number"),
            "project_name": b.get("project_name"), "version": b.get("version"),
            "status": b.get("status"), "final_total": b.get("final_total") or b.get("total_amount"),
            "updated_at": b.get("updated_at"), "parent_version_id": b.get("parent_version_id"),
        } for b in rows]

    @api.get("/boq/exports-log")
    async def boq_exports_log(limit: int = Query(100, ge=1, le=500), current=Depends(get_current_user)):
        rows = await db.boq_exports.find({}, {"_id": 0}).sort("created_at", -1).to_list(limit) if True else []
        return rows or []
