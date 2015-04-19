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
 * @file lib/process-context.js
 * @author leeight
 */
var u = require('underscore');
var edp = require('edp-core');

var helper = require('./helper');

/**
 * 构建处理环境类
 *
 * @inner
 * @constructor
 * @param {Object} options 初始化选项
 * @param {string} options.baseDir 构建基础目录
 * @param {Array.<string>} options.exclude 构建排除文件列表
 * @param {string} options.outputDir 构建输出目录
 * @param {Object} options.fileEncodings 文件编码表
 */
function ProcessContext(options) {
    this.files = {};
    this.linkPaths = {};

    this.baseDir = options.baseDir;
    this.exclude = options.exclude;
    this.outputDir = options.outputDir;
    this.fileEncodings = options.fileEncodings;
}

/**
 * 添加处理文件
 *
 * @param {FileInfo} fileInfo 文件信息
 */
ProcessContext.prototype.addFile = function (fileInfo) {
    this.files[fileInfo.path] = fileInfo;
};

/**
 * 获取处理文件列表
 *
 * @return {Array.<FileInfo>}
 */
ProcessContext.prototype.getFiles = function () {
    var files = this.files;
    var result = [];
    var keys = Object.keys(files);
    keys.forEach(function (key) {
        result.push(files[key]);
    });

    return result;
};

/**
 * 根据glob patterns获取处理文件列表
 *
 * @param {Array.<string>} patterns 需要检查的特征列表.
 * @return {Array.<FileInfo>}
 */
ProcessContext.prototype.getFilesByPatterns = function (patterns) {
    return edp.glob.filter(u.flatten(patterns), this.getFiles(),
        function (pattern, item) {
            return helper.satisfy(item.path, pattern);
        });
};

/**
 * 根据路径获取处理文件
 *
 * @param {string} path 路径
 * @return {FileInfo}
 */
ProcessContext.prototype.getFileByPath = function (path) {
    var file = this.files[path];

    if (!file) {
        file = this.files[this.linkPaths[path]];
    }
    return file || null;
};

/**
 * 删除一个文件
 *
 * @param {string} path 路径.
 */
ProcessContext.prototype.removeFile = function (path) {
    delete this.files[path];
};

/**
 * 添加路径软连接映射
 *
 * @param {string} path 路径
 * @param {string} linkPath 映射路径
 */
ProcessContext.prototype.addFileLink = function (path, linkPath) {
    this.linkPaths[linkPath] = path;
};


module.exports = exports = ProcessContext;

