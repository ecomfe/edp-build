/***************************************************************************
 *
 * Copyright (c) 2014 Baidu.com, Inc. All Rights Reserved
 * $Id$
 *
 **************************************************************************/



/**
 * add-copyright.spec.js ~ 2014/02/12 11:22:11
 * @author leeight(liyubei@baidu.com)
 * @version $Revision$
 * @description
 * 测试一下ModuleCompiler的功能是否正常
 **/
var path = require('path');

var base = require('./base');
var AddCopyright = require('../lib/processor/add-copyright.js');

var Project = path.resolve(__dirname, 'data', 'dummy-project');


describe('add-copyright', function(){
    it('default', function(){
        var processor = new AddCopyright();
        var fileData = base.getFileInfo('src/foo.js', Project);

        var processContext = { baseDir: Project };
        processor.process(fileData, processContext, function(){
            expect(fileData.data.indexOf('there is only copyleft left.\n')).toBe(0);
        });
    });
});



















/* vim: set ts=4 sw=4 sts=4 tw=100: */
