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
    // 遍历文件计数器
    this.visitCount = 0;
    // module配置文件路径
    this.configFile = this.configFile || 'module.conf';
    // manifest渲染模板的数据对象
    this.data = {};
    // manifest数据对象
    var manifestInfo = this.manifestInfo = {};
    // manifest数据对象设置初值
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
    // 遍历文件计数器自增
    this.visitCount++;
    // manifest数据对象
    var manifestInfo = this.manifestInfo;
    // 遍历配置文件
    this.manifests.forEach( function ( manifestData ) {
        // 缓存页面或规则
        var cachePage = manifestData.cachePage;
        // 判断路径片段是否满足规则
        if ( pathSatisfy( file.path, cachePage ) ) {
            // 把缓存页面的数据添加到data中
            var content = getCachePage( file.data, manifestData.manifestName );
            file.setData( content );
            addResource( 
                file, 
                _this, 
                processContext, 
                cachePage
            );
            // 文件完全匹配时，在数据中删除该数据，防止与路径匹配时重复
            if( file.path == cachePage ) {
                delete manifestInfo[ cachePage ];
            }
        }
    } );
    // 在遍历所有文件后，把所有资源写入manifest文件中
    if ( this.visitCount === this.fileCount ) {
        // 相对于构建目录的源文件路径
        var relativePaths = Object.keys( processContext.files );
        relativePaths.forEach( function ( relativePath ) {
            for (var key in _this.data) {
                var manifest = _this.data[ key ];
                // 把模块的全路径地址替换为发布地址
                modluePathReplacer( 
                    processContext, 
                    relativePath, 
                    manifest.module 
                );
                // 增加css中的url的发布地址
                addCssurl(
                    processContext,
                    relativePath,
                    manifest.css,
                    manifest.cssurl
                );
            }
        } );
        for (var key in _this.data ) {
            var manifest = _this.data[ key ];
            manifest.image = uniqueArray( manifest.image );
            manifest.css = uniqueArray( manifest.css );
            manifest.cssurl = uniqueArray( manifest.cssurl );
            manifest.script = uniqueArray( manifest.script );
            manifest.module = uniqueArray( manifest.module );
            addFileToProcessContext( processContext, manifest.fullPath );
            setResources( processContext, manifest.relativePath, manifest );
        }
    }

    callback();
};
/**
 * 给数组(目标数组)中添加数组(源数组)
 * 
 * @param {[type]} target 目标数组
 * @param {[type]} source 源数组
 */
function pushArraytoArray( target, source ) {
    Array.prototype.push.apply( target, source );
}
/**
 * 添加页面资源数据
 * 
 * @param {FileInfo} file 文件信息对象
 * @param {ManifestCompiler} processor ManifestCompiler处理器对象
 * @param {ProcessContext} processContext 构建环境对象
 * @param {string} cachePage 缓存页面或规则
 */
function addResource( file, process, processContext, cachePage ) {
    var manifest = process.manifestInfo[ cachePage ];
    if ( manifest ) {
        var data = process.data[ cachePage ] = {};
        extend( data, manifest );
        var content = file.data;
        var cache = manifest.cache;
        // 非指定缓存资源时，根据缓存页面收集资源
        if( cache.length == 0 ) {
            var resourceData = getResource( content, process.configFile );
            pushArraytoArray( data.css, resourceData.css );
            pushArraytoArray( data.image, resourceData.image );
            pushArraytoArray( data.script, resourceData.script );
            pushArraytoArray( data.module, resourceData.module );
        }
        // 缓存页面目录路径
        var fileDir = path.dirname( file.fullPath );
        // manifest文件全路径
        var fullPath = path.resolve( fileDir, manifest.manifestName );
        var relativePath = path.relative( processContext.baseDir , fullPath );
        data.relativePath = relativePath;
        data.fullPath = fullPath;
        data.html.push( file.outputPath );
        data.version = +new Date().getTime();
    }
}
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
 * 模块文件文件完整路径转换成发布路径
 * 
 * {ProcessContext} processContext 构建环境对象
 * @param {string} relativePath 文件路径，相对于构建目录
 * @param {array} arr 模块文件完整路径数组
 */
function modluePathReplacer ( processContext, relativePath, module ) {
    module.map( function ( item, index ) {
        var file = processContext.getFileByPath( relativePath );
        if ( file && item == file.fullPath) {
            module[ index ] = file.outputPath;
        }
    } );
}

/**
 * 返回css文件中url资源的发布地址
 * 
 * {ProcessContext} processContext 构建环境对象
 * @param {string} relativePath 文件路径，相对于构建目录
 * @param {array} arr css文件发布路径数组
 * @return {array} css文件中url资源的发布地址
 */
function addCssurl ( processContext, relativePath, css, cssurl ) {
    var result = [];
    css.map( function ( item ) {
        var file = processContext.getFileByPath( relativePath );
        if ( file && pathSatisfy( item, file.outputPath ) ) {
            var baseDir = processContext.baseDir;
            var dir = path.dirname( file.outputPath );
            var content = file.data;
            var cssUrl = require( '../util/get-css-url' )( content );
            cssUrl.forEach( function ( item ) {
                var fullPath = path.resolve( dir , item );
                var url = path.relative( baseDir, fullPath );
                result.push( url );
            });
        }
    } );
    pushArraytoArray( cssurl, result );
}
/**
 * 用数据对象填充的字符串
 * 
 * @param {string} source 模板字符串
 * @param {object} opts 数据对象
 * @return {string} 用数据对象填充的字符串
 */
function format( source, opts ) {
    source = String( source );
    return source.replace( /#\{(.+?)\}/g, function ( match, key ) {
        var replacer = opts[ key ];
        return ( 'undefined' == typeof replacer ? '' : replacer );
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
function getCachePage( content, manifestName ) {
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
 * {object} data manifest资源数据
 */
function setResources( processContext , manifestName , data ) {
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
        for( var key in data ) {
            var value = data[ key ];
            if( whiteTypes[ key ] && Array.isArray( value ) ) {
                data[ key ] = value.join( '\n' );
            }
        }
        var content = format( manifestTpl, data );
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
