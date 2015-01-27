/***************************************************************************
 * 
 * Copyright (c) 2014 Baidu.com, Inc. All Rights Reserved
 * $Id$ 
 * 
 **************************************************************************/
 
 
 
/**
 * md5-renamer.spec.js ~ 2014/04/30 13:35:06
 * @author leeight(liyubei@baidu.com)
 * @version $Revision$ 
 * @description 
 *  
 **/
var edp = require( 'edp-core' );
var path = require( 'path' );

var base = require( './base' );
var Project = path.resolve( __dirname, 'data', 'dummy-project' );
var MD5Renamer = require( '../lib/processor/md5-renamer' );
var ProcessContext = require( '../lib/process-context' );

describe( 'md5-renamer', function() {
    it( 'default', function(done){
        var p1 = new MD5Renamer({
            files: [
                'index.html'
            ]
        });
        var processContext = new ProcessContext( {
            baseDir: Project,
            exclude: [],
            outputDir: 'output',
            fileEncodings: {}
        });
        var f1 = base.getFileInfo( 'index.html', Project );
        processContext.addFile( f1 );

        var processors = [
            p1
        ];

        base.launchProcessors( processors, processContext, function(){
            var f = processContext.getFileByPath( 'index.html' );
            expect( f ).not.toBeUndefined();
            done();
        });
    });

    it( 'custom outputname', function(done){
        var p1 = new MD5Renamer({
            files: [
                'index.html'
            ],
            outputTemplate: '{basename}-{md5sum}{extname}',
            start: 1,
            end: 12
        });
        var processContext = new ProcessContext( {
            baseDir: Project,
            exclude: [],
            outputDir: 'output',
            fileEncodings: {}
        });
        var f1 = base.getFileInfo( 'index.html', Project );
        processContext.addFile( f1 );

        var processors = [
            p1
        ];

        base.launchProcessors( processors, processContext, function(){
            var f = processContext.getFileByPath( 'index.html' );
            expect( f ).not.toBeUndefined();
            done();
        });
    });

    it( 'issue-235', function(done){
        // replacements不生效的问题
        var p1 = new MD5Renamer({
            files: [
                'issue-235.html',
                'issue-261.html',
                'src/**/*.css'
            ],
            outputTemplate: '{basename}-{md5sum}{extname}',
            start: 1,
            end: 12,
            resolve: function( lookup, resource ){
                if ( resource.indexOf( '{%$tplData.feRoot%}' ) === 0 ) {
                    return resource.replace( '{%$tplData.feRoot%}/', '' );
                }
            }
        });
        var processContext = new ProcessContext( {
            baseDir: Project,
            exclude: [],
            outputDir: 'output',
            fileEncodings: {}
        });
        base.traverseDir( Project, processContext );

        var processors = [
            p1
        ];

        base.launchProcessors( processors, processContext, function(){
            var f1 = processContext.getFileByPath( 'src/common/logo.gif' );
            var f2 = processContext.getFileByPath( 'src/common/main.css' );
            var f3 = processContext.getFileByPath( 'src/common/main.js' );
            var k1 = processContext.getFileByPath( 'src/biz/foo.css' );
            expect( f1.outputPaths ).toEqual( ( [ 'src/common/logo-ba001c53c2b.gif' ] ) );
            expect( f2.outputPaths ).toEqual( ( [ 'src/common/main-5de4eeb0d4f.css' ] ) );
            expect( f3.outputPaths ).toEqual( ( [ 'src/common/main-d299e81d71c.js' ] ) );
            expect( k1.outputPaths ).toEqual( ( [ 'src/biz/foo-7506118fea0.css' ] ) );

            var f4 = processContext.getFileByPath( 'issue-235.html' );
            expect( f4.data.indexOf( 'src/common/main-d299e81d71c.js?foo=bar#hello=world' ) ).not.toBe( -1 );
            expect( f4.data.indexOf( 'src/common/main-5de4eeb0d4f.css' ) ).not.toBe( -1 );
            expect( f4.data.indexOf( 'src/common/logo-ba001c53c2b.gif' ) ).not.toBe( -1 );
            expect( f4.data.indexOf( '<script src="http://www.baidu.com/a.js?x=1"></script>' ) ).not.toBe( -1 );
            expect( f4.data.indexOf( '<script src="//www.baidu.com/foo/bar.js?y=2"></script>' ) ).not.toBe( -1 );
            expect( f4.data.indexOf( '<script src="https://www.google.com/ssl.js#a=b"></script>' ) ).not.toBe( -1 );
            expect( f4.data.indexOf( '<embed src=\'src/common/logo-ba001c53c2b.gif\' widht=100 height=200 />' ) ).not.toBe( -1 );
            expect( f4.data.indexOf( '<param value=\'src/common/logo-ba001c53c2b.gif\' name="movie" />' ) ).not.toBe( -1 );
            expect( f4.data.indexOf( '<param value="src/common/logo.gif" />' ) ).not.toBe( -1 );


            var f5 = processContext.getFileByPath( 'src/common/main.css' );
            expect( f5.data.indexOf( 'logo-ba001c53c2b.gif' ) ).not.toBe( -1 );
            var f6 = processContext.getFileByPath( 'src/biz/foo.css' );
            expect( f6.data.indexOf( '../common/logo-ba001c53c2b.gif' ) ).not.toBe( -1 );
            expect( f6.data.indexOf( 'background: url(../common/logo-ba001c53c2b.gif)  ;' ) ).not.toBe( -1 );
            expect( f6.data.indexOf( 'background: url("../common/logo-ba001c53c2b.gif");' ) ).not.toBe( -1 );

            var f7 = processContext.getFileByPath( 'issue-261.html' );
            expect( f7.data.indexOf( '{%$tplData.feRoot%}/src/common/main-d299e81d71c.js?foo=bar#hello=world' ) ).not.toBe( -1 );
            expect( f7.data.indexOf( '{%$tplData.feRoot%}/src/common/main-5de4eeb0d4f.css' ) ).not.toBe( -1 );
            expect( f7.data.indexOf( '{%$tplData.feRoot%}/src/common/logo-ba001c53c2b.gif' ) ).not.toBe( -1 );
            expect( f7.data.indexOf( '<script src="http://www.baidu.com/a.js?x=1"></script>' ) ).not.toBe( -1 );
            expect( f7.data.indexOf( '<script src="//www.baidu.com/foo/bar.js?y=2"></script>' ) ).not.toBe( -1 );
            expect( f7.data.indexOf( '<script src="https://www.google.com/ssl.js#a=b"></script>' ) ).not.toBe( -1 );
            expect( f7.data.indexOf( '<embed src=\'{%$tplData.feRoot%}/src/common/logo-ba001c53c2b.gif\' widht=100 height=200 />' ) ).not.toBe( -1 );
            expect( f7.data.indexOf( '<param value=\'{%$tplData.feRoot%}/src/common/logo-ba001c53c2b.gif\' name="movie" />' ) ).not.toBe( -1 );
            expect( f7.data.indexOf( '<param value="{%$tplData.feRoot%}/src/common/logo.gif" />' ) ).not.toBe( -1 );

            done();
        });
    });

    it( 'issue-235-1 & issue-261', function(done){
        // replacements不生效的问题
        var p1 = new MD5Renamer({
            outputTemplate: '{basename}-{md5sum}{extname}',
            start: 1,
            end: 12,
            replacements: {
                html: {
                    tags: [
                        { tag: 'img', attribute: 'src' }
                    ],
                    files: [ 'issue-235.html' ]
                }
            }
        });
        var processContext = new ProcessContext( {
            baseDir: Project,
            exclude: [],
            outputDir: 'output',
            fileEncodings: {}
        });
        base.traverseDir( Project, processContext );

        var processors = [
            p1
        ];

        base.launchProcessors( processors, processContext, function(){
            var f1 = processContext.getFileByPath( 'src/common/logo.gif' );
            var f2 = processContext.getFileByPath( 'src/common/main.css' );
            var f3 = processContext.getFileByPath( 'src/common/main.js' );
            var k1 = processContext.getFileByPath( 'src/biz/foo.css' );
            expect( f1.outputPaths ).toEqual( ( [ 'src/common/logo-ba001c53c2b.gif' ] ) );
            expect( f2.outputPaths ).toEqual( ( [ ] ) );
            expect( f3.outputPaths ).toEqual( ( [ ] ) );
            expect( k1.outputPaths ).toEqual( ( [ ] ) );

            var f4 = processContext.getFileByPath( 'issue-235.html' );
            expect( f4.data.indexOf( 'src/common/main.js?foo=bar#hello=world' ) ).not.toBe( -1 );
            expect( f4.data.indexOf( 'src/common/main.css' ) ).not.toBe( -1 );
            expect( f4.data.indexOf( 'src/common/logo-ba001c53c2b.gif' ) ).not.toBe( -1 );
            expect( f4.data.indexOf( '<script src="http://www.baidu.com/a.js?x=1"></script>' ) ).not.toBe( -1 );
            expect( f4.data.indexOf( '<script src="//www.baidu.com/foo/bar.js?y=2"></script>' ) ).not.toBe( -1 );
            expect( f4.data.indexOf( '<script src="https://www.google.com/ssl.js#a=b"></script>' ) ).not.toBe( -1 );
            expect( f4.data.indexOf( '<embed src=\'src/common/logo.gif\' widht=100 height=200 />' ) ).not.toBe( -1 );
            expect( f4.data.indexOf( '<param value=\'src/common/logo.gif\' name="movie" />' ) ).not.toBe( -1 );
            expect( f4.data.indexOf( '<param value="src/common/logo.gif" />' ) ).not.toBe( -1 );


            var f5 = processContext.getFileByPath( 'src/common/main.css' );
            expect( f5.data.indexOf( 'logo.gif' ) ).not.toBe( -1 );
            var f6 = processContext.getFileByPath( 'src/biz/foo.css' );
            expect( f6.data.indexOf( '../common/logo.gif' ) ).not.toBe( -1 );
            expect( f6.data.indexOf( 'background: url  (../common/logo.gif)  ;' ) ).not.toBe( -1 );
            expect( f6.data.indexOf( 'background: url("../common/logo.gif");' ) ).not.toBe( -1 );

            done();
        });
    });
});



















/* vim: set ts=4 sw=4 sts=4 tw=100: */
