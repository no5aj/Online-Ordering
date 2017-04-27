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

/*
* How to find View refs:
* (App.Views.GeneratorView.create|get\:|modelName\:)[^%]{1,100}[\'\"]Card[\'\"][^%]{1,300}[\"\']Main[\"\']
*/
/*
* Constants
*/

var MonthByStr = {'Jan': 1, 'Feb': 2, 'Mar': 3, 'Apr': 4, 'May': 5, 'Jun': 6, 'Jul': 7, 'Aug': 8, 'Sep': 9, 'Oct': 10, 'Nov': 11, 'Dec': 12},
    EN_ARRAY_MONTH = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

// http://www.w3.org/TR/html5/forms.html#valid-e-mail-address
var EMAIL_VALIDATION_REGEXP = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

//write errors here

var MAINTENANCE = {
    BACKEND_CONFIGURATION: 'MAINTENANCE_CONFIGURATION',
    PAYMENT_OPTION: 'MAINTENANCE_PAYMENT',
    DINING_OPTION: 'MAINTENANCE_DINING',
    ORDER_TYPE: 'MAINTENANCE_ORDER_TYPE'
};
var RESOURCES = {
    CSS: 'RESOURCES_CSS',
    TEMPLATES: 'RESOURCES_TEMPLATES'
}

var ERROR = {},
    MSG = {},
    _loc; ; //locale strings

// Should be set before language pack loading
ERROR.WEBSTORAGES_ARE_DISABLED = 'Web storages are disabled or not supported in your browser';
ERROR.LOAD_LANGUAGE_PACK = 'Unable to load a language pack. Now the page is reloaded.';
ERROR.CANT_GET_WEBORDER_SETTINGS = 'Can\'t load weborder settings from a backend server';
MSG.ESTABLISHMENTS_ERROR_NOSTORE = 'No store is available for the specified brand';

var PAYMENT_TYPE = {
    PAYPAL_MOBILE: 1,
    CREDIT: 2,
    PAYPAL: 3,
    NO_PAYMENT: 4,
    GIFT: 5,
    STANFORD: 6
};
/*
*  Gets payment type string that is used for debug
*/
function paymentType2String(payment_type) {
    switch (payment_type) {
        case PAYMENT_TYPE.PAYPAL_MOBILE:
            return "Paypal Mobile";
        case PAYMENT_TYPE.CREDIT:
            return "Credit Card";
        case PAYMENT_TYPE.PAYPAL:
            return "Paypal";
        case PAYMENT_TYPE.NO_PAYMENT:
            return "NO_PAYMENT";
        case PAYMENT_TYPE.GIFT:
            return "Gift";
        case PAYMENT_TYPE.STANFORD:
            return "STANFORD";
        default:
            return "Undefined"
    }
}

var APP_STORE_NAME = {
    ios: 'apple-itunes-app',
    android: 'google-play-app',
};

// Dining options
var DINING_OPTION = {
        DINING_OPTION_TOGO : 0,
        DINING_OPTION_EATIN : 1,
        DINING_OPTION_DELIVERY : 2,
        DINING_OPTION_CATERING : 3,
        DINING_OPTION_DRIVETHROUGH : 4,
        DINING_OPTION_ONLINE : 5,
        DINING_OPTION_OTHER : 6,
        DINING_OPTION_SHIPPING: 7
    };

var ServiceType = {
    TABLE_SERVICE : 0,
    QUICK_SERVICE : 1,
    RETAIL : 2,
    GROCERY : 3,
    REVELLITE_QSR : 4,
    REVELLITE_RETAIL : 5,
    DONATION : 6
};

var LayoutStyle = {
    RESTAURANT : 0,
    RETAIL : 1,
    HYBRID : 2
};

var EVENT = {
    START:     "Start",
    NAVIGATE:  "Navigate",
    SEARCH:    "Search"
};

var MILLISECONDS_A_DAY = 86400000;//24*60*60*1000

var ACCEPTABLE_CREDIT_CARD_TYPES = {
    AMERICANEXPRESS: 0,
    DISCOVER: 1,
    MASTERCARD: 2,
    VISA: 3,
    MAESTRO: 10,
    DINERS: 12,
    JCB: 13
};

/**
 *  Format message by formatting string and params.
 *  Example:
 *  ```
 *  msgFrm("Message text param1 = %s, param2 = %s", 10, 20);
 *  // returns the string "Message text param1 = 10, param2 = 20"
 *  ```
 *  @param {string} msg_format - string to format.
 *  @param {...*} - replacement params.
 */
function msgFrm(msg_format) {
    var args = arguments,
        newStr, index = 1;

    newStr = msg_format.replace(/(%s)/g, function(str, p1){
        return str.replace(p1, args[index++] );
    });

    return newStr;
}

/**
 * Get GET-parameters from address line.
 */
function parse_get_params() {
    // need to include app.instances config as origin parameters
    // if no one GET-parameter exists in url (Bug 32709)
    if (!window.location.search && !parse_get_params.instance_config_applied) {
        try {
            var app = require('app');
            if(app.REVEL_HOST in app.instances) {
                var instance_params = app.instances[app.REVEL_HOST];
            }
            if(window.$_GET) {
                window.$_GET = _.extend({}, instance_params, window.$_GET);
            }
            parse_get_params.instance_config_applied = true;
        } catch(e) {
            console.log(e)
        }
    }
    // return if string was already parsed
    if (window.$_GET) {
        return window.$_GET;
    }

    $_GET = {};
    // Mercury return url is not xml-decoded
    var search = window.location.search.replace(/&amp;/g, '&');
    var __GET = search.substring(1).split("&");
    for (var i = 0; i < __GET.length; i++) {
        var get_var = __GET[i].split("=");
        $_GET[get_var[0]] = typeof(get_var[1]) == "undefined" ? "" : get_var[1];
    }
    if (_.isObject(instance_params)) {
        $_GET = _.extend({}, instance_params, $_GET);
    }
    return $_GET;
}

/**
 * Array.prototype.find polyfill function (for using by IE)
 */
if (!Array.prototype.find) {
  Array.prototype.find = function(predicate) {
    if (this == null) {
      throw new TypeError('Array.prototype.find called on null or undefined');
    }
    if (typeof predicate !== 'function') {
      throw new TypeError('predicate must be a function');
    }
    var list = Object(this);
    var length = list.length >>> 0;
    var thisArg = arguments[1];
    var value;

    for (var i = 0; i < length; i++) {
      value = list[i];
      if (predicate.call(thisArg, value, i, list)) {
        return value;
      }
    }
    return undefined;
  };
}

/**
 * Loads styles and scripts.
 */
function load_styles_and_scripts() {
    var i, scripts,
        skin = App.Data.settings.get("skin"),
        styles = App.Data.settings.get("settings_skin").styles;
    for (i = 0; i < styles.length; i++) {
        $('head').append('<link rel="stylesheet" href="skins/' + skin + "/" + styles[i] + '" type="text/css" />');
    }
    scripts = App.Data.settings.get("settings_skin").scripts;
    for (i = 0; i < scripts.length; i++) {
        $.ajax({
           dataType : 'script',
           url : "skins/" + skin + '/' + scripts[i],
           success : function() {
           }
        });
    }
}

/**
 * Checks whether object is empty.
 * @param   {object} obj - object to check.
 * @returns {boolean}
 * - true, if given object is empty;
 * - false otherwise.
 */
function empty_object(obj) {
    for (var i in obj) {
        return false;
    }
    return true;
}

/**
 * Returns cookie if it exists or undefined
 * @param   {string} name - cookie name.
 * @returns {string} cookie value.
 */
function getCookie(name) {
    var matches = document.cookie.match(new RegExp(
        "(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + "=([^;]*)"
    ));
    return matches ? decodeURIComponent(matches[1]) : undefined;
}

Date.prototype.format = function(date_format) {
    date_format = date_format || App.Data.settings.get('settings_system').date_format || "mm/dd/yyyy";
    var month = _loc.ARRAY_MONTH[this.getMonth()];
    var wday = _loc.DAYS_OF_WEEK[Object.keys(_loc.DAYS_OF_WEEK)[(this.getDay() + 6) % 7]];
    var wday_short = _loc.DAYS_OF_WEEK_SHORT[Object.keys(_loc.DAYS_OF_WEEK_SHORT)[(this.getDay() + 6) % 7]];
    var map = { //1 Dec 2014: new Date(2014, 11, 1).format("yyyy yy MMM Mmm MM Mm mm DDD Ddd DD Dd dd d")
        'yyyy': this.getFullYear(), //2014
        'yy': String(this.getFullYear()).substr(2, 2), //14
        'MMM': month.substr(0, 3).toUpperCase(), //DEC
        'Mmm': month.substr(0, 3), //Dec
        'MM': month.toUpperCase(), //DECEMBER
        'Mm': month, //December
        'mm': ('0' + (this.getMonth() + 1)).slice(-2), //12
        'DDD': wday_short.toUpperCase(), //MON
        'Ddd': wday_short, //Mon
        'DD': wday.toUpperCase(), //MONDAY
        'Dd': wday, //Monday
        'dd': ('0' + this.getDate()).slice(-2), //01
        'd': this.getDate(), //1
        'H2': ('0' + this.getHours()).slice(-2),
        'H': this.getHours(),
        'M2': ('0' + this.getMinutes()).slice(-2),
        'M': this.getMinutes()
    };

    var re = new RegExp(Object.keys(map).join("|"), "gi");
    date_format = date_format.replace(re, function(matched) {
        return map[matched];
    });

    return date_format;
}

/**
 * Formats a date in the format "YYYY-MM-DDTHH:MM:SS".
 * @param   {Date} date - date.
 * @returns {Date} formatted date.
 */
function format_date_1(date) {
    return (new Date(date)).toISOString().replace(/\..*$/, '');
}

/**
 * Formats a date in the format "MM/DD/YYYY HH:MM(am/pm)".
 * @param   {Date} date - date.
 * @returns {Date} formatted date.
 */
function format_date_2(date) {
    var js_date = new Date(date);
    return js_date.format() + ' '  + new TimeFrm(js_date.getHours(), js_date.getMinutes());
}

 /**
  * Formats a date in the format "(Yesterday/Today/Tomorrow) at HH:MM(am/pm) | MONTH DD(st/nd/rd/th) at HH:MM(am/pm)".
  * @param   {Date} date - date.
  * @returns {Date} formatted date.
  */
function format_date_3(date) {
    var SECONDS_IN_DAY = 86400000;
    var days = _loc['DAYS'],
        time_prefix = _loc['TIME_PREFIXES'],
        result = '',
        now = App.Data.timetables.base(),
        date_1 = new Date(now.getFullYear(), now.getMonth(), now.getDate()),
        js_date = new Date(date),
        date_2 = new Date(js_date.getFullYear(), js_date.getMonth(), js_date.getDate()),
        time_difference = date_2 - date_1;
    if (time_difference == 0) {
        result += days['TODAY'];
    } else if (time_difference == -SECONDS_IN_DAY) {
        result += days['YESTERDAY'];
    } else if (time_difference == SECONDS_IN_DAY) {
        result += days['TOMORROW'];
    } else {
        var current_date_month = js_date.getMonth() + 1;
        var current_date_day = js_date.getDate();
        result += _loc.ARRAY_MONTH[current_date_month - 1] + ' ' + current_date_day;
        switch (current_date_day) {
            case 1:
                result += time_prefix['FIRST_DAY_OF_MONTH'];
                break;
            case 2:
                result += time_prefix['SECOND_DAY_OF_MONTH'];
                break;
            case 3:
                result += time_prefix['THIRD_DAY_OF_MONTH'];
                break;
            default:
                result += time_prefix['OTHER_DAY_OF_MONTH'];
                break;
        }
    }
    result += ' ' + time_prefix['TIME_AT'] + ' ' + new TimeFrm(js_date.getHours(), js_date.getMinutes());
    return result;
}

/**
 * Loads data from storage (cookie, sessionStorage, localStorage).
 * @param   {string}  name  - data key in storage.
 * @param   {boolean} local - indicates that data should be loaded from LocalStorage.
 * @returns {*}               loaded data.
 */
function getData(name, local) {
    var data;

    switch (App.Data.settings.get('storage_data')) {
        case 1:
            if(local && localStorage instanceof Object && localStorage[name])
                data = JSON.parse(localStorage[name]);
            else if (sessionStorage instanceof Object && sessionStorage[name])
                data = JSON.parse(sessionStorage[name]);
            else
                data = undefined;
            break;
        case 2:
            if (getCookie(name)) {
                data = JSON.parse(getCookie(name));
            }
            else {
                data = undefined;
            }
            break;
    }
    return data;
}
/**
 * Saves data to storage (cookie, sessionStorage, localStorage).
 * @param   {string}   name  - data key in storage.
 * @param   {*}        data  - data to save.
 * @param   {boolean}  local - indicates that data should be saved in LocalStorage.
 * @returns {?boolean} - true, if successfully saved.
 */
function setData(name, data, local) {
    if (typeof data.toJSON == 'function')
        data = data.toJSON();

    switch (App.Data.settings.get('storage_data')) {
        case 1:
            if(local && localStorage instanceof Object)
                localStorage[name] = JSON.stringify(data);
            else if (sessionStorage instanceof Object)
                sessionStorage[name] = JSON.stringify(data);
            break;
        case 2:
            document.cookie += name + '=' + JSON.stringify(data) + ';';
            break;
    }
    return true;
}
/**
 * Removes data from storage (coockie or sessionStorage)
 * @param {string}  name  - data key in storage.
 * @param {boolean} local - indicates that data should be loaded from LocalStorage.
 */
function removeData(name, local) {
    switch (App.Data.settings.get('storage_data')) {
        case 1:
            if(local && localStorage instanceof Object)
                localStorage.removeItem(name);
            else if(sessionStorage instanceof Object)
                sessionStorage.removeItem(name);
            break;
        case 2:
            // TODO ;
            break;
    }
}

/**
 * Helper of template.
 */
function template_helper(name, mod) {
    var id;
    if(mod) {
        id = "#" + name + "_" + mod + "-template";
    }
    else {
        id = "#" + name + "-template";
    }
    if ($(id)[0] == undefined) {
        console.error("Can't find the template: " + id);
    }
    //trace(id);
    return _.template($(id).html());
}

/**
 * Helper of template for paypal.
 */
function template_helper2(name) {
    return _.template($('#' + name).html());
}

/**
 * Rounds monetary currency.
 * @param   {number} value     - amount of money.
 * @param   {number} precision - precision.
 * @param   {boolean} up       - if true, rounds 0.049 to 0.05.
 * @returns {number} rounded number.
 */
function round_monetary_currency(value, precision, up) {
    precision = precision || 2;
    var val = Math.floor(value * Math.pow(10, precision)) / Math.pow(10, precision),
        delta = value * Math.pow(10, precision + 2) - val * Math.pow(10, precision + 2),
        result;
    if (delta > 49 || (delta === 49 && up)) {
        result = val + 1 / Math.pow(10, precision);
    } else {
        result = val;
    }
    return result.toFixed(2);
}
//alias for round_monetary_currency function:
var round_money = round_monetary_currency;

/**
 * Loads the template synchrounously.
 * @param   {?string} name              - skin name.
 * @param   {string}  file              - file name.
 * @param   {boolean} isCore            - indicate whether this is core template.
 * @param   {object}  loadModelTemplate - object in following format:
 * ```
 * {
 *     count: <count of templates to load>,
 *     dfd: <Deferrec object>
 * }
 * ```
 */
function loadTemplate2(name, file, isCore, loadModelTemplate) {
    var id = name ? name + '_' + file : file;

    /**
     * Resolve current CSS file.
     */
    var resolve = function() {
        loadModelTemplate.count--;
        if (loadModelTemplate.count === 0) loadModelTemplate.dfd.resolve();
    }

    if (loadTemplate2[id] === undefined) {
        var version = is_minimized_version ? '?ver=' + autoVersion : '';
        $.ajax({
            url: isCore ? 'template/' + file + '.html' : App.Data.settings.get('skinPath') + '/template/' + file + '.html' + version,
            dataType: "html",
            success : function(data) {
                var tmplEl = $(data);

                // add template node to DOM tree and cache it
                $("head").append(tmplEl);
                loadTemplate2[id] = tmplEl;

                resolve(); // resolve current CSS file
            },
            error: function(xhr) {
                // Bug 25585.
                // If network connection has been lost in capture phase, user will get the corresponding notification with reload button.
                var errorMsg = App.Data.myorder.disconnected ? App.Data.myorder.paymentResponse.errorMsg : ERROR[RESOURCES.TEMPLATES];
                App.Data.errors.alert(errorMsg, true); // user notification
            }
        });
    } else if(loadTemplate2[id] instanceof $) {
        $("head").append(loadTemplate2[id]);
        resolve(); // resolve current CSS file
    }
}

/**
 * Loads the template.
 * @param {?string} name - template name.
 * @param {string}  file - file name.
 */
function loadTemplate(name, file) {
    var dfd = $.Deferred();
    if ($("#" + name).length === 0) {
        var version = is_minimized_version ? '?ver=' + autoVersion : '';
        $.ajax({
            url: App.Data.settings.get('skinPath') + "/template/" + file + ".html" + version,
            dataType: "html",
            success: function(data) {
                $("head").append(data);
                dfd.resolve();
            }
        });
    }  else {
        dfd.resolve();
    }
    return dfd;
}

/**
 * Appends CSS file.
 * @param {string} name - file name.
 * @param {object} loadModelCSS - object in following format:
 * ```
 * {
 *     count: <count of templates to load>,
 *     dfd: <Deferrec object>
 * }
 * ```
 * @returns {jQuery} '<link>' element.
 */
function loadCSS(name, loadModelCSS) {
    // cache is used after a return to previous establishment
    if(!(loadCSS.cache instanceof Object)) {
        loadCSS.cache = {};
    }

    var id = typeof btoa == 'function' ? btoa(name) : encodeURIComponent(name),
        elem;

    // Detect 'load' event of link element is supported by browser or not.
    // The result is kept in localStorage to skip this process in further app starts.
    loadCSS.linkLoadEventSupported = loadCSS.linkLoadEventSupported || getData('linkLoadEventSupported', true);

    /**
     * Resolve current CSS file.
     */
    var resolve = function() {
        loadModelCSS.count--;
        //trace("loadModelCSS.count =", loadModelCSS.count);
        if (loadModelCSS.count === 0) loadModelCSS.dfd.resolve();
    }
    /**
     * User notification.
     */
    var error = function() {
        // Bug 25585.
        // If network connection has been lost in capture phase, user will get the corresponding notification with reload button.
        var errorMsg = App.Data.myorder.disconnected ? App.Data.myorder.paymentResponse.errorMsg : ERROR[RESOURCES.CSS];
        App.Data.errors.alert(errorMsg, true, true); // user notification
    };
    var cache = false,
        version = is_minimized_version ? '?ver=' + autoVersion : '';

    if(loadCSS.cache[id] instanceof $) {
        //trace("name =", name, "was cached");
        cache = true;
        elem = loadCSS.cache[id];
    } else {
        //trace("name =", name, "starting load...");
        elem = loadCSS.cache[id] = $('<link rel="stylesheet" href="' + name + (loadModelCSS.hasExtention ? '' : '.css') + version + '" type="text/css" />');
        // bug #18285 - no timeout for app assets
        var timer = window.setTimeout(error, App.Data.settings.get('timeout'));

        elem.on('load', function(event) {
            //trace("name =", name, " loaded successfully");
            onCSSLoaded(true, resolve);
        });
        elem.on('error', function(event) {
            console.error("Can't load: ", event.target.href);
            onCSSLoaded(true, error);
        });
    }

    if($('link[href="' + name + '.css"]').length === 0) {
        $('head').append(elem);
        if (cache) {
            //trace(name, "got from cache, detecting... ");
            detectLinkLoadEvent(elem.get(0), loadCSS.linkLoadEventSupported); // detect when CSS is applied to DOM
        } else if(!loadCSS.linkLoadEventSupported) {
            //trace(name, "load event not supported ");
            detectLinkLoadEvent(elem.get(0), false); // detect when CSS is applied to DOM
        }
    } else {
        //trace(name, "resolving");
        resolve(); // resolve current CSS file
    }

    // Some browsers don't support 'load' event for link element. Need to detect the 'load' event via JavaScript.
    //     *) Safari at least 5.1.7 (the latest version for Windows OS): Safari/534.57.2;
    //     *) Samsung tablet GT-P5210 with Android 4.4.2: Safari/534.30;
    //     *) Other browsers which browser installed with version less Safari/536.25 (Safari 6).
    //     *) PayPal android app on Samsung Galaxy S3.
    //
    // More information:
    //     1) https://bugs.webkit.org/show_bug.cgi?id=38995 - the bug in WebKit Bugzilla;
    //     2) http://trac.webkit.org/changeset/108809 - the changeset #108809.
    //     3) http://en.wikipedia.org/wiki/Safari_version_history - Safari version history.
    //
    // Link href should be in the same domain as the page host. Otherwise Browser Security Policy disallows to check it and timeout will be running forever.
    // (This restriction is acceptable for CSS links passed to loadCSS())
    function detectLinkLoadEvent(el, linkLoadEventSupported, entry) {
        // this method is discussed in http://stackoverflow.com/questions/2635814/javascript-capturing-load-event-on-link
        try {
            var isLoaded = (el.sheet) // && el.sheet.cssRules && el.sheet.cssRules.length > 0 - it doesn't work for weborder-desktop-colors.css
                || (el.styleSheet && el.styleSheet.cssText.length > 0)
                || (el.innerHTML && el.innerHTML.length > 0);

            // if loading CSS just been applied to DOM need to call a resolve() and stop detectLinkLoadEvent.timer
            if(isLoaded) {
                //trace("file ", el.href, "loaded");
                return onCSSLoaded(linkLoadEventSupported, resolve);
            } else {
                if (entry == 1) {
                    //trace("file ", el.href, " delaying ...", (new Date).getTime());
                    detectLinkLoadEvent.timer = setTimeout(detectLinkLoadEvent.bind(window, el, linkLoadEventSupported, 2), 2000); //for files like weborder-desktop-colors.css with delay > 100 ms
                    return;
                } else if (entry == 2) {
                    console.error("Can't detect loaded: ", el.href);
                    return onCSSLoaded(true, error);
                }
            }
        } catch(e) {
            console.error("Can't detect loaded#2: ", el.href);
            return onCSSLoaded(true, error);
        }
        detectLinkLoadEvent.timer = setTimeout(detectLinkLoadEvent.bind(window, el, linkLoadEventSupported, 1), 200);
    }

    function onCSSLoaded(linkLoadEventSupported, cb) {
        clearTimeout(timer);
        clearTimeout(detectLinkLoadEvent.timer);
        loadCSS.linkLoadEventSupported = linkLoadEventSupported;
        setData('linkLoadEventSupported', linkLoadEventSupported, true);
        typeof cb == 'function' && cb();
    }

    return elem;
}

/**
 * Appends common CSS file to `<head>`.
 * @param {name} string - file name.
 */
function loadCommonCSS(name) {
    if ($('link[href="' + name + '.css"]').length === 0) {
        $('head').append('<link rel="stylesheet" href="' + name + '.css" type="text/css" />');
    }
}

/**
 * Sets page title.
 * @param {string} title - title to set.
 */
function pageTitle(title) {
    $("head title").html(title);
}

/**
 * Checks whether given argument is numeric.
 * @param   {*}  num - variable to check.
 * @returns {Boolean}
 *     - true, if `num` is numeric;
 *     - false otherwise.
 */
function isNumber(num) {
    return typeof(num) === 'number' || num instanceof Number;
}

/*
 *  TimeFrm 'class'.
 *  This class is created for time strings convertation from 24-hour format to USA format and back.
 *  The internal state value is minutes. You can update the minutes (set_minutes func.) and get updated time strings in desired format.
 *  Please use/modify time_TimeFrm.html(js) file to test the class when new modifications is applied.
 */
function TimeFrm(hour, min, frm_type){
    var def = {
        minutes: 0,
        frm_type: '24 hour' // or 12 hour
    };

    $.extend(this, def);

    if ( isNumber(hour) && isNumber(min) ) {
        this.minutes = hour * 60 + min;
    }

    frm_type = frm_type || App.Data.settings.get('settings_system').time_format;
    if (typeof(frm_type) === 'string') {
       this.frm_type = frm_type;
    }
}

/*
 *  Function: load_from_str
 *
 */
TimeFrm.prototype.load_from_str = function(time_str) {
    if (typeof this.load_from_str_ft[ this.frm_type ] === 'function' && typeof time_str === 'string')
    {
        this.load_from_str_ft[ this.frm_type ].call(this, time_str);
    }
    return this;
};

/* private functions load_from_str_ft */
TimeFrm.prototype.load_from_str_ft = { };

TimeFrm.prototype.load_from_str_ft['24 hour'] = function(time_str) {
    var time, hour, min;

    time = time_str.split(":");

    hour = 1 * time[0].match(/\d{1,2}$/);
    if (hour > 23) {
        return this;
    }

    min = 1 * time[1].match(/^\d{1,2}/);
    if (min > 59) {
        return this;
    }

    this.minutes = hour * 60 + min;

    return this;
};

//this is for future, not tested yet:
TimeFrm.prototype.load_from_str_ft['12 hour'] = function(time_str) {
    var time, hour, min, am_pm,
        hour_from_midnight;

    time = time_str.split(":");

    hour = parseInt(time[0].match(/\d{1,2}$/));
    if (isNaN(hour) || hour > 12 || hour === 0) {
        return this;
    }

    min = parseInt(time[1].match(/^\d{2}/));
    if (isNaN(min) || min > 59) {
        return this;
    }

    am_pm = time[1].match(/^\d{2}\s*(.{2})\s*/)[1];
    am_pm = am_pm.toUpperCase();

    if (am_pm === 'PM') {
        hour_from_midnight = (hour === 12) ? hour : hour + 12;
    } else if (am_pm === 'AM') {
        hour_from_midnight = (hour === 12) ? 0 : hour;
    } else {
        return this;
    }

    this.minutes = hour_from_midnight * 60 + min;

    return this;
};
/**
 * Output of time in requirement format.
 */
TimeFrm.prototype.toString = function(frm_type) {
    if (typeof frm_type === 'undefined') {
        frm_type = this.frm_type;
    }
    if (typeof this.toString_ft[ frm_type ] === 'function')
    {
        return this.toString_ft[ frm_type ].call(this);
    }
    return '';
};

/* private functions toString_ft */
TimeFrm.prototype.toString_ft = { };

TimeFrm.prototype.toString_ft['12 hour'] = function() {
    /* it outputs the time in format 10:01am or 12:45pm */

    var time_prefix = _loc['TIME_PREFIXES'],
        hour = parseInt( this.minutes / 60 ),
        minutes = this.minutes % 60;

    hour = hour - parseInt( hour / 24) * 24;
    var am_pm = (hour > 11) ? time_prefix['TIME_PM'] : time_prefix['TIME_AM'];

    if (hour > 12) {
        hour = hour - 12;
    }
    else {
        if (hour === 0) {
            hour = 12;
            am_pm = time_prefix['TIME_AM'];
        }
    }

    if (minutes < 10) {
        minutes = "0" + minutes;
    }
    var thetime = hour + ":" + minutes + am_pm;
    return thetime;
};

TimeFrm.prototype.toString_ft['24 hour'] = function() {

    var hour = parseInt( this.minutes / 60 ),
        minutes = this.minutes % 60;
        hour = hour - parseInt( hour / 24) * 24;

    if (minutes < 10) {
        minutes = "0" + minutes;
    }
    var thetime = hour + ":" + minutes;
    return thetime;
};

TimeFrm.prototype.get_minutes = function() {
    return this.minutes;
};

TimeFrm.prototype.set_minutes = function(minutes) {
    this.minutes = parseInt(minutes);
    return this;
};

/**
 * Checks if given version of Android is <= 4.2.1.
 * @param  {string} version - Android version.
 * @return {boolean}
 *     - true, if given version is considered old;
 *     - false otherwise.
 */
function check_android_old_version(version) {
    var old_version = false;
    var android_version = version.split(".");
    if (android_version[0] <= 4) {
        if (android_version[0] == 4) {
            if (android_version[1] && android_version[1] <= 2) {
                if (android_version[1] == 2) {
                    if ((android_version[2] && android_version[2] < 2) || (!android_version[2])) {
                        old_version = true;
                    }
                }
                else {
                    old_version = true;
                }
            }
            else if (!android_version[1]) {
                old_version = true;
            }
        }
        else {
            old_version = true;
        }
    }
    return old_version;
}

/**
 * Checks if it's Android device and browser is based on WebKit.
 */
function isAndroidWebKit() {
    return /Android/i.test(navigator.userAgent) && /WebKit/i.test(navigator.userAgent);
}

/**
 * Loads image spinner.
 * @param   {jQuery}   logo - img element(s).
 * @param   {*} anim_params
 *     - object in following format:
 *     ```
 *     {
 *         anim: false|true, // use animation or not
 *         spinner: false|true // show spinner or not
 *     }
 *     ```
 *     - true|false - use animtaion or not.
 * @param   {Function} cb - callback function.
 * @returns {jQuery} spinner element.
 */
function loadSpinner(logo, anim_params, cb) {
    var show_spinner = true,
        anim = typeof anim_params == 'undefined' ? true : anim_params;
    if (anim_params instanceof Object) {
        //anim_params is params like {spinner: false, anim: false}
        anim = typeof anim_params.anim == 'undefined' ? true : anim_params.anim;
        show_spinner = typeof anim_params.spinner == 'undefined' ? true : anim_params.spinner;
    }
    var s;
    logo.each(function() {
        var logo = $(this),
            parent = logo.parent(),
            defImage = App.Data.settings.get_img_default(logo.attr('data-default-index')),
            hash = makeImageName(logo),
            img, spinner;
        if(hash in App.Data.images) {
            if (App.Data.images[hash].attr('src') == defImage)
                parent.addClass('no-photo');
            var clone = App.Data.images[hash].clone();
            logo.replaceWith(clone);
            s = clone;
            return;
        }
        spinner = $('<div class="img-spinner"></div>');

        if (show_spinner) {
            spinner.spinner();
        }

        logo.replaceWith(spinner);
        img = logo.clone();
        img.css('display','none');
        $('body').append(img);
        img.on('load', function() { //load method - deprecated
            setTimeout(function() {
                spinner.replaceWith(img);
                anim ? img.fadeIn() : img.show();
                App.Data.images[makeImageName(logo)] = img.clone().css('opacity', '1');
                typeof cb == 'function' && cb(img);
            }, 100);
        }).error(function(e) {
            logo.prop('src', defImage);
            spinner.replaceWith(logo);
            parent.addClass('no-photo');
            App.Data.images[makeImageName(logo)] = logo.clone();
            img.remove();
            typeof cb == 'function' && cb(logo);
            //App.Data.log && App.Data.log.pushImageError(e.target.src); //no need to push it to GA now
        });
        if (s == undefined) {
            s = $(spinner);
        } else {
            s.add(spinner);
        }
    });
    return s;
}

/**
 * Generates image hash.
 * @param   {jQuery} image - image element.
 * @returns {string} image hash (encoded string).
 */
function makeImageName(image) {
	return utf8_to_b64(image.attr('src') + image.attr('alt'));
}

/**
 * Creates base-64 encoded ASCII string from a Unicode string.
 * @param   {string} str - String to encode.
 * @returns {string} Encoded string.
 */
function utf8_to_b64(str) {
    return btoa(encodeURIComponent(str)); // encodeURIComponent is used to avoid raising InvalidCharacterError exception
}

/**
 * Decodes a string which has been encoded using base-64 encoding.
 * @param   {string} str - String to decode.
 * @returns {string} Decoded string.
 */
function b64_to_utf8(str) {
    return decodeURIComponent(atob(str));
}

/**
 * Checks if the app is opened on IE mobile.
 * @returns {boolean}
 */
function isIEMobile() {
    if (isIEMobile.retval) {
        return isIEMobile.retval;
    }
    else {
        isIEMobile.retval = (navigator.userAgent.match(/IEMobile/) ? true : false);
        return isIEMobile.retval;
    }
}

/**
 * Checks if the app is opened on iPad device.
 * @returns {boolean}
 */
function iPad() {
    if (iPad.retval) {
        return iPad.retval;
    }
    else {
        iPad.retval = /ipad/i.test(window.navigator.userAgent) ? true : false;
        return iPad.retval;
    }
}

/**
 * Checks if the app is opened on iOS device.
 * @returns {boolean}
 */
function isIOS() {
    if (iPad.retval) {
        return iPad.retval;
    }
    else {
        iPad.retval = /iPad|iPod|iPhone/.test(window.navigator.userAgent);
        return iPad.retval;
    }
}

/**
 * Converts pickup time to string in format like "Mar 28, 14:54".
 * @param {Date} date - date.
 * @returns {string}
 */
function pickupToString(date) {
    var skin = App.Data.settings.get('skin'),
        result,
        d = new Date(date),
        time = new TimeFrm(d.getHours(), d.getMinutes());
    //"Mon Dec 30 2013 10:30:00 GMT+0400 (Russian Standard Time)"
    switch (skin) {
        case 'weborder':
        case 'weborder_mobile':
            result = d.toString().replace(/([a-z]+) ([a-z]+) (\d{1,2}) .+/i,'$2 $3, ').concat(time.toString());
    }

    return result;
}

/**
 * Creates and returns a deep copy. Checks array and object before copying.
 * @param {*} data - data to deep copy.
 * @returns {*} deep copy of given data.
 */
function deepClone(data) {
    var i, j, obj;
    if (Array.isArray(data)) {
        obj = [];
        for (i = 0, j = data.length; i < j; i++) {
            obj.push(deepClone(data[i]));
        }
    } else if (data instanceof Object) {
        obj = {};
        for (i in data) {
            obj[i] = deepClone(data[i]);
        }
    } else {
        obj = data;
    }
    return obj;
}

/**
 * Escapes special characters in RegExp string.
 * @param {string} str - escaped string.
 */
function escapeRegExp(str) {
    return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
}

/**
 * 'Replace all' function.
 * @param   {string} find    - string that is to be replaced by `replace`.
 * @param   {string} replace - string that replaces the found matches.
 * @param   {string} str     - source string.
 * @returns {string}
 */
function replaceAll(find, replace, str) {
    return str.replace(new RegExp(escapeRegExp(find), 'g'), replace);
}

/**
 * Use mask for input field.
 * @param   {jQuery} el      - input element.
 * @param   {RegExp} pattern - RegExp pattern.
 * @param   {string} initial - initial value.
 * @param   {string} type
 *     - 'integer', (number keyboard for numbers like 100)
 *     - 'float', (number or tel keyboard for floats like 5.25)
 *     - 'numeric' (number or tel keyboard for strings of digits "000123456" (zero can be in front of it),
 *     - 'cardNumber' (number or text keyboard for strings of digits "0001-23-456" (like 'numeric', but may have minus),
 *     - 'text', (for general text keyboard)
 *     - 'tel' (for phones)
 */
function inputTypeMask(el, pattern, initial, type) {
    inputTypeSwitcher(el, type);

    var prev = initial && initial.toString() || '';
    el.on('input', function(a) {
        if (!pattern.test(a.target.value) || !a.target.value && !this.validity.valid) {
            a.target.value = prev;
            el.off('blur', change); // `change` event is not emitted after this case
            el.one('blur', change); // need reproduce it
        } else {
            prev = a.target.value;
        }
    });
    el.on('change', function(a) {
        prev = a.target.value;
    });

    function change() {
        el.trigger('change');
    }
}

/**
 * Switches input type.
 * @param   {jQuery} el   - input element.
 * @param   {string} type
 *     - 'integer', (number keyboard for numbers like 100)
 *     - 'float', (number or tel keyboard for floats like 5.25)
 *     - 'numeric' (number or tel keyboard for strings of digits "000123456" (zero can be in front of it),
 *     - 'cardNumber' (number or text keyboard for strings of digits "0001-23-456" (like 'numeric', but may have minus),
 *     - 'text', (for general text keyboard)
 */
function inputTypeSwitcher(el, type) {
    if (cssua.userAgent.mobile) { //change the type only for mobile devices, desktop browsers add the arrows up/down for number keyboard
        if (type == 'integer') {
            el.attr("type", "number");
        }
        else if (type == 'float') { //for float numbers (1.23)
            if (cssua.userAgent.android)
                el.attr("type", "tel");
                // "phone" touchpad on ios doesn't have '.', ',' symbols
            else
                el.attr("type", "number");
                // Some devices have problem with numeric (type='number') keypad - don't have '.', ',' symbols (Bug 11032, 53186)
        }
        else if (type == 'numeric') { //for numeric text (e.g 000123456)
            if (parseFloat(cssua.userAgent.android) >= 4.3 || parseFloat(cssua.userAgent.ios) >= 7)
                el.attr("type", "number");
            else {
                el.attr("type", "tel"); // Bug 13910 - Android: CVV > the 1st digit zero is removed from the field (for 'number' keyboard)
                //Android and iOS devices (ver <= 6) removes automatically '0' digit in 'number' fields if it's the first digit
            }
        }
        else if (type == 'cardNumber') { //for numeric text (e.g 0001-234-56)
            if (parseFloat(cssua.userAgent.android) >= 4.3 || parseFloat(cssua.userAgent.ios) >= 7)
                el.attr("type", "number");
            else {
                el.attr("type", "text"); // 'text' due to 'tel' doesn't allow '-'
            }
        }
        else if (type == 'text') {
            el.attr("type", "text");
        } else {
            //don't change type if type=undefined, it should be for <input type=text(tel) ..> only
        }
    }
}

/**
 * Saves all data.
 */
function saveAllData() {
    var settings = App.Data.settings,
        ests = App.Data.establishments;
    App.Data.myorder.saveOrders();
    App.Data.card && App.Data.card.saveCard();
    App.Data.customer.saveCustomer();
    App.Data.stanfordCard && App.Data.stanfordCard.saveCard();
    settings.saveSettings();
    ests && ests.saveEstablishment(settings.get('establishment'));
}

/**
 * Calls callback function when element is inserted to DOM.
 * @param {jQuery}   $el - target element.
 * @param {Function} cb  - callback function.
 */
function listenToInsertionIntoDOM($el, cb) {
    if (typeof cb != 'function') {
        throw 'listenToInsertionIntoDOM: `cb` parameter should be a function';
    }

    if ('MutationObserver' in window) {
        var observer = new MutationObserver(function(mutations) {
            mutations.some(function(mutation) {
                if(mutation.addedNodes.length && Backbone.$(mutation.target).find($el).length) {
                    cb();
                    observer.disconnect();
                    return true;
                }
            });
        });
        observer.observe(document.body, {childList: true, subtree: true});
    } else {
        $el.one('DOMNodeInsertedIntoDocument', cb);
    }
}

/**
 * Transform the first letter to upper case.
 * @param   {string} text - text to transform.
 * @returns {string}
 */
function fistLetterToUpperCase(text) {
    return text.replace(/(^[a-z])|\s([a-z])/g, function(m, g1, g2){
        return g1 ? g1.toUpperCase() : ' ' + g2.toUpperCase();
    });
}

/**
 * Formats time array as string.
 * @param   {array} time - array in format ["hh", "mm"], e.g. ["23", "59"]
 * @returns {string} - formatted string, e.g. "23:59".
 */
function format_time(time) {
    time = time.split(":")
    return new TimeFrm(time[0] * 1, time[1] * 1).toString();
}

/**
 * Formats day timetable.
 * @param   {array} days      - array of days names, e.g. ["monday"]
 * @param   {string} day_time - time period, e.g. "0:00 - 23:59"
 * @returns {string} - e.g. "Mon 0:00 - 23:59"
 */
function format_days(days, day_time) {
    var str = "";
    if (days.length > 1 && days.length < 7) {
        str = _loc.DAYS_OF_WEEK_SHORT[days[0]] + ' - ' + _loc.DAYS_OF_WEEK_SHORT[days[days.length - 1]] + ' ';
    } else if (days.length == 1) {
        str = _loc.DAYS_OF_WEEK_SHORT[days[0]] + ' ';
    }
    str += day_time;
    return str;
}

/**
 * Formats time periods.
 * @param   {array}  times     - array of time periods objects, e.g.
 * ```
 * [{
 *     from: "08:00",
 *     to: "13:00"
 * },
 * {
 *     from: "14:00",
 *     to: "18:00"
 * }]
 * ```
 * @param   {string} separator - separator.
 * @returns {string} formatted and concatenated time periods, e.g. "8:00 - 13:00, 14:00 - 18:00".
 */
function format_times(times, separator) {
    if (!times) {
        return null;
    }

    var res = []

    times.forEach(function (time) {
        res.push(format_time(time['from']) + ' - ' + format_time(time['to']));
    });

    if (separator == undefined) {
        separator = ', ';
    }

    return res.join(separator);
}

/**
 * Formats timetables.
 * @param   {array} timetables  - array of timetables.
 * @param   {?string} separator - separator.
 * @returns {string} formatted timetables.
 */
function format_timetables(timetables, separator) {
    if (!timetables) {
        return null;
    }
    var res = [];
    var always = false;

    timetables.forEach(function (timetable) {
        var timetable_data = timetable.timetable_data
        if (!timetable_data || $.isEmptyObject(timetable_data)) {
            always = true;
            return;
        }
        var prev_day_time = null;
        var days = [];

        for(day in _loc.DAYS_OF_WEEK_SHORT) {
            var day_time = null;
            if (timetable_data[day] && timetable_data[day].length > 0) {
                day_time = format_times(timetable_data[day])
            }

            if (prev_day_time &&
                (!day_time || prev_day_time != day_time)) {
                res.push(format_days(days, prev_day_time));
                days = [];
            }
            if (day_time) {
                prev_day_time = day_time;
                days.push(day);
            } else {
                prev_day_time = null;
                days = [];
            }
        }

        if (prev_day_time) {
            res.push(format_days(days, prev_day_time));
        }
    });
    if (always) {
        return null;
    }
    if (separator == undefined) {
        separator = ', ';
    }
    return res.join(separator);
}
// End of timetable functions

var PaymentProcessor = {
    clearQueryString: function(payment_type, isNotHash) {
        var hash = isNotHash ? '' : location.hash,
            qStr = location.search,
            path = window.location.pathname,
            host = window.location.origin;

        qStr = qStr.replace(/&?pay=[^&]*/, '');
        qStr = this.getPaymentProcessor(payment_type).clearQueryString(qStr);

        var url = host + path + qStr + hash;
        window.history.replaceState('Return','', url);
    },
    getConfig: function(processors, skin) {
        var creditCardPaymentProcessor = this.getCreditCardPaymentProcessor();
        var credit_card_button = creditCardPaymentProcessor != null;

        if ((skin == App.Skins.WEBORDER || skin == App.Skins.WEBORDER_MOBILE || skin == App.Skins.RETAIL)
            && !credit_card_button && !processors.paypal && !processors.cash && !processors.gift_card && !processors.stanford) {
            return undefined;
        }

        var credit_card_dialog = credit_card_button && creditCardPaymentProcessor.showCreditCardDialog();
        var payment_count = 0;
        credit_card_button && payment_count++;
        processors.paypal && payment_count++;
        processors.cash && payment_count++;
        processors.gift_card && payment_count++;
        processors.stanford && payment_count++;

        return {
            payment_count: payment_count,
            credit_card_button: credit_card_button,
            credit_card_dialog: credit_card_dialog
        };
    },
    processPaymentType: function(payment_type, myorder) {
        var get_parameters = App.Data.get_parameters,
            payment_info = {},
            pay_get_parameter = get_parameters.pay;

        // Clear pay flag, it should not affect next payments
        delete get_parameters.pay;

        if (payment_type == PAYMENT_TYPE.CREDIT) {
            var card = App.Data.card && App.Data.card.toJSON()
            var address = null;
            if (card.street) {
                address = {
                    street: card.street,
                    city: card.city,
                    state: card.state,
                    zip: card.zip
                };
            }

            var cardNumber = $.trim(card.cardNumber);
            payment_info.cardInfo = {
                firstDigits: cardNumber.substring(0, 4),
                lastDigits: cardNumber.substring(cardNumber.length - 4),
                firstName: card.firstName,
                lastName: card.secondName,
                address: address
            };
        }

        var payment_processor = this.getPaymentProcessor(payment_type);
        trace({for: 'pay'}, "payment processor is:", logSafe(payment_processor, 'name'));
        payment_info = payment_processor.processPayment(myorder, payment_info, pay_get_parameter);
        this.clearQueryString(payment_type);

        return payment_info;
    },
    handleRedirect: function(payment_type, myorder, data) {
        var processor = this.getPaymentProcessor(payment_type);
        if (processor.handleRedirect) {
            processor.handleRedirect(myorder, data);
        }

        myorder.checkout.set('payment_type', payment_type);
        myorder.checkout.saveCheckout();

        // Put flag pay=false to storage to handle a return from another site via history.back() method.
        this.saveDefaultState();

        // Start payment transaction. It will be completed when payment capture phase is processed.
        this.startTransaction();

        function doFormRedirect(action, query) {
            var newForm= $('<form>', {
                'action': action,
                'method': 'post'
            });
            for(var i in query) {
                newForm.append($('<input>', {
                    name: i,
                    value: processValue(query[i]),
                    type: 'hidden'
                }));
            }
            trace({for: 'pay'}, "Redirect to", action, getFormParams(newForm[0]));
            newForm.appendTo(document.body).submit();
        }

        function getFormParams(form) {
            var pairs = [];
            for ( var i = 0; i < form.elements.length; i++ ) {
               var e = form.elements[i];
               pairs.push(decodeURIComponent(e.name) + "=" + decodeURIComponent(e.value));
            }
            return pairs.join(", ");
        }

        function processValue(value) {
            var card = App.Data.card && App.Data.card.toJSON();
            var map = {
                '$cardNumber': card.cardNumber,
                '$expMonth': card.expMonth,
                '$expDate': card.expDate,
                '$expYYYY': card.expDate,
                '$expYY': card.expDate ? card.expDate.substring(2) : undefined,
                '$securityCode': card.securityCode
            };

            for(var key in map) {
                if(value && (typeof value === 'string' || value instanceof String)) {
                    value = replaceAll(key, map[key], value);
                }
            }

            return value;
        }

        if (data.data.url) {
            window.location = data.data.url;
        } else if (data.data.action && data.data.query) {
            doFormRedirect(data.data.action, data.data.query);
        }
        return;
    },
    handlePaymentDataRequest: function(payment_type, myorder, data) {
        var processor = this.getPaymentProcessor(payment_type);
        if (processor.handlePaymentDataRequest) {
            processor.handlePaymentDataRequest(myorder, data);
        }
    },
    handlePaymentRequestFailure: function(payment_type, data) {
        var processor = this.getPaymentProcessor(payment_type, data);
        if (processor.handlePaymentRequestFailure) {
            processor.handlePaymentRequestFailure(data);
        }
    },
    // Bug #25585
    setPaymentData: function() {
        setData(App.Data.router.getUID() + '.paymentData', App.Data.get_parameters);
    },
    getPaymentData: function() {
        return getData(App.Data.router.getUID() + '.paymentData');
    },
    removePaymentData: function() {
        removeData(App.Data.router.getUID() + '.paymentData');
    },
    getPaymentProcessor: function(payment_type) {
        var payment_processor = null;
        switch (payment_type) {
            case PAYMENT_TYPE.CREDIT:
                payment_processor = this.getCreditCardPaymentProcessor()
                break;
            case PAYMENT_TYPE.PAYPAL:
                payment_processor = PayPalPaymentProcessor;
                break;
            case PAYMENT_TYPE.PAYPAL_MOBILE:
                payment_processor = PayPalMobilePaymentProcessor;
                break;
            case PAYMENT_TYPE.GIFT:
                payment_processor = GiftCardPaymentProcessor;
                break;
            case PAYMENT_TYPE.STANFORD:
                payment_processor = StanfordCardPaymentProcessor;
                break;
            case PAYMENT_TYPE.NO_PAYMENT:
                payment_processor = NoPaymentPaymentProcessor;
                break;
        }
        return payment_processor;
    },
    getCreditCardPaymentProcessor: function() {
        var payment_processor = null;

        var payment = App.Settings.payment_processor;
        if (!_.isObject(payment)) {
            return payment_processor;
        }
        if (payment.usaepay) {
            payment_processor = USAePayPaymentProcessor;
        } else if (payment.mercury) {
            payment_processor = MercuryPaymentProcessor;
        } else if (payment.moneris) {
            payment_processor = MonerisPaymentProcessor;
        } else if (payment.quickbooks) {
            payment_processor = QuickBooksPaymentProcessor;
        } else if (payment.adyen && window.location.hostname != "bellpepper.revelup.com" && window.location.hostname != "bellpepper-dev.revelup.com") {//#55981
            payment_processor = AdyenPaymentProcessor;
        } else if (payment.worldpay) {
            payment_processor = WorldPayPaymentProcessor;
        } else if (payment.freedompay) {
            payment_processor = FreedomPayPaymentProcessor;
        } else if (payment.cresecure) {
            payment_processor = CRESecurePaymentProcessor;
        } else if (payment.braintree) {
            payment_processor = BraintreePaymentProcessor;
        } else if (payment.globalcollect) {
            payment_processor = GlobalCollectPaymentProcessor;
        } else if (payment.adyen && (window.location.hostname == "bellpepper.revelup.com" || window.location.hostname == "bellpepper-dev.revelup.com")) {//#55981
            payment_processor = AdyenPaymentProcessor;
        }
        return payment_processor;
    },
    /**
     * Returns true if card type payment processor needs billing address to be filled.
     */
    isBillingAddressCard: function() {
        var pp = this.getCreditCardPaymentProcessor();
        return pp == GlobalCollectPaymentProcessor;
    },
    /**
     * Save default state of payment (string 'false') of app in storage before redirect to another page.
     */
    saveDefaultState: function() {
        if(App.Data.router) {
            setData(App.Data.router.getUID() + '.pay', 'false');
        }
    },
    /**
     * Restore default state for app if exists and remove it from storage.
     */
    loadDefaultState: function() {
        var key = App.Data.router.getUID() + '.pay',
            result;
        if(App.Data.router) {
            result = getData(key);
        }
        removeData(key);
        return result;
    },
    /**
     * Method adds a flag for app which means redirection to another site has been performed.
     * Put {'<App UID>.isTransactionInProcess': true} record to a storage.
     *
     * App.Routers.MainRouter.prototype.getUID() method is used to define App UID.
     * So if App.Data.router is undefined this method cannot be executed.
     */
    startTransaction: function() {
        if(!App.Data.router) {
            return;
        }
        setData(App.Data.router.getUID() + '.isTransactionInProcess', true);
    },
    /**
     * Method returns value of '<App UID>.isTransactionInProcess' record in a storage.
     *
     * App.Routers.MainRouter.prototype.getUID() method is used to define App UID.
     * So if App.Data.router is undefined this method cannot be executed.
     */
    isTransactionInProcess: function() {
        if(!App.Data.router) {
            return;
        }
        return getData(App.Data.router.getUID() + '.isTransactionInProcess');
    },
    /**
     * Method removes '<App UID>.isTransactionInProcess' record from a storage.
     *
     * App.Routers.MainRouter.prototype.getUID() method is used to define App UID.
     * So if App.Data.router is undefined this method cannot be executed.
     */
    completeTransaction: function() {
        if(!App.Data.router) {
            return;
        }
        removeData(App.Data.router.getUID() + '.isTransactionInProcess');
        this.removePaymentData();
    }
};

/*
* Template for any payment processor
* */
var NoPaymentPaymentProcessor = {
    /*
    *  Removes query string parameters added by payment gateway when returning back to our app
    */
    clearQueryString: function(queryString) {
        return queryString;
    },
    /*
    *  That is for credit card processors only. Defines where credit card data can be enter in
    *  our form or payment gateway hosted page.
    */
    showCreditCardDialog: function() {
        return false;
    },
    /*
    *  Implement this method to store any data to local storage before before redirect.
    */
    handleRedirect: function(myorder, data) {
    },
    /*
    *  Implement this method to make direct ajax calls to payment gateway.
    *  Gateway must support CORS.
    */
    handlePaymentDataRequest: function(myorder, data) {
    },
    /*
    *  Adds any processor specific data from get_parameters or model to payment_info.
    *  Set 'errorMsg' property for return object to trigger error
    */
    processPayment: function(myorder, payment_info, pay_get_parameter) {
        return payment_info;
    }
};

var USAePayPaymentProcessor = {
    name: 'USAePayPaymentProcessor',
    clearQueryString: function(queryString) {
        return queryString.replace(/&?UM[^=]*=[^&]*/g, '').replace(/&?card_type=[^&]*/g, '');
    },
    showCreditCardDialog: function() {
        return true;
    },
    processPayment: function(myorder, payment_info, pay_get_parameter) {
        if (pay_get_parameter) {
            var get_parameters = App.Data.get_parameters;
            if (pay_get_parameter === 'true') {
                if (get_parameters.UMcardRef && get_parameters.card_type && get_parameters.UMmaskedCardNum) {
                    // these parameters exist in token creation request
                    payment_info.token = get_parameters.UMcardRef;
                    payment_info.card_type = parseInt(get_parameters.card_type, 10);
                    payment_info.masked_card_number = get_parameters.UMmaskedCardNum;
                } else {
                    // default behavior after payment creation
                    payment_info.transaction_id = get_parameters.UMrefNum;
                }
            } else {
                payment_info.errorMsg = get_parameters.UMerror;
            }
        }
        return payment_info;
    }
};

var BraintreePaymentProcessor = {
    name: 'BraintreePaymentProcessor',
    clearQueryString: function(queryString) {
        return queryString;
    },
    showCreditCardDialog: function() {
        return true;
    },
    processPayment: function(myorder, payment_info, pay_get_parameter) {
        return payment_info;
    },
    handlePaymentDataRequest: function(myorder, data) {
        var js = "js/libs/braintree.js"; //it's to exclude braintree.js from minimized main.js file (made by build.js procedure).
        require([js], function(braintree) {
            var card = App.Data.card;
            var client = new braintree.api.Client({clientToken: data.data.app_token});
            client.tokenizeCard({
                number: card.get("cardNumber"),
                cardholderName: card.get("firstName") + " " + card.get("lastName"),
                // expirationMonth and expirationYear
                expirationMonth: card.get("expMonth"),
                expirationYear: card.get("expDate"),
                // CVV if required
                cvv: card.get("securityCode"),
                // Address if AVS is on
                // billingAddress: {
                //    postalCode: "94107"
                // }
            }, function (err, nonce) {
                var errorMsg;
                // Send nonce to your server
                if (!err) {
                    App.Data.card.set('nonce', nonce);
                    myorder.submit_order_and_pay(PAYMENT_TYPE.CREDIT, false, myorder.paymentResponse.capturePhase);
                } else {
                    errorMsg = MSG.ERROR_OCCURRED + ' ' + MSG.ERROR_DURING_TOKENIZATION;
                    myorder.paymentResponse = {status: 'error', errorMsg: errorMsg};
                    myorder.trigger('paymentResponse');
                }
            });
        });
    }
};

var GlobalCollectPaymentProcessor = {
    name: 'GlobalCollectPaymentProcessor',
    clearQueryString: function(queryString) {
        return queryString;//.replace(/&?UM[^=]*=[^&]*/g, '');
    },
    showCreditCardDialog: function() {
        return true;
    },
    processPayment: function(myorder, payment_info, pay_get_parameter) {
        return payment_info;
    },
    handlePaymentDataRequest: function(myorder, data) {
        var self = this,
            card = App.Data.card;
            token_arr = data.data.app_token.split(":");
        var js = "js/libs/gcsdk.js"; //it's to exclude gcsdk.js from minimized main.js file (made by build.js procedure).
        var defineOld = define;
        define = undefined;
        require([js], function(gcsdk) {
            define = defineOld; //restore the define function from require.js

            var session = new GCsdk.Session({
                clientSessionID : token_arr[0],
                customerId : token_arr[1],
                region : token_arr[2], // EU or US
                environment: token_arr[3] == "True" ? "SANDBOX" : "PROD" // PROD, PREPROD or SANDBOX
            });

            // We assume we already have a Session stored in the variable "session".
            // See Session how to create such an instance.
            var billing_address = get_billing_address();
            var paymentDetails = { "totalAmount" : parseInt(parseFloat(App.Data.myorder.total.get_grand()) * 100), // in cents
                                   "countryCode" : billing_address ? billing_address.country_code : 'error',
                                   "locale" : "en_GB", // as specified in the config center
                                   "isRecurring" : false, // set if recurring
                                   "currency" : App.Settings.currency_name // set currency, see dropdown
                                 };

        var card_type = get_card_type(card.get("cardNumber"));
        if (!card_type) {
            on_error(ERROR.CARD_TYPE_IS_NOT_RECOGNIZED);
            return;
        }
        var productID = self.getGlobalCollectProductID(card_type);
        if (!productID) {
            on_error(ERROR.CARD_TYPE_IS_NOT_SUPPORTED);
            return;
        }
        session.getPaymentProduct(productID, paymentDetails).then(
            function(paymentProduct) {
                var paymentRequest = session.getPaymentRequest();  // This will return the same instance of PaymentRequest every time.
                paymentRequest.setPaymentProduct(paymentProduct);  // paymentProduct is an instance of the PaymentProduct class (not BasicPaymentProduct)
                //paymentRequest.setAccountOnFile(accountOnFile);    // accountOnFile is an instance of the AccountOnFile class
                //paymentRequest.setTokenize(false);

                var paymentRequest = session.getPaymentRequest();  // This will return the same instance of PaymentRequest every time.
                paymentRequest.setValue("cardNumber", card.get("cardNumber")); // This should be the unmasked value.
                paymentRequest.setValue("cvv", card.get("securityCode"));
                paymentRequest.setValue("expiryDate", card.get("expMonth") + "/" + card.get("expDate").substring(2));

                var encryptor = session.getEncryptor();

                // Encrypting is an async task that we provide you as a promise.
                encryptor.encrypt(paymentRequest).then(function(encryptedString) {
                  // The encryptedString contains the ciphertext
                  // that should be sent to the GlobalCollect platform via the Server API
                    App.Data.card.set('encrypted_customer_input', encryptedString);
                    myorder.submit_order_and_pay(PAYMENT_TYPE.CREDIT, false, myorder.paymentResponse.capturePhase);
                }, function(errors) {
                    on_error(MSG.ERROR_DURING_TOKENIZATION, errors)
                });

            }, function(errors) {
                // The promise failed, inform the user what happened.
                on_error(MSG.ERROR_DURING_TOKENIZATION, errors)
            });

            function on_error(errorMsg, errors) {
                var errorMsg = MSG.ERROR_OCCURRED + ' ' + errorMsg;
                //trace(errorMsg + (errors ? (": " + errors) : ""));
                myorder.paymentResponse = {status: 'error', errorMsg: errorMsg};
                myorder.trigger('paymentResponse');
            }
        });
    },
    getGlobalCollectProductID: function( backendCardType ) {
        /*
        these are payment cards supported by Global Collect:
        1:Visa
        2:American Express
        3:MasterCard
        11:Bank Transfer
        114:Visa Debit
        119:MasterCard Debit
        122:Visa Electron
        125:JCB
        128:Discover
        132:Diners Club
        201:Invoice
        430:UnionPay
        830:paysafecard
        840:PayPal
        841:WebMoney
        843:Skrill
        845:CASHU
        861:Alipay
        870:Boku
        1501:Western Union
        8583:QIWI Recurring */
        var _map = {},
            _types = ACCEPTABLE_CREDIT_CARD_TYPES;
        _map[_types.AMERICANEXPRESS] = "2";
        _map[_types.DISCOVER] = "128";
        _map[_types.MASTERCARD] = "3";
        _map[_types.VISA] = "1";
        _map[_types.DINERS] = "132";
        _map[_types.JCB] = "125";

        if (_map[backendCardType]) {
            return _map[backendCardType];
        } else
            return null; //not supported
    }
};

var MERCURY_RETURN_CODE = {
    SUCCESS : 0,
    AUTH_FAIL : 100,
    CARD_DECLINED : 101,
    CANCEL : 102,
    SESSION_TIMEOUT : 103,
    MAINTENANCE_MODE : 104,
    SAVE_CARD_INFO_FAIL : 206,
    LOAD_CARD_INFO_FAIL : 207,
    PROCESS_CARD_INFO_FAIL : 208,
    VALIDATION_CC_FAIL : 301,
    VALIDATION_SERVER_SIDE_FAILURE :302,
    VALIDATE_NAME_FAIL : 302
};

var MERCURY_RETURN_MESSAGE = {};

$(window).on('LocalizationCompleted', function() {
    MERCURY_RETURN_MESSAGE[MERCURY_RETURN_CODE.SUCCESS] = MSG.MERCURY_RETURN_MESSAGE_SUCCESS;
    MERCURY_RETURN_MESSAGE[MERCURY_RETURN_CODE.AUTH_FAIL] = MSG.MERCURY_RETURN_MESSAGE_AUTH_FAIL;
    MERCURY_RETURN_MESSAGE[MERCURY_RETURN_CODE.CARD_DECLINED] = MSG.MERCURY_RETURN_MESSAGE_CARD_DECLINED;
    MERCURY_RETURN_MESSAGE[MERCURY_RETURN_CODE.CANCEL] = MSG.MERCURY_RETURN_MESSAGE_CANCEL;
    MERCURY_RETURN_MESSAGE[MERCURY_RETURN_CODE.SESSION_TIMEOUT] = MSG.MERCURY_RETURN_MESSAGE_SESSION_TIMEOUT;
    MERCURY_RETURN_MESSAGE[MERCURY_RETURN_CODE.MAINTENANCE_MODE] = MSG.MERCURY_RETURN_MESSAGE_MAINTENANCE_MODE;
    MERCURY_RETURN_MESSAGE[MERCURY_RETURN_CODE.SAVE_CARD_INFO_FAIL] = MSG.MERCURY_RETURN_MESSAGE_SAVE_CARD_INFO_FAIL;
    MERCURY_RETURN_MESSAGE[MERCURY_RETURN_CODE.LOAD_CARD_INFO_FAIL] = MSG.MERCURY_RETURN_MESSAGE_LOAD_CARD_INFO_FAIL;
    MERCURY_RETURN_MESSAGE[MERCURY_RETURN_CODE.PROCESS_CARD_INFO_FAIL] = MSG.MERCURY_RETURN_MESSAGE_PROCESS_CARD_INFO_FAIL;
    MERCURY_RETURN_MESSAGE[MERCURY_RETURN_CODE.VALIDATION_CC_FAIL] = MSG.MERCURY_RETURN_MESSAGE_VALIDATION_CC_FAIL;
    MERCURY_RETURN_MESSAGE[MERCURY_RETURN_CODE.VALIDATION_SERVER_SIDE_FAILURE] = MSG.MERCURY_RETURN_MESSAGE_VALIDATION_SERVER_SIDE_FAILURE;
    MERCURY_RETURN_MESSAGE[MERCURY_RETURN_CODE.VALIDATE_NAME_FAIL] = MSG.MERCURY_RETURN_MESSAGE_VALIDATE_NAME_FAIL;
    MERCURY_RETURN_MESSAGE_DEFAULT = MSG.MERCURY_RETURN_MESSAGE_DEFAULT;
});

var MercuryPaymentProcessor = {
    name: 'MercuryPaymentProcessor',
    clearQueryString: function(queryString) {
        qStr = queryString.replace(/&amp;/g, '&');
        qStr = qStr.replace(/&&/g, '&');
        qStr = qStr.replace(/&?PaymentID=[^&]*/, '');
        qStr = qStr.replace(/&?ReturnCode=[^&]*/, '');

        return qStr;
    },
    showCreditCardDialog: function() {
        return false;
    },
    processPayment: function(myorder, payment_info, pay_get_parameter) {
        var customer = App.Data.customer,
            payments = customer.payments;

        trace({for: 'pay'}, "processPayment, pay_get_parameter =", pay_get_parameter);
        if (pay_get_parameter) {
            var get_parameters = App.Data.get_parameters,
                returnCode = Number(get_parameters.ReturnCode),
                savedIgnoreSelectedToken = this.loadIgnoreSelectedToken();

            trace({for: 'pay'}, "processPayment, returnCode =", returnCode, MERCURY_RETURN_MESSAGE[returnCode]);
            if (pay_get_parameter === 'true' && returnCode == MERCURY_RETURN_CODE.SUCCESS) {
                payment_info.transaction_id = get_parameters.PaymentID;
            } else {
                payment_info.errorMsg = MERCURY_RETURN_MESSAGE[returnCode];
                if (!payment_info.errorMsg) {
                    payment_info.errorMsg = MERCURY_RETURN_MESSAGE_DEFAULT;
                }
            }
            // restore payments.ignoreSelectedToken from a storage
            if (payments && typeof savedIgnoreSelectedToken == 'boolean') {
                payments.ignoreSelectedToken = savedIgnoreSelectedToken;
            }
        } else if(payments) {
            // save payments.ignoreSelectedToken to restore that value in capture phase
            this.saveIgnoreSelectedToken(payments.ignoreSelectedToken);
        }
        return payment_info;
    },
    /**
     * Key used as storage record name.
     */
    ignoreSelectedTokenKey: '.mercury_ignore_selected_token',
    /**
     * Saves `ignoreSelectedToken` value of payment tokens collection in storage to restore that value after redirect.
     * The redirect occurs in case payment token creation.
     * @param {boolean} value - payment tokens collection `ignoreSelectedToken` value
     */
    saveIgnoreSelectedToken: function(value) {
        if(App.Data.router) {
            setData(App.Data.router.getUID() + this.ignoreSelectedTokenKey, value);
        }
    },
    /**
     * Restores `ignoreSelectedToken` of payment tokens collection from storage.
     * @returns {boolean} Saved value of `ignoreSelectedToken`
     */
    loadIgnoreSelectedToken: function() {
        if(App.Data.router) {
            var uid = App.Data.router.getUID(),
                savedValue = getData(App.Data.router.getUID() + this.ignoreSelectedTokenKey);
            removeData(App.Data.router.getUID() + this.ignoreSelectedTokenKey);
            return savedValue;
        }

    }
};

var MONERIS_RETURN_CODE = {
    DECLINE: 50
};

var MONERIS_RETURN_MESSAGE = {
    50: "Decline",
    51: "Expired Card",
    52: "PIN retries exceeded",
    53: "No sharing",
    54: "No security module",
    55: "Invalid transaction",
    56: "Card not supported",
    57: "Lost or stolen card",
    58: "Card use limited",
    59: "Restricted Card",
    60: "No Chequing account"
};
MONERIS_RETURN_MESSAGE_DEFAULT = "Unknown error";

var MONERIS_WRONG_CONFIGURATION = "Error in Merchant's Moneris Account configuration: transaction id is not present in pre-authorization response.";
    MONERIS_WRONG_CONFIGURATION += " Please make sure that 'Directpost Configuration' > 'Configure Response Fields' > 'Return the txn_number' is enabled.";

var MONERIS_PARAMS = {
    PAY: 'rvarPay',
    RESPONSE_ORDER_ID: 'response_order_id',
    TRANSACTION_ID: 'txn_num'
};

var MonerisPaymentProcessor = {
    name: 'MonerisPaymentProcessor',
    clearQueryString: function(queryString) {
        qStr = queryString.replace(/&?response_order_id=[^&]*/, '');
        qStr = qStr.replace(/&?date_stamp=[^&]*/, '');
        qStr = qStr.replace(/&?time_stamp=[^&]*/, '');
        qStr = qStr.replace(/&?bank_transaction_id=[^&]*/, '');
        qStr = qStr.replace(/&?charge_total=[^&]*/, '');
        qStr = qStr.replace(/&?bank_approval_code=[^&]*/, '');
        qStr = qStr.replace(/&?response_code=[^&]*/, '');
        qStr = qStr.replace(/&?iso_code=[^&]*/, '');
        qStr = qStr.replace(/&?txn_num=[^&]*/, '');
        qStr = qStr.replace(/&?message=[^&]*/, '');
        qStr = qStr.replace(/&?trans_name=[^&]*/, '');
        qStr = qStr.replace(/&?cardholder=[^&]*/, '');
        qStr = qStr.replace(/&?f4l4=[^&]*/, '');
        qStr = qStr.replace(/&?card=[^&]*/, '');
        qStr = qStr.replace(/&?expiry_date=[^&]*/, '');
        qStr = qStr.replace(/&?result=[^&]*/, '');
        qStr = qStr.replace(/&?rvarPay=[^&]*/, '');
        qStr = qStr.replace(/rvarSkin=/, 'skin=');
        qStr = qStr.replace(/rvarEstablishment=/, 'establishment=');
        qStr = qStr.replace(/\?&/, '?');

        return qStr;
    },
    showCreditCardDialog: function() {
        return true;
    },
    processPayment: function(myorder, payment_info, pay_get_parameter) {
        var get_parameters = App.Data.get_parameters;

        //redefine it, Moneris allow to pass custom args only having rvar prefix
        pay_get_parameter = get_parameters[MONERIS_PARAMS.PAY];
        delete get_parameters[MONERIS_PARAMS.PAY];

        if (pay_get_parameter) {
            var returnCode = Number(get_parameters.response_code);
            if(pay_get_parameter === 'true' && returnCode < MONERIS_RETURN_CODE.DECLINE) {
                // Check transaction_id. It can be missed in case of wrong Moneris Configuration.
                if (get_parameters[MONERIS_PARAMS.TRANSACTION_ID]) {
                    payment_info.transaction_id = get_parameters[MONERIS_PARAMS.TRANSACTION_ID];
                    payment_info.response_order_id = get_parameters[MONERIS_PARAMS.RESPONSE_ORDER_ID];
                } else {
                    setTimeout(function() {
                        App.Data.errors.alert(MONERIS_WRONG_CONFIGURATION, true);
                    }, 1000);
                    throw new Error('Wrong Moneris Configuration: transaction id is missed');
                }
            } else {
                payment_info.errorMsg = MONERIS_RETURN_MESSAGE[returnCode];
                if (!payment_info.errorMsg) {
                    payment_info.errorMsg = MONERIS_RETURN_MESSAGE_DEFAULT;
                }
            }
        }
        return payment_info;
    }
};

WORLDPAY_RETURN_MESSAGE_DEFAULT = "Unknown error";
var WORLDPAY_PARAMS = {
    ORDER_ID: 'orderid',
    TRANSACTION_ID: 'transid',
    REFCODE: 'refcode',
    REASON: 'Reason'
};

var WorldPayPaymentProcessor = {
    name: 'WorldPayPaymentProcessor',
    clearQueryString: function(queryString) {

        qStr = queryString.replace(/&?Accepted=[^&]*/, '');
        qStr = qStr.replace(/&?ACCOUNTNUMBER=[^&]*/, '');
        qStr = qStr.replace(/&?authcode=[^&]*/, '');
        qStr = qStr.replace(/&?AVS_RESULT=[^&]*/, '');
        qStr = qStr.replace(/&?BALANCE=[^&]*/, '');
        qStr = qStr.replace(/&?BATCHNUMBER=[^&]*/, '');
        qStr = qStr.replace(/&?CVV2_RESULT=[^&]*/, '');
        qStr = qStr.replace(/&?DEBIT_TRACE_NUMBER=[^&]*/, '');
        qStr = qStr.replace(/&?ENTRYMETHOD=[^&]*/, '');
        qStr = qStr.replace(/&?historyid=[^&]*/, '');
        qStr = qStr.replace(/&?MERCHANT_DBA_ADDR=[^&]*/, '');
        qStr = qStr.replace(/&?MERCHANT_DBA_CITY=[^&]*/, '');
        qStr = qStr.replace(/&?MERCHANT_DBA_NAME=[^&]*/, '');
        qStr = qStr.replace(/&?MERCHANT_DBA_PHONE=[^&]*/, '');
        qStr = qStr.replace(/&?MERCHANT_DBA_STATE=[^&]*/, '');
        qStr = qStr.replace(/&?MERCHANTID=[^&]*/, '');
        qStr = qStr.replace(/&?orderid=[^&]*/, '');
        qStr = qStr.replace(/&?PAYTYPE=[^&]*/, '');
        qStr = qStr.replace(/&?PRODUCT_DESCRIPTION=[^&]*/, '');
        qStr = qStr.replace(/&?Reason=[^&]*/, '');
        qStr = qStr.replace(/&?RECEIPT_FOOTER=[^&]*/, '');
        qStr = qStr.replace(/&?recurid=[^&]*/, '');
        qStr = qStr.replace(/&?refcode=[^&]*/, '');
        qStr = qStr.replace(/&?result=[^&]*/, '');
        qStr = qStr.replace(/&?SEQUENCE_NUMBER=[^&]*/, '');
        qStr = qStr.replace(/&?Status=[^&]*/, '');
        qStr = qStr.replace(/&?SYSTEMAUDITTRACENUMBER=[^&]*/, '');
        qStr = qStr.replace(/&?TERMINALID=[^&]*/, '');
        qStr = qStr.replace(/&?TRANSGUID=[^&]*/, '');
        qStr = qStr.replace(/&?transid=[^&]*/, '');
        qStr = qStr.replace(/&?transresult=[^&]*/, '');
        qStr = qStr.replace(/&?AuthNo=[^&]*/, '');
        qStr = qStr.replace(/&?DUPLICATE=[^&]*/, '');
        qStr = qStr.replace(/&?MERCHANTORDERNUMBER=[^&]*/, '');
        qStr = qStr.replace(/&?Declined=[^&]*/, '');
        qStr = qStr.replace(/&?rcode=[^&]*/, '');
        qStr = qStr.replace(/\?&/, '?');
        qStr = qStr.replace(/&#/, '#');

        return qStr;
    },
    showCreditCardDialog: function() {
        return true;
    },
    processPayment: function(myorder, payment_info, pay_get_parameter) {
        var get_parameters = App.Data.get_parameters;

        if (pay_get_parameter) {
            var status = get_parameters['Status']
            if(pay_get_parameter === 'true' && status === 'Accepted') {
                payment_info.transaction_id = get_parameters[WORLDPAY_PARAMS.TRANSACTION_ID];
                payment_info.order_id = get_parameters[WORLDPAY_PARAMS.ORDER_ID];
                payment_info.refcode = get_parameters[WORLDPAY_PARAMS.REFCODE];
            } else {
                payment_info.errorMsg = get_parameters[WORLDPAY_PARAMS.REASON];
                if (!payment_info.errorMsg) {
                    payment_info.errorMsg = WORLDPAY_RETURN_MESSAGE_DEFAULT;
                }
            }
        }
        return payment_info;
    }
};


var QuickBooksPaymentProcessor = {
    name: 'QuickBooksPaymentProcessor',
    clearQueryString: function(queryString) {
        return queryString;
    },
    showCreditCardDialog: function() {
        return true;
    },
    handlePaymentDataRequest: function(myorder, data) {
        if(data.data && data.data.app_token && data.data.token_url) {
            var card = App.Data.card.toJSON();
            $.ajax({
                type: "POST",
                beforeSend: function(xhr){xhr.setRequestHeader('Authorization', "Intuit_APIKey intuit_apikey=ipp-" + data.data.app_token);},
                url: data.data.token_url + "?apptoken=" + data.data.app_token,
                data: JSON.stringify({card: {
                        number: card.cardNumber,
                        expMonth: card.expMonth,
                        expYear: card.expDate,
                        cvc: card.securityCode}}),
                dataType: "json",
                contentType: "application/json; charset=utf-8",
                success: function (data) {
                    myorder.checkout.set('token', data.value);
                    myorder.submit_order_and_pay(PAYMENT_TYPE.CREDIT, false, myorder.paymentResponse.capturePhase);
                },
                error: function (data) {
                    data.errorMsg = MSG.ERROR_OCCURRED + ' ' + MSG.ERROR_DURING_TOKENIZATION;
                    myorder.paymentResponse = {status: 'error', errorMsg: data.errorMsg};
                    myorder.trigger('paymentResponse');
                }
            });
        }
    },
    processPayment: function(myorder, payment_info, pay_get_parameter) {
        var checkout = myorder.checkout.toJSON();
        if  (checkout.token) {
            payment_info.cardInfo.token = checkout.token;
            myorder.checkout.unset("token");
        }
        return payment_info;
    }
};

var AdyenPaymentProcessor = {
    name: 'AdyenPaymentProcessor',
    clearQueryString: function(queryString) {
        qStr = queryString.replace(/&?merchantReference=[^&]*/, '');
        qStr = qStr.replace(/&?skinCode=[^&]*/, '');
        qStr = qStr.replace(/&?shopperLocale=[^&]*/, '');
        qStr = qStr.replace(/&?paymentMethod=[^&]*/, '');
        qStr = qStr.replace(/&?authResult=[^&]*/, '');
        qStr = qStr.replace(/&?pspReference=[^&]*/, '');
        qStr = qStr.replace(/&?merchantSig=[^&]*/, '');

        return qStr;
    },
    showCreditCardDialog: function() {
        return false;
    },
    processPayment: function(myorder, payment_info, pay_get_parameter) {
        if (pay_get_parameter) {
            var get_parameters = App.Data.get_parameters;
            var returnCode = get_parameters.authResult;
            if(pay_get_parameter === 'true' && returnCode == 'AUTHORISED') {
                payment_info.transaction_id = get_parameters.pspReference;
                payment_info.order_id = get_parameters.merchantReference
            } else {
                payment_info.errorMsg = returnCode ? returnCode : MSG.MERCURY_RETURN_MESSAGE_CANCEL;
            }
        }
        return payment_info;
    }
};

var PayPalPaymentProcessor = {
    name: 'PayPalPaymentProcessor',
    clearQueryString: function(queryString) {
        res = queryString.replace(/&?token=[^&]*/, '');
        res = res.replace(/&?PayerID=[^&]*/, '');
        res = res.replace(/&?paymentId=[^&]*/, '');
        return res;
    },
    handleRedirect: function(myorder, data) {
        if (data.data && data.data.payment_id) {
            myorder.checkout.set('payment_id', data.data.payment_id);
        }
    },
    processPayment: function(myorder, payment_info, pay_get_parameter) {
        if (pay_get_parameter) {
            if(pay_get_parameter === 'true') {
                var get_parameters = App.Data.get_parameters;
                var checkout = myorder.checkout.toJSON()
                payment_info.payer_id = get_parameters.PayerID;
                payment_info.payment_id = checkout.payment_id;
            }  else {
                payment_info.errorMsg = MSG.MERCURY_RETURN_MESSAGE_CANCEL;
            }
        }
        return payment_info;
    }
};

var PayPalMobilePaymentProcessor = {
    name: 'PayPalMobilePaymentProcessor',
    clearQueryString: function(queryString) {
        return queryString;
    },
    processPayment: function(myorder, payment_info, pay_get_parameter) {
        var get_parameters = App.Data.get_parameters;
        payment_info.tabId = get_parameters.tabId;
        payment_info.locationId = get_parameters.locationId;
        payment_info.customerId = get_parameters.customerId;
        payment_info.phone = App.Data.customer.phone;
        return payment_info;
    }
};

var GiftCardPaymentProcessor = {
    name: 'GiftCardPaymentProcessor',
    clearQueryString: function(queryString) {
        return queryString;
    },
    processPayment: function(myorder, payment_info, pay_get_parameter) {
        var giftcard = App.Data.giftcard && App.Data.giftcard.toJSON(),
            customer = App.Data.customer;
        if (customer.doPayWithGiftCard()) {
            payment_info.cardInfo = {
                token: customer.giftCards.getSelected().get('token')
            };
        } else {
            payment_info.cardInfo = {
                cardNumber: $.trim(giftcard.cardNumber),
                captchaValue: giftcard.captchaValue
            };
        }
        return payment_info;
    },
    handlePaymentRequestFailure: function(data) {
        if (data.errorMsg.indexOf("Invalid gift card") != -1) {
            App.Data.giftcard.trigger("onResetData");
        }
    }
};

var StanfordCardPaymentProcessor = {
    name: 'StanfordCardPaymentProcessor',
    clearQueryString: function(queryString) {
        return queryString;
    },
    processPayment: function(myorder, payment_info, pay_get_parameter) {
        var stanfordCard = App.Data.stanfordCard && App.Data.stanfordCard.toJSON();
        payment_info.cardInfo = {
            planId: $.trim(stanfordCard.planId)
        };
        return payment_info;
    }
};

var FreedomPayPaymentProcessor = {
    name: 'FreedomPayPaymentProcessor',
    clearQueryString: function(queryString) {
        qStr = queryString.replace(/&?transid=[^&]*/, '');

        return qStr;
    },
    showCreditCardDialog: function() {
        return false;
    },
    processPayment: function(myorder, payment_info, pay_get_parameter) {
        var customer = App.Data.customer,
            payments = customer.payments;

        if (pay_get_parameter) {
            var get_parameters = App.Data.get_parameters,
                savedIgnoreSelectedToken = this.loadIgnoreSelectedToken();

            if (pay_get_parameter === 'true') {
                payment_info.transaction_id = get_parameters.transid;
            } else {
                //TODO: better message
                payment_info.errorMsg = 'Payment failed.';
            }

            // restore payments.ignoreSelectedToken from a storage
            if (payments && typeof savedIgnoreSelectedToken == 'boolean') {
                payments.ignoreSelectedToken = savedIgnoreSelectedToken;
            }

            // restore selected token id
            if (payments) {
                payment_info.token_id = this.loadSelectedToken();
            }
        } else if(payments) {
            // save payments.ignoreSelectedToken to restore that value in capture phase
            this.saveIgnoreSelectedToken(payments.ignoreSelectedToken);

            // save selected token
            customer.doPayWithToken() && this.saveSelectedToken(payments.getSelectedPayment().get('id'));
        }
        return payment_info;
    },
    /**
     * Key used as storage record name.
     */
    ignoreSelectedTokenKey: '.freedompay_ignore_selected_token',
    /**
     * Saves `ignoreSelectedToken` value of payment tokens collection in storage to restore that value after redirect.
     * The redirect occurs in case payment token creation and in case payment with saved token. Due to it need to differ these cases.
     * @param {boolean} value - payment tokens collection `ignoreSelectedToken` value
     */
    saveIgnoreSelectedToken: function(value) {
        if(App.Data.router) {
            setData(App.Data.router.getUID() + this.ignoreSelectedTokenKey, value);
        }
    },
    /**
     * Restores `ignoreSelectedToken` of payment tokens collection from storage.
     * @returns {boolean} Saved value of `ignoreSelectedToken`
     */
    loadIgnoreSelectedToken: function() {
        if(App.Data.router) {
            var uid = App.Data.router.getUID(),
                savedValue = getData(uid + this.ignoreSelectedTokenKey);
            removeData(uid + this.ignoreSelectedTokenKey);
            return savedValue;
        }
    },
    /**
     * Key used as storage record name.
     */
    selectedTokenKey: '.freedompay_selected_token',
    /**
     * Saves `id` of selected token in storage to restore that value after redirect.
     * @param {number} token_id - selected token
     */
    saveSelectedToken: function(token_id) {
        if(App.Data.router) {
            setData(App.Data.router.getUID() + this.selectedTokenKey, token_id);
        }
    },
    /**
     * Restores `id` of selected token from storage.
     * @returns {number} Saved id of selected token.
     */
    loadSelectedToken: function() {
        if(App.Data.router) {
            var uid = App.Data.router.getUID(),
                savedValue = getData(uid + this.selectedTokenKey);
            removeData(uid + this.selectedTokenKey);
            return savedValue;
        }

    }
};

var CRESecurePaymentProcessor = {
    name: 'CRESecurePaymentProcessor',
    clearQueryString: function(queryString) {
        qStr = queryString.replace(/&?code=[^&]*/, '');
        qStr = qStr.replace(/&?message=[^&]*/, '');
        qStr = qStr.replace(/&?uID=[^&]*/, '');

        return qStr;
    },
    showCreditCardDialog: function() {
        return false;
    },
    processPayment: function(myorder, payment_info, pay_get_parameter) {
        if (pay_get_parameter) {
            var get_parameters = App.Data.get_parameters;
            get_parameters.code
            if (pay_get_parameter === 'true') {
                if (get_parameters.code === '000') {
                    payment_info.transaction_id = get_parameters.uID;
                } else {
                    payment_info.errorMsg += 'Payment failed. ' + get_parameters.message;
                }
            } else {
                payment_info.errorMsg = 'Payment canceled.'
            }
        }
        return payment_info;
    }
};

/**
 * Removes all classes by regular expression.
 * Example:
 * ```
 * removeClassRegexp($('#element_id'), "s\\d+");
 * ```
 * @param {jQuery} jq_elem - element.
 * @param {string} exp_str - expression string.
 */
function removeClassRegexp(jq_elem, exp_str) {
    var regexpStr = "(\\s+)?" + exp_str + "(?=\\s|$)";
    var regexp = new RegExp(regexpStr, "g");
    jq_elem.each(function(index, elem){
       $(elem).prop('className', $(elem).prop('className').replace(regexp, ''));
    });
}

/**
* Implements logical AND operation on all arguments passed (it's needed for automatic binding discovering for Epoxy).
* @returns {boolean} arg1 && arg2 && arg3 ...
*/
function AND() {
    var result = arguments[0];
    for (var i = 1; i < arguments.length; i++) {
        result = result && arguments[i];
    }
    return result;
}

/**
 * Implements logical OR operation on all arguments passed (it's needed for automatic binding discovering for Epoxy).
 * @returns {boolean} arg1 || arg2 || arg3 ...
 */
function OR() {
    var result = arguments[0];
    for (var i = 1; i < arguments.length; i++) {
        result = result || arguments[i];
    }
    return result;
}

/*
 * Integrity simple test function (Bug 23033), it's checked from categories view.
 * When the minimization done it's combined into main.js then checked from mainView.js
 */
function testA_5() {
   return 23033 + 'v1';
}

/**
 * Reloads page in browser once it's online.
 */
function reloadPageOnceOnline() {
    App.Data.mainModel && App.Data.mainModel.trigger('loadStarted'); // show spinner
    if ('onLine' in window.navigator) {
        var reloadInterval = window.setInterval(function() {
            if (window.navigator.onLine) {
                window.location.reload();
                clearInterval(reloadInterval);
            }
        }, 100);
    }
    else {
        window.location.reload();
    }
}

/**
 * Add @host to @image URL if it is relative.
 * @param {string} image - path to image file (can be absolute or relative).
 * @param {string} host  - host to be added to image path to make it absolute.
 * @returns {string}
 */
function addHost(image, host) {
    return /^https?:\/\//.test(image) ? image : host + encodeURIComponent(image).replace(/^([^\/])/, '/$1');
}

/**
 * Sorts given i18n object alpabetically by value.
 * @param  {Object} obj - i18n object in the following format: {'key1': 'ghi', 'key2': 'abc', 'key3': 'def'}.
 * @returns {Object} Sorted object, e.g. {'key1': 'abc', 'key2': 'def', 'key3': 'ghi'}
 */
function sort_i18nObject(obj) {
    var arr = _.pairs(obj),
        sortedArr = typeof String.prototype.localeCompare == 'function' ? arr.sort(localeComparer) : _.sortBy(arr, '1');
    return _.object(sortedArr);

    function localeComparer(a, b) {
        return a[1].localeCompare(b[1]);
    }
}

/**
 * Gets the instance name.
 * @return {string} instance name.
 */
function getInstanceName() {
    var host = require('app').REVEL_HOST;
    if (host && typeof host == 'string') {
        return host.replace(/https?:\/\//, '').replace(/\..*/,'');
    } else {
        return '';
    }
}

/**
 * Gets true if the origin is Revel's default one, otherwise - false.
 * @return {boolean} true or false.
 */
function isRevelinOrigin() {
    return window.location.hostname == "revelin.revelsystems.com";
}

/**
 * Gets a card type by its number.
 * @return {string} card number
 */
function get_card_type( card_number ) {
/*
jQuery Credit Card Validator 1.0
Copyright 2012-2015 Pawel Decowski
Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software
is furnished to do so, subject to the following conditions:
The above copyright notice and this permission notice shall be included
in all copies or substantial portions of the Software.
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL
THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
IN THE SOFTWARE.
 */
    var $ = jQuery, options = null,
        __indexOf = [].indexOf;
    var bind, card, card_type, card_types, get_card_type, _i, _len, _ref;

    card_types = [
      {
        name: 'amex',
        pattern: /^3[47]/,
        valid_length: [15]
      }, {
        name: 'diners_club_carte_blanche',
        pattern: /^30[0-5]/,
        valid_length: [14]
      }, {
        name: 'diners_club_international',
        pattern: /^36/,
        valid_length: [14]
      }, {
        name: 'jcb',
        pattern: /^35(2[89]|[3-8][0-9])/,
        valid_length: [16]
      }, {
        name: 'laser',
        pattern: /^(6304|670[69]|6771)/,
        valid_length: [16, 17, 18, 19]
      }, {
        name: 'visa_electron',
        pattern: /^(4026|417500|4508|4844|491(3|7))/,
        valid_length: [16]
      }, {
        name: 'visa',
        pattern: /^4/,
        valid_length: [16]
      }, {
        name: 'mastercard',
        pattern: /^5[1-5]/,
        valid_length: [16]
      }, {
        name: 'maestro',
        pattern: /^(5018|5020|5038|6304|6759|676[1-3])/,
        valid_length: [12, 13, 14, 15, 16, 17, 18, 19]
      }, {
        name: 'discover',
        pattern: /^(6011|622(12[6-9]|1[3-9][0-9]|[2-8][0-9]{2}|9[0-1][0-9]|92[0-5]|64[4-9])|65)/,
        valid_length: [16]
      }
    ];
    if (options == null) {
      options = {};
    }
    if (options.accept == null) {
      options.accept = (function() {
        var _i, _len, _results;
        _results = [];
        for (_i = 0, _len = card_types.length; _i < _len; _i++) {
          card = card_types[_i];
          _results.push(card.name);
        }
        return _results;
      })();
    }
    _ref = options.accept;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      card_type = _ref[_i];
      if (__indexOf.call((function() {
        var _j, _len1, _results;
        _results = [];
        for (_j = 0, _len1 = card_types.length; _j < _len1; _j++) {
          card = card_types[_j];
          _results.push(card.name);
        }
        return _results;
      })(), card_type) < 0) {
        throw "Credit card type '" + card_type + "' is not supported";
      }
    }
    _get_card_type = function(number) {
      var _j, _len1, _ref1;
      _ref1 = (function() {
        var _k, _len1, _ref1, _results;
        _results = [];
        for (_k = 0, _len1 = card_types.length; _k < _len1; _k++) {
          card = card_types[_k];
          if (_ref1 = card.name, __indexOf.call(options.accept, _ref1) >= 0) {
            _results.push(card);
          }
        }
        return _results;
      })();
      for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
        card_type = _ref1[_j];
        if (number.match(card_type.pattern)) {
          return card_type;
        }
      }
      return null;
    };


    var _cardTypes = ACCEPTABLE_CREDIT_CARD_TYPES;
    var map_card_types = {
        'amex': _cardTypes.AMERICANEXPRESS,
        'diners_club_carte_blanche': _cardTypes.DINERS,
        'diners_club_international': _cardTypes.DINERS,
        'jcb':  _cardTypes.JCB,
        'visa_electron': _cardTypes.VISA,
        'visa': _cardTypes.VISA,
        'mastercard': _cardTypes.MASTERCARD,
        'maestro': _cardTypes.MAESTRO,
        'discover': _cardTypes.DISCOVER,
    }

    var cardType = _get_card_type(card_number);
    if (_.isObject(cardType) && map_card_types[cardType.name]) {
        return map_card_types[cardType.name];
    } else
        return null;
}

function getDiffWithServerTime(server_time, sever_time_zone_offset) {
    var srvDate = new Date(server_time),
        clientDate = new Date(),
        diff;

    sever_time_zone_offset = sever_time_zone_offset * 1000 || 0;

    // create the delta in ms. between server and client by time_zone offset:
    diff = sever_time_zone_offset + (new Date()).getTimezoneOffset() * 60 * 1000;
    // add the delta in ms. between server and client times set:
    diff +=  srvDate.getTime() - clientDate.getTime();

    return diff;
}

/*
*  gets time offset in seconds between server and client
*/
function getServerTimezoneOffset(srv_timezone_offset) {
    return srv_timezone_offset + (new Date()).getTimezoneOffset() * 60 * 1000;
}

/**
 * Detects the differences between objects including nested ones.
 * @param {Object} a - the first object for comparison.
 * @param {Object} b - the second object for comparison.
 * @param {Object} props - the list of allowed object properties for comparison (optional)
 * @return {Object} the differences object
 */
function objectsDiff(a, b, props)
{
    var has_props = (typeof props === 'object' && Object.keys(props).length),
        diff = {};

    for (var prop in a)
    {
        if (has_props && props.indexOf(prop) === -1) continue;

        var a_val = a[prop],
            b_val = b[prop];

        if (typeof b_val === 'undefined') continue;

        if (typeof a_val === 'object' && !_.isEqual(a_val, b_val))
        {
            diff[prop] = objectsDiff(a_val, b_val);
        }
        else if (typeof a_val !== 'object' && a_val !== b_val)
        {
            diff[prop] = b_val;
        }
    }

    return diff;
}

/*
*  Debug unresolved deferred object(s). It is used in dev=true mode only.
*/
function traceDeferredObjects() {
    var StackClass = function(){}
    StackClass.prototype.print = function() {
        for (var k in this) {
            if (this.hasOwnProperty(k))
                console.log( this[k].stack );
        }
    }
    StackClass.prototype.num = function() {
        var counter = 0;
        for (var k in this) {
            if (this.hasOwnProperty(k))
                counter++;
        }
        return counter;
    }
    StackClass.prototype.resolveAll = function() {
        for (var k in this) {
            if (this.hasOwnProperty(k)) {
                this[k].dfd.resolve();
            }
        }
    }

    var jQueryDeferredFunc = $.Deferred;
    $.Deferred = function() {
        if (!_.isObject(App.deferreds))
            App.deferreds = new StackClass;

        var key = (new Date).getTime() * 1000 + Math.floor(Math.random() * 0x100);
        var e = new Error;

        var dfd = jQueryDeferredFunc.apply(this, arguments);
        //trace(key, " => new dfd !");
        App.deferreds[key] = { dfd: dfd, stack: e.stack };
        dfd.always(function() {
            delete App.deferreds[key];
            //trace(key, " => dfd done");
        });
        return dfd;
    }
}
/*
* Trace all Backbone events occurred in application. Call it when it's needed.
* @param {string} filter - a regexp string is applied to the type of the object e.g. "order|Customer" (url param dev=true must be specified),
* if filter is undefined then filtering is not used
* @param {string} ignore - an ignore filter regexp string is applied to the type of the object e.g. "false|OrderItem"
*/
function traceTriggers(filter, ignore) {
    var ModelTriggerFunc = Backbone.Model.prototype.trigger,
        ViewTriggerFunc = Backbone.View.prototype.trigger,
        CollectionTriggerFunc = Backbone.Collection.prototype.trigger;

    Backbone.Model.prototype.trigger = function() {
        traceIt.apply(this, arguments);
        ModelTriggerFunc.apply(this, arguments);
    }
    Backbone.View.prototype.trigger = function() {
        traceIt.apply(this, arguments);
        ViewTriggerFunc.apply(this, arguments);
    }
    Backbone.Collection.prototype.trigger = function() {
        traceIt.apply(this, arguments);
        CollectionTriggerFunc.apply(this, arguments);
    }
    function traceIt() {
        var e = new Error,
            type = this.getType ?  this.getType() : 'type_undefined';
        var regexp = new RegExp(filter, 'i');
        var ignoreRegExp = new RegExp(ignore, 'i');
        if (!type || (regexp.test(type) && (!ignore || !ignoreRegExp.test(type)))) {
            console.log("TRIGGER EVENT:", type, arguments, e.stack);
        }
    }
}

/**
*  Set aliases for debugging. This function is called only in dev=true mode.
*/
function dbgSetAliases() {
    if (typeof window.SS != 'undefined' ||
        typeof window.DS != 'undefined' ||
        typeof window.D != 'undefined' ||
        typeof window.V != 'undefined') {
        console.error("dbgSetAliases: Namespace Error: some aliase names are already used.");
        return;
    }
    window.D = App.Data;
    window.SS = App.Settings;
    window.DS = App.SettingsDirectory;
    window.V = App.dbgView;

    var m_pro = Backbone.Model.prototype,
        col_pro = Backbone.Collection.prototype;

    if (typeof m_pro.js != 'undefined' || typeof m_pro.t != 'undefined' ||
        typeof col_pro.js != 'undefined' || typeof col_pro.t != 'undefined') {
        console.error("dbgSetAliases: Namespace Error: some aliase Backbone names are already used.");
        return;
    }

    Backbone.Model.prototype.js = Backbone.Model.prototype.toJSON;
    Backbone.Collection.prototype.js = Backbone.Collection.prototype.toJSON;
    Backbone.Model.prototype.jsd = Backbone.Model.prototype.toJSONDeep;
    Backbone.Collection.prototype.jsd = Backbone.Collection.prototype.toJSONDeep;
    Backbone.Model.prototype.t = Backbone.Model.prototype.getType;
    Backbone.Collection.prototype.t = Backbone.Collection.prototype.getType;
    Backbone.View.prototype.t = Backbone.View.prototype.getType;
}

/**
*  Debug objects methods
*  usage example:
*       spyFunction(App.Data.customer.get('addresses'), 'add')
*  another example:
*       spyFunction(App.Data.settings, 'set', function(params){
*           if (params[0] == 'settings_system' && _.isObject(params[1])) {
*               console.log("DELIVERY CHARGE = ", params[1].delivery_charge);
*           }
*           return false;
*       });
*/
function spyFunction(object, func_name, check_callback) {
    object[func_name] =
        function() {
            var is_trace = true,
                e = new Error;

            if (check_callback) {
                if(!check_callback(arguments)) {
                    is_trace = false;
                };
            }
            if (is_trace) {
               trace(e.stack);
               trace("arguments are:", arguments);
            }
            object.constructor.prototype[func_name].apply(object, arguments);
        };
}

/**
*  It take the fixed part of the number but cut off unnecessary zeros from the end
*/
if (typeof Number.prototype.toFixedTrim == 'undefined') {
    Number.prototype.toFixedTrim = function(fixed) {
        return (this.toFixed(fixed) * 1).toString();
    }
} else {
    console.error("Attemt to re-define Number.prototype.toFixedTrim function");
}
/*
*  Use this function inside another one to get some options' property or default value
*  usage : var keyValue = getOption(options, 'key', defValue);
*/
if (!window.getOption) {
    window.getOption = function(options, key, defValue) {
      if (!_.isObject(options) || options[key] === undefined || options[key] === null) {
        return defValue;
      } else {
        return options[key];
      }
    }
} else {
    console.error("Namespace collision: getOption");
}

/*
*  get billing address
*/
function get_billing_address() {
    var billing_address,
        use_profile_address = App.Data.card.get("use_profile_address"),
        use_checkout_address = App.Data.card.get("use_checkout_address");
    if (use_profile_address) {
        billing_address = App.Data.customer.get('addresses').getDefaultProfileAddress();
        return billing_address ? billing_address.toJSON() : null;
    } else if(use_checkout_address) {
        var address = App.Data.customer.get('addresses').getCheckoutAddress();
        address.country_code = address.country;
        return address;
    } else {
        billing_address = App.Data.card.get("billing_address");
        return _.isObject(billing_address) ? billing_address.toJSON() : null;
    }
}

/*
*  hook for setTimeout to save stackTrace
*/
function dbgSetAsyncHooks() {
    var initSetTimeout = setTimeout;
    setTimeout = function() {
        if (_.isObject(arguments[2])) {
            arguments[2].stackTrace = (new Error).stack;
        }
        return initSetTimeout.apply(this, arguments);
    }
}
/*
*  log deep diff of two objects
*/
function logdiff(o1, o2) {
    if (!window.diff) {
        var deep_diff = ['deep_diff'];
        require(deep_diff, function(diff) {
           window.diff = diff;
           logdiff(o1, o2);
        });
        return;
    }
    var delta = diff(o1, o2);
    if (!delta) {
        console.log('no differences found');
        return;
    }
    for (var i = 0; i < delta.length; i++ ) {
        console.log(delta[i].path, delta[i].kind, delta[i].lhs, delta[i].rhs);
    }
}

function raven_init() {
    window.libs_raven = require('raven');
    window.last_raven_ids = [];
    if (!libs_raven) {
        console.error('Raven: raven sdk is not loaded');
        return;
    }
    libs_raven.config('https://6747797784d64d00b35d77aea85a998e@sentry.revelup.com/21', {
        autoBreadcrumbs: {
            'xhr': false,      // XMLHttpRequest
            'console': false,  // console logging
            'dom': false,      // DOM interactions, i.e. clicks/typing
            'location': false  // url changes, including pushState/popState
        }
    }).install();
    $(window).on('ravenSuccess', function(data){
        var event_id = libs_raven.lastEventId();
        last_raven_ids.push(event_id);
        last_raven_ids = last_raven_ids.slice(-4);
        console.log("Sentry last event id =", event_id);
    });
}

function raven_send_report(title, options, cb_success) {
    var extra_msg = getOption(options, 'extra_msg', ''),
        details = (extra_msg + "\nLOGS:\n" + trace.prev_cache.join("\n\> ").substring(-4000) + "\n" + trace.cache.join("\n\> ")).substring(0, 8200);

    $(window).one('ravenSuccess', function(data){
        var event_id = (libs_raven && libs_raven.lastEventId());
        cb_success & cb_success(event_id);
    });

    libs_raven && libs_raven.captureMessage(title + "\n" + details,
        $.extend(raven_common_info(), {level: 'info'}, options));
}

function IsDomainPermittedForSentry() {
var domainsPermitted = [
    "localhost.revelup.com",
    "qa2.revelup.com",
    "2-27.revelup.com",
    "2-28.revelup.com",
    "2-29.revelup.com",
    "zellaspizza.revelup.com",
    "zacharys.revelup.com"
    ];

    return domainsPermitted.indexOf(window.location.hostname) != -1;
}

function raven_send_error(title, options) {
    if (App.SettingsDirectory && !(App.SettingsDirectory.sentry_errors_logging || IsDomainPermittedForSentry())) {
        return;
    }
    if (App.SettingsDirectory && App.SettingsDirectory.sentry_errors_logging == "NO") {
        return; //it's to prohibit logging for a server in domainsPermitted array.
    }

    var logData = {},
        maxSize = Math.min(40, trace.cache.length);
    for(var i = 0; i < maxSize; i++) {
        logData['zlog' + ('0' + (maxSize - i)).slice(-2)] = trace.cache[trace.cache.length - i - 1];
    }
    App.Data.ajax_errors_count = 0;
    libs_raven && libs_raven.captureMessage(title,
        $.extend(true, {level: 'error', extra: logData}, raven_common_info(), options));
}

function raven_send_user_issue(title, options) {
    var details = "\nLOGS:\n" + trace.cache.join("");
    libs_raven.captureMessage(title + "\n" + details,
        $.extend(raven_common_info(), {level: 'warning'}, options));

    if (App.Data.customer.isAuthorized()) {
        libs_raven.showReportDialog({user: {
            name: App.Data.customer.get('first_name') + " " + App.Data.customer.get('last_name'),
            email: App.Data.customer.get('email') }});
    } else {
        libs_raven.showReportDialog();
    }
}

function raven_common_info() {
    return {
        tags: {skin: App.skin, hostname: window.location.hostname },
        extra: {
            _last_report_ids: window.last_raven_ids,
            _server_host: App.Data.settings.get('host'),
            system_settings: App.Settings,
            directory_settings: App.SettingsDirectory
        }
    }
}


var jsonify=function(obj){
    var seen=[];
    var json=JSON.stringify(obj, function(k,v){
        if (typeof v =='object') {
            if ( !seen.indexOf(v) ) { return '__cycle__'; }
            seen.push(v);
        } return v;
    });
    return json;
};

/**
 * Alias for trace function.
 */
window.log = console.log.bind(window.console);

/**
 * Trace function with additional functionality like data accomulation for Sentry reporting.
 */
trace.cache = [];
trace.prev_cache = [];
function trace(opt) { //window.trace
    var msg = '',
        _for = getOption(opt, 'for'),
        isShow = false,
        isReport = false;

    if (App.Data.traceTags.indexOf(_for) != -1 || _for == undefined) {
        isReport = true;
        isShow = true;
    } else if (_for == 'pay') {
        isReport = true;
    }

    var start = _for == undefined ? 0 : 1;
    for (var i = start; i < arguments.length; i++) {
        if( typeof(arguments[i]) == 'object' || $.isArray(arguments[i]) === true)
            msg += jsonify(arguments[i]) + " ";
        else
            msg += arguments[i] + " ";
    }

    var args = Array.prototype.slice.call(arguments, start); //don't show the first opt {for: 'some_tag'} argument
    isShow && console.log.apply(window.console, args);

    if (trace.cache.length > 250) { //limit cache size
        trace.cache = trace.cache.slice(-200);
    }

    isReport && trace.cache.push(msg);
    isReport && !empty_object(App.Data.settings) && setData("traceLog", trace.cache);
}

function errorSend(title) {
    trace.apply(this, arguments);
    if (typeof title == 'string') {
        raven_send_error("ERROR_" + title.substring(0, 30));
    }
}

function ASSERT(condition, descr) {
    if (!condition) {
        trace.bind(this, 'ASSERT:').apply(this, arguments);
        if (typeof descr != 'string') {
            console.error("Wrong ASSERT() usage: descr:", descr);
        } else {
            if (!trace.simple) {
                raven_send_error("ASSERT_" + descr.substring(0, 30));
            }
        }
    }
}

function triggerJSError() {
    setTimeout( function() {
        throw new Error("Test Error");
    }, 100);
}

function triggerAjaxError() {
    $.ajax({
        type: "GET",
        url: "/weborders/products/",
        dataType: "json",
        success: function() {
        },
        error: function() {
        }
    });
}

function logSafe(obj, key) {
    if( _.isObject(obj) && key ) {
       return obj[key];
    } else {
       return 'Error:NotAnObject';
    }
}

function trace_init(simple) {
    simple == undefined && (simple = /trace=simple/.test(location.search) && !/bug=[^\&]+/.test(location.search));
    if (simple) {
        if (!App.Data.devMode) {
            window.trace = new Function;
            window.errorSend = new Function;
        } else {
            window.trace = function(opt) {
                //For unit tests logs like trace({for: 'pay'}, 'some text', ...) is ignored here, only like trace('some text', ...) i.e. w/o 'for' param
                var _for = getOption(opt, 'for'),
                    isShow = !(typeof _for == 'string');

                if (isShow) {
                    console.log.apply(window.console, arguments);
                }
            }
            window.errorSend = console.log.bind(window.console);
        }

        trace.simple = true;
    }
}

function trace_restore_log() {
    if (trace.simple) {
        return;  // the case for unit tests
    }
    trace.prev_cache = getData("traceLog"); //we restoring the prev. session trace log to get info about e.g. whole payament process with rediration to third-patry site
    removeData("traceLog");
    if (!Array.isArray(trace.prev_cache)) {
        trace.prev_cache = [];
    }
}
