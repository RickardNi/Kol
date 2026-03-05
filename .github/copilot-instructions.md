# Copilot Instructions

## General Guidelines
- Prefer using the latest versions of all packages and avoid downgrades whenever possible.
- Prefer clean, readable, maintainable code.
- Avoid duplicated code when possible; prefer reusing existing logic and components.
- Avoid hard-coded styling in Razor pages; prefer using component/page CSS files instead when possible and convenient.

## Code Comments

- Do not add comments to generated code unless the code does something unintuitive or requires explanation.
- Never remove existing comments from the code.

## Terminal

- The terminal is **PowerShell**. Never use bash-only commands such as `grep`, `tail`, `cat` with heredoc syntax, etc. Use PowerShell equivalents (`Select-String`, `Select-Object`, `Set-Content`, etc.).

## Development Server

- The application is almost always already running via `run.bat` in a terminal. Avoid starting a new instance unless you have confirmed none is running.
