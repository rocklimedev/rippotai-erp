"""
Phase D: Roles & Permissions endpoint tests.
Covers GET /api/users, POST /api/users, PATCH /api/users/{id} with admin-only gating.
"""
import os
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
if not BASE_URL:
    # fall back to loading from frontend .env
    try:
        with open("/app/frontend/.env") as f:
            for line in f:
                if line.startswith("REACT_APP_BACKEND_URL="):
                    BASE_URL = line.split("=", 1)[1].strip().rstrip("/")
                    break
    except Exception:
        pass

ADMIN_EMAIL = "admin@buildcon.in"
ADMIN_PW = "buildcon123"
CLIENT_EMAIL = "client@kohli.in"
CLIENT_PW = "client123"


def _login(email, pw):
    r = requests.post(f"{BASE_URL}/api/auth/login", json={"email": email, "password": pw}, timeout=30)
    return r


# ---------- Auth ----------
@pytest.fixture(scope="module")
def admin_token():
    r = _login(ADMIN_EMAIL, ADMIN_PW)
    assert r.status_code == 200, f"admin login failed: {r.status_code} {r.text}"
    data = r.json()
    assert data["user"]["role"] == "admin"
    return data["access_token"]


@pytest.fixture(scope="module")
def client_token():
    r = _login(CLIENT_EMAIL, CLIENT_PW)
    assert r.status_code == 200, f"client login failed: {r.status_code} {r.text}"
    data = r.json()
    assert data["user"]["role"] == "client"
    return data["access_token"]


def _h(tok):
    return {"Authorization": f"Bearer {tok}"}


class TestAuthLogin:
    def test_admin_login(self):
        r = _login(ADMIN_EMAIL, ADMIN_PW)
        assert r.status_code == 200
        j = r.json()
        assert "access_token" in j and j["user"]["email"] == ADMIN_EMAIL and j["user"]["role"] == "admin"

    def test_client_login(self):
        r = _login(CLIENT_EMAIL, CLIENT_PW)
        assert r.status_code == 200
        j = r.json()
        assert j["user"]["role"] == "client"

    def test_bad_login(self):
        r = _login(ADMIN_EMAIL, "wrong")
        assert r.status_code == 401


# ---------- Users list (admin-only) ----------
class TestUsersList:
    def test_admin_gets_users(self, admin_token):
        r = requests.get(f"{BASE_URL}/api/users", headers=_h(admin_token), timeout=30)
        assert r.status_code == 200
        users = r.json()
        assert isinstance(users, list)
        emails = [u["email"] for u in users]
        assert ADMIN_EMAIL in emails
        assert CLIENT_EMAIL in emails
        # sanity — no password_hash / _id leaked
        for u in users:
            assert "password_hash" not in u
            assert "_id" not in u

    def test_client_forbidden(self, client_token):
        r = requests.get(f"{BASE_URL}/api/users", headers=_h(client_token), timeout=30)
        assert r.status_code == 403

    def test_no_token_unauthorized(self):
        r = requests.get(f"{BASE_URL}/api/users", timeout=30)
        # depending on impl either 401 or 403
        assert r.status_code in (401, 403)


# ---------- Create user (admin-only) ----------
class TestUserCreate:
    created_ids = []

    def test_client_cannot_create(self, client_token):
        r = requests.post(
            f"{BASE_URL}/api/users",
            headers=_h(client_token),
            json={"name": "Nope", "email": f"TEST_nope_{uuid.uuid4().hex[:6]}@ex.com", "role": "estimator"},
            timeout=30,
        )
        assert r.status_code == 403

    def test_admin_creates_user(self, admin_token):
        email = f"test.pm_{uuid.uuid4().hex[:8]}@buildcon.in"
        r = requests.post(
            f"{BASE_URL}/api/users",
            headers=_h(admin_token),
            json={"name": "TEST New PM", "email": email, "role": "project_manager"},
            timeout=30,
        )
        assert r.status_code in (200, 201), r.text
        j = r.json()
        assert "temp_password" in j and isinstance(j["temp_password"], str) and len(j["temp_password"]) >= 8
        assert j["user"]["email"] == email
        assert j["user"]["role"] == "project_manager"
        assert "password_hash" not in j["user"]
        TestUserCreate.created_ids.append(j["user"]["id"])
        # verify persisted via GET
        r2 = requests.get(f"{BASE_URL}/api/users", headers=_h(admin_token), timeout=30)
        emails = [u["email"] for u in r2.json()]
        assert email in emails

    def test_duplicate_email(self, admin_token):
        # create then attempt to create again with same email
        email = f"test.dup_{uuid.uuid4().hex[:6]}@buildcon.in"
        r1 = requests.post(
            f"{BASE_URL}/api/users",
            headers=_h(admin_token),
            json={"name": "Dup1", "email": email, "role": "estimator"},
            timeout=30,
        )
        assert r1.status_code in (200, 201)
        TestUserCreate.created_ids.append(r1.json()["user"]["id"])
        r2 = requests.post(
            f"{BASE_URL}/api/users",
            headers=_h(admin_token),
            json={"name": "Dup2", "email": email, "role": "estimator"},
            timeout=30,
        )
        assert r2.status_code == 400

    def test_invalid_role_on_create(self, admin_token):
        r = requests.post(
            f"{BASE_URL}/api/users",
            headers=_h(admin_token),
            json={"name": "Bad Role", "email": f"TEST_badrole_{uuid.uuid4().hex[:6]}@ex.com", "role": "supreme_leader"},
            timeout=30,
        )
        assert r.status_code == 400


# ---------- Patch user (admin-only) ----------
class TestUserPatch:
    @pytest.fixture(scope="class")
    def target_user_id(self, admin_token):
        email = f"test.patch_{uuid.uuid4().hex[:8]}@buildcon.in"
        r = requests.post(
            f"{BASE_URL}/api/users",
            headers=_h(admin_token),
            json={"name": "TEST Patch Target", "email": email, "role": "project_manager"},
            timeout=30,
        )
        assert r.status_code in (200, 201)
        return r.json()["user"]["id"]

    def test_admin_updates_role(self, admin_token, target_user_id):
        r = requests.patch(
            f"{BASE_URL}/api/users/{target_user_id}",
            headers=_h(admin_token),
            json={"role": "estimator"},
            timeout=30,
        )
        assert r.status_code == 200
        assert r.json()["role"] == "estimator"
        # verify via list
        r2 = requests.get(f"{BASE_URL}/api/users", headers=_h(admin_token), timeout=30)
        u = next((x for x in r2.json() if x["id"] == target_user_id), None)
        assert u is not None and u["role"] == "estimator"

    def test_client_cannot_patch(self, client_token, target_user_id):
        r = requests.patch(
            f"{BASE_URL}/api/users/{target_user_id}",
            headers=_h(client_token),
            json={"role": "architect"},
            timeout=30,
        )
        assert r.status_code == 403

    def test_invalid_role_on_patch(self, admin_token, target_user_id):
        r = requests.patch(
            f"{BASE_URL}/api/users/{target_user_id}",
            headers=_h(admin_token),
            json={"role": "chief_wizard"},
            timeout=30,
        )
        assert r.status_code == 400

    def test_patch_nonexistent_user(self, admin_token):
        r = requests.patch(
            f"{BASE_URL}/api/users/does-not-exist-xyz",
            headers=_h(admin_token),
            json={"role": "estimator"},
            timeout=30,
        )
        assert r.status_code == 404


# ---------- Regression: existing endpoints still work with admin token ----------
class TestRegression:
    def test_dashboard_summary(self, admin_token):
        r = requests.get(f"{BASE_URL}/api/dashboard/summary", headers=_h(admin_token), timeout=30)
        assert r.status_code == 200
        assert isinstance(r.json(), dict)

    def test_projects_list(self, admin_token):
        r = requests.get(f"{BASE_URL}/api/projects", headers=_h(admin_token), timeout=30)
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_auth_me(self, admin_token):
        r = requests.get(f"{BASE_URL}/api/auth/me", headers=_h(admin_token), timeout=30)
        assert r.status_code == 200
        assert r.json()["email"] == ADMIN_EMAIL

    def test_vendors_summary(self, admin_token):
        r = requests.get(f"{BASE_URL}/api/vendors/summary", headers=_h(admin_token), timeout=30)
        assert r.status_code == 200

    def test_notifications(self, admin_token):
        r = requests.get(f"{BASE_URL}/api/notifications", headers=_h(admin_token), timeout=30)
        assert r.status_code == 200
