# Multi-Rate Pricing Calculator: Implementation Plan

## Delivery approach

Work proceeds in ordered sprints. Each sprint must pass its acceptance checks before
the next begins. Deployment is deliberately excluded until the complete application
passes local unit, integration, production-build, and live browser tests against a
Docker PostgreSQL database.

## Execution status

Sprints 0–8 are complete. The final local gate passes lint, strict type checking,
17 calculation/validation tests, a production build, three live Playwright suites,
desktop and mobile journeys, ownership isolation, finalized-record immutability,
and serious/critical axe accessibility checks.

Vercel deployment is the remaining external step. It is currently pending a
Vercel login/token and a managed PostgreSQL `DATABASE_URL`; neither credential is
available in the local environment.

## Product assumptions

- Date-range reports include every document owned by the signed-in user, regardless
  of status, with inclusive start and end dates.
- Fixed discounts that exceed a line subtotal are rejected rather than clamped.
- Percentage discounts and tax rates are between 0% and 100%, inclusive.
- Quantity is a positive integer.
- Money is stored and calculated in integer cents. Percentage rates are stored in
  basis points, where 10% is `1000`.
- Discount and tax amounts are rounded to the nearest cent per line using integer
  half-up rounding. Document totals are sums of the rounded line results.
- Finalizing a document requires at least one valid line item.
- Finalized documents are immutable. Duplication and printable output remain stretch
  goals and will only be considered after the required application is verified.

## Architecture

- **Application:** Next.js App Router with TypeScript
- **UI:** React, Tailwind CSS, custom accessible components
- **Database:** PostgreSQL in Docker locally
- **Data access:** Prisma ORM
- **Authentication:** Email/password with bcrypt password hashes and opaque,
  database-backed sessions stored in secure HTTP-only cookies
- **Validation:** Zod schemas shared by API boundaries and forms where appropriate
- **Testing:** Vitest for calculations and server modules; Playwright for live
  browser journeys
- **Deployment target:** Vercel with managed PostgreSQL after local acceptance

All pricing calculations run in a single server module. API handlers ignore any
client-supplied totals and always derive persisted or returned totals from line
inputs. Ownership is enforced in every data query, not only in the UI.

## Design direction: The Editorial Ledger

The interface should feel like a well-made financial notebook translated into a
modern workspace: warm paper, dark ink, vermilion status marks, tabular numerals,
precise rules, and deliberate asymmetry. It should be calm and trustworthy rather
than resembling a generic analytics dashboard.

- Characterful serif display typography paired with a highly legible sans-serif
  body and a tabular numeric face
- Warm ivory canvas, near-black ink, muted mineral green, and restrained vermilion
- Fine ledger rules, subtle paper grain, date-stamp details, and strong hierarchy
- Dense, useful tables on desktop that become readable stacked records on mobile
- Motion limited to purposeful page reveals, state changes, and row insertion
- No purple gradients, glassmorphism, oversized generic cards, decorative charts,
  or interchangeable SaaS-dashboard patterns

21st.dev is used for targeted reference discovery, especially table behavior and
interaction patterns. Catalog components are not copied blindly; the final visual
system remains custom and specific to document pricing work.

## Sprint 0: Plan and execution framework

### Scope

- Preserve the assignment brief in `docs/`
- Record architecture, assumptions, design direction, sprint dependencies, and
  quality gates
- Confirm Node, npm, Docker, and Docker Compose are available

### Exit criteria

- This implementation plan exists in the repository
- Work is represented as ordered tracked tasks
- Required local tooling is available

## Sprint 1: Application and database foundation

### Scope

- Scaffold Next.js with strict TypeScript, App Router, Tailwind CSS, and ESLint
- Add Prisma, PostgreSQL Docker Compose, environment examples, and migration scripts
- Model users, sessions, documents, and line items with ownership and status indexes
- Establish the application shell, typography, tokens, and responsive page frame

### Exit criteria

- PostgreSQL starts through Docker Compose
- Prisma migration and generation succeed
- Lint, type checking, tests, and a production build can run from package scripts

## Sprint 2: Authentication and authorization

### Scope

- Implement signup, login, logout, password hashing, session creation, expiry, and
  cookie handling
- Add current-user lookup and server authorization helpers
- Build polished authentication screens and protected application routing
- Return specific validation and authentication errors without leaking account data

### Exit criteria

- A user can create an account, sign in, remain signed in, and sign out
- Anonymous users cannot access protected data
- One user cannot read or mutate another user's records

## Sprint 3: Pricing calculation engine

### Scope

- Implement integer-cent and basis-point helpers
- Calculate subtotal, one discount type, discounted amount, tax, and line total
- Aggregate document subtotal, discount, tax, and grand total
- Validate all numeric boundaries and mutually exclusive discount fields

### Exit criteria

- The assignment sample returns `450.00`, `40.00`, `11.50`, and `421.50`
- Unit tests cover no discount/tax, percent discount, fixed discount, tax ordering,
  half-cent rounding, maximum rates, invalid values, and aggregate totals
- No floating-point arithmetic is used for persisted money calculations

## Sprint 4: Documents and lifecycle

### Scope

- Add authenticated REST endpoints for document and line-item CRUD
- Add a transaction-safe finalize endpoint
- Reject every metadata or line mutation after finalization
- Build document list, create flow, editor, computed totals, and finalized read view
- Keep the server authoritative while providing responsive client-side previews

### Exit criteria

- Drafts support complete metadata and line editing
- Totals always match server calculations
- Finalization changes the document to read-only in both API and UI
- Finalized mutation attempts receive a clear conflict response

## Sprint 5: Date-range summary reporting

### Scope

- Add an authenticated report endpoint with inclusive date validation
- Aggregate document count, grand total, total tax, and total discount
- Build a date-range report with clear empty, loading, error, and populated states

### Exit criteria

- Report totals equal the sum of matching owned documents
- Cross-user data is excluded
- Invalid or reversed ranges return specific validation errors

## Sprint 6: Design refinement and accessibility

### Scope

- Complete the Editorial Ledger visual system across all screens
- Refine responsive document tables, forms, status treatments, and monetary hierarchy
- Add keyboard-visible focus, semantic landmarks, accessible labels, error summaries,
  contrast-safe colors, and reduced-motion behavior
- Use 21st.dev selectively for comparison while rejecting generic patterns

### Exit criteria

- Core flows are usable at mobile and desktop widths
- Keyboard navigation and form feedback are clear
- The application has a coherent, distinctive identity with no template-like screens

## Sprint 7: Docker-backed live verification

### Scope

- Start a clean local PostgreSQL instance and apply migrations
- Run calculation and server tests, lint, type checking, and production build
- Run the application locally in production mode
- Execute Playwright journeys for signup, login, draft creation, mixed calculations,
  editing, finalization, immutability, reporting, ownership isolation, and logout

### Exit criteria

- Every automated check passes
- The sample document displays the expected totals in a live browser
- Finalized records remain unchanged after attempted API and UI edits
- No blocking browser console or server errors remain

## Sprint 8: Documentation and deployment readiness

### Scope

- Write prerequisites and exact local setup steps
- Document calculations, rounding, worked sample, lifecycle, assumptions, tradeoffs,
  test commands, and production improvements
- Add Vercel and managed PostgreSQL deployment instructions
- Record deployment as the next phase, not as completed local work

### Exit criteria

- A new developer can run and verify the application from the README
- All assignment deliverables except the live URL are complete
- The repository is ready for a separate Vercel deployment step
