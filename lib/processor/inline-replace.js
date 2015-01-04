/**
 * @file inline 处理器
 * @author junmer[junmer@foxmail.com]
 */

/* eslint-env node */

var edp = require('edp-core');
var AbstractProcessor = require('./abstract');

/**
 * 获取文件内容
 *
 * @param  {Object} processContext 构建环境对象
 * @param  {string} path           文件路径
 * @return {string}                内容
 */
function getFileData(processContext, path) {

    var fileInfo = processContext.getFileByPath(path);

    if (fileInfo && fileInfo.data) {
        return fileInfo.data;
    }

    return '<!-- // file: ' + path + ' not found -->';
}

/**
 * 替换标签内容
 *
 * @param  {string} content     目标全文
 * @param  {string} tag         标签
 * @param  {string} attribute   属性
 * @param  {Function} condition   替换条件
 * @param  {Function} tagReplacer 替换函数
 * @return {string}             替换结果
 */
function replaceTag(content, tag, attribute, condition, tagReplacer) {

    var attrReg = new RegExp('(' + attribute + ')=([\'"])([^\'"]+)\\2');
    var tagReg = new RegExp('<' + tag + '([^>]+)>', 'g');

    function replacer(match, attrStr) {
        if (typeof condition === 'function' && !condition(match.slice(1))) {
            return match;
        }

        /**
         * 匹配的属性
         *
         * [match, attrName, start, value]
         * @type {?array}
         */
        var attrMatch = attrStr.match(attrReg);

        if (attrMatch && attrMatch[3]) {
            return tagReplacer(attrMatch[3]);
        }

        return match;

    }

    return content.replace(tagReg, replacer);

}

/**
 * inline 处理器
 *
 * @constructor
 * @param {Object} options 初始化参数
 */
function InlineReplace(options) {

    this.files = [
        '*.html',
        '*.htm',
        '*.phtml',
        '*.tpl',
        '*.vm'
    ];

    options = edp.util.mix({
        condition: function (tagSource) {
            return (/data-inline/).test(tagSource);
        },
        replacements: [
            {
                tag: 'link',
                attribute: 'href',
                condition: this.condition,
                replacer: function (processContext) {
                    return function (path) {
                        return '<style>' + getFileData(processContext, path) + '</style>';
                    };
                }
            },
            {
                tag: 'script',
                attribute: 'src',
                condition: this.condition,
                replacer: function (processContext) {
                    return function (path) {
                        return '<script>' + getFileData(processContext, path);
                    };
                }
            }
        ]
    }, options);

    AbstractProcessor.call(this, options);
}

InlineReplace.prototype = new AbstractProcessor();

/**
 * 处理器名称
 *
 * @type {string}
 */
InlineReplace.prototype.name = 'InlineReplace';

/**
 * 构建处理
 *
 * @param {FileInfo} file 文件信息对象
 * @param {ProcessContext} processContext 构建环境对象
 * @param {Function} callback 处理完成回调函数
 */
InlineReplace.prototype.process =
    function (file, processContext, callback) {

        var output = file.data;

        this.replacements.forEach(function (item) {
            output = replaceTag(
                output,
                item.tag,
                item.attribute,
                item.condition,
                item.replacer(processContext)
            );
        });

        file.setData(output);

        callback();
    };


module.exports = exports = InlineReplace;
