"""Phase K — free-trial gating + super-admin endpoints."""
import os
import time
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/") or "https://buildcon-erp.preview.emergentagent.com"
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "admin@buildcon.in"
ADMIN_PASS = "buildcon123"


def _login(email, password):
    r = requests.post(f"{API}/auth/login", json={"email": email, "password": password})
    assert r.status_code == 200, f"login failed for {email}: {r.status_code} {r.text}"
    return r.json()["access_token"], r.json()["user"]


def _signup(email, password, name="Phase K FT"):
    r = requests.post(f"{API}/auth/signup", json={"name": name, "email": email, "password": password})
    assert r.status_code == 200, f"signup failed: {r.status_code} {r.text}"
    return r.json()["access_token"], r.json()["user"]


def _hdr(tok):
    return {"Authorization": f"Bearer {tok}"}


# --- 1. signup defaults ---
def test_signup_defaults_role_plan_super_admin():
    email = f"TEST_phaseK_signup_{int(time.time()*1000)}@example.com"
    tok, u = _signup(email, "pass1234!")
    assert u["role"] == "member"
    assert u["plan"] == "free_trial"
    assert u["is_super_admin"] is False


# --- 2. admin /me confirms plan=super_admin ---
def test_admin_me_super_admin():
    tok, _ = _login(ADMIN_EMAIL, ADMIN_PASS)
    r = requests.get(f"{API}/auth/me", headers=_hdr(tok))
    assert r.status_code == 200
    data = r.json()
    assert data.get("plan") == "super_admin"
    assert data.get("is_super_admin") is True


# --- 3. free-trial BOQ cap: 3 succeed, 4th -> 402 ---
def test_boq_free_trial_cap_and_upgrade():
    email = f"TEST_phaseK_boq_{int(time.time()*1000)}@example.com"
    tok, u = _signup(email, "pass1234!")
    hdr = _hdr(tok)

    # Create a project first (BOQ requires project_id)
    pr = requests.post(f"{API}/projects", headers=hdr, json={"name": "TEST_phaseK_proj", "client_name": "TEST_c", "project_type": "Residential Interior"})
    assert pr.status_code in (200, 201), f"project create failed {pr.status_code} {pr.text}"
    proj_id = pr.json()["id"]

    # BOQ creation payload — minimal
    payload = {"project_id": proj_id, "title": "TEST_boq_capcheck", "version": "V1"}

    for i in range(3):
        r = requests.post(f"{API}/boqs", headers=hdr, json={**payload, "title": f"TEST_boq_{i}"})
        assert r.status_code in (200, 201), f"BOQ #{i+1} unexpected {r.status_code} {r.text}"

    # 4th should 402
    r4 = requests.post(f"{API}/boqs", headers=hdr, json={**payload, "title": "TEST_boq_4"})
    assert r4.status_code == 402, f"expected 402 got {r4.status_code} {r4.text}"
    detail = r4.json().get("detail", "")
    assert "Upgrade to create more" in detail

    # Admin patch plan -> studio
    adm_tok, _ = _login(ADMIN_EMAIL, ADMIN_PASS)
    pr = requests.patch(f"{API}/super-admin/users/{u['id']}", headers=_hdr(adm_tok), json={"plan": "studio"})
    assert pr.status_code == 200, pr.text
    assert pr.json()["plan"] == "studio"

    # Now 4th BOQ should pass
    r5 = requests.post(f"{API}/boqs", headers=hdr, json={**payload, "title": "TEST_boq_4b"})
    assert r5.status_code in (200, 201), f"post-upgrade BOQ failed {r5.status_code} {r5.text}"


# --- 4. list users authorization ---
def test_super_admin_list_users_authz():
    # As admin -> 200 list
    adm_tok, _ = _login(ADMIN_EMAIL, ADMIN_PASS)
    r = requests.get(f"{API}/super-admin/users", headers=_hdr(adm_tok))
    assert r.status_code == 200
    users = r.json()
    assert isinstance(users, list)
    assert any(u.get("email") == ADMIN_EMAIL for u in users)

    # As free-trial -> 403
    email = f"TEST_phaseK_ft_{int(time.time()*1000)}@example.com"
    ft_tok, _ = _signup(email, "pass1234!")
    r2 = requests.get(f"{API}/super-admin/users", headers=_hdr(ft_tok))
    assert r2.status_code == 403
    assert "Super admin access required" in r2.json().get("detail", "")


# --- 5. patch role admin + invalid values -> 422 ---
def test_super_admin_patch_role_and_invalid_values():
    email = f"TEST_phaseK_patch_{int(time.time()*1000)}@example.com"
    _tok, u = _signup(email, "pass1234!")
    adm_tok, _ = _login(ADMIN_EMAIL, ADMIN_PASS)

    r = requests.patch(f"{API}/super-admin/users/{u['id']}", headers=_hdr(adm_tok), json={"role": "admin"})
    assert r.status_code == 200
    assert r.json()["role"] == "admin"

    r2 = requests.patch(f"{API}/super-admin/users/{u['id']}", headers=_hdr(adm_tok), json={"role": "bogus_role"})
    assert r2.status_code == 422

    r3 = requests.patch(f"{API}/super-admin/users/{u['id']}", headers=_hdr(adm_tok), json={"plan": "bogus_plan"})
    assert r3.status_code == 422


# --- 6. delete user (soft) + self-delete 400 ---
def test_super_admin_delete_user_and_self_delete():
    email = f"TEST_phaseK_del_{int(time.time()*1000)}@example.com"
    _tok, u = _signup(email, "pass1234!")
    adm_tok, adm = _login(ADMIN_EMAIL, ADMIN_PASS)

    r = requests.delete(f"{API}/super-admin/users/{u['id']}", headers=_hdr(adm_tok))
    assert r.status_code == 200
    assert r.json().get("ok") is True

    # verify is_active=false via list
    users = requests.get(f"{API}/super-admin/users", headers=_hdr(adm_tok)).json()
    found = next((x for x in users if x["id"] == u["id"]), None)
    assert found is not None
    assert found.get("is_active") is False

    # Self-delete -> 400
    rself = requests.delete(f"{API}/super-admin/users/{adm['id']}", headers=_hdr(adm_tok))
    assert rself.status_code == 400


# --- 7. reset password returns temp + login works ---
def test_super_admin_reset_password_and_login():
    email = f"TEST_phaseK_rp_{int(time.time()*1000)}@example.com"
    _tok, u = _signup(email, "origPass!")
    adm_tok, _ = _login(ADMIN_EMAIL, ADMIN_PASS)

    r = requests.post(f"{API}/super-admin/users/{u['id']}/reset-password", headers=_hdr(adm_tok))
    assert r.status_code == 200
    body = r.json()
    assert isinstance(body.get("temp_password"), str) and len(body["temp_password"]) >= 8
    assert body.get("email_sent") is False

    # login with temp password
    lr = requests.post(f"{API}/auth/login", json={"email": email, "password": body["temp_password"]})
    assert lr.status_code == 200, lr.text
