/***************************************************************************
 *
 * Copyright (c) 2014 Baidu.com, Inc. All Rights Reserved
 * $Id$
 *
 **************************************************************************/



/**
 * compile-module-2.spec.js ~ 2014/03/20 16:56:49
 * @author leeight(liyubei@baidu.com)
 * @version $Revision$
 * @description
 *
 **/
var edp = require( 'edp-core' );
var fs = require('fs');
var path = require('path');

var compileModule = require('../lib/util/compile-module.js');

var Project = path.resolve(__dirname, 'data', 'dummy-project');
var ConfigFile = path.resolve(Project, 'module.conf');

describe('compile-module-2', function() {
    xit('default', function(){
        // include和exclude都使用pattern
        var moduleCode = compileModule(
            fs.readFileSync(path.resolve(Project, 'src', 'common', 'dummy.js'), 'utf-8'),
            'common/dummy',
            ConfigFile,
            {
                exclude: [ ],
                include: [ [ [ [ 'er', 'er/main' ] ] ] ]
            }
        );

        var ast = edp.amd.getAst( moduleCode );
        var moduleInfo = edp.amd.analyseModule( ast );
        var moduleIds = moduleInfo.map(function( info ){ return info.id || '<anonymous>'; });
        moduleIds.sort();
        expect( moduleIds ).toEqual( [ 'common/dummy', 'er', 'er/View', 'er/main', 'net/Http' ] );
    });

    xit('default 2', function(){
         // include和exclude都使用pattern
        var moduleCode = compileModule(
            fs.readFileSync(path.resolve(Project, 'src', 'common', 'dummy.js'), 'utf-8'),
            'common/dummy',
            ConfigFile,
            {
                exclude: [ '*' ],
                include: [ [ [ [ 'er', 'er/*' ] ] ] ]
            }
        );

        var ast = edp.amd.getAst( moduleCode );
        var moduleInfo = edp.amd.analyseModule( ast );

        if ( moduleInfo && !Array.isArray( moduleInfo ) ) {
            moduleInfo = [ moduleInfo ];
        }

        if ( moduleInfo ) {
            var moduleIds = moduleInfo.map(function( info ){ return info.id || '<anonymous>'; });
            moduleIds.sort();
            expect( moduleIds ).toEqual( [ 'common/dummy' ] );
        }
        else {
            expect( moduleCode ).toEqual( 'define(\'common/dummy\', {});' );
        }
    });

    xit('default 3', function(){
         // include和exclude都使用pattern
        var moduleCode = compileModule(
            fs.readFileSync(path.resolve(Project, 'src', 'common', 'dummy.js'), 'utf-8'),
            'common/dummy',
            ConfigFile,
            {
                files: [ 'er', '!*', 'er', 'er/*' ]
            }
        );

        var ast = edp.amd.getAst( moduleCode );
        var moduleInfo = edp.amd.analyseModule( ast );

        if ( moduleInfo && !Array.isArray( moduleInfo ) ) {
            moduleInfo = [ moduleInfo ];
        }

        if ( moduleInfo ) {
            var moduleIds = moduleInfo.map(function( info ){ return info.id || '<anonymous>'; });
            moduleIds.sort();
            expect( moduleIds ).toEqual( [ 'common/dummy', 'er', 'er/View', 'er/main', 'net/Http' ] );
        }
        else {
            expect( moduleCode ).toEqual( 'define(\'common/dummy\', {});' );
        }
    });

    xit('default 4', function(){
         // include和exclude都使用pattern
        var moduleCode = compileModule(
            fs.readFileSync(path.resolve(Project, 'src', 'common', 'dummy.js'), 'utf-8'),
            'common/dummy',
            ConfigFile,
            {
                files: [ '!*', 'er/*', 'er' ]
            }
        );

        var ast = edp.amd.getAst( moduleCode );
        var moduleInfo = edp.amd.analyseModule( ast );

        if ( moduleInfo && !Array.isArray( moduleInfo ) ) {
            moduleInfo = [ moduleInfo ];
        }

        if ( moduleInfo ) {
            var moduleIds = moduleInfo.map(function( info ){ return info.id || '<anonymous>'; });
            moduleIds.sort();
            expect( moduleIds ).toEqual( [ 'common/dummy', 'er', 'er/View', 'er/main', 'net/Http' ] );
        }
        else {
            expect( moduleCode ).toEqual( 'define(\'common/dummy\', {});' );
        }
    });

    it('default 5', function(){
        var moduleCode = compileModule(
            fs.readFileSync(path.resolve(Project, 'src', 'common', 'dummy.js'), 'utf-8'),
            'common/dummy',
            ConfigFile,
            {
                files: [ '~er', '!~er', '~net' ],
            }
        );

        var ast = edp.amd.getAst( moduleCode );
        var moduleInfo = edp.amd.analyseModule( ast );
        if ( !Array.isArray( moduleInfo ) ) {
            moduleInfo = [ moduleInfo ];
        }
        var moduleIds = moduleInfo.map(function( info ){ return info.id || '<anonymous>'; });
        moduleIds.sort();

        // 忽略了所有er的模块之后，就不存在net了，但是我们手工指定了
        expect( moduleIds ).toEqual( [ 'common/dummy', 'net/Http' ] );
    });

});




















/* vim: set ts=4 sw=4 sts=4 tw=100: */
