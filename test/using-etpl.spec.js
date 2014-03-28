/***************************************************************************
 *
 * Copyright (c) 2014 Baidu.com, Inc. All Rights Reserved
 * $Id$
 *
 **************************************************************************/



/**
 * using-etpl.spec.js ~ 2014/03/22 15:29:24
 * @author leeight(liyubei@baidu.com)
 * @version $Revision$
 * @description
 *
 **/
// var fs = require('fs');
var path = require('path');

var base = require('./base');
var ModuleCompiler = require('../lib/processor/module-compiler.js');

var Project = path.resolve(__dirname, 'data', 'dummy-project');
// var ConfigFile = path.resolve(Project, 'module.conf');

var moduleEntries = 'html,htm,phtml,tpl,vm,js';
// var pageEntries = 'html,htm,phtml,tpl,vm';

describe('using-etpl', function(){
    // 需要测试的是如果combine的时候有package的代码需要合并，最后处理的是否正常.
    it('default', function(){
        var processor = new ModuleCompiler({
            exclude: [],
            configFile: 'module.conf',
            entryExtnames: moduleEntries,
            getCombineConfig: function() {
                return {
                    'using-etpl': {
                        include: [ 'etpl/**' ],
                        exclude: [ 'etpl/tpl' ]
                    }
                };
            }
        });

        var filePath = path.join(Project, 'src', 'using-etpl.js');
        var fileData = base.getFileInfo(filePath);

        var processContext = { baseDir: Project };
        processor.process(fileData, processContext, function(){
            var expected =
                '(function (root) {\n' +
                '    function Engine() {\n' +
                '    }\n' +
                '    ;\n' +
                '    var etpl = new Engine();\n' +
                '    etpl.Engine = Engine;\n' +
                '    if (typeof exports == \'object\' && typeof module == \'object\') {\n' +
                '        exports = module.exports = etpl;\n' +
                '    } else if (typeof define == \'function\' && define.amd) {\n' +
                '        define(\'etpl/main\', etpl);\n' +
                '    } else {\n' +
                '        root.etpl = etpl;\n' +
                '    }\n' +
                '}(this));\n' +
                '\n' +
                'define(\'etpl\', [\'etpl/main\'], function ( main ) { return main; });\n' +
                '\n' +
                'define(\'biz/tpl\', function (require) {\n' +
                '    return require(\'etpl\');\n' +
                '});\n' +
                '\n' +
                'define(\'using-etpl\', function (require) {\n' +
                '    var template = require(\'./biz/tpl\');\n' +
                '    var z = require(\'etpl/main\');\n' +
                '    console.log(template + z);\n' +
                '});';
            expect( fileData.data ).toBe( expected );
        });
    });
});





















/* vim: set ts=4 sw=4 sts=4 tw=100: */
