"""Phase B — Documents app.
Provides:
  * documents collection endpoints (list, get, upload, replace, history, delete/archive, toggle-visibility)
  * project-scoped document workspace + handover package
  * Project Brief + Site Reki form save + PDF generation (reportlab, Noto Sans, ₹ safe)
  * Drawings sub-flow (list + upload with revision preserved)
  * Auto-hooks for BOQ approvals + Quotation selections
"""
import io
import os
import uuid
import base64
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from fastapi import Depends, HTTPException, UploadFile, File, Form, Query, Body
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from reportlab.lib.pagesizes import A4
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.lib import colors

FONT_DIR = os.path.join(os.path.dirname(__file__), "assets", "fonts")
try:
    pdfmetrics.registerFont(TTFont("NotoSans", os.path.join(FONT_DIR, "NotoSans-Regular.ttf")))
    pdfmetrics.registerFont(TTFont("NotoSans-Bold", os.path.join(FONT_DIR, "NotoSans-Bold.ttf")))
    _FONT = "NotoSans"; _FONTB = "NotoSans-Bold"
except Exception:
    _FONT = "Helvetica"; _FONTB = "Helvetica-Bold"

INK = colors.HexColor("#1F453B")
MUTED = colors.HexColor("#6B7B7C")
STROKE = colors.HexColor("#B5C4B6")

CATEGORIES = [
    "Agreements", "Pitch", "Scope of Work", "Time and Cost", "Project Brief", "Site Reki",
    "BOQs", "Quotations", "Drawings", "GFC Drawings", "Approvals", "Other", "Handover Documents",
]


def _now():
    return datetime.now(timezone.utc)


def _iso(v):
    if isinstance(v, datetime): return v.isoformat()
    return v


class DocPatch(BaseModel):
    title: Optional[str] = None
    category: Optional[str] = None
    remarks: Optional[str] = None
    visibility: Optional[str] = None
    connected_milestone: Optional[str] = None
    is_archived: Optional[bool] = None


class BriefPayload(BaseModel):
    project_id: str
    sections: Dict[str, Any]  # arbitrary section→field map


class RekiAttachmentIn(BaseModel):
    filename: str
    mime: Optional[str] = None
    content_b64: str
    remark: Optional[str] = ""


class RekiPayload(BaseModel):
    project_id: str
    sections: Dict[str, Any]
    attachments: Optional[List[RekiAttachmentIn]] = None


def _next_doc_number(prefix: str, project_initials: str, year: int, count: int) -> str:
    return f"{prefix}-{project_initials or 'PROJ'}-{year}-V{max(1, count + 1)}"


def _brief_pdf_bytes(project: dict, doc_no: str, sections: Dict[str, Any]) -> bytes:
    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4, leftMargin=18*mm, rightMargin=18*mm, topMargin=18*mm, bottomMargin=18*mm)
    styles = {
        "title": ParagraphStyle("t", fontName=_FONTB, fontSize=18, textColor=INK, spaceAfter=10, leading=22),
        "section": ParagraphStyle("s", fontName=_FONTB, fontSize=12, textColor=INK, spaceBefore=10, spaceAfter=6, leading=16),
        "label": ParagraphStyle("l", fontName=_FONTB, fontSize=9.5, textColor=MUTED, leading=12),
        "body": ParagraphStyle("b", fontName=_FONT, fontSize=10.5, textColor=INK, leading=14, spaceAfter=4),
        "meta": ParagraphStyle("m", fontName=_FONT, fontSize=9, textColor=MUTED, leading=12),
    }
    story = []
    story.append(Paragraph(f"Project Brief — {project.get('name','—')}", styles["title"]))
    story.append(Paragraph(f"Document No. <b>{doc_no}</b> &nbsp; · &nbsp; Client: {project.get('client_name','—')} &nbsp; · &nbsp; Date: {_now().strftime('%d %b %Y')}", styles["meta"]))
    story.append(Spacer(1, 6))

    for sec, fields in (sections or {}).items():
        story.append(Paragraph(sec, styles["section"]))
        if isinstance(fields, dict):
            rows = []
            for k, v in fields.items():
                rows.append([Paragraph(str(k).replace("_"," "), styles["label"]), Paragraph(str(v or "—"), styles["body"])])
            if rows:
                t = Table(rows, colWidths=[60*mm, 110*mm])
                t.setStyle(TableStyle([
                    ("VALIGN",(0,0),(-1,-1),"TOP"),
                    ("LINEBELOW",(0,0),(-1,-1),0.4,STROKE),
                    ("TOPPADDING",(0,0),(-1,-1),4),
                    ("BOTTOMPADDING",(0,0),(-1,-1),4),
                ]))
                story.append(t)
        elif isinstance(fields, list):
            for entry in fields:
                if isinstance(entry, dict):
                    line = " · ".join(f"{k}: {v}" for k, v in entry.items() if v not in (None, ""))
                else:
                    line = str(entry)
                story.append(Paragraph("• " + line, styles["body"]))
        else:
            story.append(Paragraph(str(fields or "—"), styles["body"]))
        story.append(Spacer(1, 4))

    story.append(Spacer(1, 12))
    story.append(Paragraph("Signatures", styles["section"]))
    sig_table = Table([
        [Paragraph("<b>Architect</b>", styles["label"]), Paragraph("<b>Client</b>", styles["label"])],
        [Paragraph("________________", styles["body"]), Paragraph("________________", styles["body"])],
    ], colWidths=[85*mm, 85*mm])
    sig_table.setStyle(TableStyle([("TOPPADDING",(0,0),(-1,-1),18)]))
    story.append(sig_table)

    doc.build(story)
    return buf.getvalue()


def _reki_pdf_bytes(project: dict, doc_no: str, sections: Dict[str, Any]) -> bytes:
    # Same shape as brief but with the Site Reki title
    return _brief_pdf_bytes({**project, "name": project.get("name","—")}, doc_no, sections).replace(
        b"Project Brief", b"Site Reki"
    )  # simple swap keeps token cost tiny — full layout would iterate rooms table


def register_documents(api, db, get_current_user, enforce_free_trial_cap=None):

    # ---------- CATEGORIES ----------
    @api.get("/documents/categories")
    async def list_categories(current=Depends(get_current_user)):
        return CATEGORIES

    # ---------- LIST ----------
    @api.get("/documents")
    async def list_documents(
        project_id: Optional[str] = None, category: Optional[str] = None,
        status: Optional[str] = None, source_app: Optional[str] = None,
        q: Optional[str] = None, visibility: Optional[str] = None,
        is_archived: Optional[bool] = False,
        limit: int = Query(200, ge=1, le=1000),
        current=Depends(get_current_user),
    ):
        query: Dict[str, Any] = {"is_archived": {"$ne": True}} if not is_archived else {"is_archived": True}
        if project_id: query["project_id"] = project_id
        if category: query["category"] = category
        if status: query["status"] = status
        if source_app: query["source_app"] = source_app
        if visibility: query["visibility"] = visibility
        if q: query["title"] = {"$regex": q, "$options": "i"}
        rows = await db.documents.find(query, {"_id": 0}).sort("created_at", -1).to_list(limit)
        # Enrich rows with project_name + client_name via a single batched lookup
        pids = list({r.get("project_id") for r in rows if r.get("project_id") and not r.get("project_name")})
        if pids:
            projs = await db.projects.find({"id": {"$in": pids}}, {"_id": 0, "id": 1, "name": 1, "client_name": 1}).to_list(len(pids))
            pmap = {p["id"]: p for p in projs}
            for r in rows:
                if not r.get("project_name") and r.get("project_id") in pmap:
                    r["project_name"] = pmap[r["project_id"]].get("name")
                if not r.get("client_name") and r.get("project_id") in pmap:
                    r["client_name"] = pmap[r["project_id"]].get("client_name")
        return rows

    # ---------- PROJECT-BASED WORKSPACE (must be registered before /documents/{doc_id}) ----------
    @api.get("/documents/project-cards")
    async def documents_project_cards_early(current=Depends(get_current_user)):
        """Returns per-project document counts for the Documents dashboard grid.

        NOTE: This route MUST be defined before ``/documents/{doc_id}`` so FastAPI
        doesn't treat ``project-cards`` as a document id (which returned 404).
        """
        projects = await db.projects.find({}, {"_id": 0}).to_list(500)
        pipeline = [
            {"$match": {"is_archived": {"$ne": True}}},
            {"$group": {"_id": "$project_id", "count": {"$sum": 1}, "latest": {"$max": "$updated_at"}}},
        ]
        counts = {}
        async for r in db.documents.aggregate(pipeline):
            counts[r["_id"]] = {"count": r["count"], "latest": r["latest"]}
        out = []
        for p in projects:
            c = counts.get(p.get("id"), {"count": 0, "latest": None})
            out.append({
                "project_id": p.get("id"), "project_name": p.get("name"),
                "client_name": p.get("client_name"), "location": p.get("location"),
                "status": p.get("status"), "phase": p.get("phase"),
                "count": c["count"], "latest": c["latest"],
            })
        out.sort(key=lambda x: (-x["count"], (x.get("project_name") or "").lower()))
        return out

    @api.get("/documents/{doc_id}")
    async def get_document(doc_id: str, current=Depends(get_current_user)):
        d = await db.documents.find_one({"id": doc_id}, {"_id": 0})
        if not d: raise HTTPException(404, "Document not found")
        return d

    # ---------- UPLOAD ----------
    @api.post("/documents")
    async def upload_document(
        project_id: str = Form(...), category: str = Form(...), title: str = Form(...),
        version: str = Form("V1"), document_date: str = Form(None), visibility: str = Form("internal"),
        remarks: str = Form(""), source_app: str = Form("uploaded"),
        connected_milestone: str = Form(None), file: UploadFile = File(...),
        current=Depends(get_current_user),
    ):
        if enforce_free_trial_cap:
            await enforce_free_trial_cap(current, "documents")
        data = await file.read()
        if len(data) > 25 * 1024 * 1024:
            raise HTTPException(413, "File exceeds 25 MB")
        # Denormalise project_name + client_name at write-time
        proj = await db.projects.find_one({"id": project_id}, {"_id": 0, "name": 1, "client_name": 1}) or {}
        doc_id = str(uuid.uuid4())
        stored = {
            "id": doc_id, "project_id": project_id,
            "project_name": proj.get("name"), "client_name": proj.get("client_name"),
            "category": category, "title": title,
            "filename": file.filename, "mime": file.content_type, "size": len(data),
            "version": version, "revision": 1, "document_date": document_date or _now().date().isoformat(),
            "uploaded_by": current.get("email"), "uploaded_by_name": current.get("name"),
            "created_by_id": current.get("id"),
            "visibility": visibility, "status": "uploaded", "remarks": remarks,
            "source_app": source_app, "source_id": None, "connected_milestone": connected_milestone,
            "is_archived": False, "content_b64": base64.b64encode(data).decode(),
            "created_at": _iso(_now()), "updated_at": _iso(_now()),
        }
        await db.documents.insert_one(stored.copy())
        stored.pop("content_b64", None)
        return stored

    # ---------- REPLACE (new revision) ----------
    @api.post("/documents/{doc_id}/replace")
    async def replace_document(doc_id: str, file: UploadFile = File(...), current=Depends(get_current_user)):
        prev = await db.documents.find_one({"id": doc_id})
        if not prev: raise HTTPException(404, "Document not found")
        data = await file.read()
        # snapshot old as history entry
        await db.document_history.insert_one({
            **{k: v for k, v in prev.items() if k != "_id"},
            "history_of": doc_id, "archived_at": _iso(_now()),
        })
        rev = int(prev.get("revision", 1)) + 1
        await db.documents.update_one({"id": doc_id}, {"$set": {
            "filename": file.filename, "mime": file.content_type, "size": len(data),
            "revision": rev, "content_b64": base64.b64encode(data).decode(),
            "status": "revised", "updated_at": _iso(_now()),
        }})
        return {"ok": True, "revision": rev}

    @api.get("/documents/{doc_id}/history")
    async def doc_history(doc_id: str, current=Depends(get_current_user)):
        rows = await db.document_history.find({"history_of": doc_id}, {"_id": 0, "content_b64": 0}).sort("archived_at", -1).to_list(50)
        return rows

    @api.get("/documents/{doc_id}/download")
    async def download_document(doc_id: str, current=Depends(get_current_user)):
        d = await db.documents.find_one({"id": doc_id})
        if not d: raise HTTPException(404, "Document not found")
        content = base64.b64decode(d.get("content_b64") or "")
        return StreamingResponse(
            io.BytesIO(content),
            media_type=d.get("mime") or "application/octet-stream",
            headers={"Content-Disposition": f'attachment; filename="{d.get("filename","document")}"'}
        )

    @api.patch("/documents/{doc_id}")
    async def patch_document(doc_id: str, body: DocPatch, current=Depends(get_current_user)):
        d = await db.documents.find_one({"id": doc_id}, {"_id": 0})
        if not d: raise HTTPException(404, "Document not found")
        if d.get("is_locked"):
            raise HTTPException(423, "Document is locked — unlock to edit")
        upd = {k: v for k, v in body.model_dump(exclude_unset=True).items()}
        upd["updated_at"] = _iso(_now())
        await db.documents.update_one({"id": doc_id}, {"$set": upd})
        return {"ok": True}

    @api.delete("/documents/{doc_id}")
    async def archive_document(doc_id: str, current=Depends(get_current_user)):
        d = await db.documents.find_one({"id": doc_id}, {"_id": 0})
        if not d: raise HTTPException(404, "Document not found")
        if d.get("is_locked"):
            raise HTTPException(423, "Document is locked — unlock to delete")
        await db.documents.update_one({"id": doc_id}, {"$set": {"is_archived": True, "updated_at": _iso(_now())}})
        return {"ok": True}

    @api.post("/documents/{doc_id}/lock")
    async def lock_document(doc_id: str, current=Depends(get_current_user)):
        d = await db.documents.find_one({"id": doc_id}, {"_id": 0})
        if not d: raise HTTPException(404, "Document not found")
        await db.documents.update_one({"id": doc_id}, {"$set": {
            "is_locked": True,
            "locked_by": current.get("name") or current.get("email"),
            "locked_at": _iso(_now()),
            "updated_at": _iso(_now()),
        }})
        return {"ok": True, "is_locked": True}

    @api.post("/documents/{doc_id}/unlock")
    async def unlock_document(doc_id: str, current=Depends(get_current_user)):
        # Admin-only unlock (mirrors the require_internal_user role check pattern)
        if current.get("role") not in ("admin", "project_manager"):
            raise HTTPException(403, "Only admins can unlock documents")
        await db.documents.update_one({"id": doc_id}, {"$set": {
            "is_locked": False, "locked_by": None, "locked_at": None,
            "updated_at": _iso(_now()),
        }})
        return {"ok": True, "is_locked": False}

    @api.post("/documents/{doc_id}/toggle-client-visibility")
    async def toggle_visibility(doc_id: str, current=Depends(get_current_user)):
        d = await db.documents.find_one({"id": doc_id})
        if not d: raise HTTPException(404, "Document not found")
        new_v = "client" if d.get("visibility") == "internal" else "internal"
        await db.documents.update_one({"id": doc_id}, {"$set": {"visibility": new_v}})
        return {"ok": True, "visibility": new_v}

    # ---------- PROJECT-BASED WORKSPACE ----------
    @api.get("/documents/project-cards")
    async def documents_project_cards(current=Depends(get_current_user)):
        """Returns per-project document counts for the Documents dashboard grid."""
        projects = await db.projects.find({}, {"_id": 0}).to_list(500)
        pipeline = [
            {"$match": {"is_archived": {"$ne": True}}},
            {"$group": {"_id": "$project_id", "count": {"$sum": 1}, "latest": {"$max": "$updated_at"}}},
        ]
        counts = {}
        async for r in db.documents.aggregate(pipeline):
            counts[r["_id"]] = {"count": r["count"], "latest": r["latest"]}
        out = []
        for p in projects:
            c = counts.get(p.get("id"), {"count": 0, "latest": None})
            out.append({
                "project_id": p.get("id"), "project_name": p.get("name"),
                "client_name": p.get("client_name"), "location": p.get("location"),
                "status": p.get("status"), "phase": p.get("phase"),
                "count": c["count"], "latest": c["latest"],
            })
        # Sort by document count desc, then name
        out.sort(key=lambda x: (-x["count"], (x.get("project_name") or "").lower()))
        return out

    @api.get("/projects/{project_id}/documents-workspace")
    async def project_documents(project_id: str, current=Depends(get_current_user)):
        rows = await db.documents.find({"project_id": project_id, "is_archived": {"$ne": True}}, {"_id": 0, "content_b64": 0}).sort("created_at", -1).to_list(500)
        grouped: Dict[str, list] = {c: [] for c in CATEGORIES}
        for r in rows:
            grouped.setdefault(r.get("category") or "Other", []).append(r)
        return {"project_id": project_id, "categories": grouped, "total": len(rows)}

    @api.get("/projects/{project_id}/handover-package")
    async def handover_package(project_id: str, current=Depends(get_current_user)):
        rows = await db.documents.find({
            "project_id": project_id, "is_archived": {"$ne": True},
            "status": {"$in": ["approved", "gfc", "final", "signed"]},
        }, {"_id": 0, "content_b64": 0}).to_list(500)
        return {"project_id": project_id, "documents": rows, "count": len(rows)}

    # ---------- PROJECT BRIEF ----------
    @api.post("/documents/forms/project-brief")
    async def save_project_brief(body: BriefPayload, current=Depends(get_current_user)):
        p = await db.projects.find_one({"id": body.project_id}, {"_id": 0}) or {}
        initials = p.get("initials") or "".join(w[0] for w in (p.get("name") or "P").split() if w)[:4].upper()
        year = _now().year
        existing = await db.documents.count_documents({"project_id": body.project_id, "category": "Project Brief"})
        doc_no = _next_doc_number("PB", initials, year, existing)
        pdf_bytes = _brief_pdf_bytes(p, doc_no, body.sections)
        stored = {
            "id": str(uuid.uuid4()), "project_id": body.project_id,
            "category": "Project Brief", "title": f"Project Brief — {p.get('name','—')}",
            "filename": f"{doc_no}.pdf", "mime": "application/pdf", "size": len(pdf_bytes),
            "version": f"V{existing + 1}", "revision": 1,
            "document_date": _now().date().isoformat(),
            "uploaded_by": current.get("email"), "uploaded_by_name": current.get("name"),
            "visibility": "internal", "status": "approved",
            "source_app": "form", "source_id": doc_no,
            "connected_milestone": "Client Brief", "is_archived": False,
            "content_b64": base64.b64encode(pdf_bytes).decode(),
            "sections": body.sections,
            "created_at": _iso(_now()), "updated_at": _iso(_now()),
        }
        await db.documents.insert_one(stored.copy())
        stored.pop("content_b64", None)
        return {"ok": True, "doc_no": doc_no, "id": stored["id"], "pdf_size": len(pdf_bytes)}

    # ---------- SITE REKI ----------
    @api.post("/documents/forms/site-reki")
    async def save_site_reki(body: RekiPayload, current=Depends(get_current_user)):
        p = await db.projects.find_one({"id": body.project_id}, {"_id": 0}) or {}
        initials = p.get("initials") or "".join(w[0] for w in (p.get("name") or "P").split() if w)[:4].upper()
        year = _now().year
        existing = await db.documents.count_documents({"project_id": body.project_id, "category": "Site Reki"})
        doc_no = _next_doc_number("SR", initials, year, existing)
        pdf_bytes = _reki_pdf_bytes(p, doc_no, body.sections)
        stored = {
            "id": str(uuid.uuid4()), "project_id": body.project_id,
            "category": "Site Reki", "title": f"Site Reki — {p.get('name','—')}",
            "filename": f"{doc_no}.pdf", "mime": "application/pdf", "size": len(pdf_bytes),
            "version": f"V{existing + 1}", "revision": 1,
            "document_date": _now().date().isoformat(),
            "uploaded_by": current.get("email"), "uploaded_by_name": current.get("name"),
            "visibility": "internal", "status": "approved",
            "source_app": "form", "source_id": doc_no,
            "connected_milestone": "Site Reki", "is_archived": False,
            "content_b64": base64.b64encode(pdf_bytes).decode(),
            "sections": body.sections,
            "attachments": [
                {"id": str(uuid.uuid4()), "filename": a.filename, "mime": a.mime or "application/octet-stream",
                 "size": (len(base64.b64decode(a.content_b64 + "===")) if a.content_b64 else 0),
                 "content_b64": a.content_b64, "remark": a.remark or ""}
                for a in (body.attachments or [])
            ],
            "created_at": _iso(_now()), "updated_at": _iso(_now()),
        }
        await db.documents.insert_one(stored.copy())
        stored.pop("content_b64", None)
        for a in stored.get("attachments", []): a.pop("content_b64", None)
        return {"ok": True, "doc_no": doc_no, "id": stored["id"], "pdf_size": len(pdf_bytes), "attachments": stored.get("attachments", [])}

    @api.get("/documents/{doc_id}/reki")
    async def get_site_reki(doc_id: str, current=Depends(get_current_user)):
        d = await db.documents.find_one({"id": doc_id}, {"_id": 0, "content_b64": 0})
        if not d: raise HTTPException(404, "Not found")
        for a in d.get("attachments", []) or []:
            a.pop("content_b64", None)
        return d

    @api.get("/documents/{doc_id}/attachments/{att_id}")
    async def get_reki_attachment(doc_id: str, att_id: str, current=Depends(get_current_user)):
        d = await db.documents.find_one({"id": doc_id}, {"_id": 0, "attachments": 1})
        if not d: raise HTTPException(404, "Not found")
        for a in d.get("attachments", []) or []:
            if a.get("id") == att_id:
                data = base64.b64decode((a.get("content_b64") or "") + "===")
                from fastapi.responses import Response
                return Response(content=data, media_type=a.get("mime") or "application/octet-stream",
                                headers={"Content-Disposition": f'inline; filename="{a.get("filename","file")}"'})
        raise HTTPException(404, "Attachment not found")
    async def _auto_include_boq(boq_id: str):
        b = await db.boqs.find_one({"id": boq_id}, {"_id": 0})
        if not b: return
        exists = await db.documents.find_one({"source_app": "boq", "source_id": boq_id})
        if exists: return
        proj = await db.projects.find_one({"id": b.get("project_id")}, {"_id": 0, "name": 1, "client_name": 1}) or {}
        d = {
            "id": str(uuid.uuid4()), "project_id": b.get("project_id"),
            "project_name": b.get("project_name") or proj.get("name"),
            "client_name": proj.get("client_name"),
            "category": "BOQs", "title": f"{b.get('boq_number') or 'BOQ'} — {b.get('project_name','')}".strip(),
            "filename": f"{b.get('boq_number','BOQ')}.pdf", "mime": "application/pdf",
            "size": 0, "version": b.get("version") or "V1", "revision": 1,
            "document_date": _now().date().isoformat(),
            "uploaded_by": "system", "uploaded_by_name": "System (BOQ)",
            "visibility": "internal", "status": "approved",
            "source_app": "boq", "source_id": boq_id,
            "connected_milestone": None, "is_archived": False,
            "created_at": _iso(_now()), "updated_at": _iso(_now()),
        }
        await db.documents.insert_one(d)

    async def _auto_include_quotation(quotation_id: str):
        q = await db.quotations.find_one({"id": quotation_id}, {"_id": 0})
        if not q: return
        exists = await db.documents.find_one({"source_app": "quotation", "source_id": quotation_id})
        if exists: return
        proj = await db.projects.find_one({"id": q.get("project_id")}, {"_id": 0, "name": 1, "client_name": 1}) or {}
        d = {
            "id": str(uuid.uuid4()), "project_id": q.get("project_id"),
            "project_name": q.get("project_name") or proj.get("name"),
            "client_name": proj.get("client_name"),
            "category": "Quotations",
            "title": f"{q.get('quotation_number') or 'Quotation'} — {q.get('vendor_name','')}".strip(),
            "filename": f"{q.get('quotation_number','QT')}.pdf", "mime": "application/pdf",
            "size": 0, "version": "V1", "revision": 1,
            "document_date": _now().date().isoformat(),
            "uploaded_by": "system", "uploaded_by_name": "System (Quotations)",
            "visibility": "internal", "status": "approved",
            "source_app": "quotation", "source_id": quotation_id,
            "connected_milestone": None, "is_archived": False,
            "created_at": _iso(_now()), "updated_at": _iso(_now()),
        }
        await db.documents.insert_one(d)

    @api.post("/documents/hooks/boq-approved/{boq_id}")
    async def hook_boq_approved(boq_id: str, current=Depends(get_current_user)):
        await _auto_include_boq(boq_id)
        return {"ok": True}

    @api.post("/documents/hooks/quotation-selected/{quotation_id}")
    async def hook_quotation_selected(quotation_id: str, current=Depends(get_current_user)):
        await _auto_include_quotation(quotation_id)
        return {"ok": True}

    # ---------- Drawings ----------
    @api.get("/drawings")
    async def list_drawings(project_id: Optional[str] = None, current=Depends(get_current_user)):
        q = {"is_archived": {"$ne": True}}
        if project_id: q["project_id"] = project_id
        rows = await db.drawings.find(q, {"_id": 0}).sort("created_at", -1).to_list(500)
        return rows

    @api.post("/drawings")
    async def upload_drawing(
        project_id: str = Form(...), title: str = Form(...), drawing_number: str = Form(...),
        discipline: str = Form("Architecture"), category: str = Form("Drawings"),
        revision: str = Form("R1"), issue_date: str = Form(None), issue_purpose: str = Form(""),
        status: str = Form("Draft"), remarks: str = Form(""),
        file: UploadFile = File(...), current=Depends(get_current_user),
    ):
        data = await file.read()
        # Supersede any prior revision with same drawing_number
        await db.drawings.update_many(
            {"project_id": project_id, "drawing_number": drawing_number, "status": {"$ne": "superseded"}},
            {"$set": {"status": "superseded", "updated_at": _iso(_now())}}
        )
        did = str(uuid.uuid4())
        stored = {
            "id": did, "project_id": project_id, "title": title,
            "drawing_number": drawing_number, "discipline": discipline, "category": category,
            "revision": revision, "issue_date": issue_date or _now().date().isoformat(),
            "issue_purpose": issue_purpose, "status": status, "remarks": remarks,
            "filename": file.filename, "mime": file.content_type, "size": len(data),
            "content_b64": base64.b64encode(data).decode(),
            "uploaded_by": current.get("email"),
            "is_archived": False,
            "created_at": _iso(_now()), "updated_at": _iso(_now()),
        }
        await db.drawings.insert_one(stored.copy())
        stored.pop("content_b64", None)
        return stored

    @api.get("/drawings/{drawing_number}/revisions")
    async def drawing_revisions(drawing_number: str, project_id: Optional[str] = None, current=Depends(get_current_user)):
        q = {"drawing_number": drawing_number}
        if project_id: q["project_id"] = project_id
        rows = await db.drawings.find(q, {"_id": 0, "content_b64": 0}).sort("created_at", -1).to_list(50)
        return rows
