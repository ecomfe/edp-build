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

var u = require('underscore');
var edp = require('edp-core');

/**
 * @constructor
 * @param {string} moduleId 模块的Id.
 * @param {CompilerContext} ctx 整个Compiler的上下文环境，提供必要的api和保存一些全局的数据.
 * @param {BundleConfig=} opt_bundleConfig
 */
function Module(moduleId, ctx, opt_bundleConfig) {
    this.moduleId = moduleId;
    this.compilerContext = ctx;
    this.bundleConfig = opt_bundleConfig || ctx.getBundleConfig(moduleId);

    this.defs = [];
    this.ast = null;

    /**
     * 从 module.conf 解析出来的 package 的配置信息
     * 并不是所有的模块都会有这个信息，例如：
     * 解析 dep/er/3.1.0-beta.6/src/main.js 的时候可以有这个配置信息，但是
     * 解析 dep/er/3.1.0-beta.6/src/ajax.js 的时候就没有了.
     * @type {Object}
     */
    this.pkgDef = null;

    this.prepare();
}

/**
 * 初始化 this.defs, this.ast 的内容
 */
Module.prototype.prepare = function () {
    var code = this.compilerContext.getReader().readById(this.moduleId);
    var ast = edp.amd.getAst(code);
    if (!ast) {
        return;
    }

    // analyseModule 的逻辑是
    // 1. 如果没有 defs，返回 null
    // 2. 如果有一个 def，然后这一个def
    // 3. 否则返回一个 def 的数组
    var defs = edp.amd.analyseModule(ast) || [];
    if (!Array.isArray(defs)) {
        defs = [defs];
    }

    if (defs.length === 1 && !defs[0].id) {
        // 说明这个文件只有一个匿名的模块.
        // 大部分时候都符合这个逻辑.
        // src/foo.js
        // define(function (require) { return {}; });

        var pkgDef = this.compilerContext.getPackageDef(this.moduleId);
        if (pkgDef) {
            defs[0].id = pkgDef.module;
            this.pkgDef = pkgDef;
        }
        else {
            defs[0].id = this.moduleId;
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

    if (this.bundleConfig) {
        this.bundleConfig.addExclude(this.moduleId);
        u.each(defs, function (def) {
            if (!def.id) {
                def.id = this.moduleId;
            }

            // 因为这些模块已经包含在代码里面了，所以后续
            // 递归处理的时候，如果遇到了就不需要处理这些模块了
            this.bundleConfig.addExclude(def.id);
        }, this);
    }

    this.defs = defs;
    this.ast = ast;
};

Module.prototype.toBundle = function () {
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
        var defs = [].concat(this.defs).concat(extraDefs);
        u.each(defs, function (def) {
            codes.push.apply(codes, this._bundleSingleModule(def));
        }, this);
    }

    // 现在是当前模块的代码
    codes.push(this.compilerContext.generateCode(this.defs, this.ast));

    if (this.pkgDef) {
        // 当模块是一个package时，需要生成代理模块代码，原模块代码自动附加的id带有`main`
        // 否则，具名模块内部使用相对路径的require可能出错
        codes.push(this._getPackageMainDef());
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
    var deps = u.map(def.actualDependencies, function (id) {
        var depId = edp.amd.resolveModuleId(id.split('!')[0], moduleId);
        return depId;
    });

    var codes = [];

    u.each(deps, function (depId) {
        if (this.bundleConfig.isExcluded(depId)) {
            return;
        }

        this.bundleConfig.addExclude(depId);

        // 这里创建 Module 实例的时候，传递了 this.bundleConfig 参数，主要是
        // 为了后续递归的时候保留 excludes 的信息.
        var module = new Module(depId, this.compilerContext, this.bundleConfig);
        codes.push(module.toBundle());
    }, this);

    codes.push.apply(codes, this._getAliasDef(def));

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
Module.prototype._getAliasDef = function (def) {
    var util = require('util');
    var codes = [];
    var tpl = '\n/** d e f i n e */\ndefine(\'%s\', [\'%s\'], function (target) { return target; });';

    var moduleIdAlias = this.compilerContext.getModuleIdAlias(def.id);
    if (!moduleIdAlias) {
        return;
    }

    u.each(moduleIdAlias, function (moduleId) {
        if (this.bundleConfig) {
            if (this.bundleConfig.isExcluded(moduleId)) {
                return;
            }
            this.bundleConfig.addExclude(moduleId);
            codes.push(util.format(tpl, moduleId, def.id));
        }
        else {
            if (moduleId !== def.id) {
                codes.push(util.format(tpl, moduleId, def.id));
            }
        }
    }, this);

    return codes;
};

/**
 * @private
 * @return {string}
 */
Module.prototype._getPackageMainDef = function () {
    var id = this.pkgDef.name;
    var mod = this.pkgDef.module;
    return 'define(\'' + id + '\', [\'' + mod
        + '\'], function (main) { return main; });';
};

module.exports = Module;








/* vim: set ts=4 sw=4 sts=4 tw=120: */
