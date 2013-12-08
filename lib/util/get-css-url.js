/**
 * 返回css内容中，url地址的数组
 * 
 * @param {string} content 内容
 * @return {array} 
 */
module.exports = exports = function ( content , valueReplacer ) {

    var urls = /url[\('"]?([^\'"\)]+)\)/g;
    var result = [];

    content.replace( urls, function( match, url ) {
        result.push( valueReplacer( url ) );
    } );
    
    return result;
};
