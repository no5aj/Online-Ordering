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

define(["factory"], function() {
    'use strict';

    App.Views.CoreCartView = {};

    App.Views.CoreCartView.CoreCartCoreView = App.Views.FactoryView.extend({
        bindings: {
            '.btn': 'classes: {disabled: any(not(orderItems_quantity), orderItems_pending, shippingPending)}',
            '.animate-spin': 'classes: {hide: all(not(orderItems_pending))}',
            '.order-items': 'toggle: orderItems_quantity',
            '.total_block': 'toggle: orderItems_quantity'
        },
        computeds: {
            shippingPending: {
                deps: ['checkout_dining_option', 'customer_shipping_selected'],
                get: function(checkout_dining_option, customer_shipping_selected) {
                    return checkout_dining_option == 'DINING_OPTION_SHIPPING' && customer_shipping_selected == -1;
                }
            }
        },
        bindingSources: {
            orderItems: function() {
                var model = new Backbone.Model({
                    pending: '',
                    quantity: ''
                });

                model.initListeners = function(collection) {
                    model.set({
                        pending: collection.pending,
                        quantity: collection.get_only_product_quantity()
                    });

                    model.listenTo(collection, 'add change remove', function() {
                        model.set('quantity', collection.get_only_product_quantity());
                    });
                    // update_cart_totals is in progress
                    model.listenTo(collection, 'onCartTotalsUpdate', function() {
                        model.set('pending', true);
                    });
                    // update_cart_totals completed
                    model.listenTo(collection, 'DiscountsComplete NoRequestDiscountsComplete', function() {
                        model.set('pending', false);
                    });
                }

                return model;
            }
        },
        initialize: function() {
            App.Views.FactoryView.prototype.initialize.apply(this, arguments);
            this.getBinding('$orderItems').initListeners(this.collection);
        },
        render: function() {
            App.Views.FactoryView.prototype.render.apply(this, arguments);
            this.listenTo(App.Data.mainModel, 'loadCompleted', this.resize.bind(this));

            this.subViews.push(App.Views.GeneratorView.create('MyOrder', {
                el: this.$('.order-items'),
                mod: 'List',
                collection: this.collection,
                saved_discount: this.options.discount,
                no_qty_arrows: Boolean(this.options.no_qty_arrows)
            }));
        },
        resize: function() {
            var button = this.$('.btn-bottom').outerHeight(true),        // button height at the bottom
                header = this.$('.cart_title').outerHeight(true),        // header block height at the top
                totalBlock = this.$('.total_block').outerHeight(true);   // total block at the bottom

            this.$('.order-items').css({
                top: header + 'px',
                bottom: (button + totalBlock) + 'px'
            });
            this.$('.total_block').css('bottom', button + 'px');
        }
    });

    App.Views.CoreCartView.CoreCartMainView = App.Views.CoreCartView.CoreCartCoreView.extend({
        name: 'cart',
        mod: 'main',
        render: function() {
            App.Views.CoreCartView.CoreCartCoreView.prototype.render.apply(this, arguments);

            this.subViews.push(App.Views.GeneratorView.create('Total', {
                el: this.$('.subtotal-box'),
                mod: 'Main',
                model: this.collection.total,
                collection: this.collection
            }));

            return this;
        },
        bindings: {
            '.btn': 'classes: {disabled: any(not(orderItems_quantity), orderItems_pending)}',
            '.animate-spin': 'classes: {hide: all(not(orderItems_pending))}',
            '.subtotal-subline': 'toggle: orderItems_quantity'
        },
        events: {
            'click .btn-checkout': 'checkout_event'
        },
        onEnterListeners: {
            '.btn-checkout': 'checkout_event'
        },
        checkout_event: function() {
            var self = this;

            this.collection.check_order({
                order: true,
                first_page: true,
                skipDeliveryAmount: true
            }, function() {
                self.collection.trigger('onCheckoutClick');
            });
        }
    });

    return new (require('factory'))(function() {
        App.Views.CartView = {};
        App.Views.CartView.CartCoreView = App.Views.CoreCartView.CoreCartCoreView;
        App.Views.CartView.CartMainView = App.Views.CoreCartView.CoreCartMainView;
    });
});