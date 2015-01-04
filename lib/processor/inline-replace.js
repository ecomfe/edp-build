/**
 * @file inline 处理器
 * @author junmer[junmer@foxmail.com]
 */

/* eslint-env node */

var AbstractProcessor = require('./abstract');

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
 * INLINE_TOKEN
 *
 * @type {RegExp}
 */
var INLINE_TOKEN = /<\!--(\s*?)edp-inline(\s*?)\:(\s*?)["'](.*)["'](\s*?)-->/gi;

/**
 * 构建处理
 *
 * @param {FileInfo} file 文件信息对象
 * @param {ProcessContext} processContext 构建环境对象
 * @param {Function} callback 处理完成回调函数
 */
InlineReplace.prototype.process =
    function (file, processContext, callback) {

        file.setData(
            file.data.replace(
                INLINE_TOKEN,
                function(match, $1, $2, $3, path) {

                    var fileInfo = processContext.getFileByPath(path);

                    if (fileInfo && fileInfo.data) {
                        return fileInfo.data;
                    }

                    return '<!-- // file: ' + path + ' not found -->';
                }
            )
        );

        callback();
    };


module.exports = exports = InlineReplace;
