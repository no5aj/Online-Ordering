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

 define(["factory", "myorder_view"], function(factory) {
    'use strict';

    App.Views.CoreRewardsView = {};

    var RewardsItemView = App.Views.CoreRewardsView.CoreRewardsItemView = App.Views.ItemView.extend({
        name: 'rewards',
        mod: 'item',
        el: '<li class="reward-selection__item"></li>',
        bindings: {
            ':el': 'classes: {disabled: disabled, animation: true}',
            '.checkbox': 'classes: {checked: selected}',
            '.points': 'classes: {"optional-text": not(selected), "attention-text": selected, selected: selected}',
            '.reward__discount-text': 'text: name',
            '.reward__redemption-amount': 'text: points',
            '.reward__redemption-text': 'text: redemptionText(points, _lp_REWARDS_POINTS_REDEMPTION_AMOUNT)'
        },
        events: {
            'click': 'selectReward'
        },
        bindingFilters: {
            /**
             * Sets text that reflects reward type and amount of points to be redeemed.
             *
             * @param  {string} rewardType - Reward type.
             * @param  {Number} points - Amount of points.
             * @returns {string} -
             */
            redemptionText: function(points, text) {
                var text1, text2;

                if (Array.isArray(text)) {
                    text1 = text[0];
                    text2 = text[1];
                }
                else {
                    text1 = text2 = text;
                }

                // handle plural
                return parseInt(points, 10) <= 1 ? text1 : text2;
            }
        },
        /**
         * Toggles selection of clicked reward.
         * If allow_multiple_reward_redemptions_per_order settings is true:
         * allow one selected reward of each level (item/order),
         * else allow only one selected reward.
         */
        selectReward: function() {
            var selected = this.model.get('selected'),
                allowMultiple = App.Data.settings.get('settings_system').allow_multiple_reward_redemptions_per_order;

            // toggle selection
            this.model.set('selected', !selected);
            this.options.collectionView.model.trigger('onSelectReward');
        }
    });

    var ItemRewardsView = RewardsItemView.extend({
        bindings: {
            '.reward__redemption-text': 'text: redemptionText(points, _lp_REWARDS_ITEM_POINTS)'
        }
    });

    var VisitRewardsView = RewardsItemView.extend({
        bindings: {
            '.reward__redemption-text': 'text: redemptionText(points, _lp_REWARDS_VISIT_POINTS)'
        }
    });

    var PurchaseRewardsView = RewardsItemView.extend({
        bindings: {
            '.reward__redemption-text': 'text: redemptionText(points, _lp_REWARDS_PURCHASE_POINTS)'
        }
    });

    App.Views.CoreRecaptchaView = {};
    App.Views.CoreRecaptchaView.CoreRecaptchaMainView = App.Views.FactoryView.extend({
        name: 'recaptcha',
        mod: 'main',
        initialize: function() {
            var self = this,
                dfd = App.Data.settings.load_google_captcha();
            App.Views.FactoryView.prototype.initialize.apply(this, arguments);
            if (dfd.state() != 'resolved') {
                this.$('.captcha_container').spinner({deferred: dfd});
            }
            dfd.done(function(){
                if (!self.widgetId) {
                    self.widgetId =  grecaptcha.render(self.$('.captcha_container')[0], {
                       'sitekey' : App.Settings.recaptcha_site_key,
                       'theme' : 'light',
                       'callback': self.sessionKeyCallback.bind(self),
                       'expired-callback': self.sessionExpiresCallback.bind(self)
                    });
                }
                self.updateCaptcha();
            });
            this.listenTo(this.model, 'onResetData', this.resetCaptcha, this);
            this.listenTo(this.model, 'updateCaptcha', this.updateCaptcha, this);
        },
        sessionKeyCallback: function(response) {
            this.model.set('captchaValue', response);
        },
        sessionExpiresCallback: function() {
            this.model.set('captchaValue', '');
        },
        updateCaptcha: function(param) {
            this.model.loadCaptcha();
            grecaptcha.reset(this.widgetId);
        },
        resetCaptcha: function() {
            this.model.set('captchaValue', '');
            grecaptcha.reset(this.widgetId);
        }
    });

    App.Views.CoreRewardsView.CoreRewardsCardView = App.Views.FactoryView.extend({
        name: 'rewards',
        mod: 'card',
        initialize: function() {
            var self = this;
            App.Views.FactoryView.prototype.initialize.apply(this, arguments);
            inputTypeMask(this.$('.rewards-input'), /^\d*$/, this.model.get('number'), 'numeric');

            var view = App.Views.GeneratorView.create('CoreRecaptcha', {
                    model: this.model,
                    mod: 'Main'},
                    'CoreRecaptcha' + this.name + this.mod);
            this.$('.recaptcha_view').append(view.el);
            this.subViews.push(view);

            this.listenTo(this.options.customer.get('rewardCards'), "add remove reset", function() {
                self.options.customer.trigger('change:rewardCards'); //it's to update binding value customer_rewardCards
            });
        },
        bindings: {
            '.rewards-input': 'value: number, events: ["input"], disabled: length(customer_rewardCards)',
            '.submit-card': 'classes: {disabled: disableBtn}',
        },
        events: {
            'click .submit-card': 'submit',
            'keydown .submit-card': function(e) {
                if (this.pressedButtonIsEnter(e)) {
                    this.submit();
                }
            },
        },
        computeds: {
            disableBtn: {
                deps: ['number', 'captchaValue'],
                get: function(number, captchaValue) {
                    return !(number && captchaValue);
                }
            },
        },
        submit: function() {
            this.model.trigger('onGetRewards');
        }
    });

    var RewardsCardProfileView = App.Views.CoreRewardsView.CoreRewardsCardView.extend({
        name: 'profile',
        mod: 'rewardcard',
        bindings: {
            '.logo': 'attr: {style: showLogo(_system_settings_logo_img)}'
        },
        bindingFilters: {
            showLogo: function(url) {
                if (typeof url != 'string') {
                    return '';
                }
                return 'background-image: url(%s);'.replace('%s', url);
            }
        }
    });

    var RewardsItemApplicationView = App.Views.FactoryView.extend({
        name: 'rewards',
        mod: 'item_application',
        tagName: 'li',
        binding: {
            '.discount': 'text: currencyFormat(discount)'
        }
    });

    var RewardsOrderApplicationView = RewardsItemApplicationView.extend({
        name: 'rewards',
        mod: 'order_application'
    });

    var RewardsInfoView = App.Views.FactoryView.extend({
        name: 'rewards',
        mod: 'info',
        bindings: {
            '.rewards-number': 'text: number',
            '.total-points': 'text: balance_points',
            '.total-visits': 'text: balance_visits',
            '.total-purchases': 'text: currencyFormat(balance_purchases)',
            '.rewards-unavailable': 'toggle: not(length(rewards))',
            '.total-points-redemption': 'toggle: redemption_points',
            '.total-points-redemption__value': 'text: redemption_points',
            '.total-visits-redemption': 'toggle: redemption_visits',
            '.total-visits-redemption__value': 'text: redemption_visits',
            '.total-purchases-redemption': 'toggle: redemption_purchases',
            '.total-purchases-redemption__value': 'text: redemption_purchases',
            '.item-rewards-box': 'classes: {hide: not(length($itemRewards))}',
            '.item-rewards': 'collection: $itemRewards, itemView: "itemRewards"',
            '.visit-rewards-box': 'classes: {hide: not(length($visitRewards))}',
            '.visit-rewards': 'collection: $visitRewards, itemView: "visitRewards"',
            '.purchase-rewards-box': 'classes: {hide: not(length($purchaseRewards))}',
            '.purchase-rewards': 'collection: $purchaseRewards, itemView: "purchaseRewards"',
            '.rewards-unavailable': 'toggle: not(length(rewards))',
            '.total-row-points': 'classes: {hide: isNull(balance_points)}',
            '.total-row-visits': 'classes: {hide: isNull(balance_visits)}',
            '.total-row-purchase': 'classes: {hide: isNull(balance_purchases)}',
            '.apply-reward': 'classes: {disabled: not(length(discounts))}'
        },
        events: {
            'click .apply-reward': 'apply'
        },
        onEnterListeners: {
            '.apply-reward': 'apply'
        },
        bindingSources: {
            itemRewards: function() {
                return new Backbone.Collection();
            },
            visitRewards: function() {
                return new Backbone.Collection();
            },
            purchaseRewards: function() {
                return new Backbone.Collection();
            },
            redemption: function() {
                return new Backbone.Model({
                    points: 0,
                    visits: 0,
                    purchases: 0
                });
            }
        },
        bindingFilters: {
            isNull: function(value) {
                return value === null;
            }
        },
        itemRewards: ItemRewardsView,
        visitRewards: VisitRewardsView,
        purchaseRewards: PurchaseRewardsView,
        initialize: function() {
            App.Views.FactoryView.prototype.initialize.apply(this, arguments);
            this.listenTo(this.model, 'onResetData', this.remove);
            this.listenTo(this.model.get('rewards'), 'add remove', function() {
                this.setItemRewards();
                this.setVisitsRewards();
                this.setPurchaseRewards();
            });
            this.setItemRewards();
            this.setVisitsRewards();
            this.setPurchaseRewards();

            var itemRewards = this.getBinding('$itemRewards'),
                visitRewards = this.getBinding('$visitRewards'),
                purchaseRewards = this.getBinding('$purchaseRewards');

            this.setBinding('redemption_points', this.countPointsToRedeem(itemRewards));
            this.setBinding('redemption_visits', this.countPointsToRedeem(visitRewards));
            this.setBinding('redemption_purchases', this.countPointsToRedeem(purchaseRewards));

            this.listenTo(itemRewards, 'change:selected', function() {
                this.setBinding('redemption_points', this.countPointsToRedeem(itemRewards));
            });
            this.listenTo(visitRewards, 'change:selected', function() {
                this.setBinding('redemption_visits', this.countPointsToRedeem(visitRewards));
            });
            this.listenTo(purchaseRewards, 'change:selected', function() {
                this.setBinding('redemption_purchases', this.countPointsToRedeem(purchaseRewards));
            });
        },
        setItemRewards: function() {
            this.getBinding('$itemRewards').reset(this.model.get('rewards').where({rewards_type: 1}));
        },
        setVisitsRewards: function() {
            this.getBinding('$visitRewards').reset(this.model.get('rewards').where({rewards_type: 2}));
        },
        setPurchaseRewards: function() {
            this.getBinding('$purchaseRewards').reset(this.model.get('rewards').where({rewards_type: 0}));
        },
        countPointsToRedeem: function(collection) {
            return _.reduce(collection.where({selected: true}), function(memo, model) {
                return memo + model.get('points');
            }, 0);
        },
        apply: function() {
            var rewardsCard = this.collection.rewardsCard;
            rewardsCard.update(this.model);
            rewardsCard.trigger('onRedemptionApplied');
        }
    });

    return new (require('factory'))(function() {
        App.Views.RewardsView = {}
        App.Views.RewardsView.RewardsCardView = App.Views.CoreRewardsView.CoreRewardsCardView;
        App.Views.RewardsView.RewardsCardProfileView = RewardsCardProfileView;
        App.Views.RewardsView.RewardsItemApplicationView = RewardsItemApplicationView;
        App.Views.RewardsView.RewardsOrderApplicationView = RewardsOrderApplicationView;
        App.Views.RewardsView.RewardsInfoView = RewardsInfoView;
        App.Views.RewardsView.RewardsItemView = RewardsItemView;
    });
});