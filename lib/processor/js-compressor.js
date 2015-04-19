/**
 * @file Javascript压缩的构建处理器
 * @author errorrik[errorrik@gmail.com]
 *         leeight[leeight@gmail.com]
 */
var util = require('util');

var edp = require('edp-core');

var FileInfo = require('../file-info');
var AbstractProcessor = require('./abstract');
var helper = require('./helper');

/**
 * Javascript压缩的构建处理器
 *
 * @constructor
 * @param {Object} options 初始化参数
 */
function JsCompressor(options) {
    AbstractProcessor.call(this, options);
}
util.inherits(JsCompressor, AbstractProcessor);

/**
 * @type {Object}
 * @const
 */
JsCompressor.DEFAULT_OPTIONS = {
    name: 'JsCompressor',
    files: ['*.js', '!*.min.js'],
    mangleOptions: {},
    compressOptions: {},
    sourceMapOptions: {}
};

/**
 * 构建处理
 *
 * @param {FileInfo} file 文件信息对象
 * @param {ProcessContext} processContext 构建环境对象
 * @param {Function} callback 处理完成回调函数
 */
JsCompressor.prototype.process = function (file, processContext, callback) {
    try {
        var options = {
            compress: this.compressOptions,
            mangle: this.mangleOptions,
            sourceMap: this.sourceMapOptions
        };
        var result = helper.compressJavascript(file, options);

        var sourceMap = result[1];
        if (sourceMap) {
            processContext.addFile(new FileInfo({
                data: sourceMap,
                extname: 'sourcemap',
                path: file.path.replace(/\.js$/, '.sourcemap'),
                fullPath: file.fullPath.replace(/\.js$/, '.sourcemap'),
                fileEncoding: 'utf-8'
            }));

            processContext.addFile(new FileInfo({
                data: (file.data || '').toString(),
                extname: 'js',
                path: file.path.replace(/\.js$/, '.org.js'),
                fullPath: file.fullPath.replace(/\.js$/, '.org.js'),
                fileEncoding: 'utf-8'
            }));
        }

        file.setData(result[0]);
    }
    catch (ex) {
        edp.log.fatal('Compress %s failed, ' +
            'exception msg = %s', file.path, ex.toString());
    }
    finally {
        callback();
    }
};


module.exports = exports = JsCompressor;
