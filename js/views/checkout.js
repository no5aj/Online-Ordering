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

define(["delivery_addresses", "generator"], function(delivery_addresses) {
    'use strict';

    App.Views.CoreCheckoutView = {};

    App.Views.CoreCheckoutView.CoreCheckoutMainView = App.Views.FactoryView.extend({
        name: 'checkout',
        mod: 'main',
        bindings: {
            '.rewards-card-apply': 'classes: {hide: length(rewardsCard_discounts)}',
            '.see-rewards':  'classes: {hide: not(length(rewardsCard_discounts))}',
            '.cancel-input': 'classes: {hide: not(length(rewardsCard_discounts))}',
            '.rewardCard': 'attr: {readonly: reward_card_readonly}, restrictInput: "0123456789", kbdSwitcher: "numeric", pattern: /^\\d*$/',
            '.phone': 'restrictInput: "0123456789+", kbdSwitcher: "tel", pattern: /^\\+?\\d{0,15}$/',
            '.personal': 'toggle: not(isAuthorized)'
        },
        computeds: {
            isAuthorized: {
                deps: ['customer_access_token'],
                get: function() {
                    return this.getBinding('$customer').isAuthorized();
                }
            },
            reward_card_readonly: {
                deps: ["rewardsCard_discounts", "customer_rewardCards"],
                get: function() {
                    return this.getBinding('rewardsCard_discounts').length > 0 || this.getBinding('customer_rewardCards').length > 0;
                }
            }
        },
        initialize: function() {
            var self = this;
            this.listenTo(this.model, 'change:dining_option', this.controlAddress, this);
            this.listenTo(this.model, 'change:dining_option', this.controlDeliveryOther, this);
            this.listenTo(this.options.rewardsCard, 'change:number', this.updateData, this);
            this.listenTo(this.options.customer, 'change:first_name change:last_name change:email change:phone', this.updateData, this);
            this.customer = this.options.customer;
            this.card = App.Data.card;
            this.address_index = -1;
            App.Views.FactoryView.prototype.initialize.apply(this, arguments);

            this.model.get('dining_option') === 'DINING_OPTION_DELIVERY' &&
                 this.controlAddress(null, 'DINING_OPTION_DELIVERY');

            this.model.get('dining_option') === 'DINING_OPTION_SHIPPING' &&
                 this.controlAddress(null, 'DINING_OPTION_SHIPPING');

            this.model.get('dining_option') === 'DINING_OPTION_CATERING' &&
                 this.controlAddress(null, 'DINING_OPTION_CATERING');

            this.model.get('dining_option') === 'DINING_OPTION_OTHER' &&
                 this.controlDeliveryOther(null, 'DINING_OPTION_OTHER');

            this.listenTo(this.options.customer.get('rewardCards'), "add remove reset", function() {
                self.options.customer.trigger('change:rewardCards'); //it's to update binding value customer_rewardCards
            });

            this.listenTo(this.options.customer, 'onUserAddressCreated onUserAddressUpdate', function() {
                this.controlAddress(null, this.model.get('dining_option'));
            }, this);
        },
        render: function() {
            var settings = App.Data.settings.get('settings_system'),
                customer = this.options.customer,
                model = {},
                self = this;

            model.firstName = this.customer.escape('first_name');
            model.lastName = this.customer.escape('last_name');
            model.email = this.customer.escape('email');
            model.phone = this.customer.escape('phone');
            model.rewardCard = this.options.rewardsCard.escape('number');
            model.isFirefox = /firefox/i.test(navigator.userAgent);
            model.enableRewardCard = settings.enable_reward_cards_collecting;
            model.business_name = settings.business_name;
            model.address = settings.address;
            model.isMobile = typeof cssua.ua.mobile != 'undefined';

            this.$el.html(this.template(model));

            this.$('.firstName, .lastName').numberMask({pattern: /^.*$/ }).on("keypressNumber", function(event) {
                try {
                    var start = event.target.selectionStart,
                        end = event.target.selectionEnd,
                        direction = event.target.selectionDirection;
                } catch(e) {
                    console.log('There is not selection API');
                }
                var new_value = this.value.replace(/(^[a-z])|\s([a-z])/g, function(m, g1, g2){
                    return g1 ? g1.toUpperCase() : ' ' + g2.toUpperCase();
                });
                this.value = new_value;
                try {
                    event.target.setSelectionRange(start, end, direction);
                } catch(e) {}
            });

            return this;
        },
        events: {
            'blur .firstName': 'changeFirstName',
            'change .firstName': 'changeFirstName',
            'blur .lastName': 'changeLastName',
            'change .lastName': 'changeLastName',
            'blur .email': 'changeEmail',
            'change .email': 'changeEmail',
            'blur .phone': 'changePhone',
            'change .phone': 'changePhone',
            'blur .rewardCard': 'changeRewardCard',
            'click .rewards-card-apply': 'applyRewardsCard',
            'click .see-rewards': 'showRewards',
            'click .cancel-input': 'resetRewards'
        },
        changeFirstName: function(e) {
            this.customer.set('first_name', e.target.value);
            this.card.set('firstName', e.target.value);
        },
        changeLastName: function(e) {
            this.customer.set('last_name', e.target.value);
            this.card.set('secondName', e.target.value);
        },
        changeEmail: function(e) {
            this.customer.set('email', e.target.value.trim());
        },
        changePhone: function(e) {
            this.customer.set('phone', e.target.value);
        },
        changeRewardCard: function(e) {
            this.options.rewardsCard.set('number', e.target.value);
        },
        controlAddress: function(model, value) {
            var address = this.subViews.shift();

            // remove address if it exists
            address && address.remove();

            if (value === 'DINING_OPTION_DELIVERY' || value === 'DINING_OPTION_SHIPPING' || value === 'DINING_OPTION_CATERING') {
                address = new App.Views.CheckoutView.CheckoutAddressView({
                    customer: this.customer,
                    checkout: this.model,
                    address_index: this.address_index // -1 means that default profile address should be selected
                });
                this.subViews.push(address);
                this.$('.delivery_address').append(address.el);
                delete this.address_index;
            }
        },
        controlDeliveryOther: function(model, value) {
            if(value === 'DINING_OPTION_OTHER') {
                if (!this.otherView) {

                    this.otherView = new App.Views.CoreCheckoutView.CoreCheckoutOtherView({model: this.model, collection: this.model.get('other_dining_options')});
                    this.$('.delivery_other').append(this.otherView.el);
                }
                this.$('.delivery_other').show();
            } else {
                this.$('.delivery_other').hide();
            }
        },
        updateData: function() {
            var customer = this.customer;
            this.$('.firstName').val(customer.get('first_name'));
            this.$('.lastName').val(customer.get('last_name'));
            this.$('.email').val(customer.get('email'));
            this.$('.phone').val(customer.get('phone'));
            this.$('.rewardCard').val(this.options.rewardsCard.get('number'));
        },
        applyRewardsCard: function() {
            this.options.rewardsCard.trigger('onApplyRewardsCard');
        },
        showRewards: function() {
            this.options.rewardsCard.trigger('onRewardsReceived');
        },
        resetRewards: function() {
            this.options.rewardsCard.resetData();
        }
    });

    App.Views.CoreCheckoutView.CoreCheckoutOrderTypeView = App.Views.FactoryView.extend({
        name: 'checkout',
        mod: 'order_type',
        bindings: {
            ':el': 'toggle: not(equal(dining_option, "DINING_OPTION_ONLINE"))',
            '.select-wrapper': 'classes: { "no-arrows": hide_arrows }',
            '.order-type-select': 'value: diningOption, options: dining_options'
        },
        computeds: {
            hide_arrows: function() {
                var opts = this.getBinding('dining_options');
                return opts.length <= 1;
            },
            dining_options: function() {
                var opts = [];
                if (_.isObject(this.options.DINING_OPTION_NAME)) {
                    opts = _.map(this.options.DINING_OPTION_NAME, function(value, key) {
                        return {label: value, value: key};
                    });
                }
                return opts;
            },
            /**
             * Need to use the computed value because 'DINING_OPTION_ONLINE' is not presented in 'dining_options' computed array. Bug #44273
             */
            diningOption: {
                deps: ['dining_option', 'selected_dining_option'],
                get: function(dining_option, selected_dining_option) {
                    return dining_option == 'DINING_OPTION_ONLINE' ? selected_dining_option : dining_option;
                },
                set: function(value) {
                    this.model.set('dining_option', value);
                }
            }
        }
    });

    App.Views.CoreCheckoutView.CoreCheckoutAddressView = App.Views.DeliveryAddressesView.extend({
        name: 'checkout',
        mod: 'address'
    });

    App.Views.CoreCheckoutView.CoreCheckoutAddressSelectionView = App.Views.DeliveryAddressesSelectionView.extend({
        name: 'checkout',
        mod: 'address_selection'
    });

    App.Views.CoreCheckoutView.CoreCheckoutOtherItemView = App.Views.FactoryView.extend({
        name: 'checkout',
        mod: 'other_item',
        bindings: {
            'input': 'valueTrim: value, events: ["blur", "change"]',
            'select': 'value: value, options: choices',
            '[data-isrequired]': 'classes: {required: required}'
        },
        render: function() {
            App.Views.FactoryView.prototype.render.apply(this, arguments);

            var choices = this.model.get('choices');
            // select the first option by default
            Array.isArray(choices) && choices[0] && this.model.set('value', choices[0]);
        }
    });

    App.Views.CoreCheckoutView.CoreCheckoutOtherView = App.Views.FactoryView.extend({
        name: 'checkout',
        mod: 'other',
        className: 'checkout_other_view',
        bindings: {
            '.list': 'collection: $collection'
        },
        initialize: function() {
            App.Views.FactoryView.prototype.initialize.apply(this, arguments);
        },
        itemView: App.Views.CoreCheckoutView.CoreCheckoutOtherItemView
    });

    App.Views.CoreCheckoutView.CoreCheckoutPickupView = App.Views.FactoryView.extend({
        name: 'checkout',
        mod: 'pickup',
        initialize: function() {
            var self = this;

            this.listenTo(this.model, 'change:dining_option', this.listenOrderType, this);

            this.listenTo(this.model, 'hide:datepicker', function() {
                self.picker.hide();
            }, this);

            this.templateData = {
                isFirefox: /firefox/i.test(navigator.userAgent)
            };

            this.isDelivery = this.model.get('dining_option') === 'DINING_OPTION_DELIVERY';
            this.pickupTimeIndexByDelta = {};
            this.pickupTime = this.options.timetable.getPickupList(this.isDelivery, this.pickupTimeIndexByDelta);
            App.Views.FactoryView.prototype.initialize.apply(this, arguments);
            this.listenOrderType(null, this.model.get('dining_option'));
        },
        render: function() {
            var days;
            var self = this;

            this.templateData.pickupTimeLabel = '';
            this.$el.html(this.template(this.templateData));

            var today = new Date();
            today.setHours(0,0,0,0);
            if (this.pickupTime.length == 0) {
                return this;
            }
            var field = this.$('#datepicker');

            this.picker = new Pikaday({
                field: field[0],
                minDate: this.pickupTime[0].date,
                maxDate: this.pickupTime[this.pickupTime.length - 1].date,
                position: 'bottom hcenter',
                firstDay : _loc['PIKADAY']['FIRST_DAY'],
                i18n: _loc['PIKADAY']['i18n'],
                onSelect: selectDate
            });

            function selectDate(date) {
                var one_day = 1000 * 60 * 60 * 24;
                var diffDays = parseInt((date - today) / one_day);
                switch (diffDays) {
                   case 0:
                      field.val(_loc['DAYS']['TODAY']);
                      break;
                   case 1:
                      field.val(_loc['DAYS']['TOMORROW']);
                      break;
                   default:
                      field.val(date.format()); //field.val(date.format("Dd, Mm dd"));
                }
                field.data("day", diffDays);
                self.changeDay({target: { value: diffDays }});
            }

            selectDate(this.pickupTime[0].date);

            return this;
        },
        events: {
            'change select.time': 'changeTime'
        },
        changeDay: function(e) {
            var index = e.target.value*1, workingDay,
                day_index = this.pickupTimeIndexByDelta[index];

            if (day_index != undefined) {
                workingDay = this.pickupTime[day_index].workingDay;
            }
            else {
                workingDay = ['closed'];
            }

            var time = this.$('select.time'),
                label = time.parent();

            label.removeAttr('disabled');
            time.removeAttr('disabled');
            time.empty();

            workingDay.forEach(function(value, i) {
                time.append('<option value="' + i + '">' + (value !== "closed" ? value : 'The store is closed') + '</option>');
                if(value === "closed") {
                    time.attr('disabled', 'disabled');
                    label.attr('disabled', 'disabled');
                }
            });

            this.model.set('pickupDay',index);
            this.changeTime({target: { value : 0 }});
        },
        changeTime: function(e) {
            var index = e.target.value*1,
                day = this.$('input.pikaday').data("day"),
                day_index = this.pickupTimeIndexByDelta[day],
                time, date;

                if (day_index != undefined) {
                    time = this.pickupTime[day_index].workingDay[index];
                    date = this.pickupTime[day_index].date;
                }
                else {
                    time = 'closed';
                }

            var format = new TimeFrm,
                pickupTS, isPickupASAP = false;

            this.model.set('pickupTimeReview',index);

            if(time && time.indexOf(_loc['TIME_PREFIXES']['ASAP']) != -1) {
                pickupTS = App.Data.timetables.base().getTime();
                isPickupASAP = true;
            } else if (time === 'closed') {
                pickupTS = null;
            } else {
                format = new TimeFrm(0, 0);
                format.load_from_str(time);
                var timeSplit = format.toString('24 hour').split(':');
                pickupTS = new Date(date.getFullYear(), date.getMonth(), date.getDate(), timeSplit[0], timeSplit[1]).getTime();
            }
            this.model.set({
                'pickupTS': pickupTS,
                'isPickupASAP': isPickupASAP
            });
            return time;
        },
        setPickupDay: function() {
            var pickupDay = this.model.get('pickupDay') || 0,
                pickupTime = this.model.get('pickupTimeReview') || 0,
                day = this.$('input.pikaday'),
                pikaday =  this.$('input.pikaday');

            day.data("day", pickupDay);
            this.changeDay({target: { value: pickupDay }});
            this.model.set('pickupTimeReview', pickupTime);
            this.setPickupTime();
        },
        setPickupTime: function() {
            var pickup = this.model.get('pickupTimeReview') || 0,
                time = this.$('select.time');

            time.val(pickup);
            this.changeTime({target: {value: pickup }});
        },
        listenOrderType: function(model, value) {
            this.isDelivery = this.model.get('dining_option') === 'DINING_OPTION_DELIVERY';
            this.pickupTimeIndexByDelta = {};
            this.pickupTime = this.options.timetable.getPickupList(this.isDelivery, this.pickupTimeIndexByDelta);
            if (value === 'DINING_OPTION_DELIVERY' || value === 'DINING_OPTION_OTHER') {
                this.$('.pickup').text(_loc.CONFIRM_DELIVERY_TIME);
            } else {
                this.$('.pickup').text(_loc.CONFIRM_ARRIVAL_TIME);
            }

            if (value === 'DINING_OPTION_ONLINE' || value == 'DINING_OPTION_SHIPPING') {
                this.$el.hide();
            } else {
                this.$el.show();
            }
            this.setPickupDay();
        }
    });

    App.Views.CoreCheckoutView.CoreCheckoutPayView = App.Views.FactoryView.extend({
        name: 'checkout',
        mod: 'pay',
        render: function() {
            this.$el.html(this.template());
            this.subViews.push(App.Views.GeneratorView.create('Checkout', {
                el: this.$('.btn_wrapper'),
                mod: 'PayButton',
                collection: this.collection,
                checkout: this.collection.checkout
            }));
            return this;
        }
    });

    App.Views.CoreCheckoutView.CoreCheckoutPayButtonView = App.Views.FactoryView.extend({
        name: 'checkout',
        mod: 'pay_button',
        bindings: {
            '.cash > span': 'text: applyCashLabel(checkout_dining_option)',
            '.btn.place-order': 'classes: {disabled: any(shippingPending, orderItems_pending), cash: placeOrder, pay: not(placeOrder)}',
            '.btn.place-order > span': 'text: payBtnText(orderItems_quantity, total_grandTotal)',
            '.stanford-card': 'classes:{hide: orderItems_hasGiftCard}'
        },
        bindingFilters: {
            applyCashLabel: function(dining_option) {
                var isDelivery = dining_option === 'DINING_OPTION_DELIVERY' || dining_option === 'DINING_OPTION_SHIPPING';
                return isDelivery ? MSG.PAY_AT_DELIVERY : MSG.PAY_AT_STORE;
            },
            payBtnText: function(quantity, grandTotal) {
                // Enhancement #12904
                // If grandTotal is $0 we must show "Place Order" button instead of "Pay".
                return (Number(grandTotal) || !quantity) ? _loc.CHECKOUT_PAY : _loc.PLACE_ORDER;
            }
        },
        bindingSources: {
            orderItems: function() {
                var model = new Backbone.Model({
                    hasGiftCard: hasGiftCard(),
                    quantity: App.Data.myorder.get_only_product_quantity(),
                    pending: App.Data.myorder.pending
                });

                model.listenTo(App.Data.myorder, 'add remove', function() {
                    model.set('hasGiftCard', hasGiftCard());
                });
                model.listenTo(App.Data.myorder, 'add change remove', function() {
                    model.set('quantity', App.Data.myorder.get_only_product_quantity());
                });
                // update_cart_totals is in progress
                model.listenTo(App.Data.myorder, 'onCartTotalsUpdate', function() {
                    model.set('pending', true);
                });
                // update_cart_totals completed
                model.listenTo(App.Data.myorder, 'DiscountsComplete NoRequestDiscountsComplete', function() {
                    model.set('pending', false);
                });

                return model;

                function hasGiftCard() {
                    return App.Data.myorder.some(function(item) {
                        return item.is_gift();
                    });
                }
            },
            total: function() {
                return App.Data.myorder.total;
            },
            customer: App.Data.customer
        },
        computeds: {
            placeOrder: {
                deps: ['total_grandTotal', 'orderItems_quantity'],
                get: function(grandTotal, quantity) {
                    var placeOrder = !Number(grandTotal) && quantity;
                    this.needPreValidate = placeOrder ? true : this.needPreValidateDefault;
                    return placeOrder;
                }
            },
            shippingPending: {
                deps: ['checkout_dining_option', 'customer_shipping_selected'],
                get: function(checkout_dining_option, customer_shipping_selected) {
                    return checkout_dining_option == 'DINING_OPTION_SHIPPING' && customer_shipping_selected == -1;
                }
            }
        },
        initialize: function() {
            var payment = App.Data.settings.get_payment_process();
            this.listenTo(this.collection, 'cancelPayment', function() {
                this.canceled = true;
            }, this);
            this.listenTo(this.collection, "paymentFailed", function(message) {
                this.collection.trigger('hideSpinner');
            }, this);
            this.flag = this.options.flag === 'checkout',
            this.needPreValidateDefault = this.needPreValidate = payment.payment_count == 1 && this.flag;
            App.Views.FactoryView.prototype.initialize.apply(this, arguments);
        },
        render: function() {
            var payment = Backbone.$.extend(App.Data.settings.get_payment_process(), {
                flag: this.flag
            });

            this.$el.html(this.template(payment));
            return this;
        },
        events: {
            'click .pay': 'pay_event',
            'keydown .pay': function(e) {
                if (this.pressedButtonIsEnter(e)) {
                    this.pay_event();
                }
            },
            'click .credit-card': 'credit_card',
            'keydown .credit-card': function(e) {
                if (this.pressedButtonIsEnter(e)) {
                    this.credit_card();
                }
            },
            'click .gift-card': 'gift_card',
            'keydown .gift-card': function(e) {
                if (this.pressedButtonIsEnter(e)) {
                    this.gift_card();
                }
            },
            'click .stanford-card': 'stanford_card',
            'keydown .stanford-card': function(e) {
                if (this.pressedButtonIsEnter(e)) {
                    this.stanford_card();
                }
            },
            'click .paypal': function() {
                this.pay(PAYMENT_TYPE.PAYPAL);
            },
            'keydown .paypal': function(e) {
                if (this.pressedButtonIsEnter(e)) {
                    this.pay(PAYMENT_TYPE.PAYPAL);
                }
            },
            'click .cash': function(){
                this.pay(PAYMENT_TYPE.NO_PAYMENT);
            },
            'keydown .cash': function(e) {
                if (this.pressedButtonIsEnter(e)) {
                    this.pay(PAYMENT_TYPE.NO_PAYMENT);
                }
            }
        },
        gift_card: function() {
            var self = this,
                giftCards = App.Data.customer.giftCards;

            $('#popup .cancel').trigger('click');
            App.Data.myorder.check_order({
                order: true,
                tip: true,
                customer: true,
                checkout: true,
                validationOnly: this.needPreValidate
            }, function() {
                App.Data.mainModel.set('popup', {
                    modelName: 'Confirm',
                    mod: 'PayCard',
                    submode: 'Gift',
                    collection: self.collection,
                    checkout: self.collection.checkout,
                    className: 'confirmPayCard',
                    timetable: App.Data.timetables,
                    card: App.Data.giftcard,
                    giftCards: giftCards,
                    two_columns_view: true
                });
            });
        },
        credit_card: function() {
            var self = this,
                customer = App.Data.customer,
                payments = customer.payments,
                noTokens = payments ? !payments.length : true;

            $('#popup .cancel').trigger('click');

            var payment = App.Data.settings.get_payment_process();
            if (!payment.credit_card_dialog && noTokens) {
                if (this.needPreValidate || !payments) {
                    check_order();
                }
                else {
                    // if there are no tokens and this is not prevalidation, need to ask for remember card
                    customer.trigger('onAskForRememberCard', {
                        callback: check_order
                    });
                }
            } else if (this.options.flag) {
                App.Data.myorder.check_order({
                    order: true,
                    tip: true,
                    customer: true,
                    checkout: true,
                    validationOnly: this.needPreValidate
                }, function() {
                    card_popup();
                });
            } else {
                card_popup();
            }

            function check_order() {
                App.Data.myorder.check_order({
                    order: true,
                    tip: true,
                    customer: true,
                    checkout: true,
                    validationOnly: self.needPreValidate
                }, function() {
                    self.pay(PAYMENT_TYPE.CREDIT);
                });
            }

            function card_popup() {
                App.Data.mainModel.set('popup', {
                    modelName: 'Confirm',
                    mod: 'PayCard',
                    submode: 'Credit',
                    collection: self.collection,
                    checkout: self.collection.checkout,
                    className: 'confirmPayCard',
                    timetable: App.Data.timetables,
                    card: App.Data.card,
                    payments: payments,
                    isOnlyTokensDialog: !payment.credit_card_dialog,
                    two_columns_view: true,
                    customer: customer
                });
            }
        },
        pay: function(payment_type) {
            saveAllData();
            var self = this;

            self.collection.check_order({
                order: true,
                tip: true,
                customer: true,
                checkout: true,
                validationOnly: this.needPreValidate
            }, function() {
                self.collection.create_order_and_pay(payment_type);
                !self.canceled && self.collection.trigger('showSpinner');
            $('#popup .cancel').trigger('click');
            });
        },
        pay_event: function() {
            var self = this;
            App.Data.myorder.check_order({
                order: true,
                tip: true,
                customer: true,
                checkout: true,
                validationOnly: true
            }, function() {
                self.collection.trigger('onPay');
            });
        },
        stanford_card: function() {
            var self = this;
            $('#popup .cancel').trigger('click');
            App.Data.myorder.check_order({
                order: true,
                tip: true,
                customer: true,
                checkout: true,
                validationOnly: this.needPreValidate
            }, function() {
                App.Data.mainModel.set('popup', {
                    modelName: 'Confirm',
                    mod: 'StanfordCard',
                    collection: self.collection,
                    checkout: self.collection.checkout,
                    className: 'confirmPayCard stanford-card',
                    timetable: App.Data.timetables,
                    card: App.Data.stanfordCard,
                    two_columns_view: true
                });
            });
        }
    });

    App.Views.CoreCheckoutView.CoreCheckoutPageView = App.Views.FactoryView.extend({
        name: 'checkout',
        mod: 'page',
        initialize: function() {
            this.collection.checkout.on('change:notes', this.update_note, this);
            App.Views.FactoryView.prototype.initialize.apply(this, arguments);
        },
        events: {
            'click input': 'inputClick',
            'change .input_beauty.special' : 'change_note'
        },
        update_note: function(e) {
            this.$('.input_beauty.special textarea').val(this.collection.checkout.get('notes'));
        },
        change_note: function(e) {
            this.collection.checkout.set('notes', e.target.value);
        },
        remove: function() {
            this.$('.data').contentarrow('destroy');
            App.Views.FactoryView.prototype.remove.apply(this, arguments);
        },
        inputClick: function(event) {
            var self = this,
                cont = this.$('.data');
            cont.on('onScroll', restoreFocus);
            function restoreFocus() {
                $(event.target).focus();
                cont.off('onScroll', restoreFocus);
            }
        }
    });

    /*
    *  This DiscountCode view is used by weborder and retail skins.
    */
    App.Views.CoreCheckoutView.CoreCheckoutDiscountCodeView = App.Views.FactoryView.extend({
        name: 'checkout',
        mod: 'discount_code',
        bindings: {
            'input[name=discount_code]': 'value: discount_code, events: ["input"], attr: {readonly: select(last_discount_code, true, false)}',
            '.btnApply': 'classes: {applied: last_discount_code, "primary-text": not(last_discount_code), link: not(last_discount_code)}, text: select(last_discount_code, _lp_CHECKOUT_DISC_CODE_APPLIED, _lp_CHECKOUT_DISC_CODE_APPLY)',
            '.cancel-input': 'classes: {hide: not(last_discount_code)}'
        },
        render: function() {
            var data = this.model.toJSON();
            data.iPad = iPad();
            this.$el.html(this.template(data));
            inputTypeMask(this.$('input'), /^.{0,200}$/, '', 'text');

            return this;
        },
        events: {
            'click .btnApply': 'onApplyCode',
            'click .cancel-input': 'removeDiscountCode'
        },
        onApplyCode: function() {
            var self = this,
                codeLength = this.model.get('discount_code').length,
                myorder = this.options.myorder;

            if (codeLength < 1 || codeLength > 200) {
                App.Data.errors.alert(MSG.ERROR_INCORRECT_DISCOUNT_CODE); // user notification
                return;
            }
            myorder.get_cart_totals({ apply_discount: true});
        },
        removeDiscountCode: function() {
            this.model.set({
                last_discount_code: '',
                discount_code: ''
            });
            this.options.myorder.get_cart_totals();
        }
    });

    /*
    *  This DiscountCode2 view is used by weborder_mobile and paypal skins.
    */
    App.Views.CoreCheckoutView.CoreCheckoutDiscountCode2View = App.Views.FactoryView.extend({
        name: 'myorder',
        mod: 'discount_code',
        initialize: function() {
            App.Views.FactoryView.prototype.initialize.apply(this, arguments);
        },
        render: function() {
            var data = this.model.toJSON();
            data.discount_allow = App.Settings.accept_discount_code === true;
            data.discount_code_applied = this.model.get("last_discount_code");
            this.$el.html(this.template(data));
            inputTypeMask(this.$('input'), /^.{0,200}$/, '', 'text');

            return this;
        },
        events: {
            'click .dcode_have': 'enterDiscountCode',
            'click .dcode_remove': 'removeDiscountCode',
            'click .btnApply': 'onApplyCode',
            'change input[name=discount_code]': 'onChangeDiscountCode',
            'blur input[name=discount_code]': 'onBlurDiscountCode',
        },
        onChangeDiscountCode: function(e) {
            var newValue = e.target.value,
                oldValue = this.model.get("discount_code");

            if (newValue == oldValue || !newValue)
                return;

            this.model.set({"discount_code":newValue}, {silent: true});
        },
        onBlurDiscountCode: function(e) {
            if (!e.target.value) {
                e.target.value = this.model.get("discount_code");
            }
        },
        enterDiscountCode: function() {
            this.$(".dcode_have").addClass('hidden');
            this.$(".dcode_enter").removeClass('hidden');
            this.$('input[name=discount_code]').val(this.model.get("discount_code"));
        },
        removeDiscountCode: function() {
            var myorder = this.options.myorder;
            this.$(".dcode_remove").addClass('hidden');
            this.$(".dcode_have").removeClass('hidden');
            this.model.set({last_discount_code: '',
                            discount_code: ''}, {silent: true});
            myorder.get_cart_totals();
        },
        onApplyCode: function() {
            var self = this,
                codeLength = this.model.get('discount_code').length,
                myorder = this.options.myorder;

            if (codeLength < 1 || codeLength > 200) {
                App.Data.errors.alert(MSG.ERROR_INCORRECT_DISCOUNT_CODE); // user notification
                return;
            }
            myorder.get_cart_totals({ apply_discount: true})
                .done(function(data) {
                    if (data.status == "OK") {
                        self.discountApplied();
                    }
                });
        },
        discountApplied: function() {
            this.$(".dcode_have").addClass('hidden');
            this.$(".dcode_enter").addClass('hidden');
            this.$(".dcode_remove").removeClass('hidden');
        }
    });

    return new (require('factory'))(function() {
        App.Views.CheckoutView = {};
        App.Views.CheckoutView.CheckoutMainView = App.Views.CoreCheckoutView.CoreCheckoutMainView;
        App.Views.CheckoutView.CheckoutOrderTypeView = App.Views.CoreCheckoutView.CoreCheckoutOrderTypeView;
        App.Views.CheckoutView.CheckoutAddressView = App.Views.CoreCheckoutView.CoreCheckoutAddressView;
        App.Views.CheckoutView.CheckoutAddressSelectionView = App.Views.CoreCheckoutView.CoreCheckoutAddressSelectionView;
        App.Views.CheckoutView.CheckoutPickupView = App.Views.CoreCheckoutView.CoreCheckoutPickupView;
        App.Views.CheckoutView.CheckoutDiscountCodeView = App.Views.CoreCheckoutView.CoreCheckoutDiscountCodeView;
        App.Views.CheckoutView.CheckoutDiscountCode2View = App.Views.CoreCheckoutView.CoreCheckoutDiscountCode2View;
        App.Views.CheckoutView.CheckoutPayView = App.Views.CoreCheckoutView.CoreCheckoutPayView;
        App.Views.CheckoutView.CheckoutPayButtonView = App.Views.CoreCheckoutView.CoreCheckoutPayButtonView;
        App.Views.CheckoutView.CheckoutPageView = App.Views.CoreCheckoutView.CoreCheckoutPageView;
        App.Views.CheckoutView.CheckoutOtherView = App.Views.CoreCheckoutView.CoreCheckoutOtherView;
    });
});