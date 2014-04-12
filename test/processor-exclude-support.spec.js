/***************************************************************************
 *
 * Copyright (c) 2014 Baidu.com, Inc. All Rights Reserved
 * $Id$
 *
 **************************************************************************/



/**
 * processor-exclude-support.spec.js ~ 2014/02/25 15:19:06
 * @author leeight(liyubei@baidu.com)
 * @version $Revision$
 * @description
 * 检查processor是否支持exclude和include
 * 主要检查的问题是，继承了AbstractProcessor之后，重写isExclude方法的时候，
 * 忘记调用superClass的方法去检查exclude属性了
 **/
var path = require( 'path' );
var fs = require( 'fs' );

var base = require('./base');

var ctors = [];

fs.readdirSync( '../lib/processor' ).forEach( function( file ) {
    if ( /\.js$/.test( file ) ) {
        ctors.push( [ path.basename( file ), require( '../lib/processor/' + file ) ] );
    }
} );

describe('processor-exclude-support', function(){
    it('default', function(){
        var fileData = base.getFileInfo('data/css-compressor/default.css', __dirname);
        ctors.forEach(function(item){
            var Ctor = item[1];
            var instance = new Ctor({
                exclude: [ '*' ],
                include: [ 'default.css' ]
            });
            expect( instance.isExclude( fileData ) ).toBe( true );
            expect( instance.isInclude( fileData ) ).toBe( true );
        });
    });
});




















/* vim: set ts=4 sw=4 sts=4 tw=100: */
