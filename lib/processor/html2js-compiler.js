/**
 * @file html2js 处理器
 * @author junmer[junmer@foxmail.com]
 */

/* eslint-env node */

var edp = require('edp-core');
var AbstractProcessor = require('./abstract');
var fs = require('fs');

/**
 * html2js 处理器
 *
 * @constructor
 * @param {Object} options 初始化参数
 * @param {string} options.extnames 模板文件扩展名列表，`,`分隔的字符串
 */
function Html2JsCompiler(options) {
    options = edp.util.mix({
        extnames: ['hjs', 'mustcahe']
    }, options);
    AbstractProcessor.call(this, options);

    // 用户自定义的配置
    var optExtnames = this.extnames || ['hjs', 'mustcahe'];
    if (!(optExtnames instanceof Array)) {
        optExtnames = optExtnames.split(/\s*,\s*/);
    }
    var array = require('../util/array');
    this.extnames = array.list2map(optExtnames);
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
        wrap: true,
        mode: options.mode
    };

    return require('html2js')(code, opt);
}

/**
 * 修改 html 文件对象
 *
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

        var fileSrcPath = file.fullPath + '.js';

        // 删除 src/*/*.extname.js
        // @todo 等 module 不读文件了 这里就不删了
        if (this.clean && file._html2jsed) {

            if (fs.existsSync(fileSrcPath)) {
                fs.unlinkSync(fileSrcPath);
            }

            callback();
            return;
        }

        // 按 后缀名 读
        if (this.extnames[file.extname]) {

            file._html2jsed = true;

            var output = '';

            if (this.keepSource) {
                var jsFile = file.clone();
                output = file2js(jsFile, this);
                processContext.addFile(jsFile);
            }
            else {
                output = file2js(file, this);
                processContext.addFileLink(file.path, file.outputPath);
            }

            // 需要模块合并, 写 src/*/*.extname.js
            // @todo 等 module 不读文件了 这里就不写了
            if (this.combine) {
                fs.writeFile(fileSrcPath, output);
            }

        }

        callback();
    };


module.exports = exports = Html2JsCompiler;
