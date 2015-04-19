/**
 * @file 修正DEBUG变量的处理器
 * @author zhanglili[otakustay@gmail.com]
 *         leeight[leeight@gmail.com]
 */

var util = require('util');

var AbstractProcessor = require('./abstract');
var helper = require('./helper');

/**
 * 添加版权声明的构建器
 *
 * @constructor
 * @param {Object} options 初始化参数
 */
function ReplaceDebug(options) {
    AbstractProcessor.call(this, options);
    this.files = this.files || helper.ext2files(this.extnames);
}
util.inherits(ReplaceDebug, AbstractProcessor);

ReplaceDebug.DEFAULT_OPTIONS = {
    name: 'ReplaceDebug',
    extnames: ['html'],
    files: null
};


/**
 * 构建处理
 *
 * @param {FileInfo} file 文件信息对象
 * @param {ProcessContext} processContext 构建环境对象
 * @param {Function} callback 处理完成回调函数
 */
ReplaceDebug.prototype.process = function (file, processContext, callback) {
    var PROCESSED_PROP = 'ReplaceDebugProcessed';
    if (!file.get(PROCESSED_PROP)) {
        var data = file.data.replace(
            /window\.DEBUG\s*=\s*true;/g,
            'window.DEBUG=false;'
        );

        file.setData(data);
        file.set(PROCESSED_PROP, 1);
    }
    callback();
};

module.exports = exports = ReplaceDebug;
