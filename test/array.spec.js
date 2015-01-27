/***************************************************************************
 *
 * Copyright (c) 2014 Baidu.com, Inc. All Rights Reserved
 * $Id$
 *
 **************************************************************************/



/**
 * test/array.spec.js ~ 2014/03/20 13:31:01
 * @author leeight(liyubei@baidu.com)
 * @version $Revision$
 * @description
 *
 **/
var edp = require( 'edp-core' );
var ArrayBase = require( '../lib/util/array' );

describe('array', function(){
    it('expand', function(){
        /* jshint ignore:start */
        var a = [, 1, '2', true, null, undefined, new Object() ];
        expect( ArrayBase.expand( a ) ).toEqual( a );

        var b = [, 1, '2', true, null, undefined, new Object(), [] ];
        expect( ArrayBase.expand( b ) ).toEqual( a );
        /* jshint ignore:end */

        var c = [ 1, 2, [ 3, 4 ], [ 5, [ 6, 7, [ [ 8 ] ] ] ] ];
        expect( ArrayBase.expand( c ) ).toEqual( [ 1, 2, 3, 4, 5, 6, 7, 8 ] );
    });

    it('getAllModules', function(){
        var moduleConfig = './data/dummy-project/module.conf';
        var allModules = edp.amd.getAllModules( moduleConfig );
        allModules.sort();

        expect( allModules.indexOf( 'etpl' ) ).not.toBe( -1 );
        expect( allModules.indexOf( 'etpl/main' ) ).not.toBe( -1 );
        expect( allModules.indexOf( 'etpl/tpl' ) ).not.toBe( -1 );
        expect( allModules.indexOf( 'net/Http' ) ).not.toBe( -1 );
        expect( allModules.indexOf( 'io/File' ) ).not.toBe( -1 );
    });
});




















/* vim: set ts=4 sw=4 sts=4 tw=100: */
