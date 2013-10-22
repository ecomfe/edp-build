/**
 * @file html2js 处理器
 * @author menglingjun[menglingjun@baidu.com]
 */

var AbstractProcessor = require( './abstract' );

/**
 * html2js 处理器
 *
 * @constructor
 * @param {Object} options 初始化参数
 * @param {string} options.extnams 木板文件扩展名列表，`,`分隔的字符串
 */
function Html2JsCompiler( options ) {
    AbstractProcessor.call( this, options );

    // / init extnams
    var extnams = {};
    var optExtnames = this.extnams || ['hjs', 'mustcahe'];
    if ( !(optExtnames instanceof Array) ) {
        optExtnames = optExtnames.split( /\s*,\s*/ );
    }
    optExtnames.forEach(
        function ( extname ) {
            extnams[ extname ] = 1;
        }
    );
    this.extnams = extnams;
}

Html2JsCompiler.prototype = new AbstractProcessor();

/**
 * 处理器名称
 *
 * @type {string}
 */
Html2JsCompiler.prototype.name = 'Html2JsCompiler';

/**
 * 构建处理
 *
 * @param {FileInfo} file 文件信息对象
 * @param {ProcessContext} processContext 构建环境对象
 * @param {Function} callback 处理完成回调函数
 */
Html2JsCompiler.prototype.process = function ( file, processContext, callback ) {

    if ( this.extnams[file.extname] ) {

        // 替换后缀名
        file.outputPath = file.outputPath.replace(
            new RegExp( '\.' + file.extname + '$' ),
            '.' + file.extname + '.js'
        );

        processContext.addFileLink( file.path, file.outputPath );

        file.extname = 'js';

        file.setData(
            compileHtml2Js(
                file.data,
                this
            )
        );
    }

    callback();
};


/**
 * Html2Js转换器
 *
 * @inner
 * @param {string} code html代码
 * @return {string}
 */
function compileHtml2Js( code, options ) {

    var opt = {
        wrap: true,
        mode: options.mode
    };

    return require('html2js')(code, opt);

};

module.exports = exports = Html2JsCompiler;
