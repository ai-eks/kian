---
name: docs-manager
description: Manage user documents and knowledge in `<AgentWorkspaceRoot>/docs`, including recording, organizing, searching, and maintaining notes, journals, and reference material over time. Use when the task involves textual knowledge.
---

# Docs Manager

Use this skill to manage textual knowledge in **`<AgentWorkspaceRoot>/docs`**, including notes, journals, curated knowledge, and long-term reference material.

## Core Conventions

- Store all knowledge documents in the `docs` directory. When the user has any text or knowledge-management need and does not specify a special location, create an appropriate folder and document structure here.
- Before editing knowledge documents, inspect the existing file list first and then decide whether to create a new document or update an existing one.
- This directory also serves as a knowledge base for understanding the user and providing more personalized support over time.

## Workflow

1. **Understand the user’s request**: clarify whether they want to record, find, or organize information.
2. **Inspect the document list**: use Bash commands such as `ls`, `tree`, `find`, or `grep` to inspect the existing structure without dumping too much content at once.
3. **Choose the document action**: when adding information, decide carefully whether to create a new file or edit an existing one.
4. **Read related content first**: review relevant existing content before writing so you do not duplicate or overwrite useful material.
5. **Write the update**: create or edit documents while keeping the directory structure clear and reasonable.

## Directory Organization Suggestions

- Create subdirectories by topic or by time.
- Use filenames that clearly describe the content so the material is easy to find later, and name files in the user’s preferred language.
- Write documents in Markdown.
