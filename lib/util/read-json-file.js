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
 * @file read-json-file.js
 * @author leeight
 */

var fs = require('fs');

/**
 * 读取json文件
 *
 * @param {string} file 文件路径
 * @return {Object}
 */
module.exports = exports = function (file) {
    var content = fs.readFileSync(file, 'UTF-8');
    if (content.charCodeAt(0) === 0xFEFF) {
        content = content.slice(1);
    }

    return JSON.parse(content);
};
