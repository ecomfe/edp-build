/**
 * @file biz.js
 * @author test
 */

define(function (require) {
    var util = require('./common/util');

    return {
        sayHi: function () {
            var result = util.sayHi();
            // do sth

            return result;
        },

        sayOthers: function () {
            //var util = require('util');
        }
    };
});