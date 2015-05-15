/**
 * Copyright (c) 2014 Baidu.com, Inc. All Rights Reserved
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on
 * an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations under the License.
 */

var path = require('path');

var base = require('./base');
var Module = require('../lib/module');
var Reader = require('../lib/reader');
var CompilerContext = require('../lib/compiler-context');
var ProcessContext = require('../lib/process-context');

var Project = path.resolve(__dirname, 'data', 'dummy-project');

describe('module', function () {
    var processContext;
    var reader;
    var configFile = path.join(Project, 'module.conf');

    beforeEach(function () {
        processContext = new ProcessContext({
            baseDir: Project,
            exclude: [],
            outputDir: 'output',
            fileEncodings: {}
        });

        reader = new Reader(processContext, configFile);

        base.traverseDir(Project, processContext);
        base.traverseDir(path.join(Project, '..', 'base'), processContext);
    });

    it('匿名模块', function () {
        var moduleId = 'module/foo';

        var bundleConfigs = {};
        bundleConfigs[moduleId] = true;

        var compilerContext = new CompilerContext(processContext,
                configFile, reader, bundleConfigs);
        var module = new Module(moduleId, compilerContext);
        var expected =
            'define(\'module/foo\', [\'require\'], function (require) {\n' +
            '    return \'module/foo\';\n' +
            '});';
        expect(module.toBundle()).toBe(expected);
    });

    it('匿名模块和具名模块', function () {
        var moduleId = 'module/bar';

        var bundleConfigs = {};
        bundleConfigs[moduleId] = {
            // 这里的 !module/bar1 实际上是没有效果的，但是
            // module/foo应该起效果的
            files: ['module/foo', '!module/bar1', '~net']
        };

        var compilerContext = new CompilerContext(processContext,
                configFile, reader, bundleConfigs);
        var module = new Module(moduleId, compilerContext);
        var expected =
            'define(\'net/Http\', [\'require\'], function (require) {\n' +
            '    return \'net/Http\';\n' +
            '});\n' +
            '\n' +
            'define(\'module/foo\', [\'require\'], function (require) {\n' +
            '    return \'module/foo\';\n' +
            '});\n' +
            '\n' +
            'define(\'module/bar\', [\'require\'], function (require) {\n' +
            '    return \'module/bar\';\n' +
            '});\n' +
            'define(\'module/bar1\', [\'require\'], function (require) {\n' +
            '    return \'module/bar1\';\n' +
            '});';
        var actual = module.toBundle();

        expect(actual).toBe(expected);
    });

    it('issues/51', function () {
        // 指定包名的时候也应该可以合并才对的
        var moduleId = 'er';

        var bundleConfigs = {};
        bundleConfigs[moduleId] = 1;

        var compilerContext = new CompilerContext(processContext,
                configFile, reader, bundleConfigs);
        var module = new Module(moduleId, compilerContext);
        var expected =
            'define(\'net/Http\', [\'require\'], function (require) {\n' +
            '    return \'net/Http\';\n' +
            '});\n' +
            '\n' +
            'define(\'er/View\', [\n' +
            '    \'require\',\n' +
            '    \'net/Http\'\n' +
            '], function (require) {\n' +
            '    return require(\'net/Http\') + \';\' + \'er/View\';\n' +
            '});\n' +
            '\n' +
            'define(\'er/main\', [\n' +
            '    \'require\',\n' +
            '    \'./View\'\n' +
            '], function (require) {\n' +
            '    var view = require(\'./View\');\n' +
            '    return \'er\';\n' +
            '});\n' +
            '\n' +
            'define(\'er\', [\'er/main\'], function (main) { return main; });';
        var actual = module.toBundle();
        expect(actual).toBe(expected);
    });

    it('etpl/tpl', function () {
        var moduleId = 'etpl/tpl';

        var bundleConfigs = {};
        bundleConfigs[moduleId] = 1;

        var compilerContext = new CompilerContext(processContext,
                configFile, reader, bundleConfigs);
        var module = new Module(moduleId, compilerContext);

        var fs = require('fs');
        var actual = module.toBundle();
        var expected = fs.readFileSync(path.join(__dirname, 'data/expected/module-etpl-tpl.expected.txt'), 'utf-8');
        expect(actual).toBe(expected);
    });
});









/* vim: set ts=4 sw=4 sts=4 tw=120: */
