define(['js/utest/data/Myorder', 'js/utest/data/Products', 'myorder', 'products'], function(data, productsData) {

    describe("App.Models.Myorder", function() {
        var model, change, special;

        beforeEach(function() {
            model = new App.Models.Myorder();
        });

        it('Environment', function() {
            expect(App.Models.Myorder).toBeDefined();
        });

        it('check initial listener', function() {
            change = spyOn(App.Models.Myorder.prototype, 'change'),
            model = new App.Models.Myorder();
            model.set('id_product', 'test');
            expect(change).toHaveBeenCalled();
        });

        it('get_product()', function() {
            var obj = {
                get_product: function() {}
            };

            model.set('product', obj, {silent: true});
            spyOn(obj, 'get_product').and.returnValue(5);
            expect(model.get_product()).toBe(5);
            expect(obj.get_product).toHaveBeenCalled();
        });

        describe('get_modifiers()', function() {
            var obj = {
                    product: {
                        get_modifiers: function() {}
                    },
                    modifiers: {}
                },
                mod;

            beforeEach(function() {
                spyOn(obj.product, 'get_modifiers').and.callFake(function() {
                    return mod;
                });
                model.set(obj, {silent: true});
            });

            it('not parent product', function() {
                mod = false;
                expect(model.get_modifiers()).toBe(obj.modifiers);
            });

            it('parent product', function() {
                mod = 7;
                expect(model.get_modifiers()).toBe(7);
            });
        });

        describe('get_initial_price()', function() {
            var obj = {
                    getSizeModel: function() {}
                },
                product = {
                    get: function() {}
                },
                size;

            beforeEach(function() {
                spyOn(model, 'get_modifiers').and.returnValue(obj);
                spyOn(model, 'get_product').and.returnValue(product);
                spyOn(obj, 'getSizeModel').and.callFake(function() {
                    return size;
                });
                spyOn(product, 'get').and.callFake(function() {
                    return '!' + arguments[0];
                });
            });

            it('without size modifier', function() {
                size = false;
                expect(model.get_initial_price()).toBe('!price');
            });

            it('with size modifier', function() {
                size = {
                    get: function() { return 'size'; }
                };
                expect(model.get_initial_price()).toBe('size');
            });
        });

        describe('change_special()', function() {
            var text, arg,
                special_requests_online = false,
                modifierBlocks = new App.Collections.ModifierBlocks();
                modifierBlocks.get_special_text = function() {
                        return text;
                    }

            beforeEach(function() {
                spyOn(model, 'get_modifiers').and.returnValue(modifierBlocks);
                spyOn(model.get_modifiers(), 'uncheck_special');
                spyOn(model, 'set').and.callFake(function() {
                    arg = arguments;
                });

                spyOn(App.Data.settings, 'get').and.returnValue({
                    special_requests_online: special_requests_online
                });
            });

            it('not selected special modifiers', function() {
                text = '';
                model.change_special();
                expect(model.set).not.toHaveBeenCalled();
                special_requests_online = true; // for next test
            });

            it('some special modifiers selected', function() {
                text = ' test,test ';
                model.change_special();
                expect(model.set).toHaveBeenCalledWith({special: 'test,test'});
                expect(model.get_modifiers().uncheck_special).toHaveBeenCalled();
            });

            it('some special modifiers selected, opts.ingore_uncheck is true', function() {
                text = ' test,test ';
                model.change_special({ignore_uncheck: true});
                expect(model.set).toHaveBeenCalledWith({special: 'test,test'});
                expect(model.get_modifiers().uncheck_special).not.toHaveBeenCalled();
            });
        });

        describe('change()', function() {
            var obj, product;

            beforeEach(function() {
                obj = undefined;
                product = new Backbone.Model();
                spyOn(model, 'listenTo').and.callThrough();
                spyOn(model, 'get_modifiers').and.callFake(function() {
                    return obj;
                });
                spyOn(model, 'change_special');
            });

            it('product and modifiers not preset', function() {
                model.change();
                expect(model.product_listener).toBe(false);
                expect(model.modifier_listener).toBe(false);
            });

            it('product is present, modifiers - not', function() {
                model.set({product: product}, {silent: true});
                model.change();
                expect(model.product_listener).toBe(true);
                expect(model.modifier_listener).toBe(false);
            });

            it('product and modifiers is present. Not special', function() {
                model.set({product: product}, {silent: true});
                obj = {};
                model.change();
                expect(model.product_listener).toBe(true);
                expect(model.modifier_listener).toBe(true);
                expect(model.change_special).toHaveBeenCalled();
            });

            it('product and modifiers is present. With special', function() {
                model.set({product: product}, {silent: true});
                model.set({special: 'test'}, {silent: true});
                obj = {};
                model.change();
                expect(model.change_special).not.toHaveBeenCalled();
                expect(model.listenTo).toHaveBeenCalled();
            });

            it('double change for presented product and modifiers', function() {
                model.set({product: product}, {silent: true});
                obj = {};
                model.change();
                expect(model.product_listener).toBe(true);
                expect(model.modifier_listener).toBe(true);
                var count = model.listenTo.callCount;
                model.change();
                expect(model.listenTo.callCount).toBe(count);
            });

            it('product listeners', function() {
                spyOn(model, 'get_modelsum');
                spyOn(model, 'get_initial_price');
                product.get_product = function() {
                    return {
                        get: function() {}
                    }
                };

                model.set({product: product}, {silent: true});
                model.set({special: 'test'}, {silent: true});
                obj = null;
                model.change();

                model.get('product').trigger('change:attribute_1_selected');
                expect(model.modifier_listener).toBe(false);
            });

            it('modifiers listeners', function() {
                spyOn(model, 'update_prices');
                spyOn(model, 'update_mdf_sum');

                model.set({product: product}, {silent: true});
                model.set({special: 'test'}, {silent: true});
                obj = new Backbone.Model();
                model.change();

                model.get_modifiers().trigger('modifiers_special');
                expect(model.change_special).toHaveBeenCalled();

                model.get_modifiers().trigger('modifiers_size', 123);
                expect(model.get('initial_price')).toBe(123);

                model.get_modifiers().trigger('modifiers_changed');
                expect(model.update_prices).toHaveBeenCalled();
                expect(model.update_mdf_sum).toHaveBeenCalled();
            });
        });

        describe('update_mdf_sum(multiplier)', function() {
            var mdfData = require('js/utest/data/Modifiers'),
                mdfs = deepClone(mdfData.exBlocks2);
            mdfs.map(function(elem) {
               elem.modifiers =  new App.Collections.Modifiers(elem.modifiers);
               return elem;
            });
            var mdfGroups = new App.Collections.ModifierBlocks(mdfs);

            beforeEach(function() {
                spyOn(model, 'get_modifiers').and.returnValue(mdfGroups);
                mdfGroups.each(function(mdfGroup) {
                    var mdfs = mdfGroup.get('modifiers');
                    mdfs && mdfs.each(function(mdf) {
                        spyOn(mdf, 'updateSum');
                    });
                });
                model.set('quantity', 3, {silent: true});
            });

            it('called without arguments', function() {
                model.update_mdf_sum(2);

                mdfGroups.each(function(mdfGroup) {
                    var mdfs = mdfGroup.get('modifiers');
                    mdfs && mdfs.each(function(mdf) {
                        expect(mdf.updateSum).toHaveBeenCalledWith(3 * 2);
                    });
                });
            });

            it('called with `multiplier`', function() {
                model.update_mdf_sum();

                mdfGroups.each(function(mdfGroup) {
                    var mdfs = mdfGroup.get('modifiers');
                    mdfs && mdfs.each(function(mdf) {
                        expect(mdf.updateSum).toHaveBeenCalledWith(3);
                    });
                });
            });
        });

        it('update_prices()', function() {
            var prod = new Backbone.Model({max_price: 0}),
                modif = new App.Collections.ModifierBlocks();
                modif.get_special_text = function() {};

            spyOn(model, 'get_product').and.returnValue(prod);
            spyOn(model, 'get_modifiers').and.returnValue(modif);
            spyOn(modif, 'update_prices');

            model.update_prices();
            expect(modif.update_prices).not.toHaveBeenCalled();

            prod.set('price', 1);
            prod.set('max_price', 10);
            model.update_prices();
            expect(modif.update_prices).toHaveBeenCalledWith(9);
        });

        describe('add_empty()', function() {
            var id_category = 10,
                id_product = 5,
                dfd = $.Deferred(),
                obj = {
                    get_child_products: function() {},
                    get_product: function() {}
                };

            dfd.resolve();

            beforeEach(function() {
                App.Data.products[id_category] = new App.Models.Product({
                    init: function() {},
                    get_product: function() {}
                });
                App.Data.modifiers[id_product] = new Backbone.Model();

                spyOn(App.Data.products[id_category], 'get').and.returnValue(obj);
                spyOn(App.Data.products[id_category], 'get_product').and.returnValue(obj);
                spyOn(App.Collections.ModifierBlocks, 'init_quick_modifiers').and.returnValue(dfd);
                spyOn(App.Collections.Products, 'init').and.returnValue(dfd);
                spyOn(obj, 'get_child_products').and.returnValue(dfd);
                spyOn(obj, 'get_product');
                spyOn($, 'when').and.returnValue(dfd);
                spyOn(model, 'get_modelsum').and.returnValue(1);
                spyOn(model, 'get_initial_price').and.returnValue(2);
                spyOn(model, 'set');
                spyOn(model, 'update_prices');
                spyOn(model, 'get').and.returnValue(obj);
            });

            it('test function calls', function() {
                spyOn(model, 'initStanfordReloadItem');
                model.add_empty(id_product, id_category);
                expect(App.Collections.Products.init).toHaveBeenCalled(); // init products
                expect(App.Collections.ModifierBlocks.init_quick_modifiers).toHaveBeenCalled(); // init modifiers
                expect(App.Data.products[id_category].get_product).toHaveBeenCalledWith(id_product); // get nessesarry product
                expect(obj.get_child_products).toHaveBeenCalled();
                expect(model.set.calls.argsFor(0)[0]).toEqual({
                    product: obj,
                    id_product : id_product,
                    modifiers: App.Data.modifiers[id_product]
                });
                expect(model.set.calls.argsFor(1)[0]).toEqual({
                    sum: 1,
                    initial_price: 2
                });
                expect(model.update_prices).toHaveBeenCalled();
                expect(model.initStanfordReloadItem).toHaveBeenCalled();
            });
        });

        describe('addServiceFee()', function() {
            var data;

            beforeEach(function() {
                data = {
                    product : {
                        id: null,
                        name: 'SF Web',
                        get: function() {},
                        set: function() {}
                    },
                    modifiers : {},
                    id_product: 1,
                    quantity: 'quan',
                    weight: 1,
                    selected: false,
                    is_child_product: false,
                    isServiceFee: true,
                    sum: 10
                };
                spyOn(data.product, 'get').and.callFake(function() {
                    return data.product;
                });
            });

            it('add Service Fee item', function() {
                model = new App.Collections.Myorders();
                expect(model.models.length).toBe(0);
                model.addServiceFee(data);
                expect(model.models.length).toBe(1);
                expect(model.models[0].get('product').get('name')).toBe('SF Web');
                expect(model.models[0].get('product').get('price')).toBe(10);
                expect(model.models[0].get('initial_price')).toBe(10);
                expect(model.models[0].get('sum')).toBe(10);
            });
        });

        describe('addJSON()', function() {
            var data,
                gift,
                mod,
                prod,
                setSpy;

            beforeEach(function() {
                gift = undefined;
                data = {
                    product : {
                        id: 2,
                        get: function() {},
                        set: function() {}
                    },
                    modifiers : {},
                    id_product: 1,
                    quantity: 'quan',
                    weight: 1,
                    selected: false,
                    is_child_product: false,
                    upcharge_name: 'Upcharge',
                    combo_name: 'Combo',
                    upcharge_price: 100
                };
                mod = spyOn(App.Collections.ModifierBlocks.prototype, 'addJSON').and.returnValue(data.modifiers)
                prod = spyOn(App.Models.Product.prototype, 'addJSON').and.returnValue(data.product)
                setSpy = spyOn(model, 'set');
                spyOn(model, 'get').and.returnValue(data.product);
                spyOn(data.product, 'get').and.callFake(function() {
                    return gift;
                });
                spyOn(data.product, 'set');
            });

            it('add without gift card, id_product is present', function() {
                model.addJSON(data);
                expect(mod).toHaveBeenCalledWith(data.modifiers);
                expect(prod).toHaveBeenCalledWith(data.product);
                expect(setSpy.calls.mostRecent().args[0].discount instanceof App.Models.DiscountItem).toBe(true);
                delete setSpy.calls.mostRecent().args[0].discount;
                expect(model.set).toHaveBeenCalledWith(data);
                expect(data.product.set).not.toHaveBeenCalled();
            });

            it('gift card in product, gift_card_number in data', function() {
                gift = 1;
                data.gift_card_number = 1;
                model.addJSON(data);
                expect(data.product.set).not.toHaveBeenCalled();
            });

            it('not gift card in product, gift_card_number in data', function() {
                data.gift_card_number = 1;
                model.addJSON(data);
                expect(data.product.set).toHaveBeenCalled();
            });
        });

        describe('get_modelsum()', function() {
            var modifierList = {
                get_sum: function() {},
                get_modifierList: function() {return [];}
            },
            modifier = {
                get: function() {}
            },
            product = {
                get: function() {}
            };

            it('`modifiers` doesn\'t exist', function() {
                spyOn(model, 'get_initial_price').and.returnValue(10);
                spyOn(model, 'get_modifiers').and.returnValue(null);
                spyOn(model, 'get_product');

                model.set({quantity: 4}, {silent: true});
                expect(model.get_modelsum()).toBe(40);
            });

            it('`modifiers` exists, has no selected modifiers', function() {
                spyOn(model, 'get_initial_price').and.returnValue(10);
                spyOn(model, 'get_modifiers').and.returnValue(modifierList);
                spyOn(model, 'get_product');
                spyOn(modifierList, 'get_sum').and.returnValue(0);
                spyOn(modifierList, 'get_modifierList').and.returnValue([]);

                model.set({quantity: 4}, {silent: true});
                expect(model.get_modelsum()).toBe(40);
            });

            it('`modifiers` exists, has selected modifier, `max_price` doesn\'t exist', function() {
                spyOn(model, 'get_initial_price').and.returnValue(10);
                spyOn(model, 'get_modifiers').and.returnValue(modifierList);
                spyOn(model, 'get_product');
                spyOn(modifierList, 'get_sum').and.returnValue(15);
                spyOn(modifierList, 'get_modifierList').and.returnValue([modifier]);
                spyOn(modifier, 'get').and.returnValue(true);

                model.set({quantity: 4}, {silent: true});
                expect(model.get_modelsum()).toBe(100);
            });

            it('`modifiers` exists, has selected modifier, `max_price` exists', function() {
                spyOn(model, 'get_initial_price').and.returnValue(10);
                spyOn(model, 'get_modifiers').and.returnValue(modifierList);
                spyOn(model, 'get_product').and.returnValue(product);
                spyOn(modifierList, 'get_sum').and.returnValue(15);
                spyOn(modifierList, 'get_modifierList').and.returnValue([modifier]);
                spyOn(modifier, 'get').and.returnValue(true);
                spyOn(product, 'get').and.returnValue(20);

                model.set({quantity: 4}, {silent: true});
                expect(model.get_modelsum()).toBe(80);
            });

            it('`modifiers` doesn\'t exist, `sold_by_weight` is true, `weight` is set', function() {
                spyOn(model, 'get_initial_price').and.returnValue(10);
                spyOn(model, 'get_modifiers').and.returnValue(null);
                spyOn(model, 'get_product').and.returnValue(product);
                spyOn(product, 'get').and.returnValue(true);

                model.set({weight: 2, product: product}, {silent: true});
                model.set({quantity: 4}, {silent: true});
                expect(model.get_modelsum()).toBe(80);
            });

        });

        describe('get_sum_of_modifiers()', function() {
            it('modifiers don\'t exist', function() {
                spyOn(model, 'get_modifiers');
                expect(model.get_sum_of_modifiers()).toBe(0);
            });

            it('modifiers exist', function() {
                var mdfs = {
                    get_sum: function() {return 10;}
                };
                spyOn(model, 'get_modifiers').and.returnValue(mdfs);
                expect(model.get_sum_of_modifiers()).toBe(10);
            });
        });

        describe('get_special()', function() {
            var obj, settingsSpy, getMdfSpy, special_requests_online = false;

            beforeEach(function() {
                obj = {
                    get_special_text: function() {
                        return 'test1,test2';
                    }
                };

                getMdfSpy = spyOn(model, 'get_modifiers');
                spyOn(App.Data.settings, 'get').and.returnValue({
                    special_requests_online: special_requests_online
                });
            });

            it('special requests are disabled', function() {
                expect(model.get_special()).toBe('');
                expect(model.get_modifiers).not.toHaveBeenCalled();
                special_requests_online = true; // for next tests
            });

            it('special requests are enabled, special` doesn\'t exist, modifiers don\'t exist', function() {
                model.set({special: ''}, {silent: true});
                spyOn(model, 'get_initial_price').and.returnValue(10);
                expect(model.get_special()).toBe('');
                expect(model.get_modifiers).toHaveBeenCalled();
            });

            it('special requests are enabled, special` doesn\'t exist, modifiers special text exist', function() {
                model.set({special: ''}, {silent: true});
                spyOn(model, 'get_initial_price').and.returnValue(10);
                getMdfSpy.and.returnValue(obj);
                expect(model.get_special()).toBe('test1,test2');
            });

            it('`special` exists', function() {
                model.set({special: 'test3'}, {silent: true});
                expect(model.get_special()).toBe('test3');
            });
        });


        it('clone()', function() {
            spyOn(App.Models.Myorder.prototype, 'trigger');
            model.set({id_product: 12}, {silent: true});
            var clone = model.clone();
            clone.get('discount').cid = model.get('discount').cid;
            expect(clone.toJSONDeep()).toEqual(model.toJSONDeep());
            expect(clone.cid).not.toBe(model.cid);
            expect(clone.__proto__).toBe(model.__proto__);
            expect(model.trigger).toHaveBeenCalled()
        });

        it('update()', function() {
            spyOn(App.Models.Myorder.prototype, 'trigger');
            model.set('id_product', 12);
            var clone = model.clone();
            model.set('id_product', 13);
            expect(model.get('id_product')).toEqual(13);
            expect(model.update(clone).get('id_product')).toEqual(12);
        });

        describe('check_order()', function() {
            var data = {
                    product : {
                        id: 2,
                        sold_by_weight: false
                    },
                    modifiers : [],
                    id_product: 1,
                    quantity: 1,
                    weight: 1
                },
                getSizeModel,
                check_selected,
                checkForced,
                timetable,
                modifiers,
                result;

            var model = new App.Models.Myorder();
                model.addJSON(data);

            beforeEach(function() {
                this.timetables = App.Data.timetables;
                App.Data.timetables = {
                    check_order_enable: function() {},
                    base: function() {}
                };
                App.Data.myorder.checkout = {
                    get: function() {}
                };
                check_selected = true;
                getSizeModel = true;
                checkForced = true;
                timetable = true;
                modifiers = model.get_modifiers();
                spyOn(model.get_product(), 'check_selected').and.callFake(function() {
                    return check_selected;
                });
                spyOn(modifiers, 'getSizeModel').and.callFake(function() {
                    return getSizeModel;
                });
                spyOn(modifiers, 'checkForced').and.callFake(function() {
                    return checkForced;
                });
                spyOn(App.Data.timetables, 'check_order_enable').and.callFake(function() {
                    return timetable;
                });
                spyOn(App.Data.myorder.checkout, 'get').and.returnValue('DINING_OPTION_TOGO');
            });

            afterEach(function() {
                App.Data.timetables = this.timetables;
            });

            it('pass check', function() {
                expect(model.check_order().status).toBe('OK');
            });

            it('`sold_by_weight` is true, `weight` is not set', function() {
                spyOn(model.get_product(), 'get_product').and.returnValue({
                    get: function() {return true;}
                });

                model.set('weight', 0, {silent: true});
                var result = model.check_order();
                expect(result.status).toBe('ERROR');
                expect(result.errorMsg.indexOf('weight')).not.toBe(-1);
            });

            it('timetable close', function() {
                timetable = false;
                expect(model.check_order().status).toBe('ERROR');
            });

            it('product check_selected fail', function() {
                check_selected = false;
                expect(model.check_order().status).toBe('ERROR');
            });

            it('size is undefined. forced empty', function() {
                getSizeModel = undefined;
                expect(model.check_order().status).toBe('OK');
            });

            it('size is undefined. forced not empty', function() {
                getSizeModel = undefined;
                checkForced = [new Backbone.Model({name: 'test1'})];
                result = model.check_order();
                expect(result.status).toBe('ERROR');
                expect(result.errorMsg.indexOf('at least')).not.toBe(-1);
            });

            it('size is undefined. exceeded is array', function() {
                getSizeModel = undefined;
                spyOn(modifiers, 'checkAmount').and.returnValue([]);
                result = model.check_order();
                expect(result.status).toBe('ERROR');
                expect(result.errorMsg.indexOf('no more')).not.toBe(-1);
            });

            it('size is null', function() {
                getSizeModel = null;
                expect(model.check_order().status).toBe('ERROR');
            });
        });

        it('get_attribute_type()', function() {
            var product = {
                get: function() {}
            };
            spyOn(model, 'get').and.returnValue(product);
            spyOn(product, 'get').and.returnValue(5);
            expect(model.get_attribute_type()).toBe(5);
        });

        it('get_attributes_list()', function() {
            var product = {
                get_attributes_list: function() {}
            };
            spyOn(model, 'get').and.returnValue(product);
            spyOn(product, 'get_attributes_list').and.returnValue(5);
            expect(model.get_attributes_list()).toBe(5);
        });

        it('get_attributes()', function() {
            model.set('product', null, {silent: true});
            expect(model.get_attributes()).toBeUndefined();

            var product = {
                get_attributes: function() {
                    return 'attributes';
                }
            }
            model.set('product', product, {silent: true});
            expect(model.get_attributes()).toBe('attributes');
        });

        it('is_gift()', function() {
            var product = new Backbone.Model({is_gift: false});
            spyOn(model, 'get_product').and.returnValue(product);
            expect(model.is_gift()).toBe(false);

            product.set('is_gift', true);
            expect(model.is_gift()).toBe(true);
        });

        describe('item_submit()', function() {
            var modifiers = {
                    modifiers_submit: function() {
                        return 'modifiers block';
                    }
                },
                giftCardNumber = false,
                soldByWeight = false,
                productSets = undefined,
                isCombo = undefined,
                product = {
                    toJSON: function() {
                        return {
                            price: 'price',
                            id: 'id',
                            name: 'name',
                            tax: 'tax',
                            is_cold: 'is_cold',
                            gift_card_number: giftCardNumber,
                            sold_by_weight: soldByWeight,
                            is_combo: isCombo,
                            product_sets: productSets
                        };
                    }
                },
                product2 = {
                    toJSON: function() {
                        return {
                            price: 'price',
                            id: 'id',
                            name: 'name',
                            tax: 'tax',
                            is_cold: 'is_cold',
                            gift_card_number: giftCardNumber,
                            sold_by_weight: soldByWeight
                        };
                    }
                },
                result;

            beforeEach(function() {
                model.set({
                    sum: 100,
                    quantity: 10,
                    initial_price: 4,
                    product_sub_id: 123
                }, {silent: true});

                spyOn(model, 'get_special').and.returnValue('special');
                spyOn(model, 'get_modifiers').and.returnValue(modifiers);
                spyOn(model, 'get_product').and.returnValue(product);
            });

            it('general behaviour', function() {
                expect(model.item_submit()).toEqual({
                    modifieritems: 'modifiers block',
                    special_request: 'special',
                    price: 4,
                    product: 'id',
                    product_name_override: 'name',
                    quantity: 10,
                    product_sub_id: 123,
                    is_combo: isCombo,
                    has_upsell: undefined
                });
            });

            it('product.sold_by_weight', function() {
                var prevSettings = App.Data.settings.get('settings_system');
                App.Data.settings.get('settings_system').currency_symbol = '$';
                App.Data.settings.get("settings_system").scales.default_weighing_unit = 'Lb';
                App.Data.settings.get("settings_system").scales.label_for_manual_weights = 'MAN';
                App.Data.settings.get("settings_system").scales.number_of_digits_to_right_of_decimal = 2;

                soldByWeight = true;
                model.set('weight', 5, {silent: true});
                result = model.item_submit();

                expect(result.weight).toBe(5);
                expect(result.product_name_override).toBe('name\n 5.00 MAN @ $4.00/Lb');

                App.Data.settings.set('settings_system', prevSettings);
            });

            it('product.gift_card_number', function() {
                giftCardNumber = 1234;
                expect(model.item_submit().gift_card_number).toBe(giftCardNumber);
            });

            it('planId && stanford_card_number', function() {
                model.set({
                    planId: 1,
                    stanford_card_number: 1234
                }, {silent: true});
                result = model.item_submit();

                expect(result.planId).toBe(1);
                expect(result.stanford_card_number).toBe(1234);
            });

            it('product.is_combo', function() {
                var model2 = new App.Models.Myorder();
                model2.set({
                    sum: 100,
                    quantity: 10,
                    initial_price: 4,
                    product_sub_id: 123
                }, {silent: true});
                spyOn(model2, 'get_special').and.returnValue('special');
                spyOn(model2, 'get_modifiers').and.returnValue(modifiers);
                spyOn(model2, 'get_product').and.returnValue(product2);

                isCombo = true;
                productSets = new App.Collections.ProductSets([model2]);

                expect(model.item_submit().products_sets).toEqual([model2.item_submit()]);
            });

        });

        describe('overrideProductName(product)', function() {
            var product;

            beforeEach(function() {
                product = {
                    id: null,
                    name: 'product name'
                };
            });

            it('product.id is null', function() {
                expect(model.overrideProductName(product)).toBe('product name');

                product.name = MSG.AUTOAPPLY_FEE_ITEM;
                expect(model.overrideProductName(product)).toBe('AutoApply Fee');
            });

            it('product.id is not null', function() {
                product.id = 1;
                expect(model.overrideProductName(product)).toBe('product name');
            });
        });

        it('removeFreeModifiers()', function() {
            var mdfs = {
                removeFreeModifiers: function() {}
            };
            spyOn(model, 'get_modifiers').and.returnValue(mdfs);
            spyOn(mdfs, 'removeFreeModifiers');
            model.removeFreeModifiers();

            expect(mdfs.removeFreeModifiers).toHaveBeenCalled();
        });

        it('isComboProduct()', function() {
            var product = new Backbone.Model();
            model.set('product', product, {silent: true});

            expect(model.isComboProduct()).toBe(false);

            product.set('is_combo', true);
            expect(model.isComboProduct()).toBe(true);
        });

        it('isUpsellProduct()', function() {
            var product = new Backbone.Model();
            model.set('product', product, {silent: true});

            expect(model.isUpsellProduct()).toBe(false);

            product.set('has_upsell', true);
            expect(model.isUpsellProduct()).toBe(true);
        });

        it('isComboBased()', function() {
            var spyIsComboBased = jasmine.createSpy(),
                product = {isComboBased: spyIsComboBased};

            model.set('product', product, {silent: true});

            spyIsComboBased.and.returnValue(false);
            expect(model.isComboBased()).toBe(false);

            spyIsComboBased.and.returnValue(true);
            expect(model.isComboBased()).toBe(true);
        });

        it('isChildProduct()', function() {
            expect(model.isChildProduct()).toBeFalsy();

            model.set('is_child_product', true, {silent: true});
            expect(model.isChildProduct()).toBe(true);
        });

        it('hasPointValue()', function() {
            expect(model.hasPointValue()).toBe(false);

            var product = new Backbone.Model();
            spyOn(model, 'get_product').and.returnValue(product);
            spyOn(model, 'isRealProduct').and.returnValue(true);
            spyOn(model.get_product(), 'get').and.returnValue(123);
            expect(model.hasPointValue()).toBe(true);
        });

        it('get_product_price()', function() {
            model.set('initial_price', 10, {silent: true});
            expect(model.get_product_price()).toBe(10);
        });

        describe('initStanfordReloadItem()', function() {
            var product = new Backbone.Model({
                get_modifiers: function() {}
            });

            beforeEach(function() {
                App.Data.is_stanford_mode = true;
                model.set('product', {
                    get_modifiers: function() {}
                }, {silent: true});

                spyOn(model, 'get_product').and.returnValue(product);
                spyOn(model, 'set').and.callThrough();
                spyOn(product, 'set').and.callThrough();
            });

            afterEach(function() {
                App.Data.is_stanford_mode = false;
            });

            it('App.Data.is_stanford_mode is false', function() {
                App.Data.is_stanford_mode = false;
                model.initStanfordReloadItem();
                expect(product.set).not.toHaveBeenCalled();
            });

            it('App.Data.is_stanford_mode is true, product is not gift', function() {
                model.initStanfordReloadItem();
                expect(product.set).not.toHaveBeenCalled();
            });

            it('App.Data.is_stanford_mode is true, product is gift', function() {
                product.set({
                    is_gift: true,
                    price: '10'
                }, {silent: true});

                model.initStanfordReloadItem();

                expect(model.set).toHaveBeenCalled();
                expect(product.set).toHaveBeenCalled();
                expect(product.get('price')).toBe(10);
            });

            it('StanfordCard listeners', function() {
                var stanfordCard = new App.Models.StanfordCard({
                    number: 123,
                    planId: 5
                });

                model.initStanfordReloadItem();

                spyOn(App.Data.errors, 'alert');
                model.get('stanfordCard').trigger('onStanfordCardError', 'Stanford Card Error');
                expect(App.Data.errors.alert).toHaveBeenCalledWith('Stanford Card Error');

                model.get('stanfordCard').set('number', '456');
                expect(model.get('stanford_card_number')).toBe('456');

                model.set('stanford_card_number', '789');
                expect(model.get('stanfordCard').get('number')).toBe('789');

                model.get('stanfordCard').set('planId', '6');
                expect(model.get('planId')).toBe('6');

                model.set('planId', '7');
                expect(model.get('stanfordCard').get('planId')).toBe('7');
            });
        });

    });



//////////////////////////////////////////////////////////////////////////////


    describe('App.Collections.Myorders', function() {
        var model;

        beforeEach(function() {
            model = new App.Collections.Myorders();
        });

        it('Environment', function() {
            expect(App.Collections.Myorders).toBeDefined();
        });

        it('initialize()', function() {
            expect(model.total.__proto__).toBe(App.Models.Total.prototype);
            expect(model.checkout.__proto__).toBe(App.Models.Checkout.prototype);
        });

        describe('change_dining_option()', function() {
            var delivery, bagcharge, checkout;

            beforeEach(function() {
                delivery = 0;
                bagcharge = 0;
                spyOn(model, 'add');
                spyOn(model, 'remove');
                spyOn(model.total, 'get_delivery_charge').and.callFake(function() {
                    return delivery;
                });
                checkout = new App.Models.Checkout();
                spyOn(model, 'update_cart_totals');
            });

            it('not shipping', function() {
                model.total.set('shipping', true);
                model.change_dining_option(checkout, 'DINING_OPTION_TOGO');
                expect(model.total.get('shipping')).toBeNull();
                expect(model.update_cart_totals).toHaveBeenCalledWith(undefined);
            });

            it('shipping', function() {
                App.Data.customer = {
                    isDefaultShippingSelected: function() {return true;}
                };

                model.change_dining_option(checkout, 'DINING_OPTION_SHIPPING');
                expect(model.update_cart_totals).toHaveBeenCalledWith({update_shipping_options: true});
            });
        });

        describe('check_maintenance()', function() {
            var result, spyAlert;

            beforeEach(function() {
                this.settings = App.Settings;
                App.Settings.email = '';
                App.Settings.phone = '';
                result = false;
                spyOn(window, 'getData').and.callFake(function(name) {
                    if (name == 'orders') return {};
                });
                spyOn(App.Data.settings, "loadSettings");
                spyAlert = spyOn(App.Data.errors, "alert");
            });
            afterEach(function() {
                App.settings = this.settings;
            });

            it('email and phone are not set', function() {
                spyAlert.and.callFake(function(mess) {
                    result = mess.indexOf('error') > -1;
                });
                model.check_maintenance();
                expect(result).toBe(true);
            });

            it('email or/and phone are set', function() {
                App.Settings.email = 'email';
                spyAlert.and.callFake(function(mess) {
                    result = mess.indexOf('please contact:') > -1;
                });
                model.check_maintenance();
                expect(result).toBe(true);

                App.Settings.phone = 'phone';
                model.check_maintenance();
                expect(result).toBe(true);
            });
        });

        it('get_remaining_delivery_amount()', function() {
            var dining_option = 'DINING_OPTION_TOGO';
            spyOn(model.checkout, 'get').and.callFake(function() {
                return dining_option;
            });
            spyOn(model.total, 'get_remaining_delivery_amount').and.returnValue(10);

            expect(model.get_remaining_delivery_amount()).toBeNull();

            dining_option = 'DINING_OPTION_DELIVERY';
            expect(model.get_remaining_delivery_amount()).toBe(10);
        });

        it('get_delivery_charge()', function() {
            var dining_option = 'DINING_OPTION_TOGO';
            spyOn(model.checkout, 'get').and.callFake(function() {
                return dining_option;
            });
            spyOn(model.total, 'get_delivery_charge').and.returnValue(10);

            expect(model.get_delivery_charge()).toBeNull();

            dining_option = 'DINING_OPTION_DELIVERY';
            expect(model.get_delivery_charge()).toBe(10);
        });

        it('get_only_product_quantity()', function() {
            spyOn(App.Collections.Myorders.prototype, 'listenTo');
            model = new App.Collections.Myorders([
                {id_product: 1},
                {id_product: 2},
                {id_product: 3}
            ]);
            var obj1 = {id: 1}, obj2 = {id: 2};
            model.deliveryItem = obj1;
            model.bagChargeItem = obj2;

            expect(model.get_only_product_quantity()).toBe(3);

            model.add(obj1);
            expect(model.get_only_product_quantity()).toBe(3);

            model.add(obj2);
            expect(model.get_only_product_quantity()).toBe(3);
        });

        it('get_service_fee_charge()', function() {
            model = new App.Collections.Myorders([
                {id_product: 1, sum: 1},
                {id_product: null, sum: 1},
                {id_product: null, sum: 1}
            ]);
            expect(model.get_service_fee_charge()).toBe(2);
        });

        describe('addJSON()', function() {

            beforeEach(function() {
                spyOn(App.Models.Myorder.prototype, 'addJSON');
                spyOn(App.Models.Myorder.prototype, 'set');
                spyOn(App.Models.Myorder.prototype, 'get_initial_price');
                spyOn(model, 'add');
            });

            it('empty data', function() {
                model.addJSON();
                expect(model.add).not.toHaveBeenCalled();
            });

            it('data with product without id', function() {
               var data = [
                   { product: {} },
                   { product: {} }
               ];

                model.addJSON(data);
                expect(model.add).not.toHaveBeenCalled();
            });

            it('data with product with id', function() {
               var data = [
                   { product: {id: 1} }
               ];

                model.addJSON(data);
                expect(App.Models.Myorder.prototype.addJSON).toHaveBeenCalledWith(data[0]);
                expect(model.add).toHaveBeenCalled();
                expect(App.Models.Myorder.prototype.get_initial_price).toHaveBeenCalled();
            });

            it('data with Service Fee', function() {
                model = new App.Collections.Myorders();
                var data = [{
                        product : {
                            id: null,
                            name: 'SF Web',
                            sum: 10,
                            get: function() {},
                            set: function() {}
                        },
                        modifiers : {},
                        id: 1,
                        id_product: 11,
                        quantity: 'quan',
                        weight: 1,
                        selected: false,
                        is_child_product: false,
                        isServiceFee: true
                    }];

                spyOn(model, 'addServiceFee');
                model.addJSON(data);
                expect(model.addServiceFee).toHaveBeenCalledWith(data[0]);
            });
        });

        it('clone()', function() {
            var order = new App.Models.Myorder();
            spyOn(order, 'clone');
            model = new App.Collections.Myorders([order]);
            var clone = model.clone();
            expect(clone).not.toBe(model);
            expect(clone.__proto__).toBe(model.__proto__);
            expect(order.clone).toHaveBeenCalled();
        });

        describe('change_only_gift_dining_option()', function() {
            var quan, is_gift, dining_option;

            beforeEach(function() {
                is_gift = true;
                spyOn(App.Models.Myorder.prototype, 'is_gift').and.callFake(function() {
                    return is_gift;
                });

                quan = 1;
                spyOn(model, 'get_only_product_quantity').and.callFake(function() {
                    return quan;
                });

                spyOn(model.checkout, 'revert_dining_option');

                model.add({name: 'test'}, {silent: true});
                spyOn(model.checkout, 'set');

                dining_option = 'DINING_OPTION_ONLINE'
                spyOn(model.checkout, 'get').and.callFake(function() {
                    return dining_option;
                });
            });

            it('only gift', function() {
                expect(model.change_only_gift_dining_option()).toBe(true);
                expect(model.checkout.set).toHaveBeenCalledWith('dining_option', 'DINING_OPTION_ONLINE');
            });

            it('not only gift. Revert dining_option', function() {
                is_gift = false;
                expect(model.change_only_gift_dining_option()).toBe(false);
                expect(model.checkout.revert_dining_option).toHaveBeenCalled();
            });

            it('not only gift. not revert dining_option', function() {
                is_gift = false;
                dining_option = 'test';
                expect(model.change_only_gift_dining_option()).toBe(false);
                expect(model.checkout.revert_dining_option).not.toHaveBeenCalled();
            });
        });

        it('not_gift_product_quantity()', function() {
            var count = 2;
            spyOn(model, 'get_only_product_quantity').and.returnValue(5);
            spyOn(App.Models.Myorder.prototype, 'is_gift').and.callFake(function() {
                return count && count--;
            });
            model.add([{},{}], {silent: true});
            expect(model.not_gift_product_quantity()).toBe(3);
        });

        describe('onModelAdded()', function() {
            var add;

            beforeEach(function() {
                add = new App.Models.Myorder();
                spyOn(model, 'change_only_gift_dining_option');
                spyOn(model, 'update_cart_totals');
                spyOn(add, 'update_mdf_sum');
                spyOn(add, 'get_modelsum').and.returnValue(10);
                spyOn(App.Models.Total.prototype, 'get_tip').and.returnValue(0);
                model.quantity = 5;
                add.set('quantity', 2, {silent: true});
            });

            it('model isn\'t real product', function() {
                generalBehaviour();
                expect(model.update_cart_totals).not.toHaveBeenCalled();
            });

            it('model is real product', function() {
                add.set('id_product', 1, {silent: true});
                generalBehaviour();
                expect(model.update_cart_totals).toHaveBeenCalled();
            });


            function generalBehaviour() {
                model.onModelAdded(add);

                expect(model.change_only_gift_dining_option).toHaveBeenCalled();
                expect(model.quantity).toBe(7);
                expect(add.get('sum')).toBe(10);
                expect(add.get('product_sub_id')).toBe(add.cid);
                expect(add.get('quantity_prev')).toBe(2);
            }
        });

        describe('onModelRemoved()', function() {
            var add;

            beforeEach(function() {
                add = new App.Models.Myorder();
                spyOn(model, 'change_only_gift_dining_option');
                spyOn(model, 'update_cart_totals');
                spyOn(model.discount, 'zero_discount');
                spyOn(model, 'removeServiceFees');
                spyOn(add, 'get_modelsum').and.returnValue(10);
                spyOn(App.Models.Total.prototype, 'get_tip').and.returnValue(0);
                add.set('quantity', 2, {silent: true});
                model.quantity = 5;
            });

            it('get_only_product_quantity() < 1', function() {
                spyOn(model, 'get_only_product_quantity').and.returnValue(0);
                generalBehaviour();
                expect(model.discount.zero_discount).toHaveBeenCalled();
                expect(model.removeServiceFees).toHaveBeenCalled();
            });

            it('get_only_product_quantity() >= 1', function() {
                spyOn(model, 'get_only_product_quantity').and.returnValue(1);
                generalBehaviour();
                expect(model.discount.zero_discount).not.toHaveBeenCalled();
                expect(model.removeServiceFees).not.toHaveBeenCalled();
            });

            it('model isn\'t real product', function() {
                generalBehaviour();
                expect(model.update_cart_totals).not.toHaveBeenCalled();
            });

            it('model is real product', function() {
                add.set('id_product', 1, {silent: true});
                generalBehaviour();
                expect(model.update_cart_totals).toHaveBeenCalled();
            });

            function generalBehaviour() {
                model.onModelRemoved(add);

                expect(model.change_only_gift_dining_option).toHaveBeenCalled();
            }
        });

        describe('onModelChange()', function() {
            var add;

            beforeEach(function() {
                add = new App.Models.Myorder();
                spyOn(model, 'update_cart_totals');
                spyOn(App.Models.Total.prototype, 'get_tip').and.returnValue(0);
                spyOn(add, 'get_modelsum').and.returnValue(10);
                add.set('sum', 30, {silent: true});
                add.set('quantity', 2, {silent: true});
                add.set('quantity_prev', 3, {silent: true});
                model.quantity = 5;
            });

            it('model isn\'t real product', function() {
                generalBehaviour();
                expect(model.update_cart_totals).not.toHaveBeenCalled();
            });

            it('model is real product', function() {
                add.set('id_product', 1, {silent: true});
                generalBehaviour();
                expect(model.update_cart_totals).toHaveBeenCalled();
            });

            function generalBehaviour() {
                model.onModelChange(add);
                expect(model.quantity).toBe(4);
                expect(add.get('sum')).toBe(10);
                expect(add.get('quantity_prev')).toBe(2);
            }
        });

        it('removeServiceFees', function() {
            var fee = new App.Models.Myorder(),
                order = new App.Models.Myorder(),
                product = new Backbone.Model();

            spyOn(App.Models.Myorder.prototype, 'get_product').and.returnValue(product);
            spyOn(App.Models.Myorder.prototype, 'get');

            spyOn(order, 'isServiceFee').and.returnValue(false);
            spyOn(fee, 'isServiceFee').and.returnValue(true);
            model = new App.Collections.Myorders([
                order,
                fee
            ]);

            expect(model.models.length).toBe(2);
            model.removeServiceFees();
            expect(model.models.length).toBe(1);
        });

        it('saveOrders()', function() {
            var stored_data;
            var otherItem = new App.Models.Myorder();
            otherItem.addJSON({id_product: 100, product: {name: 'other'}});
            model.add([otherItem], {silent: true});

            spyOn(model.checkout, 'saveCheckout');
            spyOn(model.total, 'saveTotal');
            spyOn(model.discount, 'saveDiscount');
            spyOn(model.rewardsCard, 'saveData');

            spyOn(window, 'setData').and.callFake(function(key, data) {
                if (key == 'orders') {
                    stored_data = data;
                }
            });

            model.saveOrders();

            expect(model.checkout.saveCheckout).toHaveBeenCalled();
            expect(model.rewardsCard.saveData).toHaveBeenCalled();
            expect(model.total.saveTotal).toHaveBeenCalled();
            expect(model.discount.saveDiscount).toHaveBeenCalled();
            expect(stored_data.length).toEqual(1);
            expect(stored_data[0].product.get("name")).toEqual("other");
        });

        it('loadOrders()', function() {
            var orders = [{
                total: {
                    subtotal: 10,
                    tax: 2,
                    surcharge: 1,
                    discounts: 0
                }
            }]
            spyOn(model.checkout, 'loadCheckout');
            spyOn(model.total, 'loadTotal');
            spyOn(window, 'getData').and.returnValue(orders);
            spyOn(model, 'empty_myorder');
            spyOn(model, 'addJSON');
            spyOn(model.discount, 'loadDiscount');

            model.loadOrders();

            expect(model.empty_myorder).toHaveBeenCalled();
            expect(model.checkout.loadCheckout).toHaveBeenCalled();
            expect(model.total.loadTotal).toHaveBeenCalled();
            expect(model.addJSON).toHaveBeenCalledWith(orders);
            expect(model.discount.loadDiscount).toHaveBeenCalled();
        });

        describe('_check_cart()', function() {
            var tips, dining_option, product_quantity, delivery_amount;

            beforeEach(function() {
                tips = 0;
                dining_option = 'DINING_OPTION_ONLINE';
                product_quantity = 2;
                delivery_amount = 0;
                this.min = App.Data.settings.get("settings_system").min_items;
                App.Data.settings.get("settings_system").min_items = 0;
                spyOn(model.total, 'get_subtotal').and.returnValue(10);
                spyOn(model.total, 'get_tip').and.callFake(function() {
                    return tips;
                });
                spyOn(model.total, 'get_remaining_delivery_amount').and.callFake(function() {
                    return delivery_amount;
                });
                spyOn(model.checkout, 'get').and.callFake(function() {
                    return dining_option;
                });
                spyOn(model, 'get_only_product_quantity').and.callFake(function() {
                    return product_quantity;
                });
            });

            afterEach(function() {
                App.Data.settings.get("settings_system").min_items = this.min;
            });

            it('check pass', function() {
                expect(model._check_cart().status).toBe('OK');
            });

            it('only bagcharge in cart', function() {
                product_quantity = 0;
                expect(model._check_cart().status).toBe('ERROR');
            });

            it('tips more than product sum', function() {
                tips = 20;
                expect(model._check_cart().status).toBe('OK');
                expect(model._check_cart({tip: true}).status).toBe('ERROR');
            });

            it('for delivery. Total less then min dilivery amount', function() {
                dining_option = 'DINING_OPTION_DELIVERY';
                delivery_amount = 20;
                expect(model._check_cart().status).toBe('ERROR');
            });

            it('not gift. Quantity less then min for online order', function() {
                App.Data.settings.get("settings_system").min_items = 3;
                dining_option = 'DINING_OPTION_TOGO';
                expect(model._check_cart().status).toBe('ERROR_QUANTITY');
            });
        });

        describe('check_order()', function() {
            var dining_option, card_check, giftcard_check, stanfordcard_check, checkout_check, order_check, customer_check, fake;

            beforeEach(function() {
                fake = {
                    funcOk: function() {},
                    funcError: function() {}
                };
                spyOn(fake, 'funcOk');
                spyOn(fake, 'funcError');

                dining_option = 'DINING_OPTION_ONLINE';
                spyOn(model.checkout, 'get').and.callFake(function() {
                    return dining_option;
                });

                this.card = App.Data.card;
                App.Data.card = {
                    check: function() {}
                };
                this.giftcard = App.Data.giftcard;
                App.Data.giftcard = {
                    check: function() {}
                };
                this.stanfordcard = App.Data.stanfordCard;
                App.Data.stanfordCard = {
                    check: function() {}
                };
                card_check = {
                    status: 'OK'
                };
                spyOn(App.Data.card, 'check').and.callFake(function() {
                    return card_check;
                });

                giftcard_check = {
                    status: 'OK'
                };
                spyOn(App.Data.giftcard, 'check').and.callFake(function() {
                    return giftcard_check;
                });

                stanfordcard_check = {
                    status: 'OK'
                };
                spyOn(App.Data.stanfordCard, 'check').and.callFake(function() {
                    return stanfordcard_check;
                });

                checkout_check = {
                    status: 'OK'
                };
                spyOn(model.checkout, 'check').and.callFake(function() {
                    return checkout_check;
                });

                order_check = {
                    status: 'OK'
                };
                spyOn(model, '_check_cart').and.callFake(function() {
                    return order_check;
                });

                this.customer = App.Data.customer;
                App.Data.customer = {
                    check: function() {}
                };
                customer_check = {
                    status: 'OK'
                };
                spyOn(App.Data.customer, 'check').and.callFake(function() {
                    return customer_check;
                });
            });

            afterEach(function() {
                App.Data.card = this.card;
                App.Data.giftcard = this.giftcard;
                App.Data.stanfordCard = this.stanfordcard;
                App.Data.customer = this.customer;
            });

            it('check pass without options', function() {
                model.check_order({}, fake.funcOk, fake.funcError);
                expect(fake.funcOk).toHaveBeenCalled();
            });

            it('check pass with all options', function() {
                model.check_order({
                    checkout: true,
                    customer: true,
                    card: true,
                    order: true,
                    tip: true
                }, fake.funcOk, fake.funcError);
                expect(fake.funcOk).toHaveBeenCalled();
            });

            describe('check pass with validationOnly option', function() {
                beforeEach(function() {
                    spyOn(model, 'create_order_and_pay');
                });

                it('paymentResponseValid', function() {
                    model.check_order({validationOnly: true}, fake.funcOk, fake.funcError);

                    expectations();
                    model.trigger('paymentResponseValid');
                    expect(fake.funcOk).toHaveBeenCalled();
                    expect(fake.funcError).not.toHaveBeenCalled();
                });

                it('paymentFailedValid', function() {
                    model.check_order({validationOnly: true}, fake.funcOk, fake.funcError);

                    expectations();
                    model.trigger('paymentFailedValid');
                    expect(fake.funcError).toHaveBeenCalled();
                    expect(fake.funcOk).not.toHaveBeenCalled();
                });

                function expectations() {
                    expect(fake.funcOk).not.toHaveBeenCalled();
                    expect(fake.funcError).not.toHaveBeenCalled();
                    expect(model.create_order_and_pay).toHaveBeenCalledWith(PAYMENT_TYPE.NO_PAYMENT, true);
                }
            });

            it('check card simple error', function() {
                card_check = {
                    status: 'ERROR',
                    errorMsg: 'test'
                };
                model.check_order({card: true}, fake.funcOk, fake.funcError);
                expect(fake.funcError).toHaveBeenCalled();
            });

            it('check card empty fields', function() {
                card_check = {
                    status: 'ERROR_EMPTY_FIELDS',
                    errorList: ['field']
                };
                model.check_order({card: true}, fake.funcOk, fake.funcError);
                expect(fake.funcError).toHaveBeenCalled();
            });

            it('check giftcard empty fields', function() {
                giftcard_check = {
                    status: 'ERROR_EMPTY_FIELDS',
                    errorList: ['field']
                };
                model.check_order({giftcard: true}, fake.funcOk, fake.funcError);
                expect(fake.funcError).toHaveBeenCalled();
            });

            it('check stanfordcard empty fields', function() {
                stanfordcard_check = {
                    status: 'ERROR_EMPTY_FIELDS',
                    errorList: ['field']
                };
                model.check_order({stanfordcard: true}, fake.funcOk, fake.funcError);
                expect(fake.funcError).toHaveBeenCalled();
            });

            it('check checkout simple error', function() {
                checkout_check = {
                    status: 'ERROR',
                    errorMsg: 'test'
                };
                model.check_order({checkout: true}, fake.funcOk, fake.funcError);
                expect(fake.funcError).toHaveBeenCalled();
            });

            it('check checkout empty fields', function() {
                checkout_check = {
                    status: 'ERROR_EMPTY_FIELDS',
                    errorList: ['field']
                };
                model.check_order({checkout: true}, fake.funcOk, fake.funcError);
                expect(fake.funcError).toHaveBeenCalled();
            });

            it('check order simple error', function() {
                order_check = {
                    status: 'ERROR',
                    errorMsg: 'test'
                };
                model.check_order({order: true}, fake.funcOk, fake.funcError);
                expect(fake.funcError).toHaveBeenCalled();
            });

            it('check order quantity', function() {
                spyOn(App.Data.errors, 'alert');
                order_check = {
                    status: 'ERROR_QUANTITY',
                    errorMsg: 'test'
                };
                model.check_order({order: true}, fake.funcOk, fake.funcError);
                expect(fake.funcError).toHaveBeenCalled();
            });

            it('check customer simple error', function() {
                customer_check = {
                    status: 'ERROR',
                    errorMsg: 'test'
                };
                model.check_order({customer: true}, fake.funcOk, fake.funcError);
                expect(fake.funcError).toHaveBeenCalled();
            });

            it('check customer empty fields', function() {
                customer_check = {
                    status: 'ERROR_EMPTY_FIELDS',
                    errorList: ['field']
                };
                model.check_order({customer: true}, fake.funcOk, fake.funcError);
                expect(fake.funcError).toHaveBeenCalled();
            });

            it('check customer address validation', function() {
                dining_option = 'DINING_OPTION_DELIVERY';
                model.check_order({customer: true}, fake.funcOk, fake.funcError);
                expect(App.Data.customer.check).toHaveBeenCalled();
                expect(fake.funcError).not.toHaveBeenCalled();
            });

            it('error callback not passed', function() {
                spyOn(App.Data.errors, 'alert');
                order_check = {
                    status: 'ERROR_QUANTITY',
                    errorMsg: 'test'
                };
                model.check_order({order: true}, fake.funcOk);
                expect(App.Data.errors.alert).toHaveBeenCalled();
            });
        });

        describe('create_order_and_pay()', function() {
            var pickup, base, dining_time, checking_work_shop, last_pt;

            beforeEach(function() {
                pickup = new Date(2011, 11, 11);
                spyOn(model, 'submit_order_and_pay');
                spyOn(model, 'trigger');
                model.checkout = new Backbone.Model({
                    dining_option: 'DINING_OPTION_ONLINE',
                    pickupTS: pickup,
                    isPickupASAP: false
                });
                spyOn(window, 'format_date_1').and.callFake(function(date) {
                    return '!' + date;
                });
                spyOn(window, 'pickupToString').and.returnValue('pickupToString');
                this.timetables = App.Data.timetables;
                App.Data.timetables = {
                    base: function() {},
                    current_dining_time: function() {},
                    checking_work_shop: function() {},
                    getLastPTforWorkPeriod: function() {}
                };

                base = new Date(2011, 10, 10);
                spyOn(App.Data.timetables, 'base').and.callFake(function() {
                    return base;
                });

                dining_time = new Date(2011, 10, 10);
                spyOn(App.Data.timetables, 'current_dining_time').and.callFake(function() {
                    return dining_time;
                });

                checking_work_shop = true;
                spyOn(App.Data.timetables, 'checking_work_shop').and.callFake(function() {
                    return checking_work_shop;
                });

                last_pt = new Date(2011, 10, 10);;
                spyOn(App.Data.timetables, 'getLastPTforWorkPeriod').and.callFake(function() {
                    return last_pt;
                });

                this.skin = App.Data.settings.get('skin');
                App.Data.settings.set('skin', 'mlb');
            });

            afterEach(function() {
                App.Data.timetables = this.timetables;
                App.Data.settings.set('skin', this.skin);
            });

            it('paymentInProgress', function() {
                model.paymentInProgress = true;
                model.create_order_and_pay();
                expect(model.submit_order_and_pay).not.toHaveBeenCalled();
            });

            it('check pass', function() {
                model.create_order_and_pay();
                expect(model.submit_order_and_pay).toHaveBeenCalled();
            });

            describe('check pass mlb skin, only gift, order seat', function() {
                beforeEach(function() {
                    model.checkout.set('pickupTS', undefined);
                    if (typeof ajaxMock == 'function')
                       spyOn($, 'ajax').and.callFake(ajaxMock);
                    else
                       spyOn($, 'ajax').and.callThrough();
                    if (typeof ajaxMock == 'function') {
                        ajaxMock.replyData = {  data: {},
                                        status: "OK" };
                    }
                });

                it('change skin', function() {
                    App.Data.settings.set('skin', 'weborder');
                    model.create_order_and_pay();
                    expect(model.submit_order_and_pay).toHaveBeenCalled();
                });

                it ('+ change dining_option', function() {
                    App.Data.settings.set('skin', 'weborder');
                    model.checkout.set('dining_option', 'DINING_OPTION_TOGO');
                    spyOn(model, 'preparePickupTime');
                    model.create_order_and_pay();
                    expect(model.submit_order_and_pay).toHaveBeenCalled();
                });

                it ('+ change dining_option. preparePickupTime() returns 0', function() {
                    App.Data.settings.set('skin', 'weborder');
                    model.checkout.set('dining_option', 'DINING_OPTION_TOGO');
                    model.create_order_and_pay();
                    expect(model.submit_order_and_pay).not.toHaveBeenCalled();
                });
            });
        });

        describe('get_cart_totals()', function() {
            var getQtySpy, get_discount_xhr;

            beforeEach(function() {
                if (typeof ajaxMock == 'function')
                   spyOn($, 'ajax').and.callFake(ajaxMock);
                else
                   spyOn($, 'ajax').and.callThrough();
                get_discount_xhr = Backbone.$.ajax();
                spyOn(model, '_get_cart_totals').and.returnValue(get_discount_xhr);
                getQtySpy = spyOn(model, 'get_only_product_quantity').and.returnValue(2);
            });

            it('general behaviour', function() {
                expect(model.get_cart_totals()).toEqual(get_discount_xhr);
            });

            it('`getDiscountsTimeout` exists', function() {
                spyOn(window, 'clearTimeout');
                model.getDiscountsTimeout = 1;
                if (typeof ajaxMock == 'function') {
                    ajaxMock.replyData = {  errorMsg: "'NoneType' object has no attribute 'id'",
                                        status: "ERROR" };
                }
                model.get_cart_totals();
                expect(model.getDiscountsTimeout).toBeUndefined();
                expect(window.clearTimeout).toHaveBeenCalledWith(1);
            });

            it('get_only_product_quantity() < 1', function() {
                getQtySpy.and.returnValue(0);
                spyOn(model.total, 'set');
                model.get_cart_totals();
                expect(model.total.set).toHaveBeenCalled();
            });

            it('get_only_product_quantity() < 1 or `NoRequestDiscounts` is true', function() {
                spyOn(model, 'listenTo');
                getQtySpy.and.returnValue(0);
                model.pending = true;

                expect(model.get_cart_totals().state()).toBe('rejected');
                expect(model.pending).toBeUndefined;

                getQtySpy.and.returnValue(2);
                model.NoRequestDiscounts = true;
                expect(model.get_cart_totals().state()).toBe('rejected');
                expect(model.pending).toBeUndefined;
            });

            it('`get_discount_xhr` exists', function() {
                spyOn(get_discount_xhr, 'abort');
                model.get_discount_xhr = get_discount_xhr;

                model.get_cart_totals();
                expect(get_discount_xhr.abort).toHaveBeenCalled();
            });
        });

        describe('_get_cart_totals(params)', function() {
            var data, checkout, rewardsCard, ajaxSpy;

            beforeEach(function() {
                if (typeof ajaxMock == 'function')
                   ajaxSpy = spyOn($, 'ajax').and.callFake(ajaxMock);
                else
                   ajaxSpy = spyOn($, 'ajax').and.callThrough();
                spyOn(model, 'preparePickupTime');
                spyOn(model, 'trigger');
            });

            it('general behaviour', function() {
                var order = new App.Models.Myorder(),
                    fee = new App.Models.Myorder();

                spyOn(order, 'isServiceFee').and.returnValue(false);
                spyOn(fee, 'isServiceFee').and.returnValue(true);
                spyOn(order, 'item_submit').and.callFake(function() {
                    return order;
                });
                model.add([
                    order,
                    fee
                ], {silent: true});

                if (typeof ajaxMock == 'function') {
                    ajaxMock.replyData = {  errorMsg: "'NoneType' object has no attribute 'id'",
                                        status: "ERROR" };
                }
                model._get_cart_totals();

                expect($.ajax).toHaveBeenCalledWith({
                    type: "POST",
                    url: App.Data.settings.get("host") + "/weborders/cart_totals/",
                    data: jasmine.any(String),
                    dataType: 'json',
                    success: jasmine.any(Function),
                    error: jasmine.any(Function),
                    complete: jasmine.any(Function)
                });

                data = JSON.parse($.ajax.calls.mostRecent().args[0].data);
                expect(data.items.length).toBe(1);
            });

            describe('ajax complete', function() {
                it('request status is `abort`', function() {
                    ajaxSpy.and.callFake(function(e) {
                        e.complete({statusText: 'abort'});
                    });
                    model._get_cart_totals();

                    expect(model.trigger).not.toHaveBeenCalled();
                });

                it('request status is not `abort`', function() {
                    ajaxSpy.and.callFake(function(e) {
                        e.complete({statusText: 'success'});
                    });
                    model._get_cart_totals();

                    expect(model.trigger).toHaveBeenCalledWith('DiscountsComplete');
                });
            });

            describe('ajax success', function() {
                beforeEach(function() {
                    spyOn(App.Data.errors, 'alert');

                    ajaxSpy.and.callFake(function(e) {
                        e.success(data);
                    });
                })

                it('data.status doesn\'t exist or empty', function() {
                    data = {};
                    model._get_cart_totals({apply_discount: true});

                    expect(App.Data.errors.alert.calls.mostRecent().args[0].indexOf(MSG.ERROR_INCORRECT_AJAX_DATA) > -1).toBe(true);
                });

                it('data.status is `OK`', function() {
                    data = {
                        status: 'OK',
                        data: 'data'
                    };
                    checkout = new Backbone.Model({
                        discount_code: 'test'
                    });
                    model.checkout = checkout;
                    spyOn(model, 'get_only_product_quantity').and.returnValue(1);
                    spyOn(model, 'process_cart_totals');

                    model._get_cart_totals({apply_discount: true});

                    expect(model.checkout.get('last_discount_code')).toBe('test');
                    expect(model.process_cart_totals).toHaveBeenCalledWith(data.data);
                });

                it('data.status is `DISCOUNT_CODE_NOT_FOUND` or `DISCOUNT_CODE_NOT_APPLICABLE`', function() {
                    spyOn(model, 'update_cart_totals');
                    data = {
                        status: 'DISCOUNT_CODE_NOT_FOUND',
                        data: 'data'
                    };
                    model._get_cart_totals({apply_discount: true});

                    expect(model.checkout.get('last_discount_code')).toBeNull();
                    expect(App.Data.errors.alert.calls.mostRecent().args[0].indexOf(MSG.DISCOUNT_CODE_NOT_FOUND) > -1).toBe(true);
                    expect(model.update_cart_totals).toHaveBeenCalled();

                    data = {
                        status: 'DISCOUNT_CODE_NOT_APPLICABLE',
                        data: 'data'
                    };
                    model._get_cart_totals({apply_discount: true});

                    expect(model.checkout.get('last_discount_code')).toBeNull();
                    expect(App.Data.errors.alert.calls.mostRecent().args[0].indexOf(MSG.DISCOUNT_CODE_NOT_APPLICABLE) > -1).toBe(true);
                    expect(model.update_cart_totals).toHaveBeenCalled();
                });

                it('data.status is something else, data.errorMsg exists', function() {
                    data = {
                        status: 'some status',
                        data: 'data',
                        errorMsg: 'error message'
                    };
                    model._get_cart_totals({apply_discount: true});

                    expect(App.Data.errors.alert.calls.mostRecent().args[0].indexOf('error message') > -1).toBe(true);
                });

                it('data.status is something else, data.errorMsg doesn\'t exist', function() {
                    data = {
                        status: 'some status',
                        data: 'data'
                    };
                    model._get_cart_totals({apply_discount: true});

                    expect(App.Data.errors.alert.calls.mostRecent().args[0].indexOf(MSG.ERROR_NO_MSG_FROM_SERVER) > -1).toBe(true);
                });
            });

            it('ajax error', function() {
                spyOn(App.Data.errors, 'alert');
                ajaxSpy.and.callFake(function(e) {
                    e.error({statusText: 'error'});
                });
                model._get_cart_totals({apply_discount: true});

                expect(App.Data.errors.alert.calls.mostRecent().args[0].indexOf(MSG.ERROR_GET_CART_TOTALS) > -1).toBe(true);
            });

            it('params.apply_discount is true, checkout.discount_code exists', function() {
                checkout = new Backbone.Model({
                    discount_code: 'test'
                });
                model.checkout = checkout;

                if (typeof ajaxMock == 'function') {
                    ajaxMock.replyData = {"status": "DISCOUNT_CODE_NOT_FOUND"}
                }
                model._get_cart_totals({apply_discount: true});
                data = JSON.parse($.ajax.calls.mostRecent().args[0].data);

                expect(data.discount_code).toBe('test');
            });

            it('params.apply_discount is false, checkout.last_discount_code exists', function() {
                checkout = new Backbone.Model({
                    last_discount_code: 'test'
                });
                model.checkout = checkout;
                if (typeof ajaxMock == 'function') {
                    ajaxMock.replyData = {"status": "DISCOUNT_CODE_NOT_FOUND"}
                }
                model._get_cart_totals({apply_discount: false});
                data = JSON.parse($.ajax.calls.mostRecent().args[0].data);

                expect(data.discount_code).toBe('test');
            });

            it('`isShipping` is true, params.update_shipping_options is true', function() {
                spyOn(model, 'getCustomerAddress').and.returnValue('address');
                this.customer = App.Data.customer;
                checkout = new Backbone.Model({
                    dining_option: 'DINING_OPTION_SHIPPING'
                });
                model.checkout = checkout;
                App.Data.customer = new Backbone.Model({
                    shipping_address: 0,
                    addresses: ['address'],
                    shipping_selected: 0,
                    shipping_services: ['shipping service']
                });
                App.Data.customer._check_delivery_fields = function() {return []};
                App.Data.customer.get_shipping_services = function() {};

                var cb = jasmine.createSpy('cb'),
                    shippingOptions = null;
                spyOn(App.Data.customer, 'get_shipping_services').and.callFake(function(request, callback) {
                    cb(callback({
                        data: {
                            shipping: {
                                options: shippingOptions
                            }
                        }
                    }));
                });

                if (typeof ajaxMock == 'function') {
                    ajaxMock.replyData = {"status": "ERROR", "errorMsg": "'unicode' object has no attribute 'get'"};
                }

                model._get_cart_totals({update_shipping_options: true});
                data = JSON.parse($.ajax.calls.mostRecent().args[0].data);
                expect(data.orderInfo.shipping).toBe('shipping service');
                expect(data.orderInfo.customer.address).toBe('address');
                expect(App.Data.customer.get_shipping_services).toHaveBeenCalled();
                expect(cb).toHaveBeenCalledWith([]);

                shippingOptions = [1, 2];
                model._get_cart_totals({update_shipping_options: true});
                expect(cb).toHaveBeenCalledWith(shippingOptions);

                App.Data.customer = this.customer;
            });

            it('rewards card', function() {
                rewardsCard = new Backbone.Model({
                    number: 123,
                    discounts: [11, 22]
                });
                model.rewardsCard = rewardsCard;

                if (typeof ajaxMock == 'function') {
                    ajaxMock.replyData = {"status": "ERROR", "errorMsg": "list index out of range"};
                }
                model._get_cart_totals();
                data = JSON.parse($.ajax.calls.mostRecent().args[0].data);
                expect(data.orderInfo.rewards_card.number).toBe(123);
                expect(data.orderInfo.rewards_card.discounts).toEqual([11, 22]);
            });

            it('stanford card', function() {
                if (typeof ajaxMock == 'function') {
                    ajaxMock.replyData = {"status": "ERROR", "errorMsg": "list index out of range"};
                }
                model._get_cart_totals({type: PAYMENT_TYPE.STANFORD, planId: 'plan id'});
                data = JSON.parse($.ajax.calls.mostRecent().args[0].data);
                expect(data.paymentInfo.cardInfo.planId).toBe('plan id');
            });
        });

        describe('process_cart_totals()', function() {
            var orders, json,
            orders_combo = deepClone(data.orders_combo),
            json_combo = deepClone(data.cart_totals_combo),
            orders_serviceFee = deepClone(data.orders_serviceFee),
            json_serviceFee = deepClone(data.cart_totals_serviceFee);

            beforeEach(function() {
                spyOn(App.Models.Total.prototype, 'update_grand');
                spyOn(App.Models.Total.prototype, 'get_tip');

                orders = deepClone(data.orders_product_discount);
                json = deepClone(data.cart_totals_product_discount);
            });

            it('got incorrect json', function() {
                spyOn(model, 'get');
                model.process_cart_totals(null);
                expect(model.get).not.toHaveBeenCalled();
            });

            it('json contains model not presented in collection', function() {
                spyOn(model, 'get');
                model.process_cart_totals({
                    "items": [{
                        product_sub_id: 99999,
                        product: 99999
                    }]
                });
                expect(model.get).not.toHaveBeenCalled();
            });

            it('product.discount', function() {
                model.add(orders, {silent: true});
                spyOn(model.models[1].get('discount'), 'zero_discount');

                model.process_cart_totals(json);

                expect(model.models[0].get('discount').get('name')).toBe('test discount');
                expect(model.models[1].get('discount').zero_discount).toHaveBeenCalled();
            });

        if (!window._phantom) {
            it('product.combo_items', function() {
                model.add(orders_combo, {silent: true});
                var order_product = new App.Models.Product(),
                    product = new App.Models.Product();
                order_product.set('product', product, {silent: true});

                model.models[0].get('product').get = jasmine.createSpy().and.returnValue({
                    find_product: function() {return order_product}
                });
                model.models[0].get('product').set = jasmine.createSpy();

                model.process_cart_totals(json_combo);

                expect(product.get('combo_price')).toBe(5);
                expect(model.models[0].get('product').set).toHaveBeenCalledWith('combo_price', 25);
            });
        }

            describe('json.service_fees', function() {
                beforeEach(function() {
                    spyOn(App.Models.Myorder.prototype, 'isServiceFee');
                });

                it('is not array', function() {
                    orders[0].isServiceFee = jasmine.createSpy();
                    model.add(orders, {silent: true});
                    json.service_fees = {};
                    model.process_cart_totals(json);

                    expect(App.Models.Myorder.prototype.isServiceFee).not.toHaveBeenCalled();
                    expect(model.total.get('tip').get('serviceFee')).toBe(0);
                });

                it('is undefined', function() {
                    model.add(orders, {silent: true});
                    json.service_fees = undefined;
                    model.process_cart_totals(json);

                    expect(App.Models.Myorder.prototype.isServiceFee).toHaveBeenCalled();
                    expect(model.total.get('tip').get('serviceFee')).toBe(0);
                });

                it('is array. Fee exists in collection', function() {
                    model.add(orders_serviceFee, {silent: true});
                    model.each(function(order) {
                        var orderModel = new App.Models.Product(order.get('product'));
                        order.set('product', orderModel, {silent: true});
                    });
                    model.process_cart_totals(json_serviceFee);

                    expect(model.models[1].get('product').get('name')).toBe('test fee');
                    expect(model.models[1].get('product').get('price')).toBe(1);
                    expect(model.models[1].get('initial_price')).toBe(1);
                    expect(model.models[1].get('sum')).toBe(1);
                    expect(model.total.get('tip').get('serviceFee')).toBe(json_serviceFee.service_fees[0].amount);
                });

                it('is array. Fee doesn\'t exist in collection', function() {
                    model.add(orders, {silent: true});
                    spyOn(model, 'add');
                    model.process_cart_totals(json_serviceFee);

                    expect(model.add).toHaveBeenCalled();
                    expect(model.total.get('tip').get('serviceFee')).toBe(0);
                });

                it('is array. Fee exists in collection but not in response', function() {
                    model.add(orders, {silent: true});
                    spyOn(model, 'add');
                    model.process_cart_totals(json_serviceFee);

                    expect(model.add).toHaveBeenCalled();
                    expect(model.total.get('tip').get('serviceFee')).toBe(0);
                });
            });

            it('json.order_discount exists', function() {
                json.order_discount = {
                    name: 'test'
                };
                model.process_cart_totals(json);
                expect(model.discount.get('name')).toBe('test');
            });

            it('json.order_discount is null', function() {
                spyOn(model.discount, 'zero_discount');
                json.order_discount = null;

                model.process_cart_totals(json);

                expect(model.discount.zero_discount).toHaveBeenCalled();
            });
        });

        describe('preparePickupTime()', function() {
            var pickup, base, dining_time, checking_work_shop, last_pt, createDate, pickupTimeToServer;
            beforeEach(function() {
                base = new Date(2011, 10, 10);
                pickup = new Date(2011, 11, 11);
                App.Settings.server_time = 0;
                model.checkout = new Backbone.Model({
                    dining_option: 'DINING_OPTION_ONLINE',
                    pickupTS: pickup.getTime(),
                    isPickupASAP: false
                });
                model.checkout.set('dining_option', 'DINING_OPTION_TOGO');
                this.timetables = App.Data.timetables;
                spyOn(window, 'pickupToString').and.returnValue('pickupToString');
                App.Data.timetables = {
                    base: function() {},
                    current_dining_time: function() {},
                    checking_work_shop: function() {},
                    getLastPTforWorkPeriod: function() {}
                };

                base = new Date(2011, 10, 10);
                spyOn(App.Data.timetables, 'base').and.callFake(function() {
                    return base;
                });

                dining_time = new Date(2011, 10, 10);
                spyOn(App.Data.timetables, 'current_dining_time').and.callFake(function() {
                    return dining_time;
                });

                checking_work_shop = true;
                spyOn(App.Data.timetables, 'checking_work_shop').and.callFake(function() {
                    return checking_work_shop;
                });

                last_pt = new Date(2011, 10, 10);
                spyOn(App.Data.timetables, 'getLastPTforWorkPeriod').and.callFake(function() {
                    return last_pt;
                });

                spyOn(window, 'getServerTimezoneOffset').and.callFake(function() {
                    return 0;
                });

                createDate = format_date_1(new Date(new Date().getTime()));
                pickupTimeToServer = format_date_1(pickup);
            });
            afterEach(function() {
                App.Data.timetables = this.timetables;
            });

            it('no pickup time', function() {
                model.checkout.set('pickupTS', undefined);
                expect(model.preparePickupTime()).toBe(0);
            });

            it('pickup time less current time. Check pickup time update', function() {
                dining_time = new Date(2011, 12, 12);
                model.preparePickupTime();
                expect(App.Data.timetables.checking_work_shop).toHaveBeenCalledWith(dining_time, false);
            });

            it('checking_work_shop is called with delivery = true', function() {
                dining_time = new Date(2011, 12, 12);
                model.checkout.set('dining_option', 'DINING_OPTION_DELIVERY');
                model.preparePickupTime();
                expect(App.Data.timetables.checking_work_shop).toHaveBeenCalledWith(dining_time, true);
            });

            it('store closed', function() {
                checking_work_shop = false;
                expect(model.preparePickupTime()).toBe(0);
                expect(App.Data.timetables.checking_work_shop).toHaveBeenCalledWith(pickup, false);
            });

            it('check checkout changes not ASAP', function() {
                expect(model.preparePickupTime()).toBeUndefined();
                expect(model.checkout.get('pickupTime')).toBe('pickupToString');
                expect(model.checkout.get('createDate')).toBe(createDate);
                expect(model.checkout.get('pickupTimeToServer')).toBe(pickupTimeToServer);
                expect(model.checkout.get('lastPickupTime')).toBeUndefined();
            });

            it('check checkout changes ASAP', function() {
                model.checkout.set('isPickupASAP', true);
                expect(model.preparePickupTime()).toBeUndefined();
                expect(model.checkout.get('pickupTime')).toBe('ASAP (pickupToString)');
                expect(model.checkout.get('pickupTimeToServer')).toBe(pickupTimeToServer);
                expect(model.checkout.get('lastPickupTime')).toBe(format_date_1(last_pt.getTime()));
            });

            it('ASAP', function() {
                //spyOn(App.Models.Total.prototype, 'get_tip').and.returnValue(0);
                model.checkout.set('isPickupASAP', true);
                expect(model.preparePickupTime()).toBeUndefined();
                expect(App.Data.timetables.getLastPTforWorkPeriod).toHaveBeenCalledWith(base);
            });
        });

        describe('submit_order_and_pay()', function() {
            var ajax, total, checkout, card, rewardsCard, customer, payment_process,
                dfd = new Backbone.$.Deferred(),
                customer;

            beforeEach(function() {
                dfd = new Backbone.$.Deferred();
                spyOn($, 'ajax').and.callFake(function(opts) {
                    ajax = opts;
                    ajax.data = JSON.parse(ajax.data);

                    return dfd;
                });
                this.mobile = $.mobile;
                $.mobile = {
                    loading: function() {}
                };
                spyOn($.mobile, 'loading');

                spyOn(App.Models.Myorder.prototype, 'item_submit').and.returnValue('modif');

                this.get_parameters = App.Data.get_parameters;
                App.Data.get_parameters = {};

                this.skin = App.Data.settings.get('skin');
                App.Data.settings.set('skin', 'test skin');

                total = {
                    final_total: 5,
                    surcharge: 4,
                    subtotal: 3,
                    tax: 2,
                    tip: 1
                };
                spyOn(model.total, 'get_all').and.callFake(function() {
                    return total;
                });

                checkout = {
                    createDate: 'create date',
                    pickupTimeToServer: 'pickup time to server',
                    lastPickupTime: 'last pt',
                    dining_option: '',
                    pickupTime: '',
                    pickupTS: null,
                    level: '',
                    section: '',
                    row: '',
                    seat: '',
                    email: '',
                    payment_id: '',
                    rewardCard: '',
                    notes: ''
                };
                spyOn(model.checkout, 'toJSON').and.callFake(function() {
                    return checkout;
                });
                spyOn(model.checkout, 'set');
                spyOn(model.checkout, 'saveCheckout');

                this.card = App.Data.card;
                App.Data.card = {
                    toJSON: function() {},
                    unset: function() {}
                };
                card = {
                    firstName: '',
                    secondName: '',
                    street: '',
                    city: '',
                    state: '',
                    zip: '',
                    cardNumber: '',
                    expMonth: '',
                    expDate: '',
                    securityCode: '',
                    billing_address: null,
                    rememberCard: false
                };
                spyOn(App.Data.card, 'toJSON').and.callFake(function() {
                    return card;
                });

                this.customer = App.Data.customer;

                customer = {
                    phone: '',
                    first_name: 'customer name',
                    last_name: '',
                    addresses: [],
                    shipping_address: null,
                    email: '',
                    shipping_services: [],
                    shipping_selected: -1
                };

                App.Data.customer = {
                    toJSON: jasmine.createSpy().and.callFake(function() {
                        return customer;
                    }),
                    get_customer_name: jasmine.createSpy().and.returnValue('customer name'),
                    isDefaultShippingAddress: function() {},
                    isAuthorized: jasmine.createSpy(),
                    doPayWithToken: jasmine.createSpy().and.returnValue(dfd)
                };

                //spyOn(App.Models.Myorder.prototype, 'getCustomerData').and.returnValue({call_name: 'customer call name'});

                payment_process = {
                    paypal_direct_credit_card: false,
                    usaepay: true
                };
                App.Settings.payment_processor = {
                    usaepay: true
                }
                spyOn(App.Data.settings, 'get_payment_process').and.callFake(function() {
                    return payment_process;
                });

                spyOn(model, 'trigger');
                spyOn(App.Data.errors, 'alert');
            });

            afterEach(function() {
               $.mobile = this.mobile;
               App.Data.get_parameters = this.get_parameters;
               App.Data.settings.set('skin', this.skin);
               App.Data.card = this.card;
               App.Data.customer = this.customer;
            });

            it('empty models. Default state', function() {
                App.Data.settings.set('establishment', 14);
                customer.first_name = '';
                checkout.pickupTime = '';
                model.submit_order_and_pay(PAYMENT_TYPE.CREDIT);
                expect(ajax.data).toEqual({
                    establishmentId: 14,
                    items: [],
                    orderInfo: {
                        call_name: "",
                        created_date: 'create date',
                        lastPickupTime: "last pt",
                        pickup_time: "pickup time to server",
                        notes: "",
                        customer: {
                            first_name: "",
                            last_name: ""
                        }
                    },
                    paymentInfo: {
                        tip: 1,
                        type: 2,
                        tip_percent: 0,
                        cardInfo: {
                            firstDigits: '',
                            lastDigits: '',
                            firstName: '',
                            lastName: '',
                            address: null
                        }
                    },
                    skin: 'test skin'
                });
            });

            it('+several items', function() {
                model.add([{}, {}], {silent: true});
                model.submit_order_and_pay(PAYMENT_TYPE.CREDIT);
                expect(ajax.data.items).toEqual(['modif', 'modif']);
            });

            it('send "nonce" to backend', function() {
                card.nonce = "12345";
                model.submit_order_and_pay(PAYMENT_TYPE.CREDIT);
                expect(ajax.data.paymentInfo.cardInfo.nonce).toEqual(card.nonce);
                delete card.nonce;
            });

            it('send "encrypted_customer_input" to backend', function() {
                card.encrypted_customer_input = "12345";
                model.submit_order_and_pay(PAYMENT_TYPE.CREDIT);
                expect(ajax.data.paymentInfo.cardInfo.encrypted_customer_input).toEqual(card.encrypted_customer_input);
                delete card.encrypted_customer_input;
            });

            it('send billing address to backend', function() {
                var address = {
                    street_1: 1,
                    street_2: 2,
                    city: 'city',
                    state: 'state',
                    zipcode: 123,
                    country: 'United States',
                    country_code: 'US',
                    extra: 'extra'
                };
                spyOn(PaymentProcessor, 'isBillingAddressCard').and.returnValue(true);
                spyOn(window, 'get_billing_address').and.returnValue(address);
                model.submit_order_and_pay(PAYMENT_TYPE.CREDIT);
                expect(ajax.data.paymentInfo.cardInfo.address).toEqual({
                    street_1: 1,
                    city: 'city',
                    state: 'state',
                    zipcode: 123,
                    country: 'US'
                });
                delete card.address;
            });

            it('`checkout.last_discount_code` exists', function() {
                checkout.last_discount_code = 'last discount code';
                model.submit_order_and_pay(PAYMENT_TYPE.CREDIT);
                expect(ajax.data.discount_code).toBe('last discount code');
            });

            it('`checkout.dining_option` is `DINING_OPTION_OTHER`, `checkout.notes` is empty string', function() {
                checkout.dining_option = 'DINING_OPTION_OTHER';
                spyOn(model, 'getOtherDiningOptionCallName').and.returnValue('call name');

                model.submit_order_and_pay(PAYMENT_TYPE.CREDIT);
                expect(model.getOtherDiningOptionCallName).toHaveBeenCalled();
                expect(ajax.data.orderInfo.notes).toBe('Delivery Info: call name');
            });

            it('`checkout.dining_option` is `DINING_OPTION_OTHER`, `checkout.notes` is not empty string', function() {
                checkout.dining_option = 'DINING_OPTION_OTHER';
                checkout.notes = 'checkout notes';
                spyOn(model, 'getOtherDiningOptionCallName').and.returnValue('call name');

                model.submit_order_and_pay(PAYMENT_TYPE.CREDIT);
                expect(model.getOtherDiningOptionCallName).toHaveBeenCalled();
                expect(ajax.data.orderInfo.notes).toBe('checkout notes\nDelivery Info: call name');
            });

            it('`checkout.dining_option` is `DINING_OPTION_SHIPPING`', function() {
                spyOn(model, 'getCustomerAddress').and.returnValue('address');
                checkout.dining_option = 'DINING_OPTION_SHIPPING';
                customer.shipping_services = ['shipping service 1', 'shipping service 2'];
                customer.shipping_selected = 1;

                model.submit_order_and_pay(PAYMENT_TYPE.CREDIT);
                expect(ajax.data.orderInfo.shipping).toBe('shipping service 2');
                expect(ajax.data.orderInfo.customer).toEqual({
                    first_name: 'customer name',
                    last_name: '',
                    address: 'address'
                });
            });

            describe('type of request to backend', function() {
                var validationOnly;

                beforeEach(function() {
                    App.Data.customer.payWithToken = function() {
                        return Backbone.$.Deferred();
                    };

                    spyOn(App.Data.customer, 'payWithToken').and.callThrough();
                });

                describe('weborders/pre_validate/', function() {
                    it('"validationOnly" param is true', function() {
                        validationOnly = true;
                        model.submit_order_and_pay(PAYMENT_TYPE.CREDIT, validationOnly);
                        expect(ajax.url.indexOf('weborders/pre_validate')).not.toBe(-1);
                    });
                });

                describe('weborders/create_order_and_pay_v1/', function() {
                    it('payment type is not credit', function() {
                        model.submit_order_and_pay(PAYMENT_TYPE.NO_PAYMENT);
                        expectCreateOrderAndPay();
                    });

                    it('payment type is credit, customer is not authorized', function() {
                        model.submit_order_and_pay(PAYMENT_TYPE.CREDIT);
                        App.Data.customer.isAuthorized.and.returnValue(false);
                        expectCreateOrderAndPay();
                    });

                    it('payment type is credit, customer is not authorized', function() {
                        App.Data.customer.isAuthorized.and.returnValue(false);
                        model.submit_order_and_pay(PAYMENT_TYPE.CREDIT);
                        expectCreateOrderAndPay();
                    });

                    it('payment type is credit, customer is authorized, customer.doPayWithToken() is false, card.rememberCard is false, payment.credit_card_dialog is false, card.cardNumber is empty', function() {
                        App.Data.customer.isAuthorized.and.returnValue(true);
                        App.Data.customer.doPayWithToken.and.returnValue(false);
                        App.Data.settings.get_payment_process.and.returnValue({credit_card_dialog: false});
                        App.Data.card.toJSON.and.returnValue({rememberCard: false, cardNumber: ''});
                        model.submit_order_and_pay(PAYMENT_TYPE.CREDIT);
                        expectCreateOrderAndPay();
                    });

                    it('payment type is credit, customer is authorized, customer.doPayWithToken() is false, card.rememberCard is false, payment.credit_card_dialog is true, card.cardNumber exists', function() {
                        App.Data.customer.isAuthorized.and.returnValue(true);
                        App.Data.customer.doPayWithToken.and.returnValue(false);
                        App.Data.settings.get_payment_process.and.returnValue({credit_card_dialog: true});
                        App.Data.card.toJSON.and.returnValue({rememberCard: false, cardNumber: 123});
                        model.submit_order_and_pay(PAYMENT_TYPE.CREDIT);
                        expectCreateOrderAndPay();
                    });
                });

                describe('customer.payWithToken()', function() {
                    it('payment type is credit, customer is authorized, customer.doPayWithToken() is true', function() {
                        App.Data.customer.isAuthorized.and.returnValue(true);
                        App.Data.customer.doPayWithToken.and.returnValue(true);
                        App.Data.customer.payments = new Backbone.Model;
                        model.submit_order_and_pay(PAYMENT_TYPE.CREDIT);
                        expectPayWithToken();
                    });

                    it('payment type is credit, customer is authorized, customer.doPayWithToken() is false, card.rememberCard is true', function() {
                        App.Data.customer.isAuthorized.and.returnValue(true);
                        App.Data.customer.doPayWithToken.and.returnValue(false);
                        App.Data.card.toJSON.and.returnValue({rememberCard: true});
                        App.Data.customer.payments = new Backbone.Model;
                        model.submit_order_and_pay(PAYMENT_TYPE.CREDIT);
                        expectPayWithToken();
                    });

                    it('payment type is credit, customer is authorized, customer.doPayWithToken() is false, card.rememberCard is false, payment.credit_card_dialog is false, card.cardNumber is empty', function() {
                        App.Data.customer.isAuthorized.and.returnValue(true);
                        App.Data.customer.doPayWithToken.and.returnValue(false);
                        App.Data.settings.get_payment_process.and.returnValue({credit_card_dialog: true});
                        App.Data.card.toJSON.and.returnValue({rememberCard: false, cardNumber: ''});
                        App.Data.customer.payments = new Backbone.Model;
                        model.submit_order_and_pay(PAYMENT_TYPE.CREDIT);
                        expectPayWithToken();
                    });
                });

                function expectCreateOrderAndPay() {
                    expect(ajax.url.indexOf('weborders/create_order_and_pay_v1')).not.toBe(-1);
                    expect(App.Data.customer.payWithToken).not.toHaveBeenCalled();
                }

                function expectPayWithToken() {
                    expect($.ajax).not.toHaveBeenCalled();
                    expect(App.Data.customer.payWithToken).toHaveBeenCalled();
                }
            });

            describe('skin paypal', function() {

                beforeEach(function() {
                    App.Data.settings.set('skin', 'paypal');
                });

                it('not order from seat', function() {
                    customer.first_name = 'customer name';
                    checkout.pickupTime = 'pickup time';
                    model.submit_order_and_pay(PAYMENT_TYPE.CREDIT);
                    expect(ajax.data.orderInfo.call_name).toBe('customer name / pickup time');
                });

                it('not order from seat, phone', function() {
                    customer.first_name = 'customer name';
                    checkout.pickupTime = 'pickup time';
                    customer.phone = 'phone';
                    model.submit_order_and_pay(PAYMENT_TYPE.CREDIT);
                    expect(ajax.data.orderInfo.call_name).toBe('customer name / pickup time / phone');
                });

                describe('TODO: other options', function() {

                    beforeEach(function() {
                        App.Data.orderFromSeat = {};
                    });

                    it('all order from seats fields empty', function() {
                        customer.first_name = 'customer name';
                        model.submit_order_and_pay(PAYMENT_TYPE.CREDIT);
                        expect(ajax.data.orderInfo.call_name).toBe('customer name');
                    });
                });
            });

            describe('skin mlb', function() {
                beforeEach(function() {
                    App.Data.settings.set('skin', 'mlb');
                });

                it('default field', function() {
                    customer.first_name = '';
                    model.submit_order_and_pay(PAYMENT_TYPE.CREDIT);
                    expect(ajax.data.orderInfo.call_name).toBe('');
                });
            });

            describe('skin weborder, weborder_mobile', function() {
                beforeEach(function() {
                    App.Data.settings.set('skin', 'weborder');
                });

                it('default field', function() {
                    customer.first_name = '';
                    model.submit_order_and_pay(PAYMENT_TYPE.CREDIT);
                    expect(ajax.data.orderInfo.call_name).toBe('');
                    expect(ajax.data.paymentInfo.phone).toBeUndefined();
                    expect(ajax.data.paymentInfo.email).toBeUndefined();
                    expect(ajax.data.orderInfo.customer.first_name).toBe('');
                    expect(ajax.data.orderInfo.customer.last_name).toBe('');
                });

                it('all field filled', function() {
                    customer.phone = 'phone';
                    customer.email = 'email';
                    customer.first_name = 'first name';
                    customer.last_name = '   last   ';
                    checkout.pickupTime = 'pickup time';

                    model.submit_order_and_pay(PAYMENT_TYPE.CREDIT);
                    expect(ajax.data.orderInfo.call_name).toBe('first name last / pickup time / phone');
                    expect(ajax.data.orderInfo.customer.phone).toBe('phone');
                    expect(ajax.data.orderInfo.customer.email).toBe('email');
                    expect(ajax.data.orderInfo.customer.first_name).toBe('first name');
                    expect(ajax.data.orderInfo.customer.last_name).toBe('last');
                });
            });

            describe('set address for dining option delivery or catering', function() {
                beforeEach(function() {
                    spyOn(App.Data.customer, 'isDefaultShippingAddress');
                    spyOn(model, 'getCustomerAddress').and.returnValue('address');
                });

                it('dining option delivery', function() {
                    checkout.dining_option = 'DINING_OPTION_DELIVERY';
                    model.submit_order_and_pay(PAYMENT_TYPE.CREDIT);
                    expect(model.getCustomerAddress).toHaveBeenCalled();
                    expect(ajax.data.orderInfo.customer.address).toBe('address');
                });

                it('dining option catering', function() {
                    checkout.dining_option = 'DINING_OPTION_CATERING';
                    model.submit_order_and_pay(PAYMENT_TYPE.CREDIT);
                    expect(model.getCustomerAddress).toHaveBeenCalled();
                    expect(ajax.data.orderInfo.customer.address).toBe('address');
                });
            });

            it('payment type = 1', function() {
                App.Data.get_parameters = {
                    tabId: 'tab',
                    customerId: 'customer',
                    locationId: 'location'
                };
                customer.phone = 'phone';
                App.Data.settings.set('skin', App.Skins.PAYPAL);

                model.submit_order_and_pay(1);
                expect(ajax.data.paymentInfo.tabId).toBe('tab');
                expect(ajax.data.paymentInfo.locationId).toBe('location');
                expect(ajax.data.paymentInfo.customerId).toBe('customer');
                expect(ajax.data.orderInfo.customer.phone).toBe('phone');
            });

            describe('payment type = 2', function() {

                it('default', function() {
                    customer.first_name = 'testName';
                    model.submit_order_and_pay(2);

                    expect(ajax.data.orderInfo.customer.first_name).toBe('testName');
                    expect(ajax.data.paymentInfo).toEqual({
                        tip : 1,
                        type : 2,
                        tip_percent: 0,
                        cardInfo : {
                            firstDigits : '',
                            lastDigits : '',
                            firstName : '',
                            lastName : '',
                            address : null
                        }
                    });
                });

                it('with card info and address', function() {
                    card.cardNumber = '12345678901234567890';
                    card.firstName = 'first';
                    card.secondName = 'second';
                    card.street = 'street';
                    card.city = 'city';
                    card.state = 'state';
                    card.zip = 'zip';
                    model.submit_order_and_pay(2);
                    expect(ajax.data.paymentInfo.cardInfo).toEqual({
                        firstDigits : '1234',
                        lastDigits : '7890',
                        firstName : 'first',
                        lastName : 'second',
                        address : {
                            street : 'street',
                            city : 'city',
                            state : 'state',
                            zip : 'zip'
                        }
                    });
                });

                it('direct credit card not paid', function() {
                    payment_process.paypal_direct_credit_card = true;
                    card.cardNumber = '12345678901234567890';
                    card.expMonth = 'month';
                    card.expDate = 'date';
                    card.securityCode = 'sec';
                    model.submit_order_and_pay(2);
                    expect(ajax.data.paymentInfo.cardInfo).toEqual({
                        firstDigits : '1234',
                        lastDigits : '7890',
                        firstName : '',
                        lastName : '',
                        address : null
                    });
                });

                it('cresecure payment fail', function() {
                    App.Settings.payment_processor = {
                        usaepay: false,
                        cresecure: true
                    };
                    payment_process.paypal_direct_credit_card = true;
                    App.Data.get_parameters.pay = 'false';
                    checkout.payment_id = 'pay';
                    model.submit_order_and_pay(2);
                    expect(model.paymentResponse).toEqual({
                        status: 'error',
                        errorMsg: 'Payment canceled.',
                        capturePhase: undefined
                    });
                    expect(model.trigger).toHaveBeenCalledWith('paymentResponse');
                });

                it('usaepay paid success', function() {
                    payment_process.usaepay = true;
                    App.Data.get_parameters = {
                        pay: 'true',
                        UMrefNum: 'ref'
                    };
                    checkout.payment_id = 'pay';
                    model.submit_order_and_pay(2);
                    expect(ajax.data.paymentInfo.transaction_id).toBe('ref');
                });

                it('usaepay paid fail', function() {
                    payment_process.usaepay = true;
                    App.Data.get_parameters = {
                        pay: 'false',
                        UMerror: 'error message'
                    };
                    checkout.payment_id = 'pay';
                    model.submit_order_and_pay(2);
                    expect(model.paymentResponse).toEqual({
                        status: 'error',
                        errorMsg: 'error message',
                        capturePhase: undefined
                    });
                    expect(model.trigger).toHaveBeenCalledWith('paymentResponse');
                });

            });

            describe('payment type = 3', function() {

                it('default', function() {
                    model.submit_order_and_pay(3);
                    expect(ajax.data.paymentInfo).toEqual({
                        tip : 1,
                        type : 3,
                        tip_percent : 0
                    });
                });

                it('paid success', function() {
                    App.Data.get_parameters = {
                        pay: 'true',
                        PayerID: 'id'
                    };
                    checkout.payment_id = 'payment';
                    model.submit_order_and_pay(3);
                    expect(ajax.data.paymentInfo).toEqual({
                        tip : 1,
                        type : 3,
                        tip_percent : 0,
                        payer_id : 'id',
                        payment_id : 'payment'
                    });
                });

                it('paid fail', function() {
                    App.Data.get_parameters.pay = 'false';
                    model.submit_order_and_pay(3);
                    expect(model.paymentResponse).toEqual({
                        status: 'error',
                        errorMsg: 'Payment Canceled',
                        capturePhase: undefined
                    });
                    expect(model.trigger).toHaveBeenCalledWith('paymentResponse');
                });
            });

            describe('notifications', function() {

                it('skin mlb', function() {
                    customer.email = 'email';
                    customer.phone = 'phone';
                    App.Data.settings.set('skin', 'mlb');
                    model.submit_order_and_pay(PAYMENT_TYPE.CREDIT);
                    expect(ajax.data.notifications).toEqual([
                        { skin : 'mlb', type : 'email', destination : 'email' }
                    ]);
                });

                it('skin weborder, weborder_mobile', function() {
                    customer.email = 'email1';
                    App.Data.settings.set('skin', App.Skins.WEBORDER);
                    model.submit_order_and_pay(PAYMENT_TYPE.CREDIT);
                    expect(ajax.data.notifications).toEqual([ { skin : 'weborder', type : 'email', destination : 'email1' } ]);
                });
            });

            describe('rewards card', function() {
                beforeEach(function() {
                    spyOn(model.rewardsCard, 'toJSON').and.callFake(function() {
                        return rewardsCard;
                    });
                });

                it('`rewardsCard.number` doesn\'t exist', function() {
                    rewardsCard = {};

                    model.submit_order_and_pay(PAYMENT_TYPE.CREDIT);
                    expect(ajax.data.orderInfo.rewards_card).toBeUndefined();
                });

                it('`rewardsCard.number` exists, `rewardsCard.discounts` is empty array', function() {
                    rewardsCard = {
                        number: '123',
                        discounts: []
                    };

                    model.submit_order_and_pay(PAYMENT_TYPE.CREDIT);
                    expect(ajax.data.orderInfo.rewards_card.number).toEqual('123');
                });

                it('`rewardsCard.number` and `rewardsCard.discounts` is not empty array', function() {
                    rewardsCard = {
                        number: '123',
                        discounts: [11, 22]
                    };

                    model.submit_order_and_pay(PAYMENT_TYPE.CREDIT);
                    expect(ajax.data.orderInfo.rewards_card.discounts).toEqual([11, 22]);
                });
            });

            describe('payment type = 5 (giftcard)', function() {
                var giftCard = new Backbone.Model({
                    token: 'some token',
                    cardNumber: '123',
                    captchaKey: 'key',
                    captchaValue: 'value'
                });

                beforeEach(function() {
                    this.customer = App.Data.customer;
                    this.giftCard = App.Data.giftcard;

                    App.Data.customer.doPayWithGiftCard = jasmine.createSpy();
                    App.Data.customer.giftCards = {
                        getSelected: function() {
                            return giftCard;
                        }
                    };

                    App.Data.giftcard = giftCard;
                });

                afterEach(function() {
                    App.Data.customer = this.customer;
                    App.Data.giftcard = this.giftCard;
                });

                it('customer.doPayWithGiftCard() returns true', function() {
                    App.Data.customer.doPayWithGiftCard.and.returnValue(true);
                    model.submit_order_and_pay(5);
                    expect(ajax.data.paymentInfo.cardInfo).toEqual({token: 'some token'});
                });

                it('customer.doPayWithGiftCard() returns false', function() {
                    App.Data.customer.doPayWithGiftCard.and.returnValue(false);
                    model.submit_order_and_pay(5);
                    expect(ajax.data.paymentInfo.cardInfo).toEqual({cardNumber : '123', captchaValue : 'value'});
                });
            });

            describe('ajax success', function() {

                beforeEach(function() {
                    model.submit_order_and_pay(2);
                });

                it('status doesn\'t exist or emtpy', function() {
                    var data = {};
                    dfd.resolve(data);

                    expect(model.trigger).toHaveBeenCalledWith('paymentFailed');
                    expect(App.Data.errors.alert.calls.mostRecent().args[0].indexOf(MSG.ERROR_INCORRECT_AJAX_DATA)).not.toBe(-1);
                });

                it('status OK', function() {
                    var data = {status: 'OK'};
                    dfd.resolve(data);

                    expect(model.paymentResponse).toBe(data);
                    expect(model.trigger).toHaveBeenCalledWith('paymentResponse');
                });

                it('status OK, `validationOnly` is true', function() {
                    model.submit_order_and_pay(2, true);
                    var data = {status: 'OK'};
                    dfd.resolve(data);

                    expect(model.trigger).toHaveBeenCalledWith('paymentResponseValid');
                });

                it('status OK, data.balances.stanford exists, `payment_type` is 6 (stanford)', function() {
                    this.stanfordCard = App.Data.stanfordCard;
                    var updatePlans = jasmine.createSpy();
                    App.Data.stanfordCard = {
                        updatePlans: updatePlans,
                        toJSON: function() {
                            return {
                                planId: 1
                            }
                        }
                    };

                    model.submit_order_and_pay(6);

                    var data = {
                        status: 'OK',
                        balances: {
                            stanford: 'stanford balance'
                        }
                    };
                    dfd.resolve(data);

                    expect(updatePlans).toHaveBeenCalledWith('stanford balance');
                    expect(model.trigger).toHaveBeenCalledWith('paymentResponse');

                    App.Data.stanfordCard = this.stanfordCard;
                });


                it('status OK, data.balances.rewards exists', function() {
                    this.rewardsCard = App.Data.myorder.rewardsCard;
                    var resetDataAfterPayment = jasmine.createSpy();
                    App.Data.myorder.rewardsCard = {
                        resetDataAfterPayment: resetDataAfterPayment
                    };

                    var data = {
                        status: 'OK',
                        balances: {
                            rewards: 'rewards balance'
                        }
                    };
                    dfd.resolve(data);

                    expect(resetDataAfterPayment).toHaveBeenCalled();
                    expect(model.trigger).toHaveBeenCalledWith('paymentResponse');

                    App.Data.myorder.rewardsCard = this.rewardsCard;
                });

                it('status REDIRECT', function() {
                    var data = {
                        status: 'REDIRECT',
                        data: {
                            payment_id: 'id'
                        }
                    };
                    spyOn(PaymentProcessor, 'handleRedirect');
                    dfd.resolve(data);
                    //expect(model.checkout.set.calls.allArgs()).toEqual([['payment_id', 'id'],['payment_type', 5]]);
                    expect(PaymentProcessor.handleRedirect).toHaveBeenCalled();
                });

                it('status PAYMENT_INFO_REQUIRED', function() {
                    spyOn(PaymentProcessor, 'handlePaymentDataRequest');
                    var data = {status: 'PAYMENT_INFO_REQUIRED'};
                    dfd.resolve(data);

                    expect(PaymentProcessor.handlePaymentDataRequest).toHaveBeenCalled();
                });

                describe('status INSUFFICIENT_STOCK', function() {
                    var set;

                    beforeEach(function() {
                        spyOn(App.Models.Myorder.prototype, 'get_product').and.returnValue(new Backbone.Model({
                            name: 'name',
                            id: 12,
                            id_category: 123
                        }));
                        spyOn(model, 'remove').and.callFake(function(m){
                            m = Array.prototype.slice.call(m, 0);
                            m.push({silent: true});
                            App.Collections.Myorders.prototype.remove.apply(model, m);
                        });

                        var mock1 = new App.Models.Myorder({name: 'obj1', id_product: 1}),
                            mock2 = new App.Models.Myorder({name: 'obj2', id_product: 2});
                        model.add([mock1, mock2], {silent: true});

                        set = {
                            set: function() {}
                        };
                        this.product = App.Data.products;
                        App.Data.products = {
                            123: {
                                get_product: function() {
                                    return set;
                                }
                            }
                        };
                        spyOn(set, 'set');
                    });

                    afterEach(function() {
                        App.Data.products = this.product;
                    });

                    it('empty responseJSON updated', function() {
                        var data = {
                            status: 'INSUFFICIENT_STOCK',
                            responseJSON: []
                        };
                        dfd.resolve(data);
                        expect(model.trigger.calls.argsFor(0)[1][0].indexOf(MSG.ERROR_INSUFFICIENT_STOCK)).not.toBe(-1);
                    });

                    it('stock become 0', function() {
                        var data = {
                            status: 'INSUFFICIENT_STOCK',
                            responseJSON: [{
                                id: 1,
                                stock_amount: 0
                            }]
                        };
                        dfd.resolve(data);
                        expect(set.set).toHaveBeenCalledWith('active', false);
                        expect(model.length).toBe(1);
                    });

                    it('stock become not 0', function() {
                        var data = {
                            status: 'INSUFFICIENT_STOCK',
                            responseJSON: [{
                                id: 1,
                                stock_amount: 1
                            }]
                        };
                        dfd.resolve(data);
                        expect(set.set).toHaveBeenCalledWith('stock_amount', 1);
                        expect(model.length).toBe(2);

                    });
                });

                it('status ASAP_TIME_SLOT_BUSY', function() {
                    var data = {
                        status: 'ASAP_TIME_SLOT_BUSY',
                        responseJSON: [{
                            asap_pickup_time: '12/21/2015 03:46'
                        }]
                    };
                    dfd.resolve(data);

                    expect(model.trigger).toHaveBeenCalledWith('paymentFailed');
                    expect(App.Data.errors.alert.calls.mostRecent().args[0].indexOf('Selected time is not available. Next available time')).not.toBe(-1);
                });

                it('status ORDERS_PICKUPTIME_LIMIT', function() {
                    var data = {status: 'ORDERS_PICKUPTIME_LIMIT'};
                    dfd.resolve(data);
                    expect(model.trigger).toHaveBeenCalledWith('paymentFailed');
                });

                it('status REWARD CARD UNDEFINED', function() {
                    var data = {
                        status: 'REWARD CARD UNDEFINED'
                    };
                    dfd.resolve(data);
                    expect(model.trigger).toHaveBeenCalledWith('paymentFailed');
                });

                it('DELIVERY_ADDRESS_ERROR', function() {
                    var data = {
                        status: 'DELIVERY_ADDRESS_ERROR',
                        errorMsg: 'delivery address error'
                    };
                    dfd.resolve(data);

                    expect(model.trigger).toHaveBeenCalledWith('paymentFailed');
                    expect(App.Data.errors.alert.calls.mostRecent().args[0]).toBe('delivery address error');
                });

                it('PRODUCTS_NOT_AVAILABLE_FOR_SELECTED_TIME', function() {
                    var errorMsg = 'some product is not available for selected time';
                    var data = {
                        status: 'PRODUCTS_NOT_AVAILABLE_FOR_SELECTED_TIME',
                        errorMsg: errorMsg,
                        responseJSON: {
                            timetables: 'timetables'
                        }
                    };
                    spyOn(window, 'format_timetables');
                    dfd.resolve(data);

                    expect(model.trigger).toHaveBeenCalledWith('paymentFailed');
                    expect(App.Data.errors.alert.calls.mostRecent().args[0].indexOf(errorMsg)).not.toBe(-1);
                });

                it('status OTHER', function() {
                    var data = {status: 'OTHER', errorMsg: 'other'};
                    dfd.resolve(data);
                    expect(model.trigger).toHaveBeenCalledWith('paymentFailed');
                });

                describe('ajax error', function() {
                    beforeEach(function() {
                    });

                    it('general', function() {
                        dfd.rejectWith( ajax, [ {status: 0, statusText: 'error'}, 'error', '' ] );
                        expect(model.paymentResponse).toEqual({
                            status: 'ERROR',
                            errorMsg: MSG.ERROR_SUBMIT_ORDER
                        });

                        expect(model.trigger).toHaveBeenCalledWith('paymentFailed');
                        expect(App.Data.errors.alert.calls.mostRecent().args[0]).toBe(MSG.ERROR_SUBMIT_ORDER);
                    });

                    it('`validationOnly` is true', function() {
                        model.submit_order_and_pay(PAYMENT_TYPE.CREDIT, true);
                        dfd.rejectWith( ajax, [ {status: 0, statusText: 'error'}, 'error', '' ] );
                        expect(model.trigger.calls.mostRecent().args[0]).toBe('paymentFailedValid');
                    });

                    it('`validationOnly` is false, `capturePhase` is true', function() {
                        this.get_params = App.Data.get_parameters;
                        App.Data.get_parameters = {
                            pay: 'true',
                            UMrefNum: 123456
                        };
                        model.submit_order_and_pay(PAYMENT_TYPE.CREDIT, false, true);
                        dfd.rejectWith( ajax, [ {status: 0, statusText: 'error'}, 'error', '' ] );
                        App.Data.get_parameters = this.get_params;
                        expect(model.trigger).toHaveBeenCalledWith('paymentResponse');
                        expect(model.paymentResponse.status).toBe('error');
                        expect(model.paymentResponse.capturePhase).toBe(true);
                    });
                });

            });

        });

        it('getOrderSeatCallName()', function() {
            this.checkout = model.checkout;

            model.checkout = {
                toJSON: function() {
                    return {
                        level: 'level',
                        section: 'section',
                        row: 'row',
                        seat: 'seat'
                    };
                }
            };

            expect(model.getOrderSeatCallName()).toEqual(['Level: level Sect: section Row: row Seat: seat']);
            expect(model.getOrderSeatCallName('phone')).toEqual(['Level: level Sect: section Row: row Seat: seat', 'phone']);

            model.checkout = this.checkout;
        });

        it('getOtherDiningOptionCallName()', function() {
            this.checkout = model.checkout;

            model.checkout = new Backbone.Model({
                other_dining_options: new Backbone.Collection([
                    new Backbone.Model({name: 'Option1', value: 'value1'}),
                    new Backbone.Model({name: 'Option2', value: 'value2'})
                ])
            });

            expect(model.getOtherDiningOptionCallName()).toEqual(['Option1: value1 Option2: value2']);
            expect(model.getOtherDiningOptionCallName('phone')).toEqual(['Option1: value1 Option2: value2', 'phone']);

            model.checkout = this.checkout;
        });

        it('empty_myorder()', function() {
            spyOn(model, 'remove');
            spyOn(model.total, 'empty');
            spyOn(model.checkout, 'set');

            model.empty_myorder();

            expect(model.remove).toHaveBeenCalled();
            expect(model.total.empty).toHaveBeenCalled();
            expect(model.checkout.set).toHaveBeenCalledWith({
                dining_option: 'DINING_OPTION_ONLINE',
                notes: '',
                discount_code: '',
                last_discount_code: ''
            });
        });

        it('removeFreeModifiers()', function() {
            spyOn(App.Models.Myorder.prototype, 'removeFreeModifiers');
            model = new App.Collections.Myorders([new App.Models.Myorder(), new App.Models.Myorder()]);

            model.removeFreeModifiers();
            expect(App.Models.Myorder.prototype.removeFreeModifiers.calls.count()).toBe(2);
        });

        it('clearData()', function() {
            spyOn(model, 'empty_myorder');
            spyOn(model, 'saveOrders');
            model.clearData();

            expect(model.empty_myorder).toHaveBeenCalled();
            expect(model.saveOrders).toHaveBeenCalled();
        });

        describe('isShippingOrderType()', function() {
            beforeEach(function() {
                this.checkout = model.checkout;
                model.checkout = new Backbone.Model({
                    dining_option: 'DINING_OPTION_ONLINE'
                });
            });

            afterEach(function() {
                model.checkout = this.checkout;
            });

            it('dining option is not shipping', function() {
                expect(model.isShippingOrderType()).toBe(false);
            });

            it('dining option is shipping', function() {
                model.checkout.set('dining_option', 'DINING_OPTION_SHIPPING', {silent: true});
                expect(model.isShippingOrderType()).toBe(true);
            });
        });

        describe('savePaymentResponse()', function() {
            beforeEach(function() {
                spyOn(window, 'setData');
            });

            it('called without arguments', function() {
                model.savePaymentResponse();
                expect(window.setData).not.toHaveBeenCalled();
            });

            it('`uid` is not string or empty string', function() {
                model.savePaymentResponse(null);
                expect(window.setData).not.toHaveBeenCalled();

                model.savePaymentResponse('');
                expect(window.setData).not.toHaveBeenCalled();
            });

            it('`uid` is string, `paymentResponse` does not exist', function() {
                this.paymentResponse = undefined;
                model.savePaymentResponse('someUid');
                expect(window.setData).not.toHaveBeenCalled();
            });

            it('`uid` is string, `paymentResponse` exists', function() {
                model.paymentResponse = 'payment response';
                model.savePaymentResponse('someUid');
                expect(window.setData).toHaveBeenCalledWith('someUid.paymentResponse', 'payment response');
            });
        });

        describe('restorePaymentResponse()', function() {
            var getDataSpy;

            beforeEach(function() {
                model.paymentResponse = undefined;
                spyOn(window, 'removeData');
                getDataSpy = spyOn(window, 'getData');
            });

            it('called without arguments', function() {
                expect(model.restorePaymentResponse()).toBeUndefined();
                expectNegative();
            });

            it('`uid` is not string', function() {
                expect(model.restorePaymentResponse(null)).toBeUndefined();
                expectNegative();
            });

            it('`uid` is empty string', function() {
                expect(model.restorePaymentResponse('')).toBeUndefined();
                expectNegative();
            });

            it('`uid` is string, `paymentResponse` has not been found in storage', function() {
                expect(model.restorePaymentResponse('someUid')).toBeUndefined();
                expect(getDataSpy).toHaveBeenCalledWith('someUid.paymentResponse');
                expectNegative();
            });

            it('`uid` is string, `paymentResponse` has been found in storage', function() {
                getDataSpy.and.returnValue('payment response');
                expect(model.restorePaymentResponse('someUid')).toBeTruthy();
                expect(getDataSpy).toHaveBeenCalledWith('someUid.paymentResponse');
                expect(model.paymentResponse).toBe('payment response');
            });

            function expectNegative() {
                expect(model.paymentResponse).toBeUndefined();
                expect(window.removeData).not.toHaveBeenCalled();
            }
        });

        describe('getShippingAddress()', function() {
            var diningOption = '';

            beforeEach(function() {
                this.customer = App.Data.customer;
                App.Data.customer = new Backbone.Model({
                    shipping_address: -1,
                    addresses: ['address 1', 'address 2'],
                    shipping_selected: -1,
                    shipping_services: ['shipping service 1', 'shipping service 2'],
                    deliveryAddressIndex: 0,
                    shippingAddressIndex: 1,
                    cateringAddressIndex: 2
                });
                App.Data.customer.defaults = {
                    shipping_address: -1
                };
            });

            afterEach(function() {
                App.Data.customer = this.customer;
            });

            it('App.Data.customer does not exist', function() {
                App.Data.customer = undefined;
                expect(model.getShippingAddress(diningOption)).toBeUndefined();
            });

            it('dining option is delivery', function() {
                diningOption = 'DINING_OPTION_DELIVERY';
                expect(App.Data.customer.get('deliveryAddressIndex')).toBe(0);
                expect(model.getShippingAddress(diningOption)).toBe(0);
            });

            it('dining option is shipping', function() {
                diningOption = 'DINING_OPTION_SHIPPING';
                expect(App.Data.customer.get('shippingAddressIndex')).toBe(1);
                expect(model.getShippingAddress(diningOption)).toBe(1);
            });

            it('dining option is catering', function() {
                diningOption = 'DINING_OPTION_CATERING';
                expect(App.Data.customer.get('cateringAddressIndex')).toBe(2);
                expect(model.getShippingAddress(diningOption)).toBe(2);
            });

            it('dining option is not shipping or delivery', function() {
                diningOption = 'DINING_OPTION_TOGO';
                expect(model.getShippingAddress(diningOption)).toBe(-1);
                expect(App.Data.customer.get('shipping_address')).toBe(-1);
            });
        });

        describe('getCustomerAddress()', function() {
            var address;

            beforeEach(function() {
                this.customer = App.Data.customer;
                App.Data.customer = new Backbone.Model();
                App.Data.customer.isDefaultShippingAddress = jasmine.createSpy();
                App.Data.customer.getOrderAddress = jasmine.createSpy();

                address = {
                    address: 'test',
                    city: 'test',
                    country: 'test',
                    province: '',
                    state: 'test',
                    street_1: 'test',
                    street_2: '',
                    zipcode: 'test'
                };
            });

            afterEach(function() {
                App.Data.customer = this.customer;
            });

            it('getCustomerAddress', function() {
                App.Data.customer.getOrderAddress.and.returnValue(address);
                expect(model.getCustomerAddress()).toEqual(address);
            });
        });
    });

//===============================================================

    describe('App.Models.MyorderCombo', function() {
        var model;

        beforeEach(function() {
            model = new App.Models.MyorderCombo();
        });

        it('Environment', function() {
            expect(App.Models.MyorderCombo).toBeDefined();
        });

        it('initialize()', function() {
            var update_product_price = spyOn(App.Models.MyorderCombo.prototype, 'update_product_price'),
                update_mdf_sum = spyOn(App.Models.MyorderCombo.prototype, 'update_mdf_sum');

            model = new App.Models.MyorderCombo();
            var product = {
                get_modifiers: function() {}
            };
            spyOn(product, 'get_modifiers');
            spyOn(model, 'get').and.returnValue(product);
            model.set('initial_price', '1');
            expect(update_product_price).toHaveBeenCalled();

            model.set('combo_product_change', '1');
            expect(update_product_price).toHaveBeenCalled();
        });

        describe('add_empty()', function() {
            var id_category = 10,
                id_product = 5,
                dfd = $.Deferred(),
                obj = {
                    get_product: function() {}
                },
                product = new App.Models.Product({is_combo: true});

            dfd.resolve();

            beforeEach(function() {
                App.Data.products[id_category] = new App.Models.Product({
                    init: function() {},
                    get_product: function() {}
                });
                App.Data.modifiers[id_product] = new Backbone.Model();

                spyOn(App.Data.products[id_category], 'get').and.returnValue(obj);
                spyOn(App.Data.products[id_category], 'get_product').and.returnValue(product);
                spyOn(App.Collections.ModifierBlocks, 'init_quick_modifiers').and.returnValue(dfd);
                spyOn(App.Collections.Products, 'init').and.returnValue(dfd);
                spyOn(App.Collections.ProductSets, 'init').and.returnValue(dfd);
                spyOn(obj, 'get_product').and.returnValue();
                spyOn($, 'when').and.returnValue(dfd);
                spyOn(model, 'get_modelsum').and.returnValue(1);
                spyOn(model, 'get_initial_price').and.returnValue(2);
                spyOn(model, 'set');
                spyOn(model, 'update_prices');
                spyOn(model, 'get').and.returnValue(obj);
            });

            it('test function calls', function() {
                model.add_empty(id_product, id_category);
                expect(App.Collections.Products.init).toHaveBeenCalled(); // init products
                expect(App.Collections.ModifierBlocks.init_quick_modifiers).toHaveBeenCalled(); // init modifiers
                expect(App.Data.products[id_category].get_product).toHaveBeenCalledWith(id_product); // get nessesarry product
                expect(model.set.calls.argsFor(0)[0]).toEqual({
                    product: product,
                    id_product : id_product,
                    modifiers: App.Data.modifiers[id_product]
                });
                expect(model.set.calls.argsFor(1)[0]).toEqual({
                    sum: 1,
                    initial_price: 2,
                    upcharge_price : 0,
                    upcharge_name : ''
                });
                expect(model.update_prices).toHaveBeenCalled();
            });
        });

        it('has_child_products()', function() {
            var product = new Backbone.Model(),
                product_sets = new Backbone.Collection();

            product.set('product_sets', product_sets);
            spyOn(model, 'get_product').and.returnValue(product);

            expect(model.has_child_products()).toBe(false);

            product_sets.add({1: 1})
            expect(model.has_child_products()).toBe(true);
        });

        it('find_child_product()', function() {
            var product = new Backbone.Model(),
                product_sets = {
                    find_product: function() {}
                };
            product.get_modifiers = function() {};
            product.set('product_sets', product_sets);
            model.set('product', product);
            spyOn(product_sets, 'find_product');

            model.find_child_product(100);
            expect(product_sets.find_product).toHaveBeenCalledWith(100);
        });

        it('get_product_price()', function() {
            var product = new Backbone.Model();
            product.set('combo_price', 15);
            model.set('product', product, {silent: true});
            expect(model.get_product_price()).toBe(15);
        });

        describe('update_product_price()', function() {
            var product, productData, comboInitialPrice, getInitialPriceSpy,
                orderInitialPrice = 10;

            beforeEach(function() {
                getInitialPriceSpy = spyOn(model, 'get_initial_price');
                spyOn(App.Models.Myorder.prototype, 'get_initial_price').and.returnValue(orderInitialPrice);

                product = new App.Models.Product();
                productData = deepClone(productsData.addJSON_is_combo_true);
            });

            it('collection has combo_saving products. sum of selected products prices less than combo initial price', function() {
                comboInitialPrice = 123;
                getInitialPriceSpy.and.returnValue(comboInitialPrice);
                product.addJSON(productData);
                model.set('product', product, {silent: true});
                expect(model.update_product_price()).toBe(comboInitialPrice);
                expect(model.get('product').get('combo_price')).toBe(comboInitialPrice);
            });

            it('collection has combo_saving products. sum of selected products prices more than combo initial price', function() {
                comboInitialPrice = 0;
                getInitialPriceSpy.and.returnValue(comboInitialPrice);
                product.addJSON(productData);
                model.set('product', product, {silent: true});
                expect(model.update_product_price()).toBe(orderInitialPrice);
                expect(model.get('product').get('combo_price')).toBe(orderInitialPrice);
            });

            it('collection has combo_saving products and weight product. sum of selected products prices more than combo initial price', function() {
                comboInitialPrice = 5;
                productData.product_sets[0].order_products[0].product.sold_by_weight = true;
                productData.product_sets[0].order_products[0].weight = 3;
                getInitialPriceSpy.and.returnValue(comboInitialPrice);
                product.addJSON(productData);
                model.set('product', product, {silent: true});
                expect(model.update_product_price()).toBe(orderInitialPrice * 3);
                expect(model.get('product').get('combo_price')).toBe(orderInitialPrice * 3);
            });

            it('collection doesn\'t have combo_saving products. sum of selected products prices less than combo initial price', function() {
                productData.product_sets[0].is_combo_saving = false;
                productData.product_sets[1].is_combo_saving = false;
                comboInitialPrice = 123;
                getInitialPriceSpy.and.returnValue(comboInitialPrice);
                product.addJSON(productData);
                model.set('product', product, {silent: true});
                expect(model.update_product_price()).toBe(orderInitialPrice * 2);
                expect(model.get('product').get('combo_price')).toBe(orderInitialPrice * 2);
            });

            it('collection doesn\'t have combo_saving products. sum of selected products prices more than combo initial price', function() {
                productData.product_sets[0].is_combo_saving = false;
                productData.product_sets[1].is_combo_saving = false;
                comboInitialPrice = 0;
                getInitialPriceSpy.and.returnValue(comboInitialPrice);
                product.addJSON(productData);
                model.set('product', product, {silent: true});
                expect(model.update_product_price()).toBe(orderInitialPrice * 2);
                expect(model.get('product').get('combo_price')).toBe(orderInitialPrice * 2);
            });
        });

        it('update_mdf_sum()', function() {
            var product = new App.Models.Product(),
                productData = deepClone(productsData.addJSON_is_combo_true);
            product.addJSON(productData);
            model.set({product: product, quantity: 10}, {silent: true});

            var productSets = model.get('product').get('product_sets').get_selected_products();
            spyOn(model, 'update_product_price');
            spyOn(productSets.models[0], 'update_prices');
            spyOn(productSets.models[0], 'update_mdf_sum');
            spyOn(productSets.models[1], 'update_prices');
            spyOn(productSets.models[1], 'update_mdf_sum');

            model.update_mdf_sum();
            expect(model.update_product_price).toHaveBeenCalled();
            expect(productSets.models[0].update_prices).toHaveBeenCalled();
            expect(productSets.models[0].update_mdf_sum).toHaveBeenCalledWith(10);
            expect(productSets.models[1].update_prices).toHaveBeenCalled();
            expect(productSets.models[1].update_mdf_sum).toHaveBeenCalledWith(10);
        });

        describe('check_order()', function() {
            var checkOrderSpy;

            beforeEach(function() {
                checkOrderSpy = spyOn(App.Models.Myorder.prototype, 'check_order').and.returnValue({status: 'OK'});
            });

            it('Myorder.check_order().status is not OK', function() {
                var checkResult = {status: 'error'};
                checkOrderSpy.and.returnValue(checkResult);

                expect(model.check_order()).toEqual(checkResult);
            });

            it('Myorder.check_order().status is OK, `modifiers_only` option is true', function() {
                var checkResult = {status: 'OK'};
                checkOrderSpy.and.returnValue(checkResult);

                expect(model.check_order({modifiers_only: true})).toEqual(checkResult);
            });

            it('combo has no child products', function() {
                var product = new Backbone.Model({
                    name: 'test name',
                    product_sets: []
                })
                model.set('product', product, {silent: true});

                var result = model.check_order();
                expect(result.status).toBe('ERROR');
                expect(result.errorMsg.indexOf('test name')).not.toBe(-1);
            });

            it('product_set selected quantity is less than product_set minimum amount', function() {
                var product = new App.Models.Product(),
                    productData = deepClone(productsData.addJSON_is_combo_true);
                product.addJSON(productData);
                model.set({product: product}, {silent: true});

                var productSets = model.get('product').get('product_sets');
                productSets.models[0].set('minimum_amount', 3);
                spyOn(productSets.models[0], 'get_selected_qty').and.returnValue(10);

                var result = model.check_order();
                expect(result.status).toBe('ERROR');
                expect(result.errorMsg.indexOf('select exact 3 product')).not.toBe(-1);
                expect(result.errorMsg.indexOf('Product set 1')).not.toBe(-1);
            });

            it('product_set selected quantity is more than product_set minimum amount', function() {
                var product = new App.Models.Product(),
                    productData = deepClone(productsData.addJSON_is_combo_true);
                product.addJSON(productData);
                model.set({product: product}, {silent: true});

                var productSets = model.get('product').get('product_sets');
                productSets.models[0].set('minimum_amount', 10);
                spyOn(productSets.models[0], 'get_selected_qty').and.returnValue(1);

                var result = model.check_order();
                expect(result.status).toBe('ERROR');
                expect(result.errorMsg.indexOf('select exact 10 product')).not.toBe(-1);
                expect(result.errorMsg.indexOf('Product set 1')).not.toBe(-1);
            });

            it('product_set selected quantity is equal to product_set minimum amount', function() {
                var product = new App.Models.Product(),
                    productData = deepClone(productsData.addJSON_is_combo_true);
                product.addJSON(productData);
                model.set({product: product}, {silent: true});

                var productSets = model.get('product').get('product_sets');
                productSets.models[0].set('minimum_amount', 10);
                spyOn(productSets.models[0], 'get_selected_qty').and.returnValue(10);

                var result = model.check_order();
                expect(result.status).toBe('OK');
            });
        });

    });

    describe('App.Models.MyorderUpsell', function() {
        var model;

        beforeEach(function() {
            model = new App.Models.MyorderUpsell();
        });

        it('Environment', function() {
            expect(App.Models.MyorderUpsell).toBeDefined();
        });

        describe('update_product_price()', function() {
            var product, productData, comboInitialPrice, getInitialPriceSpy,
                orderInitialPrice = 10;

            beforeEach(function() {
                spyOn(App.Models.Myorder.prototype, 'get_initial_price').and.callFake(function() {
                    return this.get('product').get('price');
                });
                product = new App.Models.Product();
                productData = deepClone(productsData.addJSON_has_upsell_true);
            });

            it('calculation case # 1, saving amount is negative', function() {
                product.addJSON(productData);
                model.set('product', product, {silent: true});
                model.set("upcharge_price", 20, {silent: true});
                expect(model.update_product_price()).toBe(38.3);
                expect(model.get('product').get('combo_price')).toBe(38.3);
            });

            it('calculation case # 2, saving amount is positive', function() {
                product.addJSON(productData);
                model.set('product', product, {silent: true});
                model.get('product').set('price', 38.7, {silent: true});
                model.set("upcharge_price", 5, {silent: true});
                expect(model.update_product_price()).toBe(53.7);
            });

            it('calculation case # 3, saving delta is positive > root product price', function() {
                product.addJSON(productData);
                model.set('product', product, {silent: true});
                model.get('product').set('price', 4.1, {silent: true});
                model.set("upcharge_price", 5, {silent: true});
                expect(model.update_product_price()).toBe(24.0);
            });
        });
    });
//===============================================================

    describe('App.Models.DiscountItem', function() {
        var model;

        beforeEach(function() {
            model = new App.Models.DiscountItem();
        });

        it('Environment', function() {
            expect(App.Models.DiscountItem).toBeDefined();
        });

        it('toString()', function() {
            spyOn(window, 'round_monetary_currency');
            model.set('sum', '3.5', {silent: true});

            model.toString();
            expect(window.round_monetary_currency).toHaveBeenCalledWith('3.5');
        });

        describe('saveDiscount(key)', function() {
            it('called without arguments', function() {
                spyOn(window, 'setData');
                model.saveDiscount();
                expect(window.setData).toHaveBeenCalledWith('orderLevelDiscount', model.toJSON());
            });

            it('called with `key`', function() {
                spyOn(window, 'setData');
                model.saveDiscount('key');
                expect(window.setData).toHaveBeenCalledWith('key', model.toJSON());
            });
        });

        describe('loadDiscount(key)', function() {
            var key;

            it('called without arguments', function() {
                spyOn(window, 'getData').and.returnValue({'orderLevelDiscount': 'discount'});
                model.loadDiscount();
                expect(window.getData).toHaveBeenCalledWith('orderLevelDiscount');
                expect(model.get('orderLevelDiscount')).toBe('discount');
            });

            it('called with `key`', function() {
                spyOn(window, 'getData').and.returnValue({'key': 'discount'});
                model.loadDiscount('key');
                expect(window.getData).toHaveBeenCalledWith('key');
                expect(model.get('key')).toBe('discount');
            });
        });

        it('zero_discount', function() {
            model.set({
                name: 'discount name',
                sum: 5,
                taxed: true,
                id: 123,
                type: 2
            }, {silent: true});

            model.zero_discount();

            expect(model.toJSON()).toEqual({
                name: "No discount",
                sum: 0,
                taxed: false,
                id: null,
                type: 1
            });
        });
    });

//===============================================================

    describe('App.Models.ServiceFeeItem', function() {
        var model;

        beforeEach(function() {
            model = new App.Models.ServiceFeeItem();
        });

        it('enviroment', function() {
            expect(App.Models.ServiceFeeItem).toBeDefined();
        });

        it('initialize()', function() {
            expect(model.get('product') instanceof App.Models.Product).toBe(true);
            expect(model.get('product').get('name')).toBe('default fee');
            expect(model.get('isServiceFee')).toBe(true);
        });
    });

});