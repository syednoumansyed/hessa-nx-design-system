# Gemini Instructions

Use these instructions for Gemini, Antigravity, and similar agents when working
in this repository.

## nx-design System Storybook

When the user says:

```text
Use nx-design system Storybook
```

or provides a PRD and asks to create Hessa UI, follow
`docs/agentic-ui-from-prd.md`.

Load these remote sources first:

```text
https://syednoumansyed.github.io/hessa-nx-design-system/agent-manifest/index.json
https://syednoumansyed.github.io/hessa-nx-design-system/agent-manifest/tokens.json
```

Then select the relevant context pack or component shard from the manifest and
inspect the selected story `absoluteUrl` iframe links before coding.

## Required UI Rules

- Use Hessa design-system components instead of raw HTML controls.
- Use reactive forms. Do not use `ngModel`.
- Use token rules for typography, spacing, colors, radius, RTL, role theming,
  and device breakpoints.
- Validate desktop and mobile paths separately when the PRD includes responsive,
  modal, sheet, sidebar, picker, table, or selector behavior.
- Report which Storybook stories, context packs, component shards, and token
  rules were used.
- For Storybook, audit, manifest, and agent-instruction work in this repo, use
  `dev/storybook-agent` as the working branch. Treat `main` as the public
  deployment branch only.

## Project Instructions

Also follow `AGENTS.md` for repository architecture, coding style, verification
commands, and implementation constraints.
