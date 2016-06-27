/**
 * @file PostCSS 构建处理器
 * @author Justineo(guyiling@baidu.com)
 */
var util = require('util');

var u = require('underscore');
var edp = require('edp-core');
var postcss = require('postcss');

var AbstractProcessor = require('./abstract');
var helper = require('./helper');

/**
 * PostCSS 构建处理器
 *
 * @constructor
 * @param {Object} options 初始化参数
 */
function PostCSSProcessor(options) {
    AbstractProcessor.call(this, options);
}
util.inherits(PostCSSProcessor, AbstractProcessor);

/**
 * @type {Object}
 * @const
 */
PostCSSProcessor.DEFAULT_OPTIONS = {
    name: 'PostCSSProcessor',

    files: ['*.css'],

    // 可以配置 paths 等参数
    processOptions: {},

    // 自定义的 postcss 处理器
    postcss: null
};

/**
 * 构建处理
 *
 * @param {FileInfo} file 文件信息对象
 * @param {ProcessContext} processContext 构建环境对象
 * @param {Function} callback 处理完成回调函数
 */
PostCSSProcessor.prototype.process = function (file, processContext, callback) {
    try {
        // this.postcss说明是从外部传递过来的，如果不存在，就用默认的
        helper.processCSS(this.postcss || postcss, file.data, this.processOptions)
            .then(function (css) {
                file.setData(css);
            })
            .fail(function (err) {
                edp.log.warn('Process CSS failed, file = [%s], msg = [%s]',
                    file.path, err.toString());
                file.outputPath = null;
            })
            .fin(callback);
    }
    catch (ex) {
        edp.log.fatal('Process CSS failed, file = [%s], msg = [%s]',
            file.path, ex.toString());
        file.outputPath = null;
        callback();
    }
};

module.exports = exports = PostCSSProcessor;
