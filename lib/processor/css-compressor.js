/**
 * @file css压缩的构建处理器
 * @author errorrik[errorrik@gmail.com],
 *         firede[firede@firede.us],
 *         leeight[leeight@gmail.com]
 */
var util = require('util');
var path = require('path');

var u = require('underscore');
var edp = require('edp-core');

var AbstractProcessor = require('./abstract');
var helper = require('./helper');

/**
 * css压缩的构建处理器
 *
 * @constructor
 * @param {Object} options 初始化参数
 */
function CssCompressor(options) {
    AbstractProcessor.call(this, options);
}
util.inherits(CssCompressor, AbstractProcessor);

/**
 * @type {Object}
 * @const
 */
CssCompressor.DEFAULT_OPTIONS = {
    name: 'CssCompressor',
    files: ['*.css'],
    compressOptions: {}
};

/**
 * 构建处理
 *
 * @param {FileInfo} file 文件信息对象
 * @param {ProcessContext} processContext 构建环境对象
 * @param {Function} callback 处理完成回调函数
 */
CssCompressor.prototype.process = function (file, processContext, callback) {
    var options = u.extend({
        // 可能存在bug，因此禁用优化的功能.
        // https://github.com/ecomfe/edp/issues/190
        noAdvanced: true,
        advanced: false,
        aggressiveMerging: false,
        shorthandCompacting: false,
        compatibility: 'ie7',
        keepBreaks: true,
        relativeTo: path.dirname(file.fullPath)
    }, this.compressOptions);

    // do compress
    try {
        var result = helper.compressCss(file.data, options);
        if (result) {
            file.setData(result);
        }
    }
    catch (ex) {
        edp.log.fatal('Compress css failed, file = [%s], msg = [%s]',
            file.path, ex.toString());
    }
    finally {
        callback();
    }
};

module.exports = exports = CssCompressor;
