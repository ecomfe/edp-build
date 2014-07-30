/***************************************************************************
 *
 * Copyright (c) 2014 Baidu.com, Inc. All Rights Reserved
 * $Id$
 *
 **************************************************************************/



/**
 * less-compiler.spec.js ~ 2014/02/24 21:13:56
 * @author leeight(liyubei@baidu.com)
 * @version $Revision$
 * @description
 *
 **/
var path = require('path');

var LessCompiler = require('../lib/processor/less-compiler.js');
var ProcessContext = require( '../lib/process-context' );
var base = require('./base');

var pageEntries = 'html,htm,phtml,tpl,vm';
describe('less-compiler', function(){
    it('default', function(){
        var processor = new LessCompiler({
            entryExtnames: pageEntries
        });

        var fileData = base.getFileInfo('data/css-compressor/1.less', __dirname);
        var htmlFileData = base.getFileInfo('data/css-compressor/1.less.html', __dirname);

        var processContext = new ProcessContext( {
            baseDir: __dirname,
            exclude: [],
            outputDir: 'output',
            fileEncodings: {}
        });

        processContext.addFile(fileData);
        processContext.addFile(htmlFileData);
        base.launchProcessors([processor], processContext, function() {
            expect( fileData.data ).toBe( '.m1{background:url(\'../../img/logo.gif\')}' );
            expect( htmlFileData.data ).toBe( '<head><link rel="stylesheet" href="1.css"></head>' );
        });
    });

    it('custom less module', function(){
        var processor = new LessCompiler({
            less: require( '../node_modules/less' ),
            entryExtnames: pageEntries,
            compileOptions: {
                compress: true
            }
        });

        var fileData = base.getFileInfo('data/css-compressor/1.less', __dirname);
        var processContext = {
            baseDir: __dirname,
            addFileLink: function(){}
        };
        processor.process(fileData, processContext, function() {
            expect( fileData.data ).toBe( '.m1{background:url(\'../../img/logo.gif\')}' );
        });
    });

    it('edp-issue-166', function(){
        var processor = new LessCompiler({
            less: require( '../node_modules/less' ),
            entryExtnames: pageEntries,
            compileOptions: {
                compress: true
            }
        });

        var fileData = base.getFileInfo('data/css-compressor/edp-issue-166.less', __dirname);
        var processContext = {
            baseDir: __dirname,
            addFileLink: function(){}
        };
        processor.process(fileData, processContext, function() {
            expect( fileData.data ).toBe( '.banner{font-weight:bold;line-height:40px;' +
                'margin:0 auto}body{color:#444;background:url("../img/white-sand.png")}' );
        });
    });
});





















/* vim: set ts=4 sw=4 sts=4 tw=100: */
