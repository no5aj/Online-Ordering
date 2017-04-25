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
 * A module contaning a RequireJS configuration object.
 * @module config
 * @see http://requirejs.org/docs/api.html#config
 */
define({
    /**
     * A base url path. All relative paths are resolved basing on it.
     * @type {string}
     * @static
     * @see http://requirejs.org/docs/api.html#config-baseUrl
     */
    baseUrl: ".",
    /**
     * Contains short names for all base modules used in the app.
     * All modules names in the documentation correspond keys of this object.
     *
     * @type {object}
     * @static
     * @enum {string}
     */
    paths: {
        /**
         * @type {string}
         * @description The actual path of [app]{@link module:facebook} module.
         */
        facebook: 'js/libs/facebook_sdk', //#WOMA-443 & WOMA-491, the recent lib url: https://connect.facebook.net/en_US/sdk.js
        /**
         * @type {string}
         * @description The actual path of [app]{@link module:app} module.
         */
        app: "js/app",
        /**
         * @type {string}
         * @description The actual path of [config]{@link module:config} module.
         */
        config: "js/config",
        /**
         * @type {string}
         * @description The actual path of [jquery]{@link module:jquery} module.
         */
        jquery: "js/libs/jquery/jquery",
        /**
         * @type {string}
         * @description The actual path of [jquery_gallery]{@link module:jquery_gallery} module.
         */
        jquery_gallery: 'js/libs/jquery/jquery.gallery',
        /**
         * @type {string}
         * @description The actual path of [jquery_numbermask]{@link module:jquery_numbermask} module.
         */
        jquery_numbermask: "js/libs/jquery/jquery.number_mask",
        /**
         * @type {string}
         * @description The actual path of [backbone]{@link module:backbone} module.
         */
        backbone: "js/libs/backbone",
        /**
         * @type {string}
         * @description The actual path of [backbone]{@link module:backbone_extensions} module.
         */
        backbone_extensions: "js/libs/backbone.extensions",
        /**
         * @type {string}
         * @description The actual path of [backbone_epoxy]{@link module:backbone_epoxy} module.
         */
        backbone_epoxy: "js/libs/backbone.epoxy",
        /**
         * @type {string}
         * @description The actual path of [backbone_epoxy_handlers]{@link module:backbone_epoxy_handlers} module.
         */
        backbone_epoxy_handlers: "js/libs/backbone.epoxy.handlers",
        /**
         * @type {string}
         * @description The actual path of [backbone_epoxy_filters]{@link module:backbone_epoxy_filters} module.
         */
        backbone_epoxy_filters: "js/libs/backbone.epoxy.filters",
        /**
         * @type {string}
         * @description The actual path of [cssua]{@link module:cssua} module.
         */
        cssua: "js/libs/cssua",
        /**
         * @type {string}
         * @description The actual path of [underscore]{@link module:underscore} module.
         */
        underscore: "js/libs/underscore",
        /**
         * @type {string}
         * @description The actual path of [functions]{@link module:functions} module.
         */
        functions : "js/functions",
        /**
         * @type {string}
         * @description The actual path of [async]{@link module:async} module.
         */
        async: "js/libs/require_async",
        /**
         * @type {string}
         * @description The actual path of [about]{@link module:about} module.
         */
        about: "js/models/about",
        /**
         * @type {string}
         * @description The actual path of [customers]{@link module:customers} module.
         */
        customers: "js/models/customers",
        /**
         * @type {string}
         * @description The actual path of [childproducts]{@link module:childproducts} module.
         */
        childproducts: "js/models/childproducts",
        /**
         * @type {string}
         * @description The actual path of [errors]{@link module:errors} module.
         */
        errors : "js/models/errors",
        /**
         * @type {string}
         * @description The actual path of [errors_view]{@link module:errors_view} module.
         */
        errors_view: 'js/views/errors',
        /**
         * @type {string}
         * @description The actual path of [myorder]{@link module:myorder} module.
         */
        myorder: "js/models/myorder",
        /**
         * @type {string}
         * @description The actual path of [settings]{@link module:settings} module.
         */
        settings: "js/models/settings",
        /**
         * @type {string}
         * @description The actual path of [timetable]{@link module:timetable} module.
         */
        timetable: "js/models/timetable",
        /**
         * @type {string}
         * @description The actual path of [factory]{@link module:factory} module.
         */
        factory: "js/views/factory",
        /**
         * @type {string}
         * @description The actual path of [list]{@link module:list} module.
         */
        list: "js/views/list",
        /**
         * @type {string}
         * @description The actual path of [generator]{@link module:generator} module.
         */
        generator: "js/views/generator",
        /**
         * @type {string}
         * @description The actual path of [tax]{@link module:tax} module.
         */
        tax: "js/models/tax",
        /**
         * @type {string}
         * @description The actual path of [total]{@link module:total} module.
         */
        total: "js/models/total",
        /**
         * @type {string}
         * @description The actual path of [categories]{@link module:categories} module.
         */
        categories: "js/models/categories",
        /**
         * @type {string}
         * @description The actual path of [products]{@link module:products} module.
         */
        products: "js/models/products",
        /**
         * @type {string}
         * @description The actual path of [modifiers]{@link module:modifiers} module.
         */
        modifiers: "js/models/modifiers",
        /**
         * @type {string}
         * @description The actual path of [tip]{@link module:tip} module.
         */
        tip: "js/models/tip",
        /**
         * @type {string}
         * @description The actual path of [card]{@link module:card} module.
         */
        card: "js/models/card",
        /**
         * @type {string}
         * @description The actual path of [giftcard]{@link module:giftcard} module.
         */
        giftcard: "js/models/giftcard",
        /**
         * @type {string}
         * @description The actual path of [checkout]{@link module:checkout} module.
         */
        checkout: "js/models/checkout",
        /**
         * @type {string}
         * @description The actual path of [geopoint]{@link module:geopoint} module.
         */
        geopoint: "js/common/geopoint",
        /**
         * @type {string}
         * @description The actual path of [main_router]{@link module:main_router} module.
         */
        main_router: "js/routers/main",
        /**
         * @type {string}
         * @description The actual path of [spinner]{@link module:spinner} module.
         */
        spinner: "js/spinner",
        /**
         * @type {string}
         * @description The actual path of [log]{@link module:log} module.
         */
        log: "js/models/log",
        /**
         * @type {string}
         * @description The actual path of [delivery]{@link module:delivery} module.
         */
        delivery: "js/models/delivery",
        /**
         * @type {string}
         * @description The actual path of [delivery_addresses]{@link module:delivery_addresses} module.
         */
        delivery_addresses: "js/views/delivery_addresses",
        /**
         * @type {string}
         * @description The actual path of [checkout_view]{@link module:checkout_view} module.
         */
        checkout_view: "js/views/checkout",
        /**
         * @type {string}
         * @description The actual path of [categories_view]{@link module:categories_view} module.
         */
        categories_view: "js/views/categories",
        /**
         * @type {string}
         * @description The actual path of [products_view]{@link module:products_view} module.
         */
        products_view: "js/views/products",
        /**
         * @type {string}
         * @description The actual path of [modifiers_view]{@link module:modifiers_view} module.
         */
        modifiers_view: "js/views/modifiers",
        /**
         * @type {string}
         * @description The actual path of [myorder_view]{@link module:myorder_view} module.
         */
        myorder_view: "js/views/myorder",
        /**
         * @type {string}
         * @description The actual path of [quantity_view]{@link module:quantity_view} module.
         */
        quantity_view: "js/views/quantity",
        /**
         * @type {string}
         * @description The actual path of [store_info_view]{@link module:store_info_view} module.
         */
        store_info_view: "js/views/store_info",
        /**
         * @type {string}
         * @description The actual path of [total_view]{@link module:total_view} module.
         */
        total_view: "js/views/total",
        /**
         * @type {string}
         * @description The actual path of [tips_view]{@link module:tips_view} module.
         */
        tips_view: "js/views/tips",
        /**
         * @type {string}
         * @description The actual path of [card_view]{@link module:card_view} module.
         */
        card_view: "js/views/card",
        /**
         * @type {string}
         * @description The actual path of [giftcard_view]{@link module:giftcard_view} module.
         */
        giftcard_view: "js/views/giftcard",
        /**
         * @type {string}
         * @description The actual path of [instructions_view]{@link module:instructions_view} module.
         */
        instructions_view: "js/views/instructions",
        /**
         * @type {string}
         * @description The actual path of [done_view]{@link module:done_view} module.
         */
        done_view: "js/views/done",
        /**
         * @type {string}
         * @description The actual path of [slider_view]{@link module:slider_view} module.
         */
        slider_view: "js/views/slider",
        /**
         * @type {string}
         * @description The actual path of [search]{@link module:search} module.
         */
        search: "js/models/search",
        /**
         * @type {string}
         * @description The actual path of [subcategories]{@link module:subcategories} module.
         */
        subcategories: "js/models/subcategories",
        /**
         * @type {string}
         * @description The actual path of [collection_sort]{@link module:collection_sort} module.
         */
        collection_sort: "js/models/collection_sort",
        /**
         * @type {string}
         * @description The actual path of [confirm_view]{@link module:confirm_view} module.
         */
        confirm_view: "js/views/confirm",
        revel_api: "js/models/revel",
        revel_view: 'js/views/revel',
        /**
         * @type {string}
         * @description The actual path of [establishments]{@link module:establishments} module.
         */
        establishments: 'js/models/establishments',
        /**
         * @type {string}
         * @description The actual path of [establishments_view]{@link module:establishments_view} module.
         */
        establishments_view: 'js/views/establishments',
        /**
         * @type {string}
         * @description The actual path of [filters]{@link module:filters} module.
         */
        filters: 'js/models/filters',
        /**
         * @type {string}
         * @description The actual path of [locale]{@link module:locale} module.
         */
        locale: 'js/models/locale',
        /**
         * @type {string}
         * @description The actual path of [rewards]{@link module:rewards} module.
         */
        rewards: 'js/models/rewards',
        /**
         * @type {string}
         * @description The actual path of [rewards_view]{@link module:rewards_view} module.
         */
        rewards_view: 'js/views/rewards',
        stanfordcard: 'js/models/stanfordcard',
        stanfordcard_view: 'js/views/stanfordcard',
        /**
         * @type {string}
         * @description The actual path of [captcha]{@link module:captcha} module.
         */
        captcha: 'js/models/captcha',
        /**
         * @type {string}
         * @description The actual path of [search_line_view]{@link module:search_line_view} module.
         */
        search_line_view: 'js/views/search_line',
        /**
         * @type {string}
         * @description The actual path of [spinner_view]{@link module:spinner_view} module.
         */
        spinner_view: 'js/views/spinner',
        /**
         * @type {string}
         * @description The actual path of [pikaday]{@link module:pikaday} module.
         */
        pikaday: 'js/libs/pikaday',
        /**
         * @type {string}
         * @description The actual path of [product_sets]{@link module:product_sets} module.
         */
        product_sets: 'js/models/product_sets',
        /**
         * @type {string}
         * @description The actual path of [product_sets_view]{@link module:product_sets_view} module.
         */
        product_sets_view: 'js/views/product_sets',
        /**
         * @type {string}
         * @description The actual path of [profile_view]{@link module:profile_view} module.
         */
        profile_view: 'js/views/profile',
        /**
         * @type {string}
         * @description The actual path of [promotions]{@link module:promotions} module.
         */
        promotions: 'js/models/promotions',
        /**
         * @type {string}
         * @description The actual path of [promotions_view]{@link module:promotions_view} module.
         */
        promotions_view: 'js/views/promotions',
        /**
         * @type {string}
         * @description The actual path of [js_cookie]{@link module:js_cookie} module.
         */
        js_cookie: 'js/libs/cookie',
        /**
         * @type {string}
         * @description The actual path of [page_visibility]{@link module:page_visibility} module.
         */
        page_visibility: 'js/common/page_visibility',
        /**
         * @type {string}
         * @description The actual path of [payments]{@link module:payments} module.
         */
        payments: 'js/models/payments',
        /**
         * @type {string}
         * @description The actual path of [payment_methods]{@link module:payment_methods} module.
         */
        payment_methods: 'js/models/payment_methods',
        /**
         * @type {string}
         * @description The actual path of [payment_methods_view]{@link module:payment_methods_view} module.
         */
        payment_methods_view: 'js/views/payment_methods',
        /**
         * @type {string}
         * @description The actual path of [cart_view]{@link module:cart_view} module.
         */
        cart_view: 'js/views/cart',
        /**
         * @type {string}
         * @description The actual path of [tree]{@link module:tree} module.
         */
        tree: 'js/models/tree',
        /**
         * @type {string}
         * @description The actual path of [geolocation]{@link module:geolocation} module.
         */
        geolocation: 'js/models/geolocation',
         /**
         * @type {string}
         * @description The actual path of [pages_control]{@link module:pages_control} module.
         */
        pages_control: 'js/models/pages_control',
         /**
         * @type {string}
         * @description The actual path of [pages_control_view]{@link module:pages_control_view} module.
         */
        pages_control_view: 'js/views/pages_control',
        /**
         * @type {string}
         * @description The actual path of [orders]{@link module:orders} module.
         */
        orders: 'js/models/orders',
        /**
         * @type {string}
         * @description The actual path to [smart_banner]{@link module:smart_banner} module.
         */
        smart_banner: 'js/views/smart_banner',
        /**
         * @type {string}
         * @description The actual path to [raven]{@link module:raven} module. Used for logging
         */
        raven: 'https://cdn.ravenjs.com/3.12.1/raven.min' //previously tested with 3.0.4 version
    },
    /**
     * A waiting time of a module loading.
     *
     * @type {number}
     * @static
     * @default
     * @see http://requirejs.org/docs/api.html#config-waitSeconds
     */
    waitSeconds: 30,
    /**
     * Contains modules dependencies, exports.
     *
     * @type {object}
     * @static
     * @enum
     * @see http://requirejs.org/docs/api.html#config-shim
     */
    shim: {
        "facebook": {
            exports: "FB"
        },
        "jquery": {
            exports: "$"
        },
        "jquery_numbermask": {
            deps: ["jquery"],
            exports: "$.numbermask"
        },
        "backbone": {
            deps: ["underscore", "jquery"],
            exports: "Backbone"
        },
        "backbone_extensions": {
            deps: ["backbone"],
            exports: "Backbone"
        },
        "backbone_epoxy": {
            deps: ["backbone"],
            exports: "Backbone"
        },
        "backbone_epoxy_handlers": {
            deps: ["backbone_epoxy"],
            exports: "Backbone"
        },
        "backbone_epoxy_filters": {
            deps: ["backbone_epoxy"],
            exports: "Backbone"
        },
        "cssua": {
            exports: "cssua"
        },
        "underscore": {
            exports: "_"
        },
        "functions": {
            deps: ["underscore", "jquery", "cssua"]
        },
        "customers": {
            deps: ["backbone", "js_cookie", "page_visibility", "giftcard", "orders"]
        },
        "errors" : {
            deps: ["backbone"]
        },
        'errors_view': {
            deps: ['backbone', 'factory']
        },
        "myorder": {
            deps: ["backbone"]
        },
        "settings": {
            deps: ["backbone"]
        },
        "timetable": {
            deps: ["settings"]
        },
        "factory": {
            deps: ["backbone", "backbone_epoxy_handlers", "backbone_epoxy_filters"]
        },
        "generator": {
            deps: ["backbone"]
        },
        "total": {
            deps: ["backbone"]
        },
        "categories": {
            deps: ["backbone"]
        },
        "products": {
            deps: ["backbone"]
        },
        "modifiers": {
            deps: ["backbone"]
        },
        "tip": {
            deps: ["backbone"]
        },
        "card": {
            deps: ["backbone"]
        },
        "giftcard": {
            deps: ["captcha"]
        },
        "checkout": {
            deps: ["backbone"]
        },
        "main_router": {
            deps: ["backbone"]
        },
        "spinner": {
            deps: ["jquery"]
        },
        "log": {
            deps: ["backbone"]
        },
        "delivery": {
            deps: ["backbone"]
        },
        "delivery_addresses": {
            deps: ["backbone", "factory"]
        },
        "checkout_view": {
            deps: ["backbone", "factory"]
        },
        "modifiers_view": {
            deps: ["backbone", "factory"]
        },
        "myorder_view": {
            deps: ["backbone", "factory"]
        },
        "total_view": {
            deps: ["backbone", "factory"]
        },
        "tips_view": {
            deps: ["backbone", "factory"]
        },
        "instructions_view": {
            deps: ["backbone", "factory"]
        },
        "search": {
            deps: ["products"]
        },
        "collection_sort": {
            deps: ["backbone"]
        },
        "revel_api": {
            deps: ["backbone"]
        },
        "revel_view": {
            deps: ["backbone", "factory"]
        },
        'establishments': {
            deps: ['backbone', 'collection_sort']
        },
        'establishments_view': {
            deps: ['backbone', 'factory', 'generator', 'list']
        },
        'search_line_view': {
            deps: ['backbone', 'factory']
        },
        'spinner_view': {
            deps: ['backbone', 'factory', 'generator']
        },
        'filters': {
            deps: ['backbone']
        },
        'rewards': {
            deps: ['captcha']
        },
        'rewards_view': {
            deps: ['factory']
        },
        'locale': {
            deps: ['backbone']
        },
        'captcha': {
            deps: ['backbone']
        },
        'stanfordcard': {
            deps: ['captcha']
        },
        'stanfordcard_view': {
            deps: ['factory']
        },
        'pikaday' : {
            deps: []
        },
        'product_sets' : {
            deps: ['backbone', 'collection_sort']
        },
        'profile_view' : {
            deps: ['factory']
        },
        'promotions_view' : {
            deps: ['factory']
        },
        'js_cookie': {
            deps: []
        },
        'page_visibility': {
            deps: []
        },
        'payments': {
            deps: ['backbone']
        },
        'payment_methods': {
            deps: ['backbone']
        },
        'payment_methods_view': {
            deps: ['factory']
        },
        'cart_view': {
            deps: ['factory']
        },
        'tree': {
            deps: ['backbone']
        },
        'geolocation': {
            deps: ['backbone']
        },
        'pages_control' : {
            deps: ['backbone']
        },
        'pages_control_view' : {
            deps: ['factory']
        },
        'orders': {
            deps: ['backbone']
        },
        'smart_banner': {
            deps: ['factory']
        }
    },
    /**
     * Modules mapping.
     *
     * @type {objects}
     * @static
     * @default {'*': {}}
     * @see http://requirejs.org/docs/api.html#config-map
     */
    map: {
        "*": {}
    },
    /**
     * Contains packages.
     *
     * @type {Array}
     * @static
     * @default []
     * @see http://requirejs.org/docs/api.html#config-packages
     */
    packages: []
});