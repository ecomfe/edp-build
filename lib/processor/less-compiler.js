/**
 * @file LESS编译的构建处理器
 * @author errorrik[errorrik@gmail.com]
 */
var edp = require( 'edp-core' );
var array = require( '../util/array' );
var AbstractProcessor = require( './abstract' );

/**
 * LESS编译的构建处理器
 *
 * @constructor
 * @param {Object} options 初始化参数
 * @param {string} options.entryExtnames 页面入口扩展名列表，`,`分隔的字符串
 */
function LessCompiler( options ) {
    // 默认的入口文件配置
    this.entryFiles = [
        '*.html',
        '*.htm',
        '*.phtml',
        '*.tpl',
        '*.vm',
        '*.js'
    ];

    this.files = [ '*.less' ];

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

LessCompiler.prototype = new AbstractProcessor();

/**
 * 处理器名称
 *
 * @type {string}
 */
LessCompiler.prototype.name = 'LessCompiler';


/**
 * 构建处理
 *
 * @param {FileInfo} file 文件信息对象
 * @param {ProcessContext} processContext 构建环境对象
 * @param {Function} callback 处理完成回调函数
 */
LessCompiler.prototype.process = function ( file, processContext, callback ) {
    // 对less文件进行编译
    file.outputPath = file.outputPath.replace( /\.less$/, '.css' );
    processContext.addFileLink( file.path, file.outputPath );

    var parserOptions = edp.util.extend(
        {},
        {
            paths: [ require( 'path' ).dirname( file.fullPath ) ],
            relativeUrls: true,
            compress: true
        },
        this.compileOptions || {}
    );

    try {
        // this.less说明是从外部传递过来的，如果不存在，就用默认的
        compileLessAsync(
            this.less || require( 'less' ),
            file.data,
            parserOptions,
            function ( error, compiledCode ) {
                if ( error ) {
                    edp.log.warn('Compile less failed, ' +
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
        edp.log.fatal('Compile less failed, file = [%s], msg = [%s]',
            file.path, ex.toString());
        file.outputPath = null;
        callback();
    }
};

/**
 * 构建处理后的行为，替换page和js里对less资源的引用
 * 
 * @param {ProcessContext} processContext 构建环境对象
 */
LessCompiler.prototype.afterAll = function ( processContext ) {
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
                        return resourceId.replace( /\.less$/, '.css' );
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
                            /\.less($|\?)/,
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


module.exports = exports = LessCompiler;


/**
 * 编译less代码（异步）
 *
 * @inner
 * @param {Less} less lesscss模块
 * @param {string} code less源代码
 * @param {Object} parserOptions 解析器参数
 * @param {function(string)} callback 编译完成回调函数
 */
function compileLessAsync( less, code, parserOptions, callback ) {
    // less没有提供sync api
    var parser = new( less.Parser )( parserOptions );

    parser.parse(
        code,
        function ( error, tree ) {
            if ( error ) {
                callback( error );
            }
            else {
                try {
                    callback(
                        null,
                        tree.toCSS( {
                            compress: !!parserOptions.compress
                        } )
                    );
                }
                catch (ex) {
                    callback( ex );
                }
            }
        }
    );
}
