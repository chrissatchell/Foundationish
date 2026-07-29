---
name: project-test-setup
description: Playwright setup for this static HTML accessible components project — no bundler, file:// navigation, CommonJS test files
metadata:
  type: project
---

Playwright is installed and configured at the project root (`playwright.config.js`).

- Test runner: `@playwright/test` (CommonJS, `"type": "commonjs"` in package.json)
- Test directory: `tests/` (relative to project root)
- Browser: Chromium only (single project named `chromium`)
- No webServer — tests navigate directly to `file://` URLs using `path.resolve(__dirname, '../ComponentName/index.html')`
- `npm test` runs `playwright test`

**Why file:// instead of a local server:** The project has no build step and all component JS is plain non-module scripts. file:// works cleanly in Playwright's Chromium and avoids any extra server dependency.

**How to apply:** For new component tests, replicate the file:// URL pattern in `beforeEach`. Add new spec files to `tests/`.
