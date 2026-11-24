# Search Sync Strategy

**Version:** 2.0

Keeping Elasticsearch consistent with MySQL is the most critical operational concern of the Search module.

---

## 1. Goals

- Near real-time updates (seconds, not minutes) for create / update / delete.
- Safe full rebuilds without downtime.
- Soft-delete awareness.
- Failure isolation (one bad document should not block the whole queue).
- Observable lag and error rates.

---

## 2. Recommended Long-Term Pattern: Outbox + Queue

```
Domain Service (create/update/delete)
        │
        ▼
  Write to MySQL  +  Write Outbox event (same transaction)
        │
        ▼
  Outbox Relay / CDC → Message Queue (BullMQ / RabbitMQ / SQS / Kafka)
        │
        ▼
  Search Worker
        │
        ├── index / update document
        └── delete document
```

**Advantages**
- Exactly-once (or at-least-once with idempotent indexing) semantics.
- Does not slow down the main request path.
- Easy to retry and monitor.
- Works well with multiple workers.

**Implementation notes**
- Outbox table: `id`, `aggregate_type`, `aggregate_id`, `event_type`, `payload`, `created_at`, `processed_at`.
- Worker must be idempotent (`index` with fixed `_id` is naturally idempotent).
- Soft deletes: either send a `deleted` event or set `is_deleted: true` and filter at query time.

---

## 3. Acceptable Short-Term Pattern: Hooks + Queue

While the outbox is being built, use Sequelize hooks:

```ts
@AfterCreate
@AfterUpdate
@AfterDestroy
static async enqueueSearchSync(instance, options) {
  await searchQueue.add('sync', {
    entity: 'project',
    id: instance.id,
    action: options.type, // create | update | destroy
  });
}
```

Then a BullMQ (or similar) worker calls the appropriate `*SearchService.indexOne / removeOne`.

**Caveats**
- Hooks run in the same process – keep them extremely light (only enqueue).
- Be careful with bulk operations (`bulkCreate`, etc.) – they may not fire individual hooks.
- Prefer the outbox for long-term correctness.

---

## 4. Full Reindex (Historical / Repair)

`ReindexService` responsibilities:

1. Create a new index (or use a temporary name).
2. Apply the correct mapping / template.
3. Stream records from MySQL in batches (e.g. 200–500).
4. Use Elasticsearch Bulk API.
5. (Optional) Atomic alias swap for zero downtime.
6. Report progress and failures.

Example flow for zero-downtime:

```
projects_v1  ←── alias "projects"
     │
     ▼  (reindex into projects_v2)
projects_v2
     │
     ▼  (swap alias)
projects_v2  ←── alias "projects"
     │
     ▼  (delete old)
```

---

## 5. Soft Deletes

Two supported strategies (choose one and be consistent):

**A. Exclude on index (preferred for most entities)**  
- When `deleted_at` is set → call `removeOne`.
- Reindex jobs skip soft-deleted rows.

**B. Index with flag**  
- Set `is_deleted: true`.
- All normal queries add `must_not: { term: { is_deleted: true } }`.
- Useful when you want “include deleted” admin search.

---

## 6. Failure & Retry

- Workers must catch per-document errors and continue the batch.
- Failed documents should be logged with entity + id + error.
- Optional dead-letter queue for permanent failures.
- Metrics: `search_index_lag_seconds`, `search_index_failures_total`, `search_reindex_progress`.

---

## 7. Ordering & Concurrency

- Last-write-wins is acceptable for search documents (we always re-fetch the latest state from MySQL before indexing).
- Do not try to apply incremental field patches unless you have strong versioning; full document replace is simpler and safer.

---

## 8. Migration Path from Current Module

1. Keep the old reindex endpoints working during transition.
2. Introduce the new services and queue side-by-side.
3. Dual-write (old + new) for a short period if needed.
4. Switch global search to the new implementation.
5. Decommission the old sequential reindex logic.

---

## 9. Checklist for Any New Entity

- [ ] `toDocument()` correctly maps soft-delete state
- [ ] `indexOne` / `removeOne` are idempotent
- [ ] Hook or event is emitted on create / update / delete
- [ ] Reindex job includes the entity
- [ ] Permission fields (`project_id`, etc.) are populated
