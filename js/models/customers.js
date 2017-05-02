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
 * Contains {@link App.Models.Customer} constructors.
 * @module customers
 * @requires module:backbone
 * @requires module:js_cookie
 * @requires module:page_visibility
 * @see {@link module:config.paths actual path}
 */
define(["backbone", "facebook", "js_cookie", "page_visibility", "giftcard", "orders"], function(Backbone, FB, Cookies, page_visibility) {
    'use strict';

    var cookieName = "user",
        cookiePath = "/",
        cookieDomain;

    // if hostname belongs to *.revelup.com need to set cookie only for "/weborder" path
    if (/revelup\.com$/.test(location.hostname)) {
        cookieDomain = "revelup.com";
        cookiePath = "/weborder";
    } else {
        cookieDomain = location.hostname;
    }

    /**
     * @class
     * @classdesc Represents a customer model.
     * @alias App.Models.Customer
     * @augments Backbone.Model
     * @example
     * // create a customer model
     * require(['customers'], function() {
     *     var customer = new App.Models.Customer();
     * });
     */
    App.Models.Customer = Backbone.Model.extend(
    /**
     * @lends App.Models.Customer.prototype
     */
    {
        /**
         * Contains attributes with default values.
         * @type {object}
         * @enum {string}
         */
        defaults: {
            /**
             * Customer's first name.
             * @type {string}
             * @default ""
             */
            first_name: "",
            /**
             * Customer's last name.
             * @type {string}
             * @default ""
             */
            last_name: "",
            /**
             * Customer's phone.
             * @type {string}
             * @default ""
             */
            phone: "",
            /**
             * Customer's email.
             * @type {string}
             * @default ""
             */
            email: "",
            /**
             * Customer ID.
             * @type {?(number|string)}
             * @default null
             */
            id: null,
            /**
             * Array of available shipping services. This array depends on order items.
             * @type {Array}
             * @default []
             */
            shipping_services: [],
            /**
             * Index of selected shipping service. -1 means no shipping service selected.
             * @type {number}
             * @default -1
             */
            shipping_selected: -1,
            /**
             * Status of shipping services loading. Can be one of "", "resolved", "restoring", "pending".
             * @type {string}
             * @default ""
             */
            load_shipping_status: "",
            /**
             * User's password
             * @type {string}
             * @default ""
             */
            password: "",
            /**
             * User's confirm password
             * @type {string}
             * @default ""
             */
            confirm_password: "",
            /**
             * User's password visibility
             * @type {boolean}
             * @default false
             */
            show_password: false,
            /**
             * Terms of Use
             * @type {boolean}
             * @default true
             */
            terms_accepted: true,
            /**
             * Email notifications
             * @type {boolean}
             * @default true
             */
            email_notifications: true,
            /**
             * Push notifications
             * @type {boolean}
             * @default true
             */
            push_notifications: true,
            /**
             * Customer's id.
             * @type {?number}
             * @default null
             */
            user_id: null,
            /**
             * Session expires in.
             * @type {?number}
             * @default null
             */
            expires_in: null,
            /**
             * Token type. It's used in 'Authorization' HTTP header.
             * @type {string}
             * @default ""
             */
            token_type: "",
            /**
             * Access token.
             * @type {string}
             * @default ""
             */
            access_token: "",
            /**
             * Facebook access token.
             * @type {string}
             * @default ""
             */
            fb_token: "",
            /**
             * If `true` cookie uses max-age property. Otherwise cookie exists within browser session.
             * @type {boolean}
             * @default true
             */
            keepCookie: true,
            /**
             * Authorization URL.
             * @type {string}
             * @default "https://identity-dev.revelup.com/customers-auth/v1"
             */
            serverURL: "https://identity-dev.revelup.com/customers-auth/v1",
            /**
             * Past order.
             * @type {?App.Models.Order}
             * @default null
             */
            pastOrder: null,
            /**
             * Indicates whether the customer is aware Terms of Usage.
             * @type {boolean}
             * @default false
             */
            accept_tou: false
        },
        /**
         * Adds validation listeners for `first_name`, `last_name` attributes changes.
         * Sets indexes of addresses used for "Delivery" and "Shipping" dinign options.
         */
        initialize: function() {
            // Facebook SDK initialization
            this.FB_init();

            // set customer data from cookie
            this.setCustomerFromCookie();

            // set tracking of cookie change when user leaves/returns to current tab
            page_visibility.on(this.trackCookieChange.bind(this));

            /**
             * Gift cards assigned to the customer.
             * @member
             * @alias App.Models.Customer#giftCards
             * @type {App.Collections.GiftCards}
             * @default instance of {@link App.Collections.GiftCards}
             */
            this.giftCards = new App.Collections.GiftCards;

            /**
             * Customer's orders.
             * @member
             * @alias App.Models.Customer#orders
             * @type {App.Collections.Orders}
             * @default instance of {@link App.Collections.Orders}
             */
            this.orders = new App.Collections.Orders;
            this.initOrders();
        },
        /**
         * Facebook SDK initialization
         *
         * ```
         * FB.init() reference: https://developers.facebook.com/docs/javascript/reference/FB.init/
         * ```
         */
        FB_init: function() {
            FB.init({
                appId   : App.Settings.fb_app_id,
                version : 'v2.6'
            });
        },
        /**
         * Facebook login
         *
         * ```
         * FB.login() reference: https://developers.facebook.com/docs/reference/javascript/FB.login/
         * ```
         */
        FB_login: function(cb) {
            FB.login(function(response) {
                if (typeof cb === 'function') {
                    cb(response);
                }
            }, {scope: 'public_profile,email', auth_type: 'rerequest'});
        },
        /**
         * Trims value of attribute passed as parameter.
         * @param {string} attr - attribute name
         */
        _trimValue: function(attr) {
            var value = this.get(attr);
            typeof value  == 'string'
                ? this.set(attr, Backbone.$.trim(value))
                : this.set(attr, this.defaults[attr]);
        },
        /**
         * Gets customer name in the format "John M.".
         * @returns {string} Concatenation of `first_name` attribute value, `last_name` first letter and '.' symbol.
         */
        get_customer_name : function() {
            var first_name = this.get('first_name'),
                last_name = this.get('last_name');

            first_name = typeof first_name == 'string' && first_name.length ? first_name : '';
            last_name = typeof last_name == 'string' && last_name.length ? last_name : '';
            last_name = last_name.replace(/(\w).*/, function(m, g) {return ' ' + g + '.';});

            return (first_name + last_name);
        },
        /**
         * Saves attributes values of the customer to a storage.
         */
        saveCustomer: function() {
            setData('customer', this);
        },
        /**
         * Loads attributes from the storage.
         * If a shipping service was selected changes `load_shipping_status` on 'restoring' value.
         */
        loadCustomer: function() {
            var data = getData('customer');
            data = data instanceof Object ? data : {};
            var rewardCards = data.rewardCards,
                addresses = data.addresses;
            delete data.rewardCards;
            delete data.addresses;
            delete data.pastOrder;
            this.set(data);
            var rewardCardsCol = new App.Collections.RewardCards,
                addressesCol = new App.Collections.CustomerAddresses;
            this.set('rewardCards', rewardCardsCol.addJSON(rewardCards));
            this.set('addresses', addressesCol.addJSON(addresses));
            var shipping_services = this.get("shipping_services");
            if (Array.isArray(shipping_services) && shipping_services.length && this.get("shipping_selected") > -1) {
                this.set("load_shipping_status", "restoring", {silent: true});
            }
        },
        /**
         * Validates `first_name`, `last_name`, `email`, `phone` attributes values for checkout.
         * @param {string} dining_option - order type selected
         * @returns {Object} One of the following object literals:
         * - If all fine:
         * ```
         * {
         *     status: "OK"
         * }
         * ```
         * - If validation failed:
         * ```
         * {
         *     status: "ERROR_EMPTY_FIELDS",
         *     errorMsg: <error message>,
         *     errorList: [] // Array of invalid properties
         * }
         * ```
         */
        check: function(dining_option) {
            var err = [];

            !this.get('first_name') && err.push(_loc.PROFILE_FIRST_NAME);
            !this.get('last_name') && err.push(_loc.PROFILE_LAST_NAME);
            !EMAIL_VALIDATION_REGEXP.test(this.get('email')) && err.push(_loc.PROFILE_EMAIL_ADDRESS);
            !this.get('phone') && err.push(_loc.PROFILE_PHONE);
            !_.isBoolean(this.get('email_notifications')) && err.push(_loc.PROFILE_EMAIL_NOTIFICATIONS);
            !_.isBoolean(this.get('push_notifications')) && err.push(_loc.PROFILE_PUSH_NOTIFICATIONS);

            if (this.isNewAddressSelected(dining_option)) {
                err = err.concat(this._check_delivery_fields());
            }

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
         * Checks an authorized user has filled in all required data
         */
        isLocked: function() {
            return (this.isAuthorized() && this.check().status !== 'OK');
        },
        /**
         * Receives shipping_services.
         * If `load_shipping_status` attribute value is 'restoring' changes its value on 'resolved'.
         * Otherwise, changes `load_shipping_status` on 'pending' and sends `POST` request to `/weborders/shipping_options/` with parameter
         * ```
         * {
         *     address: <address object>
         *     items: <array of cart items>
         *     establishment: <establishment>
         * }
         * ```
         * When a response is processed `load_shipping_status` changes on 'resolved'.
         *
         * @param {Object} [jqXHR=create ajax request] - the jqXHR Object.
         * @param {Function} [getShippingOptions=return raw data] - A function returning shipping options (expects a response-object as parameter).
         *                                          May be used for raw data mapping.
         */
        get_shipping_services: function(jqXHR, getShippingOptions) {
            var self = this,
                data = {},
                address = this.getOrderAddress();

            if (!address) {
                return;
            }

            // restore saved values
            if (this.get("load_shipping_status") == "restoring") {
                return complete();
            }

            data.address = address;
            data.items = [];
            data.establishment = App.Data.settings.get("establishment");
            App.Data.myorder.each(function(model) {
                data.items.push(model.item_submit());
            });

            // reset shipping services
            this.resetShippingServices('pending');

            var data_json = JSON.stringify(data);

            // define getShippingOptions function if it isn't a function
            getShippingOptions = typeof getShippingOptions == 'function' ? getShippingOptions : function(response) {
                return response.data;
            };

            jqXHR = jqXHR || Backbone.$.ajax({
                type: "POST",
                url: "/weborders/shipping_options/",
                data: data_json,
                dataType: "json",
                error: onError
            });

            // process successful response
            jqXHR.done(function(response) {
                var shipping_options;
                switch (response.status) {
                    case "OK":
                        self.set("shipping_services", getShippingOptions(response), {silent: true});
                        self.set("shipping_selected", getIndex(response));
                        complete();
                        break;
                    default:
                        onError(jqXHR);
                }
            });
            // process failure response
            jqXHR.fail(onError);

            function onError(xhr) {
                if (xhr.statusText != "abort") {
                    setTimeout(complete, 300);
                }
            }

            function complete() {
                self.set("load_shipping_status", "resolved", {silent: true});
                self.trigger("change:shipping_services");
            }

            function getIndex(response) {
                var shipping = _.isObject(response) && _.isObject(response.data) && response.data.shipping;
                return _.isObject(shipping) && Array.isArray(shipping.options)
                    ? _.pluck(shipping.options, 'service_code').indexOf(shipping.service_code)
                    : -1;
            }
        },
        /**
         * Clears `shipping_services` attribute, changes `load_shipping_status`.
         * @param {string} [status=""] - value of `load_shipping_status` need to be changed on.
         */
        resetShippingServices: function(status) {
            this.set({
                shipping_services: [],
                load_shipping_status: typeof status == 'string' ? status : '',
                shipping_selected: -1
            }, {silent: true});
            this.trigger('change:shipping_services');
        },
        /**
         * Checks `shipping_selected` attribute has default value or not.
         * @returns {boolean} `true` if `shipping_selected` is default or `false` otherwise.
         */
        isDefaultShippingSelected: function() {
            return this.get('shipping_selected') === this.defaults.shipping_selected;
        },
        /**
         * Checks whether dining_option requires shipping address and it's selected.
         * @param {string} dining_option - selected order type.
         * @returns {boolean}
         */
        isNewAddressSelected: function(dining_option) {
            var isDelivery = dining_option === 'DINING_OPTION_DELIVERY' || dining_option === 'DINING_OPTION_SHIPPING' || dining_option === 'DINING_OPTION_CATERING';
            return isDelivery && this.get('addresses').isNewAddressSelected();
        },
        /**
         * Validates `first_name`, `last_name`, `email` and `password` attributes for Sign Up.
         * @returns {Object} One of the following object literals:
         * - If all fine:
         * ```
         * {
         *     status: "OK"
         * }
         * ```
         * - If validation failed:
         * ```
         * {
         *     status: "ERROR_EMPTY_FIELDS",
         *     errorMsg: <error message>,
         *     errorList: [] // Array of invalid properties
         * }
         * ```
         */
        checkSignUpData: function() {
            var err = [], atts = [];

            !this.get('first_name') && err.push(_loc.PROFILE_FIRST_NAME) && atts.push('first_name');
            !this.get('last_name') && err.push(_loc.PROFILE_LAST_NAME) && atts.push('last_name');
            !EMAIL_VALIDATION_REGEXP.test(this.get('email')) && err.push(_loc.PROFILE_EMAIL_ADDRESS) && atts.push('email');
            !this.get('phone') && err.push(_loc.PROFILE_PHONE) && atts.push('phone');
            !this.get('password') && err.push(_loc.PROFILE_PASSWORD) && atts.push('password');
            !_.isBoolean(this.get('email_notifications')) && err.push(_loc.PROFILE_EMAIL_NOTIFICATIONS) && atts.push('email_notifications');
            !_.isBoolean(this.get('push_notifications')) && err.push(_loc.PROFILE_PUSH_NOTIFICATIONS) && atts.push('push_notifications');

            this.trigger('onCheckSignUpData', atts);

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
         * Validates values of address object properties `street_1`, `city`, `state`, `province`, `zipcode`.
         * @returns {Array} empty array if all properties pass validation or array with invalid properties.
         */
        _check_delivery_fields: function() {
            var settings = App.Settings,
                empty = [],
                address = this.get('addresses').getSelectedAddress().toJSON(),
                req = {
                    street_1: _loc.PROFILE_ADDRESS_LINE1,
                    city: _loc.PROFILE_CITY,
                    state: _loc.PROFILE_STATE,
                    province: _loc.PROFILE_PROVINCE,
                    zipcode: _loc.PROFILE_ZIP_CODE
                };

            // if not USA exclude state property
            if (address.country != 'US') {
                delete req.state;
            }
            // if not Canada exclude province property
            if (address.country != 'CA') {
                delete req.province;
            }
            for (var i in req) {
                !address[i] && empty.push(req[i]);
            }

            return empty;
        },
        /**
         * Compares `password`, `confirm_password` attributes.
         * @returns {Object} One of the following object literals:
         * - If all fine:
         * ```
         * {
         *     status: "OK"
         * }
         * ```
         * - If validation failed:
         * ```
         * {
         *     status: "ERROR_PASSWORDS_MISMATCH",
         *     errorMsg: <error message>
         * }
         * ```
         */
        comparePasswords: function() {
            var err = {
                status: "ERROR_PASSWORDS_MISMATCH",
                errorMsg: _loc.PROFILE_PASSWORDS_MISMATCH,
            }, ok = {
                status: "OK"
            };
            return this.get('password') != this.get('confirm_password') ? err : ok;
        },
        /**
         * Gets authorization token of the customer. Sends request with following parameters:
         * ```
         * {
         *     url: "https://identity-dev.revelup.com/customers-auth/v1/authorization/token-customer/",
         *     method: "POST",
         *     data: {
         *         username: <username>,                  // username (email)
         *         scope: "*",                            // constant value
         *         password: <password>,                  // password
         *         grant_type: "password"                 // constant value
         *     }
         * }
         * ```
         * Server may return following response:
         * - Successful authorization:
         * ```
         * Status: 200
         * {
         *     "token": {
         *         "username": "johndoe@foobar.com",                                    // username
         *         "user_id": 1,                                                        // user id
         *         "access_token": "2YotnFZFEjr1zCsicMWpAA",                            // access token
         *         "token_type": "Bearer",                                              // token type
         *         "expires_in": 3600,                                                  // expiration time
         *         "scope": "CUSTOMERS:customers.customer CUSTOMERS:customers.address"  // access scope
         *     },
         *     customer: {
         *         "email": "johndoe@foobar.com",                                       // email
         *         "first_name": "John",                                                // first name
         *         "last_name": "Doe",                                                  // last name
         *         "id": 1,                                                             // user id
         *         "phone_number": "+123456789"                                         // phone
         *         "addresses": [...]                                                   // array of addresses
         *     }
         * ```
         * Emits 'onLogin' event.
         *
         * - Username or password is invalid:
         * ```
         * Status: 400
         * {
         *     "error_description": "Invalid credentials given.",
         *     "error": "invalid_grant"
         * }
         * ```
         * The model emits `onInvalidUser` event in this case.
         *
         * - User is not activated:
         * ```
         * Status: 423
         * {
         *     "error": "user_is_not_activated"
         * }
         * ```
         * The model emits `onNotActivatedUser` event in this case.
         *
         * - Invalid scope (incorrect scope value):
         * ```
         * Status: 400
         * {
         *     "error": "invalid_scope"
         * }
         * ```
         * The model emits `onInvalidUser` event in this case.
         *
         * - Unsupported grant type:
         * Status: 400
         * {
         *     "error": "unsupported_grant_type"
         * }
         * The model emits `onLoginError` event in this case.
         *
         * - `grant_type` parameter is missed:
         * ```
         * Status: 400
         * {
         *     "error_description": "Request is missing grant_type parameter.",
         *     "error": "invalid_request"
         * }
         * ```
         * The model emits `onLoginError` event in this case.
         *
         * - `password` parameter is missed:
         * ```
         * Status: 400
         * {
         *     "error_description": "Request is missing password parameter.",
         *     "error": "invalid_request"
         * }
         * ```
         * The model emits `onLoginError` event in this case.
         *
         * - `username` parameter is missed:
         * ```
         * Status: 400
         * {
         *     "error_description": "Request is missing username parameter.",
         *     "error": "invalid_request"
         * }
         * ```
         * The model emits `onLoginError` event in this case.
         *
         * @returns {Object} jqXHR object.
         */
        login: function() {
            var attrs = this.toJSON();
            return Backbone.$.ajax({
                url: attrs.serverURL + "/authorization/token-customer/",
                method: "POST",
                context: this,
                data: {
                    username: attrs.email,
                    scope: '*',
                    password: attrs.password,
                    grant_type: "password",
                    instance: getInstanceName()
                },
                success: this.loginSuccessCallback,
                error: this.loginErrorCallback
            });
        },
        /**
         * Gets authorization token of the customer using Facebook. Sends request with following parameters:
         * ```
         * {
         *     url: "https://identity-dev.revelup.com/customers-auth/v1/authorization/token-customer/facebook/",
         *     method: "POST",
         *     data: {
         *         access_token: <access_token>,          // facebook access token
         *         scope: "*",                            // constant value
         *         grant_type: "password"                 // constant value
         *     }
         * }
         * ```
         * Server may return following response:
         * - Successful authorization:
         * ```
         * Status: 200
         * {
         *     "token": {
         *         "username": "johndoe@foobar.com",                                    // username
         *         "user_id": 1,                                                        // user id
         *         "access_token": "2YotnFZFEjr1zCsicMWpAA",                            // access token
         *         "token_type": "Bearer",                                              // token type
         *         "expires_in": 3600,                                                  // expiration time
         *         "scope": "CUSTOMERS:customers.customer CUSTOMERS:customers.address"  // access scope
         *     },
         *     customer: {
         *         "email": "johndoe@foobar.com",                                       // email
         *         "first_name": "John",                                                // first name
         *         "last_name": "Doe",                                                  // last name
         *         "id": 1,                                                             // user id
         *         "phone_number": "+123456789"                                         // phone
         *         "addresses": [...]                                                   // array of addresses
         *     }
         * ```
         * Emits 'onLogin' event.
         *
         * ```
         * Status: 400
         * {
         *     "error_description": "Invalid credentials given.",
         *     "error": "invalid_grant"
         * }
         * ```
         *
         * ```
         * Status: 422
         * {
         *     "error": "no_facebook_email"
         * }
         * ```
         *
         * ```
         * Status: 403
         * {
         *     "error": "invalid_facebook_token"
         * }
         * ```
         *
         * ```
         * Status: 400
         * {
         *     "error": "invalid_scope"
         * }
         * ```
         *
         * ```
         * Status: 400
         * {
         *     "error": "unsupported_grant_type"
         * }
         * ```
         *
         * ```
         * Status: 400
         * {
         *     "error_description": "Request is missing grand_type parameter.",
         *     "error": "invalid_request"
         * }
         * ```
         *
         * ```
         * Status: 400
         * {
         *     "error_description": "Request is missing access_token parameter.",
         *     "error": "invalid_request"
         * }
         * ```
         *
         * @returns {Object} jqXHR object.
         */
        loginFacebook: function(access_token) {
            var attrs = this.toJSON();
            return Backbone.$.ajax({
                url: attrs.serverURL + "/authorization/token-customer/facebook/",
                method: "POST",
                context: this,
                data: {
                    access_token: access_token,
                    grant_type: "password",
                    scope: '*',
                    instance: getInstanceName()
                },
                success: function(data) {
                    data.token.fb_token = access_token;
                    this.loginSuccessCallback(data);
                },
                error: this.loginErrorCallback
            });
        },
        /**
         * Authorization success callback
         */
        loginSuccessCallback: function(data) {
            try {
                delete data.customer.payments;
                delete data.token.scope;
            } catch(e) {}

            this.updateCookie(data);
            this.setCustomerFromAPI(data);
            this.initPayments();
            this.getAddresses();
            this.initGiftCards();
            this.setRewardCards();
            this.initOrders();
            this.trigger('onLogin');
        },
        /**
         * Authorization error callback
         */
        loginErrorCallback: function(jqXHR) {
            switch(jqXHR.status) {
                case 423:
                    this.trigger('onNotActivatedUser', getResponse());
                    break;
                default:
                    emitDefaultEvent.call(this);
            }

            function emitDefaultEvent() {
                var resp = getResponse();
                if (resp.error == "invalid_scope" || resp.error == "invalid_grant") {
                    this.trigger('onInvalidUser', resp);
                } else {
                    this.trigger('onLoginError', resp);
                }
            }

            function getResponse() {
                return _.isObject(jqXHR.responseJSON) ? jqXHR.responseJSON : {};
            }
        },
        /**
         * Changes attributes values on default values. Emits `onLogout` event.
         */
        logout: function() {
            Cookies.remove(cookieName, {path: cookiePath, domain: cookieDomain});

            for (var attr in this.defaults) {
                if (attr != 'addresses') {
                    this.set(attr, this.defaults[attr]);
                }
            }
            this.get('addresses').removeProfileAddresses();
            this.removePayments();
            this.removeGiftCards();
            this.removeRewardCards();
            this.removeOrders();
            this.trigger('onLogout');
        },
        /**
         * Registers a new customer. Sends request with following parameters:
         * ```
         * {
         *     url: "https://identity-dev.revelup.com/customers-auth/v1/customers/register-customer/",
         *     method: "POST",
         *     contentType: "application/json",
         *     data: {
         *         email: <email>,             // email
         *         password: <password>,       // password
         *         first_name: <first_name>,   // first name
         *         last_name: <last_name>,     // last name
         *         phone_number: <phone>       // phone
         *         address: <address object>   // address
         *     }
         * }
         * ```
         * Server may return following response:
         * - Successful registration:
         * ```
         * Status: 201
         * {
         *     "id": 1,                        // customer id
         *     "email": "johndoe@foobar.com",  // username
         *     "first_name": "John",           // first name
         *     "last_name": "Doe",             // last name
         *     "phone_number": "+123456789",   // phone
         *     "addresses":[]                  // addresses
         * }
         * ```
         * The model emits `onUserCreated` event in this case.
         *
         * - Username already exists:
         * ```
         * Status: 422
         * {
         *     "email": ["This field must be unique."]
         * }
         * ```
         * The model emits `onUserExists` event in this case.
         *
         * - 'password' parameter is missed:
         * ```
         * Status: 400
         * {
         *     "password": ["This field is required."]
         * }
         * ```
         * The model emits `onUserCreateError` event in this case.
         *
         * - Invalid scope (incorrect scope value):
         * ```
         * Status: 400
         * {
         *     "email": ["This field is required."]
         * }
         * ```
         * The model emits `onUserCreateError` event in this case.
         *
         * @param {Object} address - an object containing address data
         *
         * @returns {Object} jqXHR object.
         */
        signup: function(address) {
            var attrs = this.toJSON();

            address = App.Models.CustomerAddress.prototype.convertToAPIFormat(address);

            return Backbone.$.ajax({
                url: attrs.serverURL + "/customers/register-customer/",
                method: "POST",
                context: this,
                contentType: "application/json",
                data: JSON.stringify({
                    email: attrs.email,
                    password: attrs.password,
                    first_name: Backbone.$.trim(attrs.first_name),
                    last_name: Backbone.$.trim(attrs.last_name),
                    phone_number: attrs.phone,
                    address: _.isObject(address) ? address : undefined,
                    email_notifications: attrs.email_notifications,
                    push_notifications: attrs.push_notifications,
                    instance: !isRevelinOrigin() ? getInstanceName() : undefined,
                    establishment_id: App.Data.settings.get_current_establishment()
                }),
                success: function(data) {
                    this.clearPasswords();
                    this.logout();
                    this.trigger('onUserCreated');
                },
                error: function(jqXHR) {
                    var resp = getResponse();

                    switch(jqXHR.status) {
                        case 400:
                            this.trigger('onUserValidationError', resp);
                            break;
                        case 422:
                            this.trigger('onUserExists', resp);
                            break;
                        default:
                            this.trigger('onUserCreateError', resp);
                    }

                    this.trigger('onCheckSignUpData', Object.keys(resp));

                    function getResponse() {
                        return _.isObject(jqXHR.responseJSON) ? jqXHR.responseJSON : {};
                    }
                }
            });
        },
        /**
         * @returns {Object} An object with Authorization HTTP header if the customer has access token.
         */
        getAuthorizationHeader: function() {
            var header = {},
                token_type = this.get('token_type'),
                access_token = this.get('access_token');

            if(token_type && access_token) {
                header.Authorization = token_type + ' ' + access_token;
            }

            return header;
        },
        /**
         * Updates the customer. Sends request with following parameters:
         * ```
         * {
         *     url: "https://identity-dev.revelup.com/customers-auth/v1/customers/customers/<id>/",
         *     method: "PATCH",
         *     contentType: "application/json",
         *     headers: {Authorization: "Bearer XXXXXXXXXXXXX"},
         *     data: {
         *         email: <email>,             // email
         *         first_name: <first_name>,   // first name
         *         last_name: <last_name>,     // last name
         *         phone_number: <phone>       // phone
         *     }
         * }
         * ```
         * Server may return the following response:
         * - Successful update:
         * ```
         * Status: 200
         * {
         *     "email": "johndoe@foobar.com",  // username
         *     "first_name": "John",           // first name
         *     "last_name": "Doe",             // last name
         *     "phone_number": "+123456789",   // phone
         * }
         * ```
         * The model emits `onUserUpdate` event in this case.
         *
         * - Session is already expired or invalid token is used:
         * ```
         * Status: 403
         * {
         *     "detail":"Authentication credentials were not provided."
         * }
         * ```
         * The model emits `onUserSessionExpired` event in this case. Method `.logout()` is automatically called in this case.
         *
         * - The customer isn't found:
         * ```
         * Status: 404
         * {
         *     "detail":"Not found."
         * }
         * ```
         * The model emits `onUserNotFound` event in this case.
         *
         * - New data is invalid:
         * ```
         * Status: 400
         * {
         *     <field name>: <validation error>
         * }
         * ```
         * The model emits `onUserValidationError` event in this case.
         *
         * @param {Object} data - custom data need to update.
         *
         * @returns {Object} jqXHR object.
         */
        updateCustomer: function(data) {
            var attrs = this.toJSON();

            return Backbone.$.ajax({
                url: attrs.serverURL + "/customers/customers/" + attrs.user_id + "/",
                method: "PATCH",
                context: this,
                contentType: "application/json",
                headers: this.getAuthorizationHeader(),
                data: JSON.stringify(_.isObject(data) ? data : {
                    email: attrs.email,
                    first_name: Backbone.$.trim(attrs.first_name),
                    last_name: Backbone.$.trim(attrs.last_name),
                    phone_number: attrs.phone,
                    email_notifications: attrs.email_notifications,
                    push_notifications: attrs.push_notifications
                }),
                success: function(data) {
                    this.updateCookie(this.getCustomerInAPIFormat());
                    this.trigger('onUserUpdate');
                },
                error: function(jqXHR) {
                    switch(jqXHR.status) {
                        case 403:
                            this.onForbidden();
                            break;
                        case 404:
                            this.trigger('onUserNotFound');
                            break;
                        case 400:
                            this.trigger('onUserValidationError', getResponse());
                            break;
                        default:
                            this.trigger('onUserAPIError', getResponse());
                    }

                    function getResponse() {
                        return _.isObject(jqXHR.responseJSON) ? jqXHR.responseJSON : {};
                    }
                }
            });
        },
        /**
         * Creates a new address. Sends request with following parameters:
         * ```
         * {
         *     url: "https://identity-dev.revelup.com/customers-auth/v1/customers/addresses/",
         *     method: "POST",
         *     contentType: "application/json",
         *     headers: {Authorization: "Bearer XXXXXXXXXXXXX"},
         *     data: {
         *         "is_primary": true,
         *         "street_1": "170 Columbus Ave",
         *         "street_2": null,
         *         "postal_code": "94133",
         *         "country_code": "US",
         *         "city": null,
         *         "region": null
         *     }
         * }
         * ```
         * Server may return the following response:
         * - Address is successfully created:
         * ```
         * Status: 200
         * {
         *     "id":1,
         *     "customer":1,
         *     "is_primary": true,
         *     "street_1": "170 Columbus Ave",
         *     "street_2": null,
         *     "postal_code": "94133",
         *     "country_code": "US",
         *     "city": null,
         *     "region": null
         * }
         * ```
         * The model emits `onUserAddressCreated` event in this case.
         *
         * - Session is already expired or invalid token is used:
         * ```
         * Status: 403
         * {
         *     "detail":"Authentication credentials were not provided."
         * }
         * ```
         * The model emits `onUserSessionExpired` event in this case. Method `.logout()` is automatically called in this case.
         *
         * - Address field is invalid:
         * ```
         * Status: 400
         * {
         *     <field name>: <validation error>
         * }
         * ```
         * The model emits `onUserValidationError` event in this case.
         *
         * @param {Object} address - an object containing address data
         *
         * @returns {Object} jqXHR object.
         */
        createAddress: function(address) {
            if (!_.isObject(address)) {
                return;
            }
            var addressJson = address instanceof Backbone.Model ? address.toJSON() : address;

            addressJson = this.convertAddressToAPIFormat(addressJson);

            return Backbone.$.ajax({
                url: this.get('serverURL') + "/customers/addresses/",
                method: "POST",
                context: this,
                contentType: "application/json",
                headers: this.getAuthorizationHeader(),
                data: JSON.stringify(addressJson),
                success: function(data) {
                    if (_.isObject(data)) {
                        address.set(data, {parse: true});
                        this.trigger('onUserAddressCreated');
                    }
                },
                error: function(jqXHR) {
                    switch(jqXHR.status) {
                        case 403:
                            this.onForbidden();
                            break;
                        case 400:
                            this.trigger('onUserValidationError', getResponse());
                            break;
                        default:
                            this.trigger('onUserAPIError', getResponse());
                    }

                    function getResponse() {
                        return _.isObject(jqXHR.responseJSON) ? jqXHR.responseJSON : {};
                    }
                }
            });
        },
        /**
         * Updates customer's address. Sends request with following parameters:
         * ```
         * {
         *     url: "https://identity-dev.revelup.com/customers-auth/v1/customers/addresses/<id>/",
         *     method: "PATCH",
         *     contentType: "application/json",
         *     headers: {Authorization: "Bearer XXXXXXXXXXXXX"},
         *     data: {
         *         "is_primary": true,
         *         "street_1": "170 Columbus Ave",
         *         "street_2": null,
         *         "postal_code": "94133",
         *         "country_code": "US",
         *         "city": null,
         *         "region": null
         *     }
         * }
         * ```
         * Server may return the following response:
         * - Address is successfully created:
         * ```
         * Status: 200
         * {
         *     "id":1,
         *     "customer":1,
         *     "is_primary": true,
         *     "street_1": "170 Columbus Ave",
         *     "street_2": null,
         *     "postal_code": "94133",
         *     "country_code": "US",
         *     "city": null,
         *     "region": null
         * }
         * ```
         * The model emits `onUserAddressUpdate` event in this case.
         *
         * - Session is already expired or invalid token is used:
         * ```
         * Status: 403
         * {
         *     "detail":"Authentication credentials were not provided."
         * }
         * ```
         * The model emits `onUserSessionExpired` event in this case. Method `.logout()` is automatically called in this case.
         *
         * - The address isn't found:
         * ```
         * Status: 404
         * {
         *     "detail":"Not found."
         * }
         * ```
         * The model emits `onUserAddressNotFound` event in this case.
         *
         * - New data is invalid:
         * ```
         * Status: 400
         * {
         *     <field name>: <validation error>
         * }
         * ```
         * The model emits `onUserValidationError` event in this case.
         *
         * @param {Object} address - an object containing address data
         *
         * @returns {Object} jqXHR object.
         */
        updateAddress: function(address) {
            if (!_.isObject(address)) {
                return;
            }

            address = this.convertAddressToAPIFormat(address);

            return Backbone.$.ajax({
                url: this.get('serverURL') + "/customers/addresses/" + address.id + "/",
                method: "PATCH",
                context: this,
                contentType: "application/json",
                headers: this.getAuthorizationHeader(),
                data: JSON.stringify(address),
                success: function(data) {
                    if (_.isObject(data) && data.id == address.id) {
                        this.get('addresses').get(data.id).set(data, {parse: true});
                    }
                    this.trigger('onUserAddressUpdate');
                },
                error: function(jqXHR) {
                    switch(jqXHR.status) {
                        case 403:
                            this.onForbidden();
                            break;
                        case 404:
                            this.trigger('onUserAddressNotFound');
                            break;
                        case 400:
                            this.trigger('onUserValidationError', getResponse());
                            break;
                        default:
                            this.trigger('onUserAPIError', getResponse());
                    }
                    function getResponse() {
                        return _.isObject(jqXHR.responseJSON) ? jqXHR.responseJSON : {};
                    }
                }
            });
        },
        /**
         * Deletes customer's address. Sends request with following parameters:
         * ```
         * {
         *     url: "https://identity-dev.revelup.com/customers-auth/v1/customers/addresses/<id>/",
         *     method: "DELETE",
         *     contentType: "application/json",
         *     headers: {Authorization: "Bearer XXXXXXXXXXXXX"}
         * }
         * ```
         * Server may return the following response:
         * - Address is successfully deleted:
         * ```
         * Status: 200
         * ```
         * The model emits `onUserAddressDelete` event in this case.
         *
         * - Session is already expired or invalid token is used:
         * ```
         * Status: 403
         * {
         *     "detail":"Authentication credentials were not provided."
         * }
         * ```
         * The model emits `onUserSessionExpired` event in this case. Method `.logout()` is automatically called in this case.
         *
         * - The address isn't found:
         * ```
         * Status: 404
         * {
         *     "detail":"Not found."
         * }
         * ```
         * The model emits `onUserAddressNotFound` event in this case.
         *
         * - New data is invalid:
         * ```
         * Status: 400
         * {
         *     <field name>: <validation error>
         * }
         * ```
         * The model emits `onUserValidationError` event in this case.
         *
         * @param {Object} address - an object containing address data
         *
         * @returns {Object} jqXHR object.
         */
        deleteAddress: function(address) {
            if (!_.isObject(address)) {
                return;
            }
            if (address instanceof Backbone.Model) {
                address = address.toJSON();
            }
            if (!address.id) {
                return;
            }

            address = {id: address.id};

            return Backbone.$.ajax({
                url: this.get('serverURL') + "/customers/addresses/" + address.id + "/",
                method: "DELETE",
                context: this,
                contentType: "application/json",
                headers: this.getAuthorizationHeader(),
                data: JSON.stringify(address),
                success: function(data) {
                    this.get('addresses').remove(address.id);
                    this.trigger('onUserAddressUpdate');
                },
                error: function(jqXHR) {
                    switch(jqXHR.status) {
                        case 403:
                            this.onForbidden();
                            break;
                        case 404:
                            this.trigger('onUserAddressNotFound');
                            break;
                        case 400:
                            this.trigger('onUserValidationError', getResponse());
                            break;
                        default:
                            this.trigger('onUserAPIError', getResponse());
                    }
                    function getResponse() {
                        return _.isObject(jqXHR.responseJSON) ? jqXHR.responseJSON : {};
                    }
                }
            });
        },
        /**
         * Changes the customer's password. Sends request with following parameters:
         * ```
         * {
         *     url: "https://identity-dev.revelup.com/customers-auth/v1/customers/change-password/<id>/",
         *     method: "POST",
         *     contentType: "application/json",
         *     headers: {Authorization: "Bearer XXXXXXXXXXXXX"},
         *     data: {
         *         "old_password": <current password>,
         *         "new_password": <new password>
         *     }
         * }
         * ```
         * Server may return the following response:
         * - Successful change:
         * ```
         * Status: 200
         * {
         *     "detail": "ok"
         * }
         * ```
         * The model emits `onPasswordChange` event in this case.
         *
         * - Session is already expired or invalid token is used:
         * ```
         * Status: 403
         * {
         *     "detail":"Authentication credentials were not provided."
         * }
         * ```
         * The model emits `onUserSessionExpired` event in this case. Method `.logout()` is automatically called in this case.
         *
         * - Invalid current password:
         * ```
         * Status: 404
         * {
         *     "detail":"Customer object with such password does not exist."
         * }
         * ```
         * The model emits `onPasswordInvalid` event in this case.
         *
         * - New data is invalid:
         * ```
         * Status: 400
         * {
         *     <field name>: <validation error>
         * }
         * ```
         * The model emits `onUserValidationError` event in this case.
         *
         * @returns {Object} jqXHR object.
         */
        changePassword: function() {
            var attrs = this.toJSON();

            return Backbone.$.ajax({
                url: attrs.serverURL + "/customers/change-password/" + attrs.user_id + "/",
                method: "POST",
                context: this,
                contentType: "application/json",
                headers: this.getAuthorizationHeader(),
                data: JSON.stringify({
                    old_password: attrs.password,
                    new_password: attrs.confirm_password
                }),
                success: function(data) {
                    this.clearPasswords();
                    this.trigger('onPasswordChange');
                },
                error: function(jqXHR) {
                    switch(jqXHR.status) {
                        case 403:
                            this.onForbidden();
                            break;
                        case 404:
                            this.trigger('onPasswordInvalid');
                            break;
                        case 400:
                            this.trigger('onUserValidationError', getResponse());
                            break;
                        default:
                            this.trigger('onUserAPIError', getResponse());
                    }

                    function getResponse() {
                        return _.isObject(jqXHR.responseJSON) ? jqXHR.responseJSON : {};
                    }
                }
            });
        },
        /**
         * Resets the customer's password. Sends request with following parameters:
         * ```
         * {
         *     url: "https://identity-dev.revelup.com/customers-auth/v1/customers/reset-password/",
         *     method: "POST",
         *     contentType: "application/json",
         *     data: {
         *         "email": <email address>
         *     }
         * }
         * ```
         * Server may return the following response:
         * - Successful reset:
         * ```
         * Status: 205
         * {
         *     "detail":"Email with password reset token has been sent."
         * }
         * ```
         * The model emits `onPasswordReset` event in this case.
         *
         * - Email address is empty:
         * ```
         * Status: 400
         * {
         *     "email":["This field is required."]
         * }
         * ```
         * The model emits `onPasswordResetError` event in this case.
         *
         * - Email address is invalid:
         * ```
         * Status: 400
         * {
         *     "email": "Customer object with such password does not exist."
         * }
         * ```
         * The model emits `onPasswordResetError` event in this case.
         *
         * - Email address value is too long:
         * ```
         * Status: 400
         * {
         *     "email":["Ensure this field has no more than 254 characters."]
         * }
         * ```
         * The model emits `onPasswordResetError` event in this case.
         *
         * - Customer with such email address doesn't exist:
         * ```
         * Status: 404
         * {
         *     "detail":"Customer object does not exist."
         * }
         * ```
         * The model emits `onPasswordResetCustomerError` event in this case.
         *
         * @returns {Object} jqXHR object.
         */
        resetPassword: function() {
            return Backbone.$.ajax({
                url: this.get('serverURL') + "/customers/reset-password/",
                method: "POST",
                context: this,
                contentType: "application/json",
                data: JSON.stringify({
                    email: this.get('email')
                }),
                success: function(data) {
                    this.trigger('onPasswordReset');
                },
                error: function(jqXHR) {
                    switch(jqXHR.status) {
                        case 205:
                            this.trigger('onPasswordReset');
                            break;
                        case 400:
                            this.trigger('onPasswordResetError', getResponse());
                            break;
                        case 404:
                            this.trigger('onPasswordResetCustomerError', getResponse());
                            break;
                        default:
                            this.trigger('onUserAPIError', getResponse());
                    }

                    function getResponse() {
                        return _.isObject(jqXHR.responseJSON) ? jqXHR.responseJSON : {};
                    }
                }
            });
        },
        /**
         * Sends activation link to a customer's email
         * ```
         * {
         *     url: "https://identity-dev.revelup.com/customers-auth/v1/customers/resend-activation-customer/",
         *     method: "POST",
         *     contentType: "application/json",
         *     data: {
         *         "email": <email address>
         *         "password": <password>
         *     }
         * }
         * ```
         * Server may return the following response:
         * - Successful reset:
         * ```
         * Status: 200
         * ```
         * The model emits `onResendActivationSuccess` event in this case.
         *
         * ```
         * Status: 400
         * {
         *     "email": ["This field is required."]
         * }
         * ```
         * The model emits `onResendActivationError` event in this case.
         *
         * ```
         * Status: 400
         * {
         *     "email": ["Enter a valid email address."]
         * }
         * ```
         * The model emits `onResendActivationError` event in this case.
         *
         * ```
         * Status: 400
         * {
         *     "email": ["Ensure this field has no more than 254 characters."]
         * }
         * ```
         * The model emits `onResendActivationError` event in this case.
         *
         * ```
         * Status: 404
         * {
         *     "detail": "Customer object with such email and password does not exist."
         * }
         * ```
         * The model emits `onResendActivationError` event in this case.
         *
         * @returns {Object} jqXHR object.
         */
        resendActivation: function() {
            var attrs = this.toJSON();

            return Backbone.$.ajax({
                url: attrs.serverURL + "/customers/resend-activation-customer/",
                method: "POST",
                context: this,
                data: {
                    email: attrs.email,
                    password: attrs.password,
                    instance: !isRevelinOrigin() ? getInstanceName() : undefined
                },
                success: function(data) {
                    this.trigger('onResendActivationSuccess');
                },
                error: function(jqXHR) {
                    this.trigger('onResendActivationError', getResponse());

                    function getResponse() {
                        return _.isObject(jqXHR.responseJSON) ? jqXHR.responseJSON : {};
                    }
                }
            });
        },
        /**
         * Converts address to 'customers/addresses/' API format. Changes `zipcode` property to `postal_code`,
         * `country` -> `country_code`, `state`/`province` -> `region`.
         *
         * @param {Object} address - an object containing address data
         * @returns {Object} Modified address object.
         */
        convertAddressToAPIFormat: function(address) {
            if(!_.isObject(address)) {
                return address;
            }

            address.postal_code = address.zipcode;
            address.country_code = address.country;
            address.region = address.country == 'US' ? address.state
                           : address.country == 'CA' ? address.province
                           : null;

            return address;
        },
        /**
         * Converts address from 'customers/addresses/' API format. Changes `postal_code` property to `zipcode`,
         * `country_code` -> `country`, `region` -> `state`/`province`.
         *
         * @param {Object} address - an object containing address data
         * @returns {Object} Modified address object.
         */
        convertAddressFromAPIFormat: function(address) {
            if(!_.isObject(address)) {
                return address;
            }

            address.zipcode = address.postal_code;
            address.country = address.country_code;
            address.state = address.country == 'US' ? address.region : '';
            address.province = address.country == 'CA' ? address.region : '';

            return address;
        },
        /**
         * Set attributes values.
         *
         * @param {Object} data - object corresponding to response of `authorization/token-customer/` {@link App.Models.Customer#login request}
         */
        setCustomerFromAPI: function(data) {
            if(!_.isObject(data) || !_.isObject(data.customer) || !_.isObject(data.token)) {
                console.error('Incorrect `authorization/token-customer/` data format');
                return;
            }

            // need to reset password and set `email` attribute as username
            this.set({
                email: data.customer.email,
                first_name: data.customer.first_name,
                last_name: data.customer.last_name,
                phone: data.customer.phone_number,
                email_notifications: data.customer.email_notifications,
                push_notifications: data.customer.push_notifications,
                user_id: data.token.user_id,
                access_token: data.token.access_token,
                token_type: data.token.token_type,
                expires_in: data.token.expires_in,
                accept_tou: data.customer.accept_tou
            });

            if (data.token.fb_token) {
                this.set('fb_token', data.token.fb_token);
            }

            this.clearPasswords();
        },
        /**
         * Updates cookies with new data.
         *
         * @param {Object} data - object corresponding to response of `v1/authorization/token-customer/` {@link App.Models.Customer#login request}
         */
        updateCookie: function(data) {
            if (!_.isObject(data) || !_.isObject(data.token)) {
                return;
            }

            delete data.addresses;

            var expires_in = this.get('keepCookie') ? data.token.expires_in : 0;
            this.setCookie(utf8_to_b64(JSON.stringify(data)), expires_in);
        },
        /**
         * Sets cookie with user data.
         *
         * @param {string} data - cookie's value
         * @param {number} expires_in - cookie's lifetime
         */
        setCookie: function(data, expires_in) {
            Cookies.set(cookieName, data, {expires: expires_in, path: cookiePath, domain: cookieDomain, secure: true});
        },
        /**
         * @returns {Object|undefined} An object containing cookie's data:
         * ```
         * {
         *     value: <string>,
         *     expires_in: <number>
         * }
         * ```
         */
        getCookieData: function() {
            var value = Cookies.get(cookieName);
            if (value) {
                return {
                    user_cookie: value,
                    cookie_expires_in: this.get('keepCookie') ? this.get('expires_in') : 0
                };
            }
        },
        /**
         * Parse cookie and set customer attributes.
         */
        setCustomerFromCookie: function() {
            var data;

            try {
                data = Cookies.get(cookieName);
                data && delete data.addresses;
            } catch(e) {
                console.error(e);
            }

            if (!data) {
                return;
            }

            try {
                this.setCustomerFromAPI(JSON.parse(b64_to_utf8(data)));
            } catch(e) {
                console.error(e);
            }
        },
        /**
         * @returns {Object} An object corresponding to response of `v1/authorization/token-customer/` {@link App.Models.Customer#login request}.
         */
        getCustomerInAPIFormat: function() {
            var attrs = this.toJSON();

            return {
                customer: {
                    email: attrs.email,
                    first_name: attrs.first_name,
                    last_name: attrs.last_name,
                    phone_number: attrs.phone,
                    email_notifications: attrs.email_notifications,
                    push_notifications: attrs.push_notifications,
                    accept_tou: attrs.accept_tou
                },
                token: {
                    user_id: attrs.user_id,
                    access_token: attrs.access_token,
                    token_type: attrs.token_type,
                    expires_in: attrs.expires_in
                }
            }
        },
        /**
         * Tracks cookie change to apply updates performed in another tab.
         * Emits `onCookieChange` event if cookie changed.
         */
        trackCookieChange: function() {
            var currentState = Cookies.get(cookieName);
            // condition may be true
            // if user returns on tab after profile updating in another tab
            if (_.isString(this.trackCookieChange.prevState) && _.isString(currentState)
                && this.trackCookieChange.prevState != currentState) {
                this.setCustomerFromCookie();
                this.trigger('onCookieChange');
            }
            this.trackCookieChange.prevState = currentState;
        },
        /**
         * @returns {boolean} `true` if user is authorized and `false` otherwise.
         */
        isAuthorized: function() {
            return this.get('access_token') != this.defaults.access_token
                && this.get('user_id') != this.defaults.user_id;
        },
        /**
         * Sets `password`, `confirm_password` values to default.
         */
        clearPasswords: function() {
            this.set({
                password: this.defaults.password,
                confirm_password: this.defaults.confirm_password
            });
        },
        /**
         * Creates an order making payment with token.
         * @param {Object} order - order json (see {@link App.Collections.Myorder#submit_order_and_pay})
         * @param {?Object} [card] - CC json (see {@link App.Collections.Myorder#submit_order_and_pay})
         * @param {?number} [token_id] - token id that has to be used for payment.
         * @returns {Object|undefined} Deferred object.
         */
        payWithToken: function(order, card, token_id) {
            if (!this.payments) {
                return console.error("CC payment processor doesn't provide tokenization")
            }

            var def = Backbone.$.Deferred(),
                payments = this.payments,
                self = this;

            this.paymentsRequest && this.paymentsRequest.always(function() {
                var token;
                if (token_id > -1 && (token = payments.get(token_id))) {
                    token.set('selected', true);
                }
                payments.orderPayWithToken(self.getAuthorizationHeader(), order, self.get('user_id'), card)
                        .done(def.resolve.bind(def))
                        .fail(function(jqXHR) {
                            def.reject.apply(def, arguments);
                            ifSessionIsExpired(jqXHR);
                        });
            });

            function ifSessionIsExpired(jqXHR) {
                if (jqXHR.status == 403) {
                    self.onForbidden();
                }
            }

            return def;
        },
        /**
         * Receives customer addresses from server. Sends request with following parameters:
         * ```
         * {
         *     url: "/weborders/v1/addresses/",
         *     method: "GET",
         *     headers: {Authorization: "Bearer XXX"}
         * }
         * ```
         * There are available following responses:
         * - Success:
         * ```
         * Status code 200
         * {
         *     status: "OK"
         *     data: []
         * }
         * ```
         *
         * - Authorization header is invalid:
         * ```
         * Status code 403
         * ```
         */
        getAddresses: function() {
            var self = this,
                authorizationHeader = this.getAuthorizationHeader(),
                req;

            if (!_.isObject(authorizationHeader)) {
                return;
            }

            req = Backbone.$.ajax({
                url: this.get('serverURL') + '/customers/addresses/',
                method: "GET",
                headers: authorizationHeader,
                success: function(data) {
                    if (Array.isArray(data)) {
                        self.get('addresses').updateFromAPI(data);
                    }
                },
                error: new Function() // to override global ajax error handler
            });

            req.fail(function(jqXHR) {
                if (jqXHR.status == 403) {
                    self.onForbidden();
                }
            });

            /**
             * Reward cards request.
             * @alias App.Models.Customer#addressesRequest
             * @type {Backbone.$.Deferred}
             * @default undefined
             */
            this.addressesRequest = req;

            return req;
        },
        /**
         * Sets {@link App.Models.Customer#addresses addresses} collection.
         */
        setAddresses: function() {
            var addresses = this.get('addresses'),
                req,
                self = this;

            if (!this.get('addresses')) {
                this.set('addresses', new App.Collections.CustomerAddresses());
                addresses = this.get('addresses');
            }

            if (this.isAuthorized()) {
                req = this.getAddresses();
            }
            else {
                req = Backbone.$.Deferred().resolve();
            }

            req.always(function() {
                // if there are no address models, create an empty one
                !addresses.length && addresses.addDefault();
            });
        },
        /**
         * Receives payments from server.
         * @returns {Object|undefined} jqXHR object.
         */
        getPayments: function() {
            if (!this.payments) {
                return console.error("CC payment processor doesn't provide tokenization")
            }

            var self = this,
                req = this.payments.getPayments(this.getAuthorizationHeader());

            req.fail(function(jqXHR) {
                if (jqXHR.status == 403) {
                    self.onForbidden();
                }
            });

            /**
             * Payments request.
             * @alias App.Models.Customer#paymentsRequest
             * @type {Backbone.$.Deferred}
             * @default undefined
             */
            this.paymentsRequest = req;

            return req;
        },
        /**
         * @returns {boolean} `true` if any payment token is selected for payment
         * and `payments.ignoreSelectedToken` property is `false`.
         */
        doPayWithToken: function() {
            return Boolean(this.isAuthorized() && this.payments && !this.payments.ignoreSelectedToken && this.payments.getSelectedPayment());
        },
        /**
         * Sets payments tokens collection.
         * @param {Function} constr - payments collection constructor
         */
        setPayments: function(constr) {
            this._setPayments = function() {
                if (typeof constr == 'function') {
                    /**
                     * Collection of payments tokens (depends on CC payment processor).
                     * @alias App.Models.Customer#payments
                     * @type {Backbone.Collection}
                     * @default undefined
                     */
                    this.payments = new constr();
                    this.payments.serverURL = this.get('serverURL');
                    this.listenTo(this.payments, 'onCVVRequired', this.trigger.bind(this, 'onCVVRequired'));
                }
            };
            this.isAuthorized() && this.initPayments();
        },
        /**
         * Sets payments collection and receives data.
         */
        initPayments: function() {
            typeof this._setPayments == 'function' && this._setPayments();
            this.payments && this.getPayments();
        },
        /**
         * Changes payment token.
         * @param {number} token_id - token id.
         * @return {Object} jqXHR object.
         */
        changePayment: function(token_id) {
            var req = this.payments.changePayment(token_id, this.getAuthorizationHeader()),
                self = this;

            if (req) {
                req.fail(function(jqXHR)
                {
                    if (jqXHR.status == 403) {
                        self.onForbidden();
                    }
                    else if (jqXHR.status == 404) {
                        self.trigger('onTokenNotFound');
                    }
                });
            }

            return req;
        },
        /**
         * Aborts payments request and deletes {@link App.Models.Customer#payments payments},
         * {@link App.Models.Customer#paymentsRequest paymentsRequest} properties.
         */
        removePayments: function() {
            this.paymentsRequest && this.paymentsRequest.abort();
            delete this.paymentsRequest;
            delete this.payments;
        },
        /**
         * Removes payment token.
         * @param {number} token_id - token id.
         * @return {Object} jqXHR object.
         */
        removePayment: function(token_id) {
            var req = this.payments.removePayment(token_id, this.getAuthorizationHeader()),
                self = this;

            if (req) {
                req.fail(function(jqXHR) {
                    if (jqXHR.status == 403) {
                        self.onForbidden();
                    } else if (jqXHR.status == 404) {
                        self.trigger('onTokenNotFound');
                    }
                });
            }

            return req;
        },
        /**
         * Sets gift cards collection.
         * @param {Function} constr - gift cards collection constructor
         */
        setGiftCards: function(constr) {
            this.isAuthorized() && this.initGiftCards();
        },
        setRewardCards: function() {
            if (!this.get('rewardCards')) {
                this.set('rewardCards', new App.Collections.RewardCards());
            }
            if (this.isAuthorized()) {
                this.getRewardCards();
            }
        },
        getRewardCards: function() {
            if (!this.get('rewardCards')) {
                return console.error("Rewards cards have not been initialized");
            }

            var self = this,
                req = this.get('rewardCards').getCards(this.getAuthorizationHeader());

            req.fail(function(jqXHR) {
                if (jqXHR.status == 403) {
                    self.onForbidden();
                }
            });

            req.success(function(jqXHR) {
                if (jqXHR.status == "OK" && self.get('rewardCards').length == 1) {
                    App.Data.myorder.rewardsCard.selectRewardCard(self.get('rewardCards').at(0));
                }
            });

            /**
             * Reward cards request.
             * @alias App.Models.Customer#rewardCardsRequest
             * @type {Backbone.$.Deferred}
             * @default undefined
             */
            this.rewardCardsRequest = req;

            return req;
        },
        /**
         * Sets gift cards collection and receives data.
         */
        initGiftCards: function() {
            this.giftCards && this.getGiftCards();
        },
        /**
         * Aborts gift cards request and deletes {@link App.Models.Customer#giftCards giftCards},
         * {@link App.Models.Customer#giftCardsRequest giftCardsRequest} properties.
         */
        removeGiftCards: function() {
            this.giftCardsRequest && this.giftCardsRequest.abort();
            delete this.giftCardsRequest;
            this.giftCards.reset();
        },
        /**
         * Aborts reward cards request and deletes {@link App.Models.Customer#rewardCards rewardCards},
         * {@link App.Models.Customer#rewardCardsRequest rewardCardsRequest} properties.
         */
        removeRewardCards: function() {
            this.rewardCardsRequest && this.rewardCardsRequest.abort();
            delete this.rewardCardsRequest;
            if (this.get('rewardCards')) { // bug_44919
                this.get('rewardCards').reset();
            }
            App.Data.myorder.rewardsCard.resetData(); // bug_43982
        },
        /**
         * Receives gift cards from server.
         * @returns {Object|undefined} jqXHR object.
         */
        getGiftCards: function() {
            if (!this.giftCards) {
                return console.error("Saved gift cards are disabled");
            }

            var self = this,
                req = this.giftCards.getCards(this.getAuthorizationHeader());

            req.fail(function(jqXHR) {
                if (jqXHR.status == 403) {
                    self.onForbidden();
                }
            });

            /**
             * Gift cards request.
             * @alias App.Models.Customer#giftCardsRequest
             * @type {Backbone.$.Deferred}
             * @default undefined
             */
            this.giftCardsRequest = req;

            return req;
        },
        /**
         * Links gift card with the customer.
         * @param {App.Models.GiftCard} giftCard - gift card model
         * @returns {Object|undefined} jqXHR object.
         */
        linkGiftCard: function(giftCard) {
            if (!_.isObject(giftCard) || typeof giftCard.linkToCustomer != 'function') {
                return;
            }
            var status = giftCard.check();
            if (status.status != "OK")
                return;

            var req = giftCard.linkToCustomer(this.getAuthorizationHeader()),
                self = this;

            req.done(function(data) {
                if (_.isObject(data) && data.status == 'OK') {
                    self.giftCards.addUniqueItem(giftCard);
                }
            });

            req.fail(function(jqXHR) {
                if (jqXHR.status == 403) {
                    self.onForbidden();
                }
            });

            return req;
        },
        /**
         * Unlinks gift card with the customer.
         * @param {App.Models.GiftCard} giftCard - gift card model
         * @returns {Object|undefined} jqXHR object.
         */
        unlinkGiftCard: function(giftCard) {
            if (!_.isObject(giftCard) || typeof giftCard.unlinkToCustomer != 'function') {
                return;
            }

            var req = giftCard.unlinkToCustomer(this.getAuthorizationHeader()),
                self = this;

            req.fail(function(jqXHR) {
                if (jqXHR.status == 403) {
                    self.onForbidden();
                }
            });

            return req;
        },
        /**
         * @returns {boolean} `true` if any gift card is selected for payment.
         */
        doPayWithGiftCard: function() {
            return Boolean(this.isAuthorized() && this.giftCards && !this.giftCards.ignoreSelected && this.giftCards.getSelected());
        },
         /**
         * Links reward card with the customer.
         * @param {App.Models.RewardCard} rewardCard - reward card model
         * @returns {Object|undefined} jqXHR object.
         */
        linkRewardCard: function(rewardCard) {
            var self = this;
            if (!_.isObject(rewardCard) || typeof rewardCard.linkToCustomer != 'function') {
                return;
            }

            var status = rewardCard.check();
            if (status.status != "OK")
                return;

            var req = rewardCard.linkToCustomer(this.getAuthorizationHeader());

            req.done(function(data) {
                if (_.isObject(data) && data.status == 'OK') {
                    self.get('rewardCards').addUniqueItem(rewardCard);
                }
            });

            req.fail(function(jqXHR) {
                if (jqXHR.status == 403) {
                    self.onForbidden();
                }
            });

            return req;
        },
        /**
         * Unlinks reward card with the customer.
         * @param {App.Models.RewardCard} rewardCard - reward card model
         * @returns {Object|undefined} jqXHR object.
         */
        unlinkRewardCard: function(rewardCard) {
            if (!_.isObject(rewardCard) || typeof rewardCard.unlinkToCustomer != 'function') {
                return;
            }

            var req = rewardCard.unlinkToCustomer(this.getAuthorizationHeader()),
                self = this;

            req.fail(function(jqXHR) {
                if (jqXHR.status == 403) {
                    self.onForbidden();
                }
            });

            return req;
        },
        /**
         * Handler of jqXHR.status 403 of customer-related ajax requests.
         */
        onForbidden: function() {
            this.trigger('onUserSessionExpired');
            this.logout(); // need to reset current account to allow to re-log in
        },
        /**
         * The wrapper for addresses.getCheckoutAddress() method.
         * @param {string} [dining_option] - dining option.
         * @param {boolean} [fromProfile] - indicates whether to use fields from profile address
         * @returns {@link App.Models.Customer.addresses.getCheckoutAddress()}
         */
        getCheckoutAddress: function(dining_option, fromProfile) {
            return this.get('addresses').getCheckoutAddress(dining_option, fromProfile);
        },
        /**
         * The wrapper for addresses.getOrderAddress() method.
         * @param {?object} address - address object to convert. If not specified, selected address will be used.
         * @returns {@link App.Models.Customer.addresses.getOrderAddress()}
         */
        getOrderAddress: function(address) {
            return this.get('addresses').getOrderAddress(address);
        },
        /**
         * Calls {@link App.Models.Customer#getOrders getOrders()} method if user is authorized.
         */
        initOrders: function() {
            this.isAuthorized() && this.getOrders();
        },
        /**
         * Receives orders from server.
         * @returns {Object|undefined} jqXHR object.
         */
        getOrders: function() {
            if (!this.orders) {
                return console.error("Orders have not been initialized yet");
            }

            var self = this,
                req = this.orders.get_orders(this.getAuthorizationHeader());

            req.fail(function(jqXHR) {
                if (jqXHR.status == 403) {
                    self.onForbidden();
                }
            });

            req.done(function() {
                // set first order as past order
                self.orders.length && self.set('pastOrder', self.orders.at(0));
            });

            /**
             * Orders request.
             * @member
             * @alias App.Models.Customer#ordersRequest
             * @type {Backbone.$.Deferred}
             * @default undefined
             */
            this.ordersRequest = req;

            return req;
        },
        /**
         * Receives order from server.
         *
         * @param {number} order_id - order id.
         * @returns {Object|undefined} jqXHR object.
         */
        getOrder: function(order_id) {
            if (!this.orders) {
                return console.error("Orders have not been initialized yet");
            }

            var self = this,
                req = this.orders.get_order(this.getAuthorizationHeader(), order_id);

            req.fail(function(jqXHR) {
                if (jqXHR.status == 403) {
                    self.onForbidden();
                }
            });

            return req;
        },
        /**
         * Receives order items from server.
         *
         * @param {App.Models.Order} order - an order model.
         * @returns {Object|undefined} jqXHR object.
         */
        getOrderItems: function(order) {
            if (!(order instanceof App.Models.Order)) {
                return;
            }

            var self = this,
                req = order.setItems(this.getAuthorizationHeader());

            req.fail(function(jqXHR) {
                if (jqXHR.status == 403) {
                    self.onForbidden();
                }
            });

            return req;
        },
        /**
         * Reorder.
         *
         * @param {number} order_id - order id
         * @returns {Object} jQuery Deffered object.
         */
        reorder: function(order_id, options) {
            var self = this,
                dfd = Backbone.$.Deferred();

            if (this.ordersRequest) {
                this.ordersRequest.done(function() {
                    var reorder = self.orders.reorder(self.getAuthorizationHeader(), order_id, options);
                    reorder.done(dfd.resolve.bind(dfd));
                    reorder.fail(dfd.reject.bind(dfd));
                });
                this.ordersRequest.fail(function(jqXHR) {
                    if (jqXHR.status == 403) {
                        self.onForbidden();
                    }
                    dfd.reject();
                });
            } else {
                dfd.reject();
            }

            return dfd;
        },
        /**
         * If {@link App.Models.Customer#ordersRequest ordersRequest} exists then the method aborts and deletes it.
         * Resets customer {@link App.Models.Customer#ordersRequest orders}.
         */
        removeOrders: function() {
            this.ordersRequest && this.ordersRequest.abort();
            delete this.ordersRequest;
            this.set('pastOrder', this.defaults.pastOrder);
            this.orders.reset();
        }
    });

    /**
     * @class
     * @classdesc Represents a customer address model.
     * @alias App.Models.CustomerAddress
     * @augments Backbone.Model
     * @example
     * // create a customer address model
     * require(['customers'], function() {
     *     var address = new App.Models.CustomerAddress();
     * });
     */
    App.Models.CustomerAddress = Backbone.Model.extend(
    /**
     * @lends App.Models.CustomerAddress.prototype
     */
    {
        /**
         * Contains attributes with default values.
         * @type {object}
         */
        defaults: {
            /**
             * Address ID.
             * @type {?(number|string)}
             * @default null
             */
            id: null,
            /**
             * Customer ID. {@link App.Models.Customer#id}
             * @type {?(number|string)}
             * @default null
             */
            customer: null,
            /**
             * Indicates whether this address is primary (default) or not.
             * @type {Boolean}
             * @default false
             */
            is_primary: false,
            /**
             * Indicates whether this address is selected or not.
             * @type {Boolean}
             * @default false
             */
            selected: false,
            /**
             * Zipcode or postal code.
             * @type {String}
             * @default ''
             */
            zipcode: '',
            /**
             * Country.
             * @type {?String}
             * @default ''
             */
            country: '',
            /**
             * State (used id country is US).
             * @type {?String}
             * @default ''
             */
            state: '',
            /**
             * Province (used if country is Canada).
             * @type {String}
             * @default ''
             */
            province: '',
            /**
             * Street address, line 1.
             * @type {String}
             * @default ''
             */
            street_1: '',
            /**
             * Street address, line 2.
             * @type {String}
             */
            street_2: '',
            /**
             * City.
             * @type {String}
             * @default ''
             */
            city: '',
            /**
             * String representation of full address line.
             * @type {String}
             * @default ''
             */
            address: ''
        },
        /**
         * Sets `address` attribute value.
         */
        initialize: function() {
            var self = this;
            updateAddress();
            this.listenTo(this, 'change', updateAddress);
            function updateAddress() {
                self.set('address', self.toString());
            }
        },
        /**
         * Converts the address objects from API to model format.
         * This method gets called when {parse: true} is passed to the model constructor or method set, e.g.:
         * ```
         * // create a new model
         * var address = new App.Models.CustomerAddress({country_code: 'AU'}, {parse: true});
         * // update the model attributes
         * address.set({country_code: 'FR'}, {parse: true});
         * ```
         * @param   {object} address
         * @param   {object} options
         * @returns {object} converted address
         */
        parse: function(address, options) {
            return this.convertFromAPIFormat(address);
        },
        /**
         * Converts address to 'customers/addresses/' API format. Changes `zipcode` property to `postal_code`,
         * `country` -> `country_code`, `state`/`province` -> `region`.
         *
         * @param {Object} address - an object containing address data
         * @returns {Object} Modified address object.
         */
        convertToAPIFormat: function(address) {
            if (!_.isObject(address)) {
                return address;
            }

            address.postal_code = address.zipcode;
            address.country_code = address.country;
            address.region = address.country == 'US' ? address.state
                           : address.country == 'CA' ? address.province
                           : null;

            return address;
        },
        /**
         * Converts address from 'customers/addresses/' API format. Changes `postal_code` property to `zipcode`,
         * `country_code` -> `country`, `region` -> `state`/`province`.
         *
         * @param {Object} address - an object containing address data
         * @returns {Object} Modified address object.
         */
        convertFromAPIFormat: function(address) {
            if (!_.isObject(address)) {
                return address;
            }

            address.zipcode = address.postal_code;
            address.country = address.country_code;
            address.state = address.country == 'US' ? address.region : '';
            address.province = address.country == 'CA' ? address.region : '';

            return address;
        },
        /**
         * Converts address to full address line.
         * @see {@link http://mediawiki.middlebury.edu/wiki/LIS/Address_Standards} for detail format information.
         * @returns {string} full address line
         */
        toString: function(address) {
            var address = address || this.toJSON(),
                settings = App.Settings,
                str = [];
            address.street_1 && str.push(address.street_1);
            address.street_2 && str.push(address.street_2);
            address.city && str.push(address.city);
            settings.address && settings.address.state && address.state && str.push(address.state);
            address.zipcode && str.push(address.zipcode);

            return str.join(', ');
        },
        /**
         * @returns {boolean} `true` if the address has `id`, `customer` properties and `false` otherwise.
         */
        isProfileAddress: function() {
            return !isNaN(this.get('id')) && !!this.get('customer');
        }
    });

    /**
     * @class
     * @classdesc Represents a customer addresses collection.
     * @alias App.Collections.CustomerAddresses
     * @augments Backbone.Collection
     * @example
     * require(['customers'], function() {
     *     var addresses = new App.Collections.CustomerAddresses();
     * });
     */
    App.Collections.CustomerAddresses = Backbone.Collection.extend(
    /**
     * @lends App.Collections.CustomerAddresses.prototype
     */
    {
        /**
         * Item constructor.
         * @type {Function}
         * @default App.Models.CustomerAddress
         */
        model: App.Models.CustomerAddress,
        /**
         * Collection comparator.
         * @param   {App.Models.CustomerAddress} model
         * @returns {number} - a numeric or string value by which the model should be ordered relative to others.
         */
        comparator: function(model) {
            if (model.get('is_primary')) {
                return -1;
            }
            if (model.get('id') === null) {
                return 2;
            }
            return 0;
        },
        /**
         * Adds listeners to track changes of 'selected' attribute and collection updates.
         */
        initialize: function() {
            this.listenTo(this, 'change:selected', this.radioSelection.bind(this, 'selected'));
            this.listenTo(this, 'change:is_primary', this.radioSelection.bind(this, 'is_primary'));
            this.listenTo(this, 'change', this.onModelChange);
            this.listenTo(this, 'reset add remove', function() {
                this.trigger('update');
            });
            // handle the case when the collection doesn't contain any profile address after the address removal
            this.listenTo(this, 'remove', function() {
                if (!this.some(function(model) { return !isNaN(model.get('id')); })) {
                    this.addDefault();
                }
            });
        },
        /**
         * Adds default empty address to the collection.
         */
        addDefault: function() {
            var country = App.Settings.address && App.Settings.address.country ? App.Settings.address.country : "",
                state = country == "US" ? App.Settings.address.state : "";
            this.add({country: country, // bug 53808
                    state: state });
            return this;
        },
        /**
         * Converts the array of addresses objects from API to model format.
         * This method gets called when {parse: true} is passed to the collection constructor.
         * @param   {array} addresses
         * @param   {object} options
         * @returns {array} converted addresses
         */
        parse: function(addresses, options) {
            return _.map(addresses, App.Models.CustomerAddress.prototype.convertFromAPIFormat);
        },
        /**
         * Emits `addressFieldsChanged` event passing the changed address model as parameter.
         * This event fires when any of `street_1`, `street_2`, `city`, `state`, `province`,
         * `country`, `zipcode`, `is_primary` attributes changes.
         * `addressFieldsChanged` doesn't fire if either `state` or `country` changes to null.
         * @param {App.Models.CustomerAddress} model - customer address
         */
        onModelChange: function(model) {
            var changed = model.changedAttributes(),
                keys = ['street_1', 'street_2', 'city', 'state', 'province', 'country', 'zipcode', 'is_primary'],
                trigger = _.some(keys, function(key) {
                    return _.has(changed, key);
                });

            if (trigger) {
                // default value is "" but select binding converts it to null
                if ((_.isEqual(changed, {state: null}) || _.isEqual(changed, {country: null})) || _.isEqual(changed, {state: null, country: null})) {
                    return;
                }
                this.trigger('addressFieldsChanged', model);
            }
        },
        /**
         * Updates the collection with data received from API.
         * @param {array} addresses - array of addresses if API format.
         */
        updateFromAPI: function(addresses) {
            var self = this,
                modelsToRemove = [];

            // remove from collection addresses not presented in api response
            this.each(function(model) {
                if (!isNaN(model.get('id')) && !_.findWhere(addresses, {id: model.id})) {
                    modelsToRemove.push(model);
                }
            });
            self.remove(modelsToRemove);

            // add all addresses
            _.each(addresses, function(address) {
                self.add(App.Models.CustomerAddress.prototype.convertFromAPIFormat(address));
            });
            this.trigger('updated_from_backend');
        },
        /**
         * Saves addresses to a storage.
         */
        saveToStorage: function() {
            setData('address', new Backbone.Model({addresses: this.toJSON()}), true);
        },
        /**
         * Loads addresses from a storage.
         */
        loadFromStorage: function() {
            var data = getData('address', true);
            if (data instanceof Object && Array.isArray(data.addresses) && data.addresses.length == 1 && App.skin != App.Skins.RETAIL) {
                if (data.addresses[0].country != App.Settings.address.country) {
                    //the thread come here e.g. when we navigate from 'Retail' skin with other country payment previously submitted to weborder_mobile skin
                    data = undefined;
                }
            }
            this.set(data instanceof Object ? (data.addresses || []) : []);
        },
        /**
         * Returns the default profile address.
         * @returns {@link App.Models.CustomerAddress}
         *   - the default address, if it exists
         *   - undefined otherwise
         */
        getDefaultProfileAddress: function() {
            return this.findWhere({is_primary: true});
        },
        /**
         * Returns the selected address.
         * @returns {@link App.Models.CustomerAddress}
         *   - the selected address, if it exists
         *   - undefined otherwise
         */
        getSelectedAddress: function() {
            return this.findWhere({selected: true});
        },
        /**
         * Checks whether the selected address is from user profile.
         * @returns {boolean}
         */
        isProfileAddressSelected: function() {
            var selected = this.getSelectedAddress();
            return selected ? selected.isProfileAddress() : false;
        },
        /**
         * Checks whether the selected address is new (filled on checkout screen) and not from user profile.
         * @returns {Boolean} [description]
         */
        isNewAddressSelected: function() {
            var selected = this.getSelectedAddress();
            return selected ? !selected.isProfileAddress() : false;
        },
        /**
         * Get address set for shipping/delivery or default address set in backend.
         * @param {string} [dining_option] - dining option.
         * @param {boolean} [fromProfile] - indicates whether to use fields from profile address
         * @returns {object} with state, province, city, street_1, street_2, zipcode, contry fields
         */
        getCheckoutAddress: function(dining_option, fromProfile) {
            var customer = App.Data.customer,
                addr = this.getSelectedAddress(),
                addrJson,
                reverse_addr,
                newAddr;

            // if shipping address isn't selected take last index
            if (!addr) {
                addr = this.get(dining_option);
                if (!addr) {
                    addr = new App.Models.CustomerAddress({
                        id: dining_option,
                        selected: true,
                        country : App.Settings.address.country,
                        state: App.Settings.address.state
                    });
                    this.add(addr);
                }
            }

            addrJson = addr.toJSON();

            this.some(function(model, index) {
                var el = model.toJSON();
                return typeof el.id == 'string' && isNaN(el.id) && el.id != dining_option && (reverse_addr = el); // use the first existing address
            });
            if (!reverse_addr && fromProfile && customer.isAuthorized()) {
                reverse_addr = this.getDefaultProfileAddress(); // use profile address
                if (reverse_addr) {
                    reverse_addr = reverse_addr.toJSON();
                }
            }

            if (reverse_addr) {
                if ((addrJson.country && reverse_addr.country && addrJson.country == reverse_addr.country) ||
                    (!addrJson.country && reverse_addr.country == App.Settings.address.country)) { //if country was changed then we can't copy address
                    if (!addrJson.province && !addrJson.street_1 && !addrJson.street_2 && !addrJson.city && !addrJson.zipcode) { //and we will copy address if all target fields are empty only
                        newAddr = _.extend(addrJson, {
                            state: reverse_addr.state,
                            province: reverse_addr.province,
                            street_1: reverse_addr.street_1,
                            street_2: reverse_addr.street_2,
                            city: reverse_addr.city,
                            zipcode: reverse_addr.zipcode
                        });
                        addr.set(newAddr);
                        return this.getOrderAddress(newAddr);
                    }
                }
            }

            return addrJson && typeof addrJson.street_1 === 'string' ? this.getOrderAddress(addrJson) : undefined;
        },
        /**
         * Returns customer address for sending to create_order_and_pay/.
         * @param {?object} address - address object to convert. If not specified, selected address will be used.
         * @returns {object} address object.
         */
        getOrderAddress: function(address) {
            var selected = this.getSelectedAddress(),
                address = _.isObject(address) ? address : selected ? selected.toJSON() : null;

            if (!address) {
                return;
            }

            return {
                // here we need only the following fields (no need for extra fields from profile address.
                // once Backend receives customer.address.id, it will look for this address in the database, but it could be saved on another instance.)
                address: address.address || '',
                city: address.city || '',
                country: address.country || '',
                province: address.province || '',
                state: address.state || '',
                street_1: address.street_1 || '',
                street_2: address.street_2 || '',
                zipcode: address.zipcode || ''
            };
        },
        /**
         * If the selected address is not from profile, changes the selection according to the specified dining option (used as a model id).
         * @param {string} dining_option - selected dining option.
         */
        changeSelection: function(dining_option) {
            if (!this.isProfileAddressSelected()) {
                this.invoke('set', {selected: false});
                this.get(dining_option) && this.get(dining_option).set('selected', true);
            }
        },
        /**
         * When the address is selected, deselects all other addresses (radio button behavior).
         * @param {App.Models.CustomerAddress} model - address model.
         * @param {boolean} value - value of the changed attribute.
         * @param {string} attributeName - name of the changed attribute.
         */
        radioSelection: function(attributeName, model, value) {
            value && this.some(function(el) {
                el !== model && el.get(attributeName) && el.set(attributeName, false);
            });
        },
        /**
         * Removes profile addresses (models with numeric id) from the collection.
         */
        removeProfileAddresses: function() {
            this.remove(this.filter(function(model) {
                return !isNaN(model.get('id'));
            }));
        },
    });

});
