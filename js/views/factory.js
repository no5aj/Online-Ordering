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

define(['backbone', 'backbone_epoxy', 'backbone_epoxy_handlers', 'backbone_epoxy_filters'], function(Backbone) {
    'use strict';

    Backbone.Epoxy.binding.allowedParams.params = true; //allows to write in a custom binding additional params like "valueTimeout:valName,params:{timeout:1000}, ..."
    var id_counter = 0;

    App.Views.FactoryView = Backbone.Epoxy.View.extend({
        constructor: function(options) {
            this.options = _.extend({}, options);
            this.appData = App.Data;

            // Extend Backbone.Epoxy.View.prototype.bindingSources to implement the ability to pass `bindingSources` via Backbone.View options.
            // All Backbone.Model's, Backbone.Collection's instances existing in options will be added to `bindingSources` (overrides existing pairs in this.prototype.bindingSources).
            // If `bindingSources` object exists in options it overrides all existing pairs in this.bindingSources.
            if(_.isObject(options)) {
                // parse all models and collections from options except `model` and `collection`
                var bindingSources = _.pick(options, Object.keys(options).filter(function(key) {
                    var value = options[key];
                    return key != 'model' && key != 'collection' && (value instanceof Backbone.Model || value instanceof Backbone.Collection);
                }));
                _.extend(bindingSources, _.isObject(options.bindingSources) ? options.bindingSources : undefined);
            }

            this.bindingSources || (this.bindingSources = {});
            _.extend(this.bindingSources, {
                _settings: App.Data.settings,
                _system_settings: new Backbone.Model(App.Settings),
                _lp: new Backbone.Model(_loc),
                _settings_directory: new Backbone.Model(App.SettingsDirectory)
            }, bindingSources);

            // init array of sub views
            this.subViews = [];

            // remove() method removes all subviews
            this.subViews.remove = function() {
                while(this.length > 0) {
                    var view = this.shift();
                    view instanceof Backbone.View && view.remove();
                };
            };

            // removeFromDOMTree(): removes node elements of subviews from DOM tree
            this.subViews.removeFromDOMTree = function() {
                while(this.length > 0) {
                    var view = this.shift();
                    view instanceof Backbone.View && view.removeFromDOMTree();
                };
            };

            // adds 'onEnter' listeners to this.events
            this.addOnEnterListeners();

            return Backbone.View.prototype.constructor.apply(this, arguments);
        },
        initialize: function() {
            if (!this.template) {
                this.template = function(params) {
                    var template = template_helper(this.name, this.mod),
                        baseParams = {
                            _settings: App.Settings,
                            _lp: _loc
                        };
                    params = params instanceof Object ? _.extend(baseParams, params) : baseParams;
                    return template(params);
                };
            }
            this.render();
            this.applyBindings();
            App.Data.devMode && this.$el.attr("x-tmpl", this.name + "_" + this.mod + "-template");
            App.Data.devMode && this.$el.attr("x-view", this.options.dbgClassName);
            App.Data.devMode && (this.dbgClassName = this.options.dbgClassName);
            if (App.Data.devMode) {
                var time_id = (new Date).getTime()*100 + id_counter++;
                if (id_counter >= 100)
                    id_counter = 0;
                this.$el.attr("x-id", time_id);
                App.dbgView[time_id] = this;
            }
        },
        render: function() {
            this.$el.html(this.template(this.model ? (this.model.toJSON ? this.model.toJSON() : this.model) : undefined));
            return this;
        },
        /*
         * creation view.
         */
        createView: function() {
            return App.Views.Generator.prototype.create.apply(this, arguments);
        },
        /**
         * Remove the view.
         *
         * @return {object} Deleted view.
         */
        remove: function() {
            this.subViews.remove();
            return Backbone.View.prototype.remove.apply(this, arguments);
        },
        /**
         * Remove the view from the DOM tree.
         */
        removeFromDOMTree: function() {
            this.$el.detach();
        },
        /*
         * fix for Bug 12265
         * caret is visible over all layouts on the page in ios safari
         */
        iOSSafariCaretFix: function() {
            if(!(cssua.ua.ios && cssua.ua.webkit))
                return;

            var data = this.$('.ios-safari-caret-fix');

            // show input if user clicks on another input
            data.on('blur', '.ios-safari-caret:hidden', function() {
                $(this).show();
            });

            data.on('scroll', function() {
                var dataTop = data.offset().top,
                    dataHeight = data.height();

                // show hidden inputs if they are inside of visible area
                $('.ios-safari-caret:hidden', data).each(function() {
                    var field = $(this),
                        fieldTop = field.parent().offset().top,
                        fieldHeight = field.height(),
                        fieldTagName = field.prop('tagName');

                    switch (fieldTagName) {
                        case 'INPUT':
                            var fieldLineHeight = parseFloat(field.css('line-height')),
                                fieldFontSize = parseFloat(field.css('font-size')),
                                fieldFontSize = (!isNaN(fieldLineHeight) && fieldLineHeight > fieldFontSize) ? fieldLineHeight : fieldFontSize,
                                fieldTopIndent = parseFloat(field.css('margin-top')) + parseFloat(field.css('border-top-width')) + parseFloat(field.css('padding-top')),
                                fieldCaretPaddingTop = (fieldHeight - fieldFontSize) / 2,
                                fieldCaretTop = fieldTop + fieldTopIndent + fieldCaretPaddingTop,
                                fieldCaretBottom = fieldTop + fieldTopIndent + (fieldHeight - fieldCaretPaddingTop);

                            if (dataTop < fieldTop + (fieldCaretBottom - fieldTop) && dataTop + dataHeight > fieldCaretTop)
                                field.show();
                            break;
                        case 'TEXTAREA':
                            if (dataTop < fieldTop + fieldHeight && dataTop + dataHeight > fieldTop)
                                field.show();
                            break;
                    }
                });

                // if input is in focus and outside of visible area it should be hidden
                $('.ios-safari-caret:focus:visible', data).each(function() {
                    var field = $(this),
                        fieldTop = field.parent().offset().top,
                        fieldHeight = field.height(),
                        fieldTagName = field.prop('tagName');

                    switch (fieldTagName) {
                        case 'INPUT':
                            var fieldLineHeight = parseFloat(field.css('line-height')),
                                fieldFontSize = parseFloat(field.css('font-size')),
                                fieldFontSize = (!isNaN(fieldLineHeight) && fieldLineHeight > fieldFontSize) ? fieldLineHeight : fieldFontSize,
                                fieldTopIndent = parseFloat(field.css('margin-top')) + parseFloat(field.css('border-top-width')) + parseFloat(field.css('padding-top')),
                                fieldCaretPaddingTop = (fieldHeight - fieldFontSize) / 2,
                                fieldCaretTop = fieldTop + fieldTopIndent + fieldCaretPaddingTop,
                                fieldCaretBottom = fieldTop + fieldTopIndent + (fieldHeight - fieldCaretPaddingTop);

                            if (dataTop >= fieldTop + (fieldCaretBottom - fieldTop) || dataTop + dataHeight <= fieldCaretTop)
                                field.hide();
                            break;
                        case 'TEXTAREA':
                            if (dataTop > fieldTop + fieldHeight / 2 || dataTop + dataHeight < fieldTop)
                                field.hide();
                            break;
                    }
                });
            });
        },
        /*
         * Fix for Bug 20541
         * Issue discussion http://stackoverflow.com/questions/19012135/ios-7-ipad-safari-landscape-innerheight-outerheight-layout-issue
         */
        iPad7Feature: function() {
            if(this.iPad7Feature.initialized)
                return;

            if (/iPad;.*CPU.*OS 7_\d/i.test(window.navigator.userAgent))
                this.$el.on('orientationchange', listen);
            else
                return;

            this.iPad7Feature.initialized = true;
            listen();

            function listen() {
                if (matchMedia('(orientation:landscape)').matches && window.innerHeight != window.outerHeight) {
                    $('html').addClass('ipad');
                    $(window).scrollTop(0, 0);
                } else {
                    $('html').removeClass('ipad');
                }
            }
        },
        /**
         * @method
         * Extends 'bindingSources'.
         *
         * @param {object} data - new binding sources items.
         */
        extendBindingSources: function(data) {
            _.extend(this.bindingSources, data);
        },
        pressedButtonIsEnter: function(event) {
            if (event.which === 13) {
                return true;
            }
            return false;
        },
        start: function() {
            this.subViews.forEach(function(view) {
                typeof view.start == 'function' && view.start();
            });
        },
        stop: function() {
            this.subViews.forEach(function(view) {
                typeof view.stop == 'function' && view.stop();
            });
        },
        /**
         * ```
         * {
         *     '<selector>': ('method' || new Function),
         *     ...
         * }
         * ```
         */
        onEnterListeners: {},
        /**
         * Handles listeners on `onEnter` event ('enter' button on keyboard).
         * Uses `onEnterListeners` property as listeners source.
         */
        addOnEnterListeners: function() {
            var listeners = this.onEnterListeners,
                protoEvents = _.result(this, 'events'),
                self = this,
                events = {};

            if (!_.isObject(listeners) || !Object.keys(listeners).length) {
                return;
            }

            for (var key in listeners) {
                events['keydown ' + (key == ':el' ? '' : key)] = wrapHandler(listeners[key]);
            }

            this.events = _.extend(_.isObject(protoEvents) ? protoEvents : {}, events);

            function wrapHandler(handler) {
                return function(event) {
                    if (self.pressedButtonIsEnter(event)) {
                        if (typeof handler == 'function') {
                            handler.apply(self, arguments);
                        } else if (typeof handler == 'string' && typeof self[handler] == 'function') {
                            self[handler].apply(self, arguments);
                        }
                    }
                }
            }
        }
    });

    /**
     * ViewModule class
     * Provides global views initialization
     */
    function ViewModule() {
        this.args = arguments;
        this.initViews();
    }

    ViewModule.prototype.initViews = function() {
        Array.prototype.forEach.call(this.args, function(cb) {
            typeof cb == 'function' && cb();
        });
    };

    return ViewModule;
});

/*
* swiping function for Android or iOS
*/
function get_swipe_detect_fn(){
    if (cssua.userAgent.android) {
        return swipe_detect_Android;
    } else {
        return swipe_detect;
    }
}
/*
* the function detects swiping in either of the 4 directions (left, right, up, or down) for mobile devices
*/
function swipe_detect(el, callback){
    var touchsurface = el,
    swipedir,
    startX,
    startY,
    distX,
    distY,
    threshold = 100, //required min distance traveled to be considered swipe
    restraint = 100, // maximum distance allowed at the same time in perpendicular direction
    allowedTime = 500, // maximum time allowed to travel that distance
    elapsedTime,
    startTime,
    handleswipe = callback || function(swipedir){}

    touchsurface.addEventListener('touchstart', function(e){
        var touchobj = e.changedTouches[0]
        swipedir = 'none'
        dist = 0
        startX = touchobj.pageX
        startY = touchobj.pageY
        startTime = new Date().getTime() // record time when finger first makes contact with surface
        //trace("touch start... ", touchobj.pageX, touchobj.pageY);
        //e.preventDefault()
    }, false)

    touchsurface.addEventListener('touchmove', function(e){
        var touchobj = e.changedTouches[0]
        distX = touchobj.pageX - startX // get horizontal dist traveled by finger while in contact with surface
        distY = touchobj.pageY - startY // get vertical dist traveled by finger while in contact with surface
        //trace("touch touchmove... ", touchobj.pageX, touchobj.pageY, elapsedTime);
        elapsedTime = new Date().getTime() - startTime // get time elapsed
        if (elapsedTime <= allowedTime){ // first condition for awipe met
            if (Math.abs(distX) >= threshold && Math.abs(distY) <= restraint){ // 2nd condition for horizontal swipe met
                swipedir = (distX < 0)? 'left' : 'right' // if dist traveled is negative, it indicates left swipe
            }
            else if (Math.abs(distY) >= threshold && Math.abs(distX) <= restraint){ // 2nd condition for vertical swipe met
                swipedir = (distY < 0)? 'up' : 'down' // if dist traveled is negative, it indicates up swipe
            }
        }
        handleswipe(swipedir)
        //e.preventDefault()
    }, false)
}


/*
* the function detects swiping in either of the 4 directions (left, right, up, or down) for mobile devices
*/
function swipe_detect_Android(el, callback){
    var touchsurface = el,
    swipedir,
    startX,
    startY,
    distX,
    distY,
    thresholdSpeed = 0.1, //required moving speed traveled to be considered swipe
    restraintSpeed = 0.2, // maximum moving speed allowed at the same time in perpendicular direction
    elapsedTime,
    startTime,
    handleswipe = callback || function(swipedir){}

    touchsurface.addEventListener('touchstart', function(e){
        var touchobj = e.changedTouches[0]
        swipedir = 'none'
        dist = 0
        startX = touchobj.pageX
        startY = touchobj.pageY
        startTime = new Date().getTime() // record time when finger first makes contact with surface
        //trace("touch start... ", touchobj.pageX, touchobj.pageY);

    }, false)

    touchsurface.addEventListener('touchmove', function(e){
        var touchobj = e.changedTouches[0]
        distX = touchobj.pageX - startX // get horizontal dist traveled by finger while in contact with surface
        distY = touchobj.pageY - startY // get vertical dist traveled by finger while in contact with surface

        elapsedTime = new Date().getTime() - startTime; // get time elapsed
        elapsedSpeed = Math.abs(distX / elapsedTime);
        perpendicularSpeed = Math.abs(distY / elapsedTime);
        //trace("touch touchmove... ", touchobj.pageX, touchobj.pageY, elapsedTime, elapsedSpeed, perpendicularSpeed);
            if (elapsedSpeed >= thresholdSpeed && perpendicularSpeed <= restraintSpeed){ // 2nd condition for horizontal swipe met
                swipedir = (distX < 0)? 'left' : 'right' // if dist traveled is negative, it indicates left swipe
            }
            else if (perpendicularSpeed >= thresholdSpeed && elapsedSpeed <= restraintSpeed){ // 2nd condition for vertical swipe met
                swipedir = (distY < 0)? 'up' : 'down' // if dist traveled is negative, it indicates up swipe
            }
        handleswipe(swipedir)
    }, false)
}

