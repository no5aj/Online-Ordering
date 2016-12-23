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
  * Contains {@link App.Models.Settings} constructor.
  * @module settings
  * @requires module:backbone
  * @requires module:async
  * @see {@link module:config.paths actual path}
  */
define(["backbone", "async"], function(Backbone) {
    'use strict';

    /**
     * @class
     * @classdesc Represents a settings model.
     * @alias App.Models.Settings
     * @augments Backbone.Model
     * @example
     * // create a settings model
     * require(['settings'], function() {
     *     var settings = new App.Models.Settings();
     * });
     */
    App.Models.Settings = Backbone.Model.extend(
    /**
     * @lends App.Models.Settings.prototype
     */
    {
        /**
         * Initializes the model.
         */
        initialize: function() {
            var app = require('app');
            this.get_data_warehouse(); // selection of the data warehouse
            this.set('basePath', app.config.baseUrl.replace(/\/$/, '') || '.');
            this.set('coreBasePath', app.config.baseUrl.replace(/\/$/, '') || '.'); //it allways points to ../core for all skins and /dev/ or /core/ debug start url
            this.set('host', app.REVEL_HOST);
            this.set('host', app.REVEL_HOST);
            this.set('hostname', /^http[s]*:\/\/(.+)/.exec(app.REVEL_HOST)[1]); //it's the host w/o "http[s]://" substring
            this.ajaxSetup(); // AJAX-requests settings
            this.listenTo(this, 'change:establishment', this.load, this); // load app
        },
        /**
         * Loads the app.
         * @returns {object} Deferred object that tracks state of loading system and customer settings.
         */
        load: function() {
            var self = this;
            this.listenToOnce(this, 'change:settings_system', this.get_settings_main, this);
            this.once('changeSkin', this.setSkinPath); // set a skin path
            this.once('changeSkinPath', this.get_settings_for_skin); // get settings from file "settings.json" for current skin

            // fix for Bug 9344. Chrome v34.0.1847.131 crashes when reload page
            if(/Chrome\/34\.0\.1847\.(131|137)/i.test(window.navigator.userAgent))
                return App.Data.errors.alert(MSG.ERROR_CHROME_CRASH, true); // user notification

            return $.when(self.get_settings_system(), self.get_customer_settings());
        },
        /**
         * Contains attributes with default values.
         * @type {object}
         */
        defaults: {
            /**
             * Brand id.
             * @type {?number}
             * @default null
             */
            brand: null,
            /**
             * Establishment id.
             * @type {?number}
             * @default null
             */
            establishment: null,
            /**
             * Instance url w/o trailing slash.
             * @type {string}
             * @default ""
             */
            host: "",
            /**
             * Type of data warehouse:
             * - 0: the data warehouse disabled;
             * - 1: the data warehouse is "sessionStorage (HTML 5)";
             * - 2: the data warehouse is "Cookie (HTML 4)".
             * @type {number}
             * @default 0
             */
            storage_data: 0,
            /**
             * Skin name.
             * @type {string}
             * @default ""
             */
            skin: "", // weborder by default
            /**
             * Contains skin settings.
             * @type {object}
             * @enum
             */
            settings_skin: {
                /**
                 * Contains skin routing settings.
                 * @type {object}
                 */
                routing: {
                    /**
                     * Contains skin settings for 'errors' routing.
                     * @type {object}
                     */
                    errors: {
                        /**
                         * List of core css files to load on errors page.
                         * @type {Array}
                         * @default []
                         */
                        cssCore: [],
                        /**
                         * List of core templates to load on errors page.
                         * @type {Array}
                         * @default ['errors_core']
                         */
                        templatesCore: ['errors_core']
                    },
                    /**
                     * Contains skin settings for 'establishments' routing.
                     * @type {object}
                     */
                    establishments: {
                        /**
                         * List of core css files to load on establishments page.
                         * @type {Array}
                         * @default ['establishments'],
                         */
                        cssCore: ['establishments'],
                        /**
                         * List of core templates to load on establishments page.
                         * @type {Array}
                         * @default ['establishments']
                         */
                        templatesCore: ['establishments']
                    }
                }
            },
            /**
             * List of system settings.
             * @type {Object}
             * @default {}
             */
            settings_system: {},
            /**
             * Ajax timeout in milliseconds.
             * @type {Number}
             * @default 60000
             */
            timeout: 60000,
            /**
             * Indicates that app is in maintenance mode.
             * @type {Boolean}
             * @default false
             */
            isMaintenance: false,
            /**
             * Message to display in maintenance mode (it depends on error type).
             * @type {String}
             * @default ''
             */
            maintenanceMessage: '',
            /**
             * App version.
             * @type {Number}
             * @default 1.06
             */
            version: 1.06,
            /**
             * List of supported skins.
             * @type {Array}
             * @default []
             */
            supported_skins: []
        },
        /**
         * AJAX-requests settings.
         */
        ajaxSetup: function() {
            var self = this,
                errors = App.Data.errors;
            Backbone.$.ajaxSetup({
                timeout: self.get('timeout'),
                success: function(data) {
                    if (!data.status) {
                        errors.alert(MSG.ERROR_INCORRECT_AJAX_DATA, true, false, {
                            errorServer: true,
                            typeIcon: 'warning'
                        }); // user notification
                    } else {
                        switch (data.status) {
                            case 'OK':
                                if (typeof this.successResp === 'function') this.successResp(data.data);
                                break;
                            default:
                                if (typeof this.errorResp === 'function') {
                                    this.errorResp(data.data);
                                } else {
                                    errors.alert(data.errorMsg, true, false, {
                                        errorServer: true,
                                        typeIcon: 'warning'
                                    }); // user notification
                                }
                                break;
                        }
                    }
                },
                error: function(xhr) {
                    errors.alert(MSG.ERROR_SERVER_UNREACHED, true); // user notification
                },
                beforeSend: function(xhr) {
                    // prepend hostname for urls with relative links
                    if(!/^(http(s)?:\/\/)|\./.test(this.url)) {
                        this.url = self.get('host').replace(/(\/)?$/, '/') + this.url.replace(/^(\/)?/, '');
                    }
                    xhr.setRequestHeader('X-Requested-With', {
                        toString: function() { return ''; }
                    });
                    xhr.setRequestHeader("X-Revel-Client", App.Data.dirMode ? "RevelDirectory" : "RevelOnlineOrdering");
                }
            });
        },
        /**
         * Selection of the data warehouse.
         */
        get_data_warehouse: function() {
            /*
            0: the data warehouse disabled;
            1: the data warehouse is "sessionStorage (HTML 5)";
            2: the data warehouse is "Cookie (HTML 4)".
            */
            try {
                sessionStorage.private_browsing=false;
                this.set("storage_data", 1);
            } catch(error) {
                if (document.cookie) {
                    this.set("storage_data", 2);
                } else {
                    this.set("storage_data", 0);
                }
             }
        },
        /**
         * Determines whether the app is a mobile version.
         * If a device is Nexus 7 or a smaller, then the mobile version of the Weborder skin should be applied.
         * @return {boolean} Whether the app is a mobile version.
         */
        isMobileVersion: function() {
            var isMobileVersion = App.Skins.WEBORDER_MOBILE
                && 'matchMedia' in window
                && (window.devicePixelRatio ? window.devicePixelRatio > 1.33 : /IEMobile/i.test(navigator.userAgent))
                && !/ipad|Nexus\s?10/i.test(navigator.userAgent)
                && cssua.userAgent.mobile
                && (matchMedia('(orientation:portrait)').matches || matchMedia('(orientation:landscape)').matches);
            return isMobileVersion;
        },
        /**
         * Resolves app's skin.
         */
        get_settings_main: function() {
            var params = parse_get_params(),
                skin = params.skin || params.rvarSkin,
                settings = this.get('settings_system'),
                isUnknownSkin = !(skin && this.get('supported_skins').indexOf(skin) > -1),
                defaultSkin = (settings.layout_style == LayoutStyle.RETAIL) ? App.Skins.RETAIL : App.Skins.DEFAULT;

            // set alias to current skin
            App.skin = isUnknownSkin ? defaultSkin : skin;

            // convert skin to mobile version if necessary
            this.checkIfMobile(); //

            if (App.skin == App.Skins.RETAIL) settings.delivery_charge = 0; // if Retail skin set delivery_charge to 0

            this.set('skin', App.skin, {silent: true});
            this.trigger('change:skin');
            this.trigger('changeSkin');
        },
        /**
         * Preparing delivery charges
         */
        get_delivery_charges: function() {
            var settings = this.get('settings_system'),
                charges = settings.delivery_charges;

            if (typeof charges === 'object' && Object.keys(charges).length) {
                charges.sort(function(a, b) {
                    return a.amount - b.amount;
                });

                return charges;
            }

            return null;
        },

        /*
         * Converts desktop version of skin to mobile
         */
        checkIfMobile: function() {
            // convert `WEBORDER` skin to 'WEBORDER_MOBILE' for mobile devices
            if ((App.skin == App.Skins.WEBORDER || App.skin == App.Skins.RETAIL) && this.isMobileVersion())
                App.skin = App.Skins.WEBORDER_MOBILE;
        },
        /**
         * Gets settings from file "settings.json" for current skin.
         * Request parameters:
         * ```
         * url:  "/skins/<skin>/settings.json"
         * type: "GET"
         * ```
         * @returns {object} Deferred object.
         */
        get_settings_for_skin: function() {
            var self = this,
                load = $.Deferred(),
                version = is_minimized_version ? '?ver=' + autoVersion : '';
            $.ajax({
                url: self.get("skinPath") + "/settings.json" + version,
                dataType: "json",
                success: function(data) {
                    var settings_skin = {};
                    settings_skin.name_app = data.name_app;
                    settings_skin.img_default = (data.img_default) ? init_img(data.img_default) : "";
                    settings_skin.styles = data instanceof Object && data.styles instanceof Array ? data.styles : [];
                    settings_skin.scripts = data instanceof Object && data.scripts instanceof Array ? data.scripts : [];
                    settings_skin.routing = self.defaults.settings_skin.routing;
                    Backbone.$.extend(settings_skin.routing, data.routing);
                    settings_skin.color_schemes = data.color_schemes instanceof Array ? data.color_schemes : [];
                    self.set("settings_skin", settings_skin);
                    self.trigger('changeSettingsSkin');
                    var default_img = self.get_img_default();
                    $("<style>.img_default { background: url('" + default_img + "'); }</style>").appendTo("head");
                },
                complete: function() {
                    load.resolve();
                }
            });

            function init_img(data) {
                if(typeof data == 'string')
                    return self.get('img_path') + data;
                else if(Array.isArray(data))
                    return data.map(function(src) {
                        return self.get('img_path') + src;
                    });
                else
                    return '';
            }

            return load;
        },
        /**
         * Gets ID of current establishment.
         * @returns {number} Establishment id.
         */
        get_establishment: function() {
            var get_parameters = parse_get_params(), // get GET-parameters from address line
                establishment = parseInt(get_parameters.establishment || get_parameters.rvarEstablishment, 10);
            return establishment;
        },
        /**
         * Gets ID of current establishment (which could be changed by 'Change Store' feature).
         * @returns {number} Establishment id.
         */
        get_current_establishment: function() {
            return this.get('establishment') ?  this.get('establishment') : undefined;
        },
        /**
         * Gets system settings.
         * Request parameters:
         * ```
         * url:  "/weborders/system_settings/"
         * data: {establishment: %estId%}
         * type: "GET"
         * ```
         * @returns {object} Deferred object.
         */
        get_settings_system: function() {
            var self = this,
                color_scheme_key = 'color_scheme' + this.get('establishment'),
                saved_color_scheme = getData(color_scheme_key, true),
                settings_system = {
                    favicon_image: null,
                    address: {},
                    business_name: "",
                    email: "",
                    hide_images: false,
                    phone: "",
                    prevailing_surcharge: 0,
                    prevailing_tax: 0,
                    tax_country: "",
                    currency_symbol: "X",
                    order_notes_allow: true,
                    min_items: 1,
                    hide_products_description: false,
                    color_scheme: saved_color_scheme instanceof Object ? saved_color_scheme.color_scheme : 'Default',
                    scales: {
                        default_weighing_unit: "",
                        label_for_manual_weights: "",
                        number_of_digits_to_right_of_decimal: 0
                    },
                    type_of_service: ServiceType.TABLE_SERVICE,
                    layout_style: LayoutStyle.RESTAURANT,
                    default_dining_option: 'DINING_OPTION_TOGO',
                    accept_discount_code: true,
                    enable_quantity_modifiers: true,
                    enable_split_modifiers: true,
                    other_dining_option_details: null,
                    // for test (begin)
                    locales: {
                        en: 1427802271098,
                        ru: 1427802447190
                    },
                    // for test (end)
                    payment_processor: {
                        "moneris":false,
                        "paypal_mobile":false,
                        "adyen":false,
                        "paypal":false,
                        "worldpay":false,
                        "quickbooks":false,
                        "freedompay":false,
                        "mercury":false,
                        "gift_card":false,
                        "cash":false,
                        "usaepay":false,
                        "credit_card_button":false,
                        "credit_card_dialog":false,
                        //add all new payment processors here for consistency of new frontend with old Backend
                        "stanford":false,
                        "braintree":false,
                        "globalcollect":false
                    },
                    recaptcha_site_key: '6LcTkCETAAAAAO-aSGuRIl6Habqu3f0s8WeAvV5R', // for *.revelup.com domain
                    google_maps_api_key: '',
                    fb_app_id: '233118313739765' // for *.revelup.com domain
                },
                load = $.Deferred();

            if (App.Data.selectEstablishmentMode) {
                self.set({
                    settings_system: settings_system, // default settings
                    });
                return load.resolve();
            }
            $.ajax({
                url: self.get("host") + "/weborders/system_settings/",
                data: {
                    establishment: this.get("establishment")
                },
                dataType: "json",
                success: function(response) {
                    switch (response.status) {
                        case "OK":
                            var data = response.data;

                            if (!data.recaptcha_site_key) {
                                data.recaptcha_site_key = settings_system.recaptcha_site_key;
                            }

                            if (!data.fb_app_id) {
                                data.fb_app_id = settings_system.fb_app_id;
                            }

                            $.extend(true, settings_system, data);
                            self.set('brand', data.brand);
                            settings_system.about_images = settings_system.about_images || [];
                            settings_system.about_title = settings_system.about_title || "";
                            settings_system.about_description = settings_system.about_description || "";
                            settings_system.about_access_to_location = settings_system.about_access_to_location || "";
                            // phone (begin)
                            var prefix = "";
                            if (data.phone && data.phone.indexOf("+") === -1 && data.phone !== "") {
                                prefix = "+1"; // By defaut add +1 in the beginning of the phone number
                            }

                            settings_system.phone = prefix + data.phone;
                            // phone (end)

                            var state_province = "";
                            var country = ["AF", "AM", "AR", "BE", "BG", "BO", "BY", "CA", "CL", "CN", "CO", "CR", "CU", "DM", "DZ", "EC", "ES", "FI", "FJ", "GA", "GQ", "GR", "ID", "IE", "IR", "IT", "KE", "KG", "KH", "KR", "KZ", "MG", "NL", "NO", "PA", "PE", "PG", "PH", "PK", "PL", "RU", "RW", "SA", "SB", "ST", "TH", "TJ", "TM", "TR", "UA", "UZ", "VN", "VU", "ZA", "ZM"];
                            if ($.inArray(settings_system.address.country, country) !== -1) {
                                state_province = settings_system.address.province;
                            } else {
                                state_province = settings_system.address.state;
                            }
                            state_province = (state_province === null) ? "" : state_province;
                            settings_system.address.state_province = state_province;

                            var line_2 = "";
                            if (settings_system.address.line_2 !== "") {
                                line_2 += ", " + settings_system.address.line_2;
                            }

                            var full_address = settings_system.address.line_1 +
                                               line_2 + ", " +
                                               settings_system.address.city + ", " +
                                               settings_system.address.state_province + " " +
                                               settings_system.address.postal_code;

                            settings_system.address.full_address = $.trim(full_address);

                            settings_system.address.getRegion = function() {
                                return $.inArray(settings_system.address.country, country) !== -1
                                    ? settings_system.address.province
                                    : settings_system.address.state;
                            };

                            self.getRegion = function(address) {
                                return $.inArray(address.country, country) !== -1
                                    ? address.province
                                    : address.state;
                            };

                            var srvDate = new Date(settings_system.server_time);
                            var clientDate = new Date();

                            settings_system.time_zone_offset = settings_system.time_zone_offset * 1000 || 0;

                            // create the delta in ms. between server and client by time_zone offset:
                            settings_system.server_time = settings_system.time_zone_offset + (new Date()).getTimezoneOffset() * 60 * 1000;
                            // add the delta in ms. between server and client times set:
                            settings_system.server_time +=  srvDate.getTime() - clientDate.getTime();
                            settings_system.geolocation_load = $.Deferred();

                            // fix for bug 7233
                            if(settings_system.delivery_for_online_orders) {
                                if(!(settings_system.delivery_charge >= 0))
                                    settings_system.delivery_charge = 0;
                                if(!(settings_system.estimated_delivery_time >= 0))
                                    settings_system.estimated_delivery_time = 0;
                                if(!(settings_system.max_delivery_distance >= 0))
                                    settings_system.max_delivery_distance = 0;
                                if(!(settings_system.min_delivery_amount >= 0))
                                    settings_system.min_delivery_amount = 0;
                            }

                            if (_.isArray(settings_system.delivery_post_code_lookup) && settings_system.delivery_post_code_lookup[0]) {
                                //format codes for better presentation
                                var  codes = settings_system.delivery_post_code_lookup[1];
                                if (codes) {
                                    codes = $.map(codes.split(","), $.trim);
                                    settings_system.delivery_post_code_lookup[1] = codes.join(", ");
                                }
                            }
                            //for debug:
                            //settings_system.color_scheme =  "stanford"; // "default", "blue_&_white", "vintage", "stanford"
                            setData(color_scheme_key, new Backbone.Model({color_scheme: settings_system.color_scheme}), true);

                            settings_system.scales.number_of_digits_to_right_of_decimal = Math.abs((settings_system.scales.number_of_digits_to_right_of_decimal).toFixed(0) * 1);

                            // init dining_options if it doesn't exist
                            if(!Array.isArray(settings_system.dining_options)) {
                                settings_system.dining_options = [];
                            }

                           try {
                                if (settings_system.other_dining_option_details) {
                                    settings_system.other_dining_option_details = JSON.parse(settings_system.other_dining_option_details);
                                }
                            } catch(e) {
                                console.error("Can't parse other_dining_option_details");
                            }

                            // Set default dining option.
                            // It's key of DINING_OPTION object property with value corresponding the first element of settings_system.dining_options array
                            (function() {
                                var dining_options = settings_system.dining_options;
                                if(dining_options.length > 0) {
                                    for(var dining_option in DINING_OPTION) {
                                        if(dining_options[0] == DINING_OPTION[dining_option]) {
                                            settings_system.default_dining_option = dining_option;
                                            break;
                                        }
                                    }
                                }
                            })();

                            // although is_stanford_mode was previously set on app init, need to reset its value to false
                            // it's needed if establishment in stanford mode was changed to the non-stanford establishment (bug 33421)
                            App.Data.is_stanford_mode = false;
                            // then need to check if stanford mode is enabled using get parameter...
                            var app = require('app');
                            if (app.get['stanford'] == "true"
                                // ...or by using Stanford payment processor
                                || settings_system.payment_processor.stanford == true)
                            {
                                App.Data.is_stanford_mode = true;
                            }

                            self.set("settings_system", settings_system);
                            App.Settings = App.Data.settings.get("settings_system");

                            if (!self.get_payment_process()) { // get payment processors
                                if (App.Data.dirMode) { // app accessed via Directory app (bug #17548)
                                    settings_system.online_orders = false; // if all payment processors are disabled this case looks like 'online_orders' is checked off because 'online_orders' affects only order creating functionality
                                } else { // app accessed directly from browser (bug #17548)
                                    self.set({
                                        'isMaintenance': true,
                                        'maintenanceMessage': MAINTENANCE.PAYMENT_OPTION
                                    });
                                }
                            }

                            if (settings_system.dining_options.length == 0) {
                                if (App.Data.dirMode) { // app accessed via Directory app (bug #17552)
                                    settings_system.online_orders = false; // if all dining options are disabled this case looks like 'online_orders' is checked off because 'online_orders' affects only order creating functionality
                                } else { // app accessed directly from browser (bug #17552)
                                    self.set({
                                        'isMaintenance': true,
                                        'maintenanceMessage': MAINTENANCE.DINING_OPTION
                                    });
                                }
                            }

                            break;

                        default:
                            App.Data.errors.alert(response.errorMsg, true, false, {
                                errorServer: true,
                                typeIcon: 'warning'
                            }); // user notification
                            recoverColorScheme();
                    }

                    function recoverColorScheme() {
                        self.set("settings_system", {color_scheme: settings_system.color_scheme});
                    }
                },
                error: function() {
                    self.set({
                        settings_system: settings_system, // default settings
                        isMaintenance: true,
                        maintenanceMessage: MAINTENANCE.BACKEND_CONFIGURATION
                    });
                },
                complete: function() {
                    load.resolve();
                }
            });
            return load;
        },
        /**
         * Gets customer settings for /core/ skins.
         * Request parameters:
         * ```
         * url:  "/weborders/weborder_settings/"
         * type: "GET"
         * ```
         * @returns {object} Deferred object.
         */
        get_customer_settings: function() {
            var self = this,
            settings = { // Default values:
                "apple_app_id": null,
                "google_app_id": null,
                "smart_banner": false,
                "remember_me": true,
                "owner_website": "",
                "owner_contact": "",
                "saved_credit_cards": true,
                "saved_gift_cards": true,
                "saved_reward_cards": true,
                "default_location": { lat: 37.77837116836659, lon: -122.41963882471924 }, //San Francisco
                "view_page_size": 24,
                "json_page_limit": 120
            };

            self.loadCustomerSettings = $.Deferred();

            $.ajax({
                url: self.get("host") + "/weborders/weborder_settings/",
                dataType: "json",
                success: function(data) {
                    if (_.isObject(data)) {
                        $.extend(true, settings, data);
                    }
                    check_paging_values(settings);
                    self.set("settings_directory", settings);
                },
                error: function() {
                    self.set({
                        settings_directory: settings //default used
                    });
                    console.error(ERROR.CANT_GET_WEBORDER_SETTINGS);
                },
                complete: function() {
                    App.SettingsDirectory = self.get("settings_directory");
                    self.loadCustomerSettings.resolve();
                }
            });

            function check_paging_values(settings) {
                !settings.view_page_size && (settings.view_page_size = 1);
                !settings.json_page_limit && (settings.json_page_limit = 1);
                if (App.skin == App.Skins.WEBORDER_MOBILE) {
                    //if the num of products on the first page is less then 10 then no scrolling will be and new pages won't be loaded
                    (settings.view_page_size < 14) && (settings.view_page_size = 14);
                }
                settings.json_page_limit < settings.view_page_size && (settings.json_page_limit = settings.view_page_size);
                settings.json_page_limit = parseInt(settings.json_page_limit / settings.view_page_size) * settings.view_page_size; // make json_page_size to be a multiple of view_page_size
            }

            return self.loadCustomerSettings;
        },
        /**
         * Loads geolocation.
         * Asynchronously loads Google Maps API, and, if coordinates are not set in settings_system, gets current coordinates.
         */
        load_geoloc: function() {
            var set_sys = this.get("settings_system");
            var just_load_lib = false;

            // if coordinates are set in server then return
            if (set_sys.address.coordinates.lat != null && set_sys.address.coordinates.lng != null) {
                //set_sys.geolocation_load.resolve();
                //return;
                //TODO: probably split this function into 2 ones
                just_load_lib = true;
            }

            var self = this,
                address_google = set_sys.address.city +  ", " +
                                 set_sys.address.state_province + " " +
                                 set_sys.address.postal_code + ", " +
                                 set_sys.address.country + ", " +
                                 set_sys.address.line_1,
                GoogleMapsAPIURL = "https://maps.googleapis.com/maps/api/js?v=3.exp&sensor=true";

                if (set_sys.google_maps_api_key) {
                    GoogleMapsAPIURL += '&key=' + set_sys.google_maps_api_key;
                };

                if (set_sys.geolocation_load.state() == 'resolved') {
                    return;
                }

                require(["async!" + GoogleMapsAPIURL], function() {
                    if (just_load_lib)
                        return set_sys.geolocation_load.resolve();
                    var geocoder = new google.maps.Geocoder();
                    geocoder.geocode({"address": address_google}, function(results, status) {
                        if (status === google.maps.GeocoderStatus.OK) {
                            var location = results[0]['geometry']['location'];
                            $.extend(set_sys.address.coordinates, {lat: location.lat(), lng: location.lng()});
                            set_sys.geolocation_load.resolve();
                        } else {
                            set_sys.geolocation_load.reject();
                        }
                    });
                });
        },
        load_google_captcha: function() {
            if (!App.Data.dfd_recaptcha_load) {
                App.Data.dfd_recaptcha_load = $.Deferred();
            }
            if (App.Data.dfd_recaptcha_load.state() == 'resolved') {
                return App.Data.dfd_recaptcha_load;
            }
            if (!window.onloadCaptchaLibrary) {
                window.onloadCaptchaLibrary = function() {
                    App.Data.dfd_recaptcha_load.resolve();
                }
            }
            require(["https://www.google.com/recaptcha/api.js?render=explicit&onload=onloadCaptchaLibrary&hl=" + App.Data.curLocale], function() {
                return;
            });

            return App.Data.dfd_recaptcha_load;
        },
        /**
         * Gets payment processor config for current skin.
         * @returns {?object}
         * - undefined, if no one payment processors is set;
         * - configuration object otherwise.
         */
        get_payment_process: function() {
            var settings_system = this.get('settings_system'),
                processor = settings_system.payment_processor,
                skin = this.get("skin"),
                config = PaymentProcessor.getConfig(processor, skin);

            if (!config) {
                return undefined;
            }

            return Backbone.$.extend(processor, config);
        },
        /**
         * Gets detault image.
         * @param   {?nubmer} index - index of default image in 'settings_skin.img_default' array.
         * @returns {string} Image filename.
         */
        get_img_default: function(index) {
            var img = this.get('settings_skin').img_default;
            if(typeof img == 'string') {
                return img;
            } else if(Array.isArray(img)) {
                index = index && Object.keys(img).indexOf(index.toString()) > -1 ? index : 0;
                return img[index];
            } else {
                return '';
            }
        },
        /**
         * Saves settings to storage.
         */
        saveSettings: function() {
            setData('settings', this);
        },
        /**
         * Loads system settings from storage to 'settings_system' attribute of this model.
         */
        loadSettings: function() {
            this.set('settings_system', getData('settings').settings_system);
        },
        /**
         * Sets path for the current skin.
         * @param {boolean} withoutTrigger Is it necessary to initiate the "changeSkinPath" trigger?
         */
        setSkinPath: function(withoutTrigger) {
            var skinPath = this.get('basePath') + '/skins/' + this.get('skin');
            this.set({
                img_path: skinPath + '/img/',
                skinPath: skinPath
            });
            if (!withoutTrigger) this.trigger('changeSkinPath');
        }
    });
});
