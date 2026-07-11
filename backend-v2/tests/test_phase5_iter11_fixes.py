"""
Iteration 11 — Re-verify the 4 specific bug fixes reported after iteration_10.

FIX #1  handover prepare-package: stream vs default JSON + idempotency + download.
FIX #2  timeline-status actual_progress derived from phases/project.progress.
FIX #3  timeline-status has both variance & schedule_variance; handover-package-status has both percent & percentage.
FIX #4  Public BOQ approve accepts BOTH payload shapes (name/email aliases OR canonical signatory_*).
REGRESSION — Phase 5 core endpoints still work.
"""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL").rstrip("/")
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "admin@buildcon.in"
ADMIN_PASSWORD = "buildcon123"


# ---------------- Fixtures ----------------
@pytest.fixture(scope="session")
def admin_token():
    r = requests.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}, timeout=20)
    assert r.status_code == 200, f"admin login failed: {r.status_code} {r.text}"
    j = r.json()
    tok = j.get("access_token") or j.get("token")
    assert tok, f"no token in login response: {j}"
    return tok


@pytest.fixture(scope="session")
def admin_h(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}


@pytest.fixture(scope="session")
def bansal_id(admin_h):
    r = requests.get(f"{API}/projects/full", headers=admin_h, timeout=20)
    assert r.status_code == 200, f"/projects/full failed: {r.status_code} {r.text}"
    projs = r.json()
    for p in projs:
        if "bansal" in (p.get("name") or "").lower():
            return p.get("id")
    pytest.fail(f"No Bansal project found in /projects/full — got names: {[p.get('name') for p in projs]}")


# ---------------- FIX #1 — Handover prepare-package (stream + JSON + idempotency + download) ----------------
class TestFix1HandoverPackage:
    def test_1a_stream_returns_pdf_binary(self, admin_h, bansal_id):
        """stream=true → application/pdf with %PDF magic and > 8KB body."""
        r = requests.post(
            f"{API}/projects/{bansal_id}/handover/prepare-package",
            headers=admin_h,
            params={"stream": "true"},
            timeout=60,
        )
        assert r.status_code == 200, f"prepare-package?stream=true failed: {r.status_code} {r.text[:300]}"
        ctype = r.headers.get("content-type", "").lower()
        assert "application/pdf" in ctype, f"expected application/pdf, got {ctype!r}"
        body = r.content
        assert body[:4] == b"%PDF", f"body doesn't start with %PDF magic (got {body[:8]!r})"
        assert len(body) > 8 * 1024, f"body too small: {len(body)} bytes (expected > 8KB)"

    def test_1b_default_json_and_idempotent(self, admin_h, bansal_id):
        """Default (no stream) call returns JSON with ok/document_id/size/filename AND is idempotent:
        calling it 3 times back-to-back leaves exactly ONE 'Handover' document."""
        last_doc_id = None
        for i in range(3):
            r = requests.post(
                f"{API}/projects/{bansal_id}/handover/prepare-package",
                headers=admin_h,
                timeout=60,
            )
            assert r.status_code == 200, f"call#{i+1} default prepare-package failed: {r.status_code} {r.text[:300]}"
            ct = r.headers.get("content-type", "").lower()
            assert "application/json" in ct, f"call#{i+1} expected JSON, got {ct!r}"
            j = r.json()
            assert j.get("ok") is True, f"call#{i+1} ok!=true: {j}"
            assert isinstance(j.get("document_id"), str) and j["document_id"], f"call#{i+1} bad document_id: {j}"
            assert isinstance(j.get("size"), int) and j["size"] > 8 * 1024, f"call#{i+1} bad size: {j}"
            assert isinstance(j.get("filename"), str) and j["filename"], f"call#{i+1} bad filename: {j}"
            last_doc_id = j["document_id"]

        # Now GET /api/projects/{bansal_id}/documents and count Handover docs
        dr = requests.get(f"{API}/projects/{bansal_id}/documents", headers=admin_h, timeout=20)
        assert dr.status_code == 200, f"documents list failed: {dr.status_code} {dr.text[:300]}"
        docs = dr.json()
        # Accept either shape: list-of-docs OR {items:[...]}
        if isinstance(docs, dict):
            docs = docs.get("items") or docs.get("documents") or []
        handover_docs = [
            d for d in docs
            if "handover" in ((d.get("category") or "") + " " + (d.get("name") or "") + " " + (d.get("filename") or "") + " " + (d.get("title") or "")).lower()
        ]
        assert len(handover_docs) == 1, (
            f"expected exactly ONE handover doc after 3 idempotent calls, got {len(handover_docs)}: "
            f"{[{k: d.get(k) for k in ('id','name','filename','category','title')} for d in handover_docs]}"
        )
        # Cache doc id for 1c
        pytest.handover_doc_id = handover_docs[0].get("id") or last_doc_id

    def test_1c_document_download_streams_pdf(self, admin_h, bansal_id):
        """GET /api/documents/{did}/download (as admin, JWT) returns %PDF > 8KB."""
        did = getattr(pytest, "handover_doc_id", None)
        if not did:
            # Fallback: prepare-package once to obtain a doc_id
            r0 = requests.post(f"{API}/projects/{bansal_id}/handover/prepare-package", headers=admin_h, timeout=60)
            assert r0.status_code == 200
            did = r0.json().get("document_id")
        assert did, "no document id available for download test"
        r = requests.get(f"{API}/documents/{did}/download", headers=admin_h, timeout=30)
        assert r.status_code == 200, f"download failed: {r.status_code} {r.text[:300]}"
        ctype = r.headers.get("content-type", "").lower()
        assert "application/pdf" in ctype, f"expected application/pdf, got {ctype!r}"
        body = r.content
        assert body[:4] == b"%PDF", f"download body missing %PDF magic (got {body[:8]!r})"
        assert len(body) > 8 * 1024, f"download body too small: {len(body)} bytes"


# ---------------- FIX #2 & #3a — Timeline-status ----------------
class TestFix2And3aTimelineStatus:
    @pytest.fixture(scope="class")
    def ts(self, admin_h, bansal_id):
        r = requests.get(f"{API}/projects/{bansal_id}/timeline-status", headers=admin_h, timeout=20)
        assert r.status_code == 200, f"timeline-status failed: {r.status_code} {r.text[:300]}"
        return r.json()

    def test_2_actual_progress_ge_88(self, ts):
        ap = ts.get("actual_progress")
        assert isinstance(ap, (int, float)), f"actual_progress not numeric: {ts}"
        assert ap >= 88, f"actual_progress should be >= 88 (Bansal seeded 94%); got {ap}"

    def test_2_status_ahead_or_on_track_or_completed(self, ts):
        st = ts.get("status")
        assert st in ("ahead", "on_track", "completed"), f"unexpected status={st!r}: {ts}"

    def test_3a_variance_and_schedule_variance_both_present(self, ts):
        assert "variance" in ts, f"missing 'variance' key: {ts}"
        assert "schedule_variance" in ts, f"missing 'schedule_variance' key: {ts}"
        v = ts["variance"]
        sv = ts["schedule_variance"]
        assert isinstance(v, (int, float)) and isinstance(sv, (int, float)), f"variance/schedule_variance not numeric: v={v} sv={sv}"
        assert v == sv, f"variance ({v}) != schedule_variance ({sv})"


# ---------------- FIX #3b — Handover-package-status has both percent and percentage ----------------
class TestFix3bHandoverPackageStatus:
    def test_both_percent_and_percentage_keys(self, admin_h, bansal_id):
        r = requests.get(f"{API}/projects/{bansal_id}/handover-package-status", headers=admin_h, timeout=20)
        assert r.status_code == 200, f"handover-package-status failed: {r.status_code} {r.text[:300]}"
        j = r.json()
        assert "percent" in j, f"missing 'percent': {j}"
        assert "percentage" in j, f"missing 'percentage': {j}"
        assert j["percent"] == j["percentage"], f"percent ({j['percent']}) != percentage ({j['percentage']})"


# ---------------- FIX #4 — Public BOQ approve accepts BOTH payload shapes ----------------
class TestFix4PublicBoqApproveAliases:
    @pytest.fixture(scope="class")
    def boq_link(self, admin_h):
        r = requests.get(f"{API}/client-links", headers=admin_h, timeout=20)
        assert r.status_code == 200, f"/client-links failed: {r.status_code} {r.text[:300]}"
        links = r.json()
        if isinstance(links, dict):
            links = links.get("items") or links.get("links") or []
        candidates = [
            l for l in links
            if l.get("purpose") == "boq_approval" and not l.get("revoked", False)
        ]
        assert candidates, f"no non-revoked boq_approval link found among {len(links)} links"
        # Prefer the seeded (non-TEST_) one
        seeded = [l for l in candidates if not (l.get("resource_name") or l.get("name") or "").startswith("TEST_")]
        return (seeded or candidates)[0]

    def test_shape_a_name_email_aliases(self, boq_link):
        token = boq_link.get("token")
        boq_id = boq_link.get("target_id") or boq_link.get("resource_id") or boq_link.get("boq_id")
        assert token and boq_id, f"link missing token/target_id: {boq_link}"
        payload = {"name": "Alias Test", "email": "alias@test.in", "comments": "shape A", "approved": True}
        r = requests.post(f"{API}/public/client/{token}/boq/{boq_id}/approve", json=payload, timeout=20)
        assert r.status_code == 200, f"shape A approve failed: {r.status_code} {r.text[:300]}"
        j = r.json()
        assert j.get("signatory_name") == "Alias Test", f"shape A signatory_name != 'Alias Test': {j}"

    def test_shape_b_canonical_signatory_fields(self, boq_link):
        token = boq_link.get("token")
        boq_id = boq_link.get("target_id") or boq_link.get("resource_id") or boq_link.get("boq_id")
        assert token and boq_id
        payload = {
            "signatory_name": "Canonical",
            "signatory_email": "canonical@test.in",
            "comments": "shape B",
            "approved": True,
        }
        r = requests.post(f"{API}/public/client/{token}/boq/{boq_id}/approve", json=payload, timeout=20)
        assert r.status_code == 200, f"shape B approve failed: {r.status_code} {r.text[:300]}"
        j = r.json()
        assert j.get("signatory_name") == "Canonical", f"shape B signatory_name != 'Canonical': {j}"


# ---------------- REGRESSION — Phase 5 core endpoints still 200 ----------------
class TestRegressionPhase5:
    def test_projects_summary(self, admin_h):
        r = requests.get(f"{API}/projects/summary", headers=admin_h, timeout=20)
        assert r.status_code == 200, f"/projects/summary: {r.status_code} {r.text[:200]}"

    def test_projects_full(self, admin_h):
        r = requests.get(f"{API}/projects/full", headers=admin_h, timeout=20)
        assert r.status_code == 200
        assert isinstance(r.json(), list) and len(r.json()) >= 1

    def test_project_overview(self, admin_h, bansal_id):
        r = requests.get(f"{API}/projects/{bansal_id}/overview", headers=admin_h, timeout=20)
        assert r.status_code == 200, f"/projects/{bansal_id}/overview: {r.status_code} {r.text[:200]}"

    def test_client_links_list(self, admin_h):
        r = requests.get(f"{API}/client-links", headers=admin_h, timeout=20)
        assert r.status_code == 200
        links = r.json()
        if isinstance(links, dict):
            links = links.get("items") or links.get("links") or []
        assert isinstance(links, list) and len(links) >= 1

    def test_public_client_landing_anonymous(self, admin_h):
        # Pick any non-revoked link (prefer project_view)
        r = requests.get(f"{API}/client-links", headers=admin_h, timeout=20)
        links = r.json()
        if isinstance(links, dict):
            links = links.get("items") or links.get("links") or []
        cand = [l for l in links if not l.get("revoked", False)]
        assert cand, "no non-revoked links to test public landing"
        link = cand[0]
        token = link.get("token")
        # NO auth headers — must be anonymous
        r2 = requests.get(f"{API}/public/client/{token}", timeout=20)
        assert r2.status_code == 200, f"public landing failed: {r2.status_code} {r2.text[:200]}"
        j = r2.json()
        # Must return a shape with 'link' or 'project' key
        assert "link" in j or "project" in j, f"unexpected public landing shape: {list(j.keys())}"
