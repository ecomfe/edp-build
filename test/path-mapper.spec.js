/***************************************************************************
 *
 * Copyright (c) 2014 Baidu.com, Inc. All Rights Reserved
 * $Id$
 *
 **************************************************************************/



/**
 * path-mapper.spec.js ~ 2014/02/11 21:36:36
 * @author leeight(liyubei@baidu.com)
 * @version $Revision$
 * @description
 * 测试一下PathMapper的功能是否正常
 **/
var path = require('path');

var base = require('./base');
var CssCompressor = require('../lib/processor/css-compressor.js');
var PathMapper = require('../lib/processor/path-mapper.js');

var ProcessContext = require( '../lib/process-context' );
var Project = path.resolve(__dirname, 'data', 'dummy-project');
// var ConfigFile = path.resolve(Project, 'module.conf');

var moduleEntries = 'html,htm,phtml,tpl,vm,js';
// var pageEntries = 'html,htm,phtml,tpl,vm';

function list2Map(packages) {
    var map = {};
    packages.forEach(function(pkg){
        map[pkg.name] = pkg.location;
    });

    return map;
}

describe('path-mapper', function() {
    it('default', function(){
        var processor = new PathMapper({
            from: 'src',
            to: 'asset'
        });

        var fileData = base.getFileInfo('issue-222.html', Project);

        var processContext = new ProcessContext( {
            baseDir: Project,
            exclude: [],
            outputDir: 'output',
            fileEncodings: {}
        });
        processContext.addFile(fileData);

        base.launchProcessors([processor], processContext, function(){
            expect(fileData.data.indexOf('href="asset/test/main.less"')).toBeGreaterThan(0);
            expect(fileData.data.indexOf('src="asset/img/logo.png"')).toBeGreaterThan(0);
            expect(fileData.data.indexOf('href="asset/test.html"')).toBeGreaterThan(0);
            expect(fileData.data.indexOf('<param name="movie" value="asset/img/flash.swf">')).toBeGreaterThan(0);
            expect(fileData.data.indexOf('embed src="asset/img/flash.swf"')).toBeGreaterThan(0);
            expect(fileData.data.indexOf('<param name="test" value="src/img/flash.swf">')).toBeGreaterThan(0);
        });
    });

    it('module-config', function(){
        var processor = new PathMapper({
            replacements: [
                { extnames: moduleEntries, replacer: 'module-config' }
            ],
            from: 'src',
            to: 'asset'
        });

        var fileData = base.getFileInfo('index.html', Project);

        var processContext = new ProcessContext( {
            baseDir: Project,
            exclude: [],
            outputDir: 'output',
            fileEncodings: {}
        });
        processContext.addFile(fileData);

        base.launchProcessors([processor], processContext, function(){
            var readLoaderConfig = require( '../lib/util/read-loader-config' );
            var confInfo = readLoaderConfig( fileData.data );
            expect(confInfo).not.toBe(null);

            var config = confInfo.data;
            var pkgMap = list2Map(config.packages);

            expect(pkgMap['dummy']).toBe('http://www.baidu.com/img/src');
            expect(pkgMap['er']).toBe('../dep/er/3.0.2/asset');
            expect(pkgMap['swfupload']).toBe('../dep/swfupload/2.2.0');
        });
    });

    it('inline-css', function(){
        var processor = new PathMapper({
            from: 'src',
            to: 'asset'
        });

        var fileData = base.getFileInfo('issue-281.html', Project);

        var processContext = new ProcessContext( {
            baseDir: Project,
            exclude: [],
            outputDir: 'output',
            fileEncodings: {}
        });
        processContext.addFile(fileData);

        base.launchProcessors([processor], processContext, function(){
            expect(fileData.data.trim()).toBe(
                base.getFileInfo('issue-281.expected.html', Project).data.trim());
        });
    });

    it('css', function(){
        var processor = new PathMapper({
            replacements: [
                { extnames: 'css', replacer: 'css' }
            ],
            from: 'src',
            to: 'asset'
        });
        var fileData = base.getFileInfo('src/css/path-mapper.css',Project);

        var processContext = new ProcessContext( {
            baseDir: Project,
            exclude: [],
            outputDir: 'output',
            fileEncodings: {}
        });
        processContext.addFile(fileData);

        base.launchProcessors([processor], processContext, function(){
            var processor = new CssCompressor();
            processor.process(fileData, {baseDir:__dirname}, function() {
                var expected = 'div{' +
                    'background:url(../../asset/img/logo.gif);' +
                    'background:url(//www.baidu.com/src/img/logo.gif);' +
                    'background:url(//www.baidu.com/src/img/logo.gif);' +
                    'background:url(http://www.baidu.com/src/img/logo.gif);' +
                    'background:url(http://www.baidu.com/src/img/logo.gif);' +
                    'background:url(https://www.baidu.com/src/img/logo.gif);' +
                    'background:url(../../img/logo.gif)' +
                '}';
                expect(fileData.data).toBe(expected);
            });
        });
    });
});





















/* vim: set ts=4 sw=4 sts=4 tw=100: */
