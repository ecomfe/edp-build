/**
 * @file Javascript压缩的构建处理器
 * @author errorrik[errorrik@gmail.com]
 */

var AbstractProcessor = require( './abstract' );

/**
 * Javascript压缩的构建处理器
 * 
 * @constructor
 * @param {Object} options 初始化参数
 */
function JsCompressor( options ) {
    AbstractProcessor.call( this, options );
}

JsCompressor.prototype = new AbstractProcessor();

/**
 * 处理器名称
 * 
 * @type {string}
 */
JsCompressor.prototype.name = 'JsCompressor';

/**
 * 构建处理
 * 
 * @param {FileInfo} file 文件信息对象
 * @param {ProcessContext} processContext 构建环境对象
 * @param {Function} callback 处理完成回调函数
 */
JsCompressor.prototype.process = function ( file, processContext, callback ) {
    if ( file.extname === 'js' ) {
        file.setData( compressJavascript( file.data ) );
    }

    callback();
};


/**
 * 压缩Javascript代码
 * 
 * @inner
 * @param {string} code Javascript源代码
 * @return {string} 
 */
function compressJavascript( code ) {
    var UglifyJS = require( 'uglify-js' );
    var ast = UglifyJS.parse( code );

    // compressor needs figure_out_scope too
    ast.figure_out_scope();
    ast = ast.transform( UglifyJS.Compressor() );
 
    // need to figure out scope again so mangler works optimally
    ast.figure_out_scope();
    ast.compute_char_frequency();
    ast.mangle_names( { 
        except: [ 'require', 'exports', 'module' ] 
    } );

    return ast.print_to_string();
};

module.exports = exports = JsCompressor;
