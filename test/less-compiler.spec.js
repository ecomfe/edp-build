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
var expect = require('expect.js');

var LessCompiler = require('../lib/processor/less-compiler.js');
var ProcessContext = require( '../lib/process-context' );
var base = require('./base');

var pageEntries = 'html,htm,phtml,tpl,vm';

describe('less-compiler', function(){
    it('default', function(done){
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
            expect( fileData.data ).to.be( '.m1{background:url(\'../../img/logo.gif\')}' );
            expect( htmlFileData.data ).to.be( '<head><link rel="stylesheet" href="1.css"></head>' );
            done();
        });
    });

    it('custom less module', function(done){
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
            expect( fileData.data ).to.be( '.m1{background:url(\'../../img/logo.gif\')}' );
            done();
        });
    });

    it('edp-issue-166', function(done){
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
            expect( fileData.data ).to.be( '.banner{font-weight:bold;line-height:40px;' +
                'margin:0 auto}body{color:#444;background:url("../img/white-sand.png")}' );
            done();
        });
    });


    it('additional data', function (done) {
        var processor = new LessCompiler({
            less: require( '../node_modules/less' ),
            entryExtnames: pageEntries,
            compileOptions: {
                compress: true,
                modifyVars: {
                    x: '2px'
                }
            }
        });

        var fileData = base.getFileInfo('data/css-compressor/with-var.less', __dirname);
        var processContext = {
            baseDir: __dirname,
            addFileLink: function(){}
        };
        processor.process(fileData, processContext, function() {
            expect( fileData.data ).to.be( 'div{width:2px}');
            done();
        });
    });

    it('sourceMapOptions (inline)', function (done) {
        var processor = new LessCompiler({
            entryExtnames: pageEntries,
            compileOptions: {
                compress: true,
                modifyVars: {
                    x: '2px'
                }
            },
            sourceMapOptions: {
                inline: true
            }
        });
        var fileData = base.getFileInfo('data/css-compressor/with-var.less', __dirname);
        var processContext = new ProcessContext( {
            baseDir: __dirname,
            exclude: [],
            outputDir: 'output',
            fileEncodings: {}
        });
        processContext.addFile(fileData);
        base.launchProcessors([processor], processContext, function() {
            expect(fileData.data).to.be('div{width:2px}/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9sZWVpZ2h0L2xvY2FsL2xlZWlnaHQuZ2l0aHViLmNvbS9lZHAtY2xpL2VkcC1idWlsZC90ZXN0L2RhdGEvY3NzLWNvbXByZXNzb3Ivd2l0aC12YXIubGVzcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFDQSxJQUNJIiwic291cmNlc0NvbnRlbnQiOlsiQHg6IDFweDtcbmRpdiB7XG4gICAgd2lkdGg6IEB4O1xufVxuXG5AeDogMnB4OyJdfQ== */');
            done();
        });
    });

    it('sourceMapOptions (external)', function (done) {
        var processor = new LessCompiler({
            entryExtnames: pageEntries,
            compileOptions: {
                compress: true,
                modifyVars: {
                    x: '2px'
                }
            },
            sourceMapOptions: {
                inline: false
            }
        });
        var fileData = base.getFileInfo('data/css-compressor/with-var.less', __dirname);
        var processContext = new ProcessContext( {
            baseDir: __dirname,
            exclude: [],
            outputDir: 'output',
            fileEncodings: {}
        });
        processContext.addFile(fileData);
        base.launchProcessors([processor], processContext, function() {
            expect(fileData.data).to.be('div{width:2px}/*# sourceMappingURL=with-var.css.map */');

            var sourceMapFile = processContext.getFileByPath('data/css-compressor/with-var.css.map');
            expect(sourceMapFile != null).to.be(true);

            // var sources = JSON.parse(sourceMapFile.data).sources;
            // expect(sources).to.be(['data/css-compressor/with-var.less']);

            done();
        });
    });
});

