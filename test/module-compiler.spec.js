/**
 * @author leeight(liyubei@baidu.com)
 * @file 测试一下ModuleCompiler的功能是否正常
 */

var edp = require( 'edp-core' );

var path = require('path');

var base = require('./base');
var ModuleCompiler = require('../lib/processor/module-compiler.js');

var Project = path.resolve(__dirname, 'data', 'dummy-project');
// var ConfigFile = path.resolve(Project, 'module.conf');

var moduleEntries = 'html,htm,phtml,tpl,vm,js';
// var pageEntries = 'html,htm,phtml,tpl,vm';


describe('module-compiler', function(){
    it('default', function(){
        var processor = new ModuleCompiler({
            exclude: [],
            configFile: 'module.conf',
            entryExtnames: moduleEntries
        });
        var filePath = path.join(Project, 'src', 'foo.js');
        var fileData = base.getFileInfo(filePath);

        var processContext = { baseDir: Project };
        processor.process(fileData, processContext, function(){
            var expected = 'define(\'foo\', [\n' +
                '    \'require\',\n' +
                '    \'io/File\',\n' +
                '    \'net/Http\',\n' +
                '    \'er/View\'\n' +
                '], function (require) {\n' +
                '    var ioFile = require(\'io/File\');\n' +
                '    var netHttp = require(\'net/Http\');\n' +
                '    var erView = require(\'er/View\');\n' +
                '    return \'foo\';\n' +
                '});';
            expect(fileData.data).toBe(expected);
        });
    });

    it('getCombineConfig', function(){
        var processor = new ModuleCompiler({
            exclude: [],
            configFile: 'module.conf',
            entryExtnames: moduleEntries,
            getCombineConfig: function(combineModules) {
                combineModules.foo = 1;
                return combineModules;
            }
        });
        var filePath = path.join(Project, 'src', 'foo.js');
        var fileData = base.getFileInfo(filePath);

        var processContext = { baseDir: Project };
        processor.process(fileData, processContext, function(){
            var ast = edp.amd.getAst( fileData.data );
            var moduleInfo = edp.amd.analyseModule(ast);
            expect(moduleInfo).not.toBe(null);
            expect(moduleInfo.length).toBe(4);
            expect(moduleInfo[0].id).toBe('io/File');
            expect(moduleInfo[1].id).toBe('net/Http');
            expect(moduleInfo[2].id).toBe('er/View');
            expect(moduleInfo[3].id).toBe('foo');
        });
    });

    it('case-xtpl', function(){
        var processor = new ModuleCompiler({
            exclude: [],
            configFile: 'module.conf',
            entryExtnames: moduleEntries,
            getCombineConfig: function() {
                return {
                    'case-xtpl': true
                };
            }
        });

        var filePath = path.join(Project, 'src', 'case-xtpl.js');
        var fileData = base.getFileInfo(filePath);

        var processContext = { baseDir: Project };
        processor.process(fileData, processContext, function(){
            var expected =
                'define(\'xtpl\', [\'require\'], function (require) {\n' +
                '    return \'xtpl\';\n' +
                '});\n' +
                '\n\n' +
                '/** d e f i n e */\n' +
                'define(\'xtpl2\', [\'xtpl\'], function (target) { return target; });\n' +
                '\n' +
                '\n' +
                '/** d e f i n e */\n' +
                'define(\'xtpl3\', [\'xtpl\'], function (target) { return target; });\n' +
                '\n' +
                '\n' +
                '/** d e f i n e */\n' +
                'define(\'common/xtpl\', [\'xtpl\'], function (target) { return target; });\n' +
                '\n' +
                'define(\'case-xtpl\', [\n' +
                '    \'require\',\n' +
                '    \'xtpl\',\n' +
                '    \'common/xtpl\'\n' +
                '], function (require) {\n' +
                '    var xtpl = require(\'xtpl\');\n' +
                '    var ztpl = require(\'common/xtpl\');\n' +
                '    console.log(xtpl);\n' +
                '    console.log(ztpl);\n' +
                '});';
            expect( fileData.data ).toBe( expected );

            // return;
            // var ast = edp.amd.getAst( fileData.data );
            // var moduleInfo = edp.amd.analyseModule(ast);
            // expect(moduleInfo).not.toBe(null);
            // expect(moduleInfo.length).toBe(4);
            // expect(moduleInfo[0].id).toBe('io/File');
            // expect(moduleInfo[1].id).toBe('net/Http');
            // expect(moduleInfo[2].id).toBe('er/View');
            // expect(moduleInfo[3].id).toBe('foo');
        });
    });

    it('bizId support', function(){
        var processor = new ModuleCompiler({
            exclude: [],
            bizId: 'foo/bar',
            configFile: 'module.conf',
            entryExtnames: moduleEntries,
            getCombineConfig: function() {
                return {
                    'case-xtpl': true
                };
            }
        });

        var filePath = path.join(Project, 'src', 'case-xtpl.js');
        var fileData = base.getFileInfo(filePath);

        var processContext = { baseDir: Project };
        processor.process(fileData, processContext, function(){
            var expected =
                'define(\'foo/bar/xtpl\', [\'require\'], function (require) {\n' +
                '    return \'xtpl\';\n' +
                '});\n' +
                'define(\'foo/bar/xtpl2\', [\'xtpl\'], function (target) {\n' +
                '    return target;\n' +
                '});\n' +
                'define(\'foo/bar/xtpl3\', [\'xtpl\'], function (target) {\n' +
                '    return target;\n' +
                '});\n' +
                'define(\'foo/bar/common/xtpl\', [\'xtpl\'], function (target) {\n' +
                '    return target;\n' +
                '});\n' +
                'define(\'foo/bar/case-xtpl\', [\n' +
                '    \'require\',\n' +
                '    \'xtpl\',\n' +
                '    \'common/xtpl\'\n' +
                '], function (require) {\n' +
                '    var xtpl = require(\'xtpl\');\n' +
                '    var ztpl = require(\'common/xtpl\');\n' +
                '    console.log(xtpl);\n' +
                '    console.log(ztpl);\n' +
                '});';
            expect( fileData.data ).toBe( expected );
        });
    });

});



















/* vim: set ts=4 sw=4 sts=4 tw=100: */
