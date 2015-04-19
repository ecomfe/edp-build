/**
 * @file output-cleaner.js ~ 2014/04/08 15:12:45
 * @author leeight(liyubei@baidu.com)
 **/
var util = require('util');

var edp = require('edp-core');

var AbstractProcessor = require('./abstract');

/**
 * Output内容的清理处理器
 *
 * @constructor
 * @param {Object} options 初始化参数
 */
function OutputCleaner(options) {
    AbstractProcessor.call(this, options);
}
util.inherits(OutputCleaner, AbstractProcessor);

OutputCleaner.DEFAULT_OPTIONS = {
    name: 'OutputCleaner',
    files: ['*.less', '*.styl', '*.ts', '*.coffee']
};

/**
 * 构建处理
 *
 * @param {FileInfo} file 文件信息对象
 * @param {ProcessContext} processContext 构建环境对象
 * @param {Function} callback 处理完成回调函数
 */
OutputCleaner.prototype.process = function (file, processContext, callback) {
    if (file.outputPath && edp.glob.match(file.outputPath, this.files)) {
        processContext.removeFile(file.path);
    }
    callback();
};

module.exports = exports = OutputCleaner;
















/* vim: set ts=4 sw=4 sts=4 tw=100: */
