"""Phase 4 fixes verification — iteration_9.
Verifies 5 specific fixes reported in iteration_8:
  1. /api/quotations/summary includes selected/rejected/expired
  2. /api/quotations/{qid}/mark-selected appends to /api/activity/recent
  3. /api/quotation-comparisons POST returns 200 with the created record
  4. /api/quotations/{qid}/export/pdf produces a rich PDF (>5KB, %PDF magic)
  5. Client role guard: 403 on all quotation & vendor endpoints
Plus regression: list, detail, xlsx, compare (renamed to /quotations-compare).
"""
import os
import re
import time
import pytest
import requests

BASE_URL = (os.environ.get("REACT_APP_BACKEND_URL") or "https://buildcon-erp.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"


# ---------- Fixtures ----------
@pytest.fixture(scope="session")
def admin_token():
    r = requests.post(f"{API}/auth/login", json={"email": "admin@buildcon.in", "password": "buildcon123"})
    assert r.status_code == 200, r.text
    return r.json()["access_token"]


@pytest.fixture(scope="session")
def client_token():
    r = requests.post(f"{API}/auth/login", json={"email": "client@kohli.in", "password": "client123"})
    assert r.status_code == 200, r.text
    return r.json()["access_token"]


@pytest.fixture(scope="session")
def admin_h(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}


@pytest.fixture(scope="session")
def client_h(client_token):
    return {"Authorization": f"Bearer {client_token}"}


# ---------- FIX #1: summary has selected/rejected/expired ----------
class TestFix1Summary:
    def test_summary_has_new_keys(self, admin_h):
        r = requests.get(f"{API}/quotations/summary", headers=admin_h)
        assert r.status_code == 200, r.text
        d = r.json()
        for k in ("selected", "rejected", "expired", "total", "drafts", "requested",
                  "received", "under_review", "awaiting_approval", "approved", "expiring_soon"):
            assert k in d, f"Missing key '{k}' in summary: {list(d.keys())}"
        for k in ("selected", "rejected", "expired"):
            assert isinstance(d[k], int), f"{k} not int: {type(d[k])}"


# ---------- FIX #2: mark-selected appends to /activity/recent ----------
class TestFix2MarkSelectedActivity:
    def _pick_selectable(self, admin_h):
        """Return an approved quotation id; if none, transition an under_review one."""
        r = requests.get(f"{API}/quotations?status=approved", headers=admin_h)
        assert r.status_code == 200
        rows = r.json()
        if rows:
            return rows[0]
        # fallback: transition an under_review to approved
        r = requests.get(f"{API}/quotations?status=under_review", headers=admin_h)
        rows = r.json()
        assert rows, "No under_review or approved quotations available"
        qid = rows[0]["id"]
        ar = requests.post(f"{API}/quotations/{qid}/approve", headers=admin_h, json={"remarks": "test"})
        assert ar.status_code == 200, ar.text
        r = requests.get(f"{API}/quotations/{qid}", headers=admin_h)
        return r.json()

    def test_mark_selected_writes_activity(self, admin_h):
        q = self._pick_selectable(admin_h)
        qid = q["id"]
        vendor_name = q.get("vendor_name")
        work_category = q.get("work_category")
        # mark selected
        r = requests.post(f"{API}/quotations/{qid}/mark-selected", headers=admin_h, json={"remarks": "test"})
        # Might already be selected — re-invoke on another approved; but code updates status anyway
        assert r.status_code == 200, r.text
        time.sleep(1)
        # Now verify /api/activity/recent contains the description
        ar = requests.get(f"{API}/activity/recent", headers=admin_h)
        assert ar.status_code == 200, ar.text
        acts = ar.json()
        assert isinstance(acts, list) and len(acts) > 0
        expected = f"Vendor {vendor_name} finalized for {work_category}"
        # look in top few results
        found = any(expected in (a.get("description") or "") for a in acts[:10])
        assert found, f"Expected description '{expected}' not found in top 10 activity items. Got: {[a.get('description') for a in acts[:5]]}"
        # top entry should have `at`
        top = next((a for a in acts if expected in (a.get("description") or "")), None)
        assert top is not None
        assert top.get("at"), "activity entry missing `at` timestamp"


# ---------- FIX #3: /quotation-comparisons POST returns 200 with record ----------
class TestFix3SaveComparison:
    def test_post_returns_200_with_record(self, admin_h):
        payload = {"name": "TEST_iter9_cmp", "quotation_ids": ["x", "y"]}
        r = requests.post(f"{API}/quotation-comparisons", headers=admin_h, json=payload)
        assert r.status_code == 200, r.text
        d = r.json()
        for k in ("id", "name", "project_id", "work_category", "quotation_ids", "saved_by", "saved_at"):
            assert k in d, f"missing '{k}' in {d}"
        assert d["name"] == "TEST_iter9_cmp"
        assert d["quotation_ids"] == ["x", "y"]
        assert "_id" not in d  # no mongodb objectId leakage


# ---------- FIX #4: PDF export is rich (>5KB, %PDF, contains sections) ----------
class TestFix4PdfExport:
    def test_selected_pdf_rich(self, admin_h):
        # find a selected quotation
        r = requests.get(f"{API}/quotations?status=selected", headers=admin_h)
        assert r.status_code == 200
        rows = r.json()
        if not rows:
            # fallback: any approved
            r = requests.get(f"{API}/quotations?status=approved", headers=admin_h)
            rows = r.json()
        assert rows, "no selected/approved quotation available for PDF export"
        qid = rows[0]["id"]
        pr = requests.post(f"{API}/quotations/{qid}/export/pdf", headers=admin_h)
        assert pr.status_code == 200, pr.text
        content = pr.content
        assert content[:4] == b"%PDF", f"Not a PDF: {content[:8]}"
        assert len(content) > 5 * 1024, f"PDF too small: {len(content)} bytes"
        # Check content-type
        assert "application/pdf" in pr.headers.get("Content-Type", "")


# ---------- FIX #5: Client role guard 403 ----------
class TestFix5ClientGuard:
    @pytest.mark.parametrize("path", [
        "/quotations",
        "/quotations/summary",
        "/quotations/any-id",
        "/quotation-requests",
        "/quotations-compare?ids=x,y",
        "/vendors",
        "/vendors/summary",
        "/vendors/any-id",
        "/vendor-shortlists",
    ])
    def test_client_forbidden(self, client_h, path):
        r = requests.get(f"{API}{path}", headers=client_h)
        assert r.status_code == 403, f"Expected 403 for client on {path}, got {r.status_code}: {r.text[:200]}"
        body = r.json()
        detail = str(body.get("detail") or "").lower()
        assert "internal" in detail or "firm" in detail, f"Response body missing 'internal to the firm' language: {body}"

    def test_admin_still_works(self, admin_h):
        for path in ["/quotations", "/quotations/summary", "/vendors", "/vendors/summary", "/vendor-shortlists", "/quotation-requests"]:
            r = requests.get(f"{API}{path}", headers=admin_h)
            assert r.status_code == 200, f"admin got {r.status_code} on {path}: {r.text[:200]}"


# ---------- Regression ----------
class TestRegression:
    def test_list_has_rows(self, admin_h):
        r = requests.get(f"{API}/quotations", headers=admin_h)
        assert r.status_code == 200
        assert len(r.json()) >= 20

    def test_detail(self, admin_h):
        r = requests.get(f"{API}/quotations", headers=admin_h)
        qid = r.json()[0]["id"]
        d = requests.get(f"{API}/quotations/{qid}", headers=admin_h)
        assert d.status_code == 200
        detail = d.json()
        assert detail["id"] == qid
        assert "items" in detail
        assert "vendor" in detail
        assert "project" in detail

    def test_excel_export(self, admin_h):
        r = requests.get(f"{API}/quotations", headers=admin_h)
        qid = r.json()[0]["id"]
        er = requests.get(f"{API}/quotations/{qid}/export/excel", headers=admin_h)
        assert er.status_code == 200
        assert er.content[:2] == b"PK"

    def test_compare_endpoint(self, admin_h):
        r = requests.get(f"{API}/quotations", headers=admin_h)
        ids = [q["id"] for q in r.json()[:2]]
        cr = requests.get(f"{API}/quotations-compare", headers=admin_h, params={"ids": ",".join(ids)})
        assert cr.status_code == 200, cr.text
        d = cr.json()
        assert "quotations" in d
        assert "line_items" in d
        assert "lowest_id" in d
