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

    var MyOrderMatrixView = App.Views.CoreMyOrderView.CoreMyOrderMatrixView.extend({
        render: function() {
            App.Views.CoreMyOrderView.CoreMyOrderMatrixView.prototype.render.apply(this, arguments);

            var model = this.model,
                view, mod;

            var sold_by_weight = this.model.get_product().get("sold_by_weight");
            if (!this.options.combo_child || sold_by_weight) {
                mod = sold_by_weight ? 'Weight' : 'Main';

                view = App.Views.GeneratorView.create('Quantity', {
                    el: this.$('.quantity_info'),
                    model: model,
                    mod: mod
                });
                this.subViews.push(view);
            }

            if (App.Settings.special_requests_online && !this.options.combo_child) {
                view = App.Views.GeneratorView.create('Instructions', {
                    el: this.$('.product_instructions'),
                    model: model,
                    mod: 'Modifiers'
                });
                this.subViews.push(view);
            }

            return this;
        }
    });

    var MyOrderItemView = _MyOrderItemView( App.Views.CoreMyOrderView.CoreMyOrderItemView );
    var MyOrderItemComboView = _MyOrderItemView( App.Views.CoreMyOrderView.CoreMyOrderItemComboView );
    var MyOrderItemUpsellView = _MyOrderItemView( App.Views.CoreMyOrderView.CoreMyOrderItemUpsellView );

    function _MyOrderItemView(_base){ return _base.extend({
        editItem: function(e) {
            e.preventDefault();
            var index = this.model.collection.models.indexOf(this.model);
            if (this.model.isComboBased()) {
                if (this.model.isUpsellProduct()){
                    App.Data.router.navigate('upsell_product/' + index, true);
                } else {
                    App.Data.router.navigate('combo_product/' + index, true);
                }
            }
            else
                App.Data.router.navigate('modifiers/' + index, true);
        }
      });
    }

    var MyOrderListView = App.Views.CoreMyOrderView.CoreMyOrderListView.extend({
        bindings: {
            ':el': 'toggle: items',
            '.edit': 'toggle: !disallowEdit'
        },
        computeds: {
            items: function() {
                return this.getBinding('$collection').get_only_product_quantity();
            },
            disallowEdit: function() {
                return Boolean(this.options.disallow_edit);
            }
        }
    });

    var MyOrderMatrixComboView = App.Views.CoreMyOrderView.CoreMyOrderMatrixComboView.extend({
        initialize: function() {
            App.Views.CoreMyOrderView.CoreMyOrderMatrixComboView.prototype.initialize.apply(this, arguments);
            this.listenTo(this.model, 'combo_product_change', this.check_weight_product);
            this.check_weight_product();
            return this;
        },
        check_weight_product: function() {
            var isComboWithWeightProduct = this.model.get('product').get("product_sets").haveWeightProduct();
            this.options.model.trigger('combo_weight_product_change', isComboWithWeightProduct);
        },

        render: function() {
            App.Views.CoreMyOrderView.CoreMyOrderMatrixComboView.prototype.render.apply(this, arguments);

            var model = this.model,
                view;

            var sold_by_weight = this.model.get_product().get("sold_by_weight"),
                mod = sold_by_weight ? 'Weight' : 'Main';

            view = App.Views.GeneratorView.create('Quantity', {
                el: this.$('.quantity_info'),
                model: model,
                mod: mod,
                myorder_root: model
            });
            this.subViews.push(view);

            if(App.Settings.special_requests_online) {
                view = App.Views.GeneratorView.create('Instructions', {
                    el: this.$('.product_instructions'),
                    model: model,
                    mod: 'Modifiers'
                });
                this.subViews.push(view);
            }

            return this;
        }
    });

    var MyOrderStanfordItemView = App.Views.CoreMyOrderView.CoreMyOrderStanfordItemView.extend({
        name: 'myorder',
        mod: 'stanford_item',
        bindings: {
            '.price': App.Views.CoreMyOrderView.CoreMyOrderStanfordItemView.prototype.bindings['.initial-price'],
            '.currency': 'text: _system_settings_currency_symbol',
            '.next': App.Views.CoreMyOrderView.CoreMyOrderStanfordItemView.prototype.bindings['.next'],
            '.plans-view': 'toggle: stanfordState_showPlans',
            '.plans-title': 'toggle: false'
        },
        events: {
            'click .next': 'next'
        },
        next: function() {
            var func = this.options.action;
            typeof func == 'function' && func();
        },
        // override parent's update method to avoid re-rendering
        update: new Function()
    });

    var MyOrderDetailsView = App.Views.FactoryView.extend({
        name: 'myorder',
        mod: 'details',
        className: 'myorder-details list-separator',
        bindings: {
            '.store-logo': 'attr: {src: _system_settings_logo_img}',
            '.store-type': 'text: storeType',
            '.store-name': 'text: _system_settings_business_name',
            '.order-time-block': 'toggle: equal(dining_option, 2)',
            '.order-time': 'text: pickup_time',
            '.order-address-block': 'toggle: equal(dining_option, 2)',
            '.order-address': 'text: deliveryAddress',
            '.promotions-link': 'toggle: _system_settings_has_campaigns'
        },
        computeds: {
            deliveryAddress: {
                deps: ['delivery_address'],
                get: function(address) {
                    if (!address) {
                        return '';
                    }

                    var addressLine = address.street_1;
                    if (address.street_2) {
                        addressLine += ' ' + address.street_2;
                    }
                    addressLine += ', ' + address.city;
                    addressLine += ' ' + address.zipcode;

                    return addressLine;
                }
            },
            storeType: {
                deps: ['_system_settings_type_of_service'],
                get: function(type) {
                    var service = (_.invert(ServiceType))[type],
                        result = _loc['FILTERS']['STORE_TYPE_RESTAURANT'];

                    if (service === 'RETAIL') {
                        result = _loc['FILTERS']['STORE_TYPE_RETAIL'];
                    }
                    if(service === 'GROCERY') {
                        result = _loc['FILTERS']['STORE_TYPE_GROCERY'];
                    }

                    return result;
                }
            }
        }
    });

    return new (require('factory'))(myorder_view.initViews.bind(myorder_view), function() {
        App.Views.MyOrderView.MyOrderListView = MyOrderListView;
        App.Views.MyOrderView.MyOrderMatrixView = MyOrderMatrixView;
        App.Views.MyOrderView.MyOrderMatrixComboView = MyOrderMatrixComboView;
        App.Views.MyOrderView.MyOrderItemView = MyOrderItemView;
        App.Views.MyOrderView.MyOrderItemComboView = MyOrderItemComboView;
        App.Views.MyOrderView.MyOrderItemUpsellView = MyOrderItemUpsellView;
        App.Views.MyOrderView.MyOrderStanfordItemView = MyOrderStanfordItemView;
        App.Views.MyOrderView.MyOrderDetailsView = MyOrderDetailsView;
    });
});
