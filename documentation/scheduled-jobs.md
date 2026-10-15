# Scheduled jobs

Apply `backend/migrations/20261015_scheduled_jobs.sql` before starting the new
backend. Requires MySQL 5.7+ (or compatible MariaDB), InnoDB, and named locking functions. All replicas must use the same primary
database server. Named locks are local to that server; use a single primary endpoint.
Allow at least five database pool connections per replica: job ownership
holds a dedicated transaction while handlers use other connections.

`automation-evaluation` uses `AUTOMATION_INTERVAL_MIN` (default 30; 0 disables
registration). `zoho-reminder-poll` runs every 60 seconds. Timers only wake the
database scheduler; persisted due times and connection-scoped named locks determine ownership. An
overdue job resumes after restart. Missed intervals coalesce into one evaluation;
the next interval starts after completion. Use consistent interval configuration
on all replicas. To disable automation, disable it on every replica.

The scheduler acquires `GET_LOCK(..., 0)` on its dedicated transaction connection
and releases it with `RELEASE_LOCK` in a `finally` block. Competing replicas skip
busy locks immediately. A standard `FOR UPDATE` protects the durable schedule row;
`SKIP LOCKED` is not used. There is no lease timeout that could expire during a long handler.
A heartbeat keeps the ownership connection active during long handlers.
Process or connection death releases ownership, leaving the job due for retry.
Automation effects and successful run records commit in one transaction per rule;
failed rules roll back. A persisted occurrence key uniquely identifies each
rule/entity execution across retries, independently of the existing cooldown. Notifications publish to sockets after commit; persisted notifications
remain available if socket delivery fails. Reminder sync, settings updates, and
reconciliation share a per-user/kind lock in addition to existing sync leases.
Remote IDs and fingerprints make retries safe; ambiguous creates stay uncertain
until reconciled rather than automatically creating another remote reminder.

Inspect failures and due times:

```sql
SELECT * FROM scheduled_jobs
WHERE name IN ('automation-evaluation', 'zoho-reminder-poll');
```

Failures are logged and persisted with a count, error, and timestamp; retries run
after 60 seconds. Fix the cause and wait for retry, or request an immediate retry:

```sql
UPDATE scheduled_jobs SET next_run_at = NOW(3)
WHERE name = 'automation-evaluation';
```

Zoho record errors and uncertain outcomes remain visible through the reminder
status API/UI. Use its retry and reconciliation controls for individual records.
Do not clear uncertain records without verifying the remote destination.

Roll out with old backend replicas stopped: older versions do not honor these
locks. No migration is automatically applied by this change.
