/**
 * @file manifest的构建处理器
 * @author duanlixin[duanlixin@gmail.com]
 */

var AbstractProcessor = require( './abstract' );
var pathSatisfy = require( '../util/path-satisfy' );
var path = require( '../util/path');

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

    var mapper = this.mapper = function ( value ) {
        // todo 是否有更好的方法
        return value.replace( from, to ).replace( /\.less$/, '.css' );
    }
    /**
     * 把源文件路径，替换为发布路径
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
        // fallback时，传入的是对象
        if ( 'object' == typeof value ) {
            var fallbackOutputPath = '';
            for( var key in value ) {
                fallbackOutputPath += mapper( value[ key ] ) + ' ';
            }
            return fallbackOutputPath;
        }

        return mapper(value);
    }
    // 被遍历文件总数
    this.fileCount = 0;
    // manifest文件数据对象
    var manifestInfo = this.manifestInfo = {};
    // 配置文件数组
    this.manifests = this.manifests || [];

    this.manifests.forEach( function ( option ) {
        var manifestName = option.manifestName;
        // 按manifest文件名，存入信息
        manifestInfo[ manifestName ] = {
            // 访问文件总数
            visitFilesCount: 0,
            version: null,
            cachePage: null,
            manifestName: null,
            js: [],
            css: [],
            image: [],
            cache: [],
            fallback: [],
            network: [],
            custom: []
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
ManifestCompiler.prototype.process = function ( file, processContext, callback ) {

    var _this = this;

    if( !this.fileCount ) {
        // 存入被遍历文件总数
        this.fileCount = processContext.getFiles().length;

    }

    this.manifests.forEach( function ( option ) {
        var manifestName = option.manifestName;
        var cachePage = option.cachePage;
        var cache = option.cache || [];
        var network = option.network || [];
        var fallback = option.fallback || [];
        var content = file.data;
        var outputPath = file.outputPath;
        var fullPath = file.fullPath;
        var manifestInfo = _this.manifestInfo[ manifestName ];
        var now = +new Date().getTime();
        // 缓存页面符合路径规则
        if ( cachePage && pathSatisfy( file.path, cachePage ) ) {
            // 给使用manifest的页面写入manifest属性
            file.setData( addManifestAttToCachePage( content, manifestName ) );
            // 在环境对象中加入manifest文件信息对象
            var fileDir = path.dirname( fullPath );
            var manifestFullPath = path.resolve( fileDir, manifestName );
            var fileData = require( '../util/manifest-tpl' )();
            require('../util/add-file-processcontext')(
                processContext,
                fileData,
                manifestFullPath
            );
            network = eachArray( network, _this.valueReplacer );
            fallback = eachArray( fallback, _this.valueReplacer );

            manifestInfo.version = now;
            manifestInfo.html = outputPath;
            manifestInfo.network = network;
            manifestInfo.fallback = fallback;
            manifestInfo.cachePage = cachePage;
            manifestInfo.manifestName = manifestName;

            // 若明确指定缓存资源
            if ( cache && cache.length > 0) {
                cache = eachArray( cache, _this.valueReplacer );
                manifestInfo.custom = cache;
                setResources( processContext , manifestName , manifestInfo );
            }
        }
        // 把页面用的js、css、image资源地址写入manifest文件
        if( cache.length == 0) {

            manifestInfo.visitFilesCount++;
            cacheAll( processContext, file, _this, manifestInfo );
        }
    } );

    callback();
}
/**
 * 给manifest文件中加入资源
 * 
 * @inner
 * {ProcessContext} processContext 构建环境对象
 * {string} manifestName manifest文件名
 * {string} manifestInfo manifest资源数据
 */
function setResources( processContext , manifestName , manifestInfo ) {
    var manifest = processContext.getFileByPath( manifestName );
    if( manifest ) {
        for( var key in manifestInfo ) {
            var value = manifestInfo[ key ];
            if( '[object Array]' == Object.prototype.toString.call( value ) ) {
                manifestInfo[ key ] = value.join( '\n' );
            }
        }
        var content = format( manifest.data, manifestInfo );
        manifest.setData( content );
    }
}

/**
 * 返回使用manifest页面的内容(已增加manifest属性)
 * 
 * @inner
 * @param {string} content 使用manifest页面的内容
 * @param {string} manifestName manifest的名字
 * @return {string} 返回使用manifest页面的内容(已增加manifest属性)
 */
function addManifestAttToCachePage( content, manifestName ) {
    var manifest = ' manifest="' + manifestName + '" ';
    if( content ) {
        return content.replace( /<html[^>]*/g, function ( match ) {
            return match + manifest;
        });
    }
}
/**
 * 把参数数组里的每个内容传递给func方法，把返回结果放进新的数组里
 * 
 * @inner
 * @param {array} arr 参数数组
 * @param {function} func 处理方法
 * @return {array} 返回使用处理后的数组
 */
function eachArray( arr, func ) {
    var result = [];
    arr.forEach( function ( item ) {
        result.push( func( item ) );
    } );
    return result;
}

/**
 * 分析页面，把页面用的js、css、image资源地址写入manifest文件
 * 
 * @param {FileInfo} file 文件信息对象
 * @param {ManifsetCompiler} processor ManifestCompiler处理器对象
 * @param {ProcessContext} processContext 构建环境对象
 * @param {Object} option manifest配置对象
 */
function cacheAll( processContext, file, processor, manifestInfo ) {
    var outputPath = file.outputPath;
    var cachePage = manifestInfo.cachePage;
    var manifestName = manifestInfo.manifestName;
    var content = file.data;
    if ( cachePage && pathSatisfy( file.path, cachePage ) ) {
        
        
        // 获取指定标签的属性值
        var getTagAttribute = require( '../util/get-tag-attribute' );
        // 获取页面script标签的src值
        var scripts = getTagAttribute(content , 'script', 'src' ); 
        // 读取页面中的require的config
        var confData = require( '../util/read-loader-config' )( content ).data;
        // 获取页面中require的模块id数组
        var requireIds = require( '../util/get-module-ids' )( content );

        var assetJsPath = eachArray( requireIds, function( item ) {
            // 把模块id转换成发布路径
            return moduleIdToOutputPath( item, confData );
        } );

        // 获取页面link标签的href值
        manifestInfo.css = getTagAttribute(content , 'link', 'href' );
        // 合并页面script标签的js资源和require的js资源
        manifestInfo.js = scripts.concat( assetJsPath );
    }
    if ( path.extname( outputPath ) == '.css' ) {

        manifestInfo.css.forEach( function ( href ) {
            if( outputPath === href ) {
                var baseDir = processContext.baseDir;
                var dir = path.dirname( outputPath );
                function replacer( url ) {
                    var fullPath = path.resolve( dir , url );
                    var assetPath = path.relative( baseDir, fullPath );
                    return assetPath;
                }
                var cssUrl = require( '../util/get-css-url' )( content );
                var image = eachArray( cssUrl, replacer );
                if( image.length > 0 ) {
                    Array.prototype.push.apply( manifestInfo.image , image );
                }
            }
        } );

    }
    // 在遍历所有文件后，把所有资源写入manifest文件中
    if ( manifestInfo.visitFilesCount == processor.fileCount ) {

        setResources( processContext , manifestName , manifestInfo );
    }
}
/**
 * 用数据对象填充的字符串
 * 
 * @param {string} source 模板字符串
 * @param {object} opts 数据对象
 * @return {string} 用数据对象填充的字符串
 */
function format( source, opts ) {
    source = String(source);

    return source.replace(/#\{(.+?)\}/g, function (match, key){
        var replacer = opts[ key ];
        return ('undefined' == typeof replacer ? '' : replacer);
    });
}
/**
 * 根据模块id，返回发布路径
 * 
 * @param {string} id 内容
 * @param {object} confData 配置文件json对象
 * @return {string} 发布路径
 */
function moduleIdToOutputPath( id, confData ) {
    var outputPath = path.join( confData.baseUrl, id );
    
    var paths = confData.paths || {};
    for ( var key in paths ) {
        if ( id === key) {
            outputPath = outputPath.replace( key, paths[ key ] );
        }
    }

    var packages = confData.packages || [];
    for ( var i = 0; i < packages.length; i++ ) {
        var pkg = packages[ i ];

        if ( id === pkg.name && typeof pkg === 'object' && pkg.location ) {
            outputPath = outputPath.replace( id , pkg.location );
            outputPath += '/' + pkg.main;
        }
    }

    if( outputPath.indexOf( '.js' ) == -1 ) {
        outputPath += '.js';
    }
    return outputPath;
}
module.exports = exports = ManifestCompiler;
