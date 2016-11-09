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

    var headerModes = {};
    var footerModes = {};

    /**
    * Default router data.
    */
    function defaultRouterData() {
        headerModes.Main = {mod: 'Main', className: 'main'};
        headerModes.Modifiers = {mod: 'Modifiers', className: 'modifiers'};
        headerModes.ComboProduct = {mod: 'ComboProduct', className: 'modifiers'};
        headerModes.Promotions = {mod: 'Promotions'},
        headerModes.Cart = {mod: 'Cart'};
        headerModes.Order = {mod: 'Order'};
        headerModes.None = null;
        footerModes.Main = {mod: 'Main'};
        footerModes.Promo = {modelName: 'PromoMessage', mod: 'Main', className: 'promo-message-container navigation-bar'};
        footerModes.None = null;
    }

    var Router = App.Routers.RevelOrderingRouter.extend({
        routes: {
            "": "index",
            "index": "index",
            "search/:search": "search",
            "products/:parent_id": "products",
            "modifiers/:id_category(/:id_product)": "modifiers",
            "combo_product/:id_category(/:id_product)": "combo_product",
            "upsell_product/:id_category(/:id_product)": "upsell_product",
            "cart": "cart",
            "checkout" : "checkout",
            "confirm": "confirm",
            "payments": "payments",
            "card" : "card",
            "giftcard" : "gift_card",
            "stanfordcard": "stanford_card",
            "stanford_student_verification": "stanford_student_verification",
            "done": "done",
            "location": "location",
            "about": "about",
            "gallery": "gallery",
            "maintenance": "maintenance",
            "pay": "pay",
            "rewards_card_submit": "rewards_card_submit",
            "reward_cards_select": "reward_cards_select",
            "rewards": "rewards",
            "login": "login",
            "signup": "signup",
            "terms": "terms",
            "profile_create": "profile_create",
            "profile_edit": "profile_edit",
            "profile_settings": "profile_settings",
            "profile_forgot_password": "profile_forgot_password",
            "promotions": "promotions_list",
            "my_promotions": "promotions_my",
            "promotion/:id_promotion": "promotion_details",
            "profile_payments": "profile_payments",
            "past_orders": "past_orders",
            "loyalty_program": "loyalty_program",
            "order/:order_id": "order",
            "establishment": "establishment",
            "*other": "index"
        },
        hashForGoogleMaps: ['location', 'map', 'checkout'],//for #index we start preload api after main screen reached
        use_google_captcha: true, //force to load google captcha library on startup
        lastHash: null,
        rewardsPageReferrerHash: null,
        payHandlerCompleteHash : 'done',
        initialize: function() {
            App.Data.get_parameters = parse_get_params(); // get GET-parameters from address line
            var self = this;

            // set locked routes if online orders are disabled
            if(!App.Settings.online_orders) {
                this.lockedRoutes = [];
            }

            // load main, header, footer necessary files
            this.prepare('main', function() {
                App.Views.Generator.enableCache = true;
                // set header, footer, main models
                App.Data.header = new App.Models.HeaderModel({
                    cart: this.navigate.bind(this, 'cart', true),
                    addProductCb: this.navigate.bind(this, 'index', true)
                });
                App.Data.footer = new App.Models.FooterModel();
                var mainModel = App.Data.mainModel = new App.Models.MainModel();
                var ests = App.Data.establishments;

                // once the route is initialized need to set profile menu
                this.listenToOnce(this, 'initialized', this.initProfileMenu.bind(this));

                this.listenTo(App.Data.myorder, 'add remove change', function() {
                    App.Data.header.set('cartItemsQuantity', App.Data.myorder.get_only_product_quantity());
                });

                this.mainView = new App.Views.MainView.MainMainView({
                    model: mainModel
                });

                Backbone.$('body').prepend(this.mainView.el);

                this.listenTo(ests, 'resetEstablishmentData', mainModel.trigger.bind(mainModel, 'showSpinnerAndHideContent'), this);
                this.listenTo(ests, 'clickButtonBack', mainModel.set.bind(mainModel, 'isBlurContent', false), this);

                this.onInitialized();
            });

            var checkout = App.Data.myorder.checkout;
            checkout.trigger("change:dining_option", checkout, checkout.get("dining_option"));

            this.listenTo(this, 'route', function() {
                this.lastHash = location.hash.slice(1);
            });

            App.Routers.RevelOrderingRouter.prototype.initialize.apply(this, arguments);
        },
        initCustomer: function() {
            App.Routers.RevelOrderingRouter.prototype.initCustomer(this, arguments);

            // 'onReorder' event emits when user click on 'Reorder' button or 'Previous Order'
            this.listenTo(App.Data.customer, 'onReorder', function(order_id) {
                this.navigate('order/' + order_id, true);
            });
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

            /** [Credit Card] **/
            App.Data.payments = new App.Models.PaymentMethods(App.Data.settings.get_payment_process());

            // invokes when user chooses the 'Credit Card' payment processor on the #payments screen
            this.listenTo(App.Data.payments, 'payWithCreditCard', function() {
                showDefaultCardView.call(this);
            }, this);

            this.listenTo(myorder, 'payWithCreditCard', function() {
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
            });

            /* Gift Card */
            this.initGiftCard();

            // invokes when user chooses the 'Gift Card' payment processor on the #payments screen
            this.listenTo(App.Data.payments, 'payWithGiftCard', function() {
                var customer = App.Data.customer;
                if (customer.isAuthorized() && customer.doPayWithGiftCard()) {
                    myorder.check_order({
                        order: true,
                        tip: true,
                        customer: true,
                        checkout: true
                    }, sendRequest.bind(window, PAYMENT_TYPE.GIFT));
                } else {
                    this.navigate('giftcard', true);
                }
            }, this);

            this.listenTo(App.Data.giftcard, 'pay', function() {
                var customer = App.Data.customer;
                myorder.check_order({
                    order: true,
                    tip: true,
                    customer: true,
                    checkout: true,
                    giftcard: true
                }, function() {
                    if (customer.isAuthorized() && !customer.doPayWithGiftCard()) {
                        var req = customer.linkGiftCard(App.Data.giftcard)
                        if (!req) {
                            App.Data.errors.alert(MSG.ERROR_CAN_NOT_LINK_CARD_TO_PROFILE);
                        }
                        req.done(function(data) {
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
            this.listenTo(App.Data.payments, 'payWithCash', function() {
                myorder.check_order({
                    order: true,
                    tip: true,
                    customer: true,
                    checkout: true,
                }, sendRequest.bind(window, PAYMENT_TYPE.NO_PAYMENT));
            }, this);

            /* PayPal */
            // invokes when user chooses the 'PayPal' payment processor on the #payments screen
            this.listenTo(App.Data.payments, 'payWithPayPal', function() {
                App.Data.myorder.check_order({
                    order: true,
                    tip: true,
                    customer: true,
                    checkout: true,
                }, sendRequest.bind(window, PAYMENT_TYPE.PAYPAL));
            }, this);

            /* Stanford Card */
            if(_.isObject(App.Settings.payment_processor) && App.Settings.payment_processor.stanford) {
                App.Data.stanfordCard = new App.Models.StanfordCard();

                // invokes when user chooses the 'Stanford Card' payment processor on the #payments screen
                this.listenTo(App.Data.payments, 'payWithStanfordCard', function() {
                    this.navigate('stanfordcard', true);
                }, this);

                this.listenTo(App.Data.stanfordCard, 'pay', function() {
                    myorder.check_order({
                        order: true,
                        tip: true,
                        customer: true,
                        checkout: true,
                    }, sendRequest.bind(window, PAYMENT_TYPE.STANFORD));
                });
            }

            function sendRequest(paymentType) {
                saveAllData();
                mainModel.trigger('loadStarted');
                myorder.create_order_and_pay(paymentType);
                paymentCanceled && mainModel.trigger('loadCompleted');
                paymentCanceled = false;
            }
        },
        navigationControl: function() {
            this.listenTo(App.Data.header, 'change:tab', function() {
                switch(App.Data.header.get('tab')) {
                    case 0:
                        this.navigate('index', true);
                        break;

                    case 1:
                        this.navigate('about', true);
                        break;

                    case 2:
                        this.navigate('location', true);
                        break;
                }
            }, this);

            // onApplyRewardsCard event occurs when Rewards Card's 'Apply' button is clicked on #checkout page
            this.listenTo(App.Data.myorder.rewardsCard, 'onApplyRewardsCard', this.navigate.bind(this, 'rewards_card_submit', {trigger: true, replace: true}));

            // onGetRewards event occurs when Rewards Card's 'Submit' button is clicked on 'Rewards Card Info' popup
            this.listenTo(App.Data.myorder.rewardsCard, 'onGetRewards', function() {
                App.Data.mainModel.trigger('loadStarted');
                App.Data.myorder.rewardsCard.getRewards();
            });

            // onRedemptionApplied event occurs when 'Apply Reward' btn is clicked
            this.listenTo(App.Data.myorder.rewardsCard, 'onRedemptionApplied', function() {
                var self = this;
                App.Data.mainModel.trigger('loadStarted');
                App.Data.myorder.get_cart_totals().always(function() {
                    App.Data.mainModel.trigger('loadCompleted');
                    App.Data.myorder.rewardsCard.trigger('onRedemptionApplyComplete');
                    self.navigate(self.rewardsPageReferrerHash, true);
                    self.rewardsPageReferrerHash = null;
                });
            }, this);

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
                    this.navigate('rewards', {trigger: true, replace: true});
                }

                App.Data.mainModel.trigger('loadCompleted');
            }, this);

            // onResetData event occurs when user resets Rewards Card
            this.listenTo(App.Data.myorder.rewardsCard, 'onResetData', function() {
                App.Data.myorder.get_cart_totals();
            });

            // onStanfordCardError event occurs when user submit invalid Stanford Card
            App.Data.stanfordCard && this.listenTo(App.Data.stanfordCard, 'onStanfordCardError', function(msg) {
                msg && App.Data.errors.alert(msg);
            });
        },
        /**
        * Get a stores list.
        */
        getEstablishments: function() {
            this.getEstablishmentsCallback = function() {
                var si = App.Data.storeInfo;
                if (/^(index.*)?$/i.test(Backbone.history.fragment) && si) si.set('needShowStoreChoice', true);
            };
            App.Routers.RevelOrderingRouter.prototype.getEstablishments.apply(this, arguments);
        },
        initCategories: function() {
            if (!App.Data.categories) {
                App.Data.categories = new App.Collections.Categories();
                App.Data.parentCategories = new App.Collections.SubCategories();
                App.Data.categories.loadData = App.Data.categories.get_categories();
                App.Data.categories.loadData.then(function() {
                    App.Data.parentCategories.add(App.Data.categories.getParents());
                });
            }

            return App.Data.categories.loadData;
        },
        index: function() {
            var self = this;

            this.prepare('index', function() {
                // load categories
                this.initCategories().then(this.change_page.bind(this));

                App.Data.header.set({
                    page_title: App.Settings.business_name || '',
                    back: App.Data.dirMode ? this.navigateDirectory.bind(this) : null,
                    back_title: App.Data.dirMode ? _loc.BACK : '',
                    showMenuBtn: true,
                    hideCart: false,
                    tab: 0
                });

                this.listenToOnce(this, 'route', function() {
                    App.Data.header.set('showMenuBtn',  false);
                });

                var content = [
                    {
                        modelName: 'Profile',
                        mod: 'PastOrderContainer',
                        model: App.Data.customer,
                        cacheId: true
                    },
                    {
                        modelName: 'Categories',
                        collection: App.Data.parentCategories,
                        mod: 'Parents',
                        cacheId: true,
                        className: 'content_scrollable'
                    }
                ];


                /**
                 * Promotions
                 */
                if (!this.promotions) {
                    // current establishment has campaigns for non authorized users, so any user can access them
                    if (App.Settings.has_campaigns) {
                        initPromotionsLink();
                    }
                    // need to check if there are any available campaigns for current user
                    else if (App.Data.customer.isAuthorized()) {
                        this.prepare('promotions', function() {
                            var promotions = self.initPromotions();

                            promotions.fetching.always(function() {
                                if (promotions.length) {
                                    initPromotionsLink();

                                    App.Data.mainModel.set({
                                        content: _.union([self.promotions], content)
                                    });
                                }
                            });
                        });
                    }
                }
                // 'has_campaigns' is false and the user is not authorized, so there are no available campaigns
                else if (!App.Settings.has_campaigns && !App.Data.customer.isAuthorized()) {
                    delete this.promotions;
                    content.length > 1 && content.shift();
                }

                // this.promotions exists, need to display it
                if (this.promotions) {
                    content.unshift(this.promotions);
                }

                function initPromotionsLink() {
                    self.promotions = {
                        modelName: 'Promotions',
                        model: new Backbone.Model(),
                        mod: 'TopLine',
                        cacheId: true
                    };
                }

                var footerMode;
                if (App.Settings.promo_message) {
                    footerMode = footerModes.Promo;
                } else {
                    footerMode = footerModes.None;
                }

                App.Data.mainModel.set({
                    header: headerModes.Main,
                    footer: footerMode,
                    contentClass: '',
                    content: content
                });

                if(App.Data.categories.loadData.state() == 'resolved')
                    this.change_page();

                App.Data.settings.load_geoloc();
            });
        },
        search: function(search) {
            var self = this;

            this.prepare('search', function() {
                if (!App.Data.search) {
                    App.Data.search = new App.Collections.Search();
                }

                App.Data.header.set({
                    page_title: App.Settings.business_name || '',
                    back: window.history.back.bind(window.history),
                    back_title: _loc.BACK,
                    search: decodeURIComponent(search),
                    showSearch: true
                });

                App.Data.mainModel.set({
                    header: headerModes.Main,
                    footer: footerModes.None
                });

                // need to show serach result list when request is complete
                this.listenToOnce(App.Data.search, 'onSearchComplete', showResults);

                // need to stop listening search events when hash changes (it fixes case when user changes hash during request )
                this.listenToOnce(this, 'route', this.stopListening.bind(this, App.Data.search, 'onSearchComplete', showResults));

                // perform search
                this.initCategories().then(function() {
                    App.Data.search.search(decodeURIComponent(search));
                });

                function showResults(searchModel) {
                    var category = new App.Models.Category({
                        name: _loc.SEARCH_RESULTS + ': ' + searchModel.get('pattern'),
                        products: new App.Collections.Products()
                    });
                    var model = new Backbone.Model({
                        subs: new Backbone.Collection(category)
                    });

                    App.Data.mainModel.set({
                        contentClass: '',
                        content: {
                            modelName: 'Categories',
                            model: model,
                            searchModel: searchModel,
                            mod: 'Search',
                            tagName: 'div',
                            cacheId: true,
                            cacheIdUniq: search
                        }
                    });

                    self.change_page();
                }
            });
        },
        products: function(parent_id) {
            var self = this, parentCategory;
            parent_id = parseInt(parent_id);

            if (!parent_id) {
                this.navigate('index', true);
            }

            this.prepare('products', function() {
                App.Data.header.set({
                    page_title: App.Settings.business_name || '',
                    back: self.navigate.bind(self, 'index', true),
                    back_title: _loc.BACK
                });

                App.Data.mainModel.set({
                    header: headerModes.Main,
                    footer: footerModes.None
                });

                this.initCategories().then(function() {
                    return App.Models.ProductsBunch.init(parent_id);
                }).then(function(){
                    var parentCategory = App.Data.parentCategories.findWhere({id: parent_id}),
                        products_bunch = App.Data.products_bunches[parent_id],
                        content;

                    if (!parentCategory) {
                        return self.navigate('index', true);
                    }

                    content = [
                        {
                            modelName: 'Profile',
                            mod: 'PastOrderContainer',
                            model: App.Data.customer,
                            cacheId: true
                        },
                        {
                            modelName: 'Categories',
                            model: parentCategory,
                            searchModel: products_bunch,
                            mod: 'Main',
                            cacheId: true,
                            cacheIdUniq: parent_id
                        }
                    ];

                    self.promotions && content.unshift(self.promotions);

                    App.Data.mainModel.set({
                        contentClass: '',
                        content: content
                    });

                    self.change_page();
                });
            });
        },
        modifiers: function(id_category, id_product, options) {
            this.prepare('modifiers', function() {
                var self = this,
                    header = App.Data.header,
                    isEditMode = !id_product,
                    order = isEditMode ? App.Data.myorder.at(id_category) : new App.Models.Myorder(),
                    originOrder = null,
                    isOrderChanged;

                if(!order)
                    return this.navigate('index', true);

                header.set({
                    back: window.history.back.bind(window.history),
                    back_title: _loc.BACK,
                    cart: cart
                });

                App.Data.mainModel.set({
                    header: headerModes.Modifiers,
                    footer: footerModes.None
                });

                if(isEditMode) {
                    originOrder = order.clone();
                    this.listenTo(order, 'change', setHeaderToUpdate);
                    setHeaderToUpdate();
                    showProductDetails();
                    isOrderChanged = false;
                } else {
                    setHeaderToAdd();
                    order.add_empty(id_product * 1, id_category * 1).then(showProductDetails);
                }

                function showProductDetails() {
                    if(!isEditMode) {
                        order = order.clone();
                    }

                    if (options && options.no_combo == true) {
                        order.get('product').set('has_upsell', false, {silent: true});
                        originOrder && originOrder.get('product').set('has_upsell', false, {silent: true});
                        if (options.combo_root) {
                            order.get_modifiers().update(options.combo_root.get_modifiers());
                        }
                    }

                    var content = self.getStanfordReloadItem(order) || {
                        modelName: 'MyOrder',
                        model: order,
                        mod: 'Matrix',
                        cacheId: false
                    };

                    App.Data.mainModel.set({
                        contentClass: '',
                        content: content
                    });

                    self.change_page();
                }

                this.listenToOnce(this, 'route', function back() {
                    self.stopListening(order, 'change', setHeaderToUpdate);
                    if (isOrderChanged) {
                        var product = order.get_product();
                        order.update(originOrder);
                        // need to update input values otherwise current input.value overrides restored values
                        order.trigger('change:special', order, order.get('special'));
                        order.trigger('change:quantity', order, order.get('quantity'));
                        if(product.get('is_gift')) {
                            order.trigger('change:initial_price', order, order.get('initial_price'));
                            order.trigger('change:product', order, product); // for Stanford Reload Item
                            product.trigger('change:price', product, product.get('price'));
                            product.trigger('change:gift_card_number', product, product.get('gift_card_number'));
                        }
                    }
                });

                function cart() {
                    if (App.Data.myorder.get_only_product_quantity() > 0) {
                        self.stopListening(order, 'change', setHeaderToUpdate);
                        header.set('cart', self.navigate.bind(self, 'cart', true), {silent: true});
                        self.navigate('cart', true);
                    }
                }

                function setHeaderToUpdate() {
                    isOrderChanged = true;
                    header.set({
                        page_title: _loc.CUSTOMIZE,
                        link_title: _loc.UPDATE,
                        link: !App.Settings.online_orders ? header.defaults.link : function() {
                            header.updateProduct(order);
                            order.set('discount', originOrder.get('discount').clone(), {silent: true});
                            // originOrderItem.update(orderItem);
                            originOrder = order.clone();
                            isOrderChanged = false;
                        }
                    });
                }

                function setHeaderToAdd() {
                    header.set({
                        page_title: _loc.CUSTOMIZE,
                        link_title: _loc.ADD_TO_CART,
                        link: !App.Settings.online_orders ? header.defaults.link : function() {
                            header.addProduct(order).done(function () {
                                self.listenTo(order, 'change', setHeaderToUpdate);
                            });
                        }
                    });
                }
            });
        },
        combo_child_products: function(combo_order, product_id, options) {
            this.prepare('modifiers', function() {
                var self = this, order,
                    header = App.Data.header,
                    isEditMode = true,
                    originOrder = null,
                    action = _.isObject(options) ? options.action : undefined;

                if (!combo_order) {
                    return this.navigate('index', true);
                }

                if (combo_order.get('id_product') == product_id) {
                    //the case to customize Upsell root product
                    order = combo_order;
                } else {
                    //the case for custmization of child products
                    order = combo_order.find_child_product(product_id);
                }

                if (!order) {
                    return this.navigate('index', true);
                }

                header.set({
                    back: back,
                    back_title: _loc.BACK,
                    cart: cart,
                    hideCart: true
                });

                App.Data.mainModel.set({
                    header: _.extend({}, headerModes.Modifiers, {submode: 'child'}),
                    footer: footerModes.None
                });

                if(isEditMode) {
                    originOrder = order.clone();
                    setHeaderToUpdate();
                    showProductDetails();
                }

                function showProductDetails() {
                    var content = self.getStanfordReloadItem(order) || {
                        modelName: 'MyOrder',
                        model: order,
                        mod: 'Matrix',
                        combo_child: true,
                        cacheId: false
                    };
                    App.Data.mainModel.set({
                        contentClass: '',
                        content: content
                    });
                    self.change_page();
                }

                this.listenToOnce(this, 'route', back);
                function back() {
                    var cache_id = combo_order.get('id_product');
                    order.update(originOrder);
                    self.stopListening(order, 'change', setHeaderToUpdate);
                    self.stopListening(self, 'route', back);
                    self.return_to_combo_product(cache_id);
                }

                function cart() {
                    if (App.Data.myorder.get_only_product_quantity() > 0) {
                        self.stopListening(order, 'change', setHeaderToUpdate);
                        self.stopListening(self, 'route', back);
                        self.navigate('cart', true);
                    }
                }

                function setHeaderToUpdate() {
                    header.set({
                        page_title: _loc.CUSTOMIZE,
                        link_title: action == "then_add_item" ? _loc.ADD_TO_CART : _loc.UPDATE,
                        link: !App.Settings.online_orders ? header.defaults.link : function() {
                            var status = header.updateProduct(order);
                            if (status) {
                                self.stopListening(self, 'route', back);
                                originOrder.update(order);
                                combo_order.trigger("change:modifiers");
                                if (action == "then_add_item")
                                    App.Data.myorder.trigger("add_upsell_item_to_cart");
                            }
                        }
                    });
                    self.listenTo(order, 'change', setHeaderToUpdate);
                }
            });
        },
        return_to_combo_product: function(cache_id) {
            var header = App.Data.header;

            if (!cache_id) {
                return this.navigate('index', true);
            }

            header.set({
                back: window.history.back.bind(window.history),
                back_title: _loc.BACK,
                hideCart: false
            });

            App.Data.mainModel.set({
                header:  _.extend({}, headerModes.ComboProduct, { init_cache_session: false,
                                                                  cacheIdUniq: cache_id}),
                footer: footerModes.None
            });

            App.Data.mainModel.set({
                contentClass: '',
                content: {
                    modelName: 'MyOrder',
                    mod: 'MatrixCombo',
                    init_cache_session: false, // find the previously cached view
                    cacheIdUniq: cache_id  // cache is enabled for combo products during the phase of product customization only
                }
            });

            header.trigger('reinit');
            this.change_page();
        },
        upsell_product: function(id_category, id_product) {
            this.combo_upsell_product( {
                id_category: id_category,
                id_product: id_product,
                has_upsell: true
            });
        },
        combo_product: function(id_category, id_product) {
            this.combo_upsell_product( {
                id_category: id_category,
                id_product: id_product,
                has_upsell: false
            });
        },
        combo_upsell_product: function(options) {
            var id_category = options.id_category,
                id_product = options.id_product,
                has_upsell = options.has_upsell;
            this.prepare('combo_product', function() {
                var self = this,
                    isEditMode = !id_product,
                    order = isEditMode ? App.Data.myorder.at(id_category) : (has_upsell ? App.Models.create('MyorderUpsell') : App.Models.create('MyorderCombo')),
                    orderClone = null,
                    isOrderChanged;

                if(!order)
                    return this.navigate('index', true);

                var cache_id = order.get("id_product") ? order.get("id_product") : id_product;

                var header = new App.Models.HeaderModel({
                        cart: this.navigate.bind(this, 'cart', true),
                        addProductCb: this.navigate.bind(this, 'index', true),
                        back: window.history.back.bind(window.history),
                        back_title: _loc.BACK
                    });

                if(isEditMode) {
                    orderClone = order.clone();
                    showProductDetails();
                } else {
                    order.add_empty(id_product * 1, id_category * 1).then(showProductDetails);
                }

                function showProductDetails() {
                    if(!isEditMode) {
                        order = order.clone();
                    }
                    App.Data.mainModel.set({
                        header: _.extend({}, headerModes.ComboProduct, {
                                                mode: isEditMode ? 'update' : 'add',
                                                submode: 'root',
                                                order: isEditMode ? orderClone : order,
                                                originOrder: isEditMode ? order : null,
                                                init_cache_session: true,
                                                cacheIdUniq: cache_id,
                                                model: header
                                }),
                        footer: footerModes.None
                    });

                    var content = {
                        modelName: 'MyOrder',
                        model: isEditMode ? orderClone : order,
                        mod: 'MatrixCombo',
                        action: isEditMode ? 'update' : 'add',
                        init_cache_session: true, // 'true' means that the view will be removed from cache before creating a new one.
                        cacheIdUniq: cache_id  // cache is enabled for combo products during the phase of product customization only.
                    };

                    App.Data.mainModel.set({
                        contentClass: '',
                        content: content
                    });

                    if (has_upsell && !isEditMode) {
                        self.listenTo(header, "set_modifiers_before_add", function() {
                            self.combo_child_products(order, order.get("id_product"), {action: "then_add_item"});
                        });
                    }

                    self.change_page();
                }
            });
        },
        cart: function() {
            App.Data.header.set({
                page_title: _loc.HEADER_MYORDER_PT,
                back_title: _loc.MENU,
                back: this.navigate.bind(this, 'index', true)
            });

            this.prepare('cart', function() {
                var isAuthorized = App.Data.customer.isAuthorized(),
                    cb = isAuthorized ? this.navigate.bind(this, 'confirm', true) : this.navigate.bind(this, 'checkout', true),
                    self = this;

                App.Data.footer.set({
                    action: setAction(cb)
                });

                App.Data.mainModel.set({
                    header: headerModes.Cart,
                    footer:  {
                            total: App.Data.myorder.total,
                            mod: 'Cart',
                            className: 'footer'
                        },
                    contentClass: '',
                    content: [
                        {
                            modelName: 'MyOrder',
                            collection: App.Data.myorder,
                            mod: 'List',
                            className: 'myorderList',
                            cacheId: true
                        },
                        {
                            modelName: 'MyOrder',
                            model: App.Data.myorder.checkout,
                            mod: 'Note',
                            className: 'myorderNote',
                            cacheId: true
                        }
                    ]
                });

                this.change_page();

                function setAction(cb) {
                    return function() {
                        if (isAuthorized) {
                            !self.showIsStudentQuestion(cb) && cb();
                        } else {
                            cb();
                        }
                    }
                }
            });
        },
        order: function(order_id) {
            order_id = Number(order_id);

            if (!order_id) {
                this.navigate('index', true);
            }

            var isReorderNotStartPage = order_id && this.initialized,
                customer = App.Data.customer,
                myorder = App.Data.myorder;

            App.Data.header.set({
                page_title: _loc.PROFILE_ORDER_NUMBER + order_id,
                back_title: isReorderNotStartPage ? _loc.BACK : _loc.MENU,
                back: isReorderNotStartPage ? window.history.back.bind(window.history) : this.navigate.bind(this, 'index', true)
            });

            var orderCollection = new App.Collections.Myorders(),
                orderModel = new App.Models.Order();

            if (order_id > 0) {
                var orderReq = check_order();
            }

            this.prepare('order', function() {
                var isAuthorized = App.Data.customer.isAuthorized(),
                    cb = isAuthorized ? this.navigate.bind(this, 'confirm', true) : this.navigate.bind(this, 'checkout', true),
                    self = this;

                App.Data.footer.set({
                    action: setAction(cb)
                });

                App.Data.mainModel.set({
                    header: headerModes.Order,
                    footer:  {
                        mod: 'Cart',
                        className: 'footer',
                        isReorder: Boolean(order_id),
                        total: orderCollection.total
                    },
                    contentClass: '',
                    content: [
                        {
                            modelName: 'MyOrder',
                            mod: 'Details',
                            model: orderModel
                        },
                        {
                            modelName: 'MyOrder',
                            mod: 'List',
                            className: 'myorderList',
                            collection: orderCollection,
                            disallow_edit: true
                        },
                        {
                            modelName: 'MyOrder',
                            mod: 'Note',
                            className: 'myorderNote',
                            model: orderCollection.checkout
                        }
                    ]
                });

                if (orderReq) {
                    orderReq.always(this.change_page.bind(this));
                }
                else {
                    this.change_page();
                }

                function setAction(cb) {
                    return function() {
                        var reorderReq = customer.reorder(order_id);
                        reorderReq.done(function() {
                            var myorder = App.Data.myorder,
                                removed = _.difference(myorder.pluck('id_product'), orderCollection.pluck('id_product'));
                            removed.forEach(function(id_product) {
                                myorder.remove(myorder.findWhere({id_product: id_product}));
                            });
                        })
                        reorderReq.always(cb);
                    }
                }
            });

            function get_order() {
                var dfd = Backbone.$.Deferred(),
                    orders = customer.orders,
                    order = orders.get(order_id),
                    errors = App.Data.errors,
                    req;

                if (!order) {
                    req = customer.getOrder(order_id);

                    req.done(function() {
                        order = orders.get(order_id);
                        if (order) {
                            return dfd.resolve(order);
                        }
                        dfd.reject();
                    });

                    req.fail(function() {
                        dfd.reject();
                    });
                }
                else {
                    dfd.resolve(order);
                }

                return dfd;
            }

            function update_data(order) {
                orderModel.set(order.attributes);
                orderCollection.checkout.set('notes', order.get('notes'));
                order.get('items').each(function(orderItem) {
                    orderCollection.add(orderItem);
                });
            }

            function check_order() {
                var dfd = Backbone.$.Deferred(),
                    errors = App.Data.errors;

                if (customer.isAuthorized()) {
                    var ordersReq = customer.ordersRequest;

                    ordersReq.done(function() {
                        var orderReq = get_order();

                        orderReq.done(function(order) {
                            var itemsReq = customer.getOrderItems(order);

                            itemsReq.done(function() {
                                update_data(order);
                            });

                            itemsReq.always(dfd.resolve.bind(dfd));
                        });

                        orderReq.fail(function() {
                            errors.alert(_loc.PROFILE_ORDER_NOT_FOUND.replace(/%s/, order_id));
                            return dfd.reject();
                        });
                    });

                    ordersReq.fail(dfd.reject.bind(dfd));
                }
                else {
                    errors.alert(_loc.PROFILE_PLEASE_LOG_IN);
                    dfd.resolve();
                }

                return dfd;
            }
        },
        checkout: function() {
            var self = this;

            App.Data.header.set({
                page_title: _loc.HEADER_CHECKOUT_PT,
                back_title: _loc.BACK,
                back: this.navigate.bind(this, 'cart', true),
                promotions: function goToPromotions() {
                    self.navigate('promotions', true);
                    App.Data.header.set('hideCart', true);
                }
            });

            App.Data.mainModel.set({
                header: headerModes.Cart,
                footer: {   className: 'footer',
                            cacheId: true,
                            cacheIdUniq: 'checkout' }
            });

            this.prepare('checkout', function() {
                self.listenToOnce(self, 'route', function() {
                    App.Data.myorder.checkout.trigger('hide:datepicker');
                });

                if (!App.Data.card)
                    App.Data.card = new App.Models.Card();

                if (!App.Data.customer) {
                    App.Data.customer =  new App.Models.Customer();
                    App.Data.customer.loadAddresses();
                }

                var addresses = App.Data.customer.get('addresses');

                if (!addresses.isProfileAddressSelected()) {
                    // Need to specify shipping address (Bug 34676)
                    addresses.changeSelection(App.Data.myorder.checkout.get('dining_option'));
                }

                App.Data.header.set('showPromotionsLink', !!self.promotions);
                this.listenToOnce(this, 'route', function() {
                    App.Data.header.set('showPromotionsLink', false); // hide Promotions link
                });

                App.Data.footer.set({
                    btn_title: _loc.CONTINUE,
                    action: setAction(this.navigate.bind(this, 'confirm', true))
                });

                App.Data.mainModel.set({
                    contentClass: 'primary-bg',
                    content: [
                        {
                            modelName: 'Checkout',
                            model: App.Data.myorder.checkout,
                            collection: App.Data.myorder,
                            mod: 'OrderType',
                            DINING_OPTION_NAME: self.LOC_DINING_OPTION_NAME,
                            className: 'checkout'
                        },
                        {
                            modelName: 'Checkout',
                            model: App.Data.myorder.checkout,
                            customer: App.Data.customer,
                            rewardsCard: App.Data.myorder.rewardsCard,
                            mod: 'Main',
                            className: 'checkout'
                        },
                        {
                            modelName: 'Checkout',
                            model: App.Data.myorder.checkout,
                            timetable: App.Data.timetables,
                            mod: 'Pickup',
                            className: 'checkout'
                        }
                    ]
                });

                this.change_page();
            });

            function setAction(cb) {
                return function () {
                    App.Data.myorder.check_order({
                        order: true,
                        customer: true,
                        checkout: true,
                        validationOnly: true
                    }, function() {
                        if (!self.showIsStudentQuestion(cb)) {
                            cb();
                        }
                    });
                };
            }
        },
        confirm: function() {
            var self = this,
                load = $.Deferred(),
                myorder = App.Data.myorder,
                rewardCards = App.Data.customer.get('rewardCards');

            if (myorder.length === 0) {
                load = this.loadData();
            } else {
                load.resolve();
            }

            App.Data.header.set({
                page_title: _loc.HEADER_CHECKOUT_PT,
                back_title: _loc.BACK,
                back: App.Data.customer.isAuthorized() ? this.navigate.bind(this, 'cart', true) : this.navigate.bind(this, 'checkout', true),
                promotions: function goToPromotions() {
                    self.navigate('promotions', true);
                    App.Data.header.set('hideCart', true);
                }
            });

            App.Data.mainModel.set({
                header: headerModes.Cart
            });

            this.prepare('confirm', function() {
                var payments = App.Data.settings.get_payment_process(),
                    payment_count = _.isObject(payments) ? payments.payment_count : 0,
                    mainFooter = payment_count > 1 || App.Data.customer.payments,
                    content = [];

                content.push({
                    modelName: 'Total',
                    model: myorder.total,
                    mod: 'Checkout',
                    collection: myorder,
                    customer: App.Data.customer,
                    checkout: myorder.checkout,
                    rewardsCard: myorder.rewardsCard,
                    rewardCards: rewardCards,
                    showDiscountCode: showDiscountCode,
                    showRewards: function() {
                            self.navigate(rewardCards.length ? 'reward_cards_select' : 'rewards_card_submit', true);
                        },
                    cacheId: true
                },
                {
                    modelName: 'Tips',
                    model: myorder.total.get('tip'),
                    mod: 'Line',
                    total: myorder.total,
                    cacheId: true
                });

                if (App.Data.customer.isAuthorized()) {
                    content.push({
                        modelName: 'Checkout',
                        model: App.Data.myorder.checkout,
                        collection: App.Data.myorder,
                        mod: 'OrderTypeShort',
                        DINING_OPTION_NAME: self.LOC_DINING_OPTION_NAME,
                        checkout: myorder.checkout,
                        customer: App.Data.customer,
                        className: 'checkout-short',
                        cacheId: true
                    },
                    {
                        modelName: 'Checkout',
                        model: App.Data.myorder.checkout,
                        collection: App.Data.myorder.checkout.get('other_dining_options'),
                        mod: 'OtherShort',
                        className: 'checkout checkout-lines font-size2',
                        cacheId: true
                    },
                    {
                        modelName: 'Checkout',
                        model: App.Data.myorder.checkout,
                        timetable: App.Data.timetables,
                        mod: 'PickupShort',
                        className: 'checkout checkout-short',
                        cacheId: true
                    });
                }

                App.Data.header.set('showPromotionsLink', !!self.promotions);
                this.listenToOnce(this, 'route', function() {
                    App.Data.header.set('showPromotionsLink', false); // hide Promotions link
                });

                if(!App.Data.card)
                    App.Data.card = new App.Models.Card;

                var payBtn = function() {
                    App.Data.footer.set({
                        btn_title: _loc.CONTINUE,
                        action: mainFooter ? goToPayments : App.Data.payments.onPay.bind(App.Data.payments)
                    });
                }

                // Enhancement #12904
                // If grandTotal is $0 we must show "Place Order" button instead of "Pay".
                var placeOrderBtn = function() {
                    if (!Number(myorder.total.get('grandTotal'))) {
                        App.Data.payments.set('selected', 'cash');
                        App.Data.footer.set({
                            btn_title: _loc.PLACE_ORDER,
                            action: App.Data.payments.onPay.bind(App.Data.payments)
                        });
                    }
                    else {
                        payBtn();
                    }
                };

                if (mainFooter) {
                    placeOrderBtn();
                    this.listenTo(myorder.total, 'change:grandTotal', placeOrderBtn);
                    // unbind listener
                    this.listenToOnce(this, 'route', function() {
                        this.stopListening(myorder.total, 'change:grandTotal', placeOrderBtn);
                    });

                    App.Data.mainModel.set({
                        footer: {
                            mod: 'Main',
                            className: 'footer',
                            cacheId: true,
                            cacheIdUniq: 'confirm'
                        }
                    });
                } else {
                    payBtn();
                    App.Data.mainModel.set({
                        footer: {
                            mod: 'PaymentSelection',
                            total: myorder.total,
                            className: 'footer footer-payments',
                            cacheId: true
                        }
                    });
                }

                App.Data.mainModel.set({
                    contentClass: 'primary-bg',
                    content: content
                });

                this.change_page();
            }, [load]);

            function goToPayments() {
                App.Data.myorder.check_order({
                    order: true,
                    tip: true,
                    customer: true,
                    checkout: true,
                    validationOnly: App.Data.customer.isAuthorized() ? true : false //false => /pre_validate has already been sent on #checkout
                }, function() {
                   self.navigate('payments', true);
                });
            }

            function showDiscountCode() {
                App.Data.errors.alert('', false, false, {
                    isConfirm: true,
                    typeIcon: '',
                    confirm: {
                        ok: _loc.MYORDER_APPLY
                    },
                    customView: new App.Views.CheckoutView.CheckoutDiscountCodeView({
                        model: myorder.checkout,
                        className: 'checkout-discount-code'
                    }),
                    callback: function(res) {
                        if (!res) {
                            return;
                        }

                        var codeLength = myorder.checkout.get('discount_code').length;

                        if (codeLength < 1 || codeLength > 200) {
                            return App.Data.errors.alert(MSG.ERROR_INCORRECT_DISCOUNT_CODE); // user notification
                        }

                        myorder.get_cart_totals({apply_discount: true});
                    }
                });
            }
        },
        payments: function() {
            App.Data.header.set({
                page_title: _loc.PAY,
                back_title: _loc.BACK,
                back: this.navigate.bind(this, 'confirm', true)
            });

            App.Data.mainModel.set({
                header: headerModes.Cart,
                footer: {
                    mod: 'PaymentSelection',
                    total: App.Data.myorder.total,
                    className: 'footer footer-payments',
                    cacheId: true
                }
            });

            this.prepare('payments', function() {
                App.Data.footer.set({
                    action: App.Data.payments.onPay.bind(App.Data.payments)
                });

                var content = [{
                    modelName: 'PaymentMethods',
                    model: App.Data.payments,
                    checkout: App.Data.myorder.checkout,
                    mod: 'Main',
                    collection: App.Data.myorder,
                    cacheId: true
                }];

                var customer = App.Data.customer,
                    payments = customer.payments,
                    giftCards = customer.giftCards,
                    promises = this.getProfilePaymentsPromises(),
                    isAuthorized;

                if (payments) {
                    // do not cache it
                    // App.Data.customer.payments can change after logout/login
                    content.push({
                        modelName: 'Profile',
                        mod: 'PaymentsSelection',
                        collection: payments,
                        model: App.Data.payments,
                        addCreditCard: addCreditCard,
                        className: 'text-center'
                    });
                }

                if (giftCards) {
                    // do not cache it
                    // App.Data.customer.giftCards can change after logout/login
                    content.push({
                        modelName: 'Profile',
                        mod: 'GiftCardsSelection',
                        collection: giftCards,
                        model: App.Data.payments,
                        addGiftCard: addGiftCard,
                        className: 'text-center'
                    });
                }

                App.Data.mainModel.set({
                    contentClass: '',
                    content: content
                });

                if (promises.length) {
                    customer.paymentsRequest && customer.paymentsRequest.done(function() {
                        payments.selectFirstItem();
                        payments.ignoreSelectedToken = false;
                    });
                    customer.giftCardsRequest && customer.giftCardsRequest.done(function() {
                        giftCards.selectFirstItem();
                        giftCards.ignoreSelected = false;
                    });
                    Backbone.$.when.apply(Backbone.$, promises).then(this.change_page.bind(this));
                } else {
                    this.change_page()
                };

                function addCreditCard() {
                    var payment = App.Data.settings.get_payment_process();
                    payments && (payments.ignoreSelectedToken = true);

                    if (!payment.credit_card_dialog) {
                        customer.trigger('onAskForRememberCard', {
                            callback: function() {
                                App.Data.payments.trigger('payWithCreditCard');
                            }
                        });
                    }
                    else {
                        App.Data.payments.trigger('payWithCreditCard');
                    }
                }

                function addGiftCard() {
                    giftCards && (giftCards.ignoreSelected = true);
                    App.Data.payments.trigger('payWithGiftCard');
                }
            });
        },
        card: function() {
            App.Data.header.set({
                page_title: _loc.HEADER_CARD_PT,
                back_title: _loc.BACK,
                back: window.history.back.bind(window.history)
            });

            App.Data.mainModel.set({
                header: headerModes.Cart,
                footer: {   mod: 'PaymentInfo',
                            total: App.Data.myorder.total,
                            className: 'footer',
                            cacheId: true,
                            cacheIdUniq: 'card' }
            });

            this.prepare('card', function() {
                if(!App.Data.card)
                    App.Data.card = new App.Models.Card;

                App.Data.footer.set({
                    btn_title: _loc.FOOTER_PROCEED,
                    action: function() {
                        App.Data.myorder.trigger('payWithCreditCard');
                    }
                });

                var content = [{
                            modelName: 'Card',
                            model: App.Data.card,
                            mod: 'Main',
                            cacheId: true
                        }];

                if (PaymentProcessor.isBillingAddressCard()) {
                    content.push({
                            modelName: 'Card',
                            model: App.Data.card,
                            mod: 'BillingAddress',
                            cacheId: true,
                            customer: App.Data.customer,
                            address: App.Data.card.get("billing_address")
                        });
                }

                App.Data.mainModel.set({
                    contentClass: '',
                    content: content
                });

                this.change_page();
            });
        },
        gift_card: function() {
            // Reload captcha every time when navigated to giftcard page (Bug 29739)
            App.Data.giftcard.trigger('updateCaptcha');

            App.Data.header.set({
                page_title: _loc.HEADER_GIFT_CARD_PT,
                back_title: _loc.BACK,
                back: window.history.back.bind(window.history)
            });

            App.Data.mainModel.set({
                header: headerModes.Cart,
                footer: {   mod: 'Main',
                            className: 'footer',
                            cacheId: true,
                            cacheIdUniq: 'giftcard' }
            });

            this.prepare('giftcard', function() {
                App.Data.footer.set({
                    btn_title: _loc.FOOTER_PROCEED,
                    action: function() {
                        App.Data.giftcard.trigger('pay');
                    }
                });

                App.Data.mainModel.set({
                    contentClass: '',
                    content: [
                        {
                            modelName: 'GiftCard',
                            model: App.Data.giftcard,
                            mod: 'Main',
                            cacheId: true
                        }
                    ]
                });

                this.change_page();
            });
        },
        stanford_card: function() {
            App.Data.header.set({
                page_title: _loc.HEADER_STANFORD_CARD_PT,
                back_title: _loc.BACK,
                back: window.history.back.bind(window.history)
            });

            App.Data.mainModel.set({
                header: headerModes.Cart,
                footer: {
                        mod: 'StanfordCard',
                        submitCard: submitCard,
                        submitOrder: App.Data.stanfordCard.trigger.bind(App.Data.stanfordCard, 'pay'),
                        card: App.Data.stanfordCard,
                        className: 'footer',
                        cacheId: true,
                        cacheIdUniq: 'stanford_card'
                }
            });

            this.prepare('stanfordcard', function() {
                App.Data.mainModel.set({
                    contentClass: '',
                    content: [{
                        modelName: 'StanfordCard',
                        model: App.Data.stanfordCard,
                        mod: 'Main',
                        myorder: App.Data.myorder,
                        cacheId: true,
                        cacheIdUniq: 'stanford_card'
                    }, {
                        modelName: 'StanfordCard',
                        model: App.Data.stanfordCard,
                        collection: App.Data.stanfordCard.get('plans'),
                        mod: 'Plans',
                        className: 'stanford-card-plans',
                        cacheId: true,
                        cacheIdUniq: 'stanford_card'
                    }]
                });

                this.change_page();
            });

            function submitCard() {
                var mainModel = App.Data.mainModel;
                mainModel.trigger('loadStarted');
                App.Data.stanfordCard.getPlans().then(mainModel.trigger.bind(mainModel, 'loadCompleted'));
            }
        },
        stanford_student_verification: function() {
            var self = this;

            // Reload captcha every time when navigated to stanford card verification screen.
            // No need to restore cached data since this screen is shown only once during the order process.
            App.Data.stanfordCard.trigger('updateCaptcha');

            App.Data.header.set({
                page_title: _loc.STANFORD_VERIFICATION,
                back_title: _loc.BACK,
                back: this.navigate.bind(this, App.Data.customer.isAuthorized() ? 'cart' : 'checkout', true)
            });

            App.Data.mainModel.set({
                header: headerModes.Cart,
                footer: {
                        mod: 'Card',
                        card: App.Data.stanfordCard,
                        className: 'footer',
                        cacheId: true,
                        cacheIdUniq: 'stanford_student_verification'
                }
            });

            this.prepare('stanford_student_verification', function() {
                App.Data.footer.set({
                    btn_title: _loc.CONFIRM_SUBMIT,
                    action: verify
                });

                App.Data.mainModel.set({
                    contentClass: '',
                    content: [{
                        modelName: 'StanfordCard',
                        model: App.Data.stanfordCard,
                        mod: 'Main',
                        myorder: App.Data.myorder,
                        cacheId: true,
                        cacheIdUniq: 'stanford_student_verification'
                    }]
                });

                this.change_page();
            });

            function verify() {
                var mainModel = App.Data.mainModel,
                    card = App.Data.stanfordCard;

                mainModel.trigger('loadStarted');
                card.getPlans().then(function() {
                    if(card.get('validated')) {
                        self.navigate('confirm', true);
                    } else {
                        mainModel.trigger('loadCompleted');
                    }
                });
            }
        },
        /**
         * Handler for #done.
         * If App.Data.myorder.paymentResponse is null this handler isn't executed and run #index handler.
         */
        done: function() {
            // if App.Data.myorder.paymentResponse isn't defined navigate to #index
            if(!(App.Data.myorder.paymentResponse instanceof Object)) {
                return this.navigate('index', true);
            }

            var success = App.Data.myorder.paymentResponse.status === 'OK';

            App.Data.header.set({
                page_title: success ? _loc.DONE_THANK_YOU + '!' : '',
                back_title: '',
                back: this.navigate.bind(this, 'index', true)
            });

            App.Data.mainModel.set({
                header: headerModes.Cart,
                footer: footerModes.None
            });

            this.prepare('done', function() {
                // if App.Data.customer doesn't exist (success payment -> history.back() to #confirm -> history.forward() to #done)
                // need to init it.
                if(!App.Data.customer) {
                    this.loadCustomer();
                }

                App.Data.mainModel.set({
                    contentClass: 'primary-bg done-container',
                    content: {
                        modelName: 'Main',
                        model: App.Data.mainModel,
                        payment: new Backbone.Model({success: success}),
                        mod: "Done",
                        className: 'done text-center'
                    }
                });

                this.change_page();
            });
        },
        location: function() {
            App.Data.header.set({
                page_title: App.Settings.business_name || '',
                back_title: _loc.BACK,
                back: window.history.back.bind(window.history),
                tab: 2
            });

            App.Data.mainModel.set({
                header: headerModes.Main,
                footer: footerModes.None
            });

            this.prepare('store_info', function() {
                var stores = this.getStoresForMap();

                App.Data.mainModel.set({
                    contentClass: '',
                    content: {
                        modelName: 'StoreInfo',
                        mod: 'Map',
                        collection: stores,
                        className: 'map',
                        cacheId: true
                    }
                });

                this.change_page();

                if (stores.request.state() == 'pending') {
                    App.Data.mainModel.trigger('loadStarted');
                    stores.request.then(App.Data.mainModel.trigger.bind(App.Data.mainModel, 'loadCompleted'));
                }
            });
        },
        about: function() {
            var model = new Backbone.Model({
                    hours: App.Data.timetables.get('hours')
                });

            App.Data.header.set({
                page_title: App.Settings.business_name || '',
                back_title: _loc.BACK,
                back: window.history.back.bind(window.history),
                tab: 1
            });

            App.Data.mainModel.set({
                header: headerModes.Main,
                footer: footerModes.None
            });

            this.prepare('store_info', function() {
                App.Data.mainModel.set({
                    contentClass: '',
                    content: {
                        modelName: 'StoreInfo',
                        model: model,
                        establishments: App.Data.establishments,
                        mod: 'Main',
                        className: 'store-info',
                        cacheId: true
                    }
                });

                this.change_page();
            });
        },
        gallery: function() {
            App.Data.mainModel.set({
                header: headerModes.None,
                footer: footerModes.None,
            });

            this.prepare('store_info', function() {
                if (!App.Data.AboutModel) {
                    App.Data.AboutModel = new App.Models.AboutModel();
                }
                App.Data.mainModel.set({
                    content: {
                        modelName: 'StoreInfo',
                        model: App.Data.AboutModel,
                        mod: 'Gallery',
                        className: 'gallery',
                        cacheId: true
                    }
                });

                this.change_page();
            });
        },
        maintenance : function() {
            App.Routers.RevelOrderingRouter.prototype.maintenance.apply(this, arguments);

            if(!App.Data.settings.get('isMaintenance')) {
                return;
            }

            App.Data.header.set({
                page_title: '',
                back_title: App.Data.dirMode ? _loc.BACK : '',
                back: App.Data.dirMode ? this.navigateDirectory.bind(this) : null
            });

            App.Data.mainModel.set({
                header: headerModes.Cart,
                footer: footerModes.None,
            });

            this.prepare('maintenance', function() {
                App.Data.mainModel.set({
                    contentClass: '',
                    content: {
                        modelName: 'Maintenance',
                        mod: 'Main',
                        className: 'maintenance text-center'
                    }
                });

                this.change_page();
            });
        },
        rewards_card_submit: function() {
            var rewardsCard = App.Data.myorder.rewardsCard;

            if (!App.Data.customer.isAuthorized() && !this.rewardsPageReferrerHash) {
                this.rewardsPageReferrerHash = this.lastHash;
            }

            App.Data.header.set({
                page_title: _loc.HEADER_REWARDS_CARD_PT,
                back_title: _loc.BACK,
                back: window.history.back.bind(window.history)
            });

            App.Data.footer.set({
                btn_title: _loc.CONFIRM_SUBMIT,
                action: rewardsCard.trigger.bind(rewardsCard, 'onGetRewards')
            });

            App.Data.mainModel.set({
                header: headerModes.Cart,
                footer: {
                        card: rewardsCard,
                        mod: 'Card',
                        className: 'footer',
                        cacheId: true,
                        cacheIdUniq: 'rewards_card'
                    }
            });

            this.prepare('rewards', function() {
                App.Data.mainModel.set({
                    contentClass: '',
                    content: [{
                        modelName: 'Rewards',
                        mod: 'Card',
                        model: rewardsCard,
                        className: 'rewards-info',
                        balance: rewardsCard.get('balance'),
                        rewards: rewardsCard.get('rewards'),
                        discount: rewardsCard.get('discount'),
                        customer: App.Data.customer,
                    }]
                });

                this.change_page();
            });
        },
        reward_cards_select: function() {
            var self = this,
                rewardCards = App.Data.customer.get('rewardCards');

            if (!this.rewardsPageReferrerHash) {
                this.rewardsPageReferrerHash = this.lastHash;
            }

            if (!rewardCards.length) {
                return this.navigate('index', true);
            }
            App.Data.header.set({
                page_title: _loc.HEADER_REWARDS_CARD_PT,
                back_title: _loc.BACK,
                back: window.history.back.bind(window.history)
            });

            App.Data.mainModel.set({
                header: headerModes.Cart,
                footer: {   className: 'footer' }
            });

            App.Data.footer.set({
                btn_title: _loc.CHECKOUT,
                action: this.navigate.bind(this, 'confirm', true)
            });

            this.prepare('rewards', function() {
                App.Data.mainModel.set({
                    contentClass: '',
                    content: [{
                        modelName: 'Profile',
                        mod: 'RewardCardsSelection',
                        collection: rewardCards,
                        className: 'rewards-info',
                        applyRewardCard: applyRewardCard
                    }]
                });

                this.change_page();
            });

            function  applyRewardCard(rewardCard) {
                var myorder = App.Data.myorder;
                if (rewardCard.get('selected')) {
                    self.navigate('rewards', true);
                } else {
                    myorder.rewardsCard.resetData();
                    myorder.rewardsCard.set({
                        number: rewardCard.get('number')
                    });
                    self.navigate('rewards_card_submit', true);
                    self.listenToOnce(App.Data.myorder.rewardsCard, 'onRedemptionApplyComplete', function() {
                        rewardCard.set('selected', true);
                    });
                }
            }
        },
        rewards: function() {
            var rewardsCard = App.Data.myorder.rewardsCard;

            App.Data.header.set({
                page_title: _loc.HEADER_REWARDS_PT,
                back_title: _loc.BACK,
                back: window.history.back.bind(window.history)
            });

            var clone = rewardsCard.clone();

            App.Data.mainModel.set({
                header: headerModes.Cart,
                footer: {
                        rewardsCard: clone,
                        mod: 'RewardRedemption',
                        className: 'footer'
                    }
            });

            App.Data.footer.set({
                btn_title: _loc.REWARDS_APPLY,
                action: function() {
                    rewardsCard.update(clone);
                    rewardsCard.trigger('onRedemptionApplied');
                }
            });

            this.prepare('rewards', function() {
                App.Data.mainModel.set({
                    contentClass: '',
                    content: [{
                        modelName: 'Rewards',
                        mod: 'Info',
                        model: clone,
                        className: 'rewards-info regular-text',
                        balance: clone.get('balance'),
                        rewards: clone.get('rewards'),
                        discounts: clone.get('discounts'),
                        skip: this.goToBack.bind(this)
                    }]
                });

                this.change_page();
            });
        },
        getStanfordReloadItem: function(order) {
            var product = order.get_product(),
                footerStanfordReload,
                stanfordCard,
                stanfordState;

            if(App.Data.is_stanford_mode && product && product.get('is_gift')) {
                stanfordCard = order.get('stanfordCard');

                stanfordState = new Backbone.Model({
                    showPlans: hasPlans()
                });

                footerStanfordReload = {
                    mod: 'StanfordReload',
                    card: stanfordCard,
                    orderItem: order,
                    className: 'footer'
                };

                App.Data.footer.set({
                    btn_title: _loc.NEXT,
                    action: getPlans
                });

                // listen to initial price change
                this.listenTo(order, 'change:initial_price', linkBehavior);

                // define footer behavior
                this.listenTo(stanfordCard, 'change:validated', setFooter);
                setFooter();

                // unbind stanford reload item listeners
                this.listenToOnce(this, 'route', function() {
                    this.stopListening(order, 'change:initial_price', linkBehavior);
                    this.stopListening(stanfordCard, 'change:validated', setFooter);
                    App.Data.header.set('enableLink', true); // restore default value
                });

                return {
                    modelName: 'MyOrder',
                    model: order,
                    mod: 'StanfordItem',
                    stanfordState: stanfordState,
                    cacheId: false
                };
            }

            function setFooter() {
                if (hasPlans()) {
                    stanfordState.set('showPlans', true);
                    App.Data.mainModel.set({footer: footerModes.None});
                } else {
                    stanfordState.set('showPlans', false);
                    App.Data.mainModel.set({footer: footerStanfordReload});
                }
                linkBehavior();
            }

            function linkBehavior() {
                var stanfordCard = order.get('stanfordCard'),
                    price = Number(order.get('initial_price')),
                    number = stanfordCard.get('number'),
                    plan = stanfordCard.get('planId');
                App.Data.header.set('enableLink', Boolean(price && number && plan));
            }

            function hasPlans() {
                return stanfordCard.get('validated') && stanfordCard.get('plans').length;
            }

            function getPlans() {
                var mainModel = App.Data.mainModel;
                mainModel.trigger('loadStarted');
                stanfordCard.getPlans(true).then(mainModel.trigger.bind(mainModel, 'loadCompleted'));
            }
        },
        login: function() {
            var content = this.loginContent();

            App.Data.header.set({
                page_title: _loc.WELCOME,
                back: null,
                back_title: ''
            });

            App.Data.mainModel.set({
                header: headerModes.Cart,
                footer: footerModes.None,
                contentClass: 'content-profile-login primary-bg',
                content: content
            });

            this.change_page();
        },
        signup: function() {
            var content = this.signupContent();

            App.Data.header.set({
                page_title: _loc.PROFILE_SIGN_UP,
                back_title: _loc.BACK,
                back: content.back,
                link: content.next,
                link_title: _loc.NEXT
            });

            App.Data.mainModel.set({
                header: headerModes.Modifiers,
                footer: footerModes.None,
                contentClass: 'primary-bg',
                content: content
            });

            this.change_page();
        },
        terms: function() {
            var content = this.termsContent();

            App.Data.header.set({
                page_title: _loc.PROFILE_TOU,
                back_title: _loc.BACK,
                back: content.back,
                link: content.next,
                link_title: _loc.PROFILE_TOU_BTN_ACCEPT_2
            });

            App.Data.mainModel.set({
                header: headerModes.Modifiers,
                footer: footerModes.None,
                contentClass: 'primary-bg regular-text profile-terms-of-use',
                content: content
            });

            this.change_page();
        },
        profile_create: function() {
            var content = this.profileCreateContent();

            App.Data.header.set({
                page_title: _loc.PROFILE_CREATE_TITLE,
                back_title: _loc.BACK,
                back: content.back,
                link: content.register,
                link_title: _loc.CONTINUE,
                enableLink: true
            });

            App.Data.mainModel.set({
                header: headerModes.Modifiers,
                footer: footerModes.None,
                contentClass: 'primary-bg',
                content: content
            });

            this.change_page();
        },
        profile_edit: function() {
            var data = this.profileEditContent();

            if (!data.promises.length) {
                return this.navigate('index', true);
            } else {
                App.Data.mainModel.set({
                    header: headerModes.Modifiers,
                    footer: footerModes.None,
                    contentClass: 'primary-bg',
                    content: data.content
                });
                Backbone.$.when.apply(Backbone.$, data.promises).then(this.change_page.bind(this));
            }
        },
        profile_settings: function() {
            var content = this.profileSettingsContent();

            App.Data.mainModel.set({
                header: headerModes.Modifiers,
                footer: footerModes.None,
                contentClass: 'primary-bg',
                content: content
            });

            this.change_page();
        },
        profile_forgot_password: function() {
            var content = this.profileForgotPasswordContent();

            App.Data.mainModel.set({
                header: headerModes.Modifiers,
                footer: footerModes.None,
                contentClass: 'primary-bg',
                content: content
            });

            this.change_page();
        },
        promotions_list: function() {
            var self = this,
                items = [],
                promotions,
                content,
                backToMenu = false,
                myorder = App.Data.myorder,
                checkout = App.Data.myorder.checkout,
                mainModel = App.Data.mainModel;

            App.Data.mainModel.set({
                header: headerModes.Promotions,
                footer: footerModes.None,
                contentClass: ''
            });

            this.prepare('promotions', function() {
                if (!App.Data.promotions) {
                    this.initPromotions();
                    App.Data.dirMode && (backToMenu = true);
                }
                promotions = App.Data.promotions;

                promotions.fetching.always(function() {
                    if (promotions.needToUpdate) {
                        mainModel.trigger('loadStarted');
                        // get the order items for submitting to server
                        items = App.Data.myorder.map(function(order) {
                            return order.item_submit();
                        });
                        promotions.update(items, checkout.get('discount_code'), App.Data.customer.getAuthorizationHeader()).always(mainModel.trigger.bind(mainModel, 'loadCompleted'));
                    }

                    App.Data.header.set({
                        page_title: _loc.HEADER_PROMOTIONS_LIST_PT,
                        back_title: backToMenu ? _loc.MENU : _loc.BACK,
                        back: back,
                        cart: cart,
                        hideCart: App.Data.header.get('hideCart') || App.Data.myorder.get_only_product_quantity() < 1
                    });

                    content = {
                        modelName: 'Promotions',
                        mod: 'List',
                        collection: promotions
                    };

                    App.Data.mainModel.set({
                        content: content
                    });

                    self.change_page();
                });

                function back() {
                    backToMenu ? self.navigate('index', true) : window.history.back();
                }

                function cart() {
                    self.navigate('cart', true);
                }
            });
        },
        promotions_my: new Function,
        promotion_details: function(id) {
            var self = this,
                promotions,
                model,
                content;

            id = Number(id);

            this.prepare('promotions', function() {
                if (!App.Data.promotions) {
                    this.initPromotions();
                }
                promotions = App.Data.promotions;

                promotions.fetching.always(function() {
                    model = promotions.findWhere({id: id});

                    content = {
                        modelName: 'Promotions',
                        mod: 'Item',
                        model: model,
                        cacheId: true,
                        init_cache_session: true // 'true' means that the view will be removed from cache before creating a new one.
                    };

                    App.Data.header.set({
                        page_title: _loc.HEADER_PROMOTION_PT,
                        back_title: _loc.BACK,
                        back: window.history.back.bind(window.history),
                        hideCart: true
                    });

                    App.Data.mainModel.set({
                        header: headerModes.Promotions,
                        footer: footerModes.None,
                        content: content,
                        contentClass: ''
                    });

                    self.change_page();
                });
            });
        },
        profile_payments: function() {
            var data = this.setProfilePaymentsContent();

            if (!data.promises.length) {
                return this.navigate('index', true);
            } else {
                App.Data.mainModel.set({
                    header: headerModes.Modifiers,
                    footer: footerModes.None,
                    contentClass: '',
                    content: data.content
                });
                Backbone.$.when.apply(Backbone.$, data.promises).then(this.change_page.bind(this));
            }
        },
        past_orders: function() {
            var data = this.setPastOrdersContent();

            if (!data.req) {
                return this.navigate('index', true);
            }

            this.prepare('past_orders', function() {
                App.Data.mainModel.set({
                    header: headerModes.Cart,
                    footer: footerModes.None,
                    contentClass: 'primary-bg',
                    content: data.content
                });
                data.req.always(this.change_page.bind(this));
            });
        },
        loyalty_program: function() {
            var data = this.setLoyaltyProgramContent();

            if (!data.req || !App.Settings.enable_reward_cards_collecting) {
                return this.navigate('index', true);
            }

            App.Data.mainModel.set({
                header: headerModes.Modifiers,
                footer: footerModes.None,
                contentClass: 'primary-bg',
                content: data.content
            });

            data.req.always(this.change_page.bind(this));
        },
        showIsStudentQuestion: function(cancelCb) {
            var self = this,
                stanfordCard = App.Data.stanfordCard;

            if(!stanfordCard || !stanfordCard.get('needToAskStudentStatus') || App.Data.myorder.checkout.isDiningOptionOnline()) {
                return false;
            }

            App.Data.errors.alert('', false, false, {
                isConfirm: true,
                typeIcon: '',
                confirm: {
                    ok: _loc.YES,
                    cancel: _loc.NO
                },
                customView: new App.Views.StanfordCardView.StanfordCardStudentStatusView({
                    model: App.Data.stanfordCard
                }),
                callback: function(res) {
                    if(res) {
                        self.navigate('stanford_student_verification', true);
                    } else {
                        stanfordCard.set('needToAskStudentStatus', false);
                        typeof cancelCb == 'function' && cancelCb(); //self.navigate('confirm', true);
                    }
                }
            });

            return true;
        },
        establishment: function() {
            App.Data.establishments.trigger('loadStoresList');
        },
        /**
        * Remove HTML and CSS of current establishment in case if establishment ID will change.
        */
        removeHTMLandCSS: function() {
            App.Routers.RevelOrderingRouter.prototype.removeHTMLandCSS.apply(this, arguments);
            this.mainView && this.mainView.remove();
        },
    });


    // extends Router with Mobile mixing
    _.defaults(Router.prototype, App.Routers.MobileMixing);

    function showDefaultCardView() {
        var paymentProcessor = App.Data.settings.get_payment_process(),
            customer = App.Data.customer,
            showCCForm = customer.payments ? !customer.doPayWithToken() : true;
        if(paymentProcessor.credit_card_dialog && showCCForm) {
            this.navigate('card', true);
        } else {
            App.Data.myorder.trigger('payWithCreditCard');
        }
    }

    return new main_router(function() {
        defaultRouterData();
        App.Routers.Router = Router;
    });
});
