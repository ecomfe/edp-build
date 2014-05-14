/**
 * @file Javascript压缩的构建处理器
 * @author errorrik[errorrik@gmail.com]
 */
var edp = require( 'edp-core' );
var AbstractProcessor = require( './abstract' );
var FileInfo = require( '../file-info' );

/**
 * Javascript压缩的构建处理器
 *
 * @constructor
 * @param {Object} options 初始化参数
 */
function JsCompressor( options ) {
    options = edp.util.mix( {
        files: [ '*.js' ],
        compressOptions: {}
    }, options );
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
    file.setData(
        compressJavascript(
            file,
            processContext,
            this.mangleOptions,
            this.compressOptions,
            this.sourceMapOptions
        )
    );

    callback();
};


/**
 * 压缩Javascript代码
 *
 * @inner
 * @param {FileInfo} file 文件信息对象
 * @param {ProcessContext} processContext 构建环境对象
 * @param {Object} mangleOptions
 * @param {Object} compressOptions
 * @param {Object} sourceMapOptions
 * @return {string}
 */
function compressJavascript( file, processContext,
                             mangleOptions, compressOptions, sourceMapOptions) {
    var UglifyJS = require( 'uglify-js' );

    try {
        var basename = require('path').basename( file.path );
        var origname = basename.replace('.js', '.org.js');
        var ast = UglifyJS.parse( file.data, { filename: origname } );

        // default options
        //
        // see http://lisperator.net/uglifyjs/compress about compressOptions
        //
        // mangleOptions has not be seen in offical site, see `except` in
        //      https://github.com/mishoo/UglifyJS2/blob/master/bin/uglifyjs
        // `toplevel` and `defines` can be used is not sure.
        if ( compressOptions !== false ) {
            compressOptions = compressOptions || {};
        }

        if (!('warnings' in compressOptions)) {
            compressOptions.warnings = false;
        }

        //see https://github.com/ecomfe/edp/issues/230
        if (!('conditionals' in compressOptions)) {
            compressOptions.conditionals = false;
        }

        // see http://lisperator.net/uglifyjs/mangle
        if ( mangleOptions !== false ) {
            mangleOptions = mangleOptions || {
                except: [ 'require', 'exports', 'module' ]
            };
        }

        if ( sourceMapOptions !== false ) {
            sourceMapOptions = sourceMapOptions || {};
        }

        var sourceMap = sourceMapOptions.enable ? UglifyJS.SourceMap( {
            file: basename
        } ) : null;

        var stream = UglifyJS.OutputStream( {
            'source_map': sourceMap
        });

        /* jshint camelcase: false */
        // compressor needs figure_out_scope too
        ast.figure_out_scope();
        ast = ast.transform( UglifyJS.Compressor( compressOptions ) );

        // need to figure out scope again so mangler works optimally
        ast.figure_out_scope();
        ast.compute_char_frequency( mangleOptions );
        ast.mangle_names( mangleOptions );

        ast.print(stream);

        var suffix = '';
        if (sourceMap) {
            var smFileData = new FileInfo( {
                data         : sourceMap.toString(),
                extname      : 'sourcemap',
                path         : file.path.replace(/\.js$/, '.sourcemap'),
                fullPath     : file.fullPath.replace(/\.js$/, '.sourcemap'),
                fileEncoding : 'utf-8'
            } );
            var oriFileData = new FileInfo( {
                data         : (file.data || '').toString(),
                extname      : 'js',
                path         : file.path.replace(/\.js$/, '.org.js'),
                fullPath     : file.fullPath.replace(/\.js$/, '.org.js'),
                fileEncoding : 'utf-8'
            } );
            processContext.addFile( smFileData );
            processContext.addFile( oriFileData );
            suffix = '\n//# sourceMappingURL=' +
                require('path').basename( smFileData.outputPath );
        }

        return stream.get() + suffix;
    }
    catch ( ex ) {
        edp.log.fatal('Compress %s failed, ' +
            'exception msg = %s', file.path, ex.toString());
        return file.data;
    }
}

module.exports = exports = JsCompressor;
