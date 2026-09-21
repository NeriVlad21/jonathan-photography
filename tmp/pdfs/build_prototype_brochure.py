from pathlib import Path

from reportlab.lib.colors import HexColor, white
from reportlab.lib.pagesizes import A4, landscape
from reportlab.pdfbase.pdfmetrics import stringWidth
from reportlab.pdfgen import canvas


ROOT = Path(__file__).resolve().parents[2]
OUTPUT = ROOT / "output" / "pdf" / "Jonathan_Photography_Prototype_Guide.pdf"
OUTPUT.parent.mkdir(parents=True, exist_ok=True)

PAGE_W, PAGE_H = landscape(A4)
PANEL_W = PAGE_W / 3

INK = HexColor("#11110F")
YELLOW = HexColor("#F4D000")
WARM = HexColor("#F4F2EC")
MUTED = HexColor("#68665F")
LINE = HexColor("#D7D3C8")
WHITE = white


def wrap(text, font, size, width):
    words = text.split()
    lines, current = [], ""
    for word in words:
        trial = word if not current else f"{current} {word}"
        if stringWidth(trial, font, size) <= width:
            current = trial
        else:
            if current:
                lines.append(current)
            current = word
    if current:
        lines.append(current)
    return lines


def text_block(c, x, y, text, width, font="Helvetica", size=9.5,
               leading=13, color=INK, max_lines=None):
    lines = wrap(text, font, size, width)
    if max_lines:
        lines = lines[:max_lines]
    c.setFillColor(color)
    c.setFont(font, size)
    for line in lines:
        c.drawString(x, y, line)
        y -= leading
    return y


def label(c, x, y, text, color=MUTED):
    c.setFillColor(color)
    c.setFont("Helvetica-Bold", 7.4)
    c.drawString(x, y, text.upper())


def heading(c, x, y, text, width, size=20, color=INK):
    lines = wrap(text, "Helvetica-Bold", size, width)
    c.setFillColor(color)
    c.setFont("Helvetica-Bold", size)
    for line in lines:
        c.drawString(x, y, line)
        y -= size * 1.05
    return y


def rule(c, x, y, width, color=LINE):
    c.setStrokeColor(color)
    c.setLineWidth(0.7)
    c.line(x, y, x + width, y)


def step(c, x, y, number, title, body, width, accent=YELLOW):
    c.setFillColor(accent)
    c.circle(x + 10, y - 4, 10, fill=1, stroke=0)
    c.setFillColor(INK)
    c.setFont("Helvetica-Bold", 8)
    n = str(number)
    c.drawCentredString(x + 10, y - 7, n)
    c.setFont("Helvetica-Bold", 10.5)
    c.drawString(x + 30, y, title)
    y = text_block(c, x + 30, y - 15, body, width - 30, size=8.7,
                   leading=11.5, color=MUTED)
    return y - 13


def checkbox(c, x, y, text, width):
    c.setStrokeColor(INK)
    c.setLineWidth(0.8)
    c.rect(x, y - 8, 8, 8, fill=0, stroke=1)
    return text_block(c, x + 15, y, text, width - 15, size=8.8,
                      leading=11.5, color=INK) - 8


def camera_icon(c, cx, cy, scale=1.0, stroke=INK, fill=None):
    c.setStrokeColor(stroke)
    c.setLineWidth(2 * scale)
    if fill:
        c.setFillColor(fill)
    c.roundRect(cx - 24 * scale, cy - 16 * scale, 48 * scale,
                32 * scale, 6 * scale, fill=1 if fill else 0, stroke=1)
    c.circle(cx, cy, 9 * scale, fill=0, stroke=1)
    c.line(cx - 13 * scale, cy + 16 * scale, cx - 7 * scale,
           cy + 23 * scale)
    c.line(cx - 7 * scale, cy + 23 * scale, cx + 6 * scale,
           cy + 23 * scale)
    c.line(cx + 6 * scale, cy + 23 * scale, cx + 12 * scale,
           cy + 16 * scale)


def panel_origin(index):
    return index * PANEL_W


def fold_guides(c):
    c.saveState()
    c.setStrokeColor(HexColor("#B8B3A8"))
    c.setDash(2, 3)
    c.setLineWidth(0.5)
    for x in (PANEL_W, PANEL_W * 2):
        c.line(x, 8, x, PAGE_H - 8)
    c.restoreState()


def outside_page(c):
    c.setFillColor(WARM)
    c.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)

    # Left panel: quick reference flap
    x = panel_origin(0) + 24
    y = PAGE_H - 42
    label(c, x, y, "Prototype session")
    y = heading(c, x, y - 25, "Before you begin", PANEL_W - 48, 18)
    y -= 10
    y = checkbox(c, x, y, "Use the test account and sample client details.", PANEL_W - 48)
    y = checkbox(c, x, y, "Say what you expect before selecting a button.", PANEL_W - 48)
    y = checkbox(c, x, y, "Complete each task without step-by-step assistance.", PANEL_W - 48)
    y = checkbox(c, x, y, "Report anything confusing, slow, or unclear.", PANEL_W - 48)
    y -= 7
    rule(c, x, y, PANEL_W - 48)
    y -= 22
    c.setFont("Helvetica-Bold", 10.5)
    c.setFillColor(INK)
    c.drawString(x, y, "Important")
    y = text_block(c, x, y - 17,
                   "An estimate is an initial price guide. A submitted request is not a confirmed booking. Final details and confirmation are completed through direct communication.",
                   PANEL_W - 48, size=8.9, leading=12, color=MUTED)
    c.setFont("Helvetica", 7.2)
    c.setFillColor(MUTED)
    c.drawString(x, 27, "Print double-sided in landscape and flip on the short edge.")

    # Center panel: back cover and session notes
    x = panel_origin(1) + 24
    y = PAGE_H - 42
    label(c, x, y, "Quick feedback")
    y = heading(c, x, y - 25, "Tell us what you noticed", PANEL_W - 48, 18)
    y -= 10
    prompts = [
        "The easiest part was...",
        "The most confusing part was...",
        "A label or instruction I would change is...",
        "The first improvement I would make is...",
    ]
    for prompt in prompts:
        c.setFont("Helvetica-Bold", 9.2)
        c.setFillColor(INK)
        c.drawString(x, y, prompt)
        y -= 18
        c.setStrokeColor(LINE)
        c.line(x, y, x + PANEL_W - 48, y)
        y -= 24
    c.setFillColor(YELLOW)
    c.roundRect(x, 55, PANEL_W - 48, 58, 9, fill=1, stroke=0)
    c.setFillColor(INK)
    c.setFont("Helvetica-Bold", 9)
    c.drawString(x + 14, 91, "Owner validation")
    text_block(c, x + 14, 76,
               "Does this prototype reflect how you want to manage the studio?",
               PANEL_W - 76, size=8.4, leading=11, color=INK)

    # Right panel: front cover
    x0 = panel_origin(2)
    c.setFillColor(INK)
    c.rect(x0, 0, PANEL_W, PAGE_H, fill=1, stroke=0)
    c.setFillColor(YELLOW)
    c.rect(x0, PAGE_H - 13, PANEL_W, 13, fill=1, stroke=0)
    x = x0 + 28
    label(c, x, PAGE_H - 52, "Jonathan Photography", color=YELLOW)
    camera_icon(c, x + 29, PAGE_H - 122, 0.85, stroke=YELLOW)
    y = heading(c, x, PAGE_H - 190, "Prototype guide", PANEL_W - 56, 29, WHITE)
    y -= 14
    y = text_block(c, x, y,
                   "A short guide for reviewing the public website, estimate and booking request, and owner dashboard.",
                   PANEL_W - 56, size=10.2, leading=14.5, color=HexColor("#D7D4CC"))
    c.setFillColor(YELLOW)
    c.roundRect(x, 78, PANEL_W - 56, 54, 8, fill=1, stroke=0)
    c.setFillColor(INK)
    c.setFont("Helvetica-Bold", 11)
    c.drawString(x + 15, 108, "OWNER REVIEW")
    c.setFont("Helvetica", 9)
    c.drawString(x + 15, 91, "September 22, 2026")
    c.setFillColor(HexColor("#A7A49C"))
    c.setFont("Helvetica", 7.5)
    c.drawString(x, 29, "Web-based booking and portfolio management system")

    fold_guides(c)
    c.showPage()


def inside_page(c):
    c.setFillColor(WHITE)
    c.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)

    # Panel 1: public website
    x = panel_origin(0) + 24
    y = PAGE_H - 40
    label(c, x, y, "Part 1")
    y = heading(c, x, y - 24, "Explore the public website", PANEL_W - 48, 18)
    y -= 10
    y = step(c, x, y, 1, "Open the home page",
             "Review the main photograph, introduction, selected work, services, About section, music controls, FAQ, and contact details.", PANEL_W - 48)
    y = step(c, x, y, 2, "Browse the work",
             "Open a portfolio category and view a photography collection. Check whether the images and labels are clear.", PANEL_W - 48)
    y = step(c, x, y, 3, "Review a service",
             "Select a service and confirm that its description, starting price, and next action are understandable.", PANEL_W - 48)
    y -= 2
    rule(c, x, y, PANEL_W - 48)
    y -= 19
    c.setFont("Helvetica-Bold", 9.2)
    c.setFillColor(INK)
    c.drawString(x, y, "While reviewing")
    text_block(c, x, y - 16,
               "Check the site on both laptop and phone. Note any cramped text, excessive spacing, missing content, or controls that are difficult to find.",
               PANEL_W - 48, size=8.6, leading=11.5, color=MUTED)

    # Panel 2: estimate and request
    x = panel_origin(1) + 24
    y = PAGE_H - 40
    label(c, x, y, "Part 2")
    y = heading(c, x, y - 24, "Create an estimate and request", PANEL_W - 48, 18)
    y -= 10
    y = step(c, x, y, 1, "Build the estimate",
             "Choose an event or service, coverage duration, and any available add-ons. Review the estimated price range.", PANEL_W - 48)
    y = step(c, x, y, 2, "Continue to request",
             "Proceed to the booking request when the estimate is acceptable. The estimate remains a guide, not a final quotation.", PANEL_W - 48)
    y = step(c, x, y, 3, "Provide event details",
             "Enter sample contact and event information, review the privacy agreement, and submit the test request.", PANEL_W - 48)
    y = step(c, x, y, 4, "Read the confirmation",
             "Confirm that the next steps are clear: the owner reviews the request, discusses details, and communicates final approval.", PANEL_W - 48)

    # Panel 3: admin
    x = panel_origin(2) + 24
    y = PAGE_H - 40
    label(c, x, y, "Part 3")
    y = heading(c, x, y - 24, "Review and manage as owner", PANEL_W - 48, 18)
    y -= 10
    admin_steps = [
        ("Dashboard", "Review the current overview and open the newest client request."),
        ("Client Requests", "Check the event, estimate, contact details, and request status."),
        ("Calendar", "Verify the date and look for possible schedule conflicts."),
        ("Website Content", "Change sample home, About, music, FAQ, or booking-page content."),
        ("Services and Estimator", "Change one service price and verify that the public estimate uses the updated amount."),
        ("Portfolio and Contacts", "Locate where photographs, featured work, and contact links are updated."),
    ]
    for i, (title, body) in enumerate(admin_steps, 1):
        y = step(c, x, y, i, title, body, PANEL_W - 48)

    fold_guides(c)
    c.showPage()


def build():
    c = canvas.Canvas(str(OUTPUT), pagesize=landscape(A4))
    c.setTitle("Jonathan Photography Prototype Guide")
    c.setAuthor("Jonathan Photography Capstone Team")
    c.setSubject("Owner prototype review guide")
    outside_page(c)
    inside_page(c)
    c.save()
    print(OUTPUT)


if __name__ == "__main__":
    build()
