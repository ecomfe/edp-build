/**
 * @file test/array.spec.js ~ 2014/03/20 13:31:01
 * @author leeight(liyubei@baidu.com)
 */
var path = require('path');

var edp = require('edp-core');
var u = require('underscore');

describe('array', function () {
    it('expand', function () {
        /*eslint-disable*/
        var a = [, 1, '2', true, null, undefined, new Object()];
        expect(u.flatten(a)).toEqual(a);

        var b = [, 1, '2', true, null, undefined, new Object(), []];
        expect(u.flatten(b)).toEqual(a);
        /*eslint-enable*/

        var c = [1, 2, [3, 4], [5, [6, 7, [[8]]]]];
        expect(u.flatten(c)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    });

    it('getAllModules', function () {
        var moduleConfig = path.join(__dirname, './data/dummy-project/module.conf');
        var allModules = edp.amd.getAllModules(moduleConfig);
        allModules.sort();

        expect(allModules.indexOf('etpl')).not.toBe(-1);
        expect(allModules.indexOf('etpl/main')).not.toBe(-1);
        expect(allModules.indexOf('etpl/tpl')).not.toBe(-1);
        expect(allModules.indexOf('net/Http')).not.toBe(-1);
        expect(allModules.indexOf('io/File')).not.toBe(-1);
    });
});




















/* vim: set ts=4 sw=4 sts=4 tw=100: */
