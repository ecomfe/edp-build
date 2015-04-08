/**
 * @file compile-module-2.spec.js ~ 2014/03/20 16:56:49
 * @author leeight(liyubei@baidu.com)
 */
var edp = require('edp-core');
var fs = require('fs');
var path = require('path');

var base = require('./base');
var Project = path.resolve(__dirname, 'data', 'dummy-project');
var ProcessContext = require('../lib/process-context');
var Module = require('../lib/module');
var Reader = require('../lib/reader');
var CompilerContext = require('../lib/compiler-context');

describe('compile-module-2', function () {
    var processContext;
    var entryCode;
    var entryId;
    var configFile;
    var reader;

    beforeEach(function () {
        processContext = new ProcessContext({
            baseDir: Project,
            exclude: [],
            outputDir: 'output',
            fileEncodings: {}
        });
        entryCode = fs.readFileSync(path.resolve(Project, 'src', 'common', 'dummy.js'), 'utf-8');
        entryId = 'common/dummy';
        configFile = path.resolve(Project, 'module.conf');
        reader = new Reader(processContext, configFile);

        base.traverseDir(Project, processContext);
        base.traverseDir(path.join(Project, '..', 'base'), processContext);
    });

    function compileModule (code, moduleId, moduleConfig, combine, excludeModules) {
        var bundleConfigs = {};
        bundleConfigs[moduleId] = combine;

        var compilerContext = new CompilerContext(processContext,
                moduleConfig, reader, bundleConfigs);
        var module = new Module(moduleId, compilerContext);
        return module.toBundle();
    }


    it('default', function () {
        // include和exclude都使用pattern
        var moduleCode = compileModule(
            entryCode, entryId,
            configFile,
            {
                exclude: [],
                include: [[[['er', 'er/main']]]]
            },
            null,
            processContext
        );

        var ast = edp.amd.getAst(moduleCode);
        var moduleInfo = edp.amd.analyseModule(ast);
        var moduleIds = moduleInfo.map(function (info) {
            return info.id || '<anonymous>';
        });
        moduleIds.sort();
        expect(moduleIds).toEqual(['common/dummy', 'er', 'er/View', 'er/main', 'net/Http']);
    });

    it('default 2', function () {
         // include和exclude都使用pattern
        var moduleCode = compileModule(
            entryCode, entryId,
            configFile,
            {
                exclude: ['*'],
                include: [[[['er', 'er/*']]]]
            },
            null,
            processContext
        );

        var ast = edp.amd.getAst(moduleCode);
        var moduleInfo = edp.amd.analyseModule(ast);

        if (moduleInfo && !Array.isArray(moduleInfo)) {
            moduleInfo = [moduleInfo];
        }

        if (moduleInfo) {
            var moduleIds = moduleInfo.map(function (info) {
                return info.id || '<anonymous>';
            });
            moduleIds.sort();
            expect(moduleIds).toEqual(['common/dummy']);
        }
        else {
            expect(moduleCode).toEqual('define(\'common/dummy\', {});');
        }
    });

    it('default 3', function () {
         // include和exclude都使用pattern
        var moduleCode = compileModule(
            entryCode, entryId,
            configFile,
            {
                files: ['er', '!*', 'er', 'er/*']
            },
            null,
            processContext
       );

        var ast = edp.amd.getAst(moduleCode);
        var moduleInfo = edp.amd.analyseModule(ast);

        if (moduleInfo && !Array.isArray(moduleInfo)) {
            moduleInfo = [moduleInfo];
        }

        if (moduleInfo) {
            var moduleIds = moduleInfo.map(function (info) {
                return info.id || '<anonymous>';
            });
            moduleIds.sort();
            expect(moduleIds).toEqual(['common/dummy', 'er', 'er/View', 'er/main']);
        }
        else {
            expect(moduleCode).toEqual('define(\'common/dummy\', {});');
        }
    });

    it('default 4', function () {
         // include和exclude都使用pattern
        var moduleCode = compileModule(
            entryCode, entryId,
            configFile,
            {
                files: ['!*', 'er/*', 'er']
            },
            null,
            processContext
       );

        var ast = edp.amd.getAst(moduleCode);
        var moduleInfo = edp.amd.analyseModule(ast);

        if (moduleInfo && !Array.isArray(moduleInfo)) {
            moduleInfo = [moduleInfo];
        }

        if (moduleInfo) {
            var moduleIds = moduleInfo.map(function (info) {
                return info.id || '<anonymous>';
            });
            moduleIds.sort();
            expect(moduleIds).toEqual(['common/dummy', 'er', 'er/View', 'er/main']);
        }
        else {
            expect(moduleCode).toEqual('define(\'common/dummy\', {});');
        }
    });

    it('default 5', function () {
        var moduleCode = compileModule(
            entryCode, entryId,
            configFile,
            {
                files: ['~er', '!~er', '~net']
            },
            null,
            processContext
        );

        var ast = edp.amd.getAst(moduleCode);
        var moduleInfo = edp.amd.analyseModule(ast);
        if (!Array.isArray(moduleInfo)) {
            moduleInfo = [moduleInfo];
        }
        var moduleIds = moduleInfo.map(function (info) {
            return info.id || '<anonymous>';
        });
        moduleIds.sort();

        // 忽略了所有er的模块之后，就不存在net了，但是我们手工指定了
        expect(moduleIds).toEqual(['common/dummy', 'net/Http']);
    });
});




















/* vim: set ts=4 sw=4 sts=4 tw=100: */
