/**
 * 从内容中读取require的id信息
 * 
 * @param {string} content 内容
 * @return {Object}
 */
module.exports = exports = function ( content ) {
    var index = content.search( /(require\s*\(\s*\[)/ );
    if ( index < 0 ) {
        return;
    }
    index += RegExp.$1.length - 1;

    var len = content.length;
    var braceLevel = 0;
    var fromIndex = index;
    do {
        switch ( content[ index ] ) {
            case '[': 
                braceLevel++;
                break;
            case ']':
                braceLevel--;
                break;
        }

        index++;
    } while ( braceLevel && index < len );
    var toIndex = index;

    content = content.slice( fromIndex, index );
    return eval( '(' + content + ')' );
}