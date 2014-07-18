
var edp = require( 'edp-core' );
var estraverse = require( 'estraverse' );
var SYNTAX = estraverse.Syntax;
var LITERAL_REQUIRE = 'require';

/**
 * 判断是否是符合需要的resourceId
 * @param {string} depId
 * @param {Array.<string>} pluginIds
 * @return {boolean}
 */
function isMatchPluginId( depId, pluginIds ) {
    if ( depId.indexOf( '!' ) === -1 ) {
        return false;
    }

    var parts = depId.split( '!' );
    var pluginId = parts[ 0 ];
    return ( pluginIds.indexOf( pluginId ) !== -1 );
}

/**
 * 处理一个模块的资源引用替换
 *
 * @inner
 * @param {Object} moduleInfo 模块信息对象
 * @param {Array.<string>} pluginIds 需要处理的pluginId列表
 * @param {Function} resourceReplacer 资源id替换函数
 * @return {Object}
 */
function processModuleReplace( moduleInfo, pluginIds, resourceReplacer ) {
    // replace resourceId which on dependencies
    var dependencies = moduleInfo.actualDependencies;
    for ( var i = 0; i < dependencies.length; i++ ) {
        var depId = dependencies[ i ];
        if ( isMatchPluginId( depId, pluginIds ) ) {
            dependencies[ i ] = resourceReplacer( depId );
        }
    }

    var factoryAst = moduleInfo.factoryAst;

    // 计算factory function的形参个数
    var factoryParamCount = 0;
    if ( factoryAst && factoryAst.type === SYNTAX.FunctionExpression ) {
        factoryParamCount = factoryAst.params.length;
    }

    // 对dependencies去重
    // 被factory 形参引用的依赖不能被去掉，通过factoryParamCount控制
    var dependenciesMap = {};
    for ( var i = 0; i < dependencies.length; ) {
        var depId = dependencies[ i ];
        if ( dependenciesMap[ depId ] && i >= factoryParamCount ) {
            dependencies.splice( i, 1 );
        }
        else {
            dependenciesMap[ depId ] = 1;
            i++;
        }
    }

    // replace resourceId which on function body
    if ( factoryAst.type === SYNTAX.FunctionExpression ) {
        estraverse.traverse(
            factoryAst,
            {
                enter: function ( item ) {
                    if ( item.type !== SYNTAX.CallExpression ) {
                        return;
                    }

                    var arg0;

                    if ( item.callee.name === LITERAL_REQUIRE
                        && ( arg0 = item['arguments'][ 0 ] )
                        && arg0.type === SYNTAX.Literal
                        && typeof arg0.value === 'string'
                    ) {
                        if ( isMatchPluginId( arg0.value, pluginIds ) ) {
                            arg0.value = resourceReplacer( arg0.value );
                            arg0.raw = '\'' + arg0.value + '\'';
                        }
                    }
                }
            }
        );
    }

    return moduleInfo;
}

/**
 * 替换模块中对resource依赖的资源
 *
 * @param {string} code 模块代码
 * @param {string|Array.<string>} pluginId 资源加载的插件模块id
 * @param {Function} resourceReplacer 资源id替换函数
 * @return {string}
 */
module.exports = exports = function ( code, pluginId, resourceReplacer ) {
    var ast = edp.amd.getAst( code );
    if ( !ast ) {
        return code;
    }

    var moduleInfo = edp.amd.analyseModule( ast );
    if ( !moduleInfo ) {
        return code;
    }

    // 模块分析的返回结果可能是一个模块对象，也可能是模块对象数组
    // 这里做一次统一数组类型，方便后面处理
    if ( !Array.isArray( moduleInfo ) ) {
        moduleInfo = [ moduleInfo ];
    }

    var pluginIds = pluginId;
    if ( typeof pluginIds === 'string' ) {
        pluginIds = [ pluginIds ];
    }

    // 处理模块替换
    moduleInfo.forEach( function ( item, index ) {
        moduleInfo[ index ] = processModuleReplace( item, pluginIds, resourceReplacer );
    } );

    return require( './generate-module-code' )( moduleInfo, ast );
};
