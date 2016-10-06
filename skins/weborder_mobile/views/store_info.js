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

define(["store_info_view"], function(store_info_view) {
    'use strict';

    var StoreInfoMainView = App.Views.CoreStoreInfoView.CoreStoreInfoMainView.extend({
        name: 'store_info',
        mod: 'main',
        bindings: {
            '.img-block': 'toggle: _system_settings_logo_img',
            'img': 'loadSpinner: setURL(_settings_host, _system_settings_logo_img)',
            '.delivery-info-wrapper': 'toggle: _system_settings_delivery_for_online_orders',
            '.delivery-minimum': 'text: currencyFormat(_system_settings_min_delivery_amount)',
            '.delivery-distance': 'text: delivery_distance',
            '.delivery-time': 'text: delivery_time'
        },
        events: {
            'click .address-link': 'onAddressClick',
            'click .change-store': 'change_establishment',
            'click img': 'onLogoClick'
        },
        bindingFilters: {
            setURL: function(host, img) {
                return img ? addHost(img, host) : '';
            }
        },
        computeds: {
            delivery_time: {
                deps: ['_system_settings_estimated_delivery_time'],
                get: function(delivery_time) {
                    var _lp = this.getBinding('$_lp').toJSON(),
                        hour = Math.floor(delivery_time / 60),
                        minutes = Math.ceil(delivery_time % 60),
                        res = '';

                    if (hour > 0) res += hour + ' ' + _lp.STORE_INFO_HR;
                    if (hour > 0 && minutes > 0) res += ' ';
                    if (minutes > 0) res += minutes + ' ' + _lp.STORE_INFO_MIN;
                    if (minutes == 0 && hour == 0) res += _lp.STORE_INFO_ASAP;

                    return  res;
                }
            },
            delivery_distance: {
                deps: ['_system_settings_max_delivery_distance'],
                get: function(distance)
                {
                    var settings = App.Data.settings.get('settings_system'),
                        _lp = this.getBinding('$_lp').toJSON();

                    var delivery_post_code_lookup_enabled = _.isArray(settings.delivery_post_code_lookup) && settings.delivery_post_code_lookup[0],
                        delivery_post_codes = _.isArray(settings.delivery_post_code_lookup) && settings.delivery_post_code_lookup[1],
                        delivery_geojson_enabled = _.isArray(settings.delivery_geojson) && settings.delivery_geojson[0],
                        distance_mearsure = settings.distance_mearsure;

                    if (delivery_post_code_lookup_enabled)
                    {
                        var label = _lp.STORE_INFO_DELIVERY_AREA;
                        var value = delivery_post_codes;
                    }
                    else if (!delivery_geojson_enabled)
                    {
                        var label = _lp.STORE_INFO_DELIVERY_RADIUS;
                        var value = distance + ' ';

                        if (distance_mearsure.toLowerCase() == 'km')
                        {
                            value += _lp.STORE_INFO_KM;
                        }
                        else
                        {
                            value += _lp.STORE_INFO_MILE;

                            if (distance > 1)
                            {
                                value += _lp.STORE_INFO_MILE_END;
                            }
                        }
                    }

                    return (label && value) ? (label + ': ' + value) : '';
                }
            }
        },
        /**
         * Show the "Change Establishment" modal window.
         */
        change_establishment: function(e) {
            var ests = App.Data.establishments;
            ests.getModelForView().set({
                storeDefined: true
            }); // get a model for the stores list view
            ests.trigger('loadStoresList');
            e.stopPropagation();
        },
        onLogoClick: function() {
            App.Data.router.navigate('gallery', { trigger: true, replace: true });
        },
        onAddressClick: function() {
            App.Data.router.navigate('location', true);
        }
    });

    var StoreInfoMapView = App.Views.CoreStoreInfoView.CoreStoreInfoMapView.extend({
        name: 'store_info',
        mod: 'map',
        render: function() {
            App.Views.CoreStoreInfoView.CoreStoreInfoMapView.prototype.render.apply(this, arguments);
            this.map();
        }
    });

    var StoreInfoGalleryView = App.Views.FactoryView.extend({
        name: 'store_info',
        mod: 'gallery',
        initialize: function() {
            App.Views.FactoryView.prototype.initialize.apply(this, arguments);
            $(window).on('resize', this.resize);
        },
        remove: function() {
            $(window).off('resize', this.resize);
            return App.Views.FactoryView.prototype.remove.apply(this, arguments);
        },
        events: {
            'click' : 'goBack',
            'click img': 'imgClick'
        },
        render: function() {
            App.Views.FactoryView.prototype.render.apply(this, arguments);

            setTimeout( (function() {
                    this.$el.gallery({
                    images: this.model.get('images'),
                    animate: true,
                    circle: true,
                    swipe: true
                });
            }).bind(this), 0);

            return this;
        },
        goBack: function() {
            App.Data.router.navigate('about', { trigger: true, replace: true });
        },
        imgClick: function(event) {
            event.stopPropagation();
        }
    });

    return new (require('factory'))(store_info_view.initViews.bind(store_info_view), function() {
        App.Views.StoreInfoView.StoreInfoMainView = StoreInfoMainView;
        App.Views.StoreInfoView.StoreInfoMapView = StoreInfoMapView;
        App.Views.StoreInfoView.StoreInfoGalleryView = StoreInfoGalleryView;
    });
});
