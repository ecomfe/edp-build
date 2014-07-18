/**
 * @file manifest的构建处理器
 * @author duanlixin[duanlixin@gmail.com]
 */

var AbstractProcessor = require( './abstract' );
var edp = require( 'edp-core' );

/**
 * manifest的构建处理器
 *
 * @constructor
 * @param {Object} options 初始化参数
 */
function ManifestCompiler( options ) {
    AbstractProcessor.call( this, options );

    // 配置文件数组
    this.manifests = this.manifests || [];
    // 遍历文件总数
    this.fileCount = 0;
    // 遍历文件计数器
    this.visitCount = 0;
    // module配置文件
    this.configFile = this.configFile || 'module.conf';
    // manifest数据对象
    var manifestInfo = this.manifestInfo = {};
    // manifest数据对象设置初值
    this.manifests.forEach( function ( option ) {
        // 按manifest文件名，存入信息
        manifestInfo[ option.cachePage ] = {
            cachePage: option.cachePage,
            autoCache: option.autoCache === false ? false: true,
            prefixPath: option.prefixPath,
            relativePath: null,
            fullPath: null,
            moduleSource: [],

            manifestName: option.manifestName,
            version: null,
            cache: option.cache || [],
            fallback: option.fallback || [],
            network: option.network || [],
            html: [],
            image: [],
            css: [],
            cssurl: [],
            script: [],
            module: []
        };
    } );
}


ManifestCompiler.prototype = new AbstractProcessor();

/**
 * 处理器名称
 *
 * @type {string}
 */
ManifestCompiler.prototype.name = 'ManifestCompiler';

/**
 * 构建处理
 *
 * @param {FileInfo} file 文件信息对象
 * @param {ProcessContext} processContext 构建环境对象
 * @param {Function} callback 处理完成回调函数
 */
ManifestCompiler.prototype.process =
    function ( file, processContext, callback ) {
    var _this = this;

    if ( !this.fileCount ) {
        this.fileCount = processContext.getFiles().length;
    }
    this.visitCount++;
    var manifestInfo = this.manifestInfo;
    // 遍历配置文件
    this.manifests.forEach( function ( manifestData, index ) {
        // 缓存页面或规则
        var cachePage = manifestData.cachePage;
        // 判断路径片段是否满足规则
        if ( edp.path.satisfy( file.path, cachePage ) ) {
            // 缓存页面目录路径，manifest文件与缓存页面在相同目录下
            var fileDir = edp.path.dirname( file.fullPath );
            var fullPath = edp.path.resolve( fileDir,
                manifestData.manifestName );
            var baseDir = processContext.baseDir;
            var relativePath = edp.path.relative( baseDir , fullPath );
            var manifest = manifestInfo[ cachePage ];

            manifest.version = +new Date().getTime();
            manifest.relativePath = relativePath;
            manifest.fullPath = fullPath;

            if ( manifest.autoCache === true ) {

                var resourceData = getPageResource( file, _this.configFile );

                for( var resType in resourceData ) {
                    var value = resourceData[ resType ];
                    pushArraytoArray( manifest[ resType ], value );
                }
            }

            var content = getCachePage( file.data, manifestData.manifestName );
            // 给缓存页面加入manifest属性和manifest文件路径
            file.setData( content );
            // 文件完全匹配时，在数据中删除该数据，防止与路径匹配时重复
            if( file.path === cachePage ) {
                _this.manifests.splice( index, 1 );
            }
        }
    } );
    // 在遍历所有文件后，把所有资源写入manifest文件中
    if ( this.visitCount === this.fileCount ) {

        var relativePaths = Object.keys( processContext.files );

        relativePaths.forEach( function ( relativePath ) {

            for ( var key in manifestInfo ) {

                var manifest = manifestInfo[ key ];
                var module = getModlueOutputPath(
                    processContext,
                    relativePath,
                    manifest.moduleSource
                );
                pushArraytoArray( manifest.module, module );

                var cssurl = getCssUrlPath(
                    processContext,
                    relativePath,
                    manifest.css
                );
                pushArraytoArray( manifest.cssurl, cssurl );
            }
        } );

        for ( var key in manifestInfo ) {

            var manifest = manifestInfo[ key ];
            addFileToProcessContext( processContext, manifest.fullPath );
            setResources( processContext, manifest.relativePath, manifest );
        }
    }

    callback();
};
/**
 * 数组(目标数组)中添加数组(源数组)
 *
 * @inner
 * @param {array} target 目标数组
 * @param {array} source 源数组
 */
function pushArraytoArray( target, source ) {
    Array.prototype.push.apply( target, source );
}
/**
 * 返回缓存资源:html、css、image、script标签、require的模块id的全路径
 *
 * @inner
 * @param {FileInfo} file 文件信息对象
 * @param {string} configFile module配置文件
 * @return {object} 缓存资源对象
 */
function getPageResource( file, configFile ) {
    var content = file.data;
    // 获取模块id数组
    var moduleIds = getModuleIds( content );
    // module文件全路径数组
    var moduleSource = [];
    moduleIds.forEach( function( item ) {
        var moduleFullpath = edp.amd.getModuleFile( item , configFile );
        moduleSource.push( moduleFullpath );
    } );
    // 获取标签的属性值
    var getTagAttributes = require( '../util/get-tag-attribute' );

    return {
        html: [ file.outputPath ],
        css: getTagAttributes( content , 'link', 'href' ),
        image: getTagAttributes( content , 'img', 'src' ),
        script: getTagAttributes( content , 'script', 'src' ),
        moduleSource: moduleSource
    };
}
/**
 * 去除数组中重复的元素
 *
 * @inner
 * @param {array} arr 数组对象
 * @return {array} 去重后的数组对象
 */
function uniqueArray ( arr ) {
    var result = [];

    arr.forEach( function( item ) {
        if ( result.indexOf( item, result ) === -1 ) {
            result.push( item );
        }
    } );

    return result;
}
/**
 * 给数组中的路径增加前缀
 *
 * @inner
 * @param {array} arr 发布路径数组
 * @param {string} prefixPath 路径前缀
 * @return {array} 返回增加前缀后的路径数组
 */
function addPrefixToOutputPath ( arr, prefixPath ) {
    var result = [];

    if ( prefixPath ) {
        arr.forEach( function( item ) {
            result.push( edp.path.join( prefixPath, item ) );
        } );
    }

    return result;
}
/**
 * 返回模块文件的发布路径
 *
 * @inner
 * @param {ProcessContext} processContext 构建环境对象
 * @param {string} relativePath 文件路径，相对于构建目录
 * @param {array} module 模块文件完整路径数组
 * @return {array} 模块文件的发布路径数组
 */
function getModlueOutputPath ( processContext, relativePath, module ) {
    var result = [];
    var file = processContext.getFileByPath( relativePath );

    module.forEach( function ( item ) {
        if ( file && item === file.fullPath ) {
            result.push( file.outputPath );
        }
    } );

    return result;
}

/**
 * 返回css文件中url资源的发布地址
 *
 * @inner
 * @param {ProcessContext} processContext 构建环境对象
 * @param {string} relativePath 文件路径，相对于构建目录
 * @param {array} arr css文件发布路径数组
 * @return {array} css文件中url资源的发布地址
 */
function getCssUrlPath ( processContext, relativePath, css ) {
    var result = [];
    var file = processContext.getFileByPath( relativePath );
    var baseDir = processContext.baseDir;
    var dir = edp.path.dirname( file.outputPath );

    css.forEach( function ( item ) {
        if ( file && edp.path.satisfy( item, file.outputPath ) ) {
            var cssUrl = require( '../util/get-css-url' )( file.data );

            cssUrl.forEach( function ( item ) {
                var fullPath = edp.path.resolve( dir , item );
                var url = edp.path.relative( baseDir, fullPath );

                result.push( url );
            });
        }
    } );

    return result;
}
/**
 * 用数据对象填充模板，返回字符串
 *
 * @inner
 * @param {string} source 模板字符串
 * @param {object} opts 数据对象
 * @return {string} 用数据对象填充的字符串
 */
function format( source, opts ) {
    source = String( source );
    return source.replace( /#\{(.+?)\}/g, function ( match, key ) {
        var replacer = opts[ key ];
        return ( 'undefined' === typeof replacer ? '' : replacer );
    });
}
/**
 * 返回缓存页面的内容(已增加manifest属性以及manifest文件路径)
 *
 * @inner
 * @param {string} content 使用manifest页面的内容
 * @param {string} manifestName manifest的名字
 * @return {string} 缓存页面的内容(已增加manifest属性以及manifest文件路径)
 */
function getCachePage( content, manifestName ) {
    var manifest = ' manifest="' + manifestName + '" ';
    if( content ) {
        return content.replace( /<html[^>]*/g, function ( match ) {
            return match + manifest;
        });
    }
}

/**
 * 把文件信息对象加入环境对象中
 *
 * @inner
 * @param {ProcessContext} processContext 构建环境对象
 * @param {string} fullPath 文件的全路径
 */
function addFileToProcessContext( processContext, fullPath ) {
    var relativePath = edp.path.relative( processContext.baseDir, fullPath );
    var extname = edp.path.extname( fullPath ).slice( 1 );
    var FileInfo = require( '../file-info' );
    var fileEncodings = processContext.fileEncodings;
    var fileEncoding = null;

    for ( var encodingPath in fileEncodings ) {
        if ( edp.path.satisfy( relativePath, encodingPath ) ) {
            fileEncoding = fileEncodings[ encodingPath ];
            break;
        }
    }

    var fileData = new FileInfo( {
        data         : '',
        extname      : extname,
        path         : relativePath,
        fullPath     : fullPath,
        stat         : {},
        fileEncoding : fileEncoding
    } );

    processContext.addFile( fileData );
}
// manifest 模板文件
var manifestTpl = [
    'CACHE MANIFEST',
    '# manifestName #{manifestName}',
    '# version  #{version}',
    'CACHE:',
    '# cache',
    '#{cache}',
    '# html files',
    '#{html}',
    '# image files',
    '#{image}',
    '# css files',
    '#{css}',
    '# cssurl files',
    '#{cssurl}',
    '# script files',
    '#{script}',
    '# module files',
    '#{module}',
    'FALLBACK:',
    '#{fallback}',
    'NETWORK:',
    '*',
    '#{network}'
].join( '\n' );
// manifest文件中的数组对象
var manifestArrayKeys = [
    'html',
    'css',
    'cssurl',
    'image',
    'script',
    'module',
    'cache',
    'fallback',
    'network'
];
// manifest文件中可能加前缀的数组对象
var prefixPathTypes = [
    'html',
    'cssurl',
    'module'
];
/**
 * 给manifest文件中加入资源
 *
 * @inner
 * @param {ProcessContext} processContext 构建环境对象
 * @param {string} manifestName manifest文件名
 * @param {object} data manifest资源数据
 */
function setResources( processContext , manifestName, data ) {

    var manifest = processContext.getFileByPath( manifestName );

    if( manifest ) {
        for( var key in data ) {
            var value = data[ key ];
            if( manifestArrayKeys.indexOf( key ) !== -1 &&
                Array.isArray( value ) ) {

                value = uniqueArray( value );
                prefixPathTypes.indexOf( key ) !== -1 &&
                ( value = addPrefixToOutputPath( value, data.prefixPath ) );
                data[ key ] = value.join( '\n' );
            }
        }
        var content = format( manifestTpl, data );
        manifest.setData( content );
    }
}

/**
 * 返回内容中module id数组
 *
 * @param {string} content 内容
 * @return {array} module id数组
 */
function getModuleIds ( content ) {

    var codeFragment = content.match( /require\s*\(\s*\[([^\]]*)\]/g ) || [];
    var result = [];

    codeFragment.forEach( function ( content ) {
        pushArraytoArray( result , readModuleId( content ).data );
    } );

    return result;

}
/**
 * 从内容中读取module id
 *
 * @param {string} content 内容
 * @return {Object}
 */
function readModuleId( content ) {
    var outputInfo = {};
    var index = content.search( /(require\s*\(\s*\[)/ );
    if ( index < 0 ) {
        return;
    }

    index += RegExp.$1.length - 1;

    // 取文件内容
    outputInfo.content = content;

    // 查找require module id的开始和结束位置
    var len = content.length;
    var braceLevel = 0;
    outputInfo.fromIndex = index;
    do {
        switch ( content[ index ] ) {
            case '[':
                braceLevel++;
                break;
            case ']':
                braceLevel--;
                break;
        }

        index++;
    } while ( braceLevel && index < len );
    outputInfo.toIndex = index;

    // 取配置数据
    content = content.slice( outputInfo.fromIndex, index );
    outputInfo.data = eval( '(' + content + ')' );    // jshint ignore:line

    return outputInfo;
}



module.exports = exports = ManifestCompiler;
