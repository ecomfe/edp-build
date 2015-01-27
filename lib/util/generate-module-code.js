var estraverse = require( 'estraverse' );
var SYNTAX = require( 'estraverse' ).Syntax;
var LITERAL_DEFINE = 'define';

/**
 * 根据模块信息生成AST
 *
 * @inner
 * @param {Object} moduleInfo 模块信息，通常是analyseModule的返回结果
 * @return {Object}
 */
function generateModuleAst( moduleInfo ) {
    var dependenciesExpr;
    var actualDependencies = moduleInfo.actualDependencies;
    if ( actualDependencies instanceof Array ) {
        dependenciesExpr = {
            type: SYNTAX.ArrayExpression,
            elements: []
        };

        actualDependencies.forEach( function ( dependency ) {
            dependenciesExpr.elements.push( {
                type: SYNTAX.Literal,
                value: dependency,
                raw: '\'' + dependency + '\''
            });
        } );
    }

    var defineArgs = [ moduleInfo.factoryAst ];
    if ( dependenciesExpr ) {
        defineArgs.unshift( dependenciesExpr );
    }
    var id = moduleInfo.id;
    if ( id ) {
        defineArgs.unshift( {
            type: SYNTAX.Literal,
            value: moduleInfo.id,
            raw: '\'' + moduleInfo.id + '\''
        } );
    }

    return {
        type: SYNTAX.CallExpression,
        callee: {
            type: SYNTAX.Identifier,
            name: LITERAL_DEFINE
        },
        'arguments': defineArgs
    };
}

/**
 * 生成模块代码
 *
 * @param {Object|Array.<Object>} moduleInfo 模块信息，通常是analyseModule的返回结果
 * @param {...Object} sourceAst 源文件的AST
 * @return {string}
 */
module.exports = exports = function ( moduleInfo, sourceAst ) {
    // 统一转化为数组

    if ( ! ( moduleInfo instanceof Array ) ) {
        moduleInfo = [ moduleInfo ];
    }


    var ast;
    // 如果没有原始的ast
    // 则按照moduleInfo来生成代码
    if ( !sourceAst ) {
        ast = {
            type: SYNTAX.Program,
            body: []
        };

        moduleInfo.forEach( function ( item ) {
            ast.body.push( {
                type: SYNTAX.ExpressionStatement,
                expression: generateModuleAst( item )
            } );
        } );
    }
    // 有原始ast
    // 则对原始ast中module定义的部分进行替换
    else {
        var i = 0;
        ast = estraverse.replace( sourceAst, {
            enter: function ( node ) {
                if ( node.type === SYNTAX.CallExpression
                    && node.callee.name === LITERAL_DEFINE
                ) {
                    if ( moduleInfo[ i ] ) {
                        return generateModuleAst( moduleInfo[ i++ ] );
                    }
                }
            }
        } );
    }

    return require( 'escodegen' ).generate( ast );
};
