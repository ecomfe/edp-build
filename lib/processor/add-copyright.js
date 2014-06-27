/**
 * @file 添加版权声明的构建器
 * @author zhanglili[otakustay@gmail.com]
 */
var edp = require( 'edp-core' );
var fs = require( 'fs' );
var path = require( 'path' );
var AbstractProcessor = require( './abstract' );

var copyright = '';

/**
 * 添加版权声明的构建器
 *
 * @constructor
 * @param {Object} options 初始化参数
 */
function AddCopyright(options) {
    options = edp.util.mix( {
        files: [ '*.css', '*.less', '*.js' ]
    }, options );
    AbstractProcessor.call(this, options);
}

AddCopyright.prototype = new AbstractProcessor();

/**
 * 处理器名称
 *
 * @type {string}
 */
AddCopyright.prototype.name = 'AddCopyright';

/**
 * 构建处理
 *
 * @param {FileInfo} file 文件信息对象
 * @param {ProcessContext} processContext 构建环境对象
 * @param {Function} callback 处理完成回调函数
 */
AddCopyright.prototype.process = function (file, processContext, callback) {
    var fileLocation = path.join(processContext.baseDir, 'copyright.txt');

    if (!copyright && fs.existsSync(fileLocation)) {
        copyright = fs.readFileSync(fileLocation, 'utf8');
        if (copyright.charAt(copyright.length - 1) !== '\n') {
            copyright += '\n';
        }
    }
    else if (!copyright) {
        copyright = '/*! ' + new Date().getFullYear()
            + ' Baidu Inc. All Rights Reserved */\n';
    }

    var PROCESSED_PROP = 'AddCopyrightProcessed';
    if (!file.get(PROCESSED_PROP)) {
        var data = copyright + file.data;

        file.setData(data);
        file.set(PROCESSED_PROP, 1);
    }

    callback && callback();
};

module.exports = exports = AddCopyright;
