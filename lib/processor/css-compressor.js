/**
 * @file css压缩的构建处理器
 * @author errorrik[errorrik@gmail.com],
 *         firede[firede@firede.us]
 */

var path = require( 'path' );
var AbstractProcessor = require( './abstract' );

/**
 * css压缩的构建处理器
 *
 * @constructor
 * @param {Object} options 初始化参数
 */
function CssCompressor( options ) {
    AbstractProcessor.call( this, options );

    var compressOptions = this.compressOptions;
    if ( !compressOptions || typeof compressOptions != 'object' ) {
        this.compressOptions = {};
    }
}

CssCompressor.prototype = new AbstractProcessor();

/**
 * 处理器名称
 *
 * @type {string}
 */
CssCompressor.prototype.name = 'CssCompressor';

/**
 * 判断处理器是否忽略文件
 *
 * @param {FileInfo} file 文件信息对象
 */
CssCompressor.prototype.isExclude = function( file ) {
    var k = AbstractProcessor.prototype.isExclude.call(this, file);

    return k || path.extname( file.outputPath ) !== '.css';
}

/**
 * 构建处理
 *
 * @param {FileInfo} file 文件信息对象
 * @param {ProcessContext} processContext 构建环境对象
 * @param {Function} callback 处理完成回调函数
 */
CssCompressor.prototype.process = function ( file, processContext, callback ) {
    var compressOptions = this.compressOptions;
    var options = {};

    // clone compressOptions
    for ( var key in compressOptions ) {
        if ( compressOptions.hasOwnProperty( key ) ) {
            options[ key ] = compressOptions[ key ];
        }
    }

    // calc relative path
    if ( !options.relativeTo ) {
        options.relativeTo = path.dirname( file.fullPath );
    }

    // do compress
    try {
        file.setData( compressCss( file.data, options ) );
    } catch ( ex ) {
        this.log.fatal('Compress css failed, file = [%s], msg = [%s]',
            file.path, ex.toString());
    }

    callback();
};


/**
 * 压缩css代码
 *
 * @inner
 * @param {string} code 源代码
 * @param {Object} options 压缩工具选项
 * @return {string}
 */
function compressCss( code, options ) {
    var CleanCSS = require( 'clean-css' );
    return new CleanCSS( options ).minify( code );
};

module.exports = exports = CssCompressor;
