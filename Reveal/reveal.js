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


