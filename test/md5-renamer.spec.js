/**
 * @file md5-renamer.spec.js ~ 2014/04/30 13:35:06
 * @author leeight(liyubei@baidu.com)
 */

// var edp = require('edp-core');
var path = require('path');

var expect = require('expect.js');

var base = require('./base');
var Project = path.resolve(__dirname, 'data', 'dummy-project');
var MD5Renamer = require('../lib/processor/md5-renamer');
var CssCompressor = require('../lib/processor/css-compressor.js');
var ProcessContext = require('../lib/process-context');

describe('md5-renamer', function () {
    it('default', function (done) {
        var p1 = new MD5Renamer({
            files: [
                'index.html'
            ]
        });
        var processContext = new ProcessContext({
            baseDir: Project,
            exclude: [],
            outputDir: 'output',
            fileEncodings: {}
        });
        var f1 = base.getFileInfo('index.html', Project);
        processContext.addFile(f1);

        var processors = [
            p1
        ];

        base.launchProcessors(processors, processContext, function () {
            var f = processContext.getFileByPath('index.html');
            expect(f).not.to.be(undefined);
            done();
        });
    });

    it('custom outputname', function (done) {
        var p1 = new MD5Renamer({
            files: [
                'index.html'
            ],
            outputTemplate: '{basename}-{md5sum}{extname}',
            start: 1,
            end: 12
        });
        var processContext = new ProcessContext({
            baseDir: Project,
            exclude: [],
            outputDir: 'output',
            fileEncodings: {}
        });
        var f1 = base.getFileInfo('index.html', Project);
        processContext.addFile(f1);

        var processors = [
            p1
        ];

        base.launchProcessors(processors, processContext, function () {
            var f = processContext.getFileByPath('index.html');
            expect(f).not.to.be(undefined);
            done();
        });
    });

    it('issue-235', function (done) {
        // replacements不生效的问题
        var p1 = new MD5Renamer({
            files: [
                'issue-235.html',
                'issue-261.html',
                'src/**/*.css'
            ],
            outputTemplate: '{basename}-{md5sum}{extname}',
            start: 1,
            end: 12,
            resolve: function (lookup, resource) {
                if (resource.indexOf('{%$tplData.feRoot%}') === 0) {
                    return resource.replace('{%$tplData.feRoot%}/', '');
                }
            }
        });
        var processContext = new ProcessContext({
            baseDir: Project,
            exclude: [],
            outputDir: 'output',
            fileEncodings: {}
        });
        base.traverseDir(Project, processContext);

        var processors = [
            p1
        ];

        base.launchProcessors(processors, processContext, function () {
            var f1 = processContext.getFileByPath('src/common/logo.gif');
            var f2 = processContext.getFileByPath('src/common/main.css');
            var f3 = processContext.getFileByPath('src/common/main.js');
            var k1 = processContext.getFileByPath('src/biz/foo.css');
            expect(f1.outputPaths).to.eql((['src/common/logo-ba001c53c2b.gif']));
            expect(f2.outputPaths).to.eql((['src/common/main-5de4eeb0d4f.css']));
            expect(f3.outputPaths).to.eql((['src/common/main-d299e81d71c.js']));
            expect(k1.outputPaths).to.eql((['src/biz/foo-7506118fea0.css']));

            var f4 = processContext.getFileByPath('issue-235.html');
            expect(f4.data.indexOf('src/common/main-d299e81d71c.js?foo=bar#hello=world')).not.to.be(-1);
            expect(f4.data.indexOf('src/common/main-5de4eeb0d4f.css')).not.to.be(-1);
            expect(f4.data.indexOf('src/common/logo-ba001c53c2b.gif')).not.to.be(-1);
            expect(f4.data.indexOf('<script src="http://www.baidu.com/a.js?x=1"></script>')).not.to.be(-1);
            expect(f4.data.indexOf('<script src="//www.baidu.com/foo/bar.js?y=2"></script>')).not.to.be(-1);
            expect(f4.data.indexOf('<script src="https://www.google.com/ssl.js#a=b"></script>')).not.to.be(-1);
            expect(f4.data.indexOf('<embed src=\'src/common/logo-ba001c53c2b.gif\' widht=100 height=200 />')).not.to.be(-1);
            expect(f4.data.indexOf('<param value=\'src/common/logo-ba001c53c2b.gif\' name="movie" />')).not.to.be(-1);
            expect(f4.data.indexOf('<param value="src/common/logo.gif" />')).not.to.be(-1);


            var f5 = processContext.getFileByPath('src/common/main.css');
            expect(f5.data.indexOf('logo-ba001c53c2b.gif')).not.to.be(-1);
            var f6 = processContext.getFileByPath('src/biz/foo.css');
            expect(f6.data.indexOf('../common/logo-ba001c53c2b.gif')).not.to.be(-1);
            expect(f6.data.indexOf('background: url(../common/logo-ba001c53c2b.gif)  ;')).not.to.be(-1);
            expect(f6.data.indexOf('background: url("../common/logo-ba001c53c2b.gif");')).not.to.be(-1);

            var f7 = processContext.getFileByPath('issue-261.html');
            expect(f7.data.indexOf('{%$tplData.feRoot%}/src/common/main-d299e81d71c.js?foo=bar#hello=world')).not.to.be(-1);
            expect(f7.data.indexOf('{%$tplData.feRoot%}/src/common/main-5de4eeb0d4f.css')).not.to.be(-1);
            expect(f7.data.indexOf('{%$tplData.feRoot%}/src/common/logo-ba001c53c2b.gif')).not.to.be(-1);
            expect(f7.data.indexOf('<script src="http://www.baidu.com/a.js?x=1"></script>')).not.to.be(-1);
            expect(f7.data.indexOf('<script src="//www.baidu.com/foo/bar.js?y=2"></script>')).not.to.be(-1);
            expect(f7.data.indexOf('<script src="https://www.google.com/ssl.js#a=b"></script>')).not.to.be(-1);
            expect(f7.data.indexOf('<embed src=\'{%$tplData.feRoot%}/src/common/logo-ba001c53c2b.gif\' widht=100 height=200 />')).not.to.be(-1);
            expect(f7.data.indexOf('<param value=\'{%$tplData.feRoot%}/src/common/logo-ba001c53c2b.gif\' name="movie" />')).not.to.be(-1);
            expect(f7.data.indexOf('<param value="{%$tplData.feRoot%}/src/common/logo.gif" />')).not.to.be(-1);

            done();
        });
    });

    it('issue-235-1 & issue-261', function (done) {
        // replacements不生效的问题
        var p1 = new MD5Renamer({
            outputTemplate: '{basename}-{md5sum}{extname}',
            start: 1,
            end: 12,
            replacements: {
                html: {
                    tags: [
                        {tag: 'img', attribute: 'src'}
                    ],
                    files: ['issue-235.html']
                }
            }
        });
        var processContext = new ProcessContext({
            baseDir: Project,
            exclude: [],
            outputDir: 'output',
            fileEncodings: {}
        });
        base.traverseDir(Project, processContext);

        var processors = [
            p1
        ];

        base.launchProcessors(processors, processContext, function () {
            var f1 = processContext.getFileByPath('src/common/logo.gif');
            var f2 = processContext.getFileByPath('src/common/main.css');
            var f3 = processContext.getFileByPath('src/common/main.js');
            var k1 = processContext.getFileByPath('src/biz/foo.css');
            expect(f1.outputPaths).to.eql((['src/common/logo-ba001c53c2b.gif']));
            expect(f2.outputPaths).to.eql(([]));
            expect(f3.outputPaths).to.eql(([]));
            expect(k1.outputPaths).to.eql(([]));

            var f4 = processContext.getFileByPath('issue-235.html');
            expect(f4.data.indexOf('src/common/main.js?foo=bar#hello=world')).not.to.be(-1);
            expect(f4.data.indexOf('src/common/main.css')).not.to.be(-1);
            expect(f4.data.indexOf('src/common/logo-ba001c53c2b.gif')).not.to.be(-1);
            expect(f4.data.indexOf('<script src="http://www.baidu.com/a.js?x=1"></script>')).not.to.be(-1);
            expect(f4.data.indexOf('<script src="//www.baidu.com/foo/bar.js?y=2"></script>')).not.to.be(-1);
            expect(f4.data.indexOf('<script src="https://www.google.com/ssl.js#a=b"></script>')).not.to.be(-1);
            expect(f4.data.indexOf('<embed src=\'src/common/logo.gif\' widht=100 height=200 />')).not.to.be(-1);
            expect(f4.data.indexOf('<param value=\'src/common/logo.gif\' name="movie" />')).not.to.be(-1);
            expect(f4.data.indexOf('<param value="src/common/logo.gif" />')).not.to.be(-1);


            var f5 = processContext.getFileByPath('src/common/main.css');
            expect(f5.data.indexOf('logo.gif')).not.to.be(-1);
            var f6 = processContext.getFileByPath('src/biz/foo.css');
            expect(f6.data.indexOf('../common/logo.gif')).not.to.be(-1);
            expect(f6.data.indexOf('background: url  (../common/logo.gif)  ;')).not.to.be(-1);
            expect(f6.data.indexOf('background: url("../common/logo.gif");')).not.to.be(-1);

            done();
        });
    });

    // svg字体/css-sprites中url带hash的问题
    it('issue-293 & issue-91', function (done) {
        var p1 = new MD5Renamer({
            files: [
                'issue-293.html',
                'src/css/issue-293.css'
            ],
            outputTemplate: '{basename}-{md5sum}{extname}',
            start: 1,
            end: 12
        });
        var p2 = new CssCompressor();

        var processContext = new ProcessContext({
            baseDir: Project,
            exclude: [],
            outputDir: 'output',
            fileEncodings: {}
        });

        base.traverseDir(Project, processContext);

        base.launchProcessors([p1, p2], processContext, function () {
            var logo = processContext.getFileByPath('src/common/logo.gif');
            expect(logo.outputPaths).to.eql((['src/common/logo-ba001c53c2b.gif']));
            var html = processContext.getFileByPath('issue-293.html');
            expect(html.data.indexOf('src/common/logo-ba001c53c2b.gif#100-100')).not.to.be(-1);
            var css = processContext.getFileByPath('src/css/issue-293.css');
            expect(css.data.indexOf('../common/logo-ba001c53c2b.gif#100-100')).not.to.be(-1);
            var expected =
                '.logo{background:url(../common/logo-ba001c53c2b.gif#100-100)}\n' +
                'div{background:url(../common/logo-ba001c53c2b.gif)}\n' +
                'a{background:url(../common/logo-ba001c53c2b.gif#100-100)}';
            expect(css.data).to.eql(expected);
            done();
        });
    });

});



















/* vim: set ts=4 sw=4 sts=4 tw=100: */
