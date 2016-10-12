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
 * Contains {@link App.Models.Modifier}, {@link App.Collections.Modifiers},
 * {@link App.Models.ModifierBlock}, {@link App.Collections.ModifierBlocks} constructors.
 * @module modifiers
 * @requires module:backbone
 * @see {@link module:config.paths actual path}
 */
define(["backbone"], function(Backbone) {
    'use strict';

    /**
     * @class
     * @classdesc Represents a modifier model.
     * @alias App.Models.Modifier
     * @augments Backbone.Model
     * @example
     * // create a modifier model
     * require(['modifiers'], function() {
     *     var modifier = new App.Models.Modifier();
     * });
     */
    App.Models.Modifier = Backbone.Model.extend(
    /**
     * @lends App.Models.Modifier.prototype
     */
    {
        /**
         * Contains attributes with default values.
         * @type {object}
         * @enum {string}
         */
        defaults: {
            /**
             * Modifier ID.
             * @type {?number}
             */
            id: null,
            /**
             * Modifier name.
             * @type {?string}
             */
            name: null,
            /**
             * Modifier price.
             * @type {?number}
             */
            price: null,
            /**
             * The total amount (`price` * `quantity` * product quantity).
             * @type {?number}
             */
            sum: null,
            /**
             * Modifier is selected or not.
             * @type boolean
             */
            selected: false,
            /**
             * Modifier sort number.
             * @type {?number}
             */
            sort: null,
            /**
             * Modifier cost. It's used only for order sending.
             * @type {?number}
             */
            cost: null,
            /**
             * Path for relative URL of image.
             * @type {?string}
             */
            img: null,
            /**
             * Modifier quantity.
             * @type {?string}
             */
            quantity: 1,
            /**
             * Quantity type.
             * - 0 - full modifier
             * - 1 - first half
             * - 2 - second half
             * @type {number}
             */
            qty_type: 0,
            /**
             * Modifier description
             * @type {?string}
             */
            description: null,
            /**
             * An object literal with actual values of main attributes which affect reorder ability:
             * ```
             * {
             *    active: <boolean>,
             *    cost: <string>,
             *    price: <number>
             * }
             * ```
             * It exists only if the modifiers belongs to an order item in past orders.
             * It's null for usual modifier.
             * @type {?object}
             * @default null
             */
            actual_data: null,
            /**
             * Indicates whether a modifier item can be splitted
             * @type {boolean}
             * @default false
             */
            split: false
        },
        /**
         * Sets `img` value as App.Data.settings.get('img_path').
         * Controls the modifier splitting ability.
         */
        initialize: function() {
            this.set('img', App.Data.settings.get('img_path'));
            this.controlSplitAbility();
            this.listenTo(this, 'change:qty_type', this.controlSplitAbility);
        },
        /**
         * Sets attributes using `data` object.
         * @param {Object} data - JSON representation of the model's attributes.
         * @returns {App.Models.Modifier} The model.
         */
        addJSON: function(data) {
            this.set(data);
            return this;
        },
        /**
         * Deeply clone the model.
         * @returns {App.Models.Modifier} Cloned model.
         */
        clone: function() {
            var newModifier = new App.Models.Modifier();
            for (var key in this.attributes) {
                var value = this.get(key);
                if (value && value.clone) { value = value.clone(); }
                newModifier.set(key, value, {silent: true });
            }
            return newModifier;
        },
        /**
         * Updates the model's attributes using corresponding attributes values of `newModifier`.
         * @param {App.Models.Modifier} newModifier - instance of {@link App.Models.Modifier}
         * @returns {App.Models.Modifier} The model.
         */
        update: function(newModifier) {
            for (var key in newModifier.attributes) {
                var value = newModifier.get(key);
                if (value && value.update) { this.get(key).update(value); }
                else { this.set(key, value, {silent: true}); }
            }
            return this;
        },
        /**
         * Updates `sum` attributes. New value is calculated
         * as 'modifier price' * 'modifier quantity' * 'quantity type coef (1 or 0.5)' * 'product quantity'.
         * @param  {number} multiplier - a product quantity
         */
        updateSum: function(multiplier) {
            var price = this.get('free_amount') != undefined ? this.get('free_amount') : this.getSum();
            this.set('sum', price * multiplier);
        },
        /**
         * @returns {Object} If the modifier is selected, returns the following object:
         * ```
         * {
         *     modifier: <id>,
         *     modifier_cost: <cost>,
         *     modifier_price: <price>,
         *     free_mod_price: <free mod price>,
         *     max_price_amount: <max price amount>,
         *     qty: <quantity>,
         *     qty_type: <quantity type>
         * }
         * ```
         */
        modifiers_submit: function() {
            if (this.get('selected')) {
                return {
                    modifier: this.get('id'),
                    modifier_cost: (this.get('cost') === null) ? 0 : this.get('cost'),
                    modifier_price: this.get('price') * 1,
                    free_mod_price: this.isFree() ? this.get('free_amount') : undefined,
                    max_price_amount: this.isMaxPriceFree() ? this.get('max_price_amount') : undefined,
                    qty: this.get('quantity'),
                    qty_type: this.get('qty_type')
                };
            }
        },
        /**
         * Updates `max_price_amount` attribute due to "Max Price" feature
         * (if total modifier amount is over "max price" then "max price" value overrides total amount).
         * If `price` > `max_price` the method sets `max_price` as value of `max_price_amount` attribute.
         * Otherwise unsets `max_price_amount` attribute.
         * @param {number} max_price - max value for total modifier amount
         * @returns {number} `0` If `price` > `max_price`, otherwise difference `max_price` - `price`.
         */
        update_prices: function(max_price) {
            var price = this.get('free_amount') != undefined ? this.get('free_amount') : this.getSum();
            if (price > max_price ) {
                this.set('max_price_amount', max_price);//modifier price with feature max price 6137
            } else {
                this.unset('max_price_amount');
            }
            return max_price > price ? max_price - price : 0;
        },
        /**
         * @returns {boolean} `true` if `free_amount` attribute is specified.
         */
        isFree: function() {
            return typeof this.get('free_amount') != 'undefined';
        },
        /**
         * @see {@link App.Models.Modifier#update_prices max_price_amount} attribute
         * @returns {boolean} `true` if `max_price_amount` is specified.
         */
        isMaxPriceFree: function() {
            return typeof this.get('max_price_amount') != 'undefined';
        },
        /**
         * Unsets `free_amount` attribute.
         */
        removeFreeModifier: function() {
            this.set('free_amount', undefined);
        },
        /**
         * @returns {number} If `qty_type` is `0` (full) returns `1`. Otherwise, returns `0.5`.
         */
        half_price_koeff: function() {
            //half or full item price for split modifiers
            return this.get('qty_type') > 0 ? 0.5 : 1;
        },
        /**
         * @returns {number} Total amount of the modifier. It's calculated as `price` \* `quantity` \* 'quantity type coefficient'.
         */
        getSum: function() {
            return this.get('price') * this.get('quantity') * this.half_price_koeff();
        },
        /**
         * Updates modifier to actual state checking reorder changes.
         * The modifier may change after order placement.
         * Need to find out changed attributes and apply actual values to them.
         * @returns {Array} Array containing attributes changed from order placement.
         */
        reorder: function() {
            var changes = [],
                actual_data = this.get('actual_data');

            if (!_.isObject(actual_data)) {
                return changes;
            }

            // check price
            if (this.get('price') !== actual_data.price) {
                this.set('price', actual_data.price);
                this.trigger('change:selected', this, this.get('selected')); // emulates modifier selection with new price
                changes.push('price');
            }

            // if modifier is inactive right now
            // need to remove it from collection
            if (!actual_data.active && this.collection) {
                changes.push('active');
                this.collection.remove(this);
            }

            return changes;
        },
        /**
         * Checks the ability to split the modifier.
         * If the modifier splitting is disallowed need to change `qty_type` to default value (full modifier).
         */
        controlSplitAbility: function() {
            if (!this.get('split')) {
                this.set('qty_type', this.defaults.qty_type);
            }
        }
    });

    /**
     * @class
     * @classdesc Represents a modifiers collection.
     * @alias App.Collections.Modifiers
     * @augments Backbone.Collection
     * @example
     * // create a modifiers collection
     * require(['modifiers'], function() {
     *     var modifiers = new App.Collections.Modifiers();
     * });
     */
    App.Collections.Modifiers = Backbone.Collection.extend(
    /**
     * @lends App.Collections.Modifiers.prototype
     */
    {
        /**
         * Item constructor.
         * @type {Function}
         * @default {@link App.Models.Modifier}
         */
        model: App.Models.Modifier,
        /**
         * Used for items comparing by sorting.
         * @type {Function}
         */
        comparator: function(model) {
            return model.get('sort');
        },
        /**
         * Indicates whether a modifier item can be splitted
         * @type {boolean}
         * @default false
         */
        split: false,
        /**
         * Adds new items.
         * @param {Array} data - JSON representation of items
         * @returns {App.Collections.Modifiers} The collection.
         */
        addJSON: function(data) {
            var self = this;
            Array.isArray(data) && data.forEach(function(element) {
                var modifier = new App.Models.Modifier({split: self.split});
                modifier.addJSON(element);
                self.add(modifier);
            });
            return this;
        },
        /**
         * Deeply clones the collection.
         * @returns {App.Collections.Modifiers} Cloned collection.
         */
        clone: function() {
            var newModifiers = new App.Collections.Modifiers();
            newModifiers.split = this.split;
            this.each(function(modifier) {
               newModifiers.add(modifier.clone()) ;
            });
            return newModifiers;
        },
        /**
         * Updates items using values of `newModifiers` items.
         * @param {App.Collections.Modifiers} newModifiers - {@link App.Collections.Modifiers} instance
         * @returns {App.Collections.Modifiers} The collection.
         */
        update: function(newModifiers) {
            var self = this;
            this.split = newModifiers.split;
            newModifiers.each(function(modifier) {
                var oldModifier = self.get(modifier);
                if (oldModifier) {
                    oldModifier.update(modifier);
                } else {
                    self.add(modifier.clone());
                }
            });
            return this;
        },
        /**
         * Deselects selected items.
         */
        reset_checked: function() {
            this.where({selected: true}).map(function(el) { el.set('selected', false) });
        },
        /**
         * @returns {number} Total modifiers sum.
         */
        get_sum: function() {
            var sum = 0;
            this.where({selected: true}).forEach(function(modifier) {
                var free_amount = modifier.get('free_amount'),
                    max_price_amount = modifier.get('max_price_amount'),
                    price = modifier.getSum();

                sum += modifier.isMaxPriceFree() ? max_price_amount :
                                (modifier.isFree() ? free_amount : price);
            });
            return sum;
        },
        /**
         * @returns {number} Quantity of selected items.
         */
        get_selected_qty: function() {
            var qty = 0;
            this.where({selected: true}).forEach(function(modifier) {
                qty += modifier.get("quantity") * modifier.half_price_koeff();
            });
            return qty;
        },
        /**
         * @returns {Array} An array. Each item is result of {@link App.Models.Modifier#modifiers_submit item.modifiers_submit()} call.
         */
        modifiers_submit: function() {
            var modifiers = [];
            this.each(function(modifier) {
                var res = modifier.modifiers_submit();
                res && modifiers.push(res);
            });
            return modifiers;
        },
        /**
         * Applies `max_price` to items.
         *
         * "Max Price" feature: if total modifier amount is over "max price" then "max price" value overrides total amount.
         *
         * @param {number} max_price - Max value for total modifiers sum.
         * @returns {number} Rest of `max_price` after application to all items.
         */
        update_prices: function(max_price) {
            this.where({selected: true}).forEach(function(el) {
                max_price = el.update_prices(max_price);
            });
            return max_price;
        },
        /**
         * Unsets `free_amount` attribute for all items.
         */
        removeFreeModifiers: function() {
            this.each(function(modifier) {
                modifier.removeFreeModifier();
            });
        },
        /**
         * Checks changes in modifiers to make reorder.
         * @param {number} amount_free - amount free.
         * @param {boolean} isPrice - indicates whether amount free is dollars
         * @returns {Array} Array of attributes changed from order placement.
         */
        reorder: function(amount_free, isPrice) {
            var changes = [],
                self = this;

            this.where({selected: true}).forEach(function(modifier) {
                var price = modifier.get('price'),   // should be before reorder() call
                    result = modifier.reorder(),
                    free_remain;

                if (result.indexOf('active') > -1) {
                    changes.push('active');
                }

                if (result.indexOf('price') > -1) {
                    amount_free -= isPrice ? modifier.get('actual_data').price : 1;
                    free_remain = amount_free >= 0 ? 0 : isPrice ? Math.abs(amount_free) : undefined;
                    if(free_remain !== price)
                        changes.push('price');
                }
            });

            return changes;
        }
    });

    /**
     * @class
     * @classdesc Represents a product modifiers class model.
     * @alias App.Models.ModifierBlock
     * @augments Backbone.Model
     * @example
     * // create a product modifiers
     * require(['modifiers'], function() {
     *     var modifierClass = new App.Models.ModifierBlock();
     * });
     */
    App.Models.ModifierBlock = Backbone.Model.extend(
    /**
     * @lends App.Models.ModifierBlock.prototype
     */
    {
        /**
         * Contains attributes with default values.
         * @member
         * @type {Object}
         * @property {?number} id=null - product modifier class id
         * @property {?number} sort=null - sort number
         * @property {App.Collections.Modifiers} modifiers - collection of modifier items
         * @property {string} name='' - modifiers class name
         * @property {string} mod='' - modifiers class mode
         * @property {string} img='' - path for relative image url
         * @property {string} modifier_type='modifier_multiple' - modifiers class type
         * @property {?number} lock_amount=null - max number of items that can be selected
         * @property {boolean} lock_enable=false - enables the ability to limit max number of items
         *                                         that can be selected
         * @property {?number} amount_free=null - number of selected items that are considered as free
         * @property {boolean} admin_modifier=false - the modifiers class is admin or not
         * @property {string} admin_mod_key='' - admin mode key:
         * - 'SIZE' - a modifiers item price overrides a product price.
         * - 'SPECIAL' - order item instruction.
         * - 'DISCOUNT' - modifiers class is considered as discount.
         * @property {boolean} amount_free_is_dollars=false - type of free modifiers:
         * - `true` - 'Price' type.
         * - `false` - 'Quantity' type.
         * @property {Array} amount_free_selected=[] - array of modifiers that are considered as free
         * @property {boolean} ignore_free_modifiers=false - disables 'Free Modifiers' feature,
         * @property {boolean} split - indicates whether a modifier item can be splitted
         */
        defaults: function() {
            return {
                id: null,
                sort: null,
                modifiers: new App.Collections.Modifiers(),
                name: "",
                mod: "",
                img: App.Data.settings.get("img_path"),
                modifier_type: "modifier_multiple",
                lock_amount: null,
                lock_enable: false,
                amount_free: null,
                admin_modifier: false,
                admin_mod_key: "",
                amount_free_is_dollars: false, // true - 'Price', false - 'Quantity', receive from server
                amount_free_selected: [],
                ignore_free_modifiers: false,
                forced: false,
                split: false
            };
        },
        /**
         * Inits handlers for free modifiers.
         */
        initialize: function() {
            this.listenTo(this, 'change:modifiers', this.onModifiersChange);

            this.set({
                amount_free_selected: []
            });

            this.checkAmountFree();
        },
        /**
         * Handles `modifiers` attribute change.
         * @param {App.Models.ModifierBlock} model - the model
         */
        onModifiersChange: function(model) {
            var prevModifiers = model.previousAttributes().modifiers;
            prevModifiers instanceof Backbone.Collection && this.stopListening(prevModifiers);
            if (!App.Data.loadFromLocalStorage) {
                this.set('amount_free_selected', []);
                this.initFreeModifiers();
                this.listenToModifiers();
            }
        },
        /**
         * Sets attributes values using `data` object. Converts `data.modifiers` array to {@link App.Collections.Modifiers}.
         * @param {Object} data - JSON representation of modifiers class
         * @returns {App.Models.ModifierBlock} The modifiers class.
         */
        addJSON: function(data) {
            data.forced = data.minimum_amount > 0 ? true : false;
            this.set(data);
            var modifiers = new App.Collections.Modifiers();
            modifiers.split = this.get('split');
            modifiers.addJSON(data.modifier || data.modifiers);
            this.set('modifiers', modifiers);
            this.checkAmountFree();
            return this;
        },
        /**
         * Deeply clones the modifiers class.
         * @returns {App.Models.ModifierBlock} Cloned modifiers class.
         */
        clone: function() {
            var newBlock = new App.Models.ModifierBlock(),
                amount_free_selected;

            newBlock.stopListening(newBlock.get('modifiers'));
            for (var key in this.attributes) {
                var value = this.get(key);
                if (value && value.clone) { value = value.clone(); }
                newBlock.set(key, value, {silent: true });
            }

            if(newBlock.get('amount_free_selected').length == 0)
                newBlock.initFreeModifiers();
            else
                newBlock.restoreFreeModifiers();

            newBlock.listenToModifiers();

            return newBlock;
        },
        /**
         * Updates the modifiers class.
         * @param {App.Models.ModifierBlock} newBlock - instance of App.Models.ModifierBlock.
         */
        update: function(newBlock) {
            for (var key in newBlock.attributes) {
                var value = newBlock.get(key);
                if (value && value.update) { this.get(key).update(value); }
                else { this.set(key, value, {silent: true}); }
            }
        },
        /*
         * Deselects items.
         */
        reset_checked: function() {
            this.get('modifiers').reset_checked();
        },
        /**
         * @returns {number} Total amount of selected items. If the modifiers class has 'SIZE' or 'SPECIAL' value of `admin_mod_key`
         *                   attribute then returns `0`.
         */
        get_sum: function() {
            if(this.get('admin_modifier') && (this.get('admin_mod_key') === 'SIZE' || this.get('admin_mod_key') === 'SPECIAL')) {
                return 0;
            } else {
                return this.get('modifiers').get_sum();
            }
        },
        /**
         * @returns {Array} Result of {@link App.Collections.Modifiers#modifiers_submit modifiers.modifiers_submit()} call.
         *                  If `admin_mod_key` is 'SPECIAL' returns `[]`.
         */
        modifiers_submit: function() {
            // selected special modifiers add to special_request
            if(this.isSpecial()) {
                return [];
            }

            var self = this,
                modifiers = this.get('modifiers').modifiers_submit();

            modifiers.forEach(function(model) {
                model.admin_mod_key = self.get("admin_mod_key");
            });
            return modifiers;
        },
        /**
         * @returns {boolean} `true` if the modifiers class is admin and `admin_mod_key` is 'SPECIAL'.
         */
        isSpecial: function() {
            return this.get('admin_modifier') && this.get('admin_mod_key') === 'SPECIAL';
        },
        /**
         * @returns {boolean} `true` if the modifiers class is admin and `admin_mod_key` is 'SIZE'.
         */
        isSize: function() {
            return this.get('admin_modifier') && this.get('admin_mod_key') === 'SIZE';
        },
        /**
         * Updates price of items due to "Max Price" feature.
         * @param {number} max_price - max price for all selected modifiers.
         * @returns {number} Rest of max price after application to selected items.
         *                   Max price doesn't apply to 'SPECIAL', 'SIZE' modifiers class.
         */
        update_prices: function(max_price) {
            if (this.isSpecial() || this.isSize()) {
                return max_price;
            } else {
                return this.get('modifiers').update_prices(max_price);
            }
        },
        /**
         * Updates selected items that are considered as free.
         * @param {App.Models.Modifier} model - modifiers item.
         */
        update_free: function(model) {
            if(this.get('ignore_free_modifiers'))
                return;

            var isPrice = this.get('amount_free_is_dollars'),
                isAdmin = this.get('admin_modifier'),
                amount = this.get('amount_free'),
                selected = this.get('amount_free_selected'),
                needAdd = model.get('selected'),
                changed = false;
            var model_selected = selected.find(function(m){ return m.get('id') == model.get('id') }),
                index = selected.indexOf(model_selected);

            // if it is admin_modifier amount_free functionality should be ignored
            if(isAdmin) {
                return;
            }

            // add modifier to free selected
            if(amount && needAdd) {
                selected.push(model);
                changed = true;
            }

            // remove modifier from free selected
            if(!needAdd && index > -1) {
                selected.splice(index, 1);
                model.set('free_amount', undefined);
                changed = true;
            }

            if(!changed) {
                return;
            }

            if(isPrice) {
                this.update_free_price(model);
            }
            else {
                this.update_free_quantity(model);
            }

            this.set('amount_free_selected', selected);
        },
        /**
         * Updates free items.
         * @param {App.Models.Modifier} model - modifiers item
         */
        update_free_quantity_change: function(model) {
            if (this.get('ignore_free_modifiers')) {
                return;
            }

            var isPrice = this.get('amount_free_is_dollars'),
                isAdmin = this.get('admin_modifier');
            // if it is admin_modifier amount_free functionality should be ignored
            if (isAdmin) {
                return;
            }

            isPrice ? this.update_free_price(model) : this.update_free_quantity(model);
        },
        /**
         * Updates free items.
         * @param {App.Models.Modifier} model - modifiers item
         */
        update_free_quantity: function(model) {
            var free_qty_amount = this.get('amount_free'),
                selected = this.get('amount_free_selected');

            var qty, delta,
                qty_total = 0;
            selected.forEach(function(model, index) {
                qty = model.get("quantity") * model.half_price_koeff();
                qty_total += qty;

                if (qty_total <= free_qty_amount) {
                    model.set('free_amount', 0);
                }
                else {
                    delta = qty_total - free_qty_amount;
                    if (delta.toFixed(1)*1 < qty) {
                        model.set('free_amount', round_monetary_currency(delta * model.get('price'))*1 );
                    }
                    else {
                        model.set('free_amount', undefined);
                    }
                }
            });
        },
        /**
         * Updates free items.
         * @param {App.Models.Modifier} model - modifiers item
         */
        update_free_price: function(model) {
            var amount = this.get('amount_free'),
                selected = this.get('amount_free_selected');

            selected.forEach(function(model) {
                var price = model.get('price'),
                    mdf_price_sum = model.getSum();

                if(amount == 0)
                    return model.set('free_amount', undefined);

                if(amount < mdf_price_sum) {
                    model.set('free_amount', round_monetary_currency(mdf_price_sum - amount)*1);
                    amount = 0;
                } else {
                    model.set('free_amount', 0);
                    amount = round_monetary_currency(amount - mdf_price_sum);
                }
            });
        },
        /**
         * Inits free modifiers.
         */
        initFreeModifiers: function() {
            if(this.get('ignore_free_modifiers'))
                return;

            var modifiers = this.get('modifiers'),
                selected = this.get('amount_free_selected');

            modifiers instanceof Backbone.Collection && modifiers.where({selected: true}).forEach(function(modifier) {
                if(selected.indexOf(modifier) == -1)
                    this.update_free(modifier);
            }, this);
        },
        /**
         * Restores free modifiers.
         */
        restoreFreeModifiers: function() {
            if(this.get('ignore_free_modifiers'))
                return;

            var amount_free_selected = this.get('amount_free_selected'),
                restored = [];
            amount_free_selected.forEach(function(modifier, index) {
                var copiedModifier = this.get('modifiers').where({id: modifier.id, selected: true}); //modifier.get('id')
                if(copiedModifier.length && copiedModifier[0])
                    restored.push(copiedModifier[0]);
            }, this);
            this.set('amount_free_selected', restored);
        },
        /**
         * Adds listeners to `modifiers`.
         */
        listenToModifiers: function() {
            var modifiers = this.get('modifiers');

            if(!(modifiers instanceof Backbone.Collection))
                return;

            this.listenTo(modifiers, 'change:selected', cb, this);
            this.listenTo(modifiers, 'add', this.initFreeModifiers, this);

            function cb(model, opts) {
                this.update_free(model);
                this.trigger('change', this, _.extend({modifier: model}, opts));
            }

            this.listenTo(modifiers, 'change:quantity', cb2, this);
            this.listenTo(modifiers, 'change:qty_type', cb2, this);
            function cb2(model, opts) {
                this.update_free_quantity_change(model);
                this.trigger('change', this, _.extend({modifier: model}, opts));
            }
        },
        /**
         * Validates `amount_free` changing negative values to `0`.
         */
        checkAmountFree: function() {
            if(this.get('amount_free') < 0)
                this.set('amount_free', 0);
        },
        /**
         * Removes free modifiers.
         */
        removeFreeModifiers: function() {
            var modifiers = this.get('modifiers');
                modifiers && modifiers.removeFreeModifiers();
            this.set('amount_free_selected', []);
        },
        /**
         * Checks modifiers before make reorder.
         * @returns {Array} Result of {@link App.Collections.Modifiers#reorder} applied to `modifiers`.
         */
        reorder: function() {
            return this.get('modifiers').reorder(this.get('amount_free'), this.get('amount_free_is_dollars'));
        },
        /**
         * Changes `ignore_free_modifiers` to false and resets `amount_free_selected`.
         * Used in reorder.
         */
        enableFreeModifiers: function() {
            this.set({
                ignore_free_modifiers: false,
                amount_free_selected: []
            });
            this.initFreeModifiers();
        }
    });

    /**
     * @class
     * @classdesc Represents a collection of modifiers classes.
     * @alias App.Collections.ModifierBlocks
     * @augments Backbone.Collection
     * @example
     * // create a modifiers collection
     * require(['modifiers'], function() {
     *     var modifiersClasses = new App.Collections.ModifierBlocks();
     * });
     */
    App.Collections.ModifierBlocks = Backbone.Collection.extend(
    /**
     * @lends App.Collections.ModifierBlocks.prototype
     */
    {
        /**
         * Item constructor.
         * @type {Function}
         * @default {@link App.Models.ModifierBlock}
         */
        model: App.Models.ModifierBlock,
        /**
         * Used for items comparing by sorting.
         * @type {Function}
         */
        comparator: function(model) {
            return model.get('sort');
        },
        /**
         * Propagates events of items to itself.
         */
        initialize: function() {
            this.listenTo(this, 'change', function(model, opts) {
                var isSizeSelection = opts
                        && opts.modifier instanceof App.Models.Modifier
                        && opts.modifier.get('selected')
                        && model instanceof App.Models.ModifierBlock
                        && model.get('admin_mod_key') === 'SIZE'
                        && model.get('admin_modifier'),
                    isSpecialSelection = opts
                        && opts.modifier instanceof App.Models.Modifier
                        && opts.modifier.get('selected')
                        && model instanceof App.Models.ModifierBlock
                        && model.get('admin_mod_key') === 'SPECIAL'
                        && model.get('admin_modifier');

                if (isSpecialSelection) {
                    this.trigger('modifiers_special');
                } else if (isSizeSelection) {
                    this.trigger('modifiers_size', this.getSizeModel().get('price'));
                    this.trigger('modifiers_changed');
                } else {
                    this.trigger('modifiers_changed');
                }
            }, this);
        },
        /**
         * Update price of items due to "Max Price" feature.
         * @param {number} max_price - max price for all items.
         * @returns {number} Rest of max price after application to items.
         */
        update_prices: function(max_price) {
            this.each(function(el) {
                max_price = el.update_prices(max_price);
            });
            return max_price;
        },
        /**
         * Updates items using object literal as new data source.
         * @param {Array} data - JSON representation of items
         * @returns {App.Collections.ModifierBlocks} The collection.
         */
        addJSON: function(data) {
            var self = this;
            data && data.forEach(function(element) {
                var modifierBlock = new App.Models.ModifierBlock();
                modifierBlock.addJSON(element);
                self.add(modifierBlock);
            });
            this.create_quick_modifiers_section(App.Data.quickModifiers);
            return this;
        },
        /**
         * Deeply clones items.
         * @returns {App.Models.ModifierBlock} Cloned collection.
         */
        clone: function() {
            var newBlock = new App.Collections.ModifierBlocks();
            this.each(function(modifierBlock) {
               newBlock.add(modifierBlock.clone()) ;
            });
            return newBlock;
        },
        /**
         * Updates items using instance of {@link App.Collections.ModifierBlocks} as new data source.
         * @param {App.Models.ModifierBlock} newModel - instance of {@link App.Collections.ModifierBlocks}.
         */
        update: function(newModel) {
            var self = this;
            newModel.each(function(modifierBlock) {
                var oldModifierBlock = self.get(modifierBlock);
                if (oldModifierBlock) {
                    oldModifierBlock.update(modifierBlock);
                } else {
                    self.add(modifierBlock.clone());
                }
            });
            return this;
        },
        /**
         * Gets modifiers classes specified by a product from backend. Used request parameters are:
         * ```
         * url: "/weborders/modifiers/",
         * data: {
         *     product: <product id>
         * }
         * type: 'GET',
         * dataType: "json"
         * ```
         * @returns {Object} Deferred object.
         */
        get_modifiers: function(id_product) {
            var self = this,
                fetching = new $.Deferred(); // Pointer that all data loaded

            $.ajax({
                url: App.Data.settings.get("host") + "/weborders/modifiers/",
                data: {
                    product: id_product
                },
                dataType: "json",
                successResp: function(modifierBlocks) {
                    modifierBlocks.forEach(function(modifierBlock) {
                        // need to exclude DISCOUNT modifierBlock
                        modifierBlock.admin_mod_key != "DISCOUNT" && self.add(new App.Models.ModifierBlock().addJSON(modifierBlock));
                    });
                    //add the new block 'Quick Modifiers' (will be contain all quick modifiers):
                    self.create_quick_modifiers_section(App.Data.quickModifiers);
                    fetching.resolve();
                },
                error: function() {
                    App.Data.errors.alert(MSG.ERROR_MODIFIERS_LOAD, true); // user notification
                }
            });

            return fetching;
        },
        /**
         * Creates a modifiers class to group all quick modifiers together which are not included in the product's modifiers classes.
         * @param {App.Collections.ModifierBlocks} quickModifiers - quick modifiers classes
         */
        create_quick_modifiers_section: function(quickModifiers) {
            if(!(quickModifiers instanceof App.Collections.ModifierBlocks)) {
                return;
            }

            var modifierBlock = {
                sort: 10000, //set to the end of the modifiers list
                active: true,
                modifier_class_id: -1, //useless for Quick Modifiers
                name: "Quick Modifiers",
                id: -1 //id should be set for that ModifierBlocks.update() function works fine for the collection containing quick modifiers
            };

            var self = this,
                is_quick_modifiers = false,
                qmBlock = new App.Models.ModifierBlock().addJSON(modifierBlock);

            quickModifiers.forEach(function(modifierBlock) {
                var modifiers = modifierBlock.get("modifiers");

                modifiers.forEach(function(modifier) {
                    if (!self.find_modifier(modifier.id)) {
                        var m = modifier.clone();
                        qmBlock.get('modifiers').add(m);
                        is_quick_modifiers = true;
                    }
                });
            });

            if (is_quick_modifiers)
                self.add(qmBlock);
        },
        /**
         * Finds modifiers class by id.
         * @param {number} modifier_id - modifiers class id
         * @returns {App.Models.ModifierBlock} Found modifiers class.
         */
        find_modifier: function(modifier_id) {
            var obj;
            this.find(function(modifierBlock) {
                var modifiers = modifierBlock.get("modifiers");
                obj = modifiers.get(modifier_id);
                return obj ? true : false;
            });
            return obj;
        },
         /**
         * Gets quick modifiers from server. Used request parameters are:
         * ```
         * url: "/weborders/modifiers/",
         * data: {
         *     establishment: App.Data.settings.get("establishment")
         * },
         * dataType: "json",
         * type: "GET"
         * @returns {Object} Deferred object.
         * ```
         */
        get_quick_modifiers: function() {
            var self = this,
                fetching = new $.Deferred(); // Pointer that all data loaded

            $.ajax({
                url: App.Data.settings.get("host") + "/weborders/modifiers/",
                data: {
                    establishment: App.Data.settings.get("establishment")
                },
                dataType: "json",
                successResp: function(modifierBlocks) {
                    modifierBlocks.forEach(function(modifierBlock) {
                        // need to exclude DISCOUNT modifierBlock
                        modifierBlock.admin_mod_key != "DISCOUNT" && self.add(new App.Models.ModifierBlock().addJSON(modifierBlock));
                    });

                    fetching.resolve();
                },
                error: function() {
                    App.Data.errors.alert(MSG.ERROR_MODIFIERS_LOAD, true); // user notification
                }
            });

            return fetching;
        },
        /**
         * @returns {Array} List of modifiers. Modifiers from 'SIZE', 'SPECIAL' classes are excluded.
         */
        get_modifierList: function() {
            if (!this.list || this.list && this.list.length === 0) {
                var list = [];
                this.each(function(model) {
                    if (model.get('admin_mod_key') !== 'SIZE' && model.get('admin_mod_key') !== 'SPECIAL') {
                        model.get('modifiers').each(function(model) {
                            list.push(model);
                        });
                    }
                });
                this.list = list;
            }
            return this.list;
        },
        /**
         * Finds a first selected 'SIZE' modifier.
         * @returns {App.Models.Modifier} One of the following results:
         * - Found modifier.
         * - `null` - size modifiers class doens't have selected items.
         * - `undefined` - size modifiers class doens't exists in the collection.
         */
        getSizeModel: function() {
            var block = this.where({admin_modifier: true, admin_mod_key: 'SIZE'});
            if (block.length !== 0) {
                var modifier = block[0].get('modifiers').where({selected: true});
                if (modifier.length !== 0) {
                    return modifier[0];
                } else {
                    return null;
                }
            } else {
                return undefined;
            }
        },
        /**
         * @returns {Array} Selected items of 'Special' modifiers class.
         */
        get_special: function() {
            var special = [];
            var specialBlock = this.where({ 'admin_mod_key': 'SPECIAL' });
            if (specialBlock && specialBlock.length > 0) {
        		special = specialBlock[0].get('modifiers').where({selected: true});
            }
            return special;
        },
        /**
         * @returns {string} Names of selected special modifiers concatenated via ','.
         */
        get_special_text: function() {
            return this.get_special().map(function(model) { return model.get('name'); }).join(",");
        },
        /**
         * Checks quantity of selected items for modifiers classes that have a limit for minimum selected items.
         * @returns {(boolean|Array)} `true` if selected items quantity of each modifiers class is more than `minimum_amount` value.
         *                            Otherwise, returns array of modifiers classes in which that condition is false.
         */
        checkForced: function() {
            var unselected = this.where({forced: true}).filter(function(modifierBlock) {
                var minimumAmount = modifierBlock.get('minimum_amount'),
                    qty = modifierBlock.get('modifiers').get_selected_qty();

                return qty >= minimumAmount ? false : true;
            });

            return unselected.length > 0 ? unselected : true;
        },
        /**
         * Checks quantity of selected items for modifiers classes that have a limit for maximum selected items.
         * @returns {(boolean|Array)} `true` if selected items quantity of each modifiers class is less than `maximum_amount` value.
         *                            Otherwise, returns array of modifiers classes in which that condition is false.
         */
        checkAmount: function() {
            var exceeded = this.filter(function(modifierBlock) {
                var maxAmount = modifierBlock.get('maximum_amount');

                if (!maxAmount) {
                    return false;
                }

                var qty = modifierBlock.get('modifiers').get_selected_qty();
                return qty > maxAmount ? true : false;
            });

            return exceeded.length > 0 ? exceeded : true;
        },
        /**
         * Deselects all special modifiers.
         */
        uncheck_special: function(special_text) {
            var special = this.get_special();
            if (special[0] && special[0].get('name') !== special_text) {
                special.map(function(model) { model.set({selected: false}, {silent: true}); });
            }
        },
        /**
         * @returns {number} Total amount of all modifiers classes.
         */
        get_sum: function() {
            var sum = 0;
            this.each(function(modifierBlock) {
                sum += modifierBlock.get_sum();
            });

            return sum;
        },
        /**
         * @returns {Array} JSON representation of modifiers classes.
         */
        modifiers_submit: function() {
            var modifiers = [];
            this.each(function(modifierBlock) {
                modifiers = modifiers.concat(modifierBlock.modifiers_submit());
            });
            return modifiers;
        },
        /**
         * Unsets `amount_free` attribute of all modifiers.
         */
        removeFreeModifiers: function() {
            this.each(function(modifierBlock) {
                modifierBlock.removeFreeModifiers();
            });
        },
        /**
         * Checks modifiers before make reorder.
         * @returns {Array} Array of attributes changed from order placement.
         */
        reorder: function () {
            return this.reduce(function(changes, modifierBlock) {
                return changes.concat(modifierBlock.reorder());
            }, []);
        },
        /**
         * Calls {@link App.Models.ModifierBlock#enableFreeModifiers enableFreeModifiers()} method for each item.
         * Used in reorder.
         */
        enableFreeModifiers: function() {
            this.invoke('enableFreeModifiers');
        }
    });

    /**
     * Loads all modifiers for specified product.
     * @static
     * @alias App.Collections.ModifierBlocks.init
     * @param {number} id_product - product id.
     * @returns {Object} Deferred object.
     */
    App.Collections.ModifierBlocks.init = function(id_product) {
        var modifier_load;

        if (App.Data.modifiers[id_product] === undefined ) {
            App.Data.modifiers[id_product] = new App.Collections.ModifierBlocks;
            modifier_load = App.Data.modifiers[id_product].get_modifiers(id_product);
        } else {
            modifier_load = Backbone.$.Deferred().resolve();
        }

        return modifier_load;
    };

    /**
     * Loads all quick modifiers.
     * @static
     * @alias App.Collections.ModifierBlocks.init_quick_modifiers
     * @returns {Object} Deferred object.
     */
    App.Collections.ModifierBlocks.init_quick_modifiers = function() {
        var fetching;

        if (App.Data.quickModifiers === undefined) {
            App.Data.quickModifiers = new App.Collections.ModifierBlocks;
            fetching = App.Data.quickModifiers.get_quick_modifiers();
        } else {
            fetching = Backbone.$.Deferred().resolve();
        }

        return fetching;
    };
});