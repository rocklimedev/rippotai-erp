"""Regression test: Total Vendors == sum(availability-mix) invariant.

Bug: /api/vendors/summary previously excluded blocked+archived from `total`,
causing mismatch with donut chart which counts ALL vendors.
Fix: total now = db.vendors.count_documents({}).
"""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://buildcon-erp.preview.emergentagent.com").rstrip("/")


@pytest.fixture(scope="module")
def auth_token():
    r = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": "admin@buildcon.in", "password": "buildcon123"},
        timeout=15,
    )
    assert r.status_code == 200, f"Login failed: {r.status_code} {r.text}"
    return r.json()["access_token"]


@pytest.fixture(scope="module")
def headers(auth_token):
    return {"Authorization": f"Bearer {auth_token}"}


class TestVendorsSummaryInvariant:
    def test_total_equals_availability_mix_sum(self, headers):
        s = requests.get(f"{BASE_URL}/api/vendors/summary", headers=headers, timeout=15)
        assert s.status_code == 200
        summary = s.json()

        m = requests.get(f"{BASE_URL}/api/dashboards/vendors/availability-mix", headers=headers, timeout=15)
        assert m.status_code == 200
        mix = m.json()

        mix_sum = sum(int(v) for v in mix.values())
        assert summary["total"] == mix_sum, (
            f"Total Vendors ({summary['total']}) != sum(availability-mix) ({mix_sum}). "
            f"summary={summary} mix={mix}"
        )

    def test_summary_returns_required_fields(self, headers):
        r = requests.get(f"{BASE_URL}/api/vendors/summary", headers=headers, timeout=15)
        assert r.status_code == 200
        data = r.json()
        for key in ["total", "verified", "available", "active_project", "recently_added", "attention"]:
            assert key in data, f"Missing key: {key}"
            assert isinstance(data[key], int)

    def test_verified_and_available_are_bounded_by_total(self, headers):
        """Regression: verified/available still filter blocked+archived, so they should be <= total."""
        r = requests.get(f"{BASE_URL}/api/vendors/summary", headers=headers, timeout=15)
        data = r.json()
        assert data["verified"] <= data["total"]
        assert data["available"] <= data["total"]
