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

define(['backbone'], function(Backbone) {
    var cache = {};

    App.Views.Generator = new Function();

    App.Views.Generator.prototype = {
        options: {
            mod: 'Main'
        },
        create: function(ViewClass, options, idParam) {
            var root, id = idParam && ViewClass + options.mod + 'View' + idParam;
            options = options || {};
            options = _.defaults(options, App.Views.Generator.prototype.options);

            //trace("create=>", ViewClass + options.mod, this.options._to_all_subviews, options);
            if (Array.isArray(options._to_all_subviews) || Array.isArray(this.options._to_all_subviews)) {
                //Pass some options from a parent view to all child & their child views down a creation tree
                var inherits = this.options._to_all_subviews;
                //To use this feature you should use FormView.createView() method or App.Views.GeneratorView.create.call(this, ...)
                //to create child views. It's for context translation of a parent view to a child one.
                !Array.isArray(inherits) && (inherits = []);
                !Array.isArray(options._to_all_subviews) && (options._to_all_subviews = []);
                options._to_all_subviews = inherits.concat(options._to_all_subviews);
                for (var key, i = 0; i < options._to_all_subviews.length; i++){
                    key = options._to_all_subviews[i];
                    if (options[key])
                        continue; // an inherited option will be overridden by an option from this view
                    options[key] = this.options[key]; //inherit options from parent view
                }
            }

            if(App.Views.Generator.enableCache && id in cache) {
                var view = cache[id];
            } else {
                options.dbgClassName = ViewClass + options.mod + 'View';
                root = App.Views[ViewClass + 'View'];
                if (!root || !root[ViewClass + options.mod + 'View']) {
                    console.error("Can't find the view class: " + "App.Views." + ViewClass + 'View.' + options.dbgClassName);
                }
                var viewClass = App.Views[ViewClass + 'View'][ViewClass + options.mod + 'View'];
                if (App.Data.devMode) {
                    var core_root = App.Views['Core' + ViewClass + 'View'];
                    if (core_root) {
                        var coreClass = core_root['Core' + options.dbgClassName];
                        if (viewClass == coreClass) {
                            options.dbgClassName = 'Core' + options.dbgClassName;
                        }
                    }
                }
                options._parents = this._parents;
                view = new viewClass(options);
                if(App.Views.Generator.enableCache && id) {
                    cache[id] = view;
                    //App.Data.devMode && view.$el.attr('x-cache-id', id);
                }
            }

            return view;
        },
        /**
         * Clear cache if store was changed.
         */
        clearCache: function(key) {
            for (var view in cache) {
                if (!~view.indexOf('CoreEstablishments')) cache[view].remove();
            }
            cache = {};
            App.Data.view_cache = cache; //for debug
        },
        /*
        *  remove the view from cache
        */
        cacheRemoveView: function(ViewClass, mod, id) {
            id = ViewClass + mod + 'View' + id;
            if (cache[id]) {
                cache[id].remove();
                delete cache[id];
            }
        },
        /*
        *   find view in the cache
        */
        findViewCached: function(ViewClass, options, idParam) {
            var id = idParam && ViewClass + options.mod + 'View' + idParam;
            if(App.Views.Generator.enableCache && id in cache) {
                var view = cache[id];
            }
            return view;
        }
    };

    App.Views.GeneratorView = new App.Views.Generator();
});