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
 * @file lib/module.js
 * @author leeight
 */

var helper = require('./helper');

/**
 * @constructor
 * @param {string} moduleId 模块的Id.
 * @param {CompilerContext} ctx 整个Compiler的上下文环境，提供必要的api和保存一些全局的数据.
 * @param {BundleConfig=} bundleConfig combine配置信息.
 */
function Module(moduleId, ctx, bundleConfig) {
    this.moduleId = moduleId;
    this.compilerContext = ctx;
    this.bundleConfig = bundleConfig || ctx.getBundleConfig(moduleId);
    this.definition = null;
    this.debug = require('debug')(moduleId);
    this.prepare();
}

/**
 * 初始化 this.definition 的内容
 */
Module.prototype.prepare = function () {
    this.definition = this.compilerContext.getModuleDefinition(this.moduleId);
    if (!this.definition) {
        return;
    }

    // File -> [Mod 1, Mod 2, ..., Mod N]
    // Mod
    //   -> Alias [Mod 1, Mod 2, ..., Mod N]
    //   -> Deps  [Mod 1, Mod 2, ..., Mod N]
    //   -> Includes [Mod 1, Mod 2, ..., Mod N]
    //   -> Excludes [Mod 1, Mod 2, ..., Mod N]
    if (this.bundleConfig) {
        this.bundleConfig.addExclude(this.moduleId);
        var defs = this.definition.modDefs;

        defs.forEach(function (def) {
            if (!def.id) {
                def.id = this.moduleId;
            }

            // 因为这些模块已经包含在代码里面了，所以后续
            // 递归处理的时候，如果遇到了就不需要处理这些模块了
            this.bundleConfig.addExclude(def.id);
        }, this);
    }
};

Module.prototype.toBundle = function () {
    if (!this.definition) {
        this.debug('No definition');
        return '';
    }

    var codes = [];

    if (this.bundleConfig) {
        // 如果需要合并的话，这里会往 codes 里面添加一些所依赖模块的代码.
        // this.defs 的 类型是 Array.<Object>
        // this.bundleConfig.getIncludes() 的类型是 Array.<string>
        // 为了可以调用 this._bundleSingleModule 的接口，我们把 getIncludes() 返回的
        // 内容包装成 this._bundleSingleModule 所需要的格式 { id: string, actualDependencies: [string] }
        var extraDefs = this.bundleConfig.getIncludes().map(function (id) {
            return {
                id: id,
                actualDependencies: [id]
            };
        });
        var defs = [].concat(this.definition.modDefs).concat(extraDefs);
        defs.forEach(function (def) {
            codes.push.apply(codes, this._bundleSingleModule(def));
        }, this);
    }

    // 现在是当前模块的代码
    codes.push(this.compilerContext.generateCode(this.definition));

    var pkgDef = this.definition.pkgDef;
    if (pkgDef) {
        // 当模块是一个package时，需要生成代理模块代码，原模块代码自动附加的id带有`main`
        // 否则，具名模块内部使用相对路径的require可能出错
        codes.push(this._getPackageMainDef(pkgDef));
    }
    else {
        codes.push.apply(codes, this._getAliasDef(this.moduleId));
    }

    return codes.join('\n\n');
};

/**
 * @param {Object} def 模块的定义信息（一个文件中可能有多个，这只是其中的一个）.
 * @return {Array.<string>}
 */
Module.prototype._bundleSingleModule = function (def) {
    var moduleId = def.id;

    // 初始化当前模块的所有依赖模块信息
    // 剥离resource里的moduleId，以及对依赖的moduleId进行normalize
    // er -> require('./util')
    // ./util -> er/util
    var deps = (def.actualDependencies || []).map(function (id) {
        var depId = helper.resolveModuleId(id.split('!')[0], moduleId);
        return depId;
    });

    var codes = [];

    deps.forEach(function (depId) {
        // 有了 moduleId 和 depId
        // 那么就可以从 this.compilerContext.moduleMapConfigs 来看看
        // 是不是 depId 已经被改成其它的名字了
        depId = this.compilerContext.getXXX(moduleId, depId);

        if (this.bundleConfig.isExcluded(depId)) {
            return;
        }

        this.bundleConfig.addExclude(depId);

        // 这里创建 Module 实例的时候，传递了 this.bundleConfig 参数，主要是
        // 为了后续递归的时候保留 excludes 的信息.
        var module = new Module(depId, this.compilerContext, this.bundleConfig);
        codes.push(module.toBundle());
    }, this);

    return codes;
};

/**
 * 因为module.conf里面的配置导致模块存在别名，这是一个很正常的情况，但是
 * 对于build代码来说是很SB的情况
 *
 * {
 *   "paths": {
 *     "tpl": "common/tpl"
 *   }
 * }
 *
 * // src/common/main.js
 * define(function(require){
 *   require('tpl');
 *   require('./tpl');
 *   require('common/tpl');
 * });
 *
 * 那么当合并 common/main 的时候，需要合并两个文件
 *
 * 1. src/common/main.js
 * 2. src/common/tpl.js
 *
 * 代码里面需要出现3个module id的定义
 *
 * define('common/tpl', ...)
 * define('tpl', function(require){ return require('common/tpl'); });
 * define('common/main', ...)
 *
 * @private
 * @param {Object} def 模块的定义信息.
 * @return {string}
 */
Module.prototype._getAliasDef = function () {
    var util = require('util');
    var codes = [];
    var tpl = '\n/** d e f i n e */\ndefine(\'%s\', [\'%s\'], function (target) { return target; });';

    var currentModuleId = this.moduleId;
    var moduleIdAliases = this.compilerContext.getModuleIdAlias(currentModuleId);
    if (!moduleIdAliases) {
        return;
    }

    moduleIdAliases.forEach(function (moduleId) {
        if (this.bundleConfig) {
            if (this.bundleConfig.isExcluded(moduleId)) {
                return;
            }
            this.bundleConfig.addExclude(moduleId);
        }
        if (moduleId !== currentModuleId) {
            codes.push(util.format(tpl, moduleId, currentModuleId));
        }
    }, this);

    return codes;
};

/**
 * @private
 * @param {Object} pkgDef The package definition.
 * @return {string}
 */
Module.prototype._getPackageMainDef = function (pkgDef) {
    var id = pkgDef.name;
    var mod = pkgDef.module;
    return 'define(\'' + id + '\', [\'' + mod
        + '\'], function (main) { return main; });';
};

module.exports = Module;








/* vim: set ts=4 sw=4 sts=4 tw=120: */
