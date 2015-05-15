/**
 * @file css-spriter.spec.js ~ 2014/12/17 22:40:05
 * @author quyatong(quyatong@126.com)
 */
var fs = require('fs');
var path = require('path');

var base = require('./base');
var ProcessContext = require('../lib/process-context');
var CssSpriter = require('../lib/processor/css-spriter.js');
var CssCompressor = require('../lib/processor/css-compressor.js');

var Project = path.resolve(__dirname, 'data', 'css-spriter');

describe('css-spriter', function () {
    it('default', function (done) {
        var processor = new CssSpriter({
            files: ['src/*.css']
        });
        var p2 = new CssCompressor();

        var processContext = new ProcessContext({
            baseDir: Project,
            exclude: [],
            outputDir: 'output',
            fileEncodings: {}
        });

        base.traverseDir(Project, processContext);

        base.launchProcessors([processor, p2], processContext, function () {
            var cssData = processContext.getFileByPath('src/default.css');
            expect(cssData).not.toBeNull();

            var imgData = processContext.getFileByPath('src/sprite-default.png').data;
            var compareImgData = fs.readFileSync(path.join(__dirname, 'data/css-spriter/sprite-default.png'));

            // 去掉版本号比较
            var expected =
                'div{color:red;background:url(sprite-default.png#300*200)}\n' +
                'a{text-decoration:none;background:url(./b.png#nocombine)no-repeat}\n' +
                'span{background:url(sprite-default.png#271*134)-300px 0 no-repeat}';
            expect(cssData.data.replace(/\?ver=\d*/g, '')).toBe(expected);
            expect(imgData).toEqual(compareImgData);

            done();
        });
    });
});



















/* vim: set ts=4 sw=4 sts=4 tw=100: */
