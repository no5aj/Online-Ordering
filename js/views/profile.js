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

define(["factory"], function() {
    'use strict';

    function setCallback(action) {
        return function() {
            var cb = this.options[action];
            typeof cb == 'function' && cb();
        };
    }

    App.Views.CoreProfileView = {};

    App.Views.CoreProfileView.CoreProfileBasicDetailsView = App.Views.FactoryView.extend({
        name: 'profile',
        mod: 'basic_details',
        bindings: {
            '.first-name-label': 'classes: {"attention-text": checkError(errors_attrs, "first_name")}',
            '.first-name': 'value: firstLetterToUpperCase(first_name), events:["input"], trackCaretPosition: first_name, classes: {"field-error": checkError(errors_attrs, "first_name")}',
            '.last-name-label': 'classes: {"attention-text": checkError(errors_attrs, "last_name")}',
            '.last-name': 'value: firstLetterToUpperCase(last_name), events:["input"], trackCaretPosition: last_name, classes: {"field-error": checkError(errors_attrs, "last_name")}',
            '.email-label': 'classes: {"attention-text": checkError(errors_attrs, "email")}',
            '.email': 'value: email, events:["input"], classes: {"field-error": checkError(errors_attrs, "email")}',
            '.phone-label': 'classes: {"attention-text": checkError(errors_attrs, "phone")}',
            '.phone': 'value: phone, events: ["input"], restrictInput: "0123456789+", pattern: /^\\+?\\d{0,15}$/, classes: {"field-error": checkError(errors_attrs, "phone")}',
            '.profile-attention': 'classes: {stash: select(ui_show_attention, false, true)}'
        },
        initialize: function() {
            App.Views.FactoryView.prototype.initialize.apply(this, arguments);
            this.listenTo(this.model, 'onCheckSignUpData', this.setErrorsData, this);
            this.listenTo(this.model, 'onUserUpdate', this.setAttentionVisibility, this);
            this.setAttentionVisibility();
        },
        bindingFilters: {
            checkError: function(errors, field) {
                return (errors.indexOf(field) !== -1);
            }
        },
        bindingSources: {
            errors: function() {
                return new Backbone.Model({
                    attrs: []
                });
            }
        },
        computeds: {
            allFilled: {
                deps: ['first_name', 'last_name', 'email', 'phone'],
                get: function(first_name, last_name, email, phone) {
                    return Boolean(first_name && last_name && email && phone);
                }
            }
        },
        onEnterListeners: {
            ':el': 'onEnter'
        },
        onEnter: function() {
            var action = setCallback('applyChanges');
            this.getBinding('allFilled') && action.apply(this, arguments);
        },
        setAttentionVisibility: function() {
            this.setBinding('ui_show_attention', this.model.isLocked());
        },
        setErrorsData: function(data) {
            this.setBinding('errors_attrs', data ? data : []);
        }
    });

    App.Views.CoreProfileView.CoreProfileSignUpView = App.Views.CoreProfileView.CoreProfileBasicDetailsView.extend({
        name: 'profile',
        mod: 'sign_up',
        bindings: {
            '.password-label': 'classes: {"attention-text": checkError(errors_attrs, "password")}',
            '.password': 'value: password, events:["input"], classes: {"field-error": checkError(errors_attrs, "password")}',
            '.password-confirm': 'value: confirm_password, events:["input"]',
            '.passwords-mismatch': 'toggle: select(all(password, confirm_password), not(equal(password, confirm_password)), false)',
            '.accept-tou': 'checked: terms_accepted',
            '.checkbox-accept-tou': "attr: {checked: select(terms_accepted, 'checked', false)}",
            '.email-notifications': 'checked: email_notifications',
            '.checkbox-email-notifications': "attr: {checked: select(email_notifications, 'checked', false)}",
            '.push-notifications': 'checked: push_notifications',
            '.checkbox-push-notifications': "attr: {checked: select(push_notifications, 'checked', false)}",
            '.signup-btn': 'classes: {disabled: not(allFilled)}'
        },
        computeds: {
            allFilled: {
                deps: ['first_name', 'last_name', 'email', 'phone', 'password', 'confirm_password', 'terms_accepted'],
                get: function(first_name, last_name, email, phone, password, confirm_password, terms_accepted) {
                    return Boolean(first_name && last_name && email && phone && password && confirm_password && (password === confirm_password) && terms_accepted);
                }
            }
        },
        events: {
            'click .signup-btn:not(.disabled)': setCallback('signupAction'),
            'click .read-tou': 'readTermsOfUse'
        },
        readTermsOfUse: function(e) {
            e.preventDefault();
            var action = setCallback('readTermsOfUse');
            action.apply(this, arguments);
        },
        onEnter: function() {
            var action = setCallback('signupAction');
            this.getBinding('allFilled') && action.apply(this, arguments);
        }
    });

    App.Views.CoreProfileView.CoreProfileLogInView = App.Views.FactoryView.extend({
        name: 'profile',
        mod: 'log_in',
        initialize: function() {
            this.listenTo(this.model, 'onNotActivatedUser', function() {
                this.setBinding('ui_showAccountInactive', true);
                this.setBinding('ui_showActivationSent', false);
            });

            this.listenTo(this.model, 'onResendActivationSuccess', function() {
                this.setBinding('ui_showAccountInactive', false);
                this.setBinding('ui_showActivationSent', true);
            });

            this.listenTo(this.model, 'onLogin', setCallback('forceProfile'));

            App.Views.FactoryView.prototype.initialize.apply(this, arguments);
        },
        bindings: {
            '.email': 'value: email, events: ["input"]',
            '.pwd': 'value: password, events: ["input"]',
            '.login-btn': 'classes: {disabled: not(allFilled)}',
            '.account-inactive': 'css: { display: select(ui_showAccountInactive, "", "none") }',
            '.activation-sent': 'css: { display: select(ui_showActivationSent, "", "none") }'
        },
        bindingSources: {
            ui: function() {
                return new Backbone.Model({
                    showAccountInactive: false,
                    showActivationSent: false
                });
            }
        },
        computeds: {
            allFilled: {
                deps: ['email', 'password'],
                get: function(email, password) {
                    return Boolean(email && password);
                }
            }
        },
        events: {
            'click .login-btn:not(.disabled)': setCallback('loginAction'),
            'click .login-fb-btn': setCallback('loginFbAction'),
            'click .create-btn': setCallback('createAccount'),
            'click .guest-btn': setCallback('guestCb'),
            'click .forgot-password': setCallback('forgotPasswordAction'),
            'click .resend-activation': setCallback('resendAction')
        },
        onEnterListeners: {
            ':el': 'onEnter'
        },
        onEnter: function() {
            var action = setCallback('loginAction');
            this.getBinding('allFilled') && action.apply(this, arguments);
        }
    });

    App.Views.CoreProfileView.CoreProfileCreateView = App.Views.FactoryView.extend({
        name: 'profile',
        mod: 'create',
        bindings: {
            '.name': 'text: format("$1 $2", first_name, last_name)'
        },
        render: function() {
            App.Views.FactoryView.prototype.render.apply(this, arguments);

            this.subViews.push(App.Views.GeneratorView.create('Profile', {
                el: this.$('.address-box'),
                mod: 'AddressCreate',
                model: this.options.address
            }));

            return this;
        },
        onEnterListeners: {
            ':el': setCallback('createProfileAction')
        }
    });

    App.Views.CoreProfileView.CoreProfileMenuView = App.Views.FactoryView.extend({
        name: 'profile',
        mod: 'menu',
        bindings: {
            ':el': 'classes: {shown: header_showProfileMenu}',
            '.login-link': 'toggle: not(access_token)',
            '.logout-link': 'toggle: access_token',
            '.logged-as': 'toggle: access_token, html: loggedAs(first_name)',
            '.private-btn': 'classes: {"primary-text": access_token, "regular-text": not(access_token), disabled: not(access_token)}',
            '.payments-link': 'toggle: any(_settings_directory_saved_credit_cards, _settings_directory_saved_gift_cards)'
        },
        bindingFilters: {
            loggedAs: function(username) {
                return _loc.PROFILE_LOGGED_IN.replace('%s', username);
            }
        },
        events: {
            'click .login-link': setCallback('login_link'),
            'click .logout-link': setCallback('logout_link'),
            'click .settings-link:not(.disabled)': setCallback('settings_link'),
            'click .payments-link:not(.disabled)': setCallback('payments_link'),
            'click .profile-link:not(.disabled)': setCallback('profile_link'),
            'click .past-orders:not(.disabled)': setCallback('orders_link'),
            'click .close': setCallback('close_link')
        },
        onEnterListeners: {
            '.login-link': setCallback('login_link'),
            '.logout-link': setCallback('logout_link'),
            '.settings-link:not(.disabled)': setCallback('settings_link'),
            '.payments-link:not(.disabled)': setCallback('payments_link'),
            '.profile-link:not(.disabled)': setCallback('profile_link'),
            '.past-orders:not(.disabled)': setCallback('orders_link')
        }
    });

    App.Views.CoreProfileView.CoreProfileAddressView = App.Views.FactoryView.extend({
        name: 'profile',
        mod: 'address',
        tagName: 'li',
        className: 'address-item',
        initialize: function() {
            var id = this.model.get('id');
            // do not show not profile address (filled on the checkout screen)
            if (typeof id == 'string') {
                return;
            }

            this.listenTo(this.model.collection, 'toggleFolding', function(model, collapsed) {
                if (!collapsed && this.model != model) {
                    this.setBinding('ui_collapsed', true);
                }
            });

            App.Views.FactoryView.prototype.initialize.apply(this, arguments);

            if (this.getBinding('modelIndex') === 1 || this.model.get('id') === null) {
                this.setBinding('ui_collapsed', false);
                this.model.collection.trigger('toggleFolding', this.model, false);
            }
        },
        bindings: {
            '.remove-btn': 'classes: {hide: not(id)}',
            '.address__title-text': 'text: select(id, _loc.PROFILE_ADDRESS_DETAILS.replace("%s", modelIndex), _loc.PROFILE_ADD_NEW_ADDRESS)',
            '.expand': 'toggle: id, classes: {folded: ui_collapsed, expanded: not(ui_collapsed)}',
            '.address__header': 'classes: {collapsed: ui_collapsed, "primary-text": all(not(id), ui_collapsed), link: not(id)}',
            '.address__fields': 'css: {display: select(not(ui_collapsed), "", "none")}',
            '.address__default-checkbox': 'css: {display: select(id, "", "none")}',
            '.address__default': 'checked: is_primary',
            '.checkbox': 'attr: {checked: select(is_primary, "checked", false)}',
            '.country-row': 'classes: {required: all(not(country), any(street_1, street_2, city, state, province, zipcode))}', // country is the only required address field
            '.country-wrapper': 'classes: {placeholder: not(country)}',
            '.country': 'value: country, options: parseOptions(_lp_COUNTRIES)',
            '.state-row': 'toggle: equal(country, "US")',
            '.state-wrapper': 'classes: {placeholder: not(state)}',
            '.state': 'value: state, options: parseOptions(_lp_STATES)',
            '.street_1': 'value: firstLetterToUpperCase(street_1), events: ["input"], trackCaretPosition: street_1',
            '.street_2': 'value: firstLetterToUpperCase(street_2), events: ["input"], trackCaretPosition: street_2',
            '.city': 'value: firstLetterToUpperCase(city), events: ["input"], trackCaretPosition: city',
            '.province-row': 'toggle: equal(country, "CA")',
            '.province': 'value: firstLetterToUpperCase(province), events: ["input"], trackCaretPosition: province',
            '.zipcode-row .label': 'text: zipLabel',
            '.zipcode': 'value: zipcode, attr: {placeholder: zipLabel}, pattern: /^((\\w|\\s){0,20})$/' // all requirements are in Bug 33655
        },
        events: {
            'change .address__default': 'setDefaultAddress',
            'click .address__title': 'toggleFolding',
            'click .remove-btn': 'removeAddress',
        },
        bindingSources: {
            ui: function() {
                return new Backbone.Model({
                    collapsed: true
                });
            }
        },
        computeds: {
            /**
             * @returns {number} Address index, starting from 1.
             */
            modelIndex: {
                deps: ['$model'],
                get: function(model) {
                    return model.collection.indexOf(model) + 1;
                }
            },
            /**
             * Generates label and placeholder for zipcode field.
             * @returns {string}
             *   - "Zip Code" if selected country is the US, OR there is no selection, but establishment country is US;
             *   - "Postal Code" otherwise.
             */
            zipLabel: {
                deps: ['country'],
                get: function(country) {
                    if (country == 'US' || !country && App.Settings.address && App.Settings.address.country == 'US') {
                        return _loc.PROFILE_ZIP_CODE;
                    }
                    else {
                        return _loc.PROFILE_POSTAL_CODE;
                    }
                }
            },
        },
        bindingFilters: {
            parseOptions: function(data) {
                var result = [];
                if (!_.isObject(data)) {
                    return result;
                }
                for(var i in data) {
                    result.push({
                        label: data[i],
                        value: i
                    });
                }
                return result;
            }
        },
        onEnterListeners: {
            ':el': setCallback('applyChanges')
        },
        render: function() {
            App.Views.FactoryView.prototype.render.apply(this, arguments);
            var self = this;
            setTimeout(function() {
                !self.model.get('country') && self.$('.country').val('');
            }, 0); // fix silent autoselect in mobile browsers
        },
        setDefaultAddress: function(e) {
            if (e.target.checked) {
                this.model.collection.trigger('change:is_primary');
            }
            else {
                this.model.set('is_primary', true);
            }
        },
        toggleFolding: function() {
            var newValue = !this.getBinding('ui_collapsed');
            this.setBinding('ui_collapsed', newValue);
            this.model.collection.trigger('toggleFolding', this.model, newValue);
        },
        removeAddress: function() {
            var self = this;

            App.Data.errors.alert(
                _loc.PROFILE_ADDRESS_DELETE,
                false,
                false,
                {
                    isConfirm: true,
                    callback: function(confirmed) {
                        if (confirmed) {
                            self.model.collection.remove(self.model);
                            App.Data.customer.deleteAddress(self.model);
                        }
                    }
                });
        },
    });

App.Views.CoreProfileView.CoreProfileAddressCreateView = App.Views.FactoryView.extend({
    name: 'profile',
    mod: 'address_create',
    bindings: {
        '.country-row': 'classes: {required: all(not(country), any(street_1, street_2, city, state, province, zipcode))}', // country is the only required address field
        '.country-wrapper': 'classes: {placeholder: not(country)}',
        '.country': 'value: country, options: parseOptions(_lp_COUNTRIES)',
        '.state-row': 'toggle: equal(country, "US")',
        '.state-wrapper': 'classes: {placeholder: not(state)}',
        '.state': 'value: state, options: parseOptions(_lp_STATES)',
        '.street_1': 'value: firstLetterToUpperCase(street_1), events: ["input"], trackCaretPosition: street_1',
        '.street_2': 'value: firstLetterToUpperCase(street_2), events: ["input"], trackCaretPosition: street_2',
        '.city': 'value: firstLetterToUpperCase(city), events: ["input"], trackCaretPosition: city',
        '.province-row': 'toggle: equal(country, "CA")',
        '.province': 'value: firstLetterToUpperCase(province), events: ["input"], trackCaretPosition: province',
        '.zipcode-row .label': 'text: zipLabel',
        '.zipcode': 'value: zipcode, attr: {placeholder: zipLabel}, pattern: /^((\\w|\\s){0,20})$/' // all requirements are in Bug 33655
    },
    computeds: {
        /**
         * @returns {number} Address index, starting from 1.
         */
        modelIndex: {
            deps: ['$model'],
            get: function(model) {
                return model.collection.indexOf(model) + 1;
            }
        },
        /**
         * Generates label and placeholder for zipcode field.
         * @returns {string}
         *   - "Zip Code" if selected country is the US, OR there is no selection, but establishment country is US;
         *   - "Postal Code" otherwise.
         */
        zipLabel: {
            deps: ['country'],
            get: function(country) {
                if (country == 'US' || !country && App.Settings.address && App.Settings.address.country == 'US') {
                    return _loc.PROFILE_ZIP_CODE;
                }
                else {
                    return _loc.PROFILE_POSTAL_CODE;
                }
            }
        },
    },
    bindingFilters: {
        parseOptions: function(data) {
            var result = [];
            if (!_.isObject(data)) {
                return result;
            }
            for(var i in data) {
                result.push({
                    label: data[i],
                    value: i
                });
            }
            return result;
        }
    },
    onEnterListeners: {
        ':el': setCallback('applyChanges')
    },
    render: function() {
        App.Views.FactoryView.prototype.render.apply(this, arguments);
        var self = this;
        setTimeout(function() {
            !self.model.get('country') && self.$('.country').val('');
        }, 0); // fix silent autoselect in mobile browsers
    },
});

    App.Views.CoreProfileView.CoreProfileAddressesView = App.Views.FactoryView.extend({
        name: 'profile',
        mod: 'addresses',
        itemView: App.Views.CoreProfileView.CoreProfileAddressView,
        initialize: function() {
            App.Views.FactoryView.prototype.initialize.apply(this, arguments);
            this.listenTo(this.appData.customer, 'onUserAddressCreated', this.toggleNewAddress, this);
        },
        bindings: {
            '.addresses-list': 'collection: $collection',
            '.addresses__add': 'toggle: not(addingNewAddress)',
            //'.addresses__add .expand': 'text: select(addingNewAddress, "- ", "+ ")'
        },
        events: {
            'click .addresses__add': 'toggleNewAddress',
        },
        computeds: {
            addingNewAddress: {
                deps: ["$collection"],
                get: function(addresses) {
                    return addresses.some(function(model) {
                        return model.get('id') === null;
                    });
                }
            }
        },
        toggleNewAddress: function() {
            var addingNewAddress = this.getBinding('addingNewAddress');
            if (!addingNewAddress) {
                this.collection.add({});
            }
            else {
                var modelToRemove;
                this.collection.some(function(model) {
                    return _.isEqual(model.toJSON(), App.Models.CustomerAddress.prototype.defaults) && (modelToRemove = model);
                });
                modelToRemove && this.collection.remove(modelToRemove);
            }
        }
    });

    App.Views.CoreProfileView.CoreProfileEditView = App.Views.FactoryView.extend({
        name: 'profile',
        mod: 'edit',
        bindings: {
            '.update-btn': 'classes: {disabled: updateBtn_disabled}',
            '.successful-update': 'classes: {visible: ui_show_response}',
            '.profile-attention': 'classes: {stash: select(ui_show_attention, false, true)}',
            '.account-password-container': 'toggle: toggleChangePassword'
        },
        computeds: {
            toggleChangePassword: {
                deps: ['fb_token'],
                get: function(fb_token) {
                    return !(typeof fb_token === 'string' && fb_token.length);
                }
            }
        },
        events: {
            'click .update-btn:not(.disabled)': setCallback('updateAction')
        },
        initialize: function() {
            App.Views.FactoryView.prototype.initialize.apply(this, arguments);
            this.listenTo(this.model, 'onUserUpdate', this.setAttentionVisibility, this);
            this.setAttentionVisibility();
        },
        render: function() {
            App.Views.FactoryView.prototype.render.apply(this, arguments);

            var basicDetails = App.Views.GeneratorView.create('Profile', {
                el: this.$('.basic-details-box'),
                mod: 'BasicDetails',
                model: this.model
            });

            var accountPassword = App.Views.GeneratorView.create('Profile', {
                el: this.$('.account-password-box'),
                mod: 'AccountPassword',
                model: this.model
            });

            var accountNotifications = App.Views.GeneratorView.create('Profile', {
                el: this.$('.account-notifications-box'),
                mod: 'AccountNotifications',
                model: this.model
            });

            this.newAddress = new App.Models.CustomerAddress();
            var addresses = App.Views.GeneratorView.create('Profile', {
                el: this.$('.addresses'),
                mod: 'Addresses',
                collection: this.model.get('addresses'),
                newAddress: this.newAddress
            });

            this.subViews.push(basicDetails, addresses);

            return this;
        },
        onEnterListeners: {
            ':el': setCallback('updateAction')
        },
        setAttentionVisibility: function() {
            this.setBinding('ui_show_attention', this.model.isLocked());
        }
    });

    App.Views.CoreProfileView.CoreProfileAccountPasswordView = App.Views.FactoryView.extend({
        name: 'profile',
        mod: 'account_password',
        bindings: {
            '.current-password': 'value: password, events:["input"], pattern: /^.{0,255}$/',
            '.new-password': 'value: confirm_password, events:["input"], pattern: /^.{0,255}$/, attr: {type: getFieldType(show_password)}',
            '.account-password-field': 'classes: {required: any(password, confirm_password)}',
            '.show-password': 'text: getButtonText(show_password)',
            '.account-password-container': 'toggle: toggleChangePassword'
        },
        bindingFilters: {
            getFieldType: function(show_password) {
                return show_password ? 'text' : 'password';
            },
            getButtonText: function(show_password) {
                return show_password ? _loc.PROFILE_HIDE_PASSWORD : _loc.PROFILE_SHOW_PASSWORD;
            }
        },
        computeds: {
            toggleChangePassword: {
                deps: ['fb_token'],
                get: function(fb_token) {
                    return !(typeof fb_token === 'string' && fb_token.length);
                }
            }
        },
        events: {
            'click .show-password': 'setPasswordVisibility'
        },
        onEnterListeners: {
            ':el': 'onEnter'
        },
        onEnter: function() {
            var action = setCallback('changeAction'),
                password = this.model.get('password'),
                confirm_password = this.model.get('confirm_password');
            password && confirm_password && action.apply(this, arguments);
        },
        setPasswordVisibility: function() {
            var show_password = !this.model.get('show_password');
            this.model.set('show_password', show_password);
        }
    });

    App.Views.CoreProfileView.CoreProfilePWDResetView = App.Views.FactoryView.extend({
        name: 'profile',
        mod: 'reset_password',
        bindings: {
            '.email': 'value: email, events: ["input"], pattern: /^.{0,254}$/',
            '.reset-btn': 'classes: {disabled: not(email)}'
        },
        events: {
            'click .reset-btn': setCallback('resetAction')
        },
        onEnterListeners: {
            ':el': 'onEnter'
        },
        onEnter: function() {
            var action = setCallback('resetAction');
            this.model.get('email') && action.apply(this, arguments);
        }
    });

    App.Views.CoreProfileView.CoreProfileAccountNotificationsView = App.Views.FactoryView.extend({
        name: 'profile',
        mod: 'account_notifications',
        bindings: {
            '.email-notifications': 'checked: email_notifications',
            '.checkbox-email-notifications': "attr: {checked: select(email_notifications, 'checked', false)}",
            '.push-notifications': 'checked: push_notifications',
            '.checkbox-push-notifications': "attr: {checked: select(push_notifications, 'checked', false)}"
        }
    });

    App.Views.CoreProfileView.CoreProfilePanelView = App.Views.FactoryView.extend({
        name: 'profile',
        mod: 'panel',
        initialize: function() {
            this.listenTo(this.model, 'hidePanel', controlLinks(false, false, false, false));
            App.Views.FactoryView.prototype.initialize.apply(this, arguments);
        },
        bindings: {
            ':el': 'classes: {active: any(ui_showSignUp, ui_showLogIn, ui_showMenu, ui_showPWDReset)}',
            '.links': 'classes: {logged: access_token}',
            '.signup-link': 'toggle: not(access_token), classes: {"primary-text": not(ui_showSignUp), "regular-text": ui_showSignUp, active: ui_showSignUp}',
            '.login-link': 'toggle: not(access_token), classes: {"primary-text": not(ui_showLogIn), "regular-text": ui_showLogIn, active: ui_showLogIn}',
            '.close': 'toggle: any(ui_showSignUp, ui_showLogIn, ui_showMenu, ui_showPWDReset)',
            '.sign-up-box': 'toggle: ui_showSignUp, css: {height: signUpHeight}',
            '.log-in-box': 'toggle: ui_showLogIn',
            '.menu-items': 'toggle: ui_showMenu',
            '.logged-as': 'text: first_name, toggle: access_token',
            '.reset-password-box': 'toggle: ui_showPWDReset'
        },
        events: {
            'click .signup-link': controlLinks(true, false, false, false),
            'click .login-link': controlLinks(false, true, false, false),
            'click .logged-as': controlLinks(false, false, true, false),
            'click .close': controlLinks(false, false, false, false)
        },
        onEnterListeners: {
            '.signup-link': controlLinks(true, false, false, false),
            '.login-link': controlLinks(false, true, false, false),
            '.logged-as': controlLinks(false, false, true, false)
        },
        bindingSources: {
            ui: function() {
                return new Backbone.Model({
                    showSignUp: false,
                    showLogIn: false,
                    showMenu: false,
                    showPWDReset: false
                });
            }
        },
        computeds: {
            signUpHeight: {
                deps: ['ui_showSignUp'],
                get: function(show) {
                    if (show) {
                        var el = this.$('.sign-up-box'),
                            offsetTop = el.offset().top,
                            indentBottom = offsetTop,
                            elHeight = el.height(),
                            availableHeight = $(window).height() - offsetTop - indentBottom;

                        if (elHeight > availableHeight) {
                            return availableHeight;
                        }
                    }

                    return 'auto';
                }
            }
        },
        render: function() {
            App.Views.FactoryView.prototype.render.apply(this, arguments);

            // LogIn view
            var loginView = App.Views.GeneratorView.create('Profile', _.extend({}, this.options, {
                el: this.$('.log-in-box'),
                mod: 'LogIn',
                model: this.model,
                forgotPasswordAction: controlLinks(false, false, false, true).bind(this)
            }));

            // SignUp view
            var signupView = App.Views.GeneratorView.create('Profile', _.extend({}, this.options, {
                el: this.$('.sign-up-box'),
                mod: 'SignUp',
                model: this.model
            }));

            // Menu view
            var menuView = App.Views.GeneratorView.create('Profile', _.extend({}, this.options, {
                el: this.$('.menu-items'),
                mod: 'Menu',
                header: new Backbone.Model({showProfileMenu: true})
            }));

            var resetPWD = App.Views.GeneratorView.create('Profile', _.extend({}, this.options, {
                el: this.$('.reset-password-box'),
                mod: 'PWDReset',
                resetAction: this.options.resetAction
            }));

            this.subViews.push(loginView, signupView, menuView, resetPWD);

            return this;
        },
        clickSignupLink: function() {
            controlLinks(true, false, false, false);
        }
    });

    App.Views.CoreProfileView.CoreProfileOwnerContactsView = App.Views.FactoryView.extend({
        name: 'profile',
        mod: 'owner_contacts',
        bindings: {
            ':el': 'toggle: any(_settings_directory_owner_contact, _settings_directory_owner_website)',
            '.contact-info': 'toggle: _settings_directory_owner_contact',
            '.website-info': 'toggle: _settings_directory_owner_website',
            '.phone': 'text: _settings_directory_owner_contact, attr: {href: format("tel:$1", _settings_directory_owner_contact)}',
            '.website': 'text: _settings_directory_owner_website, attr: {href: _settings_directory_owner_website}'
        }
    });

    App.Views.CoreProfileView.CoreProfilePaymentSelectionView = App.Views.FactoryView.extend({
        name: 'profile',
        mod: 'payment_selection',
        tagName: 'li',
        bindings: {
            ':el': 'classes: {selected: selected}',
            '.card-number': 'text: last_digits',
            '.card-type': 'text: creditCardType(_lp_CREDIT_CARD_TYPES, card_type)'
        },
        bindingFilters: {
            creditCardType: creditCardType
        },
        events: {
            'click': 'select'
        },
        select: function() {
            var isSelect = !this.model.get('selected');
            isSelect && this.model.set('selected', isSelect);
        }
    });

    App.Views.CoreProfileView.CoreProfilePaymentsSelectionView = App.Views.FactoryView.extend({
        initialize: function() {
            App.Views.FactoryView.prototype.initialize.apply(this, arguments);

            var primaryPayment = this.collection.getPrimaryPayment();
            if (primaryPayment) {
                primaryPayment.setPrimaryAsSelected();
            }
        },
        name: 'profile',
        mod: 'payments_selection',
        bindings: {
            '.payments-list': 'collection: $collection'
        },
        itemView: App.Views.CoreProfileView.CoreProfilePaymentSelectionView,
        events: {
            'click .add-cc': setCallback('addCreditCard')
        }
    });

    App.Views.CoreProfileView.CoreProfilePaymentEditionView = App.Views.FactoryView.extend({
        initialize: function()
        {
            var self = this,
                customer = this.options.collectionView.options.customer;

            App.Views.FactoryView.prototype.initialize.apply(this, arguments);

            this.listenTo(this.model, 'change:is_primary', function(model) {
                if (model.get('is_primary')) {
                    customer.trigger('change_cards', self.model.checkAttributesDiff());
                }
            });

            return this;
        },
        name: 'profile',
        mod: 'payment_edition',
        tagName: 'li',
        bindings: {
            '.card-number': 'text: last_digits',
            '.card-type': 'text: creditCardType(_lp_CREDIT_CARD_TYPES, card_type)',
            '.card-holder': 'value: getCardHolder(first_name, last_name)',
            '.card-num': 'value: getCardNumber(last_digits)',
            '.card-default': 'checked: is_primary',
            '.checkbox': "attr: {checked: select(is_primary, 'checked', false)}"
        },
        bindingFilters: {
            creditCardType: creditCardType,

            getCardHolder: function(first_name, last_name) {
                return first_name + ' ' + last_name;
            },
            getCardNumber: function(last_digits) {
                return '**** **** **** ' + last_digits;
            }
        },
        events: {
            'click .remove-btn': 'removeToken',
            'change .card-default': 'setDefaultCard'
        },
        removeToken: function() {
            this.options.collectionView.options.removeToken(this.model.get('id'));
        },
        setDefaultCard: function(e) {
            if (e.target.checked) {
                this.model.collection.trigger('change:is_primary');
            }
            else {
                this.model.set('is_primary', true);
            }
        }
    });

    App.Views.CoreProfileView.CoreProfilePaymentsEditionView = App.Views.FactoryView.extend({
        name: 'profile',
        mod: 'payments_edition',
        bindings: {
            '.payments-list': 'collection: $collection'
        },
        itemView: App.Views.CoreProfileView.CoreProfilePaymentEditionView
    });

    App.Views.CoreProfileView.CoreProfileGiftCardSelectionView = App.Views.FactoryView.extend({
        name: 'profile',
        mod: 'gift_card_selection',
        tagName: 'li',
        bindings: {
            ':el': 'classes: {selected: selected}',
            '.card-number': 'text: cardNumber',
            '.balance-line': 'toggle: not(equal(remainingBalance, null))',
            '.balance-value': 'text: currencyFormat(remainingBalance)'
        },
        bindingFilters: {
            creditCardType: creditCardType
        },
        events: {
            'click': 'select'
        },
        select: function() {
            var isSelect = !this.model.get('selected');
            isSelect && this.model.set('selected', isSelect);
        }
    });

    App.Views.CoreProfileView.CoreProfileGiftCardsSelectionView = App.Views.FactoryView.extend({
        name: 'profile',
        mod: 'gift_cards_selection',
        bindings: {
            '.gift-cards-list': 'collection: $collection'
        },
        itemView: App.Views.CoreProfileView.CoreProfileGiftCardSelectionView,
        events: {
            'click .add-gift-card': setCallback('addGiftCard')
        }
    });

    App.Views.CoreProfileView.CoreProfileGiftCardEditionView = App.Views.FactoryView.extend({
        name: 'profile',
        mod: 'gift_card_edition',
        tagName: 'li',
        bindings: {
            '.card-number': 'text: cardNumber',
            '.balance-line': 'toggle: not(equal(remainingBalance, null))',
            '.balance-value': 'text: currencyFormat(remainingBalance)'
        },
        events: {
            'click .remove-btn': 'unlinkGiftCard'
        },
        unlinkGiftCard: function() {
            this.options.collectionView.options.unlinkGiftCard(this.model);
        }
    });

    App.Views.CoreProfileView.CoreProfileGiftCardsEditionView = App.Views.FactoryView.extend({
        name: 'profile',
        mod: 'gift_cards_edition',
        initialize: function() {
            var self = this;
            App.Views.FactoryView.prototype.initialize.apply(this, arguments);
            this.listenTo(this.options.newCard, "change:captchaValue change:cardNumber", function() {
                self.options.customer.trigger('change_cards', this.options.newCard.check());
            });
        },
        events: {
            'click .add_gift_card_title': 'hide_show_NewGiftCard'
        },
        bindings: {
            '.gift-cards-list': 'collection: $collection',
            '.add_gift_card_title .plus_sign': 'text:select(newCard_add_new_card,"- ","+ ")',
            '.new_gift_card': "toggle:newCard_add_new_card"
        },
        itemView: App.Views.CoreProfileView.CoreProfileGiftCardEditionView,
        hide_show_NewGiftCard: function() {
            var card = this.options.newCard,
                cur_add_new_card = !card.get('add_new_card');

            card.set('add_new_card', cur_add_new_card);

            if (cur_add_new_card) {
                if (!this.newCardView) {
                  this.newCardView = App.Views.GeneratorView.create('GiftCard', {
                    el: this.$('.new_gift_card'),
                    model: this.options.newCard,
                    mod: 'Profile',
                    cacheId: true });
                }
                this.options.customer.trigger('change_cards', this.options.newCard.check());
            }
        }
    });

    App.Views.CoreProfileView.CoreProfileRewardCardSelectionView = App.Views.FactoryView.extend({
        name: 'profile',
        mod: 'reward_card_selection',
        tagName: 'li',
        bindings: {
            ':el': 'classes: {selected: selected}',
            '.card-number': 'text: number',
            '.apply-link': 'text: select(selected, _lp_CHECKOUT_SEE_REWARDS, _lp_CHECKOUT_APPLY)'
        },
        events: {
            'click': 'select',
            'click .apply-link': 'onApply'
        },
        select: function() {
            if (!this.model.get('selected')) {
                this.onApply();
            }
        },
        onApply: function(event) {
            if (event) {
                event.stopImmediatePropagation();
                event.preventDefault();
            }
            this.options.collectionView.options.applyRewardCard(this.model);
        }
    });

    App.Views.CoreProfileView.CoreProfileRewardCardsSelectionView = App.Views.FactoryView.extend({
        name: 'profile',
        mod: 'reward_cards_selection',
        bindings: {
            '.reward-cards-list': 'collection: $collection'
        },
        itemView: App.Views.CoreProfileView.CoreProfileRewardCardSelectionView
    });

    App.Views.CoreProfileView.CoreProfileRewardCardEditionView = App.Views.FactoryView.extend({
        name: 'profile',
        mod: 'reward_card_edition',
        tagName: 'li',
        bindings: {
            '.card-number': 'text: number'
        },
        events: {
            'click .remove-btn': 'unlinkRewardCard',
        },
        unlinkRewardCard: function() {
            this.options.collectionView.options.unlinkRewardCard(this.model);
        }
    });

    App.Views.CoreProfileView.CoreProfileRewardCardsEditionView = App.Views.FactoryView.extend({
        name: 'profile',
        mod: 'reward_cards_edition',
        initialize: function() {
            var self = this;
            App.Views.FactoryView.prototype.initialize.apply(this, arguments);
            this.listenTo(this.options.newCard, "change:captchaValue change:number", function() {
                self.options.customer.trigger('change_cards', this.options.newCard.check());
            });

            this.listenTo(this.options.customer.get('rewardCards'), "add remove reset", function() {
                self.options.customer.trigger('change:rewardCards');
            });
        },
        events: {
            'click .add_reward_card_title': 'hide_show_NewRewardCard'
        },
        bindings: {
            '.reward-cards-list': 'collection: $collection',
            '.add_reward_card_title': 'toggle:add_reward_card_link',
            '.add_reward_card_title .plus_sign': 'text:select(newCard_add_new_card,"- ","+ ")',
            '.new_reward_card': "toggle:newCard_add_new_card"
        },
        computeds: {
            add_reward_card_link: function() {
                return this.getBinding('customer_rewardCards').length == 0;
            }
        },
        itemView: App.Views.CoreProfileView.CoreProfileRewardCardEditionView,
        hide_show_NewRewardCard: function() {
            var card = this.options.newCard,
                cur_add_new_card = !card.get('add_new_card');

            card.set('add_new_card', cur_add_new_card);

            if (cur_add_new_card) {
                if (!this.newCardView) {
                  this.newCardView = App.Views.GeneratorView.create('Rewards', {
                    el: this.$('.new_reward_card'),
                    model: this.options.newCard,
                    mod: 'CardProfile',
                    customer: this.options.customer,
                    cacheId: true });
                }
                this.options.customer.trigger('change_cards', this.options.newCard.check());
            }
        }
    });


    App.Views.CoreProfileView.CoreProfilePaymentsView = App.Views.FactoryView.extend({
        name: 'profile',
        mod: 'payments',
        initialize: function() {
            App.Views.FactoryView.prototype.initialize.apply(this, arguments);
            this.listenTo(this.model, 'change_cards', this.resetUpdateStatus);
            this.listenTo(this.model, 'payments_save_cards', this.onUpdate);
        },
        events: {
            'click .update-btn':'onUpdate'
        },
        bindings: {
            '.left-side': 'classes: {hidden: not(_settings_directory_saved_credit_cards), "border-none": not(_settings_directory_saved_gift_cards), "fl-left": _settings_directory_saved_gift_cards}',
            '.right-side': 'classes: {hidden: not(_settings_directory_saved_gift_cards)}',
            '.successful-update': 'classes: {visible: ui_show_response}',
            '.btn.update-btn': 'classes: {disabled: update_disabled}'
        },
        computeds: {
            update_disabled: {
                deps: ['ui_check_update_btn'],
                get: function() {
                    var self = this, req,
                        collection = this.model.payments,
                        primaryPaymentsModel = collection ? collection.getPrimaryPayment() : undefined;
                    var ret1 = primaryPaymentsModel ? primaryPaymentsModel.checkAttributesDiff() : {status: 'ERROR'},
                        ret2 = this.newGiftCard ? this.newGiftCard.check() : {status: 'ERROR'},
                        ret3 = this.newRewardCard ? this.newRewardCard.check() : {status: 'ERROR'};

                    return !(ret1.status == 'OK' || ret2.status == 'OK' || ret3.status == 'OK');
                }
            }
        },
        init_update_btn_value: function() {
            var self = this;
            this.options.ui.set('check_update_btn', true);
            this.listenTo(this.model, 'change_cards', function() {
                setTimeout( function() { self.getBinding('$ui').trigger('change:check_update_btn') }, 1);
            });
        },
        render: function() {
            App.Views.FactoryView.prototype.render.apply(this, arguments);

            if (this.model.payments) {
                var paymentsEdition = App.Views.GeneratorView.create('Profile', {
                    el: this.$('.payments-box'),
                    mod: 'PaymentsEdition',
                    collection: this.model.payments,
                    removeToken: this.options.removeToken,
                    changeToken: this.options.changeToken,
                    customer: this.options.model
                });
                this.subViews.push(paymentsEdition);
            }

            if (this.model.giftCards) {
                this.newGiftCard = new App.Models.GiftCard({add_new_card: false});
                var giftCardsEdition = App.Views.GeneratorView.create('Profile', {
                    el: this.$('.gift-cards-box'),
                    mod: 'GiftCardsEdition',
                    collection: this.model.giftCards,
                    unlinkGiftCard: this.options.unlinkGiftCard,
                    newCard: this.newGiftCard,
                    customer: this.options.model
                });
                this.subViews.push(giftCardsEdition);
            }

            if (this.model.get('rewardCards')) {
                this.newRewardCard = new App.Models.RewardsCard({add_new_card: false});
                var rewardCardsEdition = App.Views.GeneratorView.create('Profile', {
                    el: this.$('.reward-cards-box'),
                    mod: 'RewardCardsEdition',
                    collection: this.model.get('rewardCards'),
                    unlinkRewardCard: this.options.unlinkRewardCard,
                    newCard: this.newRewardCard,
                    customer: this.options.model
                });
                this.subViews.push(rewardCardsEdition);
            }
            return this;
        },
        onUpdate: function() {
            // Saving Gift Cards data
            var clone, req, reqRewards, self = this;
            this.resetUpdateStatus();
            if (this.newGiftCard.get('cardNumber')) {
                clone = this.newGiftCard.clone();
                req = this.addCardToServer(clone);
                if (req) {
                    req.always(function(){
                        self.newGiftCard.trigger("onResetData");
                    });
                }
            }

            // Saving Credit Cards data
            this.saveCreditCard();

            // Saving Reward Cards data
            if (this.newRewardCard.get('number')) {
                clone = this.newRewardCard.clone();
                reqRewards = this.saveRewardCard(clone);
                if (reqRewards) {
                    reqRewards.always(function(){
                        self.newRewardCard.trigger("onResetData");
                    });
                }
            }
        },
        saveCreditCard: function()
        {
            var self = this, req,
                mainModel = App.Data.mainModel,
                collection = this.model.payments,
                primaryPaymentsModel = collection.getPrimaryPayment();

            if (primaryPaymentsModel) {
                req = this.options.changeToken(primaryPaymentsModel.id);

                if (req)
                {
                    this.incrementUpdateCounter();
                    mainModel.trigger('loadStarted');

                    req.done(function() {
                        primaryPaymentsModel.setPrimaryAsSelected();
                        self.checkUpdateStatus();
                    }).always(mainModel.trigger.bind(mainModel, 'loadCompleted'));
                }
            }
        },
        addCardToServer: function(giftcard) {
            var self = this,
                mainModel = App.Data.mainModel,
                req = this.model.linkGiftCard(giftcard);

            this.listenTo(giftcard, 'onLinkError', App.Data.errors.alert.bind(App.Data.errors));
            if (req) {
                this.incrementUpdateCounter();
                mainModel.trigger('loadStarted');
                req.done(function(data){
                    if (data && data.status == 'OK') {
                        self.checkUpdateStatus();
                        self.newGiftCard.set({ add_new_card: false, cardNumber: '', remainingBalance: null });
                        self.newGiftCard.trigger('updateCaptcha');
                    }

                }).always(mainModel.trigger.bind(mainModel, 'loadCompleted'));
                return req;
            }
        },
        saveRewardCard: function(rewardcard) {
            var self = this,
                mainModel = App.Data.mainModel,
                req = this.model.linkRewardCard(rewardcard);
            this.listenTo(rewardcard, 'onLinkError', onError);
            if (req) {
                this.incrementUpdateCounter();
                mainModel.trigger('loadStarted');
                req.done(function(data){
                    if (data && data.status == 'OK') {
                        self.checkUpdateStatus();
                        self.options.myorder.rewardsCard.selectRewardCard(rewardcard);
                        self.newRewardCard.set({ add_new_card: false, number: ''});
                        self.newRewardCard.trigger('updateCaptcha');
                    }

                }).error(function(){
                    onError();
                }).always(mainModel.trigger.bind(mainModel, 'loadCompleted'));
                return req;
            }

            function onError(errorMsg) {
                if (errorMsg){
                    App.Data.errors.alert(errorMsg);
                }
            }
        },
        checkUpdateStatus: function() {
            if(--this.updateCounter <= 0) {
                this.options.ui.set('show_response', true);
                App.Data.header.set('enableLink', false);
            }
        },
        resetUpdateStatus: function() {
            this.options.ui.set('show_response', false);
            this.updateCounter = 0;
        },
        incrementUpdateCounter: function() {
            this.updateCounter++;
        }
    });

    /**
     * this.model is instance of App.Models.PaymentToken.
     */
    App.Views.CoreProfileView.CoreProfilePaymentCVVView = App.Views.FactoryView.extend({
        name: 'profile',
        mod: 'payment_cvv',
        bindings: {
            '.cvv': 'value: cvv, events: ["input"], restrictInput: "0123456789", pattern: /^\\d*$/'
        }
    });

    App.Views.CoreProfileView.CoreProfileTermsOfUseView = App.Views.FactoryView.extend({
        name: 'profile',
        mod: 'terms_of_use'
    });

    App.Views.CoreProfileView.CoreProfileOrderItemView = App.Views.FactoryView.extend({
        name: 'profile',
        mod: 'order_item',
        tagName: 'li',
        bindings: {
            '.name': 'text: name',
            '.qty': 'text: quantity',
            '.price': 'text: currencyFormat(price)'
        },
        computeds: {
            name: function() {
                var product = this.model.get_product(),
                    modifiers = this.model.get_modifiers(),
                    sizeModifier = modifiers && modifiers.getSizeModel(),
                    name = product.get('name');

                if (sizeModifier) {
                    name = sizeModifier.get('name') + ' ' + name;
                }

                return name;
            },
            price: function() {
                var product = this.model.get_product();
                return product.get('has_upsell') ? product.get('combo_price') : this.model.get('sum');
            }
        }
    })

    App.Views.CoreProfileView.CoreProfileOrdersItemView = App.Views.FactoryView.extend({
        name: 'profile',
        mod: 'orders_item',
        tagName: 'li',
        bindings: {
            '.show-items': 'classes: {collapse: ui_collapse}',
            '.order-items-box': 'classes: {hide: not(ui_collapse)}',
            '.created-at': 'text: created_date',
            '.order-id': 'text: id',
            '.qty': 'text: items_qty',
            '.subtotal': 'text: currencyFormat(subtotal)',
            '.animate-spin': 'classes: {hide: length($orderItems)}',
            '.items': 'collection: $orderItems, itemView: "itemView"'
        },
        itemView: function(opts) {
            return App.Views.GeneratorView.create('Profile', _.extend(opts, {
                mod: 'OrderItem',
                order: opts.collectionView.model
            }), opts.model.get('id'));
        },
        bindingSources: {
            ui: function() {
                return new Backbone.Model({collapse: false});
            }
        },
        events: {
            'click .show-items': 'showItems',
            'click .btn': 'reorder'
        },
        onEnterListeners: {
            '.show-items': 'showItems',
            '.btn': 'reorder'
        },
        showItems: function() {
            var ui = this.getBinding('$ui');
            ui.set('collapse', !ui.get('collapse'));
            this.options.customer.getOrderItems(this.model);
        },
        reorder: function() {
            this.options.customer.trigger('onReorder', this.model.get('id'));
        }
    });

    App.Views.CoreProfileView.CoreProfileOrdersView = App.Views.FactoryView.extend({
        name: 'profile',
        mod: 'orders',
        bindings: {
            '.orders-empty': 'toggle: noOrders',
            '.orders-list': 'collection: $collection, itemView: "itemView"'
        },
        computeds: {
            noOrders: {
                deps: ['$collection'],
                get: function($collection) {
                    var ordersRequest = this.model.ordersRequest;
                    if (ordersRequest && ordersRequest.state() == 'resolved' && !$collection.length) {
                        return true;
                    }
                }
            }
        },
        itemView: function(opts) {
            // Do not use `this` keyword here.
            // It refers to new created object.
            return App.Views.GeneratorView.create('Profile', _.extend(opts, {
                mod: 'OrdersItem',
                customer: opts.collectionView.model,
                orderItems: opts.model.get('items')
            }), opts.model.get('id'));
        }
    });

    function controlLinks(showSignUp, showLogIn, showMenu, showPWDReset) {
        return function() {
            this.getBinding('$ui').set({
                showSignUp: showSignUp,
                showLogIn: showLogIn,
                showMenu: showMenu,
                showPWDReset: showPWDReset
            });

            if (showSignUp) {
                this.model.set('terms_accepted', false);
            }
        };
    }

    function creditCardType(types, card_type) {
        var code = _.invert(ACCEPTABLE_CREDIT_CARD_TYPES)[card_type]
        return types[code];
    }

    return new (require('factory'))(function() {
        App.Views.ProfileView = {};
        App.Views.ProfileView.ProfileBasicDetailsView = App.Views.CoreProfileView.CoreProfileBasicDetailsView;
        App.Views.ProfileView.ProfileSignUpView = App.Views.CoreProfileView.CoreProfileSignUpView;
        App.Views.ProfileView.ProfileLogInView = App.Views.CoreProfileView.CoreProfileLogInView;
        App.Views.ProfileView.ProfileCreateView = App.Views.CoreProfileView.CoreProfileCreateView;
        App.Views.ProfileView.ProfileEditView = App.Views.CoreProfileView.CoreProfileEditView;
        App.Views.ProfileView.ProfileAddressView = App.Views.CoreProfileView.CoreProfileAddressView;
        App.Views.ProfileView.ProfileAddressesView = App.Views.CoreProfileView.CoreProfileAddressesView;
        App.Views.ProfileView.ProfileAddressCreateView = App.Views.CoreProfileView.CoreProfileAddressCreateView;
        App.Views.ProfileView.ProfileAccountPasswordView = App.Views.CoreProfileView.CoreProfileAccountPasswordView;
        App.Views.ProfileView.ProfilePWDResetView = App.Views.CoreProfileView.CoreProfilePWDResetView;
        App.Views.ProfileView.ProfileAccountNotificationsView = App.Views.CoreProfileView.CoreProfileAccountNotificationsView;
        App.Views.ProfileView.ProfileMenuView = App.Views.CoreProfileView.CoreProfileMenuView;
        App.Views.ProfileView.ProfilePanelView = App.Views.CoreProfileView.CoreProfilePanelView;
        App.Views.ProfileView.ProfileOwnerContactsView = App.Views.CoreProfileView.CoreProfileOwnerContactsView;
        App.Views.ProfileView.ProfilePaymentSelectionView = App.Views.CoreProfileView.CoreProfilePaymentSelectionView;
        App.Views.ProfileView.ProfilePaymentsSelectionView = App.Views.CoreProfileView.CoreProfilePaymentsSelectionView;
        App.Views.ProfileView.ProfilePaymentEditionView = App.Views.CoreProfileView.CoreProfilePaymentEditionView;
        App.Views.ProfileView.ProfilePaymentsEditionView = App.Views.CoreProfileView.CoreProfilePaymentsEditionView;
        App.Views.ProfileView.ProfilePaymentsView = App.Views.CoreProfileView.CoreProfilePaymentsView;
        App.Views.ProfileView.ProfileGiftCardSelectionView = App.Views.CoreProfileView.CoreProfileGiftCardSelectionView;
        App.Views.ProfileView.ProfileGiftCardsSelectionView = App.Views.CoreProfileView.CoreProfileGiftCardsSelectionView;
        App.Views.ProfileView.ProfileGiftCardEditionView = App.Views.CoreProfileView.CoreProfileGiftCardEditionView;
        App.Views.ProfileView.ProfileGiftCardsEditionView = App.Views.CoreProfileView.CoreProfileGiftCardsEditionView;
        App.Views.ProfileView.ProfileRewardCardSelectionView = App.Views.CoreProfileView.CoreProfileRewardCardSelectionView;
        App.Views.ProfileView.ProfileRewardCardsSelectionView = App.Views.CoreProfileView.CoreProfileRewardCardsSelectionView;
        App.Views.ProfileView.ProfileRewardCardsEditionView = App.Views.CoreProfileView.CoreProfileRewardCardsEditionView;
        App.Views.ProfileView.ProfilePaymentCVVView = App.Views.CoreProfileView.CoreProfilePaymentCVVView;
        App.Views.ProfileView.ProfileTermsOfUseView = App.Views.CoreProfileView.CoreProfileTermsOfUseView;
        App.Views.ProfileView.ProfileOrderItemView = App.Views.CoreProfileView.CoreProfileOrderItemView;
        App.Views.ProfileView.ProfileOrdersItemView = App.Views.CoreProfileView.CoreProfileOrdersItemView;
        App.Views.ProfileView.ProfileOrdersView = App.Views.CoreProfileView.CoreProfileOrdersView;
    });
});