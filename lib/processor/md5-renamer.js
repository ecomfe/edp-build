/**
 * @file 静态文件MD5重命名处理器
 * @author errorrik[errorrik@gmail.com]
 */

var AbstractProcessor = require( './abstract' );

/**
 * 静态文件MD5重命名处理器
 * 
 * @constructor
 * @param {Object} options 初始化参数
 */
function MD5Renamer( options ) {
    AbstractProcessor.call( this, options );
    this.files = this.files || [];
    this.start = this.start || 0;
    this.end = this.end || 8;
}


MD5Renamer.prototype = new AbstractProcessor();

/**
 * 处理器名称
 * 
 * @type {string}
 */
MD5Renamer.prototype.name = 'MD5Renamer';

var pathSatisfy = require( '../util/path-satisfy' );
var isRelativePath = require( '../util/is-relative-path' );
var replaceTagAttribute = require( '../util/replace-tag-attribute' );
var crypto = require( 'crypto' );
var path = require( '../util/path' );

/**
 * 构建处理
 * 
 * @param {FileInfo} file 文件信息对象
 * @param {ProcessContext} processContext 构建环境对象
 * @param {Function} callback 处理完成回调函数
 */
MD5Renamer.prototype.process = function ( file, processContext, callback ) {
    processMD5Rename( file, this );
    processHTMLReplace( file, this, processContext );
    processCSSReplace( file, this, processContext );

    callback();
};

/**
 * 资源路径替换函数
 * 
 * @inner
 * @param {string} value 资源路径的值
 * @param {Object} replaceOption 替换参数
 * @param {MD5Renamer} processor MD5Renamer处理器对象
 * @param {ProcessContext} processContext 构建环境对象
 * @return {string}
 */
function replaceResPath( value, replaceOption, processor, processContext ) {
    var resRelativePath = value;
    var abspaths = replaceOption.abspaths || {};

    if ( !isRelativePath( value ) ) {
        for ( var key in abspaths ) {
            var keyLen = key.length;

            if ( value.indexOf( key ) === 0 
                && ( value.length == keyLen || value[ keyLen ] == '/' )
            ) {
                resRelativePath = value.replace( key, abspaths[ key ] );
                break;
            }
        }
    }

    var search = '';
    var resPath = value;
    var indexOfQuestion = value.indexOf( '?' );
    if ( indexOfQuestion > 0 ) {
        search = value.slice( indexOfQuestion );
        resPath = value.slice( 0, indexOfQuestion );
    }

    var lookupPaths = replaceOption.paths;
    for ( var i = 0; i < lookupPaths.length; i++ ) {
        var lookupPath = lookupPaths[ i ];
        var lookupFile = path.join( lookupPath, resPath );
        var lookupFileInfo = processContext.getFileByPath( lookupFile );

        if ( lookupFileInfo ) {
            if ( processMD5Rename( lookupFileInfo, processor ) ) {
                return replacePathByMD5( resPath, md5sum( lookupFileInfo ) )
                    + (search || '');

            }

            return value;
        }
    }

    return value;
}

/**
 * html替换的标签与属性配置表
 * 
 * @const
 * @type {Array}
 */
var HTML_REPLACES = [
    { tag: 'link', attribute: 'href' },
    { tag: 'img', attribute: 'src' },
    { tag: 'script', attribute: 'src' }
];


/**
 * 查找资源路径替换的替换参数
 * 
 * @inner
 * @param {Array} filesOptions 资源路径替换参数表
 * @param {FileInfo} file 文件信息对象
 * @param {Object} extraProps 额外的参数属性，用于附加全局配置参数
 * @return {Object}
 */
function searchReplaceOption( filesOptions, file, extraProps ) {
    filesOptions = filesOptions || [];

    for ( var i = 0; i < filesOptions.length; i++ ) {
        var option = filesOptions[ i ];
        if ( typeof option == 'string' ) {
            option = {
                paths: [],
                file: option
            };
        }

        if ( pathSatisfy( file.path, option.file, file.stat ) ) {
            var result = {
                paths: option.paths.slice( 0 ),
                file: option.file
            };

            for ( var key in extraProps ) {
                result[ key ] = extraProps[ key ];
            }

            return result;
        }
    }

    return null;
}


/**
 * 处理HTML中的资源路径替换
 * 
 * @inner
 * @param {FileInfo} file 文件信息对象
 * @param {[type]} processor MD5Renamer处理器对象
 * @param {ProcessContext} processContext 构建环境对象
 */
function processHTMLReplace( file, processor, processContext ) {
    var replacements = processor.replacements || {};
    var replaceOption = searchReplaceOption(
        replacements.html,
        file,
        { abspaths: replacements.abspaths }
    );

    if ( !replaceOption ) {
        return;
    }

    replaceOption.paths.push( path.dirname( file.path ) );
    var replacer = function ( value ) {
        return replaceResPath( value, replaceOption, processor, processContext );
    };

    HTML_REPLACES.forEach(
        function ( replace ) {
            var data = replaceTagAttribute(
                file.data,
                replace.tag,
                replace.attribute,
                replacer
            );

            file.setData( data );
        }
    );
}


/**
 * 处理CSS中的资源路径替换
 * 
 * @inner
 * @param {FileInfo} file 文件信息对象
 * @param {[type]} processor MD5Renamer处理器对象
 * @param {ProcessContext} processContext 构建环境对象
 */
function processCSSReplace( file, processor, processContext ) {
    var replacements = processor.replacements || {};
    var replaceOption = searchReplaceOption(
        replacements.css,
        file,
        { abspaths: replacements.abspaths }
    );
    
    if ( !replaceOption ) {
        return;
    }

    replaceOption.paths.push( path.dirname( file.path ) );
    var data = file.data.replace( 
        /url\(([^\)]+)\)/g, 
        function ( match, url ) {
            var start = url[ 0 ];
            if ( /^['"]/.test( start ) ) {
                url = url.slice( 1, url.length - 1 );
            }
            else {
                start = '';
            }

            url = start 
                + replaceResPath(url, replaceOption, processor, processContext)
                + start;

            return 'url(' + url + ')';
        }
    );
    file.setData( data );
}

/**
 * 处理文件的md5重命名
 * 
 * @inner
 * @param {FileInfo} file 文件信息对象
 * @param {[type]} processor MD5Renamer处理器对象
 * @return {boolean} 该文件是否处理
 */
function processMD5Rename( file, processor ) {
    if ( file.get( 'md5renamed' ) ) {
        return true;
    }

    if ( pathSatisfies( file, processor.files ) ) {
        file.outputPaths.push(
            replacePathByMD5( 
                file.outputPath, 
                md5sum( file, processor.start, processor.end )
            )
        );

        file.set( 'md5renamed', 1 );
        return true;
    }

    return false;
}

/**
 * 替换文件路径里的文件名为md5值
 * 
 * @inner
 * @param {string} filePath 文件路径
 * @param {string} md5 md5值
 * @return {string}
 */
function replacePathByMD5( filePath, md5 ) {
    return path.join(
        path.dirname( filePath ),
        md5 + path.extname( filePath )
    );
}

/**
 * 判断一个文件的路径是否能在一个匹配表里被匹配
 * 
 * @inner
 * @param {FileInfo} file 文件信息对象
 * @param {Array} paths 进行比对匹配的文件列表
 * @return {boolean}
 */
function pathSatisfies( file, paths ) {
    var satisfy = false;
    paths.forEach( 
        function ( path ) {
            satisfy = satisfy || pathSatisfy( file.path, path, file.stat );
        }
    );

    return satisfy;
}

/**
 * 对FileInfo对象进行md5sum
 * 
 * @inner
 * @param {FileInfo} file 文件信息对象
 * @return {string} 
 */
function md5sum( file, start, end ) {
    var result = file.get( 'md5sum' );
    if ( result ) {
        return result;
    }

    start = start || 0;
    end = end || 32;

    var md5 = crypto.createHash( 'md5' );
    md5.update( file.getDataBuffer() );
    result = md5.digest( 'hex' ).slice( start, end );
    file.set( 'md5sum', result );

    return result;
}

module.exports = exports = MD5Renamer;
