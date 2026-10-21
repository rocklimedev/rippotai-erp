# Set up Synology NAS for the ERP

Follow these steps in order. They assume Synology DSM 7.x; labels may differ
slightly by DSM version. All addresses and paths below are examples.

The resulting flow is:

```text
Small private upload -> existing CDN storage
Large private upload -> NAS when reachable
                     -> private CDN staging when NAS is unreachable
                     -> background transfer to NAS once reachable again
```

For the migration behavior and recovery details, see [migration.md](../migration.md).
The NAS connector is under **Settings > Connectors**. It displays status; actual
connection settings are configured on the backend server.

## 1. Collect the connection details

Have access to Synology DSM as an administrator, the ERP backend deployment,
and the existing CDN hosting account. Record these values without putting
passwords in this document:

| Item | Example | Where it is used |
|---|---|---|
| NAS private/VPN address | `192.168.1.50` | `NAS_HOST` |
| SFTP port | `22` | `NAS_PORT` |
| Dedicated NAS account | `inos_erp` | `NAS_USERNAME` |
| Shared folder | `inos-erp` | Create in DSM |
| Folder path visible over SFTP | Confirm in step 5 | `NAS_UPLOAD_PATH` |
| Trusted NAS SSH fingerprint | Obtain in step 4 | `NAS_HOST_KEY_SHA256` |
| Private directory on CDN server | `/home/account/inos-nas-staging` | `NAS_CDN_STAGING_PATH` |

## 2. Establish the server-to-NAS network connection

The **backend server**, not the user's browser, needs NAS access.

1. Give the NAS a stable private address, for example using a DHCP reservation.
2. If the backend is in the office network, allow it to reach the NAS directly.
3. If the backend is hosted externally, have your network administrator establish
   a VPN route between that server and the office network.
4. Permit the backend's traffic to the NAS SFTP port through applicable firewalls.

From the actual backend server, Windows administrators can check the TCP port:

```powershell
Test-NetConnection -ComputerName 192.168.1.50 -Port 22
```

Run this after enabling SFTP in step 4. `TcpTestSucceeded: True` confirms TCP
reachability only; it does not prove credentials or folder access.

For the initial setup, use one backend with access to both CDN and NAS and enable
the transfer worker on that backend. A separate worker is optional, but every
backend serving downloads still needs NAS access after a file moves there.
Returning a laptop to the office alone does not trigger the transfer.

## 3. Create the NAS folder and service account

1. In DSM, open **Control Panel > Shared Folder > Create**.
2. Create a folder named `inos-erp` on the intended storage volume.
3. Open **Control Panel > User & Group > User > Create**.
4. Create the account `inos_erp` with a strong dedicated password. Keep it out
   of the administrators group.
5. Grant **Read/Write** access to `inos-erp`, including permission to create,
   rename and delete files. Restrict access to unrelated shares.
6. Check effective group permissions: a deny inherited from a group can prevent
   access even when the account has an explicit allow.

Synology documents the folder permission controls in
[Assign Shared Folder Permissions](https://kb.synology.com/en-global/DSM/help/DSM/AdminCenter/file_share_privilege?version=7)
and [ACL management](https://kb.synology.com/en-uk/DSM/tutorial/How_to_manage_ACL_settings_on_your_Synology_NAS).

## 4. Enable SFTP and obtain the trusted SSH fingerprint

1. Open **Control Panel > File Services > FTP** in DSM.
2. Find the **SFTP** settings, enable SFTP, and record its port; `22` is the
   usual default. Apply the change.
3. Check any service/application access rules for the dedicated account.
4. Ask the NAS administrator for the verified **SSH host key SHA256 fingerprint**
   offered by this SFTP server. Verify the key type as well if the NAS has
   multiple SSH host keys. This is an SSH fingerprint, not the DSM HTTPS
   certificate fingerprint.

Use Synology's [SFTP setup instructions](https://kb.synology.com/index.php/en-us/DSM/help/DSM/AdminCenter/file_ftp_sftp?version=7)
and [file transfer access guide](https://kb.synology.com/en-us/DSM/tutorial/How_to_access_files_on_Synology_NAS_via_FTP).
The ERP uses SFTP; enabling SMB or Synology Drive is not needed for this connection.

Our backend expects the SHA256 fingerprint as **64 hexadecimal characters**.
If your administrator gives you a verified `SHA256:...` base64 fingerprint,
convert it on a computer with Node.js using:

```powershell
node -e "const b=Buffer.from(process.argv[1].replace(/^SHA256:/,''),'base64'); if(b.length!==32) throw new Error('Expected SHA256 fingerprint'); console.log(b.toString('hex'))" "SHA256:REPLACE_WITH_VERIFIED_VALUE"
```

Copy the resulting hex string into `NAS_HOST_KEY_SHA256`. A mismatch rejects
the connection. If the NAS key changes later, verify the replacement with the
administrator before updating this setting.

## 5. Confirm the folder path with the service account

From the backend server or a machine with the same network access:

```powershell
sftp -P 22 inos_erp@192.168.1.50
```

Compare the presented host fingerprint with the trusted value from step 4 before
accepting it. Enter the service account password when prompted.

Inside the SFTP session:

1. Run `pwd` and `ls`.
2. Locate and `cd` into the shared folder created in step 3.
3. Run `pwd` again and record that absolute path.
4. Upload a small disposable file, download it, rename it, then remove it.

Set `NAS_UPLOAD_PATH` to the path actually visible in this session. Depending
on how SFTP is configured, it might be `/inos-erp`, `/volume1/inos-erp`, or
another path. Do not assume the volume path is exposed. A Windows share path
such as `\\NAS\inos-erp`, a DSM web link, or a QuickConnect URL is not valid here.

## 6. Prepare the private staging folder on the CDN server

1. Keep the existing CDN account and ordinary upload directory.
2. Create a separate directory on that CDN server, for example
   `/home/account/inos-nas-staging`.
3. Place it outside **all public webroots and aliases**, including `public_html`.
   It must also be separate from the ordinary CDN upload directory.
4. Give the existing CDN SFTP account permission to read, write, rename and
   delete files and create/remove subdirectories there. The backend applies
   directory mode `700` and file mode `600`; the account must be able to do so.
5. Confirm this path using that CDN account's SFTP session, then record it as
   `NAS_CDN_STAGING_PATH`.

Staging uses the existing `CDN_HOST`, `CDN_PORT`, `CDN_USERNAME` and `CDN_PASSWORD`.
No second CDN login is required. Use durable storage: this directory holds the
only accepted copy of an upload while NAS is unavailable. Allow enough space
for uploads to accumulate during an outage.

## 7. Configure the CDN signed-file gateway

Ask your server administrator to apply the repository's
[Nginx example](../backend/deploy/cdn-private-files.nginx.conf.example) to the
existing CDN virtual host, adapting its API hostname and TLS settings.

It must proxy private file names, including `private-drawings-nas-...` and other
NAS scopes, to `/api/v1/cdn/private/:key` on the ERP API, preserving the query
string. Private responses must not be cached or served as ordinary static files.

Have the administrator validate and reload the web-server configuration. If your
CDN uses another web server, implement the same behavior there. Keep existing
public asset routes working. Set `CDN_PRIVATE_PROXY_ENABLED=true` only after
verifying this routing.

## 8. Add the backend configuration

Merge the following into the existing backend `.env` or deployment secret store.
Use [backend/.env.example](../backend/.env.example) as a reference. Keep existing
database, authentication and CDN configuration; do not replace the whole `.env`.

```dotenv
# Start disabled until all placeholders below have been replaced.
NAS_ENABLED=false
NAS_HOST=192.168.1.50
NAS_PORT=22
NAS_USERNAME=inos_erp
NAS_PASSWORD="REPLACE_WITH_SERVICE_ACCOUNT_PASSWORD"
NAS_UPLOAD_PATH=/REPLACE_WITH_CONFIRMED_SFTP_PATH
NAS_HOST_KEY_SHA256=REPLACE_WITH_64_HEX_CHARACTERS
NAS_MIN_FILE_SIZE_MB=50

NAS_STAGING_ENABLED=true
NAS_CDN_STAGING_PATH=/home/account/inos-nas-staging
NAS_STAGE_ALL_UPLOADS=false
NAS_TRANSFER_WORKER_ENABLED=true
NAS_TRANSFER_INTERVAL_MINUTES=5
NAS_STAGING_MIN_AGE_MINUTES=5
```

If your password contains characters requiring escaping in your environment
manager, use that manager's quoting rules. Never put credentials in frontend
`VITE_*` variables or commit the filled-in `.env`.

Preserve the existing `CDN_*` settings and `FILE_ACCESS_SECRET`. In production,
the existing `CDN_BASE_URL` must be the real HTTPS CDN URL. With a remote CDN,
`CDN_PRIVATE_PROXY_ENABLED=true` is required for NAS uploads too.

Choose the upload policy:

| Setting | What happens to NAS-bound files |
|---|---|
| `NAS_STAGE_ALL_UPLOADS=false` | Try NAS immediately; use CDN staging if the transfer fails |
| `NAS_STAGE_ALL_UPLOADS=true` | Always stage first; the worker moves files later |

Use `true` on an external ingress backend when you want uploads to land in CDN
staging immediately. The worker still needs a valid route to NAS. These policies
apply to private uploads at/above the size threshold; smaller uploads stay on CDN.

## 9. Enable and check the connector

1. Deploy the backend and frontend containing the NAS integration.
2. Set `NAS_ENABLED=true` and restart/recreate the backend using your normal
   deployment process so it picks up the environment changes.
3. Sign in to the ERP with an account having `settings:read` permission.
4. Open **Settings > Connectors > Synology NAS**.
5. Click **Check connection**.

Expected results:

| Display | Meaning / action |
|---|---|
| Connected | NAS authentication and directory access succeeded |
| Disabled | Check `NAS_ENABLED` and restart the backend |
| Configuration required | Check required NAS values, absolute path and 64-digit hex fingerprint |
| Unavailable | Check network, port, password, host key and folder access |
| CDN staging: available | The configured staging directory can be listed |
| Transfers: Enabled | Transfer processing is configured on this backend instance |

The connection check does not prove write/rename/delete permissions. Perform
the actual upload tests below before accepting the setup. If staging is
unavailable, also check its path, account access and private-proxy configuration.

## 10. Test normal upload, delayed transfer and deletion

Use disposable files and records for these tests.

1. Upload a small private file. Confirm it opens through the ERP and stays on CDN.
2. Upload an allowed private file larger than 50 MiB, within the upload endpoint's
   limit. With NAS reachable and always-stage disabled, confirm it appears on NAS.
3. Temporarily set `NAS_STAGE_ALL_UPLOADS=true`, restart the backend and upload
   another large file. Confirm it appears in the private CDN staging directory,
   can be opened through the ERP, and increases the pending upload count.
4. Wait until the file is at least five minutes old and a worker pass completes.
   With the default settings, allow roughly 5–10 minutes plus transfer time for
   a small test queue. Confirm the NAS copy appears, the CDN staging copy is
   removed, the pending count falls, and the same ERP record still downloads
   the correct file. The worker verifies SHA256 before removing the CDN copy.
5. Set `NAS_STAGE_ALL_UPLOADS=false` again and restart. During a controlled
   test window, interrupt only the backend-to-NAS route and upload another
   NAS-bound file. Confirm the accepted upload remains downloadable from staging.
   Restore the route and confirm it moves during a later worker pass.
6. Delete a disposable staged record while that route is unavailable. It must
   become inaccessible immediately. Restore the route; confirm the worker
   removes the NAS/staging objects and clears pending deletions.
7. Verify an unsigned private CDN URL is rejected, a current ERP-generated
   signed URL works, and public profile images still load.

The timer scans at startup and every five minutes, up to ten files per pass.
Pending counts can remain nonzero during an outage or backlog. If work stops,
check worker state, backend logs, permissions and free storage. After a hard
crash, an abandoned transfer lock may need recovery as described in
[migration.md](../migration.md); do not remove locks while transfers are active.

Current uploads/downloads are buffered in memory. Some document/drawing routes
allow up to 500 MiB; other routes have lower limits. This setup does not enable
resumable multi-gigabyte uploads. Existing ordinary CDN files are not moved by
this worker, and no database schema migration is required.

To pause movement, disable `NAS_TRANSFER_WORKER_ENABLED` and restart the backend.
Keep the staging directory, its connection settings and NAS files intact while
work is pending. Disabling the worker also delays physical deletion of NAS files.
