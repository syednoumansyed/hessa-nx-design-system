# Storybook Agent Maintenance Guide

Use this guide when adding or correcting Storybook coverage in the Hessa nx
design system and when making those changes available to external agents.

## Working Branch

- Use `dev/storybook-agent` for Storybook, audit, manifest, and agent workflow
  changes.
- Keep `main` stable. Only merge to `main` when the branch is ready to update
  the public GitHub Pages Storybook and remote manifest.

## How To Add Or Correct A Story

1. Read the production component, template, styles, and any related service in
   `src/app/design-system` before touching the story.
2. Decide the story type:
   - **Direct render story** for plain component states and visual contracts.
   - **Service-contract story** when the runtime path goes through a service,
     controller, or wrapper.
   - **Overlay/runtime-path story** when the UI opens through modal, sheet,
     sidebar, picker, or mobile-specific logic.
3. Add the story under `src/stories/components/<component>/`.
4. Keep story args and rendered states aligned with production inputs, outputs,
   providers, tokens, and platform behavior.

## Provider Rules

- Use `withHessaProviders()` by default when the component depends on Ionic,
  translation, HTTP, toaster, layout, role, or other app-level providers.
- Use story-local providers only when the story is intentionally isolated and
  the isolation is part of the contract being documented.
- Avoid per-story provider duplication when the shared helper already covers the
  needed runtime.

## When A Story Needs More Than Default

- Add `play()` when the contract requires real interaction:
  - opening overlays,
  - firing callbacks,
  - verifying disabled blocks interaction,
  - showing loading states,
  - validating dismissal or service-backed behavior.
- Add `LTR` and `RTL` when layout, icon position, copy flow, or mobile sheet
  presentation depends on direction.
- Add `StudentRole` when role theming or role-bound behavior changes the UI.
- Add `Disabled`, `Loading`, or `Error` only when the component contract
  exposes those states in production.
- Add separate mobile and desktop stories when the runtime path differs. Do not
  treat `DsModalService`, `ModalSheetService`, bottom-sheet flows, and sidebar
  flows as interchangeable.

## Story Patterns To Prefer

- Prefer Hessa components over raw HTML controls in triggers, forms, and demos.
- Prefer token-backed classes and existing design-system utilities over raw
  colors, inline font declarations, or ad hoc spacing.
- Prefer real reactive forms and validators over fake error shells.
- Prefer realistic local service fakes over visual-only examples when the
  production path is service-backed.

## How A Story Becomes Agent-Available

1. The story change lands in the repo.
2. CI validates Storybook and regenerates the agent manifest.
3. On `main`, GitHub Pages publishes the updated `storybook-static` output.
4. Remote component shards and context packs become available through:
   - `/agent-manifest/index.json`
   - `/agent-manifest/tokens.json`
   - `/agent-manifest/components/<component>.json`
   - `/agent-manifest/context-packs/<task>.json`

Agents in other repos or on other devices should use the public URLs from
`docs/agentic-ui-from-prd.md`.

## Validation Commands

Run these after each Storybook batch:

```bash
npm run storybook:audit
npx tsc -p .storybook/tsconfig.json --noEmit
npm run storybook:agent-validate
npm run build-storybook:agent
```

## PR Checklist

- Story matches the production component or service contract.
- Provider setup uses `withHessaProviders()` unless isolation is intentional.
- Mobile, desktop, RTL, role, loading, disabled, and error states are covered
  only where the real contract requires them.
- `play()` is present for real interaction contracts, not added as filler.
- Storybook audit, TS check, agent validate, and build pass.
- Public agent-manifest impact is understood and called out in the PR summary.
