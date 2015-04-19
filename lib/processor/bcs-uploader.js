/**
 * @file 将文件上传至bcscdn的的构建处理器
 * @author zengjialuo[zengjialuo@gmail.com]
 *         leeight[leeight@gmail.com]
 */
var util = require('util');
var path = require('path');

var AbstractProcessor = require('./abstract');

/**
 * 上传bcs的processor
 *
 * @constructor
 * @param {Object} options 初始化参数
 * @param {!string} options.ak bcs.ak
 * @param {!string} options.sk bcs.sk
 * @param {!string} options.bucket bucket名
 * @param {Array.<string>=} options.files 要处理的文件，详细规则见文档
 * @param {number=} options.concurrent 上传并发数
 * @example
 * new BcsUploader({
 *     ak: 'ak',
 *     sk: 'sk',
 *     bucket: 'weigou-baidu-com',
 *     prefix: 'bcj-static/20140624',
 *     concurrent: 5,
 *     files: [
 *     ]
 * })
 */
function BcsUploader(options) {
    AbstractProcessor.call(this, options);
    this.parallel = this.concurrent;
}
util.inherits(BcsUploader, AbstractProcessor);

BcsUploader.DEFAULT_OPTIONS = {
    name: 'BcsUploader',
    ak: null,
    sk: null,
    bucket: '',
    prefix: '',
    files: ['*.js', '*.css', '*.less'],
    concurrent: 5,
    maxSize: 10 * 1024 * 1024
};

/**
 * 构建处理
 *
 * @param {FileInfo} file 文件信息对象
 * @param {ProcessContext} processContext 构建环境对象
 * @param {Function} callback 处理完成回调函数
 */
BcsUploader.prototype.process = function (file, processContext, callback) {
    if (!file.outputPath) {
        callback();
        return;
    }

    var bcs = require('edpx-bcs/lib/sdk');
    var sdk = new bcs.BaiduCloudStorage(this.ak, this.sk, this.maxSize, false);
    var objectName = path.join(this.prefix, file.outputPath);
    sdk.realUpload(file.data, this.bucket, objectName)
        .then(function (url) {
            file.set('bcsUrl', url);
            callback(null);
        })
        .fail(callback);
};

module.exports = exports = BcsUploader;
