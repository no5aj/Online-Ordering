define(['js/utest/data/Settings', 'settings'], function(settings) {

    describe('App.Models.Settings', function() {
        var baseSettings, local = {},
            get = function() {
                return local.settings ? JSON.parse(local.settings) : undefined;
            },
            set = function(e, s) {
                local.settings = s && s.toJSON && JSON.stringify(s.toJSON()) || e;
                return true;
            }, sys, all, model;

            var backupTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
            jasmine.DEFAULT_TIMEOUT_INTERVAL = 60000; //60sec.

        beforeEach(function(done) {
            spyOn(window, "getData").and.callFake(get);
            spyOn(window, "setData").and.callFake(set);
            spyOn(App.Data.errors, "alert").and.callFake(function() { console.log(arguments); });

            if (!all) {
                all = deepClone(settings.all);
                sys = all.settings_system;
                jasmine.DEFAULT_TIMEOUT_INTERVAL = backupTimeout;
            }
            done();
        });

        it('Enviroment', function() {
            expect(App.Models.Settings).toBeDefined();
        });

        it('initialize()', function() {
            spyOn(App.Models.Settings.prototype, 'load');
            spyOn(App.Models.Settings.prototype, 'get_data_warehouse');
            spyOn(App.Models.Settings.prototype, 'ajaxSetup');
            model = new App.Models.Settings();

            expect(model.toJSON()).toEqual(settings.defaults_initialized);
            expect(model.get_data_warehouse).toHaveBeenCalled();
            expect(model.ajaxSetup).toHaveBeenCalled();

            model.trigger('change:establishment');
            expect(model.load).toHaveBeenCalled();
        });

    if (!window._phantom) {
        describe('get_data_warehouse()', function() {
            var sessionStorageBackup, cookieBackup, cookie_getter;
            var __defineGetter__ = document.__defineGetter__;

            beforeEach(function() {
                sessionStorageBackup = window.sessionStorage;
                cookie_getter = document.__lookupGetter__ ('cookie');
                console.log("cookie descriptor = ", Object.getOwnPropertyDescriptor(document, 'cookie') );
                Object.defineProperty(document, 'cookie', {
                    configurable:true
                });
            });

            afterEach(function() {
                window.sessionStorage = sessionStorageBackup;
                __defineGetter__("cookie", cookie_getter);
                /*Object.defineProperty(document, 'cookie', {
                    get: cookie_getter
                });*/
                //console.log("cookie descriptor#2 = ", Object.getOwnPropertyDescriptor(document, 'cookie') );
            });

            it('sessionStorage', function() {
                window.sessionStorage = {};
                expectStorage(1);
            });

            it('none', function() {
                delete window.sessionStorage;
                __defineGetter__("cookie", function() { return '';} );
                /*Object.defineProperty(document, 'cookie', {
                        get: function() {
                           return '';
                        }
                    });*/
                expectStorage(0);
            });

            /* this may be browser dependent
            it('Cookie', function() {
                delete window.sessionStorage;
                cookie_getter || (document.__defineGetter__("cookie", function() { return true;} ));
                expectStorage(2);
            });
            */

            function expectStorage(storage) {
                model.get_data_warehouse();
                expect(model.get('storage_data')).toBe(storage);
            }
        });
    }

        it('checkIfMobile()', function() {
            var skinBackup = App.skin;

            spyOn(App.Models.Settings.prototype, 'isMobileVersion').and.returnValue(true);
            model = new App.Models.Settings();

            App.skin = App.Skins.WEBORDER;
            model.checkIfMobile();
            expect(App.skin).toBe(App.Skins.WEBORDER_MOBILE);

            App.skin == App.Skins.RETAIL;
            expectations();

            App.skin == App.Skins.RETAIL;
            expectations();

            function expectations() {
                model.checkIfMobile();
                expect(App.skin).toBe(App.Skins.WEBORDER_MOBILE);
            }

            App.skin = skinBackup;
        });

        it('get_establishment()', function() {
            var spyGet = spyOn(window, 'parse_get_params');

            spyGet.and.returnValue({establishment: 123});
            expect(model.get_establishment()).toBe(123);

            spyGet.and.returnValue({rvarEstablishment: '456'});
            expect(model.get_establishment()).toBe(456);
        });

        it('get_payment_process()', function() {
            var spyPaymentConfig = spyOn(PaymentProcessor, 'getConfig');

            expect(model.get_payment_process()).toBeUndefined();

            var config = {newProp: 'new value'},
                result = Backbone.$.extend(model.get('settings_system').payment_processor, config);
            spyPaymentConfig.and.returnValue(config);
            expect(model.get_payment_process()).toEqual(result);
        });

        describe('get_img_default()', function() {
            var settings_skin;

            beforeEach(function() {
                settings_skin = model.get('settings_skin');
            });

            afterEach(function() {
                model.set('settings_skin', settings_skin);
            });

            it('img_default is string', function() {
                model.set('settings_skin', {img_default: 'default img'});
                expect(model.get_img_default()).toBe('default img')
            });

            it('img_default is array', function() {
                var img = ['1.jpg', '2.jpg'];
                model.set('settings_skin', {img_default: img});
                expect(model.get_img_default()).toBe(img[0]);
            });

            it('img_default is array, `index` is specified', function() {
                var img = ['1.jpg', '2.jpg'];
                model.set('settings_skin', {img_default: img});
                expect(model.get_img_default(1)).toBe(img[1]);
            });
        });

        it('setSkinPath()', function() {
            spyOn(model, 'trigger');
            model.set('skin', 'weborder');
            model.setSkinPath();

            expect(model.get('img_path')).toBe(window._phantom ? 'base/skins/weborder/img/' : './skins/weborder/img/');
            expect(model.get('skinPath')).toBe(window._phantom ? 'base/skins/weborder' : './skins/weborder');
            expect(model.trigger).toHaveBeenCalledWith('changeSkinPath');

            model.setSkinPath(true);
            expect(model.trigger).not.toHaveBeenCalledWith();
        });

        describe("Global settings test", function() {

            it("Settings loaded", function() {
                expect(!empty_object(sys)).toBe(true);
                expect(!empty_object(all)).toBe(true);
            });

            it('Storage data', function() {
                expect(all.storage_data === 1 || all.storage_data === 2).toBeTruthy();
            });

            it('Skin', function() {
                all.skin = sys.type_of_service === ServiceType.RETAIL ? "retail" : (parse_get_params().skin === undefined ? "weborder": parse_get_params().skin);
                var skins = ["retail", "weborder", "weborder_mobile", "directory_mobile", "mlb", "paypal"];
                expect(skins).toContain(all.skin);
                expect(typeof(all.settings_skin)).toBe("object");
                expect(typeof(all.skinPath)).toBe("string");
                expect(all.skinPath).toMatch(all.basePath+"/skins/"+all.skin);
            });

            it("Maintenance", function() {
                expect(all.isMaintenance).toBeFalsy();
            });

            it("Base Path", function() {
                expect(typeof(all.basePath)).toBe("string");
            });

            it('Establishment', function() {
                expect(typeof(all.establishment*1)).toBe('number');
            });

            it('Timeout', function() {
                expect(typeof all.timeout).toBe('number');
                expect(all.timeout >= 0).toBeTruthy();
            });

            it('Version', function() {
                expect(typeof all.version).toBe('number');
            });

            it('Host', function() {
                expect(all.host).toMatch(/https:\/\/[a-zA-Z0-9\-_]*\.revelup\.com/);
            });

            it("Hostname", function() {
                expect(typeof(all.hostname)).toBe("string");
                expect(all.hostname).toMatch(/[a-zA-Z0-9\-_]*\.revelup\.com/);
                var hostname = /^http[s]*:\/\/(.+)/.exec(all.host)[1];
                expect(all.hostname).toMatch(hostname);
            });

            it("IMG path", function() {
                expect(typeof(all.img_path)).toBe("string");
                expect(all.img_path).toMatch(/[a-zA-Z0-9\.\/]*\/img\//);
            });

            it("Supported skins", function() {
                expect(all.supported_skins instanceof Array).toBeTruthy();
            });

        });

        describe("System settings test", function() {

            it('About fields', function() {
                expect(typeof sys.about_access_to_location).toBe('string');
                expect(typeof sys.about_description).toBe('string');
                expect(Array.isArray(sys.about_images)).toBeTruthy();
                expect(typeof sys.about_title).toBe('string');
            });

            it("Accept cash online", function() {
                expect(typeof(sys.payment_processor.cash)).toBe("boolean");
            });

            it("Accept online orders when store is closed", function() {
                expect(typeof(sys.accept_online_orders_when_store_is_closed)).toBe("boolean");
            });

            it("Accept tips online", function() {
                expect(typeof(sys.accept_tips_online)).toBe("boolean");
            });

            it("Business name", function() {
                expect(typeof sys.business_name).toBe('string');
            });

            it("Cannot order with empty inventory", function() {
                expect(typeof(sys.cannot_order_with_empty_inventory)).toBe("boolean");
            });

            it("Color scheme", function() {
                expect(typeof(sys.color_scheme)).toBe("string");
            });

            it('Email check', function() {
                expect(typeof sys.email).toBe('string');
                expect(sys.email.length).toBeGreaterThan(6);
                var regStr = "^[-a-z0-9!#$%&'*+/=?^_`{|}~]+(\\.[-a-z0-9!#$%&'*+/=?^_`{|}~]+)*@([a-z0-9]([-a-z0-9]{0,61}[a-z0-9])?\\.)*([a-z]{2,10})$";
                expect(sys.email).toMatch(regStr);
            });

            it("Enable reward cards collecting", function() {
                expect(typeof(sys.enable_reward_cards_collecting)).toBe("boolean");
            });

            it("Estimated delivery time", function() {
                expect(typeof(sys.estimated_delivery_time)).toBe("number");
                expect(sys.estimated_delivery_time >= 0).toBeTruthy();
            });

            it("Estimated order preparation time", function() {
                expect(typeof(sys.estimated_order_preparation_time)).toBe("number");
                expect(sys.estimated_order_preparation_time >= 0).toBeTruthy();
            });

            it("Hide images", function() {
                expect(typeof(sys.hide_images)).toBe("boolean");
            });

            it("Hide products description", function() {
                expect(typeof(sys.hide_products_description)).toBe("boolean");
            });

            it('Currency symbol', function() {
                expect(typeof sys.currency_symbol).toBe('string');
                expect(sys.currency_symbol).not.toEqual('');
                expect(sys.currency_symbol).not.toBe("X");
            });

            it("Date format", function() {
                expect(sys.date_format).toBeDefined();
            });

            it("Default dining option", function() {
                expect(typeof(sys.default_dining_option)).toBe("string");
            });

            it("Delivery", function() {
                expect(typeof(sys.delivery_charge)).toBe("number");
                expect(sys.delivery_charge >= 0).toBeTruthy();
                expect(typeof(sys.delivery_cold_untaxed)).toBe("boolean");
                expect(typeof(sys.delivery_for_online_orders)).toBe("boolean");
            });

            it("Dining options", function() {
                expect(sys.dining_options instanceof Array).toBeTruthy();
            });

            it("Distance mearsure", function() {
                expect(typeof(sys.distance_mearsure)).toBe("string");
            });

            it("Eat in for online orders", function() {
                expect(typeof(sys.eat_in_for_online_orders)).toBe("boolean");
            });

            it("Editable dining options", function() {
                expect(Array.isArray(sys.editable_dining_options)).toBeTruthy();
            });

            it('Favicon', function() {
                expect(typeof sys.favicon_image === 'string' || sys.favicon_image === null).toBeTruthy();
            });

            it('Hide image', function() {
                expect(typeof sys.hide_images).toBe('boolean');
            });

            it('Logo', function() {
                expect(typeof sys.logo_img === 'string' || sys.logo_img === null).toBeTruthy();
            });

            it("Delivery", function() {
                expect(typeof(sys.max_delivery_distance)).toBe("number");
                expect(sys.max_delivery_distance >= 0).toBeTruthy();
                expect(typeof(sys.min_delivery_amount)).toBe("number");
                expect(sys.min_delivery_amount >= 0).toBeTruthy();
            });

            it("Min items", function() {
                expect(typeof(sys.min_items)).toBe("number");
                expect(sys.min_items >= 0).toBeTruthy();
            });

            it("Online order time offset", function() {
                expect(typeof(sys.online_order_start_time_offset)).toBe("number");
                expect(sys.online_order_start_time_offset >= 0).toBeTruthy();
                expect(typeof(sys.online_order_end_time_offset)).toBe("number");
                expect(sys.online_order_end_time_offset >= 0).toBeTruthy();
            });

            it("Online order time slot", function() {
                expect(typeof(sys.online_order_time_slot)).toBe("number");
                expect(sys.online_order_time_slot >= 0).toBeTruthy();
            });

            it("Order notes allow", function() {
                expect(typeof(sys.order_notes_allow)).toBe("boolean");
            });

            it('Phone', function() {
                expect(typeof sys.phone).toBe('string');
            });

            it('Payment processor', function() {
                expect(typeof sys.payment_processor).toBe('object');
                expect(typeof(sys.payment_processor.cash)).toBe("boolean");
                expect(typeof(sys.payment_processor.credit_card_button)).toBe("boolean");
                expect(typeof(sys.payment_processor.credit_card_dialog)).toBe("boolean");
                expect(typeof(sys.payment_processor.gift_card)).toBe("boolean");
                expect(typeof(sys.payment_processor.mercury)).toBe("boolean");
                expect(typeof(sys.payment_processor.moneris)).toBe("boolean");
                expect(typeof(sys.payment_processor.payment_count)).toBe("number");
                expect(sys.payment_processor.payment_count >= 0).toBeTruthy();
                expect(typeof(sys.payment_processor.paypal)).toBe("boolean");
                expect(typeof(sys.payment_processor.paypal_mobile)).toBe("boolean");
                expect(typeof(sys.payment_processor.usaepay)).toBe("boolean");
            });

            it('Prevailing surcharge', function() {
                expect(typeof sys.prevailing_surcharge).toBe('number');
            });

            it('Prevailing tax', function() {
                expect(typeof sys.prevailing_tax).toBe('number');
            });

            it("Scales", function() {
                expect(typeof(sys.scales)).toBe("object");
                expect(sys.scales.default_weighing_unit).toBeDefined();
                expect(sys.scales.label_for_manual_weights).toBeDefined();
                expect(sys.scales.number_of_digits_to_right_of_decimal).toBeDefined();
            });

            it("Server time", function() {
                expect(typeof(sys.server_time)).toBe("number");
            });

            it("Shipping", function() {
                expect(typeof(sys.shipping)).toBe("boolean");
            });

            it("Special requests online", function() {
                expect(typeof(sys.special_requests_online)).toBe("boolean");
            });

            it('Tax country', function() {
                expect(typeof sys.tax_country).toBe('string');
            });

            it("Time format", function() {
                expect(typeof(sys.time_format)).toBe("string");
            });

            it('Time zone offset', function() {
                expect(typeof sys.time_zone_offset).toBe('number');
            });

            it('Timetable', function() {
                expect(Array.isArray(sys.timetables)).toBeTruthy();
            });

            it("Type of service", function() {
                expect(typeof(sys.type_of_service)).toBe("number");
            });

            it("Use custom menus", function() {
                expect(typeof(sys.use_custom_menus)).toBe("boolean");
            });

            it('Holidays', function() {
                expect(Array.isArray(sys.holidays)).toBeTruthy();
            });

            it('Address', function() {
                expect(sys.address).toBeDefined();
                expect(typeof sys.address.city).toBe('string');
                expect(sys.address.coordinates).toBeDefined();
                expect(typeof sys.address.coordinates.lat).toBeDefined();
                expect(typeof sys.address.coordinates.lng).toBeDefined();
                expect(typeof sys.address.country).toBe('string');
                expect(sys.address.country).toMatch(/^[A-Z]{2}$/);
                expect(typeof sys.address.full_address).toBe('string');
                expect(typeof sys.address.line_1).toBe('string');
                expect(typeof sys.address.line_2).toBe('string');
                expect(typeof sys.address.postal_code).toBe('string');
                expect(typeof sys.address.province).toBe('string');
                expect(typeof sys.address.state).toBe('string');
                expect(typeof sys.address.state_province).toBe('string');
            });

        });

    });
});

