﻿/*
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

define(["done_view", "generator"], function(done_view) {
    'use strict';

    var SpinnerView = App.Views.FactoryView.extend({
        createSpinner: function() {
            this.listenTo(this.model, 'loadStarted', this.loadStarted, this);
            this.listenTo(this.model, 'loadCompleted', this.loadCompleted, this);

            var spinner = this.$('#main-spinner');
            spinner.spinner();
            spinner.css('position', 'fixed');
        },
        loadCompleted: function() {
            $(window).trigger('loadCompleted');
            clearTimeout(this.spinner);
            delete this.spinner;
            this.hideSpinner();
        },
        loadStarted: function() {
            this.spinner = setTimeout(this.showSpinner.bind(this), 50);
        },
        showSpinner: function() {
            this.$('#main-spinner').css('font-size', App.Data.getSpinnerSize() + 'px').addClass('ui-visible');
        },
        hideSpinner: function() {
            this.$('#main-spinner').addClass('ui-visible').removeClass('ui-visible');
        }
    });

    var MainMainView = SpinnerView.extend({
        name: 'main',
        mod: 'main',
        initialize: function() {
            this.listenTo(this.model, 'change:content', this.content_change, this);
            this.listenTo(this.model, 'change:header', this.header_change, this);
            this.listenTo(this.model, 'change:cart', this.cart_change, this);
            this.listenTo(this.model, 'change:popup', this.popup_change, this);
            this.listenTo(this.model, 'change:profile_panel', this.profile_change, this);

            this.iOSFeatures();

            this.subViews.length = 4;

            SpinnerView.prototype.initialize.apply(this, arguments);
        },
        bindings: {
            '.store_choice': 'toggle:needShowStoreChoice'
        },
        render: function() {
            SpinnerView.prototype.render.apply(this, arguments);
            this.profile_change();
            this.iPad7Feature();
            this.createSpinner();

            return this;
        },
        events: {
            'click #popup .cancel-btn ': 'hide_popup',
            'click .popup .shadow-bg': 'hide_popup',
            'click .change_establishment': 'change_establishment'
        },
        content_change: function() {
            var content = this.$('#content'),
                data = this.model.get('content'),
                content_defaults = this.content_defaults();

            while (this.subViews.length > 4)
                this.subViews.pop().removeFromDOMTree();

            if (Array.isArray(data))
                data.forEach(function(data) {
                    content.append(this.addContent(data));
                }, this);
            else
                content.append(this.addContent(data));
        },
        header_change: function() {
            var data = _.defaults(this.model.get('header'), this.header_defaults()),
                id = 'header_' + data.modelName + '_' + data.mod;

            this.subViews[0] && this.subViews[0].removeFromDOMTree();
            this.subViews[0] = App.Views.GeneratorView.create(data.modelName, data, id);
            this.$('#header').append(this.subViews[0].el);
        },
        cart_change: function() {
            var data = _.defaults(this.model.get('cart'), this.cart_defaults()),
                id = 'cart_' + data.modelName + '_' + data.mod;

            this.subViews[1] && this.subViews[1].removeFromDOMTree();
            this.subViews[1] = App.Views.GeneratorView.create(data.modelName, data, id);
            this.$('#cart').append(this.subViews[1].el);
        },
        popup_change: function(model, value) {
            var popup = this.$('.popup'),
                data, cache_id;

            if (this.subViews[2]) {
                if (this.subViews[2].options.cache_id ) {
                    this.subViews[2].is_hidden = true; //it's cause of setInterval function in DynamicHeightHelper
                    this.subViews[2].removeFromDOMTree(); //saving the view which was cached before
                }
                else
                    this.subViews[2].remove();
            }

            if (typeof value == 'undefined')
                return popup.removeClass('ui-visible');

            data = _.defaults(this.model.get('popup'), this.popup_defaults());
             if (data.two_columns_view === true) {
                $('#popup').removeClass("popup-background");
            } else {
                $('#popup').addClass("popup-background");
            }

            cache_id = data.cache_id ? 'popup_' + data.modelName + '_' + data.mod + '_' + data.cache_id : undefined;

            var is_init_cache_session = data['init_cache_session'];
            if (is_init_cache_session && cache_id) {
                App.Views.GeneratorView.cacheRemoveView(data.modelName, data.mod, cache_id);
            }

            this.subViews[2] = App.Views.GeneratorView.create(data.modelName, data, cache_id);
            this.subViews[2].is_hidden = false;
            this.$('#popup').append(this.subViews[2].el);

            popup.addClass('ui-visible');
        },
        profile_change: function() {
            var data = _.defaults(this.model.get('profile_panel'), this.profile_defaults());

            if(!data.modelName) {
                return;
            }

            // Don't cache profile view.
            // It can be used in MainProfile with specific el.
            this.subViews[3] && this.subViews[3].remove();
            this.subViews[3] = App.Views.GeneratorView.create(data.modelName, data);
        },
        hide_popup: function(event, status) {
            var callback = _.isObject( this.subViews[2]) ? this.subViews[2].options.action_callback : null;
            this.model.unset('popup');
            callback && callback(status);
        },
        header_defaults: function() {
            return {
                model: this.options.headerModel,
                className: 'header',
                modelName: 'Header'
            };
        },
        cart_defaults: function() {
            return {
                collection: this.options.cartCollection,
                model: this.options.paymentMethods,
                customer: this.options.customer,
                checkout: this.options.cartCollection.checkout,
                total: this.options.cartCollection.total,
                className: 'cart',
                modelName: 'Cart'
            };
        },
        content_defaults: function() {
            return {
                className: 'content'
            };
        },
        popup_defaults: function() {
            /*return {
             className: 'popup'
             };*/
        },
        profile_defaults: function() {
            return {
                el: this.$('#profile-panel')
            };
        },
        addContent: function(data, removeClass) {
            var id = 'content_' + data.modelName + '_' + data.mod;
            data = _.defaults(data, this.content_defaults());

            if (removeClass)
                delete data.className;

            var subView = this.createView(data.modelName, data, id);
            this.subViews.push(subView); // subViews length always > 4

            return subView.el;
        },
        iOSFeatures: function() {
            if (/iPad|iPod|iPhone/.test(window.navigator.userAgent))
                document.addEventListener('touchstart', new Function, false); // enable css :active pseudo-class for all elements
        },
        /**
         * Show the "Change Establishment" modal window.
         */
        change_establishment: function() {
            var ests = App.Data.establishments;
            ests.getModelForView().set({
                storeDefined: true
            }); // get a model for the stores list view
            ests.trigger('loadStoresList');
        }
    });

    var MainMaintenanceView = App.Views.FactoryView.extend({
        name: 'main',
        mod: 'maintenance',
        bindings: {
            '.store_choice': 'toggle:needShowStoreChoice'
        },
        render: function() {
            App.Views.FactoryView.prototype.render.apply(this, arguments);
            this.listenToOnce(App.Data.mainModel, 'loadCompleted', App.Data.myorder.check_maintenance);
        },
        events: {
            'click .reload': 'reload',
            'click .back': 'back',
            'click .change_establishment': 'change_establishment'
        },
        onEnterListeners: {
            ':el': 'reload'
        },
        /**
         * Go to the previous establishment.
         */
        back: function() {
            window.history.back();
        },
        reload: function() {
            window.location.replace(window.location.href.replace(/#.*$/, ''));
        },
        /**
         * Show the "Change Establishment" modal window.
         */
        change_establishment: function() {
            var ests = App.Data.establishments;
            ests.getModelForView().set({
                storeDefined: true
            }); // get a model for the stores list view
            ests.trigger('loadStoresList');
        }
    });

    var MainDoneView = App.Views.CoreMainView.CoreMainDoneView.extend({
        bindings: {
            '.thanks': 'text: insertPlaceholder(_lp_DONE_THANK_YOU, customer_first_name)',
            '.submitted': 'html: insertPlaceholder(_lp_DONE_ORDER_SUBMITTED, format(boldTmp, _system_settings_business_name))',
            '.pickup-time': 'classes: {hide: inList(checkout_dining_option, "DINING_OPTION_ONLINE", "DINING_OPTION_SHIPPING")}, html: insertPlaceholder(select(isDelivery, _lp_DONE_ARRIVE_TIME, _lp_DONE_PICKUP_TIME), format(boldTmp, checkout_pickupTime))',
            '.email-sent-to': 'text: customer_email',
            '.other-options-line': 'classes: {hide: not(equal(checkout_dining_option, "DINING_OPTION_OTHER"))}',
            '.other-options': 'text: joinOtherDiningOptions($other_options)',
            '.address-box': 'classes: {hide: equal(checkout_dining_option, "DINING_OPTION_OTHER")}',
            '.address-label': 'text: addressLabel(checkout_dining_option)',
            '.contact-person': 'text: select(isDelivery, format("$1 $2", customer_first_name, customer_last_name), _system_settings_business_name)',
            '.phone': 'toggle: isDelivery, text: customer_phone',
            '.address-line': 'text: getAddressLine($customer, checkout_dining_option, isDelivery)'
        },
        bindingFilters: {
            insertPlaceholder: function(pattern, value) {
                return pattern.replace('%s', value);
            },
            joinOtherDiningOptions: function(options) {
                if (options instanceof Backbone.Collection) {
                    return options.map(function(option) {
                        option = option.toJSON();
                        return option.name + ' ' + option.value;
                    }).join(', ');
                } else {
                    return '';
                }
            },
            addressLabel: function(dining_option) {
                var label = '';
                switch (dining_option) {
                    case 'DINING_OPTION_DELIVERY':
                        label = _loc.CARD_DELIVERY_ADDRESS;
                        break;
                    case 'DINING_OPTION_SHIPPING':
                        label = _loc.CARD_SHIPPING_ADDRESS;
                        break;
                    case 'DINING_OPTION_CATERING':
                        label = _loc.CARD_CATERING_ADDRESS;
                        break;
                    default:
                        label = _loc.DONE_STORE_ADDRESS;
                }
                return label;
            },
            getAddressLine: function(customer, dining_option, isDelivery) {
                var address = isDelivery ? customer.get('addresses').getCheckoutAddress() : App.Settings.address,
                    line = [],
                    street_1, street_2, zipcode, region;

                if (address) {
                    street_1 = address.street_1 || address.line_1;
                    street_2 = address.street_2 || address.line_2;
                    zipcode = address.zipcode || address.postal_code;
                    street_1 && line.push(street_1);
                    street_2 && line.push(street_2);
                    address.city && line.push(address.city);
                    region = App.Data.settings.getRegion(address),
                    (region || zipcode) && line.push((region ? region + ' ' : '') + (zipcode ? zipcode : ''));
                    address.country && dining_option == 'DINING_OPTION_SHIPPING' && line.push(address.country);
                }

                return line.join(', ');
            }
        },
        computeds: {
            isDelivery: {
                deps: ['checkout_dining_option'],
                get: function(dining_option) {
                    return dining_option == 'DINING_OPTION_DELIVERY'
                        || dining_option == 'DINING_OPTION_SHIPPING'
                        || dining_option == 'DINING_OPTION_CATERING';
                }
            },
            boldTmp: function() {
                return '<span class="bold">$1</span>';
            }
        }
    });

    return new (require('factory'))(done_view.initViews.bind(done_view), function() {
        App.Views.MainView.MainMainView = MainMainView;
        App.Views.MainView.MainMaintenanceView = MainMaintenanceView;
        App.Views.MainView.MainDoneView = MainDoneView;
    });
});