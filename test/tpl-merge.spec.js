/**
 * @file test/tpl-merge.spec.js ~ 2014/02/24 22:23:50
 * @author leeight(liyubei@baidu.com)
 */
var path = require('path');

var expect = require('expect.js');

var base = require('./base');
var TplMerge = require('../lib/processor/tpl-merge');
var ProcessContext = require('../lib/process-context');
var ModuleCompiler = require('../lib/processor/module-compiler.js');
var JsCompressor = require('../lib/processor/js-compressor.js');

var Project = path.resolve(__dirname, 'data', 'dummy-project');

describe('tpl-merge', function () {
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


    it('case1 should pass', function (done) {
        var processor = new TplMerge({
            pluginIds: ['tpl', 'er/tpl', 'no-such-plugin']
        });

        base.launchProcessors([processor], processContext, function () {
            var fileData = processContext.getFileByPath('src/case1.js');
            var expected =
                'define(\'case1\', [\n' +
                '    \'foo\',\n' +
                '    \'require\',\n' +
                '    \'tpl!d0d179ca.tpl.html\',\n' +
                '    \'no-such-plugin!d0d179ca.tpl.html\',\n' +
                '    \'jquery\'\n' +
                '], function (foo, require, res) {\n' +
                '    require(\'tpl!d0d179ca.tpl.html\');\n' +
                '    require(\'no-such-plugin!d0d179ca.tpl.html\');\n' +
                '    require(\'tpl!d0d179ca.tpl.html\');\n' +
                '    var z = require(\'jquery\');\n' +
                '    return \'case1\';\n' +
                '});';
            expect(fileData.data).to.be(expected);
            expect(processContext.getFileByPath('dep/er/3.0.2/src/tpl/hello.tpl.html')).not.to.be(null);
            done();
        });
    });

    it('ecomfe/edp/issues/139', function (done) {
        // 同样的tpl在多个js中出现，这些js都应该被处理
        // 以前的判断逻辑导致只处理第一次出现的那个js文件
        var p1 = new ModuleCompiler({
            getCombineConfig: function (combineModules) {
                combineModules.issue31 = 1;
                return combineModules;
            }
        });
        var p2 = new TplMerge({
            outputPluginId: 'jstpl',
            outputType: 'js'
        });
        var p3 = new JsCompressor();

        var processors = [
            p1, p2, p3
        ];

        base.launchProcessors(processors, processContext, function () {
            var f1 = processContext.getFileByPath('src/require-tpl-31.js');
            var f2 = processContext.getFileByPath('src/issue31.js');

            var f2Expected = 'define("require-tpl-31",["require","jstpl!200a006c.tpl"],function(require){require("jstpl!200a006c.tpl")}),' +
                'define("issue31",["require","./require-tpl-31"],function(require){return require("./require-tpl-31"),"issue31"});';
            var f1Expected = 'define("require-tpl-31",["require","jstpl!200a006c.tpl"],function(require){require("jstpl!200a006c.tpl")});';

            expect(f2.data).to.be(f2Expected);
            expect(f1.data).to.be(f1Expected);
            expect(processContext.getFileByPath('src/200a006c.tpl.js')).not.to.be(null);
            done();
        });
    });

    it('issue#31', function (done) {
        // 同样的tpl在多个js中出现，这些js都应该被处理
        // 以前的判断逻辑导致只处理第一次出现的那个js文件
        var p1 = new ModuleCompiler({
            getCombineConfig: function (combineModules) {
                combineModules.issue31 = 1;
                return combineModules;
            }
        });
        var p2 = new TplMerge();
        var p3 = new JsCompressor();

        var processors = [
            p1, p2, p3
        ];

        base.launchProcessors(processors, processContext, function () {
            var f1 = processContext.getFileByPath('src/require-tpl-31.js');
            var f2 = processContext.getFileByPath('src/issue31.js');

            var f2Expected = 'define("require-tpl-31",["require","er/tpl!d0d179ca.tpl.html"],function(require){require("er/tpl!d0d179ca.tpl.html")}),' +
                'define("issue31",["require","./require-tpl-31"],function(require){return require("./require-tpl-31"),"issue31"});';
            var f1Expected = 'define("require-tpl-31",["require","er/tpl!d0d179ca.tpl.html"],function(require){require("er/tpl!d0d179ca.tpl.html")});';

            expect(f2.data).to.be(f2Expected);
            expect(f1.data).to.be(f1Expected);
            expect(processContext.getFileByPath('src/d0d179ca.tpl.html')).not.to.be(null);
            expect(processContext.getFileByPath('src/tpl/list.tpl.html')).not.to.be(null);
            done();
        });
    });

    it('outputPath', function (done) {
        var p1 = new ModuleCompiler({
            getCombineConfig: function (combineModules) {
                combineModules.issue31 = 1;
                return combineModules;
            }
        });
        var p2 = new TplMerge({
            outputPath: 'src/foo/bar/tpl.html'
        });
        var p3 = new JsCompressor();

        var processors = [
            p1, p2, p3
        ];

        base.launchProcessors(processors, processContext, function () {
            var f1 = processContext.getFileByPath('src/require-tpl-31.js');
            var f2 = processContext.getFileByPath('src/issue31.js');

            var f2Expected = 'define("require-tpl-31",["require","er/tpl!foo/bar/tpl.html"],function(require){require("er/tpl!foo/bar/tpl.html")}),' +
                'define("issue31",["require","./require-tpl-31"],function(require){return require("./require-tpl-31"),"issue31"});';
            var f1Expected = 'define("require-tpl-31",["require","er/tpl!foo/bar/tpl.html"],function(require){require("er/tpl!foo/bar/tpl.html")});';

            expect(f2.data).to.be(f2Expected);
            expect(f1.data).to.be(f1Expected);
            expect(processContext.getFileByPath('src/foo/bar/tpl.html')).not.to.be(null);
            done();
        });
    });

    it('outputPath 2', function (done) {
        var p1 = new ModuleCompiler({
            getCombineConfig: function (combineModules) {
                combineModules.issue31 = 1;
                return combineModules;
            }
        });
        var p2 = new TplMerge({
            outputType: 'js',
            outputPluginId: 'jstpl',
            outputPath: 'src/foo/bar/tpl.js'
        });
        var p3 = new JsCompressor();


        var processors = [
            p1, p2, p3
        ];

        base.launchProcessors(processors, processContext, function () {
            var f1 = processContext.getFileByPath('src/require-tpl-31.js');
            var f2 = processContext.getFileByPath('src/issue31.js');

            var f2Expected = 'define("require-tpl-31",["require","jstpl!foo/bar/tpl"],function(require){require("jstpl!foo/bar/tpl")}),' +
                'define("issue31",["require","./require-tpl-31"],function(require){return require("./require-tpl-31"),"issue31"});';
            var f1Expected = 'define("require-tpl-31",["require","jstpl!foo/bar/tpl"],function(require){require("jstpl!foo/bar/tpl")});';

            expect(f2.data).to.be(f2Expected);
            expect(f1.data).to.be(f1Expected);
            expect(processContext.getFileByPath('src/foo/bar/tpl.js')).not.to.be(null);
            done();
        });
    });

    it('outputPath + outputWrapper', function (done) {
        var p1 = new ModuleCompiler({
            getCombineConfig: function (combineModules) {
                combineModules.issue31 = 1;
                return combineModules;
            }
        });
        var p2 = new TplMerge({
            outputType: 'js',
            outputPluginId: 'jstpl',
            outputPath: 'src/foo/bar/tpl2.js',
            outputWrapper: 'define("foo/bar/tpl2", function(){ return %output%; });'
        });
        var p3 = new JsCompressor();

        var processors = [
            p1, p2, p3
        ];

        base.launchProcessors(processors, processContext, function () {
            var f1 = processContext.getFileByPath('src/require-tpl-31.js');
            var f2 = processContext.getFileByPath('src/issue31.js');

            var f2Expected = 'define("require-tpl-31",["require","jstpl!foo/bar/tpl2"],function(require){require("jstpl!foo/bar/tpl2")}),' +
                'define("issue31",["require","./require-tpl-31"],function(require){return require("./require-tpl-31"),"issue31"});';
            var f1Expected = 'define("require-tpl-31",["require","jstpl!foo/bar/tpl2"],function(require){require("jstpl!foo/bar/tpl2")});';

            expect(f2.data).to.be(f2Expected);
            expect(f1.data).to.be(f1Expected);
            var f = processContext.getFileByPath('src/foo/bar/tpl2.js');
            expect(f).not.to.be(null);
            expect(f.data.indexOf('define("foo/bar/tpl2"')).to.be(0);
            done();
        });
    });
});

