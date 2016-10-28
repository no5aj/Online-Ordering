/**
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
 * Contains {@link App.Models.Captcha} constructor.
 * @module captcha
 * @requires module:backbone
 * @see {@link module:config.paths actual path}
 */
define(["backbone"], function(Backbone) {
    'use strict';

    /**
     * @class
     * @classdesc Represents Captcha API
     * @alias App.Models.Captcha
     * @augments Backbone.Model
     * @example
     * // create a captcha model
     * require(['captcha'], function() {
     *     var captcha = new App.Models.Captcha();
     * });
     */
    App.Models.Captcha = Backbone.Model.extend(
        /**
         * @lends App.Models.Captcha.prototype
         */
        {
        /**
         * Contains attributes with default values.
         * @type {object}
         * @enum {string}
         */
        defaults: {
            /**
             * URL of captcha image
             * @type {string}
             */
            captchaImage: '',
            /**
             * Unique key of captcha image (used on server to verify captcha value entered)
             * @type {string}
             */
            captchaKey: '',
            /**
             * Captcha value entered by user
             * @type {string}
             */
            captchaValue: ''
        },
        initialize: function() {
            this.defaults.captchaKey = App.Settings.recaptcha_site_key;
        },
        /**
         * Sets `captchaKey` attribute as `recaptcha_site_key` system settings.
         * Updates `captchaValue`, `captchaKey` attributes.
         */
        loadCaptcha: function() {
            this.set('captchaKey', App.Settings.recaptcha_site_key);
            this.set('captchaValue', '');
        }
    });
});