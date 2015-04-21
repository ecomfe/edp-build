/**
 * @file lib/processor/string-replace-processor.js ~ 2014/02/17 21:59:17
 * @author leeight(liyubei@baidu.com)
 */
var util = require('util');

var AbstractProcessor = require('./abstract');

/**
 * 替换一些最终build的文件内容.
 *
 * @constructor
 * @param {Object} options 初始化参数
 */
function StringReplace(options) {
    AbstractProcessor.call(this, options);
}
util.inherits(StringReplace, AbstractProcessor);

StringReplace.DEFAULT_OPTIONS = {
    name: 'StringReplace',
    replacements: []
};

/**
 * 构建处理
 *
 * @param {FileInfo} file 文件信息对象
 * @param {ProcessContext} processContext 构建环境对象
 * @param {Function} callback 处理完成回调函数
 */
StringReplace.prototype.process = function (file, processContext, callback) {
    var data = file.data;
    this.replacements.forEach(function (replacement) {
        var from = replacement.from;
        var to = replacement.to;
        if (from != null && to != null) {
            data = data.replace(from, to);
        }
    });

    file.setData(data);
    callback();
};

module.exports = exports = StringReplace;




















/* vim: set ts=4 sw=4 sts=4 tw=100: */
