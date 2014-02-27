/***************************************************************************
 * 
 * Copyright (c) 2013 Baidu.com, Inc. All Rights Reserved
 * $Id$ 
 * 
 **************************************************************************/
 
 
 
/**
 * get-module-id.spec.js ~ 2013/09/28 21:34:49
 * @author leeight(liyubei@baidu.com)
 * @version $Revision$ 
 * @description 
 *  
 **/
var path = require( 'path' );
var edp = require( 'edp-core' );

var GetModuleId = require('../lib/util/get-module-id.js');
var GetModuleFile = edp.esl.getModuleFile;
var Project = path.resolve(__dirname, 'data', 'dummy-project');
var ConfigFile = path.resolve(Project, 'module.conf');

describe('get-module-id', function() {
    it('default', function() {
        var moduleFile = path.resolve(Project, 'src', 'foo.js');
        var moduleId = GetModuleId(moduleFile, ConfigFile);
        expect(moduleId).toEqual(['foo']);
        expect(GetModuleFile('foo', ConfigFile)).toEqual(moduleFile);
    });

    it('dep', function() {
        // 项目内的依赖
        var moduleFile = path.resolve(Project, 'dep', 'er', '3.0.2', 'src', 'View.js');
        var moduleId = GetModuleId(moduleFile, ConfigFile);
        expect(moduleId).toEqual(['er/View']);
        expect(GetModuleFile('er/View', ConfigFile)).toEqual(moduleFile);

        var mainModuleFile = path.resolve(Project, 'dep', 'er', '3.0.2', 'src', 'main.js');
        var mainModuleId = GetModuleId(mainModuleFile, ConfigFile);
        expect(mainModuleId).toEqual(['er']);
        expect(GetModuleFile('er', ConfigFile)).toEqual(mainModuleFile);
    });

    it('common dep', function() {
        // 多个项目见的公共依赖
        // data/base/io/1.0.0/src/File.js
        var ioModuleFile = path.resolve(Project, '..', 'base', 'io', '1.0.0', 'src', 'File.js');
        var ioModuleId = GetModuleId(ioModuleFile, ConfigFile);
        expect(ioModuleId).toEqual(['io/File']);
        expect(GetModuleFile('io/File', ConfigFile)).toEqual(ioModuleFile);

        // data/base/net/1.2.0/src/Http.js
        var netModuleFile = path.resolve(Project, '..', 'base', 'net', '1.2.0', 'src', 'Http.js');
        var netModuleId = GetModuleId(netModuleFile, ConfigFile);
        expect(netModuleId).toEqual(['net/Http']);
        expect(GetModuleFile('net/Http', ConfigFile)).toEqual(netModuleFile);

        var netMainModuleFile = path.resolve(Project, '..', 'base', 'net', '1.2.0', 'src', 'main.js');
        var netMainModuleId = GetModuleId(netMainModuleFile, ConfigFile);
        expect(netMainModuleId).toEqual(['net']);
        expect(GetModuleFile('net', ConfigFile)).toEqual(netMainModuleFile);
    });

    it('paths', function() {
        var moduleFile = path.resolve(Project, 'src', 'resource', 'css', 'base.css');
        var moduleId = GetModuleId(moduleFile, ConfigFile);
        expect(moduleId).toEqual(['css/base.css', 'resource/css/base.css']);
        // FIXME(??) expect(GetModuleFile('css/base.css', ConfigFile)).toEqual(moduleFile);

        var jsModuleFile = path.resolve(Project, 'src', 'resource', 'css', 'base.js');
        var jsModuleId = GetModuleId(jsModuleFile, ConfigFile);
        expect(jsModuleId).toEqual(['css/base', 'resource/css/base']);
        expect(GetModuleFile('css/base', ConfigFile)).toEqual(jsModuleFile);
    });

    it('edp-build/issues/30', function(){
        var moduleFile = path.resolve(Project, 'src', 'common', 'ecma', 'tpl.js');
        var moduleConfig = path.resolve(Project, 'issue-30-module.conf');
        var moduleIds = GetModuleId( moduleFile, moduleConfig );

        // 如果你好奇为啥多了一个'ecma/tpl'，其实我也很好奇，但是就是多了一个
        expect( moduleIds ).toEqual( [ 'tpl', 'ecma/tpl', 'common/ecma/tpl' ] );
    });
});




















/* vim: set ts=4 sw=4 sts=4 tw=100: */
