/***************************************************************************
 * 
 * Copyright (c) 2014 Baidu.com, Inc. All Rights Reserved
 * $Id$ 
 * 
 **************************************************************************/
 
 
 
/**
 * lib/util/array.js ~ 2014/03/20 13:28:20
 * @author leeight(liyubei@baidu.com)
 * @version $Revision$ 
 * @description 
 *  
 **/
var edp = require( 'edp-core' );

/**
 * 将一个可能是二维数组的数组拍扁，变成一维数组.
 * @param {Array.<*>} array 可能是二维或者一维数组.
 * @return {Array.<*>}
 */
exports.expand = function( array ) {
    var rv = [];
    for ( var i = 0; i < array.length; i ++ ) {
        if ( Array.isArray( array[ i ] ) ) {
            rv.push.apply( rv, exports.expand( array[ i ] ) );
        }
        else {
            rv.push( array[ i ] );
        }
    }

    return rv;
};

/**
 * 根据 minimatch 的 pattern 过滤出所需要的module ids，记得需要扩展 er/* 和 er/**的内容
 * @param {Array.<string>} allModules 所有的module id集合.
 * @param {Array.<string>} patterns 所有pattern的集合.
 */
exports.filterModuleIdsByPattern = function( allModules, patterns ) {
    var moduleIds = [];

    patterns.forEach(function( pattern ){
        if ( ({}).toString.call( pattern ) !== '[object String]' ){
            return;
        }

        var match = /([\w\-\.]+)\/\*\*?/.exec( pattern );
        if ( match ) {
            moduleIds.push( match[ 1 ] );
        }
        else if ( /^[\w\-\.\/]+$/.test( pattern ) ) {
            // 不是一个pattern，而是一个明确的id.
            moduleIds.push( pattern );
        }
    });

    var util = require( 'util' );
    var k = allModules.filter( function( depId ){
        for( var i = 0; i < patterns.length; i ++ ) {
            var pattern = patterns[ i ];
            if ( util.isRegExp( pattern ) ) {
                if ( pattern.test( depId ) ) {
                    return true;
                }
                else {
                    continue;
                }
            }
            else if ( edp.path.satisfy( depId, patterns[ i ] ) ) {
                return true;
            }
        }
        return false;
    });

    moduleIds.push.apply( moduleIds, k );

    return moduleIds;
};

















/* vim: set ts=4 sw=4 sts=4 tw=100: */
