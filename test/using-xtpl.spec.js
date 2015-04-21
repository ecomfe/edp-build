/**
 * @file test/using-xtpl.spec.js
 * @author leeight(liyubei@baidu.com)
 */

var path = require('path');

var base = require('./base');
var ModuleCompiler = require('../lib/processor/module-compiler.js');
var ProcessContext = require('../lib/process-context.js');

var Project = path.resolve(__dirname, 'data', 'dummy-project');

describe('using-xtpl', function () {
    var processContext;

    beforeEach(function () {
        processContext = new ProcessContext({
            baseDir: Project,
            exclude: [],
            outputDir: 'output',
            fileEncodings: {}
        });

        base.traverseDir(Project, processContext);
        base.traverseDir(path.join(Project, '..', 'base'), processContext);
    });

    it('default', function () {
        var processor = new ModuleCompiler({
            getCombineConfig: function () {
                return {
                    'common/using-xtpl': true
                };
            }
        });

        base.launchProcessors([processor], processContext, function () {
            var fileData = processContext.getFileByPath('src/common/using-xtpl.js');
            var expected =
                'define(\'common/xtpl\', [\'require\'], function (require) {\n' +
                '    return \'xtpl\';\n' +
                '});\n' +
                '\n' +
                '\n' +
                '/** d e f i n e */\n' +
                'define(\'xtpl\', [\'common/xtpl\'], function (target) { return target; });\n' +
                '\n' +
                '\n' +
                '/** d e f i n e */\n' +
                'define(\'xtpl2\', [\'common/xtpl\'], function (target) { return target; });\n' +
                '\n' +
                '\n' +
                '/** d e f i n e */\n' +
                'define(\'xtpl3\', [\'common/xtpl\'], function (target) { return target; });\n' +
                '\n' +
                'define(\'common/using-xtpl\', [\n' +
                '    \'require\',\n' +
                '    \'./xtpl\',\n' +
                '    \'xtpl\',\n' +
                '    \'common/xtpl\'\n' +
                '], function (require) {\n' +
                '    var a = require(\'./xtpl\');\n' +
                '    var b = require(\'xtpl\');\n' +
                '    var c = require(\'common/xtpl\');\n' +
                '    return a + b + c;\n' +
                '});';
            expect(fileData.data).toBe(expected);
        });
    });
});




















/* vim: set ts=4 sw=4 sts=4 tw=100: */
