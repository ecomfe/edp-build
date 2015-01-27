/**
 * tpl-merge.spec.js ~ 2014/02/24 22:23:50
 * @author leeight(liyubei@baidu.com)
 * @version $Revision$
 * @description
 *
 **/
var path = require('path');

var base = require('./base');
var Project = path.resolve(__dirname, 'data', 'dummy-project');
var TplMerge = require( '../lib/processor/tpl-merge' );
var ProcessContext = require( '../lib/process-context' );
var ModuleCompiler = require('../lib/processor/module-compiler.js');
var JsCompressor = require('../lib/processor/js-compressor.js');

var moduleEntries = 'html,htm,phtml,tpl,vm,js';
// var pageEntries = 'html,htm,phtml,tpl,vm';

// function getModuleInfo(name) {
//     var code = fs.readFileSync(path.resolve(Project, 'src', name), 'utf-8');
//     var ast = edp.amd.getAst( code );
//     var moduleInfo = analyseModyle(ast);

//     return moduleInfo;
// }

describe('tpl-merge', function() {
    it('case1 should pass', function(done){
        var processor = new TplMerge({
            pluginIds: [ 'tpl', 'er/tpl', 'no-such-plugin' ]
        });

        var fileData = base.getFileInfo( 'src/case1.js', Project );

        var processContext = new ProcessContext( {
            baseDir: Project,
            exclude: [],
            outputDir: 'output',
            fileEncodings: {}
        });
        processor.process( fileData, processContext, function() {
            processor.afterAll( processContext );
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
            expect( fileData.data ).toBe( expected );
            expect( processContext.getFileByPath( 'dep/er/3.0.2/src/tpl/hello.tpl.html' ) ).not.toBe( null );
            done();
        });
    });

    it('ecomfe/edp/issues/139', function(done){
        // 同样的tpl在多个js中出现，这些js都应该被处理
        // 以前的判断逻辑导致只处理第一次出现的那个js文件
        var p1 = new ModuleCompiler({
            exclude: [],
            configFile: 'module.conf',
            entryExtnames: moduleEntries,
            getCombineConfig: function( combineModules ) {
                combineModules.issue31 = 1;
                return combineModules;
            }
        });
        var p2 = new TplMerge({
            outputPluginId: 'jstpl',
            outputType: 'js'
        });
        var p3 = new JsCompressor();

        var processContext = new ProcessContext( {
            baseDir: Project,
            exclude: [],
            outputDir: 'output',
            fileEncodings: {}
        });

        var f1 = base.getFileInfo( 'src/require-tpl-31.js', Project );
        var f2 = base.getFileInfo( 'src/issue31.js', Project );
        processContext.addFile( f1 );
        processContext.addFile( f2 );

        var processors = [
            p1, p2, p3
        ];
        base.launchProcessors(processors, processContext, function(){
            var f2Expected = 'define("require-tpl-31",["require","jstpl!398d3d1e.tpl"],function(require){require("jstpl!398d3d1e.tpl")}),' +
                'define("issue31",["require","./require-tpl-31"],function(require){return require("./require-tpl-31"),"issue31"});';
            var f1Expected = 'define("require-tpl-31",["require","jstpl!398d3d1e.tpl"],function(require){require("jstpl!398d3d1e.tpl")});';

            expect( f2.data ).toBe( f2Expected );
            expect( f1.data ).toBe( f1Expected );
            expect( processContext.getFileByPath( 'src/398d3d1e.tpl.js' ) ).not.toBe( null );
            done();
        });
    });

    it('issue#31', function(done){
        // 同样的tpl在多个js中出现，这些js都应该被处理
        // 以前的判断逻辑导致只处理第一次出现的那个js文件
        var p1 = new ModuleCompiler({
            exclude: [],
            configFile: 'module.conf',
            entryExtnames: moduleEntries,
            getCombineConfig: function( combineModules ) {
                combineModules.issue31 = 1;
                return combineModules;
            }
        });
        var p2 = new TplMerge();
        var p3 = new JsCompressor();

        var processContext = new ProcessContext( {
            baseDir: Project,
            exclude: [],
            outputDir: 'output',
            fileEncodings: {}
        });

        var f1 = base.getFileInfo( 'src/require-tpl-31.js', Project );
        var f2 = base.getFileInfo( 'src/issue31.js', Project );
        processContext.addFile( f1 );
        processContext.addFile( f2 );

        var processors = [
            p1, p2, p3
        ];

        base.launchProcessors(processors, processContext, function(){
            var f2Expected = 'define("require-tpl-31",["require","er/tpl!8a339213.tpl.html"],function(require){require("er/tpl!8a339213.tpl.html")}),' +
                'define("issue31",["require","./require-tpl-31"],function(require){return require("./require-tpl-31"),"issue31"});';
            var f1Expected = 'define("require-tpl-31",["require","er/tpl!8a339213.tpl.html"],function(require){require("er/tpl!8a339213.tpl.html")});';

            expect( f2.data ).toBe( f2Expected );
            expect( f1.data ).toBe( f1Expected );
            expect( processContext.getFileByPath( 'src/8a339213.tpl.html' ) ).not.toBe( null );
            expect( processContext.getFileByPath( 'src/tpl/list.tpl.html' ) ).not.toBe( null );
            done();
        });
    });

    it('outputPath', function(done){
        var p1 = new ModuleCompiler({
            exclude: [],
            configFile: 'module.conf',
            entryExtnames: moduleEntries,
            getCombineConfig: function( combineModules ) {
                combineModules.issue31 = 1;
                return combineModules;
            }
        });
        var p2 = new TplMerge({
            outputPath: 'src/foo/bar/tpl.html'
        });
        var p3 = new JsCompressor();

        var processContext = new ProcessContext( {
            baseDir: Project,
            exclude: [],
            outputDir: 'output',
            fileEncodings: {}
        });

        var f1 = base.getFileInfo( 'src/require-tpl-31.js', Project );
        var f2 = base.getFileInfo( 'src/issue31.js', Project );
        processContext.addFile( f1 );
        processContext.addFile( f2 );

        var processors = [
            p1, p2, p3
        ];

        base.launchProcessors(processors, processContext, function(){
            var f2Expected = 'define("require-tpl-31",["require","er/tpl!foo/bar/tpl.html"],function(require){require("er/tpl!foo/bar/tpl.html")}),' +
                'define("issue31",["require","./require-tpl-31"],function(require){return require("./require-tpl-31"),"issue31"});';
            var f1Expected = 'define("require-tpl-31",["require","er/tpl!foo/bar/tpl.html"],function(require){require("er/tpl!foo/bar/tpl.html")});';

            expect( f2.data ).toBe( f2Expected );
            expect( f1.data ).toBe( f1Expected );
            expect( processContext.getFileByPath( 'src/foo/bar/tpl.html' ) ).not.toBe( null );
            done();
        });
    });

    it('outputPath 2', function(done){
        var p1 = new ModuleCompiler({
            exclude: [],
            configFile: 'module.conf',
            entryExtnames: moduleEntries,
            getCombineConfig: function( combineModules ) {
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

        var processContext = new ProcessContext( {
            baseDir: Project,
            exclude: [],
            outputDir: 'output',
            fileEncodings: {}
        });

        var f1 = base.getFileInfo( 'src/require-tpl-31.js', Project );
        var f2 = base.getFileInfo( 'src/issue31.js', Project );
        processContext.addFile( f1 );
        processContext.addFile( f2 );

        var processors = [
            p1, p2, p3
        ];

        base.launchProcessors(processors, processContext, function(){
            var f2Expected = 'define("require-tpl-31",["require","jstpl!foo/bar/tpl"],function(require){require("jstpl!foo/bar/tpl")}),' +
                'define("issue31",["require","./require-tpl-31"],function(require){return require("./require-tpl-31"),"issue31"});';
            var f1Expected = 'define("require-tpl-31",["require","jstpl!foo/bar/tpl"],function(require){require("jstpl!foo/bar/tpl")});';

            expect( f2.data ).toBe( f2Expected );
            expect( f1.data ).toBe( f1Expected );
            expect( processContext.getFileByPath( 'src/foo/bar/tpl.js' ) ).not.toBe( null );
            done();
        });
    });

    it('outputPath + outputWrapper', function(done){
        var p1 = new ModuleCompiler({
            exclude: [],
            configFile: 'module.conf',
            entryExtnames: moduleEntries,
            getCombineConfig: function( combineModules ) {
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

        var processContext = new ProcessContext( {
            baseDir: Project,
            exclude: [],
            outputDir: 'output',
            fileEncodings: {}
        });

        var f1 = base.getFileInfo( 'src/require-tpl-31.js', Project );
        var f2 = base.getFileInfo( 'src/issue31.js', Project );
        processContext.addFile( f1 );
        processContext.addFile( f2 );

        var processors = [
            p1, p2, p3
        ];

        base.launchProcessors(processors, processContext, function(){
            var f2Expected = 'define("require-tpl-31",["require","jstpl!foo/bar/tpl2"],function(require){require("jstpl!foo/bar/tpl2")}),' +
                'define("issue31",["require","./require-tpl-31"],function(require){return require("./require-tpl-31"),"issue31"});';
            var f1Expected = 'define("require-tpl-31",["require","jstpl!foo/bar/tpl2"],function(require){require("jstpl!foo/bar/tpl2")});';

            expect( f2.data ).toBe( f2Expected );
            expect( f1.data ).toBe( f1Expected );
            var f = processContext.getFileByPath( 'src/foo/bar/tpl2.js' );
            expect( f ).not.toBe( null );
            expect( f.data.indexOf( 'define("foo/bar/tpl2"' ) ).toBe( 0 );
            done();
        });
    });
});






















/* vim: set ts=4 sw=4 sts=4 tw=100: */
