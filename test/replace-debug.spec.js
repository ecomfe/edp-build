/***************************************************************************
 *
 * Copyright (c) 2014 Baidu.com, Inc. All Rights Reserved
 * $Id$
 *
 **************************************************************************/



/**
 * replace-debug.spec.js ~ 2014/02/12 11:22:11
 * @author leeight(liyubei@baidu.com)
 * @version $Revision$
 * @description
 * 测试一下ModuleCompiler的功能是否正常
 **/
var path = require('path');

var base = require('./base');
var ReplaceDebug = require('../lib/processor/replace-debug.js');

var Project = path.resolve(__dirname, 'data', 'dummy-project');
// var ConfigFile = path.resolve(Project, 'module.conf');

// var moduleEntries = 'html,htm,phtml,tpl,vm,js';
// var pageEntries = 'html,htm,phtml,tpl,vm';


describe('replace-debug', function(){
    it('default', function(){
        var processor = new ReplaceDebug();
        var filePath = path.join(Project, 'index.html');
        var fileData = base.getFileInfo(filePath);

        var processContext = { baseDir: Project };
        processor.process(fileData, processContext, function(){
            expect(fileData.data.indexOf('window.DEBUG=false;')).not.toBe(-1);
        });
    });
});



















/* vim: set ts=4 sw=4 sts=4 tw=100: */
