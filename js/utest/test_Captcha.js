define(['captcha'], function() {
    'use strict';

    describe("App.Models.Captcha", function() {
        var captcha, def,
            recaptcha_site_key;

        beforeEach(function() {
            captcha = new App.Models.Captcha();
            def = {
                captchaImage: '',
                captchaKey: App.Settings.recaptcha_site_key,
                captchaValue: ''
            };
            recaptcha_site_key = App.Settings.recaptcha_site_key;
        });

        afterEach(function() {
            App.Settings.recaptcha_site_key = recaptcha_site_key;
        });

        it('Environment', function() {
            expect(App.Models.Captcha).toBeDefined();
        });

        it('Create model', function() {
            expect(captcha.toJSON()).toEqual(def);
        });

        it('initialize()', function() {
            expect(captcha.defaults.captchaKey).toBe(App.Settings.recaptcha_site_key);
        });

        it('loadCaptcha()', function() {
            var oldRecaptchaKey = App.Settings.recaptcha_site_key,
                newRecaptchaKey = 'ASDASD#@#ASDASDSD';
            App.Settings.recaptcha_site_key = newRecaptchaKey;
            captcha.set('captchaValue', 'asdasd');
            captcha.loadCaptcha();
            expect(captcha.get('captchaKey')).toBe(newRecaptchaKey);
            expect(captcha.get('captchaValue')).toBe(def.captchaValue);
            App.Settings.recaptcha_site_key = oldRecaptchaKey;
        });
    });
});