/**
 * @file 返回css内容中，url地址的数组
 * @author duanlixin[duanlixin@gmail.com]
 * 
 * @param {string} content 内容
 * @return {array} url地址的数组
 */

module.exports = exports = function ( content ) {

    var urls = /url[\('"]?([^\'"\)]+)\)/g;
    var result = [];

    content.replace( urls, function ( match, url ) {
        result.push( url );
    } );
    
    return result;
};
