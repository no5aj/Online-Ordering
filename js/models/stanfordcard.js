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
  * Contains {@link App.Models.StanfordCardPlan}, {@link App.Collections.StanfordCardPlans}, {@link App.Models.StanfordCard}.
  * @module stanfordcard
  * @requires module:backbone
  * @requires module:captcha
  * @see {@link module:config.paths actual path}
  */
define(["backbone", "captcha"], function(Backbone) {
    'use strict';

    /**
     * @class
     * @classdesc Represents a Stanford Card Plan model.
     * @alias App.Models.StanfordCardPlan
     * @augments Backbone.Model
     * @example
     * // create a Stanford Card Plan model
     * require(['stanfordcard'], function() {
     *     var order = new App.Models.StanfordCardPlan();
     * });
     */
    App.Models.StanfordCardPlan = Backbone.Model.extend(
    /**
     * @lends App.Models.StanfordCardPlan.prototype
     */
    {
        /**
         * @prop {object} defaults - the literal object containing attributes with default values.
         *
         * @prop {number} defaults.id - the plan id.
         * @default null.
         *
         * @prop {string} defaults.name - the plan name.
         * @default ''.
         *
         * @prop {string} defaults.type - the palan type (may be Dollars or Meals).
         * @default 'D'.
         *
         * @prop {number} defaults.balance - the plan balance.
         * @default 0.
         *
         * @prop {boolean} defaults.selected - flag of user selection.
         * @default false.
         */
        defaults: {
            id: null,
            name: '',
            type: 'D',
            balance: 0,
            selected: false,
            is_enough_funds: false
        },
        initialize: function() {
            this.listenTo(this, "change:balance", this.check_funds, this);
            this.listenTo(App.Data.myorder.total, "change:grandTotal", this.check_funds, this);
            this.check_funds();
        },
        check_funds: function() {
            this.set({"is_enough_funds": this.is_enough_funds()});
            App.Data.stanfordCard.get('plans').trigger("change:selected");
        },
        is_enough_funds: function() {
            var is_enough = parseFloat(round_money(this.get("balance"))) >= parseFloat(App.Data.myorder.total.get_grand());
            if (!is_enough) {
                this.set('selected', false);
            }
            return is_enough;
        },
    });

    /**
     * @class
     * @classdesc Represents collection of Stanford Card Plans.
     * @alias App.Collections.StanfordCardPlans
     * @augments Backbone.Collection
     * @example
     * // create a collection of Stanford Card Plans
     * require(['stanfordcard'], function() {
     *     var stanfordCardPlans = new App.Collections.StanfordCardPlans();
     * });
     */
    App.Collections.StanfordCardPlans = Backbone.Collection.extend(
    /**
     * @lends App.Collections.StanfordCardPlans.prototype
     */
    {
        /**
         * @prop {App.Models.StanfordCardPlan} model - the constructor of models.
         * @default App.Models.StanfordCardPlan.
         */
        model: App.Models.StanfordCardPlan,
        /**
         * @method
         * Sets 'unselect()' method as listener for 'change:selected' event.
         */
        initialize: function() {
            this.listenTo(this, 'change:selected',  this.unselect, this);
        },
        /**
         * @method
         * Unselects early selected plans.
         */
        unselect: function(model, value) {
            if(value) {
                this.each(function(plan) {
                    if(plan !== model) {
                        plan.set('selected', false);
                    }
                });
            }
        }
    });

    /**
     * @class
     * Represents Stanford Card model.
     */
    App.Models.StanfordCard = App.Models.Captcha.extend(
    /**
     * @lends App.Models.StanfordCard.prototype
     */
    {
        /**
         * @prop {object} defaults - the literal object containing attributes with default values.
         *
         * @prop {number} defaults.number - the Stanford Card number.
         * @default null.
         *
         * @prop {App.Collections.StanfordCardPlans} defaults.plans - available Stanford Card plans.
         * @default null.
         *
         * @prop {number} defaults.planId - the selected Stanford Card plan.
         * @default null.
         *
         * @prop {boolean} defaults.validated - `true` value means that card number is already checked on server and exists.
         * @default false.
         *
         * @prop {boolean} defaults.needToAskStudentStatus - `true` value means that a customer should be asked about student status.
         * @default true.
         */
        defaults: _.extend({}, App.Models.Captcha.prototype.defaults, {
            number: '',
            plans: null,
            planId: null,
            validated: false,
            needToAskStudentStatus: true
        }),
        /**
         * @method
         * Sets `plans` attribute value and 'updatePlanId()' method as listener for `plans::change:selected` event.
         */
        initialize: function() {
            var plans = this.get('plans');
            if(!(plans instanceof App.Collections.StanfordCardPlans) && !Array.isArray(plans)) {
                plans = new App.Collections.StanfordCardPlans();
            } else if(Array.isArray(plans)) {
                plans = new App.Collections.StanfordCardPlans(plans);
            }
            this.set('plans', plans);
            this.listenTo(plans, 'change:selected', this.updatePlanId, this);

            if (App.Data.settings.get('settings_system').suppress_student_identifier_popup) {
                this.doNotAskStudentStatus(this, true);
            }  else {
                this.listenTo(this, 'change:validated', this.doNotAskStudentStatus, this);
            }
            App.Models.Captcha.prototype.initialize.apply(this, arguments);
        },
        /**
         * @method
         * Updates `planId` attribute value.
         */
        updatePlanId: function() {
            var selected = this.getSelectedPlan();
            if (!selected) {
                selected = this.selectFirstAvailablePlan();
            }
            this.set('planId', selected ? selected.get('id') : this.defaults.planId);
        },
        /**
         * @method
         * Resets all attribute values to default.
         */
        reset: function() {
            this.set({
                number: this.defaults.number,
                captchaKey: this.defaults.captchaKey,
                captchaValue: this.defaults.captchaValue,
                captchaImage: this.defaults.captchaImage,
                planId: this.defaults.planId,
                validated: this.defaults.validated,
                needToAskStudentStatus: this.defaults.needToAskStudentStatus
            });
            this.get('plans').reset();
        },
        /**
         * @method
         * Receives available Stanford Card plans from '/weborders/stanford_card' resource.
         * The following json is sent as POST data:
         * {
         *    "establishment": <number>,
         *    "number”: <string>,
         *    "captchaKey": <string>,
         *    "captchaValue": <string>
         * }
         *
         * @param {boolean} reload - optional, additional parameter in POST request.
         */
        getPlans: function(reload) {
            var est = App.Data.settings.get('establishment'),
                req = Backbone.$.Deferred(),
                plans = this.get('plans'),
                data = this.toJSON(),
                self = this;

            // abort execution if one of 'captchaKey', 'captchaValue', 'number' is invalid
            if(typeof data.number != 'string' || !data.number.length || !data.captchaKey || !data.captchaValue) {
                req.resolve();
                return req;
            }

            // send request
            Backbone.$.ajax({
                url: '/weborders/stanford_card/',
                type: 'POST',
                data: JSON.stringify({
                    establishment: est,
                    number: data.number,
                    captchaValue: data.captchaValue,
                }),
                dataType: 'json',
                success: function(data) {
                    // expect response that may have following formats:
                    // {status: 'OK', data:[...]} - card number exists
                    // {status: 'OK', data: []} - card number doesn't exist
                    // {status: 'ERROR', errorMsg: '...'} - invalid captcha
                    if(!Array.isArray(data.data)) {
                        self.trigger('onStanfordCardError', data.errorMsg);
                    } else if(!data.data.length) {
                        plans.reset();
                        self.trigger('onStanfordCardError', _loc.STANFORD_NO_PLANS);
                        self.set('validated', true);
                    } else {
                        plans.reset(data.data);
                        self.selectFirstAvailablePlan();
                        self.set('validated', true);
                    }
                },
                complete: req.resolve.bind(req)
            });

            return req;
        },
        /**
         * @method
         * @returns {App.Models.StanfordCardPlan} a selected plan or undefined.
         */
        getSelectedPlan: function() {
            return this.get('plans').findWhere({selected: true});
        },
        /**
        * @method selects the first available plan.
        * @returns the first available plan or undefined.
        */
        selectFirstAvailablePlan: function() {
            var firstDollarPlan = _.find(this.get('plans').models, function(model){
                    return model.get('type') == 'D' && model.is_enough_funds();
                });
            firstDollarPlan && firstDollarPlan.set('selected', true);
            return firstDollarPlan;
        },
        /**
         * @method
         * Updates plans.
         *
         * @param {Array} data.
         */
        updatePlans: function(data) {
            if(Array.isArray(data)) {
                this.get('plans').set(data);
            }
        },
        /**
         * @method
         * Set 'needToAskStudentStatus' attribute value to false.
         *
         * @param {App.Models.StanfordCard} model - the same model.
         * @param {boolean} value - the value of 'validated' attribute.
         */
        doNotAskStudentStatus: function(model, value) {
            if(model === this) {
                value && this.set('needToAskStudentStatus', false);
            } else {
                this.set('needToAskStudentStatus', false);
            }
        },
        /**
         * @method
         * Saves model data in a storage. 'stanfordcard' key is used.
         */
        saveCard: function() {
            var data = _.extend(this.toJSON(), {
                plans: this.get('plans').toJSON()
            });
            setData('stanfordcard', data);
        },
        /**
         * @method
         * Restores model data from a storage. 'stanfordcard' key is used.
         */
        restoreCard: function() {
            var data = getData('stanfordcard'),
                plans;
            if(_.isObject(data)) {
                plans = data.plans;
                delete data.plans;
                this.set(data);
                Array.isArray(plans) && this.get('plans').reset(plans);
            }
        },
        /**
         * @method
         * Clears data from a storage and reset current attributes.
         */
        clearData: function() {
            this.reset();
            removeData('stanfordcard');
        },
        /**
         * @method
         * Returns attributes in JSON format
         */
        getJSON: function() {
            return _.extend({}, this.toJSON(), {
                plans: this.get('plans').toJSON()
            });
        }
    });
});
