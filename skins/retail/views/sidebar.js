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

define(["./tree", "./filters"], function(tree_view, filters_view) {
    'use strict';

    var SidebarMainView = App.Views.FactoryView.extend({
        name: 'sidebar',
        mod: 'main',
        initialize: function() {
            App.Views.FactoryView.prototype.initialize.apply(this, arguments);
            this.listenTo(this.options.curProductsSet, 'change:value', this.filtersToggle);
        },
        filtersToggle: function(model, value) {
            var $ui = this.getBinding('$ui');
            $ui.set('has_filters', false); // reset animation state
            var value = this.options.curProductsSet.get("value");
            this.listenTo(value, "change:status", function() {
                if (value.get("status") == "resolved") {
                    var hasSubcategories = Array.isArray(this.getBinding('categorySelection_subCategory')),
                    hasFilters = Boolean(value.get('filters').length);
                    $ui.set('has_filters', hasFilters && !hasSubcategories);
                }
            }, this);
        },
        bindings: {
            '.left-sidebar-title': 'classes: {collapsed: sidebarDataCollapsed}',
            '.left-sidebar-title .header-text': 'text: sidebarTitle',
            '.categories': 'updateContent: categories',
            '.filters': 'updateContent: filtersSet, toggle: ui_has_filters, classes: {animated: ui_has_filters, fadeInSlide: ui_has_filters}'
        },
        bindingSources: {
            ui: function() {
                return new Backbone.Model({
                    has_filters: false
                });
            }
        },
        computeds: {
            sidebarTitle: {
                deps: ['$sidebarTitle'],
                get: function(sidebarTitle) {
                    return sidebarTitle.get('title');
                }
            },
            sidebarDataCollapsed: {
                deps: ['$sidebarTitle'],
                get: function(sidebarTitle) {
                    return sidebarTitle.get('collapsed.' + sidebarTitle.get('barType'));
                }
            },
            categories: {
                deps: ['$categoriesTree', '$searchLine', '$sidebarTitle'],
                get: function(categoriesTree, searchLine, sidebarTitle) {
                    return {
                        name: 'Tree',
                        mod: 'Categories',
                        className: 'categories-tree primary-border',
                        collection: categoriesTree,
                        viewId: 0,
                        subViewIndex: 0,
                        sidebarTitle: sidebarTitle
                    };
                }
            },
            filtersSet: {
                deps: ['curProductsSet_value', '$sidebarTitle'],
                get: function(productsSet, sidebarTitle) {
                    return {
                        name: 'Filter',
                        mod: 'Set',
                        model: productsSet,
                        collection: productsSet.get('filters'),
                        viewId: productsSet.id,
                        subViewIndex: 1,
                        sidebarTitle: sidebarTitle
                    };
                }
            }
        },
        events: {
            'click .left-sidebar-title': 'toggleViewState'
        },
        toggleViewState: function(ev) {
            this.options.sidebarTitle.toggleState();
        },
        render: function() {
            App.Views.FactoryView.prototype.render.apply(this);
            var scrollThreshold = -35;
            var self = this;

            setTimeout(function() {
                $('.left-sidebar-content').scroll(function(ev) {
                    var scrollPosition =
                            ev.originalEvent.currentTarget.scrollHeight -
                            ev.originalEvent.currentTarget.scrollTop -
                            $('.filters').height();

                    self.options.sidebarTitle.setState(scrollPosition > scrollThreshold ? 'category' : 'filter');
                });
            }, 0);
        }
    });

    return new (require('factory'))(tree_view.initViews.bind(tree_view), filters_view.initViews.bind(filters_view),
        function() {
        App.Views.SidebarView = {};
        App.Views.SidebarView.SidebarMainView = SidebarMainView;
    });
});