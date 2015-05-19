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

    var otherFile = base.getFileInfo('data/dummy-project/src/foo.js', __dirname);
    processContext.addFile(otherFile);

    var jsFile;

    it('have xxx.html.js', function(done) {
        processor.start(processContext, function() {
            jsFile = processContext.getFilesByPatterns(['*.html.js'])[0];
            expect(jsFile).not.toBe(undefined);
            done();
        });
    });

    it('files filter', function() {
        expect(processor.processFiles.length).toBe(1);
    });

    it('extname should be js', function() {
        expect(jsFile.extname).toBe('js');
    });

    it('wrap define', function() {
        expect(/^define/.test(jsFile.data)).toBe(true);
    });

    it('match html', function() {
        expect(/<!-- target:MAIN_PAGE_foo_123/.test(jsFile.data)).toBe(true);
    });

    it('keep source file', function() {
        expect(processContext.getFilesByPatterns(['*.html']).length).toBe(1);
    });

    describe('without keepSource', function () {
        processor2 = new Html2JsCompiler({
            extnames: ['html']
        });

        processContext2 = new ProcessContext(
            {
                baseDir: projectDir,
                exclude: [],
                outputDir: 'output',
                fileEncodings: {}
            }
        );

        processContext2.addFile(file);
        processContext2.addFile(otherFile);

        it('have xxx.html', function(done) {
            processor2.start(processContext2, function() {
                jsFile = processContext2.getFilesByPatterns(['*.html'])[0];
                expect(jsFile).not.toBe(undefined);
                done();
            });
        });

        it('link xxx.html.js', function () {
            var file = processContext2.getFileByPath(jsFile.path + '.js');
            expect(file).toBe(jsFile);
        });

        it('files filter', function() {
            expect(processor2.processFiles.length).toBe(1);
        });

        it('extname should be js', function() {
            expect(jsFile.extname).toBe('js');
        });

        it('wrap define', function() {
            expect(/^define/.test(jsFile.data)).toBe(true);
        });

        it('match html', function() {
            expect(/<!-- target:MAIN_PAGE_foo_123/.test(jsFile.data)).toBe(true);
        });

    });

});

