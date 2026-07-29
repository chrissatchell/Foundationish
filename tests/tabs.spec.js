// tests/tabs.spec.js
// ─────────────────────────────────────────────────────────────────────────────
// End-to-end tests for the <tabbed-panels> custom element.
//
// These three tests are an introduction to the core Playwright idioms:
//   1. Role-based locators  — prefer accessible names over CSS selectors
//   2. Web-first assertions — await expect(...) retries until truthy
//   3. Keyboard interaction — page.keyboard.press() for arrow-key navigation
// ─────────────────────────────────────────────────────────────────────────────

// Every Playwright test file starts with this import.
// `test`   defines a test case (like `it` in Jest/Mocha).
// `expect` provides web-first assertions that auto-retry until they pass.
import { test, expect } from '@playwright/test';

// Node's built-in `path` module lets us build an absolute file:// URL to the
// static HTML page so Playwright can open it without a local web server.
import path from 'path';

// ESM modules have no built-in `__dirname`, so we reconstruct it from
// import.meta.url — the URL of this module — via fileURLToPath.
import { fileURLToPath } from 'url';

// ─── Shared setup ────────────────────────────────────────────────────────────

// The directory of this test file (tests/).
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Construct the full file:// URL once, then reuse it in every test.
// We step up one level from tests/ to reach Tabs/index.html.
const TABS_URL = `file://${path.resolve(__dirname, '../Tabs/index.html')}`;

// `test.beforeEach` runs before every test in this file.
// The `{ page }` argument is a Playwright fixture — a fresh browser page that
// Playwright creates and closes automatically for each test.
test.beforeEach(async ({ page }) => {
    await page.goto(TABS_URL);

    // Wait until the component has initialised by checking for the tablist
    // role, which is added to the <ul> by tabs.js. This is safer than a sleep
    // because Playwright retries the assertion until it passes (up to 5 s by
    // default), then continues — no arbitrary timeouts needed.
    await expect(page.getByRole('tablist').first()).toBeVisible();
});


// ─────────────────────────────────────────────────────────────────────────────
// TEST 1 — Click interaction
//
// Covers: clicking a tab reveals its panel, hides the previously active panel,
//         and updates aria-selected on both tabs.
//
// Playwright idioms shown:
//   • page.getByRole()         — semantic, accessibility-tree-based locator
//   • locator.within()         — scope a locator to a parent (avoids matching
//                                tabs from *other* tabbed-panels on the page)
//   • await locator.click()    — simulates a real pointer click
//   • expect().toHaveAttribute — asserts an HTML/ARIA attribute value
//   • expect().toBeVisible()   — asserts the element is rendered and visible
//   • expect().toBeHidden()    — asserts hidden="" attribute hides the element
// ─────────────────────────────────────────────────────────────────────────────
test('clicking a tab shows its panel and hides the previous one', async ({ page }) => {

    // ── Scope to the right section ──────────────────────────────────────────
    // index.html has four <tabbed-panels> examples. We use getByRole('region')
    // with the section's accessible name to pin every subsequent locator to
    // just the "Default tabs" section, avoiding false matches.
    //
    // This works because <section aria-labelledby="default-tabs-heading"> gives
    // the section an implicit ARIA role of "region" and an accessible name of
    // "Default tabs" (the text of the referenced heading).
    const section = page.getByRole('region', { name: 'Default tabs' });

    // ── Locate tabs and panels by their ARIA role and accessible name ────────
    // After tabs.js initialises, the <a> links are replaced with
    // <button role="tab"> elements. getByRole('tab') finds them by that role,
    // and the { name } option matches on visible text content.
    const overviewTab  = section.getByRole('tab', { name: 'Overview' });
    const featuresTab  = section.getByRole('tab', { name: 'Features' });

    // The panel's accessible name comes from aria-labelledby pointing to its
    // corresponding tab button, so { name: 'Overview' } resolves correctly.
    const overviewPanel  = section.getByRole('tabpanel', { name: 'Overview' });
    const featuresPanel  = section.getByRole('tabpanel', { name: 'Features' });

    // ── Assert the initial state ─────────────────────────────────────────────
    // The first tab is selected by default. All assertions below are web-first:
    // Playwright will retry them for up to 5 s before failing, so we never
    // need an explicit wait or sleep.
    await expect(overviewTab).toHaveAttribute('aria-selected', 'true');
    await expect(overviewPanel).toBeVisible();

    // ── Perform the interaction ──────────────────────────────────────────────
    // click() dispatches a real pointer event, mirroring what a user does.
    await featuresTab.click();

    // ── Assert the outcome ───────────────────────────────────────────────────
    // The Features panel should now be visible…
    await expect(featuresPanel).toBeVisible();
    // …and the Overview panel should carry the hidden attribute.
    await expect(overviewPanel).toBeHidden();

    // aria-selected must flip on both tabs so screen readers announce the
    // change correctly.
    await expect(featuresTab).toHaveAttribute('aria-selected', 'true');
    await expect(overviewTab).toHaveAttribute('aria-selected', 'false');
});


// ─────────────────────────────────────────────────────────────────────────────
// TEST 2 — Keyboard navigation (automatic activation mode)
//
// Covers: pressing ArrowRight moves focus to the next tab AND immediately
//         selects it (because there is no `manual` attribute on this
//         <tabbed-panels> instance).
//
// Playwright idioms shown:
//   • locator.focus()          — programmatically focuses an element
//   • page.keyboard.press()    — sends a key event to the focused element
//   • expect().toBeFocused()   — asserts :focus on an element
// ─────────────────────────────────────────────────────────────────────────────
test('ArrowRight key moves focus to the next tab and selects it automatically', async ({ page }) => {

    // Scope to the "Default tabs" section (automatic activation, horizontal).
    const section = page.getByRole('region', { name: 'Default tabs' });

    const overviewTab   = section.getByRole('tab', { name: 'Overview' });
    const featuresTab   = section.getByRole('tab', { name: 'Features' });
    const overviewPanel = section.getByRole('tabpanel', { name: 'Overview' });
    const featuresPanel = section.getByRole('tabpanel', { name: 'Features' });

    // ── Set up: focus the first tab ──────────────────────────────────────────
    // Keyboard navigation in a tab list follows the "roving tabindex" pattern:
    // only the currently selected tab is in the natural tab order (tabindex
    // unset). The others have tabindex="-1" so they can receive focus only via
    // arrow keys — NOT via Tab. We therefore focus programmatically first.
    await overviewTab.focus();

    // ── Send the key ─────────────────────────────────────────────────────────
    // page.keyboard.press() sends the key to whatever element currently has
    // focus. The string 'ArrowRight' maps to the standard KeyboardEvent key
    // value, exactly as the component checks in its onKeydown() handler.
    await page.keyboard.press('ArrowRight');

    // ── Assert focus moved ───────────────────────────────────────────────────
    // toBeFocused() checks that document.activeElement is the Features tab.
    await expect(featuresTab).toBeFocused();

    // ── Assert automatic selection ───────────────────────────────────────────
    // Because this tab list has no `manual` attribute, moving focus with an
    // arrow key also selects the tab immediately. Verify both the ARIA state
    // and the panel visibility.
    await expect(featuresTab).toHaveAttribute('aria-selected', 'true');
    await expect(featuresPanel).toBeVisible();
    await expect(overviewPanel).toBeHidden();
});


// ─────────────────────────────────────────────────────────────────────────────
// TEST 3 — ARIA semantics on initialisation
//
// Covers: after the custom element upgrades, the correct ARIA roles and
//         attributes are applied — this is the contract that assistive
//         technologies (screen readers) depend on.
//
// Playwright idioms shown:
//   • getByRole() filtering    — count and verify multiple matched elements
//   • expect().toHaveCount()   — assert how many elements a locator matches
//   • expect().not.toHaveAttribute() — negative attribute assertion
//   • page.locator('#id')      — fall back to a CSS ID selector when needed
//                                (hidden elements are excluded from the
//                                accessibility tree, so getByRole won't find
//                                them — a direct locator is clearer here)
// ─────────────────────────────────────────────────────────────────────────────
test('component sets correct ARIA roles and attributes on init', async ({ page }) => {

    // Scope to the "Default tabs" section.
    const section = page.getByRole('region', { name: 'Default tabs' });

    // ── tablist role ─────────────────────────────────────────────────────────
    // tabs.js sets role="tablist" on the <ul class="tabs">. Verifying this role
    // confirms the list element is correctly announced to assistive tech.
    const tablist = section.getByRole('tablist');
    await expect(tablist).toBeVisible();

    // ── tab roles and count ──────────────────────────────────────────────────
    // Each <a> link is replaced by a <button role="tab">. There are 3 links in
    // this section so we expect 3 tabs.
    const tabs = section.getByRole('tab');
    await expect(tabs).toHaveCount(3);

    // ── Initial selected state ───────────────────────────────────────────────
    // The first tab must be selected (aria-selected="true") and must be
    // reachable via the Tab key (no tabindex="-1").
    const overviewTab = section.getByRole('tab', { name: 'Overview' });
    await expect(overviewTab).toHaveAttribute('aria-selected', 'true');
    await expect(overviewTab).not.toHaveAttribute('tabindex', '-1');

    // The inactive tabs must be deselected and removed from the natural tab
    // order so keyboard users aren't forced to Tab through every tab button.
    const featuresTab = section.getByRole('tab', { name: 'Features' });
    await expect(featuresTab).toHaveAttribute('aria-selected', 'false');
    await expect(featuresTab).toHaveAttribute('tabindex', '-1');

    const supportTab = section.getByRole('tab', { name: 'Support' });
    await expect(supportTab).toHaveAttribute('aria-selected', 'false');
    await expect(supportTab).toHaveAttribute('tabindex', '-1');

    // ── Panel visibility ─────────────────────────────────────────────────────
    // Only the active panel (Overview) should be visible.
    const overviewPanel = section.getByRole('tabpanel', { name: 'Overview' });
    await expect(overviewPanel).toBeVisible();

    // The hidden panels are excluded from the accessibility tree, so
    // getByRole('tabpanel') won't find them. We use direct ID locators
    // instead and assert that the `hidden` attribute is present.
    // toBeHidden() passes when the element has hidden="" or display:none.
    await expect(page.locator('#default-features')).toBeHidden();
    await expect(page.locator('#default-support')).toBeHidden();
});
