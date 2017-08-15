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

define(["./tree"], function(tree_view) {
    'use strict';

    var FilterItemView = App.Views.FactoryView.extend({
        name: 'filter',
        mod: 'item',
        tagName: 'li',
        className: 'tree-item',
        bindings: {
            ':el': 'checkedSpan: {value: selected}, attr: {tabindex: 0}',
            '.checkbox': 'classes: {checked: selected}'
        },
        onEnterListeners: {
            ':el': 'check'
        },
        check: function() {
            this.model.set('selected', !this.model.get('selected'));
        }
    });

    var FilterItemsView = App.Views.TreeView.TreeCategoriesView.extend({
        name: 'filter',
        mod: 'items',
        itemView: FilterItemView,
        className: 'categories-tree primary-border',
        initialize: function() {
            this.collection = this.model.get('filterItems');
            App.Views.TreeView.TreeCategoriesView.prototype.initialize.apply(this, arguments);
        },
        bindings: {
            '.tree-title': 'classes: {collapsed: ui_collapsed}'
        },
        bindingSources: {
            ui: function() {
                return new Backbone.Model({collapsed: false});
            }
        },
        events: {
          'click .tree-title.filter-title': 'toggleViewState'
        },
        toggleViewState: function(event) {
            event.stopPropagation();
            var $ui = this.getBinding('$ui');
            $ui.set('collapsed', !$ui.get('collapsed'));
        }
    });

    var FilterSetView = App.Views.FactoryView.extend({
        name: 'filter',
        mod: 'set',
        itemView: FilterItemsView,
        initialize: function() {
            App.Views.FactoryView.prototype.initialize.apply(this, arguments);
            this.listenTo(this.options.sidebarTitle, 'change:collapsed.filter', this.titleChanged);
        },
        bindings: {
            '.filters-list': 'collection: $collection, itemView: "itemView", toggle: not(ui_collapsed)',
            '.tree-title': 'toggle: length($collection), classes: {collapsed: ui_collapsed}'
        },
        bindingSources: {
            ui: function() {
                return new Backbone.Model({collapsed: this.sidebarTitle.get('collapsed.filter')});
            }
        },
        events: {
            'click .tree-title.filters-title': 'toggleViewState'
        },
        onEnterListeners: {
            '.tree-title.filters-title': 'toggleViewState'
        },
        toggleViewState: function(event) {
            event.stopPropagation();
            this.options.sidebarTitle.toggleState('filter');
        },
        titleChanged: function(val) {
            var $ui = this.getBinding('$ui');
            $ui.set('collapsed', this.options.sidebarTitle.get('collapsed.filter'));
        }
    });

    return new (require('factory'))(tree_view.initViews.bind(tree_view), function() {
        App.Views.FilterView = {};
        App.Views.FilterView.FilterSetView = FilterSetView;
    });
});
