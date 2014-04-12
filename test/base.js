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

exports.getFileInfo = function (filePath, buildRoot) {
    var fullPath = path.resolve(buildRoot, filePath);
    var fileData = new FileInfo({
        data: fs.readFileSync(fullPath),
        extname: path.extname(fullPath).slice(1),
        path: filePath,
        fullPath: fullPath,
        stat: fs.statSync(fullPath),
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


    function nextProcessor() {
        if ( processorIndex >= processorCount ) {
            done();
            return;
        }

        var processor = processors[ processorIndex++ ];
        processor.start( processContext, nextProcessor );
    }

    nextProcessor();
};






















/* vim: set ts=4 sw=4 sts=4 tw=100: */
