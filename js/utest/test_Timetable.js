define(['js/utest/data/Timetable', 'timetable'], function(timetables) {

    describe('App.Models.WorkingDay', function() {
        var model, def, set0, set01, set1, set1n, set2, set2n, set3, set4, set4n, defSet1, defSet2, timeSettings, times = [];

        beforeEach(function() {
            def =  {
                timetable: [],
                options: [],
                curTime: null
            },
            set01 = {
                timetable: false,
                curTime: new Date(2013, 10, 10)
            },
            set0 = {
                timetable: null,
                curTime: new Date(2013, 10, 10)
            },
            set1 = {
                timetable: [{to: "11:00", from: "09:00"}],
                curTime: new Date(2013, 10, 10)
            },
            set1n = [{to: 660, from: 540}],
            defSet1 = {
                timetable: [{to: "11:00", from: "09:00"}],
                options: [],
                curTime: new Date(2013, 10, 10)
            },
            set2 = {
                timetable: [{to: "12:00", from: "09:20"}, {to: "11:30", from: "09:00"}],
                curTime: new Date(2013, 10, 10)
            },
            set2n = [{to: 720, from: 560}, {to: 690, from: 540}],
            defSet2 = {
                timetable: [{to: "12:00", from: "09:20"}, {to: "11:30", from: "09:00"}],
                options: [],
                curTime: new Date(2013, 10, 10)
            },
            set3 = {
                timetable: [{to: "11:00", from: "10:10"}],
                curTime: new Date(2013, 10, 10)
            },
            set4 = {
                timetable: [{to: "13:00", from: "10:00"}],
                curTime: new Date(2013, 10, 10)
            },
            set4n = [{to: 780, from: 600}];
            for(var i = 1, j = 5; i <= j; i++) {
                times[i] = deepClone(timetables['times' + i]);
            }

            this.settings = deepClone(App.Data.settings.get('settings_system'));
            timeSettings = {
                estimated_delivery_time: 45,
                estimated_order_preparation_time: 17,
                online_order_time_slot: 20,
                online_order_start_time_offset: 25,
                online_order_end_time_offset: 35,
                enable_asap_due_time: true,
                online_order_date_range: 100
            };

            App.Settings.online_order_date_range = 7;
            var system = App.Data.settings.get('settings_system');
            system.estimated_delivery_time = timeSettings.estimated_delivery_time;
            system.estimated_order_preparation_time = timeSettings.estimated_order_preparation_time;
            system.online_order_time_slot = timeSettings.online_order_time_slot;
            system.online_order_start_time_offset = timeSettings.online_order_start_time_offset;
            system.online_order_end_time_offset = timeSettings.online_order_end_time_offset;
            system.enable_asap_due_time = timeSettings.enable_asap_due_time;
            model = new App.Models.WorkingDay();
        });

        afterEach(function() {
            App.Data.settings.set('settings_system', this.settings);
            App.Settings = App.Data.settings.get('settings_system');
        });


        it("Environment", function() {
            expect(App.Models.WorkingDay).toBeDefined();
        });

        // App.Models.WorkingDay
        it("Create App.Models.WorkingDay", function() {
           expect(model.toJSON()).toEqual(def);

           model.set(set1);
           expect(model.toJSON()).toEqual(defSet1);
        });

        // App.Models.WorkingDay Initialization settings
        it("Initialization parameters App.Models.WorkingDay", function() {
           expect(model.pickup_time_interval).toBe(timeSettings.online_order_time_slot);
           expect(model.start_time).toBe(timeSettings.online_order_start_time_offset);
           expect(model.end_time).toBe(timeSettings.online_order_end_time_offset);
           expect(model.delivery_time).toBe(timeSettings.estimated_delivery_time);
           expect(model.preparation_time).toBe(timeSettings.estimated_order_preparation_time);
        });

        // App.Models.WorkingDay function update
        it("update()", function() {
           model.set(set1);
           model.update(set2);
           expect(model.toJSON()).toEqual(defSet2);
        });

        // App.Models.WorkingDay function get_dining_offset
        it("get_dining_offset()", function() {
           expect(model.get_dining_offset()).toEqual(timeSettings.estimated_order_preparation_time * 60 * 1000);
           expect(model.get_dining_offset(true)).toEqual(timeSettings.estimated_delivery_time * 60 * 1000);
        });

        // App.Models.WorkingDay function _isAllTheDay
        describe("_isAllTheDay()", function() {

            it('timetable is null', function() {
                model.set('timetable', null);
                expect(model._isAllTheDay()).toBe(true);
            });

            it('timetable is true', function() {
                model.set('timetable', true);
                expect(model._isAllTheDay()).toBe(true);
            });

            it('timetable is false', function() {
                model.set('timetable', false);
                expect(model._isAllTheDay()).toBe(false);
            });

            it('timetable is array', function() {
                model.set('timetable', []);
                expect(model._isAllTheDay()).toBe(false);
            });
        });

        // App.Models.WorkingDay function _isClosedToday
        describe("_isClosedToday()", function() {

            it('timetable is false', function() {
                model.set('timetable', false);
                expect(model._isClosedToday()).toBe(true);
            });

            it('timetable is []', function() {
                model.set('timetable', []);
                expect(model._isClosedToday()).toBe(true);
            });

            it('timetable is true', function() {
                model.set('timetable', true);
                expect(model._isClosedToday()).toBe(false);
            });
        });

        // App.Models.WorkingDay function _pickupTimesForPeriod
        describe("_pickupTimesForPeriod()", function() {

            beforeEach(function() {
               model.set(set1);
            });

            it('from 09:00 to 11:30', function() {
                expect(model._pickupTimesForPeriod(set2n[1])).toEqual([582, 602, 622, 642, 662]);
                /**
                 * 9:00 + online_order_start_time_offset + estimated_order_preparation_time  = 9:42
                 * 11:30 - (online_order_end_time_offset - estimated_order_preparation_time) = 11:12
                 * 9:42 <= pickup time <= 11:29
                 *
                 * 9:42 = 9 * 60 + 42 = 582
                 * 10:02
                 * 10:22
                 * 10:42
                 * 11:02
                 */
            });

            it('from 10:00 to 13:00, delivery option', function() {
                model.set(set4);
                expect(model._pickupTimesForPeriod(set4n[0], true)).toEqual([670, 690, 710, 730]);
                /**
                 * 10:00 + online_order_start_time_offset + estimated_delivery_time = 11:10
                 * 13:00 - (online_order_end_time_offset - estimated_delivery_time) = 13:10
                 * 11:10 <= delivery time <= 13:10
                 *
                 * 11:10 = 11 * 60 + 10 = 670
                 * 11:30
                 * 11:50
                 * 12:10
                 * 12:30
                 * 12:50
                 * 13:10
                 */
            });

            it('from 10:10 to 11:00', function() {
                expect(model._pickupTimesForPeriod(set3.timetable[0])).toEqual([]);
            });

            it('all the day', function() {
                expect(model._pickupTimesForPeriod('all-the-day')).toEqual(times[2]);
            });
        });

        // App.Models.WorkingDay function _unionPeriods
        describe("_unionPeriods()", function() {

            it('Empty array', function() {
                expect(model._unionPeriods([])).toEqual([]);
            });

            it('Single period', function() {
                expect(model._unionPeriods([{to: "12:00", from: "09:00"}])).toEqual([{to: 720, from: 540}]);
            });

            it('Merge two into one period 1212', function() {
                expect(model._unionPeriods([{to: "12:00", from: "09:20"}, {to: "11:30", from: "09:00"}])).toEqual([{to: 720, from: 540}]);
            });

            it('Merge two into one period 1221', function() {
                expect(model._unionPeriods([{to: "12:00", from: "09:00"}, {to: "11:30", from: "09:00"}])).toEqual([{to: 720, from: 540}]);
            });

            it('Not merged periods', function() {
                expect(model._unionPeriods([{to: "12:00", from: "09:20"}, {to: "21:30", from: "19:00"}])).toEqual([{to: 720, from: 560}, {to: 1290, from: 1140}]);
            });

            it('Combine merged and not merged periods', function() {
                expect(model._unionPeriods([{to: "12:00", from: "09:20"}, {to: "11:00", from: "09:00"}, {to: "21:30", from: "19:00"}])).
                        toEqual([{to: 720, from: 540}, {to: 1290, from: 1140}]);
            });
        });


        // App.Models.WorkingDay function _pickupSumTimes
        describe("_pickupSumTimes()", function() {

            var times2, func;

            beforeEach(function() {
               times2 = deepClone(timetables.times2);
               func = spyOn(App.Models.WorkingDay.prototype, "_pickupTimesForPeriod").and.returnValue([]);
            });

            it('all the day table', function() {
                spyOn(App.Models.WorkingDay.prototype, "_isAllTheDay").and.returnValue(true);
                model._pickupSumTimes();
                expect(func).toHaveBeenCalledWith('all-the-day');
            });

            it('not all the day and closed all day', function() {
                spyOn(App.Models.WorkingDay.prototype, "_isAllTheDay").and.returnValue(false);
                spyOn(App.Models.WorkingDay.prototype, "_isClosedToday").and.returnValue(true);
                expect(model._pickupSumTimes()).toEqual([]);
                expect(func).not.toHaveBeenCalled();
            });

            it('from 09:00 to 11:30', function() {
                spyOn(App.Models.WorkingDay.prototype, "_isAllTheDay").and.returnValue(false);
                spyOn(App.Models.WorkingDay.prototype, "_isClosedToday").and.returnValue(false);
                model.update(set1);
                model._pickupSumTimes();
                expect(func).toHaveBeenCalledWith(set1n[0], undefined);
                expect(func.calls.count()).toBe(1);
            });

            it('from 10:00 to 14:00. check delivery option', function() {
                spyOn(App.Models.WorkingDay.prototype, "_isAllTheDay").and.returnValue(false);
                spyOn(App.Models.WorkingDay.prototype, "_isClosedToday").and.returnValue(false);
                model.update(set4);
                model._pickupSumTimes(true);
                expect(func).toHaveBeenCalledWith(set4n[0], true);
                expect(func.calls.count()).toBe(1);
            });

            // should call _pickupTimesForPeriod with 9:00 to 12:00
            it('from 09:00 to 11:30 and from 09:20 to 12:00. check functions calls', function() {
                var val = [{to: 720, from: 540}];
                spyOn(App.Models.WorkingDay.prototype, "_isAllTheDay").and.returnValue(false);
                spyOn(App.Models.WorkingDay.prototype, "_isClosedToday").and.returnValue(false);
                spyOn(App.Models.WorkingDay.prototype, "_unionPeriods").and.returnValue(val);
                model.update(set2);
                model._pickupSumTimes();
                expect(func.calls.count()).toBe(1);
                expect(func.calls.argsFor(0)[0]).toBe(val[0]);
            });
        });

        // App.Models.WorkingDay function checking_work_shop
        describe("checking_work_shop()", function() {

            beforeEach(function() {
               spyOn(model, '_unionPeriods').and.returnValue(set4n);
               model.set(set4);
            });

            it('closed', function() {
                model.set('timetable', false);
                expect(model.checking_work_shop()).toBe(false);
            });

            it('always open', function() {
                model.set('timetable', true);
                expect(model.checking_work_shop()).toBe(true);

                model.set('timetable', null);
                expect(model.checking_work_shop()).toBe(true);
            });

            it('timetable is defined, time not in every period', function() {
                model.set('curTime', new Date(2014, 3, 10, 14, 00));
                expect(model.checking_work_shop()).toBe(false);
            });

            it('timetable is defined, time in offset period', function() {
                /**
                 * working time:
                 * 10:00 + online_order_start_time_offset = 10:25
                 * 13:00 - (online_order_end_time_offset - estimated_order_preparation_time) = 12:42
                 */
                model.set('curTime', new Date(2014, 3, 10, 10, 20));
                expect(model.checking_work_shop()).toBe(false);

                model.set('curTime', new Date(2014, 3, 10, 13, 00));
                expect(model.checking_work_shop()).toBe(false);

            });

            it('timetable is defined, time in preparation offset period', function() {
                model.set('curTime', new Date(2014, 3, 10, 10, 40));
                expect(model.checking_work_shop()).toBe(true);

                model.set('curTime', new Date(2014, 3, 10, 12, 43));
                expect(model.checking_work_shop()).toBe(false);
            });

            it('timetable is defined, time in delivery offset period', function() {
                /**
                 * 10:00 + online_order_start_time_offset = 10:25
                 * 13:00 - (online_order_end_time_offset - estimated_delivery_time) = 13:10
                 */
                model.set('curTime', new Date(2014, 3, 10, 11, 09));
                expect(model.checking_work_shop(true)).toBe(true);

                model.set('curTime', new Date(2014, 3, 10, 13, 11));
                expect(model.checking_work_shop(true)).toBe(false);
            });

            it('timetable is defined, time inside available period', function() {
                model.set('curTime', new Date(2014, 3, 10, 11, 15));
                expect(model.checking_work_shop(true)).toBe(true);

                model.set('curTime', new Date(2014, 3, 10, 11, 41));
                expect(model.checking_work_shop()).toBe(true);
            });
        });

        // App.Models.WorkingDay function pickupTimeOptions
        describe("pickupTimeOptions()", function() {

            var func, array = [];

            beforeEach(function() {
               func = spyOn(App.Models.WorkingDay.prototype, "_pickupSumTimes").and.callFake(function() { return array; });
            });

            it('_pickupSumTimes arguments calls without delivery', function() {
                spyOn(model, 'checking_work_shop')
                model.pickupTimeOptions();
                expect(func).toHaveBeenCalledWith(undefined);
            });

            it('_pickupSumTimes arguments calls with delivery', function() {
                spyOn(model, 'checking_work_shop');
                model.pickupTimeOptions({today: false, isDelivery: true});
                expect(func).toHaveBeenCalledWith(true);
            });

            it('empty available pickuptime array', function() {
                spyOn(model, 'checking_work_shop');
                array = [];
                expect(model.pickupTimeOptions()).toEqual(['closed']);
            });

            it('10:00 and 10:20 pickup times and curTime 9:40 preparation time 17 delivery false', function() {
                App.Data.settings.get('settings_system').time_format = "12 hour";
                array = times[1];
                model.update({curTime: new Date(2013, 10, 10, 9, 40)});
                expect(model.pickupTimeOptions()).toEqual(["10:00am", "10:20am"]);
            });

            it('10:00 and 10:20 pickup times and curTime 9:50 preparation time 17 delivery false today true', function() {
                App.Data.settings.get('settings_system').time_format = "12 hour";
                array = times[1];
                model.update({curTime: new Date(2013, 10, 10, 9, 50)});
                expect(model.pickupTimeOptions({today: true})).toEqual(["ASAP (17 min)", "10:20am"]);
            });

            it('10:00 and 10:20 pickup times and curTime 10:10 preparation time 0 delivery false today true', function() {
                App.Data.settings.get('settings_system').time_format = "12 hour";
                array = times[1];
                model.preparation_time = 0;
                model.update({curTime: new Date(2013, 10, 10, 10, 10)});
                expect(model.pickupTimeOptions({today: true})).toEqual(["ASAP", "10:20am"]);
            });

            it('10:00 pickup times, curTime 10:10, delivery false, today true, checking_work_shop true ', function() {
                array = [times[1][0]];
                spyOn(model, 'checking_work_shop').and.returnValue(true);
                model.update({curTime: new Date(2013, 10, 10, 10, 10)});
                expect(model.pickupTimeOptions({today: true})).toEqual(["ASAP (17 min)"]);
            });

            it('10:00 pickup times, curTime 10:10, delivery false, today true, checking_work_shop false ', function() {
                array = [times[1][0]];
                spyOn(model, 'checking_work_shop').and.returnValue(false);
                model.update({curTime: new Date(2013, 10, 10, 10, 10)});
                expect(model.pickupTimeOptions({today: true})).toEqual(["closed"]);
            });

            it('empty pickup times, curTime 10:10, delivery false, today true, checking_work_shop true ', function() {
                array = [];
                spyOn(model, 'checking_work_shop').and.returnValue(true);
                model.update({curTime: new Date(2013, 10, 10, 10, 10)});
                expect(model.pickupTimeOptions({today: true})).toEqual(["ASAP (17 min)"]);
            });

            it('10:00 and 10:20 pickup times and curTime 9:50 preparation time 17 delivery false today false', function() {
                App.Data.settings.get('settings_system').time_format = "12 hour";
                array = times[1];
                model.update({curTime: new Date(2013, 10, 10, 9, 50)});
                expect(model.pickupTimeOptions()).toEqual(["10:00am", "10:20am"]);
            });
        });

        describe("getLastPTforPeriod()", function() {

            var time, time1;

            beforeEach(function() {
               time = new Date(2013, 10, 10, 10, 55),
               time1 = new Date(2013, 10, 10, 11, 00);
            });

            it('all the day', function() {
                spyOn(App.Models.WorkingDay.prototype, "_isAllTheDay").and.returnValue(true);
                expect(model.getLastPTforPeriod(time)).toBe('all-the-day');
            });

            it('empty available pickup times', function() {
                spyOn(App.Models.WorkingDay.prototype, "_isAllTheDay").and.returnValue(false);
                spyOn(App.Models.WorkingDay.prototype, "_pickupSumTimes").and.returnValue([]);
                expect(model.getLastPTforPeriod(time)).toBe('not-found');
            });

            it('not found pickup time more than current time', function() {
                spyOn(App.Models.WorkingDay.prototype, "_isAllTheDay").and.returnValue(false);
                spyOn(App.Models.WorkingDay.prototype, "_pickupSumTimes").and.returnValue([650]);
                expect(model.getLastPTforPeriod(time)).toBe('not-found');
            });

            it('found pickup time less than current time', function() {
                spyOn(App.Models.WorkingDay.prototype, "_isAllTheDay").and.returnValue(false);
                spyOn(App.Models.WorkingDay.prototype, "_pickupSumTimes").and.returnValue([660]);
                expect(model.getLastPTforPeriod(time).getTime()).toBe(time1.getTime());
            });

            it('test delivery options', function() {
                spyOn(App.Models.WorkingDay.prototype, "_isAllTheDay").and.returnValue(false);
                var func = spyOn(App.Models.WorkingDay.prototype, "_pickupSumTimes").and.returnValue([]);
                model.getLastPTforPeriod(time, true);
                expect(func).toHaveBeenCalledWith(true);
            });
        });

    });

    describe('App.Models.Timetable', function() {

        var model, def, timetable, month, weekDays, dateFake = function() {
            this.getTime = function() {
                return 1390396163616;
            };
            return 'Wed Jan 22 2014 16:09:23 GMT+0300 (MSK)';
        };

        beforeEach(function () {
            this.working_day = App.Models.WorkingDay;
            App.Models.WorkingDay = Backbone.Model.extend({
                update: function() {},
                get_dining_offset: function() {},
                pickupTimeOptions: function() {},
                checking_work_shop: function() {},
                getLastPTforPeriod: function() { return "all-the-day"; },
                _isClosedToday: function() {}

            });
            this.timetables = App.Data.settings.get("settings_system").timetables;
            this.server_time = App.Data.settings.get("settings_system").server_time;
            this.online_order_date_range = App.Data.settings.get('settings_system').online_order_date_range;
            App.Data.settings.get("settings_system").timetables = [];
            App.Data.settings.get("settings_system").holidays = [];
            App.Data.settings.get("settings_system").server_time = 0;
            App.Settings = App.Data.settings.get('settings_system');

            model = new App.Models.Timetable();

            timetable = deepClone(timetables.timetable);
            month = deepClone(timetables.month);
            weekDays = deepClone(timetables.weekDays);
            def = {
                timetables: [],
                server_time: 0,
                holidays: [],
                hours: null,
                time_format: App.Settings.time_format
            };
        });

        afterEach(function() {
            App.Data.settings.get("settings_system").timetables = this.timetables;
            App.Data.settings.get("settings_system").server_time = this.server_time;
            App.Data.settings.get('settings_system').online_order_date_range = this.online_order_date_range;
            App.Models.WorkingDay = this.working_day;
        });

        it("Environment", function() {
            expect(App.Models.Timetable).toBeDefined();
        });

        it("Create App.Models.Timetable", function() {
            expect(model.workingDay.__proto__).toEqual(App.Models.WorkingDay.prototype);
            expect(model.toJSON()).toEqual(def);
        });

        it('_get_month_id()', function() {
            var res = month.filter(function(element, i) {
                return model._get_month_id(element) !== i;
            });
            expect(res.length).toBe(0);
        });

        it('get_day_of_week()', function() {
            var res = weekDays.filter(function(element, i) {
                return model.get_day_of_week(i) !== element;
            });
            expect(res.length).toBe(0);
        });

        it('current_dining_time()', function() {
            var date = new Date(),
                base = spyOn(App.Models.Timetable.prototype,'base').and.returnValue(date),
                offset = spyOn(App.Models.WorkingDay.prototype,'get_dining_offset').and.returnValue(10);

            expect(model.current_dining_time('param').getTime()).toBe(date.getTime() + 10);
            expect(offset).toHaveBeenCalledWith('param');
        });

        it('get_current_time()', function() {
            var date = new Date(),
                date2 = new Date(date.getTime() - 1000);

            expect(model.get_current_time(date).getTime()).toBe(date.getTime());

            model.set('server_time', -1000);
            expect(model.get_current_time(date).getTime()).toBe(date2.getTime());
        });

        it('base()', function() {
            spyOn(window, 'Date').and.callFake(dateFake);
            spyOn(model, 'get_current_time');
            model.base();

            expect(model.get_current_time).toHaveBeenCalled();
            expect(model.get_current_time.calls.mostRecent().args[0].getTime()).toBe(new dateFake().getTime());
        });

        describe('_get_timetable()', function() {
            var date = new Date(2014, 0, 22),
                date2 = new Date(2014, 0, 1),
                date3 = new Date(2014, 1, 2),
                date5 = new Date(2014, 3, 6); // April 6 sunday

            it('empty timetables', function() {
                expect(model._get_timetable(date)).toBeNull();
            });

            it('closed', function() {
                model.set('timetables', timetable);
                expect(model._get_timetable(date)).toBe(false);
            });

            it('always open', function() {
                model.set('timetables', timetable);
                expect(model._get_timetable(date2)).toEqual({});

                expect(model._get_timetable(date3)).toEqual({});
            });

            it('timetable is defined', function() {
                model.set('timetables', timetable);

                expect(model._get_timetable(date5)).toEqual(timetable[2].timetable_data);
            });

            it('timetable across year', function() {
                model.set('timetables', deepClone(timetables.timetable3));

                expect(model._get_timetable(date2)).toEqual({});
            });

        });

        describe('_get_timetable() for an open EndDate interval', function() {
            var date = new Date(2014, 0, 22),// Wed Jan 22
                date2 = new Date(2014, 3, 6), // April 6 sunday
                date3 = new Date(2014, 1, 2); // Feb 2
                var timetable6 = deepClone(timetables.timetable6);

            it('empty timetables', function() {
                expect(model._get_timetable(date)).toBeNull();
            });

            it('closed', function() {
                model.set('timetables', timetable6);
                expect(model._get_timetable(date)).toBe(false);
            });

            it('always open', function() {
                model.set('timetables', timetable6);
                expect(model._get_timetable(date2)).toEqual({});
            });

            it('timetable is defined', function() {
                model.set('timetables', timetable6);
                expect(model._get_timetable(date3)).toEqual(timetable6[1].timetable_data);
            });
        });

        describe("isHoliday()", function() {
            var date = new Date(2014, 0, 22),
                dateBase = new Date(date);

            it('Timetable does not contain _testCurTime field', function() {
                expect(model.get("_testCurTime")).toBeUndefined();
            });

            var set1 = {
                timetables: timetable,
                holidays: [{date:"Jan, 1", name:"Holiday#1"}],
                _testCurTime: new Date(2020, 0, 1)
            }
            it('Jan-1 and cur_time = Jan-1-2020', function() {
                model.set(set1);
                expect(model.isHoliday(model.get("_testCurTime"))).toEqual( true );
            });

            var set2 = {
                timetables: timetable,
                holidays: [{date:"Jan, 2", name:"Holiday#1"}],
                _testCurTime: new Date(2020, 0, 1)
            };
            it('Jan-2 and cur_time = Jan-1-2020', function() {
                model.set(set2);
                expect(model.isHoliday(model.get("_testCurTime"))).toEqual( false );
            });

            var set3 = {
                holidays: [{date:"Feb, 5", name:"H1"}, {date:"Mar, 17", name:"H2"}, {date:"Apr, 5", name:""}],
                _testCurTime: new Date(2014, 3, 5)
            };
            it('[Feb-5, Mar-17, Apr-5] and cur_time = Apr-5', function() {
                model.set(set3);
                expect(model.isHoliday(model.get("_testCurTime"))).toEqual( true );
            });

            var set4 = {
                holidays: [{date:"Feb, 5", name:"H1"}, {date:"Mar, 17", name:"H2"}, {date:"Apr, 5", name:""}],
                _testCurTime: new Date(2014, 2, 18)
            };
            it('[Feb-5, Mar-17, Apr-5] and cur_time = Mar-18', function() {
                model.set(set4);
                expect(model.isHoliday(model.get("_testCurTime"))).toEqual( false );
            });

            it('`holidays` is null or not array or empty array', function() {
                model.set('holidays', null);
                expect(model.isHoliday(model.get("_testCurTime"))).toBe(false);

                model.set('holidays', '');
                expect(model.isHoliday(model.get("_testCurTime"))).toBe(false);

                model.set('holidays', []);
                expect(model.isHoliday(model.get("_testCurTime"))).toBe(false);
            });

            it('without arguments', function() {
                spyOn(model, 'base').and.callFake(function() {
                    return dateBase;
                });

                model.set('holidays', [{date:"Jan, 1", name:"Holiday#1"}]);
                expect(model.isHoliday()).toBe(false);
                expect(model.base).toHaveBeenCalled();
            });
        });

        describe('get_working_hours()', function() {
            var date = new Date(2014, 0, 22),
                date2 = new Date(2014, 0, 1), // Jan 1. Wednesday. One day timetable
                date3 = new Date(2014, 1, 2), // Feb 2. sunday. Inside timetable
                date5 = new Date(2014, 3, 6), // April 6 sunday
                date6 = new Date(2014, 3, 8), // April 8 tuesday
                date7 = new Date(2014, 3, 9); // April 9 wednesday

            it('empty timetables', function() {
                expect(model.get_working_hours(date)).toBeNull();
            });

            it('closed', function() {
                model.set('timetables', timetable);
                expect(model.get_working_hours(date)).toBe(false);
            });

            it('always open', function() {
                model.set('timetables', timetable);
                expect(model.get_working_hours(date2)).toBe(true);

                expect(model.get_working_hours(date3)).toBe(true);
            });

            it('timetable is defined but day undefined', function() {
                model.set('timetables', timetable);

                expect(model.get_working_hours(date5)).toBe(false);
            });

            it('timetable is defined and empty day', function() {
                model.set('timetables', timetable);

                expect(model.get_working_hours(date6)).toEqual([]);
            });

            it('timetable is defined and defined day. 12-hours format', function() {
                model.set({
                    timetables: timetable,
                    time_format: '12 hour'
                });
                expect(model.get_working_hours(date7)).toEqual(timetable[2].timetable_data.wednesday12);
            });

            it('timetable is defined and defined day. 24-hours format', function() {
                model.set({
                    timetables: timetable,
                    time_format: '24 hour'
                });
                expect(model.get_working_hours(date7)).toEqual(timetable[2].timetable_data.wednesday13);

                model.set({
                    timetables: timetable,
                    time_format: '12 hour'
                });
                expect(model.get_working_hours(date7, 1)).toEqual(timetable[2].timetable_data.wednesday);
            });

            it('always open, but the Holiday in that day', function() {
                model.set('timetables', timetable);
                model.set('holidays', [{date:"Mar, 17", name:"H1"}, {date:"Feb, 29", name:"H2"}, {date:"Jan, 1", name:""}]);
                expect(model.get_working_hours(date2)).toBe(false);
                expect(model.get_working_hours(date3)).toBe(true);
            });

            it('closed and no Holiday in that day', function() {
                model.set('timetables', timetable);
                model.set('holidays', [{date:"Mar, 30", name:"H1"}]);
                expect(model.get_working_hours(date)).toBe(false);
            });

            it('closed and Holiday in that day', function() {
                model.set('timetables', timetable);
                model.set('holidays', [{date:"Jan, 22", name:"H1"}]);
                expect(model.get_working_hours(date)).toBe(false);
            });

            it('timetable is defined and defined day but Holiday in that day. 12-hours format', function() {
                model.set('timetables', timetable);
                model.set('holidays', [{date:"Mar, 17", name:"H1"}, {date:"Feb, 29", name:"H2"}, {date:"Apr, 9", name:"H3"}]);
                expect(model.get_working_hours(date7)).toEqual( false );
            });

        });

        describe('get_timetable_on_week()', function() {
            var date = new Date(2014, 0, 22),
                dateBase,
                counter, getTimetable,
                table,
                format_output;

            beforeEach(function() {
                format_output = undefined;
                spyOn(model,'base').and.callFake(function() {
                    return new Date(dateBase);
                });
                spyOn(model,'get_working_hours').and.callFake(function(date, output) {
                    format_output = output;
                    return table();
                });
                dateBase = new Date(date);
                getTimetable = deepClone(timetables.getTimetable);
                counter = false;
                table = function() { return counter; };
            });

            it('empty timetables', function() {
                counter = null;
                expect(model.get_timetable_on_week()).toBeNull();
            });

            it('calls get_working_hours arguments', function() {
                model.set('timetables', timetable);
                model.get_timetable_on_week(date); // check result;

                var calls = model.get_working_hours.calls.allArgs(); // check get_working_hours calls
                expect(calls.length).toBe(7);
                expect(calls.filter(function(element, i) {
                    return element[0].getTime() !== dateBase.setTime(date.getTime() + i * 1000 * 60 * 60 * 24);
                }).length).toBe(0);
                expect(format_output).toBe(0);

                model.get_timetable_on_week(1); // check result;
                expect(format_output).toBe(1);
            });

            it('check result', function() {
                model.set('timetables', timetable);
                counter = 0;
                table = function() { return counter++; };

                expect(model.get_timetable_on_week(date)).toEqual(getTimetable); // check result;
            });
        });

        describe('getHoursOnWeek()', function() {
            var date = new Date(2014, 3, 15),
                dateBase = new Date(date);

            beforeEach(function() {
                spyOn(model,'base').and.callFake(function() {
                    return new Date(dateBase);
                });
                model.set('timetables', timetable);
            });

            it('`timetable_on_week` is a timetable object', function() {
                var timetableOnWeek = model.get_timetable_on_week(),
                    hoursOnWeek = model.getHoursOnWeek();

                expect(hoursOnWeek.length).toBe(7);
                $.each(hoursOnWeek, function(day) {
                    expect(day.hours).toEqual(timetableOnWeek[day.weekDay]);
                });
            });

            it('`timetable_on_week` is null', function() {
                spyOn(model, 'get_timetable_on_week').and.returnValue(null);

                expect(model.getHoursOnWeek()).toBeUndefined();
            });
        });

        describe('getCurDayHours()', function() {
            it('`hours` is set', function() {
                model.set('timetables', timetable);
                expect(model.getCurDayHours()).toEqual(model.get('hours'));
            });

            it('`hours` is not array or empty array', function() {
                model.set('hours', null);
                expect(model.getCurDayHours()).toBeNull();

                model.set('hours', []);
                expect(model.getCurDayHours()).toBeUndefined();
            });
        });

        describe('checking_work_shop()', function() {
            var date = new Date(2014, 0, 22), // 22 Jan wednesday
                obj = {},
                obj1 = {};

            beforeEach(function() {
                spyOn(model,'get_working_hours').and.returnValue(obj);
                spyOn(model.workingDay, 'update');
                spyOn(model.workingDay, 'checking_work_shop');
            });

            it('check method calls', function() {
                model.checking_work_shop(date, obj1);
                expect(model.get_working_hours).toHaveBeenCalledWith(date,1);
                expect(model.workingDay.update).toHaveBeenCalledWith({timetable: obj, curTime : date});
                expect(model.workingDay.checking_work_shop).toHaveBeenCalledWith(obj1);
            });
        });

        it('round_date(date)', function() {
            var date = new Date();
                roundDate = model.round_date(date);
            expect(roundDate.getHours()).toBe(0);
            expect(roundDate.getMinutes()).toBe(0);
            expect(roundDate.getSeconds()).toBe(0);
        });

        describe('getPickupList()', function() {
            var dateBase = new Date(2014, 0, 22);

            beforeEach(function() {
                App.Settings.online_order_date_range = 100;

                model.set({
                    timetables: timetables.timetable4
                });

                spyOn(model, 'base').and.callFake(function() {
                    return new Date(dateBase);
                });
            });

            it('default params', function() {
                var list = model.getPickupList();
                expect(list.length).toEqual(2); // number of valid days (excluding holidays and closed days)
                expect(list[0].delta).toEqual(19); // 19 is delta [in days] between Jan-22 to Feb-14 (first valid day from timetables.timetable4)
            });

            it('out `index_by_day_delta` param', function() {
                var index_by_day_delta = {};
                var list = model.getPickupList(false, index_by_day_delta);
                expect(index_by_day_delta[19]).toEqual(0);
            });

            it('Test `weekDay` in result. Test other days', function() {
                var pickup = model.getPickupList();
                expect(pickup[0].weekDay).toBe('Monday, February 10th');
                expect(pickup[1].weekDay).toBe('Wednesday, February 12th');
            });

            it('Test `weekDay` in result. Test `Today`', function() {
                dateBase = new Date(2014, 1, 10);
                var pickup = model.getPickupList();
                expect(pickup[0].weekDay).toBe('Today');
            });

            it('Test `weekDay` in result. Test `Tomorrow`', function() {
                dateBase = new Date(2014, 1, 9);
                var pickup = model.getPickupList();
                expect(pickup[0].weekDay).toBe('Tomorrow');
            });

            it('Test weekDay in result. Test 1st, 2nd, 3rd dates', function() {
                dateBase = new Date(2013, 11, 30);
                var pickup = model.getPickupList();
                expect(pickup[0].weekDay).toBe('Wednesday, January 1st');
                expect(pickup[1].weekDay).toBe('Thursday, January 2nd');
                expect(pickup[2].weekDay).toBe('Friday, January 3rd');
            });
        });

        describe('isWorkingOnDay()', function() {
            var day, isDelivery, isToday;

            beforeEach(function() {
                day = new Date();
                isDelivery = false;
                isToday = false;

                App.Settings.estimated_delivery_time = 60;
                App.Settings.estimated_order_preparation_time = 30;

                spyOn(model, 'base').and.returnValue(
                    new Date(new Date().setHours(13, 0, 0, 0))
                );
            });

            it('`hours` is `false`. Should return `false`', function() {
                var hours = false;
                spyOn(model, 'get_working_hours').and.returnValue(hours);
                expect(model.isWorkingOnDay()).toEqual(false);
            });

            it('`hours` is an empty array. Should return `false`', function() {
                var hours = [];
                spyOn(model, 'get_working_hours').and.returnValue(hours);
                expect(model.isWorkingOnDay()).toEqual(false);
            });

            it('`isToday` is true and `now` is within hours range. Should return `true`', function() {
                isToday = true;
                var hours = [{ from: '9:00', to: '14:00' }];
                spyOn(model, 'get_working_hours').and.returnValue(hours);
                expect(model.isWorkingOnDay(day, isDelivery, isToday)).toEqual(true);
            });

            it('`isToday` is true and `now` is out of hours range. Should return `false`', function() {
                isToday = true;
                var hours = [{ from: '8:00am', to: '11:00am' }];
                spyOn(model, 'get_working_hours').and.returnValue(hours);
                expect(model.isWorkingOnDay(day, isDelivery, isToday)).toEqual(false);
            });

            it('`isToday` and `isDelivery` are true and `delivery_time` is greater than time range. Should return `false`', function() {
                isDelivery = true;
                isToday = true;
                var hours = [{ from: '12:30', to: '13:30' }];
                spyOn(model, 'get_working_hours').and.returnValue(hours);
                expect(model.isWorkingOnDay(day, isDelivery, isToday)).toEqual(false);
            });

            it('`isToday` is false and there is hours range. Should return `true`', function() {
                var hours = [{ from: '8:00', to: '12:00' }];
                spyOn(model, 'get_working_hours').and.returnValue(hours);
                expect(model.isWorkingOnDay(day, isDelivery, isToday)).toEqual(true);
            });
        });

        describe('check_order_enable()', function() {
            var base = {}, check_work;

            beforeEach(function() {
                spyOn(App.Models.Timetable.prototype, 'base').and.callFake(function() {
                    return base;
                });
                spyOn(App.Models.Timetable.prototype, 'checking_work_shop').and.callFake(function() {
                    return check_work;
                });
                this.accept = App.Data.settings.get('settings_system').accept_online_orders_when_store_is_closed;
                App.Data.settings.get('settings_system').accept_online_orders_when_store_is_closed = false;
            });

            afterEach(function() {
                App.Data.settings.get('settings_system').accept_online_orders_when_store_is_closed = this.accept;
            });

            it('Check function checking_work_shop call and calls arguments', function() {
                model.check_order_enable();

                expect(model.base).toHaveBeenCalled();
                expect(model.checking_work_shop).toHaveBeenCalledWith(base, undefined);
            });

            it('Work open now and accept true', function() {
                check_work = true;
                App.Data.settings.get('settings_system').accept_online_orders_when_store_is_closed = true;

                expect(model.check_order_enable()).toBe(true);
            });

            it('Work open now and accept false', function() {
                check_work = true;
                App.Data.settings.get('settings_system').accept_online_orders_when_store_is_closed = false;

                expect(model.check_order_enable()).toBe(true);
            });

            it('Work close now and accept true', function() {
                check_work = false;
                App.Data.settings.get('settings_system').accept_online_orders_when_store_is_closed = true;

                expect(model.check_order_enable()).toBe(true);
            });

            it('Work close now and accept false', function() {
                check_work = false;
                App.Data.settings.get('settings_system').accept_online_orders_when_store_is_closed = false;

                expect(model.check_order_enable()).toBe(false);
            });
        });

        it('getLastPTforWorkPeriod()', function() {
            var curtime = model.base(),
                wd = new App.Models.WorkingDay( {timetable: timetable[2].timetable_data.wednesday,
                                                 curTime : curtime});
            expect(model.getLastPTforWorkPeriod(curtime)).toEqual(wd.getLastPTforPeriod(curtime));
        });

        describe('openNow()', function() {
            it('isHoliday', function() {
                spyOn(model, 'isHoliday').and.returnValue(true);
                expect(model.openNow()).toBe(false);
            });

            it('not isHoliday', function() {
                var date = new Date(2014, 0, 22),
                    dateBase = new Date(date);

                spyOn(model, 'isHoliday').and.returnValue(false);
                spyOn(model, 'checking_work_shop');
                spyOn(model, 'base').and.callFake(function() {
                    return dateBase;
                });
                model.openNow();

                expect(model.checking_work_shop).toHaveBeenCalledWith(dateBase);
            });
        });

        describe('isClosedToday()', function() {
            it('`workinDay` isn\'t initialized', function() {
                var workingDay = undefined;
                model.workingDay = workingDay;
                expect(model.isClosedToday()).toBe(workingDay);
            });

            it('`workinDay` is initialized', function() {
                var isClosed = true;
                spyOn(model.workingDay, '_isClosedToday').and.returnValue(isClosed);
                expect(model.isClosedToday()).toBe(isClosed);
            });
        });

        describe('getWorkingHoursToday()', function() {
            it('`getCurDayHours()` returns null', function() {
                spyOn(model, 'getCurDayHours').and.returnValue(null);
                expect(model.getWorkingHoursToday()).toBe(_loc.STORE_INFO_CLOSED);
            });

            it('`day` is an object, `day.hours` is an empty array', function() {
                spyOn(model, 'getCurDayHours').and.callFake(function() {
                    return {hours: []};
                });
                expect(model.getWorkingHoursToday()).toBe(_loc.STORE_INFO_ROUND_THE_CLOCK);
            });

            it('`day` is an object, `day.hours` is non-empty array', function() {
                spyOn(model, 'getCurDayHours').and.callFake(function() {
                    return {hours: [{from: '9:00', to: '14:00'}, {from: '16:00', to: '19:00'}]};
                });
                expect(model.getWorkingHoursToday()).toBe(_loc.STORE_INFO_OPEN_TODAY + ': 9:00 - 14:00, 16:00 - 19:00');
            });
        });
    });
});