/**
 * Copyright (c) 2014 Baidu.com, Inc. All Rights Reserved
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on
 * an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations under the License.
 *
 * @file generate-module-code.js
 * @author leeight
 */

var escodegen = require('escodegen');
var estraverse = require('estraverse');
var SYNTAX = require('estraverse').Syntax;
var LITERAL_DEFINE = 'define';


/**
 * 交集
 *
 * @return {Array}
 */
function intersect(a, b) {
    var index = {};
    var result = [];
    var exists = {};

    a.forEach(function (item) {
        index[item] = 1;
    });

    b.forEach(function (item) {
        if (index[item] && !exists[item]) {
            result.push(item);
            exists[item] = 1;
        }
    });

    return result;
}

/**
 * 差集
 *
 * @return {Array}
 */
function subtract(a, b) {
    var index = {};
    b.forEach(function (item) {
        index[item] = 1;
    });

    var result = [];
    var exists = {};
    a.forEach(function (item) {
        if (!index[item] && !exists[item]) {
            result.push(item);
            exists[item] = 1;
        }
    });

    return result;
}

/**
 * 根据模块信息生成AST
 *
 * @param {Object} moduleInfo 模块信息，通常是analyseModule的返回结果
 * @return {Object}
 */
function generateModuleAst(moduleInfo) {
    var dependenciesExpr;
    var actualDependencies = moduleInfo.actualDependencies;
    var dependencies = (moduleInfo.dependencies || []).slice(0);

    if (actualDependencies instanceof Array) {
        dependenciesExpr = {
            type: SYNTAX.ArrayExpression,
            elements: []
        };

        var diffDependencies = subtract(
            actualDependencies, 
            intersect(dependencies, actualDependencies)
        );
        dependencies.concat(diffDependencies).forEach(function (dependency) {
            dependenciesExpr.elements.push({
                type: SYNTAX.Literal,
                value: dependency,
                raw: '\'' + dependency + '\''
            });
        });
    }

    var defineArgs = [moduleInfo.factoryAst];
    if (dependenciesExpr) {
        defineArgs.unshift(dependenciesExpr);
    }
    var id = moduleInfo.id;
    if (id) {
        defineArgs.unshift({
            type: SYNTAX.Literal,
            value: moduleInfo.id,
            raw: '\'' + moduleInfo.id + '\''
        });
    }

    return {
        type: SYNTAX.CallExpression,
        callee: {
            type: SYNTAX.Identifier,
            name: LITERAL_DEFINE
        },
        arguments: defineArgs
    };
}

/**
 * 生成模块代码
 *
 * @param {Object|Array.<Object>} moduleInfo 模块信息，通常是analyseModule的返回结果
 * @param {...Object} sourceAst 源文件的AST
 * @return {string}
 */
module.exports = exports = function (moduleInfo, sourceAst) {
    // 统一转化为数组

    if (!(moduleInfo instanceof Array)) {
        moduleInfo = [moduleInfo];
    }


    var ast;
    // 如果没有原始的ast
    // 则按照moduleInfo来生成代码
    if (!sourceAst) {
        ast = {
            type: SYNTAX.Program,
            body: []
        };

        moduleInfo.forEach(function (item) {
            ast.body.push({
                type: SYNTAX.ExpressionStatement,
                expression: generateModuleAst(item)
            });
        });
    }
    // 有原始ast
    // 则对原始ast中module定义的部分进行替换
    else {
        var i = 0;
        ast = estraverse.replace(sourceAst, {
            enter: function (node) {
                if (node.type === SYNTAX.CallExpression
                    && node.callee.name === LITERAL_DEFINE
                ) {
                    if (moduleInfo[i]) {
                        return generateModuleAst(moduleInfo[i++]);
                    }
                }
            }
        });
    }

    return escodegen.generate(ast);
};
