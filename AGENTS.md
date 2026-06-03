# Agent Instructions for nx-fe

This document provides repository-wide instructions for coding agents working in
the nx front end repository.

## nx-design System Storybook

When the user says:

```text
Use nx-design system Storybook
```

or provides a PRD and asks to create nx design system UI, use the remote Storybook agent context
before creating UI. Follow the full workflow in
`docs/storybook-agent/agentic-ui-from-prd.md`.

Always load:

```text
https://syednoumansyed.github.io/hessa-nx-design-system/agent-manifest/index.json
https://syednoumansyed.github.io/hessa-nx-design-system/agent-manifest/tokens.json
```

Then choose the relevant context pack or component shard from the manifest.
Inspect selected story `absoluteUrl` iframe links before coding.

Required rules:

- Use nx design system components instead of raw HTML controls.
- Use reactive forms. Do not use `ngModel`.
- Use token rules for typography, spacing, colors, radius, RTL, role theming,
  and device breakpoints.
- For modal, sheet, sidebar, picker, table, selector, or responsive PRDs,
  validate desktop and mobile behavior separately.
- Report which Storybook stories, context packs, component shards, and token
  rules were used.
- For Storybook, audit, manifest, and agent-instruction work in this repo, use
  `dev/storybook-agent` as the working branch. Treat `main` as the public
  deployment branch only.

## Project Overview

- Angular 19 standalone application with Ionic 8, Transloco, Taiga UI, and Capacitor 7.
- Primary app lives under `src/`; a legacy Ionic admin panel exists in `admin-panel/` and should be treated as a separate project.
- Design system utilities live in `src/app/design-system` and `src/styles/tailwind.css`; custom UI kit components are under `src/app/ui-kit`.
- Tables, list views, and responsive grids rely on ag-Grid wrappers (`@components/hes-table`) and bespoke responsive components.
- API access uses services under `src/app/pages/**/data-access` with HTTP interceptors registered in `main.ts` to add auth, language, and error handling headers.

## Key Architectural Patterns

- **Standalone components only**: every page/component declares imports explicitly; avoid `NgModule` usage.
- **Signals first**: prefer `signal`, `computed`, and `toSignal` for local UI state. Use RxJS streams only for asynchronous flows.
- **Modern Angular primitives**: define component inputs with the `input()` signal API and author templates with the new control flow blocks (`@if`, `@for`, `@switch`) instead of structural directives.
- **Interop conventions**: when bridging signals and observables use `toObservable`, `toSignal`, and unsubscribe with `takeUntilDestroyed()` from `@angular/core/rxjs-interop`.
- **Dependency injection**: use `inject(SomeService)` inside classes rather than constructor injection where feasible to stay aligned with current code style.
- **Path aliases**: leverage `tsconfig.json` paths (e.g. `@auth/*`, `@shared/*`, `@pages/*`) instead of lengthy relative imports.
- **Form patterns**: reactive forms dominate (`FormGroup`, `FormControl`, `NonNullableFormBuilder`). Preserve existing validators and disabled state handling.
- **DTO transformations**: transformation helpers sit in `src/app/shared/dto-transformation` and specific feature `data-access` folders. Update both model and transform functions together when the payload shape changes.

## Figma MCP & Styling Guidelines

- **Figma MCP workflow**:
  - Use the Figma Model Context Protocol tools (`mcp_figma-desktop_get_metadata`, `mcp_figma-desktop_get_design_context`, `mcp_figma-desktop_get_variable_defs`, `mcp_figma-desktop_get_screenshot`) to pull the latest component specs before implementing UI.
  - Request node metadata first, then fetch variables to understand token names (e.g. `surface/on/primary`). Mirror those tokens with the SCSS custom properties under `src/styles/tokens`.
  - When the design calls for new tokens, coordinate with design to add them in Figma first; only add SCSS fallbacks after token names are confirmed.
- **Design tokens in code**: prefer the semantic CSS variables defined in `src/styles/tokens/_semantic.scss`, `_feedback.scss`, etc. Reference them via Tailwind utility classes or inline styles (`style="color: var(--content-mid-emphasis)"`) instead of hard-coded hex values.
- **Design tokens in code**: prefer the semantic CSS variables defined in `src/styles/tokens/_semantic.scss`, `_feedback.scss`, etc. Reference them via existing Tailwind utilities (e.g. `text-emphasis-high`, `text-emphasis-mid`) rather than inlining custom properties whenever a utility exists. Use inline styles only as a last resort when no semantic utility is available.
- **Tailwind utilities**:
  - Shared utilities live in `src/styles/tailwind.css`; reuse existing component classes (e.g. `.hes-card`, `.hes-badge--success`, `.centered-flex`) before adding new ones.
  - Custom utilities should be added under the appropriate Tailwind layer (`@layer components` or `@layer utilities`) to preserve purge safety and stay consistent with the DS naming scheme.
  - Avoid raw `class="px-4 py-2"` mixes that conflict with DS spacing tokens; map to design-system-approved spacing utilities instead.
  - Always style new work with Tailwind utilities or existing design-system classes rather than adding feature-level SCSS files.
  - When introducing new utilities, wire them to the existing CSS variables/tokens so Tailwind classes remain token-driven.
  - Use semantic color helpers like `text-emphasis-high`, `text-emphasis-mid`, etc., instead of inlining token variables when the utility exists.
- **Typography helpers**:
  - Use the mixin-generated classes from `src/styles/base/_ds-typography.scss` (`heading-h2-high-emphasis`, `content-md-default`, `single-line-caption-mid-emphasis`).
  - Pair typography classes with semantic color utilities (`text-emphasis-mid`, `text-content-success`) to reflect the Figma spec and color tokens.
- **RTL considerations**: many styles depend on logical properties and `[dir="rtl"]` blocks in `global.scss`. Verify MCP screenshots for both directions when altering layout or typography.

## Internationalization

- Transloco serves translations from `src/assets/i18n/{lang}.json`.
- Always wrap user-facing strings with `translate` pipes (`| transloco`) or service calls (`HesTranslateService`, `TranslocoService`).
- New keys follow snake-case namespaces grouped by feature (e.g. `report_card.columns.dropdown_label`). Update both `en.json` and `ar.json`.
- Guard against missing keys; add fallback handling where existing patterns do.
- Do not add new keys to `src/assets/i18n/en.json` or `src/assets/i18n/ar.json`. Reuse existing keys where possible; if no key exists, use the literal string directly in the template.

## Permissions & Scope Services

- RBAC constants live in `src/app/shared/role-bace-acces-controller/resource-permission.constant.ts`. Keep keys synchronized with backend enums and avoid hardcoding strings elsewhere.
- Scope services (`StudentSelectionScopeService`, `AcademicYearsScopeService`, `SchoolStructureScopeService`) manage global context using signals; mutations must go through their public APIs to maintain downstream subscriptions.

## Networking & API Layer

- HTTP interceptors order matters: `RefreshTokenInterceptor` → `AuthTokenInterceptor` → `AuthHeadersInterceptor` → `LanguageMiddlewareInterceptor` → feature interceptors.
- Use the existing `ApiService` or feature-specific services under `data-access/` for HTTP calls. Handle errors via RxJS `catchError` and surface UI errors through toaster or DS error states.
- Mocking: MSW (`src/mocks`) activates when `environment.MOCK_ENABLED` is `true`. Keep mock handlers updated when APIs change.

## Mobile & Capacitor Notes

- Capacitor build targets live in `android/` and `ios/`; avoid touching native configs unless necessary.
- When adding device APIs, ensure the relevant Capacitor plugin is installed, configured, and permissions handled in both platforms.
- CometChat initialization occurs before bootstrap; keep async initializers lightweight and idempotent.

## Admin Panel Scope

- `admin-panel/` is a separate Ionic project pinned to older Angular versions. Do not import code from `src/` into it or vice versa.
- If edits are required, ensure dependencies and commands (`npm install`, `ionic serve`) run from that folder.

## Implementation Checklist

- Maintain strict null checks and typing; interfaces often extend shared DTOs.
- Prefer small composable components; register them via `imports: []` in the `@Component` decorator.
- Keep logic inside services where reusable; components should orchestrate signals and view state.
- Dispose subscriptions with `takeUntilDestroyed()` or convert to signals.
- Preserve ordering in initializer arrays (e.g. APP_INITIALIZER providers, interceptor sequences).
- Align new features with existing translation keys, icons (`@ng-icons`), and DS components before introducing new libraries.
- When touching shared UI kit components, update any associated README usage docs under `src/app/design-system` or `guides/`.

## Useful Commands

- Install dependencies: `npm install`
- Run the app: `npm start` (alias for `npx ionic serve`)
- Run with mocks: `npm run mock`
- Build web bundles: `npm run build:web:staging`
- Build mobile artifacts: `npm run build:android:staging`, `npm run build:ios:staging`
- Extract translation keys: `ts-node scripts/translation-key-extractor.ts`

## When in Doubt

- Follow patterns from the nearest existing feature; consistency outweighs novelty.
- Coordinate UI changes with design system maintainers—additions may require updates to shared tokens.
- Validate RTL behavior; many components check `isRtl()` and adjust templates accordingly.
- If a change impacts both desktop and mobile flows, update `mobileViewConfig` and responsive components together.
- For complex refactors, add or update tests and Cypress specs to cover regression risks.

Adhering to these guidelines keeps the nx design system front end aligned with product expectations, reduces regressions, and ensures AI-generated contributions integrate smoothly.
