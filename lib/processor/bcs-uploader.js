/**
 * @file 将文件上传至bcscdn的的构建处理器
 * @author zengjialuo[zengjialuo@gmail.com]
 */
var path = require( 'path' );
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
    options = edp.util.mix(
        {
            ak: null,
            sk: null,
            bucket: '',
            prefix: '',
            files: [ '*.js', '*.css', '*.less' ],
            concurrent: 5,
            maxSize: 10 * 1024 * 1024
        },
        options
    );

    AbstractProcessor.call( this, options );

    this.sdk = new bcs.BaiduCloudStorage( this.ak, this.sk, this.maxSize, false );
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

    if (!this.ak || !this.sk || !this.bucket) {
        edp.log.fatal(
            'Processor BcsUploader failed: You must set the  `ak` and `sk` and `bucket` params'
        );
        callback();
        return;
    }

    function uploadIterator( item, callback ) {
        var objectName = path.join( me.prefix, item.outputPath );
        var def = me.sdk.realUpload( item.data, me.bucket, objectName );

        var successHandler = function ( url ) {
            if ( typeof url === 'object') {
                callback( null, null );
            }
            else {
                callback( null, url );
            }
        };

        var failureHandler = function ( e ) {
            callback( null, null );
        };

        def.done( successHandler );
        def.fail( failureHandler );
    }

    var files = this.processFiles.filter(
        function ( item ) {
            return !!item.outputPath;
        }
    );
    var processStart = Date.now();

    async.mapLimit(
        files,
        this.concurrent,
        uploadIterator,
        function ( err, results ) {
            if ( err ) {
                // 理论上不会执行到这个分支
                edp.log.warn(err);
                callback();
                return;
            }

            var successNum = 0;
            var failureNum = 0;

            results.forEach(
                function ( url, index ) {
                    if ( url ) {
                        files[ index ].set( 'bcsUrl', url );
                        successNum ++;
                    }
                    else {
                        failureNum ++;
                    }
                }
            );

            if ( failureNum === 0 ) {
                edp.log.info( 'BCS upload success! (%s ms)', Date.now() - processStart );
            }
            else {
                edp.log.warn(
                    'BCS upload failed:%s, successed:%s',
                    failureNum,
                    successNum
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

