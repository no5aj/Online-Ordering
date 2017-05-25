/*
 * Revel Systems Online Ordering Application
 *
 *  Copyright (C) 2014 by Revel Systems
 *
 * This file is part of Revel Systems Online Ordering open source application.
 *
 * Revel Systems Online Ordering open source application is free software: you
 * can redistribute it and/or modify it under the terms of the GNU General
 * Public License as published by the Free Software Foundation, either
 * version 3 of the License, or (at your option) any later version.
 *
 * Revel Systems Online Ordering open source application is distributed in the
 * hope that it will be useful, but WITHOUT ANY WARRANTY; without even the
 * implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Revel Systems Online Ordering Application.
 * If not, see <http://www.gnu.org/licenses/>.
 */

/**
 * Contains {@link App.Models.Checkout}, {@link App.Collections.DiningOtherOptions} constructors.
 * @module checkout
 * @requires module:backbone
 * @see {@link module:config.paths actual path}
 */
define(["backbone"], function(Backbone) {
    'use strict';

    /**
     * @class
     * @classdesc Represents a checkout model.
     * @alias App.Models.Checkout
     * @augments Backbone.Model
     * @example
     * // create a checkout model
     * require(['checkout'], function() {
     *     var checkout = new App.Models.Checkout();
     * });
     */
    App.Models.Checkout = Backbone.Model.extend(
    /**
     * @lends App.Models.Checkout.prototype
     */
    {
        /**
         * Contains attributes with default values.
         * @type {object}
         * @enum {string}
         */
        defaults: {
            /**
             * A path for relative url of image
             * @type {string}
             */
            img: '',
            /**
             * A pickup time
             * @type {string}
             */
            pickupTime: '',
            /**
             * A pickup time (timestamp)
             * @type {?number}
             */
            pickupTS: null,
            /**
             * Indicates pickup time is ASAP (`true`) or not (`false`)
             * @type {boolean}
             */
            isPickupASAP: false,
            /**
             * ???
             * @type {string}
             */
            special: '',
            /**
             * A section (for 'Stadium' mode)
             * @type {string}
             */
            section: "",
            /**
             * A row (for 'Stadium' mode)
             * @type {string}
             */
            row: "",
            /**
             * A seat (for 'Stadium' mode)
             * @type {string}
             */
            seat: "",
            /**
             * A level (for 'Stadium' mode)
             * @type {string}
             */
            level: "",
            /**
             * @deprecated
             */
            email: "", //TBD: probably remove this field. Customer.email is used now.
            /**
             * A Reward Card number.
             * @type {string}
             */
            rewardCard: '',
            /**
             * A dining option of an order. Available value is one of:
             * - `'DINING_OPTION_TOGO'`
             * - `'DINING_OPTION_EATIN'`
             * - `'DINING_OPTION_DELIVERY'`
             * - `'DINING_OPTION_CATERING'`
             * - `'DINING_OPTION_DRIVETHROUGH'`
             * - `'DINING_OPTION_ONLINE'`
             * - `'DINING_OPTION_OTHER'`
             * - `'DINING_OPTION_SHIPPING'`
             * @type {string}
             */
            dining_option: '',
            /**
             * Stores the value that `dining_option` attribute had before 'DINING_OPTION_ONLINE'. It gets changed when `dining_option` gets changed to 'DINING_OPTION_ONLINE'.
             * @type {string}
             */
            selected_dining_option: '',
            /**
             * Order notes.
             * @type {string}
             */
            notes: '',
            /**
             * Object literal representing a custom dining option.
             * @type {?App.Collections.DiningOtherOptions}
             */
            other_dining_options: null,
            /**
             * A discount code
             * @typeof {string}
             */
            discount_code: '',
            /**
             * A last applied discount code. Used for data restoring after page reload.
             * @typeof {string}
             */
            last_discount_code: ''
        },
        /**
         * Adds listener to track `dining_option` change and inits `other_dining_options` if it exists.
         */
        initialize: function() {
            // set img path
            this.set('img', App.Data.settings.get("img_path"));

            // if dining_option changed on DINING_OPTION_ONLINE previous value should be
            this.listenTo(this, 'change:dining_option', function(model, value) {
                var prev = model.previousAttributes().dining_option;
                // condifion prev != value is needed to handle cases of forced change:dining_option emissions
                if (value === 'DINING_OPTION_ONLINE' && prev !== value) {
                    this.set('selected_dining_option', prev);
                }
            }, this);

            if (!this.get('other_dining_options')) {
                this.set('other_dining_options', new App.Collections.DiningOtherOptions( App.Settings.other_dining_option_details ));
            }
        },
        /**
         * Saves current attributes in a storage (detected automatic).
         */
        saveCheckout: function() {
            setData('checkout',this);
        },
        /**
         * Loads attributes of the model from a storage (detected automatic).
         */
        loadCheckout: function() {
            var data = getData('checkout');
            data = data instanceof Object ? data : {};
            delete data.img;
            data.other_dining_options = new App.Collections.DiningOtherOptions( data.other_dining_options );
            this.set(data);
            this.trigger("change:dining_option", this, this.get("dining_option"));
        },
        /**
         * Reverts a `dining_option` to previous value.
         */
        revert_dining_option: function() {
            // return from only gift situation
            this.set('dining_option', this.get('selected_dining_option') || App.Settings.default_dining_option);
        },
        /**
         * Checks attributes values.
         * @returns {Object} A validation result. May be one of:
         * - `{status: 'OK'}`
         * - result of App.Models.Checkout#isStoreClosed if it is an object
         * - result of App.Models.Checkout#checkOrderFromSeat if it is an object
         * - result of App.Models.Checkout#checkOtherDiningOptions if it is an object
         */
        check: function() {
            var isStoreClosed = this.isStoreClosed(),
                orderFromSeat = this.checkOrderFromSeat(),
                otherDiningOptions = this.checkOtherDiningOptions();

            if(isStoreClosed)
                return isStoreClosed;

            if(orderFromSeat)
                return orderFromSeat;

            if(otherDiningOptions)
                return otherDiningOptions;

            return {
                status: "OK"
            };
        },
        /**
         * Checks a store is closed.
         * @returns {boolean|Object} Returns `false` if skin is `retail` or object `{status: 'ERROR', errorMsg: <string>'}`
         */
        isStoreClosed: function() {
            var dining_option = this.get('dining_option');
            if(App.skin == App.Skins.RETAIL)
                return false;
            if(this.get('pickupTS') === null && dining_option !== 'DINING_OPTION_OTHER' && dining_option !== 'DINING_OPTION_ONLINE') {

                trace_WOMA_531('check-order');
                return {
                    status: 'ERROR',
                    errorMsg: MSG.ERROR_STORE_IS_CLOSED
                };
            }
        },
        /**
         * Checks attributes associated with 'Stadium' mode.
         */
        checkOrderFromSeat: function() {
        },
        /**
         * Checks attributes of `other_dining_options`.
         * @returns {Object|undefined} If any required attribute isn't filled out returns an array with empty fields.
         * ```
         * {
         *     status: "ERROR_EMPTY_FIELDS",
         *     errorMsg: <string>,
         *     errorList: <Array with empty fields>
         * }
         * ```
         * Otherwise, returns `undefined`.
         */
        checkOtherDiningOptions: function() {
            var other_dining_options = this.get("other_dining_options"),
                dining_option = this.get('dining_option'),
                err = [];

            if (dining_option === 'DINING_OPTION_OTHER') {
                other_dining_options.each(function(model){
                    if (model.get("required") && !model.get("value")) {
                        err.push(model.get("name"));
                    }
                });
            }

            if(err.length) {
                return {
                    status: "ERROR_EMPTY_FIELDS",
                    errorMsg: MSG.ERROR_EMPTY_NOT_VALID_DATA.replace(/%s/, err.join(', ')),
                    errorList: err
                };
            }
        },
        /**
         * Checks cold items in order are untaxable.
         * @returns {boolean} See details in source file.
         */
        isColdUntaxable: function() {
            var delivery_cold_untaxed = App.Settings.delivery_cold_untaxed,
                dining_option = this.get('dining_option'),
                isToGo = dining_option === 'DINING_OPTION_TOGO',
                isDelivery = dining_option === 'DINING_OPTION_DELIVERY' || dining_option === 'DINING_OPTION_SHIPPING',
                isCatering = dining_option === 'DINING_OPTION_CATERING';

            return isToGo || isCatering || isDelivery && delivery_cold_untaxed;
        },
        /**
         * Checks `dining_option` is `'DINING_OPTION_ONLINE'` or not.
         * @returns {boolean} `true` if current `dining_option` attribute's value is `'DINING_OPTION_ONLINE'` and `false` otherwise.
         */
        isDiningOptionOnline: function() {
            return this.get('dining_option') == 'DINING_OPTION_ONLINE'
        }
    });

    /**
     * @class
     * @classdesc Represents a collection of custom dining option fields.
     * @alias App.Collections.DiningOtherOptions
     * @augments Backbone.Collection
     * @example
     * // create a other dining options model
     * require(['checkout'], function() {
     *     var otherOptions = new App.Collections.DiningOtherOptions();
     * });
     */
    App.Collections.DiningOtherOptions = Backbone.Collection.extend(
    /**
     * @lends App.Collections.DiningOtherOptions.prototype
     */
    {
        /**
         * Collection item constructor.
         * @default {@link module:checkout~CustomDiningOption}
         */
        model: Backbone.Model.extend(
        /**
         * @class
         * @classdesc Represents a custom dining option field.
         * @alias module:checkout~CustomDiningOption
         */
        {
            /**
             * Contains attributes with default values.
             * @type {object}
             * @enum {string}
             */
            defaults: {
                /**
                 * Dining option name.
                 * @type {string}
                 */
                name: '',
                /**
                 * An array of objects representing dining option field.
                 * @type {?Array}
                 */
                choices: null,
                /**
                 * Indicates the filed is requred or not.
                 * @type {boolean}
                 */
                required: true,
                /**
                 * It can be an option for choices OR '' or 'some string' for inputs (when choices is null).
                 * @type {string}
                 */
                value: ''
            },
            /**
             * Splits `choices` into an array (',' separator is used) if it is a string.
             */
            initialize: function() {
                if (typeof this.get('choices') == 'string') {
                    this.set('choices', this.get('choices').split(','));
                }
            },
            /**
             * Resets `value` attribute to default value.
             */
            reset: function() {
                this.set('value', this.defaults.value);
            }
        })
    });
});
