/***************************************************************************
 * 
 * Copyright (c) 2014 Baidu.com, Inc. All Rights Reserved
 * $Id$ 
 * 
 **************************************************************************/
 
 
 
/**
 * using-xtpl.spec.js ~ 2014/03/22 09:45:57
 * @author leeight(liyubei@baidu.com)
 * @version $Revision$ 
 * @description 
 *  
 **/
var fs = require('fs');
var path = require('path');

var base = require('./base');
var ModuleCompiler = require('../lib/processor/module-compiler.js');

var Project = path.resolve(__dirname, 'data', 'dummy-project');
var ConfigFile = path.resolve(Project, 'module.conf');

var moduleEntries = 'html,htm,phtml,tpl,vm,js';
var pageEntries = 'html,htm,phtml,tpl,vm';

describe('using-xtpl', function(){
    it('default', function(){
        var processor = new ModuleCompiler({
            exclude: [],
            configFile: 'module.conf',
            entryExtnames: moduleEntries,
            getCombineConfig: function() {
                return {
                    'common/using-xtpl': true
                }
            }
        });

        var filePath = path.join(Project, 'src', 'common', 'using-xtpl.js');
        var fileData = base.getFileInfo(filePath);

        var processContext = { baseDir: Project }
        processor.process(fileData, processContext, function(){
            var expected =
                "define('common/xtpl', function (require) {\n" +
                "    return 'xtpl';\n" +
                "});\n" +
                "\n" +
                "\n" +
                "/** d e f i n e */\n" +
                "define(\"xtpl\", function(require){ return require(\"common/xtpl\"); });\n" +
                "\n" +
                "\n" +
                "/** d e f i n e */\n" +
                "define(\"xtpl2\", function(require){ return require(\"common/xtpl\"); });\n" +
                "\n" +
                "\n" +
                "/** d e f i n e */\n" +
                "define(\"xtpl3\", function(require){ return require(\"common/xtpl\"); });\n" +
                "\n" +
                "define('common/using-xtpl', function (require) {\n" +
                "    var a = require('./xtpl');\n" +
                "    var b = require('xtpl');\n" +
                "    var c = require('common/xtpl');\n" +
                "    return a + b + c;\n" +
                "});"
            expect( fileData.data ).toBe( expected );
        });
    });
});




















/* vim: set ts=4 sw=4 sts=4 tw=100: */
