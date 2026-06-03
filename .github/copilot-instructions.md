# GitHub Copilot Instructions for nx-fe

Use this file as a Copilot-specific wrapper around the canonical repository
instructions.

## Canonical Sources

- `AGENTS.md` for repo architecture, coding conventions, verification, and
  implementation constraints
- `docs/agentic-ui-from-prd.md` for the canonical Storybook PRD-to-UI workflow
- `docs/agent-instruction-entrypoints.md` for tool-specific entrypoints and
  remote URLs

## nx-design System Storybook

When the user says:

```text
Use nx-design system Storybook
```

or provides a PRD and asks for Hessa UI, follow
`docs/agentic-ui-from-prd.md`.

Always load:

```text
https://syednoumansyed.github.io/hessa-nx-design-system/agent-manifest/index.json
https://syednoumansyed.github.io/hessa-nx-design-system/agent-manifest/tokens.json
```

Then choose the relevant context pack or component shard from the manifest and
inspect the referenced Storybook `absoluteUrl` iframe stories before coding.

Required Copilot behavior:

- Use Hessa design-system components instead of raw HTML controls.
- Use reactive forms. Do not use `ngModel`.
- Use Hessa token rules for typography, spacing, colors, RTL, role theming,
  radius, and responsive behavior.
- Validate desktop and mobile paths separately for modal, sheet, sidebar,
  picker, selector, table, and responsive workflows.
- Report which Storybook stories, context packs, component shards, and token
  rules were used.
- For Storybook, audit, manifest, and agent-instruction work in this repo, use
  `dev/storybook-agent` as the working branch. Treat `main` as the public
  deployment branch only.
