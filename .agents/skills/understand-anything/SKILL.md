---
name: understand-anything
description: AI-powered codebase understanding suite. Use to explore codebase architecture, visualize knowledge graphs, trace business domain flows, analyze git diff impacts, and generate guided onboarding tours.
---

# Understand Anything Suite

Understand Anything transforms raw source code into an interactive, explorable knowledge graph with domain mapping, architectural layers, and guided onboarding.

The full suite is packaged as a plugin in [`.agents/plugins/understand-anything/`](../plugins/understand-anything/).

## Available Capabilities & Slash Commands

| Command | Purpose | Plugin Skill |
| :--- | :--- | :--- |
| `/understand` | Scans codebase, extracts symbols & dependencies, builds `.ua/knowledge-graph.json` | [`understand`](../plugins/understand-anything/skills/understand/SKILL.md) |
| `/understand-dashboard` | Launches the interactive visual graph dashboard in your browser | [`understand-dashboard`](../plugins/understand-anything/skills/understand-dashboard/SKILL.md) |
| `/understand-chat <query>` | Answers architectural questions grounded in the knowledge graph | [`understand-chat`](../plugins/understand-anything/skills/understand-chat/SKILL.md) |
| `/understand-diff` | Analyzes git diffs to show affected components and risk levels | [`understand-diff`](../plugins/understand-anything/skills/understand-diff/SKILL.md) |
| `/understand-domain` | Maps code modules to business domain models and financial flows | [`understand-domain`](../plugins/understand-anything/skills/understand-domain/SKILL.md) |
| `/understand-explain <path>` | Provides a deep architectural breakdown of a file or module | [`understand-explain`](../plugins/understand-anything/skills/understand-explain/SKILL.md) |
| `/understand-onboard` | Generates a guided step-by-step onboarding walkthrough | [`understand-onboard`](../plugins/understand-anything/skills/understand-onboard/SKILL.md) |
| `/understand-knowledge` | Analyzes markdown knowledge bases and LLM wikis | [`understand-knowledge`](../plugins/understand-anything/skills/understand-knowledge/SKILL.md) |
| `/understand-figma` | Extracts UI components, design tokens, and screens from Figma | [`understand-figma`](../plugins/understand-anything/skills/understand-figma/SKILL.md) |

## Automated Synchronization
The project maintains a background auto-update engine in `.ua/scripts/` that synchronizes the knowledge graph whenever code changes are committed or saved.
