"""Phase 9 — Idempotent startup backfills to light up dashboards fully.
Runs once per collection where target field is missing.
"""
import random
import logging
from datetime import datetime, timezone, timedelta

logger = logging.getLogger(__name__)

# Distribution (24 vendors): 4 civil, 3 electrical, 2 plumbing, 3 tiles/sanitaryware,
# 2 paint, 2 false ceiling, 2 modular furniture, 2 carpenters, 1 lighting, 1 HVAC,
# 1 landscape, 1 MEP.
_VENDOR_CATEGORIES = (
    ["Civil"] * 4 +
    ["Electrical"] * 3 +
    ["Plumbing"] * 2 +
    ["Tiles"] * 2 + ["Sanitaryware"] * 1 +
    ["Painting"] * 2 +
    ["False Ceiling"] * 2 +
    ["Modular Furniture"] * 2 +
    ["Carpentry"] * 2 +
    ["Lighting"] * 1 +
    ["HVAC"] * 1 +
    ["Landscape"] * 1 +
    ["MEP"] * 1
)


async def _backfill_vendor_categories(db):
    missing = await db.vendors.count_documents({"$or": [{"category": None}, {"category": {"$exists": False}}, {"category": ""}]})
    if missing == 0:
        return 0
    vendors = await db.vendors.find(
        {"$or": [{"category": None}, {"category": {"$exists": False}}, {"category": ""}]},
        {"_id": 0, "id": 1},
    ).to_list(500)
    cats = list(_VENDOR_CATEGORIES)
    # deterministic shuffle by id hash so re-runs give same result
    vendors.sort(key=lambda v: v["id"])
    updated = 0
    for i, v in enumerate(vendors):
        cat = cats[i % len(cats)]
        await db.vendors.update_one({"id": v["id"]}, {"$set": {"category": cat}})
        updated += 1
    logger.info(f"Phase 9: backfilled category for {updated} vendors")
    return updated


async def _backfill_quotation_validity_and_variance(db):
    quots = await db.quotations.find({}, {"_id": 0}).to_list(500)
    needs_validity = [q for q in quots if not q.get("valid_until") and not q.get("validity_until")]
    needs_variance = [q for q in quots if q.get("boq_variation_pct") is None and q.get("variation_pct") is None]

    now = datetime.now(timezone.utc)
    v_upd = 0

    # If any quotations still need a validity date, set them normally (30d out for most, 4-5d for 3)
    quots_sorted = sorted(quots, key=lambda q: q.get("id") or "")
    expiring_ids_new = {q["id"] for q in quots_sorted[:3]}
    for q in needs_validity:
        try:
            qd = q.get("quotation_date")
            base = datetime.fromisoformat(str(qd).replace("Z", "+00:00")) if qd else now
            if base.tzinfo is None:
                base = base.replace(tzinfo=timezone.utc)
        except Exception:
            base = now
        if q["id"] in expiring_ids_new:
            valid = now + timedelta(days=4 + (v_upd % 2))
        else:
            valid = base + timedelta(days=30)
        await db.quotations.update_one(
            {"id": q["id"]},
            {"$set": {"valid_until": valid.isoformat(), "validity_until": valid.isoformat()}},
        )
        v_upd += 1

    # Also: force at least 3 quotations to expire within 7 days if none currently do
    # (idempotency guard: only run once via a settings flag)
    flag = await db.settings.find_one({"_id": "phase9_expiring_forced"})
    if not flag:
        soon = 0
        for q in quots:
            vu = q.get("valid_until") or q.get("validity_until")
            if not vu:
                continue
            try:
                dt = datetime.fromisoformat(str(vu).replace("Z", "+00:00"))
                if dt.tzinfo is None:
                    dt = dt.replace(tzinfo=timezone.utc)
                if 0 <= (dt - now).days <= 7:
                    soon += 1
            except Exception:
                pass
        if soon < 3:
            # pick 3 deterministic quotations (last 3 by id) and force valid_until
            forced = sorted(quots, key=lambda q: q.get("id") or "", reverse=True)[:3]
            for i, q in enumerate(forced):
                valid = now + timedelta(days=4 + i)  # 4, 5, 6 days out
                await db.quotations.update_one(
                    {"id": q["id"]},
                    {"$set": {"valid_until": valid.isoformat(), "validity_until": valid.isoformat()}},
                )
                v_upd += 1
        await db.settings.update_one(
            {"_id": "phase9_expiring_forced"},
            {"$set": {"_id": "phase9_expiring_forced", "at": now.isoformat()}},
            upsert=True,
        )

    var_upd = 0
    for q in needs_variance:
        # Try quotation_items collection first
        items = await db.quotation_items.find({"quotation_id": q["id"]}, {"_id": 0}).to_list(500)
        variances = []
        for it in items:
            boq_amt = it.get("boq_amount") or it.get("boq_rate")
            quoted = it.get("quoted_amount") or it.get("rate") or it.get("unit_rate")
            if boq_amt and quoted:
                try:
                    b = float(boq_amt); qv = float(quoted)
                    if b > 0:
                        variances.append(((qv - b) / b) * 100)
                except Exception:
                    pass
        if variances:
            avg = sum(variances) / len(variances)
        else:
            # deterministic pseudo-variance: -8% .. +18% based on id
            rng = random.Random(q["id"])
            avg = round(rng.uniform(-8.0, 18.0), 1)
        avg = round(avg, 1)
        await db.quotations.update_one(
            {"id": q["id"]},
            {"$set": {"boq_variation_pct": avg, "variation_pct": avg}},
        )
        var_upd += 1

    logger.info(f"Phase 9: backfilled {v_upd} quotation validities and {var_upd} variances")
    return (v_upd, var_upd)


async def _backfill_upcoming_milestones(db):
    """Ensure at least 4 future-dated, non-completed milestones exist across active projects."""
    now = datetime.now(timezone.utc)
    future = now.isoformat()
    open_upcoming = await db.milestones.count_documents({
        "status": {"$nin": ["completed", "done", "cancelled"]},
        "$or": [{"due_at": {"$gte": future}}, {"due_date": {"$gte": future}}, {"planned_end": {"$gte": future}}],
    })
    if open_upcoming >= 4:
        return 0

    # Pick 4 active projects
    active = await db.projects.find(
        {"$or": [{"status": {"$ne": "completed"}}, {"status": {"$exists": False}}]},
        {"_id": 0, "id": 1, "name": 1},
    ).to_list(20)
    if not active:
        return 0

    target_projects = [p for p in active if p.get("name") in {
        "Kohli Residence — Interior Renovation", "The House Within",
        "Residence 24", "Studio Office", "Jain Art Press", "Bansal Villa",
    }] or active[:6]

    plan = [
        ("Vendor Lock-in — Civil",       2, "Deepak Rao",   "DR", "in_progress"),
        ("Design Sign-off",              4, "Priya Sharma", "PS", "in_progress"),
        ("Site Reki — Electrical",       6, "Arjun Malik",  "AM", "not_started"),
        ("Approve Furniture Mockup",     8, "Neha Kohli",   "NK", "not_started"),
        ("MEP Freeze",                   11, "Deepak Rao",  "DR", "not_started"),
        ("Handover Walkthrough",         14, "Priya Sharma","PS", "not_started"),
    ]
    added = 0
    import uuid
    for i, p in enumerate(target_projects[:6]):
        title, days_ahead, assignee, initials, status = plan[i % len(plan)]
        due = (now + timedelta(days=days_ahead)).isoformat()
        doc = {
            "id": str(uuid.uuid4()),
            "project_id": p["id"],
            "project_name": p.get("name"),
            "title": title,
            "assignee": assignee,
            "assignee_initials": initials,
            "status": status,
            "due_at": due,
            "due_date": due,
            "planned_end": due,
            "created_at": now.isoformat(),
        }
        await db.milestones.insert_one(doc)
        added += 1
    logger.info(f"Phase 9: added {added} upcoming milestones")
    return added


def register_seed_backfill(app, db):
    @app.on_event("startup")
    async def _p9_backfill():
        try:
            v = await _backfill_vendor_categories(db)
            q = await _backfill_quotation_validity_and_variance(db)
            m = await _backfill_upcoming_milestones(db)
            logger.info(f"Phase 9 backfill complete — vendors={v}, quotations={q}, milestones={m}")
        except Exception as e:
            logger.warning(f"Phase 9 backfill error: {e}")
