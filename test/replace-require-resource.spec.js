/**
 * @file replace-require-resource.spec.js ~ 2014/02/25 11:39:29
 * @author leeight(liyubei@baidu.com)
 */

var fs = require('fs');
var path = require('path');

var expect = require('expect.js');

var replaceRequireResource = require('../lib/util/replace-require-resource.js');
var Project = path.resolve(__dirname, 'data', 'dummy-project');

describe('replace-require-resource', function () {
    it('default', function () {
        var file = path.resolve(Project, 'src', 'case1.js');
        var code = fs.readFileSync(file, 'utf-8');
        var z = replaceRequireResource(code, 'tpl', function (resourceId) {
            return resourceId + '-replaced';
        });
        var expected =
        'define(\'case1\', [\n' +
        '    \'foo\',\n' +
        '    \'require\',\n' +
        '    \'tpl!./tpl/123.html-replaced\',\n' +
        '    \'tpl!./tpl/list.tpl.html-replaced\',\n' +
        '    \'no-such-plugin!./tpl/list.tpl.html\',\n' +
        '    \'tpl!er/tpl/hello.tpl.html-replaced\',\n' +
        '    \'jquery\'\n' +
        '], function (foo, require, res) {\n' +
        '    require(\'tpl!./tpl/list.tpl.html-replaced\');\n' +
        '    require(\'no-such-plugin!./tpl/list.tpl.html\');\n' +
        '    require(\'tpl!er/tpl/hello.tpl.html-replaced\');\n' +
        '    var z = require(\'jquery\');\n' +
        '    return \'case1\';\n' +
        '});';

        expect(z).to.be(expected);
    });

    it('multiple pluginIds', function () {
        var file = path.resolve(Project, 'src', 'case1.js');
        var code = fs.readFileSync(file, 'utf-8');
        var z = replaceRequireResource(code, ['tpl', 'no-such-plugin'], function (resourceId) {
            return resourceId + '-replaced';
        });
        var expected =
        'define(\'case1\', [\n' +
        '    \'foo\',\n' +
        '    \'require\',\n' +
        '    \'tpl!./tpl/123.html-replaced\',\n' +
        '    \'tpl!./tpl/list.tpl.html-replaced\',\n' +
        '    \'no-such-plugin!./tpl/list.tpl.html-replaced\',\n' +
        '    \'tpl!er/tpl/hello.tpl.html-replaced\',\n' +
        '    \'jquery\'\n' +
        '], function (foo, require, res) {\n' +
        '    require(\'tpl!./tpl/list.tpl.html-replaced\');\n' +
        '    require(\'no-such-plugin!./tpl/list.tpl.html-replaced\');\n' +
        '    require(\'tpl!er/tpl/hello.tpl.html-replaced\');\n' +
        '    var z = require(\'jquery\');\n' +
        '    return \'case1\';\n' +
        '});';

        expect(z).to.be(expected);
    });

    it('issue-186', function () {
        // var file = '/Users/leeight/public_html/case/baike/output/asset/common/main.js';
        var file = path.join(__dirname, 'data', 'issue-186.data.js');
        var code = fs.readFileSync(file, 'utf-8');
        var z = replaceRequireResource(code, ['tpl'], function (resourceId) {
            return '[' + resourceId + ']';
        });
        expect(z).not.to.be(null);
    });

    it('issue-94', function () {
        var code = 'define(["exports", "bat-ria/tpl!./a.tpl", "bat-ria/tpl!./b.tpl", "er/View"], function (exports, a, b, c) {});';
        var z = replaceRequireResource(code, ['bat-ria/tpl'], function (resourceId) {
            return 'bat-ria/tpl!template';
        });
        var z = replaceRequireResource(z, ['bat-ria/tpl'], function (resourceId) {
            return 'bat-ria/tpl!template';
        });
        expect(z).to.be("define([\n    'exports',\n    'bat-ria/tpl!template',\n    'bat-ria/tpl!template',\n    'er/View'\n], function (exports, a, b, c) {\n});");
    });
});





















/* vim: set ts=4 sw=4 sts=4 tw=100: */
