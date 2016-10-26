define(['payments', 'js/utest/data/Payments', 'js/utest/data/Timetable'], function(payments, data) {
    'use strict';

    describe("App.Models.PaymentToken", function() {
        var model;

        beforeEach(function() {
            model = new App.Models.PaymentToken();
        });

        it("Environment", function() {
            expect(App.Models.PaymentToken).toBeDefined();
        });

        it("Create model", function() {
            expect(model.toJSON()).toEqual(data.ModelPaymentToken.defaults);
            expect(model.type).toBe(data.ModelPaymentToken.type);
        });

        describe("initialize()", function() {

        });

        describe("setPrimaryAsSelected()", function() {
            it("`is_primary` is false", function() {
                var model = new App.Models.PaymentToken();
                model.setPrimaryAsSelected();
                expect(model.get('selected')).toBe(data.ModelPaymentToken.defaults.selected);
            });

            it("`is_primary` is true", function() {
                var model = new App.Models.PaymentToken({is_primary: true});
                model.setPrimaryAsSelected();
                expect(model.get('selected')).toBe(true);
            });
        });

        describe("setSelectedAsPrimary()", function() {
            it("`selected` is false", function() {
                var model = new App.Models.PaymentToken();
                model.setSelectedAsPrimary();
                expect(model.get('is_primary')).toBe(data.ModelPaymentToken.defaults.is_primary);
            });

            it("`selected` is true", function() {
                var model = new App.Models.PaymentToken({selected: true});
                model.setSelectedAsPrimary();
                expect(model.get('is_primary')).toBe(true);
            });
        });

        describe("resetAttributes()", function() {
            var model = new App.Models.PaymentToken();

            it("`attributes` is object", function() {
                model._originalAttributes.new_property = 'some value';
                expect(model.resetAttributes().attributes).toEqual(model._originalAttributes);
            });
        });

        describe("checkAttributesDiff()", function() {
            var model = new App.Models.PaymentToken();

            it("there's differences between original and modified attributes", function() {
                model.set('is_primary', true);
                expect(model.checkAttributesDiff().status).toBe('OK');
            });

            it("there's no differences between original and modified attributes", function() {
                model.set('is_primary', false);
                expect(model.checkAttributesDiff().status).toBe('ERROR');
            });
        });

        describe("removePayment()", function() {
            var authHeader = {Authorization: 'Bearer ASDASDASDASDASDSAD'},
                ajaxReq, ajaxParams;

            beforeEach(function() {
                ajaxReq = Backbone.$.Deferred();
                spyOn(Backbone.$, 'ajax').and.callFake(function() {
                    ajaxParams = arguments[0];
                    return ajaxReq;
                });
            });

            it("`authorizationHeader` param isn't object", function() {
                var testValues = [1, -1, 0, NaN, Infinity, -Infinity, false, true, null, undefined, '', '213'];
                testValues.forEach(function() {
                    expect(model.removePayment()).toBeUndefined();
                });
            });

            it("`authorizationHeader` param is object", function() {
                var serverURL = "sadasd",
                    id = 12,
                    type = "123123";
                model.set('id', id);
                model.type = type;
                expect(model.removePayment(serverURL, authHeader)).toBe(ajaxReq);
                expect(ajaxParams.url).toBe(serverURL + "/customers/payments/" + type + "/" + id + "/");
                expect(ajaxParams.method).toBe("DELETE");
                expect(ajaxParams.headers).toBe(authHeader);
                expect(ajaxParams.success).toEqual(jasmine.any(Function));
                expect(ajaxParams.error).toEqual(jasmine.any(Function));
            });
        });

        describe("changePayment()", function() {
            var primitives = [1, -1, 0, NaN, Infinity, -Infinity, false, true, null, undefined, '', '213'],
                authHeader = {Authorization: 'Bearer ASDASDASDASDASDSAD'},
                ajaxReq, ajaxParams, _data;

            beforeEach(function() {
                _data = {
                    is_primary: 1
                };
                ajaxReq = Backbone.$.Deferred();
                spyOn(Backbone.$, 'ajax').and.callFake(function() {
                    ajaxParams = arguments[0];
                    return ajaxReq;
                });
            });

            it("`authorizationHeader` param isn't object", function() {
                primitives.forEach(function() {
                    expect(model.changePayment()).toBeUndefined();
                });
            });

            it("failure request", function() {
                var serverURL = "sadasd",
                    id = 12,
                    type = "123123";
                model.set('id', id);
                model.type = type;
                expect(model.changePayment(serverURL, authHeader, _data)).toBe(ajaxReq);
                expect(ajaxParams.url).toBe(serverURL + "/customers/payments/" + type + "/" + id + "/");
                expect(ajaxParams.method).toBe("PATCH");
                expect(ajaxParams.headers).toBe(authHeader);
                expect(ajaxParams.contentType).toBe("application/json");
                expect(ajaxParams.data).toBe(JSON.stringify(_data));
                expect(ajaxParams.success).toEqual(jasmine.any(Function));
                expect(ajaxParams.error).toEqual(jasmine.any(Function));
            });
        });
    });

    describe("App.Collections.PaymentTokens", function() {
        var collection;

        beforeEach(function() {
            collection = new App.Collections.PaymentTokens();
        });

        it("Environment", function() {
            expect(App.Collections.PaymentTokens).toBeDefined();
        });

        it("Create collection", function() {
            expect(collection.serverURL).toBe(data.CollectionPaymentTokens.serverURL);
            expect(collection.ignoreSelectedToken).toBe(data.CollectionPaymentTokens.ignoreSelectedToken);
        });

        it("initialize()", function() {
            spyOn(collection, 'listenTo');
            collection.initialize();
            expect(collection.listenTo).toHaveBeenCalledWith(collection, 'change:selected', collection.radioSelection);
            expect(collection.listenTo).toHaveBeenCalledWith(collection, 'change:is_primary', collection.checkboxSelection);
            expect(collection.listenTo).toHaveBeenCalledWith(collection, 'add', collection.onAddHandler);
        });

        it("resetModelsAttrs()", function() {
            var payment1 = new App.Models.PaymentToken(),
                payment2 = new App.Models.PaymentToken();

            spyOn(payment1, 'resetAttributes');
            spyOn(payment2, 'resetAttributes');
            collection.add([payment1, payment2]);
            collection.resetModelsAttrs();
            expect(payment1.resetAttributes).toHaveBeenCalled();
            expect(payment2.resetAttributes).toHaveBeenCalled();
        });

        describe("radioSelection()", function() {
            var token1, token2;

            beforeEach(function() {
                collection.add([{'selected': false}, {'selected': true}]);
                token1 = collection.at(0);
                token2 = collection.at(1);
            });

            it("`value` param is false", function() {
                collection.radioSelection(token1, false);
                collection.radioSelection(token2, false);
                expect(token1.get('selected')).toBe(false);
                expect(token2.get('selected')).toBe(true);
            });

            it("`value` param is true", function() {
                // token2 is selected
                collection.radioSelection(token2, true);
                expect(token1.get('selected')).toBe(false);
                expect(token2.get('selected')).toBe(true);

                // token1 is selected
                token1.set('selected', true, {silent: true});
                collection.radioSelection(token1, true);
                expect(token1.get('selected')).toBe(true);
                expect(token2.get('selected')).toBe(false);

            });
        });

        describe("checkboxSelection()", function() {
            var token1, token2;

            beforeEach(function() {
                collection.add([{'is_primary': false}, {'is_primary': true}]);
                token1 = collection.at(0);
                token2 = collection.at(1);
            });

            it("`value` param is false", function() {
                collection.checkboxSelection(token1, false);
                collection.checkboxSelection(token2, false);
                expect(token1.get('is_primary')).toBe(false);
                expect(token2.get('is_primary')).toBe(true);
            });

            it("`value` param is true", function() {
                // token2 is primary
                collection.checkboxSelection(token2, true);
                expect(token1.get('is_primary')).toBe(false);
                expect(token2.get('is_primary')).toBe(true);

                // token1 is primary
                token1.set('is_primary', true, {silent: true});
                collection.checkboxSelection(token1, true);
                expect(token1.get('is_primary')).toBe(true);
                expect(token2.get('is_primary')).toBe(false);

            });
        });

        describe("onAddHandler()", function() {
            var token1, token2;

            beforeEach(function() {
                collection.add([{
                    selected: false,
                    is_primary: false
                }, {
                    selected: true,
                    is_primary: true
                }]);
                token1 = collection.at(0);
                token2 = collection.at(1);
            });

            it("`model.attributes.selected` is true", function() {
                collection.add({selected: true});
                expect(collection.at(2).get('selected')).toBe(true);
                expect(token1.get('selected')).toBe(false);
                expect(token2.get('selected')).toBe(false);
            });

            it("`model.attributes.selected` is false", function() {
                collection.add({selected: false});
                expect(collection.at(2).get('selected')).toBe(false);
                expect(token1.get('selected')).toBe(false);
                expect(token2.get('selected')).toBe(true);
            });

            it("`model.attributes.is_primary` is true", function() {
                collection.add({is_primary: true});
                expect(collection.at(2).get('is_primary')).toBe(true);
                expect(token1.get('is_primary')).toBe(false);
                expect(token2.get('is_primary')).toBe(false);
            });

            it("`model.attributes.is_primary` is false", function() {
                collection.add({is_primary: false});
                expect(collection.at(2).get('is_primary')).toBe(false);
                expect(token1.get('is_primary')).toBe(false);
                expect(token2.get('is_primary')).toBe(true);
            });
        });

        describe("orderPayWithToken()", function() {
            var primitives = [-1, 0, 1, NaN, Infinity, 'asd', '', false, true, null, undefined],
                authHeader = {Authorization: "Bearer ASDASDASD"},
                token_id = 12,
                vault_id = 34,
                order, selectedToken, ajaxReq, ajaxParams;

            beforeEach(function() {
                order = {
                    paymentInfo: {
                        cardInfo: {}
                    }
                };
                collection.add([
                    new App.Models.PaymentToken({ id: token_id, vault_id: vault_id, 'selected': true }),
                    new App.Models.PaymentToken({ id: 56, vault_id: 78, 'selected': false })
                ]);
                ajaxReq = Backbone.$.Deferred();
                collection.paymentProcessor = "testPP";
                collection.ignoreSelectedToken = false;
                spyOn(Backbone.$, 'ajax').and.callFake(function() {
                    ajaxParams = arguments[0];
                    ajaxParams.success();
                    return ajaxReq;
                });
            });

            function commonExpectations(req) {
                expect(req).toBe(ajaxReq);
                expect(Backbone.$.ajax).toHaveBeenCalled();
                expect(ajaxParams.url).toBe(data.CollectionPaymentTokens.orderPayWithTokenURL);
                expect(ajaxParams.method).toBe("POST");
                expect(ajaxParams.headers).toBe(authHeader);
                expect(ajaxParams.contentType).toBe("application/json");
                expect(ajaxParams.success).toEqual(jasmine.any(Function));
                expect(ajaxParams.error).toEqual(jasmine.any(Function));
                expect(ajaxParams.data).toBe(JSON.stringify(order));
            }

            it("`authorizationHeader` param isn't object", function() {
                primitives.forEach(function(value) {
                    var req = collection.orderPayWithToken(value, order);
                    expect(req).toBeUndefined();
                    expect(Backbone.$.ajax).not.toHaveBeenCalled();
                });
            });

            it("`order` param isn't object", function() {
                primitives.forEach(function(value) {
                    var req = collection.orderPayWithToken(authHeader, value);
                    expect(req).toBeUndefined();
                    expect(Backbone.$.ajax).not.toHaveBeenCalled();
                });
            });

            it("`ignoreSelectedToken` is false", function() {
                var req = collection.orderPayWithToken(authHeader, order),
                    cardInfo = order.paymentInfo.cardInfo;
                commonExpectations(req);
                expect(cardInfo.token_id).toBe(token_id);
                expect(cardInfo.vault_id).toBe(vault_id);
                expect(cardInfo.payment_processor).toBe(collection.paymentProcessor);
            });

            it("`ignoreSelectedToken` is true", function() {
                collection.ignoreSelectedToken = true;

                var req = collection.orderPayWithToken(authHeader, order),
                    cardInfo = order.paymentInfo.cardInfo;

                commonExpectations(req);
                expect(cardInfo.token_id).toBeUndefined();
                expect(cardInfo.vault_id).toBeUndefined();
                expect(cardInfo.payment_processor).toBe(collection.paymentProcessor);
            });

            it("`order.paymentInfo` isn't object", function() {
                primitives.forEach(function(value) {
                    order.paymentInfo = value;
                    var req = collection.orderPayWithToken(authHeader, order)

                    commonExpectations(req);
                    expect(order.paymentInfo).toEqual(value);
                });
            });

            it("`order.paymentInfo` isn't object", function() {
                primitives.forEach(function(value) {
                    order.paymentInfo.cardInfo = value;
                    var req = collection.orderPayWithToken(authHeader, order)

                    commonExpectations(req);
                    expect(order.paymentInfo.cardInfo).toEqual(value);
                });
            });
        });

        it("getSelectedPayment()", function() {
            var token1 = {selected: false, id: 1},
                token2 = {selected: true, id: 2},
                token3 = {selected: true, id: 3};
            // return first selected
            collection.reset([token1, token2, token3]);
            expect(collection.getSelectedPayment().get('id')).toBe(token2.id);

            // not found
            token1 = {selected: false, id: 1};
            token2 = {selected: false, id: 2};
            token3 = {selected: false, id: 3};
            collection.reset([token1, token2, token3]);
            expect(collection.getSelectedPayment()).toBeUndefined();
        });

        it("getPrimaryPayment()", function() {
            var token1 = {is_primary: false, id: 1},
                token2 = {is_primary: true, id: 2},
                token3 = {is_primary: true, id: 3};
            // return first primary
            collection.reset([token1, token2, token3]);
            expect(collection.getPrimaryPayment().get('id')).toBe(token2.id);

            // not found
            token1 = {is_primary: false, id: 1};
            token2 = {is_primary: false, id: 2};
            token3 = {is_primary: false, id: 3};
            collection.reset([token1, token2, token3]);
            expect(collection.getPrimaryPayment()).toBeUndefined();
        });

        describe("getPayments()", function() {
            var authHeader = {Authorization: "Bearer SDASDASDASD"},
                serverURL = "https://identity-dev.revelup.com",
                type = 'testType',
                ajaxReq, ajaxParams,
                instanceName, est, curEst;

            beforeEach(function() {
                ajaxReq = Backbone.$.Deferred();
                collection.serverURL = serverURL;
                collection.type = type;
                collection.reset();

                spyOn(Backbone.$, 'ajax').and.callFake(function() {
                    ajaxParams = arguments[0];
                    ajaxReq.done(ajaxParams.success);
                    return ajaxReq;
                });

                instanceName = null;
                curEst = App.Data.settings.get('establishment');

                spyOn(window, 'getInstanceName').and.callFake(function() {
                    return instanceName;
                });
            });

            afterEach(function() {
                App.Data.settings.set('establishment', curEst);
            });

            function commonExpectations(req) {
                expect(req).toBe(ajaxReq);
                expect(Backbone.$.ajax).toHaveBeenCalled();
                expect(ajaxParams.url).toBe(serverURL + "/customers/payments/" + type + "/");
                expect(ajaxParams.method).toBe("GET");
                expect(ajaxParams.headers).toBe(authHeader);
                expect(ajaxParams.success).toEqual(jasmine.any(Function));
                expect(ajaxParams.error).toEqual(jasmine.any(Function));
            }

            it("request is failure", function() {
                var req = collection.getPayments(authHeader);
                ajaxReq.reject();
                commonExpectations(req);
            });

            it("request is successful, `data` isn't an array", function() {
                var values = ['a', '', -1, 0, 1, NaN, -Infinity, null, undefined, false, true, {}];
                values.forEach(function(value) {
                    var req = collection.getPayments(authHeader);
                    ajaxReq.resolve(value);
                    commonExpectations(req);
                    expect(collection.length).toBe(0);
                });
            });

            it("request is successful, `data` is an array, `tokens[i].establishment` is not object", function() {
                var req = collection.getPayments(authHeader);
                ajaxReq.resolve([{id:1}, {id:2}]);
                commonExpectations(req);
                expect(collection.length).toBe(0);
            });

            it("request is successful, `data` is an array, `tokens[i].establishment` is object, token was created on another instance, `tokens[i].establishment.is_shared_instances` is false", function() {
                var req = collection.getPayments(authHeader);
                instanceName = "bbb";
                ajaxReq.resolve([
                    {
                        id:1,
                        establishment: {
                            instance_name: "aaa",
                            atlas_id: App.Data.settings.get('establishment'),
                            is_shared_instances: false
                        }
                    },
                    {
                        id:2,
                        establishment: {
                            instance_name: "ccc",
                            atlas_id: App.Data.settings.get('establishment'),
                            is_shared_instances: false
                        }
                    }
                ]);
                commonExpectations(req);
                expect(collection.length).toBe(0);
            });

            it("request is successful, `data` is an array, `tokens[i].establishment` is object, token was created on another instance, `tokens[i].establishment.is_shared_instances` is true", function() {
                var req = collection.getPayments(authHeader);
                instanceName = "bbb";
                ajaxReq.resolve([
                    {
                        id:1,
                        establishment: {
                            instance_name: instanceName,
                            atlas_id: App.Data.settings.get('establishment'),
                            is_shared_instances: true
                        }
                    },
                    {
                        id:2,
                        establishment: {
                            instance_name: "ccc",
                            atlas_id: App.Data.settings.get('establishment'),
                            is_shared_instances: false
                        }
                    }
                ]);
                commonExpectations(req);
                expect(collection.length).toBe(1);
            });

            it("request is successful, `data` is an array, `tokens[i].establishment` is object, token was created on the same instance", function() {
                var req = collection.getPayments(authHeader);
                instanceName = "bbb";
                ajaxReq.resolve([
                    {
                        id:1,
                        establishment: {
                            instance_name: instanceName,
                            atlas_id: App.Data.settings.get('establishment'),
                            is_shared_instances: true
                        }
                    },
                    {
                        id:2,
                        establishment: {
                            instance_name: instanceName,
                            atlas_id: App.Data.settings.get('establishment'),
                            is_shared_instances: false
                        }
                    }
                ]);
                commonExpectations(req);
                expect(collection.length).toBe(2);
            });

            it("request is successful, `data` is an array, `tokens[i].establishment` is object, token was created on another establishment, `tokens[i].establishment.is_shared_establishments` is false", function() {
                var req = collection.getPayments(authHeader);
                instanceName = "bbb";
                App.Data.settings.set('establishment', 122);
                ajaxReq.resolve([
                    {
                        id:1,
                        establishment: {
                            instance_name: instanceName,
                            atlas_id: 333,
                            is_shared_establishments: false
                        }
                    },
                    {
                        id:2,
                        establishment: {
                            instance_name: instanceName,
                            atlas_id: 444,
                            is_shared_establishments: false
                        }
                    }
                ]);
                commonExpectations(req);
                expect(collection.length).toBe(0);
            });

            it("request is successful, `data` is an array, `tokens[i].establishment` is object, token was created on another establishment, `tokens[i].establishment.is_shared_establishments` is true", function() {
                var req = collection.getPayments(authHeader);
                instanceName = "bbb";
                App.Data.settings.set('establishment', 122);
                ajaxReq.resolve([
                    {
                        id:1,
                        establishment: {
                            instance_name: instanceName,
                            atlas_id: 333,
                            is_shared_establishments: true
                        }
                    },
                    {
                        id:2,
                        establishment: {
                            instance_name: instanceName,
                            atlas_id: 444,
                            is_shared_establishments: false
                        }
                    }
                ]);
                commonExpectations(req);
                expect(collection.length).toBe(1);
            });

            it("request is successful, `data` is an array, `tokens[i].establishment` is object, token was created on the same establishment", function() {
                var req = collection.getPayments(authHeader),
                    est = 122;
                instanceName = "bbb";
                App.Data.settings.set('establishment', est);
                ajaxReq.resolve([
                    {
                        id:1,
                        establishment: {
                            instance_name: instanceName,
                            atlas_id: est,
                            is_shared_establishments: true
                        }
                    },
                    {
                        id:2,
                        establishment: {
                            instance_name: instanceName,
                            atlas_id: est,
                            is_shared_establishments: false
                        }
                    }
                ]);
                commonExpectations(req);
                expect(collection.length).toBe(2);
            });
        });

        describe("changePayment()", function() {
            var authHeader = {Authorization: "Bearer DSASDSD"},
                token, req, _data, _diff;

            beforeEach(function() {
                _data = { id: 1, is_primary: 0 };
                _diff = { is_primary: 1 };

                req = Backbone.$.Deferred();
                token = new Backbone.Model(_data);
                token._originalAttributes = _data;
                token.changePayment = new Function();
                token.getAttributesDiff = new Function();
                token.setOriginalAttributes = new Function();
                collection.reset([token]);

                spyOn(token, 'changePayment').and.callFake(function() {
                    token.set('is_primary', _diff.is_primary);
                    return req;
                });
                spyOn(token, 'getAttributesDiff').and.returnValue(_diff);
                spyOn(token, 'setOriginalAttributes').and.callFake(function() {
                    token._originalAttributes = token.attributes;
                });
                spyOn(req, 'done').and.callThrough();
            });

            function commonExpectations(_req) {
                expect(_req).toBe(req);
                expect(token.changePayment).toHaveBeenCalledWith(collection.serverURL, authHeader, _diff);
                expect(req.done).toHaveBeenCalled();
            }

            it("`token_id` param is invalid", function() {
                var req = collection.changePayment(2, authHeader);
                expect(req).toBeUndefined();
                expect(token.changePayment).not.toHaveBeenCalled();
            });

            it("`token_id` param is valid", function() {
                var _req = collection.changePayment(1, authHeader);
                commonExpectations(_req);
            });

            it("failure changing", function() {
                var _req = collection.changePayment(1, authHeader);
                req.reject();
                commonExpectations(_req);
                expect(token.attributes).not.toBe(token._originalAttributes);
            });

            it("successful changing", function() {
                var _req = collection.changePayment(1, authHeader);
                req.resolve();
                commonExpectations(_req);
                expect(token.attributes).toBe(token._originalAttributes);
            });
        });

        describe("removePayment()", function() {
            var authHeader = {Authorization: "Bearer DSASDSD"},
                token, req;

            beforeEach(function() {
                req = Backbone.$.Deferred();
                token = new Backbone.Model({id: 1});
                token.removePayment = new Function();
                collection.reset([token]);
                spyOn(token, 'removePayment').and.returnValue(req);
                spyOn(req, 'done').and.callThrough();
            });

            function commonExpectations(_req) {
                expect(_req).toBe(req);
                expect(token.removePayment).toHaveBeenCalledWith(collection.serverURL, authHeader);
                expect(req.done).toHaveBeenCalled();
            }

            it("`token_id` param is invalid", function() {
                var req = collection.removePayment(2, authHeader);
                expect(req).toBeUndefined();
                expect(token.removePayment).not.toHaveBeenCalled();
            });

            it("`token_id` param is valid", function() {
                var _req = collection.removePayment(1, authHeader);
                commonExpectations(_req);
            });

            it("failure removing", function() {
                var _req = collection.removePayment(1, authHeader);
                req.reject();
                commonExpectations(_req);
                expect(collection.at(0)).toBe(token);
            });

            it("successful removing", function() {
                var _req = collection.removePayment(1, authHeader);
                req.resolve();
                commonExpectations(_req);
                expect(collection.length).toBe(0);
            });
        });

        describe("selectFirstItem()", function() {
            var token1, token2;

            beforeEach(function() {
                token1 = new Backbone.Model({id: 1, selected: false});
                token2 = new Backbone.Model({id: 2, selected: false});
                collection.reset([token1, token2]);
            });

            it("any token is selected", function() {
                token2.set('selected', true, {silent: true});
                collection.selectFirstItem();
                expect(token1.get('selected')).toBe(false);
            });

            it("no tokens", function() {
                collection.reset();
                collection.selectFirstItem();
                expect(collection.length).toBe(0);
            });

            it("tokens are unselected", function() {
                collection.selectFirstItem();
                expect(token1.get('selected')).toBe(true);
                expect(token2.get('selected')).toBe(false);
            });
        });
    });

    describe("App.Models.USAePayPayment", function() {
        var model;

        beforeEach(function() {
            model = new App.Models.USAePayPayment();
        });

        it("Environment", function() {
            expect(App.Models.USAePayPayment).toBeDefined();
        });

        it("Create model", function() {
            expect(model.type).toBe(data.ModelUSAePayPayment.type);
        });
    });

    describe("App.Collections.USAePayPayments", function() {
        var collection;

        beforeEach(function() {
            collection = new App.Collections.USAePayPayments();
        });

        it("Environment", function() {
            expect(App.Collections.USAePayPayments).toBeDefined();
        });

        it("Create model", function() {
            expect(collection.paymentProcessor).toBe(data.CollectionUSAePayPayments.paymentProcessor);
            expect(collection.type).toBe(data.CollectionUSAePayPayments.type);
            expect(collection.model).toBe(App.Models.USAePayPayment);
        });

        describe("orderPayWithToken()", function() {
            var primitives = [-1, 0, 1, NaN, Infinity, 'asd', '', false, true, null, undefined],
                authHeader = {Authorizaion: "Bearer ASDASDASDASDASDSDSSDFGHFGGBCCCZXC"},
                user_id = 12,
                def, order;

            beforeEach(function() {
                order = {};
                def = Backbone.$.Deferred();
                spyOn(App.Collections.PaymentTokens.prototype, 'orderPayWithToken').and.returnValue(def);

            });

            it("`authorizationHeader` param isn't object", function() {
                primitives.forEach(function(value) {
                    expect(collection.orderPayWithToken(value, order, user_id)).toBeUndefined();
                });
            });

            it("`order` param isn't object", function() {
                primitives.forEach(function(value) {
                    expect(collection.orderPayWithToken(authHeader, value, user_id)).toBeUndefined();
                });
            });

            it("`user_id` param isn't number", function() {
                var primitives = [{}, 'asd', '', false, true, null, undefined]
                primitives.forEach(function(value) {
                    expect(collection.orderPayWithToken(authHeader, order, value)).toBeUndefined();
                });
            });

            describe("Pay with existing token", function() {
                it("Successful payment", function() {
                    var payment = collection.orderPayWithToken(authHeader, order, user_id);
                    def.resolve();
                    expect(payment).toBeDefined();
                    expect(payment.state()).toBe('resolved');
                    expect(App.Collections.PaymentTokens.prototype.orderPayWithToken).toHaveBeenCalled();
                });

                it("Failure payment", function() {
                    var payment = collection.orderPayWithToken(authHeader, order, user_id);
                    def.reject();
                    expect(payment).toBeDefined();
                    expect(payment.state()).toBe('rejected');
                    expect(App.Collections.PaymentTokens.prototype.orderPayWithToken).toHaveBeenCalled();
                });
            });

            describe("Create new token", function() {
                var createPaymentDef, token, card_type, masked_card_number,
                    instance_name, atlas_id, last_digits;

                beforeEach(function() {
                    card_type = 1;
                    token = "asdd-3sd3-sadd-23sd";
                    last_digits = "1234";
                    masked_card_number = "******" + last_digits;
                    instance_name = App.Data.settings.get('hostname').replace(/\..*/, '');
                    atlas_id = App.Data.settings.get('establishment');
                    createPaymentDef = Backbone.$.Deferred();
                    spyOn(collection, 'createPaymentToken').and.returnValue(createPaymentDef);
                });

                it("`order.paymentInfo` isn't object", function() {
                    primitives.forEach(function(value) {
                        var payment = collection.orderPayWithToken(authHeader, order, user_id);
                        expect(payment).toBeDefined();
                        expect(collection.createPaymentToken).not.toHaveBeenCalled();
                    });
                });

                it("`order.paymentInfo` is object, `order.paymentInfo.token` isn't specified", function() {
                    order.paymentInfo = {};
                    var payment = collection.orderPayWithToken(authHeader, order, user_id);
                    expect(payment).toBeDefined();
                    expect(collection.createPaymentToken).not.toHaveBeenCalled();
                });

                it("`order.paymentInfo` is object, `order.paymentInfo.token` is specified, `order.paymentInfo.card_type` is undefined", function() {
                    order.paymentInfo = {
                        token: token
                    };
                    var payment = collection.orderPayWithToken(authHeader, order, user_id);
                    expect(payment).toBeDefined();
                    expect(collection.createPaymentToken).not.toHaveBeenCalled();
                });

                it("`order.paymentInfo` is object, `order.paymentInfo.token` is specified, `order.paymentInfo.card_type` is specified, `order.paymentInfo.masked_card_number` isn't specified", function() {
                    order.paymentInfo = {
                        token: token,
                        card_type: card_type
                    };
                    var payment = collection.orderPayWithToken(authHeader, order, user_id);
                    expect(payment).toBeDefined();
                    expect(collection.createPaymentToken).not.toHaveBeenCalled();
                });

                it("`order.paymentInfo` is object, `order.paymentInfo.token`, `order.paymentInfo.card_type`, `order.paymentInfo.masked_card_number` are specified", function() {
                    order.paymentInfo = {
                        token: token,
                        card_type: card_type,
                        masked_card_number: masked_card_number
                    };

                    var payment = collection.orderPayWithToken(authHeader, order, user_id);

                    expect(payment).toBeDefined();
                    expect(collection.createPaymentToken).toHaveBeenCalledWith(authHeader, {
                        customer: user_id,
                        card_type: card_type,
                        last_digits: last_digits,
                        first_name: '',
                        last_name: '',
                        token: token,
                        instance_name: instance_name,
                        atlas_id: atlas_id
                    });
                });

                it("`card` param isn't object", function() {
                    order.paymentInfo = {
                        token: token,
                        card_type: card_type,
                        masked_card_number: masked_card_number
                    };

                    primitives.forEach(function(value) {
                        var payment = collection.orderPayWithToken(authHeader, order, user_id, value);

                        expect(payment).toBeDefined();
                        expect(collection.createPaymentToken).toHaveBeenCalledWith(authHeader, {
                            customer: user_id,
                            card_type: card_type,
                            last_digits: last_digits,
                            first_name: '',
                            last_name: '',
                            token: token,
                            instance_name: instance_name,
                            atlas_id: atlas_id
                        });
                    });
                });

                it("`card` param is object", function() {
                    order.paymentInfo = {
                        token: token,
                        card_type: card_type,
                        masked_card_number: masked_card_number
                    };

                    var card = {
                        firstName: 'First',
                        secondName: 'Last'
                    }

                    var payment = collection.orderPayWithToken(authHeader, order, user_id, card);

                    expect(payment).toBeDefined();
                    expect(collection.createPaymentToken).toHaveBeenCalledWith(authHeader, {
                        customer: user_id,
                        card_type: card_type,
                        last_digits: last_digits,
                        first_name: card.firstName,
                        last_name: card.secondName,
                        token: token,
                        instance_name: instance_name,
                        atlas_id: atlas_id
                    });
                });

                it("token isn't created", function() {
                    order.paymentInfo = {
                        token: token,
                        card_type: card_type,
                        masked_card_number: masked_card_number
                    };

                    var payment = collection.orderPayWithToken(authHeader, order, user_id);
                    createPaymentDef.reject();

                    expect(payment).toBeDefined();
                    expect(payment.state()).toBe('rejected');
                    expect(App.Collections.PaymentTokens.prototype.orderPayWithToken).not.toHaveBeenCalled();
                });

                it("token is created, payment is successful", function() {
                    order.paymentInfo = {
                        token: token,
                        card_type: card_type,
                        masked_card_number: masked_card_number
                    };

                    var payment = collection.orderPayWithToken(authHeader, order, user_id);
                    createPaymentDef.resolve();
                    def.resolve();

                    expect(payment).toBeDefined();
                    expect(payment.state()).toBe('resolved');
                    expect(order.paymentInfo.token).toBeUndefined();
                    expect(order.paymentInfo.card_type).toBeUndefined();
                    expect(order.paymentInfo.masked_card_number).toBeUndefined();
                    expect(App.Collections.PaymentTokens.prototype.orderPayWithToken).toHaveBeenCalled();
                });

                it("token is created, payment is failure", function() {
                    order.paymentInfo = {
                        token: token,
                        card_type: card_type,
                        masked_card_number: masked_card_number
                    };

                    var payment = collection.orderPayWithToken(authHeader, order, user_id);
                    createPaymentDef.resolve();
                    def.reject();

                    expect(payment).toBeDefined();
                    expect(payment.state()).toBe('rejected');
                    expect(order.paymentInfo.token).toBeUndefined();
                    expect(order.paymentInfo.card_type).toBeUndefined();
                    expect(order.paymentInfo.masked_card_number).toBeUndefined();
                    expect(App.Collections.PaymentTokens.prototype.orderPayWithToken).toHaveBeenCalled();
                });
            });
        });

        describe("createPaymentToken()", function() {
            var authHeader = {Authorization: "Bearer: ASDASDASDSDSD"},
                serverURL = "https://identity-dev.revelup.com/customer-auth",
                ajaxReq, ajaxParams, _data;

            beforeEach(function() {
                _data = {
                    customer: 1,
                    card_type: 1,
                    last_digits: "1234",
                    first_name: "First",
                    last_name: "Last",
                    token: "asds-3s33-asdd-fghh",
                    instance_name: "weborder-dev",
                    atlas_id: "14"
                };
                ajaxReq = Backbone.$.Deferred();
                collection.serverURL = serverURL;

                spyOn(Backbone.$, "ajax").and.callFake(function() {
                    ajaxParams = arguments[0];
                    ajaxReq.done(ajaxParams.success);
                    return ajaxReq;
                });
            });

            function commonExpectations(req) {
                expect(req).toBe(ajaxReq);
                expect(ajaxParams.url).toBe(serverURL + "/customers/payments/" + collection.type + "/");
                expect(ajaxParams.method).toBe("POST");
                expect(ajaxParams.data).toBe(JSON.stringify(_data));
                expect(ajaxParams.headers).toBe(authHeader);
                expect(ajaxParams.contentType).toBe("application/json");
                expect(ajaxParams.success).toEqual(jasmine.any(Function));
                expect(ajaxParams.error).toEqual(jasmine.any(Function));
            }

            it("failure request", function() {
                var req = collection.createPaymentToken(authHeader, _data);
                ajaxReq.reject();
                commonExpectations(req);
                expect(collection.length).toBe(0);
            });

            it("successful request, `data` param isn't object", function() {
                var primitives = [-1, 0, 1, NaN, Infinity, 'asd', '', false, true, null, undefined];
                primitives.forEach(function(value) {
                    var req = collection.createPaymentToken(authHeader, _data);
                    ajaxReq.resolve(value);
                    commonExpectations(req);
                    expect(collection.length).toBe(0);
                });
            });

            it("successful request, `data` param is object", function() {
                var req = collection.createPaymentToken(authHeader, _data);
                ajaxReq.resolve({id:1});
                commonExpectations(req);
                expect(collection.length).toBe(1);
            });
        });
    });

    describe("App.Models.MercuryPayment", function() {
        var model;

        beforeEach(function() {
            model = new App.Models.MercuryPayment();
        });

        it("Environment", function() {
            expect(App.Models.MercuryPayment).toBeDefined();
        });

        it("Create model", function() {
            expect(model.type).toBe(data.ModelMercuryPayment.type);
        });
    });

    describe("App.Collections.MercuryPayments", function() {
        var collection;

        beforeEach(function() {
            collection = new App.Collections.MercuryPayments();
        });

        it("Environment", function() {
            expect(App.Collections.MercuryPayments).toBeDefined();
        });

        it("Create model", function() {
            expect(collection.paymentProcessor).toBe(data.CollectionMercuryPayments.paymentProcessor);
            expect(collection.type).toBe(data.CollectionMercuryPayments.type);
            expect(collection.model).toBe(App.Models.MercuryPayment);
        });

        describe("orderPayWithToken()", function() {
            var primitives = [-1, 0, 1, NaN, Infinity, 'asd', '', false, true, null, undefined],
                req, token, _data;

            beforeEach(function() {
                req = Backbone.$.Deferred();
                token = new Backbone.Model({id: 3});
                collection.ignoreSelectedToken = false;
                _data = {
                    token: {
                        id:1,
                        customer: 2
                    }
                };

                spyOn(App.Collections.PaymentTokens.prototype, "orderPayWithToken").and.returnValue(req);
                spyOn(collection, 'getSelectedPayment').and.callFake(function() {
                    return token;
                });
                spyOn(req, 'done').and.callThrough();
            });

            function commonExpects(_req) {
                expect(_req).toBe(req);
                expect(req.done).toHaveBeenCalled();
                expect(App.Collections.PaymentTokens.prototype.orderPayWithToken).toHaveBeenCalled();
            }

            it("`ignoreSelectedToken` is true", function() {
                collection.ignoreSelectedToken = true;
                var _req = collection.orderPayWithToken(),
                    token;

                req.resolve(_data);
                token = collection.at(0);

                commonExpects(_req);
                expect(collection.length).toBe(1);
                expect(token.get('id')).toBe(_data.token.id);
                expect(token.get('customer')).toBe(_data.token.customer);
            });

            it("`getSelectedPayment()` returns undefined", function() {
                token = undefined;
                var _req = collection.orderPayWithToken(),
                    _token;

                req.resolve(_data);
                _token = collection.at(0);

                commonExpects(_req);
                expect(collection.length).toBe(1);
                expect(_token.get('id')).toBe(_data.token.id);
                expect(_token.get('customer')).toBe(_data.token.customer);
            });

            it("`getSelectedPayment()` returns selected token", function() {
                collection.reset([token]);
                var _req = collection.orderPayWithToken();

                req.resolve(_data);

                commonExpects(_req);
                expect(collection.length).toBe(1);
                expect(token.get('id')).toBe(_data.token.id);
                expect(token.get('customer')).toBe(_data.token.customer);
            });

            it("`data` param isn't object", function() {
                spyOn(token, 'set');
                spyOn(collection, 'add');

                primitives.forEach(function(value) {
                    var _req = collection.orderPayWithToken();
                    req.resolve(value);

                    commonExpects(_req);
                    expect(token.set).not.toHaveBeenCalled();
                    expect(collection.add).not.toHaveBeenCalled();
                });
            });

            it("`data` param is object, `data.token` isn't object", function() {
                spyOn(token, 'set');
                spyOn(collection, 'add');

                primitives.forEach(function(value) {
                    var _req = collection.orderPayWithToken();
                    _data.token = value;
                    req.resolve(_data);

                    commonExpects(_req);
                    expect(token.set).not.toHaveBeenCalled();
                    expect(collection.add).not.toHaveBeenCalled();
                });
            });

            it("`data` param is object, `data.token` is object", function() {
                collection.reset([token]);
                var _req = collection.orderPayWithToken();

                req.resolve(_data);

                commonExpects(_req);
                expect(collection.length).toBe(1);
                expect(token.get('id')).toBe(_data.token.id);
                expect(token.get('customer')).toBe(_data.token.customer);
            });
        });
    });

    describe("App.Models.FreedomPayment", function() {
        var model;

        beforeEach(function() {
            model = new App.Models.FreedomPayment();
        });

        it("Environment", function() {
            expect(App.Models.FreedomPayment).toBeDefined();
        });

        it("Create model", function() {
            expect(model.type).toBe(data.ModelFreedomPayment.type);
        });
    });

    describe("App.Collections.FreedomPayments", function() {
        var collection;

        beforeEach(function() {
            collection = new App.Collections.FreedomPayments();
        });

        it("Environment", function() {
            expect(App.Collections.FreedomPayments).toBeDefined();
        });

        it("Create model", function() {
            expect(collection.paymentProcessor).toBe(data.CollectionFreedomPayments.paymentProcessor);
            expect(collection.type).toBe(data.CollectionFreedomPayments.type);
            expect(collection.model).toBe(App.Models.FreedomPayment);
        });

        describe("orderPayWithToken()", function() {
            var primitives = [-1, 0, 1, NaN, Infinity, 'asd', '', false, true, null, undefined],
                req;

            beforeEach(function() {
                req = Backbone.$.Deferred();
                collection.reset();

                spyOn(App.Collections.PaymentTokens.prototype, "orderPayWithToken").and.returnValue(req);
                spyOn(req, "done").and.callThrough();
            });

            function commonExpects(_req) {
                expect(_req).toBe(req);
                expect(req.done).toHaveBeenCalled();
                expect(App.Collections.PaymentTokens.prototype.orderPayWithToken).toHaveBeenCalled();
            }

            it("`data` param isn't object", function() {
                primitives.forEach(function(value) {
                    var _req = collection.orderPayWithToken();
                    req.resolve(value);

                    commonExpects(_req);
                    expect(collection.length).toBe(0);
                });
            });

            it("`data` param is object, `data.token` param isn't object", function() {
                primitives.forEach(function(value) {
                    var _req = collection.orderPayWithToken(),
                        data = {token: value};
                    req.resolve(data);

                    commonExpects(_req);
                    expect(collection.length).toBe(0);
                });
            });

            it("`data` param is object, `data.token` param is object", function() {
                var _req = collection.orderPayWithToken(),
                    data = {token: {id: 1}};
                req.resolve(data);

                commonExpects(_req);
                expect(collection.length).toBe(1);
            });
        });
    });

    describe("App.Models.BraintreePayment", function() {
        var model;

        beforeEach(function() {
            model = new App.Models.BraintreePayment();
        });

        it("Environment", function() {
            expect(App.Models.BraintreePayment).toBeDefined();
        });

        it("Create model", function() {
            expect(model.type).toBe(data.ModelBraintreePayment.type);
        });
    });

    describe("App.Collections.BraintreePayments", function() {
        var collection;

        beforeEach(function() {
            collection = new App.Collections.BraintreePayments();
        });

        it("Environment", function() {
            expect(App.Collections.BraintreePayments).toBeDefined();
        });

        it("Create model", function() {
            expect(collection.paymentProcessor).toBe(data.CollectionBraintreePayments.paymentProcessor);
            expect(collection.type).toBe(data.CollectionBraintreePayments.type);
            expect(collection.model).toBe(App.Models.BraintreePayment);
        });

        describe("orderPayWithToken()", function() {
            var primitives = [-1, 0, 1, NaN, Infinity, 'asd', '', false, true, null, undefined],
                req;

            beforeEach(function() {
                req = Backbone.$.Deferred();
                collection.reset();

                spyOn(App.Collections.PaymentTokens.prototype, "orderPayWithToken").and.returnValue(req);
                spyOn(req, "done").and.callThrough();
            });

            function commonExpects(_req) {
                expect(_req).toBe(req);
                expect(req.done).toHaveBeenCalled();
                expect(App.Collections.PaymentTokens.prototype.orderPayWithToken).toHaveBeenCalled();
            }

            it("`data` param isn't object", function() {
                primitives.forEach(function(value) {
                    var _req = collection.orderPayWithToken();
                    req.resolve(value);

                    commonExpects(_req);
                    expect(collection.length).toBe(0);
                });
            });

            it("`data` param is object, `data.token` param isn't object", function() {
                primitives.forEach(function(value) {
                    var _req = collection.orderPayWithToken(),
                        data = {token: value};
                    req.resolve(data);

                    commonExpects(_req);
                    expect(collection.length).toBe(0);
                });
            });

            it("`data` param is object, `data.token` param is object", function() {
                var _req = collection.orderPayWithToken(),
                    data = {token: {id: 1}};
                req.resolve(data);

                commonExpects(_req);
                expect(collection.length).toBe(1);
            });
        });
    });

    describe("App.Models.GlobalCollectPayment", function() {
        var model;

        beforeEach(function() {
            model = new App.Models.GlobalCollectPayment();
        });

        it("Environment", function() {
            expect(App.Models.GlobalCollectPayment).toBeDefined();
        });

        it("Create model", function() {
            expect(model.type).toBe(data.ModelGlobalCollectPayment.type);
        });
    });

    describe("App.Collections.GlobalCollectPayments", function() {
        var collection;

        beforeEach(function() {
            collection = new App.Collections.GlobalCollectPayments();
        });

        it("Environment", function() {
            expect(App.Collections.GlobalCollectPayments).toBeDefined();
        });

        it("Create model", function() {
            expect(collection.paymentProcessor).toBe(data.CollectionGlobalCollectPayments.paymentProcessor);
            expect(collection.type).toBe(data.CollectionGlobalCollectPayments.type);
            expect(collection.model).toBe(App.Models.GlobalCollectPayment);
        });

        describe("orderPayWithToken()", function() {
            var primitives = [-1, 0, 1, NaN, Infinity, 'asd', '', false, true, null, undefined],
                authHeader = {Authorization: 'Bearer ASDASDASASDSAD'},
                order, def, token;

            beforeEach(function() {
                order = {};
                def = Backbone.$.Deferred();
                token = new App.Models.GlobalCollectPayment({id: 2});
                collection.ignoreSelectedToken = false;
                collection.reset();

                spyOn(App.Collections.PaymentTokens.prototype, "orderPayWithToken").and.returnValue(def);
                spyOn(def, 'done').and.callThrough();
                spyOn(def, 'fail').and.callThrough();
                spyOn(def, 'always').and.callThrough();
                spyOn(collection, 'trigger');
                spyOn(collection, 'getSelectedPayment').and.callFake(function() {
                    return token;
                });
            });

            function commonExpects(req) {
                expect(req).toBeDefined();
                expect(App.Collections.PaymentTokens.prototype.orderPayWithToken).toHaveBeenCalled();
                expect(def.done).toHaveBeenCalled();
                expect(def.fail).toHaveBeenCalled();
            }

            it("`order.paymentInfo` isn't object", function() {
                primitives.forEach(function(value) {
                    order.paymentInfo = value;
                    var req = collection.orderPayWithToken(authHeader, order);
                    commonExpects(req);
                    expect(def.always).toHaveBeenCalled();
                    expect(token.get('cvv')).toBe(token.defaults.cvv);
                    expect(collection.trigger).not.toHaveBeenCalled();
                });
            });

            it("`order.paymentInfo` is object, `order.paymentInfo.cardInfo` isn't object", function() {
                order.paymentInfo = {};
                primitives.forEach(function(value) {
                    order.paymentInfo.cardInfo = value;
                    var req = collection.orderPayWithToken(authHeader, order);
                    commonExpects(req);
                    expect(def.always).toHaveBeenCalled();
                    expect(token.get('cvv')).toBe(token.defaults.cvv);
                    expect(collection.trigger).not.toHaveBeenCalled();
                });
            });

            it("`order.paymentInfo` is object, `order.paymentInfo.cardInfo` is object, no one token is selected", function() {
                order.paymentInfo = {
                    cardInfo: {}
                };
                token = undefined;
                var req = collection.orderPayWithToken(authHeader, order);
                commonExpects(req);
                expect(def.always).not.toHaveBeenCalled();
                expect(collection.trigger).not.toHaveBeenCalled();
            });

            it("`order.paymentInfo` is object, `order.paymentInfo.cardInfo` is object, `ignoreSelectedToken` is true", function() {
                order.paymentInfo = {
                    cardInfo: {}
                };
                collection.ignoreSelectedToken = true;
                var req = collection.orderPayWithToken(authHeader, order);
                commonExpects(req);
                expect(def.always).not.toHaveBeenCalled();
                expect(collection.trigger).not.toHaveBeenCalled();
            });

            it("`order.paymentInfo` is object, `order.paymentInfo.cardInfo` is object, any token is selected, `cvv` is filled", function() {
                var cvv = 123,
                    req;

                order.paymentInfo = {
                    cardInfo: {address: {}}
                };

                token.set('cvv', cvv);
                req = collection.orderPayWithToken(authHeader, order);

                commonExpects(req);
                expect(def.always).toHaveBeenCalled();
                expect(order.paymentInfo.cardInfo.address).toBeUndefined();
                expect(order.paymentInfo.cardInfo.cvv).toBe(cvv);
                expect(collection.trigger).not.toHaveBeenCalled();
            });

            it("`order.paymentInfo` is object, `order.paymentInfo.cardInfo` is object, any token is selected, `cvv` isn't filled", function() {
                order.paymentInfo = {
                    cardInfo: {address: {}}
                };

                var req = collection.orderPayWithToken(authHeader, order);

                expect(req).toBeDefined();
                expect(App.Collections.PaymentTokens.prototype.orderPayWithToken).not.toHaveBeenCalled();
                expect(def.done).not.toHaveBeenCalled();
                expect(def.fail).not.toHaveBeenCalled();
                expect(def.always).not.toHaveBeenCalled();
                expect(order.paymentInfo.cardInfo.address).toBeUndefined();
                expect(order.paymentInfo.cardInfo.cvv).toBeUndefined();
                expect(collection.trigger).toHaveBeenCalledWith('onCVVRequired', {
                    callback: jasmine.any(Function),
                    payment: token,
                    def: req
                });
            });

            it("`data` param isn't object", function() {
                primitives.forEach(function(value) {
                    var data = value,
                        req = collection.orderPayWithToken(authHeader, order);

                    def.resolve(data);
                    commonExpects(req);
                    expect(collection.length).toBe(0);
                });
            });

            it("`data` param is object, `data.token` isn't object", function() {
                data = {};
                primitives.forEach(function(value) {
                    var req = collection.orderPayWithToken(authHeader, order);
                    data.token = value;

                    def.resolve(data);
                    commonExpects(req);
                    expect(collection.length).toBe(0);
                });
            });

            it("`data` param is object, `data.token` is object", function() {
                data = {
                    token: {
                        id: 1,
                        customer: 21
                    }
                };

                var req = collection.orderPayWithToken(authHeader, order),
                    token;

                def.resolve(data);
                token = collection.at(0);

                commonExpects(req);
                expect(collection.length).toBe(1);
                expect(token.get('id')).toBe(data.token.id);
                expect(token.get('customer')).toBe(data.token.customer);
            });
        });
    });
});