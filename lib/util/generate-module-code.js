

var SYNTAX = require( 'estraverse' ).Syntax;
var LITERAL_DEFINE = 'define';

/**
 * 生成模块代码
 * 
 * @param {Object} moduleInfo 模块信息，通常是analyseModule的返回结果
 * @return {string}
 */
module.exports = exports = function ( moduleInfo ) {
    var dependenciesExpr;
    if ( moduleInfo.dependencies instanceof Array ) {
        dependenciesExpr = {
            type: SYNTAX.ArrayExpression,
            elements: []
        };

        moduleInfo.dependencies.forEach( function ( dependency ) {
            dependenciesExpr.elements.push( {
                type: SYNTAX.Literal,
                value: dependency,
                raw: "'" + dependency + "'"
            });
        } );
    }

    var defineArgs = [ moduleInfo.factoryAst ];
    dependenciesExpr && defineArgs.unshift( dependenciesExpr );
    var id = moduleInfo.id;
    if ( id ) {
        defineArgs.unshift( {
            type: SYNTAX.Literal,
            value: moduleInfo.id,
            raw: "'" + moduleInfo.id + "'"
        } );
    }

    var ast = {
        type: 'Program',
        body: [
            {
                type: SYNTAX.ExpressionStatement,
                expression: {
                    type: SYNTAX.CallExpression,
                    callee: {
                        type: SYNTAX.Identifier,
                        name: LITERAL_DEFINE
                    },
                    arguments: defineArgs
                }
            }
        ]
    };
    
    return require( 'escodegen' ).generate( ast );
}
