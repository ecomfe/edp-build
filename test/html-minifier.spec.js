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

var expect = require('expect.js');

var HtmlMinifier = require('../lib/processor/html-minifier.js');
var base = require('./base');


describe('html-minifier', function() {

    it('支持设置removeComments', function(done) {
        var processor = new HtmlMinifier({
            minifyOptions: {
                removeComments: true
            }
        });
        var fileData = base.getFileInfo('data/dummy-project/issue-71.html', __dirname);
        processor.process(fileData, null, function() {
            expect(/commit-in-head/.test(fileData.data)).to.be(false);
            expect(/commit-in-body/.test(fileData.data)).to.be(false);
            expect(/commit-multiline/.test(fileData.data)).to.be(false);
            done();
        });
    });

    it('默认保留 ETPL 注释', function(done) {
        var processor = new HtmlMinifier({
            minifyOptions: {
                removeComments: true
            }
        });

        var fileData = base.getFileInfo('data/dummy-project/issue-71.html', __dirname);
        processor.process(fileData, null, function() {
            expect(/target\: hello/.test(fileData.data)).to.be(true);
            expect(/block\: header/.test(fileData.data)).to.be(true);
            expect(/block\: content/.test(fileData.data)).to.be(true);
            done();
        });
    });

    it('#108', function (done) {
        var processor = new HtmlMinifier();

        var fileData = base.getFileInfo('data/dummy-project/issue-108.html', __dirname);
        processor.process(fileData, null, function() {
            expect(fileData.data).to.be('<header class="ui-bar main-header<!-- if: !${pageTitle} --> default<!-- /if --><!-- if:${className} --> ${className}<!-- /if -->" data-ui="" data-viewport-bar="header" data-name="koubei"></header>');
            done();
        });

    });

});

