# Search API Specification

Review owner: ERP backend maintainers (Search module)
Last reviewed: 2026-10-10

This file includes design examples that may differ from live response shapes. The implemented authorization policy and staging validation procedure are documented in [Search security](../search-security.md).

**Version:** 2.0  
**Base path:** `/search`

---

## 1. Global Search

```
GET /search
```

### Query Parameters

| Param       | Type     | Required | Description                                      |
|-------------|----------|----------|--------------------------------------------------|
| `q`         | string   | Yes*     | Search query (*optional only for filter-only)    |
| `types`     | string   | No       | Comma-separated entity types (e.g. `project,boq,document`) |
| `projectId` | string   | No       | Restrict to one project                          |
| `clientId`  | string   | No       | Restrict to one client                           |
| `status`    | string   | No       | Filter by status                                 |
| `from`      | date     | No       | Updated/created after (ISO)                      |
| `to`        | date     | No       | Updated/created before (ISO)                     |
| `page`      | number   | No       | 1-based page (default 1)                         |
| `pageSize`  | number   | No       | Default 20, max 50                               |
| `includeDeleted` | boolean | No    | Admin only                                       |

### Response Shape

```json
{
  "results": [
    {
      "entity_type": "project",
      "id": "uuid",
      "title": "Residential Villa – Phase 2",
      "subtitle": "Acme Developers · Mumbai · In Progress",
      "score": 18.42,
      "highlight": {
        "title": ["Residential <em>Villa</em> – Phase 2"],
        "searchable_text": ["..."]
      },
      "meta": {
        "status": "in_progress",
        "project_id": "uuid",
        "client_name": "Acme Developers",
        "updated_at": "2026-09-20T14:22:00Z"
      }
    }
  ],
  "total": 87,
  "page": 1,
  "pageSize": 20,
  "took_ms": 42,
  "facets": {
    "entity_type": {
      "project": 12,
      "boq": 23,
      "document": 31,
      "quotation": 21
    }
  }
}
```

---

## 2. Entity-Specific Search

```
GET /search/projects
GET /search/clients
GET /search/boqs
GET /search/quotations
GET /search/documents
GET /search/drawings
GET /search/vendors
GET /search/site-recces
... (one per supported entity)
```

Same query parameters as global search (where relevant).  
Response is a simpler list or the same unified shape with a single `entity_type`.

---

## 3. Autocomplete / Suggestions

```
GET /search/suggest
```

| Param   | Type   | Description                |
|---------|--------|----------------------------|
| `q`     | string | Partial query (min 2 chars)|
| `types` | string | Optional type filter       |
| `limit` | number | Default 8, max 15          |

### Response

```json
{
  "suggestions": [
    {
      "entity_type": "project",
      "id": "uuid",
      "label": "Residential Villa – Phase 2",
      "secondary": "Acme Developers"
    }
  ]
}
```

---

## 4. Reindex Endpoints

```
POST /search/reindex/all
POST /search/reindex/:entity
```

- Protected (admin only).
- Returns a job id or immediate summary depending on implementation.
- Prefer asynchronous execution for large datasets.

Example response:

```json
{
  "success": true,
  "jobId": "reindex-20260924-001",
  "message": "Reindex started for projects, boqs, documents"
}
```

---

## 5. Health & Status

```
GET /search/health
```

```json
{
  "status": "ok",
  "elasticsearch": "green",
  "indices": {
    "projects": { "docs": 1240, "size": "12mb" },
    "boqs": { "docs": 890, "size": "8mb" }
  },
  "last_full_reindex": "2026-09-22T03:00:00Z",
  "indexing_lag_seconds": 2.4
}
```

---

## 6. Permission Behaviour

- All endpoints require JWT authentication. Full and entity reindex require ADMIN or SUPERADMIN.
- Non-admin users see only records with a project ID in the server-resolved set of projects they created or are assigned to. Missing scope fails closed; no projects means no results.
- Unscoped records are hidden from non-admin users. Caller-supplied project lists and administrator flags are ignored.
- `includeDeleted` is admin-only.

---

## 7. Error Responses

| Status | Meaning                          |
|--------|----------------------------------|
| 400    | Invalid query / parameters       |
| 401    | Unauthenticated                  |
| 403    | Forbidden (permissions)          |
| 429    | Rate limited                     |
| 503    | Elasticsearch unavailable        |
