"""
INOS Phase D — Editable per-app dashboards.
Widget registry (server-side metadata) + user_dashboard_layouts persistence.
"""
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

# Widget metadata — must stay in sync with frontend registry keys.
# category: Recommended | Recently Used | App Data | Project Data | Personal Work | Alerts | Reports
# sizes: subset of small|medium|large|full
_W = lambda key, name, cat, sizes, default, permission="app.read", cross_app=False, required=False, description="": {
    "key": key, "name": name, "category": cat, "sizes": sizes, "defaultSize": default,
    "requiredPermission": permission, "cross_app": cross_app, "locked_required": required,
    "description": description,
}

WIDGETS: Dict[str, List[Dict[str, Any]]] = {
    "boq": [
        _W("boq.total_boqs",           "Total BOQs",              "App Data",  ["small"],           "small",  "boq.read"),
        _W("boq.draft_boqs",           "Draft BOQs",              "App Data",  ["small"],           "small",  "boq.read"),
        _W("boq.awaiting_approval",    "Pending Approval",        "Alerts",    ["small"],           "small",  "boq.read",  required=True),
        _W("boq.approved_boqs",        "Approved BOQs",           "App Data",  ["small"],           "small",  "boq.read"),
        _W("boq.value_trend",          "BOQ Value Trend",         "Charts",    ["large","full"],    "large",  "boq.read"),
        _W("boq.status_donut",         "BOQs by Status",          "Charts",    ["medium","large"],  "medium", "boq.read"),
        _W("boq.monthly_volume",       "Monthly BOQ Volume",      "Charts",    ["medium","large"],  "medium", "boq.read"),
        _W("boq.project_wise",         "Project-Wise BOQs",       "App Data",  ["medium","large"],  "medium", "boq.read"),
        _W("boq.recently_edited",      "Recently Edited BOQs",    "Personal Work", ["medium"],      "medium", "boq.read"),
        _W("boq.attention_items",      "Items Requiring Attention","Alerts",   ["medium"],          "medium", "boq.read"),
        _W("boq.value_summary",        "BOQ Value Summary",       "App Data",  ["medium"],          "medium", "boq.read"),
    ],
    "projects": [
        _W("projects.total",           "Total Projects",          "App Data",  ["small"], "small"),
        _W("projects.active",          "Active Projects",         "App Data",  ["small"], "small"),
        _W("projects.on_time",         "On-Time Projects",        "App Data",  ["small"], "small"),
        _W("projects.delayed",         "Delayed / At-Risk",       "Alerts",    ["small"], "small", required=True),
        _W("projects.progress_trend",  "Portfolio Progress Trend","Charts",    ["large","full"], "large"),
        _W("projects.phase_donut",     "Projects by Phase",       "Charts",    ["medium","large"], "medium"),
        _W("projects.variance_bar",    "Timeline Variance",       "Charts",    ["medium","large"], "medium"),
        _W("projects.project_wise_progress", "Project-Wise Progress", "Project Data", ["large","full"], "large"),
        _W("projects.upcoming_milestones","Upcoming Milestones",  "Project Data", ["medium"], "medium"),
        _W("projects.handover_readiness","Handover Readiness",    "Project Data", ["medium","large"], "medium"),
    ],
    "vendors": [
        _W("vendors.total",            "Total Vendors",           "App Data",  ["small"], "small"),
        _W("vendors.verified",         "Verified Vendors",        "App Data",  ["small"], "small"),
        _W("vendors.available",        "Available Vendors",       "App Data",  ["small"], "small"),
        _W("vendors.attention",        "Requiring Attention",     "Alerts",    ["small"], "small", required=True),
        _W("vendors.onboarding_trend", "Vendor Onboarding Trend", "Charts",    ["large","full"], "large"),
        _W("vendors.availability_donut","Vendor Availability Mix","Charts",    ["medium","large"], "medium"),
        _W("vendors.category_bar",     "Category-Wise Vendors (Bar)","Charts",["medium","large"], "medium"),
        _W("vendors.category_wise",    "Category-Wise Vendors",   "App Data",  ["medium","large"], "medium"),
        _W("vendors.project_wise",     "Project-Wise Assigned Vendors", "Project Data", ["medium","large"], "medium"),
        _W("vendors.recently_added",   "Recently Added Vendors",  "App Data",  ["medium"], "medium"),
    ],
    "quotations": [
        _W("quot.total",               "Total Estimates",        "App Data",  ["small"], "small"),
        _W("quot.awaiting_approval",   "Pending Approval",        "Alerts",    ["small"], "small", required=True),
        _W("quot.drafts",              "Draft Estimates",        "App Data",  ["small"], "small"),
        _W("quot.selected",            "Selected Estimates",     "App Data",  ["small","medium"], "small"),
        _W("quot.value_trend",         "Estimate Value Trend",   "Charts",    ["large","full"], "large"),
        _W("quot.status_donut",        "Estimates by Status",    "Charts",    ["medium","large"], "medium"),
        _W("quot.variance_bar",        "BOQ vs Estimate Variation","Charts", ["medium","large"], "medium"),
        _W("quot.project_wise",        "Project-Wise Estimates", "App Data",  ["medium","large"], "medium"),
        _W("quot.expiring_soon",       "Estimates Expiring Soon","Alerts",    ["small","medium"], "small"),
        _W("quot.boq_variation",       "BOQ vs Estimate (stat)", "Reports",   ["small","medium"], "small"),
    ],
    # Placeholder apps — stub widgets
    "clients":   [_W("clients.total","Total Clients","App Data",["small"],"small"), _W("clients.recent","Recent Clients","App Data",["medium"],"medium")],
    "calendar":  [_W("calendar.upcoming","Upcoming Events","App Data",["medium"],"medium"), _W("calendar.today","Today","App Data",["small"],"small")],
    "chats":     [_W("chats.unread","Unread Conversations","Alerts",["small"],"small"), _W("chats.mentions","My Mentions","Personal Work",["medium"],"medium")],
    "tasks":     [_W("tasks.due_today","Due Today","Alerts",["small"],"small"), _W("tasks.overdue","Overdue","Alerts",["small"],"small"), _W("tasks.mine","My Tasks","Personal Work",["medium"],"medium")],
    "notes":     [_W("notes.recent","Recent Notes","App Data",["medium"],"medium"), _W("notes.pinned","Pinned","Personal Work",["small"],"small")],
    "documents": [_W("documents.recent","Recent Documents","App Data",["medium"],"medium"), _W("documents.pending","Pending Uploads","Alerts",["small"],"small")],
    "activity":  [_W("activity.recent","Recent Activity","App Data",["large"],"large"), _W("activity.mine","My Activity","Personal Work",["medium"],"medium")],
    "inventory": [_W("inventory.total_items","Total Items","App Data",["small"],"small"), _W("inventory.low_stock","Low Stock","Alerts",["small"],"small")],
}

# Modern 3-row layouts: hero + stat stack, donut + bar chart, table + list
# Phase A3 — Value Trend, Vendor Onboarding, Verified, Requiring Attention, and Clients widgets removed.
DEFAULT_LAYOUTS: Dict[str, List[Dict[str, Any]]] = {
    "boq": [
        {"key": "boq.project_wise",      "x": 0, "y": 0, "w": 8, "h": 4},
        {"key": "boq.total_boqs",        "x": 8, "y": 0, "w": 4, "h": 2},
        {"key": "boq.awaiting_approval", "x": 8, "y": 2, "w": 4, "h": 2},
        {"key": "boq.approved_boqs",     "x": 0, "y": 4, "w": 4, "h": 2},
        {"key": "boq.draft_boqs",        "x": 4, "y": 4, "w": 4, "h": 2},
        {"key": "boq.status_donut",      "x": 0, "y": 6, "w": 6, "h": 4},
        {"key": "boq.monthly_volume",    "x": 6, "y": 6, "w": 6, "h": 4},
        {"key": "boq.recently_edited",   "x": 0, "y": 10, "w": 12, "h": 4},
    ],
    "projects": [
        {"key": "projects.project_wise_progress", "x": 0, "y": 0, "w": 8, "h": 4},
        {"key": "projects.active",         "x": 8, "y": 0, "w": 4, "h": 2},
        {"key": "projects.on_time",        "x": 8, "y": 2, "w": 4, "h": 2},
        {"key": "projects.delayed",        "x": 0, "y": 4, "w": 4, "h": 2},
        {"key": "projects.total",          "x": 4, "y": 4, "w": 4, "h": 2},
        {"key": "projects.phase_donut",    "x": 0, "y": 6, "w": 6, "h": 4},
        {"key": "projects.variance_bar",   "x": 6, "y": 6, "w": 6, "h": 4},
        {"key": "projects.upcoming_milestones",   "x": 0, "y": 10, "w": 12, "h": 4},
    ],
    "vendors": [
        {"key": "vendors.project_wise",     "x": 0, "y": 0, "w": 8, "h": 4},
        {"key": "vendors.total",            "x": 8, "y": 0, "w": 4, "h": 2},
        {"key": "vendors.available",        "x": 8, "y": 2, "w": 4, "h": 2},
        {"key": "vendors.category_bar",     "x": 0, "y": 4, "w": 6, "h": 4},
        {"key": "vendors.availability_donut","x": 6, "y": 4, "w": 6, "h": 4},
        {"key": "vendors.recently_added",   "x": 0, "y": 8, "w": 12, "h": 4},
    ],
    "quotations": [
        {"key": "quot.project_wise",       "x": 0, "y": 0, "w": 8, "h": 4},
        {"key": "quot.total",              "x": 8, "y": 0, "w": 4, "h": 2},
        {"key": "quot.awaiting_approval",  "x": 8, "y": 2, "w": 4, "h": 2},
        {"key": "quot.drafts",             "x": 0, "y": 4, "w": 4, "h": 2},
        {"key": "quot.selected",           "x": 4, "y": 4, "w": 4, "h": 2},
        {"key": "quot.status_donut",       "x": 0, "y": 6, "w": 6, "h": 4},
        {"key": "quot.variance_bar",       "x": 6, "y": 6, "w": 6, "h": 4},
        {"key": "quot.expiring_soon",      "x": 0, "y": 10, "w": 12, "h": 4},
    ],
    "clients":   [{"key":"clients.total","x":0,"y":0,"w":3,"h":2},{"key":"clients.recent","x":3,"y":0,"w":6,"h":3}],
    "calendar":  [{"key":"calendar.today","x":0,"y":0,"w":3,"h":2},{"key":"calendar.upcoming","x":3,"y":0,"w":6,"h":3}],
    "chats":     [{"key":"chats.unread","x":0,"y":0,"w":3,"h":2},{"key":"chats.mentions","x":3,"y":0,"w":6,"h":3}],
    "tasks":     [{"key":"tasks.due_today","x":0,"y":0,"w":3,"h":2},{"key":"tasks.overdue","x":3,"y":0,"w":3,"h":2},{"key":"tasks.mine","x":6,"y":0,"w":6,"h":3}],
    "notes":     [{"key":"notes.pinned","x":0,"y":0,"w":3,"h":2},{"key":"notes.recent","x":3,"y":0,"w":6,"h":3}],
    "documents": [{"key":"documents.pending","x":0,"y":0,"w":3,"h":2},{"key":"documents.recent","x":3,"y":0,"w":6,"h":3}],
    "activity":  [{"key":"activity.mine","x":0,"y":0,"w":6,"h":3},{"key":"activity.recent","x":0,"y":3,"w":12,"h":4}],
    "inventory": [{"key":"inventory.total_items","x":0,"y":0,"w":3,"h":2},{"key":"inventory.low_stock","x":3,"y":0,"w":3,"h":2}],
}


class LayoutItem(BaseModel):
    key: str
    x: int
    y: int
    w: int
    h: int


class DashboardSave(BaseModel):
    layout: List[LayoutItem]
    hidden_keys: List[str] = Field(default_factory=list)


def register_dashboard_routes(api, db, get_current_user):
    """Attach /api/dashboards/{app} routes to the given APIRouter."""

    def required_keys(app: str) -> set:
        return {w["key"] for w in WIDGETS.get(app, []) if w.get("locked_required")}

    def all_keys(app: str) -> set:
        return {w["key"] for w in WIDGETS.get(app, [])}

    @api.get("/dashboards/library/{app}")
    async def get_library(app: str, current=Depends(get_current_user)):
        if app not in WIDGETS:
            raise HTTPException(404, "Unknown app")
        # Client role has no dashboard access to internal apps
        if current.get("role") == "client":
            raise HTTPException(403, "Not allowed")
        return {"app": app, "widgets": WIDGETS[app]}

    @api.get("/dashboards/{app}")
    async def get_dashboard(app: str, current=Depends(get_current_user)):
        if app not in WIDGETS:
            raise HTTPException(404, "Unknown app")
        if current.get("role") == "client":
            raise HTTPException(403, "Not allowed")
        default = DEFAULT_LAYOUTS.get(app, [])
        doc = await db.user_dashboard_layouts.find_one(
            {"user_id": current["id"], "app": app},
            {"_id": 0}
        )
        if doc:
            layout = doc.get("layout") or default
            hidden = doc.get("hidden_keys") or []
        else:
            layout = default
            hidden = []
        # Silently drop widgets that no longer exist
        valid = all_keys(app)
        layout = [i for i in layout if i["key"] in valid]
        return {
            "app": app,
            "layout": layout,
            "hidden_keys": hidden,
            "default_layout": default,
            "required_keys": list(required_keys(app)),
            "personal": bool(doc),
        }

    @api.put("/dashboards/{app}")
    async def save_dashboard(app: str, payload: DashboardSave, current=Depends(get_current_user)):
        if app not in WIDGETS:
            raise HTTPException(404, "Unknown app")
        if current.get("role") == "client":
            raise HTTPException(403, "Not allowed")
        valid = all_keys(app)
        req = required_keys(app)
        keys_in_layout = {i.key for i in payload.layout}
        hidden = set(payload.hidden_keys or [])
        # Validate: unknown keys rejected
        unknown = keys_in_layout - valid
        if unknown:
            raise HTTPException(400, f"Unknown widget keys: {sorted(unknown)}")
        # Validate: required widgets must be present and NOT hidden
        for k in req:
            if k not in keys_in_layout or k in hidden:
                raise HTTPException(400, f"Required widget {k} cannot be hidden")
        doc = {
            "user_id": current["id"],
            "app": app,
            "layout": [i.model_dump() for i in payload.layout],
            "hidden_keys": list(hidden),
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }
        await db.user_dashboard_layouts.update_one(
            {"user_id": current["id"], "app": app},
            {"$set": doc},
            upsert=True,
        )
        return {"ok": True, "saved": True}

    @api.post("/dashboards/{app}/reset")
    async def reset_dashboard(app: str, current=Depends(get_current_user)):
        if app not in WIDGETS:
            raise HTTPException(404, "Unknown app")
        if current.get("role") == "client":
            raise HTTPException(403, "Not allowed")
        await db.user_dashboard_layouts.delete_one({"user_id": current["id"], "app": app})
        return {"ok": True, "layout": DEFAULT_LAYOUTS.get(app, [])}

    # Admin defaults endpoint stub (accept payload, return 501)
    @api.put("/dashboards/{app}/defaults")
    async def set_defaults(app: str, current=Depends(get_current_user)):
        if current.get("role") != "admin":
            raise HTTPException(403, "Admin only")
        raise HTTPException(501, "Admin dashboard defaults UI is coming soon")
