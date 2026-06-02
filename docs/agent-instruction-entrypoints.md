# Agent Instruction Entrypoints

Use this file to decide which instruction file applies to each agent workflow.

## What To Say To Agents

For PRD-driven UI creation, say:

```text
Use nx-design system Storybook.

Create UI from this PRD:

<paste PRD here>
```

The agent should then load the remote Storybook manifest and token pack, select
the relevant context pack or component shards, inspect referenced Storybook
iframe stories, and build UI from the PRD.

## Files In This Repo

| File | Use with | Purpose |
| --- | --- | --- |
| `AGENTS.md` | Codex and generic coding agents | Repo-wide engineering and Storybook instructions. |
| `CLAUDE.md` | Claude Code | Project memory loaded by Claude Code. |
| `.cursor/rules/nx-design-system-storybook.mdc` | Cursor | Project rule for Cursor Chat/Agent. |
| `.github/copilot-instructions.md` | GitHub Copilot | Repository instructions for Copilot. |
| `docs/agentic-ui-from-prd.md` | Any agent | Canonical PRD-to-UI workflow. |
| `docs/llm-design-system-operating-guide.md` | Any agent | Detailed Hessa design-system behavior, tokens, devices, and component rules. |
| `tools/storybook-agent/README.md` | Engineers and CI maintainers | Manifest generation, validation, and deploy tooling. |

## Remote Storybook Sources

These URLs are public and can be used from any project or device:

```text
https://syednoumansyed.github.io/hessa-nx-design-system/
https://syednoumansyed.github.io/hessa-nx-design-system/agent-manifest/index.json
https://syednoumansyed.github.io/hessa-nx-design-system/agent-manifest/tokens.json
```

## For Other Projects

If the agent is working in another repo, copy one of these into that repo's
agent instruction system:

- `AGENTS.md` section: "nx-design System Storybook"
- `CLAUDE.md` for Claude Code
- `.cursor/rules/nx-design-system-storybook.mdc` for Cursor

If the tool has no project instruction file, paste this short memory:

```text
When I say "Use nx-design system Storybook", load:
- https://syednoumansyed.github.io/hessa-nx-design-system/agent-manifest/index.json
- https://syednoumansyed.github.io/hessa-nx-design-system/agent-manifest/tokens.json

Then choose the relevant context pack or component shard, inspect the selected
Storybook absoluteUrl iframe stories, use Hessa components and token rules, and
build UI from the PRD.
```

## Antigravity

If Antigravity is used in this repo, add the same short memory above to its
workspace or agent instructions. If it is used in another repo, copy
`docs/agentic-ui-from-prd.md` into the workspace context or link to this GitHub
repo file, then tell the agent: "Use nx-design system Storybook."
