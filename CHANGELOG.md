# Changelog

## 0.1.2

- Ignore stale asynchronous file reads and analyses when a newer input is selected or edited.
- Clear an old report as soon as a new file starts loading.
- Add deterministic latest-task regression tests.

## 0.1.1

- Defer Blob URL cleanup after exporting JSON or Markdown so the browser can begin the download reliably.

## 0.1.0 - 2026-10-10

- First release: local Unity, Unreal Engine, and Godot shader-log triage.
- Group repeated diagnostics, filter findings, and export JSON or Markdown.
- Keep the original log lines available with source line numbers; analyze files locally in the browser.
