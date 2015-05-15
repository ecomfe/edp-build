/**
 * @file 构建处理器抽象类
 * @author errorrik[errorrik@gmail.com]
 */
var os = require('os');
var util = require('util');

var async = require('async');
var edp = require('edp-core');
var u = require('underscore');

var helper = require('../helper');

var DEFAULT_OPTIONS = {
    /**
     * 默认是1，如果需要的话，可以调整这个数值.
     * @type {number}
     */
    parallel: os.cpus().length
};

/**
 * 构建处理器抽象类
 *
 * @abstract
 * @constructor
 * @param {Object} options 初始化参数
 */
function AbstractProcessor(options) {
    u.extend(this, DEFAULT_OPTIONS,
        this.constructor.DEFAULT_OPTIONS, options);

    /**
     * 打印调试信息
     */
    this.debug = require('debug')(this.constructor.name);

    /**
     * 日志打印
     * @type {function}
     */
    this.log = edp.log;

    /**
     * 要处理的文件集合.
     * @type {Array.<Object>}
     */
    this.processFiles;
}


/**
 * 判断处理器是否忽略文件
 *
 * @param {FileInfo} file 文件信息对象
 * @return {boolean}
 */
AbstractProcessor.prototype.isExclude = function (file) {
    var excludes = Array.isArray(this.exclude)
        ? this.exclude
        : [];

    return excludes.some(function (path) {
        return helper.satisfy(file.path, path);
    });
};

/**
 * 判断处理器是否包含文件。包含文件的优先级大于忽略文件
 *
 * @param {FileInfo} file 文件信息对象
 * @return {boolean} .
 */
AbstractProcessor.prototype.isInclude = function (file) {
    var includes = Array.isArray(this.include)
        ? this.include
        : [];

    return includes.some(function (path) {
        return helper.satisfy(file.path, path);
    });
};

/**
 * 构建处理入口
 *
 * @param {ProcessContext} processContext 构建环境对象
 * @param {Function} callback 处理完成回调函数
 */
AbstractProcessor.prototype.start = function (processContext, callback) {
    var processor = this;
    var start = Date.now();
    this.beforeAll(processContext);

    var dots = (os.platform() === 'darwin') ? '⋅⋅⋅' : '...';

    var me = this;
    this._beforeLog = '  (' + (Date.now() - start) + 'ms) ' + dots + ' ';
    edp.log.write(this._beforeLog);

    this.processAll(processContext, finishProcessAll);

    function finishProcessAll() {
        if (processor.afterAll !== AbstractProcessor.prototype.afterAll) {
            start = Date.now();
            processor.afterAll(processContext);
            edp.log.write('%s ' + dots + ' (%sms)', me._doneLog, Date.now() - start);
        }

        callback();
    }
};

/**
 * 构建处理前的行为，选择要处理的文件
 *
 * @param {ProcessContext} processContext 构建环境对象
 */
AbstractProcessor.prototype.beforeAll = function (processContext) {
    var processor = this;
    this.processFiles = Array.isArray(this.files)
        ? processContext.getFilesByPatterns(this.files)
        : processContext.getFiles().filter(
            function (file) {
                // processor处理文件
                // 如果一个文件属于exclude，并且不属于include，则跳过处理
                if (typeof processor.isExclude === 'function'
                    && processor.isExclude(file)
                    && (typeof processor.isInclude !== 'function'
                          || !processor.isInclude(file))) {
                    return false;
                }

                return true;
            }
       );
};

/**
 * 处理后所有文件
 *
 * @param {ProcessContext} processContext 构建环境对象
 * @param {Function} callback 处理完成回调函数
 */
AbstractProcessor.prototype.processAll = function (processContext, callback) {
    var processStart = Date.now();
    var processor = this;
    var beforeLog = processor._beforeLog;
    var fileCount = this.processFiles.length;
    var fileIndex = 0;

    async.eachLimit(this.processFiles, processor.parallel, function (file, next) {
        try {
            var start = Date.now();
            processor.process(file, processContext, function () {
                edp.log.write('%s[%s/%s]: %s (%sms)', beforeLog, ++fileIndex, fileCount,
                    file.path, Date.now() - start);
                setImmediate(next);
            });
        }
        catch (ex) {
            edp.log.warn('%s', ex);
            if (process.env.DEBUG === '*') {
                throw ex;
            }
            setImmediate(next);
        }
    }, function (err) {
        processor._doneLog = util.format('%s[%s/%s]: %s (%sms)', beforeLog,
            fileCount, fileCount, 'Process done', Date.now() - processStart);
        edp.log.write(processor._doneLog);
        callback(err);
    });
};


/**
 * 构建处理后的行为，默认啥都不干，特别的processor可以复写这个方法
 *
 * @param {ProcessContext} processContext 构建环境对象
 */
AbstractProcessor.prototype.afterAll = function (processContext) {};

/**
 * 构建处理单个文件
 *
 * @param {FileInfo} file 文件信息对象
 * @param {ProcessContext} processContext 构建环境对象
 * @param {Function} callback 处理完成回调函数
 */
AbstractProcessor.prototype.process = function (file, processContext, callback) {
    callback();
};

module.exports = exports = AbstractProcessor;
