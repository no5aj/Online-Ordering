require(['app', 'js/utest/data/Settings'], function(app, settings_data) {
    console.log("mainAutoTest: step #1 ==>");
   // set config for require
    app.config.baseUrl =  "base/";

    app.config.paths['tests_list'] = "js/utest/_tests_list";
    app.config.paths['e2e_list'] = "js/utest/_e2e_list";
    app.config.paths['blanket'] = "js/utest/jasmine/lib/jasmine2/blanket_auto";
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
                       var cover = _blanket.getCovarageTotals();
                       console.log( "Total coverage: " + ((cover.numberOfFilesCovered * 100) / cover.totalSmts).toFixed(2) + "%" );
                       create_html_report();
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

                function create_html_report() {
                    var doc_template = '<html> \
                        <head> \
                            <link rel="stylesheet" type="text/css" href="blanket.css"> \
                            <script type="text/javascript" src="blanket.js"> </script> \
                        </head> \
                        <body> <div id="blanket-main"> {{insert_report}} </div> </body> \
                        </html>';

                    var output,
                        reportHTML = $('#blanket-main').html(),
                        styles = ".hide {display: none;} #blanket-main {margin:2px;background:#EEE;color:#333;clear:both;font-family:'Helvetica Neue Light', 'HelveticaNeue-Light', 'Helvetica Neue', Calibri, Helvetica, Arial, sans-serif; font-size:17px;} #blanket-main a {color:#333;text-decoration:none;}  #blanket-main a:hover {text-decoration:underline;} .blanket {margin:0;padding:5px;clear:both;border-bottom: 1px solid #FFFFFF;} .bl-error {color:red;}.bl-success {color:#5E7D00;} .bl-file{width:auto;} .bl-cl{float:left;} .blanket div.rs {margin-left:50px; width:150px; float:right} .bl-nb {padding-right:10px;} #blanket-main a.bl-logo {color: #EB1764;cursor: pointer;font-weight: bold;text-decoration: none} .bl-source{ overflow-x:scroll; background-color: #FFFFFF; border: 1px solid #CBCBCB; color: #363636; margin: 25px 20px; width: 80%;} .bl-source div{white-space: pre;font-family: monospace;} .bl-source > div > span:first-child{background-color: #EAEAEA;color: #949494;display: inline-block;padding: 0 10px;text-align: center;width: 30px;} .bl-source .miss{background-color:#e6c3c7} .bl-source span.branchWarning{color:#000;background-color:yellow;} .bl-source span.branchOkay{color:#000;background-color:transparent;}",

                    output = doc_template.replace(/{{insert_report}}/, reportHTML);
                    if (typeof window.callPhantom === 'function') {
                        window.callPhantom({ type: 'reportFile', file: 'blanket.css', content: styles });
                        window.callPhantom({ type: 'reportFile', file: 'blanket.js', content: blanket_toggleSource.toString() });
                        window.callPhantom({ type: 'reportFile', file: 'index.html', content: output });
                    }

                    function blanket_toggleSource(id) {
                        var element = document.getElementById(id);
                        if(hasClass(element, 'hide')) {
                            removeClass(element, 'hide');
                        } else {
                            addClass(element, 'hide');
                        }

                        function hasClass(el, className) {
                          if (el.classList)
                            return el.classList.contains(className);
                          else
                            return !!el.className.match(new RegExp('(\\s|^)' + className + '(\\s|$)'));
                        }
                        function addClass(el, className) {
                          if (el.classList)
                            el.classList.add(className);
                          else if (!hasClass(el, className)) el.className += " " + className;
                        }
                        function removeClass(el, className) {
                          if (el.classList)
                            el.classList.remove(className);
                          else if (hasClass(el, className)) {
                            var reg = new RegExp('(\\s|^)' + className + '(\\s|$)');
                            el.className=el.className.replace(reg, ' ');
                          }
                        }
                    }
                }
            }
        }
    });
});