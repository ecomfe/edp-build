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
}

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
}






















/* vim: set ts=4 sw=4 sts=4 tw=100: */
