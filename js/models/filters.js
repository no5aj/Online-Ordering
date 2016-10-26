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
 * Contains {@link App.Models.FilterItem}, {@link App.Collections.FilterItems},
 * {@link App.Models.Filter}, {@link App.Collections.Filters} constructors.
 * @module filters
 * @requires module:backbone
 * @see {@link module:config.paths actual path}
 */
define(['backbone'], function() {
    'use strict';

    /**
     * @class
     * @classdesc Represents a filter item.
     * @alias App.Models.FilterItem
     * @augments Backbone.Model
     * @example
     * // create filter item model
     * require(['filters'], function() {
     *     var filterItem = new App.Models.FilterItem({name: '1 mile', value: 1});
     * });
     */
    App.Models.FilterItem = Backbone.Model.extend(
    /**
     * @lends App.Models.FilterItem.prototype
     */
    {
        /**
         * Contains attributes with default values.
         * @type {object}
         * @enum {string}
         */
        defaults: {
            /**
             * A state of the filter item.
             * @type {boolean}
             */
            selected: false,
            /**
             * A value of the filter item. It is used as pattern for comparing.
             * @type {*}
             */
            value: null,
            /**
             * Filter item name.
             * @type {string}
             */
            title: '',
            /**
             * An unique filter id that uses for saving data in a storage.
             * @type {*}
             */
            uid: null
        },
        /**
         * Restores attributes values from a storage.
         * Adds listener on `change:selected` event to track any user action and save it in a storage.
         */
        initialize: function() {
            this.loadData();
            this.listenTo(this, 'change:selected', this.saveData, this);
            Backbone.Model.prototype.initialize.apply(this, arguments);
        },
        /**
         * Saves attributes values in a storage. 'filter.%uid%' key is used.
         */
        saveData: function() {
            setData('filter.' + this.get('uid'), this, true);
        },
        /**
         * Restores data from a storage. 'filter.%uid%' key is used.
         */
        loadData: function() {
            var data = getData('filter.' + this.get('uid'), true);
            if(data instanceof Object) {
                if (this.is_filter_available()) {
                    this.set(data);
                }
            }
        },
        /**
         * Check if the filter is permited by backend directory settings (https://server.revelup.com/weborders/directory_settings/)
         * @returns {boolean} true - the filter is available, false - otherwise.
         */
        is_filter_available: function() {
            var setting,
                uid = this.get('uid'),
                set_dir = App.Data.settings.get('settings_directory');

            if (!uid) {
                console.warn("uid is not set for a filter: ", this.get('title'));
                return true;
            }

            if (uid.match(/\.storeTypes\./))
                setting = 'store_type_filter';
            else if (uid.match(/\.sortOptions\./))
                setting = 'sorting_filter';
            else if (uid.match(/\.distance\./))
                setting = 'distance_filter';
            else if (uid.match(/\.search-by-name\./))
                setting = 'search_by_name_filter';
            else if (uid.match(/\.online_and_app_orders\./))
                setting = 'online_ordering_filter';
            else if (uid.match(/\.delivery\./))
                setting = 'delivery_filter';
            else if (uid.match(/\.open_now\./))
                setting = 'open_now_filter';

            if (setting && !set_dir[setting])
                return false
            else
                return true
        }
    });

    /**
     * @class
     * @classdesc Represents a filter items collection.
     * @alias App.Collections.FilterItems
     * @augments Backbone.Collection
     * @example
     * // create filter items collection
     * require(['filters'], function() {
     *     var filterItems = new App.Collections.FilterItems({name: '1 mile', value: 1}, {name: '3 miles', value: 3});
     * });
     */
    App.Collections.FilterItems = Backbone.Collection.extend(
    /**
     * @lends App.Collections.FilterItems.prototype
     */
    {
        /**
         * Item constructor.
         * @type {Function}
         * @default {@link App.Models.FilterItem}
         */
        model: App.Models.FilterItem,
        /**
         * Sets items in the collection. If item already exists in collection then its attributes update on new values.
         * Otherwise, a new item is added to the collection.
         * @param {Array} items - an array of objects each of them has attributes of filter item.
         */
        setItems: function(items, update_only) {
            if(!Array.isArray(items)) {
                return;
            }
            items.forEach(function(item, index) {
                var uid = item instanceof App.Models.FilterItem ? item.get('uid') : item.uid;
                var model = this.findWhere({uid: uid});
                if(model) {
                    if (model.is_filter_available()) {
                        model.set(item);
                    }
                } else {
                    if (update_only !== true) {
                        this.add(item);
                    }
                }
            }, this);
        }
    });

    /**
     * @class
     * @classdesc Represents a filter.
     * @alias App.Models.Filter
     * @augments Backbone.Model
     * @example
     * // create filter
     * require(['filters'], function() {
     *     var filter = new App.Models.Filter({
     *         title: 'Max Distance',
     *         filterItems: [{name: '1 mile', value: 1}, {name: '3 miles', value: 3}],
     *         radio: true
     *     });
     * });
     */
    App.Models.Filter = Backbone.Model.extend(
    /**
     * @lends App.Models.Filter.prototype
     */
    {
        /**
         * Contains attributes with default values.
         * @type {object}
         * @enum {string}
         */
        defaults: {
            /**
             * Filter name.
             * @type {string}
             * @default ''
             */
            title: '',
            /**
             * Filter items.
             * @type {App.Collections.FilterItems}
             * @default null
             */
            filterItems: null,
            /**
             * Compares selected filter item with an item.
             * @type {Function}
             * @param {*} item - an item of an array which the filter is applied to.
             * @param {App.Models.FilterItem} filter - selected filter item.
             * @returns {boolean} A result of comparing.
             */
            compare: null,
            /**
             * Type of filter. If it is a `true` then filter items works as radio. Otherwise, user can select multi items.
             * @type {boolean}
             * @default false
             */
            radio: false,
            /**
             * Indicates whether the filter is optional.
             * If value is `true` then the filter is ignored in case when none item is selected.
             * @type {boolean}
             * @default false
             */
            optional: false
        },
        /**
         * Converts `filterItems` attribute value to App.Collections.FilterItems instance if it isn't instance of.
         * Adds listeners on `change:selected` event of filter items to propagate the event on itself
         * and deselect all selected filter items (non-emitter).
         */
        initialize: function() {
            var filterItems = this.get('filterItems'),
                filterItemsCollection = filterItems instanceof App.Collections.FilterItems ? filterItems : new App.Collections.FilterItems();

            Array.isArray(filterItems) && filterItemsCollection.setItems(filterItems);
            this.set('filterItems', filterItemsCollection);
            this.listenTo(filterItemsCollection, 'change:selected', this.uncheck, this);
            this.listenTo(filterItemsCollection, 'change:selected', this.onChanged, this);

            return Backbone.Model.prototype.initialize.apply(this, arguments);
        },
        /**
         * Triggers `change:selected` event when any filter item is selected/deselected.
         */
        onChanged: function(model, value) {
            this.trigger('change:selected', this, value);
        },
        /**
         * Gets selected filter items and deselect them if `radio` is `true`.
         */
        uncheck: function(model, value) {
            if(value && this.get('radio')) {
                this.getSelected().forEach(function(item) {
                    item !== model && item.set('selected', false);
                });
            }
        },
        /**
         * Applies the filter to `items`. An item passes the filter
         * if `compare` function applied to selected filter items at least once returns `true`.
         * @param {Array} items - an array of models that should be filtered
         */
        applyFilter: function(items) {
            var errorResult = null,
                selected = this.getSelected(),
                compare = this.get('compare'),
                result;

            result = {
                valid: [],
                invalid: []
            };

            if(!Array.isArray(items)) {
                console.warn('Unable apply filter "%s": `items` arguments is not array');
                return errorResult;
            }

            if(typeof compare != 'function') {
                return errorResult;
            }

            if(selected.length == 0) {
                if (this.get('optional')) {
                    // the filter is ignored in this case.
                    result.valid = items;
                    items.forEach(function(item) {
                        item.set('filterResult', true);
                    });
                } else {
                    result.invalid = items;
                    items.forEach(function(item) {
                        item.set('filterResult', false);
                    });
                }
                return result;
            }

            items.forEach(function(item) {
                if(!(item instanceof Backbone.Model)) {
                    return App.unitTest ? undefined : console.error('Item', item, 'is not Backbone model');
                }
                var valid = selected.some(function(filter) {
                    return compare(item, filter);
                });
                if(valid) {
                    result.valid.push(item);
                    item.set('filterResult', true);
                } else {
                    result.invalid.push(item);
                    item.set('filterResult', false);
                }
            });

            return result;
        },
        /**
         * Sets attributes values using object literal (including nested filter items).
         * Converts `data.filterItems` array to App.Collections.FilterItems instance.
         * @param {Object} data - object literal containing JSON represetation of attributes.
         */
        setData: function(data, update_only) {
            if(!(data instanceof Object)) {
                return;
            }
            for(var i in data) {
                if(i == 'filterItems') {
                    this.get('filterItems').setItems(data[i], update_only);
                } else {
                    this.set(i, data[i]);
                }
            }
        },
        /**
         * Gets attributes values as object literal (including nested filter items).
         * @returns {Object} Object literal containing JSON represetation of attributes.
         */
        getData: function() {
            var data = this.toJSON();
            data.filterItems = this.get('filterItems').toJSON();
            return data;
        },
        /**
         * @returns {Array} An array of selected filter items.
         */
        getSelected: function() {
            return this.get('filterItems').where({selected: true});
        }
    });

    /**
     * @class
     * @classdesc Represents a filters collection.
     * @alias App.Collections.Filters
     * @augments Backbone.Collection
     * @example
     * // create filters
     * require(['filters'], function() {
     *     var filter = new App.Collections.Filters({
     *         title: 'Max Distance',
     *         filterItems: [{name: '1 mile', value: 1}, {name: '3 miles', value: 3}],
     *         radio: true
     *     }, {
     *         title: 'Store Type',
     *         filterItems: [{name: 'Retail', value: 2}, {name: 'Restaurant', value: 0}]
     *     });
     * });
     */
    App.Collections.Filters = Backbone.Collection.extend(
    /**
     * @lends App.Collections.Filters.prototype
     */
    {
        /**
         * Item constructor.
         * @type {Function}
         * @default {@link App.Models.Filter}
         */
        model: App.Models.Filter,
        /**
         * An array of valid items. It updates after each filters application.
         * Used as items source in {@link App.Collections.Filters#applyFilters applyFilters()} method to minimize comparing iterations.
         * @type {Array}
         * @default []
         */
        valid: [],
        /**
         * An array of invalid items. It updates after each filters application.
         * Used as items source in {@link App.Collections.Filters#applyFilters applyFilters()} method to minimize comparing iterations.
         * @type {Array}
         * @default []
         */
        invalid: [],
        /**
         * Adds listener on 'change:selected' event of filter that automatically applies all filters for items.
         */
        initialize: function() {
            this.listenTo(this, 'change:selected', this.listenToChanges, this);
            Backbone.Collection.prototype.initialize.apply(this, arguments);
        },
        /**
         * Applies filters when user select/deselect filter item.
         * `value` is `true`:
         *     need to check invalid items because a new validation criteria affects only invalid items.
         * `value` is `true`, `model.attributes.optional` is `true`, `model.getSelected()` returns `1` (optional filter gains first selection):
         *     need to check valid items because a filter was ignored last filter application.
         * `valid` is `false`:
         *     need to check valid items because validation criteria reduction affects only valid items.
         * `valid` is `false`, `model.attributes.optional` is `true`, `model.getSelected()` returns `0` (optional filter gets ignored):
         *     need to check invalid items because a filter is ignored and doesn't have to affect items at all.
         *
         * @param {App.Models.Filter} model - changed filter
         * @param {boolean} value - indicates whether filter item is selected
         */
        listenToChanges: function(model, value) {
            if(value === true) {
                this.applyFilters(model.get('optional') && model.getSelected().length == 1 ? 'valid' : 'invalid');
            } else if(value === false) {
                this.applyFilters(model.get('optional') && !model.getSelected().length ? 'invalid' : 'valid', model.get('radio'));
            }
        },
        /**
         * Applies each filter.
         * Original models order may be changed after any filters application.
         * An item passes all filters if it passes each of them.
         * @param {string} src='invalid' - source of items ('invalid', 'valid')
         * @param {boolean} silent - if `true` the collection emits 'onFiltered' event after filters application.
         */
        applyFilters: function(src, silent) {
            src = src || 'invalid';

            var antiSrc = src == 'valid' ? 'invalid' : 'valid',
                filters = this.models,
                valid = this.valid,
                invalid = this.invalid,
                result = {
                    valid: (src == 'valid' ? valid : invalid),
                    invalid: []
                };

            if(!this.length) {
                return;
            }

            for(var ind = 0, length = filters.length; ind < length; ind++) {
                if(!filters[ind].get('optional') && !filters[ind].getSelected().length) {
                    App.Data.devMode && console.warn('filter \'', filters[ind].get('title'), '\' is reqiured and unselected, all items will be hidden');
                    result.valid = [];
                    result.invalid = valid.concat(invalid);
                    result.invalid.forEach(function(item) {
                        item.set('filterResult', false);
                    });
                    break;
                }
                applyFilter(filters[ind], result.valid);
            }

            function applyFilter(filter, data) {
                var iterResult = filter.applyFilter(data);
                if(iterResult) {
                    result.invalid.push.apply(result.invalid, iterResult.invalid);
                    result.valid = iterResult.valid;
                }
            }

            this[antiSrc].push.apply(this[antiSrc], result[antiSrc]);
            this[src] = result[src];

            !silent && this.trigger('onFiltered', this.valid, this.invalid);
        },
        /**
         * Sets filters in the collection. If item already exists in collection then its attributes update on new values.
         * Otherwise, a new item is added to the collection.
         * @param {Array} data - an array of objects containing JSON representation of {@link App.Models.Filter} attributes.
         */
        setData: function(data, update_only) {
            if(!Array.isArray(data)) {
                return;
            }
            data.forEach(function(item, index) {
                var model = this.at(index);
                if(model) {
                    model.setData(item, update_only);
                } else {
                    if (update_only !== true)
                        this.add(item);
                }
            }, this);
        },
        /**
         * @returns {Array} An array of objects containing JSON representation of {@link App.Models.Filter} attributes.
         */
        getData: function() {
            return this.map(function(filter) {
                return filter.getData();
            });
        },
        isSomeSelected: function() {
            return this.some(function(model){
                return model.get('filterItems').findWhere({'selected': true});
            });
        }
    });
});