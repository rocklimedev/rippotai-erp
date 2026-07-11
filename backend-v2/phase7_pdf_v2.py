"""
INOS Phase 4 — Professional PDF export with 5 variants + embedded Noto Sans (₹ support).
Registered from server.py; replaces the legacy /boqs/{id}/export/pdf handler.
"""
import io, os
from typing import Any, Dict, List, Optional
from datetime import datetime, timezone
from fastapi import Depends, HTTPException, Body, Response
from pydantic import BaseModel
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import mm
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, KeepTogether, PageBreak
)

FONT_DIR = os.path.join(os.path.dirname(__file__), "assets", "fonts")
_FONT_REGISTERED = False

def _register_fonts():
    global _FONT_REGISTERED
    if _FONT_REGISTERED:
        return
    reg = os.path.join(FONT_DIR, "NotoSans-Regular.ttf")
    bold = os.path.join(FONT_DIR, "NotoSans-Bold.ttf")
    if os.path.exists(reg) and os.path.exists(bold):
        pdfmetrics.registerFont(TTFont("NotoSans", reg))
        pdfmetrics.registerFont(TTFont("NotoSans-Bold", bold))
        _FONT_REGISTERED = True

def _inr(n) -> str:
    try:
        n = float(n or 0)
    except Exception:
        return "\u20B9 0"
    neg = n < 0
    n = abs(int(round(n)))
    s = str(n)
    if len(s) > 3:
        head, tail = s[:-3], s[-3:]
        head = ",".join([head[max(i-2,0):i] for i in range(len(head), 0, -2)][::-1])
        s = f"{head},{tail}"
    return ("-" if neg else "") + "\u20B9 " + s


GREEN = colors.HexColor("#1F453B")
INK = colors.HexColor("#0F1F1A")
SAGE_SOFT = colors.HexColor("#D8E0DA")
STROKE = colors.HexColor("#B5BFC6")
MUTED = colors.HexColor("#6B7B7C")
WHITE = colors.white


class PdfV2In(BaseModel):
    variant: str = "internal"          # internal|client|quantity_only|vendor_enquiry|summary
    show_rates: bool = True
    show_subtotals: bool = True
    include_terms: bool = True
    include_signatures: bool = True
    include_logo: bool = True
    include_location_column: bool = True
    watermark: Optional[str] = None


def _footer_maker(boq_number: str, version, footer_center: str):
    def _draw(canvas, doc):
        canvas.saveState()
        w, h = A4
        canvas.setFont("NotoSans", 8)
        canvas.setFillColor(MUTED)
        canvas.setStrokeColor(STROKE); canvas.setLineWidth(0.4)
        canvas.line(15*mm, 15*mm, w-15*mm, 15*mm)
        left = f"INOS  ·  {boq_number}  ·  V{version}"
        canvas.drawString(15*mm, 10*mm, left)
        canvas.drawCentredString(w/2, 10*mm, footer_center)
        page_txt = f"Page {doc.page}"
        canvas.drawRightString(w-15*mm, 10*mm, page_txt)
        canvas.restoreState()
    return _draw


def _para(text: str, style_name="body", size=9.5, bold=False, color=INK, align="LEFT"):
    align_map = {"LEFT": 0, "CENTER": 1, "RIGHT": 2}
    return Paragraph(
        text or "",
        ParagraphStyle(
            style_name,
            fontName="NotoSans-Bold" if bold else "NotoSans",
            fontSize=size, leading=size*1.25,
            textColor=color, alignment=align_map.get(align, 0),
        )
    )


def _masthead(boq: dict, project: dict, variant: str, include_logo: bool):
    boq_number = boq.get("boq_number") or "BOQ"
    version = boq.get("version", 1)
    status = (boq.get("status") or "draft").upper()

    title_left = "REQUEST FOR QUOTATION" if variant == "vendor_enquiry" else "INOS"
    left_cell = _para(f'<b>{title_left}</b>', size=18, bold=True, color=GREEN)
    right_cell = _para(
        f'<font size=13><b>{boq_number}</b></font><br/>'
        f'<font size=9 color="#6B7B7C">Version V{version} · {status}</font>',
        align="RIGHT"
    )
    tbl = Table([[left_cell, right_cell]], colWidths=[95*mm, 85*mm])
    tbl.setStyle(TableStyle([("VALIGN",(0,0),(-1,-1),"TOP")]))

    meta_left = [
        [_para('<b>Project</b>', bold=True, size=8, color=MUTED), _para(project.get("name","—"), size=10)],
        [_para('<b>Client</b>',  bold=True, size=8, color=MUTED), _para(project.get("client_name",boq.get("client_name","—")), size=10)],
        [_para('<b>Location</b>',bold=True, size=8, color=MUTED), _para(project.get("location","—"), size=10)],
        [_para('<b>Prepared By</b>',bold=True,size=8,color=MUTED), _para(boq.get("prepared_by","INOS"), size=10)],
    ]
    total_amount = _inr(boq.get("total_amount") or boq.get("final_total") or 0)
    approved_at = boq.get("approved_at") or "—"
    meta_right = [
        [_para('<b>BOQ Date</b>', bold=True, size=8, color=MUTED), _para(str(boq.get("created_at",""))[:10], size=10)],
        [_para('<b>Approved Date</b>', bold=True, size=8, color=MUTED), _para(str(approved_at)[:10], size=10)],
        [_para('<b>Prepared For</b>', bold=True, size=8, color=MUTED), _para(project.get("client_name","—"), size=10)],
        [_para('<b>Estimate Total</b>', bold=True, size=8, color=MUTED), _para(f'<b>{total_amount}</b>', bold=True, size=13, color=GREEN)],
    ]
    left_meta = Table(meta_left, colWidths=[28*mm, 62*mm], style=TableStyle([("VALIGN",(0,0),(-1,-1),"TOP"),("BOTTOMPADDING",(0,0),(-1,-1),4)]))
    right_meta = Table(meta_right, colWidths=[28*mm, 55*mm], style=TableStyle([("VALIGN",(0,0),(-1,-1),"TOP"),("BOTTOMPADDING",(0,0),(-1,-1),4)]))
    meta = Table([[left_meta, right_meta]], colWidths=[95*mm, 85*mm])
    meta.setStyle(TableStyle([("VALIGN",(0,0),(-1,-1),"TOP")]))
    rule = Table([[""]], colWidths=[180*mm], rowHeights=[1])
    rule.setStyle(TableStyle([("LINEABOVE",(0,0),(-1,-1),1,GREEN)]))
    return [tbl, Spacer(1, 4*mm), meta, Spacer(1, 3*mm), rule, Spacer(1, 4*mm)]


def _category_table(cat: dict, cols: List[str], include_location: bool, show_rates: bool):
    header_map = {
        "sno":"S.No", "desc":"Description", "loc":"Location", "unit":"Unit",
        "qty":"Quantity", "rate":"Rate", "type":"Type", "amt":"Amount"
    }
    header_row = [_para(f'<b>{header_map[c]}</b>', size=9, bold=True, color=WHITE, align="CENTER" if c in ("sno","unit","qty","rate","type") else "LEFT") for c in cols]
    rows = [header_row]
    items = cat.get("items", []) or []
    subtotal = 0.0
    for i, it in enumerate(items, start=1):
        qty = float(it.get("quantity") or 0)
        rate = float(it.get("rate") or 0)
        amt = float(it.get("amount") or qty*rate)
        subtotal += amt
        cell = {
            "sno": _para(str(i), size=9, align="CENTER"),
            "desc": _para(it.get("description","") or "", size=9),
            "loc": _para(it.get("location","") or "", size=9),
            "unit": _para(it.get("unit","") or "", size=9, align="CENTER"),
            "qty": _para(f"{qty:g}", size=9, align="CENTER"),
            "rate": _para(_inr(rate), size=9, align="RIGHT"),
            "type": _para((it.get("type") or "M").upper()[:1], size=9, align="CENTER"),
            "amt": _para(_inr(amt), size=9, align="RIGHT"),
        }
        rows.append([cell[c] for c in cols])
    # Category header spanning all columns
    ncols = len(cols)
    cat_hdr = f'{cat.get("code","")} — {(cat.get("name") or "").upper()}'
    subtotal_txt = _inr(cat.get("subtotal") or subtotal) if show_rates else ""
    cat_row = [_para(f'<b>{cat_hdr}</b>', size=10.5, bold=True, color=WHITE)] + [""]*(ncols-2) + [_para(f'<b>SUBTOTAL {subtotal_txt}</b>', size=9.5, bold=True, color=WHITE, align="RIGHT")]
    if ncols == 1:
        cat_row = [_para(f'<b>{cat_hdr}</b>', size=10.5, bold=True, color=WHITE)]

    # Column widths in mm
    widths_map = {"sno":10, "desc":60, "loc":22, "unit":14, "qty":16, "rate":22, "type":10, "amt":26}
    if not include_location and "loc" in cols:
        cols = [c for c in cols if c != "loc"]
    total_w = sum(widths_map[c] for c in cols)
    scale = 180.0 / total_w
    col_w = [widths_map[c]*scale*mm for c in cols]

    tbl = Table([cat_row] + rows, colWidths=col_w, repeatRows=2)
    tbl.setStyle(TableStyle([
        ("BACKGROUND",(0,0),(-1,0), GREEN),
        ("SPAN",(0,0),(-2,0)),
        ("BACKGROUND",(0,1),(-1,1), INK),
        ("TEXTCOLOR",(0,1),(-1,1), WHITE),
        ("BOTTOMPADDING",(0,0),(-1,-1), 3.5),
        ("TOPPADDING",(0,0),(-1,-1), 3.5),
        ("LINEBELOW",(0,1),(-1,-1), 0.3, STROKE),
        ("VALIGN",(0,0),(-1,-1),"MIDDLE"),
    ]))
    # Phase D fix: do NOT wrap in KeepTogether — that would either force the
    # entire category onto one page (dropping continuation rows on huge tables)
    # or break repeatRows=2. Returning the raw Table allows ReportLab to split
    # naturally, and repeatRows=2 will repeat both the category header and the
    # column header row on every continuation page.
    return tbl


def _totals_block(boq: dict, show_rates: bool):
    if not show_rates:
        return []
    fees = boq.get("fees", {}) or {}
    rows = [
        ["Project Total", _inr(boq.get("subtotal") or boq.get("categories_total") or 0)],
    ]
    for label, key in [("Miscellaneous %","miscellaneous"),("Design Fees","design_fees"),
                       ("Execution Fees","execution_fees"),("Supervisor Cost","supervisor_cost"),
                       ("Taxes","taxes"),("Discount","discount")]:
        v = fees.get(key)
        if v:
            rows.append([label, _inr(v)])
    final_total = boq.get("final_total") or boq.get("total_amount") or 0
    body = [[_para(r[0], size=10, bold=(r[0]=="Project Total")), _para(r[1] if isinstance(r[1],str) else "", size=10, align="RIGHT", bold=(r[0]=="Project Total"))] for r in rows]
    body.append([_para('<b>FINAL TOTAL</b>', size=12, bold=True, color=WHITE),
                 _para(f'<b>{_inr(final_total)}</b>', size=13, bold=True, color=WHITE, align="RIGHT")])
    t = Table(body, colWidths=[130*mm, 50*mm])
    style = [("BOTTOMPADDING",(0,0),(-1,-1),4),("TOPPADDING",(0,0),(-1,-1),4),
             ("LINEBELOW",(0,0),(-1,-2),0.3,STROKE),
             ("BACKGROUND",(0,-1),(-1,-1), GREEN),
             ("TOPPADDING",(0,-1),(-1,-1),8), ("BOTTOMPADDING",(0,-1),(-1,-1),8),
             ("VALIGN",(0,0),(-1,-1),"MIDDLE")]
    t.setStyle(TableStyle(style))
    return [Spacer(1, 4*mm), t]


def _terms_block(boq: dict):
    terms_html = boq.get("terms_html") or boq.get("terms") or ""
    if not terms_html:
        return []
    # strip most tags but keep line breaks
    import re
    text = re.sub(r"<li[^>]*>", "\n• ", terms_html, flags=re.I)
    text = re.sub(r"<br\s*/?>", "\n", text, flags=re.I)
    text = re.sub(r"<[^>]+>", "", text).strip()
    return [
        Spacer(1, 6*mm),
        _para("<b>TERMS &amp; CONDITIONS</b>", size=10, bold=True, color=GREEN),
        Spacer(1, 2*mm),
        _para(text.replace("\n", "<br/>"), size=9),
    ]


def _signatures(project: dict):
    left = _para('<b>For INOS</b><br/><br/><br/><br/>______________________________<br/>Authorised Signatory', size=9)
    right = _para(f'<b>For {project.get("client_name","Client")}</b><br/><br/><br/><br/>______________________________<br/>Date:', size=9)
    t = Table([[left, right]], colWidths=[90*mm, 90*mm])
    t.setStyle(TableStyle([("VALIGN",(0,0),(-1,-1),"TOP"),("TOPPADDING",(0,0),(-1,-1),4)]))
    return [Spacer(1, 10*mm), t]


def register_pdf_v2(api, db, get_current_user, _full_boq):
    _register_fonts()

    @api.post("/boqs/{boq_id}/export/pdf")
    async def export_pdf(boq_id: str, payload: PdfV2In = Body(default=PdfV2In()), current=Depends(get_current_user)):
        _register_fonts()
        if not _FONT_REGISTERED:
            raise HTTPException(500, "PDF fonts not available")
        boq = await _full_boq(boq_id)
        project = await db.projects.find_one({"id": boq.get("project_id")}) or {}
        project.pop("_id", None)
        variant = (payload.variant or "internal").lower()
        boq_number = boq.get("boq_number") or f"BOQ-V{boq.get('version',1)}"
        version = boq.get("version", 1)

        # Column set per variant
        cols_full = ["sno","desc","loc","unit","qty","rate","type","amt"]
        cols_qty  = ["sno","desc","loc","unit","qty","type"]
        cols = {
            "internal": cols_full,
            "client": cols_full,
            "quantity_only": cols_qty,
            "vendor_enquiry": cols_qty,
            "summary": [],
        }.get(variant, cols_full)
        if not payload.include_location_column and "loc" in cols:
            cols = [c for c in cols if c != "loc"]
        show_rates = payload.show_rates and variant not in ("quantity_only","vendor_enquiry")

        # Filter categories/items per variant
        cats = boq.get("categories") or []
        # Phase D fix: `_full_boq` returns categories WITHOUT inline items and a
        # separate top-level `items[]`. Re-attach items → category in editor order.
        all_items = boq.get("items") or []
        if all_items and not any((c.get("items") for c in cats)):
            grouped: Dict[str, list] = {}
            for it in all_items:
                grouped.setdefault(it.get("category_id"), []).append(it)
            # Preserve item order (already ordered by `order` when loaded)
            cats = [{**c, "items": grouped.get(c.get("id"), [])} for c in cats]
        if variant == "client":
            cats = [
                {**c, "items": [i for i in (c.get("items") or []) if not i.get("hide_from_client")]}
                for c in cats
            ]

        footer_center = {
            "internal": "Confidential — For internal use",
            "client": "Client Copy",
            "quantity_only": "Quantity Take-Off",
            "vendor_enquiry": "Please quote against these quantities",
            "summary": "Executive Summary",
        }.get(variant, "")

        buf = io.BytesIO()
        doc = SimpleDocTemplate(
            buf, pagesize=A4,
            leftMargin=15*mm, rightMargin=15*mm, topMargin=15*mm, bottomMargin=20*mm,
            title=boq_number
        )
        story: List[Any] = []
        story.extend(_masthead(boq, project, variant, payload.include_logo))

        if variant == "vendor_enquiry":
            vb = Table([
                [_para("<b>Vendor Name</b>", size=9, bold=True, color=MUTED), _para("__________________________________", size=10)],
                [_para("<b>Contact</b>", size=9, bold=True, color=MUTED),     _para("__________________________________", size=10)],
                [_para("<b>Date</b>", size=9, bold=True, color=MUTED),         _para("__________________________________", size=10)],
            ], colWidths=[30*mm, 150*mm])
            vb.setStyle(TableStyle([("BOTTOMPADDING",(0,0),(-1,-1),4),("VALIGN",(0,0),(-1,-1),"MIDDLE")]))
            story.extend([vb, Spacer(1, 4*mm)])

        if variant == "summary":
            # category subtotal + additional charges + final total
            summary_rows = [[_para("<b>Category</b>", size=10, bold=True, color=WHITE),
                             _para("<b>Subtotal</b>", size=10, bold=True, color=WHITE, align="RIGHT")]]
            for c in cats:
                summary_rows.append([_para(f'{c.get("code","")} — {c.get("name","")}', size=10),
                                     _para(_inr(c.get("subtotal") or sum(float(i.get("amount") or 0) for i in (c.get("items") or []))), size=10, align="RIGHT")])
            t = Table(summary_rows, colWidths=[130*mm, 50*mm])
            t.setStyle(TableStyle([("BACKGROUND",(0,0),(-1,0), GREEN),
                                   ("BOTTOMPADDING",(0,0),(-1,-1),5),("TOPPADDING",(0,0),(-1,-1),5),
                                   ("LINEBELOW",(0,0),(-1,-1),0.3,STROKE),
                                   ("VALIGN",(0,0),(-1,-1),"MIDDLE")]))
            story.append(t)
        else:
            for c in cats:
                # Skip empty categories (avoid orphan headers)
                if not c.get("items"):
                    continue
                story.append(_category_table(c, cols, payload.include_location_column, show_rates))
                story.append(Spacer(1, 3*mm))

        story.extend(_totals_block(boq, show_rates))
        if payload.include_terms:
            story.extend(_terms_block(boq))
        if payload.include_signatures:
            story.extend(_signatures(project))

        draw = _footer_maker(boq_number, version, footer_center)
        doc.build(story, onFirstPage=draw, onLaterPages=draw)
        pdf_bytes = buf.getvalue()
        filename = f"{boq_number}-{variant}.pdf"
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'},
        )
