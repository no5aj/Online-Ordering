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

define(["factory", "giftcard_view"], function(factory) {
    'use strict';

    App.Views.CoreStanfordCardView = {};

    App.Views.CoreStanfordCardView.CoreStanfordCardMainView = App.Views.CoreGiftCardView.CoreGiftCardMainView.extend({
        name: 'stanfordcard',
        mod: 'main',
        bindings: _.extend({}, App.Views.CoreGiftCardView.CoreGiftCardMainView.prototype.bindings, {
            '.number-input': 'value: number, events:["keyup", "blur", "touchend"], attr: {readonly: planId}',
            '.captcha-input': 'value: captchaValue, events:["keyup", "blur", "touchend"], attr: {readonly: planId}',
            '.btn-reload': 'classes: {disabled: planId}',
            '.cancel-input': 'toggle: planId'
        }),
        events: {
            'click .btn-reload': 'reload_captcha',
            'click .cancel-input': 'reset'
        },
        initialize: function() {
            App.Views.CoreGiftCardView.CoreGiftCardMainView.prototype.initialize.apply(this, arguments);
            this.listenTo(this.model, 'change:planId', this.updateCartTotals, this);
            this.updateCartTotals(this.model, this.model.get('planId'));
        },
        reset: function() {
            this.model.reset();
            this.reload_captcha();
        },
        removeFromDOMTree: function() {
            this.updateCartTotals();
            App.Views.CoreGiftCardView.CoreGiftCardMainView.prototype.removeFromDOMTree.apply(this, arguments);
        },
        remove: function() {
            this.updateCartTotals();
            App.Views.CoreGiftCardView.CoreGiftCardMainView.prototype.remove.apply(this, arguments);
        },
        updateCartTotals: function(model, planId) {
            var myorder = this.options.myorder;
            if(planId) {
                myorder.update_cart_totals({type: PAYMENT_TYPE.STANFORD, planId: planId});
            } else {
                myorder.update_cart_totals();
            }
        }
    });

    App.Views.CoreStanfordCardView.CoreStanfordCardPlanView = App.Views.FactoryView.extend({
        name: 'stanfordcard',
        mod: 'plan',
        tagName: 'li',
        className: 'stanford-plan',
        bindings: {
            ':el': 'classes: {active: selected}',
            '.name': 'text: name',
            '.balance': 'text: currencyFormat(balance)'
        },
        events: {
            'click': 'select'
        },
        select: function() {
            this.model.set('selected', true);
        }
    });

    App.Views.CoreStanfordCardView.CoreStanfordCardPlansView = App.Views.FactoryView.extend({
        name: 'stanfordcard',
        mod: 'plans',
        bindings: {
            ':el': 'toggle: plansLength',
            '.list': 'collection: $collection'
        },
        computeds: {
            plansLength: {
                deps: ['$collection'],
                get: function(plans) {
                    return plans.length;
                }
            }
        },
        itemView: App.Views.CoreStanfordCardView.CoreStanfordCardPlanView
    });

    App.Views.CoreStanfordCardView.CoreStanfordStudentStatusView = App.Views.FactoryView.extend({
        name: 'stanfordcard',
        mod: 'student',
        events: {
            'click .btn-yes': 'yes',
            'click .btn-no': 'no',
        },
        yes: function() {
            this.model.trigger('onStudent');
        },
        no: function() {
            this.model.doNotAskStudentStatus();
            this.model.trigger('onNotStudent');
        }
    });

    return new (require('factory'))(function() {
        App.Views.StanfordCardView = {};
        App.Views.StanfordCardView.StanfordCardMainView = App.Views.CoreStanfordCardView.CoreStanfordCardMainView;
        App.Views.StanfordCardView.StanfordCardPlansView = App.Views.CoreStanfordCardView.CoreStanfordCardPlansView;
        App.Views.StanfordCardView.StanfordCardPlanView = App.Views.CoreStanfordCardView.CoreStanfordCardPlanView;
        App.Views.StanfordCardView.StanfordCardStudentStatusView = App.Views.CoreStanfordCardView.CoreStanfordStudentStatusView;
    });

});