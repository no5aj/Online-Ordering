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

define(["quantity_view"], function(quantity_view) {
    'use strict';

    var QuantityMainView = App.Views.CoreQuantityView.CoreQuantityMainView.extend({
        events: {
            'change input': 'change'
        },
        initialize: function() {
            App.Views.CoreQuantityView.CoreQuantityMainView.prototype.initialize.apply(this, arguments);
            this.listenTo(this.options.model, 'combo_weight_product_change', this.combo_weight_product_change);
        },
        combobox: null,
        hide_show: function(isComboWithWeightProduct) {
            App.Views.CoreQuantityView.CoreQuantityMainView.prototype.hide_show.apply(this, arguments);
            var select = this.$('select'),
                product = this.model.get_product(),
                quantity = this.model.get('quantity'),
                stock_amount = product.get('stock_amount'),
                selectWrapper = this.$('.combobox-wrapper'),
                max_amount = Math.min(stock_amount, product.defaults.stock_amount);

            select.empty();
            var options = [];
            for (var i = 1; i <= max_amount; i++) {
                if (i === quantity) {
                    options.push('<option selected="selected" value="' + i + '">' + i + '</option>');
                } else {
                    options.push('<option value="' + i + '">' + i + '</option>');
                }
            }
            select.append(options);

            if (stock_amount === 1 || product.isParent() || isComboWithWeightProduct) {
                select.addClass('disabled');
                select.prop('disabled', true);
                selectWrapper.addClass('disabled');
            } else {
                select.removeClass('disabled');
                select.prop('disabled', false);
                selectWrapper.removeClass('disabled');
            }

            if (product.isParent() || this.model.isMatrixChildProductUpsell()) {
                this.$el.hide();
            } else {
                this.$el.show();
            }

            if (this.combobox) {
                this.combobox.destroy();
            }
            this.combobox = select.combobox(1, max_amount);
        },
        change: function(e) {
            this.model.set('quantity', e.target.value * 1);
        },
        combo_weight_product_change: function(isComboWithWeightProduct) {
            if (isComboWithWeightProduct) {
                this.model.set('quantity', 1);
            }
            this.hide_show(isComboWithWeightProduct);
        },
        update: function() {
            this.$('.inputbox').val(this.model.get('quantity'));
        }
    });

    var QuantityWeightView = App.Views.CoreQuantityView.CoreQuantityWeightView.extend({
        bindings: {
            '.weight-wrapper': 'attr: {"data-weight": scalesFormat(weight)}'
        }
    });

    var QuantityMainCartView = QuantityMainView.extend({
        mod: 'main_cart',
        initialize: function() {
            QuantityMainView.prototype.initialize.apply(this, arguments);
            if (this.model.isComboBased() && (this.model.get('product').get('product_sets').haveWeightProduct() || this.model.get('product').get("sold_by_weight"))){
                QuantityMainView.prototype.combo_weight_product_change.call(this, true);
            }
        },
        bindings: {
            '.qty': 'text: quantity'
        }
    });

    var QuantityWeightCartView = App.Views.CoreQuantityView.CoreQuantityWeightView.extend({
        mod: 'weight_cart',
        bindings: {
            '.weight': 'text: integer(weight)'
        }
    });

    return new (require('factory'))(quantity_view.initViews.bind(quantity_view), function() {
        App.Views.QuantityView.QuantityMainView = QuantityMainView;
        App.Views.QuantityView.QuantityWeightView = QuantityWeightView;
        App.Views.QuantityView.QuantityMainCartView = QuantityMainCartView;
        App.Views.QuantityView.QuantityWeightCartView = QuantityWeightCartView;
    });
});