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

define(["factory", "stanfordcard_view"], function(factory, stanfordcard_view) {
    'use strict';

    var StanfordCardMainView = App.Views.CoreStanfordCardView.CoreStanfordCardMainView.extend({
        bindings: {
            '.btn-submit': 'classes: {disabled: any(not(number), not(captchaValue)), hide: validated}',
            '.ctrl-wrapper': 'toggle: validated'
        },
        events: {
            'click .btn-submit': 'submit'
        },
        onEnterListeners: {
            '.btn-submit': 'submit'
        },
        initialize: function() {
            App.Views.CoreStanfordCardView.CoreStanfordCardMainView.prototype.initialize.apply(this, arguments);
        },
        submit: function() {
            var myorder = this.options.myorder;
            myorder.trigger('showSpinner');
            this.model.getPlans().then(myorder.trigger.bind(myorder, 'hideSpinner'));
        }
    });

    var StanfordCardPopupView = StanfordCardMainView.extend({
        name: 'stanfordcard',
        mod: 'popup',
        render: function() {
            StanfordCardMainView.prototype.render.apply(this, arguments);
            var view = new (App.Views.FactoryView.extend({
                        name: "account_code",
                        mod: "info"
                    }));
            this.$('.added_content').append(view.el);
            this.subViews.push(view);
        },
        events: {
            'click .btn-cancel': 'cancel'
        },
        onEnterListeners: {
            '.btn-cancel': 'cancel'
        },
        cancel: function() {
            this.model.trigger('onCancelStudentVerification');
        }
    });

    var StanfordCardPlanView = App.Views.CoreStanfordCardView.CoreStanfordCardPlanView.extend({
        className: 'stanford-plan primary-border'
    });

    var StanfordCardPlansView = App.Views.CoreStanfordCardView.CoreStanfordCardPlansView.extend({
        itemView: StanfordCardPlanView
    });

    var StanfordCardReloadView = StanfordCardMainView.extend({
        name: 'stanfordcard',
        mod: 'reload',
        updateCartTotals: new Function() // override parent's method to avoid myorder.update_cart_total() calling
    })

    return new (require('factory'))(stanfordcard_view.initViews.bind(stanfordcard_view), function() {
        App.Views.StanfordCardView.StanfordCardMainView = StanfordCardMainView;
        App.Views.StanfordCardView.StanfordCardPlansView = StanfordCardPlansView;
        App.Views.StanfordCardView.StanfordCardReloadView = StanfordCardReloadView;
        App.Views.StanfordCardView.StanfordCardPopupView = StanfordCardPopupView;
    });
});