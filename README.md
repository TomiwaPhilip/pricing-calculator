# Folio

Folio is a multi-rate pricing document application. Users can create drafts,
apply fixed or percentage discounts and per-line tax, finalize immutable
documents, and report on totals within an issue-date range.

The application is built with Next.js, TypeScript, PostgreSQL, Prisma, Zod,
Vitest, and Playwright.

## Features

- Email and password authentication with bcrypt password hashes
- Opaque, database-backed sessions in HTTP-only cookies
- User-scoped document and line-item REST APIs
- Draft document and line-item CRUD
- Fixed or percentage discount per line
- Tax calculated after discount
- Server-authoritative line and document totals
- API-enforced immutable finalized documents
- Finalized-document duplication into a new editable draft
- Authenticated, print-optimized document views
- Inclusive date-range summary reports
- Accessible completion notifications and active navigation states
- Responsive Editorial Ledger interface
- Automated calculation, browser, mobile, ownership, and accessibility tests

## Prerequisites

- Node.js 22 or newer
- npm 10 or newer
- Docker with Docker Compose

## Local setup

1. Install dependencies.

   ```bash
   npm install
   ```

2. Create the local environment file.

   ```bash
   cp .env.example .env
   ```

3. Start PostgreSQL.

   ```bash
   docker compose up -d
   ```

4. Apply the database migration and generate Prisma Client.

   ```bash
   npm run db:deploy
   npm run db:generate
   ```

5. Start the development server.

   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000).

To stop the local database:

```bash
docker compose down
```

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Create a production build |
| `npm run start` | Run the production build |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run strict TypeScript checks |
| `npm test` | Run Vitest calculation tests |
| `npm run test:e2e` | Run live Playwright browser tests |
| `npm run db:migrate` | Create/apply a development migration |
| `npm run db:deploy` | Apply committed migrations |
| `npm run db:reset` | Reset the local database |
| `npm run db:studio` | Open Prisma Studio |

Playwright requires a local Chromium installation on a new machine:

```bash
npx playwright install chromium
```

The browser suite expects PostgreSQL to be running and starts the built
application on port `3100`.

## Calculation and rounding policy

Money is represented as integer cents. Percentages are represented as basis
points: `10%` is stored as `1000`, and `5%` as `500`. Persisted pricing logic
does not use binary floating-point currency values.

Each line is calculated in this order:

1. `subtotal = quantity × unit price`
2. Apply either a fixed discount or a percentage discount
3. Calculate tax on the discounted amount
4. `line total = discounted amount + tax`

Percentage discount amounts and tax amounts are rounded to the nearest cent,
half up, on each line. Document totals are sums of those rounded line results.
The client can preview figures, but every API response recalculates totals on
the server and ignores client-supplied totals.

### Worked example

| Line | Subtotal | Discount | Tax | Total |
| --- | ---: | ---: | ---: | ---: |
| 2 × Widget A at $100, 10% discount, 5% tax | $200.00 | $20.00 | $9.00 | $189.00 |
| 1 × Widget B at $50, 5% tax | $50.00 | $0.00 | $2.50 | $52.50 |
| 1 × Service fee at $200, $20 fixed discount | $200.00 | $20.00 | $0.00 | $180.00 |

The document subtotal is **$450.00**, total discount is **$40.00**, total tax
is **$11.50**, and grand total is **$421.50**.

## Validation rules

- Quantity must be a positive whole number.
- Unit price cannot be negative.
- Discount and tax percentages must be between 0% and 100%.
- A line can have a fixed discount or a percentage discount, never both.
- A fixed discount that exceeds the line subtotal is rejected, not clamped.
- A document requires a title, customer, and valid issue date.
- Finalization requires at least one valid line item.
- API errors return specific messages and appropriate status codes.

## Finalization and immutability

Draft documents support metadata and line-item creation, editing, and deletion.
Finalization is an explicit, transaction-safe API operation.

After finalization:

- Metadata and amounts cannot be edited.
- Lines cannot be added, edited, or removed.
- The document cannot be deleted.
- Mutation attempts are rejected by the API with `409 Conflict`.
- The document may be duplicated into a separate draft; the finalized source
  remains unchanged.

The UI reflects this state, but the API and database queries are the enforcement
boundary. Drafts cannot be duplicated because they are already editable.

## Stretch goals

All assignment stretch goals are implemented:

- **Duplicate:** a finalized document can be copied, including every line and
  pricing rule, into a new draft owned by the same user.
- **Finalize validation:** finalization requires at least one valid line. Invalid
  quantities, negative prices, excessive discounts, and out-of-range rates are
  rejected with a specific API error before data can be persisted.
- **Printable view:** every owned draft or finalized document has an
  authenticated HTML print view with print-specific styling and a browser print
  action.

## Reporting

Reports include every document owned by the signed-in user whose issue date is
within the selected range. Start and end dates are inclusive. Draft and
finalized documents are both included because the assignment does not limit the
report by status.

The report returns:

- Number of documents
- Sum of grand totals
- Sum of tax
- Sum of discounts

## REST API

| Method | Route | Purpose |
| --- | --- | --- |
| `POST` | `/api/auth/signup` | Create an account and session |
| `POST` | `/api/auth/login` | Create a session |
| `POST` | `/api/auth/logout` | Delete the current session |
| `GET`, `POST` | `/api/documents` | List or create documents |
| `GET`, `PATCH`, `DELETE` | `/api/documents/:id` | Read or mutate a draft |
| `POST` | `/api/documents/:id/lines` | Add a line |
| `PATCH`, `DELETE` | `/api/documents/:id/lines/:lineId` | Mutate a draft line |
| `POST` | `/api/documents/:id/finalize` | Finalize a draft |
| `POST` | `/api/documents/:id/duplicate` | Copy a finalized document to a draft |
| `GET` | `/documents/:id/print` | Open the authenticated printable HTML view |
| `GET` | `/api/reports/summary?from=YYYY-MM-DD&to=YYYY-MM-DD` | Build a summary report |

Every protected query includes the current user ID. Resources belonging to a
different user are returned as not found.

## Testing

The calculation suite covers the supplied sample, discount types, tax ordering,
half-cent rounding, full discounts, invalid percentages, excessive fixed
discounts, and money parsing.

The live Playwright suite uses the Docker database and production Next.js build
to verify:

- Signup, logout, and login
- Draft creation and all three sample lines
- Exact `$421.50` sample total
- Finalization and rejected post-finalization API edits
- Specific invalid-line and invalid-finalize API errors
- Finalized-document duplication and draft-only duplicate rejection
- Authenticated printable document output
- Inclusive reporting
- Active navigation state and action-completion notifications
- Cross-user UI and API isolation
- Mobile authentication and navigation
- Serious and critical axe accessibility violations

Run the complete local gate:

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
```

## Assumptions and tradeoffs

- USD is the display currency because the assignment sample uses dollars.
- Quantity is intentionally restricted to whole numbers.
- Reports include drafts and finalized documents.
- Totals are derived on read rather than duplicated in database columns. This
  avoids stale totals and keeps the calculation module authoritative.
- Database-backed sessions make revocation straightforward but require periodic
  expired-session cleanup in a production environment.
- The application uses direct Prisma queries rather than a service layer where
  the use case remains small and explicit.

## Before production

- Add email verification, password reset, rate limiting, and breached-password
  checks.
- Add CSRF origin checks for deployments that accept cross-origin traffic.
- Add scheduled expired-session cleanup and session/device management.
- Add audit events for finalization and other sensitive mutations.
- Add pagination and database-level reporting projections for large datasets.
- Add currency selection and locale-aware formatting.
- Add observability, backups, retention policy, and disaster recovery.
- Add branded PDF generation and email delivery alongside the HTML print view.

## Vercel deployment

Deployment follows the local verification gate.

1. Provision a managed PostgreSQL database.
2. Set `DATABASE_URL` in Vercel for Production, Preview, and Development as
   appropriate.
3. Apply committed migrations to the managed database:

   ```bash
   DATABASE_URL="<managed-database-url>" npm run db:deploy
   ```

4. Import this repository into Vercel and keep the standard `npm run build`
   build command.
5. Run the production smoke journey against the deployed URL before publishing
   it as the assignment submission.

**Live URL:** Pending Vercel deployment.

## Planning documents

- [Assignment brief](docs/multi-rate-pricing-calculator.md)
- [Sprint implementation plan](docs/implementation-plan.md)
