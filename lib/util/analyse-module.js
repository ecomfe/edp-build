

var estraverse = require( 'estraverse' );
var SYNTAX = estraverse.Syntax;
var LITERAL_DEFINE = 'define';
var LITERAL_REQUIRE = 'require';

/**
 * 判断结点是否字符串直接量
 * 
 * @inner
 * @param {Object} node 语法树结点
 * @return {boolean}
 */
function isStringLiteral( node ) {
    return node 
        && node.type === SYNTAX.Literal 
        && typeof node.value === 'string';
}

/**
 * 分析模块
 * 
 * @param {Object} ast 模块代码的ast
 * @return {Object|Array} 模块信息，或模块信息数组。
 *                        每个模块信息包含id, dependencies, factoryAst, actualDependencies
 */
module.exports = exports = function ( ast ) {
    var modules = [];
    ast.body.forEach( function ( defineStat ) {
        var defineExpr = defineStat 
            && defineStat.type === SYNTAX.ExpressionStatement
            && defineStat.expression;

        var moduleId;
        var dependencies;
        var actualDependencies;
        var factoryAst;
        var defineArgs;

        // 用于去重
        var dependenciesMap = {};

        if ( defineExpr
            && defineExpr.type === SYNTAX.CallExpression 
            && defineExpr.callee.name === LITERAL_DEFINE 
            && ( defineArgs = defineExpr.arguments ) 
        ) {
            for ( var i = 0; i < defineArgs.length; i++ ) {
                var argument = defineArgs[ i ];
                if ( !moduleId && isStringLiteral( argument ) ) {
                    moduleId = argument.value;
                }
                else if ( !dependencies && argument.type === SYNTAX.ArrayExpression ) {
                    dependencies = [];
                    argument.elements.forEach(
                        function ( element ) {
                            if ( isStringLiteral( element ) ) {
                                var depId = element.value;
                                dependencies.push( depId );
                                dependenciesMap[ depId ] = 1;
                            }
                            else {
                                throw new Error( 'Dependency must be string literal' );
                            }
                        }
                    );
                }
                else {
                    factoryAst = argument;
                    break;
                }
            }

            actualDependencies = dependencies
                ? dependencies.slice( 0 )
                : [ 'require', 'exports', 'module' ];

            if ( factoryAst.type === SYNTAX.FunctionExpression ) {
                estraverse.traverse(
                    factoryAst,
                    {
                        enter: function ( item ) {
                            if ( item.type !== SYNTAX.CallExpression
                                && item.type !== SYNTAX.NewExpression
                            ) {
                                return;
                            }

                            var arg0;
                            var value;
                                
                            if ( item.callee.name === LITERAL_REQUIRE
                                && ( arg0 = item.arguments[ 0 ] )
                                && isStringLiteral( arg0 ) 
                                && ( value = arg0.value ) 
                                && ( !dependenciesMap[ value ] )
                            ) {
                                actualDependencies.push( value );
                                dependenciesMap[ value ] = 1;
                            }
                        }
                    }
                );
            }

            modules.push( {
                id: moduleId,
                dependencies: dependencies,
                actualDependencies: actualDependencies,
                factoryAst: factoryAst
            } );
        }
    } );
    
    switch ( modules.length ) {
        case 0:
            return null;
        case 1:
            return modules[ 0 ];
    }

    return modules;
}
