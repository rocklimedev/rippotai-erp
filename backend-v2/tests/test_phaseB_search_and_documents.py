"""Phase B — Global Search + Documents Overhaul backend tests.

Covers:
  - GET /api/search (grouped across boqs, projects, vendors, quotations, documents, tasks)
  - GET /api/documents/{id}/download (Content-Type, Content-Disposition, %PDF header)
  - GET /api/documents/project-cards (per-project counts)
  - Lifecycle: POST /api/documents/{id}/lock, /unlock, PATCH (returns 423 when locked),
    DELETE (returns 423 when locked)
"""
import os
import io
import base64
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://buildcon-erp.preview.emergentagent.com").rstrip("/")
ADMIN_EMAIL = "admin@buildcon.in"
ADMIN_PASSWORD = "buildcon123"


@pytest.fixture(scope="module")
def token():
    r = requests.post(f"{BASE_URL}/api/auth/login",
                      json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}, timeout=15)
    assert r.status_code == 200, f"Login failed: {r.status_code} {r.text}"
    return r.json()["access_token"]


@pytest.fixture(scope="module")
def h(token):
    return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}


@pytest.fixture(scope="module")
def hauth(token):
    # header without content-type (for multipart uploads)
    return {"Authorization": f"Bearer {token}"}


# ============ BUG FIX 1 — Global Search ============

class TestGlobalSearch:
    def test_search_kohli_returns_grouped_arrays(self, h):
        r = requests.get(f"{BASE_URL}/api/search", params={"q": "kohli"}, headers=h, timeout=15)
        assert r.status_code == 200, r.text
        data = r.json()
        # Six grouped arrays required
        for key in ["boqs", "projects", "vendors", "quotations", "documents", "tasks"]:
            assert key in data, f"missing key {key}"
            assert isinstance(data[key], list), f"{key} not a list"
        assert "counts" in data
        # 'kohli' should return at least the Kohli project + some docs/boqs
        assert len(data["projects"]) >= 1, f"expected kohli project: {data['projects']}"
        # verify at least one match mentions kohli (case-insensitive)
        joined = str(data).lower()
        assert "kohli" in joined

    def test_search_empty_query_returns_empty_groups(self, h):
        r = requests.get(f"{BASE_URL}/api/search", params={"q": ""}, headers=h, timeout=15)
        assert r.status_code == 200
        data = r.json()
        for key in ["boqs", "projects", "vendors", "quotations", "documents", "tasks"]:
            assert data[key] == [], f"expected empty list for {key}: {data[key]}"

    def test_search_short_query_returns_empty(self, h):
        r = requests.get(f"{BASE_URL}/api/search", params={"q": "k"}, headers=h, timeout=15)
        assert r.status_code == 200
        data = r.json()
        # <2 chars → empty groups
        assert data["projects"] == []

    def test_search_unauthenticated_401(self):
        r = requests.get(f"{BASE_URL}/api/search", params={"q": "kohli"}, timeout=15)
        assert r.status_code == 401


# ============ Documents dashboard project cards ============

class TestDocumentsProjectCards:
    def test_project_cards_returns_all_projects(self, h):
        r = requests.get(f"{BASE_URL}/api/documents/project-cards", headers=h, timeout=15)
        assert r.status_code == 200, r.text
        cards = r.json()
        assert isinstance(cards, list)
        assert len(cards) >= 6, f"expected at least 6 project cards, got {len(cards)}"
        # Each card exposes the fields the UI needs
        keys = {"project_id", "project_name", "client_name", "location", "count"}
        for c in cards:
            missing = keys - set(c.keys())
            assert not missing, f"card missing keys {missing}: {c}"
            assert isinstance(c["count"], int)
        # At least one project should have documents (seed data)
        assert any(c["count"] > 0 for c in cards), "no project has documents"


# ============ BUG FIX 2 — Documents Download (%PDF) ============

def _upload_test_pdf(hauth, project_id):
    # Minimal valid PDF bytes
    pdf_bytes = (
        b"%PDF-1.4\n%\xe2\xe3\xcf\xd3\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n"
        b"2 0 obj<</Type/Pages/Count 1/Kids[3 0 R]>>endobj\n"
        b"3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 300 300]>>endobj\n"
        b"xref\n0 4\n0000000000 65535 f\n0000000015 00000 n\n0000000060 00000 n\n"
        b"0000000107 00000 n\ntrailer<</Root 1 0 R/Size 4>>\nstartxref\n160\n%%EOF\n"
    )
    files = {"file": (f"TEST_{uuid.uuid4().hex[:6]}.pdf", pdf_bytes, "application/pdf")}
    data = {
        "project_id": project_id,
        "category": "Other",
        "title": "TEST_download_pdf",
        "version": "V1",
        "visibility": "internal",
        "remarks": "regression test",
        "source_app": "uploaded",
    }
    r = requests.post(f"{BASE_URL}/api/documents", headers=hauth, data=data, files=files, timeout=30)
    return r, pdf_bytes


class TestDocumentDownload:
    def _get_project_id(self, h):
        r = requests.get(f"{BASE_URL}/api/projects", headers=h, timeout=15)
        assert r.status_code == 200
        return r.json()[0]["id"]

    def test_download_returns_pdf_bytes(self, h, hauth):
        pid = self._get_project_id(h)
        r_up, pdf_bytes = _upload_test_pdf(hauth, pid)
        assert r_up.status_code in (200, 201), r_up.text
        doc = r_up.json()
        doc_id = doc["id"]

        # Download
        rd = requests.get(f"{BASE_URL}/api/documents/{doc_id}/download", headers=hauth, timeout=15)
        assert rd.status_code == 200, rd.text
        assert rd.headers.get("Content-Type", "").startswith("application/pdf"), rd.headers
        cd = rd.headers.get("Content-Disposition", "")
        assert "attachment" in cd.lower()
        assert cd.lower().endswith(".pdf") or ".pdf" in cd.lower()
        # First 4 bytes must be %PDF
        assert rd.content[:4] == b"%PDF", f"first bytes = {rd.content[:8]!r}"
        # cleanup
        requests.delete(f"{BASE_URL}/api/documents/{doc_id}", headers=hauth, timeout=15)

    def test_download_without_auth_returns_401(self, h, hauth):
        pid = self._get_project_id(h)
        r_up, _ = _upload_test_pdf(hauth, pid)
        assert r_up.status_code in (200, 201)
        doc_id = r_up.json()["id"]
        r = requests.get(f"{BASE_URL}/api/documents/{doc_id}/download", timeout=15)
        assert r.status_code == 401
        requests.delete(f"{BASE_URL}/api/documents/{doc_id}", headers=hauth, timeout=15)


# ============ Document lifecycle — lock / unlock / delete ============

class TestDocumentLifecycle:
    def _make_doc(self, h, hauth):
        r = requests.get(f"{BASE_URL}/api/projects", headers=h, timeout=15)
        pid = r.json()[0]["id"]
        r_up, _ = _upload_test_pdf(hauth, pid)
        assert r_up.status_code in (200, 201)
        return r_up.json()["id"]

    def test_lock_then_patch_returns_423(self, h, hauth):
        doc_id = self._make_doc(h, hauth)

        # Lock
        rl = requests.post(f"{BASE_URL}/api/documents/{doc_id}/lock", headers=hauth, timeout=15)
        assert rl.status_code == 200, rl.text
        assert rl.json().get("is_locked") is True

        # Verify GET reflects lock
        rg = requests.get(f"{BASE_URL}/api/documents/{doc_id}", headers=hauth, timeout=15)
        assert rg.status_code == 200
        assert rg.json().get("is_locked") is True

        # PATCH while locked → 423
        rp = requests.patch(f"{BASE_URL}/api/documents/{doc_id}",
                            headers={**hauth, "Content-Type": "application/json"},
                            json={"title": "should_fail"}, timeout=15)
        assert rp.status_code == 423, f"expected 423 locked, got {rp.status_code} {rp.text}"

        # DELETE while locked → 423
        rd = requests.delete(f"{BASE_URL}/api/documents/{doc_id}", headers=hauth, timeout=15)
        assert rd.status_code == 423, f"expected 423 locked, got {rd.status_code} {rd.text}"

        # Unlock (admin has role admin)
        ru = requests.post(f"{BASE_URL}/api/documents/{doc_id}/unlock", headers=hauth, timeout=15)
        assert ru.status_code == 200, ru.text
        assert ru.json().get("is_locked") is False

        # PATCH after unlock → OK
        rp2 = requests.patch(f"{BASE_URL}/api/documents/{doc_id}",
                             headers={**hauth, "Content-Type": "application/json"},
                             json={"title": "post_unlock_title"}, timeout=15)
        assert rp2.status_code == 200, rp2.text

        # DELETE after unlock → OK
        rd2 = requests.delete(f"{BASE_URL}/api/documents/{doc_id}", headers=hauth, timeout=15)
        assert rd2.status_code == 200


# ============ Regression — Phase A landing / dashboard / vendors ============

class TestPhaseARegression:
    def test_vendors_total_matches_donut(self, h):
        r_sum = requests.get(f"{BASE_URL}/api/vendors/summary", headers=h, timeout=15)
        assert r_sum.status_code == 200
        total = r_sum.json()["total"]
        r_mix = requests.get(f"{BASE_URL}/api/dashboards/vendors/availability-mix", headers=h, timeout=15)
        # availability-mix might not exist — skip if 404
        if r_mix.status_code == 404:
            pytest.skip("availability-mix endpoint not present")
        assert r_mix.status_code == 200
        mix = r_mix.json()
        s = sum(v for v in mix.values() if isinstance(v, (int, float)))
        assert total == s, f"total={total} != donut sum={s}"
