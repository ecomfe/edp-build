/**
 * @file test/using-etpl.spec.js
 * @author leeight(liyubei@baidu.com)
 */

var path = require('path');

var base = require('./base');
var ModuleCompiler = require('../lib/processor/module-compiler.js');
var ProcessContext = require('../lib/process-context.js');

var Project = path.resolve(__dirname, 'data', 'dummy-project');

describe('using-etpl', function () {
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

    // 需要测试的是如果combine的时候有package的代码需要合并，最后处理的是否正常.
    it('default', function () {
        var processor = new ModuleCompiler({
            getCombineConfig: function () {
                return {
                    'using-etpl': {
                        include: ['etpl/**'],
                        exclude: ['etpl/tpl']
                    }
                };
            }
        });

        base.launchProcessors([processor], processContext, function () {
            var fileData = processContext.getFileByPath('src/using-etpl.js');
            var expected =
                '(function (root) {\n' +
                '    function Engine() {\n' +
                '    }\n' +
                '    ;\n' +
                '    var etpl = new Engine();\n' +
                '    etpl.Engine = Engine;\n' +
                '    if (typeof exports == \'object\' && typeof module == \'object\') {\n' +
                '        exports = module.exports = etpl;\n' +
                '    } else if (typeof define == \'function\' && define.amd) {\n' +
                '        define(\'etpl/main\', [], etpl);\n' +
                '    } else {\n' +
                '        root.etpl = etpl;\n' +
                '    }\n' +
                '}(this));\n' +
                '\n' +
                'define(\'etpl\', [\'etpl/main\'], function (main) { return main; });\n' +
                '\n' +
                'define(\'biz/tpl\', [\n' +
                '    \'require\',\n' +
                '    \'etpl\'\n' +
                '], function (require) {\n' +
                '    return require(\'etpl\');\n' +
                '});\n' +
                '\n' +
                'define(\'using-etpl\', [\n' +
                '    \'require\',\n' +
                '    \'./biz/tpl\',\n' +
                '    \'etpl/main\'\n' +
                '], function (require) {\n' +
                '    var template = require(\'./biz/tpl\');\n' +
                '    var z = require(\'etpl/main\');\n' +
                '    console.log(template + z);\n' +
                '});';
            expect(fileData.data).toBe(expected);
        });
    });
});





















/* vim: set ts=4 sw=4 sts=4 tw=100: */
