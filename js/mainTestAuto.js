require(['app', 'js/utest/data/Settings'], function(app, settings_data) {
    console.log("mainAutoTest: step #1 ==>");
   // set config for require
    app.config.baseUrl =  "base/";

    app.config.paths['tests_list'] = "js/utest/_tests_list";
    app.config.paths['e2e_list'] = "js/utest/_e2e_list";
    app.config.paths['blanket'] = "js/utest/jasmine/lib/jasmine2/blanket";
    app.config.paths['jasmine_blanket'] = "js/utest/jasmine/lib/jasmine2/jasmine-blanket";
    app.config.paths['deep_diff'] = "js/libs/deep-diff";

    app.config.shim['jasmine_blanket'] = {deps: ['blanket'],  exports: 'blanket'};

    require.config(app.config);

    jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000; //30sec.

    var skins = app.skins;

    // add skins
    skins.set('WEBORDER', 'weborder'); // add `weborder` skin
    skins.set('RETAIL', 'retail');
    skins.set('WEBORDER_MOBILE', 'weborder_mobile'); // add `weborder` skin
    skins.set('PAYPAL', 'paypal', '../dev/skins/paypal'); // set `paypal` skin
    skins.set('MLB', 'mlb', '../dev/skins/mlb'); // set `mlb` skin
    skins.set('DIRECTORY_MOBILE', 'directory_mobile', '../dev/skins/directory_mobile'); // set `directory` skin

    // set REVEL_HOST
    //app.REVEL_HOST = window.location.origin;
    app.REVEL_HOST = 'https://weborder-dev-branch.revelup.com';

    app.instances = {
        "https://rde.revelup.com": {
            skin: skins['DIRECTORY'],
            brand: '1',
            stanford: 'true',
            apple_app_id: '689035572',
            google_app_id: 'com.revelsystems.html5client.foodtogo'
        }
    };

    App.unitTest = true;
    App.dbgStackTrace = [];

    require(['cssua', 'deep_diff', 'functions', 'errors', 'backbone_epoxy', 'tests_list', 'e2e_list', 'settings', 'tax', 'locale', 'about'], function() { //, 'e2e_list', 'settings', 'tax', 'main_router', 'locale'

        console.log("mainAutoTest: step #2 ==>");
        trace_init(true);

        app.get = {}; //parse_get_params();
        // hardcode English locale
        App.Data.get_parameters = {locale: 'en'};
        // invoke beforeStart onfig
        app.beforeInit();

        // init errors object and check browser version
        var errors = App.Data.errors = new App.Models.Errors();

        // init settings object
        App.Models.Settings.prototype.get_settings_system = function() {
            return $.Deferred().resolve();
        }
        App.Models.Settings.prototype.get_customer_settings = function() {
            return $.Deferred().resolve();
        }
        var settings = App.Data.settings = new App.Models.Settings({
            supported_skins: app.skins.available
        });
        settings.set({
            'img_path' : 'test/path/',
            'establishment' : 14,
            'host': app.REVEL_HOST
        });

        // init Locale object
        var locale = App.Data.locale = new App.Models.Locale;
        settings.once('change:skin', function() {
            locale.dfd_load = locale.loadLanguagePack(); // load a language pack from backend
            locale.dfd_load.done(function() {
                _loc = locale.toJSON();
                _.extend(ERROR, _loc.ERRORS);
                _.extend(MSG, _loc.MSG);
                delete _loc.ERRORS;
                delete _loc.MSG;
            });
            locale.on('showError', function() {
                errors.alert(ERROR.LOAD_LANGUAGE_PACK, true); // user notification
            });
        });

        MockAjax(settings_data.initializing_tests.settings_skin);
        var clone_settings_system = deepClone(settings_data.all.settings_system);
        settings.set('settings_system', clone_settings_system);
        UnmockAjax();
        settings.set('settings_directory', settings_data.all.settings_directory);
        App.Settings = settings.get('settings_system');
        App.SettingsDirectory = settings.get('settings_directory');

        if (typeof end2endMode != 'undefined' && end2endMode === true) {
            var srv_name = /^http[s]*:\/\/([^\.\s]+)\./.exec(window.location.origin);
            settings.set({
                establishment: 18,
                host: 'https://weborder-dev-branch.revelup.com'
            });
            require(e2e_tests_list, function() {
                $(window).trigger('load');
            });
        }
        else {

            //App.Data.devMode = true;

            if (App.Data.devMode == true) {
                //starting the tests without code coverage testing:
                locale.dfd_load.done(function() {
                    console.log("mainAutoTest: step #3, locale loaded");
                    requirejs(tests_list, function() {
                        console.log("mainAutoTest: step #4, dev mode, tests loaded");
                        $(window).trigger("StartTesting");
                    });
                });
            }
            else {
                require(['jasmine_blanket'], function(blanket) {

                    blanket.options('debug', false);
                    blanket.options('filter', 'js');
                    blanket.options('antifilter', [ 'js/libs/', 'js/utest/' ]);
                    blanket.options('branchTracking', true);

                    var jasmineEnv = jasmine.getEnv();
                    var reporter = new jasmine.BlanketReporter();
                    jasmineEnv.addReporter(reporter);
                    jasmineEnv.updateInterval = 1000;

                    reporter.jasmineDone = function() {
                       jasmine.BlanketReporter.prototype.jasmineDone.apply(this,arguments);
                       var cover = _blanket.getCovarageTotals()
                       console.log( "Total coverage: " + ((cover.numberOfFilesCovered * 100) / cover.totalSmts).toFixed(2) + "%" );
                    }

                     var reporterCurrentSpec = {
                        specStarted: function(result) {
                            if (/App.Models.Settings/.test(result.fullName)) { //to find a potential bug with delivery_charge
                                App.dbgStackTrace.push({ testName: result.fullName});
                            }
                        }
                    };
                    jasmine.getEnv().addReporter(reporterCurrentSpec);

                    $(document).ready(function() {
                        locale.dfd_load.done(function() {
                            require(tests_list, function(spec) {
                                console.log("mainAutoTest: step #3, Blanket mode, tests loaded");
                                $(window).trigger("StartTesting");
                            });
                        });
                    });
                });
            }
        }
    });
});