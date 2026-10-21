customElements.define( 'ish-disclosure', class FoundationishAccordion extends HTMLElement {

    /**
     *  Fields
     */


    expanded = false;

    // Internal flag used to distinguish event-driven attribute updates from external changes
    triggeredExternally = true;

    // Cache for details name attribute support (runs once across all instances)
    static detailsNameSupport = null;

    attr = {
        ready: "ready",
        opened: "expanded"
    };

    /**
     *  Attributes
     */

    /* Watch for attribute changes */
    static get observedAttributes () {
        return ['ready', 'expanded'];
    }

    /* When attributes change then do something */
    attributeChangedCallback ( attrName, oldValue, newValue ) {

         /* Details element is provided */
        if ( this.detectHTMLDetails() ) {

            switch ( attrName ) {

                case 'expanded':

                    // ADDED
                    if ( newValue !== null ) {

                         /* Except for the target, close all disclosures */
                        if ( this.hasSingleSelectAttribute() ) {
                            this.expandedAttrHandler().closeAll();
                        }

                        if ( this.triggeredExternally === true ) {
                            this.querySelector(':scope > details').setAttribute('open','');
                        }

                        this.triggeredExternally = true;

                    // REMOVED
                    } else if ( newValue === null ) {

                        if ( this.triggeredExternally === true ) {
                            this.querySelector(':scope > details').removeAttribute('open');
                        }

                        this.triggeredExternally = true;

                    }

                    break;

                default:
                    break;
            }

        }

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
        if ( ! this.detectHTMLDetails() ) return false;

        // Ready to go! emit a custom event: "accordionitem:is-ready"
        this.emitReadyEvent();

        // Return something to detect inside init()
        return true;
    }


    /**
     *  4. Render
     */

    render() {
        // Detect 'details' element
        if ( this.detectHTMLDetails() ) {
            this.setAttribute('type','details');
            this.supportsDetailsName();
            this.#renderHTMLDetailsDisclosure();
        }

        this.delegateEvents();

        // Return something to detect inside init()
        return true;
    }

    #renderHTMLDetailsDisclosure () {

        if ( this.querySelector(':scope > details').hasAttribute('open') ) {
            this.setAttribute('expanded', '');
        }

        if ( this.hasAttribute('expanded') ) {
            this.querySelector(':scope > details').setAttribute('open', '');
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
                    this.closest('accordion-items')?.querySelectorAll('ish-disclosure > details')
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
                detail: { expanded: this.expanded }
            } )
        );
    }

    emitBeforeToggleEvent( event ) {
        this.dispatchEvent( new CustomEvent( 'accordion:before-toggle', {
            bubbles: true,
            composed: true, // event can cross shadow DOM boundaries
            detail: {
                element: event.target,
                expanded: this.hasAttribute( this.attr.opened ),
                triggeredExternally: false
            }
        } ) );
    }

    delegateEvents() {

        /* On Click: Notify before the native summary toggles. */
        this.addEventListener( 'click', ( event ) => {

            const details = this.querySelector(':scope > details');
            const summary = details.querySelector(':scope > summary');
            if ( !summary || !summary.contains(event.target) ) return;

            this.emitBeforeToggleEvent( event );

        } );

        /* Native toggles also cover keyboard input and changes to details.open. */
        this.addEventListener( 'toggle', ( event ) => {
            const details = this.querySelector(':scope > details');
            if ( event.target !== details ) return;
            if ( details.open === this.hasAttribute(this.attr.opened) ) return;

            this.triggeredExternally = false;
            this.toggleAttribute( this.attr.opened, details.open );
        }, true );
    }


    /*
        Handlers
    */

    expandedAttrHandler() {

        let closeAll = () => {

            let accordionItems = this.closest("accordion-items")?.querySelectorAll("ish-disclosure");

            if ( ! accordionItems ) return;

            [...accordionItems].forEach( item => {

                // Except for the target, close all disclosures
                if ( item !== this ) item.removeAttribute(this.attr.opened);

            } );
        }

        return {
            closeAll
        };

    }



    /*
        State
    */

    getStateFromAttr( attrName ) {
        return this.getAttribute( attrName ) ? true : false;
    }





    /*
        Detection
    */

    /* Detect details element */
    detectHTMLDetails() {
        let $details = this.querySelector(":scope > details");
        if ( $details ) {
            return !!$details;
        }
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
        // Run once and cache the result in a static property on the class
        // Return cached result if already tested
        if (this.constructor.detailsNameSupport !== null) {
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

        return this.constructor.detailsNameSupport;
    }

} );


