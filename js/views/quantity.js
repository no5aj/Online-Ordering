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

    App.Views.CoreQuantityView = {};

    App.Views.CoreQuantityView.CoreQuantityMainView = App.Views.FactoryView.extend({
        name: 'quantity',
        mod: 'main',
        initialize: function() {
            App.Views.FactoryView.prototype.initialize.apply(this, arguments);

            this.setBinding('product_stock_amount', this.model.get_product().get('stock_amount'));

            this.listenTo(this.model, 'change:quantity', this.update, this);
            this.listenTo(this.model.get('product'), 'change:attribute_1_selected change:attribute_2_selected', this.hide_show.bind(this, false));
            this.hide_show();
        },
        bindings: {
            '.decrease': 'classes: {disabled: any(equal(quantity, 1), equal(no_qty_arrows, true))}',
            '.increase': 'classes: {disabled: any(equal(quantity, product_stock_amount), equal(no_qty_arrows, true))}'
        },
        events: {
            'click .increase:not(.disabled)': 'increase',
            'click .decrease:not(.disabled)': 'decrease'
        },
        bindingSources: {
            product: function() {
                return new Backbone.Model({stock_amount: App.Models.Product.prototype.defaults.stock_amount});
            }
        },
        computeds: {
            no_qty_arrows: function() {
                return this.options.no_qty_arrows;
            }
        },
        hide_show: function(isComboWithWeightProduct) {
            var product = this.model.get_product(),
                quantity = this.model.get('quantity'),
                stock_amount = product.get('stock_amount'),
                is_gift = product.get('is_gift'),
                disallowEmptyInventory = App.Data.settings.get('settings_system').cannot_order_with_empty_inventory;

            is_gift && this.model.set('quantity', 1);

            if (is_gift) {
                this.$el.addClass('hide');
            } else {
                this.$el.removeClass('hide');
            }

            this.$('.select-wrapper').addClass('l' + (stock_amount ? stock_amount.toString().length : '1'));

            // if "cannot order with empty inventory" is checked on
            // need reset the quantity each time when user changes an attribute selection
            if(arguments.length > 0 && disallowEmptyInventory) {
                this.model.set('quantity', 1);
            }

            if (stock_amount === 1 || product.isParent() || isComboWithWeightProduct || this.getBinding('no_qty_arrows') ||
                (this.model.isParent() && product.isUpsellProduct())) {
                this.$('.decrease').addClass('disabled');
                this.$('.increase').addClass('disabled');
            } else {
                if (this.model.get('quantity') > 1) {
                    this.$('.decrease').removeClass('disabled');
                }
                if (this.model.get('quantity') < stock_amount) {
                    this.$('.increase').removeClass('disabled');
                }
            }
        },
        increase: function(event) {
            if($(event.target).hasClass('disabled'))
                return;
            var q = this.model.get('quantity'),
                stock_amount = this.model.get_product().get('stock_amount');
            this.model.set('quantity', ++q <= stock_amount ? q : stock_amount);
        },
        decrease: function(event) {
            if($(event.target).hasClass('disabled'))
                return;
            var q = this.model.get('quantity');
            this.model.set('quantity', --q >= 1 ? q : 1);
        },
        update: function() {

        }
    });

    App.Views.CoreQuantityView.CoreQuantityWeightView = App.Views.FactoryView.extend({
        name: 'quantity',
        mod: 'weight',
        bindings: {
            '.weight_edit_input': 'restrictInput: "0123456789.", kbdSwitcher: "float", pattern: weight_regex, attr: {"data-size": stringLength(scalesFormat(weight))}',
            '.decrease': 'classes: {disabled: equal(integer(weight), 1)}'
        },
        computeds: {
            weight_regex: {
                get: function() {
                    return RegExp(this.reg_str);
                }
            }
        },
        initialize: function() {
            var product = this.model.get_product();
            if (product && product.get('sold_by_weight')) {
                this.number_decimal_digits = App.Settings.scales.number_of_digits_to_right_of_decimal;
                if (this.number_decimal_digits)
                   this.reg_str = "^\\d{0,4}(\\.\\d{0," + this.number_decimal_digits + "})?$";
                else
                   this.reg_str = "^\\d{0,4}$";
            }
            App.Views.FactoryView.prototype.initialize.apply(this, arguments);
            this.listenTo(this.model, 'change:weight', this.update, this);
        },
        render: function() {
            var self = this,
                model = this.model.toJSON(),
                product = this.model.get_product();

            model.sold_by_weight = product.get("sold_by_weight");
            model.weight = this.model.get('weight') ? this.model.get('weight').toFixed(this.number_decimal_digits) : '';
            model.uom = App.Data.settings.get("settings_system").scales.default_weighing_unit;

            this.$el.html(this.template(model));
        },
        events: {
            'change .weight_edit_input': 'change_weight',
            'click .increase:not(.disabled)': 'increase',
            'click .decrease:not(.disabled)': 'decrease'
        },
        change_weight: function(e) {
            var newWeight = e.target.value,
                floatWeight = parseFloat(newWeight),
                pattern = new RegExp(this.reg_str.replace(/(0,)(\d+)/g, '$2,$2').replace(/(\d+,)/, '1,'));

            if(!isNaN(floatWeight)) {
                this.model.set('weight', floatWeight);
            }

            // If input field value does not match "XX.XX" need format it.
            // Also need restore previos (or 0.00 if it was unset) value if new value is '.'.
            if(!pattern.test(newWeight)) {
                e.target.value = this.model.get('weight').toFixed(this.number_decimal_digits);
            }
        },
        update: function() {
            this.$('.weight_edit_input').val(this.model.get('weight').toFixed(this.number_decimal_digits));
        },
        increase: function(event) {
            if($(event.target).hasClass('disabled'))
                return;
            var q = this.model.get('weight');
            this.model.set('weight', ++q);
        },
        decrease: function(event) {
            if($(event.target).hasClass('disabled'))
                return;
            var q = this.model.get('weight');
            this.model.set('weight', --q >= 0 ? q : 0);
        },
    });

    return new (require('factory'))(function() {
        App.Views.QuantityView = {};
        App.Views.QuantityView.QuantityMainView = App.Views.CoreQuantityView.CoreQuantityMainView;
        App.Views.QuantityView.QuantityWeightView = App.Views.CoreQuantityView.CoreQuantityWeightView;
    });
});
