/**
 * @file html-minifier 处理器
 * @author junmer[junmer@foxmail.com]
 */

/* eslint-env node */

var edp = require('edp-core');
var AbstractProcessor = require('./abstract');

/**
 * html-minifier 构建处理器
 *
 * @constructor
 * @param {Object} options 初始化参数
 */
function HtmlMinifier(options) {

    this.files = ['*.html', '*.tpl.html'];

    AbstractProcessor.call(this, options);
}

HtmlMinifier.prototype = new AbstractProcessor();

/**
 * 处理器名称
 *
 * @type {string}
 */
HtmlMinifier.prototype.name = 'HtmlMinifier';


/**
 * 构建处理
 *
 * @param {FileInfo} file 文件信息对象
 * @param {ProcessContext} processContext 构建环境对象
 * @param {Function} callback 处理完成回调函数
 */
HtmlMinifier.prototype.process = function (file, processContext, callback) {

    var minify = this.minify || require('html-minifier').minify;

    /**
     * minifyOptions
     *
     * @see https://github.com/kangax/html-minifier
     * @type {object}
     */
    var minifyOptions = edp.util.extend(
        {},
        {
            // 清除 空白
            collapseWhitespace: true,

            // 标签内 分隔符
            customAttrSurround: [

                /**
                * etpl if AttrSurround
                *
                * <!-- if: !${pageTitle} -->
                * <!-- /if -->
                *
                * @type {Array}
                */
                [
                    /<\!\-\-\s+if:(.*)\-\->/,
                    /<\!\-\-\s+\/if\s+\-\->/
                ]
            ],

            // removeComments: true,
            ignoreCustomComments: [
                // etpl commandSyntax
                /^\s*(\/)?([a-z]+)\s*(?::([\s\S]*))?$/
            ]
        },
        this.minifyOptions || {}
    );

    try {

        var result = minify(file.data, minifyOptions);
        file.setData(result);

    }
    catch (ex) {
        edp.log.fatal('minify html failed, file = [%s], msg = [%s]',
            file.path, ex.toString());
        file.outputPath = null;
    }

    callback();
};


module.exports = exports = HtmlMinifier;
