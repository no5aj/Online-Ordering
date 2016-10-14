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
 * Contains {@link App.Models.OrderItem}, {@link App.Collections.OrderItems},
 * {@link App.Models.Order}, {@link App.Collections.Orders} constructors.
 * @module orders
 * @requires module:backbone
 * @see {@link module:config.paths actual path}
 */
define(["backbone"], function(Backbone) {
    'use strict';

    /**
     * @class
     * @classdesc Represents an order item.
     * @alias App.Models.OrderItem
     * @augments App.Models.Myorder
     * @example
     * // create an order item model
     * require(['orders'], function() {
     *     var orderItem = new App.Models.OrderItem();
     * });
     */
    App.Models.OrderItem = App.Models.Myorder.extend(
    /**
     * @lends App.Models.OrderItem.prototype
     */
    {
        /**
         * Applies options via [addJSON()]{@link App.Models.Myorder#addJSON} method, calculates `initial_price`, `sum`.
         */
        initialize: function(options) {
            App.Models.Myorder.prototype.initialize.apply(this, arguments);
            if (_.isObject(options)) {
                this.addJSON(options);
                this.set({
                    initial_price: this.get_initial_price(),
                    sum: this.get_modelsum()
                });
                this.update_mdf_sum();
            }
        },
        /**
         * Makes reorder.
         * @returns {Array} Array of attributes changed from order placement.
         */
        reorder: function() {
            var product = this.get_product(),
                modifiers = this.get_modifiers(),
                sizeModifier = modifiers && modifiers.getSizeModel(),
                changes = [];

            // make product reorder
            changes.push.apply(changes, product.reorder(!!sizeModifier));

            // remove order item if product isn't available right now
            if (changes.indexOf('active') > -1 && !product.get('active') && this.collection) {
                this.collection.remove(this);
            }

            // make modifiers reorder
            if (modifiers) {
                changes.push.apply(changes, modifiers.reorder())
                modifiers.enableFreeModifiers();
            };

            return changes;
        }
    });

    /**
     * @class
     * @classdesc Represents an order items.
     * @alias App.Collections.OrderItem
     * @augments App.Models.Myorder
     * @example
     * // create order items model
     * require(['orders'], function() {
     *     var orderItem = new App.Models.OrderItem();
     * });
     */
    App.Collections.OrderItems = Backbone.Collection.extend(
    /**
     * @lends App.Collections.OrderItems.prototype
     */
    {
        /**
         * Function constructor of item.
         * @type {Backbone.Model}
         * @default App.Models.OrderItem
         */
        model: App.Models.OrderItem,
        /**
         * Calls {@link App.Collections.OrderItem#reorder reorder()} method to each item.
         * @returns {Array} Array of attributes changed from order placement.
         */
        reorder: function () {
            var changes = [],
                items = this.models.slice();

            // do not use the collection as items resource
            // because it can be modified during processing
            // (for instance, first item was removed from collection as inactive and further values of orderItem will be incorrect)
            items.forEach(function(orderItem) {
                changes.push.apply(changes, orderItem.reorder());
            });

            return changes;
        }
    });

    /**
     * @class
     * @classdesc Represents a customer's order.
     * @alias App.Models.Order
     * @augments Backbone.Model
     * @example
     * // create an order model
     * require(['orders'], function() {
     *     var order = new App.Models.Order();
     * });
     */
    App.Models.Order = Backbone.Model.extend(
    /**
     * @lends App.Models.Order.prototype
     */
    {
        /**
         * Contains attributes with default values.
         * @type {object}
         * @enum {string}
         */
        defaults: {
            /**
             * Call name. Short customer info in one line.
             * It may contain first name, last name, delivery address, phone, custom dining options
             * @type {string}
             * @default ''
             */
            call_name: '',
            /**
             * Indicates whether the order is closed. An order gets closed when it is completed on POS.
             * @type {boolean}
             * @default false
             */
            closed: false,
            /**
             * Order placement time in 'mm/dd/yyyy hh:mm' format.
             * @type {string}
             * @default ''
             */
            created_date: '',
            /**
             * Delivery/Sipping/Catering address.
             * @type {?Object}
             * @defaut null
             */
            delivery_address: null,
            /**
             * Dining option.
             * @type {number}
             * @default 0
             */
            dining_option: 0,
            /**
             * Order discount.
             * @type {number}
             * @default 0
             */
            discounts: 0,
            /**
             * Grand total (includes tip, tax, surcharge, sub total).
             * @type {number}
             * @default 0
             */
            final_total: 0,
            /**
             * Order id.
             * @type {?number}
             * @default null
             */
            id: null,
            /**
             * Order notes.
             * @type {string}
             * @default ''
             */
            notes: '',
            /**
             * Payment type.
             * ```
             *     PAYPAL MOBILE (PayPal app) - 1,
             *     CREDIT CARD- 2,
             *     PAYPAL - 3,
             *     NO_PAYMENT (Pay at store, Pay at Delivery) - 4,
             *     GIFT CARD - 5,
             *     STANFORD CARD - 6
             * ```
             * @type {number}
             * @default 2
             */
            payment_type: 2,
            /**
             * Pickup time in 'mm/dd/yyyy hh:mm' format.
             * @type {?string}
             * @default null
             */
            pickup_time: null,
            /**
             * Prevailing surcharge rate.
             * @type {number}
             * @default 0
             */
            prevailing_surcharge: 0,
            /**
             * Prevailing tax rate.
             * @type {number}
             * @default 0
             */
            prevailing_tax: 0,
            /**
             * Balance due amount.
             * @type {number}
             * @default 0
             */
            remaining_due: 0,
            /**
             * Sut total amount.
             * @type {number}
             * @default 0
             */
            subtotal: 0,
            /**
             * Surcharge amount.
             * @type {number}
             * @default 0
             */
            surcharge: 0,
            /**
             * Tax amount.
             * @type {number}
             * @default 0
             */
            tax: 0,
            /**
             * Tax country. It allows to determine whether tax is included to sub total.
             * @type {string}
             * @default 'us'
             */
            tax_country: 'us',
            /**
             * Tip amount.
             * @type {number}
             * @default 0
             */
            tip: 0,
            /**
             * Items quantity.
             * @type {number}
             * @default 0
             */
            items_qty: 0,
            /**
             * Order items.
             * @type {Backbone.Collection}
             * @default null
             */
            items: null,
            /**
             * Items request (jqXHR).
             * @type {?object}
             * @default null
             */
            itemsRequest: null
        },
        /**
         * Initializes `items` attribute.
         * Calculates `items_qty` attribute as algebraic addition of `opts.items[].qty` values.
         */
        initialize: function(opts) {
            this.set('items', new App.Collections.OrderItems);
            if (_.isObject(opts) && Array.isArray(opts.items)) {
                this.set('items_qty', opts.items.reduce(function(iter, item) {
                    return _.isNumber(item.qty) && item.qty > 0 && !item.combo_used && !item.is_combo && !item.has_upsell
                        ? iter + item.qty
                        : iter;
                }, 0));
            }
        },
        /**
         * Receives order items from server. Sends request with following parameters:
         * ```
         * {
         *     url: "'/weborders/v1/order/<order id>/orderitems/'",
         *     method: "GET",
         *     contentType: "application/json",
         *     headers: {Authorization: "Bearer XXXXXXXXXXXXX"}
         * }
         * ```
         * - If session is already expired or invalid token is used the server returns the following response:
         * ```
         * Status: 403
         * {
         *     "detail":"Authentication credentials were not provided."
         * }
         * ```
         * `App.Data.customer` emits `onUserSessionExpired` event in this case. Method `App.Data.custromer.logout()` is automatically called in this case.
         * ```
         *
         * @param {Object} authorizationHeader - result of {@link App.Models.Customer#getAuthorizationHeader App.Data.customer.getAuthorizationHeader()} call
         * @returns {Object} jqXHR object.
         */
        getItems: function(authorizationHeader) {
            if (!_.isObject(authorizationHeader)) {
                return;
            }
            var items = this.get('items'),
                self = this;
            return Backbone.$.ajax({
                url: '/weborders/v1/order/' + this.get('id') + '/orderitems/',
                method: 'GET',
                headers: authorizationHeader,
                contentType: 'application/json',
                success: function(data) {
                    if (Array.isArray(data.data)) {
                        items.reset(self.processItems(data.data));
                    }
                },
                error: new Function()           // to override global ajax error handler
            });
        },
        /**
         * Sets items. Sends items request if `itemsRequest` value is null.
         * @param {Object} authorizationHeader - result of {@link App.Models.Customer#getAuthorizationHeader App.Data.customer.getAuthorizationHeader()} call
         * @returns {Object} `itemsRequest`
         */
        setItems: function(authorizationHeader) {
            var req = this.get('itemsRequest');
            if (!req) {
                req = this.getItems(authorizationHeader);
                this.set('itemsRequest', req);
            }
            return req;
        },
        /**
         * Makes reorder.
         * Emits `onReorderStarted` event once this method gets called.
         * Emits `onReorderCompleted` event passing in parameters an array of attributes changed from order placement.
         * Emits `onReorderFailed` event if `itemsRequest` fails.
         * @param {object} authorizationHeader - result of {@link App.Models.Customer#getAuthorizationHeader App.Data.customer.getAuthorizationHeader()} call
         * @returns {object} `itemsRequest` attribute's value.
         */
        reorder: function(authorizationHeader) {
            var self = this,
                itemsRequest = this.setItems(authorizationHeader);

            this.trigger('onReorderStarted');
            itemsRequest.done(reorder);
            itemsRequest.fail(this.trigger.bind(this, 'onReorderFailed'));

            return itemsRequest;

            function reorder() {
                var _order = self.clone(),
                    order = _order.toJSON(),
                    items = _order.get('items'),
                    settings = App.Settings,
                    myorder = App.Data.myorder,
                    checkout = myorder.checkout,
                    paymentMethods = App.Data.paymentMethods,
                    addresses = App.Data.customer.get('addresses'),
                    dining_option = settings.dining_options.indexOf(order.dining_option) > -1
                        ? _.invert(DINING_OPTION)[order.dining_option]
                        : settings.default_dining_option,
                    changes = [];

                if (!items) {
                    return;
                }

                // empty cart
                myorder.empty_myorder();

                // makes items reorder
                changes.push.apply(changes, items.reorder());

                // delivery address recover.
                if (_.isObject(order.delivery_address)) {
                    // reset addresses selection
                    addresses.invoke('set', {selected: false});
                    // create address for the order's dining option in addresses if it doesn't exist
                    addresses.getCheckoutAddress(dining_option);
                    // set values from order's delivery address
                    addresses.get(dining_option).set(_.extend(
                        addresses.getOrderAddress(order.delivery_address),
                        {
                            selected: true,
                            isReorderAddress: true
                        }
                    ));
                }

                // check dining_option
                if (settings.dining_options.indexOf(order.dining_option) == -1) {
                    changes.push('dining_option');
                }

                // recover checkout
                checkout.set({
                    notes: order.notes,
                    dining_option: dining_option
                });


                if (paymentMethods) {
                    var paymentMethod = paymentMethods.getMethod(order.payment_type);
                    // check paymentMethod
                    if (settings.payment_processor[paymentMethod]) {
                        // recover payment method
                        paymentMethods.set({
                            selected: paymentMethods.getMethod(order.payment_type)
                        });
                    } else {
                        changes.push('paymentMethod');
                    }
                }

                // add items
                items.each(function(orderItem) {
                    var product = orderItem.get_product(),
                        type;
                    if (product.is_combo || product.has_upsell) {
                        if (product.has_upsell)
                            type = 'MyorderUpsell';
                        else
                            type = 'MyorderCombo';
                    } else {
                        type = 'Myorder';
                    }
                    myorder.add(App.Models.create(type).set(orderItem.toJSON()));
                });

                self.trigger('onReorderCompleted', changes);
            }
        },
        /**
         * Looks up combo child products and excludes them from `items`
         * adding them to product sets of parent combo product.
         *
         * @return {Array} filtered order items.
         */
        processItems: function(items) {
            var combo_sets = {},
                upsell_sets = {},
                upsell_fake_items = {}; // wrappers for upsell combo item created in backend

            // determine upsell fake objects
            _.where(items, {has_upsell: true}).forEach(function(upsell_root_item) {
                upsell_fake_items[upsell_root_item.product.combo_used] = {};
            });

            // excludes child products and fake upsell items
            items = items.filter(function(item) {
                var combo_product = item.product.combo_used,
                    combo_set_id = item.combo_product_set_id,
                    upsell_set_id = item.dynamic_combo_slot_id;

                if (item.product.name == 'Shipping and Handling') {
                    return false;
                } else if (typeof combo_set_id == 'number') {
                    // this is combo set child item
                    addSetItem(combo_sets, combo_product, combo_set_id, item);
                    return false;

                } else if (typeof upsell_set_id == 'number') {
                    // this is upsell combo set child item
                    addSetItem(upsell_sets, combo_product, upsell_set_id, item);
                    return false;

                } else if (item.is_combo && item.product.id in upsell_fake_items) {
                    // this is fake upsell combo item
                    upsell_fake_items[item.product.id] = item;
                    return false;

                } else {
                    return true;
                }
            });

            items.forEach(function(item) {
                var product = item.product;
                if (item.is_combo) {
                    product.product_sets = _.map(combo_sets[product.id], function(value, key) {
                        return {
                            id: Number(key),
                            order_products: value
                        }
                    });
                } else if (item.has_upsell) {
                    var upsell_data = upsell_fake_items[product.combo_used];
                    if (upsell_data) {
                        item.upcharge_name = upsell_data.product.name;
                        item.upcharge_price = _.reduce(upsell_sets[product.combo_used], function(memo, pset) {
                            return _.reduce(pset, function(memo, item) {
                                return memo - item.quantity * (item.product.price + item.product.upcharge_price);
                            }, memo);
                        }, upsell_data.product.price - item.quantity * (product.price + product.upcharge_price));
                    }

                    product.combo_price = upsell_data.product.price;
                    product.product_sets = _.map(upsell_sets[product.combo_used], function(value, key) {
                        return {
                            id: Number(key),
                            order_products: value
                        }
                    });
                }
            });

            // defect Bug 51992 - Weborder: Order History > Reorder Combo > Unable to edit Combo product
            // need to exclude combo/upsell items
            items = items.filter(function(item) {
                return !item.has_upsell && !item.is_combo;
            });

            function addSetItem(sets, product_id, set_id, item) {
                if (!(product_id in sets)) {
                    sets[product_id] = {};
                }

                if (!(set_id in sets[product_id])) {
                    sets[product_id][set_id] = [];
                }

                item.is_child_product = true;
                item.selected = true;
                sets[product_id][set_id].push(item);
            }

            return items;
        }
    });

    /**
     * @class
     * @classdesc Represents a customer's orders.
     * @alias App.Collection.Orders
     * @augments Backbone.Model
     * @example
     * // create an orders collection
     * require(['orders'], function() {
     *     var order = new App.Models.Order();
     * });
     */
    App.Collections.Orders = Backbone.Collection.extend(
    /**
     * @lends App.Collections.Orders.prototype
     */
    {
        /**
         * Function constructor of item.
         * @type {Backbone.Model}
         * @default App.Models.Order
         */
        model: App.Models.Order,
        /**
         * Function returning value used as sorting comparator.
         * Orders as sorted by id value descending
         * @type {Function}
         */
        comparator: function(model) {
            return -model.get('id');
        },
        /**
         * Receives orders from server. Sends request with following parameters:
         * ```
         * {
         *     url: "/weborders/v1/orders/",
         *     method: "GET",
         *     contentType: "application/json",
         *     headers: {Authorization: "Bearer XXXXXXXXXXXXX"},
         *     data: {
         *         establishment: <number>,  // establishment id
         *         web_order: true,          // filters only weborder
         *         page: <number> ,          // page number
         *         limit: <number>           // max orders number  in response
         *     }  // order json
         * }
         * ```
         * - If session is already expired or invalid token is used the server returns the following response:
         * ```
         * Status: 403
         * {
         *     "detail":"Authentication credentials were not provided."
         * }
         * ```
         * `App.Data.customer` emits `onUserSessionExpired` event in this case. Method `App.Data.custromer.logout()` is automatically called in this case.
         * ```
         *
         * @param {Object} authorizationHeader - result of {@link App.Models.Customer#getAuthorizationHeader App.Data.customer.getAuthorizationHeader()} call
         * @returns {Object} jqXHR object.
         */
        get_orders: function(authorizationHeader) {
            if (!_.isObject(authorizationHeader)) {
                return;
            }
            var self = this;
            return Backbone.$.ajax({
                url: '/weborders/v1/orders/',
                method: 'GET',
                headers: authorizationHeader,
                contentType: 'application/json',
                data: {
                    establishment: App.Data.settings.get('establishment'),
                    web_order: true,
                    page: 1,
                    limit: 30
                },
                success: function(data) {
                    if (Array.isArray(data.data)) {
                        // need to exclude orders with only combo/upsell items
                        var filtered = data.data.filter(function(order) {
                            return order.items.some(function(item) {
                                return !item.combo_used && !item.has_upsell && !item.is_combo;
                            });
                        });
                        self.add(filtered);
                    }
                },
                error: new Function()           // to override global ajax error handler
            });
        },
        /**
         * Receives order from server. Sends request with following parameters:
         * ```
         * {
         *     url: "/weborders/v1/orders/",
         *     method: "GET",
         *     contentType: "application/json",
         *     headers: {Authorization: "Bearer XXXXXXXXXXXXX"},
         *     data: {
         *         order: <number>,   // order id
         *     }
         * }
         * ```
         * - If session is already expired or invalid token is used the server returns the following response:
         * ```
         * Status: 403
         * {
         *     "detail":"Authentication credentials were not provided."
         * }
         * ```
         * `App.Data.customer` emits `onUserSessionExpired` event in this case. Method `App.Data.custromer.logout()` is automatically called in this case.
         * ```
         *
         * @param {Object} authorizationHeader - result of {@link App.Models.Customer#getAuthorizationHeader App.Data.customer.getAuthorizationHeader()} call
         * @param {number} order_id - order id
         * @returns {Object} jqXHR object.
         */
        get_order: function(authorizationHeader, order_id) {
            if (!_.isObject(authorizationHeader)) {
                return;
            }
            var self = this;
            return Backbone.$.ajax({
                url: '/weborders/v1/orders/',
                method: 'GET',
                headers: authorizationHeader,
                contentType: 'application/json',
                data: {
                    order: order_id
                },
                success: function(data) {
                    if (Array.isArray(data.data)) {
                        self.add(data.data);
                    }
                },
                error: new Function()           // to override global ajax error handler
            });
        },
        /**
         * Receives order from server if it isn't in the collection yet and calls its {@link App.Models.Order#reorder} method.
         *
         * @param {Object} authorizationHeader - result of {@link App.Models.Customer#getAuthorizationHeader App.Data.customer.getAuthorizationHeader()} call
         * @param {number} order_id - order id
         * @return {Object} jQuery Deferred object.
         */
        reorder: function(authorizationHeader, order_id) {
            var dfd = Backbone.$.Deferred(),
                order = this.get(order_id),
                self = this,
                orderReq;

            if (!order) {
                // if the order isn't in the collection need to receive it from backend
                orderReq = this.get_order(authorizationHeader, order_id);
                orderReq.done(function() {
                    order = self.get(order_id);
                    reorder();
                });
                orderReq.fail(dfd.reject.bind(dfd));
            } else {
                reorder();
            }

            return dfd;

            function reorder() {
                var itemsReq = order.reorder(authorizationHeader);
                itemsReq.done(dfd.resolve.bind(dfd));
                itemsReq.fail(dfd.reject.bind(dfd));
            }
        }
    });
});