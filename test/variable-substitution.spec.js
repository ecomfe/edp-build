/***************************************************************************
 *$
 * Copyright (c) 2014 Baidu.com, Inc. All Rights Reserved
 * $Id$$
 *
 **************************************************************************/



/**
 * variable-substitution.spec.js ~ 2014/05/26 16:48:26
 * @author leeight(liyubei@baidu.com)
 * @version $Revision$
 * @description
 *
 **/
var path = require('path');
var expect = require('expect.js');

var base = require('./base');
var VariableSubstitution = require('../lib/processor/variable-substitution.js');
var ProcessContext = require('../lib/process-context');
var Project = path.resolve(__dirname, 'data', 'dummy-project');

describe('variable-substitution', function () {
    it('default', function (done) {
        var processor = new VariableSubstitution({
            variables: {
                version: '1.0.1'
            }
        });

        var processContext = new ProcessContext({
            baseDir: Project,
            exclude: [],
            outputDir: 'output',
            fileEncodings: {}
        });
        base.traverseDir(Project, processContext);

        base.launchProcessors([processor], processContext, function () {
            var fileData = processContext.getFileByPath('issue-259.html');
            var expected = '<link rel="stylesheet" href="main.css?1.0.1">\n<link rel="stylesheet" href="main.css?1.0.1">';
            expect(fileData.data.trim()).to.eql(expected);
            done();
        });
    });
});



















/* vim: set ts=4 sw=4 sts=4 tw=100: */
