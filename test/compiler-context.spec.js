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

var CompilerContext = require('../lib/compiler-context');
var ProcessContext = require('../lib/process-context');
var Reader = require('../lib/reader');
var base = require('./base');
var Project = path.resolve(__dirname, 'data', 'dummy-project-2');

describe('compiler-context', function () {
    var processContext;
    var configFile;
    var reader;

    beforeEach(function () {
        processContext = new ProcessContext({
            baseDir: Project,
            exclude: [],
            outputDir: 'output',
            fileEncodings: {}
        });
        base.traverseDir(Project, processContext);

        configFile = path.resolve(processContext.baseDir, 'module.conf');
        reader = new Reader(processContext, configFile);
    });

    it('getModuleDefinition', function () {
        var Project = path.resolve(__dirname, 'data', 'dummy-project');
        var processContext = new ProcessContext({
            baseDir: Project,
            exclude: [],
            outputDir: 'output',
            fileEncodings: {}
        });
        base.traverseDir(Project, processContext);

        var configFile = path.resolve(processContext.baseDir, 'module.conf');
        var reader = new Reader(processContext, configFile);

        var moduleCombineConfigs = {};
        var moduleMapConfigs = {};
        var context = new CompilerContext(processContext,
            configFile, reader, moduleCombineConfigs, moduleMapConfigs);

        var d1 = context.getModuleDefinition('er');
        expect(d1.ast).not.toBeUndefined();
        expect(d1.ast.type).toEqual('Program');
        expect(d1.modDefs[0]).not.toBeUndefined();
        expect(d1.modDefs[0].id).toEqual('er/main');
        expect(d1.modDefs[0].dependencies).toBeUndefined();
        expect(d1.pkgDef).not.toBeUndefined();
        expect(d1.pkgDef.name).toEqual('er');
        expect(d1.pkgDef.main).toEqual('main');
        expect(d1.pkgDef.module).toEqual('er/main');

        var d2 = context.getModuleDefinition('er/main');
        expect(d2.ast).not.toBeUndefined();
        expect(d2.ast.type).toEqual('Program');
        expect(d2.modDefs[0]).not.toBeUndefined();
        expect(d2.modDefs[0].id).toEqual('er/main');
        expect(d2.modDefs[0].dependencies).toBeUndefined();
        expect(d2.pkgDef).toBeNull();
    });

    it('getXXX', function () {
        var moduleCombineConfigs = {};
        var moduleMapConfigs = {
            "lang": {
                "foo": "foo2",
                "foo/bar": "bar3",
                "bar": "bar2"
            },
            "*": {
                "foo": "foo4",
                "foo/bar": "bar5",
                "bar": "bar5"
            }
        };
        var context = new CompilerContext(processContext,
            configFile, reader, moduleCombineConfigs, moduleMapConfigs);
        expect(context.getXXX('lang', 'foo')).toEqual('foo2');
        expect(context.getXXX('lang', 'foo/bar')).toEqual('bar3');
        expect(context.getXXX('lang', 'bar')).toEqual('bar2');
        expect(context.getXXX('x', 'foo')).toEqual('foo4');
        expect(context.getXXX('y', 'foo/bar')).toEqual('bar5');
        expect(context.getXXX('z', 'bar')).toEqual('bar5');
        expect(context.getXXX('lang', 'barN')).toEqual('barN');
    });
});










/* vim: set ts=4 sw=4 sts=4 tw=120: */
