

/**
 * 替换html内容中的标签属性值
 * 
 * @param {string} content 内容
 * @param {string} tag 标签名
 * @param {string} attribute 属性名
 * @param {function(string)} valueReplacer 值替换函数
 * @param {function(string)=} condition 是否符合替换条件，传入的string是tag的源串
 * 
 * @return {string} 
 */
module.exports = exports = function ( content, tag, attribute, valueReplacer, condition ) {
    var attrReg = new RegExp( '(' + attribute + ')=([\'"])([^\'"]+)\\2' );
    var tagReg = new RegExp( '<' + tag + '([^>]+)', 'g' );
    function replacer( match, attrStr ) {
        if ( typeof condition === 'function' && !condition( match.slice( 1 ) ) ) {
            return match;
        }

        return '<' + tag 
            + attrStr.replace( 
                attrReg, 
                function ( attr, attrName, start, value ) {
                    return attrName + '=' + start 
                        + valueReplacer( value )
                        + start;
                }
            );
    }

    return content.replace( tagReg, replacer );
};
