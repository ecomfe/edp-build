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
 * @file replace-loader-config.js
 * @author leeight
 */

var edp = require('edp-core');
var escodegen = require('escodegen');

/**
 * 替换Loader配置信息
 *
 * @param {Object} configData 新的配置信息数据
 * @param {Object} info 原配置数据信息对象，通常为readLoaderConfig的返回值
 * @return {string}
 */
module.exports = exports = function (configData, info) {
    var ast = edp.amd.getAst('(' + JSON.stringify(configData) + ')');
    var code = escodegen.generate(ast, {
        format: {
            escapeless: true,
            indent: {
                style: '    ',
                base: info.indentBase
            }
        }
    });

    return info.content.slice(0, info.fromIndex)
        + code.replace(/(^\s*\(|\);$)/g, '')
        + info.content.slice(info.toIndex);
};
