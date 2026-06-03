# Agentic UI From PRD

Use this guide when an agent receives a PRD, product requirement, screen brief,
or feature request and is asked to create Hessa UI using the nx-design system
Storybook.

## Trigger Phrase

When the user says:

```text
Use nx-design system Storybook
```

the agent must load the remote Storybook context and use it as the UI source of
truth before writing code.

## Remote Context

Always start with:

```text
https://syednoumansyed.github.io/hessa-nx-design-system/agent-manifest/index.json
https://syednoumansyed.github.io/hessa-nx-design-system/agent-manifest/tokens.json
```

Then choose one or more relevant context packs or component shards from the
manifest.

Primary task packs:

```text
https://syednoumansyed.github.io/hessa-nx-design-system/agent-manifest/context-packs/student-assignment-form.json
https://syednoumansyed.github.io/hessa-nx-design-system/agent-manifest/context-packs/filterable-student-table.json
https://syednoumansyed.github.io/hessa-nx-design-system/agent-manifest/context-packs/modal-sheet-sidebar-flow.json
```

Component shards follow this pattern:

```text
https://syednoumansyed.github.io/hessa-nx-design-system/agent-manifest/components/<component>.json
```

Examples:

```text
https://syednoumansyed.github.io/hessa-nx-design-system/agent-manifest/components/button.json
https://syednoumansyed.github.io/hessa-nx-design-system/agent-manifest/components/input.json
https://syednoumansyed.github.io/hessa-nx-design-system/agent-manifest/components/modal-sheet.json
https://syednoumansyed.github.io/hessa-nx-design-system/agent-manifest/components/responsive-table.json
https://syednoumansyed.github.io/hessa-nx-design-system/agent-manifest/components/student-selector.json
```

## Agent Workflow

1. Read the PRD and identify the required UI surface: form, table, modal,
   sidebar, mobile sheet, selector, notification, or dashboard.
2. Load `index.json` and `tokens.json`.
3. Select the closest context pack for full workflows, or component shards for
   smaller UI pieces.
4. Inspect the selected stories through their `absoluteUrl` iframe links before
   writing code.
5. Use Hessa design-system components instead of raw HTML controls.
6. Use reactive forms for form UI. Do not use `ngModel`.
7. Use token rules from `tokens.json` for typography, spacing, radius, semantic
   colors, RTL, role theming, and responsive breakpoints.
8. If the PRD includes mobile behavior, inspect mobile/provider stories and
   validate a mobile viewport.
9. If the PRD includes modal or sidebar behavior, validate desktop and mobile
   paths separately. `DsModalService`, `ModalSheetService`, bottom sheet, and
   sidebar service flows are not interchangeable.
10. After implementation, report which stories, context packs, component
    shards, and token rules were used.

## Branch Policy For This Repo

- Use `dev/storybook-agent` for Storybook, audit, manifest, and agent
  instruction work.
- Use `main` only for reviewed, stable changes that should update the public
  GitHub Pages Storybook and remote manifest.

## Output Expectations

The generated UI must:

- match Hessa Storybook visual and runtime behavior,
- use existing Angular/Ionic/Hessa patterns,
- preserve strict typing and standalone component imports,
- use semantic/token classes instead of raw hex colors or arbitrary spacing,
- handle loading, disabled, error, empty, RTL, student role, mobile, and desktop
  states when the PRD or selected component contract requires them,
- avoid changing production component APIs unless a real source mismatch is
  found.

## PRD Prompt Template

Use this prompt in any agent:

```text
Use nx-design system Storybook.

Create UI from this PRD:

<paste PRD here>

Requirements:
- Load the remote Storybook manifest and token pack.
- Select the relevant context pack or component shards.
- Inspect the referenced Storybook iframe stories before coding.
- Use Hessa components and reactive forms.
- Use token rules for typography, spacing, colors, RTL, role, and device behavior.
- Validate mobile and desktop when relevant.
- In your final response, list the Storybook stories and token rules used.
```

## Verification Commands

For repo-local changes, run:

```bash
npm run storybook:audit
npx tsc -p .storybook/tsconfig.json --noEmit
npm run build-storybook:agent
```

For remote manifest validation, run:

```bash
npm run storybook:agent-validate -- \
  --source https://syednoumansyed.github.io/hessa-nx-design-system/index.json \
  --base-url https://syednoumansyed.github.io/hessa-nx-design-system \
  --render-limit 5 \
  --out tmp/storybook-agent-remote
```
