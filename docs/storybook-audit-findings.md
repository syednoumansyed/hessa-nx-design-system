# Storybook Audit Findings and Continuation Plan

## Context

This document captures the second-stage Storybook audit after the foundation work. The source of truth is the frontend implementation in `src/app/design-system`; stories are treated as executable documentation that must match production inputs, providers, services, tokens, and platform branches.

The immediate focus was P0 components, plus modal-adjacent components where mobile and desktop behavior differs.

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

## Next Recommended Stages

1. Finish P0 source-alignment audit for the remaining high-use primitives such as input, avatar, progress, and button variants.
2. Add service-contract stories for missing or high-risk service-backed components: `in-app-notification`, `journal-feed`, `filter-panel`, and responsive table flows.
3. Audit `ds-modal-sheet` and bottom-sheet stories separately from `DsModalService`, with explicit mobile scenarios.
4. Reduce remaining `storybook:audit` gaps by adding `play()` tests to interactive candidates before expanding visual-only variants.
5. Clean unrelated build warnings after story correctness is stable: duplicate Tailwind keys, Sass mixed-declaration warnings, and broad Angular unused-compilation warnings.

## Verification Loop

Run this loop after each focused batch:

```bash
npm run storybook:audit
npx tsc -p .storybook/tsconfig.json --noEmit
npm run build-storybook
```

Then spot-check the affected stories in Storybook. If using the static server at `127.0.0.1:6006`, rebuild `storybook-static` before browser verification and reload with a cache-busting URL if needed.
