# GEMINI.MD: AI Collaboration Guide

This document provides essential context for AI models interacting with this project. Adhering to these guidelines will ensure consistency and maintain code quality.

## 1. Project Overview & Purpose

- **Primary Goal:** This is a web application, built using Next.js and it uses the App Router. The keyname is "fdi-assistant".
- **Business Domain:** An Offline Web Application to help users keep track of legal SAT invoices and accountability in Mexico.

## 2. Core Technologies & Stack

- **Languages:** TypeScript
- **Frameworks & Runtimes:** React, Next.js, Node.js (v20+ required).
- **Databases:** The application uses PGLite, a local embedded PostgresSQL database. Do not communicates to any remote database.
  - **ORM:** Drizzle
- **Key Libraries/Dependencies:**
  - **Styling:** `tailwindcss`.
  - **UI/Components:** `shadcn/ui`.
- **Package Manager(s):** pnpm.

## 3. Architectural Patterns

- **Overall Architecture:** A component-based web application. The routing is managed by the app router, which uses a directory-based layout structure.
- **Directory Structure Philosophy:**
  - `/app`: Contains all routes. Subdirectories like `(main)` define route groups with their own layouts.
  - `/src`: Contains shared, reusable code not specific to a single route.
    - `/db`: Drizzle client connector, and DB schemas.
    - `/actions`: Next.js Server Actions
    - `/lib`: Utilities code
  - `/public`: Static assets like images and fonts.

## 4. Coding Conventions & Style Guide

- **Formatting:** Enforced by ESLint and Prettier. The configuration is in `eslintrc.config.mjs`, which includes rules for import sorting and other best practices.
- **Naming Conventions:**
  - `files`: kebab-case (e.g., `complete-sign-up.tsx`).
  - `components`: PascalCase (React convention).
  - `variables`, `functions`: camelCase (TypeScript/JavaScript convention).
- **API Design:** Pending
- **Error Handling:** Pending

## 5. Key Files & Entrypoints

- **Main Entrypoint(s):** The app is registered via `index.ts`. The root of the UI is defined in `app/_layout.tsx`.
- **Configuration:**
  - `package.json`: Project dependencies and scripts.
  - `next.config.js`: Configuration for Next.js.
  - `tsconfig.json`: TypeScript compiler options and path aliases (`@/*`).
  - `eslint.config.mjs`: Linting rules.

## 6. Specific Instructions for AI Collaboration

- **Contribution Guidelines:** No `CONTRIBUTING.md` file was found. Follow the existing code patterns and conventions.
- **Infrastructure (IaC):** No Infrastructure as Code directory was found. This is expected for a mobile client.
- **Security:** Be cautious when modifying authentication logic or any code that handles sensitive user data. Do not hardcode API keys or secrets.
- **Dependencies:** Add new dependencies using `pnpm add <package-name>`. For native modules, ensure they are compatible with Next.js and follow their specific installation instructions.
- **Commit Messages:** The commit history shows descriptive, present-tense messages (e.g., "Adds feature X", "Refactors component Y"). While not strictly following the Conventional Commits specification, messages should be clear and explain the "what" and "why" of the change.

## 7. Guiding Principles & Patterns

The following principles have been established during development sessions and should be followed to maintain code quality and predictability.

- **State Has a Single Responsibility:** Each state variable (e.g., `useState`) should have a single, clear purpose. Avoid overloading a piece of state with multiple meanings. If you need to track a new condition or value, prefer creating a new, descriptively named state variable. This makes the component's behavior easier to reason about.

- **Prefer Explicit State Updates in Event Handlers:** When a user action should result in a state change, perform that state change directly inside the event handler function (e.g., `onPress`, `onSubmit`). Avoid using generic `useEffect` or `useDidUpdate` hooks that listen for broad changes (like `array.length`) to trigger follow-up state updates. This makes the data flow predictable and avoids unintended side effects.

- **Data Flows Down ("Lifting State Up"):** The component that owns and modifies a piece of state is the single source of truth. If a child component needs to display or react to that state, pass it down via props. Do not attempt to duplicate or synchronize state in child components.

- **Embrace Iterative Refactoring:** The path to the best solution is often iterative. We can start by centralizing logic, then introduce custom code, and finally refactor to a fully encapsulated solution. Don't be afraid to improve a solution as you gain a better understanding of the problem space.

- **Practice Continuous Code Cleanup:** With each refactoring step, we removed the code that became obsolete (e.g., unused `refs`, `forwardRef`, and custom hooks). This discipline is critical for preventing technical debt and keeping the codebase clean and maintainable for future developers.

### Server Actions and Data Validation

- **Align Zod Schemas with Database Schemas:** Zod schemas used in server actions for data validation must precisely mirror the database schema's types and nullability. For example, a nullable `DECIMAL` column in the database, which Drizzle represents as a string, should correspond to `z.string().optional()` in the Zod schema. Similarly, nullable columns should have corresponding `.optional()` or `.nullable()` validators to prevent type errors when passing data to the ORM.

- **Use Transformations for Data Mismatches:** When form data structure or format doesn't align with the database schema, use the server action as a translation layer.

  - **Formatting:** For simple format differences (e.g., a comma-separated string for a database array), use Zod's `.transform()` method within the action's input schema. This centralizes data-shaping logic.
  - **Field Names:** For mismatched names (e.g., form field `taxRegime` vs. database column `taxRegimeId`), perform the renaming inside the action handler _after_ validation. Destructure the `parsedInput` and construct a new object for the ORM.

- **Structure Forms for `next-safe-action`:** When building a client-side form for a server action:
  1. Bind the `execute` function from the `useAction` hook to the `<form>`'s `action` prop.
  2. Name each input element (`<Input name=...>`, `<Select name=...>`) to match the keys in the action's Zod schema.
  3. Use dot notation for nested objects (e.g., `name="address.street"`). This allows `zod-form-data` to correctly construct the nested object structure.
  4. Use the `onSuccess` and `onError` callbacks in the `useAction` hook to provide clear user feedback (e.g., via toasts).
