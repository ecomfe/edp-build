/**
 * @file Stylus编译的构建处理器
 * @author errorrik[errorrik@gmail.com]
 *         junmer[junmer@foxmail.com]
 */
var edp = require( 'edp-core' );
var array = require( '../util/array' );
var AbstractProcessor = require( './abstract' );

/**
 * Stylus编译的构建处理器
 *
 * @constructor
 * @param {Object} options 初始化参数
 * @param {string} options.entryExtnames 页面入口扩展名列表，`,`分隔的字符串
 */
function StylusCompiler( options ) {
    // 默认的入口文件配置
    this.entryFiles = [
        '*.html',
        '*.htm',
        '*.phtml',
        '*.tpl',
        '*.vm',
        '*.js'
    ];

    this.files = [ '*.styl' ];

    AbstractProcessor.call( this, options );

    // 兼容入口老配置`entryExtnames`
    // 建议使用`entryFiles`
    var entryExtnames = this.entryExtnames;
    if (entryExtnames) {
        if ( !Array.isArray( entryExtnames ) ) {
            entryExtnames = entryExtnames.split( /\s*,\s*/ );
        }

        this.entryFiles = array.list2pattern( entryExtnames );
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

};

/**
 * 构建处理后的行为，替换page和js里对stylus资源的引用
 * 
 * @param {ProcessContext} processContext 构建环境对象
 */
StylusCompiler.prototype.afterAll = function ( processContext ) {
    var entryFiles = processContext.getFilesByPatterns( this.entryFiles );
    if ( !Array.isArray( entryFiles ) ) {
        return;
    }

    entryFiles.forEach( function ( file ) {
        if ( file.extname === 'js' ) {
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
        else {
            // 替换页面入口文件对less资源的引用
            file.setData(
                require( '../util/replace-tag-attribute' )(
                    file.data,
                    'link',
                    'href',
                    function ( value ) {
                        return value.replace(
                            /\.styl($|\?)/,
                            function ( match, q ) {
                                if ( q === '?' ) {
                                    return '.css?';
                                }

                                return '.css';
                            }
                        );
                    }
                )
            );
        }
    });
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
