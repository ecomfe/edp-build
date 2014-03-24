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

/**
 * @see {https://github.com/ecomfe/edp/issues/187}
 *
 * new MyProcessor({
 *   fileset: [
 *    'dep/** /*.js',
 *    '!dep/esui/** /extension/*.js',
 *    'dep/esui/** /extension/TableEdit.js'
 *   ]
 * })
 *
 * 1. 对于include的pattern来说，从allCandidates选择，然后放到结果的集合里面去
 * 2. 对于exclude的pattern来说，从结果的集合里面排除.
 *
 * @param {Array.<string>} patterns fileset的pattern.
 * @param {Array.<string>} allCandidates 所有的选项.
 */
exports.fileset = function( patterns, allCandidates) {
    var result = [];
    for ( var i = 0; i < patterns.length; i ++ ) {
        var pattern = patterns[ i ];
        if ( pattern[ 0 ] === '!' ) {
            pattern = pattern.substring( 1 );
            // exclude pattern
            var len = result.length;
            while( len -- ) {
                if ( edp.path.satisfy( result[ len ], pattern ) ) {
                    result.splice( len, 1 );
                }
            }
        }
        else {
            allCandidates.forEach(function( item ){
                if ( result.indexOf( item ) === -1 ) {
                    if ( edp.path.satisfy( item, pattern ) ) {
                        result.push( item );
                    }
                }
            });
        }
    }
};




















/* vim: set ts=4 sw=4 sts=4 tw=100: */
