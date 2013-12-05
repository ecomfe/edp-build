/**
 * @file manifest的构建处理器
 * @author duanlixin[duanlixin@gmail.com]
 */

var AbstractProcessor = require( './abstract' );
var FileInfo = require( '../file-info' );
var pathSatisfy = require( '../util/path-satisfy' );
var path = require( '../util/path');
var fs = require( 'fs' );
var WRAP = '\n';

/**
 * manifest的构建处理器
 *
 * @constructor
 * @param {Object} options 初始化参数
 */
function ManifestCompiler( options ) {
    AbstractProcessor.call( this, options );

    var from = this.from = new RegExp( '(^|/)' + this.from + '(/|$)' );
    var to = this.to = function ( match, head, tail ) {
        return (head === '/' ? head : '') 
            + options.to
            + (tail === '/' ? tail : '');
    };

    if (typeof this.mapper != 'function') {
        this.mapper = function(value) {
            return value.replace( from, to );
        }
    }
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
ManifestCompiler.prototype.process = function ( file, processContext, callback ) {

    var _this = this;

    var mapper = this.mapper;

    /**
     * 值替换函数
     * 
     * @inner
     * @param {string} value 原始值
     * @return {string}
     */
    this.valueReplacer = function ( value ) {
        if ( !value ) {
            return '';
        }

        var isLocalPath = require( '../util/is-local-path' );
        if ( !isLocalPath( value ) ) {
            return value;
        }

        return mapper(value);
    }

    this.manifests.forEach( function ( option ) {
        // 是否指定缓存资源
        var cache = option.cache;
        
        if ( cache && cache.length > 0) {
            // 把指定缓存资源写入manifest文件
            cacheCustom( processContext, file, _this, option );
        }
        else {
            // 分析页面，把页面用的js、css、image资源地址写入manifest文件
            cacheAll( file, _this, processContext, option );
        }
    } );

    callback();
}

/**
 * 给manifest文件中增加资源
 * 
 * @inner
 * {array} arr 写入内容数组
 * {ProcessContext} processContext 构建环境对象
 * {string} path manifest文件路径
 * {string} sourceType 资源类型
 */
function setResources( processContext , path , sourceType, arr ) {

    var manifest = processContext.getFileByPath( path );
    if( manifest ) {
        var data = manifest.data.split( WRAP );
        var pos = data.indexOf( sourceType ) + 1;
        arr.forEach( function ( value ) {
            data.splice( pos , 0 , value );
            manifest.setData( data.join( WRAP ) );
        } );
    }
}
/**
 * 返回manifest的初始内容
 * 
 * @inner
 * @return {string}
 */
function createManifest() {
    var TPL = [
        'CACHE MANIFEST',
        '# version',
        '# html files',
        '# css files',
        '# images files',
        '# js files',
        '# custom',
        'FALLBACK:',
        'NETWORK:',
        '*'
    ].join( WRAP );

    return TPL;
}
/**
 * 在环境对象中加入manifest文件信息对象
 * 
 * @inner
 * {FileInfo} file 使用manifest页面的文件信息对象
 * {ProcessContext} processContext 构建环境对象
 * {string} name manifest的文件名
 * {string} page 使用manifest页面的文件名
 */
function addManifestToProcessContext( file, processContext, name, page ) {

    var fullPath = path.resolve( path.dirname( file.fullPath ) , name );
    var relativePath = path.relative( processContext.baseDir, fullPath );
    var extname = path.extname( fullPath ).slice( 1 );
    var fileData = new FileInfo( {
        data         : createManifest(),
        extname      : extname,
        path         : relativePath,
        fullPath     : fullPath,
        stat         : {},
        fileEncoding : null
    } );

    processContext.addFile( fileData );
}
/**
 * 返回使用manifest页面的内容(已增加manifest属性)
 * 
 * @inner
 * @param {string} content 使用manifest页面的内容
 * @param {string} name manifest的名字
 * @return {string} 返回使用manifest页面的内容(已增加manifest属性)
 */
function addManifestAttributeToPage( content, name ) {
    var manifest = ' manifest="' + name + '" ';
    if( content ) {
        return content.replace( /<html[^>]*/g, function ( match ) {
            return match + manifest;
        });
    }
}
/**
 * 把参数数组里的每个内容传递给func方法，把返回放进新的数组里
 * 
 * @inner
 * @param {array} arr 参数数组
 * @param {function} func 处理方法
 * @return {array} 返回使用处理后的数组
 */
function inputPathToOupput( arr, func ) {
    var result = [];
    arr.forEach( function ( item ) {
        result.push( func( item ) );
    } );
    return result;
}
/**
 * 把指定缓存资源写入manifest文件
 *
 * @inner
 * @param {ProcessContext} processContext 构建环境对象
 * @param {FileInfo} file 文件信息对象
 * @param {ManifsetCompiler} processor ManifestCompiler处理器对象
 * @param {Object} option manifest配置对象
 */
function cacheCustom( processContext, file, processor, option ) {

    var page = option.page;
    var outputPath = file.outputPath;
    if ( page && pathSatisfy( file.path, page ) ) {
        var name = option.name;
        var cache = option.cache;
        var network = option.network || [];
        var fallback = option.fallback || [];
        var now = +new Date().getTime();
        var content = file.data;
        // 给html标签加manifest属性
        file.setData( addManifestAttributeToPage( content, name ) );
        // 在环境对象中加入manifest文件信息对象
        addManifestToProcessContext( file, processContext, name, page );

        cache = inputPathToOupput( cache, processor.valueReplacer );
        network = inputPathToOupput( network, processor.valueReplacer );
        fallback = inputPathToOupput( fallback, function ( item ) {
            var fail = item.fail;
            var backup = item.backup;
            var fallbackPath = ''
                             + processor.valueReplacer( fail )
                             + ' '
                             + processor.valueReplacer( backup );
            return fallbackPath;
        });

        setResources( processContext , name , '# version', [ '# ' + now ] );
        setResources( processContext , name , '# html files', [ outputPath ] );
        setResources( processContext , name , '# custom', cache);
        setResources( processContext , name , 'NETWORK:', network);
        setResources( processContext , name , 'FALLBACK:', fallback );
    }
}
/**
 * 分析页面，把页面用的js、css、image资源地址写入manifest文件
 * 
 * @param {FileInfo} file 文件信息对象
 * @param {ManifsetCompiler} processor ManifestCompiler处理器对象
 * @param {ProcessContext} processContext 构建环境对象
 * @param {Object} option manifest配置对象
 */
function cacheAll( file, processor, processContext, option ) {
    var page = option.page;
    var outputPath = file.outputPath;
    var name = option.name;
    if ( page && pathSatisfy( file.path, page ) ) {
        var now = +new Date().getTime();
        var cache = option.cache || [];
        var network = option.network || [];
        var fallback = option.fallback || [];
        
        var content = file.data;
        var cacheFiles = require( '../util/get-cache-url' )( content );

        var scriptTagList = cacheFiles.scriptTagList;
        var requireJsList = cacheFiles.requireJsList;
        var cssFiles = processor.linkTagList = cacheFiles.linkTagList;

        // console.log(network, processContext.getFileByPath( 'src/file2.js' ))
        // 给使用manifest的页面写入manifest属性
        file.setData( addManifestAttributeToPage( content, name ) );
        // 在环境对象中加入manifest文件信息对象
        addManifestToProcessContext( file, processContext , name , page);

        cache = inputPathToOupput( cache, processor.valueReplacer );
        network = inputPathToOupput( network, processor.valueReplacer );
        fallback = inputPathToOupput( fallback, function ( item ) {
            var fail = item.fail;
            var backup = item.backup;
            var fallbackPath = ''
                             + processor.valueReplacer( fail )
                             + ' '
                             + processor.valueReplacer( backup );
            return fallbackPath;
        });

        var readLoaderConfig = require( '../util/read-loader-config' );
        var replaceIdOutputPath = require( '../util/replace-id-outputpath' );
        var confData = readLoaderConfig( content ).data;

        requireJsList = inputPathToOupput( requireJsList, function( item ) {
            var outputPath = replaceIdOutputPath( item, confData );
            return outputPath;

        } );

        setResources( processContext , name , '# version', [ '# ' + now ] );
        setResources( processContext , name , 'NETWORK:', network);
        setResources( processContext , name , 'FALLBACK:', fallback );
        setResources( processContext , name , '# css files', cssFiles );
        setResources( processContext , name , '# html files', [ outputPath ] );
        setResources( processContext , name , '# js files', scriptTagList );
        setResources( processContext , name , '# js files', requireJsList );

    }
    if ( path.extname( outputPath ) == '.css' ) {
        processor.linkTagList.forEach( function ( csspath ) {
            if( outputPath === csspath ) {
                var urls = file.data.match( /url\s*\(([^\)]*)\)/g ) || [];
                var baseDir = processContext.baseDir;
                var imgs = inputPathToOupput( urls, function ( item ) {
                    var imageName = item.match( /\((.*)\)/ )[ 1 ];
                    var dir = path.dirname( outputPath );
                    var imagePath = path.resolve(dir , imageName );
                    imagePath = path.relative( baseDir, imagePath );
                    return imagePath;

                } );
                setResources( processContext , name , '# images files', imgs );
            }
        } );
     }
}
module.exports = exports = ManifestCompiler;
