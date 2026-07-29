# AGENTS.md

These instructions apply to the entire repository.

## Project purpose

Foundation(ish) is a collection of accessible, progressively enhanced HTML Web
Components inspired by Foundation. The web platform is the framework: production
components use vanilla HTML, CSS, and JavaScript and have no runtime dependencies
or build step.

The central design rule is that HTML comes first. Important content and basic
semantics must exist before a custom element upgrades. JavaScript decorates that
markup with richer behaviour, state coordination, and ARIA; it must not be the
only place where content exists.

## Repository map

- `disclosure/` contains the `<accordion-item>` implementation and is the clearest
  expression of the project architecture. It supports native `<details>`, custom
  light-DOM button/panel markup, declarative Shadow DOM, and opt-in templates.
- `tabs/` contains the active `<tabbed-panels>` implementation, demo, styles, and
  the only automated component coverage. `kelp-tabs.js` is a reference/alternate
  implementation that imports utilities not included in this repository; do not
  treat it as the entry point or copy those imports into active code.
- `dropdown/` contains the active `<dropdown-menu>` experiment and several
  historical/demo variants. `dropdown.js` is loaded by `dropdown/index.html`;
  `_dropdown.js` and the inline CodePen version are not automatically kept in
  sync.
- `reveal/` contains the `<reveal-dialog>` experiment plus native dialog/popover
  demos.
- `offcanvas/index.html` is a self-contained prototype with inline CSS and
  JavaScript, not a packaged component module.
- `util/tophatch.js` is an experimental utility file and is not imported by the
  current demos.
- `tests/` contains Playwright tests. At present, coverage is limited to tabs.

Code in this repository has different levels of maturity. Inspect the HTML page
that loads a script before deciding which of several similarly named files is
authoritative. Do not consolidate prototypes, delete variants, or perform a
repo-wide rewrite unless the task explicitly calls for it.

## Component architecture

### Preserve progressive enhancement

- Start from semantic, usable HTML. Prefer native elements such as `<details>`,
  `<summary>`, `<dialog>`, buttons, links, and lists when they provide the needed
  baseline.
- Do not add `hidden` to important source content solely for an enhanced
  interaction. Apply enhanced visibility state only after initialization
  succeeds.
- Keep content in the light DOM by default so normal CSS, form behaviour, and
  assistive-technology traversal continue to work.
- Treat Shadow DOM as opt-in. When editing accordion templates, preserve slots,
  CSS parts, custom templates, and declarative Shadow DOM support.
- A no-JavaScript experience may be simpler, but it must remain understandable
  and must not lose crucial information.

### Keep state observable

Several components expose state through host attributes. In the accordion,
`[expanded]` is the public state: interaction mutates the host attribute, and
`attributeChangedCallback()` reflects it to `aria-expanded`, `hidden`, or the
native `<details open>` state. The dropdown follows the same pattern with
`[opened]`.

When working in an attribute-driven component:

- Route user-driven and external state changes through the same host attribute.
- Include every reactive attribute in `observedAttributes`.
- Handle addition, removal, and meaningful value changes explicitly.
- Keep host state, native element state, ARIA state, and panel visibility in
  sync without creating an attribute-change loop.
- Preserve external control: `setAttribute()` and `removeAttribute()` must work
  without requiring a synthetic click.
- Preserve group behaviour such as an accordion parent’s `[single-select]`.

Tabs currently manage selection directly through ARIA and `hidden` rather than a
host state attribute. Follow the convention of the component being edited; do
not force one component’s state model onto every other component.

### Respect the accordion’s explicit branches

The repetition in `disclosure/accordion.js` is partly intentional. Native
details, custom light DOM, slotted templates, and declarative Shadow DOM have
different roots, triggers, panels, and fallback behaviour. A refactor is only an
improvement if those modes remain easy to inspect and all continue to work.

Before changing accordion state or rendering, check at least:

- a native `<details><summary>…</summary></details>` item;
- a light-DOM `<button>` followed by a `<div>`;
- initial and externally changed `[expanded]` state;
- `[single-select]` grouping;
- default and ID-referenced `[template]` modes;
- declarative Shadow DOM and slotted trigger/panel content;
- ARIA, `hidden`, and `open` synchronization.

## JavaScript conventions

- Use browser-native APIs and modern JavaScript. Do not add a framework, runtime
  library, transpiler, or bundler without explicit approval.
- Keep custom-element initialization idempotent. Follow the local
  `connectedCallback()` → DOM-ready check → `init()` → `setup()`/`render()`
  pattern and guard initialization with the component’s ready attribute.
- If a component registers document/window listeners, ensure reconnection does
  not duplicate them and add cleanup in `disconnectedCallback()` where practical.
- Prefer event delegation and `handleEvent()` for long-lived component
  listeners. Check that an event target belongs to the current component,
  especially for nested components.
- Preserve existing public custom-event names and semantics. Events intended to
  cross Shadow DOM boundaries should use `composed: true`; cancellable “before”
  events must be checked before committing state.
- Generate unique IDs when connecting controls and panels. `aria-controls`
  receives the ID value without a leading `#`.
- Buttons created by JavaScript should normally use `type="button"`.
- Follow the formatting already used in the file being edited. Styles currently
  vary between components; avoid unrelated formatting churn.
- Remove temporary logging when finishing a feature unless the log is part of
  an intentional diagnostic path.

## Accessibility requirements

Accessibility is a behavioural requirement, not a final polish pass.

- Prefer semantic elements and accessible-name-based relationships.
- Keep ARIA synchronized with actual state; ARIA must not claim that a hidden
  panel is visible or vice versa.
- Preserve keyboard operation and focus management. Test Escape, arrow keys,
  Enter/Space where applicable, focus return after close, and tab order.
- Do not replace a native control with a generic element plus ARIA when the
  native control works.
- Respect reduced motion and provide a non-transition fallback for animated
  closing behaviour.
- Test both the enhanced state and the usable pre-enhancement/no-JavaScript
  baseline when changing markup or initialization.

The browser targets and intentional compatibility exceptions are recorded in
`.hintrc`. Review that file before removing use of modern platform features such
as `details[name]`, declarative Shadow DOM, `inert`, or modern dialog behaviour.

## CSS conventions

- Keep styles component-local and dependency-free.
- Follow the existing cascade-layer organization when a component uses it:
  reset, tokens, core, theme, state, utilities, and demo concerns should remain
  distinguishable.
- Prefer CSS custom properties for configurable values and preserve documented
  `::part()` hooks for Shadow DOM consumers.
- The component reset files are local copies and are not all identical. Do not
  bulk-replace them without comparing their contents and verifying every demo.
- Modern CSS, including nesting and platform features allowed by `.hintrc`, is
  acceptable. Always preserve visible focus styles and reduced-motion handling.

## Testing and validation

Install development dependencies with:

```sh
npm install
```

Run all automated tests with:

```sh
npm test
```

Useful focused commands:

```sh
npx playwright test tests/tabs.spec.js
npx playwright test --headed
npx playwright test --ui
```

Playwright opens the static demos with `file://`; there is no local server or
build command. Tests currently run Chromium only. Use semantic locators such as
`getByRole()` and web-first assertions; do not add arbitrary sleeps.

Use the repository’s lowercase directory names in new paths. The existing tabs
spec currently references `Tabs/index.html`, which only works on a
case-insensitive filesystem; correct that path if the spec is otherwise being
edited.

For JavaScript or markup changes:

- Add or update Playwright coverage for the affected user-visible behaviour when
  practical.
- Run `npm test`.
- Manually exercise the relevant demo page when no automated suite covers the
  component.
- Check the browser console for uncaught errors and unexpected warnings.
- Verify keyboard interaction, focus, ARIA state, and the no-JavaScript fallback.

Documentation-only changes do not require browser tests unless they change
embedded runnable examples.

## Change discipline

- Preserve user changes and unrelated experiments in the working tree.
- Keep changes narrowly scoped; do not silently fix every nearby prototype bug.
- Do not edit generated or local artifacts such as `node_modules/`,
  `test-results/`, or `.DS_Store`.
- Do not add runtime dependencies or introduce a build pipeline without explicit
  approval.
- The optional `.githooks/post-checkout` hook can enable sparse checkout based
  on the current branch name. If directories appear to be missing after a branch
  change, inspect sparse-checkout state before concluding they were deleted.
- `LICENSE` is authoritative for licensing. Do not change license metadata as a
  side effect of unrelated work.
