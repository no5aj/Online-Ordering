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

define(["myorder_view"], function(myorder_view) {
    'use strict';

    var CoreViews = App.Views.CoreMyOrderView;

    var DynamicHeightHelper_Modifiers = DynamicHeightHelper(CoreViews.CoreMyOrderMatrixView.prototype);

    var MyOrderMatrixView = _MyOrderMatrixView( CoreViews.CoreMyOrderMatrixView )
                                                    .mixed( DynamicHeightHelper_Modifiers );
    function _MyOrderMatrixView(_base){ return _base.extend({
        bindings: {
            '.popup__title': 'text: popup_text'
        },
        computeds: {
            isGiftCard: {
                deps: ['$model'],
                get: function(model) {
                    return model.get_product().get('is_gift');
                }
            },
            popup_text: function() {
                return this.getBinding('isGiftCard') ? _loc.GIFT_CARD_RELOAD : (this.options.combo_child ? _loc.CUSTOMIZE_ITEM : _loc.CUSTOMIZE);
            }
        },
        render: function() {
            _base.prototype.render.apply(this, arguments);
            this.renderProductFooter();
            this.dh_initialize();
            return this;
        }
      });
    };

    function DynamicHeightHelper(_base_proto) {
      return {
        dh_initialize: function() {
            $('#popup').addClass('ui-invisible');
            setTimeout(this.dh_change_height.bind(this, 1), 20);
            this.interval = this.interval || setInterval(this.dh_change_height.bind(this), 500); // check size every 0.5 sec
        },
        events: {
            'change_height .product_instructions': 'dh_change_height' // if special request button pressed
        },
        dh_change_height: function(e) {
            var prev_popup_height = this.prev_popup_height || 0,
                popup_height = $('#popup').outerHeight(),
                prev_window_height = this.prev_window_height || 0,
                window_heigth = $(window).height();
            if (this.is_hidden == true ){
                //don't change size for cached view which was temporary closed
                return;
            }
            if (e || prev_popup_height !== popup_height || prev_window_height !== window_heigth) {
                var el = this.$('.modifiers_table'),
                    product = this.$('.product_info').outerHeight(true),
                    footer = this.$('.product_info_footer').outerHeight(true),
                    title = this.$('.popup__title').outerHeight(true),
                    prev_el_scroll = el.get(0).scrollTop,
                    el_paddings = parseInt(el.css('padding-top')) + parseInt(el.css('padding-bottom')); // Bug 44157

                el.css('max-height', (popup_height - title - product - footer - el_paddings) + 'px');

                // Bug 37299. Handle scrollTop update here instead of inside $.contentarrow
                if (prev_el_scroll > 0) {
                    el.get(0).scrollTop = prev_el_scroll;
                }

                this.prev_popup_height = popup_height;
                this.prev_window_height = window_heigth;

                $('#popup').removeClass('ui-invisible');
            }
        },
        remove: function() {
            clearInterval(this.interval);
            _base_proto.remove.apply(this, arguments);
        }
      };
    }

    var DynamicHeightHelper_Combo = DynamicHeightHelper(CoreViews.CoreMyOrderMatrixComboView.prototype);

    var MyOrderMatrixComboView = _MyOrderMatrixComboView( CoreViews.CoreMyOrderMatrixComboView )
                                                         .mixed( DynamicHeightHelper_Combo );
    function _MyOrderMatrixComboView(_base){ return _base.extend({
        bindings: {
            '.popup__title': 'text: _lp_CUSTOMIZE_COMBO'
        },
        render: function() {
            _base.prototype.render.apply(this, arguments);
            this.renderProductFooter();
            this.dh_initialize();
            return this;
        }
      });
    };

    var MyOrderMatrixUpsellRootView = _MyOrderMatrixUpsellRootView( CoreViews.CoreMyOrderMatrixView )
                                                         .mixed( DynamicHeightHelper_Combo );
    function _MyOrderMatrixUpsellRootView(_base){ return _base.extend({
        bindings: {
            '.popup__title': 'text: _lp_CUSTOMIZE'
        },
        render: function() {
            _base.prototype.render.apply(this, arguments);
            this.renderProductFooter();
            this.dh_initialize();
            return this;
        },
        renderProduct: function() {
            var viewOptions = {
                modelName: 'Product',
                model: this.model,
                mod: 'Modifiers',
                hide_timetable: true
            };

            this.viewProduct = this.createView('Product', viewOptions);
            this.$('.product_info').append(this.viewProduct.el);
            this.subViews.push(this.viewProduct);
        },
        renderProductFooter: function() {
            var model = this.model,
                product = this.model.get("product");

            var view = this.createView('MyOrder', {
                el: this.$(".product_info_footer"),
                model: this.model,
                mod: 'Matrix_UpsellRootFirst_Footer',
                action: this.options.action,
                action_text_label: this.options.action_text_label,
                real: this.options.real,
                action_callback: this.options.action_callback
            });
            this.subViews.push(view);
        }
      });
    };

    var MyOrderMatrix_UpsellRootFirst_FooterView = App.Views.CoreMyOrderView.CoreMyOrderMatrixFooterView.extend({
        name: 'myorder',
        mod: 'matrix_upsell_root_first_footer',
        bindings: {
            '.upgrade_combo_button': 'text: combo_btn_label'
        },
        events: {
            'click .upgrade_combo_button': 'upgrade_combo'
        },
        computeds: {
            combo_btn_label: function() {
                return this.options.action == "add" ? _loc.MYORDER_UPGRADE_TO_COMBO : _loc.MYORDER_EDIT_COMBO;
            }
        },
        onEnterListeners: {
            '.upgrade_combo_button': 'upgrade_combo'
        },
        upgrade_combo: function() {
            var check = this.view_check_order();
            if (check.status == "OK") {
                $('#popup .cancel').trigger('click', ['Combo']);
            } else {
                App.Data.errors.alert(check.errorMsg);
            }
        },
        render: function() {
            App.Views.CoreMyOrderView.CoreMyOrderMatrixFooterView.prototype.render.apply(this, arguments);

            var view = this.createView('Product', {
                el: this.$('.product_price'),
                model: this.model,
                mod: 'Price'
            });
            this.subViews.push(view);
            return this;
        }
    });

    var MyOrderItemView = _MyOrderItemView( App.Views.CoreMyOrderView.CoreMyOrderItemView );
    var MyOrderItemComboView = _MyOrderItemView( App.Views.CoreMyOrderView.CoreMyOrderItemComboView );
    var MyOrderItemUpsellView = _MyOrderItemView( App.Views.CoreMyOrderView.CoreMyOrderItemUpsellView );

    function _MyOrderItemView(_base) { return _base.extend({
        render: function() {
            _base.prototype.render.apply(this, arguments);

            var view, mod,
                sold_by_weight = this.model.get_product().get("sold_by_weight") && !this.model.isUpsellProduct();

            if (sold_by_weight || !this.options.flags || this.options.flags.indexOf('no_quantity') == -1) {
                mod = sold_by_weight ? 'WeightCart' : 'MainCart';

                view = App.Views.GeneratorView.create('Quantity', {
                    el: this.$('.qty-box'),
                    model: this.model,
                    mod: mod,
                    no_qty_arrows: this.options.no_qty_arrows
                });
                this.subViews.push(view);
            }

            return this;
        },
        editItem: function(event) {
            event.preventDefault();
            var self = this,
                model = this.model,
                isStanfordItem = App.Data.is_stanford_mode && this.model.get_product().get('is_gift');

            var combo_based = model.isComboBased();
            var has_upsell = model.isUpsellProduct();
            if (has_upsell) {
                App.Data.controllers.get('UpsellProductCRL').editUpsellProduct(model);
                return;
            }

            var cache_id = combo_based ? model.get("id_product") : undefined;

            App.Data.mainModel.set('popup', {
                modelName: 'MyOrder',
                mod: isStanfordItem ? 'StanfordItem' : (combo_based ? 'MatrixCombo' : 'Matrix'),
                className: isStanfordItem ? 'stanford-reload-item' : '',
                model: model.clone(),
                real: model,
                action: 'update',
                init_cache_session: combo_based ? true : false,
                cache_id: combo_based ? cache_id : undefined //cache is enabled for combo products during the phase of product customization only
                                                          //the view will be removed from cache after the product is added/updated into the cart.
            });
        }
    });
    }

    var MyOrderItemSpecialView = App.Views.FactoryView.extend({
        name: 'myorder',
        mod: 'itemSpecial',
        render: function() {
            var model = {
                name: this.model.get_product().get('name'),
                special: this.model.get_special()
            };
            this.$el.html(this.template(model));
        }
    });

    var MyOrderMatrixFooterView = App.Views.CoreMyOrderView.CoreMyOrderMatrixFooterView.extend({
        bindings: {
            '.product_price_label': 'classes: {hide: select(isGift, false, true)}'
        },
        computeds: {
            isGift: {
                deps: ['product'],
                get: function(product) {
                    return Boolean(product.get('is_gift'));
                }
            }
        },
        render: function() {
            App.Views.CoreMyOrderView.CoreMyOrderMatrixFooterView.prototype.render.apply(this, arguments);

            var view = this.createView('Product', {
                el: this.$('.product_price'),
                model: this.model,
                mod: 'Price'
            });

            this.subViews.push(view);

            return this;
        }
    });

    var MyOrderMatrixComboItemFooterView = App.Views.CoreMyOrderView.CoreMyOrderMatrixFooterView.extend({
        initialize: function() {
            this.extendBindingSources({_product: this.model.get_product()});
            App.Views.FactoryView.prototype.initialize.apply(this, arguments);
        },
        bindings: {
            '.product_price_label': 'classes: {hide: true}',
            '.footer-line': 'classes: {hide: not(_product_sold_by_weight)}'
        }
    });

    return new (require('factory'))(myorder_view.initViews.bind(myorder_view), function() {
        App.Views.MyOrderView.MyOrderMatrixView = MyOrderMatrixView;
        App.Views.MyOrderView.MyOrderMatrixComboView = MyOrderMatrixComboView;
        App.Views.MyOrderView.MyOrderItemView = MyOrderItemView;
        App.Views.MyOrderView.MyOrderItemComboView = MyOrderItemComboView;
        App.Views.MyOrderView.MyOrderItemUpsellView = MyOrderItemUpsellView;
        App.Views.MyOrderView.MyOrderItemSpecialView = MyOrderItemSpecialView;
        App.Views.MyOrderView.MyOrderMatrixFooterView = MyOrderMatrixFooterView;
        App.Views.MyOrderView.MyOrderMatrixUpsellRootView = MyOrderMatrixUpsellRootView;
        App.Views.MyOrderView.MyOrderMatrix_UpsellRootFirst_FooterView = MyOrderMatrix_UpsellRootFirst_FooterView;
        App.Views.MyOrderView.MyOrderMatrixComboItemFooterView = MyOrderMatrixComboItemFooterView;
    });
});
