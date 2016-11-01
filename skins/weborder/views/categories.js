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

define(["generator", "list", "categories_view"], function() {
    'use strict';

    var CategoriesSliderItemView = App.Views.ItemView.extend({
        name: 'categories',
        mod: 'item',
        initialize: function() {
            App.Views.ItemView.prototype.initialize.apply(this, arguments);
            this.listenTo(this.collection, 'change:active', this.show_hide, this);
            this.listenTo(this.collection, 'change:parent_selected', this.uncheck, this);
            this.show_hide();
        },
        render: function() {
            this.$el.html(this.template(this.model.toJSON()));
            this.afterRender.call(this, this.model.get('parent_sort'));
            return this;
        },
        events: {
            "change input": "change"
        },
        change: function() {
            var parent_name = this.model.get('parent_name');
            this.collection.setSelected(0, true); // default option for subcategories (show all). Use silent mode so 'change:selected' event will not be triggered.
            this.collection.setParentSelected(parent_name);
        },
        show_hide: function() {
            var value = this.model.get('parent_name');
            if (!this.collection.where({parent_name : value, active: true}).length) {
                this.$el.addClass('hide');
                this.options.self.update_slider_render();
            } else {
                this.$el.removeAttr('style');
                this.options.self.update_slider_render();
            }
        },
        uncheck: function(value) {
            if (this.collection.parent_selected != this.model.get('parent_name')) {
                this.$('input').prop('checked', false);
            }
            else {
                this.$('input').prop('checked', true).parents('label').addClass('checked');

                if (!this.collection.saved_parent_selected) {
                    this.$('input').trigger('change');
                }
            }
        }
    });

    var CategoriesSliderView = App.Views.ListView.extend({
        name: 'categories',
        mod: 'slider',
        initialize: function() {
            this.parent_categories = [];
            App.Views.ListView.prototype.initialize.apply(this, arguments);
            this.listenTo(this.collection, 'add', this.addItem, this);
            $(window).resize(this.create_slider.bind(this));
            this.listenTo(this.model, "loadCompleted", this.create_slider.bind(this));
            this.listenTo(this.model, 'onMenu', selectFirstItem, this);
            this.listenTo(this.options.search, 'onSearchComplete', this.reset_selection, this);

            var self = this;
            this.options.loaded.then(selectFirstItem);

            function selectFirstItem() {
                self.$('input').first().trigger('change');
            }
        },
        events: {
            "change input": "change",
            "click .arrow_left": 'slide_left',
            "click .arrow_right": 'slide_right'
        },
        change: function(e) {
            var el = $(e.currentTarget),
                label = el.parents('label');

            el.parents('ul').find('label').removeClass('checked');
            label.addClass('checked');
            this.on_menu_change();
        },
        render: function() {
            App.Views.ListView.prototype.render.apply(this, arguments);
            this.collection.each(this.addItem.bind(this));
            return this;
        },
        reset_selection: function() {
            var searchString = this.options.searchLine.get('searchString');

            if (searchString) {
                if (!this.collection.saved_parent_selected) {
                    this.collection.saved_parent_selected = this.collection.parent_selected;
                }

                this.collection.parent_selected = null;
                this.$('ul').find('label').removeClass('checked');
                this.$('ul').find('input').attr('checked', false);
            }
            else if (this.collection.saved_parent_selected) {
                var hasCheckedItems = this.$('ul').find('label').hasClass('checked');

                if (!hasCheckedItems) {
                    this.collection.setSelected(0, true);
                    this.collection.setParentSelected(this.collection.saved_parent_selected);
                }
                
                delete this.collection.saved_parent_selected;
            }
        },
        update_slider_render: function() {
            this.create_slider();
            if (this.$('.checked').parent().hasClass('hide')) {
                this.$('input').first().trigger('change');
            }
        },
        addItem: function(model) {
            if (this.parent_categories.indexOf(model.get('parent_name')) === -1) {
                this.parent_categories.push(model.get('parent_name'));
                var view = App.Views.GeneratorView.create('Categories', {
                    el: $('<li></li>'),
                    mod: 'SliderItem',
                    model: model,
                    collection: this.collection,
                    self: this
                }, model.cid);
                App.Views.ListView.prototype.addItem.call(this, view, this.$('.categories'), model.escape('parent_sort'));
                this.subViews.push(view);
                this.create_slider();
            }
        },
        create_slider: function() {
            this.slider = {
                width:          this.$('.slider_wrapper').width(),
                list:           this.$('.categories'),
                items:          this.$('li'),
                arrow_left:     this.$('.arrow_left'),
                arrow_right:    this.$('.arrow_right')
            };

            this.slider.items_last_index = this.slider.items.length - 1;

            if (this.slider.width <= 0) {
                return;
            }

            this.slider_index = this.slider_index || 0;

            var itemsWidth = 0;
            this.slider.items.each(function() {
                var item = $(this);
                item.attr('data-left-pos', itemsWidth);
                itemsWidth += item.outerWidth();
            });

            if (itemsWidth < this.slider.width) {
                this.slider_index = 0;
                this.slider.arrow_left.hide();
                this.slider.arrow_right.hide();
                this.slider.list.css('left', 0);
            }

            this.update_slider();
        },
        update_slider: function() {
            var itemsWidth = 0,
                showRightArrow = false,
                self = this;

            this.slider.items.each(function(index) {
                if (index < self.slider_index) {
                    return;
                }

                var item = $(this);
                itemsWidth += item.outerWidth();

                item.css({
                    visibility: (itemsWidth > self.slider.width) ? 'hidden' : 'visible'
                });

                if (index === self.slider.items_last_index && itemsWidth > self.slider.width) {
                    showRightArrow = true;
                }

                if (index === self.slider.items_last_index && itemsWidth <= self.slider.width) {
                    if (self.slider_index > 0) {
                        var freeWidth = self.slider.width - itemsWidth,
                            prevItemWidth = self.slider.items.eq(self.slider_index).prev().outerWidth();

                        if (freeWidth > prevItemWidth) {
                            self.slide_left();
                        }
                    }
                }
            });

            // Left arrow visibility
            this.slider.arrow_left.css({
                display: (this.slider_index === 0) ? 'none' : 'block'
            });

            // Right arrow visibility
            this.slider.arrow_right.css({
                display: showRightArrow ? 'block' : 'none'
            });
        },
        on_menu_change: function() {
            this.options.searchLine.empty_search_line();
            this.collection.trigger("show_subcategory");
        },
        slide_right: function() {
            this.slider_index++;
            this.change_position();
        },
        slide_left: function() {
            this.slider_index--;
            this.change_position();
        },
        change_position: function() {
            var item = this.slider.items.eq(this.slider_index);

            this.slider.list.css({
                left: -(item.data('left-pos'))
            });

            this.update_slider();
            this.on_menu_change();
        }
    });

    var CategoriesProductsItemView = App.Views.ItemView.extend({
        name: 'categories',
        mod: 'products_item',
        initialize: function() {
            App.Views.ItemView.prototype.initialize.apply(this, arguments);
            this.listenTo(this.model, 'change:active', this.show_hide);
            this.show_hide();
        },
        bindings: {
            '.category_name': 'text:category_name',
            '.product_table': 'attr: {"data-length": length($collection)}'
        },
        computeds: {
            category_name: function() {
                var subname = this.getBinding("parent_name") == _loc.CATEGORIES_SEARCH ? _loc.CATEGORIES_SEARCH + ": " : "";
                var name = this.getBinding("name") ? this.getBinding("name") : "";
                return subname + name;
            }
        },
        show_hide: function() {
            if (!this.model.get('active')) {
                this.$el.hide();
            } else {
                this.$el.show();
            }
        },
        render: function() {
            this.$el.html(this.template(this.model.toJSON()));
            this.afterRender.call(this, this.model.get('sort'));
            this.add_table();
            this.listenTo(this.options.categories, 'change:selected', this.update_view);
            return this;
        },
        add_table: function() {
            var model = this.model,
                view = App.Views.GeneratorView.create('Product', {
                    mod: 'List',
                    collection: this.collection,
                    root_cache_id: this.options.root_cache_id
                }, model.cid + this.options.pageModel.get('cur_page'));
            this.$('.product_table').prepend(view.el);
            this.subViews.push(view);
        },
        update_view: function(model, value) {
            // scroll to the selected subcategory, or to the first one, if value is 0 (default option selected)
            if (value === this.model.get('id') || (!value && this.model.get('sort') === 1)) {
                this.$el[0].scrollIntoView();
            }
        }
    });

    var CategoriesProductsView = App.Views.ListView.extend({
        name: 'categories',
        mod: 'products',
        initialize: function() {
            App.Views.ListView.prototype.initialize.apply(this, arguments);
            this.initData();
        },
        addItem: function(products, category) {
            var view = App.Views.GeneratorView.create('Categories', {
                el: $('<li></li>'),
                mod: 'ProductsItem',
                collection: products,
                model: category,
                categories: this.collection,
                pageModel: this.options.pageModel,
                root_cache_id: this.options.root_cache_id
            }, category.cid + this.options.pageModel.get('cur_page'));
            App.Views.ListView.prototype.addItem.call(this, view, this.$el, category.escape('sort'));
            this.subViews.push(view);
        },
        initData: function() {
            var self = this,
                page_size = self.options.pageModel.get('page_size'),
                start_index = (self.options.pageModel.get('cur_page') - 1) * page_size;
            var products = self.options.products_bunch.get_subcategory_products(start_index, page_size);
            for (var sub_id in products) {
                if (products[sub_id].length) {
                    self.addItem(new App.Collections.Products(products[sub_id]), App.Data.categories.get(sub_id));
                }
            }
        }
    });

    var CategoriesProductsPagesView = App.Views.FactoryView.extend({
        name: 'categories',
        mod: 'products_pages',
        initialize: function() {
            this.pageModel = new App.Models.PagesCtrl;
            _.extend(this.bindingSources, {
                pageModel: this.pageModel
            });
            App.Views.FactoryView.prototype.initialize.apply(this, arguments);
            this.listenTo(this, 'loadStarted', this.showSpinner, this);
            this.listenTo(this, 'loadCompleted', this.hideSpinner, this);
            this.initViews();
            this.listenTo(this.pageModel, "change:cur_page", this.updatePageView, this);
        },
        bindings: {
            ".products_pages_control": "classes:{hide: less(pageModel_page_count,2)}",
            ".categories_products_wrapper": "classes:{full_size: less(pageModel_page_count,2)}"
        },
        initViews: function() {
            var view = App.Views.GeneratorView.create('Pages', {
                mod: 'Main',
                model: this.pageModel,
                className: "pages_control_wrapper"
            }, 'products_pages_controls' + this.options.root_cache_id);
            this.$('.products_pages_control').append(view.el);
            this.subViews.push(view);
            this.updatePageView({is_first: true});
        },
        updatePageView: function() {
            var dfd, self = this;
            var parent_id = this.options.parent_category.get('id');
            for (var i = 1; i < this.subViews.length; i++) {
                if (this.subViews[i])
                    this.subViews[i].removeFromDOMTree();
            }
            if (App.Data.products_bunches[parent_id] == undefined) {
                dfd = App.Models.ProductsBunch.init(parent_id);
            } else {
                var start_index = (this.pageModel.get('cur_page') - 1) * this.pageModel.get('page_size');
                dfd = App.Data.products_bunches[parent_id].get_products({start_index: start_index});
            }
            self.trigger('loadStarted');
            self.pageModel.disableControls();
            dfd.always(function() {
                var view = App.Views.GeneratorView.create('Categories', {
                    el: $("<ul class='categories_table'></ul>"),
                    mod: 'Products',
                    products_bunch: App.Data.products_bunches[parent_id],
                    model: self.model, //Model: Search or undefined
                    collection: self.collection, //Collection: Categories
                    pageModel: self.pageModel,
                    parent_category: self.options.parent_category,
                    root_cache_id: self.options.root_cache_id
                }, 'products_pages' + self.options.root_cache_id + self.pageModel.get("cur_page"));
                self.$('.categories_products_wrapper').append(view.el).scrollTop(0);
                self.subViews.push(view);

                var num_of_products = App.Data.products_bunches[parent_id].get('num_of_products');
                self.pageModel.calcPages(num_of_products);
                self.pageModel.enableControls();
                self.trigger('loadCompleted');
            });
        },
        showSpinner: function() {
            $('.products_spinner').addClass('ui-visible');
        },
        hideSpinner: function() {
            var spinner = $('.products_spinner');
            this.spinnerTimeout = setTimeout(spinner.removeClass.bind(spinner, 'ui-visible'), 0);
        }
    });

    var CategoriesSearchPagesView = CategoriesProductsPagesView.extend({
        name: 'categories',
        mod: 'products_pages',
        updatePageView: function(options) {
            var dfd, self = this,
                search = this.model;
            for (var i = 1; i < this.subViews.length; i++) {
                if (this.subViews[i])
                    this.subViews[i].removeFromDOMTree();
            }
            var is_first = options ? options.is_first : false;
            if (is_first) {
                dfd = $.Deferred().resolve(); //the first page of products is already loaded by router
            } else {
                var start_index = (this.pageModel.get('cur_page') - 1) * this.pageModel.get('page_size');
                dfd = search.get_products({start_index: start_index});
            }

            self.trigger('loadStarted');
            self.pageModel.disableControls();
            dfd.always(function() {
                var view = App.Views.GeneratorView.create('Categories', {
                    el: $("<ul class='categories_table'></ul>"),
                    mod: 'SearchResults',
                    model: search, //Model: Search or undefined
                    collection: self.collection, //Collection: Categories
                    pageModel: self.pageModel,
                    root_cache_id: self.options.root_cache_id,
                }, 'products_pages' + self.options.root_cache_id + self.pageModel.get("cur_page"));
                self.$('.categories_products_wrapper').append(view.el).scrollTop(0);
                self.subViews.push(view);

                var num_of_products = search.get('num_of_products');
                self.pageModel.calcPages(num_of_products);
                self.pageModel.enableControls();
                self.trigger('loadCompleted');
            });
        }
    });

    var CategoriesSearchResultsView = CategoriesProductsView.extend({
        name: 'categories',
        mod: 'products',
        initData: function() {
            var self = this,
                categories = App.Data.categories,
                id = categories.selected;

            var page_size = self.options.pageModel.get('page_size'),
                start_index = (self.options.pageModel.get('cur_page') - 1) * page_size;

            this.addItem( get_products_portion(start_index, page_size),
                new Backbone.Model({
                    parent_name: _loc.CATEGORIES_SEARCH,
                    name: this.model.get('pattern'),
                    description: '',
                    active: true,
                    timetables: null
                }));

            categories.trigger('onSearchComplete', this.model);
            this.searchComplete = true;

            function get_products_portion(start_index, page_size) {
                var portion = new App.Collections.Products();
                var products = self.model.get('products');
                portion.add( products.models.slice(start_index, start_index + page_size) );
                return portion;
            }
        }
    });

    var CategoriesMainProductsView = App.Views.ListView.extend({
        name: 'categories',
        mod: 'main_products',
        initialize: function() {
            App.Views.ListView.prototype.initialize.apply(this, arguments);
            this.listenTo(this.collection, 'change:parent_selected', this.update_table);
            this.listenTo(this.options.search, 'onSearchComplete', this.update_table, this);
            // this.$('.categories_products_wrapper').contentarrow();
            this.$('.products_spinner').css('position', 'absolute').spinner();
            this.listenTo(this.options.search, 'onSearchStart', this.showSearchSpinner, this);
            this.listenTo(this.options.search, 'onSearchComplete', this.hideSpinner, this);
            this.listenTo(App.Data.categories, 'onRestore', this.hideSpinner, this);
        },
        update_table: function(model, categoryName) {
           var isCategories = typeof categoryName != 'undefined',
                mod = isCategories ? 'ProductsPages' : 'SearchPages',
                searchModel = isCategories ? undefined : model,
                cache_id = isCategories ? categoryName : model.get('pattern');

            // if search pattern is empty
            if (!isCategories && !cache_id) {
                return;
            }

            var parentCategory = isCategories ? App.Data.parentCategories.findWhere({name: categoryName}) : undefined;

            // if search result and result is empty
            if(searchModel && (!searchModel.get('products')))
                return;

            this.subViews.forEach(function(view) {
                this.stopListening(view);
            }, this);
            this.subViews.removeFromDOMTree();
            var view = App.Views.GeneratorView.create('Categories', {
                mod: mod,
                model: searchModel,
                collection: this.collection,
                parent_category: parentCategory,
                root_cache_id: cache_id,
            }, 'products_' + cache_id);
            this.subViews.push(view);
            this.$('.categories_products_pages_wrap').append(view.el);
        },
        showSpinner: function() {
            this.$('.products_spinner').addClass('ui-visible');
        },
        hideSpinner: function(delay) {
            var spinner = this.$('.products_spinner');
            this.spinnerTimeout = setTimeout(spinner.removeClass.bind(spinner, 'ui-visible'), delay >= 0 ? delay : 500);
        },
        showSearchSpinner: function() {
            if (this.options.search.status != 'searchComplete') {
                clearTimeout(this.spinnerTimeout);
                this.showSpinner();
            }
        },
        remove: function() {
            // this.$('.categories_products_wrapper').contentarrow('destroy');
            App.Views.ListView.prototype.remove.apply(this, arguments);
        }
    });

    return new (require('factory'))(function() {
        App.Views.CategoriesView.CategoriesSliderItemView = CategoriesSliderItemView;
        App.Views.CategoriesView.CategoriesSliderView = CategoriesSliderView;
        App.Views.CategoriesView.CategoriesProductsItemView = CategoriesProductsItemView;
        App.Views.CategoriesView.CategoriesProductsView = CategoriesProductsView;
        App.Views.CategoriesView.CategoriesMainProductsView = CategoriesMainProductsView;
        App.Views.CategoriesView.CategoriesSearchResultsView = CategoriesSearchResultsView;
        App.Views.CategoriesView.CategoriesProductsPagesView = CategoriesProductsPagesView;
        App.Views.CategoriesView.CategoriesSearchPagesView = CategoriesSearchPagesView;
    });
});