/**
 * @file 静态文件MD5重命名处理器
 * @author errorrik[errorrik@gmail.com]
 */
var edp = require( 'edp-core' );
var AbstractProcessor = require( './abstract' );

/**
 * 静态文件MD5重命名处理器
 *
 * @constructor
 * @param {Object} options 初始化参数
 */
function MD5Renamer( options ) {
    if ( options.hasOwnProperty( 'start' ) ) {
        options[ 's' ] = options[ 'start' ];
        delete options[ 'start' ];
    }

    if ( options.hasOwnProperty( 'end' ) ) {
        options[ 'e' ] = options[ 'end' ];
        delete options[ 'end' ];
    }

    options = edp.util.mix( {
        files: [],

        /**
         * md5的开始位置
         * @type {number}
         */
        s: 0,

        /**
         * md5的结束位置
         * @type {number}
         */
        e: 8,

        /**
         * 用来描述替换的规则
         * @type {{html:Array.<string>,css:Array.<string>}}
         */
        replacements: {},

        /**
         * 输出文件名的默认模板，支持
         * {basename} {md5sum} {extname}
         * @type {string}
         */
        outputTemplate: '{md5sum}{extname}'
    }, options );
    AbstractProcessor.call( this, options );
}
MD5Renamer.prototype = new AbstractProcessor();

/**
 * 处理器名称
 *
 * @type {string}
 */
MD5Renamer.prototype.name = 'MD5Renamer';

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
    if ( !edp.path.isLocalPath( value ) ) {
        // 代码中的绝对路径不做替换
        return value;
    }

    // var resRelativePath = value;
    // var abspaths = replaceOption.abspaths || {};
    // if ( !edp.path.isRelativePath( value ) ) {
    //    // 处理绝对路径的替换?
    //    for ( var key in abspaths ) {
    //        var keyLen = key.length;
    //
    //        if ( value.indexOf( key ) === 0
    //            && ( value.length == keyLen || value[ keyLen ] == '/' )
    //        ) {
    //            resRelativePath = value.replace( key, abspaths[ key ] );
    //            break;
    //        }
    //    }
    // }

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
        var lookupFile = edp.path.join( lookupPath, resPath );
        var lookupFileInfo = processContext.getFileByPath( lookupFile );

        if ( lookupFileInfo ) {
            if ( processMD5Rename( lookupFileInfo, processor ) ) {
                return replacePathByMD5( resPath,
                    lookupFileInfo.md5sum( processor.s, processor.e ),
                    processor.outputTemplate ) + (search || '');
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
        if ( typeof option === 'string' ) {
            option = {
                paths: [],
                file: option
            };
        }

        // replacements: {
        //   html: [ 'src/**/*.html', 'src/**/*.tpl' ]
        //   html: [
        //     { file: 'src/**/*.html', paths: [] },
        //     { file: 'src/**/*.tpl', paths: [] }
        //   ]
        // }
        if ( edp.path.satisfy( file.path, option.file, file.stat ) ) {
            var result = {
                paths: option.paths.slice( 0 ),
                file: option.file
            };

            return edp.util.extend( result, extraProps );
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
        file
    );

    if ( !replaceOption ) {
        return;
    }

    replaceOption.paths.push( edp.path.dirname( file.path ) );
    var replacer = function ( value ) {
        return replaceResPath( value, replaceOption,
            processor, processContext );
    };

    HTML_REPLACES.forEach(
        function ( replace ) {
            var replaceTagAttribute = require( '../util/replace-tag-attribute' );

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
        file
    );

    if ( !replaceOption ) {
        return;
    }

    replaceOption.paths.push( edp.path.dirname( file.path ) );
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

    var match = false;
    processor.files.some(function( pattern ){
        if ( edp.path.satisfy( file.path, pattern ) ) {
            match = true;
            return true;
        }
    });

    if ( match ) {
        file.outputPaths.push(
            replacePathByMD5(
                file.outputPath,
                file.md5sum( processor.s, processor.e ),
                processor.outputTemplate
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
 * @param {string} filePath 文件路径.
 * @param {string} md5 md5值.
 * @param {string} template 文件名的模板.
 * @return {string}
 */
function replacePathByMD5( filePath, md5, template ) {
    var extname = edp.path.extname( filePath );
    var original = edp.path.basename( filePath, extname );
    var dataMap = {
        basename: original,
        extname: extname,
        md5sum: md5
    };
    var file = template.replace( /{([^}]+)}/g, function( m, $1 ){
        return dataMap[ $1 ] || m;
    } );

    return edp.path.join( edp.path.dirname( filePath ), file );
}

module.exports = exports = MD5Renamer;
