"""
INOS Phase 8 — Widget data endpoints for redesigned dashboards.
All routes are read-only aggregations feeding the "Project-Wise …" widgets
and the small alert/summary cards for BOQ / Quotations / Projects / Vendors.
"""
from datetime import datetime, timezone, timedelta
from typing import Any, Dict, List
from fastapi import Depends, HTTPException, Query


def _num(v, default=0):
    try:
        return float(v or 0)
    except Exception:
        return default


def _iso(v):
    if isinstance(v, datetime):
        return v.astimezone(timezone.utc).isoformat()
    return v


async def _projects_map(db) -> Dict[str, dict]:
    projects = await db.projects.find({}, {"_id": 0}).to_list(500)
    return {p["id"]: p for p in projects}


def register_dashboards_data(api, db, get_current_user):
    """Attach widget data endpoints under /api/dashboards/*."""

    # ---------- BOQ ----------

    @api.get("/dashboards/boq/project-wise")
    async def boq_project_wise(current=Depends(get_current_user)):
        pmap = await _projects_map(db)
        boqs = await db.boqs.find({}, {"_id": 0}).to_list(500)
        by_project: Dict[str, dict] = {}
        for b in boqs:
            pid = b.get("project_id")
            if not pid:
                continue
            row = by_project.setdefault(pid, {
                "project_id": pid,
                "project_name": pmap.get(pid, {}).get("name") or b.get("project_name") or "—",
                "client_name": pmap.get(pid, {}).get("client_name") or b.get("client_name"),
                "boq_count": 0,
                "total_value": 0.0,
                "latest_version": 0,
                "latest_boq_number": None,
                "status": "draft",
                "updated_at": None,
            })
            row["boq_count"] += 1
            row["total_value"] += _num(b.get("final_total") or b.get("total_amount"))
            v_raw = b.get("version") or 1
            try:
                v = int(str(v_raw).lstrip("Vv") or 1)
            except Exception:
                v = 1
            if v >= row["latest_version"]:
                row["latest_version"] = v
                row["latest_boq_number"] = b.get("boq_number")
                row["status"] = b.get("status") or "draft"
            ua = b.get("updated_at")
            if ua and (row["updated_at"] is None or str(ua) > str(row["updated_at"])):
                row["updated_at"] = _iso(ua)
        rows = sorted(by_project.values(), key=lambda r: r["total_value"], reverse=True)[:8]
        return rows

    @api.get("/dashboards/boq/recently-edited")
    async def boq_recently_edited(limit: int = Query(5, ge=1, le=20), current=Depends(get_current_user)):
        boqs = await db.boqs.find({}, {"_id": 0}).sort("updated_at", -1).to_list(limit * 2)
        pmap = await _projects_map(db)
        out = []
        for b in boqs[:limit]:
            out.append({
                "id": b.get("id"),
                "boq_number": b.get("boq_number"),
                "title": b.get("title") or b.get("project_name") or "BOQ",
                "project_name": pmap.get(b.get("project_id"), {}).get("name") or b.get("project_name"),
                "status": b.get("status"),
                "version": b.get("version"),
                "updated_at": _iso(b.get("updated_at")),
            })
        return out

    # ---------- Quotations ----------

    @api.get("/dashboards/quotations/project-wise")
    async def quot_project_wise(current=Depends(get_current_user)):
        pmap = await _projects_map(db)
        quots = await db.quotations.find({}, {"_id": 0}).to_list(500)
        by_project: Dict[str, dict] = {}
        for q in quots:
            pid = q.get("project_id")
            if not pid:
                continue
            row = by_project.setdefault(pid, {
                "project_id": pid,
                "project_name": pmap.get(pid, {}).get("name") or q.get("project_name") or "—",
                "quotation_count": 0,
                "combined_value": 0.0,
                "vendor_ids": set(),
                "selected_quotation_id": None,
                "latest_status": "draft",
            })
            row["quotation_count"] += 1
            row["combined_value"] += _num(q.get("total_amount"))
            if q.get("vendor_id"):
                row["vendor_ids"].add(q["vendor_id"])
            if q.get("status") in ("selected",) or q.get("selected"):
                row["selected_quotation_id"] = q.get("id")
                row["latest_status"] = "selected"
            elif row["latest_status"] != "selected":
                row["latest_status"] = q.get("status") or "draft"
        rows = []
        for r in by_project.values():
            r["vendor_count"] = len(r.pop("vendor_ids"))
            rows.append(r)
        rows.sort(key=lambda r: r["combined_value"], reverse=True)
        return rows[:8]

    @api.get("/dashboards/quotations/expiring-soon")
    async def quot_expiring_soon(within_days: int = Query(7, ge=1, le=60), current=Depends(get_current_user)):
        now = datetime.now(timezone.utc)
        cutoff = now + timedelta(days=within_days)
        quots = await db.quotations.find({}, {"_id": 0}).to_list(500)
        out = []
        for q in quots:
            vd = q.get("validity_until") or q.get("valid_until") or q.get("expires_at")
            if not vd:
                continue
            try:
                dt = datetime.fromisoformat(str(vd).replace("Z", "+00:00"))
            except Exception:
                continue
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
            if now <= dt <= cutoff:
                out.append({
                    "id": q.get("id"),
                    "quotation_number": q.get("quotation_number") or q.get("title"),
                    "vendor_name": q.get("vendor_name"),
                    "project_name": q.get("project_name"),
                    "days_left": (dt - now).days,
                    "validity_until": _iso(dt),
                    "total_amount": _num(q.get("total_amount")),
                })
        out.sort(key=lambda r: r["days_left"])
        return out

    @api.get("/dashboards/quotations/boq-variance")
    async def quot_boq_variance(current=Depends(get_current_user)):
        quots = await db.quotations.find(
            {"status": {"$in": ["approved", "selected"]}}, {"_id": 0}
        ).to_list(500)
        variances: List[float] = []
        for q in quots:
            v = q.get("variation_pct")
            if v is None:
                v = q.get("boq_variation_pct")
            if v is not None:
                variances.append(_num(v))
            elif q.get("boq_total") and q.get("total_amount"):
                boq_t = _num(q["boq_total"])
                if boq_t > 0:
                    variances.append(((_num(q["total_amount"]) - boq_t) / boq_t) * 100)
        if not variances:
            return {"avg_variation_pct": None, "sample_size": 0}
        avg = sum(variances) / len(variances)
        return {"avg_variation_pct": round(avg, 1), "sample_size": len(variances)}

    # ---------- Projects ----------

    @api.get("/dashboards/projects/progress")
    async def projects_progress(current=Depends(get_current_user)):
        projects = await db.projects.find({}, {"_id": 0}).to_list(200)
        # sort: at_risk / delayed first, then by start_date desc
        def _rank(p):
            s = (p.get("timeline_status") or "on_track").lower()
            order = {"delayed": 0, "at_risk": 1, "on_track": 2, "completed": 3}
            return (order.get(s, 4), -( _num(p.get("progress")) ))
        projects.sort(key=_rank)
        out = []
        for p in projects[:6]:
            # find next upcoming milestone
            nm = None
            milestones = await db.milestones.find(
                {"project_id": p["id"], "status": {"$ne": "completed"}}, {"_id": 0}
            ).sort("due_date", 1).to_list(1)
            if milestones:
                nm = milestones[0]
            out.append({
                "project_id": p.get("id"),
                "name": p.get("name"),
                "client": p.get("client_name"),
                "current_phase": p.get("current_phase") or p.get("phase"),
                "progress_pct": int(_num(p.get("progress"))),
                "next_milestone_name": (nm or {}).get("title") or (nm or {}).get("name"),
                "next_milestone_due": _iso((nm or {}).get("due_date")),
                "expected_completion": _iso(p.get("expected_completion") or p.get("ecd")),
                "timeline_status": p.get("timeline_status") or "on_track",
            })
        return out

    @api.get("/dashboards/projects/upcoming-milestones")
    async def projects_upcoming_milestones(limit: int = Query(4, ge=1, le=20), current=Depends(get_current_user)):
        now = datetime.now(timezone.utc).isoformat()
        ms = await db.milestones.find(
            {
                "status": {"$nin": ["completed", "done", "cancelled"]},
                "$or": [{"due_at": {"$gte": now}}, {"due_date": {"$gte": now}}, {"planned_end": {"$gte": now}}],
            },
            {"_id": 0},
        ).to_list(200)
        def _due(m):
            return m.get("due_at") or m.get("due_date") or m.get("planned_end") or ""
        ms.sort(key=_due)
        pmap = await _projects_map(db)
        out = []
        for m in ms[:limit]:
            p = pmap.get(m.get("project_id"), {})
            out.append({
                "id": m.get("id"),
                "project_id": m.get("project_id"),
                "title": m.get("title") or m.get("name"),
                "project_name": p.get("name") or m.get("project_name"),
                "assignee": m.get("assignee") or m.get("owner"),
                "assignee_initials": (m.get("assignee_initials") or (m.get("assignee") or "??")[:2]).upper(),
                "due_date": _iso(_due(m)),
            })
        return out

    # ---------- Vendors ----------

    @api.get("/dashboards/vendors/by-category")
    async def vendors_by_category(current=Depends(get_current_user)):
        vendors = await db.vendors.find({}, {"_id": 0}).to_list(500)
        counts: Dict[str, dict] = {}
        for v in vendors:
            cat = v.get("category") or "Other"
            row = counts.setdefault(cat, {"category": cat, "count": 0, "verified_count": 0, "rating_sum": 0.0, "rating_n": 0})
            row["count"] += 1
            if v.get("verified"):
                row["verified_count"] += 1
            if v.get("rating"):
                row["rating_sum"] += _num(v["rating"])
                row["rating_n"] += 1
        rows = []
        for r in counts.values():
            r["avg_rating"] = round(r["rating_sum"] / r["rating_n"], 2) if r["rating_n"] else None
            r.pop("rating_sum"); r.pop("rating_n")
            rows.append(r)
        rows.sort(key=lambda r: r["count"], reverse=True)
        return rows

    @api.get("/dashboards/vendors/project-wise")
    async def vendors_project_wise(current=Depends(get_current_user)):
        pmap = await _projects_map(db)
        # Two data sources: assignments in project doc, or vendor.projects list
        projects = list(pmap.values())
        vendors = await db.vendors.find({}, {"_id": 0}).to_list(500)
        vmap = {v["id"]: v for v in vendors}
        rows = []
        for p in projects[:12]:
            assigned = p.get("assigned_vendor_ids") or p.get("vendor_ids") or []
            # Fall back to shortlists collection
            if not assigned:
                sl = await db.vendor_shortlists.find({"project_id": p["id"]}, {"_id": 0}).to_list(100)
                assigned = list({vid for x in sl for vid in (x.get("vendor_ids") or [])})
            cats = sorted({vmap.get(vid, {}).get("category") for vid in assigned if vmap.get(vid, {}).get("category")})
            availability = "available"
            for vid in assigned:
                v = vmap.get(vid)
                if v and v.get("availability") in ("busy", "unavailable"):
                    availability = "limited"
                    break
            rows.append({
                "project_id": p["id"],
                "project_name": p.get("name"),
                "assigned_vendor_count": len(assigned),
                "categories": list(cats)[:6],
                "availability_status": availability,
            })
        rows.sort(key=lambda r: r["assigned_vendor_count"], reverse=True)
        return rows[:8]

    @api.get("/dashboards/vendors/requiring-attention")
    async def vendors_attention(current=Depends(get_current_user)):
        now = datetime.now(timezone.utc)
        vendors = await db.vendors.find({}, {"_id": 0}).to_list(500)
        attention: List[dict] = []
        for v in vendors:
            reasons = []
            if not v.get("verified"):
                reasons.append("Verification pending")
            for d in (v.get("documents") or []):
                exp = d.get("expires_at") or d.get("valid_until")
                if exp:
                    try:
                        dt = datetime.fromisoformat(str(exp).replace("Z", "+00:00"))
                        if dt.tzinfo is None:
                            dt = dt.replace(tzinfo=timezone.utc)
                        if dt < now:
                            reasons.append(f"{d.get('type','Document')} expired")
                        elif (dt - now).days <= 30:
                            reasons.append(f"{d.get('type','Document')} expiring soon")
                    except Exception:
                        pass
            if reasons:
                attention.append({
                    "id": v.get("id"),
                    "name": v.get("name"),
                    "category": v.get("category"),
                    "reasons": reasons[:3],
                })
        return {"count": len(attention), "items": attention[:8]}
