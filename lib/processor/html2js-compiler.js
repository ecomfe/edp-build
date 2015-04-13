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
 * @param {string} options.extnames 模板文件扩展名列表，`,`分隔的字符串
 */
function Html2JsCompiler(options) {

    AbstractProcessor.call(this, options);

    // 用户自定义的配置
    if (this.extnames) {
        var optExtnames = this.extnames;
        if (!(optExtnames instanceof Array)) {
            optExtnames = optExtnames.split(/\s*,\s*/);
        }
        var array = require('../util/array');
        this.extnames = array.list2map(optExtnames);
    }

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

        // 如果有 extnames, 按后缀名读, 没有就算了
        if (!this.extnames || this.extnames[file.extname]) {

            if (this.keepSource) {
                var jsFile = file.clone();
                file2js(jsFile, this);
                processContext.addFile(jsFile);
            }
            else {
                file2js(file, this);
                processContext.addFileLink(file.path, file.outputPath);
            }
        }

        callback();
    };


module.exports = exports = Html2JsCompiler;
