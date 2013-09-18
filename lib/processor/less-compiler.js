/**
 * @file LESS编译的构建处理器
 * @author errorrik[errorrik@gmail.com]
 */

var AbstractProcessor = require( './abstract' );

/**
 * LESS编译的构建处理器
 * 
 * @constructor
 * @param {Object} options 初始化参数
 * @param {string} options.entryExtnames 页面入口扩展名列表，`,`分隔的字符串
 */
function LessCompiler( options ) {
    AbstractProcessor.call( this, options );

    // init entryExtnames
    var entryExtnames = {};
    var optExtnames = this.entryExtnames || [];
    if ( !(optExtnames instanceof Array) ) {
        optExtnames = optExtnames.split( /\s*,\s*/ );
    }
    optExtnames.forEach(
        function ( extname ) {
            entryExtnames[ extname ] = 1;
        }
    );
    this.entryExtnames = entryExtnames;
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
    if ( file.extname === 'less' ) {
        // 对less文件进行编译
        file.outputPath = file.outputPath.replace( /\.less$/, '.css' );
        processContext.addFileLink( file.path, file.outputPath );

        var parserOptions = require( '../util/extend' )( 
            {},
            {
                paths: [ require( 'path' ).dirname( file.fullPath ) ],
                relativeUrls: true
            },
            this.compileOptions || {}
        );

        try {
            compileLessAsync( 
                file.data, 
                parserOptions, 
                function ( error, compiledCode ) {
                    if ( error ) {
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
            file.outputPath = null;
            callback();
        }

        return;
    }
    else if ( this.entryExtnames[ file.extname ] ) {
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
                            if ( q == '?' ) {
                                return '.css?'
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
                    return resourceId.replace( /\.less$/, '.css' );
                }
            )
        );
    }

    callback();
};

module.exports = exports = LessCompiler;


/**
 * 编译less代码（异步）
 * 
 * @inner
 * @param {string} code less源代码
 * @param {Object} parserOptions 解析器参数
 * @param {function(string)} callback 编译完成回调函数
 */
function compileLessAsync( code, parserOptions, callback ) {
    // less没有提供sync api
    var less = require( 'less' );
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
                    callback( { message: 'toCSS fail' } )
                }
            }
        }
    );
};
