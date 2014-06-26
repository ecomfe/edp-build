/**
 * @file 将文件上传至bcscdn的的构建处理器
 * @author zengjialuo[zengjialuo@gmail.com]
 */
var bcs = require( 'edpx-bcs/lib/sdk' );
var async = require( 'async' );
var edp = require( 'edp-core' );
var AbstractProcessor = require( './abstract' );


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
function BcsUploader( options ) {
    this.files = [ '*.js', '*.css', '*.less' ];

    this.concurrent = 5;

    AbstractProcessor.call( this, options );

    this.maxSize = 10 * 1024 * 1024;
    this.autoUri = false;


    this.sdk = new bcs.BaiduCloudStorage( this.ak, this.sk, this.maxSize, this.autoUri );
}

BcsUploader.prototype = new AbstractProcessor();

/**
 * 处理器名称
 *
 * @type {string}
 */
BcsUploader.prototype.name = 'BcsUploader';


/**
 * 处理所有文件
 * 
 * @param {ProcessContext} processContext 构建环境对象
 * @param {Function} callback 处理完成回调函数
 */
 BcsUploader.prototype.processAll = function ( processContext, callback ) {
    var me = this;

    function uploadIterator( item, callback ) {
        var objectName = '/' + me.prefix + '/' + item.outputPath;
        var def = me.sdk.realUpload( item.data, me.bucket, objectName );

        var successHandler = function ( url ) {
            var success;
            if ( typeof url === 'object'
                && Array.isArray( url.success )
                && Array.isArray( url.failure )
            ) {
                success = false;
            } else {
                success = true;
            }

            callback(
                null,
                {
                    success: success,
                    item: item,
                    url: url
                }
            );
        };

        var failureHandler = function ( e ) {
            callback( 
                null,
                {
                    success: false,
                    item: item,
                    error: e
                }
            );
        };

        def.done( successHandler );
        def.fail( failureHandler );
    }

    var files = require( '../util/array' ).grep(
        this.processFiles,
        function ( item ) {
            return !!item.outputPath;
        }
    );
    var processStart = Date.now();

    async.mapLimit(
        files,
        this.concurrent,
        uploadIterator,
        function ( err, result ) {
            if ( err ) {
                // 理论上不会执行到这个分支
                edp.log.warn(err);
                callback();
                return;
            }

            var successNum = 0;
            var failureNum = 0;
            for (var i = 0, len = result.length; i < len; i++) {
                if ( result[i].success ) {
                    successNum ++;
                    
                    // just for test
                    result[i].item && result[i].item.set( 'bcsUrl', result[i].url );
                } else {
                    failureNum ++;
                }
            }

            if ( failureNum === 0 ) {
                edp.log.info( 'upload success! (%s ms)', Date.now() - processStart );
            } else {
                edp.log.warn(
                    'upload successed:%s, failed:%s',
                    successNum,
                    failureNum
                );
            }

            callback();
        }
    );
};

/**
 * @ignore
 */
module.exports = exports = BcsUploader;

