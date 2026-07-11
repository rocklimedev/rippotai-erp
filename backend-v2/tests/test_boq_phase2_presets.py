"""BOQ Phase 2 — Preset items injection regression suite.

Covers:
  * Catalog exposes 21 categories with unique codes and preset counts:
      PT=6, EL=7, PL=6, SW=6, FC=5, WP=5, MF=5, LT=5  (total 45 items)
  * End-to-end injection for each of the 8 preset codes on a fresh draft BOQ:
    items grow by exactly N, categories grow by 1 with correct name/code, all
    injected items present with unit + rate + calc_type, subtotal starts 0 for
    measured items, WP4 (Lump ₹28000) reflects immediately as amount.
  * Idempotency: repeat GET /api/boq-catalog does not multiply preset items.
  * Regression: Kohli V1 totals and boq list count untouched.
"""
import os
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://buildcon-erp.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

KOHLI_V1_ID = "520271e4-36b2-4270-8f2f-1d09db46603b"

EXPECTED_PRESETS = {
    "PT": ("Painting", 6),
    "EL": ("Electrical", 7),
    "PL": ("Plumbing", 6),
    "SW": ("Sanitaryware", 6),
    "FC": ("False Ceiling", 5),
    "WP": ("Waterproofing", 5),
    "MF": ("Modular Furniture", 5),
    "LT": ("Lighting", 5),
}


# ---------- fixtures ----------
@pytest.fixture(scope="session")
def token():
    r = requests.post(f"{API}/auth/login",
                      json={"email": "admin@buildcon.in", "password": "buildcon123"}, timeout=20)
    assert r.status_code == 200, r.text
    j = r.json()
    return j.get("token") or j.get("access_token")


@pytest.fixture(scope="session")
def s(token):
    sess = requests.Session()
    sess.headers.update({"Authorization": f"Bearer {token}", "Content-Type": "application/json"})
    return sess


@pytest.fixture()
def draft_boq(s):
    """Duplicate Kohli V1 → yields a fresh throw-away draft id. Deleted in teardown."""
    r = s.post(f"{API}/boqs/{KOHLI_V1_ID}/duplicate-version",
               json={"version_label": f"TEST_{uuid.uuid4().hex[:6]}"})
    assert r.status_code in (200, 201), r.text
    bid = r.json()["id"]
    yield bid
    try:
        s.delete(f"{API}/boqs/{bid}")
    except Exception:
        pass


# ---------- Catalog listing ----------
def test_catalog_has_21_unique_codes(s):
    r = s.get(f"{API}/boq-catalog")
    assert r.status_code == 200
    cats = r.json()
    assert len(cats) == 21, f"expected 21 catalog categories got {len(cats)}"
    codes = [c.get("code") for c in cats]
    assert all(codes), f"one or more categories missing code: {codes}"
    assert len(set(codes)) == len(codes), f"duplicate codes: {codes}"


@pytest.mark.parametrize("code,expected", list(EXPECTED_PRESETS.items()))
def test_catalog_preset_item_counts(s, code, expected):
    name, n = expected
    r = s.get(f"{API}/boq-catalog")
    assert r.status_code == 200
    cats = {c["code"]: c for c in r.json()}
    assert code in cats, f"missing catalog code {code}"
    c = cats[code]
    assert c["name"] == name, f"code {code} name mismatch: {c['name']} != {name}"
    items = c.get("items") or []
    assert len(items) == n, f"code {code} expected {n} items got {len(items)}"
    for it in items:
        assert it.get("description"), f"{code} item missing description: {it}"
        assert it.get("unit"), f"{code} item missing unit: {it}"
        assert float(it.get("default_rate", 0)) > 0, f"{code} item non-positive rate: {it}"
        assert it.get("calc_type") in ("M", "L"), f"{code} item bad calc_type: {it}"


# ---------- End-to-end injection ----------
@pytest.mark.parametrize("code", list(EXPECTED_PRESETS.keys()))
def test_inject_preset_category(s, draft_boq, code):
    name, n = EXPECTED_PRESETS[code]
    # baseline
    r = s.get(f"{API}/boqs/{draft_boq}")
    assert r.status_code == 200
    before = r.json()
    n_items_before = len(before.get("items", []))
    n_cats_before = len(before.get("categories", []))

    # inject
    r = s.post(f"{API}/boqs/{draft_boq}/categories",
               json={"catalog_code": code, "include_items": True})
    assert r.status_code == 200, f"{code} inject failed: {r.status_code} {r.text}"
    after = r.json()
    assert len(after["items"]) == n_items_before + n, \
        f"{code} expected +{n} items got +{len(after['items']) - n_items_before}"
    assert len(after["categories"]) == n_cats_before + 1, f"{code} category not added"

    # find the injected category
    injected_cat = next((c for c in after["categories"]
                         if c.get("code") == code or c.get("name") == name), None)
    assert injected_cat is not None, f"{code} injected cat not found in response"
    assert injected_cat["name"] == name
    assert injected_cat["code"] == code

    # items linked to that category
    cat_id = injected_cat["id"]
    cat_items = [it for it in after["items"] if it.get("category_id") == cat_id]
    assert len(cat_items) == n, f"{code} expected {n} items linked, got {len(cat_items)}"

    for it in cat_items:
        assert it.get("description")
        assert it.get("unit")
        assert it.get("calc_type") in ("M", "L")
        if it["calc_type"] == "M":
            # measured items start with qty=0 → amount 0
            assert float(it.get("quantity", 0)) == 0
            assert float(it.get("amount", 0)) == 0
            assert float(it.get("rate", 0)) > 0

    # WP4: Lump item should have amount == default_rate (28000) immediately
    if code == "WP":
        l_items = [it for it in cat_items if it.get("calc_type") == "L"]
        assert len(l_items) == 1, f"WP expected 1 L-type item got {len(l_items)}"
        wp4 = l_items[0]
        assert "sump" in (wp4.get("description") or "").lower(), \
            f"L-type WP item not Sump: {wp4.get('description')}"
        assert float(wp4["amount"]) == 28000, f"WP4 amount expected 28000 got {wp4['amount']}"


# ---------- Idempotency ----------
def test_idempotent_catalog_counts(s):
    r1 = s.get(f"{API}/boq-catalog").json()
    r2 = s.get(f"{API}/boq-catalog").json()
    a = {c["code"]: len(c.get("items") or []) for c in r1}
    b = {c["code"]: len(c.get("items") or []) for c in r2}
    assert a == b, f"catalog item counts drifted: {a} vs {b}"
    for code, (_, n) in EXPECTED_PRESETS.items():
        assert a[code] == n, f"{code} count {a[code]} != {n}"


# ---------- Regression ----------
def test_kohli_v1_unchanged(s):
    r = s.get(f"{API}/boqs/{KOHLI_V1_ID}")
    assert r.status_code == 200
    j = r.json()
    assert len(j["items"]) == 41, f"Kohli V1 items expected 41 got {len(j['items'])}"
    assert float(j.get("final_total") or j.get("total") or 0) == 3116080, \
        f"Kohli V1 final total drift: {j.get('final_total')}"


def test_boqs_counts(s):
    r = s.get(f"{API}/boqs")
    assert r.status_code == 200
    n_total = len(r.json())
    r2 = s.get(f"{API}/boqs", params={"status": "approved"})
    assert r2.status_code == 200
    n_approved = len(r2.json())
    # Report but only hard-fail if approved != 3 and total not in tolerance
    print(f"[boqs] total={n_total} approved={n_approved}")
    assert n_approved == 3, f"expected 3 approved BOQs, got {n_approved}"
    # allow >=7 total (test residuals possible) but flag if off
    assert n_total >= 7


def test_openapi_boq_catalog_path():
    r = requests.get(f"{API}/openapi.json", timeout=20)
    assert r.status_code == 200
    assert "/api/boq-catalog" in r.json()["paths"]
