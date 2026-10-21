# Synology NAS setup and rollout

For the step-by-step administrator walkthrough, start with
[Synology NAS setup](documentation/NAS-SETUP.md).

## Behavior

The ERP uses both storage systems. Public profile images stay on CDN. Private
uploads at or above NAS_MIN_FILE_SIZE_MB go to NAS when NAS_ENABLED=true;
smaller uploads continue using CDN. The default threshold is 50 MiB.
Existing ordinary CDN files are never relocated automatically. NAS-bound files
can be staged temporarily on CDN and moved to NAS by the transfer worker.

NAS files use `private-<scope>-nas-<uuid>.<extension>` keys. The provider is
encoded in the existing storage filename, so no SQL migration is required.
Keep this key unchanged in document versions, attachments and drawing revisions.
Downloads and deletions use the recorded key, not the current upload threshold.
Disabling NAS uploads still allows reads/deletes of existing NAS keys while
connection settings remain configured. With staging disabled, NAS failures
reject uploads. With staging enabled, failed NAS uploads are accepted into the
designated private CDN staging directory for automatic transfer later.

## Provision Synology

1. Create a dedicated ERP shared folder and non-admin service account. Grant
   the account read/write/delete access only to the intended folder. Configure
   snapshots/backups separately from this integration.
2. Enable Synology SFTP and allow the ERP server to reach its SFTP port through
   LAN or VPN. The browser never needs NAS credentials or direct NAS access.
3. Sign in with that account using an SFTP client and confirm the absolute
   directory visible to it. `/volume1/inos-erp` is an example, not an assumed
   path. Provision the directory before enabling uploads.
4. Obtain the SSH host key fingerprint from a trusted NAS administrator.
   Set NAS_HOST_KEY_SHA256 to its SHA256 digest in 64-character hexadecimal
   form. Connections reject a different key. Do not blindly trust a key read
   from an unverified network connection.

## Configure and deploy

1. Merge the storage settings in `backend/.env.example` into the backend's
   existing `.env` or deployment secret store. Preserve current CDN values.
   Populate NAS_HOST, NAS_PORT, NAS_USERNAME, NAS_PASSWORD, NAS_UPLOAD_PATH
   and NAS_HOST_KEY_SHA256. Never put these in frontend VITE variables.
2. Keep NAS_ENABLED=false initially. Choose NAS_MIN_FILE_SIZE_MB according to
   available bandwidth and expected file sizes. Use a positive finite number.
3. Preserve FILE_ACCESS_SECRET (at least 32 bytes) and the existing signed-file
   proxy. With remote CDN, route **all** `private-*` requests, including NAS
   keys and their query strings, to `/api/v1/cdn/private/:key` on the ERP API.
   Do not cache private responses. Set CDN_PRIVATE_PROXY_ENABLED=true only
   after verifying that proxy. NAS URLs remain signed gateway references.
   A temporary CDN copy exists only while a transfer is pending.
4. Deploy the backend and frontend together. Set NAS_ENABLED=true and restart
   the backend after configuration. No database schema migration is required.

## Outside-network uploads and delayed NAS transfer

Network routing uses **the ERP server's reachability of NAS**, not the browser's
IP address. An outside user can upload directly to NAS if the ERP server has
a LAN/VPN path. A public ERP server without NAS connectivity stages the upload
on CDN until that server, or another configured backend worker, can reach NAS.
Returning the user's laptop to the office alone does not move files.

1. Provision a private directory on the CDN host, for example
   `/home/account/inos-nas-staging`, **outside the entire public webroot**.
   Set NAS_CDN_STAGING_PATH to its SFTP-visible absolute path. The application
   rejects paths inside CDN_UPLOAD_PATH; the administrator must also ensure
   it is outside other public aliases and not a symlink into a public folder.
   With no CDN_HOST configured, this is a local durable disk path instead.
2. Enable NAS_STAGING_ENABLED=true on upload servers. Leave
   NAS_STAGE_ALL_UPLOADS=false to try NAS first and stage only on transfer
   failure. Set NAS_STAGE_ALL_UPLOADS=true on an external ingress server to
   always stage NAS-bound uploads without waiting for a NAS connection attempt.
   Smaller files still use the ordinary CDN destination.
3. Enable NAS_TRANSFER_WORKER_ENABLED=true on a backend instance that can
   reach **both** the CDN staging directory and NAS through LAN/VPN. It uses
   the same CDN credentials/path and NAS configuration as the upload server.
   Keep NAS_ENABLED=true and NAS_STAGING_ENABLED=true on the worker.
4. NAS_TRANSFER_INTERVAL_MINUTES defaults to 5; NAS_STAGING_MIN_AGE_MINUTES
   defaults to 5. Both must be positive and at most 1440. Restart after changes.
   The worker scans on startup and every interval, processing up to 10 files
   per pass. Once old enough, uploads move on a subsequent successful pass;
   these settings are not a guaranteed completion deadline.

The staged file is the durable queue entry, so pending work survives backend
restarts. The final file key and ERP URL do not change during movement.
Downloads read the CDN staging copy first while it exists. The worker uploads
to a temporary NAS filename, reads it back to verify SHA256, then atomically
publishes the final NAS key using SFTP POSIX rename. Only after success is the
CDN staging copy deleted. A failed upload, failed verification or failed cleanup
leaves the CDN copy available for retry. NAS must support the POSIX rename
extension; test this during acceptance. Temporary `.upload-*` files are never
served or processed as queue entries.

Deletion uses a durable `.delete-<key>` tombstone. Once recorded, reads return 404
and the worker removes both copies before clearing the tombstone. NAS outages
delay physical deletion, not the logical deletion. Concurrent transfer/deletion
of the same key by workers is guarded by an exclusive directory lock on the
staging host. Logical deletion can be recorded while a copy is in flight; its
tombstone remains until a worker processes physical deletion, so the copy never
becomes readable again. Locks are deliberately not expired by
time: after a hard crash, stop all workers/operations for that key, verify no
transfer is active, then remove its empty `.locks/<key>` directory before
restarting. Never remove active locks. Abandoned `.upload-*` files can be
cleaned up only after confirming no corresponding upload is in progress.

After movement, the backend serving downloads needs NAS connectivity. If the
public ERP server cannot reach NAS even through VPN, moving files will make
downloads through that server unavailable; establish that route before enabling
the worker. No files are copied back automatically for outside-network readers.
Keep CDN staging connection settings available even after disabling new staging,
until all pending transfers/deletions have been drained.

## Connection status and acceptance checks

Settings > Connectors contains a Synology NAS card and **Check connection**.
It calls authenticated `GET /api/v1/nas/status` with the existing session and
requires `settings:read`. No shared CDN secret is needed for this status route.
Responses contain connected, status and checkedAt; status is disabled,
not_configured, connected or unavailable. No credentials, internal paths or
raw SFTP errors are returned. SSH negotiation has a 10-second timeout with
connection retries disabled.

The response also includes staging directory availability, pendingUploads,
pendingDeletes, and the worker's enabled/running/lastRunAt/lastResult fields.
Queue counts are a current snapshot; worker state describes the backend instance
answering the request. If the worker runs on another instance, check that
instance for its last run. The status check does not mutate staging directories.

The status check authenticates and stats the folder. It is read-only and does
not prove write permissions, free capacity or successful public gateway access.
Before accepting the rollout:

1. Verify disabled and configuration-required states, then connected.
2. Upload a small private document and confirm its existing CDN behavior.
3. Upload a private document at/above the configured threshold and confirm a
   NAS-marked key, presence on NAS after transfer, and removal of the staging
   copy after successful verification.
4. Open/download through the ERP and verify unsigned/expired links fail.
5. Exercise a drawing revision and attachment, then delete disposable test
   records and confirm their NAS objects are removed.
6. Enable staging, interrupt NAS connectivity and upload a NAS-bound file.
   Confirm upload succeeds, the file downloads from staging, and pendingUploads
   increases. Restart the backend and confirm the file remains available.
   Restore NAS access; after the age/interval delay confirm NAS transfer,
   unchanged URL, correct contents, and removal of only the staging copy.
   Repeat with NAS_STAGE_ALL_UPLOADS=true and NAS reachable.
7. Delete a staged disposable file while NAS is offline. Confirm reads return
   404 and pendingDeletes increases. Restore NAS access and verify neither copy
   reappears. With staging disabled and no staging path configured, NAS failures
   continue to reject NAS-bound uploads.
8. Disable NAS_ENABLED and confirm existing NAS files remain downloadable.

## Limits and rollback

This is the first integration stage. Current upload endpoints still buffer
files in memory and enforce their existing limits (up to 500 MiB on drawing
and document endpoints; some routes have lower limits). Downloads also return
buffers. This does not enable multi-gigabyte or resumable uploads. Configure
reverse-proxy limits/timeouts consistently; do not increase file limits until
a streamed/chunked upload and download flow is implemented and load tested.

Rollback new routing by setting NAS_ENABLED=false and restarting the backend.
This also pauses the transfer worker; pending tombstones and staged data remain.
Drain the queue before disabling the worker permanently or removing staging
configuration. NAS_STAGING_ENABLED=false stops new fallback/always-stage uploads
and pauses movement, but staged reads and queued deletions still use the retained
staging path. Physical deletions wait until the worker is enabled again.
Keep NAS connection settings and the NAS-aware backend deployed to serve files
already written there. Rolling back to code without NAS-key support would
break those files. A future bulk relocation requires copying, verifying
checksums, updating every reference and validating downloads before deleting
originals; it is not performed by this rollout.
