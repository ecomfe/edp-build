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
 * @file get-package-info.js
 * @author leeight
 */

/**
 * 获取模块id所属的package信息
 *
 * @param {string} moduleId 模块id
 * @param {string} moduleConfigFile 模块配置文件
 * @return {Object}
 */
module.exports = exports = function (moduleId, moduleConfigFile) {
    var moduleConfig = require('./read-json-file')(moduleConfigFile);
    var packages = moduleConfig.packages || [];
    for (var i = 0; i < packages.length; i++) {
        var pkg = packages[i];
        var pkgName = pkg.name;
        var pkgMain = pkg.main || 'main';

        if (moduleId === pkgName) {
            return {
                name: pkgName,
                location: pkg.location,
                main: pkgMain,
                module: pkgName + '/' + pkgMain
            };
        }
    }

    return null;
};
