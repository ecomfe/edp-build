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
 * @file test/issues-319.spec.js
 * @author leeight
 */

// https://github.com/ecomfe/edp/issues/319
var path = require('path');

var expect = require('expect.js');

var base = require('./base');
var ModuleCompiler = require('../lib/processor/module-compiler.js');
var TplMerge = require('../lib/processor/tpl-merge.js');
var ProcessContext = require('../lib/process-context.js');

var Project = path.resolve(__dirname, 'data', 'dummy-project');

/**
 * TplMerge 和 ModuleCompiler 混合在一起使用的时候
 */
describe('issue-319', function () {
    var processContext;

    beforeEach(function () {
        processContext = new ProcessContext({
            baseDir: Project,
            exclude: [],
            outputDir: 'output',
            fileEncodings: {}
        });

        base.traverseDir(Project, processContext);
        base.traverseDir(path.join(Project, '..', 'base'), processContext);
    });

    it('default', function (done) {
        var p1 = new TplMerge({
            files: [
                'src/319.js'
            ],
            pluginIds: ['etpl/tpl'],
            outputType: 'js',
            outputPluginId: 'etpl/tpl',
            outputPath: 'src/startup/template.js'
        });
        var p2 = new ModuleCompiler({
            getCombineConfig: function () {
                return {
                    319: {
                        modules: ['startup/template']
                    }
                };
            }
        });

        base.launchProcessors([p1, p2], processContext, function () {
            var fs = require('fs');
            var actual = processContext.getFileByPath('src/319.js').data;
            var expected = fs.readFileSync(path.join(__dirname, 'data/expected/issues-319.expected.txt'), 'utf-8');
            expect(actual).to.be(expected);
            done();
        });
    });
});








/* vim: set ts=4 sw=4 sts=4 tw=120: */
