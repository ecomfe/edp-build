/**
 * @file ES6编译的构建处理器
 * @author zhanglili[otakustay@gmail.com]
 *         leeight[leeight@gmail.com]
 */

var util = require('util');

var AbstractProcessor = require('./abstract');

/**
 * 使用Babel将ES6代码转为ES5代码
 *
 * @constructor
 * @param {Object} options 配置项
 */
function BabelProcessor(options) {
    AbstractProcessor.call(this, options);
}
util.inherits(BabelProcessor, AbstractProcessor);

BabelProcessor.DEFAULT_OPTIONS = {
    name: 'BabelProcessor',
    files: ['*.es6', '*.es'],
    compileOptions: {
        loose: 'all',
        modules: 'amd',
        compact: false,
        ast: false,
        blacklist: ['strict']
    }
};

/**
 * 构建处理
 *
 * @param {FileInfo} file 文件信息对象
 * @param {ProcessContext} processContext 构建环境对象
 * @param {Function} callback 处理完成回调函数
 */
BabelProcessor.prototype.process = function (file, processContext, callback) {
    var code = file.data;
    var babelResult = require('babel').transform(code, this.compileOptions);

    file.setData(babelResult.code);

    callback();
};

module.exports = exports = BabelProcessor;
