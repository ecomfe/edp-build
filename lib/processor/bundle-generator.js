/**
 * @file 生成require.config中的bundles配置构建器
 *
 *       ## 使用方法
 *
 *       首先，需要使用ModuleProcessor做合并模块。我们在处理的过程会依据ModuleProcessor所做的标识来判断是否已合并，未合并的不处理。
 *
 *       然后，需要在`require.config`的后边，添加一个插入标识，默认的是`<!--@bundle-->`
 *
 *       ## 效果
 *
 *       假设原码为：
 *
 *       ```html
 *       <script>
 *       require.config({ ... });
 *       </script>
 *       <!--@bundle-->
 *       ```
 *
 *       插入标识会被替换，效果为:
 *
 *       ```html
 *       <script>
 *       require.config({ ... });
 *       </script>
 *       <script>
 *       require.config({
 *           bundles: {
 *               xxx: [ ... ],
 *               yyy: [ ... ]
 *           }
 *       });
 *       </script>
 *       ```
 *
 * @author leon<leonlu@outlook.com>
 */

/* eslint-env node */

var edp = require('edp-core');
var fs = require('fs');
var path = require('path');

var AbstractProcessor = require('./abstract');

/**
 * 添加版权声明的构建器
 *
 * @constructor
 * @param {Object} options 初始化参数
 */
function BundleGenerator(options) {
    options = edp.util.mix(
        {
            files: ['*.html'],
            /**
             * @type {string}
             */
            configFile: 'module.conf',

            /**
             * 插入标识
             * @type {RegExp}
             */
            replace: /<!--@bundle-->/ig

        },
        options
    );
    AbstractProcessor.call(this, options);
    this.bundles = {};
    this.hasBundles = false;
}

BundleGenerator.prototype = new AbstractProcessor();

/**
 * 处理器名称
 *
 * @type {string}
 */
BundleGenerator.prototype.name = 'BundleGenerator';

/**
 * 在process前执行处理
 *
 * 我们在这里就要把所有的combine配置的模块做好分析
 *
 * @param {ProcessContext} context 构建上下文
 */
BundleGenerator.prototype.beforeAll = function (context) {

    AbstractProcessor.prototype.beforeAll.apply(this, arguments);

    var configFile = this.configFile;
    var config     = this.getConfig(context.baseDir, configFile);
    var combine    = config.combine || {};

    for (var moduleId in combine) {
        if (combine.hasOwnProperty(moduleId)) {
            var bundles = this.generate(context, moduleId, combine[moduleId]);
            if (bundles) {
                this.bundles[moduleId] = bundles;
            }
        }
    }

};

BundleGenerator.prototype.getConfig = function (base, configFile) {
    return require('../util/read-json-file')(edp.path.resolve(base, configFile));
};

/**
 * 生成bundle数据
 * @param  {ProcessContext} context 构建上下文
 * @param  {string}         id      模块id
 * @return {Array.string}   生成的一大堆依赖模块名
 */
BundleGenerator.prototype.generate = function (context, id) {

    var filePath = edp.amd.getModuleFile(id, this.configFile);
    var file = context.getFileByPath(path.relative(context.baseDir, filePath));

    if (!file) {
        edp.log.fatal('bundle module [' + id + '] not found.');
        return null;
    }

    if (!file.get('module-combined')) {
        edp.log.fatal('bundle file must be combined first.');
        return null;
    }

    var ast = edp.amd.getAst(file.data);

    if (!ast) {
        edp.log.fatal('cannot parse bundle module, maybe there is a syntax error.');
        return null;
    }

    var moduleInfo = edp.amd.analyseModule(ast);

    if (!moduleInfo) {
        edp.log.fatal('bundle file is not a amd module.');
        return null;
    }

    if (!(moduleInfo instanceof Array)) {
        edp.log.fatal('bundle file contain only one module so bundle is useless.');
        return null;
    }

    this.hasBundles = true;

    return moduleInfo.map(function (module) {
        return module.id;
    });

};

/**
 * 构建处理
 *
 * @param {FileInfo}       file     文件信息对象
 * @param {ProcessContext} context  构建环境对象
 * @param {Function}       callback 处理完成回调函数
 */
BundleGenerator.prototype.process = function (file, context, callback) {
    if (this.hasBundles) {
        file.data = file.data.replace(this.replace, this.transform());
    }
    callback && callback();
};

BundleGenerator.prototype.transform = function (modules) {
    return ''
        + '<script>'
        +    'require.config({'
        +        'bundles:' + JSON.stringify(this.bundles)
        +    '});'
        + '</script>';
};

module.exports = exports = BundleGenerator;
