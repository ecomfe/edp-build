/**
 * @author leeight(liyubei@baidu.com)
 * @file 测试一下ModuleCompiler的功能是否正常
 */

var path = require('path');

var edp = require('edp-core');
var expect = require('expect.js');
var sinon = require('sinon');

var base = require('./base');
var AbstractProcessor = require('../lib/processor/abstract.js');
var ModuleCompiler = require('../lib/processor/module-compiler.js');
var ProcessContext = require('../lib/process-context.js');

var Project = path.resolve(__dirname, 'data', 'dummy-project');

describe('module-compiler', function(){
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

    it('default', function (done) {
        var processor = new ModuleCompiler();
        var filePath = path.join(Project, 'src', 'foo.js');

        base.launchProcessors([processor], processContext, function () {
            var fileData = processContext.getFileByPath('src/foo.js');
            var expected = 'define(\'foo\', [\n' +
                '    \'require\',\n' +
                '    \'io/File\',\n' +
                '    \'net/Http\',\n' +
                '    \'er/View\'\n' +
                '], function (require) {\n' +
                '    var ioFile = require(\'io/File\');\n' +
                '    var netHttp = require(\'net/Http\');\n' +
                '    var erView = require(\'er/View\');\n' +
                '    return \'foo\';\n' +
                '});';
            expect(fileData.data).to.be(expected);
            done();
        });
    });

    it('getCombineConfig', function (done) {
        var processor = new ModuleCompiler({
            getCombineConfig: function (combineModules) {
                combineModules.foo = 1;
                return combineModules;
            }
        });

        base.launchProcessors([processor], processContext, function () {
            var fileData = processContext.getFileByPath('src/foo.js');

            var ast = edp.amd.getAst(fileData.data);
            var moduleInfo = edp.amd.analyseModule(ast);
            expect(moduleInfo).not.to.be(null);
            expect(moduleInfo.length).to.be(4);
            expect(moduleInfo[0].id).to.be('io/File');
            expect(moduleInfo[1].id).to.be('net/Http');
            expect(moduleInfo[2].id).to.be('er/View');
            expect(moduleInfo[3].id).to.be('foo');

            done();
        });
    });

    it('case-xtpl', function (done) {
        var processor = new ModuleCompiler({
            getCombineConfig: function() {
                return {
                    'case-xtpl': true
                };
            }
        });

        base.launchProcessors([processor], processContext, function () {
            var fileData = processContext.getFileByPath('src/case-xtpl.js');
            var expected =
                'define(\'xtpl\', [\'require\'], function (require) {\n' +
                '    return \'xtpl\';\n' +
                '});' +
                '\n\n' +
                '\n' +
                '/** d e f i n e */\n' +
                'define(\'xtpl2\', [\'xtpl\'], function (target) { return target; });\n' +
                '\n' +
                '\n' +
                '/** d e f i n e */\n' +
                'define(\'xtpl3\', [\'xtpl\'], function (target) { return target; });\n' +
                '\n' +
                '\n' +
                '/** d e f i n e */\n' +
                'define(\'common/xtpl\', [\'xtpl\'], function (target) { return target; });\n' +
                '\n' +
                'define(\'case-xtpl\', [\n' +
                '    \'require\',\n' +
                '    \'xtpl\',\n' +
                '    \'common/xtpl\'\n' +
                '], function (require) {\n' +
                '    var xtpl = require(\'xtpl\');\n' +
                '    var ztpl = require(\'common/xtpl\');\n' +
                '    console.log(xtpl);\n' +
                '    console.log(ztpl);\n' +
                '});';
            expect(fileData.data).to.be(expected);
            done();
        });
    });

    it('bizId support', function (done) {
        var processor = new ModuleCompiler({
            bizId: 'foo/bar',
            getCombineConfig: function () {
                return {
                    'case-xtpl': true
                };
            }
        });

        base.launchProcessors([processor], processContext, function () {
            var fileData = processContext.getFileByPath('src/case-xtpl.js');
            var expected =
                'define(\'foo/bar/xtpl\', [\'require\'], function (require) {\n' +
                '    return \'xtpl\';\n' +
                '});\n' +
                'define(\'foo/bar/xtpl2\', [\'xtpl\'], function (target) {\n' +
                '    return target;\n' +
                '});\n' +
                'define(\'foo/bar/xtpl3\', [\'xtpl\'], function (target) {\n' +
                '    return target;\n' +
                '});\n' +
                'define(\'foo/bar/common/xtpl\', [\'xtpl\'], function (target) {\n' +
                '    return target;\n' +
                '});\n' +
                'define(\'foo/bar/case-xtpl\', [\n' +
                '    \'require\',\n' +
                '    \'xtpl\',\n' +
                '    \'common/xtpl\'\n' +
                '], function (require) {\n' +
                '    var xtpl = require(\'xtpl\');\n' +
                '    var ztpl = require(\'common/xtpl\');\n' +
                '    console.log(xtpl);\n' +
                '    console.log(ztpl);\n' +
                '});';
            expect(fileData.data).to.be(expected);
            done();
        });
    });

    it('动态生成的JS模块', function (done) {
        var p1 = new AbstractProcessor({
            name: 'TemplateGenerator',
            files: [ '*.tpl.html' ],
            process: function (file, processContext, callback) {
                var FileInfo = file.constructor;
                var data = require('util').format('define(function (require) { return %s;})',
                    JSON.stringify(file.data).replace(/\n/g, '\\n'));
                processContext.addFile(new FileInfo({
                    data: data,
                    extname: 'js',
                    path: file.path.replace(/\.html$/, '.js'),
                    fullPath: file.fullPath.replace(/\.html$/, '.js'),
                    fileEncoding: 'utf-8'
                }));
                callback();
            }
        });

        var p2 = new ModuleCompiler({
            getCombineConfig: function() {
                return {
                    'dynamic-module/foo': true
                };
            }
        });

        base.launchProcessors([p1, p2], processContext, function () {
            var fileInfo = processContext.getFileByPath('src/dynamic-module/foo.js');
            var actual = fileInfo.data;
            var expected =
                'define(\'dynamic-module/list.tpl\', [\'require\'], function (require) {\n' +
                '    return \'<!-- target: list_page -->\\nhello \\u4F60\\u597D.\\n\';\n' +
                '});\n' +
                '\n' +
                'define(\'dynamic-module/foo\', [\n' +
                '    \'require\',\n' +
                '    \'./list.tpl\'\n' +
                '], function (require) {\n' +
                '    return \'dynamic-module/foo\' + require(\'./list.tpl\');\n' +
                '});';
            expect(actual).to.be(expected);
            done();
        });
    });

    it('issue-92', function (done) {
        var Project = path.resolve(__dirname, 'data', 'dummy-project-2');
        var processContext = new ProcessContext({
            baseDir: Project,
            exclude: [],
            outputDir: 'output',
            fileEncodings: {}
        });
        base.traverseDir(Project, processContext);

        sinon.spy(edp.log, 'warn');

        var p2 = new ModuleCompiler({
            getCombineConfig: function (config) {
                config['issue-92'] = true;
            }
        });

        base.launchProcessors([p2], processContext, function () {
            var code = processContext.getFileByPath('src/issue-92.js');
            var expected =
                '\n\n\n\n\n\ndefine(\'issue-92\', [\n' +
                '    \'require\',\n' +
                '    \'hello/mod1\',\n' +
                '    \'world/mod1\',\n' +
                '    \'wtf/mod1/mod2\'\n' +
                '], function (require) {\n' +
                '    require(\'hello/mod1\');\n' +
                '    require(\'world/mod1\');\n' +
                '    require(\'wtf/mod1/mod2\');\n' +
                '});'
            expect(code.data).to.eql(expected);
            expect(edp.log.warn.calledOnce).to.be(false);
            edp.log.warn.restore();

            done();
        });
    });

    it('webuploader.js', function (done) {
        // webuploader.js
        var Project = path.resolve(__dirname, 'data', 'dummy-project-2');
        var processContext = new ProcessContext({
            baseDir: Project,
            exclude: [],
            outputDir: 'output',
            fileEncodings: {}
        });
        base.traverseDir(Project, processContext);

        var p2 = new ModuleCompiler();

        base.launchProcessors([p2], processContext, function () {
            var webuploader = processContext.getFileByPath('src/webuploader.js');
            expect(webuploader.data.indexOf('define(\'webuploader/webuploader\', [\'jquery\'], makeExport);')).not.to.be(-1);
            expect(webuploader.data.indexOf('define(\'webuploader\', [\'webuploader/webuploader\'], function (main) { return main; });')).not.to.be(-1);
            done();
        });
    });

    it('paths & package alias', function (done) {
        var Project = path.resolve(__dirname, 'data', 'dummy-project-2');
        var processContext = new ProcessContext({
            baseDir: Project,
            exclude: [],
            outputDir: 'output',
            fileEncodings: {}
        });
        base.traverseDir(Project, processContext);

        var p2 = new ModuleCompiler();

        base.launchProcessors([p2], processContext, function () {
            var foo = processContext.getFileByPath('src/foo.js');
            var bar = processContext.getFileByPath('src/bar.js');
            var why = processContext.getFileByPath('src/why.js');
            var lang = processContext.getFileByPath('src/lang.js');
            var langZh = processContext.getFileByPath('src/lang/zh.js');
            expect(base.getModuleIds(why.data)).to.eql([ 'cl', 'common/css', 'etpl', 'etpl/main', 'lib/css', 'why' ]);
            expect(base.getModuleIds(foo.data)).to.eql([ 'cl', 'common/css', 'foo', 'lib/css' ]);
            expect(base.getModuleIds(bar.data)).to.eql([ 'bar', 'cl', 'common/css', 'lib/css' ]);
            expect(base.getModuleIds(lang.data)).to.eql([ 'bar2', 'foo2', 'lang' ]);
            expect(base.getModuleIds(langZh.data)).to.eql([ 'bar2', 'foo3', 'lang/zh' ]);
            done();
        });
    });

    it('ssp promise duplicate issue', function (done) {
        // 这个issue原因在于
        // ModuleCompiler的执行过程中会修改 FileInfo.data
        // 而且因为 foo 依赖 bar 并且 bar 先执行，因此 bar 的 data 里面
        // 已经包含了 promise 的代码
        // 之后当我们开始合并 foo 的代码的时候，bar.data 已经不是我们期望
        // 的内容了（因为已经包含了 promise 的代码，貌似 bar.rawData 是我们所期望的）
        // #325重构之前，因为每次都是fs.readFileSync，所以得到的内容是干净的
        var p2 = new ModuleCompiler({
            getCombineConfig: function() {
                return {
                    'ssp/bar': 1,
                    'ssp/foo': {
                        files: [
                            '!ssp/promise'
                        ]
                    }
                };
            }
        });

        base.launchProcessors([p2], processContext, function () {
            var bar = processContext.getFileByPath('src/ssp/bar.js');
            expect(base.getModuleIds(bar.data)).to.eql(['ssp/bar', 'ssp/promise']);

            var foo = processContext.getFileByPath('src/ssp/foo.js');
            expect(base.getModuleIds(foo.data)).to.eql(['ssp/bar', 'ssp/foo']);
            done();
        });
    });
});



















/* vim: set ts=4 sw=4 sts=4 tw=100: */
