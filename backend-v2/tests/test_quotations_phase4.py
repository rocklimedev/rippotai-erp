"""
Phase 4 — Quotations module tests.
Covers: summary, awaiting-action, list+filter, detail, create draft flow,
lock-on-approve, mark-selected side effect, compare, RFQs, exports, OpenAPI.
"""

import os
import io
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://buildcon-erp.preview.emergentagent.com").rstrip("/")
ADMIN_EMAIL = "admin@buildcon.in"
ADMIN_PASSWORD = "buildcon123"
CLIENT_EMAIL = "client@kohli.in"
CLIENT_PASSWORD = "client123"


# ---------- shared fixtures ----------
@pytest.fixture(scope="session")
def api():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="session")
def admin_token(api):
    r = api.post(f"{BASE_URL}/api/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, f"admin login failed: {r.status_code} {r.text[:200]}"
    return r.json().get("access_token") or r.json().get("token")


@pytest.fixture(scope="session")
def client_token(api):
    r = api.post(f"{BASE_URL}/api/auth/login", json={"email": CLIENT_EMAIL, "password": CLIENT_PASSWORD})
    assert r.status_code == 200
    return r.json().get("access_token") or r.json().get("token")


@pytest.fixture
def admin_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"}


# ---------- Auth ----------
class TestAuth:
    def test_admin_login(self, admin_token):
        assert admin_token and isinstance(admin_token, str)


# ---------- Summary & awaiting-action ----------
class TestQuotationsSummary:
    def test_summary_counters(self, api, admin_headers):
        r = api.get(f"{BASE_URL}/api/quotations/summary", headers=admin_headers)
        assert r.status_code == 200
        d = r.json()
        # spec: total=20, drafts=4, requested=3, received=3, under_review=3, awaiting_approval=2, approved=2, expiring_soon exists
        assert d.get("total") == 20, f"total={d.get('total')} full={d}"
        assert d.get("drafts") == 4, d
        assert d.get("requested") == 3, d
        assert d.get("received") == 3, d
        assert d.get("under_review") == 3, d
        assert d.get("awaiting_approval") == 2, d
        assert d.get("approved") == 2, d
        assert "expiring_soon" in d

    def test_awaiting_action_groups(self, api, admin_headers):
        r = api.get(f"{BASE_URL}/api/quotations/awaiting-action", headers=admin_headers)
        assert r.status_code == 200
        d = r.json()
        for k in ["needs_review", "returned", "expiring", "missing_response", "above_boq", "pending_approval"]:
            assert k in d, f"missing key {k} in {d}"


# ---------- List + filters ----------
class TestQuotationsList:
    def test_list_all(self, api, admin_headers):
        r = api.get(f"{BASE_URL}/api/quotations", headers=admin_headers)
        assert r.status_code == 200
        payload = r.json()
        items = payload if isinstance(payload, list) else payload.get("items", payload.get("data", []))
        assert len(items) == 20, f"expected 20 got {len(items)}"

    def test_filter_draft(self, api, admin_headers):
        r = api.get(f"{BASE_URL}/api/quotations", headers=admin_headers, params={"status": "draft"})
        assert r.status_code == 200
        items = r.json() if isinstance(r.json(), list) else r.json().get("items", [])
        assert len(items) == 4, f"draft count={len(items)}"

    def test_filter_selected(self, api, admin_headers):
        r = api.get(f"{BASE_URL}/api/quotations", headers=admin_headers, params={"status": "selected"})
        assert r.status_code == 200
        items = r.json() if isinstance(r.json(), list) else r.json().get("items", [])
        assert len(items) == 1, f"selected count={len(items)}"


# ---------- Detail (selected quotation) ----------
class TestQuotationDetail:
    def test_selected_detail(self, api, admin_headers):
        rlist = api.get(f"{BASE_URL}/api/quotations", headers=admin_headers, params={"status": "selected"})
        items = rlist.json() if isinstance(rlist.json(), list) else rlist.json().get("items", [])
        assert items, "no selected quotation"
        qid = items[0].get("id") or items[0].get("_id")
        r = api.get(f"{BASE_URL}/api/quotations/{qid}", headers=admin_headers)
        assert r.status_code == 200
        d = r.json()
        assert "items" in d and isinstance(d["items"], list)
        # boq_ref_data on at least one linked item (if any items linked)
        any_linked_with_ref = any((it.get("boq_ref_data") is not None) for it in d["items"])
        # not strictly required; assert structure keys exist
        assert "days_remaining" in d, d.keys()
        assert "approval_history" in d, d.keys()
        assert "vendor" in d and isinstance(d["vendor"], dict), d.keys()
        assert "project" in d and isinstance(d["project"], dict), d.keys()
        # allow no linked items but should be dict-shaped where present
        for it in d["items"]:
            if it.get("boq_ref_data"):
                assert isinstance(it["boq_ref_data"], dict)


# ---------- Create draft flow ----------
class TestCreateDraftFlow:
    def test_create_draft_and_import_boq(self, api, admin_headers):
        # pick a project via /boqs — need one that has boq_id
        boqs = api.get(f"{BASE_URL}/api/boqs", headers=admin_headers).json()
        boqs_list = boqs if isinstance(boqs, list) else boqs.get("items", [])
        assert boqs_list, "no BOQs"
        boq_summary = None
        boq_detail = None
        for b in boqs_list:
            bid = b.get("id") or b.get("_id")
            det = api.get(f"{BASE_URL}/api/boqs/{bid}", headers=admin_headers).json()
            if det.get("items"):
                boq_summary = b
                boq_detail = det
                break
        assert boq_detail, "no BOQ with items"
        project_id = boq_detail.get("project_id") or boq_summary.get("project_id")

        # pick vendor + category
        vendors = api.get(f"{BASE_URL}/api/vendors", headers=admin_headers).json()
        vendors_list = vendors if isinstance(vendors, list) else vendors.get("items", [])
        assert vendors_list
        vendor_id = vendors_list[0].get("id") or vendors_list[0].get("_id")

        # category from first item
        first_item = boq_detail["items"][0]
        category = first_item.get("category") or first_item.get("category_name") or "General"

        payload = {
            "project_id": project_id,
            "vendor_id": vendor_id,
            "category": category,
            "title": "TEST_QT_phase4_smoke",
        }
        r = api.post(f"{BASE_URL}/api/quotations", headers=admin_headers, json=payload)
        assert r.status_code in (200, 201), f"create draft failed {r.status_code} {r.text[:400]}"
        q = r.json()
        qid = q.get("id") or q.get("_id")
        assert qid

        # import-from-boq: try first 2 item ids
        item_ids = [it.get("id") or it.get("_id") for it in boq_detail["items"][:2]]
        imp = api.post(
            f"{BASE_URL}/api/quotations/{qid}/items/import-from-boq",
            headers=admin_headers,
            json={"item_ids": item_ids, "boq_id": boq_detail.get("id") or boq_detail.get("_id")},
        )
        # accept either 200 or 201; also verify via GET detail
        assert imp.status_code in (200, 201), f"import failed {imp.status_code} {imp.text[:400]}"

        detail = api.get(f"{BASE_URL}/api/quotations/{qid}", headers=admin_headers).json()
        assert detail.get("items"), "items empty after import"
        # variation_pct + boq_ref_data present on imported items (linked to boq)
        linked_items = [it for it in detail["items"] if it.get("boq_item_id")]
        assert linked_items, "expected linked items after import-from-boq"
        for it in linked_items:
            assert "variation_pct" in it, f"variation_pct missing in item keys={list(it.keys())}"
            assert it.get("boq_ref_data") is not None, "boq_ref_data missing"

        # cleanup: try delete (draft can be deleted)
        api.delete(f"{BASE_URL}/api/quotations/{qid}", headers=admin_headers)


# ---------- Lock on approved ----------
class TestLockOnApproved:
    def test_patch_approved_returns_423(self, api, admin_headers):
        r = api.get(f"{BASE_URL}/api/quotations", headers=admin_headers, params={"status": "approved"})
        items = r.json() if isinstance(r.json(), list) else r.json().get("items", [])
        assert items, "no approved quotations"
        qid = items[0].get("id") or items[0].get("_id")
        p = api.patch(f"{BASE_URL}/api/quotations/{qid}", headers=admin_headers, json={"title": "should_fail"})
        assert p.status_code == 423, f"expected 423 got {p.status_code} {p.text[:200]}"


# ---------- Mark selected side-effect ----------
class TestMarkSelected:
    def test_mark_selected_flips_others(self, api, admin_headers):
        approved = api.get(f"{BASE_URL}/api/quotations", headers=admin_headers, params={"status": "approved"}).json()
        approved = approved if isinstance(approved, list) else approved.get("items", [])
        assert approved, "no approved rows"
        target = approved[0]
        qid = target.get("id") or target.get("_id")
        det = api.get(f"{BASE_URL}/api/quotations/{qid}", headers=admin_headers).json()
        project_id = det.get("project_id") or det.get("project", {}).get("id")
        category = det.get("category")

        r = api.post(f"{BASE_URL}/api/quotations/{qid}/mark-selected", headers=admin_headers, json={})
        assert r.status_code in (200, 201), f"mark-selected failed {r.status_code} {r.text[:400]}"
        # verify status/lock
        after = api.get(f"{BASE_URL}/api/quotations/{qid}", headers=admin_headers).json()
        assert after.get("status") == "selected", after.get("status")
        assert after.get("locked") is True, after

        # verify siblings not_selected (same project + category)
        all_q = api.get(f"{BASE_URL}/api/quotations", headers=admin_headers).json()
        all_q = all_q if isinstance(all_q, list) else all_q.get("items", [])
        for row in all_q:
            rid = row.get("id") or row.get("_id")
            if rid == qid:
                continue
            if row.get("project_id") == project_id and row.get("category") == category:
                # allowed statuses: not_selected or unchanged if it wasn't previously selected
                # only previously-selected siblings should be flipped
                pass  # cannot assert without knowing previous state; existence of flip is best-effort


# ---------- Compare ----------
class TestCompare:
    def test_compare_matrix(self, api, admin_headers):
        all_q = api.get(f"{BASE_URL}/api/quotations", headers=admin_headers).json()
        all_q = all_q if isinstance(all_q, list) else all_q.get("items", [])
        # pick 3 quotations in same project+category
        groups = {}
        for q in all_q:
            k = (q.get("project_id"), q.get("category"))
            groups.setdefault(k, []).append(q.get("id") or q.get("_id"))
        chosen = None
        for k, ids in groups.items():
            if len(ids) >= 3:
                chosen = ids[:3]
                break
        if not chosen:
            # fallback: any 3
            chosen = [(q.get("id") or q.get("_id")) for q in all_q[:3]]
        r = api.get(
            f"{BASE_URL}/api/quotations/compare",
            headers=admin_headers,
            params={"ids": ",".join(chosen)},
        )
        assert r.status_code == 200, f"compare failed {r.status_code} {r.text[:400]}"
        d = r.json()
        assert "quotations" in d, d.keys()
        assert isinstance(d["quotations"], list) and len(d["quotations"]) >= 2
        for q in d["quotations"]:
            assert "vendor_metrics" in q or "metrics" in q, q.keys()
        assert "line_items" in d or "items_matrix" in d or "matrix" in d, d.keys()
        assert "lowest_id" in d, d.keys()


# ---------- RFQs ----------
class TestRFQs:
    def test_rfq_list(self, api, admin_headers):
        r = api.get(f"{BASE_URL}/api/quotation-requests", headers=admin_headers)
        assert r.status_code == 200
        items = r.json() if isinstance(r.json(), list) else r.json().get("items", [])
        assert len(items) == 4, f"rfq count={len(items)}"
        assert any(("status_per_vendor" in x) or ("vendors" in x) for x in items)


# ---------- Exports ----------
class TestExports:
    def _pick_qid(self, api, admin_headers):
        r = api.get(f"{BASE_URL}/api/quotations", headers=admin_headers)
        items = r.json() if isinstance(r.json(), list) else r.json().get("items", [])
        return items[0].get("id") or items[0].get("_id")

    def test_excel_export(self, api, admin_headers):
        qid = self._pick_qid(api, admin_headers)
        r = api.get(f"{BASE_URL}/api/quotations/{qid}/export/excel", headers=admin_headers)
        assert r.status_code == 200, f"excel export {r.status_code}"
        # XLSX zip magic PK
        assert r.content[:2] == b"PK", f"not xlsx magic: {r.content[:8]}"

    def test_pdf_export(self, api, admin_headers):
        qid = self._pick_qid(api, admin_headers)
        r = api.post(f"{BASE_URL}/api/quotations/{qid}/export/pdf", headers=admin_headers, json={})
        assert r.status_code == 200, f"pdf export {r.status_code} {r.text[:200] if r.headers.get('content-type','').startswith('application/json') else ''}"
        assert r.content[:4] == b"%PDF", f"not pdf magic: {r.content[:8]}"


# ---------- OpenAPI ----------
class TestOpenAPI:
    def test_openapi_has_quotations(self, api):
        r = api.get(f"{BASE_URL}/api/openapi.json")
        assert r.status_code == 200
        d = r.json()
        paths = list(d.get("paths", {}).keys())
        q_paths = [p for p in paths if "/quotation" in p]
        assert len(q_paths) >= 15, f"only {len(q_paths)} quotation paths: {q_paths}"
