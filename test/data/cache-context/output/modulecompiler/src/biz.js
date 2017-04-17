define('common/print', ['require'], function (require) {
    return {
        format: function (name) {
            return name;
        }
    };
});

define('common/util', [
    'require',
    './print'
], function (require) {
    var print = require('./print');
    return {
        sayHi: function (name) {
            var result = print.format(name);
            return result;
        }
    };
});

define('biz', [
    'require',
    './common/util'
], function (require) {
    var util = require('./common/util');
    return {
        sayHi: function () {
            var result = util.sayHi();
            return result;
        },
        sayOthers: function () {
        }
    };
});