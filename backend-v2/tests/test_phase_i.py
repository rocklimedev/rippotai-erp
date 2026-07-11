"""
Phase I BUILDCON ERP backend tests.
Covers:
- Login as admin
- GET /api/projects/{id}/status-checklist returns exactly 12 items in fixed order
- Keys match expected list
- Progress bar/count arithmetic is consistent
"""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://buildcon-erp.preview.emergentagent.com").rstrip("/")

EXPECTED_KEYS = [
    "brief", "boq", "estimate", "pitch", "presentation", "3d_views",
    "scope_of_work", "site_reki", "agreement", "design", "drawing",
    "handover_certificate",
]

EXPECTED_LABELS = [
    "Brief", "BOQ", "Estimate", "Pitch", "Presentation", "3D",
    "Scope of Work", "Site Reki", "Agreement", "Design", "Drawings", "Handover",
]


@pytest.fixture(scope="session")
def token():
    r = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": "admin@buildcon.in", "password": "buildcon123",
    }, timeout=30)
    assert r.status_code == 200, f"Login failed: {r.status_code} {r.text}"
    body = r.json()
    return body.get("access_token") or body.get("token")


@pytest.fixture(scope="session")
def client(token):
    s = requests.Session()
    s.headers.update({"Authorization": f"Bearer {token}", "Content-Type": "application/json"})
    return s


@pytest.fixture(scope="session")
def project_id(client):
    r = client.get(f"{BASE_URL}/api/projects?limit=5", timeout=30)
    assert r.status_code == 200
    rows = r.json()
    assert len(rows) > 0, "No projects seeded"
    return rows[0]["id"]


# ==== status-checklist ====

def test_status_checklist_exists(client, project_id):
    r = client.get(f"{BASE_URL}/api/projects/{project_id}/status-checklist", timeout=30)
    assert r.status_code == 200, r.text
    data = r.json()
    assert "items" in data
    assert "completed_count" in data
    assert "total" in data
    assert "progress_pct" in data


def test_status_checklist_total_is_12(client, project_id):
    r = client.get(f"{BASE_URL}/api/projects/{project_id}/status-checklist", timeout=30)
    data = r.json()
    assert data["total"] == 12
    assert len(data["items"]) == 12


def test_status_checklist_keys_order(client, project_id):
    r = client.get(f"{BASE_URL}/api/projects/{project_id}/status-checklist", timeout=30)
    data = r.json()
    keys = [it["key"] for it in data["items"]]
    assert keys == EXPECTED_KEYS, f"Keys mismatch:\nExpected: {EXPECTED_KEYS}\nGot: {keys}"


def test_status_checklist_labels_order(client, project_id):
    r = client.get(f"{BASE_URL}/api/projects/{project_id}/status-checklist", timeout=30)
    data = r.json()
    labels = [it["label"] for it in data["items"]]
    assert labels == EXPECTED_LABELS, f"Labels mismatch:\nExpected: {EXPECTED_LABELS}\nGot: {labels}"


def test_status_checklist_completion_arithmetic(client, project_id):
    r = client.get(f"{BASE_URL}/api/projects/{project_id}/status-checklist", timeout=30)
    data = r.json()
    computed_done = sum(1 for it in data["items"] if it["completed"])
    assert computed_done == data["completed_count"]
    assert data["progress_pct"] == round((computed_done / data["total"]) * 100)


def test_status_checklist_404_on_missing(client):
    r = client.get(f"{BASE_URL}/api/projects/does-not-exist-xyz/status-checklist", timeout=30)
    assert r.status_code == 404


def test_status_checklist_requires_auth():
    r = requests.get(f"{BASE_URL}/api/projects/whatever/status-checklist", timeout=30)
    assert r.status_code in (401, 403)
