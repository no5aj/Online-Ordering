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
        headers.confirm = {mod: 'Confirm', className: 'confirm'};
        carts.main = {mod: 'Main', className: 'main animation'};
        carts.checkout = {mod: 'Checkout', className: 'checkout'};
        carts.confirm = {mod: 'Confirmation', className: 'confirm'};
    }

    var Router = App.Routers.RevelOrderingRouter.extend({
        routes: {
            "": "index",
            "index(/:data)": "index",
            "modifiers/:id_category(/:id_product)": "modifiers",
            "about": "about",
            "map": "map",
            "checkout(/:order_id)": "checkout",
            "pay": "pay",
            "confirm": "confirm",
            "profile_edit": "profile_edit",
            "profile_payments": "profile_payments",
            "past_orders": "past_orders",
            "maintenance": "maintenance",
            "loyalty_program": "loyalty_program",
            "establishment": "establishment",
            "*other": "index"
        },
        hashForGoogleMaps: ['map', 'checkout'],//for #index we start preload api after main screen reached
        use_google_captcha: true, //force to load google captcha library on startup
        initialize: function() {
            var settings = App.Settings;
            App.Data.get_parameters = parse_get_params(); // get GET-parameters from address line
            this.bodyElement = Backbone.$('body');
            this.bodyElement.append('<div class="main-container"></div>');

            // set locked routes if online orders are disabled
            if (!settings.online_orders) {
                this.lockedRoutes = ['checkout', 'pay', 'confirm'];
            }

            if (settings.dining_options instanceof Array) {
                // check available dining options and set default
                if (settings.dining_options.indexOf(DINING_OPTION.DINING_OPTION_TOGO) == -1 && settings.dining_options.indexOf(DINING_OPTION.DINING_OPTION_SHIPPING) == -1 && settings.dining_options.indexOf(DINING_OPTION.DINING_OPTION_OTHER) == -1) {
                    App.Data.settings.set({
                        'isMaintenance': true,
                        'maintenanceMessage': MAINTENANCE.ORDER_TYPE
                    });
                } else {
                    if (settings.dining_options.indexOf(DINING_OPTION.DINING_OPTION_TOGO) > -1) {
                        settings.default_dining_option = 'DINING_OPTION_TOGO';
                    }
                    else if (settings.dining_options.indexOf(DINING_OPTION.DINING_OPTION_SHIPPING) > -1) {
                        settings.default_dining_option = 'DINING_OPTION_SHIPPING';
                    }
                    else {
                        settings.default_dining_option = 'DINING_OPTION_OTHER';
                    }
                    App.Data.myorder.checkout.set('dining_option', settings.default_dining_option);
                }
            }

            // cancel requests to modifiers
            App.Collections.ModifierBlocks.init = function(product) {
                var a = $.Deferred();

                if(App.Data.modifiers[product] === undefined )
                    App.Data.modifiers[product] = new App.Collections.ModifierBlocks;

                a.resolve();
                return a;
            };

            // load main, header, footer necessary files
            this.prepare('main', function() {
                App.Views.Generator.enableCache = true;
                // set header, cart, main models
                App.Data.header = new App.Models.HeaderModel();
                App.Data.categories = new App.Collections.Categories();
                App.Data.searchLine = new (App.Models.SearchLine.extend({
                    initialize: function() {} //no change:searchString event listener
                }));
                App.Data.cart = new Backbone.Model({visible: false});
                App.Data.categorySelection = new App.Models.CategorySelection();
                App.Data.curProductsSet = new Backbone.Model({value: new App.Models.CategoryProductsPages()});
                App.Data.productsSets = new App.Collections.ProductsSets();
                App.Data.paymentMethods = new App.Models.PaymentMethods(App.Data.settings.get_payment_process());

                App.Data.paymentMethods.set('acceptableCCTypes', ACCEPTABLE_CREDIT_CARD_TYPES);

                var mainModel = App.Data.mainModel = new App.Models.MainModel({
                    isDirMode: App.Data.dirMode && !App.Data.isNewWnd,
                    clientName: window.location.origin.match(/\/\/([a-zA-Z0-9-_]*)\.?/)[1],
                    headerModel: App.Data.header,
                    cartCollection: App.Data.myorder,
                    cartModel: App.Data.cart,
                    categories: App.Data.categories,
                    searchLine: App.Data.searchLine
                });

                // init App.Data.sortItems
                this.initSortItems();

                mainModel.set('model', mainModel);

                // set clientName
                App.Data.establishments.getModelForView().set('clientName', mainModel.get('clientName'));

                // track main UI change
                this.listenTo(mainModel, 'change:mod', this.createMainView);

                this.onInitialized();
            });

            var checkout = App.Data.myorder.checkout;
            checkout.trigger("change:dining_option", checkout, checkout.get("dining_option"));

            this.on('route', function() {
                // can be called when App.Data.mainModel is not initializd yet ('back' btn in browser history control)
                App.Data.mainModel && App.Data.mainModel.trigger('onRoute');
                App.Data.errors.trigger('hideAlertMessage'); // hide user notification
            });

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
            // 'change:subCategory' event occurs when any subcategory is clicked
            this.listenTo(App.Data.categorySelection, 'change:subCategory', function(model, value) {
                // don't call this.showProducts() for default value
                if (value !== model.defaults.subCategory) {
                    model.set('subCategorySaved', value);
                    this.showProducts(value);
                }
            });

            // 'searchString' event occurs when a search text field is filled out
            this.listenTo(App.Data.searchLine, 'change:searchString', function(model, value) {
                model = model;
                var subCategorySaved = App.Data.categorySelection.get('subCategorySaved');

                if (!value) {
                    subCategorySaved && App.Data.categorySelection.set('subCategory', subCategorySaved, {doNotUpdateState: true});
                    return;
                }

                // to go #index
                App.Data.header.trigger('onShop');

                var key = btoa(value),
                    productSet = App.Data.productsSets.get(key),
                    searchModel, productsAttr;

                if (!productSet) {
                    productSet = App.Data.productsSets.add({
                            id: key,
                            name: _loc.SEARCH_RESULTS.replace(/%s/g, value),
                            pattern: value
                        });
                }

                App.Data.curProductsSet.set('value', productSet); //the first page should be loaded on change:searchString event in SearchLine model
                App.Data.categorySelection.set('subCategory', App.Data.categorySelection.defaults.subCategory, {doNotUpdateState: true});
            });

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

                    var view = new App.Views.GeneratorView.create('StanfordCard', {
                        mod: 'StudentStatus',
                        model: stanfordCard,
                        className: 'stanford-student-status'
                    });

                    App.Data.errors.alert('', false, false, {
                        isConfirm: true,
                        typeIcon: '',
                        confirm: {
                            ok: _loc.YES,
                            cancel: _loc.NO
                        },
                        customView: view,
                        callback: function(res) {
                            if (res) {
                                view.yes();
                            } else {
                                view.no();
                            }
                        }
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
                var view = new App.Views.GeneratorView.create('StanfordCard', {
                    mod: 'Popup',
                    model: App.Data.stanfordCard,
                    myorder: App.Data.myorder,
                    className: 'stanford-student-card text-left'
                });

                App.Data.errors.alert('', false, false, {
                    isConfirm: true,
                    typeIcon: '',
                    confirm: {
                        ok: _loc.YES,
                        cancel: _loc.CANCEL
                    },
                    customView: view,
                    callback: function(res) {
                        if (res) {
                            view.submit();
                        } else {
                            view.cancel();
                        }
                    }
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

            // onShop event occurs when 'Shop' item is clicked or search line is filled out
            this.listenTo(App.Data.header, 'onShop', function() {
                if (location.hash.indexOf("#index") == -1) {
                    this.navigate('index', true);
                }
            });

            // onMenu event occurs when 'Return to Menu'
            this.listenTo(App.Data.mainModel, 'onMenu', this.navigate.bind(this, 'index', true));

            // onMenu event occurs when 'Return to Checkout'
            this.listenTo(App.Data.mainModel, 'onCheckout', this.navigate.bind(this, 'checkout', true));

            // onAbout event occurs when 'About' item is clicked
            this.listenTo(App.Data.header, 'onAbout', this.navigate.bind(this, 'about', true));

            // onMap event occurs when 'Map' item is clicked
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

            // onCart event occurs when 'cart' item is clicked
            this.listenTo(App.Data.header, 'onCart', function() {
                if(App.Settings.online_orders) {
                    App.Data.cart.set('visible', true);
                }
            });

            // onItemEdit event occurs when cart item's 'edit' button is clicked
            this.listenTo(App.Data.myorder, 'onItemEdit', function(model) {
                var index = App.Data.myorder.indexOf(model);
                index > -1 && this.navigate('modifiers/' + index, true);
            });

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
                    var clone = rewardsCard.clone(),
                        view = new App.Views.GeneratorView.create('Rewards', {
                            mod: 'Info',
                            model: clone,
                            collection: App.Data.myorder,
                            balance: clone.get('balance'),
                            rewards: clone.get('rewards'),
                            discounts: clone.get('discounts'),
                            className: 'rewards-info'
                        });

                    App.Data.errors.alert('', false, false, {
                        isConfirm: true,
                        typeIcon: '',
                        confirm: {
                            ok: _loc.REWARDS_APPLY,
                            cancel: _loc.CANCEL
                        },
                        customView: view,
                        callback: function(res) {
                            res && view.apply();
                        }
                    });
                }

                App.Data.mainModel.trigger('loadCompleted');
            });

            // onApplyRewardsCard event occurs when Rewards Card's 'Apply' button is clicked on #checkout page
            this.listenTo(App.Data.myorder.rewardsCard, 'onApplyRewardsCard', function() {
                var rewardsCard = App.Data.myorder.rewardsCard,
                    customer = App.Data.customer,
                    view;

                if (!rewardsCard.get('number') && customer.isAuthorized() && customer.get('rewardCards').length) {
                    rewardsCard.set('number', customer.get('rewardCards').at(0).get('number'));
                }

                view = new App.Views.GeneratorView.create('Rewards', {
                    mod: 'Card',
                    model: rewardsCard,
                    customer: customer,
                    className: 'rewards-info'
                });

                App.Data.errors.alert('', false, false, {
                    isConfirm: true,
                    typeIcon: '',
                    confirm: {
                        ok: _loc.CONTINUE,
                        ok_disabled: true,
                        cancel: _loc.CANCEL
                    },
                    customView: view,
                    callback: function(res) {
                        res && view.submit();
                    },
                    initialize: function(alertView) {
                        alertView.listenTo(rewardsCard, 'change:number change:captchaValue', function(model) {
                            var hasCaptchaValue = Boolean(model.get('captchaValue')),
                                hasNumber = Boolean(model.get('number'));

                            alertView.model.set('btnDisabled1', !(hasNumber && hasCaptchaValue));
                        });
                    }
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
        encodeState: function(data) {
            var enc = '';
            try {
                // encode data for hash and update this.state
                enc = JSON.stringify(data);
                this.state = data;
            } catch(e) {
                log('Unable to encode state for object ', data);
            }
            return btoa(enc);
        },
        decodeState: function(data) {
            var state = null;
            try {
                // decode data from hash and restore
                state = JSON.parse(atob(data));
            } catch(e) {
                log('Unable to decode state for string "%s"', data);
            }
            return state;
        },
        /**
         * Enable browser history for navigation through categories, subcategories, filters and search screens.
         */
        runStateTracking: function() {
            if(!App.Routers.RevelOrderingRouter.prototype.runStateTracking.apply(this, arguments)) {
                return;
            }

            // listen to sorting method change to add new entry to browser history
            this.listenTo(App.Data.sortItems, 'change:selected', function(model, value, opts) {
                value && updateStateWithHash.call(this, opts);
            });

            // listen to subcategory change to add new entry to browser history
            this.listenTo(App.Data.categorySelection, 'change:subCategory', function(model, value, opts) {
                updateStateWithHash.call(this, opts);
            }, this);

            // listen to search line change to add new entry to browser history
            this.listenTo(App.Data.searchLine, 'change:searchString', function(model, value, opts) {
                updateStateWithHash.call(this, opts);
            }, this);

            function updateStateWithHash(opts) {
                if (!_.isObject(opts) || !opts.doNotUpdateState) {
                    this.updateStateWithHash(opts.replaceState);
                }
            }

            return true;
        },
        /**
         * Push data changes to browser history entry adding current state to hash.
         * @param {boolean} replaceState - If true, replace the current state, otherwise push a new state.
         */
        updateStateWithHash: function(replaceState) {
            var encoded = this.encodeState(this.getState()),
                hashRE = /#.*$/,
                url = hashRE.test(location.href) ? location.href.replace(hashRE, '#index/' + encoded) : location.href + '#index/' + encoded;
            this.updateState(replaceState, url);
        },
        /**
         * Restore state data from the history.
         * @param {Object} event - PopStateEvent.
         */
        restoreState: function(event) {
            var est = App.Data.settings.get('establishment'),
                hashData = location.hash.match(/^#index\/(\w+)/), // parse decoded state string from hash
                mainRouterData, isSearchPatternPresent, state, data;

            if(Array.isArray(hashData) && hashData[1].length) {
                state = this.decodeState(hashData[1]);
            }

            // set data as parsed state
            data = state;

            // need execute App.Routers.MainRouter.prototype.restoreState to handle establishment changing
            mainRouterData = event instanceof Object && event.state
                ? App.Routers.RevelOrderingRouter.prototype.restoreState.apply(this, arguments)
                : App.Routers.RevelOrderingRouter.prototype.restoreState.call(this, {state: {stateData: data}});

            data = data || mainRouterData;

            if(!_.isObject(data) || est != data.establishment) {
                return;
            }

            _.isObject(data.categories) && App.Data.categorySelection.set(data.categories, {doNotUpdateState: true});
            _.isObject(data.searchLine) && App.Data.searchLine.set(data.searchLine, {doNotUpdateState: true});
            data.sort && App.Data.sortItems.checkItem('id', data.sort, {doNotUpdateState: true});
        },
        /**
         * Returns the current state data.
         * @return {Object} The object containing information about the current app state.
         */
        getState: function() {
            var categorySelection = App.Data.categorySelection,
                searchLine = App.Data.searchLine,
                sortItem = App.Data.sortItems && App.Data.sortItems.getCheckedItem(),
                data = {},
                hash = location.hash;

            // if hash is present but isn't index, need to return default value
            if(hash && !/^#index/i.test(hash) || !categorySelection || !searchLine) {
                return App.Routers.MobileRouter.prototype.getState.apply(this, arguments);
            }

            data.sort = sortItem.get('id');

            data.searchLine = {
                searchString: searchLine.get('searchString'),
                collapsed: searchLine.get('collapsed')
            };

            data.categories = {
                parentCategory: categorySelection.get('parentCategory'),
                subCategory: categorySelection.get('subCategory')
            };

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
        index: function(data) {
            this.prepare('index', function() {
                var categories = App.Data.categories,
                    dfd = $.Deferred(),
                    self = this;

                this.createCategoriesTree();

                categories.receiving.then(function() {
                    // After restoring state an establishment may be changed.
                    // In this case need abort execution of this callback to avoid exceptions in console
                    if(!Backbone.History.started) {
                        return;
                    }
                    self.updateStateWithHash(this); // update hash
                    dfd.resolve();
                    self.restore = $.Deferred();
                });

                App.Data.header.set('menu_index', 0);
                App.Data.mainModel.set('mod', 'Main');
                App.Data.cart.set('visible', false);

                App.Data.mainModel.set({
                    header: headers.main,
                    cart: carts.main,
                    content: [
                        {
                            modelName: 'Sidebar',
                            mod: 'Main',
                            categoriesTree: App.Data.categoriesTree,
                            curProductsSet: App.Data.curProductsSet,
                            categorySelection: App.Data.categorySelection,
                            className: 'left-sidebar primary-border'
                        },
                        {
                            modelName: 'Product',
                            model: App.Data.curProductsSet,
                            sortItems: App.Data.sortItems,
                            mod: 'CategoryList',
                            className: 'products-view'
                        }
                    ]
                });

                this.preparePromotions();

                dfd.then(function() {
                    // change page
                    self.change_page(function() {
                        App.Data.mainModel.set('needShowStoreChoice', true);
                    });
                    //start preload google maps api:
                    App.Data.settings.load_geoloc();
                });
            });
        },
        modifiers: function(category_id, product_id) {
            var isEditMode = !product_id,
                isInitialized = this.initialized,
                order = isEditMode ? App.Data.myorder.at(category_id) : new App.Models.Myorder(),
                self = this,
                dfd, needToPredefine;

            if (!order) {
                return this.navigate('index', true);
            }

            if (isEditMode) {
                dfd = Backbone.$.Deferred();
                dfd.resolve();
            } else {
                dfd = order.add_empty(product_id * 1, category_id * 1);
                needToPredefine = true;
            }

            this.prepare('modifiers', function() {
                App.Data.header.set('menu_index', null);
                App.Data.mainModel.set('mod', 'Main');
                App.Data.cart.set('visible', false);
                dfd.then(showProductModifiers);

                function showProductModifiers() {
                    var _order = order.clone(),
                        content;

                    if (needToPredefine && !Array.isArray(App.Data.categorySelection.get('subCategory')) && App.Data.curProductsSet.get('value')) {
                        App.Data.curProductsSet.get('value').predefineAttributes(_order);
                    }

                    content = {
                        modelName: 'MyOrder',
                        mod: 'ItemCustomization',
                        className: 'myorder-item-customization',
                        model: _order,
                        ui: new Backbone.Model({isAddMode: !isEditMode}),
                        myorder: App.Data.myorder,
                        action: action,
                        back: cancel,
                        doNotCache: true
                    };

                    App.Data.mainModel.set({
                        header: headers.main,
                        cart: carts.main,
                        content: content
                    });

                    self.change_page();

                    function action() {
                        var check = _order.check_order();

                        if (check.status === 'OK') {
                            if (App.Data.is_stanford_mode) {
                                successfulValidation();
                            } else {
                                _order.get_product().check_gift(successfulValidation, function(errorMsg) {
                                    App.Data.errors.alert(errorMsg); // user notification
                                });
                            }
                        } else {
                            App.Data.errors.alert(check.errorMsg); // user notification
                        }
                    }

                    function cancel() {
                        isInitialized ? window.history.back() : App.Data.mainModel.trigger('onMenu');
                    }

                    function successfulValidation() {
                        if (isEditMode) {
                            order.update(_order);
                        } else {
                            App.Data.myorder.add(_order);

                            // Show notification
                            var product = _order.get_product();

							App.NotificationManager.create({
                                model: new Backbone.Model({
                                    image: product.get('image'),
                                    title: _loc.CART_ITEM_ADDED,
                                    text: product.get('name')
                                })
                            });
                        }
                        cancel();
                    }
                }
            });
        },
        about: function() {
            this.prepare('about', function() {
                if (!App.Data.aboutModel) {
                    App.Data.aboutModel = new App.Models.AboutModel();
                }
                App.Data.header.set('menu_index', 1);
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

                App.Data.header.set('menu_index', 2);
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
            App.Data.header.set('menu_index', null);
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
                        className: 'checkout-page',
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
                        stanfordcard: App.Data.stanfordCard,
                        promises: this.getProfilePaymentsPromises.bind(this),
                        needShowBillingAddess: PaymentProcessor.isBillingAddressCard()
                    }
                });

                App.Data.cart.set('visible', true);

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
            App.Data.header.set('menu_index', null);

            this.prepare('confirm', function() {
                // if App.Data.customer doesn't exist (success payment -> history.back() to #checkout -> history.forward() to #confirm)
                // need to init it.
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
                        discount: this.recentOrder.discount.clone()
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
                App.Data.cart.set('visible', true);
                this.change_page();
            });
        },
        maintenance: function() {
            var settings = App.Data.settings,
                mainModel = App.Data.mainModel;
            if (settings.get('isMaintenance')) {
                App.Data.mainModel.set({
                    mod: 'Maintenance',
                    errMsg: ERROR[settings.get('maintenanceMessage')],
                    className: 'maintenance'
                });
            }
            this.change_page(mainModel.set.bind(mainModel, 'needShowStoreChoice', true));
            App.Routers.RevelOrderingRouter.prototype.maintenance.apply(this, arguments);
        },
        profile_edit: function() {
            App.Data.header.set('menu_index', null);
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
            App.Data.header.set('menu_index', null);
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
            App.Data.header.set('menu_index', null);
            App.Data.mainModel.set({
                mod: 'Main',
                header: headers.main,
                cart: carts.main
            });

            var req = this.setPastOrdersContent();

            if (!req) {
                return this.navigate('index', true);
            } else {
                req.always(this.change_page.bind(this));
            }
        },
        createCategoriesTree: function() {
            if (App.Data.categoriesTree) {
                return;
            }

            var tree = App.Data.categoriesTree = new App.Collections.Tree(),
                categories = App.Data.categories,
                categorySelection = App.Data.categorySelection,
                searchLine = App.Data.searchLine,
                self = this,
                lastSelected;

            // remember last selected subcategory to deselect it after new selection
            // and update selected 'subCategory' and 'parentCategory' values
            this.listenTo(tree, 'onItemSelected', function(model, value) {
                if (value) {
                    lastSelected && lastSelected.set('selected', false);
                    lastSelected = model;
                    categorySelection.set({
                        subCategory: model.get('id'),
                        parentCategory: model.get('parent_id')
                    });
                }
            });

            // Need to update tree when 'subCategory' updates.
            this.listenTo(categorySelection, 'change:subCategory', function(model, value) {
                var item = tree.getItem('id', value, true);
                item && item.set({
                    selected: true,
                    expanded: true
                });
                // clear tree item selection
                if (value === model.defaults.subCategory && lastSelected) {
                    lastSelected.set('selected', false);
                    lastSelected = undefined;
                };
            });

            // need to update tree when 'parentCategory' updates
            this.listenTo(categorySelection, 'change:parentCategory', function(model, value) {
                var item = tree.getItem('id', value, true);
                item && item.set('expanded', true);
            });

            // once categories are loaded need to add them to tree collection
            categories.receiving = categories.get_categories();
            categories.receiving.always(setCategoriesItems);

            function setCategoriesItems() {
                var selected, parent_selected, data;

                // need to abort execution in case of empty categories collection
                if (!categories.length) {
                    return;
                }

                // need to convert categories collection to array of tree items.
                data = _.toArray(_.mapObject(categories.groupBy('parent_id'), function(value, key) {
                    var sub_categories = _.pluck(value, 'id');
                    // All subcategories are shown always even though a parent category has the only one subcategory - Bug 50941 (customer modernconcept.revelup.com)
                    return {
                        id: sub_categories,                       // array of sub categories ids used to show all products
                        parent_id: sub_categories,                // array of sub categories ids used to show all products
                        name: value[0].get('parent_name'),        // parent category name
                        parent_name: value[0].get('parent_name'), // parent category name
                        sort: value[0].get('parent_sort'),        // parent category sort
                        items: value.map(function(item) {
                            return _.extend(item.toJSON(), {parent_id: sub_categories});
                        }) // sub categories
                    };
                }));

                // add global "View all" item
                data.push({
                    id: [],
                    parent_id: [],
                    name: _loc.SUBCATEGORIES_VIEW_ALL,
                    parent_name: _loc.SUBCATEGORIES_VIEW_ALL,
                    sort: -1,
                    items: []
                });

                // and reset 'tree' collection with adding new data
                tree.reset(data);
                // init state
                initState();
            }

            function initState() {
                // restore state if #index/<data> exists
                self.restoreState({});
                // if searchLine and categorySelection contain default attributes need to select first subcategory replacing state.
                if (!searchLine.get('searchString') && categorySelection.areDefaultAttrs()) {
                    categorySelection.set({
                        parentCategory: tree.at(0).get('id'),
                        subCategory: tree.at(0).get('id'),
                    }, {
                        replaceState: true
                    });
                }
            }
        },
        showProducts: function(ids) {
            var self = this,
                isCached = false,
                treeItem = App.Data.categoriesTree.getItem('id', ids, true),
                ignoreFilters = Array.isArray(ids),
                productSet, key;

            ids = Array.isArray(ids) ? ids : [ids];
            key = ids.join();

            if (treeItem) {
                name = Array.isArray(treeItem.get('id')) ? treeItem.get('parent_name') : treeItem.get('name');
            }

            if (productSet = App.Data.productsSets.get(key)) {
                isCached = true;
            } else {
                productSet = App.Data.productsSets.add({id: key});
                productSet.set('name', name);
                productSet.set('ids', ids);
            }
            App.Data.curProductsSet.set('value', productSet);
        },
        /**
         * Creates App.Data.sortItem collection.
         */
        initSortItems: function() {
            var sortItems = [
                // Sort by Default
                {
                    id: 1,
                    name: _loc.SORT_BY_DEFAULT,
                    sortStrategy: 'sortNumbers',
                    sortKey: 'sort_value',
                    sortOrder: 'asc',
                    selected: true
                },
                // Sort by New Arrivals
                {
                    id: 2,
                    name: _loc.SORT_BY_NEW_ARRIVALS,
                    sortStrategy: 'sortNumbers',
                    sortKey: 'created_date',
                    sortOrder: 'desc'
                },
                // Sort by Price: Low to High
                {
                    id: 3,
                    name: _loc.SORT_BY_LOW_TO_HIGH,
                    sortStrategy: 'sortNumbers',
                    sortKey: 'price',
                    sortOrder: 'asc'
                },
                // Sort by Price: High to Low
                {
                    id: 4,
                    name: _loc.SORT_BY_HIGH_TO_LOW,
                    sortStrategy: 'sortNumbers',
                    sortKey: 'price',
                    sortOrder: 'desc'
               }
            ];

            App.Data.sortItems = new App.Collections.SortItems(sortItems);
        },
        loyalty_program: function() {
            App.Data.header.set('menu_index', null);
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

    function log() {
        // IE 10: console doesn't have debug method
        typeof console.debug == 'function' && console.debug.apply(console, arguments);
    }

    return new main_router(function() {
        defaultRouterData();
        App.Routers.Router = Router;
    });
});
