/**
 * @file test/using-ztpl.spec.js
 * @author leeight(liyubei@baidu.com)
 */

var path = require('path');

var base = require('./base');
var ModuleCompiler = require('../lib/processor/module-compiler.js');
var ProcessContext = require('../lib/process-context.js');

var Project = path.resolve(__dirname, 'data', 'dummy-project');

describe('using-ztpl', function () {
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

    // 需要测试的是如果define不是global call，看看是否combine的代码是否正常
    it('default', function () {
        var processor = new ModuleCompiler({
            getCombineConfig: function () {
                return {
                    'using-ztpl': true
                };
            }
        });

        base.launchProcessors([processor], processContext, function () {
            var fileData = processContext.getFileByPath('src/using-ztpl.js');
            var expected =
                '(function (root) {\n' +
                '    var ztpl = \'ztpl\';\n' +
                '    define(\'common/ztpl\', [], ztpl);\n' +
                '}(this));\n' +
                '\n' +
                '\n' +
                '/** d e f i n e */\n' +
                'define(\'ztpl\', [\'common/ztpl\'], function (target) { return target; });\n' +
                '\n' +
                '\n' +
                '/** d e f i n e */\n' +
                'define(\'ztpl2\', [\'common/ztpl\'], function (target) { return target; });\n' +
                '\n' +
                'define(\'using-ztpl\', [\n' +
                '    \'require\',\n' +
                '    \'./common/ztpl\'\n' +
                '], function (require) {\n' +
                '    var ztpl = require(\'./common/ztpl\');\n' +
                '    console.log(ztpl);\n' +
                '});';
            expect(fileData.data).toBe(expected);
        });
    });
});





















/* vim: set ts=4 sw=4 sts=4 tw=100: */
