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
        bindings: {
            'input.quantity_edit_input': 'restrictInput: "0123456789", kbdSwitcher: "numeric"'
        },
        events: {
            'input .quantity_edit_input': 'change_quantity',
            'blur .quantity_edit_input': 'blur_quantity'
        },
        initialize: function() {
            App.Views.CoreQuantityView.CoreQuantityMainView.prototype.initialize.apply(this, arguments);
            this.listenTo(this.options.model, 'combo_weight_product_change', this.combo_weight_product_change);
        },
        hide_show: function(isComboWithWeightProduct) {
            App.Views.CoreQuantityView.CoreQuantityMainView.prototype.hide_show.apply(this, arguments);
            var product = this.model.get_product(),
                stock_amount = product.get('stock_amount'),
                disallowNegativeInventory = App.Data.settings.get('settings_system').cannot_order_with_empty_inventory;

            if (stock_amount === 1 || product.isParent() || isComboWithWeightProduct || this.model.isMatrixChildProductUpsell()) {
                this.$('.quantity_edit_input').addClass('disabled').prop('disabled', true);
                disallowNegativeInventory && this.model.set('quantity', 1); // bug 13494
            } else {
                if (this.model.get('quantity') > 1) {
                    this.$('.decrease').removeClass('disabled');
                }
                if (this.model.get('quanity') < stock_amount) {
                    this.$('.increase').removeClass('disabled');
                }
                this.$('.quantity_edit_input').removeClass('disabled').prop('disabled', false);
            }
        },
        update: function() {
            this.$('.quantity_edit_input').val(this.model.get('quantity'));
        },
        change_quantity: function(e) {
            var min = 1,
                max = this.model.get_product().get('stock_amount');

            if (!e.target.validity.valid) {
                e.target.value = min;
            } else if (e.target.value > max) {
                e.target.value = max;
            }

            if (e.target.value)  {
                this.model.set('quantity', e.target.value * 1);
            }
        },
        blur_quantity: function(e) {
            if (!e.target.value) {
                e.target.value = 1;
                this.model.set('quantity', e.target.value * 1);
            }
        },
        combo_weight_product_change: function(isComboWithWeightProduct) {
            if (isComboWithWeightProduct) {
                this.model.set('quantity', 1);
            }
            this.hide_show(isComboWithWeightProduct);
        }
    });

    return new (require('factory'))(quantity_view.initViews.bind(quantity_view), function() {
        App.Views.QuantityView.QuantityMainView = QuantityMainView;
    });
});