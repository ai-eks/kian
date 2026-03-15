---
name: programer
description: Delegate programming tasks to Claude Code in a specified code directory for implementation, fixes, refactors, and troubleshooting. Use when coding work needs to be handed off to an external coding agent.
---

# Core Workflow

1. Choose the programming agent.
2. Confirm the task directory and the startup command for that agent.
3. Define the programming task clearly. If it is still ambiguous, ask the user for clarification.
4. Use the **task-manager** skill to create the programming task.

# Programming Agent Selection

## Claude Code (Preferred)

1. Check whether Claude Code CLI is installed locally.

   - Run `claude --version` in the terminal and confirm it returns normally with a version number.
   - If the command is missing or errors, try another agent or tell the user that [Claude Code CLI](https://claude.com/docs/claude-code) must be installed first.

2. Example task command

```bash
cd <task-directory> && claude --dangerously-skip-permissions "Implement XXX: 1. ... 2. ..."
```

## Codex (Fallback)

1. Check whether Codex CLI is installed locally.

   - Run `codex --version` in the terminal and confirm it returns normally with a version number.
   - If the command is missing or errors, try another agent or tell the user that [Codex CLI](https://developers.openai.com/codex/cli/) must be installed first.

2. Example task command

```bash
cd <task-directory> && codex --dangerously-bypass-approvals-and-sandbox "Implement XXX: 1. ... 2. ..."
```
