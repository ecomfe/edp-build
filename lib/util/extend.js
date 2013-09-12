
/**
 * 对象属性扩展
 * 
 * @param {Object} target 扩展的目标对象
 * @param {...Object} obj 扩展源对象
 * @return {Object}
 */
module.exports = exports = function ( target ) {
    for ( var i = 1; i < arguments.length; i++ ) {
        var obj = arguments[ i ];

        if ( obj == null ) {
            break;
        }
        
        for ( var key in obj ) {
            if ( obj.hasOwnProperty( key ) ) {
                target[ key ] = obj[ key ];
            }
        }
    }

    return target;
};
