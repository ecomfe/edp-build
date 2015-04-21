/***************************************************************************
 *
 * Copyright (c) 2013 Baidu.com, Inc. All Rights Reserved
 * $Id$
 *
 **************************************************************************/



/**
 * js-compressor.spec.js ~ 2013/09/28 19:39:59
 * @author leeight(liyubei@baidu.com)
 * @version $Revision$
 * @description
 *
 **/
var path = require('path');

var base = require('./base');
var ProcessContext = require('../lib/process-context.js');
var JsCompressor = require('../lib/processor/js-compressor.js');
var Project = path.resolve(__dirname, 'data', 'js-compressor');

describe('js-compressor', function() {
    var processContext;

    function getProcessContext(opt_baseDir) {
        var baseDir = opt_baseDir || Project;
        var ctx = new ProcessContext({
            baseDir: baseDir,
            exclude: [],
            outputDir: 'output',
            fileEncodings: {}
        });

        base.traverseDir(baseDir, ctx);
        base.traverseDir(path.join(baseDir, '..', 'base'), ctx);

        return ctx;
    }

    beforeEach(function () {
        processContext = getProcessContext(Project);
    });

    it('默认保留require, exports, module三个变量', function (done) {
        var processor = new JsCompressor();
        base.launchProcessors([processor], processContext, function () {
            var fileData = processContext.getFileByPath('default.js');
            expect(fileData.data).toBe('function main(){var require=0,exports=1,module=2,o=3;' +
                'return require+exports+module+o}');
            done();
        });
    });

    it('支持设置mangleOptions', function (done) {
        var processor = new JsCompressor({
            mangleOptions: {
                except: ['require', 'foobar', 'callSuper']
            }
        });
        base.launchProcessors([processor], processContext, function () {
            var fileData = processContext.getFileByPath('5.js');
            expect(fileData.data).toBe('function main(){function callSuper(){}var require=0,n=1,o=2,foobar=3;' +
                'return callSuper(require+n+o+foobar)}');
            done();
        });
    });

    it('支持设置sourceMapOptions', function (done) {
        var processor = new JsCompressor({
            sourceMapOptions: {
                enable: true
            }
        });
        base.launchProcessors([processor], processContext, function () {
            var fileData = processContext.getFileByPath('5.js');
            expect(fileData.data).toBe('function main(){function n(){}var require=0,exports=1,module=2,o=3;' +
                'return n(require+exports+module+o)}\n//# sourceMappingURL=source_map/5.js.map');
            expect(processContext.getFileByPath('source_map/5.js.map')).not.toBe(null);
            expect(processContext.getFileByPath('source_map/5.js')).not.toBe(null);
            done();
        });
    });

    it('支持设置sourceMapOptions + root', function (done) {
        var processor = new JsCompressor({
            sourceMapOptions: {
                enable: true,
                root: 'this/is/the/fucking/sourcemap/directory'
            }
        });
        base.launchProcessors([processor], processContext, function () {
            var fileData = processContext.getFileByPath('5.js');
            expect(fileData.data).toBe('function main(){function n(){}var require=0,exports=1,module=2,o=3;' +
                'return n(require+exports+module+o)}\n//# sourceMappingURL=this/is/the/fucking/sourcemap/directory/5.js.map');
            expect(processContext.getFileByPath('this/is/the/fucking/sourcemap/directory/5.js.map')).not.toBe(null);
            expect(processContext.getFileByPath('this/is/the/fucking/sourcemap/directory/5.js')).not.toBe(null);
            done();
        });
    });

    it('支持设置sourceMapOptions + host + root', function (done) {
        var processor = new JsCompressor({
            sourceMapOptions: {
                enable: true,
                host: 'http://fe.baidu.com/version/8964/',
                root: 'this/is/the/fucking/sourcemap/directory'
            }
        });
        base.launchProcessors([processor], processContext, function () {
            var fileData = processContext.getFileByPath('5.js');
            expect(fileData.data).toBe('function main(){function n(){}var require=0,exports=1,module=2,o=3;' +
                'return n(require+exports+module+o)}\n//# sourceMappingURL=http://fe.baidu.com/version/8964/this/is/the/fucking/sourcemap/directory/5.js.map');
            expect(processContext.getFileByPath('this/is/the/fucking/sourcemap/directory/5.js.map')).not.toBe(null);
            expect(processContext.getFileByPath('this/is/the/fucking/sourcemap/directory/5.js')).not.toBe(null);

            var f1 = processContext.getFileByPath('src/foo/bar/1.js');
            expect(f1.data).toBe('define(function(require){return"foo/bar/1"});' +
                '\n//# sourceMappingURL=http://fe.baidu.com/version/8964/this/is/the/fucking/sourcemap/directory/src/foo/bar/1.js.map');
            done();
        });
    });

    /**
     * Global Define的用法是这样子的
     * 在页面中定义
     * var DEBUG = true;
     * 在JS代码中不要出现DEBUG的定义和赋值操作，只是去使用它
     * 然后就可以通过 global_defs 来改写这些变量的值了
     */
    it('测试global defines', function (done) {
        var c1 = getProcessContext();
        var p1 = new JsCompressor({
            compressOptions: {
                global_defs: {
                    FLAGS_boolean: 123,
                    DEBUG: false,
                    kURL: 'http://www.baidu.com'
                }
            }
        });

        base.launchProcessors([p1], c1, function () {
            var fd = c1.getFileByPath('6.js');
            // conditionals: false
            expect(fd.data).toBe('function log(n){if(!1)console.log(n);console.log(123)}console.log("http://www.baidu.com");');
            done();
        });
    });

    it('测试global defines with conditionals true', function (done) {
        var c1 = getProcessContext();
        var p1 = new JsCompressor({
            compressOptions: {
                global_defs: {
                    FLAGS_boolean: 123,
                    DEBUG: false,
                    kURL: 'http://www.baidu.com'
                },
                conditionals: true
            }
        });

        base.launchProcessors([p1], c1, function () {
            var fd = c1.getFileByPath('6.js');
            // conditionals: true
            expect(fd.data).toBe('function log(n){console.log(123)}console.log("http://www.baidu.com");');
            done();
        });
    });
});



















/* vim: set ts=4 sw=4 sts=4 tw=100: */
