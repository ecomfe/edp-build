/***************************************************************************
 *
 * Copyright (c) 2014 Baidu.com, Inc. All Rights Reserved
 * $Id$
 *
 **************************************************************************/



/**
 * module-compiler.spec.js ~ 2014/02/12 11:22:11
 * @author leeight(liyubei@baidu.com)
 * @version $Revision$
 * @description
 * 测试一下ModuleCompiler的功能是否正常
 **/
var fs = require('fs');
var path = require('path');

var base = require('./base');
var AddCopyright = require('../lib/processor/add-copyright.js');

var Project = path.resolve(__dirname, 'data', 'dummy-project');
var ConfigFile = path.resolve(Project, 'module.conf');

var moduleEntries = 'html,htm,phtml,tpl,vm,js';
var pageEntries = 'html,htm,phtml,tpl,vm';


describe('module-compiler', function(){
    it('default', function(){
        var processor = new AddCopyright();
        var filePath = path.join(Project, 'src', 'foo.js');
        var fileData = base.getFileInfo(filePath);

        var processContext = { baseDir: Project }
        processor.process(fileData, processContext, function(){
            expect(fileData.data.indexOf('there is only copyleft left.\n')).toBe(0);
        });
    });
});



















/* vim: set ts=4 sw=4 sts=4 tw=100: */
