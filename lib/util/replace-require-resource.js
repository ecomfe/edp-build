

var estraverse = require( 'estraverse' );
var SYNTAX = estraverse.Syntax;
var LITERAL_REQUIRE = 'require';

/**
 * 处理一个模块的资源引用替换
 * 
 * @inner
 * @param {Object} moduleInfo 模块信息对象
 * @param {Function} resourceReplacer 资源id替换函数
 * @return {string}
 */
function processModuleReplace( moduleInfo, resourceReplacer ) {
    // replace resourceId which on dependencies
    var dependencies = moduleInfo.actualDependencies;
    for ( var i = 0; i < dependencies.length; i++ ) {
        dependencies[ i ] = resourceReplacer( dependencies[ i ] );
    }

    // replace resourceId which on function body
    var factoryAst = moduleInfo.factoryAst;
    if ( factoryAst.type === SYNTAX.FunctionExpression ) {
        estraverse.traverse(
            factoryAst,
            {
                enter: function ( item ) {
                    if ( item.type !== SYNTAX.CallExpression ) {
                        return;
                    }

                    var arg0;
                    var value;
                        
                    if ( item.callee.name === LITERAL_REQUIRE
                        && ( arg0 = item.arguments[ 0 ] )
                        && arg0.type === SYNTAX.Literal
                        && typeof arg0.value === 'string'
                    ) {
                        arg0.value = resourceReplacer( arg0.value );
                        arg0.raw = "'" + arg0.value + "'";
                    }
                }
            }
        );
    }
    
    return require( './generate-module-code' )( moduleInfo );
}

/**
 * require和dependency的替换函数
 * 
 * @inner
 * @param {string} id 依赖的id
 * @param {Function} resourceReplacer 资源id替换函数
 * @return {string}
 */
function replacer( id, resourceReplacer ) {
    var exclamationIndex = id.indexOf( '!' );
    var realPluginId;

    if ( 
        exclamationIndex > 0 
        && ( realPluginId = id.slice( 0, exclamationIndex ) )
        && realPluginId === pluginId 
    ) {
        var resourceId = id.slice( exclamationIndex + 1 );
        return pluginId + '!' + resourceReplacer( resourceId );
    }

    return id;
}

/**
 * 替换模块中对resource依赖的资源  
 * 
 * @param {string} code 模块代码
 * @param {string} pluginId 资源加载的插件模块id
 * @param {Function} resourceReplacer 资源id替换函数
 * @return {string}
 */
module.exports = exports = function ( code, pluginId, resourceReplacer ) {
    var ast;
    try {
        ast = require( 'esprima' ).parse( code );
    }
    catch ( ex ) {
        return code;
    }
    
    var moduleInfo = require( './analyse-module' )( ast );
    if ( !moduleInfo ) {
        return code;
    }
    
    // 模块分析的返回结果可能是一个模块对象，也可能是模块对象数组
    // 这里做一次统一数组类型，方便后面处理
    if ( !( moduleInfo instanceof Array ) ) {
        moduleInfo = [ moduleInfo ];
    }
    
    // 处理模块替换
    var codes = [];
    for ( var i = 0; i < moduleInfo.length; i++ ) {
        var code = processModuleReplace( moduleInfo[ i ], resourceReplacer );
        codes.push( code );
    }

    return codes.join( '\n\n' );
};
