# Jonathan Photography — Full-Stack Booking & Portfolio Website

A production-ready photography business website: an editorial public site
(portfolio, services, live estimator, booking requests) backed by a real
PHP + MySQL API, plus an Admin Dashboard that drives every piece of content.

```
React (Vite)  →  PHP REST API (PDO)  →  MySQL
```

Nothing on the public site is hardcoded — categories, shoots, photos,
services, estimator pricing, and contact links are all stored in the
database and managed from `/admin`.

---

## 0. Quick start (XAMPP on Windows) — the whole thing, in order

This is the exact sequence to go from a fresh clone to a working site on
XAMPP. Do the steps **in order** — most setup problems come from skipping
ahead (starting the frontend before `.env` is filled in, opening the site
before Apache/MySQL are running, etc).

**You'll end up running three things at once:** XAMPP (Apache + MySQL),
the PHP backend (served by Apache, not `php -S`), and the Vite frontend.

### Step 1 — Start XAMPP

Open the XAMPP Control Panel and click **Start** next to both:

- **Apache**
- **MySQL**

Both rows should turn green. Leave the Control Panel open.

### Step 2 — Put the project where Apache can see it

Clone or copy the project into your `htdocs` folder, so the path looks
like:

```
C:\xampp1\htdocs\jonathan-photography\
```

(If your XAMPP is installed elsewhere, use that install's `htdocs`
instead — the folder name `jonathan-photography` is what matters, since
it becomes part of the URL in the next steps.)

### Step 3 — Create the database

Open phpMyAdmin (`http://localhost/phpmyadmin`) or a terminal:

```bash
mysql -u root -p -e "CREATE DATABASE jonathan_photography"
mysql -u root -p jonathan_photography < database/schema.sql
mysql -u root -p jonathan_photography < database/seed.sql
```

(On a stock XAMPP install, the root MySQL user usually has **no
password** — just press Enter at the password prompt, or omit `-p`
entirely.)

This creates one admin account:

```
username: admin
password: admin123
```

Change this password as soon as you're able to log in (see Step 8).

### Step 4 — Configure the backend

```bash
cd C:\xampp1\htdocs\jonathan-photography\backend
copy .env.example .env
notepad .env
```

For a stock local XAMPP setup, these values are usually correct as-is:

```
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=jonathan_photography
DB_USER=root
DB_PASSWORD=

APP_URL=http://localhost/jonathan-photography/backend
FRONTEND_URL=http://localhost:5173
APP_ENV=development

APP_SECRET=change-this-to-a-long-random-string
```

Leave `SMTP_USERNAME` / `SMTP_PASSWORD` blank for now — the app works
fully without them (bookings still save; email sending is just skipped
and logged instead). Come back and fill those in once everything else
works — see Step 9.

**Note on `APP_URL`:** earlier drafts of this README suggested running
the backend with `php -S localhost:8000`. That works, but since the
project already lives inside `htdocs`, it's simpler to let **Apache**
serve it directly and skip the second PHP process entirely. That's what
the rest of these steps assume.

### Step 5 — Install backend dependencies

```bash
composer install
```

This pulls in PHPMailer and generates `vendor/`.

### Step 6 — Confirm the backend is reachable

With Apache running, open:

```
http://localhost/jonathan-photography/backend/api/portfolio/categories.php
```

You should see JSON like `{"success":true,"data":[...]}`. If you get a
404 or a blank page, Apache isn't serving the folder — double-check the
project actually sits inside `htdocs` and the folder name matches the URL.

Visiting `http://localhost/jonathan-photography/backend/` itself (no
`/api/...`) will 404 — that's expected, there's no landing page there,
only individual endpoint files under `api/`.

### Step 7 — Configure and start the frontend

```bash
cd C:\xampp1\htdocs\jonathan-photography\frontend
copy .env.example .env
notepad .env
```

Set:

```
VITE_BACKEND_URL=http://localhost/jonathan-photography/backend
```

This tells the frontend where to load **uploaded images** from. It's
separate from the API calls below on purpose — API requests go through
Vite's dev proxy (see `vite.config.js`), but images are loaded directly
from the backend's own address, and the proxy alone isn't enough to
resolve those.

Then:

```bash
npm install
npm run dev
```

Open the URL it prints — normally `http://localhost:5173`.

### Step 8 — Log in and change the default password

Go to `http://localhost:5173/admin/login` and sign in with
`admin` / `admin123`. Change the password immediately from the admin
settings screen (or generate a new hash yourself and update the
`admins` table directly):

```bash
php -r "echo password_hash('your-new-password', PASSWORD_DEFAULT);"
```

### Step 9 — (Optional, for real emails) Configure SMTP

In `backend/.env`, fill in:

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-real-address@gmail.com
SMTP_PASSWORD=your-16-character-app-password
SMTP_FROM_EMAIL=studio@jonathanphotography.com
SMTP_FROM_NAME="Jonathan Photography"
SMTP_ADMIN_EMAIL=studio@jonathanphotography.com
```

Gmail requires an **app password** (not your normal login password) —
generate one from your Google Account's Security settings once
2-Step Verification is turned on. No backend restart is needed since
Apache reads `.env` fresh on every request; just try submitting a
booking again.

### Everyday startup (once the above is done once)

Every time you come back to work on this:

1. Open XAMPP Control Panel → start **Apache** and **MySQL**.
2. `cd frontend && npm run dev`
3. Visit `http://localhost:5173`

That's it — the backend doesn't need a separate "start" step once it's
sitting inside `htdocs`; Apache serves it automatically whenever it's
running.

---

## 1. Project structure

```
jonathan-photography/
├── frontend/            React + Vite public site and admin dashboard
│   └── src/
│       ├── admin/        Admin screens (login, dashboard, managers)
│       ├── components/   Shared public-site components
│       ├── context/       Toast + admin-auth React contexts
│       ├── hooks/         useEstimator (live pricing logic)
│       ├── layouts/       PublicLayout (navbar + footer wrapper)
│       ├── pages/         Public routes (Home, Portfolio, Booking, …)
│       ├── services/api.js  Central fetch client for the PHP API
│       ├── utils/format.js  peso/date formatting + imageUrl() helper
│       └── styles/        Design tokens + public/admin stylesheets
│
├── backend/              PHP 8 REST API
│   ├── api/               One folder per resource (auth, portfolio, …)
│   ├── config/             .env loader, app config, PDO connection
│   ├── middleware/         CORS, session/auth/CSRF guards
│   ├── helpers/             JSON responses, validation, secure uploads
│   ├── email/mailer.php     PHPMailer wrapper + email templates
│   ├── uploads/portfolio/  Where uploaded images are stored
│   └── .env.example
│
└── database/
    ├── schema.sql          Full normalized schema
    └── seed.sql             Demo admin + sample content
```

---

## 2. Prerequisites

- PHP 8.0+
- MySQL 8+ (or MariaDB 10.4+) — XAMPP bundles both
- Composer
- Node.js 18+
- An SMTP account (Gmail app password, SendGrid, Mailgun, etc.) — optional
  for local dev, required for real emails.

---

## 3. Database setup

See Step 3 above for the XAMPP-specific version. In general:

```bash
mysql -u root -p -e "CREATE DATABASE jonathan_photography"
mysql -u root -p jonathan_photography < database/schema.sql
mysql -u root -p jonathan_photography < database/seed.sql
```

`seed.sql` is safe to re-run any time — it fully clears and re-inserts
its own demo data in dependency-safe order, so it never produces
duplicates and never needs to disable foreign key checks.

---

## 4. Backend setup

```bash
cd backend
cp .env.example .env
# edit .env with your real DB + SMTP credentials
composer install
```

**Recommended (matches the Quick Start above): let Apache serve it.**
Put the project inside `htdocs` and the backend is reachable at
`http://localhost/jonathan-photography/backend/api/...` as soon as
Apache is running — no extra command needed.

**Alternative: PHP's built-in server.**

```bash
php -S localhost:8000
```

This also works, but two things change if you use it instead of Apache:

- The API is now at `http://localhost:8000/api/...` — update `APP_URL`
  in `backend/.env` and `VITE_BACKEND_URL` in `frontend/.env` to match.
- `GET /` (no path) will still 404 either way — there's no root
  route, only files under `api/`. That's expected, not a sign
  anything is broken.

**Uploads:** `backend/uploads/portfolio/` must be writable by the web
server (`chmod 755` is usually enough; XAMPP on Windows doesn't need
this). The included `.htaccess` blocks any script execution inside it —
keep that file if you deploy on Apache; on nginx, add the equivalent
`location` block noted inside that file.

**Email:** if `SMTP_HOST` / `SMTP_USERNAME` are left blank in `.env`, the
app still works end-to-end — bookings are still saved — but email sending
is skipped and logged instead of failing the request.

### Deploying on Apache / Nginx instead of `php -S`

Point your web server's document root at `backend/`, make sure `.php`
files are executed normally, and that `backend/uploads/` still has PHP
execution disabled (see the `.htaccess` there). Update `APP_URL` and
`FRONTEND_URL` in `.env` to your real domains.

---

## 5. Frontend setup

```bash
cd frontend
cp .env.example .env
# set VITE_BACKEND_URL to wherever the backend is actually served from
npm install
npm run dev
```

Visit `http://localhost:5173`. In development, Vite proxies `/api/*`
straight to the backend (see `vite.config.js`), so API calls don't hit
CORS issues. `VITE_BACKEND_URL` is separate from that proxy and is used
specifically for building `<img>` URLs for uploaded photos — see
`src/utils/format.js`'s `imageUrl()` function. If uploaded images show a
broken-image icon, this is the first thing to check: confirm
`VITE_BACKEND_URL` is set and that you restarted `npm run dev` after
changing `.env` (Vite only reads it on startup).

For a production build:

```bash
npm run build
```

This outputs static files to `frontend/dist/` — deploy them to any static
host or the same server as the backend. If the frontend and backend are on
different domains in production, set `VITE_API_URL` to the backend's full
`/api` URL, and set `FRONTEND_URL` in the backend's `.env` to match your
frontend's origin (required for CORS + cookies).

---

## 6. Using the app

- Public site: `/`, `/portfolio`, `/services`, `/estimator`, `/booking`, `/contact`
- Admin dashboard: `/admin/login` → `/admin/dashboard`

From the Admin Dashboard you can:

- Manage portfolio categories, shoots, and upload unlimited photos per shoot
- Add/edit/delete services and toggle their visibility
- Edit estimator coverage-hour options and add-ons (prices, active state)
- Review and update booking request statuses (New → Contacted → Confirmed/Declined)
- See estimator leads and whether they've since booked
- Manage which contact platforms appear on the public Contact page

Every one of those changes reflects on the public site immediately — there
is no separate hardcoded content anywhere in the React app.

---

## 7. Security notes

- All queries use PDO prepared statements — no string-built SQL anywhere.
  (Watch out for reusing the same named placeholder twice in one query,
  e.g. `WHERE username = :u OR email = :u` — PDO can throw
  `SQLSTATE[HY093]: Invalid parameter number` on that pattern depending
  on driver settings. Use two distinct placeholders bound to the same
  value instead.)
- Passwords are hashed with `password_hash()` / verified with `password_verify()`.
- Admin sessions use PHP's native session handling with `httponly`,
  `samesite=Lax`, and (in production, behind HTTPS) `secure` cookies.
- Every state-changing admin request must include a CSRF token issued by
  `/api/auth/check.php` after login.
- Uploaded images are validated by real MIME sniffing (`finfo`) and
  `getimagesize()`, never by file extension or the client's declared
  Content-Type, and are saved under randomized filenames — the original
  filename is discarded.
- The uploads folder disables script execution via `.htaccess`.
- Public form endpoints (`bookings/create.php`, `estimator/leads.php`) use
  a lightweight file-based rate limiter plus a honeypot field to blunt
  naive spam/bots.
- Server errors are logged with `error_log()` and never leaked to the
  client — the client always gets a friendly, generic message.

For real production use, also put the app behind HTTPS, and consider
swapping the file-based rate limiter for Redis if you expect real traffic.

---

## 8. Troubleshooting

**`GET /` on the backend returns 404.**
Expected — there's no root route, only files under `backend/api/`. Test
a real endpoint instead, e.g. `.../api/portfolio/categories.php`.

**Admin login fails with a blank/500 response, and the PHP terminal shows
`SQLSTATE[HY093]: Invalid parameter number`.**
A prepared statement is reusing one named placeholder twice (see the
note in Security notes above). Give each occurrence its own placeholder
name, bound to the same PHP value.

**Uploaded photos show a broken-image icon in the admin panel, even
though the file exists on disk and opens fine when you paste the file's
direct backend URL into the browser.**
The React code is building the wrong `<img src>` — usually because
`VITE_BACKEND_URL` isn't set, or the frontend wasn't restarted after
setting it. Check `frontend/src/utils/format.js`'s `imageUrl()` function
and confirm `frontend/.env` has `VITE_BACKEND_URL` pointing at the
backend's real address (e.g.
`http://localhost/jonathan-photography/backend`), then fully stop and
restart `npm run dev`.

**Login/API calls fail with a CORS error in the browser console.**
Confirm `FRONTEND_URL` in `backend/.env` exactly matches the URL your
frontend is actually running on (protocol, host, and port), and that
`backend/middleware/cors.php` is reading it correctly.

**"The server returned an unexpected response" in the frontend.**
This means the API didn't return valid JSON — usually a raw PHP fatal
error/HTML page instead. Open the Network tab, find the failing request,
and read its raw Response body (not just the frontend's generic error)
to see the actual PHP error underneath.

---

## 9. Notes on a few implementation choices

- **Estimator admin endpoints**: the spec's API list mentions
  `/api/estimator/config.php` and `/api/estimator/leads.php`. Managing
  coverage-hour and add-on options needed real CRUD, so two small sibling
  endpoints were added: `/api/estimator/hours.php` and
  `/api/estimator/addons.php` (both admin-only). `config.php` remains the
  single public read endpoint the estimator page actually calls.
- **`create_lead.php`**: folded into `POST /api/estimator/leads.php`
  instead of a separate file, since `leads.php` already handles both the
  admin `GET` (list) and the public `POST` (create) — keeping the two
  together avoids duplicating validation logic.
- **`booked` status on estimator leads**: computed live via a `SELECT
  EXISTS(...)` join against `bookings.email` (shown as `booked_live` in
  the API response), rather than trusting only the stored `booked` column,
  so it's always accurate even if a booking was placed independently. The
  column is still updated at booking time for fast filtering if you build
  on this later.

---

## 10. What's intentionally not included (per spec)

Client accounts, payment/deposit handling, e-signatures, proofing
galleries, and multi-stage production tracking are out of scope for this
version. The workflow stops at:

```
Discover → Portfolio → Estimate → Booking Request → Admin Review
```