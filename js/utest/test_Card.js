define(['card'], function() {
    'use strict';

    describe("App.Models.Card", function() {

        var model, def,
            locale = App.Data.locale.toJSON(),
            isBillingAddressCard,
            _getData;

        beforeEach(function() {
            isBillingAddressCard = spyOn(PaymentProcessor, 'isBillingAddressCard');
            _getData = null

            model = new App.Models.Card();
            spyOn(window, "getData").and.callFake(function() {return _getData;});
            spyOn(window, "setData");
            def = {
                firstName: '',
                secondName: '',
                cardNumber: '',
                securityCode: '',
                expMonth: '01',
                expDate: new Date().getFullYear().toString(),
                expTotal: '',
                street: '',
                city: '',
                state: '',
                zip: '',
                img: App.Data.settings.get('img_path'),
                billing_address: null,
                use_profile_address: false,
                use_checkout_address: false,
                rememberCard: true
            };
        });

        it('Environment', function() {
            expect(App.Models.Card).toBeDefined();
        });

        it('Create model', function() {
            expect(model.toJSON()).toEqual(def);
        });

        describe('set billing address', function() {
            beforeEach(function() {
                spyOn(App.Models.Card.prototype, 'set');
            });

            it('payment processor dos not require billing address', function() {
                isBillingAddressCard.and.returnValue(false);

                model = new App.Models.Card();
                expect(_.indexOf(model.set.calls.mostRecent().args, 'billing_address')).toBe(-1);
            });

            it('payment processor requires billing address', function() {
                isBillingAddressCard.and.returnValue(true);

                model = new App.Models.Card();
                expect(_.indexOf(model.set.calls.mostRecent().args, 'billing_address')).not.toBe(-1);
            });
        });

        describe('trim()', function() {
            it('firstName and secondName are strings', function() {
                model.set({
                    firstName: ' first ',
                    secondName: ' second '
                });
                model.trim();

                expect(model.get('firstName')).toBe('first');
                expect(model.get('secondName')).toBe('second');
            });

            it('firstName and secondName are not strings', function() {
                model.set({
                    firstName: 123,
                    secondName: null
                });
                model.trim();

                expect(model.get('firstName')).toBe('');
                expect(model.get('secondName')).toBe('');
            });
        });

        it('saveCard()', function() {
            model.saveCard(); // save current state model in storage (detected automatic)
            expect(setData).toHaveBeenCalledWith('card', model);
        });

        it('empty_card_number()', function() {
            model.set({
                cardNumber: '4234567890123456',
                expDate: 2999,
                expMonth: 12,
                securityCode: '777'
            });
            model.empty_card_number(); // removing card information
            expect(model.toJSON()).toEqual(def);
        });

        it('loadCard()', function() {
            spyOn(model, 'set');
            model.loadCard(); // load state model from storage (detected automatic)
            expect(getData).toHaveBeenCalledWith('card');
            expect(model.set).toHaveBeenCalledWith({billing_address: jasmine.any(Backbone.Model)});
            _getData = {img: 'asdasd', billing_address: {}};
            model.loadCard();
            expect(model.set).toHaveBeenCalledWith({billing_address: jasmine.any(Backbone.Model)});
        });

        describe("check()", function() {

            var payment = {};

            beforeEach(function() {
                spyOn(App.Data.settings, 'get_payment_process').and.returnValue(payment);
                payment.paypal = false;
                payment.paypal_direct_credit_card = false;
            });

            it("Card number", function() {
                // empty card number
                expect(model.check().errorMsg.indexOf(locale.CARD_NUMBER)).not.toBe(-1);
                expect(model.check().status).toBe('ERROR_EMPTY_FIELDS');
                expect(Array.isArray(model.check().errorList)).toBe(true);

                // incorrect first number
                model.set('cardNumber', '12345678901234567');
                expect(model.check().errorMsg.indexOf(locale.CARD_NUMBER)).not.toBe(-1);

                // valid card number
                model.set('cardNumber', '5555555555555555');
                expect(model.check().errorMsg.indexOf(locale.CARD_NUMBER)).toBe(-1);

                // very long card number
                model.set('cardNumber', '12345678901234567890');
                expect(model.check().errorMsg.indexOf(locale.CARD_NUMBER)).not.toBe(-1);

                // very short card number
                model.set('cardNumber', '123456789012');
                expect(model.check().errorMsg.indexOf(locale.CARD_NUMBER)).not.toBe(-1);
            });

            it("Security code", function() {
                // valid card number
                model.set({
                    cardNumber: '5555555555555555',
                    expMonth: '01',
                    expDate: (new Date().getFullYear() + 1).toString()
                });
                model.set('securityCode', '123');
                expect(model.check().errorMsg).toBeUndefined();

                model.set('securityCode', '1234');
                expect(model.check().errorMsg).toBeUndefined();

                model.set('securityCode', '12345');
                expect(model.check().errorMsg.indexOf(locale.CARD_SECURITY_CODE)).not.toBe(-1);

                model.set('securityCode', 'abc');
                expect(model.check().errorMsg.indexOf(locale.CARD_SECURITY_CODE)).not.toBe(-1);
            });

            it('Credit card payments', function() {
                this.skin = App.Data.settings.get('skin');
                App.Data.settings.set('skin', 'weborder');
                // not paypal direct credit card
                expect(model.check().errorMsg.indexOf(locale.CARD_FIRST_NAME)).toBe(-1);
                expect(model.check().errorMsg.indexOf(locale.CARD_LAST_NAME)).toBe(-1);

                // paypal direct credit card, but empty fields
                payment.paypal = true;
                payment.paypal_direct_credit_card = true;
                expect(model.check().errorMsg.indexOf(locale.CARD_FIRST_NAME)).not.toBe(-1);
                expect(model.check().errorMsg.indexOf(locale.CARD_LAST_NAME)).not.toBe(-1);

                // paypal direct credit card and not empty fields
                model.set({
                    firstName: 'first',
                    secondName: 'second'
                });
                expect(model.check().errorMsg.indexOf(locale.CARD_FIRST_NAME)).toBe(-1);
                expect(model.check().errorMsg.indexOf(locale.CARD_LAST_NAME)).toBe(-1);

                App.Data.settings.set('skin', this.skin);
            });

            it("Exp date", function() {
                model.set('cardNumber', '5555555555555555');
                model.set('securityCode', '444');

                // user did not select month and year
                // (card.expMonth is '01', card.expDate is the current year by default)
                // NOTE: this will fail if runned in January (first month)
                expect(model.check().errorMsg.indexOf(MSG.ERROR_CARD_EXP)).not.toBe(-1);

                // month is less than the current one
                model.set('expMonth', '01');
                expect(model.check().errorMsg.indexOf(MSG.ERROR_CARD_EXP)).not.toBe(-1);

                // year is less than the current one
                model.set('expDate', '2000');
                expect(model.check().errorMsg.indexOf(MSG.ERROR_CARD_EXP)).not.toBe(-1);

                // early exp date
                model.set('expMonth', new Date().getMonth());
                model.set('expDate', new Date().getFullYear());
                expect(model.check().errorMsg.indexOf(MSG.ERROR_CARD_EXP)).not.toBe(-1);

                // correct date, everything is ok
                model.set('expMonth', new Date().getMonth() + 1);
                model.set('expDate', new Date().getFullYear());
                expect(model.check().status).toBe('OK');
            });

            it('`opts.ignorePerson`, `opts.ignoreCardNumber`, `opts.ignoreSecurityCode` are passed as `true`', function() {
                spyOn(model, 'checkPerson');
                spyOn(model, 'checkCardNumber');
                spyOn(model, 'checkSecurityCode');
                model.check({
                    ignorePerson: true,
                    ignoreCardNumber: true,
                    ignoreSecurityCode: true
                });
                expect(model.checkPerson).not.toHaveBeenCalled();
                expect(model.checkCardNumber).not.toHaveBeenCalled();
                expect(model.checkSecurityCode).not.toHaveBeenCalled();
            });
        });

        describe('check_billing_address()', function() {
            var billing_address,
                get_billing_address;

            beforeEach(function() {
                billing_address = {
                    city: 'city',
                    street_1: 'street_1',
                    state: 'state',
                    zipcode: 'zipcode',
                    country_code: 'US'
                };

                get_billing_address = spyOn(window, 'get_billing_address').and.returnValue(billing_address);
            });

            it('all values are valid', function() {
                expect(model.check_billing_address()).toEqual({status: 'OK'});
            });

            it('empty fields', function() {
                expect(model.check_billing_address()).toEqual({status: 'OK'});

                billing_address.street_1 = '';
                expect(model.check_billing_address().status).toBe('ERROR_EMPTY_FIELDS');
                expect(model.check_billing_address().errorMsg.indexOf(_loc.PROFILE_ADDRESS_LINE1)).not.toBe(-1);
                expect(model.check_billing_address().errorList.indexOf(_loc.PROFILE_ADDRESS_LINE1)).not.toBe(-1);

                billing_address.city = '';
                expect(model.check_billing_address().errorMsg.indexOf(_loc.PROFILE_CITY)).not.toBe(-1);
                expect(model.check_billing_address().errorList.indexOf(_loc.PROFILE_CITY)).not.toBe(-1);

                billing_address.state = '';
                expect(model.check_billing_address().errorMsg.indexOf(_loc.PROFILE_STATE)).not.toBe(-1);
                expect(model.check_billing_address().errorList.indexOf(_loc.PROFILE_STATE)).not.toBe(-1);

                // ZIP code
                billing_address.zipcode = '';
                billing_address.country_code = 'US';
                expect(model.check_billing_address().errorMsg.indexOf(_loc.PROFILE_ZIP_CODE)).not.toBe(-1);
                expect(model.check_billing_address().errorList.indexOf(_loc.PROFILE_ZIP_CODE)).not.toBe(-1);

                // Postal code
                billing_address.country_code = 'CA';
                expect(model.check_billing_address().errorMsg.indexOf(_loc.PROFILE_POSTAL_CODE)).not.toBe(-1);
                expect(model.check_billing_address().errorList.indexOf(_loc.PROFILE_POSTAL_CODE)).not.toBe(-1);

                billing_address.country_code = '';
                expect(model.check_billing_address().errorMsg.indexOf(_loc.PROFILE_COUNTRY)).not.toBe(-1);
                expect(model.check_billing_address().errorList.indexOf(_loc.PROFILE_COUNTRY)).not.toBe(-1);
            });
        });

        describe('checkPerson()', function() {
            var payment;

            beforeEach(function() {
                spyOn(model, 'trim');
                payment = spyOn(App.Data.settings, 'get_payment_process');
            });

            it('all values are valid', function() {
                payment.and.returnValue({});

                expect(model.checkPerson()).toEqual([]);
                expect(model.trim).toHaveBeenCalled();
            });

            it('payment is paypal, all values are valid', function() {
                payment.and.returnValue({paypal: 'smth'});
                model.set({firstName: 'John', secondName: 'Smith'});

                expect(model.checkPerson()).toEqual([]);
                expect(model.trim).toHaveBeenCalled();
            });

            it('payment is paypal, empty fields', function() {
                payment.and.returnValue({paypal: 'smth'});
                model.set({firstName: '', secondName: ''});

                expect(model.checkPerson().indexOf(_loc.CARD_FIRST_NAME)).not.toBe(-1);
                expect(model.checkPerson().indexOf(_loc.CARD_LAST_NAME)).not.toBe(-1);
                expect(model.trim).toHaveBeenCalled();
            });

            it('payment is usaepay, all values are valid', function() {
                payment.and.returnValue({usaepay: 'smth'});
                model.set({firstName: 'John', secondName: 'Smith'});

                expect(model.checkPerson()).toEqual([]);
                expect(model.trim).toHaveBeenCalled();
            });

            it('payment is usaepay, empty fields', function() {
                payment.and.returnValue({usaepay: 'smth'});
                model.set({firstName: '', secondName: ''});

                expect(model.checkPerson().indexOf(_loc.CARD_FIRST_NAME)).not.toBe(-1);
                expect(model.checkPerson().indexOf(_loc.CARD_LAST_NAME)).not.toBe(-1);
                expect(model.trim).toHaveBeenCalled();
            });

            it('payment is braintree, all values are valid', function() {
                payment.and.returnValue({braintree: 'smth'});
                model.set({firstName: 'John', secondName: 'Smith'});

                expect(model.checkPerson()).toEqual([]);
                expect(model.trim).toHaveBeenCalled();
            });

            it('payment is braintree, empty fields', function() {
                payment.and.returnValue({braintree: 'smth'});
                model.set({firstName: '', secondName: ''});

                expect(model.checkPerson().indexOf(_loc.CARD_FIRST_NAME)).not.toBe(-1);
                expect(model.checkPerson().indexOf(_loc.CARD_LAST_NAME)).not.toBe(-1);
                expect(model.trim).toHaveBeenCalled();
            });

            it('payment is globalcollect, all values are valid', function() {
                payment.and.returnValue({globalcollect: 'smth'});
                model.set({firstName: 'John', secondName: 'Smith'});

                expect(model.checkPerson()).toEqual([]);
                expect(model.trim).toHaveBeenCalled();
            });

            it('payment is globalcollect, empty fields', function() {
                payment.and.returnValue({globalcollect: 'smth'});
                model.set({firstName: '', secondName: ''});

                expect(model.checkPerson().indexOf(_loc.CARD_FIRST_NAME)).not.toBe(-1);
                expect(model.checkPerson().indexOf(_loc.CARD_LAST_NAME)).not.toBe(-1);
                expect(model.trim).toHaveBeenCalled();
            });

            it('payment is quickbooks, all values are valid', function() {
                payment.and.returnValue({quickbooks: 'smth'});
                model.set({firstName: 'John', secondName: 'Smith'});

                expect(model.checkPerson()).toEqual([]);
                expect(model.trim).toHaveBeenCalled();
            });

            it('payment is quickbooks, empty fields', function() {
                payment.and.returnValue({quickbooks: 'smth'});
                model.set({firstName: '', secondName: ''});

                expect(model.checkPerson().indexOf(_loc.CARD_FIRST_NAME)).not.toBe(-1);
                expect(model.checkPerson().indexOf(_loc.CARD_LAST_NAME)).not.toBe(-1);
                expect(model.trim).toHaveBeenCalled();
            });

            it('payment is worldpay, all values are valid', function() {
                payment.and.returnValue({worldpay: 'smth'});
                model.set({firstName: 'John', secondName: 'Smith'});

                expect(model.checkPerson()).toEqual([]);
                expect(model.trim).toHaveBeenCalled();
            });

            it('payment is worldpay, empty fields', function() {
                payment.and.returnValue({worldpay: 'smth'});
                model.set({firstName: '', secondName: ''});

                expect(model.checkPerson().indexOf(_loc.CARD_FIRST_NAME)).not.toBe(-1);
                expect(model.checkPerson().indexOf(_loc.CARD_LAST_NAME)).not.toBe(-1);
                expect(model.trim).toHaveBeenCalled();
            });
        });

        describe('checkSecurityCode()', function() {
            it('security code is empty', function() {
                model.set('securityCode', '');
                expectSecurityCodeError();
            });

            it('security code contains smth other than digits', function() {
                model.set('securityCode', 'ab1');
                expectSecurityCodeError();

                model.set('securityCode', '1 23');
                expectSecurityCodeError();

                model.set('securityCode', '1%3');
                expectSecurityCodeError();
            });

            it('security code length is less than 3', function() {
                model.set('securityCode', '0');
                expectSecurityCodeError();

                model.set('securityCode', '12');
                expectSecurityCodeError();
            });

            it('security code length is more than 4', function() {
                model.set('securityCode', '12345');
                expectSecurityCodeError();
            });

            it('security code is 3 or 4 digits', function() {
                model.set('securityCode', '123');
                expect(model.checkSecurityCode().indexOf(_loc.CARD_SECURITY_CODE)).toBe(-1);

                model.set('securityCode', '1234');
                expect(model.checkSecurityCode().indexOf(_loc.CARD_SECURITY_CODE)).toBe(-1);
            });

            function expectSecurityCodeError() {
                expect(model.checkSecurityCode().indexOf(_loc.CARD_SECURITY_CODE)).not.toBe(-1);
            }
        });

        describe('checkCardNumber()', function() {
            it('card number is empty', function() {
                model.set('cardNumber', '');
                expectCardNumberError();
            });

            it('card number contains smth other than digits', function() {
                model.set('cardNumber', '4234 5678 9012 3456');
                expectCardNumberError();

                model.set('cardNumber', '4234567890abcdef');
                expectCardNumberError();

                model.set('cardNumber', '4234.5678.9012.3456');
                expectCardNumberError();
            });

            it('card number length is less than 13', function() {
                model.set('cardNumber', '423456789012');
                expectCardNumberError();

                model.set('cardNumber', '42345678901');
                expectCardNumberError();
            });

            it('card number length is more than 19', function() {
                model.set('cardNumber', '42345678901234567890');
                expectCardNumberError();

                model.set('cardNumber', '423456789012345678901');
                expectCardNumberError();
            });

            it('card number starts with digits other than 3-6', function() {
                model.set('cardNumber', '1234567890123');
                expectCardNumberError();

                model.set('cardNumber', '0234567890123456');
                expectCardNumberError();

                model.set('cardNumber', '2234567890123456');
                expectCardNumberError();

                model.set('cardNumber', '7234567890123456');
                expectCardNumberError();

                model.set('cardNumber', '8234567890123456');
                expectCardNumberError();

                model.set('cardNumber', '9234567890123456');
                expectCardNumberError();

                model.set('cardNumber', '1234567890123456789');
                expectCardNumberError();
            });

            it('card number is valid (starts with 3-6, 13-19 digits long)', function() {
                model.set('cardNumber', '4234567890123');
                expect(model.checkCardNumber().indexOf(_loc.CARD_NUMBER)).toBe(-1);

                model.set('cardNumber', '4234567890123456');
                expect(model.checkCardNumber().indexOf(_loc.CARD_NUMBER)).toBe(-1);

                model.set('cardNumber', '4234567890123456789');
                expect(model.checkCardNumber().indexOf(_loc.CARD_NUMBER)).toBe(-1);
            });

            function expectCardNumberError() {
                expect(model.checkCardNumber().indexOf(_loc.CARD_NUMBER)).not.toBe(-1);
            }
        });

        it('clearData()', function() {
            model.set({
                cardNumber: '4234567890123456',
                expDate: 2999,
                expMonth: 12,
                securityCode: '777'
            });
            model.clearData(); // removal of information about credit card
            expect(model.toJSON()).toEqual(def);
            expect(setData).toHaveBeenCalledWith('card', model);
        });

        describe('window.get_billing_address()', function() {
            var billing_address;

            beforeEach(function() {
                billing_address = new Backbone.Model({
                    test: 'test',
                    country: 'US'
                });

                this.customer = App.Data.customer;

                App.Data.customer = new Backbone.Model({
                    addresses: {
                        getDefaultProfileAddress: jasmine.createSpy().and.callFake(function() {return billing_address;}),
                        getCheckoutAddress: jasmine.createSpy().and.returnValue(billing_address.toJSON())
                    }
                });

                App.Data.card = new Backbone.Model({billing_address: billing_address});
            });

            afterEach(function() {
                App.Data.customer = this.customer;
                App.Data.card = this.card;
            });

            it('card.use_profile_address is true', function() {
                App.Data.card.set('use_profile_address', true);
                expect(window.get_billing_address()).toEqual(billing_address.toJSON());
                expect(App.Data.customer.get('addresses').getDefaultProfileAddress).toHaveBeenCalled();
                billing_address = false;
                expect(window.get_billing_address()).toBe(null);
                expect(App.Data.customer.get('addresses').getDefaultProfileAddress).toHaveBeenCalled();
            });

            it('card.use_profile_address is false', function() {
                App.Data.card.set('use_profile_address', false);

                expect(window.get_billing_address()).toEqual(billing_address.toJSON());
                expect(App.Data.customer.get('addresses').getDefaultProfileAddress).not.toHaveBeenCalled();

                App.Data.card.set('billing_address', 'not object');
                expect(window.get_billing_address()).toBe(null);

            });

            it('card.use_checkout_address is true', function() {
                App.Data.card.set({
                    use_profile_address: false,
                    use_checkout_address: true
                });

                expect(window.get_billing_address()).toEqual({test: 'test', country: 'US', country_code: 'US'});
                expect(App.Data.customer.get('addresses').getCheckoutAddress).toHaveBeenCalled();
            });

            it('card.use_checkuot_address is false', function() {
                App.Data.card.set({
                    use_profile_address: false,
                    use_checkout_address: false
                });

                expect(window.get_billing_address()).toEqual(billing_address.toJSON());
                expect(App.Data.customer.get('addresses').getCheckoutAddress).not.toHaveBeenCalled();

                App.Data.card.set('billing_address', 'not object');
                expect(window.get_billing_address()).toBe(null);

            });
        });

    });
});