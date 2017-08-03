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

define(["backbone", "factory"], function(Backbone) {
    'use strict';

    var HeaderMainView = App.Views.FactoryView.extend({
        name: 'header',
        mod: 'main',
        bindings: {
            '.shop': 'classes: {active: equal(menu_index, 0)}, attr: {tabindex: select(equal(menu_index, 0), -1, 0)}',
            '.about': 'classes: {active: equal(menu_index, 1)}, attr: {tabindex: select(equal(menu_index, 1), -1, 0)}',
            '.map': 'classes: {active: equal(menu_index, 2)}, attr: {tabindex: select(equal(menu_index, 2), -1, 0)}',
            '.cart-box': 'classes: {link: ui_quantity}',
            '.cart-qty': 'text: format("($1)", ui_quantity), toggle: ui_quantity',
            '.promotions-link': 'toggle: promotions_available'
        },
        bindingSources: {
            ui: function() {
                return new Backbone.Model({
                    quantity: 0
                });
            }
        },
        initialize: function() {
            this.listenTo(this.options.cart, 'add remove change', this.update, this);
            App.Views.FactoryView.prototype.initialize.apply(this, arguments);
        },
        render: function() {
            App.Views.FactoryView.prototype.render.apply(this, arguments);
            var profilePanel = this.options.profilePanel,
                view;

            view = App.Views.GeneratorView.create(profilePanel.modelName, _.extend(profilePanel, {
                el: this.$('.profile-panel-box')
            }));
            this.subViews.push(view);

            view = App.Views.GeneratorView.create('SearchLine', {
                mod: 'Main',
                el: this.$('.search-box'),
                model: this.options.searchLine
            });
            this.subViews.push(view);

            loadSpinner(this.$('.img'));
            this.update();
            return this;
        },
        events: {
            'click .shop': 'onMenu',
            'click .about': 'onAbout',
            'click .map': 'onMap',
            'click .cart-box.link': 'onCart',
            'click .promotions-link': 'onPromotions',
            'click .hlink-root': 'onRootJump'
        },
        onEnterListeners: {
            '.shop': 'onMenu',
            '.about': 'onAbout',
            '.map': 'onMap',
            '.cart-box.link': 'onCart'
        },
        onMenu: function() {
            this.model.trigger('onShop');
        },
        onAbout: function() {
            this.model.trigger('onAbout');
        },
        onMap: function() {
            this.model.trigger('onMap');
        },
        onCart: function() {
            this.model.trigger('onCart');
        },
        update: function() {
            this.setBinding('ui_quantity', this.options.cart.get_only_product_quantity());
        },
        onPromotions: function() {
            this.model.trigger('onPromotions');
        },
        onRootJump: function() {
            App.Routers.MainRouter.prototype.navigate('index', true);
        }
    });

    return new (require('factory'))(function() {
        App.Views.HeaderView = {};
        App.Views.HeaderView.HeaderMainView = HeaderMainView;
    });
});