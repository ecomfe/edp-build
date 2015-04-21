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
 * @file lib/helper.js
 * @author leeight
 */

var edp = require('edp-core');

// 以下代码来自于
// http://s1.bdstatic.com/r/www/cache/ecom/esl/2-0-6/esl.source.js

/**
 * @param {string} path 源路径
 * @param {string} pattern 路径规则
 * @return {boolean}
 */
exports.satisfy = (function () {
    var cache = {};
    return function (path, pattern, stat) {
        var key = path + ':' + pattern;
        if (cache.hasOwnProperty(key)) {
            return cache[key];
        }
        var value = edp.path.satisfy(path, pattern, stat);
        return (cache[key] = value);
    };
})();

exports.resolveModuleId = (function () {
    var cache = {};
    return function (a, b) {
        var key = a + ':' + b;
        if (cache.hasOwnProperty(key)) {
            return cache[key];
        }
        var value = edp.amd.resolveModuleId(a, b);
        return (cache[key] = value);
    };
})();

exports.getModuleId = (function () {
    var cache = {};
    return function (a, b) {
        var key = a + ':' + b;
        if (cache.hasOwnProperty(key)) {
            return cache[key];
        }
        var value = edp.amd.getModuleId(a, b);
        return (cache[key] = value);
    };
})();

/**
 * 将key为module id prefix的Object，生成数组形式的索引，并按照长度和字面排序
 *
 * @inner
 * @param {Object} value 源值
 * @param {boolean} allowAsterisk 是否允许*号表示匹配所有
 * @return {Array} 索引对象
 */
exports.createKVSortedIndex = function (value, allowAsterisk) {
    var index = exports.kv2List(value, 1, allowAsterisk);
    index.sort(descSorterByKOrName);
    return index;
};

/**
 * 将对象数据转换成数组，数组每项是带有k和v的Object
 *
 * @inner
 * @param {Object} source 对象数据
 * @param {boolean} keyMatchable key是否允许被前缀匹配
 * @param {boolean} allowAsterisk 是否支持*匹配所有
 * @return {Array.<Object>} 对象转换数组
 */
exports.kv2List = function (source, keyMatchable, allowAsterisk) {
    var list = [];
    for (var key in source) {
        if (source.hasOwnProperty(key)) {
            var item = {
                k: key,
                v: source[key]
            };
            list.push(item);

            if (keyMatchable) {
                item.reg = key === '*' && allowAsterisk
                    ? /^/
                    : createPrefixRegexp(key);
            }
        }
    }

    return list;
};

/**
 * 创建id前缀匹配的正则对象
 *
 * @inner
 * @param {string} prefix id前缀
 * @return {RegExp} 前缀匹配的正则对象
 */
function createPrefixRegexp(prefix) {
    return new RegExp('^' + prefix + '(/|$)');
}

/**
 * 根据元素的k或name项进行数组字符数逆序的排序函数
 *
 * @inner
 * @param {Object} a 要比较的对象a
 * @param {Object} b 要比较的对象b
 * @return {number} 比较结果
 */
function descSorterByKOrName(a, b) {
    var aValue = a.k || a.name;
    var bValue = b.k || b.name;

    if (bValue === '*') {
        return -1;
    }

    if (aValue === '*') {
        return 1;
    }

    return bValue.length - aValue.length;
}









/* vim: set ts=4 sw=4 sts=4 tw=120: */
