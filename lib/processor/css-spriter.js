/**
 * @file css sprite 构建处理器
 * @author quyatong[quyatong@126.com]
 *         leeight[leeight@gmail.com]
 */

var fs = require('fs');
var path = require('path');
var util = require('util');

var debug = require('debug')('css-spriter');
// 按需加载
var cssSpriter;

var FileInfo = require('../file-info');
var AbstractProcessor = require('./abstract');

/**
 * css sprite的构建处理器
 *
 * @constructor
 * @param {Object} options 初始化参数
 */
function CssSpriter(options) {
    AbstractProcessor.call(this, options);
}
util.inherits(CssSpriter, AbstractProcessor);

CssSpriter.DEFAULT_OPTIONS = {
    name: 'CssSpriter',
    files: []
};

/**
 * 构建处理
 *
 * @param {FileInfo} file 文件信息对象
 * @param {ProcessContext} processContext 构建环境对象
 * @param {Function} callback 处理完成回调函数
 */
CssSpriter.prototype.process = function (file, processContext, callback) {
    cssSpriter = cssSpriter || require('css-spriter');
    cssSpriter.cssDataSpriter(file.data, file.fullPath)
        .then(function (data) {
            var baseDir = processContext.baseDir;
            var imgFilePath = data.imgFilePath;

            processContext.addFile(new FileInfo({
                data: fs.readFileSync(imgFilePath),
                extname: 'png',
                path: path.relative(baseDir, imgFilePath),
                outputPath: path.relative(baseDir, imgFilePath),
                fullPath: imgFilePath
            }));

            debug('img path = %j', imgFilePath);
            debug('css data = %j', data.cssData);

            fs.unlinkSync(imgFilePath);
            file.setData(data.cssData);
        })
        .finally(callback);
};

module.exports = exports = CssSpriter;
