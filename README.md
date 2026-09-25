# Jonathan Photography

A full-stack portfolio, service estimator, and booking-request management system for Jonathan Photography. The application provides a responsive public website for prospective clients and a protected administration dashboard for managing bookings, schedules, portfolio content, services, pricing, contact information, and website copy.

> A submitted booking is a request for review, not an automatically confirmed reservation. Final pricing, availability, and event arrangements are completed through direct communication with the studio.

## Features

### Public website

- Responsive photography portfolio organized by category and shoot
- Photo and video presentation
- Editable service catalogue with starting prices
- Preliminary package estimator with coverage hours and add-ons
- Date-availability checking and structured booking requests
- Event date, start time, location, contact, and privacy-consent collection
- Booking reference and submission confirmation
- Contact links, frequently asked questions, and editable website content
- Persistent music controls and a browser-based photobooth Easter egg

### Administration dashboard

- Secure administrator authentication and profile management
- Dashboard summaries and downloadable reports
- Unified booking-request and saved-estimate management
- Requested, confirmed, cancelled, and manually entered calendar events
- Portfolio category, shoot, image, and video management
- Service and estimator pricing management from shared data
- Coverage-hour and add-on configuration
- Public website content and contact-link management
- Archived records and activity views

## Technology Stack

| Layer | Technology |
| --- | --- |
| Frontend | React 18, React Router, Vite |
| Interface | CSS, Lucide React, Recharts |
| Backend | PHP 8, REST-style JSON endpoints |
| Database | MySQL or MariaDB using PDO |
| Email | PHPMailer with SMTP |
| Local environment | XAMPP with Apache and MySQL |

## Project Structure

```text
jonathan-photography/
├── backend/
│   ├── api/                 # Authentication and resource endpoints
│   ├── config/              # Environment and database configuration
│   ├── email/               # Booking notification email handling
│   ├── helpers/             # Validation, responses, and upload utilities
│   ├── middleware/          # CORS and administrator authorization
│   └── uploads/portfolio/   # Uploaded portfolio media
├── database/
│   ├── migrations/          # Updates for existing installations
│   ├── schema.sql           # Database structure
│   └── seed.sql             # Development and demonstration data
├── frontend/
│   ├── src/admin/           # Administration pages
│   ├── src/components/      # Reusable interface components
│   ├── src/context/         # Authentication, content, music, and toast state
│   ├── src/pages/           # Public pages
│   └── src/services/        # API client
└── README.md
```

## Requirements

- PHP 8.0 or later
- MySQL 8.0+ or MariaDB 10.4+
- Composer
- Node.js 18 or later
- npm
- Apache through XAMPP or another PHP-compatible web server
- SMTP account for production email delivery

## Local Installation

### 1. Clone the repository

Place the project inside the XAMPP `htdocs` directory:

```bash
git clone <repository-url> jonathan-photography
cd jonathan-photography
```

Example Windows location:

```text
C:\xampp\htdocs\jonathan-photography
```

### 2. Start local services

Open the XAMPP Control Panel and start **Apache** and **MySQL**.

### 3. Create the database

Import the schema followed by the optional development seed data:

```bash
mysql -u root -p < database/schema.sql
mysql -u root -p jonathan_photography < database/seed.sql
```

The seed file resets the application tables and must not be imported into a database containing production records.

For an existing installation, review and execute the applicable files in `database/migrations/` instead of recreating the database.

### 4. Configure the backend

```bash
cd backend
copy .env.example .env
composer install
```

On macOS or Linux, use `cp .env.example .env`.

Update `backend/.env` with the local database, application, and SMTP settings:

```dotenv
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=jonathan_photography
DB_USER=root
DB_PASSWORD=

APP_URL=http://localhost/jonathan-photography/backend
FRONTEND_URL=http://localhost:5173
APP_ENV=development
APP_SECRET=replace-with-a-long-random-secret

SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USERNAME=your-smtp-username
SMTP_PASSWORD=your-smtp-password
SMTP_FROM_EMAIL=studio@example.com
SMTP_FROM_NAME="Jonathan Photography"
SMTP_ADMIN_EMAIL=owner@example.com
```

Keep `.env` private. Never commit passwords, application secrets, or production database credentials.

### 5. Configure the frontend

```bash
cd ../frontend
copy .env.example .env
npm install
npm run dev
```

The development server runs at [http://localhost:5173](http://localhost:5173). Vite proxies `/api` requests to the Apache-hosted backend configured in `frontend/vite.config.js`.

If the frontend and backend are deployed separately, configure the production API address:

```dotenv
VITE_API_URL=https://example.com/backend/api
```

Restart the Vite server after changing frontend environment variables.

## Application URLs

| Area | Local URL |
| --- | --- |
| Public website | `http://localhost:5173/` |
| Booking and estimator | `http://localhost:5173/booking` |
| Admin login | `http://localhost:5173/admin/login` |
| API example | `http://localhost/jonathan-photography/backend/api/services/list.php` |

Development seed credentials are documented inside `database/seed.sql`. Change the seeded administrator password immediately and do not use it in production.

## Available Frontend Scripts

Run these commands from `frontend/`:

```bash
npm run dev       # Start the Vite development server
npm run build     # Create a production build in frontend/dist
npm run preview   # Preview the production build locally
```

## Core Workflow

```text
Browse portfolio and services
        ↓
Build a preliminary estimate
        ↓
Select an available date and start time
        ↓
Submit a booking request and receive a reference code
        ↓
Administrator reviews the request and contacts the client
        ↓
Request is confirmed or cancelled and reflected in the calendar
```

Service prices shown publicly and used by the estimator come from the same database records. The backend recalculates submitted estimates from active database prices before saving a request, preventing client-provided totals from becoming authoritative.

## Database

The primary database areas are:

- `admins` for administrator authentication
- `portfolio_categories`, `portfolio_shoots`, and `portfolio_images` for portfolio content
- `services`, `estimator_hours`, and `estimator_addons` for service configuration and estimates
- `estimator_leads` for saved or emailed estimates
- `bookings`, `booking_addons`, and `calendar_events` for booking and schedule management
- `contact_platforms` and `site_settings` for editable public content

The current schema is available in [`database/schema.sql`](database/schema.sql), while changes for previously initialized databases are stored in [`database/migrations`](database/migrations).

## Security

The application includes the following protections:

- PDO prepared statements for database queries
- Password hashing and verification through PHP password APIs
- Protected administrator routes and server-side session checks
- CSRF validation for state-changing administrator operations
- Secure, HTTP-only, same-site session cookies
- Server-side validation and output-safe JSON responses
- MIME and image-dimension validation for uploaded files
- Randomized upload filenames and blocked script execution in upload directories
- Rate limiting and honeypot fields on public submission endpoints
- One-time booking submission tokens to prevent duplicate requests
- Server-side estimate reconstruction using database prices
- Data-privacy consent recording for booking submissions
- Generic client-facing errors with detailed failures kept in server logs

Production deployments should use HTTPS, unique administrator credentials, a strong `APP_SECRET`, restricted database permissions, protected environment files, regular backups, and a properly configured SMTP account.

## Scope and Limitations

This version supports portfolio presentation, preliminary estimation, booking requests, calendar management, and owner-managed website content. It does not provide automatic booking approval, online payment processing, electronic contracts, customer accounts, accounting, or final photo-delivery galleries.

## Troubleshooting

### The API returns 404

Confirm that Apache is running and that the repository is inside the configured `htdocs` directory. Test a complete endpoint such as:

```text
http://localhost/jonathan-photography/backend/api/services/list.php
```

The backend does not provide a landing page at `/backend/`.

### The frontend reports an unexpected server response

Inspect the failed request in the browser Network panel. A PHP error page or incorrect backend path can return HTML instead of the JSON expected by the frontend.

### Authentication expires or an authorized save is rejected

Verify that frontend and backend URLs match the configured origins, browser cookies are enabled, and both requests use the same hostname. Mixing `localhost` and `127.0.0.1` can create separate cookie scopes.

### Booking email is not delivered

Booking data is committed before email delivery is attempted. Confirm the SMTP values, sender identity, provider port, and application password in `backend/.env`, then review the PHP error log.

## Data Privacy

Do not commit database exports containing client names, email addresses, phone numbers, private messages, submission tokens, password hashes, or SMTP credentials. Use anonymized records for demonstrations, testing, screenshots, and academic documentation.

## Contributing

1. Create a feature branch from the current development branch.
2. Keep changes limited to one concern.
3. Test the affected public and administrator workflows.
4. Do not commit generated builds, dependencies, uploaded client files, or environment files.
5. Open a pull request describing the change and how it was verified.

## License

No open-source license has been declared. Unless a license is added by the repository owner, the source code remains all rights reserved and may not be reused or redistributed without permission.
