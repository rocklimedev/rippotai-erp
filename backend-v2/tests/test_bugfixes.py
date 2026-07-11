"""BUILDCON ERP - Bug fix verification tests (iteration 3)."""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://buildcon-erp.preview.emergentagent.com").rstrip("/")


@pytest.fixture(scope="module")
def api():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def admin_token(api):
    r = api.post(f"{BASE_URL}/api/auth/login", json={"email": "admin@buildcon.in", "password": "buildcon123"})
    assert r.status_code == 200, f"admin login failed: {r.status_code} {r.text[:200]}"
    return r.json()["token"] if "token" in r.json() else r.json().get("access_token")


# --- BUG FIX 2: OpenAPI at /api/openapi.json ---
class TestOpenAPI:
    def test_openapi_reachable(self, api):
        r = api.get(f"{BASE_URL}/api/openapi.json")
        assert r.status_code == 200, f"openapi returned {r.status_code}"
        data = r.json()
        assert "openapi" in data, "top-level 'openapi' key missing"
        assert data["openapi"].startswith("3."), f"openapi version not 3.x: {data['openapi']}"
        assert "paths" in data
        required = [
            "/api/auth/login", "/api/auth/register", "/api/auth/me",
            "/api/dashboard/summary", "/api/dashboard/continue-working",
            "/api/dashboard/app-badges", "/api/projects", "/api/boq/productivity",
            "/api/milestones/upcoming", "/api/documents/recent",
            "/api/activity/recent", "/api/calendar/upcoming",
            "/api/search", "/api/notifications",
        ]
        missing = [p for p in required if p not in data["paths"]]
        assert not missing, f"Missing openapi paths: {missing}"


# --- BUG FIX 1: Login wrong-password behavior ---
class TestAuthErrors:
    def test_login_wrong_password_returns_error(self, api):
        r = api.post(f"{BASE_URL}/api/auth/login",
                     json={"email": "admin@buildcon.in", "password": "wrongpass"})
        assert r.status_code in (400, 401, 403), f"expected 4xx for wrong password, got {r.status_code}"
        body = r.json()
        assert "detail" in body or "message" in body or "error" in body

    def test_login_success(self, api):
        r = api.post(f"{BASE_URL}/api/auth/login",
                     json={"email": "admin@buildcon.in", "password": "buildcon123"})
        assert r.status_code == 200
        data = r.json()
        # token key can be 'token' or 'access_token'
        assert "token" in data or "access_token" in data
        assert "user" in data
        assert data["user"]["email"] == "admin@buildcon.in"


# --- REGRESSION: Core dashboard endpoints ---
class TestDashboardRegression:
    def _auth(self, token):
        return {"Authorization": f"Bearer {token}"}

    def test_auth_me(self, api, admin_token):
        r = api.get(f"{BASE_URL}/api/auth/me", headers=self._auth(admin_token))
        assert r.status_code == 200
        assert r.json()["email"] == "admin@buildcon.in"

    def test_summary(self, api, admin_token):
        r = api.get(f"{BASE_URL}/api/dashboard/summary", headers=self._auth(admin_token))
        assert r.status_code == 200
        data = r.json()
        for k in ["active_projects", "milestones_due_this_week", "boqs_in_draft", "documents_pending"]:
            assert k in data, f"missing {k}"

    def test_app_badges(self, api, admin_token):
        r = api.get(f"{BASE_URL}/api/dashboard/app-badges", headers=self._auth(admin_token))
        assert r.status_code == 200
        assert isinstance(r.json(), dict)

    def test_projects(self, api, admin_token):
        r = api.get(f"{BASE_URL}/api/projects?limit=6", headers=self._auth(admin_token))
        assert r.status_code == 200
        assert isinstance(r.json(), list)
        assert len(r.json()) >= 1

    def test_boq_productivity(self, api, admin_token):
        r = api.get(f"{BASE_URL}/api/boq/productivity", headers=self._auth(admin_token))
        assert r.status_code == 200

    def test_documents_recent_filters(self, api, admin_token):
        for f in ["all", "generated", "uploaded"]:
            r = api.get(f"{BASE_URL}/api/documents/recent?limit=8&filter={f}",
                        headers=self._auth(admin_token))
            assert r.status_code == 200, f"filter={f} failed with {r.status_code}"
            assert isinstance(r.json(), list)

    def test_continue_working(self, api, admin_token):
        r = api.get(f"{BASE_URL}/api/dashboard/continue-working", headers=self._auth(admin_token))
        assert r.status_code == 200

    def test_milestones_upcoming(self, api, admin_token):
        r = api.get(f"{BASE_URL}/api/milestones/upcoming?limit=5", headers=self._auth(admin_token))
        assert r.status_code == 200

    def test_activity_recent(self, api, admin_token):
        r = api.get(f"{BASE_URL}/api/activity/recent?limit=10", headers=self._auth(admin_token))
        assert r.status_code == 200

    def test_calendar_upcoming(self, api, admin_token):
        r = api.get(f"{BASE_URL}/api/calendar/upcoming?limit=5", headers=self._auth(admin_token))
        assert r.status_code == 200
