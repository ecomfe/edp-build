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