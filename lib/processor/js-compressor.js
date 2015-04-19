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
    sourceMapOptions: {
        // 默认是关闭的状态
        enable: false,
        // root 决定了 output 目录中的sourcemap所在的目录
        root: 'sourcemap',
        // host 决定了 sourceMappingURL 的前缀
        host: null
    }
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
        this.debug('options = %j', options);
        var result = helper.compressJavascript(file, options);

        var sourceMap = result[1];
        if (sourceMap) {
            var root = options.sourceMap.root || '';
            processContext.addFile(new FileInfo({
                data: sourceMap,
                extname: 'map',
                path: edp.path.join(root, file.path + '.map'),
                fileEncoding: 'utf-8'
            }));

            processContext.addFile(new FileInfo({
                data: (file.data || '').toString(),
                extname: 'js',
                path: edp.path.join(root, file.path),
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
