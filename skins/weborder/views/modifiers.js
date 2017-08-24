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

define(["modifiers_view"], function(modifiers_view) {
    'use strict';

    var ModifiersClassesMatrixesView = App.Views.CoreModifiersClassesView.CoreModifiersClassesMatrixesView.extend({
        addItem: function() {
            App.Views.CoreModifiersClassesView.CoreModifiersClassesMatrixesView.prototype.addItem.apply(this, arguments);
            this.$el.parents('.modifiers_table').show();
        }
    });

    var ModifiersClassesListView = App.Views.CoreModifiersClassesView.CoreModifiersClassesListView.extend({
        bindings: {
            '.modifier_classes': 'classes: {"border-none": not(length(modifiers)), "hide": isGift}'
        },
        computeds: {
            modifiers: function() {
                return this.model.get_modifiers() || [];
            },
            isGift: function() {
              return this.model.get_product().get('is_gift');
            }
        },
        addItem: function() {
            App.Views.CoreModifiersClassesView.CoreModifiersClassesListView.prototype.addItem.apply(this, arguments);
            this.$el.parents('.modifiers_table').show();
        }
    });

    return new (require('factory'))(modifiers_view.initViews.bind(modifiers_view), function() {
        App.Views.ModifiersClassesView.ModifiersClassesMatrixesView = ModifiersClassesMatrixesView;
        App.Views.ModifiersClassesView.ModifiersClassesListView = ModifiersClassesListView;
    });
});