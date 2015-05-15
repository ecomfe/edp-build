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
 * @file lib/compiler-context.js
 * @author leeight
 */

var u = require('underscore');
var edp = require('edp-core');
var debug = require('debug')('compiler-context');

var helper = require('./helper');
var BundleConfig = require('./bundle-config');
var ModuleDefinition = require('./module-definition');
var getPackageInfo = require('./util/get-package-info');
var generateModuleCode = require('./util/generate-module-code');

/**
 * @constructor
 * @param {ProcessContext} pctx ProcessContext.
 * @param {string} moduleConfig module.conf的路径.
 * @param {Object} reader 读取模块源码的对象.
 * @param {Object} moduleCombineConfigs combine字段的内容.
 * @param {Object} moduleMapConfigs map字段的内容.
 */
function CompilerContext(pctx, moduleConfig, reader, moduleCombineConfigs, moduleMapConfigs) {
    this._pctx = pctx;
    this._moduleConfig = moduleConfig;
    this._reader = reader;

    /**
     * 因为初始化 BundleConfig 的代价比较大，因此在这里记录一下已经初始化好的示例
     * 代价主要体现在需要多次扫描 AllModules
     *
     * 这个内容来自于 module.conf 的配置 或者 ModuleCompiler 的 getCombineConfig 的返回值
     * 因此不能直接从 `this._moduleConfig` 里面读取.
     *
     * @type {Object.<string, BundleConfig>}
     */
    this._moduleCombineConfigs = moduleCombineConfigs;

    this._moduleMapConfigs = helper.createKVSortedIndex(moduleMapConfigs, 1);
    u.each(this._moduleMapConfigs, function (item) {
        item.v = helper.createKVSortedIndex(item.v);
    });
    debug('%j', this._moduleMapConfigs);

    /**
     * 用来记录项目中所有的 Module Id 的信息.
     * @type {Array.<string>}
     */
    this._allModules = null;

    /**
     * 二维数组.
     * @type {Array.<Array.<string>>}
     */
    this._aliasModules = [];

    /**
     * key 是 module id
     * value 是 _aliasModules 的 index
     * @type {Object.<string, number>}
     */
    this._aliasModulesMap = {};

    /**
     * 缓存模块的定义信息.
     * @type {Object.<string, ModuleDefinition>}
     */
    this._moduleDefinitions = {};

    this.prepare();
}

CompilerContext.prototype.prepare = function () {
    this._initAllModules();
};

/**
 * @return {Object} 根据Module Id获取模块的内容，可以通过fs或者processContext中读取.
 */
CompilerContext.prototype.getReader = function () {
    return this._reader;
};

/**
 * 如果这个模块在 module.conf 里面配置了 combine 的信息，那么
 * 通过这个接口就可以获取对应的 BundleConfig 的实例.
 *
 * @param {string} moduleId 模块的Id
 * @return {?BundleConfig}
 */
CompilerContext.prototype.getBundleConfig = function (moduleId) {
    var bundleConfig = this._moduleCombineConfigs[moduleId];
    if (!bundleConfig) {
        // 如果配置了 "x": false 或者 "x": 0 的情况，那么也就不要合并了.
        return null;
    }

    return new BundleConfig(bundleConfig, this, moduleId);
};

CompilerContext.prototype.getModuleDefinition = function (moduleId) {
    var definition = this._moduleDefinitions[moduleId];
    if (definition != null) {
        return definition;
    }

    var code = this.getReader().readById(moduleId);
    // TODO Handle aliased module id
    if (!code) {
        debug('readById(%s) failed', moduleId);
        return null;
    }

    var ast = edp.amd.getAst(code);
    if (!ast) {
        debug('edp.amd.getAst(%s) failed', moduleId);
        return null;
    }

    var defs = edp.amd.analyseModule(ast) || [];
    if (!Array.isArray(defs)) {
        defs = [defs];
    }

    /**
     * 『包』的定义信息.
     * 从 module.conf 解析出来的 package 的配置信息
     * 并不是所有的模块都会有这个信息，例如：
     * 解析 dep/er/3.1.0-beta.6/src/main.js 的时候可以有这个配置信息，但是
     * 解析 dep/er/3.1.0-beta.6/src/ajax.js 的时候就没有了.
     */
    var pkgDef = null;

    if (defs.length === 1 && !defs[0].id) {
        // 说明这个文件只有一个匿名的模块.
        // 大部分时候都符合这个逻辑.
        // src/foo.js
        // define(function (require) { return {}; });
        pkgDef = this._getPackageDef(moduleId);
        if (pkgDef) {
            defs[0].id = pkgDef.module;
        }
        else {
            defs[0].id = moduleId;
        }
    }
    else if (defs.length > 1) {
        // src/foo.js
        // define(function (require) { return {}; });
        // define('bar1', function (require) { return {}; });
        // define('bar2', function (require) { return {}; });
        //
        // 如果存在多个匿名的模块，说明是有问题的，对吧?
        // 这种情况比较少，先不处理了 (TODO)

        // 如果全部都是具名的模块，那么合并的时候，这些id应该被排除掉的，对吧?
    }

    definition = new ModuleDefinition(defs, pkgDef, ast);
    this._moduleDefinitions[moduleId] = definition;

    return definition;
};

/**
 * 根据 map 的配置，返回新的 depId（如果有的话），如果没有，返回
 * 参数中的 depId
 *
 * @param {string} moduleId 模块Id.
 * @param {string} depId 模块所依赖的模块Id.
 * @return {string}
 */
CompilerContext.prototype.getXXX = function (moduleId, depId) {
    for (var i = 0; i < this._moduleMapConfigs.length; i++) {
        var item = this._moduleMapConfigs[i];
        if (!item.reg.test(moduleId)) {
            continue;
        }

        var value = item.v;
        debug('value = %j', value);
        for (var j = 0; j < value.length; j++) {
            if (value[j].reg.test(depId)) {
                return depId.replace(value[j].k, value[j].v);
            }
        }
    }

    return depId;
};

CompilerContext.prototype.getAllModules = function () {
    return this._allModules || [];
};

/**
 * @private
 */
CompilerContext.prototype._initAllModules = function () {
    var allModules = [];
    var moduleConfig = this._moduleConfig;

    Object.keys(this._pctx.files).forEach(function (file) {
        if (!/\.js$/.test(file)) {
            return;
        }

        // abs不一定真正在磁盘上存在.
        var abs = edp.path.resolve(this._pctx.baseDir, file);
        var moduleIds = helper.getModuleId(abs, moduleConfig);
        if (moduleIds.length) {
            allModules.push.apply(allModules, moduleIds);
            if (moduleIds.length > 1) {
                debug('%j = %j', file, moduleIds);
                this._addToAliasMap(moduleIds);
            }
        }
    }, this);

    this._allModules = allModules;
};

/**
 * 记录一下项目中重名的模块
 * [
 *   [],
 *   []
 * ],
 * {
 *   "id1": 0,
 *   "id2": 0
 * }
 * @param {Array.<string>} moduleIds 重名的模块数组列表.
 */
CompilerContext.prototype._addToAliasMap = function (moduleIds) {
    var found = false;
    moduleIds.forEach(function (moduleId) {
        found = found || (this._aliasModulesMap[moduleId] != null);
    }, this);

    if (!found) {
        this._aliasModules.push(moduleIds);
        var value = this._aliasModules.length - 1;
        moduleIds.forEach(function (moduleId) {
            this._aliasModulesMap[moduleId] = value;
        }, this);
    }
};

/**
 * CompilerContext初始化的时候会遍历项目中所有的模块，同时记录下具有别名的模块信息
 * 后续输出代码的时候，如果需要输出别名，就调用这个函数查询一下.
 *
 * @param {string} moduleId 模块的Id.
 * @return {?Array.<string>} 模块的别名，如果没有的话，返回null.
 */
CompilerContext.prototype.getModuleIdAlias = function (moduleId) {
    var value = this._aliasModulesMap[moduleId];
    if (value == null) {
        return null;
    }

    return this._aliasModules[value];
};

/**
 * @private
 * @param {string} moduleId 模块的Id.
 * @return {?Object}
 */
CompilerContext.prototype._getPackageDef = function (moduleId) {
    var pkgDef = getPackageInfo(moduleId, this._moduleConfig);
    return pkgDef;
};

/**
 * 根据 defs 和 ast 的信息生成最终的代码.
 * @param {ModuleDefinition} definition 模块的定义信息.
 * @return {string}
 */
CompilerContext.prototype.generateCode = function (definition) {
    var defs = definition.modDefs;
    var ast = definition.ast;
    return generateModuleCode(defs, ast);
};


module.exports = CompilerContext;











/* vim: set ts=4 sw=4 sts=4 tw=120: */
