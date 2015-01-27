/**
 * @file 扫描所有的js文件将项目中用到的模板都合并为1个
 * @author leeight(liyubei@baidu.com)
 */



var edp = require( 'edp-core' );
var fs = require( 'fs' );
var AbstractProcessor = require( './abstract' );
var FileInfo = require( '../file-info' );

/**
 * 模板合并的工作
 *
 * @constructor
 * @param {Object} options 初始化参数
 */
function TplMerge( options ) {
    // 默认的配置信息
    options = edp.util.mix( {
        /**
         * 需要检查的插件Id列表
         * @type {Array.<string>}
         */
        pluginIds: [ 'tpl', 'er/tpl' ],

        /**
         * 项目的配置文件
         * @type {string}
         */
        configFile: 'module.conf',

        /**
         * 默认要处理的配置文件
         * @type {Array.<string>}
         */
        files: [ 'src/**/*.js' ],

        /**
         * 默认不要用format，否则chrome下面因为太多的字符串拼接操作，会出现
         * RangeError: Maximum call stack size exceeded
         * 的问题
         *
         * html2js的默认参数
         * @type {Object}
         */
        html2jsOptions: {
            mode: 'default'
        },

        /**
         * 默认输出的文件路径，相对的是 configFile 所在的目录
         * @type {string}
         */
        outputPath: null,

        /**
         * 默认的代码输出模板
         * @type {string}
         */
        outputWrapper: 'define(function(){ return %output%; });'
    }, options );

    AbstractProcessor.call( this, options );

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

    /**
     * 开发状态下，模板大部分都是以xhr的形式加载的，但是
     * 发布状态下，如果分开部署，涉及到跨域的问题，就需要以amd module的形式加载模板，
     * 那么可以设置一下这个参数的值.
     *
     * 需要注意的是，这个参数必须跟 `outputType` 一起配合使用
     * @type {string}
     */
    this.outputPluginId;

    /**
     * @type {string}
     */
    this.outputType;
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

    return k || edp.path.extname( file.outputPath ) !== '.js';
};

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
    var ast = edp.amd.getAst( file.data );
    if ( !ast ) {
        this.log.fatal( 'Parse code failed, file = [%s]', file.path );
        return next();
    }

    var moduleInfos = edp.amd.analyseModule( ast );
    if ( !moduleInfos ) {
        this.log.warn( 'Can\'t find moduleInfos for [%s]', file.path );
        return next();
    }

    if ( !Array.isArray( moduleInfos )) {
        moduleInfos = [ moduleInfos ];
    }

    for ( var i = 0; i < moduleInfos.length; i ++ ) {
        var moduleInfo = moduleInfos[ i ];
        this._processModuleInfo( moduleInfo, processContext, file );
    }
    next();
};

/**
 * 处理单个模块定义信息
 * @param {Object} moduleInfo 单个模块的定义信息.
 * @param {ProcessContext} processContext
 * @param {FileInfo} file 文件信息对象.
 */
TplMerge.prototype._processModuleInfo =
    function( moduleInfo, processContext, file ) {

    var actualDependencies = moduleInfo.actualDependencies;
    if ( !actualDependencies || actualDependencies.length <= 0 ) {
        return;
    }

    for ( var i = 0; i < actualDependencies.length; i ++) {
        var depId = actualDependencies[ i ];
        if ( depId.indexOf( '!' ) === -1 ) {
            continue;
        }

        var parts = depId.split( '!' );
        var pluginId = parts[ 0 ];
        var resourceId = parts[ 1 ];

        if ( this.pluginIds.indexOf( pluginId ) === -1 ) {
            continue;
        }

        var tpl = null;
        if ( resourceId[0] === '.' ) {
            // 相对路径，相对于当前的js文件
            // tpl!./tpl/list.tpl.html
            // tpl!../tpl/list.tpl.html

            if ( !moduleInfo.id ) {
                // 这是一个匿名模块，计算的时候按照当前js文件所在的目录进行计算
                tpl = edp.path.normalize(
                          edp.path.join(
                              edp.path.dirname( file.path ), resourceId ) );
            }
            else {
                // 这是一个有名字的模块，因此需要计算出新的resourceId，
                // 然后再根据resourceId计算file path
                // XXX 对于ModuleCompiler处理之后的js文件，
                // 一个文件中可能出现了多个define，如果ModuleCompiler
                // 没有正确的去调整resourceId，此时还能获取文件路径吗？
                resourceId = edp.amd.resolveModuleId(
                    resourceId, moduleInfo.id );
                tpl = this._getModuleFile( resourceId, processContext.baseDir );
            }
        }
        else {
            // 不是相对路径，例如
            // tpl!common/tpl/list.tpl.html
            tpl = this._getModuleFile( resourceId, processContext.baseDir );
        }

        if ( tpl ) {
            if ( !fs.existsSync( edp.path.join( processContext.baseDir, tpl ) ) ) {
                this.log.error( 'No such tpl file = [%s]', tpl);
                continue;
            }
            // 只要模板存在，就应该处理这个js文件
            this.fileMap[ file.path ] = file;

            if ( this.tpls.indexOf( tpl ) === -1 ) {
                // 但是不应该重复记录js文件的内容
                this.tpls.push( tpl );
            }
        }
    }
};

/**
 * @param {string} resourceId 需要计算的资源Id.
 * @param {string} baseDir 项目的根目录.
 * @return {string} 资源的文件路径，相对于baseDir
 */
TplMerge.prototype._getModuleFile = function( resourceId, baseDir ) {
    var configFile = edp.path.resolve( baseDir, this.configFile );
    // tpl是绝对地址
    var tpl = edp.amd.getModuleFile( resourceId, configFile );

    // 因为总是会追加.js后缀，因此我们需要删掉
    tpl = tpl.replace(/\.js$/, '');
    tpl = edp.path.relative( baseDir, tpl );

    return tpl;
};

/**
 * 所有的文件都扫描完毕了，在这个processor即将完成任务之前，
 * 开始正式干活
 * @param {ProcessContext} processContext 构建环境对象
 */
TplMerge.prototype.afterAll = function( processContext ) {
    var baseDir = processContext.baseDir;
    var fs = require( 'fs' );
    var data = [];
    this.tpls.forEach(function(tpl){
        // 这里不应该调用 fs.readFileSync 而是应该从 processContext 中获取
        // 这样子的话，其它的processor也可以处理文件了
        var file = processContext.getFileByPath( tpl );
        if ( !file ) {
            var filePath = edp.path.join( baseDir, tpl );
            file = new FileInfo({
                data         : fs.readFileSync( filePath ),
                extname      : edp.path.extname( tpl ).slice( 1 ),
                path         : tpl,
                fullPath     : filePath,
                stat         : fs.statSync( filePath ),
                fileEncoding : 'utf-8'
            });
            processContext.addFile( file );
        }
        data.push( file.data.toString());
    });

    var outputPluginId = this.outputPluginId;
    var outputAsAmdModule = ( !!outputPluginId && ( this.outputType === 'js' ) );

    var fileExt = outputAsAmdModule ? 'js' : 'html';
    var fileData = data.join( '\n' );
    if ( outputAsAmdModule ) {
        fileData = require( 'html2js' )( fileData, this.html2jsOptions );
        fileData = fileData.replace( /\r/g, '' );
        fileData = this.outputWrapper.replace( '%output%', fileData );
    }

    var fileInfo = this._appendOutput( processContext, fileData, fileExt );
    var fileName = edp.path.relative( 'src', fileInfo.path );

    if ( outputAsAmdModule ) {
        // 简单计算一下就可以了，不需要调用edp.amd.getModuleId()了
        fileName = fileName.replace( '.' + fileInfo.extname, '' );
    }

    function replacer( resourceId ) {
        if ( outputAsAmdModule ) {
            return outputPluginId + '!' + fileName;
        }
        else {
            return resourceId.replace( /!.*/, '!' + fileName );
        }
    }

    // 把 this.fileMap 中的引用模板路径的地方都修改过来
    for ( var path in this.fileMap ) {
        var file = this.fileMap[ path ];
        file.setData(
            require( '../util/replace-require-resource' )(
                file.data,
                this.pluginIds,
                replacer
            )
        );
    }
};

/**
 * @param {ProcessContext} processContext
 * @param {string} extname 后缀名.
 * @return {FileInfo}
 */
TplMerge.prototype._appendOutput = function( processContext, data, extname ) {
    var crypto = require( 'crypto' );
    var md5 = crypto.createHash( 'md5' );
    md5.update( new Buffer( data, 'utf-8' ) );
    var result = md5.digest( 'hex' ).slice( 0, 8 );

    var baseDir = processContext.baseDir;

    var configFile = edp.path.resolve( baseDir, this.configFile );
    var moduleConfig = require( '../util/read-json-file' )( configFile );

    var relativePath = this.outputPath;
    if ( !relativePath ) {
        var baseUrl = moduleConfig.baseUrl || 'src';
        // 把tpls的内容输出到文件，也就是给processContext新增一个要输出的文件
        relativePath = edp.path.join( baseUrl, result + '.tpl.' + extname );
    }

    var fileData = new FileInfo( {
        data         : data,
        extname      : edp.path.extname( relativePath ).slice( 1 ),
        path         : relativePath,
        fullPath     : edp.path.resolve( baseDir, relativePath )
    } );

    processContext.addFile( fileData );

    return fileData;
};

module.exports = exports = TplMerge;

















/* vim: set ts=4 sw=4 sts=4 tw=100: */
