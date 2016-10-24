/**
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
 * Contains {@link App.Models.Delivery} constructors.
 * @module delivery
 * @requires module:backbone
 * @see {@link module:config.paths actual path}
 */
define(["backbone"], function(Backbone) {
    'use strict';

    /**
     * @class
     * @classdesc Represents 'Delivery' dining option parameters.
     * @alias App.Models.Delivery
     * @augments Backbone.Model
     * @example
     * // create a delivery model
     * require(['delivery'], function() {
     *     var delivery = new App.Models.Delivery;
     * });
     */
    App.Models.Delivery = Backbone.Model.extend(
    /**
     * @lends App.Models.Delivery.prototype
     */
    {
        /**
         * Contains attributes with default values.
         * @type {object}
         * @enum {string}
         */
        defaults: {
            /**
             * Charge amount for delivery.
             * @type {number}
             * @default 0
             */
            charge: 0,
            /**
             * Delivery charges. Array of objects in the following format:
             * ```
             * [{
             *      amount: 10,
             *      max_threshold: 50,
             *      min_threshold: 0,
             *      type: 1
             * }, {
             *      amount: 10,
             *      max_threshold: null,
             *      min_threshold: 50,
             *      type: 0
             * }]
             * ```
             * @type {?array}
             * @default null
             */
            charges: null,
            /**
             * Indicates 'Delivery' is enabled or disabled.
             * @type {boolean}
             * @default false
             */
            enable: false,
            /**
             * Max distance from a store an order can be delivered.
             * @type {number}
             * @default 0
             */
            max_distance: 0,
            /**
             * Min amount an order has to have to be delivered.
             * @type {number}
             * @default 0
             */
            min_amount: 0 // min total amount for delivery enable. Only sum of products and modifiers
        },
        /**
         * Parses delivery parameters from App.Settings and set as attributes.
         */
        initialize: function(opts) {
            var settings = App.Settings,
                set = {
                    charges: App.Data.settings.get_delivery_charges(),
                    enable: settings.delivery_for_online_orders,
                    max_distance: settings.max_delivery_distance,
                    min_amount: settings.min_delivery_amount
                };

            opts = opts instanceof Object ? opts : {};
            this.set($.extend({}, this.defaults, set, opts));
        },
        /**
         * @returns {number} `charge` attribute value if 'Delivery' feature is enabled or 0 otherwise.
         */
        getCharge: function() {
            return this.get('enable') ? this.get('charge') : 0;
        },
        /**
         * @returns {?number} Amount that need to be added to order to allow 'Delivery' feature.
         */
        getRemainingAmount: function(subtotal) {
            // Get correct delivery charge and service fee
            var service_fee = App.Data.myorder.get_service_fee_charge(),
                items_total = subtotal - service_fee;

            return this.get('enable') ? this.get('min_amount') - items_total : null;
        }
    });
});
