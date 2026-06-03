# Storybook Audit Findings and Continuation Plan

## Context

This document is the current source of truth for Storybook correctness,
coverage, and agent-availability work in the nx design system. Stories are
treated as executable documentation that must match production inputs,
providers, services, tokens, and mobile or desktop runtime paths.

Last updated: 2026-06-03.

## Current Platform Status

- Public Storybook Pages is live at
  `https://syednoumansyed.github.io/hessa-nx-design-system/`
- Public remote agent manifest is live at
  `https://syednoumansyed.github.io/hessa-nx-design-system/agent-manifest/index.json`
- Public token pack is live at
  `https://syednoumansyed.github.io/hessa-nx-design-system/agent-manifest/tokens.json`
- Remote Storybook context is now part of the supported LLM workflow for Codex,
  Claude, Cursor, Copilot, Gemini, and similar tools

## Phase Status And Gates

| Phase                                   | Status          | Exit gate                                                                                                                    | Evidence                                                                                                                                        | Remaining work                                                                              |
| --------------------------------------- | --------------- | ---------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Phase 1: Storybook 9 foundation         | Complete        | Storybook packages/imports are aligned, shared provider helper exists, and audit script runs.                                | Shared provider infrastructure, audit tooling, and agent-manifest generation are in place.                                                      | Keep dependency alignment intact when Storybook packages change.                            |
| Phase 2: Provider harness adoption      | Mostly complete | Touched stories use `withHessaProviders()` or explicitly justify isolation.                                                  | Shared provider helper covers Ionic, HTTP, toaster, locale, role, layout, and translation defaults used by audited stories.                     | Continue replacing story-local provider duplication as stories are touched.                 |
| Phase 3: Source-of-truth audit          | In progress     | Story args, states, service calls, tokens, and platform behavior match production contracts.                                 | Correctness work covered modal, feedback modal, toast, picker select, select loading, and multiple primitives.                                  | Finish correctness review for remaining missing folders and untouched edge paths.           |
| Phase 4: Service contract stories       | In progress     | Service-backed components have at least one story that exercises the real service path or a realistic local fake.            | Modal, feedback, toaster, picker, filter, responsive table, journal feed, notification, and selector patterns are now represented in Storybook. | Keep new service-backed stories strict about real runtime paths.                            |
| Phase 5: Platform and overlay scenarios | Mostly complete | Desktop modal, mobile sheet, overlay, loading, and dismissal branches are exercised through real interaction where required. | `play()` coverage is in place for current interactive candidates.                                                                               | Continue adding mobile or desktop branch coverage only when real runtime differences exist. |
| Phase 6: Token and visual parity        | In progress     | Stories avoid fake shells, raw colors, unsupported utility classes, and raw HTML controls when DS components exist.          | P0 cleanup replaced much of the earlier inline styling and raw control drift.                                                                   | Continue token cleanup during each story touch.                                             |
| Phase 7: Coverage gap burn-down         | In progress     | Audit gaps trend down without introducing fake states or incorrect service paths.                                            | `storybook:audit` now reports no `play()` gaps and no matrix gaps.                                                                              | Finish the remaining missing story folders and preserve strict audit scope.                 |
| Phase 8: Build warning cleanup          | Deferred        | Build warnings are either fixed or documented as external or non-actionable.                                                 | Storybook builds and validates successfully.                                                                                                    | Return to warning cleanup after story correctness and branch policy are stable.             |

The practical rule stays the same: do not create new story volume until the
component passes the source, provider, service, platform, and token gates for
its real use cases.

## Completed Since Last Audit

- Public GitHub Pages deployment is live for Storybook and the remote agent
  manifest
- Storybook agent manifest generation and validation tooling is in place
- Proof-of-workflow story exists for generated UI validation
- Agent instruction entrypoints now exist for Codex, Claude, Cursor, Copilot,
  and Gemini-compatible tools
- Interactive candidates missing `play()` have been reduced to zero
- Story matrix gaps have been reduced to zero

## Current Audit Status

Latest `storybook:audit` target state:

- Component folders: 45
- Component story files: 41
- Missing component story folders: 8
- Story files missing `argTypes`: 0
- Interactive candidates missing `play()`: 0
- Story files with matrix gaps: 0

Missing story folders currently reported:

- `ag-grid-table`
- `carousal`
- `icon-chooser`
- `option-creator`
- `qr-scanner`
- `react`
- `school-structure-control`
- `selectable-option`

## Audit Scope Policy

- Reusable design-system stories are audited for `argTypes`, matrix coverage,
  and interactive `play()` coverage.
- Workflow proof stories under `src/stories/components/agent-generated-ui/`
  remain part of build and manifest validation, but are not treated as reusable
  design-system component contracts.
- Do not add fake `argTypes` or matrix states to workflow proof stories just to
  satisfy audit output.

## Working Branch Policy

- Use `dev/storybook-agent` for Storybook, audit, manifest, docs, and
  agent-workflow changes.
- Use short-lived task branches from `dev/storybook-agent` when isolating
  specific batches of work.
- Treat `main` as the stable public deployment branch for GitHub Pages and the
  remote manifest.

## Next Execution Order

1. Finish the remaining missing story folders, starting with the highest-risk
   components and preserving correctness-first story authoring.
2. Continue source, provider, token, and service-path alignment for any story
   still carrying drift from the production implementation.
3. Keep modal, sheet, sidebar, and overlay flows separated by their true
   runtime path. Do not collapse `DsModalService`, `ModalSheetService`, bottom
   sheet, and sidebar service behavior into one generic example.
4. Preserve strict audit scope: reusable DS stories stay strict, workflow proof
   stories stay valid but are not forced into DS-only metadata rules.
5. Return to build warning cleanup only after story correctness and branch
   policy work are stable.

## Verification Loop

Run this loop after each focused batch:

```bash
npm run storybook:audit
npx tsc -p .storybook/tsconfig.json --noEmit
npm run storybook:agent-validate
npm run build-storybook:agent
```

Then spot-check the affected stories in Storybook. If a change affects overlays,
mobile or desktop runtime branching, or provider-backed flows, verify the real
branch in the browser rather than relying on static render output alone.
