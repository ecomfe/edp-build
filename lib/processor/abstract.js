/**
 * @file 构建处理器抽象类
 * @author errorrik[errorrik@gmail.com]
 *         zengjialuo[zengjialuo@baidu.com]
 */

var async = require('async');
var edp = require('edp-core');

/**
 * 构建处理器抽象类
 *
 * @abstract
 * @constructor
 * @param {Object} options 初始化参数
 */
function AbstractProcessor(options) {
    for (var key in options) {
        this[key] = options[key];
    }
    this.log = edp.log;
}


/**
 * 判断处理器是否忽略文件
 *
 * @param {FileInfo} file 文件信息对象
 * @return {boolean} satisfy
 */
AbstractProcessor.prototype.isExclude = function (file) {
    var satisfy = false;
    var excludes = this.exclude instanceof Array
        ? this.exclude
        : [];

    excludes.forEach(
        function (path) {
            satisfy = satisfy || edp.path.satisfy(file.path, path, file.stat);
        }
    );

    return satisfy;
};

/**
 * 判断处理器是否包含文件。包含文件的优先级大于忽略文件
 *
 * @param {FileInfo} file 文件信息对象
 * @return {boolean} satisfy
 */
AbstractProcessor.prototype.isInclude = function (file) {
    var satisfy = false;
    var includes = this.include instanceof Array
        ? this.include
        : [];

    includes.forEach(
        function (path) {
            satisfy = satisfy || edp.path.satisfy(file.path, path, file.stat);
        }
    );

    return satisfy;
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

    var dots = (require('os').platform() === 'darwin') ? '⋅⋅⋅' : '...';

    var me = this;
    this._beforeLog = '  (' + (Date.now() - start) + 'ms) ' + dots + ' ';

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
                          || !processor.isInclude(file)
                        )
                ) {
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
    var files = this.processFiles;
    var fileIndex = 0;
    var fileCount = files.length;
    var processor = this;
    var processStart = Date.now();

    var me = this;
    var beforeLog = this._beforeLog;

    function process(file, callback) {
        var start = Date.now();
        processor.process(
            file,
            processContext,
            function () {
                // error param was ignored

                edp.log.write(
                    '%s[%s/%s]: %s (%sms)',
                    beforeLog,
                    ++fileIndex,
                    fileCount,
                    file.path,
                    Date.now() - start
                );
                callback();
            }
        );
    }

    function processFinished() {
        // error param was ignored

        me._doneLog = require('util').format('%s[%s/%s]: %s (%sms)',
            beforeLog, fileCount, fileCount, 'Process done',
            Date.now() - processStart);
        edp.log.write(me._doneLog);
        callback();
        return;
    }

    async.eachLimit(
        files,
        this.concurrent || 10,
        process,
        processFinished
    );
};


/**
 * 构建处理后的行为，默认啥都不干，特别的processor可以复写这个方法
 *
 * @virtual
 * @param {ProcessContext} processContext 构建环境对象
 */
AbstractProcessor.prototype.afterAll = function (processContext) {};

/**
 * 构建处理单个文件
 *
 * @virtual
 * @param {FileInfo} file 文件信息对象
 * @param {ProcessContext} processContext 构建环境对象
 * @param {Function} callback 处理完成回调函数
 */
AbstractProcessor.prototype.process = function (
    file,
    processContext,
    callback
) {
    // do nothing in abstract class
    callback();
};

module.exports = exports = AbstractProcessor;
