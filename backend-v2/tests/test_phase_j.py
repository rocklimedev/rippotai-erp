"""Phase J tests: signup, demo-requests, admin migration"""
import os
import time
import pytest
import requests

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://buildcon-erp.preview.emergentagent.com').rstrip('/')
API = f"{BASE_URL}/api"


# ---------- Signup ----------
class TestSignup:
    def test_signup_success(self):
        email = f"test_phasej_{int(time.time()*1000)}@example.com"
        r = requests.post(f"{API}/auth/signup", json={
            "name": "Test Phase J",
            "email": email,
            "password": "phasejpass1",
        })
        assert r.status_code == 200, r.text
        data = r.json()
        assert "access_token" in data and isinstance(data["access_token"], str) and len(data["access_token"]) > 0
        assert data.get("token_type") == "bearer"
        user = data["user"]
        assert user["email"] == email
        assert user["role"] == "member"
        assert user["plan"] == "free_trial"
        assert user["is_super_admin"] is False
        assert "password_hash" not in user
        assert "_id" not in user

        # Verify /auth/me returns the same
        me = requests.get(f"{API}/auth/me", headers={"Authorization": f"Bearer {data['access_token']}"})
        assert me.status_code == 200, me.text
        me_body = me.json()
        assert me_body["email"] == email
        assert me_body["plan"] == "free_trial"
        assert me_body["is_super_admin"] is False
        assert me_body["role"] == "member"

    def test_signup_duplicate_email_returns_400(self):
        email = f"test_phasej_dup_{int(time.time()*1000)}@example.com"
        first = requests.post(f"{API}/auth/signup", json={"name": "Dup", "email": email, "password": "p1"})
        assert first.status_code == 200, first.text
        second = requests.post(f"{API}/auth/signup", json={"name": "Dup2", "email": email, "password": "p2"})
        assert second.status_code == 400
        assert "already registered" in second.json().get("detail", "").lower()

    def test_signup_missing_field_422(self):
        r = requests.post(f"{API}/auth/signup", json={"email": "x@y.com", "password": "p"})
        assert r.status_code == 422


# ---------- Demo requests ----------
class TestDemoRequests:
    def test_demo_request_success(self):
        r = requests.post(f"{API}/demo-requests", json={
            "name": "Priya",
            "email": "priya@studio.in",
            "firm": "Studio Priya",
            "phone": "+91-9876543210",
            "message": "We want to see INOS for a 12-project residential firm.",
        })
        assert r.status_code == 200, r.text
        data = r.json()
        assert data.get("ok") is True
        assert isinstance(data.get("id"), str) and len(data["id"]) > 0

    def test_demo_request_missing_message_422(self):
        r = requests.post(f"{API}/demo-requests", json={
            "name": "X", "email": "x@y.com", "firm": "", "phone": ""
        })
        assert r.status_code == 422

    def test_demo_request_missing_name_422(self):
        # Name field omitted -> Pydantic 422
        r = requests.post(f"{API}/demo-requests", json={
            "email": "x@y.com", "message": "hello", "firm": "", "phone": ""
        })
        assert r.status_code == 422

    def test_demo_request_empty_name_422(self):
        # Name present but empty -> our strip check should yield 422
        r = requests.post(f"{API}/demo-requests", json={
            "name": "   ", "email": "x@y.com", "message": "hello"
        })
        assert r.status_code == 422

    def test_demo_request_empty_message_422(self):
        r = requests.post(f"{API}/demo-requests", json={
            "name": "Priya", "email": "priya@studio.in", "message": "   "
        })
        assert r.status_code == 422


# ---------- Admin migration ----------
class TestAdminMigration:
    def test_admin_is_super_admin(self):
        r = requests.post(f"{API}/auth/login", json={
            "email": "admin@buildcon.in", "password": "buildcon123"
        })
        assert r.status_code == 200, r.text
        data = r.json()
        token = data["access_token"]
        me = requests.get(f"{API}/auth/me", headers={"Authorization": f"Bearer {token}"})
        assert me.status_code == 200
        body = me.json()
        assert body["email"] == "admin@buildcon.in"
        assert body["is_super_admin"] is True
        assert body["plan"] == "super_admin"


# ---------- Landing page HTML title ----------
class TestLandingPageTitle:
    def test_html_title_is_inos(self):
        r = requests.get(f"{BASE_URL}/index.html")
        # Fallback to root
        html = r.text if r.status_code == 200 else requests.get(BASE_URL + "/").text
        assert "INOS" in html
