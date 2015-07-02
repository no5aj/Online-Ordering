define([], function() {
    return {
        'PLAN_DEFAULT': {
            'id': null,
            'name': '',
            'type': 'D',
            'balance': 0,
            'selected': false
        },
        'PLAN_1': {
            'id': '21',
            'name': 'Plan 1',
            'type': 'D',
            'balance': 12,
            'selected': false
        },
        'PLAN_2': {
            'id': '1335',
            'name': 'Plan 2',
            'type': 'M',
            'balance': 5,
            'selected': false
        },
        'CARD_DEFAULT': {
            'number': '',
            'plans': null,
            'planId': null,
            'captchaValue': '',
            'captchaImage': '',
            'captchaKey': ''
        },
        'CARD_1': {
            'number': '233324',
            'plans': null,
            'planId': '123',
            'captchaValue': 'asdasd',
            'captchaImage': 'asdasd',
            'captchaKey': 'asdasd'
        },
        'API': {
            'url': '/weborders/stanford_card/',
            'type': 'POST',
            'dataType': 'json'
        },
        'RESPONSE_1': {
            'status': 'OK',
            'data': 'OK',
        },
        'RESPONSE_2': {
            'status': 'OK',
            'data': [],
        },
        'RESPONSE_3': {
            'status': 'ERROR',
            'errorMsg': 'Invalid Captcha'
        }
    };
});