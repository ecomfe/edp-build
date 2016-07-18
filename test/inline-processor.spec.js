/***************************************************************************
 *
 * Copyright (c) 2015 Baidu.com, Inc. All Rights Reserved
 * $Id$
 *
 **************************************************************************/



/**
 * inline-procesor.spec.js ~ 2015/10/08 09:25:52
 * @author wuhuiyao(sparklewhy@gmail.com)
 * @version $Revision$
 * @description
 *
 **/
var fs = require('fs');
var path = require('path');
var ProcessContext = require('../lib/process-context');
var InlineProcessor = require('../lib/processor/inline-processor.js');
var LessCompiler = require('../lib/processor/less-compiler.js');
var base = require('./base');

var Project = path.resolve(__dirname, 'data', 'inline-processor');

describe('inline-processor', function() {
    it('default', function(done) {
        var processContext = new ProcessContext({
            baseDir: Project,
            exclude: ['output'],
            outputDir: 'output',
            fileEncodings: {}
        });

        base.traverseDir(Project, processContext);

        var lessCompiler = new LessCompiler();
        var inlineProcessor = new InlineProcessor({
            files: ['templates/index.tpl'],
            inlineOption: {
                inlinePathGetter: function (path) {
                    var regexp = /\{\$host\}\//;
                    if (regexp.test(path)) {
                        var newPath = path.replace(regexp, '');
                        return {path: newPath, dir: '.'};
                    }
                    return path;
                }
            }
        });

        base.launchProcessors([lessCompiler, inlineProcessor], processContext, function () {
            var tplData = processContext.getFileByPath('templates/index.tpl');
            expect(tplData).not.toBeNull();

            var expectedData = fs.readFileSync(path.join(__dirname, 'data/inline-processor', 'output/templates/index.default.tpl')).toString();
            expect(tplData.data).toEqual(expectedData);

            done();
        });
    });

    it('custom tasks', function(done) {
        var processContext = new ProcessContext({
            baseDir: Project,
            exclude: ['output'],
            outputDir: 'output',
            fileEncodings: {}
        });

        base.traverseDir(Project, processContext);

        var lessCompiler = new LessCompiler();

        var escapeTask = function (file) {
            return file.data.replace(/\{|\}/g, function (match) {
                return {'{': '{ldelim}', '}': '{rdelim}'}[match];
            });
        };
        var inlineProcessor = new InlineProcessor({
            files: ['templates/index.tpl'],
            customTask: {
                js: escapeTask,
                css: escapeTask
            },
            inlineOption: {
                inlinePathGetter: function (path) {
                    var regexp = /\{\$host\}\//;
                    if (regexp.test(path)) {
                        var newPath = path.replace(regexp, '');
                        return {path: newPath, dir: '.'};
                    }
                    return path;
                }
            }
        });

        base.launchProcessors([lessCompiler, inlineProcessor], processContext, function () {
            var tplData = processContext.getFileByPath('templates/index.tpl');
            expect(tplData).not.toBeNull();

            var expectedData = fs.readFileSync(path.join(__dirname, 'data/inline-processor', 'output/templates/index.custom.tpl')).toString();
            expect(tplData.data).toEqual(expectedData);

            done();
        });
    });
});
