/**
 * @file 内联静态资源 处理器
 * @author wuhuiyao(sparklewhy@gmail.com)
 */

var util = require('util');
var inliner = require('inline-resource');
var AbstractProcessor = require('./abstract');

/**
 * 静态资源内联处理器
 *
 * @constructor
 * @param {Object} options 初始化参数
 */
function InlineProcessor(options) {
    AbstractProcessor.call(this, options);

    // inject custom process type tasks
    var customTask = this.customTask || {};
    Object.keys(customTask).forEach(function (type) {
        inliner.addInlineTaskFor(type, customTask[type]);
    });
}

util.inherits(InlineProcessor, AbstractProcessor);

InlineProcessor.DEFAULT_OPTIONS = {

    /**
     * 处理器名称
     *
     * @const
     * @type {string}
     */
    name: 'InlineProcessor',

    /**
     * 要处理的文件
     *
     * @type {Array}
     */
    files: ['*.css', '*.html', '*.tpl', '!dep/**/*'],

    /**
     * 内联选项，选项参考依赖的 `inline-resource` npm module
     *
     * @type {Object}
     */
    inlineOption: {},

    /**
     * 自定义的内联任务定义
     *
     * @type {Object}
     */
    customTask: {}
};

/**
 * 构建处理前的行为，选择要处理的文件
 *
 * @param {ProcessContext} processContext 构建环境对象
 * @override
 */
InlineProcessor.prototype.beforeAll = function (processContext) {
    AbstractProcessor.prototype.beforeAll.apply(this, arguments);

    var fileMap = this.fileMap = {};
    processContext.getFiles().forEach(function (item) {
        fileMap[item.outputPath] = item.data;
    });
};

/**
 * 构建处理
 *
 * @param {FileInfo} file 文件信息对象
 * @param {ProcessContext} processContext 构建环境对象
 * @param {Function} callback 处理完成回调函数
 */
InlineProcessor.prototype.process = function (file, processContext, callback) {
    var me = this;

    var opts = {
        files: [file],
        fileMap: this.fileMap
    };
    var customOpts = me.inlineOption || {};
    Object.keys(customOpts).forEach(function (key) {
        opts[key] = customOpts[key];
    });

    try {
        var result = inliner.inline(opts);
        file.data = result[0].data;
    }
    catch(ex) {
        me.log.error(ex.stack);
    }

    callback();
};

/**
 * 构建处理后的行为
 *
 * @param {ProcessContext} processContext 构建环境对象
 * @override
 */
InlineProcessor.prototype.afterAll = function (processContext) {
    AbstractProcessor.prototype.afterAll.apply(this, arguments);
    this.fileMap = null;
};

module.exports = exports = InlineProcessor;
