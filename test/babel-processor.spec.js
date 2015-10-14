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
var BabelProcessor = require('../lib/processor/babel-processor');
var JsCompressor = require('../lib/processor/js-compressor');

var Project = path.resolve(__dirname, 'data', 'dummy-project');

describe('babel-processor', function () {
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
            }
        });
        var p1 = new JsCompressor({
            files: ['*.es6']
        });

        base.launchProcessors([p0, p1], processContext, function () {
            var fi = processContext.getFileByPath('src/hello.es6');
            expect(fi.data).toEqual('define(["exports","babel-runtime/helpers/inherits","babel-runtime/helpers/class-call-check"],function(exports,e,t){(function(n){function l(){t["default"](this,l),n.apply(this,arguments)}return e["default"](l,n),l.prototype.toString=function(){console.log("HelloWorld")},l})(Array)});');
            done();
        });
    });
});










/* vim: set ts=4 sw=4 sts=4 tw=120: */
