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

/**
 * Contains {@link App.Models.ProductSet}, {@link App.Collections.ProductSetModels}, {@link App.Collections.ProductSets} constructors.
 * @module product_sets
 * @requires module:backbone
 * @requires module:products
 * @requires module:collection_sort
 * @requires module:myorder
 * @see {@link module:config.paths actual path}
 */
define(["backbone", 'products', 'collection_sort', 'myorder'], function(Backbone) {
    'use strict';

    /**
    * @class
    * @classdesc Represents product set of the Combo/Upsell product
    * ```
    * Combo / Upsell products model arhitecture:
    *
    *    App.Data.myorder [* (Collections.Myorder)
    *                      |
    * Models.MyorderCombo  * -- product { is_combo = true (or has_upsell = true),
    *                      |              product_sets [* (Collections.ProductSets) }
    *                      *]                           |
    *                                 Models.ProductSet * -- order_products [* (Collections.ProductSetModels)
    *                                                   |                    |
    *                                                   *]                   * (Models.Myorder) - {  modifiers,
    *                                                                        |                       quantity,
    *                                                                        *]                      product (Models.Product)
    *                                                                                                selected (true/false)
    *                                                                                              }
    * ```
    * @alias App.Models.ProductSet
    * @augments Backbone.Model
    */

    App.Models.ProductSet = Backbone.Model.extend(
    /**
     * @lends App.Models.ProductSet.prototype
     */
    {
        /**
         * Contains attributes with default values.
         * @type {object}
         * @enum
         */
        defaults: {
            /**
             * The name of a product set
             * @type {?string}
             * @default null
             */
            name: null,
            /**
             * id of a product set.
             * @type {?number}
             * @default null
             */
            id: null,
             /**
             * is_combo_saving of a product set
             * @type {number}
             * @default null
             */
            is_combo_saving : false,
             /**
             * collection of products in a product set
             * @type {?App.Collections.ProductSetModels}
             * @default null
             */
            order_products : null,
            /**
             * minimum products quantity that user may select for this product set
             * @type {number}
             * @default 1
             */
            minimum_amount : 1,
             /**
             * maximum products quantity that user may select for this product set
             * @type {number}
             * @default 1
             */
            maximum_amount : 1,
            /**
             * the array of default product ids which are selected by default for this product set
             * @type {?Array}
             * @default null
             */
            default_products: null,
            /*
            * the current qty to add for this product set
            * @type {number}
            * @default 1
            */
            cur_qty_to_add: 1
        },
        /**
         * Initialization through a json object, internal method used for order restoring from localStorage
         * @param {Object} data
         */
        addJSON: function(data) {
            var self = this, ext_data, product;
            var order_products = new App.Collections.ProductSetModels();

            data['order_products'].forEach(function(p_data) {
                var json = _.extend({}, p_data, {
                    product: p_data.product,
                    modifiers: p_data.modifiers
                });
                var order_product = new App.Models.Myorder();
                order_product.addJSON(json);
                order_products.add(order_product);
                order_product.set('initial_price', order_product.get_initial_price());
            });
            ext_data = _.extend({}, data, ext_data);
            ext_data['order_products'] = order_products;
            this.set(ext_data);
        },
        /**
         * Initialization through a json object, used after the server is requested for product sets information
         * @param {Object} data
         */
        addAjaxJSON: function(data, combo_type) {
            var self = this, ext_data = {}, product;

            ext_data.minimum_amount = data.quantity ? data.quantity : 1;
            ext_data.maximum_amount = data.quantity ? data.quantity : 1;
            !Array.isArray(data.default_products) && (data.default_products = []);

            var order_products = new App.Collections.ProductSetModels();

            data['products'].forEach(function(p_data) {
                p_data.compositeId = p_data.id + '_' + p_data.id_category;
                p_data.has_upsell = false;
                var json = {
                    product: p_data,
                    modifiers: p_data.modifier_classes ? p_data.modifier_classes : [],
                }
                delete p_data.modifier_classes;

                var order_product = new App.Models.Myorder();
                order_product.addJSON(json);
                order_product.set({
                    sum: order_product.get_modelsum(), // sum with modifiers
                    initial_price: order_product.get_initial_price(),
                    is_child_product: true,
                    selected: data.default_products.indexOf(p_data.id) != -1 && order_product.check_order().status == 'OK'
                });
                order_product.update_prices();
                order_products.add(order_product);
            });
            if (combo_type == 'upsell') {
                order_products.models.sort(order_products.sort_comparator);
            }
            ext_data['order_products'] = order_products;

            ext_data = _.extend({}, data, ext_data);
            delete ext_data['products'];
            this.set(ext_data);
        },
        /**
         * Get selected products quantity - sum of quantities of each selected product
         * @return {number} - quantity
         */
        get_selected_qty: function() {
            var qty = 0;
            var products = this.get("order_products");
            products.where({selected: true}).forEach(function(order_product) {
                qty += order_product.get("quantity");
            });
            return qty;
        },
        /**
         * Get json for cart_totals/create_order_and_pay requests
         * @param {boolean} for_discount = true when cart totals is used, false - when create_order_and_pay request used
         * @return {Object} - json
         */
        item_submit: function(for_discount) {
            var json = {
                   id: this.get('id'),
                   name: this.get('name'),
                   products: []
                }
            this.get('order_products').each(function(model) {
                if(model.get('selected')) {
                    json.products.push(model.item_submit(for_discount));
                }
            });
            return json;
        },
        /**
         * Get all selected products
         * @return {Object} - App.Collections.ProductSetModels collection filtered
         */
        get_selected_products: function() {
            return this.get('order_products').filter(function(model) {
                return model.get('selected') == true;
            });
        },
        /**
         *
         */
        update_cur_qty_to_add: function() {
            var cur_qty = this.get_selected_qty(),
                max_quantity = this.get('maximum_amount');
            this.set('cur_qty_to_add', max_quantity - cur_qty);
        }
    });

   /**
    * @class
    * @classdesc Represents a collection of products included into a product set.
    * @alias App.Collections.ProductSetModels
    * @augments Backbone.Collection
    */
    App.Collections.ProductSetModels = Backbone.Collection.extend(
    /**
     * @lends App.Collections.ProductSetModels.prototype
     */
    {
        sort_comparator: function(m1, m2) {
            return m1.get('product').get('sort') > m2.get('product').get('sort');
        }
    });

    /**
     * @class
     * @classdesc Represents collection of several product sets.
     * @alias App.Collections.ProductSets
     * @augments Backbone.Collection
     */
    App.Collections.ProductSets = Backbone.Collection.extend(
    /**
     * @lends App.Collections.ProductSets.prototype
     */
    {
        model: App.Models.ProductSet,
        typeName: "ProductSets",
        /**
         * Get product sets info from server.
         * @param {number} product_id - product id
         * @param {number} combo_type - 'combo' or 'upsell'
         * @returns {Object} - deferred object that is resolved when the request is processed.
         */
        get_product_sets: function(product_id, combo_type) {
            var self = this,
                fetching = new $.Deferred(); // Pointer that all data loaded

            $.ajax({
                url: App.Data.settings.get("host") + "/weborders/" + (combo_type == 'combo' ? "product_sets/" : "product_upcharge/"),
                data: {
                    product: product_id
                },
                dataType: "json",
                successResp: function(data) {
                    var product_sets = combo_type == 'combo' ? data : data['slots'];
                    product_sets.forEach(function(pset, index) {
                        var prod_set = new App.Models.ProductSet();
                        prod_set.addAjaxJSON(pset, combo_type);
                        self.add(prod_set);
                        if (combo_type == 'upsell') {
                            self.upcharge_name = data.name;
                            self.upcharge_price = (data.upsell_combo_price && parseFloat(data.upsell_combo_price) > 0) ? data.upsell_combo_price : data.price;
                            self.upcharge_price = self.upcharge_price ? parseFloat(self.upcharge_price) : 0;
                        }
                    });
                    fetching.resolve();
                },
                error: function() {
                    App.Data.errors.alert(MSG.ERROR_PRODUCTS_LOAD, true);
                }
            });
            return fetching;
        },
        /**
         * Initialization through a json object, internal method used for order restoring from localStorage
         * @param {object} data
         */
        addJSON: function(data) {
            var self = this;
            data.forEach(function(pset, index) {
                    var prod_set = new App.Models.ProductSet();
                    prod_set.addJSON(pset);
                    self.add(prod_set);
                });
        },
        /**
         * Get all selected products.
         * It searches through all products sets and return selected items as a single collection
         * @return {object} - App.Collections.ProductSetModels collection
         */
        get_selected_products: function() {
            var array = [];
            this.each( function(model){
               array = array.concat(model.get_selected_products());
            });
            return new App.Collections.ProductSetModels(array);
        },
        /**
         * Find product in product sets by product id
         * @return {object} - App.Models.Myorder object
         */
        find_product: function(id_product) {
            var product;
            this.some( function(model) {
               return (product = model.get('order_products').findWhere({ id_product: parseInt(id_product) }));
            });
            return product;
        },
        /*
        *  Check that quantity of all product sets items equals to required values
        *  @return {boolean} - true/false
        */
        check_selected: function() {
            return !this.some(function(model) {
                return model.get_selected_qty() > model.get("minimum_amount") || model.get_selected_qty() < model.get("maximum_amount");
            });
        },
        /**
         * Check if product sets contain at least one selected weight product.
         * @return {boolean} - true/false
         */
        haveWeightProduct: function() {
            var selected_products = this.get_selected_products();
            if (selected_products.length > 0) {
                return !!selected_products.find(function(item) {
                    return item.get('product').get('sold_by_weight'); // Find first weight product from All product sets.
                });
            }
            return false;
        }
    });

    /**
     * Loads product sets for a combo/upsell product.
     * @static
     * @alias App.Collections.ProductSets.init
     * @param {number} product_id - product id.
     * @param {string} combo_type - 'combo' or 'upsell'.
     * @returns {Object} Deferred object.
     */
    App.Collections.ProductSets.init = function(product_id, combo_type) {
        var load = $.Deferred();

        if (App.Data.productSets[product_id] === undefined ) {
            App.Data.productSets[product_id] = new App.Collections.ProductSets;
            load = App.Data.productSets[product_id].get_product_sets(product_id, combo_type);
        } else {
            load.resolve();
        }

        return load;
    };
});
