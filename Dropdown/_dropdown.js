class AccDropDownMenu {
    /**
     * Class fields.
     */

    #defaultIcon = `<svg width="1em" height="1em" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M5.293 9.707l6 6c0.391 0.391 1.024 0.391 1.414 0l6-6c0.391-0.391 0.391-1.024 0-1.414s-1.024-0.391-1.414 0l-5.293 5.293-5.293-5.293c-0.391-0.391-1.024-0.391-1.414 0s-0.391 1.024 0 1.414z"></path></svg>`;

    #defaultHoverDisplayDelay = 175;

    /**
     * Class constructor
     * @params  {Object}  unnamed  The object used for setting and configuring the class.
     * @prop    {HTMLElement}  nav  The targeted site navgation. Required.
     * @prop    {Boolean}  addHover  Display the dropdowns on hover.
     * @prop    {String}  toggleButtonIcon  Customize the dropdown toggle button icon.
     */

    constructor({ nav, addHover = false, toggleButtonIcon = null, hoverDisplayDelay = 175, onExpandedDropdownCallback = null }) {
        /* Class properties */
        this.icon = toggleButtonIcon ?? this.#defaultIcon;
        this.nav = nav ?? false;
        this.navID = this.utils.generateID('nav-');
        this.jsEnhancedClass = 'nv-js-dropdown-menu';
        this.addHover = addHover ?? false;
        this.hoverDisplayDelay = hoverDisplayDelay ?? this.#defaultHoverDisplayDelay;

        this.onExpandedDropdownCallback = onExpandedDropdownCallback ?? false;

        /* Define variables */
        // let $nav = document.querySelector(this.nav);
        let navID = this.utils.generateID('nav-');
        let jsEnhancedClass = 'nv-js-dropdown-menu';

        /* Add classes and ID's to the navigation element */
        $nav.classList.add('enhanced', jsEnhancedClass);
        $nav.id = navID;

        /* Create Dropdowns */
        this.createDropdowns();

        /* Close Dropdowns */
        this.closeDropdown();

        /* Add hover support */
        this.supportHover();
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
     * getCSSCustomProperty
     * @param  {String}  propertyName  The name of the CSS custom property to retreive.
     * @return {String}  propertyValue  The value of the property.
     */

    get utils() {
        return {
            generateID(prefix = '') {
                return prefix + Math.floor(Math.random() * 999);
            },

            hasFocusWithin(element) {
                return element.contains(document.activeElement);
            },

            getCSSCustomProperty(propertyName) {
                // Get the value of the specified CSS custom property
                let propertyValue = getComputedStyle(document.documentElement).getPropertyValue(`--${propertyName}`) ?? false;

                // Return the property value
                return propertyValue;
            },
        };
    }

    /**
     * Create the disclosure widget for the dropdowns.
     */

    createDropdowns() {
        var _this = this;

        var { nav, navID, icon, jsEnhancedClass, toggleDropdown, onExpandedEvent, onExpandedDropdownCallback } = this;

        var { hasFocusWithin } = this.utils;

        // let $nav = document.querySelector(nav);

        let $listitems = $nav.querySelectorAll('li.menu-item.menu-item-has-children');

        $listitems.forEach(function ($listitem, index) {
            // Get the dropdown sub-menu
            const $dropdown = $listitem.querySelector(':scope > ul');

            // Then add an ID to the dropdown sub-menu
            $dropdown.setAttribute('id', navID + '-list-submenu--' + index);

            // And hide the dropdown sub-menu
            $dropdown.setAttribute('hidden', '');

            // Get the top-level link of the listitem
            let link = $listitem.querySelector(':scope > a');

            // And then add an ID to the link
            link.setAttribute('id', navID + '-anchor--' + index);

            // Create a div which will be used for styling purposes only
            let trigger_wrapper = document.createElement('div');

            // Then add a class
            trigger_wrapper.classList.add('wrapper', 'disclosure', `${jsEnhancedClass}__discloser-trigger-wrapper`);

            // Then wrap the link in the .wrapper div
            $listitem.insertBefore(trigger_wrapper, link);
            trigger_wrapper.appendChild(link);

            // Create a button to be used as the dropdown submenu display toggle.
            let $discloser_trigger = document.createElement('button');
            $discloser_trigger.setAttribute('aria-expanded', 'false');
            $discloser_trigger.setAttribute('aria-labelledby', link.getAttribute('id'));
            $discloser_trigger.setAttribute('aria-controls', $dropdown.getAttribute('id'));
            $discloser_trigger.innerHTML += icon;

            trigger_wrapper.appendChild($discloser_trigger);

            // Create submenu wrapper
            // let panel_wrapper = document.createElement('div');
            // panel_wrapper.classList.add(`${jsEnhancedClass}__discloser-panel-wrapper`);
            // $listitem.insertBefore(panel_wrapper, $dropdown);

            // Listen for a click event on the dropdown submenu display toggle button
            $discloser_trigger.addEventListener('click', function (e) {
                toggleDropdown.call(_this, $discloser_trigger, $dropdown);
            });

            // Listen for an Escape keydown event within the dropdown submenu
            $dropdown.addEventListener(
                'keydown',
                function (e) {
                    // So that only the list itself closes, not its parent list
                    // (in the case of 3+ levels deep nested links)
                    e.stopImmediatePropagation();

                    // Escape key
                    if (e.keyCode === 27 && hasFocusWithin($dropdown)) {
                        toggleDropdown.call(_this, $discloser_trigger, $dropdown);

                        $discloser_trigger.focus();
                    }
                },
                false,
            );
        });
    }

    /**
     *  Toggle the display of the dropdowns.
     */

    toggleDropdown($disclose_trigger_button, $dropdown_submenu) {
        let { onExpandedDropdownCallback } = this;

        let onExpandedDropdownEvent = new CustomEvent('onExpandedDropdown', {
            bubbles: true,
            cancelable: true,
        });

        let onCollapsedDropdownEvent = new CustomEvent('onCollapsedDropdown', {
            bubbles: true,
            cancelable: true,
        });

        // Collapse the dropdown.

        if ($disclose_trigger_button.getAttribute('aria-expanded') === 'true') {
            $disclose_trigger_button.setAttribute('aria-expanded', 'false');

            $dropdown_submenu.setAttribute('hidden', '');

            $disclose_trigger_button.dispatchEvent(onCollapsedDropdownEvent);

            return true;
        }

        // Expand the dropdown.
        else {
            $disclose_trigger_button.setAttribute('aria-expanded', 'true');

            $dropdown_submenu.removeAttribute('hidden');

            $disclose_trigger_button.dispatchEvent(onExpandedDropdownEvent);

            if (onExpandedDropdownCallback !== false) {
                onExpandedDropdownCallback($disclose_trigger_button, $dropdown_submenu);
            }

            return false;
        }
    }

    /**
     *  Close dropdowns.
     *  Setup additional settings for when to hide the dropdowns using a keyboard input.
     */

    closeDropdown() {
        var { nav } = this;

        var { hasFocusWithin } = this.utils;

        // let $nav = document.querySelector(nav);

        let $dropdowns = $nav.querySelectorAll('li.menu-item.menu-item-has-children > ul');

        // If user tabs out of the navigation, close all open $dropdowns
        document.addEventListener('keyup', function (event) {
            let target = event.target;

            // Tab key
            if (event.keyCode === 9 && !hasFocusWithin($nav)) {
                $dropdowns.forEach(function (dropdown) {
                    dropdown.setAttribute('hidden', '');

                    let btn = dropdown.parentNode.querySelector('button');

                    btn.setAttribute('aria-expanded', 'false');
                });
            }
        });

        // If the user clicks anywhere outside the navigation, close all open $dropdowns
        window.addEventListener('click', function (event) {
            let target = event.target;

            $dropdowns.forEach(function (dropdown) {
                if (!dropdown.parentNode.contains(target)) {
                    dropdown.setAttribute('hidden', '');

                    let btn = dropdown.parentNode.querySelector('button');

                    btn.setAttribute('aria-expanded', 'false');
                }
            });
        });
    }

    /**
     *  Add hover support devices that are not touch based.
     */

    supportHover(_addHover) {
        let { nav, addHover, hoverDisplayDelay, utils } = this;

        // let $nav = document.querySelector(nav);

        var _addHover = _addHover ?? addHover;

        var _hoverDelay = hoverDisplayDelay;

        // NOTE: fn generated by ChatGPT.
        let convertToMilliseconds = function (timeString) {
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
        };

        if (hoverDisplayDelay == true && utils.getCSSCustomProperty('acc-dropdown-panel-duration') !== false) {
            let cssPropValue = utils.getCSSCustomProperty('acc-dropdown-panel-duration');

            let milliseconds = convertToMilliseconds(cssPropValue) > 0 ? convertToMilliseconds(cssPropValue) : null;

            _hoverDelay = milliseconds ?? _hoverDelay;
        } else if (hoverDisplayDelay == false) {
            _hoverDelay = 0;
        }

        if (addHover && 'ontouchstart' in document.documentElement == false) {
            let mouseDropdownHandler = function (ev) {
                let $el = ev.target;

                setTimeout(() => $el.querySelector('.wrapper > button').click(), _hoverDelay);
            };

            // Add hover only to the top level links

            let $toplevel_listitems = $nav.querySelectorAll(':scope > ul > li.menu-item.menu-item-has-children');

            $toplevel_listitems.forEach(function ($listitem, index) {
                $listitem.addEventListener('mouseenter', function (event) {
                    mouseDropdownHandler(event);
                });

                $listitem.addEventListener('mouseleave', function (event) {
                    let $btn = event.target.querySelector('.nv-js-dropdown-menu__discloser-trigger-wrapper > button[aria-expanded]') ?? false;

                    // Prevent the display of the submenu if it is closed using the disclosure toggle.
                    if ($btn.getAttribute('aria-expanded') == 'true') {
                        mouseDropdownHandler(event);
                    }
                });
            });
        }
    }
}

let navDropdowns = new AccDropDownMenu({
    nav: '.site-navigation',
    addHover: false,
    hoverDisplayDelay: 250,
    toggleButtonIcon: `<svg aria-hidden="true" width="1em" height="1em" fill="currentColor" viewBox="0 0 448 512"><path d="M201.4 342.6c12.5 12.5 32.8 12.5 45.3 0l160-160c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L224 274.7 86.6 137.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l160 160z"/></svg>`,
});

document.querySelector('.site-navigation').addEventListener('onExpandedDropdown', function (e) {
    let { target } = e;

    target.closest('.menu-item').classList.add('menu-item--submenu-is-open');
});

document.querySelector('.site-navigation').addEventListener('onCollapsedDropdown', function (e) {
    let { target } = e;

    target.closest('.menu-item').classList.remove('menu-item--submenu-is-open');
});
