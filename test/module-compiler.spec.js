/***************************************************************************
 *
 * Copyright (c) 2014 Baidu.com, Inc. All Rights Reserved
 * $Id$
 *
 **************************************************************************/



/**
 * module-compiler.spec.js ~ 2014/02/12 11:22:11
 * @author leeight(liyubei@baidu.com)
 * @version $Revision$
 * @description
 * 测试一下ModuleCompiler的功能是否正常
 **/
var fs = require('fs');
var path = require('path');

var base = require('./base');
var ModuleCompiler = require('../lib/processor/module-compiler.js');

var Project = path.resolve(__dirname, 'data', 'dummy-project');
var ConfigFile = path.resolve(Project, 'module.conf');

var moduleEntries = 'html,htm,phtml,tpl,vm,js';
var pageEntries = 'html,htm,phtml,tpl,vm';


describe('module-compiler', function(){
    it('default', function(){
        var processor = new ModuleCompiler({
            exclude: [],
            configFile: 'module.conf',
            entryExtnames: moduleEntries
        });
        var filePath = path.join(Project, 'src', 'foo.js');
        var fileData = base.getFileInfo(filePath);

        var processContext = { baseDir: Project }
        processor.process(fileData, processContext, function(){
            var expected = "define('foo', function (require) {\n" +
                "    var ioFile = require('io/File');\n" +
                "    var netHttp = require('net/Http');\n" +
                "    var erView = require('er/View');\n" +
                "    return 'foo';\n" +
                "});";
            expect(fileData.data).toBe(expected);
        });
    });

    it('getCombineConfig', function(){

        var processor = new ModuleCompiler({
            exclude: [],
            configFile: 'module.conf',
            entryExtnames: moduleEntries,
            getCombineConfig: function() {
                return {
                    'foo': 1
                }
            }
        });
        var filePath = path.join(Project, 'src', 'foo.js');
        var fileData = base.getFileInfo(filePath);

        var processContext = { baseDir: Project }
        processor.process(fileData, processContext, function(){
            var ast = require('esprima').parse(fileData.data);
            var analyseModule = require('../lib/util/analyse-module.js');
            var moduleInfo = analyseModule(ast);
            expect(moduleInfo).not.toBe(null);
            expect(moduleInfo.length).toBe(4);
            expect(moduleInfo[0].id).toBe('er/View');
            expect(moduleInfo[1].id).toBe('net/Http');
            expect(moduleInfo[2].id).toBe('io/File');
            expect(moduleInfo[3].id).toBe('foo');
        });
    });
});



















/* vim: set ts=4 sw=4 sts=4 tw=100: */
