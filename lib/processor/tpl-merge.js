/***************************************************************************
 * 
 * Copyright (c) 2014 Baidu.com, Inc. All Rights Reserved
 * $Id$ 
 * 
 **************************************************************************/
 
 
 
/**
 * lib/processor/tpl-merge.js ~ 2014/02/24 22:06:20
 * @author leeight(liyubei@baidu.com)
 * @version $Revision$ 
 * @description 
 * 扫描所有的js文件将项目中用到的模板都合并为1个
 **/
var edp = require( 'edp-core' );
var fs = require( 'fs' );
var path = require( 'path' );
var AbstractProcessor = require( './abstract' );
var FileInfo = require( '../file-info' );

/**
 * 模板合并的工作
 *
 * @constructor
 * @param {Object} options 初始化参数
 */
function TplMerge( options ) {
    AbstractProcessor.call( this, options );

    this.pluginIds = this.pluginIds || [ 'tpl', 'er/tpl' ];

    /**
     * 所有找到的模板文件列表
     * @private
     * @type {Array.<string>}
     */
    this.tpls = [];

    /**
     * 所有需要替换的文件列表
     * @private
     * @type {Object.<string, FileInfo>}
     */
    this.fileMap = {};
}

TplMerge.prototype = new AbstractProcessor();

/**
 * 处理器名称
 *
 * @type {string}
 */
TplMerge.prototype.name = 'TplMerge';


/**
 * 判断处理器是否忽略文件
 *
 * @param {FileInfo} file 文件信息对象
 */
TplMerge.prototype.isExclude = function( file ) {
    var k = AbstractProcessor.prototype.isExclude.call(this, file);

    return k || path.extname( file.outputPath ) !== '.js';
}

/**
 * 构建处理
 *
 * @param {FileInfo} file 文件信息对象
 * @param {ProcessContext} processContext 构建环境对象
 * @param {Function} callback 处理完成回调函数
 */
TplMerge.prototype.process = function ( file, processContext, callback ) {
    function next() {
        callback && callback();
    }

    // 根据语法树分析模块
    var ast;
    try {
        ast = require( 'esprima' ).parse( file.data );
    }
    catch ( ex ) {
        this.log.fatal('Parse code failed, file = [%s]', file.path );
        return next();
    }

    var moduleInfo = require( '../util/analyse-module' )( ast );
    if ( !moduleInfo ) {
        this.log.warn( 'Can\'t find moduleInfo for [%s]', file.path );
        return next();
    }

    var actualDependencies = moduleInfo.actualDependencies
    if ( !actualDependencies || actualDependencies.length <= 0 ) {
        return next();
    }

    for ( var i = 0; i < actualDependencies.length; i ++) {
        var depId = actualDependencies[ i ];
        if ( depId.indexOf( '!' ) !== -1 ) {
            var parts = depId.split( '!' );
            var pluginId = parts[ 0 ];
            var resourceId = parts[ 1 ];

            if ( this.pluginIds.indexOf( pluginId ) !== -1 ) {
                // TODO resourceId 到 resourceUrl 的计算方式
                // TODO edp.path.isRelativePath
                var tpl = path.normalize( path.join( path.dirname( file.path ), resourceId ) );
                if ( this.tpls.indexOf( tpl ) === -1 ) {
                    if ( !fs.existsSync( tpl ) ) {
                        this.log.error("No such tpl file = [%s]", tpl);
                        continue;
                    }
                    this.tpls.push( tpl );
                }
                this.fileMap[ file.path ] = file;
            }
        }
    }

    next();
}

/**
 * 所有的文件都扫描完毕了，在这个processor即将完成任务之前，
 * 开始正式干活
 * @param {ProcessContext} processContext 构建环境对象
 */
TplMerge.prototype.done = function( processContext ) {
    var fs = require( 'fs' );
    var data = [];
    this.tpls.forEach(function(tpl){
        data.push( fs.readFileSync( tpl, 'utf-8' ) );
    });
    var fileInfo = appendOutput( processContext, data.join( '\n' ) );

    // 把 this.fileMap 中的引用模板路径的地方都修改过来
    for ( var path in this.fileMap ) {
        var file = this.fileMap[ path ];
        file.setData(
            require( '../util/replace-require-resource' )( 
                file.data,
                this.pluginIds,
                function ( resourceId ) {
                    // XXX resourceId是完成的路径，例如 tpl!./tpl/list.tpl.html
                    // 不管之前是不是相对路径，现在我把它改成相对的
                    // src/plan/ListView.js
                    //   require('er/tpl!./list.tpl.html');
                    //   require('er/tpl!view/list.tpl.html');
                    // 改完之后的效果是
                    // src/plan/ListView.js
                    //   require('er/tpl!../1234abcd.html');
                    //   require('er/tpl!../1234abcd.html');
                    var relativePath = edp.path.relative(
                        edp.path.dirname( file.fullPath ),
                        fileInfo.fullPath
                    );
                    return resourceId.replace( /!.*/, '!' + relativePath );
                }
            )
        );
    }
}

/**
 * @param {ProcessContext} processContext
 * @return {FileInfo}
 */
function appendOutput( processContext, data ) {
    var crypto = require( 'crypto' );
    var md5 = crypto.createHash( 'md5' );
    md5.update( new Buffer( data, 'utf-8' ) );
    var result = md5.digest( 'hex' ).slice( 0, 8 );

    // 把tpls的内容输出到文件，也就是给processContext新增一个要输出的文件
    var relativePath = result + ".tpl.html";
    var fileData = new FileInfo( {
        data         : data,
        extname      : "html",
        path         : relativePath,
        fullPath     : path.resolve( processContext.baseDir, relativePath )
    } );
    processContext.addFile( fileData );

    return fileData;
}

module.exports = exports = TplMerge;

















/* vim: set ts=4 sw=4 sts=4 tw=100: */
