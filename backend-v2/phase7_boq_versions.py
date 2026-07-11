"""
INOS Phase 4 — BOQ family/version numbering + PDF font hardening.
Registers helper routes and a startup backfill to add boq_family_id + boq_number
to every existing BOQ document.
"""
from __future__ import annotations
import re, uuid, os
from datetime import datetime, timezone
from typing import Any, Dict, List

from fastapi import Depends, HTTPException
from pydantic import BaseModel

STOPWORDS = {"and", "the", "of", "for", "&", "-", "—"}

def project_initials(name: str) -> str:
    if not name:
        return "PRJ"
    # split on non-word except keep ampersand out
    cleaned = re.sub(r"[^A-Za-z ]+", " ", name)
    words = [w for w in cleaned.split() if w and w.lower() not in STOPWORDS]
    if not words:
        return name[:3].upper() or "PRJ"
    if len(words) == 1:
        return words[0][:3].upper()
    letters = [w[0] for w in words if w[0].isalpha()]
    return "".join(letters).upper()[:4] or "PRJ"

def make_boq_number(initials: str, year: int, version: int) -> str:
    return f"BOQ-{initials}-{year}-V{version}"


class NewVersionBody(BaseModel):
    reason: str | None = None
    note: str | None = None


async def backfill(db):
    """Idempotent: add boq_family_id/boq_number/version to existing BOQs."""
    async for pr in db.projects.find({}):
        if not pr.get("initials"):
            await db.projects.update_one({"id": pr["id"]}, {"$set": {"initials": project_initials(pr.get("name",""))}})
    async for b in db.boqs.find({}):
        changed = {}
        if not b.get("boq_family_id"):
            changed["boq_family_id"] = b["id"]
        # Coerce version to int (strip any "V" prefix from legacy string values)
        v = b.get("version")
        if isinstance(v, str):
            m = re.search(r"\d+", v)
            v = int(m.group(0)) if m else 1
        if not isinstance(v, int) or v < 1:
            v = 1
        if v != b.get("version"):
            changed["version"] = v
        # Regenerate boq_number if missing OR looks malformed (contains "VV" or "-V-")
        cur_num = b.get("boq_number") or ""
        if (not cur_num) or ("VV" in cur_num) or cur_num.endswith("-V"):
            proj = await db.projects.find_one({"id": b.get("project_id")})
            initials = (proj or {}).get("initials") or project_initials((proj or {}).get("name",""))
            created = b.get("created_at") or datetime.now(timezone.utc).isoformat()
            try:
                yr = int(str(created)[:4])
            except Exception:
                yr = datetime.now(timezone.utc).year
            changed["boq_number"] = make_boq_number(initials, yr, v)
            changed["boq_year"] = yr
        if changed:
            await db.boqs.update_one({"id": b["id"]}, {"$set": changed})


def register_boq_v2_routes(api, db, get_current_user):
    @api.post("/boqs/{boq_id}/new-version")
    async def new_version(boq_id: str, body: NewVersionBody, current=Depends(get_current_user)):
        src = await db.boqs.find_one({"id": boq_id})
        if not src:
            raise HTTPException(404, "BOQ not found")
        family_id = src.get("boq_family_id") or src["id"]
        year = src.get("boq_year") or int(str(src.get("created_at",""))[:4] or datetime.now(timezone.utc).year)
        proj = await db.projects.find_one({"id": src.get("project_id")})
        initials = (proj or {}).get("initials") or project_initials((proj or {}).get("name",""))
        # compute next version
        highest = 0
        async for x in db.boqs.find({"boq_family_id": family_id}, {"version":1}):
            highest = max(highest, x.get("version") or 1)
        next_v = highest + 1
        new_id = str(uuid.uuid4())
        new_doc = {
            **src,
            "id": new_id,
            "_id": None,
            "boq_family_id": family_id,
            "boq_year": year,
            "version": next_v,
            "boq_number": make_boq_number(initials, year, next_v),
            "status": "draft",
            "locked": False,
            "parent_version_id": src["id"],
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat(),
            "created_by": current["id"],
            "change_note": body.note or body.reason or None,
        }
        new_doc.pop("_id", None)
        await db.boqs.insert_one(new_doc)
        # copy category/item rows if separate collections exist (best-effort)
        for coll in ("boq_categories", "boq_items"):
            try:
                async for row in db[coll].find({"boq_id": src["id"]}):
                    new_row = {**row, "id": str(uuid.uuid4()), "_id": None, "boq_id": new_id}
                    new_row.pop("_id", None)
                    await db[coll].insert_one(new_row)
            except Exception:
                pass
        return {"ok": True, "id": new_id, "boq_number": new_doc["boq_number"], "version": next_v}

    @api.get("/boq-families/{family_id}")
    async def get_family(family_id: str, current=Depends(get_current_user)):
        out = []
        async for x in db.boqs.find({"boq_family_id": family_id}).sort("version", 1):
            x.pop("_id", None)
            out.append({
                "id": x["id"], "boq_number": x.get("boq_number"), "version": x.get("version"),
                "status": x.get("status"), "total_amount": x.get("total_amount"),
                "created_at": x.get("created_at"), "created_by": x.get("created_by"),
                "change_note": x.get("change_note"),
            })
        if not out:
            raise HTTPException(404, "Family not found")
        return {"family_id": family_id, "versions": out}
