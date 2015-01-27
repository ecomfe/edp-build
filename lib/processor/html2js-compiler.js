/**
 * @file html2js 处理器
 * @author junmer[junmer@foxmail.com]
 */
var edp = require( 'edp-core' );
var AbstractProcessor = require( './abstract' );

/**
 * html2js 处理器
 *
 * @constructor
 * @param {Object} options 初始化参数
 * @param {string} options.extnames 模板文件扩展名列表，`,`分隔的字符串
 */
function Html2JsCompiler( options ) {
    options = edp.util.mix( {
        extnames: [ 'hjs', 'mustcahe' ]
    }, options );
    AbstractProcessor.call( this, options );

    // 用户自定义的配置
    var optExtnames = this.extnames || ['hjs', 'mustcahe'];
    if ( !(optExtnames instanceof Array) ) {
        optExtnames = optExtnames.split( /\s*,\s*/ );
    }
    var array = require( '../util/array' );
    this.extnames = array.list2map( optExtnames );
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
Html2JsCompiler.prototype.process =
    function ( file, processContext, callback ) {

    // 第一次 2js 会修改 file.extname
    // 所以这里自己判断
    var extname = (/[.]/.exec(file.fullPath))
        ? /[^.]+$/.exec(file.fullPath.toLowerCase())
        : '';

    if ( this.extnames[extname] ) {

        var fs = require('fs');

        var fileSrcPath = file.fullPath + '.js';

        if( this.clean ) {

            if ( fs.existsSync( fileSrcPath ) ){

                fs.unlinkSync( fileSrcPath );

            }

            callback();

            return;
        }

        file.outputPath += '.js';

        processContext.addFileLink( file.path, file.outputPath );

        file.extname = 'js';

        var output = compileHtml2Js(
            file.data,
            this
        );

        file.setData( output );

        if( this.combine ) {

            fs.writeFile( fileSrcPath, output );

        }

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
}

module.exports = exports = Html2JsCompiler;
