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

define(["profile_view"], function(profile_view) {
    'use strict';

    var ProfilePaymentsSelectionView = App.Views.FactoryView.extend({
        name: 'profile',
        mod: 'payments_selection',
        initialize: function() {
            var customer = this.appData.customer;

            this.listenTo(customer, 'updateCheckoutPaymentTokens', function() {
                this.collection.reset(customer.payments.models);
            });

            App.Views.FactoryView.prototype.initialize.apply(this, arguments);
        },
        bindings: {
            '.payments-list': 'value: selection, options: options'
        },
        computeds: {
            options: {
                deps: ['$collection', '_lp_CHECKOUT_ENTER_NEW_CARD'],
                get: function(collection, label_new_card) {
                    var data = collection.map(function(model) {
                        return {
                            label: creditCardType(model.get('card_type')) + ' - ****' + model.get('last_digits'),
                            value: model.id
                        }
                    });
                    data.push({
                        label: label_new_card,
                        value: -1
                    });
                    return data;
                }
            },
            selection: {
                deps: ['$collection'],
                get: function(collection) {
                    var selected = collection.findWhere({selected: true});
                    return selected ? selected.id : collection.length ? collection.at(0).id : -1;
                },
                set: function(value) {
                    var model = this.collection.get(value),
                        selected = this.collection.findWhere({selected: true});
                    if (model) {
                        model.set('selected', true);
                        this.model.set({
                            selected: true,
                            ignoreSelectedToken: false
                        });
                    } else if (selected) {
                        selected.set('selected', false);
                        this.model.set({
                            selected: false,
                            ignoreSelectedToken: true
                        });
                    } else {
                        this.model.set({
                            selected: false,
                            ignoreSelectedToken: true
                        });
                    }
                }
            }
        }
    });

    var ProfileGiftCardsSelectionView = App.Views.FactoryView.extend({
        name: 'profile',
        mod: 'gift_cards_selection',
        initialize: function() {
            var customer = this.appData.customer;

            this.listenTo(customer, 'updateCheckoutGiftCards', function() {
                this.collection.reset(customer.giftCards.models);
            });

            App.Views.FactoryView.prototype.initialize.apply(this, arguments);
        },
        bindings: {
            '.gift-cards-list': 'value: selection, options: options'
        },
        computeds: {
            options: {
                deps: ['$collection', '_lp_CHECKOUT_ENTER_NEW_CARD', '_lp_BALANCE', '_system_settings_currency_symbol'],
                get: function(collection, label_new_card, label_balance, currency) {
                    var data = [];
                    collection.each(function(model) {
                        model = model.toJSON();
                        model.remainingBalance > 0 && data.push({
                            label: model.cardNumber + ' - ' + label_balance + ': ' + currency + round_monetary_currency(model.remainingBalance),
                            value: model.cardNumber
                        });
                    });
                    data.push({
                        label: label_new_card,
                        value: -1
                    });
                    return data;
                }
            },
            selection: {
                deps: ['$collection'],
                get: function(collection) {
                    var selected = collection.findWhere({selected: true});
                    if (selected) {
                        this.model.set('selected', true);
                        return selected.get('cardNumber');
                    } else {
                        return -1;
                    }
                },
                set: function(value) {
                    var model = this.collection.findWhere({cardNumber: value}),
                        selected = this.collection.findWhere({selected: true});
                    if (model) {
                        model.set('selected', true);
                        this.model.set('selected', true);
                    } else if (selected) {
                        selected.set('selected', false);
                        this.model.set('selected', false);
                    } else {
                        this.model.set('selected', false);
                    }
                }
            }
        }
    });

    var ProfilePaymentsView = App.Views.CoreProfileView.CoreProfilePaymentsView.extend({
        initialize: function() {
            this.init_update_btn_value();
            App.Views.FactoryView.prototype.initialize.apply(this, arguments);
        },
        bindings: {
            '.update-btn': 'text: buttonText'
        },
        computeds: {
            buttonText: {
                deps: ['ui_show_response', '_lp_UPDATE', '_lp_PROFILE_UPDATE_SUCCESSFUL'],
                get: function(ui_show_response, text_default, text_success) {
                    var text = text_default,
                        duration = 2000,
                        self = this;

                    if (ui_show_response) {
                        text = text_success;

                        this.getBinding('$ui').trigger('change:check_update_btn');

                        this.buttonTimer && clearTimeout(this.buttonTimer);
                        this.buttonTimer = setTimeout(function() {
                            self.options.ui.set('show_response', false);
                        }, duration);
                    }

                    return text;
                }
            }
        }
    });

    var ProfileEditView = App.Views.CoreProfileView.CoreProfileEditView.extend({
        bindings: {
            '.update-btn': 'classes: {disabled: updateBtn_disabled}, text: select(ui_show_response, _lp_PROFILE_UPDATE_SUCCESSFUL, _lp_UPDATE)'
        }
    });

    var ProfileOrdersItemView = App.Views.CoreProfileView.CoreProfileOrdersItemView.extend({
        className: 'orders-item primary-border'
    });

    var ProfileOrdersView = App.Views.CoreProfileView.CoreProfileOrdersView.extend({
        bindings: {
            '.orders': 'toggle: length($collection)'
        }
    });

    var ProfileOrderItemView = App.Views.CoreProfileView.CoreProfileOrderItemView.extend({
        className: 'item',
        bindings: {
            '.modifiers': 'text: select(is_combo, getComboItems($model), select(has_upsell, getUpsellItems($model), getModifiers($model)))'
        },
        bindingFilters: {
            getModifiers: function(model) {
                var modifiers = model.get_modifiers(),
                    items = [];

                modifiers && modifiers.get_modifierList().forEach(function(modifier) {
                    modifier.get('selected') && items.push(get_modifier_str(modifier));
                });

                function get_modifier_str(mdf) {
                    return mdf.get('quantity') + 'x' +
                           (mdf.get('qty_type') > 0 ? MSG.HALF_PRICE_STR[mdf.get('qty_type')] : '') +
                           ' ' + mdf.get('name');
                }
                return items.length ? '+' + items.join(', +') : '';
            },
            getComboItems: function(model) {
                var data = model.item_submit(),
                    items = [];

                _.isObject(data) && Array.isArray(data.products_sets) && data.products_sets.forEach(function(pset) {
                   pset.products.forEach(function(product) {
                        items.push(product.quantity + 'x ' + product.product_name_override);
                    });
                });

                return items.join(', ');
            },
            getUpsellItems: function(model) {
                var data = model.item_submit(),
                    product = model.get_product(),
                    items = [];

                if (product) {
                    items.push(product.get('name'));
                }

                _.isObject(data) && Array.isArray(data.products_sets) && data.products_sets.forEach(function(pset) {
                   pset.products.forEach(function(product) {
                        items.push(product.quantity + 'x ' + product.product_name_override);
                    });
                });

                return items.join(', ');
            }
        }
    });

    var ProfilePastOrderView = App.Views.FactoryView.extend({
        name: 'profile',
        mod: 'past_order',
        bindings: {
            '.created-at': 'text: created_date',
            '.subtotal': 'text: currencyFormat(subtotal)',
            '.items': 'collection: $collection, itemView: "itemView"',
            '.animate-spin': 'classes: {hide: itemsReceived}',
            '.reorder': 'classes: {disabled: not(itemsReceived)}'
        },
        computeds: {
            itemsReceived: {
                deps: ['$collection'],
                get: function(collection) {
                    var req = this.model.get('itemsRequest');
                    return req && req.state() == 'resolved';
                }
            }
        },
        events: {
            'click .close': 'close',
            'click .view-past-orders': 'viewPastOrders',
            'click .reorder': 'reorder'
        },
        onEventListener:{
            '.view-past-orders': 'viewPastOrders',
            '.reorder': 'reorder'
        },
        initialize: function() {
            App.Views.FactoryView.prototype.initialize.apply(this, arguments);
            this.options.customer.getOrderItems(this.model);
        },
        itemView: function(opts) {
            return App.Views.GeneratorView.create('Profile', _.extend(opts, {
                mod: 'OrderItem'
            }), opts.model.get('id'));
        },
        close: function() {
            var ui = this.getBinding('$ui');
            ui.set('showPastOrder', !ui.get('showPastOrder'))
        },
        viewPastOrders: function() {
            App.Data.router.navigate('past_orders', true);
            this.setBinding('ui_showPastOrder', false);
        },
        reorder: function() {
            this.options.customer.trigger('onReorder', this.model.get('id'));
            this.setBinding('ui_showPastOrder', false);
        }
    });

    function creditCardType(card_type) {
        var code = _.invert(ACCEPTABLE_CREDIT_CARD_TYPES)[card_type];
        return _loc.CREDIT_CARD_TYPES[code];
    }

    return new (require('factory'))(profile_view.initViews.bind(profile_view), function() {
        App.Views.ProfileView.ProfilePaymentsSelectionView = ProfilePaymentsSelectionView;
        App.Views.ProfileView.ProfileGiftCardsSelectionView = ProfileGiftCardsSelectionView;
        App.Views.ProfileView.ProfilePaymentsView = ProfilePaymentsView;
        App.Views.ProfileView.ProfileEditView = ProfileEditView;
        App.Views.ProfileView.ProfileOrdersItemView = ProfileOrdersItemView;
        App.Views.ProfileView.ProfileOrdersView = ProfileOrdersView;
        App.Views.ProfileView.ProfileOrderItemView = ProfileOrderItemView;
        App.Views.ProfileView.ProfilePastOrderView = ProfilePastOrderView;
    });
});