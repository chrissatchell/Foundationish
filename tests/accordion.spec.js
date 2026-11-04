import { test, expect } from '@playwright/test';
import { fileURLToPath } from 'node:url';

const scriptPath = fileURLToPath(new URL('../disclosure/accordion.js', import.meta.url));
const demoURL = new URL('../disclosure/index.html', import.meta.url).href;

async function mount(page, markup) {
    await page.setContent(markup);
    await page.addScriptTag({ path: scriptPath });
    await expect(page.locator('accordion-item:not([ready])')).toHaveCount(0);
}

async function expectNativeState(item, expanded) {
    if ( expanded ) {
        await expect(item).toHaveAttribute('expanded');
    } else {
        await expect(item).not.toHaveAttribute('expanded');
    }
    await expect(item.locator(':scope > details')).toHaveJSProperty('open', expanded);
}

test.beforeEach(async ({ page }) => {
    // An error in a queued native toggle can otherwise escape state assertions.
    page.on('pageerror', error => { throw error; });
    page.on('console', message => {
        if ( ['error', 'warning'].includes(message.type()) ) {
            throw new Error(message.text());
        }
    });
});

test('native summary pointer and keyboard activation reflect state and preserve focus', async ({ page }) => {
    await mount(page, `
        <accordion-item>
            <details><summary>Native disclosure</summary><p>Native content</p></details>
        </accordion-item>
    `);
    const item = page.locator('accordion-item');
    const summary = page.getByText('Native disclosure', { exact: true });

    await page.evaluate(() => {
        window.beforeEvents = [];
        document.addEventListener('accordion:before-toggle', event => {
            window.beforeEvents.push({
                expanded: event.detail.expanded,
                triggeredExternally: event.detail.triggeredExternally,
                element: event.detail.element.localName
            });
        });
    });

    await summary.click();
    await expectNativeState(item, true);
    await expect(page.getByText('Native content')).toBeVisible();
    await page.getByText('Native content').click();
    await expectNativeState(item, true);
    await summary.focus();
    await page.keyboard.press('Enter');
    await expectNativeState(item, false);
    await expect(summary).toBeFocused();
    await page.keyboard.press('Space');
    await expectNativeState(item, true);
    await expect(summary).toBeFocused();
    await expect.poll(() => page.evaluate(() => window.beforeEvents)).toEqual([
        { expanded: false, triggeredExternally: false, element: 'summary' },
        { expanded: true, triggeredExternally: false, element: 'summary' },
        { expanded: false, triggeredExternally: false, element: 'summary' }
    ]);
});

test('initial host and native state, external attributes and rapid changes stay synchronized', async ({ page }) => {
    await mount(page, `
        <accordion-item id="host" expanded="true">
            <details><summary>Host initially open</summary><p>Host content</p></details>
        </accordion-item>
        <accordion-item id="native">
            <details open><summary>Native initially open</summary><p>Native content</p></details>
        </accordion-item>
    `);
    const item = page.locator('#host');
    await expectNativeState(item, true);
    await expectNativeState(page.locator('#native'), true);

    await item.evaluate(element => element.removeAttribute('expanded'));
    await expectNativeState(item, false);
    await item.evaluate(element => element.setAttribute('expanded', 'false'));
    await expectNativeState(item, true); // Boolean presence, even with value "false".
    await item.evaluate(element => element.setAttribute('expanded', 'another-value'));
    await expectNativeState(item, true);

    await item.locator('details').evaluate(details => { details.open = false; });
    await expectNativeState(item, false);
    await item.locator('details').evaluate(details => { details.open = true; });
    await expectNativeState(item, true);

    await item.evaluate(element => {
        element.removeAttribute('expanded');
        element.setAttribute('expanded', '');
        element.removeAttribute('expanded');
        element.querySelector('details').open = true;
    });
    await expectNativeState(item, true);

    // Reconnection must not register a second set of listeners.
    await item.evaluate(element => {
        element.remove();
        document.body.append(element);
    });
    await item.locator('summary').click();
    await expectNativeState(item, false);
});

test('native single-select grouping reflects automatic sibling closure', async ({ page }) => {
    await mount(page, `
        <accordion-items single-select>
            <accordion-item id="one"><details><summary>First</summary><p>One</p></details></accordion-item>
            <accordion-item id="two"><details><summary>Second</summary><p>Two</p></details></accordion-item>
        </accordion-items>
    `);
    const first = page.locator('#one');
    const second = page.locator('#two');
    await first.locator('summary').click();
    await expectNativeState(first, true);
    await second.locator('summary').click();
    await expectNativeState(second, true);
    await expectNativeState(first, false);
    await first.locator('details').evaluate(details => { details.open = true; });
    await expectNativeState(first, true);
    await expectNativeState(second, false);
    await second.evaluate(element => element.setAttribute('expanded', 'true'));
    await expectNativeState(second, true);
    await expectNativeState(first, false);
});

test('single-select host reflection works without native name support', async ({ page }) => {
    await mount(page, `
        <accordion-items single-select>
            <accordion-item id="one"><details><summary>First</summary><p>One</p></details></accordion-item>
            <accordion-item id="two"><details><summary>Second</summary><p>Two</p></details></accordion-item>
        </accordion-items>
    `);
    // Removing names exercises the host-driven fallback independently of browser support.
    await page.locator('details').evaluateAll(elements => {
        elements.forEach(element => element.removeAttribute('name'));
    });
    await page.locator('#one summary').click();
    await expectNativeState(page.locator('#one'), true);
    await page.locator('#two summary').click();
    await expectNativeState(page.locator('#two'), true);
    await expectNativeState(page.locator('#one'), false);
});

test('native name grouping synchronizes hosts without a single-select parent', async ({ page }) => {
    await mount(page, `
        <accordion-item id="one"><details name="shared"><summary>First</summary><p>One</p></details></accordion-item>
        <accordion-item id="two"><details name="shared"><summary>Second</summary><p>Two</p></details></accordion-item>
    `);
    await page.locator('#one summary').click();
    await expectNativeState(page.locator('#one'), true);
    await page.locator('#two summary').click();
    await expectNativeState(page.locator('#two'), true);
    await expectNativeState(page.locator('#one'), false);
});

test('nested native disclosure interaction does not toggle its parent', async ({ page }) => {
    await mount(page, `
        <accordion-item id="outer"><details open><summary>Outer</summary>
            <accordion-item id="inner"><details><summary>Inner</summary><p>Inner content</p></details></accordion-item>
        </details></accordion-item>
    `);
    await page.locator('#inner summary').click();
    await expectNativeState(page.locator('#inner'), true);
    await expectNativeState(page.locator('#outer'), true);
});

test('custom button panels keep ARIA and visibility synchronized', async ({ page }) => {
    await mount(page, `
        <accordion-item><button>Custom disclosure</button><div><p>Custom content</p></div></accordion-item>
    `);
    const item = page.locator('accordion-item');
    const trigger = page.getByRole('button', { name: 'Custom disclosure' });
    const content = page.getByText('Custom content');
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await expect(content).toBeHidden();
    await trigger.click();
    await expect(item).toHaveAttribute('expanded');
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await expect(content).toBeVisible();
    await content.click();
    await expect(item).toHaveAttribute('expanded');
    await item.evaluate(element => element.removeAttribute('expanded'));
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await expect(content).toBeHidden();
    await item.evaluate(element => element.setAttribute('expanded', ''));
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await expect(content).toBeVisible();
});

const templateModes = {
    default: '<accordion-item template></accordion-item>',
    named: `
        <template id="custom"><div class="disclosure">
            <button class="trigger">Named</button><div class="panel">Content</div>
        </div></template>
        <accordion-item template="custom"></accordion-item>
    `,
    slotted: `
        <accordion-item template>
            <button slot="trigger">Slotted</button><div slot="panel">Content</div>
        </accordion-item>
    `,
    declarative: `
        <accordion-item><template shadowrootmode="open"><div class="disclosure">
            <button class="trigger">Shadow</button><div class="panel">Content</div>
        </div></template></accordion-item>
    `
};

for ( const [mode, markup] of Object.entries(templateModes) ) {
    test(`${mode} template preserves trigger and external state control`, async ({ page }) => {
        await mount(page, markup);
        const item = page.locator('accordion-item');
        const trigger = page.getByRole('button');
        const panel = item.locator(mode === 'slotted' ? '[slot="panel"]' : '.panel');
        await expect(trigger).toHaveAttribute('aria-expanded', 'false');
        await expect(panel).toBeHidden();
        await trigger.click();
        await expect(item).toHaveAttribute('expanded');
        await expect(trigger).toHaveAttribute('aria-expanded', 'true');
        await expect(panel).toBeVisible();
        await item.evaluate(element => element.removeAttribute('expanded'));
        await expect(trigger).toHaveAttribute('aria-expanded', 'false');
        await expect(panel).toBeHidden();
        await item.evaluate(element => element.setAttribute('expanded', ''));
        await expect(trigger).toHaveAttribute('aria-expanded', 'true');
        await expect(panel).toBeVisible();
    });
}

test('native demo retains usable summary controls without JavaScript', async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    try {
        const page = await context.newPage();
        await page.goto(demoURL);
        const item = page.locator('accordion-item:has(> details)').first();
        const details = item.locator(':scope > details');
        await item.locator('summary').click();
        await expect(details).toHaveAttribute('open');
        await expect(details.locator('div')).toBeVisible();
        await item.locator('summary').press('Enter');
        await expect(details).not.toHaveAttribute('open');
        await expect(page.getByRole('region', { name: 'Frequently Asked Questions', exact: true })
            .getByText('Meet the exact needs of the user.')).toBeVisible();
    } finally {
        await context.close();
    }
});
