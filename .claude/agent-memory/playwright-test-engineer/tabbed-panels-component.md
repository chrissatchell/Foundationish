---
name: tabbed-panels-component
description: Structure, ARIA contract, and reliable locators for the <tabbed-panels> custom element in Tabs/
metadata:
  type: project
---

Custom element defined in `Tabs/tabs.js` (also a newer variant `Tabs/kelp-tabs.js` using `<kelp-tabs>` tag).

**Init behaviour:** On `connectedCallback`, replaces each `<a href="#panel-id">` inside `<ul class="tabs">` with `<button role="tab">`. Sets `role="tablist"` on the `<ul>`. Sets `role="tabpanel"` + `aria-labelledby` on panel divs. Adds `hidden` to inactive panels. Signals completion via `setAttribute('ready', '')`.

**Button IDs:** `tab_${panelId}` — e.g. panel `#default-overview` → tab id `tab_default-overview`

**Attributes on the element:**
- `start="#panel-id"` — selects a non-first tab on load
- `manual` — arrow keys move focus only; Enter/Space required to select
- `vertical` — also enables Up/Down arrow keys (alongside Left/Right)

**Reliable locators (from tests/tabs.spec.js):**
- Scope to a section: `page.getByRole('region', { name: 'Default tabs' })` — works because `<section aria-labelledby="...">` gives an implicit region role
- Tabs: `section.getByRole('tab', { name: 'Overview' })`
- Active panel: `section.getByRole('tabpanel', { name: 'Overview' })` — works only for visible (non-hidden) panels
- Hidden panels: use `page.locator('#panel-id')` — hidden elements are excluded from the a11y tree so getByRole won't find them

**ARIA state:**
- Selected tab: `aria-selected="true"`, no `tabindex` attribute
- Inactive tabs: `aria-selected="false"`, `tabindex="-1"`
- Active panel: no `hidden` attribute
- Inactive panels: `hidden=""`

**Sections in index.html:**
- "Default tabs" — Overview, Features, Support; panel IDs: `#default-overview`, `#default-features`, `#default-support`
- "Starting tab" — start="#start-details"; Summary, Details, Related
- "Manual activation" — manual attribute; One, Two, Three
- "Vertical tabs" — vertical attribute; Profile, Notifications, Security
