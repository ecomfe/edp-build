/**
 * @author leeight(liyubei@baidu.com)
 *         zengjialuo(zengjialuo@baidu.com)
 */

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
 * List -> Map
 * @param {Array.<string>} list
 * @return {Object}
 */
exports.list2map = function( list ) {
    var map = {};
    list.forEach(function( item ){
        map[ item ] = 1;
    });

    return map;
};

/**
 * List -> Pattern
 * @param {Array.<string>} list
 * @return {Array.<string>}
 */
exports.list2pattern = function( list ) {
    return list.map(function( item ){
        return '*.' + item;
    });
};

/**
 * 数组筛选
 * @param {Array.<*>} list 原数组
 * @param {Function} fn 若fn( item, index )返回true，则该item在返回的数组中
 * @return {Array.<*>} 返回的数组
 */
exports.grep = function( list, fn ) {
    var result = [];
    for (var i = 0; i < list.length; i++) {
        if ( fn( list[i], i ) ) {
            result.push(list[i]);
        } 
    }
    return result;
};












/* vim: set ts=4 sw=4 sts=4 tw=100: */
