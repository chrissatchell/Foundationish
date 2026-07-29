```text
╔═╗ ╔═╗ ╦ ╦ ╔╗╔ ╔╦╗ ╔═╗ ╔╦╗ ╦ ╔═╗ ╔╗╔ ╭ ╦ ╔═╗ ╦ ╦ ╮
╠╣  ║ ║ ║ ║ ║║║  ║║ ╠═╣  ║  ║ ║ ║ ║║║ │ ║ ╚═╗ ╠═╣ │
╚   ╚═╝ ╚═╝ ╝╚╝ ═╩╝ ╩ ╩  ╩  ╩ ╚═╝ ╝╚╝ ╰ ╩ ╚═╝ ╩ ╩ ╯
```

# Foundation(ish)
HTML Web Components inspired by the rusty, crusty Foundation framework. Perhaps this is a spiritual successor.

Accessibility and simplicity are central to the project. Its components are designed to be robust, fault-tolerant, and progressively enhanced using vanilla JavaScript.

The web platform itself is the foundation.

## Fault Tolerant

Components begin with meaningful HTML, so the important content is present before
JavaScript runs. An accordion built with `<details>` remains a native, accessible
disclosure without JavaScript; a button-and-panel accordion leaves its content
visible and readable. JavaScript adds the enhanced behaviour—it does not create
or hold the content hostage.

## Portable

Each component is standalone: no runtime dependencies, framework, or build step
is required. They use Custom Elements and built-in browser APIs.

Some repetition is intentional. The accordion supports native `<details>`,
light-DOM button-and-panel markup, declarative Shadow DOM, and templates. Keeping
those paths explicit makes their markup and fallback behaviour easier to inspect
than forcing them through an abstraction that conceals their differences.

## Attribute-Driven State

The host element’s attributes form its small public API. In the accordion,
`[expanded]` is the source of truth: user interaction adds or removes it, and
external code can do the same.

The component observes that change and reflects it into the active markup:
`aria-expanded` and `hidden` for a button-and-panel disclosure, or `open` for a
native `<details>` disclosure. In a `single-select` group, expanding one item
also removes `[expanded]` from the others. This gives the component reactive
state using the Custom Elements attribute lifecycle, without a separate state
library.

## HTML is First Class

Every component here is an *HTML* Web Component, not a JavaScript one. The
distinction is the whole design.

A JavaScript Web Component is an empty tag — `<my-accordion></my-accordion>` —
that relies entirely on script to build and inject its content. Nothing exists
until the JavaScript runs. If it never runs, there's nothing there.

An HTML Web Component is a custom element wrapped around markup that already
works:

```html
<accordion-item>
    <details>
        <summary>Without fuss or bother</summary>
        <div>
            <p>Meet the exact needs of the user.</p>
        </div>
    </details>
</accordion-item>
```

Strip the JavaScript and you still have a working, accessible disclosure widget.
The custom element adds animation, single-select behaviour, and state
management on top. It doesn't manufacture the content.

As Jim Nielsen describes it, HTML Web Components are "a specific design pattern
using native web standards where you write functional, semantic HTML directly
inside a custom element to achieve progressive enhancement." Or, from Go Make
Things: "your markup works immediately and remains accessible even if
JavaScript fails to load, crashes, or is blocked by network issues."

### Core principles

**Progressive enhancement first.** You start with standard, fully functional
HTML. The component enhances what's already on the page.

**JavaScript as a decorator.** Script adds behaviour, interaction, and state —
never the content or the data itself.

**Light DOM by default.** Standard web components lean heavily on the Shadow
DOM for isolation. These don't. Components operate on the light DOM so your CSS
cascades normally, form controls submit normally, and assistive technology sees
ordinary markup. Shadow DOM is available when you want it, opt-in via the
`template` attribute.

**Fault tolerance is the baseline.** A component whose script never arrives
leaves a page that still works — just without the extra behaviour.

### Further reading

- Jeremy Keith — [HTML web components](https://adactio.com/journal/20618)
- Jim Nielsen — [HTML Web Components](https://blog.jim-nielsen.com/2023/html-web-components/)
- Chris Ferdinandi - [HTML Web Components](https://gomakethings.com/articles/html-web-components/)

