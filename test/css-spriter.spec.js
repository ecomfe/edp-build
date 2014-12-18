/***************************************************************************
 *
 * Copyright (c) 2014 Baidu.com, Inc. All Rights Reserved
 * $Id$
 *
 **************************************************************************/



/**
 * css-spriter.spec.js ~ 2014/12/17 22:40:05
 * @author quyatong(quyatong@126.com)
 * @version $Revision$
 * @description
 *
 **/
var fs = require('fs');
var path = require('path');
var CssSpriter = require('../lib/processor/css-spriter.js');
var PathMapper = require('../lib/processor/path-mapper.js');
var Project = path.resolve(__dirname, 'data', 'css-spriter');
var base = require('./base');
var ProcessContext = require('../lib/process-context');

describe('css-spriter', function() {
    it('default', function() {
        var processor = new CssSpriter({
            files: ['src/*.css']
        });

        var processContext = new ProcessContext({
            baseDir: Project,
            exclude: [],
            outputDir: 'output',
            fileEncodings: {}
        });

        base.traverseDir(Project, processContext);

        base.launchProcessors([processor], processContext, function() {
            var cssData = processContext.getFileByPath('src/default.css').data;
            var compareCssData = fs.readFileSync('data/css-spriter/default.compare.css', 'utf-8');
            
            var imgData = processContext.getFileByPath('src/sprite-default.png').data;
            var compareImgData = fs.readFileSync('data/css-spriter/sprite-default.png');

            // 去掉版本号比较
            expect(cssData.replace(/\?ver=\d*/g, '')).toBe(compareCssData);
            expect(imgData).toEqual(compareImgData);
        });
    });
});



















/* vim: set ts=4 sw=4 sts=4 tw=100: */
