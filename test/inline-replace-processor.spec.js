/***************************************************************************
 *
 * Copyright (c) 2015 Baidu.com, Inc. All Rights Reserved
 * $Id$
 *
 **************************************************************************/



/**
 * inline-replace-processor.spec.js ~ 2015/01/04 15:22:11
 * @author junmer(junmer@foxmail.com)
 * @version $Revision$
 * @description 内联测试
 **/
var path = require('path');

var base = require('./base');

var ProcessContext = require('../lib/process-context.js');
var InlineReplace = require('../lib/processor/inline-replace.js');

var Project = path.resolve(__dirname, 'data', 'dummy-project');
// var ConfigFile = path.resolve(Project, 'module.conf');

// var moduleEntries = 'html,htm,phtml,tpl,vm,js';
// var pageEntries = 'html,htm,phtml,tpl,vm';


describe('inline-replace-processor', function() {

    var inline = new InlineReplace();
    var processContext = new ProcessContext( {
        baseDir: Project,
        exclude: [],
        outputDir: 'output',
        fileEncodings: {}
    });

    var fileData = base.getFileInfo('data/dummy-project/issue-70.html', __dirname);

    // js src/foo.js
    var testJsInfo = base.getFileInfo('./src/foo.js', Project);
    processContext.addFile(testJsInfo);

    // css src/css/path-mapper.css
    var testCssInfo = base.getFileInfo('./src/css/path-mapper.css', Project);
    processContext.addFile(testCssInfo);

    inline.process(fileData, processContext, function() {

        it('inline script', function() {
            expect(fileData.data.indexOf(testJsInfo.data)).toBeGreaterThan(0);
        });

        it('inline link', function() {
            expect(fileData.data.indexOf(testCssInfo.data)).toBeGreaterThan(0);
        });

        it('only inline by data-inline', function() {
            expect(fileData.data.indexOf([
                "define(function(require) {",
                "    var er = require('er');",
                "    return er;",
                "});"
            ].join('\n'))).toBe(-1);
        });

    });

});



/* vim: set ts=4 sw=4 sts=4 tw=100: */
