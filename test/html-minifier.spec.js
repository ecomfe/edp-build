/***************************************************************************
 *
 * Copyright (c) 2014 Baidu.com, Inc. All Rights Reserved
 * $Id$
 *
 **************************************************************************/



/**
 * html-minifier.spec.js ~ 2014/12/31 16:39:59
 * @author junmer(junmer@foxmail.com)
 * @version $Revision$
 * @description
 *
 **/

var HtmlMinifier = require('../lib/processor/html-minifier.js');
var base = require('./base');


describe('html-minifier', function() {

    it('支持设置removeComments', function() {
        var processor = new HtmlMinifier({
            minifyOptions: {
                removeComments: true
            }
        });
        var fileData = base.getFileInfo('data/dummy-project/issue-71.html', __dirname);
        processor.process(fileData, null, function() {

            expect(/commit-in-head/.test(fileData.data)).toBe(false);
            expect(/commit-in-body/.test(fileData.data)).toBe(false);
            expect(/commit-multiline/.test(fileData.data)).toBe(false);

        });
    });

    it('默认保留 ETPL 注释', function() {
        var processor = new HtmlMinifier({
            minifyOptions: {
                removeComments: true
            }
        });
        var fileData = base.getFileInfo('data/dummy-project/issue-71.html', __dirname);
        processor.process(fileData, null, function() {

            expect(/target\: hello/.test(fileData.data)).toBe(true);
            expect(/block\: header/.test(fileData.data)).toBe(true);
            expect(/block\: content/.test(fileData.data)).toBe(true);

        });
    });

});

