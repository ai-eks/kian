---
name: cronjob-scheduler
description: Manage global scheduled tasks and execution records, including creating, updating, deleting, viewing, and troubleshooting schedules. Use when the user mentions cron, scheduled jobs, or timed execution. Only 5-field minute-level cron expressions are supported.
---

# Scheduled Jobs (Global)

This skill manages global scheduled jobs. These jobs are not tied to any single project directory.

## Storage Locations

- **Task list**: `<GlobalWorkspaceRoot>/cronjob.json`
- **Execution log**: `<GlobalWorkspaceRoot>/cronjob-log.jsonl` (JSON Lines, one JSON object per line)

## Task Schema

The file content must be an array. Each task object should use the following fields:

| Field | Type | Description |
| ----- | ---- | ----------- |
| `cron` | string | 5-field cron expression (`minute hour day month weekday`) |
| `content` | string | Natural-language task content |
| `status` | string | Task status, typically `active` or `paused` |
| `targetAgentId` | string | Optional. The target agent ID. If omitted, the task runs on the primary agent |

Notes:

- Set `targetAgentId` only when the user explicitly requests that a specific agent should run the task.
- If the user does not specify a target agent, leave `targetAgentId` unset so the primary agent handles it.
- `timeSummary` is derived automatically from `cron`; do not maintain it manually.
- Keep the JSON valid and structurally stable. Do not introduce unrelated fields such as `id`, `metadata`, or `lastRun`.

## Hard Constraints for Creating Tasks

- `cron` must use the **5-field format**: `minute hour day month weekday`.
- **6-field or 7-field cron is not supported**. Do not include seconds. For example, `*/5 * * * * *` and `0 */5 * * * *` are invalid here.
- **The smallest supported execution unit is one minute**. If the user asks for tasks like "every 5 seconds" or "every 30 seconds", you must explicitly say the current system does not support that and must not write such expressions into `cronjob.json`.
- The scheduler currently targets minute-level or coarser schedules. Prefer patterns like `*/5 * * * *`, `0 * * * *`, or `30 9 * * *`.
- If the user provides a second-level cron expression, proactively rewrite it into an equivalent minute-level plan when possible, or explain the limitation before continuing.

## Required User Communication When Creating Tasks

- When adding or modifying a task, explicitly tell the user that the system currently uses **5-field minute-level cron**.
- If the user says "every N seconds", "to-the-second", or otherwise asks for second-level triggering, explain first that second-level scheduling is not supported.
- Do not backfill `timeSummary` from UI copy or user phrasing; treat `cron` as the source of truth.
- If the user did not specify a target agent, do not create a new agent by default and do not auto-fill `targetAgentId`.

## Workflow

1. **Create / update / delete / view scheduled tasks** by directly reading and writing `cronjob.json`.
2. If `cronjob.json` does not exist, create it as an empty array `[]` before writing tasks.
3. **Inspect execution history** by reading `cronjob-log.jsonl`. Each log entry should include at least `executedAt`, `content`, and `project` (the actual agent id or name that executed the task).

## Rules for Reading Execution Logs

- Read only the most recent N lines first, such as the latest 100 or 200 lines. Do not load the entire log file at once.
- Filter by time range, task keywords, or project identifier before returning results.
- Expand the read range gradually only if the user explicitly needs older records.

## Operating Conventions

1. When the user asks to create, update, delete, or view scheduled tasks, use this skill first and operate on `cronjob.json`.
2. When the user asks to inspect execution history, read `cronjob-log.jsonl` efficiently using the rules above.
3. Task start/stop behavior is handled automatically by the system based on `status`; the agent only needs to maintain correct JSON.
4. If the requested schedule exceeds current system capabilities, explain the limitation first and then provide a workable minute-level alternative.
