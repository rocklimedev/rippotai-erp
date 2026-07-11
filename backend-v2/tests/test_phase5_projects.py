"""
Phase 5 backend tests: Projects module + Client Portal (magic links).
Covers all endpoints exposed in /app/backend/phase5_projects.py plus regression on
prior /vendors, /quotations, /boqs routes.
"""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://buildcon-erp.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "admin@buildcon.in"
ADMIN_PASSWORD = "buildcon123"
CLIENT_EMAIL = "client@kohli.in"
CLIENT_PASSWORD = "client123"


# ------------- Fixtures -------------
@pytest.fixture(scope="session")
def admin_token():
    r = requests.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}, timeout=20)
    assert r.status_code == 200, f"admin login failed: {r.status_code} {r.text}"
    j = r.json()
    return j.get("access_token") or j.get("token")


@pytest.fixture(scope="session")
def client_token():
    r = requests.post(f"{API}/auth/login", json={"email": CLIENT_EMAIL, "password": CLIENT_PASSWORD}, timeout=20)
    assert r.status_code == 200, f"client login failed: {r.status_code} {r.text}"
    j = r.json()
    return j.get("access_token") or j.get("token")


@pytest.fixture(scope="session")
def admin_h(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}


@pytest.fixture(scope="session")
def client_h(client_token):
    return {"Authorization": f"Bearer {client_token}"}


@pytest.fixture(scope="session")
def projects_full(admin_h):
    r = requests.get(f"{API}/projects/full", headers=admin_h, timeout=20)
    assert r.status_code == 200
    return r.json()


@pytest.fixture(scope="session")
def project_ids(projects_full):
    m = {}
    for p in projects_full:
        m[p.get("name", "")] = p.get("id")
    return m


@pytest.fixture(scope="session")
def client_links(admin_h):
    r = requests.get(f"{API}/client-links", headers=admin_h, timeout=20)
    assert r.status_code == 200
    return r.json()


class TestProjectsSummary:
    def test_summary_returns_7_counts(self, admin_h):
        r = requests.get(f"{API}/projects/summary", headers=admin_h, timeout=20)
        assert r.status_code == 200, r.text
        d = r.json()
        for k in ["total", "active", "on_time", "delayed", "awaiting_action", "near_handover", "completed"]:
            assert k in d, f"missing key {k}: {d}"
            assert isinstance(d[k], int)
        assert d["total"] >= 6


class TestProjectsFull:
    def test_full_returns_rows_with_timeline(self, projects_full):
        assert isinstance(projects_full, list)
        assert len(projects_full) >= 6
        for p in projects_full:
            assert "id" in p and "name" in p
            assert "timeline" in p
            assert "status" in p["timeline"]

    def test_expected_status_values(self, projects_full):
        by_name = {p["name"]: p["timeline"].get("status") for p in projects_full}
        expectations = {
            "Kohli": "on_track",
            "House Within": "on_track",
            "Jain": "at_risk",
            "Studio Office": "delayed",
            "Residence 24": "on_track",
            "Bansal": ("on_track", "completed"),  # may be completed after prior test run
        }
        for want_key, want_status in expectations.items():
            matched = [n for n in by_name if want_key.lower() in n.lower()]
            assert matched, f"no project matched '{want_key}' in {list(by_name.keys())}"
            got = by_name[matched[0]]
            allowed = want_status if isinstance(want_status, tuple) else (want_status,)
            assert got in allowed, f"{matched[0]} expected {allowed} got {got}"


class TestProjectDetail:
    def test_overview_keys(self, admin_h, project_ids):
        kohli = next((pid for name, pid in project_ids.items() if "kohli" in name.lower()), None)
        assert kohli
        r = requests.get(f"{API}/projects/{kohli}/overview", headers=admin_h, timeout=20)
        assert r.status_code == 200, r.text
        d = r.json()
        for k in ["project", "timeline", "phases", "team", "health", "top_pending", "recent_activity", "milestones_summary"]:
            assert k in d, f"missing key {k}"

    def test_timeline_status_studio_delayed(self, admin_h, project_ids):
        studio = next((pid for name, pid in project_ids.items() if "studio" in name.lower()), None)
        assert studio
        r = requests.get(f"{API}/projects/{studio}/timeline-status", headers=admin_h, timeout=20)
        assert r.status_code == 200, r.text
        d = r.json()
        assert "variance" in d or "delayed_milestones" in d, d
        # Studio Office should have some delayed_milestones entries
        delays = d.get("delayed_milestones", [])
        assert isinstance(delays, list)
        assert len(delays) > 0, f"expected delayed milestones for studio office, got {d}"

    def test_milestones_list(self, admin_h, project_ids):
        for pid in list(project_ids.values())[:2]:
            r = requests.get(f"{API}/projects/{pid}/milestones", headers=admin_h, timeout=20)
            assert r.status_code == 200
            assert isinstance(r.json(), list)

    def test_pending_work_bucketed(self, admin_h, project_ids):
        pid = list(project_ids.values())[0]
        r = requests.get(f"{API}/projects/{pid}/pending-work", headers=admin_h, timeout=20)
        assert r.status_code == 200
        assert isinstance(r.json(), (dict, list))

    def test_vendors_engaged(self, admin_h, project_ids):
        pid = list(project_ids.values())[0]
        r = requests.get(f"{API}/projects/{pid}/vendors", headers=admin_h, timeout=20)
        assert r.status_code == 200
        d = r.json()
        # New shape: {engaged: [...], attached: [...]}
        assert isinstance(d, dict)
        assert "engaged" in d, d
        assert isinstance(d["engaged"], list)

    def test_financial(self, admin_h, project_ids):
        pid = list(project_ids.values())[0]
        r = requests.get(f"{API}/projects/{pid}/financial", headers=admin_h, timeout=20)
        assert r.status_code == 200

    def test_documents(self, admin_h, project_ids):
        pid = list(project_ids.values())[0]
        r = requests.get(f"{API}/projects/{pid}/documents", headers=admin_h, timeout=20)
        assert r.status_code == 200
        assert isinstance(r.json(), list)


class TestHandover:
    def test_checklist_14_of_15(self, admin_h, project_ids):
        bansal = next((pid for name, pid in project_ids.items() if "bansal" in name.lower()), None)
        assert bansal
        r = requests.get(f"{API}/projects/{bansal}/handover-package-status", headers=admin_h, timeout=20)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d.get("required") == 15, d
        assert d.get("available") == 14, d
        assert d.get("pending") == 1, d

    def test_prepare_package_returns_pdf(self, admin_h, project_ids):
        bansal = next((pid for name, pid in project_ids.items() if "bansal" in name.lower()), None)
        r = requests.post(f"{API}/projects/{bansal}/handover/prepare-package", headers=admin_h, timeout=60)
        assert r.status_code == 200, r.text
        d = r.json()
        # Shape: {ok, document_id, size, filename}
        assert d.get("ok") is True, d
        assert d.get("document_id"), d
        assert d.get("size", 0) > 8000, f"size not >8000: {d}"

    def test_deliver_returns_token(self, admin_h, project_ids):
        bansal = next((pid for name, pid in project_ids.items() if "bansal" in name.lower()), None)
        r = requests.post(f"{API}/projects/{bansal}/handover/deliver", headers=admin_h, timeout=30)
        assert r.status_code == 200, r.text
        d = r.json()
        for k in ["token", "url", "link_id"]:
            assert k in d, f"missing {k}: {d}"


class TestClientLinks:
    def test_list_returns_seeded(self, client_links):
        assert isinstance(client_links, list)
        assert len(client_links) >= 4, f"expected >=4 seeded links, got {len(client_links)}"
        purposes = {l.get("purpose") for l in client_links}
        # Seeded: boq_approval, project_view, quotation_selection, handover_acceptance
        for p in ["boq_approval", "project_view", "quotation_selection", "handover_acceptance"]:
            assert p in purposes, f"missing purpose {p}: {purposes}"

    def test_create_and_revoke(self, admin_h, project_ids):
        pid = list(project_ids.values())[0]
        payload = {"project_id": pid, "purpose": "project_view", "client_email": "TEST_client@example.com"}
        r = requests.post(f"{API}/client-links", headers=admin_h, json=payload, timeout=20)
        assert r.status_code in (200, 201), r.text
        d = r.json()
        lid = d.get("id") or d.get("link_id")
        assert lid, d
        assert "token" in d, d
        rr = requests.post(f"{API}/client-links/{lid}/revoke", headers=admin_h, timeout=20)
        assert rr.status_code == 200, rr.text
        listing = requests.get(f"{API}/client-links", headers=admin_h, timeout=20).json()
        target = next((l for l in listing if (l.get("id") == lid or l.get("link_id") == lid)), None)
        assert target and target.get("revoked") is True, target


class TestPublicClient:
    def test_public_landing(self, client_links):
        link = next((l for l in client_links if l.get("purpose") == "project_view" and not l.get("revoked")), client_links[0])
        token = link["token"]
        r = requests.get(f"{API}/public/client/{token}", timeout=20)
        assert r.status_code == 200, r.text
        d = r.json()
        # Shape: {link:{purpose,...}, project, phases, upcoming_milestones, documents}
        assert "project" in d
        assert "phases" in d
        assert "upcoming_milestones" in d
        assert "documents" in d
        assert "link" in d and "purpose" in d["link"], d

    def test_invalid_token_404(self):
        r = requests.get(f"{API}/public/client/thisisnotarealtoken_xyz_9999", timeout=20)
        assert r.status_code == 404

    def test_revoked_token_410(self, admin_h, project_ids):
        pid = list(project_ids.values())[0]
        c = requests.post(f"{API}/client-links", headers=admin_h,
                          json={"project_id": pid, "purpose": "project_view", "client_email": "TEST_rev@example.com"}, timeout=20).json()
        lid = c.get("id") or c.get("link_id")
        tok = c["token"]
        requests.post(f"{API}/client-links/{lid}/revoke", headers=admin_h, timeout=20)
        r = requests.get(f"{API}/public/client/{tok}", timeout=20)
        assert r.status_code == 410, f"expected 410 got {r.status_code}: {r.text}"

    def test_public_boq_and_approve(self, client_links, admin_h):
        boq_link = next((l for l in client_links if l.get("purpose") == "boq_approval" and not l.get("revoked")), None)
        assert boq_link, "no boq_approval seeded link"
        tok = boq_link["token"]
        boq_id = boq_link.get("target_id")
        assert boq_id, f"target_id missing: {boq_link}"
        r = requests.get(f"{API}/public/client/{tok}/boq/{boq_id}", timeout=20)
        assert r.status_code == 200, r.text
        d = r.json()
        # items may be under 'items' or 'boq.items'
        items = d.get("items") or (d.get("boq") or {}).get("items") or []
        assert len(items) > 0, f"no items in {list(d.keys())}"
        payload = {"signatory_name": "TEST Signer", "signatory_email": "test-signer@example.com",
                   "comments": "Looks good — TEST", "approved": True}
        ap = requests.post(f"{API}/public/client/{tok}/boq/{boq_id}/approve", json=payload, timeout=20)
        assert ap.status_code == 200, ap.text
        act = requests.get(f"{API}/activity/recent", headers=admin_h, timeout=20)
        assert act.status_code == 200
        actions = [((a.get("description") or "") + " " + (a.get("action") or "") + " " + (a.get("title") or "")).lower() for a in act.json()]
        assert any("approv" in a for a in actions), f"no approval activity: {actions[:5]}"

    def test_public_compare_hides_internal_fields(self, client_links):
        qs_link = next((l for l in client_links if l.get("purpose") == "quotation_selection" and not l.get("revoked")), None)
        assert qs_link
        tok = qs_link["token"]
        cid = qs_link.get("target_id")
        assert cid, qs_link
        r = requests.get(f"{API}/public/client/{tok}/quotations/compare/{cid}", timeout=20)
        assert r.status_code == 200, r.text
        d = r.json()
        qs = d.get("quotations") or []
        assert len(qs) >= 1, d
        for q in qs:
            assert "internal_risk_level" not in q, f"leaked internal_risk_level: {q}"
            assert "notes" not in q, f"leaked notes: {q}"
        first_qid = qs[0].get("id") or qs[0].get("quotation_id")
        sel = requests.post(f"{API}/public/client/{tok}/quotations/select",
                            json={"quotation_id": first_qid,
                                  "signatory_name": "TEST Owner",
                                  "signatory_email": "owner@test.com",
                                  "comments": "TEST select"}, timeout=20)
        assert sel.status_code == 200, sel.text

    def test_public_handover_view_and_snag(self, client_links):
        ho = next((l for l in client_links if l.get("purpose") == "handover_acceptance" and not l.get("revoked")), None)
        assert ho
        tok = ho["token"]
        r = requests.get(f"{API}/public/client/{tok}/handover", timeout=20)
        assert r.status_code == 200, r.text
        d = r.json()
        assert "project" in d, d
        sn = requests.post(f"{API}/public/client/{tok}/handover/snag",
                           json={"title": "TEST snag", "description": "unit test snag", "category": "electrical"},
                           timeout=20)
        assert sn.status_code == 200, sn.text


class TestClientHome:
    def test_client_can_read(self, client_h):
        r = requests.get(f"{API}/client-home", headers=client_h, timeout=20)
        assert r.status_code == 200, r.text
        d = r.json()
        assert "magic_links" in d or "links" in d, d
        assert "projects" in d, d

    def test_admin_denied(self, admin_h):
        r = requests.get(f"{API}/client-home", headers=admin_h, timeout=20)
        assert r.status_code == 403, f"expected 403 got {r.status_code}: {r.text}"


class TestRegression:
    def test_vendors_ok(self, admin_h):
        r = requests.get(f"{API}/vendors", headers=admin_h, timeout=20)
        assert r.status_code == 200

    def test_quotations_ok(self, admin_h):
        r = requests.get(f"{API}/quotations", headers=admin_h, timeout=20)
        assert r.status_code == 200

    def test_boqs_ok(self, admin_h):
        r = requests.get(f"{API}/boqs", headers=admin_h, timeout=20)
        assert r.status_code == 200
