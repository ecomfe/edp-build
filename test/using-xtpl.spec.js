/**
 * @author leeight(liyubei@baidu.com)
 */

// var fs = require('fs');
var path = require('path');

var base = require('./base');
var ModuleCompiler = require('../lib/processor/module-compiler.js');

var Project = path.resolve(__dirname, 'data', 'dummy-project');
// var ConfigFile = path.resolve(Project, 'module.conf');

var moduleEntries = 'html,htm,phtml,tpl,vm,js';
// var pageEntries = 'html,htm,phtml,tpl,vm';

describe('using-xtpl', function(){
    it('default', function(){
        var processor = new ModuleCompiler({
            exclude: [],
            configFile: 'module.conf',
            entryExtnames: moduleEntries,
            getCombineConfig: function() {
                return {
                    'common/using-xtpl': true
                };
            }
        });

        var filePath = path.join(Project, 'src', 'common', 'using-xtpl.js');
        var fileData = base.getFileInfo(filePath);

        var processContext = { baseDir: Project };
        processor.process(fileData, processContext, function(){
            var expected =
                'define(\'common/xtpl\', [\'require\'], function (require) {\n' +
                '    return \'xtpl\';\n' +
                '});\n' +
                '\n' +
                '\n' +
                '/** d e f i n e */\n' +
                'define(\'xtpl\', [\'common/xtpl\'], function (target) { return target; });\n' +
                '\n' +
                '\n' +
                '/** d e f i n e */\n' +
                'define(\'xtpl2\', [\'common/xtpl\'], function (target) { return target; });\n' +
                '\n' +
                '\n' +
                '/** d e f i n e */\n' +
                'define(\'xtpl3\', [\'common/xtpl\'], function (target) { return target; });\n' +
                '\n' +
                'define(\'common/using-xtpl\', [\n' +
                '    \'require\',\n' +
                '    \'./xtpl\',\n' +
                '    \'xtpl\',\n' +
                '    \'common/xtpl\'\n' +
                '], function (require) {\n' +
                '    var a = require(\'./xtpl\');\n' +
                '    var b = require(\'xtpl\');\n' +
                '    var c = require(\'common/xtpl\');\n' +
                '    return a + b + c;\n' +
                '});';
            expect( fileData.data ).toBe( expected );
        });
    });
});




















/* vim: set ts=4 sw=4 sts=4 tw=100: */
