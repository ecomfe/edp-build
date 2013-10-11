/**
 * @file css压缩的构建处理器
 * @author errorrik[errorrik@gmail.com]
 */

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

var path = require( 'path' );

/**
 * 构建处理
 *
 * @param {FileInfo} file 文件信息对象
 * @param {ProcessContext} processContext 构建环境对象
 * @param {Function} callback 处理完成回调函数
 */
CssCompressor.prototype.process = function ( file, processContext, callback ) {
    if ( path.extname( file.outputPath ) == '.css' ) {
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
        file.setData( compressCss( file.data, options ) );
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
    var cleanCSS = require( 'clean-css' );
    return cleanCSS.process( code, options );
};

module.exports = exports = CssCompressor;
