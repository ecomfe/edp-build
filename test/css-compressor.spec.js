/***************************************************************************
 *
 * Copyright (c) 2013 Baidu.com, Inc. All Rights Reserved
 * $Id$
 *
 **************************************************************************/



/**
 * css-compressor.spec.js ~ 2013/09/28 20:39:52
 * @author leeight(liyubei@baidu.com)
 * @version $Revision$
 * @description
 *
 **/
var path = require('path');

var CssCompressor = require('../lib/processor/css-compressor.js');
var base = require('./base');

describe('css-compressor', function() {
    it('default', function() {
        var processor = new CssCompressor({ compressOptions: { keepBreaks: false } });
        var fileData = base.getFileInfo('data/css-compressor/default.css', __dirname);
        processor.process(fileData, {baseDir:__dirname}, function() {
            expect(fileData.data).toBe(
                'div{color:red;background:url(/foo.png)}' +
                'a{text-decoration:none;background:url(bar.png)}' +
                'span{background:url(//www.baidu.com/img/logo.png)}');
        });
    });

    it('set `relativeTo`', function() {
        var processor = new CssCompressor({
            compressOptions: {
                relativeTo: __dirname,
                keepBreaks: false
            }
        });
        var fileData = base.getFileInfo('data/css-compressor/default.css', __dirname);
        processor.process(fileData, {baseDir: __dirname}, function() {
            expect(fileData.data).toBe(
                'div{color:red;background:url(/foo.png)}' +
                'a{text-decoration:none;background:url(bar.png)}' +
                'span{background:url(//www.baidu.com/img/logo.png)}');
        });
    });

});



















/* vim: set ts=4 sw=4 sts=4 tw=100: */
