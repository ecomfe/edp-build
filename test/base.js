/***************************************************************************
 *
 * Copyright (c) 2013 Baidu.com, Inc. All Rights Reserved
 * $Id$
 *
 **************************************************************************/



/**
 * base.js ~ 2013/09/28 20:40:16
 * @author leeight(liyubei@baidu.com)
 * @version $Revision$
 * @description
 *
 **/
var path = require('path');
var fs = require('fs');

var FileInfo = require('../lib/file-info.js');
var JsCompressor = require('../lib/processor/js-compressor.js');

exports.getFileInfo = function(filePath) {
    var file = path.resolve(__dirname, filePath);
    var fileData = new FileInfo({
        data: fs.readFileSync(file),
        extname: path.extname(file).slice(1),
        path: filePath,
        fullPath: file,
        stat: fs.statSync(file),
        fileEncoding: 'utf-8'
    });
    return fileData;
};

exports.compressJavascript = function(data) {
    var processor = new JsCompressor();
    var compressedData = null;
    var fileData = {
        data: data,
        setData: function(z) {
            compressedData = z;
        },
        extname: 'dummy.js'
    };
    processor.process(fileData, null, function() {});

    return compressedData;
};

/**
 * 模拟调用相关的处理器，执行完毕之后掉用done回掉函数.
 * @param {Array.<Processor>} processors
 * @param {ProcessContext} processContext
 * @param {function} done 全部结束之后的回掉函数.
 */
exports.launchProcessors = function( processors, processContext, done ) {
    var processorIndex = 0;
    var processorCount = processors.length;


    function nextProcess() {
        if ( processorIndex >= processorCount ) {
            done();
            return;
        }

        var processor = processors[ processorIndex++ ];
        var files = processContext.getFiles().filter(function(file){
            // processor处理文件
            // 如果一个文件属于exclude，并且不属于include，则跳过处理
            if ( typeof processor.isExclude === 'function'
                 && processor.isExclude( file )
                 && ( typeof processor.isInclude !== 'function'
                      || !processor.isInclude( file )
                    )
            ) {
                return false;
            }

            return true;
        });

        var fileIndex = 0;
        var fileCount = files.length;

        nextFile();

        function nextFile() {
            if ( fileIndex >= fileCount ) {
                if ( typeof processor.done === 'function' ) {
                    processor.done(processContext);
                }

                nextProcess();
                return;
            }

            var file = files[ fileIndex++ ];

            // processor处理需要保证异步性，否则可能因为深层次的层级调用产生不期望的结果
            // 比如错误被n次调用前的try捕获到
            function processFinished() {
                setTimeout( nextFile, 1 );
            }

            processor.process(
                file,
                processContext,
                processFinished
            );
        }
    }

    nextProcess();
};






















/* vim: set ts=4 sw=4 sts=4 tw=100: */
