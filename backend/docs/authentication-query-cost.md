# Authentication query cost

Each authenticated request reads the session, current user, and role from SQL.
Revocation, account status, email verification, idle expiry, and hard expiry are
still checked on every request. Session records and user state are not cached.

Role permissions use a bounded in-process cache (1,000 roles, 30-second absolute
TTL). A cold request joins role grants and permission names into the same SQL
query; warm requests omit these joins. Empty permission sets are cached too.
The signed JWT role ID is only a planning hint: permissions always match the
role returned by SQL. If the role changed or an invalidation occurred during a
lookup, authentication retries the read, at most three times.

Grant, bulk assignment, package application, replacement, and revocation
invalidate the affected role after transaction commit. User role reassignment
invalidates both roles after commit. Role edits/deletion invalidate that role;
permission catalogue edits/deletion clear the cache. An invalidated in-flight
query cannot repopulate the cache with older grants.

This cache is local to each backend process. In a multi-process deployment,
other processes observe permission changes within 30 seconds. Use shared Redis
invalidation if immediate permission-grant propagation across replicas is
required. User role/status changes continue to revoke SQL sessions immediately.

Session activity is persisted at most once per minute per token. Recent stored
timestamps avoid UPDATE round trips. Parallel requests in one process share a
touch promise; a conditional UPDATE prevents duplicate writes across processes
and never touches a revoked session. Failed writes can be retried. At the
one-minute boundary an authenticated request normally performs one SELECT and
one conditional UPDATE; otherwise it performs one SELECT and no writes.

The persisted idle timestamp now has minute-level precision. The existing
ten-minute idle check stays conservative: a session can time out up to a minute
earlier than its exact last request. The twenty-minute hard expiry is unchanged.

`auth-request-cost.spec.ts` covers request bursts, absolute TTL, invalidation
races, session rejection on cache hits, and touch throttling. The session lookup
test also checks that Sequelize generates one SQL statement for a cold lookup.
