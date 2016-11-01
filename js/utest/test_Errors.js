define(['errors'], function() {
    describe("App.Models.Error", function() {

        var model, def, empty, result, skin;

        beforeEach(function() {
            model = new App.Models.Errors();

            skin = App.Skin;
            App.skin = App.Skins.WEBORDER;

            def = {
                "message": "No alert message",
                "reloadPage": false,
                "errorServer": false,
                "typeIcon": "info",
                "isConfirm": false,
                "confirm": {
                    "ok": "OK",
                    "cancel": "Cancel",
                    "btnsSwap": false,
                    "cancelHide": false
                },
                "customView": null,
                "btnDisabled1": false
            }, empty = {
                "message": "No alert message",
                "reloadPage": false,
                "errorServer": false,
                "typeIcon": "info",
                "isConfirm": false,
                "confirm": {
                    "ok": "OK",
                    "cancel": "Cancel",
                    "btnsSwap": false,
                    "cancelHide": false
                },
                "customView": null,
                "defaultView": false,
                "btnText1": "OK",
                "btnText2": "Cancel",
                "btnDisabled1": false
            };
            result = deepClone(empty);
            spyOn(model, 'trigger');
        });

        afterEach(function() {
            App.skin = skin;
        });

        it('Environment', function() {
            expect(App.Models.Errors).toBeDefined();
        });

        it("Create model", function() {
            expect(model.toJSON()).toEqual(def);
        });

        describe("alert()", function() {
            var expectTrigger = function() {
                expect(model.trigger).toHaveBeenCalledWith('alertMessage');
            }

            it('empty arguments', function() {
                model.alert();
                expect(model.toJSON()).toEqual(empty);
                expectTrigger();
            });

            it('`message` as number', function() {
                model.alert(123);
                result.message = '123';
                expect(model.toJSON()).toEqual(result);
                expectTrigger();
            });

            it('`message` as string', function() {
                model.alert('123');
                result.message = '123';
                expect(model.toJSON()).toEqual(result);
                expectTrigger();
            });

            it('`message` as string and `reload_page` as number (12)', function() {
                model.alert('123', 12);
                result.message = '123';
                result.reloadPage = true;
                expect(model.toJSON()).toEqual(result);
                expectTrigger();
            });

            it('`message` as string and `reload_page` as null', function() {
                model.alert('123', null);
                result.message = '123';
                expect(model.toJSON()).toEqual(result);
                expectTrigger();
            });

            it('`message` as string and `reload_page` as boolean (true)', function() {
                model.alert('123', true);
                result.message = '123';
                result.reloadPage = true;
                expect(model.toJSON()).toEqual(result);
                expectTrigger();
            });

            it('`default view` is true', function() {
                model.alert(null, null, true);
                result.defaultView = true;
                expect(model.toJSON()).toEqual(result);
                expectTrigger();

                model.alert(null, null, 'true');
                result.defaultView = true;
                expect(model.toJSON()).toEqual(result);
                expectTrigger();

                model.alert(null, null, 12);
                result.defaultView = true;
                expect(model.toJSON()).toEqual(result);
                expectTrigger();
            });

            it('`options.isConfirm` is false, skin is Weborder Mobile', function() {
                var skin = App.skin;
                App.skin = App.Skins.WEBORDER_MOBILE;
                model.alert(null, null, true);
                result.defaultView = true;
                expect(model.toJSON()).toEqual(result);
                expectTrigger();
                App.skin = skin;
            });

            it('skin is Directory or Directory Mobile', function() {
                var skin = App.skin;

                // directory mobile
                App.skin = App.Skins.DIRECTORY_MOBILE;

                model.alert(null, null, true);
                result.defaultView = true;
                expect(model.toJSON()).toEqual(result);
                expectTrigger();

                model.alert(null, null, false);
                result.defaultView = false;
                expect(model.toJSON()).toEqual(result);
                expectTrigger();

                // directory
                App.skin = App.Skins.DIRECTORY;

                model.alert(null, null, true);
                result.defaultView = true;
                expect(model.toJSON()).toEqual(result);
                expectTrigger();

                model.alert(null, null, false);
                result.defaultView = false;
                expect(model.toJSON()).toEqual(result);
                expectTrigger();

                App.skin = skin;
            });

            it('`options.isConfirm` is true', function() {
                model.alert(null, null, null, {isConfirm: true});
                result.isConfirm = true;
                expect(model.toJSON()).toEqual(result);
                expectTrigger();
            });

            it('`options.isConfirm` is true, `options.confirm.ok` exists', function() {
                var confirm = {
                    ok: 'yep!'
                };
                model.alert(null, null, null, {isConfirm: true, confirm: confirm});
                result.isConfirm = true;
                result.confirm = confirm;
                result.btnText1 = confirm.ok;
                expect(model.toJSON()).toEqual(result);
                expectTrigger();
            });

            it('`options.isConfirm` is true, `options.confirm.ok` exists, `options.confirm.cancel` exists', function() {
                var confirm = {
                    ok: 'yep!',
                    cancel: 'no thanks'
                };
                model.alert(null, null, null, {isConfirm: true, confirm: confirm});
                result.isConfirm = true;
                result.confirm = confirm;
                result.btnText1 = confirm.ok;
                result.btnText2 = confirm.cancel;
                expect(model.toJSON()).toEqual(result);
                expectTrigger();
            });
        });
    });
});