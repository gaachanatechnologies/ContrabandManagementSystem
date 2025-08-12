# Contraband Management System (CMS)

A full‑stack system for managing contraband and evidence workflows for the Ethiopian Federal Police. It includes a modern Next.js frontend and a Spring Boot backend with JWT authentication, role-aware endpoints, and H2 (in-memory) persistence. SQL scripts are provided for a PostgreSQL/Supabase schema.

---

## Monorepo Structure

- `contraband/`: Next.js 15 (App Router, TypeScript, Tailwind v4) web app
- `backend/cms-service/`: Spring Boot 3.3 REST API service (Java 17, Maven)

---

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS 4, Radix UI + shadcn/ui, Lucide icons
- **Auth (frontend)**: Form-based login flows; token stored as a `token` cookie
- **Backend**: Spring Boot 3.3, Spring Security (JWT), Spring Data JPA, H2 DB
- **Persistence**: H2 in-memory (dev). SQL scripts included for PostgreSQL/Supabase
- **Build tooling**: pnpm (frontend), Maven (backend)

---

## Quick Start

Prerequisites:
- Node.js 20+
- pnpm (`npm i -g pnpm`)
- Java 17+
- Maven 3.9+

### 1) Start the backend API

```bash
cd backend/cms-service
mvn spring-boot:run
```

- Base URL: `http://localhost:8080/api`
- Health: `GET http://localhost:8080/api/health`
- H2 console: `http://localhost:8080/api/h2-console` (if exposed by reverse proxy; otherwise not publicly routed)

The backend starts with an in-memory H2 database and auto-creates tables. See `application.yml` for settings.

### 2) Start the frontend app

```bash
cd contraband
pnpm install
pnpm dev
```

- App URL: `http://localhost:3000`
- Configure the API base via env var `NEXT_PUBLIC_API_URL` (defaults to `http://localhost:8080/api`). Example:

```bash
NEXT_PUBLIC_API_URL=http://localhost:8080/api pnpm dev
```

---

## Configuration

### Frontend (`contraband`)

- `NEXT_PUBLIC_API_URL`: Base URL for the backend API. Default: `http://localhost:8080/api`
- TypeScript config: `tsconfig.json`
- Next.js config: `next.config.mjs` (builds ignore lint and type errors; images unoptimized)
- Middleware: `middleware.ts` passes through requests and wires in session cookies.

### Backend (`backend/cms-service`)

Key: `src/main/resources/application.yml`

```yaml
server:
  port: 8080
  servlet:
    context-path: /api
spring:
  datasource:
    url: jdbc:h2:mem:cmsdb;DB_CLOSE_DELAY=-1;MODE=PostgreSQL
    driverClassName: org.h2.Driver
    username: sa
    password: ''
  jpa:
    hibernate:
      ddl-auto: update
    defer-datasource-initialization: true
app:
  jwt:
    secret: change-this-secret-in-prod-change-this-secret-in-prod
    issuer: cms-service
    expirationSeconds: 86400
```

Override via environment variables or a different profile as needed for production (PostgreSQL, strong JWT secret, CORS, HTTPS, persistent storage for uploads).

---

## Features

- Authentication (email/password) with JWT
- Role-ready domain for users: `admin`, `supervisor`, `field_officer`, `warehouse_manager`, `auditor`
- Contraband item registration, listing, status updates
- Chain of custody tracking (transfers, with metadata)
- Evidence file uploads and public serving
- Internal messaging between users
- Audit logs for key actions
- Responsive UI with dashboard, forms, lists, and reports

---

## API Overview

Base path: `http://localhost:8080/api`
Most endpoints require `Authorization: Bearer <token>`.

### Auth
- `POST /auth/login` → `{ email, password }` → `{ token, user }`
- `POST /auth/register` → `{ email, password, fullName, role?, badgeNumber?, department?, phone? }`

### Users
- `GET /users` → list users
- `GET /users/me` → current user info
- `PUT /users/{id}` → update selected fields
- `POST /users` → admin create user

### Categories & Contraband
- `GET /categories` → list categories
- `GET /contraband-items` → list contraband items (expanded with category/user snippets)
- `POST /contraband-items` → create an item
- `PUT /contraband-items/{id}/status` → update item status

### Custody
- `GET /custody/{contrabandId}` → chain of custody records
- `POST /custody/transfers` → create transfer record

### Messages
- `GET /messages?userId={id}` → user’s message threads
- `POST /messages` → send a message
- `PATCH /messages/{id}/read` → mark as read

### Files
- `POST /files/upload` (multipart) fields: `file`, `contraband_id`, `description?`, `uploaded_by?`
- `GET /files/{fileName}` → binary file bytes

### Audit
- `GET /audit-logs` → list audit logs

---

## Frontend App Walkthrough

- Login/Sign Up: `app/auth/login`, `app/auth/sign-up` use actions in `lib/actions.ts` to call `/auth/login` and `/auth/register`. On success, a `token` cookie is set for API authorization.
- Home Dashboard: `app/page.tsx` with role switcher (demo), stats, and recent activity.
- Seizure Registration: `components/contraband/seizure-form.tsx` calls:
  - `POST /contraband-items`
  - uploads evidence via `POST /files/upload`
  - creates custody transfer via `POST /custody/transfers`
  - logs audit via `audit-logs` shim
- Contraband List: `components/contraband/contraband-list.tsx`
- Chain of Custody: `components/contraband/chain-of-custody.tsx`
- Messaging: `components/messaging/message-center.tsx`
- Audit Trail: `components/audit/audit-trail.tsx`

The frontend accesses the backend through a lightweight `supabase`-compatible client in `lib/supabase/client.ts` and server helpers in `lib/supabase/server.ts`, both using `NEXT_PUBLIC_API_URL`.

---

## Database

For dev, the backend uses H2 in-memory. For a PostgreSQL/Supabase setup, see the SQL under `contraband/scripts/`:
- `01-create-database-schema.sql`
- `02-insert-initial-data.sql`
- `03-create-rls-policies.sql`

These define tables like `users`, `contraband_items`, `custody_chain`, `evidence_files`, `messages`, and `audit_logs`, plus RLS examples for Supabase.

---

## Environment Variables

- Frontend: `NEXT_PUBLIC_API_URL` (required for non-default API host)
- Backend (suggested):
  - `SERVER_PORT` or `server.port`
  - `SERVER_SERVLET_CONTEXT_PATH` or `server.servlet.context-path`
  - `SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME`, `SPRING_DATASOURCE_PASSWORD`
  - `APP_JWT_SECRET`, `APP_JWT_ISSUER`, `APP_JWT_EXPIRATIONSECONDS`

Use a `.env.local` for the frontend, and profiles or env vars for the backend.

---

## Building & Running

### Frontend
```bash
cd contraband
pnpm build
pnpm start # production
```

### Backend
```bash
cd backend/cms-service
mvn clean package
java -jar target/cms-service-0.0.1-SNAPSHOT.jar
```

---

## CORS & Security

- The backend’s `SecurityConfig` permits `/auth/login`, `/auth/register`, `/files/**`, and `/health` without authentication. All other routes require a valid JWT.
- Configure CORS according to your deployment origins (e.g., Next.js dev at `http://localhost:3000`).
- Replace the default JWT secret in production. Serve over HTTPS and use secure cookies.

---

## File Uploads

- Files are stored on disk under `backend/cms-service/uploads/` (created automatically).
- Public URLs are served by `GET /api/files/{fileName}`.
- Frontend uses a client shim to upload with the contraband ID prefix.

---

## Development Tips

- Frontend ignores lint/type errors during build per `next.config.mjs` to streamline iteration. Fix before production.
- Use the role switcher on the dashboard for demo flows.
- Check `server.log` in the backend for request traces if needed.

---

## Testing Basic Flow (Dev)

1) Start backend and frontend as above.
2) Register a user via UI (`/auth/sign-up`) or `POST /auth/register`.
3) Login via UI (`/auth/login`), then the app sets a `token` cookie.
4) Create a seizure in the Home → Register tab.
5) Upload evidence photos and confirm entries in the contraband list.
6) Open chain of custody for the item and create a transfer.
7) Send a message to another user account.
8) View audit logs.

---

## Deployment

- Frontend: any Node-compatible host (Vercel, Render, etc.). Set `NEXT_PUBLIC_API_URL` to your API.
- Backend: JVM hosts or containers. Provide persistent DB (PostgreSQL), persistent volume for `uploads/`, and strong JWT secrets. Behind a reverse proxy, map API under `/api`.

---

## License

Proprietary. All rights reserved. Replace with your preferred license if needed.