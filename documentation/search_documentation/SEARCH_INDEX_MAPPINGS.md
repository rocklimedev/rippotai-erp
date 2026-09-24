# Search Index Mappings & Analyzers

**Version:** 2.0

---

## 1. Custom Analyzers

```json
{
  "analysis": {
    "analyzer": {
      "code_analyzer": {
        "tokenizer": "keyword",
        "filter": ["lowercase", "asciifolding"]
      },
      "address_analyzer": {
        "tokenizer": "standard",
        "filter": ["lowercase", "asciifolding", "address_synonym"]
      },
      "material_analyzer": {
        "tokenizer": "standard",
        "filter": ["lowercase", "asciifolding", "material_synonym"]
      },
      "standard_folded": {
        "tokenizer": "standard",
        "filter": ["lowercase", "asciifolding"]
      }
    },
    "filter": {
      "address_synonym": {
        "type": "synonym",
        "synonyms": [
          "rd, road",
          "st, street",
          "apt, apartment",
          "bldg, building",
          "n, north",
          "s, south",
          "e, east",
          "w, west"
        ]
      },
      "material_synonym": {
        "type": "synonym",
        "synonyms": [
          "ply, plywood",
          "vitrified, vitrified tile",
          "acp, aluminium composite panel"
        ]
      }
    }
  }
}
```

---

## 2. Common Base Mapping (applied via template or composition)

```json
{
  "properties": {
    "entity_type":   { "type": "keyword" },
    "id":            { "type": "keyword" },
    "project_id":    { "type": "keyword" },
    "client_id":     { "type": "keyword" },
    "title": {
      "type": "text",
      "analyzer": "standard_folded",
      "fields": {
        "keyword": { "type": "keyword", "ignore_above": 256 }
      }
    },
    "subtitle": {
      "type": "text",
      "analyzer": "standard_folded"
    },
    "status":        { "type": "keyword" },
    "searchable_text": {
      "type": "text",
      "analyzer": "standard_folded"
    },
    "created_at":    { "type": "date" },
    "updated_at":    { "type": "date" },
    "visibility":    { "type": "keyword" },
    "owner_ids":     { "type": "keyword" },
    "is_deleted":    { "type": "boolean" }
  }
}
```

---

## 3. Example Entity-Specific Additions

### projects
```json
{
  "slug":            { "type": "keyword" },
  "site_location":   { "type": "text", "analyzer": "address_analyzer" },
  "description":     { "type": "text", "analyzer": "standard_folded" },
  "priority":        { "type": "keyword" },
  "current_phase":   { "type": "keyword" },
  "client_name":     { "type": "text", "analyzer": "standard_folded", "fields": { "keyword": { "type": "keyword" } } },
  "project_type":    { "type": "keyword" },
  "progress_pct":    { "type": "float" },
  "approved_value":  { "type": "double" }
}
```

### boqs
```json
{
  "boq_number":       { "type": "text", "analyzer": "code_analyzer", "fields": { "keyword": { "type": "keyword" } } },
  "client_name":      { "type": "text", "analyzer": "standard_folded" },
  "location":         { "type": "text", "analyzer": "address_analyzer" },
  "total_value":      { "type": "double" },
  "project_name":     { "type": "text", "analyzer": "standard_folded" },
  "items_text":       { "type": "text", "analyzer": "standard_folded" }
}
```

### documents
```json
{
  "doc_no":           { "type": "text", "analyzer": "code_analyzer", "fields": { "keyword": { "type": "keyword" } } },
  "category":         { "type": "keyword" },
  "filename":         { "type": "keyword" },
  "version":          { "type": "keyword" },
  "remarks":          { "type": "text", "analyzer": "standard_folded" },
  "project_name":     { "type": "text", "analyzer": "standard_folded" }
}
```

### drawings
```json
{
  "drawing_number":   { "type": "text", "analyzer": "code_analyzer", "fields": { "keyword": { "type": "keyword" } } },
  "discipline":       { "type": "keyword" },
  "phase_code":       { "type": "keyword" },
  "sheet_number":     { "type": "keyword" },
  "project_name":     { "type": "text", "analyzer": "standard_folded" }
}
```

---

## 4. Index Template Recommendation

Create a component template for the common fields and compose entity-specific templates on top.  
Use index aliases (`projects`, `boqs`, …) pointing to versioned concrete indices (`projects_v1`, `boqs_v1`, …) so zero-downtime reindex is possible.

---

## 5. Implementation Note

In code, mappings live in `src/modules/search/mappings/` and are applied by `SearchService.createIndex` / `ReindexService` before bulk loading data.
