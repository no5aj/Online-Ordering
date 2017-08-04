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

define(["factory"], function() {
    'use strict';

    var TreeCategoryView = App.Views.FactoryView.extend({
        name: 'tree',
        mod: 'category',
        tagName: 'li',
        className: 'tree-item',
        initialize: function() {
            this.itemView = this.constructor;
            App.Views.FactoryView.prototype.initialize.apply(this, arguments);
        },
        bindings: {
            '.name': 'text: name, classes: {active: selected}, attr: {tabindex: select(selected, -1, 0)}',
            '.subtree': 'collection: items, itemView: "itemView"',
            ':el': 'classes: {"has-subtree": length(items), "no-subtree": not(length(items)), collapsed: not(expanded)}'
        },
        events: {
            'click .name:not(.active)': 'onClick'
        },
        onEnterListeners: {
            '.name:not(.active)': 'onClick'
        },
        onClick: function(event) {
            event.stopPropagation();
            this.model.set({
                selected: !this.model.get('selected'),
                expanded: !!this.model.get('items').length
            });
            this.appData.searchLine.empty_search_line();
        }
    });

    var TreeCategoriesView = App.Views.FactoryView.extend({
        name: 'tree',
        mod: 'categories',
        itemView: TreeCategoryView,
//        collapsed: false,
        initialize: function() {
            App.Views.FactoryView.prototype.initialize.apply(this, arguments);
            this.listenTo(this.options.sidebarTitle, 'change:collapsed.category', this.titleChanged);
        },
        bindings: {
            '.tree': 'collection: $collection, itemView: "itemView", toggle: not(ui_collapsed)',
            '.tree-title': 'classes: {collapsed: ui_collapsed}'
        },
        bindingSources: {
            ui: function() {
                return new Backbone.Model({collapsed: this.sidebarTitle.get('collapsed.category')});
            }
        },
        events: {
            'click .tree-title': 'onClick'
        },
        onEnterListeners: {
            '.tree-title': 'onClick'
        },
        onClick: function(event) {
            event.stopPropagation();
            this.options.sidebarTitle.set(
                'collapsed.category',
                !this.options.sidebarTitle.get('collapsed.category')
            );
        },
        titleChanged: function(val) {
            var $ui =  this.getBinding('$ui');
            $ui.set('collapsed', this.options.sidebarTitle.get('collapsed.category'));
        }
    });

    return new (require('factory'))(function() {
        App.Views.TreeView = {};
        App.Views.TreeView.TreeCategoriesView = TreeCategoriesView;
    });
});