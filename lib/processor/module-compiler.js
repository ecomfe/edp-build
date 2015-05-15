/**
 * @file 模块编译的构建处理器
 * @author errorrik[errorrik@gmail.com]
 *         treelite[c.xinle@gmail.com]
 */
var util = require('util');

var edp = require('edp-core');
var debug = require('debug')('module-compiler');

var Reader = require('../reader');
var Module = require('../module');
var CompilerContext = require('../compiler-context');
var helper = require('../helper');

var AbstractProcessor = require('./abstract');

/**
 * 模块编译的构建处理器
 *
 * @constructor
 * @param {Object} options 初始化参数
 * @param {string} options.configFile 模块配置文件
 */
function ModuleCompiler(options) {
    AbstractProcessor.call(this, options);

    this.compilerContext;

    /**
     * @type {Object.<string, number>}
     */
    this.patchedFiles = {};

    /**
     * @type {Object.<string, number>}
     */
    this.processedFiles = {};
}
util.inherits(ModuleCompiler, AbstractProcessor);

/**
 * @type {Object}
 * @const
 */
ModuleCompiler.DEFAULT_OPTIONS = {
    name: 'ModuleCompiler',

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
    files: ['*.js']
};

/**
 * 判断处理器是否忽略文件
 *
 * @param {FileInfo} file 文件信息对象
 * @return {boolean}
 */
ModuleCompiler.prototype.isExclude = function (file) {
    var k = AbstractProcessor.prototype.isExclude.call(this, file);

    return k || file.extname !== 'js';
};

ModuleCompiler.prototype.beforeAll = function (processContext) {
    AbstractProcessor.prototype.beforeAll.call(this, processContext);

    var configFile = edp.path.resolve(processContext.baseDir, this.configFile);
    var config = require('../util/read-json-file')(configFile);

    var moduleCombineConfigs = config.combine || {};
    if (typeof this.getCombineConfig === 'function') {
        moduleCombineConfigs = this.getCombineConfig(moduleCombineConfigs) || moduleCombineConfigs;
    }

    var moduleMapConfigs = config.map || {};
    if (typeof this.getMapConfig === 'function') {
        moduleMapConfigs = this.getMapConfig(moduleMapConfigs) || moduleMapConfigs;
    }

    var reader = new Reader(processContext, configFile);
    this.compilerContext = new CompilerContext(processContext,
        configFile, reader, moduleCombineConfigs, moduleMapConfigs);
};

/**
 * 构建处理
 *
 * @param {FileInfo} file 文件信息对象
 * @param {ProcessContext} processContext 构建环境对象
 * @param {Function} callback 处理完成回调函数
 */
ModuleCompiler.prototype.process = function (file, processContext, callback) {
    if (file.get('is-combined')) {
        callback();
        return;
    }
    debug('file = %j', file.path);

    var module;
    var configFile = edp.path.resolve(processContext.baseDir, this.configFile);
    // [ packages, paths, baseUrl ]
    var moduleIds = helper.getModuleId(file.fullPath, configFile);
    if (moduleIds.length === 1) {
        module = new Module(moduleIds[0], this.compilerContext);
    }
    else if (moduleIds.length > 1) {
        // 因为配置了 paths 导致一个模块可能会出现多个 Id 存在的情况
        // 但是根据 Id 再重新计算 File Path 有可能会存在失败的情况
        // 所以我们过滤出成功的那个 Id
        moduleIds = moduleIds.filter(function (depId) {
            var depFile = edp.amd.getModuleFile(depId, configFile);
            var relativedFilePath = edp.path.relative(processContext.baseDir, depFile);
            return processContext.getFileByPath(relativedFilePath) != null;
        });
        if (moduleIds.length) {
            module = new Module(moduleIds[0], this.compilerContext);
        }
    }

    if (module) {
        var compiledCodes = module.toBundle();

        if (this.bizId) {
            this.patchedFiles[file.path] = 1;
        }

        file.set('is-combined', true);

        // 我们在这里不能直接调用 file.setData 因为会修改模块的内容
        // 从而可能会影响到其它模块的输出，应该等到处理完毕之后，在 afterAll 里面去处理.
        this.processedFiles[file.path] = 1;
        file.set('combined-code', compiledCodes);
    }

    callback();
};

/**
 * TODO 这个的实现并不是很完美，有不少的限制条件.
 *
 * 主要目的是给输出的代码的添加一个固定前缀的Id，例如：
 * src/ui/Button.js
 *   -> output/asset/ui/Button.js
 *      -> define('bat-ria/ui/Button', function(require, exports, module){ ... });
 * @param {ProcessContext} processContext The process context.
 */
ModuleCompiler.prototype.afterAll = function (processContext) {
    this._finalizeFileBody(processContext);
    this._prependBizId(processContext);
};

ModuleCompiler.prototype._finalizeFileBody = function (processContext) {
    for (var fp in this.processedFiles) {
        if (!this.processedFiles.hasOwnProperty(fp)) {
            continue;
        }
        var file = processContext.getFileByPath(fp);
        if (!file) {
            continue;
        }

        file.setData(file.get('combined-code'));
    }
};

ModuleCompiler.prototype._prependBizId = function (processContext) {
    if (!this.bizId) {
        return;
    }

    var bizId = this.bizId;
    for (var fp in this.patchedFiles) {
        if (!this.patchedFiles.hasOwnProperty(fp)) {
            continue;
        }

        var file = processContext.getFileByPath(fp);
        if (!file) {
            continue;
        }

        var ast = edp.amd.getAst(file.data);
        var moduleInfo = edp.amd.analyseModule(ast) || [];
        if (!Array.isArray(moduleInfo)) {
            moduleInfo = [moduleInfo];
        }
        if (!moduleInfo.length) {
            continue;
        }

        /*eslint-disable*/
        moduleInfo.forEach(function (m) {
            if (m.id) {
                m.id = bizId + '/' + m.id;
            }
        });
        /*eslint-enable*/

        var patchedCode = require('../util/generate-module-code')(
            moduleInfo, ast);
        file.setData(patchedCode);
    }
};

module.exports = exports = ModuleCompiler;
