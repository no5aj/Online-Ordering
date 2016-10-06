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

    var ProductListItemView = App.Views.CoreProductView.CoreProductListItemView.extend({
        tagName: 'li',
        className: 'product-item',
        bindings: {
            ':el': 'attr: {tabindex: 0}, classes: {hide: not(active)}'
        }
    });

    var ProductListView = App.Views.FactoryView.extend({
        name: 'product',
        mod: 'list',
        bindings: {
            '.products-set-title': 'text: name',
            '.products': 'collection: $collection, itemView: "createItemView"',
            '.loading': 'toggle: equal(status, "pending")'
        },
        createItemView: function(options) {
            var view = App.Views.GeneratorView.create('Product', {
                mod: 'ListItem',
                model: options.model
            }, options.model.get("compositeId"));

            // Bug #51296
            // Essentially, when we call .reset(models) Epoxy Collection handler calls .remove()
            // (for each view associated with the collection) which removes the element from the DOM,
            // as well as, all associated events from the event hash that were bound to the element.
            // Backbone's View element still contains the ".el", but upon re-inserting in the DOM,
            // the jQuery element has lost all of its bound listeners.
            // .delegateEvents() takes "events: {...}" declaration for the view instances,
            // and binds the specified events to the specified DOM elements.
            view.delegateEvents();

            return view;
        }
    });

    var ProductCategoryListView = App.Views.FactoryView.extend({
        name: 'product',
        mod: 'category_list',
        initialize: function() {
            App.Views.FactoryView.prototype.initialize.apply(this, arguments);
            this.listenTo(this.model, "change:value", this.updatePageView, this);
        },
        updatePageView: function() {
            this.model.get('value').loadProductsPage();//loading first page
        },
        bindings: {
            '.products-box': 'updateContent: productSet',
            '.sort-menu': 'updateContent: sortItemsView',
            '.pages_ctrl_container': 'updateContent: PagesCtrlView'
        },
        computeds: {
            productSet: {
                deps: ['value'],
                get: function(productSet) {
                    return {
                        name: 'Product',
                        mod: 'List',
                        model: productSet,
                        collection: productSet.get('products_page'),
                        viewId: productSet.id,
                        subViewIndex: 0
                    };
                }
            },
            sortItemsView: function() {
                var sortItems = this.getBinding('$sortItems');
                return {
                    name: 'Sort',
                    mod: 'Items',
                    collection: sortItems,
                    el: this.$('.sort-menu'),
                    viewId: sortItems.id,
                    subViewIndex: 1
                }
            },
            PagesCtrlView: {
                deps: ['value'],
                get: function(productSet) {
                    return {
                        name: 'Pages',
                        mod: 'Main',
                        model: productSet.pageModel,
                        className: "products_pages_control",
                        viewId: productSet.get('id'),
                        subViewIndex: 2
                    }
                }
            }
        }
    });

    var ProductImagesView = App.Views.FactoryView.extend({
        name: 'product',
        mod: 'images',
        events: {
            'click .thumbnail': 'showImage'
        },
        onEnterListeners: {
            '.thumbnail': 'showImage'
        },
        render: function() {
            App.Views.FactoryView.prototype.render.apply(this, arguments);
            loadSpinner(this.$('.img'));
            this.showImage({
                currentTarget: this.$('.images > li:first')
            });

            return this;
        },
        showImage: function(event) {
            var images = this.model.get('images'),
                li = $(event.currentTarget),
                index = li.attr('data-index'),
                image = this.$('.large');
            image.attr('src', images[index]);
            loadSpinner(image);
            this.$('.images > li').removeClass('active');
            li.addClass('active');
        }
    });

    var ProductTitleView = App.Views.FactoryView.extend({
        name: 'product',
        mod: 'title',
        bindings: {
            '.price': 'text: select(product_sold_by_weight, weightFormat(initial_price), currencyFormat(initial_price))',
            '.name': 'text: product_name',
            '.size_chart': 'toggle: product_size_chart, attr: {href: product_size_chart}'
        }
    });

    var ProductDescriptionView = App.Views.FactoryView.extend({
        name: 'product',
        mod: 'description'
    });

    var ProductGiftCardReloadView = App.Views.FactoryView.extend({
        name: 'product',
        mod: 'gift_card_reload',
        bindings: {
            '.amount': 'value: monetaryFormat(price), events: ["change"], trackCaretPosition: price, restrictInput: "0123456789.,", kbdSwitcher: "float", pattern: /^\\d{0,3}(\\.\\d{0,2})?$/',
            '.card-number': 'value: gift_card_number, events: ["input"], restrictInput: "0123456789-", kbdSwitcher: "cardNumber", pattern: /^[\\d|-]{0,19}$/',
            '.logo': 'attr: {style: showLogo(_system_settings_logo_img)}',
            '.action_button': 'classes: {disabled: any(not(decimal(price)), not(gift_card_number))}, text: select(ui_isAddMode, _lp_MYORDER_ADD_TO_BAG, _lp_MYORDER_UPDATE_ITEM)'
        },
        bindingFilters: {
            showLogo: function(url) {
                if (typeof url != 'string') {
                    return '';
                }
                return 'background-image: url(%s);'.replace('%s', url);
            }
        },
        events: {
            'click .action_button:not(.disabled)': 'action'
        },
        onEnterListeners: {
            '.action_button:not(.disabled)': 'action'
        },
        action: function() {
            var action = this.options.action;
            typeof action == 'function' && action();
        }
    });

    return new (require('factory'))(products_view.initViews.bind(products_view), function() {
        App.Views.ProductView.ProductListItemView = ProductListItemView;
        App.Views.ProductView.ProductListView = ProductListView;
        App.Views.ProductView.ProductCategoryListView = ProductCategoryListView;
        App.Views.ProductView.ProductImagesView = ProductImagesView;
        App.Views.ProductView.ProductTitleView = ProductTitleView;
        App.Views.ProductView.ProductDescriptionView = ProductDescriptionView;
        App.Views.ProductView.ProductGiftCardReloadView = ProductGiftCardReloadView;
    });
});
