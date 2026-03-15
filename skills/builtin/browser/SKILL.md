---
name: browser
description: Use the built-in background browser for interactive web tasks, including opening pages, inspecting the DOM, filling forms, clicking through multi-step flows, and verifying page state. Use this when real browser interaction is required instead of only fetching static text.
---

# Browser

Use this skill for real-time browser interaction in a hidden background session.

## Tool Set (Current Agent Support)

Use only these tools:

| Tool                                       | Purpose                                               |
| ------------------------------------------ | ----------------------------------------------------- |
| `BrowserOpen(url)`                         | Open/reuse hidden background browser session and navigate to URL |
| `BrowserClick(selector)`                   | Click element by CSS selector                         |
| `BrowserType(selector, text, pressEnter?)` | Type into input; optional Enter submit                |
| `BrowserScreenshot()`                      | Capture current page screenshot                       |
| `BrowserRead()`                            | Extract current page as markdown-like readable text   |
| `BrowserReadDom(limit?)`                   | List interactive elements with selector hints         |
| `BrowserBack()`                            | Navigate backward                                     |
| `BrowserForward()`                         | Navigate forward                                      |
| `BrowserReload()`                          | Reload current page                                   |
| `BrowserEval(code)`                        | Execute JavaScript in page context                    |
| `BrowserClose()`                           | Close background browser session                      |

Do not reference `WebFetch` or `WebSearch` in this skill. They are not part of this browser toolset.

## Default Workflow

1. Open page with `BrowserOpen`.
2. Capture initial state with `BrowserScreenshot`.
3. Discover operable elements with `BrowserReadDom` (set `limit` when pages are large).
4. Interact with `BrowserClick` / `BrowserType`.
5. Re-capture with `BrowserScreenshot` after each key action/navigation.
6. Use `BrowserRead` when textual content is needed.
7. Use `BrowserBack` / `BrowserForward` / `BrowserReload` for navigation control.
8. Close with `BrowserClose` when task is complete.

## Element-Finding Strategy

1. Prefer `BrowserReadDom` first to get selector candidates.
2. Validate visually with `BrowserScreenshot`.
3. Use stable selectors: `id`, `name`, `type`, `data-*`, or constrained attribute selectors.
4. If selectors are unstable or hidden, use `BrowserEval` for custom logic.

## Execution Rules

- Take a screenshot before first interaction and after each major step.
- If a click triggers navigation or async rendering, wait for page settle, then screenshot again.
- For object/array returns in `BrowserEval`, wrap with `JSON.stringify(...)` for stable output.
- Keep each interaction atomic and verifiable; avoid chaining many risky actions without checkpoints.
- Always close the browser at the end unless the user explicitly asks to keep it open.

## Example: Search Flow

```text
1. BrowserOpen(url: "https://example.com")
2. BrowserScreenshot()
3. BrowserType(selector: "input[name='q']", text: "search query", pressEnter: true)
4. BrowserScreenshot()
5. BrowserRead()
6. BrowserClose()
```

## Example: Multi-Step Form

```text
1. BrowserOpen(url: "https://example.com/register")
2. BrowserScreenshot()
3. BrowserType(selector: "#name", text: "John Doe")
4. BrowserType(selector: "#email", text: "john@example.com")
5. BrowserClick(selector: "button[type='submit']")
6. BrowserScreenshot()
7. BrowserClose()
```

## Example: Advanced Eval

```text
BrowserEval(code: "window.scrollTo(0, document.body.scrollHeight)")
BrowserEval(code: "document.querySelector('select#country').value = 'US'; document.querySelector('select#country').dispatchEvent(new Event('change', { bubbles: true }))")
BrowserEval(code: "JSON.stringify(Array.from(document.querySelectorAll('a')).map(a => ({ text: a.textContent.trim(), href: a.href })))")
```
