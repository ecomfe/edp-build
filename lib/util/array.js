/**
 * @author leeight(liyubei@baidu.com)
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










/* vim: set ts=4 sw=4 sts=4 tw=100: */
