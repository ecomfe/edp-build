/***************************************************************************
 *
 * Copyright (c) 2014 Baidu.com, Inc. All Rights Reserved
 * $Id$
 *
 **************************************************************************/



/**
 * stylus-compiler.spec.js ~ 2014/02/24 21:13:56
 * @author leeight(liyubei@baidu.com)
 * @version $Revision$
 * @description
 *
 **/
var path = require('path');

var StylusCompiler = require('../lib/processor/stylus-compiler.js');
var ProcessContext = require( '../lib/process-context' );
var base = require('./base');

var pageEntries = 'html,htm,phtml,tpl,vm';

function compact( str ) {
    return str.trim().replace(/[\r\n]/g, '');
}

describe('stylus-compiler', function(){
    it('default', function(){
        var processor = new StylusCompiler({
            entryExtnames: pageEntries,
            compileOptions: {
                compress: true
            }
        });

        var fileData = base.getFileInfo('data/css-compressor/1.styl', __dirname);
        var htmlFileData = base.getFileInfo('data/css-compressor/1.styl.html', __dirname);
        var processContext = new ProcessContext( {
            baseDir: __dirname,
            exclude: [],
            outputDir: 'output',
            fileEncodings: {}
        });

        processContext.addFile(fileData);
        processContext.addFile(htmlFileData);
        base.launchProcessors([processor], processContext, function() {
            var expected =
                'body{font:12px Helvetica,Arial,sans-serif}' +
                'a.button{-webkit-border-radius:5px;-moz-border-radius:5px;border-radius:5px}';

            expect( compact( fileData.data ) ).toBe( expected );
            expect( htmlFileData.data ).toBe( '<head><link rel="stylesheet" href="1.css"></head>' );
        });
    });

    it('custom stylus module', function(){
        var processor = new StylusCompiler({
            stylus: require( '../node_modules/stylus' ),
            entryExtnames: pageEntries,
            compileOptions: {
                compress: true
            }
        });

        var fileData = base.getFileInfo('data/css-compressor/1.styl', __dirname);
        var processContext = {
            baseDir: __dirname,
            addFileLink: function(){}
        };
        processor.process(fileData, processContext, function() {
            var expected =
                'body{font:12px Helvetica,Arial,sans-serif}' +
                'a.button{-webkit-border-radius:5px;-moz-border-radius:5px;border-radius:5px}';

            expect( compact( fileData.data ) ).toBe( expected );
        });
    });
});





















/* vim: set ts=4 sw=4 sts=4 tw=100: */
