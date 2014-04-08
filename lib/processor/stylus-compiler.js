/**
 * @file Stylus编译的构建处理器
 * @author errorrik[errorrik@gmail.com]
 *         junmer[junmer@foxmail.com]
 */
var edp = require( 'edp-core' );
var config = require( '../config' );
var AbstractProcessor = require( './abstract' );

/**
 * Stylus编译的构建处理器
 *
 * @constructor
 * @param {Object} options 初始化参数
 * @param {string} options.entryExtnames 页面入口扩展名列表，`,`分隔的字符串
 */
function StylusCompiler( options ) {
    // 默认的配置信息
    var pageEntries = config.pageEntries;
    options = edp.util.mix( {
        entryExtnames: pageEntries
    }, options );
    AbstractProcessor.call( this, options );

    // 用户自定的配置
    var optExtnames = this.entryExtnames || [];
    if ( !Array.isArray( optExtnames ) ) {
        optExtnames = optExtnames.split( /\s*,\s*/ );
    }

    var array = require( '../util/array' );
    this.entryExtnames = array.list2map( optExtnames );

    if ( !Array.isArray( this.files ) ) {
        /**
         * 默认要处理的文件.
         * @type {Array.<string>}
         */
        this.files = [ '*.styl', '*.js', array.list2pattern( optExtnames ) ];
    }
}

StylusCompiler.prototype = new AbstractProcessor();

/**
 * 处理器名称
 *
 * @type {string}
 */
StylusCompiler.prototype.name = 'StylusCompiler';


/**
 * 构建处理
 *
 * @param {FileInfo} file 文件信息对象
 * @param {ProcessContext} processContext 构建环境对象
 * @param {Function} callback 处理完成回调函数
 */
StylusCompiler.prototype.process = function ( file, processContext, callback ) {
    if ( file.extname === 'styl' ) {
        // 对styl文件进行编译
        file.outputPath = file.outputPath.replace( /\.styl$/, '.css' );
        processContext.addFileLink( file.path, file.outputPath );

        var parserOptions = edp.util.extend(
            {},
            {
                paths: [ require( 'path' ).dirname( file.fullPath ) ],
                pathname: file.fullPath,
                use: this.compileOptions
            },
            this.compileOptions || {}
        );

        try {
            compileStylusAsync(
                this.stylus || require( 'stylus' ),
                file.data,
                parserOptions,
                function ( error, compiledCode ) {
                    if ( error ) {
                        edp.log.fatal('Compile stylus failed, ' +
                            'file = [%s], msg = [%s]',
                            file.path, error.toString());
                        file.outputPath = null;
                    }
                    else {
                        file.setData( compiledCode );
                    }

                    callback();
                }
            );
        }
        catch ( ex ) {
            edp.log.fatal('Compile stylus failed, file = [%s], msg = [%s]',
                file.path, ex.toString());
            file.outputPath = null;
            callback();
        }

        return;
    }
    else if ( this.entryExtnames[ file.extname ] ) {

        // 替换页面入口文件对styl资源的引用
        file.setData(
            require( '../util/replace-tag-attribute' )(
                file.data,
                'link',
                'href',
                function ( value ) {
                    return value.replace(
                        /\.styl($|\?)/,
                        function ( match, q ) {
                            if ( q == '?' ) {
                                return '.css?';
                            }

                            return '.css';
                        }
                    );
                }
            )
        );

    }
    else if ( file.extname == 'js' ) {
        file.setData(
            require( '../util/replace-require-resource' )(
                file.data,
                'css',
                function ( resourceId ) {
                    return resourceId.replace( /\.styl$/, '.css' );
                }
            )
        );
    }

    callback();
};

module.exports = exports = StylusCompiler;


/**
 * 编译stylus
 *
 * @inner
 * @param {Stylus} stylus stylus模块.
 * @param {string} code stylus源代码.
 * @param {Object} parserOptions 解析器参数.
 * @param {function(string)} callback 编译完成回调函数.
 */
function compileStylusAsync( stylus, code, parserOptions, callback ) {
    stylus(code)
        .set('filename', parserOptions.pathname)
        .set('compress', !!parserOptions.compress)
        .set('paths', parserOptions.paths)
        .use(function( style ) {
            if ('function' === typeof parserOptions.use) {
                parserOptions.use( style );
            }
        })
        .render(function (err, css) {
            if ( err ) {
                callback( err );
            }
            else {
                callback( null, css );
            }
        });
}
