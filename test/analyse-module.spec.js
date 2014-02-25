/***************************************************************************
 * 
 * Copyright (c) 2014 Baidu.com, Inc. All Rights Reserved
 * $Id$ 
 * 
 **************************************************************************/
 
 
 
/**
 * analyse-module.spec.js ~ 2014/02/11 11:26:16
 * @author leeight(liyubei@baidu.com)
 * @version $Revision$ 
 * @description 
 * 测试分析模块的功能
 **/
var fs = require('fs');
var path = require('path');

var base = require('./base');
var Project = path.resolve(__dirname, 'data', 'dummy-project');
var AnalyseModyle = require('../lib/util/analyse-module.js');

function getModuleInfo(name) {
    var code = fs.readFileSync(path.resolve(Project, 'src', name), 'utf-8');
    var ast = require('esprima').parse(code);
    var moduleInfo = AnalyseModyle(ast);

    return moduleInfo;
}

describe('analyse-module', function() {
    it('foo should pass', function(){
        var moduleInfo = getModuleInfo('foo.js');
        expect(moduleInfo.id).toEqual(undefined);
        expect(moduleInfo != null).toEqual(true);
    })

    it('src/common/main.js should pass', function(){
        var moduleInfo = getModuleInfo('common/main.js');
        expect( moduleInfo ).not.toBe( null );
    });

    it('case1 should pass', function(){
        var moduleInfo = getModuleInfo('case1.js');
        expect(moduleInfo.id).toEqual('case1');
        expect(moduleInfo.dependencies).toEqual(['foo', 'tpl!./tpl/123.html']);
        expect( moduleInfo.actualDependencies ).not.toBe( null );
        expect( moduleInfo.actualDependencies[0] ).toBe( 'foo' );
        expect( moduleInfo.actualDependencies[1] ).toBe( 'tpl!./tpl/123.html' );
        expect( moduleInfo.actualDependencies[2] ).toBe( 'tpl!./tpl/list.tpl.html' );
    });

    it('etpl should pass', function(){
        var moduleInfo = getModuleInfo('etpl-2.0.8.js');
        expect(moduleInfo).toEqual(null);
    });
});




















/* vim: set ts=4 sw=4 sts=4 tw=100: */
