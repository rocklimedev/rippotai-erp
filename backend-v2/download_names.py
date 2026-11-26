import re
from pathlib import PurePath
from urllib.parse import quote


_UUID = re.compile(r"[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}", re.I)


def document_filename(document, source_name=""):
    extension = PurePath(source_name or "").suffix
    if not re.fullmatch(r"\.[a-z0-9]{1,12}", extension, re.I):
        extension = ""
    parts = []
    for value in (document.get("project_name"), document.get("title") or document.get("name") or document.get("filename")):
        if not value or _UUID.search(value):
            continue
        clean = " ".join(re.sub(r'[<>:"/\\|?*\x00-\x1f\x7f]', " ", value).split())
        if clean and clean not in parts:
            parts.append(clean)
    stem = " - ".join(parts) or "Document"
    if extension and stem.lower().endswith(extension.lower()):
        stem = stem[:-len(extension)]
    return (stem[:140].rstrip(". ") or "Document") + extension


def document_disposition(document, source_name=""):
    name = document_filename(document, source_name)
    ascii_name = re.sub(r'[^ -~]|["\\]', "_", name)
    return f'attachment; filename="{ascii_name}"; filename*=UTF-8\'\'{quote(name, safe="")}'
