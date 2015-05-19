/**
 * @file html2js 处理器
 * @author junmer[junmer@foxmail.com]
 *         leeight[leeight@gmail.com]
 */
var util = require('util');

var u = require('underscore');
var edp = require('edp-core');
var html2js = require('html2js');

var AbstractProcessor = require('./abstract');
var helper = require('./helper');

/**
 * html2js 处理器
 *
 * @constructor
 * @param {Object} options 初始化参数
 */
function Html2JsCompiler(options) {
    AbstractProcessor.call(this, options);
    this.files = this.files || helper.ext2files(this.extnames);
}
util.inherits(Html2JsCompiler, AbstractProcessor);

Html2JsCompiler.DEFAULT_OPTIONS = {
    name: 'Html2JsCompiler',
    files: null,
    extnames: ['hjs', 'mustcahe'],

    clean: false,

    wrap: 'amd',
    mode: null
};

/**
 * 构建处理
 *
 * @param {FileInfo} file 文件信息对象
 * @param {ProcessContext} processContext 构建环境对象
 * @param {Function} callback 处理完成回调函数
 */
Html2JsCompiler.prototype.process = function (file, processContext, callback) {
    // 兼容, 警告一下之前的 api
    if (this.clean) {
        edp.log.warn('Option: clean is Deprecated, Html2Js won\'t write file, just run once.');
        callback();
        return;
    }

    if (this.keepSource) {
        var FileInfo = file.constructor;
        var jsFile = new FileInfo(u.extend({}, file));
        this._file2js(jsFile);
        jsFile.path += '.js';
        processContext.addFile(jsFile);
    }
    else {
        this._file2js(file);
        processContext.addFileLink(file.path, file.outputPath);
    }

    callback();
};

Html2JsCompiler.prototype._file2js = function (file) {
    file.outputPath += '.js';
    file.extname = 'js';

    var options = {
        wrap: this.wrap,
        mode: this.mode
    };
    var output = helper.compileHtml2Js(this.html2js || html2js, file.data, options);

    file.setData(output);
    return output;
};

module.exports = exports = Html2JsCompiler;
