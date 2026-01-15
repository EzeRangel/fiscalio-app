# Tech Stack: FDI Assistant

## Core Frontend & Framework
- **Next.js (App Router):** The primary web framework for building the application structure and routing.
- **React:** For building interactive UI components.
- **TypeScript:** Ensuring type safety and better developer experience.

## Styling & UI Components
- **Tailwind CSS:** For utility-first styling.
- **Shadcn/UI:** For high-quality, accessible, and customizable UI components.
- **Lucide React:** For consistent iconography.

## Data & Persistence
- **PGLite:** An offline-first, local PostgreSQL database that runs entirely in the browser/client.
- **Drizzle ORM:** For type-safe database access and migrations.
- **TanStack Query (React Query):** For efficient client-side data fetching and state management.

## Validation & Forms
- **Zod:** For schema validation (DB, API, and Forms).
- **React Hook Form:** For efficient form state management.
- **next-safe-action:** For type-safe server actions.

## Utilities & Specialized Libraries
- **@nodecfdi/cfdi-*:** Libraries for parsing, validating, and handling Mexican CFDI (invoices).
- **Date-fns:** For consistent date manipulation.
- **AuditService:** Custom internal utility for type-safe audit logging and diff calculation.
- **js-cookie:** For client-side cookie management.

## Testing & Quality Assurance
- **Jest & React Testing Library:** For unit and integration testing.
- **ESLint & Prettier:** For code linting and formatting.

## Package Management
- **pnpm:** For fast and efficient dependency management.
