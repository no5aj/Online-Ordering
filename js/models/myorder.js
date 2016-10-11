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
 * Contains {@link App.Models.Myorder}, {@link App.Models.DiscountItem},
 * {@link App.Models.ServiceFeeItem}, {@link App.Collections.Myorders} constructors.
 * @module myorder
 * @requires module:backbone
 * @requires module:total
 * @requires module:checkout
 * @requires module:products
 * @requires module:rewards
 * @see {@link module:config.paths actual path}
 */
define(["backbone", 'total', 'checkout', 'products', 'rewards', 'stanfordcard'], function(Backbone) {
    'use strict';

    /**
     * @class
     * @classdesc Represents an order item.
     * @alias App.Models.Myorder
     * @augments Backbone.Model
     * @example
     * // create an order item
     * require(['myorder'], function() {
     *     var order = new App.Models.Myorder();
     * });
     */
    App.Models.Myorder = Backbone.Model.extend(
    /**
     * @lends App.Models.Myorder.prototype
     */
    {
        /**
         * Contains attributes with default values.
         * @type {object}
         * @enum
         */
        defaults: {
            /**
             * A product model of the order item.
             * @type {?App.Models.Product}
             * @default null
             */
            product: null,
            /**
             * A product modifiers collection of the order item.
             * @type {?App.Collections.ModifierBlocks}
             * @default null
             */
            modifiers: null,
            /**
             * Product ID.
             * @type {?number}
             * @default null
             */
            id_product: null,
            /**
             * Total item sum. It's calculated as `initial_price` + 'modifiers sum'.
             * @type {number}
             * @default 0
             */
            sum : 0,
            /**
             * Quantity of products.
             * @type {number}
             * @default 1
             */
            quantity : 1,
            /**
             * Weight of product.
             * @type {number}
             * @default 0
             */
            weight : 0,
            /**
             * Previous value of quantity.
             * @type {number}
             * @default 1
             */
            quantity_prev : 1,
            /**
             * Special request for the order item. Max length of value is 256 symbols.
             * @type {string}
             * @default ''
             */
            special : '',
            /**
             * Initial price pf the order item. This is originally a price of product.
             * But, if 'SIZE' modifier is selected then this is its price.
             * @type {?number}
             * @default null
             */
            initial_price: null,
            /**
             * Discount model assigned to the order item.
             * @type {?App.Models.DiscountItem}
             * @default null
             */
            discount: null,
            /**
             * StanfordCard model. If the order item's product isn't a 'gift' this is `null`.
             * @ignore
             * @type {?App.Models.StanfordCard}
             * @default null
             */
            stanfordCard: null,
            /**
             * Stanford Card number associated with the order item.
             * @ignore
             * @type {string}
             * @default ''
             */
            stanford_card_number: '',
            /**
             * Plan Id of Stanford Card used to add some amount to.
             * @ignore
             * @type {?number}
             * @default null
             */
            planId: null,
            /**
             * Indicates that the order item is service fee.
             * @type {boolean}
             * @default false
             */
            isServiceFee: false,
            /**
             * Indicates that the item is child item of a combo product
             * @type {boolean}
             * @default false
             */
            is_child_product: false,
            /**
             * Indicates if this child product is selected or not
             * @type {boolean}
             * @default false
             */
            selected: false
        },
        /**
         * Indicates that listeners are already assigned to `product` events. It gets rid of re-assigning.
         * @type {boolean}
         * @default false
         */
        product_listener: false,
        /**
         * Indicates that listeners are already assigned to events of item's modifiers. It gets rid of re-assigning.
         * @type {boolean}
         * @default false
         */
        modifier_listener: false,
        /**
         * Current modifiers of the order item. This can be value of `modifiers` attribute or modifiers of any child product.
         * If modifiers aren't specifed yet then this has `false` value.
         * @type {(boolean|App.Collections.ModifierBlocks)}
         * @default false
         */
        current_modifiers_model: false,
        /**
         * Initializes the model.
         */
        initialize: function() {
            this.set("discount", new App.Models.DiscountItem());
            this.listenTo(this, 'change', this.change);
            this.listenTo(this, 'change:quantity', this.update_mdf_sum);
        },
        /**
         * A product specified for the order item may be `product` attribute value or any child product.
         * If you need to get a product specified for the model then you should use this method.
         * @returns {App.Models.Product} A product specified for the order item.
         */
        get_product: function() {
            return this.get('product').get_product();
        },
        /**
         * A modifiers specified for the order item may be `modifiers` attribute value or any child product's modifiers.
         * If you need to get modifiers specified for the model then you should use this method.
         * @returns {App.Collections.ModifierBlocks} Modifiers specified for the order item.
         */
        get_modifiers: function() {
            return this.get('product').get_modifiers() || this.get('modifiers');
        },
        /**
         * Specifies `initial_price` attribute value.
         * @returns {number} Initial price of the order item.
         */
        get_initial_price: function() {
            var modifiers = this.get_modifiers(),
               size = modifiers && modifiers.getSizeModel();

            if(size) {
               return size.get('price');
            } else {
               return this.get_product().get('price');
            }
        },
        /**
         * Specifies `special` attribute value.
         * @returns {string} Special request of the order item.
         */
        change_special: function(opts) { // logic when modifier special changed
            var settings = App.Data.settings.get('settings_system');
            if(settings && !settings.special_requests_online)
                return;

            var modifiers = this.get_modifiers(),
                spec = this.get('special'),
                specText = $.trim(spec + (modifiers ? '\n' + modifiers.get_special_text() : "")).slice(0, 255);

            if (specText !== "") {
                this.set({special: specText});
                if (opts && opts.ignore_uncheck) {
                    return;
                }
                modifiers.uncheck_special();
            }
        },
        /**
         * Listens to changes in product and modifiers to update attributes(`id_product`, `sum`, `initital_price`, `special`),
         * properties(`modifier_listener`, `product_listener`, `current_modifiers_model`) and propagate the events on itselt.
         */
        change: function() {
            if (this.get('product') && !this.product_listener) {
                this.product_listener = true;
                this.listenTo(this.get('product'), 'change', function() { // bubble change event
                    this.trigger('change',this);
                });
                this.listenTo(this.get('product'), 'change:attribute_1_selected change:attribute_2_selected', function() { // listen to change product attributes
                    this.modifier_listener = false;
                    this.set({
                        id_product: this.get_product().get('id'),
                        sum: this.get_modelsum(), // depend on quantity
                        initial_price: this.get_initial_price()
                    });
                    this.trigger('change',this);
                });
                this.listenTo(this.get('product'), 'change:price', function() {
                    this.set('initial_price', this.get_initial_price());
                });
            }

            var modifiers = this.get_modifiers();
            if (modifiers && !this.modifier_listener) {
                this.modifier_listener = true;
                this.current_modifiers_model && this.stopListening(this.current_modifiers_model); // save current modifiers model, after change product attributes, modifiers models and listeners changed
                this.current_modifiers_model = modifiers;
                !this.get('special') && this.change_special({ignore_uncheck: true});
                this.listenTo(modifiers, 'modifiers_special', this.change_special);
                this.listenTo(modifiers, 'modifiers_size', function(price) {
                    this.set('initial_price', price);
                });
                this.listenTo(modifiers, 'modifiers_changed', function() {
                    this.update_prices();
                    this.update_mdf_sum();
                    this.trigger('change', this); // need to notify a collection about modifier change to ensure cart totals update
                });
            }
        },
        /**
         * Updates `sum` attribute of modifiers.
         * @param {number} multiplier - a quantity koefficient which is used to get right modifiers quantity taking into account the quantity of the parent (Combo) product itself
         */
        update_mdf_sum: function(multiplier) {
            var mdfGroups = this.get_modifiers(),
                multiplier = typeof multiplier == 'number' ? multiplier : 1,
                quantity = this.get('quantity') * multiplier;

            mdfGroups && mdfGroups.each(function(mdfGroup) {
                var mdfs = mdfGroup.get('modifiers');
                mdfs && mdfs.each(function(mdf) {
                    mdf.updateSum(quantity);
                });
            });
        },
        /**
         * Updates modifiers price due to "Max Price" feature.
         */
        update_prices: function() {
            var max_price = this.get_product().get('max_price'),
                initial_price = this.get_initial_price();
            if (max_price) {
                this.get_modifiers().update_prices(max_price > initial_price ? max_price - initial_price : 0);
            }
        },
        /**
         * Initializes the order item and loads product and modifiers .
         * @param {number} id_product - product id
         * @param {number} id_category - category id
         * @returns {Object} Deferred object that is resolved when product and modifiers are loaded.
         */
        add_empty: function (id_product, id_category) {
            var self = this,
                product_load = App.Collections.Products.init(id_category), // load product
                quick_modifier_load = App.Collections.ModifierBlocks.init_quick_modifiers(),
                modifier_load = $.Deferred(),
                product_child_load = $.Deferred(), // load child products
                loadOrder = $.Deferred(),
                product;

            product_load.then(function() {
                product = App.Data.products[id_category].get_product(id_product);
                if (!product) {
                    console.error("Myorder: add_empty, product is not found!", id_category, id_product);
                }
                product.get_child_products().then(product_child_load.resolve);
            });

            quick_modifier_load.then(function() {
                App.Collections.ModifierBlocks.init(id_product).then(modifier_load.resolve); // load product modifiers
            });

            $.when(product_child_load, modifier_load).then(function() {
                self.set({
                    product: product,
                    id_product: id_product,
                    modifiers: App.Data.modifiers[id_product]
                });
                self.set({
                    sum: self.get_modelsum(), // sum with modifiers
                    initial_price: self.get_initial_price()
                });
                self.update_prices();
                self.initStanfordReloadItem();
                loadOrder.resolve();
            });

            return loadOrder;
        },
        /**
         * Updates the order item from JSON.
         * @param {Object} data - JSON representation of {@link App.Models.Myorder} attributes
         * @returns {App.Models.Myorder} The order item.
         */
        addJSON: function(data) {
            this.set({
                discount: new App.Models.DiscountItem(data.discount),
                product: new App.Models.Product().addJSON(data.product),
                modifiers: new App.Collections.ModifierBlocks().addJSON(data.modifiers),
                id_product: data.id_product ? data.id_product : data.product.id,
                quantity: data.product.sold_by_weight ? 1 : (data.quantity ? data.quantity : 1),
                weight: data.weight ? data.weight : 0,
                selected: data.selected,
                is_child_product: data.is_child_product,
                upcharge_name: data.upcharge_name,
                combo_name: data.combo_name,
                upcharge_price: data.upcharge_price
            });
            data.special && this.set('special', data.special, {silent: true});
            if (!this.get('product').get('gift_card_number') && data.gift_card_number) {
                this.get('product').set('gift_card_number', data.gift_card_number);
            }

            data.stanfordCard && this.initStanfordReloadItem(data.stanfordCard);

            return this;
        },
        /**
         * @returns {number} Total sum of the order item.
         */
        get_modelsum: function() {
            var sold_by_weight = this.get("product") ?  this.get("product").get('sold_by_weight') : false,
                weight = this.get('weight'),
                productSum = this.get_initial_price(),
                product = this.get_product(),
                max_price = product && product.get('max_price'),
                totalItem;

            if (sold_by_weight && weight) {
                productSum *= weight;
            }

            var modifiers = this.get_modifiers(),
                modifiersSum = modifiers ? modifiers.get_sum() : 0,
                hasModifiers = !!modifiers && modifiers.get_modifierList().some(function(modifier) {
                    return modifier.get('selected');
                });

            totalItem = productSum + modifiersSum;

            // subtotal should be less or equal max_price if any no admin modifier is attached to product
            // Test Case 7047
            return (hasModifiers && typeof max_price == 'number' && max_price > 0 && max_price < totalItem ? max_price : totalItem) * this.get('quantity');
        },
        /**
         * @returns sum of modifiers of the order item.
         */
        get_sum_of_modifiers: function() {
            var modifiers = this.get_modifiers();

            return modifiers ? modifiers.get_sum() : 0;
        },
        /**
         * @returns {string} Special request of the order item.
         */
        get_special: function() {
            var settings = App.Data.settings.get('settings_system');
            if(settings && !settings.special_requests_online) {
                return '';
            } else if (this.get('special')) {
                return this.get('special');
            } else if (this.get_modifiers())
                return this.get_modifiers().get_special_text();
            else return "";
        },
        /**
         * Deeply clones the order item.
         * @returns {App.Models.Myorder} Cloned order item.
         */
        clone: function() {
            var order = new this.constructor(),
                stanfordCard = this.get('stanfordCard');
            for (var key in this.attributes) {
                var value = this.get(key);
                if (value && value.clone) { value = value.clone(); }
                order.set(key, value, {silent: true });
            }
            stanfordCard && order.initStanfordReloadItem(stanfordCard.getJSON());
            order.trigger('change', order, {clone: true});
            return order;
        },
        /**
         * Updates the order item using instance of {@link App.Models.Myorder} as new data source.
         * @param {App.Models.Myorder} newModel - instance of {@link App.Models.Myorder}
         * @returns {App.Models.Myorder} The order item.
         */
        update: function(newModel) {
            var stanfordCard = newModel.get('stanfordCard');
            for (var key in newModel.attributes) {
                var value = newModel.get(key);
                if (value && value.update) { this.get(key).update(value); }
                else { this.set(key, value, {silent: true}); }
            }
            stanfordCard && this.initStanfordReloadItem(stanfordCard.getJSON());
            this.trigger('change',this);
            return this;
        },
        /**
         * Checks all necessary attributes to place an order.
         * @returns {Object} One of the following objects:
         * ```
         * // All attributes are valid:
         * {
         *     status: 'OK'
         * }
         * // Validation failed:
         * {
         *     status: 'ERROR',
         *     errorMsg: <error message>
         * }
         * ```
         */
        check_order: function(opt) {
            var product = this.get_product(),
                modifiers = this.get_modifiers(),
                size = modifiers.getSizeModel(),
                dining_option = App.Data.myorder.checkout.get('dining_option'),
                isDelivery = dining_option == 'DINING_OPTION_DELIVERY',

                forced = modifiers.checkForced(),
                exceeded = modifiers.checkAmount(),
                is_modifiers_only = _.isObject(opt) ? opt.modifiers_only : false;

            if (!is_modifiers_only && product.get("sold_by_weight") && !this.get("weight")) {
                return {
                    status: 'ERROR',
                    errorMsg: ERROR.BLOCK_WEIGHT_IS_NOT_VALID
                };
            }

            if (!is_modifiers_only && !App.Data.timetables.check_order_enable(isDelivery)) {
                return {
                    status: 'ERROR',
                    errorMsg: ERROR.BLOCK_STORE_IS_CLOSED
                };
           }

            if (!product.check_selected()) {
                return {
                    status: 'ERROR',
                    errorMsg: ERROR.SELECT_PRODUCT_ATTRIBUTES
                };
            }

            if (size || size === undefined) {
                if(Array.isArray(forced)) {
                    return format_error(forced, 'min');
                }
                if(Array.isArray(exceeded)) {
                    return format_error(exceeded, 'max');
                }
            } else if (size === null) {
                    return {
                        status: 'ERROR',
                        errorMsg: ERROR.SELECT_SIZE_MODIFIER
                    };
            }

            function format_error (error_mdfs, min_max) {
                return {
                    status: 'ERROR',
                    errorMsg: function() {
                        var tmpl = min_max == 'min' ? ERROR.FORCED_MODIFIER : ERROR.FORCED_MODIFIER_MAX;
                            tmpl = tmpl.split('|');
                        return tmpl[0].trim() + ' ' + error_mdfs.map(function(modifier) {
                            var Amount = modifier.get(min_max == 'min' ?  'minimum_amount' : 'maximum_amount'),
                                modifierClass = modifier.get('name'),
                                msg = tmpl[1].replace('%d', Amount).replace('%s', '&lsquo;' + modifierClass + '&rsquo;');
                            return msg;
                        }).join(', ')
                    }()
                };
            }

            return {
                status: 'OK'
            };
        },
        /**
         * @returns {number} Attribute type of `product` (`0` - usual product, `1` - parent product, `2` - child product).
         */
        get_attribute_type: function() {
            return this.get('product').get('attribute_type');
        },
        /**
         * @returns {Object} List of attributes if `product` is parent. Otherwise, returns empty object `{}`.
         */
        get_attributes_list: function() {
            return this.get('product').get_attributes_list();
        },
        /**
         * @returns {(Array|undefined)} Array of product attributes if they exist. Otherwise, returns `undefined`.
         */
        get_attributes: function() {
            var product = this.get('product');
            return product ? product.get_attributes() : undefined;
        },
        /**
         * @returns {boolean} `true` if specified product is gift.
         */
        is_gift: function() {
            return this.get_product().get('is_gift');
        },
        /**
         * Gets the order item info for submitting to server.
         * @param {boolean} for_discounts - if `true` need to add product sub id to response object.
         * @returns {Object}
         * ```
         * {
         *     modifieritems: <selected modifiers>,
         *     special_request: <special request>,
         *     price: <order price>,
         *     product: <product id>,
         *     product_name_override: <product name>,
         *     quantity: <quantity>,
         *     product_sub_id: <product sub id>,     // present for discount
         *     weight: <product weight>,             // present if product is sold by weight
         *     gift_card_number: <gift card number>  // present if product is gift
         *     stanford_card_number: <stanford card> // present if product is gift and stanford card support is turned on
         *     planId: <stanford plan id>            // present if product is gift and stanford card support is turned on
         * }
         * ```
         */
        item_submit: function(for_discounts) {
            var modifiers = [],
                special = this.get_special(),
                modifiersModel = this.get_modifiers();

            if (modifiersModel) {
                modifiers = modifiersModel.modifiers_submit();
            }

            var currency_symbol = App.Data.settings.get('settings_system').currency_symbol,
                uom = App.Data.settings.get("settings_system").scales.default_weighing_unit,
                product = this.get_product().toJSON(),
                price = Number(this.get('initial_price')) >= 0 ? this.get('initial_price') : product.price,
                item_obj = {
                    modifieritems: modifiers,
                    special_request: special,
                    price: price,
                    product: product.id,
                    product_name_override: this.overrideProductName(product),
                    quantity: this.get('quantity'),
                    product_sub_id: this.get('product_sub_id'), //for_discounts ? this.get('product_sub_id') : undefined,
                    is_combo: product.is_combo ? product.is_combo : undefined,
                    has_upsell: product.has_upsell ? product.has_upsell : undefined
                };

            if (product.sold_by_weight) {
                var num_digits = App.Data.settings.get("settings_system").scales.number_of_digits_to_right_of_decimal,
                    label_for_manual_weights = App.Data.settings.get("settings_system").scales.label_for_manual_weights;

                item_obj.weight = this.get('weight');

                var str_label_for_manual_weights = label_for_manual_weights ? " " + label_for_manual_weights : "",
                    str_uom = uom ? "/" + uom : "";

                //construct product_name_override as it's done by POS:
                item_obj.product_name_override = product.name + "\n " + item_obj.weight.toFixed(num_digits) + str_label_for_manual_weights + " @ "
                    + currency_symbol + round_monetary_currency(item_obj.price) + str_uom;
            }


            if (product.gift_card_number) {
                item_obj.gift_card_number = product.gift_card_number;
            }

            // add stanford info if this is stanford reload item
            var planId = this.get('planId'),
                stanford_card_number = this.get('stanford_card_number');

            if (planId && stanford_card_number) {
                item_obj.planId = planId;
                item_obj.stanford_card_number = stanford_card_number;
            }

            if (product.is_combo || product.has_upsell) {
                var product_sets = [];
                    product.product_sets.each(function(product_set){
                    var pset = product_set.item_submit(for_discounts);
                    product_sets.push(pset);
                });
                item_obj['products_sets'] = product_sets;
            }

            return item_obj;
        },
        /**
         * @returns {string} Overridden product name.
         */
        overrideProductName: function(product) {
            if (product.id == null) {
                switch (product.name) {
                    case MSG.AUTOAPPLY_FEE_ITEM:
                        return 'AutoApply Fee';
                    default: {
                        //trace("Product name '" + product.name + "' is not overridden");
                    }
                }
            }
            return product.name;
        },
        /**
         * Removes free modifiers.
         */
        removeFreeModifiers: function() {
            var modifiers = this.get_modifiers();
            modifiers && modifiers.removeFreeModifiers();
        },
        /**
         * @returns {boolean} `true` if the order item is service fee.
         */
        isServiceFee: function() {
            return this.get("isServiceFee") === true;
        },
        /**
         * @returns {boolean} `true` if the order item is real product (should have a valid product id).
         */
        isRealProduct: function() {
            return this.get("id_product") !== null;
        },
         /**
         * @returns {boolean} `true` if the order item is Combo product.
         */
        isComboProduct: function() {
            return this.get("product").get("is_combo") === true;
        },
         /**
         * @returns {boolean} `true` if the order item is Upsell product.
         */
        isUpsellProduct: function() {
            return this.get("product").get("has_upsell") === true;
        },
        /**
         * @returns {boolean} `true` if the order item is Upsell product.
         */
        isComboBased: function() {
            return this.get("product").isComboBased();
        },
        /**
         * @returns {boolean} `true` if the order item is child product (Combo child product).
         */
        isChildProduct: function() {
            return this.get('is_child_product');
        },
        /**
         * @returns {boolean} `true` if product's `point_value` attribute is number. Otherwise, returns `false`.
         */
        hasPointValue: function() {
            var point_value = this.isRealProduct() && this.get_product().get('point_value');
            return typeof point_value == 'number' && !isNaN(point_value);
        },
        /**
         * Inits stanford reload item. If product is gift and App.Data.is_stanford_mode is true then item is stanford reload.
         * @ignore
         * @param {Object} data - JSON representation of App.Models.StanfordCard attributes
         */
        initStanfordReloadItem: function(data) {
            var product = this.get_product();

            if(!App.Data.is_stanford_mode || !product.get('is_gift')) {
                return;
            }

            // need to convert initial product price to integer according Bug 30983
            product.set('price', parseInt(product.get('price')) || 0);

            var stanfordCard = new App.Models.StanfordCard(_.isObject(data) ? data : {
                number: this.get('stanford_card_number'),
                planId: this.get('planId'),
            }), self = this;

            this.set({
                stanfordCard: stanfordCard,
                stanford_card_number: stanfordCard.get('number'),
                planId: stanfordCard.get('planId')
            });

            this.listenTo(stanfordCard, 'onStanfordCardError', function(msg) {
                msg && App.Data.errors.alert(msg);
            }, this);

            this.listenTo(stanfordCard, 'change:number', function(model, value) {
                self.set('stanford_card_number', value);
            }, this);

            stanfordCard.listenTo(this, 'change:stanford_card_number', function(model, value) {
                stanfordCard.set('number', self.get('stanford_card_number'));
            });

            this.listenTo(stanfordCard, 'change:planId', function(model, value) {
                self.set('planId', value);
            }, this);

            stanfordCard.listenTo(this, 'change:planId', function(model, value) {
                stanfordCard.set('planId', self.get('planId'));
            }, this);
        },
        /**
         * Get product price
         * @return {number} - initial product price or inventory child product price
         */
        get_product_price: function() {
            return this.get('initial_price');
        }
    });

    if (App.Data.devMode) {
        /*
        *  get modifier params by indexes for debug
        */
        App.Models.Myorder.prototype.mdf = function(mdf_class_index, mdf_index) {
            return this.get('modifiers').models[mdf_class_index].get('modifiers').models[mdf_index].toJSON();
        }
    }

    /**
     * @class
     * @classdesc Represents an combo order item (used for combo products feature).
     * @alias App.Models.MyorderCombo
     * @extends App.Models.Myorder
     * @example
     * // create an order item
     * require(['myorder'], function() {
     *     var order = new App.Models.MyorderCombo();
     *     //or through the class factory function:
     *     var order2 = App.Models.create('MyorderCombo')
     * });
     */
    App.Models.MyorderCombo = App.Models.Myorder.extend(
    /**
     * @lends App.Models.MyorderCombo.prototype
     */
    {
        defaults: _.extend({}, App.Models.Myorder.prototype.defaults, {
            upcharge_price: 0,
            upcharge_name: ''
            // any items added here should be explisitly restored in Myorder.addJSON() function
        }),
        /**
         * Initializes the model.
         * @override
         */
        initialize: function() {
            App.Models.Myorder.prototype.initialize.apply(this, arguments);
            this.listenTo(this, 'change:initial_price', this.update_product_price, this);
            this.listenTo(this, 'combo_product_change', this.update_mdf_sum, this);
        },
        /**
         * Initializes the order item and loads product, modifiers and product sets.
         * @param {number} id_product - product id
         * @param {number} id_category - category id
         * @returns {Object} Deferred object that is resolved when product, modifiers and product sets are loaded.
         */
        add_empty: function (id_product, id_category) {
            var self = this, product, combo_type,
                product_load = App.Collections.Products.init(id_category),
                modifier_load = $.Deferred(),
                quick_modifier_load = App.Collections.ModifierBlocks.init_quick_modifiers();

            quick_modifier_load.then(function() {
                App.Collections.ModifierBlocks.init(id_product).then(modifier_load.resolve); // load product modifiers
            });
            return $.when(product_load, modifier_load).then(function() {
                product = App.Data.products[id_category].get_product(id_product);
                if (!product) {
                    console.error("MyorderCombo: add_empty, product is not found!", id_category, id_product);
                }
                product.set({is_gift: false, // no gifts for combos
                             max_price: 0}, // turn off max price feature for combo
                             {silent: true});
                combo_type = product.get('is_combo') ? 'combo' : 'upsell';
                return App.Collections.ProductSets.init(id_product, combo_type);
            }).then(function() {
                var slots = App.Data.productSets[id_product];
                product.set("product_sets", slots);
                self.set({
                    product: product,
                    id_product: id_product,
                    modifiers: App.Data.modifiers[id_product]
                });
                self.set({
                    sum: self.get_modelsum(), // sum with modifiers
                    initial_price: self.get_initial_price(),
                    upcharge_price: combo_type == 'upsell' ? slots.upcharge_price : 0,
                    upcharge_name: combo_type == 'upsell' ? slots.upcharge_name : ''
                });
                self.update_prices();
            });
        },
        /**
         * Find child order product by product id.
         * @param {number} id_product - product id
         * @returns {Object} - order item (instance of App.Models.Myorder) if the child product found, otherwise it returns {undefined}.
         */
        find_child_product: function(product_id) {
            return this.get('product').get('product_sets').find_product(product_id);
        },
        /**
         * Get price for combo product.
         * @return {number} - combo product price
         */
        get_product_price: function() {
            return this.get('product').get('combo_price');
        },
        /**
         * Update price for combo product.
         * @returns {number} - the calculated price of combo product.
         */
        update_product_price: function() {
            var root_price = this.get_initial_price(),
                sum = 0, combo_saving_products = [];

            var prices = [this.get_initial_price()];

            this.get('product').get('product_sets').each( function(product_set) {
                if ( product_set.get('is_combo_saving') ) {
                    combo_saving_products.push( product_set );
                    return;
                }
                product_set.get_selected_products().forEach(function(model) {
                    //trace("add product_price : ",  model.get('product').get('name'), model.get_initial_price());
                    var product = model.get("product"),
                        sold_by_weight = product ?  product.get('sold_by_weight') : false,
                        weight = model.get('weight'),
                        initial_price = model.get_initial_price();

                    if (sold_by_weight && weight) {
                        sum += initial_price * weight;
                        prices.push(initial_price * weight);
                    }
                    else {
                        sum += initial_price * model.get('quantity');
                        prices.push(initial_price * model.get('quantity'));
                    }
                });
            });

            if (combo_saving_products.length && sum < root_price) {
                sum = root_price;
                prices.push("< root_price");
            }

            if (App.Data.devMode) {
                trace("Combo price = ", prices.join(" + "), "=", sum);
            }

            this.get('product').set("combo_price", sum);
            return sum;
        },
        /**
         * Calculates sums of all product modifiers in respect to quantity of root combo product and quantity of child products.
         */
        update_mdf_sum: function() {
            var has_upsell = this.isUpsellProduct(),
                order_products = this.get('product').get('product_sets').get_selected_products(),
                root_quantity = this.get('quantity');

            has_upsell && App.Models.Myorder.prototype.update_mdf_sum.apply(this, arguments);

            order_products && order_products.each( function(order_product) {
                order_product.update_prices();
                order_product.update_mdf_sum(root_quantity);
            });
            this.update_product_price();
        },
        /*
         * Checks all necessary attributes to place an order.
         * @override
         */
        check_order: function(opt) {
            var result = App.Models.Myorder.prototype.check_order.apply(this, arguments),
                is_modifiers_only = _.isObject(opt) ? opt.modifiers_only : false;
            if (result.status != 'OK' || is_modifiers_only) {
                return result;
            }

            var psets = [],
                product_name = this.get('product').get('name'),
                product_sets = this.get('product').get('product_sets');
            if (!product_sets.length) {
                return { status: 'ERROR',
                         errorMsg: ERROR.COMBO_HAS_NO_CHILD_PRODUCTS.replace('%s', product_name) }
            }
            product_sets.each( function(product_set) {
                var exactAmount = product_set.get("minimum_amount");
                var quantity = product_set.get_selected_qty();
                if (quantity < exactAmount || quantity > exactAmount) {
                    psets.push(product_set);
                }
            });

            if (psets.length > 0) {
                return format_error(psets);
            }

            function format_error (error_psets)  {
                return {
                    status: 'ERROR',
                    errorMsg: function() {
                        var tmpl = ERROR.PRODUCT_SET_QUANTITY_IS_NOT_VALID;
                            tmpl = tmpl.split('|');
                        return tmpl[0].trim() + ' ' + error_psets.map(function(model) {
                            var exactAmount = model.get('minimum_amount'),
                                psetName = model.get('name'),
                                msg = tmpl[1].trim().replace('%d', exactAmount).replace('%s', '&lsquo;' + psetName + '&rsquo;');
                            return msg;
                        }).join(', ')
                    }()
                };
            }

            return {
                status: 'OK'
            };
        },
        /**
         * Checks whether combo has child products inside. It can be used to check combo product settings on backend side.
         * @returns {boolean} - true (combo has child products inside) or false (No, it hasn't)
         */
        has_child_products: function() {
            var product_sets = this.get_product().get("product_sets");
            if (product_sets.length > 0)
                return true;
            else
                return false;
        }
    });

    /**
     * @class
     * @classdesc Represents an combo order item (used for combo products feature).
     * @alias App.Models.MyorderUpsell
     * @extends App.Models.Myorder
     * @example
     * // create an order item
     * require(['myorder'], function() {
     *     var order = new App.Models.MyorderUpsell();
     *     //or through the class factory function:
     *     var order2 = App.Models.create('MyorderUpsell')
     * });
     */
    App.Models.MyorderUpsell = App.Models.MyorderCombo.extend(
    /**
     * @lends App.Models.MyorderUpsell.prototype
     */
    {
        /**
         * Update price for combo product.
         * @returns {number} - the calculated price of combo product.
         */
        update_product_price: function() {
            App.Data.devMode && trace("culculate upcharge ==>");
            var compound_price = this.get_compound_price(),
                total_upcharge_price = this.get_total_upcharge_price();

            var saving_amount = Math.min(compound_price - total_upcharge_price, this.get_initial_price());
            saving_amount = parseFloat(saving_amount.toFixed(2));

            var final_upsell_price = compound_price - saving_amount;
            final_upsell_price = parseFloat(final_upsell_price.toFixed(2));

            if (App.Data.devMode) {
                trace("saving_amount = MIN(compound_price - total_upcharge_price, initial_product_price) =", saving_amount);
                trace("final_upsell_price = compound_price - saving_amount =", final_upsell_price);
            }

            this.get('product').set("combo_price", final_upsell_price);
            return final_upsell_price;
        },
        /**
         * get sum of the base product price and item prices (backend product field 'Price' is used only).
         * @returns {number} - the calculated compound price of combo product.
         */
        get_compound_price: function() {
            var product_price = this.get_initial_price(),
                sum = 0, prices = [product_price];

            this.get('product').get('product_sets').each( function(product_set) {
                product_set.get_selected_products().forEach(function(model) {
                    var product = model.get("product"),
                        sold_by_weight = product ?  product.get('sold_by_weight') : false,
                        weight = model.get('weight'),
                        initial_price = model.get_initial_price();

                    if (sold_by_weight && weight) {
                        sum += initial_price * weight;
                        prices.push(initial_price * weight);
                    }
                    else {
                        sum += initial_price * model.get('quantity');
                        prices.push(initial_price * model.get('quantity'));
                    }
                });
            });

            sum += product_price;

            if (App.Data.devMode) {
                trace("compound_price = ", prices.join(" + "), "=", sum);
            }

            //this.get('product').set("combo_price", sum);
            return sum;
        },
         /**
         * get total upcharge combo price
         * The total upcharge combo price is calculated as a sum of prices of three components:
         *   1.  The base product price.
         *   2.  One of the next two values:
         *       o)   Base product upcharge price The POS uses the value unless it is set to 0.
         *       o)   Upcharge combo price. The POS uses upcharge combo price only if the upcharge combo price of the base product is set to 0.
         *   3.  The sum of item upcharge prices of items selected from the upcharge combo.
         * @returns {number} - the calculated total upcharge combo price.
         */
        get_total_upcharge_price: function() {
            var root_price = this.get_initial_price() + this.get('upcharge_price'),
                sum = 0;

            var prices = [this.get_initial_price(), this.get('upcharge_price')];

            this.get('product').get('product_sets').each( function(product_set) {
                product_set.get_selected_products().forEach(function(model) {
                    //trace("add product_price : ",  model.get('product').get('name'), model.get_initial_price());
                    var product = model.get("product"),
                        sold_by_weight = product ?  product.get('sold_by_weight') : false,
                        weight = model.get('weight'),
                        initial_price = product.get("upcharge_price");

                    if (sold_by_weight && weight) {
                        sum += initial_price * weight;
                        prices.push(initial_price * weight);
                    }
                    else {
                        sum += initial_price * model.get('quantity');
                        prices.push(initial_price * model.get('quantity'));
                    }
                });
            });

            sum += root_price;

            if (App.Data.devMode) {
                trace("total_upcharge_price = ", prices.join(" + "), "=", sum);
            }

            return sum;
        }

    });

    if (App.Data.devMode) {
        /*
        *   get combo child product (for debug)
        */
        App.Models.MyorderCombo.prototype.combo_child = function(product_set_index, product_index) {
            return this.get('product').get('product_sets').models[product_set_index].get('order_products').models[product_index];
        }
    }

    /**
     * @class
     * @classdesc Represents a discount.
     * @alias App.Models.DiscountItem
     * @augments Backbone.Model
     * @example
     * // create a discount
     * require(['myorder'], function() {
     *     var discount = new App.Models.DiscountItem();
     * });
     */
    App.Models.DiscountItem = Backbone.Model.extend(
    /**
     * @lends App.Models.DiscountItem.prototype
     */
    {
        /**
         * Contains attributes with default values.
         * @type {object}
         * @enum
         */
        defaults: {
            /**
             * Discount id.
             * @type {?number}
             * @default null
             */
            id: null,
            /**
             * Discount name.
             * @type {string}
             * @default 'default'
             */
            name: 'default',
            /**
             * Discount sum.
             * @type {number}
             * @default 0
             */
            sum: 0,
            /**
             * Discount is taxable or not.
             * @type {boolean}
             * @default false
             */
            taxed: false,
            /**
             * Discount type.
             * @type {?number}
             * @default null
             */
            type: null
        },
        /**
         * @returns {string} Formatted string contaning discount sum (for ex., $1.45).
         */
        toString: function() {
            return round_monetary_currency(this.get('sum'));
        },
        /**
         * Saves discount in a storage. 'orderLevelDiscount' key is used.
         */
        saveDiscount: function(key) {
            var data = this.toJSON();
            if (!key)
                key = 'orderLevelDiscount';
            setData(key, data);
        },
        /**
         * Loads discount from a storage. 'orderLevelDiscount' key is used.
         */
        loadDiscount: function(key) {
            if (!key)
                key = 'orderLevelDiscount';
            var data = getData(key);
            this.set(data);
        },
        /**
         * Changes attributes on the following values:
         * ```
         * {
         *     name: "No discount",
         *     sum: 0,
         *     taxed: false,
         *     id: null,
         *     type: 1
         * }
         * ```
         */
        zero_discount: function() {
            this.set({  name: "No discount",
                        sum: 0,
                        taxed: false,
                        id: null,
                        type: 1
                    });
        }
    });

    /**
     * @class
     * @classdesc Represents a service fee model.
     * @alias App.Models.ServiceFeeItem
     * @augments App.Models.Myorder
     * @example
     * // create a service fee
     * require(['myorder'], function() {
     *     var serviceFee = new App.Models.ServiceFeeItem();
     * });
     */
    App.Models.ServiceFeeItem = App.Models.Myorder.extend(
    /**
     * @lends App.Models.ServiceFeeItem.prototype
     */
    {
        /**
         * Extends {@link App.Models.Myorder#initialize} method. Sets product name and `isServiceFee` attribute.
         */
        initialize: function() {
            App.Models.Myorder.prototype.initialize.apply(this, arguments);
            this.set({
                product: new App.Models.Product({
                    name: "default fee"
                }),
                isServiceFee: true
            });
        }
    });

    /**
     * @class
     * @classdesc Represents a collection of order items (order).
     * @alias App.Collections.Myorders
     * @augments Backbone.Collection
     * @example
     * // create a cart
     * require(['myorder'], function() {
     *     var cart = new App.Collections.Myorders();
     * });
     */
    App.Collections.Myorders = Backbone.Collection.extend(
    /**
     * @lends App.Collections.Myorders.prototype
     */
    {
        /**
         * Item constructor.
         * @type {Function}
         * @default App.Models.Myorder
         */
        model: App.Models.Myorder,
        /**
         * Quantity of items (item quantity value is included).
         * @type {number}
         * @default 0
         */
        quantity: 0,
        /**
         * Total model.
         * @type {?App.Models.Total}
         * @default null
         */
        total: null,
        /**
         * Discount model.
         * @type {?App.Models.DiscountItem}
         * @default null
         */
        discount: null,
        /**
         * Contains payments response.
         * @type {?Object}
         * @default null
         */
        paymentResponse: null,
        /**
         * Initializes the collection.
         */
        initialize: function( ) {
            /**
             * Rewards card model.
             * @member
             * @alias App.Collections.Myorders#rewardsCard
             * @type {App.Models.RewardsCard}
             * @default instance of {@link App.Models.RewardsCard}
             */
            this.rewardsCard = new App.Models.RewardsCard();
            this.discount = new App.Models.DiscountItem({"discount_rate": 0});
            this.total = new App.Models.Total();
            /**
             * Checkout model.
             * @member
             * @alias App.Collections.Myorders#checkout
             * @type {App.Models.Checkout}
             * @default instance of {@link App.Models.Checkout}
             */
            this.checkout = new App.Models.Checkout();
            this.checkout.set('dining_option', App.Settings.default_dining_option);

            this.listenTo(this.checkout, 'change:dining_option', this.change_dining_option, this);

            this.listenTo(this, 'add', this.onModelAdded);
            this.listenTo(this, 'remove', this.onModelRemoved);
            this.listenTo(this, 'change', this.onModelChange);
        },
        /**
         * Handles `dining_option` changes of {@link App.Collections.Myorders#checkout} model.
         * @param {App.Models.Checkout} model - instance of {@link App.Models.Checkout}
         * @param {string} value - dining option value
         * @param {Object} opts - event options
         */
        change_dining_option: function(model, value, opts) {
            var obj, isShipping = value === 'DINING_OPTION_SHIPPING',
                customer = App.Data.customer;

            // reset shipping
            if(!isShipping) {
                this.total.set('shipping', null);
            }

            if(!this.paymentInProgress) {
                // need pass `update_shipping_options` flag if 'Shipping' order type is choosen at first time (shipping_selected === -1).
                this.update_cart_totals(isShipping && customer && customer.isDefaultShippingSelected() ? {update_shipping_options: true} : undefined);
            }
        },
        /**
         * Checks if user gets maintenance after payment
         */
        check_maintenance: function() {
            if (getData('orders')) {
                App.Data.settings.loadSettings();
                var mess = [],
                    index = 0;
                App.Settings.email && mess.push(App.Settings.email);
                App.Settings.phone && mess.push(App.Settings.phone);
                var errors = App.Data.errors;
                if (mess.length) {
                    errors.alert(MSG.ERROR_HAS_OCCURRED_WITH_CONTACT.replace(/%([^%]*)%/g, function(match, group) {
                        var data = mess[index];
                        index ++;
                        return data ? '<br>' + group + data + ',' : '';
                    }).replace(/,$/, '')); // user notification
                } else {
                    errors.alert(MSG.ERROR_HAS_OCCURRED); // user notification
                }
            }
        },
        /**
         * @returns {?number} Remaining amount that need to reach to satisfy a minimum order amount limit for delivery.
         *                    If current dining option isn't delivery then returns `null`.
         */
        get_remaining_delivery_amount: function() {
            if (this.checkout.get('dining_option') === 'DINING_OPTION_DELIVERY') {
                return this.total.get_remaining_delivery_amount();
            }
            return null;
        },
        /**
         * @returns {?number} Delivery charge. If current dining option isn't delivery then returns `null`.
         */
        get_delivery_charge: function() {
            if (this.checkout.get('dining_option') === 'DINING_OPTION_DELIVERY') {
                return this.total.get_delivery_charge();
            }
            return null;
        },
        /**
         * @returns {number} Quantity of real products including quantity of each product.
         */
        get_only_product_quantity: function() {
            return _.reduce(this.models, function(qty, model) {
                    return model.get("id_product") != null ? qty + model.get('quantity') : qty;
                }, 0);
        },
        /**
         * @returns {number} Charge amount of service fee.
         */
        get_service_fee_charge: function() {
            return _.reduce(this.models, function(sum, model) {
                    return model.get("id_product") == null ? sum + model.get('sum') : sum;
                }, 0);
        },
        /**
         * Added new items to the collection.
         * @param {Array} data - JSON representation of the collection
         */
        addJSON: function(data) {
            var self = this, obj, type;
            Array.isArray(data) && data.forEach(function(element) {
                if (element.product.id) {
                    if (element.product.is_combo || element.product.has_upsell) {
                        if (element.product.has_upsell)
                            type = 'MyorderUpsell';
                        else
                            type = 'MyorderCombo';
                    } else {
                        type = 'Myorder';
                    }
                    var myorder = App.Models.create(type);
                    myorder.addJSON(element);
                    self.add(myorder);
                    myorder.set('initial_price', myorder.get_initial_price());
                } else if (element.isServiceFee) {
                    self.addServiceFee(element);
                }
            });
        },
        /**
         * Add new Service Fee item to the collection.
         * @param {Object} element - JSON representation of the Service Fee item
         */
        addServiceFee: function(element) {
            var fee = new App.Models.ServiceFeeItem({id: element.id});
            fee.get("product").set({name: element.product.name, price: element.sum});
            fee.set({initial_price: element.sum, sum: element.sum });
            this.add(fee);
        },
        /**
         * Deeply clones the collection
         * @returns {App.Collections.Myorders} The orders collection.
         */
        clone: function() {
            var orders = new App.Collections.Myorders();
            this.each(function(order) {
                orders.add(order.clone(), {silent: true}) ;
            });
            orders.checkout.set('dining_option', this.checkout.get('dining_option'));
            orders.discount = this.discount.clone();
            orders.total = this.total.clone();
            orders.discount = this.discount.clone();
            return orders;
        },
        /**
         * If products in cart are only gift then changes dining option to 'DINING_OPTION_ONLINE'.
         * @returns {boolean} `true` if dining option changes on 'DINING_OPTION_ONLINE'.
         */
        change_only_gift_dining_option: function() {
            var counter = 0;
            this.each(function(el) {
                el.is_gift() && counter++;
            });

            if (counter && counter === this.get_only_product_quantity()) {
                this.checkout.set('dining_option', 'DINING_OPTION_ONLINE');
                return true;
            } else if (this.checkout.get('dining_option') === 'DINING_OPTION_ONLINE') {
                this.checkout.revert_dining_option();
            }
            return false;
        },
        /**
         * @returns {number} Quantity non-gift items.
         */
        not_gift_product_quantity: function() {
            var quantity = this.get_only_product_quantity();

            this.each(function(el) {
                el.is_gift() && quantity--;
            });

            return quantity;
        },
        /**
         * Recalculates total when new model is added to the collection.
         * @param {App.Models.Myorder} model - a new order item model.
         */
        onModelAdded: function(model) {
            var sum = model.get_modelsum(),
                countProd = model.get('quantity');

            this.quantity += countProd;

            model.set({
                'sum' : sum,
                'quantity_prev' : countProd,
                'product_sub_id' : model.cid   //set additional ID used for products with the same product_id
            }, {silent: true});

            this.change_only_gift_dining_option();
            model.update_mdf_sum();

            if (model.isRealProduct()) {
                this.update_cart_totals({update_shipping_options: true});
            }
        },
        /**
         * Recalculates total when model is removed from the collection.
         * @param {App.Models.Myorder} model - removed order item model.
         */
        onModelRemoved: function(model) {
            this.quantity -= model.get('quantity');

            this.change_only_gift_dining_option();

            if (this.get_only_product_quantity() < 1) {
                this.discount.zero_discount();
                this.removeServiceFees();
            }

            if (model.isRealProduct() && !this.paymentInProgress) {
                this.update_cart_totals({update_shipping_options: true});
            }
        },
        /**
         * Recalculates total when model changes.
         * @param {App.Models.Myorder} model - changed order item model.
         */
        onModelChange: function(model) {

            var countProdPrev = model.get('quantity_prev'),
                sumNew = model.get_modelsum(),
                countProdNew = model.get('quantity');

            this.quantity = this.quantity + countProdNew - countProdPrev;

            model.set({
                'sum': sumNew,
                'quantity_prev': countProdNew
            }, {silent: true});

            model.changedAttributes() && model.changedAttributes().sum && model.trigger('update:sum', model);

            if (model.isRealProduct()) {
                this.update_cart_totals({update_shipping_options: true});
            }
        },
        /**
         * Removes service fees from the collection.
         */
        removeServiceFees: function() {
            var fees = this.filter(function(obj){ return obj.isServiceFee(); });
            this.remove(fees);
        },
        /**
         * Saves the order in a storage. 'orders' key is used.
         */
        saveOrders: function() {
            var orderToSave = this.toJSON();

            setData('orders', orderToSave);
            this.checkout.saveCheckout();
            this.rewardsCard.saveData();
            this.total.saveTotal();
            this.discount.saveDiscount();
        },
        /**
         * Loads the order from a storage. 'orders' key is used.
         */
        loadOrders: function() {
            this.empty_myorder();
            this.checkout.loadCheckout();
            this.rewardsCard.loadData();
            this.total.loadTotal();
            this.discount.loadDiscount();
            var orders = getData('orders');

            if (orders) {
                this.addJSON(orders);
            }
        },
        /**
         * Checks the cart before payment.
         * @param {Object} opts - checking options
         * @returns {Object}
         * ```
         * // Successful validation
         * {
         *       status: 'OK'
         * }
         * // Failure validation (may be caused when no one product is added to cart, tip is more than grand total,
         * // limit of minimum order amount isn't satisfied, limit of minimum items in order isn't satisfied)
         * {
         *     status: 'ERROR',
         *     errorMsg: <error message>
         * }
         * ```
         */
        _check_cart: function(opts) {
            var total = this.total.get_total() * 1,
                tip = this.total.get_tip() * 1,
                isDelivery = this.checkout.get('dining_option') === 'DINING_OPTION_DELIVERY',
                isOnlyGift = this.checkout.get('dining_option') === 'DINING_OPTION_ONLINE';

            opts = opts || {};

            if (this.get_only_product_quantity() === 0) {
                return {
                    status: 'ERROR',
                    errorMsg: MSG.ERROR_PRODUCT_NOT_SELECTED
                };
            }

            if (opts.tip && tip > total) {
                return {
                    status: 'ERROR',
                    errorMsg: MSG.ERROR_GRATUITY_EXCEEDS
                };
            }

            if (!opts.skipDeliveryAmount && isDelivery) {
                var remain = this.total.get_remaining_delivery_amount();
                if (remain > 0 ) {
                    return {
                        status: 'ERROR',
                        errorMsg: (MSG.ADD_MORE_FOR_DELIVERY).replace('%s', App.Data.settings.get('settings_system').currency_symbol + remain)
                    };
                }
            }

            var sum_quantity = this.not_gift_product_quantity(),
                min_items = App.Data.settings.get("settings_system").min_items;

            if (!opts.skipQuantity && sum_quantity < min_items && !isOnlyGift) {
                return {
                    status: 'ERROR_QUANTITY',
                    errorMsg: msgFrm(MSG.ERROR_MIN_ITEMS_LIMIT, min_items)
                };
            }

            return {
                status: 'OK'
            };
        },
        /**
         * Checks the order.
         * @param {Object} options - validation options
         * @param {boolean} options.checkout - if `true` need to validate {@link App.Collections.Myorders#checkout} model
         * @param {boolean} options.customer - if `true` need to validate {@link App.Models.Customer App.Data.customer} model
         * @param {boolean} options.card - if `true` need to validate {@link App.Models.Card App.Data.card} model
         * @param {boolean} options.order - if `true` need to {@link App.Collections.Myorders#_check_cart validate} the cart
         * @param {boolean} options.validationOnly - if `true` don't need to proceed the order placing
         * @param {Function} success - a callback for successful validation
         * @param {Function} error - a callback for failure validation
         */
        check_order: function(options, success, error) {
            error = error || App.Data.errors.alert.bind(App.Data.errors); // user notification
            var fields = [],
                errorMsg = '',
                self = this,
                dining_option = this.checkout.get('dining_option');

            if (options.card) {
                var card = App.Data.card,
                    check_card = card.check();

                if (check_card.status === 'ERROR') {
                    errorMsg = check_card.errorMsg;
                } else if (check_card.status === 'ERROR_EMPTY_FIELDS') {
                    fields = fields.concat(check_card.errorList);
                }
            }

            if (options.card_billing_address) {
                var card = App.Data.card,
                    check_card = card.check_billing_address();

                if (check_card.status === 'ERROR') {
                    errorMsg = check_card.errorMsg;
                } else if (check_card.status === 'ERROR_EMPTY_FIELDS') {
                    fields = fields.concat(check_card.errorList);
                }
            }

            if (options.giftcard) {
                var giftcard = App.Data.giftcard,
                    check_card = giftcard.check();

                if (check_card.status === 'ERROR_EMPTY_FIELDS') {
                    fields = fields.concat(check_card.errorList);
                }
            }

            if (options.stanfordcard) {
                var stanfordcard = App.Data.stanfordCard,
                    check_card = stanfordcard.check();

                if (check_card.status === 'ERROR_EMPTY_FIELDS') {
                    fields = fields.concat(check_card.errorList);
                }
            }

            if (options.checkout) {
                var checkout = this.checkout,
                    check_checkout = checkout.check();

                if (check_checkout.status === 'ERROR') {
                    return error(check_checkout.errorMsg); // user notification
                } else if (check_checkout.status === 'ERROR_EMPTY_FIELDS') {
                    fields = fields.concat(check_checkout.errorList);
                }
            }

            if (options.order) {
                var check_order = this._check_cart(options);

                if (check_order.status === 'ERROR_QUANTITY') {
                    if (!arguments[2]) { // if we don't set error callback, use usual two button alert message or if we on the first page

                        return error(check_order.errorMsg, false, false, {
                            isConfirm: true,
                            confirm: {
                                ok: 'Ok',
                                cancel: 'Add Items',
                                cancelHide: options.first_page
                            },
                            callback: function(result) {
                                if (!result) App.Data.router.navigate('index', true);
                            }
                        }); // user notification
                    } else {
                        return error(check_order.errorMsg); // user notification
                    }
                }
                if (check_order.status !== 'OK') {
                    return error(check_order.errorMsg); // user notification
                }
            }

            if (options.customer) {
                var customer = App.Data.customer,
                    check_customer = customer.check(dining_option);

                if (check_customer.status === 'ERROR') {
                    errorMsg = check_customer.errorMsg;
                } else if (check_customer.status === 'ERROR_EMPTY_FIELDS') {
                    if(App.Skins.WEBORDER == App.skin || App.Skins.WEBORDER_MOBILE == App.skin) {
                        fields.splice.apply(fields, [0, 0].concat(check_customer.errorList));
                    } else {
                        fields = fields.concat(check_customer.errorList);
                    }
                }
            }

            if (fields.length) {
                return error(MSG.ERROR_EMPTY_NOT_VALID_DATA.replace(/%s/, fields.join(', '))); // user notification
            } else if (errorMsg) {
                return error(errorMsg); // user notification
            } else {
                _success.call(this);
            }

            function _success() {
                if (options.validationOnly) {
                    var tmp_model = new Backbone.View();
                    tmp_model.listenTo(this, 'paymentResponseValid', function() {
                        success();
                        tmp_model.remove();
                        self.trigger('paymentInProcessValid');
                    });
                    tmp_model.listenTo(this, 'paymentFailedValid', function(message) {
                        error(message);
                        tmp_model.remove();
                        self.trigger('paymentInProcessValid');
                    });
                    this.create_order_and_pay(PAYMENT_TYPE.NO_PAYMENT, true);
                } else {
                    success();
                }
            }
        },
        /**
         * Prepares the order for placing. This method is used for the order validation and placing.
         * @param {number} Payment type:
         * - `1` - PayPal mobile (available in native PayPal client),
         * - `2` - creadit card,
         * - `3` - PayPal,
         * - `4` - no payment,
         * - `5` - pay with gift card,
         * - `6` - pay with Stanford card.
         * @param {boolean} validationOnly - if `true` need to only validate the order
         */
        create_order_and_pay: function(payment_type, validationOnly) {
            if(this.paymentInProgress)
                return;
            this.paymentInProgress = true;
            if(this.preparePickupTime() === 0) {
                this.trigger('cancelPayment');
                delete this.paymentInProgress;
                App.Data.errors.alert(MSG.ERROR_STORE_IS_CLOSED); // user notification
                return;
            }
            this.trigger('paymentInProcess');
            this.submit_order_and_pay(payment_type, validationOnly);
        },
        /**
         * Handles a pickup time of the order.
         * @returns {(number|undefined)} `0` if a store is closed in specified pickup time. Otherwise, returns `undefined`.
         */
        preparePickupTime: function() {
            var only_gift = this.checkout.get('dining_option') === 'DINING_OPTION_ONLINE';

            if(!only_gift) {
                var pickup = this.checkout.get('pickupTS'),
                    currentTime = App.Data.timetables.base(),
                    delivery = this.checkout.get('dining_option') === 'DINING_OPTION_DELIVERY',
                    time = App.Data.timetables.current_dining_time(delivery).getTime(),
                    lastPickupTime,
                    lastPT,
                    isASAP = this.checkout.get("isPickupASAP");

                if (pickup) pickup = new Date(time > pickup ? time : pickup);

                if (App.skin != App.Skins.RETAIL && (!pickup || !App.Data.timetables.checking_work_shop(pickup, delivery)) ) { //pickup may be null or string
                    return 0;
                }

                // need to use only time zone offset, difference in minutes between client and server time is already considered
                var TimeZoneOffset = App.Settings.time_zone_offset + (new Date()).getTimezoneOffset() * 60 * 1000;

                if (isASAP) {
                    lastPT = App.Data.timetables.getLastPTforWorkPeriod(currentTime);
                    if (lastPT instanceof Date){
                        lastPickupTime = format_date_1(lastPT.getTime() - TimeZoneOffset);
                    }
                    if (lastPT === 'not-found') {
                       //TODO: test this case by unit tests and remove this trace:
                    }
                    //for lastPT = "all-the-day" we should not pass any pickupTime to server. i.e. lastPickupTime is undefined
                }

                this.checkout.set({
                    'pickupTime': isASAP ? (_loc.TIME_PREFIXES.ASAP + ' (' + pickupToString(pickup) + ')') : pickupToString(pickup),
                    'createDate': format_date_1(Date.now()),
                    'pickupTimeToServer': pickup ? format_date_1(pickup.getTime() - TimeZoneOffset) : undefined,
                    'lastPickupTime': lastPickupTime
                });

            }
        },
        /**
         * Inits 'cart_totals' request tha will be sent in 500 msec.
         * If you need to recalculate cart totals need to use this method.
         * @param {Object} params - Request params.
         * @param {boolean} params.apply_discount - If `true` need to pass discount code for application.
         * @param {number} params.type - Payment type. If it's Stanford payment type then need to add `paymentInfo.type`
         *                               to POST data in cart_totals request.
         * @param {number} params.planId - Stanford plan id. If it's present then need to add `paymentInfo.cardInfo.planId`
         *                               to POST data in cart_totals request.
         * @param {boolean} params.update_shipping_options - If it's `true` need to update available shipping services.
         */
        update_cart_totals: function(params) {
            var self = this;
            this.last_cart_totals_params = params;
            if (!this.getDiscountsTimeout) { // it's to reduce the number of requests to the server
                /**
                 * Indicates that cart totals is being calculated now. This property is deleted after calculation.
                 * @type {boolean}
                 */
                this.pending = true; // bug #32598
                this.trigger('onCartTotalsUpdate');
                /**
                 * Delayed cart totals update. Timeout is 500 msec.
                 * @type {Function}
                 */
                this.getDiscountsTimeout = setTimeout(function() {
                    self.get_cart_totals(self.last_cart_totals_params); //update_cart_totals func can be called several times with different params during 500 ms interval.
                                                                        //The latest params should be used for get_cart_totals() result call.
                }, 500);
            }
        },
        /**
         * Prepares a request to `/weborders/cart_totals/`. This is intermediate function.
         * To update cart totals need to use {@link App.Collections.Myorders#update_cart_totals update_cart_totals()} method.
         * @param {Object} params - Request params.
         * @param {boolean} params.apply_discount - If `true` need to pass discount code for application.
         * @param {number} params.type - Payment type. If it's Stanford payment type then need to add `paymentInfo.type`
         *                               to POST data in cart_totals request.
         * @param {number} params.planId - Stanford plan id. If it's present then need to add `paymentInfo.cardInfo.planId`
         *                               to POST data in cart_totals request.
         * @param {boolean} params.update_shipping_options - If it's `true` need to update available shipping services.
         */
        get_cart_totals: function(params) {
            var self = this;
            if (this.getDiscountsTimeout) {
                clearTimeout(this.getDiscountsTimeout);
                delete this.getDiscountsTimeout;
            }

            if (self.get_only_product_quantity() < 1) {
                self.total.set({
                    subtotal: 0,
                    tax: 0,
                    surcharge: 0,
                    discounts: 0
                });
            }

            if (self.get_only_product_quantity() < 1 || self.NoRequestDiscounts === true) {
                self.trigger("NoRequestDiscountsComplete");
                delete self.pending;
                return (new $.Deferred()).reject();
            }

            if (this.get_discount_xhr) {
                this.get_discount_xhr.abort();
            }
            this.get_discount_xhr = this._get_cart_totals(params);
            this.get_discount_xhr.always(function() {
                delete self.pending;
                delete self.get_discount_xhr;
            });

            return this.get_discount_xhr;
        },
        /**
         * Sends request to update cart totals. Used request parameters:
         * ```
         * {
         *     type: "POST",
         *     dataType: "json"
         *     url: "/weborders/cart_totals/",
         *     data: {
         *         establishmentId: <establishment id>,
         *         items: <order items>,
         *         orderInfo: {
         *             dining_option: <specified dining option>,
         *             shipping: <selected shipping service object>      // optional, used for Shipping' dining option
         *             customer: {                                       // optional, used for Shipping' dining option
         *                 address: <specified shipping address object>  // optional, used for Shipping' dining option
         *             },
         *             rewards_card: {                   //optional, used for Rewards Card redemption
         *                 number: <reward card number>, // optional
         *                 discounts: <discount ids>     // optional
         *             }
         *         },
         *         discount_code: <discount code>      // optional, used for discount code application
         *         paymentInfo: {                      // optional, used for Stanford card
         *             type: <stanford payment type>,  // optional, used for Stanford card
         *             cardInfo: {                     // optional, used for Stanford card
         *                 planId: <stanford plan id>  // optional, used for Stanford card
         *             }
         *         }
         *     }
         * }
         * ```
         * This is intermediate function.
         * To update cart totals need to use {@link App.Collections.Myorders#update_cart_totals update_cart_totals()} method.
         *
         * @param {Object} params - Request params.
         * @param {boolean} params.apply_discount - If `true` need to pass discount code for application.
         * @param {number} params.type - Payment type. If it's Stanford payment type then need to add `paymentInfo.type`
         *                               to POST data in cart_totals request.
         * @param {number} params.planId - Stanford plan id. If it's present then need to add `paymentInfo.cardInfo.planId`
         *                               to POST data in cart_totals request.
         * @param {boolean} params.update_shipping_options - If it's `true` need to update available shipping services.
         *
         * @returns {Object} jsXHR request.
         */
        _get_cart_totals: function(params) {
            var myorder = this, checkout,
                customer = App.Data.customer,
                rewardsCard = this.rewardsCard.toJSON(),
                items = [],
                order_info = {},
                is_apply_discount = params && params.apply_discount ? params.apply_discount : false,
                order = {
                    establishmentId: App.Data.settings.get("establishment"),
                    items: items,
                    orderInfo: order_info
                },
                shipping_address,
                isShipping,
                request;

            this.preparePickupTime();
            checkout = this.checkout.toJSON();

            if (checkout.discount_code && is_apply_discount) {
                order.discount_code = checkout.discount_code;
            }
            if (!is_apply_discount && checkout.last_discount_code) {
                order.discount_code = checkout.last_discount_code;
            }

            myorder.each(function(model) {
                if (!model.isServiceFee())
                  items.push(model.item_submit(true));
            });

            order_info.dining_option = DINING_OPTION[checkout.dining_option];

            isShipping = checkout.dining_option === 'DINING_OPTION_SHIPPING' && customer
                && (shipping_address = this.getCustomerAddress())
                && !customer._check_delivery_fields().length;

            if(isShipping) {
                order_info.shipping = customer.get('shipping_services')[customer.get('shipping_selected')] || {};
                order_info.customer =  {address: shipping_address};
            }

            // add rewards card and selected discounts
            if(rewardsCard.number && rewardsCard.discounts.length) {
                order_info.rewards_card = {
                    number: rewardsCard.number,
                    discounts: rewardsCard.discounts
                };
            }

            // add info for stanford card
            if(params && params.type === PAYMENT_TYPE.STANFORD && params.planId) {
                order.paymentInfo = {
                    type: params.type,
                    cardInfo: {planId: params.planId}
                }
            }

            var myorder_json = JSON.stringify(order);
            request = $.ajax({
                type: "POST",
                url: App.Data.settings.get("host") + "/weborders/cart_totals/",
                data: myorder_json,
                dataType: "json",
                success: function(data) {
                    if (!data || !data.status) {
                        reportErrorFrm(MSG.ERROR_OCCURRED + ' ' + MSG.ERROR_INCORRECT_AJAX_DATA);
                        return;
                    }
                    switch(data.status) {
                        case "OK":
                            if (checkout.discount_code && is_apply_discount) {
                                myorder.checkout.set('last_discount_code', checkout.discount_code);
                            }
                            if (myorder.get_only_product_quantity() > 0) {
                                myorder.process_cart_totals(data.data);
                            }
                            break;
                        case "DISCOUNT_CODE_NOT_FOUND":
                        case "DISCOUNT_CODE_NOT_APPLICABLE":
                            myorder.checkout.set('last_discount_code', null);
                            reportErrorFrm(MSG[data.status]);
                            myorder.update_cart_totals();//get discounts & totals w/o discount_code
                            break;
                        default:
                            if (!data.errorMsg) data.errorMsg = MSG.ERROR_NO_MSG_FROM_SERVER;
                            data.errorMsg = MSG.ERROR_OCCURRED + ' ' + data.errorMsg;
                            reportErrorFrm(data.errorMsg);
                    }//end of switch
                },
                error: function(xhr) {
                    if (xhr.statusText != "abort") {
                        reportErrorFrm(MSG.ERROR_GET_DISCOUNTS);
                    }
                },
                complete: function(xhr) {
                    if (xhr.statusText != "abort") {
                        myorder.trigger("DiscountsComplete");
                    }
                }
            });

            // Need to update shipping services if it's required
            if(isShipping && params && params.update_shipping_options) {
                App.Data.customer.get_shipping_services(request, function(response) {
                    if(response.data instanceof Object && response.data.shipping instanceof Object && Array.isArray(response.data.shipping.options)) {
                        return response.data.shipping.options;
                    } else {
                        return [];
                    }
                });
            }

            return request;

            function reportErrorFrm(message) {
                if (is_apply_discount) App.Data.errors.alert(message); // user notification
            }
        },
        /**
         * Updates cart totals. This method is used as handler of cart totals request.
         * @param {Object} json - Object literal with calculated totals.
         * @param {number} json.subtotal - Subtotal of the order.
         * @param {number} json.tax - Tax of the order.
         * @param {number} json.surcharge - Surcharge of the order.
         * @param {number} json.discounts - Sum of all discounts applied to the order.
         * @param {Object} [json.shipping] - Shipping data of the order.
         * @param {number} [json.shipping.service_charge] - Charge for shipping service.
         * @param {number} [json.shipping.discount_sum] - Discount for shipping service.
         * @param {Array} [json.service_fees] - Array of service fees. Each service fee is present as object:
         * ```
         * {
         *     id: <service fee id>,
         *     name: <service fee name>,
         *     amount: <service fee charge amount>
         * }
         * ```
         * @param {Object} [json.order_discount] - Order discount calculations.
         * @param {string} [json.order_discount.name] - Order discount name.
         * @param {number} [json.order_discount.sum] - Order discount amount.
         * @param {boolean} [json.order_discount.taxed] - Order discount is taxable or nor.
         * @param {number} [json.order_discount.id] - Order discount id.
         * @param {number} [json.order_discount.type] - Order discount type.
         */
        process_cart_totals: function(json) {
            if (!(json instanceof Object)) return;

            var myorder = this, model;

            json.items.forEach(function(product) {
                var model = myorder.findWhere({ "product_sub_id": product.product_sub_id,
                                                "id_product": product.product });
                if (!model || !model.get("discount"))
                    return;

                if (product.discount instanceof Object) {
                    model.get("discount").set({ name: product.discount.name,
                                        sum: product.discount.sum,
                                        taxed: product.discount.taxed,
                                        id: product.discount.id,
                                        type: product.discount.type
                                    });
                } else {
                    model.get("discount").zero_discount();
                }

                if (product.combo_items instanceof Object) {
                    for (var i in product.combo_items) {
                        var order_product = model.get('product').get('product_sets').find_product(product.combo_items[i].product);
                        if (order_product) {
                            order_product.get('product').set("combo_price", product.combo_items[i].price);
                        }
                    }
                    model.get('product').set("combo_price", product.price);
                }
            });

            if (json.service_fees == undefined)
                json.service_fees = [];

            if (Array.isArray(json.service_fees)) {
                var myorder_fees = myorder.filter(function(obj){ return obj.isServiceFee(); });

                var diff = myorder_fees.filter(function(obj){
                        return !_.findWhere(json.service_fees, {id: obj.id});
                    });
                //remove all service fees from myorder which aren't present in the response now
                myorder.remove(diff);

                //we create new service fee if needed or update old one:
                json.service_fees.forEach(function(item){
                    var fee = myorder.findWhere({id: item.id});
                    if (!fee) {
                        fee = new App.Models.ServiceFeeItem({id: item.id});
                        myorder.add(fee);
                    }
                    fee.get("product").set({name: item.name, price: item.amount});
                    fee.set({ initial_price: item.amount,
                              sum: item.amount });
                });
            }

            if (json.order_discount instanceof Object) {
                myorder.discount.set({ name: json.order_discount.name,
                                       sum: json.order_discount.sum,
                                       taxed: json.order_discount.taxed,
                                       id: json.order_discount.id,
                                       type: json.order_discount.type
                                    });
            } else {
                myorder.discount.zero_discount();
            }

            // bug #50857
            myorder.total.get('tip').set({
                discounts: json.discounts,
                serviceFee: myorder.get_service_fee_charge()
            });

            myorder.total.set({
                subtotal: json.subtotal,
                tax: json.tax,
                surcharge: json.surcharge,
                discounts: json.discounts,
                shipping: json.shipping && json.shipping.service_charge,
                shipping_discount: json.shipping && json.shipping.discount_sum,
            });
        },

        /**
         * Places or validates the order. Used parameters for request:
         * ```
         * {
         *     type: "POST",
         *     dataType: "json",
         *     url: "/weborders/pre_validate/"             // for order validation
         *     url: "/weborders/create_order_and_pay_v1/"  // for order placing
         *     data: {
         *         skin: <the app's skin>,
         *         establishmentId: <establishment id>,
         *         items: <order items>,
         *         orderInfo: {
         *             created_date: <created at>,
         *             pickup_time: <pickup time>,
         *             lastPickupTime: <last pickup time>,
         *             dining_option: <dining option>,
         *             notes: <order notes>,
         *             asap: <true if pickup time is ASAP>,
         *             discount: <discount data>,
         *             call_name: <call name of customer>,
         *             rewards_card: {                      // optional
         *                 discounts: <discount ids>,        // optional
         *                 number: <reward card number>     // optional
         *             },
         *             shipping: <specified shipping service> // optional
         *             customer: <customer data>              // optional
         *         },
         *         paymentInfo: {
         *             address: <address object>,              // optional, address for delivery the order to
         *             phone: <customer's phone>,              // optional
         *             email: <customer's email>,              // optional
         *             first_name: <customer's first name>
         *             last_name: <customer's last name>,
         *             transaction_id: <transaction id>,       // optional, transaction_id, used in capture phase
         *             errorMsg: <payment error>,              // optional, in failure payment
         *             response_order_id: <response order id > // optional, MONERIS_GET_PARAMS.RESPONSE_ORDER_ID
         *             order_id: <order id>                    // optional, WORLDPAY_GET_PARAMS.ORDER_ID or AYDEN_GET_PARAMS.merchantReference
         *             refcode: <refcode>                      // optional, WORLDPAY_GET_PARAMS.REFCODE
         *             payer_id: <payer id>                    // optional, PayPal payment processor
         *             payment_id: <payment id>                // optional, PayPal payment processor
         *             tabId: <tab id>                         // optional, PayPal Mobile payment processor
         *             locationId: <location id>               // optional, PayPal Mobile payment processor
         *             customerId: <customer id>               // optional, PayPal Mobile payment processor
         *             phone: <customer's phone>               // optional, PayPal Mobile payment processor
         *             cardInfo: {                                 // optional, for payment with credit card
         *                 firstDigits: <first 4 digits of CC>,    // optional
         *                 lastDigits: <last 4 digits of CC>       // optional
         *                 firstName: <first name of CC holder>,   // optional
         *                 lastName: <last name of CC holder>,     // optional
         *                 address: <address>,                     // optional
         *                 token: <token>,                         // optional, QuickBooks payment processor
         *                 cardNumber: <card number>,              // optional, Gift Card
         *                 captchaKey: <captcha key>,              // optional, Gift Card
         *                 captchaValue: <captcha value>,          // optional, Gift Card
         *                 planId: <plan id>,                      // optional, Stanford Card
         *                 token_id: <token id>,                   // optional, token id
         *                 vault_id: <vault id>                    // optional, token's vault id
         *             }
         *         },
         *         notifications: [{
         *             skin: <the app's skin>,
         *             type: 'email',
         *             destination: <email>
         *         }]
         *     }
         * }
         * ```
         *
         * A response is a object containing `status` property and may contains `errorMsg`, `data` properties.
         * `status` of response is:
         * - 'OK' - order was successfully submitted or validated on server.
         * - 'REDIRECT' - need to redirect the app to 3rd party page to complete a payment.
         * - 'PAYMENT_INFO_REQUIRED' - need to get payment info from payment gateway (QuickBooks).
         * - 'INSUFFICIENT_STOCK' - the order cannot be submitted due to insufficient stock amount one of items.
         * - 'ASAP_TIME_SLOT_BUSY' - the order cannot be submitted due to specified 'ASAP' time cannot be accepted by server
         * (need to select another pickup time).
         * - 'ORDERS_PICKUPTIME_LIMIT' - the order cannot be submitted due to the order is over of limit on specified pickup time
         * (need to select another pickup time).
         * - 'REWARD CARD UNDEFINED' - the order cannot be submitted due to reward card is invalid.
         * - 'DELIVERY_ADDRESS_ERROR' - the order cannot be submitted due to delivery address is invalid.
         * - 'PRODUCTS_NOT_AVAILABLE_FOR_SELECTED_TIME' - the order cannot be submitted due to at least one item's custom menu is out
         * of time of order placing.
         * - 'ERROR' - the order cannot be submitted due to something went wrong on server.
         *
         * @param {number} payment_type - payment type
         * @param {boolean} validationOnly - if it's `true` the order has to be only validated on server
         * @param {boolean} capturePhase - if it's `true` a payment was handled on 3rd party payment service
         *                                 and the order should be completed on Revel's server.
         */
        submit_order_and_pay: function(payment_type, validationOnly, capturePhase) {
            var myorder = this,
                get_parameters = App.Data.get_parameters,
                skin = App.Data.settings.get('skin'),
                total = myorder.total.get_all(),
                tip = myorder.total.get('tip'),
                items = [],
                order_info = {},
                payment_info = {
                    tip: total.tip,
                    tip_percent: tip.get('amount') == true ? tip.get('percent') : undefined,
                    type: payment_type
                },
                order = {
                    skin: skin,
                    establishmentId: App.Data.settings.get("establishment"),
                    items: items,
                    orderInfo: order_info,
                    paymentInfo: payment_info
                },
                payment = App.Data.settings.get_payment_process(),
                billing_address;

            myorder.each(function(model) {
                if (!model.isServiceFee())
                    items.push(model.item_submit());
            });

            var call_name = [],
                checkout = this.checkout.toJSON(),
                rewardsCard = this.rewardsCard.toJSON(),
                card = App.Data.card && App.Data.card.toJSON(),
                customer = App.Data.customer.toJSON();

            if (checkout.last_discount_code) {
                order.discount_code = checkout.last_discount_code;
            }
            order_info.created_date = checkout.createDate;
            order_info.pickup_time = checkout.pickupTimeToServer;
            order_info.lastPickupTime = checkout.lastPickupTime;
            order_info.dining_option = DINING_OPTION[checkout.dining_option];
            order_info.notes = checkout.notes;
            if (checkout.dining_option == "DINING_OPTION_OTHER")  {
                order_info.notes.length && (order_info.notes += "\n");
                order_info.notes += _loc.DELIVERY_INFO + ": " + this.getOtherDiningOptionCallName();
            }
            order_info.asap = checkout.isPickupASAP;
            order_info.discount = this.discount.get("id") ? this.discount.toJSON() : undefined;

            var customerData = this.getCustomerData();
            call_name = call_name.concat(customerData.call_name);

            order_info.customer = {};
            if(checkout.dining_option === 'DINING_OPTION_DELIVERY' || checkout.dining_option === 'DINING_OPTION_CATERING') {
                order_info.customer.address = this.getCustomerAddress();
            }
            $.extend(order_info.customer, customerData.payment_info);

            // process payment type
            var pt = PaymentProcessor.processPaymentType(payment_type, myorder);
            $.extend(payment_info, pt);

            // if payment has failed need emit 'paymentResponse' event and abort execution
            if (payment_info.errorMsg) {
                return reportPaymentError(payment_info.errorMsg);
            }

            if (card) {
                if (card.nonce) {
                    payment_info.cardInfo.nonce = card.nonce;
                }
                if (card.encrypted_customer_input) {
                    payment_info.cardInfo.encrypted_customer_input = card.encrypted_customer_input;
                }
            }

            if (payment_type == PAYMENT_TYPE.CREDIT && PaymentProcessor.isBillingAddressCard()) {

                billing_address = get_billing_address();
                if (_.isObject(billing_address)) {

                    payment_info.cardInfo.address = {
                        street_1: billing_address.street_1,
                        city: billing_address.city,
                        state: billing_address.state,
                        zipcode: billing_address.zipcode,
                        country: billing_address.country_code
                    };
                }
            }

            var notifications = this.getNotifications();
            order_info.call_name = call_name.join(' / ');
            if(notifications)
                order.notifications = notifications;

            if(rewardsCard.number) {
                if (rewardsCard.discounts.length) {
                    // To redeem points card number must be provided in separate request together with captcha
                    order_info.rewards_card = {
                        number: rewardsCard.number,
                        discounts: rewardsCard.discounts
                    };
                } else {
                    // Just collect points
                    order_info.rewards_card = {
                        number: rewardsCard.number
                    };
                }
            }

            if(checkout.dining_option === 'DINING_OPTION_SHIPPING') {
                order_info.shipping = customer.shipping_services[customer.shipping_selected] || undefined;
                order_info.customer = !order_info.shipping ? undefined : _.extend({
                    address: this.getCustomerAddress()
                }, order_info.customer);
            }

            var myorder_json = JSON.stringify(order),
                doPayWithToken = App.Data.customer.doPayWithToken(),
                successValidation,
                req;

            if (validationOnly || payment_type != PAYMENT_TYPE.CREDIT || !App.Data.customer.isAuthorized() || !App.Data.customer.payments || (!doPayWithToken && !card.rememberCard && (!payment.credit_card_dialog || card.cardNumber))) {
                req = $.ajax({
                    type: "POST",
                    url: App.Data.settings.get("host") + "/weborders/" + (validationOnly ? "pre_validate/" : "create_order_and_pay_v1/"),
                    data: myorder_json,
                    dataType: "json",
                    success: new Function(), // to override global ajax success handler
                    error: new Function()    // to override global ajax error handler
                });
            } else {
                req = App.Data.customer.payWithToken(order, card, payment_info.token_id);
            }

            // successfull payment handler
            req.done(function(data) {
                if (!data || !data.status) {
                    reportErrorFrm(MSG.ERROR_OCCURRED + ' ' + MSG.ERROR_INCORRECT_AJAX_DATA);
                    return;
                }
                myorder.paymentResponse = data instanceof Object ? _.extend(data, {paymentType: payment_type}) : {};
                myorder.paymentResponse.capturePhase = capturePhase;

                switch(data.status) {
                    case "OK":
                        if (validationOnly) {
                            successValidation = Backbone.$.Deferred();
                            successValidation.then(myorder.trigger.bind(myorder, 'paymentResponseValid'));
                        } else {
                            if (data.balances && data.balances.stanford) {
                                App.Data.stanfordCard && payment_type === PAYMENT_TYPE.STANFORD && App.Data.stanfordCard.updatePlans(data.balances.stanford);
                            }
                            if (data.balances && data.balances.rewards) {
                                App.Data.myorder.rewardsCard && App.Data.myorder.rewardsCard.resetDataAfterPayment();
                            }
                            if (App.Data.customer.isAuthorized()) {
                                App.Data.customer.getGiftCards();
                                App.Data.customer.getRewardCards();
                                App.Data.customer.getAddresses();
                            }
                            myorder.trigger('paymentResponse');
                        }

                        break;
                    case "REDIRECT": // need to complete payment on external site
                        PaymentProcessor.handleRedirect(payment_type, myorder, data);
                        break;
                    case "PAYMENT_INFO_REQUIRED": //need to make ajax call payment gateway
                        PaymentProcessor.handlePaymentDataRequest(payment_type, myorder, data);
                        break;
                    case "INSUFFICIENT_STOCK":
                        var message = '<span style="color: red;"> <b>' + MSG.ERROR_INSUFFICIENT_STOCK + '</b> </span> <br />';
                        var groupedByIdResponseJSON = _.chain(data.responseJSON).indexBy("id").values().value();
                        for (var i = 0, j = groupedByIdResponseJSON.length; i < j; i++) {
                            var current_element = data.responseJSON[i],
                                order = myorder.where({id_product: current_element.id}),
                                product = order[0].get_product(),
                                name_product = product.get("name"),
                                stock_amount = current_element.stock_amount,
                                initial_product = App.Data.products[product.get('id_category')].get_product(current_element.id);

                            if (stock_amount === 0) {
                                myorder.remove(order);
                                initial_product.set('active', false);
                            } else {
                                initial_product.set('stock_amount', current_element.stock_amount);
                            }
                            message += "<b>" + name_product + "</b>: requested - " + current_element.requested + ", stock amount - " + current_element.stock_amount + ". <br />";
                        }
                        data.errorMsg = message;
                        reportError(data.errorMsg);
                        break;
                    case "ASAP_TIME_SLOT_BUSY":
                        var asap_pickup_time = new Date(data.responseJSON.asap_pickup_time);
                        asap_pickup_time = '' + new TimeFrm(asap_pickup_time.getHours(), asap_pickup_time.getMinutes());
                        data.errorMsg = msgFrm(MSG.ERROR_ASAP_TIME_SLOT_BUSY, asap_pickup_time);
                        reportErrorFrm(data.errorMsg);
                        break;
                    case "ORDERS_PICKUPTIME_LIMIT":
                        data.errorMsg = MSG.ERROR_ORDERS_PICKUPTIME_LIMIT;
                        reportErrorFrm(data.errorMsg);
                        break;
                    case "REWARD CARD UNDEFINED":
                        reportErrorFrm(MSG.REWARD_CARD_UNDEFINED);
                        break;
                    case "DELIVERY_ADDRESS_ERROR":
                        reportErrorFrm(data.errorMsg);
                        break;
                    case "PRODUCTS_NOT_AVAILABLE_FOR_SELECTED_TIME":
                        reportErrorFrm(data.errorMsg + " " + MSG.PRODUCTS_VALID_TIME + "<br/>" + format_timetables(data.responseJSON["timetables"], ",<br/>"));
                        break;
                    case "CVV_REQUIRED_CANCELED":
                        break;
                    default:
                        PaymentProcessor.handlePaymentRequestFailure(payment_type, data);
                        data.errorMsg = MSG.ERROR_OCCURRED + ' ' + data.errorMsg;
                        reportErrorFrm(data.errorMsg);
                }//end of switch
            });

            // failure payment handler
            req.fail(function(xhr) {
                var errorMsg = '';
                if ('onLine' in window.navigator && !window.navigator.onLine && capturePhase) {
                    // network connection is lost after return from payment processor
                    errorMsg = MSG.ERROR_SUBMIT_ORDER_DISCONNECT;
                    myorder.disconnected = true;
                }
                else {
                    errorMsg = MSG.ERROR_SUBMIT_ORDER;
                }
                myorder.paymentResponse = {
                    status: 'ERROR',
                    errorMsg: errorMsg
                };
                reportErrorFrm(errorMsg);
            });

            req.always(function(xhr, result) {
                payment_type === PAYMENT_TYPE.PAYPAL_MOBILE && $.mobile.loading("hide");
                delete myorder.paymentInProgress;
                if (App.Data.card) {
                    App.Data.card.unset('nonce');
                    if (!myorder.paymentResponse || myorder.paymentResponse.status != "PAYMENT_INFO_REQUIRED") {
                        App.Data.card.unset('encrypted_customer_input');
                    }
                }
                successValidation && successValidation.resolve();
            });

            function reportErrorFrm(message) {
                if (validationOnly) {
                    myorder.trigger('paymentFailedValid', [message]);
                } else if (capturePhase) {
                    reportPaymentError(message);
                } else {
                    myorder.trigger('paymentFailed');
                    App.Data.errors.alert(message, false, false, {
                        errorServer: true,
                        typeIcon: 'warning'
                    }); // user notification
                }
            }

            function reportError(message) {
                if (validationOnly) {
                    myorder.trigger('paymentFailedValid', [message]);
                } else {
                    myorder.trigger('paymentFailed', [message]);
                }
            }

            function reportPaymentError(message) {
                myorder.paymentResponse = {status: 'error', errorMsg: message, capturePhase: capturePhase};
                myorder.trigger('paymentResponse');
            }
        },
        /**
         * Used in {@link App.Collections.Myorders#submit_order_and_pay submit_order_and_pay()} method
         * to get a call name at 'Stadium' mode.
         * @param {string} [phone] - phone number
         * @returns {Array} An array in which the first element is a string 'Level: %level% Sect: %section% Row: %row% Seat: %seat%'
         *                  and the second item is the passed phone number (optional).
         */
        getOrderSeatCallName: function(phone) {
            var checkout = this.checkout.toJSON(),
                call_name = [],
                seatInfo = '';
            if (checkout.level)
                seatInfo += ' Level: ' + checkout.level;
            if(checkout.section)
                seatInfo += ' Sect: ' + checkout.section;
            if(checkout.row)
                seatInfo += ' Row: ' + checkout.row;
            if(checkout.seat)
                seatInfo += ' Seat: ' + checkout.seat;
            seatInfo.length > 0 && call_name.push($.trim(seatInfo));
            phone && call_name.push(phone);
            return call_name;
        },
        /**
         * Used in {@link App.Collections.Myorders#submit_order_and_pay submit_order_and_pay()} method
         * to get a call name for 'Other' dining option.
         * @param {string} [phone] - phone number
         * @returns {Array} An array in which the first element is a string contaning dining options
         *                  and the second item is the passed phone number (optional).
         */
        getOtherDiningOptionCallName: function(phone) {
            var other_dining_options = this.checkout.get('other_dining_options'),
                call_name = [],
                seatInfo = '';
            other_dining_options.each(function(model){
                if (model.get('value')) {
                    seatInfo += ' ' + model.get('name') + ': ' + model.get('value');
                }
            });
            seatInfo.length > 0 && call_name.push($.trim(seatInfo));
            phone && call_name.push(phone);
            return call_name;
        },
        /**
         * @returns {Object}
         * ```
         * {
         *     call_name: [<contact name>, <pickup time>, <phone>],
         *     payment_info: {
         *         phone: <phone>,
         *         email: <email>,
         *         first_name: <first name>
         *         last_name: <last name>
         *     }
         * }
         * ```
         */
        getCustomerData: function() {
            var checkout = this.checkout.toJSON(),
                customer = App.Data.customer.toJSON(),
                first_name = Backbone.$.trim(customer.first_name),
                last_name = Backbone.$.trim(customer.last_name),
                contactName = first_name + ' ' + last_name,
                call_name = [],
                payment_info = {};

            contactName && call_name.push($.trim(contactName));

            checkout.pickupTime && call_name.push(checkout.pickupTime);
            if (customer.phone) {
                call_name.push(customer.phone);
            }

            if (customer.phone) {
                payment_info.phone = customer.phone;
            }
            if (customer.email) {
                payment_info.email = customer.email;
            }
            payment_info.first_name = first_name;
            payment_info.last_name = last_name;

            return {
                call_name: call_name,
                payment_info: payment_info
            };
        },
        /**
         * Makes array with recipients.
         * @returns {Array} Array contaning the object if email is specified:
         * [{
         *     skin: <skin>,
         *     type: 'email',
         *     destination: 'email'
         * }]
         *
         */
        getNotifications: function() {
            var checkout = this.checkout.toJSON(),
                customer = App.Data.customer.toJSON(),
                skin = App.Data.settings.get('skin');

            if (customer.email || checkout.email) {
                return [{
                    skin: skin,
                    type: 'email',
                    destination: customer.email || checkout.email
                }];
            }
        },
        /**
         * Resets the order.
         */
        empty_myorder: function() {
            this.remove(this.models);

            this.total.empty(); //this is for reliability cause of raunding errors exist.

            this.checkout.set({
                dining_option: 'DINING_OPTION_ONLINE',
                notes: '',
                discount_code: '',
                last_discount_code: ''
            });
        },
        /**
         * Removes free modifiers of each order item.
         */
        removeFreeModifiers: function() {
            this.each(function(item) {
                item.removeFreeModifiers();
            });
        },
        /**
         * @returns {boolean} `true` if dining option is shipping.
         */
        isShippingOrderType: function() {
            return this.checkout.get('dining_option') == 'DINING_OPTION_SHIPPING';
        },
        /**
         * Clears the order collection and orders items in a storage.
         */
        clearData: function() {
            this.empty_myorder();
            this.saveOrders();
        },
        /**
         * Saves payment response in a storage. Quantity of payment responses may be more than 1 per session.
         * Need use unique id for each. Composite key (`uid` + '.paymentResponse') is used.
         * @param {string} uid - Unique identificator
         */
        savePaymentResponse: function(uid) {
            if(typeof uid == 'string' && uid.length && this.paymentResponse) {
                setData(uid + '.paymentResponse', this.paymentResponse);
            }
        },
        /**
         * Restores payment response and removes it from a storage. Quantity of payment responses may be more than 1 per session.
         * Need use unique id for each. Composite key (`uid` + '.paymentResponse') is used.
         * @param {string} uid - Unique identificator
         */
        restorePaymentResponse: function(uid) {
            if(typeof uid != 'string' || !uid.length) {
                return;
            }
            uid = uid + '.paymentResponse';
            var paymentResponse = getData(uid);
            if(paymentResponse) {
                removeData(uid);
                return this.paymentResponse = paymentResponse;
            }
        },
        /**
         * Returns index of shipping address coressponding to the specified dining option.
         * @param   {string} dining_option - dining option.
         * @returns {number}
         *     - index of shipping address, if the specified dining option is delivery, shipping or catering;
         *     - {App.Models.customer.defaults.shipping_address} otherwise
         */
        getShippingAddress: function(dining_option) {
            var customer = App.Data.customer;

            if (!customer) {
                return;
            }

            var shipping_addresses = {
                DINING_OPTION_DELIVERY: customer.get('deliveryAddressIndex'),
                DINING_OPTION_SHIPPING: customer.get('shippingAddressIndex'),
                DINING_OPTION_CATERING: customer.get('cateringAddressIndex')
            };

            return shipping_addresses[dining_option] !== undefined ? shipping_addresses[dining_option] : customer.defaults.shipping_address;
        },
        /**
         * Returns customer address for sending to create_order_and_pay/.
         * @returns {object} address object.
         */
        getCustomerAddress: function() {
            return App.Data.customer.getOrderAddress();
        }
    });

    if (App.Data.devMode) {
        /*
        *   get combo child product (for debug)
        */
        App.Collections.Myorders.prototype.combo_child = function(product_index, product_set_index, child_index) {
            return this.models[product_index].combo_child(product_set_index, child_index);
        }
    }
});
