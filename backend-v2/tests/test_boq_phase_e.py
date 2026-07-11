"""Phase E — BOQ Templates / Library / Activity / Notifications / PDF (iteration 17)

Covers all backend items in review request:
- GET /api/boq/templates → 3 tiers (essential/premium/luxury) with count/total_value
- GET /api/library/items?q=... → case-insensitive search
- GET /api/library/categories → >=10 categories
- POST/PATCH/DELETE /api/library/items → CRUD + activity trail on move/create/delete
- GET /api/boq/activity → seeded rows + filter narrowing
- GET /api/notifications → 3 items with link_url starting with /boq /projects /quotations
- POST /api/boqs/{id}/export/pdf variant=internal → application/pdf, starts with %PDF-
"""
import os
import re
import pytest
import requests
from pathlib import Path


def _load_frontend_env():
    if os.environ.get("REACT_APP_BACKEND_URL"):
        return
    envf = Path("/app/frontend/.env")
    if envf.exists():
        for line in envf.read_text().splitlines():
            if line.startswith("REACT_APP_BACKEND_URL="):
                os.environ["REACT_APP_BACKEND_URL"] = line.split("=", 1)[1].strip()
                break


_load_frontend_env()
_url = os.environ.get("REACT_APP_BACKEND_URL")
assert _url, "REACT_APP_BACKEND_URL not set (checked env + /app/frontend/.env)"
BASE_URL = _url.rstrip("/")
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "admin@buildcon.in"
ADMIN_PASSWORD = "buildcon123"


@pytest.fixture(scope="module")
def admin_headers():
    r = requests.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}, timeout=30)
    assert r.status_code == 200, f"admin login failed: {r.status_code} {r.text}"
    token = r.json().get("token") or r.json().get("access_token")
    assert token, f"no token in login response: {r.json()}"
    return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}


# -------------------- BOQ Templates --------------------
class TestBoqTemplates:
    def test_templates_returns_3_tiers(self, admin_headers):
        r = requests.get(f"{API}/boq/templates", headers=admin_headers, timeout=20)
        assert r.status_code == 200
        rows = r.json()
        assert isinstance(rows, list)
        tiers = {t.get("template_tier") for t in rows if t.get("template_tier")}
        assert {"essential", "premium", "luxury"}.issubset(tiers), f"missing tiers, got {tiers}"

    def test_templates_have_counts_and_total_value(self, admin_headers):
        r = requests.get(f"{API}/boq/templates", headers=admin_headers, timeout=20)
        rows = [t for t in r.json() if t.get("template_tier") in ("essential", "premium", "luxury")]
        for t in rows:
            assert "category_count" in t and t["category_count"] >= 1, f"{t.get('name')} missing category_count"
            assert "item_count" in t and t["item_count"] >= 1, f"{t.get('name')} missing item_count"
            assert "total_value" in t, f"{t.get('name')} missing total_value"
            assert isinstance(t["total_value"], (int, float))
            assert t["total_value"] > 0, f"{t.get('name')} has zero total_value"


# -------------------- Library items & categories --------------------
class TestLibrary:
    def test_categories_at_least_10(self, admin_headers):
        r = requests.get(f"{API}/library/categories", headers=admin_headers, timeout=20)
        assert r.status_code == 200
        cats = r.json()
        assert isinstance(cats, list)
        assert len(cats) >= 10, f"expected >=10 library categories, got {len(cats)}"
        # each has id/name
        for c in cats[:3]:
            assert c.get("id"); assert c.get("name")

    def test_items_search_wiring_case_insensitive(self, admin_headers):
        # Try lowercase
        r_low = requests.get(f"{API}/library/items", params={"q": "wiring"}, headers=admin_headers, timeout=20)
        assert r_low.status_code == 200, r_low.text
        rows_low = r_low.json()
        # Try uppercase — should match same or superset
        r_up = requests.get(f"{API}/library/items", params={"q": "WIRING"}, headers=admin_headers, timeout=20)
        assert r_up.status_code == 200
        rows_up = r_up.json()
        assert isinstance(rows_low, list)
        assert len(rows_low) >= 1, "expected at least one library item matching 'wiring'"
        # Names should contain 'wiring' (case-insensitive)
        for it in rows_low:
            hay = " ".join(str(it.get(k) or "") for k in ("name", "description", "code")).lower()
            assert "wiring" in hay, f"row does not appear to match 'wiring': {it}"
        # case-insensitivity: same ids returned
        assert {i["id"] for i in rows_low} == {i["id"] for i in rows_up}

    def test_item_crud_and_activity(self, admin_headers):
        # Pick two categories to move between
        cats = requests.get(f"{API}/library/categories", headers=admin_headers, timeout=20).json()
        assert len(cats) >= 2
        cat_a, cat_b = cats[0], cats[1]

        # CREATE
        create_payload = {
            "name": "TEST_PhaseE_widget",
            "unit": "Nos.",
            "default_rate": 123.45,
            "category_id": cat_a["id"],
            "category_name": cat_a["name"],
            "notes": "created by pytest",
        }
        cr = requests.post(f"{API}/library/items", json=create_payload, headers=admin_headers, timeout=20)
        assert cr.status_code == 200, cr.text
        created = cr.json()
        assert created.get("id"), f"missing id: {created}"
        assert created["name"] == create_payload["name"]
        assert created["unit"] == "Nos."
        assert abs(float(created["default_rate"]) - 123.45) < 1e-6
        assert created["category_id"] == cat_a["id"]
        iid = created["id"]

        # Verify via GET filter
        gl = requests.get(f"{API}/library/items", params={"q": "TEST_PhaseE_widget"}, headers=admin_headers, timeout=20)
        assert gl.status_code == 200
        assert any(x["id"] == iid for x in gl.json()), "created item not returned by search"

        # PATCH — move category → should record boq_activity row
        pr = requests.patch(f"{API}/library/items/{iid}", json={"category_id": cat_b["id"], "category_name": cat_b["name"]},
                            headers=admin_headers, timeout=20)
        assert pr.status_code == 200, pr.text
        moved = pr.json()
        assert moved["category_id"] == cat_b["id"]

        # Activity row for library_item_moved must reference the item name
        act = requests.get(f"{API}/boq/activity", params={"action": "library_item_moved"}, headers=admin_headers, timeout=20)
        assert act.status_code == 200
        rows = act.json()
        assert any(r.get("target_id") == iid or r.get("target") == "TEST_PhaseE_widget" for r in rows), \
            "no library_item_moved activity row referencing our item"

        # DELETE
        dr = requests.delete(f"{API}/library/items/{iid}", headers=admin_headers, timeout=20)
        assert dr.status_code == 200, dr.text
        assert dr.json().get("ok") is True

        # Verify gone
        after = requests.get(f"{API}/library/items", params={"q": "TEST_PhaseE_widget"}, headers=admin_headers, timeout=20).json()
        assert not any(x["id"] == iid for x in after), "item still returned after delete"


# -------------------- BOQ Activity --------------------
class TestBoqActivity:
    def test_activity_returns_seeded_rows(self, admin_headers):
        r = requests.get(f"{API}/boq/activity", headers=admin_headers, timeout=20)
        assert r.status_code == 200
        rows = r.json()
        assert isinstance(rows, list)
        assert len(rows) >= 7, f"expected >=7 seeded activity rows, got {len(rows)}"
        # each row shape
        for row in rows[:5]:
            for k in ("id", "action", "target", "user", "at"):
                assert k in row, f"activity row missing {k}: {row}"

    def test_activity_filter_by_user(self, admin_headers):
        all_rows = requests.get(f"{API}/boq/activity", headers=admin_headers, timeout=20).json()
        users = {r.get("user") for r in all_rows if r.get("user")}
        assert users, "no users in activity rows"
        pick = next(iter(users))
        r = requests.get(f"{API}/boq/activity", params={"user": pick}, headers=admin_headers, timeout=20)
        assert r.status_code == 200
        filtered = r.json()
        assert len(filtered) >= 1
        assert all(row.get("user") == pick for row in filtered), "user filter did not narrow"
        # Narrowing check
        assert len(filtered) <= len(all_rows)

    def test_activity_filter_by_action(self, admin_headers):
        all_rows = requests.get(f"{API}/boq/activity", headers=admin_headers, timeout=20).json()
        actions = {r.get("action") for r in all_rows if r.get("action")}
        assert actions
        pick = next(iter(actions))
        r = requests.get(f"{API}/boq/activity", params={"action": pick}, headers=admin_headers, timeout=20)
        assert r.status_code == 200
        filtered = r.json()
        assert all(row.get("action") == pick for row in filtered)


# -------------------- Notifications with link_url --------------------
class TestNotifications:
    def test_notifications_have_link_url(self, admin_headers):
        r = requests.get(f"{API}/notifications", headers=admin_headers, timeout=20)
        assert r.status_code == 200
        rows = r.json()
        assert isinstance(rows, list)
        assert len(rows) == 3, f"expected 3 notifications, got {len(rows)}"
        allowed_prefixes = ("/boq", "/projects", "/quotations", "/documents")
        for n in rows:
            assert n.get("link_url"), f"notification missing link_url: {n}"
            assert n["link_url"].startswith(allowed_prefixes), f"unexpected link_url {n['link_url']}"
        # At least one starts with /boq
        assert any(n["link_url"].startswith("/boq") for n in rows), "no /boq deep link"


# -------------------- PDF export (variant=internal) --------------------
class TestPdfExport:
    def test_export_pdf_internal(self, admin_headers):
        # Pick a BOQ to export
        boqs = requests.get(f"{API}/boqs", headers=admin_headers, timeout=20).json()
        assert isinstance(boqs, list) and len(boqs) >= 1, "no BOQs to export"
        bid = boqs[0]["id"]
        r = requests.post(
            f"{API}/boqs/{bid}/export/pdf",
            headers=admin_headers,
            json={"variant": "internal", "show_rates": True, "show_subtotals": True,
                  "include_terms": True, "include_signatures": True,
                  "include_logo": True, "include_location_column": True},
            timeout=60,
        )
        assert r.status_code == 200, f"pdf export failed: {r.status_code} {r.text[:200]}"
        ctype = r.headers.get("content-type", "").lower()
        assert "application/pdf" in ctype, f"bad content-type {ctype}"
        assert r.content[:5] == b"%PDF-", f"content does not start with %PDF-: {r.content[:20]}"
        assert len(r.content) > 2000, f"pdf too small: {len(r.content)}"
