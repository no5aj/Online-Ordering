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

define(["profile_view", "giftcard_view", "myorder_view"], function(profile_view) {
    'use strict';

    var ProfilePaymentSelectionView = App.Views.CoreProfileView.CoreProfilePaymentSelectionView.extend({
        className: 'payment-item font-size3 primary-bg primary-text'
    });

    var ProfilePaymentsSelectionView = App.Views.CoreProfileView.CoreProfilePaymentsSelectionView.extend({
        bindings: {
            ':el': 'toggle: equal(selected, "credit_card_button")'
        },
        itemView: ProfilePaymentSelectionView
    });

    var ProfilePaymentEditionView = App.Views.CoreProfileView.CoreProfilePaymentEditionView.extend({
        className: 'payment-item font-size3 primary-text list-subheader'
    });

    var ProfilePaymentsEditionView = App.Views.CoreProfileView.CoreProfilePaymentsEditionView.extend({
        bindings: {
            '.credit-cards': 'classes: {collapsed: ui_collapsed}',
            '.payments-list': 'toggle: not(ui_collapsed), collection: $collection'
        },
        bindingSources: {
            ui: function() {
                return new Backbone.Model({collapsed: true});
            }
        },
        itemView: ProfilePaymentEditionView,
        events: {
            'click .credit-cards': 'collapse'
        },
        collapse: function() {
            var $ui = this.getBinding('$ui');
            $ui.set('collapsed', !$ui.get('collapsed'));
        }
    });

    var ProfilePaymentsView = App.Views.CoreProfileView.CoreProfilePaymentsView.extend({
        bindings: {
            '.left-side': '', //to disable base class bindings
            '.right-side': '',
            '.successful-update': ''
        },
        render: function() {
            App.Views.FactoryView.prototype.render.apply(this, arguments);
            if (this.model.payments) {
                var paymentsEdition = App.Views.GeneratorView.create('Profile', {
                    el: this.$('.payments-box'),
                    mod: 'PaymentsEdition',
                    collection: this.model.payments,
                    removeToken: this.options.removeToken,
                    changeToken: this.options.changeToken,
                    className: 'profile-payments-edition text-center',
                });
                this.subViews.push(paymentsEdition);
            }

            if (this.model.giftCards) {
                this.newGiftCard = new App.Models.GiftCard({add_new_card: false});
                var giftCardsEdition = App.Views.GeneratorView.create('Profile', {
                    el: this.$('.gift-cards-box'),
                    mod: 'GiftCardsEdition',
                    collection: this.model.giftCards,
                    unlinkGiftCard: this.options.unlinkGiftCard,
                    newCard: this.newGiftCard,
                    customer: this.options.model,
                    className: 'profile-payments-edition text-center',
                });
                this.subViews.push(giftCardsEdition);
            }

            if (this.model.get('rewardCards')) {
                this.newRewardCard = new App.Models.RewardsCard({add_new_card: false});
                var rewardCardsEdition = App.Views.GeneratorView.create('Profile', {
                    el: this.$('.reward-cards-box'),
                    mod: 'RewardCardsEdition',
                    collection: this.model.rewardCards,
                    newCard: this.newRewardCard,
                    unlinkRewardCard: this.options.unlinkRewardCard,
                    customer: this.options.model,
                    className: 'profile-payments-edition text-center'
                });
                this.subViews.push(rewardCardsEdition);
            }
            return this;
        },
    });

    var ProfileGiftCardSelectionView = App.Views.CoreProfileView.CoreProfileGiftCardSelectionView.extend({
        className: 'payment-item font-size3 primary-bg primary-text'
    });

    var ProfileGiftCardsSelectionView = App.Views.CoreProfileView.CoreProfileGiftCardsSelectionView.extend({
        bindings: {
            ':el': 'toggle: equal(selected, "gift_card")'
        },
        itemView: ProfileGiftCardSelectionView
    });

    var ProfileGiftCardEditionView = App.Views.CoreProfileView.CoreProfileGiftCardEditionView.extend({
        className: 'payment-item font-size3 primary-text list-subheader'
    });

    var ProfileGiftCardsEditionView = App.Views.CoreProfileView.CoreProfileGiftCardsEditionView.extend({
        bindings: {
            '.gift-cards': 'classes: {collapsed: ui_collapsed}',
            '.gift-cards-list': 'collection: $collection',
            '.gift-cards-list-wrap': 'toggle: not(ui_collapsed)'
        },
        bindingSources: {
            ui: function() {
                return new Backbone.Model({collapsed: true});
            }
        },
        itemView: ProfileGiftCardEditionView,
        events: {
            'click .gift-cards': 'collapse'
        },
        collapse: function() {
            var $ui = this.getBinding('$ui');
            $ui.set('collapsed', !$ui.get('collapsed'));
        }
    });

    // Profile Views for Reward Cards:
    var ProfileRewardCardSelectionView = App.Views.CoreProfileView.CoreProfileRewardCardSelectionView.extend({
        className: 'payment-item font-size3 primary-bg primary-text'
    });

    var ProfileRewardCardsSelectionView = App.Views.CoreProfileView.CoreProfileRewardCardsSelectionView.extend({
        itemView: ProfileRewardCardSelectionView
    });

    var ProfileRewardCardEditionView = App.Views.CoreProfileView.CoreProfileRewardCardEditionView.extend({
        bindings: {
            '.card-number': 'value: number',
            '.balance-info': 'text: format(_lp_REWARDS_BALANCE_INFO, balance_points, balance_visits, _system_settings_currency_symbol, balance_purchases)'
        },
        events: {
            'click .ctrl': 'unlink'
        },
        unlink: function() {
            this.options.collectionView.options.unlinkRewardCard(this.model);
        }
    });

    var ProfileRewardCardsEditionView = App.Views.CoreProfileView.CoreProfileRewardCardsEditionView.extend({
        bindings: {
            '.new-loyalty-number': 'updateContent: newRewardCardView, toggle: not(length($collection))'
        },
        initialize: function() {
            App.Views.CoreProfileView.CoreProfileRewardCardsEditionView.prototype.initialize.apply(this, arguments);
            var newRewardCard = this.getBinding('$newRewardCard');
            this.listenTo(newRewardCard, 'change:number change:captchaValue', this.options.onRewardCardChanged.bind(this, newRewardCard));
            this.listenTo(this.model, 'onResetRewardCaptcha', function() {
                newRewardCard.trigger('onResetData');
            });
        }
    });

    var ProfileAddressView = App.Views.CoreProfileView.CoreProfileAddressView.extend({
        removeAddress: function() {
            var self = this;

            App.Data.errors.alert(
                _loc.PROFILE_ADDRESS_DELETE,
                false,
                true,
                {
                    isConfirm: true,
                    callback: function(confirmed) {
                        if (confirmed) {
                            self.model.collection.remove(self.model);
                            App.Data.customer.deleteAddress(self.model);
                        }
                    }
                }
            );
        }
    });

    var ProfileAddressesView = App.Views.CoreProfileView.CoreProfileAddressesView.extend({
        itemView: ProfileAddressView
    });

    var ProfileOrdersItemView = App.Views.CoreProfileView.CoreProfileOrdersItemView.extend({
        className: 'orders-item list-bg list-separator',
        bindings: {
            '.unit': 'text: getUnit(items_qty)'
        },
        bindingFilters: {
            getUnit: function(qty) {
                return qty == 1 ? _loc.ORDER_ITEMS[0] : _loc.ORDER_ITEMS[1];
            }
        },
        events: {
            'click .btn-reorder': 'reorder'
        },
        itemView: function(opts) {
            var mod = 'OrderItem';

            if (opts.model.get('is_combo')) {
                mod = 'OrderItemCombo';
            } else if (opts.model.get('has_upsell')) {
                mod = 'OrderItemUpsell';
            }

            return App.Views.GeneratorView.create('Profile', _.extend(opts, {
                mod: mod,
                order: opts.collectionView.model
            }), opts.model.get('id'));
        }
    });

    var ProfileOrderItemView = App.Views.CoreMyOrderView.CoreMyOrderItemView.extend(OrderItemOpts()),
        ProfileOrderItemComboView = App.Views.CoreMyOrderView.CoreMyOrderItemComboView.extend(OrderItemOpts()),
        ProfileOrderItemUpsellView = App.Views.CoreMyOrderView.CoreMyOrderItemUpsellView.extend(OrderItemOpts());

    function OrderItemOpts() {
        return {
            name: 'profile',
            mod: 'order_item',
            tagName: 'li',
            className: 'order-item'
        };
    }

    var ProfilePastOrderView = App.Views.FactoryView.extend({
        name: 'profile',
        mod: 'past_order',
        tagName: 'li',
        bindings: {
            '.subtotal': 'text: currencyFormat(subtotal)',
            '.items': 'text: itemsList',
            '.animate-spin': 'classes: {hide: itemsReceived}',
            ':el': 'classes: {disabled: not(itemsReceived)}'
        },
        computeds: {
            itemsReceived: {
                deps: ['$collection'],
                get: function(collection) {
                    var req = this.model.get('itemsRequest');
                    return req && req.state() == 'resolved';
                }
            },
            itemsList: {
                deps: ['$collection'],
                get: function(collection) {
                    var names = collection.map(function(item) {
                        var product = item.get_product(),
                            modifiers = item.get_modifiers(),
                            sizeModifier = modifiers && modifiers.getSizeModel(),
                            name = product ? product.get('name') : '';

                        if (sizeModifier) {
                            name = sizeModifier.get('name') + ' ' + name;
                        }

                        return name;
                    });
                    return names.join(', ');
                }
            }
        },
        events: {
            'click': 'reorder'
        },
        initialize: function() {
            App.Views.FactoryView.prototype.initialize.apply(this, arguments);
            this.options.customer.getOrderItems(this.model);
        },
        reorder: function() {
            this.options.customer.trigger('onReorder', this.model.get('id'));
        }
    });

    var ProfilePastOrderContainerView = App.Views.FactoryView.extend({
        name: 'profile',
        mod: 'past_order_container',
        tagName: 'ul',
        className: 'list profile-past-order',
        bindings: {
            ':el': 'updateContent: pastOrderView, toggle: pastOrder'
        },
        computeds: {
            pastOrderView: {
                deps: ['pastOrder'],
                get: function(pastOrder) {
                    if (pastOrder) {
                        return {
                            name: 'Profile',
                            mod: 'PastOrder',
                            model: pastOrder,
                            collection: pastOrder.get('items'),
                            customer: this.model,
                            subViewIndex: 0
                        }
                    }
                }
            }
        }
    });

    return new (require('factory'))(profile_view.initViews.bind(profile_view), function() {
        App.Views.ProfileView.ProfilePaymentsSelectionView = ProfilePaymentsSelectionView;
        App.Views.ProfileView.ProfilePaymentsEditionView = ProfilePaymentsEditionView;
        App.Views.ProfileView.ProfileGiftCardsSelectionView = ProfileGiftCardsSelectionView;
        App.Views.ProfileView.ProfileGiftCardsEditionView = ProfileGiftCardsEditionView;
        App.Views.ProfileView.ProfileRewardCardSelectionView = ProfileRewardCardSelectionView;
        App.Views.ProfileView.ProfileRewardCardsSelectionView = ProfileRewardCardsSelectionView;
        App.Views.ProfileView.ProfileRewardCardsEditionView = ProfileRewardCardsEditionView;
        App.Views.ProfileView.ProfileRewardCardEditionView = ProfileRewardCardEditionView;
        App.Views.ProfileView.ProfileOrdersItemView = ProfileOrdersItemView;
        App.Views.ProfileView.ProfileOrderItemView = ProfileOrderItemView;
        App.Views.ProfileView.ProfileOrderItemComboView = ProfileOrderItemComboView;
        App.Views.ProfileView.ProfileOrderItemUpsellView = ProfileOrderItemUpsellView;
        App.Views.ProfileView.ProfilePastOrderView = ProfilePastOrderView;
        App.Views.ProfileView.ProfilePastOrderContainerView = ProfilePastOrderContainerView;
    });
});