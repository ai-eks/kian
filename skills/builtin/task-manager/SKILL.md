---
name: task-manager
description: Manage long-running or asynchronous global tasks, including creating, starting, stopping, deleting, checking status, and troubleshooting output. Use for work such as code generation or multi-step scripts that cannot be completed quickly in the current turn.
---

# Task Manager

Use this skill to manage long-running tasks in **`<GlobalWorkspaceRoot>/.tasks`**, such as coding, refactoring, or multi-step scripts. Tasks are driven by the in-app supervisor process based on the task directory and `meta.json`; you manage them by directly creating, editing, and deleting task files and folders.

## Task Location

- Tasks are global and do not belong to a single project.
- **Root path**: `<GlobalWorkspaceRoot>/.tasks`, not a specific agent project directory.
- Each task corresponds to **one subdirectory** under `.tasks`, and the directory name is the **task ID**.

## Task ID Rules

- Allowed characters: letters, digits, underscores `_`, and hyphens `-`.
- The ID must start with a letter or digit.
- Regex: `^[a-zA-Z0-9][a-zA-Z0-9_-]*$`
- Examples: `my-refactor-a1b2`, `claude-write-xyz`

## Single Task Directory Structure

```
<GlobalWorkspaceRoot>/.tasks/
  <taskId>/           # Task ID, also used as the directory name
    meta.json         # Required task metadata
    stdout.log        # Optional, written by the supervisor process
```

## `meta.json` Schema

`meta.json` is a JSON file with these fields:

- `createdAt` (`string`, required): creation time, preferably ISO 8601, such as `2025-03-01T12:00:00.000Z`
- `name` (`string`, required): display name of the task; spaces and non-English text are allowed
- `command` (`string`, required): the command to execute, usually a full shell command
- `status` (`string`, required): task status, one of `running`, `stopped`, or `success`
- `pid` (`number | null`, optional): PID of the running process, written by the supervisor; usually `null` when newly created or not running

Example:

```json
{
  "createdAt": "2025-03-01T12:00:00.000Z",
  "name": "Implement XXX feature",
  "command": "cd <AgentWorkspaceRoot> && claude --dangerously-skip-permissions \"Implement XXX: 1. ... 2. ...\"",
  "status": "stopped",
  "pid": null
}
```

## How to Manage Tasks (Direct File Operations)

1. **List tasks**: list subdirectories under `<GlobalWorkspaceRoot>/.tasks`. Each directory name is a task ID. Read each task’s `meta.json` as needed for `name`, `command`, and `status`.
2. **View task details**: enter the task directory and read `meta.json`. Read or tail `stdout.log` when output is needed.
3. **Check task runtime status**:
   - Read `status` and `pid` from `meta.json`.
   - If status is `running`, `pid` should normally be non-null and the process should still exist. You can verify with `ps -p <pid>`. If `pid` is null or the process does not exist, the task may still be starting, so check again later.
   - If status is `stopped`, `pid` should be null and the task should no longer be running. If it is still running, you can force-stop it.
   - If status is `success`, `pid` should be null and the task should have finished successfully.
4. **Create a task**:
   - Create a new directory under `.tasks` using a valid task ID.
   - Create `meta.json` inside it and fill in `createdAt`, `name`, `command`, `status` (for example `stopped` or `running` to start immediately), and `pid` (usually `null` on creation).
5. **Start a task**: edit `meta.json` for the task. If you change `status` to `running`, the supervisor process will execute `command` and start the task.
6. **Stop a task**: change `status` to `stopped`, and the supervisor process will stop the task.
7. **Update a task**: if `command` needs to change, stop the task first. After editing, make sure the old process has really stopped before starting it again.
8. **Delete a task**: ensure the task has stopped, then delete the task directory at `<GlobalWorkspaceRoot>/.tasks/<taskId>`.
