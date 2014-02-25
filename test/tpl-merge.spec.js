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

        var processContext = { baseDir: Project }
        var processContext = new ProcessContext( {
            baseDir: __dirname,
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
                "    require('tpl!../../../8e1a46c0.tpl.html');\n" +
                "    require('no-such-plugin!../../../8e1a46c0.tpl.html');\n" +
                "    var z = require('jquery');\n" +
                "    return 'case1';\n" +
                "});"
            expect( fileData.data ).toBe( expected );
        });
    });
});






















/* vim: set ts=4 sw=4 sts=4 tw=100: */
