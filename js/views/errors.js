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

define(['backbone', 'factory'], function(Backbone) {
    'use strict';

    App.Views.CoreErrorsView = {};

    App.Views.CoreErrorsView.CoreErrorsMainView = App.Views.FactoryView.extend({
        name: 'errors',
        mod: 'main',
        initialize: function() {
            App.Views.FactoryView.prototype.initialize.apply(this, arguments);
            this.listenTo(this.model, 'showAlertMessage', this.alertMessage); // user notification
            this.listenTo(this.model, 'hideAlertMessage', this.hideAlertMessage); // hide user notification
            this.listenTo(this.model, 'change:btnDisabled1', this.disableOKBtn, this);

            if (typeof this.model.get('initialize') === 'function') {
                this.model.get('initialize')(this);
            }
        },
        render: function() {
            App.Views.FactoryView.prototype.render.apply(this, arguments);
            this.disableOKBtn();
            return this;
        },
        events: {
            'click #popup_ok': 'pressOKBtn',
            'click #popup_cancel': 'pressCancelBtn'
        },
        /**
         * 'OK' button was clicked.
         */
        pressOKBtn: function() {
            if (this.model.get('isConfirm') && this.model.get('callback')) {
                this.model.get('callback')(true);
            }
            this.hideAlertMessage(1); // hide user notification
            this.model.get('reloadPage') && reloadPageOnceOnline();
        },
        disableOKBtn: function() {
            var btn = this.$('#popup_ok'),
                disabledClass = 'disabled';

            if (this.model.get('btnDisabled1')) {
                btn.addClass(disabledClass);
            }
            else {
                btn.removeClass(disabledClass);
            }
        },
        /**
         * 'Cancel' button was clicked.
         */
        pressCancelBtn: function() {
            if (this.model.get('isConfirm') && this.model.get('callback')) {
                this.model.get('callback')(false);
            }
            this.hideAlertMessage(1); // hide user notification
            this.model.get('reloadPage') && reloadPageOnceOnline();
        },
        /**
         * User notification.
         */
        alertMessage: function() {
            var options = this.model.toJSON();

            if (this.model.get('defaultView')) {
                this.hideAlertMessage(2); // hide user notification
                this.$('#popup_message').removeClass('custom-view');
                this.render();
            } else if(options.customView instanceof Backbone.View) {
                this.hideAlertMessage(2); // hide user notification
                this.render();
                !options.typeIcon && this.$('#popup_content').removeClass('info warning');
                this.$('#popup_message').addClass('custom-view').append(options.customView.el);

            } else {
                this.$('#popup_message').removeClass('custom-view');
                customAlertMessage.call(this); // custom alert message
            }

            if (options.customClass) {
                this.$el.addClass(options.customClass);
            }

            /**
             * Custom alert message.
             */
            function customAlertMessage() {
                var alert = $('#alert'),
                    template = options.template ? options.template : 'alert';

                if ( $('#' + template + '-template' ).length == 0) {
                    this.model.set('defaultView', true);
                    this.alertMessage(); // user notification
                    return;
                } else {
                    this.hideAlertMessage(1); // hide user notification
                }

                if (alert.length == 0) {
                    alert = $('<div id="alert"> </div>').appendTo('body');
                }

                var data = {
                    errorServer: options.errorServer,
                    typeIcon: (options.typeIcon == 'info') ? 'info' : 'warning',
                    message: options.message,
                    isConfirm: options.isConfirm,
                    btnsSwap: options.confirm.btnsSwap,
                    cancelHide: options.confirm.cancelHide,
                    btnText1: options.btnText1,
                    btnText2: options.btnText2
                };

                var tmpl = template_helper2(template + '-template'); // helper of template for PayPal
                alert.html(tmpl(data));
                alert.addClass('ui-visible');
                alert.find('.alert_block').addClass('alert-background');

                if (options.isConfirm) {
                    $('.btnOk', alert).on('click keydown', function(e) {
                        if (e.type === 'keydown' && !this.pressedButtonIsEnter(e)) return;
                        options.callback && options.callback(true);
                    });
                    $('.btnCancel', alert).on('click keydown', function(e) {
                        if (e.type === 'keydown' && !this.pressedButtonIsEnter(e)) return;
                        options.callback && options.callback(false);
                    });
                }

                $('.btnOk, .btnCancel', alert).on('click keydown', function(e) {
                    if (e.type === 'keydown' && !this.pressedButtonIsEnter(e)) return;
                    this.hideAlertMessage(2); // hide user notification
                    options.reloadPage && reloadPageOnceOnline();
                }.bind(this));
            }
        },
        /**
         * Hide user notification.
         *
         * @param {number} id Type of user notification (1 - default alert message; 2 - custom alert message).
         */
        hideAlertMessage: function(id) {
            var func1 = function() {
                if (App.Views.Generator.enableCache) {
                    var customClass = this.model.get('customClass');
                    customClass && this.$el.removeClass(customClass);
                    this.removeFromDOMTree(); // remove the view from the DOM tree
                } else {
                    this.remove(); // remove the view
                }
            }.bind(this);
            var func2 = function() {
                var alert = $('#alert');
                if (alert.length > 0) {
                    alert.find('.alert_block').removeClass('alert-background');
                    alert.removeClass('ui-visible');
                }
            }
            switch (id) {
                case 1:
                    func1();
                    break;
                case 2:
                    func2();
                    break;
                default:
                    func1();
                    func2();
                    break;
            }
        }
    });
});