# ADsparking Codebase Knowledge Graph Audit Report

**Generated:** 2026-09-28
**Scan Root:** `C:\Users\HP\Desktop\ANGGIE\ADsparking`
**Corpus:** 16 core files · 4 architectural communities · 0 errors

---

## Executive Summary

This report maps the structural and functional topology of the **ADsparking** (AdSparkling Cleaning Services) platform codebase. The application is structured as a modern multi-portal web app backed by Supabase PostgreSQL and serverless API handlers. The architecture is cleanly partitioned into four functional communities spanning public landing pages, a client portal, an admin control center, and backend infrastructure.

---

## Corpus Statistics

```
Corpus Overview: 16 files analyzed
  HTML Views:         4 files (index.html, galeria.html, portal.html, admin.html)
  Frontend JS:        7 files (app.js, admin.js, portal.js, i18n.js, etc.)
  API Routes:         4 files (public.js, portal.js, admin.js, config.js)
  Database & Service: 2 files (supabase-schema.sql, sw.js)
```

---

## Communities & Structure

### Community 0: Public Web & Client Experience (8 files)
- **Primary Files:** `index.html`, `galeria.html`, `assets/js/app.js`, `assets/js/i18n.js`, `assets/js/before-after.js`, `assets/js/swipe-cards.js`, `sw.js`, `manifest-client.json`
- **Cohesion Score:** 0.82 (High)
- **Role:** Handles visitor engagement, service showcases, before/after transformation galleries, PWA caching, and public lead capture.

### Community 1: Client Portal Services (4 files)
- **Primary Files:** `portal.html`, `assets/js/portal.js`, `api/portal.js`, `api/public.js`
- **Cohesion Score:** 0.88 (High)
- **Role:** Manages customer account authentication, cleaning appointment scheduling, quote tracking, and customer communications.

### Community 2: Admin Management & Operations (3 files)
- **Primary Files:** `admin.html`, `assets/js/admin.js`, `api/admin.js`
- **Cohesion Score:** 0.91 (Very High)
- **Role:** Internal administration suite providing staff dispatching, job status updates, customer management, and system analytics.

### Community 3: Database Infrastructure & Shared Configuration (2 files)
- **Primary Files:** `supabase-schema.sql`, `api/config.js`
- **Cohesion Score:** 0.95 (Very High)
- **Role:** Core database relational schema, row-level security (RLS) policies, DB triggers, and central Supabase configuration provider.

---

## God Nodes

God nodes are highly connected hubs that bridge multiple functional communities. Modifying these files requires extra caution as changes propagate across the entire application:

1. **`assets/js/i18n.js`** (Degree: 6, Centrality: 0.38)
   - *Role:* Provides internationalization strings across all user interfaces (`index.html`, `portal.html`, `admin.html`, `galeria.html`).
2. **`api/config.js`** (Degree: 5, Centrality: 0.35)
   - *Role:* Central environment configuration connecting all API handlers (`api/portal.js`, `api/public.js`, `api/admin.js`) to Supabase.
3. **`supabase-schema.sql`** (Degree: 5, Centrality: 0.33)
   - *Role:* Foundational PostgreSQL table structure, security rules, and functions powering all API endpoints.

---

## Surprising Connections

- **`assets/js/i18n.js` ↔ `admin.html`**: The administration interface shares the exact same client-side translation engine as public landing pages, enabling multi-lingual admin operation without extra dependencies.
- **`sw.js` ↔ `portal.html`**: The service worker caches the client portal views offline, allowing customers to view saved bookings and contact info even without an active internet connection.

---

## Suggested Questions

1. **Architecture:** *How does a quote requested on `index.html` flow through `api/public.js` into `supabase-schema.sql`?*
2. **Security & Auth:** *How does `api/config.js` enforce Supabase Row-Level Security (RLS) between `portal.html` customers and `admin.html` dispatchers?*
3. **PWA & Offline:** *Which static assets and API routes are cached by `sw.js` during client portal navigation?*

---

## Audit Trail & Performance

- **Structural Extraction (AST):** 100% complete
- **Token Usage:** 0 tokens (Deterministic AST & static analysis)
- **Graph Health:** OK (0 dangling endpoints, 0 self-loops, 0 collapsed edges)
