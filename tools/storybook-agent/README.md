# Storybook Agent Workflow

This tooling turns nx design system Storybook into remote, structured context for agents
such as Claude Code, Cursor, Antigravity, or any browser-capable LLM workflow.

## Commands

Generate a local development manifest from story source:

```bash
npm run storybook:agent-manifest
```

Validate story discovery, component shards, token pack, and context packs:

```bash
npm run storybook:agent-validate
```

Build deployable Storybook plus agent manifests:

```bash
STORYBOOK_BASE_URL=https://syednoumansyed.github.io/hessa-nx-design-system npm run build-storybook:agent
```

Validate a deployed Storybook:

```bash
npm run storybook:agent-validate -- \
  --source https://syednoumansyed.github.io/hessa-nx-design-system/index.json \
  --base-url https://syednoumansyed.github.io/hessa-nx-design-system \
  --render-limit 5 \
  --out tmp/storybook-agent-remote
```

## Published Artifacts

After the GitHub Pages workflow deploys Storybook, these files should be
available beside the Storybook app:

```text
/index.json
/agent-manifest/index.json
/agent-manifest/tokens.json
/agent-manifest/stories.json
/agent-manifest/components/<component>.json
/agent-manifest/context-packs/<task>.json
```

Agents should load `tokens.json` plus one component shard or one context pack,
not the raw Storybook index.

## Agent Prompt Pattern

```text
Use these nx design system remote context files:
https://syednoumansyed.github.io/hessa-nx-design-system/agent-manifest/tokens.json
https://syednoumansyed.github.io/hessa-nx-design-system/agent-manifest/components/sidebar.json

Inspect the referenced iframe URLs before creating UI.
Use nx design system components and reactive forms.
Use tokenPack for spacing, typography, semantic colors, RTL, and role theming.
Do not use raw HTML controls, ngModel, raw hex colors, or arbitrary spacing.
```

## Visual Fidelity

Static HTML previews are not final proof. Fonts, typography scale, Ionic styles,
Tailwind utilities, providers, and role/RTL globals must be validated through
real Storybook iframe renders.

Use the proof story as a sanity check:

```text
/iframe.html?id=4-agent-workflow-generated-student-assignment-form--default&viewMode=story
```

That story renders through real Storybook global styles, `withHessaProviders()`,
reactive forms, nx design system components, and token classes.
