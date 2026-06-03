customElements.define(
	'dropdown-menu',
	class FoundationishDropdownMenu extends HTMLElement {

		/**
		 *  Fields
		 */

        #defaultHoverDisplayDelay = 175;

        #defaultIcon = `
            <svg width="1em" height="1em" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="currentColor" d="M5.293 9.707l6 6c0.391 0.391 1.024 0.391 1.414 0l6-6c0.391-0.391 0.391-1.024 0-1.414s-1.024-0.391-1.414 0l-5.293 5.293-5.293-5.293c-0.391-0.391-1.024-0.391-1.414 0s-0.391 1.024 0 1.414z"></path>
            </svg>
        `;

        #defaultNav = this.querySelector('header nav') ?? document.querySelector('header nav');

        static windowListenersRegistered = false;

		attr = {
			ready: 'ready',
			opened: 'opened',
            hoversupport: 'hoversupport',
			template: 'template',
		};

        ids = {
            nav: null,
            anchor: null,
            submenu: null
        }

        trigger = false;
        panel = false;

        icon = this.toggleButtonIcon ?? this.#defaultIcon;

        nav = this.#defaultNav;
        // navID = false;

        addHover = this.addHover ?? false;
        hoverDisplayDelay = this.hoverDisplayDelay ?? this.#defaultHoverDisplayDelay;

        onExpandedDropdownCallback = this.onExpandedDropdownCallback ?? false;

		/**
		 *  Attributes
		 */


		static get observedAttributes() {
			return ['opened', 'nav', 'hoversupport'];
		}

		attributeChangedCallback(attrName, oldValue, newValue) {

			switch (attrName) {

                case 'opened':

                    /* NOTE needed to reverse the order of the conditionals for the addition and removal */

                    // [opened] removed
                    if (newValue === null) {
                        this.openedAttrHandler().setAria();
                    }

                    // [opened] attr added without a value OR a value is set AND the new value is not the same as the old value
					else if (
                        newValue === ''
                        || (
                            newValue !== ''
                            && newValue !== oldValue
                        )
                    ) {
                        this.openedAttrHandler().setAria();
                        // console.log('opened new value');

					}

					break;

                case 'nav':

                    // console.log(newValue);

                    // [nav] removed
                    if (newValue === null) {
                        // console.log('nav attribute removed');
                        this.navAttrHander(false);
                    }

                    // [nav] added or changed
                    else if (newValue === '' || (newValue !== '' && newValue !== oldValue)) {
                        // console.log('nav attribute smeghh');
                        this.navAttrHander();
                    }

                    break;

                case 'hoversupport':

                    console.log('hoversupport="',newValue,'"');

                    // [nav] removed
                    if (newValue === null) {
                        console.log('hov attribute removed');
                        this.hoversupportAttrHander(false);
                    }

                    // [nav] added or changed
                    else if (newValue === '' || (newValue !== '' && newValue !== oldValue)) {
                        console.log('hov attribute added');
                        this.hoversupportAttrHander();
                    }


				default:
					break;

			}
		}


        /**
		 *  Connected
		 */

		connectedCallback() {
			this.ready();
		}

		ready() {
			// DOM is not loading and is now ready, so initialize.
			if (document.readyState !== 'loading') {
				this.init();
				return;
			}

			// Otherwise wait until the DOM is ready;
			// It is safe to query/manipulate DOM elements now.
			// Unlike window.onload, this does not wait for stylesheets,
			// images and fonts to load.
			document.addEventListener( 'DOMContentLoaded', () => {
                this.init();
            }, { once: true });
		}

		init() {
			// Don't run if already initialized
			if (this.hasAttribute(this.attr.ready)) return;

			// Run setup() and if it returns false, stop initialization.
			if (!this.setup()) {
				return;
			}

			// Run render() and if it returns false, stop initialization.
			if (!this.render()) {
				return;
			}

			// Set the "is-ready" attribute to indicate that the component is ready to use
			this.setAttribute(this.attr.ready, '');
		}

		setup() {

            // this.navAttrHander().setID();

			return true;
		}



		/**
		 *  Render
		 */

		render() {
            this.renderDropdownMenu();

            this.renderToggleContainer();

            this.delegateEvents();

            return true;
		}

        renderDropdownMenu() {

            // Get the dropdown sub-menu
            const $submenu = this.querySelector('ul');

            // Bail if the dropdown element does not exist
            if (!$submenu) return false;

            // ID to the dropdown sub-menu
            let id = this.ids.submenu !== null ? this.ids.submenu : this.utils.generateID('fndish-submenu-');
            $submenu.setAttribute('id', id);
            this.ids.submenu = $submenu.id;

            // Set role
            if ( ! $submenu.hasAttribute( 'role' ) ) {
                $submenu.setAttribute( 'role', 'list');
            }

            // And hide the dropdown sub-menu
            $submenu.setAttribute('hidden', '');

            this.panel = $submenu;
        }

        renderToggleContainer() {
            let $toggleContainer = document.createElement('div');
            $toggleContainer.classList.add('dropdown-toggle');

            let {anchor,button} = this.renderToggleControls();

            if ( this.querySelector(`#${this.ids.anchor}`) ) {
                this.insertAdjacentElement('afterbegin', $toggleContainer);
                $toggleContainer.insertAdjacentElement('afterbegin', anchor);
                $toggleContainer.insertAdjacentElement('beforeend', button);
            }

        }

        renderToggleControls( convertToButton = false ) {

            // Get the top-level anchor. The dropdown menu toggle button will be placed adjacent to it in the DOM.
            let $anchor = this.querySelector('a');

            if ($anchor) {
                // And then add an ID to the link
                let id = this.ids.nav !== null ? this.ids.nav + '-anchor' : this.utils.generateID('fndish-anchor-');
                $anchor.setAttribute('id', id);
                this.ids.anchor = $anchor.getAttribute('id');
            }

            let $toggleButton = document.createElement('button');
            $toggleButton.setAttribute('aria-expanded', 'false');
            $toggleButton.setAttribute('aria-labelledby', this.ids.anchor);
            $toggleButton.setAttribute('aria-controls', this.ids.submenu);
            $toggleButton.innerHTML += this.icon;

            this.trigger = $toggleButton;

            return {
                anchor: $anchor,
                button: $toggleButton
            };
        }

        closeAllSubmenus () {
            [ ...document.querySelectorAll( 'dropdown-menu' ) ].forEach( ( $el, i ) => {
                $el.removeAttribute(this.attr.opened);
            });
        }

		/*
            Events
        */

        delegateEvents () {

            const $submenu = this.querySelector(`#${this.ids.submenu}`);

            // click, enter, spacebar
            this.addEventListener( 'click', ( event ) => {

                // console.log(event.target.tagName.toLowerCase());

                /* check for button element and that it exists inside the toggle container */
                if (
                    event.target.tagName.toLowerCase() === 'button'
                    && event.target.closest('.dropdown-toggle')
                ) {

                    if ( this.hasAttribute( this.attr.opened ) ) {

                        this.removeAttribute( this.attr.opened );

                    } else {

                        this.closeAllSubmenus();

                        this.setAttribute( this.attr.opened, '' );

                    }

                }

            });

            // Listen for an Escape keydown event within the dropdown submenu
            $submenu.addEventListener( 'keydown', ( event ) => {

                // So that only the list itself closes, not its parent list
                // (in the case of 3+ levels deep nested links)
                event.stopImmediatePropagation();

                // Escape key
                if (
                    ( event.keyCode === 27 || event.key === 'Escape' )
                    && this.utils.hasFocusWithin($submenu)
                ) {

                    if ( this.hasAttribute( this.attr.opened ) ) this.removeAttribute( this.attr.opened );

                    else this.setAttribute( this.attr.opened, '' );

                    this.trigger?.focus();
                }

            }, false );


             // Listen for Escape when the trigger (toggle button) itself has focus.
            // Keydown on the trigger won't reach the submenu's keydown listener,
            // so capture it at the component level and close the panel.
            this.addEventListener('keydown', (event) => {

                if ( event.key === 'Escape' || event.keyCode === 27 ) {

                    // If the trigger is focused (or event.target is the trigger), close.
                    if ( event.target === this.trigger || this.utils.hasFocusWithin(this.trigger) ) {

                        if ( this.hasAttribute( this.attr.opened ) ) {
                            this.removeAttribute(this.attr.opened);
                        }

                        // keep focus on trigger for accessibility
                        this.trigger?.focus();

                    }
                }
            });

            if ( ! this.constructor.windowListenersRegistered ) {

                this.constructor.windowListenersRegistered = true;

                // TAB key: If user tabs out of the navigation, close all open $dropdowns
                window.addEventListener('keyup', (event) => {
                    console.log('this.nav', this.nav);

                    /* KLUDGE */
                    if ( this.nav === null ) {
                        this.nav = this.#defaultNav;
                    }

                    if (
                        event.keyCode === 9
                        && this.nav
                        && ! this.utils.hasFocusWithin(this.nav)
                    ) {
                        this.closeAllSubmenus();
                    }

                    // var test = [...document.querySelectorAll('dropdown-menu')].some( (el) => {
                    //     return el.utils.hasFocusWithin(el.nav)
                    // });

                    // console.log(test);
                });

                // If the user clicks anywhere outside the navigation, close all open $dropdowns
                window.addEventListener('click', (event) => {

                    // NOTE: Assuming there is nav element that is an ancestor.
                    if ( ! event.target.closest('nav') ) {
                        console.log(event.target.closest('nav'));
                        this.closeAllSubmenus();
                    }
                });
            }

        }

		emitReadyEvent() {
			this.dispatchEvent(
				new CustomEvent('reveal:is-ready', {
					bubbles: true,
					cancelable: false,
					composed: true,
					detail: {
						element: event.target,
					},
				}),
			);
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

        navAttrHander (setID = true) {

            if (setID === false) {
                this.nav.removeAttribute('id');
            }

            /* Setup navigation element ID */
            if (this.getAttribute('nav')?.trim() !== '') {
                this.nav = this.querySelector(this.getAttribute('nav')) ?? document.querySelector(this.getAttribute('nav'));
            }
            if (
                ( setID && this.nav )
                && !this.nav.hasAttribute('id')
            ) {
                this.nav.id = this.ids.nav !== null ? this.ids.nav : this.utils.generateID('fndish-dropdownmenu-');
            }
        }

        openedAttrHandler () {

            let root = this.shadowRoot ?? this;

            let setAria = (
                trigger = root.querySelector(".dropdown-toggle > button"),
                panel = root.querySelector("ul")
            ) => {
                // let trigger = target;
                // let panel = trigger.nextElementSibling;
                if ( trigger === null || panel === null ) return;

                if ( trigger.getAttribute("aria-expanded") === "true" ) {
                    trigger.setAttribute("aria-expanded", "false");
                    panel.setAttribute("hidden", "");

                    /* TODO: track the trigger to reference it later. Use to add focus on the trigger after closing dropdown */

                } else {
                    trigger.setAttribute("aria-expanded", "true");
                    panel.removeAttribute("hidden");
                }
            };

            let closeAll = () => {

                [ ...document.querySelectorAll( 'dropdown-menu' ) ].forEach( ( el, i ) => {
                    el.removeAttribute(this.attr.opened);
                });

            }

            return { setAria };
        }

        hoversupportAttrHander ( addSupport = true ) {

            if ( addSupport ) {
                let cssPropValue = this.utils.getStyleProp('acc-dropdown-panel-duration');
                let milliseconds = '';

                if (cssPropValue) {
                    milliseconds = this.utils.convertToMilliseconds(cssPropValue) > 0
                        ? this.utils.convertToMilliseconds(cssPropValue)
                        : 250;
                }

                if (milliseconds > 0 && 'ontouchstart' in document.documentElement == false) {

                    this.addEventListener('mouseenter', (event) => {
                        setTimeout( () => {
                            this.trigger.click();
                        }, milliseconds);
                    });

                    this.addEventListener('mouseleave', (event) => {
                        if ( this.hasAttribute(this.attr.opened) ) {
                            setTimeout( () => {
                                this.trigger.click();
                            }, milliseconds);
                        }
                    });
                }

                return addSupport;
            }

            this.removeEventListener('mouseenter');
            this.removeEventListener('mouseleave');

        }

        /*
            Detection
        */

        detectChildAnchor() {
            return this.querySelector(':scope > a');
        }

        detectChildButton() {
            return this.querySelector(':scope > button');
        }

        detectChildSubMenu(selector = ':scope > ul') {
            return this.querySelector();
        }

        // detect immediate sibling for submenu, which is the ideal structure for the dropdown component.
        detectSiblingSubMenu() {
            return this.nextElementSibling;
        }

        /* Detect Template */
		detectHTMLTemplate() {
			return this.querySelector('template');
		}



        /**
         * Utilities
         * @return  {Object}  Utility methods
         *
         * generateID
         * @param  {String}  prefix  Add a custom string to the start of the ID.
         * @return {String}
         *
         * hasFocusWithin
         * @param  {HTMLElement}  element  Check if there is focus is within a chosen element.
         * @return {Boolean}
         *
         * getStyleProp
         * @param  {String}  propertyName  The name of the CSS custom property to retreive.
         * @return {String}  propertyValue  The value of the property.
         */

        get utils() {
            let root = this;

            return {
                generateID (prefix = '') {
                    return prefix + Math.floor(Math.random() * 999);
                },

                hasFocusWithin (element) {
                    return element.contains(document.activeElement);
                },

                getStyleProp (propertyName) {
                    console.log(root);
                    // Get the value of the specified CSS custom property
                    let propertyValue = getComputedStyle(root || document.documentElement).getPropertyValue(`--${propertyName}`) ?? false;

                    // Return the property value
                    return propertyValue;
                },

                convertToMilliseconds (timeString) {
                    const [, numericValue, unit] = timeString.match(/^([\d.]+)([a-z]+)$/i) || [];

                    let getConversionFactor = (unit) => {
                        switch (unit.toLowerCase()) {
                            case 'ms':
                                return 1;
                            case 's':
                                return 1000;
                            default:
                                console.error(`Unsupported time unit: ${unit}`);
                                return null; // or handle the error in a way that makes sense for your application
                        }
                    };

                    if (!numericValue || !unit) {
                        console.error('Invalid time string format');
                        return null; // or handle the error in a way that makes sense for your application
                    }

                    const milliseconds = parseFloat(numericValue) * getConversionFactor(unit);
                    return milliseconds;
                },
            };
        }
	}
);
