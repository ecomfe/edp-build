/**
 * @file util.js
 * @author test
 */

define(function (require) {
    var print = require('./print');

    return {
        sayHi: function (name) {
            var result = print.format(name);
            // do sth
            return result;
        }
    };
});