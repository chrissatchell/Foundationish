customElements.define( 'reveal-dialog', class FoundationishReveal extends HTMLElement {

    /**
     *  Fields
     */

    attr = {
        ready: "ready",
        opened: "expanded",
        template: "template"
    };

    log = console.log;

    /**
     *  Attributes
     */

    /* Watch for attribute changes */
    static get observedAttributes () {
        return ['modal'];
    }

    /* When attributes change then do something */
    attributeChangedCallback ( attrName, oldValue, newValue ) {

        switch ( attrName ) {

            case 'modal':

                // [modal] added
                if ( newValue === '' ) {

                // [modal] removed
                } else if ( newValue === null ) {

                }

                break;

            default:
                break;
        }


    }


    /**
     *  1. When connected to the DOM, run the init() method when ready.
     */

    connectedCallback() {
        this.ready();
    }

    ready() {

        // DOM is not loading and is now READT, so initialize.
        if ( document.readyState !== 'loading' ) {
            this.init();
            return;
        }

        // Otherwise wait until the DOM is ready;
        // It is safe to query/manipulate DOM elements now.
        // Unlike window.onload, this does not wait for stylesheets,
        // images and fonts to load.
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
        // Return something to detect inside init()
        return true;
    }


    /**
     *  4. Render
     */

    render() {

        let {log} = this;

        let $trigger = this.querySelector('[data-open]');

        let $dialog = $trigger
                        ? this.querySelector( '#' + $trigger.getAttribute( 'data-open' ) )
                        : false;

        // log($dialog);

        this.addEventListener( "click", ( event ) => {

            event.preventDefault();

            /**
             * NOTE: Updates to use event.target instead of trigger
             *       so the proper context is captured
             *       and not applied to all button elements (and respective dislogs)
            */


            let displayHandler = () => {

                // Close button
                if ( event.target.getAttribute("popovertargetaction") == "hide" ) {

                    // Close the referenced dialog, or fall back to the nearest open dialog.
                    const closingDialog = $dialog?.open ? $dialog : event.target.closest('dialog');

                    if ( closingDialog?.open ) closingDialog.close();

                    document.documentElement.classList.remove("has-open-modal");

                    // IMPORTANT: don't fall through (continue on ...) to show logic
                    return;

                }

                // Open modal
                if (
                    ! $dialog.hasAttribute( 'open' )
                    && ( event.target.getAttribute('data-open') === $dialog.id )
                ) {

                    $dialog.showModal();

                    document.documentElement.classList.add("has-open-modal");

                }

            };

            // Dialog handler
            if ( $dialog.getAttribute("aria-modal") === "true" ) {

                displayHandler();

            } else {

                console.warn('Dialog is missing aria-modal="true"')

            }


        });

        $dialog.addEventListener("cancel", function (event) {
            if ( document.documentElement.classList.contains("has-open-modal") ) {
                document.documentElement.classList.remove("has-open-modal");
            }
        });

        $dialog.addEventListener("close", function (event) {});

        return true
    }


    #backdrop ($dialog) {

        /* ::backdrop JS (defer .close() until fade finishes) */

        // Find the dialog


        // Read and normalize the CSS custom property used by the backdrop transition.
        const getTimingProp = (prop) => {

            // Use the dialog's computed styles or get the document root.
            const timing = getComputedStyle($dialog ?? document.documentElement)
                // Pull the raw CSS time value, such as "140ms" or "0.14s".
                .getPropertyValue(`${prop}`)
                // Remove surrounding whitespace from the CSS custom property value.
                .trim();

            // Find a number and 'ms' or 's'
            const match = timing.match(/^([\d.]+)(ms|s)$/);

            // If not a match then fall back to 500ms
            if (!match) return 500;

            // Convert the numeric portion of the matched CSS time value into a JavaScript number
            const duration = Number(match[1]);

            // Convert seconds to milliseconds; leave millisecond values unchanged.
            return match[2] === "s" ? duration * 1000 : duration;
        }


        // Backdrop fade-out duration in milliseconds
        const EXIT_MS = getTimingProp('--reveal-backdrop-display-timing');

        console.log(EXIT_MS);

        const closeWithFade = ($dialog) => {

            if ( !$dialog.open || $dialog.classList.contains("closing") ) return;

            $dialog.classList.add("closing");

            // Prefer transitionend; fallback timeout just in case
            let doneCalled = false;

            // now ::backdrop is removed, after fade
            let done = () => {
                $dialog.classList.remove("closing");
                $dialog.close();
            };

            let onEnd = (e) => {

                if ( doneCalled ) return;

                // We can listen on the dialog (for its own opacity/transform) or just time out.
                doneCalled = true;

                $dialog.removeEventListener("transitionend", onEnd);

                done();
            };

            $dialog.addEventListener("transitionend", onEnd, { once: true });

            setTimeout(onEnd, EXIT_MS + 50);
        }

        /*
        EXAMPLES
        Intercept Esc-based closing */

        /*
        if ($dialog) {

            $dialog.addEventListener("cancel", (e) => {
                e.preventDefault(); // stop instant close
                closeWithFade($dialog); // run our exit animation
            });

            $dialog.addEventListener("click", (e) => {
                if (e.target.matches("[data-close-dialog]")) {
                    e.preventDefault();
                    if ($dialog) closeWithFade($dialog);
                }
            });

        }
        */

    }



    /*
        Events
    */

    delegateEvents() {

        this.addEventListener( 'click', ( event ) => {

            this.emitBeforeToggleEvent();

            console.log('clicked');

        } );

        this.addEventListener( 'reveal:before-toggle', event => {
            setTimeout(function () {
                return true;
            }, 10000);
        });
    }

    emitReadyEvent() {
        this.dispatchEvent(
            new CustomEvent('reveal:is-ready', {
                bubbles: true,
                cancelable: false,
                composed: true,
                detail: {
                    element: event.target
                }
            } )
        );
    }

    emitBeforeToggleEvent() {
        this.dispatchEvent( new CustomEvent( 'reveal:before-toggle', {
            bubbles: true,
            composed: true, // event can cross shadow DOM boundaries
            detail: {
                element: event.target,
            }
        } ) );
    }


    /*
        Handlers
    */



    /*
        State
    */



    /*
        Attributes
    */




    /*
        Detection
    */

    /* Detect Template */
    detectHTMLTemplate () {
        return this.querySelector('template');
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

} );
