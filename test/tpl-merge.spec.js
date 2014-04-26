/***************************************************************************
 *
 * Copyright (c) 2014 Baidu.com, Inc. All Rights Reserved
 * $Id$
 *
 **************************************************************************/



/**
 * tpl-merge.spec.js ~ 2014/02/24 22:23:50
 * @author leeight(liyubei@baidu.com)
 * @version $Revision$
 * @description
 *
 **/
// var edp = require( 'edp-core' );

// var fs = require('fs');
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
//     var ast = edp.esl.getAst( code );
//     var moduleInfo = analyseModyle(ast);

//     return moduleInfo;
// }

describe('tpl-merge', function() {
    it('case1 should pass', function(){
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
                '    \'tpl!./tpl/123.html\'\n' +
                '], function (foo, require, exports, module) {\n' +
                '    require(\'tpl!d0d179ca.tpl.html\');\n' +
                '    require(\'no-such-plugin!d0d179ca.tpl.html\');\n' +
                '    require(\'tpl!d0d179ca.tpl.html\');\n' +
                '    var z = require(\'jquery\');\n' +
                '    return \'case1\';\n' +
                '});';
            expect( fileData.data ).toBe( expected );
        });
    });

    it('ecomfe/edp/issues/139', function(){
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
        var done = false;
        waitsFor(function(){ return done; });
        base.launchProcessors(processors, processContext, function(){
            done = true;
            var f2Expected = 'define("require-tpl-31",function(){require("jstpl!f6064694.tpl")}),' +
                'define("issue31",function(){return require("./require-tpl-31"),"issue31"});';
            var f1Expected = 'define("require-tpl-31",function(){require("jstpl!f6064694.tpl")});';

            runs(function(){
                expect( f2.data ).toBe( f2Expected );
                expect( f1.data ).toBe( f1Expected );
                expect( processContext.getFileByPath( 'src/f6064694.tpl.js' ) ).not.toBe( null );
            });
        });

    });

    it('issue#31', function(){
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

        var done = false;
        waitsFor(function(){ return done; });
        base.launchProcessors(processors, processContext, function(){
            done = true;
            var f2Expected = 'define("require-tpl-31",function(){require("er/tpl!8a339213.tpl.html")}),' +
                'define("issue31",function(){return require("./require-tpl-31"),"issue31"});';
            var f1Expected = 'define("require-tpl-31",function(){require("er/tpl!8a339213.tpl.html")});';

            runs(function(){
                expect( f2.data ).toBe( f2Expected );
                expect( f1.data ).toBe( f1Expected );
                expect( processContext.getFileByPath( 'src/8a339213.tpl.html' ) ).not.toBe( null );
            });
        });
    });

    it('outputPath', function(){
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

        var done = false;
        waitsFor(function(){ return done; });
        base.launchProcessors(processors, processContext, function(){
            done = true;
            var f2Expected = 'define("require-tpl-31",function(){require("er/tpl!foo/bar/tpl.html")}),' +
                'define("issue31",function(){return require("./require-tpl-31"),"issue31"});';
            var f1Expected = 'define("require-tpl-31",function(){require("er/tpl!foo/bar/tpl.html")});';

            runs(function(){
                expect( f2.data ).toBe( f2Expected );
                expect( f1.data ).toBe( f1Expected );
                expect( processContext.getFileByPath( 'src/foo/bar/tpl.html' ) ).not.toBe( null );
            });
        });
    });

    it('outputPath 2', function(){
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

        var done = false;
        waitsFor(function(){ return done; });
        base.launchProcessors(processors, processContext, function(){
            done = true;
            var f2Expected = 'define("require-tpl-31",function(){require("jstpl!foo/bar/tpl")}),' +
                'define("issue31",function(){return require("./require-tpl-31"),"issue31"});';
            var f1Expected = 'define("require-tpl-31",function(){require("jstpl!foo/bar/tpl")});';

            runs(function(){
                expect( f2.data ).toBe( f2Expected );
                expect( f1.data ).toBe( f1Expected );
                expect( processContext.getFileByPath( 'src/foo/bar/tpl.js' ) ).not.toBe( null );
            });
        });
    });

    it('outputPath + outputWrapper', function(){
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

        var done = false;
        waitsFor(function(){ return done; });
        base.launchProcessors(processors, processContext, function(){
            done = true;
            var f2Expected = 'define("require-tpl-31",function(){require("jstpl!foo/bar/tpl2")}),' +
                'define("issue31",function(){return require("./require-tpl-31"),"issue31"});';
            var f1Expected = 'define("require-tpl-31",function(){require("jstpl!foo/bar/tpl2")});';

            runs(function(){
                expect( f2.data ).toBe( f2Expected );
                expect( f1.data ).toBe( f1Expected );
                var f = processContext.getFileByPath( 'src/foo/bar/tpl2.js' );
                expect( f ).not.toBe( null );
                expect( f.data.indexOf( 'define("foo/bar/tpl2"' ) ).toBe( 0 );
            });
        });
    });
});






















/* vim: set ts=4 sw=4 sts=4 tw=100: */
