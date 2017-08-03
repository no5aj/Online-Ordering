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

define(['backbone', 'backbone_epoxy'], function(Backbone) {
    'use strict';

    Backbone.Epoxy.binding.addHandler('loadSpinner', function($el, value) {
        if(value) {
            $el.off();
            $el.attr('src', value);
            return loadSpinner($el);
        } else {
            return $el;
        }
    });

    Backbone.Epoxy.binding.addHandler('updateCaptcha', function($el, value) {
        var view = this.view;
        value && $el.on('load', removeSpinner).error(removeSpinner);
        $el.attr('src', value);
        function removeSpinner() {
            $el.off('load error');
            // need to remove spinner only when current element's `src` attribute corresponds `value`
            if($el.attr('src') === value) {
                view.removeCaptchaSpinner();
            }
        }
    });

    Backbone.Epoxy.binding.addHandler("valueTimeout", {
        // it's custom binding to get the value for <input> element by 'blur','change' events AND by 'input' (key press) event by the timout specified.
        // timeout param is used for 'input' events only.
        // Usage example:  "#search-input": "valueTimeout:searchString,params:{timeout:1500},events:['input','blur','change']"
        init: function( $element, value, bindings, context ) {
            // Initialize the binding handler...
            this.timeout = context.params.timeout;
            if (!this.timeout) {
                console.error("timeout param is not specified for valueTimeout binding");
            }
            this.clearTimeout = function() {
                if (this.inputTimeout) {
                    clearTimeout(this.inputTimeout);
                    this.inputTimeout = null;
                }
            }
        },
        set: function( $element, value) {
            $element.val(value);
        },
        get: function( $element, value, event ) {
            if (event.type == 'blur' || event.type == 'change') {
                return $element.val().trim();
            }
            this.clearTimeout();
            this.inputTimeout = setTimeout((function(){
                $element.trigger("change");
                this.clearTimeout();
            }).bind(this), this.timeout);
            return value;
        },
        clean: function() {
            if (this.inputTimeout) {
                clearTimeout(this.inputTimeout);
            }
        }
    });

    Backbone.Epoxy.binding.addHandler('checkedSpan', {
        init: function($el, value, bindings, context) {
            var self = this,
                outer = context.checkedSpan.outer_elem ? $el.closest(context.checkedSpan.outer_elem) : $el;
            !outer && (outer = $el);

            this.value = context.checkedSpan.value;

            this.addHandler = function() {
                outer.on('click', handler);
            };

            this.removeHandler = function() {
                outer.off('click', handler);
            };

            this.addHandler();

            function handler(event) {
                event.stopImmediatePropagation();
                event.preventDefault();
                self.value(!self.value());
            }
        },
        set: function($el, value_attr) {
            $el.attr('checked', value_attr.value ? 'checked' : false);
        },
        clean: function() {
            this.removeHandler();
        }
    });

    Backbone.Epoxy.binding.addHandler('replaceToTemplate', {
        init: function($el, value, bindings, context) {
            this.oldHTML = $el.html();
            this.replaceRegExp = typeof context.replaceRegExp == 'string' ? context.replaceRegExp : '';
        },
        set: function($el, value) {
            var template = this.view.$(value);
            if(template.length && this.replaceRegExp.length) {
                $el.html($el.html().replace(new RegExp(this.replaceRegExp, 'g'), template.html()));
            }
        },
        clean: function() {
            delete this.oldHTML;
            delete this.replaceRegExp;
        }
    });

    Backbone.Epoxy.binding.addHandler('replaceRegExp');

    // handler to reset value
    Backbone.Epoxy.binding.addHandler('reset', {
        get: function($el, value, event) {
            return '';
        }
    });

    Backbone.Epoxy.binding.addHandler("valueTrim", {
        //
        // it's custom binding to get the value.trim() for <input> element by 'blur','change' events.
        // timeout param is used for 'input' events only.
        // Usage example:  "#my_input": "valueTrim:value,events:['blur','change']"
        //
        set: function( $element, value) {
            $element.val(value.trim());
        },
        get: function( $element, value, event ) {
            return $element.val().trim();
        }
    });

    Backbone.Epoxy.binding.addHandler("toggleInline", {
        set: function( $element, value) {
            $element.css("display", value == true ? "block-inline" : "none");
        }
    });

    // 'outsideTouch' handler: changes on false value bound when user clicks outside of current element.
    // 'onOutsideTouch' event should be passed in 'events' handler.
    Backbone.Epoxy.binding.addHandler('outsideTouch', {
        init: function($el, value, bindings) {
            var touchEvent = 'ontouchstart' in document.documentElement ? 'touchstart' : 'mousedown';

            // listen to click on any UI element outside $el
            var documentListener = function(event) {
                if(event.target !== $el.get(0) && !$el.find(event.target).length) {
                    $el.trigger('onOutsideTouch');
                }
            };

            // bind listeners
            this.listenToClick = function() {
                Backbone.$(document).on(touchEvent, documentListener);
            }

            // unbind listeners
            this.stopListeningToClick = function() {
                Backbone.$(document).off(touchEvent, documentListener);
            }
        },
        set: function($el, value) {
            value && this.listenToClick();
        },
        get: function($el, value, event) {
            if(event.type == 'onOutsideTouch') {
                this.stopListeningToClick();
                return false;
            } else {
                return value;
            }
        },
        clean: function() {
            this.stopListeningToClick();
        }
    });

    Backbone.Epoxy.binding.addHandler("restrictInput", {
        // Usage:  "#my_input": "restrictInput: '0123456789-'"
        init: function($el, value, bindings, context) {
            this.unbind = function() {
                $el.off('keypress', keypress);
            }

            $el.on('keypress', keypress);
            function keypress(event) {
                var key = event.which;
                if ((key == null) || (key == 0) || (key == 8) || (key == 9) || (key == 13) || (key == 27)) {
                    return true; // pass control key
                } else if ((value.indexOf(String.fromCharCode(key)) > -1)) {
                    return true; // pass valid char
                }
                return false; // skip NOT valid char
            }
        },
        clean:  function() {
            this.unbind();
        }
    });

    Backbone.Epoxy.binding.addHandler('kbdSwitcher', {
        // Usage:  "#my_input": "kbdSwitcher:'cardNumber'"
        init: function($el, value, bindings, context) {
            inputTypeSwitcher($el, value);
        }
    });

    Backbone.Epoxy.binding.addHandler('pattern', {
        // Usage:  "#my_input": "pattern: /^\\d{0,19}$/'"
        init: function($el, value, bindings, context) {
            var prev = ''; //initial && initial.toString() || '';
            this.unbind = function() {
                $el.off('input', validate);
                $el.off('change', change);
                $el.off('blur', triggerChange);
            }

            var regex = context.pattern;
            if (typeof regex === 'function') {
                regex = regex(); // regex comes from computeds getter
            }
            if (regex instanceof RegExp) {
                $el.on('input', validate);
                $el.on('change', change);
            }

            function change(event) {
                prev = event.target.value;
            }

            function triggerChange() {
                $el.trigger('change');
            }

            function validate(event) {
                if (!regex.test(event.target.value) || !event.target.value && !this.validity.valid) {
                    event.target.value = prev;
                    $el.off('blur', triggerChange); // `change` event is not emitted after this case
                    $el.on('blur', triggerChange); // need reproduce it
                } else {
                    prev = event.target.value;
                }
            }
        },
        clean: function() {
            this.unbind();
        }
    });

    Backbone.Epoxy.binding.addHandler('loadScaledImage', function($el, value) {
        if (!value) {
            return;
        }

        listenToInsertionIntoDOM($el, function() {
            var parent = $el.parent(),
                width, height;
            if (parent.length) {
                width = Math.round(parent.width()) || 200;
                height = Math.round(parent.height()) || 200;
                $el.attr('src', value + '?options={"size":[' + width + ',' + height + ']}');
                loadSpinner($el);
            }
        });
    });

    // Tracks current caret position and restores it after binding value update.
    // This handler is often used simultaneously with 'value:anyFilter(binding_value), events: ["input"]' handlers
    // to avoid a caret position moving to end caused by following process:
    //     1. Caret position is 'ab|c'.
    //     2. User enters 'd' symbol.
    //     3. Value changes on 'abd|c'.
    //     4. Trigger 'input' event.
    //     5. Trigger get() method on 'value' handler.
    //     6. Trigger binding value "change" event
    //     7. Trigger set() method of 'value' handler that changes el.value on new value.
    //     8. Caret position is automatically moved to end.
    Backbone.Epoxy.binding.addHandler('trackCaretPosition', {
        init: function($el, value, bindings) {
            var events = 'keyup keydown keypress mouseup mousedown touchstart touchend',
                el = $el.get(0),
                self = this;

            this.prevValue = '';

            this.listenToPositionChange = function() {
                $el.on(events, getPosition);
            };

            this.stopListening = function() {
                $el.off(events, getPosition);
            };

            this.setPosition = function(pos) {
                if (!$el.is(':focus')) {
                    return;
                }
                // Using Selection API for input[type=number] throws exception in some browsers (Chrome)
                // ("Browser Compatibility" at https://developer.mozilla.org/en-US/docs/Web/API/HTMLInputElement/setSelectionRange)
                try {
                    el.setSelectionRange(pos, pos);
                } catch(e) {
                    console.log('Unable to set caret position');
                }
            };

            getPosition();
            this.listenToPositionChange();

            function getPosition() {
                try {
                    self.startPos = el.selectionStart;
                    self.endPos = el.selectionEnd;
                } catch(e) {
                    self.startPos = 0,
                    self.endPos = 0;
                    console.log('Unable to get caret position');
                }
            }
        },
        // restore correct caret position after el.value update
        set: function($el, value) {
            if (!value) value = '';
            var valueLength = value.toString().length,
                prevLength = this.prevValue.toString().length,
                range = Math.abs(this.startPos - this.endPos),
                diff = valueLength - prevLength,
                pos = this.startPos + range + diff;
            this.setPosition(pos);
            this.startPos = this.endPos = pos;
            this.prevValue = value;
        },
        clean: function() {
            this.stopListening();
        }
    });

    // Adds new view to bound html element.
    // `value` is an object that is passed to App.Views.GeneratorView.create(value.name, value, value.viewId).
    // `value` has special properties:
    //     `value.name`         [mandatory] - name of view class
    //     `value.mod`          [mandatory] - name of view class mode
    //     `value.viewId`       [optional]  - unique id of view (if it exists a new view is cached)
    //     `value.subViewIndex` [optional]  - index of `subView` which a new view should be inserted to (if another view is occupied this index it is removed)
    Backbone.Epoxy.binding.addHandler('updateContent', {
        set: function($el, value) {
            if (!_.isObject(value) || !value.name || !value.mod) {
                return;
            }

            var subViews = this.view.subViews;

            // If binding handler creates new view inherited from EpoxyView it changes objects set that the current EpoxyBinding instance listens to.
            // This is feature of Epoxy lib implementation.
            // Just look at how native 'collection' handler removes and restores 'viewMap' variable.

            // Need to suspend the working graph map here before making children
            this.suspendDependencyGraph();

            // create subview
            var view = this.view.createView(value.name, value, value.viewId),
                removeMethod = value.viewId ? 'removeFromDOMTree' : 'remove',
                existingView = subViews[value.subViewIndex];

            // remove view if it exists
            existingView && existingView[removeMethod]();

            // add new view to `subViews` array
            if (typeof value.subViewIndex == 'number' && value.subViewIndex > -1) {
                subViews[value.subViewIndex] = view;
            } else {
                subViews.push(view);
            }

            $el.append(view.el);

            // Restore cached dependency graph configuration
            this.restoreDependencyGraph();
        }
    });

    // Adds/updates new class. Every update removes previous class.
    Backbone.Epoxy.binding.addHandler('updateClass', {
        init: function($el, value, bindings) {
            this.previousValue = value;
            $el.addClass(value);
        },
        set: function($el, value) {
            $el.removeClass(this.previousValue);
            $el.addClass(value);
            this.previousValue = value;
        },
        clean: function() {
            delete this.previousValue;
        }
    });
});
