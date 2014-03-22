/***************************************************************************
 * 
 * Copyright (c) 2014 Baidu.com, Inc. All Rights Reserved
 * $Id$ 
 * 
 **************************************************************************/
 
 
 
/**
 * using-ztpl.spec.js ~ 2014/03/22 15:14:04
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

describe('using-ztpl', function(){
    // 需要测试的是如果define不是global call，看看是否combine的代码是否正常
    it('default', function(){
        var processor = new ModuleCompiler({
            exclude: [],
            configFile: 'module.conf',
            entryExtnames: moduleEntries,
            getCombineConfig: function() {
                return {
                    'using-ztpl': true
                }
            }
        });

        var filePath = path.join(Project, 'src', 'using-ztpl.js');
        var fileData = base.getFileInfo(filePath);

        var processContext = { baseDir: Project }
        processor.process(fileData, processContext, function(){
            var expected =
                "(function (root) {\n" +
                "    var ztpl = 'ztpl';\n" +
                "    define('common/ztpl', ztpl);\n" +
                "}(this));\n" +
                "\n" +
                "\n" +
                "/** d e f i n e */\n" +
                "define(\"ztpl\", function(require){ return require(\"common/ztpl\"); });\n" +
                "\n" +
                "\n" +
                "/** d e f i n e */\n" +
                "define(\"ztpl2\", function(require){ return require(\"common/ztpl\"); });\n" +
                "\n" +
                "define('using-ztpl', function (require) {\n" +
                "    var ztpl = require('./common/ztpl');\n" +
                "    console.log(ztpl);\n" +
                "});"
            expect( fileData.data ).toBe( expected );
        });
    });
});





















/* vim: set ts=4 sw=4 sts=4 tw=100: */
