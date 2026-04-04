"""
Camelot — Tur Family Proposal
553 & 557 West 187th Street, New York, NY 10033
Matches exact brand design: dark slate cover, cream inner pages, gold logo box top-right,
gold left accent bar on section headers, Georgia serif headings.
"""
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, PageBreak, KeepTogether, Image as RLImage
)
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT, TA_JUSTIFY
from reportlab.pdfgen import canvas
import os

OUTPUT   = "/sessions/adoring-dazzling-fermat/mnt/Downloads/Camelot_Proposal_Tur_W187th_v3.pdf"
LOGO_IMG = "/sessions/adoring-dazzling-fermat/mnt/Downloads/Camelot Gold Logo.png"
MAP_IMG  = "/sessions/adoring-dazzling-fermat/property_map.png"
BLDG_IMG = "/sessions/adoring-dazzling-fermat/building_photo.png"

# ── Brand palette (exact from reference decks) ──────────────────────────────
SLATE   = colors.HexColor("#3A4B5B")   # cover background
GOLD    = colors.HexColor("#A89035")   # logo gold, headings, accents
GOLD_LT = colors.HexColor("#C4AA6E")   # property name on cover
CREAM   = colors.HexColor("#F5F0E5")   # inner page background
NAVY    = colors.HexColor("#2C3240")   # body text
MUTED   = colors.HexColor("#6B7280")   # captions / labels
MID     = colors.HexColor("#9CA3AF")   # light borders
CARD_BG = colors.HexColor("#EDE9DF")   # stat card backgrounds
WHITE   = colors.white

PAGE_W, PAGE_H = letter
M = 0.75 * inch   # margins


def _draw_logo(c):
    lw, lh = 1.18 * inch, 1.18 * inch
    lx = PAGE_W - lw - 0.22 * inch
    ly = PAGE_H - lh - 0.22 * inch
    if os.path.exists(LOGO_IMG):
        c.drawImage(LOGO_IMG, lx, ly, width=lw, height=lh,
                    preserveAspectRatio=True, mask='auto')


def draw_cover(c, doc):
    w, h = PAGE_W, PAGE_H
    c.saveState()
    # Slate background
    c.setFillColor(SLATE)
    c.rect(0, 0, w, h, fill=1, stroke=0)

    # Building photo strip at bottom (2.5 inches)
    img_strip_h = 2.55 * inch
    if os.path.exists(BLDG_IMG):
        c.drawImage(BLDG_IMG, 0, 0, width=w, height=img_strip_h,
                    preserveAspectRatio=False, mask='auto')
    # Thin gold rule above photo
    c.setStrokeColor(GOLD)
    c.setLineWidth(1.0)
    c.line(0, img_strip_h, w, img_strip_h)

    _draw_logo(c)
    c.setFillColor(WHITE)
    c.setFont("Helvetica", 20)
    c.drawCentredString(w / 2, h - 2.35 * inch, "C  A  M  E  L  O  T")
    c.setFillColor(GOLD_LT)
    c.setFont("Helvetica-Oblique", 11)
    c.drawCentredString(w / 2, h - 2.72 * inch, "Property Management")
    c.setFillColor(GOLD_LT)
    c.setFont("Times-Roman", 38)
    c.drawCentredString(w / 2, h - 4.10 * inch, "553 & 557 West 187th Street")
    c.setFillColor(WHITE)
    c.setFont("Helvetica", 16)
    c.drawCentredString(w / 2, h - 4.68 * inch, "Management Proposal")
    c.setFillColor(colors.HexColor("#B0BAC6"))
    c.setFont("Helvetica", 10)
    c.drawCentredString(w / 2, h - 5.18 * inch,
                        "Washington Heights  |  New York, NY 10033")
    c.drawCentredString(w / 2, h - 5.44 * inch,
                        "45 Units  |  All Rent Stabilized  |  Est. c. 1920s")
    c.setFillColor(GOLD_LT)
    c.setFont("Times-Italic", 10)
    c.drawCentredString(w / 2, h - 6.05 * inch,
                        "Prepared exclusively for Mr. Jose Ramon Tur  \u2014  March 2026")
    # Client address line
    c.setFillColor(colors.HexColor("#8A9BAB"))
    c.setFont("Helvetica", 8.5)
    c.drawCentredString(w / 2, h - 6.35 * inch,
                        "553 & 557 West 187th Street, New York, NY 10033")
    c.restoreState()


def draw_inner(c, doc):
    w, h = PAGE_W, PAGE_H
    c.saveState()
    c.setFillColor(CREAM)
    c.rect(0, 0, w, h, fill=1, stroke=0)
    _draw_logo(c)
    c.setFillColor(MUTED)
    c.setFont("Helvetica", 7.5)
    c.drawCentredString(w / 2, 0.38 * inch, str(doc.page))
    c.restoreState()


# ── Style helpers ────────────────────────────────────────────────────────────
def S(name, **kw):
    return ParagraphStyle(name, **kw)


BODY  = S("Body",  fontName="Helvetica",      fontSize=9.5, textColor=NAVY,
          leading=15, spaceAfter=6, alignment=TA_JUSTIFY)
BODYL = S("BodyL", fontName="Helvetica",      fontSize=9.5, textColor=NAVY,
          leading=15, spaceAfter=5)
BOLD  = S("Bold",  fontName="Helvetica-Bold", fontSize=9.5, textColor=NAVY,
          leading=15, spaceAfter=4)
SMALL = S("Small", fontName="Helvetica",      fontSize=8,   textColor=MUTED,
          leading=12, spaceAfter=3)
LABEL = S("Lbl",   fontName="Helvetica-Bold", fontSize=7,   textColor=MUTED,
          leading=10, spaceAfter=2, spaceBefore=6, letterSpacing=0.8)
CTR   = S("Ctr",   fontName="Helvetica",      fontSize=9.5, textColor=NAVY,
          leading=14, alignment=TA_CENTER, spaceAfter=4)
CTR_I = S("CtrI",  fontName="Helvetica-Oblique", fontSize=9.5, textColor=NAVY,
          leading=14, alignment=TA_CENTER, spaceAfter=4)
HOOK  = S("Hook",  fontName="Times-Roman",    fontSize=28,  textColor=GOLD,
          leading=36, alignment=TA_CENTER, spaceAfter=8)
STAT  = S("Stat",  fontName="Times-Roman",    fontSize=32,  textColor=GOLD,
          leading=36, alignment=TA_CENTER, spaceAfter=0)
STAT2 = S("Stat2", fontName="Helvetica",      fontSize=8,   textColor=MUTED,
          leading=11, alignment=TA_CENTER, spaceAfter=0, letterSpacing=0.8)
ITALIC= S("Italic",fontName="Times-Italic",   fontSize=10,  textColor=GOLD,
          leading=14, alignment=TA_CENTER, spaceAfter=6)
GOLD_H= S("GoldH", fontName="Times-Roman",    fontSize=13,  textColor=GOLD,
          leading=16, spaceAfter=4, spaceBefore=10)
TH    = S("TH",    fontName="Helvetica-Bold", fontSize=8.5, textColor=WHITE,
          leading=12, alignment=TA_CENTER)
TC    = S("TC",    fontName="Helvetica",      fontSize=8.5, textColor=NAVY,
          leading=12)
TCB   = S("TCB",   fontName="Helvetica-Bold", fontSize=8.5, textColor=GOLD,
          leading=12)
TCG   = S("TCG",   fontName="Helvetica",      fontSize=8.5, textColor=MUTED,
          leading=12)

CONTENT_W = PAGE_W - 2 * M


def rule_gold(thick=0.6):
    return HRFlowable(width="100%", thickness=thick, color=GOLD,
                      spaceAfter=12, spaceBefore=0)


def rule_light(thick=0.4):
    return HRFlowable(width="100%", thickness=thick, color=MID,
                      spaceAfter=8, spaceBefore=2)


def section(title, subtitle=None):
    """Section header with gold left accent bar + title in gold serif."""
    bar_w = 0.07 * inch
    bar_h = 0.55 * inch if not subtitle else 0.75 * inch
    title_p = Paragraph(title, S(f"SH_{title[:8]}",
                                  fontName="Times-Roman", fontSize=26, textColor=GOLD,
                                  leading=30, spaceAfter=0))
    bar = Table([[title_p]], colWidths=[CONTENT_W - bar_w - 0.12 * inch])
    bar.setStyle(TableStyle([
        ("LEFTPADDING",  (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING",   (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING",(0, 0), (-1, -1), 0),
    ]))
    outer = Table([[
        Table([[""]], colWidths=[bar_w],
              style=TableStyle([
                  ("BACKGROUND",    (0, 0), (-1, -1), GOLD),
                  ("LEFTPADDING",   (0, 0), (-1, -1), 0),
                  ("RIGHTPADDING",  (0, 0), (-1, -1), 0),
                  ("TOPPADDING",    (0, 0), (-1, -1), 0),
                  ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
              ])),
        bar,
    ]], colWidths=[bar_w, CONTENT_W - bar_w])
    outer.setStyle(TableStyle([
        ("LEFTPADDING",  (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING",   (0, 0), (-1, -1), 2),
        ("BOTTOMPADDING",(0, 0), (-1, -1), 2),
        ("VALIGN",       (0, 0), (-1, -1), "MIDDLE"),
    ]))
    elems = [Spacer(1, 0.18 * inch), outer]
    if subtitle:
        elems.append(Paragraph(subtitle, S(f"SS_{title[:8]}",
                                           fontName="Helvetica", fontSize=9,
                                           textColor=MUTED, leading=13, spaceAfter=10)))
    else:
        elems.append(Spacer(1, 0.1 * inch))
    return elems


def stat_card(number, label, w=2.5 * inch):
    t = Table([
        [Paragraph(number, STAT)],
        [Paragraph(label,  STAT2)],
    ], colWidths=[w])
    t.setStyle(TableStyle([
        ("BACKGROUND",   (0, 0), (-1, -1), CARD_BG),
        ("BOX",          (0, 0), (-1, -1), 0.5, MID),
        ("TOPPADDING",   (0, 0), (-1, -1), 14),
        ("BOTTOMPADDING",(0, 0), (-1, -1), 14),
        ("LEFTPADDING",  (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
    ]))
    return t


def kv_table(rows, cw=None):
    """Key-value info table."""
    if cw is None:
        cw = [1.9 * inch, CONTENT_W - 1.9 * inch]
    data = [[
        Paragraph(lbl, S(f"KL{i}", fontName="Helvetica-Bold", fontSize=8.5,
                         textColor=NAVY, leading=13)),
        Paragraph(val, S(f"KV{i}", fontName="Helvetica", fontSize=8.5,
                         textColor=NAVY, leading=13)),
    ] for i, (lbl, val) in enumerate(rows)]
    t = Table(data, colWidths=cw)
    t.setStyle(TableStyle([
        ("ROWBACKGROUNDS", (0, 0), (-1, -1), [CARD_BG, WHITE]),
        ("BOX",          (0, 0), (-1, -1), 0.5, MID),
        ("INNERGRID",    (0, 0), (-1, -1), 0.3, MID),
        ("TOPPADDING",   (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING",(0, 0), (-1, -1), 5),
        ("LEFTPADDING",  (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("VALIGN",       (0, 0), (-1, -1), "TOP"),
        ("LINEAFTER",    (0, 0), (0, -1),  1.5, GOLD),
    ]))
    return t


def check_item(text, sub=None):
    check = f'<font color="#A89035">\u2714</font>  <b>{text}</b>'
    if sub:
        check += f'<br/><font size="8" color="#6B7280">{sub}</font>'
    return Paragraph(check, S(f"CI{text[:6]}", fontName="Helvetica", fontSize=9,
                               textColor=NAVY, leading=14, spaceAfter=4))


# ════════════════════════════════════════════════════════════════════════════
def build():
    doc = SimpleDocTemplate(OUTPUT, pagesize=letter,
                            rightMargin=M, leftMargin=M,
                            topMargin=1.55 * inch, bottomMargin=0.72 * inch)
    story = [PageBreak()]  # page 1 = canvas cover

    # ── PAGE 2  HOOK ─────────────────────────────────────────────────────────
    story.append(Spacer(1, 1.5 * inch))
    story.append(Paragraph("Protecting a Family Legacy<br/>in Washington Heights", HOOK))
    story.append(HRFlowable(width=0.9 * inch, thickness=1.2, color=GOLD,
                             hAlign="CENTER", spaceAfter=22, spaceBefore=4))
    story.append(Paragraph(
        "45 families call this portfolio home. Behind them is a family that built it — "
        "and now needs a management partner who will protect what was built, "
        "keep every dollar accounted for, and treat these buildings with the same "
        "care their owner always has.",
        CTR))
    story.append(Spacer(1, 0.25 * inch))
    story.append(Paragraph(
        "Camelot brings structure, transparency, and compliance expertise purpose-built "
        "for rent-stabilized residential portfolios in upper Manhattan.",
        CTR))

    # ── PAGE 3  THE PROPERTY ─────────────────────────────────────────────────
    story.append(PageBreak())
    story += section("The Property", "A Washington Heights Residential Portfolio")

    story.append(Paragraph(
        "553 and 557 West 187th Street are adjoining pre-war walk-up residential buildings "
        "in the heart of Washington Heights, Manhattan. Together they form a 45-unit, "
        "fully rent-stabilized portfolio owned by the Tur family — debt-free, community-rooted, "
        "and ideally scaled for Camelot's high-touch management approach.",
        BODY))
    story.append(Spacer(1, 0.15 * inch))

    # Stat cards row
    cards = Table([[
        stat_card("45", "TOTAL UNITS"),
        stat_card("100%", "RENT STABILIZED"),
        stat_card("$0", "MORTGAGE BALANCE"),
    ]], colWidths=[2.15 * inch, 2.15 * inch, 2.30 * inch],
        hAlign="LEFT")
    cards.setStyle(TableStyle([
        ("LEFTPADDING",  (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING",   (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING",(0, 0), (-1, -1), 0),
    ]))
    story.append(cards)
    story.append(Spacer(1, 0.18 * inch))

    story.append(kv_table([
        ("Address",           "553 & 557 West 187th Street, New York, NY 10033"),
        ("Tax Block / Lot",   "Block 2181 / Lot 1 (553)  ·  Block 2181 / Lot 5 (557)"),
        ("Total Units",       "45 Residential Units  ·  25 at 553  ·  20 at 557"),
        ("Occupancy",         "38 occupied  ·  6 vacant  ·  1 management use  (86.7%)"),
        ("Building Type",     "Pre-War Residential Walk-Up  ·  5 Stories Each"),
        ("Year Built",        "c. 1920s  ·  Washington Heights, Manhattan"),
        ("Regulatory Status", "100% Rent Stabilized — DHCR Registered"),
        ("Mortgage",          "Unencumbered — No outstanding mortgage or liens"),
        ("Owner / Client",    "Jose Ramon Tur  ·  553 & 557 West 187th Street, New York, NY 10033"),
        ("Camelot Contact",   "David A. Goldoff, President  ·  (646) 523-9068  ·  dgoldoff@camelot.nyc"),
    ]))

    story.append(Spacer(1, 0.15 * inch))
    story.append(Paragraph(
        "A pre-war, walk-up residential portfolio on a quiet tree-lined block — "
        "steps from Washington Heights' vibrant commercial corridor and excellent transit.",
        ITALIC))

    # ── PAGE 4  FINANCIAL SNAPSHOT ───────────────────────────────────────────
    story.append(PageBreak())
    story += section("Financial Snapshot", "Owner-provided rent roll & 2025 operating data")

    # Rent roll summary
    story.append(Paragraph("Rent Roll Summary", GOLD_H))
    rr = Table([
        [Paragraph("BUILDING",       TH), Paragraph("UNITS",   TH),
         Paragraph("OCCUPIED",       TH), Paragraph("VACANT",  TH),
         Paragraph("MONTHLY RENT",   TH)],
        [Paragraph("553 W 187th St", TC), Paragraph("25", TC),
         Paragraph("19", TC),            Paragraph("5",  TC),
         Paragraph("$24,249", TC)],
        [Paragraph("557 W 187th St", TC), Paragraph("20", TC),
         Paragraph("19", TC),            Paragraph("1",  TC),
         Paragraph("$25,639", TC)],
        [Paragraph("PORTFOLIO TOTAL", TCB), Paragraph("45", TCB),
         Paragraph("38", TCB),            Paragraph("6",  TCB),
         Paragraph("$43,580 / mo", TCB)],
    ], colWidths=[2.2 * inch, 0.85 * inch, 0.9 * inch, 0.75 * inch, 1.4 * inch])
    rr.setStyle(TableStyle([
        ("BACKGROUND",    (0, 0), (-1, 0),  GOLD),
        ("LINEBELOW",     (0, 0), (-1, 0),  1,   GOLD),
        ("ROWBACKGROUNDS",(0, 1), (-1, -2), [CARD_BG, WHITE]),
        ("BACKGROUND",    (0, -1),(-1, -1), colors.HexColor("#2C3240")),
        ("LINEABOVE",     (0, -1),(-1, -1), 1,   GOLD),
        ("BOX",           (0, 0), (-1, -1), 0.5, MID),
        ("INNERGRID",     (0, 0), (-1, -1), 0.3, MID),
        ("TOPPADDING",    (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("LEFTPADDING",   (0, 0), (-1, -1), 8),
        ("RIGHTPADDING",  (0, 0), (-1, -1), 8),
        ("ALIGN",         (1, 0), (-1, -1), "CENTER"),
        ("VALIGN",        (0, 0), (-1, -1), "MIDDLE"),
    ]))
    story.append(rr)
    story.append(Spacer(1, 0.14 * inch))

    story.append(Paragraph(
        "<b>Vacancy Opportunity:</b>  6 vacant units at 553 (Apts 32, 42, 43, 44 &amp; 45) "
        "represent an immediate leasing opportunity. At the portfolio's blended average, "
        "full occupancy adds an estimated <b>$6,600+/month ($79,200+ annually)</b> — "
        "a 15% top-line revenue increase.",
        S("Opp", fontName="Helvetica", fontSize=8.5, textColor=NAVY, leading=13,
          backColor=CARD_BG, borderPad=8, borderColor=GOLD, borderWidth=0.8,
          borderRadius=3, spaceAfter=12)))
    story.append(Spacer(1, 0.1 * inch))

    # OpEx table
    story.append(Paragraph("Annual Operating Expenses (2025 Actuals)", GOLD_H))
    opex_rows = [
        [Paragraph("EXPENSE",         TH), Paragraph("ANNUAL",  TH), Paragraph("% GROSS RENT", TH)],
        ["Property Tax (Gross)",   "$106,425", "20.4%"],
        ["Property Insurance",     "$76,412",  "14.6%"],
        ["Heating Oil",            "$71,886",  "13.7%"],
        ["Water / Sewer (DEP)",    "$62,635",  "12.0%"],
        ["On-Call Repairs & Labor","$24,000",   "4.6%"],
        ["Semi-Super / Porter",    "$24,000",   "4.6%"],
        ["Electric & Gas (Common)","$13,930",   "2.7%"],
        ["Supplies & Maintenance",  "$11,758",   "2.3%"],
        [Paragraph("TOTAL OPERATING EXPENSES", TCB),
         Paragraph("$390,441", TCB),
         Paragraph("74.8%",    TCB)],
    ]
    opex_fmt = []
    for i, row in enumerate(opex_rows):
        if i == 0 or i == len(opex_rows) - 1:
            opex_fmt.append(row)
        else:
            opex_fmt.append([
                Paragraph(row[0], TC),
                Paragraph(row[1], S(f"OA{i}", fontName="Helvetica-Bold", fontSize=8.5,
                                    textColor=NAVY, alignment=TA_CENTER, leading=12)),
                Paragraph(row[2], S(f"OP{i}", fontName="Helvetica", fontSize=8.5,
                                    textColor=MUTED, alignment=TA_CENTER, leading=12)),
            ])
    opex = Table(opex_fmt, colWidths=[3.4 * inch, 1.4 * inch, 1.4 * inch])
    opex.setStyle(TableStyle([
        ("BACKGROUND",    (0, 0), (-1, 0),  GOLD),
        ("ROWBACKGROUNDS",(0, 1), (-1, -2), [CARD_BG, WHITE]),
        ("BACKGROUND",    (0, -1),(-1, -1), colors.HexColor("#2C3240")),
        ("LINEABOVE",     (0, -1),(-1, -1), 1,   GOLD),
        ("BOX",           (0, 0), (-1, -1), 0.5, MID),
        ("INNERGRID",     (0, 0), (-1, -1), 0.3, MID),
        ("TOPPADDING",    (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("LEFTPADDING",   (0, 0), (-1, -1), 8),
        ("RIGHTPADDING",  (0, 0), (-1, -1), 8),
        ("ALIGN",         (1, 0), (-1, -1), "CENTER"),
        ("VALIGN",        (0, 0), (-1, -1), "MIDDLE"),
    ]))
    story.append(opex)
    story.append(Spacer(1, 0.1 * inch))
    story.append(Paragraph(
        "Management fee excluded from operating expenses above. Emergency reserves recommended at 10% of gross rent ($52,296/year).",
        SMALL))

    # ── PAGE 5  NEIGHBORHOOD ─────────────────────────────────────────────────
    story.append(PageBreak())
    story += section("Location & Neighborhood", "Washington Heights, Manhattan")

    # Map
    if os.path.exists(MAP_IMG):
        story.append(RLImage(MAP_IMG, width=CONTENT_W, height=CONTENT_W * 0.625))
        story.append(Spacer(1, 0.12 * inch))

    # Transit / Neighborhood / Landmarks cards
    transit_data = [
        [Paragraph("TRANSIT ACCESS",        TH),
         Paragraph("NEIGHBORHOOD PROFILE",   TH),
         Paragraph("NEARBY LANDMARKS",       TH)],
        [Paragraph(
            "<b>A Train</b> — 181st St Station (~0.4 mi)<br/>"
            "<b>1 Train</b> — 191st St Station (~0.3 mi)<br/>"
            "<b>M3, M4, BX3</b> — Multiple bus routes<br/>"
            "<b>GWB</b> — George Washington Bridge ~0.7 mi",
            S("T1", fontName="Helvetica", fontSize=8.5, textColor=NAVY, leading=14)),
         Paragraph(
            "Pre-war residential character<br/>"
            "Strong rent-stabilized housing stock<br/>"
            "Active Dominican / Latino cultural hub<br/>"
            "Growing demand, historically low turnover",
            S("T2", fontName="Helvetica", fontSize=8.5, textColor=NAVY, leading=14)),
         Paragraph(
            "Highbridge Park — 0.2 mi<br/>"
            "Yeshiva University — 0.4 mi<br/>"
            "Fort Tryon Park — 0.8 mi<br/>"
            "The Cloisters — 0.9 mi<br/>"
            "GWB Bus Terminal — 0.7 mi",
            S("T3", fontName="Helvetica", fontSize=8.5, textColor=NAVY, leading=14))],
    ]
    tt = Table(transit_data, colWidths=[CONTENT_W / 3] * 3)
    tt.setStyle(TableStyle([
        ("BACKGROUND",   (0, 0), (-1, 0),  SLATE),
        ("LINEBELOW",    (0, 0), (-1, 0),  2,   GOLD),
        ("BACKGROUND",   (0, 1), (-1, 1),  CARD_BG),
        ("BOX",          (0, 0), (-1, -1), 0.5, MID),
        ("INNERGRID",    (0, 0), (-1, -1), 0.3, MID),
        ("TOPPADDING",   (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING",(0, 0), (-1, -1), 8),
        ("LEFTPADDING",  (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
        ("VALIGN",       (0, 0), (-1, -1), "TOP"),
    ]))
    story.append(tt)

    # Camelot HQ proximity
    story.append(Spacer(1, 0.15 * inch))
    hq = Table([[
        Paragraph(
            "<b>Camelot HQ: 477 Madison Avenue, Sixth Floor, New York, NY 10022</b><br/>"
            "<font size='8.5' color='#6B7280'>Our senior managers conduct regular on-site inspections. "
            "Washington Heights is part of our active coverage area with existing buildings in the neighborhood.</font>",
            S("HQ", fontName="Helvetica", fontSize=9, textColor=NAVY, leading=14)),
    ]], colWidths=[CONTENT_W])
    hq.setStyle(TableStyle([
        ("BACKGROUND",   (0, 0), (-1, -1), CARD_BG),
        ("BOX",          (0, 0), (-1, -1), 0.8, GOLD),
        ("TOPPADDING",   (0, 0), (-1, -1), 10),
        ("BOTTOMPADDING",(0, 0), (-1, -1), 10),
        ("LEFTPADDING",  (0, 0), (-1, -1), 14),
        ("RIGHTPADDING", (0, 0), (-1, -1), 14),
    ]))
    story.append(hq)

    # ── PAGE 6  WHY CAMELOT ──────────────────────────────────────────────────
    story.append(PageBreak())
    story += section("Why Camelot")

    story.append(Paragraph(
        "<b>The institutional power of a full-service firm. The accountability of a dedicated partner.</b>",
        S("WC_Sub", fontName="Helvetica-Bold", fontSize=10, textColor=NAVY,
          leading=14, spaceAfter=14)))

    # 3-column comparison table
    comp_header = [
        Paragraph("Large Firms",    S("CH", fontName="Helvetica", fontSize=9, textColor=MUTED, alignment=TA_CENTER, leading=12)),
        Paragraph("Camelot",        S("CH2",fontName="Helvetica-Bold", fontSize=9, textColor=WHITE, alignment=TA_CENTER, leading=12)),
        Paragraph("Solo Operators", S("CH3",fontName="Helvetica", fontSize=9, textColor=MUTED, alignment=TA_CENTER, leading=12)),
    ]
    comp_rows_data = [
        ("Your building is one of 500+",    "Your building is a priority",                 "Limited staff, limited hours"),
        ("Same PM for years, no fresh eyes","Fresh strategy, proactive compliance",         "One person handles everything"),
        ("Slow response, layers of bureaucracy","Direct access to senior leadership",       "Unavailable nights & weekends"),
        ("Outsourced accounting, opaque reports","In-house CPAs, owner-ready monthly reports","Basic bookkeeping at best"),
        ("Cookie-cutter compliance approach","Custom DHCR + HPD + LL97 strategy",          "Can't handle rent-stabilized"),
        ("No proprietary technology",       "Merlin AI + ConciergePlus platform",          "Paper-based systems"),
    ]

    def comp_cell(text, gold=False, muted=False):
        st = S(f"cc{text[:5]}", fontName="Helvetica-Bold" if gold else "Helvetica",
               fontSize=8.5, textColor=GOLD if gold else (MUTED if muted else NAVY),
               leading=13)
        return Paragraph(text, st)

    comp_data = [comp_header]
    for left, center, right in comp_rows_data:
        comp_data.append([
            comp_cell(left, muted=True),
            comp_cell(center, gold=True),
            comp_cell(right, muted=True),
        ])

    cw3 = [CONTENT_W * 0.31, CONTENT_W * 0.38, CONTENT_W * 0.31]
    ct = Table(comp_data, colWidths=cw3)
    ct.setStyle(TableStyle([
        ("BACKGROUND",    (0, 0), (0, 0),  colors.HexColor("#E8E3D8")),
        ("BACKGROUND",    (1, 0), (1, 0),  GOLD),
        ("BACKGROUND",    (2, 0), (2, 0),  colors.HexColor("#E8E3D8")),
        ("LINEBELOW",     (1, 0), (1, 0),  2, colors.HexColor("#8A7020")),
        ("ROWBACKGROUNDS",(0, 1), (0, -1), [WHITE, CARD_BG]),
        ("ROWBACKGROUNDS",(2, 1), (2, -1), [WHITE, CARD_BG]),
        ("ROWBACKGROUNDS",(1, 1), (1, -1), [colors.HexColor("#FAF6EC"), colors.HexColor("#F5F0E5")]),
        ("BOX",           (0, 0), (-1, -1), 0.5, MID),
        ("INNERGRID",     (0, 0), (-1, -1), 0.3, MID),
        ("TOPPADDING",    (0, 0), (-1, -1), 7),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
        ("LEFTPADDING",   (0, 0), (-1, -1), 10),
        ("RIGHTPADDING",  (0, 0), (-1, -1), 10),
        ("VALIGN",        (0, 0), (-1, -1), "MIDDLE"),
        ("ALIGN",         (0, 0), (-1, 0),  "CENTER"),
    ]))
    story.append(ct)
    story.append(Spacer(1, 0.14 * inch))
    story.append(Paragraph(
        "Boutique scale.  Institutional capability.  Owner's mentality.",
        ITALIC))

    # ── PAGE 7  SCOPE OF SERVICES ────────────────────────────────────────────
    story.append(PageBreak())
    story += section("Scope of Services",
                     "All services below are included in the base management fee.")

    def svc_grid(title, items):
        elems = [Paragraph(title, GOLD_H)]
        rows, half = [], (len(items) + 1) // 2
        left, right = items[:half], items[half:]
        for i in range(half):
            l = check_item(left[i])  if i < len(left)  else Paragraph("", SMALL)
            r = check_item(right[i]) if i < len(right) else Paragraph("", SMALL)
            rows.append([l, r])
        t = Table(rows, colWidths=[CONTENT_W / 2 - 4] * 2)
        t.setStyle(TableStyle([
            ("ROWBACKGROUNDS", (0, 0), (-1, -1), [CARD_BG, WHITE]),
            ("BOX",            (0, 0), (-1, -1), 0.4, MID),
            ("INNERGRID",      (0, 0), (-1, -1), 0.3, MID),
            ("TOPPADDING",     (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING",  (0, 0), (-1, -1), 4),
            ("LEFTPADDING",    (0, 0), (-1, -1), 8),
            ("RIGHTPADDING",   (0, 0), (-1, -1), 8),
        ]))
        elems.append(t)
        elems.append(Spacer(1, 0.12 * inch))
        return elems

    story += svc_grid("Financial Management", [
        "Monthly rent collection & deposit",
        "Tenant arrears tracking & follow-up",
        "Monthly income/expense reporting",
        "Annual budget preparation",
        "Vendor invoice processing & payment",
        "Security deposit management",
    ])
    story += svc_grid("Compliance & Regulatory", [
        "HPD registration & violation clearance",
        "DHCR rent-stabilization registrations",
        "DOB filing management",
        "FDNY inspection coordination",
        "ECB hearing representation",
        "Annual window guard compliance",
        "Lead paint & Local Law compliance",
        "CO detector & fire safety notices",
        "LL97 / energy compliance monitoring",
    ])
    story += svc_grid("Tenant Services & Operations", [
        "Tenant communication & issue resolution",
        "Rent-stabilization renewals & MCI filings",
        "Vendor coordination & supervision",
        "Emergency maintenance dispatch",
        "24/7 tenant emergency call center",
        "Move-in / move-out administration",
        "Superintendent oversight",
        "Unit inspections & condition reporting",
        "Vacancy marketing & leasing coordination",
    ])

    # ── PAGE 8  MANAGEMENT FEE ───────────────────────────────────────────────
    story.append(PageBreak())
    story += section("Management Fee & Terms")

    # Fee banner
    banner = Table([[
        Paragraph("Management Fee", S("FB1", fontName="Helvetica-Bold", fontSize=11,
                                      textColor=WHITE, leading=15)),
        Paragraph("$4,500 / month  —or—  5% of Gross Rent Collected  ·  Whichever is Greater",
                  S("FB2", fontName="Helvetica-Bold", fontSize=11,
                    textColor=GOLD_LT, leading=15, alignment=TA_RIGHT)),
    ]], colWidths=[2.2 * inch, CONTENT_W - 2.2 * inch])
    banner.setStyle(TableStyle([
        ("BACKGROUND",   (0, 0), (-1, -1), SLATE),
        ("TOPPADDING",   (0, 0), (-1, -1), 12),
        ("BOTTOMPADDING",(0, 0), (-1, -1), 12),
        ("LEFTPADDING",  (0, 0), (-1, -1), 14),
        ("RIGHTPADDING", (0, 0), (-1, -1), 14),
        ("VALIGN",       (0, 0), (-1, -1), "MIDDLE"),
    ]))
    story.append(banner)
    story.append(Spacer(1, 0.15 * inch))

    story.append(kv_table([
        ("Monthly Fee",       "$4,500/month, or 5% of gross rent collected — whichever is greater"),
        ("Accounting Fee",    "WAIVED — Billed at $150/hr only for audits, tenant rent disputes, and city agency rent treble charge proceedings"),
        ("Technology Fee",    "$50/month — FREE for first 6 months  ·  Owner portal, software systems, digital management"),
        ("Onboarding Fee",    "WAIVED — No setup fee for this engagement"),
        ("Annual Increase",   "4% per year beginning on the first anniversary of the Effective Date"),
        ("Billing",           "Monthly, deducted directly from Client Account(s)"),
        ("Agreement Term",    "2-year initial term; auto-renews annually thereafter"),
        ("Termination",       "90 days written notice by either party after the initial term"),
        ("Ancillary Fees",    "See Schedule A — Ancillary Fee Schedule (regulatory filings, leasing, construction supervision, financing, etc.)"),
    ]))
    story.append(Spacer(1, 0.15 * inch))

    # At-a-glance cost box
    cost = Table([[
        Table([
            [Paragraph("Est. Monthly Base Cost", S("CL", fontName="Helvetica-Bold", fontSize=9,
                                                    textColor=MUTED, leading=12))],
            [Paragraph("$4,550 / month", S("CN", fontName="Times-Roman", fontSize=22,
                                            textColor=GOLD, leading=26))],
            [Paragraph("Mgmt $4,500  ·  Tech $50  ·  Acctg WAIVED",
                       S("CB", fontName="Helvetica", fontSize=8, textColor=MUTED, leading=12))],
        ], colWidths=[CONTENT_W / 2 - 20]),
        Table([
            [Paragraph("Est. Annual Cost", S("CR1", fontName="Helvetica-Bold", fontSize=9,
                                              textColor=MUTED, leading=12))],
            [Paragraph("$54,600 / year", S("CR2", fontName="Times-Roman", fontSize=22,
                                            textColor=GOLD, leading=26))],
            [Paragraph("10.5% of $522,960 gross rental income",
                       S("CR3", fontName="Helvetica", fontSize=8, textColor=MUTED, leading=12))],
        ], colWidths=[CONTENT_W / 2 - 20]),
    ]], colWidths=[CONTENT_W / 2, CONTENT_W / 2])
    cost.setStyle(TableStyle([
        ("BACKGROUND",   (0, 0), (-1, -1), CARD_BG),
        ("BOX",          (0, 0), (-1, -1), 0.8, GOLD),
        ("LINEAFTER",    (0, 0), (0, 0),   0.8, GOLD),
        ("TOPPADDING",   (0, 0), (-1, -1), 12),
        ("BOTTOMPADDING",(0, 0), (-1, -1), 12),
        ("LEFTPADDING",  (0, 0), (-1, -1), 16),
        ("RIGHTPADDING", (0, 0), (-1, -1), 16),
        ("VALIGN",       (0, 0), (-1, -1), "TOP"),
    ]))
    story.append(cost)

    # ── PAGE 9  TRANSITION PLAN ──────────────────────────────────────────────
    story.append(PageBreak())
    story += section("60-Day Transition Plan",
                     "Immediate onboarding. No disruption to tenants or existing vendors.")

    phases = [
        ("WEEK 1–2",   "Engagement & Intake",
         "Execute management agreement  ·  Collect complete rent roll, lease files, riders & lease history  ·  "
         "Obtain building keys, access codes & superintendent introduction  ·  "
         "Receive all tenant files, security deposit balances & DHCR history  ·  "
         "Set up owner portal, reporting accounts & client bank account at BankUnited  ·  "
         "Notify tenants of management change with proper written notice"),
        ("WEEK 3–4",   "Compliance Audit",
         "Review DHCR registration history, rent-stabilization records & legal regulated rents  ·  "
         "Pull open HPD, DOB & ECB violations — prioritize clearance of Class C (immediately hazardous) items  ·  "
         "Verify FDNY, window guard, lead paint, CO detector & annual notice compliance  ·  "
         "Review all existing vendor contracts, insurance certificates & expiration dates  ·  "
         "Identify capital improvement needs and deferred maintenance items  ·  "
         "Confirm all payroll service arrangements, worker classification & wages"),
        ("DAYS 30–45", "Financial Takeover & Vendor Onboarding",
         "Establish Client Accounts — receive and deposit first rent collection cycle  ·  "
         "Onboard all existing vendors onto Camelot payment platform  ·  "
         "Set up utility auto-pay (DEP water, Con Edison, NYSEG, fuel accounts)  ·  "
         "Review and renew all service contracts (elevator, boiler, exterminator, laundry)  ·  "
         "Verify workers' comp, liability & umbrella insurance certificates are current  ·  "
         "Establish reserve accounts per Camelot operating procedures"),
        ("DAYS 45–60", "Stabilization & First Report",
         "Clear all open violations with HPD, DOB, ECB & FDNY  ·  "
         "Deliver first full monthly income/expense report with supporting backup  ·  "
         "File or update DHCR annual rent registrations as needed  ·  "
         "Confirm renewal status of all expiring leases — prepare DHCR renewal packages  ·  "
         "Address any tenant outstanding arrears with formal notices  ·  "
         "Establish ongoing owner communication cadence (monthly reports, quarterly calls)  ·  "
         "Prepare vacancy marketing strategy for 6 open units"),
    ]
    phase_rows = []
    for lbl, title, desc in phases:
        phase_rows.append([
            Paragraph(lbl, S(f"PL{lbl[:3]}", fontName="Helvetica-Bold", fontSize=8.5,
                              textColor=WHITE, alignment=TA_CENTER, leading=13)),
            Paragraph(title, S(f"PT{lbl[:3]}", fontName="Helvetica-Bold", fontSize=9.5,
                                textColor=GOLD, leading=14)),
            Paragraph(desc, S(f"PD{lbl[:3]}", fontName="Helvetica", fontSize=8.5,
                               textColor=NAVY, leading=14)),
        ])
    pt = Table(phase_rows, colWidths=[0.95 * inch, 1.45 * inch, CONTENT_W - 2.4 * inch])
    pt.setStyle(TableStyle([
        ("BACKGROUND",    (0, 0), (0, -1),  SLATE),
        ("LINEAFTER",     (0, 0), (0, -1),  1.5, GOLD),
        ("ROWBACKGROUNDS",(1, 0), (-1, -1), [CARD_BG, WHITE]),
        ("BOX",           (0, 0), (-1, -1), 0.5, MID),
        ("INNERGRID",     (0, 0), (-1, -1), 0.3, MID),
        ("TOPPADDING",    (0, 0), (-1, -1), 10),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
        ("LEFTPADDING",   (0, 0), (-1, -1), 10),
        ("RIGHTPADDING",  (0, 0), (-1, -1), 10),
        ("VALIGN",        (0, 0), (-1, -1), "TOP"),
    ]))
    story.append(pt)

    # ── PAGE 10  ABOUT CAMELOT ───────────────────────────────────────────────
    story.append(PageBreak())
    story += section("About Camelot Realty Group")

    story.append(Paragraph(
        "Camelot Realty Group is a full-service real estate firm headquartered at "
        "477 Madison Avenue, Sixth Floor, New York, NY 10022. "
        "Founded and led by <b>David A. Goldoff</b>, Licensed Property Manager &amp; "
        "Real Estate Broker, the firm has built its reputation as a trusted partner "
        "for residential property owners across New York City.",
        BODY))
    story.append(Spacer(1, 0.15 * inch))

    stat_row = Table([[
        stat_card("42",    "BUILDINGS\nMANAGED"),
        stat_card("5,351+","UNITS\nTRACKED"),
        stat_card("$240M+","ASSETS UNDER\nMANAGEMENT"),
        stat_card("4",     "MARKETS\nCOVERED"),
    ]], colWidths=[CONTENT_W / 4] * 4)
    stat_row.setStyle(TableStyle([
        ("LEFTPADDING",  (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING",   (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING",(0, 0), (-1, -1), 0),
    ]))
    story.append(stat_row)
    story.append(Spacer(1, 0.18 * inch))

    story.append(kv_table([
        ("Property Management", "Camelot Property Management Services Corp. — Residential & Commercial"),
        ("Brokerage",           "Camelot Brokerage Services Corp. — Sales, Leasing & Advisory"),
        ("Living Solutions",    "Camelot Living Solutions Corp. — Tenant Relations & Placement"),
        ("Technology",          "Merlin AI — Portfolio intelligence platform  ·  ConciergePlus — Resident portal"),
        ("Credentials",         "REBNY  ·  NYARM  ·  IREM  ·  National Association of Realtors  ·  HGAR  ·  OneKey"),
        ("Recognition",         "REBNY Community Service Award  ·  RED Property Management Company of the Year  ·  AMRF Golf Sponsor"),
        ("Headquarters",        "477 Madison Avenue, 6th Floor  ·  New York, NY 10022"),
    ]))

    # ── PAGE 11  NEXT STEPS ──────────────────────────────────────────────────
    story.append(PageBreak())
    story += section("Next Steps")

    steps = [
        ("1", "Review This Proposal",
         "Take a moment to review the services and fee structure outlined here. "
         "We welcome any questions and are happy to adjust scope as needed."),
        ("2", "Schedule a Conversation",
         "David Goldoff is available by phone, Zoom, or in person at the buildings. "
         "Cell: (646) 523-9068  ·  Email: dgoldoff@camelot.nyc"),
        ("3", "Receive the Management Agreement",
         "Upon your direction we will deliver our formal Property Management Agreement "
         "and Schedule A of ancillary fees for your review and execution."),
        ("4", "Transition Begins Immediately",
         "Once the agreement is signed we begin onboarding within days — "
         "no disruption to tenants, no disruption to existing vendors."),
    ]
    step_rows = []
    for n, t, d in steps:
        step_rows.append([
            Paragraph(n, S(f"SN{n}", fontName="Times-Roman", fontSize=20,
                            textColor=WHITE, alignment=TA_CENTER, leading=24)),
            Paragraph(f"<b>{t}</b><br/>"
                      f"<font size='8.5' color='#6B7280'>{d}</font>",
                      S(f"SD{n}", fontName="Helvetica", fontSize=9.5,
                        textColor=NAVY, leading=14)),
        ])
    st = Table(step_rows, colWidths=[0.5 * inch, CONTENT_W - 0.5 * inch])
    st.setStyle(TableStyle([
        ("BACKGROUND",    (0, 0), (0, -1),  GOLD),
        ("ROWBACKGROUNDS",(1, 0), (1, -1),  [CARD_BG, WHITE]),
        ("BOX",           (0, 0), (-1, -1), 0.5, MID),
        ("INNERGRID",     (0, 0), (-1, -1), 0.3, MID),
        ("TOPPADDING",    (0, 0), (-1, -1), 12),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 12),
        ("LEFTPADDING",   (0, 0), (-1, -1), 10),
        ("RIGHTPADDING",  (0, 0), (-1, -1), 12),
        ("VALIGN",        (0, 0), (-1, -1), "MIDDLE"),
    ]))
    story.append(st)
    story.append(Spacer(1, 0.22 * inch))

    # Contact card
    contact = Table([[
        Paragraph(
            "<b>David A. Goldoff</b><br/>"
            "<font size='8' color='#9CA3AF'>President &amp; Owner  ·  Licensed Property Manager &amp; Real Estate Broker</font>",
            S("CA", fontName="Helvetica-Bold", fontSize=11, textColor=WHITE, leading=16)),
        Paragraph(
            "Cell:  (646) 523-9068<br/>"
            "Office:  (212) 206-9939 x 701<br/>"
            "Email:  dgoldoff@camelot.nyc<br/>"
            "Web:  www.camelot.nyc",
            S("CB", fontName="Helvetica", fontSize=9, textColor=colors.HexColor("#D0C8B0"), leading=14)),
        Paragraph(
            "477 Madison Avenue<br/>6th Floor<br/>New York, NY 10022",
            S("CC", fontName="Helvetica", fontSize=9, textColor=MUTED,
              alignment=TA_CENTER, leading=14)),
    ]], colWidths=[2.5 * inch, 2.5 * inch, 1.6 * inch])
    contact.setStyle(TableStyle([
        ("BACKGROUND",   (0, 0), (-1, -1), SLATE),
        ("LINEAFTER",    (0, 0), (0, 0),   1, GOLD),
        ("LINEAFTER",    (1, 0), (1, 0),   1, GOLD),
        ("BOX",          (0, 0), (-1, -1), 1, GOLD),
        ("TOPPADDING",   (0, 0), (-1, -1), 14),
        ("BOTTOMPADDING",(0, 0), (-1, -1), 14),
        ("LEFTPADDING",  (0, 0), (-1, -1), 14),
        ("RIGHTPADDING", (0, 0), (-1, -1), 14),
        ("VALIGN",       (0, 0), (-1, -1), "MIDDLE"),
    ]))
    story.append(contact)
    story.append(Spacer(1, 0.14 * inch))
    story.append(Paragraph(
        "Thank you for the opportunity, Mr. Tur. We look forward to earning your family's "
        "trust and serving 553 and 557 West 187th Street with the care they deserve.",
        ITALIC))

    doc.build(story, onFirstPage=draw_cover, onLaterPages=draw_inner)
    print(f"Proposal created: {OUTPUT}")


build()
