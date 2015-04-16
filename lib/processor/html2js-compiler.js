/**
 * @file html2js 处理器
 * @author junmer[junmer@foxmail.com]
 */

/* eslint-env node */
var AbstractProcessor = require('./abstract');

/**
 * html2js 处理器
 *
 * @constructor
 * @param {Object} options 初始化参数
 * @param {Array} options.extnames 后缀名
 */
function Html2JsCompiler(options) {

    options = options || {};

    // 用户自定义的配置
    var optExtnames = options.extnames || ['hjs', 'mustcahe'];
    if (!(optExtnames instanceof Array)) {
        optExtnames = optExtnames.split(/\s*,\s*/);
    }

    // 用 files 过滤文件
    options.files = options.files || optExtnames.map(function(item) {
        return '*.' + item;
    });

    AbstractProcessor.call(this, options);

}

Html2JsCompiler.prototype = new AbstractProcessor();

/**
 * 处理器名称
 *
 * @type {string}
 */
Html2JsCompiler.prototype.name = 'Html2JsCompiler';

/**
 * Html2Js转换器
 *
 * @inner
 * @param {string} code html代码
 * @param {Object} options 配置
 * @return {string}
 */
function compileHtml2Js(code, options) {

    var opt = {
        wrap: options.wrap || 'amd',
        mode: options.mode
    };

    return require('html2js')(code, opt);
}

/**
 * 修改 html 文件对象
 *
 * @inner
 * @param  {FileInfo} file 文件对象
 * @param  {Object} opt 配置
 * @return {string}      js 结果
 */
function file2js(file, opt) {
    file.outputPath += '.js';
    file.extname = 'js';
    file.path += '.js';
    var output = compileHtml2Js(file.data, opt);
    file.setData(output);
    return output;
}

/**
 * 构建处理
 *
 * @param {FileInfo} file 文件信息对象
 * @param {ProcessContext} processContext 构建环境对象
 * @param {Function} callback 处理完成回调函数
 */
Html2JsCompiler.prototype.process =
    function (file, processContext, callback) {

        // 兼容, 警告一下之前的 api
        if (this.clean) {
            this.log.warn('Option: clean is Deprecated, Html2Js won\'t write file, just run once.');
            callback();
            return;
        }

        if (this.keepSource) {
            var jsFile = file.clone();
            file2js(jsFile, this);
            processContext.addFile(jsFile);
        }
        else {
            file2js(file, this);
            processContext.addFileLink(file.path, file.outputPath);
        }

        callback();
    };


module.exports = exports = Html2JsCompiler;
