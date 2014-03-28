/**
 * @file 修正DEBUG变量的处理器
 * @author zhanglili[otakustay@gmail.com]
 */

var AbstractProcessor = require( './abstract' );

/**
 * 添加版权声明的构建器
 *
 * @constructor
 * @param {Object} options 初始化参数
 */
function ReplaceDebug(options) {
    AbstractProcessor.call(this, options);
    this.extnames = this.extnames || [ 'html' ];
}

ReplaceDebug.prototype = new AbstractProcessor();

/**
 * 处理器名称
 *
 * @type {string}
 */
ReplaceDebug.prototype.name = 'ReplaceDebug';


/**
 * 判断处理器是否忽略文件
 *
 * @param {FileInfo} file 文件信息对象
 */
ReplaceDebug.prototype.isExclude = function( file ) {
    var k = AbstractProcessor.prototype.isExclude.call(this, file);
    if (k) {
        return k;
    }

    // 如果不符合要求，就直接忽略，不处理了.
    return this.extnames.indexOf( file.extname ) === -1;
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

    callback && callback();
};

module.exports = exports = ReplaceDebug;
