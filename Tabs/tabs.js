customElements.define( 'tabbed-panels', class FoundationishTabs extends HTMLElement {

    /**
     *  Fields
     */

    start = null;

    isManual = false;

    list = null;

    attr = {
        ready: "ready",
        start: "start",
        manual: "manual"
    };


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
        // Reconnect event listeners when an initialized component returns to the DOM.
        if ( this.hasAttribute( this.attr.ready ) ) {
            this.delegateEvents();
            return;
        }

        this.ready();
    }

    disconnectedCallback() {
        this.list?.removeEventListener( 'click', this );
        document.removeEventListener( 'keydown', this );
    }

    ready() {
        // DOM is ready NOW, so init immediately
        if ( document.readyState !== 'loading' ) {
            this.init();
            return;
        }

        // Otherwise wait until the DOM is ready.
        document.addEventListener( 'DOMContentLoaded', () => {
            this.init();
        }, { once: true } );
    }


    /**
     *  When initialized, do a great many things.
     *  1. Don't run if already initialized
     *  2. Get settings
     *  3. Render the markup
     *  4. Add event listeners
     *  5. On "Ready" updates
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
            console.warn( 'FoundationishTabs: No tabs were found.', this );
            return;
        }

        // Listen for events
        this.delegateEvents();

        // Ready to go! Emit a custom event: "tabs:ready"
        this.emitReadyEvent();

        // Set the "ready" attribute to indicate that the component is ready to use
        this.setAttribute( this.attr.ready, "" );
    }


    /**
     *  2. Setup
     */

    setup() {

        // Get settings
        this.start = this.getAttribute( this.attr.start );
        this.isManual = this.hasAttribute( this.attr.manual );

        // Get the tab list
        this.list = this.querySelector( '.tabs' );

        // Return something to detect inside init()
        return !!this.list;
    }


    /**
     *  3. Render
     */

    render() {

        // Get the list items and links
        const listItems = this.list?.querySelectorAll( 'li' ) || [];
        const links = this.list?.querySelectorAll( 'a' );

        // Make sure there's a list and links
        if ( !this.list || !links?.length ) return false;

        // Add ARIA to the list
        this.list.setAttribute( 'role', 'tablist' );

        // Add ARIA to the list items
        for ( const item of listItems ) {
            item.setAttribute( 'role', 'presentation' );
        }

        // Add ARIA to the links and tab panels
        links.forEach( ( link, index ) => {

            // Get the target tab panel
            const panel = this.querySelector( link.hash );

            // If there's no matching panel, remove the link and skip this one
            if ( !panel ) {
                ( link.closest( 'li' ) || link ).remove();

                console.warn(
                    `FoundationishTabs: A tab panel for "${link.textContent.trim()}" with the ID "${link.hash}" could not be found. The corresponding tab was removed.`,
                    this
                );

                return;
            }

            // Determine if this is the active tab
            const isActive = this.start ? this.start === link.hash : index === 0;

            // Create the tab button
            const button = document.createElement( 'button' );
            button.innerHTML = link.innerHTML;
            button.id = link.id || `tab_${panel.id}`;

            // Prevent the button from submitting forms
            button.setAttribute( 'type', 'button' );

            // Add ARIA to the button
            button.setAttribute( 'role', 'tab' );
            button.setAttribute( 'aria-controls', link.hash.slice( 1 ) );
            button.setAttribute( 'aria-selected', isActive ? 'true' : 'false' );

            // If it is not the active tab, prevent focus
            if ( !isActive ) {
                button.setAttribute( 'tabindex', '-1' );
            }

            // Replace the link with the button
            link.replaceWith( button );

            // Add ARIA to the tab panel
            panel.setAttribute( 'role', 'tabpanel' );
            panel.setAttribute( 'aria-labelledby', button.id );

            // If it is not the active panel, hide it
            if ( !isActive ) {
                panel.setAttribute( 'hidden', '' );
            } else {
                panel.removeAttribute( 'hidden' );
            }
        } );

        return true;
    }


    /*
        Events
    */

    delegateEvents() {
        this.list.addEventListener( 'click', this );
        document.addEventListener( 'keydown', this );
    }

    /**
     * Handle events.
     * @param {Event} event The event object
     */
    handleEvent( event ) {

        switch ( event.type ) {
            case 'click':
                this.onClick( event );
                break;

            case 'keydown':
                this.onKeydown( event );
                break;

            default:
                break;
        }
    }

    /**
     * Handle click events.
     * @param {Event} event The event object
     */
    onClick( event ) {

        // Only run on tab buttons
        const button = event.target instanceof Element
            ? event.target.closest( '[role="tab"]' )
            : null;

        if ( !button || !this.list.contains( button ) ) return;

        // Ignore the currently active tab
        if ( button.matches( '[aria-selected="true"]' ) ) return;

        // Toggle tab visibility
        this.select( button );
    }

    /**
     * Handle keydown events.
     * @param {Event} event The event object
     */
    onKeydown( event ) {

        // Only run on keyboard events
        if ( !( event instanceof KeyboardEvent ) ) return;

        // Store next and previous keys
        const keyNext = [ 'ArrowRight' ];
        const keyPrevious = [ 'ArrowLeft' ];

        // Only run for the supported arrow keys
        if ( ![ ...keyNext, ...keyPrevious ].includes( event.key ) ) return;

        // Only run if the focused element is a tab inside the component
        const currentTab = this.list?.querySelector( '[role="tab"]:focus' );
        if ( !currentTab ) return;

        // Prevent page scroll
        event.preventDefault();

        // Get the parent list item
        const listItem = currentTab.closest( 'li' );

        // If next arrow, get the next sibling. Otherwise get the previous.
        const nextListItem = keyNext.includes( event.key )
            ? listItem?.nextElementSibling
            : listItem?.previousElementSibling;

        const nextTab = nextListItem?.querySelector( '[role="tab"]' );
        if ( !nextTab ) return;

        // Shift focus
        nextTab.focus();

        // If not in manual mode, toggle tab visibility
        if ( this.isManual ) return;

        this.select( nextTab );
    }

    emitReadyEvent() {
        this.dispatchEvent(
            new CustomEvent( 'tabs:ready', {
                bubbles: true,
                cancelable: false,
                composed: true
            } )
        );
    }

    emitBeforeSelectEvent( currentTab, currentPanel, nextTab, nextPanel ) {
        return this.dispatchEvent(
            new CustomEvent( 'tabs:select-before', {
                bubbles: true,
                cancelable: true,
                composed: true,
                detail: {
                    currentTab,
                    currentPane: currentPanel,
                    nextTab,
                    nextPane: nextPanel
                }
            } )
        );
    }

    emitSelectEvent( tab, panel ) {
        this.dispatchEvent(
            new CustomEvent( 'tabs:select', {
                bubbles: true,
                cancelable: false,
                composed: true,
                detail: {
                    tab,
                    pane: panel
                }
            } )
        );
    }


    /*
        Handlers
    */

    /**
     * Select a tab and show its panel.
     * @param {Element} tab The tab to select
     */
    select( tab ) {

        // If there is no tab, stop
        if ( !tab ) return;

        // Get the target tab panel
        const panelID = tab.getAttribute( 'aria-controls' );
        const panel = panelID ? this.querySelector( `#${CSS.escape( panelID )}` ) : null;
        if ( !panel ) return;

        // Get the current tab and panel
        const currentTab = tab
            .closest( '[role="tablist"]' )
            ?.querySelector( '[aria-selected="true"]' );

        const currentPanelID = currentTab?.getAttribute( 'aria-controls' );
        const currentPanel = currentPanelID
            ? this.querySelector( `#${CSS.escape( currentPanelID )}` )
            : null;

        // Emit tabs:select-before. If cancelled, do not select the tab.
        if ( !this.emitBeforeSelectEvent( currentTab, currentPanel, tab, panel ) ) {
            return;
        }

        // Update the selected tab
        tab.setAttribute( 'aria-selected', 'true' );
        currentTab?.setAttribute( 'aria-selected', 'false' );

        // Update the visible tab panel
        panel.removeAttribute( 'hidden' );
        currentPanel?.setAttribute( 'hidden', '' );

        // Make sure the selected tab can be focused and other tabs cannot
        tab.removeAttribute( 'tabindex' );
        currentTab?.setAttribute( 'tabindex', '-1' );

        // Emit tabs:select
        this.emitSelectEvent( tab, panel );
    }

} );
