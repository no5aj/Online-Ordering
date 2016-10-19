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

define(["main_router"], function(main_router) {
    'use strict';

    var headers = {},
        carts = {};

    /**
     * Default router data.
     */
    function defaultRouterData() {
        headers.main = {mod: 'Main', className: 'main'};
        carts.main = {mod: 'Main', className: 'main'};
        carts.checkout = {mod: 'Checkout', className: 'checkout'};
        carts.confirm = {mod: 'Confirmation', className: 'confirm'};
    }

    var Router = App.Routers.RevelOrderingRouter.extend({
        routes: {
            "": "index",
            "index": "index",
            "about": "about",
            "map": "map",
            "checkout(/:order_id)": "checkout",
            "pay": "pay",
            "confirm": "confirm",
            "maintenance": "maintenance",
            "profile_edit": "profile_edit",
            "profile_payments": "profile_payments",
            "past_orders": "past_orders",
            "loyalty_program": "loyalty_program",
            "establishment": "establishment",
            "*other": "index"
        },
        hashForGoogleMaps: ['map', 'checkout'],//for #index we start preload api after main screen reached
        use_google_captcha: true, //force to load google captcha library on startup
        initialize: function() {
            App.Data.get_parameters = parse_get_params(); // get GET-parameters from address line
            this.bodyElement = Backbone.$('body');
            this.bodyElement.append('<div class="main-container"></div>');
            _.isObject(cssua.userAgent) && cssua.userAgent.mobile && this.bodyElement.addClass('mobile');

            // set locked routes if online orders are disabled
            if(!App.Settings.online_orders) {
                this.lockedRoutes = ['checkout', 'pay', 'confirm'];
            }

            // load main, header, footer necessary files
            this.prepare('main', function() {
                App.Views.Generator.enableCache = true;
                // set header, cart, main, categories, search, paymentMethods models
                App.Data.header = new App.Models.HeaderModel();
                App.Data.categories = new App.Collections.Categories();
                App.Data.parentCategories = new App.Collections.SubCategories();
                App.Data.search = new App.Collections.Search();
                App.Data.paymentMethods = new App.Models.PaymentMethods(App.Data.settings.get_payment_process());

                var mainModel = App.Data.mainModel = new App.Models.MainModel({
                    acceptableCCTypes: ACCEPTABLE_CREDIT_CARD_TYPES,
                    clientName: window.location.origin.match(/\/\/([a-zA-Z0-9-_]*)\.?/)[1],
                    headerModel: App.Data.header,
                    cartCollection: App.Data.myorder,
                    paymentMethods: App.Data.paymentMethods
                });

                App.Data.paymentMethods.set('acceptableCCTypes', ACCEPTABLE_CREDIT_CARD_TYPES);

                mainModel.set('model', mainModel);

                // set clientName
                App.Data.establishments.getModelForView().set('clientName', mainModel.get('clientName'));

                // track main UI change
                this.listenTo(mainModel, 'change:mod', this.createMainView);

                this.onInitialized();
            });

            var checkout = App.Data.myorder.checkout;
                checkout.trigger("change:dining_option", checkout, checkout.get("dining_option"));

            App.Routers.RevelOrderingRouter.prototype.initialize.apply(this, arguments);
        },
        initCustomer: function() {
            App.Routers.RevelOrderingRouter.prototype.initCustomer.apply(this, arguments);

            var mainModel = App.Data.mainModel,
                customer = App.Data.customer;

            // Once the customer is initialized need to add it to App.Data.mainModel attributes
            App.Data.mainModel.set({customer: customer});

            // Once the customer is initialized need to set profile panel
            this.initProfilePanel();

            // 'onReorder' event emits when user click on 'Reorder' button
            this.listenTo(customer, 'onReorder', function(order_id) {
                this.navigate('checkout/' + order_id, true);
            });
        },
        /**
         * Change page.
         */
        change_page: function(callback) {
            (callback instanceof Function && App.Data.establishments.length > 1) ? callback() : App.Data.mainModel.set('needShowStoreChoice', false);
            App.Routers.RevelOrderingRouter.prototype.change_page.apply(this, arguments);
        },
        createMainView: function() {
            var data = App.Data.mainModel.toJSON(),
                cacheId = data.mod === 'Main' || data.mod === 'Profile' ? data.mod : false,
                mainView = App.Views.GeneratorView.create('Main', data, cacheId),
                container = Backbone.$('body > div.main-container');

            this.mainView && this.mainView.removeFromDOMTree() || container.empty();
            container.append(mainView.el);
            this.mainView = mainView;
        },
        navigationControl: function() {
            // onCheckoutClick event occurs when 'checkout' button is clicked
            this.listenTo(App.Data.myorder, 'onCheckoutClick', this.navigate.bind(this, 'checkout', true));

            var askStanfordStudent = {
                pending: false,
                proceed: null
            };

            function completeAsking() {
                askStanfordStudent.pending = false;
                askStanfordStudent.proceed = null;
                App.Data.mainModel.unset('popup');
            }

            // onPay event occurs when 'Pay' button is clicked
            this.listenTo(App.Data.myorder, 'onPay', function(cb) {
                var stanfordCard = App.Data.stanfordCard;

                // need to check if Stanford Card is turned on and ask a customer about student status
                if(stanfordCard && stanfordCard.get('needToAskStudentStatus') && !App.Data.myorder.checkout.isDiningOptionOnline()) {
                    askStanfordStudent.pending = true;
                    askStanfordStudent.proceed = cb;
                    App.Data.mainModel.set('popup', {
                        modelName: 'StanfordCard',
                        mod: 'StudentStatus',
                        model: stanfordCard,
                        className: 'stanford-student-status'
                    });
                } else {
                    cb();
                }
            });

            // onNotStudent event occurs when a customer answers 'No' on student status question.
            App.Data.stanfordCard && this.listenTo(App.Data.stanfordCard, 'onNotStudent', function() {
                askStanfordStudent.pending && typeof askStanfordStudent.proceed == 'function' && askStanfordStudent.proceed();
                completeAsking();
            });

            // onCancelStudentVerification event occurs when a customer cancels student verification.
            App.Data.stanfordCard && this.listenTo(App.Data.stanfordCard, 'onCancelStudentVerification', completeAsking);

            // onStudent event occurs when a customer answers 'Yes' on student status question.
            App.Data.stanfordCard && this.listenTo(App.Data.stanfordCard, 'onStudent', function() {
                App.Data.mainModel.set('popup', {
                    modelName: 'StanfordCard',
                    mod: 'Popup',
                    model: App.Data.stanfordCard,
                    myorder: App.Data.myorder,
                    className: 'stanford-student-card text-left'
                });
            });

            // 'change:validated' event occurs after Stanford Card validation on backend.
            App.Data.stanfordCard && this.listenTo(App.Data.stanfordCard, 'change:validated', function() {
                // if askStanfordStudent.pending is waiting for stanfordCard resolution need to invoke it.
                askStanfordStudent.pending && typeof askStanfordStudent.proceed == 'function' && askStanfordStudent.proceed();
                completeAsking();
            });

            // showSpinner event
            this.listenTo(App.Data.myorder, 'showSpinner', function() {
                App.Data.mainModel.trigger('loadStarted');
            });

            // hideSpinner event
            this.listenTo(App.Data.myorder, 'hideSpinner', function() {
                App.Data.mainModel.trigger('loadCompleted');
            });

            // onMenu event occurs when 'Menu' tab is clicked
            this.listenTo(App.Data.header, 'onMenu', this.navigate.bind(this, 'index', true));

            // onMenu event occurs when 'Return to Menu'
            this.listenTo(App.Data.mainModel, 'onMenu', this.navigate.bind(this, 'index', true));

            // onMenu event occurs when 'Return to Checkout'
            this.listenTo(App.Data.mainModel, 'onCheckout', this.navigate.bind(this, 'checkout', true));

            // onAbout event occurs when 'About' tab is clicked
            this.listenTo(App.Data.header, 'onAbout', this.navigate.bind(this, 'about', true));

            // onMap event occurs when 'Map' tab is clicked
            this.listenTo(App.Data.header, 'onMap', this.navigate.bind(this, 'map', true));

            // onPromotions event occurs when 'See all Promotions' link is clicked
            this.listenTo(App.Data.header, 'onPromotions', function() {
                var promotions = App.Data.promotions,
                    items,
                    self = this;

                App.Data.mainModel.trigger('loadStarted');

                if (!promotions) { // promotions are not initialized if App.Settings.has_campaigns == true
                    this.prepare('promotions', function() {
                        promotions = self.initPromotions();
                        openPromotions();
                    });
                }

                else {
                    openPromotions();
                }

                function openPromotions() {
                    promotions.fetching.always(function() {
                        App.Data.mainModel.trigger('loadCompleted');

                        if (promotions.needToUpdate) {
                            App.Data.mainModel.trigger('loadStarted');

                            // get the order items for submitting to server
                            items = App.Data.myorder.map(function(order) {
                                return order.item_submit();
                            });

                            promotions
                                .update(items, App.Data.myorder.checkout.get('discount_code'), App.Data.customer.getAuthorizationHeader())
                                .always(App.Data.mainModel.trigger.bind(App.Data.mainModel, 'loadCompleted'));
                        }

                        App.Data.mainModel.set('popup', {
                            modelName: 'Promotions',
                            mod: 'List',
                            collection: promotions
                        });
                    });
                }
            });

            //onBack event occurs when 'Back' buttons is clicked
            this.listenTo(App.Data.header, 'onBack', function() {
                switch (App.Data.header.get('tab_index')) {
                    case 1:
                        this.navigate('about', true);
                        break;
                    case 2:
                        this.navigate('map', true);
                        break;
                    default:
                        this.navigate('index', true);
                }
            }, this);

            // onRedemptionApplied event occurs when 'Apply Reward' btn is clicked
            this.listenTo(App.Data.myorder.rewardsCard, 'onRedemptionApplied', function() {
                App.Data.mainModel.trigger('loadStarted');
                App.Data.myorder.get_cart_totals().always(function() {
                    App.Data.mainModel.unset('popup');
                    App.Data.mainModel.trigger('loadCompleted');
                });
            });

            // onRewardsErrors event occurs when /weborders/rewards/ request fails
            this.listenTo(App.Data.myorder.rewardsCard, 'onRewardsErrors', function(errorMsg) {
                App.Data.errors.alert(errorMsg);
                App.Data.mainModel.trigger('loadCompleted');
            });

            // onRewardsReceived event occurs when Rewards Card data is received from server
            this.listenTo(App.Data.myorder.rewardsCard, 'onRewardsReceived', function() {
                var rewardsCard = App.Data.myorder.rewardsCard;

                if (!rewardsCard.get('rewards').length) {
                    App.Data.errors.alert(MSG.NO_REWARDS_AVAILABLE);
                } else {
                    var clone = rewardsCard.clone();

                    App.Data.mainModel.set('popup', {
                        modelName: 'Rewards',
                        mod: 'Info',
                        model: clone,
                        className: 'rewards-info text-left',
                        collection: App.Data.myorder,
                        balance: clone.get('balance'),
                        rewards: clone.get('rewards'),
                        discounts: clone.get('discounts')
                    });
                }

                App.Data.mainModel.trigger('loadCompleted');
            });

            // onApplyRewardsCard event occurs when Rewards Card's 'Apply' button is clicked on #checkout page
            this.listenTo(App.Data.myorder.rewardsCard, 'onApplyRewardsCard', function() {
                var rewardsCard = App.Data.myorder.rewardsCard,
                    customer = App.Data.customer;
                if (!rewardsCard.get('number') && customer.isAuthorized() && customer.get('rewardCards').length) {
                    rewardsCard.set('number', customer.get('rewardCards').at(0).get('number'));
                }
                rewardsCard.set('captchaValue', ''); // reset Captcha key
                App.Data.mainModel.set('popup', {
                    modelName: 'Rewards',
                    mod: 'Card',
                    model: rewardsCard,
                    customer: customer,
                    className: 'rewards-info text-left',
                    cache_id: true
                });
            });

           // onGetRewards event occurs when Rewards Card's 'Submit' button is clicked on 'Rewards Card Info' popup
            this.listenTo(App.Data.myorder.rewardsCard, 'onGetRewards', function() {
                App.Data.mainModel.trigger('loadStarted');
                App.Data.myorder.rewardsCard.getRewards();
            });

            // onResetData events occurs when user resets reward card
            this.listenTo(App.Data.myorder.rewardsCard, 'onResetData', function() {
                App.Data.myorder.get_cart_totals();
            });
        },
        /**
         * Enable browser history for navigation through categories, subcategories and search screens.
         */
        runStateTracking: function() {
            if (!App.Routers.RevelOrderingRouter.prototype.runStateTracking.apply(this, arguments)) {
                return;
            }

            var categories = App.Data.categories,
                search = App.Data.search,
                // handle case when subcategory is selected at the first time
                // (it happens when categories are loaded)
                subCategoryIsNotSelected = true;

            // add entry to browser history on category or subcategory change
            this.listenTo(categories, 'change:selected change:parent_selected', function() {
                App.Data.search.clearLastPattern();
                updateState.call(this, categories, subCategoryIsNotSelected);
                subCategoryIsNotSelected = false;
            }, this);

            // listen to onSearchComplete and add entry to browser history
            this.listenTo(search, 'onSearchComplete', function(result) {
                updateState.call(this, search);
                // if no products found
                if (!result.get('products') || result.get('products').length == 0) {
                    // set noResult prop to true AFTER call of updateState()
                    // so it will be taken in account on next state change, and the current state (search with no results) will be replaced
                    App.Data.search.noResults = true;
                }
            }, this);

            /**
             * Push data changes to browser history entry.
             * @param {Object} obj - Data object (categories or search model).
             * @param {boolean} replaceState - If true, replace the current state, otherwise push a new state.
             */
            function updateState(obj, replaceState) {
                // if obj is in restoring mode we shouldn't update state
                if (obj.isRestoring) {
                    return;
                }
                // if the previous page was search with no results, replace it in the history
                if (App.Data.search.noResults) {
                    replaceState = true;
                    delete App.Data.search.noResults;
                }
                this.updateState(Boolean(replaceState));
            }
        },
        /**
         * Restore state data from the history.
         * @param {Object} event - PopStateEvent.
         */
        restoreState: function(event) {
            var search = App.Data.search,
                categories = App.Data.categories,
                est = App.Data.settings.get('establishment'),
                isSearchPatternPresent, data;

            // need execute App.Routers.MainRouter.prototype.restoreState to handle establishment changing
            data = event instanceof Object && event.state
                ? App.Routers.RevelOrderingRouter.prototype.restoreState.apply(this, arguments)
                : App.Routers.RevelOrderingRouter.prototype.restoreState.call(this, {state: null});

            if (!(data instanceof Object) || est != data.establishment) {
                return;
            }
            // check data.searchPattern
            isSearchPatternPresent = typeof data.searchPattern == 'string' && data.searchPattern.length;

            // If data.categories is an object, restore 'selected' and 'parent_selected' props of App.Data.categories and set restoring mode.
            // If search pattern is present, categories shouldn't be restored
            if (data.categories instanceof Object && !isSearchPatternPresent) {
                categories.isRestoring = true;
                categories.setParentSelected(data.categories.parent_selected);
                categories.setSelected(data.categories.selected);
                App.Data.categories.trigger('onRestore show_subcategory');
                // remove restoring mode
                delete categories.isRestoring;
            };

            // If data.searchPattern is a string, restore the last searched pattern and set restoring mode
            if (isSearchPatternPresent) {
                search.isRestoring = true;
                search.lastPattern = data.searchPattern;
                // set callback on event onSearchComplete (products received)
                this.listenToOnce(search, 'onSearchComplete', function() {
                    // remove restoring mode
                    delete search.isRestoring;
                }, this);
                search.trigger('onRestore');
            }
        },
        /**
         * Returns the current state data.
         * @return {Object} The object containing information about the current app state.
         */
        getState: function() {
            var categories = App.Data.categories,
                search = App.Data.search,
                data = {},
                hash = location.hash,
                searchPattern;

            // if hash is present but isn't index, need to return default value
            if (hash && !/^#index/i.test(hash) || !categories || !search) {
                return App.Routers.MobileRouter.prototype.getState.apply(this, arguments);
            }

            searchPattern = search.lastPattern;

            // search pattern and categories data cannot be in one state due to views implementation
            if (searchPattern) {
                data.searchPattern = searchPattern;
            } else {
                data.categories = {
                    parent_selected: categories.parent_selected,
                    selected: categories.selected
                };
            }

            return _.extend(App.Routers.MobileRouter.prototype.getState.apply(this, arguments), data);
        },
        /**
        * Get a stores list.
        */
        getEstablishments: function() {
            this.getEstablishmentsCallback = function() {
                if (/^(index.*|maintenance.*)?$/i.test(Backbone.history.fragment)) App.Data.mainModel.set('needShowStoreChoice', true);
            };
            App.Routers.RevelOrderingRouter.prototype.getEstablishments.apply(this, arguments);
        },
        /**
        * Remove HTML and CSS of current establishment in case if establishment ID will change.
        */
        removeHTMLandCSS: function() {
            App.Routers.RevelOrderingRouter.prototype.removeHTMLandCSS.apply(this, arguments);
            this.bodyElement.children('.main-container').remove();
        },
        /**
         * Prepares promotions assets and initializes the promotions collection if needed.
         */
        preparePromotions: function() {
            if (App.Settings.has_campaigns) {
                App.Data.header.set('promotions_available', true);
            }
            else if (!App.Data.promotions) {
                this.prepare('promotions', function() {
                    var promotions = App.Data.promotions || this.initPromotions();

                    this.listenTo(promotions, 'add remove reset', function() {
                        App.Data.header.set('promotions_available', !!promotions.length);
                    });
                });
            }
        },
        index: function() {
            this.prepare('index', function() {
                var categories = App.Data.categories,
                    dfd = $.Deferred(),
                    self = this;

                // load content block for categories
                if (!categories.receiving) {
                    categories.receiving = categories.get_categories();
                }
                categories.receiving.then(function() {
                    App.Data.parentCategories.add(App.Data.categories.getParents());
                    dfd.resolve();
                });

                if (!App.Data.searchLine) {
                    App.Data.searchLine = new App.Models.SearchLine({
                        search: App.Data.search,
                        collapsed: true
                    });
                }

                App.Data.header.set('tab_index', 0);
                App.Data.mainModel.set('mod', 'Main');

                App.Data.mainModel.set({
                    header: headers.main,
                    cart: carts.main,
                    content: [
                        {
                            modelName: 'Categories',
                            collection: App.Data.categories,
                            mod: 'Slider',
                            model: App.Data.mainModel,
                            searchLine: App.Data.searchLine,
                            search: App.Data.search,
                            loaded: dfd
                        },
                        {
                            modelName: 'SearchLine',
                            model: App.Data.searchLine,
                            mod: 'Main',
                            className: 'content search_line primary-border animation'
                        },
                        {
                            modelName: 'Categories',
                            collection: App.Data.categories,
                            search: App.Data.search,
                            mod: 'MainProducts'
                        }
                    ]
                });

                this.preparePromotions();

                dfd.then(function() {
                    self.change_page(function() {
                        App.Data.mainModel.set('needShowStoreChoice', true);
                    }); // change page
                    //start preload google maps api:
                    App.Data.settings.load_geoloc();
                });
            });
        },
        about: function() {
            this.prepare('about', function() {
                if (!App.Data.aboutModel) {
                    App.Data.aboutModel = new App.Models.AboutModel();
                }
                App.Data.header.set('tab_index', 1);
                App.Data.mainModel.set('mod', 'Main');
                App.Data.mainModel.set({
                    header: headers.main,
                    content: {
                        modelName: 'StoreInfo',
                        model: App.Data.timetables,
                        mod: 'Main',
                        about: App.Data.aboutModel,
                        className: 'store-info about-box'
                    },
                    cart: carts.main
                });
                this.change_page();
            });
        },
        map: function() {
            this.prepare('map', function() {
                var stores = this.getStoresForMap();

                App.Data.header.set('tab_index', 2);
                App.Data.mainModel.set('mod', 'Main');
                App.Data.mainModel.set({
                    header: headers.main,
                    content: {
                        modelName: 'StoreInfo',
                        mod: 'MapWithStores',
                        collection: stores,
                        className: 'store-info map-box'
                    },
                    cart: carts.main
                });

                this.change_page();

                if (stores.request.state() == 'pending') {
                    App.Data.mainModel.trigger('loadStarted');
                    stores.request.then(App.Data.mainModel.trigger.bind(App.Data.mainModel, 'loadCompleted'));
                }
            });
        },
        checkout: function(order_id) {
            this.prepare('checkout', function() {
                var settings = App.Data.settings.get('settings_system'),
                    customer = App.Data.customer,
                    addresses = customer.get('addresses'),
                    reorderReq;

                order_id = Number(order_id);

                if (order_id > 0) {
                    reorderReq = this.reorder(order_id);
                }

                this.listenTo(customer, 'change:access_token', function() {
                    // update shipping address on login/logout
                    customer.get('addresses').changeSelection(App.Data.myorder.checkout.get('dining_option'));
                });

                if (!App.Data.card) {
                    App.Data.card = new App.Models.Card;
                }

                App.Data.header.set('tab_index', null);

                if (!addresses.isProfileAddressSelected()) {
                    // Need to specify shipping address (Bug 34676)
                    addresses.changeSelection(App.Data.myorder.checkout.get('dining_option'));
                }

                App.Data.mainModel.set('mod', 'Main');
                App.Data.mainModel.set({
                    header: headers.main,
                    cart: carts.checkout,
                    content: {
                        modelName: 'Checkout',
                        collection: App.Data.myorder,
                        mod: 'Page',
                        className: 'checkout-order-details',
                        DINING_OPTION_NAME: this.LOC_DINING_OPTION_NAME,
                        timetable: App.Data.timetables,
                        customer: customer,
                        acceptTips: settings.accept_tips_online,
                        noteAllow:  settings.order_notes_allow,
                        discountAvailable: settings.accept_discount_code,
                        checkout: App.Data.myorder.checkout,
                        paymentMethods: App.Data.paymentMethods,
                        enableRewardCard: settings.enable_reward_cards_collecting,
                        total: App.Data.myorder.total,
                        card: App.Data.card,
                        giftcard: App.Data.giftcard,
                        giftCards: App.Data.customer.giftCards,
                        stanfordcard: App.Data.stanfordCard,
                        promises: this.getProfilePaymentsPromises.bind(this),
                        needShowBillingAddess: PaymentProcessor.isBillingAddressCard()
                    }
                });

                var customerPayments = customer.payments,
                    customerGiftCards = customer.giftCards;

                if (customerPayments) {
                    customerPayments.trigger('resetModelsAttrs');

                    var primaryPayment = customerPayments.getPrimaryPayment();
                    if (primaryPayment) {
                        primaryPayment.setPrimaryAsSelected();
                    }

                    customer.trigger('updateCheckoutPaymentTokens');
                }

                if (customerGiftCards) {
                    customer.trigger('updateCheckoutGiftCards');
                }

                if (reorderReq) {
                    reorderReq.always(this.change_page.bind(this));
                } else {
                    this.change_page();
                }

                this.preparePromotions();
            });
        },
        /**
         * Handler for #confirm. Set `mod` attribute of App.Data.mainModel to 'Done'.
         * If App.Data.myorder.paymentResponse is null this handler isn't executed and run #index handler.
         */
        confirm: function() {
            // if App.Data.myorder.paymentResponse isn't defined navigate to #index
            if (!(App.Data.myorder.paymentResponse instanceof Object) || !this.recentOrder) {
                return this.navigate('index', true);
            }

            this.prepare('confirm', function() {
                // if App.Data.customer doesn't exist (success payment -> history.back() to #checkout -> history.forward() to #confirm)
                // need to init it.
                // TODO
                if(!App.Data.customer) {
                    this.loadCustomer();
                }

                var other_dining_options = App.Data.myorder.checkout.get('other_dining_options'),
                    cartData = carts.confirm;

                if (this.recentOrder) {
                    cartData = _.extend({
                        collection: this.recentOrder,
                        checkout: this.recentOrder.checkout,
                        total: this.recentOrder.total.clone(),
                        discount: this.recentOrder.discount.clone(),
                        no_qty_arrows: true
                    }, carts.confirm);
                }

                // the order should be displayed once
                delete this.recentOrder;

                // Listeners
                this.listenTo(App.Data.customer, 'onLogin onLogout', function() {
                    this.navigate('index', true);
                }, this);

                App.Views.GeneratorView.cacheRemoveView('Main', 'Done', 'content_Main_Done');
                App.Views.GeneratorView.cacheRemoveView('Cart', 'Confirmation', 'cart_Cart_Confirmation');

                App.Data.header.set('tab_index', null);
                App.Data.mainModel.set({
                    mod: 'Main',
                    header: headers.main,
                    cart: cartData,
                    content: {
                        modelName: 'Main',
                        mod: 'Done',
                        model: App.Data.mainModel,
                        customer: App.Data.customer.clone(),
                        checkout: App.Data.myorder.checkout,
                        other_options: other_dining_options || new Backbone.Collection(),
                        className: 'main-done'
                    }
                });
                this.change_page();
            });
        },
        maintenance: function() {
            var settings = App.Data.settings,
                mainModel = App.Data.mainModel;
            if (settings.get('isMaintenance')) {
                mainModel.set({
                    mod: 'Maintenance',
                    errMsg: ERROR[settings.get('maintenanceMessage')],
                    className: 'maintenance'
                });
            }
            this.change_page(mainModel.set.bind(mainModel, 'needShowStoreChoice', true));
            App.Routers.RevelOrderingRouter.prototype.maintenance.apply(this, arguments);
        },
        profile_edit: function() {
            App.Data.header.set('tab_index', null);
            App.Data.mainModel.set({
                mod: 'Main',
                header: headers.main,
                cart: carts.main
            });

            var promises = this.setProfileEditContent();

            if (!promises.length) {
                return this.navigate('index', true);
            } else {
                Backbone.$.when.apply(Backbone.$, promises).then(this.change_page.bind(this));
            }
        },
        profile_payments: function() {
            App.Data.header.set('tab_index', null);
            App.Data.mainModel.set({
                mod: 'Main',
                header: headers.main,
                cart: carts.main
            });

            var promises = this.setProfilePaymentsContent();

            if (!promises.length) {
                return this.navigate('index', true);
            } else {
                Backbone.$.when.apply(Backbone.$, promises).then(this.change_page.bind(this));
            }
        },
        past_orders: function() {
            App.Data.header.set('tab_index', null);
            App.Data.mainModel.set({
                mod: 'Main',
                header: headers.main,
                cart: carts.main
            });

            var req = this.setPastOrdersContent();

            if (!req) {
                this.navigate('index', true);
            } else {
                req.always(this.change_page.bind(this));
            }
        },
        loyalty_program: function() {
            App.Data.header.set('tab_index', null);
            App.Data.mainModel.set({
                mod: 'Main',
                header: headers.main,
                cart: carts.main
            });

            var req = this.setLoyaltyProgramContent();

            if (!req || !App.Settings.enable_reward_cards_collecting) {
                this.navigate('index', true);
            } else {
                req.always(this.change_page.bind(this));
            }
        },
        establishment: function() {
            App.Data.establishments.trigger('loadStoresList');
        }
    });

    // extends Router with Desktop mixing
    _.defaults(Router.prototype, App.Routers.DesktopMixing);

    return new main_router(function() {
        defaultRouterData();
        App.Routers.Router = Router;
    });
});
