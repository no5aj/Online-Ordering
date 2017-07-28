/**
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

 define(["stanfordcard_view"], function(stanfordcard_view) {
    'use strict';

    var CoreStanfordCardPlansView = App.Views.CoreStanfordCardView.CoreStanfordCardPlansView,
        StanfordCardPlansView;

    StanfordCardPlansView = CoreStanfordCardPlansView.extend({
        bindings: _.extend({}, CoreStanfordCardPlansView.prototype.bindings, {
            '.list-plans': 'collection: $collection'
        })
    });

    var StanfordCardMainView = App.Views.CoreStanfordCardView.CoreStanfordCardMainView.extend({
        showErrorMsg: function(msg, error) {
            this.model.trigger("onResetData");
            App.Data.errors.alert(msg);
        },
    });

    return new (require('factory'))(stanfordcard_view.initViews.bind(stanfordcard_view), function() {
        App.Views.StanfordCardView.StanfordCardPlansView = StanfordCardPlansView;
        App.Views.StanfordCardView.StanfordCardMainView = StanfordCardMainView;
    });
});