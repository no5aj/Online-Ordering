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

define(["products_view"], function(products_view) {
    'use strict';

    var ProductModifiersView = App.Views.FactoryView.extend({
        name: 'product',
        mod: 'modifiers',
        bindings: {
            '.price': 'classes: {"gift-amount": giftMode, "product-price": not(giftMode)}, attr: {size: length(monetaryFormat(product_price)), readonly: not(giftMode)}, restrictInput: "0123456789.,", kbdSwitcher: select(_product_is_gift, "float", "text"), pattern: /^\\d{0,3}(\\.\\d{0,2})?$/',
            '.product-price': 'value: monetaryFormat(product_price)',
            '.gift-amount': 'value: monetaryFormat(price), events: ["input"]',
            '.currency': 'text: _system_settings_currency_symbol, toggle: not(uom)',
            '.uom': 'text: uom, toggle: uom',
            '.title': 'text: _product_name',
            '.desc': 'text: _product_description, toggle: _product_description',
            '.timetable': 'toggle: _product_timetables',
            '.timetable span': 'text: _product_timetables',
            '.gift-card': 'classes: {hidden: not(all(_product_is_gift, _system_settings_online_orders))}',
            '.gift-card-number': 'value: _product_gift_card_number, events: ["input"], restrictInput: "0123456789-", kbdSwitcher: "cardNumber", pattern: /^[\\d|-]{0,19}$/',
            '.size_chart_wrapper': 'toggle: _product_size_chart',
            '.size_chart': 'attr: {href: _product_size_chart}'
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
            uom: {
                deps: ['_system_settings_scales', '_product_sold_by_weight'],
                get: function(scales, sold_by_weight) {
                    return scales.default_weighing_unit && sold_by_weight ? '/ ' + scales.default_weighing_unit : false;
                }
            },
            product_price: {
                deps: ['initial_price', "_product_combo_price"],
                get: function() {
                    return this.model.get_product_price();
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
        },
        initialize: function() {
            this.extendBindingSources({_product: this.model.get_product()});
            App.Views.FactoryView.prototype.initialize.apply(this, arguments);
        }
    });

    var ProductModifiersComboView  = ProductModifiersView.extend({
        initialize: function() {
            ProductModifiersView.prototype.initialize.apply(this, arguments);
        }
    });

    var ProductModifiersUpsellView  = ProductModifiersView.extend({
        initialize: function() {
            var self = this;
            ProductModifiersView.prototype.initialize.apply(this, arguments);
        },
        bindings: {
            '.customize': 'classes:{hide:not(is_modifiers)}',
            '.no_combo_link': 'classes:{hide:not(is_no_combo_link)}'
        },
        events: {
            'click .customize': 'customize',
            'click .no_combo_link': 'no_combo'
        },
        computeds: {
            is_modifiers: function() {
                return this.model.get_modifiers().length > 0;
            },
            is_no_combo_link: function() {
                return this.options.action === 'add';
            },
            product_price: {
                deps: ['initial_price', "_product_combo_price", "$model"],
                get: function() {
                    var modifiers_price = this.model.get_sum_of_modifiers();
                    return round_monetary_currency(this.model.get_product_price() + modifiers_price);
                }
            }
        },
        customize: function() {
            App.Data.router.combo_child_products(this.model, this.model.get("id_product"));
        },
        no_combo: function() {
            App.Data.router.modifiers(this.model.get('product').get('id_category'), this.model.get("id_product"), {no_combo: true, combo_root: this.model});
        }
    });

    var ProductListItemView = App.Views.FactoryView.extend({
        name: 'product',
        mod: 'list_item',
        tagName: 'li',
        bindings: {
            ':el': 'toggle: active',
            '.title': 'text: name', //'text: format("$1 sort $2", name, sort)',
            '.desc': 'text: description, toggle: not(_system_settings_hide_products_description)',
            '.price': 'text: select(sold_by_weight, weightFormat(price), currencyFormat(price))'
        },
        events: {
            "click": "showModifiers"
        },
        showModifiers: function(e) {
            e.preventDefault();
            var id_category = this.model.get('id_category'),
                id = this.model.get('id');
            var has_combo = this.model.isComboBased();
            if (has_combo) {
                if (this.model.isUpsellProduct()) {
                    App.Data.router.navigate("upsell_product/" + id_category + "/" + id, true);
                } else {
                    App.Data.router.navigate("combo_product/" + id_category + "/" + id, true);
                }
            }
            else
                App.Data.router.navigate("modifiers/" + id_category + "/" + id, true);
        }
    });

    var ProductListView = App.Views.LazyListView.extend({
        name: 'product',
        mod: 'list'
    });

    var ProductSearchListView = ProductListView.extend({
        name: 'product',
        mod: 'list',
        initialize: function() {
            this.defaultCollection = this.collection;
            setTimeout(this.swipeDetectInitialize.bind(this), 0);
            ProductListView.prototype.initialize.apply(this, arguments);
            this.listenTo(this.options.search, 'onSearchComplete', this.update_table, this);
            this.listenTo(this.model, 'change:isShow', this.update_search_line, this);
            this.showSearchLine();
        },
        swipeDetectInitialize: function() {
            var self = this;
            this.swipe_surface = this.$el[0];
            this.swipe_up_threshold = this.$("li").outerHeight() * 2;
            this.lastScrollTop = this.swipe_surface.scrollTop;
            swipe_detect(this.swipe_surface,  function(swipedir){
                    //swipedir contains either "none", "left", "right", "up", or "down"
                    if (swipedir =='down') {
                        var is_show = self.model.get('isShow') == true;
                        if (!is_show && self.swipe_surface.scrollTop <= self.swipe_up_threshold * 2) {
                           self.model.set('isShow', true);
                        }
                    }
                });
        },
        onScroll: function(event) {
            if (this.swipe_surface.scrollTop != 0) {//don't loose a focus on the list initialization phase
                setTimeout(function(){
                    $("#search-input").blur();//remove the focus out from search bar on scrolling
                }, 0);
            }

            if (!this.scrollTimer && this.model.get('isShow') && this.lastScrollTop < this.swipe_surface.scrollTop &&
                 this.swipe_surface.scrollTop > this.swipe_up_threshold) {
                this.scrollTimer = setTimeout((function(){
                    this.scrollTimer = null;
                    if (!$("#search-input").is(':focus') && this.model.get("searchString").length > 0
                        && this.swipe_surface.scrollTop > this.swipe_up_threshold) {  //don't hide the input which is in focus or close to the top of the scroll
                        this.model.set('isShow', false);
                    }
                }).bind(this), 4000);
            }
            this.lastScrollTop = this.swipe_surface.scrollTop;
            App.Views.LazyListView.prototype.onScroll.apply(this, arguments);
        },
        killScrollTimer: function() {
            if (this.scrollTimer) {
                clearTimeout(this.scrollTimer);
                this.scrollTimer = null;
            }
        },
        update_search_line: function(){
            this.model.get('isShow') ? this.showSearchLine() : this.hideSearchLine();
        },
        showSearchLine: function() {
            this.killScrollTimer();
            $('.content.search_list').animate({top: "8.7em"}, 300);
            $('.content .search_wrap').animate({top: "0em"}, 300);
        },
        hideSearchLine: function() {
            this.killScrollTimer();
            $('.content.search_list').animate({top: "0em"}, 400);
            $('.content .search_wrap').animate({top: "-8.7em"}, 400);
        },
        update_table: function(model) {
            this.collection = model ? model.get('products') : this.defaultCollection;
            this.render();
        }
    });

    return new (require('factory'))(products_view.initViews.bind(products_view), function() {
        App.Views.ProductView.ProductModifiersView = ProductModifiersView;
        App.Views.ProductView.ProductModifiersComboView = ProductModifiersComboView;
        App.Views.ProductView.ProductModifiersUpsellView = ProductModifiersUpsellView;
        App.Views.ProductView.ProductListItemView = ProductListItemView;
        App.Views.ProductView.ProductListView = ProductListView;
        App.Views.ProductView.ProductSearchListView = ProductSearchListView;
    });
});