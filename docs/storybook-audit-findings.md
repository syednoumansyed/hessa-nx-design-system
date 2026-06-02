# Storybook Audit Findings and Continuation Plan

## Context

This document captures the second-stage Storybook audit after the foundation work. The source of truth is the frontend implementation in `src/app/design-system`; stories are treated as executable documentation that must match production inputs, providers, services, tokens, and platform branches.

The immediate focus was P0 components, plus modal-adjacent components where mobile and desktop behavior differs.

## Phase Status And Gates

Last updated: 2026-06-02.

Recent discoveries changed the execution model. Coverage expansion should not lead the work, because adding more variants before source/service/token parity creates more inaccurate stories. Each phase now has an explicit exit gate.

| Phase | Status | Exit gate | Evidence | Remaining work |
| --- | --- | --- | --- | --- |
| Phase 1: Storybook 9 foundation | Complete | Storybook packages/imports are aligned, shared provider helper exists, and audit script runs. | Commit `07e072d` aligned Storybook dependencies/imports, added shared provider infrastructure, and introduced `storybook:audit`. | Keep Storybook package alignment intact when dependencies change. |
| Phase 2: Provider harness adoption | Mostly complete for representative stories | Touched stories use `withHessaProviders()` or explicitly justify isolation. No duplicate Ionic/toaster/translation boilerplate remains in audited stories. | `.storybook/hessa-providers.ts` is in use across audited stories and now includes Ionic, HTTP, toaster, locale, role, layout, and common translation defaults. | Continue replacing per-story provider boilerplate as each story is touched. |
| Phase 3: Source-of-truth audit | In progress | Story args, states, templates, service calls, tokens, and platform behavior match the production component contract. | Commit `f16ca4b` fixed drift for modal, feedback modal, toast, picker select, select loading, and several P0/P1 primitives. | Finish source comparison for remaining P0 primitives and form states, especially input, avatar, progress, and deeper button variants. |
| Phase 4: Service contract stories | In progress | Service-backed components have at least one story that exercises the real service path or a realistic local service fake. | `DsModalService`, `FeedbackService`, `HesToasterService`, Picker Select modal path, and Select loading overlay are now exercised. | Add contract stories for notification, journal feed, filter panel, responsive table, and student selector flows. |
| Phase 5: Platform and overlay scenarios | In progress | Desktop modal, mobile bottom sheet, Ionic overlay, custom modal sheet, sidebar sheet, loading, and dismissal branches are opened through `play()` where possible. | Picker Select now covers desktop modal and mobile bottom-sheet branches; `DsModalService` path is validated separately from direct modal rendering. | Audit `ModalSheetService`, `ds-modal-sheet`, and bottom-sheet scenarios separately because they do not share the same runtime path as `DsModalService`. |
| Phase 6: Token and visual parity | In progress | Stories avoid fake shells, raw colors, unsupported utility classes, inline visual styling, and raw HTML controls when DS components/tokens exist. | Modal, feedback modal, toast, icon, and multiple primitives were cleaned up during the P0 audit batch. | Continue token cleanup during each component audit; do not add broad visual variants until parity is confirmed. |
| Phase 7: Coverage gap burn-down | Not started beyond audit tooling | `storybook:audit` gaps trend down without introducing fake states or incorrect service paths. | `storybook:audit` identifies missing story folders, matrix gaps, missing `argTypes`, and missing `play()` tests. | Add missing stories and reduce the current 23 interactive candidates without `play()` and 12 matrix-gap files after correctness gates pass. |
| Phase 8: Build warning cleanup | Deferred | Build warnings are either fixed or documented as external/non-actionable. | Build succeeds, but warnings remain from duplicate Tailwind keys, Sass mixed declarations, CommonJS dependency output, and broad Angular compilation includes. | Clean warnings after story correctness is stable so warning cleanup does not hide behavior fixes. |

The practical rule is: do not create new story volume until the component passes the source, provider, service, platform, and token gates for its real use cases.

## Main Discoveries

### Storybook drifted from production service paths

Several stories rendered visually plausible examples but did not exercise the same path used by the app:

- Feedback modal should cover `FeedbackService -> DsModalService -> DsFeedbackComponent`, not only a hand-written modal shell.
- Modal service stories need to open `DsModalService` so Ionic `ModalController`, `DsModalWrapperComponent`, footer/header config, and dismiss callbacks are validated.
- Toast stories should use app toaster wiring with `provideToastr`, `DsToastComponent`, and `HesToasterService`; otherwise Storybook can pass while production toast behavior differs.
- Picker Select stories must open the desktop modal and mobile bottom-sheet branches through real user interaction. Static render stories do not prove the branch works.
- Select paginated/loading stories must open the overlay and assert the loading state. Passing `isLoading` in args is not enough if the overlay is never exercised.

### Ionic-created wrappers need classic inputs

`DsModalWrapperComponent` is created by Ionic `ModalController` and receives `componentProps` imperatively. Angular signal `input()` values were not compatible with that runtime assignment path because Ionic overwrote the signal function fields. The wrapper now uses classic `@Input()` bindings so service-created modals work the same way in Storybook and production.

Guideline: components instantiated by external frameworks or imperative controllers should be checked carefully before using signal inputs for externally assigned props.

### Token and style drift was common

Multiple stories used inline styles, raw colors, hard-coded shadows, direct fonts, or utility classes that do not exist in the design-system token set. This made stories look detached from the frontend implementation.

The fix pattern is:

- Prefer component APIs and design-system classes first.
- Use existing token-backed utility classes instead of raw hex colors.
- Avoid inline styles except for Storybook-only layout constraints that cannot reasonably live in the component.
- Use real DS components in story triggers and examples, for example `ds-button` instead of raw `button`.

### Provider and translation drift caused false examples

Stories that omitted shared providers could show raw translation keys or bypass production defaults. The shared provider helper now carries important defaults such as Ionic, HTTP, toaster, and common translation keys used by modal/picker/select flows.

Guideline: if a component depends on app-level providers, the story should either use `withHessaProviders()` or explicitly document why it is intentionally isolated.

### Modal service does not directly own modal sheet service behavior

`DsModalService` and `ModalSheetService` overlap conceptually, but they are separate runtime paths:

- `DsModalService` uses Ionic `ModalController` and `DsModalWrapperComponent`.
- `ModalSheetService` uses the custom modal-sheet signal stack rendered by `ds-modal-sheet-container`.
- Picker Select mobile bottom-sheet behavior uses `DsModalService`, not `ModalSheetService`.
- Sidebar/modal-sheet flows may use the modal-sheet stack separately depending on service configuration.

This means fixing `DsModalService` can affect Picker Select mobile modal behavior, but it does not automatically validate `ModalSheetService` or bottom-sheet component stories. Those require their own mobile scenarios and service-contract stories.

## Current Audit Status

Latest `storybook:audit` output:

- Component folders: 45
- Component story files: 35
- Missing component story folders: 13
- Story files missing `argTypes`: 0
- Interactive candidates missing `play()`: 23
- Story files with matrix gaps: 12

Missing story folders currently reported:

- `ag-grid-table`
- `carousal`
- `ds-responsive-table`
- `filter-panel`
- `icon-chooser`
- `in-app-notification`
- `journal-feed`
- `option-creator`
- `qr-scanner`
- `react`
- `school-structure-control`
- `selectable-option`
- `student-selector`

## How To Continue Fixing Stories

Use this sequence for each component instead of starting from the existing story:

1. Read the production component, service, template, styles, and provider dependencies.
2. Identify whether the component has direct rendering, service-backed rendering, overlay rendering, mobile rendering, or async/backend states.
3. Compare the story against those real contracts.
4. Fix providers first, then service paths, then tokens, then missing matrix states.
5. Add or update `play()` tests for interactive or overlay states.
6. Keep broad new story creation separate from service/token correctness work unless the missing story is required to validate a P0 path.

Expected matrix states should be applied only where meaningful:

- `Default`
- `Disabled`
- `Loading`
- `Error`
- `LTR`
- `RTL`
- `StudentRole`

For form error states, prefer real controls and validators over mocked red text. For mobile/desktop differences, use platform or layout mocks and open the actual branch with a `play()` test.

## Next Execution Order

1. Finish P0 source-alignment audits for remaining primitives and forms, with focus on input, avatar, progress, button variants, and error/loading states.
2. Audit modal-adjacent mobile paths separately: `DsModalService`, `ModalSheetService`, bottom sheet, sidebar sheet, and any Ionic overlay behavior should not be treated as interchangeable.
3. Add service-contract stories for high-risk service-backed components: `in-app-notification`, `journal-feed`, `filter-panel`, responsive table flows, and student selector flows.
4. Reduce `storybook:audit` gaps by adding missing stories, matrix states, `argTypes`, and `play()` tests only after each component passes the source/service/platform/token gates.
5. Clean unrelated build warnings after story correctness is stable: duplicate Tailwind keys, Sass mixed-declaration warnings, CommonJS dependency output, and broad Angular unused-compilation warnings.

## Verification Loop

Run this loop after each focused batch:

```bash
npm run storybook:audit
npx tsc -p .storybook/tsconfig.json --noEmit
npm run build-storybook
```

Then spot-check the affected stories in Storybook. If using the static server at `127.0.0.1:6006`, rebuild `storybook-static` before browser verification and reload with a cache-busting URL if needed.
