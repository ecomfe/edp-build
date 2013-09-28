/***************************************************************************
 * 
 * Copyright (c) 2013 Baidu.com, Inc. All Rights Reserved
 * $Id$ 
 * 
 **************************************************************************/
 
 
 
/**
 * js-compressor.spec.js ~ 2013/09/28 19:39:59
 * @author leeight(liyubei@baidu.com)
 * @version $Revision$ 
 * @description 
 *  
 **/
var path = require('path');

var JsCompressor = require('../lib/processor/js-compressor.js');
var base = require('./base');


describe('js-compressor', function() {
    it("默认保留require, exports, module三个变量", function() {
        var processor = new JsCompressor();
        var filePath = path.join('data', 'js-compressor', 'default.js');
        var fileData = base.getFileInfo(filePath);
        processor.process(fileData, null, function() {
            expect(fileData.data).toBe('function main(){var require=0,exports=1,module=2,n=3;return require+exports+module+n}');
        });
    });

    it("支持设置mangleOptions", function() {
        var processor = new JsCompressor({
            mangleOptions: {
                except: ['require', 'foobar', 'callSuper']
            }
        });
        var filePath = path.join('data', 'js-compressor', '5.js');
        var fileData = base.getFileInfo(filePath);
        processor.process(fileData, null, function() {
            expect(fileData.data).toBe('function main(){function callSuper(){}var require=0,n=1,r=2,foobar=3;return callSuper(require+n+r+foobar)}');
        });
    });
});



















/* vim: set ts=4 sw=4 sts=4 tw=100: */
