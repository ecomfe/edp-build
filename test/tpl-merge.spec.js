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

var fs = require('fs');
var path = require('path');

var base = require('./base');
var Project = path.resolve(__dirname, 'data', 'dummy-project');
var TplMerge = require( '../lib/processor/tpl-merge' );
var ProcessContext = require( '../lib/process-context' );
var ModuleCompiler = require('../lib/processor/module-compiler.js');

var moduleEntries = 'html,htm,phtml,tpl,vm,js';
var pageEntries = 'html,htm,phtml,tpl,vm';

function getModuleInfo(name) {
    var code = fs.readFileSync(path.resolve(Project, 'src', name), 'utf-8');
    var ast = require('esprima').parse(code);
    var moduleInfo = AnalyseModyle(ast);

    return moduleInfo;
}

describe('tpl-merge', function() {
    it('case1 should pass', function(){
        var processor = new TplMerge({
            pluginIds: [ 'tpl', 'er/tpl', 'no-such-plugin' ]
        });

        var filePath = path.join( Project, 'src', 'case1.js' );
        var fileData = base.getFileInfo( filePath );

        var processContext = new ProcessContext( {
            baseDir: Project,
            exclude: [],
            outputDir: 'output',
            fileEncodings: {}
        });
        processor.process( fileData, processContext, function() {
            processor.done( processContext );
            var expected = 
                "define('case1', [\n" +
                "    'foo',\n" +
                "    'tpl!./tpl/123.html'\n" +
                "], function (foo, require, exports, module) {\n" +
                "    require('tpl!d0d179ca.tpl.html');\n" +
                "    require('no-such-plugin!d0d179ca.tpl.html');\n" +
                "    require('tpl!d0d179ca.tpl.html');\n" +
                "    var z = require('jquery');\n" +
                "    return 'case1';\n" +
                "});"
            expect( fileData.data ).toBe( expected );
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

        var processContext = new ProcessContext( {
            baseDir: Project,
            exclude: [],
            outputDir: 'output',
            fileEncodings: {}
        });

        var f1 = base.getFileInfo( path.join( Project, 'src', 'require-tpl-31.js' ) );
        var f2 = base.getFileInfo( path.join( Project, 'src', 'issue31.js' ) );
        processContext.addFile( f1 );
        processContext.addFile( f2 );

        var processors = [
            p1, p2
        ];
        base.launchProcessors(processors, processContext, function(){
            var f2Expected = 
                "define('require-tpl-31', function () {\n" +
                "    require('er/tpl!8a339213.tpl.html');\n" +
                "});\n" +
                "define('issue31', function () {\n" +
                "    require('./require-tpl-31');\n" +
                "    return 'issue31';\n" +
                "});"
            var f1Expected = 
                "define('require-tpl-31', function () {\n" +
                "    require('er/tpl!8a339213.tpl.html');\n" +
                "});";

            expect( f2.data ).toBe( f2Expected );
            expect( f1.data ).toBe( f1Expected );
        });
    })
});






















/* vim: set ts=4 sw=4 sts=4 tw=100: */
