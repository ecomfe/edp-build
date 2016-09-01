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
 *
 * @file test/issue-94.spec.js
 * @author leeight
 */

var path = require('path');

var expect = require('expect.js');

var base = require('./base');
// var Module = require('../lib/module');
// var Reader = require('../lib/reader');
// var CompilerContext = require('../lib/compiler-context');
var ProcessContext = require('../lib/process-context');
var BabelProcessor = require('../lib/processor/babel-processor');
var TplMerge = require('../lib/processor/tpl-merge');

var Project = path.resolve(__dirname, 'data', 'dummy-project');

describe('issue-94', function () {
    var processContext;
    // var reader;
    // var configFile = path.join(Project, 'module.conf');

    beforeEach(function () {
        processContext = new ProcessContext({
            baseDir: Project,
            exclude: [],
            outputDir: 'output',
            fileEncodings: {}
        });

        // reader = new Reader(processContext, configFile);

        base.traverseDir(Project, processContext);
        base.traverseDir(path.join(Project, '..', 'base'), processContext);
    });

    it('default', function (done) {
        var p0 = new BabelProcessor({
            files: ['*.es6'],
            compileOptions: {
                loose: 'all',
                modules: 'amd',
                compact: false,
                ast: false,
                optional: ['runtime'],
                blacklist: ['strict']
            },
            afterAll: function (processContext) {
                this.processFiles.forEach(function (file) {
                    processContext.removeFile(file.path);
                    file.path = file.path.replace(/\.es6/, '.js');
                    file.fullPath = file.fullPath.replace(/\.es6/, '.js');
                    file.outputPath = file.outputPath.replace(/\.es6/, '.js');
                    file.outputPaths.forEach(function (p, i) {
                        file.outputPaths[i] = p.replace(/\.es6/, '.js');
                    });
                    processContext.addFile(file);
                });
            }
        });
        var p1 = new TplMerge({
            pluginIds: ['bat-ria/tpl'],
            outputPluginId: 'bat-ria/tpl',
            outputType: 'js',
            outputPath: 'src/startup/template.js',
            html2jsOptions: {
                mode: 'default'
            },
            files: ['src/**/*.js']
        });

        base.launchProcessors([p0, p1, p1], processContext, function () {
            var fi = processContext.getFileByPath('src/issue-94.js');
            expect(fi.data).to.eql("define([\n    'exports',\n    'bat-ria/tpl!startup/template',\n    'bat-ria/tpl!startup/template',\n    'er/View',\n    'babel-runtime/helpers/interop-require-default',\n    'no-such-plugin!./tpl/123.html'\n], function (exports, _batRiaTplTplListTplHtml, _batRiaTplTpl123Html, _erView, _babelRuntimeHelpersInteropRequireDefault, _noSuchPluginTpl123Html) {\n    var _View = _babelRuntimeHelpersInteropRequireDefault['default'](_erView);\n});");
            done();
        });
    });
});










/* vim: set ts=4 sw=4 sts=4 tw=120: */
