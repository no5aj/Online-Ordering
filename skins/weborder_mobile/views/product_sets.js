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

define(["product_sets_view"], function(product_sets_view) {
    'use strict';

    var ComboItemView = App.Views.CoreComboView.CoreComboItemView.extend({
        events: {
            'click .customize': 'customize'
        },
        start: function() {
            this.check_model();
        },
        customize: function(event) {
            event.stopImmediatePropagation();
            event.preventDefault();
            App.Data.router.combo_child_products(this.options.myorder_root, this.model.get("id_product"));
        }
    });

    return new (require('factory'))(product_sets_view.initViews.bind(product_sets_view), function() {
        App.Views.ComboView.ComboItemView = ComboItemView;
    });
});