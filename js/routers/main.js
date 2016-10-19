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

define(["backbone", "backbone_extensions", "factory"], function(Backbone) {
    'use strict';
    // flag for maintenance mode
    var isMaintenance;

    App.Routers.MainRouter = Backbone.Router.extend({
        LOC_DINING_OPTION_NAME: '',
        initialize: function() {
            var self = this;

            // create lockedRoutes array if it hasn't been created
            if(!Array.isArray(this.lockedRoutes)) {
                this.lockedRoutes = [];
            }

            this.initLocDiningOptionName();
            this.setTabTitle();

            // extend Backbone.history.loadUrl method to add validation of route handler availability
            // loadUrl() is responsible to call a handler for current route
            // link to raw: https://github.com/jashkenas/backbone/blob/master/backbone.js#L1575
            Backbone.history.loadUrl = function(fragment) {
                fragment = this.getFragment(fragment);  // used Backbone.History.prototype.getFragment() method

                var blocked = self.isBlocked();
                if (blocked) {
                    fragment = blocked;
                }

                // check if current route is locked and replace it on 'index' when it is true
                if(self.lockedRoutes.indexOf(fragment) > -1) {
                    fragment = 'index';
                }
                if (App.Settings.promo_message) {
                    if (/^(index.*)?$/i.test(fragment)) {
                        self.trigger('showPromoMessage');
                    } else {
                        self.trigger('hidePromoMessage');
                    }
                }
                return Backbone.History.prototype.loadUrl.call(this, fragment);
            }

            // override Backbone.history.start listen to 'initialized' event
            var start = Backbone.history.start;
            Backbone.history.start = function(opts) {
                if(!self.initialized)
                    return self.on('initialized', startHistory);

                return startHistory();

                function startHistory() {
                    return start.call(Backbone.history, opts);
                }
            };

            // listen to hash changes
            this.listenTo(this, 'route', function(route, params) {
                var settings = App.Data.settings,
                    customer = App.Data.customer;

                if(settings.get('isMaintenance'))
                    if (location.hash.slice(1) !== 'maintenance') {
                        location.reload();
                    }

                var blocked = self.isBlocked();
                if (blocked) {
                    location.hash = blocked;
                }

                var needGoogleMaps = false,
                    cur_hash = location.hash.slice(1);

                if (this.hashForGoogleMaps)
                    this.hashForGoogleMaps.some( function(hash) {
                        if (cur_hash == hash) {
                            needGoogleMaps = true;
                            return true;
                        }
                    });

                if (needGoogleMaps)
                    settings.load_geoloc();

                if (this.use_google_captcha && !App.Data.settings.get('isMaintenance'))
                    settings.load_google_captcha();

                // update session history state-object
                this.updateState(true);
            });

            this.once('started', function() {
                self.started = true;
            });

            // start listen to state changes
            this.once('initialized', this.runStateTracking.bind(this));

            // remember state of application data (begin)
            App.Data.stateAppData = {};
            for (var i in App.Data) {
                App.Data.stateAppData[i] = true;
            }
            // remember state of application data (end)

            this.listenTo(App.Data.myorder, 'paymentResponse paymentFailed', function() {
                App.Data.establishments && App.Data.establishments.removeSavedEstablishment();
            }, this);

            // set handler for window.unload event
            window.onunload = this.beforeUnloadApp.bind(this);
        },
        isBlocked: function() {
            var fragment = null;

            if (App.Data.customer.isLocked()) {
                fragment = 'profile_edit';
            }

            return fragment;
        },
        setTabTitle: function() {
            var title = _loc.TAB_TITLE_ONLINE_ORDERING;
            if (App.Settings['business_name']) {
                title = App.Settings['business_name'] + ' ' + title;
            }
            pageTitle(title);
        },
        navigate: function() {
            var blocked = this.isBlocked();
            if (blocked) {
                arguments[0] = blocked;
            }

            this.started && !blocked && arguments[0] != location.hash.slice(1) && App.Data.mainModel.trigger('loadStarted');
            if(App.Data.settings.get('isMaintenance') && arguments[0] != 'maintenance')
                arguments[0] = 'maintenance';

            return Backbone.Router.prototype.navigate.apply(this, arguments); // TODO: can be useful {replace: true} 3rd argument
        },
        change_page: function(cb) {
            App.Data.mainModel.trigger('loadCompleted');
            !this.started && this.trigger('started');
        },
        maintenance : function() {
            if (!App.Data.settings.get('isMaintenance')) {
                this.navigate('index', true);
                return;
            } else {
                isMaintenance = true;
            }
        },
        initLocDiningOptionName: function() {
            this.LOC_DINING_OPTION_NAME = _.clone(_loc.DINING_OPTION_NAME);

            // remove Delivery option if it is necessary
            if (!App.Data.myorder.total.get('delivery').get('enable'))
                delete this.LOC_DINING_OPTION_NAME.DINING_OPTION_DELIVERY;

            if(App.Settings.editable_dining_options && App.Settings.editable_dining_options[0]) {
                if (this.LOC_DINING_OPTION_NAME['DINING_OPTION_DRIVETHROUGH']) {
                    this.LOC_DINING_OPTION_NAME.DINING_OPTION_DRIVETHROUGH = _.escape(App.Settings.editable_dining_options[1]);
                }
                if (this.LOC_DINING_OPTION_NAME['DINING_OPTION_OTHER']) {
                    this.LOC_DINING_OPTION_NAME.DINING_OPTION_OTHER = _.escape(App.Settings.editable_dining_options[2]);
                }
            }

            for (var dining_option in DINING_OPTION) {
                if (!App.Settings.dining_options || App.Settings.dining_options.indexOf(DINING_OPTION[dining_option]) == -1) {
                    delete this.LOC_DINING_OPTION_NAME[dining_option];
                }
            }
        },
        prepare: function(page, callback, dependencies) {
            if(isMaintenance && page != 'maintenance' &&  page != 'establishments') return;

            var settings = App.Data.settings,
                skin = settings.get('skin'),
                settings_skin = settings.get('settings_skin'),
                skinPath = settings.get('skinPath'),
                basePath = settings.get('basePath'),
                scripts = page && Array.isArray(settings_skin.routing[page].js) ? settings_skin.routing[page].js : [],
                templates = page && Array.isArray(settings_skin.routing[page].templates) ? settings_skin.routing[page].templates : [],
                views = page && Array.isArray(settings_skin.routing[page].views) ? settings_skin.routing[page].views : [],
                css = page && Array.isArray(settings_skin.routing[page].css) ? settings_skin.routing[page].css : [],
                externCss = [],
                cssCore = page && Array.isArray(settings_skin.routing[page].cssCore) ? settings_skin.routing[page].cssCore : [],
                templatesCore = page && Array.isArray(settings_skin.routing[page].templatesCore) ? settings_skin.routing[page].templatesCore : [],
                models = page && Array.isArray(settings_skin.routing[page].model) ? settings_skin.routing[page].model : [],
                core = page && Array.isArray(settings_skin.routing[page].core) ? settings_skin.routing[page].core : [],
                color_schemes = Array.isArray(settings_skin.color_schemes) ? settings_skin.color_schemes : [],
                system_settings = App.Data.settings.get('settings_system'),
                js = core,
                i, j;

            // contain list of skin css specified
            if(!Array.isArray(this.skinCSS)) {
                this.skinCSS = [];
            }

            callback = typeof callback == 'function' ? callback.bind(this) : new Function;

            dependencies = Array.isArray(dependencies) ? dependencies : [];

            color_schemes.length > 0 && !this.prepare.initialized && initTheme.call(this);

            var countCSS = css.length + cssCore.length + externCss.length;
            if (countCSS) {
                var loadModelCSS = {
                    count: countCSS,
                    dfd: $.Deferred()
                };
            }

            var countTemplates = templates.length + templatesCore.length;
            if (countTemplates) {
                var loadModelTemplate = {
                    count: countTemplates,
                    dfd: $.Deferred()
                };
            }

            for(i = 0, j = scripts.length; i < j; i++)
                js.push(skin + "/js/" + scripts[i]);

            for (i = 0, j = templates.length; i < j; i++)
                loadTemplate2(skin, templates[i], false, loadModelTemplate);

            for(i = 0, j = views.length; i < j; i++)
                js.push(skin + "/views/" + views[i]);

            for (i = 0, j = css.length; i < j; i++)
                this.skinCSS.push(loadCSS(skinPath + '/css/' + css[i], loadModelCSS));

            for (i = 0, j = externCss.length; i < j; i++)
                this.skinCSS.push(loadCSS(externCss[i], loadModelCSS));

            for(i = 0, j = models.length; i < j; i++)
                js.push(skin + "/models/" + models[i]);

            for(i = 0, j = cssCore.length; i < j; i++)
                this.skinCSS.push(loadCSS(basePath + '/css/' + cssCore[i], loadModelCSS));

            for (i = 0, j = templatesCore.length; i < j; i++)
                loadTemplate2(null, templatesCore[i], true, loadModelTemplate); // sync load template

            //trace("this.skinCSS length = ", this.skinCSS.length, countCSS);
            //trace(css, cssCore, externCss);

            require(js, function() {
                // init Views (#18015)
                var ViewModule = require('factory');
                Array.prototype.forEach.call(arguments, function(module) {
                    if(module instanceof ViewModule) {
                        module.initViews();
                    }
                });

                if (loadModelTemplate && loadModelTemplate.dfd) dependencies.push(loadModelTemplate.dfd);
                if (loadModelCSS && loadModelCSS.dfd) dependencies.push(loadModelCSS.dfd);

                // now App.Data.loadModules doesn't use in app nowhere
                /*
                if (App.Data.loadModules) {
                    dependencies.push(App.Data.loadModules);
                }
                */

                $.when.apply($, dependencies).then(function() {
                    callback();
                });
            });

            function initTheme() {
                var app = require('app'),
                    local_theme = app.get['local_theme'] == "true" ? true : false;
                if (App.skin != App.Skins.WEBORDER_MOBILE
                    && App.skin != App.Skins.DIRECTORY_MOBILE
                    && App.skin != App.Skins.DIRECTORY
                    && App.skin != App.Skins.WEBORDER
                    && App.skin != App.Skins.RETAIL) {
                    local_theme = true;
                }
                var server_color_schemes = {};
                server_color_schemes[ App.Skins.WEBORDER ] = 'weborder-desktop-colors';
                server_color_schemes[ App.Skins.RETAIL ] = 'retail-desktop-colors';
                server_color_schemes[ App.Skins.WEBORDER_MOBILE ] = 'weborder-mobile-colors';
                server_color_schemes[ App.Skins.DIRECTORY_MOBILE ] = 'directory-mobile-colors';
                server_color_schemes[ App.Skins.DIRECTORY ] = 'directory-colors';

                if (local_theme == true) {
                    var color_scheme = typeof system_settings.color_scheme == 'string' ? system_settings.color_scheme.toLowerCase().replace(/\s/g, '_') : null;
                    if (color_schemes.indexOf(color_scheme) > -1) {
                        css.push('themes/' + color_scheme + '/colors');
                    } else {
                        App.Data.log.pushJSError('"' + system_settings.color_scheme + '" color scheme is not available', 'js/router/main.js', '151');
                        css.push('themes/default/colors');
                    }
                } else {
                    externCss.push(settings.get('host') + '/weborders/css/' + encodeURIComponent(system_settings.color_scheme) + '/' + server_color_schemes[ App.skin ] );
                }
                this.prepare.initialized = true;
            }
        },
        pay: function() {
            App.Data.myorder.submit_order_and_pay(App.Data.myorder.checkout.get('payment_type'), undefined, true);
        },
        loadData: function() {
            var load = $.Deferred();

            this.prepare('pay', function() {
                App.Data.loadFromLocalStorage = true;
                App.Data.card = new App.Models.Card();
                App.Data.card.loadCard();
                this.initGiftCard();
                App.Data.giftcard.loadCard();
                App.Data.stanfordCard && App.Data.stanfordCard.restoreCard();
                this.loadCustomer();
                App.Data.myorder.loadOrders();
                App.Data.establishments && App.Data.establishments.removeSavedEstablishment();
                App.Data.loadFromLocalStorage = false;
                load.resolve();
            });

            return load;
        },
        /**
         * Init App.Data.customer
         */
        initCustomer: function() {
            var app = require('app');

            // set cookie in directory mode
            if (App.Data.dirMode && app.user_cookie && _.isNumber(app.cookie_expires_in)) {
                App.Models.Customer.prototype.setCookie(app.user_cookie, app.cookie_expires_in);
                delete app.user_cookie;
                delete app.cookie_expires_in;
            }

            var paymentProcessor = _.isObject(App.Settings.payment_processor) && PaymentProcessor.getPaymentProcessor(PAYMENT_TYPE.CREDIT),
                customer = App.Data.customer = new App.Models.Customer({
                    keepCookie: App.SettingsDirectory.remember_me
                }),
                self = this;

            if (typeof App.SettingsDirectory.auth_url == 'string' && App.SettingsDirectory.auth_url) {
                var srv_url = App.SettingsDirectory.auth_url.replace(/\/*$/, '');
                customer.set('serverURL', srv_url);
                customer.defaults.serverURL = srv_url;
            }

            // set payments tokens collection
            if (App.SettingsDirectory.saved_credit_cards && paymentProcessor === USAePayPaymentProcessor) {
                customer.setPayments(App.Collections.USAePayPayments);
            } else if (App.SettingsDirectory.saved_credit_cards && paymentProcessor === MercuryPaymentProcessor) {
                customer.setPayments(App.Collections.MercuryPayments);
            } else if (App.SettingsDirectory.saved_credit_cards && paymentProcessor === FreedomPayPaymentProcessor) {
                customer.setPayments(App.Collections.FreedomPayments);
            } else if (App.SettingsDirectory.saved_credit_cards && paymentProcessor === BraintreePaymentProcessor) {
                customer.setPayments(App.Collections.BraintreePayments);
            } else if (App.SettingsDirectory.saved_credit_cards && paymentProcessor === GlobalCollectPaymentProcessor) {
                customer.setPayments(App.Collections.GlobalCollectPayments);
                listenToCVVRequired.call(this);
            } else {
                App.SettingsDirectory.saved_credit_cards = false;
            }

            // set addresses
            customer.setAddresses();

            // change address selection according to selected dining option
            this.listenTo(App.Data.myorder.checkout, 'change:dining_option', function(checkoutModel, dining_option) {
                customer.get('addresses').changeSelection(dining_option);
            });

            // set gift cards
            if (App.SettingsDirectory.saved_gift_cards) {
                customer.setGiftCards();
            }

            // set reward cards
            if (App.SettingsDirectory.saved_reward_cards) {
                customer.setRewardCards();
            }

            // replace business name
            _loc.PROFILE_USER_CREATED = _loc.PROFILE_USER_CREATED.replace('%s', App.Settings.business_name || '');

            this.listenTo(customer, 'onUserCreated', function() {
                App.Data.errors.alert(_loc.PROFILE_USER_CREATED);
            });

            this.listenTo(customer, 'onInvalidUser', function() {
                App.Data.errors.alert(_loc.PROFILE_LOGIN_ERROR);
            });

            this.listenTo(customer, 'onResendActivationError', function(msg) {
                App.Data.errors.alert(_loc.PROFILE_RESEND_ACTIVATION_ERROR);
            });

            this.listenTo(customer, 'onLoginError', function(msg) {
                _.isObject(msg) && App.Data.errors.alert(msg.error_description || msg.error);
            });

            this.listenTo(customer, 'onUserExists', function(msg) {
                _.isObject(msg) && App.Data.errors.alert(_loc.PROFILE_USER_EXISTS.replace('%s', App.Data.customer.get('email')));
            });

            this.listenTo(customer, 'onUserSessionExpired', function() {
                App.Data.errors.alert(_loc.PROFILE_SESSION_EXPIRED);
            });

            this.listenTo(customer, 'onUserNotFound', function() {
                App.Data.errors.alert(_loc.PROFILE_USER_NOT_FOUND);
            });

            this.listenTo(customer, 'onUserAddressNotFound', function() {
                App.Data.errors.alert(_loc.PROFILE_USER_ADDRESS_NOT_FOUND);
            });

            this.listenTo(customer, 'onUserValidationError onUserAPIError', function(msg) {
                App.Data.errors.alert(prepareMessage(msg));
            });

            this.listenTo(customer, 'onPasswordInvalid', function() {
                App.Data.errors.alert(_loc.PROFILE_INVALID_PASSWORD);
            });

            this.listenTo(customer, 'onPasswordResetError', function() {
                App.Data.errors.alert(_loc.PROFILE_INVALID_EMAIL);
            });

            this.listenTo(customer, 'onPasswordResetCustomerError', function() {
                App.Data.errors.alert(_loc.PROFILE_PASSWORD_RESET_CUSTOMER_INVALID);
            });

            this.listenTo(customer, 'onPasswordReset', function() {
                App.Data.errors.alert(_loc.PROFILE_PASSWORD_RESET_SUCCESS);
            });

            this.listenTo(customer, 'onTokenNotFound', function() {
                App.Data.errors.alert(_loc.PROFILE_PAYMENT_TOKEN_NOT_FOUND);
            });

            this.listenTo(customer, 'onAskForRememberCard', function(data) {
                App.Data.errors.alert(MSG.CARD_SAVE, false, true, {
                    isConfirm: true,
                    typeIcon: '',
                    confirm: {
                        ok: _loc.YES,
                        cancel: _loc.NO
                    },
                    callback: function(res) {
                        App.Data.card.set('rememberCard', !!res);
                        data.callback();
                    }
                });
            });

            this.listenTo(customer, 'onLogin', function() {
                this.detectCurrentLocation().done(function(coordinates) {
                    if (Array.isArray(coordinates)) {
                        customer.updateCustomer({coordinates: coordinates});
                    }
                });
                // if customer registered before email/push notifications were implemented
                // need to ask whether he would like to receive these notifications.
                !customer.get('accept_tou') && askAboutPromotionNotifications();
            });

            // 'onReorderCompleted' event emits when an order completes a reorder
            this.listenTo(customer.orders, 'onReorderCompleted', function(changes) {
                if (Array.isArray(changes) && changes.length) {
                    App.Data.errors.alert(_loc.ORDER_CHANGED);
                }
            });

            function listenToCVVRequired() {
                this.listenTo(customer, 'onCVVRequired', function(data) {
                    App.Data.errors.alert('', false, false, {
                        isConfirm: true,
                        typeIcon: '',
                        confirm: {
                            ok: _loc.CONTINUE,
                            cancel: _loc.CANCEL
                        },
                        customView: new App.Views.ProfileView.ProfilePaymentCVVView({
                            model: data.payment,
                            className: 'profile-cvv-container'
                        }),
                        callback: function(res) {
                            if(res) {
                                data.callback();
                            } else {
                                App.Data.mainModel.trigger('loadCompleted');
                                data.def.resolve({status: 'CVV_REQUIRED_CANCELED'});
                            }
                        }
                    });
                });
            }

            function prepareMessage(msg) {
                var messages = [];

                if (_.isObject(msg)) {
                    _.each(msg, function(message) {
                        if (_.isObject(message)) {
                            for (var i in message) {
                                messages.push( message[i] );
                            }
                        }
                        else {
                            messages.push( message.toString() );
                        }
                    });
                }

                return messages.length ? messages.join(' ') : null;
            }

            function askAboutPromotionNotifications() {
                App.Data.errors.alert(_loc.PROFILE_ACCEPT_TOU, false, true, {
                        isConfirm: true,
                        confirm: {
                            ok: _loc.YES,
                            cancel: _loc.NO_THANKS
                        },
                        callback: function(res) {
                            res = Boolean(res);
                            customer.set({
                                email_notifications: res,
                                push_notifications: res
                            });
                            customer.updateCustomer({
                                accept_tou: true,
                                email_notifications: res,
                                push_notifications: res
                            });
                        }
                    });
            }
        },
        /**
         * Detects current location.
         */
        detectCurrentLocation: function() {
            var dfd = Backbone.$.Deferred(),
                geoloc = new App.Models.Geolocation({
                    timeout: App.Data.settings.get('timeout')
                });

            geoloc.detect_current_location().done(function() {
                var coords = geoloc.get_current_loc() || geoloc.getDefaultCurrentLoc();

                if (_.isObject(coords) && typeof coords.latitude == 'number' && typeof coords.longitude == 'number') {
                    dfd.resolve([coords.latitude, coords.longitude]);
                } else {
                    dfd.resolve();
                }
            });

            return dfd;
        },
        /**
         * Inits App.Data.giftcard if it is undefined
         */
        initGiftCard: function() {
            if(!App.Data.giftcard) {
                App.Data.giftcard = new App.Models.GiftCard();
                this.listenTo(App.Data.giftcard, 'onLinkError', App.Data.errors.alert.bind(App.Data.errors));
            }
        },
        /**
         * Init App.Data.customer and restore its state from a storage
         */
        loadCustomer: function() {
            App.Data.customer.loadCustomer();
        },
        /**
         * Init App.Data.promotions.
         */
        initPromotions: function() {
            // get the order items for submitting to server
            var items = App.Data.myorder.map(function(order) {
                    return order.item_submit();
                }),
                myorder = App.Data.myorder,
                checkout = myorder.checkout,
                discount_code = checkout.get('discount_code'),
                promotions = App.Data.promotions = App.Collections.Promotions.init(items, discount_code, App.Data.customer.getAuthorizationHeader());

            // listen to change of promotions selection
            this.listenTo(promotions, 'change:is_applied', function(model, is_applied) {
                // promotion is seleted
                if (is_applied) {
                    if (myorder.get_only_product_quantity()) {
                        checkout.set({discount_code: model.get('code')});
                        myorder.get_cart_totals({apply_discount: true});
                    }
                    else {
                        checkout.set({last_discount_code: model.get('code')});
                    }
                }
                // promotion is deselected
                else if (!promotions.where({is_applied: true}).length) {
                    checkout.set({
                        last_discount_code: '',
                        discount_code: ''
                    });
                    myorder.get_cart_totals();
                }
            });

            this.listenTo(promotions, 'remove', function(model) {
                model.set('is_applied', false); // remove a selection on promotion removal to fire corresponding event
            });

            this.listenTo(App.Data.myorder, 'add remove change', function() {
                // need to update promotions since 'is_applicable' attribute could be changed after changing order
                promotions.needToUpdate = true;
            });

            this.listenTo(checkout, 'change:last_discount_code', function(model, value) {
                if (!value) {
                    promotions.invoke('set', {is_applied: false});
                }
                else {
                    promotions.applyByCode(value);
                }
            });

            this.listenTo(App.Data.customer, 'change:access_token', function(customer, access_token) {
                items = App.Data.myorder.map(function(order) {
                    return order.item_submit();
                });
                discount_code = checkout.get('discount_code');
                promotions.update(items, discount_code, App.Data.customer.getAuthorizationHeader());
            });

            return promotions;
        },
        /**
         * Handler of a payment response.
         * Check payment state and redirect to #pay if payment exists
         *
         * @param {function} cb Function callback.
         */
        initPaymentResponseHandler: function(cb) {
            var myorder = App.Data.myorder,
                savedDefaultPaymentState = PaymentProcessor.loadDefaultState(); // must be called forever to clear saved state in storage

            // Bug #25585
            // Restore payment data if it has been lost.
            // extend will take effect only if payment data is stored in the storage and is not presented in get parameters
            // (it happens when user loses connection after return from payment processor, and the app reloads when the connection is restored)
            App.Data.get_parameters = _.extend({}, parse_get_params(), PaymentProcessor.getPaymentData());

            this.listenTo(myorder, 'paymentResponse', function() {
                var is_gift, card = App.Data.card,
                    giftcard = App.Data.giftcard,
                    customer = App.Data.customer,
                    stanfordCard = App.Data.stanfordCard,
                    myorderClone = myorder.clone();

                App.Data.settings.usaepayBack = true;

                var status = myorder.paymentResponse.status.toLowerCase();
                switch (status) {
                    case 'ok':
                        PaymentProcessor.completeTransaction();        // complete payment transaction
                        is_gift = myorder.change_only_gift_dining_option();
                        myorder.clearData();
                        card && card.clearData();                      // removal of information about credit card
                        if (!is_gift) {
                            myorder.checkout.revert_dining_option();   //restore dinin_option from selected_dining_option
                        }
                        customer && customer.resetShippingServices();  // clear shipping service selected
                        giftcard && giftcard.reset();                  // clear Gift card data
                        stanfordCard && stanfordCard.clearData();      // clear Stanford card data
                        // add order to past orders list
                        customer && customer.isAuthorized() && customer.getOrder(myorder.paymentResponse.orderId).done(function() {
                            // set this order as past order
                            customer.set('pastOrder', customer.orders.get(myorder.paymentResponse.orderId));
                        });
                        break;
                    case 'error':
                        card && card.clearData(); // removal of information about credit card
                        break;
                }

                // call cb
                typeof cb == 'function' && cb(myorder.paymentResponse.capturePhase, myorderClone);
            }, this);

            // Check if app is loaded after payment on external payment page (paypal, usaepay and others).
            // If true change init hash on #pay replacing history entry to immediately handle payment response.
            // If `pay` GET-parameter doesn't exist and `savedDefaultPaymentState` exists change hash on #pay creating new history entry.
            if(App.Data.get_parameters.pay || App.Data.get_parameters[MONERIS_PARAMS.PAY]) {
                // Bug #25585
                if (App.Data.get_parameters.pay == 'true' || App.Data.get_parameters[MONERIS_PARAMS.PAY] == 'true') { // check for real get params, not the extended ones.
                    // We got payment data from payment processor.
                    // Need to save payment data - it will be restored if something goes wrong with transaction processing.
                    PaymentProcessor.setPaymentData();
                }
                window.location.replace('#pay');
            } else if(savedDefaultPaymentState) {
                App.Data.get_parameters.pay = savedDefaultPaymentState;
                window.location.assign('#pay');
            }
        },
        /**
        * Load the page with stores list.
        */
        loadViewEstablishments: function() {
            var ests = App.Data.establishments,
                modelForView = ests.getModelForView(),// get a model for the stores list view
                settings = App.Data.settings;

            if (modelForView.get('isMobileVersion')) {
                (!App.skin) && settings.set('skin', App.Skins.WEBORDER_MOBILE);
            } else {
                (!App.skin) && settings.set('skin', App.Skins.WEBORDER);
            }

            App.Routers.MainRouter.prototype.prepare('establishments', function() {
                var locale = App.Data.locale;
                locale.dfd_load.done(function() {
                    var view = App.Views.GeneratorView.create('Establishments', {
                        mod: 'Main',
                        className: 'establishments_view',
                        collection: ests,
                        model: modelForView
                    }, 'ContentEstablishmentsCore');
                    Backbone.$('body').append(view.el);
                    Backbone.$(window).trigger('hideSpinner');
                });
            });
        },
        /**
        * Get a stores list.
        */
        getEstablishments: function() {
            var self = this;
            var ests = App.Data.establishments;
            ests.getEstablishments('once').then(function() { // get establishments from backend
                if (ests.length > 1 || (ests.length == 1 &&
                    ests.models[0].get("id") != App.Data.settings.get("establishment"))) {
                    self.getEstablishmentsCallback();
                }
                ests.trigger('onEstablishmentsReceived');
            });
        },
        /**
        * Remove establishment data in case if establishment ID will change.
        */
        resetEstablishmentData: function() {
            this.prepare.initialized = false;
            delete App.Data.router;
            for (var i in App.Data) {
                if (App.Data.stateAppData[i] === undefined) {
                    delete App.Data[i];
                }
            }

            var history = Backbone.history;

            history.stop(); // stop tracking browser history changes

            // reset isMaintenance
            isMaintenance = false;
            App.Data.settings.set('isMaintenance', isMaintenance);

            typeof history.stopStateTracking == 'function' && history.stopStateTracking(); // stop tracking state changes
            this.stopListening(); // stop listening all handlers
            this.removeHTMLandCSS(); // remove css and templates from DOM tree
        },
        removeHTMLandCSS: function() {
            Backbone.$('script[type="text/template"]').remove();
            Array.isArray(this.skinCSS) && this.skinCSS.forEach(function(el) {
                el.remove();
            });
        },
        /**
         * Push data changes to browser history entry.
         * Tracking state data is stored in `stateData` property of history entry's data object.
         * @param {boolean} replaceState - If true, replace the current state, otherwise push a new state.
         * @param {string} [url] - Page url.
         */
        updateState: function(replaceState, url) {
            if(typeof this.updateState.counter == 'undefined') {
                this.updateState.counter = 0;
            }

            var title = App.Data.settings.get("settings_skin").name_app;
            url = url || location.href;

            if(replaceState) {
                window.history.replaceState({stateData: this.getState()}, title, url);
            } else {
                window.history.pushState({stateData: this.getState()}, title, url);
            }
        },
        /**
         * Create and return session history state-object.
         * @return {Object}
         */
        getState: function() {
            return {establishment: App.Data.settings.get('establishment')};
        },
        /*
         * Restore state data from session history entry.
         * Tracking state data is stored in `stateData` property of session history entry's data object.
         * @param {Object} event - PopStateEvent.
         * @return {Object} event.state.stateData object
         */
        restoreState: function(event) {
            var data = event.state instanceof Object ? event.state.stateData : undefined,
                ests = App.Data.establishments;

            // hide establishments view & alert message
            ests && ests.trigger('hideEstsView');
            App.Data.errors.trigger('hideAlertMessage');

            if(_.isObject(data) && ests && data.establishment > 0) {
                ests.trigger('changeEstablishment', data.establishment, true); // 3rd parameter is flag of restoring
            }
            return data;
        },
        /**
         * Start tracking of application state changes
         */
        runStateTracking: function() {
            if(!(typeof window.addEventListener == 'function') || !(typeof window.history == 'object') || !(typeof window.history.pushState == 'function')) {
                return;
            }
            var cb = this.restoreState.bind(this),
                ests = App.Data.establishments;
            window.addEventListener('popstate', cb, false);
            Backbone.history.stopStateTracking = window.removeEventListener.bind(window, 'popstate', cb, false);
            if(ests) {
                // Listen to establishment changes to track in session history.
                this.listenTo(ests, 'changeEstablishment', function(id, isRestoring) {
                    if(isRestoring) {
                        return;
                    }
                    // need clear hash when user changes establishment
                    this.updateState(false, location.href.replace(/#.*/, ''));
                }, this);
            }
            return true;
        },
        navigateDirectory: function() {
            if(App.Data.dirMode) {
                var navigateToDirectoryConfirmed = function () {
                    var directoryState = getData('directory.state'),
                        directoryHash = '';

                    if (directoryState instanceof Object && directoryState.hash) {
                        directoryHash = directoryState.hash;
                    }

                    return window.location.href = getData('directoryReferrer').referrer + directoryHash;
                };
                if (App.Data.establishments.getModelForView().get('needShowAlert')) { // cart is not empty
                    // use '_DESKTOP' i18n strings because we don't have 'Go to directory' link in weborder_mobile
                    App.Data.errors.alert(MSG.ESTABLISHMENTS_ALERT_MESSAGE_DESKTOP, false, false, { // confirmation popup
                        isConfirm: true,
                        confirm: {
                            ok: MSG.ESTABLISHMENTS_ALERT_PROCEED_BUTTON_DESKTOP,
                            cancel: MSG.ESTABLISHMENTS_ALERT_BACK_BUTTON_DESKTOP,
                            btnsSwap: true
                        },
                        callback: function(result) {
                            if (result) navigateToDirectoryConfirmed();
                        }
                    });
                }
                else {
                    // there is no need to show confirmation popup
                    navigateToDirectoryConfirmed();
                }
            }
        },
        /**
         * User notification.
         */
        alertMessage: function() {
            var errors = App.Data.errors;
            App.Routers.MainRouter.prototype.prepare('errors', function() {
                var view = App.Views.GeneratorView.create('CoreErrors', {
                    mod: 'Main',
                    model: errors
                }, 'ContentErrorsCore'); // generation of view
                Backbone.$('body').append(view.el);
                errors.trigger('showAlertMessage'); // user notification
            });
        },
        /**
         * This method is invoked before app close
         */
        beforeUnloadApp: function() {
            // any code may be written here
        },
        /**
         * Returns unique id of app defined as '<hostname>.<skin>.<establishment>'
         */
        getUID: function() {
            var settings = App.Data.settings.toJSON();
            return [settings.hostname, settings.skin, settings.establishment].join('.');
        },
        loadGoogleMaps: function() {
            var dfd = Backbone.$.Deferred();
            require(['async!https://maps.google.com/maps/api/js?v=3&sensor=false&libraries=places!callback'], function() {
                dfd.resolve();
                new google.maps.InfoWindow({ content: "Test" }); //force this to load infowindow.js
            }, function (err) {
                App.Data.errors.alert(MSG.ERROR_CAN_NOT_LOAD_THE_GOOGLE_MAPS_SERVICE, true); // user notification
            });
            return dfd;
        },
        getProfileAddressesPromises: function() {
            var customer = App.Data.customer,
                promises = [],
                addressesDef = Backbone.$.Deferred();

            if (customer.get('addresses') && customer.addressesRequest) {
                customer.addressesRequest.always(addressesDef.resolve.bind(addressesDef));
                promises.push(addressesDef);
            }

            return promises;
        },
        getProfilePaymentsPromises: function() {
            var customer = App.Data.customer,
                promises = [],
                paymentsDef = Backbone.$.Deferred(),
                giftCardsDef = Backbone.$.Deferred();

            // payments are available
            if (customer.payments && customer.paymentsRequest) {
                customer.paymentsRequest.always(paymentsDef.resolve.bind(paymentsDef));
                promises.push(paymentsDef);
            }

            // gift cards are available
            if (customer.giftCards && customer.giftCardsRequest) {
                customer.giftCardsRequest.always(giftCardsDef.resolve.bind(giftCardsDef));
                promises.push(giftCardsDef);
            }

            return promises;
        },
        /**
         * Returns collection of stores which can be shown on map
         */
        getStoresForMap: function() {
            var stores = new Backbone.RadioCollection(),
                ests = App.Data.establishments;

            stores.request = Backbone.$.Deferred();

            // set stores if they are already received
            if (ests.length) {
                setData();
            }

            // set stores once establishments are received.
            stores.listenTo(ests, 'onEstablishmentsReceived', setData);

            return stores;

            function setData() {
                var settings = App.Data.settings,
                    _stores = [];
                ests.each(function(store) {
                    store = store.toJSON();
                    var selected = store.id === settings.get('establishment');
                    if (typeof store.latitude == 'number' && !isNaN(store.latitude)
                        && typeof store.longitude == 'number' && !isNaN(store.longitude)) {
                        var data = {
                            id: store.id,
                            name: store.business_name || store.name,
                            line_1: store.line_1,
                            line_2: store.line_2,
                            city: store.city_name,
                            province: store.province,
                            state: store.state,
                            country: store.country,
                            zipcode: store.zipcode,
                            latitude: store.latitude,
                            longitude: store.longitude,
                            selected: selected
                        };
                        data.region = settings.getRegion(data);
                        if (selected) {
                            _stores.unshift(data);
                        } else {
                            _stores.push(data);
                        }
                    }
                });
                stores.reset(_stores);
                stores.request.resolve();
            }
        },
        /**
         * Navigates to previous page or #index in case when current page is start page.
         */
        goToBack: function() {
            this.initialized ? window.history.back() : this.navigate('index', true);
        }
    });

    // Used for desktop skins: Weborder, Retail, Directory
    App.Routers.DesktopMixing = {
        initProfilePanel: function() {
            var mainModel = App.Data.mainModel,
                customer = App.Data.customer,
                self = this;

            mainModel.set({
                profile_panel: {
                    modelName: 'Profile',
                    mod: 'Panel',
                    model: customer,
                    loginAction: login,
                    loginFbAction: login_facebook,
                    forceProfile: force_profile,
                    readTermsOfUse: readTermsOfUse,
                    signupAction: register,
                    resetAction: resetPWD,
                    resendAction: resendActivation,
                    logout_link: logout,
                    settings_link: new Function,
                    payments_link: profilePayments,
                    profile_link: profileEdit,
                    orders_link: pastOrders,
                    loyalty_link: loyaltyProgram,
                    my_promotions_link: myPromotions,
                    cacheId: true
                }
            });

            function readTermsOfUse() {
                var errors = App.Data.errors;

                errors.alert(_loc.PROFILE_TOU, false, false, {
                    isConfirm: true,
                    typeIcon: '',
                    confirm: {
                        ok: _loc.PROFILE_TOU_BTN_ACCEPT,
                        cancel: _loc.PROFILE_TOU_BTN_CANCEL
                    },
                    customClass: 'popup-full-height',
                    customView: new App.Views.ProfileView.ProfileTermsOfUseView({
                        className: 'profile-terms-of-use text-left',

                    }),
                    callback: function(res) {
                        customer.set('terms_accepted', res);
                        setTimeout(errors.set.bind(errors, 'customClass', errors.defaults.customClass), 0);
                    }
                });
            }

            function login() {
                showSpinner();
                customer.login()
                        .done(customer.trigger.bind(customer, 'hidePanel'))
                        .always(hideSpinner);
            }

            function login_facebook() {
                customer.FB_login(function(res) {
                    if (res.authResponse) {
                        var access_token = res.authResponse.accessToken;

                        showSpinner();
                        customer.loginFacebook(access_token)
                                .done(customer.trigger.bind(customer, 'hidePanel'))
                                .always(hideSpinner);
                    }
                });
            }

            function force_profile() {
                if (customer.isLocked()) {
                    profileEdit();
                }
            }

            function logout() {
                customer.trigger('hidePanel');
                customer.logout();
            }

            function register() {
                var check = customer.checkSignUpData();
                if (check.status == 'OK') {
                    showSpinner();
                    customer.signup()
                            .done(customer.trigger.bind(customer, 'hidePanel'))
                            .always(hideSpinner);
                } else {
                    App.Data.errors.alert(check.errorMsg);
                }
            }

            function resetPWD() {
                showSpinner();
                customer.resetPassword()
                        .done(customer.trigger.bind(customer, 'hidePanel'))
                        .always(hideSpinner);
            }

            function resendActivation() {
                showSpinner();
                customer.resendActivation().always(hideSpinner);
            }

            function profileEdit() {
                self.navigate('profile_edit', true);
                customer.trigger('hidePanel');
            }

            function myPromotions() {
                self.navigate('my_promotions', true);
            }

            function profilePayments() {
                self.navigate('profile_payments', true);
                customer.trigger('hidePanel');
            }

            function showSpinner() {
                mainModel.trigger('loadStarted');
            }

            function hideSpinner() {
                mainModel.trigger('loadCompleted');
            }

            function pastOrders() {
                self.navigate('past_orders', true);
                customer.trigger('hidePanel');
            }

            function loyaltyProgram() {
                self.navigate('loyalty_program', true);
                customer.trigger('hidePanel');
            }
        },
        setProfileEditContent: function() {
            this.profileEditData = this.profileEditData || {};

            var self = this,
                promises = this.getProfileAddressesPromises(),
                customer = App.Data.customer,
                addresses = customer.get('addresses'),
                updateBasicDetails = false,
                updatePassword = false,
                updateBtn = this.profileEditData.updateBtn || new Backbone.Model({disabled: true}),
                ui = this.profileEditData.ui || new Backbone.Model({show_response: false, show_attention: false}),
                updatedAddresses = this.profileEditData.updatedAddresses || new Backbone.Collection(),

                basicDetailsChanged = this.profileEditData.basicDetailsChanged || function() {
                    updateBasicDetails = true;
                    updateBtn.set('disabled', false);
                    ui.set('show_response', false);
                },

                accountPasswordChanged = this.profileEditData.accountPasswordChanged || function() {
                    updatePassword = Boolean(customer.get('password')) && Boolean(customer.get('confirm_password'));
                    updateBtn.set('disabled', updateBtn.get('disabled') && !updatePassword);
                    ui.set('show_response', false);
                },

                addressChanged = this.profileEditData.addressChanged || function(address) {
                    if (address.get('country')) { // country is the only required field
                        updatedAddresses.add(address);
                        updateBtn.set('disabled', false);
                        ui.set('show_response', false);
                    }
                },

                update = this.profileEditData.update || function() {
                    var mainModel = App.Data.mainModel,
                        requests = updateBasicDetails + updatePassword + !!updatedAddresses.length,
                        basicXHR, passwordXHR, addressXHRs = [], check_customer, errorFields = [],
                        error = App.Data.errors.alert.bind(App.Data.errors);

                    // show spinner
                    requests > 0 && mainModel.trigger('loadStarted');

                    // update basic details
                    if (updateBasicDetails) {
                        check_customer = customer.check();
                        if (check_customer.status === 'OK') {
                            basicXHR = customer.updateCustomer();
                            basicXHR.done(function() {
                                updateBasicDetails = false;
                            });
                            basicXHR.always(hideSpinner);
                        }
                        else if (check_customer.status === 'ERROR_EMPTY_FIELDS') {
                            if (App.Skins.WEBORDER == App.skin || App.Skins.WEBORDER_MOBILE == App.skin) {
                                errorFields.splice.apply(errorFields, [0, 0].concat(check_customer.errorList));
                            } else {
                                errorFields = errorFields.concat(check_customer.errorList);
                            }
                        }
                        if (errorFields.length) {
                            error(MSG.ERROR_EMPTY_NOT_VALID_DATA.replace(/%s/, errorFields.join(', '))); // user notification
                            hideSpinner();
                        }
                    }

                    // update password
                    if (updatePassword) {
                        passwordXHR = customer.changePassword();
                        passwordXHR.done(function() {
                            updatePassword = false;
                        });
                        passwordXHR.error(function(res) {
                            errorFields = res.responseText;
                        });
                        passwordXHR.always(hideSpinner);
                    }

                    // update address
                    if (updatedAddresses.length) {
                        updatedAddresses.each(function(addr) {
                            addressXHRs.push(addr.isProfileAddress() ? customer.updateAddress(addr.toJSON()) : customer.createAddress(addr));
                        });
                        Backbone.$.when.apply(Backbone.$, addressXHRs).done(function() {
                            updatedAddresses.reset();
                        });
                        Backbone.$.when.apply(Backbone.$, addressXHRs).always(hideSpinner);
                    }

                    // hide spinner once all requests are completed
                    function hideSpinner() {
                        if(--requests <= 0) {
                            mainModel.trigger('loadCompleted');
                            if (!errorFields.length) {
                                updateBtn.set('disabled', true);
                                ui.set('show_response', true);
                            }
                        }
                    }
                }

            if (_.isEmpty(this.profileEditData)) {
                this.profileEditData = {
                    updateBtn: updateBtn,
                    ui: ui,
                    updatedAddresses: updatedAddresses,
                    basicDetailsChanged: basicDetailsChanged,
                    accountPasswordChanged: accountPasswordChanged,
                    addressChanged: addressChanged,
                    update: update
                };
            }
            else {
                this.profileEditData.ui.set('show_response', false);
            }

            if (promises.length) {
                App.Data.mainModel.set({
                    content: {
                        modelName: 'Profile',
                        mod: 'Edit',
                        model: customer,
                        updateAction: update,
                        updateBtn: updateBtn,
                        ui: ui,
                        className: 'profile-edit'
                    }
                });

                window.setTimeout(function() {
                    var basicDetailsEvents = 'change:first_name change:last_name change:phone change:email change:email_notifications change:push_notifications',
                        passwordEvents = 'change:password change:confirm_password';
                    self.listenTo(customer, basicDetailsEvents, basicDetailsChanged);
                    self.listenTo(customer, passwordEvents, accountPasswordChanged);
                    self.listenTo(addresses, 'addressFieldsChanged', addressChanged);
                    self.listenTo(customer, 'onLogout', logout);
                    self.listenToOnce(self, 'route', self.stopListening.bind(self, customer, basicDetailsEvents, basicDetailsChanged));
                    self.listenToOnce(self, 'route', self.stopListening.bind(self, customer, passwordEvents, accountPasswordChanged));
                    self.listenToOnce(self, 'route', self.stopListening.bind(self, addresses, 'addressFieldsChanged', addressChanged));
                    self.listenToOnce(self, 'route', self.stopListening.bind(self, customer, 'onLogout', logout));
                }, 0);
            }

            return promises;

            function logout() {
                self.navigate('index', true);
            }
        },
        setProfilePaymentsContent: function() {
            var promises = this.getProfilePaymentsPromises(),
                customer = App.Data.customer,
                mainModel = App.Data.mainModel,
                self = this;

            preparatoryActions();

            if (promises.length) {
                App.Data.mainModel.set({
                    content: {
                        modelName: 'Profile',
                        mod: 'Payments',
                        model: customer,
                        changeToken: changeToken,
                        ui: new Backbone.Model({show_response: false}),
                        removeToken: removeToken,
                        unlinkGiftCard: unlinkGiftCard,
                        myorder: App.Data.myorder,
                        className: 'profile-edit'
                    }
                });

                window.setTimeout(function() {
                    self.listenTo(customer, 'onLogout', logout);
                }, 0);
            }

            return promises;

            function preparatoryActions() {
                if (customer.payments) {
                    customer.payments.trigger('resetModelsAttrs');
                }
            }

            function logout() {
                self.navigate('index', true);
            }

            function changeToken(token_id)
            {
                var req = customer.changePayment(token_id);

                if (req) {
                    mainModel.trigger('loadStarted');
                    req.always(mainModel.trigger.bind(mainModel, 'loadCompleted'));
                }

                return req;
            }

            function removeToken(token_id) {
                App.Data.errors.alert(_loc.PROFILE_CREDIT_CARD_REMOVE, false, true, {
                    isConfirm: true,
                    callback: function(confirmed) {
                        if (confirmed) {
                            var req = customer.removePayment(token_id);
                            if (req) {
                                mainModel.trigger('loadStarted');
                                req.always(mainModel.trigger.bind(mainModel, 'loadCompleted'));
                            }
                        }
                    }
                });
            }

            function unlinkGiftCard(giftCard) {
                App.Data.errors.alert(_loc.PROFILE_GIFT_CARD_REMOVE, false, true, {
                    isConfirm: true,
                    callback: function(confirmed) {
                        if (confirmed) {
                            var req = customer.unlinkGiftCard(giftCard);
                            if (req) {
                                mainModel.trigger('loadStarted');
                                req.always(mainModel.trigger.bind(mainModel, 'loadCompleted'));
                            }
                        }
                    }
                });
            }
        },
        setPastOrdersContent: function() {
            var customer = App.Data.customer,
                req = customer.ordersRequest,
                self = this;

            if (req) {
                App.Data.mainModel.set({
                    content: {
                        modelName: 'Profile',
                        mod: 'Orders',
                        model: customer,
                        collection: customer.orders,
                        className: 'profile-orders profile-edit'
                    }
                });

                window.setTimeout(function() {
                    self.listenTo(customer, 'onLogout', logout);
                }, 0);
            }

            return req;

            function logout() {
                self.navigate('index', true);
            }
        },
        setLoyaltyProgramContent: function() {
            var customer = App.Data.customer,
                mainModel = App.Data.mainModel,
                req = customer.get('rewardCards') && customer.rewardCardsRequest,
                self = this;

            if (req) {
                App.Data.mainModel.set({
                    content: {
                        modelName: 'Profile',
                        mod: 'RewardCardsEdition',
                        model: customer,
                        collection: customer.get('rewardCards'),
                        unlinkRewardCard: unlinkRewardCard,
                        linkRewardCard: linkRewardCard,
                        className: 'profile-edit'
                    }
                });

                window.setTimeout(function() {
                    self.listenTo(customer, 'onLogout', logout);
                    self.listenToOnce(self, 'route', self.stopListening.bind(self, customer, 'onLogout', logout));
                }, 0);
            }

            return req;

            function logout() {
                self.navigate('index', true);
            }

            function unlinkRewardCard(rewardCard) {
                App.Data.errors.alert(_loc.PROFILE_LOYALTY_NUMBER_REMOVE, false, true, {
                    isConfirm: true,
                    callback: function(confirmed) {
                        if (confirmed) {
                            var req = customer.unlinkRewardCard(rewardCard);
                            if (req) {
                                mainModel.trigger('loadStarted');
                                req.always(mainModel.trigger.bind(mainModel, 'loadCompleted'));
                            }
                        }
                    }
                });
            }

            function linkRewardCard(rewardCard) {
                var req = customer.linkRewardCard(rewardCard);

                self.listenToOnce(rewardCard, 'onLinkError', onError);

                if (req) {
                    mainModel.trigger('loadStarted');
                    req.done(function(data){
                        if (data && data.status == 'OK') {
                            App.Data.myorder.rewardsCard.selectRewardCard(rewardCard);
                        }
                    });
                    req.error(onError);
                    req.always(mainModel.trigger.bind(mainModel, 'loadCompleted'));
                    return req;
                }

                return req;

                function onError(errorMsg) {
                    if (errorMsg){
                        App.Data.errors.alert(errorMsg);
                    }
                }
            }
        }
    };

    // Used for mobile skins: Weborder Mobile, Directory Mobile
    App.Routers.MobileMixing = {
        initProfileMenu: function() {
            var self = this;

            App.Data.mainModel.set({
                profile: {
                    modelName: 'Profile',
                    mod: 'Menu',
                    model: App.Data.customer,
                    header: App.Data.header,
                    logout_link: logout,
                    login_link: login,
                    settings_link: profile_settings,
                    payments_link: profile_payments,
                    profile_link: profile_edit,
                    orders_link: pastOrders,
                    loyalty_link: loyaltyProgram,
                    my_promotions_link: myPromotions,
                    close_link: close,
                    cacheId: true
                }
            });

            function logout() {
                App.Data.customer.logout();
                self.navigate('login', true);
                close();
            }

            function login() {
                self.navigate('login', true);
                close();
            }

            function profile_edit() {
                self.navigate('profile_edit', true);
                close();
            }

            function profile_settings() {
                self.navigate('profile_settings', true);
                close();
            }

            function myPromotions() {
                self.navigate('my_promotions', true);
                close();
            }

            function profile_payments() {
                self.navigate('profile_payments', true);
                close();
            }

            function pastOrders() {
                self.navigate('past_orders', true);
                close();
            }

            function loyaltyProgram() {
                self.navigate('loyalty_program', true);
                close();
            }

            function close() {
                App.Data.header.set('showProfileMenu', false);
            }
        },
        loginContent: function() {
            var self = this,
                mainModel = App.Data.mainModel,
                customer = App.Data.customer;

            return {
                modelName: 'Profile',
                mod: 'LogIn',
                model: App.Data.customer,
                loginAction: loginAction,
                loginFbAction: loginFbAction,
                resendAction: resendActivation,
                createAccount: createAccountAction,
                guestCb: this.navigate.bind(this, 'index', true),
                forgotPasswordAction: this.navigate.bind(this, 'profile_forgot_password', true),
                cacheId: true
            };

            function loginAction() {
                mainModel.trigger('loadStarted');
                customer.login()
                        .done(self.navigate.bind(self, 'index', true))
                        .fail(mainModel.trigger.bind(mainModel, 'loadCompleted'));
            }

            function loginFbAction() {
                customer.FB_login(function(res) {
                    if (res.authResponse) {
                        var access_token = res.authResponse.accessToken;

                        mainModel.trigger('loadStarted');
                        customer.loginFacebook(access_token)
                                .done(self.navigate.bind(self, 'index', true))
                                .fail(mainModel.trigger.bind(mainModel, 'loadCompleted'));
                    }
                });
            }

            function resendActivation() {
                mainModel.trigger('loadStarted');
                customer.resendActivation()
                        .always(mainModel.trigger.bind(mainModel, 'loadCompleted'));
            }

            function createAccountAction() {
                customer.set('terms_accepted', false);
                self.navigate('signup', true);
            }
        },
        signupContent: function() {
            var events = 'change:first_name change:last_name change:email change:phone change:password change:confirm_password change:terms_accepted',
                customer = App.Data.customer
                self = this;

            // listen to any App.Data.customer change
            // to enable 'Next' link
            preValidateData();
            window.setTimeout(function() {
                self.listenTo(customer, events, preValidateData);
                self.listenToOnce(self, 'route', self.stopListening.bind(self, customer, events, preValidateData));
                self.listenToOnce(self, 'route', App.Data.header.set.bind(App.Data.header, 'enableLink', true));
            }, 0);

            return {
                modelName: 'Profile',
                mod: 'SignUp',
                model: customer,
                next: next,
                signupAction: next,
                readTermsOfUse: readTermsOfUse,
                back: this.navigate.bind(this, 'login', true),
                cacheId: true
            }

            function next() {
                var checkAttrs = customer.checkSignUpData(),
                    pwdsCompare = customer.comparePasswords();
                if (checkAttrs.status != 'OK') {
                    return App.Data.errors.alert(checkAttrs.errorMsg);
                }
                if (pwdsCompare.status != 'OK') {
                    return App.Data.errors.alert(pwdsCompare.errorMsg);
                }
                self.navigate('profile_create', true);
            }

            function readTermsOfUse() {
                self.navigate('terms', true);
            }

            function preValidateData() {
                var attrs = customer.toJSON(),
                    valid = attrs.first_name && attrs.last_name && attrs.email && attrs.phone && attrs.password && attrs.terms_accepted
                        && customer.comparePasswords().status == 'OK';
                App.Data.header.set('enableLink', valid);
            }
        },
        termsContent: function() {
            var customer = App.Data.customer,
                self = this;

            return {
                modelName: 'Profile',
                mod: 'TermsOfUse',
                model: customer,
                next: next,
                back: this.navigate.bind(this, 'signup', true),
                cacheId: true
            }

            function next() {
                customer.set('terms_accepted', true);
                self.navigate('signup', true);
            }
        },
        profileCreateContent: function() {
            var customer = App.Data.customer,
                mainModel = App.Data.mainModel,
                address = new App.Models.CustomerAddress();

            return {
                modelName: 'Profile',
                mod: 'Create',
                model: customer,
                register: register,
                address: address,
                createProfileAction: register,
                back: this.navigate.bind(this, 'signup', true)
            };

            function register() {
                var check = customer.checkSignUpData(),
                    _address = address.get('country') ? address.toJSON() : undefined; // only filled address can be passed
                if (check.status == 'OK') {
                    mainModel.trigger('loadStarted');
                    customer.signup(_address)
                            .done(self.navigate.bind(self, 'login', true))
                            // need to re-create alert due to hash change may close it
                            .done(App.Data.errors.alert.bind(App.Data.errors, _loc.PROFILE_USER_CREATED, false, undefined, undefined))
                            .always(mainModel.trigger.bind(mainModel, 'loadCompleted'));
                } else {
                    App.Data.errors.alert(check.errorMsg);
                }
            }
        },
        profileEditContent: function() {
            var promises = this.getProfileAddressesPromises(),
                customer = App.Data.customer,
                addresses = customer.get('addresses'),
                updatedAddresses = new Backbone.Collection(),
                mainModel = App.Data.mainModel,
                content = [],
                updateBasicDetails = false,
                updateAddress = false,
                self = this;

            App.Data.header.set({
                page_title: _loc.PROFILE_EDIT_TITLE,
                back_title: _loc.BACK,
                back: window.history.back.bind(window.history),
                link: update,
                link_title: _loc.SAVE,
                enableLink: false
            });

            content.push({
                modelName: 'Profile',
                mod: 'BasicDetails',
                model: customer,
                ui: new Backbone.Model({ show_attention: false }),
                applyChanges: update,
                className: 'profile-basic-details'
            }, {
                modelName: 'Profile',
                mod: 'Addresses',
                collection: addresses,
                applyChanges: update
            });

            window.setTimeout(function() {
                var basicDetailsEvents = 'change:first_name change:last_name change:phone change:email';
                self.listenTo(customer, basicDetailsEvents, basicDetailsChanged);
                self.listenTo(addresses, 'addressFieldsChanged', addressChanged);
                self.listenToOnce(self, 'route', self.stopListening.bind(self, customer, basicDetailsEvents, basicDetailsChanged));
                self.listenToOnce(self, 'route', self.stopListening.bind(self, addresses, 'addressFieldsChanged', addressChanged));
                self.listenToOnce(self, 'route', App.Data.header.set.bind(App.Data.header, 'enableLink', true));
            }, 0);

            function basicDetailsChanged() {
                updateBasicDetails = true;
                App.Data.header.set({enableLink: true});
            }

            function addressChanged(address) {
                if (address.get('country')) { // country is the only required field
                    updatedAddresses.add(address);
                    App.Data.header.set({enableLink: true});
                }
            }

            function update() {
                var mainModel = App.Data.mainModel,
                    requests = updateBasicDetails + !!updatedAddresses.length,
                    basicXHR, addressXHRs = [], check_customer, errorFields = [],
                    error = App.Data.errors.alert.bind(App.Data.errors);

                // show spinner
                requests > 0 && mainModel.trigger('loadStarted');

                // update basic details
                if (updateBasicDetails) {
                    check_customer = customer.check();
                    if (check_customer.status === 'OK') {
                        basicXHR = customer.updateCustomer();
                        basicXHR.done(function() {
                            updateBasicDetails = false;
                        });
                        basicXHR.always(hideSpinner);
                    }
                    else if (check_customer.status === 'ERROR_EMPTY_FIELDS') {
                        if (App.Skins.WEBORDER == App.skin || App.Skins.WEBORDER_MOBILE == App.skin) {
                            errorFields.splice.apply(errorFields, [0, 0].concat(check_customer.errorList));
                        } else {
                            errorFields = errorFields.concat(check_customer.errorList);
                        }
                    }
                    if (errorFields.length) {
                        error(MSG.ERROR_EMPTY_NOT_VALID_DATA.replace(/%s/, errorFields.join(', '))); // user notification
                        hideSpinner();
                    }
                }

                // update address
                if (updatedAddresses.length) {
                    updatedAddresses.each(function(addr) {
                        addressXHRs.push(addr.isProfileAddress() ? customer.updateAddress(addr.toJSON()) : customer.createAddress(addr));
                    });
                    Backbone.$.when.apply(Backbone.$, addressXHRs).done(function() {
                        updatedAddresses.reset();
                    });
                    Backbone.$.when.apply(Backbone.$, addressXHRs).always(hideSpinner);
                }

                // hide spinner once all requests are completed
                function hideSpinner() {
                    if(--requests <= 0) {
                        App.Data.header.set({enableLink: false});
                        mainModel.trigger('loadCompleted');
                    }
                }
            }

            return {
                content: content,
                promises: promises
            }
        },
        profileSettingsContent: function() {
            var customer = App.Data.customer,
                email_notifications_saved = false,
                push_notifications_saved = false,
                updatePassword = false,
                updateNotifications = false,
                self = this,
                content = [];

            App.Data.header.set({
                page_title: _loc.SETTINGS,
                back_title: _loc.BACK,
                back: this.goToBack.bind(this),
                link: save,
                link_title: _loc.SAVE
            });

            // listen to any App.Data.customer change
            // to enable 'Save' link
            prepareInitialData();
            accountPasswordChanged();
            window.setTimeout(function() {
                var passwordEvents = 'change:password change:confirm_password',
                    notificationEvents = 'change:email_notifications change:push_notifications';

                self.listenTo(customer, passwordEvents, accountPasswordChanged);
                self.listenTo(customer, notificationEvents, accountNotificationsChanged);
                self.listenToOnce(self, 'route', self.stopListening.bind(self, customer, passwordEvents, accountPasswordChanged));
                self.listenToOnce(self, 'route', self.stopListening.bind(self, customer, notificationEvents, accountNotificationsChanged));
                self.listenToOnce(self, 'route', App.Data.header.set.bind(App.Data.header, 'enableLink', true));
            }, 0);

            content.push({
                modelName: 'Profile',
                mod: 'AccountPassword',
                model: customer,
                changeAction: save,
                cacheId: true
            }, {
                modelName: 'Profile',
                mod: 'AccountNotifications',
                model: customer,
                changeAction: save,
                cacheId: true
            }, {
                modelName: 'Profile',
                mod: 'OwnerContacts',
                className: 'profile-owner-info',
                cacheId: true
            });

            return content;

            function prepareInitialData() {
                email_notifications_saved = customer.get('email_notifications');
                push_notifications_saved = customer.get('push_notifications');
            }

            function accountPasswordChanged() {
                var attrs = customer.toJSON();
                updatePassword = Boolean(attrs.password) && Boolean(attrs.confirm_password);
                App.Data.header.set('enableLink', updatePassword);
            }

            function accountNotificationsChanged() {
                var email_notifications_check = customer.get('email_notifications') !== email_notifications_saved,
                    push_notifications_check = customer.get('push_notifications') !== push_notifications_saved;

                updateNotifications = email_notifications_check || push_notifications_check;

                App.Data.header.set('enableLink', updateNotifications);
            }

            function save() {
                var mainModel = App.Data.mainModel,
                    req;

                // Update password
                if (updatePassword) {
                    mainModel.trigger('loadStarted');
                    req = customer.changePassword();

                    req.done(function() {
                        updatePassword = false;
                        App.Data.header.set('enableLink', updatePassword);
                        App.Data.errors.alert(_loc.PROFILE_PASSWORD_CHANGED);
                    });

                    req.always(function() {
                        mainModel.trigger('loadCompleted');
                    });
                }

                // Update notifications options
                if (updateNotifications) {
                    mainModel.trigger('loadStarted');
                    req = customer.updateCustomer();

                    req.done(function() {
                        prepareInitialData();
                        updateNotifications = false;
                        App.Data.header.set('enableLink', updateNotifications);
                        App.Data.errors.alert(_loc.PROFILE_NOTIFICATIONS_CHANGED);
                    });

                    req.always(function() {
                        mainModel.trigger('loadCompleted');
                    });
                }
            }
        },
        profileForgotPasswordContent: function() {
            var customer = App.Data.customer,
                self = this;

            App.Data.header.set({
                page_title: _loc.PROFILE_FORGOT_PASSWORD,
                back_title: _loc.BACK,
                back: this.navigate.bind(this, 'login', true),
                link: reset,
                link_title: _loc.RESET
            });

            // listen to any App.Data.customer change
            // to enable 'Reset' link
            preValidateData();
            window.setTimeout(function() {
                self.listenTo(customer, 'change:email', preValidateData);
                self.listenToOnce(self, 'route', self.stopListening.bind(self, customer, 'change:email', preValidateData));
                self.listenToOnce(self, 'route', App.Data.header.set.bind(App.Data.header, 'enableLink', true));
            }, 0);

            return {
                modelName: 'Profile',
                mod: 'PWDReset',
                model: App.Data.customer,
                resetAction: reset,
                cacheId: true
            };

            function preValidateData() {
                App.Data.header.set('enableLink', Boolean(customer.get('email')));
            }

            function reset() {
                var mainModel = App.Data.mainModel;
                mainModel.trigger('loadStarted');
                customer.resetPassword()
                        .always(mainModel.trigger.bind(mainModel, 'loadCompleted'));
            }
        },
        setProfilePaymentsContent: function() {
            var customer = App.Data.customer,
                promises = this.getProfilePaymentsPromises(),
                mainModel = App.Data.mainModel,
                self=this, content = [];

            preparatoryActions();

            content.push({
                modelName: 'Profile',
                mod: 'Payments',
                model: customer,
                changeToken: changeToken,
                ui: new Backbone.Model({show_response: false}),
                removeToken: removeToken,
                unlinkGiftCard: unlinkGiftCard,
                className: 'profile-edit text-center',
                myorder: App.Data.myorder
            });

            App.Data.header.set({
                page_title: _loc.PAYMENT_METHODS,
                back_title: _loc.BACK,
                back: window.history.back.bind(window.history),
                link: save,
                link_title: _loc.SAVE,
                enableLink: false
            });

            // to enable 'Save' link
            preValidateData();
            window.setTimeout(function() {
                self.listenTo(customer, 'change_cards', preValidateData);
                self.listenToOnce(self, 'route', self.stopListening.bind(self, customer, 'change_cards', preValidateData));
                self.listenToOnce(self, 'route', App.Data.header.set.bind(App.Data.header, 'enableLink', true));
            }, 0);

            return {
                content: content,
                promises: promises
            };

            function preparatoryActions() {
                if (customer.payments) {
                    customer.payments.trigger('resetModelsAttrs');
                }
            }

            function preValidateData(data) {
                App.Data.header.set('enableLink', data ? data.status == 'OK' : false);
            }

            function save() {
                customer.trigger('payments_save_cards');
            }

            function changeToken(token_id)
            {
                var req = customer.changePayment(token_id),
                    mainModel = App.Data.mainModel;

                if (req) {
                    mainModel.trigger('loadStarted');
                    req.always(mainModel.trigger.bind(mainModel, 'loadCompleted'));
                }

                return req;
            }
            function removeToken(token_id) {
                App.Data.errors.alert(_loc.PROFILE_CREDIT_CARD_REMOVE, false, true, {
                    isConfirm: true,
                    callback: function(confirmed) {
                        if (confirmed) {
                            var req = customer.removePayment(token_id);
                            if (req) {
                                mainModel.trigger('loadStarted');
                                req.always(mainModel.trigger.bind(mainModel, 'loadCompleted'));
                            }
                        }
                    }
                });
            }

            function unlinkGiftCard(giftCard) {
                App.Data.errors.alert(_loc.PROFILE_GIFT_CARD_REMOVE, false, true, {
                    isConfirm: true,
                    callback: function(confirmed) {
                        if (confirmed) {
                            var req = customer.unlinkGiftCard(giftCard);
                            if (req) {
                                mainModel.trigger('loadStarted');
                                req.always(mainModel.trigger.bind(mainModel, 'loadCompleted'));
                            }
                        }
                    }
                });
            }
        },
        setPastOrdersContent: function() {
            var customer = App.Data.customer,
                req = customer.ordersRequest,
                content;

            if (req) {
                App.Data.header.set({
                    page_title: _loc.PROFILE_PAST_ORDERS,
                    back_title: _loc.BACK,
                    back: this.goToBack.bind(this)
                });

                content = {
                    modelName: 'Profile',
                    mod: 'Orders',
                    model: customer,
                    collection: customer.orders,
                    className: 'profile-orders',
                    cacheId: true
                };
            }

            return {
                req: req,
                content: content
            };
        },
        setLoyaltyProgramContent: function() {
            var customer = App.Data.customer,
                mainModel = App.Data.mainModel,
                header = App.Data.header,
                req = customer.get('rewardCards') && customer.rewardCardsRequest,
                self = this,
                rewardCard = null, // changes every time when user change new reward card in view
                rewardCards,
                content;

            if (req) {
                rewardCards = customer.get('rewardCards');

                header.set({
                    page_title: _loc.PROFILE_LOYALTY_PROGRAM,
                    back_title: _loc.BACK,
                    back: this.goToBack.bind(this),
                    link: linkRewardCard,
                    link_title: _loc.SAVE,
                    enableLink: false
                });

                content = {
                    modelName: 'Profile',
                    mod: 'RewardCardsEdition',
                    model: customer,
                    collection: rewardCards,
                    unlinkRewardCard: unlinkRewardCard,
                    onRewardCardChanged: onRewardCardChanged,
                    className: 'profile-edit text-center',
                    cacheId: true
                };

                // enable header's link once user leaves a current page
                window.setTimeout(function() {
                    self.listenTo(customer, 'onLogout', logout);
                    self.listenToOnce(self, 'route', header.set.bind(header, 'enableLink', true));
                    self.listenToOnce(self, 'route', self.stopListening.bind(self, customer, 'onLogout', logout));
                }, 0);
            }

            return {
                req: req,
                content: content
            };

            function logout() {
                self.navigate('index', true);
            }

            // `newRewardCard` is new RewardCard model created in view.
            function onRewardCardChanged(newRewardCard) {
                if (newRewardCard.check().status == 'OK') {
                    header.set('enableLink', true);
                    rewardCard = newRewardCard.clone();
                } else {
                    header.set('enableLink', false);
                    rewardCard = null;
                }
            }

            function unlinkRewardCard(rewardCard) {
                App.Data.errors.alert(_loc.PROFILE_LOYALTY_NUMBER_REMOVE, false, true, {
                    isConfirm: true,
                    callback: function(confirmed) {
                        if (confirmed) {
                            var req = customer.unlinkRewardCard(rewardCard);
                            if (req) {
                                mainModel.trigger('loadStarted');
                                req.always(mainModel.trigger.bind(mainModel, 'loadCompleted'));
                            }
                        }
                    }
                });
            }

            function linkRewardCard() {
                if (!rewardCard) {
                    return;
                }

                var req = customer.linkRewardCard(rewardCard);

                self.listenToOnce(rewardCard, 'onLinkError', onError);

                if (req) {
                    mainModel.trigger('loadStarted');
                    req.done(function(data){
                        if (data && data.status == 'OK') {
                            App.Data.myorder.rewardsCard.selectRewardCard(rewardCard);
                            header.set('enableLink', false);
                        }
                    });
                    req.error(onError);
                    req.always(mainModel.trigger.bind(mainModel, 'loadCompleted'));
                    return req;
                }

                return req;

                function onError(errorMsg) {
                    if (errorMsg){
                        App.Data.errors.alert(errorMsg);
                    }
                }
            }
        }
    };

    App.Routers.MobileRouter = App.Routers.MainRouter.extend({
        change_page: function() {
            App.Routers.MainRouter.prototype.change_page.apply(this, arguments);
            if (cssua.ua.revelsystemswebview && cssua.ua.ios) {
                $("body")[0].scrollIntoView(); //workaround for #18586, #18130
            }
            if (App.Data.map && location.hash.slice(1) == 'map') { // #19928 to resize the Google Maps
                App.Data.map.trigger("change_page");
            }
        }
    });

    /**
     * App.Routers.RevelOrderingRouter class
     * Extend App.Routers.MobileRouter
     * Implement functionality of order placing for all payment processors supported by Revel.
     *
     * This is parent router for Weborder, Weborder Mobile, Retail apps.
     */
    App.Routers.RevelOrderingRouter = App.Routers.MobileRouter.extend({
        payHandlerCompleteHash : 'confirm',
        triggerInitializedEvent: function() {
            var myorder = App.Data.myorder;

            // init App.Data.customer
            this.initCustomer();

            // Restore App.Data.myorder.paymentResponse if exists in session storage.
            myorder.restorePaymentResponse(this.getUID());

            // init payment response handler,
            // set navigation to #confirm as callback parameter
            this.initPaymentResponseHandler(this.onPayHandler.bind(this));

            // If a payment transaction is in process need to save any changes of cart to a session storage.
            // If user clears the cart the payment transaction record should be removed.
            // Bug #21653
            this.listenTo(myorder, 'remove change add', function() {
                if(!PaymentProcessor.isTransactionInProcess()) {
                    return;
                }
                if(!myorder.get_only_product_quantity()) {
                    PaymentProcessor.completeTransaction();
                } else {
                    myorder.saveOrders();
                }
            });

            // If payment transaction is in process need restore models at first.
            if(PaymentProcessor.isTransactionInProcess()) {
                this.loadData().then(fireInitializedEvent.bind(this));
            } else {
                fireInitializedEvent.call(this);
            }

            function fireInitializedEvent() {
                // Need to redirect on #login screen if the app starts with #index or without hash
                if (!App.Data.customer.isAuthorized() && App.Data.settings.isMobileVersion()
                    && ['', '#index'].indexOf(location.hash) > -1) {
                    this.updateState(true, '#login');
                }
                if (App.Data.selectEstablishmentMode) {
                    this.updateState(true, '#establishment');
                }
                // emit 'initialized' event
                this.trigger('initialized');
                this.initialized = true;
            }
        },
        onPayHandler: function(capturePhase, myorderClone) {
            this.recentOrder = myorderClone;
            this.navigate(this.payHandlerCompleteHash,  {
                trigger: true,
                replace: capturePhase
            });
        },
        /**
         * Implement removing of payment transaction record in a session storage
         * when user changes establishment.
         */
        resetEstablishmentData: function() {
            PaymentProcessor.completeTransaction();
            return App.Routers.MobileRouter.prototype.resetEstablishmentData.apply(this, arguments);
        },
        /**
         * Save paymentResponse before app close.
         *
         * Use case:
         * 1) User has made payment via Credit Card (usaepay) and #confirm screen displays now.
         * 2) Click on 'Back' button in browser toolbar (history.back()).
         * 3) Now #checkout screen displays and app has reinitialized because CC payment uses redirection on 3rd party site.
         * 4) Click on 'Forward' button in browser toolbar (history.forward())
         * 5) Now #confirm screen displays and app has reinitialized again. App.Data.myorder.paymentResponse is null after app init.
         *    Need restore it from sessionStorage to correctly display payment information.
         *    To be able to do it need save App.Data.myorder.paymentResponse in sessionStorage before app unloading.
         */
        beforeUnloadApp: function() {
            App.Data.myorder.savePaymentResponse(this.getUID());
            App.Routers.MobileRouter.prototype.beforeUnloadApp.apply(this, arguments);
        },
        paymentsHandlers: function() {
            var mainModel = App.Data.mainModel,
                myorder = App.Data.myorder,
                paymentCanceled = false;

            this.listenTo(myorder, 'cancelPayment', function() {
                paymentCanceled = true;
            });

            this.listenTo(myorder, "paymentFailed", function(message) {
                mainModel.trigger('loadCompleted');
                message && App.Data.errors.alert(message); // user notification
            }, this);

            // invokes when user chooses the 'Credit Card' payment processor on the #payments screen
            this.listenTo(App.Data.paymentMethods, 'payWithCreditCard', function() {
                var customer = App.Data.customer,
                    paymentProcessor = App.Data.settings.get_payment_process(),
                    doPayWithToken = customer.doPayWithToken();
                myorder.check_order({
                    order: true,
                    tip: true,
                    customer: true,
                    checkout: true,
                    card_billing_address: PaymentProcessor.isBillingAddressCard() && !doPayWithToken,
                    card: doPayWithToken ? false : paymentProcessor.credit_card_dialog
                }, sendRequest.bind(window, PAYMENT_TYPE.CREDIT));
            }, this);

            /* Gift Card */
            this.initGiftCard();

            // invokes when user chooses the 'Gift Card' payment processor on the #payments screen
            this.listenTo(App.Data.paymentMethods, 'payWithGiftCard', function() {
                var customer = App.Data.customer,
                    doPayWithGiftCard = customer.doPayWithGiftCard();
                myorder.check_order({
                    giftcard: !doPayWithGiftCard,
                    order: true,
                    tip: true,
                    customer: true,
                    checkout: true
                }, function() {
                    if (customer.isAuthorized() && !doPayWithGiftCard) {
                        customer.linkGiftCard(App.Data.giftcard).done(function(data) {
                            if (_.isObject(data) && data.status == 'OK') {
                                customer.giftCards.ignoreSelected = false;
                                sendRequest(PAYMENT_TYPE.GIFT);
                            }
                        }).fail(function() {
                            App.Data.errors.alert(MSG.ERROR_CAN_NOT_LINK_CARD_TO_PROFILE, true);
                        });
                    } else {
                        sendRequest(PAYMENT_TYPE.GIFT);
                    }
                });
            }, this);

            /* Cash Card */
            // invokes when user chooses the 'Cash' payment processor on the #payments screen
            this.listenTo(App.Data.paymentMethods, 'payWithCash', function() {
                myorder.check_order({
                    order: true,
                    tip: true,
                    customer: true,
                    checkout: true,
                }, sendRequest.bind(window, PAYMENT_TYPE.NO_PAYMENT));
            }, this);

            /* PayPal */
            // invokes when user chooses the 'PayPal' payment processor on the #payments screen
            this.listenTo(App.Data.paymentMethods, 'payWithPayPal', function() {
                App.Data.myorder.check_order({
                    order: true,
                    tip: true,
                    customer: true,
                    checkout: true,
                }, sendRequest.bind(window, PAYMENT_TYPE.PAYPAL));
            }, this);

            /* Stanford Card */
            if(_.isObject(App.Settings.payment_processor) && App.Settings.payment_processor.stanford) {
                // init Stanford Card model if it's turned on
                App.Data.stanfordCard = new App.Models.StanfordCard();

                // invokes when user chooses the 'Stanford Card' payment processor
                this.listenTo(App.Data.paymentMethods, 'payWithStanfordCard', function() {
                    myorder.check_order({
                        order: true,
                        tip: true,
                        customer: true,
                        checkout: true,
                    }, sendRequest.bind(window, PAYMENT_TYPE.STANFORD));
                }, this);
            }

            function sendRequest(paymentType) {
                saveAllData();
                mainModel.trigger('loadStarted');
                myorder.create_order_and_pay(paymentType);
                paymentCanceled && mainModel.trigger('loadCompleted');
                paymentCanceled = false;
            }
        },
        onInitialized: function() {
            // get a stores list
            this.listenTo(this, 'needLoadEstablishments', this.getEstablishments, this);

            // reset establishments data
            this.listenToOnce(App.Data.establishments, 'resetEstablishmentData', this.resetEstablishmentData, this);

            // init payments handlers
            !App.Data.settings.get('isMaintenance') && this.paymentsHandlers();

            // listen to navigation control
            this.navigationControl();

            // run history tracking
            this.triggerInitializedEvent();
        },
        reorder: function(order_id) {
            var customer = App.Data.customer,
                orders = customer.orders,
                dfd = Backbone.$.Deferred(),
                errors = App.Data.errors,
                reorder;

            if (customer.isAuthorized()) {
                reorder = customer.reorder(order_id);
                reorder.always(dfd.resolve.bind(dfd));
                reorder.fail(function() {
                    errors.alert(_loc.PROFILE_ORDER_NOT_FOUND.replace(/%s/, order_id));
                });
            } else {
                errors.alert(_loc.PROFILE_PLEASE_LOG_IN);
                dfd.resolve();
            }

            return dfd;
        }
    });


    /**
     * Router Module class
     */
    function RouterModule() {
        this.args = arguments;
    }

    RouterModule.prototype.initRouter = function() {
        Array.prototype.forEach.call(this.args, function(cb) {
            typeof cb == 'function' && cb();
        });
    };

    return RouterModule;
});
