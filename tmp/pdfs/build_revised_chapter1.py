from pathlib import Path

from pypdf import PdfReader, PdfWriter
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    KeepTogether,
    PageTemplate,
    Paragraph,
    PageBreak,
    Spacer,
    Table,
    TableStyle,
)


ROOT = Path(__file__).resolve().parents[2]
SOURCE = Path(r"C:\Users\Mikael\Downloads\Photography Capstone (1).pdf")
WORK = ROOT / "tmp" / "pdfs" / "revised-chapter-1-only.pdf"
OUTPUT = ROOT / "output" / "pdf" / "Photography_Capstone_Revised_Chapter_1.pdf"
OUTPUT.parent.mkdir(parents=True, exist_ok=True)


class ChapterDocTemplate(BaseDocTemplate):
    def __init__(self, filename):
        super().__init__(
            filename,
            pagesize=letter,
            leftMargin=0.85 * inch,
            rightMargin=0.85 * inch,
            topMargin=0.72 * inch,
            bottomMargin=0.72 * inch,
            title="Photography Capstone - Revised Chapter I",
            author="Basa, Deodora, Neri, Salango, and Yu",
        )
        frame = Frame(
            self.leftMargin,
            self.bottomMargin,
            self.width,
            self.height,
            id="chapter-frame",
        )
        self.addPageTemplates(PageTemplate(id="chapter", frames=[frame]))


styles = getSampleStyleSheet()
body_style = ParagraphStyle(
    "Body",
    parent=styles["BodyText"],
    fontName="Helvetica",
    fontSize=11,
    leading=20,
    alignment=TA_JUSTIFY,
    firstLineIndent=0.5 * inch,
    spaceAfter=10,
    textColor=colors.HexColor("#111111"),
    allowWidows=0,
    allowOrphans=0,
)
section_style = ParagraphStyle(
    "Section",
    parent=styles["Heading2"],
    fontName="Helvetica-Bold",
    fontSize=12,
    leading=16,
    alignment=TA_LEFT,
    spaceBefore=14,
    spaceAfter=12,
    keepWithNext=True,
)
subsection_style = ParagraphStyle(
    "Subsection",
    parent=section_style,
    fontSize=11,
    spaceBefore=10,
    spaceAfter=8,
)
chapter_style = ParagraphStyle(
    "Chapter",
    parent=styles["Heading1"],
    fontName="Helvetica-Bold",
    fontSize=14,
    leading=18,
    alignment=TA_CENTER,
    spaceAfter=12,
)
chapter_title_style = ParagraphStyle(
    "ChapterTitle",
    parent=chapter_style,
    fontSize=13,
    spaceAfter=26,
)
numbered_style = ParagraphStyle(
    "Numbered",
    parent=body_style,
    firstLineIndent=-18,
    leftIndent=42,
    spaceAfter=7,
)
definition_style = ParagraphStyle(
    "Definition",
    parent=body_style,
    firstLineIndent=0,
    spaceAfter=9,
)
caption_style = ParagraphStyle(
    "Caption",
    parent=styles["BodyText"],
    fontName="Helvetica-Bold",
    fontSize=9.5,
    leading=12,
    alignment=TA_CENTER,
    spaceBefore=8,
    spaceAfter=8,
    keepWithNext=True,
)
table_header = ParagraphStyle(
    "TableHeader",
    parent=styles["BodyText"],
    fontName="Helvetica-Bold",
    fontSize=8.5,
    leading=11,
    alignment=TA_LEFT,
    textColor=colors.white,
)
table_body = ParagraphStyle(
    "TableBody",
    parent=styles["BodyText"],
    fontName="Helvetica",
    fontSize=8.5,
    leading=12,
    alignment=TA_LEFT,
)
reference_style = ParagraphStyle(
    "Reference",
    parent=body_style,
    firstLineIndent=-0.35 * inch,
    leftIndent=0.35 * inch,
    leading=17,
)


def P(text, style=body_style):
    return Paragraph(text, style)


def simple_table(caption, headers, rows, widths):
    data = [[P(header, table_header) for header in headers]]
    data.extend([[P(str(cell), table_body) for cell in row] for row in rows])
    table = Table(data, colWidths=widths, repeatRows=1, hAlign="CENTER")
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#222222")),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("GRID", (0, 0), (-1, -1), 0.45, colors.HexColor("#9A9A9A")),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F4F4F4")]),
        ("LEFTPADDING", (0, 0), (-1, -1), 7),
        ("RIGHTPADDING", (0, 0), (-1, -1), 7),
        ("TOPPADDING", (0, 0), (-1, -1), 7),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
    ]))
    return [P(caption, caption_style), table, Spacer(1, 12)]


story = [
    Spacer(1, 0.25 * inch),
    P("CHAPTER I", chapter_style),
    P("INTRODUCTION", chapter_title_style),
    P("Background of the Study", section_style),
    P(
        "Small service businesses commonly begin customer transactions through direct conversations. "
        "In the Philippines, these conversations often take place through social media, phone calls, and "
        "text messages. These channels are convenient, but information may become scattered when inquiries, "
        "service choices, prices, and schedules are kept in separate message threads. Philippine micro, small, "
        "and medium enterprises have increasingly considered digital tools as part of their daily operations "
        "and long-term development (Malicdem, 2026). Organized record-keeping is also important because it "
        "gives small businesses a clearer basis for monitoring transactions and making decisions "
        "(Bannerman et al., 2023)."
    ),
    P(
        "This situation applies to photography studios because a client usually needs several kinds of "
        "information before a session can be finalized. A prospective client may first review previous work, "
        "compare services, estimate a budget, identify a preferred date, and explain the event requirements. "
        "The studio must then evaluate the request, discuss details with the client, and decide whether the "
        "schedule can be confirmed. When these steps are handled only through individual messages and calls, "
        "the studio may find it difficult to maintain a complete and consistent record of each inquiry."
    ),
    P(
        "Jonathan Photography is a local photography and video studio based in Sison, Pangasinan. Before the "
        "development of the system, its inquiries were mainly handled through Facebook messages and phone "
        "calls. This process supported direct communication but did not provide one place for presenting "
        "categorized portfolio work, maintaining service and pricing information, preparing preliminary package "
        "estimates, receiving structured booking requests, and monitoring requested dates. Clients also had to "
        "contact the studio before they could obtain an initial idea of the possible package cost."
    ),
    P(
        "To address these concerns, the researchers developed a web-based Booking and Portfolio Management "
        "System for Jonathan Photography. The system has a responsive public website and a login-protected "
        "administrative website that use the same database. On the public website, visitors can browse portfolio "
        "collections, review services, learn about the studio, read frequently asked questions, and use a package "
        "estimator. The estimator calculates a preliminary amount from the selected service, coverage, and add-ons. "
        "A visitor may use or email the estimate without being required to submit a booking request."
    ),
    P(
        "When a visitor decides to request a session, the system requires a completed estimate before showing "
        "the booking form. This design connects the selected package and estimated amount to the request received "
        "by the administrator. The client then provides contact and event details, chooses an available date, and "
        "agrees to the privacy notice. After submission, the client receives a confirmation email, while the "
        "administrator receives an email containing the request and estimate breakdown. The submitted date is "
        "marked as requested so that another client cannot select it while the studio reviews the request."
    ),
    P(
        "The administrative website allows the studio to review requests, confirm or cancel them, and manage a "
        "shared booking calendar. A new request appears on the calendar as Requested. A confirmed request becomes "
        "Booked, while a cancelled request is marked Cancelled and its date becomes available again when no other "
        "active schedule occupies that date. The administrator may also add booked work manually when an agreement "
        "was completed through a conversation outside the website. This preserves the studio's existing practice "
        "of personally discussing and finalizing bookings while giving it a more organized schedule."
    ),
    P(
        "The system further provides tools for managing portfolio categories, photo collections, services, "
        "estimator prices, add-ons, contact links, estimator leads, records, and downloadable reports. Both the "
        "public and administrative interfaces adjust to phones, tablets, laptops, and larger screens. The project "
        "therefore focuses on improving the studio's discovery, estimation, inquiry, scheduling, and content "
        "management activities without replacing the personal consultation through which the actual booking is "
        "finalized."
    ),
]

flow_cells = [
    P("Browse portfolio and services", table_body),
    P("Build a preliminary estimate", table_body),
    P("Submit a booking request", table_body),
    P("Admin reviews the request", table_body),
    P("Confirm, cancel, or add booked work", table_body),
]
flow = Table([flow_cells], colWidths=[0.98 * inch] * 5, rowHeights=[0.72 * inch], hAlign="CENTER")
flow.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#F1F1F1")),
    ("BOX", (0, 0), (-1, -1), 0.7, colors.HexColor("#555555")),
    ("INNERGRID", (0, 0), (-1, -1), 0.45, colors.HexColor("#AAAAAA")),
    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ("ALIGN", (0, 0), (-1, -1), "CENTER"),
    ("LEFTPADDING", (0, 0), (-1, -1), 6),
    ("RIGHTPADDING", (0, 0), (-1, -1), 6),
]))
story.extend([
    P("Figure 1.1. Conceptual Overview of the Study", caption_style),
    flow,
    P(
        "Figure 1.1 summarizes the system's intended use. The public website supports discovery, estimation, "
        "and request submission. The administrative website supports review and scheduling. The website records "
        "and organizes these activities, but the studio and client still finalize the actual service through "
        "direct communication."
    ),
    P("Problem Statement", section_style),
    P(
        "Jonathan Photography previously relied mainly on Facebook messages and phone calls for inquiries and "
        "booking-related communication. Although this approach allowed direct contact with clients, it did not "
        "provide a single system for organizing the information needed before and during administrative review. "
        "The study therefore addressed the following problems:"
    ),
    P("1. <b>Scattered inquiry and booking information.</b> Client details, service preferences, and follow-up information were distributed across separate conversations, making requests difficult to review and track consistently.", numbered_style),
    P("2. <b>No immediate preliminary package estimate.</b> Clients had to begin a conversation with the studio before obtaining an initial price based on service, coverage, and optional add-ons.", numbered_style),
    P("3. <b>Limited independent access to portfolio and service information.</b> Prospective clients did not have one responsive website where they could browse categorized work, examine available services, and understand the intended booking process before making an inquiry.", numbered_style),
    P("4. <b>No shared view of requested and booked dates.</b> The existing process did not provide an interconnected calendar that could show booking requests, confirmed sessions, cancellations, and bookings arranged outside the website.", numbered_style),
    P("5. <b>Difficulty maintaining content, prices, and records.</b> Service information, estimator prices, portfolio content, contact links, and booking records could not be managed through one protected administrative interface.", numbered_style),
])

story.extend(simple_table(
    "Table 1.1. Summary of the Identified Problems",
    ["Identified problem", "Effect on the studio or client", "System response"],
    [
        ["Scattered inquiries", "Requests are harder to monitor and review.", "Centralized booking records and status management"],
        ["No preliminary estimator", "Clients cannot plan a starting budget independently.", "Configurable estimator for services, coverage, and add-ons"],
        ["Limited portfolio access", "Clients cannot conveniently assess previous work.", "Responsive portfolio organized by collection"],
        ["Separate date records", "Requested, confirmed, and manually arranged work may be difficult to coordinate.", "Shared public and admin availability calendar"],
        ["Disconnected content management", "Routine updates take more effort and may become inconsistent.", "Protected tools for services, pricing, portfolio, and contact links"],
    ],
    [1.45 * inch, 1.95 * inch, 1.85 * inch],
))

story.extend([
    P("Objectives of the Study", section_style),
    P("General Objective", subsection_style),
    P(
        "The general objective of the study is to design and develop a responsive web-based Booking and "
        "Portfolio Management System for Jonathan Photography that supports portfolio browsing, preliminary "
        "package estimation, structured booking requests, synchronized schedule management, email notification, "
        "and centralized administration while retaining manual confirmation of the actual booking."
    ),
    P("Specific Objectives", subsection_style),
    P("Specifically, the study aims to:", body_style),
    P("1. develop a responsive public website where prospective clients can browse categorized portfolio work, review services, learn about the studio, and understand the booking process;", numbered_style),
    P("2. implement a configurable package estimator that calculates a preliminary amount from the selected service, coverage, and add-ons, and allows the estimate to be used independently or attached to a booking request;", numbered_style),
    P("3. provide a structured booking request process that requires a completed estimate, collects client and event information, obtains privacy consent, and sends confirmation and administrator notification emails;", numbered_style),
    P("4. connect booking requests with public and administrative calendars so that requested, confirmed, manually booked, and cancelled schedules are reflected consistently;", numbered_style),
    P("5. create a protected administrative website for managing bookings, estimator leads, portfolio content, services, pricing options, contact links, archives, and downloadable reports; and", numbered_style),
    P("6. apply appropriate validation, administrative authentication, request protection, spam controls, and responsive interface behavior to support reliable use across common device sizes.", numbered_style),
])

story.extend(simple_table(
    "Table 1.2. Objectives of the Study",
    ["Objective area", "Expected system capability"],
    [
        ["Public information", "Responsive portfolio, services, studio information, contact details, and frequently asked questions"],
        ["Estimation", "Configurable preliminary estimate that can be emailed or continued into booking"],
        ["Booking request", "Estimate-linked form, date selection, privacy consent, and email notifications"],
        ["Schedule coordination", "Synchronized request and booking statuses, public availability, and manual admin scheduling"],
        ["Administration", "Central management of records, content, prices, leads, archives, and reports"],
        ["Protection and usability", "Authentication, validation, request safeguards, and responsive controls"],
    ],
    [1.65 * inch, 3.6 * inch],
))

story.extend([
    P("Significance of the Study", section_style),
    P(
        "<b>Studio Owner and Administrator.</b> The system gives Jonathan Photography one administrative "
        "workspace for reviewing requests, checking estimates, monitoring dates, confirming or cancelling "
        "requests, and recording bookings arranged outside the website. It also reduces the need to edit website "
        "content directly because portfolio items, services, estimator prices, add-ons, and contact links can be "
        "managed through the dashboard. Search, filters, status indicators, archived records, and downloadable "
        "reports support day-to-day review and record organization."
    ),
    P(
        "<b>Prospective Clients.</b> The public website gives clients a clearer way to learn about the studio "
        "before starting a direct conversation. They can view previous work, examine services, prepare an estimate, "
        "and check date availability from a phone, tablet, or computer. Clients who only need an estimate are not "
        "forced to submit a booking request. Clients who continue to booking submit the same estimate with their "
        "contact and event details, which helps reduce missing or repeated information."
    ),
    P(
        "<b>Researchers and Proponents.</b> The project allows the researchers to apply knowledge in requirements "
        "analysis, interface design, web development, database design, validation, security, testing, and system "
        "integration. It also provides experience in translating the actual working practices of a local studio "
        "into a system with clear boundaries and usable public and administrative interfaces."
    ),
    P(
        "<b>Future Researchers and Developers.</b> The study may serve as a reference for future projects involving "
        "small service businesses, booking requests, package estimation, portfolio management, or schedule "
        "coordination. Future work may extend the documented design while considering the scope and limitations "
        "of the present system."
    ),
    P("Scope and Delimitations", section_style),
    P("Scope", subsection_style),
    P(
        "The study covers the design and development of a web-based Booking and Portfolio Management System for "
        "Jonathan Photography in Sison, Pangasinan. It consists of a public website, an administrative website, a "
        "PHP application interface, and a MySQL database containing fourteen tables for the system's operational "
        "records and managed content."
    ),
    P(
        "The public website includes Home, Work, Services, About, Contact, Frequently Asked Questions, and the "
        "combined Estimate and Booking experience. Portfolio work is organized into categories and photo groups. "
        "The estimator uses administrator-managed service types, coverage options, and add-ons to calculate a "
        "preliminary total. A visitor may email this result without booking. To submit a booking request, the visitor "
        "must first complete the estimator, after which the booking form carries the selected package and amount."
    ),
    P(
        "The booking form collects the client's name, email address, phone number, optional Facebook information, "
        "event type, preferred date, location, expected number of guests, and message. It displays public date "
        "availability, requires privacy consent, and uses validation, a hidden anti-spam field, and submission limits. "
        "A successful submission creates a reference code, records the estimate, sends a confirmation email to the "
        "client, sends the full request and estimate breakdown to the administrator, and places the date on the "
        "calendar as Requested."
    ),
    P(
        "The administrative website includes authentication, a summary dashboard, booking search and filters, "
        "booking details, status management, estimator lead monitoring, portfolio management, service management, "
        "estimator configuration, contact-link management, profile settings, and archived records. The booking "
        "calendar displays requested, booked, completed, and cancelled records. It also permits the administrator "
        "to add booked work manually, either with or without a linked website request. Booking and calendar status "
        "changes update the public availability shown to clients. The system can generate booking and calendar PDF "
        "reports for administrative use."
    ),
    P(
        "Both interfaces are designed to respond to common phone, tablet, laptop, and desktop screen sizes. The "
        "public website uses compact navigation and a floating booking control on phones. The administrative website "
        "uses a collapsible navigation drawer and adjusts forms, cards, tables, dialogs, and calendars for smaller "
        "screens."
    ),
    P("Delimitations", subsection_style),
    P(
        "The system supports a booking request, not an automatically finalized reservation. A requested date is "
        "temporarily made unavailable to prevent another public request for the same date, but the studio must still "
        "communicate with the client outside the website before confirming the actual booking. The administrator is "
        "responsible for reviewing requests, maintaining schedule records, and entering bookings arranged through "
        "other communication channels."
    ),
    P(
        "The estimated amount is not a final quotation. The studio may adjust the package, requirements, and final "
        "price during consultation. The system does not process deposits, balances, refunds, or any other online "
        "payment. It does not create contracts or electronic signatures. It also does not include client accounts, "
        "a client portal, automated chat, or direct integration with external calendar services."
    ),
    P(
        "Post-production activities are outside the scope of the study. The system does not provide photo proofing, "
        "client photo selection, editing or revision management, private delivery galleries, or high-resolution file "
        "delivery. These are deliberate boundaries because the system focuses on public presentation, estimation, "
        "booking requests, administrative review, and schedule coordination."
    ),
])

story.extend(simple_table(
    "Table 1.3. Scope and Delimitations",
    ["Included in the study", "Outside the study"],
    [
        ["Responsive public portfolio, services, information, estimator, booking request, and availability", "Client accounts, client portal, and automated chat"],
        ["Emailing an estimate and sending booking notifications", "Final quotations without studio review"],
        ["Requested, booked, cancelled, and manual calendar entries", "Automatic confirmation and external calendar integration"],
        ["Administrative content, price, lead, booking, archive, and report management", "Online payments, contracts, and electronic signatures"],
        ["Structured pre-booking records", "Photo proofing, editing, revision tracking, and final file delivery"],
    ],
    [2.65 * inch, 2.6 * inch],
))

story.extend([
    P("Definition of Terms", section_style),
    P("The following terms are defined according to how they are used in this study:", body_style),
    P("<b>Add-on.</b> An optional item or service that may be included in an estimated photography package. An add-on may have a fixed price or a price based on quantity.", definition_style),
    P("<b>Administrative Website.</b> The protected part of the system used by authorized studio personnel to review requests, manage schedules, update content and prices, and access reports.", definition_style),
    P("<b>Administrator.</b> The authorized Jonathan Photography user who manages booking requests, calendar entries, website content, pricing, and other protected records.", definition_style),
    P("<b>Availability Calendar.</b> The calendar shown to clients for choosing a preferred date. Dates with active requests or booked work cannot be selected.", definition_style),
    P("<b>Booking Request.</b> Information submitted by a prospective client to ask the studio about a session. It is subject to review and is not yet a final booking.", definition_style),
    P("<b>Booking Status.</b> The current state of a request in the administrative website. The system uses New, Confirmed, and Cancelled for booking requests.", definition_style),
    P("<b>Calendar Entry.</b> A requested, booked, or cancelled schedule record shown in the administrative calendar. It may be linked to a public request or entered manually.", definition_style),
    P("<b>Centralized Database.</b> The shared collection of records used by the public and administrative websites to keep booking, calendar, portfolio, service, pricing, lead, and account information consistent.", definition_style),
    P("<b>Confirmed Booking.</b> A request that the administrator has accepted after the studio and client have discussed the details outside the website.", definition_style),
    P("<b>Data Privacy Consent.</b> The client's agreement that the information entered in the booking form may be processed for the inquiry and related communication.", definition_style),
    P("<b>Email Notification.</b> An automated message sent after a booking request. The client receives a submission confirmation, while the administrator receives the request and estimate details.", definition_style),
    P("<b>Estimator.</b> The public tool that calculates a preliminary package amount from the selected service, coverage, and add-ons.", definition_style),
    P("<b>Estimator Lead.</b> A prospective client who provides a name and email address to receive an estimate but has not necessarily submitted a booking request.", definition_style),
    P("<b>Manual Booking.</b> Booked work entered directly by the administrator after the arrangement was completed outside the website. It may exist without a public booking request.", definition_style),
    P("<b>Portfolio.</b> The organized collection of the studio's previous photography work shown on the public website and maintained through the administrative website.", definition_style),
    P("<b>Preliminary Estimate.</b> The calculated starting amount produced by the estimator. It is provided for planning and remains subject to studio review and discussion.", definition_style),
    P("<b>Public Website.</b> The part of the system available without administrative login, including the portfolio, services, studio information, estimator, booking request, availability, and contact information.", definition_style),
    P("<b>Responsive Design.</b> An interface approach that adjusts layout, text, navigation, and controls to remain usable on phones, tablets, laptops, and larger screens.", definition_style),
    P("<b>Service.</b> A photography or video offering presented by Jonathan Photography and available for use in the portfolio, service list, estimator, or booking request.", definition_style),
    P("References", section_style),
    P("Bannerman, J., Adusei, C., &amp; Obeng, H. (2023). Does record-keeping matter in small businesses? <i>Expert Journal of Business and Management, 11</i>(1), 89-99. https://business.expertjournals.com/23446781-1108/", reference_style),
    P("Malicdem, A. M. (2026). Level of readiness of micro, small, and medium enterprises (MSMEs) in Pangasinan in adopting digital transformation. <i>International Journal of Education, Research, and Innovation Perspectives, 2</i>(6), 1555-1564. https://doi.org/10.5281/zenodo.21002278", reference_style),
])


ChapterDocTemplate(str(WORK)).build(story)

source_reader = PdfReader(str(SOURCE))
chapter_reader = PdfReader(str(WORK))
writer = PdfWriter()

# Preserve the original title and preliminary pages (1-7).
for page in source_reader.pages[:7]:
    writer.add_page(page)

# Replace the original Chapter I (pages 8-20) with the revised chapter.
for page in chapter_reader.pages:
    writer.add_page(page)

# Preserve Chapter II and the remaining original pages (21-27).
for page in source_reader.pages[20:]:
    writer.add_page(page)

writer.add_metadata({
    "/Title": "Photography Capstone - Revised Chapter I",
    "/Author": "Basa, Deodora, Neri, Salango, and Yu",
    "/Subject": "Web-Based Booking and Portfolio Management System for Jonathan Photography",
})

with OUTPUT.open("wb") as stream:
    writer.write(stream)

print(OUTPUT)
print(f"chapter_pages={len(chapter_reader.pages)}")
print(f"final_pages={len(writer.pages)}")
