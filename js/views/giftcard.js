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

define(["backbone", "factory"], function(Backbone) {
    'use strict';

    App.Views.CoreGiftCardView = {};
    App.Views.CoreGiftCardView.CoreGiftCardMainView = App.Views.FactoryView.extend({
        name: 'giftcard',
        mod: 'main',
        initialize: function() {
            App.Views.FactoryView.prototype.initialize.apply(this, arguments);

            var view = this.createView('CoreRecaptcha', {
                    model: this.model,
                    mod: 'Main'});
            this.$('.recaptcha_view').append(view.el);
            this.subViews.push(view);
        },
        bindings: {
            '.number-input': 'value: cardNumber, events:["input"], restrictInput: "0123456789-", kbdSwitcher: "cardNumber", pattern: /^[\\d|-]{0,19}$/'
        },
        render: function() {
            var cardNumber, model = {}, self = this;
            model.cardNumber = this.model.escape('cardNumber');
            model.isFirefox = /firefox/i.test(navigator.userAgent);
            this.$el.html(this.template(model));

            var captcha = this.$('#id_captcha_value');
            inputTypeMask(captcha, /^\w{0,4}$/, ''); //#14495 bug
            cardNumber = this.$('.number-input');
            if (cssua.userAgent.mobile) {
                var ios_version_old = false;
                if (cssua.userAgent.ios && cssua.userAgent.ios.substr(0, 1) == 6) {
                    ios_version_old = true;
                }
                var hack = false;
                if (cssua.userAgent.android) {
                    /*
                     Hack for bug: https://code.google.com/p/android/issues/detail?id=24626.
                     Bug of Revel Systems: http://bugzilla.revelup.com/bugzilla/show_bug.cgi?id=5368.
                     */
                    if (check_android_old_version(cssua.userAgent.android)) { // checking version OS Android (old version is Android <= 4.2.1)
                        hack = true;
                        cardNumber.attr("type", "text");
                        cardNumber.focus(function () {
                            $(this).attr("type", "number");
                        });
                        cardNumber.blur(function () {
                            $(this).attr("type", "text");
                        });
                    }
                }
                if (!hack) {
                    if (ios_version_old) {
                        cardNumber.attr("type", "text");
                    }
                }
            }
        }
    });

    App.Views.CoreGiftCardView.CoreGiftCardProfileView = App.Views.CoreGiftCardView.CoreGiftCardMainView.extend({
        name: 'profile',
        mod: 'giftcard'
    })

    return new (require('factory'))(function() {
        App.Views.GiftCardView = {};
        App.Views.GiftCardView.GiftCardMainView = App.Views.CoreGiftCardView.CoreGiftCardMainView;
        App.Views.GiftCardView.GiftCardProfileView  = App.Views.CoreGiftCardView.CoreGiftCardProfileView;
    });
});
