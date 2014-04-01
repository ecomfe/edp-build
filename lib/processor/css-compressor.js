/**
 * @file css压缩的构建处理器
 * @author errorrik[errorrik@gmail.com],
 *         firede[firede@firede.us]
 */
var edp = require( 'edp-core' );
var path = require( 'path' );
var AbstractProcessor = require( './abstract' );

/**
 * css压缩的构建处理器
 *
 * @constructor
 * @param {Object} options 初始化参数
 */
function CssCompressor( options ) {
    options = edp.util.mix( {
        files: [ '*.css' ],
        compressOptions: {}
    }, options );
    AbstractProcessor.call( this, options );
}

CssCompressor.prototype = new AbstractProcessor();

/**
 * 处理器名称
 *
 * @type {string}
 */
CssCompressor.prototype.name = 'CssCompressor';

/**
 * 构建处理
 *
 * @param {FileInfo} file 文件信息对象
 * @param {ProcessContext} processContext 构建环境对象
 * @param {Function} callback 处理完成回调函数
 */
CssCompressor.prototype.process = function ( file, processContext, callback ) {
    var compressOptions = this.compressOptions;
    var options = {
        // 可能存在bug，因此禁用优化的功能.
        // https://github.com/ecomfe/edp/issues/190
        noAdvanced: true,
        keepBreaks: true
    };

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
}

module.exports = exports = CssCompressor;
