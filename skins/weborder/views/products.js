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

define(['products_view'], function(products_view) {
    'use strict';

    var ProductListItemView = App.Views.CoreProductView.CoreProductListItemView.extend({
        showModifiers: function(event, options) {
            var self = this,
                isStanfordItem = App.Data.is_stanford_mode && this.model.get('is_gift'),
                is_combo = this.model.isComboProduct(),
                has_upsell = this.model.isUpsellProduct();
            if (has_upsell) {
                return App.Data.controllers.get('UpsellProductCRL').addUpsellProduct(this.model);
            }

            var myorder = App.Models.create(is_combo ? 'MyorderCombo' : 'Myorder');
            var def = myorder.add_empty(this.model.get('id'), this.model.get('id_category'));

            this.addSpinner();
            def.then(function() {
                var mod, cache_id = is_combo ? myorder.get("id_product") : undefined,
                    clone = myorder.clone();

                self.removeSpinner();

                if (isStanfordItem)
                    mod = 'StanfordItem';
                else if (is_combo)
                    mod = 'MatrixCombo';
                else
                    mod = 'Matrix';

                App.Data.mainModel.set('popup', {
                    modelName: 'MyOrder',
                    mod: mod,
                    className: isStanfordItem ? 'stanford-reload-item' : '',
                    model: clone,
                    action: 'add',
                    init_cache_session: is_combo ? true : false,
                    cache_id: is_combo ? cache_id : undefined, //cache is enabled for combo products during the phase of product customization only
                                                              //the view will be removed from cache after the product is added/updated into the cart.
                    action_callback: function(status) {
                        if (status == "matrix_child_upsell") {
                            App.Data.controllers.get('UpsellProductCRL').addUpsellProduct(clone.get_product());
                        }
                    }
                });
            });
        },
        addSpinner: function() {
            $('#main-spinner').css('font-size', App.Data.getSpinnerSize() + 'px').addClass('ui-visible');
        },
        removeSpinner: function() {
            $('#main-spinner').removeClass('ui-visible');
        }
    });

    App.Controllers.UpsellProductCRL = Backbone.Model.extend({
        editUpsellProduct: function(myorder) {
            var self = this;

            LaunchRootEdit(myorder);

            function LaunchRootEdit(real, clone) {
                if (!clone)
                    clone = myorder.clone();
                App.Data.mainModel.set('popup', {
                    modelName: 'MyOrder',
                    mod: 'MatrixUpsellRoot',
                    model: clone,
                    action: 'update',
                    real: myorder,
                    action_callback: function(status) {
                        if (status == "Combo") {
                            LaunchUpsellComboEdit(myorder, clone);
                        }
                    }
                });
            }
            function LaunchUpsellComboEdit(real, clone) {
                var cache_id = real.get("id_product");
                App.Data.mainModel.set('popup', {
                    modelName: 'MyOrder',
                    mod: 'MatrixCombo',
                    model: clone,
                    real: myorder,
                    action: 'update',
                    init_cache_session: true,
                    cache_id: cache_id, //cache is enabled for combo products during the phase of product customization only
                                       //the view will be removed from cache after the product is added/updated into the cart.
                    action_callback: function(status) {
                        if (status == "BackToRoot") {
                            LaunchRootEdit(real, clone);
                        }
                    }
                });
            }
        },
        addUpsellProduct: function(model) {
            var self = this, def;

            LaunchRootNoUpsell();

            function LaunchRootNoUpsell(lastMyorder) {
                var myorder = App.Models.create('Myorder'),
                    def = myorder.add_empty(model.get('id'), model.get('id_category')),
                    clone;

                self.addSpinner();
                def.then(function() {
                    self.removeSpinner();
                    clone = myorder.clone();
                    if (lastMyorder){
                        clone.get_modifiers().update(lastMyorder.get_modifiers(), {silent: true});
                        clone.set('quantity', lastMyorder.get('quantity'), {silent: true});
                        clone.set('weight', lastMyorder.get('weight'), {silent: true});
                    }
                    clone.get('product').set('has_upsell', false, {silent: true});

                    App.Data.mainModel.set('popup', {
                        modelName: 'MyOrder',
                        mod: 'MatrixUpsellRoot',
                        model: clone,
                        action: 'add',
                        action_callback: function(status) {
                            if (status == "Combo") {
                                LaunchUpsellCombo(clone, lastMyorder);
                            }
                        }
                    });
                });
            }
            function LaunchUpsellCombo(old_root, myorder) {
                if (!myorder) {
                    myorder = App.Models.create('MyorderUpsell');
                    def = myorder.add_empty(model.get('id'), model.get('id_category'));
                } else {
                    def = (new $.Deferred).resolve();
                }

                self.addSpinner();
                def.then(function() {
                    self.removeSpinner();

                    var clone = myorder.clone(),
                        cache_id = myorder.get("id_product");

                    clone.get_modifiers().update(old_root.get_modifiers(), {silent: true});
                    clone.set('quantity', old_root.get('quantity'), {silent: true});
                    clone.set('weight', old_root.get('weight'), {silent: true});
                    clone.get('product').set('has_upsell', true, {silent: true});

                    App.Data.mainModel.set('popup', {
                        modelName: 'MyOrder',
                        mod: 'MatrixCombo',
                        model: clone,
                        action: 'add',
                        init_cache_session: true,
                        cache_id: cache_id, //cache is enabled for combo products during the phase of product customization only
                                           //the view will be removed from cache after the product is added/updated into the cart.
                        action_callback: function(status) {
                            if (status == "BackToRoot") {
                                LaunchRootNoUpsell(clone);
                            }
                        }
                    });
                    setTimeout(clone.trigger.bind(clone, 'combo_product_change'), 0);
                });
            }
        },
        addSpinner: function() {
            $('#main-spinner').css('font-size', App.Data.getSpinnerSize() + 'px').addClass('ui-visible');
        },
        removeSpinner: function() {
            $('#main-spinner').removeClass('ui-visible');
        }
    });

    var ProductPriceView = App.Views.FactoryView.extend({
        name: 'product',
        mod: 'price',
        initialize: function() {
            this.extendBindingSources({_product: this.model.get_product()});
            App.Views.FactoryView.prototype.initialize.apply(this, arguments);
        },
        bindings: {
            '.price': 'classes: {"gift-amount": giftMode, "product-price": not(giftMode)}, attr: {size: length(monetaryFormat(product_price)), \
                       readonly: not(giftMode)}, restrictInput: "0123456789.,", kbdSwitcher: select(_product_is_gift, "float", "text"), \
                       pattern: /^\\d{0,3}(\\.\\d{0,2})?$/',
            '.product-price': 'value: monetaryFormat(product_price)',
            '.gift-amount': 'value: monetaryFormat(price), events: ["input"]',
            '.currency': 'text: _system_settings_currency_symbol',
            '.price-wrapper': 'attr: {"data-amount": monetaryFormat(product_price)}, classes: {"product-price-wrapper": not(giftMode)}'
        },
        computeds: {
            giftMode: {
                deps: ['_product_is_gift', '_system_settings_online_orders'],
                get: function(isGift, onlineOrders) {
                    var modifiers = this.model.get_modifiers(),
                        not_size = modifiers && modifiers.getSizeModel() === undefined;
                    return isGift && onlineOrders && not_size;
                }
            },
            product_price: {
                deps: ['initial_price', '$model'],
                get: function() {
                    return this.model.get_total_product_price();
                }
            },
            price: {
                deps: ['product'],
                get: function() {
                    return this.model.get_product().get('price');
                },
                set: function(value) {
                    var product = this.model.get_product();

                    value = parseFloat(value);
                    if(!isNaN(value)) {
                        product.set('price', value);
                        //this.model.set('initial_price', value);
                    } else {
                        this.model.trigger('change:initial_price');
                    }
                }
            }
        }
    });

    var noImageMixin = {
        bindings: {
            '.img_wrapper': 'classes: {"no-photo": isDefaultImage(_product_image)}',
        },
        bindingFilters: {
            isDefaultImage: function(image) {
                return image == App.Data.settings.get_img_default();
            }
        }
    }
    var noTimetable = {
        _hide_timetable: true
    }
    var ProductModifiersView = App.Views.CoreProductView.CoreProductModifiersView.extend( noImageMixin );
    var ProductModifiersComboView = App.Views.CoreProductView.CoreProductModifiersComboView.extend( noImageMixin );
    var ProductModifiersUpsellView = App.Views.CoreProductView.CoreProductModifiersUpsellView.extend( noImageMixin ).mixed(noTimetable);

    return new (require('factory'))(products_view.initViews.bind(products_view), function() {
        App.Views.ProductView.ProductListItemView = ProductListItemView;
        App.Views.ProductView.ProductPriceView = ProductPriceView;
        App.Views.ProductView.ProductModifiersView = ProductModifiersView;
        App.Views.ProductView.ProductModifiersComboView = ProductModifiersComboView;
        App.Views.ProductView.ProductModifiersUpsellView = ProductModifiersUpsellView;
    });
});
