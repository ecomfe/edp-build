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
 * @file lib/bundle-config.js
 * @author leeight
 */

var u = require('underscore');

var helper = require('./helper');

/**
 * 一个模块的 Include 和 Exclude 是这样子工作的
 * 1. 解析 foo.js，可以得到一个模块定义的集合，可以把数据结构简化为这个样子
 *    {
 *        excludes: ['id1', 'id2', 'id3'],
 *        modules: [
 *            {id: 'id1', includes: Array.<string>},
 *            {id: 'id2', includes: Array.<string>},
 *            {id: 'id3', includes: Array.<string>},
 *        ]
 *    }
 * 2. 在 module.conf 里面我们可以给 `id` 配置一些 `规则`，通过这些规则我们遍历一次 `所有的模块Id`，就可以
 *    知道这个模块Id 应该是 exclude 还是 include 的状态，例如：
 *    {
 *        "id1": { "modules": ["~er", "!esui/Button"] }
 *    }
 *    此时把得到的 includes 和 excludes 来合并一下
 * 3. 合并的规则是这样子的
 *    excludes 是两个数组简单的合并起来即可
 *    includes 只在入口阶段生效，递归的时候是不生效的(?)
 * @constructor
 * @param {Object|*} config module.conf中的配置.
 * @param {CompilerContext} ctx CompilerContext
 * @param {string} moduleId The module id.
 */
function BundleConfig(config, ctx, moduleId) {
    this._config = config;
    this._ctx = ctx;
    this.debug = require('debug')(moduleId);
    this._excludes = {
        require: true,
        module: true,
        exports: true
    };

    this._includes = {};

    this._patterns = [];

    this.prepare();
}

BundleConfig.prototype.prepare = function () {
    if (!this._config) {
        return;
    }

    // https://github.com/ecomfe/edp/issues/187
    // files模式 vs include+exclude模式
    var patterns = null;
    var modules = this._config.files || this._config.modules;
    if (!modules || !Array.isArray(modules)) {
        // 如果存在include和exclude，那么 modules = include.concat(exclude)
        var includeModulePatterns = u.flatten(this._config.include || []);
        var excludeModulePatterns = u.flatten(this._config.exclude || []);
        patterns = includeModulePatterns.concat(
            excludeModulePatterns.map(function (item) {
                return '!' + item;
            }));
    }
    else {
        patterns = u.flatten(modules);
    }

    this._patterns = patterns;
    this._initExplicitModules();
};

BundleConfig.cache = {};
BundleConfig.readCache = function (instance) {
    var key = JSON.stringify(instance._patterns);
    var value = BundleConfig.cache[key];
    if (value) {
        var json = JSON.parse(value);
        instance._excludes = json._excludes;
        instance._includes = json._includes;
        return true;
    }

    return false;
};

BundleConfig.writeCache = function (instance) {
    var key = JSON.stringify(instance._patterns);
    /*eslint-disable*/
    BundleConfig.cache[key] = JSON.stringify({
        _excludes: instance._excludes,
        _includes: instance._includes
    });
    /*eslint-enable*/
};

BundleConfig.prototype._initExplicitModules = function () {
    if (BundleConfig.readCache(this)) {
        return;
    }

    // 具名的 Module Id 在这里面
    var allModules = this._ctx.getAllModules();
    allModules.forEach(function (moduleId) {
        var match = 0;    // 0 (init) 1 (match) 2 (not match)
        this._patterns.forEach(function (pattern) {
            // 用 moduleId 在 patterns 里面走一遍，最终的结果要么是 exclude，要么是 include
            // 应该没有其它的结果了
            if (pattern[0] === '!') {
                pattern = pattern.substring(1);
                if ((match !== 2) && helper.satisfy(moduleId, pattern)) {
                    this._excludes[moduleId] = true;
                    delete this._includes[moduleId];
                    match = 2;
                }
            }
            else {
                // 如果当前已经处于 Match 的状态了，那么就不需要调用 helper.satisfy 进行检查了
                if ((match !== 1) && helper.satisfy(moduleId, pattern)) {
                    this._includes[moduleId] = true;
                    delete this._excludes[moduleId];
                    match = 1;
                }
            }
        }, this);
    }, this);

    BundleConfig.writeCache(this);
};

BundleConfig.prototype.getIncludes = function () {
    return Object.keys(this._includes);
};

/**
 * 判断一个模块是否被排除了
 * @param {string} depId 模块Id.
 * @return {boolean}
 */
BundleConfig.prototype.isExcluded = function (depId) {
    return this._excludes[depId];
};

/**
 * 把一个模块加入到排除列表里面去，常见的情况是已经合并过代码了
 * 后续的递归处理就需要排除掉.
 *
 * @param {string} depId 模块Id.
 */
BundleConfig.prototype.addExclude = function (depId) {
    if (!this._excludes[depId]) {
        this.debug('BundleConfig.addExclude(%j)', depId);
        this._excludes[depId] = true;
    }
};

module.exports = BundleConfig;










/* vim: set ts=4 sw=4 sts=4 tw=120: */
