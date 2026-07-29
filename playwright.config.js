// playwright.config.js
// ─────────────────────────────────────────────────────────────────────────────
// Minimal Playwright configuration for a static HTML project.
//
// Because there is no build step or server, we navigate directly to file://
// paths in the test files themselves. This means we don't need a baseURL or
// a webServer block — Playwright's Chromium can open local files just like
// a normal browser can.
//
// Run tests:           npx playwright test
// Interactive UI mode: npx playwright test --ui
// Headed (watch browser): npx playwright test --headed
// Single file:         npx playwright test tests/tabs.spec.js
// ─────────────────────────────────────────────────────────────────────────────

import { defineConfig } from '@playwright/test';

export default defineConfig({
    // Where Playwright looks for test files.
    testDir: './tests',

    // Run only in Chromium to keep things simple for an intro project.
    // To add Firefox and WebKit later, uncomment the extra projects below.
    projects: [
        { name: 'chromium', use: { browserName: 'chromium' } },
        // { name: 'firefox',  use: { browserName: 'firefox' } },
        // { name: 'webkit',   use: { browserName: 'webkit' } },
    ],

    // Print one line per test to the terminal.
    reporter: 'list',

    use: {
        // No baseURL — tests navigate to an absolute file:// URL instead.
        // Keep the browser visible for 500 ms after a failure so a screenshot
        // can be captured, then close automatically.
        screenshot: 'only-on-failure',
        video: 'off',
    },
});
