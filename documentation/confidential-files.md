# Confidential file inventory and access

## Inventory before migration

Source inventory (2026-10-17; production database/storage have not been inspected):

| Producer / stored links | Types | Classification |
| --- | --- | --- |
| documents.url, document_versions.url, document_attachments.url; storage_filename | Uploads, contracts, PDFs, office files, attachments; MIME/extension unrestricted | Private |
| drawing_revisions.url and storage_filename | Drawings, PDF, CAD and image revisions | Private |
| user_signatures.signature_url; work_orders contractor/rippotai_signature_url | Signature images; signature service previously uploaded directly through SFTP | Private |
| handover_packages.url; document-index.csv inside generated ZIP | Project documents and ZIP archives | Private |
| Site recce photos/layouts, project brief references, daily report/snag photos | Images and project evidence | Private |
| users avatar upload | Profile images | Public |
| Generic CDN upload | Any supplied file | Private by default |

Existing links include absolute CDN URLs, filenames used by authenticated document/drawing downloads, embedded JSON references, client handover links, and URLs embedded in exported packages. External Microsoft/Zoho storage is independently authorized and outside this CDN migration. Signature PNG data stored directly in client_link_responses is database data rather than a CDN object.

Do not infer confidentiality from extension: a PNG may be a signature or drawing. Inventory database references and storage objects before moving anything. Historical exported PDFs/ZIPs and external/shared links require separate review; changing a database URL does not revoke cached bytes.

## Read-only connected inventory

The configured database and CDN storage were inventoried before migration. The report is deliberately kept in the ignored `backend/artifacts/` directory because it contains confidential URLs and database locations:

- `backend/artifacts/confidential-files-inventory-v2.json`
- 102 objects, 3 matching database references (`users` and `user_signatures`), 99 objects without identified database references, no missing referenced objects, and no schema warnings.
- Extensions: 39 PNG, 24 JPG, 22 PDF, 4 JPEG, 4 HEIC, 2 CSV, 2 DOCX, 2 HTML, 2 GIF, and 1 Markdown.
- Historical host aliases and external links in document-related records were also checked; none were found in this configured database.

These findings describe the configured environment, not every deployment or historical export. Unreferenced objects require owner/content review: absence of a database reference does not make a file public. No production objects or database rows were changed by this inventory.

## Runtime configuration

Set these before starting the updated backend:

- `FILE_ACCESS_SECRET`: a random secret containing at least 32 bytes; share it across API replicas. Rotating it invalidates existing links. Do not reuse the CDN upload secret or JWT secret.
- `CDN_BASE_URL=https://media-buildcon.rippotaiarchitecture.com`: the absolute CDN base for public and confidential file URLs. New stored URLs are always absolute CDN URLs. `FILE_ACCESS_BASE_URL` is only used to recognize previously issued API links, not to build new URLs.
- `CDN_UPLOAD_PATH`: the original absolute directory **on the CDN/SFTP server**. All remote uploads, downloads and deletes use this directory again. A local Windows folder such as `C:/.../uploads/cdn` or an `https://...` URL is not a remote SFTP directory. No separate remote `PRIVATE_FILE_PATH` is used.
- `CDN_PRIVATE_PROXY_ENABLED=true`: enable only after the CDN routes every `private-*` filename through the signed-file API and denies static access to those names. See [CDN nginx example](../backend/deploy/cdn-private-files.nginx.conf.example). The API refuses remote confidential uploads until this is explicitly enabled. Public uploads remain available without it. Apply the equivalent rule on Apache or your actual CDN server if nginx is not used.
- `PRIVATE_FILE_PATH`: local development only, when `CDN_HOST` is absent. It defaults to a sibling of `CDN_UPLOAD_PATH`, suffixed `-private`, outside the public static directory. A local CDN middleware validates signed filenames before any public static handler.

Signing and CDN URL configuration are validated at startup. Remote directory and proxy settings are validated when uploading, so a CDN configuration error does not stop unrelated API traffic. Existing `CDN_*` connection settings still select local disk versus SFTP. Public profile images retain their ordinary CDN links; other shared-service uploads require protected access, including PNG/JPEG signatures and drawings.

Durable database URLs use the original absolute CDN format, for example `https://media-buildcon.rippotaiarchitecture.com/private-documents-<uuid>.pdf`. Authorized responses add HMAC signature and expiry parameters to that same CDN URL for at most **300 seconds**. No new `private-file://` values are written; old ones remain readable for compatibility. The CDN proxies confidential requests to the existing verification endpoint without redirecting the browser to the API domain. Missing, tampered, or expired capabilities return 403. Downloads send `Cache-Control: private, no-store, max-age=0`. A leaked unsigned CDN URL does not grant access; refetch an authorized record for a fresh signed link.

Issuance follows the existing read grants: documents, drawings, user-signatures, client-portal, site-recces, project-briefs, site-ops-daily-reports, and site-ops-snag-lists. Readers without the matching grant receive null instead of a private URL. Existing document/drawing download endpoints still require JWT and read permission and now disable caching. Client handover links require a valid handover-acceptance token for the project; package download expiry is capped by both five minutes and the client-link expiry.

Upload forms can save their preview URLs: the server verifies the HMAC and normalizes them back to durable references before persistence, even if the preview expired while editing. Serving a download still enforces expiry. Screens holding a URL longer than five minutes must refetch their authorized record before reopening it. Generated handover archives read confidential bytes directly through storage, rather than embedding expiring download capabilities as file contents.

## Reviewed migration

Run from `backend/` with environment configuration loaded. Reports are sensitive; never commit them.

```powershell
node --env-file=.env scripts/confidential-files.cjs inventory artifacts/files-review.json
```

Review every `files` entry. Set `decision` to `private` or `public`; select the matching private `scope`. Keep genuinely public avatars/assets public. Resolve missing objects and any schema warnings before continuing. Review `externalLinks` separately: external Microsoft/Zoho links and unknown historical hosts need their own access controls and cannot be revoked by moving local CDN objects. Review objects referenced by multiple features and split public/private copies where necessary. Do not blindly classify 99 unreferenced objects as public.

During a maintenance window with all upload/database writers stopped, configure the CDN signed-file proxy and original CDN_UPLOAD_PATH, build, and apply the reviewed manifest:

```powershell
npm run build
node --env-file=.env scripts/confidential-files.cjs migrate artifacts/files-review.json --apply
```

The tool refuses unreviewed classifications and storage changes since inventory. Existing private-* files are already protected and are not migrated again. Remote copies stay in the original CDN directory; their CDN URL is absolute, with access controlled by the filename proxy rather than a separate remote folder. It uploads private copies, verifies their bytes, rewrites exact URL/filename values (including nested JSON) transactionally, blocks deletion if legacy references remain, then removes the public origin copies. Embedded HTML/prose URLs require explicit cleanup; they block deletion instead of being rewritten ambiguously. A journal beside the manifest records progress so an interrupted migration can resume with the same manifest. Keep the manifest and journal together until verification finishes. Do not restore a backup containing old public URLs without also restoring/updating the corresponding private references.

**Public origin deletion alone is insufficient.** Purge all CDN/proxy caches and stored derivative/thumbnail copies, remove any external alias that bypasses the protected private-* filename rule, and test old URLs on every historical hostname for 403/404 before resuming writers. Previously downloaded copies cannot be revoked. Exported ZIPs/PDFs containing historical URLs require separate review or regeneration. If deletion or purge fails, migration is incomplete; do not claim legacy links are protected. Verify public images still return 200 and the same confidential URL returns 403 after its five-minute expiry.

No live migration or cache purge has been performed by this change; the 99 unreferenced objects still require classification.

## Verification

`npm run test:e2e -- --runInBand confidential-files.e2e-spec.ts client-portal-auth.e2e-spec.ts` exercises real local storage, global authentication/permission guards, signed-link expiry and tampering, scope checks, private/static isolation, durable form references, and public image access. It uses temporary files and no application database. `npm test -- --runInBand public-routes.spec.ts brief.controller.spec.ts document-reflection.spec.ts` checks the independently authenticated endpoint audit and upload call sites.
