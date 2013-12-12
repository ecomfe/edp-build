/**
 * @file manifest的构建处理器
 * @author duanlixin[duanlixin@gmail.com]
 */

var AbstractProcessor = require( './abstract' );
var pathSatisfy = require( '../util/path-satisfy' );
var path = require( '../util/path');

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

    this.visitCount = 0;
    // module配置文件路径
    this.configFile = this.configFile || 'module.conf';

    this.data = {};

    // manifest文件数据对象
    var manifestInfo = this.manifestInfo = {};
    // 给manifest文件数据对象设置初值
    this.manifests.forEach( function ( option ) {
        // 按manifest文件名，存入信息
        manifestInfo[ option.cachePage ] = {
            cachePage: option.cachePage,
            manifestName: option.manifestName,
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
    // console.log(manifestInfo)
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

    if ( !this.fileCount ) {
        // 存入遍历文件总数
        this.fileCount = processContext.getFiles().length;
    }
    // console.log(file.outputPath)
    // 遍历文件计数器自增
    this.visitCount++;
    var manifestInfo = this.manifestInfo;
    // 遍历配置文件
    this.manifests.forEach( function ( manifestData ) {
        var cachePage = manifestData.cachePage;
        var manifestName = manifestData.manifestName;

        if ( pathSatisfy( file.path, cachePage ) ) {
                if( file.path == cachePage ) {
                    _this.data[cachePage] = {};
                    extend( _this.data[ cachePage ], manifestInfo[ cachePage ] );
                    _this.data[ cachePage ].html.push( file.outputPath );
                    _this.data[ cachePage ].version = +new Date().getTime();
                    var content = file.data;
                    var cache = manifestInfo[ cachePage ].cache;
                    if( cache.length == 0) {
                        var resourceData = getResource( content, _this.configFile );

                        _this.data[ cachePage ].css = resourceData.css;
                        _this.data[ cachePage ].image = resourceData.image;
                        _this.data[ cachePage ].script = resourceData.script;
                        _this.data[ cachePage ].module = resourceData.module;
                    }
                    // 缓存页面目录路径
                    var fileDir = path.dirname( file.fullPath );
                    // manifest文件全路径
                    var manifestFullPath = path.resolve( fileDir, manifestName );

                    var relativePath = path.relative( processContext.baseDir , manifestFullPath );
                    _this.data[ cachePage ].relativePath = relativePath;
                    _this.data[ cachePage ].manifestFullPath = manifestFullPath;

                    // 给缓存页面的html标签增加manifest属性
                    file.setData( addManifestAttToCachePage( content, manifestName ) );
                    delete manifestInfo[ cachePage ];
                }
                else {
                    if( manifestInfo[cachePage] ) {
                        _this.data[ cachePage ] = {};
                        extend( _this.data[ cachePage ], manifestInfo[ cachePage ] );
                        _this.data[ cachePage ].html.push( file.outputPath );
                        _this.data[ cachePage ].version = +new Date().getTime();
                        var content = file.data;
                        var cache = manifestInfo[ cachePage ].cache;
                        if( cache.length == 0) {
                            var resourceData = getResource( content, _this.configFile );
                            Array.prototype.push.apply(_this.data[ cachePage ].css,resourceData.css);
                            Array.prototype.push.apply(_this.data[ cachePage ].image,resourceData.image);
                            Array.prototype.push.apply(_this.data[ cachePage ].script,resourceData.script);
                            Array.prototype.push.apply(_this.data[ cachePage ].module,resourceData.module);
                        }
                        // 缓存页面目录路径
                        var fileDir = path.dirname( file.fullPath );
                        // manifest文件全路径
                        var manifestFullPath = path.resolve( fileDir, manifestName );

                        var relativePath = path.relative( processContext.baseDir , manifestFullPath );
                        _this.data[ cachePage ].relativePath = relativePath;
                        _this.data[ cachePage ].manifestFullPath = manifestFullPath;
                        // 给缓存页面的html标签增加manifest属性
                        file.setData( addManifestAttToCachePage( content, manifestName ) );
                    }
                }
                

        }
    } );
    // 在遍历所有文件后，把所有资源写入manifest文件中
    if ( this.visitCount === this.fileCount ) {



        var relativePaths = Object.keys( processContext.files );
        // var customMapper = [];
        // var moduleMapper = [];

        relativePaths.forEach( function ( relativePath ) {
            // console.log(relativePath);
            for (var key in _this.data) {
                var manifest = _this.data[ key ];
                var module = manifest.module;
                pathMappermodule( 
                    processContext, 
                    relativePath, 
                    module 
                );
                Array.prototype.push.apply( 
                    manifest.cssurl, 
                    pathMapperCssUrl( 
                        processContext, 
                        relativePath, 
                        manifest.css 
                    ) 
                );
            }

        } );
         for (var key in _this.data) {
            var manifest = _this.data[ key ];
            manifest.image = uniqueArray(manifest.image);
            manifest.css = uniqueArray(manifest.css);
            manifest.cssurl = uniqueArray(manifest.cssurl);
            manifest.script = uniqueArray(manifest.script);
            manifest.module = uniqueArray(manifest.module);
            addFileToProcessContext( processContext, manifest.manifestFullPath );
            setResources( processContext , manifest.relativePath , manifest );
        }
    }

    callback();
};
/**
 * 获取页面资源，css、image、js(页面标签和require的模块)
 * 
 * @param {string} content 缓存页面内容
 * @param {string} configFile module配置文件路径
 * @return {object} 资源对象
 */
function getResource( content, configFile ) {
    // 获取模块id数组
    var moduleIds = require( '../util/get-module-ids' )( content );
    var getModuleFile = require( '../util/get-module-file' );
    // module文件全路径数组
    var module = [];
    moduleIds.forEach( function( item ) {
        var moduleFullpath = getModuleFile( item , configFile );
        module.push( moduleFullpath );
    } );

    // 获取标签的属性值
    var getTagAttributes = require( '../util/get-tag-attribute' );
    return {
        css: getTagAttributes( content , 'link', 'href' ),
        image: getTagAttributes( content , 'img', 'src' ),
        script: getTagAttributes( content , 'script', 'src' ),
        module: module
    };
}
/**
 * 数组去重
 * 
 * @param {array} arr 数组对象
 * @return {array} 去重后的数组对象
 */
function uniqueArray ( arr ) {
    var result = [];
    for ( var i = 0, len = arr.length; i < len; i++ ) {
        if ( result.indexOf( arr[ i ], result ) === -1 ) {
            result.push( arr[i] );
        }
    }
    return result;
}
/**
 * 返回模块文件发布路径数组
 * 
 * {ProcessContext} processContext 构建环境对象
 * @param {string} relativePath 文件路径，相对于构建目录
 * @param {array} arr 模块文件完整路径数组
 * @return {array} 模块文件发布路径数组
 */
function pathMappermodule ( processContext, relativePath, arr ) {
    // var result = null;
    // console.log(11,arr)
    arr.map( function ( item, index ) {
        var file = processContext.getFileByPath( relativePath );
        if ( file && item == file.fullPath) {
            // result.push(file.outputPath);
            result = file.outputPath;
            arr[ index ] = result;
            // console.log(result)
            // return result;
        }
    } );
    // console.log(2,arr)
    // return result;
}
/**
 * 返回指定缓存资源发布路径
 * 
 * {ProcessContext} processContext 构建环境对象
 * @param {string} relativePath 文件路径，相对于构建目录
 * @param {array} arr 指定缓存资源数组
 * @return {array} 指定缓存资发布路径数组
 */
/*function pathMapperCustom ( processContext, relativePath, arr ) {
    var result = null;
    arr.forEach( function ( item, index ) {
        var file = processContext.getFileByPath( relativePath );
        if ( pathSatisfy( relativePath, item ) ) {
            result = file.outputPath;
        }
    } );
    // console.log(result)
    return result;
}*/
/**
 * 返回css文件中url资源的发布地址
 * 
 * {ProcessContext} processContext 构建环境对象
 * @param {string} relativePath 文件路径，相对于构建目录
 * @param {array} arr css文件发布路径数组
 * @return {array} css文件中url资源的发布地址
 */
function pathMapperCssUrl ( processContext, relativePath, arr ) {
    var result = [];
    // console.log(processContext.getFileByPath( relativePath ).outputPath, arr)
    arr.map( function ( item ) {
        //console.log(processContext.getFileByPath( relativePath ))
        var file = processContext.getFileByPath( relativePath );
        if ( file && pathSatisfy( item, file.outputPath )) {
            var baseDir = processContext.baseDir;
            var dir = path.dirname( file.outputPath );
            var content = file.data;
            var cssUrl = require( '../util/get-css-url' )( content );
            // console.log( cssUrl )
            cssUrl.forEach( function ( item ) {
                var fullPath = path.resolve( dir , item );
                var url = path.relative( baseDir, fullPath );
                // console.log( url );
                result.push( url );
            });
        }
    } );

    return result;
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
 * 在环境对象中加入文件信息对象
 * 
 * @inner
 * {ProcessContext} processContext 构建环境对象
 * {string} fullPath 文件的全路径
 */
function addFileToProcessContext( processContext, fullPath ) {
    var path = require( '../util/path' );
    var relativePath = path.relative( processContext.baseDir, fullPath );
    var extname = path.extname( fullPath ).slice( 1 );
    var FileInfo = require( '../file-info' );

    var fileEncodings = processContext.fileEncodings;
    var fileEncoding = null;
    for ( var encodingPath in fileEncodings ) {
        if ( pathSatisfy( relativePath, encodingPath ) ) {
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
        var whiteTypes = {
            html: 1,
            css: 1,
            cssurl: 1,
            image: 1,
            script: 1,
            module: 1,
            cache: 1,
            fallback: 1,
            network: 1
        };
        for( var key in manifestInfo ) {
            var value = manifestInfo[ key ];
            if( whiteTypes[ key ] && Array.isArray( value ) ) {
                manifestInfo[ key ] = value.join( '\n' );
            }
        }
        var content = format( manifestTpl, manifestInfo );
        manifest.setData( content );
    }
}

/**
 * 对象属性拷贝
 * 
 * @param {Object} target 目标对象
 * @param {...Object} source 源对象
 * @return {Object}
 */
function extend( target, source ) {
    for ( var i = 1, len = arguments.length; i < len; i++ ) {
        source = arguments[ i ];

        if ( !source ) {
            continue;
        }
        
        for ( var key in source ) {
            if ( source.hasOwnProperty( key ) ) {
                target[ key ] = source[ key ];
            }
        }

    }

    return target;
}
module.exports = exports = ManifestCompiler;
