customElements.define( 'accordion-item', class FoundationishAccordion extends HTMLElement {

    /**
     *  Fields
     */

    openedState = false;

    attr = {
        ready: "ready",
        opened: "expanded",
        template: "template"
    };

    panelID = false;

    // Internal flag used to distinguish event-driven attribute updates from external changes
    triggeredExternally = true;


    // Cache for details name attribute support (runs once across all instances)
    static detailsNameSupport = null;


    // Cached detect parent accordion-items element for single-select attribute
    static singleSelectSupport = null;

    #defaultTemplateStyles = `
        <style>
            :host {
                --test: red;
                border-radius: var(--fndish-disclosure-radius, 4px);
            }

            /*
                Select light DOM content that has been slotted
                into the shadow DOM.
            */

            :host slot[name="panel"]::slotted(div) {
                background: darkblue;
                padding-top: 1rem !important;
            }

            slot[name="panel"]::slotted(section) {
                background: blue;
                padding: 1rem !important;
            }

            slot[name="trigger"]::slotted(button) {
                margin-block-end: 0 !important;
            }

            .disclosure {
                border: var(--fndish-disclosure-border, 1px solid #ccc);
                border-radius: var(--fndish-disclosure-radius, 4px);
                overflow: clip;
            }

            accordion-item[expanded] {
                --fndish-disclosure-radius: 1px;
            }

            button {
                padding: var(--fndish-disclosure-padding, 0.5rem);
                padding-inline-start: 14px;

                cursor: pointer;
                appearance: none;
                background: none;
                position: relative;
                color: light-dark(black, white);
                font-weight: bold;

                display: flex;
                flex-flow: row wrap;
                align-items: center;
                justify-content: space-between;
                padding-inline-start: calc(14px/16px*1rem);
                width: 100%
            }

            button::after {
                content: "";
                border-right: 2px solid black;
                border-bottom: 2px solid black;
                margin-right: 7.2px;
                /* margin-left: auto; */
                transform: translate(-1px, -0.5px) rotate(-45deg);

                position: relative;
                display: inline-block;
                width: 7px;
                height: 7px;
                transition: 0.075s transform ease-out;
                pointer-events: none;
            }

            button[aria-expanded="true"]::after {
                transform: translate(-1px, -0.5px) rotate(var(--expanded-icon-rotation, 45deg));
            }

            .disclosure:has([aria-expanded="true"]) button {
                color: var(--accordion-open-summary-color, #007BFF);
                }

            .disclosure button {
                outline:1px solid red;
            }

            div[id] {
                padding: var(--fndish-disclosure-padding);
                padding-block-start: 0;
                padding-block-end: 1.05rem;
                padding-inline-start: 1rem;

                & p {
                    margin-block-end: 0;
                }
            }

            :where(summary + div),
            summary::details-content {
                padding: var(--fndish-disclosure-padding);
                padding-block-start: 0;
            }


        </style>
    `;

    #defaultTemplate = `
        ${this.#defaultTemplateStyles}

        <div class="disclosure" role="group" part="disclosure">
            <slot name="trigger">
                <button class="trigger" part="trigger">
                    <slot name="trigger-label">Default Label</slot>
                </button>
            </slot>
            <slot name="panel">
                <div class="panel" part="panel">
                    <slot name="panel-content">
                        <p>Default panel content.</p>
                        <p>Styled using ::part()</p>
                    </slot>
                </div>
            </slot>
        </div>
    `;


    /**
     *  Attributes
     */

    /* Watch for attribute changes */
    static get observedAttributes () {
        return ['ready', 'expanded', 'template'];
    }

    /* When attributes change then do something */
    attributeChangedCallback ( attrName, oldValue, newValue ) {

        /* Custom HTML is provided */
        if ( this.detectCustomHTML() && !this.hasTemplateAttr() ) {

            switch ( attrName ) {

                case 'expanded':

                    // ADDED
                    if ( newValue === '' ) {

                        // Update aria for trigger and panel
                        this.expandedAttrHandler().setAria();

                        /* Except for the target, close all disclosures */
                        if ( this.hasSingleSelectAttribute() ) {
                            this.expandedAttrHandler().closeAll();
                        }

                    // REMOVED
                    } else if ( newValue === null ) {

                        // Update aria for trigger and panel
                        this.expandedAttrHandler().setAria();

                    }

                    break;

                default:
                    break;
            }

        }

         /* Details element is provided */
        if ( this.detectHTMLDetails() && !this.hasTemplateAttr() ) {

            switch ( attrName ) {

                case 'expanded':

                    // ADDED
                    if ( newValue === '' ) {

                        // let openAttr = this.querySelector('details').hasAttribute('open');
                        // if ( ! openAttr ) this.querySelector('details').setAttribute('open', '');

                         /* Except for the target, close all disclosures */
                        if ( this.hasSingleSelectAttribute() ) {
                            this.expandedAttrHandler().closeAll();
                        }

                        if ( this.triggeredExternally === true ) {
                            this.querySelector('details').setAttribute('open','');
                        }

                        this.triggeredExternally = true;

                    // REMOVED
                    } else if ( newValue === null ) {

                        console.log(`REMOVED, this.triggeredExternally: ${this.triggeredExternally}`);

                        if ( this.triggeredExternally === true ) {
                            this.querySelector('details').removeAttribute('open');
                        }

                        this.triggeredExternally = true;

                    }

                    break;

                default:
                    break;
            }

        }

        /* [template] */
        if ( this.hasTemplateAttr() ) {

            switch ( attrName ) {

                case 'expanded':

                    let trigger = this.shadowRoot.querySelector('slot[name="trigger"]').assignedElements({ flatten: true })[0];

                    let panel = this.shadowRoot.querySelector('slot[name="panel"]').assignedElements({ flatten: true })[0];

                    // ADDED
                    if ( newValue === '' ) {

                        // Update aria for trigger and panel
                        this.expandedAttrHandler().setAria(trigger,panel);

                        /* Except for the target, close all disclosures */
                        if ( this.hasSingleSelectAttribute() ) {
                            this.expandedAttrHandler().closeAll();
                        }

                    // REMOVED
                    } else if ( newValue === null ) {

                        // Update aria for trigger and panel
                        this.expandedAttrHandler().setAria(trigger,panel);

                    }

                    break;

                default:
                    break;
            }

        }

        /* Declarative Shadow Root */
        else if ( !!this.shadowRoot ) {

            switch ( attrName ) {

                case 'expanded':

                    let trigger = this.shadowRoot.querySelector('.trigger') ?? this.shadowRoot.querySelector('button[aria-expanded]');

                    let panel = this.shadowRoot.querySelector('.panel') ?? this.shadowRoot.querySelector('button ~ [id]');

                    // ADDED
                    if ( newValue === '' ) {

                        // Update aria for trigger and panel
                        this.expandedAttrHandler().setAria(trigger,panel);

                        /* Except for the target, close all disclosures */
                        if ( this.hasSingleSelectAttribute() ) {
                            this.expandedAttrHandler().closeAll();
                        }

                    // REMOVED
                    } else if ( newValue === null ) {

                        // Update aria for trigger and panel
                        this.expandedAttrHandler().setAria(trigger,panel);

                    }

                    break;

                default:
                    break;
            }

        }
    }


    /**
     *  Constructor
     */

    constructor() {
        super();
    }


    /**
     *  1. When connected to the DOM, run the init() method when ready.
     */

    connectedCallback() {
        this.ready();
    }

    ready() {
         /*
            document.readyState values:
            'loading'	    Document is still loading, DOM is not yet ready
            'interactive'	DOM is ready, but stylesheets/images may still be loading
            'complete'	    Everything is loaded (like window.onload)

            If your connectedCallback() fires after the DOM is already loaded (which often happens with dynamically created elements or async script loading), there's no point waiting for DOMContentLoaded—it's never going to fire again. So the function:

            1. Checks first: Is the DOM already ready? → Call init() immediately
            2. If not: Wait for DOMContentLoaded event → Then call init()

            This prevents your component from hanging if the DOM is already in the 'interactive' or 'complete' state.
        */

        // DOM is ready NOW, so init immediately
        if ( document.readyState !== 'loading' ) {
            this.init();
            return;
        }

        // Otherwise wait until the DOM is ready; Safe to query/manipulate DOM elements now. Unlike window.onload, this does not wait for stylesheets, images and fonts to load.
        document.addEventListener('DOMContentLoaded', () => {
            this.init();
        }, { once: true });
    }

    /**
     *  When initialized, do a great many things.
     *  1. Don't run if already initialized
     *  2. Get settings
     *  3. Render the markup
     *  4. iv. On "Ready" updates
     */

    init() {

        // Don't run if already initialized
        if ( this.hasAttribute( this.attr.ready ) ) return;

        // Run setup() and if it returns false, stop initialization.
        if ( ! this.setup() ) {
            return;
        }

        // Run render() and if it returns false, stop initialization.
        if ( ! this.render() ) {
            return;
        }

        // Set the "is-ready" attribute to indicate that the component is ready to use
        this.setAttribute( this.attr.ready, "");
    }


    /**
     *  3. Setup
     */

    setup() {
        // Ready to go! emit a custom event: "accordionitem:is-ready"
        this.emitReadyEvent();

        //this.setComponentOpenedAttribute();

        // Return something to detect inside init()
        return true;
    }


    /**
     *  4. Render
     */

    render() {
        let { log } = console;

        // Detect provided custom markup for a disclosure pattern
        // using a button and a div
        if ( this.detectCustomHTML() && !this.hasTemplateAttr() ) {
            this.setAttribute('type','custom');
            this.#renderCustomHTMLDisclosure().setWrapperForDisclosure();
            this.#renderCustomHTMLDisclosure().setAttsForDisclosure();
        }

        // Detect 'details' element
        if ( this.detectHTMLDetails() && !this.hasTemplateAttr() ) {
            this.setAttribute('type','details');
            this.supportsDetailsName();
            this.#renderHTMLDetailsDisclosure();
        }

        // Has [template]
        // NOTE: Detect [slot] of any children then halt this.detectCustomHTML() ?
        if ( this.hasTemplateAttr() ) {

            this.setAttribute('type','default-template');

            const hasDeclarativeShadowRoot = !!this.shadowRoot;

            const hasProvidedTemplate = this.querySelector('template');

            const hasChildElements = this.children.length > 0;

            const hasTemplateAttr = this.hasAttribute('template');

            const setShadowDOM = ( mode = "open" ) => this.shadowRoot ?? this.attachShadow({ mode: mode });

            if ( hasTemplateAttr ) {

                setShadowDOM();

                const template = document.createElement("template");

                template.innerHTML = this.#defaultTemplate;

                /**
                 * Use a DocumentFragment instead of assigning directly with innerHTML.
                 *
                 * The template's .content is a DocumentFragment, which lets the browser
                 * parse the markup once, build the DOM nodes off-document, and then append
                 * them into the shadow root in a single operation. This is generally cleaner
                 * and more performant than repeatedly touching the live DOM.
                 */
                const fragment = template.content.cloneNode(true);

                this.shadowRoot.appendChild(fragment);

                this.#renderCustomHTMLDisclosure().setAttsForDisclosure();
            }

        }

        // Has Declarative Shadow Root
        else if (!!this.shadowRoot) {
            this.#renderCustomHTMLDisclosure().setAttsForDisclosure();
        }



        // Event listeners for details toggle and custom disclosure click
        // this.onToggleEvent();
        this.delegateEvents();

        // Return something to detect inside init()
        return true;
    }

    #renderCustomHTMLDisclosure() {

        // Generate a unique ID for the panel if it doesn't already have one
        let _generateUniqueID = () => {
            //return "disclosure-panel-" + Math.random().toString(36).substr(2, 9);
            let id = Math.floor(Math.random() * 100000);

            // Make sure it's not already in use
            let suffix = 0;
            let existing = document.querySelector(`#fndish-panel-${id}`);
            while (existing) {
                suffix++;
                existing = document.querySelector(
                    `#fndish-panel-${id}_${suffix}`,
                );
            }

            // Set the ID on the element
            return `fndish-panel-${id}${suffix ? `_${suffix}` : ""}`;
        }

        // wrap the existing child HTML in a custom disclosure pattern using a button and a div
        let setWrapperForDisclosure = () => {
            let wrapper = document.createElement("div");
            wrapper.classList.add("disclosure");
            wrapper.setAttribute("role", "group");

            while (this.firstChild) {
                wrapper.appendChild(this.firstChild);
            }

            this.appendChild(wrapper);
        };

        // Set the necessary ARIA attributes on the button and panel for accessibility
        let setAttsForDisclosure = ( button, content ) => {
            const root = this.shadowRoot ?? this;

            let trigger = button || root.querySelector(".disclosure > button"),
                panel = content || root.querySelector(".disclosure > div");

            console.log(trigger,panel);

            if (trigger === null) {
                let triggerSlot = root.querySelector('slot[name="trigger"]');
                trigger = triggerSlot.assignedElements({ flatten: true })[0];
            }

            if (panel === null) {
                let panelSlot = root.querySelector('slot[name="panel"]');
                panel = panelSlot.assignedElements({ flatten: true })[0];
                console.log(panel);
            }


            if (!panel.id) {
                root.panelID = _generateUniqueID();
                panel.id = root.panelID;
            }

            if (
                !trigger.hasAttribute("aria-controls")
                || trigger.getAttribute("aria-controls") !== `#${panel.id}`
            ) {
                trigger.setAttribute("aria-controls", panel.id);
            }

            if ( !trigger.hasAttribute("aria-expanded") ) {
                trigger.setAttribute("aria-expanded", "false");
            }

            if (trigger.getAttribute("aria-expanded") === "false") {
                panel.setAttribute("hidden", "");
            } else {
                panel.removeAttribute("hidden");
            }

            if ( this.hasAttribute( this.attr.opened ) ) {
                trigger.setAttribute("aria-expanded", "true");
                panel.removeAttribute("hidden");
            }
        }

        return {
            setWrapperForDisclosure,
            setAttsForDisclosure
        }

        //setWrapperForDisclosure();

        //setAttsForDisclosure();

        // addWiringForDisclosure();
    }

    #renderHTMLDetailsDisclosure() {

        if ( this.querySelector('details').hasAttribute('open') ) {
            this.setAttribute('expanded', '');
        }

        if ( this.hasAttribute('expanded') ) {
            this.querySelector('details').setAttribute('open', '');
        }


        /*
            Add the name attr and the same value for each to enable expansion of one disclosre at a time

            NOTE:
                If the browser supports the name attribute on details elements, we can rely on
                native grouping behavior. We just need to ensure that all details elements within
                the same accordion-items parent have the same name value.
        */

        if ( this.hasSingleSelectAttribute() ) {

            if ( this.supportsDetailsName() ) {

                const detailsElements = Array.from(
                    this.closest('accordion-items')?.querySelectorAll('accordion-item details')
                );

                if ( detailsElements && detailsElements.length > 0 ) {

                    let id = `fndish-details-${Math.random().toString(36).substr(2, 9)}`;

                    for ( const detail of detailsElements ) {

                        // Skip element if there is no name attr or the value is empty.
                        if (
                            ! detail.hasAttribute( 'name' )
                            || detail.getAttribute( 'name' ).trim() === ''
                        ) continue;

                        // Use the value of the first element with a name attr.
                        id = detail.getAttribute('name');
                        break;

                    }

                    detailsElements.forEach( detail => {
                        detail.setAttribute( 'name', id );
                    });
                }

            }

            // TODO: No support for [name] then close all other details elements when one is opened, to mimic the single-select behavior.
            else {

            }
        }
    }


    /*
        Events
    */

    emitReadyEvent() {
        this.dispatchEvent(
            new CustomEvent('accordionitem:is-ready', {
                bubbles: true,
                cancelable: false,
                detail: {
                    openedState: this.openedState
                }
            } )
        );
    }

    emitBeforeToggleEvent() {
        this.dispatchEvent( new CustomEvent( 'accordion:before-toggle', {
            bubbles: true,
            composed: true, // event can cross shadow DOM boundaries
            detail: {
                element: event.target,
                expanded: this.hasAttribute( this.attr.opened ),
                triggeredExternally: this.triggeredExternally
            }
        } ) );
    }

    delegateEvents() {

        /* On Click: Update WC attr to run attributeChangedCallback */
        this.addEventListener( 'click', ( event ) => {

            this.triggeredExternally = false;

            this.emitBeforeToggleEvent();

            if ( this.hasAttribute( this.attr.opened ) ) this.removeAttribute( this.attr.opened );

            else this.setAttribute( this.attr.opened, '' );

        } );

        /* On Toggle: Update WC attr to run attributeChangedCallback */
        // this.addEventListener("toggle", (event) => {

        //     console.log('toggle');

        //     if ( this.hasAttribute( this.attr.opened ) ) this.removeAttribute( this.attr.opened );

        //     else this.setAttribute( this.attr.opened, '' );

        // } );

        this.addEventListener( 'accordion:before-toggle', event => {
            setTimeout(function () {
                return true;
            }, 10000);
        });
    }


    /*
        Handlers
    */

    expandedAttrHandler() {

        let root = this.shadowRoot ?? this;

        let setAria = (
            trigger = root.querySelector(".disclosure > button"),
            panel = root.querySelector(".disclosure > button").nextElementSibling
        ) => {
            // let trigger = target;
            // let panel = trigger.nextElementSibling;
            if ( trigger === null || panel === null ) return;

            if ( trigger.getAttribute("aria-expanded") === "true" ) {
                trigger.setAttribute("aria-expanded", "false");
                panel.setAttribute("hidden", "");

            } else {
                trigger.setAttribute("aria-expanded", "true");
                panel.removeAttribute("hidden");
            }
        };

        let closeAll = () => {

            let accordionItems = this.closest("accordion-items")?.querySelectorAll("accordion-item");

            if ( ! accordionItems ) return;

            [...accordionItems].forEach( item => {

                // Except for the target, close all disclosures
                if ( item !== this ) item.removeAttribute(this.attr.opened);

            } );
        }

        return {
            setAria,
            closeAll
        };

    }



    /*
        State
    */

    getStateFromAttr( attrName ) {
        return this.getAttribute( attrName ) ? true : false;
    }

    getOpenedState() {
        let {log} = console;
        if (this.querySelector("details") !== null) {
            return this.querySelector("details").hasAttribute("open") ? true : false;
        } else if (this.querySelector(".disclosure > button") !== null) {
            // Handle custom disclosure logic
            return this.querySelector(".disclosure > button").getAttribute("aria-expanded") === "true" ? true : false;
        } else {
            return false;
        }
    }



    /*
        Attributes
    */

    hasTemplateAttr () {
        return this.hasAttribute('template');
    }


    /*
        Detection
    */

    /* Detect Template */
    detectHTMLTemplate () {
        return this.querySelector('template');
    }

    /* Detect details element */
    detectHTMLDetails() {
        let $details = this.querySelector("details");
        if ( $details ) {
            return !!$details;
        }
    }

    detectCustomHTML() {
        let trigger = this.querySelector("button"),
            panel = this.querySelector("button + div");
        if ( trigger && panel ) {
            return {
                trigger,
                panel
            };
        }
        return false;
    }

    hasSingleSelectAttribute() {
        return this.closest("accordion-items")?.hasAttribute("single-select") ?? false;
    }

    /**
     * Detect if browser supports the name attribute on details elements
     * The name attribute allows multiple details elements to be grouped (only one open at a time)
     * Result is cached to run detection only once across all instances
     * @returns {boolean} True if the browser supports the name attribute on details elements
     */

    supportsDetailsName() {
        let {log} = console;

        // Run once and cache the result in a static property on the class
        // Return cached result if already tested
        if (this.constructor.detailsNameSupport !== null) {
            log(`name support for details elements (cached): ${this.constructor.detailsNameSupport}`);
            return this.constructor.detailsNameSupport;
        }

        // Test actual grouping behavior for same-named details elements.
        // As of May 1, 2026, this feature is missing in older browsers including
        // IE, Chrome/Edge before 120, Firefox before 130, and Safari/iOS Safari before 17.2.
        const container = document.createElement('div');
        const one = document.createElement('details');
        const two = document.createElement('details');
        const groupName = 'foundationish-details-test';

        container.hidden = true;
        one.setAttribute('name', groupName);
        two.setAttribute('name', groupName);
        one.innerHTML = '<summary>One</summary><p>One</p>';
        two.innerHTML = '<summary>Two</summary><p>Two</p>';

        container.append(one, two);
        document.body.appendChild(container);

        one.open = true;
        two.open = true;

        // If grouping is supported, opening one same-named details element closes the other,
        // so support means they should not both remain open at the same time.
        this.constructor.detailsNameSupport = !(one.open && two.open);
        container.remove();

        log(`name support for details elements: ${this.constructor.detailsNameSupport}`);
        return this.constructor.detailsNameSupport;
    }

} );


