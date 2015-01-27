/**
 * @file generate-module-code spec
 * @author treelite(c.xinel@gmail.com)
 */

var fs = require('fs');
var path = require('path');
var edp = require( 'edp-core' );
var generateModuleCode = require('../lib/util/generate-module-code');
var baseDir = path.resolve(__dirname, 'data', 'generate-module-code');

function getFile(name) {
    return fs.readFileSync(path.resolve(baseDir, name), 'utf-8');
}

function normalCode(str) {
    return str.replace(/\n/g, '').replace(/\s+/g, '');
}

var standardFile = getFile('std.js');
var factoryAst = edp.amd.getAst( standardFile );
factoryAst = factoryAst.body[0].expression['arguments'][0];


describe('generate-module-code', function () {

    it('single module without arguments should pass', function () {
        var moduleInfo = {
                factoryAst: factoryAst
            };

        var code = generateModuleCode(moduleInfo);

        expect(normalCode(code)).toBe(normalCode(getFile('std.js')));
    });

    it('single module has id should pass', function () {
        var moduleInfo = {
                id: 'single',
                factoryAst: factoryAst
            };

        var code = generateModuleCode(moduleInfo);

        expect(normalCode(code)).toBe(normalCode(getFile('hasId.js')));
    });

    it('single module has dependencies should pass', function () {
        var moduleInfo = {
                dependencies: ['foo', 'bar'],
                actualDependencies: ['foo', 'bar'],
                factoryAst: factoryAst
            };

        var code = generateModuleCode(moduleInfo);

        expect(normalCode(code)).toBe(normalCode(getFile('hasDeps.js')));
    });

    it('single module has all arguments should pass', function () {
        var moduleInfo = {
                id: 'single',
                dependencies: ['foo', 'bar'],
                actualDependencies: ['foo', 'bar'],
                factoryAst: factoryAst
            };

        var code = generateModuleCode(moduleInfo);

        expect(normalCode(code)).toBe(normalCode(getFile('singleModule.js')));
    });

    it('multi module should pass', function () {
        var moduleInfo = [
                {
                    id: 'module1',
                    dependencies: ['foo', 'bar'],
                    actualDependencies: ['foo', 'bar'],
                    factoryAst: factoryAst
                },
                {
                    id: 'module2',
                    factoryAst: factoryAst
                }
            ];

        var code = generateModuleCode(moduleInfo);
        expect(normalCode(code)).toBe(normalCode(getFile('multiModule.js')));
    });

    it('wrapper should pass', function () {
        var moduleInfo = [
                {
                    id: 'walker',
                    factoryAst: { type: 'Identifier', name: 'Walker' }
                },
                {
                    id: 'module',
                    dependencies: ['foo', 'bar'],
                    actualDependencies: ['foo', 'bar'],
                    factoryAst: factoryAst
                }
            ];

        var wrapperFile = getFile('wrapper.js');
        var ast = edp.amd.getAst( wrapperFile );

        var code = generateModuleCode(moduleInfo, ast);
        expect(normalCode(code)).toBe(normalCode(getFile('wrapper-compiled.js')));
    });
});
