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
 * Contains {@link App.Models.Card} constructor.
 * @module card
 * @requires module:backbone
 * @see {@link module:config.paths actual path}
 */
define(["backbone"], function(Backbone) {
    'use strict';

    /**
     * @class
     * @classdesc Represents a customer's card
     * @alias App.Models.Card
     * @augments Backbone.Model
     * @example
     * // create a card model
     * require(['card'], function() {
     *     App.Data.card = new App.Models.Card();
     * });
     */
    App.Models.Card = Backbone.Model.extend(
    /**
     * @lends App.Models.Card.prototype
     */
    {
        /**
         * Contains attributes with default values.
         * @type {object}
         * @enum {string}
         */
        defaults: {
            /**
             * A first name of customer.
             * @type {string}
             */
            firstName: '',
            /**
             * A last name of customer.
             * @type {string}
             */
            secondName: '',
            /**
             * A card number.
             * @type {string}
             */
            cardNumber: '',
            /**
             * A secure code of card.
             * @type {string}
             */
            securityCode: '',
            /**
             * A card expiration month
             * @type {string}
             */
            expMonth: '01',
            /**
             * A card expiration year
             * @type {string}
             */
            expDate: new Date().getFullYear().toString(),
            /**
             * A total card expiration date
             * @type {string}
             */
            expTotal: "",
            /**
             * Customer's address
             * @type {string}
             */
            street: '',
            /**
             * Customer's city
             * @type {string}
             */
            city: '',
            /**
             * Customer's state
             * @type {string}
             */
            state: '',
            /**
             * Customer's zip code
             * @type {string}
             */
            zip: '',
            /**
             * A path for relative image url
             * @type {string}
             */
            img: App.Data.settings.get("img_path"),
            /**
             * A billing address bound to credit card
             * @type {?Backbone.Model}
             */
            billing_address: null,
            /**
             * Use the user profile address as a card billing address
             * @type {boolean}
             */
            use_profile_address: false,
            /**
             * Use the checkout address as a card billing address
             * @type {boolean}
             */
            use_checkout_address: false,
            /**
             * Indicates whether to save this card for future payments.
             * @type {Boolean}
             * @default true
             */
            rememberCard: true
        },
        initialize: function() {
            if (PaymentProcessor.isBillingAddressCard())
                this.set("billing_address", new Backbone.Model({
                    city: null,
                    street_1: null,
                    state: null,
                    zipcode: null,
                    country_code: null
                }));
        },
        /**
         * Trims the `firstName`, `lastName` attributes values.
         */
        trim: function() {
            this.set({
                firstName: trim.call(this, 'firstName'),
                secondName: trim.call(this, 'secondName')
            });
            function trim(type) {
                var value = this.get(type);
                return typeof value == 'string' ? Backbone.$.trim(value) : this.defaults[type];
            }
        },
        /**
         * Save current attributes values of the model in a storage (detected automatic).
         */
        saveCard: function() {
            this.trim();
            setData('card',this);
        },
        /**
         * Removes a card information. Resets `cardNumber`, `expMonth`, `expDate`,
         * `securityCode` attributes values to default.
         */
        empty_card_number: function() {
            this.set({
                cardNumber: this.defaults.cardNumber,
                expMonth: this.defaults.expMonth,
                expDate: this.defaults.expDate,
                securityCode: this.defaults.securityCode
            });
        },
        /**
         * Loads attributes values of the model from a storage (detected automatic).
         */
        loadCard: function() {
            var data = getData('card');
            data = data instanceof Object ? data : {};
            delete data.img;
            data.billing_address = new Backbone.Model(data.billing_address);
            this.set(data);
            return this;
        },
        /**
         * Checks current atributes values.
         * @param {Object} opts - options
         * @param {boolean} opts.ignorePerson - if it's true a person's data isn't validated
         * @param {boolean} opts.ignoreCardNumber - if it's true a card number isn't validated
         * @param {boolean} opts.ignoreSecurityCode - if it's true a security code isn't validated
         * @param {boolean} opts.ignoreExpDate - if it's true an expiration date isn't validated
         * @returns {Object} A validation result. Object literal is one of the following sets of key<->value pairs:
         * - All values are valid: `{status: 'OK'}`
         * - Has empty fields: `{status: 'ERROR_EMPTY_FIELDS', errorMsg: 'message string', errorList: 'array of empty fields'}`
         * - Invalid card expiration values: `{status: 'ERROR', errorMsg: 'message string'}`
         */
        check: function(opts) {
            var card = this.toJSON(),
                err = [];

            opts = opts instanceof Object ? opts : {};

            !opts.ignorePerson && err.push.apply(err, this.checkPerson());
            !opts.ignoreCardNumber && err.push.apply(err, this.checkCardNumber());
            !opts.ignoreSecurityCode && err.push.apply(err, this.checkSecurityCode());

            if (err.length) {
                return {
                    status: "ERROR_EMPTY_FIELDS",
                    errorMsg: MSG.ERROR_EMPTY_NOT_VALID_DATA.replace(/%s/, err.join(', ')),
                    errorList: err
                };
            }
            var month = card.expMonth,
                year = card.expDate,
                date = new Date(year, month),
                dateCur = new Date();

            if (!opts.ignoreExpDate && date < dateCur) {
                return {
                    status: "ERROR",
                    errorMsg: MSG.ERROR_CARD_EXP
                };
            }

            return {
                status: "OK"
            };
        },
         /**
         * Checks current billing address attributes values.
         * @returns {Object} A validation result. Object literal is one of the following sets of key<->value pairs:
         * - All values are valid: `{status: 'OK'}`
         * - Has empty fields: `{status: 'ERROR_EMPTY_FIELDS', errorMsg: 'message string', errorList: 'array of empty fields'}`
         */
        check_billing_address: function() {
            var card = this.toJSON(),
                err = [],
                billing_address = get_billing_address();

            !billing_address.street_1 && err.push(_loc.PROFILE_ADDRESS_LINE1);
            !billing_address.city && err.push(_loc.PROFILE_CITY);
            !billing_address.state && billing_address.country_code == 'US' && err.push(_loc.PROFILE_STATE);
            !billing_address.zipcode && err.push(billing_address.country_code == "US" ? _loc.PROFILE_ZIP_CODE : _loc.PROFILE_POSTAL_CODE);
            !billing_address.country_code && err.push(_loc.PROFILE_COUNTRY);

            if (err.length) {
                return {
                    status: "ERROR_EMPTY_FIELDS",
                    errorMsg: MSG.ERROR_EMPTY_NOT_VALID_DATA.replace(/%s/, err.join(', ')),
                    errorList: err
                };
            }

            return {
                status: "OK"
            };
        },
        /**
         * Trims `firstName`, `secondName` attributes values then checks them.
         * @returns {Array} An array contaning empty fields.
         */
        checkPerson: function() {
            this.trim();

            var card = this.toJSON(),
                payment = App.Data.settings.get_payment_process(),
                err = [];

            if (payment.paypal ||
                payment.usaepay ||
                payment.braintree ||
                payment.globalcollect ||
                payment.quickbooks ||
                payment.worldpay)
            {
                (!card.firstName) && err.push(_loc.CARD_FIRST_NAME);
                (!card.secondName) && err.push(_loc.CARD_LAST_NAME);
            }

            return err;
        },
        /**
         * Checks a security code.
         * @returns {Array} An array contaning empty fields.
         */
        checkSecurityCode: function() {
            var securityPattern = /^\d{3,4}$/,
                card = this.toJSON(),
                err = [];

            (!securityPattern.test(card.securityCode)) && err.push(_loc.CARD_SECURITY_CODE);
            return err;
        },
        /**
         * Checks a card number.
         * @returns {Array} An array contaning empty fields.
         */
        checkCardNumber: function() {
            var cardPattern = /^[3-6]\d{12,18}$/,
                card = this.toJSON(),
                err = [];

            (!cardPattern.test(card.cardNumber)) && err.push(_loc.CARD_NUMBER);
            return err;
        },
        /**
         * Removes credit card info from the model and a storage.
         */
        clearData: function() {
            this.empty_card_number();
            this.saveCard();
        }
    });

    window.get_billing_address = function() {
        var billing_address,
            use_profile_address = App.Data.card.get("use_profile_address"),
            use_checkout_address = App.Data.card.get("use_checkout_address");
        if (use_profile_address) {
            billing_address = App.Data.customer.get('addresses').getDefaultProfileAddress();
            return billing_address ? billing_address.toJSON() : null;
        } else if(use_checkout_address) {
            var address = App.Data.customer.get('addresses').getCheckoutAddress();
            address.country_code = address.country;
            return address;
        } else {
            billing_address = App.Data.card.get("billing_address");
            return _.isObject(billing_address) ? billing_address.toJSON() : null;
        }
    }
});
