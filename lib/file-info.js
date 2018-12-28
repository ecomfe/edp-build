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
 * @file lib/file-info.js
 * @author leeight
 */

var fs = require('fs');
var edp = require('edp-core');
var iconv = require('iconv-lite');

/**
 * 文件信息类
 *
 * @inner
 * @constructor
 * @param {Object} options 初始化选项
 * @param {Buffer|string} options.data 文件数据
 * @param {string} options.extname 文件扩展名
 * @param {string} options.path 文件路径，相对于构建目录
 * @param {string} options.fullPath 文件完整路径
 * @param {string} options.fileEncoding 文件的文本编码类型
 */
function FileInfo(options) {
    var data = options.data;

    this.fileEncoding = options.fileEncoding;

    this.extname = options.extname;
    this.path = options.path;
    this.fullPath = options.fullPath;
    this.outputPath = this.path;
    this.outputPaths = [];
    this.dataTransfer = {};

    // 保存一份raw data
    // 有的处理器可能直接针对或者获取源数据
    Object.defineProperty(this, 'rawData', {
        enumerable: true,
        get: this.getFileContent.bind(this)
    });

    Object.defineProperty(this, 'data', {
        enumerable: true,
        get: this.dataGetter.bind(this),
        set: this.dataSetter.bind(this)
    });
}

FileInfo.prototype.getFileContent = function () {
    return fs.readFileSync(this.fullPath);
}

FileInfo.prototype.dataGetter = function () {
    if (this._data) {
        return this._data;
    }

    var data = this.rawData;
    this._data = this.processData(data);
    return this._data;
}

FileInfo.prototype.dataSetter = function (data) {
    this._data = this.processData(data);
}

FileInfo.prototype.processData = function (data) {
    // 初始化FileInfo的data属性
    // 二进制文件data为buffer，文本文件data为字符串
    if (!this.fileEncoding) {
        if (edp.fs.isBinary(data)) {
            return data;
        }
        else {
            this.fileEncoding = 'UTF-8';
        }
    }

    if (this.fileEncoding) {
        if (/^utf-?8$/i.test(this.fileEncoding)) {
            // 删除UTF-8文件BOM
            if (data[0] === 0xEF
                 && data[1] === 0xBB
                 && data[2] === 0xBF) {
                data = data.slice(3);
            }

            return data.toString(this.fileEncoding);
        }
        else if (iconv.encodingExists(this.fileEncoding)) {
            return iconv.decode(data, this.fileEncoding);
        }
        else {
            this.fileEncoding = null;
            return data;
        }
    }
}


/**
 * 将数据转换成buffer并返回
 *
 * @return {Buffer}
 */
FileInfo.prototype.getDataBuffer = function () {
    var data = this.data;

    if (typeof data === 'string') {
        if (/^utf-?8$/i.test(this.fileEncoding)) {
            return new Buffer(data, this.fileEncoding);
        }
        return iconv.encode(data, this.fileEncoding);
    }

    return data;
};

/**
 * 设置文件数据
 *
 * @param {Buffer|string} data 文件数据
 */
FileInfo.prototype.setData = function (data) {
    this.data = data;
};

/**
 * 获取属性数据信息。该数据信息用于processor存储文件处理状态
 *
 * @param {string} name 属性名
 * @return {*}
 */
FileInfo.prototype.get = function (name) {
    return this.dataTransfer[name];
};

/**
 * 设置属性数据信息。该数据信息用于processor存储文件处理状态
 *
 * @param {string} name 属性名
 * @param {*} value 属性值
 */
FileInfo.prototype.set = function (name, value) {
    this.dataTransfer[name] = value;
};

/**
 * 获取文件内容的md5签名
 * @param {number=} start 开始位置.
 * @param {number=} end 结束位置.
 * @return {string}
 */
FileInfo.prototype.md5sum = function (start, end) {
    start = start || 0;
    end = end || 32;

    var result = this.get('md5sum');
    if (result) {
        return result.slice(start, end);
    }

    var crypto = require('crypto');
    var md5 = crypto.createHash('md5');
    md5.update(this.getDataBuffer());
    result = md5.digest('hex');
    this.set('md5sum', result);

    return result.slice(start, end);
};

module.exports = exports = FileInfo;
