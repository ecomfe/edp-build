/**
 * @file 模块编译的构建处理器
 * @author errorrik[errorrik@gmail.com]
 *         treelite[c.xinle@gmail.com]
 */
var edp = require ( 'edp-core' );
var AbstractProcessor = require( './abstract' );

/**
 * 模块编译的构建处理器
 * 
 * @constructor
 * @param {Object} options 初始化参数
 * @param {string} options.configFile 模块配置文件
 */
function ModuleCompiler( options ) {
    AbstractProcessor.call( this, options );
}

ModuleCompiler.prototype = new AbstractProcessor();


/**
 * 处理器名称
 * 
 * @type {string}
 */
ModuleCompiler.prototype.name = 'ModuleCompiler';

/**
 * 判断处理器是否忽略文件
 *
 * @param {FileInfo} file 文件信息对象
 */
ModuleCompiler.prototype.isExclude = function( file ) {
    var k = AbstractProcessor.prototype.isExclude.call(this, file);

    return k || file.extname !== 'js';
}

/**
 * 构建处理
 * 
 * @param {FileInfo} file 文件信息对象
 * @param {ProcessContext} processContext 构建环境对象
 * @param {Function} callback 处理完成回调函数
 */
ModuleCompiler.prototype.process = function ( file, processContext, callback ) {
    var extname = file.extname;
    var configFile = edp.path.resolve( processContext.baseDir, this.configFile );

    // read config
    if ( !this.config ) {
        this.config = require( '../util/read-json-file' )( configFile );

        var combineModules = this.config.combine || {};
        if ( typeof this.getCombineConfig === 'function' ) {
            combineModules = this.getCombineConfig(combineModules);
        }
        this.combineModules = combineModules;
    }

    /**
     * 编译模块
     * 
     * @inner
     * @param {Object} fileInfo 文件信息对象
     * @param {string} modId 模块id
     * @param {boolean|Object} combine 合并选项，用于编译其依赖模块
     */
    function compileModule( fileInfo, modId, combine ) {
        if ( !fileInfo || file.get( 'module-combined' ) ) {
            return;
        }

        var moduleCode = require( '../util/compile-module' )( 
            fileInfo.data,
            modId,
            configFile,
            combine
        );

        // 如果文件内容不是一个模块定义，compileModule返回false
        if ( moduleCode !== false ) {
            return moduleCode;
        }

        edp.log.warn('Compile module code failed, file = [%s]', fileInfo.path);
        return fileInfo.data;
    }

    // 尝试模块编译
    var moduleIds = require( '../util/get-module-id' )( file.fullPath, configFile );
    if ( moduleIds.length > 0 ) {
        var compiledCodes = '';
        var isCombined = false;
        var me = this;

        moduleIds.forEach(
            function ( moduleId, index ) {
                var isModuleCombined = me.combineModules[ moduleId ];
                isCombined = isCombined || !!isModuleCombined;
                if ( index === 0 ) {
                    compiledCodes = compileModule(
                        file,
                        moduleId,
                        isModuleCombined
                    );
                }
                else {
                    // 一个文件可以映射到多个moduleId的情况
                    // require.config({
                    //   baseUrl: 'src',
                    //   paths:{ tpl: 'common/tpl' }
                    // })
                    // require(["tpl"])
                    // require(["common/tpl"])
                    var tpl = '\n/** d e f i n e */\ndefine("%s", function(require){ return require("%s"); });';
                    compiledCodes += require( 'util' ).format( tpl, moduleId, moduleIds[ 0 ] );
                }
            }
        );

        file.setData( compiledCodes );
        isCombined && file.set( 'module-combined', 1 );
    }

    callback();
};

module.exports = exports = ModuleCompiler;
