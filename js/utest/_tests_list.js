/**
 * To show uncovered ternary need to use $('.branchWarning') in expanded file
 */
var tests_list = [
    'test_About',
    'test_Captcha',
    'test_Card',
    'test_Categories',
    'test_Checkout',
    'test_ChildProducts',
    'test_CollectionSort',
    // 'test_Customers',
    'test_Payments',
    'test_Delivery',
    'test_Errors',
    'test_Establishments',
    'test_Filters',
    'test_Geolocation',
    'test_Geopoint',
    'test_Giftcard',
    'test_Locale',
    'test_Log',
    'test_Modifiers',
    'test_Myorder',
    'test_Products',
    'test_ProductSets',
    'test_Promotions',
    'test_Rewards',
    'test_Search',
    'test_Settings',
    'test_StanfordCard',
    'test_Subcategories',
    'test_Tax',
    'test_TimeFrm',
    'test_Timetable',
    'test_Tips',
    'test_Total'
];

//tests_list = ['test_ProductSets'];

if (!window._phantom) {
    for(var key in tests_list) {
       tests_list[key] = "../core/js/utest/" + tests_list[key];
    }
} else {
    for(var key in tests_list) {
       tests_list[key] = "base/js/utest/" + tests_list[key] + ".js";
    }
}

var ajaxMock = function(options) {
    var def = $.Deferred();
    setTimeout( function() {
        if (!options) {
           def.resolve();
           return def;
        }
        if (ajaxMock.replyData.status == 'OK' && typeof options.success == 'function') {
            options.success(ajaxMock.replyData);
        } else if (typeof options.error == 'function') {
            options.error({statusText: "error"}, "error", 'some error occurred');
        }
        if (options.complete) {
           if (ajaxMock.replyData.status == 'OK') {
               options.complete({statusText: "OK"}, "OK", 'successful status');
               def.resolve();
           }
           else {
               options.complete({statusText: "error"}, "error", 'error status');
               def.reject();
           }
        }
    },10);

    def.error = function error(callback) {
        if (callback)
           options.error = callback;
        return def;
    }
    def.abort = function() {
        options.error({statusText: "abort"}, "abort", 'request aborted');
        def.reject();
        return def;
    }
    return def;
}
//default replied data:
ajaxMock.replyData = {
    status: "OK",
    data: {}
}
