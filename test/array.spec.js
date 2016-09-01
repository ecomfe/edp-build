/**
 * @file test/array.spec.js ~ 2014/03/20 13:31:01
 * @author leeight(liyubei@baidu.com)
 */
var path = require('path');

var expect = require('expect.js');

var edp = require('edp-core');
var u = require('underscore');

describe('array', function () {
    it('expand', function () {
        /*eslint-disable*/
        var a = [, 1, '2', true, null, undefined, new Object()];
        // FIXME
        // expect(u.flatten(a)).to.eql(a);

        var b = [, 1, '2', true, null, undefined, new Object(), []];
        // FIXME
        // expect(u.flatten(b)).to.eql(a);
        /*eslint-enable*/

        var c = [1, 2, [3, 4], [5, [6, 7, [[8]]]]];
        expect(u.flatten(c)).to.eql([1, 2, 3, 4, 5, 6, 7, 8]);
    });

    it('getAllModules', function () {
        var moduleConfig = path.join(__dirname, './data/dummy-project/module.conf');
        var allModules = edp.amd.getAllModules(moduleConfig);
        allModules.sort();

        expect(allModules.indexOf('etpl')).not.to.be(-1);
        expect(allModules.indexOf('etpl/main')).not.to.be(-1);
        expect(allModules.indexOf('etpl/tpl')).not.to.be(-1);
        expect(allModules.indexOf('net/Http')).not.to.be(-1);
        expect(allModules.indexOf('io/File')).not.to.be(-1);
    });
});




















/* vim: set ts=4 sw=4 sts=4 tw=100: */
