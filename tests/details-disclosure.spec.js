import { test, expect } from '@playwright/test';
import { fileURLToPath } from 'node:url';

const scriptPath = fileURLToPath(new URL('../disclosure/details-disclosure.js', import.meta.url));

async function mount(page, markup) {
    await page.setContent(markup);
    await page.addScriptTag({ path: scriptPath });
    await expect(page.locator('ish-disclosure:not([ready])')).toHaveCount(0);
}

async function expectState(item, expanded) {
    if ( expanded ) {
        await expect(item).toHaveAttribute('expanded');
    } else {
        await expect(item).not.toHaveAttribute('expanded');
    }
    await expect(item.locator(':scope > details')).toHaveJSProperty('open', expanded);
    await expect(item).not.toHaveAttribute('undefined');
}

test.beforeEach(async ({ page }) => {
    page.on('pageerror', error => { throw error; });
    page.on('console', message => {
        if ( ['error', 'warning'].includes(message.type()) ) {
            throw new Error(message.text());
        }
    });
});

test('summary activation emits before-toggle once and reflects pointer and keyboard changes', async ({ page }) => {
    await mount(page, `
        <ish-disclosure><details><summary>Disclosure</summary><p>Content</p></details></ish-disclosure>
    `);
    await page.evaluate(() => {
        window.beforeEvents = [];
        document.addEventListener('accordion:before-toggle', event => {
            window.beforeEvents.push({
                expanded: event.detail.expanded,
                open: event.target.querySelector('details').open,
                element: event.detail.element.localName,
                triggeredExternally: event.detail.triggeredExternally
            });
        });
    });
    const item = page.locator('ish-disclosure');
    const summary = item.locator('summary');
    await summary.click();
    await expectState(item, true);
    await page.getByText('Content', { exact: true }).click();
    await expectState(item, true);
    await summary.focus();
    await page.keyboard.press('Enter');
    await expectState(item, false);
    await expect(summary).toBeFocused();
    await page.keyboard.press('Space');
    await expectState(item, true);
    await expect(summary).toBeFocused();

    // Reconnecting a ready component must not duplicate its listeners.
    await item.evaluate(element => {
        element.remove();
        document.body.append(element);
    });
    await summary.click();
    await expectState(item, false);
    await expect.poll(() => page.evaluate(() => window.beforeEvents)).toEqual([
        { expanded: false, open: false, element: 'summary', triggeredExternally: false },
        { expanded: true, open: true, element: 'summary', triggeredExternally: false },
        { expanded: false, open: false, element: 'summary', triggeredExternally: false },
        { expanded: true, open: true, element: 'summary', triggeredExternally: false }
    ]);
});

test('initial, external and rapid native changes reflect the expanded attribute', async ({ page }) => {
    await mount(page, `
        <ish-disclosure id="host" expanded="true"><details><summary>Host</summary><p>Host content</p></details></ish-disclosure>
        <ish-disclosure id="native"><details open><summary>Native</summary><p>Native content</p></details></ish-disclosure>
    `);
    const item = page.locator('#host');
    await expectState(item, true);
    await expectState(page.locator('#native'), true);
    await item.evaluate(element => element.removeAttribute('expanded'));
    await expectState(item, false);
    await item.evaluate(element => element.setAttribute('expanded', 'false'));
    await expectState(item, true); // Boolean attributes depend on presence, not value.
    await item.evaluate(element => element.setAttribute('expanded', 'another-value'));
    await expectState(item, true);
    await item.locator('details').evaluate(details => { details.open = false; });
    await expectState(item, false);
    await item.locator('details').evaluate(details => { details.open = true; });
    await expectState(item, true);
    await item.locator('details').evaluate(details => {
        details.open = false;
        details.open = true;
        details.open = false;
    });
    await expectState(item, false);
});

for ( const nativeGrouping of [true, false] ) {
    test(`single-select closes siblings with native grouping ${nativeGrouping ? 'enabled' : 'disabled'}`, async ({ page }) => {
        await mount(page, `
            <accordion-items single-select>
                <ish-disclosure id="one"><details><summary>First</summary><p>One</p></details></ish-disclosure>
                <ish-disclosure id="two"><details><summary>Second</summary><p>Two</p></details></ish-disclosure>
            </accordion-items>
        `);
        if ( !nativeGrouping ) {
            await page.locator('details').evaluateAll(elements => {
                elements.forEach(element => element.removeAttribute('name'));
            });
        }
        const first = page.locator('#one');
        const second = page.locator('#two');
        await first.locator('summary').click();
        await expectState(first, true);
        await second.locator('summary').click();
        await expectState(second, true);
        await expectState(first, false);
        await first.evaluate(element => element.setAttribute('expanded', ''));
        await expectState(first, true);
        await expectState(second, false);
    });
}

test('nested summary activation emits only for the owning disclosure', async ({ page }) => {
    await mount(page, `
        <ish-disclosure id="outer"><details open><summary>Outer</summary>
            <ish-disclosure id="inner"><details><summary>Inner</summary><p>Inner content</p></details></ish-disclosure>
        </details></ish-disclosure>
    `);
    await page.evaluate(() => {
        window.beforeTargets = [];
        document.addEventListener('accordion:before-toggle', event => window.beforeTargets.push(event.target.id));
    });
    await page.locator('#inner summary').click();
    await expectState(page.locator('#inner'), true);
    await expectState(page.locator('#outer'), true);
    await expect.poll(() => page.evaluate(() => window.beforeTargets)).toEqual(['inner']);
});
