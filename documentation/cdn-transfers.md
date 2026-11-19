# CDN transfer limits

`POST /cdn/upload` and document/drawing file uploads use private temporary
files rather than buffering request bodies in memory. Each file is limited to
25 MiB; multipart requests allow one file, 40 fields, and 64 KiB per field.
An authenticated user can start ten uploads per minute across these routes.
The process accepts four uploads concurrently, with a two-minute deadline.
Temporary files are removed after success or failure; Multer handles parser
errors and aborted requests. Multer is locked to 2.4.0 or newer.

Allowed extensions are PDF, JPEG, PNG, GIF, WebP, TXT, CSV, DOC/DOCX, XLS/XLSX,
PPT/PPTX, DWG and DXF, paired with the MIME types in `upload-security.ts`.
These checks validate declared metadata; antivirus/content scanning is not
configured. HTML, SVG, scripts and executable uploads are rejected.

CDN, document, drawing-revision and export-result HTTP downloads stream with
backpressure from local disk or SFTP, including NAS staging. Connections close
on completion or failure. Buffered storage APIs remain for internal jobs.

Larger files must use the separately managed NAS transfer path rather than
raising the application multipart limit. Keep the temporary directory on a
disk-backed volume with a suitable quota; a memory-backed `/tmp` still consumes
container memory. Upload budgets are process-local for the current single
container deployment; multiple replicas would need a shared budget store.
