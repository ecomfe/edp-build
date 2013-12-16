/**
 * @file 返回html内容中，标签的属性值数组
 * @author duanlixin[duanlixin@gmail.com]
 * 
 * @param {string} content 内容
 * @param {string} tag 标签名
 * @param {string} attribute 属性名
 * @return {array} 标签的属性值数组
 */
module.exports = exports = function ( content , tag, attr ) {
    var replaceTagAttribute = require( './replace-tag-attribute' );
    var tagAttrs = [];

    replaceTagAttribute( content, tag, attr, function ( attr ) {
        tagAttrs.push( attr );
    } );
    
    return tagAttrs;
};