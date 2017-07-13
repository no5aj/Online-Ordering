define(['js/utest/data/Categories', 'categories'], function(categories) {
    'use strict';

    describe("App.Models.Categories", function() {

        var def, model,
            settings = App.Data.settings;

        beforeEach(function() {
            model = new App.Models.Category();
            def = {
                description: '',
                id: null,
                image: settings.get_img_default(),
                name: null,
                parent_name: null,
                parent_sort: null,
                sort: null,
                sort_val: null,
                img: settings.get('img_path'),
                active: true,
                timetables: null
            };
        });

        it('Environment', function() {
            expect(App.Models.Category).toBeDefined();
        });

        it('Create default App.Models.Category', function() {
            var modelJS = model.toJSON();
            if (modelJS.image != def.image) {
                log('Category Test Error found =>');
                log('skin_img_default = ', settings.get('settings_skin').img_default);
                log('get_img_default() = ', settings.get_img_default());
            }

            expect(modelJS).toEqual(def);
        });

    });

    describe("App.Collections.Categories", function() {

        var model, success, error, id, arg, host,
            ajaxStub = function() {
                success = arguments[0].successResp;
                error = arguments[0].error;
                arg = arguments;
            },
            settings = App.Data.settings;

        beforeEach(function() {
            model = new App.Collections.Categories();
            host = App.Data.settings.get('host');
            id = {
                description: null,
                id: 50,
                image: settings.get_img_default(),
                name: 'sub2',
                parent_name: 'Menu2',
                parent_sort: 5,
                sort: 1,
                sort_val: 5001,
                img: settings.get('img_path'),
                active: true,
                timetables: null
            };
        });

        it('Environment', function() {
            expect(App.Collections.Categories).toBeDefined();
        });

        it("get_categories()", function() {
            expect(model.selected).toBeNull();
            expect(model.parent_selected).toBeNull();
            spyOn($,'ajax').and.callFake(ajaxStub);
            model.get_categories();
            error();
            success(categories);
            expect(model.length).toBe(4);
            expect(arg[0].url).toBe(host + "/weborders/product_categories/");
            expect(model.get(50).toJSON()).toEqual(id);
            expect(model.selected).toBe(0);
            expect(model.parent_selected).toBe(0);
        });

        it("set_inactive()", function() {
            model.add(categories);
            model.set_inactive(50);
            expect(model.get(50).get('active')).toBe(false);
            model.remove(categories);
        });

        it('getParents()', function() {
            model.add(categories);
            var parents = model.getParents();

            expect(parents[0].ids).toBe('50');
            expect(parents[0].name).toBe('Menu2');
            expect(parents[0].subs.length).toBe(1);
            expect(parents[0].subs[0].id).toBe(50);

            expect(parents[1].ids).toBe('28,29');
            expect(parents[1].name).toBe('MENU');
            expect(parents[1].subs.length).toBe(2);
            expect(parents[1].subs[0].id).toBe(28);
            expect(parents[1].subs[1].id).toBe(29);
        });

    });
});