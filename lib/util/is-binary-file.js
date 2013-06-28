


/**
 * 检查内容是否二进制内容（否则为文本内容）
 * 
 * @param {Buffer} buffer buffer对象
 * @return {boolean}
 */
module.exports = exports = function ( buffer ) {
    var hexString = buffer.toString( 
        'hex', 
        0, 
        Math.min( buffer.length, 4096 )
    );

    while ( 1 ) {
        var zzIndex = hexString.indexOf( '00' );
        if ( zzIndex < 0 ) {
            return false;
        }
        else if ( zzIndex % 2 === 0 ) {
            return true;
        }
        
        hexString = hexString.slice( zzIndex + 1 );
    }
}
