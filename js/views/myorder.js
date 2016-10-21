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

define(["backbone", "stanfordcard_view", "factory", "generator"], function(Backbone, stanfordcard_view) {
    'use strict';

    App.Views.CoreMyOrderView = {};

    App.Views.CoreMyOrderView.CoreMyOrderModifierView = App.Views.FactoryView.extend({
        name: 'myorder',
        mod: 'modifier',
        bindings: {
            '.mdf-sum': 'text: currencyFormat(sum)',
        },
        render: function() {
            var price, model = this.model.toJSON();
            model.currency_symbol = App.Data.settings.get('settings_system').currency_symbol;

            if (this.model.isMaxPriceFree())
                price = model.max_price_amount;
            else
                price = this.model.isFree() ? model.free_amount : this.model.getSum();

            model.price = round_monetary_currency( price );
            model.half_price_str = MSG.HALF_PRICE_STR[this.model.get('qty_type')];
            this.$el.html(this.template(model));
            return this;
        }
    });

    App.Views.CoreMyOrderView.CoreMyOrderProductDiscountView = App.Views.FactoryView.extend({
        name: 'myorder',
        mod: 'product_discount',
        initialize: function() {
            App.Views.FactoryView.prototype.initialize.apply(this, arguments);
            this.listenTo(this.model.get("discount"), 'change', this.render, this);
        },
        render: function() {
            // this.model is the instance of App.Models.Myorder
            var model = {},
                discount = this.model.get("discount");
            model.currency_symbol = App.Settings.currency_symbol;
            model.discount_name = discount.get('name');
            model.discount_sum = discount.toString();
            this.$el.html(this.template(model));

            removeClassRegexp(this.$el, "s\\d{1,2}");

            if (discount.get("sum") <= 0) {
                this.$el.hide();
            }
            else {
                this.$el.show();
            }
            return this;
        }
    });

    App.Views.CoreMyOrderView.CoreMyOrderMatrixView = App.Views.FactoryView.extend({
        name: 'myorder',
        mod: 'matrix',
        render: function() {
            App.Views.FactoryView.prototype.render.apply(this, arguments);
            var model = this.model;
            this.renderProduct();
            this.listenTo(model.get('product'), 'change:attribute_1_selected change:attribute_2_selected', this.update);
            this.renderModifiers();
            return this;
        },
        update: function() {
            var index = this.subViews.indexOf(this.viewProduct);
            if (index !== -1) {
                this.viewProduct.remove();
                this.subViews[index] = this.viewProduct = App.Views.GeneratorView.create('Product', {
                    modelName: 'Product',
                    model: this.model,
                    mod: 'Modifiers'
                });
                this.$('.product_info').append(this.viewProduct.el);
            }
        },
        renderModifiers: function() {
            var model = this.model,
                viewModifiers;

            switch(model.get_attribute_type()) {
                case 0:
                case 2:
                    var el = $('<div></div>');
                    this.$('.modifiers_info').append(el);
                    viewModifiers =  App.Views.GeneratorView.create('ModifiersClasses', {
                        el: el,
                        model: model,
                        mod: 'List'
                    });
                    break;
                case 1:
                    viewModifiers =  App.Views.GeneratorView.create('ModifiersClasses', {
                        el: this.$('.product_attribute_info'),
                        model: model,
                        mod: 'Matrixes',
                        modifiersEl: this.$('.modifiers_info')
                    });
            }
            this.subViews.push(viewModifiers);
        },
        renderProduct: function() {
            var model = this.model,
                product = model.get('product'),
                is_gift = product.get('is_gift');

            var viewOptions = {
                modelName: 'Product',
                model: model,
                mod: 'Modifiers'
            };

            if (is_gift) {
                viewOptions['className'] = 'gift-card-box btn-secondary';
            }

            this.viewProduct = App.Views.GeneratorView.create('Product', viewOptions);
            this.$('.product_info').append(this.viewProduct.el);
            this.subViews.push(this.viewProduct);
        },
        renderProductFooter: function() {
            var model = this.model,
                product = this.model.get("product");

            var view = App.Views.GeneratorView.create('MyOrder', {
                el: this.$(".product_info_footer"),
                model: this.model,
                mod: 'MatrixFooter',
                action: this.options.action,
                action_text_label: this.options.action_text_label,
                flags: this.options.combo_child ? ['no_specials', 'no_quantity'] : undefined,
                real: this.options.real,
                action_callback: this.options.action_callback
            });
            this.subViews.push(view);
        }
    });

    App.Views.CoreMyOrderView.CoreMyOrderMatrixComboView = App.Views.FactoryView.extend({
        name: 'myorder',
        mod: 'matrix_combo',
        render: function() {
            App.Views.FactoryView.prototype.render.apply(this, arguments);
            var model = this.model;
            this.renderProduct(); //header of matrix
            this.renderProductSets();
            return this;
        },
        renderProductSets: function() {
            var model = this.model,
                productSets,
                product = this.model.get("product");

            if (!product) return;

            var el = $('<div class="product_sets"></div>');
                this.$('.modifiers_info').append(el);
                productSets = App.Views.GeneratorView.create('ProductSets', {
                    el: el,
                    model: this.model,
                    collection: product.get('product_sets'),
                    mod: 'List'
                });

            this.subViews.push(productSets);
        },
        renderProduct: function() {
            var model = this.model;
            this.viewProduct = App.Views.GeneratorView.create('Product', {
                modelName: 'Product',
                model: model,
                mod: model.isComboProduct() ? 'ModifiersCombo' : 'ModifiersUpsell',
                action: this.options.action
            });
            this.$('.product_info').append(this.viewProduct.el);
            this.subViews.push(this.viewProduct);
        },
        renderProductFooter: function() {
            var model = this.model,
                product = this.model.get("product");

            var view = App.Views.GeneratorView.create('MyOrder', {
                el: this.$(".product_info_footer"),
                model: this.model,
                mod: model.isComboProduct() ? 'MatrixFooterCombo' : 'MatrixFooterUpsell',
                action: this.options.action,
                real: this.options.real,
                action_callback: this.options.action_callback
            });
            this.subViews.push(view);
        }
    });

    App.Views.CoreMyOrderView.CoreMyOrderMatrixFooterView = App.Views.FactoryView.extend({
        name: 'myorder',
        mod: 'matrix_footer',
        initialize: function() {
            App.Views.FactoryView.prototype.initialize.apply(this, arguments);
            this.listenTo(this.model.get('product'), 'change:attribute_1_selected change:attribute_2_selected', this.update_child_selected);
            return this;
        },
        render: function() {
            App.Views.FactoryView.prototype.render.apply(this, arguments);
            var action_text_label = this.options.action_text_label ? this.options.action_text_label : this.options.action;
            if (action_text_label === 'add') {
                this.$('.action_button').html(_loc['MYORDER_ADD_ITEM']);
            } else {
                this.$('.action_button').html(_loc['MYORDER_UPDATE_ITEM']);
            }
            var model = this.model,
                view, mod,
                sold_by_weight = this.model.get_product().get("sold_by_weight");

            if (sold_by_weight || !this.options.flags || this.options.flags.indexOf('no_quantity') == -1) {
                mod = sold_by_weight ? 'Weight' : 'Main';

                view = App.Views.GeneratorView.create('Quantity', {
                    el: this.$('.quantity_info'),
                    model: model,
                    mod: mod
                });
                this.subViews.push(view);
            }

            if (!this.options.flags || this.options.flags.indexOf('no_specials') == -1) {
                view = App.Views.GeneratorView.create('Instructions', {
                    el: this.$('.product_instructions'),
                    model: model,
                    mod: 'Modifiers'
                });
                this.subViews.push(view);

                if (App.Settings.special_requests_online === false) {
                    view.$el.hide(); // hide special request if not allowed
                }
            }

            this.update_child_selected();
            return this;
        },
        events: {
            'click .action_button:not(.disabled)': 'action',
            'keydown .action_button:not(.disabled)': function(e) {
                if (this.pressedButtonIsEnter(e)) {
                    this.action();
                }
            }
        },
        update_child_selected: function() {
            if (this.check_model()) {
                this.$('.action_button').removeClass('disabled');
            }
            else {
                this.$('.action_button').addClass('disabled');
            }
        },
        check_model: function() {
            return this.model.get('product').check_selected();
        },
        view_check_order: function() {
            var opt, has_upsell = this.model.isUpsellProduct();
            if (has_upsell) { //this is modifiers customization for Upcharge combo product
                opt = { modifiers_only: true };
            }
            return this.model.check_order(opt);
        },
        action: function (event) {
            var check = this.view_check_order(),
                self = this, index, collection;
            if (check.status === 'OK') {
                this.model.get_product().check_gift(function() {
                    if (self.options.action === 'add') {
                        App.Data.myorder.add(self.model);
                    } else {
                        self.options.real.update(self.model);
                    }
                    $('#popup .cancel').trigger('click', ['OK']);
                }, function(errorMsg) {
                    App.Data.errors.alert(errorMsg); // user notification
                });
            } else {
                App.Data.errors.alert(check.errorMsg); // user notification
            }
        }
    });

    App.Views.CoreMyOrderView.CoreMyOrderMatrixFooterComboView = _MatrixFooterComboView (App.Views.CoreMyOrderView.CoreMyOrderMatrixFooterView ) ;
    function _MatrixFooterComboView(_base) { return _base.extend ({
        initialize: function() {
            _base.prototype.initialize.apply(this, arguments);
            this.listenTo(this.model, 'combo_product_change', this.update_child_selected);
            this.listenTo(this.model, 'combo_product_change', this.check_weight_product);
            this.check_weight_product();
            return this;
        },
        check_model: function() {
            return this.model.get('product').get('product_sets').check_selected();
        },
        check_weight_product: function() {
            var isComboWithWeightProduct = this.model.get('product').get('product_sets').haveWeightProduct();
            this.options.model.trigger('combo_weight_product_change', isComboWithWeightProduct);
        }
      });
    }

    App.Views.CoreMyOrderView.CoreMyOrderMatrixFooterUpsellView = _MatrixFooterUpsellView (App.Views.CoreMyOrderView.CoreMyOrderMatrixFooterComboView ) ;
    function _MatrixFooterUpsellView(_base) { return _base.extend ({
        mod: 'matrix_footer_upsell',
        initialize: function() {
            _base.prototype.initialize.apply(this, arguments);
            if (this.options.action === 'update') {
               this.$('.no_combo_link').hide();
            }
            this.listenTo(this.model, "action_add_item", this.action); //used for the case when root modifiers were not selected before user press Add Item
            return this;
        },
        events: {
            'click .no_combo_link': 'no_combo'
        },
        no_combo: function() {
            var self = this;
            $('#popup .cancel').trigger('click');
            var target_product_view = $('.product_list_item[data-id='+ this.model.get('product').get('compositeId') + ']');
            setTimeout( function() {
                target_product_view && target_product_view.trigger('click', {no_combo: true, combo_root: self.model});
            }, 10);
        },
        action: function (event) {
            var check_root_modifiers = this.model.check_order({ modifiers_only: true });
            if (check_root_modifiers.status !== 'OK') {
                this.model.trigger("set_modifiers_before_add");//invoke modifiers page for the root product
            } else {
                _base.prototype.action.apply(this, arguments);
            }
        }
      });
    }

    App.Views.CoreMyOrderView.CoreMyOrderItemView = App.Views.FactoryView.extend({
        name: 'myorder',
        mod: 'item',
        initialize: function() {
            App.Views.FactoryView.prototype.initialize.apply(this, arguments);
            this.listenTo(this.model, 'change', this.update);
            this.listenTo(this.model.get_product(), 'change', this.update);
        },
        start: function() {
            this.listenTo(this.model, 'change', this.update);
            this.listenTo(this.model.get_product(), 'change', this.update);
            this.update();
        },
        stop: function() { //called by FactotyView while the view detached from DOM
            //it's for save time for useless processing:
            this.stopListening();
        },
        renderModifiers: function() {
            var self = this,
                modifiers = this.model.get_modifiers();

            modifiers && modifiers.models.sort(function(model1, model2){ return model1.get('sort') > model2.get('sort') });
            modifiers && modifiers.each(function(modifier) {
                if(modifier.get('admin_modifier') && (modifier.get('admin_mod_key') == 'SPECIAL' || modifier.get('admin_mod_key') == 'SIZE'))
                    return;
                var selected = modifier.get('modifiers').where({selected: true});
                selected.forEach(function(modifier) {
                    var view = App.Views.GeneratorView.create('MyOrder', {
                        el: $('<li></li>'),
                        mod: 'Modifier',
                        model: modifier
                    });
                    self.subViews.push(view);

                    self.$('.modifier_place').append(view.el);
                });
            });
        },
        render: function() {
            var self = this, view;

            this.$el.html(this.template(this.getData()));

            this.renderModifiers();

            view = App.Views.GeneratorView.create('MyOrder', {
                el: $('<li></li>'),
                mod: 'ProductDiscount',
                model: this.model
            });
            self.subViews.push(view);
            self.$('.discount_place').append(view.el);
            return this;
        },
        getData: function() {
            var self = this, num_digits,
                model = this.model.toJSON(),
                modifiers = this.model.get_modifiers(),
                product = this.model.get_product(),
                sizeModifier = modifiers ? modifiers.getSizeModel() : null,
                systemSettings = App.Data.settings.get('settings_system');

            model.sizeModifier = sizeModifier ? sizeModifier.get('name') : '';
            model.is_gift = product.get('is_gift');
            model.name = model.is_gift ? systemSettings.business_name : product.get('name');
            model.gift_name = model.is_gift ? product.get('name') : null;
            model.currency_symbol = systemSettings.currency_symbol;

            model.initial_price = round_monetary_currency(this.model.get('initial_price'));

            model.uom = systemSettings.scales.default_weighing_unit;
            model.gift_card_number = product.get('gift_card_number');
            model.sold_by_weight = model.product.get("sold_by_weight");
            model.label_manual_weights = systemSettings.scales.label_for_manual_weights;
            model.image = product.get_product().get('image');
            model.id = product.get_product().get('id');
            model.is_service_fee = this.model.isServiceFee();
            model.attrs = this.model.get_attributes() || [];

            if (model.sold_by_weight) {
                num_digits = systemSettings.scales.number_of_digits_to_right_of_decimal;
                model.weight = model.weight.toFixed(num_digits);
            }

            var productSum = model.initial_price;
            if (model.sold_by_weight && model.weight) {
                productSum *= model.weight;
            }
            if (product.get("is_combo") || product.get("has_upsell"))
                productSum = product.get("combo_price") * model.quantity;
            else if( model.is_service_fee ) {
                productSum = round_monetary_currency(model.initial_price);
            } else {
                productSum = productSum * model.quantity;
            }
            model.product_sum = round_monetary_currency( productSum );
            //trace("render ==> ", model.name, product.get("is_combo"), model.initial_price, model.product_sum);
            return model;
        },
        events: {
            'click .remove': "removeItem",
            'click .edit': "editItem"
        },
        onEnterListeners: {
            '.remove': "removeItem",
            '.edit': "editItem"
        },
        removeItem: function(e) {
            e.preventDefault();
            this.collection.remove(this.model);
        },
        editItem: function(e) {
            e.preventDefault();
        },
        update: function() {
            this.subViews.remove();
            this.render();
        }
    });

    var CoreMyOrderItemView = App.Views.CoreMyOrderView.CoreMyOrderItemView;
    App.Views.CoreMyOrderView.CoreMyOrderItemComboView = CoreMyOrderItemView.extend({
        render: function() {
            var self = this, view,
                modifiers = this.model.get_modifiers(),
                model = this.getData();

            if (this.model.isUpsellProduct()) {
                model.name = model.upcharge_name;
            }

            this.$el.html(this.template(model));

            if (this.model.isChildProduct()) {
                this.renderModifiers();
            }

            if (!this.model.isChildProduct()) {
                view = App.Views.GeneratorView.create('MyOrder', {
                    el: this.$('.combo_products_place'),
                    mod: 'ComboList',
                    collection: this.model.get('product').get('product_sets').get_selected_products()
                });
                self.subViews.push(view);
            }

            if (!this.model.isChildProduct()) {
                view = App.Views.GeneratorView.create('MyOrder', {
                    el: $('<li></li>'),
                    mod: 'ProductDiscount',
                    model: this.model
                });
                self.subViews.push(view);
                self.$('.discount_place').append(view.el);
            }

            return this;
        }
    });

    App.Views.CoreMyOrderView.CoreMyOrderItemUpsellRootView = CoreMyOrderItemView.extend({
        name: 'myorder',
        mod: 'item_upsell_root',
        render: function() {
            var self = this,
                model = this.getData();

            model.quantity = 1;
            this.$el.html(this.template(model));

            this.renderModifiers();
            return this;
        }
    });

    var CoreMyOrderItemComboView = App.Views.CoreMyOrderView.CoreMyOrderItemComboView;
    App.Views.CoreMyOrderView.CoreMyOrderItemUpsellView = CoreMyOrderItemComboView.extend({
        render: function() {
            var self = this, view;
            CoreMyOrderItemComboView.prototype.render.apply(this, arguments);

            view = App.Views.GeneratorView.create('MyOrder', {
                el: this.$('.upsell_root_product_place'),
                mod: 'ItemUpsellRoot',
                model: this.model,
                collection: this.collection
            });

            self.subViews.push(view);
        }
    });

    App.Views.CoreMyOrderView.CoreMyOrderDiscountView = App.Views.FactoryView.extend({
        name: 'myorder',
        mod: 'discount',
        initialize: function() {
            App.Views.FactoryView.prototype.initialize.apply(this, arguments);
            this.listenTo(this.model, 'change', this.render, this);
        },
        render: function() {
            var model = {};
            // this.model is the instance of App.Models.DiscountItem
            model.currency_symbol = App.Settings.currency_symbol;
            model.discount_sum = this.model.toString();
            model.discount_name = this.model.get('name');
            this.$el.html(this.template(model));
            if (this.model.get("sum") <= 0) {
                this.$el.hide();
            }
            else {
                this.$el.show();
            }
            return this;
        }
    });

    App.Views.CoreMyOrderView.CoreMyOrderListView = App.Views.FactoryView.extend({
        name: 'myorder',
        mod: 'list',
        initialize: function() {
            App.Views.FactoryView.prototype.initialize.apply(this, arguments);
            this.startListen();
        },
        startListen: function() {
            this.listenTo(this.collection, 'add', this.addItem, this);
            this.listenTo(this.collection, 'remove', this.removeItem, this);
        },
        start: function() {
            this.render();
            this.startListen();
            App.Views.FactoryView.prototype.start.apply(this, arguments);
        },
        stop: function() { //called by FactotyView while the view detached from DOM
            //it's to save time by stopping useless processing:
            this.stopListening();
            App.Views.FactoryView.prototype.stop.apply(this, arguments);
        },
        render: function() {
            this.discountItemView = null;
            this.$el.html(this.template());

            this.collection.each(this.addItem.bind(this));
        },
        resolveItemMod: function(model) {
            if (model.isComboBased()) {
                return model.isUpsellProduct() ? 'ItemUpsell' : 'ItemCombo';
            } else {
                return 'Item';
            }
        },
        addItem: function(model) {
            var mod = this.resolveItemMod(model);
            var view = App.Views.GeneratorView.create('MyOrder', {
                mod: mod,
                model: model,
                el: $('<li></li>'),
                collection: this.collection,
                no_qty_arrows: this.options.no_qty_arrows
            });

            if (model.isServiceFee()) {
                this.subViews.push(view);
                this.$('.service_fees').append(view.el);
                return;
            }

            this.subViews.push(view);
            this.$('.myorder').append(view.el);

            if (this.subViews.indexOf(this.discountItemView) == -1 && this.collection.discount && !this.discountItemView ) {
                var view = App.Views.GeneratorView.create('MyOrder', {
                    mod: 'Discount',
                    model: this.options.saved_discount ? this.options.saved_discount : this.collection.discount,
                    el: $('<li></li>')
                });
                this.subViews.push(view);
                this.discountItemView = view;
                this.$('.order-discount').append(this.discountItemView.el);
            }
        },
        removeItem: function(model) {
            var self = this;
            this.subViews.forEach(function(view, i) {
                if(model === view.model) {
                    view.remove();
                    self.subViews.splice(i, 1);
                    return true;
                }
            });
        }
    });

    App.Views.CoreMyOrderView.CoreMyOrderComboListView = App.Views.CoreMyOrderView.CoreMyOrderListView.extend({
        name: 'myorder',
        mod: 'combo_list',
        addItem: function(model) {
            var view = App.Views.GeneratorView.create('MyOrder', {
                mod: 'ItemCombo',
                model: model,
                el: $('<li></li>'),
                collection: this.collection
            });

            this.subViews.push(view);
            this.$('.myorder_combo').append(view.el);
        }
    });

    App.Views.CoreMyOrderView.CoreMyOrderNoteView = App.Views.FactoryView.extend({
        name: 'myorder',
        mod: 'note',
        events: {
            'change .note_field textarea' : 'change_note'
        },
        render: function() {
            var data = {
                noteAllow: App.Data.settings.get('settings_system').order_notes_allow,
                note: this.model.get('notes')
            };
            this.$el.html(this.template(data));
        },
        change_note: function(e) {
            this.model.set('notes', e.target.value);
        }
    });

    App.Views.CoreMyOrderView.CoreMyOrderStanfordItemView = App.Views.CoreMyOrderView.CoreMyOrderItemView.extend({
        name: 'myorder',
        mod: 'stanford_item',
        initialize: function() {
            _.extend(this.bindingSources, {
                stanford: this.model.get('stanfordCard'),
                state: new Backbone.Model({
                    showPlans: false,
                    addMode: this.options.action === 'add'
                })
            });
            App.Views.CoreMyOrderView.CoreMyOrderItemView.prototype.initialize.apply(this, arguments);
        },
        bindings: {
            // initial_price can be only integer according Stanford card reload service limitation (Bug 30983)
            '.initial-price': 'value: integer(price), events: ["input"], restrictInput: "0123456789.,", kbdSwitcher: "numeric", pattern: /^\\d*$/',
            '.next': 'classes: {validated: stanford_validated, disabled: not(all(decimal(initial_price), select(stanford_validated, stanford_planId, true), stanford_number, stanford_captchaValue, stanford_captchaKey))}',
            '.view-1': 'toggle: not(state_showPlans)',
            '.view-2': 'toggle: state_showPlans',
            '.stanford-number': 'text: stanford_card_number',
            '.amount': 'text: currencyFormat(initial_price)',
            '.add-item': 'classes: {disabled: not(planId)}, text: select(state_addMode, _lp_MYORDER_ADD_ITEM, _lp_MYORDER_UPDATE_ITEM)'
        },
        computeds: {
            // used in an input element because we need to change price in product to keep a correct item restoring from a storage during payment process
            price: {
                deps: ['product'],
                get: function() {
                    return this.model.get_product().get('price');
                },
                set: function(value) {
                    value = parseInt(value) || 0;
                    this.model.get_product().set('price', value);
                }
            }
        },
        events: {
            'click .next': 'next',
            'click .back': 'back',
            'click .add-item': 'action'
        },
        render: function() {
            App.Views.CoreMyOrderView.CoreMyOrderItemView.prototype.render.apply(this, arguments);

            var stanford = this.model.get('stanfordCard'),
                stanfordCard, stanfordPlans;

            stanfordCard = App.Views.GeneratorView.create('StanfordCard', {
                el: this.$('.card-wrapper'),
                mod: 'Reload',
                model: this.model.get('stanfordCard')
            });

            stanfordPlans = App.Views.GeneratorView.create('StanfordCard', {
                el: this.$('.plans'),
                mod: 'Plans',
                collection: stanford.get('plans')
            });

            this.subViews.push(stanfordCard);
            this.subViews.push(stanfordPlans);

            return this;
        },
        next: function() {
            var self = this, stanfordCard,
                mainModel = App.Data.mainModel;

            if(this.hasPlans()) {
                self.setBinding('state_showPlans', true);
            } else {
                mainModel && mainModel.trigger('loadStarted');
                stanfordCard = this.getBinding('$stanford');
                stanfordCard.getPlans(true).then(function() {
                    self.setBinding('state_showPlans', self.hasPlans());
                    stanfordCard.trigger("onResetData");
                    mainModel && mainModel.trigger('loadCompleted');
                });
            }
        },
        back: function() {
            this.setBinding('state_showPlans', false);
        },
        hasPlans: function() {
            var stanfordCard = this.model.get('stanfordCard');
            return stanfordCard.get('validated') && stanfordCard.get('plans').length;
        },
        action: function (event) {
            var check = this.model.check_order();

            if (check.status === 'OK') {
                if (this.getBinding('state_addMode')) {
                    App.Data.myorder.add(this.model);
                } else {
                    var index = App.Data.myorder.indexOf(this.model) - 1;
                    App.Data.myorder.remove(this.options.real);
                    App.Data.myorder.add(this.model, {at: index});
                }

                $('#popup .cancel').trigger('click');
            } else {
                App.Data.errors.alert(check.errorMsg); // user notification
            }
        },
        // override parent's update method to avoid re-rendering
        update: new Function()
    });

    return new (require('factory'))(stanfordcard_view.initViews.bind(stanfordcard_view), function() {
        App.Views.MyOrderView = {};
        App.Views.MyOrderView.MyOrderModifierView = App.Views.CoreMyOrderView.CoreMyOrderModifierView;
        App.Views.MyOrderView.MyOrderProductDiscountView = App.Views.CoreMyOrderView.CoreMyOrderProductDiscountView;
        App.Views.MyOrderView.MyOrderDiscountView = App.Views.CoreMyOrderView.CoreMyOrderDiscountView;
        App.Views.MyOrderView.MyOrderItemView = App.Views.CoreMyOrderView.CoreMyOrderItemView;
        App.Views.MyOrderView.MyOrderListView = App.Views.CoreMyOrderView.CoreMyOrderListView;
        App.Views.MyOrderView.MyOrderComboListView = App.Views.CoreMyOrderView.CoreMyOrderComboListView;
        App.Views.MyOrderView.MyOrderMatrixView = App.Views.CoreMyOrderView.CoreMyOrderMatrixView;
        App.Views.MyOrderView.MyOrderMatrixFooterView = App.Views.CoreMyOrderView.CoreMyOrderMatrixFooterView;
        App.Views.MyOrderView.MyOrderMatrixFooterComboView = App.Views.CoreMyOrderView.CoreMyOrderMatrixFooterComboView;
        App.Views.MyOrderView.MyOrderMatrixFooterUpsellView = App.Views.CoreMyOrderView.CoreMyOrderMatrixFooterUpsellView;
        App.Views.MyOrderView.MyOrderNoteView = App.Views.CoreMyOrderView.CoreMyOrderNoteView;
        App.Views.MyOrderView.MyOrderStanfordItemView = App.Views.CoreMyOrderView.CoreMyOrderStanfordItemView;
        App.Views.MyOrderView.MyOrderMatrixComboView = App.Views.CoreMyOrderView.CoreMyOrderMatrixComboView;
        App.Views.MyOrderView.MyOrderItemComboView = App.Views.CoreMyOrderView.CoreMyOrderItemComboView;
        App.Views.MyOrderView.MyOrderItemUpsellView = App.Views.CoreMyOrderView.CoreMyOrderItemUpsellView;
        App.Views.MyOrderView.MyOrderItemUpsellRootView = App.Views.CoreMyOrderView.CoreMyOrderItemUpsellRootView;
    });
});
