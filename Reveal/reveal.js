customElements.define( 'reveal-dialog', class FoundationishReveal extends HTMLElement {

    /**
     *  Fields
     */

    attr = {
        ready: "ready",
        opened: "expanded",
        template: "template"
    };

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

        // DOM is not loading and is now ready, so initialize.
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

        let $trigger = this.querySelector('[data-open]');

        let $dialog = $trigger
                        ? this.querySelector( '#' + $trigger.getAttribute( 'data-open' ) )
                        : false;

        if ( ! $dialog ) return false;

        this.addEventListener( "click", ( event ) => {

            if ( ! (event.target instanceof Element) ) return;

            /**
             * Use closest() so clicks on nested SVG/path elements still resolve
             * to the control that carries the dialog action attributes.
            */
            const $control = event.target.closest('[data-open], [data-close-dialog], [popovertargetaction]');

            if ( ! $control || ! this.contains($control) ) return;

            event.preventDefault();

            let displayHandler = () => {

                // Close button
                if ( $control.getAttribute("popovertargetaction") === "hide" ) {

                    // Close the referenced dialog, or fall back to the nearest open dialog.
                    const closingDialog = $dialog.open ? $dialog : $control.closest('dialog');

                    if ( closingDialog?.open ) {
                        // Shift .close() to this.#closeDialog()
                        // and inside the transitionend handler, so the exit animation can play before the dialog is removed from view.
                        this.#closeDialog(closingDialog, '--reveal-display-timing');
                    }

                    // IMPORTANT: don't fall through (continue on ...) to show logic
                    return;

                }

                // Open modal
                if (
                    ! $dialog.open
                    && ( $control.getAttribute('data-open') === $dialog.id )
                ) {

                    $dialog.classList.remove("closing");
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

        $dialog.addEventListener("cancel", (event) => {
            event.preventDefault();
            this.#closeDialog($dialog, '--reveal-display-timing');
        });

        $dialog.addEventListener("close", (event) => {

            $dialog.classList.remove("closing");
            document.documentElement.classList.remove("has-open-modal");

        });

        return true
    }

    /*
        BUG FIX

        Codex Fixed it.
        The early transitionend was happening because the listener accepted the first transition event that reached the dialog. transitionend bubbles, and { once: true } meant an unrelated/early event could consume the listener before the dialog’s own 2s transition finished.
        I changed Reveal/reveal.js (line 147) so closing now starts the transition before calling close(), filters transitionend to the dialog’s own opacity/transform, and prevents Escape from skipping the animation. I also added the missing closing state in Reveal/reveal.css (line 262).
    */

    #closeDialog ($dialog, customProp = '--reveal-display-timing') {

        // Read and normalize the CSS custom property used by the dialog exit transition.
        const getTimingProp = (prop) => {

            // Custom properties inherit from <reveal-dialog> to the <dialog>.
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

        // Dialog fade-out duration in milliseconds.
        const EXIT_MS = getTimingProp(customProp);

        if ( ! $dialog.open || $dialog.classList.contains("closing") ) return;

        $dialog.classList.add("closing");

        let doneCalled = false;
        let fallbackTimer;

        const finishClose = () => {

            if ( doneCalled ) return;

            doneCalled = true;

            $dialog.removeEventListener("transitionend", onEnd);
            clearTimeout(fallbackTimer);

            // Calling close() removes the top-layer/backdrop only after the exit animation has finished.
            $dialog.classList.remove("closing");
            $dialog.close();

            console.log('Dialog transition ended by watching transitionend events on event.propertyName\'s [opacity, transform]');
        };

        const onEnd = (event) => {
            // transitionend bubbles, so ignore animated descendants inside the dialog.
            if ( event.target !== $dialog ) return;

            // The discrete display/overlay transitions are not reliable close signals.

            /*
                event.propertyName is a property on a TransitionEvent (or AnimationEvent) that gives the name of the CSS property whose transition just completed.

                In your reveal.js code, inside the transitionend handler:

                  - event.propertyName is the CSS property that finished transitioning
                  - the code checks whether it is 'opacity' or 'transform'
                  - that ensures the close logic only runs for the dialog’s own relevant animation, not for unrelated child transitions
            */
            console.log('Transition ended for property:', event.propertyName, ['opacity', 'transform'].includes(event.propertyName));
            if ( ! ['opacity', 'transform'].includes(event.propertyName) ) return;

            finishClose();
        };

        $dialog.addEventListener("transitionend", onEnd);

        // Fallback covers reduced-motion, canceled transitions, and browsers with partial discrete support.
        fallbackTimer = setTimeout(finishClose, EXIT_MS + 50);

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
