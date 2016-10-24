define(['delivery'], function() {
    describe("App.Models.Delivery", function() {

        var model, def, opts, set;

        beforeEach(function() {
            model = new App.Models.Delivery();
            this.settings = App.Data.settings.get('settings_system');
            def = {
                charge: 0,
                charges: null, // delivery cost
                enable: false, // enable delivery for online ordering apps
                max_distance: 0, // delivery max distance
                min_amount: 0 // min total amount for delivery enable. Only sum of products and modifiers
            },
            opts = {
                charge: 5,
                charges: [{
                    amount: 5,
                    max_threshold: null,
                    min_threshold: 0,
                    type: 0
                }, {
                    amount: 0,
                    max_threshold: null,
                    min_threshold: 20,
                    type: 0
                }],
                enable: false,
                max_distance: 0,
                min_amount: 1
            },
            set = {
                charge: 5,
                charges: [{
                    amount: 5,
                    max_threshold: null,
                    min_threshold: 0,
                    type: 0
                }, {
                    amount: 0,
                    max_threshold: null,
                    min_threshold: 20,
                    type: 0
                }, {
                    amount: 10,
                    max_threshold: 40,
                    min_threshold: 20,
                    type: 1
                }],
                enable: true,
                max_distance: 2,
                min_amount: 3
            };
        });

        afterEach(function() {
            App.Data.settings.set('settings_system', this.settings);
        });

        it('Environment', function() {
            expect(App.Models.Delivery).toBeDefined();
        });

        it('Create model with undefined settings_system', function() {
            App.Data.settings.get('settings_system').delivery_charge = undefined;
            App.Data.settings.get('settings_system').delivery_for_online_orders = undefined;
            App.Data.settings.get('settings_system').max_delivery_distance = undefined;
            App.Data.settings.get('settings_system').min_delivery_amount = undefined;
            model = new App.Models.Delivery();
            expect(model.toJSON()).toEqual(def);
        });

        it('Create model with undefined settings_system and opts', function() {
            App.Data.settings.get('settings_system').delivery_charge = undefined;
            App.Data.settings.get('settings_system').delivery_for_online_orders = undefined;
            App.Data.settings.get('settings_system').max_delivery_distance = undefined;
            App.Data.settings.get('settings_system').min_delivery_amount = undefined;
            model = new App.Models.Delivery(opts);
            expect(model.toJSON()).toEqual(opts);
        });

        it('Create model with settings_system without opts', function() {
            model = new App.Models.Delivery();
            expect(model.toJSON()).toEqual(def);
        });

        it('Create model with settings_system and with opts', function() {
            model = new App.Models.Delivery(opts);
            expect(model.toJSON()).toEqual(opts);
        });

        describe('getCharge()', function() {
            it('`enable` is false', function() {
                expect(model.getCharge()).toBe(0);
            });

            it('`enable` is true', function() {
                model.set(set);
                expect(model.getCharge()).toBe(5);
            });
        });

        describe('getRemainingAmount', function() {
            var serviceFee, charges, myorder;

            beforeEach(function() {
                charges = {
                    delivery: {
                        type: 1,
                        amount: 4,
                        min_threshold: 3,
                        max_threshold: 7
                    }
                };

                myorder = App.Data.myorder;
                App.Data.myorder.get_service_fee_charge = function() {
                    return serviceFee;
                };
            });

            afterEach(function() {
                App.Data.myorder = myorder;
            });

            it('`enable` is false', function() {
                model.set({
                    min_amount: 3,
                    enable: false
                });
                expect(model.getRemainingAmount(10)).toBe(null);
            });

            it('`enable` is true', function() {
                serviceFee = 2;
                model.set({
                    min_amount: 3,
                    enable: true
                });
                expect(model.getRemainingAmount(10)).toBe(-5);
            });
        });
    });
});