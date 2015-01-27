/***************************************************************************
 *
 * Copyright (c) 2014 Baidu.com, Inc. All Rights Reserved
 * $Id$
 *
 **************************************************************************/



/**
 * string-replace-processor.spec.js ~ 2014/02/12 11:22:11
 * @author leeight(liyubei@baidu.com)
 * @version $Revision$
 * @description
 * 测试一下ModuleCompiler的功能是否正常
 **/
var path = require('path');

var base = require('./base');
var StringReplace = require('../lib/processor/string-replace.js');
var JsCompressor = require('../lib/processor/js-compressor.js');

var Project = path.resolve(__dirname, 'data', 'dummy-project');
// var ConfigFile = path.resolve(Project, 'module.conf');

// var moduleEntries = 'html,htm,phtml,tpl,vm,js';
// var pageEntries = 'html,htm,phtml,tpl,vm';


describe('string-replace-processor', function(){
    it('default', function(){
        var processor = new StringReplace({
            replacements: [
                { 'from': 'io/File', 'to': 'io/File2' },
                { 'from': 'net/Http', 'to': 'net/Http2' },
                { 'from': 'er/View', 'to': 'er/View2' }
            ]
        });
        var filePath = path.join(Project, 'src', 'foo.js');
        var fileData = base.getFileInfo(filePath);

        var processContext = { baseDir: Project };
        processor.process(fileData, processContext, function(){
            var js = new JsCompressor();
            js.process(fileData, processContext, function(){
                expect(fileData.data).toBe('define(function(require){' +
                    'require("io/File2"),' +
                    'require("net/Http2"),' +
                    'require("er/View2");return"foo"});');
            });
        });
    });

    it('regexp', function(){
        var processor = new StringReplace({
            replacements: [
                { 'from': /(['"])([^'"]+)\1/g, 'to': '\'hello world\'' }
            ]
        });
        var filePath = path.join(Project, 'src', 'foo.js');
        var fileData = base.getFileInfo(filePath);

        var processContext = { baseDir: Project };
        processor.process(fileData, processContext, function(){
            var js = new JsCompressor();
            js.process(fileData, processContext, function(){
                expect(fileData.data).toBe('define(function(require){' +
                    'require("hello world"),' +
                    'require("hello world"),' +
                    'require("hello world");return"hello world"});');
            });
        });
    });

    it('regexp and callback', function(){
        var processor = new StringReplace({
            replacements: [
                { 'from': /(['"])([^'"]+)\1/g, 'to': function(match, $1, $2){ return $1 + 'z' + $2 + $1; } },
                { 'from': 'net/Http', 'to': 'net/Http2' }
            ]
        });
        var filePath = path.join(Project, 'src', 'foo.js');
        var fileData = base.getFileInfo(filePath);

        var processContext = { baseDir: Project };
        processor.process(fileData, processContext, function(){
            var js = new JsCompressor();
            js.process(fileData, processContext, function(){
                expect(fileData.data).toBe('define(function(require){' +
                    'require("zio/File"),' +
                    'require("znet/Http2"),' +
                    'require("zer/View");return"zfoo"});');
            });
        });
    });
});



















/* vim: set ts=4 sw=4 sts=4 tw=100: */
