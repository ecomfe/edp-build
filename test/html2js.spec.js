/***************************************************************************
 *
 * Copyright (c) 2014 Baidu.com, Inc. All Rights Reserved
 * $Id$
 *
 **************************************************************************/



/**
 * html2js.spec.js ~ 2015/04/13 20:55:59
 * @author junmer(junmer@foxmail.com)
 * @version $Revision$
 * @description
 *
 **/

var ProcessContext = require('../lib/process-context');
var Html2JsCompiler = require('../lib/processor/html2js-compiler.js');
var base = require('./base');
var path = require('path');

describe('html2js-compiler', function() {

    var processor = new Html2JsCompiler({
        extnames: ['html'],
        keepSource: true
    });

    var projectDir = path.resolve( __dirname, 'data', 'dummy-project' );

    var file = base.getFileInfo('data/dummy-project/src/tpl/123.html', __dirname);

    var processContext = new ProcessContext(
        {
            baseDir: projectDir,
            exclude: [],
            outputDir: 'output',
            fileEncodings: {}
        }
    );

    processContext.addFile(file);

    processor.process(file, processContext, function() {

        var jsFile;

        it('have xxx.html.js', function() {
            jsFile = processContext.getFilesByPatterns(['*.html.js'])[0];
            expect(jsFile).not.toBe(undefined);
        });

        it('extname should be js', function() {
            expect(jsFile.extname).toBe('js');
        });

        it('should wrap define', function() {
            expect(/define/.test(jsFile.data)).toBe(true);
        });

        it('should match html', function() {
            expect(/<!-- target:MAIN_PAGE_foo_123/.test(jsFile.data)).toBe(true);
        });

        it('keep source file', function() {
            expect(file.extname).toBe('html');
        });

    });

});

