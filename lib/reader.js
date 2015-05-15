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
 * @file reader.js
 * @author leeight
 */

var edp = require('edp-core');
var debug = require('debug')('reader');

/**
 * 主要目的是根据模块Id读取模块的内容，需要注意的是模块的内容
 * 可能会随着Processor的执行而发生变化.
 *
 * @constructor
 * @param {Object} ctx ProcessContext
 * @param {string} moduleConfig module.conf的配置文件路径.
 */
function Reader(ctx, moduleConfig) {
    this._ctx = ctx;
    this._moduleConfig = moduleConfig;
}

/**
 * @param {string} depId 需要读取的模块Id信息.
 * @return {?string}
 */
Reader.prototype.readById = function (depId) {
    var depFile = edp.amd.getModuleFile(depId, this._moduleConfig);
    debug('readById(%s) => (%s)', depId, depFile);

    // 根据 edp.amd.getModuleFile 的实现，如果返回值是null
    // 应该是触发了 !edp.path.isRelativePath 的情况，因此
    // 忽略这个模块就好了.
    if (depFile == null) {
        return null;
    }

    var relativedFilePath = edp.path.relative(this._ctx.baseDir, depFile);
    var fileInfo = this._ctx.getFileByPath(relativedFilePath);
    if (!fileInfo) {
        edp.log.warn('Failed locate file by depId = %j, path = %j', depId, relativedFilePath);
        return null;
    }

    return fileInfo.data;
};

module.exports = Reader;










/* vim: set ts=4 sw=4 sts=4 tw=120: */
