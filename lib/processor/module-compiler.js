/**
 * @file 模块编译的构建处理器
 * @author errorrik[errorrik@gmail.com]
 *         treelite[c.xinle@gmail.com]
 */
var edp = require ('edp-core');

var AbstractProcessor = require('./abstract');
var Reader = require('../reader');
var Module = require('../module');
var CompilerContext = require('../compiler-context');

/**
 * 模块编译的构建处理器
 *
 * @constructor
 * @param {Object} options 初始化参数
 * @param {string} options.configFile 模块配置文件
 */
function ModuleCompiler(options) {
    options = edp.util.mix({
        /**
         * @type {string}
         */
        configFile: 'module.conf',

        /**
         * 最终输出代码的模块Id前缀
         * @type {string}
         */
        bizId: null,

        /**
         * 默认要处理的文件
         * @type {Array.<string>}
         */
        files: [ '*.js' ]
    }, options);

    AbstractProcessor.call(this, options);

    this.compilerContext;
}

ModuleCompiler.prototype = new AbstractProcessor();


/**
 * 处理器名称
 *
 * @type {string}
 */
ModuleCompiler.prototype.name = 'ModuleCompiler';

/**
 * 判断处理器是否忽略文件
 *
 * @param {FileInfo} file 文件信息对象
 */
ModuleCompiler.prototype.isExclude = function(file) {
    var k = AbstractProcessor.prototype.isExclude.call(this, file);

    return k || file.extname !== 'js';
};

ModuleCompiler.prototype.beforeAll = function(processContext) {
    AbstractProcessor.prototype.beforeAll.call(this, processContext);

    var configFile = edp.path.resolve(processContext.baseDir, this.configFile);
    var config = require('../util/read-json-file')(configFile);

    var bundleConfigs = config.combine || {};
    if (typeof this.getCombineConfig === 'function') {
        bundleConfigs = this.getCombineConfig(bundleConfigs) || {};
    }

    var reader = new Reader(processContext, configFile);
    this.compilerContext = new CompilerContext(processContext,
        configFile, reader, bundleConfigs);
};

/**
 * 构建处理
 *
 * @param {FileInfo} file 文件信息对象
 * @param {ProcessContext} processContext 构建环境对象
 * @param {Function} callback 处理完成回调函数
 */
ModuleCompiler.prototype.process = function (file, processContext, callback) {
    var configFile = edp.path.resolve(processContext.baseDir, this.configFile);
    // [ packages, paths, baseUrl ]
    var moduleIds = edp.amd.getModuleId(file.fullPath, configFile);
    if (moduleIds.length > 0) {
        var module = new Module(moduleIds[moduleIds.length - 1], this.compilerContext);
        var compiledCodes = module.toBundle();

        if (this.bizId) {
            file.setData(this._patchModuleId(compiledCodes));
        }
        else {
            file.setData(compiledCodes);
        }
    }

    callback();
};

/**
 * 主要目的是给输出的代码的添加一个固定前缀的Id，例如：
 * src/ui/Button.js
 *   -> output/asset/ui/Button.js
 *      -> define('bat-ria/ui/Button', function(require, exports, module){ ... });
 * @param {string} code 合并之后的代码.
 */
ModuleCompiler.prototype._patchModuleId = function(code) {
    var bizId = this.bizId;

    var ast = edp.amd.getAst(code);
    var moduleInfo = edp.amd.analyseModule(ast);
    if (Array.isArray(moduleInfo)) {
        moduleInfo.forEach(function(m) {
            if (m.id) {
                m.id = bizId + '/' + m.id;
            }
        });
    }
    else if (moduleInfo.id) {
        moduleInfo.id = bizId + '/' + moduleInfo.id;
    }

    var patchedCode = require('../util/generate-module-code')(
        moduleInfo, ast);

    return patchedCode;
};

module.exports = exports = ModuleCompiler;
