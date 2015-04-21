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
 * @file read-loader-config.js
 * @author leeight
 */

/**
 * 从内容中读取loader配置信息
 *
 * @param {string} content 内容
 * @return {Object}
 */
module.exports = exports = function (content) {
    var outputInfo = {};
    var index = content.search(/(require\.config\(\s*\{)/);
    if (index < 0) {
        return;
    }

    index += RegExp.$1.length - 1;

    // 取文件内容
    outputInfo.content = content;

    // 取缩进层级
    var whitespace = 0;
    var startIndex = index;
    while (content[--startIndex] === ' ') {
        whitespace++;
    }
    outputInfo.indentBase = whitespace / 4 + 1;

    // 查找loader config串的开始和结束位置
    var len = content.length;
    var braceLevel = 0;
    outputInfo.fromIndex = index;
    do {
        switch (content[index]) {
            case '{':
                braceLevel++;
                break;
            case '}':
                braceLevel--;
                break;
        }

        index++;
    } while (braceLevel && index < len);
    outputInfo.toIndex = index;

    // 取配置数据
    content = content.slice(outputInfo.fromIndex, index);
    /*eslint-disable*/
    try {
        outputInfo.data = eval('(' + content + ')');  // jshint ignore:line
    }
    catch(ex){
        return null;
    }
    /*eslint-enable*/

    return outputInfo;
};
