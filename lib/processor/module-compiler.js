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
    options = edp.util.mix( {
        /**
         * @type {string}
         */
        configFile: 'module.conf',

        /**
         * 最终输出代码的模块Id前缀
         * @type {string}
         */
        bizId: null,

        /**
         * 默认要处理的文件
         * @type {Array.<string>}
         */
        files: [ '*.js' ]
    }, options );

    AbstractProcessor.call( this, options );

    /**
     * 从module.conf读取的配置信息
     * @type {Object}
     */
    this.config;

    /**
     * 模块合并的信息，可能来自module.conf的combine字段的配置，也可能
     * 是来自getCombineConfig的函数返回值.
     * 格式可能有很多种，例如：
     *
     * {
     *   "main": 1,
     *   "boot/ui": {
     *     "files": []
     *   },
     *   "boot/biz": {
     *     "files": [ "biz/base/*", "!er/**", "!biz/ui/*", "!~esui" ]
     *   }
     * }
     * @type {Object}
     */
    this.combineModules;
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
};

/**
 * 构建处理
 *
 * @param {FileInfo} file 文件信息对象
 * @param {ProcessContext} processContext 构建环境对象
 * @param {Function} callback 处理完成回调函数
 */
ModuleCompiler.prototype.process = function ( file, processContext, callback ) {
    var configFile = edp.path.resolve(
        processContext.baseDir, this.configFile );

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
    var moduleIds = edp.amd.getModuleId( file.fullPath, configFile );
    if ( moduleIds.length > 0 ) {
        var compiledCodes = '';
        var isCombined = false;
        var me = this;

        // XXX(user) 这段儿代码需要重构一下，写的有点儿难看.
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
            }
        );

        if ( this.bizId ) {
            file.setData( this._patchModuleId( compiledCodes ) );
        }
        else {
            file.setData( compiledCodes );
        }

        isCombined && file.set( 'module-combined', 1 );
    }

    callback();
};

/**
 * 主要目的是给输出的代码的添加一个固定前缀的Id，例如：
 * src/ui/Button.js
 *   -> output/asset/ui/Button.js
 *      -> define( 'bat-ria/ui/Button', function( require, exports, module ){ ... } );
 * @param {string} code 合并之后的代码.
 */
ModuleCompiler.prototype._patchModuleId = function( code ) {
    var bizId = this.bizId;

    var ast = edp.amd.getAst( code );
    var moduleInfo = edp.amd.analyseModule( ast );
    if ( Array.isArray( moduleInfo ) ) {
        moduleInfo.forEach(function( m ){
            if ( m.id ) {
                m.id = bizId + '/' + m.id;
            }
        });
    }
    else if ( moduleInfo.id ) {
        moduleInfo.id = bizId + '/' + moduleInfo.id;
    }

    var patchedCode = require( '../util/generate-module-code' )(
        moduleInfo, ast );

    return patchedCode;
};

module.exports = exports = ModuleCompiler;
