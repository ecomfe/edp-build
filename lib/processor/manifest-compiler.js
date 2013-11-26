/**
 * @file manifest的构建处理器
 * @author duanlixin[duanlixin@gmail.com]
 */

var AbstractProcessor = require( './abstract' );
var FileInfo = require( '../file-info' );
var PathMapper = require( './path-mapper' );
/**
 * manifest的构建处理器
 *
 * @constructor
 * @param {Object} options 初始化参数
 */
function ManifestCompiler( options ) {
    AbstractProcessor.call( this, options );

    this.manifestList = this.manifestList || [];

}


ManifestCompiler.prototype = new AbstractProcessor();

/**
 * 处理器名称
 *
 * @type {string}
 */
ManifestCompiler.prototype.name = 'ManifestCompiler';

var path = require( 'path' );
var fs = require( 'fs' );
/**
 * 构建处理
 *
 * @param {FileInfo} file 文件信息对象
 * @param {ProcessContext} processContext 构建环境对象
 * @param {Function} callback 处理完成回调函数
 */
ManifestCompiler.prototype.process = function ( file, processContext, callback ) {
    var outputPath = file.outputPath;
    var that = this;
    // 根据配置循环检测
    this.manifestList.forEach( function ( options ) {
        var network = options.network || [];
        var fallback = options.fallback || '';
        var name = options.name || 'edp.appcache';
        var page = options.page || false;
        // 根据配置找到使用manifest的页面
        if ( path.basename( outputPath ) == page ) {
            var now = +new Date().getTime();
            var content = file.data;
            var cacheFiles = getResources( content );
            // console.log(cacheFiles)

            that.scriptTagList = cacheFiles.scriptTagList;
            that.linkTagList = cacheFiles.linkTagList;
            that.requireJsList = cacheFiles.requireJsList;
            that.imageList = [];

            // 给使用manifest的页面写入manifest属性
            file.setData( buildPage( content, name ) );
            // 在环境对象中加入manifest文件信息对象
            addManifstFileToProcessContext( file, processContext , name , page);

            var cssFiles = that.linkTagList.join( '\n' );
            var jsFiles = that.scriptTagList.join( '\n' );
            setResources( processContext , name, '# css files', cssFiles );
            setResources( processContext , name, '# js files', jsFiles );
            setResources( processContext , name, '# version', '# ' + now );
            setResources( processContext , name, '# html files', outputPath );
            setResources( processContext , name, 'FALLBACK:', fallback );

        }
        if ( path.extname( outputPath ) == '.css' ) {

            // 遍历页面用到css的href
            that.linkTagList.forEach( function ( csspath ) {
                if( outputPath === csspath ) {
                    var urls = file.data.match( /url\s*\(([^\)]*)\)/g ) || [];
                    var fileName = path.basename( file.fullPath );
                    var pos = fileName.indexOf( path.extname( file.fullPath ) );
                    var fileName = fileName.substring( 0 , pos ) + '.css';

                    urls.forEach( function ( url ) {
                        var imagePath = csspath.replace( 
                                fileName , 
                                url.match( /\((.*)\)/ )[ 1 ] 
                            );
                        // 把图片资源写入manifest中
                        setResources( 
                            processContext , 
                            name, 
                            '# images files', 
                            imagePath 
                        );
                    } );
                }
            } );

        }
        if ( path.extname( outputPath ) == '.js' ) {
            // 遍历页require用到的id
            that.requireJsList.forEach( function ( id ) {
                if( outputPath.indexOf( id ) != -1 ) {
                    // 若该id在outputPath中，则把outputPath写入manifest中
                    setResources( 
                        processContext , 
                        name, 
                        '# js files', 
                        outputPath 
                    );
                }
            });
        }
        if ( outputPath ) {
            network.forEach( function ( filepath ) {
                if ( filepath == file.path ) {
                    setResources( 
                        processContext , 
                        name , 
                        'NETWORK:', 
                        outputPath 
                    );
                }
            });
        }
    });


    callback();
}

/**
 * 给manifest文件中增加资源
 * 
 * @inner
 * {ProcessContext} processContext 构建环境对象
 * {string} key 资源类型
 * {string} value 资源路径
 */
function setResources( processContext , path , key , value ) {
    if( processContext.getFileByPath( path ) ) {

        var manifest = processContext.getFileByPath( path ).data;
        manifest = manifest.split( '\n' );
        var pos = manifest.indexOf( key ) + 1;
        manifest.splice( pos , 0 , value );
        processContext.getFileByPath( path ).setData( manifest.join( '\n' ) );
    }

}
/**
 * 返回manifest的初始内容
 * 
 * @inner
 * @return {string}
 */
function createManifest(){
    var TPL = ''
            + 'CACHE MANIFEST\n'
            + '# version'
            // + 
            + '\n'
            + '# html files\n'
            // + 
            + '# css files\n'
            // +
            + '# images files\n'
            // + 
            + '# js files\n'
            // + 
            + 'FALLBACK:\n'
            // + '\n'
            + 'NETWORK:\n'
            + '*'
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
function addManifstFileToProcessContext( file , processContext , name , page ) {
    // manifest 全路径
    var fullPath = path.resolve( path.dirname( file.fullPath ) , name );
    // manifest 相对路径
    var relativePath = file.path.replace( page, name );
    // 后缀名
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
function buildPage( content , name ) {
    var manifest = ''
                 + ' manifest="'
                 + name
                 + '" ';
    if( content ) {

        return content.replace( /<html[^>]*/g , function ( match ) {
            return match + manifest;

        });
    }
}
/**
 * 返回使用manifest页面的资源
 * 
 * @inner
 * @param {string} content 使用manifest页面的内容
 * @return {object} 页面使用css的href数组 script的src数组 require的id数组
 */
function getResources(content) {

    var linkTagList = [];
    var scriptTagList = [];
    var requireJsList = [];

    var requireJsMatch = content.match( /require\s*\(\s*\[([^\]]*)\]/g ) || [];

    requireJsList = getId( requireJsMatch );

    var replaceTagAttribute = require( '../util/replace-tag-attribute' );

    replaceTagAttribute(content,'link','href', function( href ) {

        linkTagList.push( href );
    } );

    replaceTagAttribute(content,'script', 'src', function( src ) {

        scriptTagList.push(src);
    } );
    function getId( matchList ) {
        var list = [];
        matchList.forEach( function ( content ) {
            Array.prototype.push.apply(list , readModuleId( content ));
        });
        return list;
    }
    return {
        linkTagList: linkTagList || [],
        scriptTagList: scriptTagList || [],
        requireJsList: requireJsList || []
    };
}
/**
 * 从内容中读取require的id信息
 * 
 * @param {string} content 内容
 * @return {Object}
 */
function readModuleId( content ) {
    var index = content.search( /(require\s*\(\s*\[)/ );
    if ( index < 0 ) {
        return;
    }
    index += RegExp.$1.length - 1;

    var len = content.length;
    var braceLevel = 0;
    var fromIndex = index;
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
    var toIndex = index;

    content = content.slice( fromIndex, index );
    return eval( '(' + content + ')' );
}


module.exports = exports = ManifestCompiler;
