# QuoteCube

> Internal sales tool for eTechCube — build, price and export professional quotes for the Logistics Cube platform.

---

## What is QuoteCube?

QuoteCube is a full-stack quote management platform built for the eTechCube sales team.
A sales rep can configure a complete Logistics Cube deployment for any prospective customer —
selecting software modules, cloud server, API integrations and professional services —
and generate a branded PDF or Excel quote in minutes.

All pricing is managed by admins from within the app. No code changes needed to update a price.

---

## Status

🚧 **v2 — Under active development**

This is a complete rebuild of the internal pricing tool with proper 3-tier architecture.
The v1 app remains live at the original Vercel URL during development.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite 5 |
| Backend | Node.js + Express (Railway.app) |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (email + password) |
| PDF Generation | Puppeteer (server-side) |
| Excel Export | SheetJS |
| Email | Resend API |
| Hosting | Vercel (frontend) + Railway (backend) |

---

## Architecture

```
Browser (React + Vite)
        ↓ REST API calls
Node.js Backend (Railway)       ← pricing engine, PDF gen, email
        ↓ SQL queries
Supabase PostgreSQL              ← all data, auth, RLS policies
```

**Key principle:** The frontend is a thin client. It fetches all data from the backend
and never calculates totals. All pricing logic and grand total calculations run
server-side and are tamper-proof.

---

## Features

- 🔐 **Login** — each sales rep has their own account (admin or sales role)
- 📦 **110+ Modules** — toggle individual software modules across 12 sections
- 🖥️ **Server & Infra** — 6 cloud providers × 6 packages with live pricing
- 🔌 **API Integrations** — real pricing engine handling 3 different billing models
- 💻 **Professional Services** — custom dev, implementation and training
- 📊 **Live Grand Total** — calculated server-side on every change
- 📄 **PDF Export** — server-generated branded A4 quote with eTechCube logo
- 📊 **Excel Export** — 4-sheet workbook for detailed breakdown
- 💾 **Quote History** — save, load, edit and resend past quotes
- 🛡️ **Admin Panel** — manage all pricing without touching code
- 📧 **Email** — send quotes directly to customers from the app

---

## API Pricing Models

QuoteCube handles three distinct real-world pricing models:

| Model | Example | Logic |
|-------|---------|-------|
| Annual volume plan | IRIS E-Way Bill | Auto-select MICRO/MINI/REGULAR/PREMIUM plan based on monthly orders |
| Subscription + overage | IRIS Vehicle Verification | Annual fee includes N hits, per-hit rate beyond that |
| Pure pay-per-hit | Ongrid | No subscription, flat per-call rate |

For APIs available from multiple providers, QuoteCube calculates and displays the break-even point.

---

## Database Schema

13 tables across 3 zones:

**Catalogue** (admin-managed) — `module_sections`, `modules`, `api_categories`, `api_services`, `api_provider_plans`

**Configuration** (per deployment) — `server_providers`, `server_packages`, `volume_tiers`, `global_settings`, `professional_roles`

**Transactional** — `quotes`, `quote_line_items`, `quote_events`

Full schema: see `DATABASE_SCHEMA.sql`

---

## Local Development

```bash
# 1. Clone
git clone https://github.com/vsgithubrepo/QuoteCube.git
cd QuoteCube

# 2. Install frontend dependencies
npm install

# 3. Install backend dependencies
cd server && npm install && cd ..

# 4. Set up environment
cp .env.example .env
# Fill in your Supabase and Railway credentials

# 5. Run database migrations
# Go to Supabase → SQL Editor → paste DATABASE_SCHEMA.sql → Run

# 6. Start frontend
npm run dev

# 7. Start backend (separate terminal)
cd server && npm run dev
```

---

## Deployment

**Frontend → Vercel**
```bash
git push   # auto-deploys via GitHub integration
```

**Backend → Railway**
```bash
cd server
railway up
```

**Environment variables** — set in Vercel and Railway dashboards, never in code.

---

## User Roles

| Role | Permissions |
|------|------------|
| `admin` | Full access — edit pricing, view all quotes, access admin panel |
| `sales` | Create quotes, view own quote history only |

---

## Project Structure

```
QuoteCube/
├── DATABASE_SCHEMA.sql     ← Run once in Supabase SQL Editor
├── .env.example            ← Copy to .env and fill in credentials
├── .gitignore
├── package.json            ← Frontend (React + Vite)
├── vite.config.js
├── index.html
├── public/
│   └── etechcube-logo.jpg
├── src/                    ← React frontend (thin client)
│   ├── App.jsx
│   ├── pages/
│   ├── components/
│   ├── hooks/
│   └── utils/
└── server/                 ← Node.js backend
    ├── package.json
    ├── index.js            ← Express app entry point
    ├── routes/             ← API endpoints
    ├── engine/             ← Pricing calculation engine
    ├── services/           ← PDF, email, Supabase client
    └── middleware/         ← Auth, validation, error handling
```

---

## Related

- **v1 (live, do not modify):** https://logistic-cube-pricing-website-git-main-vsgithubrepos-projects.vercel.app
- **v1 GitHub:** https://github.com/vsgithubrepo/LogisticCubePricingWebsite
- **Supabase dashboard:** https://supabase.com/dashboard/project/vlaguonommcycwjdclgq (v1)

---

*eTechCube LLP · www.etechcube.com · Confidential Internal Tool*
