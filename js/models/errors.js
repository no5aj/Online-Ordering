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
 * Contains {@link App.Models.Errors} constructor.
 * @module errors
 * @requires module:backbone
 * @see {@link module:config.paths actual path}
 */
define(['backbone'], function(Backbone) {
    'use strict';

    /**
     * @class
     * @classdesc Represents a model that allows to notify user about any event.
     * @alias App.Models.Errors
     * @augments Backbone.Model
     * @example
     * // create a notification model
     * require(['errors'], function() {
     *     var notification = new App.Models.Errors();
     * });
     */
    App.Models.Errors = Backbone.Model.extend(
    /**
     * @lends App.Models.Errors.prototype
     */
    {
        /**
         * Contains attributes with default values.
         * @type {object}
         * @enum {string}
         */
        defaults: {
            /**
             * A message.
             * @type {string}
             * @default 'No alert message'
             */
            message: 'No alert message',
            /**
             * If `true` the app will be reloaded.
             * @type {boolean}
             * @default false
             */
            reloadPage: false,
            /**
             * If `true` an error ocurred on server.
             * @type {boolean}
             * @default false
             */
            errorServer: false,
            /**
             * Type of icon. Available values are 'info', 'warning',
             * @type {string}
             * @default 'info'
             */
            typeIcon: 'info',
            /**
             * If `true` a confirmation popup should be displayed,
             * @type {boolean}
             * @default false
             */
            isConfirm: false,
            /**
             * Confirmation popup config,
             * @type {Object}
             * @default
             * ```
             * {
             *     ok: 'OK',          // label of 'OK' button
             *     cancel: 'Cancel',  // label of 'Cancel' button
             *     btnsSwap: false,   // Swap button
             *     cancelHide: false  // Hide 'Cancel' button
             * }
             * ```
             */
            confirm: {
                ok: 'OK',
                cancel: 'Cancel',
                btnsSwap: false,
                cancelHide: false
            },
            /**
             * Custom view that should be added into popup.
             * @type {?Backbone.View}
             * @default null
             */
            customView: null,
            /**
             * Indicates  whether 'OK' button is disabled in confirmation alert
             * @type {boolean}
             * @default false
             */
            btnDisabled1: false
        },
        /**
         * Clears model (sets default values).
         */
        clearModel: function() {
            this.set(this.defaults);
            var options = ['template', 'callback'];
            for (var i = 0; i < options.length; i++) {
                this.unset(options[i]);
            }
        },
        /**
         * Sets poup config and emits event to show alert.
         *
         * @param {string} message - Alert message.
         * @param {boolean} reloadPage - If `true` - reload page after pressing button.
         * @param {boolean} defaultView - `true` value means to Use jQuery alert message.
         * @param {object} options - Options of alert message:
         * @param {string} options.template - template ID (apply if uses custom alert message)
         * @param {boolean} options.errorServer - server return HTTP status 200, but data.status is error
         * @param {string} options.typeIcon - type of icon ('info' or 'warning')
         * @param {boolean} options.isConfirm - if `true` - show confirm message
         * @param {Object} options.confirm - object for confirm message (two button)
         * @param {string} options.confirm.ok - text of OK button
         * @param {string} options.confirm.cancel - text of CANCEL button
         * @param {boolean} options.confirm.btnsSwap - buttons swap
         * @param {boolean} options.confirm.cancelHide - if `true` - hide CANCEL button
         * @param {Function} options.confirm.callback - callback for confirm message
         * @param {Backbone.View} options.confirm.customView - an instance of Backbone.View that shoud be used as popup content.
         */
        alert: function(message, reloadPage, defaultView, options) {
            this.clearModel(); // clear model (set default values)
            if (options instanceof Object) this.set(options);
            var dView = (App.skin == App.Skins.WEBORDER || App.skin == App.Skins.RETAIL || (App.skin == App.Skins.WEBORDER_MOBILE && this.get('isConfirm'))) ?
                (defaultView === undefined) ? false : !!defaultView :
                (App.skin == App.Skins.WEBORDER_MOBILE) ? true : defaultView;
            this.set({
                message: message && message.toString() || this.defaults.message,
                reloadPage: !!reloadPage || false,
                defaultView: dView
            });
            // buttons (begin)
            var btnText1 = this.defaults.confirm.ok;
            var btnText2 = this.defaults.confirm.cancel;
            var btnDisabled1 = false;
            if (this.get('isConfirm')) {
                var confirm = this.get('confirm');
                if (confirm.ok) btnText1 = confirm.ok;
                if (confirm.ok_disabled) btnDisabled1 = confirm.ok_disabled;
                if (confirm.cancel) btnText2 = confirm.cancel;
            }
            this.set({
                btnText1: btnText1,
                btnDisabled1: btnDisabled1,
                btnText2: btnText2
            });
            // buttons (end)
            this.trigger('alertMessage');

            if (!!reloadPage) {
                clearTimeout(_app_start_logtimer);
                setTimeout(function() {
                    errorSend("Alert & reload", message);
                }, 0);
            }
        }
    });
});