/**
 * @file 将文件上传至bcscdn的的构建处理器
 * @author zengjialuo[zengjialuo@gmail.com]
 */
var path = require('path');
var bcs = require('edpx-bcs/lib/sdk');
var edp = require('edp-core');
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
    options = edp.util.mix(
        {
            ak: null,
            sk: null,
            bucket: '',
            prefix: '',
            files: ['*.js', '*.css', '*.less'],
            concurrent: 10,
            maxSize: 10 * 1024 * 1024
        },
        options
   );

    AbstractProcessor.call(this, options);

    if (!this.ak || !this.sk || !this.bucket) {
        edp.log.fatal(
            'Processor BcsUploader: You must set the  `ak` and `sk` and `bucket` params'
        );
        
        // throw new Error('BcsUploader init failed');
    }

    this.sdk = new bcs.BaiduCloudStorage(this.ak, this.sk, this.maxSize, false);
}

BcsUploader.prototype = new AbstractProcessor();

/**
 * 处理器名称
 *
 * @type {string}
 */
BcsUploader.prototype.name = 'BcsUploader';


/**
 * 构建处理
 *
 * @param {FileInfo} file 文件信息对象
 * @param {ProcessContext} processContext 构建环境对象
 * @param {Function} callback 处理完成回调函数
 */
BcsUploader.prototype.process = function (file, processContext, callback) {
    var objectName = path.join(this.prefix, file.outputPath);
    var def = this.sdk.realUpload(file.data, this.bucket, objectName);


    function handler() {
        callback();
    }

    def.done(handler);
    def.fail(handler);
};

/**
 * @ignore
 */
module.exports = exports = BcsUploader;
