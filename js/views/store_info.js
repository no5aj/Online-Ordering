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

define(["backbone", "factory", "generator"], function(Backbone) {
    'use strict';

    App.Views.CoreStoreInfoView = {};

    var StoreInfoMainView = App.Views.CoreStoreInfoView.CoreStoreInfoMainView = App.Views.FactoryView.extend({
        name: 'store_info',
        mod: 'main',
        bindings: {
            '.desc': 'toggle: _system_settings_about_description, html: format("<p>$1</p>", handleDescriptions(_system_settings_about_description))',
            '.business-name': 'text: _system_settings_business_name',
            '.address-line1': 'text: line1',
            '.address-line2': 'text: line2',
            '.phone': 'toggle: _system_settings_phone',
            '.phone-number': 'text: phoneFormat(_system_settings_phone), attr: {href: format("tel:$1", _system_settings_phone)}',
            '.email-wrap': 'toggle: _system_settings_email',
            '.email': 'text: _system_settings_email, attr: {href: format("mailto:$1", _system_settings_email)}',
            '.access': 'toggle: _system_settings_about_access_to_location',
            '.access-info': 'text: _system_settings_about_access_to_location',
            '.gallery': 'updateContent: galleryViewData'
        },
        bindingFilters: {
            handleDescriptions: function(desc) {
                return desc.replace(/[\n\r]+/g, '</p><p>');
            }
        },
        computeds: {
            line1: {
                deps: ['_system_settings_address'],
                get: function(address) {
                    var line1 = address.line_1,
                        line2 = address.line_2;
                    return line2 ? line1 + ', ' + line2 : line1;
                }
            },
            line2: {
                deps: ['_system_settings_address'],
                get: function(address) {
                    var address_line = address.city + ', ';
                        address_line += address.getRegion() ? address.getRegion() + ' ' : '';
                        address_line += address.postal_code;

                    return address_line;
                }
            },
            galleryViewData: {
                deps: ['_system_settings_about_images'],
                get: function(about_images) {
                    if (about_images.length > 0) {
                        return {
                            name: 'StoreInfo',
                            mod: 'Gallery',
                            model: this.options.about
                        };
                    }
                }
            }
        }
    });

    var StoreInfoMapView = App.Views.CoreStoreInfoView.CoreStoreInfoMapView = App.Views.FactoryView.extend({
        initialize: function() {
            this.listenTo(this.collection, 'change:selected', this.onStoreSelected);
            App.Views.FactoryView.prototype.initialize.apply(this, arguments);
        },
        bindingSources: {
            ui: function() {
                return new Backbone.Model({isDeliveryAreaGeoJSON: false});
            }
        },
        map: function(zoomControl, panControl, mapTypeControl) {
            var settings = App.Settings,
                self = this;

            this.mapData = {
                loadLib: Backbone.$.Deferred()
            };
            self.$(".view_larger_map").hide();
            self.$("#mapBox").hide();
            settings.geolocation_load.done(function() {require(["async!https://maps.googleapis.com/maps/api/js?v=3.exp&sensor=true"], function() {
                self.$("#mapBox").show();
                var address = settings.address,
                    title = settings.business_name || '',
                    coords = new google.maps.LatLng(address.coordinates.lat, address.coordinates.lng),
                    map = new google.maps.Map(self.$('#mapBox')[0], {
                        center: coords,
                        zoom: 18,
                        mapTypeId: google.maps.MapTypeId.ROADMAP,
                        zoomControl: !!zoomControl,
                        zoomControlOptions: {
                            style: 'LARGE'
                        },
                        streetViewControl: false,
                        panControl: !cssua.ua.mobile,
                        mapTypeControl: !!mapTypeControl,
                        mapTypeControlOptions: {
                            mapTypeIds: [
                                google.maps.MapTypeId.HYBRID,
                                google.maps.MapTypeId.ROADMAP,
                                google.maps.MapTypeId.SATELLITE,
                                google.maps.MapTypeId.TERRAIN
                            ]
                        }
                    });

                self.mapData.map = map;
                self.mapData.loadLib.resolve();
                self.addMarkers();

                if ((!_.isArray(settings.delivery_post_code_lookup) || !settings.delivery_post_code_lookup[0]) && _.isArray(settings.delivery_geojson) && settings.delivery_geojson[0]) {
                    try {
                        map.data.addListener('addfeature', function(event) {
                            self.mapData.deliveryArea =  event.feature;
                            self.setBinding('ui_isDeliveryAreaGeoJSON', true);
                        });

                        map.data.addGeoJson(JSON.parse(settings.delivery_geojson[1]));
                        map.data.setStyle({
                            strokeWeight: 1,
                            fillColor: '#00ff00'
                        });
                    } catch (e) {
                        console.error("Can't parse delivery area GeoJson: " + e);
                    }
                }

                var mapurl = setInterval(function() {
                    if (typeof map === "object" && typeof map.mapUrl !== "undefined" && typeof map.mapUrl === "string") {
                        self.$(".view_larger_map").show();
                        self.$(".view_larger_map .map_url").text(settings.business_name);
                        self.$(".view_larger_map .map_url").attr("href", map.mapUrl.replace("ll=", "q="));
                        clearInterval(mapurl);
                    }
                }, 50);
            });});

        },
        addMarkers: function() {
            var stores = this.collection,
                self = this;

            self.markers = {};

            stores.request.then(function() {
                stores.each(function(store) {
                    var _store = store.toJSON(),
                        color = _store.selected ? self.activePinColor : self.regularPinColor,
                        scale = _store.selected ? 0.3 : 0.2,
                        address = [_store.line_1, _store.city, (_store.state ? _store.state : _store.province), _store.zipcode],
                        address_line = address.join(', '),
                        address_url = '//maps.google.com?q=' + address_line,
                        zIndex = _store.selected ? self.activeMarkerZIndex : self.regularMarkerZIndex,
                        coords, marker, popup;

                    coords = new google.maps.LatLng(_store.latitude, _store.longitude),
                    marker = new google.maps.Marker({
                        position: coords,
                        map: self.mapData.map,
                        title: _store.name,
                        icon: getPin(color, scale),
                        zIndex: zIndex
                    });

                    popup = new google.maps.InfoWindow({
                        content: '<div id="googlemaps_popup">' +
                                    '<div class="bold">' + _store.name + '</div>' +
                                    '<div>' +
                                        '<a href="' + address_url + '" class="primary-text link" target="_blank">' + address_line + '</a>' +
                                    '</div>' +
                                 '</div>',
                        position: coords
                    });

                    if (_store.selected) {
                        popup.open(self.mapData.map, marker);
                    }

                    google.maps.event.addListener(marker, 'click', function() {
                        if (store.get('selected')) {
                            popup.open(self.mapData.map, marker);
                        }
                        else {
                            store.set('selected', true);
                        }
                    });

                    self.markers[store.id] = {
                        marker: marker,
                        popup: popup
                    };

                    google.maps.event.addListener(popup, "domready", function() {
                        self.$("#googlemaps_popup").parent().parent().css({
                            height: "auto",
                            overflow: "hidden",
                            width: "auto"
                        });
                        // button "Close" in popup window (hack for Android Default Browser) (begin)
                        var block_with_popup_image = self.$('.gm-style-iw').next('div');
                        block_with_popup_image.empty();
                        block_with_popup_image.append('<div style="position: absolute; background: url(\'https://maps.gstatic.com/mapfiles/api-3/images/mapcnt3.png\') 13px 13px no-repeat; width: 59px; height: 492px; top: -348px; left: -13px;"> </div>');
                        // button "Close" in popup window (hack for Android Default Browser) (end)
                    });
                });
            });
        },
        onStoreSelected: function(model, value) {
            var markerData = this.markers[model.get('id')],
                color = value ? this.activePinColor : this.regularPinColor,
                scale = value ? 0.3 : 0.2;

            if (markerData) {
                markerData.marker.setIcon(getPin(color, scale));

                if (value) {
                    this.mapData.map.setCenter(markerData.marker.getPosition());
                    markerData.popup.open(this.mapData.map, markerData.marker);
                    markerData.marker.setZIndex(this.activeMarkerZIndex);
                } else {
                    markerData.popup.close();
                    markerData.popup.setMap(null);    // unbind from map.
                    markerData.popup.setAnchor(null); // unbind from anchor
                    markerData.marker.setZIndex(this.regularMarkerZIndex);
                }
            };
        },
        focusOnDeliveryArea: function() {
            var deliveryArea = _.isObject(this.mapData) && this.mapData.deliveryArea,
                map = _.isObject(this.mapData) && this.mapData.map,
                bounds;

            if (!deliveryArea || !map) {
                return;
            }

            bounds = new google.maps.LatLngBounds();
            processPoints(deliveryArea.getGeometry());
            map.setCenter(bounds.getCenter());
            map.fitBounds(bounds);

            function processPoints(geometry) {
                if (geometry instanceof google.maps.LatLng) {
                    bounds.extend(geometry);
                } else if (geometry instanceof google.maps.Data.Point) {
                    bounds.extend(geometry.get());
                } else {
                    geometry.getArray().forEach(function(_geometry) {
                        processPoints(_geometry);
                    }, this);
                }
            }
        },
        regularPinColor: '#5f6266',
        activePinColor: '#ff0000',
        regularMarkerZIndex: 200,
        activeMarkerZIndex: 201
    });

    function getPin(color, scale) {
        return {
            path: 'M244.4,9.5c4.7,1.1,9.5,1.9,14,3.4c29.8,10.2,47.7,40.1,43.2,71.5c-3.2,22.4-12.9,42.1-25,60.9c-10.9,17-25.4,31-38.9,46.5c-9.4-11.1-18.8-21.7-27.5-32.8c-14.1-18.2-25.8-37.9-32.8-60.1c-7.5-23.6-5.4-45.9,10.6-65.7c10.5-13.1,24.3-20.7,41-23c1.1-0.1,2.1-0.5,3.1-0.7C236.3,9.5,240.4,9.5,244.4,9.5z M237.4,44.9c-16.8,0.4-29,13.6-28.7,30.7c0.4,16.1,14,28.4,31,27.9c15.2-0.4,27.6-14.3,27.3-30.5C266.7,57.4,253.1,44.5,237.4,44.9z',
            fillColor: color,
            fillOpacity: 1,
            scale: scale || 0.2,
            strokeColor: color,
            strokeWeight: 1,
            anchor: new google.maps.Point(238, 192)
        };
    }

    var StoreInfoImagePoint = App.Views.FactoryView.extend({
        name: 'store_info',
        mod: 'image_point',
        tagName: 'li',
        className: 'image-point primary-border',
        bindings: {
            ':el': 'classes: {selected: selected}'
        },
        events: {
            'click': 'select'
        },
        select: function() {
            this.model.set('selected', true);
        }
    });

    var StoreInfoGalleryView = App.Views.CoreStoreInfoView.CoreStoreInfoGalleryView = App.Views.FactoryView.extend({
        name: 'store_info',
        mod: 'gallery',
        bindings: {
            '.points': 'collection: $points, itemView: "imagePoint"',
            '.syncer': 'gallery: curIndex, galleryEl: ".images", events: ["onScroll"]'
        },
        imagePoint: StoreInfoImagePoint,
        bindingHandlers: {
            galleryEl: {},
            gallery: {
                init: function($el, value, bindings, context) {
                    var $gallery = this.view.$(context.galleryEl),
                        self = this;
                    this.curIndex = value;
                    $gallery.gallery({onScroll: function(curIndex) {
                        self.curIndex = curIndex;
                        $el.trigger('onScroll');
                    }});
                    this.scrollTo = function(value) {
                        $gallery.gallery({scrollTo: value})
                    }
                },
                get: function() {
                    return this.curIndex;
                },
                set: function($el, value) {
                    this.scrollTo(value);
                }
            }
        },
        bindingSources: {
            points: function() {
                var points = new Backbone.RadioCollection();
                points.listenTo(points, 'change:selected', function() {
                    points.trigger('update');
                });
                return points;
            }
        },
        computeds: {
            curIndex: {
                deps: ['$points'],
                get: function(points) {
                    var selected = points.findWhere({selected: true});
                    return selected ? selected.get('index') : 0;
                },
                set: function(value) {
                    var model = this.getBinding('$points').findWhere({index: value});
                    model && model.set('selected', true);
                }
            }
        },
        initialize:  function() {
            App.Views.FactoryView.prototype.initialize.apply(this, arguments);
            this.getBinding('$points').reset(this.model.get('images').map(function(image, index) {
                return {
                    selected: !index,
                    index: index
                }
            }));
        },
        render: function() {
            App.Views.FactoryView.prototype.render.apply(this, arguments);
            this.$('.images').gallery({
                images: this.model.get('images'),
                animate: true,
                circle: true
            });
            return this;
        }
    });

    var StoreInfoStoreItemView = App.Views.FactoryView.extend({
        name: 'store_info',
        mod: 'store_item',
        tagName: 'li',
        className: 'store-item',
        events: {
            'click': 'select'
        },
        bindings: {
            '.radio': 'classes: {checked: selected}',
            '.line-1': 'text: line1',
            '.line-2': 'text: line2',
            '.name': 'text: name'
        },
        computeds: {
            line1: {
                deps: ['line_1', 'line_2'],
                get: function(line_1, line_2) {
                    return line_2 ? line_1 + ', ' + line_2 : line_1;
                }
            },
            line2: {
                deps: ['city', 'region', 'zipcode'],
                get: function(city, region, zipcode) {
                    return city + ', ' + region + ' ' + zipcode;
                }
            }
        },
        select: function() {
            this.model.set('selected', true);
        }
    });

    var StoreInfoMapWithStoresView = App.Views.CoreStoreInfoView.CoreStoreInfoMapWithStoresView = StoreInfoMapView.extend({
        name: 'store_info',
        mod: 'map',
        storeView: StoreInfoStoreItemView,
        bindings: {
            '.stores-list': 'collection: $collection, itemView: "storeView"',
            '.show-delivery-area': 'toggle: ui_isDeliveryAreaGeoJSON'
        },
        events: {
            'click .show-delivery-area': 'focusOnDeliveryArea'
        },
        render: function() {
            StoreInfoMapView.prototype.render.apply(this, arguments);
            this.map(true, true, true);
            return this;
        }
    });

    return new (require('factory'))(function() {
        App.Views.StoreInfoView = {};
        App.Views.StoreInfoView.StoreInfoMainView = StoreInfoMainView;
        App.Views.StoreInfoView.StoreInfoMapView = StoreInfoMapView;
        App.Views.StoreInfoView.StoreInfoGalleryView = StoreInfoGalleryView;
        App.Views.StoreInfoView.StoreInfoMapWithStoresView = StoreInfoMapWithStoresView;
    });
});
