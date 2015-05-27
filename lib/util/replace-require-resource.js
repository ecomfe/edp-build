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
 * @file replace-require-resource.js
 * @author leeight
 */

var edp = require('edp-core');
var estraverse = require('estraverse');
var SYNTAX = estraverse.Syntax;
var LITERAL_REQUIRE = 'require';

var generateModuleCode = require('./generate-module-code');


/**
 * 判断是否是符合需要的resourceId
 * @param {string} depId The dep id.
 * @param {Array.<string>} pluginIds The plugin Ids.
 * @param {Object} moduleInfo The module info.
 * @return {boolean}
 */
function isMatchPluginId(depId, pluginIds, moduleInfo) {
    if (depId.indexOf('!') === -1) {
        return false;
    }

    var parts = depId.split('!');
    var pluginId = parts[0];
    if (pluginIds.indexOf(pluginId) !== -1) {
        return true;
    }
    else if (pluginId[0] === '.' && moduleInfo.id) {
        pluginId = edp.amd.resolveModuleId(pluginId, moduleInfo.id);
        return pluginIds.indexOf(pluginId) !== -1;
    }
    return false;
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
function processModuleReplace(moduleInfo, pluginIds, resourceReplacer) {
    // replace resourceId which on dependencies
    [moduleInfo.dependencies, moduleInfo.actualDependencies].forEach(function (dependencies) {
        if (!dependencies) {
            return;
        }

        for (var i = 0; i < dependencies.length; i++) {
            var depId = dependencies[i];
            if (isMatchPluginId(depId, pluginIds, moduleInfo)) {
                dependencies[i] = resourceReplacer(depId);
            }
        }
    });

    var factoryAst = moduleInfo.factoryAst;
    // replace resourceId which on function body
    if (factoryAst.type === SYNTAX.FunctionExpression) {
        estraverse.traverse(
            factoryAst,
            {
                enter: function (item) {
                    if (item.type !== SYNTAX.CallExpression) {
                        return;
                    }

                    var arg0;

                    if (item.callee.name === LITERAL_REQUIRE
                        && (arg0 = item.arguments[0])
                        && arg0.type === SYNTAX.Literal
                        && typeof arg0.value === 'string'
                   ) {
                        if (isMatchPluginId(arg0.value, pluginIds, moduleInfo)) {
                            arg0.value = resourceReplacer(arg0.value);
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
module.exports = exports = function (code, pluginId, resourceReplacer) {
    var ast = edp.amd.getAst(code);
    if (!ast) {
        return code;
    }

    var moduleInfo = edp.amd.analyseModule(ast);
    if (!moduleInfo) {
        return code;
    }

    // 模块分析的返回结果可能是一个模块对象，也可能是模块对象数组
    // 这里做一次统一数组类型，方便后面处理
    if (!Array.isArray(moduleInfo)) {
        moduleInfo = [moduleInfo];
    }

    var pluginIds = pluginId;
    if (typeof pluginIds === 'string') {
        pluginIds = [pluginIds];
    }

    // 处理模块替换
    moduleInfo.forEach(function (item, index) {
        moduleInfo[index] = processModuleReplace(item, pluginIds, resourceReplacer);
    });

    return generateModuleCode(moduleInfo, ast);
};
