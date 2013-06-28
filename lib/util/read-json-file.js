/**
 * 读取json文件
 * 
 * @param {string} file 文件路径
 * @return {Object} 
 */
module.exports = exports = function ( file ) {
    var fs = require( 'fs' );
    var content = fs.readFileSync( file, 'UTF-8' );
    if ( content.charCodeAt( 0 ) === 0xFEFF ) {
        content = content.slice( 1 );
    }

    return JSON.parse( content );
};
